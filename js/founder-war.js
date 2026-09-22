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

  // La liste est partagee : chaque mini-jeu vient y prendre sa place au
  // chargement. Les emplacements restants attendent les prochains.
  var JEUX = window.MINIJEUX = window.MINIJEUX || [
    { id: 'founder-war', nom: 'The Founder War',
      sous: 'Cinq Dinders contre Le Fondateur',
      vue: 'founder-war', pret: true,
      img: 'assets/games/icones/founder-war.webp' },
    { id: 'libre-2', nom: 'Emplacement libre', sous: 'À venir', pret: false },
    { id: 'libre-3', nom: 'Emplacement libre', sous: 'À venir', pret: false }
  ];

  function viewMinijeux(view) {
    var box = el('div', 'mj');
    box.appendChild(el('h2', 'mj-titre', 'Mini-jeux'));

    var liste = el('div', 'mj-liste');
    (window.MINIJEUX || JEUX).forEach(function (j) {
      var n = j.pret ? el('a', 'mj-jeu') : el('div', 'mj-jeu mj-jeu--soon');
      if (j.pret) n.href = '#' + j.vue;

      var vignette = el('span', 'mj-vignette');
      if (j.pret) {
        var img = el('img');
        img.src = typeof j.img === 'function' ? j.img() : (j.img || '');
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
  // 480 x 316. Le terrain et la marche sont geres par js/game-monde.js.
  var M = window.MONDE;
  var MW = 44, MH = 28, TS = M.TS;
  var HERBE = M.T.HERBE, FLEUR = M.T.FLEUR, CHEMIN = M.T.CHEMIN,
      ARBRE = M.T.ARBRE, BUISSON = M.T.BUISSON, ROCHER = M.T.ROCHER,
      EAU = M.T.EAU, MUR = M.T.MUR, DALLE = M.T.DALLE, PORTE = M.T.PORTE;
  var BLOQUANT = M.BLOQUANT;
  var bruit = M.bruit;

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

      // Les artefacts caches dans la foret (jamais dans l'arene).
      var ART = window.ARTEFACTS;
      var cachesF = ART ? ART.caches('founder', g, { x: Math.floor(DEPART.x / TS), y: Math.floor(DEPART.y / TS) }, {
        graine: 311,
        exclure: function (x, y) { return x >= AR.x0 - 1 && x <= AR.x1 + 1 && y >= AR.y0 - 1 && y <= AR.y1 + 2; }
      }) : [];

      // Toute la marche est confiee au moteur partage : il gere le
      // joystick, la camera, les collisions et le pas de la troupe.
      var balade = null, arrive = false;
      var DIRS = (window.CHIBI && window.CHIBI.DIRS) || { bas: 0, gauche: 1, droite: 2, haut: 3 };

      balade = M.Balade({
        grille: g,
        canvas: cv,
        stick: stick, pomme: pomme,
        opts: { arene: AR },
        depart: DEPART,
        direction: DIRS.haut,
        troupe: equipe,
        vivant: vivant,
        fige: function () { return arrive; },

        // Le Fondateur attend au milieu de son arene, trie en profondeur
        // avec la troupe pour qu'il passe devant ou derriere comme il faut.
        extras: function (t) {
          var sortie = [{ id: 'lefondateur', x: (AR.x0 + AR.x1 + 1) / 2 * TS,
                    y: (AR.y0 + AR.y1 + 1) / 2 * TS, dir: DIRS.bas, fixe: true }];
          return ART ? sortie.concat(ART.extras(cachesF, balade && balade.chef, t)) : sortie;
        },

        avant: function (ctx, cam, t) {
          // Les lucioles du sous-bois
          if (!reduit) {
            for (var i = 0; i < 18; i++) {
              var bx = bruit(i, 7, 200) * MW * TS + Math.sin(t / 900 + i) * 26;
              var by = bruit(i, 9, 201) * MH * TS + Math.cos(t / 1100 + i * 2) * 20;
              var sx = bx - cam.x, sy = by - cam.y;
              if (sx < -4 || sy < -4 || sx > cv.width || sy > cv.height) continue;
              var a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t / 380 + i * 1.7));
              ctx.fillStyle = 'rgba(214,255,140,' + a.toFixed(2) + ')';
              ctx.fillRect(sx | 0, sy | 0, 2, 2);
            }
          }
          // La lueur rouge sous Le Fondateur
          var fx = (AR.x0 + AR.x1 + 1) / 2 * TS - cam.x;
          var fy = (AR.y0 + AR.y1 + 1) / 2 * TS - cam.y;
          if (fx > -60 && fx < cv.width + 60) {
            ctx.fillStyle = 'rgba(255,60,50,' + (0.18 + 0.12 * Math.sin(t / 500)).toFixed(2) + ')';
            ctx.beginPath();
            ctx.ellipse(fx, fy + 4, 30, 14, 0, 0, 6.3);
            ctx.fill();
          }
        },

        chaqueImage: function () {
          if (ART) ART.ramasser(cachesF, balade.chef);
          var c = balade.caseDuChef();
          var casier = c[0] + ',' + c[1];
          if (jeu.dataset.tuile !== casier) jeu.dataset.tuile = casier;

          var dedans = balade.tuile(c[0], c[1]) === PORTE;
          if (dedans !== !entrer.hidden) entrer.hidden = !dedans;

          // La boussole pointe vers le portail de l'arene.
          var ax = ((PORTE_X0 + PORTE_X1 + 1) / 2) * TS - balade.chef.x;
          var ay = (PORTE_Y + 0.5) * TS - balade.chef.y;
          boussole.style.transform = 'rotate(' + Math.atan2(ay, ax) + 'rad)';
        }
      });

      entrer.addEventListener('click', function () {
        if (arrive) return;
        arrive = true;
        balade.arreter();
        ecranCombat();
      });
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
        tour: 1, index: 0, fini: false,
        depart: 0
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
        // Le chronometre demarre quand le joueur peut agir pour la
        // premiere fois, pas avant : l'annonce du premier tour ne compte pas.
        if (!etat.depart) etat.depart = Date.now();
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

        // On inscrit la victoire et le chrono : les badges s'en servent.
        var chrono = etat.depart ? Math.round((Date.now() - etat.depart) / 1000) : 0;
        DP.compterExploit('fondateurVaincu');
        if (chrono > 0) DP.noterRecord('fondateurChrono', chrono, true);
        // Les artefacts de l'arene : ce que vaut cette victoire-ci.
        if (window.ARTEFACTS) {
          window.ARTEFACTS.victoireFondateur({
            equipe: equipe.slice(),
            ko: troupe.filter(function (c) { return c.ko; }).length,
            chrono: chrono
          });
        }

        dire('LE FONDATEUR EST TOMBÉ — ' + chrono + ' s.',
             function () { ecranFin(true, gagne, chrono); }, 1400);
      }

      function defaite() {
        if (etat.fini) return;
        etat.fini = true;
        rafraichir();
        menu.textContent = '';
        dire('Votre équipe est à terre…', function () { ecranFin(false, 0, 0); }, 1400);
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

    function ecranFin(gagne, cagnotte, chrono) {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = gagne ? 'victoire' : 'defaite';

      var box = el('div', 'fw-fin');
      box.appendChild(el('h2', 'fw-fin-titre', gagne ? 'VICTOIRE' : 'DÉFAITE'));
      box.appendChild(el('p', 'fw-fin-txt', gagne
        ? 'Le Fondateur s’effondre. L’arène est à vous.'
        : 'Le Fondateur reste debout. Reviens plus nombreux.'));

      if (gagne && chrono) {
        var meilleur = DP.exploit('fondateurChrono');
        var t = el('p', 'fw-chrono', 'Combat bouclé en ' + chrono + ' s'
                 + (meilleur && meilleur < chrono ? '  ·  record : ' + meilleur + ' s' : ''));
        box.appendChild(t);
      }

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

    // Le jeu s'ouvre sur sa jaquette.
    if (window.INTRO) {
      jeu.dataset.etape = 'intro';
      jeu.appendChild(window.INTRO.ecran({
        icone: 'assets/games/icones/founder-war.webp',
        titre: 'The Founder War',
        teinte: '#ff3b3b',
        bouton: 'AU COMBAT',
        lignes: [
          'Au bout de la forêt, Le Fondateur a dressé son arène.',
          'Personne n’en est jamais ressorti debout.',
          'Réunis cinq Dinders et traverse les bois jusqu’au portail.',
          'Puis fais tomber ses mille points de vie.'
        ],
        commencer: ecranEquipe
      }));
    } else {
      ecranEquipe();
    }
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
