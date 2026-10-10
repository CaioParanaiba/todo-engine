/* Hunter.todo · feedback: bug, ideia ou dúvida vira uma issue já preenchida no GitHub (nada de token: o jogador confere
 * e clica em "Create"). Sem conta no GitHub, "copiar texto" para mandar por mensagem.
 * O tipo aparece em português no jogo e vira a label certa do repositório pelo formulário em .github/ISSUE_TEMPLATE/
 * (bug → bug, ideia → enhancement, dúvida → question); os campos do formulário são preenchidos pelo id na URL.
 * Duas entradas, as duas em avaliação: a aba Feedback no menu e o ícone fixo no canto (sabe de qual aba veio).
 * Carregado depois de novidades.js: usa CTX, UI, cur, tab, render, esc, ic, toast, gnav, RENDER, VERSAO_PAGINA, HJ_NOV.
 */
(function(){
'use strict';
const REPO = 'https://github.com/CaioParanaiba/todo-engine';
const TIPOS = {
  bug:    {ic:'🐛', n:'bug',    form:'bug.yml',    campo:'o-que',  t:'O que aconteceu?', ph:'Cliquei em concluir na Lista e a tarefa não sumiu...',
           extra:{id:'esperava', t:'O que você esperava?', ph:'A tarefa sumir e o XP subir.'}},
  ideia:  {ic:'💡', n:'ideia',  form:'ideia.yml',  campo:'ideia',  t:'Qual é a ideia?',  ph:'Contar os dias de Duolingo como o Codeforces...',
           extra:{id:'porque', t:'Por que ajudaria? (opcional)', ph:'Eu faço todo dia e queria ver no heatmap.'}},
  duvida: {ic:'❓', n:'dúvida', form:'duvida.yml', campo:'duvida', t:'Qual é a dúvida?', ph:'Como o jogo decide a prioridade de uma tarefa?'}
};
const ABAS = {l:'Lista', b:'Arena', b2:'Chefões', d2:'Semestre', bk:'Book', ms:'Masadora', px:'Mundo pixel', sys:'Regras', cfg:'Configurações', nv:'Novidades', tt:'Torre Trick'};
const MAX = 2500;   // por campo: a URL da issue tem limite (~8 mil caracteres)
const F = {tipo:'bug', titulo:'', txt:'', extra:'', aba:'l', aberto:false};
let antes = 'l';    // última aba antes de entrar em Feedback

document.head.insertAdjacentHTML('beforeend', `<style>
.fb-form{display:flex;flex-direction:column;gap:12px}
.fb-tipos{display:flex;gap:6px;flex-wrap:wrap}
.fb-tipos button{border:1px solid var(--hair);background:var(--panel2);color:var(--ink);border-radius:99px;padding:6px 14px;font:600 13.5px var(--f-ui);cursor:pointer}
.fb-tipos button[aria-pressed="true"]{border-color:var(--volt);background:color-mix(in srgb,var(--volt) 14%,transparent)}
.fb-form label{display:flex;flex-direction:column;gap:5px;font:600 13px var(--f-ui)}
.fb-form input,.fb-form textarea,.fb-form select{font:14px var(--f-ui);color:var(--ink);background:var(--panel2);border:1px solid var(--hair);border-radius:10px;padding:8px 10px;width:100%;box-sizing:border-box}
.fb-form textarea{min-height:90px;resize:vertical}
.fb-form .lin{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.fb-form .info{font:12px var(--f-mono);color:var(--soft)}
.fb-aviso{font-size:12.5px;color:var(--soft);border-left:3px solid var(--amb);padding:4px 0 4px 10px;margin:0}
#fb-ico{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:55;width:46px;height:46px;border-radius:50%;border:1px solid var(--hair);background:var(--panel);color:var(--ink);font-size:20px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}
#fb-ico:hover,#fb-ico[aria-expanded="true"]{border-color:var(--volt)}
#fb-pop{position:fixed;right:16px;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:56;width:min(400px,calc(100vw - 32px));max-height:calc(100vh - 100px);overflow-y:auto;background:var(--panel);border:1px solid var(--volt);border-radius:14px;padding:16px;box-shadow:0 20px 50px -20px rgba(0,0,0,.7)}
#fb-pop h3{margin:0 0 10px;font:700 17px var(--f-hud);display:flex;align-items:center}
#fb-pop h3 button{margin-left:auto;border:0;background:none;color:var(--soft);font-size:18px;cursor:pointer}
.fb-pag{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px;align-items:start}
@media (max-width:820px){ .fb-pag{grid-template-columns:minmax(0,1fr)} }
</style>`);

/* ---------- o texto da issue ---------- */
function sistema(){
  const u = navigator.userAgent || '';
  const so = /Windows/.test(u) ? 'Windows' : /Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iOS' : /Mac/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : 'outro';
  const nav = /Firefox\//.test(u) ? 'Firefox' : /Edg\//.test(u) ? 'Edge' : /OPR\//.test(u) ? 'Opera' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : 'outro navegador';
  return `${so} · ${nav}`;
}
function versao(){
  const c = window.HJ_NOV && HJ_NOV.canal && HJ_NOV.canal();
  return VERSAO_PAGINA + (c === 'beta' ? ' (beta)' : '') + (window.HJ_DEMO ? ' (demonstração)' : '');
}
const corta = s => String(s || '').trim().slice(0, MAX);
function urlIssue(){
  const T = TIPOS[F.tipo], p = new URLSearchParams({template:T.form, title:corta(F.titulo).slice(0, 200)});
  p.set(T.campo, corta(F.txt));
  if(T.extra && F.extra.trim()) p.set(T.extra.id, corta(F.extra));
  p.set('versao', versao()); p.set('sistema', sistema()); p.set('aba', ABAS[F.aba] || F.aba);
  return `${REPO}/issues/new?${p}`;
}
function textoCopia(){
  const T = TIPOS[F.tipo];
  return [`${T.ic} ${T.n[0].toUpperCase() + T.n.slice(1)} no Hunter.todo: ${F.titulo.trim()}`, '', F.txt.trim(),
    ...(T.extra && F.extra.trim() ? ['', `${T.extra.t.replace(/ \(opcional\)/, '')} ${F.extra.trim()}`] : []),
    '', `versão ${versao()} · ${sistema()} · aba ${ABAS[F.aba] || F.aba}`].join('\n');
}

/* ---------- o formulário (o mesmo no canto e na aba) ---------- */
function formHTML(){
  const T = TIPOS[F.tipo];
  return `<div class="fb-form">
    <div class="fb-tipos" role="group" aria-label="Tipo">${Object.entries(TIPOS).map(([k, x]) => `<button type="button" data-fbtipo="${k}" aria-pressed="${k === F.tipo}">${x.ic} ${x.n}</button>`).join('')}</div>
    <label>Resumo em uma linha<input data-fb="titulo" maxlength="200" value="${esc(F.titulo)}" placeholder="${F.tipo === 'bug' ? 'Concluir não funciona na Lista' : F.tipo === 'ideia' ? 'Contar Duolingo como hábito' : 'Como funciona a prioridade?'}"></label>
    <label>${T.t}<textarea data-fb="txt" maxlength="${MAX}" placeholder="${esc(T.ph)}">${esc(F.txt)}</textarea></label>
    ${T.extra ? `<label>${T.extra.t}<textarea data-fb="extra" maxlength="${MAX}" style="min-height:60px" placeholder="${esc(T.extra.ph)}">${esc(F.extra)}</textarea></label>` : ''}
    <label>Sobre qual aba<select data-fb="aba">${Object.entries(ABAS).map(([k, n]) => `<option value="${k}"${k === F.aba ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <p class="info">vai junto: versão ${esc(versao())} · ${esc(sistema())}</p>
    <div class="lin"><button type="button" class="btn v" data-fbenvia>abrir no GitHub</button><button type="button" class="btn" data-fbcopia>copiar texto</button></div>
    <p class="fb-aviso">Abre a página do GitHub já preenchida: confira e clique em <b>Create</b> (precisa de conta no GitHub; sem conta, use <b>copiar texto</b> e mande por mensagem). Print ajuda: arraste a imagem para a caixa de texto lá. O repositório é público: <b>nunca anexe o todo.txt nem o ZIP de backup</b>.</p>
  </div>`;
}
function popHTML(){
  return F.aberto ? `<div id="fb-pop" role="dialog" aria-label="Mandar feedback"><h3>💬 Feedback<button type="button" data-fbfecha aria-label="fechar">✕</button></h3>${formHTML()}</div>` : '';
}
function desenhaCanto(){
  let ico = document.getElementById('fb-ico');
  if(!ico){ ico = document.createElement('button'); ico.id = 'fb-ico'; ico.type = 'button'; ico.title = 'mandar bug, ideia ou dúvida'; ico.setAttribute('aria-label', 'feedback'); ico.textContent = '💬'; ico.dataset.fbabre = ''; document.body.appendChild(ico); }
  ico.hidden = cur === 'fb'; ico.setAttribute('aria-expanded', String(F.aberto && cur !== 'fb'));
  const p = document.getElementById('fb-pop'); if(p) p.remove();
  if(F.aberto && cur !== 'fb') document.body.insertAdjacentHTML('beforeend', popHTML());
}
function rFB(){
  document.getElementById('fb-root').innerHTML = `<div class="fb-pag">
    <div class="card"><h2><span class="c">~/</span>mandar feedback</h2>${formHTML()}</div>
    <div class="card"><h2><span class="c">~/</span>como funciona</h2><p style="margin:0 0 8px;font-size:14px">Cada bug, ideia ou dúvida vira uma <b>issue</b> no GitHub do jogo, onde o autor responde e avisa quando sair a correção.</p>
      <p style="margin:0 0 8px;font-size:14px"><b>🐛 bug</b>: algo não funciona como devia. <b>💡 ideia</b>: algo que você queria no jogo. <b>❓ dúvida</b>: não entendeu como algo funciona.</p>
      <p style="margin:0;font-size:14px">O 💬 no canto da tela abre este mesmo formulário em qualquer aba.</p></div></div>`;
  if(F.aba === 'fb') F.aba = antes;
}

/* ---------- ações ---------- */
function confere(){
  if(!F.titulo.trim()){ toast('Escreva o resumo em uma linha'); return false; }
  if(!F.txt.trim()){ toast(`Escreva: ${esc(TIPOS[F.tipo].t.toLowerCase())}`); return false; }
  return true;
}
async function copiaTexto(){
  const t = textoCopia();
  try { await navigator.clipboard.writeText(t); toast('Texto copiado <small>cole na mensagem para o autor</small>'); }
  catch(e){ window.prompt('Copie o texto (Ctrl+C):', t); }
}
function redesenha(){ if(cur === 'fb') rFB(); desenhaCanto(); }
document.addEventListener('click', e => {
  const q = s => e.target.closest(s);
  if(q('[data-fbabre]')){ F.aberto = !F.aberto; if(F.aberto) F.aba = cur; desenhaCanto(); if(F.aberto){ const i = document.querySelector('#fb-pop [data-fb="titulo"]'); if(i) i.focus(); } return; }
  if(q('[data-fbfecha]')){ F.aberto = false; desenhaCanto(); return; }
  const tp = q('[data-fbtipo]'); if(tp){ F.tipo = tp.dataset.fbtipo; F.extra = ''; redesenha(); return; }
  if(q('[data-fbcopia]')){ if(confere()) copiaTexto(); return; }
  if(q('[data-fbenvia]')){ if(!confere()) return;
    window.open(urlIssue(), '_blank', 'noopener');
    toast('Página do GitHub aberta <small>confira e clique em Create · o rascunho foi limpo</small>');
    Object.assign(F, {titulo:'', txt:'', extra:'', aberto:false}); redesenha(); return; }
  if(F.aberto && !q('#fb-pop') && !q('#fb-ico')){ F.aberto = false; desenhaCanto(); }   // clique fora fecha (o rascunho fica)
});
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.fb; if(k) F[k] = e.target.value; });
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.fb; if(k) F[k] = e.target.value; });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && F.aberto){ F.aberto = false; desenhaCanto(); } });

/* aba no menu (antes da Torre Trick); render da aba desenha também o canto */
const gnav1 = gnav;
gnav = c => gnav1(c).replace('<button data-go="tt"', `<button data-go="fb"${c === 'fb' ? ' aria-current="page"' : ''}>💬 Feedback</button><button data-go="tt"`);
RENDER.fb = rFB;
const tab1 = tab;
tab = t => { if(t === 'fb' && cur !== 'fb'){ antes = cur; F.aba = cur; F.aberto = false; } tab1(t); desenhaCanto(); };
window.HJ_FB = {urlIssue, textoCopia, F};
(function tenta(){ if(!CTX){ setTimeout(tenta, 500); return; } desenhaCanto(); })();
})();
