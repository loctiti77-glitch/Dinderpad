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
    ],
    'harry-hargrove': [
      { nom: 'Heure Volée',         degats: [40, 54], etourdit: 0.35 },
      { nom: 'Montre à Gousset',    degats: [18, 26], bouclier: 34 }
    ],
    'marlon-coach': [
      { nom: 'Coup du Capuchon',    degats: [42, 56] },
      { nom: 'Pouce en l’Air',      degats: [12, 18], boost: 0.35 }
    ],
    'baron-zofiax': [
      { nom: 'Liasse au Visage',    degats: [15, 22], coups: 4 },
      { nom: 'Rachat Hostile',      degats: [40, 54], drain: true }
    ],
    'timeo-traveler': [
      { nom: 'Saut de Ligne',       degats: [62, 82] },
      { nom: 'Retour Arrière',      degats: [24, 34], soinTous: 30 }
    ],
    'william-batant': [
      { nom: 'Griffe Nocturne',     degats: [58, 78], brulure: 6 },
      { nom: 'Écoute Fine',         degats: [26, 36], faiblesse: 0.4 }
    ],
    // Une fois vaincu, Le Fondateur se bat a vos cotes — avec ce qu'il
    // vous faisait subir.
    'lefondateur': [
      { nom: 'Ordre Établi',        degats: [78, 104] },
      { nom: 'Mise au Pas',         degats: [40, 54], faiblesse: 0.45 }
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
      sous: 'Onze niveaux, de la forêt à l’Effondrement Terminal',
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
    var C = window.FWCAMP;
    var jeu = el('div', 'fw');
    jeu.dataset.etape = 'campagne';
    // Le niveau qu'on s'apprete a jouer : par defaut, le prochain a faire.
    var niveauEnCours = C ? C.prochain() : 1;
    function defNiveau() { return C ? C.parNiveau(niveauEnCours) : null; }
    view.appendChild(jeu);

    var equipe = [];                 // les identifiants choisis
    var minuteurs = [];
    function plusTard(fn, ms) { var t = setTimeout(fn, ms); minuteurs.push(t); return t; }
    function toutAnnuler() { minuteurs.forEach(clearTimeout); minuteurs = []; }

    // La vue peut etre remplacee a tout moment par l'aiguillage : chaque
    // boucle et chaque minuteur verifie qu'il est encore a l'ecran.
    function vivant() { return document.body.contains(jeu); }

    // ---------- 1. Le choix de l'equipe ----------

    // ---------- 0. La campagne : onze paliers ----------

    function resumeQuete(q) {
      if (!q) return 'Pas de détour : l’arène, tout de suite.';
      var bouts = [];
      if (q.eclats) bouts.push(q.eclats + ' éclats');
      if (q.bornes) bouts.push(q.bornes + ' bornes');
      if (q.patrouilles) bouts.push(q.patrouilles + ' patrouille' + (q.patrouilles > 1 ? 's' : ''));
      if (q.chrono) bouts.push(q.chrono + ' s');
      return bouts.join('  ·  ');
    }

    function ecranCampagne() {
      // Sans le module de campagne, on retombe sur l'ancien parcours.
      if (!C) return ecranEquipe();
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'campagne';

      var tete = el('div', 'fw-tete');
      tete.appendChild(el('h2', 'fw-titre', 'The Founder War'));
      tete.appendChild(el('p', 'fw-compte',
        C ? 'Campagne  ·  ' + Math.min(DP.fwNiveau(), C.DERNIER) + ' / ' + C.DERNIER + ' niveaux franchis'
          : ''));
      jeu.appendChild(tete);

      var liste = el('div', 'fw-campagne');
      var tous = C ? C.NIVEAUX.concat([C.FINAL]) : [];
      tous.forEach(function (d) {
        var ouvert = C.ouvert(d.n), fait = C.franchi(d.n);
        var n = el(ouvert ? 'button' : 'div',
                   'fw-palier' + (fait ? ' is-fait' : '') + (ouvert ? '' : ' is-ferme') +
                   (d.n === C.DERNIER ? ' fw-palier--final' : ''));
        if (ouvert) n.type = 'button';
        n.dataset.niveau = d.n;
        n.style.setProperty('--r', d.teinte);

        var vign = el('span', 'fw-palier-vignette');
        var im = el('img', 'fw-palier-img');
        im.src = d.n === C.DERNIER ? DP.sprite('lefondateur', 'duel') : C.urlSbire(d.n);
        im.alt = '';
        vign.appendChild(im);
        n.appendChild(vign);

        var txt = el('span', 'fw-palier-txt');
        txt.appendChild(el('strong', 'fw-palier-nom',
          (d.n === C.DERNIER ? '' : 'Niveau ' + d.n + ' — ') + d.nom));
        txt.appendChild(el('span', 'fw-palier-sous', ouvert || fait ? d.titre : 'Verrouillé'));
        if (ouvert || fait) {
          txt.appendChild(el('span', 'fw-palier-quete', resumeQuete(d.quete)));
          txt.appendChild(el('span', 'fw-palier-pv', d.pv + ' PV'));
        }
        n.appendChild(txt);
        if (fait) n.appendChild(el('span', 'fw-palier-fait', '✓'));
        else if (!ouvert) n.appendChild(el('span', 'fw-verrou'));

        if (ouvert) {
          n.addEventListener('click', function () {
            niveauEnCours = d.n;
            ecranEquipe();
          });
        }
        liste.appendChild(n);
      });
      jeu.appendChild(liste);

      if (!assezDeDinders()) {
        var alerte = el('p', 'fw-manque-bandeau',
          'Il te faut cinq Dinders dans ta collection pour former une équipe — ' +
          'tu en as ' + DP.owned().length + '.');
        jeu.appendChild(alerte);
      }

      var pied = el('div', 'fw-pied');
      var mesD = el('button', 'fw-btn', 'MES DINDERS');
      mesD.type = 'button';
      mesD.addEventListener('click', ecranDinders);
      pied.appendChild(mesD);
      var sortir = el('a', 'fw-btn fw-btn--plat', 'Mini-jeux');
      sortir.href = '#minijeux';
      pied.appendChild(sortir);
      jeu.appendChild(pied);

      // La vignette d'un sbire n'est prete qu'une fois l'armure chargee.
      var img = C && C.chargerSbire();
      if (img && !img.complete && typeof img.addEventListener === 'function') {
        img.addEventListener('load', function () {
          if (jeu.dataset.etape === 'campagne') ecranCampagne();
        }, { once: true });
      }
    }

    // ---------- 0 bis. Les Dinders et leurs niveaux ----------

    function ecranDinders() {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'dinders';

      var tete = el('div', 'fw-tete');
      tete.appendChild(el('h2', 'fw-titre', 'Tes Dinders'));
      tete.appendChild(el('p', 'fw-compte',
        'Ils montent en se battant. Plus un Dinder est rare, plus il frappe fort — ' +
        'et au niveau ' + C.NIVEAU_ULTIME + ', il apprend son ultime.'));
      jeu.appendChild(tete);

      var liste = el('div', 'fw-fiches');
      DP.DINDERS.filter(function (d) { return DP.has(d.id); }).forEach(function (d) {
        var e = C.etat(d.id);
        var n = el('div', 'fw-fiche');
        n.dataset.rarity = DP.rarityKey(d.rarity);
        n.dataset.dinder = d.id;

        var im = el('img', 'fw-fiche-sprite');
        im.src = DP.sprite(d.id, 'duel');
        im.alt = '';
        n.appendChild(im);

        var col = el('div', 'fw-fiche-txt');
        var haut = el('div', 'fw-fiche-haut');
        haut.appendChild(el('strong', 'fw-fiche-nom', d.name));
        haut.appendChild(el('span', 'fw-fiche-niv', 'Niv. ' + e.niveau + ' / ' + e.max));
        col.appendChild(haut);
        col.appendChild(el('span', 'fw-fiche-rarete', d.rarity +
          '  ·  force ×' + e.force.toFixed(2) + '  ·  ' + e.pv + ' PV'));

        var jauge = el('div', 'fw-fiche-jauge');
        var plein = el('div', 'fw-fiche-plein');
        plein.style.width = (e.k * 100).toFixed(1) + '%';
        jauge.appendChild(plein);
        col.appendChild(jauge);
        col.appendChild(el('span', 'fw-fiche-xp', e.niveau >= e.max
          ? e.xp + ' XP  ·  niveau maximum'
          : e.xp + ' / ' + e.haut + ' XP'));

        var atk = el('div', 'fw-fiche-attaques');
        C.attaques(d.id).forEach(function (a) {
          var b = el('span', 'fw-fiche-attaque' + (a.ultime ? ' is-ultime' : ''));
          b.appendChild(el('strong', null, a.nom));
          b.appendChild(el('span', null, ' ' + a.degats[0] + '–' + a.degats[1]));
          atk.appendChild(b);
        });
        var u = C.ultimeDe(d.id);
        if (u && !C.aUltime(d.id)) {
          var verrou = el('span', 'fw-fiche-attaque is-ferme');
          verrou.textContent = u.nom + ' — niveau ' + C.NIVEAU_ULTIME;
          atk.appendChild(verrou);
        }
        col.appendChild(atk);
        n.appendChild(col);
        liste.appendChild(n);
      });
      jeu.appendChild(liste);

      var pied = el('div', 'fw-pied');
      var retour = el('button', 'fw-btn fw-btn--go', 'RETOUR');
      retour.type = 'button';
      retour.addEventListener('click', ecranCampagne);
      pied.appendChild(retour);
      jeu.appendChild(pied);
    }

    // Cinq Dinders, et ils doivent etre a soi : sans cela, direction les
    // Dindises.
    function assezDeDinders() { return DP.owned().length >= 5; }

    function ecranManque() {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'manque';

      var box = el('div', 'fw-manque');
      box.appendChild(el('h2', 'fw-manque-titre', 'Il te faut cinq Dinders'));
      box.appendChild(el('p', 'fw-manque-txt',
        'On n’envoie pas au combat des Dinders qu’on n’a pas. Tu en as ' +
        DP.owned().length + ' sur les cinq qu’il faut pour former une équipe.'));
      var rang = el('div', 'fw-manque-rang');
      for (var i = 0; i < 5; i++) {
        var c = el('span', 'fw-manque-case' + (i < DP.owned().length ? ' is-pris' : ''));
        if (i < DP.owned().length) {
          var im = el('img', 'fw-manque-img');
          im.src = DP.sprite(DP.owned()[i], 'duel');
          im.alt = '';
          c.appendChild(im);
        } else {
          c.appendChild(el('span', 'fw-manque-vide', '?'));
        }
        rang.appendChild(c);
      }
      box.appendChild(rang);
      box.appendChild(el('p', 'fw-manque-sous',
        'Les Dindises en ouvrent. La première Dindise Universelle est offerte.'));

      var boutons = el('div', 'fw-fin-boutons');
      var vers = el('a', 'fw-btn fw-btn--go', 'WIN DINDERS');
      vers.href = '#win-dinders';
      boutons.appendChild(vers);
      var retour = el('button', 'fw-btn', 'Niveaux');
      retour.type = 'button';
      retour.addEventListener('click', ecranCampagne);
      boutons.appendChild(retour);
      box.appendChild(boutons);
      jeu.appendChild(box);
    }

    function ecranEquipe() {
      if (!assezDeDinders()) return ecranManque();
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'equipe';

      var d0 = defNiveau();
      var tete = el('div', 'fw-tete');
      tete.appendChild(el('h2', 'fw-titre',
        d0 ? (d0.n === C.DERNIER ? d0.nom : 'Niveau ' + d0.n + ' — ' + d0.nom) : 'The Founder War'));
      var compte = el('p', 'fw-compte');
      tete.appendChild(compte);
      jeu.appendChild(tete);

      var grille = el('div', 'fw-roster');
      jeu.appendChild(grille);

      var pied = el('div', 'fw-pied');
      var retour = el('button', 'fw-btn', 'NIVEAUX');
      retour.type = 'button';
      retour.addEventListener('click', ecranCampagne);
      pied.appendChild(retour);
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

      // On ne part au combat qu'avec ses propres Dinders : ceux qu'on n'a
      // pas encore n'apparaissent plus ici.
      DP.DINDERS.filter(function (d) { return DP.has(d.id); }).forEach(function (d) {
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
        var e = C ? C.etat(d.id) : null;
        n.appendChild(el('span', 'fw-rarete', e
          ? d.rarity + '  ·  niv. ' + e.niveau : d.rarity));
        n.appendChild(el('span', 'fw-rang'));

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

      // ---------- La quete du niveau ----------
      // Avant la porte, il y a du travail : des eclats a ramasser, des
      // bornes a allumer dans l'ordre, des patrouilles a eviter, et
      // parfois un chrono. Tant que ce n'est pas fait, la porte reste
      // close.
      var def = defNiveau() || {};
      var quete = def.quete || {};
      var horloge = el('div', 'fw-quete');
      var qTitre = el('span', 'fw-quete-titre', '');
      var qLignes = el('div', 'fw-quete-lignes');
      horloge.appendChild(qTitre);
      horloge.appendChild(qLignes);
      scene.appendChild(horloge);

      var caseDep = { x: Math.floor(DEPART.x / TS), y: Math.floor(DEPART.y / TS) };

      // Des cases libres, loin du depart, loin de l'arene, et loin les
      // unes des autres : la meme carte donne toujours les memes places.
      function placesLibres(combien, graine, ecart) {
        var out = [], essais = 0;
        while (out.length < combien && essais < 4000) {
          var i = essais++;
          var x = 2 + Math.floor(bruit(i, graine, 7) * (MW - 4));
          var y = 2 + Math.floor(bruit(i, graine + 11, 9) * (MH - 4));
          if (BLOQUANT[g[y][x]]) continue;
          if (x >= AR.x0 - 1 && x <= AR.x1 + 1 && y >= AR.y0 - 1 && y <= AR.y1 + 2) continue;
          if (Math.abs(x - caseDep.x) + Math.abs(y - caseDep.y) < 6) continue;
          var loin = out.every(function (q) {
            return Math.abs(q.x - x) + Math.abs(q.y - y) >= (ecart || 7);
          });
          if (!loin) continue;
          out.push({ x: x, y: y, px: (x + 0.5) * TS, py: (y + 0.5) * TS });
        }
        return out;
      }

      var eclats = placesLibres(quete.eclats || 0, 41, 8).map(function (q) {
        return { x: q.px, y: q.py, pris: false };
      });
      var bornes = placesLibres(quete.bornes || 0, 77, 9).map(function (q, i) {
        return { x: q.px, y: q.py, n: i + 1, allumee: false };
      });
      var patrouilles = placesLibres(quete.patrouilles || 0, 133, 10).map(function (q, i) {
        return {
          x: q.px, y: q.py, base: { x: q.px, y: q.py },
          rayon: 60 + (i % 3) * 30, phase: i * 1.7, vu: 0
        };
      });
      var chrono = quete.chrono ? quete.chrono * 1000 : 0;
      var debutQuete = 0, tempsRestant = chrono, echecQuete = false;
      var eclatsPris = 0, borneAttendue = 1;

      function queteFinie() {
        return eclatsPris >= eclats.length &&
               bornes.every(function (b) { return b.allumee; });
      }

      function majQuete(t) {
        qTitre.textContent = queteFinie()
          ? 'Le portail de l’arène s’est ouvert.'
          : (def.n === C.DERNIER ? 'Rejoins l’arène.' : 'Avant l’arène :');
        qLignes.textContent = '';
        if (eclats.length) {
          qLignes.appendChild(el('span', 'fw-quete-ligne' +
            (eclatsPris >= eclats.length ? ' is-fait' : ''),
            'Éclats de fondation ' + eclatsPris + ' / ' + eclats.length));
        }
        if (bornes.length) {
          var n = bornes.filter(function (b) { return b.allumee; }).length;
          qLignes.appendChild(el('span', 'fw-quete-ligne' + (n >= bornes.length ? ' is-fait' : ''),
            'Bornes dans l’ordre ' + n + ' / ' + bornes.length));
        }
        if (patrouilles.length) {
          qLignes.appendChild(el('span', 'fw-quete-ligne',
            patrouilles.length + ' patrouille' + (patrouilles.length > 1 ? 's' : '') + ' à éviter'));
        }
        if (chrono) {
          var reste = Math.max(0, tempsRestant) / 1000;
          var l = el('span', 'fw-quete-ligne' + (reste < 15 ? ' is-urgent' : ''),
            'Temps ' + Math.floor(reste / 60) + ':' + String(Math.floor(reste % 60)).padStart(2, '0'));
          qLignes.appendChild(l);
        }
      }

      // Repousse la troupe au depart : une patrouille l'a reperee.
      function reperes(t) {
        // On repose la troupe a l'oree : le moteur suit son chef.
        balade.chef.x = DEPART.x;
        balade.chef.y = DEPART.y;
        bornes.forEach(function (b) { b.allumee = false; });
        borneAttendue = 1;
        scene.classList.remove('is-repere');
        void scene.offsetWidth;
        scene.classList.add('is-repere');
        hud.querySelector('.fw-hud-txt').textContent =
          'Repéré ! On te ramène à l’orée du bois, et les bornes s’éteignent.';
      }

      function avancerQuete(t) {
        if (!debutQuete) debutQuete = t;
        if (chrono) {
          tempsRestant = chrono - (t - debutQuete);
          if (tempsRestant <= 0 && !echecQuete && !queteFinie()) {
            echecQuete = true;
            return echouerQuete();
          }
        }
        var chef = balade.chef;

        eclats.forEach(function (e) {
          if (e.pris) return;
          if (Math.hypot(chef.x - e.x, chef.y - e.y) < 22) {
            e.pris = true;
            eclatsPris++;
            scene.classList.remove('is-eclat');
            void scene.offsetWidth;
            scene.classList.add('is-eclat');
          }
        });

        bornes.forEach(function (b) {
          if (b.allumee) return;
          if (Math.hypot(chef.x - b.x, chef.y - b.y) > 24) return;
          if (b.n === borneAttendue) { b.allumee = true; borneAttendue++; }
          else {
            bornes.forEach(function (q) { q.allumee = false; });
            borneAttendue = 1;
            hud.querySelector('.fw-hud-txt').textContent =
              'Mauvaise borne : elles s’éteignent toutes. Reprends par la première.';
          }
        });

        patrouilles.forEach(function (q) {
          var a = t / 1400 + q.phase;
          q.x = q.base.x + Math.cos(a) * q.rayon;
          q.y = q.base.y + Math.sin(a * 0.8) * q.rayon * 0.6;
          if (t - q.vu > 2500 && Math.hypot(chef.x - q.x, chef.y - q.y) < 34) {
            q.vu = t;
            reperes(t);
          }
        });

        majQuete(t);
      }

      function echouerQuete() {
        arrive = true;
        balade.arreter();
        toutAnnuler();
        jeu.textContent = '';
        jeu.dataset.etape = 'echec-quete';
        var box = el('div', 'fw-fin');
        box.appendChild(el('h2', 'fw-fin-titre', 'TEMPS ÉCOULÉ'));
        box.appendChild(el('p', 'fw-fin-txt',
          'Les sbires ont eu le temps de verrouiller le portail. Il faut recommencer la traversée.'));
        var boutons = el('div', 'fw-fin-boutons');
        var revanche = el('button', 'fw-btn fw-btn--go', 'Reprendre la forêt');
        revanche.type = 'button';
        revanche.addEventListener('click', ecranForet);
        boutons.appendChild(revanche);
        var niveaux = el('button', 'fw-btn', 'Niveaux');
        niveaux.type = 'button';
        niveaux.addEventListener('click', ecranCampagne);
        boutons.appendChild(niveaux);
        box.appendChild(boutons);
        jeu.appendChild(box);
      }

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

          // Les eclats de fondation : des cristaux rouges qui tournent.
          eclats.forEach(function (e) {
            if (e.pris) return;
            sortie.push({ x: e.x, y: e.y, dessin: function (ctx, sx, sy) {
              var k = reduit ? 0 : Math.sin(t / 300);
              ctx.fillStyle = 'rgba(255,60,60,' + (0.25 + 0.15 * (k + 1)).toFixed(2) + ')';
              ctx.beginPath(); ctx.ellipse(sx, sy + 3, 11, 5, 0, 0, 6.3); ctx.fill();
              ctx.fillStyle = '#ff3b3b';
              ctx.beginPath();
              ctx.moveTo(sx, sy - 12 + k);
              ctx.lineTo(sx + 5, sy - 3 + k);
              ctx.lineTo(sx, sy + 5 + k);
              ctx.lineTo(sx - 5, sy - 3 + k);
              ctx.closePath(); ctx.fill();
              ctx.fillStyle = '#ffd2d2';
              ctx.fillRect(Math.round(sx - 1), Math.round(sy - 8 + k), 2, 6);
            } });
          });

          // Les bornes : un pylone numerote, eteint ou allume.
          bornes.forEach(function (b) {
            sortie.push({ x: b.x, y: b.y, dessin: function (ctx, sx, sy) {
              ctx.fillStyle = b.allumee ? '#2a6a2a' : '#2a2a32';
              ctx.fillRect(Math.round(sx - 6), Math.round(sy - 22), 12, 24);
              ctx.fillStyle = b.allumee ? '#7cf0a8' : '#6a1a1a';
              ctx.fillRect(Math.round(sx - 4), Math.round(sy - 20), 8, 8);
              ctx.fillStyle = '#eaf6ff';
              ctx.font = 'bold 9px "Courier New", monospace';
              ctx.textAlign = 'center';
              ctx.fillText(String(b.n), sx, sy - 12);
              ctx.textAlign = 'left';
              if (b.allumee && !reduit) {
                ctx.strokeStyle = 'rgba(124,240,168,.6)';
                ctx.beginPath();
                ctx.ellipse(sx, sy + 1, 12 + Math.sin(t / 260) * 3, 5, 0, 0, 6.3);
                ctx.stroke();
              }
            } });
          });

          // Les patrouilles : un sbire qui tourne, et son cone de vue.
          patrouilles.forEach(function (q) {
            sortie.push({ x: q.x, y: q.y, dessin: function (ctx, sx, sy) {
              ctx.fillStyle = 'rgba(255,40,40,.16)';
              ctx.beginPath(); ctx.ellipse(sx, sy + 2, 34, 16, 0, 0, 6.3); ctx.fill();
              ctx.fillStyle = '#17171c';
              ctx.fillRect(Math.round(sx - 6), Math.round(sy - 20), 12, 20);
              ctx.fillStyle = '#2a2a33';
              ctx.fillRect(Math.round(sx - 8), Math.round(sy - 14), 16, 8);
              ctx.fillStyle = '#ff2a2a';
              ctx.fillRect(Math.round(sx - 5), Math.round(sy - 18), 10, 2);
            } });
          });

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

        chaqueImage: function (t) {
          if (ART) ART.ramasser(cachesF, balade.chef);
          if (!arrive) avancerQuete(t || performance.now());
          var c = balade.caseDuChef();
          var casier = c[0] + ',' + c[1];
          if (jeu.dataset.tuile !== casier) jeu.dataset.tuile = casier;

          var pret = queteFinie();
          var dedans = pret && balade.tuile(c[0], c[1]) === PORTE;
          if (dedans !== !entrer.hidden) entrer.hidden = !dedans;

          // La boussole pointe vers le portail de l'arene.
          var ax = ((PORTE_X0 + PORTE_X1 + 1) / 2) * TS - balade.chef.x;
          var ay = (PORTE_Y + 0.5) * TS - balade.chef.y;
          boussole.style.transform = 'rotate(' + Math.atan2(ay, ax) + 'rad)';
        }
      });

      // Pour les essais : la quete et la troupe, sans passer par l'ecran.
      scene._fw = {
        eclats: eclats, bornes: bornes, patrouilles: patrouilles,
        finie: function () { return queteFinie(); },
        porte: function () { return !entrer.hidden; },
        entrer: function () { entrer.click(); },
        poser: function (x, y) { balade.chef.x = x; balade.chef.y = y; }
      };

      entrer.addEventListener('click', function () {
        if (arrive) return;
        arrive = true;
        balade.arreter();
        var d = defNiveau();
        if (d && d.dialogue) ecranDialogue(d);
        else ecranCombat();
      });
    }

    // ---------- 2 bis. Le face-a-face ----------
    // Avant l'Effondrement Terminal, Le Fondateur a quelque chose a dire.

    function ecranDialogue(d) {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'dialogue';

      var final = d.n === C.DERNIER;
      var box = el('div', 'fw-dialogue');
      var scene = el('div', 'fw-dial-scene');
      var lui = el('img', 'fw-dial-boss' + (final ? '' : ' fw-dial-boss--sbire'));
      lui.src = final ? DP.sprite('lefondateur', 'duel') : C.urlSbire(d.n);
      lui.alt = d.nom;
      scene.appendChild(lui);
      var eux = el('div', 'fw-dial-troupe');
      equipe.forEach(function (id) {
        var im = el('img', 'fw-dial-dinder');
        im.src = DP.sprite(id, 'duel');
        im.alt = '';
        eux.appendChild(im);
      });
      scene.appendChild(eux);
      box.appendChild(scene);

      var bulle = el('div', 'fw-bulle');
      var qui = el('span', 'fw-bulle-qui', '');
      var txt = el('p', 'fw-bulle-txt', '');
      bulle.appendChild(qui);
      bulle.appendChild(txt);
      box.appendChild(bulle);

      var suite = el('button', 'fw-btn fw-btn--go', 'SUITE');
      suite.type = 'button';
      box.appendChild(suite);
      jeu.appendChild(box);

      var i = 0;
      function ligne() {
        var l = d.dialogue[i];
        // "sbire" et "fondateur" parlent d'en face ; "dinder", c'est ton equipe.
        var enface = l.qui !== 'dinder';
        bulle.classList.toggle('is-boss', enface);
        scene.classList.toggle('is-boss', enface);
        // Le palier final s'appelle "Effondrement Terminal" : celui qui
        // parle, lui, c'est Le Fondateur.
        qui.textContent = enface ? (final ? d.titre : d.nom)
                                 : ((DP.byId(equipe[0]) || {}).name || 'Ton équipe');
        txt.textContent = l.texte;
        suite.textContent = i >= d.dialogue.length - 1
          ? (final ? 'EFFONDREMENT TERMINAL' : 'AU COMBAT') : 'SUITE';
      }
      suite.addEventListener('click', function () {
        i++;
        if (i >= d.dialogue.length) return ecranCombat();
        ligne();
      });
      ligne();
    }

    // ---------- 3. Le combat ----------

    function ecranCombat() {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'combat';

      // L'adversaire du niveau : un sbire, ou Le Fondateur lui-meme.
      var adv = defNiveau() || C.FINAL;
      var final = adv.n === C.DERNIER;

      var scene = el('div', 'fw-arene');

      var fond = el('canvas', 'fw-canvas fw-canvas--arene');
      fond.width = 480; fond.height = 316;
      scene.appendChild(fond);

      // Barre de vie du Fondateur
      var barreBoss = el('div', 'fw-boss-barre');
      barreBoss.appendChild(el('span', 'fw-boss-nom', adv.nom.toUpperCase()));
      var jaugeBoss = el('span', 'fw-jauge');
      var remplBoss = el('span', 'fw-jauge-plein');
      jaugeBoss.appendChild(remplBoss);
      barreBoss.appendChild(jaugeBoss);
      var pvBoss = el('span', 'fw-boss-pv');
      barreBoss.appendChild(pvBoss);
      scene.appendChild(barreBoss);

      var boss = el('div', 'fw-boss' + (final ? ' is-final' : ''));
      var bossImg = el('img');
      bossImg.src = final ? DP.sprite('lefondateur', 'duel') : C.urlSbire(adv.n);
      bossImg.alt = adv.nom;
      boss.appendChild(bossImg);
      scene.appendChild(boss);

      var rang = el('div', 'fw-rangee');
      scene.appendChild(rang);

      var journal = el('p', 'fw-journal', adv.avant || adv.recit || 'Il se dresse devant vous.');
      scene.appendChild(journal);

      var menu = el('div', 'fw-menu');
      scene.appendChild(menu);

      jeu.appendChild(scene);

      peindreArene(fond.getContext('2d'), fond.width, fond.height);

      // --- L'etat du combat ---
      // Les attaques de l'adversaire : celles du Fondateur, mises a
      // l'echelle du niveau, plus ce que ce sbire-la sait faire en propre.
      var attaquesAdv = FONDATEUR.attaques.map(function (a) {
        var k = adv.coup[0] / FONDATEUR.attaques[0].degats[0];
        return { nom: a.nom, cible: a.cible, charge: a.charge,
                 degats: [Math.round(a.degats[0] * k), Math.round(a.degats[1] * k)] };
      });
      if (!final) {
        attaquesAdv[0].nom = 'Frappe de ' + adv.nom;
        attaquesAdv[2].nom = 'Œil de veille';
      }

      var etat = {
        boss: adv.pv,
        bossMax: adv.pv,
        bouclierAdv: adv.bouclier || 0,
        brulure: 0, brulureTours: 0,
        faiblesse: 0, charge: null, saute: false,
        bouclier: 0,
        dernierDegat: 0,
        tour: 1, index: 0, fini: false,
        depart: 0
      };

      var troupe = equipe.map(function (id) {
        var d = DP.byId(id);
        var e = C.etat(id);
        return { id: id, nom: d.name, forme: d.form, rarete: d.rarity,
                 niveau: e.niveau, force: e.force,
                 pv: e.pv, max: e.pv, boost: 0, ko: false, node: null,
                 ultimeFait: false };
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
        C.attaques(c.id).filter(function (a) {
          return !(a.ultime && c.ultimeFait);
        }).forEach(function (a) {
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
        if (a.ultime) c.ultimeFait = true;
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

        // Un sbire a bouclier encaisse d'abord dessus.
        if (etat.bouclierAdv > 0) {
          var pris = Math.min(etat.bouclierAdv, Math.round(total * 0.5));
          etat.bouclierAdv -= pris;
          total -= pris;
        }
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
        if (a.brulure) { etat.brulure = a.brulure; etat.brulureTours = 3; notes.push(adv.nom + ' brûle'); }
        if (a.faiblesse) { etat.faiblesse = a.faiblesse; notes.push('sa prochaine attaque faiblit'); }
        if (a.boost) { c.boost = a.boost; notes.push('prochaine attaque renforcée'); }
        if (a.oubli && etat.charge) { etat.charge = null; notes.push('la charge est effacée'); }
        if (a.etourdit && Math.random() < a.etourdit) { etat.saute = true; notes.push(adv.nom + ' est étourdi'); }

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
        // Ce que ce sbire-la fait avant de frapper.
        if (adv.brulure && vivants().length && Math.random() < 0.4) {
          var cible = vivants()[Math.floor(Math.random() * vivants().length)];
          cible.pv = Math.max(0, cible.pv - adv.brulure);
          chiffreVolant(cible.node, '−' + adv.brulure, 'is-brulure');
          if (cible.pv <= 0) cible.ko = true;
          rafraichir();
        }
        if (adv.bouclier && etat.bouclierAdv < adv.bouclier * 0.3) {
          etat.bouclierAdv = adv.bouclier;
          dire(adv.nom + ' remonte son bouclier.', null, 700);
        }
        if (etat.brulureTours > 0) {
          etat.boss -= etat.brulure;
          etat.brulureTours--;
          chiffreVolant(boss, '−' + etat.brulure, 'is-brulure');
          rafraichir();
          if (etat.boss <= 0) return victoire();
        }

        if (etat.saute) {
          etat.saute = false;
          return dire(adv.nom + ', étourdi, perd son tour.', nouveauTour, 1100);
        }

        // Sous la moitie de sa vie, il frappe deux fois : c'est la que la
        // partie se joue vraiment.
        var enrage = etat.boss <= etat.bossMax * FONDATEUR.enrage;
        if (final && etat.boss <= etat.bossMax * 0.25) enrage = true;
        frapper(function () {
          if (etat.fini) return;
          if (enrage && vivants().length) {
            dire(adv.nom + ' est déchaîné !', function () { frapper(nouveauTour); }, 800);
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
            return dire(adv.nom + ' concentre ' + a.nom + '…', apres, 1100);
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
          if (adv.drain) etat.boss = Math.min(etat.bossMax, etat.boss + 18);
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

        // La prime monte avec le niveau ; la finale paie en Temporel.
        var gagne = final ? DP.earn('pink', 2) : DP.earn('green', 8 + adv.n * 2);

        var chrono = etat.depart ? Math.round((Date.now() - etat.depart) / 1000) : 0;

        // L'experience des Dinders : tout le monde en prend, ceux qui
        // tiennent debout un peu plus.
        var base = 30 + adv.n * 14;
        var montees = [];
        troupe.forEach(function (c) {
          var g = C.gagnerXP(c.id, Math.round(base * (c.ko ? 0.6 : 1)));
          c.xpGagne = g.gain;
          if (g.monte) montees.push({ nom: c.nom, niveau: g.apres, ultime: g.ultime });
        });

        // Le niveau est franchi ; la finale ouvre Le Fondateur.
        var neuf = DP.noterFwNiveau(adv.n);
        if (window.ARTEFACTS && window.ARTEFACTS.victoireNiveau) {
          window.ARTEFACTS.victoireNiveau(DP.fwNiveau());
        }
        var fondateurNeuf = false;
        if (final) {
          DP.compterExploit('fondateurVaincu');
          if (chrono > 0) DP.noterRecord('fondateurChrono', chrono, true);
          if (window.ARTEFACTS) {
            window.ARTEFACTS.victoireFondateur({
              equipe: equipe.slice(),
              ko: troupe.filter(function (c) { return c.ko; }).length,
              chrono: chrono
            });
          }
          if (!DP.has('lefondateur')) {
            DP.collect('lefondateur');
            if (DP.markNew) DP.markNew('lefondateur');
            fondateurNeuf = true;
          }
        }

        dire((final ? 'LE FONDATEUR EST TOMBÉ' : adv.nom.toUpperCase() + ' EST TOMBÉ') +
             ' — ' + chrono + ' s.',
             function () {
               ecranFin(true, gagne, chrono, {
                 montees: montees, neuf: neuf, fondateur: fondateurNeuf, xp: base
               });
             }, 1400);
      }

      function defaite() {
        if (etat.fini) return;
        etat.fini = true;
        rafraichir();
        menu.textContent = '';
        dire('Votre équipe est à terre…', function () { ecranFin(false, 0, 0); }, 1400);
      }

      // Pour les essais : frapper sans passer par les boutons.
      scene._fwc = {
        etat: etat, troupe: troupe, adversaire: adv,
        frapper: function () {
          var c = vivants()[0];
          if (!c || etat.fini) return false;
          var a = C.attaques(c.id)[0];
          jouer(c, a);
          return true;
        },
        tuer: function () { etat.boss = 1; }
      };

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

    function ecranFin(gagne, cagnotte, chrono, bilan) {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = gagne ? 'victoire' : 'defaite';

      var d = defNiveau() || {};
      var estFinal = d.n === C.DERNIER;
      var box = el('div', 'fw-fin');
      box.appendChild(el('h2', 'fw-fin-titre', gagne ? 'VICTOIRE' : 'DÉFAITE'));
      box.appendChild(el('p', 'fw-fin-txt', gagne
        ? (estFinal ? C.FINAL.fin : d.nom + ' s’effondre. Le niveau ' + d.n + ' est franchi.')
        : (d.nom || 'Ton adversaire') + ' reste debout. Reviens plus fort.'));

      // Le Fondateur rejoint la collection.
      if (gagne && bilan && bilan.fondateur) {
        var gain = el('div', 'fw-fin-fondateur');
        var imf = el('img', 'fw-fin-fondateur-img');
        imf.src = DP.dinderImg('lefondateur');
        imf.alt = '';
        gain.appendChild(imf);
        gain.appendChild(el('strong', null, 'LE FONDATEUR REJOINT TA COLLECTION'));
        gain.appendChild(el('span', 'fw-fin-sous', 'Temporel  ·  il te suit, maintenant.'));
        box.appendChild(gain);
      }

      // L'experience prise par l'equipe.
      if (gagne && bilan && bilan.montees) {
        var xpb = el('div', 'fw-fin-xp');
        xpb.appendChild(el('span', 'fw-fin-xp-titre', '+' + bilan.xp + ' XP par Dinder'));
        bilan.montees.forEach(function (m) {
          var l = el('span', 'fw-fin-monte',
            m.nom + ' passe niveau ' + m.niveau + (m.ultime ? ' — ultime débloqué !' : ''));
          xpb.appendChild(l);
        });
        box.appendChild(xpb);
      }

      if (gagne && chrono) {
        var meilleur = DP.exploit('fondateurChrono');
        var t = el('p', 'fw-chrono', 'Combat bouclé en ' + chrono + ' s'
                 + (meilleur && meilleur < chrono ? '  ·  record : ' + meilleur + ' s' : ''));
        box.appendChild(t);
      }

      if (gagne) {
        var cle = estFinal ? 'pink' : 'green';
        var combien = estFinal ? 2 : 8 + (d.n || 1) * 2;
        var prime = el('div', 'fw-prime');
        var img = el('img');
        img.src = DP.creditImg(cle);
        img.alt = '';
        prime.appendChild(img);
        var nomCredit = DP.CREDITS[cle].name;
        if (combien > 1) nomCredit = nomCredit.replace(/^Crédit /, 'Crédits ') + 's';
        prime.appendChild(el('strong', null, '+' + combien + ' ' + nomCredit));
        prime.appendChild(el('span', 'fw-prime-total', 'cagnotte : ' + cagnotte));
        box.appendChild(prime);
      }

      var boutons = el('div', 'fw-fin-boutons');

      // La revanche renvoie directement dans l'arene : refaire toute la
      // foret a chaque tentative serait une corvee.
      if (gagne && C.ouvert(niveauEnCours + 1) && niveauEnCours < C.DERNIER) {
        var suivant = el('button', 'fw-btn fw-btn--go', 'Niveau ' + (niveauEnCours + 1));
        suivant.type = 'button';
        suivant.addEventListener('click', function () {
          niveauEnCours++;
          ecranEquipe();
        });
        boutons.appendChild(suivant);
      } else {
        var revanche = el('button', 'fw-btn fw-btn--go', 'Revanche');
        revanche.type = 'button';
        revanche.addEventListener('click', function () { ecranCombat(); });
        boutons.appendChild(revanche);
      }

      var niveaux = el('button', 'fw-btn', 'Niveaux');
      niveaux.type = 'button';
      niveaux.addEventListener('click', ecranCampagne);
      boutons.appendChild(niveaux);

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
          'Dix niveaux, dix sbires, et une quête dans les bois avant chacun.',
          'Au bout : l’Effondrement Terminal, contre Le Fondateur lui-même.'
        ],
        commencer: ecranCampagne
      }));
    } else {
      ecranCampagne();
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
