// Wade and Friends : les secrets des nuits, et les deux fins.
//
// Chaque nuit, de la deuxieme a la sixieme, cache une enigme : une suite
// d'endroits a toucher, dans le bureau et sur les cameras, dans l'ordre.
// Rien a l'ecran ne la suggere. Un pas juste ne fait qu'une note de boite
// a musique, a peine audible ; un endroit d'une autre etape, touche trop
// tot, fait tout repartir de zero.
//   nuit 2 : Charlie  (puis son jeu : le steak) ;
//   nuit 3 : Stephen  (puis son jeu : les poissons dores) ;
//   nuit 4 : Faith    (directement) ;
//   nuit 5 : Wade     (puis son jeu : les moutons d'emeraude) ;
//   nuit 6 : tout bruler, et la bonne fin. Sinon, a 6 h, la mauvaise.
//
// Les endroits sont donnes dans la piece en 3D : un clic devient un point
// de la piece (la profondeur du rendu le donne), puis une affiche et sa
// position dans l'image, ou une boite.
(function () {
  var R, SON, DP, PANT, MJ;
  function init() {
    R = window.WADE_RENDU; SON = window.WADE_SON; DP = window.DP;
    PANT = window.WADE_PANTINS; MJ = window.WADE_MINIJEUX;
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function hasard(a, b) { return a + Math.random() * (b - a); }
  function toile(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DOSSIER = 'assets/games/wade/';

  var IMGS = {};
  function image(k) {
    if (IMGS[k]) return IMGS[k];
    var im = new Image();
    im.src = DOSSIER + k + '.webp';
    IMGS[k] = im;
    return im;
  }
  function pret(im) { return im && im.complete && im.naturalWidth > 0; }

  // ==========================================================
  //  Les enigmes
  // ==========================================================

  // Les bouteilles a l'effigie de Wade, dans le frigo de la boutique :
  // [rangee, colonne] dans l'image de la porte vitree (js/wade-rendu.js).
  var FRIGO_WADE = [[0, 0], [0, 4], [1, 2], [2, 0]];
  // Les batons du panneau d'outils, en pixels de son image (500 x 260).
  var BATONS = [[60, 40, 60, 190], [120, 50, 160, 180], [240, 40, 240, 140], [330, 60, 380, 200], [430, 40, 430, 210]];
  var CARTONS = {
    cartonA: [[-2.5, 0, 4.2], [-1.6, 0.9, 5.4]],
    cartonB: [[-2.45, 0.9, 4.4], [-1.75, 1.4, 5.2]],
    cartonC: [[-2.5, 0, 2.7], [-1.8, 0.6, 3.6]]
  };

  var ENIGMES = {
    2: { dinder: 'charlie-capsule', jeu: 'charlie', etapes: [
      { cle: 'bureau', type: 'aff', tex: 'logo', u: [0.58, 0.88], v: [0.08, 0.38] },
      // Vert, orange, rouge, jaune : quatre fanions qui se suivent,
      // au-dessus de la place de Charlie.
      { cle: 'scene', type: 'fanions', ordre: [3, 4, 0, 1] },
      { cle: 'comptoir', type: 'boite', a: [1.86, 1.26, 4.85], b: [2.32, 1.76, 5.06] }] },
    3: { dinder: 'stephen-sharkodon', jeu: 'stephen', etapes: [
      { cle: 'bureau', type: 'aff', tex: 'dessins', u: [0.26, 0.5], v: [0.02, 0.82], mur: 3.6 },
      { cle: 'bassin', type: 'boite', a: [-1.66, 2.7, 5.84], b: [-0.12, 3.25, 6.03] },
      { cle: 'comptoir', type: 'aff', tex: 'menu', u: [0.02, 0.37], v: [0.48, 0.74] },
      { cle: 'coinE', type: 'aff', tex: 'dessins', u: [0.26, 0.5], v: [0.02, 0.82] }] },
    4: { dinder: 'faith-faisandoir', etapes: [
      { cle: 'boutique', type: 'boite', a: [-1.95, 1.9, 6.35], b: [-1.25, 2.5, 6.85] },
      // Le premier baton, le cinquieme, le deuxieme : ils forment un F.
      { cle: 'atelier', type: 'batons', ordre: [0, 4, 1] },
      { cle: 'salle', type: 'aff', tex: 'fizzies', u: [0.28, 0.51], v: [0, 1] }] },
    5: { dinder: 'wade-wolhunter', jeu: 'wade', etapes: [
      { cle: 'bureau', type: 'boite', a: [-1.5, 0.76, 1.35], b: [-0.94, 1.3, 1.75] },
      { cle: 'bureau', type: 'aff', tex: 'fizzies', u: [0.02, 0.28], v: [0, 1] },
      { cle: 'bureau', type: 'aff', tex: 'logo', u: [0.07, 0.35], v: [0.15, 0.6] },
      { cle: 'bureau', type: 'aff', tex: 'dessins', u: [0.02, 0.26], v: [0.02, 0.82], mur: 3.6 },
      { cle: 'boutique', type: 'frigo' }] },
    6: { createur: true, etapes: [
      { cle: 'bureau', type: 'aff', tex: 'employe', u: [0, 1], v: [0, 1], brule: 'tex:employe' },
      { cle: 'scene', type: 'etoiles', n: 4 },
      { cle: 'boutique', type: 'boite', a: [-0.66, 0, 1.55], b: [1.26, 1.3, 2.36], brule: 'id:caisseB' },
      { cle: 'atelier', type: 'lampe', a: [-1.02, 2.0, 2.9], b: [-0.58, 3.0, 3.3] },
      { cle: '*', type: 'souriez' },
      { cle: 'froid', type: 'cartons' }] }
  };

  function dans(p, a, b, m) {
    m = m == null ? 0.06 : m;
    return p[0] >= a[0] - m && p[0] <= b[0] + m && p[1] >= a[1] - m && p[1] <= b[1] + m &&
           p[2] >= a[2] - m && p[2] <= b[2] + m;
  }
  function dSeg(px, py, s) {
    var vx = s[2] - s[0], vy = s[3] - s[1];
    var t = Math.max(0, Math.min(1, ((px - s[0]) * vx + (py - s[1]) * vy) / (vx * vx + vy * vy)));
    var x = s[0] + vx * t - px, y = s[1] + vy * t - py;
    return Math.sqrt(x * x + y * y);
  }

  // ==========================================================
  //  Le feu
  //  Une vraie simulation : une grille de chaleur, alimentee par le bas,
  //  qui monte, ondule au gre d'un courant d'air et se refroidit. La
  //  chaleur devient couleur (rouge sombre, orange, jaune, presque blanc
  //  au coeur), et l'image s'additionne a la piece. Autour : la lueur
  //  qu'elle jette, les braises qui s'envolent, la fumee qui monte.
  // ==========================================================

  function Foyer(w, h) {
    this.w = w; this.h = h;
    this.c = new Float32Array(w * h); this.n = new Float32Array(w * h);
    this.cv = toile(w, h); this.cx = this.cv.getContext('2d');
    this.img = this.cx.createImageData(w, h);
    this.t = Math.random() * 10;
    this.braises = []; this.fumees = [];
    this.vif = 0;
    this.froid = 1;
  }
  Foyer.prototype.chauffer = function (x, y, v) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    var i = y * this.w + x;
    if (this.c[i] < v) this.c[i] = v;
  };
  // Un pas de simulation : chaque case prend la chaleur de celles du
  // dessous, deportee par le courant d'air, et en perd un peu.
  Foyer.prototype.pas = function (dt) {
    var w = this.w, h = this.h, c = this.c, n = this.n;
    this.t += dt;
    var vent = Math.sin(this.t * 1.1) * 0.5 + Math.sin(this.t * 2.9 + 1.3) * 0.3;
    for (var it = 0; it < 2; it++) {
      for (var y = 0; y < h; y++) {
        var y1 = Math.min(h - 1, y + 1), y2 = Math.min(h - 1, y + 2);
        var tour = Math.sin(y * 0.35 + this.t * 6) * 0.7 + vent;
        for (var x = 0; x < w; x++) {
          var xs = x + Math.round(tour + Math.random() - 0.5);
          if (xs < 1) xs = 1; else if (xs > w - 2) xs = w - 2;
          var v = (c[y1 * w + xs - 1] + c[y1 * w + xs] * 2 + c[y1 * w + xs + 1] + c[y2 * w + xs]) / 5;
          // Le refroidissement varie par colonne et monte avec la flamme :
          // c'est lui qui la decoupe en langues.
          var froid = 0.006 + 0.02 * (0.5 + 0.5 * Math.sin(x * 0.9 + y * 0.25 - this.t * 7)) + Math.random() * 0.012;
          v = v * 0.992 - froid * this.froid;
          n[y * w + x] = v > 0 ? v : 0;
        }
      }
      var tmp = c; c = n; n = tmp;
    }
    this.c = c; this.n = n;
  };
  Foyer.prototype.image = function () {
    var d = this.img.data, c = this.c, somme = 0;
    for (var i = 0; i < c.length; i++) {
      var t = c[i], p = i * 4;
      somme += t;
      if (t < 0.06) { d[p + 3] = 0; continue; }
      d[p] = Math.min(255, t * 2.6 * 255);
      d[p + 1] = Math.min(255, Math.max(0, (t - 0.32) * 2.1) * 235);
      d[p + 2] = Math.min(255, Math.max(0, (t - 0.72) * 3.2) * 210);
      d[p + 3] = Math.min(255, (t - 0.06) * 2.4 * 255);
    }
    this.vif = somme / c.length;
    this.cx.putImageData(this.img, 0, 0);
    return this.cv;
  };
  // Dessine le foyer dans le rectangle (x, y, w, h) de l'ecran.
  Foyer.prototype.dessiner = function (ctx, X, Y, W, H, dt) {
    var im = this.image();
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // La lueur jetee sur ce qui entoure le feu.
    var cx = X + W / 2, cy = Y + H * 0.8, rr = Math.max(W, H) * 1.3;
    var a = Math.min(0.5, this.vif * 2.2) * (0.85 + Math.random() * 0.15);
    if (a > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, 'rgba(255,120,30,' + a.toFixed(3) + ')');
      g.addColorStop(0.4, 'rgba(200,60,10,' + (a * 0.35).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(120,20,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    }
    // La fumee, sous les flammes.
    ctx.globalCompositeOperation = 'source-over';
    this.fumees.forEach(function (f) {
      f.vie -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.r += dt * f.r * 0.6;
      var k = Math.max(0, f.vie / f.max);
      var gs = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      gs.addColorStop(0, 'rgba(14,12,10,' + (0.32 * k).toFixed(3) + ')');
      gs.addColorStop(1, 'rgba(14,12,10,0)');
      ctx.fillStyle = gs;
      ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    });
    this.fumees = this.fumees.filter(function (f) { return f.vie > 0; });
    // Les flammes : une passe floue pour le halo, une passe nette.
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.4;
    ctx.filter = 'blur(' + Math.max(2, W / 55).toFixed(1) + 'px)';
    ctx.drawImage(im, X, Y, W, H);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.drawImage(im, X, Y, W, H);
    // Les braises.
    this.braises.forEach(function (b) {
      b.vie -= dt; b.x += b.vx * dt + Math.sin(b.vie * 9 + b.g) * 0.6; b.y += b.vy * dt; b.vy -= 20 * dt;
      var k = Math.max(0, b.vie / b.max);
      ctx.fillStyle = 'rgba(255,' + Math.round(140 + 90 * k) + ',' + Math.round(40 * k) + ',' + (k * (0.6 + Math.random() * 0.4)).toFixed(3) + ')';
      ctx.fillRect(b.x, b.y, b.s, b.s);
    });
    this.braises = this.braises.filter(function (b) { return b.vie > 0; });
    ctx.restore();
  };
  Foyer.prototype.braise = function (x, y, echelle) {
    var m = 0.8 + Math.random() * 1.4;
    this.braises.push({ x: x, y: y, vx: (Math.random() - 0.5) * 30 * echelle, vy: -(40 + Math.random() * 80) * echelle,
                        vie: m, max: m, s: 1 + Math.random() * 2 * echelle, g: Math.random() * 10 });
  };
  Foyer.prototype.fumee = function (x, y, echelle) {
    var m = 1.5 + Math.random() * 1.5;
    this.fumees.push({ x: x, y: y, vx: (Math.random() - 0.5) * 12 * echelle, vy: -(18 + Math.random() * 25) * echelle,
                       r: 8 * echelle, vie: m, max: m });
  };

  // Un feu qui brule a un endroit, sans fin : la base (X, Y), sa largeur
  // et sa hauteur a l'ecran. Chaque foyer garde son etat d'une image a
  // l'autre, d'apres sa graine.
  var FOYERS_F = {};
  function flammes(ctx, X, Y, w, h, t, graine, force) {
    if (w < 2 || h < 2 || force <= 0) return;
    var k = String(Math.round(graine * 1000));
    var F = FOYERS_F[k];
    if (!F) { F = FOYERS_F[k] = { f: new Foyer(36, 60), t: t }; F.f.froid = 0.55; }
    var dt = Math.min(0.1, Math.max(0, t - F.t));
    F.t = t;
    var f = F.f;
    // La base : une rangee de cases, chauffees de facon inegale.
    for (var x = 6; x < f.w - 6; x++) {
      var bord = 1 - Math.abs(x - f.w / 2) / (f.w / 2 - 6);
      var lg = 0.55 + 0.45 * Math.sin(x * 0.8 + t * 5 + graine) * Math.sin(x * 0.31 - t * 3.3);
      var vb = force * (0.8 + Math.random() * 0.2) * (0.5 + bord * 0.5) * Math.max(0.35, lg);
      f.chauffer(x, f.h - 2, vb); f.chauffer(x, f.h - 3, vb); f.chauffer(x, f.h - 4, vb * 0.9);
    }
    f.pas(dt);
    var W = w * 1.3, H = h * 1.7;
    if (Math.random() < dt * 14 * force) f.braise(X + (Math.random() - 0.5) * w * 0.6, Y - h * 0.4, w / 120);
    if (Math.random() < dt * 5 * force) f.fumee(X + (Math.random() - 0.5) * w * 0.4, Y - h * 0.9, w / 90);
    f.dessiner(ctx, X - W / 2, Y - H, W, H, dt);
  }

  // ---------- Un objet qui brule ----------
  // Le feu prend au bas de l'objet ; le front de flammes monte sur sa
  // surface, en suivant sa forme a l'ecran. Derriere lui, l'objet noircit,
  // et sa lisiere rougeoie.
  function lerp(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
  function bruit1(x, g) { return Math.sin(x * 9.3 + g) * 0.45 + Math.sin(x * 23.7 + g * 2.1) * 0.3 + Math.sin(x * 57.3 + g * 0.7) * 0.15 + Math.sin(x * 131 + g * 3.3) * 0.1; }

  // q : les quatre coins a l'ecran [bas-gauche, bas-droit, haut-droit,
  // haut-gauche] ; k : ou en est le front (0 en bas, 1 en haut).
  function front(q, k, g, n) {
    var L = [];
    for (var i = 0; i <= n; i++) {
      var u = i / n, kk = Math.max(0, Math.min(1.05, k + bruit1(u, g) * 0.09));
      var bas = lerp(q[0], q[1], u), haut = lerp(q[3], q[2], u);
      L.push(lerp(bas, haut, kk));
    }
    return L;
  }

  function dessinerBrulure(ctx, f, q, k, t, dt) {
    var L = front(q, k, f.g, 60);
    // Le noir, de la base jusqu'au front.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(q[0][0], q[0][1]);
    L.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
    ctx.lineTo(q[1][0], q[1][1]);
    ctx.closePath();
    ctx.clip();
    var yb = Math.max(q[0][1], q[1][1]), yh = Math.min(L[0][1], L[L.length - 1][1]);
    var g = ctx.createLinearGradient(0, yb, 0, yh - 4);
    g.addColorStop(0, 'rgba(8,6,5,.95)'); g.addColorStop(0.8, 'rgba(20,12,8,.92)'); g.addColorStop(1, 'rgba(70,30,10,.85)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(q[0][0], q[3][0]) - 4, yh - 6, Math.abs(q[1][0] - q[0][0]) + Math.abs(q[2][0] - q[3][0]) + 12, yb - yh + 12);
    // Des braises qui couvent dans le noir.
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 18; i++) {
      var u = (i * 0.618 + f.g) % 1, v = ((i * 0.381 + f.g * 0.3) % 1) * k;
      var p = lerp(lerp(q[0], q[1], u), lerp(q[3], q[2], u), v);
      var a = 0.25 + 0.25 * Math.sin(t * 5 + i * 1.7);
      ctx.fillStyle = 'rgba(255,90,20,' + a.toFixed(3) + ')';
      ctx.fillRect(p[0], p[1], 2, 2);
    }
    ctx.restore();
    // La lisiere qui rougeoie, le long du front.
    if (k < 1.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineJoin = 'round';
      ctx.filter = 'blur(1.5px)';
      [[8, 'rgba(255,70,10,.22)'], [3.5, 'rgba(255,130,40,.45)'], [1.4, 'rgba(255,210,140,.55)']].forEach(function (s) {
        ctx.lineWidth = s[0] * (0.8 + Math.random() * 0.4); ctx.strokeStyle = s[1];
        ctx.beginPath();
        L.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
        ctx.stroke();
      });
      ctx.filter = 'none';
      ctx.restore();
    }
    return L;
  }

  // Le foyer d'un objet qui brule, alimente le long du front.
  function feuSurObjet(ctx, f, q, k, force, t, dt) {
    var xs = q.map(function (p) { return p[0]; }), ys = q.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var w = x1 - x0, h = y1 - y0;
    // La zone du feu : l'objet, et assez de place au-dessus pour les flammes.
    var bx = x0 - w * 0.25, by = y0 - Math.max(h * 0.9, w * 0.6), bw = w * 1.5, bh = y1 - by + h * 0.05;
    if (!f.foyer) f.foyer = new Foyer(Math.max(24, Math.min(64, Math.round(bw / 5))), Math.max(40, Math.min(96, Math.round(bh / 5))));
    var F = f.foyer;
    if (force > 0) {
      var L = front(q, Math.min(1, k), f.g, 40);
      L.forEach(function (p, i) {
        var sx = (p[0] - bx) / bw * F.w, sy = (p[1] - by) / bh * F.h;
        var langue = 0.55 + 0.45 * Math.sin(i * 0.8 + t * 5 + f.g) * Math.sin(i * 0.33 - t * 3.1);
        var v = force * (0.7 + Math.random() * 0.3) * Math.max(0.25, langue);
        F.chauffer(sx, sy, v); F.chauffer(sx, sy + 1, v); F.chauffer(sx, sy + 2, v * 0.8);
        if (Math.random() < 0.3) F.chauffer(sx + (Math.random() - 0.5) * 2, sy - 1, v);
      });
      // Ce qui a deja brule couve encore.
      for (var j = 0; j < 6; j++) {
        var u = Math.random(), vv = Math.random() * Math.min(1, k);
        var p = lerp(lerp(q[0], q[1], u), lerp(q[3], q[2], u), vv);
        F.chauffer((p[0] - bx) / bw * F.w, (p[1] - by) / bh * F.h, force * 0.45 * Math.random());
      }
      var mid = L[Math.floor(Math.random() * L.length)];
      if (Math.random() < dt * 22 * force) F.braise(mid[0], mid[1], Math.max(0.5, w / 160));
      if (Math.random() < dt * 6 * force) F.fumee(mid[0], mid[1] - h * 0.2, Math.max(0.6, w / 110));
    }
    F.pas(dt);
    F.dessiner(ctx, bx, by, bw, bh, dt);
  }

  // ==========================================================
  //  La revelation d'un animatronique
  // ==========================================================

  function revelation(hote, id, ensuite) {
    var d = DP.byId(id);
    var deja = DP.has(id);
    if (!deja) { DP.collect(id); if (DP.markNew) DP.markNew(id); }
    var r = el('div', 'wfr');
    r.appendChild(el('div', 'wfr-rayons'));
    var im = el('img', 'wfr-img');
    im.src = DP.dinderFull(id);
    im.alt = d.name;
    r.appendChild(im);
    var txt = el('div', 'wfr-txt');
    txt.appendChild(el('span', 'wfr-haut', deja ? 'Déjà dans ta collection' : 'Nouveau Dinder'));
    txt.appendChild(el('strong', 'wfr-nom', d.name));
    if (d.form) txt.appendChild(el('span', 'wfr-forme', d.form));
    var rar = el('span', 'wfr-rar', d.rarity);
    txt.appendChild(rar);
    r.appendChild(txt);
    hote.appendChild(r);
    SON.sursaut();
    setTimeout(function () { SON.carillon(); }, reduit ? 100 : 1300);
    setTimeout(function () {
      var b = el('button', 'wf-gros-btn', 'REPRENDRE LA NUIT');
      b.type = 'button';
      b.addEventListener('click', function () {
        r.classList.add('is-sortie');
        setTimeout(function () { r.remove(); ensuite(); }, 400);
      });
      txt.appendChild(b);
      b.focus();
    }, reduit ? 300 : 2800);
  }

  // ==========================================================
  //  Une nuit et son enigme
  // ==========================================================

  // cfg : { n, hote, K, pause(), reprendre(), finBonne(), secousse() }
  function nuit(cfg) {
    init();
    var E = ENIGMES[cfg.n];
    if (!E) return null;
    var st = { etape: 0, sous: [], mods: {}, feux: [], lampe: 0, eclair: 0, incendie: false, fini: false };
    var brasier = null;

    function mods(cle) { return st.mods[cle] || null; }
    function changer(cle, f, variantes) {
      var m = st.mods[cle] ? JSON.parse(JSON.stringify(st.mods[cle])) : {};
      f(m);
      st.mods[cle] = m;
      (variantes || ['base']).forEach(function (v) { R.obtenir(cle, v, m); });
    }
    // coins : les quatre coins de la face visible, dans la piece.
    // montee : le temps que met le feu a gagner le haut de l'objet.
    function bruler(cle, cible, coins, montee) {
      var f = { cle: cle, coins: coins, t0: performance.now() / 1000, montee: montee || 2.6,
                g: Math.random() * 10, pret: false };
      st.feux.push(f);
      SON.flamme();
      // Quand le feu a tout pris, la piece est recalculee, brulee ; en
      // attendant, le noir dessine par-dessus tient lieu de brulure.
      setTimeout(function () {
        changer(cle, function (m) {
          if (cible.indexOf('etoile:') === 0) (m.etoiles = m.etoiles || []).push(cible.slice(7));
          else (m.brules = m.brules || []).push(cible);
        }, cle === 'bureau' ? ['base', 'lumG', 'lumD', 'noir'] : ['base']);
        f.mods = st.mods[cle];
      }, f.montee * 1000);
    }
    function coinsAffiche(cle, tex) {
      var s_ = null;
      R.SCENES[cle].objets.forEach(function (g) { if (g.sprite && g.sprite.tex === tex) s_ = g.sprite; });
      if (!s_ || !s_.w) return null;
      var n = s_.n, r = [-n[2], 0, n[0]], w = s_.w / 2, p = s_.p;
      var bg = [p[0] - r[0] * w, p[1], p[2] - r[2] * w], bd = [p[0] + r[0] * w, p[1], p[2] + r[2] * w];
      return [bg, bd, [bd[0], p[1] + s_.h, bd[2]], [bg[0], p[1] + s_.h, bg[2]]];
    }
    // La face d'une boite tournee vers la camera.
    function coinsBoite(cle, a, b) {
      var c = R.SCENES[cle].cam.pos, F = [];
      if (c[2] < a[2]) F.push([[a[0], a[1], a[2]], [b[0], a[1], a[2]], [b[0], b[1], a[2]], [a[0], b[1], a[2]]]);
      if (c[2] > b[2]) F.push([[a[0], a[1], b[2]], [b[0], a[1], b[2]], [b[0], b[1], b[2]], [a[0], b[1], b[2]]]);
      if (c[0] < a[0]) F.push([[a[0], a[1], a[2]], [a[0], a[1], b[2]], [a[0], b[1], b[2]], [a[0], b[1], a[2]]]);
      if (c[0] > b[0]) F.push([[b[0], a[1], a[2]], [b[0], a[1], b[2]], [b[0], b[1], b[2]], [b[0], b[1], a[2]]]);
      var best = F[0], aire = -1;
      F.forEach(function (q) {
        var p = q.map(function (x) { return R.projeter(cle, x) || [0, 0]; });
        var ar = Math.abs((p[1][0] - p[0][0]) * (p[3][1] - p[0][1]) - (p[3][0] - p[0][0]) * (p[1][1] - p[0][1]));
        if (ar > aire) { aire = ar; best = q; }
      });
      return best;
    }
    function centreAffiche(cle, tex, mur) {
      var s = null;
      R.SCENES[cle].objets.forEach(function (g) {
        if (g.sprite && g.sprite.tex === tex && (mur == null || Math.abs(g.sprite.p[2] - mur) < 0.1 || Math.abs(g.sprite.p[0] - mur) < 0.1)) s = g.sprite;
      });
      return s ? { c: [s.p[0], s.p[1], s.p[2]], w: s.w, h: s.h } : null;
    }

    // Le clic d'une etape : 'ok' (etape faite), 'pas' (un pas de plus dans
    // l'etape) ou null (rien a voir).
    function essai(et, cle, pt, actuelle) {
      if (et.cle !== '*' && et.cle !== cle) return null;
      var a, i;
      if (et.type === 'aff') {
        if (et.mur != null) {
          var sp = centreAffiche(cle, et.tex, et.mur);
          if (!sp || Math.abs(pt[2] - et.mur) > 0.1) return null;
        }
        a = R.surAffiche(cle, et.tex, pt);
        if (!a || a.u < et.u[0] || a.u > et.u[1] || a.v < et.v[0] || a.v > et.v[1]) return null;
        if (actuelle && et.brule) bruler(cle, et.brule, coinsAffiche(cle, et.tex), 2.8);
        return 'ok';
      }
      if (et.type === 'boite') {
        if (!dans(pt, et.a, et.b)) return null;
        if (actuelle && et.brule) bruler(cle, et.brule, coinsBoite(cle, et.a, [et.b[0], Math.min(et.b[1], 1.0), et.b[2]]), 2.4);
        return 'ok';
      }
      if (et.type === 'fanions') {
        a = R.surAffiche(cle, 'fanions', pt);
        if (!a) return null;
        i = Math.floor(a.u * 40);
        if (!actuelle) return 'pas';
        var coul = i % 5, s = st.sous;
        var suite = s.length && i === s[s.length - 1] + 1 && coul === et.ordre[s.length];
        if (!suite) st.sous = coul === et.ordre[0] && i >= 18 && i <= 36 ? [i] : [];
        else s.push(i);
        return st.sous.length === et.ordre.length ? 'ok' : (st.sous.length ? 'pas' : 'rate');
      }
      if (et.type === 'batons') {
        a = R.surAffiche(cle, 'outils', pt);
        if (!a) return null;
        var px = a.u * 500, py = a.v * 260, b = -1;
        BATONS.forEach(function (sg, k) { if (dSeg(px, py, sg) < 26) b = k; });
        if (b < 0) return null;
        if (!actuelle) return 'pas';
        if (b === et.ordre[st.sous.length]) st.sous.push(b);
        else st.sous = b === et.ordre[0] ? [b] : [];
        if (st.sous.length === et.ordre.length) {
          changer('atelier', function (m) { m.tex = { outils: 'outilsF' }; });
          return 'ok';
        }
        return st.sous.length ? 'pas' : 'rate';
      }
      if (et.type === 'frigo') {
        if (Math.abs(pt[0] + 3.1) > 0.08) return null;
        var u = (pt[2] - 2.6) / 2.1, v = (2.25 - pt[1]) / 2.25;
        var col = Math.floor((u * 420 - 24) / 63), rang = Math.floor((v * 512 - 50) / 150);
        var dansRang = ((v * 512 - 50) % 150) < 134;
        var bonne = dansRang && FRIGO_WADE.some(function (f) { return f[0] === rang && f[1] === col; });
        if (!bonne) return null;
        if (!actuelle) return 'pas';
        var kf = rang + ',' + col;
        if (st.sous.indexOf(kf) === -1) st.sous.push(kf);
        return st.sous.length === 4 ? 'ok' : 'pas';
      }
      if (et.type === 'etoiles') {
        var e = R.etoile(pt);
        if (!e || e.x > -1.2) return null;
        if (!actuelle) return 'pas';
        if (st.sous.indexOf(e.cle) !== -1) return null;
        st.sous.push(e.cle);
        var z_ = 9.995, d_ = 0.075;
        bruler('scene', 'etoile:' + e.cle, [[e.x - d_, e.y - d_, z_], [e.x + d_, e.y - d_, z_], [e.x + d_, e.y + d_, z_], [e.x - d_, e.y + d_, z_]], 1.2);
        return st.sous.length >= et.n ? 'ok' : 'pas';
      }
      if (et.type === 'lampe') {
        if (!dans(pt, et.a, et.b, 0.1)) return null;
        if (!actuelle) return 'pas';
        st.lampe++;
        st.eclair = performance.now() / 1000;
        if (st.lampe < 3) { SON.gresille(); return 'pas'; }
        // Elle eclate : l'atelier prend feu.
        SON.explosion();
        st.incendie = true;
        changer('atelier', function (m) { m.feu = true; });
        setTimeout(function () { if (!st.fini) { brasier = SON.brasier(); } }, 600);
        return 'ok';
      }
      if (et.type === 'souriez') {
        if (cle !== 'coinO' && cle !== 'couloirE') return null;
        a = R.surAffiche(cle, 'souriez', pt);
        if (!a) return null;
        if (!actuelle) return 'pas';
        if (st.sous.indexOf(cle) !== -1) return null;
        st.sous.push(cle);
        bruler(cle, 'tex:souriez', coinsAffiche(cle, 'souriez'), 2.8);
        return st.sous.length === 2 ? 'ok' : 'pas';
      }
      if (et.type === 'cartons') {
        var touche = null;
        Object.keys(CARTONS).forEach(function (k) { if (dans(pt, CARTONS[k][0], CARTONS[k][1])) touche = k; });
        if (!touche) return null;
        if (!actuelle) return 'pas';
        if (st.sous.indexOf(touche) !== -1) return null;
        st.sous.push(touche);
        var bx = CARTONS[touche];
        bruler('froid', 'id:' + touche, coinsBoite('froid', bx[0], bx[1]), 2.2);
        return st.sous.length === 3 ? 'ok' : 'pas';
      }
      return null;
    }

    function clic(cle, pt) {
      if (!pt || st.fini) return false;
      var et = E.etapes[st.etape];
      var r = essai(et, cle, pt, true);
      if (r === 'ok') {
        st.etape++; st.sous = [];
        SON.indice(st.etape);
        if (cfg.secousse) cfg.secousse(0.4);
        if (st.etape >= E.etapes.length) accomplir();
        return true;
      }
      if (r === 'pas') { SON.indice(st.etape); return true; }
      if (r === 'rate') return true;
      // Un endroit d'une autre etape, touche trop tot : tout repart de zero.
      // (La derniere nuit, ce qui a brule reste brule.)
      if (!E.createur) {
        for (var i = 0; i < E.etapes.length; i++) {
          if (i !== st.etape && essai(E.etapes[i], cle, pt, false)) {
            st.etape = 0; st.sous = [];
            if (st.mods.atelier) { delete st.mods.atelier; }
            return true;
          }
        }
      }
      return false;
    }

    function accomplir() {
      st.fini = true;
      if (E.createur) {
        if (brasier) { brasier.arreter(1.5); brasier = null; }
        setTimeout(function () { cfg.finBonne(); }, 1200);
        return;
      }
      cfg.pause();
      SON.vision();
      var voile = el('div', 'wfs-voile');
      cfg.hote.appendChild(voile);
      setTimeout(function () {
        voile.remove();
        var apres = function () { cfg.reprendre(); };
        if (!E.jeu) { revelation(cfg.hote, E.dinder, apres); return; }
        MJ.lancer(cfg.hote, E.jeu, function (gagne) {
          if (gagne) revelation(cfg.hote, E.dinder, apres);
          else { st.fini = false; st.etape = 0; st.sous = []; apres(); }
        });
      }, reduit ? 200 : 1400);
    }

    // Ce qui se dessine par-dessus une piece : le feu qui prend, l'eclair
    // de l'ampoule, et l'atelier en flammes.
    function dessiner(cle, ctx, off, K, VW, VH) {
      var t = performance.now() / 1000;
      // Un feu s'en va quand il est eteint et que la piece brulee est prete.
      st.feux = st.feux.filter(function (f) {
        return !(f.mods && t - f.t0 > f.montee + 1.6 && R.deja(f.cle, 'base', f.mods));
      });
      st.feux.forEach(function (f) {
        if (f.cle !== cle || !f.coins) return;
        var dt = f.dernier ? Math.min(0.1, t - f.dernier) : 0;
        f.dernier = t;
        var q = f.coins.map(function (p) { var r = R.projeter(cle, p); return r ? [r[0] * K - off, r[1] * K] : null; });
        if (q.some(function (p) { return !p; })) return;
        // Le bas a gauche de l'ecran, toujours en premier.
        if (q[0][0] > q[1][0]) q = [q[1], q[0], q[3], q[2]];
        var u = t - f.t0, k = Math.min(1.02, u / f.montee);
        var force = u < 0.3 ? u / 0.3 : u < f.montee ? 1 : Math.max(0, 1 - (u - f.montee) / 1.4);
        dessinerBrulure(ctx, f, q, k, t, dt);
        feuSurObjet(ctx, f, q, k, force, t, dt);
      });
      if (cle === 'atelier') {
        var dt = t - st.eclair;
        if (st.eclair && dt < 0.25) {
          ctx.fillStyle = 'rgba(255,240,200,' + ((st.lampe >= 3 ? 0.9 : 0.4) * (1 - dt / 0.25)).toFixed(3) + ')';
          ctx.fillRect(0, 0, VW, VH);
        }
        if (st.incendie) {
          R.SCENES.atelier.flammes.forEach(function (f, i) {
            var p = R.projeter('atelier', [f[0], f[1], f[2]]), p2 = R.projeter('atelier', [f[0], f[1] + f[3], f[2]]);
            if (!p || !p2) return;
            var hh = Math.abs(p[1] - p2[1]) * K;
            flammes(ctx, p[0] * K - off, p[1] * K, hh * 0.9, hh, t, 500 + i * 3.7, 1);
          });
        }
      }
    }

    function arreter() { if (brasier) { brasier.arreter(0.5); brasier = null; } }

    return { clic: clic, mods: mods, dessiner: dessiner, arreter: arreter, etat: st };
  }

  // ==========================================================
  //  Les films : la bonne et la mauvaise fin
  // ==========================================================

  function film(hote, duree, dessin, retour, texteFin) {
    init();
    var box = el('div', 'wff');
    var cv = el('canvas', 'wf-cv');
    var VW = 1280, VH = 720;
    cv.width = VW; cv.height = VH;
    box.appendChild(cv);
    hote.appendChild(box);
    var x = cv.getContext('2d');
    var t0 = 0, raf = 0, fini = false, bouton = false;
    function image(ms) {
      if (fini || !document.body.contains(box)) return;
      if (!t0) t0 = ms;
      var t = (ms - t0) / 1000;
      x.setTransform(1, 0, 0, 1, 0, 0);
      dessin(x, t, VW, VH);
      if (t > duree && !bouton) {
        bouton = true;
        var b = el('button', 'wf-gros-btn wff-btn', 'MENU');
        b.type = 'button';
        b.addEventListener('click', function () { fini = true; box.remove(); retour(); });
        box.appendChild(b);
        b.focus();
      }
      raf = requestAnimationFrame(image);
    }
    raf = requestAnimationFrame(image);
  }

  var NEIGE = null;
  function neige() {
    if (NEIGE) return NEIGE;
    NEIGE = [];
    for (var n = 0; n < 4; n++) {
      var c = toile(320, 180), x = c.getContext('2d'), d = x.createImageData(320, 180);
      for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0);
      NEIGE.push(c);
    }
    return NEIGE;
  }
  function grain(x, t, a, VW, VH) {
    x.globalAlpha = a;
    x.drawImage(neige()[Math.floor(t * 24) % 4], 0, 0, VW, VH);
    x.globalAlpha = 1;
  }
  function vignette(x, VW, VH, f) {
    var g = x.createRadialGradient(VW / 2, VH / 2, VH * 0.3, VW / 2, VH / 2, VW * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + f + ')');
    x.fillStyle = g; x.fillRect(0, 0, VW, VH);
  }
  function noir(x, a, VW, VH) { x.fillStyle = 'rgba(0,0,0,' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; x.fillRect(0, 0, VW, VH); }

  // Une camera qui brule : la piece, des flammes au sol un peu partout,
  // une lumiere orange, la neige.
  var FOYERS = {};
  function foyers(cle) {
    if (FOYERS[cle]) return FOYERS[cle];
    var r = R.deja(cle, 'base'), L = [];
    if (!r) return [];
    for (var i = 0; i < 400 && L.length < 14; i++) {
      var px = Math.random() * r.w, py = r.h * (0.45 + Math.random() * 0.55);
      var p = R.point(cle, r, px, py);
      if (p && p[1] < 0.15) L.push(p);
    }
    FOYERS[cle] = L;
    return L;
  }
  function camEnFeu(x, cle, t, force, VW, VH, nom) {
    var r = R.deja(cle, 'base');
    x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
    if (!r) return;
    var K = VH / r.h, off = (r.w * K - VW) / 2;
    x.drawImage(r.canvas, -off, 0, r.w * K, r.h * K);
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = 'rgb(255,' + Math.round(150 + Math.sin(t * 9) * 20) + ',90)';
    x.fillRect(0, 0, VW, VH);
    x.globalCompositeOperation = 'source-over';
    foyers(cle).forEach(function (p, i) {
      var a = R.projeter(cle, p), b = R.projeter(cle, [p[0], p[1] + 1.2 * force, p[2]]);
      if (!a || !b) return;
      var hh = Math.abs(a[1] - b[1]) * K;
      flammes(x, a[0] * K - off, a[1] * K, hh * 0.9, hh, t, cle.length * 37 + cle.charCodeAt(0) + i * 2.3, 1);
    });
    grain(x, t, 0.12, VW, VH);
    vignette(x, VW, VH, 0.85);
    x.fillStyle = '#f4f4f0'; x.font = 'bold 26px Consolas, monospace'; x.textAlign = 'left';
    x.fillText(nom, 40, 60);
    if (Math.floor(t * 1.6) % 2) { x.fillStyle = '#e8261c'; x.beginPath(); x.arc(24, 51, 9, 0, Math.PI * 2); x.fill(); }
  }

  // Un personnage pose dans une piece rendue, cache par ce qui est devant.
  var POSE_CACHE = {};
  function poser(x, cle, r, pose, im, K, off, opts) {
    opts = opts || {};
    var ps = R.SCENES[cle].poses[pose];
    var pied = R.projeter(cle, ps.p), tete = R.projeter(cle, [ps.p[0], ps.p[1] + ps.h, ps.p[2]]);
    var milieu = R.projeter(cle, [ps.p[0], ps.p[1] + ps.h / 2, ps.p[2]]);
    if (!pied || !tete || !pret(im)) return;
    var hp = (pied[1] - tete[1]) * K, wp = hp * im.naturalWidth / im.naturalHeight;
    var cx = pied[0] * K - off + (opts.dx || 0), bas = pied[1] * K + (opts.dy || 0);
    var x0 = Math.floor(cx - wp / 2), y0 = Math.floor(bas - hp);
    var c = toile(Math.ceil(wp), Math.ceil(hp)), cx2 = c.getContext('2d');
    cx2.drawImage(im, 0, 0, c.width, c.height);
    cx2.globalCompositeOperation = 'source-atop';
    var e = r.eclairages[pose] ? r.eclairages[pose][0] : [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
    var g = cx2.createLinearGradient(0, 0, 0, c.height);
    function rgba(v, a) { return 'rgba(' + v.map(function (k) { return Math.round(Math.min(1, k) * 255); }).join(',') + ',' + a + ')'; }
    cx2.globalCompositeOperation = 'multiply';
    g.addColorStop(0, rgba(e[0], 1)); g.addColorStop(0.55, rgba(e[1], 1)); g.addColorStop(1, rgba(e[2], 1));
    cx2.fillStyle = g; cx2.fillRect(0, 0, c.width, c.height);
    if (opts.teinte) { cx2.fillStyle = opts.teinte; cx2.fillRect(0, 0, c.width, c.height); }
    cx2.globalCompositeOperation = 'destination-in';
    cx2.drawImage(im, 0, 0, c.width, c.height);
    // Le masque de profondeur : l'etabli passe devant.
    var dist = milieu[2] - 0.35, m = toile(c.width, c.height), mx = m.getContext('2d');
    var key = cle + pose + c.width + 'x' + c.height + ':' + Math.round(off);
    if (!POSE_CACHE[key]) {
      var d = mx.createImageData(c.width, c.height);
      for (var yy = 0; yy < c.height; yy += 2) {
        for (var xx = 0; xx < c.width; xx += 2) {
          var sx = Math.floor((x0 + xx + off) / K), sy = Math.floor((y0 + yy) / K);
          var vu = sx < 0 || sy < 0 || sx >= r.w || sy >= r.h || r.prof[sy * r.w + sx] > dist;
          for (var a = 0; a < 2; a++) for (var b2 = 0; b2 < 2; b2++) {
            var ii = ((yy + a) * c.width + xx + b2) * 4;
            if (ii < d.data.length) d.data[ii + 3] = vu ? 255 : 0;
          }
        }
      }
      mx.putImageData(d, 0, 0);
      POSE_CACHE[key] = m;
    }
    cx2.drawImage(POSE_CACHE[key], 0, 0);
    x.drawImage(c, x0, y0);
  }

  // ---------- Le journal ----------
  function journal(x, VW, VH, titre, sous, corps, photo) {
    var c = toile(820, 600), j = c.getContext('2d');
    j.fillStyle = '#e6dcc0'; j.fillRect(0, 0, 820, 600);
    for (var i = 0; i < 300; i++) {
      j.fillStyle = 'rgba(90,70,40,' + (Math.random() * 0.06).toFixed(3) + ')';
      j.fillRect(Math.random() * 820, Math.random() * 600, 2 + Math.random() * 30, 1 + Math.random() * 3);
    }
    j.fillStyle = '#1e1a14'; j.textAlign = 'center';
    j.font = 'bold 44px Georgia, serif'; j.fillText('LE COURRIER DE SST-03', 410, 62);
    j.fillRect(30, 76, 760, 3); j.fillRect(30, 82, 760, 1);
    j.font = 'italic 15px Georgia, serif'; j.fillText('Édition du matin', 410, 102);
    j.font = 'bold 40px Georgia, serif';
    var mots = titre.split(' '), l = '', ly = 156;
    mots.forEach(function (m) {
      if (j.measureText(l + m).width > 740) { j.fillText(l.trim(), 410, ly); ly += 46; l = ''; }
      l += m + ' ';
    });
    j.fillText(l.trim(), 410, ly);
    ly += 34;
    j.font = 'italic 19px Georgia, serif'; j.fillText(sous, 410, ly);
    ly += 24;
    if (photo) {
      j.save();
      j.filter = 'grayscale(1) contrast(1.25) brightness(.8)';
      j.drawImage(photo, 40, ly, 330, 600 - ly - 30);
      j.restore();
      j.strokeStyle = '#1e1a14'; j.lineWidth = 2; j.strokeRect(40, ly, 330, 600 - ly - 30);
    }
    j.textAlign = 'left'; j.font = '15px Georgia, serif';
    var y = ly + 16, xx = photo ? 392 : 40, lw = photo ? 390 : 740;
    corps.split(' ').reduce(function (acc, m) {
      if (j.measureText(acc + m).width > lw) { j.fillText(acc, xx, y); y += 21; return m + ' '; }
      return acc + m + ' ';
    }, '');
    return c;
  }

  // La page qui brule : un front de feu qui la mange depuis le bas, des
  // braises sur le bord, du papier qui roussit juste avant.
  function brulure(page, k, graine) {
    var w = 205, h = 150, c = toile(page.width, page.height), x = c.getContext('2d');
    x.drawImage(page, 0, 0);
    if (k <= 0) return c;
    var m = toile(w, h), mx = m.getContext('2d'), d = mx.createImageData(w, h);
    var gl = toile(w, h), gx = gl.getContext('2d'), gd = gx.createImageData(w, h);
    for (var j = 0; j < h; j++) {
      for (var i = 0; i < w; i++) {
        var n = Math.sin(i * 0.15 + graine) * Math.cos(j * 0.16 - graine) * 0.12 + Math.sin(i * 0.52 + j * 0.36) * 0.05 + Math.sin(i * 1.7 - j * 1.3) * 0.015;
        var v = (h - j) / h * 0.6 + Math.abs(i - w * 0.4) / w * 0.4 + n;
        var p = (i + j * w) * 4, s = k * 1.25 - 0.1;
        d.data[p + 3] = v < s ? 0 : 255;
        var bord = v - s;
        if (bord >= 0 && bord < 0.05) { gd.data[p] = 255; gd.data[p + 1] = 120; gd.data[p + 2] = 20; gd.data[p + 3] = 255; }
        else if (bord >= 0.05 && bord < 0.16) { gd.data[p] = 60; gd.data[p + 1] = 30; gd.data[p + 2] = 10; gd.data[p + 3] = Math.round(200 * (1 - (bord - 0.05) / 0.11)); }
      }
    }
    mx.putImageData(d, 0, 0); gx.putImageData(gd, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.imageSmoothingEnabled = true;
    x.drawImage(gl, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(m, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
    return c;
  }

  // ---------- Les tetes au sol ----------
  var TETES = [['wade', 330, 430, -1.35, 1.15], ['charlie', 548, 470, 0.32, 1.05], ['faith', 760, 440, 1.2, 1.1], ['stephen', 968, 425, -0.55, 1.05]];
  var DECOUPES = {};
  function tete(k) {
    if (DECOUPES[k]) return DECOUPES[k];
    var im = image(k + '-horror'), Rg = PANT.squelette(k + '-horror');
    if (!pret(im) || !Rg) return null;
    var r = Rg.tete[2] * 1.25, c = toile(Math.round(r * 2), Math.round(r * 2)), x = c.getContext('2d');
    x.drawImage(im, Rg.tete[0] - r, Rg.tete[1] - r, r * 2, r * 2, 0, 0, r * 2, r * 2);
    x.globalCompositeOperation = 'destination-in';
    var g = x.createRadialGradient(r, r * 0.9, r * 0.55, r, r * 0.9, r);
    g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
    DECOUPES[k] = { c: c, r: r, yeux: (Rg.yeux || []).map(function (p) { return [p[0] - Rg.tete[0], p[1] - Rg.tete[1]]; }) };
    return DECOUPES[k];
  }
  function tetes(x, t, VW, VH, yeux) {
    x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
    // Le sol : le damier du diner, a peine eclaire.
    for (var r = 0; r < 14; r++) {
      var y0 = 330 + r * r * 2.1, y1 = 330 + (r + 1) * (r + 1) * 2.1;
      for (var c = -14; c < 14; c++) {
        var k = (r + c) & 1, w0 = 40 + r * 8, w1 = 40 + (r + 1) * 8;
        x.fillStyle = k ? '#2a0a0a' : '#2c2820';
        x.beginPath();
        x.moveTo(VW / 2 + c * w0, y0); x.lineTo(VW / 2 + (c + 1) * w0, y0);
        x.lineTo(VW / 2 + (c + 1) * w1, y1); x.lineTo(VW / 2 + c * w1, y1); x.fill();
      }
    }
    var lu = x.createRadialGradient(VW / 2, 440, 40, VW / 2, 440, 620);
    lu.addColorStop(0, 'rgba(0,0,0,0)'); lu.addColorStop(1, 'rgba(0,0,0,.96)');
    x.fillStyle = lu; x.fillRect(0, 0, VW, VH);
    var z = 1 + Math.min(1, t / 20) * 0.05;
    x.save();
    x.translate(VW / 2, VH * 0.62); x.scale(z, z); x.translate(-VW / 2, -VH * 0.62);
    TETES.forEach(function (T, i) {
      var d = tete(T[0]);
      if (!d) return;
      var s = 250 / (d.r * 2) * T[4];
      x.save();
      x.fillStyle = 'rgba(0,0,0,.7)';
      x.beginPath(); x.ellipse(T[1], T[2] + d.r * s * 0.75, d.r * s * 1.0, d.r * s * 0.22, 0, 0, Math.PI * 2); x.fill();
      x.translate(T[1], T[2]); x.rotate(T[3]); x.scale(s, s);
      x.filter = yeux ? 'brightness(.62) contrast(1.15)' : 'brightness(.42) sepia(.4) contrast(1.2)';
      x.drawImage(d.c, -d.r, -d.r);
      x.filter = 'none';
      if (yeux) {
        x.globalCompositeOperation = 'lighter';
        d.yeux.forEach(function (p) {
          var f = 0.85 + Math.sin(t * 3 + i) * 0.1 + (Math.random() < 0.02 ? -0.5 : 0);
          var g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], 40);
          g.addColorStop(0, 'rgba(255,255,230,' + f + ')');
          g.addColorStop(0.18, 'rgba(255,220,40,' + (f * 0.9).toFixed(2) + ')');
          g.addColorStop(0.5, 'rgba(255,170,0,' + (f * 0.25).toFixed(2) + ')');
          g.addColorStop(1, 'rgba(255,150,0,0)');
          x.fillStyle = g;
          x.fillRect(p[0] - 40, p[1] - 40, 80, 80);
        });
      }
      x.restore();
    });
    x.restore();
    // La poussiere qui flotte dans la lumiere.
    for (var p = 0; p < 40; p++) {
      var px = (p * 131 + t * 9 * (1 + p % 3)) % VW, py = 200 + (p * 71 + Math.sin(t * 0.3 + p) * 30) % 360;
      x.fillStyle = 'rgba(200,190,170,' + (0.05 + (p % 4) * 0.03).toFixed(2) + ')';
      x.fillRect(px, py, 2, 2);
    }
    grain(x, t, 0.06, VW, VH);
  }
  function titreFin(x, txt, a, VW, coul) {
    if (a <= 0) return;
    x.save();
    x.globalAlpha = Math.min(1, a);
    x.textAlign = 'center';
    x.font = 'bold 72px Consolas, monospace';
    x.shadowColor = coul; x.shadowBlur = 30;
    x.fillStyle = '#f4f0e8';
    x.fillText(txt, VW / 2, 140);
    x.restore();
  }

  // ---------- Le laboratoire : la CAM 06 ----------
  // La camera qui ne marchait pas. On n'y entendait que des coups ; le
  // signal revient, et ce n'est pas une cuisine.
  var LABO = 25;                       // la duree de la scene
  var MASQUE_IMG = ['masque-1', 'masque-2', 'masque-3', 'masque-4'];
  var PORTE = ['createur', 'createur-m1', 'createur-m2', 'createur-m3', 'createur-mf'];
  var SCENE_LABO = null, ETINCELLES = [];

  // Le labo tel que la camera le voit : la piece, lui derriere l'etabli,
  // les masques finis au presentoir, celui en cours sur l'etabli.
  function vueLabo(VW, VH, t, o) {
    if (!SCENE_LABO || SCENE_LABO.width !== VW) SCENE_LABO = toile(VW, VH);
    var x = SCENE_LABO.getContext('2d');
    var r0 = R.deja('labo', 'base'), r = (o.feu && R.deja('labo', 'base', { feu: true })) || r0;
    x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
    if (!r0) return SCENE_LABO;
    var K = VH / r.h, off = (r.w * K - VW) / 2, sc = R.SCENES.labo;
    x.drawImage(r.canvas, -off, 0, r.w * K, r.h * K);
    function objet(nom, p, h, lum) {
      var im = image(nom);
      if (!pret(im)) return null;
      var a = R.projeter('labo', p), b = R.projeter('labo', [p[0], p[1] + h, p[2]]);
      var hh = (a[1] - b[1]) * K, ww = hh * im.naturalWidth / im.naturalHeight;
      x.save();
      x.filter = 'brightness(' + lum + ') saturate(.85)';
      x.drawImage(im, a[0] * K - off - ww / 2, a[1] * K - hh, ww, hh);
      x.restore();
      return { x: a[0] * K - off - ww / 2, y: a[1] * K - hh, w: ww, h: hh, im: im };
    }
    // Les masques termines, poses au presentoir.
    for (var i = 0; i < o.finis; i++) objet(MASQUE_IMG[i], sc.presentoir[i], 0.42, 0.85);
    var sec = o.secousse ? hasard(-o.secousse, o.secousse) : 0;
    poser(x, 'labo', r0, 'createur', image(PORTE[o.porte]), K, off, { dx: sec, dy: sec * 0.4 });
    // Le masque en cours, sur l'etabli : sa silhouette en fil de fer, et
    // le metal qui se soude de bas en haut.
    if (o.banc != null) {
      var im = image(MASQUE_IMG[o.banc]);
      if (pret(im)) {
        var a = R.projeter('labo', sc.masque), b = R.projeter('labo', [sc.masque[0], sc.masque[1] + 0.4, sc.masque[2]]);
        var hh = (a[1] - b[1]) * K, ww = hh * im.naturalWidth / im.naturalHeight;
        var X = a[0] * K - off - ww / 2, Y = a[1] * K - hh;
        var fil = toile(Math.ceil(ww), Math.ceil(hh)), fx = fil.getContext('2d');
        fx.drawImage(im, 0, 0, fil.width, fil.height);
        fx.globalCompositeOperation = 'source-in';
        fx.fillStyle = 'rgba(120,255,210,1)'; fx.fillRect(0, 0, fil.width, fil.height);
        x.save();
        x.globalAlpha = 0.18 + Math.random() * 0.1;
        x.globalCompositeOperation = 'lighter';
        x.drawImage(fil, X, Y);
        x.restore();
        var k = Math.max(0, Math.min(1, o.k));
        var yk = Y + hh * (1 - k);
        x.save();
        x.beginPath(); x.rect(X - 2, yk, ww + 4, hh - (yk - Y) + 2); x.clip();
        x.filter = 'brightness(.95)';
        x.drawImage(im, X, Y, ww, hh);
        x.restore();
        if (k > 0 && k < 1) {
          // Le cordon de soudure, et sa lumiere bleue qui eclabousse tout.
          var sx = X + ww * (0.5 + Math.sin(t * 9) * 0.42);
          x.save();
          x.globalCompositeOperation = 'lighter';
          var f = 0.6 + Math.random() * 0.4;
          var g = x.createRadialGradient(sx, yk, 0, sx, yk, hh * 2.2);
          g.addColorStop(0, 'rgba(230,245,255,' + (0.9 * f).toFixed(2) + ')');
          g.addColorStop(0.08, 'rgba(140,200,255,' + (0.45 * f).toFixed(2) + ')');
          g.addColorStop(1, 'rgba(60,120,255,0)');
          x.fillStyle = g; x.fillRect(sx - hh * 2.2, yk - hh * 2.2, hh * 4.4, hh * 4.4);
          x.fillStyle = 'rgba(255,240,200,.9)'; x.fillRect(X, yk - 1, ww, 2);
          x.restore();
          for (var e = 0; e < 5; e++) {
            ETINCELLES.push({ x: sx, y: yk, vx: hasard(-160, 160), vy: hasard(-220, -40), vie: hasard(0.3, 0.8) });
          }
        }
      }
    }
    // Les etincelles, qui retombent.
    x.save();
    x.globalCompositeOperation = 'lighter';
    ETINCELLES.forEach(function (s) {
      s.vie -= 1 / 60; s.x += s.vx / 60; s.y += s.vy / 60; s.vy += 600 / 60;
      x.fillStyle = 'rgba(255,' + Math.round(170 + Math.random() * 80) + ',90,' + Math.min(1, s.vie * 2).toFixed(2) + ')';
      x.fillRect(s.x, s.y, 2, 2);
    });
    ETINCELLES = ETINCELLES.filter(function (s) { return s.vie > 0; });
    x.restore();
    // L'incendie.
    if (o.feu) {
      var k2 = o.feu;
      x.globalCompositeOperation = 'multiply';
      x.fillStyle = 'rgb(255,' + Math.round(255 - k2 * 110) + ',' + Math.round(255 - k2 * 170) + ')';
      x.fillRect(0, 0, VW, VH);
      x.globalCompositeOperation = 'source-over';
      sc.flammes.forEach(function (fl, i) {
        var a = R.projeter('labo', [fl[0], fl[1], fl[2]]), b = R.projeter('labo', [fl[0], fl[1] + fl[3] * k2, fl[2]]);
        if (!a || !b) return;
        var hh = Math.abs(a[1] - b[1]) * K;
        flammes(x, a[0] * K - off, a[1] * K, hh * 0.9 + 10, hh, t, 900 + i * 2.9, k2);
      });
      for (var fi = 0; fi < 7; fi++) flammes(x, VW * (fi + 0.5) / 7, VH + 20, 260, 260 + k2 * 260, t, 1300 + fi * 1.3, k2);
    }
    SCENE_LABO.ou = function (p) { var a = R.projeter('labo', p); return [a[0] * K - off, a[1] * K]; };
    return SCENE_LABO;
  }

  // L'habillage d'une camera de surveillance : grain, delavage, lisere,
  // nom, point rouge.
  function habillage(x, t, VW, VH, nom, g) {
    x.globalCompositeOperation = 'saturation';
    x.fillStyle = 'rgba(128,128,128,.3)'; x.fillRect(0, 0, VW, VH);
    x.globalCompositeOperation = 'source-over';
    grain(x, t, g, VW, VH);
    vignette(x, VW, VH, 0.9);
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.strokeRect(14, 14, VW - 28, VH - 28);
    x.fillStyle = '#f4f4f0'; x.font = 'bold 26px Consolas, monospace'; x.textAlign = 'left';
    x.fillText(nom, 70, 58);
    if (Math.floor(t * 1.6) % 2) { x.fillStyle = '#e8261c'; x.beginPath(); x.arc(46, 49, 10, 0, Math.PI * 2); x.fill(); }
  }

  function sceneLabo(x, u, t, VW, VH, une) {
    x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
    // 1. L'ecran que l'on connait : la camera est morte, on n'a que le son.
    //    Et on entend travailler.
    if (u < 3) {
      var coup = Math.floor(u / 0.55);
      une('c' + coup, function () { SON.marteau(); });
      var signal = u > 2.3 && Math.random() < (u - 2.3) * 1.4;
      if (signal) {
        x.drawImage(vueLabo(VW, VH, t, { porte: 0, finis: 0 }), 0, 0);
        for (var i = 0; i < 7; i++) {
          var y = Math.random() * VH, hh = 10 + Math.random() * 60;
          x.drawImage(x.canvas, 0, y, VW, hh, (Math.random() - 0.5) * 160, y, VW, hh);
        }
        grain(x, t, 0.5, VW, VH);
      } else {
        grain(x, t, 0.5, VW, VH);
        x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 0, VW, VH);
        x.fillStyle = '#e8e8e8'; x.textAlign = 'center';
        x.font = 'bold 34px Consolas, monospace'; x.fillText('CAMÉRA HORS SERVICE', VW / 2, VH / 2 - 10);
        x.font = '24px Consolas, monospace'; x.fillText('— AUDIO SEULEMENT —', VW / 2, VH / 2 + 30);
      }
      if (u > 2.3) une('signal', function () { SON.vision(); SON.grain(); });
      habillage(x, t, VW, VH, 'CAM 06  CUISINE', 0.08);
      return;
    }
    // 2. Le signal est revenu. Il est la, a son etabli. Il rit.
    if (u < 5) {
      une('rire', function () { SON.regard(); });
      x.drawImage(vueLabo(VW, VH, t, { porte: 0, finis: 0 }), 0, 0);
      habillage(x, t, VW, VH, 'CAM 06  CUISINE', 0.1 + Math.max(0, 3.4 - u) * 0.6);
      return;
    }
    // 3. Quatre masques. A chaque fois : la camera zoome sur l'etabli, le
    //    masque se soude ; puis il l'enfile, et pose l'ancien au presentoir.
    if (u < 21) {
      var n = Math.floor((u - 5) / 4), v = (u - 5) - n * 4;
      if (v < 2.6) {
        var k = (v - 0.35) / 2.0;
        if (k > 0 && k < 1) une('s' + n + '-' + Math.floor(k * 9), function () { SON.gresille(); if (Math.random() < 0.4) SON.marteau(); });
        var vue = vueLabo(VW, VH, t, { porte: n, finis: Math.max(0, n - 1), banc: n, k: k });
        // Le zoom numerique de la camera, centre sur l'etabli.
        var z = v < 0.35 ? 1 + (v / 0.35) * 2.2 : v > 2.35 ? 3.2 - ((v - 2.35) / 0.25) * 2.2 : 3.2;
        var c = vue.ou(R.SCENES.labo.masque);
        var w = VW / z, h = VH / z, cx = Math.max(w / 2, Math.min(VW - w / 2, c[0])), cy = Math.max(h / 2, Math.min(VH - h / 2, c[1] - VH * 0.05));
        x.imageSmoothingEnabled = true;
        x.drawImage(vue, cx - w / 2, cy - h / 2, w, h, 0, 0, VW, VH);
        habillage(x, t, VW, VH, 'CAM 06  CUISINE', 0.14);
        if (z > 1.5 && Math.floor(t * 2.5) % 2) {
          x.fillStyle = '#f4f4f0'; x.font = 'bold 22px Consolas, monospace'; x.textAlign = 'right';
          x.fillText('ZOOM ×' + z.toFixed(1), VW - 40, 58);
        }
        x.fillStyle = 'rgba(160,255,210,.85)'; x.font = '18px Consolas, monospace'; x.textAlign = 'left';
        x.fillText('M' + (n + 1), 40, VH - 40);
      } else {
        // Il a enfile le nouveau.
        if (v < 2.75) {
          une('porte' + n, function () { SON.servo(0.8); SON.marteau(); SON.regard(); });
        }
        x.drawImage(vueLabo(VW, VH, t, { porte: n + 1, finis: n, secousse: v < 2.9 ? 4 : 0 }), 0, 0);
        if (v < 2.72) { x.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - (v - 2.6) / 0.12)).toFixed(2) + ')'; x.fillRect(0, 0, VW, VH); }
        habillage(x, t, VW, VH, 'CAM 06  CUISINE', 0.12);
      }
      return;
    }
    // 4. Le feu le rattrape. Il ne bouge pas. Il rit.
    une('feuLabo', function () { SON.flamme(); SON.explosion(); });
    var kf = Math.min(1, (u - 21) / 2);
    x.drawImage(vueLabo(VW, VH, t, { porte: 4, finis: 3, feu: kf, secousse: 5 }), 0, 0);
    habillage(x, t, VW, VH, 'CAM 06  CUISINE', 0.12 + Math.max(0, u - 23.6) * 0.8);
    if (u > LABO - 0.7) { x.fillStyle = 'rgba(255,170,60,' + ((u - LABO + 0.7) / 0.7).toFixed(2) + ')'; x.fillRect(0, 0, VW, VH); }
  }

  // ---------- La bonne fin ----------
  function finBonne(hote, retour) {
    init();
    DP.wadeFin && DP.wadeFin('bonne');
    R.obtenir('labo', 'base'); R.obtenir('labo', 'base', { feu: true });
    PORTE.concat(MASQUE_IMG, ['logo']).forEach(image);
    ['wade', 'charlie', 'faith', 'stephen'].forEach(function (k) { image(k + '-horror'); });
    var brasier = SON.brasier();
    SON.alarme(4);
    var page = null, sons = {};
    function une(cle, f) { if (!sons[cle]) { sons[cle] = 1; f(); } }
    // Les temps : le feu gagne, le labo, le feu partout, le journal, le
    // noir, les tetes.
    var T1 = 3.6, T2 = T1 + 0.4, T3 = T2 + LABO, T4 = T3 + 3, T5 = T4 + 7.5, T6 = T5 + 1.5;
    film(hote, T6 + 4, function (x, t, VW, VH) {
      if (t < T1) {
        var L = [['scene', 'CAM 01'], ['salle', 'CAM 02'], ['couloirE', 'CAM 11']];
        var i = Math.min(2, Math.floor(t / 1.2));
        camEnFeu(x, L[i][0], t, 0.6 + i * 0.3, VW, VH, L[i][1]);
        if ((t % 1.2) < 0.08) grain(x, t, 0.9, VW, VH);
      } else if (t < T2) {
        // Le brasier se tait pendant le labo : on doit entendre le marteau.
        une('silence', function () { brasier.arreter(0.4); });
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH); grain(x, t, 0.8, VW, VH);
      } else if (t < T3) {
        sceneLabo(x, t - T2, t, VW, VH, une);
      } else if (t < T4) {
        une('brasier2', function () { brasier = SON.brasier(); SON.alarme(3); });
        var L2 = [['comptoir', 'CAM 03'], ['boutique', 'CAM 05'], ['coinO', 'CAM 10']];
        var j = Math.min(2, Math.floor((t - T3) / 1));
        camEnFeu(x, L2[j][0], t, 1.4, VW, VH, L2[j][1]);
        if (t > T4 - 0.5) { x.fillStyle = 'rgba(255,220,160,' + ((t - T4 + 0.5) / 0.5).toFixed(2) + ')'; x.fillRect(0, 0, VW, VH); }
      } else if (t < T5) {
        une('finBrasier', function () { brasier.arreter(2); });
        if (!page) page = journal(x, VW, VH, 'LA MAISON DU BURGER PART EN FUMÉE',
          'Un incendie a ravagé le restaurant de Wade and Friends dans la nuit.',
          'Les pompiers de SST-03 ont lutté jusqu’à l’aube contre les flammes. Du bâtiment, il ne reste que des murs noircis. ' +
          'Le gardien de nuit, sain et sauf, n’a pas souhaité s’exprimer. Les enquêteurs s’interrogent sur une pièce ' +
          'inconnue des plans, derrière la cuisine, où ils disent avoir retrouvé des établis, des outils, et quatre masques fondus. ' +
          'Le propriétaire des lieux reste introuvable. Les quatre animatroniques de l’établissement n’ont pas été retrouvés intacts.',
          image('logo'));
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
        var kb = t < T4 + 4 ? 0 : Math.min(1, (t - T4 - 4) / 3);
        if (kb > 0) une('feuJournal', function () { SON.flamme(); });
        x.save();
        x.globalAlpha = Math.min(1, (t - T4) / 0.6);
        x.translate(VW / 2, VH / 2 + 10); x.rotate(-0.025);
        x.drawImage(brulure(page, kb, 1.7), -410, -300);
        x.restore();
        if (kb > 0 && kb < 1) {
          x.save(); x.globalCompositeOperation = 'lighter';
          for (var e2 = 0; e2 < 30; e2++) {
            var ex = VW / 2 - 400 + Math.random() * 800, ey = VH / 2 + 300 - kb * 640 + hasard(-40, 40);
            x.fillStyle = 'rgba(255,' + Math.round(120 + Math.random() * 100) + ',30,.8)';
            x.fillRect(ex, ey - Math.random() * 120, 2, 2);
          }
          x.restore();
        }
        grain(x, t, 0.05, VW, VH);
      } else if (t < T6) {
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
      } else {
        tetes(x, t - T6, VW, VH, false);
        noir(x, 1 - (t - T6) / 2, VW, VH);
        titreFin(x, 'Good Ending', (t - T6 - 2) / 1.5, VW, 'rgba(255,200,120,.6)');
      }
    }, retour);
  }

  // ---------- La mauvaise fin ----------
  function finMauvaise(hote, retour) {
    init();
    DP.wadeFin && DP.wadeFin('mauvaise');
    ['wade', 'charlie', 'faith', 'stephen'].forEach(function (k) { image(k + '-horror'); });
    var page = null, sons = {};
    function une(cle, f) { if (!sons[cle]) { sons[cle] = 1; f(); } }
    SON.carillon();
    film(hote, 21, function (x, t, VW, VH) {
      if (t < 4) {
        // 6 AM, comme les autres nuits. Puis le noir.
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
        x.fillStyle = '#f4f4f0'; x.textAlign = 'center'; x.font = 'bold 120px Consolas, monospace';
        x.fillText('6 AM', VW / 2, VH / 2 + 40);
        noir(x, (t - 2.6) / 1.2, VW, VH);
      } else if (t < 8) {
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
      } else if (t < 9.6) {
        // Les quatre crient en meme temps. Et pendant une seconde, on les voit.
        une('cris', function () { ['wade', 'faith', 'stephen', 'charlie'].forEach(function (k, i) { setTimeout(function () { SON.hurle(k); }, i * 40); }); });
        x.fillStyle = Math.floor(t * 18) % 2 ? '#3a0000' : '#000';
        x.fillRect(0, 0, VW, VH);
        var k = ['wade', 'faith', 'stephen', 'charlie'][Math.floor(t * 10) % 4], d = tete(k);
        if (d) {
          var s = VH * 1.1 / (d.r * 2);
          x.save(); x.translate(VW / 2 + hasard(-20, 20), VH / 2 + hasard(-20, 20)); x.scale(s, s);
          x.drawImage(d.c, -d.r, -d.r);
          x.restore();
        }
        grain(x, t, 0.35, VW, VH);
      } else if (t < 15.6) {
        if (!page) page = journal(x, VW, VH, 'UN GARDIEN DE NUIT SAUVAGEMENT ASSASSINÉ',
          'Le corps a été découvert au petit matin, dans le bureau de sécurité.',
          'Le personnel d’ouverture a donné l’alerte peu après six heures. Les portes blindées du bureau étaient ouvertes. ' +
          'Les enquêteurs décrivent une scène « d’une violence inouïe ». Aucune trace d’effraction n’a été relevée. ' +
          'Les enregistrements des caméras de la nuit sont inexploitables : la neige, puis plus rien. ' +
          'Le restaurant rouvrira ses portes dès la semaine prochaine. La direction recrute déjà un nouveau gardien de nuit.',
          (function () { var d = tete('wade'); return d ? d.c : null; })());
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
        x.save();
        x.globalAlpha = Math.min(1, (t - 9.6) / 0.6) * (t > 14.6 ? Math.max(0, 1 - (t - 14.6)) : 1);
        x.translate(VW / 2, VH / 2 + 10); x.rotate(0.02);
        x.drawImage(page, -410, -300);
        x.restore();
        grain(x, t, 0.05, VW, VH);
      } else if (t < 16.6) {
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
      } else {
        une('regard', function () { SON.regard(); });
        tetes(x, t - 16.6, VW, VH, true);
        noir(x, 1 - (t - 16.6) / 1.5, VW, VH);
        titreFin(x, 'Bad Ending', (t - 18.2) / 1.2, VW, 'rgba(200,0,0,.8)');
      }
    }, retour);
  }

  window.WADE_SECRETS = { nuit: nuit, finBonne: finBonne, finMauvaise: finMauvaise, flammes: flammes };
})();
