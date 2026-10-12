// La seconde carte du DinderTracker : Altera, la Terre du systeme
// stellaire. Elle n'apparait qu'une fois le bon code entre.
//
// Comme la carte du monde, c'est une grille de 64 colonnes sur 32 lignes
// en gros pixels ; mais celle-ci n'a pas de fichier : elle est peinte a
// la volee, a partir de la forme de ses huit terres.
(function () {
  var DP = window.DP;
  if (!DP) return;

  var COLS = 64, ROWS = 32, PX = 18, PY = 24;       // 1152 x 768, comme l'autre

  function ell(x, y, cx, cy, rx, ry) {
    var dx = (x - cx) / rx, dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }

  // ---------- Les huit terres ----------
  // Chacune dit si une case lui appartient, et nomme quatre lieux. Le
  // tracker en designe un par heure, comme sur Terre.
  var TERRES = [
    { id: 'croissant', nom: 'Le Croissant',
      lieux: ['Pointe-Haute', 'Val-Courbe', 'Lunaris', 'Pointe-Basse'],
      dans: function (x, y) {
        return ell(x, y, 10, 11, 8, 8) && !ell(x, y, 13.5, 11, 6.5, 6);
      } },
    { id: 'sept', nom: 'Les Sept-Îles',
      lieux: ['Prime-Île', 'Tierce', 'Quinte', 'Septime'],
      dans: function (x, y) {
        return ell(x, y, 22, 5, 2, 1.5) || ell(x, y, 27, 4, 1.6, 1.2) ||
               ell(x, y, 31, 6, 2, 1.5) || ell(x, y, 25, 8, 1.6, 1) ||
               ell(x, y, 35, 4, 1.6, 1.2) || ell(x, y, 29, 9, 1.2, 1) ||
               ell(x, y, 20, 8, 1.2, 1);
      } },
    { id: 'dos', nom: 'Le Grand Dos',
      lieux: ['Échine', 'Haut-Dos', 'Vertèbre', 'Les Reins'],
      dans: function (x, y) {
        return ell(x, y, 31, 14, 13, 2.6) || ell(x, y, 38, 15, 5, 3.4);
      } },
    { id: 'couronne', nom: 'La Couronne',
      lieux: ['Fleuron', 'L’Anneau', 'Port-Dedans', 'Diadème'],
      dans: function (x, y) {
        return ell(x, y, 53, 10, 7.5, 6) && !ell(x, y, 53, 10, 4, 3);
      } },
    { id: 'basmonde', nom: 'Le Bas-Monde',
      lieux: ['Sous-Vent', 'Fondrière', 'Basse-Cité', 'Le Talon'],
      dans: function (x, y) {
        return ell(x, y, 13, 24, 8, 3.4) || ell(x, y, 8, 22, 3, 3);
      } },
    { id: 'epine', nom: 'L’Épine',
      lieux: ['La Pointe', 'Mi-Épine', 'Racine', 'Le Dard'],
      dans: function (x, y) { return ell(x, y, 31, 23, 1.7, 5.5); } },
    { id: 'meridiane', nom: 'Méridiane',
      lieux: ['Zénith', 'Midi-Port', 'Solstice', 'Ombre-Courte'],
      dans: function (x, y) {
        return ell(x, y, 46, 23, 7, 4) || ell(x, y, 52, 20, 3, 2);
      } },
    { id: 'confins', nom: 'Les Confins',
      lieux: ['Fin-des-Cartes', 'Dernier-Quai', 'Le Rebord', 'Retour'],
      dans: function (x, y) {
        return ell(x, y, 60.5, 23, 2.4, 4) || ell(x, y, 1.5, 26, 2, 2.6);
      } }
  ];

  // A qui appartient une case : l'indice de sa terre, ou -1 pour la mer.
  function terreDe(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return -1;
    for (var i = 0; i < TERRES.length; i++) if (TERRES[i].dans(x, y)) return i;
    return -1;
  }

  // Les recifs de cristal tiennent lieu de banquise, en haut et en bas,
  // avec un bord decoupe.
  function recif(x, y) {
    if (y === 0 || y === ROWS - 1) return true;
    if (y === 1) return (x * 7 + 3) % 11 < 6;
    if (y === ROWS - 2) return (x * 5 + 1) % 9 < 5;
    return false;
  }

  // ---------- La peinture ----------
  var MER = '#231040', MER2 = '#2c1650';
  var SOL = '#e0922e', SOL2 = '#cc7f24', COTE = '#7a3a12';
  var CRISTAL = '#7cf0e8', CRISTAL2 = '#b8fff6';

  var image = null;

  function carte() {
    if (image) return image;
    var cv = document.createElement('canvas');
    cv.width = COLS * PX; cv.height = ROWS * PY;
    var c = cv.getContext('2d');
    if (!c) return '';
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var damier = (x + y) % 2, col;
        if (terreDe(x, y) !== -1) {
          // La cote : une case de terre qui touche la mer.
          var bord = terreDe(x - 1, y) === -1 || terreDe(x + 1, y) === -1 ||
                     terreDe(x, y - 1) === -1 || terreDe(x, y + 1) === -1;
          col = bord ? COTE : (damier ? SOL2 : SOL);
        } else if (recif(x, y)) {
          col = damier ? CRISTAL2 : CRISTAL;
        } else {
          col = damier ? MER2 : MER;
        }
        c.fillStyle = col;
        c.fillRect(x * PX, y * PY, PX, PY);
      }
    }
    image = cv.toDataURL('image/png');
    return image;
  }

  // ---------- Les lieux ----------
  // Quatre cases par terre, prises a intervalles reguliers parmi celles
  // qui ne touchent pas la mer : une balise tombe toujours sur du sol.
  var cases = null;

  function casesDesLieux() {
    if (cases) return cases;
    cases = TERRES.map(function (t, i) {
      var dedans = [], toutes = [];
      for (var y = 2; y < ROWS - 2; y++) {
        for (var x = 0; x < COLS; x++) {
          if (terreDe(x, y) !== i) continue;
          toutes.push([x, y]);
          if (terreDe(x - 1, y) !== -1 && terreDe(x + 1, y) !== -1 &&
              terreDe(x, y - 1) !== -1 && terreDe(x, y + 1) !== -1) dedans.push([x, y]);
        }
      }
      var l = dedans.length >= t.lieux.length ? dedans : toutes;
      return t.lieux.map(function (nom, k) {
        return l[Math.floor((k + 0.5) * l.length / t.lieux.length)];
      });
    });
    return cases;
  }

  // Les balises du moment : une par terre, qui saute a chaque heure
  // pleine, la meme pour tout le monde.
  function spots(quand) {
    var h = Math.floor((quand || DP.maintenant()) / 3600000);
    var C = casesDesLieux();
    return TERRES.map(function (t, k) {
      var n = t.lieux.length;
      var i = (((h + k * 3) % n) + n) % n;
      var c = C[k][i];
      return {
        id: t.id, continent: t.nom, ville: t.lieux[i], pays: 'Altéra',
        col: c[0], lig: c[1],
        x: (c[0] + 0.5) / COLS * 100,
        y: (c[1] + 0.5) / ROWS * 100
      };
    });
  }

  // ---------- L'heure d'Altera ----------
  // Un jour de vingt-six heures. L'heure locale suit la longitude, comme
  // chez nous.
  var JOUR = 26 * 3600;

  function secondes(spot, quand) {
    var t = Math.floor((quand || DP.maintenant()) / 1000);
    var dec = Math.round(spot.col / COLS * JOUR);
    return t + dec;
  }

  function deux(n) { return String(n).padStart(2, '0'); }

  function heure(spot, quand) {
    var s = ((secondes(spot, quand) % JOUR) + JOUR) % JOUR;
    return deux(Math.floor(s / 3600)) + ':' + deux(Math.floor(s % 3600 / 60)) + ':' + deux(s % 60);
  }

  function date(spot, quand) {
    var j = Math.floor(secondes(spot, quand) / JOUR);
    return 'Jour ' + (((j % 338) + 338) % 338 + 1) + ' sur 338  ·  heure d’Altéra';
  }

  window.STELLAIRE = {
    COLS: COLS, ROWS: ROWS, TERRES: TERRES, MONDE: 'altera',
    terreDe: terreDe, carte: carte, spots: spots, heure: heure, date: date
  };
})();
