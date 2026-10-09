/* Hunter.todo · editor de um chefão (aba Chefões e Arena): avaliações (provas, trabalhos, listas) e notas lançadas, sem IA e sem
 * abrir arquivo. Carregado depois de guia.js: usa CTX, AVAL, HOJE, render, post, recarrega, esc, toast e o estilo .wz do assistente.
 * Grava por POST /api/jogo/planos {avaliacoes, notas}: o bloco da disciplina no avaliacoes.txt e as linhas dela no notas.txt.
 * O resto dos dois arquivos (outras disciplinas, comentários, cabeçalho do chefão) fica como está.
 */
(function(){
'use strict';
const HJ = window.HJ;

document.head.insertAdjacentHTML('beforeend', `<style>
.ce-row{display:grid;grid-template-columns:80px minmax(0,1fr) 74px 120px 34px;gap:8px;align-items:end}
.ce-row .op{grid-column:2/-1;display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:-2px}
.ce-row .op label{flex-direction:row;align-items:center;gap:6px;text-transform:none;letter-spacing:0;font:13px var(--f-ui);color:var(--soft)}
.ce-row .op input[type=text]{width:180px;padding:5px 8px;font-size:13px}
.ce-sec{border-top:1px solid var(--hair);padding-top:14px;display:flex;flex-direction:column;gap:10px}
.ce-soma{font:600 12px var(--f-mono)} .ce-soma.ruim{color:var(--red)} .ce-soma.ok{color:var(--grn)}
.ce-nota{display:grid;grid-template-columns:minmax(0,1fr) 90px 34px;gap:8px;align-items:center;font-size:14px}
.ce-nota small{display:block;font:11.5px var(--f-mono);color:var(--soft)}
.ce-nota.del{opacity:.45;text-decoration:line-through}
@media (max-width:720px){ .ce-row{grid-template-columns:1fr 1fr} .ce-row .op{grid-column:1/-1} }
</style>`);

const CHAVE = /^[A-Za-z0-9]{1,8}$/;
const ehAval = l => { const t = l.trim(); return t && !t.startsWith('#') && !/^\[\w+\]/.test(t) && !/^temporada\s*\|/i.test(t) && t.split('|').length >= 4; };
const ehCab = l => /^\s*\[\w+\]/.test(l) || /^\s*temporada\s*\|/i.test(l);

/* bloco da disciplina no avaliacoes.txt: do cabeçalho [SIGLA] até antes do próximo cabeçalho
   (os comentários colados no próximo cabeçalho, como "# BD · Banco de dados", ficam com ele) */
function bloco(linhas, d){
  const ini = linhas.findIndex(l => new RegExp('^\\s*\\[' + d + '\\]', 'i').test(l)); if(ini < 0) return null;
  let fim = linhas.findIndex((l, i) => i > ini && ehCab(l)); if(fim < 0) fim = linhas.length;
  while(fim > ini + 1 && (linhas[fim-1].trim() === '' || linhas[fim-1].trim().startsWith('#')) && fim < linhas.length) fim--;
  return {ini, fim};
}
function lerLinha(raw){
  const p = raw.split('|').map(x => x.trim());
  return {raw, k:p[0], n:p[1] || '', w:p[2].replace('?', ''), dt:HJ.brData(p[3].replace('?', '')), est: p[2].includes('?') || p[3].includes('?'),
    kw:p[4] || '', cont:/cont/i.test(p[5] || ''), orig:p[0]};
}
const iguais = (a, b) => ['k','n','w','dt','est','kw','cont'].every(c => a[c] === b[c]);
function escreveLinha(a){
  if(a.raw && iguais(a, lerLinha(a.raw))) return a.raw;   // sem mudança: a linha original, do jeito que estava
  const e = a.est ? '?' : '', iso = HJ.isoData(a.dt, HOJE);
  return [a.k, a.n || a.k, String(a.w).replace('.', ',') + e, iso + e].concat(a.kw || a.cont ? [a.kw] : [], a.cont ? ['contínua'] : []).join(' | ');
}

let E = null;   // edição em andamento
function abre(d){
  const linhas = String(CTX.AV_TXT || '').split('\n'), b = bloco(linhas, d), boss = BOSSES.find(x => x.d === d);
  if(!b || !boss){ toast('Disciplina não encontrada no avaliacoes.txt'); return; }
  const nlin = String(CTX.NT_TXT || '').split('\n');
  E = {d, boss, avs: linhas.slice(b.ini + 1, b.fim).filter(ehAval).map(lerLinha), del:[],
    notas: nlin.map((raw, idx) => { const p = raw.split('|').map(x => x.trim()); return p.length >= 4 && !raw.trim().startsWith('#') && p[1].toUpperCase() === d
      ? {idx, raw, data:p[0], k:p[2], v:p[3], parcial:/parcial/i.test(p[4] || ''), apaga:false} : null; }).filter(Boolean),
    err:'', confirma:''};
  desenha();
}
/* resposta da IA (ou linhas coladas): "chave | nome | peso | data | palavra-chave | contínua", data em dd/mm/aaaa (ou mm/dd/aaaa, conforme a opção) ou AAAA-MM-DD, "?" = estimada */
function cola(txt){
  const novas = [];
  for(let l of String(txt).split('\n')){
    l = l.replace(/`/g, '').trim(); if(!l || l.startsWith('#') || /^[-|: ]+$/.test(l)) continue;
    l = l.replace(/^\|/, '').replace(/\|$/, '');
    const p = l.split('|').map(x => x.trim()); if(p.length < 4 || /^chave$/i.test(p[0])) continue;
    const est = p[2].includes('?') || p[3].includes('?'), dt = p[3].replace('?', '').trim();
    const velha = E.avs.find(a => a.orig && a.orig.toUpperCase() === p[0].toUpperCase());
    novas.push({k:p[0], n:p[1], w:p[2].replace('?', '').replace('%', '').trim(), dt: /^\d{4}-/.test(dt) ? HJ.brData(dt) : dt, est, kw:(p[4] || '').toLowerCase(), cont:/cont/i.test(p[5] || ''), orig: velha ? velha.orig : '', raw: velha ? velha.raw : ''});
  }
  if(!novas.length){ E.err = 'Não achei nenhuma linha no formato "chave | nome | peso | data".'; desenha(); return; }
  for(const a of E.avs) if(a.orig && !novas.some(n => n.orig === a.orig)) E.del.push(a.orig);
  E.avs = novas; E.err = ''; desenha(); toast(`${novas.length} avaliações coladas <small>confira e salve</small>`);
}
function soma(){ return E.avs.reduce((s, a) => s + (HJ.numBR(a.w) || 0), 0); }
function desenha(){
  let bg = document.getElementById('ce'); if(!bg){ bg = document.createElement('div'); bg.id = 'ce'; bg.className = 'wz-bg'; document.body.appendChild(bg); }
  const sm = Math.round(soma() * 100) / 100;
  bg.innerHTML = `<div class="wz" role="dialog" aria-modal="true" aria-labelledby="ce-t">
    <div class="wz-top"><span class="av" style="--s:42px">${ic(E.boss.ic)}</span><div><h2 id="ce-t">${esc(E.boss.n)} · ${esc(E.d)}</h2><p>Avaliações e notas desta disciplina</p></div></div>
    <div class="wz-body">
      <p>Cada avaliação é uma prova, um trabalho ou uma lista. <b>Peso</b> em % (os pesos somam 100). <b>Contínua</b> = várias notas parciais que viram uma média (ex.: listas). <b>Estimada</b> = peso ou data ainda não confirmados no plano de ensino. A <b>palavra-chave</b> liga as tarefas com ela no texto a esta avaliação.</p>
      <div class="wz-disc">${E.avs.map((a, i) => `<div class="ce-row">
        <label>Chave<input data-ce="${i}:k" value="${esc(a.k)}" maxlength="8" placeholder="P1"></label>
        <label>Nome<input data-ce="${i}:n" value="${esc(a.n)}" maxlength="50" placeholder="Prova 1"></label>
        <label>Peso %<input data-ce="${i}:w" value="${esc(a.w)}" inputmode="decimal" maxlength="5"></label>
        <label>Data<input class="dt" data-ce="${i}:dt" value="${esc(a.dt)}" inputmode="numeric" maxlength="10" placeholder="${HJ.fmtTxt()}"></label>
        <button type="button" class="wz-x" data-cedel="${i}" aria-label="remover ${esc(a.n || a.k)}">✕</button>
        <div class="op"><label><input type="checkbox" data-ce="${i}:cont"${a.cont ? ' checked' : ''}> contínua</label><label><input type="checkbox" data-ce="${i}:est"${a.est ? ' checked' : ''}> estimada</label>
          <label>palavra-chave <input type="text" data-ce="${i}:kw" value="${esc(a.kw)}" maxlength="30" placeholder="ex.: avl"></label></div></div>`).join('')}</div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><button type="button" class="btn" data-ceadd>+ avaliação</button>
        <span class="ce-soma ${sm === 100 ? 'ok' : 'ruim'}">pesos somam ${String(sm).replace('.', ',')}%${sm === 100 ? ' ✓' : ' (precisa ser 100)'}</span></div>
      <div class="ce-sec"><h3>Com IA (opcional)</h3>
        <p>Copie o pedido, cole numa IA (ChatGPT, Claude, Gemini...) junto com o PDF do plano de ensino e cole a resposta aqui. As linhas substituem as avaliações acima; confira e clique em salvar.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn" data-ceia>copiar pedido para a IA</button></div>
        <textarea id="ce-cola" placeholder="P1 | Prova 1 | 30 | ${HJ.brData('2026-09-22')} | limite |&#10;P2 | Prova 2 | 70 | ${HJ.brData('2026-12-01')}? | |" style="min-height:90px;background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:8px 10px;font:12.5px var(--f-mono);color:var(--ink)"></textarea>
        <div><button type="button" class="btn" data-cecola>usar estas linhas</button></div></div>
      <div class="ce-sec"><h3>Notas lançadas</h3>
        ${E.notas.length ? E.notas.map((n, i) => `<div class="ce-nota${n.apaga ? ' del' : ''}"><span>${esc(n.k)}${n.parcial ? ' · parcial' : ''}<small>lançada em ${HJ.brData(n.data)}</small></span>
          <input data-cen="${i}" value="${esc(n.v)}" inputmode="decimal" aria-label="nota de ${esc(n.k)}"${n.apaga ? ' disabled' : ''}>
          <button type="button" class="wz-x" data-cendel="${i}" aria-label="${n.apaga ? 'manter' : 'apagar'} nota de ${esc(n.k)}" title="${n.apaga ? 'manter' : 'apagar'}">${n.apaga ? '↺' : '✕'}</button></div>`).join('')
          : '<p>Nenhuma nota lançada ainda. Elas são registradas no quadro dos chefões, depois da data da avaliação.</p>'}
      </div>
    </div>
    <div class="wz-foot"><span class="err" role="alert">${esc(E.err)}</span><span style="display:flex;gap:8px;margin-left:auto"><button type="button" class="btn" data-cesair>cancelar</button><button type="button" class="btn v" data-cesalva>salvar</button></span></div></div>`;
}
function valida(){
  const ks = E.avs.map(a => a.k.trim());
  if(!E.avs.length) return 'Deixe pelo menos uma avaliação.';
  if(ks.some(k => !CHAVE.test(k))) return 'A chave tem de 1 a 8 letras ou números, sem espaço (ex.: P1, T2, L).';
  if(new Set(ks.map(k => k.toUpperCase())).size !== ks.length) return 'Há duas avaliações com a mesma chave.';
  const ruimD = E.avs.find(a => !HJ.isoData(a.dt, HOJE)); if(ruimD) return `${ruimD.k || 'Avaliação'}: ${HJ.dataRuim(ruimD.dt)}`;
  if(E.avs.some(a => !(HJ.numBR(a.w) > 0))) return 'Todo peso precisa ser um número maior que zero.';
  if(Math.abs(soma() - 100) > .01) return `Os pesos somam ${String(Math.round(soma() * 100) / 100).replace('.', ',')}%; precisam somar 100.`;
  const nr = E.notas.find(n => !n.apaga && !(HJ.numBR(n.v) >= 0 && HJ.numBR(n.v) <= 10)); if(nr) return `Nota inválida em ${nr.k}: de 0 a 10.`;
  return '';
}
async function salva(){
  E.err = valida(); if(E.err){ desenha(); return; }
  /* chaves renomeadas levam as notas junto; avaliação removida leva as notas dela (com confirmação) */
  const ren = {}; E.avs.forEach(a => { if(a.orig && a.orig !== a.k.trim()) ren[a.orig] = a.k.trim(); });
  const vivas = new Set(E.avs.map(a => a.orig).filter(Boolean)), perdem = E.notas.filter(n => !n.apaga && !vivas.has(n.k) && E.del.includes(n.k));
  const aviso = perdem.map(n => n.k).filter((k, i, v) => v.indexOf(k) === i).join(', ');
  if(aviso && E.confirma !== aviso){ E.confirma = aviso; E.err = `${aviso} tem nota lançada e a nota vai ser apagada junto. Clique em salvar de novo para confirmar.`; desenha(); return; }
  const linhas = String(CTX.AV_TXT || '').split('\n'), b = bloco(linhas, E.d);
  const novas = E.avs.map(a => escreveLinha({...a, k:a.k.trim(), n:a.n.trim()}));
  const corpo = []; let j = 0;
  for(const l of linhas.slice(b.ini + 1, b.fim)){ if(!ehAval(l)){ corpo.push(l); continue; } if(j === 0) corpo.push(...novas); j++; }   // comentários ficam no lugar
  if(!j) corpo.push(...novas);
  const av = [...linhas.slice(0, b.ini + 1), ...corpo, ...linhas.slice(b.fim)].join('\n');
  const nlin = String(CTX.NT_TXT || '').split('\n'), porIdx = new Map(E.notas.map(n => [n.idx, n]));
  const nt = nlin.flatMap((raw, idx) => { const n = porIdx.get(idx); if(!n) return [raw];
    const k = ren[n.k] || n.k; if(n.apaga || perdem.includes(n)) return [];
    if(k === n.k && n.v === n.raw.split('|')[3].trim()) return [raw];
    return [`${n.data} | ${E.d} | ${k} | ${String(HJ.numBR(n.v)).replace('.', ',')}${n.parcial ? ' | parcial' : ''}`]; }).join('\n');
  try { await post('/api/jogo/planos', {avaliacoes:av, notas:nt}); await recarrega(); }
  catch(err){ E.err = 'Não salvou: ' + err.message; desenha(); return; }
  document.getElementById('ce').remove(); E = null; render(); toast('Chefão salvo <small>avaliacoes.txt e notas.txt</small>');
}

document.addEventListener('input', e => {
  if(!E) return; const t = e.target;
  if(t.dataset.ce){ const [i, c] = t.dataset.ce.split(':'); E.avs[+i][c] = t.type === 'checkbox' ? t.checked : t.value;
    if(c === 'w'){ const s = document.querySelector('.ce-soma'), sm = Math.round(soma() * 100) / 100; s.className = 'ce-soma ' + (sm === 100 ? 'ok' : 'ruim'); s.textContent = `pesos somam ${String(sm).replace('.', ',')}%${sm === 100 ? ' ✓' : ' (precisa ser 100)'}`; } }
  if(t.dataset.cen !== undefined) E.notas[+t.dataset.cen].v = t.value;
});
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  const ab = q('[data-cedit]'); if(ab){ e.stopPropagation(); abre(ab.dataset.cedit); return; }
  if(!E) return;
  if(q('[data-ceadd]')){ E.avs.push({k:'', n:'', w:'', dt:'', est:false, kw:'', cont:false, orig:''}); desenha(); const r = document.querySelectorAll('[data-ce$=":k"]'); r[r.length - 1].focus(); return; }
  const dl = q('[data-cedel]'); if(dl){ const a = E.avs.splice(+dl.dataset.cedel, 1)[0]; if(a.orig) E.del.push(a.orig); desenha(); return; }
  const nd = q('[data-cendel]'); if(nd){ const n = E.notas[+nd.dataset.cendel]; n.apaga = !n.apaga; desenha(); return; }
  if(q('[data-ceia]')){ window.HJ_IA.copia(window.HJ_IA.promptPlano(E.d), 'Pedido do plano de ensino'); return; }
  if(q('[data-cecola]')){ cola(document.getElementById('ce-cola').value); return; }
  if(q('[data-cesair]')){ document.getElementById('ce').remove(); E = null; return; }
  if(q('[data-cesalva]')) salva();
});
document.addEventListener('keydown', e => { if(E && e.key === 'Escape'){ document.getElementById('ce').remove(); E = null; } });

/* botões "editar" no quadro dos chefões e no chefão aberto da Arena */
const rB2_0 = RENDER.b2, rB_0 = RENDER.b;
RENDER.b2 = S => { rB2_0(S); document.querySelectorAll('#b2-cols .col').forEach((c, i) => { const b = S.bs[i]; if(b) c.querySelector('.ch').insertAdjacentHTML('beforeend', `<button type="button" class="btn" data-cedit="${b.d}" style="margin-top:10px">editar avaliações e notas</button>`); }); };
RENDER.b = S => { rB_0(S); const d = document.querySelector('#b-bosses .bdet'); if(d && UI.bsel) d.insertAdjacentHTML('beforeend', `<p style="margin:10px 0 0"><button type="button" class="btn" data-cedit="${UI.bsel}">editar avaliações e notas</button></p>`); };
window.HJ_CHEFES = {abre};
if(CTX) tab(cur);
})();
