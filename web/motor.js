/* Hunter.todo · motor do jogo (regras e cálculo). Um arquivo só, usado pela página do jogo (/jogo) e pelo painel.
 *
 * Não grava nada: recebe o que o servidor manda em GET /api/jogo (todo.txt, done.txt, avaliacoes.txt, notas.txt,
 * estado.json, Codeforces) e devolve o estado do jogo. Tudo fica dentro de window.HJ para não colidir com os
 * scripts do painel. Regras explicadas em jogo/README.md; mudou uma regra aqui, atualize o README.
 */
(function(){
'use strict';

/* ---------- regras fixas ---------- */
const MEDIA = 6;                                  // média para derrotar o chefão
const DIF = {facil:.7, normal:1, dificil:1.4};    // dificuldade da torre (custo dos andares)
const COFRE_MES = 150;                            // R$ por mês para prêmios que custam dinheiro (acumula)
const ALLFX = ['shim','aura','shake','zap','drift','confete'];

const NEN = [
  {k:'int', n:'Intensificação', c:'estudo',   f:'@estudo',     s:'Força de base. Horas de estudo e revisão que deixam você pronto para as provas.'},
  {k:'tra', n:'Transmutação',   c:'treino',   f:'+treino · Codeforces',      s:'Transformar teoria em código rápido. É o tipo do Killua.'},
  {k:'con', n:'Conjuração',     c:'criação',  f:'outras tarefas da faculdade',      s:'Criar do zero: códigos, projetos, roteiros, organizar a matéria.'},
  {k:'esp', n:'Especialização', c:'vida',     f:'o resto (sem tag)', s:'O que é só seu: casa, família, saúde, pessoas.'},
  {k:'man', n:'Manipulação',    c:'hábitos',  f:'+rotina',         s:'Controle de si: hábitos diários, como a digitação.'},
  {k:'emi', n:'Emissão',        c:'entregas', f:'@entrega',              s:'Pôr para fora: listas, trabalhos e atividades entregues.'},
];
const GUARDA = [{ic:'cat',n:'Neferpitou',r:'Ten de 14 dias'},{ic:'wing',n:'Shaiapouf',r:'2 semanas sem atraso'},{ic:'horn',n:'Menthuthuyoupi',r:'uma semana acima de 300 XP'},{ic:'crown',n:'Meruem',r:'os cinco chefões derrotados'}];
const SPELLS = [
  {k:'zetsu',   n:'Zetsu extra', e:'+1 folga guardada no Ten (máx. 2).',            p:1200, ic:'moon'},
  {k:'ko',      n:'Ko',          e:'A próxima tarefa vale XP ×2.',                   p:2000, ic:'int'},
  {k:'gyo',     n:'Gyo',         e:'Você escolhe o atributo da missão da semana.',   p:1500, ic:'esp'},
  {k:'acomp',   n:'Acompanhar',  e:'A próxima entrega vale XP ×2.',                  p:1800, ic:'emi'},
  {k:'retorno', n:'Retorno',     e:'Conta a meta do Codeforces de ontem, se faltou.', p:1000, ic:'tra'},
  {k:'ken',     n:'Ken',         e:'Adia um due: em 1 dia sem perder o ×1,5.',       p:1600, ic:'con'},
  {k:'escolha', n:'Feitiço à escolha', e:'Vira qualquer feitiço quando você usar. Vem da preparação completa.', p:0, ic:'card', noshop:1},
];

/* ---------- aparência (loja) ---------- */
const TK = 'bg panel panel2 ink soft faint hair track prompt red amb grn volt aura n1 n2 n3 n4 n5 n6'.split(' ');
const PALS = {
  painel:  ['dark','#13141B','#1B1D28','#222536','#E6E8F0','#9197AD','#5A6078','#2A2D3C','#252838','#7AA2F7','#F7768E','#E0AF68','#73C991','#9FD3FF','#B4A0FF','#F7768E','#7DCFFF','#73C991','#FF9E64','#BB9AF7','#E0AF68'],
  simples: ['dark','#16181D','#1D2027','#24282F','#E2E5EB','#9BA1AD','#60666F','#2C3038','#272B33','#9FB2CF','#DB8A93','#CDB384','#8DBF9F','#B4C1D3','#A6AFC0','#DB8A93','#A6C3DA','#8DBF9F','#D3A27E','#ADA3CC','#CDB384'],
  leorio:  ['dark','#0D1424','#132038','#1A2945','#E8EEF8','#97A6C2','#5A6A8A','#24345A','#1D2B4B','#4FC3D9','#FF7A7A','#F2C46D','#6FD6A8','#5FD3E6','#4F8FE0','#FF7A7A','#5FD3E6','#6FD6A8','#F2A65A','#9F9BF5','#F2C46D'],
  gon:     ['dark','#0D1710','#132118','#1A2B20','#ECF5E8','#9DB5A0','#5E7863','#24392A','#1E3125','#9BE15D','#FF6B5B','#F2C14E','#9BE15D','#C6F27A','#3FBF7F','#FF6B5B','#7DD3FC','#9BE15D','#F2994A','#B794F6','#F2C14E'],
  biscuit: ['dark','#1C1220','#26182B','#301E36','#FFF0F7','#C9A3BB','#80637A','#432A48','#38243D','#FFE08A','#FF7EB0','#FFE08A','#7EE0B5','#FF9EC7','#C3A6FF','#FF7EB0','#8FD3FF','#7EE0B5','#FFB07A','#C3A6FF','#FFE08A'],
  netero:  ['dark','#17110C','#211810','#2B2016','#FFF5EA','#C8B19A','#86705A','#3F2F22','#33261B','#FF9A3C','#FF5E4D','#FFC861','#86D49A','#FFB25E','#F2E6D0','#FF5E4D','#8CCFF0','#86D49A','#FF9A3C','#C7A6E8','#FFC861'],
  kurapika:['dark','#140D12','#1D1219','#261822','#F6EAF0','#B49BA8','#76606C','#3A2632','#2E1E28','#F5C26B','#FF3D5E','#F5C26B','#7DD8A4','#FF4D6D','#F5C26B','#FF3D5E','#7FC8F8','#7DD8A4','#F59E5B','#C9A2FF','#F5C26B'],
  killua:  ['dark','#0C1120','#121A2E','#18223A','#EAF2FF','#93A3C4','#56648A','#22304F','#1C2742','#8CC8FF','#FF7A90','#FFD27A','#7CE0B0','#B6ECFF','#7FA8FF','#FF7A90','#B6ECFF','#7CE0B0','#FFB07A','#B9A2FF','#FFD27A'],
  hisoka:  ['dark','#160C1A','#211128','#2A1633','#FFEFFA','#C39BC0','#7E5C7F','#3D2346','#331C3B','#FFD23F','#FF5C8A','#FFD23F','#6EE7B7','#FF6FB5','#FFD23F','#FF5C8A','#7DD3FC','#6EE7B7','#FB923C','#E879F9','#FFD23F'],
  meruem:  ['dark','#0B110D','#111A14','#17231B','#EEF3E6','#A3B29A','#64725E','#24331F','#1D2A1C','#C9B458','#E0605A','#C9B458','#5DBB8A','#E3CF6E','#5DBB8A','#E0605A','#8FC9D9','#5DBB8A','#D99A4E','#A99AD0','#C9B458'],
  claro:   ['light','#F4F5F9','#FFFFFF','#F3F4FA','#1B1E2E','#5B6180','#989EB6','#E1E4EE','#E8EAF2','#2F5FD0','#D6455D','#B7812A','#2F8A55','#1F78C8','#6B4FD8','#D6455D','#1F86B8','#2F8A55','#D0661F','#7E57C2','#B7812A'],
};
const palStyle = k => { const p = PALS[k] || PALS.painel; return TK.map((t,i) => `--${t}:${p[i+1]}`).join(';') + `;color-scheme:${p[0]}`; };
const COS = [
  {id:'pal-simples', cat:'pal', n:'Simples', d:'Cinza-azulado, sem brilho. É onde todo Hunter começa.', p:0, eq:{theme:'simples'}},
  {id:'pal-leorio', cat:'pal', n:'Leorio', d:'Azul-marinho do terno, detalhes em turquesa.', p:600, eq:{theme:'leorio'}},
  {id:'pal-claro', cat:'pal', n:'Claro', d:'Fundo claro, para o dia.', p:700, eq:{theme:'claro'}},
  {id:'pal-gon', cat:'pal', n:'Gon', d:'Verde de floresta e vara de pescar.', p:800, eq:{theme:'gon'}},
  {id:'pal-biscuit', cat:'pal', n:'Biscuit', d:'Rosa e dourado, mais forte do que parece.', p:900, eq:{theme:'biscuit'}},
  {id:'pal-kurapika', cat:'pal', n:'Kurapika', d:'Olhos escarlates e correntes de ouro.', p:1000, eq:{theme:'kurapika'}},
  {id:'pal-netero', cat:'pal', n:'Netero', d:'Laranja e marfim do presidente da Associação.', p:1100, eq:{theme:'netero'}},
  {id:'pal-killua', cat:'pal', n:'Killua', d:'Azul elétrico. Só a paleta, sem efeitos.', p:1200, eq:{theme:'killua'}},
  {id:'pal-hisoka', cat:'pal', n:'Hisoka', d:'Rosa e amarelo. Só vem no Tema Hisoka.', p:0, excl:'th-hisoka', eq:{theme:'hisoka'}},
  {id:'pal-meruem', cat:'pal', n:'Meruem', d:'Verde-escuro e ouro real. Só vem no Tema Meruem.', p:0, excl:'th-meruem', eq:{theme:'meruem'}},
  {id:'tx-manga', cat:'tex', n:'Retícula de mangá', d:'Pontinhos de retícula no fundo de todas as telas.', p:2000, eq:{bg:'manga'}},
  {id:'tx-arena', cat:'tex', n:'Ladrilhos da Arena', d:'O piso quadriculado do ringue, bem discreto.', p:2200, eq:{bg:'arena'}},
  {id:'tx-ceu', cat:'tex', n:'Céu da Arena', d:'Um clarão no topo, como o céu visto do andar 200.', p:2500, eq:{bg:'ceu'}},
  {id:'tx-nen', cat:'tex', n:'Névoa de Nen', d:'Duas manchas de aura nos cantos.', p:3000, eq:{bg:'nen'}},
  {id:'tx-cartas', cat:'tex', n:'Baralho', d:'Losangos de baralho no fundo. Só vem no Tema Hisoka.', p:0, excl:'th-hisoka', eq:{bg:'cartas'}},
  {id:'fx-shake', cat:'fx', n:'Fúria visível', d:'O chefão em fúria treme de raiva.', p:1000, fx:'shake'},
  {id:'fx-shim', cat:'fx', n:'Barra elétrica', d:'A barra de XP corre como eletricidade.', p:1200, fx:'shim'},
  {id:'fx-aura', cat:'fx', n:'Aura do avatar', d:'O seu avatar pulsa com a aura.', p:1500, fx:'aura'},
  {id:'fx-zap', cat:'fx', n:'Raio no aviso', d:'Os avisos chegam com um clarão.', p:2000, fx:'zap'},
  {id:'fx-confete', cat:'fx', n:'Confete no andar novo', d:'Subiu de andar? Chove confete.', p:2500, fx:'confete'},
  {id:'fx-drift', cat:'fx', n:'Aura ambiente', d:'Uma névoa de Nen passeia devagar no fundo.', p:3000, fx:'drift'},
  {id:'fr-hunter', cat:'frame', n:'Moldura Hunter ★', d:'Aro dourado de quem tem licença.', p:500, eq:{frame:'hunter'}},
  {id:'fr-volt', cat:'frame', n:'Moldura elétrica', d:'Aro tracejado com brilho azul.', p:900, eq:{frame:'volt'}},
  {id:'fr-nen', cat:'frame', n:'Moldura de aura', d:'O aro ganha a cor do seu tipo de Nen.', p:1200, eq:{frame:'nen'}},
  {id:'fr-aranha', cat:'frame', n:'Moldura da Aranha', d:'Aro duplo vermelho. Só depois de derrotar um chefão.', p:1500, eq:{frame:'aranha'}, lock:S => !S.bs.some(b => b.dead), why:'derrote um chefão'},
  {id:'tt-transm', cat:'title', n:'Título: Transmutador', d:'Aparece embaixo do seu andar.', p:300, eq:{title:'Transmutador'}},
  {id:'tt-cacador', cat:'title', n:'Título: Caçador de Aranhas', d:'Para a temporada do Genei Ryodan.', p:300, eq:{title:'Caçador de Aranhas'}},
  {id:'tt-zetsu', cat:'title', n:'Título: Mestre do Zetsu', d:'Para quem sabe descansar sem perder o ritmo.', p:500, eq:{title:'Mestre do Zetsu'}},
  {id:'tt-godspeed', cat:'title', n:'Título: Godspeed', d:'Só para quem tem a carta Godspeed (30 dias de digitação).', p:600, eq:{title:'Godspeed'}, lock:S => S.digi < 30, why:'carta Godspeed'},
  {id:'tt-floor', cat:'title', n:'Título: Floor Master', d:'Só para quem chegou ao andar 200.', p:800, eq:{title:'Floor Master'}, lock:S => S.a.n < 200, why:'chegue ao andar 200'},
  {id:'th-killua', cat:'full', n:'Tema Killua completo', d:'Paleta Killua + céu da Arena + barra elétrica + aura do avatar.', p:6000, eq:{theme:'killua', bg:'ceu'}, fxs:['shim','aura'], parts:['pal-killua','tx-ceu','fx-shim','fx-aura']},
  {id:'th-hisoka', cat:'full', n:'Tema Hisoka', d:'Rosa e amarelo, losangos de baralho no fundo, fúria que treme e avisos com clarão.', p:8000, eq:{theme:'hisoka', bg:'cartas'}, fxs:['shake','zap'], parts:['pal-hisoka','tx-cartas','fx-shake','fx-zap']},
  {id:'th-meruem', cat:'full', n:'Tema Meruem', d:'Verde-escuro e ouro real, névoa de Nen e aura ambiente.', p:10000, eq:{theme:'meruem', bg:'nen'}, fxs:['aura','drift'], parts:['pal-meruem','tx-nen','fx-aura','fx-drift']},
  {id:'th-lenda', cat:'full', n:'Lendário · tema exclusivo', d:'Desenhado com o Claude só para você: paleta, fundo e efeito próprios.', p:20000, lend:true},
  {id:'px-unlock', cat:'px', n:'Mundo pixel', d:'Abre o mapa, a ficha, o Greed Island e a Masadora pixel, com as peles padrão.', p:8000, sw:['#5FA35A','#3E7CC9','#F3E6C8','#EFEAF7','#2A2140']},
  {id:'px-map-tarde', cat:'px', n:'Mapa · Tarde', d:'Pele do mapa.', p:1500, need:'px-unlock', skin:['map','tarde'], sw:['#E8A35A','#C9974A','#C7517A','#F3D9A0','#2A1830']},
  {id:'px-map-noite', cat:'px', n:'Mapa · Noite', d:'Pele do mapa.', p:1500, need:'px-unlock', skin:['map','noite'], sw:['#1F3A3A','#14205A','#7C8BB8','#070A18','#FFD45E']},
  {id:'px-p1-gb', cat:'px', n:'Ficha · Game Boy', d:'Pele da ficha.', p:1500, need:'px-unlock', skin:['p1','gameboy'], sw:['#9BBC0F','#8BAC0F','#306230','#0F380F','#C4DE6B']},
  {id:'px-p1-noite', cat:'px', n:'Ficha · Noite', d:'Pele da ficha.', p:1500, need:'px-unlock', skin:['p1','noite'], sw:['#151229','#3B2E6E','#7FE0A0','#B49CFF','#E8E2FF']},
  {id:'px-gi-joy', cat:'px', n:'Greed Island · Joystation', d:'Pele do Book pixel.', p:1500, need:'px-unlock', skin:['p3','joy'], sw:['#2B2346','#0F0E1A','#FF6FB5','#6FE3FF','#FFD166']},
  {id:'px-gi-noite', cat:'px', n:'Greed Island · Noite', d:'Pele do Book pixel.', p:1500, need:'px-unlock', skin:['p3','noite'], sw:['#0B1026','#141B3A','#FFB547','#7FD1FF','#C9A2FF']},
  {id:'px-ms-neon', cat:'px', n:'Masadora · Neon', d:'Pele da loja pixel.', p:1500, need:'px-unlock', skin:['p3b','neon'], sw:['#0E0B1F','#1D1840','#FF5FA2','#6FE3FF','#E9E6FF']},
  {id:'px-ms-papel', cat:'px', n:'Masadora · Papel', d:'Pele da loja pixel.', p:1500, need:'px-unlock', skin:['p3b','papel'], sw:['#EFE6D2','#D8C7A3','#FFFBF1','#B4521E','#2B1D14']},
];
/* fotos de perfil: cada imagem de jogo/avatares/ vira um item da loja. Preço padrão 1.000 J; estas são grátis. */
const AV_GRATIS = ['logo'];
const avNome = f => f.replace(/-png(-d)?$/,'').replace(/^\d+-\d+_/,'').replace(/-png-image$/,'').replace(/[-_]+/g,' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
/* tema completo = pacote: comprar o tema dá cada peça (paleta, textura, efeitos) para usar e misturar separado */
function expandeOwn(own){ for(const it of COS) if(it.parts && own.has(it.id)) it.parts.forEach(p => own.add(p)); return own; }
function catalogo(avatares){
  return COS.concat((avatares||[]).map(f => ({id:'av-'+f, cat:'avatar', n:avNome(f), d:'Foto de perfil das páginas do jogo.', p: AV_GRATIS.includes(f) ? 0 : 1000, eq:{avatar:f}})));
}
/* prêmios reais padrão (cada jogador troca os seus no jogador.conf, seção [premios]); [nome, ícone, R$ do cofre] */
const REAIS = [
  ['pequeno',250,[['1h de videogame num dia de semana','tra',0],['Contest virtual só por diversão','tra',0],['30 min de leitura de lazer','scroll',0],['1h de série ou vídeo sem culpa','esp',0]]],
  ['médio',1300,[['Pular uma recorrente sem perder o Ten','moon',0],['Manhã de sábado livre','moon',0],['Tarde de projeto 100% pessoal','con',0],['2–3h de videogame no fim de semana','tra',0],['Item pequeno','coin',20]]],
  ['grande',5000,[['Dia inteiro de projeto pessoal','con',0],['Sábado inteiro de videogame','tra',0],['Livro ou mangá físico','scroll',60],['Jogo novo','tra',60],['Upgrade pequeno de setup','coin',80]]],
  ['épico',20000,[['Upgrade grande de setup (cofre acumulado)','coin',500],['Curso por gosto','int',300],['Uma semana sem nenhuma tarefa','moon',0]]],
];

/* ---------- utilidades ---------- */
const mins = e => { if(!e) return 0; const m = String(e).match(/^(?:(\d+)h)?(?:(\d+)m?)?$/); return m ? (+(m[1]||0))*60 + (+(m[2]||0)) : 0; };
const has = (t,k,v) => (t[k]||[]).includes(v);
/* tags de cada tipo: padrão do template + as do jogador (jogador.conf, seção [tags]; o servidor manda em api.jogador.tags).
   ctx = @contexto, proj = +projeto. Disciplina é sempre +fac.SIGLA. */
const TAGS_PADRAO = {ent:'@entrega @teams @atividade', est:'@estudo @livro @caderno', tre:'+treino +mrt', hab:'+rotina'};
const TAGS = {};
function configura(extra){
  for(const k in TAGS_PADRAO){
    TAGS[k] = {ctx:[], proj:[]};
    for(const tg of (((extra||{})[k]||'') + ' ' + TAGS_PADRAO[k]).split(/[\s,]+/)){   // as do jogador primeiro: a 1ª é a que o formulário usa
      const w = tg[0] === '@' ? 'ctx' : tg[0] === '+' ? 'proj' : null, v = tg.slice(1).toLowerCase();
      if(w && v && !TAGS[k][w].includes(v)) TAGS[k][w].push(v);
    }
  }
}
configura();
const tem = (t,k) => ['ctx','proj'].some(w => (TAGS[k][w]||[]).some(v => has(t,w,v)));
const isRec = t => !!t.rec || tem(t,'hab');
const isFac = t => (t.proj||[]).some(p => p.startsWith('fac.'));
const isEst = t => tem(t,'est');
const isEnt = t => tem(t,'ent');
const isTre = t => tem(t,'tre');
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const addD = (iso,k) => { const d = new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+k); return d.toISOString().slice(0,10); };
const dias = (a,b) => Math.round((new Date(b+'T12:00:00Z') - new Date(a+'T12:00:00Z'))/864e5);
const dow = iso => (new Date(iso+'T12:00:00Z').getUTCDay()+6)%7;
const semanaISO = iso => { const d = new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay()+6)%7); const y = d.getUTCFullYear(), w1 = new Date(Date.UTC(y,0,4)); return y + '-W' + String(1 + Math.round(((d - w1)/864e5 - 3 + (w1.getUTCDay()+6)%7)/7)).padStart(2,'0'); };
const numBR = s => parseFloat(String(s).replace(',','.'));

/* ---------- leitura dos arquivos ---------- */
function parseLinha(raw, n){
  const t = {n, raw}; let s = raw.trim(), m;
  if((m = s.match(/^x (\d{4}-\d\d-\d\d) (?:(\d{4}-\d\d-\d\d) )?(.*)$/))){ t.done = m[1]; t.cri = m[2]; s = m[3]; }
  else { if((m = s.match(/^\(([A-Z])\) (.*)$/))){ t.pri = m[1]; s = m[2]; } if((m = s.match(/^(\d{4}-\d\d-\d\d) (.*)$/))){ t.cri = m[1]; s = m[2]; } }
  t.proj = (s.match(/(?:^|\s)\+(\S+)/g)||[]).map(x => x.trim().slice(1).toLowerCase());
  t.ctx = (s.match(/(?:^|\s)@(\S+)/g)||[]).map(x => x.trim().slice(1).toLowerCase());
  for(const k of ['est','due','prova','rec','aula','av']){ const r = s.match(new RegExp('(?:^|\\s)'+k+':(\\S+)')); if(r) t[k] = r[1]; }
  t.txt = s.replace(/\s(?:\+|@|\w+:)\S+/g,'').replace(/^\(([A-Z])\) /,'').trim();
  return t;
}
function parseAvaliacoes(txt){
  const out = {temp:null, bosses:[], aval:{}};
  let cur = null;
  for(const l0 of String(txt||'').split('\n')){
    const l = l0.trim(); if(!l || l.startsWith('#')) continue;
    if(/^temporada\s*\|/i.test(l)){ const p = l.split('|').map(x => x.trim()); const est = p.slice(2).some(x => x.includes('?')); const c = x => (x||'').replace('?','');
      out.temp = {nome:'Temporada ' + p[1], ini:c(p[2]), fim:c(p[3]), volta:c(p[4]), est}; continue; }
    const h = l.match(/^\[(\w+)\]\s*(.*)$/);
    if(h){ const p = h[2].split('|').map(x => x.trim()); cur = h[1].toUpperCase(); out.bosses.push({d:cur, n:p[0]||cur, ic:p[1]||'spider', why:p[2]||''}); out.aval[cur] = []; continue; }
    if(!cur) continue;
    const p = l.split('|').map(x => x.trim());
    if(p.length < 4) continue;
    out.aval[cur].push({k:p[0], n:p[1], w:numBR(p[2]), dt:p[3].replace('?',''), real: !p[2].includes('?') && !p[3].includes('?'), kw: p[4] ? norm(p[4]) : '', cont: /cont/i.test(p[5]||'')});
  }
  return out;
}
function parseNotas(txt){
  const NOTAS = {}, PARC = {}, NDATA = {};
  for(const l0 of String(txt||'').split('\n')){
    const l = l0.trim(); if(!l || l.startsWith('#')) continue;
    const p = l.split('|').map(x => x.trim()); if(p.length < 4) continue;
    const key = p[1].toUpperCase()+':'+p[2], v = numBR(p[3]); if(isNaN(v)) continue;
    if(/parcial/i.test(p[4]||'')) (PARC[key] = PARC[key] || []).push(v); else NOTAS[key] = v;
    NDATA[key] = p[0];
  }
  return {NOTAS, PARC, NDATA};
}
function parseAjustes(txt){
  return String(txt||'').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => { const p = l.split('|').map(x => x.trim()); return {d:p[0], st: /aplic/i.test(p[1]) ? 'ok' : 'p', t:p[2]||'', r:p[3]||''}; });
}
/* monta o contexto a partir da resposta do GET /api/jogo */
function carregar(api){
  configura(api.jogador && api.jogador.tags);
  const todo = (api.todo||[]).map((l,i) => ({l, n:i+1})).filter(o => o.l.trim());
  const feitas = (api.done||[]).filter(l => l.trim()).map(l => parseLinha(l, 0)).concat(todo.filter(o => o.l.startsWith('x ')).map(o => parseLinha(o.l, o.n)));
  const abertas = todo.filter(o => !o.l.startsWith('x ')).map(o => parseLinha(o.l, o.n));
  const av = parseAvaliacoes(api.avaliacoes), nt = parseNotas(api.notas);
  const est = Object.assign({spent:0, cofreUsado:0, own:[], resg:[], bought:{}, equip:{}}, api.estado||{});
  est.equip = Object.assign({theme:'simples', fx:[], bg:'', frame:'', title:'', avatar:'logo', lic:'l2', hud:'logo', skin:{map:'dia', p1:'lilas', p3:'couro', p3b:'madeira'}}, est.equip||{});
  const hoje = api.hoje || new Date().toISOString().slice(0,10);
  return {D:{feitas, abertas, cf:api.cf||null}, HOJE:hoje, TEMP: av.temp || {nome:'Temporada', ini:addD(hoje,-60), fim:addD(hoje,60), volta:addD(hoje,120)},
    BOSSES: av.bosses, AVAL: av.aval, NOTAS: nt.NOTAS, PARC: nt.PARC, NDATA: nt.NDATA, INBOX: parseAjustes(api.ajustes), EST: est, AVATARES: api.avatares||[],
    NARRADAS: Array.isArray(api.narradas) ? api.narradas : [], JOG: Object.assign({nome:'Hunter'}, api.jogador||{}), dif:'normal'};
}

/* ---------- regras ---------- */
function xpDe(t){ if((t.rec||'').startsWith('cf') && !(t.done && t.done < CF_DESDE)) return CF_BONUS; let x = isRec(t) ? 10 : isEnt(t) ? 25 : isEst(t) ? 15 : isFac(t) ? 15 : 10; if(isRec(t)) x *= .5; if(t.due && t.done && t.done <= t.due) x *= 1.5; return Math.round(x); }
/* tipo de Nen: treino → Transmutação; hábito → Manipulação; entrega → Emissão; estudo → Intensificação (com ou sem disciplina);
   outra da faculdade → Conjuração; o resto → Especialização (vida) */
function nenDe(t){ const r = t.rec || ''; if(r.startsWith('cf') || r.startsWith('atc') || isTre(t) || /codeforces|atcoder/i.test(t.txt)) return 1; if(isRec(t)) return 4; if(isEnt(t)) return 5; if(isEst(t)) return 0; if(isFac(t)) return 2; return 3; }
function discOf(t, C){
  const p = (t.proj||[]).find(p => p.startsWith('fac.')); if(!p) return null;
  const x = p.slice(4).toUpperCase(); const ds = (C && C.BOSSES || []).map(b => b.d);
  return ds.includes(x) ? x : (ds.find(d => d.startsWith(x) || x.startsWith(d)) || x);
}
const custo = (n, dif='normal') => Math.max(1, Math.round((n < 100 ? 8 : n < 200 ? 16 : 40) * DIF[dif]));
function andar(xp, dif){ let n = 1, r = xp; while(n < 251){ const c = custo(n,dif); if(r < c) return {n, into:r, need:c}; r -= c; n++; } return {n:251, into:1, need:1, topo:true}; }
const xpAte = (n, dif) => { let s = 0; for(let i=1;i<n;i++) s += custo(i,dif); return s; };
function ten(set, first, HOJE, zetsuExtra){
  const st = {}; let cur = 0, max = 0, zet = 1, seq = 0;
  if(!first) return {cur:0, max:0, zet:1, st};
  const extra = Object.assign({}, zetsuExtra||{});            // feitiço Zetsu extra: +1 folga a partir do dia do uso
  for(let d = first; d <= HOJE; d = addD(d,1)){
    if(extra[d]){ zet = Math.min(zet + extra[d], 3); delete extra[d]; }
    if(set.has(d)){ cur++; seq++; st[d] = 'on'; if(seq % 7 === 0) zet = Math.min(zet+1, Math.max(2, zet)); }
    else if(d === HOJE){}
    else if(zet > 0 && cur > 0){ zet--; cur++; st[d] = 'z'; }
    else { if(cur > 0) st[d] = 'x'; cur = 0; seq = 0; zet = 1; }
    max = Math.max(max,cur);
  }
  return {cur, max, zet, st};
}
function liga(t, avs, ref){
  if(t.av){ const a = avs.find(a => norm(a.k) === norm(t.av)); if(a) return a; }
  if(t.prova){ const a = avs.find(a => a.dt === t.prova); if(a) return a; }
  const s = norm(t.txt);
  const kws = avs.filter(a => a.kw && s.includes(a.kw));          // a mesma palavra em N1 e N2: vale a do período da tarefa
  if(kws.length) return kws.find(a => a.dt >= ref) || kws[kws.length-1];
  if(isEnt(t)){ const c = avs.find(a => a.cont); if(c) return c; }
  const provas = avs.filter(a => !a.cont && !/^AI$/i.test(a.k));    // reserva: a próxima avaliação pontual (nunca a AI)
  const prox = l => l.filter(a => a.dt >= ref).sort((p,q) => p.dt.localeCompare(q.dt))[0];
  return prox(provas) || prox(avs.filter(a => a.cont)) || provas[provas.length-1] || avs[avs.length-1];   // sem prova no plano: a contínua do período
}
function chefoes(C, feitas, abertas){
  return C.BOSSES.map(B => {
    const avs = (C.AVAL[B.d]||[]).map(a => ({...a, feitas:[], abertas:[]})).sort((p,q) => p.dt.localeCompare(q.dt));
    if(!avs.length) return {...B, avs, pts:0, rest:1000, tot:1000, dead:false, fury:false, need:null, st:'', open:[]};
    for(const t of feitas) if(discOf(t,C) === B.d) liga(t, avs, t.done).feitas.push(t);
    for(const t of abertas) if(discOf(t,C) === B.d) liga(t, avs, C.HOJE).abertas.push(t);
    let pts = 0, wrest = 0;
    for(const a of avs){
      a.tot = a.feitas.length + a.abertas.length; a.ok = a.feitas.length;
      a.prepFull = a.tot > 0 && a.abertas.length === 0 && a.feitas.every(t => t.done <= a.dt);
      a.prepOk = a.prepFull && a.dt <= C.HOJE;            // o bônus sai no dia da avaliação
      a.parts = C.PARC[B.d+':'+a.k] || [];
      a.nota = a.cont ? (a.parts.length ? a.parts.reduce((x,y) => x+y, 0)/a.parts.length : null) : C.NOTAS[B.d+':'+a.k];
      a.prov = a.cont && a.parts.length > 0;
      if(a.nota != null){ pts += a.w*a.nota/10; a.st = a.nota >= MEDIA ? 'ok' : 'low'; }
      else { wrest += a.w; a.st = a.dt < C.HOJE ? 'wait' : a.dt === C.HOJE ? 'hoje' : 'fut'; }
    }
    const need = wrest ? (60 - pts)/wrest*10 : null;
    const dead = pts >= 60, fury = !dead && avs.some(a => a.nota != null) && need > MEDIA;
    return {...B, avs, pts, rest: 1000 - pts*10, tot:1000, dead, fury, need, st: dead ? 'dead' : fury ? 'hurt' : '', open: avs.flatMap(a => a.abertas)};
  });
}
/* marca curta de uma linha do todo (para lembrar o que já estava feito quando um feitiço foi usado) */
const marca = raw => { let h = 5381; for(const c of String(raw)) h = ((h << 5) + h + c.codePointAt(0)) >>> 0; return h.toString(36); };
/* XP extra do Codeforces: do 4º ao 6º problema resolvido no dia, +1 cada; depois, nada (a meta é 3: a recorrente paga o resto) */
const CF_XP = 5, CF_MAX = 6, CF_BONUS = 10, CF_DESDE = '2026-10-06';   // Codeforces: 5 XP por problema distinto no dia (até 6); bater os 3 (a recorrente rec:cf) dá o bônus
// antes de CF_DESDE vale a regra antiga (só +1 do 4º ao 6º; recorrente 5), para não inflar a torre e a carteira de uma vez
const cfExtra = (n, d) => d && d < CF_DESDE ? Math.min(Math.max((n||0) - 3, 0), 3) : Math.min(n||0, CF_MAX) * CF_XP;
/* usos de feitiço guardados em estado.json (usos: [{k, d, n0, como?, alvo?}]); "escolha" vira o feitiço de "como" */
function efeitos(C, feitas){
  const usos = (C.EST.usos || []).map(u => ({...u, ef: u.k === 'escolha' ? u.como : u.k}));
  const mult = new Map(), ken = new Map(), zetsu = {}, gyo = {}, extras = [];
  // alvo = a primeira tarefa concluída DEPOIS do uso: dia posterior, ou o mesmo dia sem estar na lista "ja" (marcas das já feitas no momento do uso)
  const alvo = (u, f) => { const ja = new Set(String(u.ja||'').split(',').filter(Boolean)); let melhor = -1;
    feitas.forEach((t,i) => { if(mult.has(i) || !f(t) || !t.done || t.done < u.d || (t.done === u.d && ja.has(marca(t.raw)))) return;
      if(melhor < 0 || t.done < feitas[melhor].done) melhor = i; });
    return melhor; };
  for(const u of usos){
    if(u.ef === 'ko'){ const i = alvo(u, t => !isRec(t)); if(i >= 0) mult.set(i, 2); }
    else if(u.ef === 'acomp'){ const i = alvo(u, isEnt); if(i >= 0) mult.set(i, 2); }
    else if(u.ef === 'zetsu') zetsu[u.d] = (zetsu[u.d]||0) + 1;
    else if(u.ef === 'gyo' && u.alvo !== undefined) gyo[semanaISO(u.d)] = +u.alvo;
    else if(u.ef === 'ken' && u.alvo) ken.set(norm(u.alvo), (ken.get(norm(u.alvo))||0) + 1);
    else if(u.ef === 'retorno') extras.push({done: addD(u.d,-1), rec:'cf:retorno', proj:['rotina'], ctx:[], txt:'Codeforces (feitiço Retorno)', raw:''});
  }
  return {usos, mult, ken, zetsu, gyo, extras};
}
function estado(C){
  const {D, HOJE, TEMP, EST} = C;
  const F = efeitos(C, D.feitas);
  const feitas = D.feitas.concat(F.extras), abertas = D.abertas.filter(t => !t.done);
  const bs = chefoes(C, feitas, abertas);
  const furia = {}; for(const b of bs) if(b.fury){ const ds = b.avs.map(a => C.NDATA[b.d+':'+a.k]).filter(Boolean).sort(); furia[b.d] = ds[ds.length-1] || HOJE; }
  const xpBase = t => { const k = F.ken.get(norm(t.txt)) || 0; return xpDe(k && t.due ? {...t, due: addD(t.due, k)} : t); };
  // missão da semana: o atributo mais fraco ANTES da semana começar (fixo durante a semana; Gyo escolhe outro)
  const fracoDa = ws => { if(F.gyo[semanaISO(ws)] !== undefined) return F.gyo[semanaISO(ws)];
    const at = [0,0,0,0,0,0]; for(const t of feitas) if(t.done < ws) at[nenDe(t)] += xpBase(t); return at.indexOf(Math.min(...at)); };
  const fracoCache = {}, fracoSem = d => { const ws = addD(d,-dow(d)); return fracoCache[ws] ?? (fracoCache[ws] = fracoDa(ws)); };
  const porDia = {}, xpDia = {}, attr = [0,0,0,0,0,0], xs = [];
  let total = 0;
  feitas.forEach((t,i) => {
    let x = xpBase(t);
    if(nenDe(t) === fracoSem(t.done)) x *= 1.5;                       // missão da semana
    const d = discOf(t,C); if(d && furia[d] && t.done >= furia[d]) x *= 1.5;   // fúria
    if(F.mult.has(i)) x *= F.mult.get(i);                              // Ko / Acompanhar
    x = Math.round(x); total += x; xs.push({t,x});
    porDia[t.done] = (porDia[t.done]||0)+1; xpDia[t.done] = (xpDia[t.done]||0)+x; attr[nenDe(t)] += x;
  });
  // Codeforces: 5 XP por problema do dia, até 6 (dados.json/codeforces.por_dia), a partir do início da temporada; missão da semana ×1,5
  const cfDia = (D.cf && D.cf.por_dia) || {}; let cfXP = 0;
  for(const d in cfDia){ if(d < TEMP.ini || d > HOJE) continue; const e = Math.round(cfExtra(cfDia[d], d) * (d >= CF_DESDE && fracoSem(d) === 1 ? 1.5 : 1)); if(e){ cfXP += e; total += e; xpDia[d] = (xpDia[d]||0)+e; attr[1] += e; } }
  const first = feitas.map(t => t.done).sort()[0], set = new Set(Object.keys(porDia));
  const ritmo = first ? total/Math.max(1, dias(first,HOJE)/7) : 0;
  const fraco = fracoSem(HOJE);
  const ws = addD(HOJE,-dow(HOJE)); let missDias = 0; for(let i=0;i<7;i++){ const d = addD(ws,i); if(feitas.some(t => t.done === d && nenDe(t) === fraco)) missDias++; }
  // recompensa da missão: cada semana com 3+ dias do atributo da semana dá 1 feitiço à escolha
  let missoes = 0;
  if(first) for(let w = addD(first,-dow(first)); w <= HOJE; w = addD(w,7)){ const fr = fracoSem(w); let k = 0; for(let i=0;i<7;i++){ const d = addD(w,i); if(d <= HOJE && feitas.some(t => t.done === d && nenDe(t) === fr)) k++; } if(k >= 3) missoes++; }
  const cfHoje = cfDia[HOJE] || 0;
  const rot = abertas.filter(isRec).map(t => ({...t, ok:false})).concat(feitas.filter(t => isRec(t) && t.done === HOJE && t.raw).map(t => ({...t, ok:true})));
  const golpes = abertas.filter(t => !isRec(t)).map(t => {
    const b = bs.find(b => b.d === discOf(t,C)), av = b ? b.avs.find(a => a.abertas.includes(t)) : null;
    let sc = 0; if(t.prova === HOJE) sc += 150; else if(av && dias(HOJE,av.dt) >= 0 && dias(HOJE,av.dt) <= 7) sc += 60;
    if(t.due){ const k = dias(HOJE,t.due); sc += k <= 1 ? 60 : k <= 3 ? 40 : k <= 7 ? 20 : 0; }
    if(nenDe(t) === fraco) sc += 15; if(b && b.fury) sc += 25; if(t.pri === 'A') sc += 10;
    let x = xpBase({...t, done:HOJE}); if(nenDe(t) === fraco) x *= 1.5; if(b && b.fury) x *= 1.5;
    return {t, sc, x: Math.round(x), b, av, bonus: nenDe(t) === fraco, fury: !!(b && b.fury)};
  }).sort((a,b) => b.sc - a.sc);
  const bonusNotas = Math.round(bs.reduce((s,b) => s + b.avs.filter(a => !a.cont && a.nota >= MEDIA).reduce((q,a) => q + a.nota*a.w*5, 0), 0));
  const ganho = total*10 + bonusNotas;
  const prepBonus = bs.reduce((s,b) => s + b.avs.filter(a => a.prepOk).length, 0);
  // bolsa: comprados + preparação completa + missões − usados
  const inv = {}; for(const w in EST.bought) for(const k of EST.bought[w]) inv[k] = (inv[k]||0) + 1;
  if(prepBonus + missoes) inv.escolha = (inv.escolha||0) + prepBonus + missoes;
  for(const k in (EST.usados||{})) inv[k] = (inv[k]||0) - EST.usados[k];
  for(const u of F.usos) inv[u.k] = (inv[u.k]||0) - 1;
  for(const k in inv) if(inv[k] <= 0) delete inv[k];
  const espera = bs.flatMap(b => b.avs.filter(a => a.st === 'wait' && !a.cont).map(a => ({b,a})));
  const digi = feitas.filter(t => (t.rec||'').startsWith('digi') || /digita/i.test(t.txt)).length;
  const sem = {n: Math.floor(dias(TEMP.ini,HOJE)/7)+1, tot: Math.ceil(dias(TEMP.ini,TEMP.fim)/7)};
  return {total, a:andar(total, C.dif), attr, porDia, xpDia, set, first, ten:ten(set,first,HOJE,F.zetsu), hojeXP: xpDia[HOJE]||0, xs, n:D.feitas.length, ritmo,
    proj: andar(Math.round(total + ritmo*Math.max(0,dias(HOJE,TEMP.fim))/7), C.dif), bs, fraco, missDias, missoes, rot, golpes, ganho, bonusNotas, jenny: ganho - (EST.spent||0),
    inv, prepBonus, espera, digi, sem, cfHoje, cfXP, usos: F.usos, metaDia: Math.max(20, Math.round(ritmo/5/5)*5),
    cofre: COFRE_MES*(Math.floor(Math.max(0,dias(TEMP.ini,HOJE))/30)+1) - (EST.cofreUsado||0)};
}
function cartas(C, S){
  const {D} = C, cnt = p => D.feitas.filter(t => has(t,'proj',p)).length, maxDia = Math.max(0, ...Object.values(S.porDia));
  const noPrazo = D.feitas.filter(t => t.due && t.done <= t.due).length;
  return [
    {no:'001',rk:'H',o:'slot',n:'Primeiro passo',d:'Concluir a primeira tarefa.',on:S.n>0,ic:'card'},
    {no:'007',rk:'G',o:'slot',n:'Dia cheio',d:`5 tarefas num dia. Recorde: ${maxDia}.`,on:maxDia>=5,ic:'flame'},
    {no:'013',rk:'F',o:'slot',n:'Mestre de POO',d:`10 tarefas de POO. Você tem ${cnt('fac.poo')}.`,on:cnt('fac.poo')>=10,ic:'copy'},
    {no:'021',rk:'E',o:'slot',n:'Ten de 7 dias',d:`7 dias seguidos. Recorde: ${S.ten.max}.`,on:S.ten.max>=7,ic:'flame'},
    {no:'024',rk:'F',o:'slot',n:'Dedos Rápidos',d:`7 dias de treino de digitação. Você tem ${S.digi}.`,on:S.digi>=7,ic:'man'},
    {no:'025',rk:'D',o:'slot',n:'Godspeed',d:`30 dias de treino de digitação. Você tem ${S.digi}.`,on:S.digi>=30,ic:'tra'},
    {no:'026',rk:'B',o:'slot',n:'Kanmuru',d:'100 dias de treino de digitação. A técnica do Killua.',on:S.digi>=100,ic:'tra'},
    {no:'034',rk:'D',o:'slot',n:'Pontual',d:`10 entregas até o due. Você tem ${noPrazo}.`,on:noPrazo>=10,ic:'scroll'},
    {no:'042',rk:'C',o:'slot',n:'Preparado',d:'Fechar toda a preparação de uma avaliação antes da data.',on:S.prepBonus>0,ic:'int'},
    {no:'050',rk:'B',o:'slot',n:'Aranha abatida',d:'Derrotar um chefão (média ≥ 6).',on:S.bs.some(b => b.dead),ic:'spider'},
    {no:'055',rk:'B',o:'slot',n:'Andar 100',d:'Passar do centésimo andar.',on:S.a.n>=100,ic:'tower'},
    {no:'077',rk:'A',o:'slot',n:'Floor Master',d:'Chegar ao andar 200.',on:S.a.n>=200,ic:'tower'},
    {no:'090',rk:'A',o:'slot',n:'Neferpitou',d:'Torneio: vencer a 1ª guarda (Ten de 14 dias).',on:false,ic:'cat'},
    {no:'091',rk:'A',o:'slot',n:'Shaiapouf',d:'Torneio: vencer a 2ª guarda (2 semanas sem atraso).',on:false,ic:'wing'},
    {no:'092',rk:'A',o:'slot',n:'Menthuthuyoupi',d:'Torneio: vencer a 3ª guarda (uma semana acima de 300 XP).',on:false,ic:'horn'},
    {no:'093',rk:'SS',o:'slot',n:'Rei Meruem',d:'Torneio: vencer o Rei (os cinco chefões derrotados).',on:false,ic:'crown'},
    {no:'099',rk:'SS',o:'slot',n:'Licença Hunter',d:'Derrotar os cinco chefões no semestre.',on:S.bs.length>0 && S.bs.every(b => b.dead),ic:'crown'},
  ].concat((C.NARRADAS||[]).map(c => ({no:c.no, tipo:c.tipo, periodo:c.periodo, n:c.titulo, d:c.texto, cron:c.cronica||'', escrita:c.escrita, ic:c.ic||'scroll',
    rk:{semana:'C', mes:'B', semestre:'A', ano:'SS'}[c.tipo] || 'C', o:'claude', on:true})));
}

window.HJ = {TAGS, configura, isTre, MEDIA, DIF, COFRE_MES, ALLFX, NEN, GUARDA, SPELLS, TK, PALS, palStyle, COS, catalogo, REAIS,
  mins, has, isRec, isFac, isEst, isEnt, norm, addD, dias, dow, semanaISO, numBR,
  expandeOwn, marca, cfExtra, efeitos, parseLinha, parseAvaliacoes, parseNotas, carregar, xpDe, nenDe, discOf, custo, andar, xpAte, ten, liga, chefoes, estado, cartas};
})();
