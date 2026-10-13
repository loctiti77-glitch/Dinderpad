// Les cartes a collectionner : Dinder's Incommon Omniverse (DIO).
//
// Une carte par Dinder, par creature de l'Odyssee, par poisson et par
// boss (les gardiens des planetes et les requins). Rien n'est ecrit deux
// fois : le nom, l'image, le texte et les chiffres de chaque carte sont
// tires des donnees du jeu qu'elle represente.
//
// Ce fichier sert deux pages. Dans le DinderPad, il tient le Livret de
// cartes (Items). Sur boosters.html, la page annexe, c'est lui qui tire
// les boosters. Les deux lisent la meme sauvegarde.
(function () {
  var DP = window.DP;
  if (!DP) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  // ==========================================================
  //  Les raretes et les familles
  // ==========================================================

  var RARETES = [
    { cle: 'commune',    nom: 'Commune',    couleur: '#b8c4d0' },
    { cle: 'rare',       nom: 'Rare',       couleur: '#45b0ff' },
    { cle: 'epique',     nom: 'Épique',     couleur: '#c88cff' },
    { cle: 'legendaire', nom: 'Légendaire', couleur: '#ffd166' }
  ];

  var FAMILLES = [
    { id: 'dinders',   nom: 'Dinders',   un: 'Dinder' },
    { id: 'creatures', nom: 'Créatures', un: 'Créature' },
    { id: 'poissons',  nom: 'Poissons',  un: 'Poisson' },
    { id: 'boss',      nom: 'Boss',      un: 'Boss' }
  ];

  function rarete(cle) {
    for (var i = 0; i < RARETES.length; i++) if (RARETES[i].cle === cle) return RARETES[i];
    return RARETES[0];
  }

  function famille(id) {
    for (var i = 0; i < FAMILLES.length; i++) if (FAMILLES[i].id === id) return FAMILLES[i];
    return FAMILLES[0];
  }

  // ==========================================================
  //  Le catalogue
  // ==========================================================
  // Chaque carte : un identifiant prefixe par sa famille, un nom, une
  // ligne de sous-titre, une rarete, une image (demandee au dernier
  // moment), un texte, une ou deux attaques et une defense.

  function moyenne(d) { return Math.round((d[0] + d[1]) / 2); }

  // ---------- Les Dinders ----------
  // Leurs attaques sont celles de The Founder War ; leur defense, les
  // points de vie qu'ils y ont. Un Dinder secret n'a de carte qu'une fois
  // debloque : avant, ni le livret ni un booster ne doivent le montrer.
  var RARETE_DINDER = {
    'Universel': 'rare', 'Multiversel': 'epique', 'Omniversel': 'epique',
    'Temporel': 'legendaire', 'Threat': 'legendaire', 'Exclusif': 'legendaire'
  };

  function cartesDinders() {
    var FW = window.FW, CAMP = window.FWCAMP;
    return DP.DINDERS.filter(function (d) { return !d.secret || DP.has(d.id); }).map(function (d) {
      var force = CAMP && CAMP.force ? CAMP.force(d.id, 1)
        : (CAMP && CAMP.FORCE_RARETE && CAMP.FORCE_RARETE[d.rarity]) || 1;
      var att = FW && FW.attaquesDe ? FW.attaquesDe(d.id) : [{ nom: 'Charge', degats: [34, 48] }];
      return {
        id: 'd:' + d.id, famille: 'dinders', nom: d.name,
        sous: (d.form ? d.form + '  ·  ' : '') + d.rarity,
        rarete: RARETE_DINDER[d.rarity] || 'rare',
        pixel: false,
        image: function () { return DP.dinderFull(d.id); },
        texte: d.desc || 'Un Dinder de rareté ' + d.rarity + '. Son histoire reste à écrire.',
        attaques: att.slice(0, 2).map(function (a) {
          return { nom: a.nom, val: Math.round(moyenne(a.degats) * (a.coups || 1) * force) };
        }),
        defense: { nom: 'Endurance', val: Math.round(100 * force) }
      };
    });
  }

  // ---------- Les creatures de l'Odyssee ----------
  var RARETE_PALIER = [null, 'commune', 'commune', 'rare', 'epique', 'legendaire'];

  function cartesCreatures() {
    var V = window.ODYVIE;
    if (!V) return [];
    var out = [];
    // Le systeme stellaire n'a de cartes qu'une fois ouvert : un booster
    // ne doit pas reveler ce que le DinderTracker cache encore.
    (V.connus ? V.connus() : V.ASTRES).forEach(function (a) {
      V.vies(a.id).forEach(function (v) {
        var f = V.force(v), p = Math.max(1, Math.min(5, v.palier || 1));
        out.push({
          id: 'c:' + v.id, famille: 'creatures', nom: v.nom,
          sous: a.nom + '  ·  Palier ' + p,
          rarete: RARETE_PALIER[p],
          pixel: true,
          image: function () { return V.url(v.id); },
          texte: v.texte,
          attaques: [{ nom: v.agressif || v.apaise ? 'Assaut' : 'Riposte', val: f.degats }],
          defense: { nom: 'Résistance', val: f.pv }
        });
      });
    });
    return out;
  }

  // ---------- Les poissons ----------
  var RARETE_POISSON = {
    commun: 'commune', peu: 'commune', rare: 'rare', legende: 'epique', special: 'legendaire'
  };

  function cartesPoissons() {
    var P = window.POISSONS;
    if (!P) return [];
    return P.publiques().map(function (f) {
      var r = P.rarete(f.rarete), rang = P.RARETES.indexOf(r);
      var cm = f.cm ? f.cm[1] : 30;
      return {
        id: 'p:' + f.id, famille: 'poissons', nom: f.nom,
        sous: r.nom + (f.cm ? '  ·  jusqu’à ' + cm + ' cm' : ''),
        rarete: RARETE_POISSON[f.rarete] || 'commune',
        pixel: true,
        image: function () { return P.url(f.id); },
        texte: f.texte || (f.radioactif
          ? 'Il ne mord que dans les lacs irradiés. On le reconnaît à sa lueur.'
          : f.evolueDe ? 'Une forme que l’on ne pêche pas : elle se mérite.'
          : 'Un habitant des lacs de Fish n’Der, de ' + f.cm[0] + ' à ' + cm + ' cm.'),
        attaques: [{ nom: 'Coup de queue', val: Math.round(4 + rang * 9 + cm / 8) }],
        defense: { nom: 'Écailles', val: Math.round(10 + rang * 14 + cm / 4) }
      };
    });
  }

  // ---------- Les boss ----------
  // Les gardiens des planetes, puis les requins de Fish n'Der.
  function cartesBoss() {
    var B = window.BOSS, V = window.ODYVIE, R = window.REQUIN, out = [];
    if (B && V) {
      B.ORDRE.forEach(function (id) {
        var g = B.GARDIENS[id], a = V.astre(g.astre);
        if (a && a.systeme === 'stellaire' && !V.stellaireOuvert()) return;
        var m = V.parId(id);
        out.push({
          id: 'b:' + id, famille: 'boss', nom: g.nom,
          sous: 'Gardien' + (a ? '  ·  ' + a.nom : ''),
          rarete: g.pv >= 4000 ? 'legendaire' : 'epique',
          pixel: true,
          image: function () {
            var f = B.feuille(id, false);
            return f ? f.canvas.toDataURL('image/png') : '';
          },
          texte: (m && m.texte) || g.texte || '',
          attaques: [{ nom: 'Frappe', val: g.coup[0] }, { nom: 'Furie', val: g.coup[2] }],
          defense: { nom: 'Points de vie', val: g.pv }
        });
      });
    }
    if (R) {
      R.LISTE.forEach(function (q) {
        out.push({
          id: 'b:requin-' + q.id, famille: 'boss', nom: q.nom,
          sous: 'Requin  ·  Palier ' + q.palier,
          rarete: q.palier >= 5 ? 'legendaire' : q.palier >= 3 ? 'epique' : 'rare',
          pixel: true,
          image: function () { return R.url(q.id); },
          texte: q.texte,
          attaques: [{ nom: 'Morsure', val: 8 + q.palier * 9 }, { nom: 'Charge', val: Math.round(q.vitesse * 0.8) }],
          defense: { nom: 'Points de vie', val: q.pv }
        });
      });
    }
    return out;
  }

  var cache = null, cacheCle = '';

  function catalogue() {
    // Le catalogue depend de ce que le joueur a ouvert : le systeme
    // stellaire, et les Dinders secrets qu'il a trouves.
    var cle = String(DP.stellaire()) + '|' + DP.DINDERS.filter(function (d) {
      return d.secret && DP.has(d.id);
    }).map(function (d) { return d.id; }).join(',');
    if (cache && cacheCle === cle) return cache;
    cache = cartesDinders().concat(cartesCreatures(), cartesPoissons(), cartesBoss());
    cache.forEach(function (c, i) { c.numero = i + 1; });
    cacheCle = cle;
    return cache;
  }

  function parId(id) {
    var l = catalogue();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }

  function deFamille(id) {
    return catalogue().filter(function (c) { return c.famille === id; });
  }

  // Ou en est la collection : en tout, et famille par famille.
  function etat() {
    var mien = DP.cartes(), out = { vues: 0, total: 0, exemplaires: 0, familles: {} };
    FAMILLES.forEach(function (f) { out.familles[f.id] = { vues: 0, total: 0 }; });
    catalogue().forEach(function (c) {
      out.total++; out.familles[c.famille].total++;
      if (mien[c.id]) { out.vues++; out.familles[c.famille].vues++; out.exemplaires += mien[c.id]; }
    });
    return out;
  }

  // ==========================================================
  //  Les boosters
  // ==========================================================
  // Cinq cartes : trois communes, une rare au moins, et une derniere ou
  // tout peut arriver. Un booster est offert chaque jour ; les autres se
  // paient en credits, dans la monnaie qu'on veut.

  var PAR_BOOSTER = 5;
  var PRIX = { green: 5, blue: 3, gold: 2, pink: 1 };

  // Les chances de chaque emplacement, rarete par rarete.
  var EMPLACEMENTS = [
    { commune: 100 },
    { commune: 100 },
    { commune: 100 },
    { rare: 78, epique: 18, legendaire: 4 },
    { commune: 40, rare: 38, epique: 17, legendaire: 5 }
  ];

  function tirerRarete(chances) {
    var total = 0, k;
    for (k in chances) total += chances[k];
    var n = Math.random() * total;
    for (k in chances) { n -= chances[k]; if (n < 0) return k; }
    return 'commune';
  }

  function tirerBooster() {
    var tout = catalogue(), pris = {}, out = [];
    EMPLACEMENTS.forEach(function (chances) {
      var r = tirerRarete(chances);
      var lot = tout.filter(function (c) { return c.rarete === r && !pris[c.id]; });
      if (!lot.length) lot = tout.filter(function (c) { return !pris[c.id]; });
      var c = lot[Math.floor(Math.random() * lot.length)];
      pris[c.id] = true;
      out.push(c);
    });
    return out;
  }

  // Ce qu'on peut faire maintenant : le booster du jour est-il la, et
  // quelles monnaies suffisent.
  function moyens() {
    var out = { offert: DP.boosterOffert(), illimite: DP.illimite(), credits: {} };
    Object.keys(PRIX).forEach(function (k) {
      out.credits[k] = { prix: PRIX[k], solde: DP.creditCount(k),
                         ok: DP.illimite() || DP.creditCount(k) >= PRIX[k] };
    });
    return out;
  }

  // Ouvre un booster. "moyen" vaut 'offert' ou le nom d'un credit. Rend
  // les cinq cartes, et lesquelles sont nouvelles.
  function ouvrir(moyen) {
    if (moyen === 'offert') {
      if (!DP.prendreBoosterOffert()) return { ok: false, raison: 'Le booster du jour est déjà ouvert.' };
    } else {
      if (!PRIX[moyen]) return { ok: false, raison: 'Monnaie inconnue.' };
      if (!DP.payerCredits(moyen, PRIX[moyen])) return { ok: false, raison: 'Pas assez de crédits.' };
    }
    var tirage = tirerBooster();
    var neuves = DP.rangerCartes(tirage.map(function (c) { return c.id; }));
    return { ok: true, cartes: tirage, neuves: neuves };
  }

  // ==========================================================
  //  Le dessin d'une carte
  // ==========================================================
  // Tout se mesure en em : la taille de police de la carte en fixe
  // l'echelle, et la meme carte sert en vignette comme en grand.

  function element(c, opts) {
    opts = opts || {};
    var r = rarete(c.rarete);
    var n = el(opts.bouton ? 'button' : 'div', 'carte');
    if (opts.bouton) n.type = 'button';
    n.dataset.rarete = c.rarete;
    n.dataset.famille = c.famille;
    n.dataset.carte = c.id;
    n.style.setProperty('--r', r.couleur);

    var tete = el('div', 'carte-tete');
    tete.appendChild(el('strong', 'carte-nom', c.nom));
    tete.appendChild(el('span', 'carte-famille', famille(c.famille).un));
    n.appendChild(tete);

    var art = el('div', 'carte-art' + (c.pixel ? ' carte-art--pixel' : ''));
    var im = el('img', 'carte-img');
    im.alt = '';
    im.decoding = 'async';
    im.src = c.image();
    art.appendChild(im);
    n.appendChild(art);

    n.appendChild(el('div', 'carte-sous', c.sous));

    var corps = el('div', 'carte-corps');
    c.attaques.forEach(function (a) {
      var l = el('div', 'carte-ligne carte-ligne--atq');
      l.appendChild(el('span', 'carte-ligne-nom', a.nom));
      l.appendChild(el('strong', 'carte-ligne-val', String(a.val)));
      corps.appendChild(l);
    });
    var d = el('div', 'carte-ligne carte-ligne--def');
    d.appendChild(el('span', 'carte-ligne-nom', c.defense.nom));
    d.appendChild(el('strong', 'carte-ligne-val', String(c.defense.val)));
    corps.appendChild(d);
    corps.appendChild(el('p', 'carte-texte', c.texte));
    n.appendChild(corps);

    var pied = el('div', 'carte-pied');
    pied.appendChild(el('span', 'carte-rarete', r.nom));
    pied.appendChild(el('span', 'carte-numero',
      'DIO  ·  ' + String(c.numero).padStart(3, '0') + ' / ' + catalogue().length));
    n.appendChild(pied);

    if (opts.nombre > 1) n.appendChild(el('span', 'carte-nombre', '×' + opts.nombre));
    return n;
  }

  // Le dos : celui de toutes les cartes, et l'emplacement vide du livret.
  function dos(opts) {
    opts = opts || {};
    var n = el('div', 'carte carte--dos' + (opts.vide ? ' is-vide' : ''));
    var c = el('div', 'carte-dos-coeur');
    c.appendChild(el('strong', 'carte-dos-logo', opts.vide ? '?' : 'DIO'));
    c.appendChild(el('span', 'carte-dos-sous', opts.vide
      ? (opts.numero ? 'n° ' + String(opts.numero).padStart(3, '0') : '')
      : 'Dinder’s Incommon Omniverse'));
    n.appendChild(c);
    return n;
  }

  // La page d'une famille : les cartes possedees a leur place, des dos
  // marques d'un point d'interrogation pour les autres.
  function grille(idFamille, surCarte) {
    var mien = DP.cartes();
    var g = el('div', 'cartes-grille');
    deFamille(idFamille).forEach(function (c) {
      var n = mien[c.id] || 0;
      if (!n) { g.appendChild(dos({ vide: true, numero: c.numero })); return; }
      var v = element(c, { bouton: true, nombre: n });
      v.addEventListener('click', function () { if (surCarte) surCarte(c, n); });
      g.appendChild(v);
    });
    return g;
  }

  // La carte en grand, par-dessus le reste. Un clic a cote la referme.
  function agrandir(hote, c, n) {
    var voile = el('div', 'cartes-zoom');
    var grande = element(c, { nombre: n });
    grande.classList.add('carte--grande');
    voile.appendChild(grande);
    var fermer = el('button', 'cartes-zoom-fermer', 'Fermer');
    fermer.type = 'button';
    voile.appendChild(fermer);
    function clore() {
      voile.classList.add('is-sortie');
      setTimeout(function () { if (voile.parentNode) voile.remove(); }, 220);
    }
    voile.addEventListener('click', function (e) { if (e.target === voile) clore(); });
    fermer.addEventListener('click', clore);
    hote.appendChild(voile);
    fermer.focus();
    return voile;
  }

  // ==========================================================
  //  L'ouverture du livre, depuis les Items
  // ==========================================================
  // Le livre quitte sa case, vient se poser au milieu de l'ecran, son
  // fermoir saute, la couverture se tourne sur sa reliure et decouvre
  // une page de pochettes. On plonge alors dans la page : c'est le
  // livret qui s'ouvre.

  var IMG_LIVRE = 'assets/items/cardbook.webp';

  function ouvrirLivre(view, row, fini) {
    var reduit = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduit) { fini(); return; }

    var scene = el('div', 'livre-scene');
    scene.appendChild(el('div', 'livre-rayons'));

    var livre = el('div', 'livre');

    // La page de droite, sous la couverture : neuf pochettes.
    var page = el('div', 'livre-page');
    var poches = el('div', 'livre-poches');
    for (var i = 0; i < 9; i++) {
      var poche = el('span', 'livre-poche');
      poche.style.setProperty('--i', String(i));
      poches.appendChild(poche);
    }
    page.appendChild(poches);
    livre.appendChild(page);

    // La couverture : l'illustration devant, le contreplat derriere.
    var couv = el('div', 'livre-couv');
    var devant = el('img', 'livre-face livre-face--devant');
    devant.src = IMG_LIVRE;
    devant.alt = '';
    couv.appendChild(devant);
    var dedans = el('div', 'livre-face livre-face--dedans');
    dedans.appendChild(el('strong', 'livre-ex', 'DIO'));
    dedans.appendChild(el('span', 'livre-ex-sous', 'Dinder’s Incommon Omniverse'));
    couv.appendChild(dedans);
    livre.appendChild(couv);

    scene.appendChild(livre);
    scene.appendChild(el('div', 'livre-eclat'));
    view.appendChild(scene);

    // Le livre part de sa vignette : on mesure l'ecart entre elle et sa
    // place finale, et l'animation le rattrape.
    var vignette = row.querySelector('.slot-face');
    if (vignette) {
      var a = vignette.getBoundingClientRect(), b = livre.getBoundingClientRect();
      if (a.width && b.width) {
        livre.style.setProperty('--dx', ((a.left + a.width / 2) - (b.left + b.width / 2)) + 'px');
        livre.style.setProperty('--dy', ((a.top + a.height / 2) - (b.top + b.height / 2)) + 'px');
        livre.style.setProperty('--s', (a.height / b.height).toFixed(3));
      }
      vignette.style.visibility = 'hidden';
    }

    var parti = false;
    function finir() {
      if (parti) return;
      parti = true;
      fini();
    }

    scene.classList.add('is-vol');
    setTimeout(function () { scene.classList.add('is-fermoir'); }, 520);
    setTimeout(function () { scene.classList.add('is-ouvert'); }, 820);
    setTimeout(function () { scene.classList.add('is-plongee'); }, 1750);
    setTimeout(finir, 2250);
    // Un clic pendant la scene : on entre tout de suite.
    scene.addEventListener('click', finir);
  }

  // ==========================================================
  //  Le Livret de cartes, dans le DinderPad
  // ==========================================================

  function viewLivret(view, arg) {
    view.classList.add('view--livret');
    var fam = famille(arg);
    var e = etat();

    var box = el('div', 'livret');
    var tete = el('div', 'livret-tete');
    tete.appendChild(el('h2', 'livret-titre', 'Livret de cartes'));
    tete.appendChild(el('span', 'livret-compte',
      e.vues + ' / ' + e.total + ' cartes  ·  ' + DP.boostersOuverts() + ' booster' +
      (DP.boostersOuverts() > 1 ? 's' : '') + ' ouvert' + (DP.boostersOuverts() > 1 ? 's' : '')));
    box.appendChild(tete);

    var onglets = el('div', 'livret-onglets');
    FAMILLES.forEach(function (f) {
      var a = el('a', 'livret-onglet' + (f.id === fam.id ? ' is-actif' : ''));
      a.href = '#livret/' + f.id;
      a.appendChild(el('strong', null, f.nom));
      a.appendChild(el('span', null, e.familles[f.id].vues + ' / ' + e.familles[f.id].total));
      onglets.appendChild(a);
    });
    box.appendChild(onglets);

    var page = el('div', 'livret-page');
    page.appendChild(grille(fam.id, function (c, n) { agrandir(box, c, n); }));
    box.appendChild(page);

    var pied = el('div', 'livret-pied');
    var b = el('a', 'livret-btn livret-btn--or', 'Ouvrir des boosters');
    b.href = 'boosters.html';
    pied.appendChild(b);
    var items = el('a', 'livret-btn', 'Items');
    items.href = '#items';
    pied.appendChild(items);
    box.appendChild(pied);

    view.appendChild(box);
  }

  if (window.VIEWS) {
    window.VIEWS['livret'] = { title: 'Livret de cartes', render: viewLivret };
  }

  window.CARTES = {
    RARETES: RARETES, FAMILLES: FAMILLES, PRIX: PRIX, PAR_BOOSTER: PAR_BOOSTER,
    rarete: rarete, famille: famille,
    catalogue: catalogue, parId: parId, deFamille: deFamille, etat: etat,
    tirerBooster: tirerBooster, moyens: moyens, ouvrir: ouvrir,
    element: element, dos: dos, grille: grille, agrandir: agrandir,
    ouvrirLivre: ouvrirLivre
  };
})();
