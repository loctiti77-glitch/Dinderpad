// Le combat contre Azhrakonr, au bout de la balise lointaine.
//
// Les animations du boss viennent de la maquette fournie (assets/Azhrakon
// Boss Fight.html) : la respiration, la Convergence, la Salve stellaire, le
// Regard du neant, l'Effondrement, le coup recu, l'Eveil cosmique a mi-vie
// et la Chute, qui le desintegre. Ici s'y ajoute le joueur : son premier
// Dinder, en bas de l'arene, qui court, saute et tire.
//
// Chaque attaque se lit avant de toucher, et chacune s'esquive d'une seule
// facon : s'ecarter des points d'impact de la Salve, sauter par-dessus le
// rayon quand il passe, sauter quand l'onde de l'Effondrement arrive. Le
// boss a beaucoup de vie, le joueur tres peu : c'est voulu.
(function () {
  var DP = window.DP;
  if (!DP) return;

  var W = 1536, H = 1024;
  // La ligne ou se tient le joueur : assez haut pour rester visible quand
  // l'arene, en plein ecran, rogne le bas de la toile.
  var SOL = H * 0.8;
  var SON = null;                          // les sons, branches au lancement
  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Les reglages de la difficulte.
  var REGLES = {
    pvBoss: 170,                           // ~200 tirs au bout
    degat: 1, degatRage: 0.8,
    pvJoueur: 4, invulnerable: 1.3,
    cadence: 0.2,                          // secondes entre deux tirs
    vitesse: 820, saut: 1320, gravite: 3700
  };

  // Les points du sprite (1536 x 1024), comme dans la maquette.
  var P = { visor: [770, 340], chest: [800, 602], belt: [790, 868], lHand: [370, 760], rHand: [1170, 760],
            pivot: [768, 1024] };
  var SPR_Y = 40;

  var spriteBoss = null;
  function chargerBoss(fn) {
    if (spriteBoss) return fn(spriteBoss);
    var im = new Image();
    im.onload = function () {
      var mk = function (f) {
        var c = document.createElement('canvas'); c.width = W; c.height = H;
        var x = c.getContext('2d'); x.drawImage(im, 0, 0, W, H); f(x); return c;
      };
      spriteBoss = {
        img: im,
        blanc: mk(function (x) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); }),
        rouge: mk(function (x) {
          x.globalCompositeOperation = 'color'; x.fillStyle = '#ff1f4a'; x.fillRect(0, 0, W, H);
          x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0, W, H);
        })
      };
      fn(spriteBoss);
    };
    im.src = 'assets/items/azhrakonr-boss.webp';
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  // opts : { hote, victoire(), fuite() }
  function lancer(opts) {
    var hote = opts.hote;
    SON = window.AZHRAKONR_SON || null;
    if (SON) SON.pret();
    var box = el('div', 'azb');
    var stage = el('div', 'azb-stage');
    var cv = el('canvas', 'azb-cv');
    cv.width = W; cv.height = H;
    stage.appendChild(cv);

    // Le bandeau du boss.
    var hud = el('div', 'azb-hud');
    var plaque = el('div', 'azb-plaque');
    plaque.appendChild(el('span', 'azb-nom', 'AZHRAKONR'));
    var phase = el('span', 'azb-phase', 'Phase I · Le Veilleur');
    plaque.appendChild(phase);
    hud.appendChild(plaque);
    var barre = el('div', 'azb-barre');
    var retard = el('i', 'azb-retard'), vie = el('i', 'azb-vie');
    barre.appendChild(retard); barre.appendChild(vie); barre.appendChild(el('span', 'azb-mi'));
    hud.appendChild(barre);
    var coup = el('span', 'azb-coup', '—');
    hud.appendChild(coup);
    stage.appendChild(hud);

    // Les coeurs du joueur.
    var coeurs = el('div', 'azb-coeurs');
    stage.appendChild(coeurs);

    var banniere = el('div', 'azb-banniere');
    stage.appendChild(banniere);

    // Les commandes a l'ecran, pour le tactile : a gauche une croix qui
    // suit le pouce — on glisse de gauche a droite sans lever le doigt —,
    // a droite sauter et tirer. Chaque doigt est suivi a part : on peut
    // courir, sauter et tirer en meme temps.
    var cmd = el('div', 'azb-cmd');
    var touches = {};
    cmd.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

    var pad = el('div', 'azb-pad');
    pad.setAttribute('aria-hidden', 'true');
    var padG = el('span', 'azb-pad-g', '◀'), padD = el('span', 'azb-pad-d', '▶');
    pad.appendChild(padG); pad.appendChild(padD);
    var doigtPad = null;
    function suivrePad(ev) {
      var r = pad.getBoundingClientRect();
      var k = (ev.clientX - r.left) / Math.max(1, r.width);
      // Une petite zone morte au milieu : le pouce pose au centre ne
      // fait pas avancer.
      touches.g = k < 0.44;
      touches.d = k > 0.56;
      padG.classList.toggle('is-on', !!touches.g);
      padD.classList.toggle('is-on', !!touches.d);
    }
    function lacherPad() {
      doigtPad = null;
      touches.g = touches.d = false;
      padG.classList.remove('is-on'); padD.classList.remove('is-on');
    }
    pad.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      doigtPad = ev.pointerId;
      try { pad.setPointerCapture(ev.pointerId); } catch (e) {}
      suivrePad(ev);
    });
    pad.addEventListener('pointermove', function (ev) { if (ev.pointerId === doigtPad) suivrePad(ev); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
      pad.addEventListener(t, function (ev) { if (ev.pointerId === doigtPad) lacherPad(); });
    });
    cmd.appendChild(pad);

    function bouton(cls, txt, cle) {
      var b = el('button', 'azb-btn ' + cls, txt);
      b.type = 'button';
      b.tabIndex = -1;
      b.addEventListener('pointerdown', function (ev) {
        ev.preventDefault();
        try { b.setPointerCapture(ev.pointerId); } catch (e) {}
        touches[cle] = true;
        b.classList.add('is-on');
        if (cle === 'saut') sauter();
        if (cle === 'tir') tirer();
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
        b.addEventListener(t, function () { touches[cle] = false; b.classList.remove('is-on'); });
      });
      cmd.appendChild(b);
      return b;
    }
    bouton('azb-btn--saut', 'SAUT', 'saut');
    bouton('azb-btn--tir', 'TIR', 'tir');
    cmd.appendChild(el('span', 'azb-tourner', '↻ Plus grand à l’horizontale'));
    stage.appendChild(cmd);
    box.appendChild(stage);
    hote.appendChild(box);

    var ctx = cv.getContext('2d');

    // ---------- L'etat ----------
    var regles = REGLES;
    var hp, rage, mort, rageAmt, spriteAlpha;
    var state, parts, projs, rings, beams, tirs, marques;
    var shake = 0, flash = 0, flashCol = '255,255,255', hurt = 0;
    var tf = { x: 0, y: 0, s: 1, sy: 1, r: 0 };
    var patIdx = 0, idleWait = 1.5;
    var fini = false, perdu = false, anim = 0;
    var bg = [];
    for (var i = 0; i < 160; i++) bg.push({ x: Math.random() * W, y: Math.random() * H * 0.8, r: Math.random() * 1.6 + 0.3, p: Math.random() * 6 });

    var heros = DP.owned()[0] || 'their-creator';
    // Le joueur : l'illustration en pied de son premier Dinder, pas le
    // sprite en gros pixels.
    var imHeros = new Image();
    imHeros.src = DP.dinderFull(heros);
    var joueur;

    var MOVES = { idle: '—', charge: 'Convergence', palms: 'Salve stellaire', beam: 'Regard du néant',
                  slam: 'Effondrement', hit: 'Touché !', rage: 'Éveil cosmique', death: 'Chute' };
    var DUR = { charge: 1.6, palms: 2.2, beam: 2.8, slam: 2.3, hit: 0.35, rage: 3.2, death: 8.4 };
    var PATTERN = ['charge', 'palms', 'beam', 'palms', 'slam', 'beam', 'charge', 'slam'];

    function initialiser() {
      hp = regles.pvBoss; rage = false; mort = false; rageAmt = 0; spriteAlpha = 1;
      parts = []; projs = []; rings = []; beams = []; tirs = []; marques = [];
      state = { name: 'idle', t: 0, dur: Infinity, fired: 0, flag: {} };
      patIdx = 0; idleWait = 2.2; perdu = false;
      joueur = { x: W / 2, h: 0, vy: 0, pv: regles.pvJoueur, invu: 0, tir: 0, dir: 1, course: 0, pas: 0, ecrase: 0 };
      if (SON) SON.musiqueDebut();
      box.classList.remove('is-rage');
      phase.textContent = 'Phase I · Le Veilleur';
      majVie(); majCoeurs();
    }

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function accent() { return rage ? '255,70,110' : '90,210,255'; }
    function accent2() { return rage ? '255,180,120' : '190,240,255'; }

    function annoncer(t, s, ms) {
      banniere.textContent = '';
      if (!t) { banniere.classList.remove('is-on'); return; }
      banniere.appendChild(el('strong', null, t));
      if (s) banniere.appendChild(el('small', null, s));
      banniere.classList.add('is-on');
      clearTimeout(banniere._t);
      if (ms !== 0) banniere._t = setTimeout(function () { banniere.classList.remove('is-on'); }, ms || 2200);
    }
    function majVie() {
      var k = Math.max(0, hp / regles.pvBoss);
      vie.style.transform = 'scaleX(' + k + ')';
      retard.style.transform = 'scaleX(' + k + ')';
    }
    function majCoeurs() {
      coeurs.textContent = '';
      for (var c = 0; c < regles.pvJoueur; c++) {
        coeurs.appendChild(el('span', 'azb-coeur' + (c < joueur.pv ? '' : ' is-vide'), '♥'));
      }
    }

    function setState(n) {
      if (mort && n !== 'death') return;
      if (state.name === 'rage' && n !== 'death' && state.t < DUR.rage) return;
      if (state.name === 'death') return;
      state = { name: n, t: 0, dur: DUR[n] != null ? DUR[n] : Infinity, fired: 0, flag: {} };
      coup.textContent = MOVES[n] || '—';
      if (SON) {
        SON.rayon(false);
        if (n === 'charge') SON.charge();
        // Il rugit a chaque attaque.
        if (n === 'charge' || n === 'palms' || n === 'beam' || n === 'slam') SON.rugir('attaque');
        if (n === 'rage') { SON.rage(); SON.rugir('rage'); SON.musiqueRage(); }
        if (n === 'death') SON.mort();
      }
      if (n === 'rage') {
        rage = true; box.classList.add('is-rage');
        phase.textContent = 'Phase II · Le Dévoreur';
        annoncer('ÉVEIL COSMIQUE', 'Azhrakonr libère sa vraie puissance');
      }
      if (n === 'death') { mort = true; hp = 0; majVie(); annoncer(''); }
    }

    function world(p) {
      var x = p[0] - P.pivot[0], y = p[1] - P.pivot[1];
      x *= tf.s; y *= tf.s * tf.sy;
      var c = Math.cos(tf.r), s = Math.sin(tf.r);
      return [P.pivot[0] + tf.x + x * c - y * s, P.pivot[1] + SPR_Y + tf.y + x * s + y * c];
    }
    function part(o) {
      parts.push(Object.assign({ vx: 0, vy: 0, life: 1, max: 1, size: 3, col: '160,230,255', drag: 0.98, g: 0, add: true }, o));
    }
    function burst(x, y, n, col, sp) {
      for (var k = 0; k < n; k++) {
        var a = Math.random() * 6.28, v = rnd(2, sp);
        part({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(0.4, 0.9), max: 0.9, size: rnd(2, 5), col: col });
      }
    }

    // ---------- Le joueur ----------
    function sauter() {
      if (fini || perdu || joueur.h > 2) return;
      joueur.vy = regles.saut;
      joueur.ecrase = -0.12;
    }

    function blesser() {
      if (joueur.invu > 0 || fini || perdu || mort) return;
      joueur.pv--;
      joueur.invu = regles.invulnerable;
      flash = Math.max(flash, 0.45); flashCol = '255,40,70'; shake = Math.max(shake, 24);
      burst(joueur.x, SOL - joueur.h - 60, 30, '255,90,110', 10);
      majCoeurs();
      if (SON) SON.blesse();
      box.classList.remove('is-touche'); void box.offsetWidth; box.classList.add('is-touche');
      if (joueur.pv <= 0 && !mort) perdre();
    }

    function tirer() {
      if (fini || perdu || mort || joueur.tir > 0) return;
      joueur.tir = regles.cadence;
      var c = world(P.chest);
      tirs.push({ x: joueur.x + joueur.dir * 30, y: SOL - joueur.h - 200, tx: c[0] + rnd(-120, 120), ty: c[1] + rnd(-160, 60), t: 0, trace: [] });
      if (SON) SON.tir();
    }

    function toucherBoss() {
      // Une fois le joueur tombe, plus rien ne l'atteint.
      if (mort || perdu || state.name === 'death') return;
      hp = Math.max(0, hp - (rage ? regles.degatRage : regles.degat));
      majVie();
      if (SON) { SON.impact(); SON.rugir('douleur'); }
      // Un eclat bref a chaque impact : en tirant sans arret, il ne doit
      // pas virer au blanc.
      hurt = Math.max(hurt, 0.22); shake = Math.max(shake, 5);
      var c = world(P.chest);
      burst(c[0] + rnd(-120, 120), c[1] + rnd(-140, 60), 10, rage ? '255,90,120' : '160,230,255', 7);
      if (hp <= 0) { setTimeout(function () { setState('death'); }, 300); }
      else if (hp <= regles.pvBoss / 2 && !rage && state.name !== 'rage') {
        setTimeout(function () { if (!mort) setState('rage'); }, 300);
      }
    }

    // ---------- La logique du boss (reprise de la maquette) ----------
    function logic(dt) {
      var S = state; S.t += dt;
      var t = S.t, k = t / S.dur;
      var spd = rage ? 1.6 : 1;
      var x = 0, y = 0, s = 1, sy = 1, r = 0;
      var T = performance.now() / 1000 * spd;
      y += Math.sin(T * 1.7) * 7; sy += Math.sin(T * 1.7 + 1) * 0.006; r += Math.sin(T * 0.8) * 0.006;

      switch (S.name) {
        case 'idle':
          if (!mort && !perdu) {
            idleWait -= dt * (rage ? 1.6 : 1);
            // Entre deux attaques, il gronde.
            if (SON && Math.random() < dt / 2.5) SON.rugir('grogne');
            if (idleWait <= 0) { setState(PATTERN[patIdx++ % PATTERN.length]); idleWait = rage ? 0.45 : 0.9; }
          }
          break;
        case 'charge': {
          var e = Math.sin(Math.PI * clamp(k, 0, 1));
          s += e * 0.025; y += e * 14; shake = Math.max(shake, e * 3);
          [P.lHand, P.rHand].forEach(function (h) {
            var w = world(h);
            for (var q = 0; q < (rage ? 5 : 3); q++) {
              var a = Math.random() * 6.28, d = rnd(160, 320);
              part({ x: w[0] + Math.cos(a) * d, y: w[1] + Math.sin(a) * d, tx: w[0], ty: w[1], conv: true, life: 0.6, max: 0.6, size: rnd(2, 4), col: accent2() });
            }
          });
          break;
        }
        case 'palms': {
          if (t < 0.35) { var e1 = ease(t / 0.35); s += e1 * 0.03; y -= e1 * 16; }
          else { var e2 = 1 - ease(clamp((t - 0.35) / 1.6, 0, 1)); s += e2 * 0.03; y -= e2 * 16; x += Math.sin(t * 30) * e2 * 3; }
          var n = rage ? 10 : 6, gap = 1.3 / n;
          while (S.fired < n && t > 0.4 + S.fired * gap) {
            var h = S.fired % 2 ? P.rHand : P.lHand, w = world(h);
            // Chaque projectile vise ou se tient le joueur, a peu pres : il
            // faut bouger pendant toute la salve.
            var vise = clamp(joueur.x + rnd(-1, 1) * (rage ? 70 : 110), W * 0.08, W * 0.92);
            projs.push({ sx: w[0], sy: w[1], tx: vise, ty: SOL, z: 0, spd: rnd(0.9, 1.15) * (rage ? 1.35 : 1) });
            burst(w[0], w[1], 14, accent2(), 7); shake = Math.max(shake, 4); S.fired++;
            if (SON) SON.salve();
          }
          break;
        }
        case 'beam': {
          // Le rayon balaie le sol ; en rage, il revient en sens inverse.
          var balaye = rage ? 1.1 : 1.3;
          if (t < 1) {
            var eb = ease(t); s += eb * 0.02; r += -eb * 0.03; y += eb * 8;
            var v = world(P.visor);
            for (var q2 = 0; q2 < 4; q2++) {
              var a2 = Math.random() * 6.28, d2 = rnd(120, 300);
              part({ x: v[0] + Math.cos(a2) * d2, y: v[1] + Math.sin(a2) * d2, tx: v[0], ty: v[1], conv: true, life: 0.5, max: 0.5, size: rnd(1.5, 3.5), col: accent2() });
            }
            if (S.sens == null) S.sens = Math.random() < 0.5 ? 1 : -1;
          } else if (t < 1 + balaye * (rage ? 2 : 1)) {
            var u = ((t - 1) % balaye) / balaye;
            var aller = rage && t - 1 > balaye ? -S.sens : S.sens;
            var ux = aller > 0 ? u : 1 - u;
            r = -0.03 + ux * 0.06; y += 8; x += Math.sin(t * 50) * 2; s += 0.02;
            S.aim = [W * (0.08 + ux * 0.84), SOL];
            if (SON && !S.flag.son) { S.flag.son = 1; SON.rayon(true); }
            shake = Math.max(shake, 7);
            if (Math.random() < 0.9) part({ x: S.aim[0] + rnd(-30, 30), y: S.aim[1], vx: rnd(-4, 4), vy: rnd(-9, -3), g: 0.25, life: 0.8, max: 0.8, size: rnd(2, 5), col: accent2() });
            // Le rayon brule ce qui reste au sol.
            if (Math.abs(S.aim[0] - joueur.x) < 60 && joueur.h < 95) blesser();
          } else { S.aim = null; if (SON && S.flag.son) { S.flag.son = 0; SON.rayon(false); } var e3 = 1 - ease(clamp((t - 1 - balaye * (rage ? 2 : 1)) / 0.5, 0, 1)); r = 0.03 * e3; s += 0.02 * e3; }
          if (rage) S.dur = 1 + balaye * 2 + 0.5;
          break;
        }
        case 'slam': {
          if (t < 0.8) { var es = ease(t / 0.8); y -= es * 70; s += es * 0.06; sy += es * 0.02; }
          else if (t < 1) { var us = (t - 0.8) / 0.2; y = -70 + us * us * 115; s += 0.06 * (1 - us); sy -= us * 0.05; }
          else {
            var ef = 1 - ease(clamp((t - 1) / 1.1, 0, 1)); y += 45 * ef; sy -= 0.05 * ef;
            if (!S.flag.hit) {
              S.flag.hit = 1; shake = 34; flash = 0.35; flashCol = accent();
              if (SON) SON.effondrement();
              var nr = rage ? 5 : 3;
              for (var ri = 0; ri < nr; ri++) rings.push({ x: W / 2, y: SOL + 20, r: 40 + ri * 30, v: 1500 - ri * (rage ? 160 : 300), life: 1, w: 20 - ri * 3, sol: true });
              for (var pi = 0; pi < 70; pi++) part({ x: rnd(W * 0.2, W * 0.8), y: H * 0.95, vx: rnd(-7, 7), vy: rnd(-22, -8), g: 0.6, drag: 0.99, life: rnd(0.8, 1.4), max: 1.4, size: rnd(3, 7), col: accent2() });
              for (var pj = 0; pj < (rage ? 40 : 24); pj++) part({ x: rnd(0, W), y: rnd(-200, 0), vx: rnd(-1, 1), vy: rnd(14, 24), drag: 1, life: 1.5, max: 1.5, size: rnd(2, 4), col: '255,255,255', streak: true });
            }
          }
          break;
        }
        case 'hit': { var eh = 1 - k; x += Math.sin(t * 60) * 16 * eh; r += 0.025 * eh; s -= 0.015 * eh; y += 6 * eh; break; }
        case 'rage': {
          var er = clamp(t / 2.2, 0, 1); shake = Math.max(shake, 4 + er * 16); x += Math.sin(t * 70) * 6 * er; s += er * 0.04; y -= er * 20;
          rageAmt = Math.min(1, er * 1.1);
          var cr = world(P.chest);
          if (Math.random() < 0.8) part({ x: cr[0] + rnd(-500, 500), y: cr[1] + rnd(-200, 400), vy: rnd(-6, -2), vx: rnd(-1, 1), life: 1, max: 1, size: rnd(3, 7), col: '255,70,110' });
          if (t > 2.2 && !S.flag.roar) {
            S.flag.roar = 1; flash = 0.6; flashCol = '255,60,100'; shake = 40;
            rings.push({ x: cr[0], y: cr[1], r: 60, v: 1800, life: 1, w: 30 });
            rings.push({ x: cr[0], y: cr[1], r: 20, v: 1200, life: 1, w: 16 });
            burst(cr[0], cr[1], 90, '255,120,140', 22);
          }
          if (t > 2.2) { var e4 = 1 - ease((t - 2.2) / 1); s += 0.04 * e4; y -= 20 * e4; }
          break;
        }
        case 'death': {
          // Il vacille ; une faille se dechire derriere lui, l'aspire en le
          // faisant tournoyer, puis se referme dans une explosion.
          if (!S.faille) {
            var c0 = world(P.chest), dents = [];
            for (var di = 0; di <= 26; di++) dents.push(rnd(-1, 1));
            S.faille = { x: c0[0], y: c0[1] - 40, ouv: 0, c0: c0, dents: dents };
            S.rays = [];
          }
          var F = S.faille;
          if (t < 1.6) {
            var ed = Math.min(1, t / 1.6); shake = Math.max(shake, 6 + ed * 16);
            x += Math.sin(t * 55) * 10 * ed; r += Math.sin(t * 3) * 0.03 * ed; sy -= ed * 0.03;
            if (S.rays.length < 10 && Math.random() < 0.5) S.rays.push({ a: Math.random() * 6.28, w: rnd(0.04, 0.12) });
            if (Math.random() < 0.4) { var cd = world(P.chest); burst(cd[0] + rnd(-300, 300), cd[1] + rnd(-300, 300), 6, accent2(), 6); }
          }
          if (t > 1 && !S.flag.faille) { S.flag.faille = 1; flash = 0.45; flashCol = '200,170,255'; if (SON) SON.faille(); }
          if (t > 1 && t < 5) F.ouv = ease(clamp((t - 1) / 1, 0, 1)) * (1 + 0.05 * Math.sin(t * 31));
          if (t >= 1.6 && t < 5) {
            if (!S.flag.asp) { S.flag.asp = 1; S.rays = null; if (SON) SON.aspiration(); }
            var ea = Math.pow(clamp((t - 1.6) / 3.4, 0, 1), 1.6);
            s = Math.max(0.01, 1 - ea * 0.99); sy = 1 + ea * 0.5; r = ea * 2.6;
            // Sa poitrine glisse jusqu'au coeur de la faille.
            var cx2 = F.c0[0] + (F.x - F.c0[0]) * ea, cy2 = F.c0[1] + (F.y - F.c0[1]) * ea;
            var ddx = (P.chest[0] - P.pivot[0]) * s, ddy = (P.chest[1] - P.pivot[1]) * s * sy, co = Math.cos(r), si = Math.sin(r);
            x = cx2 - P.pivot[0] - (ddx * co - ddy * si);
            y = cy2 - P.pivot[1] - SPR_Y - (ddx * si + ddy * co);
            spriteAlpha = 1 - clamp((ea - 0.85) / 0.15, 0, 1);
            shake = Math.max(shake, 6 + ea * 14);
            // Tout ce qui flotte est aspire avec lui.
            for (var q = 0; q < 4; q++) {
              var aa = Math.random() * 6.28, dd = rnd(250, 950);
              part({ x: F.x + Math.cos(aa) * dd, y: F.y + Math.sin(aa) * dd * 0.7, conv: true, tx: F.x, ty: F.y,
                     life: 0.7, max: 0.7, size: rnd(2, 5), col: Math.random() < 0.5 ? accent2() : '200,150,255' });
            }
          }
          if (t >= 5 && !S.flag.boom) {
            S.flag.boom = 1; spriteAlpha = 0; flash = 1; flashCol = '255,255,255'; shake = 60;
            rings.push({ x: F.x, y: F.y, r: 30, v: 2600, life: 1, w: 46 });
            rings.push({ x: F.x, y: F.y, r: 10, v: 1500, life: 1, w: 26 });
            rings.push({ x: F.x, y: SOL + 18, r: 40, v: 2000, life: 1, w: 30 });
            burst(F.x, F.y, 260, '255,255,255', 34);
            burst(F.x, F.y, 220, '200,150,255', 24);
            burst(F.x, F.y, 160, accent(), 16);
            if (SON) SON.explosion();
          }
          // L'explosion la fait flamboyer, puis elle se referme.
          if (t >= 5) F.ouv = t < 5.12 ? 1.7 : Math.max(0, 1.7 * (1 - (t - 5.12) / 0.5));
          if (t > 6.1 && !S.flag.ban) { S.flag.ban = 1; annoncer('VAINCU', 'Azhrakonr s’est enfui dans la faille', 0); }
          if (t > 8.2 && !S.flag.fin) { S.flag.fin = 1; gagner(); }
          break;
        }
      }
      if (S.t >= S.dur && S.name !== 'death') {
        if (S.name === 'rage') state = { name: 'idle', t: 0, dur: Infinity, fired: 0, flag: {} };
        setState('idle');
      }
      if (rage && !mort) {
        var c2 = world(P.chest);
        if (Math.random() < 0.5) part({ x: c2[0] + rnd(-480, 480), y: c2[1] + rnd(-100, 450), vy: rnd(-5, -2), vx: rnd(-0.5, 0.5), life: 1, max: 1, size: rnd(2, 6), col: Math.random() < 0.5 ? '255,60,100' : '255,170,90', drag: 0.99 });
      }
      if (!mort && Math.random() < 0.35) part({ x: rnd(W * 0.15, W * 0.85), y: H + 10, vy: rnd(-3, -1), life: 2.5, max: 2.5, size: rnd(1, 2.5), col: accent2(), drag: 1 });
      tf = { x: x, y: y, s: s, sy: sy, r: r };
    }

    // La faille : une dechirure verticale aux bords dentes, un vide noir
    // pique d'etoiles, un liseré blanc et un halo violet.
    function dessinerFaille(F, T) {
      var Hf = 1000, n = F.dents.length - 1, larg = 320 * F.ouv;
      function bord(cote) {
        var pts = [];
        for (var i = 0; i <= n; i++) {
          var u = i / n, y = F.y - Hf / 2 + u * Hf;
          var w = larg * Math.pow(Math.sin(Math.PI * u), 0.8) * (0.75 + 0.25 * F.dents[i] * cote);
          pts.push([F.x + cote * w / 2 + F.dents[(i + 3) % (n + 1)] * 14 * F.ouv, y]);
        }
        return pts;
      }
      var g = bord(-1), d = bord(1).reverse();
      function chemin() { ctx.beginPath(); g.concat(d).forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); }
      ctx.globalCompositeOperation = 'lighter';
      glow(F.x, F.y, 260 + 420 * Math.min(1.5, F.ouv), '170,90,255', 0.35 * Math.min(1, F.ouv));
      glow(F.x, F.y, 120 + 200 * Math.min(1.5, F.ouv), '255,255,255', 0.18 * Math.min(1, F.ouv));
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      chemin();
      ctx.fillStyle = '#05010e'; ctx.fill();
      ctx.clip();
      // Le vide, de l'autre cote : des etoiles qui tournent lentement.
      for (var k = 0; k < 40; k++) {
        var a = k * 2.399 + T * 0.6, rr = (k * 37) % 400;
        ctx.fillStyle = 'rgba(220,200,255,' + (0.4 + 0.6 * Math.abs(Math.sin(T * 3 + k))) + ')';
        ctx.fillRect(F.x + Math.cos(a) * rr * 0.5, F.y + Math.sin(a) * rr, 2.5, 2.5);
      }
      ctx.restore();
      ctx.save();
      chemin();
      ctx.shadowColor = 'rgba(190,130,255,1)'; ctx.shadowBlur = 40;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.75 + 0.25 * Math.sin(T * 40)) + ')';
      ctx.lineWidth = 3 + 4 * Math.min(1, F.ouv);
      ctx.stroke();
      ctx.restore();
    }

    // ---------- Le joueur, chaque image ----------
    function avancerJoueur(dt) {
      if (perdu || fini) return;
      var dir = (touches.d ? 1 : 0) - (touches.g ? 1 : 0);
      if (dir) joueur.dir = dir;
      joueur.course += ((dir ? 1 : 0) - joueur.course) * Math.min(1, dt * 10);
      joueur.pas += dt * joueur.course * 11;
      joueur.ecrase *= Math.pow(0.002, dt);
      joueur.x = clamp(joueur.x + dir * regles.vitesse * dt, W * 0.06, W * 0.94);
      if (joueur.h > 0 || joueur.vy > 0) {
        joueur.h += joueur.vy * dt;
        joueur.vy -= regles.gravite * dt;
        if (joueur.h <= 0) { joueur.h = 0; joueur.vy = 0; joueur.ecrase = 0.16; }
      }
      joueur.invu = Math.max(0, joueur.invu - dt);
      joueur.tir = Math.max(0, joueur.tir - dt);
      if (touches.tir) tirer();

      // Les ondes de l'Effondrement, au sol : il faut etre en l'air.
      rings.forEach(function (g) {
        if (!g.sol || g.life <= 0.15) return;
        if (Math.abs(Math.abs(joueur.x - g.x) - g.r) < 46 && joueur.h < 70) blesser();
      });
    }

    // ---------- Le rendu (repris de la maquette) ----------
    function glow(x, y, r, col, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(0.35, 'rgba(' + col + ',' + (a * 0.45) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    function render(dt) {
      var T = performance.now() / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      var bgG = ctx.createRadialGradient(W / 2, H * 0.38, 50, W / 2, H * 0.45, W * 0.75);
      bgG.addColorStop(0, rage ? 'rgb(' + (40 + rageAmt * 30) + ',10,40)' : '#10175a'); bgG.addColorStop(1, '#03040f');
      ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);
      // Des nebuleuses lointaines, qui derivent. Le telephone qui penche
      // fait glisser l'espace : les nebuleuses un peu, les etoiles plus,
      // les plus grosses (les plus proches) davantage.
      var pc = window.INCLINAISON ? window.INCLINAISON.lire() : { x: 0, y: 0 };
      ctx.globalCompositeOperation = 'lighter';
      [[0.2, 0.25, 520, rage ? '160,30,70' : '90,50,200'], [0.82, 0.3, 480, rage ? '200,60,40' : '40,90,220'],
       [0.5, 0.08, 420, rage ? '120,20,60' : '140,60,220']].forEach(function (n, i) {
        var gx = W * n[0] + Math.sin(T * 0.07 + i) * 40 + pc.x * 60, gy = H * n[1] + Math.cos(T * 0.05 + i) * 30 + pc.y * 48;
        glow(gx, gy, n[2], n[3], 0.22);
      });
      ctx.globalCompositeOperation = 'source-over';
      bg.forEach(function (s) {
        var prof = 70 + s.r * 80;
        var sx = (((s.x + pc.x * prof) % W) + W) % W, sy = (((s.y + pc.y * prof) % (H * 0.8)) + H * 0.8) % (H * 0.8);
        ctx.fillStyle = 'rgba(200,215,255,' + (0.25 + 0.35 * Math.pow(Math.sin(T * 1.3 + s.p), 2)) + ')';
        ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, 6.29); ctx.fill();
      });

      var sh = reduit ? shake * 0.25 : shake;
      ctx.translate(rnd(-sh, sh), rnd(-sh, sh));
      shake *= Math.pow(0.02, dt);

      ctx.globalCompositeOperation = 'lighter';
      var ch = world(P.chest), pulse = 0.5 + 0.5 * Math.sin(T * (rage ? 6 : 2.4));
      if (spriteAlpha > 0) glow(ch[0], ch[1] - 60, 620, accent(), 0.16 + pulse * 0.06 + rageAmt * 0.12);
      rings.forEach(function (g) {
        g.r += g.v * dt; g.life -= dt * 1.1;
        ctx.strokeStyle = 'rgba(' + accent2() + ',' + Math.max(0, g.life) + ')';
        ctx.lineWidth = Math.max(0.1, g.w * g.life);
        ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r, g.r * (g.y > H * 0.8 ? 0.18 : 1), 0, 0, 6.29); ctx.stroke();
      });
      rings = rings.filter(function (g) { return g.life > 0; });
      ctx.globalCompositeOperation = 'source-over';

      if (state.name === 'death' && state.faille && state.faille.ouv > 0.003) dessinerFaille(state.faille, T);

      if (spriteBoss && spriteAlpha > 0) {
        ctx.save();
        ctx.translate(P.pivot[0] + tf.x, P.pivot[1] + SPR_Y + tf.y); ctx.rotate(tf.r); ctx.scale(tf.s, tf.s * tf.sy); ctx.translate(-P.pivot[0], -P.pivot[1]);
        ctx.globalAlpha = spriteAlpha; ctx.drawImage(spriteBoss.img, 0, 0, W, H);
        if (rageAmt > 0) { ctx.globalAlpha = rageAmt * (0.5 + 0.12 * pulse); ctx.drawImage(spriteBoss.rouge, 0, 0); }
        if (hurt > 0) { ctx.globalAlpha = hurt * 0.85; ctx.drawImage(spriteBoss.blanc, 0, 0); }
        ctx.restore(); ctx.globalAlpha = 1;
      }
      hurt = Math.max(0, hurt - dt * 4);
      // La lumiere de la faille deborde sur lui.
      if (state.name === 'death' && state.faille && state.t > 1 && state.t < 5) {
        ctx.globalCompositeOperation = 'lighter';
        glow(state.faille.x, state.faille.y, 640, '190,130,255', 0.22 * Math.min(1, state.faille.ouv));
        ctx.globalCompositeOperation = 'source-over';
      }

      var fg = ctx.createLinearGradient(0, H * 0.72, 0, H);
      fg.addColorStop(0, 'rgba(3,4,15,0)'); fg.addColorStop(1, 'rgba(3,4,15,.95)');
      ctx.fillStyle = fg; ctx.fillRect(-60, H * 0.72, W + 120, H * 0.35);

      // Le sol de l'arene : une plateforme de lumiere, et ses lignes qui
      // fuient vers le bas.
      ctx.globalCompositeOperation = 'lighter';
      var pg = ctx.createLinearGradient(0, SOL + 10, 0, H);
      pg.addColorStop(0, 'rgba(' + accent() + ',.22)'); pg.addColorStop(1, 'rgba(' + accent() + ',0)');
      ctx.fillStyle = pg; ctx.fillRect(0, SOL + 10, W, H - SOL);
      ctx.strokeStyle = 'rgba(' + accent2() + ',.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, SOL + 18); ctx.lineTo(W, SOL + 18); ctx.stroke();
      ctx.strokeStyle = 'rgba(' + accent2() + ',.12)'; ctx.lineWidth = 1;
      for (var gl = -10; gl <= 10; gl++) {
        ctx.beginPath(); ctx.moveTo(W / 2 + gl * 80, SOL + 18); ctx.lineTo(W / 2 + gl * 260, H + 40); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';

      ctx.globalCompositeOperation = 'lighter';
      if (spriteAlpha > 0) {
        var v = world(P.visor), b = world(P.belt);
        var vA = state.name === 'beam' && state.t < 2.3 ? 0.9 : 0.35 + pulse * 0.2;
        glow(v[0], v[1], state.name === 'beam' ? 260 * Math.min(1, state.t + 0.2) : 110, accent2(), vA);
        glow(ch[0], ch[1], 150 + pulse * 30, accent(), 0.35 + pulse * 0.25);
        glow(b[0], b[1], 90, accent(), 0.25 + pulse * 0.2);
        var charging = state.name === 'charge' || state.name === 'palms';
        [P.lHand, P.rHand].forEach(function (h) {
          var w = world(h);
          var amt = state.name === 'charge' ? Math.min(1, state.t / 1.2) : state.name === 'palms' ? Math.max(0, 1 - state.t / 2) : 0;
          glow(w[0], w[1] - 20, 60 + amt * 150 + (charging ? Math.sin(T * 25) * 8 : 0), accent2(), 0.15 + amt * 0.6);
        });
        if (state.name === 'death' && state.rays) {
          state.rays.forEach(function (ry) {
            ctx.save(); ctx.translate(ch[0], ch[1]); ctx.rotate(ry.a + Math.sin(T) * 0.05);
            var L = 1600, gr = ctx.createLinearGradient(0, 0, L, 0);
            gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(' + accent() + ',0)');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, -L * ry.w); ctx.lineTo(L, L * ry.w); ctx.fill(); ctx.restore();
          });
        }
        if (state.name === 'beam' && state.aim) {
          var v2 = world(P.visor), a = state.aim;
          [[70, 0.25], [34, 0.5], [12, 1]].forEach(function (wl) {
            ctx.strokeStyle = 'rgba(' + (wl[0] === 12 ? '255,255,255' : accent2()) + ',' + wl[1] + ')';
            ctx.lineWidth = wl[0] + Math.sin(T * 60) * wl[0] * 0.15; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(v2[0], v2[1]); ctx.lineTo(a[0], a[1]); ctx.stroke();
          });
          glow(a[0], a[1], 220, accent2(), 0.8); glow(v2[0], v2[1], 180, '255,255,255', 0.6);
          beams.push({ x: a[0], y: a[1], life: 1.4 });
        }
      }
      beams.forEach(function (s) { s.life -= dt; glow(s.x, s.y, 50, accent(), Math.max(0, s.life) * 0.12); });
      beams = beams.filter(function (s) { return s.life > 0; });

      // La Salve : chaque projectile marque au sol l'endroit ou il tombe.
      ctx.globalCompositeOperation = 'source-over';
      projs.forEach(function (p) {
        var z = Math.min(1, p.z);
        ctx.strokeStyle = 'rgba(255,70,90,' + (0.25 + z * 0.6).toFixed(2) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(p.tx, SOL + 14, 95 * (1.4 - z * 0.4), 20 * (1.4 - z * 0.4), 0, 0, 6.29); ctx.stroke();
      });
      ctx.globalCompositeOperation = 'lighter';
      projs.forEach(function (p) {
        p.z += dt * p.spd;
        var z = Math.min(1, p.z), e = z * z;
        var x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e, rr = 14 + e * 70;
        glow(x, y, rr * 2.2, accent(), 0.55); glow(x, y, rr * 0.9, '255,255,255', 0.8);
        if (Math.random() < 0.7) part({ x: x + rnd(-rr, rr) * 0.4, y: y + rnd(-rr, rr) * 0.4, life: 0.35, max: 0.35, size: rnd(2, 4) + e * 6, col: accent2() });
        if (p.z >= 1 && !p.done) {
          p.done = 1; flash = Math.max(flash, 0.2); flashCol = accent(); shake = Math.max(shake, 14); burst(x, y, 40, accent2(), 16);
          if (SON) SON.chute(0.45);
          if (Math.abs(joueur.x - p.tx) < 95 && joueur.h < 140) blesser();
        }
      });
      projs = projs.filter(function (p) { return !p.done; });

      // Les tirs du joueur.
      tirs.forEach(function (s) {
        s.t += dt / 0.32;
        var e = Math.min(1, s.t);
        var x = s.x + (s.tx - s.x) * e, y = s.y + (s.ty - s.y) * e;
        s.trace.push([x, y]);
        if (s.trace.length > 7) s.trace.shift();
        if (s.trace.length > 1) {
          var q0 = s.trace[0];
          var gt = ctx.createLinearGradient(q0[0], q0[1], x, y);
          gt.addColorStop(0, 'rgba(120,240,255,0)'); gt.addColorStop(1, 'rgba(160,245,255,.8)');
          ctx.strokeStyle = gt; ctx.lineWidth = 10; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(x, y); ctx.stroke();
        }
        glow(x, y, 46, '120,240,255', 0.7); glow(x, y, 16, '255,255,255', 0.95);
        if (s.t >= 1 && !s.done) { s.done = 1; toucherBoss(); }
      });
      tirs = tirs.filter(function (s) { return !s.done; });

      // Les particules.
      parts.forEach(function (p) {
        if (p.delay > 0) {
          p.delay -= dt; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgb(' + p.col + ')';
          ctx.fillRect(p.x, p.y, p.size, p.size); return;
        }
        p.life -= dt;
        if (p.conv) { p.x += (p.tx - p.x) * Math.min(1, dt * 7); p.y += (p.ty - p.y) * Math.min(1, dt * 7); }
        else { p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; }
        var a = Math.max(0, p.life / p.max);
        ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
        ctx.fillStyle = 'rgba(' + p.col + ',' + a + ')';
        if (p.streak) ctx.fillRect(p.x, p.y, p.size * 0.6, p.size * 14);
        else if (p.sq) ctx.fillRect(p.x, p.y, p.size * a + 1, p.size * a + 1);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.29); ctx.fill(); }
      });
      parts = parts.filter(function (p) { return p.life > 0; });
      if (parts.length > 9000) parts.splice(0, parts.length - 9000);

      // Le joueur : son Dinder, son ombre, et le clignotement d'un coup recu.
      ctx.globalCompositeOperation = 'source-over';
      if (!fini) {
        // Son illustration en pied : il penche dans sa course, rebondit a
        // chaque foulee, s'etire en sautant et s'ecrase en retombant.
        var hj = 300, wj = imHeros.naturalWidth ? hj * imHeros.naturalWidth / imHeros.naturalHeight : 200;
        var ombreK = Math.max(0.3, 1 - joueur.h / 420);
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.beginPath(); ctx.ellipse(joueur.x, SOL + 16, 78 * ombreK, 15 * ombreK, 0, 0, 6.29); ctx.fill();
        // Le halo de la plateforme, sous ses pieds.
        ctx.globalCompositeOperation = 'lighter';
        glow(joueur.x, SOL + 14, 110 * ombreK, '90,210,255', 0.18);
        ctx.globalCompositeOperation = 'source-over';
        if (!(joueur.invu > 0 && Math.floor(T * 14) % 2)) {
          var rebond = Math.abs(Math.sin(joueur.pas)) * 10 * joueur.course;
          var enAir = joueur.h > 2 ? Math.max(-0.1, Math.min(0.12, joueur.vy / 9000)) : 0;
          var sx = 1 + joueur.ecrase - enAir * 0.5, sy = 1 - joueur.ecrase + enAir;
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.translate(joueur.x, SOL + 16 - joueur.h - rebond);
          ctx.rotate(joueur.dir * 0.07 * joueur.course);
          ctx.scale(sx * (joueur.dir < 0 ? -1 : 1), sy);
          ctx.shadowColor = 'rgba(90,200,255,.55)';
          ctx.shadowBlur = 24;
          if (imHeros.naturalWidth) ctx.drawImage(imHeros, -wj / 2, -hj, wj, hj);
          ctx.restore();
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
      if (flash > 0) { ctx.fillStyle = 'rgba(' + flashCol + ',' + (flash * (reduit ? 0.3 : 1)) + ')'; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 1.6); }
      var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, rage ? 'rgba(60,0,15,.6)' : 'rgba(0,0,10,.6)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    // ---------- La boucle ----------
    var dernier = 0;
    function boucle(now) {
      if (!document.body.contains(box)) return arreter();
      var dt = dernier ? Math.min(0.05, (now - dernier) / 1000) : 0;
      dernier = now;
      if (spriteBoss) {
        logic(dt);
        avancerJoueur(dt);
        render(dt);
      }
      anim = requestAnimationFrame(boucle);
    }

    // ---------- La fin ----------
    function perdre() {
      perdu = true;
      if (SON) { SON.rayon(false); SON.defaite(); }
      annoncer('TU AS ÉTÉ DÉVORÉ', 'Azhrakonr n’a pas encore fini son repas', 0);
      var choix = el('div', 'azb-choix');
      var encore = el('button', 'azb-gros', 'RÉESSAYER');
      encore.type = 'button';
      encore.addEventListener('click', function () { choix.remove(); annoncer(''); initialiser(); });
      var fuir = el('button', 'azb-gros azb-gros--plat', 'Fuir');
      fuir.type = 'button';
      fuir.addEventListener('click', function () { arreter(); if (opts.fuite) opts.fuite(); });
      choix.appendChild(encore); choix.appendChild(fuir);
      stage.appendChild(choix);
      encore.focus();
    }

    function gagner() {
      fini = true;
      if (SON) SON.victoire();
      var deja = DP.has('azhrakonr');
      if (!deja) { DP.collect('azhrakonr'); if (DP.markNew) DP.markNew('azhrakonr'); }
      annoncer('');
      // Ce qu'il en reste se rassemble : il rejoint la collection.
      var r = el('div', 'azb-gain');
      r.appendChild(el('div', 'azb-gain-rayons'));
      var im = el('img', 'azb-gain-img');
      im.src = DP.dinderFull('azhrakonr');
      im.alt = 'Azhrakonr';
      r.appendChild(im);
      var txt = el('div', 'azb-gain-txt');
      txt.appendChild(el('span', 'azb-gain-haut', deja ? 'Déjà dans ta collection' : 'Nouveau Dinder'));
      txt.appendChild(el('strong', 'azb-gain-nom', 'Azhrakonr'));
      txt.appendChild(el('span', 'azb-gain-forme', 'Le Dévoreur'));
      txt.appendChild(el('span', 'azb-gain-rar', 'Threat'));
      r.appendChild(txt);
      stage.appendChild(r);
      setTimeout(function () {
        var b = el('button', 'azb-gros', 'REVENIR');
        b.type = 'button';
        b.addEventListener('click', function () { arreter(); if (opts.victoire) opts.victoire(); });
        txt.appendChild(b);
        b.focus();
      }, reduit ? 300 : 2600);
    }

    // ---------- Les commandes ----------
    var CLES = { arrowleft: 'g', q: 'g', a: 'g', arrowright: 'd', d: 'd' };
    function clavier(e) {
      var k = (e.key || '').toLowerCase();
      var bas = e.type === 'keydown';
      if (CLES[k]) { e.preventDefault(); touches[CLES[k]] = bas; return; }
      if (k === 'arrowup' || k === 'z' || k === 'w') { e.preventDefault(); if (bas) sauter(); return; }
      if (k === ' ' || k === 'f' || k === 'enter') {
        if (e.target && e.target.closest && e.target.closest('button')) return;
        e.preventDefault(); touches.tir = bas; return;
      }
    }
    window.addEventListener('keydown', clavier);
    window.addEventListener('keyup', clavier);
    // Un clic dans l'arene tire aussi.
    cv.addEventListener('pointerdown', function () { tirer(); });

    function arreter() {
      if (anim) cancelAnimationFrame(anim);
      anim = 0;
      if (SON) { SON.rayon(false); SON.musiqueFin(0.6); }
      window.removeEventListener('keydown', clavier);
      window.removeEventListener('keyup', clavier);
      if (box.parentNode) box.remove();
    }

    initialiser();
    chargerBoss(function () {
      annoncer('AZHRAKONR', 'Esquive, saute, tire — et tiens bon', 2600);
      anim = requestAnimationFrame(boucle);
    });

    return { arreter: arreter, _etat: function () { return { hp: hp, joueur: joueur, state: state, rage: rage }; },
             _toucher: toucherBoss };
  }

  window.AZHRAKONR_BOSS = { lancer: lancer, REGLES: REGLES };
})();
