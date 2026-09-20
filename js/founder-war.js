// Les mini-jeux du DinderPad, et le premier d'entre eux : The Founder War.
//
// Ce fichier est charge APRES js/views.js : il ajoute ses ecrans a
// window.VIEWS sans toucher a ceux qui existent deja.
//
// Le jeu se joue en trois temps, tous sur le meme ecran du pad :
//   1. on choisit cinq Dinders (debloques ou non) ;
//   2. on les fait traverser une foret 8 bits au joystick jusqu'a l'arene ;
//   3. les cinq affrontent Le Fondateur au tour par tour.
// Gagner rapporte dix credits Universels.
(function () {
  var DP = window.DP;
  if (!DP) return;

  // ==========================================================
  //  Petits outils
  // ==========================================================

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function entier(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  function borne(v, a, b) { return v < a ? a : (v > b ? b : v); }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Un bruit stable : la meme case de foret est toujours dessinee pareil,
  // d'une partie a l'autre et d'un joueur a l'autre.
  function bruit(x, y, sel) {
    var h = (x | 0) * 374761393 + (y | 0) * 668265263 + (sel || 0) * 2147483647;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  // Charge une serie d'images et ne rend la main que lorsque tout est pret.
  function charger(liste, fini) {
    var reste = liste.length, images = {};
    if (!reste) return fini(images);
    liste.forEach(function (e) {
      var img = new Image();
      img.onload = img.onerror = function () {
        images[e.cle] = img;
        if (--reste === 0) fini(images);
      };
      img.src = e.src;
    });
  }

  // ==========================================================
  //  Les attaques
  //  Chaque Dinder en a deux : une franche, une qui joue sur autre chose
  //  que les seuls degats. Le Fondateur a 1000 points de vie, les Dinders
  //  100 chacun : sans les soins, les boucliers et les etourdissements,
  //  la partie se perd.
  // ==========================================================

  var ATTAQUES = {
    'dr-islas-human-form': [
      { nom: 'Scalpel Mental',      degats: [38, 52] },
      { nom: 'Sérum d’Appoint',     degats: [14, 20], soin: 55 }
    ],
    'dr-islas-demicos-form': [
      { nom: 'Greffe Demicos',      degats: [46, 62] },
      { nom: 'Mutation Fulgurante', degats: [20, 28], boost: 0.4 }
    ],
    'dr-islas-final-form': [
      { nom: 'Jugement SS-03',      degats: [70, 92] },
      { nom: 'Effondrement Temporel', degats: [48, 62], etourdit: 0.55 }
    ],
    'calder-veyne-veinburner': [
      { nom: 'Brûlure Veineuse',    degats: [36, 48], brulure: 12 },
      { nom: 'Coup de Sang',        degats: [66, 84], recul: 12 }
    ],
    'carl-sinars-cardinal-sin': [
      { nom: 'Sept Péchés',         degats: [7, 12], coups: 7 },
      { nom: 'Absolution Volée',    degats: [34, 46], drain: true }
    ],
    'edgar-marks-grincrusher': [
      { nom: 'Broyeuse à Sourire',  degats: [52, 70] },
      { nom: 'Rictus Sismique',     degats: [26, 36], faiblesse: 0.5 }
    ],
    'he-melt': [
      { nom: 'Fonte Dimensionnelle', degats: [44, 58], faiblesse: 0.2 },
      { nom: 'Marée de Magma',      degats: [56, 74], brulure: 8 }
    ],
    'v': [
      { nom: 'Vecteur Zéro',        degats: [68, 88] },
      { nom: 'Verrou Chronologique', degats: [30, 40], etourdit: 0.7 }
    ],
    'a': [
      { nom: 'Axiome Brisé',        degats: [72, 94] },
      { nom: 'Amnésie Absolue',     degats: [26, 36], oubli: true }
    ],
    'h': [
      { nom: 'Horizon Coupé',       degats: [66, 90] },
      { nom: 'Hérésie Partagée',    degats: [30, 42], soinTous: 26 }
    ],
    'multinder': [
      { nom: 'Multiplication',      degats: [16, 24], coups: 3 },
      { nom: 'Copie Conforme',      degats: [10, 14], copie: 0.8 }
    ],
    'gart-kervelor-king-of-karsovia': [
      { nom: 'Décret Royal',        degats: [50, 68] },
      { nom: 'Bouclier de Karsovia', degats: [12, 18], bouclier: 40 }
    ]
  };

  // Deux attaques de secours, si un Dinder venait a etre ajoute au roster
  // sans qu'on lui ecrive les siennes.
  var ATTAQUES_PAR_DEFAUT = [
    { nom: 'Charge',   degats: [34, 48] },
    { nom: 'Riposte',  degats: [20, 30], bouclier: 18 }
  ];

  function attaquesDe(id) { return ATTAQUES[id] || ATTAQUES_PAR_DEFAUT; }

  // Les degats du Fondateur sont regles pour qu'une equipe qui se contente
  // de taper perde souvent : il tue a peu pres un Dinder par tour, et la
  // troupe perd d'autant sa force de frappe. Il faut soigner et se couvrir.
  var FONDATEUR = {
    pv: 1000,
    enrage: 0.5,                        // sous la moitie, il frappe deux fois
    attaques: [
      { nom: 'Poing Fondateur',     degats: [52, 70], cible: 'un' },
      { nom: 'Onde de Fondation',   degats: [30, 42], cible: 'tous' },
      { nom: 'Œil Écarlate',        degats: [78, 98], cible: 'un' },
      { nom: 'Fracture Originelle', degats: [55, 72], cible: 'tous', charge: true }
    ]
  };

  var PV_DINDER = 100;

  // ==========================================================
  //  L'ecran des mini-jeux
  // ==========================================================

  // Les deux emplacements libres attendent les prochains jeux : ils ne
  // portent pas de nom tant que tu ne leur en as pas donne un.
  var JEUX = [
    { id: 'founder-war', nom: 'The Founder War',
      sous: 'Cinq Dinders contre Le Fondateur',
      vue: 'founder-war', pret: true },
    { id: 'libre-2', nom: 'Emplacement libre', sous: 'À venir', pret: false },
    { id: 'libre-3', nom: 'Emplacement libre', sous: 'À venir', pret: false }
  ];

  function viewMinijeux(view) {
    var box = el('div', 'mj');
    box.appendChild(el('h2', 'mj-titre', 'Mini-jeux'));

    var liste = el('div', 'mj-liste');
    JEUX.forEach(function (j) {
      var n = j.pret ? el('a', 'mj-jeu') : el('div', 'mj-jeu mj-jeu--soon');
      if (j.pret) n.href = '#' + j.vue;

      var vignette = el('span', 'mj-vignette');
      if (j.pret) {
        var img = el('img');
        img.src = DP.sprite('lefondateur', 'duel');
        img.alt = '';
        vignette.appendChild(img);
      } else {
        vignette.appendChild(el('span', 'mj-verrou', '?'));
      }
      n.appendChild(vignette);

      var txt = el('span', 'mj-txt');
      txt.appendChild(el('strong', null, j.nom));
      txt.appendChild(el('span', 'mj-sous', j.sous));
      n.appendChild(txt);

      if (j.pret) n.appendChild(el('span', 'mj-go', 'JOUER'));
      liste.appendChild(n);
    });

    box.appendChild(liste);
    view.appendChild(box);
  }

  // ==========================================================
  //  The Founder War
  // ==========================================================

  // ---- La carte de la foret ----
  // 44 x 28 cases de 24 px : 1056 x 672 px de monde pour une fenetre de
  // 480 x 316. La camera suit le meneur.
  var MW = 44, MH = 28, TS = 24;
  var HERBE = 0, FLEUR = 1, CHEMIN = 2, ARBRE = 3, BUISSON = 4,
      ROCHER = 5, EAU = 6, MUR = 7, DALLE = 8, PORTE = 9;

  var BLOQUANT = {};
  BLOQUANT[ARBRE] = BLOQUANT[BUISSON] = BLOQUANT[ROCHER] =
  BLOQUANT[EAU] = BLOQUANT[MUR] = true;

  // L'arene, en haut a droite, et sa porte au milieu du mur du bas.
  // La porte fait quatre cases : assez large pour qu'on y entre sans
  // avoir a se faufiler, et assez grande pour avoir l'air d'un portail.
  var AR = { x0: 29, y0: 2, x1: 41, y1: 11 };
  var PORTE_X0 = 33, PORTE_X1 = 36, PORTE_Y = AR.y1;
  var PORTE_X = PORTE_X0;
  var DEPART = { x: 5 * TS + 12, y: 24 * TS + 12 };

  // Le chemin de terre, de la clairiere de depart jusqu'a la porte.
  var JALONS = [
    [5, 24], [9, 24], [12, 21], [11, 17], [15, 14],
    [20, 16], [25, 17], [29, 14], [33, 13], [(PORTE_X0 + PORTE_X1) / 2 | 0, PORTE_Y + 1]
  ];

  function construireCarte() {
    var g = [], x, y;
    for (y = 0; y < MH; y++) {
      g.push([]);
      for (x = 0; x < MW; x++) g[y].push(bruit(x, y, 1) < 0.09 ? FLEUR : HERBE);
    }

    // L'etang, au creux de la foret.
    for (y = 7; y <= 10; y++) {
      for (x = 6; x <= 11; x++) {
        var dx = (x - 8.5) / 3.2, dy = (y - 8.5) / 2.1;
        if (dx * dx + dy * dy <= 1) g[y][x] = EAU;
      }
    }

    // Le chemin : un sentier de deux cases de large entre les jalons.
    // Trois, et la foret se transformait en clairiere.
    function poser(cx, cy) {
      for (var j = 0; j <= 1; j++) {
        for (var i = 0; i <= 1; i++) {
          var nx = cx + i, ny = cy + j;
          if (nx < 1 || ny < 1 || nx >= MW - 1 || ny >= MH - 1) continue;
          if (g[ny][nx] === EAU) continue;
          g[ny][nx] = CHEMIN;
        }
      }
    }
    for (var k = 0; k < JALONS.length - 1; k++) {
      var a = JALONS[k], b = JALONS[k + 1];
      var pas = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 2;
      for (var t = 0; t <= pas; t++) {
        poser(Math.round(a[0] + (b[0] - a[0]) * t / pas),
              Math.round(a[1] + (b[1] - a[1]) * t / pas));
      }
    }

    var surChemin = [];
    for (y = 0; y < MH; y++) { surChemin.push([]); for (x = 0; x < MW; x++) surChemin[y][x] = g[y][x] === CHEMIN; }

    function pres(cx, cy, d) {
      for (var j = -d; j <= d; j++)
        for (var i = -d; i <= d; i++) {
          var nx = cx + i, ny = cy + j;
          if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
          if (surChemin[ny][nx]) return true;
        }
      return false;
    }

    // La foret : des bosquets, jamais collés au chemin.
    for (y = 0; y < MH; y++) {
      for (x = 0; x < MW; x++) {
        if (g[y][x] !== HERBE && g[y][x] !== FLEUR) continue;
        if (x >= AR.x0 - 1 && x <= AR.x1 + 1 && y >= AR.y0 - 1 && y <= AR.y1 + 1) continue;
        var bord = x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2;
        var n = bruit(x, y, 2);
        if (bord) { g[y][x] = ARBRE; continue; }
        if (pres(x, y, 1)) continue;
        if (n < 0.20) g[y][x] = ARBRE;
        else if (n < 0.25) g[y][x] = BUISSON;
        else if (n < 0.28) g[y][x] = ROCHER;
      }
    }

    // L'arene : des murs epais, un sol dalle, une porte au sud.
    for (y = AR.y0; y <= AR.y1; y++) {
      for (x = AR.x0; x <= AR.x1; x++) {
        var mur = x === AR.x0 || x === AR.x1 || y === AR.y0 || y === AR.y1;
        g[y][x] = mur ? MUR : DALLE;
      }
    }
    for (x = PORTE_X0; x <= PORTE_X1; x++) g[PORTE_Y][x] = PORTE;

    // Le parvis devant la porte, pour qu'on l'atteigne toujours.
    for (y = AR.y1 + 1; y <= AR.y1 + 1; y++)
      for (x = PORTE_X0; x <= PORTE_X1; x++)
        if (g[y] && g[y][x] !== undefined) g[y][x] = CHEMIN;

    return g;
  }

  // ---- Le decor de la foret, peint une fois pour toutes ----

  function peindreMonde(g) {
    var c = document.createElement('canvas');
    c.width = MW * TS; c.height = MH * TS;
    var x = c.getContext('2d');
    var y0, x0;

    // Le sol d'abord : herbe, chemin, eau, dalles.
    for (y0 = 0; y0 < MH; y0++)
      for (x0 = 0; x0 < MW; x0++) solTuile(x, g, x0, y0);

    // Puis ce qui depasse, du haut vers le bas pour que les cimes se
    // recouvrent correctement.
    for (y0 = 0; y0 < MH; y0++)
      for (x0 = 0; x0 < MW; x0++) objetTuile(x, g, x0, y0);

    return c;
  }

  function solTuile(x, g, tx, ty) {
    var t = g[ty][tx], px = tx * TS, py = ty * TS, i, n;

    if (t === EAU) {
      x.fillStyle = '#1d4f9c'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#2a68c4';
      for (i = 0; i < 5; i++) {
        n = bruit(tx, ty, 10 + i);
        x.fillRect(px + (n * 18 | 0), py + i * 5 + 1, 6, 2);
      }
      return;
    }

    if (t === DALLE || t === MUR || t === PORTE) {
      x.fillStyle = '#6b6f7d'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#7c8090';
      x.fillRect(px + 1, py + 1, TS - 3, 10);
      x.fillRect(px + 1, py + 13, TS - 3, 9);
      x.fillStyle = 'rgba(0,0,0,.22)';
      x.fillRect(px, py + 11, TS, 2);
      x.fillRect(px + (ty % 2 ? 6 : 16), py, 2, 11);
      x.fillRect(px + (ty % 2 ? 16 : 6), py + 13, 2, 9);
      return;
    }

    if (t === CHEMIN) {
      x.fillStyle = '#a5794a'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#b98c59';
      for (i = 0; i < 6; i++) {
        n = bruit(tx, ty, 20 + i);
        x.fillRect(px + (n * 20 | 0), py + ((bruit(tx, ty, 30 + i) * 20) | 0), 3, 2);
      }
      x.fillStyle = '#8e6539';
      for (i = 0; i < 3; i++) {
        n = bruit(tx, ty, 40 + i);
        x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 50 + i) * 21) | 0), 2, 2);
      }
      return;
    }

    // Herbe : deux verts en damier, puis des touffes.
    x.fillStyle = (tx + ty) % 2 ? '#3d8b38' : '#438f3c';
    x.fillRect(px, py, TS, TS);
    x.fillStyle = '#4d9c42';
    for (i = 0; i < 4; i++) {
      n = bruit(tx, ty, 60 + i);
      x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 70 + i) * 21) | 0), 3, 2);
    }
    x.fillStyle = '#347a30';
    for (i = 0; i < 3; i++) {
      n = bruit(tx, ty, 80 + i);
      x.fillRect(px + (n * 22 | 0), py + ((bruit(tx, ty, 90 + i) * 22) | 0), 2, 3);
    }
    if (t === FLEUR) {
      var fx = px + 8 + ((bruit(tx, ty, 3) * 6) | 0);
      var fy = py + 8 + ((bruit(tx, ty, 4) * 6) | 0);
      var tons = ['#f6e05e', '#f28ab2', '#e8eef7', '#f0a15a'];
      x.fillStyle = '#2f6e2c'; x.fillRect(fx + 2, fy + 3, 2, 4);
      x.fillStyle = tons[(bruit(tx, ty, 5) * 4) | 0];
      x.fillRect(fx + 1, fy, 4, 3);
      x.fillRect(fx, fy + 1, 6, 1);
    }
  }

  function objetTuile(x, g, tx, ty) {
    var t = g[ty][tx], px = tx * TS, py = ty * TS, i, n;

    if (t === ARBRE) {
      // Un arbre deborde d'une case vers le haut : c'est ce qui donne du
      // relief a la foret.
      var hx = px + TS / 2;
      x.fillStyle = 'rgba(0,0,0,.25)';
      x.fillRect(px + 3, py + TS - 5, TS - 6, 4);
      x.fillStyle = '#6b4526'; x.fillRect(hx - 4, py + 8, 8, TS - 10);
      x.fillStyle = '#7d5430'; x.fillRect(hx - 4, py + 8, 3, TS - 10);
      x.fillStyle = '#573619'; x.fillRect(hx + 1, py + 12, 2, 5);

      x.fillStyle = '#1f5c26';
      x.fillRect(px - 2, py - 12, TS + 4, 22);
      x.fillRect(px + 2, py - 18, TS - 4, 30);
      x.fillStyle = '#2a7a2f';
      x.fillRect(px + 1, py - 14, TS - 6, 16);
      x.fillStyle = '#3a9b3a';
      x.fillRect(px + 3, py - 16, 9, 7);
      x.fillRect(px + 2, py - 9, 5, 4);
      x.fillStyle = '#16451c';
      for (i = 0; i < 4; i++) {
        n = bruit(tx, ty, 100 + i);
        x.fillRect(px + 2 + (n * 18 | 0), py - 12 + ((bruit(tx, ty, 110 + i) * 18) | 0), 4, 3);
      }
      return;
    }

    if (t === BUISSON) {
      x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(px + 3, py + TS - 4, TS - 6, 3);
      x.fillStyle = '#1f5f28'; x.fillRect(px + 2, py + 6, TS - 4, TS - 9);
      x.fillStyle = '#2d8034'; x.fillRect(px + 3, py + 5, TS - 8, 9);
      x.fillStyle = '#3f9c42'; x.fillRect(px + 5, py + 6, 6, 4);
      x.fillStyle = '#d8434f';
      for (i = 0; i < 3; i++) {
        n = bruit(tx, ty, 120 + i);
        x.fillRect(px + 4 + (n * 14 | 0), py + 9 + ((bruit(tx, ty, 130 + i) * 9) | 0), 2, 2);
      }
      return;
    }

    if (t === ROCHER) {
      x.fillStyle = 'rgba(0,0,0,.24)'; x.fillRect(px + 3, py + TS - 4, TS - 6, 3);
      x.fillStyle = '#5d6270'; x.fillRect(px + 3, py + 7, TS - 6, TS - 10);
      x.fillStyle = '#767c8c'; x.fillRect(px + 4, py + 6, TS - 10, 7);
      x.fillStyle = '#8f95a6'; x.fillRect(px + 6, py + 7, 5, 3);
      x.fillStyle = '#43485a'; x.fillRect(px + 10, py + 12, 7, 3);
      return;
    }

    if (t === MUR) {
      // Creneaux et torches sur la facade de l'arene.
      x.fillStyle = '#4d5160'; x.fillRect(px, py, TS, 3);
      if (ty === AR.y0) {
        x.fillStyle = '#878ca0';
        x.fillRect(px + (tx % 2 ? 2 : 12), py - 6, 9, 7);
      }
      if (ty === AR.y1 && tx % 3 === 0) {
        x.fillStyle = '#4a3420'; x.fillRect(px + 10, py + 6, 3, 10);
        x.fillStyle = '#ff9b35'; x.fillRect(px + 9, py + 1, 5, 6);
        x.fillStyle = '#ffe27a'; x.fillRect(px + 10, py + 2, 3, 3);
      }
      return;
    }

    if (t === PORTE) {
      x.fillStyle = '#20232e'; x.fillRect(px, py + 2, TS, TS - 2);
      x.fillStyle = '#c9a227'; x.fillRect(px, py, TS, 3);
      x.fillStyle = 'rgba(255,225,120,.16)'; x.fillRect(px, py + 4, TS, TS - 6);
    }
  }

  // ==========================================================
  //  La vue du jeu
  // ==========================================================

  function viewFounderWar(view) {
    var jeu = el('div', 'fw');
    jeu.dataset.etape = 'equipe';
    view.appendChild(jeu);

    var equipe = [];                 // les identifiants choisis
    var minuteurs = [];
    function plusTard(fn, ms) { var t = setTimeout(fn, ms); minuteurs.push(t); return t; }
    function toutAnnuler() { minuteurs.forEach(clearTimeout); minuteurs = []; }

    // La vue peut etre remplacee a tout moment par l'aiguillage : chaque
    // boucle et chaque minuteur verifie qu'il est encore a l'ecran.
    function vivant() { return document.body.contains(jeu); }

    // ---------- 1. Le choix de l'equipe ----------

    function ecranEquipe() {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'equipe';

      var tete = el('div', 'fw-tete');
      tete.appendChild(el('h2', 'fw-titre', 'The Founder War'));
      var compte = el('p', 'fw-compte');
      tete.appendChild(compte);
      jeu.appendChild(tete);

      var grille = el('div', 'fw-roster');
      jeu.appendChild(grille);

      var pied = el('div', 'fw-pied');
      var go = el('button', 'fw-btn fw-btn--go', 'EN ROUTE');
      go.type = 'button';
      pied.appendChild(go);
      jeu.appendChild(pied);

      function rafraichir() {
        compte.textContent = equipe.length + ' / 5 Dinders engagés';
        go.disabled = equipe.length !== 5;
        grille.querySelectorAll('.fw-carte').forEach(function (n) {
          var pris = equipe.indexOf(n.dataset.id) !== -1;
          n.classList.toggle('is-pris', pris);
          n.setAttribute('aria-pressed', pris ? 'true' : 'false');
          var rang = n.querySelector('.fw-rang');
          rang.textContent = pris ? (equipe.indexOf(n.dataset.id) + 1) : '';
        });
      }

      DP.DINDERS.forEach(function (d) {
        var n = el('button', 'fw-carte');
        n.type = 'button';
        n.dataset.id = d.id;
        n.dataset.rarity = DP.rarityKey(d.rarity);

        // Le sprite de duel, plus fin : la carte l'affiche en grand.
        var img = el('img', 'fw-sprite');
        img.src = DP.sprite(d.id, 'duel');
        img.alt = '';
        n.appendChild(img);

        var nom = el('span', 'fw-nom', d.name);
        n.appendChild(nom);
        n.appendChild(el('span', 'fw-rarete', d.rarity));
        n.appendChild(el('span', 'fw-rang'));
        // Un Dinder non debloque reste jouable ici : on le signale d'un
        // petit cadenas plutot que d'une etiquette qui mange la vignette.
        if (!DP.has(d.id)) {
          var verrou = el('span', 'fw-verrou');
          verrou.title = 'Non débloqué';
          verrou.setAttribute('aria-label', 'non débloqué');
          n.appendChild(verrou);
        }

        n.addEventListener('click', function () {
          var i = equipe.indexOf(d.id);
          if (i !== -1) equipe.splice(i, 1);
          else if (equipe.length < 5) equipe.push(d.id);
          rafraichir();
        });
        grille.appendChild(n);
      });

      go.addEventListener('click', function () {
        if (equipe.length === 5) ecranForet();
      });

      rafraichir();
    }

    // ---------- 2. La foret ----------

    function ecranForet() {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'foret';

      var scene = el('div', 'fw-scene');
      var cv = el('canvas', 'fw-canvas');
      cv.width = 480; cv.height = 316;
      scene.appendChild(cv);

      var hud = el('div', 'fw-hud');
      hud.appendChild(el('span', 'fw-hud-txt', 'Rejoins l’arène du Fondateur'));
      var boussole = el('span', 'fw-boussole', '➤');
      hud.appendChild(boussole);
      scene.appendChild(hud);

      // Le joystick : un socle et un pommeau qu'on pousse.
      var stick = el('div', 'fw-stick');
      var pomme = el('div', 'fw-pomme');
      stick.appendChild(pomme);
      scene.appendChild(stick);

      var entrer = el('button', 'fw-entrer', 'ENTRER DANS L’ARÈNE');
      entrer.type = 'button';
      entrer.hidden = true;
      scene.appendChild(entrer);

      jeu.appendChild(scene);

      var g = construireCarte();
      var monde = peindreMonde(g);
      var ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      var aCharger = equipe.map(function (id) {
        return { cle: id, src: DP.sprite(id, 'walk') };
      });
      aCharger.push({ cle: 'lefondateur', src: DP.sprite('lefondateur', 'walk') });

      charger(aCharger, function (sprites) {
        if (!vivant()) return;
        lancerForet(g, monde, ctx, cv, sprites, stick, pomme, entrer, boussole);
      });
    }

    function lancerForet(g, monde, ctx, cv, sprites, stick, pomme, entrer, boussole) {
      var VUE_W = cv.width, VUE_H = cv.height;
      var VITESSE = 86;                       // px de monde par seconde

      var chef = { x: DEPART.x, y: DEPART.y, sens: 1, pas: 0 };
      var trace = [];                         // les pas du meneur
      var suite = equipe.slice(1);            // les quatre suiveurs
      var dir = { x: 0, y: 0 };
      var arrive = false;

      // --- Le joystick ---
      var actif = false, rayon = 0, centre = { x: 0, y: 0 };

      function prendre(e) {
        var r = stick.getBoundingClientRect();
        rayon = r.width / 2;
        centre.x = r.left + rayon; centre.y = r.top + rayon;
        actif = true;
        stick.classList.add('is-actif');
        if (stick.setPointerCapture) { try { stick.setPointerCapture(e.pointerId); } catch (err) {} }
        bouger(e);
      }
      function bouger(e) {
        if (!actif) return;
        var dx = e.clientX - centre.x, dy = e.clientY - centre.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var k = Math.min(1, d / (rayon * 0.72));
        dir.x = dx / d * k; dir.y = dy / d * k;
        pomme.style.transform = 'translate(' + (dir.x * rayon * 0.5) + 'px,' +
                                               (dir.y * rayon * 0.5) + 'px)';
      }
      function lacher() {
        actif = false;
        dir.x = dir.y = 0;
        stick.classList.remove('is-actif');
        pomme.style.transform = '';
      }
      stick.addEventListener('pointerdown', prendre);
      stick.addEventListener('pointermove', bouger);
      stick.addEventListener('pointerup', lacher);
      stick.addEventListener('pointercancel', lacher);
      stick.addEventListener('lostpointercapture', lacher);

      // --- Le clavier, pour jouer au bureau ---
      var touches = {};
      var CLAVIER = {
        ArrowUp: 'h', ArrowDown: 'b', ArrowLeft: 'g', ArrowRight: 'd',
        z: 'h', s: 'b', q: 'g', d: 'd', w: 'h', a: 'g'
      };
      function auClavier(e, enfonce) {
        var k = CLAVIER[e.key];
        if (!k) return;
        touches[k] = enfonce;
        e.preventDefault();
      }
      var kd = function (e) { auClavier(e, true); };
      var ku = function (e) { auClavier(e, false); };
      window.addEventListener('keydown', kd);
      window.addEventListener('keyup', ku);

      function retirerEcoutes() {
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
      }

      // --- Les collisions ---
      // On teste les pieds du sprite, pas tout son corps : c'est ce qui
      // permet de passer devant un arbre sans se coincer dedans.
      function libre(x, y) {
        var b = [[x - 7, y - 3], [x + 7, y - 3], [x - 7, y + 4], [x + 7, y + 4]];
        for (var i = 0; i < b.length; i++) {
          var tx = Math.floor(b[i][0] / TS), ty = Math.floor(b[i][1] / TS);
          if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return false;
          if (BLOQUANT[g[ty][tx]]) return false;
        }
        return true;
      }

      function surLaPorte() {
        var tx = Math.floor(chef.x / TS), ty = Math.floor(chef.y / TS);
        return g[ty] && g[ty][tx] === PORTE;
      }

      var dernier = 0, cam = { x: 0, y: 0 };

      function boucle(t) {
        if (!vivant()) { retirerEcoutes(); return; }
        var dt = dernier ? Math.min(0.05, (t - dernier) / 1000) : 0;
        dernier = t;

        var vx = dir.x, vy = dir.y;
        if (touches.g) vx = -1; if (touches.d) vx = 1;
        if (touches.h) vy = -1; if (touches.b) vy = 1;
        var n = Math.sqrt(vx * vx + vy * vy);
        if (n > 1) { vx /= n; vy /= n; }

        if (!arrive && (vx || vy)) {
          var nx = chef.x + vx * VITESSE * dt;
          var ny = chef.y + vy * VITESSE * dt;
          if (libre(nx, chef.y)) chef.x = nx;
          if (libre(chef.x, ny)) chef.y = ny;
          if (vx) chef.sens = vx < 0 ? -1 : 1;
          chef.pas += Math.abs(vx) + Math.abs(vy);
          trace.unshift({ x: chef.x, y: chef.y, sens: chef.sens });
          if (trace.length > 400) trace.length = 400;
        }

        // La camera suit, mais ne sort jamais de la carte.
        cam.x = borne(chef.x - VUE_W / 2, 0, MW * TS - VUE_W);
        cam.y = borne(chef.y - VUE_H / 2, 0, MH * TS - VUE_H);

        // La case occupee par la troupe, inscrite sur le conteneur : elle
        // sert de repere de position, et rend la marche verifiable.
        var casier = Math.floor(chef.x / TS) + ',' + Math.floor(chef.y / TS);
        if (jeu.dataset.tuile !== casier) jeu.dataset.tuile = casier;

        dessinerForet(t);

        var dedans = surLaPorte();
        if (dedans !== !entrer.hidden) entrer.hidden = !dedans;

        requestAnimationFrame(boucle);
      }

      function dessinerForet(t) {
        ctx.drawImage(monde, cam.x | 0, cam.y | 0, VUE_W, VUE_H, 0, 0, VUE_W, VUE_H);

        // L'eau bouge : deux lignes claires qui glissent.
        var t0 = t / 320;
        for (var ty = Math.floor(cam.y / TS); ty <= (cam.y + VUE_H) / TS; ty++) {
          for (var tx = Math.floor(cam.x / TS); tx <= (cam.x + VUE_W) / TS; tx++) {
            if (!g[ty] || g[ty][tx] !== EAU) continue;
            var px = tx * TS - cam.x, py = ty * TS - cam.y;
            ctx.fillStyle = 'rgba(190,225,255,.5)';
            var o = ((Math.sin(t0 + tx * 0.7 + ty) * 7) | 0) + 8;
            ctx.fillRect(px + o, py + 6, 7, 2);
            ctx.fillRect(px + (TS - o - 6), py + 15, 5, 2);
          }
        }

        // Les lucioles : le detail qui fait vivre le sous-bois.
        if (!reduit) {
          for (var i = 0; i < 18; i++) {
            var bx = (bruit(i, 7, 200) * MW * TS + Math.sin(t / 900 + i) * 26);
            var by = (bruit(i, 9, 201) * MH * TS + Math.cos(t / 1100 + i * 2) * 20);
            var sx = bx - cam.x, sy = by - cam.y;
            if (sx < -4 || sy < -4 || sx > VUE_W || sy > VUE_H) continue;
            var a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t / 380 + i * 1.7));
            ctx.fillStyle = 'rgba(214,255,140,' + a.toFixed(2) + ')';
            ctx.fillRect(sx | 0, sy | 0, 2, 2);
          }
        }

        // Le Fondateur attend au milieu de son arene, on le voit d'en haut.
        var fx = (AR.x0 + AR.x1 + 1) / 2 * TS, fy = (AR.y0 + AR.y1 + 1) / 2 * TS;
        if (fx - cam.x > -60 && fx - cam.x < VUE_W + 60) {
          var lueur = 0.18 + 0.12 * Math.sin(t / 500);
          ctx.fillStyle = 'rgba(255,60,50,' + lueur.toFixed(2) + ')';
          ctx.beginPath();
          ctx.ellipse(fx - cam.x, fy - cam.y + 4, 30, 14, 0, 0, 6.3);
          ctx.fill();
        }

        // La troupe : les suiveurs d'abord, le meneur par-dessus.
        var ordre = [{ id: 'lefondateur', x: fx, y: fy, sens: 1, pas: 0, fixe: true }];
        for (var k = suite.length - 1; k >= 0; k--) {
          var p = trace[Math.min(trace.length - 1, (k + 1) * 26)] || chef;
          ordre.push({ id: suite[k], x: p.x, y: p.y, sens: p.sens, pas: chef.pas + k * 3 });
        }
        ordre.push({ id: equipe[0], x: chef.x, y: chef.y, sens: chef.sens, pas: chef.pas });
        ordre.sort(function (a, b) { return a.y - b.y; });
        ordre.forEach(function (p) { poserSprite(p, t); });

        // La boussole pointe vers la porte de l'arene.
        var ax = ((PORTE_X0 + PORTE_X1 + 1) / 2) * TS - chef.x, ay = (PORTE_Y + 0.5) * TS - chef.y;
        boussole.style.transform = 'rotate(' + Math.atan2(ay, ax) + 'rad)';
      }

      function poserSprite(p, t) {
        var img = sprites[p.id];
        if (!img || !img.width) return;
        var w = img.width, h = img.height;
        var sx = Math.round(p.x - cam.x - w / 2);
        var sy = Math.round(p.y - cam.y - h + 6);
        // Un leger balancement : deux poses, comme un sprite a deux frames.
        // Le Fondateur, lui, ne marche pas : il respire sur place.
        var bond = reduit ? 0
                 : p.fixe ? (Math.floor(t / 520) % 2 ? 1 : 0)
                 : (Math.floor(p.pas / 7) % 2 ? 1 : 0);

        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.beginPath();
        ctx.ellipse(p.x - cam.x, p.y - cam.y + 3, w * 0.3, 3.5, 0, 0, 6.3);
        ctx.fill();

        ctx.save();
        if (p.sens < 0) {
          ctx.translate(sx + w, sy + bond);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);
        } else {
          ctx.drawImage(img, sx, sy + bond);
        }
        ctx.restore();
      }

      entrer.addEventListener('click', function () {
        if (arrive) return;
        arrive = true;
        retirerEcoutes();
        ecranCombat();
      });

      requestAnimationFrame(boucle);
    }

    // ---------- 3. Le combat ----------

    function ecranCombat() {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'combat';

      var scene = el('div', 'fw-arene');

      var fond = el('canvas', 'fw-canvas fw-canvas--arene');
      fond.width = 480; fond.height = 316;
      scene.appendChild(fond);

      // Barre de vie du Fondateur
      var barreBoss = el('div', 'fw-boss-barre');
      barreBoss.appendChild(el('span', 'fw-boss-nom', 'LE FONDATEUR'));
      var jaugeBoss = el('span', 'fw-jauge');
      var remplBoss = el('span', 'fw-jauge-plein');
      jaugeBoss.appendChild(remplBoss);
      barreBoss.appendChild(jaugeBoss);
      var pvBoss = el('span', 'fw-boss-pv');
      barreBoss.appendChild(pvBoss);
      scene.appendChild(barreBoss);

      var boss = el('div', 'fw-boss');
      var bossImg = el('img');
      bossImg.src = DP.sprite('lefondateur', 'duel');
      bossImg.alt = 'Le Fondateur';
      boss.appendChild(bossImg);
      scene.appendChild(boss);

      var rang = el('div', 'fw-rangee');
      scene.appendChild(rang);

      var journal = el('p', 'fw-journal', 'Le Fondateur se dresse devant vous.');
      scene.appendChild(journal);

      var menu = el('div', 'fw-menu');
      scene.appendChild(menu);

      jeu.appendChild(scene);

      peindreArene(fond.getContext('2d'), fond.width, fond.height);

      // --- L'etat du combat ---
      var etat = {
        boss: FONDATEUR.pv,
        bossMax: FONDATEUR.pv,
        brulure: 0, brulureTours: 0,
        faiblesse: 0, charge: null, saute: false,
        bouclier: 0,
        dernierDegat: 0,
        tour: 1, index: 0, fini: false
      };

      var troupe = equipe.map(function (id) {
        var d = DP.byId(id);
        return { id: id, nom: d.name, forme: d.form, rarete: d.rarity,
                 pv: PV_DINDER, max: PV_DINDER, boost: 0, ko: false, node: null };
      });

      // --- Les cartes des Dinders ---
      troupe.forEach(function (c) {
        var n = el('div', 'fw-combattant');
        n.dataset.rarity = DP.rarityKey(c.rarete);
        var img = el('img', 'fw-comb-sprite');
        img.src = DP.sprite(c.id, 'duel');
        img.alt = '';
        n.appendChild(img);
        var bar = el('span', 'fw-pv');
        var plein = el('span', 'fw-pv-plein');
        bar.appendChild(plein);
        n.appendChild(bar);
        n.appendChild(el('span', 'fw-comb-nom', c.nom));
        var chiffre = el('span', 'fw-comb-pv');
        n.appendChild(chiffre);
        c.node = n; c.jauge = plein; c.chiffre = chiffre;
        rang.appendChild(n);
      });

      function rafraichir() {
        var p = Math.max(0, etat.boss) / etat.bossMax * 100;
        remplBoss.style.width = p + '%';
        pvBoss.textContent = Math.max(0, etat.boss) + ' / ' + etat.bossMax;
        barreBoss.classList.toggle('is-enrage', etat.boss <= etat.bossMax * FONDATEUR.enrage);
        troupe.forEach(function (c) {
          c.jauge.style.width = (Math.max(0, c.pv) / c.max * 100) + '%';
          c.chiffre.textContent = Math.max(0, c.pv);
          c.node.classList.toggle('is-ko', c.ko);
          c.node.classList.toggle('is-bas', !c.ko && c.pv <= 35);
        });
      }

      function dire(txt, apres, delai) {
        journal.textContent = txt;
        journal.classList.remove('is-neuf');
        void journal.offsetWidth;
        journal.classList.add('is-neuf');
        if (apres) plusTard(function () { if (vivant()) apres(); }, reduit ? 0 : (delai || 900));
      }

      function secouer(node, cls) {
        if (reduit || !node) return;
        node.classList.add(cls);
        plusTard(function () { node.classList.remove(cls); }, 420);
      }

      function chiffreVolant(node, txt, cls) {
        if (!node) return;
        var n = el('span', 'fw-degat ' + (cls || ''), txt);
        node.appendChild(n);
        plusTard(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 900);
      }

      // --- Le tour d'un Dinder ---

      function vivants() { return troupe.filter(function (c) { return !c.ko; }); }

      function menuDe(c) {
        menu.textContent = '';
        var t = el('p', 'fw-menu-qui', c.nom + (c.forme ? ' — ' + c.forme : ''));
        menu.appendChild(t);
        var box = el('div', 'fw-menu-choix');
        attaquesDe(c.id).forEach(function (a) {
          var b = el('button', 'fw-attaque');
          b.type = 'button';
          b.appendChild(el('strong', null, a.nom));
          b.appendChild(el('span', 'fw-attaque-info', resume(a)));
          b.addEventListener('click', function () {
            menu.textContent = '';
            jouer(c, a);
          });
          box.appendChild(b);
        });
        menu.appendChild(box);
        c.node.classList.add('is-actif');
      }

      function resume(a) {
        var bouts = [];
        if (a.coups) bouts.push(a.coups + ' × ' + a.degats[0] + '-' + a.degats[1]);
        else if (a.copie) bouts.push('copie ' + Math.round(a.copie * 100) + ' %');
        else bouts.push(a.degats[0] + '-' + a.degats[1]);
        if (a.soin) bouts.push('soigne ' + a.soin);
        if (a.soinTous) bouts.push('soigne tous ' + a.soinTous);
        if (a.drain) bouts.push('vol de vie');
        if (a.bouclier) bouts.push('bouclier ' + a.bouclier);
        if (a.brulure) bouts.push('brûlure ' + a.brulure);
        if (a.faiblesse) bouts.push('−' + Math.round(a.faiblesse * 100) + ' % att.');
        if (a.etourdit) bouts.push('étourdit');
        if (a.boost) bouts.push('+' + Math.round(a.boost * 100) + ' % au prochain');
        if (a.oubli) bouts.push('annule la charge');
        if (a.recul) bouts.push('−' + a.recul + ' PV');
        return bouts.join(' · ');
      }

      function jouer(c, a) {
        c.node.classList.remove('is-actif');
        secouer(c.node, 'is-frappe');

        var total = 0, i;
        if (a.copie) {
          total = Math.round(Math.max(etat.dernierDegat, 24) * a.copie);
        } else if (a.coups) {
          for (i = 0; i < a.coups; i++) total += entier(a.degats[0], a.degats[1]);
        } else {
          total = entier(a.degats[0], a.degats[1]);
        }
        if (c.boost) { total = Math.round(total * (1 + c.boost)); c.boost = 0; }

        etat.boss -= total;
        etat.dernierDegat = total;
        chiffreVolant(boss, '−' + total, 'is-boss');
        secouer(boss, 'is-touche');

        var notes = [];
        if (a.soin) {
          var faible = vivants().sort(function (p, q) { return p.pv / p.max - q.pv / q.max; })[0];
          if (faible) {
            faible.pv = Math.min(faible.max, faible.pv + a.soin);
            chiffreVolant(faible.node, '+' + a.soin, 'is-soin');
            notes.push(faible.nom + ' récupère ' + a.soin + ' PV');
          }
        }
        if (a.soinTous) {
          vivants().forEach(function (p) {
            p.pv = Math.min(p.max, p.pv + a.soinTous);
            chiffreVolant(p.node, '+' + a.soinTous, 'is-soin');
          });
          notes.push('toute l’équipe récupère ' + a.soinTous + ' PV');
        }
        if (a.drain) {
          var gain = Math.round(total / 2);
          c.pv = Math.min(c.max, c.pv + gain);
          chiffreVolant(c.node, '+' + gain, 'is-soin');
          notes.push(c.nom + ' absorbe ' + gain + ' PV');
        }
        if (a.recul) {
          c.pv -= a.recul;
          chiffreVolant(c.node, '−' + a.recul, '');
          notes.push(c.nom + ' se blesse de ' + a.recul);
          if (c.pv <= 0) { c.pv = 0; c.ko = true; }
        }
        if (a.bouclier) { etat.bouclier = a.bouclier; notes.push('bouclier de ' + a.bouclier); }
        if (a.brulure) { etat.brulure = a.brulure; etat.brulureTours = 3; notes.push('Le Fondateur brûle'); }
        if (a.faiblesse) { etat.faiblesse = a.faiblesse; notes.push('sa prochaine attaque faiblit'); }
        if (a.boost) { c.boost = a.boost; notes.push('prochaine attaque renforcée'); }
        if (a.oubli && etat.charge) { etat.charge = null; notes.push('la charge du Fondateur est effacée'); }
        if (a.etourdit && Math.random() < a.etourdit) { etat.saute = true; notes.push('Le Fondateur est étourdi'); }

        rafraichir();

        var txt = c.nom + ' lance ' + a.nom + ' — ' + total + ' dégâts';
        if (notes.length) txt += ' (' + notes.join(', ') + ')';

        dire(txt, function () {
          if (etat.boss <= 0) return victoire();
          suivant();
        }, 1050);
      }

      function suivant() {
        etat.index++;
        var libres = troupe.filter(function (c) { return !c.ko; });
        var reste = troupe.slice(etat.index).filter(function (c) { return !c.ko; });
        if (!libres.length) return defaite();
        if (reste.length) {
          var c = reste[0];
          etat.index = troupe.indexOf(c);
          return menuDe(c);
        }
        tourDuFondateur();
      }

      // --- Le tour du Fondateur ---

      function tourDuFondateur() {
        if (etat.brulureTours > 0) {
          etat.boss -= etat.brulure;
          etat.brulureTours--;
          chiffreVolant(boss, '−' + etat.brulure, 'is-brulure');
          rafraichir();
          if (etat.boss <= 0) return victoire();
        }

        if (etat.saute) {
          etat.saute = false;
          return dire('Le Fondateur, étourdi, perd son tour.', nouveauTour, 1100);
        }

        // Sous la moitie de sa vie, il frappe deux fois : c'est la que la
        // partie se joue vraiment.
        var enrage = etat.boss <= etat.bossMax * FONDATEUR.enrage;
        frapper(function () {
          if (etat.fini) return;
          if (enrage && vivants().length) {
            dire('Le Fondateur est déchaîné !', function () { frapper(nouveauTour); }, 800);
          } else nouveauTour();
        });
      }

      function frapper(apres) {
        var a;
        if (etat.charge) { a = etat.charge; etat.charge = null; }
        else {
          a = FONDATEUR.attaques[Math.floor(Math.random() * FONDATEUR.attaques.length)];
          if (a.charge) {
            etat.charge = { nom: a.nom, degats: a.degats, cible: a.cible };
            secouer(boss, 'is-charge');
            return dire('Le Fondateur concentre ' + a.nom + '…', apres, 1100);
          }
        }

        secouer(boss, 'is-frappe-boss');

        // Il acheve volontiers les blesses : c'est ce qui rend les soins
        // et le bouclier utiles plutot que decoratifs.
        var debout = vivants();
        var cibles;
        if (a.cible === 'tous') cibles = debout;
        else if (Math.random() < 0.6) {
          cibles = [debout.slice().sort(function (p, q) { return p.pv - q.pv; })[0]].filter(Boolean);
        } else {
          cibles = [debout[Math.floor(Math.random() * debout.length)]].filter(Boolean);
        }
        if (!cibles.length) return defaite();

        var tombes = [];
        cibles.forEach(function (c) {
          var d = entier(a.degats[0], a.degats[1]);
          if (etat.faiblesse) d = Math.round(d * (1 - etat.faiblesse));
          if (etat.bouclier) d = Math.max(0, d - etat.bouclier);
          c.pv -= d;
          chiffreVolant(c.node, '−' + d, '');
          secouer(c.node, 'is-touche');
          if (c.pv <= 0) { c.pv = 0; c.ko = true; tombes.push(c.nom); }
        });
        etat.faiblesse = 0;
        etat.bouclier = 0;
        rafraichir();

        var txt = 'Le Fondateur lance ' + a.nom + ' !';
        if (tombes.length) txt += ' ' + tombes.join(' et ') + ' tombe' + (tombes.length > 1 ? 'nt' : '') + '.';

        dire(txt, function () {
          if (!vivants().length) return defaite();
          apres();
        }, 1100);
      }

      function nouveauTour() {
        etat.tour++;
        etat.index = -1;
        suivant();
      }

      // --- La fin ---

      function victoire() {
        if (etat.fini) return;
        etat.fini = true;
        etat.boss = 0;
        rafraichir();
        boss.classList.add('is-vaincu');
        menu.textContent = '';
        var gagne = DP.earn('green', 10);
        dire('LE FONDATEUR EST TOMBÉ.', function () { ecranFin(true, gagne); }, 1400);
      }

      function defaite() {
        if (etat.fini) return;
        etat.fini = true;
        rafraichir();
        menu.textContent = '';
        dire('Votre équipe est à terre…', function () { ecranFin(false, 0); }, 1400);
      }

      rafraichir();
      dire('Tour ' + etat.tour + ' — à vous.', function () {
        etat.index = -1;
        suivant();
      }, 1000);
    }

    // ---------- Le decor de l'arene ----------

    function peindreArene(x, W, H) {
      // Ciel de nuit au-dessus des gradins
      var ciel = x.createLinearGradient(0, 0, 0, H);
      ciel.addColorStop(0, '#120d22');
      ciel.addColorStop(1, '#2a1630');
      x.fillStyle = ciel; x.fillRect(0, 0, W, H);

      var i, j;
      for (i = 0; i < 60; i++) {
        x.fillStyle = 'rgba(255,255,255,' + (0.2 + bruit(i, 1, 300) * 0.5).toFixed(2) + ')';
        x.fillRect((bruit(i, 2, 301) * W) | 0, (bruit(i, 3, 302) * 70) | 0, 1, 1);
      }

      // Gradins : quatre rangees de public. Les silhouettes changent de
      // taille, de teinte et de carnation, sinon la foule fait quilles.
      var y0 = 62;
      var VETEMENTS = ['#6d5c96', '#4c4070', '#84709f', '#3d3459',
                       '#8a4f62', '#4f6a8a', '#7d6a4a', '#5a3f6b'];
      var PEAUX = ['#e8c9a0', '#c99a72', '#8d6244', '#f0d8b8', '#6b4630'];
      for (j = 0; j < 4; j++) {
        var yy = y0 + j * 16;
        x.fillStyle = ['#1d1730', '#241c3a', '#2b2245', '#332851'][j];
        x.fillRect(0, yy, W, 16);
        x.fillStyle = 'rgba(0,0,0,.4)';
        x.fillRect(0, yy + 14, W, 2);
        for (i = 0; i < W; i += 7) {
          var n = bruit(i, j, 310);
          if (n < 0.14) continue;                    // des places vides
          var dec = (bruit(i, j, 311) * 3) | 0;      // un peu de desordre
          var larg = 4 + ((bruit(i, j, 312) * 2) | 0);
          var haut = 7 + ((bruit(i, j, 313) * 3) | 0);
          var bx = i + dec, by = yy + 15 - haut;
          x.fillStyle = VETEMENTS[(n * VETEMENTS.length) | 0];
          x.fillRect(bx, by + 3, larg, haut - 3);
          x.fillStyle = 'rgba(0,0,0,.28)';           // le pli de l'ombre
          x.fillRect(bx + larg - 1, by + 3, 1, haut - 3);
          x.fillStyle = PEAUX[(bruit(i, j, 314) * PEAUX.length) | 0];
          x.fillRect(bx + 1, by, larg - 2, 3);
          // Un spectateur sur six leve les bras.
          if (bruit(i, j, 315) > 0.84) {
            x.fillStyle = PEAUX[(bruit(i, j, 314) * PEAUX.length) | 0];
            x.fillRect(bx - 1, by - 1, 1, 3);
            x.fillRect(bx + larg, by - 1, 1, 3);
          }
        }
      }

      // Mur d'enceinte et banderoles
      x.fillStyle = '#4a4356'; x.fillRect(0, 126, W, 26);
      x.fillStyle = '#585167';
      for (i = 0; i < W; i += 24) x.fillRect(i + 1, 128, 22, 10);
      for (i = 12; i < W; i += 24) x.fillRect(i + 1, 140, 22, 10);
      x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, 150, W, 3);

      [60, 180, 300, 420].forEach(function (bx, k) {
        var col = ['#c9303f', '#2f6fd0', '#c9a227', '#3f9c42'][k];
        x.fillStyle = col; x.fillRect(bx, 126, 14, 30);
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(bx + 10, 126, 4, 30);
        x.fillStyle = col;
        x.beginPath();
        x.moveTo(bx, 156); x.lineTo(bx + 7, 164); x.lineTo(bx + 14, 156);
        x.closePath(); x.fill();
      });

      // L'arene elle-meme : sable clair, ellipse en perspective.
      var sable = x.createLinearGradient(0, 152, 0, H);
      sable.addColorStop(0, '#9c7a4e');
      sable.addColorStop(1, '#c8a46c');
      x.fillStyle = sable; x.fillRect(0, 152, W, H - 152);

      x.fillStyle = 'rgba(255,255,255,.06)';
      for (i = 0; i < 400; i++) {
        x.fillRect((bruit(i, 5, 320) * W) | 0, 154 + ((bruit(i, 6, 321) * (H - 156)) | 0), 2, 1);
      }
      x.fillStyle = 'rgba(0,0,0,.12)';
      for (i = 0; i < 160; i++) {
        x.fillRect((bruit(i, 7, 322) * W) | 0, 154 + ((bruit(i, 8, 323) * (H - 156)) | 0), 2, 1);
      }

      // Le cercle de combat
      x.strokeStyle = 'rgba(70,40,20,.5)'; x.lineWidth = 3;
      x.beginPath(); x.ellipse(W / 2, 250, 190, 56, 0, 0, 6.3); x.stroke();
      x.strokeStyle = 'rgba(255,235,190,.25)'; x.lineWidth = 1;
      x.beginPath(); x.ellipse(W / 2, 250, 186, 53, 0, 0, 6.3); x.stroke();

      // Torches de part et d'autre
      [24, W - 34].forEach(function (tx) {
        x.fillStyle = '#3a2c1c'; x.fillRect(tx, 150, 8, 40);
        x.fillStyle = '#ff9b35'; x.fillRect(tx - 2, 138, 12, 14);
        x.fillStyle = '#ffd766'; x.fillRect(tx + 1, 141, 6, 8);
        x.fillStyle = 'rgba(255,160,60,.16)';
        x.beginPath(); x.ellipse(tx + 4, 150, 42, 30, 0, 0, 6.3); x.fill();
      });
    }

    // ---------- L'ecran de fin ----------

    function ecranFin(gagne, cagnotte) {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = gagne ? 'victoire' : 'defaite';

      var box = el('div', 'fw-fin');
      box.appendChild(el('h2', 'fw-fin-titre', gagne ? 'VICTOIRE' : 'DÉFAITE'));
      box.appendChild(el('p', 'fw-fin-txt', gagne
        ? 'Le Fondateur s’effondre. L’arène est à vous.'
        : 'Le Fondateur reste debout. Reviens plus nombreux.'));

      if (gagne) {
        var prime = el('div', 'fw-prime');
        var img = el('img');
        img.src = DP.creditImg('green');
        img.alt = '';
        prime.appendChild(img);
        prime.appendChild(el('strong', null, '+10 Crédits Universels'));
        prime.appendChild(el('span', 'fw-prime-total', 'cagnotte : ' + cagnotte));
        box.appendChild(prime);
      }

      var boutons = el('div', 'fw-fin-boutons');

      // La revanche renvoie directement dans l'arene : refaire toute la
      // foret a chaque tentative serait une corvee.
      var revanche = el('button', 'fw-btn fw-btn--go', 'Revanche');
      revanche.type = 'button';
      revanche.addEventListener('click', function () { ecranCombat(); });
      boutons.appendChild(revanche);

      var neuve = el('button', 'fw-btn', 'Nouvelle équipe');
      neuve.type = 'button';
      neuve.addEventListener('click', function () { equipe = []; ecranEquipe(); });
      boutons.appendChild(neuve);

      var sortir = el('a', 'fw-btn fw-btn--plat', 'Mini-jeux');
      sortir.href = '#minijeux';
      boutons.appendChild(sortir);

      box.appendChild(boutons);
      jeu.appendChild(box);
    }

    ecranEquipe();
  }

  // ==========================================================
  //  Branchement
  // ==========================================================

  window.VIEWS['minijeux']     = { title: 'Mini-jeux', render: viewMinijeux };
  window.VIEWS['founder-war']  = { title: 'The Founder War', render: viewFounderWar };

  // Ouvert aux tests : les tables d'attaques et la carte se verifient
  // sans avoir a jouer une partie.
  window.FW = {
    ATTAQUES: ATTAQUES, FONDATEUR: FONDATEUR, PV_DINDER: PV_DINDER,
    JEUX: JEUX, construireCarte: construireCarte,
    MW: MW, MH: MH, TS: TS, BLOQUANT: BLOQUANT,
    PORTE: PORTE, CHEMIN: CHEMIN, DEPART: DEPART,
    PORTE_X: PORTE_X, PORTE_X0: PORTE_X0, PORTE_X1: PORTE_X1,
    PORTE_Y: PORTE_Y, attaquesDe: attaquesDe
  };
})();
