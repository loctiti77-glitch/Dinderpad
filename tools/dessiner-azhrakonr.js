// Dessine a la main le sprite de duel d'Azhrakonr (64 x 80).
//
// Les autres sprites de duel sont des reductions de l'illustration
// (tools/generate-sprites.js). Pour lui, la reduction ne gardait rien du
// casque : la crete, les cornes en croissant et la visiere etoilee se
// fondaient dans une masse bleue. Il est donc dessine pixel par pixel,
// d'apres assets/AzhraknorFull.PNG : le casque y prend plus de place que
// dans l'illustration, pour se lire au premier coup d'oeil.
//
//   node tools/dessiner-azhrakonr.js
const sharp = require('sharp');

const ROOT = 'C:/Users/Portable8/dinderpad-site';
const L = 64, H = 80;
const px = new Uint8Array(L * H * 4);

function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function point(x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= L || y >= H) return;
  const [r, g, b] = hex(c), i = (y * L + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
}
function rect(x, y, w, h, c) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) point(x + i, y + j, c);
}
function disque(cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.3) point(x, y, c);
}
function anneau(cx, cy, r, c) {
  for (let a = 0; a < 360; a += 4) point(cx + Math.cos(a * Math.PI / 180) * r, cy + Math.sin(a * Math.PI / 180) * r, c);
}
function trait(pts, c) {
  for (let k = 0; k < pts.length - 1; k++) {
    let [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) point(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  }
}
// Un polygone plein, par balayage.
function poly(pts, c) {
  let y0 = Infinity, y1 = -Infinity;
  pts.forEach(([, y]) => { y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [], yc = y + 0.5;
    for (let k = 0; k < pts.length; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) point(x, y, c);
  }
}
function miroir(pts) { return pts.map(([x, y]) => [63 - x, y]); }
// Des etoiles semees dans une zone deja peinte d'un ton donne.
function etoiles(x0, y0, x1, y1, fond, n, graine) {
  let s = graine;
  const alea = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const [fr, fg, fb] = hex(fond);
  for (let k = 0; k < n * 6 && n > 0; k++) {
    const x = Math.floor(x0 + alea() * (x1 - x0)), y = Math.floor(y0 + alea() * (y1 - y0));
    const i = (y * L + x) * 4;
    if (px[i + 3] && px[i] === fr && px[i + 1] === fg && px[i + 2] === fb) {
      point(x, y, alea() < 0.35 ? C.etoile : C.etoileB);
      n--;
    }
  }
}

const C = {
  cerne: '#0b0d22',
  sombre: '#181c42', armure: '#262d66', moyen: '#3a4590', argent: '#8e9ad0', eclat: '#d2dbf6',
  lueur: '#3fd6ff', lueurV: '#c4f6ff', bleu: '#2a5aff',
  vide: '#0d1236', etoile: '#ffffff', etoileB: '#8fb4ff',
  robe: '#14173a', robeM: '#1f2554',
  orbe: '#1d2f9a', orbeC: '#4a7cff'
};

// ---------- Les cornes en croissant ----------
const corne = [[23, 25], [17, 24], [12, 21], [8, 16], [6, 10], [6, 2], [9, 4], [11, 10], [14, 15], [18, 18], [23, 19]];
poly(corne, C.armure); poly(miroir(corne), C.armure);
trait([[22, 20], [18, 19], [14, 16], [11, 11], [9, 5]], C.argent);
trait(miroir([[22, 20], [18, 19], [14, 16], [11, 11], [9, 5]]), C.argent);
trait([[21, 22], [16, 21], [12, 18], [9, 13], [8, 8]], C.lueur);
trait(miroir([[21, 22], [16, 21], [12, 18], [9, 13], [8, 8]]), C.lueur);

// ---------- Le casque ----------
// La crete, haute, segmentee, et son anneau.
rect(29, 0, 7, 15, C.armure);
rect(29, 0, 1, 15, C.argent); rect(35, 1, 1, 14, C.sombre);
rect(31, 1, 2, 10, C.lueur); point(31, 1, C.lueurV);
rect(29, 5, 7, 1, C.sombre);
// Les flancs du cimier, en marches.
rect(26, 5, 3, 9, C.moyen); rect(36, 5, 3, 9, C.moyen);
rect(26, 5, 3, 1, C.argent); rect(36, 5, 3, 1, C.argent);
// Le dome.
disque(32, 22, 10, C.armure);
disque(31, 20, 7, C.moyen);
trait([[23, 19], [25, 15], [29, 12]], C.argent);
trait([[26, 13], [26, 18]], C.sombre); trait([[38, 13], [38, 18]], C.sombre);
// L'anneau du front.
disque(32, 14, 3.3, C.sombre); anneau(32, 14, 3, C.lueur); disque(32, 14, 1.2, C.vide); point(32, 14, C.lueurV);
// Les disques des tempes.
[22, 42].forEach((x) => {
  disque(x, 24, 3.6, C.argent); disque(x, 24, 2.6, C.lueur); disque(x, 24, 1.4, C.sombre);
});
// La visiere : le vide etoile, cercle d'un trait bleu.
poly([[25, 19], [39, 19], [40, 27], [36, 30], [28, 30], [24, 27]], C.vide);
trait([[25, 19], [39, 19]], C.bleu);
trait([[24, 20], [24, 26]], C.bleu); trait([[40, 20], [40, 26]], C.bleu);
etoiles(25, 20, 40, 30, C.vide, 9, 11);
point(29, 23, C.lueurV); point(35, 23, C.lueurV);
// Le bas du masque.
poly([[27, 30], [37, 30], [35, 34], [29, 34]], C.moyen);
trait([[32, 30], [32, 33]], C.sombre);
rect(28, 30, 9, 1, C.argent);

// ---------- Le torse et les epaulieres ----------
poly([[18, 35], [46, 35], [48, 48], [16, 48]], C.robe);
rect(28, 34, 9, 2, C.sombre);
const epaule = [[9, 41], [15, 35], [28, 34], [28, 40], [12, 46]];
poly(epaule, C.armure); poly(miroir(epaule), C.armure);
trait([[15, 35], [28, 34]], C.argent); trait(miroir([[15, 35], [28, 34]]), C.argent);
trait([[11, 42], [26, 37]], C.lueur); trait(miroir([[11, 42], [26, 37]]), C.lueur);
trait([[9, 41], [15, 35]], C.eclat);
// L'embleme de la poitrine : un anneau, le vide au milieu.
disque(32, 41, 4.6, C.argent); disque(32, 41, 3.6, C.lueur); disque(32, 41, 2.6, C.vide);
point(31, 40, C.etoile); point(33, 42, C.etoileB);

// ---------- La robe, sa doublure etoilee ----------
poly([[16, 46], [48, 46], [52, 60], [59, 73], [50, 70], [44, 74], [38, 70], [26, 70], [20, 74], [14, 70], [5, 73], [12, 60]], C.robe);
const pan = [[5, 73], [12, 60], [16, 49], [19, 62], [14, 70]];
poly(pan, C.vide); poly(miroir(pan), C.vide);
etoiles(4, 48, 20, 74, C.vide, 10, 23); etoiles(44, 48, 60, 74, C.vide, 10, 37);
trait([[16, 49], [19, 62], [14, 70]], C.argent); trait(miroir([[16, 49], [19, 62], [14, 70]]), C.argent);
trait([[22, 52], [22, 69]], C.robeM); trait([[42, 52], [42, 69]], C.robeM);
trait([[25, 54], [24, 68]], C.robeM); trait([[39, 54], [40, 68]], C.robeM);
// La ceinture.
rect(18, 48, 28, 3, C.armure); rect(18, 48, 28, 1, C.argent);
// Le tabard central, borde d'argent, la lueur au milieu.
poly([[28, 50], [36, 50], [36, 68], [32, 73], [28, 68]], C.moyen);
trait([[28, 50], [28, 68], [32, 72]], C.argent); trait([[36, 50], [36, 68], [32, 72]], C.sombre);
trait([[32, 54], [32, 70]], C.lueur);
disque(32, 51, 3.2, C.argent); disque(32, 51, 2.2, C.lueur); point(32, 51, C.vide);
rect(30, 62, 5, 1, C.argent);
disque(32, 64, 1.6, C.lueur);

// ---------- Le bras droit, le long du corps ----------
poly([[47, 39], [54, 42], [56, 57], [50, 59], [47, 48]], C.armure);
trait([[54, 42], [56, 57]], C.argent);
rect(49, 55, 7, 6, C.sombre);
rect(49, 56, 7, 1, C.lueur); rect(49, 59, 7, 1, C.lueur);
rect(50, 61, 2, 3, C.armure); rect(53, 61, 2, 3, C.armure); point(55, 62, C.armure);

// ---------- Les jambes et les bottes ----------
[[22, 20], [36, 35]].forEach(([j, b]) => {
  rect(j, 70, 7, 6, C.armure); rect(j, 70, 1, 6, C.argent);
  disque(j + 3, 71, 1.8, C.lueur); point(j + 3, 71, C.lueurV);
  rect(b, 75, 10, 4, C.sombre); rect(b, 75, 10, 1, C.argent); rect(b + 1, 77, 8, 1, C.lueur);
});

// ---------- Le bras gauche leve, et l'orbe ----------
poly([[17, 40], [15, 47], [8, 45], [4, 41], [7, 37], [12, 37]], C.robeM);
trait([[17, 40], [12, 37], [7, 37]], C.argent);
trait([[6, 39], [8, 44]], C.lueur);
rect(4, 33, 7, 4, C.armure); rect(4, 33, 1, 3, C.argent); rect(10, 32, 1, 3, C.armure);
disque(7, 27, 5.2, C.orbe);
disque(6, 26, 3, C.orbeC);
etoiles(2, 22, 13, 33, C.orbe, 5, 5);
point(5, 25, C.etoile); point(4, 24, C.lueurV);
for (let a = 0; a < 360; a += 10) {
  const r = a * Math.PI / 180, x = 7 + Math.cos(r) * 8, y = 27 + Math.sin(r) * 2.2 - Math.cos(r) * 1.2;
  if (Math.sin(r) > -0.3 || Math.abs(x - 7) > 5) point(x, y, C.lueur);
}
point(0, 22, C.lueurV); point(13, 21, C.lueurV); point(2, 31, C.lueur);

// ---------- Le cerne ----------
const plein = new Uint8Array(L * H);
for (let i = 0; i < L * H; i++) plein[i] = px[i * 4 + 3] ? 1 : 0;
for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
  if (plein[y * L + x]) continue;
  const v = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx >= 0 && ny >= 0 && nx < L && ny < H && plein[ny * L + nx];
  });
  if (v) point(x, y, C.cerne);
}

const sortie = process.argv[2] || ROOT + '/assets/games/sprites/duel/azhrakonr.png';
sharp(Buffer.from(px), { raw: { width: L, height: H, channels: 4 } }).png().toFile(sortie)
  .then(() => console.log('sprite : ' + sortie));
