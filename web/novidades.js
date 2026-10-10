/* Hunter.todo · aba Novidades: o que mudou em cada versão e o aviso de versão nova.
 * A lista entre os marcadores abaixo é JSON puro: o servidor lê a do GitHub (GET /api/atualizacao, no máximo a cada 6 h)
 * para saber se saiu versão nova. Ao lançar uma versão, ponha a nova no topo (a mesma do VERSAO do servidor.py).
 * "atualizar agora" chama POST /api/atualizar (git pull ou o ZIP do GitHub) e espera o servidor reiniciar.
 * Carregado depois de conquistas.js: usa CTX, EST, UI, cur, tab, render, post, recarrega, esc, ic, toast, salvaUI, gnav, VERSAO_PAGINA.
 */
window.HJ_NOVIDADES = /*NOVIDADES*/[
  {"versao": "0.5.2", "nome": "atualização das conquistas", "data": "2026-10-10",
   "resumo": "A Jenny e o XP que você ganhou não somem mais quando o plano de avaliações muda.",
   "itens": [
     {"ic": "coin", "t": "Bônus de nota guardado", "d": "O bônus de cada nota agora fica com o peso do dia em que a nota entrou. Antes ele era refeito com o peso atual: se você ou a IA corrigiam um peso para menos depois de você gastar, a carteira ficava negativa. Mudar o plano não tira mais Jenny; corrigir a própria nota ajusta só a diferença."},
     {"ic": "spider", "t": "Fúria guardada", "d": "As tarefas feitas com o chefão em fúria ficam com o ×1,5 para sempre. Antes, quando o chefão saía da fúria ou entrava outra nota, o bônus sumia das tarefas antigas, e com ele XP e Jenny."},
     {"ic": "scroll", "t": "Carteira negativa zerada", "d": "Se a sua carteira tinha ficado negativa por esse problema, o jogo devolveu uma vez o que faltava para zerar. Aparece como acerto da 0.5.2 na carteira da Masadora."}
   ]},
  {"versao": "0.5.1", "nome": "atualização das conquistas", "data": "2026-10-10",
   "resumo": "Achou um bug ou teve uma ideia? Agora dá para mandar direto do jogo.",
   "itens": [
     {"ic": "fb", "t": "Feedback pelo jogo", "d": "O balão no canto direito da tela, em qualquer aba, manda um bug, uma ideia ou uma dúvida. O jogo abre a página do GitHub já preenchida com a sua versão, o sistema e a aba; é só conferir e clicar em Create. Sem conta no GitHub, copie o texto e mande por mensagem."}
   ]},
  {"versao": "0.5", "nome": "atualização das conquistas", "data": "2026-10-09",
   "resumo": "A IA passa a criar desafios feitos para você, e o jogo agora avisa quando sai versão nova.",
   "itens": [
     {"ic": "card", "t": "Conquistas criadas pela IA", "d": "No Book, a aba Conquistas da IA pede desafios pensados para o seu ritmo: 10 tarefas de uma matéria no prazo, um hábito em 14 dias seguidos, uma nota alvo. Você aceita os que quiser, e o jogo confere sozinho. Ao conquistar, você escolhe a recompensa: Jenny ou um feitiço."},
     {"ic": "antenna", "t": "Aviso de versão nova", "d": "O jogo confere no GitHub, no máximo a cada 6 horas, se saiu uma versão nova. Quando sai, esta aba avisa, mostra o que muda e tem o botão atualizar agora, que baixa a versão e reinicia o jogo sem mexer nos seus dados."},
     {"ic": "scroll", "t": "Esta aba de novidades", "d": "Cada versão daqui para frente vem explicada aqui, em poucas linhas, com o que muda para você."},
     {"ic": "tower", "t": "Instalador sem git atualiza", "d": "Quem instalou sem git e rodava o comando de instalação de novo recebia \"a pasta já existe\". Agora o mesmo comando atualiza o jogo por cima."},
     {"ic": "man", "t": "Tutoriais conferidos", "d": "Todos os tutoriais foram conferidos passo a passo. O do Book explica as conquistas da IA, e esta aba tem o seu."}
   ]},
  {"versao": "0.4.2", "nome": "atualização da IA", "data": "2026-10-09",
   "resumo": "Ajustes pedidos depois do primeiro teste com a IA.",
   "itens": [
     {"ic": "spider", "t": "Pontos extras", "d": "No editor do chefão, uma disciplina pode passar de 100% quando o professor dá ponto extra."},
     {"ic": "scroll", "t": "Vários planos de uma vez", "d": "Em ler todos os planos, marque os resultados e salve todos de uma vez."},
     {"ic": "tra", "t": "Codeforces à mão na Arena", "d": "O ✋ também aparece na meta do dia da Arena."},
     {"ic": "man", "t": "Fiz de novo", "d": "Hábito semanal com a meta cumprida pode ser feito de novo, e cada vez acima da meta vale XP em dobro."}
   ]},
  {"versao": "0.4.1", "nome": "atualização da IA", "data": "2026-10-09",
   "resumo": "A IA não aparecia para quem atualizava com o jogo ligado. Corrigido.",
   "itens": [
     {"ic": "tower", "t": "Servidor trocado na atualização", "d": "O servidor antigo, rodando em segundo plano, é reiniciado sozinho quando o jogo atualiza. Um aviso amarelo aparece se página e servidor ficarem em versões diferentes."},
     {"ic": "esp", "t": "Aba Configurações", "d": "Nome, hábitos, IA, servidor e backup saíram de Regras e ganharam uma aba própria."},
     {"ic": "int", "t": "Tutorial da IA", "d": "Ao ligar uma IA, o tutorial mostra tudo o que ela faz no jogo."}
   ]},
  {"versao": "0.4", "nome": "atualização da IA", "data": "2026-10-09",
   "resumo": "A IA de terminal do seu computador passa a trabalhar dentro do jogo.",
   "itens": [
     {"ic": "int", "t": "IA ligada no jogo", "d": "Em Configurações → IA, o jogo usa o Claude Code, o Codex ou o Gemini CLI para ler planos de ensino, aplicar lembretes e escrever as cartas do Book."},
     {"ic": "crown", "t": "O jogo decide a prioridade", "d": "Ao adicionar uma tarefa, a prioridade pode sair da prova chegando, do prazo e da fúria do chefão."},
     {"ic": "card", "t": "Tipo da tarefa sugerido", "d": "O tipo segue as palavras do texto; o ? explica cada um, e o IA? pergunta à IA."},
     {"ic": "tra", "t": "Codeforces à mão", "d": "O ✋ soma um problema feito onde o site não mostra (ITMO Academy, grupo privado)."}
   ]},
  {"versao": "0.3", "nome": "", "data": "2026-10-09",
   "resumo": "A primeira versão testada pelos amigos.",
   "itens": [
     {"ic": "spider", "t": "Tarefa ligada à avaliação", "d": "Cada tarefa da disciplina se liga a uma avaliação pelo prazo e por palavras-chave."},
     {"ic": "coin", "t": "Prêmios reais editáveis", "d": "Na Masadora você escreve os seus prêmios, com uma régua de esforço para o preço."},
     {"ic": "bag", "t": "Backup", "d": "Um ZIP com todos os seus dados, em Configurações."}
   ]}
]/*FIM*/;
(function(){
'use strict';
const NOV = window.HJ_NOVIDADES, HJ = window.HJ;

document.head.insertAdjacentHTML('beforeend', `<style>
.nv{display:flex;flex-direction:column;gap:16px}
.nv-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:0;padding:0!important;overflow:hidden}
.nv-hero > div{padding:22px 24px}
.nv-ver{background:radial-gradient(120% 120% at 0% 0%,color-mix(in srgb,var(--volt) 20%,transparent),transparent 60%),var(--panel)}
.nv-ver .cap{margin:0}
.nv-ver .num{font:800 64px/1 var(--f-hud);letter-spacing:-.02em;margin:8px 0 4px;color:var(--ink)} .nv-ver .num span{color:var(--volt)}
.nv-ver .nome{font:600 15px var(--f-hud);color:var(--soft);text-transform:lowercase}
.nv-ver p{margin:12px 0 0;font-size:14px;color:var(--soft);max-width:44ch}
.nv-st{border-left:1px solid var(--hair);display:flex;flex-direction:column;gap:10px;justify-content:center}
.nv-st .pill{align-self:flex-start;display:inline-flex;gap:8px;align-items:center;border-radius:99px;padding:5px 12px;font:700 12.5px var(--f-mono);border:1px solid var(--grn);color:var(--grn);background:color-mix(in srgb,var(--grn) 10%,transparent)}
.nv-st .pill.nova{border-color:var(--amb);color:var(--amb);background:color-mix(in srgb,var(--amb) 12%,transparent)}
.nv-st .pill.erro{border-color:var(--faint);color:var(--soft);background:transparent}
.nv-st h3{margin:0;font:700 20px var(--f-hud)} .nv-st p{margin:0;font-size:14px;color:var(--soft)}
.nv-st ul{margin:0;padding-left:18px;list-style:disc;font-size:13.5px;color:var(--ink)} .nv-st li{margin:3px 0}
.nv-st .acao{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.nv-st .grande{padding:9px 18px;font:700 14px var(--f-hud);border-radius:10px}
.nv-tl{position:relative;display:flex;flex-direction:column;gap:14px;padding-left:34px}
.nv-tl::before{content:"";position:absolute;left:11px;top:8px;bottom:8px;width:2px;background:linear-gradient(var(--volt),var(--hair) 40%)}
.nv-v{position:relative}
.nv-v::before{content:"";position:absolute;left:-29px;top:20px;width:12px;height:12px;border-radius:50%;background:var(--panel);border:2px solid var(--faint)}
.nv-v.ultima::before{border-color:var(--volt);background:var(--volt);box-shadow:0 0 0 5px color-mix(in srgb,var(--volt) 20%,transparent)}
.nv-v .topo{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px}
.nv-v .topo b{font:800 22px var(--f-hud)} .nv-v .topo span{font:600 12px var(--f-mono);color:var(--soft);text-transform:uppercase;letter-spacing:.08em}
.nv-v .topo em{font:700 11px var(--f-mono);font-style:normal;color:var(--bg);background:var(--volt);border-radius:99px;padding:2px 9px}
.nv-v .topo em.tua{background:var(--grn)}
.nv-v > p{margin:0 0 12px;font-size:14.5px}
.nv-itens{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.nv-it{display:grid;grid-template-columns:34px minmax(0,1fr);align-content:start;gap:4px 12px;padding:12px;border:1px solid var(--hair);border-radius:12px;background:var(--panel2)}
.nv-it .ic{grid-row:span 2;font-size:22px;color:var(--volt);margin-top:2px}
.nv-it b{font:700 14.5px var(--f-hud)} .nv-it span{font-size:13px;color:var(--soft);line-height:1.45}
.nv-v.velha .nv-itens{display:flex;flex-direction:column;gap:2px}
.nv-v.velha .nv-it{display:block;border:0;background:none;padding:2px 0} .nv-v.velha .nv-it .ic{display:none} .nv-v.velha .nv-it b{font:600 13.5px var(--f-ui)} .nv-v.velha .nv-it b::after{content:" · "} .nv-v.velha .nv-it span{font-size:13px}
.nv-pon{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:color-mix(in srgb,var(--bg) 85%,transparent);backdrop-filter:blur(6px)}
.nv-pon > div{background:var(--panel);border:1px solid var(--volt);border-radius:16px;padding:24px 28px;max-width:420px;text-align:center;box-shadow:0 30px 80px -30px rgba(0,0,0,.6)}
.nv-pon .ic{font-size:36px;color:var(--volt)}
.nv-pon h3{margin:10px 0 6px;font:700 20px var(--f-hud)} .nv-pon p{margin:0;color:var(--soft);font-size:14px}
.gnav .nv-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--amb);margin-left:4px;vertical-align:top}
@media (max-width:820px){ .nv-hero{grid-template-columns:minmax(0,1fr)} .nv-st{border-left:0;border-top:1px solid var(--hair)} .nv-ver .num{font-size:52px} }
</style>`);

let AT = null;   // GET /api/atualizacao: {versao, novas:[...], erro, metodo, conferido}; null = conferindo
let ATUALIZANDO = false;
const curta = d => d ? HJ.brData(d) : '';
const temNova = () => !!(AT && AT.ok && AT.novas && AT.novas.length);
const naoVista = () => CTX && EST && EST.visto !== VERSAO_PAGINA;

async function confere(agora){
  if(!CTX || !CTX.SRV) return;
  if(agora){ AT = null; if(cur === 'nv') render(); }
  try { AT = await (await fetch('/api/atualizacao' + (agora ? '?agora' : ''), {cache:'no-store'})).json(); }
  catch(e){ AT = {ok:false, error:'o servidor não respondeu'}; }
  if(AT && AT.ok === undefined) AT = {ok:false, error:'servidor antigo, sem a conferência de versões'};
  render();
  if(temNova() && !confere.avisou && cur !== 'nv' && !document.querySelector('.toast')){ confere.avisou = true; const v = AT.novas[0];
    const to = document.createElement('div'); to.className = 'toast'; to.innerHTML = `${ic('antenna')} Saiu a versão ${esc(v.versao)} <small>${esc(v.resumo || v.nome || '')}</small><button class="l-undo" data-go="nv">ver</button>`;
    document.body.appendChild(to); setTimeout(() => to.remove(), 10000); }
}

function statusHTML(){
  if(!CTX.SRV) return `<span class="pill erro">modo demonstração</span><h3>Aqui só se vê o que mudou</h3><p>Instalado no computador, o jogo confere sozinho se saiu versão nova e atualiza com um clique.</p>`;
  if(!AT) return `<span class="pill erro">conferindo...</span><h3>Procurando versão nova</h3><p>O jogo pergunta ao GitHub qual é a última versão publicada.</p>`;
  if(!AT.ok) return `<span class="pill erro">não deu para conferir</span><h3>Versão nova: não sei</h3><p>${esc(AT.error || 'erro')}.</p>`;
  const quando = AT.conferido ? `conferido em ${esc(curta(AT.conferido.slice(0, 10)))} às ${esc(AT.conferido.slice(11))}` : '';
  if(temNova()){ const v = AT.novas[0], it = AT.novas.flatMap(x => x.itens || []).slice(0, 5);
    return `<span class="pill nova">${ic('antenna')} versão nova</span><h3>Saiu a ${esc(v.versao)}${v.nome ? ` · ${esc(v.nome)}` : ''}</h3>
      ${v.resumo ? `<p>${esc(v.resumo)}</p>` : ''}${it.length ? `<ul>${it.map(x => `<li>${esc(x.t)}</li>`).join('')}</ul>` : ''}
      <div class="acao"><button type="button" class="btn v grande" data-nvatualiza${ATUALIZANDO ? ' disabled' : ''}>atualizar agora</button>
        <span class="sub">${AT.metodo === 'git' ? 'baixa pelo git' : 'baixa o ZIP do GitHub'} e reinicia o jogo. Seus dados não mudam.</span></div>`; }
  return `<span class="pill">✓ em dia</span><h3>Você está na versão mais nova</h3><p>${AT.erro ? esc(AT.erro) + '. ' : ''}O jogo confere sozinho a cada 6 horas e avisa aqui quando sair outra.</p>
    <div class="acao"><button type="button" class="btn" data-nvconfere>conferir agora</button><span class="sub">${quando}</span></div>`;
}
function versaoHTML(v, i){
  const tua = v.versao === VERSAO_PAGINA, velha = i > 1;
  return `<article class="card nv-v${i === 0 ? ' ultima' : ''}${velha ? ' velha' : ''}">
    <div class="topo"><b>${esc(v.versao)}</b>${v.nome ? `<span>${esc(v.nome)}</span>` : ''}<span>${esc(curta(v.data))}</span>${tua ? `<em class="tua">a sua</em>` : ''}${tua && naoVista() ? '<em>nova</em>' : ''}</div>
    ${v.resumo ? `<p>${esc(v.resumo)}</p>` : ''}
    <div class="nv-itens">${(v.itens || []).map(x => `<div class="nv-it">${ic(x.ic || 'scroll')}<b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join('')}</div></article>`;
}
function rNV(){
  const v = NOV.find(x => x.versao === VERSAO_PAGINA) || NOV[0], [a, b] = String(v.versao).split(/\.(.*)/s);
  const novas = temNova() ? AT.novas.map(x => ({...x, futura:true})) : [];
  document.getElementById('nv-root').innerHTML = `<div class="nv">
    <div class="card nv-hero" id="nv-hero"><div class="nv-ver"><p class="cap">sua versão</p><div class="num">${esc(a)}<span>.${esc(b || '0')}</span></div><div class="nome">${esc(v.nome || '')}${AT && AT.canal === 'beta' ? ' · canal beta' : ''}</div><p>${esc(v.resumo || '')}</p></div>
      <div class="nv-st" id="nv-st">${statusHTML()}</div></div>
    <h2 class="h" style="font:700 20px var(--f-hud);margin:8px 0 0">O que mudou em cada versão</h2>
    <div class="nv-tl" id="nv-lista">${novas.map((x, i) => versaoHTML(x, i).replace('<div class="topo">', '<div class="topo"><em>ainda não instalada</em>')).join('')}${NOV.map((x, i) => versaoHTML(x, i + (novas.length ? 1 : 0))).join('')}</div></div>`;
  if(naoVista()){ EST.visto = VERSAO_PAGINA; salvaUI(); }
}

async function atualiza(){
  ATUALIZANDO = true; render();
  const alvo = AT.novas[0].versao;
  document.body.insertAdjacentHTML('beforeend', `<div class="nv-pon" id="nv-pon" role="alertdialog" aria-live="polite"><div>${ic('antenna')}<h3>Atualizando para a ${esc(alvo)}</h3><p id="nv-pon-t">Baixando a versão nova...</p></div></div>`);
  const fala = t => { const e = document.getElementById('nv-pon-t'); if(e) e.textContent = t; };
  try { await post('/api/atualizar', {}); }
  catch(err){ document.getElementById('nv-pon').remove(); ATUALIZANDO = false; render(); toast('Não atualizou: ' + esc(err.message)); return; }
  fala('Reiniciando o jogo com a versão nova...');
  for(let i = 0; i < 60; i++){
    await new Promise(r => setTimeout(r, 1500));
    try { const p = await (await fetch('/api/ping', {cache:'no-store'})).json(); if(p.versao && p.versao !== CTX.SRV.versao){ fala('Pronto! Abrindo...'); location.reload(); return; } } catch(e){}
  }
  fala('O jogo está demorando para voltar. Recarregue a página em alguns segundos (ou reinicie o computador).');
}

/* aba no menu, com um ponto quando há versão nova ou novidade que você ainda não viu */
const gnav1 = gnav;
gnav = c => gnav1(c).replace('<button data-go="tt"', `<button data-go="nv"${c === 'nv' ? ' aria-current="page"' : ''}>${ic('antenna')}Novidades${temNova() || naoVista() ? '<i class="nv-dot" aria-label="novidade"></i>' : ''}</button><button data-go="tt"`);
RENDER.nv = rNV;
document.addEventListener('click', e => {
  if(e.target.closest('[data-nvconfere]')){ confere(true); return; }
  if(e.target.closest('[data-nvatualiza]')){ atualiza(); return; }
});
/* quem acabou de atualizar vê o aviso uma vez; quem está começando agora (sem nada feito) não */
function boasNovas(){
  if(!CTX || !(CTX.JOG && CTX.JOG.configurado) || !naoVista()) return;
  if(!EST.visto && !D.feitas.length){ EST.visto = VERSAO_PAGINA; salvaUI(); return; }
  const v = NOV.find(x => x.versao === VERSAO_PAGINA); if(!v) return;
  const to = document.createElement('div'); to.className = 'toast';
  to.innerHTML = `${ic('antenna')} Jogo atualizado para a ${esc(v.versao)} <small>${esc(v.resumo || '')}</small><button class="l-undo" data-go="nv">ver o que mudou</button>`;
  document.body.appendChild(to); setTimeout(() => to.remove(), 12000);
}
window.HJ_NOV = {confere, canal: () => AT && AT.canal};
(function tenta(){ if(!CTX){ setTimeout(tenta, 500); return; } if(cur === 'nv') render(); setTimeout(boasNovas, 1500); setTimeout(() => confere(false), 1800); })();
})();
