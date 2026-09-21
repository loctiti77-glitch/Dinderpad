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
    var choix = null;                    // l'article selectionne dans la liste

    function reduit() {
      return !!(window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    // ---- La colonne de gauche : le poissonnier, en grand ----
    var gauche = el('div', 'bq-gauche');
    var portrait = el('img', 'bq-portrait');
    portrait.src = FISHERMAN;
    portrait.alt = '';
    gauche.appendChild(portrait);

    var bourse = el('div', 'bq-bourse');
    gauche.appendChild(bourse);
    box.appendChild(gauche);

    // ---- La colonne de droite : l'enseigne, la liste, le pied ----
    var droite = el('div', 'bq-droite');

    var banniere = el('div', 'bq-banniere');
    banniere.appendChild(el('span', 'bq-enseigne', 'Poissonnerie'));
    var tabs = el('div', 'bq-onglets');
    [['canne', 'Cannes'], ['flotteur', 'Flotteurs'], ['hamecon', 'Hameçons'],
     ['leurre', 'Leurres'], ['vendre', 'Vendre']]
      .forEach(function (o) {
        var b = el('button', 'bq-onglet', o[1]);
        b.type = 'button';
        b.dataset.type = o[0];
        b.addEventListener('click', function () {
          onglet = o[0];
          choix = null;
          tout();
        });
        tabs.appendChild(b);
      });
    banniere.appendChild(tabs);
    droite.appendChild(banniere);

    var liste = el('div', 'bq-liste');
    droite.appendChild(liste);

    var pied = el('div', 'bq-pied');
    droite.appendChild(pied);
    box.appendChild(droite);

    // ---- La barre de dialogue, en bas ----
    // Le poissonnier lâche son secret tant qu'on ne l'a pas trouvé. C'est
    // la seule piste donnée vers la souche du nord-ouest : sans elle,
    // l'arme serait introuvable autrement qu'au hasard.
    var barre = el('p', 'bq-barre', DP.aLArme()
      ? 'Sélectionne un article.'
      : 'Entre nous : il y a un truc qui luit dans une vieille souche, ' +
        'tout au nord-ouest du bois. Moi, j’y vais pas.');
    box.appendChild(barre);

    function dire(txt) {
      barre.textContent = txt;
      barre.classList.remove('is-neuf');
      void barre.offsetWidth;
      barre.classList.add('is-neuf');
    }

    // ---- La bourse : les doublons, rarete par rarete ----
    function construireBourse() {
      bourse.textContent = '';
      bourse.appendChild(el('p', 'bq-bourse-titre', 'Tes doublons'));
      M.ORDRE_PALIERS.forEach(function (cle) {
        var p = M.PALIERS[cle];
        var chip = el('div', 'bq-chip');
        chip.dataset.palier = cle;
        chip.style.setProperty('--r', M.couleurPalier(cle));
        chip.appendChild(el('span', 'bq-chip-nom', p.nom));
        chip.appendChild(el('strong', 'bq-chip-n', String(M.doublons(p.rarete))));
        bourse.appendChild(chip);
      });
    }

    // ---- Une ligne de la liste ----
    function ligne(opts) {
      var n = el('button', 'bq-ligne');
      n.type = 'button';
      if (opts.id) n.dataset.item = opts.id;
      if (opts.palier) n.dataset.palier = opts.palier;
      n.style.setProperty('--r', opts.couleur);
      n.classList.toggle('is-choisi', !!opts.choisi);
      n.classList.toggle('is-possede', !!opts.possede);

      var icone = el('span', 'bq-ligne-icone');
      icone.appendChild(opts.vignette);
      n.appendChild(icone);

      var txt = el('span', 'bq-ligne-txt');
      txt.appendChild(el('strong', 'bq-ligne-nom', opts.nom));
      txt.appendChild(el('span', 'bq-ligne-sous', opts.sous));
      n.appendChild(txt);

      var prix = el('span', 'bq-ligne-prix');
      opts.prix.forEach(function (p) {
        var bloc = el('span', 'bq-tarif' + (p.ok ? '' : ' is-court'));
        if (p.img) {
          var im = el('img', 'bq-credit');
          im.src = p.img;
          im.alt = '';
          bloc.appendChild(im);
        }
        bloc.appendChild(el('span', null, p.texte));
        prix.appendChild(bloc);
      });
      n.appendChild(prix);

      n.addEventListener('click', opts.clic);
      return n;
    }

    // ---- La liste, selon l'onglet ----
    function construireListe() {
      liste.textContent = '';
      var bs = tabs.querySelectorAll('.bq-onglet');
      for (var i = 0; i < bs.length; i++) {
        bs[i].classList.toggle('is-actif', bs[i].dataset.type === onglet);
      }
      if (onglet === 'vendre') return construireVente();
      if (onglet === 'hamecon') return construireHamecons();
      if (onglet === 'leurre') return construireLeurres();

      M.liste(onglet).forEach(function (item) {
        if (!item.palier) return;               // l'origine ne se vend pas
        var e = M.etat(onglet, item);
        var p = e.prix || M.prix(item);
        liste.appendChild(ligne({
          id: item.id, palier: item.palier, couleur: p.couleur,
          vignette: vignette(onglet, item, 'bq-ligne-img'),
          nom: item.nom,
          sous: e.possede ? 'Déjà dans ton sac.' : effetTexte(onglet, item),
          possede: e.possede,
          choisi: choix === item.id,
          prix: e.possede ? [{ texte: 'possédé', ok: true }] : [
            { texte: p.poissons + ' × ' + p.nom.toLowerCase(), ok: e.poissons },
            { texte: '× ' + p.credits, img: DP.creditImg(p.credit), ok: e.credits }
          ],
          clic: function () {
            if (e.possede) return dire('Tu l’as déjà. Passe au vestiaire pour la monter.');
            choix = item.id;
            dire(item.nom + ' — ' + effetTexte(onglet, item));
            tout();
          }
        }));
      });
    }

    // Les hamecons ne se paient pas au bareme : chacun demande d'abord
    // qu'on ait fait quelque chose, puis un nombre de credits ecrit sur
    // l'article. La ligne montre donc la condition et sa progression.
    function construireHamecons() {
      M.liste('hamecon').forEach(function (item) {
        if (!item.palier) return;                 // l'origine ne se vend pas
        var e = M.etatHamecon(item);
        var ex = e.exigence;
        var prixs;
        if (e.possede) {
          prixs = [{ texte: 'possédé', ok: true }];
        } else {
          prixs = [
            { texte: ex.fait + ' / ' + ex.seuil, ok: ex.remplie },
            { texte: '× ' + item.credits, img: DP.creditImg(item.credit),
              ok: e.credits }
          ];
        }
        liste.appendChild(ligne({
          id: item.id, palier: item.palier, couleur: M.couleurPalier(item.palier),
          vignette: vignette('hamecon', item, 'bq-ligne-img'),
          nom: item.nom,
          sous: e.possede ? 'Déjà dans ton sac.' : item.exigeTexte,
          possede: e.possede,
          choisi: choix === item.id,
          prix: prixs,
          clic: function () {
            if (e.possede) return dire('Tu l’as déjà. Passe au vestiaire pour le monter.');
            choix = item.id;
            dire(!ex.remplie
              ? item.exigeTexte + ' — tu en es à ' + ex.fait + ' sur ' + ex.seuil + '.'
              : item.nom + ' — ' + item.texte);
            tout();
          }
        }));
      });
    }

    // Les leurres, eux, suivent le bareme ordinaire. On en achete un a la
    // fois, et le compte de ceux qu'on a deja est affiche.
    function construireLeurres() {
      M.liste('leurre').forEach(function (item) {
        var p = M.prix(item);
        var n = DP.leurre(item.id);
        var assezP = M.doublons(p.rarete) >= p.poissons;
        var assezC = DP.canAfford(p.credit);
        liste.appendChild(ligne({
          id: 'leurre-' + item.id, palier: item.palier, couleur: p.couleur,
          vignette: vignette('leurre', item, 'bq-ligne-img'),
          nom: item.nom,
          sous: n ? item.texte + '  ·  ' + n + ' en réserve' : item.texte,
          choisi: choix === 'leurre-' + item.id,
          prix: [
            { texte: p.poissons + ' × ' + p.nom.toLowerCase(), ok: assezP },
            { texte: '× ' + p.credits, img: DP.creditImg(p.credit), ok: assezC }
          ],
          clic: function () {
            choix = 'leurre-' + item.id;
            dire(item.nom + ' — la bête viendra, qu’elle soit à ta portée ou non.');
            tout();
          }
        }));
      });
    }

    function construireVente() {
      M.ORDRE_PALIERS.forEach(function (cle) {
        var p = M.PALIERS[cle];
        var n = M.doublons(p.rarete);
        var assez = n >= p.poissons;
        var im = el('img', 'bq-ligne-img');
        im.src = DP.creditImg(p.credit);
        im.alt = '';
        liste.appendChild(ligne({
          id: 'vendre-' + cle, palier: cle, couleur: M.couleurPalier(cle),
          vignette: im,
          nom: 'Doublons ' + p.nom.toLowerCase() + 's',
          sous: n + ' en double  ·  ' + p.poissons + ' contre ' +
                DP.PRICE[p.credit] + ' ' + DP.CREDITS[p.credit].name,
          choisi: choix === 'vendre-' + cle,
          prix: [{ texte: '× ' + DP.PRICE[p.credit], img: DP.creditImg(p.credit), ok: assez }],
          clic: function () {
            if (!assez) return dire('Il t’en faut ' + p.poissons + ' en double.');
            choix = 'vendre-' + cle;
            dire(p.poissons + ' doublons ' + p.nom.toLowerCase() + 's, ça marche ?');
            tout();
          }
        }));
      });
    }

    function effetTexte(type, item) {
      if (type === 'canne') {
        return 'Tenue des prises lourdes  +' + Math.round(item.puissance * 100) + ' %';
      }
      return 'Chance de rareté  +' + Math.round(item.chance * 100) + ' %';
    }

    // ---- Le pied : ce qu'on fait de l'article choisi ----
    function construirePied() {
      pied.textContent = '';

      if (onglet === 'vendre') {
        var cle = choix ? choix.slice(7) : null;
        var pv = cle ? M.PALIERS[cle] : null;
        var bv = el('button', 'bq-agir', 'VENDRE');
        bv.type = 'button';
        bv.disabled = !pv || !M.peutVendre(pv.rarete);
        bv.addEventListener('click', function () {
          var r = M.vendre(pv.rarete);
          if (!r.ok) return dire('Impossible : ' + r.raison + '.');
          dire('Vendu. +' + r.gagne + ' ' + DP.CREDITS[r.credit].name + '.');
          choix = null;
          tout();
        });
        pied.appendChild(bv);
      } else if (onglet === 'hamecon') {
        var h = choix ? M.trouver('hamecon', choix) : null;
        var eh = h ? M.etatHamecon(h) : null;
        var bh = el('button', 'bq-agir bq-agir--credit', 'Acheter en crédits');
        bh.type = 'button';
        bh.disabled = !eh || !eh.payable;
        bh.addEventListener('click', function () {
          var r = M.acheterHamecon(h.id);
          if (!r.ok) return dire('Impossible : ' + r.raison + '.');
          dire(h.nom + ' est à toi. Passe au vestiaire pour le monter.');
          choix = null;
          tout();
        });
        pied.appendChild(bh);
      } else if (onglet === 'leurre') {
        var lid = choix && choix.indexOf('leurre-') === 0 ? choix.slice(7) : null;
        var lu = lid ? M.trouver('leurre', lid) : null;
        var pl = lu ? M.prix(lu) : null;

        var lp = el('button', 'bq-agir', 'Acheter en poissons');
        lp.type = 'button';
        lp.disabled = !pl || M.doublons(pl.rarete) < pl.poissons;
        lp.addEventListener('click', function () { prendreLeurre(lu, 'poissons'); });
        pied.appendChild(lp);

        var lc = el('button', 'bq-agir bq-agir--credit', 'Acheter en crédits');
        lc.type = 'button';
        lc.disabled = !pl || !DP.canAfford(pl.credit);
        lc.addEventListener('click', function () { prendreLeurre(lu, 'credits'); });
        pied.appendChild(lc);
      } else {
        var item = choix ? M.parId(onglet, choix) : null;
        var e = item ? M.etat(onglet, item) : null;

        var parPoisson = el('button', 'bq-agir', 'Acheter en poissons');
        parPoisson.type = 'button';
        parPoisson.disabled = !e || e.possede || !e.poissons;
        parPoisson.addEventListener('click', function () { faire(item, 'poissons'); });
        pied.appendChild(parPoisson);

        var parCredit = el('button', 'bq-agir bq-agir--credit', 'Acheter en crédits');
        parCredit.type = 'button';
        parCredit.disabled = !e || e.possede || !e.credits;
        parCredit.addEventListener('click', function () { faire(item, 'credits'); });
        pied.appendChild(parCredit);
      }

      var sortir = el('button', 'bq-agir bq-agir--plat', 'Sortir');
      sortir.type = 'button';
      sortir.addEventListener('click', quitter);
      pied.appendChild(sortir);
    }

    function prendreLeurre(item, mode) {
      var r = M.acheterLeurre(item.id, mode);
      if (!r.ok) return dire('Impossible : ' + r.raison + '.');
      dire(item.nom + ' dans la boîte — tu en as ' + r.total + '. ' +
           'Monte-le au vestiaire, et la prochaine ligne l’emportera.');
      tout();
    }

    function faire(item, mode) {
      var r = M.acheter(onglet, item.id, mode);
      if (!r.ok) return dire('Impossible : ' + r.raison + '.');
      dire(item.nom + ' est à toi. Passe au vestiaire pour la monter.');
      choix = null;
      tout();
    }

    // ---- Sortir : on referme la porte avant de repartir ----
    function quitter() {
      box.classList.add('is-sortie');
      setTimeout(function () { location.hash = '#peche'; }, reduit() ? 0 : 380);
    }

    function tout() { construireBourse(); construireListe(); construirePied(); }
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
      var c = M.equipee('canne'), f = M.equipee('flotteur'), h = M.equipee('hamecon');
      var l = DP.leurreMonte();
      var txt = c.nom + '  ·  ' + f.nom + '  ·  ' + h.nom;
      if (l) {
        var lu = M.trouver('leurre', l);
        txt += '  ·  ' + (lu ? lu.nom : l) + ' (' + DP.leurre(l) + ')';
      }
      resume.textContent = txt;
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
        txt.appendChild(el('span', 'vst-effet', effetPiece(type, item)));
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

    // Ce qu'une piece change, dit en une ligne.
    function effetPiece(type, item) {
      if (type === 'canne') {
        return 'Tenue  +' + Math.round(item.puissance * 100) + ' %';
      }
      if (type === 'flotteur') {
        return 'Rareté  +' + Math.round(item.chance * 100) + ' %';
      }
      // L'hameçon.
      var bouts = [];
      if (item.shiny > 1) bouts.push('Brillants  ×' + item.shiny);
      if (item.double) bouts.push('Deux prises par ferrage');
      return bouts.length ? bouts.join('  ·  ') : 'Aucun effet particulier';
    }

    // La boite a leurres : elle ne se monte pas comme le reste, elle se
    // vide. Chaque ligne dit combien il en reste, et un clic la pose au
    // bout de la ligne — ou la retire.
    function colonneLeurres() {
      var col = el('div', 'vst-col');
      col.appendChild(el('p', 'vst-section', 'Leurres'));
      var liste = el('div', 'vst-liste');

      var boite = DP.leurres();
      var ids = M.liste('leurre').map(function (l) { return l.id; })
        .filter(function (id) { return boite[id] > 0; });

      if (!ids.length) {
        liste.appendChild(el('p', 'vst-vide',
          'Aucun leurre. Le poissonnier en vend un par forme de requin.'));
      }

      ids.forEach(function (id) {
        var item = M.trouver('leurre', id);
        var actif = DP.leurreMonte() === id;
        var n = el('button', 'vst-piece vst-piece--leurre');
        n.type = 'button';
        n.dataset.piece = id;
        n.dataset.type = 'leurre';
        n.classList.toggle('is-monte', actif);
        n.setAttribute('aria-pressed', actif ? 'true' : 'false');
        n.style.setProperty('--r', M.couleurPalier(item.palier));

        n.appendChild(vignette('leurre', item, 'vst-img'));
        var txt = el('span', 'vst-txt');
        txt.appendChild(el('strong', null, item.nom));
        txt.appendChild(el('span', 'vst-effet',
          'Rencontre garantie  ·  ' + boite[id] + ' en réserve'));
        txt.appendChild(el('span', 'vst-note', item.texte));
        n.appendChild(txt);
        if (actif) n.appendChild(el('span', 'vst-monte', 'À LA LIGNE'));

        n.addEventListener('click', function () {
          DP.monterLeurre(actif ? '' : id);
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
      colonnes.appendChild(colonne('hamecon', 'Hameçons'));
      colonnes.appendChild(colonneLeurres());
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

  // Deux moities plein ecran : le materiel a gauche, le carnet a droite.
  function viewHub(view) {
    var box = el('div', 'hub');

    var canne = M.equipee('canne');
    var flotteur = M.equipee('flotteur');

    // ---- A gauche : le vestiaire, avec ce qui est monte ----
    var gauche = el('a', 'hub-carte hub-carte--vestiaire');
    gauche.href = '#vestiaire';

    var pile = el('span', 'hub-pile');
    var imCanne = el('img', 'hub-img hub-img--canne');
    imCanne.src = canne.img || M.CANNES[1].img;
    imCanne.alt = '';
    pile.appendChild(imCanne);
    pile.appendChild(vignette('flotteur', flotteur, 'hub-img hub-img--flotteur'));
    gauche.appendChild(pile);

    var txtG = el('span', 'hub-txt');
    txtG.appendChild(el('strong', 'hub-nom', 'Vestiaire'));
    txtG.appendChild(el('span', 'hub-sous', canne.nom + '  ·  ' + flotteur.nom));
    gauche.appendChild(txtG);
    box.appendChild(gauche);

    // ---- A droite : le carnet, en grand ----
    var droite = el('a', 'hub-carte hub-carte--carnet');
    droite.href = '#peche-collection';

    var livre = el('img', 'hub-img hub-img--livre');
    livre.src = CARNET_IMG;
    livre.alt = '';
    droite.appendChild(livre);

    // Le compte annonce ne porte que sur les especes du carnet : les
    // secretes n'y figurent pas, et le faire savoir les trahirait.
    var P = window.POISSONS;
    var prises = DP.prises();
    var pub = P ? P.publiques() : [];
    var faits = P ? pub.filter(function (f) { return prises[f.id]; }).length
                  : Object.keys(prises).length;
    var txtD = el('span', 'hub-txt');
    txtD.appendChild(el('strong', 'hub-nom', 'Carnet de pêche'));
    txtD.appendChild(el('span', 'hub-sous',
      faits + ' / ' + (P ? pub.length : 30) + ' espèces'));
    droite.appendChild(txtD);
    box.appendChild(droite);

    view.appendChild(box);
  }

  window.VIEWS['poissonnerie'] = { title: 'Poissonnerie', render: viewBoutique };
  window.VIEWS['vestiaire']    = { title: 'Vestiaire',    render: viewVestiaire };
  window.VIEWS['peche-hub']    = { title: 'Canne à Pêche', render: viewHub };

  window.BOUTIQUE = { FISHERMAN: FISHERMAN, CARNET_IMG: CARNET_IMG, REPLIQUES: REPLIQUES };
})();
