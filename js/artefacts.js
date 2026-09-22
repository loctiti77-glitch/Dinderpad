// Les artefacts : quarante reliques de l'histoire des Dinders, cachees
// dans les trois mini-jeux. Une categorie a part dans les Items : on ne
// les utilise pas, on les collectionne.
//
// Trois facons d'en trouver :
//   - cache  : un eclat qui scintille quelque part sur une carte ; on
//              marche dessus pour le ramasser ;
//   - exploit: une condition remplie (une victoire, un gardien abattu,
//              un requin geant) ;
//   - ligne  : au bout de la ligne, parfois, a la peche.
//
// Tout est peint a la volee, comme le reste des sprites du DinderPad.
(function () {
  var DP = window.DP, M = window.MONDE;
  if (!DP) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================
  //  Les quarante artefacts
  // ==========================================================
  // jeu : 'founder' | 'peche' | 'odyssee' ; ou : 'cache', 'exploit' ou
  // 'ligne' ; carte : pour une cache de l'Odyssee, le monde ; dinder :
  // l'identifiant du Dinder auquel l'objet se rattache.

  var JEUX = {
    founder: 'The Founder War',
    peche: 'Fish n’Der',
    odyssee: 'The Odyssey of Dinder'
  };

  var LISTE = [
    // ---------- The Founder War : la foret et l'arene ----------
    { id: 'monocle-islas', nom: 'Monocle du Dr. Islas', jeu: 'founder', ou: 'cache',
      dinder: 'dr-islas-human-form', forme: 'monocle', c: ['#c8a040', '#f4e0a0', '#6a5018', '#bfe8ff'],
      indice: 'Perdu quelque part dans la forêt.',
      texte: 'Il ne le quittait jamais, du temps où il était encore sain de corps et d’esprit. Le verre est fêlé depuis l’expérience.' },
    { id: 'carnet-islas', nom: 'Carnet du docteur', jeu: 'founder', ou: 'cache',
      dinder: 'dr-islas-human-form', forme: 'livre', c: ['#6a3a2a', '#f0e6d0', '#3a2014', '#c8a040'],
      indice: 'Oublié sous un arbre de la forêt.',
      texte: 'Des équations, des croquis d’épaule, et une page arrachée : celle du trou de ver.' },
    { id: 'bocal-cerveau', nom: 'Bocal de Demicos', jeu: 'founder', ou: 'cache',
      dinder: 'dr-islas-demicos-form', forme: 'fiole', c: ['#e88aa8', '#d8f4ff', '#8a3a58', '#ffd0dc'],
      indice: 'Il flotte encore, caché dans les bois.',
      texte: 'Le bocal de transport qui a servi le jour de la greffe. Il reste un fond de liquide rosé.' },
    { id: 'jeton-sinars', nom: 'Jeton de Carl Sinars', jeu: 'founder', ou: 'cache',
      dinder: 'carl-sinars-cardinal-sin', forme: 'piece', c: ['#b02a3a', '#ff7a8a', '#5a0a14', '#ffe36a'],
      indice: 'Tombé d’une poche, entre deux buissons.',
      texte: 'Un jeton du casino où Carl a tout perdu, la nuit où le docteur est venu le chercher.' },
    { id: 'eclat-couronne', nom: 'Éclat de couronne', jeu: 'founder', ou: 'cache',
      dinder: 'gart-kervelor-king-of-karsovia', forme: 'fragment', c: ['#d8a820', '#fff0a0', '#7a5a08', '#ff4ad8'],
      indice: 'Il brille au fond des bois.',
      texte: 'Un morceau d’or ouvragé, tombé de la couronne de Karsovie pendant une bataille oubliée.' },
    { id: 'as-du-peche', nom: 'As du Péché', jeu: 'founder', ou: 'exploit',
      dinder: 'carl-sinars-cardinal-sin', forme: 'carte', c: ['#1a1a2a', '#f4f0e6', '#8a1a2a', '#e8283a'],
      indice: 'Vaincre Le Fondateur une première fois.',
      texte: 'La carte qui a donné à Carl ses pouvoirs. Elle revient toujours dans sa main, quoi qu’il fasse.' },
    { id: 'blouse-islas', nom: 'Blouse déchirée', jeu: 'founder', ou: 'exploit',
      dinder: 'dr-islas-human-form', forme: 'tissu', c: ['#f0f0f0', '#ffffff', '#a8b0b8', '#7cf0c8'],
      indice: 'Vaincre Le Fondateur avec le Dr. Islas dans l’équipe.',
      texte: 'Sa blouse de laboratoire, brûlée au bas. Le badge porte encore son nom et un grade effacé.' },
    { id: 'orbe-v', nom: 'Orbe de V', jeu: 'founder', ou: 'exploit',
      dinder: 'v', forme: 'orbe', c: ['#7a2ac8', '#d8a8ff', '#2a0a5a', '#ffffff'],
      indice: 'Vaincre Le Fondateur sans perdre un seul Dinder.',
      texte: 'L’un des trois orbes. V le protégeait ; il ne dit pas de quoi. Il pulse au rythme d’un cœur lent.' },
    { id: 'sceau-fondateur', nom: 'Sceau du Fondateur', jeu: 'founder', ou: 'exploit',
      dinder: 'multinder', forme: 'medaillon', c: ['#8a1a1a', '#ff6a5a', '#3a0606', '#ffd84a'],
      indice: 'Vaincre Le Fondateur en moins d’une minute.',
      texte: 'Le sceau qu’il portait au cou. Multinder y a reconnu la marque des cinq éléments, retournée.' },
    { id: 'sceptre-karsovie', nom: 'Sceptre de Karsovie', jeu: 'founder', ou: 'exploit',
      dinder: 'gart-kervelor-king-of-karsovia', forme: 'sceptre', c: ['#c8a040', '#fff0a0', '#6a5018', '#e8283a'],
      indice: 'Vaincre Le Fondateur cinq fois.',
      texte: 'Gart Kervelor l’a confié à celui qui battrait Le Fondateur cinq fois. Il n’y croyait pas.' },

    // ---------- Fish n'Der : le bois, les lacs et leurs geants ----------
    { id: 'fiole-acide', nom: 'Fiole d’acide', jeu: 'peche', ou: 'cache',
      dinder: 'he-melt', forme: 'fiole', c: ['#5ae83a', '#e0ffd0', '#1a6a0a', '#d8ffb0'],
      indice: 'Quelque part au bord des lacs.',
      texte: 'De l’acide nécrophylactique, celui de la cuve. Une goutte a suffi à faire de Calder Veyne ce qu’il est.' },
    { id: 'gant-veinburner', nom: 'Gant de Veinburner', jeu: 'peche', ou: 'cache',
      dinder: 'calder-veyne-veinburner', forme: 'gant', c: ['#3a3a44', '#6a6a78', '#1a1a20', '#ff7a1e'],
      indice: 'Caché dans le bois des pêcheurs.',
      texte: 'Un gant ignifugé de la maison des Altérés. Les doigts sont fondus de l’intérieur.' },
    { id: 'dent-grincrusher', nom: 'Dent de Grincrusher', jeu: 'peche', ou: 'cache',
      dinder: 'edgar-marks-grincrusher', forme: 'dent', c: ['#f4efe0', '#ffffff', '#b8b0a0', '#8a2a1a'],
      indice: 'Enfouie près de l’eau.',
      texte: 'Une molaire d’acier. Edgar en perd une à chaque combat ; elle repousse la nuit, plus dure.' },
    { id: 'plaque-alteres', nom: 'Plaque des Altérés', jeu: 'peche', ou: 'cache',
      dinder: 'edgar-marks-grincrusher', forme: 'plaque', c: ['#6a7a88', '#b8c8d4', '#2a3440', '#e8283a'],
      indice: 'Rouillée, quelque part sur la carte.',
      texte: 'La plaque d’entrée de la maison des Altérés. Calder et Edgar sont passés devant, enfants.' },
    { id: 'coquillage-eau', nom: 'Coquillage de l’Eau', jeu: 'peche', ou: 'cache',
      dinder: 'multinder', forme: 'coquillage', c: ['#4ab0e8', '#d8f4ff', '#1a5a8a', '#ffffff'],
      indice: 'Échoué sur une berge.',
      texte: 'Le premier des cinq éléments de Multinder : l’Eau. On y entend la mer, même au milieu d’un lac.' },
    { id: 'goutte-metamorphe', nom: 'Goutte métamorphe', jeu: 'peche', ou: 'cache',
      dinder: 'he-melt', forme: 'goutte', c: ['#8a5ac8', '#d8c0ff', '#3a1a6a', '#7cf0c8'],
      indice: 'Elle rampe quelque part sur la carte.',
      texte: 'Un morceau de He Melt, détaché et bien vivant. Il prend la forme de ce qu’on regarde.' },
    { id: 'de-pipe', nom: 'Dé pipé', jeu: 'peche', ou: 'ligne',
      dinder: 'carl-sinars-cardinal-sin', forme: 'de', c: ['#f4f0e6', '#ffffff', '#a8a090', '#b02a3a'],
      indice: 'Parfois, au bout de la ligne.',
      texte: 'Il tombe toujours sur six. Carl l’a jeté à l’eau le jour où il a promis d’arrêter.' },
    { id: 'bouteille-message', nom: 'Bouteille à la mer', jeu: 'peche', ou: 'ligne',
      dinder: 'dr-islas-demicos-form', forme: 'bouteille', c: ['#3a8a5a', '#a8f0c8', '#0a3a1a', '#f4e6c0'],
      indice: 'Parfois, au bout de la ligne.',
      texte: 'Un message du docteur, écrit après la greffe : « Si quelqu’un trouve ceci, ne me cherchez pas. »' },
    { id: 'anneau-karsovie', nom: 'Anneau royal', jeu: 'peche', ou: 'ligne',
      dinder: 'gart-kervelor-king-of-karsovia', forme: 'bague', c: ['#d8a820', '#fff0a0', '#7a5a08', '#4ab0e8'],
      indice: 'Parfois, au bout de la ligne.',
      texte: 'L’anneau de mariage de Gart Kervelor, tombé d’un pont. Il en a fait refaire un, moins beau.' },
    { id: 'orbe-a', nom: 'Orbe de A', jeu: 'peche', ou: 'ligne',
      dinder: 'a', forme: 'orbe', c: ['#1a6ac8', '#a8d8ff', '#0a1a5a', '#ffffff'],
      indice: 'Parfois, au bout de la ligne.',
      texte: 'Le deuxième orbe. A l’avait caché au fond d’un lac, là où personne ne pense à regarder.' },
    { id: 'collier-crocs', nom: 'Collier à crocs', jeu: 'peche', ou: 'exploit',
      dinder: 'edgar-marks-grincrusher', forme: 'collier', c: ['#6a4a2a', '#f4efe0', '#3a2414', '#e8283a'],
      indice: 'Dans le ventre d’un Grand Blanc.',
      texte: 'Le collier qu’Edgar portait en arrivant chez les Altérés. Un requin l’avait avalé, lui.' },
    { id: 'medaillon-veyne', nom: 'Médaillon des Veyne', jeu: 'peche', ou: 'exploit',
      dinder: 'calder-veyne-veinburner', forme: 'medaillon', c: ['#a8a8b8', '#f0f0f8', '#4a4a5a', '#ff7a1e'],
      indice: 'Dans le ventre d’un Mégalodon.',
      texte: 'Dedans, une photo de famille. Calder Veyne enfant, avant qu’on l’arrache à son foyer.' },

    // ---------- The Odyssey : une cache par monde ----------
    { id: 'pierre-feu', nom: 'Pierre du Feu', jeu: 'odyssee', ou: 'cache', carte: 'mercure',
      dinder: 'multinder', forme: 'cristal', c: ['#e8481e', '#ffb07a', '#7a1a08', '#ffe36a'],
      indice: 'Cachée sur Mercure.',
      texte: 'Le deuxième élément de Multinder : le Feu. Elle ne refroidit jamais, même au creux de la main.' },
    { id: 'lentille-islas', nom: 'Lentille du télescope', jeu: 'odyssee', ou: 'cache', carte: 'venus',
      dinder: 'dr-islas-human-form', forme: 'lentille', c: ['#8a8a98', '#d8d8e8', '#3a3a48', '#9fd8ff'],
      indice: 'Cachée sur Vénus.',
      texte: 'La lentille du télescope avec lequel le docteur a vu le trou de ver pour la première fois.' },
    { id: 'graine-terre', nom: 'Graine de la Terre', jeu: 'odyssee', ou: 'cache', carte: 'terre',
      dinder: 'multinder', forme: 'graine', c: ['#8a5a2a', '#d8a870', '#3a2410', '#5aa03e'],
      indice: 'Cachée sur Terre.',
      texte: 'Le troisième élément de Multinder : la Terre. Plantée, elle ferait pousser une forêt en une nuit.' },
    { id: 'fanion-islas', nom: 'Fanion de l’expédition', jeu: 'odyssee', ou: 'cache', carte: 'lune',
      dinder: 'dr-islas-demicos-form', forme: 'drapeau', c: ['#2a68c4', '#7ab0ff', '#0a2a5a', '#ffffff'],
      indice: 'Caché sur la Lune.',
      texte: 'Le fanion planté par la première expédition du docteur. La base a été construite autour.' },
    { id: 'rouage-demicos', nom: 'Rouage de l’épaule', jeu: 'odyssee', ou: 'cache', carte: 'mars',
      dinder: 'dr-islas-demicos-form', forme: 'engrenage', c: ['#8a8a92', '#d0d0d8', '#3a3a42', '#e88aa8'],
      indice: 'Caché sur Mars.',
      texte: 'Une pièce du mécanisme qui tient le cerveau du docteur sur son épaule. Il en a toujours une de rechange.' },
    { id: 'plume-air', nom: 'Plume de l’Air', jeu: 'odyssee', ou: 'cache', carte: 'jupiter',
      dinder: 'multinder', forme: 'plume', c: ['#e8f0f8', '#ffffff', '#8aa0b8', '#7cf0c8'],
      indice: 'Cachée sur Jupiter.',
      texte: 'Le quatrième élément de Multinder : l’Air. Lâchée, elle ne tombe pas ; elle monte.' },
    { id: 'carte-cosmique', nom: 'Carte cosmique', jeu: 'odyssee', ou: 'cache', carte: 'saturne',
      dinder: 'carl-sinars-cardinal-sin', forme: 'carte', c: ['#2a1a5a', '#e8e0ff', '#0a0620', '#ffd84a'],
      indice: 'Cachée sur Saturne.',
      texte: 'Une carte à jouer dont les motifs sont des constellations. Carl jure qu’elle n’était pas à lui.' },
    { id: 'eclat-vortex', nom: 'Éclat du trou de ver', jeu: 'odyssee', ou: 'cache', carte: 'uranus',
      dinder: 'dr-islas-final-form', forme: 'cristal', c: ['#2ad8e8', '#d0ffff', '#0a4a5a', '#ffffff'],
      indice: 'Caché sur Uranus.',
      texte: 'Un morceau du passage entre le système solaire et le système stellaire, figé comme du verre.' },
    { id: 'orbe-h', nom: 'Orbe de H', jeu: 'odyssee', ou: 'cache', carte: 'neptune',
      dinder: 'h', forme: 'orbe', c: ['#1ac88a', '#a8ffd8', '#0a4a2a', '#ffffff'],
      indice: 'Caché sur Neptune.',
      texte: 'Le troisième orbe, le plus lointain. Réunis, les trois orbes feraient quelque chose. Mais quoi ?' },

    // ---------- The Odyssey : ce que laissent les gardiens ----------
    { id: 'masque-fondu', nom: 'Masque fondu', jeu: 'odyssee', ou: 'exploit', gardien: 'salamandre-zinc',
      dinder: 'calder-veyne-veinburner', forme: 'masque', c: ['#8a8580', '#c8c0b8', '#3a3430', '#ff7a1e'],
      indice: 'Laissé par la Salamandre de Zinc.',
      texte: 'Le masque de protection de Veinburner, fondu et reforgé par le métal de la Salamandre.' },
    { id: 'eclat-cuve', nom: 'Éclat de la cuve', jeu: 'odyssee', ou: 'exploit', gardien: 'reine-soufree',
      dinder: 'he-melt', forme: 'fragment', c: ['#5ae83a', '#d8ffb0', '#1a6a0a', '#ffffff'],
      indice: 'Laissé par la Reine Soufrée.',
      texte: 'Un morceau de la cuve d’acide où He Melt est né. On se demande comment il est arrivé sur Vénus.' },
    { id: 'boussole-islas', nom: 'Boussole du docteur', jeu: 'odyssee', ou: 'exploit', gardien: 'colosse-verger',
      dinder: 'dr-islas-human-form', forme: 'boussole', c: ['#c8a040', '#f4f0e6', '#6a5018', '#e8283a'],
      indice: 'Laissée par le Colosse du Verger.',
      texte: 'Elle n’indique pas le nord : elle indique le trou de ver. Le docteur l’avait enterrée dans le jardin.' },
    { id: 'casque-islas', nom: 'Casque spatial', jeu: 'odyssee', ou: 'exploit', gardien: 'selenophage',
      dinder: 'dr-islas-demicos-form', forme: 'casque', c: ['#e8e8f0', '#ffffff', '#8a8a98', '#3a6ac8'],
      indice: 'Laissé par le Sélénophage.',
      texte: 'Le casque de la première expédition. Il a une bosse sur le côté, pour l’épaule.' },
    { id: 'poing-acier', nom: 'Poing d’acier', jeu: 'odyssee', ou: 'exploit', gardien: 'behemoth-rouille',
      dinder: 'edgar-marks-grincrusher', forme: 'poing', c: ['#8a8a92', '#d0d0d8', '#3a3a42', '#e8283a'],
      indice: 'Laissé par le Béhémoth de Rouille.',
      texte: 'Le premier poing d’acier d’Edgar, avant qu’il n’apprenne à broyer à mains nues.' },
    { id: 'sablier-temporel', nom: 'Sablier temporel', jeu: 'odyssee', ou: 'exploit', gardien: 'oeil-tempete',
      dinder: 'v', forme: 'sablier', c: ['#c8a040', '#ffe7a0', '#6a5018', '#ff4ad8'],
      indice: 'Laissé par l’Œil de la Tempête.',
      texte: 'Le sable y remonte. Les protecteurs d’orbe s’en servent pour compter le temps qu’il leur reste.' },
    { id: 'couronne-kervelor', nom: 'Couronne de Karsovie', jeu: 'odyssee', ou: 'exploit', gardien: 'roi-anneaux',
      dinder: 'gart-kervelor-king-of-karsovia', forme: 'couronne', c: ['#d8a820', '#fff0a0', '#7a5a08', '#ff4ad8'],
      indice: 'Laissée par le Roi des Anneaux.',
      texte: 'La vraie couronne de Gart Kervelor. Le Roi des Anneaux l’avait prise pour une lune.' },
    { id: 'coeur-ether', nom: 'Cœur de l’Éther', jeu: 'odyssee', ou: 'exploit', gardien: 'titan-glace',
      dinder: 'multinder', forme: 'cristal', c: ['#e8e8ff', '#ffffff', '#8a8ac8', '#c86aff'],
      indice: 'Laissé par le Titan de Glace.',
      texte: 'Le cinquième élément de Multinder, celui qu’il n’avait jamais retrouvé. Il tient les quatre autres ensemble.' },
    { id: 'singularite-islas', nom: 'Singularité du docteur', jeu: 'odyssee', ou: 'exploit', gardien: 'leviathan-abysses',
      dinder: 'dr-islas-final-form', forme: 'orbe', c: ['#1a0a2a', '#c86aff', '#050008', '#ffffff'],
      indice: 'Laissée par le Léviathan des Abysses.',
      texte: 'Ce qu’il reste de l’instant où le docteur a fusionné avec le trou de ver. Elle regarde en arrière.' }
  ];

  var PAR_ID = {};
  LISTE.forEach(function (a) { PAR_ID[a.id] = a; });

  // ==========================================================
  //  Le dessin : trente formes de 24 x 24
  // ==========================================================

  var TA = 24;

  function peintre(x) {
    function p(px, py, w, h, col) { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), w, h); }
    function disque(cx, cy, r, col) {
      for (var yy = -r; yy <= r; yy++) {
        var w = Math.round(Math.sqrt(Math.max(0, r * r - yy * yy)));
        p(cx - w, cy + yy, w * 2 + 1, 1, col);
      }
    }
    function anneau(cx, cy, r1, r2, col) {
      for (var yy = -r1; yy <= r1; yy++) {
        for (var xx = -r1; xx <= r1; xx++) {
          var d = Math.sqrt(xx * xx + yy * yy);
          if (d <= r1 + 0.3 && d >= r2 - 0.3) p(cx + xx, cy + yy, 1, 1, col);
        }
      }
    }
    function ligne(x0, y0, x1, y1, e, col) {
      var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (var i = 0; i <= n; i++) p(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, e, e, col);
    }
    return { p: p, disque: disque, anneau: anneau, ligne: ligne };
  }

  var FORMES = {
    monocle: function (d, c) {
      d.anneau(10, 10, 7, 5, c[0]); d.disque(10, 10, 4, c[3]); d.p(7, 7, 2, 2, '#ffffff');
      d.anneau(10, 10, 6, 6, c[1]);
      for (var i = 0; i < 6; i++) d.p(15 + i, 15 + i, 1, 1, i % 2 ? c[1] : c[0]);
    },
    livre: function (d, c) {
      d.p(5, 4, 14, 17, c[0]); d.p(5, 4, 3, 17, c[2]); d.p(8, 5, 10, 15, c[1]);
      for (var i = 0; i < 5; i++) d.p(10, 8 + i * 2, 6, 1, c[2]);
      d.p(17, 11, 2, 3, c[3]);
    },
    fiole: function (d, c) {
      d.p(10, 2, 4, 2, '#8a5a2a'); d.p(10, 4, 4, 4, c[1]);
      d.disque(12, 15, 7, c[1]); d.disque(12, 16, 6, c[0]); d.p(8, 11, 2, 4, '#ffffff'); d.p(14, 14, 2, 2, c[3]);
    },
    piece: function (d, c) {
      d.disque(12, 12, 9, c[2]); d.disque(12, 12, 8, c[0]); d.disque(12, 12, 6, c[1]);
      d.p(11, 8, 2, 8, c[2]); d.p(9, 10, 6, 2, c[2]); d.p(8, 6, 2, 2, c[3]);
    },
    couronne: function (d, c) {
      d.p(4, 14, 16, 6, c[0]); d.p(4, 14, 16, 2, c[1]);
      [4, 10, 16].forEach(function (x, k) {
        for (var i = 0; i < 6; i++) d.p(x + Math.floor(i / 3), 13 - i - (k === 1 ? 2 : 0), 4 - Math.floor(i / 2), 1, c[0]);
      });
      d.disque(6, 17, 1, c[3]); d.disque(12, 17, 1, c[3]); d.disque(18, 17, 1, c[3]);
      d.disque(12, 4, 1, c[3]);
    },
    carte: function (d, c) {
      d.p(6, 3, 12, 18, c[1]); d.p(6, 3, 12, 1, c[0]); d.p(6, 20, 12, 1, c[0]);
      d.p(6, 3, 1, 18, c[0]); d.p(17, 3, 1, 18, c[0]);
      d.disque(11, 11, 2, c[3]); d.disque(13, 11, 2, c[3]); d.p(10, 8, 4, 2, c[3]); d.p(11, 7, 2, 1, c[3]);
      d.p(11, 13, 2, 3, c[3]); d.p(8, 5, 2, 2, c[2]); d.p(14, 17, 2, 2, c[2]);
    },
    tissu: function (d, c) {
      d.p(5, 4, 14, 15, c[0]); d.p(10, 4, 4, 7, c[2]); d.p(11, 4, 2, 5, c[1]);
      for (var i = 0; i < 7; i++) d.p(5 + i * 2, 19 + (i % 2) * 2, 2, 2 - (i % 2), c[0]);
      d.p(14, 12, 4, 3, c[2]); d.p(6, 8, 3, 1, c[3]); d.p(12, 16, 3, 2, '#6a4a2a');
    },
    orbe: function (d, c) {
      d.disque(12, 12, 9, c[2]); d.disque(12, 12, 8, c[0]); d.disque(11, 11, 5, c[1]);
      d.disque(12, 12, 3, c[0]); d.p(8, 7, 3, 2, c[3]); d.p(7, 9, 2, 1, c[3]);
    },
    medaillon: function (d, c) {
      d.ligne(6, 2, 12, 8, 1, c[1]); d.ligne(18, 2, 12, 8, 1, c[1]);
      d.disque(12, 15, 7, c[2]); d.disque(12, 15, 6, c[0]); d.disque(12, 15, 4, c[1]); d.disque(12, 15, 2, c[3]);
    },
    sceptre: function (d, c) {
      d.ligne(5, 20, 16, 9, 2, c[0]); d.ligne(6, 20, 17, 9, 1, c[1]);
      d.p(12, 11, 6, 2, c[2]); d.disque(18, 6, 3, c[3]); d.p(17, 4, 2, 1, '#ffffff'); d.p(4, 20, 3, 2, c[2]);
    },
    gant: function (d, c) {
      d.p(6, 9, 11, 10, c[0]);
      [[6, 4, 6], [9, 3, 7], [12, 3, 7], [15, 5, 5]].forEach(function (f) { d.p(f[0], f[1], 2, f[2], c[0]); d.p(f[0], f[1], 2, 1, c[3]); });
      d.p(17, 11, 3, 4, c[0]); d.p(6, 18, 11, 3, c[2]); d.p(7, 10, 2, 6, c[1]);
    },
    dent: function (d, c) {
      d.p(8, 3, 8, 4, c[2]);
      for (var y = 5; y < 21; y++) { var w = Math.max(1, Math.round(10 - (y - 5) * 0.6)); d.p(12 - w / 2, y, w, 1, y < 7 ? c[1] : c[0]); }
      d.p(9, 7, 2, 6, c[1]); d.p(13, 3, 2, 2, c[3]);
    },
    plaque: function (d, c) {
      d.p(3, 7, 18, 11, c[2]); d.p(4, 8, 16, 9, c[0]);
      d.p(5, 9, 1, 1, c[1]); d.p(18, 9, 1, 1, c[1]); d.p(5, 15, 1, 1, c[1]); d.p(18, 15, 1, 1, c[1]);
      d.p(7, 10, 10, 1, c[2]); d.p(7, 12, 8, 1, c[2]); d.p(7, 14, 6, 1, c[3]);
    },
    coquillage: function (d, c) {
      for (var y = 0; y < 12; y++) { var w = Math.round(Math.sqrt(144 - (11 - y) * (11 - y)) * 0.8); d.p(12 - w, 6 + y, w * 2, 1, c[0]); }
      for (var i = -3; i <= 3; i++) d.ligne(12, 18, 12 + i * 3, 7, 1, c[i % 2 ? 1 : 2]);
      d.p(9, 18, 6, 3, c[2]);
    },
    goutte: function (d, c) {
      for (var y = 3; y < 12; y++) { var w = Math.round((y - 3) * 0.7); d.p(12 - w, y, w * 2 + 1, 1, c[0]); }
      d.disque(12, 15, 6, c[0]); d.disque(11, 14, 3, c[1]); d.p(9, 12, 2, 2, '#ffffff'); d.p(14, 17, 2, 2, c[3]);
    },
    de: function (d, c) {
      d.p(5, 5, 14, 14, c[2]); d.p(5, 5, 13, 13, c[0]);
      [[8, 8], [14, 8], [11, 11], [8, 14], [14, 14]].forEach(function (q) { d.p(q[0], q[1], 2, 2, c[3]); });
    },
    bouteille: function (d, c) {
      d.p(10, 2, 4, 2, '#8a5a2a'); d.p(10, 4, 4, 5, c[0]); d.p(7, 9, 10, 12, c[0]);
      d.p(9, 11, 6, 7, c[3]); d.p(10, 13, 4, 1, '#8a6a40'); d.p(10, 15, 3, 1, '#8a6a40'); d.p(8, 10, 1, 8, c[1]);
    },
    bague: function (d, c) {
      d.anneau(12, 15, 7, 5, c[0]); d.anneau(12, 15, 7, 7, c[2]); d.p(7, 12, 1, 3, c[1]);
      d.disque(12, 6, 3, c[3]); d.p(11, 4, 1, 1, '#ffffff'); d.p(10, 8, 4, 2, c[0]);
    },
    collier: function (d, c) {
      for (var i = 0; i <= 16; i++) { var a = Math.PI * i / 16; d.p(12 - Math.cos(a) * 9, 5 + Math.sin(a) * 8, 1, 1, c[0]); }
      [5, 8, 12, 16, 19].forEach(function (x, k) {
        var y = 5 + Math.sin(Math.PI * (x - 3) / 18) * 8;
        for (var j = 0; j < 5; j++) d.p(x - Math.max(0, 1 - j / 3), y + j, Math.max(1, 3 - j), 1, k === 2 ? c[3] : c[1]);
      });
    },
    cristal: function (d, c) {
      for (var y = 2; y < 22; y++) {
        var w = y < 7 ? (y - 2) + 1 : y > 17 ? (22 - y) : 6;
        d.p(12 - w, y, w * 2, 1, c[0]);
        d.p(12 - w, y, Math.max(1, Math.floor(w * 0.6)), 1, c[1]);
      }
      d.p(12, 4, 1, 16, c[2]); d.p(9, 8, 1, 3, '#ffffff');
    },
    lentille: function (d, c) {
      d.anneau(12, 12, 9, 7, c[0]); d.anneau(12, 12, 9, 9, c[2]); d.disque(12, 12, 6, c[3]);
      d.p(8, 8, 3, 2, '#ffffff'); d.p(8, 10, 1, 2, '#ffffff');
    },
    graine: function (d, c) {
      d.disque(12, 15, 6, c[0]); d.disque(11, 14, 3, c[1]); d.p(12, 5, 1, 5, c[3]);
      d.p(13, 5, 4, 2, c[3]); d.p(8, 7, 4, 2, c[3]); d.p(14, 18, 2, 1, c[2]);
    },
    drapeau: function (d, c) {
      d.p(6, 3, 2, 19, '#a8a8b0'); d.p(5, 21, 4, 2, '#6a6a70');
      d.p(8, 4, 12, 9, c[0]); d.p(8, 4, 12, 2, c[1]); d.disque(14, 8, 2, c[3]); d.p(18, 12, 2, 1, c[2]);
    },
    engrenage: function (d, c) {
      for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; d.p(12 + Math.cos(a) * 8 - 1, 12 + Math.sin(a) * 8 - 1, 3, 3, c[0]); }
      d.disque(12, 12, 7, c[0]); d.disque(12, 12, 5, c[1]); d.disque(12, 12, 3, c[2]); d.p(11, 11, 2, 2, c[3]);
    },
    plume: function (d, c) {
      for (var i = 0; i < 14; i++) {
        var x = 6 + i, y = 19 - i;
        d.p(x - 3, y - 1, 3, 2, i % 3 ? c[0] : c[1]); d.p(x + 1, y + 1, 3, 2, i % 3 ? c[0] : c[1]);
      }
      d.ligne(4, 21, 19, 5, 1, c[2]); d.p(3, 21, 2, 2, c[3]);
    },
    masque: function (d, c) {
      d.disque(12, 11, 8, c[0]); d.disque(12, 9, 6, c[1]);
      d.p(7, 9, 4, 3, '#1a0a0a'); d.p(13, 9, 4, 3, '#1a0a0a'); d.p(8, 10, 2, 1, c[3]); d.p(14, 10, 2, 1, c[3]);
      [6, 10, 15, 17].forEach(function (x, k) { d.p(x, 17, 2, 3 + k % 2 * 2, c[0]); });
      d.p(10, 15, 4, 1, c[2]);
    },
    fragment: function (d, c) {
      var rangs = [[11, 2], [9, 5], [8, 7], [7, 9], [7, 10], [8, 10], [9, 9], [10, 7], [11, 5], [12, 3]];
      rangs.forEach(function (r, i) { d.p(r[0] - 1, 4 + i * 2, r[1] + 2, 2, c[0]); d.p(r[0], 4 + i * 2, Math.max(1, r[1] / 3), 2, c[1]); });
      d.p(13, 9, 2, 6, c[2]); d.p(9, 8, 1, 1, c[3]);
    },
    boussole: function (d, c) {
      d.disque(12, 12, 9, c[2]); d.disque(12, 12, 8, c[0]); d.disque(12, 12, 6, c[1]);
      d.ligne(12, 6, 12, 12, 2, c[3]); d.ligne(12, 12, 12, 17, 2, c[2]); d.p(11, 11, 3, 3, c[0]);
      d.p(11, 2, 2, 2, c[0]);
    },
    casque: function (d, c) {
      d.disque(12, 12, 9, c[2]); d.disque(12, 12, 8, c[0]); d.p(6, 8, 12, 7, c[3]); d.p(7, 9, 3, 2, '#ffffff');
      d.p(4, 19, 16, 3, c[2]); d.p(17, 2, 1, 5, c[2]); d.disque(17, 2, 1, '#e8283a');
    },
    poing: function (d, c) {
      d.p(5, 8, 13, 11, c[0]); d.p(5, 8, 13, 2, c[1]);
      for (var i = 0; i < 4; i++) d.p(6 + i * 3, 10, 1, 4, c[2]);
      d.p(3, 12, 4, 5, c[0]); d.p(7, 19, 9, 3, c[2]); d.p(8, 6, 2, 2, c[3]); d.p(14, 6, 2, 2, c[3]);
    },
    sablier: function (d, c) {
      d.p(5, 2, 14, 2, c[0]); d.p(5, 20, 14, 2, c[0]); d.p(5, 4, 1, 16, c[2]); d.p(18, 4, 1, 16, c[2]);
      for (var y = 0; y < 8; y++) { var w = 6 - Math.floor(y * 0.7); d.p(12 - w, 4 + y, w * 2, 1, c[1]); d.p(12 - w, 19 - y, w * 2, 1, c[1]); }
      for (y = 0; y < 3; y++) d.p(10 + y, 16 + y - 2, 4 - y * 2 > 0 ? 4 - y * 2 : 1, 1, c[3]);
      d.p(9, 17, 6, 2, c[3]); d.p(11, 11, 2, 2, c[3]);
    }
  };

  function cerner(x) {
    var img = x.getImageData(0, 0, TA, TA), d = img.data, plein = new Uint8Array(TA * TA), i;
    for (i = 0; i < TA * TA; i++) plein[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (var y = 0; y < TA; y++) {
      for (var xx = 0; xx < TA; xx++) {
        i = y * TA + xx;
        if (plein[i]) continue;
        var v = false;
        for (var k = 0; k < 4; k++) {
          var nx = xx + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
          if (nx >= 0 && ny >= 0 && nx < TA && ny < TA && plein[ny * TA + nx]) { v = true; break; }
        }
        if (v) { d[i * 4] = 14; d[i * 4 + 1] = 12; d[i * 4 + 2] = 20; d[i * 4 + 3] = 255; }
      }
    }
    x.putImageData(img, 0, 0);
  }

  var cache = {};

  function feuille(id) {
    if (cache[id]) return cache[id];
    var a = PAR_ID[id];
    if (!a) return null;
    var cv = document.createElement('canvas');
    cv.width = TA; cv.height = TA;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;
    (FORMES[a.forme] || FORMES.orbe)(peintre(x), a.c);
    cerner(x);
    cache[id] = cv;
    return cv;
  }

  function url(id) {
    var f = feuille(id);
    return f ? f.toDataURL('image/png') : '';
  }

  // ==========================================================
  //  Trouver
  // ==========================================================

  function trouves() { return DP.artefacts().filter(function (id) { return !!PAR_ID[id]; }); }
  function aTrouve(id) { return DP.aArtefact(id); }

  var file = [], enCours = false;

  // Trouver un artefact : il rejoint les Items, et une carte s'affiche.
  function trouver(id) {
    var a = PAR_ID[id];
    if (!a || !DP.noterArtefact(id)) return false;
    file.push(a);
    if (!enCours) suivant();
    return true;
  }

  // La carte « Artefact trouvé » : l'objet arrive en tournant dans un
  // eclat de rayons, puis tout s'efface. Plusieurs trouvailles d'affilee
  // passent l'une apres l'autre.
  function suivant() {
    var a = file.shift();
    if (!a) { enCours = false; return; }
    enCours = true;
    var pad = document.querySelector('.pad');
    if (!pad) { enCours = false; return; }
    var carte = el('div', 'art-trouve');
    carte.appendChild(el('div', 'art-trouve-rayons'));
    carte.appendChild(el('span', 'art-trouve-titre', 'Artefact trouvé'));
    var im = el('img', 'art-trouve-img');
    im.src = url(a.id);
    im.alt = '';
    carte.appendChild(im);
    carte.appendChild(el('strong', 'art-trouve-nom', a.nom));
    var d = DP.byId && DP.byId(a.dinder);
    carte.appendChild(el('span', 'art-trouve-dinder', d ? 'Lié à ' + d.name + (d.form ? ' · ' + d.form : '') : ''));
    carte.appendChild(el('span', 'art-trouve-compte', trouves().length + ' / ' + LISTE.length + ' artefacts'));
    pad.appendChild(carte);
    setTimeout(function () { carte.classList.add('is-sortie'); }, reduit ? 1800 : 3000);
    setTimeout(function () { carte.remove(); suivant(); }, reduit ? 1900 : 3500);
  }

  // ==========================================================
  //  Les caches sur les cartes
  // ==========================================================

  // Les cases qu'on atteint a pied depuis le depart.
  function accessibles(g, dx, dy) {
    var vu = {}, pile = [[dx, dy]], H = g.length, W = g[0].length;
    while (pile.length) {
      var c = pile.pop(), x = c[0], y = c[1], k = x + ',' + y;
      if (x < 0 || y < 0 || x >= W || y >= H || vu[k] || M.BLOQUANT[g[y][x]]) continue;
      vu[k] = true;
      pile.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return vu;
  }

  // Choisit n cases pour y cacher des artefacts : accessibles, entourees
  // de cases libres, loin du depart, loin les unes des autres et des
  // points a eviter. Toujours les memes pour une meme carte.
  function placer(g, depart, n, graine, eviter, exclure) {
    var vu = accessibles(g, depart.x, depart.y);
    var cand = [];
    Object.keys(vu).forEach(function (k) {
      var q = k.split(','), x = +q[0], y = +q[1], libres = 0;
      for (var j = 0; j < 4; j++) if (vu[(x + [1, -1, 0, 0][j]) + ',' + (y + [0, 0, 1, -1][j])]) libres++;
      if (libres < 3) return;
      if (Math.abs(x - depart.x) + Math.abs(y - depart.y) < 9) return;
      if (exclure && exclure(x, y)) return;
      cand.push({ x: x, y: y, r: M.bruit(x, y, graine) });
    });
    cand.sort(function (a, b) { return a.r - b.r; });
    var pris = [];
    (eviter || []).forEach(function (e) { if (e) pris.push({ x: e.x, y: e.y, loin: e.loin || 5 }); });
    var out = [];
    for (var i = 0; i < cand.length && out.length < n; i++) {
      var c = cand[i], ok = true;
      for (var k = 0; k < pris.length; k++) {
        if (Math.abs(c.x - pris[k].x) + Math.abs(c.y - pris[k].y) < (pris[k].loin || 9)) { ok = false; break; }
      }
      if (!ok) continue;
      out.push({ x: c.x, y: c.y });
      pris.push({ x: c.x, y: c.y, loin: 9 });
    }
    return out;
  }

  // Les caches d'un jeu (ou d'un monde de l'Odyssee) sur sa carte : les
  // artefacts deja trouves n'y sont plus.
  function caches(jeu, g, depart, opts) {
    opts = opts || {};
    var liste = LISTE.filter(function (a) {
      return a.jeu === jeu && a.ou === 'cache' && (!opts.carte || a.carte === opts.carte);
    });
    var places = placer(g, depart, liste.length, opts.graine || 77, opts.eviter, opts.exclure);
    return liste.map(function (a, i) {
      var q = places[i];
      if (!q) return null;
      return { a: a, tx: q.x, ty: q.y, x: (q.x + 0.5) * M.TS, y: (q.y + 0.5) * M.TS };
    }).filter(function (c) { return c && !aTrouve(c.a.id); });
  }

  // L'eclat qui signale une cache : discret de loin, franc de pres.
  function eclat(ctx, sx, sy, t, proche) {
    var ph = reduit ? 0.5 : (Math.sin(t / 260) + 1) / 2;
    var a = proche ? 0.55 + 0.45 * ph : 0.25 + 0.35 * ph;
    ctx.fillStyle = 'rgba(255,220,90,' + (a * 0.5).toFixed(2) + ')';
    ctx.beginPath(); ctx.ellipse(sx, sy + 2, proche ? 14 : 8, proche ? 6 : 3, 0, 0, 6.3); ctx.fill();
    var r = proche ? 6 + ph * 3 : 3;
    ctx.fillStyle = 'rgba(255,240,170,' + a.toFixed(2) + ')';
    ctx.fillRect(Math.round(sx - r / 2), Math.round(sy - 4 - r / 2), 1, 1);
    ctx.fillRect(Math.round(sx + r / 2), Math.round(sy - 4 + r / 2), 1, 1);
    ctx.fillStyle = 'rgba(255,250,220,' + a.toFixed(2) + ')';
    ctx.fillRect(Math.round(sx - r), Math.round(sy - 4), r * 2 + 1, 1);
    ctx.fillRect(Math.round(sx), Math.round(sy - 4 - r), 1, r * 2 + 1);
    ctx.fillRect(Math.round(sx - 1), Math.round(sy - 5), 3, 3);
  }

  // Ce qu'un jeu pousse dans les extras de sa carte, et ce qu'il verifie
  // a chaque image : une cache a moins de 20 px est ramassee.
  function extras(liste, chef, t) {
    return liste.map(function (c) {
      return {
        x: c.x, y: c.y,
        dessin: function (ctx, sx, sy) {
          var proche = chef && Math.hypot(chef.x - c.x, chef.y - c.y) < 90;
          eclat(ctx, sx, sy, t, proche);
        }
      };
    });
  }

  function ramasser(liste, chef) {
    if (!chef) return null;
    for (var i = liste.length - 1; i >= 0; i--) {
      var c = liste[i];
      if (Math.hypot(chef.x - c.x, chef.y - c.y) < 20) {
        liste.splice(i, 1);
        trouver(c.a.id);
        return c.a;
      }
    }
    return null;
  }

  // ==========================================================
  //  Les exploits
  // ==========================================================

  // Les gardiens de l'Odyssee et les requins geants laissent le leur :
  // on ecoute les fonctions du profil qui enregistrent ces victoires.
  function ecouter(nom, apres) {
    var orig = DP[nom];
    if (typeof orig !== 'function') return;
    DP[nom] = function () {
      var r = orig.apply(this, arguments);
      try { apres.apply(null, arguments); } catch (e) {}
      return r;
    };
  }

  ecouter('compterExploit', function (cle) {
    var B = window.BOSS;
    if (!B) return;
    LISTE.forEach(function (a) {
      if (a.gardien && B.GARDIENS[a.gardien] && B.exploitDe(B.GARDIENS[a.gardien]) === cle) trouver(a.id);
    });
  });

  ecouter('noterRequin', function (id) {
    if (id === 'blanc') trouver('collier-crocs');
    if (id === 'megalodon') trouver('medaillon-veyne');
  });

  // Au bout de la ligne : une chance sur vingt-cinq par prise, parmi les
  // artefacts de la peche qui restent a trouver.
  var CHANCE_LIGNE = 25;
  ecouter('noterPrise', function () {
    if (Math.floor(Math.random() * CHANCE_LIGNE) !== 0) return;
    var reste = LISTE.filter(function (a) { return a.ou === 'ligne' && !aTrouve(a.id); });
    if (reste.length) trouver(reste[Math.floor(Math.random() * reste.length)].id);
  });

  // The Founder War : le jeu signale sa victoire avec ce qu'il sait.
  function victoireFondateur(info) {
    info = info || {};
    var n = DP.exploit('fondateurVaincu');
    if (n >= 1) trouver('as-du-peche');
    if ((info.equipe || []).some(function (id) { return /^dr-islas/.test(id); })) trouver('blouse-islas');
    if (info.ko === 0) trouver('orbe-v');
    if (info.chrono && info.chrono < 60) trouver('sceau-fondateur');
    if (n >= 5) trouver('sceptre-karsovie');
  }

  // ==========================================================
  //  La page des artefacts
  // ==========================================================

  function onglets(view, actif) {
    var barre = el('div', 'it-onglets');
    [['items', 'Objets'], ['artefacts', 'Artefacts  ' + trouves().length + ' / ' + LISTE.length]].forEach(function (o) {
      var a = el('a', 'it-onglet' + (o[0] === actif ? ' is-actif' : ''), o[1]);
      a.href = '#' + o[0];
      barre.appendChild(a);
    });
    view.appendChild(barre);
  }

  function viewArtefacts(view) {
    view.classList.add('view--items');
    onglets(view, 'artefacts');
    var box = el('div', 'art');
    var n = trouves().length;
    var tete = el('div', 'art-tete');
    tete.appendChild(el('p', 'art-intro',
      'Des reliques de l’histoire des Dinders, cachées dans les trois mini-jeux.'));
    var jauge = el('div', 'art-jauge');
    var plein = el('div', 'art-jauge-plein');
    plein.style.width = (n / LISTE.length * 100).toFixed(1) + '%';
    jauge.appendChild(plein);
    tete.appendChild(jauge);
    box.appendChild(tete);

    var grille = el('div', 'art-grille');
    Object.keys(JEUX).forEach(function (jeu) {
      var liste = LISTE.filter(function (a) { return a.jeu === jeu; });
      var eu = liste.filter(function (a) { return aTrouve(a.id); }).length;
      var sec = el('div', 'art-section');
      sec.appendChild(el('p', 'art-jeu', JEUX[jeu] + '  ·  ' + eu + ' / ' + liste.length));
      var cases = el('div', 'art-cases');
      liste.forEach(function (a) {
        var ok = aTrouve(a.id);
        var c = el('button', 'art-case' + (ok ? '' : ' is-vide'));
        c.type = 'button';
        c.dataset.artefact = a.id;
        var im = el('img', 'art-case-img');
        im.src = url(a.id);
        im.alt = '';
        c.appendChild(im);
        c.appendChild(el('span', 'art-case-nom', ok ? a.nom : '???'));
        c.title = ok ? a.nom : a.indice;
        c.addEventListener('click', function () { fiche(box, a); });
        cases.appendChild(c);
      });
      sec.appendChild(cases);
      grille.appendChild(sec);
    });
    box.appendChild(grille);
    view.appendChild(box);
  }

  function fiche(box, a) {
    var old = box.querySelector('.art-fiche');
    if (old) old.remove();
    var ok = aTrouve(a.id);
    var f = el('div', 'art-fiche' + (ok ? '' : ' is-vide'));
    var carte = el('div', 'art-fiche-carte');
    var im = el('img', 'art-fiche-img');
    im.src = url(a.id);
    im.alt = '';
    carte.appendChild(im);
    carte.appendChild(el('strong', 'art-fiche-nom', ok ? a.nom : 'Artefact inconnu'));
    var d = DP.byId && DP.byId(a.dinder);
    if (ok && d) carte.appendChild(el('span', 'art-fiche-dinder', 'Lié à ' + d.name + (d.form ? ' · ' + d.form : '')));
    carte.appendChild(el('p', 'art-fiche-txt', ok ? a.texte : 'Tu ne l’as pas encore trouvé.'));
    carte.appendChild(el('p', 'art-fiche-ou', JEUX[a.jeu] + '  ·  ' + a.indice));
    var fermer = el('button', 'art-fiche-fermer', 'Fermer');
    fermer.type = 'button';
    fermer.addEventListener('click', function () { f.remove(); });
    f.addEventListener('click', function (e) { if (e.target === f) f.remove(); });
    carte.appendChild(fermer);
    f.appendChild(carte);
    box.appendChild(f);
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS['artefacts'] = { title: 'Artefacts', render: viewArtefacts };

  window.ARTEFACTS = {
    LISTE: LISTE, JEUX: JEUX, parId: function (id) { return PAR_ID[id] || null; },
    feuille: feuille, url: url, trouves: trouves, aTrouve: aTrouve, trouver: trouver,
    placer: placer, caches: caches, extras: extras, ramasser: ramasser, eclat: eclat,
    victoireFondateur: victoireFondateur, onglets: onglets, CHANCE_LIGNE: CHANCE_LIGNE
  };
})();
