// The Odyssey of Dinder — chapitre premier.
//
// Une comete tombe dans le jardin, on y trouve une telecommande, et la
// telecommande ouvre les huit mondes du systeme solaire. Il suffit d'en
// taper les coordonnees : SS, l'initiale de la planete, son rang depuis
// le Soleil. A chacun de les deviner.
//
// Sur place, on marche, on croise ce qui vit, et on le scanne. Tout ce
// qui est scanne entre dans le carnet du Teleportail.
(function () {
  var DP = window.DP, M = window.MONDE, V = window.ODYVIE;
  if (!DP || !M || !V) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TS = M.TS, T = M.T;
  var MW = 40, MH = 28;
  var DEPART = { x: 20 * TS + 12, y: 22 * TS + 12 };

  // La partie en cours : le monde ou l'on se tient, et l'endroit exact.
  // Comme pour la peche, passer par le carnet ne doit pas tout perdre.
  var reprise = null;
  var ECRANS = ['odyssee', 'teleportail', 'odyssee-carnet'];

  window.addEventListener('hashchange', function () {
    var nom = (location.hash || '').replace(/^#/, '').split('/')[0];
    if (ECRANS.indexOf(nom) === -1) reprise = null;
  });

  // ==========================================================
  //  Le dessin du Teleportail
  // ==========================================================
  // Une telecommande trapue : ecran en haut, pave numerique, antenne. On
  // la peint faute d'image ; le jour ou le fichier arrive, l'inventaire
  // le prend a la place sans qu'on touche a ce code.

  var TL_L = 34, TL_H = 56;
  var cacheTL = null;

  function dessinerTelecommande(p) {
    var corps = '#2e3440', biseau = '#4a5263', clair = '#6d7789';
    var ecran = '#7cf0c8', ecran2 = '#d8fff0', touche = '#8c95a8';

    // L'antenne.
    p(24, 0, 3, 9, clair);
    p(24, 0, 3, 2, ecran);

    // Le boitier.
    p(3, 6, 28, 48, corps);
    p(3, 6, 28, 2, clair);
    p(3, 6, 2, 48, biseau);
    p(29, 6, 2, 48, '#1b202a');
    p(3, 52, 28, 2, '#1b202a');

    // L'ecran, avec ses deux lignes de texte suggerees.
    p(6, 10, 22, 14, '#0c1018');
    p(7, 11, 20, 12, ecran);
    p(9, 13, 12, 2, '#0c1018');
    p(9, 17, 16, 2, '#0c1018');
    p(7, 11, 20, 2, ecran2);

    // Le pave : trois rangees de trois touches, plus la barre du bas.
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        p(7 + c * 7, 28 + r * 6, 5, 4, touche);
        p(7 + c * 7, 28 + r * 6, 5, 1, clair);
      }
    }
    p(7, 46, 19, 4, ecran);
    p(7, 46, 19, 1, ecran2);
  }

  function cernerTL(ctx) {
    var img = ctx.getImageData(0, 0, TL_L, TL_H);
    var d = img.data;
    var plein = new Uint8Array(TL_L * TL_H), i;
    for (i = 0; i < TL_L * TL_H; i++) plein[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (var y = 0; y < TL_H; y++) {
      for (var x = 0; x < TL_L; x++) {
        i = y * TL_L + x;
        if (plein[i]) continue;
        var voisin = false;
        for (var k = 0; k < 4; k++) {
          var nx = x + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
          if (nx < 0 || ny < 0 || nx >= TL_L || ny >= TL_H) continue;
          if (plein[ny * TL_L + nx]) { voisin = true; break; }
        }
        if (!voisin) continue;
        d[i * 4] = 12; d[i * 4 + 1] = 14; d[i * 4 + 2] = 22; d[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function feuilleTL() {
    if (cacheTL) return cacheTL;
    var cv = document.createElement('canvas');
    cv.width = TL_L; cv.height = TL_H;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;
    dessinerTelecommande(function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    });
    cernerTL(x);
    cacheTL = { canvas: cv, L: TL_L, H: TL_H };
    return cacheTL;
  }

  function visuel() {
    var f = feuilleTL();
    return f ? f.canvas.toDataURL('image/png') : '';
  }

  // Une image qui prefere le fichier du joueur et retombe sur le dessin.
  function imageTelecommande(cls) {
    var im = el('img', cls);
    im.alt = '';
    im.addEventListener('error', function () {
      if (im.dataset.repli) return;
      im.dataset.repli = '1';
      im.src = visuel();
    });
    im.src = 'assets/items/teleportail.webp';
    return im;
  }

  function compteAstres() { return DP.astresVus().length; }

  function voyageur() {
    var owned = DP.owned();
    return owned.length ? owned[0] : 'dr-islas-human-form';
  }

  // ==========================================================
  //  Chapitre premier : l'intro
  // ==========================================================
  // Quatre temps, peints au canevas : la chambre, la comete, le jardin,
  // la trouvaille. On peut passer, mais pas rater ce qui compte.

  var IN_L = 480, IN_H = 316;

  var TEMPS = [
    { duree: 3200, texte: 'Tu dors. Dehors, le ciel est clair et vide.' },
    { duree: 3400, texte: 'Quelque chose le traverse. La pièce s’allume en blanc.' },
    { duree: 3200, texte: 'Le sol a tremblé. Au fond du jardin, ça fume encore.' },
    { duree: 4200, texte: 'Dans le cratère, une télécommande. Elle t’attendait.' }
  ];

  function viewIntro(vue, fini) {
    var box = el('div', 'ody ody--intro');
    var cv = el('canvas', 'ody-cv');
    cv.width = IN_L; cv.height = IN_H;
    box.appendChild(cv);

    var bandeau = el('p', 'ody-recit');
    box.appendChild(bandeau);

    var passer = el('button', 'ody-passer', 'Passer');
    passer.type = 'button';
    box.appendChild(passer);

    vue.appendChild(box);

    var ctx = cv.getContext('2d');
    var t0 = 0, brut = null, mort = false, temps = 0;
    var total = TEMPS.reduce(function (n, x) { return n + x.duree; }, 0);

    function arreter() {
      mort = true;
      if (brut) cancelAnimationFrame(brut);
    }

    function terminer() {
      arreter();
      DP.prendreTelecommande();
      DP.noterAstre('terre');
      if (fini) fini();
    }

    passer.addEventListener('click', terminer);

    // --- Les quatre tableaux ---

    function ciel(a, b) {
      var g = ctx.createLinearGradient(0, 0, 0, IN_H);
      g.addColorStop(0, a); g.addColorStop(1, b);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, IN_L, IN_H);
    }

    function etoiles(n, decalage) {
      ctx.fillStyle = 'rgba(234,247,255,.85)';
      for (var i = 0; i < n; i++) {
        var x = (i * 97 + decalage) % IN_L;
        var y = (i * 53) % 120;
        ctx.fillRect(x, y, (i % 5) ? 1 : 2, (i % 5) ? 1 : 2);
      }
    }

    // Le dormeur, vu de trois quarts : un lit, une couette, une tete.
    function chambre(t, eclat) {
      ciel('#0a1424', '#05080f');
      // Le mur et la fenetre.
      ctx.fillStyle = '#1b2436';
      ctx.fillRect(0, 0, IN_L, 190);
      ctx.fillStyle = '#0d1728';
      ctx.fillRect(250, 34, 150, 96);
      // Les etoiles ne se voient que par la fenetre : sur le mur, elles
      // faisaient un papier peint.
      ctx.save();
      ctx.beginPath();
      ctx.rect(250, 34, 150, 96);
      ctx.clip();
      etoiles(60, 0);
      ctx.restore();
      ctx.strokeStyle = '#3d4a63';
      ctx.lineWidth = 4;
      ctx.strokeRect(250, 34, 150, 96);
      ctx.beginPath();
      ctx.moveTo(325, 34); ctx.lineTo(325, 130);
      ctx.moveTo(250, 82); ctx.lineTo(400, 82);
      ctx.stroke();

      // Le plancher.
      ctx.fillStyle = '#2a2018';
      ctx.fillRect(0, 190, IN_L, IN_H - 190);
      for (var i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.fillRect(0, 196 + i * 16, IN_L, 2);
      }

      // Le lit.
      ctx.fillStyle = '#4a3428';
      ctx.fillRect(60, 178, 210, 14);
      ctx.fillRect(64, 190, 12, 44);
      ctx.fillRect(254, 190, 12, 44);
      ctx.fillStyle = '#6a4a38';
      ctx.fillRect(56, 150, 16, 44);          // la tete de lit
      // La couette.
      ctx.fillStyle = '#2f5fa8';
      ctx.fillRect(96, 160, 172, 22);
      ctx.fillStyle = '#3f79cf';
      ctx.fillRect(96, 160, 172, 7);
      // L'oreiller et la tete.
      ctx.fillStyle = '#e8eef7';
      ctx.fillRect(74, 158, 30, 18);
      ctx.fillStyle = '#f0c8a0';
      ctx.fillRect(84, 160, 18, 14);
      ctx.fillStyle = '#e06a2a';
      ctx.fillRect(84, 156, 18, 6);
      // Les yeux fermes, puis ouverts quand ca brille.
      ctx.fillStyle = '#2a1e18';
      if (eclat > 0.25) {
        ctx.fillRect(90, 165, 3, 4);
        ctx.fillRect(96, 165, 3, 4);
      } else {
        ctx.fillRect(89, 167, 5, 1);
        ctx.fillRect(96, 167, 5, 1);
      }

      if (eclat > 0) {
        ctx.fillStyle = 'rgba(255,250,236,' + (eclat * 0.85).toFixed(2) + ')';
        ctx.fillRect(0, 0, IN_L, IN_H);
      }
    }

    // La comete : une raie qui traverse la fenetre, puis l'impact.
    function comete(t) {
      var k = t / TEMPS[1].duree;
      var eclat = k < 0.55 ? 0 : Math.max(0, 1 - (k - 0.55) / 0.2);
      chambre(t, eclat);
      if (k < 0.62) {
        var av = Math.min(1, k / 0.6);
        var x = 258 + av * 130, y = 40 + av * 78;
        ctx.strokeStyle = 'rgba(255,240,200,.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 34, y - 20); ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = '#fffaec';
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
      }
    }

    // Le jardin, de nuit, et la fumee au fond.
    function jardin(t, gros) {
      ciel('#0d1c33', '#1d3a5c');
      etoiles(34, 0);
      // La maison, a gauche.
      ctx.fillStyle = '#2a2230';
      ctx.fillRect(0, 96, 118, 130);
      ctx.fillStyle = '#3a2f42';
      ctx.fillRect(0, 84, 130, 16);
      ctx.fillStyle = '#e8c86a';
      ctx.fillRect(28, 126, 24, 22);          // la fenetre allumee
      ctx.fillStyle = '#4a3a28';
      ctx.fillRect(74, 150, 26, 76);          // la porte
      // La pelouse.
      ctx.fillStyle = '#26512a';
      ctx.fillRect(0, 216, IN_L, IN_H - 216);
      ctx.fillStyle = '#2e5f31';
      for (var i = 0; i < 90; i++) {
        ctx.fillRect((i * 37) % IN_L, 220 + ((i * 17) % 90), 3, 2);
      }
      // La haie, au fond.
      ctx.fillStyle = '#1d3f22';
      ctx.fillRect(0, 200, IN_L, 18);

      // Le cratere qui fume.
      var cx = 326, cy = 250;
      ctx.fillStyle = '#1a140e';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 52 * gros, 20 * gros, 0, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = '#3a2a18';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 3 * gros, 56 * gros, 21 * gros, 0, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = '#1a140e';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 44 * gros, 15 * gros, 0, 0, 6.3);
      ctx.fill();
      // Les braises.
      for (i = 0; i < 7; i++) {
        var bx = cx - 30 * gros + (i * 9 * gros);
        ctx.fillStyle = i % 2 ? '#e8742a' : '#ffb02e';
        ctx.fillRect(Math.round(bx), Math.round(cy - 2), 3, 2);
      }
      // La fumee.
      for (i = 0; i < 6; i++) {
        var ph = reduit ? i / 6 : ((t / 1400 + i / 6) % 1);
        ctx.fillStyle = 'rgba(200,200,205,' + (0.34 * (1 - ph)).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(cx - 6 + Math.sin(ph * 5 + i) * 13, cy - 16 - ph * 78,
                5 + ph * 15, 0, 6.3);
        ctx.fill();
      }

      // Le joueur, de dos, qui s'avance.
      var px = 120 + Math.min(1, t / 2200) * 92;
      ctx.fillStyle = 'rgba(0,0,0,.34)';
      ctx.beginPath();
      ctx.ellipse(px, 268, 14, 5, 0, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = '#e8eef7';
      ctx.fillRect(px - 10, 228, 20, 32);
      ctx.fillStyle = '#2f5fa8';
      ctx.fillRect(px - 10, 228, 20, 12);
      ctx.fillStyle = '#f0c8a0';
      ctx.fillRect(px - 8, 210, 16, 20);
      ctx.fillStyle = '#e06a2a';
      ctx.fillRect(px - 9, 206, 18, 8);
      ctx.fillStyle = '#2a2a34';
      ctx.fillRect(px - 9, 258, 7, 10);
      ctx.fillRect(px + 2, 258, 7, 10);
    }

    // La trouvaille : la telecommande dans le cratere, en gros.
    function trouvaille(t) {
      var k = t / TEMPS[3].duree;
      jardin(2400, 1);
      // On serre sur le cratere.
      ctx.fillStyle = 'rgba(2,6,12,' + Math.min(0.72, k * 1.6).toFixed(2) + ')';
      ctx.fillRect(0, 0, IN_L, IN_H);

      var f = feuilleTL();
      if (!f) return;
      var ech = 2.2 + Math.min(1, k * 1.8) * 1.6;
      var lg = TL_L * ech, ht = TL_H * ech;
      var bob = reduit ? 0 : Math.sin(t / 420) * 4;
      var cx = IN_L / 2, cy = IN_H / 2 + bob;

      // La lueur qui monte du cratere.
      var lum = 0.35 + (reduit ? 0.2 : 0.25 * Math.sin(t / 300));
      var g = ctx.createRadialGradient(cx, cy, 6, cx, cy, 130);
      g.addColorStop(0, 'rgba(124,240,200,' + lum.toFixed(2) + ')');
      g.addColorStop(1, 'rgba(124,240,200,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, IN_L, IN_H);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = Math.min(1, k * 3);
      ctx.drawImage(f.canvas, cx - lg / 2, cy - ht / 2, lg, ht);
      ctx.restore();

      // Les eclats qui montent.
      for (var i = 0; i < 9; i++) {
        var ph = reduit ? i / 9 : ((t / 1100 + i / 9) % 1);
        ctx.fillStyle = 'rgba(200,255,235,' + (0.8 * (1 - ph)).toFixed(2) + ')';
        ctx.fillRect(Math.round(cx - 46 + i * 11 + Math.sin(ph * 6 + i) * 6),
                     Math.round(cy + 60 - ph * 120), 2, 2);
      }
    }

    // --- La boucle ---
    function image(t) {
      if (mort) return;
      if (!t0) t0 = t;
      var age = reduit ? total : (t - t0);
      brut = requestAnimationFrame(image);
      if (!ctx) return;

      // Quel tableau, et depuis combien de temps.
      var reste = age, i = 0;
      while (i < TEMPS.length - 1 && reste >= TEMPS[i].duree) {
        reste -= TEMPS[i].duree; i++;
      }
      if (i !== temps) {
        temps = i;
        bandeau.textContent = TEMPS[i].texte;
        bandeau.classList.remove('is-neuf');
        void bandeau.offsetWidth;
        bandeau.classList.add('is-neuf');
        box.dataset.temps = String(i);
      }

      if (i === 0) chambre(reste, 0);
      else if (i === 1) comete(reste);
      else if (i === 2) jardin(reste, Math.min(1, 0.4 + reste / 1600));
      else trouvaille(reste);

      if (age >= total) terminer();
    }

    bandeau.textContent = TEMPS[0].texte;
    brut = requestAnimationFrame(image);

    // Si l'ecran disparait, la boucle s'arrete avec lui.
    var veille = setInterval(function () {
      if (document.body.contains(box)) return;
      clearInterval(veille);
      arreter();
    }, 400);
  }

  // ==========================================================
  //  L'ecran d'accueil du mini-jeu
  // ==========================================================

  function viewOdyssee(view) {
    var jeu = el('div', 'ody-hote');
    view.appendChild(jeu);

    // Une partie en cours : on y retourne sans repasser par l'intro.
    if (reprise && DP.aLaTelecommande()) {
      var ou = reprise;
      reprise = null;
      return ecranMonde(jeu, ou.astre, ou);
    }
    reprise = null;

    // Sans la telecommande, le chapitre premier commence.
    if (!DP.aLaTelecommande()) {
      if (window.INTRO) {
        return jeu.appendChild(window.INTRO.ecran({
          icone: visuel(),
          titre: 'The Odyssey of Dinder',
          teinte: '#7cf0c8',
          bouton: 'CHAPITRE 1',
          lignes: [
            'Il est trois heures du matin.',
            'Tu ne le sais pas encore, mais dans quelques secondes',
            'quelque chose va tomber au fond de ton jardin.',
            'Et le système solaire va devenir très petit.'
          ],
          commencer: function () {
            jeu.textContent = '';
            viewIntro(jeu, function () {
              jeu.textContent = '';
              montrerTrouvaille(jeu);
            });
          }
        }));
      }
      return viewIntro(jeu, function () {
        jeu.textContent = '';
        montrerTrouvaille(jeu);
      });
    }

    // Avec la telecommande : on la sort.
    location.hash = '#teleportail';
  }

  // Le panneau qui annonce l'objet, apres l'intro.
  function montrerTrouvaille(jeu) {
    var box = el('div', 'ody ody--trouvaille');
    var carte = el('div', 'ody-carte');
    carte.appendChild(el('p', 'ody-carte-titre', 'TÉLÉPORTAIL'));
    carte.appendChild(imageTelecommande('ody-carte-img'));
    carte.appendChild(el('p', 'ody-carte-txt',
      'Une télécommande, tiède, qui n’a rien de terrestre. Un écran, ' +
      'un pavé, et une plaque gravée au dos.'));
    carte.appendChild(el('p', 'ody-carte-plaque',
      'DESTINATION : SS-[INITIALE][RANG]'));
    carte.appendChild(el('p', 'ody-carte-txt ody-carte-txt--sous',
      'Elle rejoint tes Items. À toi de trouver où aller.'));
    var b = el('a', 'ody-btn', 'Ouvrir le Téléportail');
    b.href = '#teleportail';
    carte.appendChild(b);
    box.appendChild(carte);
    jeu.appendChild(box);
  }

  // ==========================================================
  //  Le Teleportail
  // ==========================================================

  function viewTeleportail(view) {
    if (!DP.aLaTelecommande()) { location.hash = '#odyssee'; return; }

    var box = el('div', 'tp');
    var saisie = '';
    var message = 'Entre une destination.';
    var erreur = false;

    // ---- L'appareil, a gauche ----
    var appareil = el('div', 'tp-appareil');
    appareil.appendChild(imageTelecommande('tp-image'));

    var ecran = el('div', 'tp-ecran');
    var ligneCode = el('p', 'tp-code');
    var ligneMot = el('p', 'tp-mot');
    ecran.appendChild(el('p', 'tp-entete', 'TÉLÉPORTAIL  ·  v1'));
    ecran.appendChild(ligneCode);
    ecran.appendChild(ligneMot);
    appareil.appendChild(ecran);

    var pave = el('div', 'tp-pave');
    var TOUCHES = ['S', 'M', 'V', 'T', 'J', 'U', 'N', '-',
                   '1', '2', '3', '4', '5', '6', '7', '8'];
    TOUCHES.forEach(function (c) {
      var b = el('button', 'tp-touche', c);
      b.type = 'button';
      b.dataset.touche = c;
      b.addEventListener('click', function () { taper(c); });
      pave.appendChild(b);
    });
    var effacer = el('button', 'tp-touche tp-touche--eff', '←');
    effacer.type = 'button';
    effacer.dataset.touche = 'eff';
    effacer.addEventListener('click', function () {
      saisie = saisie.slice(0, -1); erreur = false; majEcran();
    });
    pave.appendChild(effacer);
    var partir = el('button', 'tp-touche tp-touche--go', 'PARTIR');
    partir.type = 'button';
    partir.dataset.touche = 'go';
    partir.addEventListener('click', valider);
    pave.appendChild(partir);
    appareil.appendChild(pave);

    appareil.appendChild(el('p', 'tp-plaque', 'SS-[INITIALE][RANG]'));
    box.appendChild(appareil);

    // ---- Le journal de bord, a droite ----
    var droite = el('div', 'tp-droite');

    var tete = el('div', 'tp-banniere');
    tete.appendChild(el('span', 'tp-enseigne', 'Journal de bord'));
    var nScans = Object.keys(DP.scans()).length;
    tete.appendChild(el('span', 'tp-compte',
      DP.astresVus().length + ' / 8 mondes  ·  ' + nScans + ' / ' +
      V.tout().length + ' scans'));
    droite.appendChild(tete);

    var liste = el('div', 'tp-mondes');
    V.ASTRES.forEach(function (a) {
      var vu = DP.aVuAstre(a.id);
      var n = el('button', 'tp-monde');
      n.type = 'button';
      n.dataset.astre = a.id;
      n.classList.toggle('is-inconnu', !vu);
      n.style.setProperty('--r', a.ciel[1]);

      var disque = el('span', 'tp-disque');
      disque.style.setProperty('--c1', a.palette.sol);
      disque.style.setProperty('--c2', a.palette.roche);
      n.appendChild(disque);

      var txt = el('span', 'tp-monde-txt');
      txt.appendChild(el('strong', 'tp-monde-nom', vu ? a.nom : '? ? ?'));
      txt.appendChild(el('span', 'tp-monde-code', vu ? a.code : 'code inconnu'));
      n.appendChild(txt);

      if (vu) {
        var faits = V.scannables(a.id).filter(function (s) {
          return DP.aScanne(s.id);
        }).length;
        n.appendChild(el('span', 'tp-monde-n',
          faits + ' / ' + V.scannables(a.id).length));
      }

      n.addEventListener('click', function () {
        if (!vu) {
          dire('Ce monde n’est pas encore au journal. Tape ses coordonnées.', true);
          return;
        }
        saisie = a.code;
        erreur = false;
        majEcran();
      });
      liste.appendChild(n);
    });
    droite.appendChild(liste);

    var pied = el('div', 'tp-pied');
    var carnet = el('a', 'ody-btn ody-btn--plat', 'Carnet du scanner');
    carnet.href = '#odyssee-carnet';
    pied.appendChild(carnet);
    var items = el('a', 'ody-btn ody-btn--plat', 'Items');
    items.href = '#items';
    pied.appendChild(items);
    droite.appendChild(pied);
    box.appendChild(droite);

    view.appendChild(box);

    // ---- Le clavier ----
    function auClavier(e) {
      if (e.key === 'Enter') { e.preventDefault(); return valider(); }
      if (e.key === 'Backspace') {
        e.preventDefault();
        saisie = saisie.slice(0, -1); erreur = false; majEcran();
        return;
      }
      var c = e.key.toUpperCase();
      if (/^[A-Z0-9-]$/.test(c)) { e.preventDefault(); taper(c); }
    }
    window.addEventListener('keydown', auClavier);
    var veille = setInterval(function () {
      if (document.body.contains(box)) return;
      clearInterval(veille);
      window.removeEventListener('keydown', auClavier);
    }, 400);

    function taper(c) {
      if (saisie.length >= 6) return;
      saisie += c;
      erreur = false;
      majEcran();
    }

    function dire(txt, mauvais) {
      message = txt;
      erreur = !!mauvais;
      majEcran();
    }

    function majEcran() {
      ligneCode.textContent = (saisie || '_ _ _ _ _').toUpperCase();
      ligneMot.textContent = message;
      ecran.classList.toggle('is-erreur', erreur);
      partir.disabled = saisie.length < 5;
    }

    function valider() {
      var a = V.astre(saisie);
      if (!a) {
        dire('Coordonnées refusées. Rien ne répond.', true);
        appareil.classList.remove('is-refus');
        void appareil.offsetWidth;
        appareil.classList.add('is-refus');
        return;
      }
      dire('Verrouillage sur ' + a.nom + '…');
      appareil.classList.add('is-depart');
      setTimeout(function () {
        if (!document.body.contains(box)) return;
        location.hash = '#odyssee/' + a.id;
      }, reduit ? 0 : 700);
    }

    majEcran();
  }

  // ==========================================================
  //  La carte d'un monde
  // ==========================================================

  function construireCarte(a) {
    var g = [], x, y;
    var bruit = M.bruit;
    var sel = a.rang * 17;

    for (y = 0; y < MH; y++) {
      g.push([]);
      for (x = 0; x < MW; x++) {
        g[y].push(bruit(x, y, sel) < 0.16 ? T.SOL_B : T.SOL);
      }
    }

    // Les nappes : quelques mares, differentes d'un monde a l'autre.
    for (var n = 0; n < 4; n++) {
      var cx = 5 + Math.round(bruit(n, 1, sel + 3) * (MW - 10));
      var cy = 4 + Math.round(bruit(n, 2, sel + 4) * (MH - 8));
      var rx = 2 + Math.round(bruit(n, 3, sel + 5) * 4);
      var ry = 2 + Math.round(bruit(n, 4, sel + 6) * 3);
      for (y = cy - ry; y <= cy + ry; y++) {
        for (x = cx - rx; x <= cx + rx; x++) {
          if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) continue;
          var dx = (x - cx) / rx, dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) g[y][x] = T.LIQUIDE;
        }
      }
    }

    // Le relief, les gravats et les cristaux, selon l'astre.
    for (y = 0; y < MH; y++) {
      for (x = 0; x < MW; x++) {
        if (g[y][x] === T.LIQUIDE) continue;
        if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) { g[y][x] = T.ROCHE_A; continue; }
        // On laisse degage autour du point d'arrivee.
        if (Math.abs(x - 20) + Math.abs(y - 22) < 5) continue;
        var b = bruit(x, y, sel + 1);
        if (b < a.roche * 0.55) g[y][x] = T.ROCHE_A;
        else if (b < a.roche + a.cristal) g[y][x] = T.CRISTAL;
        else if (b < a.roche + a.cristal + 0.08) g[y][x] = T.GRAVATS;
      }
    }

    // Le point d'arrivee reste toujours du sol nu : une nappe tiree au
    // hasard pouvait tomber pile dessus, et le voyageur se posait au
    // milieu de l'acide, incapable de bouger.
    for (y = 18; y <= 26; y++) {
      for (x = 16; x <= 24; x++) {
        if (Math.abs(x - 20) + Math.abs(y - 22) <= 4) g[y][x] = T.SOL;
      }
    }

    relier(g);
    return g;
  }

  // Le relief tire au hasard coupe parfois la carte en poches : sur
  // Mars, le point d'arrivee n'ouvrait que deux cents cases sur mille. On
  // perce donc un passage depuis chaque poche isolee jusqu'au depart, en
  // equerre, a travers la roche ou la glace. Le trace est deterministe :
  // la meme planete a toujours les memes passages.
  function relier(g) {
    for (var tour = 0; tour < 40; tour++) {
      var vu = accessibles(g), cible = null, x, y;
      for (y = 2; y < MH - 2 && !cible; y++) {
        for (x = 2; x < MW - 2 && !cible; x++) {
          if (!M.BLOQUANT[g[y][x]] && !vu[x + ',' + y]) cible = [x, y];
        }
      }
      if (!cible) return;
      x = cible[0]; y = cible[1];
      while (x !== 20) {
        if (M.BLOQUANT[g[y][x]]) g[y][x] = T.GRAVATS;
        x += x < 20 ? 1 : -1;
      }
      while (y !== 22) {
        if (M.BLOQUANT[g[y][x]]) g[y][x] = T.GRAVATS;
        y += y < 22 ? 1 : -1;
      }
    }
  }

  // Les cases qu'on atteint a pied depuis le point d'arrivee. Le relief
  // est tire au hasard : sans ce reperage, une curiosite ou une bete
  // pouvait tomber derriere un mur de rochers, a jamais hors d'atteinte.
  function accessibles(g) {
    var dep = [Math.floor(DEPART.x / TS), Math.floor(DEPART.y / TS)];
    var vu = {}, file = [dep];
    vu[dep[0] + ',' + dep[1]] = true;
    while (file.length) {
      var c = file.shift();
      for (var k = 0; k < 4; k++) {
        var nx = c[0] + [1, -1, 0, 0][k], ny = c[1] + [0, 0, 1, -1][k];
        if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
        if (M.BLOQUANT[g[ny][nx]]) continue;
        var cle = nx + ',' + ny;
        if (vu[cle]) continue;
        vu[cle] = true;
        file.push([nx, ny]);
      }
    }
    return vu;
  }

  // Ou se plante la curiosite du monde : la case accessible la plus
  // eloignee du depart, avec un peu de place autour pour s'en approcher.
  function placeCuriosite(g) {
    var vu = accessibles(g);
    var mieux = null, loin = -1;
    for (var y = 3; y < MH - 3; y++) {
      for (var x = 3; x < MW - 3; x++) {
        if (!vu[x + ',' + y]) continue;
        var voisins = 0;
        for (var k = 0; k < 4; k++) {
          if (vu[(x + [1, -1, 0, 0][k]) + ',' + (y + [0, 0, 1, -1][k])]) voisins++;
        }
        if (voisins < 3) continue;
        var d = Math.abs(x - 20) + Math.abs(y - 22);
        // Assez loin pour qu'il faille la chercher, pas au bout du monde.
        if (d > loin && d <= 24) { loin = d; mieux = { x: x, y: y }; }
      }
    }
    return mieux || { x: 20, y: 18 };
  }

  function ecranMonde(jeu, idAstre, ou) {
    var a = V.astre(idAstre);
    if (!a) { location.hash = '#teleportail'; return; }

    jeu.textContent = '';
    DP.noterAstre(a.id);

    var scene = el('div', 'ody-scene');
    scene.dataset.astre = a.id;
    scene.style.setProperty('--ciel1', a.ciel[0]);
    scene.style.setProperty('--ciel2', a.ciel[1]);
    scene.style.setProperty('--ciel3', a.ciel[2]);
    if (!ou) scene.classList.add('is-arrivee');

    var cv = el('canvas', 'ody-canvas');
    cv.width = 480; cv.height = 316;
    scene.appendChild(cv);

    var hud = el('div', 'ody-hud');
    var hudNom = el('span', 'ody-hud-nom', a.nom + '  ·  ' + a.code);
    var hudTxt = el('span', 'ody-hud-txt', '');
    hud.appendChild(hudNom);
    hud.appendChild(hudTxt);
    scene.appendChild(hud);

    var stick = el('div', 'pe-stick');
    var pomme = el('div', 'pe-pomme');
    stick.appendChild(pomme);
    scene.appendChild(stick);

    var action = el('button', 'ody-action');
    action.type = 'button';
    action.hidden = true;
    scene.appendChild(action);

    var retour = el('a', 'ody-retour', 'TÉLÉPORTAIL');
    retour.href = '#teleportail';
    scene.appendChild(retour);

    var panneau = el('div', 'ody-panneau');
    panneau.hidden = true;
    scene.appendChild(panneau);

    jeu.appendChild(scene);

    var g = construireCarte(a);
    var lieu = placeCuriosite(g);
    var cur = V.curiosite(a.id);

    reprise = { astre: a.id, x: ou ? ou.x : DEPART.x, y: ou ? ou.y : DEPART.y,
                dir: ou ? ou.dir : 0 };

    // --- Les habitants ---
    // Trois especes, quelques individus chacune, qui derivent autour d'un
    // point d'attache. Scanner n'en fait pas disparaitre : on peut
    // rescanner, seul le premier compte pour le carnet.
    var betes = [];
    var libres = accessibles(g);
    V.vies(a.id).forEach(function (v, k) {
      var n = v.rarete === 'rare' ? 1 : 3;
      for (var i = 0; i < n; i++) {
        var bx = 0, by = 0, essais = 0;
        do {
          bx = 3 + Math.floor(M.bruit(k * 7 + i, 11, a.rang + essais) * (MW - 6));
          by = 3 + Math.floor(M.bruit(k * 7 + i, 23, a.rang + essais) * (MH - 6));
          essais++;
        } while (!libres[bx + ',' + by] && essais < 200);
        betes.push({
          v: v, x: (bx + 0.5) * TS, y: (by + 0.5) * TS,
          ax: (bx + 0.5) * TS, ay: (by + 0.5) * TS,
          ph: Math.random() * 6.3
        });
      }
    });

    var balade = null;
    var cible = null;              // ce qu'on a devant soi
    var scan = null;               // le scan en cours
    var etat = 'libre';
    var minuteurs = [];
    function plusTard(fn, ms) { var t = setTimeout(fn, ms); minuteurs.push(t); return t; }
    function vivant() { return document.body.contains(scene); }

    function dire(txt) { if (hudTxt.textContent !== txt) hudTxt.textContent = txt; }

    // La chose la plus proche, a portee de scanner.
    function chercherCible() {
      var cx = balade.chef.x, cy = balade.chef.y;
      var mieux = null, d2 = 46 * 46;
      betes.forEach(function (b) {
        var dx = b.x - cx, dy = b.y - cy;
        var d = dx * dx + dy * dy;
        if (d < d2) { d2 = d; mieux = { type: 'vie', sujet: b.v, ref: b }; }
      });
      if (cur) {
        var lx = (lieu.x + 0.5) * TS, ly = (lieu.y + 0.5) * TS;
        var dx2 = lx - cx, dy2 = ly - cy;
        if (dx2 * dx2 + dy2 * dy2 < d2) {
          mieux = { type: 'lieu', sujet: cur, ref: { x: lx, y: ly } };
        }
      }
      return mieux;
    }

    function majAction() {
      if (etat !== 'libre' || !cible) {
        action.hidden = true;
        action.textContent = '';
        return;
      }
      action.hidden = false;
      var deja = DP.aScanne(cible.sujet.id);
      action.textContent = deja ? 'RESCANNER' : 'SCANNER';
      action.dataset.deja = deja ? '1' : '0';
    }

    function lancerScan() {
      if (etat !== 'libre' || !cible) return;
      etat = 'scan';
      var sujet = cible.sujet, ref = cible.ref;
      scan = { t0: performance.now(), x: ref.x, y: ref.y, sujet: sujet };
      scene.classList.add('is-scan');
      dire('Analyse en cours…');
      majAction();
      plusTard(function () {
        if (!vivant()) return;
        scene.classList.remove('is-scan');
        scan = null;
        var r = DP.noterScan(sujet.id, a.id);
        etat = 'fiche';
        montrerFiche(sujet, r.neuf, r.entree);
      }, reduit ? 200 : 1500);
    }

    function montrerFiche(sujet, neuf, entree) {
      panneau.hidden = false;
      panneau.textContent = '';
      var carte = el('div', 'ody-fiche' + (neuf ? ' is-neuf' : ''));
      carte.dataset.sujet = sujet.id;

      carte.appendChild(el('p', 'ody-fiche-titre',
        neuf ? 'NOUVELLE ENTRÉE' : 'DÉJÀ AU CARNET'));
      var im = el('img', 'ody-fiche-img');
      im.src = V.url(sujet.id);
      im.alt = '';
      carte.appendChild(im);
      carte.appendChild(el('p', 'ody-fiche-nom', sujet.nom));
      var det = el('p', 'ody-fiche-det');
      det.appendChild(el('span', 'ody-fiche-astre', a.nom));
      det.appendChild(el('span', null, sujet.forme ? 'Curiosité' : 'Forme de vie'));
      if (entree && entree.n > 1) det.appendChild(el('span', null, '×' + entree.n));
      carte.appendChild(det);
      carte.appendChild(el('p', 'ody-fiche-txt', sujet.texte));

      var b = el('button', 'ody-btn', 'Continuer');
      b.type = 'button';
      b.addEventListener('click', fermerFiche);
      carte.appendChild(b);
      panneau.appendChild(carte);
      b.focus();
    }

    function fermerFiche() {
      panneau.hidden = true;
      panneau.textContent = '';
      etat = 'libre';
      majAction();
    }

    action.addEventListener('click', lancerScan);

    var auClavier = function (e) {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (etat === 'fiche') return fermerFiche();
      lancerScan();
    };
    window.addEventListener('keydown', auClavier);

    // --- Le decor mouvant ---
    function dessinerVies(ctx, cam, t) {
      // La curiosite, plantee.
      if (cur) {
        var f = V.feuille(cur.id);
        if (f) {
          var lx = (lieu.x + 0.5) * TS - cam.x;
          var ly = (lieu.y + 1) * TS - cam.y;
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(f.canvas, Math.round(lx - f.L * 1.1), Math.round(ly - f.H * 2.2),
                        f.L * 2.2, f.H * 2.2);
          ctx.restore();
        }
      }

      betes.forEach(function (b) {
        var fb = V.feuille(b.v.id);
        if (!fb) return;
        var e = b.v.taille;
        var bx = b.x - cam.x, by = b.y - cam.y;
        if (bx < -60 || bx > 540 || by < -60 || by > 380) return;
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(bx, by + 6, 12 * e, 4 * e, 0, 0, 6.3);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(fb.canvas,
          Math.round(bx - fb.L * e / 2),
          Math.round(by - fb.H * e + 6), fb.L * e, fb.H * e);
        ctx.restore();
      });

      // Le faisceau du scanner.
      if (scan) {
        var k = Math.min(1, (t - scan.t0) / 1500);
        var sx = scan.x - cam.x, sy = scan.y - cam.y;
        ctx.strokeStyle = 'rgba(124,240,200,.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 10 + k * 26, -1.57, -1.57 + k * 6.283);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(124,240,200,' + (0.5 * (1 - k)).toFixed(2) + ')';
        ctx.beginPath();
        ctx.moveTo(balade.chef.x - cam.x, balade.chef.y - cam.y - 16);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        for (var i = 0; i < 4; i++) {
          var ph = (k * 2 + i / 4) % 1;
          ctx.fillStyle = 'rgba(216,255,240,' + (0.9 * (1 - ph)).toFixed(2) + ')';
          ctx.fillRect(Math.round(sx - 1), Math.round(sy + 18 - ph * 40), 2, 3);
        }
      }
    }

    balade = M.Balade({
      grille: g,
      canvas: cv,
      stick: stick, pomme: pomme,
      opts: { palette: a.palette },
      depart: ou ? { x: ou.x, y: ou.y } : DEPART,
      direction: ou ? ou.dir : undefined,
      // Le voyageur : le premier Dinder de la collection, ou le docteur
      // Islas a defaut — c'est lui qui aurait su quoi faire d'une comete.
      troupe: [voyageur()],
      vitesse: 88,
      vivant: vivant,
      fige: function () { return etat !== 'libre'; },
      apres: dessinerVies,

      chaqueImage: function (t) {
        // Les betes derivent autour de leur point d'attache.
        if (!reduit) {
          betes.forEach(function (b, i) {
            b.x = b.ax + Math.sin(t / (1400 + i * 90) + b.ph) * 26;
            b.y = b.ay + Math.cos(t / (1700 + i * 70) + b.ph) * 18;
          });
        }
        if (reprise) {
          reprise.x = balade.chef.x;
          reprise.y = balade.chef.y;
          reprise.dir = balade.chef.dir;
        }
        if (etat !== 'libre') return;
        cible = chercherCible();
        majAction();
        dire(cible
          ? (DP.aScanne(cible.sujet.id) ? cible.sujet.nom + ' — déjà au carnet.'
                                        : 'Quelque chose à portée de scanner.')
          : a.sous);
      }
    });

    var veille = setInterval(function () {
      if (vivant()) return;
      clearInterval(veille);
      window.removeEventListener('keydown', auClavier);
      minuteurs.forEach(clearTimeout);
      balade.arreter();
    }, 400);
  }

  // ==========================================================
  //  Le carnet du scanner
  // ==========================================================

  function viewCarnet(view) {
    var box = el('div', 'ody ody--carnet');

    var scans = DP.scans();
    var total = V.tout().length;
    var faits = V.tout().filter(function (s) { return scans[s.id]; }).length;

    var tete = el('div', 'ody-tete');
    tete.appendChild(el('h2', 'ody-titre', 'Carnet du scanner'));
    tete.appendChild(el('p', 'ody-compte', faits + ' / ' + total + ' entrées'));
    box.appendChild(tete);

    var grille = el('div', 'ody-grille');

    V.ASTRES.forEach(function (a) {
      var vu = DP.aVuAstre(a.id);
      var sujets = V.scannables(a.id);
      var n = sujets.filter(function (s) { return scans[s.id]; }).length;

      var titre = el('p', 'ody-section');
      titre.dataset.astre = a.id;
      titre.style.setProperty('--r', a.ciel[1]);
      titre.appendChild(el('span', 'ody-section-nom', vu ? a.nom : '? ? ?'));
      titre.appendChild(el('span', 'ody-section-n',
        vu ? n + ' / ' + sujets.length : 'monde inconnu'));
      grille.appendChild(titre);

      sujets.forEach(function (s) {
        var e = scans[s.id];
        var c = el('div', 'ody-case');
        c.dataset.sujet = s.id;
        c.classList.toggle('is-vide', !e);
        c.style.setProperty('--r', a.ciel[1]);
        if (e) {
          var im = el('img', 'ody-case-img');
          im.src = V.url(s.id);
          im.alt = '';
          c.appendChild(im);
          c.appendChild(el('span', 'ody-case-nom', s.nom));
          c.appendChild(el('span', 'ody-case-det',
            s.forme ? 'Curiosité' : 'Forme de vie'));
          if (e.n > 1) c.appendChild(el('span', 'ody-case-n', '×' + e.n));
          c.title = s.texte;
        } else {
          c.appendChild(el('span', 'ody-case-vide', '?'));
          c.appendChild(el('span', 'ody-case-nom', '???'));
          c.appendChild(el('span', 'ody-case-det',
            vu ? 'jamais scanné' : 'monde inconnu'));
        }
        grille.appendChild(c);
      });
    });

    box.appendChild(grille);

    var pied = el('div', 'ody-pied');
    var tp = el('a', 'ody-btn', 'Téléportail');
    tp.href = '#teleportail';
    pied.appendChild(tp);
    var items = el('a', 'ody-btn ody-btn--plat', 'Items');
    items.href = '#items';
    pied.appendChild(items);
    box.appendChild(pied);

    view.appendChild(box);
  }

  // ==========================================================
  //  Branchement
  // ==========================================================

  window.MINIJEUX = window.MINIJEUX || [];
  var place = window.MINIJEUX.findIndex
    ? window.MINIJEUX.findIndex(function (j) { return j.id === 'libre-3'; })
    : -1;
  var entree = {
    id: 'odyssee', nom: 'The Odyssey of Dinder',
    sous: 'Huit mondes à retrouver', vue: 'odyssee', pret: true,
    // Faute de jaquette, la vignette est la telecommande elle-meme.
    img: function () { return visuel(); }
  };
  if (place !== -1) window.MINIJEUX[place] = entree;
  else window.MINIJEUX.push(entree);

  window.VIEWS['odyssee'] = {
    title: 'The Odyssey of Dinder',
    render: function (view, arg) {
      // "#odyssee/mars" pose directement sur le monde ; sans argument,
      // on reprend la partie en cours, ou l'on ouvre le chapitre premier.
      if (arg && DP.aLaTelecommande()) {
        var jeu = el('div', 'ody-hote');
        view.appendChild(jeu);
        return ecranMonde(jeu, arg);
      }
      viewOdyssee(view);
    }
  };
  window.VIEWS['teleportail'] = { title: 'Téléportail', render: viewTeleportail };
  window.VIEWS['odyssee-carnet'] = { title: 'Carnet du scanner', render: viewCarnet };

  window.ODYSSEE = {
    visuel: visuel, compteAstres: compteAstres,
    construireCarte: construireCarte, placeCuriosite: placeCuriosite,
    accessibles: accessibles,
    MW: MW, MH: MH, DEPART: DEPART, TEMPS: TEMPS,
    reprise: function () { return reprise; },
    poserReprise: function (r) { reprise = r; }
  };
})();
