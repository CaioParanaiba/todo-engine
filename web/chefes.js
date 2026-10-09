/* Hunter.todo · editor de um chefão (aba Chefões e Arena): avaliações (provas, trabalhos, listas) e notas lançadas, sem
 * abrir arquivo. Carregado depois de guia.js: usa CTX, AVAL, HOJE, render, post, recarrega, esc, toast e o estilo .wz do assistente.
 * Grava por POST /api/jogo/planos {avaliacoes, notas}: o bloco da disciplina no avaliacoes.txt e as linhas dela no notas.txt.
 * O resto dos dois arquivos (outras disciplinas, comentários, cabeçalho do chefão) fica como está.
 * Com a IA ligada (aba Regras), "ler plano com IA" e "aplicar lembretes com IA" põem a resposta no mesmo lugar do copiar e colar;
 * as observações da IA (linhas #) aparecem no editor e ficam no bloco como "# (IA) ...".
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
#ce .ce-livre{display:flex;flex-direction:row;gap:6px;align-items:center;font:13px var(--f-ui);color:var(--soft);text-transform:none;letter-spacing:0;margin-left:auto}
.ce-obs{font-size:13px;color:var(--soft);background:var(--panel2);border-left:3px solid var(--amb);border-radius:8px;padding:8px 12px}
.ce-obs ul{margin:4px 0 0;padding-left:18px}
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

/* "soma livre": o jogador autorizou os pesos da disciplina a passar de 100 (pontos extras); fica como comentário no bloco */
const LIVRE = /^\s*#\s*soma livre/i, LIVRE_TXT = '# soma livre: os pesos podem passar de 100 (pontos extras)';
function livre(d, txt){ const linhas = String(txt == null ? CTX.AV_TXT || '' : txt).split('\n'), b = bloco(linhas, d); return !!b && linhas.slice(b.ini + 1, b.fim).some(l => LIVRE.test(l)); }
const somaDe = avs => avs.reduce((s, a) => s + (HJ.numBR(a.w) || 0), 0);
const fmtSoma = x => String(Math.round(x * 100) / 100).replace('.', ',');
/* resposta da IA (ou linhas coladas) → avaliações; as que já existiam (mesma chave) guardam a linha original */
function lerResposta(txt, atuais){
  const novas = [], obs = [];
  for(let l of String(txt).split('\n')){
    l = l.replace(/`/g, '').trim(); if(l.startsWith('#')){ const o = l.replace(/^#+\s*/, '').trim(); if(o) obs.push(o); continue; }
    if(!l || /^[-|: ]+$/.test(l)) continue;
    l = l.replace(/^\|/, '').replace(/\|$/, '');
    const p = l.split('|').map(x => x.trim()); if(p.length < 4 || /^chave$/i.test(p[0])) continue;
    const est = p[2].includes('?') || p[3].includes('?'), dt = p[3].replace('?', '').trim();
    const velha = atuais.find(a => a.orig && a.orig.toUpperCase() === p[0].toUpperCase());
    novas.push({k:p[0], n:p[1], w:p[2].replace('?', '').replace('%', '').trim(), dt: /^\d{4}-/.test(dt) ? HJ.brData(dt) : dt, est, kw:(p[4] || '').toLowerCase(), cont:/cont/i.test(p[5] || ''), orig: velha ? velha.orig : '', raw: velha ? velha.raw : ''});
  }
  return {novas, obs, del: atuais.filter(a => a.orig && !novas.some(n => n.orig === a.orig)).map(a => a.orig)};
}
function validaAvs(avs, liv){
  const ks = avs.map(a => a.k.trim());
  if(!avs.length) return 'Deixe pelo menos uma avaliação.';
  if(ks.some(k => !CHAVE.test(k))) return 'A chave tem de 1 a 8 letras ou números, sem espaço (ex.: P1, T2, L).';
  if(new Set(ks.map(k => k.toUpperCase())).size !== ks.length) return 'Há duas avaliações com a mesma chave.';
  const ruimD = avs.find(a => !HJ.isoData(a.dt, HOJE)); if(ruimD) return `${ruimD.k || 'Avaliação'}: ${HJ.dataRuim(ruimD.dt)}`;
  if(avs.some(a => !(HJ.numBR(a.w) > 0))) return 'Todo peso precisa ser um número maior que zero.';
  const sm = somaDe(avs);
  if(liv ? sm < 99.99 : Math.abs(sm - 100) > .01) return `Os pesos somam ${fmtSoma(sm)}%; precisam somar ${liv ? '100 ou mais' : '100 (ou marque "pode passar de 100%")'}.`;
  return '';
}
/* o avaliacoes.txt inteiro com o bloco da disciplina trocado (comentários ficam no lugar; observações da IA e a marca de soma livre, logo abaixo do cabeçalho) */
function montaAv(txt, d, avs, obs, liv){
  const linhas = String(txt || '').split('\n'), b = bloco(linhas, d);
  const novas = avs.map(a => escreveLinha({...a, k:a.k.trim(), n:a.n.trim()}));
  const corpo = []; let j = 0;
  for(const l of linhas.slice(b.ini + 1, b.fim)){ if((obs && /^\s*#\s*\(IA\)/.test(l)) || LIVRE.test(l)) continue; if(!ehAval(l)){ corpo.push(l); continue; } if(j === 0) corpo.push(...novas); j++; }
  if(!j) corpo.push(...novas);
  if(obs) corpo.unshift(...obs.map(o => '# (IA) ' + o.replace(/\n/g, ' ')));
  if(liv) corpo.unshift(LIVRE_TXT);
  return [...linhas.slice(0, b.ini + 1), ...corpo, ...linhas.slice(b.fim)].join('\n');
}
const avsDe = (txt, d) => { const linhas = String(txt || '').split('\n'), b = bloco(linhas, d); return b ? linhas.slice(b.ini + 1, b.fim).filter(ehAval).map(lerLinha) : null; };
/* "ler todos os planos" → salvar selecionados: aplica as respostas da IA de várias disciplinas num POST só.
   Pula (para revisar no editor) a que não passa na validação ou apagaria uma avaliação com nota lançada. */
async function aplicaVarios(itens){
  let av = String(CTX.AV_TXT || ''); const ok = [], falha = [];
  const comNota = d => new Set(String(CTX.NT_TXT || '').split('\n').map(l => l.split('|').map(x => x.trim())).filter(p => p.length >= 4 && p[1].toUpperCase() === d).map(p => p[2]));
  for(const it of itens){
    const atuais = avsDe(av, it.d); if(!atuais){ falha.push({d:it.d, motivo:'disciplina não encontrada'}); continue; }
    const r = lerResposta(it.texto, atuais), liv = livre(it.d, av);
    if(!r.novas.length){ falha.push({d:it.d, motivo:'a resposta não tem avaliações'}); continue; }
    const perde = r.del.filter(k => comNota(it.d).has(k));
    if(perde.length){ falha.push({d:it.d, motivo:`${perde.join(', ')} tem nota lançada: revise no editor`}); continue; }
    const err = validaAvs(r.novas, liv); if(err){ falha.push({d:it.d, motivo:err}); continue; }
    av = montaAv(av, it.d, r.novas, r.obs, liv); ok.push(it.d);
  }
  if(ok.length){ await post('/api/jogo/planos', {avaliacoes:av}); await recarrega(); render(); }
  return {ok, falha};
}

let E = null;   // edição em andamento
function abre(d){
  aoSalvar = null;
  const linhas = String(CTX.AV_TXT || '').split('\n'), b = bloco(linhas, d), boss = BOSSES.find(x => x.d === d);
  if(!b || !boss){ toast('Disciplina não encontrada no avaliacoes.txt'); return; }
  const nlin = String(CTX.NT_TXT || '').split('\n');
  E = {d, boss, avs: linhas.slice(b.ini + 1, b.fim).filter(ehAval).map(lerLinha), del:[],
    notas: nlin.map((raw, idx) => { const p = raw.split('|').map(x => x.trim()); return p.length >= 4 && !raw.trim().startsWith('#') && p[1].toUpperCase() === d
      ? {idx, raw, data:p[0], k:p[2], v:p[3], parcial:/parcial/i.test(p[4] || ''), apaga:false} : null; }).filter(Boolean),
    err:'', confirma:'', obs:null, lemb:[], anexo:palpite(d), livre:livre(d)};
  desenha();
}
/* plano de ensino da pasta planos/ com a sigla ou o nome da disciplina no nome do arquivo */
function palpite(d){
  const ps = window.HJ_IA ? window.HJ_IA.planos() : [], j = (CTX.JOG.disciplinas || []).find(x => x.d === d) || {};
  const sem = t => HJ.norm ? HJ.norm(t) : String(t).toLowerCase(), alvo = [d, j.n].filter(Boolean).map(t => sem(t).replace(/[^a-z0-9]/g, ''));
  return ps.find(f => alvo.some(a => a && sem(f).replace(/[^a-z0-9]/g, '').includes(a))) || '';
}
/* resposta da IA (ou linhas coladas): "chave | nome | peso | data | palavra-chave | contínua", data em dd/mm/aaaa (ou mm/dd/aaaa, conforme a opção) ou AAAA-MM-DD, "?" = estimada */
function cola(txt){
  const r = lerResposta(txt, E.avs);
  if(!r.novas.length){ E.err = 'Não achei nenhuma linha no formato "chave | nome | peso | data".'; desenha(); return; }
  E.del.push(...r.del); E.avs = r.novas; E.obs = r.obs; E.err = ''; desenha(); toast(`${r.novas.length} avaliações coladas <small>confira e salve</small>`);
}
const soma = () => somaDe(E.avs);
const somaOk = sm => E.livre ? sm >= 99.99 : sm === 100;
const somaTxt = sm => `pesos somam ${fmtSoma(sm)}%${somaOk(sm) ? ' ✓' : E.livre ? ' (precisa ser 100 ou mais)' : ' (precisa ser 100)'}`;
function desenha(){
  let bg = document.getElementById('ce'); if(!bg){ bg = document.createElement('div'); bg.id = 'ce'; bg.className = 'wz-bg'; document.body.appendChild(bg); }
  const sm = Math.round(soma() * 100) / 100;
  bg.innerHTML = `<div class="wz" role="dialog" aria-modal="true" aria-labelledby="ce-t">
    <div class="wz-top"><span class="av" style="--s:42px">${ic(E.boss.ic)}</span><div><h2 id="ce-t">${esc(E.boss.n)} · ${esc(E.d)}</h2><p>Avaliações e notas desta disciplina</p></div></div>
    <div class="wz-body">
      <p>Cada avaliação é uma prova, um trabalho ou uma lista. <b>Peso</b> em % (os pesos somam 100; com ponto extra, marque "pode passar de 100%"). <b>Contínua</b> = várias notas parciais que viram uma média (ex.: listas). <b>Estimada</b> = peso ou data ainda não confirmados no plano de ensino. A <b>palavra-chave</b> liga as tarefas com ela no texto a esta avaliação.</p>
      <div class="wz-disc">${E.avs.map((a, i) => `<div class="ce-row">
        <label>Chave<input data-ce="${i}:k" value="${esc(a.k)}" maxlength="8" placeholder="P1"></label>
        <label>Nome<input data-ce="${i}:n" value="${esc(a.n)}" maxlength="50" placeholder="Prova 1"></label>
        <label>Peso %<input data-ce="${i}:w" value="${esc(a.w)}" inputmode="decimal" maxlength="5"></label>
        <label>Data<input class="dt" data-ce="${i}:dt" value="${esc(a.dt)}" inputmode="numeric" maxlength="10" placeholder="${HJ.fmtTxt()}"></label>
        <button type="button" class="wz-x" data-cedel="${i}" aria-label="remover ${esc(a.n || a.k)}">✕</button>
        <div class="op"><label><input type="checkbox" data-ce="${i}:cont"${a.cont ? ' checked' : ''}> contínua</label><label><input type="checkbox" data-ce="${i}:est"${a.est ? ' checked' : ''}> estimada</label>
          <label>palavra-chave <input type="text" data-ce="${i}:kw" value="${esc(a.kw)}" maxlength="60" placeholder="ex.: avl, árvore" title="palavras que aparecem nas tarefas desta avaliação, separadas por vírgula"></label></div></div>`).join('')}</div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><button type="button" class="btn" data-ceadd>+ avaliação</button>
        <span class="ce-soma ${somaOk(sm) ? 'ok' : 'ruim'}">${somaTxt(sm)}</span>
        <label class="ce-livre" title="para planos com ponto extra ou bônus: a vida do chefão continua caindo com média 6"><input type="checkbox" data-celivre${E.livre ? ' checked' : ''}> pode passar de 100% (pontos extras)</label></div>
      ${E.obs && E.obs.length ? `<div class="ce-obs"><b>Observações da IA</b> (ficam no plano como comentário; confira os itens estimados):<ul>${E.obs.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>` : ''}
      ${iaSec()}
      <div class="ce-sec"><h3>Notas lançadas</h3>
        ${E.notas.length ? E.notas.map((n, i) => `<div class="ce-nota${n.apaga ? ' del' : ''}"><span>${esc(n.k)}${n.parcial ? ' · parcial' : ''}<small>lançada em ${HJ.brData(n.data)}</small></span>
          <input data-cen="${i}" value="${esc(n.v)}" inputmode="decimal" aria-label="nota de ${esc(n.k)}"${n.apaga ? ' disabled' : ''}>
          <button type="button" class="wz-x" data-cendel="${i}" aria-label="${n.apaga ? 'manter' : 'apagar'} nota de ${esc(n.k)}" title="${n.apaga ? 'manter' : 'apagar'}">${n.apaga ? '↺' : '✕'}</button></div>`).join('')
          : '<p>Nenhuma nota lançada ainda. Elas são registradas no quadro dos chefões, depois da data da avaliação.</p>'}
      </div>
    </div>
    <div class="wz-foot"><span class="err" role="alert">${esc(E.err)}</span><span style="display:flex;gap:8px;margin-left:auto"><button type="button" class="btn" data-cesair>cancelar</button><button type="button" class="btn v" data-cesalva>salvar</button></span></div></div>`;
}
function iaSec(){
  const IA = window.HJ_IA, lig = IA && IA.ligada(), lb = IA ? IA.lembretes(E.d) : [], roda = IA && IA.rodando();
  const ta = `<textarea id="ce-cola" placeholder="P1 | Prova 1 | 30 | ${HJ.brData('2026-09-22')} | limite |&#10;P2 | Prova 2 | 70 | ${HJ.brData('2026-12-01')}? | |" style="min-height:90px;background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:8px 10px;font:12.5px var(--f-mono);color:var(--ink)"></textarea>
        <div><button type="button" class="btn" data-cecola>usar estas linhas</button></div>`;
  if(!lig) return `<div class="ce-sec"><h3>Com IA (opcional)</h3>
        <p>Copie o pedido, cole numa IA (ChatGPT, Claude, Gemini...) junto com o PDF do plano de ensino e cole a resposta aqui. As linhas substituem as avaliações acima; confira e clique em salvar. Com uma IA de terminal instalada, ligue-a na aba Regras e ela faz isso sozinha.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn" data-ceia>copiar pedido para a IA</button></div>
        ${ta}</div>`;
  const ps = IA.planos();
  return `<div class="ce-sec"><h3>Com IA (${esc(IA.nomeAg())})</h3>
        <p>Escolha o plano de ensino e a IA monta as avaliações. As linhas substituem as de cima: confira pesos e datas e clique em salvar. Leva de alguns segundos a alguns minutos.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <select id="ce-plano" aria-label="plano de ensino" style="max-width:260px">${ps.length ? ps.map(f => `<option${f === E.anexo ? ' selected' : ''}>${esc(f)}</option>`).join('') : '<option value="">nenhum plano na pasta</option>'}</select>
          <button type="button" class="btn" data-cearq>enviar arquivo</button><input type="file" id="ce-arq" accept=".pdf,.html,.htm,.docx,.txt,.md" hidden>
          <button type="button" class="btn v" data-ceiarun="plano"${roda || !ps.length ? ' disabled' : ''}>ler plano com IA</button></div>
        ${lb.length ? `<p>${lb.length} lembrete(s) da caixa de entrada cita(m) ${esc(E.d)}: ${lb.map(m => `<i>${esc(m.t)}</i>`).join(' · ')}</p>
          <div><button type="button" class="btn" data-ceiarun="lemb"${roda ? ' disabled' : ''}>aplicar lembretes com IA</button></div>` : ''}
        <details><summary class="sub" style="cursor:pointer">ou copiar e colar</summary><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
          <div><button type="button" class="btn" data-ceia>copiar pedido para a IA</button></div>${ta}</div></details></div>`;
}
async function rodaIA(tipo){
  const IA = window.HJ_IA, anexo = tipo === 'plano' ? (document.getElementById('ce-plano') || {}).value : '';
  if(tipo === 'plano' && !anexo){ toast('Escolha ou envie o plano de ensino'); return; }
  const d = E.d, lemb = tipo === 'lemb' ? IA.lembretes(d) : [];
  try {
    const txt = await IA.planoIA(d, anexo);
    if(!E || E.d !== d){ toast(`A resposta da IA para ${d} chegou, mas o editor foi fechado`); return; }
    E.lemb = lemb; cola(txt);
  } catch(err){ if(E){ E.err = 'A IA não respondeu: ' + err.message; desenha(); } else toast('A IA não respondeu: ' + esc(err.message)); }
}
function valida(){
  const e = validaAvs(E.avs, E.livre); if(e) return e;
  const nr = E.notas.find(n => !n.apaga && !(HJ.nota10(n.v) >= 0 && HJ.nota10(n.v) <= 10)); if(nr) return `Nota inválida em ${nr.k}: de 0 a 10, ou em pontos como 4/5.`;
  return '';
}
async function salva(){
  E.err = valida(); if(E.err){ desenha(); return; }
  /* chaves renomeadas levam as notas junto; avaliação removida leva as notas dela (com confirmação) */
  const ren = {}; E.avs.forEach(a => { if(a.orig && a.orig !== a.k.trim()) ren[a.orig] = a.k.trim(); });
  const vivas = new Set(E.avs.map(a => a.orig).filter(Boolean)), perdem = E.notas.filter(n => !n.apaga && !vivas.has(n.k) && E.del.includes(n.k));
  const aviso = perdem.map(n => n.k).filter((k, i, v) => v.indexOf(k) === i).join(', ');
  if(aviso && E.confirma !== aviso){ E.confirma = aviso; E.err = `${aviso} tem nota lançada e a nota vai ser apagada junto. Clique em salvar de novo para confirmar.`; desenha(); return; }
  const av = montaAv(CTX.AV_TXT, E.d, E.avs, E.obs, E.livre);
  const nlin = String(CTX.NT_TXT || '').split('\n'), porIdx = new Map(E.notas.map(n => [n.idx, n]));
  const nt = nlin.flatMap((raw, idx) => { const n = porIdx.get(idx); if(!n) return [raw];
    const k = ren[n.k] || n.k; if(n.apaga || perdem.includes(n)) return [];
    if(k === n.k && n.v === n.raw.split('|')[3].trim()) return [raw];
    return [`${n.data} | ${E.d} | ${k} | ${String(HJ.nota10(n.v)).replace('.', ',')}${n.parcial ? ' | parcial' : ''}`]; }).join('\n');
  try { await post('/api/jogo/planos', {avaliacoes:av, notas:nt}); for(const m of E.lemb) await post('/api/jogo/ajuste', {quando:m.d, texto:m.t, aplicado:true}); await recarrega(); }
  catch(err){ E.err = 'Não salvou: ' + err.message; desenha(); return; }
  const nl = E.lemb.length; if(aoSalvar){ aoSalvar(); aoSalvar = null; } document.getElementById('ce').remove(); E = null; render(); toast('Chefão salvo <small>avaliacoes.txt e notas.txt' + (nl ? ` · ${nl} lembrete(s) marcado(s) como aplicado(s)` : '') + '</small>');
}

document.addEventListener('input', e => {
  if(!E) return; const t = e.target;
  if(t.dataset.ce){ const [i, c] = t.dataset.ce.split(':'); E.avs[+i][c] = t.type === 'checkbox' ? t.checked : t.value;
    if(c === 'w'){ const s = document.querySelector('.ce-soma'), sm = Math.round(soma() * 100) / 100; s.className = 'ce-soma ' + (somaOk(sm) ? 'ok' : 'ruim'); s.textContent = somaTxt(sm); } }
  if(t.matches('[data-celivre]')){ E.livre = t.checked; desenha(); }
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
  if(q('[data-cecola]')){ E.lemb = []; cola(document.getElementById('ce-cola').value); return; }
  if(q('[data-cearq]')){ document.getElementById('ce-arq').click(); return; }
  const ir = q('[data-ceiarun]'); if(ir){ ir.disabled = true; rodaIA(ir.dataset.ceiarun); return; }
  if(q('[data-cesair]')){ document.getElementById('ce').remove(); E = null; aoSalvar = null; return; }
  if(q('[data-cesalva]')) salva();
});
document.addEventListener('change', async e => {
  if(!E) return;
  if(e.target.id === 'ce-plano'){ E.anexo = e.target.value; return; }
  if(e.target.id !== 'ce-arq' || !e.target.files[0]) return;
  try { E.anexo = await window.HJ_IA.enviaPlano(e.target.files[0]); toast(`${esc(E.anexo)} guardado <small>na pasta planos</small>`); }
  catch(err){ toast('Não enviou: ' + esc(err.message)); }
  if(E) desenha();
});
document.addEventListener('keydown', e => { if(E && e.key === 'Escape'){ document.getElementById('ce').remove(); E = null; } });

/* botões "editar" no quadro dos chefões e no chefão aberto da Arena */
const rB2_0 = RENDER.b2, rB_0 = RENDER.b;
RENDER.b2 = S => { rB2_0(S); document.querySelectorAll('#b2-cols .col').forEach((c, i) => { const b = S.bs[i]; if(b) c.querySelector('.ch').insertAdjacentHTML('beforeend', `<button type="button" class="btn" data-cedit="${b.d}" style="margin-top:10px">editar avaliações e notas</button>`); }); };
RENDER.b = S => { rB_0(S); const d = document.querySelector('#b-bosses .bdet'); if(d && UI.bsel) d.insertAdjacentHTML('beforeend', `<p style="margin:10px 0 0"><button type="button" class="btn" data-cedit="${UI.bsel}">editar avaliações e notas</button></p>`); };
/* "ler todos os planos" (ia.js): abre o editor com a resposta da IA já colada; aoSalvar marca o item como salvo */
let aoSalvar = null;
window.HJ_CHEFES = {abre, livre, aplicaVarios, cola: (txt, fn) => { if(!E) return; E.lemb = []; aoSalvar = fn || null; cola(txt); }};
if(CTX) tab(cur);
})();
