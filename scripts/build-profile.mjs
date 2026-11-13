// Genera los SVG pixel-art animados del perfil en ./assets
// Uso: node scripts/build-profile.mjs
// GitHub no permite CSS/JS en el README, así que todo el estilo vive dentro de
// SVG autocontenidos (sin fuentes ni recursos externos): el texto se dibuja
// píxel a píxel con la fuente bitmap de abajo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const W = 840;

// ───────────────────────── Contenido editable ─────────────────────────
const PROFILE = {
  name: 'CFBONILLA',
  playerClass: 'DEV FULL STACK',
  status: 'EN LINEA',
  dialog: ['HOLA, VIAJERO. BIENVENIDO A MI PERFIL.', 'EXPLORA MIS MISIONES Y PULSA START.'],
  inventory: [
    ['NODE', 'NODE.JS'],
    ['EXP', 'EXPRESS'],
    ['SQL', 'SQLITE'],
    ['HTML', 'HTML5'],
    ['CSS', 'CSS3'],
    ['JS', 'VANILLA'],
  ],
  quest: {
    title: 'EVENTO-ENTRADAS',
    desc: 'SISTEMA DE ENTRADAS PARA EVENTOS CON CODIGO UNICO Y QR',
    tags: 'NODE.JS + EXPRESS + SQLITE',
  },
};

// ───────────────────────── Paleta ─────────────────────────
const C = {
  bg0: '#04050d', bg1: '#080c1f', bg2: '#0d1533', line: '#16224f',
  deep: '#1b3bff', blue: '#2d7dff', cyan: '#00e5ff', ice: '#d6f7ff',
  violet: '#7b5cff', dim: '#4a63a8', mute: '#8fa8e0',
};

// ───────────────────────── Fuente bitmap 5x7 ─────────────────────────
const F = (s) => s.split(' ');
const FONT = {
  A: F('01110 10001 10001 11111 10001 10001 10001'), B: F('11110 10001 10001 11110 10001 10001 11110'),
  C: F('01110 10001 10000 10000 10000 10001 01110'), D: F('11110 10001 10001 10001 10001 10001 11110'),
  E: F('11111 10000 10000 11110 10000 10000 11111'), F: F('11111 10000 10000 11110 10000 10000 10000'),
  G: F('01110 10001 10000 10111 10001 10001 01111'), H: F('10001 10001 10001 11111 10001 10001 10001'),
  I: F('01110 00100 00100 00100 00100 00100 01110'), J: F('00111 00010 00010 00010 00010 10010 01100'),
  K: F('10001 10010 10100 11000 10100 10010 10001'), L: F('10000 10000 10000 10000 10000 10000 11111'),
  M: F('10001 11011 10101 10101 10001 10001 10001'), N: F('10001 11001 10101 10011 10001 10001 10001'),
  O: F('01110 10001 10001 10001 10001 10001 01110'), P: F('11110 10001 10001 11110 10000 10000 10000'),
  Q: F('01110 10001 10001 10001 10101 10010 01101'), R: F('11110 10001 10001 11110 10100 10010 10001'),
  S: F('01111 10000 10000 01110 00001 00001 11110'), T: F('11111 00100 00100 00100 00100 00100 00100'),
  U: F('10001 10001 10001 10001 10001 10001 01110'), V: F('10001 10001 10001 10001 10001 01010 00100'),
  W: F('10001 10001 10001 10101 10101 11011 10001'), X: F('10001 10001 01010 00100 01010 10001 10001'),
  Y: F('10001 10001 01010 00100 00100 00100 00100'), Z: F('11111 00001 00010 00100 01000 10000 11111'),
  0: F('01110 10001 10011 10101 11001 10001 01110'), 1: F('00100 01100 00100 00100 00100 00100 01110'),
  2: F('01110 10001 00001 00110 01000 10000 11111'), 3: F('11110 00001 00001 01110 00001 00001 11110'),
  4: F('00010 00110 01010 10010 11111 00010 00010'), 5: F('11111 10000 11110 00001 00001 10001 01110'),
  6: F('00110 01000 10000 11110 10001 10001 01110'), 7: F('11111 00001 00010 00100 01000 01000 01000'),
  8: F('01110 10001 10001 01110 10001 10001 01110'), 9: F('01110 10001 10001 01111 00001 00010 01100'),
  '.': F('00000 00000 00000 00000 00000 01100 01100'), ',': F('00000 00000 00000 00000 01100 00100 01000'),
  ':': F('00000 01100 01100 00000 01100 01100 00000'), '-': F('00000 00000 00000 11111 00000 00000 00000'),
  '!': F('00100 00100 00100 00100 00100 00000 00100'), '?': F('01110 10001 00001 00010 00100 00000 00100'),
  '/': F('00001 00001 00010 00100 01000 10000 10000'), '>': F('01000 00100 00010 00001 00010 00100 01000'),
  '+': F('00000 00100 00100 11111 00100 00100 00000'), '_': F('00000 00000 00000 00000 00000 00000 11111'),
  '%': F('11001 11010 00010 00100 01000 01011 10011'),
  '^': F('00000 01010 11111 11111 01110 00100 00000'), // corazón
  '@': F('00100 00100 11111 01110 01110 01010 10001'), // estrella
  '|': F('10000 11000 11100 11110 11100 11000 10000'), // play
  '~': F('00000 00000 11111 01110 00100 00000 00000'), // flecha abajo
};

const tw = (str, s) => (str.length * 6 - 1) * s;

function text(str, x, y, s, fill, extra = '') {
  let d = '';
  [...str].forEach((ch, i) => {
    if (ch === ' ') return;
    const g = FONT[ch];
    if (!g) throw new Error(`Glifo no definido: "${ch}"`);
    g.forEach((row, r) => {
      let c = 0;
      while (c < 5) {
        if (row[c] !== '1') { c++; continue; }
        let e = c;
        while (e < 5 && row[e] === '1') e++;
        d += `M${x + (i * 6 + c) * s} ${y + r * s}h${(e - c) * s}v${s}h${-(e - c) * s}z`;
        c = e;
      }
    });
  });
  return `<path d="${d}" fill="${fill}" ${extra}/>`;
}
const textC = (str, cx, y, s, fill, extra) => text(str, Math.round((cx - tw(str, s) / 2) / 2) * 2, y, s, fill, extra);
const textR = (str, rx, y, s, fill, extra) => text(str, rx - tw(str, s), y, s, fill, extra);

// ───────────────────────── Sprites ─────────────────────────
const HERO_PAL = { k: '#02030a', w: C.ice, c: C.cyan, b: C.blue, d: '#1a3fb0', v: C.violet };
const HERO_TOP = [
  '....kkkkk...',
  '...kwwwwwk..',
  '..kwwwwwwwk.',
  '..kwkkkkkwk.',
  '..kwkccckwk.',
  '..kwkcwckwk.',
  '..kwkkkkkwk.',
  '...kwwwwwk..',
  '..kkbbbbbkk.',
  '.kbkbbcbbkbk',
  '.kbkbbbbbkbk',
  '..kkbbbbbkk.',
];
const HERO_A = [...HERO_TOP, '...kdk.kdk..', '...kkk.kkk..'];
const HERO_B = [...HERO_TOP, '..kdk...kdk.', '..kkk...kkk.'];

function sprite(rows, pal, x, y, s) {
  const by = {};
  rows.forEach((row, r) => {
    if (row.length !== rows[0].length) throw new Error('Sprite con filas desiguales');
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      by[ch] = (by[ch] || '') + `M${x + c * s} ${y + r * s}h${s}v${s}h${-s}z`;
    });
  });
  return Object.entries(by).map(([ch, d]) => `<path d="${d}" fill="${pal[ch]}"/>`).join('');
}

// ───────────────────────── Utilidades ─────────────────────────
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let clipN = 0;
const clip = (x, y, w, h, content) => {
  const id = `c${++clipN}`;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})">${content}</g>`;
};
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const notched = (x, y, w, h, n) =>
  `M${x + n} ${y}H${x + w - n}V${y + n}H${x + w}V${y + h - n}H${x + w - n}V${y + h}H${x + n}V${y + h - n}H${x}V${y + n}H${x + n}Z`;

const BASE_CSS = `
.blink{animation:blink 1s steps(1) infinite}
.blink2{animation:blink 1.6s steps(1) .4s infinite}
@keyframes blink{50%{opacity:0}}
.t1{animation:tw 2.3s steps(1) infinite}.t2{animation:tw 3.1s steps(1) .7s infinite}
.t3{animation:tw 4.3s steps(1) 1.3s infinite}.t4{animation:tw 5.7s steps(1) 2.1s infinite}
@keyframes tw{0%{opacity:1}60%{opacity:.25}80%{opacity:1}}
.pulse{animation:pulse 3s ease-in-out infinite}
@keyframes pulse{50%{opacity:.45}}
.f1{animation:fa .36s steps(1) infinite}.f2{animation:fb .36s steps(1) infinite}
@keyframes fa{0%{opacity:1}50%{opacity:0}}
@keyframes fb{0%{opacity:0}50%{opacity:1}}
.bob{animation:bob 1s steps(1) infinite}
@keyframes bob{50%{transform:translateY(-4px)}}
`;
const REDUCED = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

const DEFS = `
<filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".22"/></pattern>
<linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1"><stop offset=".43" stop-color="#f1fdff"/><stop offset=".43" stop-color="${C.cyan}"/><stop offset=".86" stop-color="${C.cyan}"/><stop offset=".86" stop-color="${C.blue}"/></linearGradient>`;

function svg(h, body, { css = '', label, notch = 8 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" shape-rendering="crispEdges" role="img" aria-label="${label}">
<title>${label}</title>
<style>${BASE_CSS}${css}${REDUCED}</style>
<defs>${DEFS}<clipPath id="cut"><path d="${notched(0, 0, W, h, notch)}"/></clipPath></defs>
<g clip-path="url(#cut)">${body}</g>
</svg>
`;
}

function stars(rand, n, maxY, minY = 0) {
  let out = '';
  const cols = [C.ice, C.ice, C.cyan, C.blue, C.mute];
  for (let i = 0; i < n; i++) {
    const s = rand() < 0.2 ? 4 : 2;
    const x = Math.floor((rand() * (W - 8)) / 2) * 2;
    const y = minY + Math.floor((rand() * (maxY - minY)) / 2) * 2;
    const cls = rand() < 0.6 ? ` class="t${1 + Math.floor(rand() * 4)}"` : '';
    out += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${cols[Math.floor(rand() * cols.length)]}"${cls}/>`;
  }
  return out;
}

// Ventana tipo RPG con pestaña de título
function panel(y, h, title) {
  const x = 4, w = W - 8;
  let out = `<path d="${notched(x, y, w, h, 4)}" fill="${C.bg1}"/>`;
  out += `<path fill-rule="evenodd" d="${notched(x, y, w, h, 4)}${notched(x + 4, y + 4, w - 8, h - 8, 4)}" fill="${C.cyan}"/>`;
  out += `<path fill-rule="evenodd" d="${notched(x + 8, y + 8, w - 16, h - 16, 2)}${notched(x + 10, y + 10, w - 20, h - 20, 2)}" fill="${C.line}"/>`;
  if (title) {
    const tw_ = tw(title, 3);
    out += `<path d="${notched(28, y - 14, tw_ + 52, 34, 4)}" fill="${C.cyan}"/>`;
    out += `<path d="${notched(32, y - 10, tw_ + 44, 26, 2)}" fill="${C.bg0}"/>`;
    out += text('|', 42, y - 4, 2, C.cyan, 'class="blink"');
    out += text(title, 60, y - 8, 3, C.ice);
  }
  return out;
}

// ───────────────────────── Banner ─────────────────────────
function skyline(seed, { minH, maxH, minW, maxW, body, edge, win, winLit, blinkCol, ground }) {
  const rand = rng(seed);
  let out = '';
  let x = 0;
  while (x < W) {
    let w = minW + Math.floor((rand() * (maxW - minW)) / 8) * 8;
    if (W - (x + w) < minW) w = W - x;
    const h = minH + Math.floor((rand() * (maxH - minH)) / 8) * 8;
    const y = ground - h;
    out += rect(x, y, w, h, body);
    if (edge) out += rect(x, y, w, 2, edge) + rect(x, y, 2, h, edge, 'opacity=".5"');
    if (rand() < 0.35 && w >= 32) { // antena
      const ax = x + Math.floor(w / 16) * 8;
      out += rect(ax, y - 16, 2, 16, edge || body) + rect(ax - 2, y - 20, 6, 4, blinkCol, 'class="blink2"');
    }
    for (let wy = y + 8; wy < ground - 8; wy += 8) {
      for (let wx = x + 6; wx <= x + w - 10; wx += 8) {
        const r = rand();
        if (r < winLit) {
          const cls = rand() < 0.18 ? ` class="t${1 + Math.floor(rand() * 4)}"` : '';
          out += `<rect x="${wx}" y="${wy}" width="4" height="4" fill="${win[Math.floor(rand() * win.length)]}"${cls}/>`;
        }
      }
    }
    x += w;
  }
  return `<g>${out}</g><g transform="translate(${W} 0)">${out}</g>`;
}

function banner() {
  const H = 320, G = 276;
  const rand = rng(7);
  let b = '';
  // cielo en bandas
  b += rect(0, 0, W, H, C.bg0);
  [[96, '#050818'], [150, '#070c22'], [196, '#0a1230'], [232, '#0e1a44'], [256, '#13245c']].forEach(([y, col]) => (b += rect(0, y, W, G - y, col)));
  b += stars(rand, 110, 210);
  // luna
  const moon = [];
  for (let r = -9; r <= 9; r++) {
    let row = '';
    for (let c = -9; c <= 9; c++) {
      const d = Math.hypot(c, r);
      const crater = Math.hypot(c + 3, r + 2) < 2.2 || Math.hypot(c - 4, r - 4) < 1.8 || Math.hypot(c - 2, r + 5) < 1.2;
      row += d > 9.3 ? '.' : crater ? 'c' : c + r > 7 ? 's' : 'm';
    }
    moon.push(row);
  }
  b += `<circle cx="718" cy="92" r="44" fill="${C.cyan}" opacity=".35" filter="url(#glow)" class="pulse"/>`;
  b += sprite(moon, { m: '#cdf6ff', s: '#8fdcf5', c: '#6cc4e6' }, 680, 54, 4);
  // estrella fugaz
  b += `<g class="shoot"><path d="M0 0h6v2h-6zM-10 4h10v2h-10zM-24 8h14v2h-14z" fill="${C.ice}" transform="scale(-1 1)"/></g>`;
  // ciudad
  b += `<g class="far">${skyline(11, { minH: 48, maxH: 132, minW: 32, maxW: 72, body: '#0b1638', win: ['#1d3a8a', '#24479f'], winLit: 0.3, blinkCol: C.blue, ground: G })}</g>`;
  b += `<g class="near">${skyline(42, { minH: 24, maxH: 92, minW: 40, maxW: 96, body: '#060a1c', edge: '#1f4fd0', win: [C.cyan, C.blue, C.cyan, '#9defff'], winLit: 0.26, blinkCol: C.cyan, ground: G })}</g>`;
  // suelo
  b += rect(0, G, W, H - G, C.bg0);
  b += rect(0, G, W, 12, C.cyan, 'opacity=".5" filter="url(#glow)"');
  b += rect(0, G, W, 4, C.cyan);
  b += rect(0, G + 4, W, 2, C.deep);
  let dashes = '';
  for (let x = 0; x < W * 2; x += 56) dashes += rect(x, G + 18, 28, 4, C.blue) + rect(x + 28, G + 32, 16, 2, C.line);
  b += `<g class="road">${dashes}</g>`;
  // héroe corriendo
  const hy = G - 14 * 4;
  b += `<g class="f1">${sprite(HERO_A, HERO_PAL, 120, hy, 4)}</g><g class="f2" opacity="0">${sprite(HERO_B, HERO_PAL, 120, hy - 4, 4)}</g>`;
  // título
  const title = PROFILE.name, ts = 8, tx = Math.round((W - tw(title, ts)) / 2), ty = 62;
  b += text(title, tx, ty, ts, C.cyan, 'filter="url(#glow)" class="pulse"');
  b += text(title, tx + 6, ty + 6, ts, C.deep);
  b += text(title, tx, ty, ts, 'url(#chrome)');
  b += `<g class="blink">${textC('| PRESS START', W / 2, 136, 3, C.ice, 'filter="url(#soft)"')}</g>`;
  // HUD
  b += text('SCORE 004200', 24, 18, 2, C.cyan);
  b += textC('STAGE 01 - GITHUB', W / 2, 18, 2, C.mute);
  b += textR('^^^', W - 24, 18, 2, C.cyan);
  b += rect(0, 0, W, H, 'url(#scan)');
  b += `<path fill-rule="evenodd" d="${notched(0, 0, W, H, 8)}${notched(4, 4, W - 8, H - 8, 8)}" fill="${C.line}"/>`;
  const css = `
.far{animation:scroll 80s linear infinite}.near{animation:scroll 36s linear infinite}
.road{animation:scroll 5s linear infinite}
@keyframes scroll{to{transform:translateX(-${W}px)}}
.shoot{animation:shoot 9s linear infinite;opacity:0}
@keyframes shoot{0%{transform:translate(560px,10px);opacity:0}2%{opacity:1}12%{transform:translate(360px,110px);opacity:0}100%{transform:translate(360px,110px);opacity:0}}`;
  return svg(H, b, { css, label: `${PROFILE.name} - press start` });
}

// ───────────────────────── Diálogo ─────────────────────────
function dialog() {
  const H = 124;
  const [l1, l2] = PROFILE.dialog;
  const w1 = tw(l1, 3) + 6, w2 = tw(l2, 3) + 6;
  let b = panel(14, 106);
  b += text('>', 30, 38, 3, C.cyan) + text(l1, 56, 38, 3, C.ice);
  b += text('>', 30, 74, 3, C.cyan) + text(l2, 56, 74, 3, C.ice);
  // cortinas que se retiran letra a letra (efecto máquina de escribir)
  b += clip(54, 34, w1, 30, rect(54, 34, w1, 30, C.bg1, `class="ty1" transform="translate(${w1} 0)"`));
  b += clip(54, 70, w2, 30, rect(54, 70, w2, 30, C.bg1, `class="ty2" transform="translate(${w2} 0)"`));
  b += text('~', W - 62, 92, 3, C.cyan, 'class="blink"');
  const css = `
.ty1{animation:ty1 14s steps(${l1.length}) infinite}.ty2{animation:ty2 14s steps(${l2.length}) infinite}
@keyframes ty1{0%{transform:translateX(0)}18%,100%{transform:translateX(${w1}px)}}
@keyframes ty2{0%,20%{transform:translateX(0)}38%,100%{transform:translateX(${w2}px)}}`;
  return svg(H, b, { css, label: PROFILE.dialog.join(' '), notch: 0 });
}

// ───────────────────────── Ficha del jugador ─────────────────────────
function player() {
  const H = 254;
  let b = panel(14, 236, 'JUGADOR');
  // avatar
  b += `<path d="${notched(32, 48, 152, 172, 4)}" fill="${C.bg2}"/>`;
  b += `<path fill-rule="evenodd" d="${notched(32, 48, 152, 172, 4)}${notched(36, 52, 144, 164, 4)}" fill="${C.blue}"/>`;
  b += stars(rng(3), 14, 150, 60).replace(/x="(\d+)"/g, (m, x) => `x="${44 + (x % 124)}"`);
  b += `<ellipse cx="108" cy="204" rx="40" ry="5" fill="${C.cyan}" opacity=".35" filter="url(#glow)"/>`;
  b += `<g class="bob">${sprite(HERO_A, HERO_PAL, 48, 64, 10)}</g>`;
  // datos
  const lx = 216, vx = 380;
  [['JUGADOR', PROFILE.name, C.cyan], ['CLASE', PROFILE.playerClass, C.ice], ['ESTADO', PROFILE.status, C.ice]].forEach(([k, v, col], i) => {
    const y = 50 + i * 32;
    b += text(k, lx, y, 3, C.dim) + text(v, vx, y, 3, col);
  });
  b += rect(vx + tw(PROFILE.status, 3) + 14, 50 + 64 + 4, 12, 12, C.cyan, 'class="blink" filter="url(#soft)"');
  // barras
  const bars = [['HP', 30, C.cyan, '100/100'], ['CAFE', 24, C.blue, '80%'], ['XP', 30, C.violet, null]];
  bars.forEach(([k, n, col, val], i) => {
    const y = 156 + i * 26, bx = 292, bw = 362;
    b += text(k, lx, y, 2, C.mute);
    b += rect(bx - 4, y - 4, bw + 6, 22, C.line) + rect(bx - 2, y - 2, bw + 2, 18, C.bg0);
    let segs = '';
    for (let s = 0; s < 30; s++) segs += rect(bx + s * 12, y, 10, 14, s < n ? col : '#0f1a3d');
    b += segs;
    if (k === 'XP') {
      b += clip(bx, y, 360, 14, rect(bx, y, 360, 14, C.bg0, 'class="xp" transform="translate(360 0)"'));
      b += text('LEVEL UP!', 670, y, 2, C.ice, 'class="lvl" opacity="0" filter="url(#soft)"');
    } else {
      b += clip(bx, y, n * 12, 14, rect(bx, y, n * 12, 14, C.bg0, `class="fill" transform="translate(${n * 12} 0)"`));
      b += text(val, 670, y, 2, C.mute);
    }
  });
  const css = `
.fill{animation:fill 2s steps(24) both}
@keyframes fill{from{transform:translateX(0)}}
.xp{animation:xp 9s steps(30) infinite}
@keyframes xp{0%{transform:translateX(0)}80%,100%{transform:translateX(360px)}}
.lvl{animation:lvl 9s steps(1) infinite}
@keyframes lvl{0%,79%{opacity:0}80%,86%,92%{opacity:1}83%,89%,97%{opacity:0}}`;
  return svg(H, b, { css, label: `Jugador: ${PROFILE.name}. Clase: ${PROFILE.playerClass}. Estado: ${PROFILE.status}.`, notch: 0 });
}

// ───────────────────────── Inventario ─────────────────────────
function inventory() {
  const H = 204, S = 88, GAP = 10, N = 8;
  const x0 = Math.round((W - (N * S + (N - 1) * GAP)) / 4) * 2;
  const cols = [C.cyan, C.ice, C.blue, C.cyan, C.violet, C.ice];
  let b = panel(14, 186, 'INVENTARIO');
  for (let i = 0; i < N; i++) {
    const x = x0 + i * (S + GAP), y = 50, item = PROFILE.inventory[i];
    b += `<path d="${notched(x, y, S, S, 4)}" fill="${item ? C.bg2 : C.bg0}"/>`;
    b += `<path fill-rule="evenodd" d="${notched(x, y, S, S, 4)}${notched(x + 4, y + 4, S - 8, S - 8, 2)}" fill="${item ? C.blue : C.line}"/>`;
    if (item) {
      const s = item[0].length <= 2 ? 5 : item[0].length === 3 ? 4 : 3;
      b += textC(item[0], x + S / 2 + 2, y + S / 2 - (7 * s) / 2 + 3, s, C.deep);
      b += textC(item[0], x + S / 2, y + S / 2 - (7 * s) / 2 + 1, s, cols[i % cols.length]);
      b += textC(item[1], x + S / 2, y + S + 12, 2, C.mute);
    } else {
      b += textC('?', x + S / 2, y + S / 2 - 10, 3, C.line);
      b += textC('- - -', x + S / 2, y + S + 12, 2, C.line);
    }
  }
  // cursor de selección que salta entre objetos
  const n = PROFILE.inventory.length, c = 14, t = 4, x = x0 - 6, y = 44, q = S + 12;
  const corner = (cx, cy, dx, dy) => `M${cx} ${cy}h${dx * c}v${dy * t}h${-dx * (c - t)}v${dy * (c - t)}h${-dx * t}z`;
  b += `<g class="sel"><path class="blink" fill="${C.ice}" filter="url(#soft)" d="${corner(x, y, 1, 1)}${corner(x + q, y, -1, 1)}${corner(x, y + q, 1, -1)}${corner(x + q, y + q, -1, -1)}"/></g>`;
  let kf = '';
  for (let i = 0; i < n; i++) kf += `${((i * 100) / n).toFixed(2)}%{transform:translateX(${i * (S + GAP)}px)}`;
  const css = `.sel{animation:sel ${n * 1.5}s steps(1) infinite}@keyframes sel{${kf}}`;
  return svg(H, b, { css, label: `Inventario: ${PROFILE.inventory.map((i) => i[1]).join(', ')}`, notch: 0 });
}

// ───────────────────────── Misiones ─────────────────────────
function quests() {
  const H = 246, q = PROFILE.quest;
  let b = panel(14, 228, 'MISIONES');
  const row = (y, h, active) => {
    let o = `<path d="${notched(24, y, 792, h, 4)}" fill="${active ? C.bg2 : C.bg0}"/>`;
    o += `<path fill-rule="evenodd" d="${notched(24, y, 792, h, 4)}${notched(26, y + 2, 788, h - 4, 2)}" fill="${active ? C.blue : C.line}"/>`;
    return o;
  };
  b += row(46, 88, true);
  b += `<path d="${notched(36, 64, 36, 52, 4)}" fill="${C.cyan}" filter="url(#soft)"/>`;
  b += text('!', 42, 73, 5, C.bg0, 'class="blink2" transform="translate(-1 0)"');
  b += text(q.title, 88, 58, 3, C.cyan);
  b += text(q.desc, 88, 90, 2, C.ice);
  b += text(q.tags, 88, 112, 2, C.blue);
  b += textR('@ COMPLETADA', 800, 60, 2, C.ice, 'filter="url(#soft)"');
  b += textR('| CLIC PARA ENTRAR', 800, 112, 2, C.cyan, 'class="blink"');
  [[142, '??? - MISION BLOQUEADA'], [190, '??? - PROXIMAMENTE']].forEach(([y, label]) => {
    b += row(y, 40, false);
    b += text('?', 48, y + 10, 3, C.dim) + text(label, 88, y + 13, 2, C.dim);
    b += textR('LV ??', 800, y + 13, 2, C.line);
  });
  return svg(H, b, { label: `Misiones. ${q.title}: ${q.desc} (${q.tags}). Completada.`, notch: 0 });
}

// ───────────────────────── Divisor y pie ─────────────────────────
function divider() {
  const H = 20;
  let b = '';
  for (let x = 12, i = 0; x < W - 12; x += 16, i++) {
    const mid = Math.abs(x - W / 2) < 40;
    if (mid) continue;
    b += rect(x, 8, 8, 4, i % 2 ? C.blue : C.cyan, `class="t${1 + (i % 4)}"`);
  }
  b += `<g class="pulse">${rect(W / 2 - 2, 2, 4, 4, C.cyan)}${rect(W / 2 - 6, 6, 12, 4, C.cyan)}${rect(W / 2 - 10, 10, 20, 0, C.cyan)}${rect(W / 2 - 6, 10, 12, 4, C.ice)}${rect(W / 2 - 2, 14, 4, 4, C.cyan)}</g>`;
  return svg(H, b, { label: 'divisor', notch: 0 });
}

function footer() {
  const H = 150, G = 122;
  let b = rect(0, 0, W, H, C.bg0);
  b += rect(0, 60, W, G - 60, '#070c22') + rect(0, 96, W, G - 96, '#0c173c');
  b += stars(rng(99), 46, 100);
  b += rect(0, G, W, 10, C.cyan, 'opacity=".5" filter="url(#glow)"') + rect(0, G, W, 4, C.cyan) + rect(0, G + 4, W, 2, C.deep);
  let dashes = '';
  for (let x = 0; x < W * 2; x += 56) dashes += rect(x, G + 14, 28, 4, C.blue);
  b += `<g class="road">${dashes}</g>`;
  b += `<g class="bob">${sprite(HERO_A, HERO_PAL, 60, G - 42, 3)}</g>`;
  const t = 'GRACIAS POR JUGAR';
  b += textC(t, W / 2, 28, 5, C.cyan, 'filter="url(#glow)" class="pulse"');
  b += textC(t, W / 2 + 4, 32, 5, C.deep) + textC(t, W / 2, 28, 5, 'url(#chrome)');
  b += `<g class="blink">${textC('INSERT COIN TO CONTINUE', W / 2, 84, 2, C.ice)}</g>`;
  b += rect(0, 0, W, H, 'url(#scan)');
  b += `<path fill-rule="evenodd" d="${notched(0, 0, W, H, 8)}${notched(4, 4, W - 8, H - 8, 8)}" fill="${C.line}"/>`;
  const css = `.road{animation:scroll 5s linear infinite}@keyframes scroll{to{transform:translateX(-${W}px)}}`;
  return svg(H, b, { css, label: 'Gracias por jugar - insert coin to continue' });
}

// ───────────────────────── Salida ─────────────────────────
fs.mkdirSync(OUT, { recursive: true });
const files = { banner, dialog, player, inventory, quests, divider, footer };
for (const [name, fn] of Object.entries(files)) {
  const out = fn();
  fs.writeFileSync(path.join(OUT, `${name}.svg`), out);
  console.log(`${name}.svg  ${(out.length / 1024).toFixed(1)} KB`);
}
