// Prepare les images de Wade and Friends a partir de assets/WADE.
//
//   node tools/prepare-wade.js
//
// Les rendus arrivent sur un fond uni (blanc pour Wade, Stephen, Faith et
// Their Creator, noir pour Charlie) : on le retire par remplissage depuis
// les bords, pour ne jamais trouer l'interieur d'une silhouette, puis on
// adoucit le liseré d'un demi-pixel.
//
// Ce qui sort :
//   - assets/games/wade/<perso>-<rendu>.webp : les rendus du jeu, 800 x 1200 ;
//   - assets/dinders/full/<id>.webp et assets/dinders/<id>.webp : la
//     version de base de chaque animatronique, pour la collection ;
//   - assets/games/icones/wade-and-friends.webp : la jaquette, d'apres le logo ;
//   - assets/games/wade/fizzies.webp, plushies.webp : les produits derives.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = ROOT + '/assets/WADE';
const OUT = ROOT + '/assets/games/wade';
fs.mkdirSync(OUT, { recursive: true });

// perso -> fichiers source, et l'identifiant du Dinder de base.
// tete : le carre de la tete dans le rendu de base (x, y, cote), en
// pixels de l'image source de 1024 x 1536.
const PERSOS = {
  wade:    { base: 'WadeWolhunter',    horror: 'WadeHorror',    endo: 'WadeEndo',
             id: 'wade-wolhunter',     tete: [255, 0, 410] },
  stephen: { base: 'StephenSharkodon', horror: 'StephenHorror', endo: 'StephenEndo',
             id: 'stephen-sharkodon',  tete: [300, 60, 400] },
  faith:   { base: 'FaithFaisandoir',  horror: 'FaithHorror',   endo: 'FaithEndo',
             id: 'faith-faisandoir',   tete: [270, 70, 400] },
  charlie: { base: 'CharlieCapsule',   horror: 'CharlieHorror', endo: 'CharlieEndo',
             id: 'charlie-capsule',    tete: [250, 130, 400] }
};

// Retire le fond : tout pixel relie au bord et proche de la couleur du
// coin devient transparent. Rend un buffer RGBA.
async function detourer(file, endo) {
  const { data, info } = await sharp(file).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  // La couleur du fond : la mediane des quatre coins.
  const coins = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]].map(function (p) {
    const i = (p[1] * W + p[0]) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  });
  const fond = [0, 1, 2].map(function (c) {
    const v = coins.map(function (k) { return k[c]; }).sort(function (a, b) { return a - b; });
    return (v[1] + v[2]) / 2;
  });
  const clair = fond[0] + fond[1] + fond[2] > 380;
  const TOL = clair ? 38 : 34;

  function ecart(i) {
    return Math.max(Math.abs(data[i] - fond[0]), Math.abs(data[i + 1] - fond[1]),
                    Math.abs(data[i + 2] - fond[2]));
  }

  // Ce qui n'est pas du fond, a coup sur.
  let sujet = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) sujet[p] = ecart(p * 4) > TOL ? 1 : 0;

  // Sur fond noir, les articulations de Charlie sont du meme noir que le
  // fond, et le remplissage s'y engouffrerait. On bouche d'abord les
  // interstices (dilatation), on remplit, puis on rend au contour sa
  // place (erosion) : une fermeture.
  function fermer(R) {
    const barriere = R ? maxFiltre(sujet, W, H, R) : sujet;
    const vu = new Uint8Array(W * H);
    const pile = [];
    for (let x = 0; x < W; x++) { pile.push(x, (H - 1) * W + x); }
    for (let y = 0; y < H; y++) { pile.push(y * W, y * W + W - 1); }
    while (pile.length) {
      const p = pile.pop();
      if (vu[p] || barriere[p]) continue;
      vu[p] = 1;
      const x = p % W, y = (p / W) | 0;
      if (x > 0) pile.push(p - 1);
      if (x < W - 1) pile.push(p + 1);
      if (y > 0) pile.push(p - W);
      if (y < H - 1) pile.push(p + W);
    }
    if (R) {
      // L'erosion du "pas fond" : le fond regagne la bande ajoutee.
      const pasFond = new Uint8Array(W * H);
      for (let p = 0; p < W * H; p++) pasFond[p] = vu[p] ? 0 : 1;
      const garde = minFiltre(pasFond, W, H, R);
      for (let p = 0; p < W * H; p++) vu[p] = garde[p] || sujet[p] ? 0 : 1;
    }
    return vu;
  }

  let vu;
  if (!clair) {
    // La gueule noire de Charlie touche presque le fond : sur la tete, on
    // ferme plus large. Sur le corps, ce serait noircir le creux des bras.
    const fin = fermer(16), large = fermer(28);
    vu = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) vu[p] = p < W * H * 0.3 ? large[p] : fin[p];
  } else {
    vu = fermer(0);
    // Sur fond blanc, les jours fermes (entre l'aile et le corps de
    // Faith) restent blancs : on retire aussi les plages enclavees d'un
    // blanc pur, si elles sont assez grandes pour ne pas etre un reflet.
    // Les cages des endosquelettes en sont pleines, et leur blanc est
    // moins franc.
    const SEUIL = endo ? 34 : 9, AIRE = endo ? 120 : 600;
    const lab = new Int32Array(W * H);
    let n = 0;
    for (let p0 = 0; p0 < W * H; p0++) {
      if (vu[p0] || lab[p0] || ecart(p0 * 4) > SEUIL) continue;
      n++;
      const zone = [], q = [p0];
      lab[p0] = n;
      while (q.length) {
        const p = q.pop();
        zone.push(p);
        const x = p % W, y = (p / W) | 0;
        const v = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
        for (const s of v) {
          if (s < 0 || lab[s] || vu[s] || ecart(s * 4) > SEUIL) continue;
          lab[s] = n; q.push(s);
        }
      }
      // Les dents des endosquelettes sont aussi blanches que le fond :
      // on ne touche pas a la tete, en haut du rendu.
      let my = 0;
      zone.forEach(function (p) { my += (p / W) | 0; });
      if (endo && my / zone.length < H * 0.24) continue;
      if (zone.length > AIRE) zone.forEach(function (p) { vu[p] = 1; });
    }
  }

  // Le masque, adouci : un pixel de bord prend une transparence partielle
  // selon ce qu'il a de fond autour de lui.
  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = vu[p] ? 0 : 255;
  const doux = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (!alpha[p]) { doux[p] = 0; continue; }
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          s += alpha[yy * W + xx]; n++;
        }
      }
      doux[p] = Math.round(s / n);
    }
  }
  for (let p = 0; p < W * H; p++) data[p * 4 + 3] = doux[p];
  return { data: data, W: W, H: H };
}

// Le maximum (ou le minimum) sur un carre de cote 2R + 1, en deux passes.
function filtre(m, W, H, R, max) {
  const a = new Uint8Array(W * H), b = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = max ? 0 : 1;
      for (let d = -R; d <= R; d++) {
        const xx = x + d;
        const s = xx < 0 || xx >= W ? (max ? 0 : 1) : m[y * W + xx];
        if (max ? s : !s) { v = s; break; }
      }
      a[y * W + x] = v;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = max ? 0 : 1;
      for (let d = -R; d <= R; d++) {
        const yy = y + d;
        const s = yy < 0 || yy >= H ? (max ? 0 : 1) : a[yy * W + x];
        if (max ? s : !s) { v = s; break; }
      }
      b[y * W + x] = v;
    }
  }
  return b;
}
function maxFiltre(m, W, H, R) { return filtre(m, W, H, R, true); }
function minFiltre(m, W, H, R) { return filtre(m, W, H, R, false); }

function brut(img) {
  return sharp(img.data, { raw: { width: img.W, height: img.H, channels: 4 } });
}

// Le rendu en pied, centre dans 800 x 1200, pieds en bas.
async function enPied(img, dest) {
  const png = await brut(img).png().toBuffer();
  await sharp(png).trim({ threshold: 1 })
    .resize(760, 1180, { fit: 'inside', kernel: 'lanczos3' })
    .toBuffer()
    .then(function (b) {
      return sharp(b).metadata().then(function (m) {
        return sharp({ create: { width: 800, height: 1200, channels: 4,
                                 background: { r: 0, g: 0, b: 0, alpha: 0 } } })
          .composite([{ input: b, left: Math.round((800 - m.width) / 2), top: 1200 - m.height - 10 }])
          .webp({ quality: 88, alphaQuality: 100 })
          .toFile(dest);
      });
    });
}

// La tete, 400 x 400, le cou qui s'efface vers le bas.
async function tete(img, carre, dest) {
  const c = carre[2];
  const x0 = Math.max(0, carre[0]), y0 = Math.max(0, carre[1]);
  const d = Buffer.alloc(c * c * 4);
  for (let y = 0; y < c; y++) {
    for (let x = 0; x < c; x++) {
      const sx = x0 + x, sy = y0 + y;
      if (sx >= img.W || sy >= img.H) continue;
      const i = (sy * img.W + sx) * 4, o = (y * c + x) * 4;
      // Les 22 derniers pour cent s'estompent.
      const k = y / c;
      const f = k < 0.78 ? 1 : Math.max(0, 1 - (k - 0.78) / 0.22);
      d[o] = img.data[i]; d[o + 1] = img.data[i + 1]; d[o + 2] = img.data[i + 2];
      d[o + 3] = Math.round(img.data[i + 3] * f);
    }
  }
  await sharp(d, { raw: { width: c, height: c, channels: 4 } })
    .resize(400, 400, { kernel: 'lanczos3' })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(dest);
}

(async function () {
  for (const k of Object.keys(PERSOS)) {
    const P = PERSOS[k];
    for (const rendu of ['base', 'horror', 'endo']) {
      const img = await detourer(SRC + '/' + P[rendu] + '.PNG', rendu === 'endo');
      await enPied(img, OUT + '/' + k + '-' + rendu + '.webp');
      if (rendu === 'base') {
        await enPied(img, ROOT + '/assets/dinders/full/' + P.id + '.webp');
        await tete(img, P.tete, ROOT + '/assets/dinders/' + P.id + '.webp');
      }
      console.log(k, rendu, 'ok');
    }
  }

  // Their Creator et ses masques, pour la fin.
  for (const k of ['TheirCreator', 'TheirCreatorChair', 'TheirCreatorM1', 'TheirCreatorM2', 'TheirCreatorM3', 'TheirCreatorMF']) {
    const img = await detourer(SRC + '/' + k + '.PNG', false);
    const nom = 'createur' + (k === 'TheirCreator' ? '' : '-' + k.replace('TheirCreator', '').toLowerCase());
    await enPied(img, OUT + '/' + nom + '.webp');
    console.log(nom, 'ok');
  }

  // La jaquette : le logo, deja detoure, dans un carre.
  await sharp(SRC + '/Logo.PNG').trim({ threshold: 1 })
    .resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(ROOT + '/assets/games/icones/wade-and-friends.webp');
  await sharp(SRC + '/Logo.PNG').resize(683, 1024, { fit: 'inside' })
    .webp({ quality: 88, alphaQuality: 100 }).toFile(OUT + '/logo.webp');
  await sharp(SRC + '/Fizzies.PNG').resize(1024, 683, { fit: 'inside' })
    .webp({ quality: 86, alphaQuality: 100 }).toFile(OUT + '/fizzies.webp');
  await sharp(SRC + '/Plushies.PNG').resize(683, 1024, { fit: 'inside' })
    .webp({ quality: 86, alphaQuality: 100 }).toFile(OUT + '/plushies.webp');
  console.log('logo, fizzies, plushies ok');
})();
