// Wade and Friends : les jumpscares de la nuit (repris de assets/nuit.html).
//
// Quand un animatronique nous attrape :
//   A  0 - 1,1 s    la lampe lache ; il est deja dans l'encadrement, plus
//                   pres a chaque eclair ;
//   B  1,1 - 1,24   il se jette sur nous (flou de mouvement, flash) ;
//   C  1,24 - 2,5   gros plan : la machoire claque, la tete saccade comme un
//                   servomoteur, des etincelles jaillissent des charnieres ;
//   D  2,5 - 2,62   une derniere poussee dans la gueule, puis le noir.
// Tout se compose sur une toile 1280 x 720, posee ensuite sur l'ecran du jeu.
(function () {
  var DOSSIER = 'assets/games/wade/';
  var W = 1280, H = 720;
  var TA = 1.1, TB = 1.24, TC = 2.5, TD = 2.62;

  // Les reperes, dans l'espace 1024 x 1536 des images : les yeux, le visage,
  // le bas des pieds, et la machoire (ligne y, museau x0..x1, profondeur h,
  // charniere hx).
  var CH = {
    charlie: { eyes: [[400, 200], [539, 198]], face: [468, 300], bottom: 1527, eyeCol: '255,255,255', mouth: { y: 368, x0: 375, x1: 575, h: 120, hx: 580 } },
    stephen: { eyes: [[474, 221]], face: [480, 300], bottom: 1451, eyeCol: '255,255,255', mouth: { y: 350, x0: 385, x1: 610, h: 110, hx: 615 } },
    wade:    { eyes: [[395, 236], [489, 224]], face: [445, 290], bottom: 1529, eyeCol: '255,240,200', mouth: { y: 318, x0: 370, x1: 540, h: 95, hx: 545 } },
    faith:   { eyes: [[470, 212]], face: [440, 265], bottom: 1453, eyeCol: '255,60,60', mouth: { y: 300, x0: 330, x1: 520, h: 90, hx: 525 } }
  };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function toile(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  var pretes = false, cv, ctx, shade, sx, fc, fx, tc, tx, grain;
  function preparer() {
    if (pretes) return;
    pretes = true;
    Object.keys(CH).forEach(function (k) { var im = new Image(); im.src = DOSSIER + 'nuit-' + k + '.webp'; CH[k].img = im; });
    cv = toile(W, H); ctx = cv.getContext('2d');
    shade = toile(W, H); sx = shade.getContext('2d');
    fc = toile(W, H); fx = fc.getContext('2d');
    tc = toile(W, H); tx = tc.getContext('2d');
    grain = [0, 1, 2, 3].map(function () {
      var c = toile(320, 180), x = c.getContext('2d'), id = x.createImageData(320, 180);
      for (var i = 0; i < id.data.length; i += 4) { var v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      x.putImageData(id, 0, 0);
      return c;
    });
  }

  function charge(k) { var c = CH[k]; return !!(c && c.img && c.img.complete && c.img.naturalWidth); }

  // ---------- Dessin ----------
  function charT(c, cx, footY, h, rot) {
    var s = h / 1536;
    return { c: c, cx: cx, footY: footY, s: s, rot: rot || 0,
      pt: function (p) {
        var x = (p[0] - 512) * s, y = (p[1] - c.bottom) * s, co = Math.cos(this.rot), si = Math.sin(this.rot);
        return [cx + x * co - y * si, footY + x * si + y * co];
      } };
  }

  function drawChar(T, g, jaw) {
    var c = T.c;
    g = g || ctx; jaw = jaw || 0;
    if (!c.img.complete) return;
    g.save(); g.translate(T.cx, T.footY); g.rotate(T.rot); g.scale(T.s, T.s); g.translate(-512, -c.bottom);
    if (jaw <= 0) { g.drawImage(c.img, 0, 0, 1024, 1536); g.restore(); return; }
    var m = c.mouth, mx = (m.x0 + m.x1) / 2, rx = (m.x1 - m.x0) / 2 + 26;
    // La gueule, derriere.
    var gr = g.createLinearGradient(0, m.y - 10, 0, m.y + jaw + 10);
    gr.addColorStop(0, '#000'); gr.addColorStop(0.6, '#0d0101'); gr.addColorStop(1, '#000');
    g.fillStyle = gr; g.beginPath(); g.ellipse(mx, m.y + jaw * 0.4, rx * 0.82, jaw * 0.5 + 8, 0, 0, 6.29); g.fill();
    // Le crane : tout sauf la machoire.
    g.save(); g.beginPath(); g.rect(-3000, -3000, 7000, 7000);
    g.moveTo(mx + rx, m.y); g.ellipse(mx, m.y, rx, m.h, 0, 0, Math.PI); g.closePath();
    g.clip('evenodd'); g.drawImage(c.img, 0, 0, 1024, 1536); g.restore();
    // La machoire, tombee sur sa charniere.
    g.save(); g.translate(m.hx, m.y); g.rotate(-jaw * 0.0007); g.translate(-m.hx, -m.y + jaw * 0.8);
    g.beginPath(); g.moveTo(mx + rx, m.y); g.ellipse(mx, m.y, rx, m.h, 0, 0, Math.PI); g.closePath();
    g.clip(); g.drawImage(c.img, 0, 0, 1024, 1536); g.restore();
    g.restore();
  }

  function glow(x, y, r, col, a, g) {
    g = g || ctx;
    var gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(' + col + ',' + a + ')');
    gr.addColorStop(0.4, 'rgba(' + col + ',' + a * 0.35 + ')');
    gr.addColorStop(1, 'rgba(' + col + ',0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  function eyes(T, a, size, g) {
    g = g || ctx; size = size || 1;
    if (a <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    T.c.eyes.forEach(function (e) {
      var p = T.pt(e), r = Math.max(2, T.s * 22) * size;
      glow(p[0], p[1], r * 5, T.c.eyeCol, a * 0.5, g);
      g.fillStyle = 'rgba(255,255,255,' + a + ')';
      g.beginPath(); g.arc(p[0], p[1], r * 0.35, 0, 6.29); g.fill();
    });
    g.restore();
  }

  function darkness(level, lights, g) {
    g = g || ctx;
    sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, W, H);
    sx.fillStyle = 'rgba(0,0,0,' + level + ')'; sx.fillRect(0, 0, W, H);
    sx.globalCompositeOperation = 'destination-out';
    lights.forEach(function (l) {
      var gr = sx.createRadialGradient(l[0], l[1], 0, l[0], l[1], l[2]);
      gr.addColorStop(0, 'rgba(0,0,0,' + l[3] + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      sx.fillStyle = gr; sx.fillRect(l[0] - l[2], l[1] - l[2], 2 * l[2], 2 * l[2]);
    });
    g.drawImage(shade, 0, 0);
  }

  function film(a) {
    ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(grain[(Math.random() * 4) | 0], 0, 0, W, H); ctx.restore();
  }
  function vignette(a) {
    var v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,' + a + ')');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  function tear(n, amp) {
    for (var i = 0; i < n; i++) { var y = rnd(0, H), h = rnd(3, 30); ctx.drawImage(cv, 0, y, W, h, rnd(-amp, amp), y, W, h); }
  }

  // L'encadrement de la porte, eclaire ou non par la lampe.
  function drawDoor(g, on, T, eyeA) {
    var dx = W * 0.5, dw = 520, dtop = H * 0.08;
    g.fillStyle = '#0b0907'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1d1813'; g.fillRect(0, 0, dx - dw / 2, H); g.fillRect(dx + dw / 2, 0, W, H); g.fillRect(0, 0, W, dtop);
    g.fillStyle = '#000'; g.fillRect(dx - dw / 2, dtop, dw, H);
    if (T) { g.save(); g.beginPath(); g.rect(dx - dw / 2, dtop, dw, H); g.clip(); drawChar(T, g); g.restore(); }
    g.strokeStyle = '#3a3026'; g.lineWidth = 14; g.strokeRect(dx - dw / 2, dtop, dw, H);
    g.fillStyle = '#120f0b'; g.fillRect(0, H * 0.86, W, H * 0.14); g.fillStyle = '#2b241b'; g.fillRect(0, H * 0.86, W, 6);
    darkness(on ? 0.55 : 0.975, on ? [[dx, H * 0.42, 420, 1], [dx, H * 0.42, 180, 1]] : [], g);
    if (on) { g.save(); g.globalCompositeOperation = 'lighter'; glow(dx, H * 0.42, 420, '255,230,170', 0.1, g); g.restore(); }
    if (T) eyes(T, eyeA != null ? eyeA : (on ? 0.2 : 0.95), 1.4, g);
  }

  // ---------- Le jumpscare ----------
  function nouvelle(k) {
    preparer();
    return { k: CH[k] ? k : 'wade', step: 0, sparks: [], rot: 0, rotT: 0, tw: 0, ox: 0, oy: 0, oxT: 0, oyT: 0, sons: {} };
  }

  function sonner(S, nom, f) { if (S.sons[nom]) return; S.sons[nom] = true; try { f(); } catch (e) {} }

  // Dessine l'instant t du jumpscare sur la toile interne. Rend vrai tant
  // qu'il reste quelque chose a voir.
  function composer(S, t, dt, reduit) {
    var c = CH[S.k], SON = window.WADE_SON;
    ctx.save();
    if (t < TA) {
      // Les eclairs de la lampe : a chacun, il est plus pres.
      var strobe = (t > 0.35 && t < 0.42) || (t > 0.72 && t < 0.77) || (t > 0.98 && t < 1.02);
      if (SON) {
        if (t > 0.35) sonner(S, 'e1', function () { SON.gresille(); });
        if (t > 0.72) sonner(S, 'e2', function () { SON.gresille(); SON.servo(0.6); });
        if (t > 0.98) sonner(S, 'e3', function () { SON.gresille(); });
      }
      var q = Math.pow(t / TA, 3), h = 760 + q * 1000, fy = 156 + q * 110, foot = fy - (c.face[1] - c.bottom) * h / 1536;
      var T0 = charT(c, W * 0.5 + (t > 0.7 ? rnd(-4, 4) : 0), foot, h, t > 0.72 ? 0.05 : 0);
      drawDoor(ctx, strobe, T0, strobe ? 0.3 : 1);
      ctx.font = '30px VT323, monospace'; ctx.fillStyle = 'rgba(255,179,64,.85)'; ctx.textBaseline = 'top';
      ctx.fillText(strobe ? 'LAMPE : ON' : 'LAMPE : ...', 40, 30);
      film(0.2); vignette(0.85);
      ctx.restore();
      return true;
    }
    if (t >= TD) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      return false;
    }
    if (SON) sonner(S, 'cri', function () { SON.hurle(S.k); });

    // La tete qui saccade : un nouvel angle toutes les 0,1 a 0,22 s.
    S.tw -= dt;
    if (S.tw <= 0) {
      S.tw = rnd(0.1, 0.22); S.rotT = rnd(-0.11, 0.11); S.oyT = rnd(-30, 30); S.oxT = rnd(-40, 40);
      if (SON && t > TB && Math.random() < 0.6) { try { SON.servo(0.8, rnd(-0.5, 0.5)); } catch (e) {} }
    }
    S.rot += (S.rotT - S.rot) * Math.min(1, dt * 28);
    S.ox += (S.oxT - S.ox) * Math.min(1, dt * 22);
    S.oy += (S.oyT - S.oy) * Math.min(1, dt * 22);

    var h2, jaw, shake;
    if (t < TB) { var u = (t - TA) / (TB - TA); h2 = 1500 + Math.pow(u, 2.2) * 1500; jaw = u * 45; shake = 10 + u * 30; }
    else if (t < TC) {
      var u2 = (t - TB) / (TC - TB); h2 = 3000 + u2 * 450 + Math.sin(t * 9) * 60;
      var ch = Math.abs(Math.sin(t * Math.PI * 6.5)); jaw = 15 + Math.pow(ch, 0.6) * 55; h2 += Math.pow(ch, 4) * 260;
      S.rotT += (Math.random() - 0.5) * 0.02 * ch; shake = 34 * (1 - u2 * 0.5);
    } else { var u3 = (t - TC) / (TD - TC); h2 = 3450 + u3 * 4000; jaw = 70 + u3 * 20; shake = 50; }
    if (reduit) shake *= 0.3;
    var jx = rnd(-shake, shake) + Math.sin(t * 41) * shake * 0.4, jy = rnd(-shake, shake) * 0.8;

    // Le visage, compose a part.
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.globalCompositeOperation = 'source-over';
    fx.fillStyle = '#030101'; fx.fillRect(0, 0, W, H);
    var s = h2 / 1536, f = c.face, rot = S.rot + (t < TB ? 0.05 : 0);
    var co = Math.cos(rot), si = Math.sin(rot), fxo = (f[0] - 512) * s, fyo = (f[1] - c.bottom) * s;
    var cx = W / 2 + S.ox + jx - (fxo * co - fyo * si), footY = H * 0.47 + S.oy + jy - (fxo * si + fyo * co);
    var T = charT(c, cx, footY, h2, rot);
    // Comme dans nuit.html : la machoire n'est pas decoupee, c'est la tete
    // entiere qui claque (les pulsations de taille ci-dessus).
    drawChar(T, fx);
    // La lampe, par en dessous, durement.
    darkness(0.5, [[W / 2 + S.ox * 0.3, H * 0.55, 860, 1], [W / 2, H * 0.5, 320, 0.6]], fx);
    eyes(T, 1, 0.35, fx);

    // L'aberration chromatique.
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var ab = (t < TB ? 18 : 10) + Math.random() * 12;
    [['#ff0000', -ab], ['#00ffff', ab]].forEach(function (p) {
      tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, W, H); tx.drawImage(fc, 0, 0);
      tx.globalCompositeOperation = 'multiply'; tx.fillStyle = p[0]; tx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(tc, p[1], 0); ctx.restore();
    });
    // Le flou de mouvement, sur l'elan et la derniere poussee.
    if (t < TB + 0.06 || t > TC) {
      for (var i = 1; i <= 5; i++) {
        var kk = 1 - i * 0.045;
        ctx.save(); ctx.globalAlpha = 0.16; ctx.translate(W / 2, H / 2); ctx.scale(kk, kk); ctx.drawImage(fc, -W / 2, -H / 2); ctx.restore();
      }
    }

    // Les etincelles des charnieres de la machoire.
    if (t > TB && Math.random() < 0.5) {
      var m = c.mouth, pp = T.pt([Math.random() < 0.5 ? m.x0 : m.x1, m.y]);
      for (var j = 0; j < 8; j++) S.sparks.push({ x: pp[0] + rnd(-20, 20), y: pp[1] + rnd(-20, 20), vx: rnd(-14, 14), vy: rnd(-16, 4), life: rnd(0.2, 0.45) });
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    S.sparks.forEach(function (p) {
      p.life -= dt; p.vy += 60 * dt; p.x += p.vx * dt * 60; p.y += p.vy * dt * 60;
      ctx.strokeStyle = 'rgba(255,' + (200 + Math.random() * 55 | 0) + ',140,' + clamp(p.life * 3, 0, 1) + ')';
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6); ctx.stroke();
    });
    ctx.restore();
    S.sparks = S.sparks.filter(function (p) { return p.life > 0; });

    // Le flash de l'impact, les pulsations rouges, l'image qui se dechire.
    if (t < TB + 0.05 && t > TB - 0.03) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(0, 0, W, H); }
    var pulse = Math.pow(Math.abs(Math.sin(t * Math.PI * 6.5)), 8);
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255,' + (60 - pulse * 50 | 0) + ',' + (60 - pulse * 50 | 0) + ',1)';
    ctx.globalAlpha = 0.25 + pulse * 0.45; ctx.fillRect(0, 0, W, H); ctx.restore();
    if (Math.random() < 0.35) tear(4, 40);
    film(0.28); vignette(0.9);
    // La lumiere qui meurt : des images noires, au hasard.
    if (Math.random() < 0.04) { ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
    return true;
  }

  // Pose l'instant t sur l'ecran du jeu, en le couvrant entierement.
  function dessiner(dest, S, t, dt, VW, VH, reduit) {
    var encore = composer(S, t, dt, reduit);
    var k = Math.max(VW / W, VH / H), w = W * k, h = H * k;
    dest.save();
    dest.setTransform(1, 0, 0, 1, 0, 0);
    dest.fillStyle = '#000'; dest.fillRect(0, 0, VW, VH);
    dest.imageSmoothingEnabled = true;
    dest.drawImage(cv, (VW - w) / 2, (VH - h) / 2, w, h);
    dest.restore();
    return encore;
  }

  window.WADE_NUIT = {
    DUREE: TD,
    CRI: TA,
    preparer: preparer,
    pret: function (k) { preparer(); return charge(k); },
    nouvelle: nouvelle,
    dessiner: dessiner
  };
})();
