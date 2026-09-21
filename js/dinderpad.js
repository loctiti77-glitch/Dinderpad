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

  // Chaque rarete emprunte la couleur de la monnaie du meme nom : un
  // Dinder Universel s'affiche en vert, comme le credit Universel.
  var RARITY_KEY = {
    'Universel':   'green',
    'Multiversel': 'blue',
    'Omniversel':  'gold',
    'Temporel':    'pink'
  };

  function rarityKey(r) { return RARITY_KEY[r] || 'green'; }

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

  // Tant que ce drapeau est vrai, les achats ne retirent aucun credit.
  var UNLIMITED = true;

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
    { id: 'calder-veyne-veinburner',           name: 'Calder Veyne',  form: 'Veinburner',       rarity: 'Universel',    universe: 'SS-03',  desc: 'Calder Veyne, enfant, fut arraché de son foyer pour vivre en maison d’Altérés, où il subit d’atroces expériences jusqu’à devenir Veinburner.' },
    { id: 'carl-sinars-cardinal-sin',          name: 'Carl Sinars',   form: 'Cardinal Sin',     rarity: 'Universel',    universe: 'SS-03',  desc: 'Carl Sinars, un adulte addict aux jeux d’argent, rejoint la quête du Dr. Islas, lui ayant donné accès aux pouvoirs des cartes.' },
    { id: 'edgar-marks-grincrusher',           name: 'Edgar Marks',   form: 'Grincrusher',      rarity: 'Universel',    universe: 'SS-03',  desc: 'Edgar Marks, enfant, fut arraché de son foyer pour vivre en maison d’Altérés, où il subit d’atroces expériences jusqu’à devenir Grincrusher.' },
    { id: 'he-melt',                           name: 'He Melt',       form: '',                 rarity: 'Multiversel',  universe: 'SSt-03', desc: 'He Melt, de son vrai nom Calder Veyne, fut trahi par son patron, qui le poussa dans une cuve d’acide nécrophylactique, qui le transforma en cette visqueuse masse métamorphe.' },
    { id: 'v',                                 name: 'V',             form: '',                 rarity: 'Temporel',     universe: '???',    desc: 'Protecteur d’orbe.' },
    { id: 'a',                                 name: 'A',             form: '',                 rarity: 'Temporel',     universe: '???',    desc: 'Protecteur d’orbe.' },
    { id: 'h',                                 name: 'H',             form: '',                 rarity: 'Temporel',     universe: '???',    desc: 'Protecteur d’orbe.' },
    { id: 'multinder',                         name: 'Multinder',     form: '',                 rarity: 'Universel',    universe: 'SS-03',  desc: 'Multinder est le gardien des 5 éléments fondamentaux de la planète Terre.' },
    { id: 'gart-kervelor-king-of-karsovia',    name: 'Gart Kervelor', form: 'King of Karsovia', rarity: 'Multiversel',  universe: 'SSt-03', desc: 'Gart Kervelor est le monarque du royaume de Karsovie.' }
  ];

  // ---------- Les items ----------
  // "acquis" dit a quelle condition l'item apparait dans l'inventaire.
  // Le DinderTracker est fourni avec l'appareil ; la canne se ramasse sur
  // la carte du mini-jeu de peche.
  var ITEMS = [
    { id: 'dindertracker', name: 'DinderTracker',
      sub: 'Traceur de signaux',
      img: 'assets/items/dindertracker.webp',
      view: 'tracker', acquis: function () { return true; } },
    { id: 'canne', name: 'Canne à Pêche',
      sub: 'Ramassée au bord de l’eau',
      img: 'assets/items/canne.webp',
      view: 'peche-hub', acquis: function () { return aLaCanne(); } }
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
    var h = Math.floor((quand || Date.now()) / 3600000);
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
    var t = quand || Date.now();
    return 3600000 - (t % 3600000);
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
      owned: [],
      canne: false,
      peche: {},
      exploits: {},
      vus: [],
      cannes: [],
      flotteurs: [],
      equip: { canne: 'base', flotteur: 'base' }
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
    if (!p.equip || typeof p.equip !== 'object') p.equip = {};
    // Ramasser la canne du bord de l'eau, c'est entrer en possession du
    // materiel d'origine : les profils d'avant la boutique le recoivent ici.
    if (p.canne) {
      if (p.cannes.indexOf('base') === -1) p.cannes.push('base');
      if (p.flotteurs.indexOf('base') === -1) p.flotteurs.push('base');
    }
    if (!p.equip.canne || p.cannes.indexOf(p.equip.canne) === -1) {
      p.equip.canne = p.cannes[0] || 'base';
    }
    if (!p.equip.flotteur || p.flotteurs.indexOf(p.equip.flotteur) === -1) {
      p.equip.flotteur = p.flotteurs[0] || 'base';
    }
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
    return UNLIMITED ? Infinity : (me().credits[key] || 0);
  }

  function canAfford(key) { return creditCount(key) >= PRICE[key]; }

  function spend(key) {
    if (!canAfford(key)) return false;
    if (!UNLIMITED) { me().credits[key] -= PRICE[key]; save(); }
    return true;
  }

  // Un gain, par exemple la recompense d'un mini-jeu. Il est toujours
  // inscrit au profil, meme quand les credits sont illimites : le jour ou
  // UNLIMITED passera a false, la cagnotte sera deja la.
  function earn(key, n) {
    n = Math.max(0, Math.round(n || 0));
    if (!CREDITS[key] || !n) return 0;
    var p = me();
    p.credits[key] = (p.credits[key] || 0) + n;
    save();
    return p.credits[key];
  }

  // Le total reellement engrange, sans le voile de UNLIMITED.
  function creditPurse(key) { return me().credits[key] || 0; }

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

  // Tire un Dinder de la rarete demandee, encore absent de la collection :
  // une Dindise ne donne jamais de doublon tant qu'il reste a decouvrir.
  function draw(rarete) {
    var pool = rarete ? missingOf(rarete) : missing();
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Une Dindise est ouvrable si on peut la payer et si elle a de quoi
  // rendre quelque chose.
  function dindiseEtat(d) {
    var reste = missingOf(d.rarete).length;
    var total = ofRarity(d.rarete).length;
    if (!total)             return { ouvrable: false, raison: 'aucun Dinder', reste: 0, total: 0 };
    if (!reste)             return { ouvrable: false, raison: 'tout trouvé', reste: 0, total: total };
    if (!canAfford(d.credit)) return { ouvrable: false, raison: 'crédits manquants', reste: reste, total: total };
    return { ouvrable: true, raison: '', reste: reste, total: total };
  }

  // ---------- La peche ----------

  function aLaCanne()    { return !!me().canne; }

  function prendreCanne() {
    var p = me();
    if (p.canne) return false;
    p.canne = true;
    if (p.cannes.indexOf('base') === -1) p.cannes.push('base');
    if (p.flotteurs.indexOf('base') === -1) p.flotteurs.push('base');
    p.equip = { canne: 'base', flotteur: 'base' };
    save();
    return true;
  }

  // ---------- Le materiel de peche ----------
  // Deux listes — cannes et flotteurs — et ce qui est monte au bout de
  // la ligne. Les caracteristiques de chaque piece vivent dans
  // js/peche-materiel.js ; ici on ne garde que ce qu'on possede.

  function sac(type) {
    var p = me();
    return type === 'flotteur' ? p.flotteurs : p.cannes;
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

  // Vide la progression du profil courant, sans supprimer le profil.
  function reset() {
    var p = me();
    p.owned = [];
    p.credits = { green: 0, blue: 0, gold: 0, pink: 0 };
    p.canne = false;
    p.peche = {};
    p.exploits = {};
    p.vus = [];
    p.cannes = [];
    p.flotteurs = [];
    p.equip = { canne: 'base', flotteur: 'base' };
    save();
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
    SLOTS: SLOTS, UNLIMITED: UNLIMITED, RARITIES: RARITIES,
    DINDISES: DINDISES, ofRarity: ofRarity, missingOf: missingOf,
    dindiseEtat: dindiseEtat,
    ITEMS: ITEMS, items: items, CONTINENTS: CONTINENTS,
    aLaCanne: aLaCanne, prendreCanne: prendreCanne,
    prises: prises, aPeche: aPeche, noterPrise: noterPrise,
    aShiny: aShiny, shinys: shinys,
    materiel: materiel, possede: possede, acquerir: acquerir,
    equipe: equipe, equiper: equiper, retirerPrise: retirerPrise,
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
    markNew: markNew, takeNew: takeNew,
    dinderImg: dinderImg, dinderFull: dinderFull, creditImg: creditImg,
    sprite: sprite,

    byId: function (id) {
      for (var i = 0; i < DINDERS.length; i++) if (DINDERS[i].id === id) return DINDERS[i];
      return null;
    }
  };
})();
