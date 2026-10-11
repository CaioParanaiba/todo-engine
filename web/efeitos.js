/* Hunter.todo · efeitos da Masadora: texturas, molduras, fontes, animações e sons comprados na loja.
 * Os itens (preço, descrição) ficam em COS no motor.js; aqui fica o que eles fazem na tela.
 * - CSS: injetado uma vez, pelos atributos data-fx, data-bg, data-frame e data-font do <html> (aplicaTema no index.html)
 *   e pelas classes do preview da loja (.fxd.X, .tex-X, .fr-X, .ft-X).
 * - Efeitos com laço (poeira, rastro, gyo): HJ_FX.aplica() liga e desliga conforme o que está equipado.
 * - Efeitos de evento: HJ_FX.tarefa(retângulo do botão) ao concluir uma tarefa; HJ_FX.festa() no andar novo ou chefão derrotado.
 * - Sons: Web Audio sintetizado, sem arquivos. Desligáveis por computador em Configurações (localStorage hj-somoff).
 * - Na loja, o botão ▶ (data-fxver) mostra o efeito ou toca o som antes de comprar.
 * Carregado depois do index.html: usa UI, COS (via HJx), toast.
 */
(() => {
const CSS = `
/* ---------- texturas ---------- */
:root[data-bg="scan"] body,.tex-scan{background-image:repeating-linear-gradient(0deg,color-mix(in srgb,#000 22%,transparent) 0 1px,transparent 1px 3px),radial-gradient(130% 100% at 50% 50%,transparent 55%,color-mix(in srgb,#000 38%,transparent))}
:root[data-bg="grao"] body,.tex-grao{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .45 0 0 0 0 .4 0 0 0 .13 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
:root[data-bg="hex"] body,.tex-hex{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='17.32' height='30' viewBox='0 0 17.32 30'%3E%3Cpath d='M8.66 0L17.32 5V15L8.66 20L0 15V5Z M8.66 20V30' fill='none' stroke='%23909090' stroke-opacity='.16' stroke-width='.7'/%3E%3C/svg%3E");background-size:31px 54px}
:root[data-bg="teia"] body,.tex-teia{background-image:
  repeating-radial-gradient(circle at 100% 0,transparent 0 54px,color-mix(in srgb,var(--ink) 8%,transparent) 54px 55.5px),
  repeating-conic-gradient(from 180deg at 100% 0,color-mix(in srgb,var(--ink) 8%,transparent) 0 .12deg,transparent .12deg 7.5deg)}
/* ---------- molduras ---------- */
:root[data-frame="carta"] .av.me,.fr-carta .av.me{border-radius:7px;border:3px double var(--amb);box-shadow:0 0 0 2px color-mix(in srgb,var(--amb) 25%,transparent),0 6px 16px -8px var(--amb)}
:root[data-frame="escarlate"] .av.me,.fr-escarlate .av.me{border-color:#FF2E4D;animation:hjEscarlate 2.4s ease-in-out infinite}
:root[data-frame="giro"] .av.me,.fr-giro .av.me{border-color:transparent;box-shadow:none}
:root[data-frame="giro"] .av.me::after,.fr-giro .av.me::after{content:"";position:absolute;inset:-6px;border-radius:50%;pointer-events:none;
  background:conic-gradient(var(--aura),var(--volt),var(--amb),var(--red),var(--aura));
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 3px));mask:radial-gradient(farthest-side,transparent calc(100% - 3.5px),#000 calc(100% - 3px));
  filter:drop-shadow(0 0 4px var(--aura));animation:hjGiro 3.2s linear infinite}
@keyframes hjEscarlate{0%,100%{box-shadow:0 0 0 3px color-mix(in srgb,#FF2E4D 18%,transparent),0 0 10px -4px #FF2E4D}50%{box-shadow:0 0 0 4px color-mix(in srgb,#FF2E4D 35%,transparent),0 0 26px 2px #FF2E4D}}
@keyframes hjGiro{to{transform:rotate(1turn)}}
/* ---------- fontes ---------- */
:root[data-font="maquina"],.ft-maquina{--f-ui:"JetBrains Mono",ui-monospace,monospace;--f-hud:"JetBrains Mono",ui-monospace,monospace}
:root[data-font="manga"],.ft-manga{--f-hud:Bangers,Impact,sans-serif}
:root[data-font="manga"] :is(h1,h3,.wal7),:root[data-font="manga"] h2:not(.card h2){font-family:var(--f-manga);letter-spacing:.03em;font-weight:400}
:root[data-font="pixel"],.ft-pixel{--f-hud:"Pixelify Sans","Courier New",monospace}
:root[data-font="pixel"] :is(h1,h3,.wal7),:root[data-font="pixel"] h2:not(.card h2){font-family:var(--f-pxl);font-weight:400;letter-spacing:.02em}
:root[data-font="arcade"],.ft-arcade{--f-hud:DotGothic16,"Courier New",monospace}
:root[data-font="arcade"] :is(h1,h3,.wal7),:root[data-font="arcade"] h2:not(.card h2){font-family:var(--f-dot);font-weight:400}
/* ---------- efeitos na tela ---------- */
@media (prefers-reduced-motion:no-preference){
  :root[data-fx~="corrente"] :is(.xpbar > b,.l-bar i),.fxd.corrente .xpbar > b{
    background:repeating-linear-gradient(90deg,var(--amb) 0 9px,color-mix(in srgb,var(--amb) 30%,transparent) 9px 11px,color-mix(in srgb,var(--amb) 70%,var(--bg)) 11px 20px,color-mix(in srgb,var(--amb) 30%,transparent) 20px 22px);
    background-size:44px 100%;animation:hjCorrente 1.1s linear infinite;box-shadow:0 0 8px -1px var(--amb)}
  :root[data-fx~="digita"].hj-entra :is(h1,h3,.card h2),:root[data-fx~="digita"].hj-entra h2:not(.card h2),.fxd.digita .mini b{animation:hjDigita .75s steps(22) both}
  :root[data-fx~="digita"].hj-entra .card h2::after,.fxd.digita .mini b::after{content:"_";color:var(--prompt);animation:hjCursor .5s steps(1) 4}
  :root[data-fx~="gyo"] .card,.fxd.gyo .mini{background-image:radial-gradient(240px circle at var(--mx,-999px) var(--my,-999px),color-mix(in srgb,var(--aura) 14%,transparent),transparent 70%)}
  :root[data-fx~="gyo"] .card:hover{border-color:color-mix(in srgb,var(--aura) 45%,var(--hair))}
  .fxd.gyo .mini{--mx:40%;--my:50%}
  :root[data-fx~="ascensao"] body::after{content:"";position:fixed;inset:-30%;pointer-events:none;z-index:0;opacity:.2;filter:blur(60px);
    background:conic-gradient(from 0deg at 50% 50%,var(--grn),var(--volt),var(--aura),var(--red),var(--amb),var(--grn));animation:hjGiro 48s linear infinite}
  .fxd.ascensao{background-image:conic-gradient(from 0deg,color-mix(in srgb,var(--grn) 30%,transparent),color-mix(in srgb,var(--aura) 30%,transparent),color-mix(in srgb,var(--red) 30%,transparent),color-mix(in srgb,var(--grn) 30%,transparent))}
  :root:is([data-fx~="ascensao"],[data-fx~="estrelas"]) .wrap{position:relative;z-index:1}
  .fxd.estrelas,.fxd.rastro{background-image:radial-gradient(2px 2px at 20% 70%,var(--aura),transparent),radial-gradient(2px 2px at 60% 40%,var(--volt),transparent),radial-gradient(1.5px 1.5px at 85% 80%,var(--aura),transparent),radial-gradient(1.5px 1.5px at 40% 20%,var(--volt),transparent);animation:hjSobe 3s linear infinite}
}
@keyframes hjCorrente{to{background-position:44px 0}}
@keyframes hjDigita{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes hjCursor{50%{opacity:0}}
@keyframes hjSobe{from{background-position:0 0,0 0,0 0,0 0}to{background-position:0 -96px,0 -96px,0 -96px,0 -96px}}
/* ---------- partes dos efeitos de evento ---------- */
.hj-cv{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60}
.hj-flash{position:fixed;inset:0;pointer-events:none;z-index:59;background:radial-gradient(circle at var(--fx,50%) var(--fy,50%),var(--volt),color-mix(in srgb,var(--volt) 30%,transparent) 40%,transparent 75%);animation:hjFlash .5s ease-out forwards}
@keyframes hjFlash{0%{opacity:.55}15%{opacity:.15}30%{opacity:.4}100%{opacity:0}}
.hj-raio{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:61;overflow:visible}
.hj-raio path{fill:none;stroke-linecap:round;stroke-linejoin:round;animation:hjRaio .55s ease-out forwards}
@keyframes hjRaio{0%{stroke-dashoffset:var(--len);opacity:1}35%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
.hj-carta{position:fixed;width:26px;height:36px;margin:-18px 0 0 -13px;border-radius:4px;background:#FBF8F2;border:1px solid #CFC6B5;z-index:61;pointer-events:none;
  display:grid;place-items:center;font:700 17px/1 Georgia,serif;box-shadow:0 4px 10px -4px #000;animation:hjCarta 1.1s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes hjCarta{0%{transform:translate(0,0) rotate(0) scale(.6);opacity:1}80%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot)) scale(1);opacity:0}}
.hj-jan{position:fixed;z-index:62;pointer-events:none;transform:translate(-50%,-50%);font:400 54px/1 var(--f-comic);letter-spacing:.04em;color:var(--c);
  -webkit-text-stroke:2px #000;text-shadow:3px 3px 0 #000,0 0 24px var(--c);animation:hjJan .9s cubic-bezier(.2,1.6,.4,1) forwards;white-space:nowrap}
@keyframes hjJan{0%{transform:translate(-50%,-50%) scale(.2) rotate(-12deg);opacity:0}25%{transform:translate(-50%,-50%) scale(1.15) rotate(-6deg);opacity:1}70%{transform:translate(-50%,-60%) scale(1) rotate(-6deg);opacity:1}100%{transform:translate(-50%,-90%) scale(.95) rotate(-6deg);opacity:0}}
.hj-onda{position:fixed;z-index:61;pointer-events:none;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;border:5px solid var(--c);box-shadow:0 0 18px var(--c),inset 0 0 12px var(--c);animation:hjOnda .65s ease-out forwards}
@keyframes hjOnda{to{transform:scale(9);opacity:0;border-width:1px}}
.hj-rastro{position:fixed;z-index:58;pointer-events:none;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--c);box-shadow:0 0 10px 2px var(--c);animation:hjRastro .7s ease-out forwards}
@keyframes hjRastro{to{transform:scale(.1) translateY(-10px);opacity:0}}
/* ---------- loja ---------- */
.hj-ver{min-width:34px;padding-inline:10px}
.pv .hj-tag{position:absolute;right:8px;bottom:6px;font:600 10px var(--f-mono);color:var(--soft);background:var(--panel);border:1px solid var(--hair);border-radius:99px;padding:0 7px}
.pv.som{display:flex;justify-content:center;gap:4px;align-items:flex-end}
.pv.som i{width:6px;border-radius:3px;background:var(--aura);height:var(--h);animation:hjEq 1s ease-in-out infinite alternate;animation-delay:var(--d)}
@keyframes hjEq{from{height:8px}to{height:var(--h)}}
`;
const st = document.createElement('style'); st.id = 'hj-efeitos'; st.textContent = CSS; document.head.appendChild(st);

const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const temFx = f => !UI.fxOff && UI.fx.includes(f);
const cor = v => getComputedStyle(document.documentElement).getPropertyValue('--' + v).trim() || '#9FD3FF';
const centro = r => r ? [r.left + r.width/2, r.top + r.height/2] : [innerWidth/2, innerHeight/2];
const tira = (el, ms) => { document.body.appendChild(el); setTimeout(() => el.remove(), ms); return el; };

/* ---------- efeitos de evento ---------- */
const EV = {
  godspeed(r){
    const [x, y] = centro(r), alvo = [innerWidth * (.55 + Math.random()*.4), -20];
    const zigue = (a, b, n, amp) => { const ps = [a]; for(let i = 1; i < n; i++){ const t = i/n;
      ps.push([a[0] + (b[0]-a[0])*t + (Math.random()-.5)*amp, a[1] + (b[1]-a[1])*t + (Math.random()-.5)*amp*.4]); } ps.push(b); return ps; };
    const tronco = zigue([x, y], alvo, 16, 110), caminhos = [tronco];
    for(let k = 0; k < 3; k++){   // galhos saindo do tronco
      const i = 3 + Math.floor(Math.random()*(tronco.length - 6)), o = tronco[i], ang = Math.random()*Math.PI*2, len = 80 + Math.random()*140;
      caminhos.push(zigue(o, [o[0] + Math.cos(ang)*len, o[1] + Math.sin(ang)*len], 6, 40)); }
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'hj-raio');
    caminhos.forEach((ps, j) => {
      const d = 'M' + ps.map(p => p.map(Math.round).join(' ')).join(' L'), k = j ? .45 : 1;
      [[12*k, cor('volt'), .35, 'blur(7px)'], [4*k, cor('volt'), 1, 'drop-shadow(0 0 6px ' + cor('volt') + ')'], [1.6*k, '#FFFFFF', 1, '']].forEach(([w, c, o, f]) => {
        const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.style.stroke = c; p.style.strokeWidth = w; p.style.opacity = o; if(f) p.style.filter = f;
        if(j) p.style.animationDelay = '.08s'; svg.appendChild(p); });
    });
    tira(svg, 800);
    svg.querySelectorAll('path').forEach(p => { const len = Math.ceil(p.getTotalLength()); p.style.strokeDasharray = len; p.style.setProperty('--len', len); });
    const fl = document.createElement('div'); fl.className = 'hj-flash'; fl.style.setProperty('--fx', x + 'px'); fl.style.setProperty('--fy', y + 'px'); tira(fl, 550);
  },
  baralho(r){
    const [x, y] = centro(r), naipes = [['♠','#111'],['♥','#C8102E'],['♦','#C8102E'],['♣','#111']];
    for(let i = 0; i < 12; i++){
      const c = document.createElement('div'), [s, k] = naipes[i % 4], a = -Math.PI/2 + (Math.random()-.5)*2.4, v = 120 + Math.random()*160;
      c.className = 'hj-carta'; c.textContent = s; c.style.color = k; c.style.left = x + 'px'; c.style.top = y + 'px';
      c.style.setProperty('--dx', Math.cos(a)*v + 'px'); c.style.setProperty('--dy', Math.sin(a)*v + 60 + 'px'); c.style.setProperty('--rot', (Math.random()*720 - 360) + 'deg');
      c.style.animationDelay = (i*25) + 'ms'; tira(c, 1500);
    }
  },
  jajanken(r){
    const [x, y] = centro(r), [txt, c] = [['PEDRA!', cor('amb')], ['TESOURA!', cor('red')], ['PAPEL!', cor('grn')]][Math.floor(Math.random()*3)];
    const o = document.createElement('div'); o.className = 'hj-onda'; o.style.left = x + 'px'; o.style.top = y + 'px'; o.style.setProperty('--c', c); tira(o, 700);
    const t = document.createElement('div'); t.className = 'hj-jan'; t.textContent = txt; t.style.setProperty('--c', c);
    t.style.left = Math.min(Math.max(x, 140), innerWidth - 140) + 'px'; t.style.top = Math.max(y - 30, 60) + 'px'; tira(t, 1000);
  },
  fogos(){
    const cv = document.createElement('canvas'), dpr = Math.min(devicePixelRatio || 1, 2); cv.className = 'hj-cv';
    cv.width = innerWidth*dpr; cv.height = innerHeight*dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr); document.body.appendChild(cv);
    const cores = ['volt','aura','amb','grn','red'].map(cor), ps = [], fim = performance.now() + 2600;
    const estoura = () => { const x = innerWidth*(.15 + Math.random()*.7), y = innerHeight*(.12 + Math.random()*.35), c1 = cores[Math.floor(Math.random()*cores.length)];
      const c2 = cores[Math.floor(Math.random()*cores.length)];
      for(let i = 0; i < 90; i++){ const a = Math.random()*Math.PI*2, v = 1.5 + Math.random()*4.2, c = i % 3 ? c1 : c2; ps.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, c, vida:1}); } };
    [0, 350, 700, 1050, 1500].forEach(t => setTimeout(estoura, t));
    const passo = now => {
      g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 0, innerWidth, innerHeight);   // rastro que some aos poucos
      g.globalCompositeOperation = 'lighter';
      for(const p of ps){ p.vy += .045; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.vida -= .011;
        if(p.vida <= 0) continue; g.globalAlpha = p.vida; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 2.6, 0, 7); g.fill();
        if(Math.random() < .08){ g.fillStyle = '#FFF'; g.beginPath(); g.arc(p.x, p.y, 1.4, 0, 7); g.fill(); } }
      if(now < fim) requestAnimationFrame(passo); else cv.remove();
    };
    requestAnimationFrame(passo);
  },
  confete(){ if(typeof confete === 'function') confete(true); },
};

/* ---------- efeitos com laço ---------- */
let poeira = null;
function ligaPoeira(on){
  if(!on){ if(poeira){ cancelAnimationFrame(poeira.raf); poeira.cv.remove(); poeira = null; } return; }
  if(poeira) return;
  const cv = document.createElement('canvas'); cv.className = 'hj-cv'; cv.style.zIndex = 0; cv.style.opacity = .75; document.body.prepend(cv);
  const g = cv.getContext('2d'), ps = [];
  const mede = () => { const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth*dpr; cv.height = innerHeight*dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  mede(); addEventListener('resize', mede);
  for(let i = 0; i < 46; i++) ps.push({x:Math.random()*innerWidth, y:Math.random()*innerHeight, r:.6 + Math.random()*1.8, v:.15 + Math.random()*.45, f:Math.random()*6, k:i % 2});
  poeira = {cv, raf:0};
  const passo = () => {
    if(!poeira) return;
    if(!document.hidden){
      const cs = [cor('aura'), cor('volt')]; g.clearRect(0, 0, innerWidth, innerHeight);
      for(const p of ps){ p.y -= p.v; p.f += .02; p.x += Math.sin(p.f)*.25; if(p.y < -10){ p.y = innerHeight + 10; p.x = Math.random()*innerWidth; }
        g.globalAlpha = .35 + .35*Math.sin(p.f*1.7); g.fillStyle = cs[p.k]; g.shadowColor = cs[p.k]; g.shadowBlur = 8; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
    }
    poeira.raf = requestAnimationFrame(passo);
  };
  passo();
}
let ultRastro = 0;
document.addEventListener('pointermove', e => {
  if(e.pointerType !== 'mouse' || calmo()) return;
  if(temFx('gyo')){ const c = e.target.closest && e.target.closest('.card'); if(c){ const b = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - b.left) + 'px'); c.style.setProperty('--my', (e.clientY - b.top) + 'px'); } }
  if(temFx('rastro')){ const t = performance.now(); if(t - ultRastro < 22) return; ultRastro = t;
    const d = document.createElement('i'); d.className = 'hj-rastro'; d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
    d.style.setProperty('--c', Math.random() < .5 ? 'var(--aura)' : 'var(--volt)'); tira(d, 750); }
}, {passive:true});

/* ---------- sons (Web Audio, sem arquivos) ---------- */
let AC = null;
const ac = () => { if(!AC){ const K = window.AudioContext || window.webkitAudioContext; if(!K) return null; AC = new K(); } if(AC.state === 'suspended') AC.resume(); return AC; };
function tom(f, t0, dur, tipo, vol, f2){
  const a = ac(); if(!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
  o.type = tipo || 'square'; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
}
function ruido(t0, dur, vol, corte){
  const a = ac(); if(!a) return; const t = a.currentTime + t0, n = Math.floor(a.sampleRate*dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for(let i = 0; i < n; i++) d[i] = (Math.random()*2 - 1) * (1 - i/n);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = corte; g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start(t);
}
const SONS = {
  moeda: {tarefa(){ tom(988, 0, .09, 'square', .05); tom(1319, .08, .4, 'square', .05); },
          festa(){ [523, 659, 784, 1047, 1319].forEach((f, i) => tom(f, i*.08, .3, 'square', .045)); }},
  golpe: {tarefa(){ ruido(0, .1, .5, 1600); tom(150, 0, .28, 'sine', .5, 45); },
          festa(){ ruido(0, .1, .5, 1600); tom(150, 0, .28, 'sine', .5, 45); ruido(.22, .14, .6, 2200); tom(110, .22, .45, 'sine', .6, 35); }},
  sino:  {tarefa(){ tom(880, 0, 1.8, 'sine', .14); tom(1760, 0, 1.1, 'sine', .04); tom(2640, 0, .6, 'sine', .02); },
          festa(){ [659, 880, 1319].forEach((f, i) => { tom(f, i*.35, 2.2, 'sine', .12); tom(f*2, i*.35, 1.2, 'sine', .035); }); }},
  fanfarra: {tarefa(){ tom(784, 0, .07, 'square', .04); tom(1175, .07, .07, 'square', .04); tom(1568, .14, .18, 'square', .04); },
             festa(){ [[523,0,.12],[523,.13,.12],[523,.26,.12],[659,.4,.35],[587,.78,.12],[659,.92,.12],[784,1.06,.6]].forEach(([f, t, d]) => { tom(f, t, d, 'square', .05); tom(f/2, t, d, 'triangle', .05); }); }},
};
const somOff = () => { try { return localStorage.getItem('hj-somoff') === '1'; } catch(e){ return false; } };
const toca = (k, ev) => { const s = SONS[k]; if(s && s[ev]) try { s[ev](); } catch(e){} };

/* ---------- interface usada pelo index.html ---------- */
window.HJ_FX = {
  EV: ['godspeed', 'baralho', 'jajanken'], FESTA: ['fogos'],
  aplica(){ ligaPoeira(temFx('estrelas') && !calmo()); },
  aba(){ if(!temFx('digita')) return; const r = document.documentElement; r.classList.add('hj-entra'); clearTimeout(this._aba); this._aba = setTimeout(() => r.classList.remove('hj-entra'), 900); },
  tarefa(r){
    if(UI.som && !somOff()) toca(UI.som, 'tarefa');
    if(UI.fxOff || calmo()) return;
    for(const f of this.EV) if(UI.fx.includes(f)) EV[f](r);
  },
  festa(){
    if(UI.som && !somOff()) toca(UI.som, 'festa');
    if(UI.fxOff || calmo()) return;
    if(UI.fx.includes('fogos')) EV.fogos();
  },
  /* ▶ na loja: mostra o efeito ou toca o som, comprado ou não */
  ver(id, r){
    const it = HJx.COS.find(i => i.id === id); if(!it) return;
    if(it.cat === 'som'){ toca(it.eq.som, 'tarefa'); setTimeout(() => toca(it.eq.som, 'festa'), 900); return; }
    if(EV[it.fx]) EV[it.fx](r);
  },
  somOff,
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-fxver]'); if(!b) return;
  HJ_FX.ver(b.dataset.fxver, b.getBoundingClientRect());
});
})();
