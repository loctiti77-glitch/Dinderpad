// Fabrique la carte du monde en 8 bits du DinderTracker.
//
// La grille fait 64 colonnes sur 32 lignes, en projection equirectangulaire :
// une colonne = 5,625 degres de longitude, une ligne = 5,625 de latitude.
// Chaque ligne est decrite par les plages de colonnes occupees par la terre,
// ce qui est bien plus sur que de dessiner 2048 cases a la main.
const sharp = require('sharp');

const COLS = 64, ROWS = 32, SCALE = 18;   // 1152 x 576 au final

// Terres emergees, ligne par ligne (plages de colonnes, bornes incluses).
const TERRE = {
   2: [[10,19],[22,26],[33,34],[44,60]],
   3: [[3,7],[8,20],[22,27],[32,35],[37,61]],
   4: [[2,7],[8,20],[23,27],[32,35],[37,61]],
   5: [[3,6],[8,20],[24,26],[31,36],[38,61]],
   6: [[7,20],[30,30],[32,37],[38,61]],
   7: [[8,20],[30,37],[38,60]],
   8: [[9,20],[31,37],[38,58],[60,61]],   // Europe, au nord de la mer
   9: [[9,20],[30,30],[36,38],[39,58],[59,60]],   // la Mediterranee coupe ici
  10: [[10,19],[29,38],[39,56]],
  11: [[12,17],[29,39],[40,55]],
  12: [[14,17],[29,39],[41,45],[47,53]],
  13: [[15,17],[28,40],[41,44],[46,52]],
  14: [[18,21],[28,41],[47,53]],
  15: [[18,23],[29,40],[49,55]],
  16: [[18,24],[30,40],[50,55]],
  17: [[18,25],[31,39]],                          // detroit avant l'Australie
  18: [[19,25],[31,39],[52,58]],
  19: [[19,25],[31,38],[41,41],[52,59]],
  20: [[19,24],[31,37],[41,41],[52,59]],
  21: [[20,24],[32,36],[53,58]],
  22: [[20,23],[54,57],[61,62]],
  23: [[21,23],[61,62]],
  24: [[21,23]],
  25: [[21,22]]
};

// Calottes glaciaires : arctique en haut, antarctique en bas.
// La ligne 2 n'est glacee que la ou il n'y a pas de terre, pour que la
// banquise ait un bord decoupe plutot qu'un trait net.
const GLACE = {
   0: [[0,63]],
   1: [[0,63]],
   2: [[0,2],[20,21],[28,31],[62,63]],
  28: [[8,22],[28,48]],
  29: [[3,58]],
  30: [[0,63]],
  31: [[0,63]]
};

const MER   = [0x0b, 0x2b, 0x4a];
const MER2  = [0x10, 0x36, 0x59];   // damier discret, pour la texture 8 bits
const SOL   = [0x3f, 0x9e, 0x4a];
const SOL2  = [0x35, 0x86, 0x3f];
const COTE  = [0x1d, 0x5c, 0x2a];
const NEIGE = [0xd6, 0xe9, 0xf2];
const NEIGE2= [0xbc, 0xd6, 0xe4];

function build() {
  const grid = [];                       // 0 mer, 1 terre, 2 glace
  for (let y = 0; y < ROWS; y++) {
    grid.push(new Uint8Array(COLS));
    for (const [a, b] of (TERRE[y] || [])) for (let x = a; x <= b; x++) grid[y][x] = 1;
    for (const [a, b] of (GLACE[y] || [])) for (let x = a; x <= b; x++) grid[y][x] = 2;
  }
  return grid;
}

function render(grid) {
  const W = COLS * SCALE, H = ROWS * SCALE;
  const buf = Buffer.alloc(W * H * 3);

  const put = (px, py, c) => {
    const i = (py * W + px) * 3;
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
  };

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const v = grid[y][x];
      const pair = (x + y) % 2 === 0;

      // Une case au bord de l'eau prend une teinte plus sombre : ca dessine
      // les cotes sans avoir a les tracer.
      let cote = false;
      if (v === 1) {
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
          if (grid[ny][nx] === 0) cote = true;
        }
      }

      const c = v === 0 ? (pair ? MER : MER2)
              : v === 2 ? (pair ? NEIGE : NEIGE2)
              : cote    ? COTE
              : (pair ? SOL : SOL2);

      for (let py = 0; py < SCALE; py++)
        for (let px = 0; px < SCALE; px++)
          put(x * SCALE + px, y * SCALE + py, c);
    }
  }
  return { buf, W, H };
}

(async () => {
  const grid = build();
  const { buf, W, H } = render(grid);
  const out = await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
    .png({ palette: true, colours: 16 })
    .toFile('C:/Users/Portable8/dinderpad-site/assets/items/worldmap.png');
  console.log('worldmap.png', out.width + 'x' + out.height,
              Math.round(out.size / 1024) + ' Ko');

  let terre = 0, glace = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (grid[y][x] === 1) terre++; else if (grid[y][x] === 2) glace++;
  }
  console.log('cases : terre ' + terre + ', glace ' + glace +
              ', mer ' + (COLS * ROWS - terre - glace));
})();
