// Fabrique les sprites 8 bits du mini-jeu "The Founder War" a partir des
// images en pied des Dinders (deja detourees).
//
// Le principe : reduire fortement l'image, aplatir les couleurs en une
// petite palette, puis rendre l'alpha franc et cerner la silhouette d'un
// trait sombre. C'est ce cerne qui fait lire une image reduite comme un
// sprite plutot que comme une vignette floue.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/Portable8/dinderpad-site';
const OUT  = ROOT + '/assets/games/sprites';

const IDS = [
  'dr-islas-human-form', 'dr-islas-demicos-form', 'dr-islas-final-form',
  'calder-veyne-veinburner', 'carl-sinars-cardinal-sin', 'edgar-marks-grincrusher',
  'he-melt', 'v', 'a', 'h', 'multinder', 'gart-kervelor-king-of-karsovia'
];

// Une seule taille : celle du duel. Les sprites de balade de la foret ne
// sont pas des images, ils sont peints par js/game-sprites.js.
const TAILLES = { duel: [64, 80] };

const OUTLINE = [14, 12, 26, 255];      // le cerne, presque noir mais bleute

// Reduit une image a la grille voulue en gardant sa silhouette centree.
async function grille(entree, W, H, couleurs) {
  const img = sharp(entree)
    .trim({ threshold: 2 })                       // enleve le vide autour
    .resize(W, H, { fit: 'contain', kernel: 'lanczos3',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ saturation: 1.35, brightness: 1.06 })
    .linear(1.12, -10);

  // La quantification aplatit les degrades : c'est elle qui donne l'aspect
  // 8 bits. Sans tramage, sinon les aplats se remplissent de bruit.
  const png = await img.png({ palette: true, colours: couleurs, dither: 0 }).toBuffer();
  return sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

// Alpha franc puis cerne : un sprite n'a pas de bords fondus.
function cerner(data, W, H) {
  const A = 3;
  for (let i = 0; i < W * H; i++) data[i * 4 + A] = data[i * 4 + A] >= 110 ? 255 : 0;

  const plein = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) plein[i] = data[i * 4 + A] === 255 ? 1 : 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (plein[i]) continue;
      let voisin = false;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        if (plein[ny * W + nx]) { voisin = true; break; }
      }
      if (voisin) {
        data[i * 4] = OUTLINE[0]; data[i * 4 + 1] = OUTLINE[1];
        data[i * 4 + 2] = OUTLINE[2]; data[i * 4 + 3] = OUTLINE[3];
      }
    }
  }
  return data;
}

async function sprite(entree, sortie, W, H, couleurs) {
  const { data, info } = await grille(entree, W, H, couleurs);
  const px = cerner(data, info.width, info.height);
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ palette: true, colours: couleurs + 4, dither: 0 })
    .toFile(sortie);
}

(async () => {
  for (const taille of Object.keys(TAILLES)) {
    fs.mkdirSync(path.join(OUT, taille), { recursive: true });
  }
  for (const id of IDS) {
    for (const [taille, [W, H]] of Object.entries(TAILLES)) {
      await sprite(ROOT + '/assets/dinders/full/' + id + '.webp',
                   path.join(OUT, taille, id + '.png'),
                   W, H, 28);
    }
    process.stdout.write('.');
  }

  // Le Fondateur est plus grand que les autres : il domine l'arene.
  await sprite(ROOT + '/assets/_source/LeFondateur.PNG',
               path.join(OUT, 'duel', 'lefondateur.png'), 104, 128, 30);

  // Les objets ramassables de la carte : la canne a peche, en petit, pour
  // qu'elle flotte sur la carte comme un sprite d'objet.
  fs.mkdirSync(path.join(OUT, 'objets'), { recursive: true });
  // Le leurre pend loin a droite de l'illustration : le garder ferait un
  // point isole qui ressemble a un defaut. On ne prend que la canne.
  const rod = await sharp(ROOT + '/assets/_source/FishingRod.PNG')
    .extract({ left: 0, top: 0, width: 1340, height: 1024 }).png().toBuffer();
  await sprite(rod, path.join(OUT, 'objets', 'canne.png'), 34, 24, 14);

  console.log('\n' + IDS.length + ' Dinders + Le Fondateur + la canne en sprites');
})();
