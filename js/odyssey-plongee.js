// La plongee, dans The Odyssey of Dinder.
//
// Face a un point d'eau (le liquide de l'astre, quel qu'il soit : eau,
// methane, acide, metal fondu...), on peut plonger. Le moteur a la
// premiere personne (js/odyssey-fps.js) bascule alors sur une seconde
// grille : le lac devient l'espace libre, ses berges les murs, et l'on
// nage au fond, sous une surface qui ondule.
//   - l'air est compte : la jauge d'O2 se vide, et une fois vide on
//     perd des PV. On remonte la ou l'on a plonge ;
//   - au fond, des coquilles a ouvrir ;
//   - et par moments, une SIRENE. Elle chante : son chant attire, tourne
//     la tete vers elle, tire vers elle. Arrivee au contact, elle vide
//     l'air et les PV. Quelques tirs la font fuir, et elle lache une
//     conque. Les bouchons de resine rendent sourd a son chant.
//   - Au bord de l'eau aussi, de temps en temps, une sirene sort la tete
//     et chante. Celle-la, si on la laisse approcher, vous entraine au
//     fond.
//
// Le chant est synthetise sur place : une voix en dents de scie passee
// dans trois filtres de formants (le « a », le « o »), un vibrato, un
// echo, et une melodie en mineur harmonique qui glisse d'une note a
// l'autre.
(function () {
  var M = window.MONDE;
  if (!M) return;
  var TS = M.TS, T = M.T, bruit = M.bruit;
  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Les astres ou le "liquide" n'en est pas un.
  var DUR = {
    lune: 'Ces cratères d’ombre ne sont pas de l’eau : on y tomberait, on n’y nagerait pas.',
    mars: 'C’est de la glace. On ne plonge pas dans de la glace.'
  };
  var LIQUIDES = {};
  [T.LIQUIDE, T.EAU, T.EAU_RAD, T.ROSEAU].forEach(function (k) { LIQUIDES[k] = true; });

  var O2_MAX = 30;                       // secondes d'air
  var PORTEE_CHANT = TS * 9;

  // Le nom du liquide d'un astre, avec son article : « la mare », « le
  // metal fondu », « les mares d'acide ».
  function nomLiquide(a) {
    var n = a.liquideNom || (a.palette && a.palette.liquideNom) || '';
    if (!n) return 'l’eau';
    if (/^(la|le|les|des|du|un|une) |^l[’']/i.test(n)) return n;
    return (/s$/.test(n.split(' ')[0]) ? 'les ' : 'le ') + n;
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  // ==========================================================
  //  La sirene, au pixel
  // ==========================================================
  // Une seule espece, une seule allure : une longue queue de poisson qui
  // s'enroule, des nageoires en guise d'oreilles, une chevelure qui
  // flotte. Quand elle chante, ses bras s'ouvrent et ses yeux s'allument.
  var FEUILLES = {};
  function feuille(pose, chante) {
    var cle = pose + (chante ? 'c' : '');
    if (FEUILLES[cle]) return FEUILLES[cle];
    var L = 40, H = 62;
    var c = document.createElement('canvas');
    c.width = L; c.height = H;
    var x = c.getContext('2d');
    function p(px, py, w, h, col) { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), w, h); }
    var Q = '#2f9a8a', Q2 = '#6ae0c8', Qo = '#1a5a52', PEAU = '#bcd8e4', PEAUo = '#86a8b8';
    var CH = '#4a2278', CH2 = '#8a52d0', CHo = '#2a1048';
    var s = pose ? 1 : -1;

    // La nageoire caudale, en eventail, qui bat.
    var nx = 20 + s * 3;
    for (var i = 0; i < 7; i++) {
      p(nx - 9 + i, 54 + Math.abs(i - 3) - 1, 2, 7 - Math.abs(i - 3), i % 2 ? Q2 : '#9af4e0');
      p(nx + 2 + i, 54 + Math.abs(i - 3) - 1, 2, 7 - Math.abs(i - 3), i % 2 ? '#9af4e0' : Q2);
    }
    // La queue, qui s'affine en ondulant.
    for (var y = 30; y < 55; y++) {
      var k = (y - 30) / 25, w = Math.round(12 - k * 7);
      var o = Math.sin(k * 3.2 + (pose ? 0.8 : 0)) * 3;
      p(20 - w / 2 + o, y, w, 1, Q);
      p(20 - w / 2 + o, y, 1, 1, Qo);
      p(20 + w / 2 + o - 1, y, 1, 1, Qo);
      if (y % 3 === 0) p(20 - w / 2 + o + 2 + (y % 2), y, 1, 1, Q2);
      if (y % 3 === 1) p(20 + o, y, 1, 1, Q2);
    }
    // Le buste, ecailleux, et la taille.
    p(14, 22, 12, 9, PEAU); p(14, 22, 2, 9, PEAUo);
    p(13, 27, 14, 4, Q); for (i = 0; i < 4; i++) p(14 + i * 3, 28, 2, 1, Q2);
    // Les bras : ouverts quand elle chante.
    if (chante) {
      p(5, 19, 9, 2, PEAU); p(3, 16, 3, 4, PEAU); p(26, 19, 9, 2, PEAU); p(34, 16, 3, 4, PEAU);
      p(2, 15, 2, 2, Q2); p(36, 15, 2, 2, Q2);
    } else {
      p(11, 22, 3, 9, PEAU); p(26, 22, 3, 9, PEAU); p(11, 30, 3, 2, PEAUo); p(26, 30, 3, 2, PEAUo);
    }
    // La chevelure, derriere : elle flotte du cote ou bat la queue.
    for (y = 4; y < 34; y++) {
      var ond = Math.sin(y / 5 + (pose ? 1.3 : 0)) * 2 + (y - 4) * 0.12 * -s;
      var lg = y < 10 ? 16 : Math.max(4, 18 - (y - 10) * 0.35);
      p(20 - lg / 2 + ond, y, lg, 1, y % 5 === 0 ? CH2 : CH);
      if (y > 12) { p(20 - lg / 2 + ond, y, 2, 1, CHo); p(20 + lg / 2 + ond - 2, y, 2, 1, CHo); }
    }
    // La tete.
    p(15, 7, 10, 11, PEAU); p(15, 7, 2, 11, PEAUo); p(16, 17, 8, 2, PEAU);
    // Les nageoires-oreilles.
    p(12, 9, 3, 5, Q2); p(11, 8, 2, 3, Q); p(25, 9, 3, 5, Q2); p(27, 8, 2, 3, Q);
    // La frange.
    p(14, 5, 12, 4, CH); p(15, 4, 10, 1, CH2); p(14, 8, 3, 3, CH); p(23, 8, 3, 3, CH);
    // Les yeux : immenses, noirs ; roses et brillants quand elle chante.
    p(16, 11, 3, 3, '#0a0a18'); p(21, 11, 3, 3, '#0a0a18');
    if (chante) { p(17, 12, 1, 1, '#ff8ae0'); p(22, 12, 1, 1, '#ff8ae0'); p(16, 11, 1, 1, '#ffd0f4'); p(21, 11, 1, 1, '#ffd0f4'); }
    else { p(17, 11, 1, 1, '#ffffff'); p(22, 11, 1, 1, '#ffffff'); }
    // La bouche : ouverte, ronde, quand elle chante.
    if (chante) { p(19, 15, 3, 3, '#3a0a2a'); p(19, 15, 3, 1, '#7a2a5a'); }
    else p(19, 16, 3, 1, PEAUo);
    // Un collier de perles.
    for (i = 0; i < 5; i++) p(15 + i * 2, 20, 1, 1, '#fff0f6');
    FEUILLES[cle] = { canvas: c, L: L, H: H };
    return FEUILLES[cle];
  }

  // Une coquille geante, posee au fond.
  var COQ = {};
  function coquille(ouverte, P) {
    var cle = (ouverte ? 'o' : 'f') + (P.liquide || '');
    if (COQ[cle]) return COQ[cle];
    var c = document.createElement('canvas');
    c.width = 28; c.height = 20;
    var x = c.getContext('2d');
    function p(px, py, w, h, col) { x.fillStyle = col; x.fillRect(px, py, w, h); }
    var A = '#c8a8b8', A2 = '#f0d8e4', Ao = '#7a5a6a';
    // La valve du bas.
    for (var y = 0; y < 7; y++) { var w = 24 - Math.abs(y - 2) * 2; p(14 - w / 2, 12 + y, w, 1, y < 2 ? A2 : A); }
    for (var i = 0; i < 6; i++) p(4 + i * 4, 13, 1, 5, Ao);
    if (ouverte) {
      // Ouverte : la nacre, et le creux vide.
      p(4, 10, 20, 3, '#fff4fa'); p(6, 11, 16, 1, '#e8c8f0');
      for (y = 0; y < 8; y++) { var w2 = 22 - y * 2; p(14 - w2 / 2, 9 - y, w2, 1, y % 2 ? A : A2); }
    } else {
      // Fermee : la valve du haut, cannelee, et une perle qui depasse.
      for (y = 0; y < 8; y++) { var w3 = 24 - (7 - y) * 2.4; p(14 - w3 / 2, 4 + y, w3, 1, y < 2 ? A2 : A); }
      for (i = 0; i < 6; i++) p(5 + i * 4, 6, 1, 6, Ao);
      p(12, 11, 4, 2, '#ffffff'); p(13, 11, 1, 1, '#ffe8f8');
    }
    COQ[cle] = c;
    return c;
  }

  // ==========================================================
  //  Les sons
  // ==========================================================
  function audio() { var MJ = window.MUSIQUE_JEUX; return MJ && MJ.audio ? MJ.audio() : null; }
  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // Le chant d'une sirene : une voix qu'on garde allumee tant qu'elle
  // chante, et dont on regle le volume et la direction a chaque image.
  var VOYELLES = { a: [800, 1150, 2900], o: [450, 800, 2830], u: [325, 700, 2530], e: [400, 1600, 2700] };
  var PHRASE = [[69, 1.1], [72, 0.6], [76, 1.4], [74, 0.5], [72, 0.5], [71, 1.2], [68, 1.6], [null, 0.6],
                [76, 0.8], [77, 0.6], [76, 0.6], [72, 1.0], [74, 0.5], [71, 0.5], [69, 2.0], [null, 1.2]];
  function Chant(graveK) {
    var A = audio();
    if (!A) return null;
    var ac = A.ac, t0 = ac.currentTime + 0.05;
    var sortie = ac.createGain(); sortie.gain.value = 0.0001;
    var pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    if (pan) { sortie.connect(pan); pan.connect(A.sortie); } else sortie.connect(A.sortie);
    // L'echo : un retard qui se repete, pour la profondeur.
    var ret = ac.createDelay(1.2), boucle = ac.createGain();
    ret.delayTime.value = 0.34; boucle.gain.value = 0.42;
    ret.connect(boucle); boucle.connect(ret); ret.connect(sortie);

    var voix = ac.createGain(); voix.gain.value = 0.0001;
    voix.connect(sortie); voix.connect(ret);
    var osc = ac.createOscillator(); osc.type = 'sawtooth';
    var sous = ac.createOscillator(); sous.type = 'triangle';
    var vib = ac.createOscillator(), vibG = ac.createGain();
    vib.frequency.value = 5.2; vibG.gain.value = 6;
    vib.connect(vibG); vibG.connect(osc.frequency); vibG.connect(sous.frequency);
    var filtres = [0, 1, 2].map(function (k) {
      var f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.frequency.value = VOYELLES.a[k]; f.Q.value = [7, 9, 12][k];
      g.gain.value = [1, 0.55, 0.22][k] * 2.2;
      osc.connect(f); f.connect(g); g.connect(voix);
      return f;
    });
    var sousG = ac.createGain(); sousG.gain.value = 0.18;
    sous.connect(sousG); sousG.connect(voix);
    var dec = graveK || 0;
    osc.frequency.value = mf(69 + dec); sous.frequency.value = mf(57 + dec);
    osc.start(t0); sous.start(t0); vib.start(t0);

    var prochain = t0, i = 0, fini = false;
    var minuteur = setInterval(function () {
      if (fini) return;
      while (prochain < ac.currentTime + 0.5) {
        var n = PHRASE[i % PHRASE.length]; i++;
        var d = n[1] * (reduit ? 1 : 0.95 + Math.random() * 0.1);
        if (n[0] == null) {
          voix.gain.setTargetAtTime(0.0001, prochain, 0.12);
        } else {
          var f = mf(n[0] + dec);
          osc.frequency.setTargetAtTime(f, prochain, 0.07);
          sous.frequency.setTargetAtTime(f / 2, prochain, 0.07);
          voix.gain.setTargetAtTime(0.9, prochain, 0.09);
          voix.gain.setTargetAtTime(0.55, prochain + d * 0.7, 0.15);
          var v = VOYELLES[['a', 'o', 'a', 'u', 'e', 'o'][i % 6]];
          filtres.forEach(function (fl, k) { fl.frequency.setTargetAtTime(v[k], prochain, 0.12); });
        }
        prochain += d;
      }
    }, 120);

    return {
      regler: function (vol, cote) {
        if (fini) return;
        var t = ac.currentTime;
        sortie.gain.setTargetAtTime(Math.max(0.0001, vol), t, 0.12);
        if (pan) pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, cote)), t, 0.1);
      },
      arreter: function (cri) {
        if (fini) return;
        fini = true;
        clearInterval(minuteur);
        var t = ac.currentTime;
        if (cri) {
          // Un cri qui degringole.
          osc.frequency.cancelScheduledValues(t);
          osc.frequency.setValueAtTime(osc.frequency.value, t);
          osc.frequency.exponentialRampToValueAtTime(mf(88 + dec), t + 0.12);
          osc.frequency.exponentialRampToValueAtTime(mf(52 + dec), t + 0.9);
          voix.gain.cancelScheduledValues(t);
          voix.gain.setValueAtTime(1.2, t);
          voix.gain.exponentialRampToValueAtTime(0.0001, t + 1);
        }
        sortie.gain.setTargetAtTime(0.0001, t + (cri ? 0.6 : 0), 0.25);
        [osc, sous, vib].forEach(function (o) { try { o.stop(t + 2.2); } catch (e) {} });
        setTimeout(function () { try { sortie.disconnect(); ret.disconnect(); } catch (e) {} }, 3000);
      }
    };
  }

  // Le plouf : un souffle de bruit qui se ferme, puis des bulles.
  function plouf(entree) {
    var A = audio();
    if (!A) return;
    var ac = A.ac, t = ac.currentTime;
    var s = ac.createBufferSource(); s.buffer = A.bruit;
    var f = ac.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(entree ? 3200 : 1800, t);
    f.frequency.exponentialRampToValueAtTime(220, t + 0.7);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    s.connect(f); f.connect(g); g.connect(A.sortie);
    s.start(t); s.stop(t + 0.85);
    for (var i = 0; i < 6; i++) bulle(t + 0.15 + i * 0.09 + Math.random() * 0.05);
  }
  function bulle(t) {
    var A = audio();
    if (!A) return;
    var ac = A.ac; t = t || ac.currentTime;
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    var f0 = 300 + Math.random() * 500;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 2.6, t + 0.07);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); g.connect(A.sortie);
    o.start(t); o.stop(t + 0.1);
  }

  // ==========================================================
  //  La plongee, pour un monde
  // ==========================================================
  // J : ce que l'ecran du monde lui confie (voir js/odyssey.js).
  function creer(J) {
    var a = J.astre, g = J.grille, P = J.palette;
    var MH = g.length, MW = g[0].length;
    var actif = false, retour = null, gSous = null, lac = null, o2 = O2_MAX, o2Max = O2_MAX;
    var sirenes = [], coquilles = [], bullesE = [], notes = [];
    var protegeJusqua = 0, dernierEtouffe = 0, dernierSouffle = 0;
    var arrivee = performance.now();
    var prochaineSurface = arrivee + 45000 + Math.random() * 30000;
    var prochaineSous = 0;
    var charme = 0;                     // 0 a 1 : a quel point le chant tient

    // La jauge d'air, sous la jauge de PV.
    var jauge = el('div', 'ody-o2');
    jauge.hidden = true;
    var plein = el('div', 'ody-o2-plein');
    jauge.appendChild(el('span', 'ody-o2-nom', 'O₂'));
    var barre = el('div', 'ody-o2-barre'); barre.appendChild(plein); jauge.appendChild(barre);
    J.scene.appendChild(jauge);
    // Le voile du chant.
    var voile = el('div', 'ody-chant');
    J.scene.appendChild(voile);

    function maintenant() { return performance.now(); }
    function chef() { return J.balade().chef; }

    // ---------- Ou peut-on plonger ? ----------
    function liquide(tx, ty) { return !!(g[ty] && LIQUIDES[g[ty][tx]]); }
    function devant() {
      if (actif) return null;
      var B = J.balade();
      var ici = B.caseDuChef();
      if (liquide(ici[0], ici[1])) return { tx: ici[0], ty: ici[1] };
      for (var k = 0; k < 3; k++) {
        var c = B.caseDevant(TS * (0.6 + k * 0.5));
        if (liquide(c[0], c[1])) return { tx: c[0], ty: c[1] };
      }
      return null;
    }
    function interdit() { return DUR[a.id] || null; }

    // Le lac entier, depuis une case : tout le liquide qui s'y touche.
    function remplir(tx, ty) {
      var vu = new Uint8Array(MW * MH), file = [[tx, ty]], cases = [];
      vu[ty * MW + tx] = 1;
      while (file.length && cases.length < 6000) {
        var c = file.pop();
        cases.push(c);
        for (var k = 0; k < 4; k++) {
          var nx = c[0] + [1, -1, 0, 0][k], ny = c[1] + [0, 0, 1, -1][k];
          if (nx < 1 || ny < 1 || nx >= MW - 1 || ny >= MH - 1 || vu[ny * MW + nx]) continue;
          if (!liquide(nx, ny)) continue;
          vu[ny * MW + nx] = 1;
          file.push([nx, ny]);
        }
      }
      return { cases: cases, dedans: vu };
    }

    function grilleSous(l) {
      var gs = [];
      for (var y = 0; y < MH; y++) {
        var ligne = new Array(MW);
        for (var x = 0; x < MW; x++) ligne[x] = l.dedans[y * MW + x] ? 0 : 1;
        gs.push(ligne);
      }
      return gs;
    }

    // ---------- Plonger, remonter ----------
    function plonger(tx, ty, entraine) {
      if (actif) return false;
      var B = J.balade();
      var ch = B.chef;
      lac = remplir(tx, ty);
      gSous = grilleSous(lac);
      retour = { x: ch.x, y: ch.y, ang: ch.ang };
      actif = true;
      o2Max = O2_MAX; o2 = o2Max;
      B.changer({ mode: 'sous', grille: gSous, x: (tx + 0.5) * TS, y: (ty + 0.5) * TS, ang: ch.ang });
      // Des coquilles au fond : toujours les memes pour un lac donne.
      var sel = lac.cases.reduce(function (m, c) { return Math.min(m, c[1] * MW + c[0]); }, 1e9);
      coquilles = [];
      var n = Math.min(7, Math.floor(lac.cases.length / 14));
      for (var i = 0; i < n; i++) {
        var c = lac.cases[Math.floor(bruit(sel, i, 990) * lac.cases.length)];
        var k = 'plg-' + sel + '-' + i;
        if (J.pris(k) || coquilles.some(function (q) { return q.tx === c[0] && q.ty === c[1]; })) continue;
        if (Math.abs(c[0] - tx) + Math.abs(c[1] - ty) < 2) continue;
        coquilles.push({ k: k, tx: c[0], ty: c[1], x: (c[0] + 0.5) * TS, y: (c[1] + 0.5) * TS + 4, ouverte: 0 });
      }
      J.scene.classList.add('is-sousleau');
      J.scene.style.setProperty('--liquide', P.liquide || '#2a68c4');
      animerPlouf(true);
      plouf(true);
      if (window.MUSIQUE_JEUX && window.MUSIQUE_JEUX.sousLEau) window.MUSIQUE_JEUX.sousLEau(true);
      jauge.hidden = false;
      majJauge();
      // Une sirene arrive toujours, tot ou tard. Plus le lac est grand,
      // plus elle a de place pour venir.
      prochaineSous = maintenant() + (entraine ? 2500 : 10000 + Math.random() * 14000);
      if (entraine) J.dire('Elle t’entraîne au fond !');
      else J.dire('Tu plonges dans ' + nomLiquide(a) + '.');
      return true;
    }

    function remonter() {
      if (!actif) return;
      var B = J.balade();
      sirenes.forEach(function (s) { if (s.chant) s.chant.arreter(false); });
      sirenes = [];
      actif = false;
      charme = 0;
      B.changer({ mode: 'surface', x: retour.x, y: retour.y, ang: retour.ang });
      J.scene.classList.remove('is-sousleau');
      animerPlouf(false);
      plouf(false);
      if (window.MUSIQUE_JEUX && window.MUSIQUE_JEUX.sousLEau) window.MUSIQUE_JEUX.sousLEau(false);
      jauge.hidden = true;
      voile.style.opacity = '0';
      J.dire(o2 <= 0 ? 'De l’air, enfin.' : 'Tu reprends ton souffle.');
      // Pas de sirene de surface tout de suite apres.
      prochaineSurface = maintenant() + 30000 + Math.random() * 30000;
    }

    // L'ecran passe sous la surface : un rideau de la couleur du liquide,
    // des bulles qui filent vers le haut.
    function animerPlouf(entree) {
      var r = el('div', 'ody-plouf' + (entree ? ' is-entree' : ' is-sortie'));
      r.style.setProperty('--liquide', P.liquide || '#2a68c4');
      r.style.setProperty('--ecume', P.ecume || '#ffffff');
      for (var i = 0; i < 18; i++) {
        var b = el('i');
        b.style.left = (4 + Math.random() * 92) + '%';
        b.style.animationDelay = (Math.random() * 0.35).toFixed(2) + 's';
        b.style.setProperty('--t', (6 + Math.random() * 14).toFixed(0) + 'px');
        r.appendChild(b);
      }
      J.scene.appendChild(r);
      setTimeout(function () { r.remove(); }, reduit ? 300 : 1300);
    }

    function majJauge() {
      var k = Math.max(0, o2 / o2Max);
      plein.style.width = (k * 100).toFixed(1) + '%';
      jauge.dataset.bas = k < 0.3 ? '1' : '0';
    }

    // ---------- Les sirenes ----------
    function nouvelleSirene(x, y, surface) {
      // Elle tombe en cinq tirs environ, quel que soit le pistolet : c'est
      // son chant qui est dangereux, pas sa peau.
      var A = window.ARME, CR = window.ODYCRAFT;
      var deg = (A ? A.niveauJeu('odyssee').degats : 6) * (CR ? CR.bonus().degats : 1);
      var s = {
        x: x, y: y, surface: !!surface, pv: Math.max(28, Math.round(deg * 4.6)), t0: maintenant(),
        touche: -9999, coup: -9999, muette: 0, fuite: 0, ph: Math.random() * 6, monte: 0,
        sirene: true, v: { id: 'sirene', nom: 'Sirène', palier: 2 }
      };
      s.pvMax = s.pv;
      s.chant = Chant(surface ? 0 : -2);
      sirenes.push(s);
      return s;
    }

    // Sous l'eau : une case du lac, assez loin, de preference hors de vue.
    function placerSousLEau() {
      var ch = chef(), mieux = null, score = -1;
      for (var i = 0; i < 40; i++) {
        var c = lac.cases[Math.floor(Math.random() * lac.cases.length)];
        var x = (c[0] + 0.5) * TS, y = (c[1] + 0.5) * TS, d = Math.hypot(x - ch.x, y - ch.y);
        if (d < TS * (i < 25 ? 3 : 1.5)) continue;
        var sc = Math.min(d, TS * 8) + Math.random() * 20;
        if (sc > score) { score = sc; mieux = [x, y]; }
      }
      return mieux;
    }

    // Sous l'eau, entre dmin et dmax du voyageur, la ou il fait libre.
    function placerPres(dmin, dmax) {
      var ch = chef(), B = J.balade();
      for (var i = 0; i < 48; i++) {
        var an = Math.random() * Math.PI * 2, r = dmin + Math.random() * (dmax - dmin);
        var x = ch.x + Math.cos(an) * r, y = ch.y + Math.sin(an) * r;
        if (B.libre(x, y)) return [x, y];
      }
      return null;
    }

    // En surface : une case de liquide entre 2 et 5 cases du voyageur.
    function placerSurface() {
      var ch = chef(), cx = Math.floor(ch.x / TS), cy = Math.floor(ch.y / TS), choix = [];
      for (var y = cy - 5; y <= cy + 5; y++) for (var x = cx - 5; x <= cx + 5; x++) {
        if (!liquide(x, y)) continue;
        var d = Math.hypot(x - cx, y - cy);
        if (d < 2 || d > 5) continue;
        // Au large plutot qu'au ras du bord : on doit la voir sortir.
        var n = 0;
        for (var k = 0; k < 4; k++) if (liquide(x + [1, -1, 0, 0][k], y + [0, 0, 1, -1][k])) n++;
        if (n >= 3) choix.push([x, y]);
      }
      if (!choix.length) return null;
      var c = choix[Math.floor(Math.random() * choix.length)];
      return [(c[0] + 0.5) * TS, (c[1] + 0.5) * TS];
    }

    function presDeLEau(r) {
      var ch = chef(), cx = Math.floor(ch.x / TS), cy = Math.floor(ch.y / TS);
      for (var y = cy - r; y <= cy + r; y++) for (var x = cx - r; x <= cx + r; x++) if (liquide(x, y)) return true;
      return false;
    }

    function protege() { return protegeJusqua > maintenant(); }

    // Un tir qui touche une sirene.
    function toucher(s, deg) {
      var t = maintenant();
      s.pv = Math.max(0, s.pv - deg);
      s.touche = t;
      s.muette = t + 1300;
      // Elle recule sous le coup.
      var ch = chef(), d = Math.hypot(s.x - ch.x, s.y - ch.y) || 1;
      s.recul = { x: (s.x - ch.x) / d, y: (s.y - ch.y) / d, t: t };
      if (s.pv <= 0 && !s.fuite) {
        s.fuite = t;
        if (s.chant) s.chant.arreter(true);
        J.dire(s.surface ? 'La sirène replonge en hurlant.' : 'La sirène s’enfuit dans un nuage de bulles.');
        for (var i = 0; i < 14; i++) bullesE.push({ x: s.x, y: s.y, h: 18 + Math.random() * 16, t0: t + i * 30, dx: (Math.random() - 0.5) * 18, dy: (Math.random() - 0.5) * 18 });
        J.gagner(butin(), s.x, s.y);
        if (actif) prochaineSous = t + 25000 + Math.random() * 20000;
        else prochaineSurface = t + 50000 + Math.random() * 40000;
      }
    }

    function butin() {
      var out = [{ id: 'conque-sirene', n: 1 }];
      if (Math.random() < 0.35) out.push({ id: 'ecaille', n: 1 });
      return out;
    }

    // ---------- Chaque image ----------
    function animer(dt, t, libre) {
      var B = J.balade(), ch = B.chef, i;

      // Les sirenes de surface, de temps en temps, au bord de l'eau.
      if (!actif && libre && !interdit() && t > prochaineSurface && !sirenes.length) {
        prochaineSurface = t + 4000;
        if (presDeLEau(4) && Math.random() < 0.3) {
          var ou = placerSurface();
          if (ou) {
            nouvelleSirene(ou[0], ou[1], true);
            J.dire('Un chant monte de l’eau…');
          }
        }
      }
      // Sous l'eau, elle finit toujours par venir.
      if (actif && libre && t > prochaineSous && !sirenes.some(function (s) { return !s.fuite; })) {
        var o = placerSousLEau();
        if (o) { nouvelleSirene(o[0], o[1], false); J.dire('Un chant, quelque part dans le bleu…'); }
        prochaineSous = t + 60000;
      }

      // L'air.
      if (actif) {
        var avant = o2;
        o2 = Math.max(0, o2 - dt * (charme > 0.6 ? 1.6 : 1));
        if (o2 <= 0 && t - dernierEtouffe > 900) { dernierEtouffe = t; J.blesser(6, null, 'air'); }
        if (avant > 8 && o2 <= 8) J.dire('Tu manques d’air — REMONTE !');
        if (!reduit && t - dernierSouffle > 2600) { dernierSouffle = t; bulle(); }
        majJauge();
      }

      // Les sirenes.
      charme = 0;
      for (i = sirenes.length - 1; i >= 0; i--) {
        var s = sirenes[i];
        if (s.fuite) {
          if (t - s.fuite > 1100) sirenes.splice(i, 1);
          continue;
        }
        var dx = ch.x - s.x, dy = ch.y - s.y, d = Math.hypot(dx, dy) || 1;
        s.monte = Math.min(1, (t - s.t0) / 1400);
        // Elle se rapproche. En surface, elle reste dans l'eau.
        if (d > (s.surface ? 22 : 62) && s.monte >= 1 && !(s.recul && t - s.recul.t < 500)) {
          var vit = s.surface ? 16 : 30 + (a.rang || 1) * 0.8;
          var nx = s.x + dx / d * vit * dt, ny = s.y + dy / d * vit * dt;
          var ok = s.surface ? liquide(Math.floor(nx / TS), Math.floor(ny / TS))
                             : gSous[Math.floor(ny / TS)] && gSous[Math.floor(ny / TS)][Math.floor(nx / TS)] === 0;
          if (ok) { s.x = nx; s.y = ny; }
        }
        if (s.recul && t - s.recul.t < 500) {
          var rx = s.x + s.recul.x * 60 * dt, ry = s.y + s.recul.y * 60 * dt;
          if (s.surface ? liquide(Math.floor(rx / TS), Math.floor(ry / TS))
                        : gSous[Math.floor(ry / TS)] && gSous[Math.floor(ry / TS)][Math.floor(rx / TS)] === 0) { s.x = rx; s.y = ry; }
        }
        var chante = t > s.muette && s.monte >= 1;
        s.chante = chante;
        // Le chant : plus fort de pres, et il vient de la ou elle est.
        if (s.chant) {
          var c = Math.cos(ch.ang), sn = Math.sin(ch.ang);
          var lat = (-(s.x - ch.x) * sn + (s.y - ch.y) * c) / d;
          var vol = chante ? Math.max(0.05, 1 - d / (PORTEE_CHANT * 1.4)) : 0.02;
          s.chant.regler(vol * (protege() ? 0.12 : 1) * 0.9, lat);
        }
        // Le charme : il tourne la tete et tire vers elle.
        if (chante && !protege() && d < PORTEE_CHANT && libre) {
          var k = Math.max(0, 1 - d / PORTEE_CHANT);
          k = Math.min(1, 0.35 + k * 0.8);
          charme = Math.max(charme, k);
          if (!reduit) {
            var vise = Math.atan2(s.y - ch.y, s.x - ch.x);
            var ecart = Math.atan2(Math.sin(vise - ch.ang), Math.cos(vise - ch.ang));
            ch.ang += ecart * Math.min(1, dt * 0.9 * k);
          }
          // Elle attire jusqu'a portee de ses bras, pas plus pres.
          if (d > (s.surface ? 30 : 70)) {
            var tire = (s.surface ? 22 : 30) * k * dt;
            B.deplacer((s.x - ch.x) / d * tire, (s.y - ch.y) / d * tire);
          }
          if (Math.random() < dt * 2.5) notes.push({ x: s.x, y: s.y, h: 40, t0: t, dx: (Math.random() - 0.5) * 2 });
        }
        // Au contact.
        if (s.surface) {
          if (d < 40 && s.monte >= 1 && libre) {
            // Elle l'attrape et l'entraine au fond.
            var tx = Math.floor(s.x / TS), ty = Math.floor(s.y / TS);
            if (s.chant) s.chant.arreter(false);
            sirenes.splice(i, 1);
            plonger(tx, ty, true);
            // Elle l'attend au fond, a quelques brasses, et on la voit.
            var o3 = placerPres(60, 120) || placerSousLEau();
            if (o3) {
              nouvelleSirene(o3[0], o3[1], false);
              ch.ang = Math.atan2(o3[1] - ch.y, o3[0] - ch.x);
            }
            return;
          }
        } else if (d < 76 && libre && t - s.coup > 1400) {
          s.coup = t;
          o2 = Math.max(0, o2 - 2);
          J.blesser(4 + Math.round((a.rang || 1) * 0.3), s);
        }
      }
      voile.style.opacity = (charme * 0.85).toFixed(2);
    }

    // ---------- Ce qui se dessine ----------
    function dessinSirene(s, t) {
      return function (ctx, sx, sy) {
        var f = feuille(reduit ? 0 : Math.floor((t + s.ph * 300) / 420) % 2, s.chante);
        var flotte = reduit ? 0 : Math.sin(t / 600 + s.ph) * 3;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (s.fuite) ctx.globalAlpha = Math.max(0, 1 - (t - s.fuite) / 1000);
        if (s.surface) {
          // Elle sort de l'eau : on ne voit que ce qui depasse.
          var sort = 0.62 * s.monte;
          ctx.beginPath(); ctx.rect(sx - 40, sy - 90, 80, 90); ctx.clip();
          ctx.drawImage(f.canvas, Math.round(sx - f.L / 2), Math.round(sy - f.H * sort + flotte * 0.5 + (s.fuite ? (t - s.fuite) / 30 : 0)));
          ctx.restore();
          // Les ronds dans l'eau.
          ctx.save();
          ctx.strokeStyle = 'rgba(255,255,255,.5)';
          ctx.lineWidth = 1;
          for (var r = 0; r < 3; r++) {
            var ph = ((t / 900) + r / 3) % 1;
            ctx.globalAlpha = (1 - ph) * 0.7;
            ctx.beginPath(); ctx.ellipse(sx, sy, 8 + ph * 18, 2 + ph * 4, 0, 0, 6.3); ctx.stroke();
          }
          ctx.restore();
        } else {
          ctx.drawImage(f.canvas, Math.round(sx - f.L / 2), Math.round(sy - f.H + 14 + flotte));
          ctx.restore();
        }
        if (!s.fuite && t - s.touche < 120) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7;
          ctx.drawImage(f.canvas, Math.round(sx - f.L / 2), Math.round(sy - f.H - (s.surface ? -f.H * (1 - 0.62) : -14) + flotte));
          ctx.restore();
        }
        // Sa jauge, des qu'elle est entamee.
        if (!s.fuite && s.pv < s.pvMax) {
          var top = Math.round(sy - (s.surface ? f.H * 0.62 * s.monte : f.H - 14) - 6);
          ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(Math.round(sx - 13), top, 26, 3);
          ctx.fillStyle = '#ff7ad8'; ctx.fillRect(Math.round(sx - 13), top, Math.round(26 * s.pv / s.pvMax), 3);
        }
      };
    }

    function extras(t) {
      var out = [];
      if (actif) {
        coquilles.forEach(function (q) {
          out.push({ x: q.x, y: q.y, dessin: function (ctx, sx, sy) {
            var c = coquille(q.ouverte > 0, P);
            ctx.drawImage(c, Math.round(sx - 14), Math.round(sy - 19));
            // Un reflet de nacre qui passe.
            if (!q.ouverte && !reduit && Math.floor(t / 1300 + q.tx) % 3 === 0) {
              ctx.fillStyle = 'rgba(255,255,255,' + (1 - (t % 1300) / 1300).toFixed(2) + ')';
              ctx.fillRect(Math.round(sx - 1), Math.round(sy - 9), 3, 1);
              ctx.fillRect(Math.round(sx), Math.round(sy - 10), 1, 3);
            }
          } });
        });
      }
      sirenes.forEach(function (s) {
        out.push({ x: s.x, y: s.y, echelle: 0.62, dessin: dessinSirene(s, t) });
      });
      return out;
    }

    // Par-dessus la scene : les bulles, les notes du chant, et sous l'eau
    // les rais de lumiere qui tombent de la surface.
    function apres(ctx, V, t) {
      var i, W = V.L, H = V.H;
      if (actif && !reduit) {
        // Les rais de lumiere.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (i = 0; i < 4; i++) {
          var x0 = ((i * 97 + t / 90) % (W + 120)) - 60;
          var al = 0.05 + 0.04 * Math.sin(t / 1100 + i * 2);
          var gr = ctx.createLinearGradient(0, 0, 0, H);
          gr.addColorStop(0, 'rgba(255,255,255,' + al.toFixed(3) + ')');
          gr.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.moveTo(x0, 0); ctx.lineTo(x0 + 26, 0); ctx.lineTo(x0 + 70, H); ctx.lineTo(x0 + 30, H);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        // Des bulles devant les yeux, qui montent.
        ctx.fillStyle = 'rgba(220,245,255,.55)';
        for (i = 0; i < 10; i++) {
          var ph = ((t / (2600 + i * 230)) + i * 0.13) % 1;
          var bx = (i * 53 + Math.sin(t / 700 + i) * 6) % W, by = H - ph * (H + 20);
          var r = 1 + (i % 3);
          ctx.fillRect(Math.round(bx), Math.round(by), r, r);
        }
      }
      // Les bulles d'une sirene en fuite, dans le monde.
      for (i = bullesE.length - 1; i >= 0; i--) {
        var b = bullesE[i], k = (t - b.t0) / 1400;
        if (k < 0) continue;
        if (k >= 1) { bullesE.splice(i, 1); continue; }
        var pr = V.projeter(b.x + b.dx * k, b.y + b.dy * k, b.h + k * 50);
        if (!pr || !V.visible(pr.x, pr.d)) continue;
        var rr = Math.max(1, Math.round(pr.s * 2.5));
        ctx.strokeStyle = 'rgba(230,250,255,' + (1 - k).toFixed(2) + ')';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(pr.x), Math.round(pr.y), rr, rr);
      }
      // Les notes du chant, qui flottent vers le voyageur.
      ctx.save();
      ctx.textAlign = 'center';
      for (i = notes.length - 1; i >= 0; i--) {
        var n = notes[i], kn = (t - n.t0) / 2200;
        if (kn >= 1) { notes.splice(i, 1); continue; }
        var pn = V.projeter(n.x, n.y, n.h + kn * 26);
        if (!pn) continue;
        var tl = Math.max(7, Math.min(22, Math.round(pn.s * 12)));
        ctx.font = 'bold ' + tl + 'px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,138,224,' + (1 - kn).toFixed(2) + ')';
        ctx.fillText(i % 2 ? '♪' : '♫', pn.x + Math.sin(t / 300 + i) * 6 * pn.s, pn.y);
      }
      ctx.restore();
    }

    // ---------- Ce qu'on peut ouvrir au fond ----------
    function chercherPrise() {
      if (!actif) return null;
      var ch = chef(), mieux = null, d0 = 42;
      coquilles.forEach(function (q) {
        if (q.ouverte) return;
        var d = Math.hypot(q.x - ch.x, q.y - ch.y);
        if (d < d0) { d0 = d; mieux = { coq: q, quoi: 'OUVRIR' }; }
      });
      return mieux;
    }

    function ouvrir(q) {
      var CR = window.ODYCRAFT;
      var liste = CR ? CR.recolte('gisement', a) : [];
      if (Math.random() < 0.5) liste.push({ id: 'cristal', n: 1 });
      if (Math.random() < 0.08) liste.push({ id: 'noyau', n: 1 });
      if (CR && !CR.rentre(liste.slice(0, 1))) { J.sacPlein(); return; }
      q.ouverte = maintenant();
      J.prendre(q.k);
      J.dire('La coquille s’ouvre. Il y avait quelque chose dedans.');
      for (var i = 0; i < 8; i++) bullesE.push({ x: q.x, y: q.y, h: 6, t0: maintenant() + i * 40, dx: (Math.random() - 0.5) * 12, dy: (Math.random() - 0.5) * 12 });
      bulle();
      J.gagner(liste, q.x, q.y);
    }

    function arreter() {
      sirenes.forEach(function (s) { if (s.chant) s.chant.arreter(false); });
      sirenes = [];
      if (actif && window.MUSIQUE_JEUX && window.MUSIQUE_JEUX.sousLEau) window.MUSIQUE_JEUX.sousLEau(false);
      actif = false;
    }

    return {
      actif: function () { return actif; },
      devant: devant, interdit: interdit, plonger: plonger, remonter: remonter,
      animer: animer, extras: extras, apres: apres,
      sirenes: function () { return sirenes.filter(function (s) { return !s.fuite; }); },
      toucher: toucher, chercherPrise: chercherPrise, ouvrir: ouvrir,
      charme: function () { return charme; },
      proteger: function (ms) { protegeJusqua = maintenant() + ms; },
      protege: protege,
      air: function (s) { if (!actif) return false; o2Max = Math.max(o2Max, Math.min(O2_MAX * 2, o2 + s)); o2 = Math.min(o2Max, o2 + s); majJauge(); return true; },
      o2: function () { return o2; },
      retour: function () { return retour; },
      arreter: arreter,
      // Pour les essais.
      _forcerSirene: function (surface) {
        var o = surface ? placerSurface() : placerSousLEau();
        if (o) return nouvelleSirene(o[0], o[1], !!surface);
        return null;
      }
    };
  }

  window.ODYPLONGEE = { creer: creer, feuille: feuille, nomLiquide: nomLiquide };
})();
