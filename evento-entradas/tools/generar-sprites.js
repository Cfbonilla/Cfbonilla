// Genera los personajes pixel art (SVG) de public/sprites/ a partir de dibujos de texto.
// Cada letra es un color; "." es transparente. Para editar un personaje, cambia su dibujo
// y ejecuta:  node tools/generar-sprites.js
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'public', 'sprites');

const BASE = {
  K: '#1b1b1f', // contorno
  W: '#ffffff', // blanco (nieve, pompón)
  w: '#dfe7f2', // sombra de la nieve
  H: '#e3263b', // gorro navideño
  h: '#a5162a', // sombra del gorro
};

const SKINS = { s1: ['#f6cfa8', '#dca57f'], s2: ['#c68a5c', '#a06a40'], s3: ['#8d5a37', '#6c4026'] };

// ---------- Dibujos ----------
const TREE = [
  '.......YY.......',
  '......YYYY......',
  '.......YY.......',
  '.......GG.......',
  '......GGgG......',
  '.....GGRGgG.....',
  '....GGGGGGBg....',
  '.....GGGGGg.....',
  '....GGBGGGGg....',
  '...GGGGGGRGgg...',
  '..GGGYGGGGGGgg..',
  '....GGGGGGGg....',
  '...GGGGGGBGGg...',
  '..GGRGGGGGGYgg..',
  '.GGGGGGBGGGGGgg.',
  'GGGYGGGGGRGGGGgg',
  '......TTTt......',
  '......TTTt......',
  '....wWWWWWWWw...',
];
const TREE_COLORS = { G: '#2fa84f', g: '#1d7a37', Y: '#ffd23f', R: '#ff4d6d', B: '#3fa9ff', T: '#8b5a2b', t: '#5e3b1a' };

const PERSON = [
  '.......WW...',
  '......HWW...',
  '.....HHh....',
  '....HHHHh...',
  '...HHHHHHh..',
  '..WWWWWWWW..',
  '..AASSSSAA..',
  '..ASKSSKSA..',
  '..SSSSSSSS..',
  '...SSMMSS...',
  '....SSSS....',
  '..CCCCCCCC..',
  '.CCCCDCCCCC.',
  '.SCCCDCCCCS.',
  '.SCCCDCCCCS.',
  '..PPPPPPPP..',
  '..PP....PP..',
  '..PP....PP..',
  '.KKK....KKK.',
];

const ELEPHANT = [
  '...............WW......',
  '.............HHWW......',
  '............HHHh.......',
  '...........WWWWWW......',
  '......EEEEEEEEEEEE.....',
  '....EEEEEEEEEeeeEEE....',
  '...EEEEEEEEEEeeeeEEE...',
  '..EEEEEEEEEEEeeeeEKEE..',
  '..EEEEEEEEEEEeeeeEEEE..',
  'eEEEEEEEEEEEEeeeEEEEEE.',
  'e.EEEEEEEEEEEEEEEEWEEE.',
  '..EEEEEEEEEEEEEEE.W.EE.',
  '..EEEEEEEEEEEEEEE...EE.',
  '..EEEE.EEEE.EEEE....EE.',
  '..EEEE.EEEE.EEEE...EE..',
  '..EEEE.EEEE.EEEE.......',
  '..eeee.eeee.eeee.......',
];

const GIFT = [
  '...Y..Y...',
  '....YY....',
  'RRRRYYRRRR',
  'RRRRYYRRRR',
  'rrrrYYrrrr',
  'RRRRYYRRRR',
  'RRRRYYRRRR',
  'RRRRYYRRRR',
  'rrrrYYrrrr',
];
const SNOWFLAKE = [
  '..W..',
  'W.W.W',
  '.WWW.',
  'W.W.W',
  '..W..',
];

// Tira de luces navideñas (se repite horizontalmente bajo el encabezado).
const LIGHTS = [
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
  '..K.......K.......K.......K.....',
  '.RRR.....GGG.....YYY.....BBB....',
  'RRrRR...GGgGG...YYyYY...BBbBB...',
  'RRRRR...GGGGG...YYYYY...BBBBB...',
  '.RRR.....GGG.....YYY.....BBB....',
];
const LIGHTS_COLORS = { R: '#ff3b5c', r: '#ffc2cd', G: '#3ddc84', g: '#c8ffd9', Y: '#ffd23f', y: '#fff3c2', B: '#3fa9ff', b: '#cfe9ff' };

// ---------- Variantes ----------
const people = [
  { name: 'persona-1', C: '#2f7bff', D: '#1f56b8', P: '#2b2b44', A: '#4a2c17', skin: 's1' },
  { name: 'persona-2', C: '#2fb36b', D: '#1f7e4b', P: '#3b2a1e', A: '#1b1b1f', skin: 's2' },
  { name: 'persona-3', C: '#9b4dff', D: '#6b2fbf', P: '#23233a', A: '#e0a23a', skin: 's1' },
  { name: 'persona-4', C: '#ff8a1f', D: '#c4610a', P: '#2b2b44', A: '#2a170b', skin: 's3' },
];
const elephants = [
  { name: 'elefante-1', E: '#8fa6c8', e: '#6b82a6' },
  { name: 'elefante-2', E: '#ff9ec7', e: '#e0709f' },
];

// ---------- Generación ----------
function toSvg(grid, colors) {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  let rects = '';
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      if (c !== '.' && colors[c]) rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${colors[c]}"/>`;
      else if (c !== '.') throw new Error(`Color sin definir: "${c}"`);
      x += run;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}" shape-rendering="crispEdges">${rects}</svg>\n`;
}

fs.mkdirSync(OUT, { recursive: true });
const write = (name, grid, colors) => fs.writeFileSync(path.join(OUT, `${name}.svg`), toSvg(grid, { ...BASE, ...colors }));

write('arbol', TREE, TREE_COLORS);
write('regalo', GIFT, { R: '#e3263b', r: '#a5162a', Y: '#ffd23f' });
write('copo', SNOWFLAKE, {});
write('luces', LIGHTS, LIGHTS_COLORS);
for (const p of people) {
  const [S, s] = SKINS[p.skin];
  write(p.name, PERSON, { C: p.C, D: p.D, P: p.P, A: p.A, S, s, M: '#d9536f' });
}
for (const e of elephants) write(e.name, ELEPHANT, { E: e.E, e: e.e });
console.log('Sprites generados en', OUT);
