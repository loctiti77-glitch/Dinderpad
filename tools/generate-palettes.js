// Releve la palette de chaque personnage a partir de son illustration en
// pied, pour que les sprites de balade du mini-jeu soient a ses couleurs.
//
// On ne cherche pas a copier l'image : on en extrait six teintes (cheveux,
// peau, haut, bas, accent, chaussures) que le dessinateur de sprites
// utilisera pour habiller un corps chibi commun, comme dans Pokemon.
const sharp = require('sharp');
const fs = require('fs');

const ROOT = 'C:/Users/Portable8/dinderpad-site';

const IDS = [
  'dr-islas-human-form', 'dr-islas-demicos-form', 'dr-islas-final-form',
  'calder-veyne-veinburner', 'carl-sinars-cardinal-sin', 'edgar-marks-grincrusher',
  'he-melt', 'v', 'a', 'h', 'multinder', 'gart-kervelor-king-of-karsovia',
  'harry-hargrove', 'marlon-coach', 'baron-zofiax', 'timeo-traveler',
  'william-batant', 'dr-islas-singularity', 'dr-islas-the-founder'
];

function versHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}

const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

// Ce qui ressemble vraiment a de la peau. La fourchette est etroite a
// dessein : sans cela l'or des armures passe pour un visage.
const peauQ = ([h, s, v]) => h >= 8 && h <= 42 && s >= 0.12 && s <= 0.56 && v >= 0.42;

const PEAU_DEFAUT = [231, 190, 153];

// Un sprite de 20 pixels de haut cerne de noir ne supporte pas le noir
// pur : on remonte les teintes trop sombres juste assez pour qu'elles se
// detachent du contour.
function lisible(c, plancher) {
  const max = Math.max(c[0], c[1], c[2]);
  if (max >= plancher) return c;
  if (max < 6) return [plancher * 0.62, plancher * 0.64, plancher * 0.78];
  const k = plancher / max;
  return c.map(v => Math.min(255, v * k));
}

// Les couleurs dominantes d'une bande horizontale de l'image, regroupees
// par paquets : deux nuances voisines comptent pour la meme teinte.
function dominantes(data, W, H, y0, y1, filtre) {
  const seaux = new Map();
  for (let y = Math.floor(y0); y < Math.floor(y1); y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 200) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const hsv = versHsv(r, g, b);
      if (filtre && !filtre(hsv, [r, g, b])) continue;
      const cle = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4);
      const s = seaux.get(cle) || { n: 0, r: 0, g: 0, b: 0 };
      s.n++; s.r += r; s.g += g; s.b += b;
      seaux.set(cle, s);
    }
  }
  return [...seaux.values()]
    .sort((a, b) => b.n - a.n)
    .map(s => [s.r / s.n, s.g / s.n, s.b / s.n]);
}

function assombrir(c, k) { return c.map(v => Math.max(0, v * k)); }
function eclaircir(c, k) { return c.map(v => Math.min(255, v + (255 - v) * k)); }

// Deux teintes trop proches rendent le sprite illisible : on ecarte la
// seconde si elle se confond avec la premiere.
function proche(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 60;
}

async function palette(src) {
  const img = sharp(src).trim({ threshold: 2 });
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;

  const bande = (a, b, f) => dominantes(data, W, H, H * a, H * b, f);

  // La peau se cherche au visage, et doit ressembler a de la peau. Les
  // personnages casques n'en montrent pas : ils prennent le teint par defaut.
  const visage = bande(0.05, 0.22, hsv => peauQ(hsv));
  const peau = visage[0] || PEAU_DEFAUT;

  // Les cheveux : le haut du crane, tout ce qui n'est pas de la peau.
  const haut = bande(0.00, 0.11, (hsv, rgb) => !proche(rgb, peau));
  const cheveux = lisible(haut[0] || [52, 44, 58], 46);

  // La couleur signature : la teinte franche la plus presente sur toute
  // la silhouette. C'est elle qui distingue les personnages dont le
  // costume est noir, sans quoi ils sortiraient tous du meme gris.
  const vives = dominantes(data, W, H, 0, H,
    (hsv, rgb) => hsv[1] >= 0.45 && hsv[2] >= 0.28 && !proche(rgb, peau));
  const signature = vives[0] || null;

  // Le buste, puis les jambes.
  const buste = bande(0.28, 0.50, (hsv, rgb) => !proche(rgb, peau));
  let vetement = buste[0] || [90, 96, 120];
  const noirci = Math.max(vetement[0], vetement[1], vetement[2]) < 42;
  if (noirci && signature) vetement = assombrir(signature, 0.52);
  vetement = lisible(vetement, 62);

  // L'accent doit trancher sur le vetement, sinon il ne sert a rien.
  let accent = buste.find(c => !proche(c, vetement) && !proche(c, peau));
  if (!accent && signature && !proche(signature, vetement)) accent = signature;
  if (!accent) accent = eclaircir(vetement, 0.45);
  accent = lisible(accent, 80);

  const jambes = bande(0.60, 0.82, (hsv, rgb) => !proche(rgb, peau));
  let bas = jambes.find(c => !proche(c, vetement)) || jambes[0] || assombrir(vetement, 0.7);
  bas = lisible(bas, 52);
  if (proche(bas, vetement)) bas = assombrir(vetement, 0.62);

  const pieds = bande(0.90, 1.00);
  const chaussures = lisible(assombrir(pieds[0] || bas, 0.8), 34);

  return {
    peau: hex(peau),
    peauOmbre: hex(assombrir(peau, 0.78)),
    cheveux: hex(cheveux),
    cheveuxClair: hex(eclaircir(cheveux, 0.32)),
    vetement: hex(vetement),
    vetementOmbre: hex(assombrir(vetement, 0.7)),
    accent: hex(accent),
    bas: hex(bas),
    basOmbre: hex(assombrir(bas, 0.7)),
    chaussures: hex(chaussures)
  };
}

(async () => {
  const out = {};
  for (const id of IDS) {
    out[id] = await palette(ROOT + '/assets/dinders/full/' + id + '.webp');
    console.log(id.padEnd(32) + JSON.stringify(out[id]));
  }
  // Le Fondateur garde la palette relevee sur son illustration d'origine :
  // son armure noire trompe le releve par bandes sur la nouvelle planche.
  out['lefondateur'] = await palette(ROOT + '/assets/_source/LeFondateur.PNG');
  console.log('lefondateur'.padEnd(32) + JSON.stringify(out['lefondateur']));

  const js = '// Genere par tools/generate-palettes.js — ne pas editer a la main.\n' +
             '// Les couleurs de chaque personnage, relevees sur son illustration,\n' +
             '// dont le mini-jeu habille ses sprites de balade.\n' +
             'window.FW_PALETTES = ' + JSON.stringify(out, null, 2) + ';\n';
  fs.writeFileSync(ROOT + '/js/game-palettes.js', js);
  console.log('\njs/game-palettes.js ecrit (' + Math.round(js.length / 1024) + ' Ko)');
})();
