// VAULT — les sons : bips de touches fabriqués à la volée (Web Audio),
// et la voix robotique (fichiers dans "sons/").
// Le navigateur n'autorise le son qu'après un premier toucher : le
// contexte audio est créé, puis débloqué, au premier appui.
(function () {
  "use strict";

  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, sortie = null;
  var voix = {};
  var FICHIERS = {
    autorise: "sons/acces-autorise.wav?v=robot2",
    refuse: "sons/acces-refuse.wav?v=robot2"
  };

  function demarrer() {
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      sortie = ctx.createGain();
      sortie.gain.value = 0.9;
      sortie.connect(ctx.destination);
      Object.keys(FICHIERS).forEach(charger);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function charger(nom) {
    fetch(FICHIERS[nom])
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (data) {
        return new Promise(function (ok, ko) { ctx.decodeAudioData(data, ok, ko); });
      })
      .then(function (buf) { voix[nom] = buf; })
      .catch(function () {});
  }

  // Une note brève : forme d'onde, fréquence de départ et d'arrivée,
  // durée, volume, et décalage dans le temps.
  function note(type, f0, f1, duree, vol, dans) {
    var c = demarrer();
    if (!c) return;
    var t = c.currentTime + (dans || 0);
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + duree);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g);
    g.connect(sortie);
    o.start(t);
    o.stop(t + duree + 0.02);
  }

  // Une gamme étrange (mode « hors du monde ») : chaque touche a sa note
  // selon sa place sur la grille, pas selon son symbole.
  var GAMME = [0, 1, 4, 6, 7, 10];
  function frequenceTouche(i) {
    var degre = GAMME[i % GAMME.length];
    var octave = Math.floor(i / GAMME.length) % 3;
    return 440 * Math.pow(2, (degre + 12 * octave - 5) / 12);
  }

  var Son = {
    debloquer: demarrer,

    touche: function (i) {
      var f = frequenceTouche(i || 0);
      note("square", f * 2, f, 0.07, 0.07);        // bip principal, qui retombe
      note("sine", f * 4, f * 4, 0.03, 0.05, 0.012); // petit éclat aigu
    },

    retour: function () {
      note("square", 520, 260, 0.09, 0.06);
    },

    effacer: function () {
      note("square", 600, 600, 0.05, 0.06);
      note("square", 400, 400, 0.05, 0.06, 0.06);
      note("square", 260, 200, 0.08, 0.06, 0.12);
    },

    melanger: function () {
      for (var k = 0; k < 6; k++) {
        note("triangle", 300 + k * 140, 340 + k * 140, 0.05, 0.06, k * 0.035);
      }
    },

    vide: function () {
      note("sawtooth", 180, 170, 0.12, 0.05);
    },

    autorise: function () {
      // Trois notes qui montent, puis la voix.
      note("square", 660, 660, 0.08, 0.06);
      note("square", 880, 880, 0.08, 0.06, 0.09);
      note("square", 1320, 1320, 0.16, 0.06, 0.18);
      // Renvoie le temps (ms) jusqu'à la fin de la voix, pour que
      // l'ouverture attende « Bienvenue patron ».
      return parler("autorise", 0.32);
    },

    refuse: function () {
      // Un bourdon grave et grinçant, puis la voix.
      note("sawtooth", 140, 110, 0.32, 0.09);
      note("square", 147, 115, 0.32, 0.05);
      parler("refuse", 0.3);
    },

    portes: function () {
      note("sawtooth", 90, 45, 0.5, 0.08);
      note("sine", 60, 40, 0.6, 0.15, 0.45); // le choc des battants
    }
  };

  function parler(nom, dans) {
    var c = demarrer();
    if (!c || !voix[nom]) return 0;
    var s = c.createBufferSource();
    s.buffer = voix[nom];
    s.connect(sortie);
    s.start(c.currentTime + (dans || 0));
    return Math.round(((dans || 0) + voix[nom].duration) * 1000);
  }

  // Débloque le son dès le premier contact avec l'écran.
  ["pointerdown", "touchstart", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, demarrer, { once: true, passive: true });
  });

  window.VaultSon = Son;
})();
