// Wade and Friends : six nuits de garde a la Maison du Burger.
//
// Le principe est celui de Five Nights at Freddy's : un bureau, deux
// portes blindees, deux lumieres de couloir, douze cameras et une reserve
// d'energie qui ne tient pas la nuit si l'on s'affole. Quatre
// animatroniques venus de SSt-03 se promenent apres la fermeture :
//   - Faith arrive par la gauche, vite, sans prevenir ;
//   - Charlie par la droite, en passant par les cuisines ;
//   - Stephen sort de son bassin quand on ne le surveille plus, et fonce
//     dans le couloir ouest ;
//   - Wade ne bouge que lorsqu'on ne le regarde pas, et n'attend pas a la
//     porte : il entre depuis le coin est si on la laisse ouverte.
//
// Les pieces sont calculees en 3D par js/wade-rendu.js ; ce fichier y
// pose les animatroniques, mene la nuit et dessine l'interface.
(function () {
  var DP = window.DP, R = window.WADE_RENDU, SON = window.WADE_SON;
  if (!DP || !R || !SON) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function hasard(a, b) { return a + Math.random() * (b - a); }
  function choix(l) { return l[Math.floor(Math.random() * l.length)]; }
  function toile(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var JAQUETTE = 'assets/games/icones/wade-and-friends.webp';
  var DOSSIER = 'assets/games/wade/';

  // ==========================================================
  //  Les animatroniques
  // ==========================================================

  var PERSOS = {
    wade:    { nom: 'Wade',    id: 'wade-wolhunter' },
    stephen: { nom: 'Stephen', id: 'stephen-sharkodon' },
    faith:   { nom: 'Faith',   id: 'faith-faisandoir' },
    charlie: { nom: 'Charlie', id: 'charlie-capsule' }
  };

  // Les rendus de l'auteur : la version de base (sur scene), la version
  // Horror (partout ailleurs) et l'endosquelette (a l'atelier).
  var IMG = {};
  function image(k) {
    if (k.indexOf('#') > 0) return souiller(k.split('#')[0]);
    if (IMG[k]) return IMG[k];
    var im = new Image();
    im.decoding = 'async';
    im.src = DOSSIER + k + '.webp';
    IMG[k] = im;
    return im;
  }
  // Un rendu souille : du sang qui coule de la gueule et des yeux, des
  // eclaboussures sur le torse, de la moisissure et de la crasse. Peint
  // une fois, d'apres le squelette du personnage (ou sont sa gueule et ses
  // yeux), et seulement sur sa silhouette.
  var SALES = {};
  function graine(n) {
    n = n >>> 0;
    return function () { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
  }
  function coulure(x, X, Y, larg, long, hz) {
    var w = larg, pts = [];
    for (var d = 0; d <= long; d += 6) {
      var k = d / long;
      pts.push([X + Math.sin(d / 40 + hz) * 3 * k, Y + d, w * (1 - k * 0.55)]);
    }
    x.beginPath();
    x.moveTo(X - w / 2, Y);
    pts.forEach(function (p) { x.lineTo(p[0] - p[2] / 2, p[1]); });
    for (var i = pts.length - 1; i >= 0; i--) x.lineTo(pts[i][0] + pts[i][2] / 2, pts[i][1]);
    x.closePath();
    x.fill();
    var b = pts[pts.length - 1];
    x.beginPath();
    x.ellipse(b[0], b[1] + b[2] * 0.4, b[2] * 0.75, b[2] * 0.95, 0, 0, Math.PI * 2);
    x.fill();
  }
  function tache(x, X, Y, r, coul) {
    var g = x.createRadialGradient(X, Y, 0, X, Y, r);
    g.addColorStop(0, coul.replace('A', '1'));
    g.addColorStop(0.6, coul.replace('A', '.6'));
    g.addColorStop(1, coul.replace('A', '0'));
    x.fillStyle = g;
    x.fillRect(X - r, Y - r, r * 2, r * 2);
  }
  function souiller(base) {
    if (SALES[base]) return SALES[base];
    var im = image(base);
    if (!pret(im)) return null;
    var P_ = window.WADE_PANTINS, R_ = P_ && P_.squelette(base);
    var c = toile(800, 1200), cx0 = c.getContext('2d');
    cx0.drawImage(im, 0, 0, 800, 1200);
    if (!R_) { SALES[base] = c; return c; }
    var h = graine(base.length * 7919 + base.charCodeAt(0) * 31);
    var calqueS = toile(800, 1200), x = calqueS.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, 800, 1200);
    // La crasse : un voile brun, par plaques.
    for (var i = 0; i < 80; i++) {
      tache(x, h() * 800, 200 + h() * 1000, 20 + h() * 90, 'rgba(120,96,66,A)');
    }
    // La moisissure : des plaques vert-de-gris, poudreuses, surtout en bas
    // et aux articulations.
    var lieux = [R_.coudes[0], R_.coudes[1], R_.bassin, R_.mains[0], R_.mains[1], [R_.bassin[0], 1000], R_.cou];
    for (i = 0; i < 34; i++) {
      var L = lieux[Math.floor(h() * lieux.length)];
      var mx = L[0] + (h() - 0.5) * 180, my = L[1] + (h() - 0.5) * 160;
      tache(x, mx, my, 14 + h() * 46, 'rgba(120,140,80,A)');
      for (var j = 0; j < 14; j++) {
        x.fillStyle = 'rgba(' + (90 + Math.floor(h() * 40)) + ',' + (110 + Math.floor(h() * 40)) + ',70,' + (0.3 + h() * 0.4).toFixed(2) + ')';
        x.fillRect(mx + (h() - 0.5) * 60, my + (h() - 0.5) * 60, 2, 2);
      }
    }
    // Le sang de la gueule : le fond assombri, les dents trempees, et les
    // coulures qui descendent sur le menton et le torse.
    var z = R_.machoire.zone, zl = z[2] - z[0];
    tache(x, (z[0] + z[2]) / 2, z[1] + 10, zl * 0.55, 'rgba(110,10,8,A)');
    for (i = 0; i < 10; i++) {
      x.fillStyle = 'rgba(' + (90 + Math.floor(h() * 50)) + ',' + Math.floor(h() * 14) + ',8,.85)';
      coulure(x, z[0] + 10 + h() * (zl - 20), z[1] + h() * (z[3] - z[1]), 3 + h() * 7, 60 + h() * 300, h() * 6);
    }
    // Les yeux qui pleurent du sang.
    (R_.yeux || []).forEach(function (p) {
      tache(x, p[0], p[1] + 6, 26, 'rgba(90,8,6,A)');
      x.fillStyle = 'rgba(105,8,6,.8)';
      var n = 1 + Math.floor(h() * 2);
      for (var k = 0; k < n; k++) coulure(x, p[0] - 8 + h() * 16, p[1] + 10, 2.5 + h() * 4, 50 + h() * 180, h() * 6);
    });
    // Les eclaboussures, sur le torse surtout.
    var cx = (R_.cou[0] + R_.bassin[0]) / 2, cy0 = R_.cou[1] + 40, cy1 = R_.bassin[1];
    for (i = 0; i < 55; i++) {
      var ex = cx + (h() - 0.5) * 420, ey = cy0 + h() * (cy1 - cy0 + 200);
      var rr = 2 + Math.pow(h(), 2.4) * 24;
      // Le sang frais est rouge, le sang seche tire sur le brun.
      var sec = h() < 0.5;
      x.fillStyle = sec ? 'rgba(80,30,16,' + (0.4 + h() * 0.4).toFixed(2) + ')'
                        : 'rgba(' + (90 + Math.floor(h() * 50)) + ',6,6,' + (0.5 + h() * 0.4).toFixed(2) + ')';
      x.beginPath(); x.ellipse(ex, ey, rr, rr * (0.6 + h() * 0.8), h() * 3, 0, Math.PI * 2); x.fill();
      if (rr > 10) coulure(x, ex, ey, rr * 0.35, 30 + h() * 140, h() * 6);
    }
    // Une main ensanglantee, plaquee sur le ventre.
    x.fillStyle = 'rgba(100,14,10,.6)';
    var hx = cx + (h() - 0.5) * 120, hy = (cy0 + cy1) / 2;
    x.beginPath(); x.ellipse(hx, hy, 22, 26, 0, 0, Math.PI * 2); x.fill();
    [[-18, -30], [-6, -40], [7, -39], [18, -30], [27, -2]].forEach(function (d) {
      x.beginPath(); x.ellipse(hx + d[0], hy + d[1], 5, 13, 0, 0, Math.PI * 2); x.fill();
    });
    // Le calque s'imprime dans le rendu, puis on rend au rendu sa
    // silhouette exacte.
    cx0.globalCompositeOperation = 'multiply';
    cx0.drawImage(calqueS, 0, 0);
    cx0.globalCompositeOperation = 'destination-in';
    cx0.drawImage(im, 0, 0, 800, 1200);
    cx0.globalCompositeOperation = 'source-over';
    SALES[base] = c;
    return c;
  }

  function chargerTout() {
    Object.keys(PERSOS).forEach(function (p) {
      ['base', 'horror', 'endo'].forEach(function (r) { image(p + '-' + r); });
    });
    image('plushies'); image('fizzies'); image('logo');
  }
  function pret(im) {
    return im && (im.tagName !== 'IMG' || (im.complete && im.naturalWidth > 0));
  }

  // ==========================================================
  //  Les nuits
  //  Le niveau d'IA va de 0 (immobile) a 20 (implacable) : a chaque
  //  occasion, un animatronique bouge si un de vingt tombe sous son niveau.
  // ==========================================================

  var NUITS = [
    { n: 1, ia: { faith: 3,  charlie: 1,  stephen: 1,  wade: 0 } },
    { n: 2, ia: { faith: 5,  charlie: 3,  stephen: 3,  wade: 0 } },
    { n: 3, ia: { faith: 8,  charlie: 6,  stephen: 5,  wade: 2 } },
    { n: 4, ia: { faith: 11, charlie: 9,  stephen: 8,  wade: 4 } },
    { n: 5, ia: { faith: 14, charlie: 12, stephen: 11, wade: 8 } },
    { n: 6, ia: { faith: 17, charlie: 16, stephen: 15, wade: 13 } }
  ];
  var NUIT_PERSO = 7;
  var NOMS_NUIT = ['', '1re nuit', '2e nuit', '3e nuit', '4e nuit', '5e nuit', '6e nuit', 'Nuit personnalisée'];

  var HEURE = 60;                       // secondes de jeu par heure de nuit

  // Ceux qui s'enhardissent a mesure que la nuit avance, heure par heure.
  var MONTEE = { 2: ['faith'], 3: ['faith', 'charlie', 'stephen'], 4: ['faith', 'charlie', 'stephen'] };

  var TOUS = { faith: 4.97, charlie: 4.98, stephen: 5.01, wade: 3.02 };

  // ==========================================================
  //  Le batiment
  // ==========================================================

  // x, y : la place du bouton sur le plan, en pour cent.
  var CAMS = {
    '01': { nom: 'Scène',          scene: 'scene',    x: 44, y: 6 },
    '02': { nom: 'Salle',          scene: 'salle',    x: 44, y: 28 },
    '03': { nom: 'Comptoir',       scene: 'comptoir', x: 74, y: 20 },
    '04': { nom: 'Le Bassin',      scene: 'bassin',   x: 12, y: 18 },
    '05': { nom: 'Boutique',       scene: 'boutique', x: 4,  y: 42 },
    '06': { nom: 'Cuisine',        scene: null,       x: 86, y: 40 },
    '07': { nom: 'Chambre froide', scene: 'froid',    x: 86, y: 62 },
    '08': { nom: 'Atelier',        scene: 'atelier',  x: 4,  y: 64 },
    '09': { nom: 'Couloir ouest',  scene: 'couloirO', x: 26, y: 56 },
    '10': { nom: 'Coin ouest',     scene: 'coinO',    x: 26, y: 78 },
    '11': { nom: 'Couloir est',    scene: 'couloirE', x: 62, y: 56 },
    '12': { nom: 'Coin est',       scene: 'coinE',    x: 62, y: 78 }
  };

  // Les chemins : d'ou l'on peut aller, piece par piece. PG et PD sont
  // les portes du bureau ; BUREAU, c'est deja trop tard.
  var CHEMINS = {
    faith:   { '01': ['02'], '02': ['05', '08', '09'], '05': ['02', '09'], '08': ['09', '05'],
               '09': ['10', '08'], '10': ['PG', '09'] },
    charlie: { '01': ['02'], '02': ['03', '07'], '03': ['02', '06', '11'], '06': ['03', '07', '11'],
               '07': ['06', '11'], '11': ['12', '03'], '12': ['PD', '11'] },
    wade:    { '01': ['02'], '02': ['03'], '03': ['06'], '06': ['11'], '11': ['12'], '12': ['BUREAU'] }
  };
  var REPLI = { faith: ['02', '05'], charlie: ['03', '11'] };

  // ==========================================================
  //  Les calques
  //  Un animatronique dans une piece, prepare une fois : a la bonne
  //  taille, eclaire comme la piece l'eclaire, son ombre au sol, et cache
  //  par ce qui se trouve devant lui.
  // ==========================================================

  var K = 2;                            // l'agrandissement des rendus a l'ecran
  var CALQUES = {};

  function rgb(v) {
    return 'rgb(' + v.map(function (c) { return Math.round(Math.max(0, Math.min(1, c)) * 255); }).join(',') + ')';
  }

  // Le personnage dans un tampon, multiplie par la lumiere de la piece,
  // de la tete (ecl[0]) aux pieds (ecl[2]).
  function eclaire(im, w, h, ecl, desat) {
    var t = toile(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h))), x = t.getContext('2d');
    // Un rien de flou : le rendu de l'auteur est plus net que la piece
    // calculee, et se detacherait comme une vignette collee.
    x.filter = 'blur(' + Math.max(0.4, Math.min(1.2, h / 500)).toFixed(2) + 'px) contrast(1.1)';
    x.drawImage(im, 0, 0, t.width, t.height);
    x.filter = 'none';
    x.globalCompositeOperation = 'multiply';
    var g = x.createLinearGradient(0, 0, 0, t.height);
    g.addColorStop(0, rgb(ecl[0])); g.addColorStop(0.55, rgb(ecl[1])); g.addColorStop(1, rgb(ecl[2]));
    x.fillStyle = g;
    x.fillRect(0, 0, t.width, t.height);
    if (desat) {
      x.globalCompositeOperation = 'saturation';
      x.fillStyle = 'rgba(128,128,128,' + desat + ')';
      x.fillRect(0, 0, t.width, t.height);
    }
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(im, 0, 0, t.width, t.height);
    return t;
  }

  // Ou tombe un personnage a l'ecran : ses pieds, sa taille, et la zone
  // de travail autour de lui. ample : de la marge pour qu'une marionnette
  // puisse lever les bras et se pencher sans sortir du cadre.
  function geometrie(cle, ps, im, z, ample) {
    var pied = R.projeter(cle, [ps.p[0], ps.p[1], z]);
    var tete = R.projeter(cle, [ps.p[0], ps.p[1] + ps.h, z]);
    var milieu = R.projeter(cle, [ps.p[0], ps.p[1] + ps.h / 2, z]);
    if (!pied || !tete || !milieu) return null;
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    var hp = (pied[1] - tete[1]) * K, wp = hp * iw / ih;
    if (hp < 2) return null;
    var cx = pied[0] * K, bas = pied[1] * K;
    var cote = wp * (ample ? 0.4 : 0.2), haut = ample ? hp * 0.16 : 2;
    var x0 = Math.floor(cx - wp / 2 - cote), y0 = Math.floor(bas - hp - haut);
    return { cx: cx, bas: bas, wp: wp, hp: hp, x0: x0, y0: y0,
             W: Math.ceil(wp + cote * 2), H: Math.ceil(hp + haut + wp * 0.14 + 4), dist: milieu[2] };
  }

  // Ce qui le cache, dans la zone de travail : un canevas opaque la ou il
  // se voit. La profondeur du rendu le dit pixel par pixel ; derriere la
  // vitre du bassin, c'est la vitre qui decoupe.
  function masque(cle, rendu, ps, G) {
    var c = toile(G.W, G.H), x = c.getContext('2d');
    if (ps.dansCuve) {
      var cv = R.SCENES[cle].cuve;
      var a = R.projeter(cle, [cv.a[0], cv.b[1], cv.a[2]]), b = R.projeter(cle, [cv.b[0], cv.a[1], cv.a[2]]);
      x.fillStyle = '#000';
      x.fillRect(a[0] * K - G.x0, a[1] * K - G.y0, (b[0] - a[0]) * K, (b[1] - a[1]) * K);
      return c;
    }
    if (ps.sansMasque) return null;
    var dist = G.dist - 0.35;
    var rx0 = Math.floor(G.x0 / K), ry0 = Math.floor(G.y0 / K);
    var rw = Math.ceil(G.W / K) + 2, rh = Math.ceil(G.H / K) + 2;
    var m = toile(rw, rh), mx = m.getContext('2d'), d = mx.createImageData(rw, rh);
    for (var yy = 0; yy < rh; yy++) {
      for (var xx = 0; xx < rw; xx++) {
        var sx = rx0 + xx, sy = ry0 + yy;
        var vu = sx < 0 || sy < 0 || sx >= rendu.w || sy >= rendu.h || rendu.prof[sy * rendu.w + sx] > dist;
        d.data[(yy * rw + xx) * 4 + 3] = vu ? 255 : 0;
      }
    }
    mx.putImageData(d, 0, 0);
    x.imageSmoothingEnabled = true;
    x.drawImage(m, rx0 * K - G.x0, ry0 * K - G.y0, rw * K, rh * K);
    return c;
  }

  function ombre(x, cx, bas, wp) {
    x.save();
    x.translate(cx, bas);
    x.scale(1, 0.18);
    var g = x.createRadialGradient(0, 0, 0, 0, 0, wp * 0.55);
    g.addColorStop(0, 'rgba(0,0,0,.62)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(-wp, -wp, wp * 2, wp * 2);
    x.restore();
  }

  // Un calque fige : pour ce qui ne bouge pas (les peluches, la pancarte),
  // ou si WebGL manque.
  function construire(cle, rendu, ps, ecl, im, z) {
    var G = geometrie(cle, ps, im, z, false);
    if (!G) return null;
    var c = toile(G.W, G.H), x = c.getContext('2d');
    if (!ps.dansCuve) ombre(x, G.cx - G.x0, G.bas - G.y0, G.wp);
    var t = eclaire(im, G.wp, G.hp, ecl, 0.22);
    if (ps.dansCuve) {
      var tx = t.getContext('2d');
      tx.globalCompositeOperation = 'source-atop';
      tx.fillStyle = 'rgba(20,90,130,.45)';
      tx.fillRect(0, 0, t.width, t.height);
      x.globalAlpha = 0.82;
    }
    x.drawImage(t, G.cx - G.wp / 2 - G.x0, G.bas - G.hp - G.y0);
    x.globalAlpha = 1;
    var m = masque(cle, rendu, ps, G);
    if (m) { x.globalCompositeOperation = 'destination-in'; x.drawImage(m, 0, 0); }
    return { c: c, x: G.x0, y: G.y0, dist: G.dist };
  }

  function calque(cle, variante, pose, imgKey) {
    var k = cle + '|' + variante + '|' + pose + '|' + imgKey;
    if (CALQUES[k]) return CALQUES[k];
    var rendu = R.deja(cle, variante);
    if (!rendu) { R.obtenir(cle, variante); return null; }
    var im = image(imgKey);
    if (!pret(im)) return null;
    var ps = R.SCENES[cle].poses[pose];
    var ecl = rendu.eclairages[pose];
    if (!ps || !ecl) return null;
    var c = construire(cle, rendu, ps, ecl[0], im, ps.p[2]);
    if (c) CALQUES[k] = c;
    return c;
  }

  // ==========================================================
  //  Les marionnettes
  //  Un animatronique vivant : sa place et son masque sont prepares une
  //  fois (cadre), puis il est redessine a chaque image dans la pose que
  //  lui donne son comportement (js/wade-pantins.js).
  // ==========================================================

  var PANT = window.WADE_PANTINS;
  function animes() { return !!(PANT && PANT.pret()); }

  var CADRES = {};
  function cadre(cle, variante, pose, imgKey) {
    var k = cle + '|' + variante + '|' + pose + '|' + imgKey;
    if (CADRES[k]) return CADRES[k];
    var rendu = R.deja(cle, variante);
    if (!rendu) { R.obtenir(cle, variante); return null; }
    var im = image(imgKey);
    if (!pret(im)) return null;
    var ps = R.SCENES[cle].poses[pose], ecl = rendu.eclairages[pose];
    if (!ps || !ecl) return null;
    var G = geometrie(cle, ps, im, ps.p[2], true);
    if (!G) return null;
    G.ecl = ecl[0];
    G.masque = masque(cle, rendu, ps, G);
    G.cuve = !!ps.dansCuve;
    G.img = imgKey;
    CADRES[k] = G;
    return G;
  }

  var TRAVAIL = toile(64, 64);

  // Dessine la marionnette G dans la pose q, la vue decalee de off.
  // o : { lum, alpha }
  function pantin(ctx, G, q, off, o) {
    o = o || {};
    if (TRAVAIL.width < G.W || TRAVAIL.height < G.H) {
      TRAVAIL.width = Math.max(TRAVAIL.width, G.W);
      TRAVAIL.height = Math.max(TRAVAIL.height, G.H);
    }
    var x = TRAVAIL.getContext('2d');
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, G.W, G.H);
    var s = G.hp / 1200;
    if (!G.cuve) ombre(x, G.cx - G.x0 + (q.dx || 0) * s, G.bas - G.y0, G.wp * (q.ech || 1));
    PANT.dessiner(x, G.img, image(G.img), q,
      { s: s, tx: G.cx - G.x0 - 400 * s, ty: G.bas - G.y0 - 1200 * s, vw: G.W, vh: G.H },
      { ecl: G.ecl, lum: o.lum, yeux: q.yeux * (o.yeux == null ? 1 : o.yeux),
        eau: G.cuve ? [0.18, 0.5, 0.7] : null, alpha: G.cuve ? 0.85 : 1, taillesYeux: o.tailleYeux });
    if (G.masque) {
      x.globalCompositeOperation = 'destination-in';
      x.drawImage(G.masque, 0, 0);
      x.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.drawImage(TRAVAIL, 0, 0, G.W, G.H, G.x0 - off, G.y0, G.W, G.H);
    ctx.restore();
  }

  // ==========================================================
  //  Le grain et le voile
  // ==========================================================

  var NEIGES = [];
  function neiges() {
    if (NEIGES.length) return NEIGES;
    for (var n = 0; n < 5; n++) {
      var c = toile(320, 180), x = c.getContext('2d');
      var d = x.createImageData(320, 180);
      for (var i = 0; i < d.data.length; i += 4) {
        var v = Math.random() * 255;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        d.data[i + 3] = 255;
      }
      x.putImageData(d, 0, 0);
      NEIGES.push(c);
    }
    return NEIGES;
  }

  function vignette(w, h, force) {
    var c = toile(w, h), x = c.getContext('2d');
    var g = x.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + force + ')');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    return c;
  }

  // ==========================================================
  //  Une nuit
  // ==========================================================

  function partie(hote, nuit, quitter) {
    chargerTout();
    var VH = 720, VW = 1280;
    var cv = el('canvas', 'wf-cv');
    cv.width = VW; cv.height = VH;
    var ctx = cv.getContext('2d');
    hote.appendChild(cv);
    var vig = vignette(VW, VH, 0.9), vigBureau = vignette(VW, VH, 0.75);

    // L'image garde sa hauteur de 720 et prend la largeur de la fenetre :
    // un ecran large voit plus du bureau, il n'en perd rien en hauteur.
    function cadrer() {
      var b = hote.getBoundingClientRect();
      if (!b.width || !b.height) return;
      var w = Math.round(Math.max(960, Math.min(1520, VH * b.width / b.height)));
      if (w === VW) return;
      VW = w; cv.width = VW; cv.height = VH;
      vig = vignette(VW, VH, 0.9); vigBureau = vignette(VW, VH, 0.75);
    }
    cadrer();
    window.addEventListener('resize', cadrer);

    // ---------- L'interface ----------
    var hud = el('div', 'wf-hud');
    var elHeure = el('span', 'wf-heure', '12 AM');
    var elNuit = el('span', 'wf-nuit', NOMS_NUIT[nuit.n]);
    var hautD = el('div', 'wf-hud-hd');
    hautD.appendChild(elHeure); hautD.appendChild(elNuit);
    var elEnergie = el('span', 'wf-energie');
    var elUsage = el('span', 'wf-usage');
    var basG = el('div', 'wf-hud-bg');
    basG.appendChild(elEnergie); basG.appendChild(elUsage);
    hud.appendChild(hautD); hud.appendChild(basG);
    hote.appendChild(hud);

    var muet = el('button', 'wf-muet', SON.estMuet() ? '🔇' : '🔊');
    muet.type = 'button';
    muet.title = 'Couper le son';
    muet.addEventListener('click', function () {
      SON.muet(!SON.estMuet());
      muet.textContent = SON.estMuet() ? '🔇' : '🔊';
      muet.blur();
    });
    hote.appendChild(muet);

    // La barre qui leve la tablette : on la survole, ou on la touche.
    var flip = el('button', 'wf-flip');
    flip.type = 'button';
    flip.setAttribute('aria-label', 'Caméras (Espace)');
    flip.appendChild(el('span', 'wf-flip-fl', '︽'));
    hote.appendChild(flip);

    // La tablette : un cadre qui monte devant les yeux.
    var tablette = el('div', 'wf-tablette');
    hote.appendChild(tablette);

    // Le plan des cameras.
    var plan = el('div', 'wf-plan');
    var nomCam = el('div', 'wf-plan-nom');
    plan.appendChild(nomCam);
    var carte = el('div', 'wf-plan-carte');
    carte.innerHTML =
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M30 2H70V16H30Z M30 18H70V48H30Z M70 14H96V34H70Z M2 12H28V34H2Z M2 36H28V56H2Z ' +
      'M2 58H28V78H2Z M78 36H98V56H78Z M78 58H98V78H78Z M30 50H40V92H30Z M60 50H70V92H60Z M40 84H60V98H40Z"/>' +
      '</svg>';
    var boutonsCam = {};
    Object.keys(CAMS).forEach(function (k) {
      var b = el('button', 'wf-cam', 'CAM ' + k);
      b.type = 'button';
      b.style.left = CAMS[k].x + '%';
      b.style.top = CAMS[k].y + '%';
      b.addEventListener('click', function () { b.blur(); voir(k); });
      carte.appendChild(b);
      boutonsCam[k] = b;
    });
    carte.appendChild(el('span', 'wf-plan-vous', 'VOUS'));
    plan.appendChild(carte);
    hote.appendChild(plan);

    // Le jumpscare : la tete, en grand, qui fonce sur l'ecran.
    var peur = el('div', 'wf-peur');
    var peurImgs = ['wf-peur-img wf-peur-img--r', 'wf-peur-img wf-peur-img--c', 'wf-peur-img'].map(function (cls) {
      var im = el('img', cls);
      im.alt = '';
      peur.appendChild(im);
      return im;
    });
    peur.appendChild(el('div', 'wf-peur-neige'));
    hote.appendChild(peur);

    var carton = el('div', 'wf-carton');
    hote.appendChild(carton);

    // ---------- L'etat de la nuit ----------
    var e = {
      t: 0, fini: false, energie: 100, demarre: false,
      porteG: false, porteD: false, animG: 0, animD: 0,
      lumG: false, lumD: false,
      cam: false, camVue: '01', bascule: 0, glitch: 0, camT: 0,
      pan: null, pointeur: 0.5, tire: null,
      panne: false, panneT: 0, panneFin: 0, panneNoir: 0, boite: false,
      vusG: false, vusD: false, coupsStephen: 0,
      vision: null, prochaineVision: hasard(50, 90),
      tics: {}, vacille: 0, lache: 0, griffe: { g: 0, d: 0 },
      cuisine: 0, heure: 0, dedans: null
    };

    var A = {
      faith:   { lieu: '01', prochain: hasard(1, TOUS.faith), arrive: 0 },
      charlie: { lieu: '01', prochain: hasard(1, TOUS.charlie), arrive: 0 },
      wade:    { lieu: '01', prochain: hasard(1, TOUS.wade), arrive: 0 },
      stephen: { etape: 0, prochain: TOUS.stephen, course: false, courseFin: 0 }
    };
    var ia = {};
    Object.keys(nuit.ia).forEach(function (k) { ia[k] = nuit.ia[k]; });

    // La derniere nuit, il ne reste d'eux que leurs endosquelettes.
    var ENDOS = nuit.n === 6;
    function apparence(q, base) { return ENDOS ? q + '-endo' : q + (base ? '-base' : '-horror'); }

    // Le secret de la nuit (js/wade-secrets.js), s'il y en a un.
    var sec = window.WADE_SECRETS && nuit.n >= 2 && nuit.n <= 6 ? window.WADE_SECRETS.nuit({
      n: nuit.n, hote: hote, K: K,
      pause: function () { e.pause = true; },
      reprendre: function () { e.pause = false; avant = 0; },
      secousse: function (v) { e.glitch = Math.max(e.glitch, v); },
      finBonne: function () { finBonne(); }
    }) : null;

    // La piece telle qu'elle est cette nuit : brulee, changee. En attendant
    // son nouveau rendu, on garde le dernier.
    var DERNIER = {};
    function fondPiece(cle, variante) {
      var m = sec && sec.mods(cle), k = cle + ':' + variante;
      if (m) {
        var r = R.deja(cle, variante, m);
        if (r) { DERNIER[k] = r; return r; }
        R.obtenir(cle, variante, m);
        if (DERNIER[k]) return DERNIER[k];
      }
      return R.deja(cle, variante);
    }

    // Le bruit qu'il fait, d'ou il vient : un servomoteur qui force, ou
    // l'accord qui crisse quand il nous regarde dans les yeux.
    function bruitDe(vol, pan, cam) {
      return function (type) {
        if (type === 'regard') { if (cam) SON.regardCam(pan); else SON.regard(pan); }
        else SON.servo(vol, pan);
      };
    }

    // Les sons qui durent.
    var vent = null, bourdon = null, neigeSon = null;

    // ---------- Les commandes ----------

    function porte(c) {
      if (e.fini || e.panne || !e.demarre || e.pause) return;
      if (e.cam || e.bascule || e.dedans) { SON.refus(); return; }
      var k = c === 'g' ? 'porteG' : 'porteD';
      e[k] = !e[k];
      SON.porte();
    }

    function lumiere(c) {
      if (e.fini || e.panne || !e.demarre || e.pause) return;
      if (e.cam || e.bascule || e.dedans) { SON.refus(); return; }
      var k = c === 'g' ? 'lumG' : 'lumD', autre = c === 'g' ? 'lumD' : 'lumG';
      e[k] = !e[k];
      e[autre] = false;
      SON.bouton();
      if (bourdon) { bourdon.arreter(); bourdon = null; }
      if (e[k]) {
        bourdon = SON.bourdon();
        // La premiere fois qu'on surprend quelqu'un a la porte, ca sursaute.
        var la = qui(c === 'g' ? 'PG' : 'PD');
        var vus = c === 'g' ? 'vusG' : 'vusD';
        if (la.length && !e[vus]) { e[vus] = true; SON.sursaut(); SON.regard(c === 'g' ? -0.7 : 0.7); }
      }
    }

    function eteindre() {
      e.lumG = e.lumD = false;
      if (bourdon) { bourdon.arreter(); bourdon = null; }
    }

    // Lever ou baisser la tablette prend un quart de seconde : pendant ce
    // temps, on ne voit ni le bureau ni les cameras.
    function basculer() {
      if (e.fini || e.panne || !e.demarre || e.bascule || e.pause) return;
      eteindre();
      var monte = !e.cam;
      e.bascule = 0.001;
      SON.tablette(monte);
      tablette.classList.remove('is-monte', 'is-descend');
      void tablette.offsetWidth;
      tablette.classList.add(monte ? 'is-monte' : 'is-descend');
      setTimeout(function () {
        if (e.fini) return;
        e.bascule = 0;
        e.cam = monte;
        e.glitch = 0.6;
        hote.classList.toggle('is-cam', e.cam);
        tablette.classList.remove('is-monte', 'is-descend');
        if (e.cam) neigeSon = SON.neige();
        else if (neigeSon) { neigeSon.arreter(); neigeSon = null; }
        if (!e.cam && e.dedans) e.dedans.fin = Math.min(e.dedans.fin, e.t + 0.3);
        majPlan();
      }, reduit ? 60 : 240);
    }

    function voir(k) {
      if (!e.cam || e.fini || e.pause) return;
      if (k === e.camVue) return;
      e.camVue = k;
      e.glitch = 0.55;
      SON.grain();
      majPlan();
    }

    function majPlan() {
      Object.keys(boutonsCam).forEach(function (k) {
        boutonsCam[k].classList.toggle('is-vue', k === e.camVue);
      });
      nomCam.textContent = CAMS[e.camVue].nom;
    }

    function auClavier(ev) {
      if (e.fini || ev.repeat || e.pause) return;
      var k = (ev.key || '').toLowerCase();
      if (k === 'a') porte('g');
      else if (k === 'q') lumiere('g');
      else if (k === 'p') porte('d');
      else if (k === 'm') lumiere('d');
      else if (k === ' ') basculer();
      else return;
      ev.preventDefault();
    }
    window.addEventListener('keydown', auClavier);

    // La barre du bas : comme dans FNaF, il suffit de la survoler ; on
    // doit la quitter avant qu'elle reserve.
    // Un clic juste apres le survol ne doit pas rabattre ce que le survol
    // vient de lever.
    var survol = 0;
    flip.addEventListener('pointerenter', function (ev) {
      if (ev.pointerType !== 'mouse') return;
      survol = Date.now();
      basculer();
    });
    flip.addEventListener('click', function () {
      flip.blur();
      if (Date.now() - survol < 700) return;
      basculer();
    });

    // ---------- Le regard et les clics dans le bureau ----------

    function versToile(ev) {
      var b = cv.getBoundingClientRect();
      var s = Math.max(b.width / VW, b.height / VH);
      return [(ev.clientX - b.left - (b.width - VW * s) / 2) / s,
              (ev.clientY - b.top - (b.height - VH * s) / 2) / s];
    }

    cv.addEventListener('pointermove', function (ev) {
      var p = versToile(ev);
      if (ev.pointerType === 'mouse') { e.pointeur = p[0] / VW; return; }
      if (e.tire) {
        e.pan -= p[0] - e.tire;
        e.tire = p[0];
      }
    });
    cv.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse') e.pointeur = 0.5; });
    cv.addEventListener('pointerup', function () { e.tire = null; });
    cv.addEventListener('pointercancel', function () { e.tire = null; });
    cv.addEventListener('pointerdown', function (ev) {
      SON.reveiller();
      if (e.pause || e.fini) return;
      var p = versToile(ev);
      if (!e.cam && !e.bascule && boutonSous(p[0], p[1])) return;
      // Un endroit de la piece : c'est peut-etre une piste.
      if (sec && !e.bascule && e.vue) {
        var pt = R.point(e.vue.cle, e.vue.rendu, (p[0] + e.vue.off) / K, p[1] / K);
        if (sec.clic(e.vue.cle, pt)) return;
      }
      if (ev.pointerType !== 'mouse') e.tire = p[0];
    });

    // Les boutons des boitiers, projetes depuis la 3D : on les touche ou
    // on les voit.
    var BOUTONS = [];
    [-1, 1].forEach(function (s) {
      var x = s * 2.925;
      BOUTONS.push({ cote: s < 0 ? 'g' : 'd', type: 'porte', p: [x, 1.53, 1.8] });
      BOUTONS.push({ cote: s < 0 ? 'g' : 'd', type: 'lum', p: [x, 1.17, 1.8] });
    });
    BOUTONS.forEach(function (b) {
      var c = R.projeter('bureau', b.p);
      var h = R.projeter('bureau', [b.p[0], b.p[1] + 0.1, b.p[2]]);
      b.x = c[0] * K; b.y = c[1] * K; b.r = Math.abs(c[1] - h[1]) * K;
    });

    function boutonSous(X, Y) {
      for (var i = 0; i < BOUTONS.length; i++) {
        var b = BOUTONS[i];
        var bx = b.x - e.pan;
        if ((X - bx) * (X - bx) + (Y - b.y) * (Y - b.y) <= (b.r * 1.5) * (b.r * 1.5)) {
          if (b.type === 'porte') porte(b.cote); else lumiere(b.cote);
          return true;
        }
      }
      return false;
    }

    // ---------- L'IA ----------

    function qui(lieu) {
      return ['faith', 'charlie', 'wade'].filter(function (k) { return A[k].lieu === lieu; });
    }

    function tente(niveau) { return niveau > 0 && Math.random() * 20 < niveau; }

    function regarde(lieu) { return e.cam && e.camVue === lieu; }

    function deplacer(k, vers) {
      var avant = A[k].lieu;
      A[k].lieu = vers;
      A[k].arrive = e.t;
      // On l'a vu partir, ou arriver : l'image se brouille.
      if (e.cam && (e.camVue === avant || e.camVue === vers)) e.glitch = 1.3;
      if (avant === 'PG' || avant === 'PD') SON.depart(avant === 'PG' ? -0.9 : 0.9);
      if (k === 'wade') SON.hurlement();
      var pan = k === 'faith' ? -0.7 : 0.7;
      if (vers === 'PG' || vers === 'PD') {
        SON.souffle(vers === 'PG' ? -0.9 : 0.9);
        if (vers === 'PG') e.vusG = false; else e.vusD = false;
      } else if (vers === '10' || vers === '12') {
        SON.pas(0.9, pan);
        if (k === 'faith' && Math.random() < 0.5) SON.cri(-0.8);
      } else if (vers === '09' || vers === '11') {
        SON.pas(0.4, pan);
      }
    }

    function iaMarche(k) {
      var a = A[k];
      if (e.t < a.prochain) return;
      a.prochain = e.t + TOUS[k];
      if (!tente(ia[k])) return;

      // Wade ne bouge pas tant qu'on le regarde.
      if (k === 'wade' && regarde(a.lieu)) return;

      if (a.lieu === 'PG' || a.lieu === 'PD') {
        // Il laisse toujours quelques secondes avant d'entrer.
        if (e.t - a.arrive < 4) return;
        var ferme = a.lieu === 'PG' ? e.porteG : e.porteD;
        if (ferme) deplacer(k, choix(REPLI[k]));
        else entrer(k);
        return;
      }
      if (k === 'wade' && a.lieu === '12') {
        // Du coin est, il entre si la porte est ouverte et qu'on a le dos
        // tourne a sa camera. Sinon, il recule.
        if (e.porteD) deplacer(k, '11');
        else if (!regarde('12')) entrer(k);
        return;
      }
      var suite = CHEMINS[k][a.lieu];
      if (!suite) return;
      // On n'entre pas a deux dans l'encadrement d'une porte.
      var libres = suite.filter(function (l) {
        return !((l === 'PG' || l === 'PD') && qui(l).length);
      });
      if (libres.length) deplacer(k, choix(libres));
    }

    function iaStephen() {
      var f = A.stephen;
      if (f.course) {
        if (e.t < f.courseFin) return;
        f.course = false;
        if (e.porteG) {
          // Il se jette contre le rideau, et chaque coup coute plus cher.
          SON.coups(-0.9);
          e.secoue = e.t + 0.9;
          e.energie = Math.max(0, e.energie - (2 + e.coupsStephen * 5));
          e.coupsStephen++;
          f.etape = Math.random() < 0.5 ? 0 : 1;
          f.prochain = e.t + TOUS.stephen;
        } else {
          attaque('stephen');
        }
        return;
      }
      if (e.t < f.prochain) return;
      f.prochain = e.t + TOUS.stephen;
      // Tant qu'on garde un oeil sur les cameras, il reste dans son bassin.
      if (e.cam || !tente(ia.stephen)) return;
      f.etape++;
      if (f.etape >= 4) {
        f.course = true;
        f.courseFin = e.t + 3.2;
        SON.course();
        if (regarde('09')) e.glitch = 0.6;
      }
    }

    // ---------- L'energie ----------

    function usage() {
      return 1 + (e.porteG ? 1 : 0) + (e.porteD ? 1 : 0) +
             (e.lumG || e.lumD ? 1 : 0) + (e.cam ? 1 : 0);
    }

    function majEnergie(dt) {
      if (e.panne) return;
      var k = nuit.n === NUIT_PERSO ? 1.25 : 1 + (nuit.n - 1) * 0.05;
      e.energie -= usage() * 0.1 * k * dt;
      if (e.energie <= 0) { e.energie = 0; coupure(); }
    }

    // Plus de courant : les portes se relevent, tout s'eteint, et Wade
    // vient jouer son air a la porte gauche avant d'entrer.
    function coupure() {
      e.panne = true;
      e.cam = false; e.bascule = 0;
      eteindre();
      if (neigeSon) { neigeSon.arreter(); neigeSon = null; }
      if (vent) { vent.arreter(1.2); vent = null; }
      e.porteG = e.porteD = false;
      hote.classList.remove('is-cam');
      hote.classList.add('is-panne');
      SON.panne();
      SON.porte();
      e.panneT = e.t + hasard(4, 9);
      e.panneFin = e.panneT + hasard(6, 14);
      e.panneNoir = e.panneFin + hasard(2, 4);
    }

    // Il est entre : des pas lourds tout pres, les boutons ne repondent
    // plus, la lampe s'affole. Il saute quelques secondes plus tard, ou
    // des qu'on baisse la tablette.
    function entrer(k) {
      if (e.dedans || e.fini) return;
      A[k].lieu = 'BUREAU';
      e.dedans = { k: k, fin: e.t + hasard(2.4, 3.8) };
      eteindre();
      SON.intrus();
    }

    // ---------- La fin ----------

    function attaque(k) {
      if (e.fini) return;
      e.fini = true;
      var surCam = e.cam;
      e.cam = false;
      hote.classList.remove('is-cam');
      eteindre();
      SON.couper();
      var cleP = apparence(k) + '#sale';
      var duree = (surCam ? 0.6 : 0) + 1.35;
      if (animes() && PANT.squelette(cleP) && pret(image(cleP))) {
        // Ce qu'on voyait juste avant : il surgit par-dessus.
        var fond = toile(VW, VH);
        fond.getContext('2d').drawImage(cv, 0, 0);
        e.peur = { k: k, cle: cleP, t: 0, st: PANT.etat(), fond: fond,
                   de: surCam ? 'cam' : (k === 'faith' || k === 'stephen' || e.panne ? 'g' : 'd'),
                   trace: toile(VW, VH), calque: toile(VW, VH), bureau: null };
      } else {
        peurImgs.forEach(function (im) { im.src = DOSSIER + k + '-horror.webp'; });
        peur.classList.add('is-on');
      }
      // Sur les cameras, le cri attend que la tablette soit arrachee.
      setTimeout(function () { SON.hurle(k); }, surCam ? 520 : 0);
      if (surCam) { SON.grain(); SON.vision(); }
      setTimeout(function () {
        e.peur = null;
        peur.classList.remove('is-on');
        hote.classList.add('is-neige');
        SON.neigeLongue(1.6);
        setTimeout(function () { hote.classList.remove('is-neige'); defaite(k); }, reduit ? 300 : 1500);
      }, reduit ? 900 : duree * 1000);
    }

    function heuresTenues() { return Math.min(6, Math.floor(e.t / HEURE)); }

    function defaite(k) {
      arreter();
      hote.classList.add('is-fin');
      carton.textContent = '';
      carton.className = 'wf-carton is-on is-perdu';
      var endo = el('img', 'wf-carton-endo');
      endo.src = DOSSIER + k + '-endo.webp';
      endo.alt = '';
      carton.appendChild(endo);
      carton.appendChild(el('strong', 'wf-carton-titre', 'GAME OVER'));
      var h = heuresTenues();
      carton.appendChild(el('span', 'wf-carton-sous',
        PERSOS[k].nom + ' t’a trouvé à ' + (h ? h : 12) + ' AM.'));
      boutonsFin([['RÉESSAYER', 'rejouer'], ['MENU', 'menu']]);
    }

    // Les deux fins de la derniere nuit : le batiment brule, ou l'on tient
    // jusqu'a 6 h... et ce n'est pas mieux.
    function finBonne() {
      if (e.fini) return;
      e.fini = true;
      arreter();
      DP.wadeNuitFaite(6);
      hote.classList.add('is-fin');
      window.WADE_SECRETS.finBonne(hote, function () { quitter('menu'); });
    }

    function victoire() {
      if (nuit.n === 6 && window.WADE_SECRETS) {
        e.fini = true;
        arreter();
        DP.wadeNuitFaite(6);
        hote.classList.add('is-fin');
        window.WADE_SECRETS.finMauvaise(hote, function () { quitter('menu'); });
        return;
      }
      e.fini = true;
      arreter();
      var premiere = DP.wadeNuitFaite(nuit.n, nuit.n === NUIT_PERSO ? ia : null);
      SON.carillon();
      hote.classList.remove('is-cam');
      hote.classList.add('is-fin');
      carton.textContent = '';
      carton.className = 'wf-carton is-on is-gagne';
      // 5 AM qui bascule sur 6 AM, comme un compteur mecanique.
      var horloge = el('div', 'wf-six');
      var roue = el('span', 'wf-six-roue');
      roue.appendChild(el('span', null, '5'));
      roue.appendChild(el('span', null, '6'));
      horloge.appendChild(roue);
      horloge.appendChild(el('span', 'wf-six-am', 'AM'));
      carton.appendChild(horloge);
      var suite = el('div', 'wf-carton-suite');
      suite.appendChild(el('strong', 'wf-carton-titre', NOMS_NUIT[nuit.n] + ' terminée'));
      if (premiere && nuit.n < 5) suite.appendChild(el('span', 'wf-carton-sous', 'La ' + NOMS_NUIT[nuit.n + 1] + ' t’attend.'));
      carton.appendChild(suite);
      var choixFin = [];
      if (nuit.n < 5) choixFin.push(['NUIT SUIVANTE', 'suivante']);
      else choixFin.push(['CONTINUER', 'paie']);
      choixFin.push(['MENU', 'menu']);
      boutonsFin(choixFin);
    }

    function boutonsFin(liste) {
      var b = el('div', 'wf-carton-btns');
      liste.forEach(function (l, i) {
        var bt = el('button', 'wf-gros-btn' + (i ? ' wf-gros-btn--plat' : ''), l[0]);
        bt.type = 'button';
        bt.addEventListener('click', function () { quitter(l[1]); });
        b.appendChild(bt);
      });
      carton.appendChild(b);
      setTimeout(function () { var p = b.querySelector('button'); if (p) p.focus(); }, 50);
    }

    // ---------- Le dessin ----------

    var neige = neiges();

    // Un tic : de temps en temps, la tete part de travers une fraction de
    // seconde. Rien de plus derangeant qu'une machine qui sursaute.
    function tic(k) {
      var t = e.tics[k];
      if (t && e.t < t.fin) return t;
      if (Math.random() < 0.01) {
        e.tics[k] = { fin: e.t + hasard(0.08, 0.2), dx: hasard(-5, 5), dy: hasard(-3, 2) };
      }
      return null;
    }

    function poserCalque(L, off, t) {
      if (!L) return;
      ctx.drawImage(L.c, L.x - off + (t ? t.dx : 0), L.y + (t ? t.dy : 0));
    }

    // L'etat de chaque marionnette a l'ecran. Il repart de zero quand elle
    // quitte le champ : a la visite suivante, on la surprendra de nouveau
    // la tete tournee, et elle se retournera vers nous.
    var VIVANTS = {}, dtImage = 0;
    function vivant(cle) {
      var v = VIVANTS[cle];
      if (!v || e.t - v.vu > 0.6) v = VIVANTS[cle] = { st: PANT.etat(), vu: e.t };
      v.vu = e.t;
      return v.st;
    }

    // Anime la marionnette G : quoi dit son comportement, cle son etat.
    // o.depuis : depuis combien de temps elle est la, si cela compte plus
    // que le temps passe a la regarder.
    function animer(G, quoi, cle, off, o, son) {
      o = o || {};
      var st = vivant(cle);
      if (o.depuis != null) st.vu = Math.max(0, o.depuis - dtImage);
      var q = PANT.poser(quoi, st, e.t, dtImage, true, son);
      pantin(ctx, G, q, off, o);
    }

    // Le rideau de fer d'une porte, dessine dans le plan de la porte :
    // la projection panoramique courbe ses lignes comme celles du mur.
    function rideau(s, anim, lum) {
      if (anim <= 0.002) return;
      var sc = R.SCENES.bureau, pz = sc.porte, x = s * 3.1;
      var haut = pz[3], bas = haut * (1 - anim);
      var off = e.pan;
      function pt(y, z) { var p = R.projeter('bureau', [x, y, z]); return [p[0] * K - off, p[1] * K]; }
      var N = 12, i, p;
      ctx.save();
      ctx.beginPath();
      for (i = 0; i <= N; i++) { p = pt(haut, pz[0] + (pz[1] - pz[0]) * i / N); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
      for (i = N; i >= 0; i--) { p = pt(bas, pz[0] + (pz[1] - pz[0]) * i / N); ctx.lineTo(p[0], p[1]); }
      ctx.closePath();
      var h0 = pt(haut, pz[0])[1], h1 = pt(bas, pz[0])[1];
      var g = ctx.createLinearGradient(0, h0, 0, Math.max(h0 + 1, h1));
      var v = Math.round(70 * lum), w = Math.round(46 * lum);
      g.addColorStop(0, 'rgb(' + v + ',' + (v + 3) + ',' + (v + 8) + ')');
      g.addColorStop(1, 'rgb(' + w + ',' + (w + 2) + ',' + (w + 6) + ')');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.clip();
      // Les lames du rideau.
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,.55)';
      for (var y = haut - 0.13; y > bas; y -= 0.13) {
        ctx.beginPath();
        for (i = 0; i <= N; i++) { p = pt(y, pz[0] + (pz[1] - pz[0]) * i / N); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.08 * lum).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      for (y = haut - 0.15; y > bas; y -= 0.13) {
        ctx.beginPath();
        for (i = 0; i <= N; i++) { p = pt(y, pz[0] + (pz[1] - pz[0]) * i / N); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
        ctx.stroke();
      }
      // La barre du bas, plus epaisse.
      ctx.lineWidth = 9;
      ctx.strokeStyle = 'rgb(' + Math.round(30 * lum) + ',' + Math.round(30 * lum) + ',' + Math.round(34 * lum) + ')';
      ctx.beginPath();
      for (i = 0; i <= N; i++) { p = pt(bas + 0.03, pz[0] + (pz[1] - pz[0]) * i / N); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
      ctx.restore();
    }

    // Les boutons, ronds, qui s'allument : rouge pour la porte, blanc
    // pour la lumiere.
    function boutons(lum) {
      BOUTONS.forEach(function (b) {
        var on = b.type === 'porte' ? (b.cote === 'g' ? e.porteG : e.porteD)
                                    : (b.cote === 'g' ? e.lumG : e.lumD);
        var x = b.x - e.pan, y = b.y, r = b.r;
        if (x < -40 || x > VW + 40) return;
        var col = b.type === 'porte' ? (on ? [255, 40, 30] : [90, 14, 12]) : (on ? [240, 240, 220] : [70, 70, 66]);
        if (e.panne) col = b.type === 'porte' ? [30, 6, 6] : [24, 24, 22];
        else col = col.map(function (c) { return on ? c : Math.round(c * (0.4 + lum * 0.6)); });
        ctx.fillStyle = '#0c0c0e';
        ctx.beginPath(); ctx.arc(x, y, r * 1.12, 0, Math.PI * 2); ctx.fill();
        var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        g.addColorStop(0, 'rgb(' + col.map(function (c) { return Math.min(255, c + 60); }).join(',') + ')');
        g.addColorStop(1, 'rgb(' + col.join(',') + ')');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (on && !e.panne) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          var h = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3);
          h.addColorStop(0, 'rgba(' + col.join(',') + ',.35)');
          h.addColorStop(1, 'rgba(' + col.join(',') + ',0)');
          ctx.fillStyle = h;
          ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(230,230,220,' + (0.25 + lum * 0.4).toFixed(2) + ')';
        ctx.font = 'bold ' + Math.max(9, Math.round(r * 0.55)) + 'px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.type === 'porte' ? 'PORTE' : 'LUMIÈRE', x, y + r * 1.75);
      });
    }

    function dessinerBureau(dt) {
      // Quand quelqu'un se tient dans l'embrasure, le neon du couloir lache
      // par a-coups : on le perd une fraction de seconde. Il est toujours la.
      var occupee = (e.lumG && qui('PG').length) || (e.lumD && qui('PD').length);
      if (occupee && e.t > e.lache && Math.random() < 0.02) e.lache = e.t + hasard(0.05, 0.22);
      var lache = occupee && e.t < e.lache;
      var variante = e.panne ? 'noir' : lache ? 'base' : e.lumG ? 'lumG' : e.lumD ? 'lumD' : 'base';
      var rendu = fondPiece('bureau', variante) || fondPiece('bureau', 'base');
      if (!rendu) { R.obtenir('bureau', variante); attente(); return; }
      if (!R.deja('bureau', variante)) R.obtenir('bureau', variante);

      // On tourne la tete : la souris pres d'un bord fait glisser la vue.
      var max = Math.max(0, rendu.w * K - VW);
      // On prend son poste face au bureau.
      if (e.pan == null) e.pan = max / 2;
      if (!e.tire) {
        var p = e.pointeur;
        if (p < 0.28) e.pan -= (0.28 - p) / 0.28 * 1500 * dt;
        else if (p > 0.72) e.pan += (p - 0.72) / 0.28 * 1500 * dt;
      }
      e.pan = Math.max(0, Math.min(max, e.pan));
      var off = e.pan;

      // La lampe vacille, et parfois lache une demi-seconde.
      if (e.t > e.vacille && Math.random() < 0.003 && !e.panne) e.vacille = e.t + hasard(0.05, 0.4);
      var noir = e.t < e.vacille;

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(rendu.canvas, -off, 0, rendu.w * K, rendu.h * K);
      e.vue = { cle: 'bureau', rendu: rendu, off: off };

      // Celui qui attend dans l'embrasure, quand la lumiere l'eclaire.
      ['g', 'd'].forEach(function (c) {
        var on = c === 'g' ? e.lumG : e.lumD;
        if (!on || e.panne || lache) return;
        var la = qui(c === 'g' ? 'PG' : 'PD');
        var variante = c === 'g' ? 'lumG' : 'lumD', pose = c === 'g' ? 'porteG' : 'porteD';
        la.forEach(function (k) {
          if (!animes()) { poserCalque(calque('bureau', variante, pose, apparence(k)), off, tic(k)); return; }
          var G = cadre('bureau', variante, pose, apparence(k) + '#sale');
          if (G) animer(G, 'porte', 'porte|' + k, off, { depuis: e.t - A[k].arrive, lum: 0.2, tailleYeux: 1.6 },
                        bruitDe(0.9, c === 'g' ? -0.8 : 0.8));
        });
      });

      // La panne : Wade dans l'embrasure gauche, le visage qui s'allume et
      // s'eteint au rythme de sa boite a musique. Entre deux eclats, il ne
      // reste que ses yeux.
      if (e.panne && e.t > e.panneT && e.t < e.panneFin) {
        var allume = Math.floor(e.t * 3.1) % 2 === 0 || Math.random() < 0.05;
        var Gw = animes() && cadre('bureau', 'lumG', 'porteG', apparence('wade') + '#sale');
        if (Gw) animer(Gw, 'panne', 'panne', off, { lum: allume ? 0.55 : 0.03, yeux: allume ? 1 : 0.8 });
        else if (allume) {
          var Lw = calque('bureau', 'lumG', 'porteG', 'wade-horror');
          if (Lw) { ctx.globalAlpha = 0.45; poserCalque(Lw, off); ctx.globalAlpha = 1; }
        }
      }

      // Les rideaux de fer, puis les boutons.
      var lum = e.panne ? 0.12 : noir ? 0.3 : 0.75;
      var tremble = e.secoue && e.t < e.secoue ? hasard(-3, 3) : 0;
      ctx.save(); ctx.translate(tremble, 0);
      rideau(-1, e.animG, lum);
      ctx.restore();
      rideau(1, e.animD, lum);
      boutons(lum);
      if (sec) sec.dessiner('bureau', ctx, off, K, VW, VH);

      if (noir) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, VW, VH); }
      if (e.panne && e.t > e.panneFin) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); }

      ctx.globalAlpha = 0.05;
      ctx.drawImage(neige[Math.floor(e.t * 24) % neige.length], 0, 0, VW, VH);
      ctx.globalAlpha = 1;
      ctx.drawImage(vigBureau, 0, 0);
    }

    // Ce qu'une camera montre en plus de la piece : les animatroniques,
    // et ce qui traine.
    // Chaque element rend sa distance (d) et sa facon de se dessiner (f).
    function occupants(k) {
      var sc = CAMS[k].scene, L = [];
      var vivants = animes();
      function perso(pose, img, quoi, cle) {
        if (vivants) {
          var G = cadre(sc, 'base', pose, img);
          if (G) L.push({ d: G.dist, f: function (off) {
            animer(G, quoi, k + '|' + cle, off, null, bruitDe(0.5, 0, true));
            if (quoi !== 'cam' || e.fini || !A[cle]) return;
            var st = VIVANTS[k + '|' + cle] && VIVANTS[k + '|' + cle].st;
            if (!st) return;
            st.fixeT = st.regard > 0.9 ? (st.fixeT || 0) + dtImage : 0;
            if (st.fixeT > 3) attaque(cle);
          } });
          return;
        }
        var c = calque(sc, 'base', pose, img);
        if (c) L.push({ d: c.dist, f: function (off) {
          poserCalque(c, off, quoi === 'nage' ? { dx: Math.sin(e.t * 0.8) * 30, dy: Math.sin(e.t * 1.3) * 6 } : tic(cle));
        } });
      }

      ['faith', 'charlie', 'wade'].forEach(function (q) {
        if (A[q].lieu !== k) return;
        if (k === '01') perso(q, apparence(q, true), 'scene', q);
        else perso(q, apparence(q), 'cam', q);
      });
      if (k === '04') {
        var s = A.stephen, et = s.course ? 4 : s.etape;
        if (et === 0) perso('nage', apparence('stephen', true), 'nage', 'stephen');
        else if (et === 1) perso('vitre', apparence('stephen'), 'vitre', 'stephen');
        else if (et === 2) perso('dehors', apparence('stephen'), 'cam', 'stephen');
      }
      return L.sort(function (a, b) { return b.d - a.d; });
    }

    // Stephen qui file dans le couloir ouest, droit sur la camera.
    function dessinerCourse(off) {
      var s = A.stephen;
      if (!s.course) return;
      var rendu = R.deja('couloirO', 'base');
      var cleC = apparence('stephen'), im = image(cleC);
      if (!rendu || !pret(im)) return;
      var ps = R.SCENES.couloirO.poses.course, zs = ps.echantillons;
      var v = 1 - Math.max(0, s.courseFin - e.t) / 3.2;
      var z = zs[0] + (zs[zs.length - 1] - zs[0]) * v;
      // La lumiere, interpolee entre les echantillons du couloir.
      var E = rendu.eclairages.course, i = 0;
      while (i < zs.length - 2 && z < zs[i + 1]) i++;
      var k = Math.max(0, Math.min(1, (zs[i] - z) / (zs[i] - zs[i + 1])));
      var ecl = [0, 1, 2].map(function (h) {
        return [0, 1, 2].map(function (c) { return E[i][h][c] + (E[i + 1][h][c] - E[i][h][c]) * k; });
      });
      var pied = R.projeter('couloirO', [ps.p[0] + Math.sin(e.t * 9) * 0.1, 0, z]);
      var tete = R.projeter('couloirO', [ps.p[0], ps.h, z]);
      if (!pied || !tete) return;
      var hp = (pied[1] - tete[1]) * K, wp = hp * im.naturalWidth / im.naturalHeight;
      if (animes()) {
        // Il court : les bras battent, la gueule grande ouverte.
        var q = PANT.poser('course', vivant('course'), e.t, dtImage, true);
        var s = hp / 1200;
        PANT.dessiner(ctx, cleC, im, q,
          { s: s, tx: pied[0] * K - off - 400 * s, ty: pied[1] * K - 1200 * s, vw: VW, vh: VH },
          { ecl: ecl, yeux: 1 });
        return;
      }
      var t = eclaire(im, wp, hp, ecl, 0.22);
      ctx.drawImage(t, pied[0] * K - wp / 2 - off + hasard(-4, 4), pied[1] * K - hp + hasard(-3, 3));
    }

    function dessinerCamera(dt) {
      var k = e.camVue, cam = CAMS[k];
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, VW, VH);
      e.camT += dt;
      if (!cam.scene) {
        // La cuisine : la camera est morte, on n'a que le son.
        ctx.globalAlpha = 0.5;
        ctx.drawImage(neige[Math.floor(e.t * 24) % neige.length], 0, 0, VW, VH);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, VW, VH);
        ctx.fillStyle = '#e8e8e8'; ctx.textAlign = 'center';
        ctx.font = 'bold 34px Consolas, monospace';
        ctx.fillText('CAMÉRA HORS SERVICE', VW / 2, VH / 2 - 10);
        ctx.font = '24px Consolas, monospace';
        ctx.fillText('— AUDIO SEULEMENT —', VW / 2, VH / 2 + 30);
      } else {
        var variante = k === '04' && (A.stephen.course || A.stephen.etape >= 3) ? 'vide' : 'base';
        var rendu = fondPiece(cam.scene, variante);
        e.vue = null;
        if (!rendu) {
          R.obtenir(cam.scene, variante);
          ctx.globalAlpha = 0.7;
          ctx.drawImage(neige[Math.floor(e.t * 24) % neige.length], 0, 0, VW, VH);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 28px Consolas, monospace';
          ctx.fillText('CONNEXION…', VW / 2, VH / 2);
        } else {
          // La camera balaie la piece, de gauche a droite, et marque un
          // temps a chaque bout.
          var max = Math.max(0, rendu.w * K - VW);
          var u = (Math.sin(e.camT * 2 * Math.PI / 16) + 1) / 2;
          u = Math.max(0, Math.min(1, (u - 0.12) / 0.76));
          u = u * u * (3 - 2 * u);
          var off = max ? max * u : (rendu.w * K - VW) / 2;
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(rendu.canvas, -off, 0, rendu.w * K, rendu.h * K);
          e.vue = { cle: cam.scene, rendu: rendu, off: off };
          occupants(k).forEach(function (o) { o.f(off); });
          if (sec) sec.dessiner(cam.scene, ctx, off, K, VW, VH);
          if (k === '09') dessinerCourse(off);
        }
      }

      // L'image de surveillance : un peu delavee.
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = 'rgba(128,128,128,.3)';
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalCompositeOperation = 'source-over';

      // Le grain, plus fort quand la camera vient d'etre derangee, et la
      // bande claire qui descend lentement.
      ctx.globalAlpha = Math.min(0.92, 0.06 + e.glitch * 0.8);
      ctx.drawImage(neige[Math.floor(e.t * 24) % neige.length], 0, 0, VW, VH);
      ctx.globalAlpha = 1;
      var by = (e.t * 90) % (VH + 200) - 100;
      var gb = ctx.createLinearGradient(0, by - 60, 0, by + 60);
      gb.addColorStop(0, 'rgba(255,255,255,0)');
      gb.addColorStop(0.5, 'rgba(255,255,255,.05)');
      gb.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gb;
      ctx.fillRect(0, by - 60, VW, 120);
      if (e.glitch > 0.3) {
        for (var i = 0; i < 5; i++) {
          var y = Math.random() * VH, hh = 6 + Math.random() * 50;
          ctx.drawImage(cv, 0, y, VW, hh, (Math.random() - 0.5) * 90 * e.glitch, y, VW, hh);
        }
      }
      ctx.drawImage(vig, 0, 0);

      // Le lisere et le point rouge qui clignote.
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, VW - 28, VH - 28);
      // A droite du bouton du son, qui occupe le coin.
      if (Math.floor(e.t * 1.6) % 2) {
        ctx.fillStyle = '#e8261c';
        ctx.beginPath(); ctx.arc(100, 46, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f4f4f0'; ctx.font = 'bold 22px Consolas, monospace'; ctx.textAlign = 'left';
        ctx.fillText('REC', 118, 54);
      }
    }

    // Une hallucination : un visage plein ecran, une fraction de seconde.
    function dessinerVision() {
      var v = e.vision;
      if (!v || e.t > v.fin) return;
      var im = image(v.k);
      if (!pret(im)) return;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, VW, VH);
      var Rg = animes() && PANT.RIGS[v.k];
      if (Rg) {
        // La tete, grande ouverte, qui tremble plein cadre.
        var q = PANT.poser('vision', vivant('vision'), e.t, dtImage, true);
        var s = VH * 0.42 / Rg.tete[2];
        PANT.dessiner(ctx, v.k, im, q,
          { s: s, tx: VW / 2 - Rg.tete[0] * s, ty: VH * 0.5 - Rg.tete[1] * s, vw: VW, vh: VH },
          { yeux: 1, contraste: 1.4, desat: -0.6, integre: false });
      } else {
        var w = VW * 0.9, h = w * im.naturalHeight / im.naturalWidth;
        ctx.drawImage(im, VW / 2 - w / 2 + hasard(-10, 10), -h * 0.05 + hasard(-8, 8), w, h);
      }
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#a01818';
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalCompositeOperation = 'source-over';
    }

    function attente() {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = '#bbb'; ctx.textAlign = 'center'; ctx.font = '24px Consolas, monospace';
      ctx.fillText('Chargement… ' + Math.round(R.progression() * 100) + ' %', VW / 2, VH / 2);
    }

    // Le jumpscare. Sur les cameras, l'image se dechire, son visage passe
    // dans le flux, et la tablette est arrachee. Puis il bondit : du cote
    // de la porte par laquelle il est entre, il fonce sur nous, rebondit,
    // se debat la gueule grande ouverte, et finit par nous mordre l'ecran.
    function dessinerPeur(dt) {
      var p = e.peur;
      p.t += dt;
      var key = p.cle, Rg = PANT.squelette(key), im = image(key);
      var T0 = p.de === 'cam' ? 0.6 : 0, u = p.t - T0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, VW, VH);

      if (u < 0) {
        var v = p.t;
        if (v < 0.35) {
          // Le flux qui se dechire, et lui qui passe dedans, par eclats.
          ctx.drawImage(p.fond, 0, 0);
          if (Math.floor(v * 22) % 3 !== 1) {
            var qv = PANT.poser('vision', p.st, p.t, dt, true);
            var sv = VH * (0.16 + v * 0.5) / Rg.tete[2];
            PANT.dessiner(ctx, key, im, qv,
              { s: sv, tx: VW / 2 - Rg.tete[0] * sv + hasard(-20, 20), ty: VH * 0.5 - Rg.tete[1] * sv, vw: VW, vh: VH },
              { lum: 0.7, yeux: 1, contraste: 1.3 });
          }
          for (var i = 0; i < 9; i++) {
            var y = Math.random() * VH, hh = 8 + Math.random() * 70;
            ctx.drawImage(cv, 0, y, VW, hh, (Math.random() - 0.5) * 220, y, VW, hh);
          }
          ctx.globalAlpha = 0.35 + v;
          ctx.drawImage(neige[Math.floor(p.t * 30) % neige.length], 0, 0, VW, VH);
          ctx.globalAlpha = 1;
        } else {
          // La tablette arrachee : elle part vers le bas en tournant, et
          // le bureau reapparait derriere.
          if (!p.bureau) {
            p.bureau = toile(VW, VH);
            var e_ = e.fini; e.fini = false; dessinerBureau(0); e.fini = e_;
            p.bureau.getContext('2d').drawImage(cv, 0, 0);
          }
          ctx.drawImage(p.bureau, 0, 0);
          var k2 = Math.min(1, (v - 0.35) / 0.25), ea = k2 * k2;
          ctx.save();
          ctx.translate(VW / 2 + ea * 160, VH / 2 + ea * VH * 1.15);
          ctx.rotate(ea * 0.55);
          ctx.drawImage(p.fond, -VW / 2, -VH / 2);
          ctx.strokeStyle = '#141416'; ctx.lineWidth = 34;
          ctx.strokeRect(-VW / 2, -VH / 2, VW, VH);
          ctx.restore();
          ctx.globalAlpha = 0.25;
          ctx.drawImage(neige[Math.floor(p.t * 30) % neige.length], 0, 0, VW, VH);
          ctx.globalAlpha = 1;
        }
        ctx.drawImage(vig, 0, 0);
        return;
      }

      // Derriere lui, la piece qui s'eteint.
      var fondJ = p.bureau || p.fond;
      ctx.globalAlpha = Math.max(0, 1 - u * 3);
      ctx.drawImage(fondJ, 0, 0);
      ctx.globalAlpha = 1;
      // La trainee de l'image d'avant : un flou de mouvement.
      ctx.globalAlpha = 0.42;
      ctx.drawImage(p.trace, 0, 0);
      ctx.globalAlpha = 1;

      // L'elan : un ressort qui depasse sa cible et revient.
      var sp = 1 - Math.exp(-u * 10) * Math.cos(u * 15);
      var x0 = p.de === 'g' ? -0.3 * VW : p.de === 'd' ? 1.3 * VW : 0.5 * VW;
      var y0 = p.de === 'cam' ? 1.45 * VH : 0.7 * VH;
      var hx = x0 + (VW / 2 - x0) * sp, hy = y0 + (VH * 0.47 - y0) * sp;
      var rs = VH * (0.07 + 0.43 * Math.min(1.15, sp));
      // Et pour finir, il mord : la tete fonce dans l'ecran.
      if (u > 1.05) rs *= 1 + Math.pow((u - 1.05) / 0.3, 2) * 2.2;
      var s_ = rs / Rg.tete[2];
      var tremble = (u < 0.3 ? 4 : 14) + (u > 1.05 ? 30 : 0);
      var ox = hasard(-tremble, tremble), oy = hasard(-tremble, tremble);
      var q = PANT.poser('peur', p.st, u, dt, true);
      var cx_ = p.calque.getContext('2d');
      cx_.setTransform(1, 0, 0, 1, 0, 0);
      cx_.clearRect(0, 0, VW, VH);
      // Il arrive de biais, et se redresse en arrivant.
      var penche = (1 - Math.min(1, sp)) * (p.de === 'g' ? -0.55 : p.de === 'd' ? 0.55 : 0);
      cx_.translate(hx, hy); cx_.rotate(penche); cx_.translate(-hx, -hy);
      var flash = u < 0.07 ? 1.9 : 1.12 + Math.max(0, Math.sin(u * 29)) * 0.3;
      PANT.dessiner(cx_, key, im, q,
        { s: s_, tx: hx - Rg.tete[0] * s_, ty: hy - Rg.tete[1] * s_, vw: VW, vh: VH },
        { ecl: [[1.05, 1.0, 0.98], [0.95, 0.9, 0.88], [0.6, 0.56, 0.54]], lum: flash, yeux: 1,
          desat: -0.75, contraste: 1.45, taillesYeux: 0.75, integre: false });
      cx_.setTransform(1, 0, 0, 1, 0, 0);
      // Deux fantomes decales de part et d'autre : l'image ne suit pas.
      ctx.globalAlpha = 0.3;
      ctx.drawImage(p.calque, ox - 12, oy);
      ctx.drawImage(p.calque, ox + 12, oy);
      ctx.globalAlpha = 1;
      ctx.drawImage(p.calque, ox, oy);
      var tr = p.trace.getContext('2d');
      tr.clearRect(0, 0, VW, VH);
      tr.drawImage(p.calque, ox, oy);

      if (u < 0.06) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(0, 0, VW, VH); }
      var rouge = Math.max(0, Math.sin(u * 17)) * 0.45;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(255,' + Math.round(255 - rouge * 110) + ',' + Math.round(255 - rouge * 120) + ')';
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.05 + rouge * 0.06 + (u > 1.1 ? 0.3 : 0);
      ctx.drawImage(neige[Math.floor(p.t * 30) % neige.length], 0, 0, VW, VH);
      ctx.globalAlpha = 1;
      ctx.drawImage(vig, 0, 0);
    }

    function dessiner(dt) {
      dtImage = dt;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (e.peur) { dessinerPeur(dt); return; }
      if (e.bascule) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); }
      else if (e.cam) dessinerCamera(dt);
      else dessinerBureau(dt);
      dessinerVision();
    }

    // ---------- Le bandeau ----------

    var heureVue = -1;
    function majHud() {
      var h = heuresTenues();
      if (h !== heureVue) {
        heureVue = h;
        elHeure.textContent = (h === 0 ? 12 : h) + ' AM';
      }
      elEnergie.textContent = 'Énergie : ' + Math.ceil(e.energie) + ' %';
      elEnergie.classList.toggle('is-bas', e.energie < 15);
      var u = usage();
      elUsage.textContent = 'Usage : ';
      for (var i = 0; i < 5; i++) {
        elUsage.appendChild(el('i', 'wf-barre' + (i < u ? ' is-on' : '') +
          (i >= 3 ? ' is-rouge' : i >= 2 ? ' is-jaune' : '')));
      }
    }

    // ---------- La boucle ----------

    var brut = 0, avant = 0, hudT = 0, arrete = false;

    function pas_(ms) {
      if (arrete) return;
      if (!document.body.contains(hote)) { arreter(); return; }
      var dt = avant ? Math.min(0.1, (ms - avant) / 1000) : 0;
      avant = ms;
      if (e.bascule) e.bascule += dt;
      if (!e.fini && e.demarre && !e.pause) {
        e.t += dt;
        e.glitch = Math.max(0, e.glitch - dt * 1.4);
        e.animG += ((e.porteG ? 1 : 0) - e.animG) * Math.min(1, dt * 12);
        e.animD += ((e.porteD ? 1 : 0) - e.animD) * Math.min(1, dt * 12);

        // Les heures qui sonnent rendent certains plus hardis.
        var h = heuresTenues();
        if (h !== e.heure) {
          e.heure = h;
          (MONTEE[h] || []).forEach(function (k) { if (nuit.n !== NUIT_PERSO) ia[k] = Math.min(20, ia[k] + 1); });
        }

        if (!e.panne) {
          iaMarche('faith'); iaMarche('charlie'); iaMarche('wade');
          iaStephen();
          majEnergie(dt);
        } else if (e.t >= e.panneT && !e.boite) {
          e.boite = true;
          SON.boite(e.panneFin - e.panneT);
        } else if (e.t >= e.panneNoir) {
          attaque('wade');
        }

        // Celui qui attend derriere un rideau ferme gratte, de temps en temps.
        [['g', 'PG', 'porteG', -0.9], ['d', 'PD', 'porteD', 0.9]].forEach(function (p) {
          if (!e[p[2]] || !qui(p[1]).length || e.t < e.griffe[p[0]]) return;
          if (e.griffe[p[0]]) SON.griffe(p[3]);
          e.griffe[p[0]] = e.t + hasard(4, 9);
        });

        // La cuisine : on entend Charlie (ou pire) s'y affairer.
        if ((A.charlie.lieu === '06' || A.wade.lieu === '06') && e.t > e.cuisine) {
          SON.cuisine(regarde('06') ? 1.3 : 0.35);
          e.cuisine = e.t + hasard(3, 6);
        }

        // Les hallucinations : jamais avant la deuxieme nuit.
        if (e.vision && e.t > e.vision.fin) e.vision = null;
        if (!e.vision && nuit.n > 1 && e.t > e.prochaineVision && !e.panne) {
          e.vision = { k: choix(['wade-horror', 'faith-horror', 'charlie-horror', 'stephen-endo', 'wade-endo']),
                       fin: e.t + hasard(0.08, 0.16) };
          e.prochaineVision = e.t + hasard(40, 90) / (1 + nuit.n * 0.12);
          SON.vision();
        }

        if (e.dedans && !e.fini && e.t >= e.dedans.fin) attaque(e.dedans.k);
        if (e.dedans && !e.fini && Math.random() < 0.06) e.vacille = e.t + hasard(0.05, 0.25);
        if (!e.fini && e.t >= HEURE * 6) victoire();

        hudT -= dt;
        if (hudT <= 0) { majHud(); hudT = 0.2; }
      }
      if (!e.fini || e.peur || peur.classList.contains('is-on')) dessiner(dt);
      if (!arrete) brut = requestAnimationFrame(pas_);
    }

    function arreter() {
      arrete = true;
      if (sec) sec.arreter();
      if (brut) cancelAnimationFrame(brut);
      brut = 0;
      SON.couper();
      window.removeEventListener('keydown', auClavier);
      window.removeEventListener('resize', cadrer);
    }

    // Le carton d'ouverture : "12:00 AM — 1re nuit", puis on y est. La
    // nuit ne commence qu'une fois le bureau calcule.
    carton.className = 'wf-carton is-on is-debut';
    carton.appendChild(el('strong', 'wf-carton-heure', '12:00 AM'));
    carton.appendChild(el('span', 'wf-carton-sous', NOMS_NUIT[nuit.n]));
    var charge = el('span', 'wf-carton-charge', '');
    carton.appendChild(charge);
    var t0 = Date.now();
    var essais = setInterval(function () {
      if (arrete) { clearInterval(essais); return; }
      var ok = R.deja('bureau', 'base') && R.deja('bureau', 'lumG') && R.deja('bureau', 'lumD');
      if (!ok) { charge.textContent = 'Préparation des caméras… ' + Math.round(R.progression() * 100) + ' %'; return; }
      if (Date.now() - t0 < (reduit ? 600 : 2600)) return;
      clearInterval(essais);
      carton.className = 'wf-carton';
      carton.textContent = '';
      e.demarre = true;
      vent = SON.ventilateur();
    }, 100);

    SON.reveiller();
    majPlan();
    majHud();
    brut = requestAnimationFrame(pas_);

    // Pour les essais : regarder l'etat, avancer l'horloge.
    hote._wf = {
      etat: e, A: A, ia: ia,
      avancer: function (s) { e.t += s; },
      vider: function () { e.energie = 0.01; },
      attaque: attaque, voir: voir, basculer: basculer, secret: sec,
      victoire: function () { victoire(); }
    };
  }

  // ==========================================================
  //  Le menu, le journal, la paie
  // ==========================================================

  function viewWade(view) {
    var box = el('div', 'wf');
    view.appendChild(box);
    R.precharger();
    chargerTout();
    var musique = null;

    function vider() {
      box.textContent = '';
      box.className = 'wf';
      if (musique) { musique.arreter(0.6); musique = null; }
    }

    // On quitte le jeu depuis le menu : la boite a musique se tait.
    var veille = setInterval(function () {
      if (document.body.contains(box)) return;
      clearInterval(veille);
      if (musique) { musique.arreter(0.3); musique = null; }
    }, 500);

    // ---------- Le menu titre ----------
    function menu() {
      vider();
      box.classList.add('wf--menu');
      var etat = DP.wade();

      var fond = el('canvas', 'wf-menu-neige');
      fond.width = 320; fond.height = 180;
      box.appendChild(fond);

      // Le visage qui fixe le joueur, et qui parfois se change en un autre.
      var visage = el('div', 'wf-menu-visage');
      var vi = el('img', 'wf-menu-img');
      vi.src = DOSSIER + 'wade-horror.webp';
      vi.alt = '';
      visage.appendChild(vi);
      box.appendChild(visage);

      var gauche = el('div', 'wf-menu-g');
      var titre = el('h2', 'wf-menu-titre');
      ['Wade', 'and', 'Friends'].forEach(function (m) { titre.appendChild(el('span', null, m)); });
      gauche.appendChild(titre);
      var etoiles = etat.etoiles;
      if (etoiles) gauche.appendChild(el('div', 'wf-menu-etoiles', new Array(etoiles + 1).join('★ ')));

      var opts = el('div', 'wf-menu-opts');
      function option(txt, sous, fn) {
        var b = el('button', 'wf-menu-opt');
        b.type = 'button';
        b.appendChild(el('span', 'wf-menu-chev', '>>'));
        b.appendChild(el('span', null, txt));
        if (sous) b.appendChild(el('small', null, sous));
        b.addEventListener('click', function () { SON.reveiller(); fn(); });
        b.addEventListener('pointerenter', function () { b.focus(); });
        opts.appendChild(b);
        return b;
      }
      option('Nouvelle partie', null, function () { DP.wadeRecommencer(); journal(); });
      if (etat.nuit > 1) option('Continuer', 'Nuit ' + etat.nuit, function () { lancer(etat.nuit); });
      if (etat.faites.indexOf(5) !== -1) option('6e nuit', null, function () { lancer(6); });
      if (etat.faites.indexOf(6) !== -1) option('Nuit personnalisée', null, personnalisee);
      // Le mode essai (essai-wade.html) : toutes les nuits, sans les avoir
      // jouees, et les animatroniques a regagner.
      // En local (localhost), on est toujours en mode essai.
      var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      // En ligne, le 15 octobre 2026 de 21 h 56 a 22 h (heure du joueur) :
      // les six nuits sont ouvertes a tout le monde.
      var tt = DP.maintenant ? DP.maintenant() : Date.now();
      var fenetre = tt >= new Date(2026, 9, 15, 21, 56, 0).getTime() && tt < new Date(2026, 9, 15, 22, 0, 0).getTime();
      var essai = local || fenetre;
      try { essai = essai || sessionStorage.getItem('wade.essai') === '1'; } catch (er) {}
      if (essai) {
        opts.textContent = '';
        [1, 2, 3, 4, 5, 6].forEach(function (n) {
          var sous = { 2: 'Charlie', 3: 'Stephen', 4: 'Faith', 5: 'Wade', 6: 'Les deux fins' }[n];
          option(NOMS_NUIT[n], sous ? 'Secret : ' + sous : null, function () { if (n === 1) journal(); else lancer(n); });
        });
        option('Nuit personnalisée', null, personnalisee);
        var n4 = DP.DINDERS.filter(function (d) { return d.collection === 'wade' && DP.has(d.id); }).length;
        if (local) option('Retirer les animatroniques', n4 + ' / 5 dans la collection', function () { DP.wadeOublier(); menu(); });
      }
      gauche.appendChild(opts);
      box.appendChild(gauche);

      box.appendChild(el('p', 'wf-menu-aide',
        'A / Q : porte et lumière gauche · P / M : droite · Espace : caméras'));
      box.appendChild(el('p', 'wf-menu-v', 'La Maison du Burger · SSt-03'));

      var premier = opts.querySelector('button');
      if (premier) setTimeout(function () { premier.focus(); }, 30);

      // La neige, et le visage qui tressaille.
      var fx = fond.getContext('2d'), img = fx.createImageData(320, 180), fin = false;
      var autres = ['wade-horror', 'wade-horror', 'wade-endo', 'wade-base', 'faith-horror'];
      function anim() {
        if (fin || !document.body.contains(fond)) { fin = true; return; }
        for (var i = 0; i < img.data.length; i += 4) {
          var v = Math.random() * 255;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
        }
        fx.putImageData(img, 0, 0);
        if (marionnette) { marionnette(); requestAnimationFrame(anim); return; }
        // De loin en loin, le visage sursaute, ou en devient un autre le
        // temps d'un battement de paupieres.
        if (!sursaut && Math.random() < 0.008) {
          sursaut = true;
          vi.src = DOSSIER + choix(autres) + '.webp';
          visage.classList.add('is-tic');
          setTimeout(function () {
            vi.src = DOSSIER + 'wade-horror.webp';
            visage.classList.remove('is-tic');
            sursaut = false;
          }, hasard(70, 220));
        }
        requestAnimationFrame(anim);
      }
      var sursaut = false;

      // Avec WebGL, le visage est une marionnette : Wade respire, fixe le
      // joueur de ses yeux allumes, et sa machoire claque. D'une image a
      // l'autre, il devient parfois un autre.
      var marionnette = null;
      if (animes()) {
        var mc = el('canvas', 'wf-menu-cv'), mx = mc.getContext('2d');
        visage.appendChild(mc);
        var st = PANT.etat(), avantM = 0, tM = 0, qui_ = 'wade-horror', fin_ = 0;
        st.delai = 0;
        marionnette = function () {
          var now = performance.now(), dt = avantM ? Math.min(0.1, (now - avantM) / 1000) : 0;
          avantM = now; tM += dt;
          var b = mc.getBoundingClientRect();
          var w = Math.round(b.width), h = Math.round(b.height);
          if (!w || !h) return;
          if (mc.width !== w || mc.height !== h) { mc.width = w; mc.height = h; }
          if (tM > fin_) qui_ = 'wade-horror';
          if (qui_ === 'wade-horror' && Math.random() < 0.006) {
            qui_ = choix(['faith-horror', 'charlie-horror', 'stephen-endo', 'wade-base', 'stephen-horror']);
            fin_ = tM + hasard(0.07, 0.2);
            SON.servo(0.4);
          }
          var im = image(qui_), Rg = PANT.RIGS[qui_];
          mx.clearRect(0, 0, w, h);
          if (!pret(im)) return;
          var q = PANT.poser('cam', st, tM, dt, true, function () { SON.servo(0.3); });
          // Il reste presque dans le noir. De temps en temps un eclair le
          // revele d'un coup ; parfois tout s'eteint et il ne reste que ses
          // yeux ; et parfois il se jette vers l'ecran, la gueule ouverte.
          if (tM > eclair && Math.random() < 0.004) { eclair = tM + hasard(0.04, 0.12); SON.grain(); }
          if (tM > noirM && Math.random() < 0.0025) noirM = tM + hasard(0.4, 1.1);
          if (tM - elan > 6 && Math.random() < 0.0016) { elan = tM; SON.servo(0.6); }
          var e_ = tM - elan < 0.55 ? Math.sin(Math.PI * (tM - elan) / 0.55) : 0;
          if (e_ > 0) { q.jaw = Math.max(q.jaw, e_); q.pitch -= 0.1 * e_; }
          var lum = tM < eclair ? 0.95 : tM < noirM ? 0.015 : 0.24 + Math.sin(tM * 1.3) * 0.03;
          var s = h * 0.34 * (1 + e_ * 0.3) / Rg.tete[2];
          PANT.dessiner(mx, qui_, im, q,
            { s: s, tx: w * 0.56 - Rg.tete[0] * s, ty: h * 0.42 - Rg.tete[1] * s, vw: w, vh: h },
            { lum: lum, yeux: 1, contraste: 1.35, desat: 0.35, taillesYeux: 1.25, integre: false,
              // Eclaire par en dessous : le haut du crane se perd dans l'ombre.
              ecl: [[0.35, 0.3, 0.3], [0.75, 0.62, 0.6], [1, 0.85, 0.8]] });
          // Une teinte rouge sale, par-dessus.
          mx.globalCompositeOperation = 'source-atop';
          mx.fillStyle = tM < eclair ? 'rgba(90,10,0,.08)' : tM < noirM ? 'rgba(0,0,0,.7)' : 'rgba(70,0,0,.28)';
          mx.fillRect(0, 0, w, h);
          mx.globalCompositeOperation = 'source-over';
        };
        var eclair = 0, noirM = 0, elan = -10;
        vi.style.display = 'none';
      }
      if (!reduit) requestAnimationFrame(anim);
      else if (marionnette) requestAnimationFrame(marionnette);
      musique = SON.menu();
      // Dans le noir du menu : une respiration, un grincement de metal,
      // des coups lointains. Jamais au meme moment.
      (function bruits() {
        setTimeout(function () {
          if (!document.body.contains(fond)) return;
          var r = Math.random();
          if (r < 0.4) SON.souffle(hasard(-0.4, 0.4));
          else if (r < 0.7) SON.griffe(hasard(-0.8, 0.8));
          else SON.coups(hasard(-0.9, 0.9));
          bruits();
        }, hasard(6000, 13000));
      })();
    }

    // ---------- Le journal : l'offre d'emploi ----------
    // Comme dans FNaF : une vraie une de journal, en noir et blanc, prise
    // en photo. L'annonce est au centre et nette ; le reste de la page,
    // autour, est flou.
    var PAGE = null, ANNONCE = null;
    function unePage() {
      if (PAGE) return PAGE;
      var PW = 1700, PH = 2200, c = toile(PW, PH), x = c.getContext('2d');
      x.fillStyle = '#e9e4d6'; x.fillRect(0, 0, PW, PH);
      var ser = 'Georgia, "Times New Roman", serif';
      function ecrire(txt, X, Y, l, taille, inter, gras, it) {
        x.font = (it ? 'italic ' : '') + (gras ? 'bold ' : '') + taille + 'px ' + ser;
        var mots = txt.split(' '), ligne = '', y = Y;
        mots.forEach(function (m) {
          if (x.measureText(ligne + m).width > l && ligne) { x.fillText(ligne.trim(), X, y); y += inter; ligne = ''; }
          ligne += m + ' ';
        });
        if (ligne.trim()) { x.fillText(ligne.trim(), X, y); y += inter; }
        return y;
      }
      // Le bandeau.
      x.fillStyle = '#16130e'; x.textAlign = 'center';
      x.font = 'bold 128px ' + ser; x.fillText('Le Courrier de SSt-03', PW / 2, 160);
      x.fillRect(60, 190, PW - 120, 6); x.fillRect(60, 202, PW - 120, 2);
      x.font = 'italic 28px ' + ser;
      x.fillText('Quotidien indépendant · Édition du soir · Prix : 0,50 $', PW / 2, 240);
      x.fillRect(60, 258, PW - 120, 2);
      x.textAlign = 'left';
      // La une : sans rapport avec l'annonce. Ou presque.
      x.font = 'bold 76px ' + ser;
      ecrire('LA MAISON DU BURGER ROUVRE SES PORTES', 70, 350, PW - 140, 76, 82, true);
      x.font = 'italic 34px ' + ser;
      ecrire('Après des mois de fermeture, le restaurant familial de Wade and Friends accueille de nouveau les enfants. La direction promet que « tout est rentré dans l’ordre ».', 70, 450, PW - 140, 34, 42, false, true);
      var COLS = 4, gx = 70, gw = (PW - 140 - (COLS - 1) * 36) / COLS;
      var TXT = [
        'Les familles du quartier se souviennent encore des après-midi d’anniversaire, des chapeaux de fête et des burgers servis par Wade lui-même. Le restaurant avait fermé brusquement, sans explication, au printemps dernier. ' +
        'Interrogé sur les raisons de cette fermeture, le propriétaire s’est contenté de parler de « travaux de maintenance sur les animatroniques ». Les quatre personnages, qui avaient fait la renommée de l’établissement, ont été remis en service cette semaine.',
        'Plusieurs parents ont toutefois fait part de leur inquiétude. « Mon fils dit que Stephen l’a regardé pendant tout le repas », raconte une mère, qui préfère garder l’anonymat. « Ce n’est qu’une machine, bien sûr. Mais il ne regardait que lui. » ' +
        'La direction assure que les animatroniques sont entièrement sûrs et qu’un système de surveillance a été installé dans tout le bâtiment.',
        'Le restaurant sera ouvert tous les jours de midi à minuit. La nuit, l’établissement est fermé au public. Un gardien veillera désormais sur les lieux, de minuit à six heures du matin, comme l’exige l’assurance. ' +
        'Les animatroniques, eux, restent en mode « déambulation libre » la nuit, pour éviter que leurs servomoteurs ne se bloquent.',
        'Le menu, lui, n’a pas changé : le Wade Burger, le Requin de Stephen, le Croustillant de Faith et le Fondant de Charlie, sans oublier les célèbres Fizzies, dans leurs quatre saveurs. ' +
        'Une boutique de produits dérivés a été ajoutée à l’entrée. On y trouve des peluches des quatre amis, vendues à prix coûtant.'
      ];
      x.fillStyle = '#1e1a14';
      var finCol = [];
      for (var i = 0; i < COLS; i++) {
        var X = gx + i * (gw + 36), y = ecrire(TXT[i], X, 560, gw, 25, 33, false);
        finCol.push(y);
        if (i) x.fillRect(X - 19, 540, 1.5, 450);
      }
      // Les photos, sous les colonnes de gauche.
      x.save();
      x.filter = 'grayscale(1) contrast(1.3) brightness(.85)';
      var logo = image('logo'), pl = image('plushies');
      if (pret(logo)) x.drawImage(logo, 80, 1030, 380, 380 * logo.naturalHeight / logo.naturalWidth > 560 ? 560 : 380 * logo.naturalHeight / logo.naturalWidth);
      if (pret(pl)) x.drawImage(pl, PW - 420, 1040, 330, 495);
      x.restore();
      x.strokeStyle = '#16130e'; x.lineWidth = 3;
      x.strokeRect(70, 1020, 400, 580); x.strokeRect(PW - 430, 1030, 350, 515);
      x.font = 'italic 22px ' + ser; x.fillStyle = '#1e1a14';
      ecrire('Wade et ses amis, sur l’affiche de la réouverture.', 74, 1630, 390, 22, 28, false, true);
      ecrire('Les peluches de la boutique.', PW - 426, 1575, 340, 22, 28, false, true);
      // Les petites annonces, au milieu : et la notre, encadree.
      x.fillRect(510, 1020, PW - 1020 + 80 - 80, 4);
      x.font = 'bold 38px ' + ser; x.textAlign = 'center';
      x.fillText('PETITES ANNONCES', PW / 2, 1070);
      x.textAlign = 'left';
      var ax = 540, ay = 1100, aw = PW - 1080, ah = 600;
      x.lineWidth = 6; x.strokeRect(ax, ay, aw, ah);
      x.lineWidth = 2; x.strokeRect(ax + 12, ay + 12, aw - 24, ah - 24);
      x.textAlign = 'center';
      x.font = 'bold 74px ' + ser; x.fillText('ON RECRUTE !', ax + aw / 2, ay + 100);
      x.font = 'italic 30px ' + ser;
      x.fillText('Wade and Friends · La Maison du Burger', ax + aw / 2, ay + 150);
      x.font = '30px ' + ser;
      ecrireC('Gardien de nuit, de minuit à 6 h.', ay + 220);
      ecrireC('Surveiller les caméras, veiller sur le matériel', ay + 268);
      ecrireC('et sur nos amis animatroniques.', ay + 306);
      x.font = 'bold 56px ' + ser; x.fillText('120 $ par semaine', ax + aw / 2, ay + 400);
      x.font = '26px ' + ser; ecrireC('Se présenter au restaurant, après la fermeture.', ay + 456);
      x.font = 'italic 19px ' + ser;
      ecrireC('L’établissement décline toute responsabilité en cas de', ay + 520);
      ecrireC('blessure, de démembrement ou de disparition.', ay + 546);
      function ecrireC(t, y) { x.fillText(t, ax + aw / 2, y); }
      x.textAlign = 'left';
      // Les autres petites annonces, autour.
      x.font = '20px ' + ser;
      [['À VENDRE : costume de mascotte, odeur persistante.', 1740], ['PERDU : chat roux, répond au nom de Biscuit.', 1800],
       ['CHERCHE : témoins, parking de la Maison du Burger, nuit du 12.', 1860], ['ÉCHANGE : boîte à musique contre radio.', 1920]].forEach(function (a) {
        ecrire(a[0], 540, a[1], PW - 1080, 20, 26, false);
      });
      // Le papier : jauni, tache, plie en deux.
      for (i = 0; i < 2500; i++) {
        x.fillStyle = 'rgba(60,50,30,' + (Math.random() * 0.07).toFixed(3) + ')';
        x.fillRect(Math.random() * PW, Math.random() * PH, 1 + Math.random() * 40, 1 + Math.random() * 3);
      }
      var pli = x.createLinearGradient(0, PH / 2 - 30, 0, PH / 2 + 30);
      pli.addColorStop(0, 'rgba(0,0,0,0)'); pli.addColorStop(0.5, 'rgba(0,0,0,.18)'); pli.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = pli; x.fillRect(0, PH / 2 - 30, PW, 60);
      // Tout en noir et blanc.
      var d = x.getImageData(0, 0, PW, PH), px = d.data;
      for (i = 0; i < px.length; i += 4) {
        var g = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
        px[i] = px[i + 1] = px[i + 2] = g;
      }
      x.putImageData(d, 0, 0);
      // Une photo pas encore chargee : on redessinera la page la prochaine fois.
      if (pret(logo) && pret(pl)) PAGE = c;
      ANNONCE = { x: ax + aw / 2, y: ay + ah / 2, w: aw, h: ah };
      return c;
    }

    function journal() {
      vider();
      // On attend les photos de la page (une seconde au plus).
      var n = 0;
      (function attendre() {
        if (!(pret(image('logo')) && pret(image('plushies'))) && n++ < 10) { setTimeout(attendre, 100); return; }
        construireJournal();
      })();
    }
    function construireJournal() {
      var j = el('div', 'wf-journal');
      var flou = el('canvas', 'wf-journal-flou'), net = el('canvas', 'wf-journal-net');
      var page = unePage();
      [flou, net].forEach(function (cv) {
        cv.width = page.width; cv.height = page.height;
        cv.getContext('2d').drawImage(page, 0, 0);
        j.appendChild(cv);
      });
      j.appendChild(el('div', 'wf-journal-voile'));
      var suite = el('button', 'wf-journal-suite', 'Cliquer pour commencer');
      suite.type = 'button';
      j.appendChild(suite);
      box.appendChild(j);
      // L'annonce au centre de l'ecran, a la bonne taille.
      function placer() {
        var b = j.getBoundingClientRect();
        if (!b.width) return;
        var s = Math.min(b.width * 0.4 / ANNONCE.w, b.height * 0.56 / ANNONCE.h);
        [flou, net].forEach(function (cv) {
          cv.style.width = page.width * s + 'px';
          cv.style.height = page.height * s + 'px';
          cv.style.left = b.width / 2 - ANNONCE.x * s + 'px';
          cv.style.top = b.height / 2 - ANNONCE.y * s + 'px';
        });
        net.style.setProperty('--mx', ANNONCE.x * s + 'px');
        net.style.setProperty('--my', ANNONCE.y * s + 'px');
        net.style.setProperty('--mr', Math.max(ANNONCE.w, ANNONCE.h) * s * 0.62 + 'px');
      }
      placer();
      requestAnimationFrame(placer);
      window.addEventListener('resize', placer);
      var pret_ = false;
      setTimeout(function () { pret_ = true; j.classList.add('is-pret'); suite.focus(); }, reduit ? 0 : 2200);
      j.addEventListener('click', function () { if (pret_) { window.removeEventListener('resize', placer); lancer(1); } });
    }

    // ---------- La nuit personnalisee ----------
    function personnalisee() {
      vider();
      var etat = DP.wade();
      var niv = {};
      ['faith', 'charlie', 'stephen', 'wade'].forEach(function (k) { niv[k] = etat.perso[k] != null ? etat.perso[k] : 10; });
      var p = el('div', 'wf-perso');
      p.appendChild(el('h3', 'wf-perso-titre', 'Nuit personnalisée'));
      var rang = el('div', 'wf-perso-rang');
      Object.keys(niv).forEach(function (k) {
        var c = el('div', 'wf-perso-case');
        var im = el('img', 'wf-perso-img');
        im.src = DP.dinderImg(PERSOS[k].id);
        im.alt = '';
        c.appendChild(im);
        c.appendChild(el('strong', null, PERSOS[k].nom));
        var ligne = el('div', 'wf-perso-niv');
        var moins = el('button', 'wf-perso-btn', '<'); moins.type = 'button';
        var val = el('span', 'wf-perso-val', String(niv[k]));
        var plus = el('button', 'wf-perso-btn', '>'); plus.type = 'button';
        moins.setAttribute('aria-label', 'Baisser ' + PERSOS[k].nom);
        plus.setAttribute('aria-label', 'Monter ' + PERSOS[k].nom);
        function maj(d) { niv[k] = Math.max(0, Math.min(20, niv[k] + d)); val.textContent = niv[k]; SON.bouton(); }
        moins.addEventListener('click', function () { maj(-1); });
        plus.addEventListener('click', function () { maj(1); });
        ligne.appendChild(moins); ligne.appendChild(val); ligne.appendChild(plus);
        c.appendChild(ligne);
        rang.appendChild(c);
      });
      p.appendChild(rang);
      var btns = el('div', 'wf-carton-btns');
      var go = el('button', 'wf-gros-btn', 'PRÊT'); go.type = 'button';
      go.addEventListener('click', function () {
        DP.wadePerso(niv);
        lancer(NUIT_PERSO, niv);
      });
      var ret = el('button', 'wf-gros-btn wf-gros-btn--plat', 'RETOUR'); ret.type = 'button';
      ret.addEventListener('click', menu);
      btns.appendChild(go); btns.appendChild(ret);
      p.appendChild(btns);
      box.appendChild(p);
    }

    // ---------- La paie, au bout de la semaine ----------
    function paie(n) {
      vider();
      var c = el('div', 'wf-paie');
      var cheque = el('div', 'wf-cheque');
      var logo = el('img', 'wf-cheque-logo');
      logo.src = DOSSIER + 'logo.webp';
      logo.alt = '';
      cheque.appendChild(logo);
      var t = el('div', 'wf-cheque-txt');
      t.appendChild(el('span', 'wf-cheque-haut', 'Wade and Friends · La Maison du Burger'));
      t.appendChild(el('span', null, 'Payez à l’ordre du : gardien de nuit'));
      t.appendChild(el('strong', 'wf-cheque-somme', n === 5 ? '120,50 $' : '0,50 $'));
      t.appendChild(el('span', 'wf-cheque-mot', n === 5 ? 'Bon travail, petit !' : 'Heures supplémentaires.'));
      cheque.appendChild(t);
      c.appendChild(el('strong', 'wf-paie-titre', n === 5 ? 'Fin de la semaine' : 'Tu es resté une nuit de plus'));
      c.appendChild(cheque);
      var b = el('button', 'wf-gros-btn', 'MENU');
      b.type = 'button';
      b.addEventListener('click', menu);
      c.appendChild(b);
      box.appendChild(c);
      SON.palier();
      setTimeout(function () { b.focus(); }, 50);
    }

    function lancer(n, niv) {
      vider();
      box.classList.add('wf--jeu');
      var nuit = n === NUIT_PERSO ? { n: NUIT_PERSO, ia: niv || DP.wade().perso } : NUITS[n - 1];
      partie(box, nuit, function (choixFin) {
        if (choixFin === 'rejouer') lancer(n, niv);
        else if (choixFin === 'suivante') lancer(Math.min(5, n + 1));
        else if (choixFin === 'paie') { if (n === NUIT_PERSO) menu(); else paie(n); }
        else menu();
      });
    }

    if (window.INTRO) {
      box.appendChild(window.INTRO.ecran({
        icone: JAQUETTE,
        titre: 'Wade and Friends',
        teinte: '#e8483a',
        bouton: 'ENTRER',
        lignes: [
          'La Maison du Burger ferme à minuit.',
          'Toi, tu restes. Tu es le gardien de nuit.',
          'Wade et ses amis, eux, ne dorment jamais.'
        ],
        commencer: menu
      }));
    } else {
      menu();
    }
  }

  // ==========================================================
  //  Branchement
  // ==========================================================

  if (window.VIEWS) {
    window.VIEWS.wade = { title: 'Wade and Friends', render: viewWade };
  }

  window.MINIJEUX = window.MINIJEUX || [];
  window.MINIJEUX.unshift({
    id: 'wade', nom: 'Wade and Friends', vue: 'wade', pret: true, img: JAQUETTE,
    sous: 'La Maison du Burger · six nuits de garde'
  });

  window.WADE = { NUITS: NUITS, HEURE: HEURE, CAMS: CAMS, CHEMINS: CHEMINS };
})();
