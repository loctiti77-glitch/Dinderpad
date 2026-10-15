// Wade and Friends : le son.
//
// Tout est synthetise : pas un fichier a charger. Le contexte audio ne
// nait qu'au premier clic, comme l'exigent les navigateurs. Les sons qui
// durent (le ventilateur, le bourdon de la lampe, la neige des cameras)
// rendent une poignee qu'on arrete quand il faut.
(function () {

  function hasard(a, b) { return a + Math.random() * (b - a); }

  function creerSon() {
    var ac = null, maitre = null, bruitBuf = null, muet = false;
    var continus = [];

    function pret() {
      if (ac) return true;
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return false;
      try { ac = new C(); } catch (e) { return false; }
      maitre = ac.createGain();
      maitre.gain.value = muet ? 0 : 0.8;
      maitre.connect(ac.destination);
      bruitBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      var d = bruitBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }
    function ok() { return pret() && ac.state !== 'closed'; }

    function bruit(t0, duree, filtre, freq, vol, q, sortie) {
      var s = ac.createBufferSource();
      s.buffer = bruitBuf; s.loop = true;
      var f = ac.createBiquadFilter();
      f.type = filtre; f.frequency.value = freq; f.Q.value = q || 1;
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
      s.connect(f); f.connect(g); g.connect(sortie || maitre);
      s.start(t0, Math.random()); s.stop(t0 + duree + 0.05);
      return { f: f, g: g };
    }

    function ton(t0, duree, type, freq, vol, glisse, sortie) {
      var o = ac.createOscillator();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (glisse) o.frequency.exponentialRampToValueAtTime(glisse, t0 + duree);
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
      o.connect(g); g.connect(sortie || maitre);
      o.start(t0); o.stop(t0 + duree + 0.05);
      return o;
    }

    // Un son place a gauche (-1) ou a droite (1) : on entend de quel cote
    // ca vient.
    function cote(pan) {
      if (!pan || !ac.createStereoPanner) return maitre;
      var p = ac.createStereoPanner();
      p.pan.value = pan;
      p.connect(maitre);
      return p;
    }

    // Un son continu : des sources qui tournent jusqu'a ce qu'on les coupe,
    // avec un fondu pour ne pas claquer.
    function continu(noeuds, gain) {
      var h = {
        fini: false,
        arreter: function (sec) {
          if (h.fini) return;
          h.fini = true;
          var t = ac.currentTime;
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + (sec || 0.08));
          setTimeout(function () {
            noeuds.forEach(function (n) { try { n.stop(); } catch (e) {} });
            gain.disconnect();
          }, ((sec || 0.08) + 0.1) * 1000);
        }
      };
      continus.push(h);
      return h;
    }

    var RIEN = { arreter: function () {}, fini: true };

    var S = {
      reveiller: function () { if (ok() && ac.state === 'suspended') ac.resume(); },
      muet: function (m) { muet = m; if (maitre) maitre.gain.value = m ? 0 : 0.8; },
      estMuet: function () { return muet; },

      // Le ventilateur du bureau, et le ronron du batiment.
      ventilateur: function () {
        if (!ok()) return RIEN;
        var t = ac.currentTime;
        var g = ac.createGain(); g.gain.value = 0.0001;
        g.gain.exponentialRampToValueAtTime(1, t + 1.5);
        g.connect(maitre);
        var s = ac.createBufferSource(); s.buffer = bruitBuf; s.loop = true;
        var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 380; f.Q.value = 0.7;
        var gs = ac.createGain(); gs.gain.value = 0.05;
        // Le souffle des pales, qui bat doucement.
        var lfo = ac.createOscillator(); lfo.frequency.value = 7.5;
        var lg = ac.createGain(); lg.gain.value = 0.018;
        lfo.connect(lg); lg.connect(gs.gain);
        s.connect(f); f.connect(gs); gs.connect(g);
        var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 60;
        var fo = ac.createBiquadFilter(); fo.type = 'lowpass'; fo.frequency.value = 150;
        var go = ac.createGain(); go.gain.value = 0.03;
        o.connect(fo); fo.connect(go); go.connect(g);
        s.start(t); lfo.start(t); o.start(t);
        return continu([s, lfo, o], g);
      },
      // Le bourdon du neon du couloir, tant que la lumiere est allumee.
      bourdon: function () {
        if (!ok()) return RIEN;
        var t = ac.currentTime;
        var g = ac.createGain(); g.gain.value = 0.0001;
        g.gain.exponentialRampToValueAtTime(1, t + 0.04);
        g.connect(maitre);
        var o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 120;
        var o2 = ac.createOscillator(); o2.type = 'square'; o2.frequency.value = 240;
        var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2;
        var go = ac.createGain(); go.gain.value = 0.05;
        o1.connect(f); o2.connect(f); f.connect(go); go.connect(g);
        var s = ac.createBufferSource(); s.buffer = bruitBuf; s.loop = true;
        var fs = ac.createBiquadFilter(); fs.type = 'highpass'; fs.frequency.value = 5000;
        var gs = ac.createGain(); gs.gain.value = 0.02;
        s.connect(fs); fs.connect(gs); gs.connect(g);
        o1.start(t); o2.start(t); s.start(t);
        return continu([o1, o2, s], g);
      },
      // La neige des cameras, tant que la tablette est levee.
      neige: function () {
        if (!ok()) return RIEN;
        var t = ac.currentTime;
        var g = ac.createGain(); g.gain.value = 0.0001;
        g.gain.exponentialRampToValueAtTime(1, t + 0.1);
        g.connect(maitre);
        var s = ac.createBufferSource(); s.buffer = bruitBuf; s.loop = true;
        var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.4;
        var gs = ac.createGain(); gs.gain.value = 0.022;
        s.connect(f); f.connect(gs); gs.connect(g);
        var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 15600;
        var go = ac.createGain(); go.gain.value = 0.006;
        o.connect(go); go.connect(g);
        s.start(t); o.start(t);
        return continu([s, o], g);
      },
      // Un sursaut de neige, quand on change de camera.
      grain: function () {
        if (!ok()) return;
        bruit(ac.currentTime, 0.22, 'bandpass', 1800, 0.12, 0.5);
      },
      tablette: function (monte) {
        if (!ok()) return;
        var t = ac.currentTime;
        bruit(t, 0.18, 'lowpass', monte ? 1800 : 1100, 0.18);
        ton(t + 0.05, 0.08, 'square', monte ? 1500 : 900, 0.04);
      },
      porte: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        // Le rideau de fer : il glisse, puis tombe.
        var n = bruit(t, 0.3, 'bandpass', 700, 0.25, 1.2);
        n.f.frequency.linearRampToValueAtTime(300, t + 0.3);
        bruit(t + 0.28, 0.35, 'lowpass', 500, 0.7);
        ton(t + 0.28, 0.4, 'sine', 70, 0.7, 35);
      },
      bouton: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        ton(t, 0.04, 'square', 1200, 0.05);
        bruit(t, 0.04, 'highpass', 3000, 0.08);
      },
      refus: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        ton(t, 0.12, 'square', 180, 0.06);
        ton(t + 0.14, 0.12, 'square', 150, 0.06);
      },
      pas: function (vol, pan) {
        if (!ok()) return;
        var t = ac.currentTime, o = cote(pan);
        for (var i = 0; i < 3; i++) {
          bruit(t + i * 0.45, 0.16, 'lowpass', 280, 0.3 * (vol || 1), 1, o);
          ton(t + i * 0.45, 0.16, 'sine', 64, 0.3 * (vol || 1), 45, o);
        }
      },
      // La respiration d'une machine, de l'autre cote du mur.
      souffle: function (pan) {
        if (!ok()) return;
        var t = ac.currentTime, o = cote(pan);
        [0, 1.9].forEach(function (d) {
          var n = bruit(t + d, 1.6, 'bandpass', 700, 0.2, 2, o);
          n.f.frequency.setValueAtTime(700, t + d);
          n.f.frequency.linearRampToValueAtTime(360, t + d + 1.6);
        });
        ton(t, 3.4, 'sawtooth', 46, 0.05, 40, o);
      },
      // Wade change de piece : un hurlement de loup, au loin, faux.
      hurlement: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        var o = ac.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, t);
        o.frequency.linearRampToValueAtTime(330, t + 0.6);
        o.frequency.linearRampToValueAtTime(300, t + 1.6);
        o.frequency.linearRampToValueAtTime(190, t + 2.4);
        var vib = ac.createOscillator(); vib.frequency.value = 5.5;
        var vg = ac.createGain(); vg.gain.value = 7;
        vib.connect(vg); vg.connect(o.frequency);
        var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 4;
        var g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.4);
        g.gain.setValueAtTime(0.12, t + 1.8);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
        var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
        o.connect(f); f.connect(lp); lp.connect(g); g.connect(maitre);
        o.start(t); vib.start(t); o.stop(t + 2.6); vib.stop(t + 2.6);
        // Et un rire grave par-dessus, comme une machine qui s'enraye.
        for (var i = 0; i < 3; i++) {
          ton(t + 2.1 + i * 0.25, 0.2, 'sawtooth', 95 - i * 8, 0.12, 70 - i * 8);
        }
      },
      // Faith : un cri d'oiseau, rauque, qui se casse.
      cri: function (pan) {
        if (!ok()) return;
        var t = ac.currentTime, o = cote(pan);
        [0, 0.32].forEach(function (d) {
          var s = ac.createOscillator(); s.type = 'sawtooth';
          s.frequency.setValueAtTime(1400, t + d);
          s.frequency.exponentialRampToValueAtTime(700, t + d + 0.22);
          var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 3;
          var g = ac.createGain();
          g.gain.setValueAtTime(0.0001, t + d);
          g.gain.exponentialRampToValueAtTime(0.06, t + d + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.24);
          s.connect(f); f.connect(g); g.connect(o);
          s.start(t + d); s.stop(t + d + 0.3);
        });
      },
      // Charlie en cuisine : la plaque qui grille, les casseroles.
      cuisine: function (vol) {
        if (!ok()) return;
        var t = ac.currentTime;
        vol = vol || 1;
        bruit(t, 2.4, 'highpass', 3500, 0.05 * vol, 0.5);
        for (var i = 0; i < 3; i++) {
          var t1 = t + i * hasard(0.2, 0.5);
          ton(t1, 0.6, 'triangle', hasard(700, 1300), 0.07 * vol);
          ton(t1, 0.4, 'square', hasard(2000, 2900), 0.02 * vol);
          bruit(t1, 0.1, 'highpass', 4000, 0.09 * vol);
        }
      },
      // Stephen qui court dans le couloir : des pas mouilles, de plus en
      // plus pres.
      course: function () {
        if (!ok()) return;
        var t = ac.currentTime, o = cote(-0.7);
        for (var i = 0; i < 12; i++) {
          var v = 0.06 + i * 0.03;
          bruit(t + i * 0.25, 0.08, 'lowpass', 600, v, 1, o);
          bruit(t + i * 0.25 + 0.03, 0.05, 'bandpass', 2500, v * 0.4, 3, o);
        }
      },
      coups: function (pan) {
        if (!ok()) return;
        var t = ac.currentTime, o = cote(pan);
        for (var i = 0; i < 5; i++) {
          bruit(t + i * 0.18, 0.16, 'lowpass', 600, 0.65, 1, o);
          ton(t + i * 0.18, 0.2, 'sine', 80, 0.55, 45, o);
        }
      },
      griffe: function (pan) {
        if (!ok()) return;
        var t = ac.currentTime, o = cote(pan);
        for (var i = 0; i < 3; i++) {
          var n = bruit(t + i * 0.5, 0.42, 'bandpass', 3200, 0.18, 14, o);
          n.f.frequency.setValueAtTime(hasard(2600, 3600), t + i * 0.5);
          n.f.frequency.linearRampToValueAtTime(hasard(900, 1400), t + i * 0.5 + 0.4);
        }
      },
      // Un servomoteur qui force : la tete d'un animatronique qui tourne
      // d'un coup. vol : de 0 a 1, selon qu'on le voit de pres ou de loin.
      servo: function (vol, pan) {
        if (!ok()) return;
        var t = ac.currentTime, o = cote(pan);
        vol = vol == null ? 1 : vol;
        var x = ac.createOscillator(); x.type = 'sawtooth';
        var f0 = hasard(180, 260);
        x.frequency.setValueAtTime(f0, t);
        x.frequency.exponentialRampToValueAtTime(f0 * hasard(2, 2.8), t + 0.12);
        x.frequency.exponentialRampToValueAtTime(f0 * 1.4, t + 0.22);
        var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 3;
        var g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07 * vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
        x.connect(f); f.connect(g); g.connect(o);
        x.start(t); x.stop(t + 0.3);
        // Le claquement de l'arret, en butee.
        bruit(t + 0.22, 0.05, 'bandpass', 2500, 0.12 * vol, 4, o);
      },
      // Un indice : une note de boite a musique, lointaine, un peu fausse,
      // qui monte d'un cran a chaque pas juste. Et un souffle de statique.
      indice: function (n) {
        if (!ok()) return;
        var t = ac.currentTime;
        var f = [523, 587, 659, 784, 880, 988][Math.min(5, n || 0)];
        ton(t, 1.4, 'triangle', f * 2 * 1.006, 0.05);
        ton(t + 0.02, 1.0, 'sine', f * 4, 0.012);
        bruit(t, 0.25, 'bandpass', 2400, 0.05, 0.5);
      },
      // Le feu qui prend : un souffle qui s'embrase, puis des craquements.
      flamme: function (pan) {
        if (!ok()) return;
        var t = ac.currentTime, o = cote(pan);
        var n = bruit(t, 2.2, 'lowpass', 300, 0.4, 0.8, o);
        n.f.frequency.setValueAtTime(200, t);
        n.f.frequency.exponentialRampToValueAtTime(2400, t + 0.35);
        n.f.frequency.exponentialRampToValueAtTime(700, t + 2.2);
        for (var i = 0; i < 14; i++) bruit(t + 0.2 + Math.random() * 1.8, 0.03, 'highpass', 3000, 0.2 + Math.random() * 0.2, 1, o);
      },
      // L'ampoule qui gresille, puis qui eclate.
      gresille: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        for (var i = 0; i < 6; i++) { ton(t + i * 0.04, 0.03, 'square', hasard(1800, 3200), 0.04); bruit(t + i * 0.04, 0.03, 'highpass', 5000, 0.12); }
        ton(t, 0.4, 'sawtooth', 120, 0.05);
      },
      explosion: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        bruit(t, 0.08, 'highpass', 3000, 0.9);
        for (var i = 0; i < 12; i++) ton(t + 0.02 + Math.random() * 0.25, 0.08, 'triangle', hasard(2500, 5000), 0.05);
        var n = bruit(t, 2.5, 'lowpass', 1800, 0.8, 0.7);
        n.f.frequency.exponentialRampToValueAtTime(200, t + 2.5);
        ton(t, 1.2, 'sine', 70, 0.8, 30);
      },
      // L'alarme incendie, qui sonne dans tout le batiment.
      alarme: function (sec) {
        if (!ok()) return;
        var t = ac.currentTime;
        for (var k = 0; k < sec; k += 0.5) {
          ton(t + k, 0.22, 'square', 960, 0.06);
          ton(t + k + 0.25, 0.22, 'square', 770, 0.06);
        }
      },
      // Le marteau sur l'etabli : un choc de metal qui resonne.
      marteau: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        bruit(t, 0.06, 'bandpass', 2600, 0.5, 2);
        [1210, 1875, 2930].forEach(function (f, i) { ton(t, 0.5 - i * 0.1, 'sine', f, 0.07); });
        ton(t, 0.12, 'sine', 160, 0.3, 90);
      },
      // Le brasier : un grondement grave, des craquements sans fin.
      brasier: function () {
        if (!ok()) return RIEN;
        var t = ac.currentTime;
        var g = ac.createGain(); g.gain.value = 0.0001;
        g.gain.exponentialRampToValueAtTime(1, t + 1.5);
        g.connect(maitre);
        var s = ac.createBufferSource(); s.buffer = bruitBuf; s.loop = true;
        var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
        var gs = ac.createGain(); gs.gain.value = 0.35;
        var lfo = ac.createOscillator(); lfo.frequency.value = 0.7;
        var lg = ac.createGain(); lg.gain.value = 180;
        lfo.connect(lg); lg.connect(f.frequency);
        s.connect(f); f.connect(gs); gs.connect(g);
        s.start(t); lfo.start(t);
        var fini = false;
        (function craque() {
          if (fini) return;
          if (ac.state !== 'closed') bruit(ac.currentTime, 0.03, 'highpass', 2500, 0.25 + Math.random() * 0.3, 1, g);
          setTimeout(craque, 40 + Math.random() * 160);
        })();
        var c = continu([s, lfo], g), stop = c.arreter;
        c.arreter = function (sec) { fini = true; stop(sec); };
        return c;
      },
      // Il nous regarde dans les yeux : un accord faux qui enfle a
      // l'envers, une note aigue qui siffle, et un souffle de statique.
      regard: function (pan) {
        if (!ok()) return;
        var t = ac.currentTime, o = cote(pan);
        var g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.35);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        g.connect(o);
        [146.8, 155.6, 207.7, 311.1].forEach(function (f, i) {
          var x = ac.createOscillator(); x.type = 'sawtooth';
          x.frequency.setValueAtTime(f, t);
          x.frequency.linearRampToValueAtTime(f * (i % 2 ? 0.97 : 1.02), t + 1.1);
          var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, t);
          lp.frequency.exponentialRampToValueAtTime(2400, t + 0.35);
          var gi = ac.createGain(); gi.gain.value = 0.06;
          x.connect(lp); lp.connect(gi); gi.connect(g);
          x.start(t); x.stop(t + 1.15);
        });
        var s = ac.createOscillator(); s.type = 'sine';
        s.frequency.setValueAtTime(3100, t + 0.3);
        s.frequency.exponentialRampToValueAtTime(2600, t + 1.0);
        var gs = ac.createGain();
        gs.gain.setValueAtTime(0.0001, t + 0.3);
        gs.gain.exponentialRampToValueAtTime(0.03, t + 0.36);
        gs.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
        s.connect(gs); gs.connect(o);
        s.start(t + 0.3); s.stop(t + 1.1);
        bruit(t + 0.32, 0.5, 'bandpass', 1800, 0.18, 0.6, o);
        ton(t + 0.33, 0.6, 'sine', 50, 0.45, 32, o);
      },
      // Quelqu'un est entre dans le bureau : des pas lourds, tout pres, le
      // grincement des articulations, et un souffle juste derriere nous.
      intrus: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        for (var i = 0; i < 4; i++) {
          var p = cote(hasard(-0.4, 0.4)), d = i * hasard(0.42, 0.55);
          bruit(t + d, 0.2, 'lowpass', 420, 0.65, 1, p);
          ton(t + d, 0.22, 'sine', 58, 0.6, 38, p);
          bruit(t + d + 0.02, 0.08, 'bandpass', 2600, 0.12, 3, p);
          var cr = bruit(t + d + 0.08, 0.3, 'bandpass', 1500, 0.07, 12, p);
          cr.f.frequency.linearRampToValueAtTime(900, t + d + 0.35);
        }
        var s = bruit(t + 0.6, 1.6, 'bandpass', 600, 0.16, 2);
        s.f.frequency.linearRampToValueAtTime(320, t + 2.2);
      },
      // Le coup au coeur : quelqu'un est la, a la porte.
      sursaut: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        ton(t, 0.9, 'sawtooth', 220, 0.16, 210);
        ton(t, 0.9, 'sawtooth', 233, 0.16, 228);
        ton(t, 0.9, 'sawtooth', 311, 0.1, 300);
      },
      vision: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        [311, 330, 466, 622].forEach(function (f) { ton(t, 0.35, 'sawtooth', f, 0.06, f * 0.94); });
        bruit(t, 0.3, 'highpass', 2500, 0.3);
      },
      // Le hurlement du jumpscare.
      // Le rugissement du jumpscare. Cinq couches, qui passent toutes par
      // une saturation et un compresseur, pour que ce soit enorme :
      //   - le choc, un coup sourd au moment ou il surgit ;
      //   - la gorge, deux scies tres graves qui grondent et raclent ;
      //   - le hurlement, une voix saturee qui monte puis s'effondre, avec
      //     des formants de gueule ouverte ;
      //   - le metal, un crissement aigu de machine qui force ;
      //   - le souffle, un bruit rauque qui roule sous le tout.
      // qui : chacun a sa voix (Wade grave et animal, Faith stridente,
      // Stephen gargouillant, Charlie caverneux).
      hurle: function (qui) {
        if (!ok()) return;
        var V = {
          wade:    { f0: 82,  cri: 520, haut: 1.9, rale: 34, formants: [650, 1150, 2500] },
          faith:   { f0: 130, cri: 900, haut: 2.3, rale: 46, formants: [900, 1800, 3200] },
          stephen: { f0: 70,  cri: 460, haut: 1.7, rale: 22, formants: [500, 1000, 2300], eau: true },
          charlie: { f0: 60,  cri: 400, haut: 1.6, rale: 28, formants: [450, 900, 2100] }
        }[qui] || { f0: 80, cri: 520, haut: 1.9, rale: 34, formants: [650, 1150, 2500] };
        var t = ac.currentTime, D = 1.45;

        // Le bus : saturation douce, puis compresseur, puis le maitre.
        var ds = ac.createWaveShaper(), courbe = new Float32Array(1024);
        for (var i = 0; i < 1024; i++) { var x = i / 512 - 1; courbe[i] = Math.tanh(x * 3.2) * 0.95; }
        ds.curve = courbe; ds.oversample = '4x';
        var comp = ac.createDynamicsCompressor();
        comp.threshold.value = -18; comp.knee.value = 6; comp.ratio.value = 8;
        comp.attack.value = 0.002; comp.release.value = 0.15;
        var bus = ac.createGain();
        bus.gain.setValueAtTime(0.0001, t);
        bus.gain.exponentialRampToValueAtTime(1, t + 0.012);
        bus.gain.setValueAtTime(1, t + D - 0.35);
        bus.gain.exponentialRampToValueAtTime(0.0001, t + D);
        var sortie = ac.createGain(); sortie.gain.value = 1.4;
        bus.connect(ds); ds.connect(comp); comp.connect(sortie); sortie.connect(maitre);

        function enveloppe(g, pic, att, tenue, fin) {
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(pic, t + att);
          g.gain.setValueAtTime(pic, t + tenue);
          g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
        }

        // Le choc : un coup grave qui tombe, et un craquement.
        var choc = ac.createOscillator(); choc.type = 'sine';
        choc.frequency.setValueAtTime(95, t);
        choc.frequency.exponentialRampToValueAtTime(32, t + 0.5);
        var gc = ac.createGain(); enveloppe(gc, 0.9, 0.005, 0.03, 0.6);
        choc.connect(gc); gc.connect(bus);
        bruit(t, 0.18, 'lowpass', 2500, 0.8, 0.7, bus);

        // La gorge : deux scies desaccordees, tres graves, et un rale :
        // l'amplitude hachee a une trentaine de coups par seconde.
        var gorge = ac.createGain(); enveloppe(gorge, 0.55, 0.03, D - 0.4, D);
        var rale = ac.createOscillator(); rale.frequency.value = V.rale;
        var rg = ac.createGain(); rg.gain.value = 0.35;
        var hache = ac.createGain(); hache.gain.value = 0.65;
        rale.connect(rg); rg.connect(hache.gain);
        var lpG = ac.createBiquadFilter(); lpG.type = 'lowpass'; lpG.frequency.value = 900; lpG.Q.value = 2;
        [1, 1.012, 0.5].forEach(function (m, k) {
          var o = ac.createOscillator(); o.type = k === 2 ? 'square' : 'sawtooth';
          o.frequency.setValueAtTime(V.f0 * m * 0.9, t);
          o.frequency.linearRampToValueAtTime(V.f0 * m * 1.25, t + 0.25);
          o.frequency.linearRampToValueAtTime(V.f0 * m * 0.7, t + D);
          o.connect(lpG); o.start(t); o.stop(t + D + 0.05);
        });
        lpG.connect(hache); hache.connect(gorge); gorge.connect(bus);
        rale.start(t); rale.stop(t + D + 0.05);

        // Le hurlement : une voix saturee qui monte d'un coup, tremble, puis
        // s'effondre ; trois formants de gueule grande ouverte.
        var voix = ac.createOscillator(); voix.type = 'sawtooth';
        voix.frequency.setValueAtTime(V.cri * 0.6, t);
        voix.frequency.exponentialRampToValueAtTime(V.cri * V.haut, t + 0.18);
        voix.frequency.setValueAtTime(V.cri * V.haut, t + 0.55);
        voix.frequency.exponentialRampToValueAtTime(V.cri * 0.75, t + D);
        var vib = ac.createOscillator(); vib.frequency.value = 9;
        var vg = ac.createGain(); vg.gain.value = V.cri * 0.06;
        vib.connect(vg); vg.connect(voix.frequency);
        var gv = ac.createGain(); enveloppe(gv, 0.5, 0.06, D - 0.45, D);
        V.formants.forEach(function (f, k) {
          var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 5;
          var gk = ac.createGain(); gk.gain.value = [1, 0.7, 0.4][k];
          voix.connect(bp); bp.connect(gk); gk.connect(gv);
        });
        gv.connect(bus);
        voix.start(t); vib.start(t); voix.stop(t + D + 0.05); vib.stop(t + D + 0.05);

        // Le metal : un crissement aigu, resonant, qui glisse.
        var metal = bruit(t + 0.04, D - 0.1, 'bandpass', 3800, 0.22, 18, bus);
        metal.f.frequency.setValueAtTime(4600, t + 0.04);
        metal.f.frequency.exponentialRampToValueAtTime(2600, t + D);

        // Le souffle : un bruit rauque, filtre comme une gorge.
        var souffle = bruit(t, D, 'bandpass', 1300, 0.45, 0.9, bus);
        souffle.f.frequency.setValueAtTime(800, t);
        souffle.f.frequency.linearRampToValueAtTime(1800, t + 0.3);
        souffle.f.frequency.linearRampToValueAtTime(900, t + D);

        // Stephen : des bulles et un gargouillis dans le hurlement.
        if (V.eau) {
          for (var b = 0; b < 16; b++) {
            var tb = t + 0.1 + Math.random() * (D - 0.3);
            ton(tb, 0.06, 'sine', hasard(300, 900), 0.15, hasard(900, 1600), bus);
          }
        }
      },
      // La neige longue, apres le jumpscare.
      neigeLongue: function (sec) {
        if (!ok()) return;
        bruit(ac.currentTime, sec || 2, 'bandpass', 2000, 0.16, 0.3);
      },
      panne: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        ton(t, 1.6, 'sawtooth', 180, 0.22, 25);
        bruit(t, 0.8, 'lowpass', 1200, 0.3);
      },
      // L'air de Wade, joue a la boite a musique pendant la panne.
      boite: function (duree) {
        if (!ok()) return;
        var t = ac.currentTime;
        var air = [523, 659, 784, 659, 698, 880, 784, 0, 659, 784, 1047, 988, 880, 784, 698, 0];
        for (var k = 0, i = 0; k < duree; k += 0.34, i++) {
          var f = air[i % air.length];
          if (f) { ton(t + k, 0.55, 'triangle', f * 2, 0.07); ton(t + k, 0.3, 'sine', f * 4, 0.015); }
        }
      },
      carillon: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) {
          ton(t + i * 0.42, 1.6, 'sine', f, 0.2);
          ton(t + i * 0.42, 1.0, 'triangle', f * 2, 0.04);
        });
        // Des enfants qui crient de joie, tres loin.
        for (var i = 0; i < 14; i++) {
          var d = 2.6 + hasard(0, 1.4);
          var n = bruit(t + d, hasard(0.3, 0.6), 'bandpass', hasard(1200, 2200), 0.05, 6);
          n.f.frequency.linearRampToValueAtTime(hasard(1600, 2800), t + d + 0.3);
        }
      },
      palier: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        [392, 523, 659, 784].forEach(function (f, i) { ton(t + i * 0.09, 0.4, 'square', f, 0.06); });
      },
      // Le theme du menu : une boite a musique desaccordee, sur un bourdon.
      menu: function () {
        if (!ok()) return RIEN;
        var t0 = ac.currentTime;
        var bus = ac.createGain();
        bus.gain.setValueAtTime(0.0001, t0);
        bus.gain.exponentialRampToValueAtTime(1, t0 + 2);
        bus.connect(maitre);
        var delai = ac.createDelay(2); delai.delayTime.value = 0.5;
        var retour = ac.createGain(); retour.gain.value = 0.4;
        delai.connect(retour); retour.connect(delai); retour.connect(bus);
        var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55;
        var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 140;
        var go = ac.createGain(); go.gain.value = 0.05;
        o.connect(f); f.connect(go); go.connect(bus); o.start(t0);
        var s = ac.createBufferSource(); s.buffer = bruitBuf; s.loop = true;
        var fs = ac.createBiquadFilter(); fs.type = 'bandpass'; fs.frequency.value = 3000; fs.Q.value = 0.3;
        var gs = ac.createGain(); gs.gain.value = 0.012;
        s.connect(fs); fs.connect(gs); gs.connect(bus); s.start(t0);
        var air = [659, 0, 587, 659, 0, 523, 0, 494, 523, 0, 440, 0, 0, 392, 440, 0];
        var i = 0, prochaine = t0 + 1, fini = false;
        var h = setInterval(function () {
          if (fini || ac.state === 'closed') return;
          while (prochaine < ac.currentTime + 0.3) {
            var fq = air[i++ % air.length];
            if (fq) {
              // Une note un peu fausse, qui tremble.
              var x = ac.createOscillator(); x.type = 'triangle';
              x.frequency.value = fq * (1 + hasard(-0.012, 0.012));
              var g = ac.createGain();
              g.gain.setValueAtTime(0.0001, prochaine);
              g.gain.exponentialRampToValueAtTime(0.06, prochaine + 0.01);
              g.gain.exponentialRampToValueAtTime(0.0001, prochaine + 1.4);
              x.connect(g); g.connect(bus); g.connect(delai);
              x.start(prochaine); x.stop(prochaine + 1.5);
            }
            prochaine += 0.42;
          }
        }, 120);
        var c = continu([o, s], bus);
        var stop = c.arreter;
        c.arreter = function (sec) { fini = true; clearInterval(h); stop(sec); };
        return c;
      },
      couper: function () {
        continus.forEach(function (h) { h.arreter(0.2); });
        continus = [];
      }
    };
    return S;
  }

  window.WADE_SON = creerSon();
})();
