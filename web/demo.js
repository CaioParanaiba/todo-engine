/* Hunter.todo · modo demonstração. Só entra quando a página é aberta direto do arquivo (file://), com ?demo ou no GitHub Pages:
 * troca o fetch das rotas /api/... por um servidor de mentira na memória, com um jogador de exemplo.
 * Nada é gravado: recarregar a página volta ao começo. Com o servidor de verdade (servidor.py), este arquivo não faz nada.
 */
(function(){
'use strict';
if(location.protocol !== 'file:' && !/[?&]demo\b/.test(location.search) && !/\.github\.io$/.test(location.hostname)) return;   // GitHub Pages: sempre demonstração

const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const HOJE = iso(new Date());
const D = k => { const d = new Date(HOJE + 'T12:00:00'); d.setDate(d.getDate() + k); return iso(d); };
let semente = 7;
const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;

/* plano de avaliação de exemplo: 5 disciplinas = 5 chefões do Genei Ryodan */
let AVALIACOES = `# Exemplo (modo demonstração). Formato no cabeçalho do avaliacoes.txt de verdade.
temporada | Demo | ${D(-60)} | ${D(70)} | ${D(120)}

[CALC2] Uvogin | bullet | Força bruta, como uma lista de integrais.
P1 | Prova 1 | 30 | ${D(-20)}
L1 | Listas | 20 | ${D(40)} | lista | contínua
P2 | Prova 2 | 50 | ${D(55)}

[ED1] Nobunaga | thread | Corta caminho, como uma árvore balanceada.
P1 | Prova 1 | 35 | ${D(-12)}
T1 | Trabalho AVL | 25 | ${D(-1)} | avl
P2 | Prova 2 | 40 | ${D(50)}

[BD] Feitan | spider | Dor e normalização.
P1 | Prova 1 | 30 | ${D(-9)}
TM | Modelo ER | 20 | ${D(2)} | modelo er
P2 | Prova 2 | 50 | ${D(48)}

[POO] Machi | copy | Costura classes como fios.
P1 | Prova 1 | 40 | ${D(6)} | heranca
PJ | Projeto | 60 | ${D(60)} | projeto

[ARQ] Chrollo | crown | O líder: rouba qualquer instrução.
P1 | Prova 1 | 40 | ${D(13)}
P2 | Prova 2 | 60 | ${D(58)}
`;
const NOTAS = [`${D(-19)} | CALC2 | P1 | 7,5`, `${D(-11)} | ED1 | P1 | 6,8`, `${D(-8)} | BD | P1 | 4,2`, `${D(-30)} | CALC2 | L1 | 8 | parcial`, `${D(-10)} | CALC2 | L1 | 9 | parcial`].join('\n');

/* histórico: ~45 dias de tarefas concluídas */
const POOL = [
  'Lista de integrais +fac.CALC2 @entrega', 'Revisar séries +fac.CALC2 @estudo', 'Exercícios de árvores +fac.ED1 @estudo', 'Implementar pilha +fac.ED1 @entrega',
  'Resumo de normalização +fac.BD @estudo', 'Consultas SQL de treino +fac.BD @estudo', 'Ler capítulo de herança +fac.POO @estudo', 'Organizar o projeto +fac.POO',
  'Resumo de pipeline +fac.ARQ @estudo', 'Codeforces virtual contest +treino', 'Lavar o carro', 'Mercado da semana', 'Ligar para a avó', 'Organizar a mesa',
];
const done = [];
for(let k = -45; k <= -1; k++){
  if(k < -14 && rnd() < .14) continue;                        // alguns dias sem nada no começo; as últimas 2 semanas seguidas (Ten)
  const n = 1 + Math.floor(rnd() * 4);
  for(let i = 0; i < n; i++) done.push(`x ${D(k)} ${D(k-2)} ${POOL[Math.floor(rnd() * POOL.length)]}`);
  if(rnd() < .75) done.push(`x ${D(k)} ${D(k)} Treino de digitação +rotina rec:h-a:${D(k)}`);
  if(rnd() < .5 && k !== -1) done.push(`x ${D(k)} ${D(k)} Leitura (20 min) +rotina rec:h-b:${D(k)}`);   // ontem sem leitura: mostra o "esqueci de marcar ontem"
  if(rnd() < .6) done.push(`x ${D(k)} ${D(k)} Codeforces 3 questões +rotina rec:cf:${D(k)}`);
  if(rnd() < .3) done.push(`x ${D(k)} ${D(k)} Academia +rotina rec:h-c:${D(k)}`);   // semanal: 2× por semana
}
const cfDia = {}; for(let k = -40; k <= 0; k++) if(rnd() < .6) cfDia[D(k)] = 1 + Math.floor(rnd() * 5);

let todo = [
  `(A) ${D(-6)} Lista 4 de árvores AVL +fac.ED1 @entrega due:${D(-1)}`,
  `(A) ${D(-3)} Revisar normalização (1FN a 3FN) +fac.BD @estudo due:${HOJE}`,
  `(B) ${D(-5)} Modelo ER do trabalho em grupo +fac.BD @entrega due:${D(2)}`,
  `${D(-2)} Resumo do capítulo 6: integrais por partes +fac.CALC2 @estudo due:${D(5)}`,
  `(B) ${D(-1)} Refazer exercícios de herança +fac.POO @estudo due:${D(5)}`,
  `${D(-4)} Organizar o repositório do projeto +fac.POO`,
  `${D(-2)} Pipeline: resumo dos hazards +fac.ARQ @estudo due:${D(11)}`,
  `${D(-1)} Ler 20 páginas do livro de algoritmos @estudo`,
  `${D(-3)} Renovar a carteirinha do RU due:${D(9)}`,
  `(A) ${HOJE} Codeforces 3 questões +rotina rec:cf:${HOJE}`,
  `(B) ${HOJE} Treino de digitação +rotina rec:h-a:${HOJE}`,
  `${HOJE} Leitura (20 min) +rotina rec:h-b:${HOJE}`,
  `${HOJE} Academia +rotina rec:h-c:${HOJE}`,
  `x ${HOJE} ${D(-2)} Leitura: arquivos e streams em Java +fac.POO @estudo`,
  `x ${HOJE} ${D(-1)} Exercícios de séries de Taylor +fac.CALC2 @estudo`,
  '',
];
let jogador = {configurado:false, tags:{}, habitos:[{id:'h-a', n:'Treino de digitação'}, {id:'h-b', n:'Leitura (20 min)'}, {id:'h-c', n:'Academia', semana:2}], cf:{handle:'exemplo', meta:3}};   // começa sem configurar: a página abre o assistente da primeira entrada
let notas = NOTAS, ajustes = '', estado = {spent:2500, own:['pal-simples','pal-gon'], equip:{theme:'simples'}, bought:{}, resg:[]};
const narradas = [{no:'100', tipo:'semana', periodo:'semana passada', titulo:'O primeiro andar de verdade', texto:'Exemplo de carta narrada (com IA, opcional).', cronica:'Quem disse que a Arena se sobe de uma vez? Gon subiu de degrau em degrau, uma lista de cada vez.', escrita:D(-2), ic:'scroll'}];
const undo = [];

/* as mesmas ações do servidor de verdade (servidor.py) */
const DONE_RE = /^x \d{4}-\d\d-\d\d /, PRI = /^\(([A-Z])\) /, DUE = /(^|\s)due:(\d{4}-\d\d-\d\d)/;
const ORDEM = ['A','B','C', null];
function transformar(l, a, v){
  const feita = DONE_RE.test(l);
  if(a === 'done'){ if(feita) throw new Error('a tarefa já está concluída'); return `x ${HOJE} ` + l.replace(PRI, ''); }
  if(a === 'reopen'){ if(!feita) throw new Error('a tarefa não está concluída'); return l.replace(DONE_RE, ''); }
  if(feita) throw new Error('tarefa concluída: reabra antes de alterar');
  if(a === 'up'){ const m = l.match(PRI), i = m && ORDEM.includes(m[1]) ? ORDEM.indexOf(m[1]) : ORDEM.length - 1; if(i <= 0) throw new Error('prioridade já está no limite'); return `(${ORDEM[i-1]}) ` + l.replace(PRI, ''); }
  if(a === 'd1'){ const m = l.match(DUE), base = m && m[2] > HOJE ? m[2] : HOJE, d = new Date(base + 'T12:00:00'); d.setDate(d.getDate() + 1);
    return m ? l.replace(DUE, `$1due:${iso(d)}`) : `${l} due:${iso(d)}`; }
  if(a === 'edit'){ const m = l.match(/^(\([A-Z]\) )?(\d{4}-\d\d-\d\d )?/); return (m[1]||'') + (m[2]||'') + String(v).trim(); }
  throw new Error('ação desconhecida');
}
function rota(url, body){
  if(url === '/api/jogo'){
    const meta = jogador.cf && jogador.cf.meta || 3, i = todo.findIndex(l => !DONE_RE.test(l) && l.includes(`rec:cf:${HOJE}`));
    if(i >= 0 && (cfDia[HOJE] || 0) >= meta) todo[i] = `x ${HOJE} ` + todo[i].replace(PRI, '');
  }
  if(url === '/api/jogo') return {ok:true, hoje:HOJE, todo, done, avaliacoes:AVALIACOES, notas, ajustes, estado, cf:{por_dia:cfDia}, avatares:Object.keys(window.HJ_AV || {}), narradas, jogador};
  if(url === '/api/act'){
    const i = todo.indexOf(body.raw); if(i < 0) throw new Error('a linha mudou no todo.txt; recarregue');
    if(body.action === 'delete'){ const antes = todo.splice(i, 1)[0]; undo.push({from:antes, to:null}); return {ok:true}; }
    const nova = transformar(todo[i], body.action, body.value); undo.push({from:todo[i], to:nova}); todo[i] = nova; return {ok:true};
  }
  if(url === '/api/add'){ const t = String(body.text||'').trim(); if(!t) throw new Error('texto vazio'); const l = HOJE + ' ' + t; todo.splice(todo.length - 1, 0, l); undo.push({from:null, to:l}); return {ok:true}; }
  if(url === '/api/undo'){ const op = undo.pop(); if(!op) throw new Error('nada para desfazer');
    if(op.done){ const i = done.indexOf(op.to); if(i >= 0) done.splice(i, 1); return {ok:true}; }
    if(op.to === null) todo.splice(todo.length - 1, 0, op.from); else { const i = todo.indexOf(op.to); if(i < 0) throw new Error('a linha mudou'); if(op.from === null) todo.splice(i, 1); else todo[i] = op.from; }
    return {ok:true}; }
  if(url === '/api/config'){
    /* o assistente mandou o jogador e o avaliacoes.txt: as tarefas de exemplo passam a usar as disciplinas e as tags dele */
    const j = body.jogador || {}, antigos = (jogador.habitos || []).map(h => h.id), novas = (j.disciplinas || []).map(d => d.d), velhas = ['CALC2','ED1','BD','POO','ARQ'];
    const troca = {'@entrega': j.tags && j.tags.ent, '@estudo': j.tags && j.tags.est, '+treino': j.tags && j.tags.tre, '+rotina': j.tags && j.tags.hab};
    const ajusta = l => l.replace(/\+fac\.(\w+)/g, (m, d) => { const i = velhas.indexOf(d); return i >= 0 && novas.length ? '+fac.' + novas[i % novas.length] : m; })
      .replace(/(^|\s)(@entrega|@estudo|\+treino|\+rotina)(?=\s|$)/g, (m, sp, tg) => sp + (troca[tg] || tg));
    /* hábitos: o histórico de exemplo segue a ordem (o 1º antigo vira o 1º novo); os de hoje são recriados */
    const habs = j.habitos || [], hab = (j.tags && j.tags.hab) || '+rotina';
    const trocaH = l => l.replace(/^(x \S+ \S+ )(.*?) \S+ rec:([\w-]+):(\S+)$/, (m, pre, txt, id, d) => { if(id.startsWith('cf')) return m; const k = antigos.indexOf(id); const h = habs[k]; return h ? `${pre}${h.n} ${hab} rec:${h.id}:${d}` : ''; });
    const primeira = !jogador.configurado;   // só na primeira configuração as tarefas de exemplo trocam de disciplina
    todo = todo.map(l => primeira ? ajusta(l) : l); done.splice(0, done.length, ...done.map(l => primeira ? ajusta(l) : l).map(trocaH).filter(Boolean));
    const feitosHoje = new Set(todo.filter(l => DONE_RE.test(l)).map(l => (l.match(/rec:([\w-]+):/) || [])[1]).filter(Boolean));
    todo = todo.filter(l => !/rec:h-[\w-]+:/.test(l) || !l.includes(HOJE));
    const seg = D(-((new Date(HOJE + 'T12:00:00').getDay() + 6) % 7)), naSem = id => done.filter(l => { const m = l.match(/rec:([\w-]+):(\S+)$/); return m && m[1] === id && m[2] >= seg; }).length;
    for(const h of habs) if(!(h.semana && naSem(h.id) >= h.semana && !feitosHoje.has(h.id))) todo.splice(todo.length - 1, 0, (feitosHoje.has(h.id) ? `x ${HOJE} ` : '') + `${HOJE} ${h.n} ${hab} rec:${h.id}:${HOJE}`);
    if(!(j.cf && j.cf.handle)) todo = todo.filter(l => DONE_RE.test(l) || !l.includes(`rec:cf:${HOJE}`));
    else if(!todo.some(l => l.includes(`rec:cf:${HOJE}`))) todo.splice(todo.length - 1, 0, `(A) ${HOJE} Codeforces ${j.cf.meta} questões ${hab} rec:cf:${HOJE}`);
    if(body.avaliacoes != null){ AVALIACOES = String(body.avaliacoes); if(primeira) notas = ''; }
    jogador = JSON.parse(JSON.stringify(j));
    return {ok:true};
  }
  if(url === '/api/ontem'){ const h = (jogador.habitos || []).find(x => x.id === body.id), o = D(-1); if(!h) throw new Error('hábito não encontrado');
    if(done.some(l => l.includes(`rec:${h.id}:${o}`))) throw new Error('esse hábito já está marcado ontem');
    const l = `x ${o} ${o} ${h.n} ${(jogador.tags && jogador.tags.hab) || '+rotina'} rec:${h.id}:${o}`; done.push(l); undo.push({from:null, to:l, done:true}); return {ok:true}; }
  if(url === '/api/jogo/planos'){ if(body.avaliacoes != null) AVALIACOES = String(body.avaliacoes); if(body.notas != null) notas = String(body.notas); return {ok:true}; }
  if(url === '/api/jogo/narrada'){ const c = body.carta || {}; if(!c.titulo || !c.texto) throw new Error('a carta precisa de título e texto');
    const no = 'N-' + c.periodo, i = narradas.findIndex(x => x.no === no); const nova = {...c, no, escrita:HOJE, ic:c.ic || 'scroll'}; if(i >= 0) narradas[i] = nova; else narradas.push(nova); return {ok:true}; }
  if(url === '/api/autostart') throw new Error('no modo demonstração não há servidor');
  if(url === '/api/jogo/nota'){ notas += `\n${HOJE} | ${body.disc} | ${body.aval} | ${String(body.nota).replace('.', ',')}${body.parcial ? ' | parcial' : ''}`; return {ok:true}; }
  if(url === '/api/jogo/estado'){ estado = JSON.parse(JSON.stringify(body.estado)); return {ok:true}; }
  if(url === '/api/jogo/ajuste'){ ajustes += `\n${HOJE} 12:00 | pendente | ${body.texto}`; return {ok:true}; }
  throw new Error('rota desconhecida');
}
const real = window.fetch ? window.fetch.bind(window) : null;
window.fetch = async (url, op) => {
  const u = String(url);
  if(!u.startsWith('/api/')) return real(url, op);
  let j; try { j = rota(u, op && op.body ? JSON.parse(op.body) : {}); } catch(e){ j = {ok:false, error:e.message}; }
  return {ok:true, status:200, json: async () => JSON.parse(JSON.stringify(j))};
};
window.HJ_DEMO = true;
})();
