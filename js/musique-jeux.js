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
  var ac = null, maitre = null, bruitBuf = null, echo = null;
  var VOLUME = 0.2;
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
      maitre.connect(comp); comp.connect(ac.destination);
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
  //  Le lecteur
  // ==========================================================

  var courant = null;

  function lancer(nom) {
    if (courant && courant.nom === nom) return;
    arreter(0.8);
    if (!pret()) return;
    var M = MORCEAUX[nom];
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

  function suivre() {
    var r = rubrique();
    if (r === 'armurerie' && courant) return;
    var jeu = JEU_DE[r];
    if (jeu) lancer(jeu); else arreter(0.8);
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
    }
    return muet;
  }

  window.MUSIQUE_JEUX = {
    muet: function () { return muet; }, basculerMuet: basculerMuet,
    enCours: function () { return courant ? courant.nom : null; },
    arreter: arreter, lancer: lancer, MORCEAUX: MORCEAUX
  };
})();
