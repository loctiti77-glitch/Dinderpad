// Le Registre : tous les codes trouves, ou ils se tapent, et ce qu'ils
// ouvrent.
//
// Il ne consigne que ce que le joueur connait deja. Un code jamais entre,
// une enigme jamais resolue n'y laissent aucune trace : pas de case vide,
// pas de total, rien qui annonce ce qui reste a trouver.
(function () {
  var DP = window.DP;
  if (!DP) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  // Les rubriques, chacune avec sa couleur d'encre.
  // Elles servent aussi de categories, dans cet ordre, chacune avec son
  // icone.
  var RUBRIQUES = {
    tracker:     { nom: 'DinderTracker',    c: '#2f8a3a', img: 'assets/items/dindertracker.webp' },
    peche:       { nom: 'Fish n’Der',       c: '#6a4ad0', img: 'assets/games/icones/fish-n-der.webp' },
    wade:        { nom: 'Wade and Friends', c: '#a8321e', img: 'assets/games/icones/wade-and-friends.webp' },
    founder:     { nom: 'The Founder War',  c: '#c8302a', img: 'assets/games/icones/founder-war.webp' },
    odyssee:     { nom: 'The Odyssey of Dinder', c: '#2a8a7a', img: 'assets/games/icones/odyssey.webp' },
    teleportail: { nom: 'Téléportail',      c: '#1f6aa8', img: 'assets/items/teleportail.webp' }
  };
  var ORDRE = ['tracker', 'founder', 'peche', 'odyssee', 'wade', 'teleportail'];

  // La categorie ouverte, gardee le temps de la session.
  var filtre = 'tout';

  // Les sequences de Wade and Friends ne se tapent pas : elles se
  // touchent, dans l'ordre, dans le batiment.
  var NUITS = [
    { n: 2, dinder: 'charlie-capsule', titre: 'Le secret de la nuit 2',
      etapes: ['Le logo, dans le bureau', 'Les fanions de la scène : vert, orange, rouge, jaune',
               'La boîte sur le comptoir', 'Puis le jeu : le steak'],
      utilite: 'Libère Charlie Capsule.' },
    { n: 3, dinder: 'stephen-sharkodon', titre: 'Le secret de la nuit 3',
      etapes: ['Les dessins, dans le bureau', 'Le bassin', 'Le menu du comptoir',
               'Les dessins du coin est', 'Puis le jeu : les poissons dorés'],
      utilite: 'Libère Stephen Sharkodon.' },
    { n: 4, dinder: 'faith-faisandoir', titre: 'Le secret de la nuit 4',
      etapes: ['La boîte de la boutique', 'Les bâtons de l’atelier : 1er, 5e, 2e — un F',
               'L’affiche Fizzies de la salle'],
      utilite: 'Libère Faith Faisandoir.' },
    { n: 5, dinder: 'wade-wolhunter', titre: 'Le secret de la nuit 5',
      etapes: ['La boîte du bureau', 'L’affiche Fizzies', 'Le logo', 'Les dessins',
               'Les bouteilles à l’effigie de Wade, dans le frigo de la boutique',
               'Puis le jeu : les moutons d’émeraude'],
      utilite: 'Libère Wade Wolhunter.' },
    { n: 6, dinder: 'their-creator', titre: 'Le secret de la nuit 6',
      etapes: ['L’affiche de l’employé, dans le bureau', 'Quatre étoiles de la scène',
               'La caisse de la boutique', 'La lampe de l’atelier, trois fois',
               'Les deux affiches « Souriez »', 'Les trois cartons de la chambre froide'],
      utilite: 'Tout brûle : la bonne fin, et Their Creator.' }
  ];

  // Chaque entree dit si elle est connue, et ce qu'elle affiche.
  function entrees() {
    var c = DP.codes();
    var r = [];

    if (c.dg) r.push({
      id: 'dg', rub: 'tracker', titre: 'Code de maintenance', code: '33071407', date: c.dg,
      ou: 'Le champ DG CODE, au bas du DinderTracker.',
      utilite: 'Déclenche une faille à la demande : SinAIster prend les balises, et il faut les purger une à une.'
    });

    if (c.stellaire || DP.stellaire()) r.push({
      id: 'stellaire', rub: 'tracker', titre: 'Signal hors système', code: '123444266', date: c.stellaire,
      ou: 'Le champ DG CODE, au bas du DinderTracker.',
      utilite: 'Décroche le tracker de la Terre et le cale sur le système stellaire : la carte d’Altéra.'
    });

    var TN = window.TRACKER_NY;
    if (c.azhrakonr && TN) r.push({
      id: 'azhrakonr', rub: 'tracker', titre: 'Le code de la balise lointaine',
      code: TN.AZH.map(function (p) { return p.code; }).join('-'), date: c.azhrakonr,
      ou: 'La balise plantée hors du système solaire, au bout de la tablette de New York.',
      utilite: 'Appelle Azhrakonr, le dévoreur.'
    });

    var cos = DP.cosmos();
    if (cos.abattus.length) {
      var C = window.COSMOS;
      var morceaux = C ? C.morceaux() : [];
      r.push({
        id: 'cosmique', rub: 'peche', titre: 'Code cosmique',
        code: cos.abattus.length >= 5 && C ? C.CODE : null,
        morceaux: morceaux, date: c.ny,
        ou: c.ny ? 'La tablette posée sur New York, dans le DinderTracker.'
                 : 'Inconnu. Les fragments viennent des arbres cosmiques de Fish n’Der.',
        utilite: c.ny ? 'Fait reculer le tracker jusqu’hors du système solaire, vers une balise inconnue.'
                      : cos.abattus.length >= 5 ? 'Inconnue. Onze chiffres, à essayer quelque part.'
                      : 'Inconnue tant que les cinq fragments ne sont pas réunis.'
      });
    }

    // Les quatre paires de la balise lointaine, chacune dans son jeu.
    var BALISE = 'la balise d’Azhrakonr, hors du système solaire.';
    if (c['azh-h']) r.push({ id: 'azh-h', rub: 'founder', titre: 'L’énigme de H', date: c['azh-h'],
      etapes: ['Prendre un cube', 'Le couper en trois dans la largeur, la hauteur et la profondeur', 'Compter les petits cubes'],
      ou: 'Le jardin caché derrière les arbres du niveau 6.', utilite: 'La case rouge du code de ' + BALISE });
    if (c['azh-papier']) r.push({ id: 'azh-papier', rub: 'peche', titre: 'Le poisson en papier', code: '43', date: c['azh-papier'],
      ou: 'Sous l’eau, en plongeant du ponton.', utilite: 'La case bleue du code de ' + BALISE });
    if (c['azh-pierres']) r.push({ id: 'azh-pierres', rub: 'odyssee', titre: 'Les pierres sous le nain', code: '13', date: c['azh-pierres'],
      ou: 'Sous le nain de jardin mauve d’Altéra, avec la pelle du cabanon.', utilite: 'La case verte du code de ' + BALISE });
    if (c['azh-serie']) r.push({ id: 'azh-serie', rub: 'wade', titre: 'Le numéro de série', code: '4258 96 34', date: c['azh-serie'],
      ou: 'Le carton du haut de la pile de gauche, caméra 07 : deux clics sur les chiffres rouges.', utilite: 'Les deux chiffres d’une autre encre : la case jaune du code de ' + BALISE });

    NUITS.forEach(function (w) {
      if (!DP.has(w.dinder)) return;
      r.push({ id: 'wade-' + w.n, rub: 'wade', titre: w.titre, etapes: w.etapes,
               ou: 'Dans le bâtiment, nuit ' + w.n + ' : toucher dans l’ordre.',
               utilite: w.utilite });
    });

    var V = window.ODYVIE;
    if (V && DP.aVuAstre) {
      var connus = V.ASTRES.filter(function (a) { return DP.aVuAstre(a.id); });
      if (connus.length) r.push({
        id: 'teleportail', rub: 'teleportail', titre: 'Coordonnées des mondes',
        liste: connus.map(function (a) { return [a.code, a.nom]; }),
        ou: 'Le clavier du Téléportail.',
        utilite: 'Chaque code ouvre le passage vers son monde.'
      });
    }
    return r;
  }

  function trouves() { return entrees(); }

  // ==========================================================
  //  L'icone : un registre relie, au pixel
  // ==========================================================

  var iconeUrl = null;
  function icone() {
    if (iconeUrl) return iconeUrl;
    var cv = document.createElement('canvas');
    cv.width = 18; cv.height = 22;
    var x = cv.getContext('2d');
    if (!x) return null;
    function p(px, py, w, h, col) { x.fillStyle = col; x.fillRect(px, py, w, h); }
    p(2, 1, 14, 20, '#151822');               // le cerne
    p(3, 2, 13, 18, '#e8dcc0');               // la tranche des pages
    p(3, 2, 12, 18, '#6e2a1c');               // la couverture
    p(3, 2, 2, 18, '#4a1a12');                // le dos
    p(5, 2, 10, 1, '#8e3a26');
    p(13, 2, 2, 2, '#c9a227'); p(13, 18, 2, 2, '#c9a227');   // les coins
    p(7, 6, 6, 5, '#c9a227');                 // l'etiquette
    p(8, 7, 4, 1, '#6e2a1c'); p(8, 9, 3, 1, '#6e2a1c');
    p(10, 20, 2, 2, '#7a4fd0');               // le signet
    var big = document.createElement('canvas');
    big.width = 72; big.height = 88;
    var b = big.getContext('2d');
    b.imageSmoothingEnabled = false;
    b.drawImage(cv, 0, 0, 72, 88);
    iconeUrl = big.toDataURL('image/png');
    return iconeUrl;
  }

  // ==========================================================
  //  L'ecran
  // ==========================================================

  function dateTexte(t) {
    if (!t) return '';
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(t));
    } catch (e) { return ''; }
  }

  function viewRegistre(view) {
    var box = el('div', 'reg');
    var tete = el('div', 'reg-tete');
    var im = el('img', 'reg-icone');
    im.src = icone();
    im.alt = '';
    tete.appendChild(im);
    var titres = el('div', 'reg-titres');
    titres.appendChild(el('h2', 'reg-titre', 'Registre'));
    var liste = entrees();
    titres.appendChild(el('p', 'reg-sous', liste.length + (liste.length > 1 ? ' codes consignés' : ' code consigné')));
    tete.appendChild(titres);
    box.appendChild(tete);

    // Les categories qui ont au moins un code : les autres n'existent pas
    // encore pour le joueur.
    var cats = ORDRE.filter(function (k) {
      return liste.some(function (e) { return e.rub === k; });
    });
    if (filtre !== 'tout' && cats.indexOf(filtre) === -1) filtre = 'tout';

    // Les onglets : tout, ou une seule categorie.
    var onglets = el('div', 'reg-onglets');
    onglets.setAttribute('role', 'tablist');
    [['tout', 'Tout', liste.length]].concat(cats.map(function (k) {
      return [k, RUBRIQUES[k].nom, liste.filter(function (e) { return e.rub === k; }).length];
    })).forEach(function (o) {
      var b = el('button', 'reg-onglet' + (o[0] === filtre ? ' is-actif' : ''));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', o[0] === filtre ? 'true' : 'false');
      if (o[0] !== 'tout') {
        b.style.setProperty('--encre', RUBRIQUES[o[0]].c);
        var ic = el('img', 'reg-onglet-img');
        ic.src = RUBRIQUES[o[0]].img;
        ic.alt = '';
        b.appendChild(ic);
      }
      b.appendChild(el('span', null, o[1]));
      b.appendChild(el('span', 'reg-onglet-n', String(o[2])));
      b.addEventListener('click', function () {
        if (filtre === o[0]) return;
        filtre = o[0];
        view.textContent = '';
        viewRegistre(view);
      });
      onglets.appendChild(b);
    });
    if (liste.length) box.appendChild(onglets);

    var pages = el('div', 'reg-pages');
    if (!liste.length) {
      pages.appendChild(el('p', 'reg-vide', 'Aucun code consigné pour l’instant.'));
    }
    var rang = 0;
    (filtre === 'tout' ? cats : [filtre]).forEach(function (k) {
      var R = RUBRIQUES[k];
      var du = liste.filter(function (e) { return e.rub === k; });
      // L'en-tete de la categorie : son icone, son nom, son compte.
      var sec = el('h3', 'reg-section');
      sec.style.setProperty('--encre', R.c);
      var si = el('img', 'reg-section-img');
      si.src = R.img;
      si.alt = '';
      sec.appendChild(si);
      sec.appendChild(el('span', 'reg-section-nom', R.nom));
      sec.appendChild(el('span', 'reg-section-n',
        du.length + (du.length > 1 ? ' entrées' : ' entrée')));
      pages.appendChild(sec);
      du.forEach(function (e) { pages.appendChild(fiche(e, rang++)); });
    });
    box.appendChild(pages);
    view.appendChild(box);
  }

  function fiche(e, i) {
    var R = RUBRIQUES[e.rub];
    var f = el('article', 'reg-fiche');
    f.dataset.code = e.id;
    f.style.setProperty('--encre', R.c);
    f.style.setProperty('--i', String(i));

    var haut = el('div', 'reg-fiche-haut');
    haut.appendChild(el('h4', 'reg-nom', e.titre));
    if (e.date) haut.appendChild(el('span', 'reg-date', dateTexte(e.date)));
    f.appendChild(haut);

    if (e.code) f.appendChild(el('p', 'reg-code', e.code));
    if (e.morceaux) {
      var m = el('p', 'reg-morceaux');
      e.morceaux.forEach(function (x, k) {
        m.appendChild(el('span', 'reg-morceau' + (x ? '' : ' is-vide'), x || (k + 1) + '?'));
      });
      f.appendChild(m);
    }
    if (e.etapes) {
      var ol = el('ol', 'reg-etapes');
      e.etapes.forEach(function (s) { ol.appendChild(el('li', null, s)); });
      f.appendChild(ol);
    }
    if (e.liste) {
      var ul = el('ul', 'reg-liste');
      e.liste.forEach(function (l) {
        var li = el('li');
        li.appendChild(el('strong', 'reg-liste-code', l[0]));
        li.appendChild(el('span', null, l[1]));
        ul.appendChild(li);
      });
      f.appendChild(ul);
    }

    var dl = el('dl', 'reg-infos');
    dl.appendChild(el('dt', null, 'Où'));
    dl.appendChild(el('dd', null, e.ou));
    dl.appendChild(el('dt', null, 'Utilité'));
    dl.appendChild(el('dd', null, e.utilite));
    f.appendChild(dl);
    return f;
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS['registre'] = { title: 'Registre', render: viewRegistre };
  window.REGISTRE = { icone: icone, trouves: trouves };
})();
