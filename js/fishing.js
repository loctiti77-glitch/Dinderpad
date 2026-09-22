// Le deuxieme mini-jeu : Fish n'Der.
//
// On choisit un Dinder parmi ceux qu'on a collectes, on arrive sur une
// carte de lacs en 8 bits, on ramasse la canne qui flotte au sol — elle
// rejoint aussitot les Items du DinderPad — puis on peche.
//
// Trente especes a decouvrir, et une chance sur cent de remonter un
// Credit Temporel au lieu d'un poisson.
(function () {
  var DP = window.DP, M = window.MONDE, P = window.POISSONS;
  if (!DP || !M || !P) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TS = M.TS, T = M.T, bruit = M.bruit;
  var MW = 48, MH = 32;
  var DEPART = { x: 7 * TS + 12, y: 26 * TS + 12 };
  var CANNE = { x: 8 * TS + 24, y: 26 * TS + 12 };    // elle flotte juste a cote

  // La cabane du poissonnier, a quelques pas du depart : on la voit en
  // arrivant. x0..x1 en cases, y0 = le faite du toit, y1 = la facade.
  var CABANE = { x0: 14, x1: 19, y0: 22, y1: 25, porte: 16 };
  // Un peu a l'ecart de la porte : plante devant, il masquait l'enseigne.
  var POISSONNIER = { x: (CABANE.porte + 3.6) * TS, y: (CABANE.y1 + 1.5) * TS };

  // L'enseigne de la boutique, clouee sur le toit : centree sur la cabane,
  // le bas mordant un peu sur les bardeaux.
  var PANNEAU = {
    x: (CABANE.x0 + CABANE.x1 + 1) / 2 * TS,
    y: CABANE.y0 * TS + 9
  };

  // Une chance sur cent : le Credit Temporel.
  var CHANCE_CREDIT = 100;

  // La souche creuse, au fond du bois du nord-ouest. C'est la que dort le
  // Pistolet Lumithique. Rien ne la signale de loin : il faut y aller.
  // L'emplacement a ete choisi dans un creux d'arbres reellement
  // accessible a pied depuis le depart — vingt cases de foret plus loin.
  var SOUCHE = { x: 4, y: 9 };

  // Les boutons de l'ecran de jeu sont des enseignes peintes. Les deux
  // autres roles — ramasser la canne, entrer a la Poissonnerie — restent
  // en toutes lettres : ils n'ont pas d'image.
  var BOUTONS = {
    carnet: 'assets/peche/boutons/carnet.webp',
    lancer: 'assets/peche/boutons/lancer.webp',
    ferrer: 'assets/peche/boutons/ferrer.webp'
  };

  // Ou en est la partie en cours : le pecheur et l'endroit exact ou il se
  // tient. Tant qu'on reste dans les ecrans de peche — boutique, carnet,
  // vestiaire — on y revient sans relancer le jeu depuis l'ecran-titre.
  // Le reperage est tenu a jour en continu : autrement, sortir par le
  // Carnet plutot que par la boutique perdait la partie.
  var reprise = null;

  // La reprise ne vaut que pour l'aller-retour vers les ecrans de peche.
  // Passer par l'accueil ou un autre jeu la perime.
  var ECRANS_PECHE = ['peche', 'poissonnerie', 'vestiaire', 'peche-collection',
                      'peche-hub', 'armurerie'];

  window.addEventListener('hashchange', function () {
    var nom = (location.hash || '').replace(/^#/, '').split('/')[0];
    if (ECRANS_PECHE.indexOf(nom) === -1) reprise = null;
  });

  // ==========================================================
  //  La carte : beaucoup d'eau, et des berges ou se poster
  // ==========================================================

  // Les plans d'eau, decrits en cases : centre, demi-largeur, demi-hauteur.
  // "radio" marque les eaux irradiees : elles ne rendent que des especes
  // Speciales, et se voient de loin a leur jaune fluo.
  var LACS = [
    { x: 13, y: 8,  rx: 7,   ry: 4.4 },
    { x: 33, y: 7,  rx: 8.5, ry: 4 },
    { x: 40, y: 19, rx: 5.5, ry: 4.5, radio: true },
    { x: 21, y: 21, rx: 6.5, ry: 5 },
    { x: 8,  y: 17, rx: 3.6, ry: 3 },
    { x: 31, y: 27, rx: 5,   ry: 3.2 },
    { x: 44, y: 28, rx: 3,   ry: 2.4, radio: true }
  ];

  // La riviere relie les deux grands lacs du nord : elle donne de la
  // berge supplementaire au milieu de la carte.
  var RIVIERE = [[20, 9], [24, 12], [26, 15], [28, 13], [31, 11]];

  function construireCarte() {
    var g = [], x, y;
    for (y = 0; y < MH; y++) {
      g.push([]);
      for (x = 0; x < MW; x++) g[y].push(bruit(x, y, 1) < 0.09 ? T.FLEUR : T.HERBE);
    }

    function eau(cx, cy, rx, ry, radio) {
      for (y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) continue;
          var dx = (x - cx) / rx, dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) g[y][x] = radio ? T.EAU_RAD : T.EAU;
        }
      }
    }
    LACS.forEach(function (l) { eau(l.x, l.y, l.rx, l.ry, l.radio); });

    for (var k = 0; k < RIVIERE.length - 1; k++) {
      var a = RIVIERE[k], b = RIVIERE[k + 1];
      var pas = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) * 3;
      for (var t = 0; t <= pas; t++) {
        eau(a[0] + (b[0] - a[0]) * t / pas, a[1] + (b[1] - a[1]) * t / pas, 1.4, 1.4);
      }
    }

    // Une plage de sable tout autour de l'eau : c'est la qu'on se poste.
    var sable = [];
    for (y = 0; y < MH; y++) {
      for (x = 0; x < MW; x++) {
        if (M.estEau(g[y][x])) continue;
        var pres = false;
        for (var j = -1; j <= 1; j++)
          for (var i = -1; i <= 1; i++)
            if (g[y + j] && M.estEau(g[y + j][x + i])) pres = true;
        if (pres) sable.push([x, y]);
      }
    }
    sable.forEach(function (c) { g[c[1]][c[0]] = T.SABLE; });

    // Quelques joncs au bord de l'eau, cote large.
    for (y = 0; y < MH; y++) {
      for (x = 0; x < MW; x++) {
        if (g[y][x] !== T.EAU) continue;
        var berge = (g[y][x - 1] === T.SABLE) || (g[y][x + 1] === T.SABLE) ||
                    (g[y - 1] && g[y - 1][x] === T.SABLE) || (g[y + 1] && g[y + 1][x] === T.SABLE);
        if (berge && bruit(x, y, 7) > 0.88) g[y][x] = T.ROSEAU;
      }
    }

    // Le bois : jamais sur le sable, pour ne jamais boucher une berge.
    for (y = 0; y < MH; y++) {
      for (x = 0; x < MW; x++) {
        if (g[y][x] !== T.HERBE && g[y][x] !== T.FLEUR) continue;
        if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) { g[y][x] = T.ARBRE; continue; }
        // On laisse degage autour du depart, de la canne et de la cabane.
        var dc = Math.abs(x - 8) + Math.abs(y - 26);
        if (dc < 6) continue;
        if (x >= CABANE.x0 - 2 && x <= CABANE.x1 + 2 &&
            y >= CABANE.y0 - 2 && y <= CABANE.y1 + 3) continue;
        var n = bruit(x, y, 2);
        if (n < 0.15) g[y][x] = T.ARBRE;
        else if (n < 0.19) g[y][x] = T.BUISSON;
        else if (n < 0.215) g[y][x] = T.ROCHER;
      }
    }

    // La souche, plantee dans son creux d'arbres.
    if (g[SOUCHE.y] && g[SOUCHE.y][SOUCHE.x] !== undefined) {
      g[SOUCHE.y][SOUCHE.x] = T.SOUCHE;
    }

    // La cabane : deux rangees de toit, deux de facade, une porte au milieu.
    for (y = CABANE.y0; y <= CABANE.y1; y++) {
      for (x = CABANE.x0; x <= CABANE.x1; x++) {
        if (!g[y] || g[y][x] === undefined) continue;
        g[y][x] = (y <= CABANE.y0 + 1) ? T.TOIT : T.CABANE;
      }
    }
    g[CABANE.y1][CABANE.porte] = T.PORTE_BOIS;
    g[CABANE.y1][CABANE.porte + 1] = T.PORTE_BOIS;

    // Le parvis devant la cabane, et le chemin qui y mene depuis le depart.
    for (y = CABANE.y1 + 1; y <= CABANE.y1 + 2; y++)
      for (x = CABANE.x0 - 1; x <= CABANE.x1 + 1; x++)
        if (g[y] && g[y][x] !== undefined) g[y][x] = T.CHEMIN;
    for (x = 7; x <= CABANE.x0; x++)
      for (y = 26; y <= 27; y++)
        if (g[y] && g[y][x] !== undefined) g[y][x] = T.CHEMIN;

    // Un ponton sur le plus grand lac : on y peche au-dessus de l'eau.
    var pl = LACS[1];
    for (y = Math.round(pl.y + pl.ry); y >= Math.round(pl.y); y--) {
      if (g[y] && g[y][pl.x] !== undefined) g[y][pl.x] = T.PONTON;
    }

    return g;
  }

  // Ce qu'on annonce au joueur : les especes du carnet, secretes exclues.
  // Sans quoi le compteur trahirait leur existence, et pire, depasserait
  // son propre total des qu'une secrete aurait mordu.
  function comptePublic() {
    var prises = DP.prises();
    var pub = P.publiques();
    var faits = pub.filter(function (f) { return prises[f.id]; }).length;
    return faits + ' / ' + pub.length + ' espèces';
  }

  // ==========================================================
  //  L'ecran du mini-jeu
  // ==========================================================

  function viewPeche(view) {
    var jeu = el('div', 'pe');
    jeu.dataset.etape = 'choix';
    view.appendChild(jeu);

    var choisi = null;
    var minuteurs = [];
    function plusTard(fn, ms) { var t = setTimeout(fn, ms); minuteurs.push(t); return t; }
    function toutAnnuler() { minuteurs.forEach(clearTimeout); minuteurs = []; }
    function vivant() { return document.body.contains(jeu); }

    // ---------- 1. Le choix du pecheur ----------

    function ecranChoix() {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'choix';

      var tete = el('div', 'pe-tete');
      tete.appendChild(el('h2', 'pe-titre', 'Fish n’Der'));
      tete.appendChild(el('p', 'pe-compte', comptePublic()));
      jeu.appendChild(tete);

      var owned = DP.owned();

      if (!owned.length) {
        var vide = el('div', 'pe-vide');
        vide.appendChild(el('p', 'pe-vide-txt',
          'Tu n’as encore aucun Dinder. Ouvre une Dindise pour en obtenir un, ' +
          'puis reviens pêcher avec lui.'));
        var go = el('a', 'pe-btn', 'Win Dinders');
        go.href = '#win-dinders';
        vide.appendChild(go);
        jeu.appendChild(vide);
        return;
      }

      jeu.appendChild(el('p', 'pe-consigne', 'Qui part à la pêche ?'));

      var grille = el('div', 'pe-roster');
      owned.forEach(function (id) {
        var d = DP.byId(id);
        if (!d) return;
        var n = el('button', 'pe-carte');
        n.type = 'button';
        n.dataset.id = id;
        n.dataset.rarity = DP.rarityKey(d.rarity);

        var img = el('img', 'pe-sprite');
        img.src = DP.sprite(id, 'duel');
        img.alt = '';
        n.appendChild(img);
        n.appendChild(el('span', 'pe-nom', d.name));
        n.addEventListener('click', function () {
          choisi = id;
          ecranCarte();
        });
        grille.appendChild(n);
      });
      jeu.appendChild(grille);

      var pied = el('div', 'pe-pied');
      var carnet = el('a', 'pe-btn pe-btn--plat', 'Mon carnet de pêche');
      carnet.href = '#peche-collection';
      pied.appendChild(carnet);
      jeu.appendChild(pied);
    }

    // ---------- 2. La carte et la peche ----------

    function ecranCarte(ou) {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'carte';

      var scene = el('div', 'pe-scene');
      // Sortir du magasin : le rideau se leve au lieu de tout recommencer.
      if (ou) scene.classList.add('is-entree');
      var cv = el('canvas', 'pe-canvas');
      cv.width = 480; cv.height = 316;
      scene.appendChild(cv);

      var hud = el('div', 'pe-hud');
      var hudTxt = el('span', 'pe-hud-txt', '');
      hud.appendChild(hudTxt);
      scene.appendChild(hud);

      var stick = el('div', 'pe-stick');
      var pomme = el('div', 'pe-pomme');
      stick.appendChild(pomme);
      scene.appendChild(stick);

      var action = el('button', 'pe-action');
      action.type = 'button';
      action.hidden = true;
      scene.appendChild(action);

      // La minicarte : la carte entiere en un coup d'oeil, avec les
      // eaux, la cabane, la souche et le point ou l'on se tient. Elle est
      // peinte une fois pour le decor, et rafraichie a chaque pas pour ce
      // qui bouge.
      var mini = el('div', 'pe-mini');
      var miniCv = el('canvas', 'pe-mini-cv');
      miniCv.width = MW * 3;
      miniCv.height = MH * 3;
      mini.appendChild(miniCv);
      scene.appendChild(mini);

      var carnetBtn = el('a', 'pe-carnet');
      carnetBtn.href = '#peche-collection';
      carnetBtn.setAttribute('aria-label', 'Carnet de pêche');
      carnetBtn.title = 'Carnet de pêche';
      var carnetImg = el('img', 'pe-carnet-img');
      carnetImg.src = BOUTONS.carnet;
      carnetImg.alt = '';
      carnetBtn.appendChild(carnetImg);
      scene.appendChild(carnetBtn);

      var prise = el('div', 'pe-prise');
      prise.hidden = true;
      scene.appendChild(prise);

      // Les deux jauges de la bagarre : ce qu'on a remonte, et ce que la
      // ligne encaisse.
      var panneauLutte = el('div', 'pe-lutte');
      panneauLutte.hidden = true;
      var txtLutte = el('span', 'pe-lutte-txt', 'Mouline !');
      panneauLutte.appendChild(txtLutte);
      var jaugeL = el('div', 'pe-lutte-jauge pe-lutte-jauge--prise');
      var barreLutte = el('div', 'pe-lutte-plein');
      jaugeL.appendChild(barreLutte);
      jaugeL.appendChild(el('span', 'pe-lutte-nom', 'REMONTÉE'));
      panneauLutte.appendChild(jaugeL);
      var jaugeT = el('div', 'pe-lutte-jauge pe-lutte-jauge--ligne');
      var barreTension = el('div', 'pe-lutte-plein pe-lutte-plein--ligne');
      jaugeT.appendChild(barreTension);
      jaugeT.appendChild(el('span', 'pe-lutte-nom', 'LIGNE'));
      panneauLutte.appendChild(jaugeT);
      scene.appendChild(panneauLutte);

      jeu.appendChild(scene);

      var g = construireCarte();

      // Les artefacts caches dans le bois et au bord des lacs.
      var ART = window.ARTEFACTS;
      var cachesP = ART ? ART.caches('peche', g, { x: Math.floor(DEPART.x / TS), y: Math.floor(DEPART.y / TS) }, {
        graine: 517,
        eviter: [{ x: SOUCHE.x, y: SOUCHE.y }, { x: CABANE.porte, y: CABANE.y1 + 1 }]
      }) : [];

      // Des que la carte est la, la partie devient reprenable.
      reprise = {
        dinder: choisi,
        x: ou ? ou.x : DEPART.x,
        y: ou ? ou.y : DEPART.y,
        dir: ou ? ou.dir : 0
      };

      // --- L'etat de la peche ---
      // repos → lancee → attente → ca-mord → (prise | rate)
      var etat = 'repos';
      var bouchon = null;          // la position du flotteur, en pixels monde
      var depuis = 0;              // date du dernier changement d'etat
      var balade = null;
      var canneAuSol = !DP.aLaCanne();
      var armeAuSol = !DP.aLArme();
      var devantLaSouche = false;
      var duel = null;             // le duel en cours contre un requin
      var surgi = null;            // la bete en train de sortir de l'eau
      var M2 = window.MATERIEL;
      var mordant = null, mordantCm = 0, lourd = false;
      var lutte = null;                  // la bagarre avec une grosse piece
      var mordantShiny = false;       // la prise est-elle dans sa seconde livree ?
      var irradie = false;            // la ligne est-elle en eau fluo ?
      // Les especes secretes se meritent : certaines ne se montrent qu'au
      // pecheur qui est reste longtemps. On compte donc les lancers de la
      // partie en cours, et ils repartent de zero au prochain passage.
      var lancers = 0;
      var devantCabane = false;

      // La mise en scene : le vol du bouchon a l'aller, celui du poisson
      // au retour, et les ronds dans l'eau quand ca plouf.
      var vol = null, gerbe = null;
      var CAST = 460, SORTIE = 820;

      function maintenant() {
        return (window.performance && performance.now) ? performance.now() : Date.now();
      }

      function dire(txt) { hudTxt.textContent = txt; }

      var estEau = M.estEau;

      // La case d'eau juste devant, s'il y en a une.
      function eauDevant() {
        var c = balade.caseDevant();
        return estEau(balade.tuile(c[0], c[1])) ? c : null;
      }

      // Ou tombe le bouchon : on envoie la ligne aussi loin que l'eau le
      // permet, jusqu'a trois cases. Sur une seule, le lancer ne se voyait
      // pas — le bouchon retombait sur les pieds du pecheur.
      function pointDeChute() {
        var c = eauDevant();
        if (!c) return null;
        var d = balade.chef.dir;
        var dx = d === balade.DIRS.gauche ? -1 : (d === balade.DIRS.droite ? 1 : 0);
        var dy = d === balade.DIRS.haut ? -1 : (d === balade.DIRS.bas ? 1 : 0);
        var loin = c;
        for (var i = 1; i < 3; i++) {
          var n = [c[0] + dx * i, c[1] + dy * i];
          if (!estEau(balade.tuile(n[0], n[1]))) break;
          loin = n;
        }
        return loin;
      }

      function pretALancer() { return DP.aLaCanne() && !!eauDevant(); }

      // --- Les actions ---

      function lancer() {
        var c = pointDeChute();
        if (!c) return;
        lancers++;
        irradie = balade.tuile(c[0], c[1]) === T.EAU_RAD;
        var cible = { x: (c[0] + 0.5) * TS, y: (c[1] + 0.5) * TS };

        // Le bouchon part de la main du pecheur et file vers l'eau.
        etat = 'lancement';
        bouchon = null;
        vol = {
          t0: maintenant(), duree: reduit ? 1 : CAST, sens: 'aller',
          de: { x: balade.chef.x, y: balade.chef.y - 18 }, vers: cible
        };
        dire('Et hop…');
        majAction();

        plusTard(function () {
          if (!vivant() || etat !== 'lancement') return;
          vol = null;
          gerbe = { t0: maintenant(), x: cible.x, y: cible.y };
          bouchon = cible;
          etat = 'lancee';
          depuis = maintenant();
          dire('La ligne est à l’eau…');
          poserLigne();
        }, reduit ? 0 : CAST);
      }

      // Ce qui vient mordre. Les secretes passent en premier, avec leur
      // condition et leur chance propre ; a defaut, le tirage ordinaire,
      // auquel s'ajoutent les evolutions deja ecloses.
      function choisirPrise() {
        var secret = P.tirerSecret({
          irradie: irradie,
          canne: DP.equipe('canne'),
          flotteur: DP.equipe('flotteur'),
          lancers: lancers,
          prises: DP.prises()
        });
        if (secret) return secret;
        return P.tirer(M2 ? M2.chanceRarete() : 0, irradie, DP.aPeche);
      }

      function poserLigne() {
        majAction();

        // Parfois rien ne vient : il faut relancer.
        var mord = Math.random() < 0.68;
        var delai = reduit ? 300 : 1200 + Math.random() * 2800;

        // Avant toute chose : le requin. Il ne se montre qu'a qui porte le
        // Pistolet Lumithique, et rarement — sauf si un leurre est a la
        // ligne, auquel cas la bete appelee vient a coup sur.
        var R = window.REQUIN;
        var appat = DP.leurreMonte();
        if (R && DP.aLArme() && appat) {
          DP.consommerLeurre(appat);
          return plusTard(function () {
            if (vivant() && etat === 'lancee') rencontre(appat);
          }, Math.min(delai, reduit ? 300 : 1100));
        }
        if (R && DP.aLArme() &&
            Math.floor(Math.random() * R.CHANCE_RENCONTRE) === 0) {
          return plusTard(function () {
            if (vivant() && etat === 'lancee') rencontre();
          }, delai);
        }

        plusTard(function () {
          if (!vivant() || etat !== 'lancee') return;
          if (!mord) {
            etat = 'rien';
            dire('Rien ne mord… relance ta ligne.');
            majAction();
            plusTard(function () { if (etat === 'rien') ranger(); }, 1400);
            return;
          }

          // La prise est decidee ici : c'est son poids qui fixe le temps
          // dont on dispose pour ferrer, et la canne qui le rattrape.
          mordant = choisirPrise();
          mordantShiny = P.estShiny(mordant.id, M2 ? M2.chanceShiny() : 1);
          mordantCm = P.taille(mordant);
          var kg = P.poids(mordant, mordantCm);
          lourd = P.charge(kg) > 0.55;
          var fenetre = M2 ? M2.fenetreFerrage(kg) : 1600;

          etat = 'mord';
          depuis = performance.now();
          dire(lourd ? 'ÇA TIRE FORT ! Ferre !' : 'ÇA MORD ! Ferre !');
          majAction();
          plusTard(function () {
            if (!vivant() || etat !== 'mord') return;
            etat = 'rate';
            dire(lourd ? 'Trop lourd, la ligne file…' : 'Il s’est décroché…');
            majAction();
            plusTard(function () { if (etat === 'rate') ranger(); }, 1400);
          }, reduit ? 4000 : fenetre);
        }, delai);
      }

      function ferrer() {
        if (etat !== 'mord') return;

        // Une chance sur cent : ce n'est pas un poisson.
        var credit = Math.floor(Math.random() * CHANCE_CREDIT) === 0;
        var f = credit ? null : (mordant || choisirPrise());
        var brillant = !credit && mordantShiny;
        var cm = f ? (mordantCm || P.taille(f)) : 0;
        var kg = f ? P.poids(f, cm) : 0;

        // Une belle piece ne se sort pas d'un coup : on l'a ferree, il
        // reste a la remonter.
        if (f && !credit && P.charge(kg) >= SEUIL_LUTTE) {
          return commencerLutte(f, cm, kg, brillant);
        }

        sortirLaPrise(f, cm, kg, brillant, credit);
      }

      // La prise sort de l'eau et vole jusqu'au pecheur avant qu'on
      // l'annonce : c'est le moment ou l'on voit ce qu'on a ferre.
      function sortirLaPrise(f, cm, kg, brillant, credit) {
        etat = 'sortie';
        dire(lourd ? 'Ferré ! Ça pèse…' : 'Ferré !');
        majAction();
        gerbe = { t0: maintenant(), x: bouchon.x, y: bouchon.y, fort: lourd };
        vol = {
          t0: maintenant(), duree: reduit ? 1 : SORTIE, sens: 'retour',
          de: { x: bouchon.x, y: bouchon.y },
          vers: { x: balade.chef.x, y: balade.chef.y - 30 },
          poisson: f, credit: credit, shiny: brillant
        };

        plusTard(function () {
          if (!vivant() || etat !== 'sortie') return;
          vol = null;
          bouchon = null;
          etat = 'prise';
          if (credit) { DP.earn('pink', 1); return montrerCredit(); }
          var neuf = !DP.aPeche(f.id);
          var e = DP.noterPrise(f.id, cm, kg, brillant);

          // Le Double-Hameçon ramene une seconde prise de la meme espece,
          // tiree a part : c'est bien deux poissons, pas un compte gonfle.
          var second = null;
          if (M2 && M2.doublePrise()) {
            var cm2 = P.taille(f);
            var kg2 = P.poids(f, cm2);
            var brillant2 = P.estShiny(f.id, M2.chanceShiny());
            DP.noterPrise(f.id, cm2, kg2, brillant2);
            second = { cm: cm2, kg: kg2, brillant: brillant2 };
            e = DP.prises()[f.id];
          }

          // L'evolution se declenche au moment ou la prise sort de l'eau :
          // c'est la enieme fois qu'on la prend, et elle change de forme
          // dans les mains du pecheur.
          var evo = P.evolutionDe(f.id);
          if (evo && !DP.aPeche(evo.id) && e.n >= evo.seuil) {
            return montrerPoisson(f, cm, kg, neuf, e, brillant, function () {
              evoluer(f, evo);
            }, second);
          }
          montrerPoisson(f, cm, kg, neuf, e, brillant, null, second);
        }, reduit ? 0 : SORTIE);
      }

      function ranger() {
        etat = 'repos';
        bouchon = null;
        vol = null; gerbe = null;
        mordant = null; mordantCm = 0; lourd = false; irradie = false;
        lutte = null;
        panneauLutte.hidden = true;
        scene.classList.remove('is-lutte');
        mordantShiny = false;
        surgi = null;
        scene.classList.remove('is-secousse');
        if (duel) { duel.arreter(); duel = null; }
        prise.hidden = true;
        prise.textContent = '';
        dire('');
        majAction();
      }

      function devantLaPorte() {
        var c = balade.caseDuChef();
        return c[1] >= CABANE.y1 && c[1] <= CABANE.y1 + 1 &&
               c[0] >= CABANE.porte - 1 && c[0] <= CABANE.porte + 2;
      }

      // Les deux roles du jeu ont leur enseigne ; les autres restent ecrits.
      function poserAction(role, texte) {
        if (action.dataset.role === role) return;
        action.dataset.role = role;
        action.textContent = '';
        if (BOUTONS[role]) {
          var im = el('img', 'pe-action-img');
          im.src = BOUTONS[role];
          im.alt = texte;
          action.appendChild(im);
          action.setAttribute('aria-label', texte);
        } else {
          action.textContent = texte;
          action.removeAttribute('aria-label');
        }
      }

      function majAction() {
        if (etat === 'lutte') {
          action.hidden = false;
          poserAction('mouliner', 'MOULINER');
        } else if (etat === 'mord') {
          action.hidden = false;
          poserAction('ferrer', 'Ferrer');
        } else if (etat === 'repos' && pretALancer()) {
          action.hidden = false;
          poserAction('lancer', 'Lancer');
        } else if (etat === 'repos' && canneAuSol && prochesDeLaCanne()) {
          action.hidden = false;
          poserAction('ramasser', 'RAMASSER LA CANNE');
        } else if (etat === 'repos' && armeAuSol && devantLaSouche) {
          action.hidden = false;
          poserAction('fouiller', 'FOUILLER LA SOUCHE');
        } else if (etat === 'repos' && devantCabane) {
          action.hidden = false;
          poserAction('entrer', 'RENTRER');
        } else {
          action.hidden = true;
          poserAction('', '');
        }
      }

      // A-t-on la souche juste devant soi ? C'est la seule facon de la
      // fouiller : passer a cote ne suffit pas.
      function faceALaSouche() {
        var c = balade.caseDevant();
        return c[0] === SOUCHE.x && c[1] === SOUCHE.y;
      }

      function prochesDeLaSouche() {
        var dx = balade.chef.x - (SOUCHE.x + 0.5) * TS;
        var dy = balade.chef.y - (SOUCHE.y + 0.5) * TS;
        return dx * dx + dy * dy < 90 * 90;
      }

      function prochesDeLaCanne() {
        var dx = balade.chef.x - CANNE.x, dy = balade.chef.y - CANNE.y;
        return dx * dx + dy * dy < 40 * 40;
      }

      // Le rideau tombe, puis on pousse la porte. Le point de reprise est
      // deja tenu a jour par la marche.
      function entrerBoutique() {
        if (etat !== 'repos') return;
        action.hidden = true;
        scene.classList.add('is-sortie');
        plusTard(function () {
          balade.arreter();
          location.hash = '#poissonnerie';
        }, reduit ? 0 : 420);
      }

      function ramasser() {
        if (!canneAuSol) return;
        DP.prendreCanne();
        canneAuSol = false;
        etat = 'repos';
        prise.hidden = false;
        prise.textContent = '';
        var box = el('div', 'pe-prise-box pe-prise-box--objet');
        box.appendChild(el('p', 'pe-prise-titre', 'Canne à Pêche récupérée'));
        var im = el('img', 'pe-prise-canne');
        im.src = 'assets/items/canne.webp';
        im.alt = '';
        box.appendChild(im);
        box.appendChild(el('p', 'pe-prise-txt',
          'Elle est ajoutée à tes Items. Poste-toi face à l’eau pour lancer.'));
        prise.appendChild(box);
        plusTard(function () { if (vivant()) ranger(); }, 2600);
        majAction();
      }

      // Fouiller la souche : ce qui luit au fond, c'est le Pistolet
      // Lumithique. Il rejoint les Items et ne se reperd plus.
      function fouiller() {
        if (!armeAuSol) return;
        DP.prendreArme();
        armeAuSol = false;
        etat = 'repos';
        prise.hidden = false;
        prise.textContent = '';
        var box = el('div', 'pe-prise-box pe-prise-box--arme');
        box.appendChild(el('p', 'pe-prise-titre', 'PISTOLET LUMITHIQUE'));
        var im = el('img', 'pe-prise-arme');
        if (window.ARME) im.src = window.ARME.url();
        im.alt = '';
        box.appendChild(im);
        box.appendChild(el('p', 'pe-prise-txt',
          'Il dormait là depuis longtemps, et il fonctionne encore.'));
        box.appendChild(el('p', 'pe-prise-txt pe-prise-txt--sous',
          'Ajouté à tes Items. Quelque chose de gros vit dans ces lacs.'));
        prise.appendChild(box);
        dire('Le Pistolet Lumithique est à toi.');
        plusTard(function () { if (vivant()) ranger(); }, reduit ? 900 : 3600);
        majAction();
      }

      // --- La rencontre ---
      // Une ligne sur seize, arme au poing : ce n'est pas un poisson qui
      // monte. Le duel gele la balade tant qu'il dure.
      // Les trois temps de l'apparition, en millisecondes : l'ombre qui
      // approche sous la surface, l'aileron qui fend l'eau, puis le saut.
      var SURGIT = { ombre: 900, aileron: 800, saut: 900 };
      var SURGIT_TOTAL = SURGIT.ombre + SURGIT.aileron + SURGIT.saut;

      // "appele" est la forme qu'un leurre a fait venir : le tirage
      // ordinaire est alors court-circuite, variante comprise.
      function rencontre(appele) {
        var R = window.REQUIN;
        if (!R) return ranger();
        etat = 'requin';
        vol = null; gerbe = null;
        majAction();

        var bete = appele ? R.appeler(appele, irradie)
                          : R.tirer(DP.armeNiveau(), irradie);
        // La bete sort a l'endroit exact ou le bouchon flottait : c'est
        // la ligne du pecheur qui l'a fait monter.
        var ou = bouchon || { x: balade.chef.x, y: balade.chef.y - 40 };
        surgi = { t0: maintenant(), bete: bete, x: ou.x, y: ou.y };
        dire('L’eau se creuse… quelque chose de gros remonte.');

        if (reduit) return ouvrirDuel(bete);

        // La secousse au moment du saut, puis le duel.
        plusTard(function () {
          if (!vivant() || etat !== 'requin') return;
          scene.classList.add('is-secousse');
        }, SURGIT.ombre + SURGIT.aileron);

        plusTard(function () {
          if (!vivant() || etat !== 'requin') return;
          scene.classList.remove('is-secousse');
          ouvrirDuel(bete);
        }, SURGIT_TOTAL);
      }

      function ouvrirDuel(bete) {
        var R = window.REQUIN;
        surgi = null;
        bouchon = null;
        duel = R.Duel({
          parent: scene,
          bete: bete,
          irradie: irradie,
          surSortie: function () { duel = null; if (vivant()) ranger(); }
        });
      }

      // --- La sortie de l'eau ---
      // Tout se joue sur la carte, avant l'ecran de combat : l'ombre
      // tourne sous la surface, l'aileron la fend, puis la bete jaillit.
      function dessinerSurgissement(ctx, cam, t) {
        if (!surgi) return;
        var R = window.REQUIN;
        if (!R) return;
        var age = t - surgi.t0;
        var sx = surgi.x - cam.x, sy = surgi.y - cam.y;
        var f = surgi.bete.forme;
        // Sur la carte, la bete se montre plus petite qu'en duel : le
        // monde est vu de haut, et une case ne fait que vingt-quatre
        // pixels.
        var ech = 0.4 * f.echelle;
        // Elle jaillit gueule ouverte : c'est l'image qu'on garde.
        var feuille = R.feuille(f.id, surgi.bete.variante, 'charge');
        var lg = R.L * ech, ht = R.H * ech;
        var i, a;

        // 1. L'ombre qui tourne, et l'eau qui se creuse.
        if (age < SURGIT.ombre) {
          var k = age / SURGIT.ombre;
          var ang = k * 7 - 1.2;
          var ray = 34 * (1 - k) + 6;
          var ox = sx + Math.cos(ang) * ray;
          var oy = sy + Math.sin(ang) * ray * 0.45;
          ctx.fillStyle = 'rgba(2, 10, 20,' + (0.16 + 0.34 * k).toFixed(2) + ')';
          ctx.beginPath();
          ctx.ellipse(ox, oy, lg * 0.42, ht * 0.3, 0, 0, 6.3);
          ctx.fill();
          // Les ondes s'elargissent de plus en plus vite.
          for (i = 0; i < 3; i++) {
            var ph = ((age / (760 - k * 420)) + i / 3) % 1;
            ctx.strokeStyle = 'rgba(224,244,255,' + (0.6 * (1 - ph)).toFixed(2) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 4 + ph * (16 + k * 22), (4 + ph * (16 + k * 22)) * 0.5,
                        0, 0, 6.3);
            ctx.stroke();
          }
          return;
        }

        // 2. L'aileron fend la surface, droit sur le bouchon.
        if (age < SURGIT.ombre + SURGIT.aileron) {
          var k2 = (age - SURGIT.ombre) / SURGIT.aileron;
          var dx = -46 * (1 - k2);
          var fx = sx + dx, fy = sy + 6 * (1 - k2);
          // La masse sous la surface reste discrete : c'est l'aileron
          // qu'on doit voir, pas l'ombre qui le porte.
          ctx.fillStyle = 'rgba(2, 10, 20,.26)';
          ctx.beginPath();
          ctx.ellipse(fx, fy + 4, lg * 0.4, ht * 0.26, 0, 0, 6.3);
          ctx.fill();
          // L'aileron : un triangle sombre, taille sur la bete, cerne
          // d'ecume. Il grandit a mesure qu'elle remonte.
          var h = (11 + 10 * k2) * (0.7 + f.echelle * 0.25);
          var lgA = h * 0.7;
          // L'aileron porte la livree de la bete : un brillant se voit
          // avant meme qu'elle ne sorte de l'eau.
          var teinte = surgi.bete.couleurs || f.couleurs;
          ctx.fillStyle = teinte ? teinte[0] : '#5f7386';
          ctx.beginPath();
          ctx.moveTo(fx - lgA, fy + 1);
          ctx.lineTo(fx + lgA * 0.45, fy - h);
          ctx.lineTo(fx + lgA, fy + 1);
          ctx.closePath();
          ctx.fill();
          // Un liset clair sur l'arete : sans lui, l'aileron se perd dans
          // l'ombre de la bete.
          ctx.strokeStyle = 'rgba(234,247,255,.8)';
          ctx.lineWidth = 1;
          ctx.stroke();
          // L'ecume au pied de l'aileron.
          ctx.fillStyle = 'rgba(244,252,255,.85)';
          ctx.fillRect(Math.round(fx - lgA), Math.round(fy), Math.round(lgA * 2), 2);
          // Le sillage, en V, qui s'ouvre derriere elle.
          ctx.strokeStyle = 'rgba(234,247,255,.75)';
          ctx.lineWidth = 2;
          var long = 26 + 34 * k2;
          ctx.beginPath();
          ctx.moveTo(fx - lgA, fy + 1);
          ctx.lineTo(fx - lgA - long, fy + 9);
          ctx.moveTo(fx - lgA, fy + 1);
          ctx.lineTo(fx - lgA - long, fy - 7);
          ctx.stroke();
          return;
        }

        // 3. Le saut : elle jaillit, se cabre, et l'ecume retombe.
        var k3 = Math.min(1, (age - SURGIT.ombre - SURGIT.aileron) / SURGIT.saut);
        var haut = Math.sin(Math.min(1, k3 * 1.25) * 1.55) * (44 + ht * 0.55);

        // La colonne d'ecume que la bete arrache au lac en sortant.
        var colonne = Math.max(0, 1 - k3 * 1.35);
        if (colonne > 0) {
          ctx.fillStyle = 'rgba(244,252,255,' + (0.85 * colonne).toFixed(2) + ')';
          var lc = lg * 0.34 * colonne + 6;
          ctx.beginPath();
          ctx.moveTo(sx - lc, sy + 4);
          ctx.lineTo(sx - lc * 0.45, sy - haut * 0.9);
          ctx.lineTo(sx + lc * 0.45, sy - haut * 0.9);
          ctx.lineTo(sx + lc, sy + 4);
          ctx.closePath();
          ctx.fill();
        }

        // La gerbe, a la base du saut.
        for (i = 0; i < 3; i++) {
          var pg = Math.min(1, k3 * 1.6 + i * 0.18);
          if (pg >= 1) continue;
          ctx.strokeStyle = 'rgba(234,247,255,' + (0.8 * (1 - pg)).toFixed(2) + ')';
          ctx.lineWidth = 2 - pg;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 5 + pg * 40, (5 + pg * 40) * 0.42, 0, 0, 6.3);
          ctx.stroke();
        }
        // Les gouttes projetees.
        for (i = 0; i < 26; i++) {
          a = (i / 26) * 6.283 + (i % 2 ? 0.2 : 0);
          var d = k3 * (46 + (i % 3) * 16);
          var hy = Math.sin(Math.min(1, k3 * 1.4) * 3.14) * 28;
          ctx.fillStyle = 'rgba(214,240,255,' + (0.9 * (1 - k3)).toFixed(2) + ')';
          ctx.fillRect(Math.round(sx + Math.cos(a) * d),
                       Math.round(sy - hy + Math.sin(a) * d * 0.4), 2, 2);
        }

        if (!feuille) return;
        ctx.save();
        ctx.translate(sx, sy - haut);
        // Elle sort museau en l'air, puis se couche a l'apogee.
        ctx.rotate(-1.15 + k3 * 0.85);
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = Math.min(1, k3 * 3);
        ctx.drawImage(feuille.canvas, -lg / 2, -ht / 2, lg, ht);
        ctx.restore();

        // Le voile blanc de la bascule, tout a la fin.
        if (k3 > 0.72) {
          var v = (k3 - 0.72) / 0.28;
          ctx.fillStyle = 'rgba(234,247,255,' + (v * v).toFixed(2) + ')';
          ctx.fillRect(0, 0, 480, 316);
        }
      }

      // --- Les panneaux de prise ---

      function montrerPoisson(f, cm, kg, neuf, e, brillant, ensuite, second) {
        var r = P.rarete(P.sousRarete(f));
        prise.hidden = false;
        prise.textContent = '';
        var box = el('div', 'pe-prise-box');
        box.dataset.rarete = f.rarete;
        box.style.setProperty('--r', r.couleur);
        if (brillant) box.classList.add('is-shiny');
        if (f.secret) box.classList.add('is-secret');

        // Chacune des trois prises hors du commun a son titre, pour qu'on
        // sache ce qu'on regarde avant meme de lire le nom.
        var titre = brillant ? 'BRILLANT !'
                  : f.secret ? 'ESPÈCE SECRÈTE !'
                  : neuf ? 'NOUVELLE ESPÈCE !'
                  : f.rarete === 'special' ? 'PRISE IRRADIÉE !'
                  : 'Belle prise !';
        box.appendChild(el('p', 'pe-prise-titre', titre));
        var im = el('img', 'pe-prise-img');
        im.src = P.url(f.id, brillant);
        im.alt = '';
        box.appendChild(im);
        var nom = el('p', 'pe-prise-nom', f.nom);
        if (brillant) nom.appendChild(el('span', 'pe-etoile', '✦'));
        box.appendChild(nom);
        var det = el('p', 'pe-prise-det');
        det.appendChild(el('span', 'pe-prise-rarete',
          f.secret ? 'Secret' : f.rarete === 'special' ? 'Spécial ' + r.nom.toLowerCase() : r.nom));
        det.appendChild(el('span', null, cm + ' cm'));
        det.appendChild(el('span', 'pe-prise-kg', P.poidsTexte(kg)));
        if (e && e.n > 1) det.appendChild(el('span', 'pe-prise-n', '×' + e.n));
        box.appendChild(det);
        // La seconde prise du Double-Hameçon, en dessous de la premiere.
        if (second) {
          box.classList.add('is-double');
          var deux = el('p', 'pe-prise-double');
          deux.appendChild(el('span', 'pe-prise-double-nom', 'Et un second !'));
          deux.appendChild(el('span', null, second.cm + ' cm'));
          deux.appendChild(el('span', 'pe-prise-kg', P.poidsTexte(second.kg)));
          if (second.brillant) deux.appendChild(el('span', 'pe-etoile', '✦'));
          box.appendChild(deux);
        }
        if (lourd) box.appendChild(el('p', 'pe-prise-lourd', 'Belle bagarre !'));
        // Une secrete qu'on decouvre dit enfin ce qui l'a fait venir : le
        // joueur a devine sans le savoir, autant qu'il sache pourquoi.
        if (f.secret && neuf && f.indice) {
          box.appendChild(el('p', 'pe-prise-txt pe-prise-indice', f.indice));
        }
        prise.appendChild(box);

        dire(brillant ? f.nom + ' — dans une couleur qu’on ne revoit pas de sitôt.'
           : f.secret && neuf ? f.nom + ' existait donc vraiment.'
           : f.secret ? f.nom + ' est revenu au bout de la ligne.'
           : f.rarete === 'special'
             ? f.nom + ' remonte des eaux irradiées' +
               (neuf ? ' et rejoint ton carnet.' : '.')
           : neuf ? f.nom + ' rejoint ton carnet.'
           : f.nom + ', ' + cm + ' cm pour ' + P.poidsTexte(kg) + '.');

        // Une prise hors du commun a droit a son temps d'ecran : ses
        // animations durent plus longtemps qu'un panneau ordinaire.
        var remarquable = brillant || f.secret || f.rarete === 'special';
        var attente = reduit ? 800 : (remarquable ? 3200 : 2600);
        plusTard(function () {
          if (!vivant()) return;
          if (ensuite) return ensuite();
          ranger();
        }, attente);
      }

      // --- L'evolution ---
      // Le poisson reste a l'ecran, blanchit, change de silhouette, puis
      // se presente sous son nouveau nom. C'est le seul moment du jeu ou
      // une espece en rejoint une autre sans repasser par la ligne.
      function evoluer(base, evo) {
        var cm = P.taille(evo);
        var kg = P.poids(evo, cm);
        var r = P.rarete(evo.rarete);

        prise.hidden = false;
        prise.textContent = '';
        var box = el('div', 'pe-prise-box pe-evo');
        box.dataset.rarete = evo.rarete;
        box.style.setProperty('--r', r.couleur);

        var titre = el('p', 'pe-prise-titre', 'Quoi ?!');
        box.appendChild(titre);
        var im = el('img', 'pe-prise-img pe-evo-img');
        im.src = P.url(base.id);
        im.alt = '';
        box.appendChild(im);
        var nom = el('p', 'pe-prise-nom', base.nom);
        box.appendChild(nom);
        var det = el('p', 'pe-prise-det pe-evo-det');
        box.appendChild(det);
        prise.appendChild(box);
        dire(base.nom + ' change de forme…');

        // Trois allers-retours entre les deux silhouettes, de plus en plus
        // serres, puis la bascule definitive.
        var pas = [0, 420, 760, 1040, 1280, 1470, 1620];
        if (reduit) pas = [0, 60, 120, 180, 240, 300, 360];
        pas.forEach(function (t, i) {
          plusTard(function () {
            if (!vivant()) return;
            box.classList.add('is-flash');
            im.src = P.url(i % 2 ? evo.id : base.id);
          }, t);
          plusTard(function () {
            if (!vivant()) return;
            box.classList.remove('is-flash');
          }, t + 120);
        });

        plusTard(function () {
          if (!vivant()) return;
          box.classList.add('is-fini');
          im.src = P.url(evo.id);
          titre.textContent = 'ÉVOLUTION !';
          nom.textContent = evo.nom;
          det.appendChild(el('span', 'pe-prise-rarete', r.nom));
          det.appendChild(el('span', null, cm + ' cm'));
          det.appendChild(el('span', 'pe-prise-kg', P.poidsTexte(kg)));
          DP.noterPrise(evo.id, cm, kg);
          dire(base.nom + ' a évolué en ' + evo.nom + ' !');
          plusTard(function () { if (vivant()) ranger(); }, reduit ? 700 : 3000);
        }, reduit ? 420 : 1800);
      }

      function montrerCredit() {
        prise.hidden = false;
        prise.textContent = '';
        var box = el('div', 'pe-prise-box pe-prise-box--credit');
        box.appendChild(el('p', 'pe-prise-titre', 'CRÉDIT TEMPOREL !'));
        var im = el('img', 'pe-prise-credit');
        im.src = DP.creditImg('pink');
        im.alt = '';
        box.appendChild(im);
        box.appendChild(el('p', 'pe-prise-txt', 'Ajouté à ton solde sur le DinderPad.'));
        prise.appendChild(box);
        dire('Un Crédit Temporel est remonté au bout de la ligne.');
        plusTard(function () { if (vivant()) ranger(); }, reduit ? 900 : 3200);
      }

      // --- La minicarte ---
      // Trois pixels par case : assez pour lire la forme des lacs, assez
      // petit pour ne rien voler a la vue du jeu.
      var MINI_T = 3;
      var MINI_FOND = {};
      MINI_FOND[T.EAU] = '#2a68c4';
      MINI_FOND[T.ROSEAU] = '#2f6e2c';
      MINI_FOND[T.EAU_RAD] = '#9ad11e';
      MINI_FOND[T.SABLE] = '#dcc98c';
      MINI_FOND[T.CHEMIN] = '#a5794a';
      MINI_FOND[T.ARBRE] = '#2c6329';
      MINI_FOND[T.BUISSON] = '#357a31';
      MINI_FOND[T.ROCHER] = '#7d8490';
      MINI_FOND[T.CABANE] = '#8a5a30';
      MINI_FOND[T.TOIT] = '#b2452f';
      MINI_FOND[T.PORTE_BOIS] = '#e8c46a';
      MINI_FOND[T.SOUCHE] = '#7a5c33';

      var miniFond = null;

      function peindreMiniFond() {
        var c = document.createElement('canvas');
        c.width = MW * MINI_T;
        c.height = MH * MINI_T;
        var x = c.getContext('2d');
        if (!x) return null;
        for (var ty = 0; ty < MH; ty++) {
          for (var tx = 0; tx < MW; tx++) {
            x.fillStyle = MINI_FOND[g[ty][tx]] || '#3d8b38';
            x.fillRect(tx * MINI_T, ty * MINI_T, MINI_T, MINI_T);
          }
        }
        return c;
      }

      function dessinerMini(t) {
        var x = miniCv.getContext('2d');
        if (!x) return;
        if (!miniFond) miniFond = peindreMiniFond();
        if (!miniFond) return;
        x.clearRect(0, 0, miniCv.width, miniCv.height);
        x.drawImage(miniFond, 0, 0);

        function pastille(tx, ty, couleur, r) {
          x.fillStyle = couleur;
          x.beginPath();
          x.arc(tx * MINI_T + MINI_T / 2, ty * MINI_T + MINI_T / 2, r, 0, 6.3);
          x.fill();
        }

        // La Poissonnerie, toujours reperable.
        pastille(CABANE.porte, CABANE.y1, '#ffd166', 3);

        // La souche ne se signale que tant qu'on n'a pas l'arme : une
        // fois trouvee, elle n'a plus rien a dire.
        if (armeAuSol) {
          var battement = reduit ? 3 : 2.4 + Math.sin(t / 320) * 1.2;
          pastille(SOUCHE.x, SOUCHE.y, 'rgba(124,240,255,.9)', battement);
        }

        // La canne au sol, tant qu'elle y est.
        if (canneAuSol) {
          pastille(Math.floor(CANNE.x / TS), Math.floor(CANNE.y / TS), '#00f1fd', 2.5);
        }

        // Le bouchon, quand la ligne est a l'eau.
        if (bouchon) {
          pastille(Math.floor(bouchon.x / TS), Math.floor(bouchon.y / TS), '#f4f7fb', 2);
        }

        // Le pecheur, en dernier : il passe par-dessus tout le reste.
        var c = balade.caseDuChef();
        // Quand il marche dans le coin qu'occupe la minicarte, elle
        // s'efface : on ne cache jamais au joueur le personnage qu'il
        // dirige. Le coin est donne en pixels de canevas, ou la scene
        // fait 480 de large pour 1612 unites de pad.
        var dedans = ecranChef.x < 74 && ecranChef.y < 66;
        if (dedans !== mini.classList.contains('is-efface')) {
          mini.classList.toggle('is-efface', dedans);
        }
        x.fillStyle = '#0a1420';
        x.fillRect(c[0] * MINI_T - 1, c[1] * MINI_T - 1, MINI_T + 2, MINI_T + 2);
        x.fillStyle = '#ff5c9d';
        x.fillRect(c[0] * MINI_T, c[1] * MINI_T, MINI_T, MINI_T);
      }

      // --- Le bouton et le clavier ---

      function agir() {
        var r = action.dataset.role;
        if (r === 'lancer') lancer();
        else if (r === 'ferrer') ferrer();
        else if (r === 'mouliner') mouliner();
        else if (r === 'ramasser') ramasser();
        else if (r === 'entrer') entrerBoutique();
        else if (r === 'fouiller') fouiller();
      }
      action.addEventListener('click', agir);

      // ---------- La bagarre ----------
      // Une grosse piece ne se remonte pas d'un geste : il faut mouliner,
      // et lacher du mou quand la ligne chauffe. Une canne chere encaisse
      // pour le pecheur ; avec celle d'origine, un monstre casse souvent.

      var SEUIL_LUTTE = 0.45;            // a partir de quelle charge on lutte

      function forceCanne() { return M2 ? M2.equipee('canne').puissance : 0; }

      function commencerLutte(f, cm, kg, brillant) {
        var charge = P.charge(kg), puis = forceCanne();
        lutte = {
          f: f, cm: cm, kg: kg, brillant: brillant,
          charge: charge, puis: puis,
          progres: 0.08, tension: 0,
          t: maintenant(), t0: maintenant(), fini: false,
          // Ce que le poisson reprend chaque seconde, ce qu'un tour de
          // moulinet rend, ce qu'il chauffe la ligne, et ce que la ligne
          // recupere quand on la laisse souffler. Une canne chere gagne
          // sur les quatre tableaux : avec celle d'origine, une piece de
          // plus de quarante kilos finit toujours par l'emporter.
          fuite: (0.05 + 0.15 * charge) * (1 - 0.55 * puis),
          gain: 0.062 + 0.05 * puis,
          chauffe: 0.16 - 0.07 * puis,
          repos: 0.42 + 0.22 * puis,
          coup: maintenant()
        };
        etat = 'lutte';
        scene.classList.add('is-lutte');
        panneauLutte.hidden = false;
        dire('ÇA RÉSISTE ! Mouline — et laisse souffler la ligne.');
        majAction();
        majLutte();
      }

      function mouliner() {
        if (etat !== 'lutte' || !lutte || lutte.fini) return;
        lutte.progres += lutte.gain;
        lutte.tension += lutte.chauffe;
        lutte.coup = maintenant();
        scene.classList.remove('is-tire');
        void scene.offsetWidth;
        scene.classList.add('is-tire');
        if (lutte.tension >= 1) return finirLutte(false, 'casse');
        if (lutte.progres >= 1) return finirLutte(true);
        majLutte();
      }

      // Le fil du temps : le poisson tire, la ligne se detend.
      function avancerLutte(t) {
        if (etat !== 'lutte' || !lutte || lutte.fini) return;
        var dt = Math.min(0.2, (t - lutte.t) / 1000);
        lutte.t = t;
        lutte.progres = Math.max(0, lutte.progres - lutte.fuite * dt);
        lutte.tension = Math.max(0, lutte.tension - lutte.repos * dt);
        // Il finit toujours par se decrocher si l'on ne fait rien, et la
        // bagarre ne s'eternise pas : au bout de dix-huit secondes, il gagne.
        if (lutte.progres <= 0 && t - lutte.coup > 2600) return finirLutte(false, 'decroche');
        if (t - lutte.t0 > 18000) return finirLutte(false, 'epuise');
        majLutte();
      }

      function majLutte() {
        if (!lutte) return;
        barreLutte.style.width = Math.round(Math.min(1, lutte.progres) * 100) + '%';
        barreTension.style.width = Math.round(Math.min(1, lutte.tension) * 100) + '%';
        panneauLutte.dataset.chaud = lutte.tension > 0.72 ? '1' : '0';
        txtLutte.textContent = lutte.tension > 0.72
          ? 'La ligne chauffe — lâche un peu !'
          : (lutte.progres > 0.7 ? 'Il arrive ! Encore !' : 'Mouline !');
      }

      function finirLutte(gagne, cause) {
        if (!lutte || lutte.fini) return;
        lutte.fini = true;
        var l = lutte;
        scene.classList.remove('is-lutte');
        panneauLutte.hidden = true;
        if (gagne) {
          lutte = null;
          return sortirLaPrise(l.f, l.cm, l.kg, l.brillant, false);
        }
        etat = 'rate';
        lutte = null;
        bouchon = null;
        majAction();
        dire(cause === 'casse' ? 'La ligne a cassé ! Il est parti avec.'
           : cause === 'epuise' ? 'Il file vers le fond… tes bras lâchent avant lui.'
           : 'Il s’est décroché… trop lourd pour toi.');
        plusTard(function () { if (etat === 'rate') ranger(); }, 1800);
      }

      var auClavier = function (e) {
        if (e.key !== ' ' && e.key !== 'Enter') return;
        e.preventDefault();
        agir();
      };
      window.addEventListener('keydown', auClavier);

      // --- Le decor mouvant : flotteur, ondes, canne au sol ---

      // Un fil qui pend un peu entre la canne et le bouchon.
      function fil(ctx, cam, ax, ay, bx, by, creux) {
        ctx.strokeStyle = 'rgba(240,248,255,.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax - cam.x, ay - cam.y);
        ctx.quadraticCurveTo((ax + bx) / 2 - cam.x, (ay + by) / 2 - cam.y + (creux || 6),
                             bx - cam.x, by - cam.y);
        ctx.stroke();
      }

      // Les ronds dans l'eau, au plouf comme a la sortie.
      function dessinerGerbe(ctx, cam, t) {
        if (!gerbe) return;
        var age = (t - gerbe.t0) / (gerbe.fort ? 620 : 480);
        if (age >= 1) { gerbe = null; return; }
        var gx = gerbe.x - cam.x, gy = gerbe.y - cam.y;
        for (var i = 0; i < 3; i++) {
          var ph = age + i * 0.22;
          if (ph > 1) continue;
          var r = 2 + ph * (gerbe.fort ? 24 : 16);
          ctx.strokeStyle = 'rgba(224,244,255,' + (0.7 * (1 - ph)).toFixed(2) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(gx, gy, r, r * 0.5, 0, 0, 6.3);
          ctx.stroke();
        }
        // Quelques gouttes qui retombent.
        var n = gerbe.fort ? 9 : 6;
        for (var k = 0; k < n; k++) {
          var a = (k / n) * 6.283 + 0.4;
          var d = age * (gerbe.fort ? 22 : 15);
          var hy = Math.sin(age * 3.14) * (gerbe.fort ? 14 : 9);
          ctx.fillStyle = 'rgba(214,240,255,' + (0.85 * (1 - age)).toFixed(2) + ')';
          ctx.fillRect(Math.round(gx + Math.cos(a) * d), Math.round(gy - hy + Math.sin(a) * d * 0.4), 2, 2);
        }
      }

      // Le vol : le bouchon a l'aller, la prise au retour.
      function dessinerVol(ctx, cam, t) {
        if (!vol) return;
        var k = Math.min(1, (t - vol.t0) / vol.duree);
        var x = vol.de.x + (vol.vers.x - vol.de.x) * k;
        var y = vol.de.y + (vol.vers.y - vol.de.y) * k;
        var arc = Math.sin(k * Math.PI) * (vol.sens === 'aller' ? 34 : 46);
        y -= arc;

        var flot = M2 ? M2.equipee('flotteur').couleurs : ['#e8402f', '#f4f7fb'];
        fil(ctx, cam, vol.sens === 'aller' ? balade.chef.x : balade.chef.x,
            balade.chef.y - 18, x, y, vol.sens === 'aller' ? 10 : 2);

        if (vol.sens === 'aller') {
          ctx.fillStyle = flot[0];
          ctx.fillRect(Math.round(x - cam.x) - 1, Math.round(y - cam.y) - 2, 3, 3);
          ctx.fillStyle = flot[1];
          ctx.fillRect(Math.round(x - cam.x) - 1, Math.round(y - cam.y) + 1, 3, 2);
          return;
        }

        // Au retour : le Credit Temporel scintille, le poisson tournoie.
        if (vol.credit) {
          var lueur = 0.6 + 0.4 * Math.sin(t / 60);
          ctx.fillStyle = 'rgba(255,92,157,' + lueur.toFixed(2) + ')';
          ctx.beginPath();
          ctx.ellipse(x - cam.x, y - cam.y, 9, 9, 0, 0, 6.3);
          ctx.fill();
          ctx.fillStyle = '#ffd6e8';
          ctx.fillRect(Math.round(x - cam.x) - 4, Math.round(y - cam.y) - 3, 8, 6);
          return;
        }

        var f = vol.poisson && window.POISSONS.feuille(vol.poisson.id, vol.shiny);
        if (!f) return;
        ctx.save();
        ctx.translate(x - cam.x, y - cam.y);
        // Il se cabre en sortant, puis retombe a plat dans la main.
        ctx.rotate(-1.1 + k * 1.5);
        var e = 0.7 + 0.3 * (1 - k);
        ctx.drawImage(f.canvas, -f.L * e / 2, -f.H * e / 2, f.L * e, f.H * e);
        ctx.restore();
      }

      // Ou se tient le pecheur sur l'ecran, et non dans le monde : la
      // minicarte s'en sert pour savoir si elle le masque.
      var ecranChef = { x: 240, y: 158 };

      function dessinerBouchon(ctx, cam, t) {
        ecranChef.x = balade.chef.x - cam.x;
        ecranChef.y = balade.chef.y - cam.y;
        dessinerGerbe(ctx, cam, t);
        dessinerVol(ctx, cam, t);
        if (surgi) return dessinerSurgissement(ctx, cam, t);
        if (!bouchon) return;
        var bx = bouchon.x - cam.x, by = bouchon.y - cam.y;

        // Les ondes concentriques, plus nerveuses quand ca mord.
        var vif = etat === 'mord';
        var vitesse = vif ? 380 : 900;
        for (var i = 0; i < 3; i++) {
          var phase = ((t - depuis) / vitesse + i / 3) % 1;
          var r = 3 + phase * (vif ? 17 : 12);
          ctx.strokeStyle = 'rgba(214,240,255,' + (0.55 * (1 - phase)).toFixed(2) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(bx, by, r, r * 0.55, 0, 0, 6.3);
          ctx.stroke();
        }

        // Pendant la bagarre, le flotteur est tire au fond et l'eau gicle.
        if (etat === 'lutte' && lutte) {
          var sec = reduit ? 0 : Math.sin(t / 45) * (2 + lutte.tension * 3);
          for (var g = 0; g < 7; g++) {
            var ph = ((t / 420 + g / 7) % 1);
            ctx.fillStyle = 'rgba(226,244,255,' + (0.8 * (1 - ph)).toFixed(2) + ')';
            ctx.fillRect(Math.round(bx - 6 + g * 2 + Math.sin(ph * 6 + g) * 5),
                         Math.round(by - 2 - ph * 14), 2, 2);
          }
          ctx.strokeStyle = 'rgba(255,120,80,' + (0.3 + 0.6 * lutte.tension).toFixed(2) + ')';
          ctx.lineWidth = 1 + lutte.tension * 2;
          ctx.beginPath();
          ctx.ellipse(bx + sec, by + 2, 9 + lutte.tension * 6, 4, 0, 0, 6.3);
          ctx.stroke();
        }

        // Le flotteur, aux couleurs de celui qui est monte. Il plonge
        // quand ca mord, et d'autant plus vite que la prise est lourde.
        var plonge = etat === 'lutte' ? 6 + (lutte ? lutte.tension * 3 : 0)
                   : vif ? Math.abs(Math.sin((t - depuis) / (lourd ? 60 : 90))) * (lourd ? 5 : 3) : 0;
        var flot = M2 ? M2.equipee('flotteur').couleurs : ['#e8402f', '#f4f7fb'];
        ctx.fillStyle = flot[0];
        ctx.fillRect(Math.round(bx) - 1, Math.round(by - 4 + plonge), 3, 3);
        ctx.fillStyle = flot[1];
        ctx.fillRect(Math.round(bx) - 1, Math.round(by - 1 + plonge), 3, 2);

        // Le fil, du pecheur au flotteur. Pendant la bagarre il se tend
        // presque droit, et il tremble.
        if (etat === 'lutte' && lutte) {
          var tremble = reduit ? 0 : Math.sin(t / 38) * (1 + lutte.tension * 2);
          fil(ctx, cam, balade.chef.x, balade.chef.y - 22 + tremble,
              bouchon.x, bouchon.y - 3, 1);
        } else {
          fil(ctx, cam, balade.chef.x, balade.chef.y - 18, bouchon.x, bouchon.y - 3, 7);
        }
      }

      var spriteCanne = new Image();
      spriteCanne.src = 'assets/games/sprites/objets/canne.png';
      var spritePoissonnier = new Image();
      spritePoissonnier.src = 'assets/games/sprites/objets/poissonnier.png';
      var spritePanneau = new Image();
      spritePanneau.src = 'assets/games/sprites/objets/panneau.png';

      balade = M.Balade({
        grille: g,
        canvas: cv,
        stick: stick, pomme: pomme,
        opts: { cabane: CABANE },
        depart: ou ? { x: ou.x, y: ou.y } : DEPART,
        direction: ou ? ou.dir : undefined,
        troupe: [choisi],
        vitesse: 92,
        vivant: vivant,
        fige: function () { return etat !== 'repos'; },

        extras: function (t) {
          var sortie = [];

          // L'enseigne du toit. Son point d'ancrage est haut : elle passe
          // donc derriere quiconque marche devant la cabane.
          sortie.push({
            x: PANNEAU.x, y: PANNEAU.y,
            dessin: function (ctx, sx, sy) {
              if (!spritePanneau.width) return;
              ctx.drawImage(spritePanneau,
                Math.round(sx - spritePanneau.width / 2),
                Math.round(sy - spritePanneau.height));
            }
          });

          // Le poissonnier, planté devant sa cabane.
          sortie.push({
            x: POISSONNIER.x, y: POISSONNIER.y,
            dessin: function (ctx, sx, sy) {
              if (!spritePoissonnier.width) return;
              var bob = reduit ? 0 : (Math.floor(t / 620) % 2 ? 1 : 0);
              ctx.fillStyle = 'rgba(0,0,0,.3)';
              ctx.beginPath();
              ctx.ellipse(sx, sy + 2, 9, 3, 0, 0, 6.3);
              ctx.fill();
              ctx.drawImage(spritePoissonnier,
                Math.round(sx - spritePoissonnier.width / 2),
                Math.round(sy - spritePoissonnier.height + 3 + bob));
            }
          });

          // La souche ne livre son secret qu'a bout portant : la lueur
          // ne s'allume qu'a quelques pas, et pas avant.
          if (armeAuSol && balade && prochesDeLaSouche()) {
            sortie.push({
              x: (SOUCHE.x + 0.5) * TS, y: (SOUCHE.y + 1) * TS - 2,
              dessin: function (ctx, sx, sy) {
                // La lueur monte bien au-dessus de la souche : plante
                // devant elle, le pecheur la masque entierement, et l'on
                // ne verrait plus rien de ce qu'on est venu chercher.
                var puls = reduit ? 0.22 : 0.16 + 0.12 * Math.sin(t / 340);
                ctx.fillStyle = 'rgba(124,240,255,' + puls.toFixed(2) + ')';
                ctx.beginPath();
                ctx.ellipse(sx, sy - 26, 16, 11, 0, 0, 6.3);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(sx, sy - 10, 12, 6, 0, 0, 6.3);
                ctx.fill();
                // Trois etincelles qui remontent du creux.
                for (var e = 0; e < 3; e++) {
                  var ph = reduit ? e / 3 : ((t / 1100 + e / 3) % 1);
                  var ex = Math.round(sx - 5 + e * 5 + Math.sin(ph * 6.3 + e) * 2);
                  var ey = Math.round(sy - 6 - ph * 26);
                  ctx.fillStyle = 'rgba(214,250,255,' +
                    (0.9 * (1 - ph)).toFixed(2) + ')';
                  ctx.fillRect(ex, ey, 2, 2);
                }
              }
            });
          }

          if (ART) sortie = sortie.concat(ART.extras(cachesP, balade && balade.chef, t));

          if (!canneAuSol) return sortie;
          // La canne flotte et scintille tant qu'on ne l'a pas prise.
          sortie.push({
            x: CANNE.x, y: CANNE.y,
            dessin: function (ctx, sx, sy) {
              var bob = reduit ? 0 : Math.sin(t / 420) * 2.5;
              ctx.fillStyle = 'rgba(0,241,253,' +
                (0.14 + 0.1 * Math.sin(t / 300)).toFixed(2) + ')';
              ctx.beginPath();
              ctx.ellipse(sx, sy + 4, 22, 9, 0, 0, 6.3);
              ctx.fill();
              if (spriteCanne.width) {
                ctx.drawImage(spriteCanne,
                  Math.round(sx - spriteCanne.width / 2),
                  Math.round(sy - spriteCanne.height + 2 + bob));
              }
            }
          });
          return sortie;
        },

        apres: dessinerBouchon,

        chaqueImage: function (t) {
          dessinerMini(t);
          if (etat === 'lutte') avancerLutte(t);
          var c = balade.caseDuChef();
          var casier = c[0] + ',' + c[1];
          if (jeu.dataset.tuile !== casier) jeu.dataset.tuile = casier;
          devantCabane = devantLaPorte();
          // La phase en cours, inscrite sur le conteneur : elle sert de
          // repere lisible, et rend la mise en scene verifiable.
          if (jeu.dataset.phase !== etat) jeu.dataset.phase = etat;

          // Le point de reprise suit le pecheur : quel que soit l'ecran
          // par lequel on s'echappe, on reviendra ici.
          if (reprise) {
            reprise.x = balade.chef.x;
            reprise.y = balade.chef.y;
            reprise.dir = balade.chef.dir;
          }
          devantLaSouche = armeAuSol && faceALaSouche();
          if (etat !== 'repos') return;
          if (ART) ART.ramasser(cachesP, balade.chef);
          majAction();
          // L'indication suit ce que le joueur a devant lui, a chaque pas.
          var devantRad = (function () {
            var c = balade.caseDevant();
            return balade.tuile(c[0], c[1]) === T.EAU_RAD;
          })();
          var aide = devantLaSouche ? 'Quelque chose luit au creux de la souche.'
                   : armeAuSol && prochesDeLaSouche()
                     ? 'Une vieille souche, au milieu des arbres.'
                   : canneAuSol ? 'Une canne à pêche flotte non loin.'
                   : devantCabane ? 'La Poissonnerie est ouverte.'
                   : devantRad ? 'Eau irradiée : ici ne mordent que des Spéciaux.'
                   : pretALancer() && DP.leurreMonte()
                     ? 'Leurre à la ligne : ce que tu lances va répondre.'
                   : pretALancer() ? 'Face à l’eau : lance ta ligne.'
                   : 'Trouve une berge et fais face à l’eau.';
          if (hudTxt.textContent !== aide) hudTxt.textContent = aide;
        }
      });

      // Pour les essais : l'etat interne de la partie, sans passer par
      // l'ecran. C'est aussi ce qui permet de rejouer une bagarre.
      scene._pe = {
        etat: function () { return etat; },
        lutte: function () { return lutte; },
        mouliner: mouliner,
        lutter: function (f, cm) {
          cm = cm || P.taille(f);
          commencerLutte(f, cm, P.poids(f, cm), false);
        },
        balade: function () { return balade; }
      };

      // Le nettoyage quand on quitte l'ecran.
      var veille = setInterval(function () {
        if (vivant()) return;
        clearInterval(veille);
        window.removeEventListener('keydown', auClavier);
        if (duel) { duel.arreter(); duel = null; }
        balade.arreter();
      }, 400);
      minuteurs.push(veille);

      majAction();
    }

    // De retour de la Poissonnerie : on reprend la partie ou elle en
    // etait, sans repasser par l'ecran-titre ni par le choix du pecheur.
    if (reprise && DP.has(reprise.dinder)) {
      var ou = reprise;
      choisi = ou.dinder;
      reprise = null;
      ecranCarte(ou);
      return;
    }
    reprise = null;

    // Le jeu s'ouvre sur sa jaquette.
    if (window.INTRO) {
      jeu.dataset.etape = 'intro';
      jeu.appendChild(window.INTRO.ecran({
        icone: 'assets/games/icones/fish-n-der.webp',
        titre: 'Fish n’Der',
        teinte: '#3ad6f0',
        bouton: 'À L’EAU',
        lignes: [
          'Sept lacs et une rivière, à perte de vue.',
          'Une canne flotte au bord de l’eau : ramasse-la,',
          'elle rejoindra tes Items pour de bon.',
          'Des dizaines d’espèces à remonter — et parfois un Crédit Temporel.'
        ],
        commencer: ecranChoix
      }));
    } else {
      ecranChoix();
    }
  }

  // ==========================================================
  //  Le carnet de peche
  // ==========================================================

  function viewCarnet(view) {
    var box = el('div', 'pe pe--carnet');
    box.dataset.etape = 'carnet';

    var prises = DP.prises();

    var tete = el('div', 'pe-tete pe-tete--carnet');
    var livre = el('img', 'pe-livre');
    livre.src = 'assets/items/fishbook.webp';
    livre.alt = '';
    tete.appendChild(livre);
    tete.appendChild(el('h2', 'pe-titre', 'Carnet de pêche'));
    tete.appendChild(el('p', 'pe-compte', comptePublic()));

    // Deux compteurs de cote : les brillants, dont on sait combien il en
    // existe, et les secretes, dont on ne dit jamais le nombre.
    var cotes = el('p', 'pe-cotes');
    var nShiny = DP.shinys();
    var shiny = el('span', 'pe-cote pe-cote--shiny',
      '✦ ' + nShiny + ' / ' + P.especesShiny().length + ' brillants');
    cotes.appendChild(shiny);
    var nSecrets = P.secrets().filter(function (f) { return prises[f.id]; }).length;
    if (nSecrets) {
      cotes.appendChild(el('span', 'pe-cote pe-cote--secret',
        nSecrets + (nSecrets > 1 ? ' secrets découverts' : ' secret découvert')));
    }
    tete.appendChild(cotes);
    box.appendChild(tete);

    // Les sections. Une case vide ne dit jamais ce qu'elle cache — sauf
    // pour une evolution, ou l'on montre de qui elle vient et ce qu'il
    // reste a pecher : c'est un objectif, pas une surprise.
    var grille = el('div', 'pe-carnet-grille');

    function fiche(f) {
      var e = prises[f.id];
      // Les Speciaux ont leur propre echelle : la vignette prend la
      // couleur de cette rarete-la, sans quitter la section irradiee.
      var r = P.rarete(P.sousRarete(f));
      var n = el('div', 'pe-fiche');
      n.dataset.rarete = f.rarete;
      n.dataset.sousRarete = P.sousRarete(f);
      if (f.rarete === 'special') n.classList.add('pe-fiche--special');
      n.dataset.poisson = f.id;
      n.style.setProperty('--r', r.couleur);
      n.classList.toggle('is-vide', !e);
      if (f.secret) n.classList.add('pe-fiche--secret');

      if (e) {
        var brillant = !!e.shiny;
        if (brillant) n.classList.add('is-shiny');
        // Une espece connue s'ouvre : sa fiche dit tout ce que le carnet
        // ne tient pas dans une vignette.
        n.classList.add('is-ouvrable');
        n.setAttribute('role', 'button');
        n.tabIndex = 0;
        n.addEventListener('click', function () { ouvrirFiche(f, e); });
        n.addEventListener('keydown', function (ev) {
          if (ev.key !== 'Enter' && ev.key !== ' ') return;
          ev.preventDefault();
          ouvrirFiche(f, e);
        });
        var im = el('img', 'pe-fiche-img');
        im.src = P.url(f.id, brillant);
        im.alt = '';
        n.appendChild(im);
        var nom = el('span', 'pe-fiche-nom', f.nom);
        if (brillant) nom.appendChild(el('span', 'pe-etoile', '✦'));
        n.appendChild(nom);
        n.appendChild(el('span', 'pe-fiche-det',
          e.max + ' cm · ' + P.poidsTexte(e.kg || P.poids(f, e.max))));
        if (f.secret && f.indice) {
          n.title = f.indice;
          n.appendChild(el('span', 'pe-fiche-indice', f.indice));
        }
        n.appendChild(el('span', 'pe-fiche-n', '×' + e.n));
        return n;
      }

      if (f.evolueDe) {
        var base = P.parId(f.evolueDe);
        var eb = prises[f.evolueDe];
        var fait = eb ? Math.min(eb.n, f.seuil) : 0;
        n.classList.add('pe-fiche--evo');
        n.appendChild(el('span', 'pe-fiche-vide', '▲'));
        n.appendChild(el('span', 'pe-fiche-nom',
          'Évolution de ' + (base ? base.nom : '?')));
        n.appendChild(el('span', 'pe-fiche-det', fait + ' / ' + f.seuil + ' prises'));
        return n;
      }

      n.appendChild(el('span', 'pe-fiche-vide', '?'));
      n.appendChild(el('span', 'pe-fiche-nom', '???'));
      n.appendChild(el('span', 'pe-fiche-det', f.cm[0] + '–' + f.cm[1] + ' cm'));
      return n;
    }

    function section(titre, liste, cls, muet) {
      if (!liste.length) return;
      var t = el('p', 'pe-section' + (cls ? ' ' + cls : ''));
      t.appendChild(el('span', 'pe-section-nom', titre));
      var faits = liste.filter(function (f) { return prises[f.id]; }).length;
      // Les secretes ne disent pas combien elles sont : on n'affiche que
      // ce qui a deja mordu.
      t.appendChild(el('span', 'pe-section-n',
        muet ? String(faits) : faits + ' / ' + liste.length));
      grille.appendChild(t);
      liste.forEach(function (f) { grille.appendChild(fiche(f)); });
    }

    // ---------- La fiche d'une espece ----------
    // Tout est deduit de l'espece et du carnet : aucune donnee nouvelle a
    // tenir a jour, et une fiche existe donc pour les cinquante-quatre.

    var voile = el('div', 'pe-detail');
    voile.hidden = true;
    voile.addEventListener('click', function (ev) {
      if (ev.target === voile) fermerFiche();
    });

    function fermerFiche() {
      voile.hidden = true;
      voile.textContent = '';
      window.removeEventListener('keydown', auClavierFiche);
    }

    function auClavierFiche(ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); fermerFiche(); }
    }

    // Ce que le poids maximal de l'espece annonce au bout de la ligne.
    var COMBAT = [
      [0.18, 'Paisible'], [0.36, 'Nerveux'], [0.55, 'Costaud'],
      [0.74, 'Brutal'], [1.01, 'Monstrueux']
    ];

    function combativite(f) {
      var c = P.charge(P.poidsMax(f));
      for (var i = 0; i < COMBAT.length; i++) if (c <= COMBAT[i][0]) {
        return { nom: COMBAT[i][1], part: c };
      }
      return { nom: 'Monstrueux', part: 1 };
    }

    var SILHOUETTES = {
      classique: 'Fuselée', long: 'Allongée', plat: 'Haute et plate',
      rond: 'Sphérique', raie: 'En losange', meduse: 'En ombrelle',
      crabe: 'Carapacée', ecrevisse: 'Carapacée', anguille: 'Serpentiforme',
      triton: 'Amphibie'
    };

    function eaux(f) {
      if (f.secret) return 'Inconnues — elle ne vient qu’à certaines conditions';
      return f.radioactif ? 'Lacs irradiés, au nord-est et au sud-est'
                          : 'Lacs et rivière d’eau claire';
    }

    function ouvrirFiche(f, e) {
      var r = P.rarete(P.sousRarete(f));
      var brillant = !!e.shiny;
      voile.hidden = false;
      voile.textContent = '';

      var carte = el('div', 'pe-detail-carte');
      carte.dataset.rarete = f.rarete;
      carte.dataset.poisson = f.id;
      // Le cadre dit ce que la prise a de remarquable — brillante, ou
      // secrete — et la pastille garde la couleur de la rarete. Poser
      // "--r" en ligne l'emporte sur toute classe : c'est donc ici qu'on
      // tranche, pas dans la feuille de style.
      carte.style.setProperty('--rarete', r.couleur);
      carte.style.setProperty('--r',
        brillant ? '#ffd166' : (f.secret ? '#c49bff' : r.couleur));
      if (brillant) carte.classList.add('is-shiny');
      if (f.secret) carte.classList.add('is-secret');

      // L'entete : la bete en grand, son nom, sa rarete.
      var tete = el('div', 'pe-detail-tete');
      var im = el('img', 'pe-detail-img');
      im.src = P.url(f.id, brillant);
      im.alt = '';
      tete.appendChild(im);
      var titres = el('div', 'pe-detail-titres');
      var nom = el('h3', 'pe-detail-nom', f.nom);
      if (brillant) nom.appendChild(el('span', 'pe-etoile', '✦'));
      titres.appendChild(nom);
      var chips = el('p', 'pe-detail-chips');
      chips.appendChild(el('span', 'pe-detail-chip pe-detail-chip--rarete',
        f.secret ? 'Secret'
          : f.rarete === 'special' ? 'Spécial ' + r.nom.toLowerCase() : r.nom));
      if (f.evolueDe) {
        var base = P.parId(f.evolueDe);
        chips.appendChild(el('span', 'pe-detail-chip pe-detail-chip--evo',
          'Évolution de ' + (base ? base.nom : '?')));
      }
      if (f.radioactif) {
        chips.appendChild(el('span', 'pe-detail-chip pe-detail-chip--rad', 'Irradié'));
      }
      titres.appendChild(chips);
      tete.appendChild(titres);
      carte.appendChild(tete);

      // Les records du carnet.
      var recs = el('div', 'pe-detail-recs');
      [['Prises', e.n],
       ['Plus belle taille', e.max + ' cm'],
       ['Plus beau poids', P.poidsTexte(e.kg || P.poids(f, e.max))]
      ].forEach(function (l) {
        var b = el('div', 'pe-detail-rec');
        b.appendChild(el('span', 'pe-detail-rec-nom', l[0]));
        b.appendChild(el('strong', 'pe-detail-rec-val', String(l[1])));
        recs.appendChild(b);
      });
      carte.appendChild(recs);

      // Ce que l'espece est, en dehors de nos prises.
      var c = combativite(f);
      var lignes = el('div', 'pe-detail-lignes');
      function ligne(nom, val) {
        var l = el('div', 'pe-detail-ligne');
        l.appendChild(el('span', 'pe-detail-label', nom));
        l.appendChild(el('span', 'pe-detail-val', val));
        lignes.appendChild(l);
        return l;
      }
      ligne('Taille', f.cm[0] + ' à ' + f.cm[1] + ' cm');
      ligne('Poids maximal', P.poidsTexte(P.poidsMax(f)));
      ligne('Silhouette', SILHOUETTES[f.forme] || 'Indéterminée');
      ligne('Eaux', eaux(f));

      // La combativite, avec sa jauge : c'est elle qui dit le temps dont
      // on dispose pour ferrer.
      var lc = ligne('Combativité', c.nom);
      var jauge = el('span', 'pe-detail-jauge');
      var plein = el('span', 'pe-detail-jauge-plein');
      plein.style.width = Math.round(c.part * 100) + '%';
      jauge.appendChild(plein);
      lc.appendChild(jauge);

      if (brillant) {
        ligne('Livrée', e.shiny + (e.shiny > 1 ? ' brillants sortis' : ' brillant sorti'));
      }
      carte.appendChild(lignes);

      if (f.secret && f.indice) {
        carte.appendChild(el('p', 'pe-detail-indice', f.indice));
      }

      var evo = P.evolutionDe(f.id);
      if (evo) {
        var fait = Math.min(e.n, evo.seuil);
        carte.appendChild(el('p', 'pe-detail-evo',
          DP.aPeche(evo.id)
            ? 'A déjà évolué en ' + evo.nom + '.'
            : 'Évolue en ' + evo.nom + ' à la ' + evo.seuil + 'e prise  ·  ' +
              fait + ' / ' + evo.seuil));
      }

      var fermer = el('button', 'pe-detail-fermer', 'Fermer');
      fermer.type = 'button';
      fermer.addEventListener('click', fermerFiche);
      carte.appendChild(fermer);

      voile.appendChild(carte);
      window.addEventListener('keydown', auClavierFiche);
      fermer.focus();
    }

    section('Eaux claires', P.vivier(false));
    section('Spéciaux — eaux irradiées', P.vivier(true), 'pe-section--rad');
    section('Évolutions', P.evolutions(), 'pe-section--evo');
    section('Secrets', P.secrets().filter(function (f) { return prises[f.id]; }),
            'pe-section--secret', true);

    box.appendChild(grille);
    box.appendChild(voile);

    var pied = el('div', 'pe-pied');
    var go = el('a', 'pe-btn', DP.aLaCanne() ? 'Aller pêcher' : 'Trouver la canne');
    go.href = '#peche';
    pied.appendChild(go);
    if (DP.aLaCanne()) {
      var vest = el('a', 'pe-btn pe-btn--plat', 'Vestiaire');
      vest.href = '#vestiaire';
      pied.appendChild(vest);
    }
    // Le carnet est le carrefour du mini-jeu : c'est par lui qu'on
    // rejoint l'armurerie sans quitter la partie en cours.
    if (DP.aLArme()) {
      var arm = el('a', 'pe-btn pe-btn--plat', 'Armurerie');
      arm.href = '#armurerie';
      pied.appendChild(arm);
    }
    box.appendChild(pied);

    view.appendChild(box);
  }

  // ==========================================================
  //  Branchement
  // ==========================================================

  // La Peche prend le deuxieme emplacement de la liste des mini-jeux.
  window.MINIJEUX = window.MINIJEUX || [];
  var place = window.MINIJEUX.findIndex
    ? window.MINIJEUX.findIndex(function (j) { return j.id === 'libre-2'; })
    : -1;
  var entree = {
    id: 'peche', nom: 'Fish n’Der', sous: 'Des dizaines d’espèces à remonter',
    vue: 'peche', pret: true,
    img: 'assets/games/icones/fish-n-der.webp'
  };
  if (place !== -1) window.MINIJEUX[place] = entree;
  else window.MINIJEUX.push(entree);

  window.VIEWS['peche'] = { title: 'Fish n’Der', render: viewPeche };
  window.VIEWS['peche-collection'] = { title: 'Carnet de pêche', render: viewCarnet };

  window.PECHE = {
    construireCarte: construireCarte,
    MW: MW, MH: MH, DEPART: DEPART, CANNE: CANNE,
    CABANE: CABANE, POISSONNIER: POISSONNIER, PANNEAU: PANNEAU,
    reprise: function () { return reprise; },
    poserReprise: function (r) { reprise = r; },
    LACS: LACS, CHANCE_CREDIT: CHANCE_CREDIT
  };
})();
