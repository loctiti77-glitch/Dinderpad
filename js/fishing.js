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

  // Une chance sur cent : le Credit Temporel.
  var CHANCE_CREDIT = 100;

  // ==========================================================
  //  La carte : beaucoup d'eau, et des berges ou se poster
  // ==========================================================

  // Les plans d'eau, decrits en cases : centre, demi-largeur, demi-hauteur.
  var LACS = [
    { x: 13, y: 8,  rx: 7,   ry: 4.4 },
    { x: 33, y: 7,  rx: 8.5, ry: 4 },
    { x: 40, y: 19, rx: 5.5, ry: 4.5 },
    { x: 21, y: 21, rx: 6.5, ry: 5 },
    { x: 8,  y: 17, rx: 3.6, ry: 3 },
    { x: 31, y: 27, rx: 5,   ry: 3.2 },
    { x: 44, y: 28, rx: 3,   ry: 2.4 }
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

    function eau(cx, cy, rx, ry) {
      for (y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) continue;
          var dx = (x - cx) / rx, dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) g[y][x] = T.EAU;
        }
      }
    }
    LACS.forEach(function (l) { eau(l.x, l.y, l.rx, l.ry); });

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
        if (g[y][x] === T.EAU) continue;
        var pres = false;
        for (var j = -1; j <= 1; j++)
          for (var i = -1; i <= 1; i++)
            if (g[y + j] && g[y + j][x + i] === T.EAU) pres = true;
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
      var prises = Object.keys(DP.prises()).length;
      tete.appendChild(el('p', 'pe-compte', prises + ' / ' + P.LISTE.length + ' espèces'));
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

    function ecranCarte() {
      toutAnnuler();
      jeu.textContent = '';
      jeu.dataset.etape = 'carte';

      var scene = el('div', 'pe-scene');
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

      var carnetBtn = el('a', 'pe-carnet', 'Carnet');
      carnetBtn.href = '#peche-collection';
      scene.appendChild(carnetBtn);

      var prise = el('div', 'pe-prise');
      prise.hidden = true;
      scene.appendChild(prise);

      jeu.appendChild(scene);

      var g = construireCarte();

      // --- L'etat de la peche ---
      // repos → lancee → attente → ca-mord → (prise | rate)
      var etat = 'repos';
      var bouchon = null;          // la position du flotteur, en pixels monde
      var depuis = 0;              // date du dernier changement d'etat
      var balade = null;
      var canneAuSol = !DP.aLaCanne();
      var M2 = window.MATERIEL;
      var mordant = null, mordantCm = 0, lourd = false;
      var devantCabane = false;

      function dire(txt) { hudTxt.textContent = txt; }

      function eauDevant() {
        var c = balade.caseDevant();
        var t = balade.tuile(c[0], c[1]);
        return (t === T.EAU || t === T.ROSEAU) ? c : null;
      }

      function pretALancer() { return DP.aLaCanne() && !!eauDevant(); }

      // --- Les actions ---

      function lancer() {
        var c = eauDevant();
        if (!c) return;
        bouchon = { x: (c[0] + 0.5) * TS, y: (c[1] + 0.5) * TS };
        etat = 'lancee';
        depuis = performance.now();
        dire('La ligne est à l’eau…');
        majAction();

        // Parfois rien ne vient : il faut relancer.
        var mord = Math.random() < 0.68;
        var delai = reduit ? 300 : 1200 + Math.random() * 2800;
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
          mordant = P.tirer(M2 ? M2.chanceRarete() : 0);
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
        etat = 'prise';
        majAction();

        // Une chance sur cent : ce n'est pas un poisson.
        if (Math.floor(Math.random() * CHANCE_CREDIT) === 0) {
          DP.earn('pink', 1);
          montrerCredit();
          return;
        }
        var f = mordant || P.tirer(M2 ? M2.chanceRarete() : 0);
        var cm = mordantCm || P.taille(f);
        var kg = P.poids(f, cm);
        var neuf = !DP.aPeche(f.id);
        var e = DP.noterPrise(f.id, cm, kg);
        montrerPoisson(f, cm, kg, neuf, e);
      }

      function ranger() {
        etat = 'repos';
        bouchon = null;
        mordant = null; mordantCm = 0; lourd = false;
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

      function majAction() {
        if (etat === 'mord') {
          action.hidden = false;
          action.textContent = 'FERRER !';
          action.dataset.role = 'ferrer';
        } else if (etat === 'repos' && pretALancer()) {
          action.hidden = false;
          action.textContent = 'LANCER';
          action.dataset.role = 'lancer';
        } else if (etat === 'repos' && canneAuSol && prochesDeLaCanne()) {
          action.hidden = false;
          action.textContent = 'RAMASSER LA CANNE';
          action.dataset.role = 'ramasser';
        } else if (etat === 'repos' && devantCabane) {
          action.hidden = false;
          action.textContent = 'RENTRER';
          action.dataset.role = 'entrer';
        } else {
          action.hidden = true;
          action.dataset.role = '';
        }
      }

      function prochesDeLaCanne() {
        var dx = balade.chef.x - CANNE.x, dy = balade.chef.y - CANNE.y;
        return dx * dx + dy * dy < 40 * 40;
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

      // --- Les panneaux de prise ---

      function montrerPoisson(f, cm, kg, neuf, e) {
        var r = P.rarete(f.rarete);
        prise.hidden = false;
        prise.textContent = '';
        var box = el('div', 'pe-prise-box');
        box.dataset.rarete = f.rarete;
        box.style.setProperty('--r', r.couleur);

        box.appendChild(el('p', 'pe-prise-titre', neuf ? 'NOUVELLE ESPÈCE !' : 'Belle prise !'));
        var im = el('img', 'pe-prise-img');
        im.src = P.url(f.id);
        im.alt = '';
        box.appendChild(im);
        box.appendChild(el('p', 'pe-prise-nom', f.nom));
        var det = el('p', 'pe-prise-det');
        det.appendChild(el('span', 'pe-prise-rarete', r.nom));
        det.appendChild(el('span', null, cm + ' cm'));
        det.appendChild(el('span', 'pe-prise-kg', P.poidsTexte(kg)));
        if (e && e.n > 1) det.appendChild(el('span', 'pe-prise-n', '×' + e.n));
        box.appendChild(det);
        if (lourd) box.appendChild(el('p', 'pe-prise-lourd', 'Belle bagarre !'));
        prise.appendChild(box);

        dire(neuf ? f.nom + ' rejoint ton carnet.'
                  : f.nom + ', ' + cm + ' cm pour ' + P.poidsTexte(kg) + '.');
        plusTard(function () { if (vivant()) ranger(); }, reduit ? 800 : 2600);
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
        else if (r === 'entrer') { balade.arreter(); location.hash = '#poissonnerie'; }
      }
      action.addEventListener('click', agir);

      var auClavier = function (e) {
        if (e.key !== ' ' && e.key !== 'Enter') return;
        e.preventDefault();
        agir();
      };
      window.addEventListener('keydown', auClavier);

      // --- Le decor mouvant : flotteur, ondes, canne au sol ---

      function dessinerBouchon(ctx, cam, t) {
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
        ctx.strokeStyle = 'rgba(240,248,255,.5)';
        ctx.beginPath();
        ctx.moveTo(balade.chef.x - cam.x, balade.chef.y - cam.y - 16);
        ctx.lineTo(bx, by - 3);
        ctx.stroke();
      }

      var spriteCanne = new Image();
      spriteCanne.src = 'assets/games/sprites/objets/canne.png';
      var spritePoissonnier = new Image();
      spritePoissonnier.src = 'assets/games/sprites/objets/poissonnier.png';

      balade = M.Balade({
        grille: g,
        canvas: cv,
        stick: stick, pomme: pomme,
        opts: { cabane: CABANE },
        depart: DEPART,
        troupe: [choisi],
        vitesse: 92,
        vivant: vivant,
        fige: function () { return etat !== 'repos'; },

        extras: function (t) {
          var sortie = [];

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
          if (etat !== 'repos') return;
          majAction();
          // L'indication suit ce que le joueur a devant lui, a chaque pas.
          var aide = canneAuSol ? 'Une canne à pêche flotte non loin.'
                   : devantCabane ? 'La Poissonnerie est ouverte.'
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
        balade.arreter();
      }, 400);
      minuteurs.push(veille);

      majAction();
    }

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
          'Trente espèces à remonter — et parfois un Crédit Temporel.'
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
    var trouves = Object.keys(prises).length;

    var tete = el('div', 'pe-tete pe-tete--carnet');
    var livre = el('img', 'pe-livre');
    livre.src = 'assets/items/fishbook.webp';
    livre.alt = '';
    tete.appendChild(livre);
    tete.appendChild(el('h2', 'pe-titre', 'Carnet de pêche'));
    tete.appendChild(el('p', 'pe-compte', trouves + ' / ' + P.LISTE.length + ' espèces'));
    box.appendChild(tete);

    var grille = el('div', 'pe-carnet-grille');
    P.LISTE.forEach(function (f) {
      var e = prises[f.id];
      var r = P.rarete(f.rarete);
      var n = el('div', 'pe-fiche');
      n.dataset.rarete = f.rarete;
      n.style.setProperty('--r', r.couleur);
      n.classList.toggle('is-vide', !e);

      if (e) {
        var im = el('img', 'pe-fiche-img');
        im.src = P.url(f.id);
        im.alt = '';
        n.appendChild(im);
        n.appendChild(el('span', 'pe-fiche-nom', f.nom));
        n.appendChild(el('span', 'pe-fiche-det',
          e.max + ' cm · ' + P.poidsTexte(e.kg || P.poids(f, e.max))));
        n.appendChild(el('span', 'pe-fiche-n', '×' + e.n));
      } else {
        n.appendChild(el('span', 'pe-fiche-vide', '?'));
        n.appendChild(el('span', 'pe-fiche-nom', '???'));
        n.appendChild(el('span', 'pe-fiche-det', f.cm[0] + '–' + f.cm[1] + ' cm'));
      }
      grille.appendChild(n);
    });
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
    id: 'peche', nom: 'Fish n’Der', sous: 'Trente espèces à remonter',
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
    CABANE: CABANE, POISSONNIER: POISSONNIER,
    LACS: LACS, CHANCE_CREDIT: CHANCE_CREDIT
  };
})();
