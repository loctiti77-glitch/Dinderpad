// Les trois ecrans qui entourent la peche : la Poissonnerie ou l'on
// troque, le Vestiaire ou l'on s'equipe, et le petit carrefour qui mene
// a l'un ou a l'autre depuis les Items.
(function () {
  var DP = window.DP, M = window.MATERIEL;
  if (!DP || !M) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var FISHERMAN = 'assets/peche/fisherman.webp';
  var CARNET_IMG = 'assets/items/fishbook.webp';

  // Le flotteur d'origine n'a pas d'illustration : on le dessine.
  function vignette(type, item, cls) {
    if (item.img) {
      var im = el('img', cls);
      im.src = item.img;
      im.alt = '';
      im.loading = 'lazy';
      return im;
    }
    var n = el('span', cls + ' mat-dessin');
    n.style.setProperty('--c1', item.couleurs[0]);
    n.style.setProperty('--c2', item.couleurs[1]);
    return n;
  }

  // ==========================================================
  //  La Poissonnerie
  // ==========================================================

  var REPLIQUES = [
    'Alors, ça mord aujourd’hui ?',
    'Montre-moi ce que tu as en double, je te l’échange.',
    'Une bonne canne, et le lac change de visage.',
    'Le flotteur doré ? Il fait remonter des choses… inhabituelles.'
  ];

  function viewBoutique(view) {
    var box = el('div', 'bq');
    var onglet = 'canne';

    // ---- L'en-tete : le poissonnier et sa replique ----
    var tete = el('div', 'bq-tete');
    var portrait = el('img', 'bq-portrait');
    portrait.src = FISHERMAN;
    portrait.alt = '';
    tete.appendChild(portrait);

    var bulle = el('div', 'bq-bulle');
    bulle.appendChild(el('p', 'bq-nom', 'Poissonnerie'));
    var replique = el('p', 'bq-replique',
      REPLIQUES[Math.floor(Math.random() * REPLIQUES.length)]);
    bulle.appendChild(replique);
    tete.appendChild(bulle);
    box.appendChild(tete);

    function dire(txt) { replique.textContent = txt; }

    // ---- Le troc : les doublons, rarete par rarete ----
    var troc = el('div', 'bq-troc');
    box.appendChild(troc);

    function construireTroc() {
      troc.textContent = '';
      troc.appendChild(el('p', 'bq-section', 'Tes doublons'));
      var ligne = el('div', 'bq-doublons');

      M.ORDRE_PALIERS.forEach(function (cle) {
        var p = M.PALIERS[cle];
        var n = M.doublons(p.rarete);
        var carte = el('div', 'bq-doublon');
        carte.dataset.palier = cle;
        carte.style.setProperty('--r', M.couleurPalier(cle));

        carte.appendChild(el('span', 'bq-doublon-rarete', p.nom));
        carte.appendChild(el('strong', 'bq-doublon-n', String(n)));

        var vendre = el('button', 'bq-vendre');
        vendre.type = 'button';
        vendre.disabled = !M.peutVendre(p.rarete);
        vendre.appendChild(el('span', null, 'Vendre ' + p.poissons));
        var pastille = el('img', 'bq-credit');
        pastille.src = DP.creditImg(p.credit);
        pastille.alt = '';
        vendre.appendChild(pastille);
        vendre.appendChild(el('span', null, '× ' + DP.PRICE[p.credit]));

        vendre.addEventListener('click', function () {
          var r = M.vendre(p.rarete);
          if (!r.ok) return dire('Il t’en faut ' + p.poissons + ' en double.');
          dire(p.poissons + ' ' + p.nom.toLowerCase() + 's contre ' +
               r.gagne + ' ' + DP.CREDITS[r.credit].name + '.');
          tout();
        });
        carte.appendChild(vendre);
        ligne.appendChild(carte);
      });
      troc.appendChild(ligne);
    }

    // ---- L'etal : cannes et flotteurs ----
    var etal = el('div', 'bq-etal');
    box.appendChild(etal);

    function construireEtal() {
      etal.textContent = '';

      var tabs = el('div', 'bq-onglets');
      [['canne', 'Cannes'], ['flotteur', 'Flotteurs']].forEach(function (o) {
        var b = el('button', 'bq-onglet', o[1]);
        b.type = 'button';
        b.dataset.type = o[0];
        b.classList.toggle('is-actif', onglet === o[0]);
        b.addEventListener('click', function () { onglet = o[0]; tout(); });
        tabs.appendChild(b);
      });
      etal.appendChild(tabs);

      var grille = el('div', 'bq-grille');
      M.liste(onglet).forEach(function (item) {
        if (!item.palier) return;                 // l'origine ne se vend pas
        var e = M.etat(onglet, item);
        var p = e.prix || M.prix(item);

        var n = el('div', 'bq-article');
        n.dataset.item = item.id;
        n.dataset.palier = item.palier;
        n.style.setProperty('--r', p.couleur);
        n.classList.toggle('is-possede', e.possede);

        n.appendChild(vignette(onglet, item, 'bq-article-img'));

        var txt = el('div', 'bq-article-txt');
        txt.appendChild(el('strong', 'bq-article-nom', item.nom));
        txt.appendChild(el('span', 'bq-article-palier', p.nom));
        txt.appendChild(el('span', 'bq-article-effet', effetTexte(onglet, item)));
        n.appendChild(txt);

        if (e.possede) {
          n.appendChild(el('span', 'bq-possede', 'DANS LE SAC'));
        } else {
          var achats = el('div', 'bq-achats');

          var parPoisson = el('button', 'bq-achat');
          parPoisson.type = 'button';
          parPoisson.disabled = !e.poissons;
          parPoisson.appendChild(el('span', 'bq-achat-n', p.poissons + ' ×'));
          parPoisson.appendChild(el('span', 'bq-achat-quoi', p.nom.toLowerCase()));
          parPoisson.addEventListener('click', function () { faire(item, 'poissons'); });
          achats.appendChild(parPoisson);

          var parCredit = el('button', 'bq-achat');
          parCredit.type = 'button';
          parCredit.disabled = !e.credits;
          var im = el('img', 'bq-credit');
          im.src = DP.creditImg(p.credit);
          im.alt = '';
          parCredit.appendChild(im);
          parCredit.appendChild(el('span', 'bq-achat-n', '× ' + p.credits));
          parCredit.addEventListener('click', function () { faire(item, 'credits'); });
          achats.appendChild(parCredit);

          n.appendChild(achats);
        }
        grille.appendChild(n);
      });
      etal.appendChild(grille);
    }

    function effetTexte(type, item) {
      if (type === 'canne') {
        return 'Tenue des prises lourdes  +' + Math.round(item.puissance * 100) + ' %';
      }
      return 'Chance de rareté  +' + Math.round(item.chance * 100) + ' %';
    }

    function faire(item, mode) {
      var r = M.acheter(onglet, item.id, mode);
      if (!r.ok) return dire('Impossible : ' + r.raison + '.');
      dire(item.nom + ' est à toi. Passe au vestiaire pour la monter.');
      tout();
    }

    // ---- Le pied ----
    var pied = el('div', 'bq-pied');
    var vest = el('a', 'bq-btn', 'Vestiaire');
    vest.href = '#vestiaire';
    pied.appendChild(vest);
    var retour = el('a', 'bq-btn bq-btn--plat', 'Retour à la pêche');
    retour.href = '#peche';
    pied.appendChild(retour);
    box.appendChild(pied);

    function tout() { construireTroc(); construireEtal(); }
    tout();
    view.appendChild(box);
  }

  // ==========================================================
  //  Le Vestiaire
  // ==========================================================

  function viewVestiaire(view) {
    var box = el('div', 'vst');

    var tete = el('div', 'vst-tete');
    tete.appendChild(el('h2', 'vst-titre', 'Vestiaire'));
    var resume = el('p', 'vst-resume');
    tete.appendChild(resume);
    box.appendChild(tete);

    var colonnes = el('div', 'vst-colonnes');
    box.appendChild(colonnes);

    function majResume() {
      var c = M.equipee('canne'), f = M.equipee('flotteur');
      resume.textContent = c.nom + '  ·  ' + f.nom;
    }

    function colonne(type, titre) {
      var col = el('div', 'vst-col');
      col.appendChild(el('p', 'vst-section', titre));
      var liste = el('div', 'vst-liste');

      var sac = DP.materiel(type);
      if (!sac.length) {
        liste.appendChild(el('p', 'vst-vide',
          'Rien ici. Ramasse la canne au bord de l’eau pour commencer.'));
      }

      M.liste(type).forEach(function (item) {
        if (sac.indexOf(item.id) === -1) return;
        var actif = DP.equipe(type) === item.id;
        var n = el('button', 'vst-piece');
        n.type = 'button';
        n.dataset.piece = item.id;
        n.dataset.type = type;
        n.classList.toggle('is-monte', actif);
        n.setAttribute('aria-pressed', actif ? 'true' : 'false');
        n.style.setProperty('--r', item.palier ? M.couleurPalier(item.palier) : '#7f96a8');

        n.appendChild(vignette(type, item, 'vst-img'));
        var txt = el('span', 'vst-txt');
        txt.appendChild(el('strong', null, item.nom));
        txt.appendChild(el('span', 'vst-effet',
          type === 'canne'
            ? 'Tenue  +' + Math.round(item.puissance * 100) + ' %'
            : 'Rareté  +' + Math.round(item.chance * 100) + ' %'));
        txt.appendChild(el('span', 'vst-note', item.texte));
        n.appendChild(txt);
        if (actif) n.appendChild(el('span', 'vst-monte', 'MONTÉ'));

        n.addEventListener('click', function () {
          DP.equiper(type, item.id);
          rebatir();
        });
        liste.appendChild(n);
      });
      col.appendChild(liste);
      return col;
    }

    function rebatir() {
      colonnes.textContent = '';
      colonnes.appendChild(colonne('canne', 'Cannes'));
      colonnes.appendChild(colonne('flotteur', 'Flotteurs'));
      majResume();
    }

    rebatir();

    var pied = el('div', 'vst-pied');
    var bq = el('a', 'bq-btn', 'Poissonnerie');
    bq.href = '#poissonnerie';
    pied.appendChild(bq);
    var carnet = el('a', 'bq-btn bq-btn--plat', 'Carnet de pêche');
    carnet.href = '#peche-collection';
    pied.appendChild(carnet);
    box.appendChild(pied);

    view.appendChild(box);
  }

  // ==========================================================
  //  Le carrefour, depuis les Items
  // ==========================================================

  function viewHub(view) {
    var box = el('div', 'hub');
    box.appendChild(el('h2', 'hub-titre', 'Canne à Pêche'));

    var choix = el('div', 'hub-choix');

    function carte(href, img, titre, sous, cls) {
      var n = el('a', 'hub-carte' + (cls ? ' ' + cls : ''));
      n.href = href;
      var im = el('img', 'hub-img');
      im.src = img;
      im.alt = '';
      n.appendChild(im);
      n.appendChild(el('strong', 'hub-nom', titre));
      n.appendChild(el('span', 'hub-sous', sous));
      return n;
    }

    choix.appendChild(carte('#vestiaire', M.equipee('canne').img || M.CANNES[1].img,
      'Vestiaire', 'Choisir sa canne et son flotteur'));
    choix.appendChild(carte('#peche-collection', CARNET_IMG,
      'Carnet de pêche', 'Les espèces déjà remontées', 'hub-carte--carnet'));

    box.appendChild(choix);
    view.appendChild(box);
  }

  window.VIEWS['poissonnerie'] = { title: 'Poissonnerie', render: viewBoutique };
  window.VIEWS['vestiaire']    = { title: 'Vestiaire',    render: viewVestiaire };
  window.VIEWS['peche-hub']    = { title: 'Canne à Pêche', render: viewHub };

  window.BOUTIQUE = { FISHERMAN: FISHERMAN, CARNET_IMG: CARNET_IMG, REPLIQUES: REPLIQUES };
})();
