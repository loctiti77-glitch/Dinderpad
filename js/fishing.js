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
  var ECRANS_PECHE = ['peche', 'poissonnerie', 'vestiaire', 'peche-collection', 'peche-hub'];

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

      jeu.appendChild(scene);

      var g = construireCarte();

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
      var M2 = window.MATERIEL;
      var mordant = null, mordantCm = 0, lourd = false;
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
        // Pistolet Lumithique, et rarement.
        var R = window.REQUIN;
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
          mordantShiny = P.estShiny(mordant.id);
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

        // La prise sort de l'eau et vole jusqu'au pecheur avant qu'on
        // l'annonce : c'est le moment ou l'on voit ce qu'on a ferre.
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

          // L'evolution se declenche au moment ou la prise sort de l'eau :
          // c'est la enieme fois qu'on la prend, et elle change de forme
          // dans les mains du pecheur.
          var evo = P.evolutionDe(f.id);
          if (evo && !DP.aPeche(evo.id) && e.n >= evo.seuil) {
            return montrerPoisson(f, cm, kg, neuf, e, brillant, function () {
              evoluer(f, evo);
            });
          }
          montrerPoisson(f, cm, kg, neuf, e, brillant);
        }, reduit ? 0 : SORTIE);
      }

      function ranger() {
        etat = 'repos';
        bouchon = null;
        vol = null; gerbe = null;
        mordant = null; mordantCm = 0; lourd = false; irradie = false;
        mordantShiny = false;
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
        if (etat === 'mord') {
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
      function rencontre() {
        var R = window.REQUIN;
        if (!R) return ranger();
        etat = 'requin';
        bouchon = null; vol = null; gerbe = null;
        majAction();
        dire('Quelque chose de gros remonte…');
        var bete = R.tirer(DP.armeNiveau(), irradie);
        duel = R.Duel({
          parent: scene,
          bete: bete,
          irradie: irradie,
          surSortie: function () { duel = null; if (vivant()) ranger(); }
        });
      }

      // --- Les panneaux de prise ---

      function montrerPoisson(f, cm, kg, neuf, e, brillant, ensuite) {
        var r = P.rarete(f.rarete);
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
        det.appendChild(el('span', 'pe-prise-rarete', f.secret ? 'Secret' : r.nom));
        det.appendChild(el('span', null, cm + ' cm'));
        det.appendChild(el('span', 'pe-prise-kg', P.poidsTexte(kg)));
        if (e && e.n > 1) det.appendChild(el('span', 'pe-prise-n', '×' + e.n));
        box.appendChild(det);
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

      // --- Le bouton et le clavier ---

      function agir() {
        var r = action.dataset.role;
        if (r === 'lancer') lancer();
        else if (r === 'ferrer') ferrer();
        else if (r === 'ramasser') ramasser();
        else if (r === 'entrer') entrerBoutique();
        else if (r === 'fouiller') fouiller();
      }
      action.addEventListener('click', agir);

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

      function dessinerBouchon(ctx, cam, t) {
        dessinerGerbe(ctx, cam, t);
        dessinerVol(ctx, cam, t);
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

        // Le flotteur, aux couleurs de celui qui est monte. Il plonge
        // quand ca mord, et d'autant plus vite que la prise est lourde.
        var plonge = vif ? Math.abs(Math.sin((t - depuis) / (lourd ? 60 : 90))) * (lourd ? 5 : 3) : 0;
        var flot = M2 ? M2.equipee('flotteur').couleurs : ['#e8402f', '#f4f7fb'];
        ctx.fillStyle = flot[0];
        ctx.fillRect(Math.round(bx) - 1, Math.round(by - 4 + plonge), 3, 3);
        ctx.fillStyle = flot[1];
        ctx.fillRect(Math.round(bx) - 1, Math.round(by - 1 + plonge), 3, 2);

        // Le fil, du pecheur au flotteur.
        fil(ctx, cam, balade.chef.x, balade.chef.y - 18, bouchon.x, bouchon.y - 3, 7);
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

        chaqueImage: function () {
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
                   : pretALancer() ? 'Face à l’eau : lance ta ligne.'
                   : 'Trouve une berge et fais face à l’eau.';
          if (hudTxt.textContent !== aide) hudTxt.textContent = aide;
        }
      });

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
      var r = P.rarete(f.rarete);
      var n = el('div', 'pe-fiche');
      n.dataset.rarete = f.rarete;
      n.dataset.poisson = f.id;
      n.style.setProperty('--r', r.couleur);
      n.classList.toggle('is-vide', !e);
      if (f.secret) n.classList.add('pe-fiche--secret');

      if (e) {
        var brillant = !!e.shiny;
        if (brillant) n.classList.add('is-shiny');
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

    section('Eaux claires', P.vivier(false));
    section('Spéciaux — eaux irradiées', P.vivier(true), 'pe-section--rad');
    section('Évolutions', P.evolutions(), 'pe-section--evo');
    section('Secrets', P.secrets().filter(function (f) { return prises[f.id]; }),
            'pe-section--secret', true);

    box.appendChild(grille);

    var pied = el('div', 'pe-pied');
    var go = el('a', 'pe-btn', DP.aLaCanne() ? 'Aller pêcher' : 'Trouver la canne');
    go.href = '#peche';
    pied.appendChild(go);
    if (DP.aLaCanne()) {
      var vest = el('a', 'pe-btn pe-btn--plat', 'Vestiaire');
      vest.href = '#vestiaire';
      pied.appendChild(vest);
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
