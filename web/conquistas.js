/* Hunter.todo · conquistas criadas pela IA (aba Book → Conquistas da IA, 200 em diante).
 * A IA só propõe: preenche um molde da lista fechada do motor (HJ.avaliaConq confere cada uma, calcula o rank e recusa
 * o que não dá); o jogador aceita as que quiser, e o motor marca sozinho quando cumpre. A recompensa sai do rank, nunca da
 * IA: ao conquistar, o jogador escolhe Jenny ou o feitiço embaixo da carta, e ela fica "resgatada". Grava em
 * conquistas.json por POST /api/conquistas. O pedido é o mesmo no copiar e colar e com a IA ligada (texto igual no IA.md).
 * Carregado depois de ia.js: usa CTX, D, HOJE, TEMP, BOSSES, UI, estado, render, post, recarrega, esc, ic, fmt, toast, spell, confete.
 */
(function(){
'use strict';
const HJ = window.HJ, br = HJ.brData;

document.head.insertAdjacentHTML('beforeend', `<style>
.bk .gc.cq{border-color:color-mix(in srgb,var(--grn) 45%,var(--hair))} .bk .gc.cq .no,.bk .gc.cq .og{color:var(--grn)} .bk .gc.cq .big{color:var(--grn)}
.bk .gc.cq:not(.on) .big{opacity:.55}
.bk .gc.cq.on{border-color:color-mix(in srgb,var(--amb) 60%,var(--hair))} .bk .gc.cq.on .no,.bk .gc.cq.on .big{color:var(--amb)}
.gc .cqbar{height:4px;border-radius:3px;background:var(--track);overflow:hidden} .gc .cqbar i{display:block;height:100%;background:var(--grn)}
.gc.on .cqbar i{background:var(--amb)}
.gc .selo{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-12deg);border:2px solid var(--amb);color:var(--amb);border-radius:6px;padding:2px 7px;font:800 10.5px var(--f-mono);letter-spacing:.1em;text-transform:uppercase;background:color-mix(in srgb,var(--panel2) 80%,transparent)}
.gc .selo.pega{border-color:var(--grn);color:var(--grn);animation:cq-pulsa 1.6s ease-in-out infinite}
@keyframes cq-pulsa{50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){.gc .selo.pega{animation:none}}
.cq-face.on{color:var(--amb)!important}
.cq-regra{margin-top:10px!important;padding:8px 10px;border-radius:9px;background:var(--panel2);border:1px solid var(--hair);font:12.5px var(--f-mono)!important;color:var(--soft)}
.cq-regra b{color:var(--ink);font-weight:600}
.cq-prog{margin-top:10px} .cq-prog .cqbar{height:7px;border-radius:4px;background:var(--track);overflow:hidden;margin-top:4px} .cq-prog .cqbar i{display:block;height:100%;background:var(--grn)}
.cq-rec{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.cq-rec button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px;border-radius:10px;border:1.5px solid var(--amb);background:color-mix(in srgb,var(--amb) 10%,var(--panel2));cursor:pointer;color:var(--ink);font:700 15px var(--f-hud);text-align:left}
.cq-rec button.f{border-color:var(--aura);background:color-mix(in srgb,var(--aura) 10%,var(--panel2))}
.cq-rec button small{font:500 11.5px var(--f-ui);color:var(--soft)}
.cq-rec button:hover{transform:translateY(-1px)}
.cq-ok{margin-top:10px;padding:8px 12px;border-radius:9px;border:1.5px dashed var(--amb);color:var(--amb);font:700 13px var(--f-mono);text-align:center;letter-spacing:.06em}
.cq-novas{margin-top:16px;padding-top:14px;border-top:1px solid var(--hair);display:flex;flex-direction:column;gap:10px}
.cq-novas h3{margin:0;font:700 16px var(--f-hud)}
.cq-novas textarea{min-height:90px;width:100%;background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:8px 10px;font:12.5px var(--f-mono);color:var(--ink);resize:vertical}
.cq-linha{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.cq-prop{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:4px 12px;align-items:start;padding:10px 12px;border:1px solid var(--hair);border-radius:11px;background:var(--panel2)}
.cq-prop.ruim{opacity:.6}
.cq-prop .ic{font-size:22px;color:var(--grn)} .cq-prop b{font:700 14px var(--f-hud)} .cq-prop p{margin:2px 0 0;font-size:12.5px;color:var(--soft)}
.cq-prop .rk{font:700 12px var(--f-mono);color:var(--amb);text-align:right;white-space:nowrap} .cq-prop .rk small{display:block;font-weight:400;color:var(--soft)}
.cq-prop .erro{color:var(--red)}
</style>`);

const ia = () => window.HJ_IA;
const vagas = cia => HJ.CONQ_MAX - cia.filter(c => !c.resgate).length;
const nomeF = k => spell(k).n;
const recTxt = c => `${fmt(c.j)} J ou o feitiço ${nomeF(c.f)}`;
const progTxt = c => { const at = Math.min(c.at, c.meta);
  return c.rg === 'nota' ? `${HJ.numBR(at).toFixed(1).replace('.', ',')} de ${String(c.meta).replace('.', ',')}` : `${fmt(at)} de ${fmt(c.meta)}`; };
const pct = c => Math.max(0, Math.min(100, c.meta ? c.at / c.meta * 100 : 0));
let PROP = null;   // propostas em revisão: {itens:[{p, v, sel}], erro}

/* ---------- aba Book → Conquistas da IA ---------- */
function book(S, cia){
  if(!cia.some(c => c.no === UI.bksel)) UI.bksel = (cia.find(c => c.on && !c.resgate) || cia.find(c => !c.on) || cia[0] || {}).no || '';
  const vg = vagas(cia);
  const carta = c => `<button class="gc cq${c.on ? ' on' : ''}" data-bksel="${esc(c.no)}" aria-pressed="${UI.bksel === c.no}"><span class="no">Nº ${esc(c.no)}</span><span class="rk">${c.rk}</span><span class="big">${ic(c.ic)}</span>
    ${c.resgate ? '<span class="selo">resgatada</span>' : c.on ? '<span class="selo pega">resgatar</span>' : ''}
    <div><div class="og">${esc(c.dif)}</div><div class="gn">${esc(c.n)}</div><div class="cqbar" style="margin-top:6px"><i style="width:${c.on ? 100 : pct(c)}%"></i></div></div></button>`;
  document.getElementById('bk-grid').innerHTML = cia.map(carta).join('')
    + Array.from({length:Math.max(0, vg)}, () => `<div class="gc empty" style="font-size:12px;text-align:center;padding:10px">vaga para uma conquista nova</div>`).join('')
    + `<div style="grid-column:1/-1">${novasHTML(cia, vg)}</div>`;
  const c = cia.find(c => c.no === UI.bksel);
  document.getElementById('bk-det').innerHTML = c ? detHTML(c) : `<div class="face" style="color:var(--grn);border-color:var(--grn)">${ic('card')}</div><p class="cap">conquistas da IA · 200+</p><h3>Desafios feitos para você</h3>
    <p>A IA olha as suas disciplinas, hábitos e tarefas e propõe desafios <b>difíceis, mas possíveis</b>. Você aceita os que quiser; o jogo confere sozinho e, quando você conquista, dá para escolher <b>Jenny ou um feitiço</b>.</p>
    <p class="sub">Até ${HJ.CONQ_MAX} abertas ao mesmo tempo. Peça as primeiras em <b>Propor conquistas com IA</b>.</p>`;
}
function detHTML(c){
  const rec = c.resgate ? `<div class="cq-ok">✓ resgatada · ${c.resgate.como === 'jenny' ? `+${fmt(c.resgate.j)} J` : `feitiço ${esc(nomeF(c.resgate.k))}`}${c.resgate.em ? ` · ${ddmm(c.resgate.em)}` : ''}</div>`
    : c.on ? `<p style="margin-top:12px"><b>Conquistada!</b> Escolha a recompensa:</p><div class="cq-rec"><button data-cqres="${esc(c.no)}:jenny">+${fmt(c.j)} J<small>vai para a carteira</small></button><button class="f" data-cqres="${esc(c.no)}:feitico">${esc(nomeF(c.f))}<small>${esc(spell(c.f).e)}</small></button></div>`
    : `<p class="sub" style="margin-top:10px">Ao conquistar: ${recTxt(c)}, à sua escolha.</p>
      <p style="margin-top:10px">${UI.cqdesc === c.no ? `<button class="btn" data-cqdesc="${esc(c.no)}" style="border-color:var(--red)">confirmar: descartar</button> <button class="go" data-cqdesc="">cancelar</button>` : `<button class="go" data-cqdesc="${esc(c.no)}">descartar esta conquista</button>`}</p>`;
  return `<div class="face cq-face${c.on ? ' on' : ''}" style="color:var(--grn);border-color:${c.on ? 'var(--amb)' : 'var(--grn)'}">${ic(c.ic)}</div>
    <p class="cap">Nº ${esc(c.no)} · rank ${c.rk} · ${esc(c.dif)} · criada pela IA${c.criada ? ` em ${ddmm(c.criada)}` : ''}</p><h3>${esc(c.n)}</h3>
    ${c.d ? `<p style="white-space:pre-line">${esc(c.d)}</p>` : ''}
    <p class="cq-regra"><b>regra:</b> ${esc(c.regra)} Conta a partir de ${ddmm(c.criada || HOJE)}.</p>
    ${c.resgate ? '' : `<div class="cq-prog"><span class="sub">${c.on ? 'cumprida' : 'progresso'} · ${progTxt(c)}</span><div class="cqbar"><i style="width:${c.on ? 100 : pct(c)}%;${c.on ? 'background:var(--amb)' : ''}"></i></div></div>`}
    ${rec}`;
}

/* ---------- propor conquistas: o pedido (com os fatos do jogador) e a revisão das respostas ---------- */
function novasHTML(cia, vg){
  const lig = ia() && ia().ligada(), roda = ia() && ia().rodando(), n = Math.min(5, vg);
  return `<div class="cq-novas" id="cq-novas"><h3>${ic('card')} Propor conquistas com IA</h3>
    ${vg <= 0 ? `<p class="sub" style="margin:0">Você já tem ${HJ.CONQ_MAX} conquistas da IA abertas. Para pedir novas, conquiste (e resgate) ou descarte alguma.</p>`
      : lig ? `<p class="sub" style="margin:0">A IA (${esc(ia().nomeAg())}) lê o seu ritmo, as disciplinas, os hábitos e as palavras das tarefas e propõe ${n === 1 ? '1 desafio' : `até ${n} desafios`}. O jogo confere cada um e calcula a dificuldade e a recompensa; você aceita os que quiser.</p>
        <div class="cq-linha"><button type="button" class="btn v" data-cqpede${roda ? ' disabled' : ''}>propor conquistas com IA</button><button type="button" class="go" data-cqcopia>ou copiar o pedido</button></div>`
      : `<p class="sub" style="margin:0">1. Copie o pedido: ele já vai com o seu ritmo, disciplinas, hábitos e palavras das tarefas. 2. Cole numa IA de chat. 3. Cole a resposta aqui e confira. Com a IA ligada em Configurações, ela faz isso sozinha.</p>
        <div class="cq-linha"><button type="button" class="btn v" data-cqcopia>copiar pedido</button></div>
        <textarea id="cq-cola" placeholder='cole aqui a resposta da IA: [{"regra": ..., "nome": ...}]'></textarea>
        <div class="cq-linha"><button type="button" class="btn" data-cqconfere>conferir resposta</button></div>`}
    ${PROP ? revisaHTML(vg) : ''}</div>`;
}
function revisaHTML(vg){
  if(PROP.erro) return `<p class="sub" style="color:var(--red);margin:0">${esc(PROP.erro)}</p>`;
  const sel = PROP.itens.filter(it => it.sel).length, ok = PROP.itens.filter(it => !it.v.erro);
  return `<p class="cap" style="margin:6px 0 0">propostas · marque as que quer aceitar</p>
    ${PROP.itens.map((it, i) => { const v = it.v, rk = v.erro ? null : HJ.conqRk(v.rk);
      return `<label class="cq-prop${v.erro ? ' ruim' : ''}"><input type="checkbox" data-cqsel="${i}"${it.sel ? ' checked' : ''}${v.erro ? ' disabled' : ''}>
        <span><b>${esc(String(it.p.nome || 'sem nome'))}</b>${it.p.texto ? `<p>${esc(String(it.p.texto))}</p>` : ''}<p>${v.erro ? `<span class="erro">fora: ${esc(v.erro)}</span>` : `regra: ${esc(HJ.descConq(v.r, CTX))}`}</p></span>
        <span class="rk">${rk ? `rank ${rk.rk} · ${rk.n}<small>~${v.dias} dias · ${fmt(rk.j)} J ou ${esc(nomeF(rk.f))}</small>` : ''}</span></label>`; }).join('')}
    <div class="cq-linha"><button type="button" class="btn v" data-cqcria${sel && sel <= vg ? '' : ' disabled'}>aceitar as marcadas (${sel})</button>${sel > vg ? `<span class="sub" style="color:var(--red)">só cabem ${vg}</span>` : ''}<button type="button" class="go" data-cqlimpa>descartar propostas</button>
      ${ok.length ? '' : '<span class="sub">nenhuma proposta passou na conferência: peça de novo</span>'}</div>`;
}
const ini28 = () => HJ.addD(HOJE, -27), desde = () => D.feitas.map(t => t.done).filter(Boolean).sort()[0] || HOJE;
function pedido(cia){
  const S = estado(), J = CTX.JOG, de = ini28(), n = Math.max(1, Math.min(5, vagas(cia)));
  const feitas = D.feitas.filter(t => t.done && t.done >= de && !HJ.isRec(t));
  const tipos = Object.entries(HJ.CONQ_TIPOS).map(([k, nome]) => `${nome} (${k}): ${feitas.filter(t => HJ.tipoDe(t) === k).length}`).join(', ');
  let melhor = 0; for(let k = 0; k < 8; k++){ let x = 0; const w = HJ.addD(HOJE, -HJ.dow(HOJE) - 7*(k+1)); for(let i = 0; i < 7; i++) x += S.xpDia[HJ.addD(w, i)] || 0; melhor = Math.max(melhor, x); }
  const xp4 = Object.keys(S.xpDia).filter(d => d >= de).reduce((s, d) => s + S.xpDia[d], 0);
  const L = [`Hoje: ${br(HOJE)}. Fim da temporada: ${br(TEMP.fim)}.`,
    `Ritmo nas últimas 4 semanas: ${feitas.length} tarefas concluídas (${(feitas.length/28).toFixed(1).replace('.', ',')} por dia), ${Math.round(xp4/4)} XP por semana em média. Melhor semana das últimas 8: ${melhor} XP.`,
    `Ten (dias seguidos com tarefa): ${S.ten.cur} agora, recorde ${S.ten.max}.`, `Tarefas por tipo nas últimas 4 semanas: ${tipos}.`, '', 'Disciplinas (sigla: nome · pontos garantidos de 100 · avaliações sem nota):'];
  for(const b of S.bs){ const j = (J.disciplinas || []).find(x => x.d === b.d) || {}, k = feitas.filter(t => HJ.discOf(t, CTX) === b.d).length;
    const sem = b.avs.filter(a => a.nota == null || a.cont).map(a => `${a.k} (${a.n}, peso ${a.w}, ${br(a.dt)})`).join(', ');
    L.push(`- ${b.d}: ${j.n || b.n} · ${HJ.numBR(b.pts).toFixed(1).replace('.', ',')} pontos · ${k} tarefas nas últimas 4 semanas · sem nota: ${sem || 'nenhuma'}`); }
  if(!S.bs.length) L.push('- (nenhuma)');
  L.push('', 'Hábitos (id: nome · frequência · vezes nos últimos 28 dias · maior sequência):');
  for(const h of (J.habitos || [])){ const r = HJ.progConq({regra:'sequencia', hab:h.id, n:9999}, CTX, S, desde());
    const k = D.feitas.filter(t => String(t.rec || '').split(':')[0] === h.id && (String(t.rec).split(':')[1] || t.done) >= de).length;
    L.push(`- ${h.id}: ${h.n} · ${h.semana ? h.semana + '× por semana' : 'todo dia'} · ${k} · ${r.at} ${h.semana ? 'semanas' : 'dias'}`); }
  if(J.cf && J.cf.handle){ const cf = (D.cf && D.cf.por_dia) || {}, r = HJ.progConq({regra:'sequencia', hab:'cf', n:9999}, CTX, S, desde());
    L.push(`- cf: Codeforces (problema aceito no dia) · meta ${J.cf.meta || 3} por dia · ${Object.keys(cf).filter(d => d >= de && cf[d] > 0).length} · ${r.at} dias`); }
  if(!(J.habitos || []).length && !(J.cf && J.cf.handle)) L.push('- (nenhum)');
  const PARA = new Set('para com sem uma umas uns dos das nos nas pelo pela pelos pelas que como mais menos sobre entre todo toda todos todas este esta esse essa isso aqui fazer feito feita depois antes ainda'.split(' '));
  const cont = {}; for(const t of D.feitas.filter(t => t.done && t.done >= HJ.addD(HOJE, -59) && !HJ.isRec(t)))
    for(const w of new Set(HJ.norm(t.txt).split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !PARA.has(w) && !/^\d+$/.test(w)))) cont[w] = (cont[w] || 0) + 1;
  const pal = Object.entries(cont).filter(([, k]) => k >= 2).sort((a, b) => b[1] - a[1]).slice(0, 25);
  L.push('', 'Palavras que mais aparecem nas tarefas dos últimos 60 dias (vezes):', pal.length ? pal.map(([w, k]) => `${w} (${k})`).join(', ') : '(poucas tarefas ainda)');
  const abertas = cia.filter(c => !c.resgate);
  if(abertas.length) L.push('', 'Conquistas da IA que já estão abertas (não repita):', ...abertas.map(c => `- ${c.n}: ${c.regra}`));
  return [`Proponha ${n === 1 ? '1 conquista' : `${n} conquistas`} (desafios) para o meu jogo de tarefas (Hunter.todo, tema Hunter x Hunter), difíceis mas possíveis no meu ritmo, contadas a partir de hoje. Os dados estão no fim.`,
    'Responda SÓ com uma lista JSON, sem texto antes ou depois e sem markdown:',
    '[{"regra": "...", ...campos da regra..., "nome": "...", "texto": "...", "ic": "..."}]', '',
    'Regras que o jogo sabe conferir (use só estas, com estes campos):',
    '- contagem: {"regra": "contagem", "n": 10, "palavra": "sql", "disc": "BD", "tipo": "est", "prazo": true} = n tarefas concluídas que batem com todos os filtros dados. Filtros (use pelo menos um): palavra (aparece no texto da tarefa), disc (sigla da disciplina), tipo (ent entrega, est estudo, fac faculdade, tre treino e projetos, vid vida), prazo (true = feitas até o prazo).',
    '- sequencia: {"regra": "sequencia", "hab": "ID", "n": 14} = o hábito em n dias seguidos (hábito semanal: n semanas seguidas com a meta da semana). hab é o id da lista de hábitos (cf = Codeforces).',
    '- nota: {"regra": "nota", "disc": "BD", "media": 8} = garantir media×10 pontos na disciplina; ou {"regra": "nota", "disc": "BD", "aval": "P2", "nota": 8} = tirar 8 ou mais numa avaliação que ainda não tem nota.',
    '- constancia: {"regra": "constancia", "n": 21} = Ten de n dias seguidos.',
    '- semana: {"regra": "semana", "xp": 400} = uma semana (seg a dom) com xp ou mais, até o dobro da melhor semana.',
    '- nome: curto e no tema (até 60 letras). texto: uma ou duas frases no tema, sem inventar fatos (até 300 letras).',
    `- ic: um destes ícones: ${HJ.CONQ_ICS.join(' ')}.`,
    '- Varie as regras e os alvos. Nada que já esteja cumprido ou que repita uma conquista aberta. Tem que dar para cumprir até o fim da temporada.',
    '- A recompensa e a dificuldade quem decide é o jogo: não fale de prêmio.', '', 'DADOS', ...L].join('\n');
}
function confere(txt){
  const S = estado(), i = txt.indexOf('['), j = txt.lastIndexOf(']');
  let lista; try { lista = JSON.parse(txt.slice(i, j + 1)); } catch(e){ PROP = {itens:[], erro:'A resposta não é a lista JSON pedida. Peça de novo (ou cole só a lista).'}; return; }
  if(!Array.isArray(lista) || !lista.length){ PROP = {itens:[], erro:'A resposta veio sem conquistas.'}; return; }
  const vistos = new Set();
  PROP = {itens: lista.slice(0, 8).filter(p => p && typeof p === 'object').map(p => { let v = HJ.avaliaConq(p, CTX, S);
    if(!v.erro && !(String(p.nome || '').trim())) v = {erro:'sem nome'};
    const chave = v.erro ? '' : JSON.stringify(v.r); if(chave && vistos.has(chave)) v = {erro:'repetida'}; vistos.add(chave);
    return {p, v, sel:false}; })};
  let vg = vagas(HJ.conqIA(CTX, S)); for(const it of PROP.itens) if(!it.v.erro && vg > 0){ it.sel = true; vg--; }
}
async function pede(cia){
  PROP = null; render();
  let txt; try { txt = await ia().rodaIA(pedido(cia), 'propondo conquistas'); } catch(err){ PROP = {itens:[], erro:'A IA não respondeu: ' + err.message}; render(); return; }
  confere(txt); UI.bk = 'ia'; render();
}
async function cria(){
  const its = PROP.itens.filter(it => it.sel && !it.v.erro);
  const itens = its.map(it => ({...it.v.r, nome:String(it.p.nome).slice(0, 60), texto:String(it.p.texto || '').slice(0, 400), ic:HJ.CONQ_ICS.includes(it.p.ic) ? it.p.ic : 'card', rk:it.v.rk, temporada:TEMP.nome}));
  let r; try { r = await post('/api/conquistas', {acao:'criar', itens}); await recarrega(); } catch(err){ toast('Não criou: ' + esc(err.message)); return; }
  PROP = null; UI.bksel = r.nos[0]; render(); toast(`${itens.length} conquista(s) nova(s) no Book <small>o jogo confere sozinho</small>`);
}
async function resgata(no, como){
  const c = HJ.conqIA(CTX, estado()).find(c => c.no === no); if(!c || !c.on || c.resgate) return;
  try { await post('/api/conquistas', como === 'jenny' ? {acao:'resgatar', no, como, j:c.j} : {acao:'resgatar', no, como, k:c.f}); await recarrega(); }
  catch(err){ toast('Não resgatou: ' + esc(err.message)); return; }
  render(); confete(); toast(como === 'jenny' ? `+${fmt(c.j)} J <small>${esc(c.n)} resgatada</small>` : `${esc(nomeF(c.f))} na bolsa <small>use pelo Book → Feitiços</small>`);
}
/* ao abrir o jogo (e a cada recarga): avisa uma vez quando uma conquista da IA é cumprida */
const avisadas = new Set();
function avisa(){
  if(!CTX) return;
  for(const c of HJ.conqIA(CTX, estado())) if(c.on && !c.resgate && !avisadas.has(c.no)){
    avisadas.add(c.no);
    if(avisadas.size === 1 || !document.querySelector('.toast')){ const to = document.createElement('div'); to.className = 'toast';
      to.innerHTML = `${ic('card')} Conquista Nº ${esc(c.no)} cumprida! <small>${esc(c.n)}</small><button class="l-undo" data-cqver="${esc(c.no)}">resgatar</button>`;
      document.body.appendChild(to); setTimeout(() => to.remove(), 9000); }
  }
}

document.addEventListener('change', e => { const s = e.target.closest('[data-cqsel]'); if(s && PROP){ PROP.itens[+s.dataset.cqsel].sel = s.checked; render(); } });
document.addEventListener('click', e => {
  const q = s => e.target.closest(s), cia = () => HJ.conqIA(CTX, estado());
  if(q('[data-cqpede]')){ pede(cia()); return; }
  if(q('[data-cqcopia]')){ ia().copia(pedido(cia()), 'Pedido das conquistas'); return; }
  if(q('[data-cqconfere]')){ confere(document.getElementById('cq-cola').value); render(); return; }
  if(q('[data-cqcria]')){ cria(); return; }
  if(q('[data-cqlimpa]')){ PROP = null; render(); return; }
  const r = q('[data-cqres]'); if(r){ const [no, como] = r.dataset.cqres.split(':'); resgata(no, como); return; }
  const d = q('[data-cqdesc]'); if(d){ const no = d.dataset.cqdesc;
    if(!no || UI.cqdesc !== no){ UI.cqdesc = no; render(); return; }
    UI.cqdesc = ''; post('/api/conquistas', {acao:'descartar', no}).then(recarrega).then(() => { UI.bksel = ''; render(); toast('Conquista descartada <small>abriu uma vaga</small>'); }).catch(err => toast('Não descartou: ' + esc(err.message))); return; }
  const v = q('[data-cqver]'); if(v){ const t = q('.toast'); if(t) t.remove(); UI.bk = 'ia'; UI.bksel = v.dataset.cqver; tab('bk'); return; }
});
const sync0 = sync;
sync = api => { sync0(api); setTimeout(avisa, 800); };
window.HJ_CONQ = {book, pedido, confere};
if(CTX){ setTimeout(avisa, 800); if(cur === 'bk') render(); }
})();
