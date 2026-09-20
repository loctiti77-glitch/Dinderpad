// Donnees et etat partages du DinderPad.
// Ce fichier est charge par toutes les pages qui touchent aux credits, a la
// collection ou aux profils. Il expose un seul objet global : window.DP.
(function () {

  // ---------- Les quatre monnaies ----------
  // "units" = la valeur d'une carte, telle qu'affichee sur la page Credits.
  var CREDITS = {
    green: { name: 'Crédit Universel',   units: 3,  img: 'green.webp' },
    blue:  { name: 'Crédit Multiversel', units: 5,  img: 'blue.webp'  },
    gold:  { name: 'Crédit Omniversel',  units: 10, img: 'gold.webp'  },
    pink:  { name: 'Crédit Temporel',    units: 20, img: 'pink.webp'  }
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

  // ---------- Le prix d'une Dindise ----------
  // Exprime en nombre de cartes de chaque type. Les trois premiers font
  // 30 unites ; le Temporel paie a lui seul, bien qu'il n'en vaille que 20.
  var PRICE = { green: 10, blue: 6, gold: 3, pink: 1 };

  // Tant que ce drapeau est vrai, les achats ne retirent aucun credit.
  var UNLIMITED = true;

  // ---------- Le roster ----------
  // L'ordre fixe la place de chaque Dinder dans la collection : le premier
  // occupe toujours la case 01, meme s'il est obtenu en dernier.
  //
  // Deux details voulus, a ne pas "corriger" :
  //   - "SSt-03" s'ecrit bien avec un t, ce n'est pas une coquille de "SS-03" ;
  //   - "???" n'est pas un univers manquant : V, A et H n'en ont pas.
  var DINDERS = [
    { id: 'dr-islas-human-form',               name: 'Dr.Islas',      form: 'Human form',       rarity: 'Universel',    universe: 'SS-03',  desc: '' },
    { id: 'dr-islas-demicos-form',             name: 'Dr.Islas',      form: 'Demicos form',     rarity: 'Universel',    universe: 'SS-03',  desc: '' },
    { id: 'dr-islas-final-form',               name: 'Dr.Islas',      form: 'Final Form',       rarity: 'Temporel',     universe: 'SS-03',  desc: '' },
    { id: 'calder-veyne-veinburner',           name: 'Calder Veyne',  form: 'Veinburner',       rarity: 'Universel',    universe: 'SS-03',  desc: '' },
    { id: 'carl-sinars-cardinal-sin',          name: 'Carl Sinars',   form: 'Cardinal Sin',     rarity: 'Universel',    universe: 'SS-03',  desc: '' },
    { id: 'edgar-marks-grincrusher',           name: 'Edgar Marks',   form: 'Grincrusher',      rarity: 'Universel',    universe: 'SS-03',  desc: '' },
    { id: 'he-melt',                           name: 'He Melt',       form: '',                 rarity: 'Multiversel',  universe: 'SSt-03', desc: '' },
    { id: 'v',                                 name: 'V',             form: '',                 rarity: 'Temporel',     universe: '???',    desc: '' },
    { id: 'a',                                 name: 'A',             form: '',                 rarity: 'Temporel',     universe: '???',    desc: '' },
    { id: 'h',                                 name: 'H',             form: '',                 rarity: 'Temporel',     universe: '???',    desc: '' },
    { id: 'multinder',                         name: 'Multinder',     form: '',                 rarity: 'Universel',    universe: 'SS-03',  desc: '' },
    { id: 'gart-kervelor-king-of-karsovia',    name: 'Gart Kervelor', form: 'King of Karsovia', rarity: 'Multiversel',  universe: 'SSt-03', desc: '' }
  ];

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
      owned: []
    };
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

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }

  function byProfileId(id) {
    var list = (db && db.profiles) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function me() {
    var d = load();
    return byProfileId(d.current);
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

  // ---------- Collection ----------

  function owned()    { return me().owned.slice(); }
  function has(id)    { return me().owned.indexOf(id) !== -1; }
  function missing()  { return DINDERS.filter(function (d) { return !has(d.id); }); }
  function complete() { return missing().length === 0; }

  function collect(id) {
    var p = me();
    if (p.owned.indexOf(id) === -1) { p.owned.push(id); save(); }
  }

  // Tire un Dinder encore absent de la collection : une Dindise ne donne
  // jamais de doublon tant qu'il reste quelque chose a decouvrir.
  function draw() {
    var pool = missing();
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Vide la progression du profil courant, sans supprimer le profil.
  function reset() {
    var p = me();
    p.owned = [];
    p.credits = { green: 0, blue: 0, gold: 0, pink: 0 };
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

  window.DP = {
    CREDITS: CREDITS, ORDER: ORDER, PRICE: PRICE, DINDERS: DINDERS,
    SLOTS: SLOTS, UNLIMITED: UNLIMITED, RARITIES: RARITIES,
    rarityKey: rarityKey,

    profiles: profiles, currentProfile: currentProfile,
    createProfile: createProfile, switchProfile: switchProfile,
    renameProfile: renameProfile, deleteProfile: deleteProfile,

    creditCount: creditCount, canAfford: canAfford, spend: spend,
    owned: owned, has: has, missing: missing, complete: complete,
    collect: collect, draw: draw, reset: reset,
    markNew: markNew, takeNew: takeNew,
    dinderImg: dinderImg, dinderFull: dinderFull, creditImg: creditImg,

    byId: function (id) {
      for (var i = 0; i < DINDERS.length; i++) if (DINDERS[i].id === id) return DINDERS[i];
      return null;
    }
  };
})();
