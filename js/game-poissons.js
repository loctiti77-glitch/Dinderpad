// Les trente especes du mini-jeu de peche, et leur dessin.
//
// Comme les sprites de balade, rien n'est stocke en fichier : chaque
// poisson est peint dans une case de 36 x 22 a partir d'une silhouette,
// d'une palette et d'un motif. C'est ce qui permet d'en avoir trente sans
// alourdir le site d'une seule image.
(function () {

  var L = 36, H = 22;
  var CERNE = [18, 22, 34, 255];

  // Les quatre paliers de rarete, du plus courant au plus rare. "poids"
  // pese le tirage : un Commun sort environ quinze fois plus souvent
  // qu'un Legendaire.
  var RARETES = [
    { nom: 'Commun',      cle: 'commun',  poids: 56, couleur: '#c7d3de' },
    { nom: 'Peu commun',  cle: 'peu',     poids: 27, couleur: '#4fd13a' },
    { nom: 'Rare',        cle: 'rare',    poids: 13, couleur: '#45b0ff' },
    { nom: 'Légendaire',  cle: 'legende', poids: 4,  couleur: '#f5c93a' },
    // Les Speciaux ne mordent que dans les lacs irradies : ils ne pesent
    // rien dans le tirage ordinaire, d'ou leur poids nul.
    { nom: 'Spécial',     cle: 'special', poids: 0,  couleur: '#c8f02a' }
  ];

  // corps / ventre / nageoire, puis la forme et le motif.
  var POISSONS = [
    // ---- Communs ----
    { id: 'ablette',    nom: 'Ablette',        rarete: 'commun', forme: 'classique', motif: 'aucun',
      cm: [8, 18],   c: ['#b9c6d4', '#eef3f8', '#8fa0b2'] },
    { id: 'gardon',     nom: 'Gardon',         rarete: 'commun', forme: 'classique', motif: 'aucun',
      cm: [10, 25],  c: ['#8fa4b8', '#e6ecf2', '#c9433f'] },
    { id: 'perche',     nom: 'Perche',         rarete: 'commun', forme: 'classique', motif: 'rayures',
      cm: [12, 35],  c: ['#6e9a4a', '#dfe6c8', '#d4703a'] },
    { id: 'goujon',     nom: 'Goujon',         rarete: 'commun', forme: 'classique', motif: 'points',
      cm: [6, 14],   c: ['#9a8b6a', '#e8dfc6', '#7a6e52'] },
    { id: 'vairon',     nom: 'Vairon',         rarete: 'commun', forme: 'classique', motif: 'rayures',
      cm: [5, 11],   c: ['#6f8f7a', '#e4ead8', '#4d6a58'] },
    { id: 'carpe',      nom: 'Carpe',          rarete: 'commun', forme: 'plat',      motif: 'ecailles',
      cm: [25, 70],  c: ['#a8813f', '#e6d3a4', '#7d5e2c'] },
    { id: 'breme',      nom: 'Brème',          rarete: 'commun', forme: 'plat',      motif: 'aucun',
      cm: [20, 50],  c: ['#b0aa8e', '#eae6d2', '#87816a'] },
    { id: 'tanche',     nom: 'Tanche',         rarete: 'commun', forme: 'plat',      motif: 'aucun',
      cm: [20, 45],  c: ['#5f7a3c', '#c2cf95', '#43552a'] },
    { id: 'rotengle',   nom: 'Rotengle',       rarete: 'commun', forme: 'classique', motif: 'aucun',
      cm: [12, 30],  c: ['#9fae7e', '#e9eed4', '#d0492f'] },
    { id: 'chevesne',   nom: 'Chevesne',       rarete: 'commun', forme: 'long',      motif: 'aucun',
      cm: [15, 45],  c: ['#8e9aa6', '#e4e9ee', '#6d7885'] },
    { id: 'barbeau',    nom: 'Barbeau',        rarete: 'commun', forme: 'long',      motif: 'points',
      cm: [20, 60],  c: ['#93834f', '#ded1a6', '#6d6038'] },
    { id: 'sandre',     nom: 'Sandre',         rarete: 'commun', forme: 'long',      motif: 'rayures',
      cm: [30, 75],  c: ['#7d8a63', '#dbe0c3', '#59633f'] },

    // ---- Peu communs ----
    { id: 'truite',     nom: 'Truite',         rarete: 'peu', forme: 'classique', motif: 'points',
      cm: [20, 50],  c: ['#b0724a', '#f0dcc4', '#e0576a'] },
    { id: 'brochet',    nom: 'Brochet',        rarete: 'peu', forme: 'long',      motif: 'points',
      cm: [40, 110], c: ['#5c7a44', '#d5dfae', '#3f5a2c'] },
    { id: 'silure',     nom: 'Silure',         rarete: 'peu', forme: 'long',      motif: 'moustache',
      cm: [50, 160], c: ['#4f4a44', '#b6ab99', '#35312c'] },
    { id: 'anguille',   nom: 'Anguille',       rarete: 'peu', forme: 'anguille',  motif: 'aucun',
      cm: [30, 90],  c: ['#3f4a3a', '#a8b09a', '#2a3327'] },
    { id: 'ecrevisse',  nom: 'Écrevisse',      rarete: 'peu', forme: 'ecrevisse', motif: 'aucun',
      cm: [6, 15],   c: ['#b8442e', '#eab08e', '#8a2c1c'] },
    { id: 'crabe',      nom: 'Crabe des Vases', rarete: 'peu', forme: 'crabe',    motif: 'aucun',
      cm: [5, 14],   c: ['#9a6a3c', '#d9b183', '#6e4826'] },
    { id: 'lamproie',   nom: 'Lamproie',       rarete: 'peu', forme: 'anguille',  motif: 'points',
      cm: [25, 60],  c: ['#6a5f52', '#c4b8a5', '#463e34'] },
    { id: 'esturgeon',  nom: 'Esturgeon',      rarete: 'peu', forme: 'long',      motif: 'ecailles',
      cm: [60, 180], c: ['#6b7482', '#c6cdd6', '#4a515c'] },
    { id: 'blackbass',  nom: 'Black-bass',     rarete: 'peu', forme: 'classique', motif: 'rayures',
      cm: [25, 55],  c: ['#4c6a4a', '#cfd9b8', '#33492f'] },

    // ---- Rares ----
    { id: 'poisson-lune', nom: 'Poisson-Lune', rarete: 'rare', forme: 'plat',   motif: 'points',
      cm: [25, 60],  c: ['#d8d2b4', '#f6f2e0', '#e0a93f'] },
    { id: 'raie',       nom: 'Raie d’Eau Douce', rarete: 'rare', forme: 'raie', motif: 'points',
      cm: [30, 80],  c: ['#7a6f8c', '#cec6dc', '#544a66'] },
    { id: 'globe',      nom: 'Poisson-Globe',  rarete: 'rare', forme: 'rond',   motif: 'points',
      cm: [10, 30],  c: ['#d9b64a', '#f3e5b4', '#8d6f1f'] },
    { id: 'meduse',     nom: 'Méduse Fantôme', rarete: 'rare', forme: 'meduse', motif: 'aucun',
      cm: [15, 40],  c: ['#a9c8e8', '#e6f2ff', '#7fa8d4'] },
    { id: 'piranha',    nom: 'Piranha Pâle',   rarete: 'rare', forme: 'plat',   motif: 'aucun',
      cm: [12, 28],  c: ['#b8b2ae', '#efe9e4', '#c94a3a'] },
    { id: 'axolotl',    nom: 'Axolotl',        rarete: 'rare', forme: 'triton', motif: 'aucun',
      cm: [10, 24],  c: ['#f0c4d2', '#fbe6ec', '#e08aa6'] },

    // ---- Legendaires ----
    { id: 'prisme',     nom: 'Poisson-Prisme', rarete: 'legende', forme: 'classique', motif: 'irise',
      cm: [30, 70],  c: ['#8ad8ff', '#f2fbff', '#ff9bd2'] },
    { id: 'carpe-chromee', nom: 'Carpe Chromée', rarete: 'legende', forme: 'plat',   motif: 'metal',
      cm: [40, 95],  c: ['#c9d2dc', '#f4f8fb', '#8d99a8'] },
    { id: 'silure-abysses', nom: 'Silure des Abysses', rarete: 'legende', forme: 'long', motif: 'lueur',
      cm: [90, 240], c: ['#241d3a', '#5a4d86', '#7cf0e0'] },

    // ---- Speciaux : les eaux irradiees ----
    // Ils ne remontent que des lacs fluo. "poids" pese leur tirage dans ce
    // vivier-la, "pente" dit a quel point un bon flotteur les favorise.
    { id: 'gardon-luisant', nom: 'Gardon Luisant', rarete: 'special', radioactif: true,
      forme: 'classique', motif: 'lueur', poids: 28, pente: -0.5,
      cm: [12, 30],  c: ['#7cbf2a', '#dcf58a', '#3f6b12'] },
    { id: 'carpe-fluo', nom: 'Carpe Fluo', rarete: 'special', radioactif: true,
      forme: 'plat', motif: 'ecailles', poids: 24, pente: -0.3,
      cm: [30, 80],  c: ['#a8e02a', '#e8fbb0', '#5c7a14'] },
    { id: 'sandre-irradie', nom: 'Sandre Irradié', rarete: 'special', radioactif: true,
      forme: 'long', motif: 'rayures', poids: 19, pente: 0.2,
      cm: [35, 85],  c: ['#6fa81e', '#cdf07a', '#2f4a0c'] },
    { id: 'anguille-photonique', nom: 'Anguille Photonique', rarete: 'special', radioactif: true,
      forme: 'anguille', motif: 'lueur', poids: 13, pente: 0.8,
      cm: [40, 110], c: ['#4a8a1e', '#b4e85c', '#d8ff4a'] },
    { id: 'silure-mutant', nom: 'Silure Mutant', rarete: 'special', radioactif: true,
      forme: 'long', motif: 'moustache', poids: 9, pente: 1.4,
      cm: [70, 200], c: ['#546b2a', '#a8c46e', '#c8f02a'] },
    { id: 'meduse-atomique', nom: 'Méduse Atomique', rarete: 'special', radioactif: true,
      forme: 'meduse', motif: 'aucun', poids: 5, pente: 2.2,
      cm: [20, 55],  c: ['#c8f02a', '#f2ffc0', '#8ab81e'] },
    { id: 'axolotl-cesium', nom: 'Axolotl Césium', rarete: 'special', radioactif: true,
      forme: 'triton', motif: 'points', poids: 3, pente: 3,
      cm: [14, 34],  c: ['#e0ff4a', '#f8ffd0', '#7ca81e'] },
    { id: 'coeur-de-pile', nom: 'Cœur de Pile', rarete: 'special', radioactif: true,
      forme: 'rond', motif: 'lueur', poids: 1.5, pente: 4.5,
      cm: [20, 60],  c: ['#1d2410', '#c8f02a', '#f4ff8a'] },

    // ---- Les evolutions ----
    // Elles ne mordent pas tant qu'on ne les a pas vues eclore : c'est la
    // meme espece, repetee assez souvent, qui finit par changer de forme
    // au bout de la ligne. "evolueDe" dit laquelle, "seuil" combien de
    // prises il faut. Une fois eclose, l'evolution nage comme les autres.
    { id: 'gardon-argent', nom: 'Gardon d’Argent', rarete: 'rare',
      evolueDe: 'gardon', seuil: 8, poids: 5,
      forme: 'classique', motif: 'metal',
      cm: [22, 48],  c: ['#b6c6d6', '#f2f7fc', '#7e90a4'] },
    { id: 'perche-royale', nom: 'Perche Royale', rarete: 'rare',
      evolueDe: 'perche', seuil: 8, poids: 5,
      forme: 'classique', motif: 'rayures',
      cm: [30, 62],  c: ['#3f7a34', '#e4f0c4', '#e8a32c'] },
    { id: 'carpe-ancestrale', nom: 'Carpe Ancestrale', rarete: 'rare',
      evolueDe: 'carpe', seuil: 10, poids: 5,
      forme: 'plat', motif: 'ecailles',
      cm: [60, 120], c: ['#7a5a26', '#d9bf84', '#e0b44a'] },
    { id: 'sandre-lame', nom: 'Sandre Lame', rarete: 'rare',
      evolueDe: 'sandre', seuil: 8, poids: 5,
      forme: 'long', motif: 'rayures',
      cm: [55, 120], c: ['#5d6a48', '#ccd4b0', '#9fc0d8'] },
    { id: 'truite-cristal', nom: 'Truite de Cristal', rarete: 'rare',
      evolueDe: 'truite', seuil: 8, poids: 5,
      forme: 'classique', motif: 'irise',
      cm: [35, 80],  c: ['#9fd8e8', '#f4fcff', '#d9a8e8'] },
    { id: 'brochet-sabre', nom: 'Brochet Sabre', rarete: 'rare',
      evolueDe: 'brochet', seuil: 8, poids: 5,
      forme: 'long', motif: 'rayures',
      cm: [70, 170], c: ['#46613a', '#c6d49e', '#d8d2a0'] },
    { id: 'anguille-spirale', nom: 'Anguille Spirale', rarete: 'rare',
      evolueDe: 'anguille', seuil: 6, poids: 5,
      forme: 'anguille', motif: 'lueur',
      cm: [55, 140], c: ['#33413a', '#94a58f', '#6ee8c0'] },
    { id: 'silure-colosse', nom: 'Silure Colosse', rarete: 'legende',
      evolueDe: 'silure', seuil: 10, poids: 2,
      forme: 'long', motif: 'moustache',
      cm: [140, 300], c: ['#3a352f', '#9c907c', '#d8c46a'] },
    { id: 'gardon-plutonium', nom: 'Gardon Plutonium', rarete: 'special',
      radioactif: true, evolueDe: 'gardon-luisant', seuil: 8,
      poids: 6, pente: 0.6, forme: 'classique', motif: 'lueur',
      cm: [26, 58],  c: ['#9ce02a', '#f0ffb4', '#2c5008'] },
    { id: 'meduse-critique', nom: 'Méduse Critique', rarete: 'special',
      radioactif: true, evolueDe: 'meduse-atomique', seuil: 3,
      poids: 2, pente: 2.5, forme: 'meduse', motif: 'aucun',
      cm: [40, 95],  c: ['#e8ff6a', '#ffffd8', '#a8d81e'] },

    // ---- Les especes secretes ----
    // Elles ne figurent nulle part : ni case grisee, ni silhouette, ni
    // compteur. Chacune demande sa propre condition — une eau, un
    // materiel, une patience — et ne se montre qu'une fois pechee.
    // "indice" est ce qu'on lit dans le carnet apres l'avoir sortie.
    { id: 'ombre-du-lac', nom: 'Ombre du Lac', rarete: 'rare', secret: true,
      forme: 'plat', motif: 'aucun',
      cm: [40, 90],  c: ['#26303c', '#4a5a6e', '#8fa8c4'],
      condition: { eau: 'claire', lancers: 12, chance: 0.010 },
      indice: 'Elle ne remonte qu’après une longue séance au bord d’une eau claire.' },
    { id: 'roi-des-vairons', nom: 'Roi des Vairons', rarete: 'rare', secret: true,
      forme: 'classique', motif: 'irise',
      cm: [14, 26],  c: ['#6f8f7a', '#f0f4e0', '#f5c93a'],
      condition: { eau: 'claire', prise: { vairon: 15 }, chance: 0.030 },
      indice: 'Il ne sort que pour qui a déjà pris quinze vairons.' },
    { id: 'poisson-horloge', nom: 'Poisson-Horloge', rarete: 'legende', secret: true,
      forme: 'rond', motif: 'metal',
      cm: [18, 42],  c: ['#c9a24a', '#f2e2b0', '#3a2f18'],
      condition: { eau: 'claire', canne: 'doree', chance: 0.008 },
      indice: 'Seule la Canne Dorée le décide à mordre.' },
    { id: 'poisson-miroir', nom: 'Poisson-Miroir', rarete: 'legende', secret: true,
      forme: 'plat', motif: 'metal',
      cm: [30, 70],  c: ['#dfe8f2', '#ffffff', '#a8b8c8'],
      condition: { eau: 'claire', flotteur: 'doree', chance: 0.008 },
      indice: 'Il ne monte que vers le Flotteur Doré, où il se reconnaît.' },
    { id: 'noyau-vivant', nom: 'Noyau Vivant', rarete: 'special', secret: true,
      radioactif: true, forme: 'rond', motif: 'lueur',
      cm: [30, 80],  c: ['#1a2208', '#d8ff3a', '#ffffc0'],
      condition: { eau: 'radio', canne: 'radioactive', chance: 0.012 },
      indice: 'Il dort au fond des eaux fluo, et seule la Canne Radioactive va l’y chercher.' },
    { id: 'leviathan', nom: 'Léviathan d’Eau Douce', rarete: 'legende', secret: true,
      forme: 'long', motif: 'ecailles',
      cm: [200, 420], c: ['#1f2a3a', '#43586e', '#7ce0ff'],
      condition: { eau: 'toute', lancers: 40, chance: 0.004 },
      indice: 'On ne le croise qu’en restant pêcher bien au-delà du raisonnable.' }
  ];

  // Trois familles cohabitent dans la meme liste :
  //   - les especes de base, qui peuplent le carnet des le depart ;
  //   - les evolutions, annoncees au carnet mais muettes tant qu'on ne
  //     les a pas fait eclore ;
  //   - les secretes, qui n'existent nulle part avant d'avoir mordu.

  function estBase(f) { return !f.evolueDe && !f.secret; }

  // Les deux viviers de base : l'eau claire et l'eau irradiee.
  function vivier(radioactif) {
    return POISSONS.filter(function (f) {
      return estBase(f) && !!f.radioactif === !!radioactif;
    });
  }

  // Les evolutions de cette eau-la. Sans argument, toutes.
  function evolutions(radioactif) {
    return POISSONS.filter(function (f) {
      if (!f.evolueDe) return false;
      if (radioactif === undefined) return true;
      return !!f.radioactif === !!radioactif;
    });
  }

  function secrets() { return POISSONS.filter(function (f) { return !!f.secret; }); }

  // L'evolution d'une espece, s'il y en a une.
  function evolutionDe(id) {
    for (var i = 0; i < POISSONS.length; i++) {
      if (POISSONS[i].evolueDe === id) return POISSONS[i];
    }
    return null;
  }

  // Ce que le carnet affiche d'office : tout sauf les secretes. C'est ce
  // total-la qu'on montre au joueur, pour ne pas trahir le reste.
  function publiques() { return POISSONS.filter(function (f) { return !f.secret; }); }

  function parId(id) {
    for (var i = 0; i < POISSONS.length; i++) if (POISSONS[i].id === id) return POISSONS[i];
    return null;
  }

  function rarete(cle) {
    for (var i = 0; i < RARETES.length; i++) if (RARETES[i].cle === cle) return RARETES[i];
    return RARETES[0];
  }

  // Le flotteur tire la chance vers le haut : a bonus egal a 1, le commun
  // se rarefie et le legendaire devient courant.
  var PENTE = { commun: -0.6, peu: 0.2, rare: 1.5, legende: 4 };

  // Un tirage pondere par la rarete : les Legendaires restent des
  // evenements, sauf a s'equiper d'un bon flotteur. "debloque" dit si une
  // evolution a deja eclos : tant que non, elle ne nage pas.
  function tirer(bonus, radioactif, debloque) {
    var b = Math.max(0, Math.min(1, bonus || 0));
    var pool = vivier(radioactif);
    if (debloque) {
      evolutions(radioactif).forEach(function (f) {
        if (debloque(f.id)) pool.push(f);
      });
    }
    var poids = pool.map(function (f) {
      var base = f.poids != null ? f.poids : rarete(f.rarete).poids;
      var pente = f.pente != null ? f.pente : (PENTE[f.rarete] || 0);
      return Math.max(0.0001, base * (1 + b * pente));
    });
    var total = poids.reduce(function (a, v) { return a + v; }, 0);
    var d = Math.random() * total;
    for (var i = 0; i < pool.length; i++) {
      d -= poids[i];
      if (d <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  // ---------- Les especes secretes ----------
  // Elles ne passent pas par le tirage ordinaire : on les propose avant
  // lui, chacune avec sa condition et sa chance propre. Rater leur tirage
  // ne coute rien — le poisson ordinaire suit derriere.

  function secretPossible(f, ctx) {
    var c = f.condition || {};
    if (c.eau && c.eau !== 'toute') {
      if (c.eau !== (ctx.irradie ? 'radio' : 'claire')) return false;
    }
    if (c.canne && ctx.canne !== c.canne) return false;
    if (c.flotteur && ctx.flotteur !== c.flotteur) return false;
    if (c.lancers && (ctx.lancers || 0) < c.lancers) return false;
    if (c.prise) {
      for (var id in c.prise) {
        var e = ctx.prises && ctx.prises[id];
        if (!e || e.n < c.prise[id]) return false;
      }
    }
    return true;
  }

  // Rend l'espece secrete qui mord, ou null la plupart du temps.
  function tirerSecret(ctx) {
    ctx = ctx || {};
    var poss = secrets().filter(function (f) { return secretPossible(f, ctx); });
    for (var i = 0; i < poss.length; i++) {
      if (Math.random() < (poss[i].condition.chance || 0)) return poss[i];
    }
    return null;
  }

  // Celles qui pourraient mordre ici et maintenant : de quoi souffler un
  // mot au joueur sans rien lui reveler.
  function secretsPossibles(ctx) {
    return secrets().filter(function (f) { return secretPossible(f, ctx || {}); });
  }

  // ---------- Les brillants ----------
  // Dix especes ont une seconde livree. Elle ne change rien au poids ni a
  // la rarete : c'est une couleur qu'on ne revoit pas de sitot.

  var CHANCE_SHINY = 120;

  var SHINYS = {
    'ablette':      ['#f2d9a0', '#fff8e4', '#c9a85e'],
    'gardon':       ['#c2a8e0', '#f4ecff', '#4fd13a'],
    'perche':       ['#c94a7a', '#f8dce8', '#f5c93a'],
    'carpe':        ['#4a6f8a', '#c8dde8', '#2f4a5c'],
    'truite':       ['#5a9ed8', '#e0f0ff', '#7ce0c0'],
    'brochet':      ['#8a5ac0', '#e4d4f8', '#5c3a88'],
    'silure':       ['#d8cfc0', '#fdf8ee', '#a08a6a'],
    'axolotl':      ['#8ae0d0', '#e0fff8', '#3aa890'],
    'poisson-lune': ['#b48ae0', '#efe4ff', '#7cc8ff'],
    'prisme':       ['#ffd166', '#fff8e0', '#8bf58b']
  };

  function aShiny(id) { return !!SHINYS[id]; }

  function especesShiny() {
    return POISSONS.filter(function (f) { return !!SHINYS[f.id]; });
  }

  // "bonus" est le facteur de l'hamecon monte : a 4, la chance passe
  // d'une sur cent vingt a une sur trente.
  function estShiny(id, bonus) {
    var sur = Math.max(1, Math.round(CHANCE_SHINY / Math.max(1, bonus || 1)));
    return aShiny(id) && Math.floor(Math.random() * sur) === 0;
  }

  // La taille d'une prise, tiree dans la fourchette de l'espece. On
  // multiplie deux hasards : les tres gros specimens restent rares.
  function taille(p) {
    var k = Math.random() * Math.random();
    return Math.round(p.cm[0] + (p.cm[1] - p.cm[0]) * (1 - k));
  }

  // ---------- Le poids ----------
  // La masse suit le cube de la longueur — c'est la loi des poissons — et
  // un coefficient de carrure propre a chaque silhouette : une anguille
  // de 80 cm ne pese pas ce que pese une carpe de 80 cm.
  var CARRURE = {
    classique: 1, long: 0.75, plat: 1.35, rond: 2.1, raie: 1.25,
    meduse: 0.5, crabe: 0.7, ecrevisse: 0.45, anguille: 0.4, triton: 0.45
  };

  function poids(f, cm) {
    var c = CARRURE[f.forme] || 1;
    var kg = Math.max(0.005, 15 * Math.pow(cm / 100, 3) * c);
    // Sous le kilo on garde le gramme : sans cela un vairon de 5 cm et un
    // de 11 cm pesaient exactement pareil.
    return kg < 1 ? Math.round(kg * 1000) / 1000 : Math.round(kg * 100) / 100;
  }

  // Ce qu'on affiche au joueur : des grammes tant qu'on est sous le kilo.
  function poidsTexte(kg) {
    if (kg < 1) return Math.round(kg * 1000) + ' g';
    return (Math.round(kg * 100) / 100) + ' kg';
  }

  // Ce que ce poids represente comme resistance au bout de la ligne, de 0
  // (rien du tout) a 1 (un monstre de 150 kg). L'echelle est
  // logarithmique : en lineaire, vingt-quatre especes sur trente se
  // valaient et la canne ne servait a rien.
  var ECHELLE = Math.log10(1 + 160 / 0.05);

  function charge(kg) {
    var v = Math.log10(1 + Math.max(0, kg) / 0.05) / ECHELLE;
    return Math.max(0, Math.min(1, v));
  }

  // Le poids maximal qu'une espece peut atteindre : sert aux fiches.
  function poidsMax(f) { return poids(f, f.cm[1]); }

  // ==========================================================
  //  Le dessin
  // ==========================================================

  function ovale(p, cx, cy, rx, ry, col) {
    for (var dy = -ry; dy <= ry; dy++) {
      var k = 1 - (dy / (ry + 0.5)) * (dy / (ry + 0.5));
      if (k <= 0) continue;
      var w = Math.round(rx * Math.sqrt(k));
      p(cx - w, cy + dy, w * 2 + 1, 1, col);
    }
  }

  function queue(p, x0, cy, larg, haut, col) {
    for (var i = 0; i < larg; i++) {
      var h = Math.round(1 + (haut - 1) * (i / (larg - 1)));
      p(x0 + i, cy - h, 1, h * 2 + 1, col);
    }
  }

  function motifs(p, f, cx, cy, rx, ry) {
    var i;
    if (f.motif === 'rayures') {
      for (i = -rx + 3; i < rx - 1; i += 4) p(cx + i, cy - ry + 1, 1, ry * 2 - 1, f.c[2]);
    } else if (f.motif === 'points' || f.motif === 'ecailles') {
      for (i = 0; i < 9; i++) {
        var ang = i * 2.4;
        var px = Math.round(cx + Math.cos(ang) * rx * 0.55);
        var py = Math.round(cy + Math.sin(ang) * ry * 0.55);
        p(px, py, f.motif === 'points' ? 1 : 2, 1, f.c[2]);
      }
    } else if (f.motif === 'irise') {
      var arc = ['#ff6b8a', '#ffd166', '#8bf58b', '#7cc8ff', '#c79bff'];
      for (i = 0; i < arc.length; i++) p(cx - rx + 2 + i * 3, cy - ry + 1, 2, ry * 2 - 1, arc[i]);
    } else if (f.motif === 'metal') {
      p(cx - rx + 2, cy - ry + 1, rx * 2 - 3, 2, '#ffffff');
      p(cx - rx + 2, cy + 1, rx * 2 - 3, 1, 'rgba(255,255,255,.45)');
    } else if (f.motif === 'lueur') {
      for (i = -rx + 3; i < rx - 1; i += 5) {
        p(cx + i, cy - 2, 2, 2, f.c[2]);
        p(cx + i, cy + 2, 1, 1, f.c[2]);
      }
    } else if (f.motif === 'moustache') {
      p(cx - rx - 3, cy - 1, 4, 1, f.c[2]);
      p(cx - rx - 3, cy + 2, 4, 1, f.c[2]);
    }
  }

  function oeil(p, x, y, sombre) {
    p(x, y, 2, 2, sombre ? '#f2f6ff' : '#141826');
    p(x, y, 1, 1, sombre ? '#141826' : '#f2f6ff');
  }

  function dessiner(p, f) {
    var cx = 17, cy = 11;

    if (f.forme === 'classique' || f.forme === 'long' || f.forme === 'plat') {
      var rx = f.forme === 'long' ? 12 : (f.forme === 'plat' ? 8 : 10);
      var ry = f.forme === 'plat' ? 7 : (f.forme === 'long' ? 3 : 5);
      cx = 16;
      ovale(p, cx, cy, rx, ry, f.c[0]);
      ovale(p, cx + 1, cy + Math.max(1, ry - 2), rx - 3, Math.max(1, ry - 3), f.c[1]);
      // nageoire dorsale et ventrale
      p(cx - 3, cy - ry - 2, 8, 3, f.c[2]);
      p(cx - 1, cy + ry, 5, 2, f.c[2]);
      motifs(p, f, cx, cy, rx, ry);
      queue(p, cx + rx, cy, 6, ry, f.c[2]);
      oeil(p, cx - rx + 2, cy - 2, f.motif === 'lueur');
      return;
    }

    if (f.forme === 'rond') {
      ovale(p, 16, cy, 8, 8, f.c[0]);
      ovale(p, 16, cy + 3, 6, 4, f.c[1]);
      motifs(p, f, 16, cy, 8, 8);
      // les piquants
      for (var i = 0; i < 9; i++) {
        var a = i * 0.7;
        p(Math.round(16 + Math.cos(a) * 9), Math.round(cy + Math.sin(a) * 9), 2, 1, f.c[2]);
      }
      queue(p, 24, cy, 5, 4, f.c[2]);
      oeil(p, 10, cy - 3);
      return;
    }

    if (f.forme === 'raie') {
      for (var dy = -7; dy <= 7; dy++) {
        var w = Math.round(13 * (1 - Math.abs(dy) / 8));
        p(16 - w, cy + dy, w * 2, 1, f.c[0]);
      }
      ovale(p, 15, cy, 5, 4, f.c[1]);
      motifs(p, f, 16, cy, 10, 5);
      p(28, cy, 7, 1, f.c[2]);                    // la longue queue
      p(33, cy - 1, 2, 3, f.c[2]);
      oeil(p, 11, cy - 3);
      return;
    }

    if (f.forme === 'meduse') {
      ovale(p, 17, cy - 2, 9, 6, f.c[0]);
      p(8, cy - 2, 19, 4, f.c[0]);
      p(9, cy + 1, 17, 1, f.c[1]);
      for (var t = 0; t < 6; t++) {
        var x = 10 + t * 3;
        var h = 5 + ((t % 3) * 2);
        p(x, cy + 2, 1, h, f.c[2]);
        p(x + (t % 2 ? 1 : -1), cy + 2 + h, 1, 2, f.c[2]);
      }
      p(12, cy - 5, 4, 2, f.c[1]);
      return;
    }

    if (f.forme === 'crabe') {
      ovale(p, 18, cy, 8, 5, f.c[0]);
      p(11, cy - 1, 15, 3, f.c[1]);
      // pinces
      p(7, cy - 5, 5, 4, f.c[0]); p(6, cy - 6, 3, 2, f.c[2]);
      p(7, cy + 2, 5, 4, f.c[0]); p(6, cy + 5, 3, 2, f.c[2]);
      // pattes
      for (var l = 0; l < 3; l++) {
        p(18 + l * 4, cy - 8, 1, 4, f.c[2]);
        p(18 + l * 4, cy + 5, 1, 4, f.c[2]);
      }
      oeil(p, 13, cy - 3); oeil(p, 13, cy + 2);
      return;
    }

    if (f.forme === 'ecrevisse') {
      ovale(p, 20, cy, 9, 4, f.c[0]);
      p(13, cy - 2, 16, 4, f.c[1]);
      for (var s = 0; s < 4; s++) p(18 + s * 3, cy - 4, 1, 9, f.c[2]);
      p(6, cy - 5, 7, 4, f.c[0]); p(5, cy - 6, 3, 3, f.c[2]);
      p(6, cy + 2, 7, 4, f.c[0]); p(5, cy + 4, 3, 3, f.c[2]);
      queue(p, 29, cy, 5, 4, f.c[2]);
      p(9, cy - 8, 1, 4, f.c[2]); p(11, cy - 8, 1, 4, f.c[2]);
      oeil(p, 14, cy - 2);
      return;
    }

    if (f.forme === 'anguille') {
      for (var x2 = 4; x2 < 31; x2++) {
        var y2 = cy + Math.round(Math.sin((x2 - 4) / 4.2) * 4);
        p(x2, y2 - 2, 1, 5, f.c[0]);
        p(x2, y2 + 1, 1, 2, f.c[1]);
        if (x2 % 5 === 0) p(x2, y2 - 4, 1, 2, f.c[2]);
      }
      p(31, cy + Math.round(Math.sin(27 / 4.2) * 4) - 3, 3, 7, f.c[2]);
      motifs(p, f, 16, cy, 10, 3);
      oeil(p, 5, cy + Math.round(Math.sin(0.24) * 4) - 1);
      return;
    }

    if (f.forme === 'triton') {
      ovale(p, 17, cy, 11, 3, f.c[0]);
      ovale(p, 18, cy + 2, 9, 1, f.c[1]);
      p(9, cy - 3, 7, 6, f.c[0]);                 // la grosse tete
      // les branchies en panache
      for (var b = 0; b < 3; b++) {
        p(11 + b * 2, cy - 6, 1, 3, f.c[2]);
        p(10 + b * 2, cy - 7, 2, 1, f.c[2]);
        p(11 + b * 2, cy + 4, 1, 3, f.c[2]);
      }
      p(14, cy + 3, 2, 3, f.c[0]); p(22, cy + 3, 2, 3, f.c[0]);   // les pattes
      queue(p, 28, cy, 5, 4, f.c[0]);
      oeil(p, 11, cy - 1);
      return;
    }

    // Repli : un poisson ordinaire, si une forme inconnue apparaissait.
    ovale(p, 16, cy, 10, 5, f.c[0]);
    queue(p, 26, cy, 6, 5, f.c[2]);
    oeil(p, 8, cy - 2);
  }

  // Le cerne sombre, comme pour les sprites de balade.
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

  // Trois eclats blancs, pour qu'un brillant se voie au premier coup
  // d'oeil meme reduit a la taille d'une vignette.
  function eclat(x, cx, cy, t) {
    x.fillStyle = 'rgba(255,255,255,.95)';
    x.fillRect(cx - t, cy, t * 2 + 1, 1);
    x.fillRect(cx, cy - t, 1, t * 2 + 1);
  }

  var cache = {};

  function feuille(id, shiny) {
    var brillant = !!(shiny && SHINYS[id]);
    var cle = brillant ? id + '|s' : id;
    if (cache[cle]) return cache[cle];
    var f = parId(id);
    if (!f) return null;
    if (brillant) {
      var copie = {};
      for (var k in f) copie[k] = f[k];
      copie.c = SHINYS[id];
      f = copie;
    }
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = H;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;
    dessiner(function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    }, f);
    cerner(x);
    if (brillant) { eclat(x, 9, 5, 2); eclat(x, 24, 7, 1); eclat(x, 29, 16, 2); }
    cache[cle] = { canvas: cv, L: L, H: H };
    return cache[cle];
  }

  // Une image utilisable dans une balise <img>, pour les listes en HTML.
  function url(id, shiny) {
    var f = feuille(id, shiny);
    return f ? f.canvas.toDataURL('image/png') : '';
  }

  window.POISSONS = {
    LISTE: POISSONS, RARETES: RARETES, CARRURE: CARRURE,
    SHINYS: SHINYS, CHANCE_SHINY: CHANCE_SHINY,
    vivier: vivier, evolutions: evolutions, secrets: secrets,
    evolutionDe: evolutionDe, publiques: publiques, estBase: estBase,
    tirerSecret: tirerSecret, secretsPossibles: secretsPossibles,
    aShiny: aShiny, especesShiny: especesShiny, estShiny: estShiny,
    parId: parId, rarete: rarete, tirer: tirer, taille: taille,
    poids: poids, poidsMax: poidsMax, poidsTexte: poidsTexte, charge: charge,
    feuille: feuille, url: url, L: L, H: H,
    vider: function () { cache = {}; }
  };
})();
