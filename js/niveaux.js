// Le niveau du joueur : un cercle sur le flanc droit du pad, et la page
// des niveaux avec leurs recompenses.
//
// L'XP ne se stocke pas : elle se deduit de la progression (Dinders,
// poissons, requins, mondes, scans, badges...). Rien a brancher dans
// chaque jeu, et une remise a zero la fait redescendre d'elle-meme. Le
// profil ne retient que les recompenses deja reclamees.
(function () {
  var DP = window.DP;
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
  //  L'XP
  // ==========================================================

  function somme(obj, champ) {
    var n = 0;
    for (var k in obj) if (obj[k]) n += champ ? (obj[k][champ] || 0) : (obj[k] || 0);
    return n;
  }

  var XP_PALIER = [0, 5, 8, 12, 18, 25];

  // Chaque source : ce qu'on compte, et ce que vaut une unite.
  var SOURCES = [
    { id: 'dinders', nom: 'Dinders collectés', pts: 100,
      compte: function () { return DP.owned().length; } },
    { id: 'especes', nom: 'Espèces de poissons', pts: 20,
      compte: function () { return Object.keys(DP.prises()).length; } },
    { id: 'prises', nom: 'Poissons pêchés', pts: 3,
      compte: function () { return somme(DP.prises(), 'n'); } },
    { id: 'brillants', nom: 'Poissons brillants', pts: 60,
      compte: function () { return DP.shinys(); } },
    { id: 'requins', nom: 'Requins abattus', pts: 60,
      compte: function () { return somme(DP.requins(), 'n'); } },
    { id: 'mondes', nom: 'Mondes visités', pts: 80,
      compte: function () { return DP.astresVus().length; } },
    { id: 'scans', nom: 'Scans du Téléportail', pts: 15,
      compte: function () { return Object.keys(DP.scans()).length; } },
    // Une creature rapporte selon son palier : 5 XP pour la plus faible,
    // 25 pour la plus redoutable.
    { id: 'abattues', nom: 'Créatures abattues', pts: null,
      compte: function () { return somme(DP.abattus()); },
      xp: function () {
        var V = window.ODYVIE, ab = DP.abattus(), t = 0;
        for (var id in ab) {
          var v = V && V.parId(id);
          t += (ab[id] || 0) * XP_PALIER[v && v.palier ? Math.min(5, v.palier) : 1];
        }
        return t;
      },
      affiche: function (n) { return n + ' × 5–25'; } },
    { id: 'founder', nom: 'Niveaux de The Founder War', pts: 150,
      compte: function () { return DP.fwNiveau(); } },
    { id: 'failles', nom: 'Failles contenues', pts: 250,
      compte: function () { return DP.faillesContenues(); } },
    { id: 'artefacts', nom: 'Artefacts trouvés', pts: 120,
      compte: function () { return window.ARTEFACTS ? window.ARTEFACTS.trouves().length : 0; } },
    { id: 'objets', nom: 'Objets trouvés', pts: 150,
      compte: function () {
        return [DP.aLaCanne(), DP.aLArme(), DP.aLaTelecommande()].filter(Boolean).length;
      } },
    // Chaque gardien vaut son poids : 100 XP pour celui de Mercure,
    // 1 400 pour celui de Neptune.
    { id: 'gardiens', nom: 'Gardiens vaincus', pts: null,
      compte: function () {
        var B = window.BOSS;
        return B ? B.ORDRE.filter(function (id) { return B.vaincu(id); }).length : 0;
      },
      xp: function () {
        var B = window.BOSS;
        return B ? B.ORDRE.reduce(function (t, id) {
          return t + (B.vaincu(id) ? B.GARDIENS[id].xp || 0 : 0);
        }, 0) : 0;
      },
      sur: function () { return window.BOSS ? window.BOSS.ORDRE.length : 0; } },
    { id: 'badges', nom: 'Badges obtenus', pts: 50,
      compte: function () { return window.BADGES ? window.BADGES.obtenus().length : 0; } },
    { id: 'revetements', nom: 'Revêtements gagnés', pts: 40,
      compte: function () {
        // Ni l'acier d'origine, ni ceux que donnent les niveaux : l'XP ne
        // doit pas se nourrir de ses propres recompenses.
        var A = window.ARME;
        return DP.revetements().filter(function (id) {
          if (id === 'origine') return false;
          return !(A && A.revetement(id).niveau);
        }).length;
      } },
    { id: 'arme', nom: 'Améliorations du pistolet', pts: 50,
      compte: function () {
        return DP.aLArme() ? (DP.armeNiveau() - 1) + (DP.armeNiveau('odyssee') - 1) : 0;
      } }
  ];

  function detailXP() {
    return SOURCES.map(function (s) {
      var n = 0;
      var x = 0;
      try { n = s.compte() || 0; x = s.xp ? s.xp() : n * s.pts; } catch (e) { n = 0; x = 0; }
      return { id: s.id, nom: s.nom, n: n, pts: s.pts, xp: x, sur: s.sur ? s.sur() : null,
               affiche: s.affiche ? s.affiche(n) : null };
    });
  }

  function xp() {
    return detailXP().reduce(function (t, d) { return t + d.xp; }, 0);
  }

  // ==========================================================
  //  Les paliers
  // ==========================================================
  // Cinq cents niveaux, et une etoile tous les cent. Le niveau 10 tombe
  // vers 1 250 XP, le 30 vers 10 000, le 100 vers 62 000 ; ensuite chaque
  // niveau coute 900 XP de plus, jusqu'au 500 vers 422 000. Au-dela du 30,
  // il faut revenir chasser, pecher et scanner : c'est le long cours.

  var MAX = 500;
  var SEUILS = [0, 0];

  function calculerSeuil(n) {
    if (n <= 30) return Math.round(25 * Math.pow(n - 1, 1.78) / 5) * 5;
    if (n <= 100) {
      // Chaque niveau coute au moins autant que le precedent, et un peu
      // plus a chaque fois.
      var m = n - 30;
      return calculerSeuil(30) + Math.round((610 * m + 2 * m * (m - 1)) / 5) * 5;
    }
    return calculerSeuil(100) + 900 * (n - 100);
  }
  for (var sN = 2; sN <= MAX; sN++) SEUILS[sN] = calculerSeuil(sN);

  function seuil(n) { return n <= 1 ? 0 : SEUILS[Math.min(n, MAX)]; }

  function niveauDe(x) {
    // Recherche par dichotomie : cinq cents paliers, on ne les parcourt pas.
    var bas = 1, haut = MAX;
    while (bas < haut) {
      var mil = Math.ceil((bas + haut) / 2);
      if (x >= SEUILS[mil]) bas = mil; else haut = mil - 1;
    }
    return bas;
  }

  // Une etoile tous les cent niveaux.
  function etoiles(n) { return Math.floor(n / 100); }

  function etat() {
    var x = xp(), n = niveauDe(x);
    var bas = seuil(n), haut = n >= MAX ? bas : seuil(n + 1);
    return {
      xp: x, niveau: n, bas: bas, haut: haut,
      k: n >= MAX ? 1 : (x - bas) / Math.max(1, haut - bas)
    };
  }

  // ==========================================================
  //  Les recompenses
  // ==========================================================

  var TITRES = {
    1: 'Recrue', 5: 'Explorateur', 10: 'Aventurier', 15: 'Chasseur',
    20: 'Vétéran', 25: 'Maître des Dinders', 30: 'Légende du DinderPad',
    40: 'Globe-trotteur', 50: 'Conquérant des Gardiens', 60: 'Seigneur des Planètes',
    70: 'Maître du Système Solaire', 80: 'Gardien des Univers', 90: 'Mythe Vivant',
    100: 'Dinder Suprême', 150: 'Voyageur Stellaire', 200: 'Astre Double',
    250: 'Nébuleuse Vivante', 300: 'Triple Étoile', 350: 'Maître des Galaxies',
    400: 'Quadruple Étoile', 450: 'Au-delà des Univers', 500: 'Légende Éternelle'
  };

  function C(key, n) { return { type: 'credit', key: key, n: n }; }
  function N(n) { return { type: 'noyaux', n: n }; }
  function R(n) { return { type: 'roches', n: n }; }
  function V(id) { return { type: 'revetement', id: id }; }
  function T(n) { return { type: 'titre', nom: TITRES[n] }; }
  var D = { type: 'dinder' };
  function E(n) { return { type: 'etoile', n: n }; }

  var RECOMPENSES = {
    2:  [C('green', 3)],
    3:  [N(3)],
    4:  [R(3)],
    5:  [T(5), C('blue', 2)],
    6:  [C('green', 5)],
    7:  [N(5)],
    8:  [R(5)],
    9:  [C('gold', 1)],
    10: [T(10), V('galon'), C('blue', 3)],
    11: [C('green', 6)],
    12: [N(7)],
    13: [R(7)],
    14: [C('gold', 2)],
    15: [T(15), D],
    16: [C('green', 8)],
    17: [N(9)],
    18: [R(9)],
    19: [C('gold', 3)],
    20: [T(20), V('etoile'), C('gold', 4)],
    21: [C('green', 10)],
    22: [N(12)],
    23: [R(12)],
    24: [C('gold', 4)],
    25: [T(25), D],
    26: [C('blue', 6)],
    27: [N(15)],
    28: [R(15)],
    29: [C('gold', 5)],
    30: [T(30), V('couronne'), C('pink', 2)]
  };

  // Du 31 au 500 : une recompense qui tourne (credits, Noyaux, Roches,
  // Omniversels) et grossit avec le niveau ; un Dinder mystere aux niveaux
  // en 5 (35, 45...), un titre de temps en temps, des revetements aux
  // paliers, et une etoile tous les cent.
  //
  // Le Credit Temporel, lui, ne tombe qu'aux quarts de centaine — 50, 75,
  // 100... — et jamais plus d'un a la fois. C'est la monnaie de la rarete
  // la plus haute : elle doit se meriter. Les dizaines qui le donnaient
  // rendent desormais des Omniversels.
  var REV_PALIERS = { 50: 'aurore', 75: 'singularite', 100: 'supreme',
                      200: 'nova', 300: 'constellation', 400: 'voie-lactee', 500: 'big-bang' };
  for (var nv = 31; nv <= MAX; nv++) {
    var m = nv - 30, lot = [];
    if (nv % 100 === 0) lot.push(E(nv / 100));
    if (TITRES[nv]) lot.push(T(nv));
    if (REV_PALIERS[nv]) lot.push(V(REV_PALIERS[nv]));
    if (nv % 25 === 0) lot.push(C('pink', 1));
    else if (nv % 10 === 0) lot.push(C('gold', 5 + Math.floor(m / 30)));
    else if (nv % 10 === 5) { lot.push(D); lot.push(C('blue', 4 + Math.floor(m / 20))); }
    else if (nv % 4 === 1) lot.push(C('green', 10 + Math.round(m / 6)));
    else if (nv % 4 === 2) lot.push(N(12 + Math.round(m / 5)));
    else if (nv % 4 === 3) lot.push(R(12 + Math.round(m / 5)));
    else lot.push(C('gold', 3 + Math.floor(m / 25)));
    RECOMPENSES[nv] = lot;
  }

  function libelle(r) {
    if (r.type === 'credit') {
      var nom = DP.CREDITS[r.key].name;
      return r.n + ' ' + (r.n > 1 ? nom.replace(/^Crédit /, 'Crédits ') + 's' : nom);
    }
    if (r.type === 'noyaux') return r.n + ' Noyaux Lumithiques';
    if (r.type === 'roches') return r.n + ' Roches Solaires';
    if (r.type === 'revetement') {
      var A = window.ARME;
      return 'Revêtement ' + (A ? A.revetement(r.id).nom : r.id);
    }
    if (r.type === 'dinder') return 'Un Dinder mystère';
    if (r.type === 'titre') return 'Titre « ' + r.nom + ' »';
    if (r.type === 'etoile') return 'Étoile ' + '★'.repeat(r.n);
    return '';
  }

  // Donne une recompense ; rend ce qui a vraiment ete recu (le Dinder
  // mystere retombe sur des credits quand la collection est complete).
  function donner(r) {
    if (r.type === 'credit') { DP.earn(r.key, r.n); return libelle(r); }
    if (r.type === 'noyaux') { DP.gagnerNoyaux(r.n); return libelle(r); }
    if (r.type === 'roches') { DP.gagnerRoches(r.n); return libelle(r); }
    if (r.type === 'revetement') { DP.acquerirRevetement(r.id); return libelle(r); }
    if (r.type === 'titre' || r.type === 'etoile') return libelle(r);
    if (r.type === 'dinder') {
      var d = DP.draw();
      if (!d) { DP.earn('gold', 3); return '3 Crédits Omniversels (collection complète)'; }
      DP.collect(d.id);
      if (DP.markNew) DP.markNew(d.id);
      montrerDinder(d);
      return 'Dinder : ' + d.name;
    }
    return '';
  }

  // Un Dinder mystere ne tombe pas dans une liste : il arrive en grand,
  // dans une gerbe de rayons, comme au sortir d'une Dindise.
  function montrerDinder(d) {
    var pad = document.querySelector('.pad');
    if (!pad) return;
    var carte = el('div', 'nv-dinder');
    carte.dataset.rarete = DP.rarityKey(d.rarity);
    carte.appendChild(el('div', 'nv-dinder-rayons'));
    carte.appendChild(el('span', 'nv-dinder-haut', 'Dinder mystère'));
    var im = el('img', 'nv-dinder-img');
    im.src = DP.dinderImg(d.id);
    im.alt = '';
    carte.appendChild(im);
    carte.appendChild(el('strong', 'nv-dinder-nom', d.name));
    if (d.form) carte.appendChild(el('span', 'nv-dinder-forme', d.form));
    carte.appendChild(el('span', 'nv-dinder-rarete', d.rarity));
    for (var i = 0; i < 12; i++) {
      var p = el('span', 'nv-dinder-eclat');
      p.style.setProperty('--a', (i / 12 * 360) + 'deg');
      carte.appendChild(p);
    }
    pad.appendChild(carte);
    setTimeout(function () { carte.classList.add('is-sortie'); }, reduit ? 1600 : 3200);
    setTimeout(function () { carte.remove(); }, reduit ? 1800 : 3700);
  }

  function reclame(n) { return DP.niveauxReclames().indexOf(n) !== -1; }

  function aReclamer(n) {
    n = n || etat().niveau;
    var faits = {}, out = [];
    DP.niveauxReclames().forEach(function (k) { faits[k] = true; });
    for (var i = 2; i <= n; i++) if (!faits[i]) out.push(i);
    return out;
  }

  function reclamer(n) {
    if (n > etat().niveau || !RECOMPENSES[n] || !DP.reclamerNiveau(n)) return null;
    return RECOMPENSES[n].map(donner);
  }

  // Le titre porte : le plus haut deja reclame.
  function titre() {
    var t = TITRES[1];
    Object.keys(TITRES).forEach(function (k) {
      k = +k;
      if (k > 1 && reclame(k)) t = TITRES[k];
    });
    return t;
  }

  // ==========================================================
  //  Le cercle du flanc droit
  // ==========================================================

  var cercle = null, banniere = null;

  // Le bandeau de l'accueil : le titre du joueur a gauche, ses etoiles a
  // droite. Il ne s'affiche que sur l'ecran d'accueil.
  function construireBanniere() {
    var pad = document.querySelector('.pad');
    if (!pad || banniere) return;
    banniere = el('div', 'pad-titre');
    banniere.appendChild(el('span', 'pad-titre-nom', ''));
    banniere.appendChild(el('span', 'pad-titre-etoiles', ''));
    pad.appendChild(banniere);
  }

  function majBanniere() {
    if (!banniere) return;
    var e = etat(), et = etoiles(e.niveau);
    banniere.querySelector('.pad-titre-nom').textContent = titre();
    var coin = banniere.querySelector('.pad-titre-etoiles');
    coin.textContent = et ? '★'.repeat(et) : '';
    coin.title = et ? et + (et > 1 ? ' étoiles' : ' étoile') + ' — un niveau 100 chacune' : '';
    banniere.classList.toggle('a-etoiles', et > 0);
  }

  function construireCercle() {
    var pad = document.querySelector('.pad');
    if (!pad || cercle) return;
    cercle = el('a', 'pad-niveau');
    cercle.href = '#niveaux';
    cercle.setAttribute('aria-label', 'Niveau du joueur');
    var anneau = el('span', 'pad-niveau-anneau');
    var coeur = el('span', 'pad-niveau-coeur');
    coeur.appendChild(el('span', 'pad-niveau-niv', 'NIV'));
    coeur.appendChild(el('span', 'pad-niveau-etoiles', ''));
    coeur.appendChild(el('strong', 'pad-niveau-n', '1'));
    anneau.appendChild(coeur);
    cercle.appendChild(anneau);
    cercle.appendChild(el('span', 'pad-niveau-alerte', '!'));
    pad.appendChild(cercle);
    construireBanniere();
    majCercle();
  }

  function majCercle() {
    if (!cercle) return;
    var e = etat();
    cercle.style.setProperty('--k', e.k.toFixed(3));
    var n = cercle.querySelector('.pad-niveau-n');
    if (n.textContent !== String(e.niveau)) n.textContent = String(e.niveau);
    var et = etoiles(e.niveau);
    cercle.querySelector('.pad-niveau-etoiles').textContent = '★'.repeat(et);
    cercle.classList.toggle('a-etoiles', et > 0);
    cercle.classList.toggle('is-long', e.niveau >= 100);
    var attente = aReclamer(e.niveau).length;
    cercle.classList.toggle('a-reclamer', attente > 0);
    // Un niveau pas encore vu : le cercle s'illumine jusqu'a la visite.
    cercle.classList.toggle('is-monte', e.niveau > DP.niveauVu());
    cercle.title = 'Niveau ' + e.niveau + ' · ' + e.xp + ' XP' +
                   (attente ? ' · ' + attente + ' récompense' + (attente > 1 ? 's' : '') + ' à réclamer' : '');
    majBanniere();
  }

  // ==========================================================
  //  La page des niveaux
  // ==========================================================

  function puce(r) {
    var p = el('span', 'nv-puce nv-puce--' + r.type);
    var A = window.ARME;
    if (r.type === 'credit') {
      var im = el('img', 'nv-puce-img');
      im.src = DP.creditImg(r.key); im.alt = '';
      p.appendChild(im);
      p.appendChild(el('span', null, '×' + r.n));
    } else if (r.type === 'noyaux') {
      p.appendChild(el('span', 'nv-puce-ico', '◈'));
      p.appendChild(el('span', null, r.n));
    } else if (r.type === 'roches') {
      p.appendChild(el('span', 'nv-puce-ico', '☀'));
      p.appendChild(el('span', null, r.n));
    } else if (r.type === 'revetement' && A) {
      var ia = el('img', 'nv-puce-arme');
      ia.src = A.url(r.id); ia.alt = '';
      p.appendChild(ia);
      p.appendChild(el('span', null, A.revetement(r.id).nom));
    } else if (r.type === 'dinder') {
      p.appendChild(el('span', 'nv-puce-ico', '?'));
      p.appendChild(el('span', null, 'Dinder mystère'));
    } else if (r.type === 'titre') {
      p.appendChild(el('span', 'nv-puce-ico', '♛'));
      p.appendChild(el('span', null, r.nom));
    } else if (r.type === 'etoile') {
      p.appendChild(el('span', 'nv-puce-ico', '★'.repeat(r.n)));
      p.appendChild(el('span', null, 'Étoile'));
    }
    p.title = libelle(r);
    return p;
  }

  function viewNiveaux(view) {
    var e = etat();
    var box = el('div', 'nv');

    // ---------- A gauche : le joueur ----------
    var gauche = el('div', 'nv-gauche');
    var grand = el('div', 'nv-cercle');
    grand.style.setProperty('--k', e.k.toFixed(3));
    var coeur = el('div', 'nv-cercle-coeur');
    coeur.appendChild(el('span', 'nv-cercle-niv', etoiles(e.niveau) ? '★'.repeat(etoiles(e.niveau)) : 'NIVEAU'));
    coeur.appendChild(el('strong', 'nv-cercle-n', String(e.niveau)));
    if (etoiles(e.niveau)) grand.classList.add('a-etoiles');
    grand.appendChild(coeur);
    gauche.appendChild(grand);
    gauche.appendChild(el('p', 'nv-nom', DP.currentProfile().name));
    gauche.appendChild(el('p', 'nv-titre', titre()));

    var barre = el('div', 'nv-barre');
    var plein = el('div', 'nv-barre-plein');
    plein.style.width = (e.k * 100).toFixed(1) + '%';
    barre.appendChild(plein);
    gauche.appendChild(barre);
    gauche.appendChild(el('p', 'nv-xp', e.niveau >= MAX
      ? e.xp + ' XP · niveau maximum'
      : e.xp + ' / ' + e.haut + ' XP · encore ' + (e.haut - e.xp) + ' pour le niveau ' + (e.niveau + 1)));

    var attente = aReclamer();
    var tout = el('button', 'nv-tout', attente.length
      ? 'Tout réclamer (' + attente.length + ')' : 'Rien à réclamer');
    tout.type = 'button';
    tout.disabled = !attente.length;
    gauche.appendChild(tout);

    gauche.appendChild(el('p', 'nv-sous-titre', 'D’où vient ton XP'));
    var sources = el('div', 'nv-sources');
    detailXP().forEach(function (d) {
      var l = el('div', 'nv-source' + (d.n ? '' : ' is-vide'));
      l.appendChild(el('span', 'nv-source-nom', d.nom));
      l.appendChild(el('span', 'nv-source-n', d.affiche || (d.pts == null ? d.n + ' / ' + d.sur : d.n + ' × ' + d.pts)));
      l.appendChild(el('strong', 'nv-source-xp', d.xp + ' XP'));
      sources.appendChild(l);
    });
    gauche.appendChild(sources);
    box.appendChild(gauche);

    // ---------- A droite : les paliers, par centaine ----------
    // Cinq onglets, un par etoile : on ne dessine que la centaine choisie.
    var droite = el('div', 'nv-droite');
    var onglets = el('div', 'nv-onglets');
    droite.appendChild(onglets);
    var liste = el('div', 'nv-liste');
    droite.appendChild(liste);
    box.appendChild(droite);
    view.appendChild(box);
    var cartes = {};
    var siecle = 0;

    function construireSiecle(k) {
      siecle = k;
      liste.textContent = '';
      cartes = {};
      onglets.querySelectorAll('.nv-onglet').forEach(function (o, i) {
        o.classList.toggle('is-actif', i === k);
      });
      for (var n = k * 100 + 1; n <= (k + 1) * 100; n++) {
        var c = el('div', 'nv-carte' + (n % 100 === 0 ? ' nv-carte--etoile' : ''));
        c.dataset.niveau = n;
        var tete = el('div', 'nv-carte-tete');
        tete.appendChild(el('span', 'nv-carte-n', 'Niv. ' + n));
        tete.appendChild(el('span', 'nv-carte-seuil', seuil(n) + ' XP'));
        c.appendChild(tete);
        var puces = el('div', 'nv-puces');
        if (n === 1) puces.appendChild(puce({ type: 'titre', nom: TITRES[1] }));
        (RECOMPENSES[n] || []).forEach(function (r) { puces.appendChild(puce(r)); });
        c.appendChild(puces);
        c.appendChild(el('span', 'nv-carte-action'));
        liste.appendChild(c);
        cartes[n] = c;
      }
      liste.scrollTop = 0;
    }

    for (var k = 0; k < MAX / 100; k++) {
      (function (k) {
        var o = el('button', 'nv-onglet');
        o.type = 'button';
        o.appendChild(el('span', 'nv-onglet-etoile', '★'.repeat(k + 1)));
        o.appendChild(el('span', 'nv-onglet-txt', (k * 100 + 1) + '–' + ((k + 1) * 100)));
        o.addEventListener('click', function () { construireSiecle(k); majTout(); });
        onglets.appendChild(o);
      })(k);
    }

    var toast = el('div', 'nv-toast');
    toast.hidden = true;
    box.appendChild(toast);

    function majCarte(n, niv, faits) {
      var c = cartes[n], action = c.querySelector('.nv-carte-action');
      var atteint = n <= niv;
      var fait = n === 1 || !!faits[n];
      c.classList.toggle('is-atteint', atteint);
      c.classList.toggle('is-fait', atteint && fait);
      c.classList.toggle('is-dispo', atteint && !fait);
      c.classList.toggle('is-actuel', n === niv);
      action.textContent = '';
      if (!atteint) {
        action.appendChild(el('span', 'nv-verrou', '🔒'));
      } else if (fait) {
        action.appendChild(el('span', 'nv-ok', n === 1 ? 'Départ' : 'Reçu ✓'));
      } else {
        var b = el('button', 'nv-reclamer', 'Réclamer');
        b.type = 'button';
        b.addEventListener('click', function () { prendre([n]); });
        action.appendChild(b);
      }
    }

    function majTout() {
      var niv = etat().niveau, faits = {};
      DP.niveauxReclames().forEach(function (k) { faits[k] = true; });
      Object.keys(cartes).forEach(function (n) { majCarte(+n, niv, faits); });
      var reste = aReclamer(niv);
      onglets.querySelectorAll('.nv-onglet').forEach(function (o, i) {
        o.classList.toggle('a-reclamer', reste.some(function (r) { return Math.floor((r - 1) / 100) === i; }));
        o.classList.toggle('is-verrou', i * 100 + 1 > niv);
      });
      tout.disabled = !reste.length;
      tout.textContent = reste.length ? 'Tout réclamer (' + reste.length + ')' : 'Rien à réclamer';
      gauche.querySelector('.nv-titre').textContent = titre();
      majCercle();
    }

    var minuteToast = null;
    function annoncer(lignes) {
      toast.textContent = '';
      toast.appendChild(el('strong', 'nv-toast-titre', 'Récompenses reçues'));
      lignes.slice(0, 6).forEach(function (l) { toast.appendChild(el('span', 'nv-toast-ligne', '+ ' + l)); });
      if (lignes.length > 6) toast.appendChild(el('span', 'nv-toast-ligne', '… et ' + (lignes.length - 6) + ' de plus'));
      toast.hidden = false;
      toast.classList.remove('is-in'); void toast.offsetWidth; toast.classList.add('is-in');
      clearTimeout(minuteToast);
      minuteToast = setTimeout(function () { toast.hidden = true; }, 3200);
    }

    // Reclamer : la carte s'illumine, ses puces s'envolent, puis le
    // resume s'affiche.
    function prendre(niveaux) {
      var recu = [];
      niveaux.forEach(function (n) {
        var r = reclamer(n);
        if (!r) return;
        recu = recu.concat(r);
        var c = cartes[n];
        if (!c) return;
        c.classList.remove('is-prise'); void c.offsetWidth; c.classList.add('is-prise');
        c.querySelectorAll('.nv-puce').forEach(function (p, i) {
          var vol = p.cloneNode(true);
          vol.classList.add('nv-puce--vol');
          vol.style.left = p.offsetLeft + 'px';
          vol.style.top = p.offsetTop + 'px';
          vol.style.animationDelay = (i * 90) + 'ms';
          p.parentNode.appendChild(vol);
          setTimeout(function () { vol.remove(); }, 1200 + i * 90);
        });
      });
      majTout();
      if (recu.length) annoncer(recu);
    }

    tout.addEventListener('click', function () { prendre(aReclamer()); });

    // On ouvre la centaine de la premiere recompense a prendre, sinon
    // celle du niveau actuel, et on l'amene sous les yeux.
    var viser = aReclamer(e.niveau)[0] || e.niveau;
    construireSiecle(Math.min(MAX / 100 - 1, Math.floor((viser - 1) / 100)));
    majTout();
    var cible = cartes[viser];
    requestAnimationFrame(function () {
      if (cible && liste.scrollTo) liste.scrollTo({ top: Math.max(0, cible.offsetTop - liste.offsetTop - 12) });
    });

    // Un niveau gagne depuis la derniere visite : on le fete.
    var vu = DP.niveauVu();
    if (e.niveau > vu) {
      var fete = el('div', 'nv-fete');
      fete.appendChild(el('span', 'nv-fete-haut', vu + ' → ' + e.niveau));
      var nouvelle = etoiles(e.niveau) > etoiles(vu);
      if (nouvelle) {
        fete.classList.add('is-etoile');
        fete.appendChild(el('strong', 'nv-fete-etoile', '★'.repeat(etoiles(e.niveau))));
      }
      fete.appendChild(el('strong', 'nv-fete-titre', nouvelle ? 'NOUVELLE ÉTOILE !' : 'NIVEAU ' + e.niveau + ' !'));
      fete.appendChild(el('span', 'nv-fete-bas', attente.length
        ? attente.length + ' récompense' + (attente.length > 1 ? 's' : '') + ' t’attend' + (attente.length > 1 ? 'ent' : '')
        : 'Continue comme ça'));
      for (var i = 0; i < 14; i++) {
        var eclat = el('span', 'nv-fete-eclat');
        eclat.style.setProperty('--a', (i / 14 * 360) + 'deg');
        fete.appendChild(eclat);
      }
      box.appendChild(fete);
      setTimeout(function () { fete.classList.add('is-sortie'); }, reduit ? 1500 : 2300);
      setTimeout(function () { fete.remove(); }, reduit ? 1600 : 2800);
    }
    DP.voirNiveau(e.niveau);
    majCercle();
  }

  // ==========================================================
  //  La barre d'XP qui passe
  // ==========================================================
  // A chaque gain, une petite barre descend en haut de l'ecran : ce qui
  // l'a valu, combien, et la jauge qui se remplit. Elle s'efface seule.

  var flash = null, minuteFlash = null;

  function construireFlash() {
    var pad = document.querySelector('.pad');
    if (!pad || flash) return;
    flash = el('div', 'xp-flash');
    flash.setAttribute('aria-live', 'polite');
    flash.hidden = true;
    var haut = el('div', 'xp-flash-haut');
    haut.appendChild(el('span', 'xp-flash-raison', ''));
    haut.appendChild(el('strong', 'xp-flash-gain', ''));
    flash.appendChild(haut);
    var bas = el('div', 'xp-flash-bas');
    bas.appendChild(el('span', 'xp-flash-niv', ''));
    var jauge = el('div', 'xp-flash-jauge');
    jauge.appendChild(el('div', 'xp-flash-plein'));
    bas.appendChild(jauge);
    flash.appendChild(bas);
    flash.appendChild(el('div', 'xp-flash-monte', ''));
    pad.appendChild(flash);
  }

  function montrerGain(gain, raison, avant, apres) {
    construireFlash();
    if (!flash || document.body.classList.contains('is-locked')) return;
    var monte = apres.niveau > avant.niveau;
    var etoile = etoiles(apres.niveau) > etoiles(avant.niveau);
    flash.querySelector('.xp-flash-raison').textContent = raison;
    flash.querySelector('.xp-flash-gain').textContent = '+' + gain + ' XP';
    flash.querySelector('.xp-flash-niv').textContent =
      (etoiles(apres.niveau) ? '★'.repeat(etoiles(apres.niveau)) + ' ' : '') + 'Niv. ' + apres.niveau;
    var m = flash.querySelector('.xp-flash-monte');
    m.textContent = etoile ? '★ NOUVELLE ÉTOILE ! ★' : monte ? 'NIVEAU ' + apres.niveau + ' !' : '';
    flash.classList.toggle('is-monte', monte);
    flash.classList.toggle('is-etoile', etoile);
    var plein = flash.querySelector('.xp-flash-plein');
    // La jauge part d'ou l'on en etait ; si le niveau monte, elle file au
    // bout puis repart de zero.
    plein.style.transition = 'none';
    plein.style.width = (monte ? 0 : avant.k * 100).toFixed(1) + '%';
    flash.hidden = false;
    flash.classList.remove('is-in', 'is-out');
    void flash.offsetWidth;
    flash.classList.add('is-in');
    setTimeout(function () {
      plein.style.transition = '';
      plein.style.width = (apres.k * 100).toFixed(1) + '%';
    }, 120);
    clearTimeout(minuteFlash);
    minuteFlash = setTimeout(function () {
      flash.classList.add('is-out');
      minuteFlash = setTimeout(function () { flash.hidden = true; }, 400);
    }, monte ? 2800 : 1900);
  }

  // Les evenements qui font gagner de l'XP : on enveloppe les fonctions du
  // profil qui les enregistrent. Plusieurs gains rapproches (un gardien
  // vaincu, c'est un exploit, un scan et des Roches) n'en font qu'un, sous
  // la raison la plus marquante.
  var enAttente = null;

  function surveiller(nom, raison, prio) {
    var orig = DP[nom];
    if (typeof orig !== 'function') return;
    DP[nom] = function () {
      var avant = enAttente ? null : etat();
      var r = orig.apply(this, arguments);
      var lib = typeof raison === 'function' ? raison.apply(null, arguments) : raison;
      var pr = typeof prio === 'function' ? prio.apply(null, arguments) : prio;
      if (!enAttente) {
        enAttente = { avant: avant, raison: lib, prio: pr };
        setTimeout(viderAttente, 250);
      } else if (pr > enAttente.prio) {
        enAttente.raison = lib; enAttente.prio = pr;
      }
      return r;
    };
  }

  function viderAttente() {
    var a = enAttente;
    enAttente = null;
    if (!a) return;
    var apres = etat(), gain = apres.xp - a.avant.xp;
    if (gain > 0) montrerGain(gain, a.raison, a.avant, apres);
    majCercle();
  }

  function gardienDe(cle) {
    var B = window.BOSS;
    if (!B) return null;
    for (var i = 0; i < B.ORDRE.length; i++) {
      var g = B.GARDIENS[B.ORDRE[i]];
      if (B.exploitDe(g) === cle) return g;
    }
    return null;
  }

  surveiller('collect', 'Nouveau Dinder', 6);
  surveiller('noterPrise', function (id, cm, kg, brillant) {
    return brillant ? 'Poisson brillant !' : 'Poisson pêché';
  }, function (id, cm, kg, brillant) { return brillant ? 5 : 1; });
  surveiller('noterRequin', 'Requin abattu', 7);
  surveiller('noterAbattu', 'Créature abattue', 2);
  surveiller('noterScan', function (id) {
    var s = window.ODYVIE && window.ODYVIE.parId(id);
    return !s ? 'Scan' : s.objet ? 'Objet trouvé' : s.forme ? 'Curiosité découverte' : 'Créature scannée';
  }, 3);
  surveiller('noterAstre', 'Nouveau monde', 6);
  surveiller('compterExploit', function (cle) {
    var g = gardienDe(cle);
    return g ? 'Gardien vaincu : ' + g.nom : 'Exploit';
  }, function (cle) { return gardienDe(cle) ? 9 : 1; });
  surveiller('acquerirRevetement', 'Revêtement gagné', 4);
  surveiller('contenirFaille', 'Faille de sécurité contenue', 9);
  surveiller('noterArtefact', function (id) {
    var a = window.ARTEFACTS && window.ARTEFACTS.parId(id);
    return 'Artefact trouvé' + (a ? ' : ' + a.nom : '');
  }, 9);
  surveiller('monterArme', 'Pistolet amélioré', 4);
  surveiller('prendreCanne', 'Objet trouvé : la canne à pêche', 8);
  surveiller('prendreArme', 'Objet trouvé : le Pistolet Lumithique', 8);
  surveiller('prendreTelecommande', 'Objet trouvé : le Téléportail', 8);

  window.VIEWS = window.VIEWS || {};
  window.VIEWS['niveaux'] = { title: 'Niveaux', render: viewNiveaux };

  function demarrer() {
    construireCercle();
    window.addEventListener('hashchange', function () { setTimeout(majCercle, 30); });
    // Les jeux font gagner de l'XP sans changer d'adresse : un coup d'oeil
    // regulier suffit a garder le cercle juste.
    setInterval(function () { if (!document.hidden) majCercle(); }, 3000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();

  window.NIVEAUX = {
    SOURCES: SOURCES, RECOMPENSES: RECOMPENSES, TITRES: TITRES, MAX: MAX,
    xp: xp, detailXP: detailXP, seuil: seuil, niveauDe: niveauDe, etat: etat,
    etoiles: etoiles, montrerGain: montrerGain,
    aReclamer: aReclamer, reclamer: reclamer, titre: titre, libelle: libelle,
    majCercle: majCercle
  };
})();
