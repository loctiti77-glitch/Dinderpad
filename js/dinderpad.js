// Donnees et etat partages du DinderPad.
// Ce fichier est charge par toutes les pages qui touchent aux credits, a la
// collection ou aux profils. Il expose un seul objet global : window.DP.
(function () {

  // ---------- Les quatre monnaies ----------
  // "units" = la valeur d'une carte, telle qu'affichee sur la page Credits.
  // "label" prend le pas sur "units" a l'affichage, pour les cartes qui ne
  // se comptent pas en unites.
  var CREDITS = {
    green: { name: 'Crédit Universel',   units: 3,        img: 'green.webp' },
    blue:  { name: 'Crédit Multiversel', units: 5,        img: 'blue.webp'  },
    gold:  { name: 'Crédit Omniversel',  units: 10,       img: 'gold.webp'  },
    pink:  { name: 'Crédit Temporel',    units: Infinity, img: 'pink.webp',
             label: '∞ unités : 1 UTILISATION' }
  };

  var ORDER = ['green', 'blue', 'gold', 'pink'];

  // Les raretes portent les memes noms que les monnaies, du plus commun
  // au plus rare. Les Dindises par rarete s'appuieront la-dessus.
  var RARITIES = ['Universel', 'Multiversel', 'Omniversel', 'Temporel'];

  // Threat se tient a part : aucune Dindise ne la vend, aucune monnaie ne
  // lui correspond. On ne l'obtient qu'au bout d'une histoire. Elle n'est
  // donc pas dans RARITIES, que les Dindises parcourent.
  var MENACE = 'Threat';

  // Chaque rarete emprunte la couleur de la monnaie du meme nom : un
  // Dinder Universel s'affiche en vert, comme le credit Universel.
  // Threat, elle, n'a pas de monnaie : elle prend le violet du vide.
  var RARITY_KEY = {
    'Universel':   'green',
    'Multiversel': 'blue',
    'Omniversel':  'gold',
    'Temporel':    'pink',
    'Threat':      'threat'
  };

  function rarityKey(r) { return RARITY_KEY[r] || 'green'; }

  // Une rarete qu'aucune Dindise ne peut rendre.
  function horsDindise(r) { return r === MENACE; }

  // ---------- Les Dindises ----------
  // Une Dindise par rarete. Elle se paie avec la monnaie du meme nom et ne
  // peut rendre qu'un Dinder de cette rarete : un Dinder Temporel ne sort
  // que d'une Dindise Temporelle.
  var PRICE = { green: 10, blue: 6, gold: 3, pink: 1 };

  var DINDISES = [
    { id: 'universel',   rarete: 'Universel',   credit: 'green',
      nom: 'Dindise Universelle',   img: 'assets/dindises/universel.webp' },
    { id: 'multiversel', rarete: 'Multiversel', credit: 'blue',
      nom: 'Dindise Multiverselle', img: 'assets/dindises/multiversel.webp' },
    { id: 'omniversel',  rarete: 'Omniversel',  credit: 'gold',
      nom: 'Dindise Omniverselle',  img: 'assets/dindises/omniversel.webp' },
    { id: 'temporel',    rarete: 'Temporel',    credit: 'pink',
      nom: 'Dindise Temporelle',    img: 'assets/dindises/temporel.webp' }
  ];

  // Les credits infinis sont un reglage du profil (Parametres) : tant
  // qu'il est actif, les achats ne retirent aucun credit. Par defaut, on
  // y est.
  function illimite() { return me().illimite !== false; }

  // ---------- Le roster ----------
  // L'ordre fixe la place de chaque Dinder dans la collection : le premier
  // occupe toujours la case 01, meme s'il est obtenu en dernier.
  //
  // Trois details voulus, a ne pas "corriger" :
  //   - "SSt-03" s'ecrit bien avec un t, ce n'est pas une coquille de "SS-03" ;
  //   - "???" n'est pas un univers manquant : V, A et H n'en ont pas ;
  //   - He Melt "de son vrai nom Calder Veyne" : les deux entrees designent
  //     bien la meme personne avant et apres la cuve d'acide, ce n'est pas
  //     un doublon a fusionner.
  //
  // Les descriptions sont de l'auteur : on n'y touche pas sans son accord.
  var DINDERS = [
    { id: 'dr-islas-human-form',               name: 'Dr.Islas',      form: 'Human form',       rarity: 'Universel',    universe: 'SS-03',  desc: 'Un scientifique reconnu aux quatre coins du monde, sain de corps et d’esprit.' },
    { id: 'dr-islas-demicos-form',             name: 'Dr.Islas',      form: 'Demicos form',     rarity: 'Universel',    universe: 'SS-03',  desc: 'Après une expérience ayant mal tourné, le docteur dut transplanter son cerveau sur son épaule car l’intérieur de son crâne nécrosait.' },
    { id: 'dr-islas-final-form',               name: 'Dr.Islas',      form: 'Final Form',       rarity: 'Temporel',     universe: 'SS-03',  desc: 'Après avoir créé un trou de ver entre le système solaire et stellaire, le docteur fusionna avec ce dernier et devint l’être cosmique le plus puissant de l’univers.' },
    { id: 'dr-islas-singularity',              name: 'Dr.Islas',      form: 'Singularity',      rarity: 'Temporel',     universe: 'SS-03',  desc: '' },
    // Juste en dessous de la Singularity : c'est de sa case que part la
    // piste vers la fusion, tant qu'on ne l'a pas.
    { id: 'dr-islas-the-founder',              name: 'Dr.Islas the Founder', form: '',            rarity: 'Threat',       universe: '???',    horsTirage: true, desc: '' },
    { id: 'calder-veyne-veinburner',           name: 'Calder Veyne',  form: 'Veinburner',       rarity: 'Universel',    universe: 'SS-03',  desc: 'Calder Veyne, enfant, fut arraché de son foyer pour vivre en maison d’Altérés, où il subit d’atroces expériences jusqu’à devenir Veinburner.' },
    { id: 'carl-sinars-cardinal-sin',          name: 'Carl Sinars',   form: 'Cardinal Sin',     rarity: 'Universel',    universe: 'SS-03',  desc: 'Carl Sinars, un adulte addict aux jeux d’argent, rejoint la quête du Dr. Islas, lui ayant donné accès aux pouvoirs des cartes.' },
    { id: 'edgar-marks-grincrusher',           name: 'Edgar Marks',   form: 'Grincrusher',      rarity: 'Universel',    universe: 'SS-03',  desc: 'Edgar Marks, enfant, fut arraché de son foyer pour vivre en maison d’Altérés, où il subit d’atroces expériences jusqu’à devenir Grincrusher.' },
    { id: 'he-melt',                           name: 'He Melt',       form: '',                 rarity: 'Multiversel',  universe: 'SSt-03', desc: 'He Melt, de son vrai nom Calder Veyne, fut trahi par son patron, qui le poussa dans une cuve d’acide nécrophylactique, qui le transforma en cette visqueuse masse métamorphe.' },
    { id: 'v',                                 name: 'V',             form: '',                 rarity: 'Temporel',     universe: '???',    desc: 'Protecteur d’orbe.' },
    { id: 'a',                                 name: 'A',             form: '',                 rarity: 'Temporel',     universe: '???',    desc: 'Protecteur d’orbe.' },
    { id: 'h',                                 name: 'H',             form: '',                 rarity: 'Temporel',     universe: '???',    desc: 'Protecteur d’orbe.' },
    { id: 'multinder',                         name: 'Multinder',     form: '',                 rarity: 'Universel',    universe: 'SS-03',  desc: 'Multinder est le gardien des 5 éléments fondamentaux de la planète Terre.' },
    { id: 'gart-kervelor-king-of-karsovia',    name: 'Gart Kervelor', form: 'King of Karsovia', rarity: 'Multiversel',  universe: 'SSt-03', desc: 'Gart Kervelor est le monarque du royaume de Karsovie.' },
    // Les cinq derniers arrives. Leur description reste a ecrire : elle
    // est de l'auteur, on ne la remplit pas a sa place.
    { id: 'harry-hargrove',                    name: 'Harry Hargrove', form: '',                rarity: 'Universel',    universe: '???',    desc: '' },
    { id: 'marlon-coach',                      name: 'Marlon Coach',  form: '',                 rarity: 'Universel',    universe: '???',    desc: '' },
    { id: 'baron-zofiax',                      name: 'Baron Zofiax',  form: '',                 rarity: 'Multiversel',  universe: '???',    desc: '' },
    { id: 'timeo-traveler',                    name: 'Timeo Traveler', form: '',                rarity: 'Omniversel',   universe: '???',    desc: '' },
    { id: 'william-batant',                    name: 'William Batant', form: '',                rarity: 'Omniversel',   universe: '???',    desc: '' },
    // Il ne s'obtient pas dans une Dindise : il faut le battre au bout de
    // The Founder War, a l'Effondrement Terminal.
    { id: 'lefondateur',                       name: 'Le Fondateur',  form: '',                   rarity: 'Temporel',     universe: '???',    horsTirage: true, desc: 'Celui qui voulait remettre de l’ordre dans l’omnivers : un seul monde de chaque, à sa place, pour toujours. Vaincu, il suit désormais celui qui l’a battu.' }
  ];

  // ---------- Les items ----------
  // "acquis" dit a quelle condition l'item apparait dans l'inventaire.
  // Le DinderTracker est fourni avec l'appareil ; la canne se ramasse sur
  // la carte du mini-jeu de peche.
  var ITEMS = [
    { id: 'dindertracker', name: 'DinderTracker',
      sub: 'Traceur de signaux',
      // Les jours de faille, l'inventaire le dit avant meme qu'on ouvre.
      detail: function () {
        var f = faille();
        if (!f.active) return 'Traceur de signaux';
        return etatFaille(f.cle).contenue ? 'Faille contenue ✓' : '⚠ Faille de sécurité en cours';
      },
      img: 'assets/items/dindertracker.webp',
      view: 'tracker', acquis: function () { return true; } },
    { id: 'canne', name: 'Canne à Pêche',
      sub: 'Ramassée au bord de l’eau',
      img: 'assets/items/canne.webp',
      // L'inventaire montre la canne reellement montee, pas l'objet
      // generique : c'est le materiel du joueur qu'on lui presente. Les
      // deux fonctions sont relues a chaque affichage, et retombent sur
      // l'image d'origine tant que la Poissonnerie n'est pas chargee.
      visuel: function () {
        var M = window.MATERIEL;
        return (M && M.equipee('canne').img) || 'assets/items/canne.webp';
      },
      detail: function () {
        var M = window.MATERIEL;
        return M ? M.equipee('canne').nom : 'Ramassée au bord de l’eau';
      },
      view: 'peche-hub', acquis: function () { return aLaCanne(); } },
    { id: 'arme', name: 'Pistolet Lumithique',
      sub: 'Trouvé au creux d’une souche',
      img: null,
      // Le pistolet n'a pas de fichier : il est peint a la volee, dans le
      // revetement monte et au niveau atteint.
      visuel: function () { return window.ARME ? window.ARME.url() : null; },
      detail: function () {
        return window.ARME ? window.ARME.niveau().nom : 'Arme lumithique';
      },
      view: 'armurerie', acquis: function () { return aLArme(); } },
    { id: 'teleportail', name: 'Téléportail',
      sub: 'Tombé du ciel',
      // L'image du joueur si elle est la ; sinon celle que le jeu peint.
      // La bascule se fait a l'affichage, sans toucher au code.
      img: 'assets/items/teleportail.webp',
      visuel: function () {
        return window.ODYSSEE ? window.ODYSSEE.visuel() : 'assets/items/teleportail.webp';
      },
      detail: function () {
        var n = window.ODYSSEE ? window.ODYSSEE.compteAstres() : 0;
        return n ? n + (n > 1 ? ' mondes visités' : ' monde visité')
                 : 'Aucune destination connue';
      },
      view: 'teleportail', acquis: function () { return aLaTelecommande(); } }
  ];

  // Ce que le joueur possede vraiment, dans l'ordre du catalogue.
  function items() {
    return ITEMS.filter(function (it) { return it.acquis(); });
  }

  // ---------- Les continents du DinderTracker ----------
  // Douze lieux par continent. Le tracker en designe un par heure et
  // donne son heure locale. Chaque lieu a ete verifie : il tombe bien
  // sur une terre dessinee de la carte.
  var CONTINENTS = [
    { id: "nord", nom: 'Am\u00e9rique du Nord', lieux: [
      { ville: 'New York', pays: 'Etats-Unis', tz: "America/New_York", lon: -74.006, lat: 40.713 },
      { ville: 'Mexico', pays: 'Mexique', tz: "America/Mexico_City", lon: -99.133, lat: 19.433 },
      { ville: 'Toronto', pays: 'Canada', tz: "America/Toronto", lon: -79.383, lat: 43.653 },
      { ville: 'Los Angeles', pays: 'Etats-Unis', tz: "America/Los_Angeles", lon: -118.243, lat: 34.052 },
      { ville: 'Chicago', pays: 'Etats-Unis', tz: "America/Chicago", lon: -87.63, lat: 41.878 },
      { ville: 'Vancouver', pays: 'Canada', tz: "America/Vancouver", lon: -123.121, lat: 49.283 },
      { ville: 'La Havane', pays: 'Cuba', tz: "America/Havana", lon: -82.383, lat: 23.133 },
      { ville: 'Panama', pays: 'Panama', tz: "America/Panama", lon: -79.517, lat: 8.983 },
      { ville: 'Denver', pays: 'Etats-Unis', tz: "America/Denver", lon: -104.99, lat: 39.739 },
      { ville: 'Guatemala', pays: 'Guatemala', tz: "America/Guatemala", lon: -90.513, lat: 14.634 },
      { ville: 'Anchorage', pays: 'Etats-Unis', tz: "America/Anchorage", lon: -149.9, lat: 61.218 },
      { ville: 'Montreal', pays: 'Canada', tz: "America/Toronto", lon: -73.567, lat: 45.501 }
    ] },
    { id: "sud", nom: 'Am\u00e9rique du Sud', lieux: [
      { ville: 'Sao Paulo', pays: 'Bresil', tz: "America/Sao_Paulo", lon: -46.633, lat: -23.55 },
      { ville: 'Buenos Aires', pays: 'Argentine', tz: "America/Argentina/Buenos_Aires", lon: -58.382, lat: -34.604 },
      { ville: 'Lima', pays: 'Perou', tz: "America/Lima", lon: -77.043, lat: -12.046 },
      { ville: 'Bogota', pays: 'Colombie', tz: "America/Bogota", lon: -74.072, lat: 4.711 },
      { ville: 'Santiago', pays: 'Chili', tz: "America/Santiago", lon: -70.669, lat: -33.449 },
      { ville: 'Caracas', pays: 'Venezuela', tz: "America/Caracas", lon: -66.904, lat: 10.481 },
      { ville: 'Quito', pays: 'Equateur', tz: "America/Guayaquil", lon: -78.467, lat: -0.18 },
      { ville: 'La Paz', pays: 'Bolivie', tz: "America/La_Paz", lon: -68.15, lat: -16.5 },
      { ville: 'Montevideo', pays: 'Uruguay', tz: "America/Montevideo", lon: -56.165, lat: -34.902 },
      { ville: 'Asuncion', pays: 'Paraguay', tz: "America/Asuncion", lon: -57.575, lat: -25.264 },
      { ville: 'Manaus', pays: 'Bresil', tz: "America/Manaus", lon: -60.025, lat: -3.117 },
      { ville: 'Brasilia', pays: 'Bresil', tz: "America/Sao_Paulo", lon: -47.883, lat: -15.794 }
    ] },
    { id: "europe", nom: 'Europe', lieux: [
      { ville: 'Paris', pays: 'France', tz: "Europe/Paris", lon: 2.352, lat: 48.857 },
      { ville: 'Londres', pays: 'Royaume-Uni', tz: "Europe/London", lon: -0.128, lat: 51.507 },
      { ville: 'Berlin', pays: 'Allemagne', tz: "Europe/Berlin", lon: 13.405, lat: 52.52 },
      { ville: 'Madrid', pays: 'Espagne', tz: "Europe/Madrid", lon: -3.703, lat: 40.417 },
      { ville: 'Rome', pays: 'Italie', tz: "Europe/Rome", lon: 12.496, lat: 41.903 },
      { ville: 'Athenes', pays: 'Grece', tz: "Europe/Athens", lon: 23.728, lat: 37.984 },
      { ville: 'Stockholm', pays: 'Suede', tz: "Europe/Stockholm", lon: 18.069, lat: 59.329 },
      { ville: 'Varsovie', pays: 'Pologne', tz: "Europe/Warsaw", lon: 21.012, lat: 52.23 },
      { ville: 'Lisbonne', pays: 'Portugal', tz: "Europe/Lisbon", lon: -9.139, lat: 38.722 },
      { ville: 'Moscou', pays: 'Russie', tz: "Europe/Moscow", lon: 37.618, lat: 55.756 },
      { ville: 'Kiev', pays: 'Ukraine', tz: "Europe/Kyiv", lon: 30.524, lat: 50.45 },
      { ville: 'Istanbul', pays: 'Turquie', tz: "Europe/Istanbul", lon: 28.979, lat: 41.008 }
    ] },
    { id: "afrique", nom: 'Afrique', lieux: [
      { ville: 'Le Caire', pays: 'Egypte', tz: "Africa/Cairo", lon: 31.235, lat: 30.044 },
      { ville: 'Lagos', pays: 'Nigeria', tz: "Africa/Lagos", lon: 3.379, lat: 6.524 },
      { ville: 'Nairobi', pays: 'Kenya', tz: "Africa/Nairobi", lon: 36.817, lat: -1.286 },
      { ville: 'Casablanca', pays: 'Maroc', tz: "Africa/Casablanca", lon: -7.589, lat: 33.573 },
      { ville: 'Addis-Abeba', pays: 'Ethiopie', tz: "Africa/Addis_Ababa", lon: 38.746, lat: 9.005 },
      { ville: 'Dakar', pays: 'Senegal', tz: "Africa/Dakar", lon: -17.467, lat: 14.693 },
      { ville: 'Accra', pays: 'Ghana', tz: "Africa/Accra", lon: -0.187, lat: 5.603 },
      { ville: 'Kinshasa', pays: 'Congo (RDC)', tz: "Africa/Kinshasa", lon: 15.266, lat: -4.325 },
      { ville: 'Tripoli', pays: 'Libye', tz: "Africa/Tripoli", lon: 13.191, lat: 32.887 },
      { ville: 'Khartoum', pays: 'Soudan', tz: "Africa/Khartoum", lon: 32.56, lat: 15.5 },
      { ville: 'Johannesburg', pays: 'Afrique du Sud', tz: "Africa/Johannesburg", lon: 28.035, lat: -26.195 },
      { ville: 'Luanda', pays: 'Angola', tz: "Africa/Luanda", lon: 13.234, lat: -8.838 }
    ] },
    { id: "asie", nom: 'Asie', lieux: [
      { ville: 'Tokyo', pays: 'Japon', tz: "Asia/Tokyo", lon: 139.692, lat: 35.69 },
      { ville: 'Pekin', pays: 'Chine', tz: "Asia/Shanghai", lon: 116.407, lat: 39.904 },
      { ville: 'New Delhi', pays: 'Inde', tz: "Asia/Kolkata", lon: 77.209, lat: 28.614 },
      { ville: 'Seoul', pays: 'Coree du Sud', tz: "Asia/Seoul", lon: 126.978, lat: 37.567 },
      { ville: 'Bangkok', pays: 'Thailande', tz: "Asia/Bangkok", lon: 100.502, lat: 13.756 },
      { ville: 'Singapour', pays: 'Singapour', tz: "Asia/Singapore", lon: 103.82, lat: 1.352 },
      { ville: 'Dubai', pays: 'Emirats arabes unis', tz: "Asia/Dubai", lon: 55.271, lat: 25.205 },
      { ville: 'Jakarta', pays: 'Indonesie', tz: "Asia/Jakarta", lon: 106.845, lat: -6.208 },
      { ville: 'Manille', pays: 'Philippines', tz: "Asia/Manila", lon: 120.984, lat: 14.599 },
      { ville: 'Oulan-Bator', pays: 'Mongolie', tz: "Asia/Ulaanbaatar", lon: 106.918, lat: 47.886 },
      { ville: 'Katmandou', pays: 'Nepal', tz: "Asia/Kathmandu", lon: 85.324, lat: 27.717 },
      { ville: 'Iakoutsk', pays: 'Russie', tz: "Asia/Yakutsk", lon: 129.733, lat: 62.028 }
    ] },
    { id: "australie", nom: 'Australie', lieux: [
      { ville: 'Sydney', pays: 'Australie', tz: "Australia/Sydney", lon: 151.209, lat: -33.868 },
      { ville: 'Melbourne', pays: 'Australie', tz: "Australia/Melbourne", lon: 144.963, lat: -37.814 },
      { ville: 'Brisbane', pays: 'Australie', tz: "Australia/Brisbane", lon: 153.026, lat: -27.47 },
      { ville: 'Perth', pays: 'Australie', tz: "Australia/Perth", lon: 115.857, lat: -31.953 },
      { ville: 'Adelaide', pays: 'Australie', tz: "Australia/Adelaide", lon: 138.6, lat: -34.929 },
      { ville: 'Darwin', pays: 'Australie', tz: "Australia/Darwin", lon: 130.845, lat: -12.463 },
      { ville: 'Canberra', pays: 'Australie', tz: "Australia/Sydney", lon: 149.128, lat: -35.281 },
      { ville: 'Cairns', pays: 'Australie', tz: "Australia/Brisbane", lon: 145.77, lat: -16.92 },
      { ville: 'Alice Springs', pays: 'Australie', tz: "Australia/Darwin", lon: 133.881, lat: -23.698 },
      { ville: 'Broome', pays: 'Australie', tz: "Australia/Perth", lon: 122.236, lat: -17.955 },
      { ville: 'Townsville', pays: 'Australie', tz: "Australia/Brisbane", lon: 146.817, lat: -19.258 },
      { ville: 'Kalgoorlie', pays: 'Australie', tz: "Australia/Perth", lon: 121.466, lat: -30.749 }
    ] },
    { id: "arctique", nom: 'Arctique', lieux: [
      { ville: 'Longyearbyen', pays: 'Norvege', tz: "Arctic/Longyearbyen", lon: 15.633, lat: 78.217 },
      { ville: 'Nuuk', pays: 'Groenland', tz: "America/Nuuk", lon: -51.721, lat: 64.181 },
      { ville: 'Tromso', pays: 'Norvege', tz: "Europe/Oslo", lon: 18.956, lat: 69.649 },
      { ville: 'Mourmansk', pays: 'Russie', tz: "Europe/Moscow", lon: 33.083, lat: 68.97 },
      { ville: 'Iqaluit', pays: 'Canada', tz: "America/Iqaluit", lon: -68.517, lat: 63.749 },
      { ville: 'Utqiagvik', pays: 'Etats-Unis', tz: "America/Anchorage", lon: -156.789, lat: 71.29 },
      { ville: 'Norilsk', pays: 'Russie', tz: "Asia/Krasnoyarsk", lon: 88.203, lat: 69.35 },
      { ville: 'Rovaniemi', pays: 'Finlande', tz: "Europe/Helsinki", lon: 25.73, lat: 66.503 },
      { ville: 'Inuvik', pays: 'Canada', tz: "America/Inuvik", lon: -133.723, lat: 68.361 },
      { ville: 'Akureyri', pays: 'Islande', tz: "Atlantic/Reykjavik", lon: -18.09, lat: 65.683 },
      { ville: 'Yellowknife', pays: 'Canada', tz: "America/Yellowknife", lon: -114.371, lat: 62.454 },
      { ville: 'Anadyr', pays: 'Russie', tz: "Asia/Anadyr", lon: 177.508, lat: 64.733 }
    ] },
    { id: "antarctique", nom: 'Antarctique', lieux: [
      { ville: 'Base McMurdo', pays: 'Etats-Unis', tz: "Antarctica/McMurdo", lon: 166.668, lat: -77.846 },
      { ville: 'Base Vostok', pays: 'Russie', tz: "Antarctica/Vostok", lon: 106.833, lat: -78.464 },
      { ville: 'Base Rothera', pays: 'Royaume-Uni', tz: "Antarctica/Rothera", lon: -68.128, lat: -67.568 },
      { ville: 'Base Casey', pays: 'Australie', tz: "Antarctica/Casey", lon: 110.527, lat: -66.283 },
      { ville: 'Base Davis', pays: 'Australie', tz: "Antarctica/Davis", lon: 77.967, lat: -68.577 },
      { ville: 'Base Mawson', pays: 'Australie', tz: "Antarctica/Mawson", lon: 62.873, lat: -67.603 },
      { ville: 'Base Palmer', pays: 'Etats-Unis', tz: "Antarctica/Palmer", lon: -64.053, lat: -64.774 },
      { ville: 'Dumont d Urville', pays: 'France', tz: "Antarctica/DumontDUrville", lon: 140.001, lat: -66.663 },
      { ville: 'Base Syowa', pays: 'Japon', tz: "Antarctica/Syowa", lon: 39.59, lat: -69.006 },
      { ville: 'Base Troll', pays: 'Norvege', tz: "Antarctica/Troll", lon: 2.535, lat: -72.012 },
      { ville: 'Base Concordia', pays: 'France', tz: "Antarctica/DumontDUrville", lon: 123.35, lat: -75.1 },
      { ville: 'Base Esperanza', pays: 'Argentine', tz: "Antarctica/Palmer", lon: -56.997, lat: -63.398 }
    ] }
  ];

  // Le lieu designe change a chaque heure pleine, et reste le meme pour
  // tout le monde : il ne depend que de l'heure, pas du hasard.
  function spots(quand) {
    var h = Math.floor((quand || maintenant()) / 3600000);
    return CONTINENTS.map(function (c, k) {
      var n = c.lieux.length;
      var lieu = c.lieux[(((h + k * 5) % n) + n) % n];
      return {
        id: c.id, continent: c.nom,
        ville: lieu.ville, pays: lieu.pays, tz: lieu.tz,
        lon: lieu.lon, lat: lieu.lat,
        x: (lieu.lon + 180) / 360 * 100,
        y: (90 - lieu.lat) / 180 * 100
      };
    });
  }

  // Combien de millisecondes avant le prochain saut des balises.
  function prochainSaut(quand) {
    var t = quand || maintenant();
    return 3600000 - (t % 3600000);
  }

  // ---------- Les failles de securite ----------
  // Une par semaine, et elle dure toute une journee (heure locale). Son
  // jour avance d'un cran chaque semaine : lundi, puis mardi la semaine
  // suivante, puis mercredi... La semaine du lundi 1er janvier 2024 ouvre
  // le compte, avec une faille le lundi. Comme les balises, tout depend de
  // la date : le meme jour pour tout le monde.
  var decalage = 0;
  function maintenant() { return Date.now() + decalage; }
  // Pour les essais : avancer ou reculer l'horloge du pad.
  function decalerHorloge(ms) { decalage = ms || 0; }

  var JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  function numeroJour(d) {
    return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2024, 0, 1)) / 864e5);
  }

  // Une faille tous les huit jours : elle tombe donc un jour plus tard
  // chaque semaine, lundi puis mardi puis mercredi, sans jamais doubler.
  function jourDeFaille(n) { return (((n % 8) + 8) % 8) === 0; }

  function cleDuJour(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function faille(quand) {
    var d = new Date(quand || maintenant());
    var n = numeroJour(d);
    var active = jourDeFaille(n);
    var minuit = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var fin = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    // La prochaine : on avance jour par jour (au plus deux semaines).
    var k = 1;
    while (k < 9 && !jourDeFaille(n + k)) k++;
    var prochaine = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
    return {
      active: active,
      cle: cleDuJour(minuit),
      debut: minuit, fin: fin,
      reste: fin.getTime() - d.getTime(),
      jour: JOURS[(minuit.getDay() + 6) % 7],
      prochaine: prochaine,
      prochaineCle: cleDuJour(prochaine),
      prochainJour: JOURS[(prochaine.getDay() + 6) % 7]
    };
  }

  // Les balises purgees pendant une faille, et les failles contenues.
  function etatFaille(cle) {
    var f = me().failles[cle];
    return f ? { purges: f.purges.slice(), contenue: !!f.contenue } : { purges: [], contenue: false };
  }

  function purgerBalise(cle, id) {
    var p = me();
    var f = p.failles[cle] || (p.failles[cle] = { purges: [], contenue: false });
    if (f.purges.indexOf(id) === -1) f.purges.push(id);
    save();
    return f.purges.length;
  }

  function contenirFaille(cle) {
    var p = me();
    var f = p.failles[cle] || (p.failles[cle] = { purges: [], contenue: false });
    if (f.contenue) return false;
    f.contenue = true;
    save();
    return true;
  }

  function faillesContenues() {
    var f = me().failles, n = 0;
    for (var k in f) if (f[k] && f[k].contenue) n++;
    return n;
  }

  // L'heure locale d'un fuseau. Un moteur trop ancien peut refuser un
  // fuseau exotique : on le dit plutot que d'afficher une heure fausse.
  function heureLocale(tz, when) {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(when || new Date());
    } catch (e) { return '--:--:--'; }
  }

  function dateLocale(tz, when) {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        timeZone: tz, weekday: 'long', day: 'numeric', month: 'long'
      }).format(when || new Date());
    } catch (e) { return ''; }
  }

  var SLOTS   = 30;                  // le nombre de cases de la collection
  var KEY     = 'dinderpad.v2';      // la sauvegarde, profils compris
  var OLD_KEY = 'dinderpad.save.v1'; // l'ancienne sauvegarde, sans profils

  // ==========================================================
  //  Sauvegarde et profils
  //  Chaque profil porte sa propre progression. Le navigateur peut
  //  refuser d'ecrire (navigation privee, cookies bloques) : dans ce
  //  cas on garde tout en memoire, le temps de la session.
  // ==========================================================

  var db = null;

  function newProfile(name) {
    return {
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: name,
      created: Date.now(),
      credits: { green: 0, blue: 0, gold: 0, pink: 0 },
      illimite: true,
      creditsAvantInfini: null,
      dindiseOfferte: false,
      fusion: { sacrifice: false, victoires: 0, quetes: [], faite: false },
      owned: [],
      canne: false,
      peche: {},
      exploits: {},
      vus: [],
      cannes: [],
      flotteurs: [],
      hamecons: [],
      // Les leurres ne se montent pas : ils se consomment. On en garde le
      // compte, forme de requin par forme de requin.
      leurres: {},
      equip: { canne: 'base', flotteur: 'base', hamecon: 'base', leurre: '' },
      // Le Pistolet Lumithique et ce qui va avec : son niveau, les
      // Noyaux qui le font monter, ses revetements, et les requins
      // abattus.
      arme: false,
      armeNiveau: 1,
      armeNiveauOdyssee: 1,
      noyaux: 0,
      revetements: [],
      revetement: 'origine',
      requins: {},
      // L'Odyssee : la telecommande, les mondes ou l'on a pose le pied,
      // ce qu'on y a scanne, et le chapitre atteint.
      telecommande: false,
      chapitre: 0,
      astres: [],
      scans: {},
      abattus: {},
      // La monnaie de l'Odyssee : ce que laissent les creatures qu'on
      // abat. Elle fait monter le meme pistolet que les Noyaux de la
      // peche, mais on ne l'echange pas contre eux.
      roches: 0,
      // Le niveau du joueur : l'XP se deduit de la progression ; on ne
      // retient que les recompenses deja reclamees et le dernier niveau vu.
      niveauxReclames: [],
      niveauVu: 1,
      // Les artefacts trouves dans les mini-jeux, avec la date de la trouvaille.
      artefacts: {},
      // Les failles de securite du DinderTracker, jour par jour.
      failles: {},
      // The Founder War : le dernier niveau franchi, et l'experience de
      // chaque Dinder.
      fwNiveau: 0,
      dinderXP: {}
    };
  }

  // Les profils crees avant la peche n'ont ni canne ni carnet de prises :
  // on les complete a la lecture plutot que de les migrer une bonne fois,
  // ce qui evite d'avoir a versionner la sauvegarde.
  function completer(p) {
    if (typeof p.canne !== 'boolean') p.canne = false;
    if (!p.peche || typeof p.peche !== 'object') p.peche = {};
    if (!p.exploits || typeof p.exploits !== 'object') p.exploits = {};
    if (!Array.isArray(p.vus)) p.vus = [];
    if (!Array.isArray(p.cannes)) p.cannes = [];
    if (!Array.isArray(p.flotteurs)) p.flotteurs = [];
    if (!Array.isArray(p.hamecons)) p.hamecons = [];
    if (!p.leurres || typeof p.leurres !== 'object') p.leurres = {};
    if (!p.equip || typeof p.equip !== 'object') p.equip = {};
    // Ramasser la canne du bord de l'eau, c'est entrer en possession du
    // materiel d'origine : les profils d'avant la boutique le recoivent ici.
    if (p.canne) {
      if (p.cannes.indexOf('base') === -1) p.cannes.push('base');
      if (p.flotteurs.indexOf('base') === -1) p.flotteurs.push('base');
      if (p.hamecons.indexOf('base') === -1) p.hamecons.push('base');
    }
    if (!p.equip.canne || p.cannes.indexOf(p.equip.canne) === -1) {
      p.equip.canne = p.cannes[0] || 'base';
    }
    if (!p.equip.flotteur || p.flotteurs.indexOf(p.equip.flotteur) === -1) {
      p.equip.flotteur = p.flotteurs[0] || 'base';
    }
    if (!p.equip.hamecon || p.hamecons.indexOf(p.equip.hamecon) === -1) {
      p.equip.hamecon = p.hamecons[0] || 'base';
    }
    // Un leurre monte dont on n'a plus d'exemplaire ne vaut rien.
    if (p.equip.leurre && !(p.leurres[p.equip.leurre] > 0)) p.equip.leurre = '';
    if (typeof p.illimite !== 'boolean') p.illimite = true;
    if (typeof p.dindiseOfferte !== 'boolean') p.dindiseOfferte = false;
    if (!p.fusion || typeof p.fusion !== 'object') {
      p.fusion = { sacrifice: false, victoires: 0, quetes: [], faite: false };
    }
    if (typeof p.fusion.sacrifice !== 'boolean') p.fusion.sacrifice = false;
    if (typeof p.fusion.victoires !== 'number') p.fusion.victoires = 0;
    if (!Array.isArray(p.fusion.quetes)) p.fusion.quetes = [];
    if (typeof p.fusion.faite !== 'boolean') p.fusion.faite = false;
    // Un vieux profil a pu retenir des fiches du Codanex : il ne les
    // garde plus, elles ne durent que le temps d'une page.
    if (p.codanex) delete p.codanex;
    if (!Array.isArray(p.niveauxReclames)) p.niveauxReclames = [];
    if (!p.artefacts || typeof p.artefacts !== 'object') p.artefacts = {};
    if (!p.failles || typeof p.failles !== 'object') p.failles = {};
    if (typeof p.fwNiveau !== 'number') p.fwNiveau = 0;
    if (!p.dinderXP || typeof p.dinderXP !== 'object') p.dinderXP = {};
    if (typeof p.niveauVu !== 'number') p.niveauVu = 1;
    if (p.creditsAvantInfini === undefined) p.creditsAvantInfini = null;
    if (typeof p.arme !== 'boolean') p.arme = false;
    if (typeof p.armeNiveau !== 'number') p.armeNiveau = 1;
    p.armeNiveau = Math.max(1, Math.min(10, p.armeNiveau));
    // Le pistolet de l'Odyssee a sa propre progression : il part du Mk I.
    if (typeof p.armeNiveauOdyssee !== 'number') p.armeNiveauOdyssee = 1;
    p.armeNiveauOdyssee = Math.max(1, Math.min(10, p.armeNiveauOdyssee));
    if (typeof p.noyaux !== 'number') p.noyaux = 0;
    if (!Array.isArray(p.revetements)) p.revetements = [];
    // Porter l'arme, c'est porter au moins son acier d'origine.
    if (p.arme && p.revetements.indexOf('origine') === -1) p.revetements.push('origine');
    if (!p.revetement || p.revetements.indexOf(p.revetement) === -1) {
      p.revetement = p.revetements[0] || 'origine';
    }
    if (!p.requins || typeof p.requins !== 'object') p.requins = {};
    if (typeof p.telecommande !== 'boolean') p.telecommande = false;
    if (typeof p.chapitre !== 'number') p.chapitre = 0;
    if (!Array.isArray(p.astres)) p.astres = [];
    if (!p.scans || typeof p.scans !== 'object') p.scans = {};
    if (!p.abattus || typeof p.abattus !== 'object') p.abattus = {};
    if (typeof p.roches !== 'number') p.roches = 0;
    if (!p.credits) p.credits = { green: 0, blue: 0, gold: 0, pink: 0 };
    if (!Array.isArray(p.owned)) p.owned = [];
    return p;
  }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }

  function load() {
    if (db) return db;

    db = read(KEY);

    // Reprise de l'ancienne sauvegarde : elle devient le premier profil,
    // pour qu'une progression deja faite ne soit pas perdue.
    if (!db || !Array.isArray(db.profiles) || !db.profiles.length) {
      var legacy = read(OLD_KEY);
      var first = newProfile('Joueur 1');
      if (legacy && Array.isArray(legacy.owned)) {
        first.owned = legacy.owned;
        if (legacy.credits) first.credits = legacy.credits;
      }
      db = { current: first.id, profiles: [first] };
      save();
    }

    if (!byProfileId(db.current)) db.current = db.profiles[0].id;
    return db;
  }

  var ecoutes = [];

  // Prevenu apres chaque ecriture. Sert aux badges : ils se relisent tout
  // seuls, quel que soit l'endroit du site qui a fait bouger l'etat.
  function onChange(fn) {
    if (typeof fn === 'function') ecoutes.push(fn);
  }

  var enCours = false;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
    // Un abonne qui ecrit a son tour ne doit pas relancer la boucle.
    if (enCours) return;
    enCours = true;
    try {
      for (var i = 0; i < ecoutes.length; i++) {
        try { ecoutes[i](); } catch (e) {}
      }
    } finally { enCours = false; }
  }

  function byProfileId(id) {
    var list = (db && db.profiles) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function me() {
    var d = load();
    return completer(byProfileId(d.current));
  }

  // ---------- L'API des profils ----------

  function profiles() {
    return load().profiles.map(function (p) {
      return { id: p.id, name: p.name, created: p.created, owned: p.owned.length };
    });
  }

  function currentProfile() {
    var p = me();
    return { id: p.id, name: p.name, created: p.created, owned: p.owned.length };
  }

  // Deux profils ne peuvent pas porter le meme nom : c'est le seul repere
  // dont dispose le joueur pour s'y retrouver.
  function nameTaken(name, exceptId) {
    var wanted = String(name).trim().toLowerCase();
    return load().profiles.some(function (p) {
      return p.id !== exceptId && p.name.trim().toLowerCase() === wanted;
    });
  }

  function createProfile(name) {
    name = String(name || '').trim();
    if (!name) return { ok: false, error: 'Il faut un nom.' };
    if (name.length > 18) return { ok: false, error: ' 18 caractères maximum.' };
    if (nameTaken(name)) return { ok: false, error: 'Ce nom est déjà pris.' };

    var p = newProfile(name);
    load().profiles.push(p);
    db.current = p.id;
    save();
    return { ok: true, id: p.id };
  }

  function switchProfile(id) {
    if (!byProfileId(id)) return false;
    load().current = id;
    save();
    return true;
  }

  function renameProfile(id, name) {
    var p = byProfileId(id);
    name = String(name || '').trim();
    if (!p) return { ok: false, error: 'Profil introuvable.' };
    if (!name) return { ok: false, error: 'Il faut un nom.' };
    if (name.length > 18) return { ok: false, error: '18 caractères maximum.' };
    if (nameTaken(name, id)) return { ok: false, error: 'Ce nom est déjà pris.' };
    p.name = name;
    save();
    return { ok: true };
  }

  // On garde toujours au moins un profil : sans lui, plus rien n'a ou vivre.
  function deleteProfile(id) {
    var d = load();
    if (d.profiles.length < 2) return { ok: false, error: 'C’est le dernier profil.' };
    var i = d.profiles.findIndex(function (p) { return p.id === id; });
    if (i === -1) return { ok: false, error: 'Profil introuvable.' };
    d.profiles.splice(i, 1);
    if (d.current === id) d.current = d.profiles[0].id;
    save();
    return { ok: true };
  }

  // ---------- Credits ----------

  function creditCount(key) {
    return illimite() ? Infinity : (me().credits[key] || 0);
  }

  function canAfford(key) { return creditCount(key) >= PRICE[key]; }

  function spend(key) {
    if (!canAfford(key)) return false;
    if (!illimite()) { me().credits[key] -= PRICE[key]; save(); }
    return true;
  }

  // Un gain, par exemple la recompense d'un mini-jeu. Il est toujours
  // inscrit au profil, meme quand les credits sont infinis. Revenir aux
  // credits normaux rend toutefois le solde d'avant le passage a l'infini.
  function earn(key, n) {
    n = Math.max(0, Math.round(n || 0));
    if (!CREDITS[key] || !n) return 0;
    var p = me();
    p.credits[key] = (p.credits[key] || 0) + n;
    save();
    return p.credits[key];
  }

  // Le total reellement engrange, sans le voile des credits infinis.
  function creditPurse(key) { return me().credits[key] || 0; }

  // Passer en credits infinis met le solde de cote ; revenir aux credits
  // normaux le rend tel qu'il etait au moment du passage.
  function creditsMisDeCote() {
    var c = me().creditsAvantInfini;
    return c ? JSON.parse(JSON.stringify(c)) : null;
  }

  function passerIllimite(oui) {
    var p = me();
    oui = !!oui;
    if (illimite() === oui) return false;
    if (oui) {
      p.creditsAvantInfini = {};
      ORDER.forEach(function (k) { p.creditsAvantInfini[k] = p.credits[k] || 0; });
    } else if (p.creditsAvantInfini) {
      ORDER.forEach(function (k) { p.credits[k] = p.creditsAvantInfini[k] || 0; });
      p.creditsAvantInfini = null;
    }
    p.illimite = oui;
    save();
    return true;
  }

  // La premiere Dindise Universelle ne coute rien : elle lance la
  // collection. Une seule par profil, et seulement si la capsule a
  // encore quelque chose a donner.
  function dindiseOfferte(d) {
    return d.id === 'universel' && !me().dindiseOfferte;
  }

  function consommerDindiseOfferte() {
    var p = me();
    if (p.dindiseOfferte) return false;
    p.dindiseOfferte = true;
    save();
    return true;
  }

  // ---------- Collection ----------

  function owned()    { return me().owned.slice(); }
  function has(id)    { return me().owned.indexOf(id) !== -1; }
  function missing()  { return DINDERS.filter(function (d) { return !has(d.id); }); }
  function complete() { return missing().length === 0; }

  function collect(id) {
    var p = me();
    if (p.owned.indexOf(id) === -1) { p.owned.push(id); save(); }
  }

  // Tout le roster d'une rarete donnee, et ce qu'il en reste a trouver.
  function ofRarity(r)      { return DINDERS.filter(function (d) { return d.rarity === r; }); }
  function missingOf(r)     { return missing().filter(function (d) { return d.rarity === r; }); }

  // Ceux qu'une Dindise peut encore rendre : Le Fondateur ne se tire pas,
  // il se gagne au bout de The Founder War.
  function tirables(r) {
    return missingOf(r).filter(function (d) { return !d.horsTirage; });
  }

  // Tire un Dinder de la rarete demandee, encore absent de la collection :
  // une Dindise ne donne jamais de doublon tant qu'il reste a decouvrir.
  function draw(rarete) {
    var pool = rarete ? tirables(rarete)
                      : missing().filter(function (d) { return !d.horsTirage; });
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Une Dindise est ouvrable si on peut la payer et si elle a de quoi
  // rendre quelque chose.
  function dindiseEtat(d) {
    var reste = tirables(d.rarete).length;
    var total = ofRarity(d.rarete).filter(function (x) { return !x.horsTirage; }).length;
    if (!total)             return { ouvrable: false, raison: 'aucun Dinder', reste: 0, total: 0 };
    if (!reste)             return { ouvrable: false, raison: 'tout trouvé', reste: 0, total: total };
    if (dindiseOfferte(d)) return { ouvrable: true, raison: '', offerte: true, reste: reste, total: total };
    if (!canAfford(d.credit)) return { ouvrable: false, raison: 'crédits manquants', reste: reste, total: total };
    return { ouvrable: true, raison: '', offerte: false, reste: reste, total: total };
  }

  // ---------- La faille du Dr. Islas ----------
  // Le sacrifice a l'Effondrement Terminal ouvre l'histoire ; trois
  // quetes la ferment, et la fusion en sort.

  function fusion() {
    var f = me().fusion;
    return { sacrifice: f.sacrifice, victoires: f.victoires,
             quetes: f.quetes.slice(), faite: f.faite };
  }

  function noterSacrifice() {
    var p = me();
    if (p.fusion.sacrifice) { p.fusion.victoires++; save(); return false; }
    p.fusion.sacrifice = true;
    p.fusion.victoires++;
    save();
    return true;
  }

  function noterQuete(id) {
    var p = me();
    if (p.fusion.quetes.indexOf(id) !== -1) return false;
    p.fusion.quetes.push(id);
    save();
    return true;
  }

  function aQuete(id) { return me().fusion.quetes.indexOf(id) !== -1; }

  function noterFusion() {
    var p = me();
    if (p.fusion.faite) return false;
    p.fusion.faite = true;
    save();
    return true;
  }

  // ---------- La peche ----------

  function aLaCanne()    { return !!me().canne; }

  function prendreCanne() {
    var p = me();
    if (p.canne) return false;
    p.canne = true;
    if (p.cannes.indexOf('base') === -1) p.cannes.push('base');
    if (p.flotteurs.indexOf('base') === -1) p.flotteurs.push('base');
    if (p.hamecons.indexOf('base') === -1) p.hamecons.push('base');
    p.equip.canne = p.equip.canne || 'base';
    p.equip.flotteur = p.equip.flotteur || 'base';
    p.equip.hamecon = p.equip.hamecon || 'base';
    save();
    return true;
  }

  // ---------- Le materiel de peche ----------
  // Deux listes — cannes et flotteurs — et ce qui est monte au bout de
  // la ligne. Les caracteristiques de chaque piece vivent dans
  // js/peche-materiel.js ; ici on ne garde que ce qu'on possede.

  function sac(type) {
    var p = me();
    if (type === 'flotteur') return p.flotteurs;
    if (type === 'hamecon') return p.hamecons;
    return p.cannes;
  }

  function materiel(type)        { return sac(type).slice(); }
  function possede(type, id)     { return sac(type).indexOf(id) !== -1; }

  function acquerir(type, id) {
    if (possede(type, id)) return false;
    sac(type).push(id);
    save();
    return true;
  }

  function equipe(type)          { return me().equip[type] || 'base'; }

  function equiper(type, id) {
    if (!possede(type, id)) return false;
    me().equip[type] = id;
    save();
    return true;
  }

  // ---------- Les leurres ----------
  // Un leurre ne se monte pas comme une canne : il se pose a la ligne, et
  // la bete qu'il appelle l'emporte avec elle. On garde donc un compte,
  // et non une simple possession.

  function leurres() { return me().leurres; }

  function leurre(id) { return me().leurres[id] || 0; }

  function ajouterLeurre(id, n) {
    var p = me();
    p.leurres[id] = (p.leurres[id] || 0) + (n || 1);
    // Le premier leurre d'une sorte se monte de lui-meme : on vient de
    // l'acheter, c'est qu'on veut s'en servir.
    if (!p.equip.leurre) p.equip.leurre = id;
    save();
    return p.leurres[id];
  }

  function consommerLeurre(id) {
    var p = me();
    if (!(p.leurres[id] > 0)) return false;
    p.leurres[id]--;
    if (!p.leurres[id]) {
      delete p.leurres[id];
      if (p.equip.leurre === id) {
        // On remonte automatiquement ce qu'il reste dans la boite.
        p.equip.leurre = Object.keys(p.leurres)[0] || '';
      }
    }
    save();
    return true;
  }

  function leurreMonte() {
    var p = me();
    return p.equip.leurre && p.leurres[p.equip.leurre] > 0 ? p.equip.leurre : '';
  }

  function monterLeurre(id) {
    var p = me();
    if (id && !(p.leurres[id] > 0)) return false;
    p.equip.leurre = id || '';
    save();
    return true;
  }

  // Un doublon depense : l'espece reste au carnet, seul son compteur baisse.
  function retirerPrise(id, n) {
    var p = me(), e = p.peche[id];
    if (!e) return 0;
    var pris = Math.max(0, Math.min(n, e.n - 1));
    e.n -= pris;
    if (pris) save();
    return pris;
  }

  // Le carnet de prises : combien de fois chaque espece a mordu, et la
  // plus belle taille sortie de l'eau.
  function prises()      { return me().peche; }
  function aPeche(id)    { return !!me().peche[id]; }

  function noterPrise(id, cm, kg, brillant) {
    var p = me();
    var e = p.peche[id] || { n: 0, max: 0, kg: 0 };
    if (typeof e.kg !== 'number') e.kg = 0;
    e.n++;
    if (cm > e.max) e.max = cm;
    if (kg > e.kg) e.kg = kg;
    // Un brillant se compte a part : vendre des doublons ne peut pas le
    // faire disparaitre du carnet.
    if (brillant) e.shiny = (e.shiny || 0) + 1;
    p.peche[id] = e;
    save();
    return e;
  }

  // A-t-on deja sorti cette espece dans sa seconde livree ?
  function aShiny(id) {
    var e = me().peche[id];
    return !!(e && e.shiny);
  }

  // Le nombre d'especes dont on tient le brillant.
  function shinys() {
    var p = me().peche, n = 0;
    for (var id in p) if (p[id] && p[id].shiny) n++;
    return n;
  }

  // ---------- Le Pistolet Lumithique ----------
  // Il ne s'achete pas : il se trouve, au creux d'une souche, quelque
  // part dans le bois du mini-jeu de peche.

  function aLArme() { return !!me().arme; }

  function prendreArme() {
    var p = me();
    if (p.arme) return false;
    p.arme = true;
    if (p.revetements.indexOf('origine') === -1) p.revetements.push('origine');
    p.revetement = p.revetement || 'origine';
    save();
    return true;
  }

  // Deux progressions pour le meme pistolet : celle de Fish n'Der (par
  // defaut) et celle de l'Odyssee (jeu === 'odyssee').
  function champNiveau(jeu) { return jeu === 'odyssee' ? 'armeNiveauOdyssee' : 'armeNiveau'; }

  function armeNiveau(jeu) { return me()[champNiveau(jeu)] || 1; }

  function monterArme(jeu) {
    var p = me(), k = champNiveau(jeu);
    if ((p[k] || 1) >= 10) return false;
    p[k] = (p[k] || 1) + 1;
    save();
    return p[k];
  }

  // Les Noyaux Lumithiques : la monnaie des requins, et rien d'autre.
  function noyaux() { return me().noyaux || 0; }

  function gagnerNoyaux(n) {
    var p = me();
    p.noyaux = (p.noyaux || 0) + n;
    save();
    return p.noyaux;
  }

  function depenserNoyaux(n) {
    var p = me();
    if ((p.noyaux || 0) < n) return false;
    p.noyaux -= n;
    save();
    return true;
  }

  function revetements()      { return me().revetements.slice(); }
  function aRevetement(id)    { return me().revetements.indexOf(id) !== -1; }
  function revetement()       { return me().revetement || 'origine'; }

  function acquerirRevetement(id) {
    var p = me();
    if (p.revetements.indexOf(id) !== -1) return false;
    p.revetements.push(id);
    save();
    return true;
  }

  function equiperRevetement(id) {
    if (!aRevetement(id)) return false;
    me().revetement = id;
    save();
    return true;
  }

  // Le tableau de chasse : combien de chaque forme, et combien de
  // brillants et d'irradies parmi elles.
  function requins() { return me().requins; }

  function noterRequin(id, opts) {
    var p = me();
    var e = p.requins[id] || { n: 0, brillants: 0, irradies: 0 };
    e.n++;
    if (opts && opts.brillant) e.brillants++;
    if (opts && opts.irradie) e.irradies++;
    p.requins[id] = e;
    save();
    return e;
  }

  // ---------- Le Teleportail ----------
  // La telecommande tombee du ciel au chapitre premier. Elle retient les
  // mondes ou l'on s'est pose, et tout ce qu'on y a scanne.

  function aLaTelecommande() { return !!me().telecommande; }

  function prendreTelecommande() {
    var p = me();
    if (p.telecommande) return false;
    p.telecommande = true;
    p.chapitre = Math.max(1, p.chapitre);
    save();
    return true;
  }

  function chapitre() { return me().chapitre || 0; }

  function ouvrirChapitre(n) {
    var p = me();
    if (n <= p.chapitre) return false;
    p.chapitre = n;
    save();
    return true;
  }

  // Les mondes visites, dans l'ordre ou on les a decouverts.
  function astresVus() { return me().astres.slice(); }

  function aVuAstre(id) { return me().astres.indexOf(id) !== -1; }

  function noterAstre(id) {
    var p = me();
    if (p.astres.indexOf(id) !== -1) return false;
    p.astres.push(id);
    save();
    return true;
  }

  // Le carnet du scanner : chaque entree garde le nombre de scans et la
  // date du premier, qui sert a ordonner les decouvertes.
  function scans() { return me().scans; }

  function aScanne(id) { return !!me().scans[id]; }

  function noterScan(id, astre) {
    var p = me();
    var e = p.scans[id];
    var neuf = !e;
    if (!e) e = { n: 0, astre: astre || '', le: Date.now() };
    e.n++;
    p.scans[id] = e;
    save();
    return { entree: e, neuf: neuf };
  }

  // Les Roches Solaires.
  function roches() { return me().roches || 0; }

  function gagnerRoches(n) {
    var p = me();
    p.roches = (p.roches || 0) + n;
    save();
    return p.roches;
  }

  function depenserRoches(n) {
    var p = me();
    if ((p.roches || 0) < n) return false;
    p.roches -= n;
    save();
    return true;
  }

  // Les creatures abattues au Pistolet Lumithique, espece par espece.
  function abattus() { return me().abattus; }

  function noterAbattu(id) {
    var p = me();
    p.abattus[id] = (p.abattus[id] || 0) + 1;
    save();
    return p.abattus[id];
  }

  // ---------- Les exploits ----------
  // Ce que la seule collection ne dit pas : une victoire, un chrono. Les
  // badges s'en servent pour savoir ce qui est acquis.

  function exploits() { return me().exploits; }

  function exploit(cle) { return me().exploits[cle] || 0; }

  // Un compteur qui monte d'un cran.
  function compterExploit(cle) {
    var p = me();
    p.exploits[cle] = (p.exploits[cle] || 0) + 1;
    save();
    return p.exploits[cle];
  }

  // Un record : on ne garde que le meilleur. "bas" pour un chrono, ou la
  // plus petite valeur gagne ; sinon la plus grande.
  function noterRecord(cle, valeur, bas) {
    var p = me();
    var actuel = p.exploits[cle];
    if (actuel === undefined || (bas ? valeur < actuel : valeur > actuel)) {
      p.exploits[cle] = valeur;
      save();
    }
    return p.exploits[cle];
  }

  // ---------- Les badges deja annonces ----------

  function badgesVus() { return me().vus.slice(); }

  function marquerVus(ids) {
    var p = me(), neuf = false;
    ids.forEach(function (id) {
      if (p.vus.indexOf(id) === -1) { p.vus.push(id); neuf = true; }
    });
    if (neuf) save();
    return neuf;
  }

  // Ce qu'on peut vider, piece par piece, depuis les Parametres. Chaque
  // partie sait remettre a zero ses propres champs du profil ; "reset"
  // les vide toutes. Le profil lui-meme n'est jamais supprime.
  var PARTIES = [
    { id: 'dinders', nom: 'Dinders', det: 'La collection de Dinders',
      vider: function (p) { p.owned = []; } },
    { id: 'poissons', nom: 'Poissons', det: 'Le carnet de pêche : espèces, records, brillants',
      vider: function (p) { p.peche = {}; } },
    { id: 'materiel', nom: 'Matériel de pêche', det: 'Canne, flotteurs, hameçons et leurres',
      vider: function (p) {
        p.canne = false; p.cannes = []; p.flotteurs = []; p.hamecons = []; p.leurres = {};
        p.equip = { canne: 'base', flotteur: 'base', hamecon: 'base', leurre: '' };
      } },
    { id: 'requins', nom: 'Requins', det: 'Les requins abattus et les Noyaux Lumithiques',
      vider: function (p) { p.requins = {}; p.noyaux = 0; } },
    { id: 'arme', nom: 'Pistolet Lumithique', det: 'L’arme, ses deux niveaux et ses revêtements',
      vider: function (p) {
        p.arme = false; p.armeNiveau = 1; p.armeNiveauOdyssee = 1;
        p.revetements = []; p.revetement = 'origine';
      } },
    { id: 'odyssee', nom: 'The Odyssey of Dinder', det: 'Téléportail, mondes, scans, créatures abattues, Roches Solaires',
      vider: function (p) {
        p.telecommande = false; p.chapitre = 0; p.astres = []; p.scans = {};
        p.abattus = {}; p.roches = 0; p.armeNiveauOdyssee = 1;
      } },
    { id: 'badges', nom: 'Badges', det: 'Les badges et les exploits comptés',
      vider: function (p) { p.exploits = {}; p.vus = []; } },
    { id: 'artefacts', nom: 'Artefacts', det: 'Les artefacts trouvés dans les mini-jeux',
      vider: function (p) { p.artefacts = {}; } },
    { id: 'failles', nom: 'Failles de sécurité', det: 'Les failles du DinderTracker contenues',
      vider: function (p) { p.failles = {}; } },
    { id: 'founder', nom: 'The Founder War', det: 'Les niveaux franchis, l’expérience des Dinders et la faille du Dr. Islas',
      vider: function (p) {
        p.fwNiveau = 0; p.dinderXP = {};
        p.fusion = { sacrifice: false, victoires: 0, quetes: [], faite: false };
      } },
    { id: 'niveaux', nom: 'Niveaux', det: 'Les récompenses de niveau déjà réclamées',
      vider: function (p) { p.niveauxReclames = []; p.niveauVu = 1; } },
    { id: 'credits', nom: 'Crédits', det: 'Le solde de crédits, et celui mis de côté',
      vider: function (p) {
        p.credits = { green: 0, blue: 0, gold: 0, pink: 0 };
        p.creditsAvantInfini = null;
        p.dindiseOfferte = false;
      } }
  ];

  // Les artefacts : noterArtefact rend vrai la premiere fois seulement.
  function artefacts() { return Object.keys(me().artefacts); }
  function aArtefact(id) { return !!me().artefacts[id]; }
  function noterArtefact(id) {
    var p = me();
    if (p.artefacts[id]) return false;
    p.artefacts[id] = Date.now();
    save();
    return true;
  }

  // ---------- The Founder War ----------
  function fwNiveau() { return me().fwNiveau || 0; }

  function noterFwNiveau(n) {
    var p = me();
    if (n <= (p.fwNiveau || 0)) return false;
    p.fwNiveau = n;
    save();
    return true;
  }

  function dinderXP(id) { return me().dinderXP[id] || 0; }

  function gagnerDinderXP(id, n) {
    var p = me();
    p.dinderXP[id] = (p.dinderXP[id] || 0) + Math.max(0, Math.round(n || 0));
    save();
    return p.dinderXP[id];
  }

  function niveauxReclames() { return me().niveauxReclames.slice(); }
  function reclamerNiveau(n) {
    var p = me();
    if (p.niveauxReclames.indexOf(n) !== -1) return false;
    p.niveauxReclames.push(n);
    save();
    return true;
  }
  function niveauVu() { return me().niveauVu || 1; }
  function voirNiveau(n) { var p = me(); if (n !== p.niveauVu) { p.niveauVu = n; save(); } }

  // Vide les parties demandees (identifiants de PARTIES). Rend le nombre
  // de parties videes.
  function viderParties(ids) {
    var p = me(), n = 0;
    PARTIES.forEach(function (x) {
      if (ids.indexOf(x.id) === -1) return;
      x.vider(p); n++;
    });
    if (n) { completer(p); save(); }
    return n;
  }

  // Vide toute la progression du profil courant, sans supprimer le profil.
  function reset() {
    viderParties(PARTIES.map(function (x) { return x.id; }));
  }

  // Retient le dernier Dinder obtenu, le temps d'aller l'annoncer sur la
  // page collection. La marque est consommee des qu'elle a servi.
  function markNew(id) {
    try { sessionStorage.setItem('dinderpad.new', id); } catch (e) {}
  }

  function takeNew() {
    try {
      var id = sessionStorage.getItem('dinderpad.new');
      sessionStorage.removeItem('dinderpad.new');
      return id;
    } catch (e) { return null; }
  }

  // ---------- Chemins ----------
  // Tout le site tient dans index.html, a la racine.

  function dinderImg(id)  { return 'assets/dinders/' + id + '.webp'; }
  function creditImg(key) { return 'assets/credits/' + CREDITS[key].img; }

  // Le personnage en pied, pour sa fiche detaillee.
  function dinderFull(id) { return 'assets/dinders/full/' + id + '.webp'; }

  // Les sprites 8 bits du duel, fabriques par tools/generate-sprites.js.
  // Ceux de la foret sont d'une autre nature : js/game-sprites.js les peint
  // a la volee, en chibi, et ne passe donc pas par ici.
  function sprite(id, taille) {
    return 'assets/games/sprites/' + (taille || 'duel') + '/' + id + '.png';
  }

  window.DP = {
    CREDITS: CREDITS, ORDER: ORDER, PRICE: PRICE, DINDERS: DINDERS,
    SLOTS: SLOTS, RARITIES: RARITIES, tirables: tirables,
    illimite: illimite, passerIllimite: passerIllimite,
    creditsMisDeCote: creditsMisDeCote, creditPurse: creditPurse,
    DINDISES: DINDISES, ofRarity: ofRarity, missingOf: missingOf,
    dindiseEtat: dindiseEtat,
    dindiseOfferte: dindiseOfferte,
    consommerDindiseOfferte: consommerDindiseOfferte,
    MENACE: MENACE, horsDindise: horsDindise,
    fusion: fusion, noterSacrifice: noterSacrifice,
    noterQuete: noterQuete, aQuete: aQuete, noterFusion: noterFusion,
    ITEMS: ITEMS, items: items, CONTINENTS: CONTINENTS,
    aLaCanne: aLaCanne, prendreCanne: prendreCanne,
    prises: prises, aPeche: aPeche, noterPrise: noterPrise,
    aShiny: aShiny, shinys: shinys,
    aLArme: aLArme, prendreArme: prendreArme,
    armeNiveau: armeNiveau, monterArme: monterArme,
    noyaux: noyaux, gagnerNoyaux: gagnerNoyaux, depenserNoyaux: depenserNoyaux,
    revetements: revetements, aRevetement: aRevetement,
    revetement: revetement, acquerirRevetement: acquerirRevetement,
    equiperRevetement: equiperRevetement,
    requins: requins, noterRequin: noterRequin,
    aLaTelecommande: aLaTelecommande, prendreTelecommande: prendreTelecommande,
    chapitre: chapitre, ouvrirChapitre: ouvrirChapitre,
    astresVus: astresVus, aVuAstre: aVuAstre, noterAstre: noterAstre,
    scans: scans, aScanne: aScanne, noterScan: noterScan,
    abattus: abattus, noterAbattu: noterAbattu,
    roches: roches, gagnerRoches: gagnerRoches, depenserRoches: depenserRoches,
    materiel: materiel, possede: possede, acquerir: acquerir,
    equipe: equipe, equiper: equiper, retirerPrise: retirerPrise,
    leurres: leurres, leurre: leurre, ajouterLeurre: ajouterLeurre,
    consommerLeurre: consommerLeurre, leurreMonte: leurreMonte,
    monterLeurre: monterLeurre,
    exploits: exploits, exploit: exploit,
    compterExploit: compterExploit, noterRecord: noterRecord,
    badgesVus: badgesVus, marquerVus: marquerVus, onChange: onChange,
    spots: spots, prochainSaut: prochainSaut,
    heureLocale: heureLocale, dateLocale: dateLocale,
    rarityKey: rarityKey,

    profiles: profiles, currentProfile: currentProfile,
    createProfile: createProfile, switchProfile: switchProfile,
    renameProfile: renameProfile, deleteProfile: deleteProfile,

    creditCount: creditCount, canAfford: canAfford, spend: spend,
    earn: earn, creditPurse: creditPurse,
    owned: owned, has: has, missing: missing, complete: complete,
    collect: collect, draw: draw, reset: reset,
    PARTIES: PARTIES, viderParties: viderParties,
    niveauxReclames: niveauxReclames, reclamerNiveau: reclamerNiveau,
    artefacts: artefacts, aArtefact: aArtefact, noterArtefact: noterArtefact,
    fwNiveau: fwNiveau, noterFwNiveau: noterFwNiveau,
    dinderXP: dinderXP, gagnerDinderXP: gagnerDinderXP,
    maintenant: maintenant, decalerHorloge: decalerHorloge, faille: faille,
    etatFaille: etatFaille, purgerBalise: purgerBalise, contenirFaille: contenirFaille,
    faillesContenues: faillesContenues,
    niveauVu: niveauVu, voirNiveau: voirNiveau,
    markNew: markNew, takeNew: takeNew,
    dinderImg: dinderImg, dinderFull: dinderFull, creditImg: creditImg,
    sprite: sprite,

    byId: function (id) {
      for (var i = 0; i < DINDERS.length; i++) if (DINDERS[i].id === id) return DINDERS[i];
      return null;
    }
  };
  // L'ancien drapeau, lu par le materiel de peche : il suit le profil.
  Object.defineProperty(window.DP, 'UNLIMITED', { get: illimite, enumerable: true });
})();
