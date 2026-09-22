// Le Pistolet Lumithique : l'arme cachee de Fish n'Der, ses cinq
// niveaux, ses revetements, et la salle des trophees ou l'on compte les
// requins abattus.
//
// Comme les poissons et les sprites de balade, rien n'est stocke en
// fichier : le pistolet est peint a la volee dans une case de 52 x 26, et
// changer de revetement ne fait que changer sa palette.
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
  //  Les cinq niveaux
  // ==========================================================
  // "degats" est ce qu'encaisse le flanc du requin ; un point faible en
  // prend le triple. "cadence" est le temps de recharge entre deux tirs :
  // monter en niveau, c'est frapper plus fort ET plus souvent.
  // "cout" se paie en Noyaux Lumithiques, que les requins laissent.
  var NIVEAUX = [
    { n: 1, nom: 'Mk I — Prototype', degats: 6,  cadence: 620, cout: 0,
      texte: 'Sorti d’une souche, il fonctionne encore. C’est déjà beaucoup.' },
    { n: 2, nom: 'Mk II — Focalisé', degats: 11, cadence: 560, cout: 3,
      texte: 'Le faisceau ne se disperse plus : il perce.' },
    { n: 3, nom: 'Mk III — Prisme',  degats: 19, cadence: 500, cout: 7,
      texte: 'Trois cristaux en ligne, et la lumière sort en lame.' },
    { n: 4, nom: 'Mk IV — Solstice', degats: 32, cadence: 440, cout: 13,
      texte: 'De quoi discuter d’égal à égal avec un Grand Blanc.' },
    { n: 5, nom: 'Mk V — Supernova', degats: 52, cadence: 380, cout: 22,
      texte: 'Ce n’est plus une arme, c’est une petite étoile tenue à bout de bras.' }
  ];

  var MAX = NIVEAUX.length;

  function niveau(n) {
    return NIVEAUX[Math.max(0, Math.min(MAX - 1, (n || DP.armeNiveau()) - 1))];
  }

  // ==========================================================
  //  Les revetements
  // ==========================================================
  // Trois tons chacun : la carrosserie, l'eclat metallique, la lueur.
  // Chacun se gagne au premier requin d'une forme donnee — sauf celui
  // d'origine, qui vient avec l'arme.
  var REVETEMENTS = [
    { id: 'origine', nom: 'Acier Lumithique', c: ['#5d6b7e', '#aebdd0', '#4fe8ff'],
      gagne: 'Fourni avec l’arme.' },
    { id: 'corail', nom: 'Corail', c: ['#c4667a', '#f3b9c4', '#ffd36a'],
      gagne: 'Premier Requin de Récif abattu.' },
    { id: 'abysse', nom: 'Abysse', c: ['#22304e', '#4a6394', '#7cf0e0'],
      gagne: 'Premier Mako abattu.' },
    { id: 'fauve', nom: 'Fauve', c: ['#8a5c1e', '#d9a34a', '#ffb02e'],
      gagne: 'Premier Requin-Tigre abattu.' },
    { id: 'ivoire', nom: 'Ivoire', c: ['#cfd6dd', '#f4f8fb', '#9fe8ff'],
      gagne: 'Premier Grand Blanc abattu.' },
    { id: 'ossuaire', nom: 'Ossuaire', c: ['#ded3bb', '#f7f0dd', '#e8483a'],
      gagne: 'Premier Mégalodon abattu.' },
    { id: 'prisme', nom: 'Prisme Doré', c: ['#a8842a', '#ffe9a8', '#fff6cf'],
      gagne: 'Premier requin brillant abattu.' },
    { id: 'irradie', nom: 'Irradié', c: ['#4a6b16', '#a8d81e', '#e8ff6a'],
      gagne: 'Premier requin irradié abattu.' },
    { id: 'selenite', nom: 'Sélénite', c: ['#cfc7b4', '#efe8d6', '#e8483a'],
      gagne: 'Le Sélénophage abattu, sur la Lune.', odyssee: true },

    // --- Ceux de l'Odyssee : ils ne se gagnent que la-bas, mais le
    // pistolet les porte partout, pêche comprise. Un par monde, pour son
    // gardien (la créature la plus redoutable), et deux pour les chasseurs.
    { id: 'zinc', nom: 'Zinc Fondu', c: ['#6e6a66', '#c9c2b8', '#ff9a3c'],
      gagne: 'Le Géant de Plomb abattu, sur Mercure.', odyssee: true, gardien: 'geant-plomb' },
    { id: 'soufre', nom: 'Soufre', c: ['#a8862a', '#f1dc7a', '#fff29a'],
      gagne: 'Le Titan d’Ishtar abattu, sur Vénus.', odyssee: true, gardien: 'titan-ishtar' },
    { id: 'nocturne', nom: 'Jardin Nocturne', c: ['#2d4a2a', '#6f9a5a', '#c8ff7a'],
      gagne: 'La Chose-qui-Regarde abattue, sur Terre.', odyssee: true, gardien: 'chose-qui-regarde' },
    { id: 'regolithe', nom: 'Régolithe', c: ['#5e6168', '#b9bcc4', '#9fd8ff'],
      gagne: 'Le Colosse de Tycho abattu, sur la Lune.', odyssee: true, gardien: 'colosse-tycho' },
    { id: 'rouille', nom: 'Rouille de Tharsis', c: ['#8a3a1e', '#d0704a', '#ffb07a'],
      gagne: 'Le Géant de Tharsis abattu, sur Mars.', odyssee: true, gardien: 'geant-tharsis' },
    { id: 'tempete', nom: 'Grande Tache', c: ['#9a5a34', '#e2b48a', '#ff5a3a'],
      gagne: 'Le Colosse Gazeux abattu, sur Jupiter.', odyssee: true, gardien: 'colosse-gazeux' },
    { id: 'hexagone', nom: 'Hexagone', c: ['#6a5a8a', '#d8c9a0', '#ffe9a8'],
      gagne: 'Le Roi de l’Hexagone abattu, sur Saturne.', odyssee: true, gardien: 'roi-hexagone' },
    { id: 'oberon', nom: 'Obéron', c: ['#2e8a8a', '#9fe8e0', '#e0fffa'],
      gagne: 'Le Gardien d’Obéron abattu, sur Uranus.', odyssee: true, gardien: 'gardien-oberon' },
    { id: 'abysses', nom: 'Abysses de Neptune', c: ['#1a2a6e', '#3e5ac4', '#7ab0ff'],
      gagne: 'Le Colosse des Abysses abattu, sur Neptune.', odyssee: true, gardien: 'colosse-abysses' },
    { id: 'comete', nom: 'Comète', c: ['#2a2e4a', '#8a94c8', '#7cf0c8'],
      gagne: '25 espèces différentes abattues dans l’Odyssée.', odyssee: true, especes: 25 },
    { id: 'horizon', nom: 'Horizon Noir', c: ['#0e0c14', '#3a3448', '#b06aff'],
      gagne: '100 créatures abattues dans l’Odyssée.', odyssee: true, total: 100 }
  ];

  function revetement(id) {
    id = id || DP.revetement();
    for (var i = 0; i < REVETEMENTS.length; i++) {
      if (REVETEMENTS[i].id === id) return REVETEMENTS[i];
    }
    return REVETEMENTS[0];
  }

  // Le revetement que telle forme de requin fait gagner.
  var PAR_REQUIN = {
    recif: 'corail', mako: 'abysse', tigre: 'fauve',
    blanc: 'ivoire', megalodon: 'ossuaire'
  };

  // ==========================================================
  //  Le dessin
  // ==========================================================

  var L = 52, H = 26;
  var CERNE = [16, 20, 30, 255];

  // Un pistolet massif : crosse en bas a gauche, corps au milieu, canon
  // long vers la droite, et le noyau qui luit au creux du corps. Le
  // nombre de bagues sur le canon dit le niveau de l'arme.
  function dessiner(p, c, n) {
    var corps = c[0], eclat = c[1], lueur = c[2];

    // La crosse, inclinee.
    for (var i = 0; i < 9; i++) {
      p(12 + Math.floor(i / 2), 15 + i, 8, 1, corps);
    }
    p(13, 16, 3, 7, eclat);

    // Le corps.
    p(9, 8, 24, 8, corps);
    p(9, 8, 24, 2, eclat);
    p(10, 14, 22, 2, 'rgba(0,0,0,.28)');

    // Le pontet et la detente.
    p(20, 16, 8, 2, corps);
    p(21, 16, 2, 4, corps);

    // Le canon : un tube, puis les bagues, puis l'emetteur.
    p(33, 10, 14, 5, corps);
    p(33, 10, 14, 1, eclat);
    for (var b = 0; b < n; b++) p(35 + b * 2, 9, 1, 7, lueur);

    // L'emetteur, au bout : un anneau qui luit.
    p(46, 8, 3, 9, corps);
    p(47, 10, 2, 5, lueur);
    p(49, 11, 1, 3, lueur);

    // Le noyau, dans le corps.
    p(14, 10, 5, 4, lueur);
    p(15, 11, 3, 2, '#ffffff');

    // La mire.
    p(28, 6, 2, 3, corps);
    p(28, 5, 2, 1, lueur);
  }

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

  function feuille(idRevetement, n) {
    var r = revetement(idRevetement);
    n = Math.max(1, Math.min(MAX, n || DP.armeNiveau()));
    var cle = r.id + '|' + n;
    if (cache[cle]) return cache[cle];
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = H;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;
    dessiner(function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    }, r.c, n);
    cerner(x);
    cache[cle] = { canvas: cv, L: L, H: H };
    return cache[cle];
  }

  function url(idRevetement, n) {
    var f = feuille(idRevetement, n);
    return f ? f.canvas.toDataURL('image/png') : '';
  }

  // ==========================================================
  //  Monter en niveau
  // ==========================================================

  function prochain(cle) {
    var n = DP.armeNiveau(monnaie(cle).jeu);
    return n >= MAX ? null : NIVEAUX[n];
  }

  // Le niveau atteint dans un jeu : 'peche' (par defaut) ou 'odyssee'.
  function niveauJeu(jeu) { return niveau(DP.armeNiveau(jeu)); }

  // Deux progressions, deux monnaies : a Fish n'Der, le pistolet monte
  // avec les Noyaux Lumithiques arraches aux requins ; dans l'Odyssee, il
  // repart du Mk I et monte avec les Roches Solaires des creatures. Le
  // tarif est le meme ; les revetements, eux, sont communs.
  var MONNAIES = {
    noyaux: { nom: 'Noyaux Lumithiques', court: 'noyaux', signe: '◈', jeu: 'peche',
              solde: function () { return DP.noyaux(); },
              depenser: function (n) { return DP.depenserNoyaux(n); } },
    roches: { nom: 'Roches Solaires', court: 'roches', signe: '☀', jeu: 'odyssee',
              solde: function () { return DP.roches(); },
              depenser: function (n) { return DP.depenserRoches(n); } }
  };

  function monnaie(cle) { return MONNAIES[cle] || MONNAIES.noyaux; }

  function peutMonter(cle) {
    var p = prochain(cle);
    return !!p && monnaie(cle).solde() >= p.cout;
  }

  function monter(cle) {
    var m = monnaie(cle);
    var p = prochain(cle);
    if (!p) return { ok: false, raison: 'déjà au maximum' };
    if (m.solde() < p.cout) return { ok: false, raison: 'pas assez de ' + m.court };
    m.depenser(p.cout);
    DP.monterArme(m.jeu);
    cache = {};
    return { ok: true, niveau: p };
  }

  // Ce que le premier requin d'une forme, ou d'une variante, fait gagner.
  function revetementPour(id, variante) {
    if (variante === 'brillant' && !DP.aRevetement('prisme')) return 'prisme';
    if (variante === 'irradie' && !DP.aRevetement('irradie')) return 'irradie';
    var r = PAR_REQUIN[id];
    return r && !DP.aRevetement(r) ? r : null;
  }

  // Apres une creature abattue dans l'Odyssee (deja notee dans
  // DP.abattus()) : les revetements qu'elle vient de debloquer, acquis
  // au passage. Rien sans le pistolet.
  function recompenseOdyssee(idCreature) {
    if (!DP.aLArme()) return [];
    var abattus = DP.abattus(), especes = 0, total = 0;
    Object.keys(abattus).forEach(function (k) {
      if (abattus[k] > 0) { especes++; total += abattus[k]; }
    });
    var gagnes = [];
    REVETEMENTS.forEach(function (r) {
      if (!r.odyssee || DP.aRevetement(r.id)) return;
      var ok = (r.gardien && r.gardien === idCreature) ||
               (r.especes && especes >= r.especes) ||
               (r.total && total >= r.total);
      if (ok && DP.acquerirRevetement(r.id)) gagnes.push(r);
    });
    return gagnes;
  }

  // ==========================================================
  //  La salle des trophees
  // ==========================================================

  // "#armurerie" est celle de la peche ; "#armurerie/odyssee" celle de
  // l'Odyssee. Memes revetements, mais chacune son niveau : on y paie en
  // Roches Solaires, et le tableau de chasse compte les creatures au lieu
  // des requins.
  function viewArmurerie(view, arg) {
    if (!DP.aLArme()) { location.hash = '#items'; return; }

    var odyssee = arg === 'odyssee';
    var cleCaisse = odyssee ? 'roches' : 'noyaux';
    var caisse = monnaie(cleCaisse);
    var nAtteint = DP.armeNiveau(caisse.jeu);
    var box = el('div', 'ar' + (odyssee ? ' ar--odyssee' : ''));
    box.dataset.jeu = odyssee ? 'odyssee' : 'peche';
    var R = window.REQUIN;

    // ---------- La colonne de gauche : l'arme ----------
    var gauche = el('div', 'ar-gauche');

    var vitrine = el('div', 'ar-vitrine');
    var img = el('img', 'ar-arme');
    img.src = url(null, nAtteint);
    img.alt = '';
    vitrine.appendChild(img);
    gauche.appendChild(vitrine);

    var nv = niveau(nAtteint);
    gauche.appendChild(el('h2', 'ar-nom', 'Pistolet Lumithique'));
    gauche.appendChild(el('p', 'ar-niveau', nv.nom));
    gauche.appendChild(el('p', 'ar-texte', nv.texte));

    var stats = el('div', 'ar-stats');
    [['Dégâts', nv.degats], ['Point faible', nv.degats * 3 + '  (×3)'],
     ['Recharge', nv.cadence + ' ms']].forEach(function (s) {
      var l = el('div', 'ar-stat');
      l.appendChild(el('span', 'ar-stat-nom', s[0]));
      l.appendChild(el('strong', 'ar-stat-val', String(s[1])));
      stats.appendChild(l);
    });
    gauche.appendChild(stats);

    // L'echelle des cinq crans : on voit d'un coup d'oeil ou l'on en est
    // et ce qu'il reste a gravir.
    var ROMAIN = ['I', 'II', 'III', 'IV', 'V'];
    var echelle = el('div', 'ar-echelle');
    NIVEAUX.forEach(function (x) {
      var c = el('span', 'ar-cran' + (x.n <= nAtteint ? ' is-atteint' : ''),
                 'Mk ' + ROMAIN[x.n - 1]);
      c.title = x.nom + '  ·  ' + x.degats + ' dégâts' +
                (x.cout ? '  ·  ' + x.cout + ' ' + caisse.court : '');
      echelle.appendChild(c);
    });
    gauche.appendChild(echelle);

    var noyaux = el('p', 'ar-noyaux');
    noyaux.appendChild(el('span', 'ar-noyau-pastille', caisse.signe));
    noyaux.appendChild(el('strong', null, String(caisse.solde())));
    noyaux.appendChild(el('span', null, ' ' + caisse.nom));
    gauche.appendChild(noyaux);

    var suite = prochain(cleCaisse);
    var monte = el('button', 'ar-monter');
    monte.type = 'button';
    if (!suite) {
      monte.textContent = 'Niveau maximum atteint';
      monte.disabled = true;
    } else {
      monte.textContent = 'Monter en ' + suite.nom.split(' — ')[0] +
                          '  ·  ' + suite.cout + ' ' + caisse.signe;
      monte.disabled = !peutMonter(caisse.court);
      monte.addEventListener('click', function () {
        var r = monter(caisse.court);
        if (!r.ok) return;
        view.textContent = '';
        viewArmurerie(view, arg);
      });
    }
    gauche.appendChild(monte);

    // Si une partie de peche est en cours, on y retourne plutot que de
    // repasser par l'accueil : l'armurerie est alors une annexe du jeu.
    var partie = window.PECHE && window.PECHE.reprise();
    var voyage = window.ODYSSEE && window.ODYSSEE.reprise();
    var retours = el('div', 'ar-retours');
    if (odyssee) {
      // Depuis l'Odyssee : on retourne ou l'on etait, sinon au Teleportail.
      var V = window.ODYVIE;
      var ici = voyage && V ? V.astre(voyage.astre) : null;
      var aller = el('a', 'ar-retour ar-retour--jeu',
                     ici ? 'Retour sur ' + ici.nom : 'Retour au Téléportail');
      aller.href = ici ? '#odyssee' : '#teleportail';
      retours.appendChild(aller);
      var carnetO = el('a', 'ar-retour', 'Carnet');
      carnetO.href = '#odyssee-carnet';
      retours.appendChild(carnetO);
    } else if (partie) {
      var aLaPeche = el('a', 'ar-retour ar-retour--jeu', 'Retour à la pêche');
      aLaPeche.href = '#peche';
      retours.appendChild(aLaPeche);
      var auCarnet = el('a', 'ar-retour', 'Carnet');
      auCarnet.href = '#peche-collection';
      retours.appendChild(auCarnet);
    } else {
      var retour = el('a', 'ar-retour', 'Retour aux Items');
      retour.href = '#items';
      retours.appendChild(retour);
    }
    gauche.appendChild(retours);
    box.appendChild(gauche);

    // ---------- La colonne de droite : trophees et revetements ----------
    var droite = el('div', 'ar-droite');

    if (odyssee) {
      droite.appendChild(tableauCreatures());
    } else {
      droite.appendChild(tableauRequins());
    }

    droite.appendChild(el('p', 'ar-sous-titre', 'Revêtements'));
    var peaux = el('div', 'ar-peaux');
    // Chaque armurerie montre d'abord ce qui se gagne chez elle.
    var ordre = REVETEMENTS.filter(function (r) { return r.id === 'origine'; })
      .concat(REVETEMENTS.filter(function (r) { return r.id !== 'origine' && !!r.odyssee === odyssee; }))
      .concat(REVETEMENTS.filter(function (r) { return r.id !== 'origine' && !!r.odyssee !== odyssee; }));
    ordre.forEach(function (r) {
      var a = DP.aRevetement(r.id);
      var n = el('button', 'ar-peau');
      n.type = 'button';
      n.dataset.peau = r.id;
      n.classList.toggle('is-vide', !a);
      n.classList.toggle('is-monte', a && DP.revetement() === r.id);
      n.style.setProperty('--r', r.c[2]);
      n.title = a ? r.nom : r.gagne;

      var im = el('img', 'ar-peau-img');
      im.src = url(r.id);
      im.alt = '';
      n.appendChild(im);
      if (r.odyssee) {
        n.classList.add('is-odyssee');
        var tag = el('span', 'ar-peau-tag', '☀');
        tag.title = 'Se gagne dans l’Odyssée';
        n.appendChild(tag);
      }
      n.appendChild(el('span', 'ar-peau-nom', a ? r.nom : '???'));
      if (!a) n.appendChild(el('span', 'ar-peau-cond', r.gagne));

      n.addEventListener('click', function () {
        if (!a) return;
        DP.equiperRevetement(r.id);
        view.textContent = '';
        viewArmurerie(view, arg);
      });
      peaux.appendChild(n);
    });
    droite.appendChild(peaux);
    box.appendChild(droite);

    view.appendChild(box);
  }

  // Les creatures abattues dans l'Odyssee, les plus redoutables d'abord.
  // Il y en a cent quatre-vingts : on ne montre que celles qu'on a deja
  // eues au bout du canon, et le gardien de la grotte en tete.
  function tableauCreatures() {
    var V = window.ODYVIE;
    var bloc = el('div', 'ar-chasse');
    var abattus = DP.abattus();
    var lignes = V ? Object.keys(abattus).map(function (id) {
      return { v: V.parId(id), n: abattus[id] };
    }).filter(function (x) { return x.v && !x.v.forme; }) : [];
    var gardien = V && DP.exploit('selenophage') > 0;

    lignes.sort(function (a, b) {
      return (b.v.palier - a.v.palier) || (b.n - a.n);
    });
    var total = lignes.reduce(function (t, x) { return t + x.n; }, 0);
    var especes = V ? V.VIES.length : 0;

    var tete = el('div', 'ar-banniere');
    tete.appendChild(el('span', 'ar-enseigne', 'Tableau de chasse'));
    tete.appendChild(el('span', 'ar-total',
      total + (total > 1 ? ' créatures abattues' : ' créature abattue') +
      '  ·  ' + lignes.length + ' / ' + especes + ' espèces'));
    bloc.appendChild(tete);

    var grille = el('div', 'ar-trophees ar-trophees--creatures');
    if (gardien) {
      var m = V.MONSTRE;
      var g = el('div', 'ar-trophee ar-trophee--gardien');
      g.dataset.creature = m.id;
      var gi = el('img', 'ar-trophee-img');
      gi.src = V.url(m.id);
      gi.alt = '';
      g.appendChild(gi);
      g.appendChild(el('span', 'ar-trophee-nom', m.nom));
      g.appendChild(el('span', 'ar-trophee-det', 'Lune  ·  gardien'));
      g.appendChild(el('span', 'ar-trophee-n', '×' + DP.exploit('selenophage')));
      grille.appendChild(g);
    }
    lignes.forEach(function (x) {
      var a = V.astre(x.v.astre);
      var n = el('div', 'ar-trophee');
      n.dataset.creature = x.v.id;
      n.style.setProperty('--r', a ? a.ciel[1] : '#7cf0c8');
      var im = el('img', 'ar-trophee-img');
      im.src = V.url(x.v.id);
      im.alt = '';
      n.appendChild(im);
      n.appendChild(el('span', 'ar-trophee-nom', x.v.nom));
      n.appendChild(el('span', 'ar-trophee-det',
        (a ? a.nom : '') + '  ·  palier ' + x.v.palier));
      n.appendChild(el('span', 'ar-trophee-n', '×' + x.n));
      grille.appendChild(n);
    });
    if (!lignes.length && !gardien) {
      grille.appendChild(el('p', 'ar-vide',
        'Aucune créature abattue pour l’instant. Celles qui attaquent se ' +
        'reconnaissent au point rouge au-dessus de leur tête.'));
    }
    bloc.appendChild(grille);
    return bloc;
  }

  // Les requins de la peche : cinq formes, abattues ou non.
  function tableauRequins() {
    var R = window.REQUIN;
    var bloc = el('div', 'ar-chasse');
    var tro = R ? R.LISTE : [];
    var abattus = DP.requins();
    var total = 0;
    tro.forEach(function (q) { total += (abattus[q.id] || {}).n || 0; });

    var tete = el('div', 'ar-banniere');
    tete.appendChild(el('span', 'ar-enseigne', 'Tableau de chasse'));
    tete.appendChild(el('span', 'ar-total',
      total + (total > 1 ? ' requins abattus' : ' requin abattu')));
    bloc.appendChild(tete);

    var grille = el('div', 'ar-trophees');
    tro.forEach(function (q) {
      var e = abattus[q.id];
      var n = el('div', 'ar-trophee');
      n.dataset.requin = q.id;
      n.classList.toggle('is-vide', !e);
      n.style.setProperty('--r', q.couleurs[1]);

      if (e) {
        var im = el('img', 'ar-trophee-img');
        im.src = R.url(q.id);
        im.alt = '';
        n.appendChild(im);
        n.appendChild(el('span', 'ar-trophee-nom', q.nom));
        n.appendChild(el('span', 'ar-trophee-det', q.pv + ' PV  ·  palier ' + q.palier));
        var marques = el('span', 'ar-marques');
        marques.appendChild(el('span', 'ar-trophee-n', '×' + e.n));
        if (e.brillants) marques.appendChild(el('span', 'ar-marque ar-marque--brillant',
          '✦ ' + e.brillants));
        if (e.irradies) marques.appendChild(el('span', 'ar-marque ar-marque--irradie',
          '☢ ' + e.irradies));
        n.appendChild(marques);
      } else {
        n.appendChild(el('span', 'ar-trophee-vide', '?'));
        n.appendChild(el('span', 'ar-trophee-nom', q.nom));
        n.appendChild(el('span', 'ar-trophee-det', 'jamais abattu'));
      }
      grille.appendChild(n);
    });
    bloc.appendChild(grille);
    return bloc;
  }

  if (window.VIEWS) {
    window.VIEWS['armurerie'] = { title: 'Armurerie', render: viewArmurerie };
  }

  window.ARME = {
    NIVEAUX: NIVEAUX, REVETEMENTS: REVETEMENTS, MAX: MAX,
    PAR_REQUIN: PAR_REQUIN,
    niveau: niveau, niveauJeu: niveauJeu, revetement: revetement,
    feuille: feuille, url: url, L: L, H: H,
    prochain: prochain, peutMonter: peutMonter, monter: monter,
    MONNAIES: MONNAIES, monnaie: monnaie,
    revetementPour: revetementPour, recompenseOdyssee: recompenseOdyssee,
    vider: function () { cache = {}; }
  };
})();
