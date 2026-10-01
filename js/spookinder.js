// Spookinder : l'evenement d'Halloween du DinderPad.
//
// Un mini-jeu de survie : six nuits de garde a la pizzeria, de minuit a
// six heures, avec deux portes, deux lumieres, des cameras et une reserve
// d'energie qui ne tient pas toute la nuit si l'on s'affole. Chaque nuit
// tenue rapporte de l'experience a un pass de vingt paliers ; quatre
// d'entre eux rendent Chica, Bonnie, Foxy puis Freddy, en rarete
// Exclusif. Le 31 octobre au soir, le pass se ferme pour de bon.
//
// Le dessin est en pixels francs, sur une toile de 320 x 210 agrandie
// sans lissage. Les commandes sont des boutons HTML poses par-dessus :
// ils marchent au doigt comme a la souris.
(function () {
  var DP = window.DP;
  if (!DP) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function hasard(a, b) { return a + Math.random() * (b - a); }
  function choix(l) { return l[Math.floor(Math.random() * l.length)]; }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var JAQUETTE = 'assets/games/icones/spookinder.webp';

  // ==========================================================
  //  Le pass
  //  Vingt paliers de 100 XP. Les Dinders tombent aux paliers ronds,
  //  le plus celebre en dernier.
  // ==========================================================

  var XP_PALIER = 100;

  var PALIERS = [
    { type: 'credit', key: 'green', n: 3 },
    { type: 'evo', n: 1 },
    { type: 'credit', key: 'blue', n: 2 },
    { type: 'credit', key: 'green', n: 5 },
    { type: 'dinder', id: 'chica-the-chicken' },
    { type: 'credit', key: 'gold', n: 1 },
    { type: 'evo', n: 2 },
    { type: 'credit', key: 'blue', n: 3 },
    { type: 'credit', key: 'green', n: 6 },
    { type: 'dinder', id: 'bonnie-the-bunny' },
    { type: 'credit', key: 'gold', n: 2 },
    { type: 'evo', n: 2 },
    { type: 'credit', key: 'pink', n: 1 },
    { type: 'credit', key: 'blue', n: 4 },
    { type: 'dinder', id: 'foxy-the-fox-pirate' },
    { type: 'credit', key: 'gold', n: 2 },
    { type: 'evo', n: 3 },
    { type: 'credit', key: 'pink', n: 1 },
    { type: 'credit', key: 'gold', n: 3 },
    { type: 'dinder', id: 'freddy-fazbear' }
  ];

  // Les Dinders doivent tomber au palier que DP.SPOOK_DINDERS leur
  // reconnait : c'est lui qui decide s'ils ont ete gagnes pour de bon.
  Object.keys(DP.SPOOK_DINDERS).forEach(function (id) {
    var r = PALIERS[DP.SPOOK_DINDERS[id] - 1];
    if (!r || r.id !== id) throw new Error('Spookinder : ' + id + ' mal place dans le pass');
  });

  function palierAtteint() {
    return Math.min(PALIERS.length, Math.floor(DP.spookinder().xp / XP_PALIER));
  }

  function libelle(r) {
    if (r.type === 'credit') {
      var c = DP.CREDITS[r.key];
      return r.n + ' ' + (r.n > 1 ? c.name.replace(/(\S+) (\S+)/, '$1s $2s') : c.name);
    }
    if (r.type === 'evo') return r.n + ' Crédit' + (r.n > 1 ? 's' : '') + ' Évolutif' + (r.n > 1 ? 's' : '');
    if (r.type === 'dinder') {
      var d = DP.byId(r.id);
      return d.name + (d.form ? ' ' + d.form : '');
    }
    return '';
  }

  function imageDe(r) {
    if (r.type === 'credit') return DP.creditImg(r.key);
    if (r.type === 'evo') return DP.evoImg();
    return DP.dinderImg(r.id);
  }

  // Donne la recompense du palier n (1 a 20) ; rend false si elle n'est
  // pas (ou plus) a prendre.
  function reclamer(n) {
    var r = PALIERS[n - 1];
    if (!r || n > palierAtteint()) return false;
    if (!DP.reclamerPalier(n)) return false;
    if (r.type === 'credit') DP.earn(r.key, r.n);
    else if (r.type === 'evo') DP.gagnerEvos(r.n);
    else if (r.type === 'dinder' && !DP.has(r.id)) {
      DP.collect(r.id);
      if (DP.markNew) DP.markNew(r.id);
    }
    return true;
  }

  // ==========================================================
  //  Les nuits
  //  Le niveau d'IA va de 0 (immobile) a 20 (implacable) : a chaque
  //  occasion, un animatronique bouge si un de 20 tombe sous son niveau.
  // ==========================================================

  var NUITS = [
    { n: 1, ia: { bonnie: 3,  chica: 1,  foxy: 0,  freddy: 0 },  xp: 120 },
    { n: 2, ia: { bonnie: 6,  chica: 4,  foxy: 2,  freddy: 0 },  xp: 160 },
    { n: 3, ia: { bonnie: 8,  chica: 7,  foxy: 5,  freddy: 2 },  xp: 200 },
    { n: 4, ia: { bonnie: 11, chica: 10, foxy: 8,  freddy: 5 },  xp: 250 },
    { n: 5, ia: { bonnie: 14, chica: 13, foxy: 11, freddy: 9 },  xp: 300 },
    { n: 6, ia: { bonnie: 18, chica: 17, foxy: 15, freddy: 14 }, xp: 400 }
  ];

  var HEURE = 40;                 // secondes de jeu par heure de nuit
  var XP_HEURE = 15;              // ce que rapporte une heure tenue, si l'on y passe

  function nuitOuverte(n) {
    return n === 1 || DP.spookinder().nuits.indexOf(n - 1) !== -1;
  }

  // ==========================================================
  //  Le son
  //  Tout est synthetise : pas un fichier a charger. Le contexte audio
  //  ne nait qu'au premier clic, comme l'exigent les navigateurs.
  // ==========================================================

  function creerSon() {
    var ac = null, maitre = null, bruitBuf = null, muet = false;
    var continus = [], musiques = [];

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

    function bruit(t0, duree, filtre, freq, vol, q) {
      var s = ac.createBufferSource();
      s.buffer = bruitBuf;
      s.loop = true;
      var f = ac.createBiquadFilter();
      f.type = filtre; f.frequency.value = freq; f.Q.value = q || 1;
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
      s.connect(f); f.connect(g); g.connect(maitre);
      s.start(t0, Math.random()); s.stop(t0 + duree + 0.05);
      return { f: f, g: g };
    }

    function ton(t0, duree, type, freq, vol, glisse) {
      var o = ac.createOscillator();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (glisse) o.frequency.exponentialRampToValueAtTime(glisse, t0 + duree);
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
      o.connect(g); g.connect(maitre);
      o.start(t0); o.stop(t0 + duree + 0.05);
    }

    function ok() { return pret() && ac.state !== 'closed'; }

    var S = {
      reveiller: function () { if (ok() && ac.state === 'suspended') ac.resume(); },
      muet: function (m) {
        muet = m;
        if (maitre) maitre.gain.value = m ? 0 : 0.8;
      },
      estMuet: function () { return muet; },

      // Le ronron du batiment et le ventilateur du bureau.
      ambiance: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        var o = ac.createOscillator();
        o.type = 'sawtooth'; o.frequency.value = 58;
        var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160;
        var g = ac.createGain(); g.gain.value = 0.035;
        o.connect(f); f.connect(g); g.connect(maitre); o.start(t);
        var s = ac.createBufferSource(); s.buffer = bruitBuf; s.loop = true;
        var f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 420; f2.Q.value = 0.6;
        var g2 = ac.createGain(); g2.gain.value = 0.03;
        s.connect(f2); f2.connect(g2); g2.connect(maitre); s.start(t);
        continus.push(o, s);
      },
      porte: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        bruit(t, 0.25, 'lowpass', 900, 0.5);
        ton(t, 0.3, 'sine', 90, 0.5, 40);
      },
      lumiere: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        ton(t, 0.06, 'square', 2400, 0.05);
        ton(t + 0.04, 0.5, 'square', 120, 0.04);
      },
      camera: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        ton(t, 0.04, 'square', 1800, 0.06);
        bruit(t, 0.18, 'highpass', 3000, 0.08);
      },
      clic: function () {
        if (!ok()) return;
        ton(ac.currentTime, 0.03, 'square', 2600, 0.04);
      },
      pas: function (vol) {
        if (!ok()) return;
        var t = ac.currentTime;
        for (var i = 0; i < 3; i++) {
          bruit(t + i * 0.42, 0.14, 'lowpass', 300, 0.25 * (vol || 1));
          ton(t + i * 0.42, 0.14, 'sine', 70, 0.25 * (vol || 1), 50);
        }
      },
      souffle: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        var n = bruit(t, 1.6, 'bandpass', 700, 0.18, 2);
        n.f.frequency.linearRampToValueAtTime(380, t + 1.6);
      },
      coups: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        for (var i = 0; i < 4; i++) {
          bruit(t + i * 0.2, 0.16, 'lowpass', 600, 0.6);
          ton(t + i * 0.2, 0.2, 'sine', 80, 0.5, 45);
        }
      },
      course: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        for (var i = 0; i < 12; i++) {
          var v = 0.08 + i * 0.03;
          bruit(t + i * 0.17, 0.08, 'lowpass', 500, v);
        }
      },
      casseroles: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        for (var i = 0; i < 3; i++) {
          var t1 = t + i * hasard(0.15, 0.4);
          ton(t1, 0.5, 'triangle', hasard(900, 1400), 0.08);
          ton(t1, 0.4, 'square', hasard(2100, 2900), 0.03);
          bruit(t1, 0.1, 'highpass', 4000, 0.1);
        }
      },
      // Le rire grave de Freddy, quand il change de piece.
      rire: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        for (var i = 0; i < 3; i++) {
          var o = ac.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(110 - i * 6, t + i * 0.28);
          o.frequency.linearRampToValueAtTime(85 - i * 6, t + i * 0.28 + 0.22);
          var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 3;
          var g = ac.createGain();
          g.gain.setValueAtTime(0.0001, t + i * 0.28);
          g.gain.exponentialRampToValueAtTime(0.3, t + i * 0.28 + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.28 + 0.24);
          o.connect(f); f.connect(g); g.connect(maitre);
          o.start(t + i * 0.28); o.stop(t + i * 0.28 + 0.3);
        }
      },
      // Le coup au coeur : quand on decouvre quelqu'un a la porte.
      sursaut: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        ton(t, 0.9, 'sawtooth', 220, 0.18, 210);
        ton(t, 0.9, 'sawtooth', 233, 0.18, 228);
        ton(t, 0.9, 'sawtooth', 311, 0.12, 300);
      },
      cri: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        var o = ac.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(380, t);
        o.frequency.linearRampToValueAtTime(900, t + 0.3);
        o.frequency.linearRampToValueAtTime(520, t + 1.4);
        var lfo = ac.createOscillator(); lfo.frequency.value = 38;
        var lg = ac.createGain(); lg.gain.value = 90;
        lfo.connect(lg); lg.connect(o.frequency);
        var ds = ac.createWaveShaper();
        var courbe = new Float32Array(256);
        for (var i = 0; i < 256; i++) { var x = i / 128 - 1; courbe[i] = Math.tanh(x * 6); }
        ds.curve = courbe;
        var g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.32, t + 0.03);
        g.gain.setValueAtTime(0.32, t + 1.1);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o.connect(ds); ds.connect(g); g.connect(maitre);
        lfo.start(t); o.start(t); o.stop(t + 1.7); lfo.stop(t + 1.7);
        bruit(t, 1.5, 'bandpass', 2400, 0.35, 0.7);
      },
      // La boite a musique de la panne : une ritournelle de notre cru.
      boite: function (duree) {
        if (!ok()) return;
        var t = ac.currentTime;
        var air = [659, 784, 880, 784, 659, 587, 523, 587, 659, 659, 587, 523, 494, 523, 587, 0];
        var i = 0;
        for (var k = 0; k < duree; k += 0.32) {
          var f = air[i++ % air.length];
          if (f) ton(t + k, 0.5, 'triangle', f * 2, 0.07);
        }
      },
      panne: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        ton(t, 1.2, 'sawtooth', 160, 0.2, 30);
        bruit(t, 0.6, 'lowpass', 1200, 0.3);
      },
      carillon: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) {
          ton(t + i * 0.42, 1.6, 'sine', f, 0.2);
          ton(t + i * 0.42, 1.0, 'triangle', f * 2, 0.04);
        });
      },
      palier: function () {
        if (!ok()) return;
        var t = ac.currentTime;
        [392, 523, 659, 784].forEach(function (f, i) { ton(t + i * 0.09, 0.4, 'square', f, 0.06); });
      },
      // La musique des nuits : un bourdon grave a la seconde mineure, un
      // coeur qui bat, des notes de piano isolees qui trainent en echo, et
      // de loin en loin un grincement de metal. intensite(k), de 0 a 1,
      // resserre le tout a mesure que la nuit avance.
      musique: function () {
        if (!ok()) return null;
        var t0 = ac.currentTime;
        var bus = ac.createGain();
        bus.gain.setValueAtTime(0.0001, t0);
        bus.gain.exponentialRampToValueAtTime(1, t0 + 4);
        bus.connect(maitre);

        // L'echo des notes.
        var delai = ac.createDelay(2);
        delai.delayTime.value = 0.62;
        var retour = ac.createGain(); retour.gain.value = 0.45;
        var sombre = ac.createBiquadFilter(); sombre.type = 'lowpass'; sombre.frequency.value = 1800;
        delai.connect(sombre); sombre.connect(retour); retour.connect(delai);
        sombre.connect(bus);

        // Le bourdon : deux scies desaccordees d'un demi-ton, etouffees, et
        // un filtre qui respire lentement.
        var filtre = ac.createBiquadFilter();
        filtre.type = 'lowpass'; filtre.frequency.value = 180; filtre.Q.value = 6;
        var lfo = ac.createOscillator(); lfo.frequency.value = 0.07;
        var lfoG = ac.createGain(); lfoG.gain.value = 90;
        lfo.connect(lfoG); lfoG.connect(filtre.frequency);
        var drone = ac.createGain(); drone.gain.value = 0.07;
        var oscs = [55, 58.27, 27.5].map(function (f, i) {
          var o = ac.createOscillator();
          o.type = i === 2 ? 'sine' : 'sawtooth';
          o.frequency.value = f;
          o.detune.value = i ? -7 : 5;
          o.connect(i === 2 ? drone : filtre);
          o.start(t0);
          return o;
        });
        filtre.connect(drone); drone.connect(bus);
        lfo.start(t0);

        var k = 0, coeur = t0 + 2, note = t0 + 3, metal = t0 + 12, fini = false;
        // Une gamme sans repos : la, do, re diese, fa diese et leurs octaves.
        var NOTES = [220, 261.6, 311.1, 370, 440, 523.3, 622.3, 740];

        function battre(t) {
          [0, 0.22].forEach(function (d, i) {
            var o = ac.createOscillator(); o.type = 'sine';
            o.frequency.setValueAtTime(62, t + d);
            o.frequency.exponentialRampToValueAtTime(38, t + d + 0.18);
            var g = ac.createGain();
            g.gain.setValueAtTime(0.0001, t + d);
            g.gain.exponentialRampToValueAtTime((i ? 0.22 : 0.32) * (0.6 + k * 0.6), t + d + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.26);
            o.connect(g); g.connect(bus);
            o.start(t + d); o.stop(t + d + 0.3);
          });
        }

        function jouer(t) {
          var f = NOTES[Math.floor(Math.random() * NOTES.length)];
          [1, 2.01].forEach(function (h, i) {
            var o = ac.createOscillator(); o.type = i ? 'sine' : 'triangle';
            o.frequency.value = f * h;
            var g = ac.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(i ? 0.015 : 0.05, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
            o.connect(g); g.connect(bus); g.connect(delai);
            o.start(t); o.stop(t + 3.3);
          });
        }

        function grincer(t) {
          var s = ac.createBufferSource(); s.buffer = bruitBuf; s.loop = true;
          var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 18;
          f.frequency.setValueAtTime(hasard(900, 1400), t);
          f.frequency.linearRampToValueAtTime(hasard(300, 600), t + 2.4);
          var g = ac.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.09, t + 0.8);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
          s.connect(f); f.connect(g); g.connect(bus); g.connect(delai);
          s.start(t, Math.random()); s.stop(t + 2.7);
        }

        // On programme un peu en avance, au rythme d'une horloge lente.
        var horloge = setInterval(function () {
          if (fini || ac.state === 'closed') return;
          var t = ac.currentTime + 0.3;
          while (coeur < t) { battre(coeur); coeur += 1.7 - k * 0.9; }
          while (note < t) { jouer(note); note += hasard(2.5, 7) * (1 - k * 0.5); }
          while (metal < t) { grincer(metal); metal += hasard(14, 30); }
        }, 150);

        var M = {
          intensite: function (v) {
            k = Math.max(0, Math.min(1, v));
            drone.gain.setTargetAtTime(0.07 + k * 0.06, ac.currentTime, 2);
            lfo.frequency.setTargetAtTime(0.07 + k * 0.25, ac.currentTime, 2);
          },
          arreter: function (sec) {
            if (fini) return;
            fini = true;
            clearInterval(horloge);
            var t = ac.currentTime;
            bus.gain.cancelScheduledValues(t);
            bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), t);
            bus.gain.exponentialRampToValueAtTime(0.0001, t + (sec || 0.05));
            setTimeout(function () {
              oscs.concat([lfo]).forEach(function (o) { try { o.stop(); } catch (e) {} });
              bus.disconnect();
            }, ((sec || 0.05) + 0.2) * 1000);
          }
        };
        musiques.push(M);
        return M;
      },
      couper: function () {
        continus.forEach(function (n) { try { n.stop(); } catch (e) {} });
        continus = [];
        musiques.forEach(function (m) { m.arreter(0.3); });
        musiques = [];
      }
    };
    return S;
  }

  var SON = creerSon();

  // ==========================================================
  //  Le batiment
  // ==========================================================

  var W = 320, H = 210;

  var CAMS = {
    '1A': { nom: 'Scène',            x: 46, y: 6 },
    '1B': { nom: 'Salle à manger',   x: 40, y: 26 },
    '1C': { nom: 'Crique du Pirate', x: 14, y: 42 },
    '5':  { nom: 'Coulisses',        x: 6,  y: 22 },
    '7':  { nom: 'Toilettes',        x: 84, y: 26 },
    '6':  { nom: 'Cuisine',          x: 82, y: 50 },
    '3':  { nom: 'Placard',          x: 22, y: 64 },
    '2A': { nom: 'Couloir Ouest',    x: 38, y: 62 },
    '2B': { nom: 'Coin Ouest',       x: 38, y: 82 },
    '4A': { nom: 'Couloir Est',      x: 62, y: 62 },
    '4B': { nom: 'Coin Est',         x: 62, y: 82 }
  };

  // Les chemins : d'ou l'on peut aller, piece par piece. PG et PD sont
  // les portes du bureau, gauche et droite.
  var CHEMINS = {
    bonnie: { '1A': ['1B'], '1B': ['5', '2A'], '5': ['1B', '2A'],
              '2A': ['3', '2B'], '3': ['2A', '2B'], '2B': ['PG'] },
    chica:  { '1A': ['1B'], '1B': ['7', '6'], '7': ['1B', '6', '4A'],
              '6': ['7', '4A'], '4A': ['4B'], '4B': ['PD'] },
    freddy: { '1A': ['1B'], '1B': ['7'], '7': ['6'], '6': ['4A'],
              '4A': ['4B'], '4B': ['PD'] }
  };

  // Ou l'on retourne quand la porte reste fermee.
  var REPLI = { bonnie: '1B', chica: '4A', freddy: '4A' };

  var PERSOS = {
    bonnie: { id: 'bonnie-the-bunny',    nom: 'Bonnie', tous: 4.97 },
    chica:  { id: 'chica-the-chicken',   nom: 'Chica',  tous: 4.98 },
    foxy:   { id: 'foxy-the-fox-pirate', nom: 'Foxy',   tous: 5.01 },
    freddy: { id: 'freddy-fazbear',      nom: 'Freddy', tous: 3.02 }
  };

  var IMG = {};
  function charger() {
    Object.keys(PERSOS).forEach(function (k) {
      if (IMG[k]) return;
      var im = new Image();
      im.src = DP.sprite(PERSOS[k].id);
      IMG[k] = im;
    });
  }

  function pret(im) { return im && im.complete && im.naturalWidth > 0; }

  // ==========================================================
  //  Le dessin des pieces
  //  Chaque piece est peinte une fois dans une toile a part, puis
  //  reprise a chaque image : seuls les animatroniques et le grain de la
  //  camera bougent.
  // ==========================================================

  function toile(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return { c: c, x: x };
  }

  function r(x, X, Y, w, h, col) { x.fillStyle = col; x.fillRect(X, Y, w, h); }

  // Le damier noir et blanc, signature des pizzerias, en perspective.
  function damier(x, y0, y1, fuite, taille, clair, sombre) {
    for (var y = y0; y < y1; y++) {
      var k = (y - y0) / (y1 - y0);
      var t = Math.max(2, Math.round(taille * (0.35 + k)));
      var dec = Math.round((W / 2 - fuite) * (1 - k));
      var ligne = Math.floor(Math.pow(k, 0.6) * 9);
      for (var X = -t * 2; X < W + t; X += t) {
        var case_ = Math.floor((X + dec) / t) + ligne;
        r(x, X, y, t, 1, case_ % 2 ? clair : sombre);
      }
    }
  }

  function mur(x, haut, col, plinthe) {
    r(x, 0, 0, W, haut, col);
    for (var X = 0; X < W; X += 16) r(x, X, 0, 1, haut, 'rgba(0,0,0,.18)');
    if (plinthe) r(x, 0, haut - 6, W, 6, plinthe);
  }

  function affiche(x, X, Y, w, h, fond, texte) {
    r(x, X, Y, w, h, '#1a1418');
    r(x, X + 1, Y + 1, w - 2, h - 2, fond);
    if (texte) {
      x.fillStyle = '#1a1418';
      x.font = 'bold 7px monospace';
      x.textAlign = 'center';
      x.fillText(texte, X + w / 2, Y + h - 4);
    }
    // Trois tetes rondes, griffonnees.
    var c = ['#a8582a', '#5a5ab8', '#e0c22a'];
    for (var i = 0; i < 3; i++) {
      var cx = X + 6 + i * ((w - 12) / 2);
      r(x, cx - 3, Y + 5, 6, 6, c[i]);
      r(x, cx - 2, Y + 7, 1, 1, '#fff'); r(x, cx + 1, Y + 7, 1, 1, '#fff');
    }
  }

  function table(x, X, Y, w) {
    r(x, X, Y, w, 6, '#e8e4dc');
    for (var i = 0; i < w; i += 4) r(x, X + i, Y + 6, 2, 3, '#d43a3a');
    r(x, X + 2, Y + 9, 2, 12, '#3a3238');
    r(x, X + w - 4, Y + 9, 2, 12, '#3a3238');
    // Les chapeaux de fete.
    for (var k = 4; k < w - 4; k += 12) {
      var col = choixFixe(['#e84a8a', '#4ac8e8', '#f0c020', '#6ad04a'], X + k);
      r(x, X + k + 2, Y - 6, 2, 2, col);
      r(x, X + k + 1, Y - 4, 4, 2, col);
      r(x, X + k, Y - 2, 6, 2, col);
    }
  }

  function choixFixe(l, graine) { return l[Math.abs(graine * 7 + 3) % l.length]; }

  function couloir(x, teinte) {
    r(x, 0, 0, W, H, '#07060a');
    // Les murs en fuite, vers un point au centre.
    x.fillStyle = teinte;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(120, 60); x.lineTo(120, 140); x.lineTo(0, H); x.fill();
    x.beginPath(); x.moveTo(W, 0); x.lineTo(200, 60); x.lineTo(200, 140); x.lineTo(W, H); x.fill();
    r(x, 120, 60, 80, 80, '#0c0a10');
    damier(x, 140, H, 160, 22, '#4a4650', '#141218');
    // Les affiches et les dessins d'enfants, de biais.
    affiche(x, 28, 50, 34, 26, '#e8d8a0', 'CELEBRATE!');
    affiche(x, 254, 60, 30, 24, '#d8e8f0', '');
    // La rampe des neons, au plafond.
    r(x, 140, 50, 40, 2, '#3a3a2a');
  }

  var PIECES = {};

  function piece(cle) {
    if (PIECES[cle]) return PIECES[cle];
    var t = toile(W, H), x = t.x;

    if (cle === '1A') {
      mur(x, 120, '#2a1838');
      for (var i = 0; i < 40; i++) {
        r(x, (i * 53) % W, (i * 31) % 100, 2, 2, i % 3 ? '#f0d060' : '#ffffff');
      }
      x.fillStyle = '#ff8a1e'; x.font = 'bold 12px monospace'; x.textAlign = 'center';
      x.fillText('★ SPOOKINDER ★', W / 2, 22);
      r(x, 0, 120, W, 26, '#5a3a24');
      r(x, 0, 120, W, 3, '#7a5234');
      damier(x, 146, H, 160, 26, '#5a5660', '#18161c');
    } else if (cle === '1B') {
      mur(x, 110, '#3a2a30', '#2a1c22');
      affiche(x, 40, 30, 46, 34, '#e8d8a0', 'CELEBRATE!');
      affiche(x, 230, 34, 40, 30, '#f0c8d8', 'LET\'S EAT');
      r(x, 120, 20, 70, 50, '#141018');
      x.fillStyle = '#4ac8e8'; x.font = 'bold 8px monospace'; x.textAlign = 'center';
      x.fillText('PIZZA', 155, 48);
      damier(x, 110, H, 160, 24, '#56525c', '#16141a');
      table(x, 30, 150, 80);
      table(x, 200, 158, 90);
      table(x, 110, 124, 100);
    } else if (cle === '1C') {
      mur(x, 150, '#1a1020');
      r(x, 70, 30, 180, 120, '#140a1c');
      r(x, 64, 24, 192, 8, '#3a2412');
      damier(x, 150, H, 160, 24, '#4a4650', '#141218');
    } else if (cle === '5') {
      mur(x, 120, '#24222a');
      // Les etageres de tetes de rechange, vides et alignees.
      for (var e = 0; e < 3; e++) {
        r(x, 20, 30 + e * 30, 280, 3, '#4a3a2a');
        for (var k = 0; k < 7; k++) {
          var hx = 30 + k * 38, hy = 14 + e * 30;
          r(x, hx, hy, 16, 15, choixFixe(['#6a4a32', '#4a4a7a', '#8a7a2a'], k + e));
          r(x, hx + 3, hy + 4, 3, 3, '#050405'); r(x, hx + 10, hy + 4, 3, 3, '#050405');
        }
      }
      r(x, 0, 120, W, H - 120, '#141218');
      r(x, 200, 120, 100, 20, '#3a3238');
    } else if (cle === '7') {
      mur(x, 130, '#2a3438');
      for (var c = 0; c < 4; c++) {
        r(x, 30 + c * 70, 20, 60, 110, '#4a5a60');
        r(x, 30 + c * 70, 20, 60, 3, '#6a7a80');
        r(x, 80 + c * 70, 72, 4, 4, '#a8b0b8');
      }
      damier(x, 130, H, 160, 16, '#7a8288', '#2a3034');
    } else if (cle === '3') {
      mur(x, 140, '#1c1a20');
      r(x, 40, 20, 4, 120, '#6a4a2a'); r(x, 34, 16, 16, 10, '#a89060');
      r(x, 260, 100, 30, 40, '#4a5a8a'); r(x, 262, 96, 26, 6, '#6a7aa8');
      r(x, 80, 30, 160, 3, '#4a3a2a');
      r(x, 0, 140, W, H - 140, '#0e0c10');
    } else if (cle === '2A') {
      couloir(x, '#26202c');
    } else if (cle === '4A') {
      couloir(x, '#2a2028');
    } else if (cle === '2B' || cle === '4B') {
      mur(x, 150, cle === '2B' ? '#2a2430' : '#302428');
      // Le coin, tout pres de la porte : le mur couvert de dessins.
      for (var d = 0; d < 6; d++) {
        affiche(x, 14 + d * 50, 18 + (d % 2) * 26, 36, 28,
                choixFixe(['#f0e0b0', '#d8f0e0', '#f0d0e0'], d), d === 2 ? 'CELEBRATE!' : '');
      }
      damier(x, 150, H, cle === '2B' ? 230 : 90, 24, '#4a4650', '#141218');
    } else if (cle === '6') {
      r(x, 0, 0, W, H, '#000');
    }

    PIECES[cle] = t;
    return t;
  }

  // Le grain de la camera : quelques planches de bruit tirees d'avance.
  var GRAINS = [];
  function grains() {
    if (GRAINS.length) return GRAINS;
    for (var g = 0; g < 4; g++) {
      var t = toile(W, H);
      var img = t.x.createImageData(W, H);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      t.x.putImageData(img, 0, 0);
      GRAINS.push(t.c);
    }
    return GRAINS;
  }

  // Ou se tiennent les animatroniques dans chaque piece : x du centre,
  // y des pieds, echelle du sprite (64 x 80).
  var POSES = {
    '1A': { bonnie: [90, 136, 1.15], freddy: [160, 132, 1.25], chica: [230, 136, 1.15] },
    '1B': { bonnie: [70, 178, 1.0], chica: [250, 182, 1.05], freddy: [160, 150, 0.9] },
    '5':  { bonnie: [150, 230, 2.6] },
    '7':  { chica: [130, 190, 1.4], freddy: [210, 186, 1.3] },
    '3':  { bonnie: [160, 210, 2.0] },
    '2A': { bonnie: [160, 150, 0.85] },
    '4A': { chica: [150, 150, 0.85], freddy: [175, 148, 0.8] },
    '2B': { bonnie: [200, 250, 2.9] },
    '4B': { chica: [120, 250, 2.9], freddy: [210, 240, 2.6] }
  };

  function sprite(x, qui, cx, pied, ech) {
    var im = IMG[qui];
    if (!pret(im)) return;
    var w = Math.round(64 * ech), h = Math.round(80 * ech);
    x.drawImage(im, Math.round(cx - w / 2), Math.round(pied - h), w, h);
  }

  // ==========================================================
  //  Le bureau
  // ==========================================================

  var BUREAU = null;
  function bureau() {
    if (BUREAU) return BUREAU;
    var t = toile(W, H), x = t.x;
    mur(x, 150, '#2a2a34');
    // Les carreaux du mur, comme dans une cuisine de restaurant.
    for (var Y = 96; Y < 150; Y += 6) {
      for (var X = 0; X < W; X += 8) r(x, X + (Y % 12 ? 0 : 4), Y, 7, 5, Y % 12 ? '#3a3a48' : '#343442');
    }
    r(x, 0, 92, W, 4, '#6a2a2a');
    affiche(x, 100, 18, 50, 38, '#e8d8a0', 'CELEBRATE!');
    // Les dessins d'enfants au-dessus du bureau.
    for (var i = 0; i < 5; i++) {
      r(x, 160 + i * 14, 26 + (i % 2) * 8, 12, 10, choixFixe(['#f0f0e8', '#e8f0f8', '#f8e8f0'], i));
      r(x, 163 + i * 14, 29 + (i % 2) * 8, 6, 4, choixFixe(['#a8582a', '#5a5ab8', '#e0c22a', '#b8302a'], i));
    }
    damier(x, 150, H, 160, 30, '#3a3840', '#101014');
    // Le bureau lui-meme, ses ecrans, son ventilateur, un cupcake.
    r(x, 84, 140, 152, 8, '#5a4a3a');
    r(x, 88, 148, 144, 30, '#3a2e24');
    r(x, 96, 112, 34, 28, '#202024'); r(x, 99, 115, 28, 20, '#1a3a2a');
    r(x, 190, 116, 30, 24, '#202024'); r(x, 193, 119, 24, 16, '#2a1a3a');
    r(x, 140, 130, 8, 10, '#e84a8a'); r(x, 141, 126, 6, 4, '#f4f0e8'); r(x, 143, 123, 2, 3, '#ffd040');
    r(x, 150, 134, 30, 6, '#e8e4dc'); r(x, 154, 132, 22, 3, '#d8d4cc');
    BUREAU = t;
    return t;
  }

  // ==========================================================
  //  Une nuit
  // ==========================================================

  function partie(hote, nuit, quitter) {
    charger();
    var cv = el('canvas', 'spk-cv');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    hote.appendChild(cv);

    // Le bandeau du haut : l'heure, la nuit, l'energie.
    var hud = el('div', 'spk-hud');
    var elHeure = el('span', 'spk-heure', '12 AM');
    var elNuit = el('span', 'spk-nuit', 'Nuit ' + nuit.n);
    var elEnergie = el('span', 'spk-energie');
    var elUsage = el('span', 'spk-usage');
    var gauche = el('div', 'spk-hud-g');
    gauche.appendChild(elEnergie); gauche.appendChild(elUsage);
    var droite = el('div', 'spk-hud-d');
    droite.appendChild(elHeure); droite.appendChild(elNuit);
    hud.appendChild(gauche); hud.appendChild(droite);
    hote.appendChild(hud);

    var muet = el('button', 'spk-muet', SON.estMuet() ? '🔇' : '🔊');
    muet.type = 'button';
    muet.title = 'Couper le son';
    muet.addEventListener('click', function () {
      SON.muet(!SON.estMuet());
      muet.textContent = SON.estMuet() ? '🔇' : '🔊';
    });
    hote.appendChild(muet);

    // Les commandes du bureau.
    var cmd = el('div', 'spk-cmd');
    function bouton(cls, txt, touche, fn) {
      var b = el('button', 'spk-btn ' + cls);
      b.type = 'button';
      b.appendChild(el('span', 'spk-btn-txt', txt));
      if (touche) b.appendChild(el('span', 'spk-btn-key', touche));
      // Le bouton rend le focus aussitot : sinon la barre d'espace, qui
      // ouvre les cameras, l'actionnerait une seconde fois.
      b.addEventListener('click', function (ev) { ev.preventDefault(); b.blur(); fn(); });
      cmd.appendChild(b);
      return b;
    }
    var bPorteG = bouton('spk-btn--porte', 'PORTE', 'A', function () { porte('g'); });
    var bLumG = bouton('spk-btn--lum', 'LUMIÈRE', 'Q', function () { lumiere('g'); });
    var bCam = bouton('spk-btn--cam', '▲ CAMÉRAS', 'ESPACE', function () { tablette(); });
    var bLumD = bouton('spk-btn--lum', 'LUMIÈRE', 'M', function () { lumiere('d'); });
    var bPorteD = bouton('spk-btn--porte', 'PORTE', 'P', function () { porte('d'); });
    hote.appendChild(cmd);

    // Le plan des cameras, dans le coin de la tablette.
    var plan = el('div', 'spk-plan');
    plan.appendChild(el('span', 'spk-plan-vous', 'VOUS'));
    var boutonsCam = {};
    Object.keys(CAMS).forEach(function (k) {
      var b = el('button', 'spk-cam', 'CAM ' + k);
      b.type = 'button';
      b.style.left = CAMS[k].x + '%';
      b.style.top = CAMS[k].y + '%';
      b.addEventListener('click', function () { b.blur(); voir(k); });
      plan.appendChild(b);
      boutonsCam[k] = b;
    });
    hote.appendChild(plan);

    // Le jumpscare : la tete, en grand, qui fonce sur l'ecran.
    var peur = el('div', 'spk-peur');
    var peurImg = el('img', 'spk-peur-img');
    peurImg.alt = '';
    peur.appendChild(peurImg);
    hote.appendChild(peur);

    var carton = el('div', 'spk-carton');
    hote.appendChild(carton);

    // ---------- L'etat de la nuit ----------

    var e = {
      t: 0, fini: false, energie: 100,
      porteG: false, porteD: false, animG: 0, animD: 0,
      lumG: false, lumD: false,
      cam: false, camVue: '1A', glitch: 0,
      panne: false, panneT: 0, panneFin: 0,
      vusG: false, vusD: false,
      coupsFoxy: 0
    };

    var A = {};
    ['bonnie', 'chica', 'freddy'].forEach(function (k) {
      A[k] = { lieu: '1A', prochain: hasard(1, PERSOS[k].tous), arrive: 0 };
    });
    A.foxy = { etape: 0, prochain: PERSOS.foxy.tous, course: false, courseFin: 0 };

    var ia = nuit.ia;

    // ---------- Les commandes ----------

    function porte(c) {
      if (e.fini || e.panne) return;
      // Foxy en pleine course ne laisse pas le temps de chercher la tablette :
      // on ferme depuis le bureau, cameras rabattues.
      if (e.cam) tablette();
      var k = c === 'g' ? 'porteG' : 'porteD';
      e[k] = !e[k];
      SON.porte();
      majBoutons();
    }

    function lumiere(c) {
      if (e.fini || e.panne) return;
      if (e.cam) tablette();
      var k = c === 'g' ? 'lumG' : 'lumD', autre = c === 'g' ? 'lumD' : 'lumG';
      e[k] = !e[k];
      e[autre] = false;
      if (e[k]) {
        SON.lumiere();
        // La premiere fois qu'on surprend quelqu'un a la porte, ca sursaute.
        var la = qui(c === 'g' ? 'PG' : 'PD');
        var vus = c === 'g' ? 'vusG' : 'vusD';
        if (la.length && !e[vus]) { e[vus] = true; SON.sursaut(); }
      }
      majBoutons();
    }

    function tablette() {
      if (e.fini || e.panne) return;
      e.cam = !e.cam;
      e.lumG = e.lumD = false;
      e.glitch = 0.35;
      SON.camera();
      hote.classList.toggle('is-cam', e.cam);
      majBoutons();
    }

    function voir(k) {
      if (!e.cam || e.fini) return;
      e.camVue = k;
      e.glitch = 0.3;
      SON.clic();
      majBoutons();
    }

    function majBoutons() {
      bPorteG.classList.toggle('is-on', e.porteG);
      bPorteD.classList.toggle('is-on', e.porteD);
      bLumG.classList.toggle('is-on', e.lumG);
      bLumD.classList.toggle('is-on', e.lumD);
      bCam.classList.toggle('is-on', e.cam);
      bCam.firstChild.textContent = e.cam ? '▼ BUREAU' : '▲ CAMÉRAS';
      Object.keys(boutonsCam).forEach(function (k) {
        boutonsCam[k].classList.toggle('is-vue', k === e.camVue);
      });
      [bPorteG, bLumG, bCam, bLumD, bPorteD].forEach(function (b) { b.disabled = e.panne || e.fini; });
    }

    function auClavier(ev) {
      if (e.fini) return;
      var k = (ev.key || '').toLowerCase();
      if (k === 'a') porte('g');
      else if (k === 'q') lumiere('g');
      else if (k === 'p') porte('d');
      else if (k === 'm') lumiere('d');
      else if (k === ' ') tablette();
      else return;
      ev.preventDefault();
    }
    window.addEventListener('keydown', auClavier);

    // ---------- L'IA ----------

    function qui(lieu) {
      return ['bonnie', 'chica', 'freddy'].filter(function (k) { return A[k].lieu === lieu; });
    }

    function tente(niveau) { return niveau > 0 && Math.random() * 20 < niveau; }

    function deplacer(k, vers) {
      var avant = A[k].lieu;
      A[k].lieu = vers;
      A[k].arrive = e.t;
      if (e.cam && (e.camVue === avant || e.camVue === vers)) e.glitch = 1.2;
      if (k === 'freddy') SON.rire();
      if (vers === 'PG' || vers === 'PD') {
        SON.souffle();
        if (vers === 'PG') e.vusG = false; else e.vusD = false;
      } else if (vers === '2B' || vers === '4B') {
        SON.pas(0.9);
      } else if (vers === '6' || vers === '7') {
        if (Math.random() < 0.5) SON.casseroles();
      }
    }

    function ia1(k) {
      var a = A[k];
      if (e.t < a.prochain) return;
      a.prochain = e.t + PERSOS[k].tous;
      if (!tente(ia[k])) return;

      // Freddy ne bouge pas quand on le regarde.
      if (k === 'freddy' && e.cam && e.camVue === a.lieu) return;

      if (a.lieu === 'PG' || a.lieu === 'PD') {
        // Il laisse toujours quelques secondes avant d'entrer.
        if (e.t - a.arrive < 4) return;
        var ferme = a.lieu === 'PG' ? e.porteG : e.porteD;
        if (ferme) deplacer(k, REPLI[k]);
        else attaque(k);
        return;
      }
      var suite = CHEMINS[k][a.lieu];
      if (!suite) return;
      // On n'entre pas a deux dans l'encadrement d'une porte.
      var libres = suite.filter(function (l) {
        return !((l === 'PG' || l === 'PD') && qui(l).length);
      });
      if (libres.length) deplacer(k, choix(libres));
    }

    function iaFoxy() {
      var f = A.foxy;
      if (f.course) {
        if (e.t < f.courseFin) return;
        f.course = false;
        if (e.porteG) {
          SON.coups();
          e.energie = Math.max(0, e.energie - (2 + e.coupsFoxy * 4));
          e.coupsFoxy++;
          f.etape = Math.random() < 0.5 ? 0 : 1;
          f.prochain = e.t + PERSOS.foxy.tous;
        } else {
          attaque('foxy');
        }
        return;
      }
      if (e.t < f.prochain) return;
      f.prochain = e.t + PERSOS.foxy.tous;
      // Tant qu'on garde un oeil sur les cameras, il reste derriere son
      // rideau.
      if (e.cam || !tente(ia.foxy)) return;
      f.etape++;
      if (f.etape >= 4) {
        f.course = true;
        f.courseFin = e.t + 3.2;
        SON.course();
        if (e.cam && e.camVue === '2A') e.glitch = 0.6;
      }
    }

    // ---------- L'energie ----------

    function usage() {
      return 1 + (e.porteG ? 1 : 0) + (e.porteD ? 1 : 0) +
             (e.lumG || e.lumD ? 1 : 0) + (e.cam ? 1 : 0);
    }

    function majEnergie(dt) {
      if (e.panne) return;
      var k = 1 + (nuit.n - 1) * 0.06;
      e.energie -= usage() * 0.105 * k * dt;
      if (e.energie <= 0) {
        e.energie = 0;
        coupure();
      }
    }

    function coupure() {
      e.panne = true;
      e.cam = false; e.lumG = e.lumD = false;
      e.porteG = e.porteD = false;
      hote.classList.remove('is-cam');
      hote.classList.add('is-panne');
      // La musique se tait d'un coup : il ne reste que le silence.
      if (musique) musique.arreter(0.05);
      SON.panne();
      SON.porte();
      // Freddy vient chanter a la porte avant de passer a l'acte.
      e.panneT = e.t + hasard(4, 9);
      e.panneFin = e.panneT + hasard(6, 14);
      majBoutons();
    }

    // ---------- La fin ----------

    function attaque(k) {
      if (e.fini) return;
      e.fini = true;
      e.cam = false;
      hote.classList.remove('is-cam');
      majBoutons();
      var d = DP.byId(PERSOS[k].id);
      peurImg.src = DP.dinderImg(d.id);
      peur.classList.add('is-on');
      if (musique) musique.arreter(0.05);
      SON.cri();
      setTimeout(function () {
        peur.classList.remove('is-on');
        defaite(k);
      }, reduit ? 900 : 1500);
    }

    function heuresTenues() { return Math.min(6, Math.floor(e.t / HEURE)); }

    function defaite(k) {
      arreter();
      var h = heuresTenues();
      var gain = DP.spookinderEtat().ouvert ? h * XP_HEURE : 0;
      if (gain) DP.gagnerSpookXP(gain);
      hote.classList.add('is-fin');
      carton.textContent = '';
      carton.className = 'spk-carton is-on is-perdu';
      carton.appendChild(el('strong', 'spk-carton-titre', 'GAME OVER'));
      carton.appendChild(el('span', 'spk-carton-sous',
        PERSOS[k].nom + ' t’a trouvé à ' + (h ? h + ' AM' : '12 AM') + '.'));
      if (gain) carton.appendChild(el('span', 'spk-carton-xp', '+' + gain + ' XP de pass'));
      boutonsFin(true);
    }

    function victoire() {
      e.fini = true;
      arreter();
      var ouvert = DP.spookinderEtat().ouvert;
      var premiere = DP.noterNuit(nuit.n);
      var gain = ouvert ? nuit.xp : 0;
      if (gain) DP.gagnerSpookXP(gain);
      if (musique) musique.arreter(1.2);
      SON.carillon();
      hote.classList.remove('is-cam');
      hote.classList.add('is-fin');
      carton.textContent = '';
      carton.className = 'spk-carton is-on is-gagne';
      // 5 AM qui bascule sur 6 AM, comme un compteur mecanique.
      var horloge = el('div', 'spk-six');
      var roue = el('span', 'spk-six-roue');
      roue.appendChild(el('span', null, '5'));
      roue.appendChild(el('span', null, '6'));
      horloge.appendChild(roue);
      horloge.appendChild(el('span', 'spk-six-am', 'AM'));
      carton.appendChild(horloge);
      var suite = el('div', 'spk-carton-suite');
      suite.appendChild(el('strong', 'spk-carton-titre', 'Nuit ' + nuit.n + ' terminée'));
      if (gain) suite.appendChild(el('span', 'spk-carton-xp', '+' + gain + ' XP de pass'));
      if (premiere && nuit.n < NUITS.length) {
        suite.appendChild(el('span', 'spk-carton-sous', 'La nuit ' + (nuit.n + 1) + ' est ouverte.'));
      }
      carton.appendChild(suite);
      boutonsFin(false);
    }

    function boutonsFin(rejouer) {
      var b = el('div', 'spk-carton-btns');
      if (rejouer) {
        var re = el('button', 'spk-gros-btn', 'RÉESSAYER');
        re.type = 'button';
        re.addEventListener('click', function () { quitter('rejouer'); });
        b.appendChild(re);
      }
      var ret = el('button', 'spk-gros-btn spk-gros-btn--plat', 'RETOUR');
      ret.type = 'button';
      ret.addEventListener('click', function () { quitter('retour'); });
      b.appendChild(ret);
      carton.appendChild(b);
    }

    // ---------- Le dessin ----------

    var grain = grains();

    function dessinerPorte(x0, cote, ouverte, anim, lum, present) {
      var y0 = 40, h = 112, w = 54;
      if (lum && !e.panne) {
        r(ctx, x0, y0, w, h, '#4a4234');
        // Le sol du couloir, eclaire sur quelques metres.
        for (var Y = y0 + 70; Y < y0 + h; Y += 6) {
          for (var X = x0; X < x0 + w; X += 6) {
            r(ctx, X, Y, 6, 6, ((X + Y) / 6) % 2 ? '#6a6458' : '#2a2620');
          }
        }
        // Celui qui attend dans l'embrasure, cadre par le chambranle.
        ctx.save();
        ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
        present.forEach(function (k, i) {
          sprite(ctx, k, x0 + w / 2 + i * 8, y0 + h + 6, 1.5);
        });
        ctx.restore();
      } else {
        r(ctx, x0, y0, w, h, '#030304');
      }
      // Le rideau de fer, qui descend.
      var hp = Math.round(h * anim);
      if (hp > 0) {
        r(ctx, x0, y0, w, hp, '#5a5c66');
        for (var s = y0 + 4; s < y0 + hp; s += 8) r(ctx, x0, s, w, 2, '#3a3c44');
        r(ctx, x0, y0 + hp - 3, w, 3, '#2a2c34');
        r(ctx, x0 + 4, y0 + hp - 8, 8, 3, '#e0c020');
        r(ctx, x0 + w - 12, y0 + hp - 8, 8, 3, '#e0c020');
      }
      // Le chambranle.
      r(ctx, x0 - 3, y0 - 3, w + 6, 3, '#18181e');
      r(ctx, x0 - 3, y0, 3, h, '#18181e');
      r(ctx, x0 + w, y0, 3, h, '#18181e');
      // Le boitier des deux boutons, a cote de la porte.
      var bx = cote === 'g' ? x0 + w + 6 : x0 - 16;
      r(ctx, bx, 78, 10, 30, '#2a2a30');
      r(ctx, bx + 2, 82, 6, 8, ouverte ? '#5a1a1a' : '#ff3030');
      r(ctx, bx + 2, 94, 6, 8, lum ? '#f0f0e0' : '#4a4a44');
    }

    function dessinerBureau() {
      ctx.drawImage(bureau().c, 0, 0);

      // Le ventilateur, qui tourne sur le bureau.
      var a = (e.t * 18) % 2 < 1;
      r(ctx, 238, 116, 4, 24, '#2a2a30');
      r(ctx, 228, 104, 24, 18, '#3a3a42');
      if (a) { r(ctx, 230, 112, 20, 2, '#8a8a92'); r(ctx, 239, 106, 2, 14, '#8a8a92'); }
      else { r(ctx, 232, 106, 2, 2, '#8a8a92'); r(ctx, 246, 106, 2, 2, '#8a8a92');
             r(ctx, 232, 118, 2, 2, '#8a8a92'); r(ctx, 246, 118, 2, 2, '#8a8a92');
             r(ctx, 234, 108, 12, 10, '#6a6a72'); }

      // La lampe qui grisaille, et parfois vacille.
      var vac = Math.random() < 0.02 ? 0.25 : 0;
      ctx.fillStyle = 'rgba(0,0,0,' + (0.35 + vac) + ')';
      ctx.fillRect(0, 0, W, H);
      var grad = ctx.createRadialGradient(W / 2, 120, 20, W / 2, 120, 220);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,.75)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Les portes passent apres la penombre : une lumiere allumee doit
      // trancher sur le reste du bureau.
      dessinerPorte(6, 'g', !e.porteG, e.animG, e.lumG, qui('PG'));
      dessinerPorte(260, 'd', !e.porteD, e.animD, e.lumD, qui('PD'));

      if (e.panne) {
        ctx.fillStyle = 'rgba(0,0,0,.82)';
        ctx.fillRect(0, 0, W, H);
        // Deux yeux qui s'allument et s'eteignent dans l'embrasure.
        if (e.t > e.panneT && Math.floor(e.t * 3) % 2) {
          r(ctx, 26, 82, 4, 3, '#f0f0f0'); r(ctx, 40, 82, 4, 3, '#f0f0f0');
          r(ctx, 27, 83, 2, 1, '#7fd0e8'); r(ctx, 41, 83, 2, 1, '#7fd0e8');
        }
      }
    }

    function dessinerCamera() {
      var k = e.camVue;
      ctx.drawImage(piece(k).c, 0, 0);

      if (k === '6') {
        ctx.fillStyle = '#e8e8e8'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('CAMÉRA DÉSACTIVÉE', W / 2, 98);
        ctx.font = '8px monospace';
        ctx.fillText('— AUDIO SEULEMENT —', W / 2, 114);
      } else if (k === '1C') {
        dessinerCrique();
      } else {
        var poses = POSES[k] || {};
        ['bonnie', 'chica', 'freddy'].forEach(function (q) {
          if (A[q].lieu !== k || !poses[q]) return;
          var p = poses[q];
          sprite(ctx, q, p[0], p[1], p[2]);
        });
        // Foxy qui file dans le couloir ouest.
        if (k === '2A' && A.foxy.course) {
          var reste = Math.max(0, A.foxy.courseFin - e.t) / 3.2;
          sprite(ctx, 'foxy', 160 + (1 - reste) * 30, 150 + (1 - reste) * 80, 0.8 + (1 - reste) * 2);
        }
      }

      // L'obscurite d'une salle vide la nuit.
      ctx.fillStyle = 'rgba(4,6,10,.38)';
      ctx.fillRect(0, 0, W, H);

      // Le grain, plus fort quand la camera vient d'etre derangee.
      ctx.save();
      ctx.globalAlpha = 0.1 + Math.min(0.85, e.glitch);
      ctx.drawImage(grain[Math.floor(e.t * 20) % grain.length], 0, 0);
      ctx.restore();
      if (e.glitch > 0.5) {
        for (var i = 0; i < 6; i++) r(ctx, 0, Math.random() * H, W, 1 + Math.random() * 3, 'rgba(255,255,255,.25)');
      }

      // Le liseré, le nom de la piece, le point rouge qui clignote.
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(4.5, 4.5, W - 9, H - 9);
      ctx.fillStyle = '#f0f0f0'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
      // Sous le bandeau de l'energie, pour ne pas s'y melanger.
      if (Math.floor(e.t * 2) % 2) {
        ctx.fillStyle = '#ff2a2a';
        ctx.beginPath(); ctx.arc(14, 40, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#f0f0f0';
      ctx.fillText('CAM ' + k + '  ' + CAMS[k].nom.toUpperCase(), 22, 43);
    }

    function dessinerCrique() {
      var et = A.foxy.course ? 4 : A.foxy.etape;
      // Le rideau mauve a etoiles, plus ou moins tire.
      var ouv = [0, 14, 46, 90, 90][et];
      if (et >= 1 && et < 4) {
        sprite(ctx, 'foxy', 160, 160 + (et === 1 ? 20 : 0), et === 1 ? 1.4 : 1.6);
      }
      [-1, 1].forEach(function (s) {
        var x0 = s < 0 ? 70 : 160 + ouv / 2;
        var w = 90 - ouv / 2;
        r(ctx, x0, 30, w, 120, '#5a2a8a');
        for (var X = x0; X < x0 + w; X += 10) r(ctx, X, 30, 3, 120, '#4a1f78');
        for (var i = 0; i < 6; i++) r(ctx, x0 + ((i * 23) % Math.max(1, w - 4)), 40 + i * 17, 3, 3, '#f0d060');
      });
      // Le panneau, accroche devant.
      r(ctx, 110, 150, 100, 18, '#e8d8a0');
      ctx.fillStyle = '#5a1a1a'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
      ctx.fillText(et >= 4 ? 'IL N’EST PLUS LÀ' : 'DÉSOLÉ ! HORS SERVICE', 160, 162);
    }

    function dessiner() {
      if (e.cam) dessinerCamera();
      else dessinerBureau();
    }

    // ---------- Le bandeau ----------

    var heureVue = -1;
    function majHud() {
      var h = heuresTenues();
      if (h !== heureVue) {
        heureVue = h;
        elHeure.textContent = (h === 0 ? 12 : h) + ' AM';
      }
      elEnergie.textContent = 'Énergie : ' + Math.ceil(e.energie) + ' %';
      var u = usage();
      elUsage.textContent = 'Usage ';
      for (var i = 0; i < 5; i++) {
        var b = el('i', 'spk-barre' + (i < u ? ' is-on' : '') + (i >= 3 ? ' is-rouge' : (i >= 2 ? ' is-jaune' : '')));
        elUsage.appendChild(b);
      }
      elEnergie.classList.toggle('is-bas', e.energie < 20);
    }

    // ---------- La boucle ----------

    var brut = 0, avant = 0, hudT = 0, arrete = false;

    function image(ms) {
      if (arrete) return;
      if (!document.body.contains(hote)) { arreter(); return; }
      var dt = avant ? Math.min(0.1, (ms - avant) / 1000) : 0;
      avant = ms;
      if (!e.fini) {
        e.t += dt;
        e.glitch = Math.max(0, e.glitch - dt * 1.6);
        e.animG += ((e.porteG ? 1 : 0) - e.animG) * Math.min(1, dt * 14);
        e.animD += ((e.porteD ? 1 : 0) - e.animD) * Math.min(1, dt * 14);

        if (!e.panne) {
          ia1('bonnie'); ia1('chica'); ia1('freddy');
          iaFoxy();
          majEnergie(dt);
        } else if (e.t >= e.panneT && !e.boite) {
          e.boite = true;
          SON.boite(e.panneFin - e.panneT);
        } else if (e.t >= e.panneFin) {
          attaque('freddy');
        }

        if (!e.fini && e.t >= HEURE * 6) victoire();

        hudT -= dt;
        if (hudT <= 0) {
          majHud();
          hudT = 0.2;
          // La musique se resserre avec l'heure, et plus encore quand
          // l'energie vient a manquer.
          if (musique) {
            musique.intensite(e.t / (HEURE * 6) * 0.7 +
                              (e.energie < 30 ? (30 - e.energie) / 30 * 0.4 : 0));
          }
        }
      }
      if (!e.fini || peur.classList.contains('is-on')) dessiner();
      if (!arrete) brut = requestAnimationFrame(image);
    }

    function arreter() {
      arrete = true;
      if (brut) cancelAnimationFrame(brut);
      brut = 0;
      SON.couper();
      window.removeEventListener('keydown', auClavier);
    }

    // Le carton d'ouverture : "12 AM — Nuit 1", puis on y est.
    carton.className = 'spk-carton is-on is-debut';
    carton.appendChild(el('strong', 'spk-carton-heure', '12:00 AM'));
    carton.appendChild(el('span', 'spk-carton-sous', 'Nuit ' + nuit.n));
    setTimeout(function () { carton.className = 'spk-carton'; carton.textContent = ''; },
               reduit ? 600 : 2400);

    SON.reveiller();
    SON.ambiance();
    var musique = SON.musique();
    majBoutons();
    majHud();
    brut = requestAnimationFrame(image);

    // Pour les essais : regarder l'etat, avancer l'horloge.
    hote._spk = {
      etat: e, A: A,
      avancer: function (s) { e.t += s; },
      vider: function () { e.energie = 0.01; },
      attaque: attaque
    };
  }

  // ==========================================================
  //  L'ecran de l'evenement : les nuits et le pass
  // ==========================================================

  // Le temps qui reste, en jours, heures, minutes et secondes.
  function decompte(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    return [Math.floor(s / 86400), Math.floor(s % 86400 / 3600),
            Math.floor(s % 3600 / 60), s % 60];
  }

  var UNITES = ['jours', 'heures', 'min', 'sec'];

  // Le compte a rebours jusqu'au 1er novembre, 0 h : quatre cases de
  // chiffres, rafraichies chaque seconde par majRebours().
  function rebours() {
    var b = el('div', 'spk-rebours');
    b.appendChild(el('span', 'spk-rebours-titre', 'Fin de l’événement dans'));
    var cases = el('div', 'spk-rebours-cases');
    UNITES.forEach(function (u) {
      var k = el('span', 'spk-rebours-case');
      k.appendChild(el('strong', 'spk-rebours-n', '--'));
      k.appendChild(el('span', 'spk-rebours-u', u));
      cases.appendChild(k);
    });
    b.appendChild(cases);
    majRebours(b);
    return b;
  }

  function majRebours(b) {
    var v = decompte(DP.spookinderEtat().reste);
    var n = b.querySelectorAll('.spk-rebours-n');
    for (var i = 0; i < 4; i++) {
      var txt = String(v[i]).padStart(2, '0');
      if (n[i].textContent !== txt) {
        n[i].textContent = txt;
        // Le chiffre qui change tombe d'un cran.
        n[i].classList.remove('is-tic');
        void n[i].offsetWidth;
        n[i].classList.add('is-tic');
      }
    }
    // La derniere journee, le compteur passe au rouge.
    b.classList.toggle('is-urgent', v[0] === 0);
  }

  function viewSpookinder(view) {
    var box = el('div', 'spk');
    view.appendChild(box);

    function accueil() {
      box.textContent = '';
      box.className = 'spk';
      var ev = DP.spookinderEtat();
      var s = DP.spookinder();

      var tete = el('div', 'spk-tete');
      tete.appendChild(el('h2', 'spk-titre', 'Spookinder'));
      if (ev.ouvert) {
        tete.appendChild(rebours());
      } else {
        tete.appendChild(el('span', 'spk-fin is-close', 'L’événement est terminé : le pass est fermé.'));
      }
      box.appendChild(tete);

      // ---------- Le pass ----------
      var pass = el('section', 'spk-pass');
      var atteint = palierAtteint();
      var dans = s.xp - atteint * XP_PALIER;
      var haut = el('div', 'spk-pass-haut');
      haut.appendChild(el('strong', 'spk-pass-nom', 'Pass de combat'));
      haut.appendChild(el('span', 'spk-pass-niv',
        atteint >= PALIERS.length ? 'Palier max · ' + s.xp + ' XP'
                                  : 'Palier ' + atteint + ' / ' + PALIERS.length +
                                    ' · ' + dans + ' / ' + XP_PALIER + ' XP'));
      pass.appendChild(haut);
      var jauge = el('div', 'spk-jauge');
      var plein = el('div', 'spk-jauge-plein');
      plein.style.width = (atteint >= PALIERS.length ? 100 : dans / XP_PALIER * 100) + '%';
      jauge.appendChild(plein);
      pass.appendChild(jauge);

      var piste = el('div', 'spk-piste');
      PALIERS.forEach(function (rec, i) {
        var n = i + 1;
        var pris = s.reclames.indexOf(n) !== -1;
        var ok = n <= atteint && !pris && ev.ouvert;
        var c = el(ok ? 'button' : 'div', 'spk-palier' +
                   (pris ? ' is-pris' : '') + (ok ? ' is-pret' : '') +
                   (n > atteint ? ' is-loin' : '') +
                   (rec.type === 'dinder' ? ' is-dinder' : ''));
        if (ok) c.type = 'button';
        c.appendChild(el('span', 'spk-palier-n', String(n)));
        var im = el('img', 'spk-palier-img');
        im.src = imageDe(rec);
        im.alt = '';
        c.appendChild(im);
        // Un Dinder pas encore reclame reste une silhouette.
        c.appendChild(el('span', 'spk-palier-nom',
          rec.type === 'dinder' && !pris ? 'Dinder Exclusif' : libelle(rec)));
        if (pris) c.appendChild(el('span', 'spk-palier-ok', '✓'));
        if (ok) c.addEventListener('click', function () { prendre(n, c); });
        piste.appendChild(c);
      });
      pass.appendChild(piste);
      box.appendChild(pass);

      // Le premier palier encore a prendre, sous les yeux.
      requestAnimationFrame(function () {
        var cible = piste.querySelector('.is-pret') || piste.children[Math.min(atteint, PALIERS.length - 1)];
        if (cible && piste.scrollTo) piste.scrollLeft = Math.max(0, cible.offsetLeft - piste.clientWidth / 2 + cible.clientWidth / 2);
      });

      // ---------- Les nuits ----------
      var nuits = el('section', 'spk-nuits');
      NUITS.forEach(function (nu) {
        var ouverte = nuitOuverte(nu.n);
        var faite = s.nuits.indexOf(nu.n) !== -1;
        var b = el(ouverte ? 'button' : 'div', 'spk-nuit-btn' +
                   (ouverte ? '' : ' is-ferme') + (faite ? ' is-faite' : '') +
                   (nu.n === 6 ? ' is-cauchemar' : ''));
        if (ouverte) b.type = 'button';
        b.appendChild(el('strong', null, ouverte ? 'Nuit ' + nu.n : '???'));
        b.appendChild(el('span', 'spk-nuit-sous',
          !ouverte ? 'Tiens la nuit ' + (nu.n - 1) :
          (faite ? '✓ ' : '') + (ev.ouvert ? '+' + nu.xp + ' XP' : 'Hors pass')));
        if (ouverte) b.addEventListener('click', function () { jouer(nu); });
        nuits.appendChild(b);
      });
      box.appendChild(nuits);

      var aide = el('p', 'spk-aide',
        'Ferme les portes quand quelqu’un s’y tient, surveille la Crique du Pirate, ' +
        'et garde de l’énergie jusqu’à 6 h. Une nuit perdue rapporte quand même ' +
        XP_HEURE + ' XP par heure tenue.');
      box.appendChild(aide);
    }

    function prendre(n, carte) {
      var rec = PALIERS[n - 1];
      if (!reclamer(n)) return;
      SON.reveiller();
      if (rec.type === 'dinder') {
        revelation(rec.id, accueil);
      } else {
        SON.palier();
        carte.classList.add('is-prend');
        setTimeout(accueil, reduit ? 0 : 650);
      }
    }

    // Un Dinder du pass ne tombe pas dans une liste : les lumieres
    // tremblent, s'eteignent, et il est la.
    function revelation(id, ensuite) {
      var d = DP.byId(id);
      var r = el('div', 'spk-revel');
      var im = el('img', 'spk-revel-img');
      im.src = DP.dinderImg(id);
      im.alt = '';
      r.appendChild(el('div', 'spk-revel-flash'));
      r.appendChild(im);
      var txt = el('div', 'spk-revel-txt');
      txt.appendChild(el('span', 'spk-revel-haut', 'Nouveau Dinder'));
      txt.appendChild(el('strong', 'spk-revel-nom', d.name));
      if (d.form) txt.appendChild(el('span', 'spk-revel-forme', d.form));
      var rar = el('span', 'spk-revel-rar', d.rarity);
      rar.dataset.rarity = DP.rarityKey(d.rarity);
      txt.appendChild(rar);
      r.appendChild(txt);
      box.appendChild(r);
      SON.sursaut();
      setTimeout(function () { SON.carillon(); }, reduit ? 300 : 1500);

      var fini = false;
      function fermer() {
        if (fini) return;
        fini = true;
        r.classList.add('is-sortie');
        setTimeout(function () { r.remove(); ensuite(); }, 400);
      }
      setTimeout(function () {
        var b = el('button', 'spk-gros-btn', 'CONTINUER');
        b.type = 'button';
        b.addEventListener('click', fermer);
        txt.appendChild(b);
        b.focus();
      }, reduit ? 400 : 3000);
    }

    function jouer(nu) {
      SON.reveiller();
      box.textContent = '';
      box.className = 'spk spk--jeu';
      partie(box, nu, function (choixFin) {
        if (choixFin === 'rejouer') jouer(nu);
        else accueil();
      });
    }

    // Le compte a rebours suit l'heure tant que l'accueil est affiche ;
    // a zero, l'ecran se redessine, pass ferme.
    var veille = setInterval(function () {
      if (!document.body.contains(box)) { clearInterval(veille); SON.couper(); return; }
      var b = box.querySelector('.spk-rebours');
      if (!b) return;
      if (!DP.spookinderEtat().ouvert) { accueil(); return; }
      majRebours(b);
    }, 1000);

    if (window.INTRO) {
      box.appendChild(window.INTRO.ecran({
        icone: JAQUETTE,
        titre: 'Spookinder',
        teinte: '#ff8a1e',
        bouton: 'ENTRER',
        lignes: [
          'Une pizzeria, la nuit. Tu es le gardien.',
          'Les animatroniques se promènent après la fermeture.',
          'Tiens jusqu’à 6 h, et le pass te les ramènera.'
        ],
        commencer: accueil
      }));
    } else {
      accueil();
    }
  }

  // ==========================================================
  //  Branchement
  // ==========================================================

  if (window.VIEWS) {
    window.VIEWS['spookinder'] = { title: 'Spookinder', render: viewSpookinder };
  }

  // Le jeu ne se montre dans la liste qu'une fois l'evenement ouvert.
  window.MINIJEUX = window.MINIJEUX || [];
  var entree = {
    id: 'spookinder', nom: 'Spookinder', vue: 'spookinder', pret: true,
    img: JAQUETTE
  };
  Object.defineProperty(entree, 'sous', {
    enumerable: true,
    get: function () {
      var ev = DP.spookinderEtat();
      return ev.ouvert ? 'Événement d’Halloween · jusqu’au 31 octobre'
                       : 'Événement terminé';
    }
  });
  var ev0 = DP.spookinderEtat();
  if (ev0.ouvert || ev0.passe) window.MINIJEUX.unshift(entree);

  window.SPOOKINDER = {
    PALIERS: PALIERS, NUITS: NUITS, XP_PALIER: XP_PALIER, HEURE: HEURE,
    palierAtteint: palierAtteint, reclamer: reclamer, nuitOuverte: nuitOuverte
  };
})();
