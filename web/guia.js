/* Hunter.todo · guia: o assistente da primeira entrada (nome, nickname, tags, disciplinas) e o tutorial de cada aba.
 * Carregado depois do script da página: usa CTX, EST, NEN, HOJE, tab, render, post, recarrega, esc, ic, NC, salvaUI.
 * O assistente grava por POST /api/config {jogador, avaliacoes}; o tutorial lembra as abas já vistas em estado.json (tour).
 */
(function(){
'use strict';

/* ---------- estilo ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.wz-bg{position:fixed;inset:0;z-index:60;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(6px);overflow-y:auto;padding:24px 16px calc(24px + env(safe-area-inset-bottom,0px))}
.wz{max-width:860px;margin:0 auto;background:var(--panel);border:1px solid var(--hair);border-radius:18px;box-shadow:0 30px 80px -30px rgba(0,0,0,.6)}
.wz-top{display:flex;gap:14px;align-items:center;padding:18px 22px;border-bottom:1px solid var(--hair)}
.wz-top img{width:42px;height:42px}
.wz-top h2{margin:0;font:700 20px var(--f-hud)} .wz-top p{margin:0;color:var(--soft);font-size:13px}
.wz-steps{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap}
.wz-steps i{width:26px;height:5px;border-radius:3px;background:var(--track)} .wz-steps i.on{background:var(--volt)}
.wz-body{padding:20px 22px;display:flex;flex-direction:column;gap:14px}
.wz-body h3{margin:0;font:700 17px var(--f-hud)}
.wz-body p{margin:0;color:var(--soft);font-size:14px;max-width:72ch}
.wz-body p b{color:var(--ink)}
.wz-f{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.wz label{display:flex;flex-direction:column;gap:4px;font:600 11px var(--f-mono);color:var(--faint);letter-spacing:.08em;text-transform:uppercase}
.wz input,.wz select{background:var(--panel2);border:1px solid var(--hair);border-radius:9px;padding:8px 10px;font:14px var(--f-ui);color:var(--ink);text-transform:none;letter-spacing:0;min-width:0}
.wz input.bad{border-color:var(--red)}
.wz small.h{font:12px var(--f-ui);color:var(--soft);text-transform:none;letter-spacing:0}
.wz-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.wz-card{border:1px solid var(--hair);border-radius:12px;padding:12px;background:var(--panel2);display:flex;flex-direction:column;gap:4px}
.wz-card b{font:700 14px var(--f-hud);display:flex;gap:8px;align-items:center}
.wz-card span{font-size:13px;color:var(--soft)}
.wz-tags{display:flex;flex-direction:column;gap:8px}
.wz-tag{display:grid;grid-template-columns:150px minmax(0,1fr) 160px;gap:6px 14px;align-items:center;border:1px solid var(--hair);border-left:4px solid var(--c);border-radius:12px;padding:10px 12px;background:var(--panel2)}
.wz-tag .nm b{display:block;font:700 14px var(--f-hud)} .wz-tag .nm small{font:600 11px var(--f-mono);color:var(--c)}
.wz-tag .es{font-size:13px;color:var(--soft)} .wz-tag .es b{color:var(--ink);font-weight:600}
.wz-tag code{grid-column:2/4;font:12px var(--f-mono);color:var(--soft);background:var(--panel);border-radius:6px;padding:3px 8px;overflow-wrap:anywhere}
.wz-tag .fixo{font:600 13px var(--f-mono);color:var(--soft)}
.wz-disc{display:flex;flex-direction:column;gap:8px}
.wz-row{display:grid;grid-template-columns:110px minmax(0,1fr) 150px 150px 34px;gap:8px;align-items:end}
.wz-row .boss{grid-column:1/-1;font:12px var(--f-mono);color:var(--soft);margin-top:-2px}
.wz-x{border:1px solid var(--hair);background:none;border-radius:9px;height:36px;cursor:pointer;color:var(--soft)} .wz-x:hover{color:var(--red);border-color:var(--red)}
.wz-foot{display:flex;gap:10px;justify-content:space-between;align-items:center;padding:14px 22px;border-top:1px solid var(--hair);flex-wrap:wrap}
.wz-foot .err{color:var(--red);font-size:13px}
.wz-av{display:flex;gap:10px;flex-wrap:wrap}
.wz-av button{width:64px;height:64px;border-radius:50%;border:2px solid var(--hair);background:var(--panel2) center/cover;cursor:pointer;padding:0}
.wz-av button[aria-pressed="true"]{border-color:var(--volt);box-shadow:0 0 0 3px color-mix(in srgb,var(--volt) 25%,transparent)}
@media (max-width:720px){ .wz-f,.wz-cards{grid-template-columns:1fr} .wz-tag{grid-template-columns:1fr} .wz-tag code{grid-column:1} .wz-row{grid-template-columns:1fr 1fr} .wz-row .wz-x{grid-column:2} }

.tr-hole{position:fixed;z-index:70;border-radius:14px;box-shadow:0 0 0 9999px rgba(8,10,16,.66);outline:2px solid var(--volt);pointer-events:none;transition:all .2s ease}
.tr-pop{position:fixed;z-index:71;width:min(360px,calc(100vw - 32px));background:var(--panel);border:1px solid var(--volt);border-radius:14px;padding:14px 16px;box-shadow:0 20px 50px -20px rgba(0,0,0,.7)}
.tr-pop .tr-k{font:600 11px var(--f-mono);color:var(--faint);letter-spacing:.1em;text-transform:uppercase}
.tr-pop h4{margin:4px 0 6px;font:700 16px var(--f-hud)}
.tr-pop p{margin:0;font-size:14px;color:var(--soft)} .tr-pop p b{color:var(--ink)}
.tr-pop .bt{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
.tr-pop .bt .pl{margin-right:auto}
.gnav .tr-q{margin-left:4px}
@media (prefers-reduced-motion:reduce){.tr-hole{transition:none}}
</style>`);

/* ---------- assistente da primeira entrada ---------- */
const TIPOS = [
  {k:'ent', n:'Entrega',   c:5, pre:'@', ess:'algo que você <b>entrega para alguém</b>: lista, trabalho, atividade no sistema da faculdade. Tem prazo e alguém confere.', ex:'Lista 3 de derivadas +fac.CALC2 {tag} due:sexta', xp:25},
  {k:'est', n:'Estudo',    c:0, pre:'@', ess:'tempo de <b>aprender</b>: revisar, ler, resumir, refazer exercícios. Ninguém cobra, mas é o que prepara a prova.', ex:'Revisar integrais por partes +fac.CALC2 {tag}', xp:15},
  {k:'fac', n:'Faculdade', c:2, pre:'+', ess:'<b>outras coisas da faculdade</b> que não são entrega nem estudo: organizar o projeto, montar o grupo, falar com o professor. Basta a disciplina.', ex:'Montar o grupo do projeto +fac.POO', xp:15, fixo:'+fac.SIGLA'},
  {k:'tre', n:'Treino',    c:1, pre:'+', ess:'<b>prática fora da matéria</b>: Codeforces, contest, projeto para treinar programação.', ex:'Virtual contest no Codeforces {tag}', xp:10},
  {k:'hab', n:'Hábito',    c:4, pre:'+', ess:'o que se <b>repete todo dia</b>: digitação, leitura, exercício. Vale metade, mas mantém o Ten.', ex:'Treino de digitação {tag}', xp:5},
  {k:'vid', n:'Vida',      c:3, pre:'',  ess:'<b>todo o resto</b>: casa, família, saúde, documentos. Sem tag nenhuma.', ex:'Renovar a carteirinha do RU', xp:10, fixo:'sem tag'},
];
const RYODAN = [['Chrollo','crown','O líder: rouba a técnica dos outros.'],['Feitan','spider','Rápido e cruel nos detalhes.'],['Machi','thread','Costura tudo com fios de Nen.'],
  ['Nobunaga','bullet','Um corte só, se você entrar no alcance.'],['Uvogin','horn','Força bruta: só cai com treino.'],['Shalnark','antenna','Controla tudo por antenas.'],
  ['Shizuku','vacuum','Aspira qualquer coisa e esquece o resto.'],['Kortopi','copy','Copia tudo, mas a cópia some.'],['Franklin','bullet','Rajada sem fim de exercícios.'],
  ['Phinks','wing','Cada giro do braço bate mais forte.'],['Pakunoda','spider','Lê as memórias: sabe o que você não estudou.'],['Bonolenov','cat','O som da batalha.']];
const W = {editar:false, passo:0, nome:'', nick:'', av:'logo', tags:{}, habs:[], cfOn:false, cfH:'', cfM:3, disc:[], ini:'', fim:'', p1:40, p2:60, err:''};
/* frequência do hábito: 0 = todo dia; 1 a 6 = vezes por semana (seg a dom) */
const freqSel = (attr, v) => `<select ${attr} aria-label="Frequência">${[0,1,2,3,4,5,6].map(n => `<option value="${n}"${+v === n ? ' selected' : ''}>${n ? n + '× por semana' : 'todo dia'}</option>`).join('')}</select>`;
const habsJSON = (nomes, freq) => nomes.map((n,i) => [String(n).trim(), +freq[i] || 0]).filter(([n]) => n).map(([n,f]) => f ? {id:slug(n), n, semana:f} : {id:slug(n), n});
const slug = n => 'h-' + (norm(n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'habito');
const HANDLE = /^[A-Za-z0-9_.-]{3,24}$/;
function chefaoDe(d, i){
  const b = (BOSSES || []).find(b => b.d === d.d);
  if(b && W.editar) return [b.n, b.ic, b.why];
  const usados = new Set((W.editar ? BOSSES : []).map(b => b.n)), livres = RYODAN.filter(r => !usados.has(r[0]));
  const novos = W.disc.slice(0, i + 1).filter(x => !(W.editar && (BOSSES || []).some(b => b.d === x.d))).length - 1;
  return livres[Math.max(0, novos) % livres.length] || RYODAN[i % RYODAN.length];
}
/* blocos do avaliacoes.txt por disciplina: do "# comentário" logo acima do [SIGLA] até o próximo bloco */
function blocos(txt){
  const L = String(txt||'').split('\n'), out = {}; let cur = null, buf = [];
  const fecha = () => { if(cur) out[cur] = buf.join('\n'); };
  for(let i = 0; i < L.length; i++){
    const m = L[i].trim().match(/^\[(\w+)\]/);
    if(m){ let k = buf.length; while(k > 0 && buf[k-1].trim().startsWith('#')) k--; const com = cur ? buf.splice(k) : []; fecha(); cur = m[1].toUpperCase(); buf = com.concat(L[i]); continue; }
    if(cur) buf.push(L[i]);
  }
  fecha(); return out;
}
const tagPadrao = k => { const T = HJx.TAGS[k]; return !T ? '' : T.ctx[0] ? '@' + T.ctx[0] : T.proj[0] ? '+' + T.proj[0] : ''; };
const limpaTag = (k, v) => { const pre = TIPOS.find(t => t.k === k).pre; v = String(v||'').trim().toLowerCase().replace(/\s+/g, ''); if(!v) return ''; if(v[0] !== '@' && v[0] !== '+') v = pre + v; return v.length > 1 ? v : ''; };
const iso = d => d.toISOString().slice(0,10);
function semestrePadrao(){
  const [y, m] = HOJE.split('-').map(Number);
  return m <= 6 ? [`${y}-02-01`, `${y}-06-30`, `${y}-08-01`] : [`${y}-08-01`, `${y}-12-15`, `${y+1}-02-01`];
}
function meio(a, b, f){ const x = new Date(a + 'T12:00:00Z'), y = new Date(b + 'T12:00:00Z'); return iso(new Date(+x + (y - x) * f)); }
function iniciaW(){
  const j = CTX.JOG || {};
  const [ini, fim] = j.semestre ? [j.semestre.ini, j.semestre.fim] : semestrePadrao();
  Object.assign(W, {passo:0, nome: j.nome && j.nome !== 'Hunter' ? j.nome : '', nick: j.nick || '', av: UI.avatar || 'logo', ini, fim, err:''});
  for(const t of TIPOS) if(!t.fixo) W.tags[t.k] = tagPadrao(t.k);
  W.habs = (j.habitos && j.habitos.length ? j.habitos.map(h => h.n) : ['Treino de digitação', 'Leitura (20 min)', 'Academia']);
  W.hf = (j.habitos && j.habitos.length ? j.habitos.map(h => h.semana || 0) : [0, 0, 2]);
  W.cfOn = !!(j.cf && j.cf.handle); W.cfH = (j.cf && j.cf.handle) || ''; W.cfM = (j.cf && j.cf.meta) || 3;
  W.disc = (j.disciplinas && j.disciplinas.length ? j.disciplinas : [{d:'', n:''}, {d:'', n:''}]).map(d => ({...d, n1: d.n1 || meio(ini, fim, .45), n2: d.n2 || meio(ini, fim, .95)}));
}
const PASSOS_1 = ['Quem é você', 'Como o jogo funciona', 'Tipos de tarefa', 'Hábitos', 'Disciplinas', 'Pronto'];
let PASSOS = PASSOS_1;
function passoHTML(){
  const p = W.editar ? 4 : W.passo;
  if(p === 0) return `<h3>Bem-vindo à Associação Hunter</h3>
    <p>O Hunter.todo transforma a sua lista de tarefas num jogo. Você continua anotando e concluindo tarefas; o jogo calcula o resto: andares, chefões, sequência de dias e moedas para a loja.</p>
    <div class="wz-f">
      <label>Nome<input id="wz-nome" value="${esc(W.nome)}" placeholder="ex.: Gon Freecss" maxlength="40"><small class="h">Aparece na sua ficha.</small></label>
      <label>Nickname<input id="wz-nick" value="${esc(W.nick)}" placeholder="ex.: gon" maxlength="20"><small class="h">Letras, números e _. É como os outros te veem no placar do grupo (Torre Trick).</small></label>
    </div>
    <label>Foto de perfil</label>
    <div class="wz-av">${['logo'].concat((CTX.AVATARES||[]).filter(a => HJx.catalogo([a]).slice(-1)[0].p === 0)).map(a => `<button type="button" data-wzav="${a}" aria-pressed="${W.av === a}" style="background-image:url('${(a === 'logo' ? LOGO : avSrc(a)).replace(/'/g, '%27')}')" title="${a === 'logo' ? 'Emblema' : esc(HJx.catalogo([a]).slice(-1)[0].n)}"></button>`).join('')}</div>
    <p style="font-size:13px">As outras fotos estão na Masadora, a loja do jogo.</p>`;
  if(p === 1) return `<h3>Como o jogo funciona</h3>
    <p>Seis peças. Nenhuma delas pune: XP não se perde, e nota baixa vira bônus.</p>
    <div class="wz-cards">
      <div class="wz-card"><b>${ic('tower')} Arena Celestial</b><span>Cada tarefa concluída dá <b>XP</b>, e o XP sobe andares (são 251). A torre zera no fim do semestre.</span></div>
      <div class="wz-card"><b>${ic('spider')} Chefões</b><span>Cada disciplina é um chefão. A <b>vida dele é a sua nota</b>: cada avaliação tira pontos, e média 6 derruba. Tarefa não derruba chefão, mas prepara a prova.</span></div>
      <div class="wz-card"><b>${ic('flame')} Ten</b><span>Dias seguidos com pelo menos uma tarefa feita. O <b>Zetsu</b> é uma folga guardada: um dia vazio não quebra a sequência.</span></div>
      <div class="wz-card"><b>${ic('int')} Tipos de Nen</b><span>Cada tarefa treina um dos 6 tipos. O mais fraco vira a <b>missão da semana</b>: as tarefas dele valem ×1,5.</span></div>
      <div class="wz-card"><b>${ic('coin')} Jenny e Masadora</b><span>XP também vira <b>Jenny</b>, a moeda da loja: fotos, cores, efeitos e prêmios reais que você mesmo define.</span></div>
      <div class="wz-card"><b>${ic('card')} Feitiços e cartas</b><span>Terminar a preparação de uma prova antes da data dá um <b>feitiço</b>. Conquistas viram cartas no Book.</span></div>
    </div>`;
  if(p === 2) return `<h3>Tipos de tarefa e tags</h3>
    <p>No todo.txt, uma <b>tag</b> é uma palavra com <b>@</b> ou <b>+</b> na tarefa. É ela que diz o tipo, e o tipo decide o XP e o Nen que a tarefa treina. Você pode trocar o nome das tags, desde que cada uma continue querendo dizer a mesma coisa. Na Lista você nem precisa digitar: escolhe o tipo num botão.</p>
    <div class="wz-tags">${TIPOS.map(t => { const tag = t.fixo ? '' : W.tags[t.k]; return `<div class="wz-tag" style="--c:${NC(t.c)}">
      <span class="nm"><b>${t.n}</b><small>${NEN[t.c].n} · ${t.xp} XP</small></span>
      <span class="es">${t.ess}</span>
      ${t.fixo ? `<span class="fixo">${t.fixo}</span>` : `<input id="wz-tag-${t.k}" value="${esc(tag)}" aria-label="Tag de ${t.n}" maxlength="24">`}
      <code>exemplo: ${esc(t.ex.replace('{tag}', tag || ''))}</code></div>`; }).join('')}</div>
    <p style="font-size:13px">Bônus: <b>×1,5</b> se concluir até o prazo (<span class="mono">due:</span>), ×1,5 na missão da semana e ×1,5 no chefão em fúria.</p>`;
  if(p === 3) return `<h3>Hábitos</h3>
    <p>Hábitos são o que você quer fazer <b>todo dia</b> ou <b>algumas vezes por semana</b> (ex.: academia 2× por semana). Eles aparecem sozinhos na Lista, você marca à mão quando fizer, e cada um vale ${5} XP e conta para o Ten. O semanal aparece todo dia até você cumprir a meta da semana (seg a dom), e o heatmap dele conta por semana.</p>
    <div class="wz-disc">${W.habs.map((h,i) => `<div class="wz-row" style="grid-template-columns:minmax(0,1fr) 150px 34px"><label>Hábito ${i + 1}<input id="wz-h-${i}" value="${esc(h)}" placeholder="ex.: Treino de digitação" maxlength="40"></label><label>Frequência${freqSel(`id="wz-hf-${i}"`, W.hf[i])}</label><button type="button" class="wz-x" data-wzhdel="${i}" aria-label="remover hábito">✕</button></div>`).join('')}</div>
    <div><button type="button" class="btn" data-wzhadd>+ hábito</button></div>
    <div class="wz-card" style="gap:10px">
      <b>${ic('tra')} Codeforces</b>
      <label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font:14px var(--f-ui);color:var(--ink)"><input type="checkbox" id="wz-cf"${W.cfOn ? ' checked' : ''}> Quero contar os problemas do Codeforces</label>
      <div class="wz-f"><label>Handle do Codeforces<input id="wz-cfh" value="${esc(W.cfH)}" placeholder="ex.: tourist" maxlength="24"${W.cfOn ? '' : ' disabled'}></label>
        <label>Meta por dia<input id="wz-cfm" inputmode="numeric" value="${W.cfM}"${W.cfOn ? '' : ' disabled'}></label></div>
      <span>Ele não se marca à mão: o jogo consulta o Codeforces e conta os problemas <b>aceitos</b> no dia (+5 XP cada, até 6). Bater a meta dá +10 e um heatmap só dele.</span>
    </div>`;
  if(p === 4) return `<h3>Disciplinas do semestre</h3>
    <p>Cada disciplina vira um chefão do Genei Ryodan. Por enquanto, toda matéria tem duas avaliações: <b>N1</b> e <b>N2</b>. Depois você pode detalhar (provas, listas, trabalhos) no arquivo <span class="mono">avaliacoes.txt</span>.</p>
    <div class="wz-f" style="grid-template-columns:repeat(4,minmax(0,1fr))">
      <label>Início do semestre<input class="dt" inputmode="numeric" maxlength="10" placeholder="${HJ.fmtTxt()}" id="wz-ini" value="${HJ.brData(W.ini)}"></label>
      <label>Fim do semestre<input class="dt" inputmode="numeric" maxlength="10" placeholder="${HJ.fmtTxt()}" id="wz-fim" value="${HJ.brData(W.fim)}"></label>
      <label>Peso da N1<input id="wz-p1" inputmode="numeric" value="${W.p1}"></label>
      <label>Peso da N2<input id="wz-p2" inputmode="numeric" value="${W.p2}"></label>
    </div>
    <div class="wz-disc">${W.disc.map((d,i) => { const r = chefaoDe(d, i); return `<div class="wz-row">
      <label>Sigla<input id="wz-d-${i}" value="${esc(d.d)}" placeholder="CALC2" maxlength="8"${d.det ? ' readonly title="disciplina com plano detalhado: a sigla fica"' : ''}></label>
      <label>Nome<input id="wz-n-${i}" value="${esc(d.n)}" placeholder="Cálculo II" maxlength="50"></label>
      ${d.det ? `<span class="sub" style="grid-column:span 2;align-self:center">plano detalhado (${d.det} avaliações): datas e pesos ficam no <span class="mono">avaliacoes.txt</span></span>`
        : `<label>Data da N1<input class="dt" inputmode="numeric" maxlength="10" placeholder="${HJ.fmtTxt()}" id="wz-n1-${i}" value="${HJ.brData(d.n1)}"></label>
      <label>Data da N2<input class="dt" inputmode="numeric" maxlength="10" placeholder="${HJ.fmtTxt()}" id="wz-n2-${i}" value="${HJ.brData(d.n2)}"></label>`}
      <button type="button" class="wz-x" data-wzdel="${i}" title="remover" aria-label="remover disciplina">✕</button>
      <span class="boss">chefão: ${r[0]} · ${esc(r[2])}${d.notas ? ` · <b style="color:var(--amb)">${d.notas} nota(s) registrada(s)</b>` : ''}</span></div>`; }).join('')}</div>
    <div><button type="button" class="btn" data-wzadd>+ disciplina</button></div>
    <p style="font-size:13px">A sigla vira a tag da disciplina: <span class="mono">+fac.SIGLA</span>. Não sabe a data da prova ainda? Deixe a sugerida e ajuste quando souber.</p>`;
  return `<h3>Tudo pronto, ${esc(W.nome.split(' ')[0] || 'Hunter')}</h3>
    <p>Você começa no andar 1, com a paleta Simples, ${W.disc.filter(d => d.d).length} chefões pela frente e ${W.habs.filter(Boolean).length + (W.cfOn ? 1 : 0)} hábitos. Anote as tarefas na <b>Lista</b>, conclua, e veja a Arena subir.</p>
    <p>Quer um tour rápido? Ele mostra o que cada bloco de cada aba quer dizer. Dá para rever a qualquer hora pelo botão <b>? tutorial</b>.</p>`;
}
function coleta(){
  const v = id => { const e = document.getElementById(id); return e ? e.value : null; };
  if(W.editar){}
  else if(W.passo === 0){ W.nome = (v('wz-nome')||'').trim(); W.nick = (v('wz-nick')||'').trim().toLowerCase(); }
  if(!W.editar && W.passo === 2) for(const t of TIPOS) if(!t.fixo) W.tags[t.k] = limpaTag(t.k, v('wz-tag-' + t.k));
  if(!W.editar && W.passo === 3){
    W.habs = W.habs.map((h,i) => (v('wz-h-' + i) || '').trim()); W.hf = W.habs.map((h,i) => +(v('wz-hf-' + i) || 0));
    const cf = document.getElementById('wz-cf'); W.cfOn = !!(cf && cf.checked); W.cfH = (v('wz-cfh') || '').trim(); W.cfM = parseInt(v('wz-cfm')) || 0;
  }
  if(W.passo === 4 || W.editar){
    const dt = (id, antes) => { const x = v(id); if(x == null) return antes; const r = HJ.isoData(x, HOJE); if(!r) W.dtRuim = x; return r || antes; };
    W.dtRuim = '';
    W.ini = dt('wz-ini', W.ini); W.fim = dt('wz-fim', W.fim); W.p1 = +v('wz-p1') || 0; W.p2 = +v('wz-p2') || 0;
    W.disc = W.disc.map((d,i) => ({...d, d:(v('wz-d-'+i)||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,''), n:(v('wz-n-'+i)||'').trim(), n1:dt('wz-n1-'+i, d.n1), n2:dt('wz-n2-'+i, d.n2)}));
  }
}
function valida(){
  if(!W.editar && W.passo === 0){
    if(!W.nome) return 'Escreva o seu nome.';
    if(!/^[a-z0-9_]{2,20}$/.test(W.nick)) return 'O nickname precisa de 2 a 20 letras, números ou _.';
  }
  if(!W.editar && W.passo === 2){
    const vs = Object.values(W.tags);
    if(vs.some(x => !x)) return 'Toda tag precisa de um nome.';
    if(new Set(vs).size !== vs.length) return 'Duas tags estão com o mesmo nome.';
    if(vs.some(x => /^\+fac\./.test(x))) return '+fac. é reservado para as disciplinas.';
  }
  if(!W.editar && W.passo === 3){
    const hs = W.habs.filter(Boolean);
    if(new Set(hs.map(slug)).size !== hs.length) return 'Há dois hábitos com o mesmo nome.';
    if(W.cfOn && !HANDLE.test(W.cfH)) return 'Escreva o seu handle do Codeforces (3 a 24 letras, números, _ . -).';
    if(W.cfOn && !(W.cfM >= 1 && W.cfM <= 6)) return 'A meta do Codeforces vai de 1 a 6 problemas por dia.';
  }
  if(W.passo === 4 || W.editar){
    const ds = W.disc.filter(d => d.d);
    if(W.dtRuim) return HJ.dataRuim(W.dtRuim);
    if(!ds.length) return 'Cadastre pelo menos uma disciplina (a sigla basta).';
    if(new Set(ds.map(d => d.d)).size !== ds.length) return 'Há duas disciplinas com a mesma sigla.';
    if(!(W.ini < W.fim)) return 'O fim do semestre precisa ser depois do início.';
    if(W.p1 + W.p2 !== 100) return `Os pesos da N1 e da N2 somam ${W.p1 + W.p2}; precisam somar 100.`;
    if(ds.some(d => !d.det && !(d.n1 < d.n2))) return 'Em cada disciplina, a N2 vem depois da N1.';
  }
  return '';
}
function avaliacoesTxt(){
  const volta = new Date(W.fim + 'T12:00:00Z'); volta.setUTCDate(volta.getUTCDate() + 50);
  const L = ['# Plano de avaliação de cada disciplina (Hunter.todo). Gerado pelo assistente da primeira entrada; pode editar à mão.',
    '# temporada | nome | início | fim do semestre | volta às aulas',
    '# [SIGLA] chefão | ícone | por que esse chefão',
    '# chave | nome da avaliação | peso | data | palavra-chave (opcional) | contínua (opcional)',
    '# Os pesos de cada disciplina somam 100. "?" no peso ou na data = estimado.',
    '', `temporada | ${W.ini.slice(0,4)}-${W.ini.slice(5,7) <= '06' ? 1 : 2} | ${W.ini} | ${W.fim} | ${iso(volta)}`];
  W.disc.filter(d => d.d).forEach((d,i) => { const r = chefaoDe(d, i);
    if(d.det && d.bloco) L.push('', d.bloco.trim());                // plano detalhado: o bloco do arquivo, sem mexer
    else L.push('', `# ${d.d}${d.n ? ' · ' + d.n : ''}`, `[${d.d}] ${r[0]} | ${r[1]} | ${r[2]}`, `N1 | N1 | ${W.p1} | ${d.n1}`, `N2 | N2 | ${W.p2} | ${d.n2}`); });
  return L.join('\n') + '\n';
}
function desenhaW(){
  let bg = document.getElementById('wz'); if(!bg){ bg = document.createElement('div'); bg.id = 'wz'; bg.className = 'wz-bg'; document.body.appendChild(bg); }
  const ult = W.passo === PASSOS.length - 1 && !W.editar;
  bg.innerHTML = `<div class="wz" role="dialog" aria-modal="true" aria-labelledby="wz-t">
    <div class="wz-top"><img src="${LOGO}" alt=""><div><h2 id="wz-t">Licença Hunter</h2><p>Passo ${W.passo + 1} de ${PASSOS.length} · ${PASSOS[W.passo]}</p></div>
      <div class="wz-steps" aria-hidden="true">${PASSOS.map((_,i) => `<i class="${i <= W.passo ? 'on' : ''}"></i>`).join('')}</div></div>
    <div class="wz-body">${W.editar ? passoHTML().replace(/<p>Cada disciplina vira um chefão do Genei Ryodan\..*?<\/p>/s, '<p>Adicione, renomeie ou remova disciplinas e ajuste as datas da N1 e da N2. As notas já registradas continuam valendo enquanto a sigla for a mesma; disciplinas com plano detalhado ficam como estão no arquivo.</p>') : passoHTML()}</div>
    <div class="wz-foot"><button type="button" class="btn" data-wznav="-1"${W.passo ? '' : ' hidden'}>← voltar</button><span class="err" role="alert">${esc(W.err)}</span>
      <span style="display:flex;gap:8px;margin-left:auto">${W.editar ? '<button type="button" class="btn" data-wzsair>cancelar</button><button type="button" class="btn v" data-wzdisc>salvar disciplinas</button>' : ult ? '<button type="button" class="btn" data-wzfim="0">começar sem tutorial</button><button type="button" class="btn v" data-wzfim="1">começar e ver o tutorial</button>' : '<button type="button" class="btn v" data-wznav="1">próximo →</button>'}</span></div></div>`;
  const f = bg.querySelector('.wz-body input'); if(f && W.passo !== 1) f.focus();
}
function abreW(){ W.editar = false; PASSOS = PASSOS_1; iniciaW(); desenhaW(); }
function abreDisciplinas(){
  iniciaW(); W.editar = true; PASSOS = ['Disciplinas']; W.passo = 0;
  const BL = blocos(CTX.AV_TXT), simples = a => a.length === 2 && a.some(x => x.k === 'N1') && a.some(x => x.k === 'N2');
  W.ini = TEMP.ini; W.fim = TEMP.fim;
  const s0 = BOSSES.find(b => simples(AVAL[b.d] || []));
  if(s0){ W.p1 = AVAL[s0.d].find(x => x.k === 'N1').w; W.p2 = AVAL[s0.d].find(x => x.k === 'N2').w; }
  W.disc = BOSSES.map(b => { const a = AVAL[b.d] || [], j = (CTX.JOG.disciplinas || []).find(x => x.d === b.d) || {};
    const notas = Object.keys(NOTAS).concat(Object.keys(PARC)).filter(k => k.startsWith(b.d + ':')).length;
    return simples(a) ? {d:b.d, n:j.n || '', n1:a.find(x => x.k === 'N1').dt, n2:a.find(x => x.k === 'N2').dt, notas}
      : {d:b.d, n:j.n || '', n1:'', n2:'', det:a.length, bloco:BL[b.d] || '', notas}; });
  if(!W.disc.length) W.disc.push({d:'', n:'', n1:meio(W.ini, W.fim, .45), n2:meio(W.ini, W.fim, .95)});
  desenhaW();
}
async function salvaW(tour){
  const jogador = {configurado:true, nome:W.nome, nick:W.nick, tags:W.tags, semestre:{ini:W.ini, fim:W.fim},
    disciplinas:W.disc.filter(d => d.d).map(d => ({d:d.d, n:d.n, n1:d.n1, n2:d.n2})), habitos:habsJSON(W.habs, W.hf), cf: W.cfOn ? {handle:W.cfH, meta:W.cfM} : null};
  try { await post('/api/config', {jogador, avaliacoes: avaliacoesTxt()}); await recarrega(); }
  catch(e){ W.err = 'Não salvou: ' + e.message; desenhaW(); return; }
  UI.avatar = W.av; EST.tour = tour ? {} : Object.fromEntries(['l','b','b2','d2','bk','ms','sys'].map(k => [k,1])); salvaUI();
  document.getElementById('wz').remove();
  abaReal('l');
  if(tour) setTimeout(() => tutorial('l'), 250);
}
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  const nav = q('[data-wznav]');
  if(nav){ coleta(); const d = +nav.dataset.wznav; if(d > 0){ W.err = valida(); if(W.err){ desenhaW(); return; } } W.err = ''; W.passo += d; desenhaW(); return; }
  const av = q('[data-wzav]'); if(av){ coleta(); W.av = av.dataset.wzav; desenhaW(); return; }
  if(q('[data-wzadd]')){ coleta(); const n = W.disc.length; W.disc.push({d:'', n:'', n1:meio(W.ini, W.fim, .45), n2:meio(W.ini, W.fim, .95)}); desenhaW(); const i = document.getElementById('wz-d-' + n); if(i) i.focus(); return; }
  const dl = q('[data-wzdel]'); if(dl){ coleta(); W.disc.splice(+dl.dataset.wzdel, 1); if(!W.disc.length) W.disc.push({d:'', n:'', n1:meio(W.ini, W.fim, .45), n2:meio(W.ini, W.fim, .95)}); desenhaW(); return; }
  if(q('[data-wzhadd]')){ coleta(); W.habs.push(''); W.hf.push(0); desenhaW(); const i = document.getElementById('wz-h-' + (W.habs.length - 1)); if(i) i.focus(); return; }
  const hd = q('[data-wzhdel]'); if(hd){ coleta(); W.habs.splice(+hd.dataset.wzhdel, 1); W.hf.splice(+hd.dataset.wzhdel, 1); desenhaW(); return; }
  if(e.target.id === 'wz-cf'){ ['wz-cfh','wz-cfm'].forEach(id => document.getElementById(id).disabled = !e.target.checked); if(e.target.checked) document.getElementById('wz-cfh').focus(); return; }
  if(q('[data-wzsair]')){ document.getElementById('wz').remove(); W.editar = false; return; }
  if(q('[data-wzdisc]')){ coleta(); W.err = valida(); if(W.err){ desenhaW(); return; }
    const perdidas = BOSSES.filter(b => !W.disc.some(d => d.d === b.d) && Object.keys(NOTAS).concat(Object.keys(PARC)).some(k => k.startsWith(b.d + ':')));
    if(perdidas.length && !W.confirma){ W.confirma = 1; W.err = `${perdidas.map(b => b.d).join(', ')} tem nota registrada e vai sair do jogo. Clique em salvar de novo para confirmar.`; desenhaW(); return; }
    W.confirma = 0;
    const jogador = {...CTX.JOG, semestre:{ini:W.ini, fim:W.fim}, disciplinas:W.disc.filter(d => d.d).map(d => ({d:d.d, n:d.n}))};
    post('/api/config', {jogador, avaliacoes: avaliacoesTxt()}).then(recarrega).then(() => { document.getElementById('wz').remove(); W.editar = false; render(); toast('Disciplinas salvas'); })
      .catch(err => { W.err = 'Não salvou: ' + err.message; desenhaW(); });
    return; }
  const fim = q('[data-wzfim]'); if(fim){ salvaW(fim.dataset.wzfim === '1'); return; }
});
document.addEventListener('keydown', e => {
  if(!document.getElementById('wz') || e.key !== 'Enter' || e.target.tagName === 'BUTTON') return;
  e.preventDefault(); const b = document.querySelector('[data-wznav="1"]'); if(b) b.click();
});

/* ---------- tutorial: destaca cada bloco e explica o que ele quer dizer ---------- */
const TOURS = {
  l:[['.gnav','Abas do jogo','A <b>Lista</b> é onde você trabalha. As outras abas mostram o jogo. O botão <b>? tutorial</b> repete esta explicação na aba em que você estiver.'],
     ['#l-hud .l-me','Seu Hunter','Cada XP sobe a <b>Arena Celestial</b>: 251 andares, que zeram no fim do semestre. A barra mostra quanto falta para o próximo andar, e a meta do dia acompanha o seu ritmo.'],
     ['#l-hud > .card:nth-child(2)','Ten','Dias seguidos com pelo menos uma tarefa feita. O <b>Zetsu</b> é uma folga guardada: um dia vazio não quebra a sequência. Você ganha outra a cada 7 dias ativos.'],
     ['#l-hud > .card:nth-child(3)','Missão da semana','O seu tipo de Nen mais fraco na semana passada. As tarefas dele valem <b>×1,5</b> até domingo, e 3 dias com ele dão um feitiço.'],
     ['#l-hud > .card:nth-child(4)','Jenny','A moeda da loja. Cada XP vale 10 J, e nota ≥ 6 dá bônus. Gastar não baixa o andar.'],
     ['#l-add','Adicionar tarefa','Escreva o que é e escolha o <b>tipo</b>, a <b>disciplina</b> e o <b>prazo</b>. Embaixo aparecem quanto ela vai valer e a linha exata que vai para o todo.txt.'],
     ['#l-groups','Suas tarefas','Separadas por prazo. O quadrado conclui; o número verde é o XP que ela dá agora. Passe o mouse para <b>adiar</b>, subir a <b>prioridade</b>, <b>editar</b> ou <b>remover</b>. Errou? O aviso embaixo tem "desfazer".'],
     ['#l-golpes','Rende mais agora','As 3 tarefas que mais valem neste momento: prazo perto, missão, fúria, prioridade.', 1],
     ['#l-bosses','Chefões','A barra vermelha é a <b>vida</b> do chefão, e ela só cai com nota. Clique para abrir o quadro e registrar notas.', 1],
     ['#l-hab','Hábitos de hoje','Os hábitos aparecem sozinhos todo dia. Marque à mão quando fizer. O <b>Codeforces</b> não se marca: o jogo conta os problemas aceitos no seu handle. Para mudar a lista, use a aba <b>Regras</b>.', 1],
     ['#l-heat','Constância','Três heatmaps, um quadrado por dia: o <b>Ten</b> (dia ativo ou salvo pelo Zetsu), os <b>hábitos</b> (quanto mais cheio, mais hábitos feitos) e o <b>Codeforces</b> (problemas no dia; a cor forte é a meta batida).', 1],
     ['#l-vale','Quanto vale','O XP de cada tipo e as tags que marcam cada um. Os bônus de ×1,5 se multiplicam.', 1]],
  b:[['#b-tower','A torre','Seu andar na Arena Celestial e a <b>projeção</b> de onde você chega no fim do semestre, no ritmo atual. No topo (251) abre o Torneio contra a Guarda Real.'],
     ['#b-sheet','Ficha e hexágono de Nen','Quanto você treinou cada tipo de Nen. O hexágono mostra o equilíbrio: o lado mais curto vira a missão da semana.'],
     ['#b-bosses','Chefões','Resumo das disciplinas: vida restante, fúria e quanto falta de média.'],
     ['#b-meta','Meta do dia','Os hábitos de hoje, com o que já foi feito.', 1],
     ['#b-quests','Missões','As tarefas abertas que mais rendem, com o XP de cada uma.', 1],
     ['#b-log','Últimas lutas','O que você concluiu por último e quanto rendeu.', 1]],
  b2:[['#b2-cols','Um chefão por disciplina','A vida é a nota: cada avaliação tira <b>peso × nota/10</b> pontos, e passar de 60 derruba. Registre a nota aqui depois da prova. Nota baixa não pune: o chefão entra em <b>fúria</b> e as tarefas dele valem ×1,5.'],
      ['#b2-cols .bd','Preparação','Cada tarefa da disciplina se liga a uma avaliação. Concluir todas antes da data dá <b>1 feitiço à escolha</b>, seja qual for a nota.'],
      ['#b2-inbox','Anotações do plano','Mudou a data ou o peso de uma avaliação? Anote aqui. Fica em ajustes.txt para você aplicar no avaliacoes.txt (ou pedir a uma IA).'],
      ['#b2-leg','Como ler','O resumo das regras dos chefões.']],
  d2:[['#d2-months','O semestre inteiro','Cada quadradinho é um dia: azul com tarefas, roxo tracejado com Zetsu. Os anéis marcam as avaliações.'],
      ['#d2-ladder','Escada da temporada','Os marcos do semestre e onde você está.', 1],
      ['#d2-next','Próximas avaliações','As provas que vêm aí, com a preparação de cada uma.', 1]],
  bk:[['#bk-prog','Progresso do Book','Quantas cartas você já tem. As de 000 a 099 são conquistas com regra fixa.'],
      ['#bk-tabs','Tipos de carta','Conquistas, cartas narradas (escritas por IA, se você usar) e os seus feitiços.'],
      ['#bk-grid','A coleção','Clique numa carta para ver o que ela pede e quanto falta.'],
      ['#bk-det','Detalhe','A regra da carta, ou o efeito do feitiço e o botão de usar.']],
  ms:[['#ms-root .cats','Seções da loja','Aparência (fotos, cores, efeitos), mundo pixel, prêmios reais e feitiços.'],
      ['#ms-root .lay7 > div:first-child','Itens','Compre com Jenny. Os itens comprados ficam seus para sempre e podem ser equipados a qualquer hora.'],
      ['#ms-root .side7','Carteira','Quanto você tem, de onde veio e o que está usando agora.']],
  sys:[['#cfg','Seu jogo','Mude o básico sem refazer nada: nome, nickname, <b>hábitos</b> (adicionar ou remover), o <b>Codeforces</b> e o nome das tags. Clique em salvar.'],
       ['#sys-root > .card:nth-child(2)','Regras','Daqui para baixo, tudo o que o jogo considera. A fonte de verdade é o motor.js.']],
};
let TR = null;
function tutorial(aba){
  const passos = (TOURS[aba] || []).filter(p => document.querySelector(p[0]));
  if(!passos.length) return;
  fecha();
  TR = {aba, passos, i:0};
  document.body.insertAdjacentHTML('beforeend', '<div class="tr-hole" id="tr-hole"></div><div class="tr-pop" id="tr-pop" role="dialog" aria-live="polite"></div>');
  passo();
}
function alvo(){ const p = TR.passos[TR.i], el = document.querySelector(p[0]); return el && p[3] ? (el.closest('.card') || el) : el; }
function posiciona(){
  if(!TR) return;
  const el = alvo(), h = document.getElementById('tr-hole'), pop = document.getElementById('tr-pop'); if(!el) return;
  const r = el.getBoundingClientRect(), m = 6, vw = innerWidth, vh = innerHeight;
  Object.assign(h.style, {left:(r.left - m) + 'px', top:(r.top - m) + 'px', width:(r.width + 2*m) + 'px', height:(r.height + 2*m) + 'px'});
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let top = r.bottom + 14, left = Math.min(Math.max(16, r.left), vw - pw - 16);
  if(top + ph > vh - 16) top = r.top - ph - 14;                       // não cabe embaixo: em cima
  if(top < 16){ top = Math.min(vh - ph - 16, Math.max(16, r.top + 16)); left = r.right + 14 + pw < vw ? r.right + 14 : Math.max(16, r.left - pw - 14); }   // bloco alto: do lado
  Object.assign(pop.style, {top: Math.max(16, top) + 'px', left: left + 'px'});
}
function passo(){
  const p = TR.passos[TR.i], ult = TR.i === TR.passos.length - 1;
  document.getElementById('tr-pop').innerHTML = `<span class="tr-k">${TR.i + 1} de ${TR.passos.length}</span><h4>${p[1]}</h4><p>${p[2]}</p>
    <div class="bt"><button class="btn pl" data-tr="x">pular</button>${TR.i ? '<button class="btn" data-tr="-1">← voltar</button>' : ''}<button class="btn v" data-tr="1">${ult ? 'entendi' : 'próximo →'}</button></div>`;
  const el = alvo(); const r = el.getBoundingClientRect();
  if(r.top < 70 || r.bottom > innerHeight - 40) el.scrollIntoView({block: r.height > innerHeight * .6 ? 'start' : 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  posiciona(); setTimeout(posiciona, 350);
  document.querySelector('#tr-pop [data-tr="1"]').focus({preventScroll:true});
}
function fecha(){
  if(TR){ EST.tour = Object.assign({}, EST.tour, {[TR.aba]:1}); salvaUI(); }
  TR = null; ['tr-hole','tr-pop'].forEach(id => { const e = document.getElementById(id); if(e) e.remove(); });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tr]'); if(b){ const v = b.dataset.tr; if(v === 'x' || (v === '1' && TR.i === TR.passos.length - 1)) fecha(); else { TR.i += +v; passo(); } return; }
  if(e.target.closest('[data-trq]')) tutorial(cur);
});
document.addEventListener('keydown', e => {
  if(!TR) return;
  if(e.key === 'Escape') fecha();
  else if(e.key === 'ArrowRight') document.querySelector('#tr-pop [data-tr="1"]').click();
  else if(e.key === 'ArrowLeft' && TR.i) document.querySelector('#tr-pop [data-tr="-1"]').click();
});
addEventListener('resize', posiciona); addEventListener('scroll', posiciona, {passive:true});

/* ---------- ganchos na página ---------- */
const gnav0 = gnav;
gnav = c => gnav0(c).replace('<span class="sp"></span>', `<button class="tr-q" data-trq title="explica cada bloco desta aba">? tutorial</button><span class="sp"></span>`);
const abaReal = tab;
tab = t => {
  if(CTX && !(CTX.JOG && CTX.JOG.configurado)){ abaReal('l'); abreW(); return; }
  abaReal(t);
  if(CTX && !(EST.tour || {})[cur] && TOURS[cur]) setTimeout(() => { if(!TR) tutorial(cur); }, 300);
};
/* ---------- aba Regras: "Seu jogo" (nome, nickname, hábitos, Codeforces, tags) ---------- */
let CF2 = null;   // rascunho; null = sem edição em andamento
function rascunhoCfg(){
  const j = CTX.JOG;
  return CF2 || (CF2 = {nome:j.nome || '', nick:j.nick || '', habs:(j.habitos || []).map(h => h.n), hf:(j.habitos || []).map(h => h.semana || 0), datas:j.datas === 'mdy' ? 'mdy' : 'dmy', cfOn:!!(j.cf && j.cf.handle), cfH:(j.cf && j.cf.handle) || '', cfM:(j.cf && j.cf.meta) || 3,
    tags:Object.fromEntries(TIPOS.filter(t => !t.fixo).map(t => [t.k, (j.tags && j.tags[t.k]) || tagPadrao(t.k)])), err:'', novo:''});
}
function cfgHTML(){
  const c = rascunhoCfg();
  return `<div class="card wz" id="cfg" style="box-shadow:none;border-radius:14px"><h2><span class="c">~/</span>seu jogo · mudanças básicas</h2>
    <div class="wz-body" style="padding:4px 0 0">
      <div class="wz-f"><label>Nome<input data-cfg="nome" value="${esc(c.nome)}" maxlength="40"></label><label>Nickname<input data-cfg="nick" value="${esc(c.nick)}" maxlength="20"></label>
        <label>Datas<select data-cfg="datas"><option value="dmy"${c.datas === 'dmy' ? ' selected' : ''}>dia/mês/ano · 31/12/2026</option><option value="mdy"${c.datas === 'mdy' ? ' selected' : ''}>mês/dia/ano · 12/31/2026</option></select></label></div>
      <label>Hábitos (aparecem na Lista e você marca à mão; o semanal some quando a meta da semana é cumprida)</label>
      <div class="wz-disc">${c.habs.map((h,i) => `<div class="wz-row" style="grid-template-columns:minmax(0,1fr) 150px 34px"><input data-cfgh="${i}" value="${esc(h)}" aria-label="Hábito ${i + 1}" maxlength="40">${freqSel(`data-cfghf="${i}"`, c.hf[i])}<button type="button" class="wz-x" data-cfghdel="${i}" aria-label="remover hábito">✕</button></div>`).join('')}
        <div class="wz-row" style="grid-template-columns:minmax(0,1fr) auto"><input id="cfg-novo" value="${esc(c.novo)}" placeholder="novo hábito, ex.: 30 min de exercício" maxlength="40"><button type="button" class="btn" data-cfghadd>+ adicionar</button></div></div>
      <div class="wz-f" style="grid-template-columns:auto minmax(0,1fr) 120px;align-items:end">
        <label style="flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font:14px var(--f-ui);color:var(--ink);padding-bottom:9px"><input type="checkbox" data-cfg="cfOn"${c.cfOn ? ' checked' : ''}> Codeforces</label>
        <label>Handle<input data-cfg="cfH" value="${esc(c.cfH)}" maxlength="24"${c.cfOn ? '' : ' disabled'}></label>
        <label>Meta/dia<input data-cfg="cfM" inputmode="numeric" value="${c.cfM}"${c.cfOn ? '' : ' disabled'}></label></div>
      <label>Tags (o nome muda; o significado de cada tipo continua o mesmo)</label>
      <div class="wz-f" style="grid-template-columns:repeat(4,minmax(0,1fr))">${TIPOS.filter(t => !t.fixo).map(t => `<label style="color:${NC(t.c)}">${t.n}<input data-cfgt="${t.k}" value="${esc(c.tags[t.k])}" maxlength="24"></label>`).join('')}</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="btn v" data-cfgsave>salvar</button><button type="button" class="btn" data-cfgreset>descartar</button>
        <span class="sub" style="color:var(--red)" role="alert">${esc(c.err)}</span><button type="button" class="btn" data-wzdiscabre style="margin-left:auto">editar disciplinas e datas</button></div>
    </div></div>`;
}
const rSys0 = RENDER.sys;
/* iniciar com o computador: só aparece com o servidor de verdade (no modo demonstração não há servidor) */
function srvHTML(){
  const s = CTX.SRV; if(!s) return '';
  const onde = {linux:'um serviço do usuário (systemd)', windows:'um atalho na pasta Inicializar do Windows', mac:'um LaunchAgent do macOS'}[s.sistema] || '';
  return `<div class="card wz" id="cfg-srv" style="box-shadow:none;border-radius:14px"><h2><span class="c">~/</span>servidor · versão ${esc(s.versao)}</h2>
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <label style="display:flex;gap:8px;align-items:center;font:14px var(--f-ui);color:var(--ink)"><input type="checkbox" data-srvauto${s.auto ? ' checked' : ''}> Iniciar com o computador</label>
      <span class="sub" style="flex:1;min-width:240px;margin:0">${s.auto
        ? `Ligado: o servidor roda em segundo plano e você só abre <b>${esc(location.origin)}</b> (vale salvar nos favoritos). Desligue quando quiser.`
        : `Desligado: é preciso rodar <code>servidor.py</code> toda vez. Ligado, ele inicia sozinho com o computador (${onde}) e gasta quase nada parado.`}</span></div></div>`;
}
RENDER.sys = S => { rSys0(S); document.getElementById('sys-root').insertAdjacentHTML('afterbegin', cfgHTML() + srvHTML()); };
document.addEventListener('change', async e => {
  if(!e.target.matches('[data-srvauto]')) return;
  const ligar = e.target.checked; e.target.disabled = true;
  try {
    const r = await post('/api/autostart', {ligar});
    toast(esc(r.msg));
    if(r.recarregar){ await new Promise(ok => setTimeout(ok, 2500)); for(let i = 0; i < 10; i++){ try { await recarrega(); break; } catch(err){ await new Promise(ok => setTimeout(ok, 1000)); } } }
    else await recarrega();
  } catch(err){ toast('Não deu: ' + esc(err.message)); }
  render();
});
document.addEventListener('input', e => {
  if(!CF2) return; const t = e.target, d = t.dataset;
  if(d.cfg) CF2[d.cfg] = t.type === 'checkbox' ? t.checked : t.value;
  if(d.cfgh !== undefined) CF2.habs[+d.cfgh] = t.value;
  if(d.cfghf !== undefined) CF2.hf[+d.cfghf] = +t.value;
  if(d.cfgt) CF2.tags[d.cfgt] = t.value;
  if(t.id === 'cfg-novo') CF2.novo = t.value;
  if(d.cfg === 'cfOn') render();
});
document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  if(q('[data-cfghadd]')){ const c = rascunhoCfg(), n = c.novo.trim(); if(n){ c.habs.push(n); c.hf.push(0); c.novo = ''; } render(); const i = document.getElementById('cfg-novo'); if(i) i.focus(); return; }
  const hd = q('[data-cfghdel]'); if(hd){ const c = rascunhoCfg(); c.habs.splice(+hd.dataset.cfghdel, 1); c.hf.splice(+hd.dataset.cfghdel, 1); render(); return; }
  if(q('[data-wzdiscabre]')){ abreDisciplinas(); return; }
  if(q('[data-cfgreset]')){ CF2 = null; render(); return; }
  if(!q('[data-cfgsave]')) return;
  const c = rascunhoCfg(), habs = c.habs.map(h => h.trim()).filter(Boolean), tags = {};
  for(const k in c.tags) tags[k] = limpaTag(k, c.tags[k]);
  const vs = Object.values(tags), nick = c.nick.trim().toLowerCase(), meta = parseInt(c.cfM) || 0;
  c.err = !c.nome.trim() ? 'Escreva o seu nome.' : !/^[a-z0-9_]{2,20}$/.test(nick) ? 'O nickname precisa de 2 a 20 letras, números ou _.'
    : new Set(habs.map(slug)).size !== habs.length ? 'Há dois hábitos com o mesmo nome.'
    : c.cfOn && !HANDLE.test(c.cfH.trim()) ? 'Handle do Codeforces inválido.' : c.cfOn && !(meta >= 1 && meta <= 6) ? 'A meta do Codeforces vai de 1 a 6.'
    : vs.some(x => !x) || new Set(vs).size !== vs.length ? 'Cada tag precisa de um nome diferente.' : '';
  if(c.err){ render(); return; }
  const jogador = {...CTX.JOG, nome:c.nome.trim(), nick, datas:c.datas, tags, habitos:habsJSON(c.habs, c.hf), cf: c.cfOn ? {handle:c.cfH.trim(), meta} : null};
  try { await post('/api/config', {jogador}); await recarrega(); } catch(err){ c.err = 'Não salvou: ' + err.message; render(); return; }
  CF2 = null; render(); toast('Salvo <small>os hábitos novos aparecem na Lista</small>');
});

const rB2_0 = RENDER.b2;
RENDER.b2 = S => { rB2_0(S); const h = document.querySelector('#b2-inbox h2'); if(h) h.insertAdjacentHTML('afterend', '<p style="margin:0 0 10px"><button type="button" class="btn v" data-wzdiscabre>editar disciplinas e datas</button></p>'); };
window.HJ_GUIA = {abreW, abreDisciplinas, tutorial};
if(CTX) tab(cur);   // os dados podem ter chegado antes deste script (no modo demonstração chegam): reaplica a aba com o guia
})();
