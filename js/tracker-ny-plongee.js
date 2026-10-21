// La plongee sur New York : ce qui se passe quand on touche la balise
// blanche du DinderTracker.
//
//   0    - 0,7 s  la balise lance un ping sur la carte du tracker ;
//   0,7  - 2,6 s  la carte plonge sur la ville, de plus en plus vite ;
//   1,4  - 3,4 s  on traverse une couche de nuages ;
//   2,8  - 5 s    dessous, New York de nuit, vue du ciel : Manhattan et sa
//                 grille de rues, Central Park, les ponts, les voitures,
//                 les feux des gratte-ciel ; la camera se pose sur Midtown ;
//   5    - 5,9 s  le viseur se verrouille.
// Tout est peint en haute definition sur une toile a la taille de l'ecran ;
// la ville est dessinee une fois, puis seules ses lumieres vivent.
(function () {
  var NY = { lon: -74.006, lat: 40.713 };
  var NX = (NY.lon + 180) / 360, NYY = (90 - NY.lat) / 180;

  function lisse(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
  function entre(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function toile(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var graine = 4071;
  function alea() { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; }

  // ==========================================================
  //  La ville, dessinee une fois
  // ==========================================================
  // Coordonnees de carte : x et y de -0,2 a 1,2 (nord en haut). Manhattan
  // suit un axe incline, de sa pointe sud a sa pointe nord.
  var U0 = -0.2, U1 = 1.2, TAILLE = 2560;
  var PX = TAILLE / (U1 - U0);                 // pixels de la toile par unite
  var SUD = [0.435, 0.865], NORD = [0.625, 0.07];
  var LONG = Math.hypot(NORD[0] - SUD[0], NORD[1] - SUD[1]);
  var D = [(NORD[0] - SUD[0]) / LONG, (NORD[1] - SUD[1]) / LONG];   // vers le nord
  var E = [-D[1], D[0]];                                             // vers l'est
  function axe(p, off) { return [SUD[0] + D[0] * LONG * p + E[0] * off, SUD[1] + D[1] * LONG * p + E[1] * off]; }
  // La demi-largeur de l'ile, de la pointe sud (0) a la pointe nord (1).
  var LARG = [[0, 0.004], [0.04, 0.022], [0.12, 0.04], [0.22, 0.046], [0.35, 0.04], [0.5, 0.036],
              [0.65, 0.034], [0.8, 0.03], [0.92, 0.02], [1, 0.004]];
  function demi(p) {
    for (var i = 1; i < LARG.length; i++) {
      if (p <= LARG[i][0]) { var a = LARG[i - 1], b = LARG[i], k = (p - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * k; }
    }
    return 0.004;
  }
  var MIDTOWN = axe(0.355, 0);

  function px(p) { return [(p[0] - U0) * PX, (p[1] - U0) * PX]; }
  function chemin(pts) { var c = new Path2D(); pts.forEach(function (p, i) { var q = px(p); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); return c; }
  function bord(cote, p0, p1, n, extra, bruit) {
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var p = p0 + (p1 - p0) * i / n;
      var w = (p >= 0 && p <= 1 ? demi(p) : 0.004) + (extra ? extra(p) : 0) + (bruit ? (alea() - 0.5) * bruit : 0);
      pts.push(axe(p, cote * w));
    }
    return pts;
  }

  // La ville se dessine par petits morceaux, image apres image, pendant
  // qu'on plonge encore sur la carte : d'un bloc, elle gelerait l'ecran.
  var ville = null, chantier = null;
  function avancer(budget) {
    if (ville) return true;
    if (!chantier) chantier = chantierVille();
    var t0 = performance.now();
    while (performance.now() - t0 < budget) { if (chantier.next().done) break; }
    return !!ville;
  }
  function* chantierVille() {
    graine = 4071;
    // Les terres.
    var manhattan = bord(-1, 0, 1, 60, null, 0.003).concat(bord(1, 1, 0, 60, null, 0.003));
    // Le New Jersey, de l'autre cote de l'Hudson ; la baie s'ouvre au sud.
    var nj = bord(-1, -0.45, 1.35, 60, function (p) { return 0.05 + (p < 0.1 ? (0.1 - p) * 0.55 : 0); }, 0.006);
    nj = nj.concat([[U0 - 0.1, U1 + 0.1], [U0 - 0.1, U0 - 0.1], [nj[nj.length - 1][0], U0 - 0.1]]);
    // Brooklyn et Queens, au-dela de l'East River ; au nord, le bras de mer.
    var bq = bord(1, -0.5, 0.74, 50, function (p) { return 0.026 + (p < 0 ? -p * 0.35 : 0); }, 0.005);
    var nordBQ = bq[bq.length - 1];
    bq = bq.concat([[U1 + 0.1, nordBQ[1] + 0.01], [U1 + 0.1, U1 + 0.1], [bq[0][0], U1 + 0.1]]);
    // Le Bronx, au nord de la Harlem River.
    var bx = bord(1, 0.78, 1.35, 30, function () { return 0.013; }, 0.003);
    bx = bx.concat([[U1 + 0.1, U0 - 0.1], [U1 + 0.1, axe(0.78, 0.1)[1] - 0.03]]);
    bx.push([axe(0.78, 0.05)[0], axe(0.78, 0.05)[1] - 0.01]);
    var staten = [], gouv = [], liberte = [0.375, 0.92];
    for (var i = 0; i < 30; i++) {
      var a = i / 30 * 6.283;
      staten.push([0.17 + Math.cos(a) * 0.16 * (0.9 + alea() * 0.15), 1.08 + Math.sin(a) * 0.13 * (0.9 + alea() * 0.15)]);
      gouv.push([axe(-0.05, 0.03)[0] + Math.cos(a) * 0.009, axe(-0.05, 0.03)[1] + Math.sin(a) * 0.007]);
    }
    var terres = { manhattan: chemin(manhattan), nj: chemin(nj), bq: chemin(bq), bx: chemin(bx),
                   staten: chemin(staten), gouv: chemin(gouv) };

    var fond = toile(TAILLE, TAILLE), f = fond.getContext('2d');
    var lum = toile(TAILLE, TAILLE), l = lum.getContext('2d');

    // L'eau : un bleu nuit, a peine moire.
    var ge = f.createLinearGradient(0, 0, TAILLE, TAILLE);
    ge.addColorStop(0, '#061224'); ge.addColorStop(1, '#030914');
    f.fillStyle = ge; f.fillRect(0, 0, TAILLE, TAILLE);
    f.globalAlpha = 0.05;
    for (i = 0; i < 900; i++) {
      f.fillStyle = alea() < 0.5 ? '#2a5a8a' : '#0a1a30';
      f.fillRect(alea() * TAILLE, alea() * TAILLE, 30 + alea() * 120, 1.5);
    }
    f.globalAlpha = 1;
    // Les reflets de la ville sur l'eau, le long des rives.
    l.save(); l.globalCompositeOperation = 'lighter';
    l.lineJoin = 'round';
    ['manhattan', 'nj', 'bq', 'bx', 'staten'].forEach(function (k) {
      l.strokeStyle = 'rgba(255,150,60,.05)'; l.lineWidth = 34; l.stroke(terres[k]);
      l.strokeStyle = 'rgba(255,170,80,.06)'; l.lineWidth = 12; l.stroke(terres[k]);
    });
    l.restore();
    // Les terres : presque noires, un grain de toits.
    Object.keys(terres).forEach(function (k) {
      f.fillStyle = k === 'manhattan' ? '#0e0f14' : '#0b0c10';
      f.fill(terres[k]);
    });
    // Les quais, un liseré plus clair.
    f.strokeStyle = 'rgba(120,130,150,.25)'; f.lineWidth = 2;
    Object.keys(terres).forEach(function (k) { f.stroke(terres[k]); });

    // Central Park : un rectangle sombre le long de l'axe, et ses lacs.
    var parc = chemin([axe(0.40, -0.012), axe(0.60, -0.012), axe(0.60, 0.012), axe(0.40, 0.012)]);
    f.fillStyle = '#0a1a10'; f.fill(parc);
    f.fillStyle = 'rgba(30,60,35,.6)';
    for (i = 0; i < 500; i++) {
      var pp = axe(0.40 + alea() * 0.2, (alea() - 0.5) * 0.023), q = px(pp);
      f.beginPath(); f.arc(q[0], q[1], 1 + alea() * 3, 0, 6.29); f.fill();
    }
    var lac = px(axe(0.52, 0.002));
    f.fillStyle = '#071628'; f.beginPath(); f.ellipse(lac[0], lac[1], 9, 16, Math.atan2(D[1], D[0]) + 1.57, 0, 6.29); f.fill();

    yield;
    // Les rues : une grille par quartier, dans le noir ; puis leurs lampes.
    var lampe = toile(16, 16), lx = lampe.getContext('2d');
    var gl = lx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gl.addColorStop(0, 'rgba(255,220,160,1)'); gl.addColorStop(0.25, 'rgba(255,170,80,.55)'); gl.addColorStop(1, 'rgba(255,140,40,0)');
    lx.fillStyle = gl; lx.fillRect(0, 0, 16, 16);

    // Une grille de rues et ses lampes, dessinees sur une toile a part
    // puis decoupees a la forme du quartier. Des quartiers plus ou moins
    // eclaires, au hasard d'un bruit lent.
    var tmp = toile(TAILLE, TAILLE), tx = tmp.getContext('2d');
    function eclairage(x, y) {
      return 0.5 + 0.25 * Math.sin(x * 23 + 1.3) * Math.sin(y * 19 + 0.4) + 0.25 * Math.sin(x * 61 + y * 47);
    }
    function* grille(clip, ang, pas, alphaRue, densite, taille) {
      var c = Math.cos(ang), s = Math.sin(ang), n = Math.ceil((U1 - U0) * 1.5 / pas);
      function pt(ru, rv) { return px([0.5 + ru * c - rv * s, 0.5 + ru * s + rv * c]); }
      tx.setTransform(1, 0, 0, 1, 0, 0);
      tx.globalCompositeOperation = 'source-over';
      tx.clearRect(0, 0, TAILLE, TAILLE);
      tx.globalCompositeOperation = 'lighter';
      tx.strokeStyle = 'rgba(255,165,80,' + alphaRue + ')'; tx.lineWidth = 1.2;
      tx.beginPath();
      for (var k = -n; k <= n; k++) {
        var o = k * pas, p0 = pt(-1, o), p1 = pt(1, o), q0 = pt(o, -1), q1 = pt(o, 1);
        tx.moveTo(p0[0], p0[1]); tx.lineTo(p1[0], p1[1]);
        tx.moveTo(q0[0], q0[1]); tx.lineTo(q1[0], q1[1]);
      }
      tx.stroke();
      yield;
      for (var m = 0; m < densite; m++) {
        if (m % 3000 === 2999) yield;
        var u = U0 + alea() * (U1 - U0), v = U0 + alea() * (U1 - U0);
        if (alea() > eclairage(u, v)) continue;
        var ru = (u - 0.5) * c + (v - 0.5) * s, rv = -(u - 0.5) * s + (v - 0.5) * c;
        if (alea() < 0.5) ru = Math.round(ru / pas) * pas; else rv = Math.round(rv / pas) * pas;
        var P = pt(ru, rv), tl = taille * (0.6 + alea() * 0.8);
        tx.globalAlpha = 0.3 + alea() * 0.6;
        tx.drawImage(lampe, P[0] - tl / 2, P[1] - tl / 2, tl, tl);
      }
      tx.globalAlpha = 1;
      tx.globalCompositeOperation = 'destination-in';
      tx.fill(clip);
      l.globalCompositeOperation = 'lighter';
      l.drawImage(tmp, 0, 0);
      l.globalCompositeOperation = 'source-over';
    }
    var angM = Math.atan2(D[1], D[0]) + Math.PI / 2;      // les avenues suivent l'ile
    yield* grille(terres.nj, 0.05, 0.0055, 0.2, 50000, 4);
    yield* grille(terres.bq, -0.2, 0.005, 0.22, 80000, 4);
    yield* grille(terres.bx, 0.3, 0.0052, 0.2, 30000, 4);
    yield* grille(terres.staten, 0.1, 0.007, 0.12, 12000, 3.5);
    yield* grille(terres.manhattan, Math.atan2(D[1], D[0]), 0.0042, 0, 30000, 3.5);

    // Manhattan : les avenues, plus vives, et les rues serrees.
    l.save(); l.clip(terres.manhattan); l.globalCompositeOperation = 'lighter';
    l.lineCap = 'round';
    for (var av = -6; av <= 6; av++) {
      var a0 = px(axe(0.1, av * 0.0062)), a1 = px(axe(1.05, av * 0.0062));
      l.strokeStyle = 'rgba(255,190,110,.42)'; l.lineWidth = 2.2;
      l.beginPath(); l.moveTo(a0[0], a0[1]); l.lineTo(a1[0], a1[1]); l.stroke();
    }
    l.strokeStyle = 'rgba(255,180,100,.22)'; l.lineWidth = 1.1;
    l.beginPath();
    for (var st = 0.12; st < 1; st += 0.0042) {
      var s0 = px(axe(st, -0.06)), s1 = px(axe(st, 0.06));
      l.moveTo(s0[0], s0[1]); l.lineTo(s1[0], s1[1]);
    }
    // Le bas de l'ile : des rues de travers, a l'ancienne.
    for (i = 0; i < 70; i++) {
      var c0 = axe(alea() * 0.13, (alea() - 0.5) * 0.08), ang = alea() * 3.14, lg = 0.01 + alea() * 0.03;
      var q0 = px(c0), q1 = px([c0[0] + Math.cos(ang) * lg, c0[1] + Math.sin(ang) * lg]);
      l.moveTo(q0[0], q0[1]); l.lineTo(q1[0], q1[1]);
    }
    l.stroke();
    // Broadway, en diagonale.
    l.strokeStyle = 'rgba(255,230,170,.5)'; l.lineWidth = 2.6;
    l.beginPath();
    [[0.02, -0.004], [0.2, 0.004], [0.33, -0.006], [0.4, -0.018], [0.6, -0.022], [0.95, -0.012]].forEach(function (b, k2) {
      var q = px(axe(b[0], b[1])); if (k2) l.lineTo(q[0], q[1]); else l.moveTo(q[0], q[1]);
    });
    l.stroke();
    // Les immeubles : des fenetres allumees, serrees a Midtown et Downtown.
    var cosA = Math.cos(angM - Math.PI / 2), sinA = Math.sin(angM - Math.PI / 2);
    for (i = 0; i < 50000; i++) {
      if (i % 4000 === 3999) yield;
      var p = alea();
      var dens = 0.25 + Math.exp(-Math.pow((p - 0.355) / 0.06, 2)) * 1.6 + Math.exp(-Math.pow((p - 0.06) / 0.04, 2)) * 1.8;
      if (p > 0.40 && p < 0.60) dens *= 0.12;                 // le parc
      if (alea() * 2.2 > dens) continue;
      var w = demi(Math.max(0.001, Math.min(0.999, p)));
      var B = px(axe(p, (alea() * 2 - 1) * w * 0.95));
      var tw = 1.5 + alea() * 3.5, th = 1.5 + alea() * 3;
      var chaud = alea();
      l.fillStyle = chaud < 0.6 ? 'rgba(255,225,170,' : chaud < 0.85 ? 'rgba(255,245,225,' : 'rgba(170,210,255,';
      l.fillStyle += (0.25 + alea() * 0.55) + ')';
      l.setTransform(cosA, sinA, -sinA, cosA, B[0], B[1]);
      l.fillRect(-tw / 2, -th / 2, tw, th);
      l.setTransform(1, 0, 0, 1, 0, 0);
    }
    // Times Square, en couleurs ; l'Empire State, bleu et blanc.
    function eclat(p, r, cols) {
      var q = px(p);
      cols.forEach(function (c, k3) {
        var g = l.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * (1 - k3 * 0.25));
        g.addColorStop(0, 'rgba(' + c + ',.9)'); g.addColorStop(1, 'rgba(' + c + ',0)');
        l.fillStyle = g; l.beginPath(); l.arc(q[0], q[1], r, 0, 6.29); l.fill();
      });
    }
    eclat(axe(0.372, -0.004), 13, ['255,60,160', '60,220,255', '255,240,140']);
    eclat(axe(0.312, 0.002), 7, ['120,170,255', '255,255,255']);
    l.restore();

    var RP = routesEtPonts(), routes = RP.routes, ponts = RP.ponts;
    l.save(); l.globalCompositeOperation = 'lighter'; l.lineJoin = 'round';
    routes.forEach(function (r) {
      var c = new Path2D(); r.forEach(function (p, k4) { var q = px(p); if (k4) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); });
      l.strokeStyle = 'rgba(255,170,60,.18)'; l.lineWidth = 9; l.stroke(c);
      l.strokeStyle = 'rgba(255,220,150,.55)'; l.lineWidth = 2.2; l.stroke(c);
    });
    ponts.forEach(function (b) {
      var q0 = px(b[0]), q1 = px(b[1]);
      l.strokeStyle = 'rgba(200,220,255,.25)'; l.lineWidth = 8;
      l.beginPath(); l.moveTo(q0[0], q0[1]); l.lineTo(q1[0], q1[1]); l.stroke();
      l.strokeStyle = 'rgba(255,255,255,.35)'; l.lineWidth = 1.2; l.stroke();
      for (var k5 = 0; k5 <= 14; k5++) {
        var x = q0[0] + (q1[0] - q0[0]) * k5 / 14, y = q0[1] + (q1[1] - q0[1]) * k5 / 14;
        l.drawImage(lampe, x - 3.5, y - 3.5, 7, 7);
      }
    });
    // La statue de la Liberte : un point vert et sa lumiere.
    var lib = px(liberte);
    f.fillStyle = '#10161a'; f.beginPath(); f.arc(lib[0], lib[1], 5, 0, 6.29); f.fill();
    var gli = l.createRadialGradient(lib[0], lib[1], 0, lib[0], lib[1], 16);
    gli.addColorStop(0, 'rgba(160,255,210,.95)'); gli.addColorStop(1, 'rgba(80,220,170,0)');
    l.fillStyle = gli; l.fillRect(lib[0] - 16, lib[1] - 16, 32, 32);
    l.restore();

    yield;
    // Le halo : les lumieres floutees, en petit, puis agrandies.
    var halo = toile(320, 320), hx = halo.getContext('2d');
    hx.imageSmoothingEnabled = true; hx.imageSmoothingQuality = 'high';
    hx.drawImage(lum, 0, 0, 320, 320);
    var halo2 = toile(80, 80), h2 = halo2.getContext('2d');
    h2.imageSmoothingEnabled = true; h2.drawImage(lum, 0, 0, 80, 80);

    // Tout fondu en une seule image : une seule a poser par image.
    yield;
    f.globalCompositeOperation = 'lighter';
    f.drawImage(lum, 0, 0);
    f.imageSmoothingEnabled = true; f.imageSmoothingQuality = 'high';
    f.globalAlpha = 0.55; f.drawImage(halo, 0, 0, TAILLE, TAILLE);
    f.globalAlpha = 0.35; f.drawImage(halo2, 0, 0, TAILLE, TAILLE);
    f.globalAlpha = 1; f.globalCompositeOperation = 'source-over';
    lum.width = lum.height = 1; tmp.width = tmp.height = 1;
    yield;
    pose(fond);
  }

  // Les autoroutes et les ponts : de la geometrie, pour le dessin comme
  // pour les voitures qui y roulent.
  function routesEtPonts() {
    // Les autoroutes, le long des quais : des rubans jaunes et blancs.
    var routes = [
      bord(1, 0.02, 0.98, 40, function () { return -0.004; }),                 // FDR Drive
      bord(-1, 0.02, 0.98, 40, function () { return -0.004; }),                // West Side
      bord(1, -0.4, 0.7, 30, function (p) { return 0.034 + (p < 0 ? -p * 0.35 : 0); }),   // BQE
      bord(-1, -0.3, 1.3, 40, function (p) { return 0.06 + (p < 0.1 ? (0.1 - p) * 0.55 : 0); })  // le long de l'Hudson
    ];
    // Les ponts : Brooklyn, Manhattan, Williamsburg, Queensboro, et le
    // George Washington, tout au nord.
    var ponts = [[0.04, 1, 0.045], [0.075, 1, 0.045], [0.16, 1, 0.045], [0.5, 1, 0.042], [0.93, -1, 0.075]].map(function (b) {
      return [axe(b[0], b[1] * demi(b[0])), axe(b[0] + (b[1] > 0 ? -0.01 : 0), b[1] * (demi(b[0]) + b[2]))];
    });
    return { routes: routes, ponts: ponts };
  }

  // Ce qui vit sur la ville : tire au hasard, mais toujours pareil.
  function vivants() {
    graine = 9157;
    var RP = routesEtPonts(), routes = RP.routes, ponts = RP.ponts, i;
    // Ce qui vit : les voitures sur les avenues et les quais, et les feux
    // rouges au sommet des tours.
    var voies = routes.slice(0, 2).concat([-4, -2, 0, 2, 4].map(function (o) {
      var pts = []; for (var k6 = 0; k6 <= 20; k6++) pts.push(axe(0.12 + 0.86 * k6 / 20, o * 0.0062)); return pts;
    })).concat(ponts.map(function (b) { return b; }));
    var voitures = [];
    for (i = 0; i < 260; i++) voitures.push({ v: voies[i % voies.length], p: alea(), vit: (0.012 + alea() * 0.02) * (alea() < 0.5 ? 1 : -1) });
    var feux = [];
    for (i = 0; i < 60; i++) {
      var pf = alea() < 0.75 ? 0.355 + (alea() - 0.5) * 0.12 : 0.06 + (alea() - 0.5) * 0.08;
      feux.push({ p: axe(pf, (alea() * 2 - 1) * demi(pf) * 0.8), ph: alea() * 6.28, f: 0.8 + alea() * 0.6 });
    }
    var etincelles = [];
    for (i = 0; i < 500; i++) {
      var pe = 0.355 + (alea() - 0.5) * 0.2;
      etincelles.push({ p: axe(pe, (alea() * 2 - 1) * demi(pe)), ph: alea() * 6.28, f: 1 + alea() * 3 });
    }

    return { voitures: voitures, feux: feux, etincelles: etincelles };
  }

  // La ville prete : l'image, sa copie reduite, et ce qui vit dessus.
  function pose(img, reduite) {
    if (!reduite) {
      reduite = toile(TAILLE / 2, TAILLE / 2);
      var dx = reduite.getContext('2d');
      dx.imageSmoothingEnabled = true; dx.imageSmoothingQuality = 'high';
      dx.drawImage(img, 0, 0, TAILLE / 2, TAILLE / 2);
    }
    var V = vivants();
    V.fond = img; V.reduite = reduite;
    ville = V;
  }

  // La ville est deja peinte, dans les assets : il n'y a qu'a la charger.
  // Si elle manque, on la peint sur place, morceau par morceau.
  var IMAGE_VILLE = 'assets/items/ny-nuit.webp', IMAGE_REDUITE = 'assets/items/ny-nuit-reduite.webp', imVille = null, imRatee = false, imPrete = false, imReduite = null;
  function charger() {
    if (imVille || ville) return;
    imVille = new Image();
    imVille.onerror = function () { imRatee = true; };
    imVille.src = IMAGE_VILLE;
    // Decodee a part, pour ne pas geler l'ecran en la posant.
    // Et sa copie reduite, deja prete elle aussi.
    var red = new Image(), n = 0;
    red.src = IMAGE_REDUITE;
    function une() { if (++n === 2) { imReduite = red.naturalWidth ? red : null; imPrete = true; } }
    [imVille, red].forEach(function (im) {
      if (im.decode) im.decode().then(une, une);
      else if (im.complete) une();
      else { im.onload = une; }
    });
  }
  function prete(budget) {
    if (ville) return true;
    charger();
    if (imPrete && imVille.naturalWidth) { pose(imVille, imReduite); return true; }
    if (imRatee) return avancer(budget);
    return false;
  }
  // Pour peindre l'image des assets (une fois, a la main).
  function generer() {
    var it = chantierVille(), r;
    do { r = it.next(); } while (!r.done);
    return ville.fond.toDataURL('image/webp', 0.92);
  }

  // Les nuages : une texture de volutes, tiree une fois.
  var nuages = null;
  function construireNuages() {
    if (nuages) return nuages;
    var c = toile(512, 512), x = c.getContext('2d');
    for (var i = 0; i < 110; i++) {
      var X = 256 + (alea() - 0.5) * 450, Y = 256 + (alea() - 0.5) * 450, R = 20 + alea() * 80;
      var g = x.createRadialGradient(X, Y, 0, X, Y, R);
      var a = 0.05 + alea() * 0.18;
      g.addColorStop(0, 'rgba(150,162,188,' + a + ')'); g.addColorStop(0.6, 'rgba(110,122,150,' + a * 0.5 + ')');
      g.addColorStop(1, 'rgba(90,100,130,0)');
      x.fillStyle = g; x.fillRect(X - R, Y - R, 2 * R, 2 * R);
    }
    nuages = c;
    return c;
  }

  // ==========================================================
  //  La sequence
  // ==========================================================
  function lancer(scene, carte, o) {
    o = o || {};
    var SON = o.son, reduit = !!o.reduit, Z = (o.duree || 5000) / 1000;
    charger();
    construireNuages();
    var carteImg = new Image();
    carteImg.src = 'assets/items/worldmap.png';
    var cv = document.createElement('canvas');
    cv.className = 'ny-plongee';
    scene.insertBefore(cv, scene.firstChild.nextSibling);
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    function taille() {
      var r = carte.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(2, Math.round(r.width * dpr)); H = Math.max(2, Math.round(r.height * dpr));
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    }
    taille();
    var debut = performance.now(), anim = 0, fini = false, sons = {}, remonte = 0;
    function sonner(nom, f) { if (!SON || sons[nom]) return; sons[nom] = true; try { f(); } catch (e) {} }

    function carteMonde(t) {
      if (!carteImg.complete || !carteImg.naturalWidth) return;
      // De la carte entiere a la ville, de plus en plus vite.
      var k = Math.pow(entre(t, 0.7, 2.9), 2.4);
      var s = Math.exp(Math.log(16) * k);
      var cx = W * (NX + (0.5 - NX) * lisse(entre(t, 0.6, 2.2))), cy = H * (NYY + (0.5 - NYY) * lisse(entre(t, 0.6, 2.2)));
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;
      ctx.drawImage(carteImg, cx - NX * W * s, cy - NYY * H * s, W * s, H * s);
      // Le flou de la vitesse.
      if (k > 0.15 && !reduit) {
        for (var i = 1; i <= 3; i++) {
          var s2 = s * (1 - i * 0.035 * k);
          ctx.globalAlpha = 0.18;
          ctx.drawImage(carteImg, cx - NX * W * s2, cy - NYY * H * s2, W * s2, H * s2);
        }
        ctx.globalAlpha = 1;
      }
      // La nuit tombe sur la carte a mesure qu'on descend.
      ctx.fillStyle = 'rgba(3,6,14,' + (0.15 + 0.6 * k) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    // La camera sur la ville : largeur de vue (en unites de carte) et centre.
    function camera(t) {
      var k = lisse(entre(t, 2.6, Z));
      var e = 1 - Math.pow(1 - entre(t, 2.6, Z), 3);
      var larg = 1.1 * Math.pow(0.6 / 1.1, e);
      var c = [0.52 + (MIDTOWN[0] - 0.52) * k, 0.56 + (MIDTOWN[1] - 0.56) * k];
      var rot = (1 - e) * 0.22;
      return { larg: larg, c: c, rot: rot };
    }
    function versEcran(cam) {
      var s = W / (cam.larg * PX);
      return { s: s, f: function (p) {
        var x = (p[0] - cam.c[0]) * PX * s, y = (p[1] - cam.c[1]) * PX * s;
        var co = Math.cos(cam.rot), si = Math.sin(cam.rot);
        return [W / 2 + x * co - y * si, H / 2 + x * si + y * co];
      } };
    }

    function laVille(t, camF, fondu) {
      if (!ville) return;
      var V = ville, cam = camF || camera(t), T = versEcran(cam), s = T.s;
      var a = lisse(entre(t, 2.5, 3.3)) * (fondu == null ? 1 : fondu);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(W / 2, H / 2); ctx.rotate(cam.rot);
      ctx.translate(-(cam.c[0] - U0) * PX * s, -(cam.c[1] - U0) * PX * s);
      // Un lissage simple (le lissage fin coute trop a chaque image) ; vue
      // de loin, on pose la copie reduite, deja lissee, pour que rien ne
      // scintille.
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(s < 0.7 ? V.reduite : V.fond, 0, 0, TAILLE * s, TAILLE * s);
      ctx.restore();

      // Ce qui bouge, dessine net a la resolution de l'ecran.
      var T2 = performance.now() / 1000;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      var r = Math.max(1, s * PX * 0.0009);
      V.voitures.forEach(function (v) {
        if (!reduit) v.p = (v.p + v.vit * 0.016 + 1) % 1;
        var n = v.v.length - 1, i = Math.min(n - 1, Math.floor(v.p * n)), k = v.p * n - i;
        var p = [v.v[i][0] + (v.v[i + 1][0] - v.v[i][0]) * k, v.v[i][1] + (v.v[i + 1][1] - v.v[i][1]) * k];
        var q = T.f(p);
        if (q[0] < -10 || q[0] > W + 10 || q[1] < -10 || q[1] > H + 10) return;
        ctx.fillStyle = v.vit > 0 ? 'rgba(255,250,235,.95)' : 'rgba(255,60,50,.95)';
        ctx.fillRect(q[0] - r, q[1] - r, r * 2, r * 2);
      });
      V.etincelles.forEach(function (e) {
        var q = T.f(e.p), b = 0.5 + 0.5 * Math.sin(T2 * e.f + e.ph);
        if (b < 0.6) return;
        ctx.fillStyle = 'rgba(255,240,200,' + ((b - 0.6) * 2).toFixed(2) + ')';
        ctx.fillRect(q[0] - r * 0.7, q[1] - r * 0.7, r * 1.4, r * 1.4);
      });
      V.feux.forEach(function (f) {
        var on = Math.sin(T2 * f.f * 3.1 + f.ph) > 0.55;
        if (!on) return;
        var q = T.f(f.p), R = r * 5;
        var g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], R);
        g.addColorStop(0, 'rgba(255,80,60,1)'); g.addColorStop(0.3, 'rgba(255,30,30,.5)'); g.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(q[0] - R, q[1] - R, R * 2, R * 2);
      });
      ctx.restore();
    }

    function lesNuages(t) {
      var N = construireNuages();
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      // Quatre couches, chacune un peu plus pres : elles grossissent en
      // fonçant vers nous, puis s'ecartent.
      for (var i = 0; i < 4; i++) {
        var t0 = 1.3 + i * 0.35, u = t - t0;
        if (u < 0 || u > 2.2) continue;
        var s = Math.min(W, H) / 1024 * 0.6 * Math.exp(u * 1.9);
        var a = Math.min(1, u / 0.5) * (1 - lisse(entre(u, 1.2, 2.2)));
        ctx.globalAlpha = a * 0.95;
        ctx.save();
        ctx.translate(W / 2 + (i - 1.5) * W * 0.1, H / 2 + (i % 2 ? 1 : -1) * H * 0.06);
        ctx.rotate(i * 1.3);
        ctx.drawImage(N, -512 * s, -512 * s, 1024 * s, 1024 * s);   // la texture fait 512 : agrandie
        ctx.restore();
      }
      ctx.restore();
      // Au coeur de la couche, on ne voit plus rien que du gris.
      var brume = lisse(entre(t, 2.0, 2.55)) * (1 - lisse(entre(t, 2.75, 3.5)));
      if (brume > 0) { ctx.fillStyle = 'rgba(78,88,110,' + (brume * 0.93).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    }

    function ping(t) {
      // Trois ondes qui partent de la balise.
      var x = W * NX, y = H * NYY;
      ctx.save();
      for (var i = 0; i < 3; i++) {
        var u = t - i * 0.18;
        if (u < 0 || u > 1) continue;
        var R = (0.02 + u * 0.22) * W;
        ctx.strokeStyle = 'rgba(255,255,255,' + (1 - u).toFixed(2) + ')';
        ctx.lineWidth = 2.5 * dpr * (1 - u) + dpr;
        ctx.beginPath(); ctx.arc(x, y, R, 0, 6.29); ctx.stroke();
      }
      var g = ctx.createRadialGradient(x, y, 0, x, y, 40 * dpr);
      g.addColorStop(0, 'rgba(255,255,255,' + (1 - entre(t, 0, 1.2)).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 40 * dpr, y - 40 * dpr, 80 * dpr, 80 * dpr);
      ctx.restore();
    }

    function texte(txt, x, y, taille, col, align) {
      ctx.font = 'bold ' + Math.round(taille * dpr) + 'px "Courier New", Courier, monospace';
      ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = col; ctx.fillText(txt, x, y);
    }

    // Le viseur et les mesures, par-dessus tout.
    function viseur(t) {
      var verrou = entre(t, Z, Z + 0.35), u = dpr;
      var col = verrou > 0 ? 'rgba(160,250,255,' : 'rgba(255,255,255,';
      ctx.save();
      ctx.lineWidth = 2 * u;
      // Les coins de l'ecran.
      var m = 18 * u, L = 34 * u;
      ctx.strokeStyle = col + '.75)';
      [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(function (c) {
        ctx.beginPath(); ctx.moveTo(c[0], c[1] + c[3] * L); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0] + c[2] * L, c[1]); ctx.stroke();
      });
      // La mire : elle se resserre pendant la descente, tourne, et se fige.
      var serre = lisse(entre(t, 0.6, Z)), cx = W / 2, cy = H / 2;
      var R = Math.min(W, H) * (0.42 - 0.27 * serre) * (1 - verrou * 0.12);
      var rotM = reduit ? 0 : (1 - verrou) * t * 0.9;
      ctx.strokeStyle = col + (0.35 + 0.5 * serre) + ')';
      ctx.setLineDash([10 * u, 8 * u]);
      ctx.beginPath(); ctx.arc(cx, cy, R, rotM, rotM + 6.283); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, 6.283); ctx.stroke();
      for (var i = 0; i < 4; i++) {
        var a = i * Math.PI / 2 + rotM * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.62, cy + Math.sin(a) * R * 0.62);
        ctx.lineTo(cx + Math.cos(a) * R * 1.12, cy + Math.sin(a) * R * 1.12);
        ctx.stroke();
      }
      // Les crochets du verrouillage, qui claquent sur la cible.
      if (verrou > 0) {
        var b = R * (0.9 - 0.3 * lisse(verrou)), lb = R * 0.25;
        ctx.lineWidth = 3 * u;
        ctx.strokeStyle = 'rgba(160,250,255,.95)';
        ctx.shadowColor = 'rgba(80,220,255,.9)'; ctx.shadowBlur = 12 * u;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
          ctx.beginPath();
          ctx.moveTo(cx + c[0] * b, cy + c[1] * (b - lb)); ctx.lineTo(cx + c[0] * b, cy + c[1] * b); ctx.lineTo(cx + c[0] * (b - lb), cy + c[1] * b);
          ctx.stroke();
        });
        ctx.shadowBlur = 0;
        // L'onde du verrouillage.
        var o2 = entre(t, Z, Z + 0.8);
        if (o2 < 1) {
          ctx.strokeStyle = 'rgba(160,250,255,' + (1 - o2).toFixed(2) + ')';
          ctx.lineWidth = 3 * u * (1 - o2) + u;
          ctx.beginPath(); ctx.arc(cx, cy, R * (0.6 + o2 * 1.6), 0, 6.283); ctx.stroke();
        }
      }
      ctx.fillStyle = col + '.9)';
      ctx.beginPath(); ctx.arc(cx, cy, 2.5 * u, 0, 6.283); ctx.fill();

      // Les mesures, en haut a gauche.
      var k = entre(t, 0.6, Z);
      var alt = 35786 * Math.pow(0.9 / 35786, Math.pow(k, 0.8));
      var lignes = [
        'DINDERTRACKER  //  SIGNAL ' + (verrou > 0 ? 'VERROUILLÉ' : 'INCONNU'),
        'ALTITUDE   ' + (alt >= 10 ? Math.round(alt).toLocaleString('fr-FR') : alt.toFixed(1)) + ' km',
        'ÉCHELLE    1:' + Math.round(alt * 2800).toLocaleString('fr-FR'),
        'CIBLE      ' + (verrou > 0 ? 'MIDTOWN, MANHATTAN' : t < 2.6 ? 'AMÉRIQUE DU NORD' : 'NEW YORK, NY')
      ];
      var x0 = 36 * u, y0 = 34 * u, fs = 13;
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(x0 - 10 * u, y0 - 8 * u, 330 * u, (lignes.length * 18 + 12) * u);
      lignes.forEach(function (l, i2) { texte(l, x0, y0 + i2 * 18 * u, fs, i2 === 0 ? col + '1)' : 'rgba(220,235,255,.85)'); });
      // La triangulation, en haut a droite.
      var tri = Math.min(1, t / Z), x1 = W - 36 * u, y1 = 40 * u, lw = 170 * u;
      texte(verrou > 0 ? 'ACQUISITION  100 %' : 'ACQUISITION  ' + Math.floor(tri * 99) + ' %', x1, y1, 13, col + '.95)', 'right');
      ctx.strokeStyle = col + '.6)'; ctx.lineWidth = u;
      ctx.strokeRect(x1 - lw, y1 + 22 * u, lw, 8 * u);
      ctx.fillStyle = col + '.85)';
      ctx.fillRect(x1 - lw + 2 * u, y1 + 24 * u, (lw - 4 * u) * (verrou > 0 ? 1 : tri), 4 * u);
      // Le mot du verrouillage, au-dessus de la cible.
      if (verrou > 0) {
        var clign = reduit || Math.floor(t * 6) % 2 === 0 || t > Z + 0.7;
        if (clign) texte('▸ SIGNAL VERROUILLÉ ◂', cx, cy - R - 34 * u, 16, 'rgba(160,250,255,1)', 'center');
      } else if (t < 0.9) {
        if (Math.floor(t * 8) % 2 === 0) texte('SIGNAL INCONNU DÉTECTÉ', cx, H * 0.12, 16, 'rgba(255,255,255,.95)', 'center');
      }
      ctx.restore();
    }

    function voile() {
      // Lignes de balayage et vignette : l'image d'un ecran.
      var v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,.08)';
      for (var y = 0; y < H; y += 3 * dpr) ctx.fillRect(0, y, W, dpr);
    }

    function image(now) {
      if (fini) return;
      if (!document.body.contains(scene)) { arreter(); return; }
      // Le code accepte : la camera remonte au-dessus de la ville, qui
      // s'efface sur le debut du recul vers la Terre.
      if (scene.classList.contains('is-recul')) {
        if (!remonte) { remonte = now; cv.style.zIndex = '1'; }
        var r = (now - remonte) / 1000;
        if (r > 1.3 || reduit || !ville) { arreter(); if (cv.parentNode) cv.remove(); return; }
        taille();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, W, H);
        var cf = camera(Z + 1);
        // Elle s'eloigne sans jamais montrer ses bords, et s'efface.
        cf = { larg: Math.min(1.25, cf.larg * (1 + 1.2 * lisse(r / 1.3))), c: cf.c, rot: 0 };
        laVille(Z + 1, cf, 1 - lisse(entre(r, 0.15, 1.2)));
        anim = requestAnimationFrame(image);
        return;
      }
      taille();
      var t = (now - debut) / 1000;
      if (reduit) t = Math.max(t, Z + 0.4);
      // Si la ville n'est pas prete a temps, on reste dans les nuages.
      var ok = prete(t < 2.3 ? 9 : 30);
      if (!ok && t > 2.6 && !reduit) { debut += (t - 2.6) * 1000; t = 2.6; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = '#03050a'; ctx.fillRect(0, 0, W, H);
      if (t < 3.4) carteMonde(t);
      if (t < 1.4) ping(t);
      laVille(t);
      if (t > 1.2 && t < 3.6 && !reduit) lesNuages(t);
      voile();
      viseur(t);
      // Les sons.
      sonner('ping', function () { SON.ping(); });
      if (t > 0.6) sonner('descente', function () { SON.descente(Z - 0.6); });
      if (t > Z) sonner('verrou', function () { SON.verrou(); });
      anim = requestAnimationFrame(image);
    }
    anim = requestAnimationFrame(image);

    function arreter() { fini = true; if (anim) cancelAnimationFrame(anim); anim = 0; }
    return { arreter: arreter };
  }

  // ==========================================================
  //  La tablette, en haute definition
  // ==========================================================
  var tabletteUrl = null;
  function tablette() {
    if (tabletteUrl) return tabletteUrl;
    var c = toile(240, 320), x = c.getContext('2d');
    function arrondi(X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
    // Le boitier : du metal sombre, un liseré de lumiere.
    var g = x.createLinearGradient(0, 0, 240, 320);
    g.addColorStop(0, '#3a4256'); g.addColorStop(0.5, '#1b2030'); g.addColorStop(1, '#0d1018');
    arrondi(10, 10, 220, 300, 26); x.fillStyle = g; x.fill();
    x.strokeStyle = 'rgba(160,230,255,.55)'; x.lineWidth = 3; x.stroke();
    arrondi(16, 16, 208, 288, 21); x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 2; x.stroke();
    // L'ecran.
    var ge = x.createLinearGradient(0, 30, 0, 250);
    ge.addColorStop(0, '#0b3a44'); ge.addColorStop(1, '#04161c');
    arrondi(28, 32, 184, 222, 10); x.fillStyle = ge; x.fill();
    x.save(); x.clip();
    x.fillStyle = 'rgba(58,214,240,.08)';
    for (var y = 32; y < 254; y += 4) x.fillRect(28, y, 184, 1);
    x.fillStyle = '#3ad6f0'; x.font = 'bold 17px "Courier New", monospace'; x.textAlign = 'center';
    x.shadowColor = '#3ad6f0'; x.shadowBlur = 10;
    x.fillText('CODE D’ACCÈS', 120, 66);
    x.fillStyle = '#9af6ff';
    x.fillText('_ _ _ _ _ _', 120, 100);
    x.shadowBlur = 6;
    for (var r = 0; r < 4; r++) for (var k = 0; k < 3; k++) {
      arrondi(52 + k * 48, 122 + r * 30, 38, 22, 5);
      x.fillStyle = r === 3 && k === 2 ? 'rgba(58,214,240,.6)' : 'rgba(58,214,240,.18)'; x.fill();
      x.strokeStyle = 'rgba(154,246,255,.6)'; x.lineWidth = 1.2; x.stroke();
    }
    x.restore();
    // Le reflet sur la vitre, et le bouton.
    var gr = x.createLinearGradient(28, 32, 160, 200);
    gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)');
    arrondi(28, 32, 184, 222, 10); x.fillStyle = gr; x.fill();
    x.beginPath(); x.arc(120, 282, 12, 0, 6.29);
    x.fillStyle = '#262c3c'; x.fill(); x.strokeStyle = 'rgba(160,230,255,.6)'; x.lineWidth = 2; x.stroke();
    tabletteUrl = c.toDataURL('image/png');
    return tabletteUrl;
  }

  window.NY_PLONGEE = { lancer: lancer, tablette: tablette, generer: generer };
})();
