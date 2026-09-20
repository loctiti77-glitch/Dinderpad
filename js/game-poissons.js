// Les trente especes du mini-jeu de peche, et leur dessin.
//
// Comme les sprites de balade, rien n'est stocke en fichier : chaque
// poisson est peint dans une case de 36 x 22 a partir d'une silhouette,
// d'une palette et d'un motif. C'est ce qui permet d'en avoir trente sans
// alourdir le site d'une seule image.
(function () {

  var L = 36, H = 22;
  var CERNE = [18, 22, 34, 255];

  // Les quatre paliers de rarete, du plus courant au plus rare. "poids"
  // pese le tirage : un Commun sort environ quinze fois plus souvent
  // qu'un Legendaire.
  var RARETES = [
    { nom: 'Commun',      cle: 'commun',  poids: 56, couleur: '#c7d3de' },
    { nom: 'Peu commun',  cle: 'peu',     poids: 27, couleur: '#4fd13a' },
    { nom: 'Rare',        cle: 'rare',    poids: 13, couleur: '#45b0ff' },
    { nom: 'Légendaire',  cle: 'legende', poids: 4,  couleur: '#f5c93a' }
  ];

  // corps / ventre / nageoire, puis la forme et le motif.
  var POISSONS = [
    // ---- Communs ----
    { id: 'ablette',    nom: 'Ablette',        rarete: 'commun', forme: 'classique', motif: 'aucun',
      cm: [8, 18],   c: ['#b9c6d4', '#eef3f8', '#8fa0b2'] },
    { id: 'gardon',     nom: 'Gardon',         rarete: 'commun', forme: 'classique', motif: 'aucun',
      cm: [10, 25],  c: ['#8fa4b8', '#e6ecf2', '#c9433f'] },
    { id: 'perche',     nom: 'Perche',         rarete: 'commun', forme: 'classique', motif: 'rayures',
      cm: [12, 35],  c: ['#6e9a4a', '#dfe6c8', '#d4703a'] },
    { id: 'goujon',     nom: 'Goujon',         rarete: 'commun', forme: 'classique', motif: 'points',
      cm: [6, 14],   c: ['#9a8b6a', '#e8dfc6', '#7a6e52'] },
    { id: 'vairon',     nom: 'Vairon',         rarete: 'commun', forme: 'classique', motif: 'rayures',
      cm: [5, 11],   c: ['#6f8f7a', '#e4ead8', '#4d6a58'] },
    { id: 'carpe',      nom: 'Carpe',          rarete: 'commun', forme: 'plat',      motif: 'ecailles',
      cm: [25, 70],  c: ['#a8813f', '#e6d3a4', '#7d5e2c'] },
    { id: 'breme',      nom: 'Brème',          rarete: 'commun', forme: 'plat',      motif: 'aucun',
      cm: [20, 50],  c: ['#b0aa8e', '#eae6d2', '#87816a'] },
    { id: 'tanche',     nom: 'Tanche',         rarete: 'commun', forme: 'plat',      motif: 'aucun',
      cm: [20, 45],  c: ['#5f7a3c', '#c2cf95', '#43552a'] },
    { id: 'rotengle',   nom: 'Rotengle',       rarete: 'commun', forme: 'classique', motif: 'aucun',
      cm: [12, 30],  c: ['#9fae7e', '#e9eed4', '#d0492f'] },
    { id: 'chevesne',   nom: 'Chevesne',       rarete: 'commun', forme: 'long',      motif: 'aucun',
      cm: [15, 45],  c: ['#8e9aa6', '#e4e9ee', '#6d7885'] },
    { id: 'barbeau',    nom: 'Barbeau',        rarete: 'commun', forme: 'long',      motif: 'points',
      cm: [20, 60],  c: ['#93834f', '#ded1a6', '#6d6038'] },
    { id: 'sandre',     nom: 'Sandre',         rarete: 'commun', forme: 'long',      motif: 'rayures',
      cm: [30, 75],  c: ['#7d8a63', '#dbe0c3', '#59633f'] },

    // ---- Peu communs ----
    { id: 'truite',     nom: 'Truite',         rarete: 'peu', forme: 'classique', motif: 'points',
      cm: [20, 50],  c: ['#b0724a', '#f0dcc4', '#e0576a'] },
    { id: 'brochet',    nom: 'Brochet',        rarete: 'peu', forme: 'long',      motif: 'points',
      cm: [40, 110], c: ['#5c7a44', '#d5dfae', '#3f5a2c'] },
    { id: 'silure',     nom: 'Silure',         rarete: 'peu', forme: 'long',      motif: 'moustache',
      cm: [50, 160], c: ['#4f4a44', '#b6ab99', '#35312c'] },
    { id: 'anguille',   nom: 'Anguille',       rarete: 'peu', forme: 'anguille',  motif: 'aucun',
      cm: [30, 90],  c: ['#3f4a3a', '#a8b09a', '#2a3327'] },
    { id: 'ecrevisse',  nom: 'Écrevisse',      rarete: 'peu', forme: 'ecrevisse', motif: 'aucun',
      cm: [6, 15],   c: ['#b8442e', '#eab08e', '#8a2c1c'] },
    { id: 'crabe',      nom: 'Crabe des Vases', rarete: 'peu', forme: 'crabe',    motif: 'aucun',
      cm: [5, 14],   c: ['#9a6a3c', '#d9b183', '#6e4826'] },
    { id: 'lamproie',   nom: 'Lamproie',       rarete: 'peu', forme: 'anguille',  motif: 'points',
      cm: [25, 60],  c: ['#6a5f52', '#c4b8a5', '#463e34'] },
    { id: 'esturgeon',  nom: 'Esturgeon',      rarete: 'peu', forme: 'long',      motif: 'ecailles',
      cm: [60, 180], c: ['#6b7482', '#c6cdd6', '#4a515c'] },
    { id: 'blackbass',  nom: 'Black-bass',     rarete: 'peu', forme: 'classique', motif: 'rayures',
      cm: [25, 55],  c: ['#4c6a4a', '#cfd9b8', '#33492f'] },

    // ---- Rares ----
    { id: 'poisson-lune', nom: 'Poisson-Lune', rarete: 'rare', forme: 'plat',   motif: 'points',
      cm: [25, 60],  c: ['#d8d2b4', '#f6f2e0', '#e0a93f'] },
    { id: 'raie',       nom: 'Raie d’Eau Douce', rarete: 'rare', forme: 'raie', motif: 'points',
      cm: [30, 80],  c: ['#7a6f8c', '#cec6dc', '#544a66'] },
    { id: 'globe',      nom: 'Poisson-Globe',  rarete: 'rare', forme: 'rond',   motif: 'points',
      cm: [10, 30],  c: ['#d9b64a', '#f3e5b4', '#8d6f1f'] },
    { id: 'meduse',     nom: 'Méduse Fantôme', rarete: 'rare', forme: 'meduse', motif: 'aucun',
      cm: [15, 40],  c: ['#a9c8e8', '#e6f2ff', '#7fa8d4'] },
    { id: 'piranha',    nom: 'Piranha Pâle',   rarete: 'rare', forme: 'plat',   motif: 'aucun',
      cm: [12, 28],  c: ['#b8b2ae', '#efe9e4', '#c94a3a'] },
    { id: 'axolotl',    nom: 'Axolotl',        rarete: 'rare', forme: 'triton', motif: 'aucun',
      cm: [10, 24],  c: ['#f0c4d2', '#fbe6ec', '#e08aa6'] },

    // ---- Legendaires ----
    { id: 'prisme',     nom: 'Poisson-Prisme', rarete: 'legende', forme: 'classique', motif: 'irise',
      cm: [30, 70],  c: ['#8ad8ff', '#f2fbff', '#ff9bd2'] },
    { id: 'carpe-chromee', nom: 'Carpe Chromée', rarete: 'legende', forme: 'plat',   motif: 'metal',
      cm: [40, 95],  c: ['#c9d2dc', '#f4f8fb', '#8d99a8'] },
    { id: 'silure-abysses', nom: 'Silure des Abysses', rarete: 'legende', forme: 'long', motif: 'lueur',
      cm: [90, 240], c: ['#241d3a', '#5a4d86', '#7cf0e0'] }
  ];

  function parId(id) {
    for (var i = 0; i < POISSONS.length; i++) if (POISSONS[i].id === id) return POISSONS[i];
    return null;
  }

  function rarete(cle) {
    for (var i = 0; i < RARETES.length; i++) if (RARETES[i].cle === cle) return RARETES[i];
    return RARETES[0];
  }

  // Un tirage pondere par la rarete : les Legendaires restent des evenements.
  function tirer() {
    var total = 0, i;
    for (i = 0; i < POISSONS.length; i++) total += rarete(POISSONS[i].rarete).poids;
    var d = Math.random() * total;
    for (i = 0; i < POISSONS.length; i++) {
      d -= rarete(POISSONS[i].rarete).poids;
      if (d <= 0) return POISSONS[i];
    }
    return POISSONS[0];
  }

  // La taille d'une prise, tiree dans la fourchette de l'espece. On
  // multiplie deux hasards : les tres gros specimens restent rares.
  function taille(p) {
    var k = Math.random() * Math.random();
    return Math.round(p.cm[0] + (p.cm[1] - p.cm[0]) * (1 - k));
  }

  // ==========================================================
  //  Le dessin
  // ==========================================================

  function ovale(p, cx, cy, rx, ry, col) {
    for (var dy = -ry; dy <= ry; dy++) {
      var k = 1 - (dy / (ry + 0.5)) * (dy / (ry + 0.5));
      if (k <= 0) continue;
      var w = Math.round(rx * Math.sqrt(k));
      p(cx - w, cy + dy, w * 2 + 1, 1, col);
    }
  }

  function queue(p, x0, cy, larg, haut, col) {
    for (var i = 0; i < larg; i++) {
      var h = Math.round(1 + (haut - 1) * (i / (larg - 1)));
      p(x0 + i, cy - h, 1, h * 2 + 1, col);
    }
  }

  function motifs(p, f, cx, cy, rx, ry) {
    var i;
    if (f.motif === 'rayures') {
      for (i = -rx + 3; i < rx - 1; i += 4) p(cx + i, cy - ry + 1, 1, ry * 2 - 1, f.c[2]);
    } else if (f.motif === 'points' || f.motif === 'ecailles') {
      for (i = 0; i < 9; i++) {
        var ang = i * 2.4;
        var px = Math.round(cx + Math.cos(ang) * rx * 0.55);
        var py = Math.round(cy + Math.sin(ang) * ry * 0.55);
        p(px, py, f.motif === 'points' ? 1 : 2, 1, f.c[2]);
      }
    } else if (f.motif === 'irise') {
      var arc = ['#ff6b8a', '#ffd166', '#8bf58b', '#7cc8ff', '#c79bff'];
      for (i = 0; i < arc.length; i++) p(cx - rx + 2 + i * 3, cy - ry + 1, 2, ry * 2 - 1, arc[i]);
    } else if (f.motif === 'metal') {
      p(cx - rx + 2, cy - ry + 1, rx * 2 - 3, 2, '#ffffff');
      p(cx - rx + 2, cy + 1, rx * 2 - 3, 1, 'rgba(255,255,255,.45)');
    } else if (f.motif === 'lueur') {
      for (i = -rx + 3; i < rx - 1; i += 5) {
        p(cx + i, cy - 2, 2, 2, f.c[2]);
        p(cx + i, cy + 2, 1, 1, f.c[2]);
      }
    } else if (f.motif === 'moustache') {
      p(cx - rx - 3, cy - 1, 4, 1, f.c[2]);
      p(cx - rx - 3, cy + 2, 4, 1, f.c[2]);
    }
  }

  function oeil(p, x, y, sombre) {
    p(x, y, 2, 2, sombre ? '#f2f6ff' : '#141826');
    p(x, y, 1, 1, sombre ? '#141826' : '#f2f6ff');
  }

  function dessiner(p, f) {
    var cx = 17, cy = 11;

    if (f.forme === 'classique' || f.forme === 'long' || f.forme === 'plat') {
      var rx = f.forme === 'long' ? 12 : (f.forme === 'plat' ? 8 : 10);
      var ry = f.forme === 'plat' ? 7 : (f.forme === 'long' ? 3 : 5);
      cx = 16;
      ovale(p, cx, cy, rx, ry, f.c[0]);
      ovale(p, cx + 1, cy + Math.max(1, ry - 2), rx - 3, Math.max(1, ry - 3), f.c[1]);
      // nageoire dorsale et ventrale
      p(cx - 3, cy - ry - 2, 8, 3, f.c[2]);
      p(cx - 1, cy + ry, 5, 2, f.c[2]);
      motifs(p, f, cx, cy, rx, ry);
      queue(p, cx + rx, cy, 6, ry, f.c[2]);
      oeil(p, cx - rx + 2, cy - 2, f.motif === 'lueur');
      return;
    }

    if (f.forme === 'rond') {
      ovale(p, 16, cy, 8, 8, f.c[0]);
      ovale(p, 16, cy + 3, 6, 4, f.c[1]);
      motifs(p, f, 16, cy, 8, 8);
      // les piquants
      for (var i = 0; i < 9; i++) {
        var a = i * 0.7;
        p(Math.round(16 + Math.cos(a) * 9), Math.round(cy + Math.sin(a) * 9), 2, 1, f.c[2]);
      }
      queue(p, 24, cy, 5, 4, f.c[2]);
      oeil(p, 10, cy - 3);
      return;
    }

    if (f.forme === 'raie') {
      for (var dy = -7; dy <= 7; dy++) {
        var w = Math.round(13 * (1 - Math.abs(dy) / 8));
        p(16 - w, cy + dy, w * 2, 1, f.c[0]);
      }
      ovale(p, 15, cy, 5, 4, f.c[1]);
      motifs(p, f, 16, cy, 10, 5);
      p(28, cy, 7, 1, f.c[2]);                    // la longue queue
      p(33, cy - 1, 2, 3, f.c[2]);
      oeil(p, 11, cy - 3);
      return;
    }

    if (f.forme === 'meduse') {
      ovale(p, 17, cy - 2, 9, 6, f.c[0]);
      p(8, cy - 2, 19, 4, f.c[0]);
      p(9, cy + 1, 17, 1, f.c[1]);
      for (var t = 0; t < 6; t++) {
        var x = 10 + t * 3;
        var h = 5 + ((t % 3) * 2);
        p(x, cy + 2, 1, h, f.c[2]);
        p(x + (t % 2 ? 1 : -1), cy + 2 + h, 1, 2, f.c[2]);
      }
      p(12, cy - 5, 4, 2, f.c[1]);
      return;
    }

    if (f.forme === 'crabe') {
      ovale(p, 18, cy, 8, 5, f.c[0]);
      p(11, cy - 1, 15, 3, f.c[1]);
      // pinces
      p(7, cy - 5, 5, 4, f.c[0]); p(6, cy - 6, 3, 2, f.c[2]);
      p(7, cy + 2, 5, 4, f.c[0]); p(6, cy + 5, 3, 2, f.c[2]);
      // pattes
      for (var l = 0; l < 3; l++) {
        p(18 + l * 4, cy - 8, 1, 4, f.c[2]);
        p(18 + l * 4, cy + 5, 1, 4, f.c[2]);
      }
      oeil(p, 13, cy - 3); oeil(p, 13, cy + 2);
      return;
    }

    if (f.forme === 'ecrevisse') {
      ovale(p, 20, cy, 9, 4, f.c[0]);
      p(13, cy - 2, 16, 4, f.c[1]);
      for (var s = 0; s < 4; s++) p(18 + s * 3, cy - 4, 1, 9, f.c[2]);
      p(6, cy - 5, 7, 4, f.c[0]); p(5, cy - 6, 3, 3, f.c[2]);
      p(6, cy + 2, 7, 4, f.c[0]); p(5, cy + 4, 3, 3, f.c[2]);
      queue(p, 29, cy, 5, 4, f.c[2]);
      p(9, cy - 8, 1, 4, f.c[2]); p(11, cy - 8, 1, 4, f.c[2]);
      oeil(p, 14, cy - 2);
      return;
    }

    if (f.forme === 'anguille') {
      for (var x2 = 4; x2 < 31; x2++) {
        var y2 = cy + Math.round(Math.sin((x2 - 4) / 4.2) * 4);
        p(x2, y2 - 2, 1, 5, f.c[0]);
        p(x2, y2 + 1, 1, 2, f.c[1]);
        if (x2 % 5 === 0) p(x2, y2 - 4, 1, 2, f.c[2]);
      }
      p(31, cy + Math.round(Math.sin(27 / 4.2) * 4) - 3, 3, 7, f.c[2]);
      motifs(p, f, 16, cy, 10, 3);
      oeil(p, 5, cy + Math.round(Math.sin(0.24) * 4) - 1);
      return;
    }

    if (f.forme === 'triton') {
      ovale(p, 17, cy, 11, 3, f.c[0]);
      ovale(p, 18, cy + 2, 9, 1, f.c[1]);
      p(9, cy - 3, 7, 6, f.c[0]);                 // la grosse tete
      // les branchies en panache
      for (var b = 0; b < 3; b++) {
        p(11 + b * 2, cy - 6, 1, 3, f.c[2]);
        p(10 + b * 2, cy - 7, 2, 1, f.c[2]);
        p(11 + b * 2, cy + 4, 1, 3, f.c[2]);
      }
      p(14, cy + 3, 2, 3, f.c[0]); p(22, cy + 3, 2, 3, f.c[0]);   // les pattes
      queue(p, 28, cy, 5, 4, f.c[0]);
      oeil(p, 11, cy - 1);
      return;
    }

    // Repli : un poisson ordinaire, si une forme inconnue apparaissait.
    ovale(p, 16, cy, 10, 5, f.c[0]);
    queue(p, 26, cy, 6, 5, f.c[2]);
    oeil(p, 8, cy - 2);
  }

  // Le cerne sombre, comme pour les sprites de balade.
  function cerner(ctx) {
    var img = ctx.getImageData(0, 0, L, H);
    var d = img.data;
    var plein = new Uint8Array(L * H), i;
    for (i = 0; i < L * H; i++) plein[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < L; x++) {
        i = y * L + x;
        if (plein[i]) continue;
        var voisin = false;
        for (var k = 0; k < 4; k++) {
          var nx = x + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
          if (nx < 0 || ny < 0 || nx >= L || ny >= H) continue;
          if (plein[ny * L + nx]) { voisin = true; break; }
        }
        if (!voisin) continue;
        d[i * 4] = CERNE[0]; d[i * 4 + 1] = CERNE[1];
        d[i * 4 + 2] = CERNE[2]; d[i * 4 + 3] = CERNE[3];
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var cache = {};

  function feuille(id) {
    if (cache[id]) return cache[id];
    var f = parId(id);
    if (!f) return null;
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = H;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;
    dessiner(function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    }, f);
    cerner(x);
    cache[id] = { canvas: cv, L: L, H: H };
    return cache[id];
  }

  // Une image utilisable dans une balise <img>, pour les listes en HTML.
  function url(id) {
    var f = feuille(id);
    return f ? f.canvas.toDataURL('image/png') : '';
  }

  window.POISSONS = {
    LISTE: POISSONS, RARETES: RARETES,
    parId: parId, rarete: rarete, tirer: tirer, taille: taille,
    feuille: feuille, url: url, L: L, H: H,
    vider: function () { cache = {}; }
  };
})();
