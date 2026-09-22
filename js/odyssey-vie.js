// Ce qui vit — et ce qui se dresse — sur les huit mondes du systeme
// solaire, pour The Odyssey of Dinder.
//
// Huit astres, chacun avec sa palette de terrain, trois creatures et une
// curiosite. Comme les poissons et les requins, rien n'est stocke en
// fichier : chaque bete est peinte a la volee dans une case de 40 x 32 a
// partir d'une carrure, d'une palette et d'un motif.
(function () {

  // ==========================================================
  //  Les huit astres
  // ==========================================================
  // "code" est ce que le joueur tape sur le Teleportail : SS pour Systeme
  // Solaire, l'initiale de la planete, et son rang depuis le Soleil.
  // Mercure et Mars partagent leur initiale : c'est le rang qui tranche.
  //
  // "palette" sert au terrain, "ciel" au fond de l'ecran, "relief" au
  // relief des cartes.
  var ASTRES = [
    {
      code: 'SS-M1', id: 'mercure', nom: 'Mercure', rang: 1,
      sous: 'La plus proche, la plus brûlée',
      texte: 'Un caillou sans air, cuit d’un côté et gelé de l’autre. ' +
             'Le sol y est craquelé comme une vieille peinture, et le métal ' +
             'coule en flaques là où le Soleil frappe.',
      ciel: ['#2a1d16', '#5c3720', '#100a08'],
      palette: {
        sol: '#8a7f72', sol2: '#7a7065', grain: '#a2968a',
        roche: '#6a6155', rocheHaut: '#8f8477', rocheOmbre: '#3e382f',
        liquide: '#c2541a', liquide2: '#e88a2c', ecume: '#ffd07a',
        cristal: '#b6a894', cristal2: '#e4d8c6',
        structure: '#6e6458', structureHaut: '#948877'
      },
      liquideNom: 'métal fondu', eau: 0.05, roche: 0.16, cristal: 0.02
    },
    {
      code: 'SS-V2', id: 'venus', nom: 'Vénus', rang: 2,
      sous: 'La fournaise sous la brume',
      texte: 'Quatre-vingt-dix atmosphères de gaz jaune, et des nuages ' +
             'd’acide qui ne se lèvent jamais. On n’y voit pas à trente ' +
             'pas, et tout ce qui traîne finit par fondre.',
      ciel: ['#6b4f12', '#b08c22', '#3a2a08'],
      palette: {
        sol: '#8d7226', sol2: '#7d6520', grain: '#a98c34',
        roche: '#6a561c', rocheHaut: '#8f7628', rocheOmbre: '#3c3010',
        liquide: '#b9c03a', liquide2: '#d6dd62', ecume: '#f4f79a',
        cristal: '#c9b24a', cristal2: '#f0e08a',
        structure: '#6f5c22', structureHaut: '#947c30'
      },
      liquideNom: 'mares d’acide', eau: 0.06, roche: 0.13, cristal: 0.02
    },
    {
      code: 'SS-T3', id: 'terre', nom: 'Terre', rang: 3,
      sous: 'Chez toi, vue d’ailleurs',
      texte: 'Ton jardin, la nuit, et le cratère encore tiède. C’est le ' +
             'seul monde où le Téléportail n’apprend rien de neuf — sauf ' +
             'peut-être ce qui vit sous le cabanon.',
      ciel: ['#0d1c33', '#1d3a5c', '#050a14'],
      palette: {
        sol: '#3d7a36', sol2: '#357030', grain: '#4d9042',
        roche: '#6b6a62', rocheHaut: '#8d8c83', rocheOmbre: '#3a3934',
        liquide: '#2a68c4', liquide2: '#3f82dd', ecume: '#a8d8ff',
        cristal: '#9fb6c8', cristal2: '#d8e6f2',
        structure: '#6b4526', structureHaut: '#8d6338'
      },
      liquideNom: 'la mare', eau: 0.05, roche: 0.08, cristal: 0.01
    },
    {
      code: 'SS-M4', id: 'mars', nom: 'Mars', rang: 4,
      sous: 'La rouille et le silence',
      texte: 'De la poussière de fer jusqu’à l’horizon, et de la glace ' +
             'juste dessous. Les tempêtes y durent des mois et n’emportent ' +
             'rien, parce qu’il n’y a rien à emporter.',
      ciel: ['#6b4230', '#c08050', '#2a170f'],
      palette: {
        sol: '#a05a3a', sol2: '#8f4f33', grain: '#bd7150',
        roche: '#7a4229', rocheHaut: '#a15c3a', rocheOmbre: '#48251a',
        liquide: '#c9d8e0', liquide2: '#e8f2f8', ecume: '#ffffff',
        cristal: '#d0dce4', cristal2: '#f4fafd',
        structure: '#7e5340', structureHaut: '#a67056'
      },
      liquideNom: 'glace affleurante', eau: 0.05, roche: 0.17, cristal: 0.03
    },
    {
      code: 'SS-J5', id: 'jupiter', nom: 'Jupiter', rang: 5,
      sous: 'Pas de sol, rien que la tempête',
      texte: 'Le Téléportail t’a posé sur une croûte d’ammoniac gelée qui ' +
             'flotte entre deux orages. Elle tiendra le temps qu’il faudra. ' +
             'Sous tes pieds, il n’y a plus rien avant dix mille kilomètres.',
      ciel: ['#6a4a2a', '#d8b184', '#2a1a10'],
      palette: {
        sol: '#d9bf92', sol2: '#c2a677', grain: '#efdcb4',
        roche: '#9a7a4c', rocheHaut: '#c2a071', rocheOmbre: '#5e4526',
        liquide: '#8e4a2e', liquide2: '#b8683f', ecume: '#e8a26a',
        cristal: '#e8dcc0', cristal2: '#fffaec',
        structure: '#a08658', structureHaut: '#c8ab78'
      },
      liquideNom: 'un puits de tempête', eau: 0.08, roche: 0.10, cristal: 0.04
    },
    {
      code: 'SS-S6', id: 'saturne', nom: 'Saturne', rang: 6,
      sous: 'Sous les anneaux',
      texte: 'Une plaque de glace dérive sous des anneaux si larges qu’ils ' +
             'barrent le ciel d’un bout à l’autre. Tout est pâle, et tout ' +
             'tinte quand on marche.',
      ciel: ['#4a4630', '#cbbd86', '#1c1a12'],
      palette: {
        sol: '#cfc9ae', sol2: '#bcb69c', grain: '#e6e0c6',
        roche: '#9a9478', rocheHaut: '#c0ba9e', rocheOmbre: '#5c583f',
        liquide: '#8fb6c8', liquide2: '#b4d4e2', ecume: '#e8f6ff',
        cristal: '#d8e8f0', cristal2: '#ffffff',
        structure: '#a39d84', structureHaut: '#c8c2a8'
      },
      liquideNom: 'des fondrières de glace', eau: 0.07, roche: 0.11, cristal: 0.06
    },
    {
      code: 'SS-U7', id: 'uranus', nom: 'Uranus', rang: 7,
      sous: 'Le monde couché',
      texte: 'Elle roule sur le flanc, l’axe en travers de son orbite. ' +
             'Le résultat : des saisons de quarante ans, un givre de méthane ' +
             'partout, et une lumière qui ne vient jamais d’où on l’attend.',
      ciel: ['#1c4a52', '#6fc2cc', '#0a1e22'],
      palette: {
        sol: '#6fa8b2', sol2: '#5f959f', grain: '#8fc6cf',
        roche: '#4a7d86', rocheHaut: '#6ea3ac', rocheOmbre: '#284a52',
        liquide: '#3fb8c8', liquide2: '#6ad6e2', ecume: '#c0f4fb',
        cristal: '#a8e2ea', cristal2: '#e4fbff',
        structure: '#517f88', structureHaut: '#74a5ae'
      },
      liquideNom: 'des nappes de méthane', eau: 0.09, roche: 0.12, cristal: 0.07
    },
    {
      code: 'SS-N8', id: 'neptune', nom: 'Neptune', rang: 8,
      sous: 'Les vents les plus rapides connus',
      texte: 'Deux mille kilomètres-heure, et pas un obstacle pour les ' +
             'freiner. Des geysers d’azote percent la croûte et retombent ' +
             'en neige, très loin, très lentement.',
      ciel: ['#10214e', '#3f63b8', '#050b1c'],
      palette: {
        sol: '#3f5a9e', sol2: '#364e8b', grain: '#5674bd',
        roche: '#2a3f74', rocheHaut: '#48629e', rocheOmbre: '#161f3c',
        liquide: '#7ad0e8', liquide2: '#a8e6f6', ecume: '#e8fbff',
        cristal: '#9fb6f0', cristal2: '#dce6ff',
        structure: '#33487f', structureHaut: '#5169a8'
      },
      liquideNom: 'des geysers d’azote', eau: 0.08, roche: 0.13, cristal: 0.05
    }
  ];

  function astre(code) {
    var c = String(code || '').toUpperCase().replace(/\s+/g, '');
    for (var i = 0; i < ASTRES.length; i++) {
      if (ASTRES[i].code === c || ASTRES[i].id === c.toLowerCase()) return ASTRES[i];
    }
    return null;
  }

  // ==========================================================
  //  Les creatures
  // ==========================================================
  // "carrure" choisit la silhouette, "c" les trois tons, "taille" le
  // facteur d'echelle sur la carte. "rarete" dit combien on en croise.
  var VIES = [
    // ---- Mercure ----
    { id: 'fondeur', astre: 'mercure', nom: 'Fondeur de Zinc', carrure: 'rampant',
      c: ['#c2541a', '#f0a03a', '#3a1e0c'], taille: 1, rarete: 'commun',
      texte: 'Il broute le métal liquide et le recrache en perles solides. ' +
             'Les plaines de Mercure en sont pavées sur des kilomètres.' },
    { id: 'braise-mite', astre: 'mercure', nom: 'Braise-Mite', carrure: 'insecte',
      c: ['#6a3010', '#e8742a', '#ffd07a'], taille: 0.75, rarete: 'commun',
      texte: 'Elle pond dans les craquelures, du côté nuit, et éclot quand ' +
             'le terminateur repasse. Une génération par rotation.' },
    { id: 'ombre-longue', astre: 'mercure', nom: 'Ombre-Longue', carrure: 'flottant',
      c: ['#1a1a24', '#40405c', '#8a8ab8'], taille: 1.3, rarete: 'rare',
      texte: 'On ne la voit que du côté nuit, et seulement de biais. ' +
             'Le scanner la détecte ; l’œil, presque jamais.' },

    // ---- Venus ----
    { id: 'cloche-acide', astre: 'venus', nom: 'Cloche-Acide', carrure: 'meduse',
      c: ['#d6dd62', '#f4f79a', '#8a8c2a'], taille: 1.1, rarete: 'commun',
      texte: 'Elle dérive dans la brume et dissout ce qu’elle touche. ' +
             'Sa cloche est en verre : c’est la seule chose que l’acide épargne.' },
    { id: 'rampe-soufre', astre: 'venus', nom: 'Rampe-Soufre', carrure: 'rampant',
      c: ['#8d7226', '#d8bc4a', '#3c3010'], taille: 0.9, rarete: 'commun',
      texte: 'Une carapace de soufre cristallisé, refaite à chaque mue. ' +
             'Elle abandonne les anciennes en tas, qui fument encore.' },
    { id: 'chanteur', astre: 'venus', nom: 'Chanteur de Pression', carrure: 'colosse',
      c: ['#6a561c', '#b09a3a', '#f4f79a'], taille: 1.6, rarete: 'rare',
      texte: 'Il émet une note trop grave pour être entendue, qui porte ' +
             'à cent kilomètres dans une atmosphère pareille. Ils se répondent.' },

    // ---- Terre ----
    { id: 'chat-jardin', astre: 'terre', nom: 'Chat du Jardin', carrure: 'rampant',
      c: ['#4a4038', '#8a7a68', '#f0e8d8'], taille: 0.9, rarete: 'commun',
      texte: 'Il était là avant la comète et il sera là après. ' +
             'Le scanner le classe « forme de vie indigène, indifférente ».' },
    { id: 'luciole', astre: 'terre', nom: 'Luciole Tardive', carrure: 'insecte',
      c: ['#2e3a20', '#6a7a3a', '#e8f078'], taille: 0.6, rarete: 'commun',
      texte: 'Elle vole en septembre, quand les autres ont fini. ' +
             'Son clignotement a exactement le rythme du Téléportail au repos.' },
    { id: 'chose-cabanon', astre: 'terre', nom: 'La Chose sous le Cabanon',
      carrure: 'essaim', c: ['#1e1a24', '#4a3a58', '#a888d0'], taille: 1.2,
      rarete: 'rare',
      texte: 'Elle y est depuis bien plus longtemps que la comète. ' +
             'Le scanner refuse de lui donner une origine, et propose « locale ».' },

    // ---- Mars ----
    { id: 'fouisseur', astre: 'mars', nom: 'Fouisseur de Rouille', carrure: 'rampant',
      c: ['#7a4229', '#c07a4a', '#e8c8a0'], taille: 1, rarete: 'commun',
      texte: 'Il mange l’oxyde de fer et laisse derrière lui une trace ' +
             'plus pâle, où le sol est redevenu métal.' },
    { id: 'voile-poussiere', astre: 'mars', nom: 'Voile-de-Poussière', carrure: 'essaim',
      c: ['#a05a3a', '#d09a72', '#f0d8c0'], taille: 1.4, rarete: 'commun',
      texte: 'Mille bestioles d’un millimètre qui volent ensemble. ' +
             'De loin, on jure que c’est une tempête ; de près, ça respire.' },
    { id: 'rover', astre: 'mars', nom: 'Le Vieux Rover', carrure: 'machine',
      c: ['#8a8f96', '#c4c9d0', '#e8b02a'], taille: 1.1, rarete: 'rare',
      texte: 'Envoyé d’ici, il y a très longtemps. Ses batteries sont mortes ' +
             'depuis des décennies, et pourtant il avance encore, très lentement.' },

    // ---- Jupiter ----
    { id: 'planeur', astre: 'jupiter', nom: 'Planeur d’Ammoniac', carrure: 'flottant',
      c: ['#c2a677', '#efdcb4', '#8e4a2e'], taille: 1.3, rarete: 'commun',
      texte: 'Il ne se pose jamais — il n’y a nulle part où se poser. ' +
             'Il naît, vit et meurt entre deux couches de nuages.' },
    { id: 'anguille-foudre', astre: 'jupiter', nom: 'Anguille de Foudre', carrure: 'serpent',
      c: ['#3a2a14', '#e8d07a', '#fff8d0'], taille: 1.2, rarete: 'commun',
      texte: 'Elle remonte les colonnes d’orage et s’y recharge. ' +
             'Ne pas scanner pendant un éclair : le Téléportail n’aime pas ça.' },
    { id: 'grand-calme', astre: 'jupiter', nom: 'Le Grand Calme', carrure: 'colosse',
      c: ['#8e4a2e', '#d08a52', '#ffe0b0'], taille: 1.8, rarete: 'rare',
      texte: 'Il vit dans l’œil de la Grande Tache Rouge, là où le vent ' +
             'tombe à zéro. C’est peut-être lui qui la tient ouverte.' },

    // ---- Saturne ----
    { id: 'brouteur', astre: 'saturne', nom: 'Brouteur d’Anneaux', carrure: 'flottant',
      c: ['#bcb69c', '#e6e0c6', '#8fb6c8'], taille: 1.2, rarete: 'commun',
      texte: 'Il monte jusqu’aux anneaux, avale de la glace, et redescend ' +
             'la digérer au sol. Les anneaux perdent un peu de masse chaque année.' },
    { id: 'cristal-chanteur', astre: 'saturne', nom: 'Cristal-Chanteur', carrure: 'cristallin',
      c: ['#d8e8f0', '#ffffff', '#8fb6c8'], taille: 1, rarete: 'commun',
      texte: 'Vivant, malgré les apparences. Il pousse d’un millimètre par ' +
             'siècle et tinte quand on passe à côté.' },
    { id: 'faucheur-givre', astre: 'saturne', nom: 'Faucheur de Givre', carrure: 'insecte',
      c: ['#9a9478', '#d0cab0', '#e8f6ff'], taille: 0.85, rarete: 'rare',
      texte: 'Il coupe les cristaux-chanteurs à la base et les emporte. ' +
             'Personne n’a jamais trouvé où.' },

    // ---- Uranus ----
    { id: 'nageur-methane', astre: 'uranus', nom: 'Nageur de Méthane', carrure: 'serpent',
      c: ['#3fb8c8', '#a8e2ea', '#1c4a52'], taille: 1.25, rarete: 'commun',
      texte: 'Il traverse les nappes de méthane liquide sans jamais en sortir. ' +
             'Sa peau gèle à l’air libre en une seconde et demie.' },
    { id: 'tourne-givre', astre: 'uranus', nom: 'Tourne-Givre', carrure: 'flottant',
      c: ['#6fa8b2', '#c0f4fb', '#284a52'], taille: 1, rarete: 'commun',
      texte: 'Il tourne sur le flanc, comme la planète. On ne sait pas ' +
             'lequel des deux a copié l’autre.' },
    { id: 'dormeur', astre: 'uranus', nom: 'Le Dormeur Couché', carrure: 'colosse',
      c: ['#284a52', '#5f959f', '#e4fbff'], taille: 1.7, rarete: 'rare',
      texte: 'Une saison de quarante ans, c’est une nuit pour lui. ' +
             'Il se réveillera au prochain équinoxe, dans vingt ans.' },

    // ---- Neptune ----
    { id: 'crieur-vents', astre: 'neptune', nom: 'Crieur des Vents', carrure: 'flottant',
      c: ['#3f5a9e', '#8fa8e8', '#e8fbff'], taille: 1.15, rarete: 'commun',
      texte: 'Il se laisse porter à deux mille kilomètres-heure et hurle ' +
             'tout du long. C’est ainsi qu’ils se comptent.' },
    { id: 'geyser-vivant', astre: 'neptune', nom: 'Geyser Vivant', carrure: 'colosse',
      c: ['#2a3f74', '#7ad0e8', '#e8fbff'], taille: 1.6, rarete: 'commun',
      texte: 'Il perce la croûte, souffle une colonne d’azote de huit ' +
             'kilomètres, et se rendort pour trente ans.' },
    { id: 'fileur-azote', astre: 'neptune', nom: 'Fileur d’Azote', carrure: 'insecte',
      c: ['#364e8b', '#9fb6f0', '#ffffff'], taille: 0.8, rarete: 'rare',
      texte: 'Il file un fil d’azote solide, plus fin qu’un cheveu et ' +
             'plus solide que l’acier. Le Téléportail en veut un échantillon.' }
  ];

  // ==========================================================
  //  Les curiosites
  // ==========================================================
  // Elles ne bougent pas : ce sont des lieux. Une par astre, plantee sur
  // la carte, et qui se scanne comme le reste.
  var CURIOSITES = [
    { id: 'falaise-ridee', astre: 'mercure', nom: 'La Falaise Ridée',
      forme: 'falaise', c: ['#6a6155', '#8f8477', '#3e382f'],
      texte: 'Un escarpement de six cents kilomètres. Mercure a refroidi, ' +
             'donc rétréci, et sa croûte s’est plissée comme une pomme sèche.' },
    { id: 'tour-penchee', astre: 'venus', nom: 'La Tour Penchée',
      forme: 'tour', c: ['#6a561c', '#a98c34', '#f4f79a'],
      texte: 'Quarante mètres de basalte taillé, debout dans la brume. ' +
             'Le scanner ne trouve aucune trace d’outil, et aucune d’érosion.' },
    { id: 'cratere-jardin', astre: 'terre', nom: 'Le Cratère du Jardin',
      forme: 'cratere', c: ['#3a3934', '#6b6a62', '#e8a24a'],
      texte: 'Trois mètres de large, au fond du jardin. C’est là que tout ' +
             'a commencé, il y a quelques heures. Le sol est encore tiède.' },
    { id: 'le-visage', astre: 'mars', nom: 'Le Visage',
      forme: 'visage', c: ['#7a4229', '#a15c3a', '#48251a'],
      texte: 'Un relief de deux kilomètres qui ressemble à un visage ' +
             'quand la lumière vient de l’ouest. Et seulement alors.' },
    { id: 'oeil-rouge', astre: 'jupiter', nom: 'L’Œil Rouge',
      forme: 'oeil', c: ['#8e4a2e', '#c26a3a', '#ffd8a8'],
      texte: 'Une tempête plus large que la Terre, qui tourne depuis au ' +
             'moins trois cent cinquante ans. Elle rétrécit, lentement.' },
    { id: 'hexagone', astre: 'saturne', nom: 'L’Hexagone',
      forme: 'hexagone', c: ['#9a9478', '#d8e8f0', '#5c583f'],
      texte: 'Un courant-jet de trente mille kilomètres de côté, en forme ' +
             'd’hexagone parfait, au pôle nord. Personne ne sait pourquoi six.' },
    { id: 'ciel-couche', astre: 'uranus', nom: 'Le Ciel Couché',
      forme: 'ciel', c: ['#4a7d86', '#a8e2ea', '#e4fbff'],
      texte: 'Ici, le pôle regarde le Soleil en face pendant vingt ans. ' +
             'L’ombre ne tourne pas : elle s’allonge, puis elle revient.' },
    { id: 'tache-sombre', astre: 'neptune', nom: 'La Tache Sombre',
      forme: 'tache', c: ['#161f3c', '#2a3f74', '#9fb6f0'],
      texte: 'Un anticyclone grand comme un continent, qui apparaît, ' +
             'dérive quelques années, puis se dissout sans laisser de trace.' }
  ];

  function vies(idAstre) {
    return VIES.filter(function (v) { return v.astre === idAstre; });
  }

  function curiosite(idAstre) {
    for (var i = 0; i < CURIOSITES.length; i++) {
      if (CURIOSITES[i].astre === idAstre) return CURIOSITES[i];
    }
    return null;
  }

  function parId(id) {
    for (var i = 0; i < VIES.length; i++) if (VIES[i].id === id) return VIES[i];
    for (var k = 0; k < CURIOSITES.length; k++) {
      if (CURIOSITES[k].id === id) return CURIOSITES[k];
    }
    return null;
  }

  // Tout ce qui se scanne, dans l'ordre des astres.
  function scannables(idAstre) {
    var out = vies(idAstre).slice();
    var c = curiosite(idAstre);
    if (c) out.push(c);
    return out;
  }

  function tout() {
    var out = [];
    ASTRES.forEach(function (a) {
      scannables(a.id).forEach(function (s) { out.push(s); });
    });
    return out;
  }

  // ==========================================================
  //  Le dessin des creatures
  // ==========================================================

  var L = 40, H = 32;
  var CERNE = [14, 16, 26, 255];

  function ovale(p, cx, cy, rx, ry, col) {
    for (var dy = -ry; dy <= ry; dy++) {
      var k = 1 - (dy / (ry + 0.5)) * (dy / (ry + 0.5));
      if (k <= 0) continue;
      var w = Math.round(rx * Math.sqrt(k));
      p(cx - w, cy + dy, w * 2 + 1, 1, col);
    }
  }

  function oeil(p, x, y, clair) {
    p(x, y, 2, 2, clair || '#f2f6ff');
    p(x, y, 1, 1, '#141826');
  }

  function dessinerVie(p, v) {
    var a = v.c[0], b = v.c[1], d = v.c[2];
    var cx = 20, cy = 18, i, ang;

    if (v.carrure === 'rampant') {
      // Un corps bas sur pattes, museau en avant.
      ovale(p, cx, cy, 12, 7, a);
      ovale(p, cx + 2, cy + 2, 9, 4, b);
      p(6, cy - 3, 8, 7, a);                      // la tete
      p(6, cy - 1, 5, 3, b);
      for (i = 0; i < 4; i++) p(10 + i * 7, cy + 6, 3, 6, d);   // les pattes
      p(30, cy - 2, 7, 3, d);                     // la queue
      for (i = 0; i < 5; i++) p(14 + i * 4, cy - 8, 2, 3, d);   // la crete
      oeil(p, 8, cy - 2);
      return;
    }

    if (v.carrure === 'insecte') {
      ovale(p, cx + 3, cy, 9, 6, a);
      ovale(p, cx + 4, cy + 1, 6, 3, b);
      p(9, cy - 4, 8, 8, a);                      // le thorax
      p(5, cy - 2, 5, 4, d);                      // la tete
      for (i = 0; i < 3; i++) {                   // les pattes
        p(12 + i * 6, cy + 5, 2, 7, d);
        p(11 + i * 6, cy + 11, 4, 2, d);
      }
      p(6, cy - 8, 2, 6, d); p(10, cy - 9, 2, 7, d);   // les antennes
      // Les ailes, translucides.
      for (i = 0; i < 12; i++) p(16 + i, cy - 12 + Math.round(i * 0.5), 1, 6, b);
      oeil(p, 6, cy - 1, v.c[2]);
      return;
    }

    if (v.carrure === 'flottant') {
      ovale(p, cx, cy - 3, 11, 8, a);
      ovale(p, cx, cy - 5, 8, 5, b);
      // Les filaments qui pendent.
      for (i = 0; i < 5; i++) {
        var fx = 12 + i * 4;
        var fh = 7 + ((i * 5) % 8);
        p(fx, cy + 4, 1, fh, d);
        p(fx + (i % 2 ? 1 : -1), cy + 4 + fh, 1, 2, d);
      }
      p(14, cy - 9, 3, 2, b); p(24, cy - 9, 3, 2, b);
      oeil(p, 16, cy - 4); oeil(p, 22, cy - 4);
      return;
    }

    if (v.carrure === 'meduse') {
      ovale(p, cx, cy - 4, 12, 7, a);
      p(9, cy - 4, 23, 4, a);
      p(10, cy - 1, 21, 2, b);
      for (i = 0; i < 7; i++) {
        var mx = 10 + i * 3;
        var mh = 8 + ((i % 4) * 3);
        p(mx, cy + 1, 1, mh, d);
        p(mx + (i % 2 ? 1 : -1), cy + 1 + mh, 1, 3, d);
      }
      p(14, cy - 8, 5, 2, b);
      return;
    }

    if (v.carrure === 'serpent') {
      for (var x2 = 4; x2 < 35; x2++) {
        var y2 = cy + Math.round(Math.sin((x2 - 4) / 4.6) * 6);
        p(x2, y2 - 3, 1, 6, a);
        p(x2, y2, 1, 3, b);
        if (x2 % 6 === 0) p(x2, y2 - 5, 1, 2, d);
      }
      p(2, cy + Math.round(Math.sin(0) * 6) - 4, 5, 8, a);
      oeil(p, 3, cy - 2);
      p(35, cy + Math.round(Math.sin(31 / 4.6) * 6) - 3, 4, 7, d);
      return;
    }

    if (v.carrure === 'colosse') {
      ovale(p, cx, cy + 1, 14, 10, a);
      ovale(p, cx, cy + 4, 11, 6, b);
      p(8, cy - 10, 14, 10, a);                   // le buste
      p(10, cy - 8, 9, 5, b);
      for (i = 0; i < 2; i++) p(11 + i * 11, cy + 10, 5, 5, d);  // les pieds
      p(2, cy - 6, 7, 4, d); p(31, cy - 6, 7, 4, d);             // les bras
      for (i = 0; i < 4; i++) p(10 + i * 5, cy - 15, 3, 5, d);   // la couronne
      oeil(p, 12, cy - 6); oeil(p, 17, cy - 6);
      return;
    }

    if (v.carrure === 'cristallin') {
      for (i = 0; i < 5; i++) {
        var hx = 8 + i * 6;
        var hh = 10 + ((i * 7) % 14);
        p(hx, cy + 10 - hh, 4, hh, a);
        p(hx + 1, cy + 10 - hh + 1, 1, hh - 2, b);
        p(hx, cy + 10 - hh, 4, 2, b);
      }
      p(6, cy + 8, 28, 4, d);
      oeil(p, 18, cy - 2, b);
      return;
    }

    if (v.carrure === 'essaim') {
      // Une nuee : des dizaines de points qui font une forme.
      for (i = 0; i < 48; i++) {
        ang = i * 2.399;
        var r = Math.sqrt(i / 48);
        var ex = Math.round(cx + Math.cos(ang) * r * 15);
        var ey = Math.round(cy + Math.sin(ang) * r * 10);
        p(ex, ey, 2, 2, i % 3 === 0 ? d : (i % 3 === 1 ? b : a));
      }
      oeil(p, 17, cy - 1, b);
      oeil(p, 22, cy - 1, b);
      return;
    }

    if (v.carrure === 'machine') {
      p(8, cy - 6, 24, 11, a);                    // la caisse
      p(10, cy - 4, 20, 4, b);
      p(12, cy - 12, 8, 7, a);                    // le mat
      p(13, cy - 11, 6, 3, d);                    // le capteur
      p(20, cy - 14, 12, 3, b);                   // le panneau solaire
      for (i = 0; i < 3; i++) {                   // les roues
        p(9 + i * 8, cy + 5, 7, 7, d);
        p(11 + i * 8, cy + 7, 3, 3, a);
      }
      oeil(p, 14, cy - 10, d);
      return;
    }

    // Repli : une bestiole simple.
    ovale(p, cx, cy, 11, 7, a);
    ovale(p, cx, cy + 2, 8, 4, b);
    oeil(p, 14, cy - 2);
  }

  // ==========================================================
  //  Le dessin des curiosites
  // ==========================================================

  function dessinerCuriosite(p, q) {
    var a = q.c[0], b = q.c[1], d = q.c[2];
    var i, j;

    if (q.forme === 'falaise') {
      for (i = 0; i < 34; i++) {
        var h = Math.round(6 + 16 * Math.min(1, i / 12));
        p(3 + i, 28 - h, 1, h, i < 12 ? a : b);
      }
      p(3, 26, 34, 3, d);
      for (i = 0; i < 5; i++) p(16 + i * 4, 10 + (i % 3) * 3, 3, 1, d);
      return;
    }

    if (q.forme === 'tour') {
      for (i = 0; i < 22; i++) {
        p(16 + Math.round(i * 0.22), 28 - i, 9 - Math.round(i * 0.2), 1, i % 4 ? a : b);
      }
      p(19, 4, 7, 3, d);
      p(6, 27, 28, 3, b);
      return;
    }

    if (q.forme === 'cratere') {
      for (i = -14; i <= 14; i++) {
        var prof = Math.round(8 * Math.cos(i / 14 * 1.57));
        p(20 + i, 20, 1, prof, a);
      }
      for (i = -16; i <= 16; i++) p(20 + i, 19 - Math.round(Math.abs(i) / 5), 1, 2, b);
      p(16, 22, 9, 4, d);
      for (i = 0; i < 4; i++) p(14 + i * 4, 10 - i % 2 * 3, 2, 3, d);
      return;
    }

    if (q.forme === 'visage') {
      for (i = 0; i < 24; i++) {
        for (j = 0; j < 20; j++) {
          var dx = (i - 12) / 12, dy = (j - 10) / 11;
          if (dx * dx + dy * dy > 1) continue;
          p(8 + i, 7 + j, 1, 1, (i + j) % 7 ? a : b);
        }
      }
      p(13, 14, 4, 3, d); p(23, 14, 4, 3, d);
      p(18, 18, 3, 4, d);
      p(15, 24, 10, 2, d);
      return;
    }

    if (q.forme === 'oeil') {
      for (i = 0; i < 5; i++) {
        ovale(p, 20, 16, 17 - i * 3, 11 - i * 2, i % 2 ? b : a);
      }
      ovale(p, 20, 16, 5, 3, d);
      return;
    }

    if (q.forme === 'hexagone') {
      var R = 13;
      for (var k = 0; k < 6; k++) {
        var a1 = k * Math.PI / 3, a2 = (k + 1) * Math.PI / 3;
        var x1 = 20 + Math.cos(a1) * R, y1 = 16 + Math.sin(a1) * R * 0.8;
        var x2 = 20 + Math.cos(a2) * R, y2 = 16 + Math.sin(a2) * R * 0.8;
        for (i = 0; i <= 20; i++) {
          p(Math.round(x1 + (x2 - x1) * i / 20),
            Math.round(y1 + (y2 - y1) * i / 20), 2, 2, b);
        }
      }
      ovale(p, 20, 16, 6, 5, a);
      ovale(p, 20, 16, 3, 2, d);
      return;
    }

    if (q.forme === 'ciel') {
      p(0, 0, L, 16, a);
      for (i = 0; i < 9; i++) p(2 + i * 4, 3 + (i % 3) * 3, 2, 2, d);
      // Le disque, couche sur le flanc.
      ovale(p, 20, 20, 10, 9, b);
      for (i = 0; i < 18; i++) p(10 + i, 20 + Math.round((i - 9) * 0.1), 1, 1, a);
      p(2, 27, 36, 4, a);
      return;
    }

    if (q.forme === 'tache') {
      ovale(p, 20, 16, 15, 10, b);
      ovale(p, 20, 16, 11, 7, a);
      ovale(p, 18, 15, 6, 4, d);
      for (i = 0; i < 5; i++) p(4 + i * 8, 26 + (i % 2) * 2, 6, 1, b);
      return;
    }

    ovale(p, 20, 16, 13, 9, a);
    ovale(p, 20, 16, 8, 5, b);
  }

  // ==========================================================
  //  La feuille
  // ==========================================================

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
    var v = parId(id);
    if (!v) return null;
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = H;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;
    var poser = function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    };
    if (v.forme) dessinerCuriosite(poser, v);
    else dessinerVie(poser, v);
    cerner(x);
    cache[id] = { canvas: cv, L: L, H: H };
    return cache[id];
  }

  function url(id) {
    var f = feuille(id);
    return f ? f.canvas.toDataURL('image/png') : '';
  }

  window.ODYVIE = {
    ASTRES: ASTRES, VIES: VIES, CURIOSITES: CURIOSITES,
    astre: astre, vies: vies, curiosite: curiosite, parId: parId,
    scannables: scannables, tout: tout,
    feuille: feuille, url: url, L: L, H: H,
    vider: function () { cache = {}; }
  };
})();
