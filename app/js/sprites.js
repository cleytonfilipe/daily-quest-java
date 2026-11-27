// Pixel art original desenhada a partir de mapas de caracteres e renderizada em SVG.

export const SKIN_TONES = ['#f7d7b5', '#e8b48a', '#c68642', '#8d5524', '#5c3a21'];
export const HAIR_COLORS = ['#2b1d14', '#6b3e1f', '#c98b3a', '#f2d16b', '#c83c2c', '#e8e8f0', '#3b5dc9', '#38b764', '#b13e9b'];
export const OUTFIT_COLORS = ['#3b5dc9', '#b13e53', '#38b764', '#7b3fa0', '#ef7d57', '#257179', '#566c86', '#e060a0', '#29366f'];

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Converte um mapa (lista de strings) em retângulos SVG, unindo pixels vizinhos da mesma cor.
function rects(map, pal) {
  let out = '';
  map.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === '.' || !pal[c]) { x++; continue; }
      let w = 1;
      while (row[x + w] === c) w++;
      out += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${pal[c]}"/>`;
      x += w;
    }
  });
  return out;
}

export function svg(map, pal, size, cls = '') {
  const w = map[0].length, h = map.length;
  return `<svg class="px ${cls}" viewBox="0 0 ${w} ${h}" width="${size}" height="${Math.round(size * h / w)}" shape-rendering="crispEdges" aria-hidden="true">${rects(map, pal)}</svg>`;
}

const HERO = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohssssssho...',
  '...osesssseso...',
  '...osssssssso...',
  '....osssmsso....',
  '.....oddddo.....',
  '...oddccccddo...',
  '..osccccccccso..',
  '..os.llllll.so..',
  '...occcccccco...',
  '....occoocco....',
  '....oddooddo....',
  '...obbboobbbo...',
  '...oooooooooo...',
];

// Equipamentos de cada classe, sobrepostos ao herói: [x, y, cor]
const GEAR = {
  sword: [
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((y) => [14, y, 'w']), [15, 2, 'W'], [15, 3, 'W'],
    [13, 9, 'g'], [14, 9, 'g'], [15, 9, 'g'], [14, 10, 'k'], [14, 11, 'g'],
  ],
  staff: [
    ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((y) => [14, y, 'k']),
    [13, 1, 'p'], [14, 0, 'p'], [15, 1, 'p'], [14, 1, 'P'], [13, 2, 'p'], [14, 2, 'p'], [15, 2, 'p'],
  ],
  leaf: [
    ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((y) => [14, y, 'k']),
    [13, 1, 'L'], [14, 0, 'L'], [15, 1, 'L'], [14, 1, 'G'], [13, 2, 'G'], [15, 2, 'L'], [15, 3, 'G'], [13, 3, 'L'],
  ],
  bag: [
    [0, 9, 'k'], [1, 9, 'k'], [2, 9, 'k'],
    [0, 10, 'B'], [1, 10, 'y'], [2, 10, 'B'], [0, 11, 'B'], [1, 11, 'B'], [2, 11, 'B'], [0, 12, 'k'], [1, 12, 'k'], [2, 12, 'k'],
    [14, 6, 'y'], [15, 7, 'y'], [14, 8, 'y'],
  ],
};

export function heroSVG(look = {}, cls = 'guerreiro', size = 96, extra = '') {
  const skin = look.skin || SKIN_TONES[1];
  const hair = look.hair || HAIR_COLORS[0];
  const outfit = look.outfit || OUTFIT_COLORS[0];
  const map = HERO.map((r) => r.split(''));
  const weapon = { guerreiro: 'sword', mago: 'staff', druida: 'leaf', mercador: 'bag' }[cls] || 'sword';
  for (const [x, y, c] of GEAR[weapon]) map[y][x] = c;
  const pal = {
    o: '#14101e', h: hair, s: skin, e: '#14101e', m: shade(skin, -0.25), c: outfit, d: shade(outfit, -0.35),
    l: '#6b4226', b: '#4a2e1c', w: '#dfe6ee', W: '#ffffff', g: '#ffcd75', k: '#7a4a2a',
    p: '#b070ff', P: '#ffffff', L: '#38b764', G: '#a7f070', B: '#a0703c', y: '#ffcd75',
  };
  return svg(map.map((r) => r.join('')), pal, size, extra);
}

const BOSS = [
  '................',
  '..o..........o..',
  '..oho......oho..',
  '..ohooooooooho..',
  '...oaaaaaaaao...',
  '..oaaaaaaaaaao..',
  '..oaweaaaaweao..',
  '.oaaaaaaaaaaaao.',
  '.oaaaoxxxxoaaao.',
  'oaaaaaooooaaaaao',
  'oaaddaaaaaaddaao',
  'oaaaaaaaaaaaaaao',
  '.oaaaaaaaaaaaao.',
  '.oddaaddddaaddo.',
  '..oddo.oo.oddo..',
  '...oo......oo...',
];

export function bossSVG(color, size = 80, cls = '') {
  return svg(BOSS, { o: '#14101e', h: '#f4f4f4', a: color, d: shade(color, -0.35), w: '#ffffff', e: '#14101e', x: '#5d1a2a' }, size, cls);
}

const ICONS = {
  apple: [['....kgg.', '...k.g..', '.rrrkrr.', 'rrwrrrrr', 'rwrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rr.rr.'], { k: '#7a4a2a', g: '#38b764', r: '#d03c4c', w: '#ffb0b0' }],
  dumbbell: [['........', 'kk....kk', 'kKk..kKk', 'kKwwwwKk', 'kKwwwwKk', 'kKk..kKk', 'kk....kk', '........'], { k: '#333c57', K: '#566c86', w: '#94b0c2' }],
  briefcase: [['........', '..kkkk..', '..k..k..', 'bbbbbbbb', 'bBBBBBBb', 'bbbggbbb', 'bBBBBBBb', 'bbbbbbbb'], { k: '#4a2e1c', b: '#6b4226', B: '#8a5a32', g: '#ffcd75' }],
  coin: [['..oooo..', '.oyyyyo.', 'oyywyyyo', 'oywyyyyo', 'oyyyyyYo', 'oyyyyYYo', '.oyyYYo.', '..oooo..'], { o: '#a05a1c', y: '#ffcd75', w: '#fff4c0', Y: '#e0a040' }],
  moon: [['...yyy..', '..yy....', '.yy.....', '.yy.....', '.yy.....', '.yyy...y', '..yyyyy.', '...yyy..'], { y: '#c0b8ff' }],
  book: [['.bbbbbb.', '.bwwwwb.', '.bbbbbb.', '.bBBBBb.', '.bbyybb.', '.bBBBBb.', '.bbbbbb.', '.pppppp.'], { b: '#257179', B: '#3cc0c0', w: '#f4f4f4', y: '#ffcd75', p: '#f4f4f4' }],
  spark: [['...pp...', '...pp...', '.p.pp.p.', '..pppp..', 'pppPPppp', '..pppp..', '.p.pp.p.', '...pp...'], { p: '#c060e0', P: '#ffffff' }],
  chat: [['.cccccc.', 'cccccccc', 'ccwcwcwc', 'cccccccc', '.cccccc.', '..cc....', '.c......', '........'], { c: '#38b764', w: '#ffffff' }],
  heart: [['........', '.rr..rr.', 'rwrrrrrr', 'rrrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...'], { r: '#e04050', w: '#ffb0b0' }],
  star: [['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '.yyyyyy.', '.yy..yy.', 'yy....yy'], { y: '#41a6f6' }],
  fire: [['...r....', '...rr...', '..rrr.r.', '.rrorrr.', '.roooor.', 'rooyyoor', 'royyyyor', '.ryyyyr.'], { r: '#d03c2c', o: '#ef7d57', y: '#ffcd75' }],
  scroll: [['.kkkkkk.', 'kwwwwwwk', '.wkkkkw.', '.wwwwww.', '.wkkkkw.', '.wwwwww.', 'kwwwwwwk', '.kkkkkk.'], { k: '#7a4a2a', w: '#f2d99a' }],
  chest: [['........', '.kkkkkk.', 'kbbbbbbk', 'kbbbbbbk', 'kyyyyyyk', 'kbbyybbk', 'kbbbbbbk', 'kkkkkkkk'], { k: '#4a2e1c', b: '#8a5a32', y: '#ffcd75' }],
  trophy: [['.yyyyyy.', 'yyyyyyyy', 'y.yyyy.y', '.yyyyyy.', '..yyyy..', '...yy...', '..yyyy..', '.kkkkkk.'], { y: '#ffcd75', k: '#7a4a2a' }],
  potion: [['...kk...', '...ww...', '...ww...', '..wrrw..', '.wrrrrw.', '.wrWrrw.', '.wrrrrw.', '..wwww..'], { k: '#7a4a2a', w: '#94b0c2', r: '#e04050', W: '#ffffff' }],
  sword: [['......ww', '.....wWw', '....wWw.', 'g..wWw..', '.gwWw...', '..gw....', '.kgg....', 'k...g...'], { w: '#94b0c2', W: '#ffffff', g: '#ffcd75', k: '#7a4a2a' }],
  sun: [['...y....', '.y.y.y..', '..yyy...', 'yyyYyyy.', '..yyy...', '.y.y.y..', '...y....', '........'], { y: '#ffcd75', Y: '#ffffff' }],
  map: [['wwwwwwww', 'wggbbbgw', 'wgbbbggw', 'wbbgrgbw', 'wbgrrrgw', 'wggbrbgw', 'wgggbbbw', 'wwwwwwww'], { w: '#c2a070', g: '#38b764', b: '#41a6f6', r: '#e04050' }],
  hero: [['..hhhh..', '.hssssh.', '.sesses.', '..ssss..', '.cccccc.', 'cccccccc', 's.cccc.s', '..c..c..'], { h: '#6b3e1f', s: '#e8b48a', e: '#14101e', c: '#3b5dc9' }],
  gift: [['..y..y..', '...yy...', 'rrryyrrr', 'rrryyrrr', '.rryyrr.', '.rryyrr.', '.rryyrr.', '.rryyrr.'], { r: '#e04050', y: '#ffcd75' }],
  plus: [['........', '...gg...', '...gg...', '.gggggg.', '.gggggg.', '...gg...', '...gg...', '........'], { g: '#a7f070' }],
  skull: [['.wwwwww.', 'wwwwwwww', 'wkkwwkkw', 'wkkwwkkw', 'wwwkkwww', '.wwwwww.', '.w.ww.w.', '........'], { w: '#f4f4f4', k: '#14101e' }],
  water: [['...b....', '...b....', '..bbb...', '.bbbbb..', '.bwbbb..', 'bwbbbbb.', '.bbbbb..', '..bbb...'], { b: '#41a6f6', w: '#c0e8ff' }],
  gear: [['...kk...', '.k.kk.k.', '..kkkk..', 'kkk..kkk', 'kkk..kkk', '..kkkk..', '.k.kk.k.', '...kk...'], { k: '#94b0c2' }],
  target: [['..rrrr..', '.rwwwwr.', 'rwrrrrwr', 'rwrwwrwr', 'rwrwwrwr', 'rwrrrrwr', '.rwwwwr.', '..rrrr..'], { r: '#e04050', w: '#f4f4f4' }],
};

export function icon(name, size = 16, cls = '') {
  const def = ICONS[name] || ICONS.star;
  return svg(def[0], def[1], size, `icon ${cls}`);
}
