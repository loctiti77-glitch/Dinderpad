// Le systeme stellaire : ses betes et ses gardiens.
//
// Dans le systeme solaire, une creature est une silhouette commune
// (rampant, insecte, meduse...) vetue de ses couleurs. Ici, chacune des
// soixante-quatre a son propre dessin, dans la meme case de 40 x 32 : on
// ne croise pas deux fois la meme forme d'un monde a l'autre.
//
// Chaque dessin recoit le pinceau p(x, y, largeur, hauteur, couleur) et
// les trois tons de la bete : a la base, b le clair, d le sombre. Les
// betes regardent vers la gauche, comme les autres.
(function () {
  var V = window.ODYVIE, B = window.BOSS;
  if (!V) return;

  var O = V.ovale, E = V.oeil, D = V.DESSINS;
  var BLANC = '#ffffff';

  // Un trait d'un point a un autre, d'une epaisseur donnee.
  function T(p, x0, y0, x1, y1, col, ep) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    ep = ep || 1;
    for (var i = 0; i <= n; i++) {
      p(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), ep, ep, col);
    }
  }

  // ==========================================================
  //  Cryos — la glace noire et ses reflets
  // ==========================================================

  // Un patineur : quatre longues pattes sur des lames, et son reflet.
  D['patineur-noir'] = function (p, a, b, d) {
    T(p, 17, 13, 5, 23, d); T(p, 19, 14, 12, 25, d);
    T(p, 23, 14, 29, 25, d); T(p, 25, 13, 35, 23, d);
    p(2, 24, 7, 1, b); p(9, 26, 7, 1, b); p(26, 26, 7, 1, b); p(32, 24, 7, 1, b);
    O(p, 21, 12, 5, 3, a); p(18, 10, 6, 1, b);
    p(13, 10, 4, 4, a); E(p, 13, 11);
    p(15, 29, 12, 1, d); p(18, 30, 6, 1, d);
  };

  // Une sphere creuse qui aspire : un tourbillon pour bouche.
  D['buveur-chaleur'] = function (p, a, b, d) {
    O(p, 20, 13, 11, 10, a);
    O(p, 20, 14, 7, 6, d); O(p, 20, 14, 4, 3, a); O(p, 20, 14, 2, 1, b);
    p(12, 6, 4, 1, b); p(24, 6, 4, 1, b);
    E(p, 13, 7); E(p, 25, 7);
    for (var i = 0; i < 4; i++) {
      p(11 + i * 6, 24, 2, 3, a); p(12 + i * 6, 27, 1, 3 - (i % 2), b);
    }
  };

  // Une tortue prise dans son bloc de glace.
  D['tortue-givre-noir'] = function (p, a, b, d) {
    p(7, 9, 26, 18, b); p(9, 7, 22, 2, b); p(7, 25, 26, 2, d);
    p(9, 11, 2, 12, BLANC); p(12, 10, 6, 1, BLANC);
    O(p, 21, 19, 8, 5, a); p(15, 16, 12, 2, d); p(19, 15, 4, 7, d);
    p(10, 18, 4, 3, a); p(15, 23, 3, 2, a); p(25, 23, 3, 2, a);
    p(11, 19, 1, 1, BLANC);
    p(12, 4, 3, 3, b); p(24, 3, 4, 4, b); p(30, 5, 2, 2, b);
  };

  // Un cristal debout qui marche sur quatre pattes greles.
  D['aiguille-vive'] = function (p, a, b, d) {
    for (var y = 1; y <= 21; y++) {
      var w = y < 9 ? Math.round((y - 1) / 2) : Math.round((21 - y) / 3) + 1;
      p(20 - w, y, w * 2 + 1, 1, a);
      p(20 - w, y, 1, 1, b);
    }
    p(20, 3, 1, 16, b); p(22, 9, 1, 9, d);
    E(p, 18, 10, BLANC);
    T(p, 19, 21, 11, 28, d); T(p, 20, 22, 16, 30, d);
    T(p, 21, 22, 25, 30, d); T(p, 22, 21, 30, 28, d);
  };

  // Une silhouette debout, et la meme, a l'envers, sous la glace.
  D['reflet'] = function (p, a, b, d) {
    O(p, 20, 4, 3, 3, a); p(16, 8, 9, 7, a); p(13, 9, 3, 6, a); p(25, 9, 3, 6, a);
    p(17, 15, 3, 3, d); p(21, 15, 3, 3, d);
    p(18, 3, 2, 2, BLANC); p(21, 3, 2, 2, BLANC);
    p(5, 18, 31, 1, BLANC);
    p(17, 19, 3, 3, b); p(21, 19, 3, 3, b);
    p(16, 22, 9, 6, b); p(13, 22, 3, 5, b); p(25, 22, 3, 5, b);
    O(p, 20, 29, 3, 2, b);
  };

  // De la neige noire qui remonte : des flocons, du plus petit au plus gros.
  D['nuee-flocons'] = function (p, a, b, d) {
    function flocon(x, y, r, col) {
      p(x - r, y, r * 2 + 1, 1, col); p(x, y - r, 1, r * 2 + 1, col);
      for (var k = 1; k < r; k++) {
        p(x - k, y - k, 1, 1, col); p(x + k, y - k, 1, 1, col);
        p(x - k, y + k, 1, 1, col); p(x + k, y + k, 1, 1, col);
      }
    }
    flocon(8, 26, 2, d); flocon(15, 21, 3, a); flocon(31, 24, 2, d);
    flocon(24, 13, 5, a); flocon(11, 9, 3, b); flocon(34, 7, 2, b); flocon(19, 3, 2, d);
    p(23, 12, 3, 3, BLANC); p(24, 13, 1, 1, '#141826');
  };

  // Une raie en fleche, vue du dessus a travers la glace.
  D['raie-miroir'] = function (p, a, b, d) {
    for (var dx = -16; dx <= 16; dx++) {
      var ep = Math.round(7 - Math.abs(dx) / 3);
      p(20 + dx, 6 + Math.round(Math.abs(dx) * 0.55), 1, Math.max(1, ep), a);
    }
    O(p, 20, 9, 4, 3, b);
    p(19, 13, 2, 12, d); p(20, 25, 1, 4, d);
    E(p, 16, 6); E(p, 23, 6);
    p(3, 3, 9, 1, BLANC); p(27, 2, 10, 1, BLANC); p(30, 22, 7, 1, BLANC);
  };

  // Un monolithe, un seul oeil, et deux dalles qui flottent a ses cotes.
  D['veilleur-zero'] = function (p, a, b, d) {
    p(14, 4, 12, 22, a); p(16, 2, 8, 2, a); p(14, 4, 2, 22, b);
    p(11, 26, 18, 3, d);
    p(16, 8, 8, 4, d); O(p, 20, 10, 2, 1, BLANC);
    p(17, 0, 2, 2, b); p(21, 0, 2, 2, b);
    p(5, 9, 5, 13, a); p(5, 9, 1, 13, b); p(30, 9, 5, 13, a); p(30, 9, 1, 13, b);
    p(18, 15, 4, 1, d); p(18, 19, 4, 1, d);
  };

  // ==========================================================
  //  Opaline — le verre et les perles
  // ==========================================================

  // Un scarabee qui pousse une perle plus grosse que lui.
  D['perlier'] = function (p, a, b, d) {
    O(p, 11, 18, 8, 8, b); p(7, 13, 3, 2, BLANC); p(6, 16, 1, 2, BLANC);
    O(p, 28, 20, 8, 5, a); p(23, 17, 10, 1, d); p(28, 16, 1, 9, d);
    p(19, 17, 4, 5, d); E(p, 19, 18);
    p(15, 15, 5, 1, d); p(15, 21, 5, 1, d);
    p(23, 25, 2, 4, d); p(28, 26, 2, 3, d); p(33, 25, 2, 4, d);
  };

  // Un escargot dont la coquille est une bulle de verre en spirale.
  D['souffleur-verre'] = function (p, a, b, d) {
    p(5, 25, 27, 3, a); p(3, 20, 5, 7, a);
    p(4, 15, 1, 5, d); p(8, 14, 1, 6, d); E(p, 3, 14, b); E(p, 7, 13, b);
    O(p, 22, 15, 9, 9, b); O(p, 22, 15, 6, 6, d); O(p, 23, 15, 4, 4, b); O(p, 23, 16, 1, 1, d);
    p(16, 9, 3, 2, BLANC);
    p(32, 27, 6, 1, b); p(36, 26, 2, 1, BLANC);
  };

  // Un cygne de profil, le cou en S.
  D['cygne-opale'] = function (p, a, b, d) {
    O(p, 25, 21, 11, 6, a); O(p, 27, 16, 8, 5, b); p(35, 15, 3, 3, b);
    p(13, 9, 3, 12, a); p(11, 5, 6, 5, a); p(15, 18, 4, 3, a);
    p(6, 7, 5, 2, d); p(6, 9, 2, 1, d);
    E(p, 12, 6);
    p(8, 27, 30, 1, BLANC); p(12, 29, 20, 1, BLANC);
  };

  // Un prisme sur trois pattes, qui traine un arc-en-ciel.
  D['prisme-errant'] = function (p, a, b, d) {
    for (var y = 2; y <= 20; y++) {
      var w = Math.round((y - 2) * 0.6);
      p(17 - w, y, w * 2 + 1, 1, a);
      if (w > 3) p(17 - w + 2, y, 2, 1, b);
    }
    p(6, 20, 23, 1, d);
    O(p, 17, 14, 3, 3, BLANC); O(p, 17, 14, 1, 2, '#141826');
    p(9, 21, 2, 7, d); p(16, 21, 2, 9, d); p(24, 21, 2, 7, d);
    p(27, 10, 11, 1, '#ff5a5a'); p(28, 12, 10, 1, '#ffd84a');
    p(29, 14, 9, 1, '#5ae88a'); p(30, 16, 8, 1, '#5ad8ff');
  };

  // Presque rien : un contour, et un oeil au milieu.
  D['guetteur-limpide'] = function (p, a, b, d) {
    for (var i = 0; i < 26; i++) {
      var ang = i / 26 * 6.283;
      p(Math.round(20 + Math.cos(ang) * 13), Math.round(13 + Math.sin(ang) * 10), 1, 1, i % 2 ? a : b);
    }
    O(p, 20, 13, 5, 4, BLANC); O(p, 20, 13, 2, 3, d); p(19, 11, 1, 1, BLANC);
    for (var k = 0; k < 4; k++) {
      p(12 + k * 5, 24, 1, 2, a); p(12 + k * 5, 27, 1, 2, b); p(13 + k * 5, 30, 1, 1, a);
    }
  };

  // Une araignee vue de face, au bout de son fil de verre.
  D['araignee-fil-verre'] = function (p, a, b, d) {
    p(20, 0, 1, 9, BLANC);
    T(p, 17, 12, 8, 5, d); T(p, 8, 5, 4, 12, d);
    T(p, 16, 14, 6, 16, d); T(p, 6, 16, 4, 24, d);
    T(p, 17, 17, 11, 22, d); T(p, 11, 22, 11, 29, d);
    T(p, 23, 12, 32, 5, d); T(p, 32, 5, 36, 12, d);
    T(p, 24, 14, 34, 16, d); T(p, 34, 16, 36, 24, d);
    T(p, 23, 17, 29, 22, d); T(p, 29, 22, 29, 29, d);
    O(p, 20, 14, 6, 6, a); p(18, 10, 4, 3, b); p(19, 9, 2, 5, b);
    p(17, 17, 2, 2, '#ff5a4a'); p(22, 17, 2, 2, '#ff5a4a');
    p(19, 20, 1, 2, d); p(21, 20, 1, 2, d);
  };

  // Un chapelet de perles qui roule a contre-pente.
  D['banc-perles'] = function (p, a, b, d) {
    var perles = [[5, 23, 3], [12, 18, 4], [21, 14, 5], [30, 17, 4], [36, 23, 2]];
    perles.forEach(function (q, i) {
      O(p, q[0], q[1], q[2], q[2], i % 2 ? b : a);
      p(q[0] - Math.max(1, q[2] - 2), q[1] - Math.max(1, q[2] - 2), 1, 1, BLANC);
    });
    p(19, 13, 2, 2, d); p(23, 13, 2, 2, d);
    p(3, 28, 34, 1, d);
  };

  // Une dame voilee, en robe cloche, couronnee de perles.
  D['dame-blanche'] = function (p, a, b, d) {
    for (var y = 9; y <= 29; y++) {
      var w = Math.round(3 + (y - 9) * 0.45);
      p(20 - w, y, w * 2 + 1, 1, (y >> 2) % 2 ? a : b);
    }
    O(p, 20, 6, 4, 4, b); p(14, 4, 2, 11, a); p(25, 4, 2, 11, a);
    p(16, 1, 2, 2, BLANC); p(19, 0, 3, 2, BLANC); p(23, 1, 2, 2, BLANC);
    p(18, 5, 1, 3, d); p(22, 5, 1, 3, d);
    p(7, 14, 7, 2, a); p(27, 14, 7, 2, a); p(6, 13, 2, 2, BLANC); p(33, 13, 2, 2, BLANC);
  };

  // ==========================================================
  //  Altera — le jardin d'en face
  // ==========================================================

  // Un herisson aux piquants de cristal.
  D['herisson-ambre'] = function (p, a, b, d) {
    for (var i = 0; i < 8; i++) {
      p(11 + i * 3, 9 + (i % 2) * 2 + Math.abs(i - 3), 2, 8, a);
      p(11 + i * 3, 9 + (i % 2) * 2 + Math.abs(i - 3), 2, 2, b);
    }
    O(p, 22, 21, 12, 6, d);
    p(6, 19, 7, 6, b); p(3, 21, 4, 3, b); p(2, 21, 2, 2, '#141826');
    E(p, 8, 20);
    p(13, 26, 4, 2, d); p(26, 26, 4, 2, d);
  };

  // Un merle sur sa branche, en train de chanter.
  D['merle-violet'] = function (p, a, b, d) {
    O(p, 21, 15, 8, 6, a); O(p, 23, 16, 5, 3, b);
    O(p, 13, 9, 4, 4, a); p(6, 9, 4, 2, '#ffb02e'); p(7, 11, 3, 1, '#ffb02e');
    E(p, 11, 8);
    p(27, 17, 6, 3, d); p(31, 19, 6, 2, d);
    p(19, 21, 1, 4, d); p(23, 21, 1, 4, d);
    p(5, 25, 31, 2, d); p(30, 23, 4, 2, b);
    p(3, 2, 1, 4, b); p(4, 2, 2, 1, b); p(2, 5, 2, 2, b);
  };

  // Un escargot qui porte une coquille de rechange.
  D['escargot-double'] = function (p, a, b, d) {
    p(5, 25, 28, 3, a); p(3, 19, 5, 8, a);
    p(4, 14, 1, 5, d); p(8, 13, 1, 6, d); E(p, 3, 13, b); E(p, 7, 12, b);
    O(p, 18, 18, 7, 7, b); O(p, 18, 18, 4, 4, d); O(p, 18, 18, 2, 2, b);
    O(p, 28, 9, 5, 5, b); O(p, 28, 9, 3, 3, d); O(p, 28, 9, 1, 1, b);
    p(24, 13, 2, 3, d);
  };

  // Un renard assis, la queue enroulee.
  D['renard-cendre'] = function (p, a, b, d) {
    O(p, 22, 20, 7, 8, a); p(16, 16, 5, 9, b);
    O(p, 15, 10, 5, 4, a);
    p(11, 3, 3, 5, a); p(17, 3, 3, 5, a); p(12, 5, 1, 2, d); p(18, 5, 1, 2, d);
    p(8, 11, 5, 3, b); p(7, 11, 2, 2, '#141826');
    E(p, 13, 9);
    O(p, 31, 24, 6, 4, a); O(p, 35, 21, 3, 3, b);
    p(16, 25, 3, 4, d); p(21, 25, 3, 4, d);
  };

  // Une guepe en vol, l'abdomen raye, les ailes en lames de cristal.
  D['guepe-cristal'] = function (p, a, b, d) {
    for (var i = 0; i < 9; i++) {
      p(15 + i, 2 + Math.round(i * 0.4), 2, 9 - i, b);
      p(24 + i, 4 + Math.round(i * 0.3), 2, 8 - Math.round(i * 0.8), b);
    }
    O(p, 26, 18, 5, 4, a); p(24, 14, 2, 8, d); p(28, 15, 2, 7, d);
    O(p, 32, 22, 3, 3, d); p(35, 25, 2, 2, a); p(37, 27, 2, 1, BLANC);
    O(p, 18, 15, 4, 4, d);
    O(p, 11, 14, 4, 4, a); p(8, 13, 3, 3, '#ff5a4a'); p(8, 13, 1, 1, BLANC);
    p(9, 8, 1, 4, d); p(12, 7, 1, 5, d);
    p(16, 19, 1, 5, d); p(19, 19, 1, 6, d); p(22, 20, 1, 5, d);
  };

  // Un chien de garde debout, la chaine au cou.
  D['chien-de-garde'] = function (p, a, b, d) {
    p(13, 13, 17, 7, a); p(15, 18, 13, 2, b);
    p(6, 8, 8, 8, a); p(11, 4, 3, 6, d); p(3, 12, 4, 4, b); p(2, 12, 2, 2, '#141826');
    p(5, 16, 5, 1, BLANC);
    p(7, 9, 3, 1, d); E(p, 8, 10);
    p(14, 20, 3, 9, a); p(19, 20, 3, 8, d); p(24, 20, 3, 8, d); p(27, 20, 3, 9, a);
    p(30, 8, 2, 7, a);
    p(13, 11, 2, 7, '#7cf0e8');
    p(15, 22, 1, 1, b); p(17, 24, 1, 1, b); p(33, 26, 1, 1, b); p(35, 28, 1, 1, b);
    p(36, 24, 2, 6, d);
  };

  // Un hibou de face, immobile sur son poteau.
  D['hibou-fixe'] = function (p, a, b, d) {
    p(12, 2, 3, 5, a); p(25, 2, 3, 5, a);
    O(p, 20, 13, 9, 10, a); O(p, 20, 17, 5, 6, b);
    p(17, 15, 2, 1, d); p(21, 15, 2, 1, d); p(19, 18, 2, 1, d); p(17, 21, 2, 1, d); p(21, 21, 2, 1, d);
    O(p, 16, 9, 4, 4, '#ffe08a'); O(p, 24, 9, 4, 4, '#ffe08a');
    O(p, 16, 9, 1, 2, '#141826'); O(p, 24, 9, 1, 2, '#141826');
    p(19, 11, 2, 3, '#ffb02e');
    p(15, 23, 3, 2, b); p(22, 23, 3, 2, b);
    p(17, 25, 6, 6, d);
  };

  // Une masse noire qui flotte, un oeil immense et d'autres plus petits.
  D['autre-chose'] = function (p, a, b, d) {
    O(p, 20, 12, 12, 11, a);
    O(p, 20, 12, 7, 5, '#f2f6ff'); O(p, 20, 12, 3, 4, '#7cf0e8'); p(19, 8, 2, 9, '#0a0410');
    p(9, 6, 2, 2, BLANC); p(30, 7, 2, 2, BLANC); p(11, 18, 2, 2, BLANC);
    p(28, 18, 2, 2, BLANC); p(19, 2, 2, 2, BLANC);
    p(12, 23, 2, 6, d); p(17, 23, 2, 8, d); p(22, 23, 2, 5, d); p(27, 23, 2, 7, d);
    p(11, 29, 2, 2, b); p(26, 30, 2, 1, b);
  };

  // ==========================================================
  //  Viridia — la jungle
  // ==========================================================

  // Une sauterelle qui a tout d'une feuille.
  D['saute-feuille'] = function (p, a, b, d) {
    for (var dx = -13; dx <= 13; dx++) {
      var h = Math.round(6 * (1 - Math.abs(dx) / 13));
      p(20 + dx, 13 - h, 1, h * 2 + 1, a);
    }
    p(7, 13, 27, 1, d);
    for (var i = 0; i < 5; i++) { p(12 + i * 4, 10, 1, 3, b); p(14 + i * 4, 14, 1, 3, b); }
    T(p, 26, 15, 33, 6, d); T(p, 33, 6, 36, 24, d); p(35, 24, 4, 1, d);
    p(12, 17, 1, 7, d); p(17, 18, 1, 6, d);
    E(p, 9, 12);
    p(6, 6, 1, 6, d); p(4, 5, 2, 1, d);
  };

  // Une limace sous son parapluie de feuille, et la pluie autour.
  D['limace-pluie'] = function (p, a, b, d) {
    p(7, 23, 25, 5, a); p(5, 24, 2, 3, a); p(32, 25, 3, 2, a); p(9, 27, 21, 1, b);
    p(8, 17, 1, 6, d); p(12, 16, 1, 7, d); E(p, 7, 15, b); E(p, 11, 14, b);
    p(19, 14, 2, 9, d);
    O(p, 20, 10, 13, 5, b);
    for (var i = 0; i < 6; i++) p(8 + i * 5, 14, 3, 2, d);
    p(34, 3, 1, 3, a); p(37, 10, 1, 3, a); p(3, 5, 1, 3, a); p(1, 14, 1, 3, a);
  };

  // Une liane qui pend avec les autres, la tete en bas.
  D['liane-vive'] = function (p, a, b, d) {
    var x = 20;
    for (var y = 0; y <= 23; y++) {
      x = Math.round(20 + Math.sin(y / 3.6) * 7);
      p(x - 2, y, 4, 1, a); p(x - 2, y, 1, 1, b);
      if (y % 6 === 2) { p(x + 2, y, 5, 2, b); p(x + 6, y - 1, 2, 1, b); }
      if (y % 6 === 5) { p(x - 7, y, 5, 2, b); p(x - 9, y - 1, 2, 1, b); }
    }
    O(p, x, 26, 4, 3, a); E(p, x - 3, 25); p(x, 30, 1, 2, '#ff5a4a');
  };

  // Trois lanternes sur leurs tiges, de hauteurs inegales.
  D['spore-lanterne'] = function (p, a, b, d) {
    p(11, 14, 2, 14, d); p(20, 9, 2, 19, d); p(29, 17, 2, 11, d);
    O(p, 12, 11, 5, 5, a); O(p, 12, 11, 2, 2, BLANC);
    O(p, 21, 6, 6, 5, a); O(p, 21, 6, 3, 2, BLANC);
    O(p, 30, 14, 4, 4, a); O(p, 30, 14, 1, 1, BLANC);
    p(18, 6, 2, 2, d); p(23, 6, 2, 2, d);
    p(5, 28, 30, 2, d);
    p(4, 6, 1, 1, b); p(36, 8, 1, 1, b); p(27, 2, 1, 1, b);
  };

  // Un crapaud de face, un petit jardin sur le dos.
  D['crapaud-mousse'] = function (p, a, b, d) {
    O(p, 20, 21, 14, 7, a); O(p, 20, 25, 8, 3, b);
    O(p, 12, 14, 4, 4, a); O(p, 28, 14, 4, 4, a); E(p, 11, 13); E(p, 27, 13);
    p(10, 21, 20, 1, d);
    p(17, 7, 1, 8, d); p(16, 4, 3, 3, '#f0d83a'); p(22, 9, 1, 6, d); p(21, 7, 3, 2, b);
    p(25, 11, 1, 4, d); p(14, 10, 1, 4, d);
    p(5, 26, 6, 3, d); p(29, 26, 6, 3, d);
  };

  // Une mante debout, les bras replies.
  D['mante-canopee'] = function (p, a, b, d) {
    T(p, 13, 9, 24, 21, a, 3); O(p, 29, 24, 8, 3, a); p(24, 23, 12, 1, b);
    O(p, 12, 6, 4, 3, a); p(8, 4, 3, 3, '#f0d83a'); p(14, 4, 3, 3, '#f0d83a');
    p(9, 5, 1, 1, '#141826'); p(15, 5, 1, 1, '#141826');
    p(10, 0, 1, 4, d); p(14, 0, 1, 4, d);
    T(p, 14, 12, 5, 14, d, 2); T(p, 5, 14, 9, 20, d, 2);
    T(p, 17, 15, 9, 19, d); T(p, 9, 19, 12, 24, d);
    T(p, 22, 20, 18, 30, d); T(p, 27, 23, 29, 30, d); T(p, 32, 25, 37, 30, d);
  };

  // Un perroquet sur son perchoir, la queue qui pend.
  D['perroquet-echo'] = function (p, a, b, d) {
    O(p, 21, 14, 6, 8, a); O(p, 24, 15, 3, 6, d);
    O(p, 15, 7, 5, 5, a); O(p, 14, 6, 2, 2, BLANC); p(14, 6, 1, 1, '#141826');
    p(7, 6, 5, 3, '#ffd84a'); p(7, 9, 3, 2, '#ffd84a');
    p(14, 0, 2, 3, b); p(17, 0, 2, 4, b); p(20, 1, 2, 3, b);
    p(21, 22, 3, 9, b); p(24, 22, 2, 7, d);
    p(7, 22, 13, 2, '#5a3a1e'); p(15, 20, 2, 2, d); p(18, 20, 2, 2, d);
  };

  // Une souche qui s'est levee sur ses racines.
  D['pere-racine'] = function (p, a, b, d) {
    p(12, 8, 16, 16, a); p(12, 8, 2, 16, b); p(18, 9, 1, 14, d); p(23, 10, 1, 12, d);
    p(12, 5, 3, 3, a); p(18, 4, 4, 4, a); p(25, 6, 3, 2, a);
    p(14, 13, 4, 3, '#0a0a0a'); p(22, 13, 4, 3, '#0a0a0a');
    p(15, 14, 2, 1, '#f0d83a'); p(23, 14, 2, 1, '#f0d83a');
    p(16, 19, 8, 2, '#0a0a0a');
    T(p, 13, 24, 3, 29, d, 3); T(p, 17, 24, 13, 29, d, 3);
    T(p, 22, 24, 25, 29, d, 3); T(p, 26, 24, 35, 29, d, 3);
    p(28, 11, 7, 2, a); p(34, 5, 2, 7, a); p(31, 2, 6, 3, b);
    p(4, 13, 8, 2, a); p(3, 10, 2, 4, a);
  };

  // ==========================================================
  //  Ferron — le fer et la foudre
  // ==========================================================

  // De la limaille dressee en eventail.
  D['limaille'] = function (p, a, b, d) {
    for (var i = 0; i < 11; i++) {
      var ang = (15 + i * 15) * Math.PI / 180;
      var l = 13 + (i % 3) * 4;
      T(p, 20, 26, Math.round(20 + Math.cos(ang) * l), Math.round(26 - Math.sin(ang) * l), i % 2 ? a : d);
      p(Math.round(20 + Math.cos(ang) * l), Math.round(26 - Math.sin(ang) * l), 1, 1, BLANC);
    }
    O(p, 20, 27, 7, 3, d);
    p(17, 25, 2, 2, BLANC); p(22, 25, 2, 2, BLANC);
  };

  // Un clou, la tete en haut, sur quatre pattes pliees.
  D['clou-vif'] = function (p, a, b, d) {
    p(12, 2, 16, 3, b); p(13, 5, 14, 1, d);
    p(17, 6, 6, 16, a); p(17, 6, 1, 16, b); p(18, 22, 4, 3, a); p(19, 25, 2, 3, d); p(20, 28, 1, 2, d);
    p(18, 9, 2, 2, BLANC); p(21, 9, 2, 2, BLANC); p(18, 9, 1, 1, '#141826'); p(21, 9, 1, 1, '#141826');
    T(p, 17, 14, 10, 11, d); T(p, 10, 11, 7, 22, d);
    T(p, 17, 18, 12, 17, d); T(p, 12, 17, 11, 25, d);
    T(p, 22, 14, 29, 11, d); T(p, 29, 11, 32, 22, d);
    T(p, 22, 18, 27, 17, d); T(p, 27, 17, 28, 25, d);
  };

  // Une enclume qui marche, la foudre sur le dos.
  D['tortue-enclume'] = function (p, a, b, d) {
    p(9, 10, 25, 5, a); p(9, 10, 25, 1, b); p(4, 11, 5, 3, a); p(1, 12, 3, 1, a);
    p(16, 15, 12, 5, d); p(11, 20, 21, 4, a); p(11, 20, 21, 1, b);
    p(5, 16, 6, 5, b); E(p, 6, 17);
    p(12, 24, 4, 5, d); p(27, 24, 4, 5, d);
    p(23, 0, 2, 3, '#3ad0ff'); p(21, 3, 3, 2, '#3ad0ff'); p(22, 5, 2, 4, '#3ad0ff'); p(22, 8, 1, 2, BLANC);
  };

  // Un eclair qui a appris a ramper.
  D['anguille-arc'] = function (p, a, b, d) {
    var pts = [[6, 9], [13, 20], [19, 9], [26, 22], [32, 11], [37, 18]];
    for (var i = 0; i < pts.length - 1; i++) {
      T(p, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], a, 3);
    }
    for (i = 0; i < pts.length - 1; i++) {
      T(p, pts[i][0] + 1, pts[i][1] + 1, pts[i + 1][0] + 1, pts[i + 1][1] + 1, BLANC);
    }
    O(p, 5, 8, 4, 3, a); E(p, 3, 7);
    p(1, 9, 2, 1, d);
    p(10, 4, 1, 1, BLANC); p(23, 3, 1, 1, BLANC); p(30, 27, 1, 1, BLANC); p(16, 27, 1, 1, BLANC);
  };

  // Un dome qui broute le metal, et laisse de la rouille derriere lui.
  D['rouilleur'] = function (p, a, b, d) {
    O(p, 17, 18, 11, 8, a); p(6, 20, 23, 5, a);
    p(11, 14, 4, 3, d); p(19, 12, 5, 3, d); p(23, 18, 3, 3, d);
    p(6, 25, 23, 2, d);
    for (var i = 0; i < 7; i++) p(7 + i * 3, 25, 1, 2, BLANC);
    E(p, 9, 17); E(p, 14, 16);
    p(30, 26, 8, 2, b); p(33, 24, 3, 2, b); p(36, 23, 2, 1, b);
  };

  // Une tourelle sur trepied, qui balaie de son oeil unique.
  D['sentinelle-froide'] = function (p, a, b, d) {
    p(20, 0, 1, 4, b); p(19, 0, 3, 1, '#3ad0ff');
    O(p, 20, 9, 9, 6, a); p(12, 7, 17, 4, d); p(15, 8, 5, 2, '#3ad0ff'); p(16, 8, 2, 1, BLANC);
    p(12, 4, 10, 1, b);
    p(18, 15, 5, 3, d);
    T(p, 19, 18, 8, 28, a, 2); T(p, 20, 18, 20, 29, a, 2); T(p, 21, 18, 31, 28, a, 2);
    p(5, 29, 6, 2, d); p(18, 30, 6, 1, d); p(30, 29, 6, 2, d);
  };

  // Un aimant en fer a cheval, les poles en bas.
  D['aimant-errant'] = function (p, a, b, d) {
    p(12, 3, 16, 6, a); p(10, 5, 6, 16, a); p(24, 5, 6, 16, a);
    p(12, 3, 16, 1, b); p(10, 5, 1, 16, b);
    p(10, 21, 6, 4, '#e84a4a'); p(24, 21, 6, 4, '#e8e8f0');
    E(p, 15, 5); E(p, 23, 5);
    p(18, 13, 1, 3, '#3ad0ff'); p(21, 15, 1, 3, '#3ad0ff'); p(19, 19, 2, 1, '#3ad0ff');
    p(13, 28, 2, 1, d); p(19, 30, 3, 1, d); p(25, 28, 2, 2, d); p(7, 27, 1, 2, d); p(32, 29, 2, 1, d);
  };

  // Un colosse aux poings comme des marteaux.
  D['forgeron'] = function (p, a, b, d) {
    p(13, 9, 14, 13, a); p(16, 11, 8, 6, b);
    p(17, 3, 6, 6, d); p(18, 5, 1, 2, '#ff9a2a'); p(21, 5, 1, 2, '#ff9a2a');
    p(9, 11, 4, 4, d); p(27, 11, 4, 4, d);
    p(1, 13, 9, 10, a); p(1, 13, 9, 2, b); p(30, 13, 9, 10, a); p(30, 13, 9, 2, b);
    p(3, 17, 5, 1, d); p(32, 17, 5, 1, d);
    p(14, 22, 5, 7, d); p(21, 22, 5, 7, d);
    p(4, 25, 1, 1, '#ffd84a'); p(7, 27, 1, 1, '#ffd84a'); p(33, 26, 1, 1, '#ffd84a'); p(36, 24, 1, 1, '#ffd84a');
  };

  // ==========================================================
  //  Brisure — les eclats et le vide
  // ==========================================================

  // Un sauteur en plein bond, entre deux eclats.
  D['saute-vide'] = function (p, a, b, d) {
    O(p, 21, 9, 5, 4, a); p(13, 7, 5, 5, a); E(p, 14, 8);
    p(12, 3, 1, 4, d); p(15, 2, 1, 5, d);
    T(p, 21, 13, 26, 17, d); T(p, 26, 17, 19, 21, d); T(p, 19, 21, 25, 25, d);
    T(p, 18, 13, 14, 17, d);
    p(0, 26, 10, 6, d); p(0, 26, 10, 1, b); p(30, 28, 10, 4, d); p(30, 28, 10, 1, b);
    p(6, 20, 1, 1, b); p(8, 16, 1, 1, b); p(11, 13, 1, 1, b);
  };

  // Une croute de lichen en rosette, et ses petites coupes.
  D['lichen-rose'] = function (p, a, b, d) {
    O(p, 20, 22, 15, 6, d);
    O(p, 10, 20, 5, 4, a); O(p, 20, 18, 7, 5, a); O(p, 30, 20, 5, 4, a);
    O(p, 15, 25, 5, 3, b); O(p, 26, 25, 5, 3, b);
    p(13, 9, 1, 8, d); p(12, 7, 3, 2, b); p(24, 5, 1, 9, d); p(23, 3, 3, 2, b);
    p(30, 10, 1, 7, d); p(29, 8, 3, 2, b);
    E(p, 17, 17); E(p, 22, 17);
  };

  // Un crabe a une seule grosse pince, sur le rebord.
  D['crabe-arete'] = function (p, a, b, d) {
    p(14, 14, 15, 8, a); p(16, 12, 11, 2, a); p(16, 19, 11, 2, b);
    O(p, 7, 10, 6, 5, a); p(1, 10, 7, 1, d); p(10, 14, 5, 2, a);
    p(29, 15, 4, 2, a); p(32, 12, 4, 3, a);
    p(18, 5, 1, 7, d); p(23, 5, 1, 7, d); E(p, 17, 3); E(p, 22, 3);
    T(p, 15, 21, 11, 26, d); T(p, 18, 22, 16, 27, d);
    T(p, 26, 22, 28, 27, d); T(p, 28, 21, 33, 26, d);
    p(0, 28, 31, 3, d); p(0, 28, 31, 1, b);
  };

  // Un fileur qui retient deux eclats par ses fils.
  D['fileur-gouffre'] = function (p, a, b, d) {
    p(0, 7, 7, 16, d); p(0, 7, 7, 1, b); p(33, 7, 7, 16, d); p(33, 7, 7, 1, b);
    T(p, 7, 10, 17, 14, BLANC); T(p, 7, 20, 17, 17, BLANC);
    T(p, 33, 10, 23, 14, BLANC); T(p, 33, 20, 23, 17, BLANC);
    O(p, 20, 15, 5, 6, a); p(18, 11, 4, 2, b);
    p(19, 21, 2, 5, d); p(20, 26, 1, 5, BLANC);
    T(p, 16, 12, 12, 7, d); T(p, 24, 12, 28, 7, d);
    T(p, 16, 19, 12, 25, d); T(p, 24, 19, 28, 25, d);
    p(17, 14, 2, 2, '#ff5a4a'); p(21, 14, 2, 2, '#ff5a4a'); p(19, 17, 2, 1, '#ff5a4a');
  };

  // Un morceau de planete qui s'est mis a marcher.
  D['eclat-vif'] = function (p, a, b, d) {
    p(17, 2, 5, 3, a); p(13, 5, 12, 4, a); p(10, 9, 18, 7, a); p(12, 16, 15, 5, a); p(15, 21, 10, 3, a);
    p(13, 5, 4, 11, b); p(23, 11, 5, 9, d);
    p(19, 6, 1, 12, '#ff7ac0'); p(20, 12, 3, 1, '#ff7ac0');
    E(p, 14, 11, BLANC);
    p(15, 24, 3, 5, d); p(22, 24, 3, 5, d);
  };

  // Une arche sombre qui nage dans le vide, aux ouies qui luisent.
  D['raie-abime'] = function (p, a, b, d) {
    for (var dx = -18; dx <= 18; dx++) {
      var k = Math.sqrt(1 - (dx / 18.5) * (dx / 18.5));
      var haut = Math.round(15 - 10 * k);
      p(20 + dx, haut, 1, Math.max(2, Math.round(3 + 6 * (1 - Math.abs(dx) / 18))), a);
    }
    p(14, 9, 1, 4, '#ff7ac0'); p(17, 8, 1, 5, '#ff7ac0'); p(23, 8, 1, 5, '#ff7ac0'); p(26, 9, 1, 4, '#ff7ac0');
    p(17, 5, 2, 1, BLANC); p(22, 5, 2, 1, BLANC);
    p(20, 14, 1, 10, b); p(21, 24, 3, 1, b); p(24, 25, 1, 3, b);
    p(4, 26, 1, 1, BLANC); p(33, 22, 1, 1, BLANC); p(10, 29, 1, 1, BLANC);
  };

  // Une silhouette encapuchonnee dont tout pend, et qui pleure rose.
  D['pleureuse'] = function (p, a, b, d) {
    O(p, 20, 7, 8, 7, a); O(p, 20, 8, 4, 4, d);
    p(18, 7, 1, 3, '#ff7ac0'); p(22, 7, 1, 3, '#ff7ac0');
    for (var i = 0; i < 7; i++) {
      p(8 + i * 4, 12, 2, 9 + ((i * 5) % 7), i % 2 ? a : b);
    }
    p(14, 28, 1, 2, '#ff7ac0'); p(26, 26, 1, 2, '#ff7ac0'); p(20, 29, 1, 2, '#ff7ac0');
  };

  // Un geant qui serre deux moities de monde l'une contre l'autre.
  D['recolleur'] = function (p, a, b, d) {
    O(p, 11, 17, 9, 10, a); O(p, 29, 17, 9, 10, a);
    p(4, 13, 4, 6, b); p(31, 22, 4, 3, b);
    p(19, 7, 2, 20, '#ff7ac0'); p(20, 9, 1, 16, BLANC);
    p(16, 0, 8, 6, d); p(17, 2, 2, 2, '#ff7ac0'); p(21, 2, 2, 2, '#ff7ac0');
    p(5, 9, 30, 3, d); p(5, 22, 30, 3, d);
    p(9, 27, 7, 4, d); p(24, 27, 7, 4, d);
  };

  // ==========================================================
  //  Pyrrhe — le sable et le verre
  // ==========================================================

  // Une boule a grandes pattes, qui saute pour ne pas cuire.
  D['puce-sable'] = function (p, a, b, d) {
    O(p, 17, 20, 6, 5, a); O(p, 18, 21, 3, 2, b);
    E(p, 13, 18); p(8, 20, 5, 1, d);
    T(p, 20, 19, 28, 7, d, 2); T(p, 28, 7, 33, 24, d, 2); p(32, 25, 6, 2, d);
    p(13, 25, 1, 4, d); p(17, 25, 1, 4, d);
    p(5, 6, 3, 1, b); p(8, 5, 3, 1, b); p(11, 6, 3, 1, b);
    p(4, 10, 3, 1, b); p(7, 9, 3, 1, b); p(10, 10, 3, 1, b);
  };

  // Un lezard de verre, vu du dessus : on lui voit l'echine.
  D['lezard-verre'] = function (p, a, b, d) {
    for (var t = 0; t <= 30; t++) {
      var y = Math.round(15 + Math.sin(t / 5) * 4);
      var ep = t > 21 ? Math.max(1, Math.round((31 - t) / 3)) : 5;
      p(7 + t, y - (ep >> 1), 1, ep, b);
      p(7 + t, y, 1, 1, d);
      if (t % 3 === 0 && t < 22) p(7 + t, y - 1, 1, 3, d);
    }
    O(p, 6, 15, 4, 3, b); E(p, 4, 13); E(p, 4, 16);
    T(p, 12, 16, 9, 23, d); p(7, 23, 4, 1, d); T(p, 13, 14, 11, 7, d); p(9, 6, 4, 1, d);
    T(p, 24, 12, 27, 5, d); p(26, 4, 4, 1, d); T(p, 25, 17, 28, 24, d); p(27, 25, 4, 1, d);
    p(15, 17, 3, 2, a);
  };

  // Une cloche qui marche, son battant sous elle.
  D['sonneur'] = function (p, a, b, d) {
    p(18, 1, 5, 4, d); p(19, 2, 3, 2, b);
    for (var y = 5; y <= 21; y++) {
      var w = Math.round(4 + (y - 5) * 0.5 + (y > 18 ? 2 : 0));
      p(20 - w, y, w * 2 + 1, 1, a);
    }
    p(16, 7, 2, 12, b); p(6, 22, 29, 2, d);
    E(p, 16, 13); E(p, 23, 13);
    p(19, 24, 3, 3, d); O(p, 20, 28, 2, 2, b);
    p(10, 24, 3, 4, d); p(28, 24, 3, 4, d);
    p(2, 9, 1, 7, b); p(0, 11, 1, 3, b); p(37, 9, 1, 7, b); p(39, 11, 1, 3, b);
  };

  // Une vipere enroulee, aux ecailles de vitrail.
  D['vipere-vitrail'] = function (p, a, b, d) {
    var tons = [a, '#ff6a4a', b, '#5ad8ff'];
    var x = 0, y = 0;
    for (var i = 0; i < 46; i++) {
      var ang = i * 0.27, r = 2.5 + ang * 1.05;
      x = Math.round(22 + Math.cos(ang) * r * 1.25);
      y = Math.round(18 + Math.sin(ang) * r * 0.82);
      p(x - 1, y - 1, 3, 3, tons[(i >> 1) % 4]);
    }
    O(p, x - 2, y - 4, 4, 3, a); E(p, x - 5, y - 5);
    p(x - 8, y - 4, 3, 1, '#ff5a4a');
  };

  // Un mirage : des lignes qui tremblent, et deux yeux au milieu.
  D['mirage'] = function (p, a, b, d) {
    for (var y = 3; y <= 29; y += 2) {
      var w = Math.round(15 - Math.abs(y - 16) * 0.95);
      var dec = (y % 4 === 1) ? 2 : -1;
      if (w < 2) continue;
      p(20 - w + dec, y, w, 1, y < 16 ? a : b);
      p(22 + dec, y, w - 2, 1, y < 16 ? b : a);
    }
    E(p, 15, 13); E(p, 23, 13);
    p(17, 19, 6, 1, d);
  };

  // Un scorpion de profil, la queue par-dessus, le dard chauffe a blanc.
  D['scorpion-braise'] = function (p, a, b, d) {
    p(12, 19, 15, 5, a); p(15, 19, 1, 5, d); p(19, 19, 1, 5, d); p(23, 19, 1, 5, d);
    p(8, 19, 5, 5, a); E(p, 9, 20);
    p(3, 17, 6, 2, d); p(0, 13, 5, 5, a); p(0, 15, 3, 1, d);
    p(3, 24, 6, 2, d); p(0, 24, 4, 4, a); p(0, 26, 2, 1, d);
    O(p, 29, 18, 3, 3, a); O(p, 33, 14, 3, 3, a); O(p, 34, 9, 3, 3, a);
    O(p, 31, 5, 3, 3, a); O(p, 27, 4, 2, 2, a);
    p(23, 4, 3, 2, BLANC); p(21, 5, 2, 1, '#ffe08a');
    for (var i = 0; i < 4; i++) { p(13 + i * 4, 24, 1, 4, d); p(12 + i * 4, 28, 2, 1, d); }
  };

  // Un vautour voute sur son rocher, le cou nu.
  D['vautour-cuivre'] = function (p, a, b, d) {
    O(p, 23, 17, 8, 8, a);
    p(14, 8, 5, 13, d); p(28, 8, 5, 13, d); p(15, 6, 3, 2, d); p(29, 6, 3, 2, d);
    O(p, 14, 14, 4, 2, BLANC);
    p(10, 9, 3, 6, b); O(p, 9, 7, 3, 3, b);
    p(3, 7, 4, 2, d); p(3, 9, 2, 2, d);
    p(8, 6, 2, 2, '#ff5a4a');
    p(19, 25, 3, 3, d); p(25, 25, 3, 3, d);
    p(12, 28, 20, 3, d); p(12, 28, 20, 1, b);
  };

  // Un ver qui sort de la dune, la gueule ouverte.
  D['ver-dunes'] = function (p, a, b, d) {
    O(p, 23, 23, 7, 3, a); O(p, 22, 18, 7, 3, a); O(p, 20, 13, 7, 3, a); O(p, 17, 9, 7, 3, a);
    p(17, 21, 12, 1, d); p(16, 16, 12, 1, d); p(14, 11, 12, 1, d);
    O(p, 12, 5, 7, 5, d); O(p, 12, 5, 4, 3, '#200804');
    for (var i = 0; i < 8; i++) {
      var ang = i / 8 * 6.283;
      p(Math.round(12 + Math.cos(ang) * 5), Math.round(5 + Math.sin(ang) * 3), 1, 2, BLANC);
    }
    O(p, 20, 29, 19, 3, b);
    p(4, 22, 1, 1, b); p(7, 19, 1, 1, b); p(35, 21, 1, 1, b); p(32, 17, 1, 1, b);
  };

  // ==========================================================
  //  Ignis — la lave et la cendre
  // ==========================================================

  // Une etincelle a pattes, qui court sur la lave.
  D['braisillon'] = function (p, a, b, d) {
    p(18, 6, 4, 14, a); p(13, 11, 14, 4, a);
    p(15, 8, 2, 2, b); p(23, 8, 2, 2, b); p(15, 16, 2, 2, b); p(23, 16, 2, 2, b);
    p(17, 10, 6, 6, BLANC); p(18, 12, 1, 2, '#141826'); p(21, 12, 1, 2, '#141826');
    T(p, 16, 17, 6, 26, d); T(p, 24, 17, 34, 26, d);
    T(p, 18, 19, 13, 28, d); T(p, 22, 19, 27, 28, d);
    p(2, 27, 8, 1, b); p(30, 27, 8, 1, b); p(10, 29, 6, 1, b); p(24, 29, 6, 1, b);
  };

  // Presque rien : un monticule de cendre, un sillon, deux yeux.
  D['cendreux'] = function (p, a, b, d) {
    O(p, 15, 22, 12, 5, a); p(3, 24, 25, 3, a);
    p(26, 23, 13, 2, d); p(28, 25, 11, 1, b);
    p(3, 21, 3, 3, d);
    p(8, 17, 3, 3, '#ffe08a'); p(13, 16, 3, 3, '#ffe08a');
    p(9, 18, 1, 2, '#141826'); p(14, 17, 1, 2, '#141826');
    p(8, 16, 3, 1, a); p(13, 15, 3, 1, a);
    p(18, 10, 2, 2, b); p(22, 6, 3, 3, b); p(27, 11, 2, 2, b); p(31, 4, 2, 2, b);
  };

  // Une tortue-ile : des orgues de basalte sur le dos.
  D['tortue-basalte'] = function (p, a, b, d) {
    O(p, 21, 22, 14, 4, d);
    var orgues = [[9, 15, 5], [14, 10, 5], [19, 6, 5], [24, 11, 5], [29, 16, 5]];
    orgues.forEach(function (o) {
      p(o[0], o[1], o[2], 22 - o[1], a); p(o[0], o[1], o[2], 2, b); p(o[0], o[1], 1, 22 - o[1], d);
    });
    p(2, 20, 7, 4, a); E(p, 3, 21);
    p(7, 25, 6, 2, d); p(28, 25, 6, 2, d);
    p(1, 28, 38, 2, '#ff5a14'); p(6, 28, 5, 1, '#ffe08a'); p(24, 28, 7, 1, '#ffe08a');
  };

  // Un aileron qui fend la lave sans la rider.
  D['nageur-lave'] = function (p, a, b, d) {
    for (var y = 4; y <= 19; y++) {
      var w = Math.round((y - 4) * 0.85);
      p(24 - Math.round(w * 0.35), y, w + 1, 1, a);
    }
    p(22, 7, 1, 12, b);
    p(34, 14, 3, 6, a); p(36, 12, 2, 3, a);
    p(0, 20, 40, 2, b); p(4, 20, 6, 1, BLANC); p(27, 20, 8, 1, BLANC);
    O(p, 19, 26, 15, 4, d);
    p(7, 25, 3, 1, '#ffe08a'); p(11, 27, 1, 1, '#ffe08a');
  };

  // Une colonne de fumee toute droite, qui a des yeux.
  D['fumerolle-vive'] = function (p, a, b, d) {
    p(18, 13, 5, 16, a); p(18, 13, 1, 16, b);
    O(p, 20, 11, 7, 5, a); O(p, 14, 6, 5, 4, b); O(p, 26, 5, 5, 4, b); O(p, 20, 3, 5, 3, a);
    p(17, 10, 2, 2, '#ff9a2a'); p(22, 10, 2, 2, '#ff9a2a');
    O(p, 20, 29, 8, 2, d); p(14, 28, 3, 1, '#ff5a14'); p(24, 28, 3, 1, '#ff5a14');
  };

  // Une salamandre vue du dessus, la queue en flamme.
  D['salamandre-or'] = function (p, a, b, d) {
    for (var t = 0; t <= 24; t++) {
      var y = Math.round(19 - Math.sin(t / 24 * Math.PI) * 8);
      p(8 + t, y - 2, 1, 5, a); p(8 + t, y + 1, 1, 1, b);
      if (t % 5 === 2) p(8 + t, y - 1, 2, 2, d);
    }
    O(p, 7, 19, 4, 3, a); E(p, 4, 17); E(p, 4, 20);
    T(p, 13, 13, 10, 7, d); p(8, 6, 4, 1, d); T(p, 14, 17, 12, 24, d); p(10, 25, 4, 1, d);
    T(p, 25, 10, 27, 4, d); p(26, 3, 4, 1, d); T(p, 26, 15, 28, 22, d); p(27, 23, 4, 1, d);
    O(p, 34, 21, 3, 3, '#ff5a14'); p(33, 16, 3, 4, '#ff9a2a'); p(34, 13, 2, 3, '#ffe08a');
  };

  // Un phenix qui se releve, les ailes en V.
  D['phenix-cendre'] = function (p, a, b, d) {
    for (var i = 0; i <= 12; i++) {
      p(15 - i, 17 - i, 2, 6 - Math.round(i / 3), i % 2 ? a : b);
      p(24 + i, 17 - i, 2, 6 - Math.round(i / 3), i % 2 ? a : b);
    }
    O(p, 20, 18, 4, 6, a); O(p, 20, 10, 3, 3, a);
    p(15, 10, 3, 1, '#ff9a2a'); p(19, 4, 1, 4, b); p(21, 5, 1, 3, b);
    E(p, 18, 9);
    p(18, 24, 1, 7, b); p(20, 24, 1, 8, '#ff5a14'); p(22, 24, 1, 6, b);
    p(6, 24, 1, 1, d); p(10, 28, 1, 1, d); p(31, 26, 1, 1, d); p(35, 22, 1, 1, d);
  };

  // Un roi assis dans la lave jusqu'a la taille.
  D['roi-immobile'] = function (p, a, b, d) {
    p(12, 0, 3, 5, '#ffb02e'); p(18, 0, 4, 6, '#ffb02e'); p(25, 0, 3, 5, '#ffb02e'); p(12, 4, 16, 2, '#ffb02e');
    p(13, 6, 14, 8, b); p(15, 8, 4, 2, '#ff5a14'); p(21, 8, 4, 2, '#ff5a14');
    p(16, 12, 8, 2, d);
    p(5, 14, 30, 6, a); p(5, 14, 8, 3, b); p(27, 14, 8, 3, b);
    p(10, 20, 20, 5, d);
    p(2, 21, 6, 4, a); p(32, 21, 6, 4, a);
    p(0, 25, 40, 4, '#ff5a14'); p(3, 25, 6, 1, '#ffe08a'); p(16, 26, 8, 1, '#ffe08a'); p(30, 25, 6, 1, '#ffe08a');
  };

  // ==========================================================
  //  Les huit gardiens du systeme stellaire
  // ==========================================================
  // Un par monde, comme dans le systeme solaire, mais ils reprennent la
  // ou Neptune s'arrete : il faut le Mk X pour en venir a bout, et de
  // plus en plus d'adresse en s'eloignant de l'etoile.
  if (!B || !B.definir || !B.arene) return;

  var ovale = B.ovale, sourcil = B.sourcil;

  var LISTE = [

    // ---------- 1. Cryos ----------
    {
      id: 'sans-reflet', astre: 'cryos', rang: 11,
      nom: 'Le Sans-Reflet',
      c: ['#1c2238', '#3a4670', '#7ad8ff'],
      texte: 'Un miroir de glace noire, grand comme un lac, qui s’est ' +
             'dressé. On y voit les étoiles, on y voit le ciel, on n’y ' +
             'voit jamais celui qui regarde.',
      pv: 24000, cadence: [2600, 2000, 1400], coup: [19, 25, 31],
      prepare: 900, etourdi: 950, interrompre: 4, xp: 1600,
      recompense: { roches: 170, credit: ['pink', 3] },
      corps: { rx: 54, ry: 44, dy: 0 },
      faibles: [{ x: 52, y: 48, r: 8 }, { x: 98, y: 48, r: 8 }, { x: 75, y: 20, r: 8 }],
      gorge: { x: 75, y: 82, r: 11 },
      dessiner: function (p, ouverte) {
        var i;
        // Le cadre : des cristaux plantes tout autour.
        for (i = 0; i < 13; i++) {
          var ang = Math.PI * (0.92 + i / 12 * 1.16);
          var x = Math.round(75 + Math.cos(ang) * 60), y = Math.round(62 + Math.sin(ang) * 48);
          p(x - 3, y - 10, 7, 18, '#3a4670'); p(x - 1, y - 13, 3, 6, '#7ad8ff');
        }
        ovale(p, 75, 62, 54, 44, '#3a4670');
        ovale(p, 75, 62, 48, 39, '#05070e');
        // Les etoiles prises dans la glace.
        for (i = 0; i < 16; i++) {
          p(36 + (i * 23) % 78, 32 + (i * 17) % 58, i % 4 ? 1 : 2, i % 4 ? 1 : 2, '#c8d8ff');
        }
        [52, 98].forEach(function (x, k) {
          ovale(p, x, 48, 9, 7, '#0e1220');
          ovale(p, x, 48, 6, 4, '#7ad8ff');
          ovale(p, x, 48, 2, 2, '#ffffff');
          p(x - 11, 47, 22, 1, '#7ad8ff'); p(x, 38, 1, 20, '#7ad8ff');
          sourcil(p, x, 46, k ? 1 : -1, '#3a4670', 1.1);
        });
        ovale(p, 75, 20, 7, 8, '#7ad8ff'); ovale(p, 75, 20, 3, 4, '#e8fbff');
        if (!ouverte) {
          p(54, 80, 42, 2, '#3a4670'); p(60, 78, 3, 2, '#3a4670'); p(88, 82, 3, 2, '#3a4670');
        } else {
          ovale(p, 75, 82, 24, 13, '#2a1458');
          ovale(p, 75, 84, 15, 7, '#9a6cf4'); ovale(p, 75, 85, 7, 3, '#e0d0ff');
          for (i = 0; i < 7; i++) {
            p(55 + i * 6, 71, 3, 7 - (i % 2) * 2, '#e8fbff');
            p(57 + i * 6, 90, 3, 5 - (i % 2) * 2, '#e8fbff');
          }
        }
      },
      arene: {
        ciel: ['#020108', '#1c1440'], sol: ['#161b2e', '#2c3654'], lueur: '#7ad8ff', etoiles: true,
        decor: function (ctx, t, W) {
          // L'etoile qui boit : un disque noir, et la lumiere qui y tombe.
          var g = ctx.createRadialGradient(W / 2, 60, 18, W / 2, 60, 120);
          g.addColorStop(0, 'rgba(154,108,244,.8)');
          g.addColorStop(1, 'rgba(106,58,216,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(W / 2, 60, 120, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath(); ctx.arc(W / 2, 60, 26, 0, 6.3); ctx.fill();
          ctx.strokeStyle = 'rgba(224,208,255,.5)';
          ctx.lineWidth = 1;
          for (var i = 0; i < 10; i++) {
            var a = i * 0.63, r = 110 - ((t / 22 + i * 13) % 80);
            ctx.beginPath();
            ctx.moveTo(W / 2 + Math.cos(a) * r, 60 + Math.sin(a) * r);
            ctx.lineTo(W / 2 + Math.cos(a) * (r - 12), 60 + Math.sin(a) * (r - 12));
            ctx.stroke();
          }
        }
      },
      textes: {
        victoire: 'LE SANS-REFLET S’EST FENDU',
        recit: 'Une seule fêlure, d’un bord à l’autre, puis mille. Dans chaque éclat qui tombe, pour la première fois, il y a ton visage.',
        echec: 'Le Téléportail t’a arraché à la glace. Derrière toi, le miroir est de nouveau lisse.',
        reveil: 'La glace se redresse devant toi, comme une porte qu’on ouvre de l’autre côté…',
        indice: 'Un lac gelé où tu ne te vois pas. Quelque chose, dessous, regarde vers le haut.'
      }
    },

    // ---------- 2. Opaline ----------
    {
      id: 'mere-perles', astre: 'opaline', rang: 12,
      nom: 'La Mère des Perles',
      c: ['#e4dcec', '#f8f2ff', '#f0b8d8'],
      texte: 'Toutes les perles des mers d’Opaline viennent d’elle. Une ' +
             'coquille grande comme une colline, qui ne s’ouvre que pour ' +
             'frapper — et l’on voit alors ce qu’elle couve.',
      pv: 27000, cadence: [2550, 1950, 1400], coup: [19, 25, 32],
      prepare: 900, etourdi: 950, interrompre: 4, xp: 1800,
      recompense: { roches: 190, credit: ['pink', 3] },
      corps: { rx: 58, ry: 42, dy: 2 },
      faibles: [{ x: 50, y: 46, r: 8 }, { x: 100, y: 46, r: 8 }, { x: 75, y: 15, r: 8 }],
      gorge: { x: 75, y: 78, r: 11 },
      dessiner: function (p, ouverte) {
        var i;
        ovale(p, 75, 60, 60, 42, '#cfc4e4');
        ovale(p, 75, 56, 58, 38, '#e4dcec');
        // Les cotes de la coquille, en eventail.
        for (i = 0; i < 9; i++) {
          p(23 + i * 13, 24 + Math.abs(i - 4) * 5, 2, 40 - Math.abs(i - 4) * 4, '#cfc4e4');
        }
        ovale(p, 75, 36, 42, 15, '#f8f2ff');
        ovale(p, 75, 15, 11, 7, '#a89cc0'); ovale(p, 75, 15, 6, 4, '#9ae8d8'); p(73, 13, 3, 2, '#ffffff');
        [50, 100].forEach(function (x, k) {
          ovale(p, x, 46, 9, 8, '#5c5278');
          ovale(p, x, 46, 6, 6, '#9ae8d8');
          ovale(p, x, 46, 2, 4, '#16243c');
          p(x - 3, 43, 2, 2, '#ffffff');
          sourcil(p, x, 46, k ? 1 : -1, '#a89cc0', 1.1);
        });
        // La levre festonnee.
        for (i = 0; i < 10; i++) ovale(p, 21 + i * 12, 94, 7, 6, '#cfc4e4');
        if (!ouverte) {
          p(26, 76, 98, 3, '#5c5278');
          for (i = 0; i < 8; i++) p(32 + i * 12, 74, 3, 2, '#5c5278');
        } else {
          ovale(p, 75, 78, 46, 14, '#3a2a48');
          ovale(p, 75, 80, 34, 8, '#6a4a78');
          ovale(p, 75, 78, 12, 11, '#ffd8ec'); ovale(p, 75, 78, 8, 7, '#fff4fa');
          p(69, 72, 4, 3, '#ffffff');
          ovale(p, 44, 80, 4, 4, '#ffd8ec'); ovale(p, 106, 80, 4, 4, '#ffd8ec');
        }
      },
      arene: {
        ciel: ['#6a9cc8', '#e8f6ff'], sol: ['#d2c8de', '#e4dcec'], lueur: '#f0b8d8',
        decor: function (ctx, t, W) {
          // Le ciel est si clair qu'on y voit les autres mondes.
          var mondes = [[70, 44, 16, '#d88a2a'], [150, 26, 8, '#1f6a3a'], [350, 52, 22, '#5a606c'],
                        [420, 24, 9, '#d8642a']];
          mondes.forEach(function (m) {
            ctx.fillStyle = m[3];
            ctx.beginPath(); ctx.arc(m[0], m[1], m[2], 0, 6.3); ctx.fill();
            ctx.fillStyle = 'rgba(232,246,255,.45)';
            ctx.beginPath(); ctx.arc(m[0] + m[2] * 0.35, m[1] + m[2] * 0.3, m[2], 0, 6.3); ctx.fill();
          });
          ctx.fillStyle = 'rgba(255,216,236,.8)';
          for (var i = 0; i < 9; i++) {
            ctx.beginPath();
            ctx.arc(((i * 61 + t / 40) % (W + 40)) - 20, 138 + (i % 3) * 4, 3 + (i % 2), 0, 6.3);
            ctx.fill();
          }
        }
      },
      textes: {
        victoire: 'LA MÈRE DES PERLES S’EST REFERMÉE',
        recit: 'Elle se clôt une dernière fois, et sa perle roule jusqu’à tes pieds. Sur toute la planète, les mers cessent de bouger.',
        echec: 'Le Téléportail t’a tiré de là avant que la coquille ne claque. Elle s’est refermée sur du vide.',
        reveil: 'La colline bâille. Ce n’était pas une colline…',
        indice: 'Une butte trop lisse, striée comme un coquillage. Les perles roulent toutes vers elle.'
      }
    },

    // ---------- 3. Altera ----------
    {
      id: 'epouvantail-jumeau', astre: 'altera', rang: 13,
      nom: 'L’Épouvantail du Jardin',
      c: ['#70457f', '#d88a2a', '#7cf0e8'],
      texte: 'Chez toi, il n’y a pas d’épouvantail au fond du jardin. Ici, ' +
             'si. Il porte un manteau à ta taille, et il garde la maison de ' +
             'quelqu’un qui n’est jamais rentré.',
      pv: 30000, cadence: [2500, 1900, 1350], coup: [20, 26, 32],
      prepare: 880, etourdi: 930, interrompre: 4, xp: 2000,
      recompense: { roches: 210, credit: ['pink', 4] },
      corps: { rx: 50, ry: 46, dy: 2 },
      faibles: [{ x: 60, y: 42, r: 8 }, { x: 90, y: 42, r: 8 }, { x: 75, y: 90, r: 8 }],
      gorge: { x: 75, y: 62, r: 10 },
      dessiner: function (p, ouverte) {
        var i;
        // La croix de bois, et les manches en lambeaux.
        p(6, 46, 138, 6, '#4a2a5a'); p(72, 18, 6, 94, '#4a2a5a');
        for (i = 0; i < 6; i++) {
          p(8 + i * 6, 52, 4, 9 + (i % 3) * 6, '#70457f');
          p(108 + i * 6, 52, 4, 9 + ((i + 1) % 3) * 6, '#70457f');
        }
        ovale(p, 75, 90, 30, 22, '#70457f'); ovale(p, 75, 86, 24, 14, '#8a5a9a');
        p(54, 80, 10, 9, '#d88a2a'); p(88, 96, 9, 8, '#c47a22');
        ovale(p, 75, 90, 7, 7, '#34222e'); ovale(p, 75, 90, 4, 4, '#7cf0e8'); p(74, 88, 2, 2, '#ffffff');
        // La tete : un sac de toile.
        ovale(p, 75, 46, 31, 27, '#d88a2a'); ovale(p, 75, 42, 25, 19, '#f0a848');
        for (i = 0; i < 11; i++) p(49 + i * 5, 68, 2, 7 - (i % 2) * 2, '#f0d060');
        // Le chapeau.
        p(36, 18, 78, 6, '#34222e'); p(52, 2, 46, 18, '#34222e'); p(52, 13, 46, 4, '#7cf0e8');
        [60, 90].forEach(function (x, k) {
          ovale(p, x, 42, 8, 8, '#34222e');
          ovale(p, x, 42, 5, 5, '#7cf0e8');
          p(x - 1, 38, 2, 9, '#34222e'); p(x - 4, 41, 9, 2, '#34222e');
          sourcil(p, x, 43, k ? 1 : -1, '#34222e', 1.1);
        });
        if (!ouverte) {
          p(55, 61, 40, 2, '#34222e');
          for (i = 0; i < 7; i++) p(58 + i * 6, 58, 2, 8, '#34222e');
        } else {
          ovale(p, 75, 62, 21, 10, '#1a0a14');
          ovale(p, 75, 64, 12, 5, '#7cf0e8'); ovale(p, 75, 65, 5, 2, '#e0fffc');
          for (i = 0; i < 6; i++) {
            p(58 + i * 6, 54, 3, 5, '#f0d060'); p(60 + i * 6, 68, 3, 4, '#f0d060');
          }
        }
      },
      arene: {
        ciel: ['#1a0a30', '#7a3aa8'], sol: ['#c47a22', '#d88a2a'], lueur: '#7cf0e8', etoiles: true,
        decor: function (ctx, t, W) {
          // La maison jumelle, toutes fenetres eteintes sauf une.
          ctx.fillStyle = '#1a0a26';
          ctx.fillRect(30, 96, 90, 54);
          ctx.beginPath(); ctx.moveTo(22, 96); ctx.lineTo(75, 62); ctx.lineTo(128, 96); ctx.fill();
          ctx.fillRect(360, 112, 60, 38);
          ctx.fillStyle = (Math.floor(t / 900) % 5) ? '#7cf0e8' : '#1a0a26';
          ctx.fillRect(86, 108, 14, 14);
          ctx.fillStyle = '#d8b8ff';
          ctx.beginPath(); ctx.arc(W - 70, 44, 20, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#b494e0';
          ctx.beginPath(); ctx.arc(W - 120, 30, 9, 0, 6.3); ctx.fill();
        }
      },
      textes: {
        victoire: 'L’ÉPOUVANTAIL EST TOMBÉ DE SA CROIX',
        recit: 'Il s’affaisse en un tas de paille et de toile. Dans la poche du manteau, une clé, la même que celle de chez toi.',
        echec: 'Le Téléportail t’a ramené dans ta chambre. Au fond de ton jardin à toi, il n’y a toujours rien. Tu as vérifié.',
        reveil: 'Il n’y avait pas de vent, et pourtant il a tourné la tête…',
        indice: 'Un épouvantail, au fond du jardin. Les oiseaux se posent partout, sauf sur lui.'
      }
    },

    // ---------- 4. Viridia ----------
    {
      id: 'gueule-fleur', astre: 'viridia', rang: 14,
      nom: 'La Gueule-Fleur',
      c: ['#1f6a3a', '#e84a8a', '#f0d83a'],
      texte: 'La plus belle fleur de Viridia, et la seule qui ne fane ' +
             'pas. Elle s’ouvre au passage de tout ce qui a du sang, et la ' +
             'jungle, autour, fait silence pour l’écouter mâcher.',
      pv: 34000, cadence: [2450, 1900, 1350], coup: [20, 26, 33],
      prepare: 860, etourdi: 920, interrompre: 5, xp: 2300,
      recompense: { roches: 235, credit: ['pink', 4] },
      corps: { rx: 58, ry: 46, dy: 0 },
      faibles: [{ x: 46, y: 22, r: 8 }, { x: 104, y: 22, r: 8 }, { x: 75, y: 10, r: 8 }],
      gorge: { x: 75, y: 60, r: 12 },
      dessiner: function (p, ouverte) {
        var i, ang;
        p(70, 92, 10, 20, '#185a30');
        ovale(p, 46, 102, 24, 7, '#1f6a3a'); ovale(p, 104, 102, 24, 7, '#1f6a3a');
        p(26, 102, 40, 1, '#0e3a22'); p(84, 102, 40, 1, '#0e3a22');
        // Les petales.
        for (i = 0; i < 10; i++) {
          ang = i / 10 * 6.283 + 0.31;
          ovale(p, Math.round(75 + Math.cos(ang) * 42), Math.round(56 + Math.sin(ang) * 32),
                18, 14, i % 2 ? '#e84a8a' : '#c4306a');
        }
        for (i = 0; i < 10; i++) {
          ang = i / 10 * 6.283 + 0.31;
          p(Math.round(75 + Math.cos(ang) * 46) - 1, Math.round(56 + Math.sin(ang) * 35) - 1, 3, 3, '#ff8ab8');
        }
        ovale(p, 75, 56, 34, 28, '#1f6a3a'); ovale(p, 75, 53, 28, 21, '#2f8a4c');
        // Les deux bulbes sur leurs tiges, et le pistil.
        p(48, 26, 4, 14, '#185a30'); p(98, 26, 4, 14, '#185a30'); p(73, 14, 4, 16, '#185a30');
        [46, 104].forEach(function (x, k) {
          ovale(p, x, 22, 9, 9, '#f0d83a');
          ovale(p, x, 22, 4, 6, '#0e3a22');
          p(x - 4, 18, 2, 2, '#fff8a8');
          sourcil(p, x, 22, k ? 1 : -1, '#185a30', 1.1);
        });
        ovale(p, 75, 10, 8, 8, '#f0d83a'); ovale(p, 75, 10, 4, 4, '#fff8a8');
        if (!ouverte) {
          p(51, 59, 48, 3, '#0e3a22');
          for (i = 0; i < 8; i++) p(53 + i * 6, 56 + (i % 2) * 5, 3, 3, '#fff8a8');
        } else {
          ovale(p, 75, 60, 27, 19, '#3a0a1e');
          ovale(p, 75, 62, 17, 11, '#e84a8a'); ovale(p, 75, 66, 9, 5, '#ff8ab8');
          for (i = 0; i < 12; i++) {
            ang = i / 12 * 6.283;
            p(Math.round(75 + Math.cos(ang) * 24) - 1, Math.round(60 + Math.sin(ang) * 16) - 2, 3, 5, '#fff8a8');
          }
        }
      },
      arene: {
        ciel: ['#04140e', '#1f6a3a'], sol: ['#185a30', '#2f8a4c'], lueur: '#f0d83a',
        decor: function (ctx, t, W) {
          // Les troncs, les lianes, et la pluie qui ne s'arrete pas.
          ctx.fillStyle = '#082a18';
          for (var i = 0; i < 7; i++) ctx.fillRect(10 + i * 74, 0, 18 + (i % 3) * 8, 150);
          ctx.strokeStyle = '#0e3a22';
          ctx.lineWidth = 3;
          for (i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(40 + i * 82, 0);
            ctx.quadraticCurveTo(70 + i * 82, 70 + (i % 2) * 30, 110 + i * 82, 0);
            ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(168,244,224,.4)';
          ctx.lineWidth = 1;
          for (i = 0; i < 40; i++) {
            var x = (i * 53) % W, y = ((t / 3 + i * 37) % 170) - 10;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke();
          }
        }
      },
      textes: {
        victoire: 'LA GUEULE-FLEUR A FANÉ',
        recit: 'Ses pétales tombent un à un, larges comme des draps. La jungle se remet à bruire, d’abord tout bas, puis toute entière.',
        echec: 'Le Téléportail t’a tiré d’entre les pétales. Elle s’est refermée en bouton, patiente.',
        reveil: 'Le parfum devient trop fort. La fleur se tourne vers toi…',
        indice: 'Une clairière où rien ne pousse, sauf une fleur immense. Il n’y a pas un insecte.'
      }
    },

    // ---------- 5. Ferron ----------
    {
      id: 'haut-fourneau', astre: 'ferron', rang: 15,
      nom: 'Le Haut-Fourneau',
      c: ['#5a606c', '#8a929f', '#ff9a2a'],
      texte: 'Personne n’a bâti de four sur Ferron. Celui-ci s’est fait ' +
             'tout seul, comme le reste, et il s’est allumé le jour où la ' +
             'foudre est tombée dedans. Il a faim de tout ce qui n’est pas en fer.',
      pv: 38000, cadence: [2400, 1850, 1300], coup: [21, 27, 33],
      prepare: 850, etourdi: 900, interrompre: 5, xp: 2600,
      recompense: { roches: 260, credit: ['pink', 4] },
      corps: { rx: 56, ry: 44, dy: 6 },
      faibles: [{ x: 52, y: 52, r: 9 }, { x: 98, y: 52, r: 9 }, { x: 75, y: 34, r: 7 }],
      gorge: { x: 75, y: 82, r: 11 },
      dessiner: function (p, ouverte) {
        var i;
        // Les deux cheminees.
        p(30, 2, 14, 26, '#33373f'); p(106, 2, 14, 26, '#33373f');
        p(28, 2, 18, 4, '#8a929f'); p(104, 2, 18, 4, '#8a929f');
        p(33, 0, 8, 2, '#ff9a2a'); p(109, 0, 8, 2, '#ff9a2a');
        // Les pistons, de part et d'autre.
        p(6, 48, 16, 12, '#44484f'); p(128, 48, 16, 12, '#44484f');
        p(2, 44, 8, 20, '#6c727c'); p(140, 44, 8, 20, '#6c727c');
        // La caisse.
        p(22, 24, 106, 80, '#5a606c'); p(26, 28, 98, 8, '#747c8a'); p(22, 98, 106, 6, '#33373f');
        p(22, 24, 4, 80, '#747c8a'); p(124, 24, 4, 80, '#33373f');
        for (i = 0; i < 8; i++) { p(29 + i * 13, 39, 3, 3, '#16181c'); p(29 + i * 13, 100, 3, 3, '#16181c'); }
        ovale(p, 75, 34, 6, 6, '#16181c'); ovale(p, 75, 34, 4, 4, '#3ad0ff'); p(74, 32, 2, 2, '#ffffff');
        [52, 98].forEach(function (x, k) {
          ovale(p, x, 52, 12, 12, '#16181c');
          ovale(p, x, 52, 9, 9, '#ff9a2a');
          ovale(p, x, 52, 4, 4, '#ffe08a');
          p(x - 12, 51, 24, 2, '#16181c'); p(x - 1, 40, 2, 24, '#16181c');
          sourcil(p, x, 50, k ? 1 : -1, '#33373f', 1.3);
        });
        if (!ouverte) {
          p(44, 72, 62, 20, '#16181c');
          for (i = 0; i < 7; i++) { p(48 + i * 8, 74, 5, 16, '#33373f'); p(49 + i * 8, 88, 3, 2, '#ff5a14'); }
        } else {
          p(42, 70, 66, 24, '#16181c');
          ovale(p, 75, 82, 28, 10, '#ff5a14'); ovale(p, 75, 83, 17, 6, '#ffd23a'); ovale(p, 75, 84, 8, 3, '#ffffff');
          for (i = 0; i < 6; i++) { p(47 + i * 10, 70, 6, 5, '#8a929f'); p(47 + i * 10, 89, 6, 5, '#8a929f'); }
        }
      },
      arene: {
        ciel: ['#08090c', '#3a4048'], sol: ['#33373f', '#4e5460'], lueur: '#3ad0ff',
        decor: function (ctx, t, W) {
          // Des pylones de fer natif, et la foudre qui saute de l'un a l'autre.
          ctx.fillStyle = '#1a1c22';
          for (var i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(20 + i * 86, 150); ctx.lineTo(34 + i * 86, 60 + (i % 3) * 20); ctx.lineTo(48 + i * 86, 150);
            ctx.fill();
          }
          var k = Math.floor(t / 420);
          if (k % 3 === 0) {
            var a = (k * 7) % 5;
            ctx.strokeStyle = '#8ae6ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(34 + a * 86, 60 + (a % 3) * 20);
            ctx.lineTo(60 + a * 86, 40); ctx.lineTo(78 + a * 86, 74);
            ctx.lineTo(120 + a * 86, 60 + ((a + 1) % 3) * 20);
            ctx.stroke();
          }
        }
      },
      textes: {
        victoire: 'LE HAUT-FOURNEAU S’EST ÉTEINT',
        recit: 'Sa gueule vire au rouge sombre, puis au noir. Il refroidit en craquant, et redevient ce qu’il était : un bloc de fer parmi les autres.',
        echec: 'Le Téléportail t’a sorti du brasier. Derrière toi, les pistons battent encore la mesure.',
        reveil: 'Les cheminées se mettent à fumer. Deux hublots s’allument dans le fer…',
        indice: 'Un bloc de fer plus carré que les autres, tiède au toucher. On dirait qu’il respire.'
      }
    },

    // ---------- 6. Brisure ----------
    {
      id: 'assemblee', astre: 'brisure', rang: 16,
      nom: 'L’Assemblée',
      c: ['#7a5a6a', '#977684', '#ff7ac0'],
      texte: 'Huit éclats qui se souviennent d’avoir été un visage. Ils ' +
             'se rapprochent quand on vient, à peu près dans le bon ordre, ' +
             'autour d’un morceau du cœur qu’ils se sont gardé.',
      pv: 43000, cadence: [2400, 1800, 1300], coup: [21, 27, 34],
      prepare: 840, etourdi: 900, interrompre: 5, xp: 2900,
      recompense: { roches: 285, credit: ['pink', 5] },
      corps: { rx: 58, ry: 46, dy: 0 },
      faibles: [{ x: 43, y: 26, r: 8 }, { x: 107, y: 26, r: 8 }, { x: 75, y: 14, r: 7 }],
      gorge: { x: 75, y: 60, r: 12 },
      dessiner: function (p, ouverte) {
        // Le coeur, derriere, qui luit entre les morceaux.
        ovale(p, 75, 58, 34, 30, '#ff7ac0'); ovale(p, 75, 58, 22, 19, '#ffd0e8');
        function eclat(x, y, w, h) {
          p(x, y, w, h, '#7a5a6a'); p(x, y, w, 3, '#977684'); p(x, y, 3, h, '#977684');
          p(x, y + h - 3, w, 3, '#4a3442'); p(x + w - 3, y, 3, h, '#4a3442');
          p(x - 3, y + 5, 3, Math.max(2, h - 12), '#7a5a6a');
          p(x + w, y + 7, 3, Math.max(2, h - 15), '#4a3442');
        }
        eclat(28, 12, 30, 26); eclat(92, 12, 30, 26);
        eclat(14, 44, 26, 30); eclat(110, 44, 26, 30);
        eclat(30, 80, 28, 22); eclat(92, 80, 28, 22);
        eclat(62, 4, 26, 18); eclat(60, 90, 30, 18);
        ovale(p, 75, 14, 5, 5, '#ffd0e8'); ovale(p, 75, 14, 2, 2, '#ffffff');
        [43, 107].forEach(function (x, k) {
          ovale(p, x, 26, 8, 6, '#221620');
          ovale(p, x, 26, 5, 3, '#ff7ac0');
          p(x - 1, 21, 2, 10, '#221620');
          sourcil(p, x, 26, k ? 1 : -1, '#4a3442', 1.1);
        });
        if (!ouverte) {
          // Le morceau du milieu, fendu, qui cache le coeur.
          p(50, 34, 50, 50, '#6c4e5e'); p(50, 34, 50, 3, '#977684'); p(50, 81, 50, 3, '#4a3442');
          p(74, 34, 2, 50, '#ff7ac0'); p(64, 58, 22, 2, '#ff7ac0');
        } else {
          p(44, 34, 16, 50, '#6c4e5e'); p(44, 34, 16, 3, '#977684');
          p(90, 34, 16, 50, '#6c4e5e'); p(90, 34, 16, 3, '#977684');
          ovale(p, 75, 60, 14, 14, '#1c0c24');
          ovale(p, 75, 60, 9, 9, '#ff5aa8'); ovale(p, 75, 60, 4, 4, '#ffffff');
        }
      },
      arene: {
        ciel: ['#0c040e', '#5a2040'], sol: ['#4a3442', '#6c4e5e'], lueur: '#ff7ac0', etoiles: true,
        decor: function (ctx, t, W) {
          // Les autres eclats, qui derivent sans se toucher.
          for (var i = 0; i < 7; i++) {
            var x = ((i * 83 + t / 70) % (W + 120)) - 60;
            var y = 24 + (i % 4) * 26 + Math.sin(t / 900 + i) * 4;
            ctx.fillStyle = i % 2 ? '#3a2634' : '#4a3442';
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x + 30 + i * 3, y - 8); ctx.lineTo(x + 44 + i * 3, y + 10);
            ctx.lineTo(x + 14, y + 16); ctx.fill();
          }
          var g = ctx.createRadialGradient(W / 2, 150, 10, W / 2, 150, 160);
          g.addColorStop(0, 'rgba(255,122,192,.55)');
          g.addColorStop(1, 'rgba(255,122,192,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(W / 2, 150, 160, Math.PI, 0); ctx.fill();
        }
      },
      textes: {
        victoire: 'L’ASSEMBLÉE S’EST DISPERSÉE',
        recit: 'Les huit morceaux s’écartent, lentement, chacun de son côté. Le fragment de cœur reste là, à battre tout seul, puis s’éteint.',
        echec: 'Le Téléportail t’a tiré du vide. Les éclats se sont rapprochés derrière toi, comme une porte.',
        reveil: 'Les éclats tournent, se cherchent, s’emboîtent. Un visage, à peu près…',
        indice: 'Huit rochers en rond, qui flottent à hauteur d’homme. Ils n’étaient pas dans cet ordre tout à l’heure.'
      }
    },

    // ---------- 7. Pyrrhe ----------
    {
      id: 'sphinx-verre', astre: 'pyrrhe', rang: 17,
      nom: 'Le Sphinx de Verre',
      c: ['#d8642a', '#ffc86a', '#fff0c8'],
      texte: 'Le vent l’a soufflé dans le sable, il y a si longtemps que ' +
             'personne ne sait s’il a eu un sculpteur. Il pose une seule ' +
             'question, et ne laisse pas le temps d’y répondre.',
      pv: 49000, cadence: [2350, 1800, 1250], coup: [22, 28, 34],
      prepare: 830, etourdi: 890, interrompre: 5, xp: 3300,
      recompense: { roches: 310, credit: ['pink', 5] },
      corps: { rx: 58, ry: 48, dy: 0 },
      faibles: [{ x: 58, y: 46, r: 8 }, { x: 92, y: 46, r: 8 }, { x: 75, y: 12, r: 7 }],
      gorge: { x: 75, y: 76, r: 10 },
      dessiner: function (p, ouverte) {
        var i, y;
        // La coiffe rayee, qui s'evase vers les epaules.
        for (y = 4; y <= 100; y++) {
          var w = Math.round(28 + Math.min(32, (y - 4) * 0.85));
          p(75 - w, y, w * 2, 1, (Math.floor(y / 6) % 2) ? '#ffc86a' : '#c0562c');
        }
        ovale(p, 75, 56, 31, 38, '#d8642a'); ovale(p, 75, 50, 25, 28, '#f0884a');
        // Le joyau du front.
        ovale(p, 75, 12, 7, 8, '#fff0c8'); ovale(p, 75, 12, 3, 5, '#ffe08a'); p(74, 8, 2, 3, '#ffffff');
        [58, 92].forEach(function (x, k) {
          ovale(p, x, 46, 10, 6, '#48180a');
          ovale(p, x, 46, 7, 4, '#fff0c8');
          ovale(p, x, 46, 2, 4, '#ff5a14');
          p(k ? x + 8 : x - 18, 47, 10, 2, '#48180a');
          sourcil(p, x, 44, k ? 1 : -1, '#48180a', 1.1);
        });
        p(73, 50, 4, 14, '#c0562c'); p(71, 62, 8, 3, '#c0562c');
        // La barbe postiche.
        p(69, 90, 12, 20, '#ffc86a');
        for (i = 0; i < 4; i++) p(69, 92 + i * 5, 12, 2, '#c0562c');
        if (!ouverte) {
          p(60, 74, 30, 3, '#48180a'); p(58, 72, 3, 3, '#48180a'); p(89, 72, 3, 3, '#48180a');
        } else {
          ovale(p, 75, 76, 19, 11, '#200804');
          ovale(p, 75, 78, 12, 6, '#ffe08a'); ovale(p, 75, 79, 6, 2, '#ffffff');
          for (i = 0; i < 5; i++) { p(60 + i * 7, 67, 3, 5, '#fff0c8'); p(62 + i * 7, 83, 3, 4, '#fff0c8'); }
        }
      },
      arene: {
        ciel: ['#5a1a0e', '#f0883a'], sol: ['#c45622', '#d8642a'], lueur: '#ffe08a',
        decor: function (ctx, t, W) {
          // Les dunes de verre, et la chaleur qui fait trembler l'horizon.
          ctx.fillStyle = '#a03c18';
          for (var i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.ellipse(40 + i * 140, 152, 110, 46 + (i % 2) * 18, 0, Math.PI, 0); ctx.fill();
          }
          ctx.fillStyle = 'rgba(255,240,200,.35)';
          for (i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.ellipse(20 + i * 140, 150, 60, 30 + (i % 2) * 14, 0, Math.PI, Math.PI * 1.4); ctx.fill();
          }
          ctx.strokeStyle = 'rgba(255,224,138,.3)';
          ctx.lineWidth = 1;
          for (i = 0; i < 8; i++) {
            var y = 30 + i * 13;
            ctx.beginPath();
            for (var x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x / 30 + t / 400 + i) * 3);
            ctx.stroke();
          }
        }
      },
      textes: {
        victoire: 'LE SPHINX A VOLÉ EN ÉCLATS',
        recit: 'Il se brise d’un seul coup, dans un bruit de cloche. La question, elle, reste en l’air un moment, puis le vent l’emporte.',
        echec: 'Le Téléportail t’a tiré du sable. Le Sphinx a refermé la bouche : tu n’as pas répondu.',
        reveil: 'La dune se vide de son sable. Dessous, un visage ouvre les yeux…',
        indice: 'Une dune plus régulière que les autres. Quand le vent passe dessus, il prononce presque un mot.'
      }
    },

    // ---------- 8. Ignis ----------
    {
      id: 'soleil-noye', astre: 'ignis', rang: 18,
      nom: 'Le Soleil Noyé',
      c: ['#ff5a14', '#ff9a2a', '#ffe08a'],
      texte: 'Toute la chaleur que l’étoile a bue, c’est ici qu’elle ' +
             'finit. Elle s’est amassée au fond de la mer de lave, elle a ' +
             'pris un visage, et elle attend qu’on vienne la lui reprendre.',
      pv: 56000, cadence: [2300, 1750, 1250], coup: [22, 28, 35],
      prepare: 820, etourdi: 880, interrompre: 5, xp: 4000,
      recompense: { roches: 340, credit: ['pink', 6] },
      corps: { rx: 58, ry: 46, dy: 2 },
      faibles: [{ x: 56, y: 56, r: 8 }, { x: 94, y: 56, r: 8 }, { x: 75, y: 24, r: 7 },
                { x: 44, y: 82, r: 7 }, { x: 106, y: 82, r: 7 }],
      gorge: { x: 75, y: 82, r: 11 },
      dessiner: function (p, ouverte) {
        var i, ang;
        // Les rayons, en couronne.
        for (i = 0; i < 13; i++) {
          ang = Math.PI * (0.96 + i / 12 * 1.08);
          var c = Math.cos(ang), s = Math.sin(ang);
          for (var k = 0; k < 4; k++) {
            p(Math.round(75 + c * (50 + k * 5)) - 3 + k, Math.round(66 + s * (46 + k * 5)) - 3 + k,
              7 - k * 2 + 1, 7 - k * 2 + 1, k < 2 ? '#ff9a2a' : '#ffe08a');
          }
        }
        ovale(p, 75, 66, 48, 44, '#ff5a14'); ovale(p, 75, 62, 40, 34, '#ff9a2a');
        ovale(p, 75, 54, 28, 18, '#ffb84a');
        // Les taches sombres.
        ovale(p, 44, 82, 7, 5, '#3a0a04'); ovale(p, 44, 82, 4, 3, '#c8301a');
        ovale(p, 106, 82, 7, 5, '#3a0a04'); ovale(p, 106, 82, 4, 3, '#c8301a');
        ovale(p, 75, 24, 8, 6, '#1e1414'); ovale(p, 75, 24, 4, 3, '#ffe08a'); p(74, 22, 2, 2, '#ffffff');
        [56, 94].forEach(function (x, kk) {
          ovale(p, x, 56, 10, 8, '#3a0a04');
          ovale(p, x, 56, 7, 5, '#ffe08a');
          ovale(p, x, 56, 2, 4, '#ffffff');
          sourcil(p, x, 54, kk ? 1 : -1, '#3a0a04', 1.3);
        });
        // La mer de lave, d'ou il sort.
        p(8, 100, 134, 12, '#c8301a'); p(8, 100, 134, 2, '#ff9a2a');
        p(20, 104, 16, 1, '#ffe08a'); p(64, 106, 22, 1, '#ffe08a'); p(108, 104, 18, 1, '#ffe08a');
        if (!ouverte) {
          p(57, 80, 36, 3, '#3a0a04'); p(55, 77, 3, 4, '#3a0a04'); p(92, 77, 3, 4, '#3a0a04');
        } else {
          ovale(p, 75, 82, 23, 13, '#3a0a04');
          ovale(p, 75, 84, 15, 7, '#ffe08a'); ovale(p, 75, 85, 8, 3, '#ffffff');
          for (i = 0; i < 6; i++) { p(56 + i * 7, 72, 4, 6, '#1e1414'); p(58 + i * 7, 91, 4, 4, '#1e1414'); }
        }
      },
      arene: {
        ciel: ['#120302', '#7a1408'], sol: ['#1e1414', '#3a2a2a'], lueur: '#ff9a2a',
        decor: function (ctx, t, W) {
          // La mer de lave a l'horizon, et la cendre qui tombe tout droit.
          var g = ctx.createLinearGradient(0, 110, 0, 152);
          g.addColorStop(0, '#ff9a2a'); g.addColorStop(1, '#c8301a');
          ctx.fillStyle = g;
          ctx.fillRect(-10, 112, W + 20, 40);
          ctx.fillStyle = 'rgba(255,224,138,.6)';
          for (var i = 0; i < 7; i++) ctx.fillRect((i * 71) % W, 118 + (i % 4) * 8, 30 + (i % 3) * 14, 1);
          ctx.fillStyle = 'rgba(110,80,76,.8)';
          for (i = 0; i < 50; i++) {
            ctx.fillRect((i * 37) % W, ((t / 14 + i * 29) % 150), i % 3 ? 1 : 2, i % 3 ? 2 : 3);
          }
        }
      },
      textes: {
        victoire: 'LE SOLEIL NOYÉ S’EST COUCHÉ',
        recit: 'Il s’enfonce dans la lave sans une vague. Et là-haut, pour la première fois depuis toujours, l’étoile du système se met à briller.',
        echec: 'Le Téléportail t’a arraché à la fournaise. Au fond de la mer, la lueur n’a pas faibli.',
        reveil: 'La mer de lave se soulève, d’un seul bloc, sans une ride…',
        indice: 'Un endroit où la lave est plus claire, et ronde. Elle ne bouge pas. Rien ne bouge, ici.'
      }
    }
  ];

  LISTE.forEach(function (g) {
    g.fond = B.arene(g.arene);
    B.definir(g);
    V.MONSTRES.push({
      id: g.id, astre: g.astre, nom: g.nom, boss: true, carrure: 'colosse', palier: 6,
      c: g.c, texte: g.texte
    });
  });
})();
