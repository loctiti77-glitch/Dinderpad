// La campagne de The Founder War : dix niveaux, chacun avec sa quête dans
// la forêt et son sbire dans l'arène, puis l'Effondrement Terminal contre
// Le Fondateur lui-même.
//
// Ce fichier tient les donnees : les niveaux, les sbires et leurs
// details, les niveaux des Dinders et ce que ça change à leurs attaques.
// Le jeu lui-meme est dans founder-war.js.
(function () {
  var DP = window.DP;
  if (!DP) return;

  // ==========================================================
  //  Les niveaux des Dinders
  // ==========================================================
  // Un Dinder monte en tapant : chaque combat mene lui rapporte de
  // l'experience. Plus il est rare, plus il frappe fort a niveau egal —
  // et plus son ultime fait mal.

  var NIVEAU_MAX = 10;

  // Ce que vaut la rarete, au depart.
  // Plus un Dinder est rare, plus il frappe fort. Threat est au-dessus de
  // tout : c'est ce qui est remonte de la faille.
  var FORCE_RARETE = {
    'Universel': 1, 'Multiversel': 1.14, 'Omniversel': 1.3, 'Temporel': 1.5,
    'Threat': 1.8
  };

  function forceRarete(id) {
    var d = DP.byId(id);
    return (d && FORCE_RARETE[d.rarity]) || 1;
  }

  // L'experience qu'il faut pour passer au niveau suivant. Un Dinder
  // rare monte aussi vite qu'un autre : c'est sa force qui change.
  function seuil(n) { return n <= 1 ? 0 : Math.round(60 * Math.pow(n - 1, 1.45)); }

  function niveauDe(xp) {
    var n = 1;
    while (n < NIVEAU_MAX && xp >= seuil(n + 1)) n++;
    return n;
  }

  function xpDe(id) { return DP.dinderXP(id); }
  function niveau(id) { return niveauDe(xpDe(id)); }

  function etat(id) {
    var xp = xpDe(id), n = niveauDe(xp);
    var bas = seuil(n), haut = n >= NIVEAU_MAX ? bas : seuil(n + 1);
    return {
      id: id, xp: xp, niveau: n, bas: bas, haut: haut, max: NIVEAU_MAX,
      k: n >= NIVEAU_MAX ? 1 : (xp - bas) / Math.max(1, haut - bas),
      force: force(id, n), pv: pointsDeVie(id, n)
    };
  }

  // Le multiplicateur de degats : la rarete donne le socle, le niveau
  // ajoute huit pour cent par cran.
  function force(id, n) {
    n = n || niveau(id);
    return forceRarete(id) * (1 + 0.08 * (n - 1));
  }

  // Les points de vie suivent la meme logique, plus doucement.
  function pointsDeVie(id, n) {
    n = n || niveau(id);
    return Math.round(100 * forceRarete(id) * (1 + 0.05 * (n - 1)));
  }

  // L'ultime de chaque Dinder : une troisieme attaque, qui ne s'ouvre
  // qu'au niveau six. Une fois par combat.
  var ULTIMES = {
    'dr-islas-human-form':
      { nom: 'Protocole SS-03', degats: [96, 124], ultime: true, soinTous: 30 },
    'dr-islas-demicos-form':
      { nom: 'Greffe Totale', degats: [118, 150], ultime: true, boost: 0.5 },
    'dr-islas-final-form':
      { nom: 'Trou de Ver', degats: [190, 240], ultime: true, etourdit: 0.8 },
    'calder-veyne-veinburner':
      { nom: 'Combustion Veineuse', degats: [150, 190], ultime: true, brulure: 22 },
    'carl-sinars-cardinal-sin':
      { nom: 'Tapis Vert', degats: [22, 34], coups: 7, ultime: true, drain: true },
    'edgar-marks-grincrusher':
      { nom: 'Sourire Final', degats: [160, 205], ultime: true, faiblesse: 0.6 },
    'he-melt':
      { nom: 'Bain d’Acide', degats: [140, 180], ultime: true, brulure: 16 },
    'v':
      { nom: 'Orbe de V', degats: [175, 225], ultime: true, bouclier: 70 },
    'a':
      { nom: 'Axiome Zéro', degats: [185, 235], ultime: true, oubli: true },
    'h':
      { nom: 'Horizon Partagé', degats: [150, 195], ultime: true, soinTous: 45 },
    'multinder':
      { nom: 'Les Cinq Éléments', degats: [40, 56], coups: 5, ultime: true },
    'dr-islas-singularity':
      { nom: 'Point de Non-Retour', degats: [196, 248], ultime: true, etourdit: 0.85 },
    'dr-islas-the-founder':
      { nom: 'Ordre du Vide', degats: [240, 300], ultime: true, soinTous: 60 },
    'harry-hargrove':
      { nom: 'Arrêt sur Image', degats: [112, 146], ultime: true, etourdit: 0.75 },
    'marlon-coach':
      { nom: 'Dernier Round', degats: [120, 155], ultime: true, boost: 0.5 },
    'baron-zofiax':
      { nom: 'Offre Publique', degats: [30, 44], coups: 5, ultime: true, drain: true },
    'timeo-traveler':
      { nom: 'Boucle Fermée', degats: [168, 214], ultime: true, soinTous: 40 },
    'william-batant':
      { nom: 'Nuit Sans Lune', degats: [175, 222], ultime: true, faiblesse: 0.55 },
    'gart-kervelor-king-of-karsovia':
      { nom: 'Couronnement', degats: [165, 210], ultime: true, bouclier: 55 },
    'lefondateur':
      { nom: 'Remise en Ordre', degats: [210, 260], ultime: true, etourdit: 0.6 }
  };

  var NIVEAU_ULTIME = 6;

  function ultimeDe(id) { return ULTIMES[id] || null; }
  function aUltime(id) { return niveau(id) >= NIVEAU_ULTIME && !!ULTIMES[id]; }

  // Les attaques d'un Dinder, degats mis a l'echelle de son niveau.
  function attaques(id) {
    var FW = window.FW;
    var base = FW ? FW.attaquesDe(id) : [];
    var f = force(id);
    var out = base.map(function (a) {
      var b = {};
      for (var k in a) b[k] = a[k];
      b.degats = [Math.round(a.degats[0] * f), Math.round(a.degats[1] * f)];
      return b;
    });
    if (aUltime(id)) {
      var u = ULTIMES[id], c = {};
      for (var k2 in u) c[k2] = u[k2];
      c.degats = [Math.round(u.degats[0] * f), Math.round(u.degats[1] * f)];
      out.push(c);
    }
    return out;
  }

  // Gagner de l'experience, et dire si l'on a change de niveau.
  function gagnerXP(id, n) {
    var avant = niveau(id);
    DP.gagnerDinderXP(id, n);
    var apres = niveau(id);
    return { gain: n, avant: avant, apres: apres, monte: apres > avant,
             ultime: avant < NIVEAU_ULTIME && apres >= NIVEAU_ULTIME };
  }

  // ==========================================================
  //  Les sbires du Fondateur
  // ==========================================================
  // Tous sortent du meme moule : une armure noire zebree de rouge. Chaque
  // niveau ajoute ses pieces — une crete, un bouclier, une seconde paire
  // d'yeux — et sa couleur, pour qu'on les distingue d'un coup d'oeil.

  var IMG_SBIRE = 'assets/games/sbire.webp';
  var imgSbire = null;

  function chargerSbire() {
    if (imgSbire) return imgSbire;
    imgSbire = new Image();
    imgSbire.src = IMG_SBIRE;
    return imgSbire;
  }

  // Les details, dessines par-dessus l'armure. Chacun recoit le canevas,
  // la largeur et la hauteur de la case, et la teinte du niveau.
  var DETAILS = {
    // Une crete sur le casque.
    crete: function (x, L, H, c) {
      x.fillStyle = c;
      for (var i = 0; i < 5; i++) {
        var h = 0.06 * H * (1 - Math.abs(i - 2) * 0.22);
        x.fillRect(L * (0.44 + i * 0.03), H * 0.06 - h, L * 0.022, h);
      }
    },
    // Deux cornes qui partent du casque.
    cornes: function (x, L, H, c) {
      x.strokeStyle = c;
      x.lineWidth = Math.max(2, L * 0.016);
      [[-1, 0.42], [1, 0.58]].forEach(function (s) {
        x.beginPath();
        x.moveTo(L * s[1], H * 0.09);
        x.quadraticCurveTo(L * (s[1] + s[0] * 0.12), H * 0.02, L * (s[1] + s[0] * 0.2), H * 0.05);
        x.stroke();
      });
    },
    // Des epaulettes plus larges, posees sur les epaules de l'armure.
    epaules: function (x, L, H, c) {
      [0.29, 0.71].forEach(function (u) {
        x.fillStyle = 'rgba(16,16,20,.95)';
        x.beginPath();
        x.ellipse(L * u, H * 0.235, L * 0.095, H * 0.042, 0, Math.PI, 0);
        x.fill();
        x.strokeStyle = c;
        x.lineWidth = Math.max(2, L * 0.012);
        x.stroke();
        x.fillStyle = c;
        x.fillRect(L * (u - 0.05), H * 0.222, L * 0.1, H * 0.006);
      });
    },
    // Un bouclier tenu au bras gauche.
    bouclier: function (x, L, H, c) {
      x.fillStyle = 'rgba(20,20,24,.92)';
      x.beginPath();
      x.ellipse(L * 0.22, H * 0.52, L * 0.16, H * 0.16, 0, 0, 6.3);
      x.fill();
      x.strokeStyle = c;
      x.lineWidth = Math.max(2, L * 0.014);
      x.stroke();
      x.beginPath();
      x.moveTo(L * 0.22, H * 0.38); x.lineTo(L * 0.22, H * 0.66);
      x.stroke();
    },
    // Une lame au bras droit.
    lame: function (x, L, H, c) {
      x.fillStyle = c;
      x.beginPath();
      x.moveTo(L * 0.80, H * 0.46);
      x.lineTo(L * 0.98, H * 0.30);
      x.lineTo(L * 1.0, H * 0.38);
      x.lineTo(L * 0.84, H * 0.54);
      x.closePath();
      x.fill();
    },
    // Une cape, qui tombe derriere les epaules. Elle se dessine avant le
    // corps : sinon elle le masquerait entierement.
    cape: function (x, L, H, c) {
      x.fillStyle = c;
      x.globalAlpha = 0.5;
      x.beginPath();
      x.moveTo(L * 0.33, H * 0.20);
      x.lineTo(L * 0.67, H * 0.20);
      x.lineTo(L * 0.92, H * 0.88);
      x.lineTo(L * 0.08, H * 0.88);
      x.closePath();
      x.fill();
      x.globalAlpha = 0.8;
      x.strokeStyle = c;
      x.lineWidth = Math.max(2, L * 0.012);
      x.stroke();
      x.globalAlpha = 1;
    },
    // Une seconde paire d'yeux.
    yeux: function (x, L, H, c) {
      x.fillStyle = c;
      x.fillRect(L * 0.44, H * 0.135, L * 0.05, H * 0.008);
      x.fillRect(L * 0.51, H * 0.135, L * 0.05, H * 0.008);
    },
    // Une aura, derriere le corps.
    aura: function (x, L, H, c) {
      var g = x.createRadialGradient(L / 2, H * 0.5, L * 0.15, L / 2, H * 0.5, L * 0.8);
      g.addColorStop(0, c);
      g.addColorStop(0.45, c);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = 0.3;
      x.fillStyle = g;
      x.fillRect(0, 0, L, H);
      x.globalAlpha = 1;
    },
    // Une couronne, pour le dernier d'entre eux.
    couronne: function (x, L, H, c) {
      x.fillStyle = c;
      x.fillRect(L * 0.38, H * 0.045, L * 0.24, H * 0.014);
      for (var i = 0; i < 5; i++) {
        x.fillRect(L * (0.38 + i * 0.055), H * 0.02, L * 0.02, H * 0.028);
      }
    }
  };

  // ==========================================================
  //  Les dix niveaux, puis l'Effondrement Terminal
  // ==========================================================
  // "quete" dit ce qu'il faut faire dans la foret avant que la porte de
  // l'arene ne s'ouvre : des eclats a ramasser, des bornes a allumer dans
  // l'ordre, des patrouilles a eviter, et parfois un chrono.

  var NIVEAUX = [
    { n: 1, nom: 'Le Guetteur', titre: 'Sbire de veille',
      teinte: '#ff2a2a', details: [],
      pv: 420, coup: [26, 36], quete: { eclats: 2 },
      dialogue: [
        { qui: 'sbire', texte: 'Halte. Ce bois appartient au Fondateur, comme tout le reste.' },
        { qui: 'dinder', texte: 'Un bois n’appartient à personne.' },
        { qui: 'sbire', texte: 'Tout appartient à quelqu’un. C’est ça, l’ordre.' }
      ],
      recit: 'Un guetteur garde l’orée du bois. Il a déjà prévenu les autres.',
      avant: 'Il lève la main. Derrière lui, la forêt s’allume de points rouges.' },
    { n: 2, nom: 'La Sentinelle', titre: 'Sbire de garde',
      teinte: '#ff6a2a', details: ['crete'],
      pv: 560, coup: [30, 42], quete: { eclats: 3, chrono: 100 },
      dialogue: [
        { qui: 'sbire', texte: 'Tu as mis du temps. J’ai compté chaque seconde.' },
        { qui: 'dinder', texte: 'Tu n’as que ça à faire ?' },
        { qui: 'sbire', texte: 'Je compte, je note, je préviens. Et ensuite je frappe.' }
      ],
      recit: 'La Sentinelle ne dort pas. Elle compte, et elle attend.',
      avant: 'Tu as mis trop de temps, dit-elle. Le Fondateur n’aime pas attendre.' },
    { n: 3, nom: 'Le Brise-Crâne', titre: 'Sbire de choc',
      teinte: '#ffb02e', details: ['epaules'],
      pv: 720, coup: [34, 48], quete: { bornes: 3 },
      dialogue: [
        { qui: 'sbire', texte: '…' },
        { qui: 'dinder', texte: 'Il ne parle pas ?' },
        { qui: 'sbire', texte: 'Il a fendu trois casques ce matin. Il n’a rien à dire de plus.' }
      ],
      recit: 'Il ne parle pas. Ses épaulettes ont déjà fendu trois casques.',
      avant: 'Il frappe le sol une fois. Les bornes que tu viens d’allumer s’éteignent.' },
    { n: 4, nom: 'L’Écho Rouge', titre: 'Sbire traqueur',
      teinte: '#ff2a6a', details: ['yeux'],
      pv: 900, coup: [38, 52], quete: { eclats: 4, patrouilles: 1 },
      dialogue: [
        { qui: 'sbire', texte: 'Je te vois deux fois. Le Fondateur aussi, donc.' },
        { qui: 'dinder', texte: 'Alors qu’il regarde bien.' },
        { qui: 'sbire', texte: 'Il regarde. Il regarde toujours.' }
      ],
      recit: 'Il voit deux fois. Ce qu’il voit, Le Fondateur le voit aussi.',
      avant: 'Quatre yeux se braquent sur ton équipe. Aucun ne cligne.' },
    { n: 5, nom: 'La Muraille', titre: 'Sbire bouclier',
      teinte: '#2a9cff', details: ['bouclier', 'epaules'],
      pv: 1100, coup: [40, 54], bouclier: 90, quete: { bornes: 4, patrouilles: 2 },
      dialogue: [
        { qui: 'sbire', texte: 'On ne passe pas.' },
        { qui: 'dinder', texte: 'On est cinq.' },
        { qui: 'sbire', texte: 'J’en ai arrêté beaucoup plus que cinq, et personne n’est ressorti.' }
      ],
      recit: 'Rien n’est passé devant elle depuis la fondation.',
      avant: 'Elle plante son bouclier dans la dalle. « On ne passe pas. »' },
    { n: 6, nom: 'Le Jumeau', titre: 'Sbire copie',
      teinte: '#c86aff', details: ['cape'],
      pv: 1300, coup: [44, 58], copie: true, quete: { eclats: 5, chrono: 85 },
      dialogue: [
        { qui: 'sbire', texte: 'Tu me trouves familier ? C’est normal.' },
        { qui: 'dinder', texte: 'Tu as pris nos gestes.' },
        { qui: 'sbire', texte: 'J’ai pris mieux que ça. Regarde-toi bien avant de frapper.' }
      ],
      recit: 'Il a le visage de quelqu’un que tu connais. Sous le casque, personne.',
      avant: 'Il prend la pose de ton premier Dinder, à la seconde près.' },
    { n: 7, nom: 'L’Inquisiteur', titre: 'Sbire brûleur',
      teinte: '#ff7a1e', details: ['lame', 'crete'],
      pv: 1500, coup: [46, 62], brulure: 14, quete: { bornes: 5, patrouilles: 3 },
      dialogue: [
        { qui: 'sbire', texte: 'J’ai brûlé les dossiers. Les preuves. Et ceux qui les portaient.' },
        { qui: 'dinder', texte: 'Il reste nous.' },
        { qui: 'sbire', texte: 'C’est exactement ce que je disais.' }
      ],
      recit: 'Il brûle les dossiers, les preuves, et ceux qui les portent.',
      avant: 'Sa lame chauffe jusqu’au blanc. L’air sent le métal.' },
    { n: 8, nom: 'Le Colosse d’Acier', titre: 'Sbire de siège',
      teinte: '#8a8f98', details: ['epaules', 'bouclier', 'cornes'],
      pv: 1800, coup: [52, 68], bouclier: 120, quete: { eclats: 6, patrouilles: 3, chrono: 110 },
      dialogue: [
        { qui: 'sbire', texte: 'Deux tonnes d’armure autour de quelqu’un qui a dit non, une fois.' },
        { qui: 'dinder', texte: 'Et ce quelqu’un, il est encore là-dedans ?' },
        { qui: 'sbire', texte: 'Plus depuis longtemps. Écarte-toi.' }
      ],
      recit: 'Deux tonnes d’armure, montées autour de quelqu’un qui a dit non une fois.',
      avant: 'Le sol de l’arène se fissure sous son premier pas.' },
    { n: 9, nom: 'L’Ombre du Fondateur', titre: 'Sbire d’élite',
      teinte: '#6a1ad8', details: ['cape', 'yeux', 'aura'],
      pv: 2100, coup: [56, 74], drain: true, quete: { bornes: 5, patrouilles: 4 },
      dialogue: [
        { qui: 'sbire', texte: 'Je marche trois pas derrière lui depuis toujours.' },
        { qui: 'dinder', texte: 'Ça ne te fatigue pas ?' },
        { qui: 'sbire', texte: 'Je ne me fatigue pas. Je reprends ce que je vois — à commencer par vos forces.' }
      ],
      recit: 'Il marche trois pas derrière Le Fondateur depuis toujours.',
      avant: 'Il ne t’attaque pas tout de suite. Il te regarde, et il reprend ce qu’il voit.' },
    { n: 10, nom: 'Le Premier Sbire', titre: 'Sbire originel',
      teinte: '#ffd84a', details: ['couronne', 'cape', 'epaules', 'lame', 'aura'],
      pv: 2500, coup: [60, 80], bouclier: 90, brulure: 12,
      quete: { eclats: 7, bornes: 3, patrouilles: 5, chrono: 120 },
      dialogue: [
        { qui: 'sbire', texte: 'Je suis le premier qu’il ait mis dans une armure.' },
        { qui: 'dinder', texte: 'Tu peux l’enlever.' },
        { qui: 'sbire', texte: 'Non. Elle a mon visage, maintenant. Et lui, il attend derrière cette porte.' }
      ],
      recit: 'Le premier que Le Fondateur a mis dans une armure. Il n’en est jamais ressorti.',
      avant: 'Il retire son casque une seconde. Dessous, un visage de Dinder.' }
  ];

  // L'Effondrement Terminal : Le Fondateur en personne, et ce qu'il a a dire.
  // ==========================================================
  //  La faille du Dr. Islas
  // ==========================================================
  // L'Effondrement Terminal ne se joue qu'avec la Singularity du Dr.
  // Islas : c'est elle qui disparait dans la faille, emportant Le
  // Fondateur. Trois quetes l'en ramenent — mais pas seule.

  var ISLAS = 'dr-islas-singularity';
  var FUSION = 'dr-islas-the-founder';

  // Le nom affiche, pris au carnet : il suit le Dinder si celui-ci change.
  function nomIslas() {
    var d = DP.byId(ISLAS);
    if (!d) return 'le Dinder exigé';
    return d.name + (d.form ? ' ' + d.form : '');
  }

  // Combien de fois il faut retourner dans la faille, apres le sacrifice.
  var RANCON = 3;

  var QUETES = [
    {
      id: 'serment',
      nom: 'Le Serment du Docteur',
      det: 'Mener ' + nomIslas() + ' au niveau ' + NIVEAU_MAX + '. ' +
           'Ce qui revient de la faille doit être au sommet de sa forme.',
      jauge: function () { return { n: niveau(ISLAS), sur: NIVEAU_MAX }; }
    },
    {
      id: 'sceaux',
      nom: 'Les Neuf Sceaux',
      det: 'Abattre les neuf gardiens de l’Odyssée. Chacun scelle une ' +
           'part du vide où le docteur est tombé.',
      jauge: function () {
        var B = window.BOSS;
        if (!B) return { n: 0, sur: 9 };
        var faits = B.ORDRE.filter(function (id) { return B.vaincu(id); }).length;
        return { n: faits, sur: B.ORDRE.length };
      }
    },
    {
      id: 'rancon',
      nom: 'La Rançon du Vide',
      det: 'Gagner ' + RANCON + ' fois de plus l’Effondrement Terminal avec lui ' +
           'dans l’équipe. La faille ne rend rien sans qu’on y retourne.',
      jauge: function () {
        var f = DP.fusion();
        return { n: Math.max(0, Math.min(RANCON, f.victoires - 1)), sur: RANCON };
      }
    }
  ];

  function quete(id) {
    for (var i = 0; i < QUETES.length; i++) if (QUETES[i].id === id) return QUETES[i];
    return null;
  }

  // Une quete est finie quand sa jauge est pleine — ou qu'on l'a deja
  // inscrite au profil, pour qu'un Dinder remis a zero ne la reprenne pas.
  function queteFaite(id) {
    if (DP.aQuete(id)) return true;
    var q = quete(id);
    if (!q) return false;
    var j = q.jauge();
    if (j.n >= j.sur) { DP.noterQuete(id); return true; }
    return false;
  }

  // L'etat de l'histoire, tel que l'ecran l'affiche.
  function etatFusion() {
    var f = DP.fusion();
    var l = QUETES.map(function (q) {
      var j = q.jauge();
      return { id: q.id, nom: q.nom, det: q.det, n: Math.min(j.n, j.sur), sur: j.sur,
               faite: queteFaite(q.id) };
    });
    return {
      ouverte: f.sacrifice,
      faite: f.faite || DP.has(FUSION),
      victoires: f.victoires,
      quetes: l,
      pretes: l.filter(function (q) { return q.faite; }).length,
      prete: f.sacrifice && !f.faite && l.every(function (q) { return q.faite; })
    };
  }

  // La Singularity est-elle indispensable ici, et l'a-t-on ?
  function exigeIslas(n) { return n === DERNIER; }
  function aIslas() { return DP.has(ISLAS); }

  var FINAL = {
    n: 11, nom: 'Effondrement Terminal', titre: 'Le Fondateur',
    teinte: '#ff2a2a', pv: 4800, coup: [74, 98],
    recit: 'Il n’y a plus de sbire entre vous et lui.',
    dialogue: [
      { qui: 'fondateur', texte: 'Vous avez traversé dix niveaux de mon armée pour venir me dire quoi ?' },
      { qui: 'dinder', texte: 'Que l’omnivers n’a pas besoin de toi.' },
      { qui: 'fondateur', texte: 'L’omnivers est un tiroir renversé. Des mondes qui se recopient, des doubles, des erreurs. Toi, par exemple : je compte trois versions de ton docteur.' },
      { qui: 'dinder', texte: 'Ce sont trois vies. Pas trois erreurs.' },
      { qui: 'fondateur', texte: 'Je ne détruis rien. Je remets de l’ordre. Un seul de chaque, à sa place, pour toujours.' },
      { qui: 'dinder', texte: 'Et qui décide de la place ?' },
      { qui: 'fondateur', texte: 'Celui qui a fondé. Écartez-vous, ou je vous range avec le reste.' },
      { qui: 'dinder', texte: 'Alors range-nous. Si tu peux.' }
    ],
    fin: 'Le Fondateur tombe à genoux. « Vous… laissez le désordre gagner. » ' +
         'Puis il se relève, lentement, et vous suit. Il entre à la collection.'
  };

  function parNiveau(n) {
    if (n === FINAL.n) return FINAL;
    for (var i = 0; i < NIVEAUX.length; i++) if (NIVEAUX[i].n === n) return NIVEAUX[i];
    return null;
  }

  var DERNIER = FINAL.n;

  // Le niveau le plus haut deja franchi, et celui qu'on peut tenter.
  function franchi(n) { return DP.fwNiveau() >= n; }
  function ouvert(n) { return n <= DP.fwNiveau() + 1 && n <= DERNIER; }
  function prochain() { return Math.min(DERNIER, DP.fwNiveau() + 1); }

  // ==========================================================
  //  La planche d'un sbire
  // ==========================================================

  var cacheSbire = {};

  function feuilleSbire(n) {
    var def = parNiveau(n);
    if (!def) return null;
    var img = chargerSbire();
    if (!img.complete || !img.naturalWidth) return null;
    if (cacheSbire[n]) return cacheSbire[n];

    var L = 260, H = Math.round(L * img.naturalHeight / img.naturalWidth);
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = H;
    var x = cv.getContext('2d');
    if (!x) return null;

    var pieces = def.details || [];
    var ARRIERE = ['aura', 'cape'];

    // Ce qui passe derriere : l'aura, puis la cape.
    ARRIERE.forEach(function (d) {
      if (pieces.indexOf(d) === -1) return;
      x.save();
      DETAILS[d](x, L, H, def.teinte);
      x.restore();
    });

    // Le corps de l'armure, teinte a la couleur du niveau. Le mode
    // "color" ne change que la teinte : les reflets et les creux de
    // l'armure restent lisibles, et les lignes rouges prennent la
    // couleur du sbire.
    var corps = document.createElement('canvas');
    corps.width = L; corps.height = H;
    var cx = corps.getContext('2d');
    if (cx) {
      cx.drawImage(img, 0, 0, L, H);
      if (n !== 1) {
        cx.save();
        cx.globalCompositeOperation = 'color';
        cx.globalAlpha = 0.85;
        cx.fillStyle = def.teinte;
        cx.fillRect(0, 0, L, H);
        cx.globalCompositeOperation = 'destination-in';
        cx.globalAlpha = 1;
        cx.drawImage(img, 0, 0, L, H);
        cx.restore();
      }
      x.drawImage(corps, 0, 0);
    } else {
      x.drawImage(img, 0, 0, L, H);
    }

    // Puis les pieces qui se posent par-dessus.
    pieces.forEach(function (d) {
      if (ARRIERE.indexOf(d) !== -1 || !DETAILS[d]) return;
      x.save();
      DETAILS[d](x, L, H, def.teinte);
      x.restore();
    });

    cacheSbire[n] = { canvas: cv, L: L, H: H };
    return cacheSbire[n];
  }

  function urlSbire(n) {
    var f = feuilleSbire(n);
    return f ? f.canvas.toDataURL('image/png') : IMG_SBIRE;
  }

  window.FWCAMP = {
    ISLAS: ISLAS, FUSION: FUSION, RANCON: RANCON, QUETES: QUETES,
    nomIslas: nomIslas,
    quete: quete, queteFaite: queteFaite, etatFusion: etatFusion,
    exigeIslas: exigeIslas, aIslas: aIslas,
    NIVEAUX: NIVEAUX, FINAL: FINAL, DERNIER: DERNIER, NIVEAU_MAX: NIVEAU_MAX,
    NIVEAU_ULTIME: NIVEAU_ULTIME, ULTIMES: ULTIMES, FORCE_RARETE: FORCE_RARETE,
    parNiveau: parNiveau, franchi: franchi, ouvert: ouvert, prochain: prochain,
    seuil: seuil, niveauDe: niveauDe, niveau: niveau, etat: etat, force: force,
    pointsDeVie: pointsDeVie, attaques: attaques, ultimeDe: ultimeDe, aUltime: aUltime,
    gagnerXP: gagnerXP, feuilleSbire: feuilleSbire, urlSbire: urlSbire,
    chargerSbire: chargerSbire, IMG_SBIRE: IMG_SBIRE
  };
})();
