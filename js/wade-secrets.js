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
  //  Des langues de flamme, en mode additif, qui ondulent ; une lueur a
  //  la base ; de la fumee au-dessus.
  // ==========================================================

  function flammes(ctx, X, Y, w, h, t, graine, force) {
    if (w < 2 || h < 2 || force <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var g0 = ctx.createRadialGradient(X, Y, 0, X, Y, w * 0.9);
    g0.addColorStop(0, 'rgba(255,140,40,' + (0.35 * force).toFixed(3) + ')');
    g0.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = g0;
    ctx.fillRect(X - w, Y - w * 0.9, w * 2, w * 1.8);
    var n = 7;
    for (var i = 0; i < n; i++) {
      var k = i / (n - 1) - 0.5;
      var fx = X + k * w * 0.85 + Math.sin(t * 3.1 + i * 1.7 + graine) * w * 0.05;
      var fh = h * force * (0.45 + 0.55 * Math.abs(Math.sin(t * (4.3 + i * 0.6) + graine + i * 2.1))) * (1 - Math.abs(k) * 0.9);
      var fw = w * 0.32;
      var gr = ctx.createLinearGradient(0, Y, 0, Y - fh);
      gr.addColorStop(0, 'rgba(255,245,200,.85)');
      gr.addColorStop(0.25, 'rgba(255,170,40,.7)');
      gr.addColorStop(0.65, 'rgba(220,60,0,.35)');
      gr.addColorStop(1, 'rgba(120,10,0,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(fx - fw / 2, Y);
      ctx.quadraticCurveTo(fx - fw * 0.7, Y - fh * 0.55, fx + Math.sin(t * 7 + i) * fw * 0.4, Y - fh);
      ctx.quadraticCurveTo(fx + fw * 0.7, Y - fh * 0.55, fx + fw / 2, Y);
      ctx.fill();
    }
    ctx.restore();
    // La fumee.
    ctx.save();
    for (var j = 0; j < 4; j++) {
      var ph = (t * 0.5 + j * 0.25 + graine) % 1;
      var sy = Y - h * force * (0.8 + ph * 1.6), sx = X + Math.sin(ph * 6 + j) * w * 0.3;
      var r = w * (0.25 + ph * 0.6);
      var gs = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      gs.addColorStop(0, 'rgba(10,8,6,' + (0.35 * (1 - ph) * force).toFixed(3) + ')');
      gs.addColorStop(1, 'rgba(10,8,6,0)');
      ctx.fillStyle = gs;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    ctx.restore();
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
    function bruler(cle, cible, centre, w, h) {
      st.feux.push({ cle: cle, c: centre, w: w, h: h, t0: performance.now() / 1000, dur: 2.6, g: Math.random() * 10 });
      SON.flamme();
      setTimeout(function () {
        changer(cle, function (m) {
          if (cible.indexOf('etoile:') === 0) (m.etoiles = m.etoiles || []).push(cible.slice(7));
          else (m.brules = m.brules || []).push(cible);
        }, cle === 'bureau' ? ['base', 'lumG', 'lumD', 'noir'] : ['base']);
      }, 900);
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
        if (actuelle && et.brule) {
          var c0 = centreAffiche(cle, et.tex);
          bruler(cle, et.brule, c0.c, c0.w, c0.h);
        }
        return 'ok';
      }
      if (et.type === 'boite') {
        if (!dans(pt, et.a, et.b)) return null;
        if (actuelle && et.brule) {
          bruler(cle, et.brule, [(et.a[0] + et.b[0]) / 2, et.a[1], (et.a[2] + et.b[2]) / 2],
                 et.b[0] - et.a[0], 1.2);
        }
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
        bruler('scene', 'etoile:' + e.cle, [e.x, e.y - 0.07, 10], 0.2, 0.3);
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
        var c1 = centreAffiche(cle, 'souriez');
        bruler(cle, 'tex:souriez', c1.c, c1.w, c1.h);
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
        bruler('froid', 'id:' + touche, [(bx[0][0] + bx[1][0]) / 2, bx[0][1], (bx[0][2] + bx[1][2]) / 2],
               bx[1][0] - bx[0][0] + 0.3, 1.2);
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
      st.feux = st.feux.filter(function (f) { return t - f.t0 < f.dur; });
      st.feux.forEach(function (f) {
        if (f.cle !== cle) return;
        var u = (t - f.t0) / f.dur;
        var force = u < 0.25 ? u / 0.25 : u > 0.7 ? (1 - u) / 0.3 : 1;
        var p = R.projeter(cle, f.c), p2 = R.projeter(cle, [f.c[0], f.c[1] + f.h, f.c[2]]);
        var p3 = R.projeter(cle, [f.c[0] + (f.w || 0.5) / 2, f.c[1], f.c[2]]);
        if (!p || !p2) return;
        var hh = Math.abs(p[1] - p2[1]) * K, ww = Math.max(20, Math.abs((p3 ? p3[0] : p[0] + 30) - p[0]) * 2 * K);
        flammes(ctx, p[0] * K - off, p[1] * K, ww * 1.1, hh * 1.3, t, f.g, force);
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
            flammes(ctx, p[0] * K - off, p[1] * K, hh * 0.9, hh, t, i * 3.7, 1);
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
      flammes(x, a[0] * K - off, a[1] * K, hh * 0.9, hh, t, i * 2.3, 1);
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

  // ---------- La bonne fin ----------
  function finBonne(hote, retour) {
    init();
    DP.wadeFin && DP.wadeFin('bonne');
    R.obtenir('labo', 'base'); R.obtenir('labo', 'base', { feu: true });
    ['createur', 'createur-m1', 'createur-m2', 'createur-m3', 'createur-mf', 'logo'].forEach(image);
    ['wade', 'charlie', 'faith', 'stephen'].forEach(function (k) { image(k + '-horror'); });
    var brasier = SON.brasier();
    SON.alarme(16);
    var page = null, sons = {};
    function une(cle, f) { if (!sons[cle]) { sons[cle] = 1; f(); } }
    var MASQUES = [[6.2, 'createur-m1'], [7.8, 'createur-m2'], [9.4, 'createur-m3'], [11.0, 'createur-mf']];
    film(hote, 31.5, function (x, t, VW, VH) {
      if (t < 3.6) {
        var L = [['scene', 'CAM 01'], ['salle', 'CAM 02'], ['couloirE', 'CAM 11']];
        var i = Math.min(2, Math.floor(t / 1.2));
        camEnFeu(x, L[i][0], t, 0.6 + i * 0.3, VW, VH, L[i][1]);
        if ((t % 1.2) < 0.08) grain(x, t, 0.9, VW, VH);
      } else if (t < 4.0) {
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH); grain(x, t, 0.8, VW, VH);
      } else if (t < 15.5) {
        // CAM 06 : le laboratoire. Il ne nous a jamais vus.
        var u = t - 4, enFeu = t > 12.2;
        var r = (enFeu && R.deja('labo', 'base', { feu: true })) || R.deja('labo', 'base');
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
        if (r) {
          var K = VH / r.h, off = (r.w * K - VW) / 2;
          x.drawImage(r.canvas, -off, 0, r.w * K, r.h * K);
          var k = 'createur';
          MASQUES.forEach(function (m) { if (t >= m[0]) k = m[1]; });
          var sec = enFeu ? hasard(-6, 6) : 0;
          poser(x, 'labo', R.deja('labo', 'base'), 'createur', image(k), K, off, { dx: sec, dy: sec * 0.5 });
          // Le marteau, avant les masques : un eclat sur l'etabli.
          if (t < 6.2) {
            var coup = Math.floor(u / 0.45);
            une('m' + coup, function () { SON.marteau(); });
            if ((u % 0.45) < 0.06) {
              var pe = R.projeter('labo', [0.2, 0.95, 3.8]);
              x.save(); x.globalCompositeOperation = 'lighter';
              for (var s = 0; s < 14; s++) {
                x.fillStyle = 'rgba(255,' + Math.round(180 + Math.random() * 70) + ',80,.9)';
                x.fillRect(pe[0] * K - off + hasard(-30, 30), pe[1] * K + hasard(-30, 6), 2, 2);
              }
              x.restore();
            }
          }
          MASQUES.forEach(function (m, i) {
            if (t >= m[0] && t < m[0] + 0.12) {
              une('masque' + i, function () { SON.marteau(); SON.servo(0.8); SON.regard(); });
              x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(0, 0, VW, VH);
            }
          });
          if (enFeu) {
            une('feuLabo', function () { SON.flamme(); SON.explosion(); });
            var k2 = Math.min(1, (t - 12.2) / 2);
            x.globalCompositeOperation = 'multiply';
            x.fillStyle = 'rgb(255,' + Math.round(255 - k2 * 110) + ',' + Math.round(255 - k2 * 170) + ')';
            x.fillRect(0, 0, VW, VH);
            x.globalCompositeOperation = 'source-over';
            R.SCENES.labo.flammes.forEach(function (f, i) {
              var a = R.projeter('labo', [f[0], f[1], f[2]]), b = R.projeter('labo', [f[0], f[1] + f[3] * k2, f[2]]);
              if (!a || !b) return;
              var hh = Math.abs(a[1] - b[1]) * K;
              flammes(x, a[0] * K - off, a[1] * K, hh * 0.9 + 10, hh, t, i * 2.9, k2);
            });
            // Le feu gagne tout le bas de l'image.
            for (var fi = 0; fi < 7; fi++) flammes(x, VW * (fi + 0.5) / 7, VH + 20, 260, 260 + k2 * 260, t, fi * 1.3, k2);
          }
        }
        x.globalCompositeOperation = 'saturation';
        x.fillStyle = 'rgba(128,128,128,.3)'; x.fillRect(0, 0, VW, VH);
        x.globalCompositeOperation = 'source-over';
        grain(x, t, 0.1 + (t > 14.5 ? (t - 14.5) : 0), VW, VH);
        vignette(x, VW, VH, 0.9);
        x.fillStyle = '#f4f4f0'; x.font = 'bold 26px Consolas, monospace'; x.textAlign = 'left';
        x.fillText('CAM 06  LABORATOIRE', 40, 60);
        if (t > 14.8) { x.fillStyle = 'rgba(255,170,60,' + ((t - 14.8) / 0.7).toFixed(2) + ')'; x.fillRect(0, 0, VW, VH); }
      } else if (t < 18.5) {
        var L2 = [['comptoir', 'CAM 03'], ['boutique', 'CAM 05'], ['coinO', 'CAM 10']];
        var j = Math.min(2, Math.floor((t - 15.5) / 1));
        camEnFeu(x, L2[j][0], t, 1.4, VW, VH, L2[j][1]);
        if (t > 18) { x.fillStyle = 'rgba(255,220,160,' + ((t - 18) / 0.5).toFixed(2) + ')'; x.fillRect(0, 0, VW, VH); }
      } else if (t < 26) {
        une('finBrasier', function () { brasier.arreter(2); });
        if (!page) page = journal(x, VW, VH, 'LA MAISON DU BURGER PART EN FUMÉE',
          'Un incendie a ravagé le restaurant de Wade and Friends dans la nuit.',
          'Les pompiers de SST-03 ont lutté jusqu’à l’aube contre les flammes. Du bâtiment, il ne reste que des murs noircis. ' +
          'Le gardien de nuit, sain et sauf, n’a pas souhaité s’exprimer. Les enquêteurs s’interrogent sur une pièce ' +
          'inconnue des plans, derrière la cuisine, où ils disent avoir retrouvé des établis, des outils, et des dessins de masques. ' +
          'Le propriétaire des lieux reste introuvable. Les quatre animatroniques de l’établissement n’ont pas été retrouvés intacts.',
          image('logo'));
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
        var kb = t < 22.5 ? 0 : Math.min(1, (t - 22.5) / 3);
        if (kb > 0) une('feuJournal', function () { SON.flamme(); });
        x.save();
        x.globalAlpha = Math.min(1, (t - 18.5) / 0.6);
        x.translate(VW / 2, VH / 2 + 10); x.rotate(-0.025);
        x.drawImage(brulure(page, kb, 1.7), -410, -300);
        x.restore();
        if (kb > 0 && kb < 1) {
          // Les braises qui montent de la page.
          x.save(); x.globalCompositeOperation = 'lighter';
          for (var e2 = 0; e2 < 30; e2++) {
            var ex = VW / 2 - 400 + Math.random() * 800, ey = VH / 2 + 300 - kb * 640 + hasard(-40, 40);
            x.fillStyle = 'rgba(255,' + Math.round(120 + Math.random() * 100) + ',30,.8)';
            x.fillRect(ex, ey - Math.random() * 120, 2, 2);
          }
          x.restore();
        }
        grain(x, t, 0.05, VW, VH);
      } else if (t < 27.5) {
        x.fillStyle = '#000'; x.fillRect(0, 0, VW, VH);
      } else {
        tetes(x, t - 27.5, VW, VH, false);
        noir(x, 1 - (t - 27.5) / 2, VW, VH);
        titreFin(x, 'Good Ending', (t - 29.5) / 1.5, VW, 'rgba(255,200,120,.6)');
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
