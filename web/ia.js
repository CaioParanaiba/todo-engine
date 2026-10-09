/* Hunter.todo · IA opcional, sem automação: o jogo monta o pedido (prompt + os seus dados), você cola numa IA qualquer
 * (ChatGPT, Claude, Gemini...) e cola a resposta de volta no jogo. Nada sai do computador sozinho.
 * Três pedidos, explicados no IA.md (mantenha os textos daqui e de lá iguais):
 *   plano de ensino → avaliações do chefão (o editor do chefão, em chefes.js, recebe a resposta)
 *   carta narrada   → aba Book, Narradas (POST /api/jogo/narrada)
 *   aula → tarefas  → Lista, "colar várias tarefas" (POST /api/add, uma por linha)
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
#ia-aula{margin-top:-6px}
#ia-aula summary{cursor:pointer;font:600 12px var(--f-mono);color:var(--soft);padding:4px 2px}
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
function promptPlano(d){
  const j = (CTX.JOG.disciplinas || []).find(x => x.d === d) || {}, av = (AVAL[d] || []);
  const pend = (INBOX || []).filter(m => m.st !== 'ok' && new RegExp('\\b' + d + '\\b', 'i').test(m.t)).map(m => '- ' + m.t);
  return [`Leia o plano de ensino em anexo e monte o plano de avaliação da disciplina ${d}${j.n ? ` (${j.n})` : ''} para o meu jogo de tarefas.`,
    `Semestre: ${br(TEMP.ini)} a ${br(TEMP.fim)}. Hoje: ${br(HOJE)}.`, '',
    'Responda SÓ com linhas neste formato, uma por avaliação, sem texto antes ou depois, sem tabela e sem markdown:',
    'chave | nome da avaliação | peso | data | palavra-chave | contínua', '',
    'Regras:',
    '- chave: de 1 a 8 letras ou números, sem espaço (ex.: P1, P2, T1, L).',
    '- peso: quanto a avaliação vale na nota final, em %, só o número. Os pesos somam 100. Se o plano usar fórmula (ex.: NF = 0,4·N1 + 0,6·N2, com N1 = média de P1 e T1), faça a conta para chegar ao peso de cada avaliação na nota final.',
    `- data: ${F()}. Sem data exata no plano, estime pela semana ou aula indicada e ponha ? no fim (ex.: ${br('2026-10-15')}?). Peso incerto também leva ? (ex.: 20?).`,
    '- palavra-chave: de 1 a 3 palavras que vão aparecer nas tarefas de estudo só dessa avaliação, separadas por vírgula (ex.: integral, derivada). Pode ficar vazia.',
    '- contínua: escreva contínua quando forem várias entregas que viram uma média (listas semanais, participação). Senão, deixe vazio.',
    '- Recuperação, prova substitutiva e exame opcional ficam de fora.',
    '- Para me avisar de algo (dúvida, regra especial), use uma linha começando com #.',
    '', 'Exemplo de resposta:', `P1 | Prova 1 | 30 | ${br('2026-09-22')} | limite |`, `L | Listas | 20 | ${br('2026-11-30')} | lista | contínua`, `P2 | Prova 2 | 50 | ${br('2026-12-01')}? | |`,
  ].concat(av.length ? ['', 'Plano que está hoje no jogo (atualize-o com o plano de ensino e com as mudanças abaixo, se houver):',
      ...av.map(a => `${a.k} | ${a.n} | ${a.w}${a.real ? '' : '?'} | ${br(a.dt)}${a.real ? '' : '?'} | ${a.kw || ''} | ${a.cont ? 'contínua' : ''}`)] : [],
    pend.length ? ['', 'Mudanças que o professor avisou (anotadas na caixa de entrada):', ...pend] : []).join('\n');
}

/* ---------- 2. carta narrada (aba Book) ---------- */
const TAM = {semana:[90, 80], mes:[150, 160], semestre:[250, 300], ano:[400, 600]};
const NOME = {semana:'semana passada', mes:'mês passado', semestre:'semestre', ano:'ano passado'};
const DO = {semana:'a semana passada', mes:'o mês passado', semestre:'o semestre', ano:'o ano passado'};
const ICS = 'int tra con esp man emi spider tower card flame moon island crown scroll';
const segISO = p => { const m = /^(\d{4})-W(\d\d)$/.exec(p || ''); if(!m) return ''; const j4 = `${m[1]}-01-04`; return HJ.addD(HJ.addD(j4, -HJ.dow(j4)), 7 * (+m[2] - 1)); };
function periodo(tipo){
  if(tipo === 'semana'){ const ini = HJ.addD(HOJE, -HJ.dow(HOJE) - 7); return {ini, fim:HJ.addD(ini, 6), periodo:HJ.semanaISO(ini)}; }
  if(tipo === 'mes'){ const [y, m] = HOJE.split('-').map(Number), ini = m === 1 ? `${y-1}-12-01` : `${y}-${String(m-1).padStart(2,'0')}-01`; return {ini, fim:HJ.addD(HOJE.slice(0,8) + '01', -1), periodo:ini.slice(0,7)}; }
  if(tipo === 'semestre') return {ini:TEMP.ini, fim:TEMP.fim, periodo:TEMP.nome.replace('Temporada ', '')};
  const y = +HOJE.slice(0,4) - 1; return {ini:`${y}-01-01`, fim:`${y}-12-31`, periodo:String(y)};
}
function dadosPeriodo(tipo, P){
  const S = estado(), J = CTX.JOG, dentro = d => d && d >= P.ini && d <= P.fim, L = [];
  const feitas = D.feitas.filter(t => dentro(t.done)), rec = feitas.filter(t => HJ.isRec(t)), tarefas = feitas.filter(t => !HJ.isRec(t));
  const xp = Object.keys(S.xpDia || {}).filter(dentro).reduce((s, d) => s + S.xpDia[d], 0);
  const ativos = Object.keys(S.ten.st || {}).filter(d => dentro(d) && S.ten.st[d] === 'on').length;
  L.push(`Período: ${br(P.ini)} a ${br(P.fim)}. Jogador: ${J.nome || 'Hunter'}.`, `XP no período: ${xp}. Dias com o Ten ativo: ${ativos}. Ten hoje: ${S.ten.cur} dias (recorde ${S.ten.max}). Andar da Arena Celestial hoje: ${S.a.n}.`);
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
function promptCarta(tipo){
  const P = periodo(tipo), [tt, tc] = TAM[tipo];
  return [`Escreva uma carta narrada do meu jogo de tarefas (Hunter.todo, tema Hunter x Hunter) sobre ${DO[tipo]} (${br(P.ini)} a ${br(P.fim)}), com os fatos abaixo.`,
    'Responda SÓ com um objeto JSON, sem texto antes ou depois e sem markdown:',
    `{"tipo": "${tipo}", "periodo": "${P.periodo}", "titulo": "...", "ic": "...", "cronica": "...", "texto": "..."}`, '',
    'Regras:',
    `- texto: a parte factual, o que aconteceu, em tom sóbrio e caloroso. Até ${tt} palavras. Datas e números exatos, tirados dos dados.`,
    `- cronica: o mesmo período contado como um capítulo de Hunter x Hunter (Nen, Ten, Zetsu, a Arena Celestial, os chefões do Genei Ryodan). Pode dramatizar a forma, mas todo acontecimento citado é real e está nos dados. Até ${tc} palavras.`,
    '- titulo: curto e próprio.',
    `- ic: um destes ícones: ${ICS}.`,
    '- Nunca invente fato, sentimento ou motivo. Dia sem tarefa não quer dizer dia parado. Sem julgamento nem cobrança.',
    '- Separe parágrafos com \\n\\n dentro do JSON.',
    '', 'DADOS', dadosPeriodo(tipo, P)].join('\n');
}
function cartaHTML(){
  const tipos = ['semana', 'mes'].concat(HOJE > TEMP.fim ? ['semestre'] : [], ['ano']), sel = UI.iaTipo && tipos.includes(UI.iaTipo) ? UI.iaTipo : 'semana', P = periodo(sel);
  const ja = (CTX.NARRADAS || []).some(c => c.tipo === sel && c.periodo === P.periodo);
  return `<div class="card ia-box" id="ia-carta" style="margin-top:14px"><h2><span class="c">~/</span>escrever carta com IA (opcional)</h2>
    <p class="sub" style="margin:0">1. Escolha o período e copie o pedido: ele já vai com os seus fatos (tarefas, hábitos, notas, Codeforces). 2. Cole numa IA. 3. Cole a resposta aqui.</p>
    <div class="togg" style="margin:0">${tipos.map(t => `<button data-iatipo="${t}" aria-pressed="${t === sel}">${NOME[t]}</button>`).join('')}</div>
    <div class="linha"><button type="button" class="btn v" data-iacarta>copiar pedido · ${P.periodo}</button>${ja ? '<span class="sub">já existe uma carta deste período: a nova substitui</span>' : ''}</div>
    <textarea id="ia-cj" placeholder='cole aqui a resposta da IA: {"tipo": ..., "titulo": ..., "texto": ...}'></textarea>
    <div class="linha"><button type="button" class="btn" data-iacadd>adicionar carta</button></div></div>`;
}
async function addCarta(){
  const txt = document.getElementById('ia-cj').value, i = txt.indexOf('{'), j = txt.lastIndexOf('}');
  let c; try { c = JSON.parse(txt.slice(i, j + 1)); } catch(e){ toast('Não entendi a resposta: cole só o JSON que a IA mandou'); return; }
  const tipo = UI.iaTipo || 'semana', P = periodo(tipo);
  try { await post('/api/jogo/narrada', {carta:{...c, tipo, periodo:P.periodo}}); await recarrega(); }
  catch(err){ toast('Não adicionou: ' + esc(err.message)); return; }
  UI.bk = 'claude'; UI.bksel = 'N-' + P.periodo; render(); toast('Carta adicionada ao Book');
}

/* ---------- 3. aula → tarefas (Lista) ---------- */
function promptAula(){
  const discs = BOSSES.map(b => { const j = (CTX.JOG.disciplinas || []).find(x => x.d === b.d) || {}; return `${b.d}${j.n ? ' (' + j.n + ')' : ''}`; }).join(', ');
  return ['Abaixo estão as minhas anotações de uma aula. Transforme em tarefas para a minha lista no formato todo.txt.',
    `Hoje: ${br(HOJE)}. Minhas disciplinas: ${discs || 'nenhuma cadastrada'}.`, '',
    'Responda SÓ com as tarefas, uma por linha, sem numeração, sem marcadores e sem texto antes ou depois.',
    `Formato: (A) texto da tarefa +fac.SIGLA tag due:${F()}`, '',
    'Regras:',
    `- tag: ${tagDe('ent') || '@entrega'} para entregas (trabalho, lista que vale nota) e ${tagDe('est') || '@estudo'} para estudo e revisão.`,
    '- +fac.SIGLA: a sigla da disciplina da aula, da lista acima.',
    `- due: só quando a aula der uma data (entrega, prova), em ${F()}.`,
    '- (A), (B) ou (C) no começo só para o que é urgente: prova ou entrega em até 7 dias = (A). Senão, sem prioridade.',
    '- No máximo 5 tarefas, curtas e começando por verbo (Revisar, Fazer, Ler, Entregar).',
    `- Prova ou entrega citada na aula vira a tarefa "Conferir: prova de SIGLA em ${F().slice(0,5)}".`,
    '', 'Exemplo:', `(A) Entregar lista 3 de integrais +fac.CALC2 ${tagDe('ent') || '@entrega'} due:${br('2026-10-15')}`, `Revisar regra da cadeia +fac.CALC2 ${tagDe('est') || '@estudo'}`,
    '', 'ANOTAÇÕES DA AULA:', '(cole aqui)'].join('\n');
}
const aulaHTML = () => `<details id="ia-aula" class="card"${UI.iaAula ? ' open' : ''}><summary>colar várias tarefas de uma vez (ex.: resposta de uma IA)</summary><div class="ia-box" style="margin-top:8px">
  <p class="sub" style="margin:0">Uma tarefa por linha, no formato da Lista (<span class="mono">+fac.SIGLA</span>, tags, <span class="mono">due:${F()}</span>). Com IA: copie o pedido, cole numa IA junto com as anotações da aula e cole a resposta aqui.</p>
  <textarea id="ia-tl" placeholder="Revisar regra da cadeia +fac.CALC2 @estudo&#10;(A) Entregar lista 3 +fac.CALC2 @entrega due:${br('2026-10-15')}"></textarea>
  <div class="linha"><button type="button" class="btn" data-iaaula>copiar pedido de aula → tarefas</button><button type="button" class="btn v" data-iatadd style="margin-left:auto">adicionar todas</button></div></div></details>`;
async function addTarefas(){
  const ls = document.getElementById('ia-tl').value.split('\n').map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').replace(/`/g, '').trim()).filter(l => l && !l.startsWith('#'));
  if(!ls.length) return;
  let ok = 0; const erros = [];
  for(const l of ls){ try { await post('/api/add', {text:l}); ok++; } catch(e){ erros.push(`${l.slice(0, 40)}: ${e.message}`); } }
  await recarrega(); UI.iaAula = !!erros.length; render();
  if(!erros.length) document.getElementById('ia-tl').value = '';
  toast(`${ok} tarefa(s) adicionada(s)` + (erros.length ? `<small>${esc(erros.join(' · '))}</small>` : ''));
}

/* ---------- encaixe nas abas ---------- */
const rBK0 = RENDER.bk, rL0 = RENDER.l;
RENDER.bk = S => { rBK0(S); const v = document.getElementById('ia-carta'); if(v) v.remove(); if(UI.bk === 'claude') document.getElementById('bk-det').insertAdjacentHTML('beforeend', cartaHTML()); };
RENDER.l = S => { rL0(S); const v = document.getElementById('ia-aula'); if(v) v.remove(); document.getElementById('l-add').insertAdjacentHTML('afterend', aulaHTML()); };
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  if(q('[data-iafecha]')){ document.getElementById('ia-pop').remove(); return; }
  const tp = q('[data-iatipo]'); if(tp){ UI.iaTipo = tp.dataset.iatipo; render(); return; }
  if(q('[data-iacarta]')){ copia(promptCarta(UI.iaTipo || 'semana'), 'Pedido da carta'); return; }
  if(q('[data-iacadd]')){ addCarta(); return; }
  if(q('[data-iaaula]')){ copia(promptAula(), 'Pedido de aula → tarefas'); return; }
  if(q('[data-iatadd]')){ addTarefas(); return; }
  if(q('#ia-aula summary')){ UI.iaAula = !document.getElementById('ia-aula').open; }
});
window.HJ_IA = {promptPlano, promptCarta, promptAula, copia};
if(CTX) tab(cur);
})();
