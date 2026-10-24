// Le Telescope dans l'Odyssee : ses cinq fragments, la visee a la
// premiere personne, et le saut.
//
// Le Telescope ne s'obtient plus en contenant des failles : il est en
// pieces, dispersees sur cinq mondes. Chaque piece brille dans un recoin
// de sa carte, sous une colonne de lumiere qu'on voit de loin ; deux sont
// murees dans un anneau de roche (il faut la pioche), une dans un anneau
// de cristal (la foreuse). La cinquieme ramassee, elles s'assemblent.
//
// Une fois le Telescope en poche, on peut le porter a l'oeil sur
// n'importe quel monde (touche T, ou le bouton) : la vue grossit le ciel,
// ses etoiles et ses astres. Ce qu'on y voit depuis Viridia ne se raconte
// pas ici.
(function () {
  var DP = window.DP, M = window.MONDE, CR = window.ODYCRAFT;
  if (!DP || !M || !CR) return;

  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TS = M.TS, T = M.T;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  // ==========================================================
  //  Les cinq pieces
  // ==========================================================
  var PIECES = [
    { id: 'objectif', monde: 'terre', nom: 'L’objectif', barriere: null,
      desc: 'La grande lentille du bout. Elle a roulé jusqu’au fond du jardin.' },
    { id: 'tube', monde: 'mars', nom: 'Le tube', barriere: 'roche',
      desc: 'Un tube de cuivre cabossé, emmuré dans la roche rouge comme pour le cacher.' },
    { id: 'monture', monde: 'neptune', nom: 'La monture', barriere: 'cristal',
      desc: 'Le pied et sa rotule. Le cristal a poussé tout autour depuis qu’il est tombé.' },
    { id: 'oculaire', monde: 'opaline', nom: 'L’oculaire', barriere: null,
      desc: 'Le petit verre où l’on pose l’œil. Le ciel d’Opaline s’y reflète encore.' },
    { id: 'chercheur', monde: 'altera', nom: 'Le chercheur', barriere: 'roche',
      desc: 'La petite lunette qu’on fixe sur la grande, pour viser. Quelqu’un l’a emmurée exprès.' }
  ];
  var PAR_MONDE = {};
  PIECES.forEach(function (p, i) { p.rang = i; PAR_MONDE[p.monde] = p; });

  function trouves() {
    var s = CR.etat();
    if (!s.fragments) s.fragments = {};
    return s.fragments;
  }
  function aPiece(id) { return !!trouves()[id]; }
  function nombre() { return PIECES.filter(function (p) { return aPiece(p.id); }).length; }
  function complet() { return nombre() >= PIECES.length; }

  // ---------- Leur dessin : 20 x 20, cerne sombre ----------
  var IC = 20;
  var DESSINS = {
    objectif: function (p) {
      for (var y = -8; y <= 8; y++) { var w = Math.round(Math.sqrt(64 - y * y)); p(10 - w, 10 + y, w * 2 + 1, 1, '#c87a3a'); }
      for (y = -6; y <= 6; y++) { var w2 = Math.round(Math.sqrt(36 - y * y)); p(10 - w2, 10 + y, w2 * 2 + 1, 1, '#5aa8d8'); }
      p(6, 6, 3, 2, '#e8f8ff'); p(6, 8, 1, 2, '#e8f8ff'); p(12, 13, 2, 1, '#a8e0ff');
      p(9, 1, 2, 2, '#ffd8a8');
    },
    tube: function (p) {
      for (var i = 0; i < 13; i++) p(3 + i, 13 - i, 5, 5, i % 4 ? '#c87a3a' : '#ffb06a');
      for (i = 0; i < 13; i++) p(3 + i, 17 - i, 2, 1, '#5a2a10');
      p(2, 14, 4, 4, '#8a4a1a'); p(15, 2, 4, 4, '#8a4a1a'); p(16, 3, 2, 2, '#2a1a10'); p(9, 7, 2, 1, '#ffd8a8');
    },
    monture: function (p) {
      for (var y = -3; y <= 3; y++) { var w = Math.round(Math.sqrt(9 - y * y)); p(10 - w, 5 + y, w * 2 + 1, 1, '#9aa0aa'); }
      p(9, 4, 2, 1, '#e0e4ec'); p(9, 8, 2, 4, '#5a5e68');
      for (var i = 0; i < 6; i++) { p(9 - i, 12 + i, 2, 1, '#7a5a2a'); p(9 + i, 12 + i, 2, 1, '#7a5a2a'); }
      p(9, 12, 2, 7, '#7a5a2a'); p(3, 18, 3, 1, '#4a3a1a'); p(14, 18, 3, 1, '#4a3a1a'); p(9, 18, 2, 1, '#4a3a1a');
    },
    oculaire: function (p) {
      p(6, 2, 8, 4, '#c87a3a'); p(6, 2, 8, 1, '#ffd8a8');
      for (var i = 0; i < 4; i++) p(6 + i * 2, 5, 1, 1, '#5a2a10');
      p(7, 6, 6, 9, '#c87a3a'); p(7, 6, 1, 9, '#ffb06a'); p(12, 6, 1, 9, '#5a2a10');
      for (var y = -1; y <= 1; y++) p(6 + Math.abs(y), 16 + y, 8 - Math.abs(y) * 2, 1, '#5aa8d8');
      p(8, 16, 2, 1, '#e8f8ff');
    },
    chercheur: function (p) {
      for (var i = 0; i < 10; i++) p(2 + i, 8, 3, 4, i % 3 ? '#9aa0aa' : '#e0e4ec');
      p(12, 7, 5, 6, '#5a5e68'); p(16, 8, 2, 4, '#5aa8d8'); p(17, 9, 1, 1, '#e8f8ff');
      p(5, 12, 2, 3, '#7a5a2a'); p(11, 12, 2, 3, '#7a5a2a'); p(4, 15, 10, 2, '#7a5a2a');
      p(7, 3, 1, 4, '#ff5a4a'); p(5, 5, 5, 1, '#ff5a4a');
    }
  };
  function cerner(x) {
    var img = x.getImageData(0, 0, IC + 2, IC + 2), d = img.data, L = IC + 2, plein = new Uint8Array(L * L), i;
    for (i = 0; i < L * L; i++) plein[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (var y = 0; y < L; y++) for (var xx = 0; xx < L; xx++) {
      i = y * L + xx;
      if (plein[i]) continue;
      for (var k = 0; k < 4; k++) {
        var nx = xx + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
        if (nx < 0 || ny < 0 || nx >= L || ny >= L || !plein[ny * L + nx]) continue;
        d[i * 4] = 16; d[i * 4 + 1] = 12; d[i * 4 + 2] = 10; d[i * 4 + 3] = 255;
        break;
      }
    }
    x.putImageData(img, 0, 0);
  }
  var toiles = {}, urls = {};
  function toile(id) {
    if (toiles[id]) return toiles[id];
    var c = document.createElement('canvas');
    c.width = IC + 2; c.height = IC + 2;
    var x = c.getContext('2d');
    if (!x) return c;
    x.imageSmoothingEnabled = false;
    DESSINS[id](function (px, py, w, h, col) { x.fillStyle = col; x.fillRect(px + 1, py + 1, w, h); });
    cerner(x);
    toiles[id] = c;
    return c;
  }
  function url(id) { return urls[id] || (urls[id] = toile(id).toDataURL('image/png')); }
  function img(id, cls) {
    var i = el('img', cls || 'ofr-ic');
    i.src = url(id); i.alt = ''; i.draggable = false;
    return i;
  }

  // ==========================================================
  //  La cache, sur la carte
  // ==========================================================
  // Au milieu d'un anneau de roche ou de cristal (deux cases d'epaisseur),
  // ou simplement dans un recoin, loin de l'arrivee. Toujours au meme
  // endroit pour un meme monde.
  function preparer(g, a) {
    var f = PAR_MONDE[a.id], TER = window.ODYTERRAIN;
    if (!f || !TER) return null;
    var sel = a.rang * 53 + 7, spot = null;
    if (f.barriere) spot = TER.pocheSeule(g, sel, f.barriere);
    if (!spot) spot = recoin(g, sel, TER);
    if (!spot) return null;
    return { f: f, tx: spot.x, ty: spot.y, x: (spot.x + 0.5) * TS, y: (spot.y + 0.5) * TS,
             barriere: spot.barriere || null, pris: aPiece(f.id) };
  }
  function recoin(g, sel, TER) {
    var vu = TER.accessibles(g), cand = [];
    Object.keys(vu).forEach(function (k) {
      var q = k.split(','), x = +q[0], y = +q[1];
      if (Math.abs(x - TER.DX) + Math.abs(y - TER.DY) < 34) return;
      for (var j = 0; j < 4; j++) if (!vu[(x + [1, -1, 0, 0][j]) + ',' + (y + [0, 0, 1, -1][j])]) return;
      if ((g.poches || []).some(function (p) { return Math.abs(p.x - x) + Math.abs(p.y - y) < 12; })) return;
      cand.push({ x: x, y: y, r: M.bruit(x, y, sel) });
    });
    cand.sort(function (u, v) { return u.r - v.r; });
    return cand[0] || null;
  }

  // La piece qui tourne sur elle-meme, et une colonne de lumiere doree
  // au-dessus, qu'on apercoit de loin entre les rochers.
  function extras(c, t) {
    if (!c || c.pris) return [];
    return [{
      x: c.x, y: c.y,
      dessin: function (ctx, sx, sy) {
        var ph = reduit ? 0.5 : (Math.sin(t / 400) + 1) / 2;
        var colonne = ctx.createLinearGradient(0, sy - 170, 0, sy);
        colonne.addColorStop(0, 'rgba(255,220,120,0)');
        colonne.addColorStop(1, 'rgba(255,220,120,' + (0.25 + 0.2 * ph).toFixed(2) + ')');
        ctx.fillStyle = colonne;
        ctx.fillRect(Math.round(sx - 5), Math.round(sy - 170), 10, 170);
        ctx.fillStyle = 'rgba(255,240,180,' + (0.35 + 0.3 * ph).toFixed(2) + ')';
        ctx.fillRect(Math.round(sx - 1), Math.round(sy - 170), 2, 170);
        ctx.fillStyle = 'rgba(255,220,120,.35)';
        ctx.beginPath(); ctx.ellipse(sx, sy, 12, 4, 0, 0, 6.3); ctx.fill();
        var tc = toile(c.f.id), lev = reduit ? 0 : Math.sin(t / 500) * 3;
        var sc = reduit ? 1 : Math.abs(Math.cos(t / 700));
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(Math.round(sx), Math.round(sy - 22 + lev));
        ctx.scale(Math.max(0.15, sc), 1);
        ctx.drawImage(tc, -tc.width / 2, -tc.height / 2);
        ctx.restore();
      }
    }];
  }

  // Ce que dit le bandeau pres d'une piece muree, tant qu'on ne peut pas
  // l'atteindre.
  function indice(c, chef) {
    if (!c || c.pris || !c.barriere) return null;
    if (Math.hypot(c.x - chef.x, c.y - chef.y) > 6 * TS) return null;
    if (c.barriere === 'roche' && !CR.aOutil('pioche')) return 'Quelque chose brille derrière ces rochers. Une pioche passerait.';
    if (c.barriere === 'cristal' && !CR.aOutil('foreuse')) return 'Une lueur dorée, au cœur d’un anneau de cristal. Il faudrait une foreuse.';
    return 'Quelque chose brille derrière cette paroi.';
  }

  // Une piece ramassee : elle monte au milieu de l'ecran, et l'on voit les
  // cinq emplacements du Telescope se remplir.
  function ramasser(c, chef, scene, fini) {
    if (!c || c.pris || Math.hypot(c.x - chef.x, c.y - chef.y) > 18) return false;
    c.pris = true;
    trouves()[c.f.id] = Date.now();
    CR.sauver();
    annoncer(scene, c.f, fini);
    return true;
  }

  function rangee(cls) {
    var r = el('div', cls || 'ofr-rangee');
    PIECES.forEach(function (p) {
      var s = el('span', 'ofr-place' + (aPiece(p.id) ? ' is-la' : ''));
      if (aPiece(p.id)) s.appendChild(img(p.id));
      else s.appendChild(el('em', null, '?'));
      s.title = aPiece(p.id) ? p.nom : 'Pièce manquante';
      r.appendChild(s);
    });
    return r;
  }

  function annoncer(scene, f, fini) {
    var d = el('div', 'ofr-annonce');
    d.appendChild(el('div', 'ofr-rayons'));
    var cadre = el('div', 'ofr-cadre');
    cadre.appendChild(img(f.id, 'ofr-grand'));
    d.appendChild(cadre);
    d.appendChild(el('span', 'ofr-haut', 'Fragment de télescope'));
    d.appendChild(el('strong', 'ofr-nom', f.nom));
    d.appendChild(el('p', 'ofr-txt', f.desc));
    d.appendChild(rangee());
    var n = nombre();
    d.appendChild(el('span', 'ofr-cpt', n + ' / ' + PIECES.length));
    var ok = el('button', 'ocr-btn', n >= PIECES.length ? 'Assembler' : 'Continuer');
    ok.type = 'button';
    ok.addEventListener('click', function () {
      d.classList.add('is-sortie');
      setTimeout(function () {
        d.remove();
        if (n >= PIECES.length && !DP.aLeTelescope()) assembler(scene, fini);
        else if (fini) fini();
      }, reduit ? 0 : 300);
    });
    d.appendChild(ok);
    scene.appendChild(d);
    setTimeout(function () { ok.focus(); }, 50);
  }

  // Les cinq pieces arrivent des bords, se rejoignent au centre, un eclair,
  // et c'est le Telescope.
  function assembler(scene, fini) {
    DP.prendreTelescope();
    var d = el('div', 'ofr-assemble');
    var centre = el('div', 'ofr-assemble-c');
    PIECES.forEach(function (p, i) {
      var im = img(p.id, 'ofr-assemble-p');
      im.style.setProperty('--a', (i * 72 - 90) + 'deg');
      im.style.setProperty('--i', String(i));
      centre.appendChild(im);
    });
    d.appendChild(centre);
    d.appendChild(el('div', 'ofr-assemble-eclair'));
    var tel = el('img', 'ofr-assemble-tel');
    tel.src = 'assets/items/telescope.webp';
    tel.alt = '';
    d.appendChild(tel);
    d.appendChild(el('strong', 'ofr-assemble-nom', 'Télescope'));
    d.appendChild(el('span', 'ofr-assemble-txt', 'Assemblé. Dans tes Items — et à l’œil, ici : touche T.'));
    var ok = el('button', 'ocr-btn ofr-assemble-ok', 'OK');
    ok.type = 'button';
    ok.addEventListener('click', function () {
      d.classList.add('is-sortie');
      setTimeout(function () { d.remove(); if (fini) fini(); }, reduit ? 0 : 300);
    });
    d.appendChild(ok);
    scene.appendChild(d);
    setTimeout(function () { ok.focus(); }, reduit ? 50 : 2600);
  }

  // Pour la vitrine du sac.
  function panneau() {
    var b = el('div', 'ofr-panneau');
    b.appendChild(el('span', 'ocr-titre ocr-titre--groupe', 'Fragments du télescope · ' + nombre() + ' / ' + PIECES.length));
    b.appendChild(rangee());
    return b;
  }

  // ==========================================================
  //  La visee
  // ==========================================================
  // Le ciel de la vue a la premiere personne est un panorama : un astre
  // d'azimut az (0 a 1) et de hauteur h (0 a 1) est a l'angle az * 2 pi,
  // a PHOR * h pixels au-dessus de l'horizon. La lunette reprend ce
  // repere et le grossit ZOOM fois.
  var ZOOM = 4.5;
  function rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mel(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function css(c, al) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (al == null ? 1 : al) + ')'; }

  // cfg : { astre, astres (le ciel), cible (l'astre a viser, ou null) }
  function Lunette(cfg) {
    var etoiles = [];
    for (var i = 0; i < 420; i++) {
      etoiles.push({ a: M.bruit(i, 1, 4242) * Math.PI * 2, e: M.bruit(i, 2, 4242), b: 120 + M.bruit(i, 3, 4242) * 135,
                     g: M.bruit(i, 4, 4242) < 0.06 });
    }
    var C1 = rgb(cfg.astre.ciel[0]), C2 = rgb(cfg.astre.ciel[1]), C3 = rgb(cfg.astre.ciel[2]);
    var sombre = C1[0] * 0.3 + C1[1] * 0.59 + C1[2] * 0.11 < 90;
    var verrou = 0, t0 = performance.now();

    function ecart(a, b) { var d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }

    // Dessine la vue dans la lunette. Rend la progression du verrouillage
    // (0 a 1) sur la cible, s'il y en a une.
    function dessiner(ctx, V, t, chef, dt) {
      var W = V.L, H = V.H, hor = V.hor();
      var FOV = (window.ODYFPS && window.ODYFPS.FOV) || 66 * Math.PI / 180;
      var TANGM = Math.round(H * 0.65), PHOR = (H >> 1) + TANGM + 10;
      var KX = W / FOV * ZOOM, cx = W / 2, cy = H / 2, R = Math.round(H * 0.45);
      var ouvre = reduit ? 1 : Math.min(1, (performance.now() - t0) / 350);
      R = Math.round(R * (0.6 + 0.4 * ouvre));
      function versEcran(ang, e) {
        return { x: cx + ecart(ang, chef.ang) * KX, y: cy + ((hor - e) - cy) * ZOOM };
      }

      ctx.save();
      ctx.fillStyle = '#05040a';
      ctx.fillRect(0, 0, W, H);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.clip();
      // Le ciel, ligne par ligne, puis le sol sous l'horizon.
      for (var y = cy - R; y <= cy + R; y += 2) {
        var ny = cy + (y - cy) / ZOOM, e = hor - ny;
        var col;
        if (e >= 0) {
          var k = 1 - e / PHOR;
          col = k < 0.55 ? mel(C1, C2, Math.max(0, k) / 0.55) : mel(C2, C3, (k - 0.55) / 0.45);
        } else col = mel(C3, [0, 0, 0], 0.55);
        ctx.fillStyle = css(col);
        ctx.fillRect(cx - R, y, R * 2, 2);
      }
      if (sombre) etoiles.forEach(function (s) {
        var p = versEcran(s.a, s.e * PHOR * 0.95);
        if (Math.abs(p.x - cx) > R || Math.abs(p.y - cy) > R) return;
        var tw = reduit ? 1 : 0.7 + 0.3 * Math.sin(t / 300 + s.a * 9);
        ctx.fillStyle = css([s.b, s.b, Math.min(255, s.b + 20)], tw);
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s.g ? 2 : 1, s.g ? 2 : 1);
      });
      var vise = null;
      (cfg.astres || []).forEach(function (a) {
        var p = versEcran(a.az * Math.PI * 2, PHOR * a.haut), r = a.r * ZOOM;
        if (Math.abs(p.x - cx) > R + r * 2.2 || Math.abs(p.y - cy) > R + r * 2.2) return;
        astre(ctx, p.x, p.y, r, a, t);
        if (a === cfg.cible) vise = { x: p.x, y: p.y, r: r };
      });
      // Le bord du tube : un anneau sombre, puis le laiton.
      ctx.restore();
      ctx.save();
      var g = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.65)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.fill();
      ctx.strokeStyle = '#c87a3a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, 6.3); ctx.stroke();
      ctx.strokeStyle = '#5a2a10'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R + 4, 0, 6.3); ctx.stroke();
      // Le reticule.
      ctx.strokeStyle = 'rgba(255,220,160,.55)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - R + 6, cy); ctx.lineTo(cx - 8, cy); ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + R - 6, cy);
      ctx.moveTo(cx, cy - R + 6); ctx.lineTo(cx, cy - 8); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + R - 6);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.18, 0, 6.3); ctx.stroke();
      ctx.font = 'bold 8px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255,220,160,.8)';
      ctx.textAlign = 'center';
      ctx.fillText('× ' + ZOOM.toString().replace('.', ','), cx + R * 0.72, cy + R * 0.86);

      // La cible au centre : elle se verrouille, peu a peu.
      var auCentre = vise && Math.hypot(vise.x - cx, vise.y - cy) < Math.max(R * 0.18, vise.r * 0.6);
      verrou = auCentre ? Math.min(1, verrou + dt / 2.2) : Math.max(0, verrou - dt * 1.5);
      if (verrou > 0) {
        ctx.strokeStyle = 'rgba(124,240,200,.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.18 + 4, -1.571, -1.571 + verrou * 6.283); ctx.stroke();
        ctx.fillStyle = 'rgba(124,240,200,' + (0.6 + 0.4 * Math.sin(t / 90)).toFixed(2) + ')';
        ctx.fillText(verrou < 1 ? 'VERROUILLAGE ' + Math.round(verrou * 100) + ' %' : 'SAUT', cx, cy + R * 0.18 + 16);
      }
      ctx.restore();
      ctx.textAlign = 'left';
      return verrou;
    }

    // Un astre, de pres : le disque, ses bandes, son ombre, son anneau.
    function astre(ctx, x, y, r, a, t) {
      var A = rgb(a.c1), B = rgb(a.c2 || a.c1);
      if (a.halo) {
        for (var h = 4; h >= 1; h--) { ctx.fillStyle = css(A, 0.07 * h); ctx.beginPath(); ctx.arc(x, y, r + h * r * 0.45, 0, 6.3); ctx.fill(); }
      }
      function anneau(devant) {
        if (!a.anneau) return;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(-0.25);
        ctx.beginPath();
        if (devant) ctx.rect(-r * 2.4, 0, r * 4.8, r * 2); else ctx.rect(-r * 2.4, -r * 2, r * 4.8, r * 2);
        ctx.clip();
        [[2.1, 0.8, 0.5], [1.85, 0.6, 0.85], [1.55, 0.35, 0.6]].forEach(function (q) {
          ctx.strokeStyle = css(mel(B, A, q[2] - 0.4), q[1] + 0.2);
          ctx.lineWidth = Math.max(1, r * 0.13);
          ctx.beginPath(); ctx.ellipse(0, 0, r * q[0], r * q[0] * 0.24, 0, 0, 6.3); ctx.stroke();
        });
        ctx.restore();
      }
      anneau(false);
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.clip();
      var gd = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      gd.addColorStop(0, css(mel(A, B, 0.7))); gd.addColorStop(1, css(A));
      ctx.fillStyle = gd; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      if (a.bandes) {
        for (var b = -r; b < r; b += Math.max(2, r * 0.22)) {
          ctx.fillStyle = css(mel(A, [0, 0, 0], 0.25), 0.5);
          ctx.fillRect(x - r, Math.round(y + b), r * 2, Math.max(1, Math.round(r * 0.08)));
        }
        // Une tempete qui derive lentement.
        var tx = x - r * 0.3 + (reduit ? 0 : Math.sin(t / 4000) * r * 0.2);
        ctx.fillStyle = css(mel(B, [255, 255, 255], 0.3), 0.6);
        ctx.beginPath(); ctx.ellipse(tx, y + r * 0.3, r * 0.22, r * 0.1, 0, 0, 6.3); ctx.fill();
      }
      if (a.ombre) {
        ctx.fillStyle = 'rgba(0,0,0,.42)';
        ctx.beginPath(); ctx.arc(x + r * 0.45, y + r * 0.1, r * 1.05, 0, 6.3); ctx.fill();
      }
      ctx.restore();
      anneau(true);
    }

    return { dessiner: dessiner, verrou: function () { return verrou; } };
  }

  // ==========================================================
  //  Le saut
  // ==========================================================
  // Depuis l'oeilleton : la geante grossit, les etoiles s'etirent en
  // traits, les anneaux passent au ras du visage, un blanc, puis le sol
  // d'un autre monde. "vers" est l'astre ou l'on arrive.
  function sauter(scene, cible, fini) {
    var c = el('canvas', 'ofr-saut');
    var W = 480, H = 300;
    c.width = W; c.height = H;
    scene.appendChild(c);
    var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    var DUREE = reduit ? 1200 : 4200, t0 = performance.now();
    var traits = [];
    for (var i = 0; i < 160; i++) traits.push({ a: Math.random() * 6.283, d: Math.random(), v: 0.4 + Math.random() * 0.8 });
    var A = rgb(cible.c1 || '#5a8a6a'), B = rgb(cible.c2 || '#e0f0d0');
    son();
    function image(t) {
      if (!c.isConnected) return;
      var k = Math.min(1, (t - t0) / DUREE), cx = W / 2, cy = H / 2;
      x.fillStyle = '#020208';
      x.fillRect(0, 0, W, H);
      // Les etoiles qui filent.
      var vit = Math.pow(k, 1.6);
      traits.forEach(function (s) {
        s.d += s.v * (0.004 + vit * 0.05);
        if (s.d > 1.4) s.d -= 1.4;
        var r0 = s.d * s.d * W * 0.6, r1 = r0 + 4 + vit * 60 * s.d;
        x.strokeStyle = 'rgba(220,235,255,' + Math.min(1, s.d * 1.4).toFixed(2) + ')';
        x.lineWidth = 1 + s.d * 1.2;
        x.beginPath();
        x.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0);
        x.lineTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1);
        x.stroke();
      });
      // La geante, qui enfle, et ses anneaux qui s'ouvrent vers nous.
      var r = 14 + Math.pow(k, 2.4) * W * 0.9;
      var gd = x.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      gd.addColorStop(0, css(mel(A, B, 0.7))); gd.addColorStop(1, css(A));
      x.save();
      x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.clip();
      x.fillStyle = gd; x.fillRect(cx - r, cy - r, r * 2, r * 2);
      for (var b = -r; b < r; b += Math.max(3, r * 0.18)) {
        x.fillStyle = css(mel(A, [0, 0, 0], 0.25), 0.45);
        x.fillRect(cx - r, Math.round(cy + b), r * 2, Math.max(1, r * 0.07));
      }
      x.fillStyle = 'rgba(0,0,0,.35)';
      x.beginPath(); x.arc(cx + r * 0.45, cy, r * 1.05, 0, 6.3); x.fill();
      x.restore();
      var ra = r * (1.8 + k * 2.2);
      x.save();
      x.translate(cx, cy); x.rotate(-0.25 + k * 0.4);
      for (var j = 0; j < 4; j++) {
        x.strokeStyle = css(mel(B, [255, 240, 200], j / 4), 0.7 - j * 0.12);
        x.lineWidth = Math.max(1, r * 0.1) * (1 + k * 3);
        x.beginPath(); x.ellipse(0, 0, ra * (1 - j * 0.1), ra * (1 - j * 0.1) * (0.22 + k * 0.5), 0, 0, 6.3); x.stroke();
      }
      x.restore();
      // Le blanc de l'arrivee.
      if (k > 0.78) {
        x.fillStyle = 'rgba(255,250,235,' + Math.min(1, (k - 0.78) / 0.16).toFixed(2) + ')';
        x.fillRect(0, 0, W, H);
      }
      if (k < 1) requestAnimationFrame(image);
      else { setTimeout(function () { c.remove(); }, 400); if (fini) fini(); }
    }
    requestAnimationFrame(image);
  }

  // Un souffle qui monte, et un grondement sourd sous lui.
  function son() {
    var MJ = window.MUSIQUE_JEUX, A = MJ && MJ.audio ? MJ.audio() : null;
    if (!A) return;
    var ac = A.ac, t = ac.currentTime, D = reduit ? 1.2 : 4.2;
    var b = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    b.buffer = A.bruit; b.loop = true;
    f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(5000, t + D);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + D * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.3);
    b.connect(f); f.connect(g); g.connect(A.sortie);
    b.start(t); b.stop(t + D + 0.4);
    var o = ac.createOscillator(), go = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(40, t); o.frequency.exponentialRampToValueAtTime(180, t + D);
    go.gain.setValueAtTime(0.0001, t); go.gain.exponentialRampToValueAtTime(0.08, t + D * 0.7); go.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.2);
    o.connect(go); go.connect(A.sortie);
    o.start(t); o.stop(t + D + 0.3);
  }

  window.ODYFRAG = {
    PIECES: PIECES, pourMonde: function (id) { return PAR_MONDE[id] || null; },
    aPiece: aPiece, nombre: nombre, complet: complet, url: url, img: img,
    preparer: preparer, extras: extras, indice: indice, ramasser: ramasser, panneau: panneau,
    Lunette: Lunette, sauter: sauter
  };
})();
