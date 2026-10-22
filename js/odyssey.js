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
  var DP = window.DP, M = window.MONDE, V = window.ODYVIE, TER = window.ODYTERRAIN;
  if (!DP || !M || !V || !TER) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TS = M.TS, T = M.T;
  // Les grandes cartes (js/odyssey-terrain.js) : 120 x 84 cases, le point
  // d'arrivee au milieu. O est l'endroit ou se pose l'ancienne carte de
  // 40 x 28 quand on en garde le coeur (la Lune) ; les lieux fixes (la
  // base lunaire, la grotte, le cabanon) sont donnes dans ce repere-la.
  var MW = TER.MW, MH = TER.MH, DX = TER.DX, DY = TER.DY, O = TER.O;
  var DEPART = { x: DX * TS + 12, y: DY * TS + 12 };

  // La partie en cours : le monde ou l'on se tient, et l'endroit exact.
  // Comme pour la peche, passer par le carnet ne doit pas tout perdre.
  var reprise = null;
  // Ce que la visite a deja change : les noeuds ramasses, les rochers
  // casses, la carte deja vue. Un passage par le carnet ne les efface pas ;
  // un nouveau voyage, si.
  var visite = null;
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

  // L'image du Telecommande, fournie par l'auteur ; le dessin ne sert plus
  // qu'en secours, si le fichier venait a manquer.
  var IMG_TP = 'assets/items/teleportail.webp';
  var JAQUETTE = 'assets/games/icones/odyssey.webp';

  function visuel() { return IMG_TP; }

  var imgTP = new Image();
  imgTP.src = IMG_TP;

  function dessinTL() {
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
      im.src = dessinTL();
    });
    im.src = IMG_TP;
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

  // Celui qui marche sur les mondes : le Dinder choisi avant de partir.
  function voyageur() {
    return DP.odysseeDinder() || 'dr-islas-human-form';
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

      // L'image de l'auteur si elle est chargee, sinon le dessin.
      var vraie = imgTP.complete && imgTP.naturalWidth;
      var f = vraie ? { canvas: imgTP } : feuilleTL();
      if (!f) return;
      var ech = 2.2 + Math.min(1, k * 1.8) * 1.6;
      var lg = TL_L * ech, ht = TL_H * ech;
      if (vraie) { ht = TL_H * ech * 1.05; lg = ht * imgTP.naturalWidth / imgTP.naturalHeight; }
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
      ctx.imageSmoothingEnabled = !vraie ? false : true;
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
          icone: JAQUETTE,
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

    // Avec la telecommande : on demande d'abord qui part, puis on la sort.
    location.hash = '#odyssee-equipier';
  }

  // ==========================================================
  //  Qui part en expedition
  // ==========================================================
  // On ne marche pas sur huit mondes avec le premier venu : le Dinder se
  // choisit avant de sortir le Teleportail, et le choix se garde.

  function viewEquipier(view) {
    var box = el('div', 'ody ody--equipier');

    var owned = DP.owned();
    if (!owned.length) {
      var vide = el('div', 'ody-carte');
      vide.appendChild(el('p', 'ody-carte-titre', 'PERSONNE À ENVOYER'));
      vide.appendChild(el('p', 'ody-carte-txt',
        'Tu n’as encore aucun Dinder. Ouvre une Dindise, puis reviens : ' +
        'c’est lui qui marchera sur les mondes.'));
      var go = el('a', 'ody-btn', 'Win Dinders');
      go.href = '#win-dinders';
      vide.appendChild(go);
      box.appendChild(vide);
      view.appendChild(box);
      return;
    }

    var tete = el('div', 'ody-eq-tete');
    tete.appendChild(el('h2', 'ody-eq-titre', 'Qui part en expédition ?'));
    tete.appendChild(el('p', 'ody-eq-txt',
      'C’est lui que tu verras marcher sur les mondes. Tu pourras en ' +
      'changer au Téléportail.'));
    box.appendChild(tete);

    var choisi = DP.odysseeDinder();

    var grille = el('div', 'ody-roster');
    owned.forEach(function (id) {
      var d = DP.byId(id);
      if (!d) return;
      var n = el('button', 'ody-carte-dinder' + (id === choisi ? ' is-choisi' : ''));
      n.type = 'button';
      n.dataset.id = id;
      n.dataset.rarity = DP.rarityKey(d.rarity);

      var im = el('img', 'ody-dinder-sprite');
      im.src = DP.sprite(id, 'duel');
      im.alt = '';
      n.appendChild(im);
      n.appendChild(el('span', 'ody-dinder-nom', d.name));
      n.appendChild(el('span', 'ody-dinder-sous', d.form || d.rarity));

      n.addEventListener('click', function () {
        DP.choisirOdysseeDinder(id);
        choisi = id;
        grille.querySelectorAll('.ody-carte-dinder').forEach(function (c) {
          c.classList.toggle('is-choisi', c.dataset.id === id);
        });
        partir.disabled = false;
      });
      grille.appendChild(n);
    });
    box.appendChild(grille);

    var pied = el('div', 'ody-eq-pied');
    var partir = el('a', 'ody-btn ody-btn--go', 'OUVRIR LE TÉLÉPORTAIL');
    partir.href = '#teleportail';
    pied.appendChild(partir);
    box.appendChild(pied);

    view.appendChild(box);
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
    var b = el('a', 'ody-btn', 'Choisir ton Dinder');
    b.href = '#odyssee-equipier';
    carte.appendChild(b);
    box.appendChild(carte);
    jeu.appendChild(box);
  }

  // ==========================================================
  //  Le Teleportail
  // ==========================================================

  // Le systeme ouvert dans le journal de bord. On le retient le temps de
  // la page : en revenant d'un monde stellaire, on retrouve sa liste.
  var ongletSys = 'solaire';

  function viewTeleportail(view) {
    if (!DP.aLaTelecommande()) { location.hash = '#odyssee'; return; }

    var box = el('div', 'tp');
    var SYS = V.systemes();
    if (!SYS.some(function (s) { return s.id === ongletSys; })) ongletSys = 'solaire';
    function sysActif() {
      return SYS.filter(function (s) { return s.id === ongletSys; })[0] || SYS[0];
    }
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

    // Le pave change avec le systeme : chacun a ses initiales.
    var pave = el('div', 'tp-pave');
    var TOUCHES = {
      solaire: ['S', 'M', 'V', 'T', 'J', 'U', 'N', 'L', '-',
                '1', '2', '3', '4', '5', '6', '7', '8'],
      stellaire: ['S', 'T', 'C', 'O', 'A', 'V', 'F', 'B', 'P', 'I', '-',
                  '1', '2', '3', '4', '5', '6', '7', '8']
    };
    var effacer = el('button', 'tp-touche tp-touche--eff', '←');
    effacer.type = 'button';
    effacer.dataset.touche = 'eff';
    effacer.addEventListener('click', function () {
      saisie = saisie.slice(0, -1); erreur = false; majEcran();
    });
    var partir = el('button', 'tp-touche tp-touche--go', 'PARTIR');
    partir.type = 'button';
    partir.dataset.touche = 'go';
    partir.addEventListener('click', valider);
    appareil.appendChild(pave);

    var plaque = el('p', 'tp-plaque', '');
    appareil.appendChild(plaque);
    box.appendChild(appareil);

    function poserPave() {
      pave.textContent = '';
      pave.classList.toggle('tp-pave--serre', ongletSys === 'stellaire');
      (TOUCHES[ongletSys] || TOUCHES.solaire).forEach(function (c) {
        var b = el('button', 'tp-touche', c);
        b.type = 'button';
        b.dataset.touche = c;
        b.addEventListener('click', function () { taper(c); });
        pave.appendChild(b);
      });
      pave.appendChild(effacer);
      pave.appendChild(partir);
      plaque.textContent = sysActif().prefixe + '-[INITIALE][RANG]';
    }

    // ---- Le journal de bord, a droite ----
    var droite = el('div', 'tp-droite');

    var tete = el('div', 'tp-banniere');
    tete.appendChild(el('span', 'tp-enseigne', 'Journal de bord'));
    var nScans = Object.keys(DP.scans()).length;
    var compte = el('span', 'tp-compte', '');
    tete.appendChild(compte);
    droite.appendChild(tete);

    // Les deux categories, des que la seconde existe : avant, le journal
    // garde son allure d'origine.
    var onglets = el('div', 'tp-onglets');
    if (SYS.length > 1) {
      SYS.forEach(function (s) {
        var o = el('button', 'tp-onglet', s.nom);
        o.type = 'button';
        o.dataset.systeme = s.id;
        o.addEventListener('click', function () {
          if (ongletSys === s.id) return;
          ongletSys = s.id;
          saisie = ''; erreur = false; message = 'Entre une destination.';
          poserSysteme();
        });
        onglets.appendChild(o);
      });
      droite.appendChild(onglets);
    }

    var liste = el('div', 'tp-mondes');
    droite.appendChild(liste);

    function poserSysteme() {
      box.dataset.systeme = ongletSys;
      [].forEach.call(onglets.children, function (o) {
        o.classList.toggle('is-actif', o.dataset.systeme === ongletSys);
      });
      var mondes = V.astresDe(ongletSys);
      compte.textContent = mondes.filter(function (a) { return DP.aVuAstre(a.id); }).length +
        ' / ' + mondes.length + ' mondes  ·  ' + nScans + ' / ' + V.tout().length + ' scans';
      poserPave();
      liste.textContent = '';
      mondes.forEach(poserMonde);
      majEcran();
    }

    function poserMonde(a) {
      var vu = DP.aVuAstre(a.id);
      var ouvert = V.ouvert(a.id);
      var n = el('button', 'tp-monde');
      n.type = 'button';
      n.dataset.astre = a.id;
      n.classList.toggle('is-inconnu', !vu);
      n.classList.toggle('is-ferme', vu && !ouvert);
      n.style.setProperty('--r', a.ciel[1]);

      var disque = el('span', 'tp-disque');
      disque.style.setProperty('--c1', a.palette.sol);
      disque.style.setProperty('--c2', a.palette.roche);
      n.appendChild(disque);

      var txt = el('span', 'tp-monde-txt');
      txt.appendChild(el('strong', 'tp-monde-nom', vu ? a.nom : '? ? ?'));
      txt.appendChild(el('span', 'tp-monde-code', vu ? a.code : 'code inconnu'));
      n.appendChild(txt);

      if (vu && ouvert) {
        var faits = V.scannables(a.id).filter(function (s) {
          return DP.aScanne(s.id);
        }).length;
        n.appendChild(el('span', 'tp-monde-n',
          faits + ' / ' + V.scannables(a.id).length));
      } else if (vu) {
        n.appendChild(el('span', 'tp-monde-n tp-monde-n--ferme', 'relais fermé'));
      }

      n.addEventListener('click', function () {
        if (!vu) {
          dire(a.systeme === 'stellaire'
            ? 'Pas encore au journal. Ses coordonnées sont gardées sur un monde déjà visité.'
            : 'Ce monde n’est pas encore au journal. Tape ses coordonnées.', true);
          return;
        }
        if (!ouvert) {
          var av = V.precedent(a.id);
          dire('Relais fermé' + (av ? ' — le gardien de ' + av.nom + ' tient la ligne.' : '.'), true);
          return;
        }
        saisie = a.code;
        erreur = false;
        majEcran();
      });
      liste.appendChild(n);
    }

    var pied = el('div', 'tp-pied');
    var carnet = el('a', 'ody-btn ody-btn--plat', 'Carnet du scanner');
    carnet.href = '#odyssee-carnet';
    pied.appendChild(carnet);
    if (DP.aLArme()) {
      var arm = el('a', 'ody-btn ody-btn--plat', 'Armurerie  ·  ' + DP.roches() + ' ☀');
      arm.href = '#armurerie/odyssee';
      pied.appendChild(arm);
    }

    // Qui marche sur les mondes, et de quoi en changer.
    var eq = el('a', 'ody-btn ody-btn--plat ody-btn--equipier');
    eq.href = '#odyssee-equipier';
    var eqIm = el('img', 'ody-btn-sprite');
    eqIm.src = DP.sprite(voyageur(), 'duel');
    eqIm.alt = '';
    eq.appendChild(eqIm);
    var vd = DP.byId(voyageur());
    eq.appendChild(el('span', null, vd ? vd.name : 'Choisir'));
    pied.appendChild(eq);

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

    function refuser(mot) {
      dire(mot, true);
      appareil.classList.remove('is-refus');
      void appareil.offsetWidth;
      appareil.classList.add('is-refus');
    }

    function valider() {
      var a = V.astre(saisie);
      // Un monde stellaire qui n'est pas au journal ne repond pas du tout :
      // son nom ne doit pas sortir d'un message de refus.
      if (!a || (a.systeme === 'stellaire' && !V.ouvert(a.id))) {
        return refuser('Coordonnées refusées. Rien ne répond.');
      }
      // On ne saute pas une escale : le gardien du monde d'avant barre
      // la route tant qu'il est debout.
      if (!V.ouvert(a.id)) {
        var av = V.precedent(a.id);
        return refuser('Le relais de ' + a.nom + ' est fermé. ' +
          (av ? 'Le gardien de ' + av.nom + ' tient encore la ligne.' : ''));
      }
      dire('Verrouillage sur ' + a.nom + '…');
      appareil.classList.add('is-depart');
      setTimeout(function () {
        if (!document.body.contains(box)) return;
        location.hash = '#odyssee/' + a.id;
      }, reduit ? 0 : 700);
    }

    poserSysteme();
  }

  // ==========================================================
  //  La carte d'un monde
  // ==========================================================

  function construireCarte(a) { return TER.construire(a); }

  // Les cases qu'on atteint a pied depuis le point d'arrivee, et le
  // percement des poches isolees : voir js/odyssey-terrain.js.
  function relier(g, dep) { TER.relier(g, dep); }
  function accessibles(g) { return TER.accessibles(g, [Math.floor(DEPART.x / TS), Math.floor(DEPART.y / TS)]); }

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
        var d = Math.abs(x - DX) + Math.abs(y - DY);
        // Assez loin pour qu'il faille la chercher, pas au bout du monde.
        if (d > loin && d <= 40) { loin = d; mieux = { x: x, y: y }; }
      }
    }
    return mieux || { x: DX, y: DY - 4 };
  }

  // Le repaire du gardien : le plus loin possible du point d'arrivee (en
  // chemin a parcourir), dans un endroit degage, et pas sur la curiosite.
  function placeRepaire(g, lieu) {
    var vu = accessibles(g);
    var dist = {}, file = [[DX, DY]], k, tete = 0;
    dist[DX + ',' + DY] = 0;
    while (tete < file.length) {
      var c = file[tete++];
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
    mieux = mieux || { tx: DX, ty: DY - 12 };
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

  // Les lieux du coeur, dans son repere de 40 x 28...
  var BASE_L = { x0: 4, x1: 14, y0: 15, y1: 24 };
  var GROTTE_L = { x: 19.5, y: 4.2 };
  var DEVANT_L = { x: 19.5, y: 8.2 };
  // ... et sur la grande carte.
  var BASE = { x0: BASE_L.x0 + O.x, x1: BASE_L.x1 + O.x, y0: BASE_L.y0 + O.y, y1: BASE_L.y1 + O.y };
  var GROTTE = { x: GROTTE_L.x + O.x, y: GROTTE_L.y + O.y, lx: 5.2, ly: 3.1 };      // en cases
  var DEVANT_GROTTE = { x: DEVANT_L.x + O.x, y: DEVANT_L.y + O.y };

  function construireLune(a) { return TER.construireAutour(a, coeurLune()); }

  // L'ancienne carte de la Lune, telle quelle : 40 x 28 cases.
  function coeurLune() {
    var g = [], x, y, MW = 40, MH = 28;
    var BASE = BASE_L, DEVANT_GROTTE = DEVANT_L;
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
    return g;
  }

  // La ou poser les objets de la base, dans l'enceinte.
  var PLACES_BASE = {
    'module-habitation': [6 + O.x, 17 + O.y], 'sas-base': [10 + O.x, 16 + O.y], 'reacteur': [12 + O.x, 22 + O.y],
    'serre-base': [6 + O.x, 22 + O.y], 'antenne-relais': [12 + O.x, 18 + O.y]
  };

  // ==========================================================
  //  L'ecran d'un monde
  // ==========================================================

  var PV_MAX = 100;

  // ==========================================================
  //  La pelle, le cabanon, et ce qui dort sous le nain mauve
  // ==========================================================

  var pelleCv = null;
  function pelleCanvas() {
    if (pelleCv) return pelleCv;
    var c = document.createElement('canvas');
    c.width = 10; c.height = 26;
    var x = c.getContext('2d');
    function p(px, py, w, h, col) { x.fillStyle = col; x.fillRect(px, py, w, h); }
    p(3, 0, 5, 2, '#151822');                  // la poignee
    p(4, 1, 3, 1, '#8a5a2b');
    p(4, 2, 3, 13, '#151822'); p(5, 2, 1, 13, '#a87038');   // le manche
    p(1, 14, 9, 11, '#151822');                // le fer
    p(2, 15, 7, 8, '#9aa4b4'); p(2, 15, 2, 7, '#c4ccd8');
    p(3, 23, 5, 2, '#7a8394');
    pelleCv = c;
    return c;
  }
  var pelleUrlCache = null;
  function pelleUrl() {
    if (pelleUrlCache) return pelleUrlCache;
    var c = document.createElement('canvas');
    c.width = 60; c.height = 88;
    var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.translate(30, 44); x.rotate(0.35);
    x.drawImage(pelleCanvas(), -15, -39, 30, 78);
    pelleUrlCache = c.toDataURL('image/png');
    return pelleUrlCache;
  }

  // Le cabanon : trois cases de large, des planches, un toit de tuiles et
  // une porte. (sx, sy) est le pied de la facade.
  function dessinerCabanon(ctx, sx, sy) {
    var L = 3 * TS, x0 = Math.round(sx - L / 2), y0 = Math.round(sy);
    function p(px, py, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x0 + px, y0 + py, w, h); }
    p(2, -4, L - 4, 5, 'rgba(0,0,0,.3)');                  // l'ombre au sol
    p(0, -46, L, 46, '#151822');
    p(1, -45, L - 2, 44, '#7a5230');                       // les murs de planches
    for (var i = 0; i < L - 2; i += 6) p(1 + i, -45, 1, 44, '#5c3c20');
    p(1, -45, L - 2, 2, '#9a6a3c');
    p(30, -30, 13, 29, '#151822'); p(31, -29, 11, 28, '#4a2c16');   // la porte
    p(39, -16, 2, 2, '#c9a227');
    p(8, -34, 12, 10, '#151822'); p(9, -33, 10, 8, '#2a3a4e'); p(14, -33, 1, 8, '#151822');  // la fenetre
    // Le toit, qui deborde.
    p(-4, -62, L + 8, 18, '#151822');
    p(-3, -61, L + 6, 16, '#8a2e22');
    for (var j = 0; j < 3; j++) p(-3, -58 + j * 5, L + 6, 1, '#5e1c14');
    p(-3, -61, L + 6, 2, '#b04634');
  }

  // Ce qu'on voit dans le ciel de chaque monde, a la premiere personne :
  // le Soleil (plus gros sur Mercure que sur Neptune), les lunes, la
  // Terre vue de la Lune ; dans le systeme stellaire, son etoile et une
  // geante gazeuse a anneaux.
  function astresCiel(a) {
    var out = [];
    if (a.systeme === 'stellaire') {
      out.push({ az: 0.1, haut: 0.62, r: 7, c1: '#ffc890', c2: '#ffffff', halo: true });
      var h = M.bruit(a.rang || 1, 3, 77);
      out.push({ az: 0.45 + h * 0.3, haut: 0.42, r: 12 + Math.round(h * 8), c1: a.ciel[2], c2: a.palette.cristal2 || '#ffffff',
                 bandes: true, anneau: h > 0.4, ombre: true });
      return out;
    }
    var r = Math.max(2, Math.round(13 - (a.rang || 3) * 1.4));
    out.push({ az: 0.1, haut: 0.65, r: r, c1: '#fff4c8', c2: '#ffffff', halo: true });
    if (a.id === 'terre') out.push({ az: 0.58, haut: 0.7, r: 5, c1: '#d8d8e0', c2: '#ffffff', ombre: true });
    if (a.id === 'lune') out.push({ az: 0.6, haut: 0.55, r: 14, c1: '#3a7ad8', c2: '#7ac85a', ombre: true });
    if (a.id === 'mars') { out.push({ az: 0.5, haut: 0.7, r: 2, c1: '#a89888' }); out.push({ az: 0.72, haut: 0.5, r: 1, c1: '#a89888' }); }
    if (a.id === 'jupiter') { out.push({ az: 0.4, haut: 0.6, r: 3, c1: '#f0d060', ombre: true }); out.push({ az: 0.66, haut: 0.75, r: 2, c1: '#c8b8a0' }); }
    if (a.id === 'saturne') out.push({ az: 0.55, haut: 0.58, r: 4, c1: '#e0a050', ombre: true });
    if (a.id === 'uranus' || a.id === 'neptune') out.push({ az: 0.6, haut: 0.66, r: 3, c1: '#c8c8d8', ombre: true });
    return out;
  }

  function ecranMonde(jeu, idAstre, ou) {
    var a = V.astre(idAstre);
    if (!a) { location.hash = '#teleportail'; return; }

    jeu.textContent = '';
    DP.noterAstre(a.id);
    ongletSys = a.systeme;
    // Chaque monde a sa musique.
    if (window.MUSIQUE_JEUX && window.MUSIQUE_JEUX.planete) window.MUSIQUE_JEUX.planete(a.id);
    var lune = a.id === 'lune';
    var CR = window.ODYCRAFT;
    if (!ou || !visite || visite.astre !== a.id) {
      visite = { astre: a.id, pris: {}, modifs: [], vu: new Uint8Array(MW * MH) };
    }

    var scene = el('div', 'ody-scene');
    scene.dataset.astre = a.id;
    scene.style.setProperty('--ciel1', a.ciel[0]);
    scene.style.setProperty('--ciel2', a.ciel[1]);
    scene.style.setProperty('--ciel3', a.ciel[2]);
    if (!ou) scene.classList.add('is-arrivee');

    var cv = el('canvas', 'ody-canvas');
    var vueO = M.vue(MW, MH);
    cv.width = vueO.L; cv.height = vueO.H;
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
    // Le repaire d'un gardien deja tombe en rejoue l'hologramme.
    var holo = el('button', 'ody-holo', 'HOLOGRAMME');
    holo.type = 'button';
    holo.hidden = true;
    boutons.appendChild(holo);
    // Ramasser la pelle, ou creuser au pied du nain mauve.
    var pelleB = el('button', 'ody-pelle', '');
    pelleB.type = 'button';
    pelleB.hidden = true;
    boutons.appendChild(pelleB);
    // Ramasser, ouvrir un coffre, miner, forer : un seul bouton, qui dit
    // ce qu'il fera.
    var recolteB = el('button', 'ody-recolte', '');
    recolteB.type = 'button';
    recolteB.hidden = true;
    boutons.appendChild(recolteB);
    // Sous l'eau : remonter a la surface, a tout moment.
    var remonterB = el('button', 'ody-remonter', 'REMONTER');
    remonterB.type = 'button';
    remonterB.hidden = true;
    boutons.appendChild(remonterB);
    scene.appendChild(boutons);

    // Le sac, en haut, a cote du Teleportail.
    var sacB = el('button', 'ody-sac');
    sacB.type = 'button';
    sacB.title = 'Sac (I)';
    sacB.setAttribute('aria-label', 'Ouvrir le sac');
    if (CR) {
      var sacIm = el('img', 'ody-sac-img');
      sacIm.src = CR.url('sac-toile');
      sacIm.alt = '';
      sacB.appendChild(sacIm);
      sacB.appendChild(el('span', 'ody-sac-n', ''));
      scene.appendChild(sacB);
    }

    // La mini-carte : la carte entiere en un pixel par case, couverte d'un
    // brouillard qui se leve la ou l'on passe. Un clic l'agrandit.
    var mini = el('canvas', 'ody-mini');
    mini.width = MW; mini.height = MH;
    mini.title = 'Carte';
    mini.addEventListener('click', function () { mini.classList.toggle('is-grande'); });
    scene.appendChild(mini);

    // La barre rapide : les neuf premieres cases du sac, toujours visibles
    // en bas, au milieu. Toucher un soin ou un repas le consomme tout de
    // suite (touches 1 a 9 au clavier) ; le reste ouvre le sac.
    var barre = el('div', 'ody-barre');
    var barreBulle = el('div', 'ody-barre-bulle');
    barreBulle.hidden = true;
    if (CR) { scene.appendChild(barre); scene.appendChild(barreBulle); }
    var signatureBarre = '';

    var retour = el('a', 'ody-retour');
    retour.href = '#teleportail';
    retour.setAttribute('aria-label', 'Téléportail');
    retour.title = 'Téléportail';
    retour.appendChild(imageTelecommande('ody-retour-img'));
    scene.appendChild(retour);

    // La vue a la premiere personne : un viseur au centre, une lueur
    // rouge sur le bord d'ou vient le coup qu'on recoit.
    var viseur = el('div', 'ody-viseur');
    scene.appendChild(viseur);
    var coupVenu = el('div', 'ody-coup-venu');
    scene.appendChild(coupVenu);
    // Les commandes, rappelees a l'arrivee, puis qui s'effacent.
    var tactile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var aide = el('div', 'ody-aide');
    aide.appendChild(el('span', null, tactile
      ? 'Joystick : avancer · Glisser l’écran : regarder · Toucher : tirer'
      : 'Clic : prendre la souris · ZQSD / WASD : avancer · Souris ou ← → : regarder'));
    aide.appendChild(el('span', null, tactile
      ? 'Face à l’eau : PLONGER'
      : 'Clic : tirer · Clic droit / Espace : scanner · E : agir, plonger · R : remonter · Échap : libérer la souris'));
    scene.appendChild(aide);
    setTimeout(function () { aide.classList.add('is-fini'); }, 9000);

    var panneau = el('div', 'ody-panneau');
    panneau.hidden = true;
    scene.appendChild(panneau);

    jeu.appendChild(scene);

    var g = lune ? construireLune(a) : construireCarte(a);
    var palette = TER.palette(a);
    var optsCarte = { palette: palette, regions: true };

    // Le cabanon du fond du jardin, sur la Terre, et la pelle oubliee
    // derriere. On ne la voit pas depuis le point d'arrivee : il faut en
    // faire le tour.
    var CABANON = a.id === 'terre' ? { x0: 31 + O.x, x1: 33 + O.x, y0: 21 + O.y, y1: 22 + O.y } : null;
    // Couchee contre le mur du fond : seul le bout du manche depasse du toit.
    var PELLE = CABANON ? { x: (32.6 + O.x) * TS, y: (21.05 + O.y) * TS } : null;
    if (CABANON) {
      // Un peu de jardin degage autour, pour pouvoir en faire le tour.
      for (var cy0 = CABANON.y0 - 2; cy0 <= CABANON.y1 + 2; cy0++)
        for (var cx0 = CABANON.x0 - 2; cx0 <= CABANON.x1 + 2; cx0++) g[cy0][cx0] = T.SOL;
      for (cy0 = CABANON.y0; cy0 <= CABANON.y1; cy0++)
        for (cx0 = CABANON.x0; cx0 <= CABANON.x1; cx0++) g[cy0][cx0] = T.STRUCTURE;
      relier(g);
    }
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
    // L'artefact cache sur ce monde, loin de la curiosite et du repaire.
    var ART = window.ARTEFACTS;
    var cachesO = ART ? ART.caches('odyssee', g, { x: DX, y: DY }, {
      carte: a.id, graine: 400 + Math.round(a.rang * 13),
      // Loin du repaire : on ne doit pas reveiller un gardien en ramassant.
      eviter: [lieu].concat(repaire && repaire.tx != null ? [{ x: repaire.tx, y: repaire.ty, loin: 10 }] : [])
                    .concat(lune ? [{ x: Math.floor(DEVANT_GROTTE.x), y: Math.floor(DEVANT_GROTTE.y) }] : []),
      exclure: lune ? function (x, y) { return x >= BASE.x0 && x <= BASE.x1 && y >= BASE.y0 && y <= BASE.y1; } : null
    }) : [];

    // Un gardien tombe ouvre le monde d'apres : on l'inscrit au journal
    // de bord pour que le Teleportail en donne les coordonnees.
    function ouvrirSuivante() {
      var suite = V.suivant(a.id);
      if (!suite || DP.aVuAstre(suite.id)) return;
      DP.noterAstre(suite.id);
      plusTard(function () {
        if (!vivant()) return;
        dire('Nouvelles coordonnées au journal : ' + suite.nom + '  ·  ' + suite.code + '.');
      }, reduit ? 300 : 2600);
    }

    function presDuRepaire(r) {
      return !!repaire && Math.hypot(balade.chef.x - repaire.px, balade.chef.y - repaire.py) < r;
    }

    reprise = { astre: a.id, x: ou ? ou.x : DEPART.x, y: ou ? ou.y : DEPART.y,
                dir: ou ? ou.dir : 0, ang: ou ? ou.ang : undefined };

    // --- Le voyageur ---
    // Les PV max suivent l'armure portee.
    function pvMax() { return PV_MAX + (CR ? CR.bonus().pv : 0); }
    var pv = pvMax(), dernierCoupRecu = -99999;
    // Ce que les consommables laissent derriere eux.
    var bouclierPV = 0, regenJusqua = 0, repulsifJusqua = 0;

    // --- Les habitants ---
    // Un individu par espece, deux pour les plus communes. Les agressives
    // foncent sur le voyageur quand il passe a portee ; les autres errent
    // autour de leur point d'attache, et fuient si on leur tire dessus.
    function caseLibreAuHasard(graine, loinDuDepart) {
      for (var essai = 0; essai < 300; essai++) {
        var bx = 3 + Math.floor(M.bruit(graine, essai, a.rang * 13 + 7) * (MW - 6));
        var by = 3 + Math.floor(M.bruit(graine, essai + 500, a.rang * 13 + 8) * (MH - 6));
        if (!libres[bx + ',' + by]) continue;
        if (Math.abs(bx - DX) + Math.abs(by - DY) < (loinDuDepart || 0)) continue;
        return [bx, by];
      }
      return [20, 18];
    }

    var betes = [];
    V.vies(a.id).forEach(function (v, k) {
      // La carte est neuf fois plus grande qu'avant : la faune suit, sans
      // tout a fait suivre — les grosses betes restent rares.
      var n = v.palier <= 1 ? 6 : v.palier === 2 ? 4 : 2;
      for (var i = 0; i < n; i++) {
        // Les agressives naissent a distance : on ne se fait pas mordre en
        // posant le pied sur un monde.
        var c = caseLibreAuHasard(k * 11 + i * 3, v.agressif ? 12 : 3);
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

    // --- Ce qui se ramasse ---
    var recoltes = CR ? TER.placer(g, a, [lieu, repaire && repaire.tx != null ? { x: repaire.tx, y: repaire.ty, loin: 8 } : null]
      .filter(Boolean).concat(choses.map(function (c) { return { x: Math.floor(c.x / TS), y: Math.floor(c.y / TS), loin: 3 }; })))
      : { noeuds: [], coffres: [] };
    var noeuds = recoltes.noeuds, coffres = recoltes.coffres;
    var ouverture = {};                // les coffres qui s'ouvrent : id -> instant
    var envols = [], eclats = [], explosions = [];
    var prise = null;                  // ce que le bouton RECOLTER fera
    // Les rochers deja casses de cette visite.
    visite.modifs.forEach(function (m) { g[m[1]][m[0]] = m[2]; });

    var balade = null, PL = null;
    var cible = null, cibleTir = null;
    var scan = null, tirs = [], chiffres = [];
    var SCAN_DUREE = 2000;
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
    // Un message qui reste affiche un moment, par-dessus ce que le bandeau
    // dit d'habitude a chaque image.
    var messageJusqua = 0;
    function direPour(txt, ms) { dire(txt); messageJusqua = maintenant() + (ms || 2600); }

    function majJauge() {
      var k = pv / pvMax();
      jaugePlein.style.width = (k * 100).toFixed(1) + '%';
      jaugePlein.dataset.bas = k < 0.3 ? '1' : '0';
      jaugeTxt.textContent = Math.ceil(pv) + ' / ' + pvMax() + (bouclierPV > 0 ? '  ◈' + Math.ceil(bouclierPV) : '');
    }

    function tuileLibre(px, py) {
      var t = balade.tuile(Math.floor(px / TS), Math.floor(py / TS));
      return t !== undefined && !M.BLOQUANT[t];
    }

    function distance(b) {
      return Math.hypot(b.x - balade.chef.x, b.y - balade.chef.y);
    }

    // --- Ce qu'on a dans le viseur ---
    // L'ecart entre le regard et la chose, rapporte a sa distance et a sa
    // taille ; null si elle est trop loin, hors du champ, ou derriere un
    // mur. Le meilleur score est la chose la plus au centre.
    function dansLeViseur(x, y, portee, demiLarg, h) {
      var ch = balade.chef, dx = x - ch.x, dy = y - ch.y, d = Math.hypot(dx, dy);
      if (d > portee || d < 1) return null;
      var c = Math.cos(ch.ang), sn = Math.sin(ch.ang);
      var prof = dx * c + dy * sn;
      if (prof < 4) return null;
      var lat = -dx * sn + dy * c;
      var ecart = Math.max(0, Math.abs(lat) - (demiLarg || 10));
      if (ecart / prof > 0.17) return null;
      var pr = balade.projeter ? balade.projeter(x, y, h || 12) : null;
      if (pr && balade.visible && !balade.visible(pr.x, prof)) return null;
      return { d: d, score: ecart / prof + d / 5000 };
    }

    // Devant soi, a portee de main.
    function aPortee(x, y, dmax) {
      var ch = balade.chef, dx = x - ch.x, dy = y - ch.y, d = Math.hypot(dx, dy);
      if (d > dmax) return null;
      if (d < 14) return d;
      var cosA = (dx * Math.cos(ch.ang) + dy * Math.sin(ch.ang)) / d;
      return cosA > 0.55 ? d : null;
    }

    // --- Le scanner : ce qu'on vise, jusqu'a six cases ---
    function chercherCible() {
      if (PL && PL.actif()) return null;
      var mieux = null, s0 = Infinity;
      function voir(sujet, ref, x, y, larg, h) {
        var v = dansLeViseur(x, y, 150, larg, h);
        if (v && v.score < s0) { s0 = v.score; mieux = { sujet: sujet, ref: ref }; }
      }
      betes.forEach(function (b) { if (!b.mort) voir(b.v, b, b.x, b.y, 12 * (b.v.taille || 1)); });
      choses.forEach(function (c) { voir(c.o, c, c.x, c.y, 14); });
      if (cur && (!lune || bossBattu())) {
        var lx = (lieu.x + 0.5) * TS, ly = (lieu.y + 0.5) * TS;
        voir(cur, { x: lx, y: ly }, lx, ly, lune ? 70 : 34, 20);
      }
      return mieux;
    }

    // --- La cible du pistolet : ce qui est au bout du canon ---
    function chercherCibleTir() {
      if (!DP.aLArme()) return null;
      var mieux = null, s0 = Infinity;
      var liste = PL && PL.actif() ? [] : betes.filter(function (b) { return !b.mort; });
      if (PL) liste = liste.concat(PL.sirenes());
      liste.forEach(function (b) {
        var v = dansLeViseur(b.x, b.y, 240, 12 * ((b.v && b.v.taille) || 1), b.sirene && b.surface ? 26 : 12);
        if (v && v.score < s0) { s0 = v.score; mieux = b; }
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
      // Devant le repaire d'un gardien deja vaincu : sa projection.
      holo.hidden = !libre || !repaire || !gardien || !bossBattu() ||
                    !presDuRepaire(lune ? 90 : 70);
      if (!holo.hidden) {
        holo.title = 'Réaffronter ' + gardien.nom + ' en hologramme';
        holo.setAttribute('aria-label', holo.title);
      }
      var geste = libre ? gestePelle() : null;
      pelleB.hidden = !geste;
      if (geste && pelleB.dataset.geste !== geste) {
        pelleB.dataset.geste = geste;
        pelleB.textContent = geste === 'prendre' ? 'PRENDRE LA PELLE' : 'CREUSER';
      }
      recolteB.hidden = !libre || !prise;
      if (prise && recolteB.dataset.quoi !== prise.quoi) {
        recolteB.dataset.quoi = prise.quoi;
        recolteB.textContent = prise.quoi;
      }
      if (CR) {
        var nSac = DP.sacOdyssee();
        var txtSac = nSac.cases.length + '/' + nSac.taille;
        var bSac = sacB.querySelector('.ody-sac-n');
        if (bSac.textContent !== txtSac) bSac.textContent = txtSac;
        sacB.classList.toggle('is-plein', nSac.cases.length >= nSac.taille);
      }
      // On peut toujours tirer : le viseur dit seulement si l'on vise juste.
      tir.hidden = !(libre || etat === 'scan') || !DP.aLArme();
      if (!tir.hidden) {
        var A = window.ARME;
        var pret = maintenant() - dernierTir >= (A ? A.niveauJeu('odyssee').cadence : 620);
        tir.classList.toggle('is-recharge', !pret);
        tir.classList.toggle('is-vise', !!cibleTir);
      }
      viseur.classList.toggle('is-vise', !!cibleTir);
      viseur.classList.toggle('is-scan', !cibleTir && !!cible && libre);
      remonterB.hidden = !(PL && PL.actif()) || !libre;
    }

    // ---------- La pelle ----------
    var nainMauve = a.id === 'altera'
      ? choses.filter(function (c) { return c.o.id === 'nain-inverse'; })[0] : null;

    function gestePelle() {
      if (!balade) return null;
      var ch = balade.chef;
      if (PELLE && !DP.aLaPelle() && Math.hypot(ch.x - PELLE.x, ch.y - PELLE.y) < 34) return 'prendre';
      if (nainMauve && DP.aLaPelle() && Math.hypot(ch.x - nainMauve.x, ch.y - nainMauve.y) < 36) return 'creuser';
      return null;
    }

    pelleB.addEventListener('click', function () {
      var geste = gestePelle();
      if (geste === 'prendre') prendrePelle();
      else if (geste === 'creuser') creuser();
    });

    function prendrePelle() {
      DP.prendrePelle();
      etat = 'fiche';
      majBoutons();
      panneau.hidden = false;
      panneau.textContent = '';
      var box = el('div', 'ody-trouvaille');
      box.appendChild(el('strong', 'ody-trouvaille-titre', 'UNE PELLE'));
      var im = el('img', 'ody-trouvaille-img');
      im.src = pelleUrl();
      im.alt = '';
      box.appendChild(im);
      box.appendChild(el('p', 'ody-trouvaille-txt', 'Couchée derrière le cabanon, la terre encore collée au fer.'));
      box.appendChild(el('p', 'ody-trouvaille-txt ody-trouvaille-txt--sous', 'Ajoutée à tes Items. Il doit bien y avoir un endroit où creuser.'));
      var ok = el('button', 'ody-trouvaille-btn', 'OK');
      ok.type = 'button';
      ok.addEventListener('click', function () {
        panneau.hidden = true;
        panneau.textContent = '';
        etat = 'libre';
      });
      box.appendChild(ok);
      panneau.appendChild(box);
      ok.focus();
    }

    // Creuser au pied du nain mauve : on descend dans la terre d'Altera,
    // et treize pierres precieuses apparaissent, une a une, le long du
    // puits. Treize : la paire de l'Odyssee pour la balise d'Azhrakonr.
    var NB_PIERRES = 13;
    function creuser() {
      etat = 'fiche';
      majBoutons();
      var fosse = el('div', 'ody-fosse');
      var W = 320, H = 200;
      var cvf = el('canvas', 'ody-fosse-cv');
      cvf.width = W; cvf.height = H;
      fosse.appendChild(cvf);
      var compte = el('span', 'ody-fosse-compte', '');
      fosse.appendChild(compte);
      var fin = el('div', 'ody-fosse-fin');
      fin.hidden = true;
      fosse.appendChild(fin);
      scene.appendChild(fosse);
      var x = cvf.getContext('2d');
      x.imageSmoothingEnabled = false;

      var PROF = 1400, DUREE = reduit ? 1500 : 14000;
      var STRATES = [a.palette.sol, a.palette.sol2 || a.palette.sol, '#6a4a32', '#5a3e2a',
                     a.palette.roche, a.palette.rocheOmbre || '#3a3a3a', '#2a2030', '#1c1424'];
      var TEINTES = ['#ff4a6a', '#4ac0ff', '#7cf05a', '#ffd23a', '#c86aff', '#ff8a2a', '#7cf0e8'];
      var pierres = [];
      for (var i = 0; i < NB_PIERRES; i++) {
        pierres.push({ y: 110 + i * ((PROF - 220) / (NB_PIERRES - 1)), cote: i % 2 ? 1 : -1,
                       c: TEINTES[i % TEINTES.length], vue: false, t: 0 });
      }
      var t0 = performance.now(), vues = 0;

      function gemme(px, py, c, eclat) {
        x.fillStyle = '#151822';
        x.fillRect(px - 4, py - 3, 9, 7); x.fillRect(px - 3, py - 4, 7, 9);
        x.fillStyle = c;
        x.fillRect(px - 3, py - 2, 7, 5); x.fillRect(px - 2, py - 3, 5, 7);
        x.fillStyle = 'rgba(255,255,255,.75)';
        x.fillRect(px - 2, py - 2, 2, 2);
        if (eclat > 0) {
          x.fillStyle = 'rgba(255,255,255,' + eclat.toFixed(2) + ')';
          var r = 4 + (1 - eclat) * 10;
          x.fillRect(Math.round(px - r), py, Math.round(r * 2), 1);
          x.fillRect(px, Math.round(py - r), 1, Math.round(r * 2));
        }
      }

      function image(t) {
        if (!vivant() || !fosse.parentNode) return;
        var k = Math.min(1, (t - t0) / DUREE);
        var e = k * k * (3 - 2 * k);
        var fond = e * PROF;                       // la profondeur atteinte
        var camY = Math.max(0, fond - H * 0.6);

        // Les strates, de plus en plus sombres.
        for (var y = 0; y < H; y += 2) {
          var wy = y + camY;
          var si = Math.min(STRATES.length - 1, Math.floor(wy / (PROF / STRATES.length)));
          x.fillStyle = wy < 18 ? '#0d0a18' : STRATES[si];
          x.fillRect(0, y, W, 2);
        }
        // Des cailloux dans la terre, fixes.
        for (var c = 0; c < 70; c++) {
          var cy = (c * 97) % PROF, cxp = (c * 53) % W;
          var sy = cy - camY;
          if (sy < -4 || sy > H) continue;
          x.fillStyle = 'rgba(0,0,0,.22)';
          x.fillRect(cxp, Math.round(sy), 3 + (c % 3), 2);
        }
        // Le puits, creuse jusqu'ou l'on est.
        x.fillStyle = '#0c0812';
        x.fillRect(W / 2 - 22, Math.round(18 - camY), 44, Math.max(0, Math.round(fond - 18)));
        x.fillStyle = 'rgba(0,0,0,.4)';
        x.fillRect(W / 2 - 22, Math.round(18 - camY), 4, Math.max(0, Math.round(fond - 18)));
        x.fillRect(W / 2 + 18, Math.round(18 - camY), 4, Math.max(0, Math.round(fond - 18)));

        // Les pierres, qui se revelent quand le puits les atteint.
        pierres.forEach(function (p) {
          if (!p.vue && fond >= p.y) {
            p.vue = true; p.t = t; vues++;
            compte.textContent = '◆ ' + vues;
            compte.classList.remove('is-tic'); void compte.offsetWidth; compte.classList.add('is-tic');
          }
          if (!p.vue) return;
          var py = Math.round(p.y - camY);
          if (py < -10 || py > H + 10) return;
          var eclat = Math.max(0, 1 - (t - p.t) / 700);
          gemme(Math.round(W / 2 + p.cote * 28), py, p.c, eclat);
        });

        // La pelle, qui creuse au fond du puits.
        var coup = reduit ? 0 : Math.abs(Math.sin(t / 140)) * 6;
        var pc = pelleCanvas();
        x.save();
        x.translate(W / 2 + 4, Math.round(fond - camY - 4 - coup));
        x.rotate(0.3);
        x.drawImage(pc, -pc.width, -pc.height * 2, pc.width * 2, pc.height * 2);
        x.restore();
        // La terre qui gicle.
        if (!reduit && k < 1) {
          for (var m = 0; m < 6; m++) {
            var ph = ((t / 300) + m / 6) % 1;
            x.fillStyle = STRATES[Math.min(STRATES.length - 1, Math.floor(fond / (PROF / STRATES.length)))];
            x.fillRect(Math.round(W / 2 + Math.sin(m * 2.1) * (8 + ph * 20)), Math.round(fond - camY - 6 - Math.sin(ph * 3.14) * 18), 3, 3);
          }
        }

        if (k >= 1 && fin.hidden) finir();
        if (k < 1 || !fin.hidden) requestAnimationFrame(image);
      }
      requestAnimationFrame(image);

      function finir() {
        fin.hidden = false;
        DP.noterCode('azh-pierres');
        fin.appendChild(el('strong', 'ody-fosse-titre', NB_PIERRES + ' PIERRES PRÉCIEUSES'));
        fin.appendChild(el('p', 'ody-fosse-txt', 'Enterrées une à une sous le nain mauve, le long d’un seul puits. Quelqu’un les a comptées avant toi.'));
        var remonter = el('button', 'ody-trouvaille-btn', 'REMONTER');
        remonter.type = 'button';
        remonter.addEventListener('click', function () {
          DP.noterFouille('altera-nain');
          fosse.classList.add('is-sortie');
          plusTard(function () { fosse.remove(); etat = 'libre'; }, reduit ? 0 : 400);
        });
        fin.appendChild(remonter);
        remonter.focus();
      }
    }

    function lancerScan() {
      if (etat !== 'libre' || !cible) return;
      etat = 'scan';
      var sujet = cible.sujet, ref = cible.ref;
      // La boite du sujet a l'ecran : chaque sorte se dessine a sa taille,
      // les pieds sur son point d'attache. Le scan suit la bete si elle
      // bouge, d'ou la reference gardee plutot que sa position.
      var fs = V.feuille(sujet.id);
      var ech = sujet.objet ? 1.1 : sujet.forme ? 2.2 : (sujet.taille || 1) * 0.78;
      var sw = (fs ? fs.L : 40) * ech, sh = (fs ? fs.H : 32) * ech;
      scan = {
        t0: maintenant(), ref: ref, sujet: sujet, w: sw, h: sh,
        dy: (sujet.objet ? 2 : sujet.forme ? 0 : 6) - sh / 2,
        holo: hologramme(fs)
      };
      scene.classList.add('is-scan');
      dire('Analyse en cours…');
      majBoutons();
      plusTard(function () {
        if (!vivant() || etat !== 'scan') return;
        scene.classList.remove('is-scan');
        scan = null;
        var r = DP.noterScan(sujet.id, a.id);
        etat = 'fiche';
        // Dans le systeme stellaire, le lieu remarquable garde les
        // coordonnees d'un monde encore inconnu.
        var revele = null;
        if (r.neuf && sujet.forme && !sujet.objet && a.systeme === 'stellaire') {
          revele = V.prochainStellaire();
          if (revele) DP.noterAstre(revele.id);
        }
        montrerFiche(sujet, r.neuf, r.entree, revele);
      }, reduit ? 200 : SCAN_DUREE);
    }

    // La silhouette du sujet en lumiere du scanner : la meme planche,
    // repeinte d'une seule teinte. Le balayage la revele par-dessus.
    function hologramme(f) {
      if (!f) return null;
      var cv2 = document.createElement('canvas');
      cv2.width = f.L; cv2.height = f.H;
      var x = cv2.getContext('2d');
      if (!x) return null;
      x.drawImage(f.canvas, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = '#7cf0c8';
      x.fillRect(0, 0, f.L, f.H);
      return cv2;
    }

    function montrerFiche(sujet, neuf, entree, revele) {
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
      if (revele) {
        var coord = el('p', 'ody-fiche-coord');
        coord.appendChild(el('span', 'ody-fiche-coord-titre', 'COORDONNÉES RELEVÉES'));
        coord.appendChild(el('strong', 'ody-fiche-coord-code', revele.nom + '  ·  ' + revele.code));
        carte.appendChild(coord);
      }
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
      if (!(etat === 'libre' || etat === 'scan')) return;
      var A = window.ARME;
      var nv = A ? A.niveauJeu('odyssee') : { degats: 6, cadence: 620 };
      var t = maintenant();
      if (t - dernierTir < nv.cadence) return;
      dernierTir = t;
      bruitTir();
      var b = cibleTir;
      var deg = Math.round(nv.degats * (CR ? CR.bonus().degats : 1));
      // Rien dans le viseur : le tir part quand meme, et se perd.
      if (!b) { tirs.push({ t0: t, rate: true }); majBoutons(); return; }
      tirs.push({ t0: t, x: b.x, y: b.y, h: b.sirene ? (b.surface ? 24 : 26) : 12 });
      if (b.sirene) {
        chiffres.push({ t0: t, x: b.x, y: b.y, h: 40, txt: '-' + deg });
        PL.toucher(b, deg);
        majBoutons();
        return;
      }
      b.pv = Math.max(0, b.pv - deg);
      b.touche = t;
      chiffres.push({ t0: t, x: b.x, y: b.y, h: 30, txt: '-' + deg });

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
      chiffres.push({ t0: t, x: b.x, y: b.y, h: 44, txt: '+' + b.f.noyaux + ' ☀', noyau: true });
      dire(b.v.nom + ' abattu.');
      if (CR) gagner(CR.butinBete(b.v, a), b.x, b.y);
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
      b.coup = t;
      subir(b.f.degats, b, t);
    }

    // Un coup recu : le bouclier d'abord, puis les PV. "src" dit d'ou il
    // vient, pour la lueur sur le bord de l'ecran.
    function subir(coup, src, t) {
      t = t || maintenant();
      if (bouclierPV > 0) {
        var absorbe = Math.min(bouclierPV, coup);
        bouclierPV -= absorbe; coup -= absorbe;
        eclats.push({ t0: t, moi: true, bouclier: true });
      }
      pv = Math.max(0, pv - coup);
      dernierCoupRecu = t;
      if (src && src.x != null) {
        var ang = Math.atan2(src.y - balade.chef.y, src.x - balade.chef.x) - balade.chef.ang;
        coupVenu.style.setProperty('--a', (ang * 180 / Math.PI + 90).toFixed(0) + 'deg');
        coupVenu.classList.remove('is-la'); void coupVenu.offsetWidth; coupVenu.classList.add('is-la');
      }
      chiffres.push({ t0: t, moi: true, txt: coup ? '-' + coup : '◈' });
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
      if (PL) PL.arreter();
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

    function reveillerMonstre(projection) {
      if (etat === 'boss') return;
      etat = 'boss';
      majBoutons();
      surgi = { t0: maintenant() };
      dire(projection ? 'Le repaire rejoue ce qu’il a gardé…'
                      : (gardien.textes.reveil || 'Le sol tremble…'));
      scene.classList.add('is-secousse');
      plusTard(function () {
        if (!vivant() || etat !== 'boss') return;
        scene.classList.remove('is-secousse');
        surgi = null;
        var B = window.BOSS;
        if (!B) { etat = 'libre'; return; }
        duel = B.Duel({
          gardien: gardien.id,
          holo: !!projection,
          parent: scene,
          pvJoueur: pv, pvMax: pvMax(),
          surFin: function (r) { pv = r.pvJoueur; majJauge(); },
          surSortie: function (r) {
            duel = null;
            pv = r.pvJoueur;
            majJauge();
            if (r.vaincu) {
              etat = 'libre';
              if (projection) dire('La projection s’éteint. Elle reviendra.');
              else {
                dire(lune ? 'La grotte est silencieuse.' : 'Le repaire est silencieux.');
                ouvrirSuivante();
                if (CR) gagner(CR.butinGardien(a), repaire ? repaire.px : balade.chef.x, repaire ? repaire.py : balade.chef.y);
              }
              majBoutons();
            } else {
              pv = 0;
              ko();
            }
          }
        });
      }, reduit ? 100 : SURGIT_DUREE);
    }

    // Tenir le joystick ne doit pas empecher de tirer ni de scanner : on
    // declenche des l'appui (pointerdown), sans attendre un "click" que
    // le navigateur annule volontiers quand un autre doigt est deja pose.
    function surAppui(bouton, quoi) {
      var vuPointeur = false;
      bouton.addEventListener('pointerdown', function (e) {
        vuPointeur = true;
        e.preventDefault();
        quoi();
      });
      // Repli pour les navigateurs sans evenements de pointeur.
      bouton.addEventListener('click', function () {
        if (vuPointeur) return;
        quoi();
      });
    }
    surAppui(action, lancerScan);
    surAppui(tir, tirer);
    surAppui(recolteB, function () { if (etat === 'libre' && prise) agir(); });
    surAppui(remonterB, function () { if (etat === 'libre' && PL && PL.actif()) PL.remonter(); });
    sacB.addEventListener('click', function () { if (etat === 'libre') ouvrirSac(); });
    surAppui(holo, function () {
      if (etat !== 'libre' || !gardien || !bossBattu()) return;
      reveillerMonstre(true);
    });

    var auClavier = function (e) {
      if (/^[1-9]$/.test(e.key) && etat === 'libre' && CR) { e.preventDefault(); return utiliserBarre(+e.key - 1); }
      if ((e.key === 'e' || e.key === 'E') && etat === 'libre' && prise) { e.preventDefault(); return agir(); }
      if ((e.key === 'r' || e.key === 'R') && etat === 'libre' && PL && PL.actif()) { e.preventDefault(); return PL.remonter(); }
      if ((e.key === 'i' || e.key === 'I' || e.key === 'Tab') && etat === 'libre' && CR) { e.preventDefault(); return ouvrirSac(); }
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
      var plonge = PL && PL.actif();
      if (PL) PL.animer(dt, t, etat === 'libre' && pv > 0);

      betes.forEach(function (b, i) {
        if (b.mort || plonge) return;
        // Prise dans le givre : elle ne bouge ni ne mord.
        if (b.gel > t) return;
        var dx = chefX - b.x, dy = chefY - b.y;
        var d = Math.hypot(dx, dy) || 1;
        var vx = 0, vy = 0, vit = 0;

        if (repulsifJusqua > t && d < 170) {
          vx = -dx / d; vy = -dy / d; vit = b.f.vitesse * 1.1;
        } else if (b.fuite > t) {
          vx = -dx / d; vy = -dy / d; vit = b.f.vitesse * 1.3;
        } else if (b.agressif && chassent && d < 135) {
          // En vue subjective, elle s'arrete a un pas : on la voit mordre
          // au lieu de l'avoir collee aux yeux.
          var pas = 34 + 10 * (b.v.taille || 1);
          if (d > pas) { vx = dx / d; vy = dy / d; vit = b.f.vitesse; }
          if (d < pas + 10 && t - b.coup > 1150) encaisser(b, t);
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

      // On se refait une sante quand plus rien ne mord depuis un moment —
      // plus vite et plus tot avec l'amulette, tout de suite avec l'elixir.
      var rg = CR ? CR.bonus().regen : 1, pm = pvMax();
      if (pv > pm) { pv = pm; majJauge(); }
      if (pv > 0 && pv < pm && etat !== 'boss' && !plonge) {
        if (regenJusqua > t) { pv = Math.min(pm, pv + 14 * dt); majJauge(); }
        else if (t - dernierCoupRecu > (rg > 1 ? 2000 : 4000)) { pv = Math.min(pm, pv + 4 * rg * dt); majJauge(); }
      }
    }

    // --- Ce qu'on peint avec le decor, a sa profondeur ---
    function extras(t) {
      // Sous l'eau, on ne voit plus que ce qui est sous l'eau.
      if (PL && PL.actif()) return PL.extras(t);
      var out = PL ? PL.extras(t) : [];

      // La pelle derriere le cabanon, tant qu'on ne l'a pas prise. Le
      // cabanon lui-meme, ce sont ses murs de planches.
      if (CABANON) {
        if (!DP.aLaPelle()) {
          out.push({ x: PELLE.x, y: PELLE.y,
            dessin: function (ctx, sx, sy) {
              var pc = pelleCanvas();
              ctx.save();
              ctx.imageSmoothingEnabled = false;
              ctx.translate(Math.round(sx), Math.round(sy));
              ctx.rotate(0.25);
              ctx.drawImage(pc, -pc.width / 2, -pc.height + 4);
              ctx.restore();
              // Un reflet sur le fer, de temps en temps.
              if (!reduit && Math.floor(t / 1700) % 3 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,' + (1 - (t % 1700) / 1700).toFixed(2) + ')';
                ctx.fillRect(Math.round(sx) - 2, Math.round(sy) - 4, 3, 1);
              }
            } });
        }
      }

      noeuds.forEach(function (n) {
        if (visite.pris[n.k]) return;
        out.push({ x: n.x, y: n.y + 4, dessin: function (ctx, sx, sy) {
          CR.dessinerNoeud(ctx, sx, sy - 4, n, t, palette, a, prise && prise.n === n);
        } });
      });
      CR.poses(a.id).forEach(function (p) {
        out.push({ x: (p.tx + 0.5) * TS, y: (p.ty + 0.5) * TS + 6, dessin: function (ctx, sx, sy) {
          CR.dessinerPose(ctx, sx, sy - 6, p, t, prise && prise.pose === p);
        } });
      });
      coffres.forEach(function (c) {
        var ouvert = CR.coffreOuvert(c.id), t0 = ouverture[c.id];
        var ouv = t0 ? Math.min(1, (t - t0) / 450) : ouvert ? 1 : 0;
        out.push({ x: c.x, y: c.y + 4, dessin: function (ctx, sx, sy) {
          CR.dessinerCoffre(ctx, sx, sy - 4, c, t, ouv, prise && prise.c === c);
        } });
      });

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

      if (ART) out = out.concat(ART.extras(cachesO, balade && balade.chef, t));

      if (repaire && !lune) {
        // Le repaire, a hauteur d'yeux : une butte de roche percee d'une
        // gueule noire, bordee de la couleur du gardien, des griffures
        // tout autour, et deux yeux qui s'allument tant qu'il vit.
        out.push({
          x: repaire.px, y: repaire.py - 30, sol: 30,
          dessin: function (ctx, sx, sy) {
            var gx = sx, gy = sy + 30, battu = bossBattu();
            var puls = reduit || battu ? 0.5 : 0.5 + 0.5 * Math.sin(t / 500);
            ctx.fillStyle = palette.rocheOmbre;
            ctx.beginPath(); ctx.ellipse(gx, gy, 46, 36, 0, Math.PI, 0); ctx.fill();
            ctx.fillStyle = palette.roche;
            ctx.beginPath(); ctx.ellipse(gx - 4, gy - 2, 40, 31, 0, Math.PI, 0); ctx.fill();
            ctx.fillStyle = palette.rocheHaut;
            ctx.fillRect(Math.round(gx - 30), Math.round(gy - 26), 18, 3);
            ctx.fillRect(Math.round(gx + 6), Math.round(gy - 31), 12, 2);
            ctx.save();
            ctx.globalAlpha = battu ? 0.4 : 0.35 + 0.45 * puls;
            ctx.fillStyle = gardien.c[2];
            ctx.beginPath(); ctx.ellipse(gx, gy, 25, 22, 0, Math.PI, 0); ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#07070a';
            ctx.beginPath(); ctx.ellipse(gx, gy, 21, 19, 0, Math.PI, 0); ctx.fill();
            ctx.strokeStyle = 'rgba(10,10,10,.55)';
            ctx.lineWidth = 2;
            for (var k = 0; k < 5; k++) {
              var an = Math.PI + (k + 0.5) / 5 * Math.PI;
              ctx.beginPath();
              ctx.moveTo(gx + Math.cos(an) * 27, gy + Math.sin(an) * 24);
              ctx.lineTo(gx + Math.cos(an) * 37, gy + Math.sin(an) * 31);
              ctx.stroke();
            }
            if (!battu) {
              var lueur = reduit ? 0.6 : Math.max(0, Math.sin(t / 800)) * 0.95;
              ctx.fillStyle = 'rgba(232,72,58,' + lueur.toFixed(2) + ')';
              ctx.fillRect(Math.round(gx - 9), Math.round(gy - 11), 4, 3);
              ctx.fillRect(Math.round(gx + 5), Math.round(gy - 11), 4, 3);
            }
          }
        });
      }

      betes.forEach(function (b) {
        if (b.mort && t - b.mortT > 700) return;
        out.push({
          x: b.x, y: b.y, echelle: 0.78,
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

    // Le scan, en trois temps : les crochets se referment sur le sujet,
    // le faisceau le balaie de haut en bas puis de bas en haut en
    // revelant sa silhouette, et l'eclat final renvoie le releve vers le
    // Teleportail.
    function dessinerScan(ctx, V, t) {
      var k = Math.min(1, (t - scan.t0) / (reduit ? 200 : SCAN_DUREE));
      // Le sujet, la ou il est a l'ecran : sa taille suit sa distance. Le
      // faisceau part du scanner, dans la main gauche.
      var pr = V.projeter(scan.ref.x, scan.ref.y, -scan.dy);
      if (!pr) return;
      var w = Math.max(6, scan.w * pr.s), h = Math.max(6, scan.h * pr.s);
      var bx = pr.x, by = pr.y;
      var ox = mainG.x, oy = mainG.y;
      var verrou = Math.min(1, k / 0.14);
      var lect = Math.max(0, Math.min(1, (k - 0.14) / 0.68));
      var fin = Math.max(0, (k - 0.82) / 0.18);
      var aller = lect * 2 <= 1;
      var ping = aller ? lect * 2 : 2 - lect * 2;
      var gauche = bx - w / 2, haut = by - h / 2, ly = haut + h * ping;
      var VERT = '124,240,200', i;

      ctx.save();

      // Le faisceau : un cone qui part du Teleportail et s'ouvre sur la
      // ligne de lecture. Il tremble un peu, comme une lampe.
      if (lect > 0 && fin < 1) {
        var g = ctx.createLinearGradient(ox, oy, bx, ly);
        g.addColorStop(0, 'rgba(' + VERT + ',.6)');
        g.addColorStop(1, 'rgba(' + VERT + ',.08)');
        ctx.globalAlpha = (1 - fin) * (0.75 + 0.25 * Math.sin(t / 38));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(ox, oy); ctx.lineTo(gauche - 3, ly); ctx.lineTo(gauche + w + 3, ly);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // La silhouette, revelee par le balayage : a l'aller, seulement ce
      // que la ligne a deja couvert ; au retour, tout, et plus net.
      if (scan.holo && lect > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(gauche - 2, haut - 2, w + 4, aller ? h * ping + 2 : h + 4);
        ctx.clip();
        ctx.imageSmoothingEnabled = false;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (aller ? 0.45 : 0.45 + 0.3 * (1 - ping)) * (1 - fin * 0.5) + fin * 0.5;
        ctx.drawImage(scan.holo, Math.round(gauche), Math.round(haut), w, h);
        ctx.globalCompositeOperation = 'source-over';
        // La trame : des lignes fines qui defilent sur la silhouette.
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = '#04201a';
        for (var yy = Math.floor(haut) + (Math.floor(t / 60) % 3); yy < haut + h; yy += 3) {
          ctx.fillRect(gauche, yy, w, 1);
        }
        ctx.restore();
      }

      // La ligne de lecture, et son halo.
      if (lect > 0 && lect < 1) {
        ctx.fillStyle = 'rgba(' + VERT + ',.25)';
        ctx.fillRect(gauche - 5, ly - 3, w + 10, 6);
        ctx.fillStyle = '#eafff8';
        ctx.fillRect(gauche - 5, Math.round(ly), w + 10, 1);
      }

      // Les quatre crochets : ils arrivent de loin et se serrent.
      var marge = 4 + (1 - verrou) * (1 - verrou) * 30 + Math.sin(t / 130) * (verrou >= 1 ? 1 : 0);
      var cl = gauche - marge, ct = haut - marge, cw = w + marge * 2, chh = h + marge * 2, L = 7;
      ctx.globalAlpha = Math.min(1, verrou * 1.5) * (1 - fin);
      ctx.strokeStyle = verrou < 1 ? '#eafff8' : 'rgb(' + VERT + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cl, ct + L); ctx.lineTo(cl, ct); ctx.lineTo(cl + L, ct);
      ctx.moveTo(cl + cw - L, ct); ctx.lineTo(cl + cw, ct); ctx.lineTo(cl + cw, ct + L);
      ctx.moveTo(cl + cw, ct + chh - L); ctx.lineTo(cl + cw, ct + chh); ctx.lineTo(cl + cw - L, ct + chh);
      ctx.moveTo(cl + L, ct + chh); ctx.lineTo(cl, ct + chh); ctx.lineTo(cl, ct + chh - L);
      ctx.stroke();

      // L'anneau de mesure : des graduations qui tournent, et l'arc de
      // progression qui se ferme.
      var ray = Math.max(w, h) * 0.5 + 12;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(' + VERT + ',.55)';
      ctx.setLineDash([2, 5]);
      ctx.lineDashOffset = -t / 28;
      ctx.beginPath(); ctx.arc(bx, by, ray, 0, 6.283); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(' + VERT + ')';
      ctx.beginPath(); ctx.arc(bx, by, ray + 4, -1.571, -1.571 + Math.min(1, k / 0.82) * 6.283); ctx.stroke();

      // Le releve : le pourcentage, et trois lignes de mesures qui defilent.
      ctx.globalAlpha = (1 - fin) * Math.min(1, verrou * 2);
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#eafff8';
      ctx.fillText('ANALYSE ' + Math.round(Math.min(1, k / 0.82) * 100) + ' %', bx, by + ray + 16);
      ctx.textAlign = 'left';
      ctx.font = '7px "Courier New", monospace';
      ctx.fillStyle = 'rgba(' + VERT + ',.9)';
      var pas = Math.floor(t / 90), HEX = '0123456789ABCDEF';
      for (i = 0; i < 3; i++) {
        if (lect < i / 3) continue;
        var mot = '';
        for (var c = 0; c < 6; c++) mot += HEX[(pas * (7 + i * 3) + c * 11 + i * 5) % 16];
        ctx.fillText(mot, bx + ray + 9, by - 8 + i * 9);
      }

      // L'eclat final : un anneau qui s'ouvre, la silhouette qui blanchit,
      // et le releve qui file vers le Teleportail.
      if (fin > 0) {
        ctx.globalAlpha = 1 - fin;
        ctx.strokeStyle = '#eafff8';
        ctx.lineWidth = 3 - fin * 2;
        ctx.beginPath(); ctx.arc(bx, by, ray + fin * 34, 0, 6.283); ctx.stroke();
        ctx.fillStyle = '#eafff8';
        for (i = 0; i < 9; i++) {
          var dep = i / 9 * 6.283, u = Math.min(1, fin * 1.25);
          var px = bx + Math.cos(dep) * ray * (1 - u), py = by + Math.sin(dep) * ray * (1 - u);
          ctx.globalAlpha = 1 - fin * 0.4;
          ctx.fillRect(Math.round(px + (ox - bx) * u * u) - 1, Math.round(py + (oy - by) * u * u) - 1, 2, 2);
        }
      }

      ctx.restore();
      ctx.textAlign = 'left';
    }

    // --- Par-dessus tout : le monstre, les effets, les tirs, le scan, les
    // chiffres, et les mains du voyageur ---
    var mainG = { x: 60, y: 170 }, mainD = { x: 200, y: 165 };
    function apres(ctx, V, t) {
      var i, W = V.L, H = V.H;
      ctx.imageSmoothingEnabled = false;

      // Le monstre qui sort : la poussiere, puis la tete, gueule ouverte.
      if (surgi) {
        var ks = Math.min(1, (t - surgi.t0) / SURGIT_DUREE);
        var pg = V.projeter(repaire.x * TS, repaire.y * TS, 0);
        if (pg) {
          for (i = 0; i < 16; i++) {
            var ph = (ks * 1.6 + i / 16) % 1;
            ctx.fillStyle = 'rgba(160,160,150,' + (0.5 * (1 - ph)).toFixed(2) + ')';
            ctx.beginPath();
            ctx.arc(pg.x + Math.cos(i * 2.4) * (20 + ph * 60) * pg.s, pg.y - (ph * 30) * pg.s,
                    (4 + ph * 10) * pg.s, 0, 6.3);
            ctx.fill();
          }
          var B = window.BOSS;
          var fm = B && B.feuille(gardien.id, ks > 0.55);
          if (fm) {
            var montee = Math.min(1, ks * 1.35);
            // Il surgit grand, mais on doit encore le voir en entier.
            var e2 = Math.min((0.35 + montee * 0.55) * pg.s, H * 0.95 / fm.H);
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, W, pg.y); ctx.clip();
            ctx.drawImage(fm.canvas, pg.x - fm.L * e2 / 2, pg.y + 10 * pg.s - fm.H * e2 * montee, fm.L * e2, fm.H * e2);
            ctx.restore();
          }
        }
        if (ks > 0.8) {
          ctx.fillStyle = 'rgba(20,4,4,' + ((ks - 0.8) / 0.2 * 0.9).toFixed(2) + ')';
          ctx.fillRect(0, 0, W, H);
        }
      }

      effets(ctx, V, t);
      if (PL) PL.apres(ctx, V, t);

      // Les tirs : un trait du canon vers la cible, un eclat au bout.
      for (i = tirs.length - 1; i >= 0; i--) {
        var r = tirs[i], ag = Math.max(0, (t - r.t0) / 170);
        if (ag >= 1) { tirs.splice(i, 1); continue; }
        var fin = r.rate ? { x: W / 2, y: V.hor(), s: 0.2 } : V.projeter(r.x, r.y, r.h);
        if (!fin) continue;
        ctx.strokeStyle = 'rgba(124,240,255,' + (1 - ag).toFixed(2) + ')';
        ctx.lineWidth = 2.5 - ag * 1.5;
        ctx.beginPath(); ctx.moveTo(mainD.x, mainD.y); ctx.lineTo(fin.x, fin.y); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,120,' + (1 - ag).toFixed(2) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(fin.x, fin.y, (3 + ag * 10) * Math.max(0.4, Math.min(2, fin.s)), 0, 6.3); ctx.stroke();
      }

      if (scan) dessinerScan(ctx, V, t);

      // Les chiffres : au-dessus de ce qui a ete touche ; les notres, en
      // bas, au milieu.
      ctx.textAlign = 'center';
      for (i = chiffres.length - 1; i >= 0; i--) {
        var c = chiffres[i], ac = Math.max(0, (t - c.t0) / 900);
        if (ac >= 1) { chiffres.splice(i, 1); continue; }
        var px, py, taille = 11;
        if (c.moi) { px = W / 2; py = H * 0.7 - ac * 18; taille = 13; }
        else {
          var pc = V.projeter(c.x, c.y, (c.h || 24) + ac * 14);
          if (!pc) continue;
          px = pc.x; py = pc.y;
          taille = Math.max(8, Math.min(16, Math.round(7 + pc.s * 4)));
        }
        ctx.font = 'bold ' + taille + 'px "Courier New", monospace';
        ctx.fillStyle = 'rgba(0,0,0,' + (0.6 * (1 - ac)).toFixed(2) + ')';
        ctx.fillText(c.txt, px + 1, py + 1);
        ctx.fillStyle = c.moi ? 'rgba(255,90,74,' + (1 - ac).toFixed(2) + ')'
          : c.noyau ? 'rgba(255,209,102,' + (1 - ac).toFixed(2) + ')'
          : 'rgba(255,236,200,' + (1 - ac).toFixed(2) + ')';
        ctx.fillText(c.txt, px, py);
      }
      ctx.textAlign = 'left';

      mains(ctx, V, t);
    }

    // Les mains : le scanner a gauche, le pistolet a droite. Ils
    // balancent au pas ; le pistolet recule au tir et crache un eclair.
    var imgArme = null, imgArmeSrc = '', imgScan = null;
    function chargerImages() {
      var A = window.ARME;
      var src = A ? A.url(null, DP.armeNiveau('odyssee')) : '';
      if (src && src !== imgArmeSrc) { imgArmeSrc = src; imgArme = new Image(); imgArme.src = src; }
      if (!imgScan) { imgScan = new Image(); imgScan.src = visuelScanneur(); }
    }
    function mains(ctx, V, t) {
      var W = V.L, H = V.H, ch = balade.chef;
      chargerImages();
      var pas = reduit ? 0 : ch.pas, bouge = ch.bouge && !reduit;
      var bx = bouge ? Math.sin(pas * 0.5) * 4 : 0;
      var by = bouge ? Math.abs(Math.cos(pas * 0.5)) * 4 : (reduit ? 0 : Math.sin(t / 900) * 1.2);
      var plonge = PL && PL.actif();
      if (plonge && !reduit) { bx += Math.sin(t / 700) * 3; by += Math.sin(t / 520) * 2; }

      // Le scanner, dans la main gauche : il se leve quand on scanne.
      if (imgScan && imgScan.complete && imgScan.naturalWidth) {
        var sh = Math.round(H * 0.3), sw = Math.round(sh * imgScan.naturalWidth / imgScan.naturalHeight);
        var scanne = etat === 'scan';
        var sx = Math.round(W * 0.06 - bx * 0.6), sy = Math.round(H - sh * (scanne ? 0.95 : 0.72) + by);
        ctx.save();
        ctx.translate(sx + sw / 2, sy + sh / 2);
        ctx.rotate(scanne ? -0.05 : 0.12);
        ctx.drawImage(imgScan, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();
        mainG.x = sx + sw * 0.55; mainG.y = sy + sh * 0.15;
        if (scanne) {
          ctx.fillStyle = 'rgba(124,240,200,' + (0.35 + 0.25 * Math.sin(t / 60)).toFixed(2) + ')';
          ctx.beginPath(); ctx.arc(mainG.x, mainG.y, 6, 0, 6.3); ctx.fill();
        }
      }

      // Le pistolet, tenu de la main droite, canon vers le centre.
      if (DP.aLArme() && imgArme && imgArme.complete && imgArme.naturalWidth) {
        var A = window.ARME;
        var cad = A ? A.niveauJeu('odyssee').cadence : 620;
        var kr = Math.max(0, 1 - (maintenant() - dernierTir) / Math.min(220, cad));
        var aw = Math.round(W * 0.36), ah = Math.round(aw * imgArme.naturalHeight / imgArme.naturalWidth);
        var ax = Math.round(W * 0.6 + bx + kr * 10), ay = Math.round(H - ah * 0.78 + by + kr * 12);
        ctx.save();
        ctx.translate(ax + aw / 2, ay + ah / 2);
        ctx.rotate(-0.18 - kr * 0.22);
        ctx.scale(-1, 1);
        ctx.drawImage(imgArme, -aw / 2, -ah / 2, aw, ah);
        ctx.restore();
        mainD.x = ax + aw * 0.06; mainD.y = ay + ah * 0.2;
        // L'eclair au bout du canon.
        if (kr > 0.45) {
          var e = (kr - 0.45) / 0.55, R = 6 + e * 9;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(124,240,255,' + (0.6 * e).toFixed(2) + ')';
          ctx.beginPath(); ctx.arc(mainD.x, mainD.y, R, 0, 6.3); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,' + e.toFixed(2) + ')';
          ctx.fillRect(Math.round(mainD.x - R), Math.round(mainD.y), Math.round(R * 2), 1);
          ctx.fillRect(Math.round(mainD.x), Math.round(mainD.y - R), 1, Math.round(R * 2));
          ctx.restore();
        }
      } else {
        mainD.x = W * 0.62; mainD.y = H * 0.85;
      }
    }

    // Le claquement du pistolet : une note carree qui degringole, et un
    // souffle de bruit.
    function bruitTir() {
      var MJ = window.MUSIQUE_JEUX, A = MJ && MJ.audio ? MJ.audio() : null;
      if (!A) return;
      var ac = A.ac, t = ac.currentTime;
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(1300, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g); g.connect(A.sortie);
      o.start(t); o.stop(t + 0.15);
      var b = ac.createBufferSource(), f = ac.createBiquadFilter(), gb = ac.createGain();
      b.buffer = A.bruit; f.type = 'highpass'; f.frequency.value = 2500;
      gb.gain.setValueAtTime(0.18, t); gb.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      b.connect(f); f.connect(gb); gb.connect(A.sortie);
      b.start(t, Math.random() * 0.5); b.stop(t + 0.09);
    }

    // ==========================================================
    //  La recolte, les coffres, les outils, le sac
    // ==========================================================

    // Ce qu'on a a portee : un noeud, un coffre ferme, ou la roche et le
    // cristal qu'on a juste devant soi, si l'on a l'outil.
    function chercherPrise() {
      var mieux = null, d0 = 40;
      noeuds.forEach(function (n) {
        if (visite.pris[n.k]) return;
        var d = aPortee(n.x, n.y, 40);
        if (d != null && d < d0) { d0 = d; mieux = { n: n, quoi: 'RÉCOLTER' }; }
      });
      coffres.forEach(function (c) {
        if (CR.coffreOuvert(c.id) || ouverture[c.id]) return;
        var d = aPortee(c.x, c.y, 44);
        if (d != null && d < d0 + 6) { d0 = d; mieux = { c: c, quoi: 'OUVRIR' }; }
      });
      CR.poses(a.id).forEach(function (p) {
        var px = (p.tx + 0.5) * TS, py = (p.ty + 0.5) * TS;
        var d = aPortee(px, py, 46);
        if (d != null && d < d0 + 6) { d0 = d; mieux = { pose: p, quoi: p.id === 'four' ? 'FOUR' : 'ÉTABLI' }; }
      });
      if (mieux) return mieux;
      var dv = balade.caseDevant(), tx = dv[0], ty = dv[1];
      if (tx < 2 || ty < 2 || tx >= MW - 2 || ty >= MH - 2) return null;
      var tu = g[ty][tx];
      if (tu === T.ROCHE_A && CR.aOutil('pioche')) return { tx: tx, ty: ty, quoi: 'MINER', type: 'roche' };
      if (tu === T.CRISTAL && CR.aOutil('foreuse')) return { tx: tx, ty: ty, quoi: 'FORER', type: 'cristal' };
      // Une grande plante se coupe, a la hache ou a mains nues.
      if (tu === T.PLANTE) return { tx: tx, ty: ty, quoi: 'COUPER', type: 'plante' };
      return null;
    }

    // Pres d'une poche scellee, sans l'outil qui l'ouvre : un mot, pour
    // qu'on sache qu'il y a quelque chose derriere.
    function indiceBarriere() {
      if (!CR) return null;
      var ch = balade.chef, TXT = {
        pioche: 'Ces rochers forment un cercle trop parfait. Une pioche passerait.',
        foreuse: 'Un anneau de cristal, et quelque chose qui brille au milieu. Il faudrait une foreuse.',
        bottes: 'Un îlot au milieu du liquide. Il faudrait pouvoir marcher dessus.'
      };
      for (var i = 0; i < coffres.length; i++) {
        var c = coffres[i];
        if (!c.scelle || CR.coffreOuvert(c.id) || CR.aOutil(c.outil)) continue;
        if (Math.hypot(c.x - ch.x, c.y - ch.y) < 5 * TS) return TXT[c.outil];
      }
      return null;
    }

    function agir() {
      if (!prise || etat !== 'libre') return;
      if (prise.plonge) {
        if (PL.interdit()) direPour(PL.interdit(), 3000);
        else PL.plonger(prise.plonge.tx, prise.plonge.ty);
      }
      else if (prise.coq) PL.ouvrir(prise.coq);
      else if (prise.n) recolter(prise.n);
      else if (prise.c) ouvrirCoffre(prise.c);
      else if (prise.pose) ouvrirSac(prise.pose);
      else casser(prise.tx, prise.ty, prise.type);
      prise = null;
      majBoutons();
    }

    // Met une liste dans le sac, et montre ce qui y est entre : les icones
    // s'envolent du point de recolte, les bandeaux s'empilent.
    function gagner(liste, x, y) {
      if (!liste.length) return { pris: [], laisse: [], reliques: [] };
      var r = CR.empocher(liste), t = maintenant();
      r.pris.forEach(function (gg, i) {
        envols.push({ t0: t + i * 90, id: gg.id, x: x, y: y - 8, dx: (i - (r.pris.length - 1) / 2) * 12 });
      });
      CR.annoncer(scene, r.pris, r.laisse.length > 0);
      devoilerReliques(r.reliques);
      return r;
    }

    // Les reliques trouvees, une a une, au milieu de l'ecran.
    function devoilerReliques(liste) {
      if (!liste.length) return;
      var avant = etat;
      etat = 'fiche';
      majBoutons();
      (function suivante(i) {
        if (i >= liste.length) { etat = avant === 'fiche' ? 'libre' : avant; majBoutons(); return; }
        CR.devoiler(scene, liste[i], function () { suivante(i + 1); });
      })(0);
    }

    function recolter(n) {
      var liste = CR.recolte(n.type, a);
      if (!CR.rentre(liste.slice(0, 1))) { CR.annoncer(scene, [], true); dire('Ton sac est plein. Ouvre-le pour faire de la place.'); return; }
      visite.pris[n.k] = true;
      var t = maintenant();
      for (var i = 0; i < 8; i++) eclats.push({ t0: t, x: n.x, y: n.y - 4, a: i * 0.785, couleur: n.type === 'plante' ? palette.flore2 : '#fff2c8' });
      gagner(liste, n.x, n.y);
    }

    function ouvrirCoffre(c) {
      var contenu = CR.contenuCoffre(c, a);
      if (!CR.rentre(contenu)) {
        CR.annoncer(scene, [], true);
        dire('Ton sac est trop plein pour vider ce coffre. Fais de la place et reviens.');
        return;
      }
      CR.marquerCoffre(c.id);
      ouverture[c.id] = maintenant();
      dire(c.scelle ? 'Le sceau cède. Le coffre s’ouvre.' : 'Le coffre grince, puis s’ouvre.');
      plusTard(function () {
        if (!vivant()) return;
        var t = maintenant();
        for (var i = 0; i < 14; i++) eclats.push({ t0: t, x: c.x, y: c.y - 10, a: i * 0.45, couleur: c.scelle ? '#ff9ae0' : '#fff0a0', loin: 1.6 });
        gagner(contenu, c.x, c.y - 6);
      }, reduit ? 50 : 480);
    }

    // La pioche casse un rocher, la foreuse un cristal : la case devient
    // des gravats, et ce qui en sort tombe dans le sac.
    function casser(tx, ty, type) {
      // L'outil qui sert : il s'use d'un cran, et peut casser. A mains
      // nues, on coupe une plante, mais elle donne moins.
      var outil = CR.user(type === 'roche' ? 'pioche' : type === 'cristal' ? 'foreuse' : 'hache');
      if (!outil && type !== 'plante') return;
      var reste = type === 'plante' ? T.FLORE : T.GRAVATS;
      g[ty][tx] = reste;
      visite.modifs.push([tx, ty, reste]);
      if (balade.repeindre) balade.repeindre(tx, ty);
      else M.repeindre(balade.monde, g, tx, ty, optsCarte);
      miniBase = null;
      var x = (tx + 0.5) * TS, y = (ty + 0.5) * TS, t = maintenant();
      for (var i = 0; i < 12; i++) {
        eclats.push({ t0: t, x: x, y: y - 6, a: i * 0.52, loin: 1.2, gros: true,
                      couleur: type === 'roche' ? palette.rocheHaut : type === 'cristal' ? palette.cristal2 : (palette.flore2 || '#8ac85a') });
      }
      scene.classList.remove('is-coup');
      void scene.offsetWidth;
      scene.classList.add('is-coup');
      var rang = outil ? outil.rang : 0;
      gagner(type === 'plante' ? CR.recolte('grande-plante', a, { style: palette.plante, rang: rang })
                               : CR.recolte(type, a, { rang: rang }), x, y);
      if (outil && outil.brise) briser(outil.o, x, y);
    }

    // Un outil a bout : il se fend en eclats, et on le dit.
    function briser(o, x, y) {
      var t = maintenant();
      for (var i = 0; i < 10; i++) eclats.push({ t0: t, x: x, y: y - 12, a: i * 0.63, couleur: o.c[0], loin: 1.4, gros: true });
      CR.annoncerBris(scene, o);
      dire(o.nom + ' s’est brisé. Répare-le avant : un outil abîmé et son matériau, dans la grille.');
    }

    // Poser une station (etabli, four) sur la case devant soi.
    function poserStation(id) {
      var dv = balade.caseDevant(), tx = dv[0], ty = dv[1];
      if (tx < 2 || ty < 2 || tx >= MW - 2 || ty >= MH - 2) return 'Pas ici : trop près du bord.';
      var tu = g[ty][tx];
      if (M.BLOQUANT[tu] || tu === T.LIQUIDE) return 'Il faut une case libre devant toi pour la poser.';
      var x = (tx + 0.5) * TS, y = (ty + 0.5) * TS;
      var encombre = CR.poses(a.id).some(function (p) { return Math.abs(p.tx - tx) + Math.abs(p.ty - ty) < 2; }) ||
        coffres.some(function (c) { return Math.hypot(c.x - x, c.y - y) < TS; }) ||
        noeuds.some(function (n) { return !visite.pris[n.k] && Math.hypot(n.x - x, n.y - y) < TS * 0.8; });
      if (encombre) return 'Il y a déjà quelque chose ici.';
      if (!CR.poser(a.id, id, tx, ty)) return 'Impossible de la poser.';
      var t = maintenant();
      for (var i = 0; i < 12; i++) eclats.push({ t0: t, x: x, y: y - 4, a: i * 0.52, couleur: '#fff2c8', loin: 1.3 });
      scene.classList.remove('is-coup');
      void scene.offsetWidth;
      scene.classList.add('is-coup');
      dire(id === 'four' ? 'Le four est posé. Approche-toi pour y faire cuire quelque chose.'
                         : 'L’établi est posé. À côté de lui, la grille passe à 3 × 3.');
      miniBase = null;
      return true;
    }

    // ---------- La barre rapide ----------
    function majBarre() {
      if (!CR) return;
      var sac = CR.etat(), cases = sac.cases.slice(0, CR.BARRE);
      var sig = JSON.stringify(cases) + etat;
      if (sig === signatureBarre) return;
      signatureBarre = sig;
      barre.textContent = '';
      barre.classList.toggle('is-cachee', etat === 'sac' || etat === 'ko');
      for (var i = 0; i < CR.BARRE; i++) {
        (function (i) {
          var c = cases[i], b = el('button', 'ody-barre-case' + (c ? '' : ' is-vide'));
          b.type = 'button';
          b.appendChild(el('span', 'ody-barre-touche', String(i + 1)));
          if (c) {
            var o = CR.objet(c.id);
            b.appendChild(CR.imgIcone(c.id, 'ody-barre-ic'));
            if (c.n > 1) b.appendChild(el('span', 'ody-barre-n', String(c.n)));
            if (o.dur && c.u != null && c.u < o.dur) {
              var u = el('span', 'ody-barre-usure'), plein = el('i'), k = c.u / o.dur;
              plein.style.width = Math.round(k * 100) + '%';
              plein.style.background = k > 0.5 ? '#5ad06a' : k > 0.2 ? '#ffd23a' : '#ff5a4a';
              u.appendChild(plein); b.appendChild(u);
            }
            if (o.cat === 'conso' || o.cat === 'repas') b.classList.add('is-utilisable');
            // Au survol : le nom et la description, au-dessus de la barre.
            b.addEventListener('pointerenter', function (e) {
              if (e.pointerType !== 'mouse') return;
              barreBulle.textContent = '';
              barreBulle.appendChild(el('strong', null, o.nom + (c.n > 1 ? '  ×' + c.n : '')));
              barreBulle.appendChild(el('span', null, o.desc));
              if (o.dur && c.u != null) barreBulle.appendChild(el('em', null, 'Usure : ' + c.u + ' / ' + o.dur));
              if (o.cat === 'conso' || o.cat === 'repas') barreBulle.appendChild(el('em', null, 'Touche ' + (i + 1) + ' ou clic : ' + (o.cat === 'repas' ? 'manger' : 'utiliser')));
              barreBulle.hidden = false;
            });
            b.addEventListener('pointerleave', function () { barreBulle.hidden = true; });
          }
          b.addEventListener('click', function () { barreBulle.hidden = true; utiliserBarre(i); });
          barre.appendChild(b);
        })(i);
      }
    }

    // Utiliser la case i de la barre : un soin, un repas, une bombe... Le
    // reste ouvre le sac.
    function utiliserBarre(i) {
      if (!CR || etat !== 'libre') return;
      var sac = CR.etat(), c = sac.cases[i], o = c && CR.objet(c.id);
      if (!o || !(o.cat === 'conso' || o.cat === 'repas')) return ouvrirSac();
      var dit = utiliser(o);
      if (dit === false) return;
      c.n--;
      if (c.n <= 0) sac.cases[i] = null;
      CR.sauver();
      if (dit) dire(dit);
      signatureBarre = '';
      majBarre();
      // Un petit eclat sur la case.
      var nd = barre.children[i];
      if (nd) { nd.classList.add('is-utilise'); setTimeout(function () { nd.classList.remove('is-utilise'); }, 400); }
    }

    // ---------- Le sac ----------
    function ouvrirSac(pose) {
      if (!CR || etat !== 'libre') return;
      etat = 'sac';
      majBoutons();
      CR.ouvrir({
        scene: scene,
        dire: dire,
        maj: function () { majJauge(); },
        fermer: function () { if (etat === 'sac') etat = 'libre'; majJauge(); majBoutons(); },
        utiliser: utiliser,
        poser: poserStation
      }, { station: pose ? pose.id : null, pose: pose || null, astre: a });
    }

    // Les consommables. Rend le texte a afficher, ou false si l'objet ne
    // sert a rien maintenant (on ne le gaspille pas).
    function utiliser(o) {
      var t = maintenant(), pm = pvMax();
      if (o.soin) {
        if (pv >= pm && !o.regen) { dire('Tu es déjà en pleine forme.'); return false; }
        pv = Math.min(pm, pv + o.soin);
        if (o.regen) regenJusqua = t + o.regen * 1000;
        majJauge();
        for (var i = 0; i < 10; i++) eclats.push({ t0: t, moi: true, a: i * 0.63, couleur: '#7af0a8' });
        return o.nom + ' : tu te sens mieux.';
      }
      if (o.bouclier) {
        bouclierPV += o.bouclier;
        majJauge();
        eclats.push({ t0: t, moi: true, bouclier: true });
        return 'Un bouclier crépite autour de toi.';
      }
      if (o.bombe || o.givre) {
        var touchees = 0;
        betes.forEach(function (b) {
          if (b.mort || Math.hypot(b.x - balade.chef.x, b.y - balade.chef.y) > 120) return;
          touchees++;
          if (o.givre) { b.gel = t + o.givre * 1000; return; }
          b.pv = Math.max(0, b.pv - o.bombe);
          b.touche = t;
          b.agressif = true;
          chiffres.push({ t0: t, x: b.x, y: b.y, h: 30, txt: '-' + o.bombe });
          if (b.pv <= 0) abattre(b, t);
        });
        explosions.push({ t0: t, moi: true, givre: !!o.givre });
        scene.classList.remove('is-coup');
        void scene.offsetWidth;
        scene.classList.add('is-coup');
        return touchees ? (o.givre ? 'Le givre fige ' + touchees + ' créature' + (touchees > 1 ? 's' : '') + '.'
                                   : 'BOUM. ' + touchees + ' créature' + (touchees > 1 ? 's' : '') + ' touchée' + (touchees > 1 ? 's' : '') + '.')
                        : (o.givre ? 'Le givre se perd dans le vide.' : 'BOUM. Rien n’était assez près.');
      }
      if (o.bouchons) {
        if (!PL) return false;
        PL.proteger(o.bouchons * 1000);
        return 'Bouchons en place : plus aucun chant ne passe.';
      }
      if (o.air) {
        if (!PL || !PL.actif()) { dire('Ça ne sert que sous l’eau.'); return false; }
        PL.air(o.air);
        return 'Une grande bouffée d’air.';
      }
      if (o.repulsif) {
        repulsifJusqua = t + o.repulsif * 1000;
        return 'Une odeur âcre : rien ne veut s’approcher de toi.';
      }
      return null;
    }

    // ---------- Les effets ----------
    // Ce qui arrive dans le monde est projete a sa place ; ce qui arrive
    // au voyageur lui-meme (un soin, le bouclier, une bombe a ses pieds)
    // se voit sur l'ecran entier.
    function effets(ctx, V, t) {
      var i, W = V.L, H = V.H;
      // Les betes prises dans le givre.
      betes.forEach(function (b) {
        if (b.mort || !(b.gel > t)) return;
        var p = V.projeter(b.x, b.y, 12);
        if (!p || !V.visible(p.x, p.d)) return;
        var l = 24 * p.s;
        ctx.fillStyle = 'rgba(170,225,255,.45)';
        ctx.fillRect(Math.round(p.x - l / 2), Math.round(p.y - l / 2), Math.round(l), Math.round(l));
        ctx.fillStyle = 'rgba(255,255,255,.8)';
        ctx.fillRect(Math.round(p.x - l * 0.4), Math.round(p.y - l * 0.4), Math.max(1, Math.round(3 * p.s)), 1);
      });
      // Le bouclier : un lisere bleu qui palpite au bord de l'ecran.
      if (bouclierPV > 0) {
        ctx.strokeStyle = 'rgba(120,190,255,' + (reduit ? 0.5 : 0.35 + 0.2 * Math.sin(t / 160)).toFixed(2) + ')';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, W - 4, H - 4);
      }
      // Le repulsif : un voile jaune, sur les bords.
      if (repulsifJusqua > t) {
        var gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7);
        gr.addColorStop(0, 'rgba(220,210,60,0)');
        gr.addColorStop(1, 'rgba(220,210,60,.22)');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      }
      // Les explosions : a nos pieds, l'ecran entier s'embrase.
      for (i = explosions.length - 1; i >= 0; i--) {
        var ex = explosions[i], k = (t - ex.t0) / 600;
        if (k >= 1) { explosions.splice(i, 1); continue; }
        var col = ex.givre ? '170,225,255' : '255,170,60';
        ctx.fillStyle = 'rgba(' + col + ',' + (0.45 * (1 - k)).toFixed(2) + ')';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k).toFixed(2) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(W / 2, H * 0.8, 20 + k * W * 0.6, 6 + k * H * 0.25, 0, 0, 6.3); ctx.stroke();
      }
      // Les eclats : des pixels qui jaillissent et retombent.
      for (i = eclats.length - 1; i >= 0; i--) {
        var e = eclats[i], ke = (t - e.t0) / 520;
        if (ke < 0) continue;
        if (ke >= 1) { eclats.splice(i, 1); continue; }
        if (e.bouclier) {
          ctx.strokeStyle = 'rgba(160,210,255,' + (1 - ke).toFixed(2) + ')';
          ctx.lineWidth = 3;
          ctx.strokeRect(4 + ke * 10, 4 + ke * 10, W - 8 - ke * 20, H - 8 - ke * 20);
          continue;
        }
        ctx.fillStyle = e.couleur;
        ctx.globalAlpha = 1 - ke;
        if (e.moi) {
          // Un soin : des etincelles qui montent devant les yeux.
          var mx = W / 2 + Math.cos(e.a) * W * 0.3 * ke, my = H * 0.8 - ke * H * 0.4 + Math.sin(e.a) * 10;
          ctx.fillRect(Math.round(mx), Math.round(my), 3, 3);
        } else {
          var dist = (e.loin || 1) * 22 * ke;
          var p2 = V.projeter(e.x + Math.cos(e.a) * dist, e.y + Math.sin(e.a) * dist,
                              10 + Math.sin(ke * Math.PI) * 14 - ke * ke * 6);
          if (p2 && V.visible(p2.x, p2.d)) {
            var tl = Math.max(1, Math.round((e.gros ? 3 : 2) * p2.s));
            ctx.fillRect(Math.round(p2.x), Math.round(p2.y), tl, tl);
          }
        }
        ctx.globalAlpha = 1;
      }
      // Les icones gagnees : elles sautent de la ou on les a prises, puis
      // filent vers la barre, en bas.
      for (i = envols.length - 1; i >= 0; i--) {
        var v = envols[i], kv = (t - v.t0) / 900;
        if (kv < 0) continue;
        if (kv >= 1) { envols.splice(i, 1); continue; }
        var ic = CR.icone(v.id);
        var p3 = V.projeter(v.x, v.y, 14);
        var dep = p3 || { x: W / 2, y: H / 2, s: 1 };
        var u = Math.max(0, (kv - 0.35) / 0.65);
        var ix = dep.x + v.dx * Math.min(1, kv * 2) * Math.min(2, dep.s);
        var iy = dep.y - Math.sin(Math.min(1, kv * 2) * Math.PI / 2) * 20;
        ix += (W / 2 - ix) * u * u; iy += (H - 8 - iy) * u * u;
        ctx.globalAlpha = kv > 0.8 ? (1 - kv) / 0.2 : 1;
        ctx.drawImage(ic, Math.round(ix - 9), Math.round(iy - 9));
        ctx.globalAlpha = 1;
      }
    }

    // ---------- La mini-carte ----------
    var miniCtx = mini.getContext('2d'), miniBase = null, miniBrume = null, dernierMini = -9999;
    function couleurTuile(tu) {
      if (tu === T.LIQUIDE) return palette.liquide;
      if (tu === T.ROCHE_A) return palette.rocheOmbre;
      if (tu === T.CRISTAL) return palette.cristal;
      if (tu === T.PLANTE) return palette.flore || palette.roche;
      if (tu === T.FLORE) return palette.flore2 || palette.sol;
      if (tu === T.STRUCTURE || tu === T.RUINE) return palette.structureHaut;
      if (tu === T.GRAVATS) return palette.sol2;
      return palette.sol;
    }
    function peindreMiniBase() {
      miniBase = document.createElement('canvas');
      miniBase.width = MW; miniBase.height = MH;
      var x = miniBase.getContext('2d');
      for (var ty = 0; ty < MH; ty++) for (var tx = 0; tx < MW; tx++) {
        x.fillStyle = couleurTuile(g[ty][tx]);
        x.fillRect(tx, ty, 1, 1);
      }
    }
    function majMini(t) {
      if (!miniCtx || t - dernierMini < 200) return;
      dernierMini = t;
      if (!miniBase) peindreMiniBase();
      if (!miniBrume) {
        miniBrume = document.createElement('canvas');
        miniBrume.width = MW; miniBrume.height = MH;
        var bx = miniBrume.getContext('2d');
        bx.fillStyle = '#05060c';
        bx.fillRect(0, 0, MW, MH);
        for (var k = 0; k < MW * MH; k++) if (visite.vu[k]) bx.clearRect(k % MW, (k / MW) | 0, 1, 1);
      }
      // Le brouillard se leve autour du voyageur.
      var cx = Math.floor(balade.chef.x / TS), cy = Math.floor(balade.chef.y / TS), R = 9;
      var brume = miniBrume.getContext('2d');
      for (var y = cy - R; y <= cy + R; y++) for (var x = cx - R; x <= cx + R; x++) {
        if (x < 0 || y < 0 || x >= MW || y >= MH || (x - cx) * (x - cx) + (y - cy) * (y - cy) > R * R) continue;
        var i = y * MW + x;
        if (!visite.vu[i]) { visite.vu[i] = 1; brume.clearRect(x, y, 1, 1); }
      }
      var m = miniCtx;
      m.clearRect(0, 0, MW, MH);
      m.drawImage(miniBase, 0, 0);
      m.drawImage(miniBrume, 0, 0);
      // Le point d'arrivee.
      m.fillStyle = '#7cf0c8';
      m.fillRect(DX - 1, DY - 1, 3, 3);
      // Le repaire, une fois decouvert.
      if (repaire && repaire.tx != null && visite.vu[repaire.ty * MW + repaire.tx]) {
        m.fillStyle = bossBattu() ? '#6a6a7a' : '#ff3a3a';
        m.fillRect(repaire.tx - 1, repaire.ty - 1, 3, 3);
      }
      // Les coffres : ceux qu'on a vus, ou tous avec le detecteur.
      var detecte = CR && CR.aOutil('detecteur');
      coffres.forEach(function (c) {
        var vuC = visite.vu[c.ty * MW + c.tx];
        if (!vuC && !detecte) return;
        var ouvert = CR.coffreOuvert(c.id);
        m.fillStyle = ouvert ? '#5a5a64' : c.scelle ? '#ff5ad8' : '#ffd23a';
        m.fillRect(c.tx - 1, c.ty - 1, 2, 2);
        if (!ouvert && detecte && !reduit && Math.floor(t / 400) % 2) { m.fillStyle = '#ffffff'; m.fillRect(c.tx, c.ty, 1, 1); }
      });
      // Les stations posees.
      CR.poses(a.id).forEach(function (p) {
        m.fillStyle = p.id === 'four' ? '#ff9a3a' : '#e0b878';
        m.fillRect(p.tx - 1, p.ty - 1, 2, 2);
      });
      // Le voyageur, qui clignote, et la ou il regarde.
      m.fillStyle = 'rgba(255,255,255,.55)';
      for (var r = 2; r <= 5; r++) {
        m.fillRect(Math.round(cx + Math.cos(balade.chef.ang) * r), Math.round(cy + Math.sin(balade.chef.ang) * r), 1, 1);
      }
      m.fillStyle = reduit || Math.floor(t / 300) % 2 ? '#ffffff' : '#ffd23a';
      m.fillRect(cx - 1, cy - 1, 3, 3);
    }


    // La plongee, et les sirenes (js/odyssey-plongee.js).
    PL = window.ODYPLONGEE ? window.ODYPLONGEE.creer({
      astre: a, grille: g, palette: palette, scene: scene,
      balade: function () { return balade; },
      dire: direPour,
      blesser: function (n, src) { if (etat === 'libre' || etat === 'scan') subir(n, src); },
      gagner: function (liste, x, y) { return gagner(liste, x, y); },
      pris: function (k) { return !!visite.pris[k]; },
      prendre: function (k) { visite.pris[k] = true; },
      sacPlein: function () { CR.annoncer(scene, [], true); direPour('Ton sac est plein. Ouvre-le pour faire de la place.'); }
    }) : null;

    // A la premiere personne (js/odyssey-fps.js) ; la vue du dessus ne
    // sert plus que de repli, si le moteur manquait.
    var Promenade = window.ODYFPS ? window.ODYFPS.Balade : M.Balade;
    balade = Promenade({
      grille: g,
      canvas: cv,
      ciel: a.ciel,
      astres: astresCiel(a),
      angle: ou && ou.ang != null ? ou.ang : undefined,
      // Le cabanon du jardin est en planches.
      texture: function (tx, ty) {
        return CABANON && tx >= CABANON.x0 && tx <= CABANON.x1 && ty >= CABANON.y0 && ty <= CABANON.y1 ? 'cabane' : null;
      },
      surTir: function () { if (etat === 'libre' || etat === 'scan') tirer(); },
      surScan: function () { if (etat === 'libre') lancerScan(); },
      surVerrou: function (v) { scene.classList.toggle('is-verrou', v); if (v) aide.classList.add('is-fini'); },
      stick: stick, pomme: pomme,
      opts: optsCarte,
      // Les bottes de flottaison : les liquides se marchent.
      traverse: function (tu) { return tu === T.LIQUIDE && !!CR && CR.aOutil('bottes'); },
      // Chaque case de liquide use les bottes ; elles ne cassent qu'une
      // fois revenu sur la terre ferme.
      surCase: function (tx, ty, tu) {
        if (!CR) return;
        if (tu === T.LIQUIDE) { CR.user('bottes', true); return; }
        var usees = CR.finirBottes();
        if (usees) briser(usees, balade.chef.x, balade.chef.y);
      },
      vitesse: function () { return 88 * (CR ? CR.bonus().vitesse : 1); },
      depart: ou ? { x: ou.x, y: ou.y } : DEPART,
      direction: ou ? ou.dir : undefined,
      // Le voyageur : le premier Dinder de la collection, ou le docteur
      // Islas a defaut — c'est lui qui aurait su quoi faire d'une comete.
      troupe: [voyageur()],
      vivant: vivant,
      fige: function () { return etat !== 'libre'; },
      extras: extras,
      apres: apres,

      chaqueImage: function (t) {
        animer(t);
        var plonge = PL && PL.actif();
        if (reprise) {
          // Sous l'eau, on reprendra la ou l'on a plonge.
          var ici = plonge ? PL.retour() : balade.chef;
          reprise.x = ici.x;
          reprise.y = ici.y;
          reprise.dir = balade.chef.dir;
          reprise.ang = plonge ? ici.ang : balade.chef.ang;
        }
        scene.dataset.etat = etat;
        if (etat === 'ko' || etat === 'boss') { majBoutons(); return; }

        // La grotte : on n'en approche pas impunement.
        // Hors de la Lune, un gardien ne se reveille que devant une arme.
        if (!plonge && repaire && etat === 'libre' && !bossBattu() && (lune || DP.aLArme()) &&
            presDuRepaire(lune ? 60 : 40)) {
          return reveillerMonstre();
        }

        if (ART && etat === 'libre' && !plonge) ART.ramasser(cachesO, balade.chef);
        majMini(t);
        majBarre();
        prise = null;
        if (etat === 'libre') {
          if (plonge) prise = PL.chercherPrise();
          else {
            if (CR) prise = chercherPrise();
            // Face a l'eau, et rien d'autre a portee : on peut plonger.
            var dv = !prise && PL ? PL.devant() : null;
            if (dv) prise = { plonge: dv, quoi: 'PLONGER' };
          }
        }
        cibleTir = chercherCibleTir();
        if (etat === 'libre') cible = chercherCible();
        majBoutons();
        if (etat !== 'libre') return;
        if (maintenant() < messageJusqua) return;

        if (plonge) {
          var o2 = Math.ceil(PL.o2());
          dire(PL.charme() > 0.05 ? (DP.aLArme() ? 'Le chant t’attire… TIRE sur la sirène !' : 'Le chant t’attire… REMONTE !')
            : prise ? 'Une coquille géante, posée au fond.'
            : PL.protege() && PL.sirenes().length ? 'Elle chante, mais tu n’entends rien.'
            : 'Sous ' + window.ODYPLONGEE.nomLiquide(a) + ' · air : ' + o2 + ' s · REMONTER (R)');
          return;
        }
        if (PL && PL.sirenes().length) {
          dire(PL.protege() ? 'Une sirène chante. Les bouchons tiennent.'
                            : 'Une sirène chante — ne te laisse pas attirer vers l’eau !');
          return;
        }

        var menace = betes.some(function (b) {
          return !b.mort && b.agressif && distance(b) < 135;
        });
        dire(menace ? (DP.aLArme() ? 'Une créature attaque — TIRER !'
                                   : 'Une créature attaque. Sans arme, mieux vaut fuir.')
          : prise ? (prise.plonge ? (PL.interdit() || 'Face à ' + window.ODYPLONGEE.nomLiquide(a) + '. On peut plonger (E).')
                     : prise.n ? CR.nomNoeud(prise.n.type, a) + '.'
                     : prise.pose ? (prise.pose.id === 'four' ? (CR.fourActif(prise.pose) ? 'Le four chauffe.' : 'Ton four.') : 'Ton établi : la grille 3 × 3.')
                     : prise.type === 'plante' ? (CR.aOutil('hache') ? 'Une grande plante. La hache en tirera plus.' : 'Une grande plante. À mains nues, ça se coupe aussi.')
                     : prise.c ? (prise.c.scelle ? 'Un coffre scellé. Ce qui est dedans valait la peine d’être caché.' : 'Un coffre.')
                     : prise.type === 'roche' ? 'Un rocher. La pioche en viendra à bout.' : 'Un cristal. La foreuse le percera.')
          : gestePelle() === 'prendre' ? 'Une pelle, couchée derrière le cabanon.'
          : gestePelle() === 'creuser' ? 'La terre est meuble, au pied du nain mauve.'
          : cible ? (DP.aScanne(cible.sujet.id) ? cible.sujet.nom + ' — déjà au carnet.'
                                                : 'Quelque chose à portée de scanner.')
          : (repaire && !bossBattu() && (lune ? balade.chef.y < (13 + O.y) * TS && Math.abs(balade.chef.x - GROTTE.x * TS) < 12 * TS : presDuRepaire(170)))
            ? gardien.textes.indice + (lune || DP.aLArme() ? '' : ' Sans arme, mieux vaut passer son chemin.')
          : indiceBarriere() || a.sous);
      }
    });

    majJauge();

    var veille = setInterval(function () {
      if (vivant()) return;
      clearInterval(veille);
      window.removeEventListener('keydown', auClavier);
      minuteurs.forEach(clearTimeout);
      if (duel) duel.arreter();
      if (PL) PL.arreter();
      balade.arreter();
    }, 400);

    // Pour les essais : l'etat interne, sans passer par l'ecran.
    scene._ody = {
      betes: betes, choses: choses, g: g,
      pv: function () { return pv; }, etat: function () { return etat; },
      reveiller: reveillerMonstre, tirer: tirer,
      gardien: gardien, repaire: repaire, caches: cachesO,
      viser: function (b) { cibleTir = b; },
      // Se poser ou l'on veut : les essais s'en servent pour venir
      // devant un repaire sans traverser la carte a pied.
      poser: function (x, y) { balade.chef.x = x; balade.chef.y = y; },
      holo: function () { reveillerMonstre(true); },
      noeuds: noeuds, coffres: coffres, prise: function () { return prise; }, agir: function () { agir(); },
      sac: function () { ouvrirSac(); },
      balade: balade, plongee: PL,
      cibleTir: function () { return cibleTir; }, cible: function () { return cible; }
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

    var parSysteme = V.systemes().length > 1, dernierSys = null;
    V.connus().forEach(function (a) {
      // Une bande par systeme, des qu'il y en a deux a distinguer.
      if (parSysteme && a.systeme !== dernierSys) {
        dernierSys = a.systeme;
        var bande = el('p', 'ody-systeme', V.SYSTEMES.filter(function (s) {
          return s.id === a.systeme;
        })[0].nom);
        bande.dataset.systeme = a.systeme;
        grille.appendChild(bande);
      }
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
    sous: 'Neuf mondes à retrouver', vue: 'odyssee', pret: true,
    img: JAQUETTE
  };
  if (place !== -1) window.MINIJEUX[place] = entree;
  else window.MINIJEUX.push(entree);

  window.VIEWS['odyssee'] = {
    title: 'The Odyssey of Dinder',
    render: function (view, arg) {
      // "#odyssee/mars" pose directement sur le monde ; sans argument,
      // on reprend la partie en cours, ou l'on ouvre le chapitre premier.
      if (arg && DP.aLaTelecommande()) {
        // Un monde encore ferme ne s'ouvre pas non plus par l'adresse :
        // on renvoie au Teleportail.
        var cible = V.astre(arg);
        if (cible && !V.ouvert(cible.id)) {
          location.hash = '#teleportail';
          return;
        }
        var jeu = el('div', 'ody-hote');
        view.appendChild(jeu);
        return ecranMonde(jeu, arg);
      }
      viewOdyssee(view);
    }
  };
  window.VIEWS['teleportail'] = { title: 'Téléportail', render: viewTeleportail };
  window.VIEWS['odyssee-equipier'] = { title: 'Expédition', render: viewEquipier };
  window.VIEWS['odyssee-carnet'] = { title: 'Carnet du scanner', render: viewCarnet };

  window.ODYSSEE = {
    visuel: visuel, compteAstres: compteAstres, pelleUrl: pelleUrl,
    construireCarte: construireCarte, placeCuriosite: placeCuriosite,
    accessibles: accessibles, construireLune: construireLune,
    BASE: BASE, GROTTE: GROTTE, DEVANT_GROTTE: DEVANT_GROTTE, PV_MAX: PV_MAX,
    placeRepaire: placeRepaire,
    MW: MW, MH: MH, DEPART: DEPART, TEMPS: TEMPS,
    reprise: function () { return reprise; },
    poserReprise: function (r) { reprise = r; }
  };
})();
