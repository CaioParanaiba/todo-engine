/* Hunter.todo · IA opcional. Dois jeitos, com os mesmos pedidos (prompt + os seus dados), explicados no IA.md (mantenha os
 * textos daqui e de lá iguais):
 *   copiar e colar: você cola o pedido numa IA qualquer (ChatGPT, Claude, Gemini...) e cola a resposta de volta;
 *   IA ligada (aba Regras → IA): o servidor chama o agente de terminal do jogador (Claude Code, Codex, Gemini CLI) com o
 *   mesmo pedido e a resposta cai no mesmo lugar. O agente só devolve texto; quem confere e grava é o jogo.
 * Pedidos:
 *   plano de ensino → avaliações do chefão (o editor do chefão, em chefes.js, recebe a resposta)
 *   caixa de entrada → o mesmo pedido, sem anexo, com os lembretes pendentes da disciplina
 *   carta narrada   → aba Book, Narradas (POST /api/jogo/narrada); com a IA ligada, as que faltam saem sozinhas ao abrir o jogo
 * Carregado depois de chefes.js: usa CTX, D, HOJE, TEMP, BOSSES, UI, estado, render, post, recarrega, esc, toast, tagDe.
 */
(function(){
'use strict';
const HJ = window.HJ, br = HJ.brData, F = () => HJ.fmtTxt();   // datas no formato que o jogador escolheu

document.head.insertAdjacentHTML('beforeend', `<style>
.ia-box{display:flex;flex-direction:column;gap:8px}
.ia-box textarea{min-height:110px;width:100%;background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:8px 10px;font:12.5px var(--f-mono);color:var(--ink);resize:vertical}
.ia-box .linha{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.ia-pop textarea{min-height:320px}
#ia-lote{margin-top:-6px}
#ia-lote summary{cursor:pointer;font:600 12px var(--f-mono);color:var(--soft);padding:4px 2px}
.ia-lote{display:flex;flex-direction:column;gap:6px;margin-top:12px}
.ia-lote>div{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:6px 0;border-top:1px solid var(--hair);font-size:13.5px}
.ia-lote small{color:var(--soft)}
.ia-ags{display:flex;flex-direction:column;gap:6px}
.ia-ags label{display:flex;flex-direction:row;align-items:center;gap:10px;text-transform:none;letter-spacing:0;font:14px var(--f-ui);color:var(--ink);padding:8px 10px;border:1px solid var(--hair);border-radius:9px}
.ia-ags label.off{opacity:.55}
.ia-ags label small{display:block;font:12px var(--f-ui);color:var(--soft)}
.ia-ags label .btn{margin-left:auto}
#ia-st{position:fixed;left:16px;bottom:16px;z-index:60;display:flex;gap:8px;align-items:center;padding:8px 12px;border-radius:999px;background:var(--panel);border:1px solid var(--hair);box-shadow:0 6px 20px rgba(0,0,0,.18);font:600 12.5px var(--f-mono);color:var(--ink);max-width:calc(100vw - 32px)}
#ia-st small{color:var(--soft);font-weight:400}
.ia-dot{width:8px;height:8px;border-radius:50%;background:var(--grn);animation:ia-p 1.2s ease-in-out infinite}
@keyframes ia-p{50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){.ia-dot{animation:none}}
</style>`);

/* ---------- copiar: área de transferência ou, se o navegador não deixar (arquivo aberto direto), uma janela para copiar à mão ---------- */
async function copia(txt, rotulo){
  try { await navigator.clipboard.writeText(txt); toast(`${rotulo} copiado <small>cole na IA que você usa</small>`); }
  catch(e){
    const bg = document.createElement('div'); bg.className = 'wz-bg'; bg.id = 'ia-pop';
    bg.innerHTML = `<div class="wz ia-pop"><div class="wz-body ia-box"><h3>${esc(rotulo)}</h3><p>Selecione tudo (Ctrl+A) e copie (Ctrl+C).</p><textarea readonly>${esc(txt)}</textarea>
      <div class="linha"><button type="button" class="btn v" data-iafecha style="margin-left:auto">fechar</button></div></div></div>`;
    document.body.appendChild(bg); const ta = bg.querySelector('textarea'); ta.focus(); ta.select();
  }
}

/* ---------- 1. plano de ensino → avaliações (a resposta entra no editor do chefão) ---------- */
const lembretes = d => (INBOX || []).filter(m => m.st !== 'ok' && new RegExp('\\b' + d + '\\b', 'i').test(m.t));
function promptPlano(d, semAnexo){
  const j = (CTX.JOG.disciplinas || []).find(x => x.d === d) || {}, av = (AVAL[d] || []);
  const pend = lembretes(d).map(m => '- ' + m.t);
  return [semAnexo ? `Atualize o plano de avaliação da disciplina ${d}${j.n ? ` (${j.n})` : ''} do meu jogo de tarefas com as mudanças que o professor avisou (no fim deste pedido).`
      : `Leia o plano de ensino em anexo e monte o plano de avaliação da disciplina ${d}${j.n ? ` (${j.n})` : ''} para o meu jogo de tarefas.`,
    `Semestre: ${br(TEMP.ini)} a ${br(TEMP.fim)}. Hoje: ${br(HOJE)}.`, '',
    'Responda SÓ com linhas neste formato, uma por avaliação, sem texto antes ou depois, sem tabela e sem markdown:',
    'chave | nome da avaliação | peso | data | palavra-chave | contínua', '',
    'Regras:',
    '- chave: de 1 a 8 letras ou números, sem espaço (ex.: P1, P2, T1, L).',
    '- peso: quanto a avaliação vale na nota final, em %, só o número. Os pesos somam 100. Se o plano usar fórmula (ex.: NF = 0,4·N1 + 0,6·N2, com N1 = média de P1 e T1), faça a conta para chegar ao peso de cada avaliação na nota final.',
    `- data: ${F()}. Sem data exata no plano, estime pela semana ou aula indicada e ponha ? no fim (ex.: ${br('2026-10-15')}?). Peso incerto também leva ? (ex.: 20?).`,
    '- palavra-chave: de 1 a 3 palavras que vão aparecer nas tarefas de estudo só dessa avaliação, separadas por vírgula (ex.: integral, derivada). Pode ficar vazia.',
    '- contínua: escreva contínua quando forem várias entregas que viram uma média (listas semanais, participação). Senão, deixe vazio.',
    '- Nota em pontos (ex.: a P1 vale 5 pontos de 10): o peso continua sendo quanto ela vale na nota final, e avise numa linha # quanto cada avaliação vale (eu lanço a nota como 4/5 e o jogo converte).',
    '- Recuperação, prova substitutiva e exame opcional ficam de fora.',
    '- Resolva sozinho o que dá para deduzir (fórmula, data pela semana, regra confusa): marque com ? e explique numa linha #. Se não der para fechar 100, mande as linhas mesmo assim e diga numa linha # o que falta.',
    '- Para me avisar de algo (dúvida, regra especial), use uma linha começando com #.',
    '', 'Exemplo de resposta:', `P1 | Prova 1 | 30 | ${br('2026-09-22')} | limite |`, `L | Listas | 20 | ${br('2026-11-30')} | lista | contínua`, `P2 | Prova 2 | 50 | ${br('2026-12-01')}? | |`,
  ].concat(av.length ? ['', 'Plano que está hoje no jogo (atualize-o com o plano de ensino e com as mudanças abaixo, se houver):',
      ...av.map(a => `${a.k} | ${a.n} | ${a.w}${a.real ? '' : '?'} | ${br(a.dt)}${a.real ? '' : '?'} | ${a.kw || ''} | ${a.cont ? 'contínua' : ''}`)] : [],
    pend.length ? ['', 'Mudanças que o professor avisou (anotadas na caixa de entrada):', ...pend] : []).join('\n');
}

/* ---------- 2. carta narrada (aba Book) ---------- */
const TAM = {semana:[90, 80], mes:[150, 160], semestre:[250, 300], ano:[400, 600]};
const NOME = {semana:'semana passada', mes:'mês passado', semestre:'semestre', ano:'ano passado'};
const ROT = {semana:'a semana', mes:'o mês', semestre:'o semestre', ano:'o ano'};
const ICS = 'int tra con esp man emi spider tower card flame moon island crown scroll';
const NIVEL = {semana:0, mes:1, semestre:2, ano:3};
const segISO = p => { const m = /^(\d{4})-W(\d\d)$/.exec(p || ''); if(!m) return ''; const j4 = `${m[1]}-01-04`; return HJ.addD(HJ.addD(j4, -HJ.dow(j4)), 7 * (+m[2] - 1)); };
const nomeTemp = () => TEMP.nome.replace('Temporada ', '');
/* o período de cada tipo que contém o dia ref */
function periodoDe(tipo, ref){
  if(tipo === 'semana'){ const ini = HJ.addD(ref, -HJ.dow(ref)); return {tipo, ini, fim:HJ.addD(ini, 6), periodo:HJ.semanaISO(ini)}; }
  if(tipo === 'mes'){ const ini = ref.slice(0, 8) + '01', [y, m] = ini.split('-').map(Number), prox = m === 12 ? `${y+1}-01-01` : `${y}-${String(m+1).padStart(2,'0')}-01`; return {tipo, ini, fim:HJ.addD(prox, -1), periodo:ini.slice(0, 7)}; }
  if(tipo === 'semestre') return {tipo, ini:TEMP.ini, fim:TEMP.fim, periodo:nomeTemp()};
  const y = ref.slice(0, 4); return {tipo, ini:`${y}-01-01`, fim:`${y}-12-31`, periodo:y};
}
/* o último período fechado (o da carta manual): semana passada, mês passado, o semestre depois do fim, ano passado */
function periodo(tipo){
  if(tipo === 'semana') return periodoDe(tipo, HJ.addD(HOJE, -HJ.dow(HOJE) - 7));
  if(tipo === 'mes') return periodoDe(tipo, HJ.addD(HOJE.slice(0, 8) + '01', -1));
  if(tipo === 'semestre') return periodoDe(tipo, HOJE);
  return periodoDe(tipo, `${+HOJE.slice(0, 4) - 1}-06-01`);
}
/* períodos já fechados (até ontem), do dia `de` em diante, que ainda não têm carta e tiveram alguma coisa feita.
   Regras fixas: a semana fecha na segunda, o mês no dia 1, o semestre no dia seguinte ao fim da temporada, o ano em 1º/jan. */
function faltando(de, ate){
  if(!de) return [];
  const tem = new Set((CTX.NARRADAS || []).map(c => c.tipo + ':' + c.periodo)), out = [], visto = new Set();
  const ativo = P => D.feitas.some(t => t.done >= P.ini && t.done <= P.fim) || String(CTX.NT_TXT || '').split('\n').some(l => { const d = l.split('|')[0].trim(); return d >= P.ini && d <= P.fim; });
  const add = P => { const k = P.tipo + ':' + P.periodo; if(visto.has(k)) return; visto.add(k);
    if(P.fim < HOJE && P.fim >= de && (!ate || P.fim < ate) && !tem.has(k) && PERIODO_OK[P.tipo].test(P.periodo) && ativo(P)) out.push(P); };
  for(let d = HJ.addD(de, -HJ.dow(de)); d < HOJE; d = HJ.addD(d, 7)) add(periodoDe('semana', d));
  for(let d = de.slice(0, 8) + '01'; d < HOJE; d = periodoDe('mes', d).fim, d = HJ.addD(d, 1)) add(periodoDe('mes', d));
  add(periodoDe('semestre', HOJE));
  for(let y = +de.slice(0, 4); y < +HOJE.slice(0, 4); y++) add(periodoDe('ano', `${y}-06-01`));
  return out.sort((a, b) => a.fim.localeCompare(b.fim) || NIVEL[a.tipo] - NIVEL[b.tipo]);
}
const PERIODO_OK = {semana:/^\d{4}-W\d\d$/, mes:/^\d{4}-\d\d$/, semestre:/^\d{4}-[12]$/, ano:/^\d{4}$/};
const primeiroDia = () => D.feitas.map(t => t.done).filter(Boolean).sort()[0] || HOJE;
function dadosPeriodo(P){
  const tipo = P.tipo, S = estado(), J = CTX.JOG, dentro = d => d && d >= P.ini && d <= P.fim, L = [];
  const feitas = D.feitas.filter(t => dentro(t.done)), rec = feitas.filter(t => HJ.isRec(t)), tarefas = feitas.filter(t => !HJ.isRec(t));
  const xp = Object.keys(S.xpDia || {}).filter(dentro).reduce((s, d) => s + S.xpDia[d], 0);
  const ativos = Object.keys(S.ten.st || {}).filter(d => dentro(d) && S.ten.st[d] === 'on').length;
  L.push(`Período: ${br(P.ini)} a ${br(P.fim)}. Jogador: ${J.nome || 'Hunter'}.`, `XP no período: ${xp}. Dias com o Ten ativo: ${ativos}.`
    + (HJ.addD(P.fim, 8) >= HOJE ? ` Ten hoje: ${S.ten.cur} dias (recorde ${S.ten.max}). Andar da Arena Celestial hoje: ${S.a.n}.` : ''));
  L.push('', `Tarefas concluídas (${tarefas.length}):`, ...tarefas.slice(0, 160).map(t => `- ${br(t.done)} · ${t.txt}${HJ.discOf(t, CTX) ? ` (${HJ.discOf(t, CTX)})` : ''}`));
  if(tarefas.length > 160) L.push(`- e mais ${tarefas.length - 160}`);
  const habs = {}; for(const t of rec){ const id = (t.rec || '').split(':')[0]; if(!id.startsWith('cf')) habs[id] = (habs[id] || 0) + 1; }
  if(Object.keys(habs).length) L.push('', 'Hábitos (vezes feitos):', ...Object.entries(habs).map(([id, n]) => `- ${((J.habitos || []).find(h => h.id === id) || {n:id}).n}: ${n}`));
  const cf = (D.cf && D.cf.por_dia) || {}, cfd = Object.keys(cf).filter(dentro);
  if(cfd.length) L.push('', `Codeforces: ${cfd.reduce((s, d) => s + cf[d], 0)} problemas aceitos em ${cfd.length} dias (meta de ${(J.cf && J.cf.meta) || 3} por dia batida em ${cfd.filter(d => cf[d] >= ((J.cf && J.cf.meta) || 3)).length}).`);
  const notas = String(CTX.NT_TXT || '').split('\n').map(l => l.split('|').map(x => x.trim())).filter(p => p.length >= 4 && dentro(p[0]));
  if(notas.length) L.push('', 'Notas lançadas:', ...notas.map(p => `- ${br(p[0])} · ${p[1]} ${p[2]}: ${p[3]}${/parcial/i.test(p[4] || '') ? ' (parcial)' : ''}`));
  if(tipo === 'semestre' || tipo === 'ano') L.push('', 'Chefões (disciplinas; vida = nota, cai com média 6):', ...S.bs.map(b => `- ${b.d} (${b.n}): ${HJ.numBR(b.pts).toFixed(1).replace('.', ',')}/100 pontos${b.dead ? ', derrotado' : ''}`));
  const baixo = {mes:'semana', semestre:'mes', ano:'semestre'}[tipo];
  const ini = c => c.tipo === 'semana' ? segISO(c.periodo) : c.tipo === 'mes' ? c.periodo + '-01' : c.escrita || '';
  const antes = (CTX.NARRADAS || []).filter(c => c.tipo === baixo && dentro(ini(c)));
  if(antes.length) L.push('', `Cartas ${({semana:'semanais', mes:'mensais', semestre:'semestrais'})[baixo]} deste período (parta delas):`, ...antes.map(c => `- ${c.periodo} · ${c.titulo}: ${c.texto}`));
  return L.join('\n');
}
function promptCarta(P){
  if(typeof P === 'string') P = periodo(P);
  const tipo = P.tipo, [tt, tc] = TAM[tipo];
  return [`Escreva uma carta narrada do meu jogo de tarefas (Hunter.todo, tema Hunter x Hunter) sobre ${ROT[tipo]} de ${br(P.ini)} a ${br(P.fim)}, com os fatos abaixo.`,
    'Responda SÓ com um objeto JSON, sem texto antes ou depois e sem markdown:',
    `{"tipo": "${tipo}", "periodo": "${P.periodo}", "titulo": "...", "ic": "...", "cronica": "...", "texto": "..."}`, '',
    'Regras:',
    `- texto: a parte factual, o que aconteceu, em tom sóbrio e caloroso. Até ${tt} palavras. Datas e números exatos, tirados dos dados.`,
    `- cronica: o mesmo período contado como um capítulo de Hunter x Hunter (Nen, Ten, Zetsu, a Arena Celestial, os chefões do Genei Ryodan). Pode dramatizar a forma, mas todo acontecimento citado é real e está nos dados. Até ${tc} palavras.`,
    '- titulo: curto e próprio.',
    `- ic: um destes ícones: ${ICS}.`,
    '- Nunca invente fato, sentimento ou motivo. Dia sem tarefa não quer dizer dia parado. Sem julgamento nem cobrança.',
    '- Separe parágrafos com \\n\\n dentro do JSON.',
    '', 'DADOS', dadosPeriodo(P)].join('\n');
}
/* resposta da IA → carta gravada no Book (tipo e período vêm do pedido, não da IA) */
async function gravaCarta(txt, P){
  const i = txt.indexOf('{'), j = txt.lastIndexOf('}');
  let c; try { c = JSON.parse(txt.slice(i, j + 1)); } catch(e){ throw new Error('a resposta não é o JSON da carta'); }
  await post('/api/jogo/narrada', {carta:{...c, tipo:P.tipo, periodo:P.periodo}});
}
function cartaHTML(){
  const tipos = ['semana', 'mes'].concat(HOJE > TEMP.fim ? ['semestre'] : [], ['ano']), sel = UI.iaTipo && tipos.includes(UI.iaTipo) ? UI.iaTipo : 'semana', P = periodo(sel);
  const ja = (CTX.NARRADAS || []).some(c => c.tipo === sel && c.periodo === P.periodo), lig = ligada();
  const novas = lig ? faltando(conf().desde || HOJE) : [], velhas = lig ? faltando(primeiroDia(), conf().desde || HOJE) : [];
  return `<div class="card ia-box" id="ia-carta" style="margin-top:14px"><h2><span class="c">~/</span>escrever carta com IA (opcional)</h2>
    ${lig ? `<p class="sub" style="margin:0">IA ligada (${esc(nomeAg())}): ${conf().cartas ? 'as cartas que faltam são escritas sozinhas quando você abre o jogo' : 'cartas automáticas desligadas na aba Regras'}. Também dá para pedir uma agora.</p>
      ${novas.length || velhas.length ? `<div class="linha">${novas.length ? `<button type="button" class="btn v" data-iafalta="novas">escrever as que faltam (${novas.length})</button>` : ''}${velhas.length ? `<button type="button" class="btn" data-iafalta="velhas">escrever cartas antigas (${velhas.length})</button><span class="sub">de antes de ligar a IA, desde ${br(primeiroDia())}</span>` : ''}</div>` : ''}`
      : `<p class="sub" style="margin:0">1. Escolha o período e copie o pedido: ele já vai com os seus fatos (tarefas, hábitos, notas, Codeforces). 2. Cole numa IA. 3. Cole a resposta aqui. Ou ligue a IA na aba Regras e ela escreve sozinha.</p>`}
    <div class="togg" style="margin:0">${tipos.map(t => `<button data-iatipo="${t}" aria-pressed="${t === sel}">${NOME[t]}</button>`).join('')}</div>
    <div class="linha">${lig ? `<button type="button" class="btn v" data-iaescreve${IA_RODA ? ' disabled' : ''}>escrever com IA · ${P.periodo}</button>` : ''}<button type="button" class="btn${lig ? '' : ' v'}" data-iacarta>copiar pedido · ${P.periodo}</button>${ja ? '<span class="sub">já existe uma carta deste período: a nova substitui</span>' : ''}</div>
    <textarea id="ia-cj" placeholder='cole aqui a resposta da IA: {"tipo": ..., "titulo": ..., "texto": ...}'></textarea>
    <div class="linha"><button type="button" class="btn" data-iacadd>adicionar carta</button></div></div>`;
}
async function addCarta(){
  const P = periodo(UI.iaTipo || 'semana');
  try { await gravaCarta(document.getElementById('ia-cj').value, P); await recarrega(); }
  catch(err){ toast('Não adicionou: ' + esc(err.message)); return; }
  UI.bk = 'claude'; UI.bksel = 'N-' + P.periodo; render(); toast('Carta adicionada ao Book');
}

/* ---------- IA ligada: o servidor chama o agente de terminal do jogador (aba Regras → IA) ---------- */
let IAS = null, IA_RODA = null;   // GET /api/ia (agentes achados, planos); o pedido rodando agora
const conf = () => Object.assign({agente:'chat', desde:'', cartas:true}, CTX.JOG.ia || {});
const ligada = () => !!CTX.SRV && conf().agente !== 'chat';
const nomeAg = () => ({claude:'Claude Code', codex:'Codex', gemini:'Gemini CLI'})[conf().agente] || conf().agente;
const espera = ms => new Promise(r => setTimeout(r, ms));
async function carregaIA(){
  try { const r = await fetch('/api/ia', {cache:'no-store'}); IAS = await r.json(); } catch(e){ IAS = {ok:false, error:SEM_SERVIDOR}; }
  return IAS;
}
/* manda o pedido, espera a resposta (o agente leva de segundos a minutos) e mostra o andamento no canto da tela */
async function rodaIA(pedido, rotulo, anexo, leve){
  const {id} = await post('/api/ia/rodar', {pedido, anexo: anexo || '', leve: !!leve});
  IA_RODA = {rotulo, ini:Date.now()}; status();
  try {
    for(;;){
      await espera(1500);
      let r; try { r = await (await fetch('/api/ia/rodar?id=' + id, {cache:'no-store'})).json(); } catch(e){ throw new Error(SEM_SERVIDOR); }
      if(!r.ok) throw new Error(r.error || 'erro');
      if(r.estado === 'pronto') return r.texto;
      if(r.estado === 'erro') throw new Error(r.erro);
    }
  } finally { IA_RODA = null; status(); }
}
function status(){
  let el = document.getElementById('ia-st');
  if(!IA_RODA){ if(el) el.remove(); clearInterval(status.t); status.t = 0; document.querySelectorAll('[data-iaescreve],[data-ceiarun],[data-iafalta],[data-iatesta],[data-ialertodos]').forEach(b => b.disabled = false); return; }
  if(!el){ el = document.createElement('div'); el.id = 'ia-st'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  const pinta = () => { if(IA_RODA) el.innerHTML = `<span class="ia-dot"></span>IA · ${esc(IA_RODA.rotulo)} <small>${Math.round((Date.now() - IA_RODA.ini) / 1000)}s</small>`; };
  pinta(); if(!status.t) status.t = setInterval(pinta, 1000);
  document.querySelectorAll('[data-iaescreve],[data-ceiarun],[data-iafalta],[data-iatesta],[data-ialertodos]').forEach(b => b.disabled = true);
}
/* escreve, uma por vez, as cartas da lista; para no primeiro erro (sem internet, login vencido) e tenta de novo na próxima abertura */
async function escreveCartas(lista){
  let ok = 0;
  for(const P of lista){
    try { await gravaCarta(await rodaIA(promptCarta(P), `carta ${P.periodo} (${ok + 1}/${lista.length})`), P); await recarrega(); ok++; }
    catch(err){ toast(`Carta ${P.periodo} não saiu <small>${esc(err.message)}</small>`); break; }
  }
  if(ok){ if(!document.querySelector('.wz-bg')) render(); toast(`${ok} carta(s) nova(s) no Book`); }
  return ok;
}
let autoFeito = false;
function autoCartas(){
  if(autoFeito || !ligada() || !conf().cartas || IA_RODA) return;
  autoFeito = true;
  const l = faltando(conf().desde || HOJE); if(l.length) escreveCartas(l);
}
async function escreveUma(){
  const P = periodo(UI.iaTipo || 'semana');
  try { await gravaCarta(await rodaIA(promptCarta(P), `carta ${P.periodo}`), P); await recarrega(); }
  catch(err){ toast('A IA não escreveu: ' + esc(err.message)); return; }
  UI.bk = 'claude'; UI.bksel = 'N-' + P.periodo; render(); toast('Carta adicionada ao Book');
}

/* ---------- aba Regras: ligar a IA ---------- */
function iaHTML(){
  if(!CTX.SRV) return '';
  const c = conf(), ags = (IAS && IAS.agentes) || [], achados = ags.filter(a => a.achado);
  const teste = UI.iaTeste || '';
  return `<div class="card wz" id="cfg-ia" style="box-shadow:none;border-radius:14px"><h2><span class="c">~/</span>IA · opcional</h2>
    <div class="wz-body ia-box" style="padding:4px 0 0">
      <p>O jogo funciona inteiro sem IA. Ligada, o próprio jogo chama a IA de terminal instalada neste computador para <b>ler planos de ensino</b>, <b>aplicar a caixa de entrada</b> e <b>escrever as cartas do Book</b>. Ela só devolve texto: planos e lembretes você confere antes de salvar. Os dados de cada pedido vão para a empresa da IA escolhida.</p>
      ${!IAS ? '<p class="sub">procurando as IAs instaladas...</p>' : !IAS.ok ? `<p class="sub">${esc(IAS.error || 'não deu para consultar o servidor')}</p>` : `
      <div class="ia-ags">
        <label><input type="radio" name="ia-ag" data-iaag="chat"${c.agente === 'chat' ? ' checked' : ''}> <span><b>Copiar e colar</b> <small>sem IA instalada: o jogo monta o pedido e você cola numa IA de chat</small></span></label>
        ${ags.map(a => `<label${a.achado ? '' : ' class="off"'}><input type="radio" name="ia-ag" data-iaag="${a.id}"${c.agente === a.id ? ' checked' : ''}${a.achado ? '' : ' disabled'}> <span><b>${esc(a.nome)}</b> <small>${a.achado ? 'encontrado neste computador' : 'não encontrado'}</small></span>${a.achado && c.agente === a.id ? `<button type="button" class="btn" data-iatesta${IA_RODA ? ' disabled' : ''}>testar</button>` : ''}</label>`).join('')}
      </div>
      ${achados.length ? '' : '<p class="sub">Nenhuma IA de terminal encontrada. Instale uma (Claude Code, Codex ou Gemini CLI), entre na conta pelo terminal e clique em <b>procurar de novo</b>.</p>'}
      ${teste ? `<p class="sub" role="status">${teste}</p>` : ''}
      <div class="linha"><label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font:14px var(--f-ui);color:var(--ink)"><input type="checkbox" data-iacartas${c.cartas ? ' checked' : ''}${c.agente === 'chat' ? ' disabled' : ''}> escrever sozinho as cartas do Book que faltam, ao abrir o jogo</label>
        <button type="button" class="btn" data-iaprocura style="margin-left:auto">procurar de novo</button></div>
      <p class="sub" style="margin:0">Planos de ensino: <span class="mono">${esc(IAS.pasta)}</span> · ${IAS.planos.length ? IAS.planos.length + ' arquivo(s)' : 'vazia'}. Ponha os PDFs lá ou envie pelo editor do chefão.</p>`}
    </div></div>`;
}
async function testa(){
  UI.iaTeste = ''; 
  try { const t = await rodaIA('Responda só com a palavra ok.', 'teste'); UI.iaTeste = `✓ ${esc(nomeAg())} respondeu: <span class="mono">${esc(t.slice(0, 60))}</span>`; }
  catch(err){ UI.iaTeste = `✗ ${esc(err.message)}`; }
  render();
}

/* ---------- plano de ensino: enviar o arquivo e rodar o pedido (usado pelo editor do chefão) ---------- */
function enviaPlano(file){
  return new Promise((ok, falha) => {
    if(file.size > 15e6){ falha(new Error('arquivo maior que 15 MB')); return; }
    const fr = new FileReader();
    fr.onload = async () => { try { const r = await post('/api/ia/plano', {nome:file.name, base64:String(fr.result).split(',')[1] || ''}); if(IAS) IAS.planos = r.planos; ok(r.nome); } catch(e){ falha(e); } };
    fr.onerror = () => falha(new Error('não consegui ler o arquivo')); fr.readAsDataURL(file);
  });
}
/* ---------- ler todos os planos (aba Chefões): a IA liga cada arquivo a uma disciplina e lê um por um ----------
   O resultado fica numa lista: "revisar e salvar" abre o editor do chefão com as linhas; disciplina nova abre o cadastro. */
let LOTE = null;   // {itens:[{arq, d, estado: fila|lendo|pronto|erro|salvo, texto, erro}], novas:[{arq, d, n}], fora:[arq], erro}
function promptMapa(arqs){
  const ds = BOSSES.map(b => { const j = (CTX.JOG.disciplinas || []).find(x => x.d === b.d) || {}; return `- ${b.d}${j.n ? ` (${j.n})` : ''}`; });
  return ['Estes arquivos são planos de ensino de um semestre. Leia cada um e diga a qual disciplina do meu jogo de tarefas ele corresponde.', '',
    'Disciplinas cadastradas:', ...(ds.length ? ds : ['- (nenhuma)']), '', 'Arquivos: ' + arqs.join(', '), '',
    'Responda SÓ com uma linha por arquivo, sem texto antes ou depois e sem markdown:',
    'arquivo | SIGLA', 'Se for de uma disciplina que não está na lista: arquivo | NOVA | sigla sugerida (2 a 6 letras, sem espaço) | nome da disciplina',
    'Se não for plano de ensino: arquivo | NADA'].join('\n');
}
async function lerTodos(){
  const arqs = (IAS && IAS.planos) || []; if(!arqs.length){ toast('A pasta planos está vazia'); return; }
  LOTE = {itens:[], novas:[], fora:[], erro:''}; render();
  let txt; try { txt = await rodaIA(promptMapa(arqs), `ligando ${arqs.length} plano(s) às disciplinas`, arqs); }
  catch(err){ LOTE.erro = err.message; render(); return; }
  for(const l of txt.split('\n')){
    const p = l.replace(/`/g, '').split('|').map(x => x.trim()); if(p.length < 2) continue;
    const arq = arqs.find(a => a === p[0] || a === p[0].replace(/^.*[\\/]/, '')); if(!arq) continue;
    const sig = p[1].toUpperCase();
    if(BOSSES.some(b => b.d === sig)) LOTE.itens.push({arq, d:sig, estado:'fila'});
    else if(sig === 'NOVA') LOTE.novas.push({arq, d:(p[2] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6), n:p[3] || ''});
    else LOTE.fora.push(arq);
  }
  if(!LOTE.itens.length && !LOTE.novas.length) LOTE.erro = 'a IA não ligou nenhum arquivo a uma disciplina';
  render();
  for(const it of LOTE.itens){
    it.estado = 'lendo'; render();
    try { it.texto = await planoIA(it.d, it.arq); it.estado = 'pronto'; } catch(err){ it.estado = 'erro'; it.erro = err.message; }
    render();
  }
}
function loteHTML2(){
  if(!ligada()) return '';
  const ps = (IAS && IAS.planos) || [], L = LOTE;
  const st = {fila:'na fila', lendo:'lendo...', pronto:'pronto para revisar', erro:'erro', salvo:'salvo'};
  return `<div class="card" id="ia-planos"><h2><span class="c">~/</span>planos de ensino · IA</h2>
    <p class="sub" style="margin:0 0 10px">${ps.length ? `${ps.length} arquivo(s) na pasta planos.` : 'A pasta planos está vazia: ponha os PDFs lá ou envie pelo editor de um chefão.'} A IA liga cada plano à disciplina e monta as avaliações; você revisa e salva cada uma.</p>
    <button type="button" class="btn v" data-ialertodos${!ps.length || IA_RODA ? ' disabled' : ''}>ler todos os planos</button>
    ${L ? `<div class="ia-lote">${L.erro ? `<p class="sub" style="color:var(--red)">${esc(L.erro)}</p>` : ''}
      ${L.itens.map((it, i) => `<div><span><b>${esc(it.d)}</b> <small>${esc(it.arq)} · ${st[it.estado]}${it.erro ? ': ' + esc(it.erro) : ''}</small></span>${it.estado === 'pronto' ? `<button type="button" class="btn" data-iarev="${i}">revisar e salvar</button>` : ''}</div>`).join('')}
      ${L.novas.map((it, i) => `<div><span><b>${esc(it.n || it.d)}</b> <small>${esc(it.arq)} · disciplina ainda não cadastrada</small></span><button type="button" class="btn" data-ianova="${i}">cadastrar ${esc(it.d)}</button></div>`).join('')}
      ${L.fora.length ? `<p class="sub">Não são planos de ensino: ${L.fora.map(esc).join(', ')}</p>` : ''}</div>` : ''}</div>`;
}
const planoIA = (d, anexo) => rodaIA(promptPlano(d, !anexo), anexo ? `lendo ${anexo}` : `lembretes de ${d}`, anexo);

/* ---------- colar várias tarefas de uma vez (Lista): uma por linha, à mão ou vindas de uma IA ---------- */
const loteHTML = () => `<details id="ia-lote" class="card"${UI.iaLote ? ' open' : ''}><summary>colar várias tarefas de uma vez (ex.: resposta de uma IA)</summary><div class="ia-box" style="margin-top:8px">
  <p class="sub" style="margin:0">Uma tarefa por linha, no formato da Lista (<span class="mono">+fac.SIGLA</span>, tags, <span class="mono">due:${F()}</span>).</p>
  <textarea id="ia-tl" placeholder="Revisar regra da cadeia +fac.CALC2 @estudo&#10;(A) Entregar lista 3 +fac.CALC2 @entrega due:${br('2026-10-15')}"></textarea>
  <div class="linha"><button type="button" class="btn v" data-iatadd style="margin-left:auto">adicionar todas</button></div></div></details>`;
async function addTarefas(){
  const ls = document.getElementById('ia-tl').value.split('\n').map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').replace(/`/g, '').trim()).filter(l => l && !l.startsWith('#'));
  if(!ls.length) return;
  let ok = 0; const erros = [];
  for(const l of ls){ try { await post('/api/add', {text:l}); ok++; } catch(e){ erros.push(`${l.slice(0, 40)}: ${e.message}`); } }
  await recarrega(); UI.iaLote = !!erros.length; render();
  if(!erros.length) document.getElementById('ia-tl').value = '';
  toast(`${ok} tarefa(s) adicionada(s)` + (erros.length ? `<small>${esc(erros.join(' · '))}</small>` : ''));
}

/* ---------- encaixe nas abas ---------- */
const rBK0 = RENDER.bk, rL0 = RENDER.l, rSys0 = RENDER.sys;
RENDER.bk = S => { rBK0(S); const v = document.getElementById('ia-carta'); if(v) v.remove(); if(UI.bk === 'claude') document.getElementById('bk-det').insertAdjacentHTML('beforeend', cartaHTML()); };
RENDER.l = S => { rL0(S); const v = document.getElementById('ia-lote'); if(v) v.remove(); document.getElementById('l-add').insertAdjacentHTML('afterend', loteHTML()); };
const rB2i = RENDER.b2;
RENDER.b2 = S => { rB2i(S); const v = document.getElementById('ia-planos'); if(v) v.remove(); const a = document.getElementById('b2-inbox'); if(a) a.insertAdjacentHTML('beforebegin', loteHTML2()); };
RENDER.sys = S => { rSys0(S); const v = document.getElementById('cfg-ia'); if(v) v.remove(); const a = document.getElementById('cfg-srv') || document.getElementById('cfg');
  if(a) a.insertAdjacentHTML('afterend', iaHTML()); if(!IAS && CTX.SRV) carregaIA().then(() => { if(cur === 'sys') render(); }); };
async function salvaConf(d){
  try { const r = await post('/api/ia/config', d); CTX.JOG.ia = r.conf; } catch(err){ toast('Não salvou: ' + esc(err.message)); }
  UI.iaTeste = ''; render();
}
document.addEventListener('change', e => {
  const ag = e.target.closest('[data-iaag]'); if(ag){ salvaConf({agente:ag.dataset.iaag}); return; }
  if(e.target.matches('[data-iacartas]')) salvaConf({cartas:e.target.checked});
});
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  if(q('[data-iafecha]')){ document.getElementById('ia-pop').remove(); return; }
  const tp = q('[data-iatipo]'); if(tp){ UI.iaTipo = tp.dataset.iatipo; render(); return; }
  if(q('[data-iacarta]')){ copia(promptCarta(UI.iaTipo || 'semana'), 'Pedido da carta'); return; }
  if(q('[data-iacadd]')){ addCarta(); return; }
  if(q('[data-iaescreve]')){ escreveUma(); return; }
  const fa = q('[data-iafalta]'); if(fa){ escreveCartas(fa.dataset.iafalta === 'novas' ? faltando(conf().desde || HOJE) : faltando(primeiroDia(), conf().desde || HOJE)); return; }
  if(q('[data-iatesta]')){ testa(); return; }
  if(q('[data-ialertodos]')){ lerTodos(); return; }
  const rv = q('[data-iarev]'); if(rv){ const it = LOTE.itens[+rv.dataset.iarev]; window.HJ_CHEFES.abre(it.d); window.HJ_CHEFES.cola(it.texto, () => { it.estado = 'salvo'; }); return; }
  const nv = q('[data-ianova]'); if(nv){ const it = LOTE.novas[+nv.dataset.ianova]; window.HJ_GUIA.abreDisciplinas({d:it.d, n:it.n}); return; }
  if(q('[data-iaprocura]')){ IAS = null; render(); carregaIA().then(() => render()); return; }
  if(q('[data-iatadd]')){ addTarefas(); return; }
  if(q('#ia-lote summary')){ UI.iaLote = !document.getElementById('ia-lote').open; }
});
window.HJ_IA = {promptPlano, promptCarta, copia, ligada, nomeAg, rodaIA, planoIA, enviaPlano, carregaIA, lembretes, planos: () => (IAS && IAS.planos) || [], rodando: () => !!IA_RODA};
if(CTX) tab(cur);
(function tenta(){ if(!CTX){ setTimeout(tenta, 500); return; } if(CTX.SRV) carregaIA(); autoCartas(); })();
})();
