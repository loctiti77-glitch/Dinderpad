// Le moteur de carte des mini-jeux : les tuiles, leur dessin, et la
// promenade au joystick.
//
// Il est partage par The Founder War et la Peche. Chaque jeu fournit sa
// grille de tuiles et ses ajouts de decor ; tout ce qui concerne le
// terrain, la camera, les collisions et le pas des personnages vit ici.
(function () {

  var TS = 24;                            // la taille d'une case, en pixels

  var T = {
    HERBE: 0, FLEUR: 1, CHEMIN: 2, ARBRE: 3, BUISSON: 4, ROCHER: 5,
    EAU: 6, MUR: 7, DALLE: 8, PORTE: 9, SABLE: 10, PONTON: 11, ROSEAU: 12,
    CABANE: 13, TOIT: 14, PORTE_BOIS: 15
  };

  // Ce qu'on ne traverse pas. L'eau se longe, elle ne se marche pas.
  var BLOQUANT = {};
  [T.ARBRE, T.BUISSON, T.ROCHER, T.EAU, T.MUR, T.ROSEAU,
   T.CABANE, T.TOIT].forEach(function (k) {
    BLOQUANT[k] = true;
  });

  // Un bruit stable : la meme case est toujours dessinee pareil, d'une
  // partie a l'autre et d'un joueur a l'autre.
  function bruit(x, y, sel) {
    var h = (x | 0) * 374761393 + (y | 0) * 668265263 + (sel || 0) * 2147483647;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function borne(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // ==========================================================
  //  Le dessin du terrain
  // ==========================================================

  function solTuile(x, g, tx, ty) {
    var t = g[ty][tx], px = tx * TS, py = ty * TS, i, n;

    if (t === T.EAU || t === T.ROSEAU) {
      // Un fond plus sombre au large, plus clair pres du bord : ca donne
      // de la profondeur sans avoir a dessiner les hauts-fonds a la main.
      var bord = false;
      for (var k = 0; k < 4; k++) {
        var nx = tx + [1, -1, 0, 0][k], ny = ty + [0, 0, 1, -1][k];
        if (!g[ny] || g[ny][nx] === undefined) continue;
        if (g[ny][nx] !== T.EAU && g[ny][nx] !== T.ROSEAU) bord = true;
      }
      x.fillStyle = bord ? '#2a68c4' : '#1d4f9c';
      x.fillRect(px, py, TS, TS);
      x.fillStyle = bord ? '#3f82dd' : '#2a68c4';
      for (i = 0; i < 5; i++) {
        n = bruit(tx, ty, 10 + i);
        x.fillRect(px + (n * 18 | 0), py + i * 5 + 1, 6, 2);
      }
      return;
    }

    if (t === T.SABLE) {
      x.fillStyle = (tx + ty) % 2 ? '#e0cf94' : '#d8c68a';
      x.fillRect(px, py, TS, TS);
      x.fillStyle = '#c9b478';
      for (i = 0; i < 5; i++) {
        n = bruit(tx, ty, 140 + i);
        x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 150 + i) * 21) | 0), 2, 2);
      }
      return;
    }

    if (t === T.CABANE || t === T.TOIT || t === T.PORTE_BOIS) {
      // Les murs en planches verticales, le toit en bardeaux.
      if (t === T.TOIT) {
        x.fillStyle = '#7a3b2c'; x.fillRect(px, py, TS, TS);
        x.fillStyle = '#8f4835';
        for (i = 0; i < 3; i++) x.fillRect(px + 1, py + i * 8 + 1, TS - 2, 6);
        x.fillStyle = '#5c2a1f';
        for (i = 0; i < 3; i++) x.fillRect(px + ((ty + i) % 2 ? 4 : 14), py + i * 8, 2, 8);
        return;
      }
      x.fillStyle = '#9b6b3c'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#ac7a47';
      for (i = 0; i < 4; i++) x.fillRect(px + i * 6 + 1, py, 4, TS);
      x.fillStyle = '#7a5129';
      for (i = 0; i < 4; i++) x.fillRect(px + i * 6, py, 1, TS);
      return;
    }

    if (t === T.PONTON) {
      x.fillStyle = '#8a6136'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#9d7040';
      x.fillRect(px + 1, py + 1, TS - 2, 6);
      x.fillRect(px + 1, py + 9, TS - 2, 6);
      x.fillRect(px + 1, py + 17, TS - 2, 6);
      x.fillStyle = '#6b4826';
      x.fillRect(px, py + 7, TS, 2);
      x.fillRect(px, py + 15, TS, 2);
      return;
    }

    if (t === T.DALLE || t === T.MUR || t === T.PORTE) {
      x.fillStyle = '#6b6f7d'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#7c8090';
      x.fillRect(px + 1, py + 1, TS - 3, 10);
      x.fillRect(px + 1, py + 13, TS - 3, 9);
      x.fillStyle = 'rgba(0,0,0,.22)';
      x.fillRect(px, py + 11, TS, 2);
      x.fillRect(px + (ty % 2 ? 6 : 16), py, 2, 11);
      x.fillRect(px + (ty % 2 ? 16 : 6), py + 13, 2, 9);
      return;
    }

    if (t === T.CHEMIN) {
      x.fillStyle = '#a5794a'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#b98c59';
      for (i = 0; i < 6; i++) {
        n = bruit(tx, ty, 20 + i);
        x.fillRect(px + (n * 20 | 0), py + ((bruit(tx, ty, 30 + i) * 20) | 0), 3, 2);
      }
      x.fillStyle = '#8e6539';
      for (i = 0; i < 3; i++) {
        n = bruit(tx, ty, 40 + i);
        x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 50 + i) * 21) | 0), 2, 2);
      }
      return;
    }

    // Herbe : deux verts en damier, puis des touffes.
    x.fillStyle = (tx + ty) % 2 ? '#3d8b38' : '#438f3c';
    x.fillRect(px, py, TS, TS);
    x.fillStyle = '#4d9c42';
    for (i = 0; i < 4; i++) {
      n = bruit(tx, ty, 60 + i);
      x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 70 + i) * 21) | 0), 3, 2);
    }
    x.fillStyle = '#347a30';
    for (i = 0; i < 3; i++) {
      n = bruit(tx, ty, 80 + i);
      x.fillRect(px + (n * 22 | 0), py + ((bruit(tx, ty, 90 + i) * 22) | 0), 2, 3);
    }
    if (t === T.FLEUR) {
      var fx = px + 8 + ((bruit(tx, ty, 3) * 6) | 0);
      var fy = py + 8 + ((bruit(tx, ty, 4) * 6) | 0);
      var tons = ['#f6e05e', '#f28ab2', '#e8eef7', '#f0a15a'];
      x.fillStyle = '#2f6e2c'; x.fillRect(fx + 2, fy + 3, 2, 4);
      x.fillStyle = tons[(bruit(tx, ty, 5) * 4) | 0];
      x.fillRect(fx + 1, fy, 4, 3);
      x.fillRect(fx, fy + 1, 6, 1);
    }
  }

  function objetTuile(x, g, tx, ty, opts) {
    var t = g[ty][tx], px = tx * TS, py = ty * TS, i, n;

    if (t === T.ROSEAU) {
      // Des joncs qui depassent de l'eau, au bord des etangs.
      x.fillStyle = '#2f6e2c';
      for (i = 0; i < 5; i++) {
        n = bruit(tx, ty, 160 + i);
        var rx = px + 2 + (n * 19 | 0), rh = 9 + ((bruit(tx, ty, 170 + i) * 9) | 0);
        x.fillRect(rx, py + TS - rh, 2, rh);
        x.fillStyle = '#7c5a2c';
        x.fillRect(rx, py + TS - rh - 3, 2, 3);
        x.fillStyle = '#2f6e2c';
      }
      return;
    }

    if (t === T.ARBRE) {
      // Un arbre deborde d'une case vers le haut : c'est ce qui donne du
      // relief a la foret.
      var hx = px + TS / 2;
      x.fillStyle = 'rgba(0,0,0,.25)';
      x.fillRect(px + 3, py + TS - 5, TS - 6, 4);
      x.fillStyle = '#6b4526'; x.fillRect(hx - 4, py + 8, 8, TS - 10);
      x.fillStyle = '#7d5430'; x.fillRect(hx - 4, py + 8, 3, TS - 10);
      x.fillStyle = '#573619'; x.fillRect(hx + 1, py + 12, 2, 5);

      x.fillStyle = '#1f5c26';
      x.fillRect(px - 2, py - 12, TS + 4, 22);
      x.fillRect(px + 2, py - 18, TS - 4, 30);
      x.fillStyle = '#2a7a2f';
      x.fillRect(px + 1, py - 14, TS - 6, 16);
      x.fillStyle = '#3a9b3a';
      x.fillRect(px + 3, py - 16, 9, 7);
      x.fillRect(px + 2, py - 9, 5, 4);
      x.fillStyle = '#16451c';
      for (i = 0; i < 4; i++) {
        n = bruit(tx, ty, 100 + i);
        x.fillRect(px + 2 + (n * 18 | 0), py - 12 + ((bruit(tx, ty, 110 + i) * 18) | 0), 4, 3);
      }
      return;
    }

    if (t === T.BUISSON) {
      x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(px + 3, py + TS - 4, TS - 6, 3);
      x.fillStyle = '#1f5f28'; x.fillRect(px + 2, py + 6, TS - 4, TS - 9);
      x.fillStyle = '#2d8034'; x.fillRect(px + 3, py + 5, TS - 8, 9);
      x.fillStyle = '#3f9c42'; x.fillRect(px + 5, py + 6, 6, 4);
      x.fillStyle = '#d8434f';
      for (i = 0; i < 3; i++) {
        n = bruit(tx, ty, 120 + i);
        x.fillRect(px + 4 + (n * 14 | 0), py + 9 + ((bruit(tx, ty, 130 + i) * 9) | 0), 2, 2);
      }
      return;
    }

    if (t === T.ROCHER) {
      x.fillStyle = 'rgba(0,0,0,.24)'; x.fillRect(px + 3, py + TS - 4, TS - 6, 3);
      x.fillStyle = '#5d6270'; x.fillRect(px + 3, py + 7, TS - 6, TS - 10);
      x.fillStyle = '#767c8c'; x.fillRect(px + 4, py + 6, TS - 10, 7);
      x.fillStyle = '#8f95a6'; x.fillRect(px + 6, py + 7, 5, 3);
      x.fillStyle = '#43485a'; x.fillRect(px + 10, py + 12, 7, 3);
      return;
    }

    if (t === T.EAU) {
      // Un nenuphar de loin en loin, pour que l'eau ne soit pas nue.
      if (bruit(tx, ty, 180) > 0.9) {
        x.fillStyle = '#2f7a34';
        x.fillRect(px + 6, py + 9, 11, 7);
        x.fillRect(px + 8, py + 7, 7, 11);
        x.fillStyle = '#3f9c42'; x.fillRect(px + 8, py + 9, 5, 3);
        x.fillStyle = '#1d4f9c'; x.fillRect(px + 11, py + 12, 2, 4);
        if (bruit(tx, ty, 181) > 0.5) {
          x.fillStyle = '#f2d8e8'; x.fillRect(px + 13, py + 6, 3, 3);
          x.fillStyle = '#f6e05e'; x.fillRect(px + 14, py + 7, 1, 1);
        }
      }
      return;
    }

    if (t === T.MUR && opts && opts.arene) {
      var AR = opts.arene;
      x.fillStyle = '#4d5160'; x.fillRect(px, py, TS, 3);
      if (ty === AR.y0) {
        x.fillStyle = '#878ca0';
        x.fillRect(px + (tx % 2 ? 2 : 12), py - 6, 9, 7);
      }
      if (ty === AR.y1 && tx % 3 === 0) {
        x.fillStyle = '#4a3420'; x.fillRect(px + 10, py + 6, 3, 10);
        x.fillStyle = '#ff9b35'; x.fillRect(px + 9, py + 1, 5, 6);
        x.fillStyle = '#ffe27a'; x.fillRect(px + 10, py + 2, 3, 3);
      }
      return;
    }

    if (t === T.PORTE_BOIS) {
      // La porte de la cabane : un rectangle sombre, un linteau, une poignee.
      x.fillStyle = '#4a2c18'; x.fillRect(px + 2, py + 2, TS - 4, TS - 2);
      x.fillStyle = '#5e3a20'; x.fillRect(px + 4, py + 5, TS - 8, TS - 6);
      x.fillStyle = '#c9a227'; x.fillRect(px + TS - 8, py + 13, 2, 2);
      x.fillStyle = '#7a5129'; x.fillRect(px, py, TS, 3);
      x.fillStyle = 'rgba(255,225,120,.14)'; x.fillRect(px + 2, py + 3, TS - 4, TS - 4);
      return;
    }

    if (t === T.CABANE && opts && opts.cabane) {
      var C = opts.cabane;
      // Une fenetre eclairee, et l'enseigne au poisson au-dessus de la porte.
      if (ty === C.y1 && tx === C.x0 + 1) {
        x.fillStyle = '#3a2414'; x.fillRect(px + 3, py + 4, TS - 6, TS - 10);
        x.fillStyle = '#ffd98a'; x.fillRect(px + 5, py + 6, TS - 10, TS - 14);
        x.fillStyle = '#3a2414'; x.fillRect(px + TS / 2 - 1, py + 4, 2, TS - 10);
      }
      if (ty === C.y1 && tx === C.porte + 2) {
        x.fillStyle = '#2b1a0f'; x.fillRect(px + 1, py + 3, TS - 2, 13);
        x.fillStyle = '#e8eef7'; x.fillRect(px + 4, py + 7, 10, 4);
        x.fillRect(px + 13, py + 6, 4, 6);
        x.fillStyle = '#2b1a0f'; x.fillRect(px + 6, py + 8, 1, 1);
        x.fillStyle = '#c9a227'; x.fillRect(px + 1, py + 2, TS - 2, 1);
      }
      return;
    }

    if (t === T.TOIT && opts && opts.cabane) {
      // Le debord du toit, qui mange un peu sur la case du dessus.
      if (ty === opts.cabane.y0) {
        x.fillStyle = '#5c2a1f';
        x.fillRect(px - 2, py - 5, TS + 4, 5);
      }
      return;
    }

    if (t === T.PORTE) {
      x.fillStyle = '#20232e'; x.fillRect(px, py + 2, TS, TS - 2);
      x.fillStyle = '#c9a227'; x.fillRect(px, py, TS, 3);
      x.fillStyle = 'rgba(255,225,120,.16)'; x.fillRect(px, py + 4, TS, TS - 6);
    }
  }

  // Peint la carte entiere une fois pour toutes : la boucle de jeu n'a
  // plus qu'a en decouper la fenetre visible.
  function peindre(g, opts) {
    var MH = g.length, MW = g[0].length;
    var c = document.createElement('canvas');
    c.width = MW * TS; c.height = MH * TS;
    var x = c.getContext('2d');
    if (!x) return c;
    var tx, ty;
    for (ty = 0; ty < MH; ty++) for (tx = 0; tx < MW; tx++) solTuile(x, g, tx, ty);
    for (ty = 0; ty < MH; ty++) for (tx = 0; tx < MW; tx++) objetTuile(x, g, tx, ty, opts);
    return c;
  }

  // ==========================================================
  //  La promenade
  // ==========================================================

  var CLAVIER = {
    ArrowUp: 'h', ArrowDown: 'b', ArrowLeft: 'g', ArrowRight: 'd',
    z: 'h', s: 'b', q: 'g', d: 'd', w: 'h', a: 'g'
  };

  function Balade(cfg) {
    var g = cfg.grille;
    var MH = g.length, MW = g[0].length;
    var cv = cfg.canvas, ctx = cv.getContext('2d');
    if (ctx) ctx.imageSmoothingEnabled = false;

    var monde = cfg.monde || peindre(g, cfg.opts);
    var VUE_W = cv.width, VUE_H = cv.height;
    var VITESSE = cfg.vitesse || 86;
    var DIRS = (window.CHIBI && window.CHIBI.DIRS) || { bas: 0, gauche: 1, droite: 2, haut: 3 };
    var reduit = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var chef = { x: cfg.depart.x, y: cfg.depart.y,
                 dir: cfg.direction == null ? DIRS.bas : cfg.direction,
                 pas: 0, bouge: false };
    var trace = [];
    var suite = (cfg.troupe || []).slice(1);
    var meneur = (cfg.troupe || [])[0];
    var dir = { x: 0, y: 0 };
    var cam = { x: 0, y: 0 };
    var vivant = true, dernier = 0, derniereCase = '';

    // --- Le joystick ---
    var actif = false, rayon = 0, centre = { x: 0, y: 0 };
    var stick = cfg.stick, pomme = cfg.pomme;

    function prendre(e) {
      var r = stick.getBoundingClientRect();
      rayon = r.width / 2;
      centre.x = r.left + rayon; centre.y = r.top + rayon;
      actif = true;
      stick.classList.add('is-actif');
      if (stick.setPointerCapture) { try { stick.setPointerCapture(e.pointerId); } catch (err) {} }
      bouger(e);
    }
    function bouger(e) {
      if (!actif) return;
      var dx = e.clientX - centre.x, dy = e.clientY - centre.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var k = Math.min(1, d / (rayon * 0.72));
      dir.x = dx / d * k; dir.y = dy / d * k;
      pomme.style.transform = 'translate(' + (dir.x * rayon * 0.5) + 'px,' +
                                             (dir.y * rayon * 0.5) + 'px)';
    }
    function lacher() {
      actif = false;
      dir.x = dir.y = 0;
      stick.classList.remove('is-actif');
      pomme.style.transform = '';
    }
    if (stick) {
      stick.addEventListener('pointerdown', prendre);
      stick.addEventListener('pointermove', bouger);
      stick.addEventListener('pointerup', lacher);
      stick.addEventListener('pointercancel', lacher);
      stick.addEventListener('lostpointercapture', lacher);
    }

    // --- Le clavier, pour jouer au bureau ---
    var touches = {};
    function auClavier(e, enfonce) {
      var k = CLAVIER[e.key];
      if (!k) return;
      touches[k] = enfonce;
      e.preventDefault();
    }
    var kd = function (e) { auClavier(e, true); };
    var ku = function (e) { auClavier(e, false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    function arreter() {
      vivant = false;
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    }

    // --- Les collisions ---
    // On teste les pieds du sprite, pas tout son corps : c'est ce qui
    // permet de passer devant un arbre sans se coincer dedans.
    function libre(x, y) {
      var b = [[x - 7, y - 3], [x + 7, y - 3], [x - 7, y + 4], [x + 7, y + 4]];
      for (var i = 0; i < b.length; i++) {
        var tx = Math.floor(b[i][0] / TS), ty = Math.floor(b[i][1] / TS);
        if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return false;
        if (BLOQUANT[g[ty][tx]]) return false;
      }
      return true;
    }

    function caseDuChef() {
      return [Math.floor(chef.x / TS), Math.floor(chef.y / TS)];
    }

    // La case que le personnage a juste devant lui : c'est elle qu'on
    // interroge pour savoir s'il fait face a l'eau.
    function caseDevant() {
      var c = caseDuChef();
      if (chef.dir === DIRS.gauche) c[0]--;
      else if (chef.dir === DIRS.droite) c[0]++;
      else if (chef.dir === DIRS.haut) c[1]--;
      else c[1]++;
      return c;
    }

    function tuile(tx, ty) { return g[ty] && g[ty][tx] !== undefined ? g[ty][tx] : null; }

    function poserSprite(p, t) {
      if (p.dessin) return p.dessin(ctx, p.x - cam.x, p.y - cam.y, t);
      var f = window.CHIBI && window.CHIBI.feuille(p.id);
      if (!f) return;
      var sx = Math.round(p.x - cam.x - f.L / 2);
      var sy = Math.round(p.y - cam.y - f.H + 5);

      // La pose suit la distance parcourue : le pas s'accorde a la vitesse
      // reelle au lieu de tourner en rond dans le vide.
      var pose = 0;
      if (reduit) pose = 0;
      else if (p.fixe) pose = Math.floor(t / 600) % 2 ? 2 : 0;
      else if (p.bouge) pose = Math.floor(p.pas / 5) % f.poses;

      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath();
      ctx.ellipse(p.x - cam.x, p.y - cam.y + 2, f.L * 0.32, 3, 0, 0, 6.3);
      ctx.fill();

      ctx.drawImage(f.canvas, pose * f.L, (p.dir || 0) * f.H, f.L, f.H, sx, sy, f.L, f.H);
    }

    function dessiner(t) {
      ctx.drawImage(monde, cam.x | 0, cam.y | 0, VUE_W, VUE_H, 0, 0, VUE_W, VUE_H);

      // L'eau bouge : deux lignes claires qui glissent.
      var t0 = t / 320;
      for (var ty = Math.floor(cam.y / TS); ty <= (cam.y + VUE_H) / TS; ty++) {
        for (var tx = Math.floor(cam.x / TS); tx <= (cam.x + VUE_W) / TS; tx++) {
          if (!g[ty] || (g[ty][tx] !== T.EAU && g[ty][tx] !== T.ROSEAU)) continue;
          var px = tx * TS - cam.x, py = ty * TS - cam.y;
          ctx.fillStyle = 'rgba(190,225,255,.5)';
          var o = ((Math.sin(t0 + tx * 0.7 + ty) * 7) | 0) + 8;
          ctx.fillRect(px + o, py + 6, 7, 2);
          ctx.fillRect(px + (TS - o - 6), py + 15, 5, 2);
        }
      }

      if (cfg.avant) cfg.avant(ctx, cam, t);

      // La troupe, plus ce que le jeu veut faire trier avec elle.
      var ordre = (cfg.extras ? cfg.extras(t) : []).slice();
      for (var k = suite.length - 1; k >= 0; k--) {
        var p = trace[Math.min(trace.length - 1, (k + 1) * 22)] || chef;
        ordre.push({ id: suite[k], x: p.x, y: p.y, dir: p.dir,
                     pas: chef.pas + k * 2, bouge: chef.bouge });
      }
      if (meneur) {
        ordre.push({ id: meneur, x: chef.x, y: chef.y, dir: chef.dir,
                     pas: chef.pas, bouge: chef.bouge });
      }
      ordre.sort(function (a, b) { return a.y - b.y; });
      ordre.forEach(function (p) { poserSprite(p, t); });

      if (cfg.apres) cfg.apres(ctx, cam, t);
    }

    function boucle(t) {
      if (!vivant) return;
      if (cfg.vivant && !cfg.vivant()) { arreter(); return; }
      var dt = dernier ? Math.min(0.05, (t - dernier) / 1000) : 0;
      dernier = t;

      var vx = dir.x, vy = dir.y;
      if (touches.g) vx = -1; if (touches.d) vx = 1;
      if (touches.h) vy = -1; if (touches.b) vy = 1;
      var n = Math.sqrt(vx * vx + vy * vy);
      if (n > 1) { vx /= n; vy /= n; }

      var fige = cfg.fige && cfg.fige();
      chef.bouge = !fige && !!(vx || vy);
      if (chef.bouge) {
        var nx = chef.x + vx * VITESSE * dt;
        var ny = chef.y + vy * VITESSE * dt;
        if (libre(nx, chef.y)) chef.x = nx;
        if (libre(chef.x, ny)) chef.y = ny;
        chef.dir = window.CHIBI ? window.CHIBI.sens(vx, vy, chef.dir) : chef.dir;
        chef.pas += (Math.abs(vx) + Math.abs(vy)) * dt * 30;
        trace.unshift({ x: chef.x, y: chef.y, dir: chef.dir });
        if (trace.length > 400) trace.length = 400;
      }

      // La camera suit, mais ne sort jamais de la carte.
      cam.x = borne(chef.x - VUE_W / 2, 0, MW * TS - VUE_W);
      cam.y = borne(chef.y - VUE_H / 2, 0, MH * TS - VUE_H);

      var c = caseDuChef(), casier = c[0] + ',' + c[1];
      if (casier !== derniereCase) {
        derniereCase = casier;
        if (cfg.surCase) cfg.surCase(c[0], c[1], tuile(c[0], c[1]));
      }

      dessiner(t);
      if (cfg.chaqueImage) cfg.chaqueImage(t);

      requestAnimationFrame(boucle);
    }

    requestAnimationFrame(boucle);

    return {
      chef: chef, cam: cam, arreter: arreter,
      caseDuChef: caseDuChef, caseDevant: caseDevant, tuile: tuile,
      libre: libre, monde: monde, DIRS: DIRS
    };
  }

  window.MONDE = {
    TS: TS, T: T, BLOQUANT: BLOQUANT,
    bruit: bruit, borne: borne,
    peindre: peindre, Balade: Balade
  };
})();
