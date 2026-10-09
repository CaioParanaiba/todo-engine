#!/usr/bin/env python3
"""Hunter.todo · servidor local do jogo. Só a biblioteca padrão do Python 3.8+ (Linux, Windows e Mac).

Uso:  python3 servidor.py [--porta 8642] [--dados PASTA] [--sem-navegador]

Serve a página do jogo (web/) em http://127.0.0.1:PORTA/ e grava os dados do jogador numa pasta separada do código
(padrão ~/.hunter-todo/, ou a variável HUNTER_DADOS). Atualizar o código (git pull ou ZIP novo) nunca mexe nela:
  todo.txt, done.txt        tarefas no formato todo.txt (as concluídas de dias anteriores vão para o done.txt)
  jogador.json              nome, tags, hábitos, disciplinas e Codeforces (o assistente da primeira entrada grava)
  avaliacoes.txt, notas.txt plano de avaliação das disciplinas e notas lançadas
  estado.json               loja, carteira e o que está equipado
  ajustes.txt, narradas.json caixa de entrada e cartas narradas (opcionais)
  avatares/*.png            fotos de perfil extras
  cf.json                   cache do Codeforces (problemas aceitos por dia)

Rotas (as mesmas que web/demo.js simula no modo demonstração):
  GET  /api/jogo                          tudo o que a página precisa
  POST /api/act   {raw, action, value?}   done | reopen | delete | up | down | d1 | d7 | a1 | hoje | amanha | rmdue | setdate | edit
  POST /api/add   {text}                  linha no formato todo.txt; due:hoje|amanha|+N|DD/MM|AAAA-MM-DD
  POST /api/undo  {}                      desfaz a última operação deste servidor
  POST /api/config {jogador, avaliacoes?} grava jogador.json (e avaliacoes.txt) e refaz os hábitos de hoje
  POST /api/jogo/nota {disc, aval, nota, parcial?} · /api/jogo/ajuste {texto} · /api/jogo/estado {estado}

Todo dia o servidor cria as recorrentes de hoje (um hábito por linha, rec:ID:DATA, e a do Codeforces se houver handle),
tira as que ficaram abertas de dias anteriores e conclui sozinho a do Codeforces quando a meta do dia é batida.
"""
import argparse
import json
import os
import re
import sys
import threading
import time
import urllib.parse
import urllib.request
import webbrowser
from datetime import date, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

VERSAO = "0.1"
REPO = Path(__file__).resolve().parent
WEB = REPO / "web"
DADOS = Path()   # definido em main()
lock = threading.RLock()
undo_stack = []


class Erro(Exception):
    def __init__(self, msg, code=400):
        super().__init__(msg)
        self.code = code


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


# ---------- arquivos ----------
def ler_txt(nome):
    f = DADOS / nome
    return f.read_text(encoding="utf-8") if f.exists() else ""


def gravar_txt(nome, texto):
    """Grava num .tmp e troca de uma vez: um corte de energia nunca deixa o arquivo pela metade."""
    f = DADOS / nome
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


def ler():
    t = ler_txt("todo.txt")
    linhas = t.replace("\r\n", "\n").split("\n")
    if linhas[-1] != "":
        linhas.append("")
    return linhas


def gravar(linhas):
    gravar_txt("todo.txt", "\n".join(linhas))


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
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})", s)
    if m:
        try:
            d = date(hoje().year, int(m.group(2)), int(m.group(1)))
        except ValueError:
            return None
        return d if d >= hoje() - timedelta(days=30) else d.replace(year=d.year + 1)
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
        return (m.group(1) or "") + (m.group(2) or "") + limpa(value or "")
    if action in ("up", "down"):
        m = PRI.match(line)
        i = ORDEM.index(m.group(1) if m else None)
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


def montar(texto):
    """Texto digitado -> linha do todo.txt (prioridade, data de criação, resto com due normalizado)."""
    texto = limpa(texto)
    m = re.match(r"^\(([A-Za-z])\)\s+", texto)
    pri = m.group(1).upper() if m else None
    if m:
        texto = texto[m.end():]
    palavras = []
    for w in texto.split():
        d = re.fullmatch(r"due:(\S+)", w, re.I)
        if d:
            dt = parse_data(d.group(1))
            if dt is None:
                raise Erro(f"data inválida em {w}")
            w = f"due:{dt.isoformat()}"
        palavras.append(w)
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
        linhas = ler()
        if op["to"] is None:   # desfaz uma exclusão: a linha volta para o fim do arquivo
            if op["from"] in linhas:
                raise Erro("a linha já existe no todo.txt; não deu para desfazer", 409)
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
        gravar(linhas)
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
    return [h for h in (j.get("habitos") or []) if isinstance(h, dict) and ID_HAB.match(str(h.get("id", ""))) and str(h.get("n", "")).strip()]


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


def recorrentes_do_dia(linhas, j, refazer=False):
    """Deixa o todo.txt com as recorrentes de hoje. Concluídas de dias anteriores vão para o done.txt e recorrentes que
    ficaram abertas de dias anteriores saem (hábito perdido não pune: só não conta). Com refazer=True (a configuração mudou),
    os hábitos de hoje são recriados com os nomes novos, e os que já estavam marcados continuam marcados.
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
    for h in habs:
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
        arquivo = recorrentes_do_dia(linhas, jogador(), refazer)
        if arquivo:
            t = ler_txt("done.txt")
            gravar_txt("done.txt", t + ("" if not t or t.endswith("\n") else "\n") + "\n".join(arquivo) + "\n")
        if linhas != antes:
            gravar(linhas)
            if arquivo or refazer:
                undo_stack.clear()   # as linhas mudaram de lugar: desfazer antigo não vale mais


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
            cache = {"handle": cf["handle"], "por_dia": conta, "auto": cache.get("auto") if cache.get("handle") == cf["handle"] else None}
            gravar_json("cf.json", cache)
        cf_auto_conclui(cf, conta)
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
        gravar_json("cf.json", cache)


def cf_leitura(j):
    cf = cf_conf(j)
    if not cf:
        return None
    if time.time() - cf_vivo["t"] > 600 and not cf_vivo["rodando"]:
        cf_vivo["rodando"] = True
        threading.Thread(target=cf_atualiza, args=(cf,), daemon=True).start()
    cache = ler_json("cf.json", {})
    return {"handle": cf["handle"], "por_dia": cache.get("por_dia", {}) if cache.get("handle") == cf["handle"] else {}}


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
    estado = ler_json("estado.json", {})
    with lock:
        todo, done = ler(), ler_txt("done.txt").split("\n")
    return {"ok": True, "hoje": hoje().isoformat(), "todo": todo, "done": done, "avaliacoes": ler_txt("avaliacoes.txt"),
            "notas": ler_txt("notas.txt"), "ajustes": ler_txt("ajustes.txt"), "estado": estado if isinstance(estado, dict) else {},
            "cf": cf, "avatares": avatares(), "narradas": narradas if isinstance(narradas, list) else [], "jogador": j}


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
    t = " ".join(str(d.get("texto", "")).split()).replace("|", "/")
    if not 1 <= len(t) <= 500:
        raise Erro("escreva de 1 a 500 caracteres")
    return acrescenta("ajustes.txt", f"{time.strftime('%Y-%m-%d %H:%M')} | pendente | {t}")


def api_jogo_estado(d):
    e = d.get("estado")
    if not isinstance(e, dict):
        raise Erro("estado inválido")
    ok = {"spent": (int, float), "cofreUsado": (int, float), "own": list, "resg": list, "bought": dict, "usados": dict, "usos": list,
          "equip": dict, "tour": dict}
    for k, v in e.items():
        if k not in ok or not isinstance(v, ok[k]):
            raise Erro(f"campo inválido no estado: {k}")
    corpo = json.dumps(e, ensure_ascii=False, indent=1)
    if len(corpo) > 60000:
        raise Erro("estado grande demais", 413)
    with lock:
        gravar_txt("estado.json", corpo + "\n")
    return {"ok": True}


ROTAS = {"/api/act": api_act, "/api/add": api_add, "/api/undo": api_undo, "/api/config": api_config,
         "/api/jogo/nota": api_jogo_nota, "/api/jogo/ajuste": api_jogo_ajuste, "/api/jogo/estado": api_jogo_estado}
LIMITE = {"/api/config": 90000, "/api/jogo/estado": 65536}
ESTATICOS = {"/": ("index.html", "text/html; charset=utf-8"), "/index.html": ("index.html", "text/html; charset=utf-8"),
             "/motor.js": ("motor.js", "text/javascript; charset=utf-8"), "/guia.js": ("guia.js", "text/javascript; charset=utf-8"),
             "/demo.js": ("demo.js", "text/javascript; charset=utf-8")}


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
            return self._json(200, {"ok": True, "app": "hunter-todo", "versao": VERSAO})
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


def ja_rodando(porta):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{porta}/api/ping", timeout=2) as r:
            return json.load(r).get("app") == "hunter-todo"
    except Exception:
        return False


def main():
    global DADOS
    ap = argparse.ArgumentParser(description="Hunter.todo: servidor local do jogo")
    ap.add_argument("--porta", type=int, default=int(os.environ.get("HUNTER_PORTA") or 8642))
    ap.add_argument("--dados", default=os.environ.get("HUNTER_DADOS") or str(Path.home() / ".hunter-todo"),
                    help="pasta dos seus dados (padrão: ~/.hunter-todo)")
    ap.add_argument("--sem-navegador", action="store_true", help="não abre o navegador")
    a = ap.parse_args()
    if sys.version_info < (3, 8):
        sys.exit("Precisa do Python 3.8 ou mais novo.")
    DADOS = Path(a.dados).expanduser().resolve()
    DADOS.mkdir(parents=True, exist_ok=True)
    (DADOS / "avatares").mkdir(exist_ok=True)
    for nome in ("todo.txt", "done.txt"):
        if not (DADOS / nome).exists():
            gravar_txt(nome, "")
    url = f"http://127.0.0.1:{a.porta}/"
    H.porta = a.porta
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", a.porta), H)
    except OSError:
        if ja_rodando(a.porta):
            print(f"O Hunter.todo já está rodando em {url}")
            if not a.sem_navegador:
                webbrowser.open(url)
            return
        sys.exit(f"A porta {a.porta} está ocupada por outro programa. Rode com outra: python3 servidor.py --porta 8643")
    arruma_dia()
    print(f"Hunter.todo {VERSAO} em {url}")
    print(f"Seus dados: {DADOS}")
    print("Deixe esta janela aberta enquanto joga. Para parar: Ctrl+C.")
    if not a.sem_navegador:
        threading.Timer(0.6, webbrowser.open, args=(url,)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nAté a próxima.")


if __name__ == "__main__":
    main()
