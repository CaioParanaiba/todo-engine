#!/usr/bin/env python3
"""Hunter.todo · servidor local do jogo. Só a biblioteca padrão do Python 3.8+ (Linux, Windows e Mac).

Uso:  python3 servidor.py [--porta 8642] [--dados PASTA] [--sem-navegador] [--instalar | --desinstalar]

Serve a página do jogo (web/) em http://127.0.0.1:PORTA/ e grava os dados do jogador numa pasta separada do código
(padrão ~/.hunter-todo/, ou a variável HUNTER_DADOS). Atualizar o código (git pull ou ZIP novo) nunca mexe nela:
  todo.txt, done.txt        tarefas no formato todo.txt (as concluídas de dias anteriores vão para o done.txt);
                            quem já tem um todo.txt em outra pasta usa --todo PASTA (ou HUNTER_TODO) e o jogo lê e grava lá
  jogador.json              nome, tags, hábitos, disciplinas e Codeforces (o assistente da primeira entrada grava)
  avaliacoes.txt, notas.txt plano de avaliação das disciplinas e notas lançadas
  estado.json               loja, carteira, o que está equipado e os prêmios reais do jogador
  ajustes.txt, narradas.json caixa de entrada e cartas narradas (opcionais)
  conquistas.json           conquistas criadas pela IA (200 em diante) e o que foi resgatado
  planos/                   planos de ensino (PDF, HTML...) que a IA lê
  avatares/*.png            fotos de perfil extras
  cf.json                   cache do Codeforces (problemas aceitos por dia e os marcados à mão)

Rotas (as mesmas que web/demo.js simula no modo demonstração):
  GET  /api/jogo                          tudo o que a página precisa
  GET  /api/backup                        ZIP da pasta de dados (botão "baixar meus dados" na aba Configurações)
  POST /api/act   {raw, action, value?}   done | reopen | delete | up | down | d1 | d7 | a1 | hoje | amanha | rmdue | setdate | edit
  POST /api/add   {text}                  linha no formato todo.txt; due:hoje|amanha|+N|DD/MM|AAAA-MM-DD
  POST /api/undo  {}                      desfaz a última operação deste servidor
  POST /api/config {jogador, avaliacoes?} grava jogador.json (e avaliacoes.txt) e refaz os hábitos de hoje
  POST /api/ontem {id}                    "esqueci de marcar ontem": grava o hábito no done.txt como feito ontem
  POST /api/denovo {id}                   "fiz de novo": hábito semanal com a meta cumprida, feito mais uma vez hoje
  POST /api/autostart {ligar}             liga ou desliga o início junto com o computador
  POST /api/jogo/narrada {carta}         carta narrada colada da IA (aba Book) em narradas.json
  POST /api/jogo/planos {avaliacoes, notas} editor do chefão: grava os dois arquivos (o anterior fica em .bak)
  POST /api/jogo/nota {disc, aval, nota, parcial?} · /api/jogo/ajuste {texto} ou {quando, texto, aplicado} · /api/jogo/estado {estado}
  POST /api/cf/mao {menos?}               +1 problema do Codeforces hoje, marcado à mão (ITMO, grupo privado); menos = desfaz
  GET  /api/ia                            agentes de terminal achados, a escolha do jogador e os planos de ensino da pasta planos/
  POST /api/ia/config {agente?, cartas?}  liga a IA (claude | codex | gemini) ou volta ao copiar e colar (chat)
  POST /api/ia/rodar {pedido, anexo?, leve?} roda o agente com o pedido da página → {id}; GET /api/ia/rodar?id= até ficar pronto
  POST /api/ia/plano {nome, base64}       guarda um plano de ensino em planos/
  POST /api/conquistas {acao, ...}        conquistas da IA: criar {itens} | resgatar {no, como, j|k} | descartar {no}
  GET  /api/atualizacao[?agora]           versão instalada e as mais novas publicadas no GitHub (confere a cada 6 h; ?agora = na hora)
  POST /api/atualizar {}                  baixa a versão nova (git pull ou ZIP do GitHub) e reinicia o servidor

Todo dia o servidor cria as recorrentes de hoje (um hábito por linha, rec:ID:DATA, e a do Codeforces se houver handle),
tira as que ficaram abertas de dias anteriores e conclui sozinho a do Codeforces quando a meta do dia é batida. Se a meta foi
batida num dia em que o jogo ficou fechado, o bônus é creditado depois, no done.txt (só a partir do dia em que o handle foi ligado).

Iniciar com o computador (opcional): serviço do usuário no systemd (Linux; sem systemd, ~/.config/autostart), atalho .vbs na
pasta Inicializar (Windows) ou LaunchAgent (Mac). O servidor de segundo plano roda com --fundo e grava o log em servidor.log.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
import webbrowser
import zipfile
from datetime import date, timedelta
from io import BytesIO
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

VERSAO = "0.5"
VERSAO_NOME = "atualização das conquistas"   # nome da série 0.5 (aparece em Configurações → servidor)
REPO = Path(__file__).resolve().parent
WEB = REPO / "web"
DADOS = Path()   # definido em main()
TODO_DIR = Path()   # pasta do todo.txt e do done.txt: a de dados, ou a do --todo
lock = threading.RLock()
undo_stack = []


class Erro(Exception):
    def __init__(self, msg, code=400):
        super().__init__(msg)
        self.code = code


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


# ---------- arquivos ----------
def caminho(nome):
    return (TODO_DIR if nome in ("todo.txt", "done.txt") else DADOS) / nome


def ler_txt(nome):
    f = caminho(nome)
    return f.read_text(encoding="utf-8") if f.exists() else ""


def gravar_txt(nome, texto):
    """Grava num .tmp e troca de uma vez: um corte de energia nunca deixa o arquivo pela metade."""
    f = caminho(nome)
    tmp = f.with_name(f.name + ".tmp")
    tmp.write_text(texto, encoding="utf-8")
    os.replace(tmp, f)


def ler_json(nome, padrao):
    try:
        v = json.loads(ler_txt(nome) or "null")
    except ValueError:
        log(f"{nome} inválido; usando o padrão")
        return padrao
    return padrao if v is None else v


def gravar_json(nome, obj):
    gravar_txt(nome, json.dumps(obj, ensure_ascii=False, indent=1) + "\n")


def ler(nome="todo.txt"):
    t = ler_txt(nome)
    linhas = t.replace("\r\n", "\n").split("\n")
    if linhas[-1] != "":
        linhas.append("")
    return linhas


def gravar(linhas, nome="todo.txt"):
    gravar_txt(nome, "\n".join(linhas))


def inserir(linhas, nova):
    """Acrescenta antes da linha vazia final do todo.txt."""
    if linhas and linhas[-1] == "":
        linhas.insert(len(linhas) - 1, nova)
    else:
        linhas.append(nova)


# ---------- regras do todo.txt (as mesmas do painel do autor) ----------
PRI = re.compile(r"^\(([A-Z])\) ")
DONE_RE = re.compile(r"^x (\d{4}-\d{2}-\d{2}) ")
DUE = re.compile(r"(?:(?<=\s)|^)due:(\d{4}-\d{2}-\d{2})(?=\s|$)")
REC = re.compile(r"(?:(?<=\s)|^)rec:([\w-]+):(\d{4}-\d{2}-\d{2})(?=\s|$)")
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ORDEM = ["A", "B", "C", None]


def hoje():
    return date.today()


def parse_data(s):
    s = s.strip().lower()
    if s == "hoje":
        return hoje()
    if s in ("amanha", "amanhã"):
        return hoje() + timedelta(days=1)
    m = re.fullmatch(r"\+(\d{1,3})d?", s)
    if m:
        return hoje() + timedelta(days=int(m.group(1)))
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})(?:/(\d{2}|\d{4}))?", s)   # dd/mm[/aaaa], ou mm/dd[/aaaa] se o jogador escolheu
    if m:
        ano = m.group(3)
        dia, mes = (m.group(2), m.group(1)) if jogador().get("datas") == "mdy" else (m.group(1), m.group(2))
        try:
            d = date(int(ano if len(ano or "") == 4 else "20" + ano) if ano else hoje().year, int(mes), int(dia))
        except ValueError:
            return None
        return d if ano or d >= hoje() - timedelta(days=30) else d.replace(year=d.year + 1)
    if ISO.match(s):
        try:
            return date.fromisoformat(s)
        except ValueError:
            return None
    return None


def set_due(line, d):
    if d is None:
        return re.sub(r"\s+due:\d{4}-\d{2}-\d{2}(?=\s|$)", "", line, count=1)
    if DUE.search(line):
        return DUE.sub(f"due:{d.isoformat()}", line, count=1)
    return f"{line} due:{d.isoformat()}"


def set_pri(line, letra):
    base = PRI.sub("", line)
    return f"({letra}) {base}" if letra else base


def limpa(texto):
    texto = " ".join(str(texto).split())
    if not texto or len(texto) > 400 or any(ord(c) < 32 for c in texto):
        raise Erro("texto vazio ou inválido")
    return texto


def transformar(line, action, value=None):
    feita = bool(DONE_RE.match(line))
    if action == "done":
        if feita:
            raise Erro("a tarefa já está concluída")
        return f"x {hoje().isoformat()} {PRI.sub('', line)}"
    if action == "reopen":
        if not feita:
            raise Erro("a tarefa não está concluída")
        return DONE_RE.sub("", line, count=1)
    if feita:
        raise Erro("tarefa concluída: reabra antes de alterar")
    if action == "edit":
        m = re.match(r"^(\([A-Z]\) )?(\d{4}-\d{2}-\d{2} )?", line)
        return (m.group(1) or "") + (m.group(2) or "") + " ".join(normaliza_due(limpa(value or "").split()))
    if action in ("up", "down"):
        m = PRI.match(line)
        i = ORDEM.index(m.group(1)) if m and m.group(1) in ORDEM else len(ORDEM) - 1   # (D) em diante conta como sem prioridade
        j = i - 1 if action == "up" else i + 1
        if j < 0 or j >= len(ORDEM):
            raise Erro("prioridade já está no limite")
        return set_pri(line, ORDEM[j])
    m = DUE.search(line)
    base = date.fromisoformat(m.group(1)) if m else hoje()
    if action == "d1":
        return set_due(line, max(base, hoje()) + timedelta(days=1))
    if action == "d7":
        return set_due(line, base + timedelta(days=7))
    if action == "a1":
        return set_due(line, base - timedelta(days=1))
    if action == "hoje":
        return set_due(line, hoje())
    if action == "amanha":
        return set_due(line, hoje() + timedelta(days=1))
    if action == "rmdue":
        return set_due(line, None)
    if action == "setdate":
        d = parse_data(str(value or ""))
        if d is None:
            raise Erro("data inválida")
        return set_due(line, d)
    raise Erro("ação desconhecida")


def normaliza_due(palavras):
    """due:hoje, due:+3, due:09/10 ou due:09/10/2026 -> due:AAAA-MM-DD (no arquivo a data fica sempre no formato do todo.txt)."""
    out = []
    for w in palavras:
        d = re.fullmatch(r"due:(\S+)", w, re.I)
        if d:
            dt = parse_data(d.group(1))
            if dt is None:
                raise Erro(f"data inválida em {w}")
            w = f"due:{dt.isoformat()}"
        out.append(w)
    return out


def montar(texto):
    """Texto digitado -> linha do todo.txt (prioridade, data de criação, resto com due normalizado)."""
    texto = limpa(texto)
    m = re.match(r"^\(([A-Za-z])\)\s+", texto)
    pri = m.group(1).upper() if m else None
    if m:
        texto = texto[m.end():]
    palavras = normaliza_due(texto.split())
    if not palavras or palavras[0] == "x":
        raise Erro("texto vazio ou inválido")
    return (f"({pri}) " if pri else "") + hoje().isoformat() + " " + " ".join(palavras)


def operar(fn):
    """Roda fn(linhas) -> (antes, depois) sob o lock, grava e guarda para o desfazer."""
    with lock:
        linhas = ler()
        antes, depois = fn(linhas)
        gravar(linhas)
        undo_stack.append({"from": antes, "to": depois})
        del undo_stack[:-40]
        return {"ok": True, "from": antes, "to": depois, "undo": len(undo_stack)}


def achar(linhas, raw):
    if not isinstance(raw, str) or not raw.strip():
        raise Erro("linha ausente")
    if raw not in linhas:
        raise Erro("a linha mudou no todo.txt; recarregue a página", 409)
    return linhas.index(raw)


def api_act(d):
    def fn(linhas):
        i = achar(linhas, d.get("raw"))
        if d.get("action") == "delete":
            return linhas.pop(i), None
        nova = transformar(linhas[i], str(d.get("action")), d.get("value"))
        antes, linhas[i] = linhas[i], nova
        return antes, nova
    return operar(fn)


def api_add(d):
    def fn(linhas):
        nova = montar(d.get("text", ""))
        inserir(linhas, nova)
        return None, nova
    return operar(fn)


def api_undo(_):
    with lock:
        if not undo_stack:
            raise Erro("nada para desfazer")
        op = undo_stack[-1]
        arq = op.get("arq", "todo.txt")
        linhas = ler(arq)
        if op["to"] is None:   # desfaz uma exclusão: a linha volta para o fim do arquivo
            if op["from"] in linhas:
                raise Erro(f"a linha já existe no {arq}; não deu para desfazer", 409)
            inserir(linhas, op["from"])
        else:
            if op["to"] not in linhas:
                raise Erro("a linha mudou depois da operação; não deu para desfazer", 409)
            i = linhas.index(op["to"])
            if op["from"] is None:
                del linhas[i]
            else:
                linhas[i] = op["from"]
        undo_stack.pop()
        gravar(linhas, arq)
        return {"ok": True, "undo": len(undo_stack)}


# ---------- jogador e recorrentes do dia ----------
JOGADOR_PADRAO = {"configurado": False, "tags": {}, "habitos": [], "cf": None}
ID_HAB = re.compile(r"^[a-z0-9][a-z0-9-]{0,40}$")
HANDLE = re.compile(r"^[A-Za-z0-9_.-]{1,40}$")


def jogador():
    j = ler_json("jogador.json", None)
    return j if isinstance(j, dict) else dict(JOGADOR_PADRAO)


def tag_habito(j):
    t = str((j.get("tags") or {}).get("hab") or "").split()
    return t[0] if t and t[0][0] in "+@" else "+rotina"


def habitos(j):
    """Hábitos válidos do jogador. "semana": N (1 a 6) = N vezes por semana; sem ele, todo dia."""
    out = []
    for h in j.get("habitos") or []:
        if isinstance(h, dict) and ID_HAB.match(str(h.get("id", ""))) and str(h.get("n", "")).strip():
            try:
                n = int(h.get("semana") or 0)
            except (TypeError, ValueError):
                n = 0
            out.append({"id": h["id"], "n": h["n"], "semana": n if 1 <= n <= 6 else 0})
    return out


def cf_conf(j):
    cf = j.get("cf")
    if not isinstance(cf, dict) or not HANDLE.match(str(cf.get("handle", ""))):
        return None
    try:
        meta = min(6, max(1, int(cf.get("meta") or 3)))
    except (TypeError, ValueError):
        meta = 3
    return {"handle": cf["handle"], "meta": meta}


def linha_habito(h, tag, d):
    return f"{d} {limpa(h['n'])} {tag} rec:{h['id']}:{d}"


def linha_cf(cf, tag, d):
    return f"(A) {d} Codeforces {cf['meta']} questões {tag} rec:cf:{d}"


def recorrentes_do_dia(linhas, j, refazer=False, done=()):
    """Deixa o todo.txt com as recorrentes de hoje. Concluídas de dias anteriores vão para o done.txt e recorrentes que
    ficaram abertas de dias anteriores saem (hábito perdido não pune: só não conta). Com refazer=True (a configuração mudou),
    os hábitos de hoje são recriados com os nomes novos, e os que já estavam marcados continuam marcados.
    Hábito semanal (N vezes por semana, seg a dom) só aparece enquanto a meta da semana não foi cumprida.
    Devolve as linhas que vão para o done.txt; muda `linhas` no lugar."""
    d = hoje().isoformat()
    arquivo, manter = [], []
    for l in linhas:
        m, r = DONE_RE.match(l), REC.search(l)
        if m and m.group(1) < d:
            arquivo.append(l)
        elif not m and r and r.group(2) < d:
            continue
        else:
            manter.append(l)
    tag, cf = tag_habito(j), cf_conf(j)
    habs = habitos(j)
    ids = {h["id"] for h in habs}
    feitos = set()
    if refazer:
        resto = []
        for l in manter:
            r = REC.search(l)
            if r and r.group(2) == d and (r.group(1) != "cf" or not DONE_RE.match(l)):
                if DONE_RE.match(l):
                    feitos.add(r.group(1))
                continue   # refeita abaixo; a do Codeforces aberta também (handle desligado ou meta nova)
            resto.append(l)
        manter = resto
    existentes = {(r.group(1)) for r in (REC.search(l) for l in manter) if r and r.group(2) == d}
    seg = (hoje() - timedelta(days=hoje().weekday())).isoformat()
    na_semana = {}   # vezes que cada hábito já foi feito nesta semana, antes de hoje (pelo dia do hábito, não pelo dia em que marcou)
    for l in list(done) + arquivo + manter:
        r = REC.search(l)
        if DONE_RE.match(l) and r and seg <= r.group(2) < d:
            na_semana[r.group(1)] = na_semana.get(r.group(1), 0) + 1
    for h in habs:
        if h["semana"] and na_semana.get(h["id"], 0) >= h["semana"] and h["id"] not in feitos:
            continue   # meta da semana cumprida
        if h["id"] not in existentes:
            nova = linha_habito(h, tag, d)
            inserir(manter, f"x {d} {nova}" if h["id"] in feitos else nova)
    if cf and "cf" not in existentes:
        inserir(manter, linha_cf(cf, tag, d))
    if not manter or manter[-1] != "":
        manter.append("")
    linhas[:] = manter
    return arquivo


def arruma_dia(refazer=False):
    with lock:
        linhas = ler()
        antes = list(linhas)
        arquivo = recorrentes_do_dia(linhas, jogador(), refazer, ler("done.txt"))
        if arquivo:
            t = ler_txt("done.txt")
            gravar_txt("done.txt", t + ("" if not t or t.endswith("\n") else "\n") + "\n".join(arquivo) + "\n")
        if linhas != antes:
            gravar(linhas)
            if arquivo or refazer:
                undo_stack.clear()   # as linhas mudaram de lugar: desfazer antigo não vale mais


def api_ontem(d):
    """Botão "esqueci de marcar ontem": grava no done.txt o hábito como feito ontem (conta para ontem: XP, Ten e heatmap)."""
    ont = (hoje() - timedelta(days=1)).isoformat()
    j = jogador()
    h = next((h for h in habitos(j) if h["id"] == str(d.get("id", ""))), None)
    if not h:
        raise Erro("hábito não encontrado")
    marca = f"rec:{h['id']}:{ont}"
    with lock:
        arruma_dia()   # as linhas de ontem já estão no done.txt
        done = ler("done.txt")
        if any(marca in l.split() and DONE_RE.match(l) for l in done + ler()):
            raise Erro("esse hábito já está marcado ontem")
        nova = f"x {ont} {linha_habito(h, tag_habito(j), ont)}"
        inserir(done, nova)
        gravar(done, "done.txt")
        undo_stack.append({"from": None, "to": nova, "arq": "done.txt"})
        del undo_stack[:-40]
    return {"ok": True}


def api_denovo(d):
    """Botão "fiz de novo": hábito semanal com a meta da semana já cumprida (o servidor não criou a linha de hoje) feito
    mais uma vez hoje. Grava concluído no todo.txt; o motor conta as vezes acima da meta com XP em dobro."""
    hj = hoje().isoformat()
    j = jogador()
    h = next((h for h in habitos(j) if h["id"] == str(d.get("id", ""))), None)
    if not h or not h["semana"]:
        raise Erro("hábito semanal não encontrado")
    marca = f"rec:{h['id']}:{hj}"
    with lock:
        arruma_dia()
        linhas = ler()
        if any(marca in l.split() for l in linhas):
            raise Erro("esse hábito já está na Lista de hoje (uma vez por dia)")
        nova = f"x {hj} {linha_habito(h, tag_habito(j), hj)}"
        inserir(linhas, nova)
        gravar(linhas)
        undo_stack.append({"from": None, "to": nova})
        del undo_stack[:-40]
    return {"ok": True}


def api_config(d):
    j = d.get("jogador")
    if not isinstance(j, dict):
        raise Erro("jogador inválido")
    corpo = json.dumps(j, ensure_ascii=False)
    if len(corpo) > 20000:
        raise Erro("configuração grande demais", 413)
    av = d.get("avaliacoes")
    if av is not None and (not isinstance(av, str) or len(av) > 60000):
        raise Erro("avaliacoes inválido")
    with lock:
        if "ia" not in j and "ia" in jogador():   # a escolha da IA tem rota própria: o assistente não a apaga
            j["ia"] = jogador()["ia"]
        gravar_json("jogador.json", j)
        if av is not None:
            gravar_txt("avaliacoes.txt", av if av.endswith("\n") else av + "\n")
        arruma_dia(refazer=True)
    cf_vivo["t"] = 0.0   # handle pode ter mudado: consulta de novo na próxima leitura
    return {"ok": True}


# ---------- Codeforces ----------
cf_vivo = {"t": 0.0, "rodando": False}


def cf_atualiza(cf):
    """Conta os problemas distintos aceitos por dia (pela data do 1º AC, no fuso desta máquina). Roda numa thread."""
    try:
        url = "https://codeforces.com/api/user.status?" + urllib.parse.urlencode({"handle": cf["handle"], "from": 1, "count": 2000})
        req = urllib.request.Request(url, headers={"User-Agent": f"hunter-todo/{VERSAO}"})
        with urllib.request.urlopen(req, timeout=10) as r:
            j = json.load(r)
        if j.get("status") != "OK":
            raise ValueError(j.get("comment") or "resposta inesperada")
        primeiro = {}
        for sub in reversed(j["result"]):
            if sub.get("verdict") == "OK":
                k = (sub["problem"].get("contestId"), sub["problem"].get("index"))
                primeiro.setdefault(k, time.strftime("%Y-%m-%d", time.localtime(sub["creationTimeSeconds"])))
        conta = {}
        for dia in primeiro.values():
            conta[dia] = conta.get(dia, 0) + 1
        with lock:
            cache = ler_json("cf.json", {})
            if cache.get("handle") != cf["handle"] or not cache.get("desde"):   # handle novo: o bônus atrasado conta só daqui para a frente
                cache = {"desde": hoje().isoformat(), "creditados": []}
            cache.update(handle=cf["handle"], por_dia=conta)
            gravar_json("cf.json", cache)
        conta = cf_soma(cache)
        cf_auto_conclui(cf, conta)
        cf_bonus_atrasado(cf, conta)
    except Exception as e:   # sem internet, handle errado ou API fora do ar: fica o que estava no cf.json
        log("codeforces:", e)
    finally:
        cf_vivo["t"] = time.time()
        cf_vivo["rodando"] = False


def cf_auto_conclui(cf, conta):
    """Meta do dia batida -> conclui sozinho a recorrente rec:cf:HOJE. Uma vez por dia: se reabrir à mão, não conclui de novo."""
    d = hoje().isoformat()
    if conta.get(d, 0) < cf["meta"]:
        return
    with lock:
        cache = ler_json("cf.json", {})
        if cache.get("auto") == d:
            return
        linhas = ler()
        for i, l in enumerate(linhas):
            if f"rec:cf:{d}" in l.split() and not DONE_RE.match(l):
                linhas[i] = transformar(l, "done")
                gravar(linhas)
                log(f"codeforces: meta do dia batida ({conta[d]}), recorrente concluída")
                break
        cache["auto"] = d
        cache["creditados"] = sorted(set(cache.get("creditados") or []) | {d})[-90:]
        gravar_json("cf.json", cache)


def cf_bonus_atrasado(cf, conta):
    """Dias anteriores em que a meta foi batida com o jogo fechado (a recorrente nem chegou a ser criada): grava no done.txt
    a recorrente do Codeforces concluída naquele dia, e o bônus da meta conta. Cada dia é creditado uma vez só."""
    d = hoje().isoformat()
    with lock:
        cache = ler_json("cf.json", {})
        feitos = set(cache.get("creditados") or [])
        dias = [x for x in sorted(conta) if cache.get("desde", d) <= x < d and conta[x] >= cf["meta"] and x not in feitos]
        if not dias:
            return
        done = ler("done.txt")
        ja = {r.group(2) for r in (REC.search(l) for l in done + ler() if DONE_RE.match(l)) if r and r.group(1) == "cf"}
        tag = tag_habito(jogador())
        for x in dias:
            if x not in ja:
                inserir(done, f"x {x} {PRI.sub('', linha_cf(cf, tag, x))}")
                log(f"codeforces: meta de {x} batida com o jogo fechado, bônus creditado")
            feitos.add(x)
        gravar(done, "done.txt")
        cache["creditados"] = sorted(feitos)[-90:]
        gravar_json("cf.json", cache)


def cf_soma(cache):
    """Problemas por dia: os que a API do Codeforces enxerga mais os marcados à mão (ITMO Academy, grupos privados)."""
    conta = dict(cache.get("por_dia") or {})
    for d, n in (cache.get("manual") or {}).items():
        conta[d] = conta.get(d, 0) + n
    return conta


def api_cf_mao(d):
    """Botão discreto "marcar à mão": +1 problema hoje (ou -1, para desfazer). Sem limite: vale a confiança do jogador.
    Conta igual aos da API, para a meta do dia e o XP."""
    cf = cf_conf(jogador())
    if not cf:
        raise Erro("ligue o Codeforces na aba Configurações primeiro")
    dia, passo = hoje().isoformat(), -1 if d.get("menos") else 1
    with lock:
        cache = ler_json("cf.json", {})
        if cache.get("handle") != cf["handle"]:
            raise Erro("o Codeforces ainda não foi consultado; tente de novo em alguns segundos", 409)
        manual = cache.get("manual") or {}
        manual[dia] = max(0, manual.get(dia, 0) + passo)
        cache["manual"] = {k: v for k, v in sorted(manual.items())[-400:] if v}
        gravar_json("cf.json", cache)
        conta = cf_soma(cache)
    cf_auto_conclui(cf, conta)
    return {"ok": True, "hoje": conta.get(dia, 0), "mao": cache["manual"].get(dia, 0)}


def cf_leitura(j):
    cf = cf_conf(j)
    if not cf:
        return None
    if time.time() - cf_vivo["t"] > 600 and not cf_vivo["rodando"]:
        cf_vivo["rodando"] = True
        threading.Thread(target=cf_atualiza, args=(cf,), daemon=True).start()
    cache = ler_json("cf.json", {})
    if cache.get("handle") != cf["handle"]:
        return {"handle": cf["handle"], "por_dia": {}, "manual": {}}
    return {"handle": cf["handle"], "por_dia": cf_soma(cache), "manual": cache.get("manual") or {}}


# ---------- jogo: leitura e as três gravações ----------
NOME_AV = re.compile(r"^[A-Za-z0-9_.-]{1,80}$")
SIGLA = re.compile(r"^[A-Z0-9]{1,12}$")
CHAVE = re.compile(r"^[A-Za-z0-9]{1,8}$")


def pastas_avatares():
    return [DADOS / "avatares", WEB / "a"]


def avatares():
    nomes = set()
    for p in pastas_avatares():
        if p.is_dir():
            nomes.update(f.stem for f in p.glob("*.png") if NOME_AV.match(f.stem) and not f.stem.startswith("."))
    return sorted(nomes)


def api_jogo_get():
    arruma_dia()
    j = jogador()
    cf = cf_leitura(j)
    narradas = ler_json("narradas.json", [])
    conquistas = ler_json("conquistas.json", [])
    estado = ler_json("estado.json", {})
    with lock:
        todo, done = ler(), ler_txt("done.txt").split("\n")
    return {"ok": True, "hoje": hoje().isoformat(), "todo": todo, "done": done, "avaliacoes": ler_txt("avaliacoes.txt"),
            "notas": ler_txt("notas.txt"), "ajustes": ler_txt("ajustes.txt"), "estado": estado if isinstance(estado, dict) else {},
            "cf": cf, "avatares": avatares(), "narradas": narradas if isinstance(narradas, list) else [], "jogador": j,
            "conquistas": conquistas if isinstance(conquistas, list) else [],
            "servidor": {"versao": VERSAO, "nome": VERSAO_NOME, "sistema": sistema(), "auto": auto_ligado(), "fundo": EXEC["fundo"], "dados": str(DADOS)}}


def acrescenta(nome, linha):
    with lock:
        t = ler_txt(nome)
        gravar_txt(nome, t + ("" if not t or t.endswith("\n") else "\n") + linha + "\n")
    return {"ok": True}


def api_jogo_nota(d):
    disc, aval = str(d.get("disc", "")).upper(), str(d.get("aval", ""))
    try:
        nota = float(d.get("nota"))
    except (TypeError, ValueError):
        raise Erro("nota inválida")
    if not SIGLA.match(disc) or not CHAVE.match(aval) or not 0 <= nota <= 10:
        raise Erro("disciplina, avaliação ou nota inválida")
    txt = f"{nota:g}".replace(".", ",")
    return acrescenta("notas.txt", f"{hoje().isoformat()} | {disc} | {aval} | {txt}" + (" | parcial" if d.get("parcial") else ""))


def api_jogo_ajuste(d):
    if "quando" in d:   # marca um lembrete como aplicado (ou volta a pendente): acha a linha pela data/hora e pelo texto
        quando, texto, novo = str(d.get("quando", "")), str(d.get("texto", "")), "aplicado" if d.get("aplicado") else "pendente"
        with lock:
            linhas = ler_txt("ajustes.txt").split("\n")
            for i, l in enumerate(linhas):
                p = [x.strip() for x in l.split("|")]
                if not l.strip().startswith("#") and len(p) >= 3 and p[0] == quando and p[2] == texto:
                    p[1] = novo
                    linhas[i] = " | ".join(p)
                    gravar_txt("ajustes.txt", "\n".join(linhas))
                    return {"ok": True}
        raise Erro("lembrete não encontrado (o ajustes.txt mudou?)", 404)
    t = " ".join(str(d.get("texto", "")).split()).replace("|", "/")
    if not 1 <= len(t) <= 500:
        raise Erro("escreva de 1 a 500 caracteres")
    return acrescenta("ajustes.txt", f"{time.strftime('%Y-%m-%d %H:%M')} | pendente | {t}")


def api_jogo_planos(d):
    """Editor do chefão: grava o avaliacoes.txt e o notas.txt inteiros (a página só muda o bloco da disciplina editada).
    A versão anterior de cada um fica em .bak, para dar para voltar à mão."""
    novos = {}
    for chave, nome in (("avaliacoes", "avaliacoes.txt"), ("notas", "notas.txt")):
        t = d.get(chave)
        if t is None:
            continue
        if not isinstance(t, str) or len(t) > 60000:
            raise Erro(f"{nome} inválido")
        novos[nome] = t if t.endswith("\n") or not t else t + "\n"
    with lock:
        for nome, t in novos.items():
            if caminho(nome).exists():
                gravar_txt(nome + ".bak", ler_txt(nome))
            gravar_txt(nome, t)
    return {"ok": True}


ICONES = set("int tra con esp man emi spider tower card flame moon island crown scroll".split())
PERIODO = {"semana": re.compile(r"^\d{4}-W\d{2}$"), "mes": re.compile(r"^\d{4}-\d{2}$"), "semestre": re.compile(r"^\d{4}-[12]$"), "ano": re.compile(r"^\d{4}$")}


def api_jogo_narrada(d):
    """Carta narrada colada da IA (aba Book): acrescenta em narradas.json; a do mesmo período substitui a anterior."""
    c = d.get("carta")
    if not isinstance(c, dict):
        raise Erro("carta inválida")
    tipo, per = str(c.get("tipo", "")), str(c.get("periodo", ""))
    if tipo not in PERIODO or not PERIODO[tipo].match(per):
        raise Erro("tipo ou período inválido")
    campos = {k: " ".join(str(c.get(k) or "").replace("\r", "").split(" ")).strip() for k in ("titulo", "texto", "cronica")}
    if not campos["titulo"] or not campos["texto"]:
        raise Erro("a carta precisa de título e texto")
    if len(campos["titulo"]) > 120 or len(campos["texto"]) > 5000 or len(campos["cronica"]) > 8000:
        raise Erro("carta grande demais")
    carta = {"no": f"N-{per}", "tipo": tipo, "periodo": per, "escrita": hoje().isoformat(),
             "ic": c.get("ic") if c.get("ic") in ICONES else "scroll", **campos}
    with lock:
        lista = ler_json("narradas.json", [])
        lista = [x for x in (lista if isinstance(lista, list) else []) if not (isinstance(x, dict) and x.get("no") == carta["no"])] + [carta]
        gravar_json("narradas.json", lista)
    return {"ok": True, "no": carta["no"]}


def api_jogo_estado(d):
    e = d.get("estado")
    if not isinstance(e, dict):
        raise Erro("estado inválido")
    ok = {"spent": (int, float), "cofreUsado": (int, float), "own": list, "resg": list, "bought": dict, "usados": dict, "usos": list,
          "equip": dict, "tour": dict, "premios": list, "cofreMes": (int, float), "visto": str}
    for k, v in e.items():
        if k not in ok or not isinstance(v, ok[k]):
            raise Erro(f"campo inválido no estado: {k}")
    for x in e.get("premios", []):   # prêmios reais do jogador (Masadora → editar meus prêmios)
        if not (isinstance(x, dict) and isinstance(x.get("n"), str) and 0 < len(x["n"]) <= 80
                and all(isinstance(x.get(c, 0), (int, float)) and x.get(c, 0) >= 0 for c in ("p", "rs"))):
            raise Erro("prêmio inválido: precisa de nome (até 80 letras) e preço")
    if len(e.get("premios", [])) > 60 or e.get("cofreMes", 0) < 0:
        raise Erro("prêmios demais (máx. 60) ou cofre negativo")
    corpo = json.dumps(e, ensure_ascii=False, indent=1)
    if len(corpo) > 60000:
        raise Erro("estado grande demais", 413)
    with lock:
        gravar_txt("estado.json", corpo + "\n")
    return {"ok": True}


CONQ_REGRAS = {"contagem", "sequencia", "nota", "constancia", "semana"}
CONQ_MAX = 5   # abertas (não resgatadas) ao mesmo tempo; o mesmo número do motor.js
CONQ_RANKS = {"D", "C", "B", "A"}


def conq_item(p):
    """Confere o formato de uma conquista criada pela IA (as regras de verdade e o rank são calculados pelo motor.js)."""
    if not isinstance(p, dict) or p.get("regra") not in CONQ_REGRAS:
        raise Erro("conquista com regra desconhecida")
    c = {"regra": p["regra"]}
    for k in ("n", "xp"):
        if k in p:
            if not isinstance(p[k], int) or not 1 <= p[k] <= 5000:
                raise Erro(f"número inválido na conquista: {k}")
            c[k] = p[k]
    for k in ("media", "nota"):
        if k in p:
            if not isinstance(p[k], (int, float)) or not 0 < p[k] <= 10:
                raise Erro(f"nota inválida na conquista: {k}")
            c[k] = p[k]
    for k, rx in (("palavra", r"^[^|\n]{2,30}$"), ("disc", r"^[A-Z0-9]{1,8}$"), ("tipo", r"^(ent|est|fac|tre|vid)$"), ("hab", r"^[\w-]{1,30}$"), ("aval", r"^[A-Za-z0-9]{1,8}$")):
        if p.get(k):
            if not isinstance(p[k], str) or not re.match(rx, p[k]):
                raise Erro(f"campo inválido na conquista: {k}")
            c[k] = p[k]
    if p.get("prazo") is True:
        c["prazo"] = True
    nome, texto = " ".join(str(p.get("nome", "")).split()), " ".join(str(p.get("texto", "")).split())
    if not 1 <= len(nome) <= 60 or len(texto) > 400:
        raise Erro("a conquista precisa de nome (até 60 letras) e texto de até 400")
    if p.get("rk") not in CONQ_RANKS:
        raise Erro("rank inválido")
    return {**c, "nome": nome, "texto": texto, "ic": p.get("ic") if p.get("ic") in ICONES else "card", "rk": p["rk"],
            "temporada": str(p.get("temporada", ""))[:40]}


def api_conquistas(d):
    """Conquistas criadas pela IA (aba Book): {acao: criar, itens} · {acao: resgatar, no, como: jenny|feitico, j?, k?} · {acao: descartar, no}.
    Ficam em conquistas.json, numeradas de 200 em diante (o número de uma descartada não volta)."""
    acao = d.get("acao")
    with lock:
        lista = ler_json("conquistas.json", [])
        lista = [x for x in lista if isinstance(x, dict)] if isinstance(lista, list) else []
        abertas = [x for x in lista if not x.get("resgate") and not x.get("descartada")]
        if acao == "criar":
            itens = d.get("itens")
            if not isinstance(itens, list) or not 1 <= len(itens) <= CONQ_MAX:
                raise Erro("nenhuma conquista para criar")
            if len(abertas) + len(itens) > CONQ_MAX:
                raise Erro(f"no máximo {CONQ_MAX} conquistas da IA abertas: conquiste ou descarte alguma antes")
            prox = max([int(x["no"]) for x in lista if str(x.get("no", "")).isdigit()] + [199]) + 1
            novas = []
            for i, p in enumerate(itens):
                novas.append({"no": str(prox + i), **conq_item(p), "criada": hoje().isoformat()})
            gravar_json("conquistas.json", lista + novas)
            return {"ok": True, "nos": [c["no"] for c in novas]}
        c = next((x for x in lista if x.get("no") == str(d.get("no", ""))), None)
        if not c:
            raise Erro("conquista não encontrada", 404)
        if c.get("resgate"):
            raise Erro("essa conquista já foi resgatada")
        if acao == "descartar":
            c["descartada"] = hoje().isoformat()
        elif acao == "resgatar":
            como = d.get("como")
            if como == "jenny" and isinstance(d.get("j"), int) and 0 < d["j"] <= 20000:
                c["resgate"] = {"como": "jenny", "j": d["j"], "em": hoje().isoformat()}
            elif como == "feitico" and isinstance(d.get("k"), str) and re.match(r"^[a-z]{2,10}$", d["k"]):
                c["resgate"] = {"como": "feitico", "k": d["k"], "em": hoje().isoformat()}
            else:
                raise Erro("recompensa inválida")
        else:
            raise Erro("ação desconhecida")
        gravar_json("conquistas.json", lista)
    return {"ok": True}


# ---------- atualização: confere no GitHub se há versão nova e, se o jogador pedir, atualiza ----------
GITHUB = "https://github.com/CaioParanaiba/todo-engine"
RAW = os.environ.get("HUNTER_RAW") or ""   # HUNTER_RAW: outro endereço, para testar; vazio = a branch do canal


def canal():
    """Branch que esta cópia segue: "beta" numa cópia git na branch beta (o autor testa as versões antes), senão "main"."""
    if metodo_atualizar() == "git":
        try:
            r = subprocess.run(["git", "-C", str(REPO), "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, timeout=10)
            if r.stdout.strip() == "beta":
                return "beta"
        except (OSError, subprocess.SubprocessError):
            pass
    return "main"
ATUAL = {"quando": 0.0, "remota": None, "erro": ""}
atual_lock = threading.Lock()


def vtupla(v):
    return tuple(int(x) for x in re.findall(r"\d+", str(v))[:3]) or (0,)


def novidades_de(texto):
    """A lista de versões do web/novidades.js: o JSON entre /*NOVIDADES*/ e /*FIM*/."""
    i, j = texto.find("/*NOVIDADES*/"), texto.find("/*FIM*/")
    lista = json.loads(texto[i + len("/*NOVIDADES*/"):j]) if 0 <= i < j else []
    return [x for x in lista if isinstance(x, dict) and x.get("versao")]


def confere_github(forcar=False):
    """Lê o novidades.js da versão publicada, no máximo uma vez a cada 6 horas (ou na hora, se o jogador pedir)."""
    with atual_lock:
        if not forcar and time.time() - ATUAL["quando"] < 6 * 3600:
            return
        try:
            with urllib.request.urlopen(urllib.request.Request((RAW or f"https://raw.githubusercontent.com/CaioParanaiba/todo-engine/{canal()}/") + "web/novidades.js", headers={"User-Agent": "hunter-todo/" + VERSAO}), timeout=8) as r:
                ATUAL.update(remota=novidades_de(r.read(400_000).decode("utf-8")), erro="")
        except urllib.error.HTTPError as e:   # 404: a versão publicada ainda não tem o novidades.js (é anterior à 0.5)
            ATUAL.update(remota=[], erro="" if e.code == 404 else "o GitHub não respondeu direito")
        except (OSError, ValueError) as e:
            ATUAL["erro"] = "não consegui falar com o GitHub (sem internet?)"
            log("conferir atualização:", repr(e))
        ATUAL["quando"] = time.time()


def metodo_atualizar():
    return "git" if (REPO / ".git").is_dir() and shutil.which("git") else "zip"


def api_atualizacao_get(forcar):
    confere_github(forcar)
    novas = [x for x in (ATUAL["remota"] or []) if vtupla(x["versao"]) > vtupla(VERSAO)]
    return {"ok": True, "versao": VERSAO, "nome": VERSAO_NOME, "canal": canal(), "novas": novas, "erro": ATUAL["erro"], "metodo": metodo_atualizar(),
            "conferido": time.strftime("%Y-%m-%d %H:%M", time.localtime(ATUAL["quando"])) if ATUAL["quando"] else ""}


def baixa_zip():
    """Sem git: baixa o ZIP da versão publicada e copia os arquivos por cima do código (os dados ficam em outra pasta)."""
    with urllib.request.urlopen(urllib.request.Request(GITHUB + "/archive/refs/heads/main.zip", headers={"User-Agent": "hunter-todo/" + VERSAO}), timeout=60) as r:
        corpo = r.read(60_000_000)
    with zipfile.ZipFile(BytesIO(corpo)) as z:
        nomes = [n for n in z.namelist() if not n.endswith("/")]
        raiz = nomes[0].split("/", 1)[0] + "/" if nomes else ""
        if "servidor.py" not in {n[len(raiz):] for n in nomes}:
            raise Erro("o arquivo baixado não é o jogo")
        for n in nomes:
            rel = Path(n[len(raiz):])
            if not n.startswith(raiz) or rel.is_absolute() or ".." in rel.parts:
                continue
            destino = REPO / rel
            destino.parent.mkdir(parents=True, exist_ok=True)
            tmp = destino.with_name(destino.name + ".novo")
            tmp.write_bytes(z.read(n))
            os.replace(tmp, destino)


def api_atualizar(_):
    if ia_lock.locked():
        raise Erro("a IA está trabalhando num pedido: espere terminar e tente de novo")
    if metodo_atualizar() == "git":
        try:
            r = subprocess.run(["git", "-C", str(REPO), "pull", "--ff-only"], capture_output=True, text=True, timeout=120)
        except (OSError, subprocess.SubprocessError) as e:
            raise Erro(f"o git não rodou ({e})")
        if r.returncode != 0:
            ult = (r.stderr or r.stdout).strip().splitlines()
            raise Erro("o git não conseguiu atualizar" + (f" ({ult[-1]})" if ult else "") + ". Rode o instalador de novo.")
    else:
        try:
            baixa_zip()
        except (OSError, zipfile.BadZipFile) as e:
            raise Erro(f"não consegui baixar a versão nova ({e})")
    log("jogo atualizado pela página: reiniciando")
    def reinicia():
        EXEC["recarregar"] = True
        EXEC["srv"].shutdown()
    threading.Timer(1.0, reinicia).start()
    return {"ok": True}


def backup():
    """ZIP com tudo o que está na pasta de dados (menos o log do servidor), para guardar ou levar para outro computador."""
    buf = BytesIO()
    with lock, zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(DADOS.rglob("*")):
            if f.is_file() and f.name != "servidor.log":
                z.write(f, f.relative_to(DADOS).as_posix())
        if TODO_DIR != DADOS:   # todo.txt em outra pasta (--todo): vai junto no ZIP
            for nome in ("todo.txt", "done.txt"):
                if caminho(nome).is_file():
                    z.write(caminho(nome), nome)
    return buf.getvalue()


# ---------- IA integrada (opcional): o jogo chama o agente de terminal do jogador e só lê o texto que ele devolve ----------
# A página monta o pedido (web/ia.js, o mesmo do modo chat) e confere a resposta; o agente roda sem poder gravar nada,
# numa pasta temporária com o pedido e o anexo. Ligar e escolher o agente: aba Configurações (jogador.json → "ia").
AGENTES = {
    "claude": {"nome": "Claude Code", "login": "claude   (na primeira vez ele pede o login)"},
    "codex": {"nome": "Codex", "login": "codex login"},
    "gemini": {"nome": "Gemini CLI", "login": "gemini   (na primeira vez ele pede o login)"},
}
IA_TEMPO = 600   # segundos por pedido
PLANO_EXT = {".pdf", ".html", ".htm", ".txt", ".md", ".docx"}
NOME_PLANO = re.compile(r"^[\w .()\-]{1,80}$")
ia_tarefas = {}   # id → {"estado": rodando|pronto|erro, "texto", "erro", "ini", "seg"}
ia_lock = threading.Lock()   # um pedido por vez


def caminhos_extra():
    """Pastas onde os instaladores costumam pôr os agentes. O serviço de início automático roda com um PATH curto."""
    h = Path.home()
    extra = [h / ".local" / "bin", h / ".npm-global" / "bin", h / ".bun" / "bin", h / ".volta" / "bin", h / ".cargo" / "bin",
             h / ".local" / "share" / "pnpm", h / ".yarn" / "bin", h / "bin", Path("/usr/local/bin"), Path("/opt/homebrew/bin"),
             Path("/home/linuxbrew/.linuxbrew/bin"), Path("/snap/bin"), Path("/usr/bin")]
    if sistema() == "windows":
        extra.append(Path(os.environ.get("APPDATA") or h / "AppData" / "Roaming") / "npm")
    extra += sorted((h / ".nvm" / "versions" / "node").glob("*/bin"), reverse=True)
    extra += sorted((h / ".local" / "share" / "fnm" / "node-versions").glob("*/installation/bin"), reverse=True)
    return [str(p) for p in extra if p.is_dir()]


_path_shell = {}


def path_shell():
    """PATH do terminal do usuário (lido uma vez): o serviço do início automático não carrega o .bashrc/.zshrc, onde o
    nvm, o npm e outros instaladores costumam pôr os agentes."""
    if "v" not in _path_shell:
        _path_shell["v"] = ""
        sh = os.environ.get("SHELL") or "/bin/sh"
        if sistema() != "windows" and Path(sh).exists():
            for flags in ("-lic", "-lc"):
                try:
                    r = subprocess.run([sh, flags, "echo __P__$PATH"], capture_output=True, text=True, timeout=8, stdin=subprocess.DEVNULL)
                    m = re.search(r"__P__(\S+)", r.stdout or "")
                    if m:
                        _path_shell["v"] = m.group(1)
                        break
                except (OSError, subprocess.SubprocessError):
                    pass
    return _path_shell["v"]


def path_agentes():
    return os.pathsep.join(p for p in [os.environ.get("PATH", ""), path_shell()] + caminhos_extra() if p)


def acha_agente(ag):
    import shutil
    return shutil.which(ag, path=path_agentes())


def ia_conf(j=None):
    c = (j or jogador()).get("ia")
    c = c if isinstance(c, dict) else {}
    ag = c.get("agente") if c.get("agente") in AGENTES else "chat"
    return {"agente": ag, "desde": str(c.get("desde") or ""), "cartas": c.get("cartas", True) is not False}


def planos():
    p = DADOS / "planos"
    return sorted(f.name for f in p.iterdir() if f.is_file() and f.suffix.lower() in PLANO_EXT) if p.is_dir() else []


def api_ia_get():
    return {"ok": True, "conf": ia_conf(), "planos": planos(), "pasta": str(DADOS / "planos"),
            "agentes": [{"id": k, "nome": v["nome"], "login": v["login"], "achado": bool(acha_agente(k))} for k, v in AGENTES.items()]}


def api_ia_config(d):
    """Escolhe o agente (ou "chat" = copiar e colar) e liga/desliga as cartas automáticas. "desde" marca o dia em que a IA
    foi ligada: as cartas automáticas começam nos períodos fechados a partir dele (as antigas, só pelo botão)."""
    ag = d.get("agente", None)
    with lock:
        j = jogador()
        c = ia_conf(j)
        if ag is not None:
            if ag != "chat" and ag not in AGENTES:
                raise Erro("agente desconhecido")
            if ag != "chat" and not c["desde"]:
                c["desde"] = hoje().isoformat()
            c["agente"] = ag
        if "cartas" in d:
            c["cartas"] = bool(d["cartas"])
        j["ia"] = c
        gravar_json("jogador.json", j)
    return {"ok": True, "conf": c}


def comando_agente(ag, exe, pasta, saida, leve=False):
    """Linha de comando de cada agente, sem permissão de escrita. O pedido vai pela entrada padrão.
    leve: pedido pequeno (tipo de uma tarefa), com o modelo mais barato e rápido de cada um."""
    if ag == "claude":
        return [exe, "-p", "--tools", "Read", "--permission-mode", "dontAsk", "--no-session-persistence", "--strict-mcp-config"] + (["--model", "haiku"] if leve else [])
    if ag == "codex":
        return [exe, "exec", "--sandbox", "read-only", "--skip-git-repo-check", "--color", "never", "--cd", pasta, "--output-last-message", saida]\
            + (["-c", 'model_reasoning_effort="low"'] if leve else []) + ["-"]
    return [exe, "-p", "Responda ao pedido acima, seguindo as regras dele."] + (["-m", "gemini-2.5-flash"] if leve else [])


def explica_erro(ag, saida):
    s = " ".join(saida.split())[-400:]
    if re.search(r"log ?in|logged|auth|credential|api key|401|403|unauthorized", s, re.I):
        return f"Parece que falta entrar na conta do {AGENTES[ag]['nome']}. Rode no terminal: {AGENTES[ag]['login']}. Mensagem: {s}"
    return s or "o agente terminou sem responder"


def ia_executa(tid, ag, exe, pedido, anexos, leve):
    import tempfile
    t = ia_tarefas[tid]
    try:
        with tempfile.TemporaryDirectory(prefix="hunter-ia-") as pasta:
            if anexos:
                import shutil
                for a in anexos:
                    shutil.copy2(DADOS / "planos" / a, Path(pasta) / a)
                pedido += "\n\n" + (f"O arquivo {anexos[0]} está na pasta atual: leia-o." if len(anexos) == 1
                                     else "Os arquivos estão na pasta atual: " + ", ".join(anexos) + ". Leia-os.")
            saida = str(Path(pasta) / ".resposta.txt")
            env = dict(os.environ, PATH=os.pathsep.join([str(Path(exe).parent), path_agentes()]))
            r = subprocess.run(comando_agente(ag, exe, pasta, saida, leve), input=pedido, capture_output=True, text=True, encoding="utf-8",
                               errors="replace", cwd=pasta, env=env, timeout=IA_TEMPO)
            texto = Path(saida).read_text(encoding="utf-8") if ag == "codex" and Path(saida).exists() else r.stdout
            if r.returncode != 0 or not texto.strip():
                raise Erro(explica_erro(ag, (r.stderr or "") + " " + (r.stdout or "")))
            t.update(estado="pronto", texto=texto.strip())
    except subprocess.TimeoutExpired:
        t.update(estado="erro", erro=f"o agente passou de {IA_TEMPO // 60} minutos sem responder")
    except (Erro, OSError) as e:
        t.update(estado="erro", erro=str(e))
    finally:
        t["seg"] = round(time.time() - t["ini"])
        ia_lock.release()
        log("ia:", ag, t["estado"], f"{t['seg']}s")


def api_ia_rodar(d):
    """{pedido, anexo?: "arquivo" | ["arquivos"] da pasta planos/, leve?: true para um pedido pequeno}"""
    pedido, anexos = d.get("pedido"), d.get("anexo") or []
    anexos = [anexos] if isinstance(anexos, str) else anexos
    if not isinstance(pedido, str) or not 1 <= len(pedido) <= 200000:
        raise Erro("pedido inválido")
    if not isinstance(anexos, list) or len(anexos) > 30 or any(a not in planos() for a in anexos):
        raise Erro("arquivo do plano não encontrado na pasta planos")
    ag = ia_conf()["agente"]
    if ag == "chat":
        raise Erro("a IA não está ligada (aba Configurações → IA)")
    exe = acha_agente(ag)
    if not exe:
        raise Erro(f"não achei o {AGENTES[ag]['nome']} neste computador")
    if not ia_lock.acquire(blocking=False):
        raise Erro("a IA já está trabalhando num pedido; espere ele terminar", 409)
    tid = str(int(time.time() * 1000))
    for velho in sorted(ia_tarefas)[:-20]:
        del ia_tarefas[velho]
    ia_tarefas[tid] = {"estado": "rodando", "texto": "", "erro": "", "ini": time.time(), "seg": 0, "agente": ag}
    threading.Thread(target=ia_executa, args=(tid, ag, exe, pedido, anexos, bool(d.get("leve"))), daemon=True).start()
    return {"ok": True, "id": tid}


def api_ia_tarefa(tid):
    t = ia_tarefas.get(tid)
    if not t:
        raise Erro("pedido não encontrado (o servidor reiniciou?)", 404)
    seg = t["seg"] if t["estado"] != "rodando" else round(time.time() - t["ini"])
    return {"ok": True, "estado": t["estado"], "texto": t["texto"], "erro": t["erro"], "seg": seg}


def api_ia_plano(d):
    """Recebe um plano de ensino escolhido na página e guarda em DADOS/planos (também dá para pôr o arquivo lá à mão)."""
    import base64
    nome = Path(str(d.get("nome", ""))).name.strip()
    if not NOME_PLANO.match(nome) or Path(nome).suffix.lower() not in PLANO_EXT or nome.startswith("."):
        raise Erro("nome de arquivo inválido (use PDF, HTML, DOCX, TXT ou MD)")
    try:
        corpo = base64.b64decode(str(d.get("base64", "")), validate=True)
    except ValueError:
        raise Erro("arquivo inválido")
    if not corpo or len(corpo) > 15_000_000:
        raise Erro("arquivo vazio ou maior que 15 MB")
    p = DADOS / "planos"
    p.mkdir(exist_ok=True)
    (p / nome).write_bytes(corpo)
    return {"ok": True, "nome": nome, "planos": planos()}


# ---------- iniciar com o computador (opcional: liga e desliga na aba Configurações, ou com --instalar / --desinstalar) ----------
SERVICO = "hunter-todo"
EXEC = {"fundo": False, "porta": 8642, "srv": None, "passou": False, "systemd": None}


def sistema():
    if sys.platform.startswith("win"):
        return "windows"
    return "mac" if sys.platform == "darwin" else "linux"


def tem_systemd():
    if EXEC["systemd"] is None:
        try:
            EXEC["systemd"] = subprocess.run(["systemctl", "--user", "show-environment"], capture_output=True, timeout=5).returncode == 0
        except (OSError, subprocess.SubprocessError):
            EXEC["systemd"] = False
    return EXEC["systemd"]


def comando_fundo():
    exe = Path(sys.executable)
    if sistema() == "windows" and exe.with_name("pythonw.exe").exists():
        exe = exe.with_name("pythonw.exe")   # sem janela de terminal
    return [str(exe), str(REPO / "servidor.py"), "--fundo", "--porta", str(EXEC["porta"]), "--dados", str(DADOS)] + (
        ["--todo", str(TODO_DIR)] if TODO_DIR != DADOS else [])


def arquivo_auto():
    so = sistema()
    if so == "windows":
        return Path(os.environ.get("APPDATA") or Path.home() / "AppData" / "Roaming") / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup" / f"{SERVICO}.vbs"
    if so == "mac":
        return Path.home() / "Library" / "LaunchAgents" / f"com.{SERVICO}.servidor.plist"
    if tem_systemd():
        return Path.home() / ".config" / "systemd" / "user" / f"{SERVICO}.service"
    return Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") / "autostart" / f"{SERVICO}.desktop"


def conteudo_auto(f):
    cmd = comando_fundo()
    if f.suffix == ".vbs":
        linha = " ".join('""' + x + '""' for x in cmd)
        return f'CreateObject("WScript.Shell").Run "{linha}", 0, False\r\n'
    if f.suffix == ".plist":
        from xml.sax.saxutils import escape
        args = "".join(f"<string>{escape(x)}</string>" for x in cmd)
        return ('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
                f'<plist version="1.0"><dict><key>Label</key><string>com.{SERVICO}.servidor</string><key>ProgramArguments</key><array>{args}</array>'
                '<key>RunAtLoad</key><true/><key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict></dict></plist>\n')
    aspas = lambda x: '"' + re.sub(r'(["\\`$])', r"\\\1", x).replace("%", "%%") + '"'
    exec_ = " ".join(aspas(x) for x in cmd)
    if f.suffix == ".service":
        return (f"[Unit]\nDescription=Hunter.todo (servidor local do jogo)\n\n[Service]\nExecStart={exec_}\nRestart=on-failure\nRestartSec=10\n\n"
                "[Install]\nWantedBy=default.target\n")
    return f"[Desktop Entry]\nType=Application\nName=Hunter.todo\nExec={exec_}\nNoDisplay=true\nX-GNOME-Autostart-enabled=true\n"


def systemctl(*args):
    r = subprocess.run(["systemctl", "--user", *args], capture_output=True, text=True, timeout=15)
    if r.returncode != 0:
        raise Erro(f"systemctl {' '.join(args)}: {(r.stderr or r.stdout).strip()[:200]}", 500)


def auto_ligado():
    return arquivo_auto().exists()


def auto_ligar():
    f = arquivo_auto()
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(conteudo_auto(f), encoding="utf-8")
    if f.suffix == ".service":
        systemctl("daemon-reload")
        systemctl("enable", f.name)


def auto_desligar():
    """Não derruba o servidor que está rodando agora (a página continua aberta); só deixa de iniciar com o computador."""
    f = arquivo_auto()
    if f.suffix == ".service" and f.exists():
        systemctl("disable", f.name)
    if f.exists():
        f.unlink()
    if f.suffix == ".service":
        systemctl("daemon-reload")


def iniciar_fundo():
    """Liga o servidor em segundo plano agora (a porta precisa estar livre)."""
    f = arquivo_auto()
    if f.suffix == ".service":
        return systemctl("start", "--no-block", f.name)
    if f.suffix == ".plist":
        subprocess.run(["launchctl", "load", "-w", str(f)], capture_output=True, timeout=15)
        return
    nulo = subprocess.DEVNULL
    if sistema() == "windows":
        subprocess.Popen(comando_fundo(), creationflags=0x00000008 | 0x00000200, close_fds=True, stdin=nulo, stdout=nulo, stderr=nulo)
    else:
        subprocess.Popen(comando_fundo(), start_new_session=True, stdin=nulo, stdout=nulo, stderr=nulo)


def passar_para_fundo():
    """O servidor do terminal sai e o de segundo plano assume a mesma porta: a página só precisa recarregar."""
    time.sleep(0.5)
    EXEC["passou"] = True
    EXEC["srv"].shutdown()   # main() libera a porta e liga o de segundo plano


def api_autostart(d):
    if d.get("ligar"):
        auto_ligar()
        if EXEC["fundo"]:
            return {"ok": True, "ligado": True, "msg": "Ligado: o servidor inicia sozinho com o computador."}
        threading.Thread(target=passar_para_fundo, daemon=True).start()
        return {"ok": True, "ligado": True, "recarregar": True,
                "msg": "Ligado: o servidor passou a rodar em segundo plano e inicia sozinho com o computador. Pode fechar a janela do terminal."}
    auto_desligar()
    return {"ok": True, "ligado": False, "msg": "Desligado: o servidor não inicia mais com o computador."
            + (" Este continua rodando até você reiniciar o PC." if EXEC["fundo"] else "")}


ROTAS = {"/api/act": api_act, "/api/add": api_add, "/api/undo": api_undo, "/api/config": api_config, "/api/ontem": api_ontem, "/api/denovo": api_denovo, "/api/autostart": api_autostart,
         "/api/jogo/nota": api_jogo_nota, "/api/jogo/planos": api_jogo_planos, "/api/jogo/narrada": api_jogo_narrada, "/api/jogo/ajuste": api_jogo_ajuste, "/api/jogo/estado": api_jogo_estado,
         "/api/cf/mao": api_cf_mao, "/api/ia/config": api_ia_config, "/api/ia/rodar": api_ia_rodar, "/api/ia/plano": api_ia_plano,
         "/api/conquistas": api_conquistas, "/api/atualizar": api_atualizar}
LIMITE = {"/api/conquistas": 20000, "/api/ia/rodar": 300000, "/api/ia/plano": 21_000_000, "/api/jogo/narrada": 40000, "/api/config": 90000, "/api/jogo/estado": 65536, "/api/jogo/planos": 130000}
ESTATICOS = {"/": ("index.html", "text/html; charset=utf-8"), "/index.html": ("index.html", "text/html; charset=utf-8"),
             "/motor.js": ("motor.js", "text/javascript; charset=utf-8"), "/guia.js": ("guia.js", "text/javascript; charset=utf-8"),
             "/demo.js": ("demo.js", "text/javascript; charset=utf-8"), "/chefes.js": ("chefes.js", "text/javascript; charset=utf-8"),
             "/ia.js": ("ia.js", "text/javascript; charset=utf-8"), "/conquistas.js": ("conquistas.js", "text/javascript; charset=utf-8"),
             "/novidades.js": ("novidades.js", "text/javascript; charset=utf-8")}


class H(BaseHTTPRequestHandler):
    server_version = "hunter-todo/" + VERSAO
    porta = 0

    def log_message(self, fmt, *a):
        pass   # silencioso; os erros aparecem pelo log()

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _arquivo(self, f, ctype, cache="no-cache"):
        if not f.is_file():
            return self._json(404, {"ok": False, "error": "arquivo não encontrado"})
        body = f.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache)
        self.end_headers()
        self.wfile.write(body)

    def _host_ok(self):
        # só aceita o próprio endereço: outra página aberta no navegador não consegue ler nem gravar seus dados
        return self.headers.get("Host", "") in (f"127.0.0.1:{self.porta}", f"localhost:{self.porta}")

    def do_GET(self):
        if not self._host_ok():
            return self._json(403, {"ok": False, "error": "host não permitido"})
        caminho = urllib.parse.unquote(self.path.split("?", 1)[0])
        if caminho in ESTATICOS:
            nome, ctype = ESTATICOS[caminho]
            return self._arquivo(WEB / nome, ctype)
        if caminho.startswith("/a/") and caminho.endswith(".png") and NOME_AV.match(caminho[3:-4]) and not caminho[3:].startswith("."):
            for p in pastas_avatares():
                if (p / caminho[3:]).is_file():
                    return self._arquivo(p / caminho[3:], "image/png", "max-age=3600")
            return self._json(404, {"ok": False, "error": "foto não encontrada"})
        if caminho == "/api/ping":
            return self._json(200, {"ok": True, "app": "hunter-todo", "versao": VERSAO, "pid": os.getpid()})
        if caminho == "/api/backup":
            try:
                corpo = backup()
            except OSError as e:
                log("erro no backup:", repr(e))
                return self._json(500, {"ok": False, "error": "não consegui ler a pasta de dados"})
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="hunter-todo-dados-{hoje().isoformat()}.zip"')
            self.send_header("Content-Length", str(len(corpo)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return self.wfile.write(corpo)
        if caminho == "/api/atualizacao":
            return self._json(200, api_atualizacao_get("agora" in urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)))
        if caminho in ("/api/ia", "/api/ia/rodar"):
            q = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
            try:
                return self._json(200, api_ia_get() if caminho == "/api/ia" else api_ia_tarefa((q.get("id") or [""])[0]))
            except Erro as e:
                return self._json(e.code, {"ok": False, "error": str(e)})
        if caminho == "/api/jogo":
            try:
                return self._json(200, api_jogo_get())
            except Exception as e:
                log("erro:", repr(e))
                return self._json(500, {"ok": False, "error": "erro interno (veja o terminal do servidor)"})
        self._json(404, {"ok": False, "error": "não encontrado"})

    def do_POST(self):
        if not self._host_ok():
            return self._json(403, {"ok": False, "error": "host não permitido"})
        origem = self.headers.get("Origin")
        if origem and origem not in (f"http://127.0.0.1:{self.porta}", f"http://localhost:{self.porta}"):
            return self._json(403, {"ok": False, "error": "origem não permitida"})
        if self.headers.get("X-Painel") != "1":
            return self._json(403, {"ok": False, "error": "cabeçalho X-Painel ausente"})
        fn = ROTAS.get(self.path)
        if not fn:
            return self._json(404, {"ok": False, "error": "não encontrado"})
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n > LIMITE.get(self.path, 8192):
                raise Erro("corpo grande demais", 413)
            dados = json.loads(self.rfile.read(n) or b"{}")
            if not isinstance(dados, dict):
                raise Erro("JSON inválido")
            self._json(200, fn(dados))
        except Erro as e:
            self._json(e.code, {"ok": False, "error": str(e)})
        except (ValueError, UnicodeDecodeError):
            self._json(400, {"ok": False, "error": "JSON inválido"})
        except Exception as e:
            log("erro:", repr(e))
            self._json(500, {"ok": False, "error": "erro interno (veja o terminal do servidor)"})


def comando():
    """Como a pessoa roda o servidor neste sistema, com o caminho completo (funciona de qualquer pasta)."""
    return f'{"py" if sistema() == "windows" else "python3"} "{REPO / "servidor.py"}"'


def boas_vindas(a, url):
    """Primeira vez num terminal: explica o que é o servidor e pergunta se ele inicia com o computador.
    Devolve True se o servidor já ficou rodando em segundo plano (não precisa abrir aqui)."""
    marca = DADOS / ".boas-vindas"
    if marca.exists() or a.fundo or not (sys.stdin and sys.stdin.isatty()):
        return False
    marca.write_text(time.strftime("%Y-%m-%d %H:%M") + "\n", encoding="utf-8")
    linha = "=" * 64
    print(f"""
{linha}
  Bem-vindo ao Hunter.todo {VERSAO}
{linha}
O jogo roda no seu computador. Este programa (o "servidor") guarda as suas
tarefas em {TODO_DIR}
e mostra o jogo no navegador, em {url}

Ele precisa estar ligado enquanto você joga. Você escolhe:
  - iniciar sempre com o computador, em segundo plano (recomendado):
    é só abrir o endereço acima quando quiser jogar;
  - ou rodar só quando quiser, deixando esta janela aberta.

Para mudar depois: aba Configurações do jogo, ou no terminal
  {comando()} --instalar      (inicia com o computador)
  {comando()} --desinstalar   (deixa de iniciar)
  {comando()} --help          (todas as opções)
{linha}""")
    try:
        r = input("Iniciar sempre com o computador? [S/n] ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        print()
        return False
    if r not in ("", "s", "sim", "y", "yes"):
        print("Certo: rode este mesmo comando quando quiser jogar.\n")
        return False
    try:
        auto_ligar()
        iniciar_fundo()
        for _ in range(20):
            if ja_rodando(a.porta):
                break
            time.sleep(0.25)
        else:
            raise OSError("o servidor em segundo plano não respondeu")
    except (Erro, OSError, subprocess.SubprocessError) as e:
        print(f"Não deu para iniciar em segundo plano ({e}). Seguindo nesta janela.\n")
        return False
    print(f"Pronto: o servidor está rodando em segundo plano e vai iniciar sozinho com o computador.\nAbra {url} (vale salvar nos favoritos). Pode fechar esta janela.")
    if not a.sem_navegador:
        webbrowser.open(url)
    return True


def ping(porta):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{porta}/api/ping", timeout=2) as r:
            j = json.load(r)
            return j if j.get("app") == "hunter-todo" else None
    except Exception:
        return None


def ja_rodando(porta):
    return ping(porta) is not None


def pid_na_porta(porta):
    """Quem escuta na porta (Linux e Mac), para trocar um servidor antigo que não informa o pid no /api/ping."""
    for cmd in (["ss", "-ltnpH", f"sport = :{porta}"], ["lsof", "-t", f"-iTCP:{porta}", "-sTCP:LISTEN"]):
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        except (OSError, subprocess.SubprocessError):
            continue
        m = re.search(r"pid=(\d+)", r.stdout) or re.match(r"\s*(\d+)", r.stdout)
        if m:
            return int(m.group(1))
    return None


def troca_antigo(porta, info):
    """Atualizou o jogo com o servidor antigo ainda ligado (em segundo plano): desliga o antigo para o novo assumir.
    Devolve True se a porta ficou livre (ou se o serviço já subiu com o código novo)."""
    log(f"servidor antigo ({info.get('versao')}) rodando na porta {porta}: trocando pelo {VERSAO}")
    f = arquivo_auto()
    try:
        if f.suffix == ".service" and f.exists():
            systemctl("restart", f.name)
        elif f.suffix == ".plist" and f.exists():
            subprocess.run(["launchctl", "kickstart", "-k", f"gui/{os.getuid()}/com.{SERVICO}.servidor"], capture_output=True, timeout=15)
        else:
            pid = info.get("pid") or pid_na_porta(porta)
            if not pid:
                return False
            if sistema() == "windows":
                subprocess.run(["taskkill", "/PID", str(pid), "/F"], capture_output=True, timeout=15)
            else:
                import signal
                os.kill(pid, signal.SIGTERM)
    except (Erro, OSError, subprocess.SubprocessError) as e:
        log("não consegui desligar o servidor antigo:", e)
        return False
    for _ in range(40):
        time.sleep(0.25)
        p = ping(porta)
        if p is None or p.get("versao") == VERSAO:
            return True
    return False


def vigia_codigo():
    """Atualizou o código (git pull, instalador) com o servidor ligado: ele se reinicia sozinho com o código novo."""
    f = REPO / "servidor.py"
    antes = f.stat().st_mtime
    while True:
        time.sleep(20)
        try:
            if f.stat().st_mtime != antes and not ia_lock.locked():
                compile(f.read_text(encoding="utf-8"), str(f), "exec")   # só troca se o arquivo novo estiver inteiro
                log("código novo do servidor: reiniciando")
                EXEC["recarregar"] = True
                EXEC["srv"].shutdown()
                return
        except (OSError, SyntaxError, ValueError):
            pass


def main():
    global DADOS, TODO_DIR
    ap = argparse.ArgumentParser(description="Hunter.todo: servidor local do jogo")
    ap.add_argument("--porta", type=int, default=int(os.environ.get("HUNTER_PORTA") or 8642))
    ap.add_argument("--dados", default=os.environ.get("HUNTER_DADOS") or str(Path.home() / ".hunter-todo"),
                    help="pasta dos seus dados (padrão: ~/.hunter-todo)")
    ap.add_argument("--todo", default=os.environ.get("HUNTER_TODO") or "",
                    help="pasta de um todo.txt que você já usa (padrão: a pasta de dados)")
    ap.add_argument("--sem-navegador", action="store_true", help="não abre o navegador")
    ap.add_argument("--instalar", action="store_true", help="passa a iniciar o servidor junto com o computador, em segundo plano")
    ap.add_argument("--desinstalar", action="store_true", help="deixa de iniciar junto com o computador")
    ap.add_argument("--fundo", action="store_true", help=argparse.SUPPRESS)   # usado pelo início automático
    a = ap.parse_args()
    if sys.version_info < (3, 8):
        sys.exit("Precisa do Python 3.8 ou mais novo.")
    DADOS = Path(a.dados).expanduser().resolve()
    DADOS.mkdir(parents=True, exist_ok=True)
    (DADOS / "avatares").mkdir(exist_ok=True)
    TODO_DIR = Path(a.todo).expanduser().resolve() if a.todo else DADOS
    if not TODO_DIR.is_dir():
        sys.exit(f"A pasta do --todo não existe: {TODO_DIR}")
    EXEC.update(porta=a.porta, fundo=a.fundo)
    url = f"http://127.0.0.1:{a.porta}/"
    if a.instalar or a.desinstalar:
        try:
            if a.desinstalar:
                auto_desligar()
                return print("Pronto: o Hunter.todo não inicia mais com o computador. Se ele estiver rodando agora, continua até você reiniciar.")
            auto_ligar()
            if ja_rodando(a.porta):
                return print(f"Pronto: o Hunter.todo vai iniciar sozinho a partir do próximo login. Agora ele já está em {url}")
            iniciar_fundo()
            return print(f"Pronto: o Hunter.todo está rodando em segundo plano em {url} e vai iniciar sozinho com o computador.")
        except (Erro, OSError, subprocess.SubprocessError) as e:
            sys.exit(f"Não deu: {e}")
    if a.fundo or sys.stdout is None:   # sem terminal (pythonw no Windows): o log vai para servidor.log na pasta de dados
        f = DADOS / "servidor.log"
        if f.exists() and f.stat().st_size > 1_000_000:
            f.unlink()
        sys.stdout = sys.stderr = open(f, "a", encoding="utf-8", buffering=1)
    for nome in ("todo.txt", "done.txt"):
        if not caminho(nome).exists():
            gravar_txt(nome, "")
    H.porta = a.porta
    antigo = ping(a.porta)
    if antigo and antigo.get("versao") != VERSAO and troca_antigo(a.porta, antigo) and ja_rodando(a.porta):
        print(f"Hunter.todo atualizado para a {VERSAO} (o servidor em segundo plano foi reiniciado): {url}")
        if not a.sem_navegador and not a.fundo:
            webbrowser.open(url)
        return
    if not ja_rodando(a.porta) and boas_vindas(a, url):
        return
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", a.porta), H)
    except OSError:
        if ja_rodando(a.porta):
            if a.fundo:
                sys.exit(0)
            print(f"O Hunter.todo já está rodando em {url}")
            if not a.sem_navegador:
                webbrowser.open(url)
            return
        sys.exit(f"A porta {a.porta} está ocupada por outro programa. Rode com outra: python3 servidor.py --porta 8643")
    EXEC["srv"] = srv
    threading.Thread(target=vigia_codigo, daemon=True).start()
    arruma_dia()
    print(f"Hunter.todo {VERSAO} ({VERSAO_NOME}) em {url}")
    print(f"Seus dados: {DADOS}" + (f" (tarefas em {TODO_DIR})" if TODO_DIR != DADOS else ""))
    if not a.fundo:
        print("Deixe esta janela aberta enquanto joga. Para parar: Ctrl+C.")
        if not auto_ligado():
            print(f"Dica: para não precisar abrir isto toda vez, ligue \"iniciar com o computador\" na aba Configurações ou rode {comando()} --instalar")
    if not a.sem_navegador and not a.fundo:
        threading.Timer(0.6, webbrowser.open, args=(url,)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nAté a próxima.")
        return
    if EXEC.get("recarregar"):
        srv.server_close()
        args = [a for a in sys.argv[1:] if a != "--sem-navegador"] + ["--sem-navegador"]
        os.execv(sys.executable, [sys.executable, str(REPO / "servidor.py")] + args)
    if EXEC["passou"]:
        srv.server_close()
        try:
            iniciar_fundo()
            print("O servidor passou a rodar em segundo plano. Pode fechar esta janela.")
        except Exception as e:
            sys.exit(f"Não consegui ligar o servidor em segundo plano ({e}). Rode de novo: python3 servidor.py")


if __name__ == "__main__":
    main()
