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
  var ECRANS = ['odyssee', 'teleportail', 'odyssee-carnet', 'armurerie'];

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

  function cernerTL(ctx, TL_L, TL_H) {
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
    cernerTL(x, TL_L, TL_H);
    cacheTL = { canvas: cv, L: TL_L, H: TL_H };
    return cacheTL;
  }

  function visuel() {
    var f = feuilleTL();
    return f ? f.canvas.toDataURL('image/png') : '';
  }

  // ==========================================================
  //  Le scanneur
  // ==========================================================
  // Un appareil a poignee, violet, coiffe d'une coupole radar dont
  // part un faisceau en eventail. Il sert de bouton SCANNER en jeu.

  var SC_L = 44, SC_H = 40;
  var cacheSC = null;

  function dessinerScanneur(p) {
    var corps = '#5b3f8c', clair = '#8d6fc4', ombre = '#34214f';
    var verre = '#6ff2ff', verre2 = '#e2fdff', lave = '#ff7a2e';

    // Le faisceau, en eventail vers le haut a droite.
    p(30, 1, 3, 2, verre2);
    p(34, 3, 4, 2, verre);
    p(38, 6, 4, 2, verre);
    p(27, 4, 3, 2, verre);
    p(32, 7, 3, 2, verre2);
    p(36, 10, 4, 2, verre);

    // La coupole radar.
    p(20, 8, 12, 3, clair);
    p(18, 11, 16, 5, corps);
    p(21, 9, 4, 2, verre2);
    p(23, 12, 6, 3, verre);
    p(24, 12, 2, 1, verre2);
    p(24, 16, 4, 3, ombre);

    // Le corps.
    p(8, 18, 30, 12, corps);
    p(8, 18, 30, 2, clair);
    p(8, 18, 2, 12, clair);
    p(36, 18, 2, 12, ombre);
    p(8, 28, 30, 2, ombre);

    // L'ecran, avec une onde.
    p(12, 21, 16, 6, '#0c1018');
    p(13, 24, 2, 1, verre);
    p(15, 23, 2, 1, verre);
    p(17, 22, 2, 1, verre2);
    p(19, 24, 2, 1, verre);
    p(21, 25, 2, 1, verre);
    p(23, 23, 2, 1, verre);
    p(25, 24, 2, 1, verre);

    // Le voyant et la gachette.
    p(31, 21, 3, 3, lave);
    p(31, 21, 1, 1, '#ffd2a8');
    p(31, 25, 3, 2, clair);

    // La poignee.
    p(12, 30, 9, 9, corps);
    p(12, 30, 2, 9, clair);
    p(19, 30, 2, 9, ombre);
    p(13, 33, 6, 1, ombre);
    p(13, 36, 6, 1, ombre);
  }

  function feuilleSC() {
    if (cacheSC) return cacheSC;
    var cv = document.createElement('canvas');
    cv.width = SC_L; cv.height = SC_H;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;
    dessinerScanneur(function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    });
    cernerTL(x, SC_L, SC_H);
    cacheSC = { canvas: cv, L: SC_L, H: SC_H };
    return cacheSC;
  }

  function visuelScanneur() {
    var f = feuilleSC();
    return f ? f.canvas.toDataURL('image/png') : '';
  }

  // Un bouton de la scene : une image a la place du libelle, le libelle
  // restant lisible pour les lecteurs d'ecran et au survol.
  function iconeBouton(noeud, src, libelle, cls) {
    noeud.textContent = '';
    noeud.setAttribute('aria-label', libelle);
    noeud.title = libelle;
    if (!src) { noeud.textContent = libelle; return; }
    var im = el('img', cls);
    im.alt = '';
    im.src = src;
    noeud.appendChild(im);
    return im;
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

  // Deux fois moins d'assaillants : sur chaque monde, une espece agressive
  // sur deux devient paisible (en alternant les paliers, pour garder des
  // faibles et des fortes). Les paisibles se defendent encore si on leur
  // tire dessus.
  (function apaiser() {
    V.ASTRES.forEach(function (a) {
      V.vies(a.id).filter(function (v) { return v.agressif; })
        .sort(function (x, y) { return (y.palier - x.palier) || (x.id < y.id ? -1 : 1); })
        .forEach(function (v, i) { if (i % 2) { v.agressif = false; v.apaise = true; } });
    });
  })();

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
    function chambre(t, eclat, debout) {
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
      // L'oreiller.
      ctx.fillStyle = '#e8eef7';
      ctx.fillRect(72, 156, 34, 22);
      ctx.fillStyle = '#c9d3e2';
      ctx.fillRect(72, 172, 34, 6);

      // Le dormeur : le Dinder du joueur, celui qu'il incarnera ensuite.
      // Comme dans les chambres des Pokemon : la tete droite sur
      // l'oreiller, le corps sous la couette, et un souffle lent. Quand la
      // comete illumine la piece, il se redresse d'un bond.
      var C = window.CHIBI, fe = C && C.feuille(voyageur()), f = fe && fe.canvas;
      var reveille = !!debout || eclat > 0.25;
      var s = 2.4;
      var hautCouette = reveille ? 170 : 160;
      if (f) {
        var dx = 74, dy;
        if (reveille) {
          var saut = Math.max(0, Math.sin(t / 55)) * 3;
          dy = hautCouette - 26 * s - saut;       // assis : on le voit jusqu'a la taille
        } else {
          dy = hautCouette - 19 * s + Math.sin(t / 700) * 1.2;  // la tete entiere depasse
        }
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.beginPath();
        ctx.rect(0, 0, IN_L, 182);
        ctx.clip();
        ctx.drawImage(f, 0, C.DIRS.bas * C.H, C.L, C.H, dx, dy, C.L * s, C.H * s);
        ctx.restore();
      }

      // La couette, par-dessus le corps. Elle glisse quand on se redresse.
      ctx.fillStyle = '#2f5fa8';
      ctx.fillRect(70, hautCouette, 198, 182 - hautCouette);
      ctx.fillStyle = '#3f79cf';
      ctx.fillRect(70, hautCouette, 198, 6);
      ctx.fillStyle = '#26508f';
      ctx.fillRect(70, hautCouette + 6, 198, 2);

      // Les Z du sommeil, qui montent et s'effacent ; un "!" au reveil.
      ctx.save();
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'left';
      if (!reveille) {
        for (var z = 0; z < 3; z++) {
          var kz = ((t / 1400) + z / 3) % 1;
          ctx.fillStyle = 'rgba(220,236,255,' + (1 - kz).toFixed(2) + ')';
          ctx.font = 'bold ' + Math.round(10 + kz * 10) + 'px "Courier New", monospace';
          ctx.fillText('z', 118 + kz * 34 + Math.sin(kz * 9) * 4, 132 - kz * 56);
        }
      } else {
        ctx.fillStyle = '#ffe36a';
        ctx.font = 'bold 26px "Courier New", monospace';
        ctx.fillText('!', 124, 104);
      }
      ctx.restore();

      if (eclat > 0) {
        ctx.fillStyle = 'rgba(255,250,236,' + (eclat * 0.85).toFixed(2) + ')';
        ctx.fillRect(0, 0, IN_L, IN_H);
      }
    }

    // La comete : une raie qui traverse la fenetre, puis l'impact.
    function comete(t) {
      var k = t / TEMPS[1].duree;
      var eclat = k < 0.55 ? 0 : Math.max(0, 1 - (k - 0.55) / 0.2);
      // Une fois reveille par l'impact, on le reste.
      chambre(t, eclat, k >= 0.55);
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
    var TOUCHES = ['S', 'M', 'V', 'T', 'J', 'U', 'N', 'L', '-',
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
      DP.astresVus().length + ' / ' + V.ASTRES.length + ' mondes  ·  ' + nScans + ' / ' +
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
    if (DP.aLArme()) {
      var arm = el('a', 'ody-btn ody-btn--plat', 'Armurerie  ·  ' + DP.roches() + ' ☀');
      arm.href = '#armurerie/odyssee';
      pied.appendChild(arm);
    }
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

  // Le repaire du gardien : le plus loin possible du point d'arrivee (en
  // chemin a parcourir), dans un endroit degage, et pas sur la curiosite.
  function placeRepaire(g, lieu) {
    var vu = accessibles(g);
    var dist = {}, file = [[20, 22]], k;
    dist['20,22'] = 0;
    while (file.length) {
      var c = file.shift();
      for (k = 0; k < 4; k++) {
        var nx = c[0] + [1, -1, 0, 0][k], ny = c[1] + [0, 0, 1, -1][k], cle = nx + ',' + ny;
        if (!vu[cle] || dist[cle] !== undefined) continue;
        dist[cle] = dist[c[0] + ',' + c[1]] + 1;
        file.push([nx, ny]);
      }
    }
    var mieux = null, loin = -1;
    for (var y = 3; y < MH - 3; y++) {
      for (var x = 3; x < MW - 3; x++) {
        var d = dist[x + ',' + y];
        if (d === undefined || d <= loin) continue;
        var degage = true;
        for (var dy = -1; dy <= 1 && degage; dy++) {
          for (var dx = -1; dx <= 1; dx++) if (!vu[(x + dx) + ',' + (y + dy)]) { degage = false; break; }
        }
        if (!degage) continue;
        if (lieu && Math.abs(x - lieu.x) + Math.abs(y - lieu.y) < 6) continue;
        loin = d; mieux = { tx: x, ty: y };
      }
    }
    mieux = mieux || { tx: 20, ty: 10 };
    mieux.x = mieux.tx + 0.5; mieux.y = mieux.ty + 0.5;
    mieux.px = mieux.x * TS; mieux.py = mieux.y * TS;
    return mieux;
  }

  // ==========================================================
  //  La Lune : une carte a part
  // ==========================================================
  // Pas de nappes ni de hasard : une base spatiale pres du point
  // d'arrivee, des crateres, et au nord une falaise percee d'une grotte
  // immense. C'est de la que sort le Selenophage.

  var BASE = { x0: 4, x1: 14, y0: 15, y1: 24 };
  var GROTTE = { x: 19.5, y: 4.2, lx: 5.2, ly: 3.1 };      // en cases
  var DEVANT_GROTTE = { x: 19.5, y: 8.2 };

  function construireLune() {
    var g = [], x, y;
    var bruit = M.bruit;
    for (y = 0; y < MH; y++) {
      g.push([]);
      for (x = 0; x < MW; x++) {
        g[y].push(bruit(x, y, 91) < 0.18 ? T.SOL_B : T.SOL);
      }
    }
    // Les bords, et la falaise du nord.
    for (y = 0; y < MH; y++) {
      for (x = 0; x < MW; x++) {
        if (x < 2 || x >= MW - 2 || y >= MH - 2 || y < 7) g[y][x] = T.ROCHE_A;
      }
    }
    // Les crateres : un anneau de gravats autour d'un creux d'ombre.
    [[29, 14, 3], [33, 22, 2], [24, 11, 2], [9, 10, 2]].forEach(function (c) {
      for (y = c[1] - c[2] - 1; y <= c[1] + c[2] + 1; y++) {
        for (x = c[0] - c[2] - 1; x <= c[0] + c[2] + 1; x++) {
          var d = Math.hypot(x - c[0], y - c[1]);
          if (d <= c[2] - 0.5) g[y][x] = T.LIQUIDE;
          else if (d <= c[2] + 1) g[y][x] = T.GRAVATS;
        }
      }
    });
    // Quelques rochers, loin de la base et du parvis de la grotte.
    for (y = 8; y < MH - 2; y++) {
      for (x = 2; x < MW - 2; x++) {
        if (g[y][x] !== T.SOL && g[y][x] !== T.SOL_B) continue;
        if (x >= BASE.x0 - 1 && x <= BASE.x1 + 1 && y >= BASE.y0 - 1 && y <= BASE.y1 + 1) continue;
        if (Math.abs(x - DEVANT_GROTTE.x) < 5 && y < 12) continue;
        if (bruit(x, y, 93) < 0.05) g[y][x] = T.ROCHE_A;
        else if (bruit(x, y, 94) < 0.02) g[y][x] = T.CRISTAL;
      }
    }
    // La base : des murs de modules, un sol nu, deux portes.
    for (y = BASE.y0; y <= BASE.y1; y++) {
      for (x = BASE.x0; x <= BASE.x1; x++) {
        var bord = y === BASE.y0 || y === BASE.y1 || x === BASE.x0 || x === BASE.x1;
        g[y][x] = bord ? T.STRUCTURE : T.SOL;
      }
    }
    g[BASE.y0][9] = T.SOL; g[BASE.y0][10] = T.SOL;               // la porte nord
    g[19][BASE.x1] = T.SOL; g[20][BASE.x1] = T.SOL;               // la porte est
    // Le point d'arrivee, degage.
    for (y = 18; y <= 26; y++) {
      for (x = 16; x <= 24; x++) {
        if (Math.abs(x - 20) + Math.abs(y - 22) <= 4 && y < MH - 2) g[y][x] = T.SOL;
      }
    }
    // Le parvis de la grotte : du sol nu jusqu'a la falaise.
    for (y = 7; y <= 10; y++) {
      for (x = 16; x <= 23; x++) g[y][x] = T.SOL;
    }
    relier(g);
    return g;
  }

  // La ou poser les objets de la base, dans l'enceinte.
  var PLACES_BASE = {
    'module-habitation': [6, 17], 'sas-base': [10, 16], 'reacteur': [12, 22],
    'serre-base': [6, 22], 'antenne-relais': [12, 18]
  };

  // ==========================================================
  //  L'ecran d'un monde
  // ==========================================================

  var PV_MAX = 100;

  function ecranMonde(jeu, idAstre, ou) {
    var a = V.astre(idAstre);
    if (!a) { location.hash = '#teleportail'; return; }

    jeu.textContent = '';
    DP.noterAstre(a.id);
    var lune = a.id === 'lune';

    var scene = el('div', 'ody-scene');
    scene.dataset.astre = a.id;
    scene.style.setProperty('--ciel1', a.ciel[0]);
    scene.style.setProperty('--ciel2', a.ciel[1]);
    scene.style.setProperty('--ciel3', a.ciel[2]);
    if (!ou) scene.classList.add('is-arrivee');

    var cv = el('canvas', 'ody-canvas');
    cv.width = 480; cv.height = 316;
    scene.appendChild(cv);

    // Le bandeau : le monde, l'etat du voyageur, ce qu'on a devant soi.
    var hud = el('div', 'ody-hud');
    var hudG = el('div', 'ody-hud-g');
    hudG.appendChild(el('span', 'ody-hud-nom', a.nom + '  ·  ' + a.code));
    var jauge = el('div', 'ody-pv');
    var jaugePlein = el('div', 'ody-pv-plein');
    var jaugeTxt = el('span', 'ody-pv-txt');
    jauge.appendChild(jaugePlein);
    jauge.appendChild(jaugeTxt);
    hudG.appendChild(jauge);
    hud.appendChild(hudG);
    var hudTxt = el('span', 'ody-hud-txt', '');
    hud.appendChild(hudTxt);
    scene.appendChild(hud);

    var stick = el('div', 'pe-stick');
    var pomme = el('div', 'pe-pomme');
    stick.appendChild(pomme);
    scene.appendChild(stick);

    var boutons = el('div', 'ody-boutons');
    var tir = el('button', 'ody-tir');
    tir.type = 'button';
    tir.hidden = true;
    iconeBouton(tir, window.ARME ? window.ARME.url(null, DP.armeNiveau('odyssee')) : '', 'Tirer', 'ody-tir-img');
    boutons.appendChild(tir);
    var action = el('button', 'ody-action');
    action.type = 'button';
    action.hidden = true;
    iconeBouton(action, visuelScanneur(), 'Scanner', 'ody-action-img');
    boutons.appendChild(action);
    scene.appendChild(boutons);

    var retour = el('a', 'ody-retour');
    retour.href = '#teleportail';
    retour.setAttribute('aria-label', 'Téléportail');
    retour.title = 'Téléportail';
    retour.appendChild(imageTelecommande('ody-retour-img'));
    scene.appendChild(retour);

    var panneau = el('div', 'ody-panneau');
    panneau.hidden = true;
    scene.appendChild(panneau);

    jeu.appendChild(scene);

    var g = lune ? construireLune() : construireCarte(a);
    var libres = accessibles(g);
    var cur = V.curiosite(a.id);
    var lieu = lune ? { x: Math.floor(GROTTE.x), y: Math.floor(DEVANT_GROTTE.y) - 1 }
                    : placeCuriosite(g);
    // Le gardien du monde, et son repaire. Sur la Lune, c'est la grotte.
    var BO = window.BOSS, defG = V.monstre ? V.monstre(a.id) : null;
    var gardien = BO && defG ? BO.GARDIENS[defG.id] : null;
    var repaire = !gardien ? null
      : lune ? { x: GROTTE.x, y: GROTTE.y + 0.6, px: DEVANT_GROTTE.x * TS, py: DEVANT_GROTTE.y * TS }
      : placeRepaire(g, lieu);
    var bossBattu = function () { return !gardien || BO.vaincu(gardien.id); };
    function presDuRepaire(r) {
      return !!repaire && Math.hypot(balade.chef.x - repaire.px, balade.chef.y - repaire.py) < r;
    }

    reprise = { astre: a.id, x: ou ? ou.x : DEPART.x, y: ou ? ou.y : DEPART.y,
                dir: ou ? ou.dir : 0 };

    // --- Le voyageur ---
    var pv = PV_MAX, dernierCoupRecu = -99999;

    // --- Les habitants ---
    // Un individu par espece, deux pour les plus communes. Les agressives
    // foncent sur le voyageur quand il passe a portee ; les autres errent
    // autour de leur point d'attache, et fuient si on leur tire dessus.
    function caseLibreAuHasard(graine, loinDuDepart) {
      for (var essai = 0; essai < 300; essai++) {
        var bx = 3 + Math.floor(M.bruit(graine, essai, a.rang * 13 + 7) * (MW - 6));
        var by = 3 + Math.floor(M.bruit(graine, essai + 500, a.rang * 13 + 8) * (MH - 6));
        if (!libres[bx + ',' + by]) continue;
        if (Math.abs(bx - 20) + Math.abs(by - 22) < (loinDuDepart || 0)) continue;
        return [bx, by];
      }
      return [20, 18];
    }

    var betes = [];
    V.vies(a.id).forEach(function (v, k) {
      var n = v.palier <= 1 ? 2 : 1;
      for (var i = 0; i < n; i++) {
        // Les agressives naissent a distance : on ne se fait pas mordre en
        // posant le pied sur un monde.
        var c = caseLibreAuHasard(k * 11 + i, v.agressif ? 9 : 3);
        var f = V.force(v);
        betes.push({
          v: v, f: f, x: (c[0] + 0.5) * TS, y: (c[1] + 0.5) * TS,
          ax: (c[0] + 0.5) * TS, ay: (c[1] + 0.5) * TS,
          ph: M.bruit(k, i, 3) * 6.3, pv: f.pv, pvMax: f.pv,
          agressif: v.agressif, fuite: 0, coup: -99999, touche: -99999,
          mort: false, mortT: 0
        });
      }
    });

    // --- Les objets ---
    var choses = V.objets(a.id).map(function (o, k) {
      var c = lune && PLACES_BASE[o.id] ? PLACES_BASE[o.id] : caseLibreAuHasard(300 + k * 17, 4);
      return { o: o, x: (c[0] + 0.5) * TS, y: (c[1] + 0.5) * TS };
    });

    var balade = null;
    var cible = null, cibleTir = null;
    var scan = null, tirs = [], chiffres = [];
    var surgi = null;                  // le monstre qui sort de sa grotte
    var duel = null;
    var dernierTir = -99999;
    var etat = 'libre';                // libre | scan | fiche | boss | ko
    var minuteurs = [];
    var derniere = 0;
    function plusTard(fn, ms) { var t = setTimeout(fn, ms); minuteurs.push(t); return t; }
    function vivant() { return document.body.contains(scene); }
    function maintenant() { return performance.now(); }

    function dire(txt) { if (hudTxt.textContent !== txt) hudTxt.textContent = txt; }

    function majJauge() {
      var k = pv / PV_MAX;
      jaugePlein.style.width = (k * 100).toFixed(1) + '%';
      jaugePlein.dataset.bas = k < 0.3 ? '1' : '0';
      jaugeTxt.textContent = Math.ceil(pv) + ' / ' + PV_MAX;
    }

    function tuileLibre(px, py) {
      var t = balade.tuile(Math.floor(px / TS), Math.floor(py / TS));
      return t !== undefined && !M.BLOQUANT[t];
    }

    function distance(b) {
      return Math.hypot(b.x - balade.chef.x, b.y - balade.chef.y);
    }

    // --- Le scanner ---
    function chercherCible() {
      var mieux = null, d2 = 46;
      betes.forEach(function (b) {
        if (b.mort) return;
        var d = distance(b);
        if (d < d2) { d2 = d; mieux = { sujet: b.v, ref: b }; }
      });
      choses.forEach(function (c) {
        var d = Math.hypot(c.x - balade.chef.x, c.y - balade.chef.y);
        if (d < d2) { d2 = d; mieux = { sujet: c.o, ref: c }; }
      });
      if (cur && (!lune || bossBattu())) {
        var lx = (lieu.x + 0.5) * TS, ly = (lieu.y + 0.5) * TS;
        var d3 = Math.hypot(lx - balade.chef.x, ly - balade.chef.y);
        if (d3 < d2 + (lune ? 30 : 0)) mieux = { sujet: cur, ref: { x: lx, y: ly } };
      }
      return mieux;
    }

    // --- La cible du pistolet : la plus menacante a portee ---
    function chercherCibleTir() {
      if (!DP.aLArme()) return null;
      var mieux = null, score = Infinity;
      betes.forEach(function (b) {
        if (b.mort) return;
        var d = distance(b);
        if (d > 170) return;
        var s = d - (b.agressif ? 80 : 0);
        if (s < score) { score = s; mieux = b; }
      });
      return mieux;
    }

    function majBoutons() {
      var libre = etat === 'libre';
      action.hidden = !libre || !cible;
      if (!action.hidden) {
        var deja = DP.aScanne(cible.sujet.id);
        var lib = deja ? 'Rescanner' : 'Scanner';
        action.setAttribute('aria-label', lib);
        action.title = lib;
        action.dataset.deja = deja ? '1' : '0';
      }
      tir.hidden = !(libre || etat === 'scan') || !cibleTir;
      if (!tir.hidden) {
        var A = window.ARME;
        var pret = maintenant() - dernierTir >= (A ? A.niveauJeu('odyssee').cadence : 620);
        tir.classList.toggle('is-recharge', !pret);
      }
    }

    function lancerScan() {
      if (etat !== 'libre' || !cible) return;
      etat = 'scan';
      var sujet = cible.sujet, ref = cible.ref;
      scan = { t0: maintenant(), x: ref.x, y: ref.y, sujet: sujet };
      scene.classList.add('is-scan');
      dire('Analyse en cours…');
      majBoutons();
      plusTard(function () {
        if (!vivant() || etat !== 'scan') return;
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
      carte.appendChild(el('p', 'ody-fiche-titre', neuf ? 'NOUVELLE ENTRÉE' : 'DÉJÀ AU CARNET'));
      var im = el('img', 'ody-fiche-img');
      im.src = V.url(sujet.id);
      im.alt = '';
      carte.appendChild(im);
      carte.appendChild(el('p', 'ody-fiche-nom', sujet.nom));
      var det = el('p', 'ody-fiche-det');
      det.appendChild(el('span', 'ody-fiche-astre', a.nom));
      det.appendChild(el('span', null, genre(sujet)));
      if (sujet.palier && !sujet.forme) {
        det.appendChild(el('span', 'ody-fiche-palier' + (sujet.agressif ? ' is-agressif' : ''),
          'Palier ' + sujet.palier + (sujet.agressif ? ' · agressif' : '')));
      }
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
      majBoutons();
    }

    // --- Le pistolet ---
    function tirer() {
      // Le bouton est cache sans l'arme, mais le clavier, lui, ne l'est
      // pas : c'est donc ici que se tranche la question.
      if (!DP.aLArme()) return;
      if (!(etat === 'libre' || etat === 'scan') || !cibleTir) return;
      var A = window.ARME;
      var nv = A ? A.niveauJeu('odyssee') : { degats: 6, cadence: 620 };
      var t = maintenant();
      if (t - dernierTir < nv.cadence) return;
      dernierTir = t;
      var b = cibleTir;
      tirs.push({ t0: t, x: b.x, y: b.y - 10 });
      b.pv = Math.max(0, b.pv - nv.degats);
      b.touche = t;
      chiffres.push({ t0: t, x: b.x, y: b.y - 26, txt: '-' + nv.degats });

      // Une bete qu'on blesse ne reste pas indifferente : les plus fortes
      // se retournent, les plus faibles detalent.
      if (!b.agressif) {
        if (b.v.palier >= 2) b.agressif = true;
        else b.fuite = t + 2600;
      }

      if (b.pv <= 0) abattre(b, t);
      majBoutons();
    }

    function abattre(b, t) {
      b.mort = true; b.mortT = t;
      // Dans l'Odyssee, les betes laissent des Roches Solaires : c'est la
      // monnaie de l'armurerie d'ici.
      DP.gagnerRoches(b.f.noyaux);
      DP.noterAbattu(b.v.id);
      chiffres.push({ t0: t, x: b.x, y: b.y - 40, txt: '+' + b.f.noyaux + ' ☀', noyau: true });
      dire(b.v.nom + ' abattu.');
      var A = window.ARME;
      if (A && A.recompenseOdyssee) {
        A.recompenseOdyssee(b.v.id).forEach(function (r, i) {
          setTimeout(function () { annoncerRevetement(r); }, 500 + i * 3400);
        });
      }
    }

    // Un revetement gagne : le pistolet repeint arrive en tournoyant,
    // un eclat le traverse, puis le bandeau s'efface tout seul.
    function annoncerRevetement(r) {
      if (!scene.isConnected) return;
      var A = window.ARME;
      var carte = el('div', 'ody-trophee');
      carte.style.setProperty('--r', r.c[2]);
      carte.appendChild(el('span', 'ody-trophee-titre', 'Nouveau revêtement'));
      var cadre = el('span', 'ody-trophee-cadre');
      var im = el('img', 'ody-trophee-img');
      im.alt = '';
      im.src = A.url(r.id, DP.armeNiveau('odyssee'));
      cadre.appendChild(im);
      cadre.appendChild(el('span', 'ody-trophee-eclat'));
      carte.appendChild(cadre);
      carte.appendChild(el('span', 'ody-trophee-nom', r.nom));
      carte.appendChild(el('span', 'ody-trophee-det', 'À équiper dans l’armurerie · valable partout'));
      scene.appendChild(carte);
      setTimeout(function () { carte.classList.add('is-sortie'); }, 2700);
      setTimeout(function () { carte.remove(); }, 3300);
    }

    // --- Les coups recus ---
    function encaisser(b, t) {
      pv = Math.max(0, pv - b.f.degats);
      dernierCoupRecu = t;
      b.coup = t;
      chiffres.push({ t0: t, x: balade.chef.x, y: balade.chef.y - 30, txt: '-' + b.f.degats, moi: true });
      scene.classList.remove('is-touche');
      void scene.offsetWidth;
      scene.classList.add('is-touche');
      majJauge();
      if (pv <= 0) ko();
    }

    function ko() {
      if (etat === 'ko') return;
      etat = 'ko';
      scan = null;
      scene.classList.remove('is-scan');
      majBoutons();
      panneau.hidden = false;
      panneau.textContent = '';
      var carte = el('div', 'ody-fiche ody-fiche--ko');
      carte.appendChild(el('p', 'ody-fiche-titre', 'RAPATRIEMENT D’URGENCE'));
      carte.appendChild(imageTelecommande('ody-fiche-img'));
      carte.appendChild(el('p', 'ody-fiche-txt',
        'Le Téléportail a détecté que tu ne tenais plus debout, et il t’a ramené. ' +
        'Rien de ce que tu as scanné n’est perdu.'));
      var b = el('button', 'ody-btn', 'Retour au Téléportail');
      b.type = 'button';
      b.addEventListener('click', function () {
        reprise = null;
        location.hash = '#teleportail';
      });
      carte.appendChild(b);
      panneau.appendChild(carte);
      b.focus();
    }

    // --- Le monstre de la grotte ---
    var SURGIT_DUREE = 2200;

    function reveillerMonstre() {
      etat = 'boss';
      majBoutons();
      surgi = { t0: maintenant() };
      dire(gardien.textes.reveil || 'Le sol tremble…');
      scene.classList.add('is-secousse');
      plusTard(function () {
        if (!vivant() || etat !== 'boss') return;
        scene.classList.remove('is-secousse');
        surgi = null;
        var B = window.BOSS;
        if (!B) { etat = 'libre'; return; }
        duel = B.Duel({
          gardien: gardien.id,
          parent: scene,
          pvJoueur: pv, pvMax: PV_MAX,
          surFin: function (r) { pv = r.pvJoueur; majJauge(); },
          surSortie: function (r) {
            duel = null;
            pv = r.pvJoueur;
            majJauge();
            if (r.vaincu) {
              etat = 'libre';
              dire(lune ? 'La grotte est silencieuse.' : 'Le repaire est silencieux.');
              majBoutons();
            } else {
              pv = 0;
              ko();
            }
          }
        });
      }, reduit ? 100 : SURGIT_DUREE);
    }

    action.addEventListener('click', lancerScan);
    tir.addEventListener('click', tirer);

    var auClavier = function (e) {
      if (e.key === 'f' || e.key === 'F' || e.key === 'x' || e.key === 'X') {
        if (etat === 'boss') return;
        e.preventDefault();
        return tirer();
      }
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if (etat === 'boss' || etat === 'ko') return;
      e.preventDefault();
      if (etat === 'fiche') return fermerFiche();
      lancerScan();
    };
    window.addEventListener('keydown', auClavier);

    // --- La vie des betes, a chaque image ---
    function animer(t) {
      var dt = derniere ? Math.min(0.05, (t - derniere) / 1000) : 0;
      derniere = t;
      var chefX = balade.chef.x, chefY = balade.chef.y;
      var chassent = (etat === 'libre' || etat === 'scan') && pv > 0;

      betes.forEach(function (b, i) {
        if (b.mort) return;
        var dx = chefX - b.x, dy = chefY - b.y;
        var d = Math.hypot(dx, dy) || 1;
        var vx = 0, vy = 0, vit = 0;

        if (b.fuite > t) {
          vx = -dx / d; vy = -dy / d; vit = b.f.vitesse * 1.3;
        } else if (b.agressif && chassent && d < 135) {
          if (d > 16) { vx = dx / d; vy = dy / d; vit = b.f.vitesse; }
          else if (t - b.coup > 1150) encaisser(b, t);
        } else if (!reduit) {
          // L'errance : un point qui tourne lentement autour de l'attache.
          var tx = b.ax + Math.sin(t / (1500 + i * 70) + b.ph) * 30;
          var ty = b.ay + Math.cos(t / (1800 + i * 50) + b.ph) * 20;
          var ex = tx - b.x, ey = ty - b.y, de = Math.hypot(ex, ey);
          if (de > 1) { vx = ex / de; vy = ey / de; vit = Math.min(22, de * 2); }
        }

        if (vit) {
          var nx = b.x + vx * vit * dt, ny = b.y + vy * vit * dt;
          if (tuileLibre(nx, b.y)) b.x = nx;
          if (tuileLibre(b.x, ny)) b.y = ny;
        }
      });

      // On se refait une sante quand plus rien ne mord depuis un moment.
      if (pv > 0 && pv < PV_MAX && t - dernierCoupRecu > 4000 && etat !== 'boss') {
        pv = Math.min(PV_MAX, pv + 4 * dt);
        majJauge();
      }
    }

    // --- Ce qu'on peint avec le decor, a sa profondeur ---
    function extras(t) {
      var out = [];

      choses.forEach(function (c) {
        out.push({
          x: c.x, y: c.y + 6,
          dessin: function (ctx, sx, sy) {
            var f = V.feuille(c.o.id);
            if (!f) return;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(f.canvas, Math.round(sx - f.L * 0.55), Math.round(sy - f.H * 1.1 + 2),
                          f.L * 1.1, f.H * 1.1);
            ctx.restore();
          }
        });
      });

      if (cur && !lune) {
        out.push({
          x: (lieu.x + 0.5) * TS, y: (lieu.y + 1) * TS,
          dessin: function (ctx, sx, sy) {
            var f = V.feuille(cur.id);
            if (!f) return;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(f.canvas, Math.round(sx - f.L * 1.1), Math.round(sy - f.H * 2.2),
                          f.L * 2.2, f.H * 2.2);
            ctx.restore();
          }
        });
      }

      if (lune) {
        // La bouche de la grotte, dans la falaise.
        out.push({
          x: GROTTE.x * TS, y: (GROTTE.y + GROTTE.ly) * TS - 40,
          dessin: function (ctx, sx, sy) {
            var gx = sx, gy = sy + 40 - GROTTE.ly * TS * 0.5;
            ctx.fillStyle = '#2e2e2c';
            ctx.beginPath();
            ctx.ellipse(gx, gy, GROTTE.lx * TS * 0.62, GROTTE.ly * TS * 0.62, 0, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#070708';
            ctx.beginPath();
            ctx.ellipse(gx, gy + 6, GROTTE.lx * TS * 0.52, GROTTE.ly * TS * 0.52, 0, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(gx - GROTTE.lx * TS * 0.52, gy + 6, GROTTE.lx * TS * 1.04, 14);
            // Les griffures, tout autour.
            ctx.strokeStyle = 'rgba(20,20,20,.7)';
            ctx.lineWidth = 2;
            for (var k = 0; k < 6; k++) {
              var ang = Math.PI + (k + 0.5) / 6 * Math.PI;
              var r0 = GROTTE.lx * TS * 0.66;
              ctx.beginPath();
              ctx.moveTo(gx + Math.cos(ang) * r0, gy + Math.sin(ang) * r0 * 0.6);
              ctx.lineTo(gx + Math.cos(ang) * (r0 + 10), gy + Math.sin(ang) * (r0 + 10) * 0.6);
              ctx.stroke();
            }
            if (!bossBattu()) {
              // Deux yeux, tout au fond, qui s'allument par moments.
              var lueur = reduit ? 0.5 : Math.max(0, Math.sin(t / 900)) * 0.9;
              ctx.fillStyle = 'rgba(232,72,58,' + lueur.toFixed(2) + ')';
              ctx.fillRect(Math.round(gx - 12), Math.round(gy - 6), 4, 3);
              ctx.fillRect(Math.round(gx + 8), Math.round(gy - 6), 4, 3);
            }
          }
        });
      }

      if (repaire && !lune) {
        // Le repaire : un gouffre borde de la couleur du gardien, des
        // griffures, et deux yeux qui s'allument tant qu'il n'est pas vaincu.
        out.push({
          x: repaire.px, y: repaire.py - 30,
          dessin: function (ctx, sx, sy) {
            var gx = sx, gy = sy + 30, battu = bossBattu();
            var puls = reduit || battu ? 0.5 : 0.5 + 0.5 * Math.sin(t / 500);
            ctx.save();
            ctx.globalAlpha = battu ? 0.5 : 0.35 + 0.4 * puls;
            ctx.fillStyle = gardien.c[2];
            ctx.beginPath(); ctx.ellipse(gx, gy, 34, 17, 0, 0, 6.3); ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#0a0a0e';
            ctx.beginPath(); ctx.ellipse(gx, gy, 28, 13, 0, 0, 6.3); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(gx, gy + 2, 20, 8, 0, 0, 6.3); ctx.fill();
            ctx.strokeStyle = 'rgba(10,10,10,.6)';
            ctx.lineWidth = 2;
            for (var k = 0; k < 5; k++) {
              var an = k / 5 * 6.28 + 0.3;
              ctx.beginPath();
              ctx.moveTo(gx + Math.cos(an) * 36, gy + Math.sin(an) * 18);
              ctx.lineTo(gx + Math.cos(an) * 46, gy + Math.sin(an) * 23);
              ctx.stroke();
            }
            if (!battu) {
              var lueur = reduit ? 0.6 : Math.max(0, Math.sin(t / 800)) * 0.95;
              ctx.fillStyle = 'rgba(232,72,58,' + lueur.toFixed(2) + ')';
              ctx.fillRect(Math.round(gx - 9), Math.round(gy - 2), 4, 3);
              ctx.fillRect(Math.round(gx + 5), Math.round(gy - 2), 4, 3);
            }
          }
        });
      }

      betes.forEach(function (b) {
        if (b.mort && t - b.mortT > 700) return;
        out.push({
          x: b.x, y: b.y,
          dessin: function (ctx, sx, sy) {
            var fb = V.feuille(b.v.id);
            if (!fb) return;
            var e = b.v.taille || 1;
            ctx.save();
            if (b.mort) ctx.globalAlpha = Math.max(0, 1 - (t - b.mortT) / 700);
            ctx.globalAlpha *= 0.28;
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(sx, sy + 6, 12 * e, 4 * e, 0, 0, 6.3); ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            if (b.mort) {
              ctx.globalAlpha = Math.max(0, 1 - (t - b.mortT) / 700);
              ctx.translate(sx, sy);
              ctx.rotate(Math.min(1, (t - b.mortT) / 400) * 1.57);
              ctx.translate(-sx, -sy);
            }
            ctx.drawImage(fb.canvas, Math.round(sx - fb.L * e / 2), Math.round(sy - fb.H * e + 6),
                          fb.L * e, fb.H * e);
            ctx.restore();
            // Le blanc de la touche.
            if (!b.mort && t - b.touche < 120) {
              ctx.save();
              ctx.globalAlpha = 0.7;
              ctx.globalCompositeOperation = 'lighter';
              ctx.drawImage(fb.canvas, Math.round(sx - fb.L * e / 2), Math.round(sy - fb.H * e + 6),
                            fb.L * e, fb.H * e);
              ctx.restore();
            }
            // La jauge, des qu'elle est entamee.
            if (!b.mort && b.pv < b.pvMax) {
              var lj = 24 * e;
              ctx.fillStyle = 'rgba(0,0,0,.6)';
              ctx.fillRect(Math.round(sx - lj / 2), Math.round(sy - fb.H * e - 2), Math.round(lj), 3);
              ctx.fillStyle = b.agressif ? '#e8483a' : '#7cf0c8';
              ctx.fillRect(Math.round(sx - lj / 2), Math.round(sy - fb.H * e - 2),
                           Math.round(lj * b.pv / b.pvMax), 3);
            }
            // Le signe des agressives quand elles chassent.
            if (!b.mort && b.agressif && Math.hypot(b.x - balade.chef.x, b.y - balade.chef.y) < 135) {
              ctx.fillStyle = '#ff5a4a';
              ctx.fillRect(Math.round(sx - 1), Math.round(sy - fb.H * e - 10), 2, 5);
              ctx.fillRect(Math.round(sx - 1), Math.round(sy - fb.H * e - 4), 2, 2);
            }
          }
        });
      });

      return out;
    }

    // --- Par-dessus tout : les tirs, le scan, les chiffres, le monstre ---
    function apres(ctx, cam, t) {
      var i;
      for (i = tirs.length - 1; i >= 0; i--) {
        var r = tirs[i], ag = Math.max(0, (t - r.t0) / 180);
        if (ag >= 1) { tirs.splice(i, 1); continue; }
        ctx.strokeStyle = 'rgba(124,240,255,' + (1 - ag).toFixed(2) + ')';
        ctx.lineWidth = 2.5 - ag * 1.5;
        ctx.beginPath();
        ctx.moveTo(balade.chef.x - cam.x, balade.chef.y - cam.y - 16);
        ctx.lineTo(r.x - cam.x, r.y - cam.y);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,120,' + (1 - ag).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(r.x - cam.x, r.y - cam.y, 3 + ag * 10, 0, 6.3);
        ctx.stroke();
      }

      if (scan) {
        var k = Math.min(1, (t - scan.t0) / 1500);
        var sx = scan.x - cam.x, sy = scan.y - cam.y;
        ctx.strokeStyle = 'rgba(124,240,200,.9)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy, 10 + k * 26, -1.57, -1.57 + k * 6.283); ctx.stroke();
        ctx.strokeStyle = 'rgba(124,240,200,' + (0.5 * (1 - k)).toFixed(2) + ')';
        ctx.beginPath();
        ctx.moveTo(balade.chef.x - cam.x, balade.chef.y - cam.y - 16);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.font = 'bold 11px "Courier New", monospace';
      for (i = chiffres.length - 1; i >= 0; i--) {
        var c = chiffres[i], ac = Math.max(0, (t - c.t0) / 900);
        if (ac >= 1) { chiffres.splice(i, 1); continue; }
        ctx.fillStyle = c.moi ? 'rgba(255,90,74,' + (1 - ac).toFixed(2) + ')'
          : c.noyau ? 'rgba(255,209,102,' + (1 - ac).toFixed(2) + ')'
          : 'rgba(255,236,200,' + (1 - ac).toFixed(2) + ')';
        ctx.fillText(c.txt, c.x - cam.x, c.y - cam.y - ac * 18);
      }
      ctx.textAlign = 'left';

      // Le monstre qui sort : la poussiere, puis la tete, gueule ouverte.
      if (surgi) {
        var ks = Math.min(1, (t - surgi.t0) / SURGIT_DUREE);
        var gx = repaire.x * TS - cam.x, gy = repaire.y * TS - cam.y;
        for (i = 0; i < 16; i++) {
          var ph = (ks * 1.6 + i / 16) % 1;
          ctx.fillStyle = 'rgba(160,160,150,' + (0.5 * (1 - ph)).toFixed(2) + ')';
          ctx.beginPath();
          ctx.arc(gx + Math.cos(i * 2.4) * (20 + ph * 60), gy + 30 - ph * 20,
                  4 + ph * 10, 0, 6.3);
          ctx.fill();
        }
        var B = window.BOSS;
        var fm = B && B.feuille(gardien.id, ks > 0.55);
        if (fm) {
          var montee = Math.min(1, ks * 1.35);
          var e2 = 0.35 + montee * 0.55;
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.beginPath();
          ctx.rect(gx - 200, -40, 400, gy + 84);
          ctx.clip();
          ctx.drawImage(fm.canvas, gx - fm.L * e2 / 2, gy + 40 - fm.H * e2 * montee,
                        fm.L * e2, fm.H * e2);
          ctx.restore();
        }
        if (ks > 0.8) {
          ctx.fillStyle = 'rgba(20,4,4,' + ((ks - 0.8) / 0.2 * 0.9).toFixed(2) + ')';
          ctx.fillRect(0, 0, 480, 316);
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
      extras: extras,
      apres: apres,

      chaqueImage: function (t) {
        animer(t);
        if (reprise) {
          reprise.x = balade.chef.x;
          reprise.y = balade.chef.y;
          reprise.dir = balade.chef.dir;
        }
        scene.dataset.etat = etat;
        if (etat === 'ko' || etat === 'boss') { majBoutons(); return; }

        // La grotte : on n'en approche pas impunement.
        // Hors de la Lune, un gardien ne se reveille que devant une arme.
        if (repaire && etat === 'libre' && !bossBattu() && (lune || DP.aLArme()) &&
            presDuRepaire(lune ? 60 : 40)) {
          return reveillerMonstre();
        }

        cibleTir = chercherCibleTir();
        if (etat === 'libre') cible = chercherCible();
        majBoutons();
        if (etat !== 'libre') return;

        var menace = betes.some(function (b) {
          return !b.mort && b.agressif && distance(b) < 135;
        });
        dire(menace ? (DP.aLArme() ? 'Une créature attaque — TIRER !'
                                   : 'Une créature attaque. Sans arme, mieux vaut fuir.')
          : cible ? (DP.aScanne(cible.sujet.id) ? cible.sujet.nom + ' — déjà au carnet.'
                                                : 'Quelque chose à portée de scanner.')
          : (repaire && !bossBattu() && (lune ? balade.chef.y < 13 * TS : presDuRepaire(170)))
            ? gardien.textes.indice + (lune || DP.aLArme() ? '' : ' Sans arme, mieux vaut passer son chemin.')
          : a.sous);
      }
    });

    majJauge();

    var veille = setInterval(function () {
      if (vivant()) return;
      clearInterval(veille);
      window.removeEventListener('keydown', auClavier);
      minuteurs.forEach(clearTimeout);
      if (duel) duel.arreter();
      balade.arreter();
    }, 400);

    // Pour les essais : l'etat interne, sans passer par l'ecran.
    scene._ody = {
      betes: betes, choses: choses, g: g,
      pv: function () { return pv; }, etat: function () { return etat; },
      reveiller: reveillerMonstre, tirer: tirer,
      gardien: gardien, repaire: repaire,
      viser: function (b) { cibleTir = b; }
    };
  }

  // Ce que dit la fiche du genre d'une entree.
  function genre(s) {
    if (s.boss) return 'Gardien';
    if (s.objet) return 'Objet';
    if (s.forme) return 'Curiosité';
    return 'Forme de vie';
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
          c.appendChild(el('span', 'ody-case-det', genre(s)));
          var ab = DP.abattus()[s.id];
          c.appendChild(el('span', 'ody-case-n',
            (e.n > 1 ? '×' + e.n : '') + (ab ? (e.n > 1 ? '  ·  ' : '') + ab + ' abattu' + (ab > 1 ? 's' : '') : '')));
          c.title = s.texte;
        } else {
          c.appendChild(el('span', 'ody-case-vide', s.boss ? '!' : '?'));
          c.appendChild(el('span', 'ody-case-nom', s.boss ? 'Gardien de la grotte' : '???'));
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
    if (DP.aLArme()) {
      var arm2 = el('a', 'ody-btn ody-btn--plat', 'Armurerie');
      arm2.href = '#armurerie/odyssee';
      pied.appendChild(arm2);
    }
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
    accessibles: accessibles, construireLune: construireLune,
    BASE: BASE, GROTTE: GROTTE, DEVANT_GROTTE: DEVANT_GROTTE, PV_MAX: PV_MAX,
    placeRepaire: placeRepaire,
    MW: MW, MH: MH, DEPART: DEPART, TEMPS: TEMPS,
    reprise: function () { return reprise; },
    poserReprise: function (r) { reprise = r; }
  };
})();
