// La musique de fond des mini-jeux.
//
// Chaque jeu a la sienne, jouee tant qu'on y reste — ses ecrans annexes
// compris (la Poissonnerie, le carnet de l'Odyssee...). Wade and Friends
// garde la boite a musique de son menu (js/wade-son.js) : il n'est pas
// ici. Tout est synthetise sur place, en Web Audio, a la maniere des
// consoles 8 bits : deux voix carrees a rapport cyclique variable, une
// triangle pour la basse, du bruit pour la batterie.
//
//   - The Founder War : une marche heroique en re mineur, caisse claire
//     militaire, basse en octaves ;
//   - Fish n'Der : un calypso de bord de lac en fa majeur, balance, avec
//     son shaker et son bloc de bois ;
//   - The Odyssey of Dinder : un voyage en mi mineur, des arpeges qui
//     filent avec un echo, une melodie qui s'envole.
//
// Les morceaux sont faits de sections (couplet, refrain, pont) enchainees
// dans un ordre fixe, pour qu'on ne les entende pas tourner en rond.
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  var ac = null, maitre = null, bruitBuf = null, echo = null, filtre = null, sfx = null;
  var VOLUME = 0.2, VOLUME_SFX = 0.55;
  var muet = false;
  try { muet = localStorage.getItem('dinderpad.musique.muet') === '1'; } catch (e) {}

  function pret() {
    if (!AC) return false;
    if (!ac) {
      try { ac = new AC(); } catch (e) { return false; }
      maitre = ac.createGain();
      maitre.gain.value = muet ? 0 : VOLUME;
      var comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      // Sous l'eau, dans l'Odyssee, tout passe par un filtre qui etouffe
      // les aigus. Les bruitages (le chant des sirenes...) y passent aussi.
      filtre = ac.createBiquadFilter();
      filtre.type = 'lowpass'; filtre.frequency.value = plonge ? 520 : 20000; filtre.Q.value = 0.7;
      sfx = ac.createGain();
      sfx.gain.value = muet ? 0 : VOLUME_SFX;
      maitre.connect(filtre); sfx.connect(filtre);
      filtre.connect(comp); comp.connect(ac.destination);
      bruitBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      var d = bruitBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // L'echo de l'Odyssee : une seule ligne a retard, partagee.
      echo = ac.createDelay(1.5);
      var retour = ac.createGain(); retour.gain.value = 0.36;
      var sortie = ac.createGain(); sortie.gain.value = 0.45;
      echo.connect(retour); retour.connect(echo);
      echo.connect(sortie); sortie.connect(maitre);
    }
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
    return true;
  }

  function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---------- Les voix ----------
  // Une onde carree a rapport cyclique choisi (12,5 %, 25 %, 50 %) : c'est
  // ce qui donne leur grain aux consoles de l'epoque.
  var ondes = {};
  function pulse(d) {
    if (ondes[d]) return ondes[d];
    var n = 40, re = new Float32Array(n), im = new Float32Array(n);
    for (var k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * d);
    ondes[d] = ac.createPeriodicWave(re, im);
    return ondes[d];
  }

  // Une note : son enveloppe, et un vibrato qui arrive apres l'attaque
  // sur les notes tenues.
  function note(vers, o) {
    var t = o.t, d = o.d;
    var g = ac.createGain(); g.connect(vers);
    var x = ac.createOscillator();
    if (o.duty) x.setPeriodicWave(pulse(o.duty)); else x.type = o.type || 'triangle';
    x.frequency.setValueAtTime(mf(o.m), t);
    if (o.glisse) x.frequency.exponentialRampToValueAtTime(mf(o.m + o.glisse), t + d);
    x.connect(g);
    if (o.vib && d > 0.3) {
      var lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(mf(o.m) * 0.012, t + Math.min(0.4, d * 0.6));
      lfo.connect(lg); lg.connect(x.frequency);
      lfo.start(t); lfo.stop(t + d + 0.1);
    }
    var v = o.v, rel = o.rel || 0.04;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.att || 0.006));
    if (o.pince) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, v * 0.08), t + d);
    else {
      g.gain.setValueAtTime(v * 0.8, t + Math.max(0.01, d - rel));
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    }
    x.start(t); x.stop(t + d + 0.05);
    return g;
  }

  function sortieVers(vers, v) { var g = ac.createGain(); g.gain.value = v; g.connect(vers); return g; }

  // ---------- La batterie ----------
  function grosse(vers, t, v) {
    var g = ac.createGain(), o = ac.createOscillator();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(vers); o.start(t); o.stop(t + 0.2);
  }
  function bruit(vers, t, v, type, f, q, d) {
    var s = ac.createBufferSource(); s.buffer = bruitBuf;
    var b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q;
    var g = ac.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(b); b.connect(g); g.connect(vers);
    s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
  }
  function caisse(vers, t, v) { bruit(vers, t, v, 'bandpass', 1900, 0.8, 0.13); note(vers, { m: 52, t: t, d: 0.06, v: v * 0.5, type: 'triangle', pince: true }); }
  function charley(vers, t, v) { bruit(vers, t, v, 'highpass', 7500, 0, 0.035); }
  function shaker(vers, t, v) { bruit(vers, t, v, 'highpass', 5200, 0, 0.07); }
  function bloc(vers, t, v, m) { note(vers, { m: m || 84, t: t, d: 0.07, v: v, type: 'sine', pince: true }); }
  function tom(vers, t, v, m) { note(vers, { m: m, t: t, d: 0.18, v: v, type: 'triangle', glisse: -7, pince: true }); }
  function roulement(vers, t, dt, v) { for (var k = 0; k < 4; k++) caisse(vers, t + k * dt / 4, v * (0.5 + k * 0.15)); }

  // ---------- L'ecriture ----------
  // Une melodie s'ecrit en paires [note MIDI ou null, duree en doubles-
  // croches]. On la deplie en une table : a quel pas commence quelle note.
  function deplier(m) {
    var table = {}, pas = 0;
    for (var i = 0; i < m.length; i += 2) {
      if (m[i] != null) table[pas] = [m[i], m[i + 1]];
      pas += m[i + 1];
    }
    return table;
  }

  // ==========================================================
  //  Les morceaux
  // ==========================================================

  var MORCEAUX = {
    // ---------- The Founder War : la marche ----------
    'founder-war': (function () {
      var A = {
        Dm: { tri: [62, 65, 69], b: 38 }, Bb: { tri: [58, 62, 65], b: 34 }, C: { tri: [60, 64, 67], b: 36 },
        A: { tri: [57, 61, 64], b: 33 }, Gm: { tri: [55, 58, 62], b: 31 }
      };
      var S = {
        A: { acc: ['Dm', 'Bb', 'C', 'A'], plein: true,
             lead: deplier([74, 4, 77, 2, 81, 2, 79, 4, 77, 2, 76, 2,
                            74, 6, 70, 2, 74, 2, 77, 2, 74, 4,
                            72, 4, 76, 2, 79, 2, 84, 4, 79, 2, 76, 2,
                            73, 6, 76, 2, 81, 8]) },
        B: { acc: ['Gm', 'Dm', 'Bb', 'A'], plein: true,
             lead: deplier([79, 3, 77, 1, 74, 4, 70, 4, 74, 4,
                            77, 3, 76, 1, 74, 4, 69, 4, 74, 4,
                            74, 2, 77, 2, 82, 4, 81, 2, 79, 2, 77, 4,
                            76, 4, 73, 4, 69, 4, null, 4]) },
        // Le pont : la troupe reprend son souffle, la caisse claire seule
        // tient la cadence sous une melodie grave.
        C: { acc: ['Dm', 'C', 'Bb', 'A'], plein: false,
             lead: deplier([62, 8, 65, 8, 64, 8, 60, 8, 62, 8, 58, 8, 61, 16]) }
      };
      return {
        tempo: 138, ordre: ['A', 'A', 'B', 'C', 'A', 'B'], sections: S,
        pas: function (v, s, barre, i, t, dt) {
          var a = A[s.acc[barre]], n = s.lead[barre * 16 + i];
          if (n) note(v, { m: n[0], t: t, d: n[1] * dt * 0.95, v: s.plein ? 0.22 : 0.18, duty: 0.25, vib: true });
          // La seconde voix double la melodie a la tierce dessous, dans le refrain.
          if (n && s === S.B) note(v, { m: n[0] - 4, t: t, d: n[1] * dt * 0.9, v: 0.08, duty: 0.5 });
          // L'arpege des cuivres, en croches.
          if (s.plein && i % 2 === 0) note(v, { m: a.tri[(i / 2) % 3] + (i >= 8 ? 12 : 0), t: t, d: dt * 1.6, v: 0.06, duty: 0.125, pince: true });
          // La basse en octaves.
          if (i % 2 === 0) note(v, { m: a.b + (i % 4 === 2 ? 12 : 0), t: t, d: dt * 1.8, v: 0.3, type: 'triangle' });
          // La batterie.
          if (s.plein) {
            if (i === 0 || i === 8 || (s === S.B && i === 6)) grosse(v, t, 0.55);
            if (i === 4 || i === 12) caisse(v, t, 0.32);
            if (i % 2 === 0) charley(v, t, 0.07);
            if (barre === 3 && i === 12) roulement(v, t, dt * 4, 0.3);
          } else {
            if (i % 4 === 0) caisse(v, t, 0.16);
            if (i === 14) caisse(v, t, 0.1);
            if (i === 0) grosse(v, t, 0.4);
          }
        }
      };
    })(),

    // ---------- Fish n'Der : le calypso du lac ----------
    'peche': (function () {
      var A = {
        F: { tri: [65, 69, 72], b: 41 }, Bb: { tri: [65, 70, 74], b: 46 }, C: { tri: [64, 67, 72], b: 36 },
        Dm: { tri: [62, 65, 69], b: 38 }, Gm: { tri: [62, 67, 70], b: 43 }
      };
      var S = {
        A: { acc: ['F', 'Bb', 'C', 'F'],
             lead: deplier([72, 2, 74, 2, 77, 4, 74, 2, 72, 2, 69, 4,
                            70, 2, 74, 2, 77, 2, 74, 2, 72, 4, 70, 4,
                            67, 2, 69, 2, 72, 2, 76, 2, 79, 4, 76, 2, 74, 2,
                            77, 6, 72, 2, 69, 4, null, 4]) },
        B: { acc: ['Dm', 'Gm', 'C', 'F'],
             lead: deplier([74, 3, 72, 1, 69, 4, 65, 2, 69, 2, 74, 4,
                            74, 3, 72, 1, 70, 4, 67, 4, 70, 4,
                            72, 2, 74, 2, 76, 2, 79, 2, 81, 4, 79, 4,
                            77, 8, null, 8]) },
        // Le calme : la ligne attend que ca morde.
        C: { acc: ['Bb', 'F', 'C', 'F'], calme: true,
             lead: deplier([74, 8, 72, 8, 69, 16, 67, 8, 72, 8, 65, 16]) }
      };
      return {
        tempo: 104, swing: 0.3, ordre: ['A', 'B', 'A', 'C'], sections: S,
        pas: function (v, s, barre, i, t, dt) {
          var a = A[s.acc[barre]], n = s.lead[barre * 16 + i];
          if (n) note(v, { m: n[0], t: t, d: n[1] * dt * 0.9, v: s.calme ? 0.13 : 0.17, duty: 0.125, vib: true });
          // Le marimba : les notes de l'accord, pincees, en contretemps.
          if (i % 4 === 2) note(v, { m: a.tri[(i / 4 | 0) % 3] + 12, t: t, d: dt * 2, v: s.calme ? 0.07 : 0.1, type: 'sine', pince: true });
          if (!s.calme && i % 8 === 6) note(v, { m: a.tri[2] + 12, t: t, d: dt * 2, v: 0.07, type: 'sine', pince: true });
          // La basse : fondamentale, quinte, et une note de passage.
          if (i === 0) note(v, { m: a.b, t: t, d: dt * 3.5, v: 0.32, type: 'triangle' });
          if (i === 8) note(v, { m: a.b + 7, t: t, d: dt * 3, v: 0.28, type: 'triangle' });
          if (i === 12 && !s.calme) note(v, { m: a.b + 9, t: t, d: dt * 1.8, v: 0.24, type: 'triangle' });
          // Les percussions de plage.
          if (i % 2 === 0) shaker(v, t, i % 4 === 2 ? 0.07 : 0.035);
          if (!s.calme && (i === 4 || i === 12)) bloc(v, t, 0.12);
          if (!s.calme && i === 10) bloc(v, t, 0.08, 79);
          if (i === 0) grosse(v, t, s.calme ? 0.2 : 0.32);
        }
      };
    })(),

    // ---------- The Odyssey of Dinder : le voyage ----------
    'odyssee': (function () {
      var A = {
        Em: { tri: [64, 67, 71], b: 40 }, C: { tri: [60, 64, 67], b: 36 }, G: { tri: [62, 67, 71], b: 43 },
        D: { tri: [62, 66, 69], b: 38 }, Am: { tri: [60, 64, 69], b: 33 }, B: { tri: [59, 63, 66], b: 35 }
      };
      var S = {
        // L'ouverture : l'espace, rien que les arpeges et la basse.
        I: { acc: ['Em', 'C', 'Am', 'B'], vide: true, lead: {} },
        A: { acc: ['Em', 'C', 'G', 'D'],
             lead: deplier([76, 8, 79, 4, 83, 4,
                            81, 8, 79, 4, 76, 4,
                            74, 4, 79, 4, 83, 4, 86, 4,
                            81, 8, 78, 8]) },
        B: { acc: ['Am', 'C', 'D', 'B'],
             lead: deplier([76, 4, 81, 4, 84, 8,
                            83, 4, 79, 4, 76, 8,
                            78, 4, 81, 4, 86, 4, 85, 4,
                            83, 12, null, 4]) }
      };
      return {
        tempo: 120, ordre: ['I', 'A', 'B', 'A', 'I', 'B'], sections: S,
        pas: function (v, s, barre, i, t, dt) {
          var a = A[s.acc[barre]], n = s.lead[barre * 16 + i];
          if (n) {
            var g = note(v, { m: n[0], t: t, d: n[1] * dt * 0.95, v: 0.16, duty: 0.5, vib: true, att: 0.03 });
            g.connect(echo);
          }
          // Les arpeges qui filent, en doubles-croches, renvoyes par l'echo.
          var arp = a.tri.concat([a.tri[0] + 12]);
          var ga = note(v, { m: arp[i % 4] + 12, t: t, d: dt * 0.9, v: s.vide ? 0.07 : 0.05, duty: 0.25, pince: true });
          ga.connect(echo);
          // La basse tenue.
          if (i === 0) note(v, { m: a.b, t: t, d: dt * 7.6, v: 0.3, type: 'triangle' });
          if (i === 8) note(v, { m: a.b + (s.vide ? 0 : 7), t: t, d: dt * 7.6, v: 0.26, type: 'triangle' });
          // La batterie, en demi-mesure : grosse caisse, caisse au milieu.
          if (!s.vide) {
            if (i === 0 || i === 10) grosse(v, t, 0.45);
            if (i === 8) caisse(v, t, 0.24);
            charley(v, t, i % 4 === 2 ? 0.06 : 0.025);
            if (barre === 3 && i >= 12) tom(v, t, 0.22, 52 - (i - 12) * 3);
          } else if (i === 0 && barre % 2 === 0) {
            grosse(v, t, 0.25);
          }
        }
      };
    })()
  };

  // ==========================================================
  //  Les mondes de l'Odyssee : un morceau par planete
  // ==========================================================
  // Chaque astre a sa fiche : un mode, une tonique, un tempo, une
  // grille d'accords, et sa facon de jouer (les arpeges, la basse, la
  // batterie). La melodie s'ecrit toute seule a partir d'une graine tiree
  // du nom de l'astre : toujours la meme pour un monde, jamais la meme
  // d'un monde a l'autre.
  var MODES = {
    min: [0, 2, 3, 5, 7, 8, 10], dor: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10],
    lyd: [0, 2, 4, 6, 7, 9, 11], maj: [0, 2, 4, 5, 7, 9, 11], mixo: [0, 2, 4, 5, 7, 9, 10],
    harm: [0, 2, 3, 5, 7, 8, 11], hijaz: [0, 1, 4, 5, 7, 8, 10], loc: [0, 1, 3, 5, 6, 8, 10],
    ton: [0, 2, 4, 6, 8, 10]
  };

  // lead : timbre de la melodie (rapport cyclique, ou 'sine'/'triangle').
  // densite : 0 (rare) a 2 (bavarde).
  var PLANETES = {
    mercure: { tonique: 64, mode: 'phryg', tempo: 150, lead: 0.125, densite: 2, arp: 'rapide', basse: 'pulse', batterie: 'rapide', A: [0, 1, 0, 6], B: [3, 1, 5, 0] },
    venus:   { tonique: 61, mode: 'harm', tempo: 92, lead: 0.5, glisse: true, densite: 1, arp: 'alterne', basse: 'octaves', batterie: 'lourde', A: [0, 5, 1, 0], B: [3, 4, 5, 4] },
    terre:   { tonique: 67, mode: 'maj', tempo: 108, swing: 0.2, lead: 0.25, densite: 1, arp: 'accords', basse: 'marche', batterie: 'douce', A: [0, 4, 5, 3], B: [3, 0, 4, 4] },
    lune:    { tonique: 62, mode: 'dor', tempo: 72, lead: 'sine', densite: 0, arp: 'cloches', basse: 'tenue', batterie: 'aucune', echo: true, A: [0, 6, 5, 6], B: [3, 2, 0, 0] },
    mars:    { tonique: 62, mode: 'dor', tempo: 112, lead: 0.25, densite: 1, arp: 'alterne', basse: 'octaves', batterie: 'marche', A: [0, 6, 0, 4], B: [3, 2, 6, 4] },
    jupiter: { tonique: 53, mode: 'mixo', tempo: 84, lead: 0.5, double: true, densite: 0, arp: 'accords', basse: 'tenue', batterie: 'tribal', A: [0, 6, 3, 0], B: [5, 6, 0, 0] },
    saturne: { tonique: 69, mode: 'lyd', tempo: 96, lead: 'triangle', densite: 1, arp: 'cloches', basse: 'tenue', batterie: 'douce', echo: true, A: [0, 1, 0, 1], B: [4, 1, 5, 4] },
    uranus:  { tonique: 66, mode: 'min', tempo: 126, lead: 0.125, densite: 1, arp: 'rapide', son: 'sine', basse: 'tenue', batterie: 'glitch', A: [0, 5, 2, 6], B: [3, 4, 0, 0] },
    neptune: { tonique: 58, mode: 'min', tempo: 76, lead: 'triangle', densite: 0, arp: 'vague', basse: 'tenue', batterie: 'lente', echo: true, A: [0, 5, 3, 4], B: [5, 3, 0, 4] },
    cryos:   { tonique: 71, mode: 'dor', tempo: 100, lead: 'sine', densite: 1, arp: 'cloches', basse: 'tenue', batterie: 'aucune', echo: true, A: [0, 4, 5, 1], B: [3, 1, 4, 4] },
    opaline: { tonique: 65, mode: 'maj', tempo: 88, lead: 0.125, densite: 1, arp: 'vague', basse: 'tenue', batterie: 'douce', echo: true, A: [0, 2, 3, 4], B: [5, 3, 1, 4] },
    altera:  { tonique: 63, mode: 'ton', tempo: 98, lead: 'triangle', densite: 1, arp: 'descend', basse: 'tenue', batterie: 'douce', echo: true, A: [0, 1, 0, 2], B: [3, 2, 1, 0] },
    viridia: { tonique: 64, mode: 'dor', tempo: 118, swing: 0.25, lead: 0.25, densite: 2, arp: 'accords', basse: 'marche', batterie: 'tribal', A: [0, 3, 0, 6], B: [5, 6, 0, 0] },
    ferron:  { tonique: 57, mode: 'phryg', tempo: 132, lead: 0.25, densite: 1, arp: 'aucun', basse: 'pulse', batterie: 'indus', A: [0, 0, 1, 0], B: [5, 6, 1, 0] },
    brisure: { tonique: 60, mode: 'loc', tempo: 140, lead: 0.125, densite: 2, arp: 'rapide', basse: 'pulse', batterie: 'glitch', A: [0, 1, 4, 0], B: [5, 1, 3, 1] },
    pyrrhe:  { tonique: 62, mode: 'hijaz', tempo: 104, swing: 0.25, lead: 0.5, densite: 1, arp: 'alterne', basse: 'marche', batterie: 'tribal', A: [0, 1, 0, 6], B: [5, 6, 1, 0] },
    aurelle: { tonique: 69, mode: 'lyd', tempo: 78, lead: 'sine', densite: 0, arp: 'vague', basse: 'tenue', batterie: 'aucune', echo: true, A: [0, 4, 1, 5], B: [3, 1, 4, 0] },
    ignis:   { tonique: 52, mode: 'phryg', tempo: 160, lead: 0.5, densite: 2, arp: 'rapide', basse: 'pulse', batterie: 'rapide', A: [0, 1, 0, 6], B: [5, 6, 1, 0] }
  };

  // Le hasard rejouable : une graine, toujours la meme suite.
  function graine(txt) {
    var h = 2166136261;
    for (var i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h = (h + 0x6D2B79F5) | 0;
      var t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Les rythmes d'une mesure, en doubles-croches (seize au total).
  var RYTHMES = [
    [[8, 8], [4, 4, 8], [12, 4], [6, 2, 8], [4, 12]],
    [[4, 2, 2, 4, 4], [4, 4, 2, 2, 4], [6, 2, 4, 4], [2, 2, 4, 8], [3, 1, 4, 4, 4]],
    [[2, 2, 2, 2, 2, 2, 4], [2, 2, 4, 2, 2, 4], [3, 1, 2, 2, 4, 4], [1, 1, 2, 2, 2, 2, 2, 4], [2, 1, 1, 4, 2, 2, 4]]
  ];

  function morceauPlanete(id) {
    var P = PLANETES[id];
    if (!P) return null;
    var echelle = MODES[P.mode], N = echelle.length, R = P.tonique;
    function hauteur(deg) {
      var o = Math.floor(deg / N);
      return R + echelle[((deg % N) + N) % N] + 12 * o;
    }
    // Un accord : la fondamentale, la tierce, la quinte du mode.
    function accord(deg) {
      return { tri: [hauteur(deg), hauteur(deg + 2), hauteur(deg + 4)], b: hauteur(deg) - 24, deg: deg };
    }
    var hasard = graine('odyssee-' + id);
    function pioche(liste) { return liste[Math.floor(hasard() * liste.length)]; }

    // La melodie d'une section : la meme cellule rythmique revient aux
    // mesures 1 et 3, la derniere mesure se pose sur la tonique de
    // l'accord.
    function ecrire(grille, haut) {
      var table = {}, prec = N + 2 + (haut ? N : 0);
      var motif = pioche(RYTHMES[P.densite]), autre = pioche(RYTHMES[Math.max(0, P.densite - (hasard() < 0.5 ? 1 : 0))]);
      for (var barre = 0; barre < 4; barre++) {
        var ry = barre === 3 ? pioche(RYTHMES[0]) : barre % 2 === 0 ? motif : autre;
        var pas = 0, c = grille[barre];
        for (var k = 0; k < ry.length; k++) {
          var deg;
          var dernier = barre === 3 && k === ry.length - 1;
          if (dernier) deg = c + N + (haut ? N : 0);
          else if (k === 0 || pas % 8 === 0) {
            // Sur le temps fort : la note de l'accord la plus proche.
            var tons = [c, c + 2, c + 4, c + N, c + N + 2, c + N + 4, c + 2 * N];
            deg = tons.reduce(function (m, d) { return Math.abs(d - prec) < Math.abs(m - prec) ? d : m; }, tons[0]);
          } else {
            deg = prec + pioche([-2, -1, -1, 1, 1, 2, 0]);
          }
          deg = Math.max(N - 2, Math.min(N * 3, deg));
          // Un silence de temps en temps, jamais sur le temps fort.
          if (!dernier && pas % 8 !== 0 && hasard() < 0.12) { pas += ry[k]; continue; }
          table[barre * 16 + pas] = [hauteur(deg), ry[k]];
          prec = deg;
          pas += ry[k];
        }
      }
      return table;
    }

    var accA = P.A.map(accord), accB = P.B.map(accord);
    var S = {
      I: { acc: accA, vide: true, lead: {} },
      A: { acc: accA, lead: ecrire(P.A, false) },
      B: { acc: accB, lead: ecrire(P.B, false) },
      C: { acc: accA, lead: ecrire(P.A, true), haut: true }
    };
    // Le motif de la batterie cassee, tire une fois pour toutes.
    var glitch = [];
    for (var gi = 0; gi < 16; gi++) glitch.push(hasard());

    return {
      tempo: P.tempo, swing: P.swing || 0, ordre: ['I', 'A', 'B', 'A', 'C', 'B'], sections: S, echo: !!P.echo,
      pas: function (v, s, barre, i, t, dt) {
        var a = s.acc[barre], n = s.lead[barre * 16 + i];
        var arp = a.tri.concat([a.tri[0] + 12]);
        // La melodie.
        if (n) {
          var o = { m: n[0], t: t, d: n[1] * dt * 0.92, v: 0.15, vib: true, att: 0.02 };
          if (typeof P.lead === 'number') o.duty = P.lead; else o.type = P.lead;
          if (o.type === 'sine' || o.type === 'triangle') o.v = 0.2;
          if (P.glisse && n[1] >= 4) o.glisse = -0.6;
          var g = note(v, o);
          if (P.echo) g.connect(echo);
          if (P.double) note(v, { m: n[0] - 12, t: t, d: n[1] * dt * 0.9, v: 0.09, duty: 0.25 });
        }
        // Les arpeges.
        var son = P.son || 'sine', va = s.vide ? 1.4 : 1, ga = null;
        switch (P.arp) {
          case 'rapide':
            ga = note(v, { m: arp[i % 4] + 12, t: t, d: dt * 0.8, v: 0.045 * va, duty: P.son ? undefined : 0.25, type: P.son, pince: true });
            break;
          case 'alterne':
            if (i % 2 === 0) ga = note(v, { m: arp[(i / 2) % 4] + 12, t: t, d: dt * 1.6, v: 0.055 * va, duty: 0.125, pince: true });
            break;
          case 'accords':
            if (i % 4 === 2) ga = note(v, { m: a.tri[(i / 4 | 0) % 3] + 12, t: t, d: dt * 2, v: 0.09 * va, type: 'sine', pince: true });
            if (i % 8 === 6) note(v, { m: a.tri[2] + 12, t: t, d: dt * 2, v: 0.06 * va, type: 'sine', pince: true });
            break;
          case 'cloches':
            if (i % 4 === 0 || i % 8 === 6) ga = note(v, { m: arp[(i / 2 | 0) % 4] + 24, t: t, d: dt * 6, v: 0.06 * va, type: son, pince: true });
            break;
          case 'vague':
            if (i % 2 === 0) ga = note(v, { m: arp[[0, 1, 2, 3, 2, 1, 0, 1][(i / 2) % 8]] + 12, t: t, d: dt * 2.5, v: 0.06 * va, type: 'sine', pince: true });
            break;
          case 'descend':
            if (i % 2 === 0) ga = note(v, { m: arp[3 - (i / 2) % 4] + 12, t: t, d: dt * 2, v: 0.06 * va, type: 'triangle', pince: true });
            break;
        }
        if (ga && P.echo) ga.connect(echo);
        // La basse.
        switch (P.basse) {
          case 'tenue':
            if (i === 0) note(v, { m: a.b, t: t, d: dt * 15, v: 0.28, type: 'triangle' });
            break;
          case 'octaves':
            if (i % 2 === 0) note(v, { m: a.b + (i % 4 === 2 ? 12 : 0), t: t, d: dt * 1.8, v: 0.26, type: 'triangle' });
            break;
          case 'marche':
            if (i === 0) note(v, { m: a.b, t: t, d: dt * 3.5, v: 0.3, type: 'triangle' });
            if (i === 8) note(v, { m: a.b + 7, t: t, d: dt * 3, v: 0.26, type: 'triangle' });
            if (i === 12) note(v, { m: a.b + 12, t: t, d: dt * 1.8, v: 0.22, type: 'triangle' });
            break;
          case 'pulse':
            if (i % 2 === 0) note(v, { m: a.b + (i % 8 === 6 ? 12 : 0), t: t, d: dt * 1.2, v: 0.26, type: 'triangle', pince: true });
            break;
        }
        // La batterie.
        if (s.vide) {
          if (i === 0 && barre % 2 === 0 && P.batterie !== 'aucune') grosse(v, t, 0.25);
          return;
        }
        switch (P.batterie) {
          case 'douce':
            if (i === 0) grosse(v, t, 0.32);
            if (i === 8) caisse(v, t, 0.12);
            if (i % 4 === 2) charley(v, t, 0.035);
            break;
          case 'lourde':
            if (i === 0 || i === 6) grosse(v, t, 0.55);
            if (i === 8) caisse(v, t, 0.3);
            if (i % 4 === 2) charley(v, t, 0.05);
            break;
          case 'marche':
            if (i === 0 || i === 8) grosse(v, t, 0.45);
            if (i === 4 || i === 12) caisse(v, t, 0.26);
            if (i % 2 === 0) charley(v, t, 0.05);
            if (barre === 3 && i === 12) roulement(v, t, dt * 4, 0.24);
            break;
          case 'rapide':
            if (i % 4 === 0) grosse(v, t, 0.5);
            if (i === 4 || i === 12) caisse(v, t, 0.3);
            charley(v, t, i % 2 ? 0.025 : 0.05);
            break;
          case 'tribal':
            if (i === 0 || i === 10) grosse(v, t, 0.4);
            if (i === 3 || i === 6) tom(v, t, 0.24, 50);
            if (i === 12) tom(v, t, 0.2, 45);
            if (i % 2 === 0) shaker(v, t, i % 4 === 2 ? 0.06 : 0.03);
            if (i === 14) bloc(v, t, 0.08, 79);
            break;
          case 'indus':
            if (i % 4 === 0) grosse(v, t, 0.6);
            if (i === 4 || i === 12) { caisse(v, t, 0.32); bloc(v, t, 0.07, 98); }
            if (i % 2 === 1) charley(v, t, 0.05);
            break;
          case 'glitch':
            if (glitch[i] < 0.3 || i === 0) grosse(v, t, 0.45);
            else if (glitch[i] > 0.8) caisse(v, t, 0.22);
            if (glitch[(i + barre) % 16] > 0.55) charley(v, t, 0.04);
            if (barre === 3 && i >= 12 && glitch[i] > 0.5) bloc(v, t, 0.06, 90 + i);
            break;
          case 'lente':
            if (i === 0) grosse(v, t, 0.35);
            if (i === 10) tom(v, t, 0.18, 43);
            if (i === 8) shaker(v, t, 0.04);
            break;
        }
      }
    };
  }

  function morceau(nom) {
    if (MORCEAUX[nom]) return MORCEAUX[nom];
    var m = /^planete-(.+)$/.exec(nom);
    if (m) { var p = morceauPlanete(m[1]); if (p) MORCEAUX[nom] = p; return p; }
    return null;
  }

  // ==========================================================
  //  Le lecteur
  // ==========================================================

  var courant = null;

  function lancer(nom) {
    if (courant && courant.nom === nom) return;
    arreter(0.8);
    if (!pret()) return;
    var M = morceau(nom);
    if (!M) return;
    var sortie = ac.createGain();
    var t0 = ac.currentTime + 0.1;
    sortie.gain.setValueAtTime(0.0001, t0);
    sortie.gain.exponentialRampToValueAtTime(1, t0 + 1.5);
    sortie.connect(maitre);
    var lecture = { nom: nom, sortie: sortie, pas: 0, prochain: t0 };
    // Le delai de l'echo suit le tempo : une croche pointee.
    echo.delayTime.setValueAtTime(60 / M.tempo * 0.75, t0);
    lecture.minuteur = setInterval(function () {
      var dt = 60 / M.tempo / 4;
      while (lecture.prochain < ac.currentTime + 0.2) {
        var p = lecture.pas, i = p % 16, barre = Math.floor(p / 16) % 4;
        var s = M.sections[M.ordre[Math.floor(p / 64) % M.ordre.length]];
        // Le balancement : les contretemps arrivent un peu en retard.
        var t = lecture.prochain + (M.swing && i % 4 === 2 ? dt * M.swing : 0);
        try { M.pas(sortie, s, barre, i, t, dt); } catch (e) {}
        lecture.prochain += dt;
        lecture.pas++;
      }
    }, 30);
    courant = lecture;
  }

  function arreter(duree) {
    if (!courant) return;
    var c = courant;
    courant = null;
    clearInterval(c.minuteur);
    var t = ac.currentTime;
    c.sortie.gain.cancelScheduledValues(t);
    c.sortie.gain.setValueAtTime(Math.max(0.0001, c.sortie.gain.value), t);
    c.sortie.gain.exponentialRampToValueAtTime(0.0001, t + (duree || 0.6));
    setTimeout(function () { try { c.sortie.disconnect(); } catch (e) {} }, ((duree || 0.6) + 0.5) * 1000);
  }

  // ---------- Quel jeu est a l'ecran ----------
  // Les ecrans annexes d'un jeu gardent sa musique. L'Armurerie est
  // commune a la peche et a l'Odyssee : elle garde celle qui jouait.
  var JEU_DE = {
    'founder-war': 'founder-war',
    'peche': 'peche', 'peche-hub': 'peche', 'poissonnerie': 'peche', 'vestiaire': 'peche', 'peche-collection': 'peche',
    'odyssee': 'odyssee', 'odyssee-equipier': 'odyssee', 'odyssee-carnet': 'odyssee'
  };

  function rubrique() { return (location.hash || '').replace(/^#/, '').split('/')[0]; }

  // Sur un monde de l'Odyssee, c'est le morceau de la planete qui joue :
  // l'ecran du monde le dit lui-meme (l'adresse ne porte pas toujours le
  // nom de l'astre, quand on reprend une partie).
  var planete = null;

  function suivre() {
    var r = rubrique();
    if (r === 'armurerie' && courant) return;
    if (r !== 'odyssee') { planete = null; sousLEau(false); }
    var jeu = JEU_DE[r];
    if (jeu === 'odyssee' && planete) jeu = 'planete-' + planete;
    if (jeu) lancer(jeu); else arreter(0.8);
  }

  function choisirPlanete(id) {
    planete = PLANETES[id] ? id : null;
    if (rubrique() === 'odyssee') lancer(planete ? 'planete-' + planete : 'odyssee');
  }

  // Plonger : la musique et les bruitages passent sous la surface.
  var plonge = false;
  function sousLEau(oui) {
    oui = !!oui;
    if (oui === plonge) return;
    plonge = oui;
    if (!ac || !filtre) return;
    var t = ac.currentTime;
    filtre.frequency.cancelScheduledValues(t);
    filtre.frequency.setValueAtTime(filtre.frequency.value, t);
    filtre.frequency.exponentialRampToValueAtTime(oui ? 520 : 20000, t + (oui ? 0.25 : 0.6));
  }

  // Pour les bruitages des jeux : le contexte, et la sortie qui suit le
  // volume, la coupure et le filtre de la plongee.
  function audio() {
    if (!pret()) return null;
    return { ac: ac, sortie: sfx, bruit: bruitBuf };
  }

  window.addEventListener('hashchange', suivre);
  // Arrive directement dans un jeu, le son attend le premier geste.
  function premierGeste() {
    window.removeEventListener('pointerdown', premierGeste, true);
    window.removeEventListener('keydown', premierGeste, true);
    if (JEU_DE[rubrique()]) { if (!courant) suivre(); else pret(); }
  }
  window.addEventListener('pointerdown', premierGeste, true);
  window.addEventListener('keydown', premierGeste, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', suivre);
  else suivre();

  function basculerMuet() {
    muet = !muet;
    try { localStorage.setItem('dinderpad.musique.muet', muet ? '1' : '0'); } catch (e) {}
    if (ac && maitre) {
      var t = ac.currentTime;
      maitre.gain.cancelScheduledValues(t);
      maitre.gain.setValueAtTime(maitre.gain.value, t);
      maitre.gain.linearRampToValueAtTime(muet ? 0 : VOLUME, t + 0.3);
      sfx.gain.cancelScheduledValues(t);
      sfx.gain.setValueAtTime(sfx.gain.value, t);
      sfx.gain.linearRampToValueAtTime(muet ? 0 : VOLUME_SFX, t + 0.3);
    }
    return muet;
  }

  window.MUSIQUE_JEUX = {
    muet: function () { return muet; }, basculerMuet: basculerMuet,
    enCours: function () { return courant ? courant.nom : null; },
    arreter: arreter, lancer: lancer, MORCEAUX: MORCEAUX,
    planete: choisirPlanete, sousLEau: sousLEau, audio: audio,
    PLANETES: PLANETES
  };
})();
