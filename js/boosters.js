// La page des boosters : le comptoir, l'ouverture, et la collection.
//
// Elle vit hors du DinderPad mais partage sa sauvegarde : une carte
// tiree ici est aussitot dans le Livret de cartes, cote pad.
(function () {
  var DP = window.DP, C = window.CARTES;
  if (!DP || !C) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function par(id) { return document.getElementById(id); }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function apres(fn, ms) { return setTimeout(fn, reduit ? Math.min(ms, 60) : ms); }

  var achat = par('achat'), mot = par('mot'), bilan = par('bilan');
  var onglets = par('onglets'), grille = par('grille'), pack = par('pack');
  var familleVue = C.FAMILLES[0].id;
  var enCours = false;

  par('profil').textContent = DP.currentProfile().name;

  // ==========================================================
  //  Le comptoir
  // ==========================================================

  function bouton(cls, titre, sous, action) {
    var b = el('button', 'bo-btn ' + cls);
    b.type = 'button';
    b.appendChild(el('strong', 'bo-btn-titre', titre));
    if (sous) b.appendChild(el('span', 'bo-btn-sous', sous));
    b.addEventListener('click', action);
    return b;
  }

  function majComptoir() {
    var m = C.moyens();
    achat.textContent = '';

    if (m.offert) {
      achat.appendChild(bouton('bo-btn--offert', 'Booster du jour', 'Offert — un par jour',
        function () { lancer('offert'); }));
    }

    if (m.illimite) {
      // Les credits sont illimites sur ce profil : rien a compter.
      achat.appendChild(bouton('bo-btn--or', 'Ouvrir un booster', 'Crédits illimités',
        function () { lancer('green'); }));
    } else {
      var rang = el('div', 'bo-monnaies');
      Object.keys(m.credits).forEach(function (k) {
        var c = m.credits[k];
        var b = el('button', 'bo-monnaie');
        b.type = 'button';
        b.disabled = !c.ok;
        b.dataset.credit = k;
        var im = el('img', 'bo-monnaie-img');
        im.src = DP.creditImg(k);
        im.alt = '';
        b.appendChild(im);
        b.appendChild(el('strong', 'bo-monnaie-prix', '× ' + c.prix));
        b.appendChild(el('span', 'bo-monnaie-nom', DP.CREDITS[k].name));
        b.appendChild(el('span', 'bo-monnaie-solde', 'tu en as ' + c.solde));
        b.addEventListener('click', function () { lancer(k); });
        rang.appendChild(b);
      });
      achat.appendChild(rang);
    }

    var e = C.etat();
    bilan.textContent = '';
    [[e.vues + ' / ' + e.total, 'cartes différentes'],
     [String(e.exemplaires), 'cartes en tout'],
     [String(DP.boostersOuverts()), 'boosters ouverts']].forEach(function (x) {
      var b = el('div', 'bo-chiffre');
      b.appendChild(el('strong', null, x[0]));
      b.appendChild(el('span', null, x[1]));
      bilan.appendChild(b);
    });
  }

  // ==========================================================
  //  La collection
  // ==========================================================

  function majCollection() {
    var e = C.etat();
    onglets.textContent = '';
    C.FAMILLES.forEach(function (f) {
      var b = el('button', 'bo-onglet' + (f.id === familleVue ? ' is-actif' : ''));
      b.type = 'button';
      b.appendChild(el('strong', null, f.nom));
      b.appendChild(el('span', null, e.familles[f.id].vues + ' / ' + e.familles[f.id].total));
      var jauge = el('i', 'bo-onglet-jauge');
      jauge.style.width = (e.familles[f.id].total
        ? e.familles[f.id].vues / e.familles[f.id].total * 100 : 0).toFixed(1) + '%';
      b.appendChild(jauge);
      b.addEventListener('click', function () { familleVue = f.id; majCollection(); });
      onglets.appendChild(b);
    });
    grille.textContent = '';
    grille.appendChild(C.grille(familleVue, function (c, n) { C.agrandir(document.body, c, n); }));
    par('versLivret').href = 'index.html#livret/' + familleVue;
  }

  // ==========================================================
  //  L'ouverture d'un booster
  // ==========================================================
  // Le booster arrive, tremble, son bord superieur s'arrache dans un
  // eclat, les cinq cartes en sortent face cachee et se rangent. On les
  // retourne une a une : la rarete se devine a la lueur, et une carte
  // qu'on n'avait pas le dit.

  function lancer(moyen) {
    if (enCours) return;
    var r = C.ouvrir(moyen);
    if (!r.ok) {
      mot.textContent = r.raison;
      mot.classList.remove('is-refus');
      void mot.offsetWidth;
      mot.classList.add('is-refus');
      return;
    }
    mot.textContent = '';
    enCours = true;
    jouer(r);
  }

  function jouer(r) {
    var scene = el('div', 'bo-ouv');
    scene.setAttribute('role', 'dialog');
    scene.setAttribute('aria-label', 'Ouverture d’un booster');

    scene.appendChild(el('div', 'bo-ouv-rayons'));

    // Le booster, en deux morceaux superposes : le bord qu'on arrache, et
    // le reste.
    var sachet = el('div', 'bo-ouv-pack');
    ['bas', 'haut'].forEach(function (part) {
      var im = el('img', 'bo-ouv-pack-img bo-ouv-pack-img--' + part);
      im.src = pack.src;
      im.alt = '';
      sachet.appendChild(im);
    });
    sachet.appendChild(el('div', 'bo-ouv-eclat'));
    scene.appendChild(sachet);

    // Les cinq cartes, face cachee.
    var rang = el('div', 'bo-ouv-cartes');
    var restantes = r.cartes.length, nouvelles = 0;
    var bascules = r.cartes.map(function (c, i) {
      var neuve = r.neuves.indexOf(c.id) !== -1;
      var b = el('button', 'bo-flip');
      b.type = 'button';
      b.style.setProperty('--i', String(i));
      b.style.setProperty('--r', C.rarete(c.rarete).couleur);
      b.dataset.rarete = c.rarete;
      b.setAttribute('aria-label', 'Retourner la carte ' + (i + 1));
      var dedans = el('div', 'bo-flip-dedans');
      var recto = el('div', 'bo-flip-face bo-flip-face--recto');
      recto.appendChild(C.element(c));
      var verso = el('div', 'bo-flip-face bo-flip-face--verso');
      verso.appendChild(C.dos());
      dedans.appendChild(verso);
      dedans.appendChild(recto);
      b.appendChild(dedans);
      b.appendChild(el('span', 'bo-flip-halo'));
      if (neuve) b.appendChild(el('span', 'bo-flip-neuve', 'Nouvelle !'));

      b.addEventListener('click', function () { retourner(b, c, neuve); });
      rang.appendChild(b);
      return { b: b, c: c, neuve: neuve };
    });
    scene.appendChild(rang);

    var pied = el('div', 'bo-ouv-pied');
    var consigne = el('p', 'bo-ouv-consigne', '');
    pied.appendChild(consigne);
    var actions = el('div', 'bo-ouv-actions');
    pied.appendChild(actions);
    scene.appendChild(pied);

    document.body.appendChild(scene);
    document.body.classList.add('bo--ouverture');

    function retourner(b, c, neuve) {
      if (b.classList.contains('is-retournee') || b.classList.contains('is-attente')) return;
      if (!scene.classList.contains('is-pretes')) return;
      // Une legendaire se fait attendre : la carte tremble avant de ceder.
      var attente = c.rarete === 'legendaire' ? 650 : c.rarete === 'epique' ? 280 : 0;
      b.classList.add('is-attente');
      apres(function () {
        b.classList.remove('is-attente');
        b.classList.add('is-retournee');
        b.setAttribute('aria-label', c.nom + ', ' + C.rarete(c.rarete).nom +
                       (neuve ? ', nouvelle carte' : ''));
        if (neuve) nouvelles++;
        if (c.rarete === 'legendaire') {
          scene.classList.remove('is-legendaire');
          void scene.offsetWidth;
          scene.classList.add('is-legendaire');
        }
        restantes--;
        if (!restantes) apres(conclure, 700);
      }, attente);
    }

    function toutRetourner() {
      bascules.forEach(function (x, i) {
        apres(function () { retourner(x.b, x.c, x.neuve); }, i * 260);
      });
    }

    function conclure() {
      scene.classList.add('is-finie');
      consigne.textContent = nouvelles
        ? nouvelles + ' nouvelle' + (nouvelles > 1 ? 's' : '') + ' carte' + (nouvelles > 1 ? 's' : '') +
          ' pour le livret.'
        : 'Rien de nouveau cette fois : cinq doubles.';
      actions.textContent = '';
      var m = C.moyens();
      var suite = m.offert ? 'offert' : m.illimite ? 'green'
        : Object.keys(m.credits).filter(function (k) { return m.credits[k].ok; })[0];
      if (suite) {
        var encore = el('button', 'bo-btn bo-btn--or bo-btn--court', 'Encore un');
        encore.type = 'button';
        encore.addEventListener('click', function () { fermer(function () { lancer(suite); }); });
        actions.appendChild(encore);
      }
      var ranger = el('button', 'bo-btn bo-btn--plat bo-btn--court', 'Ranger les cartes');
      ranger.type = 'button';
      ranger.addEventListener('click', function () { fermer(); });
      actions.appendChild(ranger);
      ranger.focus();
    }

    function fermer(ensuite) {
      scene.classList.add('is-fermeture');
      apres(function () {
        scene.remove();
        document.body.classList.remove('bo--ouverture');
        enCours = false;
        majComptoir();
        majCollection();
        if (ensuite) ensuite();
      }, 300);
    }

    // --- La mise en scene ---
    apres(function () { scene.classList.add('is-secousse'); }, 450);
    apres(function () { scene.classList.remove('is-secousse'); scene.classList.add('is-dechire'); }, 1350);
    apres(function () { scene.classList.add('is-sortie'); }, 1900);
    apres(function () {
      scene.classList.add('is-pretes');
      consigne.textContent = 'Touche les cartes pour les retourner.';
      var tout = el('button', 'bo-btn bo-btn--plat bo-btn--court', 'Tout retourner');
      tout.type = 'button';
      tout.addEventListener('click', function () { tout.remove(); toutRetourner(); });
      actions.appendChild(tout);
    }, 3000);
  }

  majComptoir();
  majCollection();

  // Pour les essais : de quoi piloter la page sans la regarder.
  window.BOOSTERS = { lancer: lancer, majComptoir: majComptoir, majCollection: majCollection };
})();
