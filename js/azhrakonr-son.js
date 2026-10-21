// Les sons d'Azhrakonr : son arrivee et le combat.
//
// Tout est synthetise sur place avec Web Audio : pas de fichier a charger.
//   - l'arrivee : une musique qui commence des que le code est accepte —
//     une boite a musique desaccordee au-dessus d'un choeur funebre, et un
//     coeur qui bat de plus en plus fort a mesure qu'il approche — posee
//     sur une nappe grave ; les bips du compte a rebours, les grondements ;
//   - sa voix : grave, distordue, qui "parle" pendant que le texte s'ecrit,
//     apres une longue inspiration quand le dialogue s'ouvre ;
//   - le combat : une musique lente et tragique — glas, choeur, lamentation
//     qui descend, cordes qui grincent — que la seconde phase precipite et
//     sature ; et un bruit pour chaque geste.
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  var ac = null, maitre = null, bruitBuf = null, compresseur = null, salle = null;
  var muet = false;
  try { muet = localStorage.getItem('dinderpad.azh.muet') === '1'; } catch (e) {}

  function pret() {
    if (!AC) return false;
    if (!ac) {
      try { ac = new AC(); } catch (e) { return false; }
      compresseur = ac.createDynamicsCompressor();
      compresseur.threshold.value = -16; compresseur.ratio.value = 5;
      maitre = ac.createGain();
      maitre.gain.value = muet ? 0 : 0.7;
      maitre.connect(compresseur);
      compresseur.connect(ac.destination);
      bruitBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      var d = bruitBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // Une grande salle de pierre : une reverberation qui donne de
      // l'espace au choeur, au glas et a la voix.
      salle = ac.createConvolver();
      var lg = Math.floor(ac.sampleRate * 3.2), ir = ac.createBuffer(2, lg, ac.sampleRate);
      for (var c = 0; c < 2; c++) {
        var ch = ir.getChannelData(c);
        // L'enveloppe ne change qu'un peu d'un echantillon a l'autre : on la
        // calcule par blocs, c'est bien plus rapide.
        for (var k = 0; k < lg; k += 256) {
          var env_ = Math.pow(1 - k / lg, 2.6), fin = Math.min(lg, k + 256);
          for (var j = k; j < fin; j++) ch[j] = (Math.random() * 2 - 1) * env_;
        }
      }
      salle.buffer = ir;
      var retour = ac.createGain(); retour.gain.value = 0.55;
      salle.connect(retour); retour.connect(maitre);
    }
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
    return true;
  }

  function maintenant() { return ac.currentTime; }
  function gain(v, vers) { var g = ac.createGain(); g.gain.value = v; g.connect(vers || maitre); return g; }
  function osc(type, f, vers) { var o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.connect(vers); return o; }
  function bruit(vers, boucle) { var s = ac.createBufferSource(); s.buffer = bruitBuf; s.loop = !!boucle; s.connect(vers); return s; }
  function filtre(type, f, q, vers) {
    var b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; b.connect(vers); return b;
  }
  function env(g, t, a, d, pic) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pic, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function saturation(k, vers) {
    var w = ac.createWaveShaper(), n = 1024, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
    w.curve = c; w.connect(vers); return w;
  }
  // Un depart vers la salle, en plus du son direct.
  function versSalle(noeud, dose) { var g = ac.createGain(); g.gain.value = dose; noeud.connect(g); g.connect(salle); return g; }

  var LA = 55;                               // la grave
  function note(n, base) { return (base || LA) * Math.pow(2, n / 12); }

  // ==========================================================
  //  Les instruments
  // ==========================================================

  // Un choeur : des scies desaccordees passees dans les formants d'un "a"
  // ouvert, lentes a venir, lentes a partir.
  function choeur(vers, notes, t, duree, fort) {
    var g = gain(0.0001, vers);
    var f1 = filtre('bandpass', 700, 4, g), f2 = filtre('bandpass', 1150, 5, g), f3 = filtre('bandpass', 2600, 6, g);
    var lfo = osc('sine', 5.2, ac.createGain()), lfoG = ac.createGain(); lfoG.gain.value = 3;
    lfo.disconnect(); lfo.connect(lfoG);
    notes.forEach(function (n) {
      [-0.12, 0, 0.12].forEach(function (d) {
        var o = ac.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = note(n, LA * 4) * (1 + d / 100);
        lfoG.connect(o.frequency);
        o.connect(f1); o.connect(f2); o.connect(f3);
        o.start(t); o.stop(t + duree + 0.1);
      });
    });
    lfo.start(t); lfo.stop(t + duree + 0.1);
    versSalle(g, 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(fort, t + duree * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  }

  // Le glas : une cloche aux partiels inharmoniques, qui s'eteint longuement.
  function glas(vers, f, t, fort) {
    [[1, 1], [2.0, 0.6], [2.76, 0.45], [5.4, 0.25], [8.9, 0.12]].forEach(function (p) {
      var g = gain(0.0001, vers), o = osc('sine', f * p[0], g);
      env(g, t, 0.004, 4.5 / Math.sqrt(p[0]), fort * p[1]);
      versSalle(g, 0.6);
      o.start(t); o.stop(t + 5);
    });
  }

  // La boite a musique : des notes de cristal, un peu fausses, avec un echo.
  var echo = null;
  function boite(vers, f, t, fort) {
    if (!echo) {
      echo = ac.createDelay(1); echo.delayTime.value = 0.42;
      var fb = ac.createGain(); fb.gain.value = 0.38;
      echo.connect(fb); fb.connect(echo);
      var sortie = ac.createGain(); sortie.gain.value = 0.5;
      echo.connect(sortie); sortie.connect(maitre);
    }
    var faux = 1 + (Math.random() - 0.5) * 0.012;      // desaccordee
    [[1, 1], [3.01, 0.25], [5.2, 0.08]].forEach(function (p) {
      var g = gain(0.0001, vers), o = osc('sine', f * p[0] * faux, g);
      env(g, t, 0.003, 1.4 / p[0], fort * p[1]);
      g.connect(echo);
      versSalle(g, 0.4);
      o.start(t); o.stop(t + 1.6);
    });
  }

  // Le coeur : deux coups sourds, lub-dub.
  function coeur(vers, t, fort) {
    [0, 0.17].forEach(function (d, i) {
      var g = gain(0.0001, vers), o = osc('sine', 55, g);
      o.frequency.setValueAtTime(i ? 70 : 62, t + d);
      o.frequency.exponentialRampToValueAtTime(32, t + d + 0.18);
      env(g, t + d, 0.004, 0.22, fort * (i ? 0.7 : 1));
      o.start(t + d); o.stop(t + d + 0.3);
    });
  }

  // Des cordes qui grincent : une seconde mineure en tremolo.
  function cordes(vers, notes, t, duree, fort) {
    var g = gain(0.0001, vers), lp = filtre('lowpass', 2400, 1, g);
    var trem = ac.createGain(); trem.gain.value = 1; trem.connect(lp);
    var lfo = osc('sine', 11, ac.createGain()), lfoG = ac.createGain(); lfoG.gain.value = 0.5;
    lfo.disconnect(); lfo.connect(lfoG); lfoG.connect(trem.gain);
    notes.forEach(function (n) {
      var o = osc('sawtooth', note(n, LA * 4), trem); o.start(t); o.stop(t + duree + 0.1);
    });
    lfo.start(t); lfo.stop(t + duree + 0.1);
    versSalle(g, 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(fort, t + duree * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  }

  // Une voix de lamentation : un triangle qui chante, avec un vibrato.
  function plainte(vers, f, t, duree, fort) {
    var g = gain(0.0001, vers), lp = filtre('lowpass', 1800, 1, g);
    var o = osc('triangle', f, lp), o2 = osc('sine', f * 2, lp);
    var vib = osc('sine', 5, ac.createGain()), vg = ac.createGain(); vg.gain.value = f * 0.012;
    vib.disconnect(); vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(fort, t + 0.18);
    g.gain.setValueAtTime(fort, t + duree * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    versSalle(g, 0.7);
    [o, o2, vib].forEach(function (x) { x.start(t); x.stop(t + duree + 0.1); });
  }

  // ==========================================================
  //  Le sequenceur
  // ==========================================================
  // Une piste joue un "pas" a la fois, programme un peu a l'avance.

  function Piste(tempo, jouer, volume) {
    var p = { tempo: tempo, pas: 0, prochain: maintenant() + 0.15, intensite: 0, rage: false };
    p.sortie = gain(0.0001);
    p.sortie.gain.setValueAtTime(0.0001, maintenant());
    p.sortie.gain.exponentialRampToValueAtTime(volume, maintenant() + 1.2);
    p.volume = volume;
    p.vers = p.sortie;
    p.minuteur = setInterval(function () {
      if (!ac) return;
      var dt = 60 / p.tempo / 4;
      while (p.prochain < ac.currentTime + 0.15) {
        jouer(p, p.pas, p.prochain, dt);
        p.prochain += dt;
        p.pas++;
      }
    }, 30);
    p.fin = function (duree) {
      clearInterval(p.minuteur);
      var t = maintenant();
      p.sortie.gain.cancelScheduledValues(t);
      p.sortie.gain.setValueAtTime(Math.max(0.0001, p.sortie.gain.value), t);
      p.sortie.gain.exponentialRampToValueAtTime(0.0001, t + (duree || 1));
    };
    p.niveau = function (v, duree) {
      var t = maintenant();
      p.sortie.gain.cancelScheduledValues(t);
      p.sortie.gain.setValueAtTime(Math.max(0.0001, p.sortie.gain.value), t);
      p.sortie.gain.exponentialRampToValueAtTime(Math.max(0.0001, v), t + (duree || 1));
    };
    return p;
  }

  // ==========================================================
  //  L'arrivee : la nappe, et la musique du code
  // ==========================================================

  var nappe = null, arrivee = null;

  function nappeDebut() {
    if (!pret() || nappe) return;
    var t = maintenant();
    var sortie = gain(0.0001);
    sortie.gain.exponentialRampToValueAtTime(0.4, t + 4);
    var lp = filtre('lowpass', 220, 6, sortie);
    var lfo = osc('sine', 0.09, ac.createGain()), lfoG = ac.createGain(); lfoG.gain.value = 120;
    lfo.disconnect(); lfo.connect(lfoG); lfoG.connect(lp.frequency);
    var oscs = [55, 55.4, 82.4, 110.6].map(function (f, i) {
      var g = ac.createGain(); g.gain.value = i === 3 ? 0.08 : 0.22; g.connect(lp);
      var o = osc('sawtooth', f, g); o.start(t); return o;
    });
    var sous = gain(0.35, sortie), so = osc('sine', 27.5, sous); so.start(t);
    var souffleG = gain(0.05, sortie), bp = filtre('bandpass', 400, 0.8, souffleG), b = bruit(bp, true); b.start(t);
    lfo.start(t);
    nappe = { sortie: sortie, lp: lp, oscs: oscs.concat([so, lfo]), bruit: b, souffle: souffleG, bp: bp };
  }

  // La musique du code. Une phrase de boite a musique en la mineur, qui
  // glisse vers un re diese de trop ; dessous, le choeur funebre (la
  // mineur, fa, re mineur, mi) ; et, avec la tension, le coeur, puis les
  // cordes qui grincent.
  var BOITE = [12, 15, 19, 18, 19, 15, 12, 11, 12, 15, 19, 24, 23, 19, 18, 15];
  var CHOEUR_ARRIVEE = [[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-5, -1, 2]];

  function arriveeDebut() {
    if (!pret()) return;
    // La musique du voyage cede la place.
    voyageFin(2.5);
    nappeDebut();
    if (arrivee) return;
    // Elle doit s'entendre des le code accepte : la boite, le choeur, le
    // glas et la basse jouent tout de suite ; la tension n'ajoute que le
    // coeur, puis les cordes, et monte le tout.
    arrivee = Piste(66, function (p, pas, t, dt) {
      var i = pas % 16, mesure = Math.floor(pas / 16) % 4, k = p.intensite;
      if (i % 2 === 0) boite(p.vers, note(BOITE[(pas / 2 | 0) % 16] + 24, LA * 4), t, 0.2 + k * 0.08);
      if (i === 0) choeur(p.vers, CHOEUR_ARRIVEE[mesure], t, dt * 16 * 1.05, 0.14 + k * 0.1);
      if (i === 0 && mesure % 2 === 0) glas(p.vers, note(CHOEUR_ARRIVEE[mesure][0], LA * 2), t, 0.4 + k * 0.15);
      if (i === 0) {
        // La basse : une note longue et sourde, sous le choeur.
        var gb = gain(0.0001, p.vers), lp = filtre('lowpass', 180 + k * 300, 2, gb);
        var fb = note(CHOEUR_ARRIVEE[mesure][0], LA / 2);
        var b1 = osc('sawtooth', fb, lp), b2 = osc('sawtooth', fb * 1.007, lp), lg = dt * 16;
        gb.gain.setValueAtTime(0.0001, t);
        gb.gain.exponentialRampToValueAtTime(0.32, t + 0.4);
        gb.gain.exponentialRampToValueAtTime(0.0001, t + lg);
        [b1, b2].forEach(function (o) { o.start(t); o.stop(t + lg + 0.1); });
      }
      if (i % 8 === 0) coeur(p.vers, t, 0.35 + k * 0.6);
      if (k > 0.5 && i % 8 === 4) coeur(p.vers, t, 0.3 + k * 0.4);
      if (k > 0.45 && i === 0) cordes(p.vers, [12, 13], t, dt * 16, 0.05 + (k - 0.45) * 0.16);
    }, 1);
  }

  // La tension, de 0 a 1 : la nappe s'ouvre, la musique s'emplit.
  function nappeTension(k) {
    if (!ac) return;
    var t = maintenant();
    if (nappe) {
      nappe.lp.frequency.setTargetAtTime(220 + k * 1400, t, 0.3);
      nappe.souffle.gain.setTargetAtTime(0.05 + k * 0.3, t, 0.3);
      nappe.bp.frequency.setTargetAtTime(400 + k * 2600, t, 0.3);
    }
    if (arrivee) {
      arrivee.intensite = k;
      arrivee.tempo = 66 + k * 22;
    }
  }

  // Quand il parle, la musique s'efface un peu pour lui laisser la place.
  function arriveeAttenuer(v) { if (arrivee) arrivee.niveau(v == null ? 0.35 : v, 1.2); }

  // ==========================================================
  //  Le voyage : du code de la tablette jusqu'a la planete
  // ==========================================================
  // Une musique qui suit le voyage : l'emerveillement devant la Terre
  // (re lydien, accords lumineux, carillon), le systeme solaire (le
  // choeur s'ajoute), le cap vers la droite (tout bascule en mineur, une
  // basse pulse, ca accelere), le signal qui decroche (la musique se
  // hache et s'effondre), puis l'approche et la planete : sombre, lente,
  // un glas au loin. Elle tient jusqu'au code d'Azhrakonr.
  var voyage = null;
  var ACC = {
    emerveille: [[5, 9, 12, 16], [5, 7, 11, 14], [2, 5, 9, 12], [10, 14, 17, 21]],
    sombre:     [[5, 8, 12, 17], [1, 5, 8, 13], [10, 13, 17, 22], [0, 4, 7, 12]],
    presage:    [[5, 8, 12, 19], [4, 7, 10, 13], [1, 5, 8, 12], [6, 9, 12, 15]]
  };

  // Une nappe chaude : des scies jumelles, desaccordees, sous un filtre.
  function nappeAccord(vers, notes, t, d, fort, clair) {
    var g = gain(0.0001, vers), lp = filtre('lowpass', clair || 900, 0.8, g);
    notes.forEach(function (n) {
      [-0.09, 0.09].forEach(function (det) {
        var o = osc('sawtooth', note(n, LA * 2) * (1 + det / 100), lp);
        o.start(t); o.stop(t + d + 0.3);
      });
    });
    versSalle(g, 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(fort, t + d * 0.3);
    g.gain.setValueAtTime(fort, t + d * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.2);
  }

  function basse(vers, n, t, d, fort) {
    var g = gain(0.0001, vers), lp = filtre('lowpass', 420, 4, g);
    var o = osc('sawtooth', note(n, LA / 2), lp), o2 = osc('square', note(n, LA / 4), lp);
    env(g, t, 0.01, d, fort);
    [o, o2].forEach(function (x) { x.start(t); x.stop(t + d + 0.1); });
  }

  var TEMPO_VOYAGE = { terre: 72, systeme: 76, cap: 98, approche: 60, lieu: 50, glitch: 98 };
  function moinsDouze(ch) { return ch.map(function (n) { return n - 12; }); }

  // depart : l'etape ou commencer (par defaut, la Terre et son accord
  // d'ouverture).
  function voyageDebut(depart) {
    if (!pret() || voyage) return;
    voyage = Piste(72, function (p, pas, t, dt) {
      var i = pas % 16, mesure = Math.floor(pas / 16) % 4, ph = p.phase, v = p.vers, ch;
      if (ph === 'glitch') {
        // Des eclats de ce qui jouait, a des hauteurs fausses.
        if (Math.random() < 0.45) {
          var n0 = ACC.sombre[mesure][(Math.random() * 4) | 0] + (Math.random() < 0.5 ? 0 : 12);
          boite(v, note(n0, LA * 2) * (0.5 + Math.random()), t, 0.2);
        }
        return;
      }
      if (ph === 'terre' || ph === 'systeme') {
        var large = ph === 'systeme', pasArp = large ? 2 : 4;
        ch = ACC.emerveille[mesure];
        if (i === 0) nappeAccord(v, ch, t, dt * 16, 0.07, large ? 1400 : 900);
        if (i === 0) {
          var gs = gain(0.0001, v), s = osc('sine', note(ch[0], LA / 2), gs);
          env(gs, t, 0.3, dt * 15, 0.3); s.start(t); s.stop(t + dt * 16);
        }
        if (i % pasArp === 0) boite(v, note(ch[(i / pasArp) % 4] + 12, LA * 2), t, 0.13);
        if (large && i === 0) choeur(v, moinsDouze(ch), t, dt * 16 * 1.05, 0.07);
        if (large && i === 0 && mesure % 2 === 0) glas(v, note(ch[0], LA * 2), t, 0.12);
        if (Math.random() < 0.12) boite(v, note(ch[(Math.random() * 4) | 0] + 36, LA * 2), t, 0.04);
      } else if (ph === 'cap') {
        ch = ACC.sombre[mesure];
        if (i === 0) nappeAccord(v, ch, t, dt * 16, 0.08, 1800);
        if (i === 0) choeur(v, moinsDouze(ch), t, dt * 16 * 1.05, 0.09);
        if (i % 2 === 0) basse(v, ch[0], t, dt * 1.6, 0.32);
        boite(v, note(ch[i % 4] + 12 + (i >= 8 ? 12 : 0), LA * 2), t, 0.09);
        if (i % 8 === 0) coeur(v, t, 0.5);
        if (i === 0 && mesure === 3) cordes(v, [ch[3], ch[3] + 1], t, dt * 16, 0.06);
      } else if (ph === 'approche') {
        ch = ACC.presage[mesure];
        if (i === 0) nappeAccord(v, moinsDouze(ch), t, dt * 16, 0.1, 600);
        if (i === 0) choeur(v, moinsDouze(ch), t, dt * 16 * 1.05, 0.11);
        if (i === 0 || i === 6) coeur(v, t, 0.6);
        if (i === 0 && mesure % 2 === 0) glas(v, note(ch[0] - 12, LA * 2), t, 0.3);
        if (i === 8) cordes(v, [ch[2], ch[2] + 1], t, dt * 8, 0.05);
      } else {
        // La planete : lent, grave, sans repit ; un glas au loin, et des
        // notes de cristal un peu fausses.
        ch = ACC.presage[mesure];
        if (i === 0) nappeAccord(v, moinsDouze(ch), t, dt * 16 * 1.1, 0.11, 600);
        if (i === 0) choeur(v, moinsDouze(ch), t, dt * 16 * 1.1, 0.08);
        if (i === 0) {
          var gd = gain(0.0001, v), d0 = osc('sine', note(ch[0], LA / 2), gd), d1 = osc('triangle', note(ch[0], LA / 4), gd);
          gd.gain.setValueAtTime(0.0001, t);
          gd.gain.exponentialRampToValueAtTime(0.3, t + 0.8);
          gd.gain.setValueAtTime(0.3, t + dt * 14);
          gd.gain.exponentialRampToValueAtTime(0.0001, t + dt * 17);
          [d0, d1].forEach(function (x) { x.start(t); x.stop(t + dt * 17.2); });
        }
        if (i === 0 && mesure % 2 === 0) glas(v, note(ch[0] - 12, LA * 2), t, 0.25);
        if (i === 8 || (i === 4 && Math.random() < 0.5)) boite(v, note(ch[(Math.random() * 4) | 0] + 24, LA * 2) * 0.985, t, 0.1);
        if (i === 12 && mesure === 3) coeur(v, t, 0.45);
      }
    }, 0.9);
    voyage.phase = depart || 'terre';
    voyage.tempo = TEMPO_VOYAGE[voyage.phase] || 72;
    if (depart) return;
    // Le code accepte : un accord qui s'ouvre, pour lancer le voyage.
    var t = maintenant(), ouv = gain(0.9);
    glas(ouv, note(5, LA * 2), t, 0.3);
    [5, 9, 12, 16, 21].forEach(function (n, k) { boite(ouv, note(n + 12, LA * 2), t + k * 0.09, 0.12); });
  }

  function voyagePhase(nom) {
    if (!voyage || voyage.phase === nom) return;
    var avant = voyage.phase;
    voyage.phase = nom;
    voyage.tempo = TEMPO_VOYAGE[nom] || 72;
    // On repart en tete de mesure : l'accord de la nouvelle etape tombe
    // tout de suite, sans attendre la fin de l'ancienne mesure.
    voyage.pas = 0;
    voyage.prochain = Math.max(voyage.prochain, maintenant() + 0.05);
    if (avant === 'glitch') voyage.niveau(voyage.volume, 0.4);
    if (nom === 'lieu') voyage.niveau(voyage.volume * 0.8, 3);
  }

  // Le signal decroche : la musique se hache, ralentit comme une bande
  // qui s'arrete, des parasites, puis plus rien.
  function voyageGlitch(duree) {
    if (!voyage || !ac) return;
    var D = duree || 1.9, t = maintenant(), g = voyage.sortie.gain, v = voyage.volume;
    voyage.phase = 'glitch';
    g.cancelScheduledValues(t);
    for (var x = 0; x < D * 0.75; x += 0.04 + Math.random() * 0.08) {
      g.setValueAtTime(Math.random() < 0.5 ? 0.0001 : v * (0.4 + Math.random() * 0.6), t + x);
    }
    g.setValueAtTime(0.0001, t + D * 0.78);
    // La bande qui s'arrete.
    var gt = gain(0.0001), lp = filtre('lowpass', 1600, 2, gt);
    [330, 495].forEach(function (f0, k) {
      var o = osc('sawtooth', f0, lp);
      o.frequency.setValueAtTime(f0, t + D * 0.45);
      o.frequency.exponentialRampToValueAtTime(k ? 30 : 20, t + D * 0.85);
      o.start(t + D * 0.45); o.stop(t + D * 0.9);
    });
    gt.gain.setValueAtTime(0.0001, t + D * 0.45);
    gt.gain.exponentialRampToValueAtTime(0.2, t + D * 0.5);
    gt.gain.exponentialRampToValueAtTime(0.0001, t + D * 0.88);
    // Les parasites.
    for (var k2 = 0; k2 < 18; k2++) {
      var tb = t + Math.random() * D, gb = gain(0.0001), bp = filtre('bandpass', 400 + Math.random() * 5000, 2, gb), b = bruit(bp);
      env(gb, tb, 0.003, 0.04 + Math.random() * 0.12, 0.25);
      b.start(tb); b.stop(tb + 0.2);
    }
  }

  function voyageFin(duree) {
    if (!voyage) return;
    voyage.fin(duree || 2);
    voyage = null;
  }

  function nappeFin(duree) {
    if (arrivee) { arrivee.fin(duree || 2); arrivee = null; }
    if (!nappe || !ac) return;
    var n = nappe, t = maintenant();
    nappe = null;
    n.sortie.gain.cancelScheduledValues(t);
    n.sortie.gain.setValueAtTime(Math.max(0.0001, n.sortie.gain.value), t);
    n.sortie.gain.exponentialRampToValueAtTime(0.0001, t + (duree || 2));
    setTimeout(function () {
      n.oscs.forEach(function (o) { try { o.stop(); } catch (e) {} });
      try { n.bruit.stop(); } catch (e) {}
    }, ((duree || 2) + 0.2) * 1000);
  }

  // ==========================================================
  //  La plongee sur New York
  // ==========================================================
  // Le ping de la balise : un sonar clair, avec son echo.
  function ping() {
    if (!pret()) return;
    var t = maintenant();
    [0, 0.32, 0.64].forEach(function (d, i) {
      var g = gain(0.0001), o = osc('sine', 1760, g), o2 = osc('sine', 2637, g);
      o.frequency.setValueAtTime(1760, t + d); o.frequency.exponentialRampToValueAtTime(1320, t + d + 0.9);
      env(g, t + d, 0.004, 0.9, 0.22 / (i + 1));
      versSalle(g, 0.6);
      [o, o2].forEach(function (x) { x.start(t + d); x.stop(t + d + 1); });
    });
  }

  // La descente : un souffle qui enfle, le vent des nuages, puis le calme.
  function descente(duree) {
    if (!pret()) return;
    var t = maintenant(), D = duree || 4.4;
    var g = gain(0.0001), bp = filtre('bandpass', 300, 0.9, g), b = bruit(bp, true);
    bp.frequency.setValueAtTime(250, t);
    bp.frequency.exponentialRampToValueAtTime(1800, t + D * 0.45);
    bp.frequency.exponentialRampToValueAtTime(380, t + D);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + D * 0.45);
    g.gain.exponentialRampToValueAtTime(0.12, t + D * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.6);
    b.start(t); b.stop(t + D + 0.7);
    // Un grave qui tient la descente.
    var gs = gain(0.0001), s = osc('sine', 55, gs);
    s.frequency.setValueAtTime(70, t); s.frequency.exponentialRampToValueAtTime(41, t + D);
    gs.gain.setValueAtTime(0.0001, t);
    gs.gain.exponentialRampToValueAtTime(0.3, t + D * 0.5);
    gs.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.4);
    s.start(t); s.stop(t + D + 0.5);
    // Les bips de la triangulation, de plus en plus rapprochés.
    for (var k = 0, d = 0.3; d < D - 0.2; k++) {
      var tb = t + d, gb = gain(0.0001), ob = osc('square', 1200 + k * 30, filtre('lowpass', 3000, 1, gb));
      env(gb, tb, 0.002, 0.05, 0.05);
      ob.start(tb); ob.stop(tb + 0.07);
      d += Math.max(0.09, 0.5 - k * 0.04);
    }
  }

  // Le verrouillage : deux notes nettes et un accord qui reste.
  function verrou() {
    if (!pret()) return;
    var t = maintenant();
    [[1318.5, 0], [1975.5, 0.11]].forEach(function (n) {
      var g = gain(0.0001), o = osc('triangle', n[0], g);
      env(g, t + n[1], 0.003, 0.35, 0.2); o.start(t + n[1]); o.stop(t + n[1] + 0.4);
    });
    var ga = gain(0.0001);
    [659.3, 987.8, 1318.5].forEach(function (f) { var o = osc('sine', f, ga); o.start(t + 0.2); o.stop(t + 2.2); });
    env(ga, t + 0.2, 0.05, 1.9, 0.08);
    versSalle(ga, 0.8);
  }

  function bip(reste) {
    if (!pret()) return;
    var t = maintenant(), g = gain(0.0001);
    var o = osc('square', reste <= 3 ? 1320 : 880, filtre('lowpass', 3000, 1, g));
    env(g, t, 0.005, reste <= 3 ? 0.35 : 0.18, 0.14);
    o.start(t); o.stop(t + 0.5);
    var gk = gain(0.0001), k = osc('sine', 70, gk);
    k.frequency.setValueAtTime(110, t); k.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    env(gk, t, 0.005, 0.3, 0.5); k.start(t); k.stop(t + 0.4);
  }

  function grondement(duree, fort) {
    if (!pret()) return;
    var t = maintenant(), g = gain(0.0001);
    var lp = filtre('lowpass', 160, 1, g);
    var b = bruit(lp, true); b.start(t); b.stop(t + duree + 0.5);
    var o = osc('sawtooth', 38, filtre('lowpass', 120, 2, g)); o.start(t); o.stop(t + duree + 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(fort || 0.9, t + duree * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  }

  // ---------- Il remonte jusqu'a la planete ----------
  // Le moment ou il surgit du bas de l'ecran, les mains ouvertes. Tout
  // monte ensemble pendant "duree" secondes : un grave qu'on sent plus
  // qu'on ne l'entend, un amas de scies en triton qui glisse vers le haut
  // en s'ouvrant, des cordes suraigues qui grincent en tremolo, un
  // souffle qui enfle, un coeur qui s'emballe et sa gorge, d'abord un
  // grognement, puis un hurlement. A la fin, quand ses mains se
  // referment : un impact de cuivres saturés, et le glas.
  function montee(duree) {
    if (!pret()) return;
    var t = maintenant(), D = Math.max(1, duree || 4), fin = t + D;

    // Le grave : sous l'audible, il fait trembler le reste.
    var gs = gain(0.0001), so = osc('sine', 22, gs), so2 = osc('triangle', 33, gs);
    so.frequency.setValueAtTime(22, t); so.frequency.exponentialRampToValueAtTime(48, fin);
    so2.frequency.setValueAtTime(33, t); so2.frequency.exponentialRampToValueAtTime(72, fin);
    gs.gain.setValueAtTime(0.0001, t);
    gs.gain.exponentialRampToValueAtTime(0.7, fin - 0.2);
    gs.gain.exponentialRampToValueAtTime(0.0001, fin + 1.6);
    [so, so2].forEach(function (o) { o.start(t); o.stop(fin + 1.7); });

    // L'amas : la, si bemol, mi bemol — un triton et une seconde
    // mineure, qui montent ensemble de quatre demi-tons.
    var ga = gain(0.0001), lp = filtre('lowpass', 160, 3, ga);
    lp.frequency.setValueAtTime(160, t); lp.frequency.exponentialRampToValueAtTime(3600, fin);
    var sat = saturation(28, lp);
    [0, 1, 6, 12, 13].forEach(function (n) {
      [-0.25, 0.25].forEach(function (d) {
        var f0 = note(n, LA) * (1 + d / 100);
        var o = osc('sawtooth', f0, sat);
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f0 * Math.pow(2, 4 / 12), fin);
        o.start(t); o.stop(fin + 0.3);
      });
    });
    versSalle(ga, 0.5);
    ga.gain.setValueAtTime(0.0001, t);
    ga.gain.exponentialRampToValueAtTime(0.42, fin - 0.05);
    ga.gain.exponentialRampToValueAtTime(0.0001, fin + 0.25);

    // Les cordes suraigues, en tremolo serre, qui grimpent elles aussi.
    var gc = gain(0.0001), hp = filtre('highpass', 900, 0.7, gc);
    var trem = ac.createGain(); trem.gain.value = 0.6; trem.connect(hp);
    var lfo = osc('square', 13, ac.createGain()), lg = ac.createGain(); lg.gain.value = 0.4;
    lfo.disconnect(); lfo.connect(lg); lg.connect(trem.gain);
    lfo.frequency.setValueAtTime(13, t); lfo.frequency.linearRampToValueAtTime(22, fin);
    [36, 37, 42].forEach(function (n) {
      var f0 = note(n, LA);
      var o = osc('sawtooth', f0, trem);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * Math.pow(2, 7 / 12), fin);
      o.start(t); o.stop(fin + 0.2);
    });
    lfo.start(t); lfo.stop(fin + 0.2);
    versSalle(gc, 0.8);
    gc.gain.setValueAtTime(0.0001, t);
    gc.gain.exponentialRampToValueAtTime(0.0001, t + D * 0.25);
    gc.gain.exponentialRampToValueAtTime(0.11, fin - 0.05);
    gc.gain.exponentialRampToValueAtTime(0.0001, fin + 0.15);

    // Le souffle qui enfle, comme un appel d'air.
    var gb = gain(0.0001), bp = filtre('bandpass', 220, 1.2, gb);
    bp.frequency.setValueAtTime(220, t); bp.frequency.exponentialRampToValueAtTime(4200, fin);
    var b = bruit(bp, true); b.start(t); b.stop(fin + 0.3);
    gb.gain.setValueAtTime(0.0001, t);
    gb.gain.exponentialRampToValueAtTime(0.5, fin - 0.05);
    gb.gain.exponentialRampToValueAtTime(0.0001, fin + 0.2);

    // Le coeur, de plus en plus vite.
    for (var c = 0, tc = t; tc < fin - 0.15; c++) {
      coeur(maitre, tc, 0.45 + 0.5 * (tc - t) / D);
      tc += Math.max(0.24, 0.85 - (tc - t) / D * 0.65);
    }

    // Sa gorge : un grognement qui monte, puis le hurlement.
    gueule({ duree: D * 0.7, hauteur: [30, 42, 58], de: VOYELLES.o, vers: VOYELLES.a, fort: 0.55, sature: 90, tremble: 14 });
    gueule({ duree: D * 0.45, hauteur: [70, 150, 110], de: VOYELLES.a, vers: VOYELLES.è, fort: 0.75, sature: 120, tremble: 33, retard: D * 0.58 });

    // L'impact : des cuivres graves saturés, longs, et le glas dessous.
    var gi = gain(0.0001), lpi = filtre('lowpass', 2400, 1.5, gi);
    lpi.frequency.setValueAtTime(2400, fin);
    lpi.frequency.exponentialRampToValueAtTime(260, fin + 3.2);
    var sati = saturation(40, lpi);
    [0, 0.6, 7, 12].forEach(function (n, i) {
      var o = osc('sawtooth', note(n, LA / 2) * (i === 1 ? 1.003 : 1), sati);
      o.start(fin); o.stop(fin + 3.6);
    });
    versSalle(gi, 0.9);
    gi.gain.setValueAtTime(0.0001, fin);
    gi.gain.exponentialRampToValueAtTime(0.55, fin + 0.04);
    gi.gain.exponentialRampToValueAtTime(0.0001, fin + 3.4);
    glas(maitre, note(-12, LA * 2), fin, 0.55);
  }

  function choc(fort) {
    if (!pret()) return;
    var t = maintenant(), g = gain(0.0001), o = osc('sine', 90, g);
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    env(g, t, 0.005, 0.9, fort || 0.9); o.start(t); o.stop(t + 1);
    var gb = gain(0.0001), lp = filtre('lowpass', 900, 1, gb), b = bruit(lp);
    lp.frequency.setValueAtTime(1800, t); lp.frequency.exponentialRampToValueAtTime(120, t + 0.8);
    env(gb, t, 0.005, 0.9, (fort || 0.9) * 0.7); b.start(t); b.stop(t + 1);
    versSalle(gb, 0.5);
  }

  // ==========================================================
  //  Sa voix
  // ==========================================================
  // Une gorge de synthese : deux scies et une sous-octave tres graves,
  // un souffle, une distorsion lourde, puis trois formants qui dessinent
  // les voyelles, et une modulation qui fait trembler le tout. Chaque
  // lettre ecrite deplace les formants et relance l'enveloppe : il parle
  // une langue qu'on ne comprend pas, mais on l'entend parler.

  var VOYELLES = {
    a: [730, 1090, 2440], e: [530, 1840, 2480], i: [300, 2200, 2900], o: [570, 840, 2410],
    u: [300, 870, 2240], y: [300, 1750, 2300], é: [480, 1950, 2600], è: [600, 1800, 2500], à: [730, 1090, 2440],
    ê: [580, 1800, 2500], ô: [480, 800, 2400], û: [320, 900, 2250], î: [300, 2200, 2900]
  };

  var gorge = null;

  function gorgeOuvrir() {
    if (gorge || !pret()) return gorge;
    var t = maintenant();
    var sortie = gain(0.0001);
    versSalle(sortie, 0.8);
    var lp = filtre('lowpass', 3400, 0.7, sortie);
    // La modulation : un tremblement de 28 Hz sur l'amplitude.
    var trem = ac.createGain(); trem.gain.value = 0.75; trem.connect(lp);
    var mod = osc('sine', 28, ac.createGain()), modG = ac.createGain(); modG.gain.value = 0.25;
    mod.disconnect(); mod.connect(modG); modG.connect(trem.gain);
    var formants = [0, 1, 2].map(function (i) {
      var g = ac.createGain(); g.gain.value = [1, 0.7, 0.35][i]; g.connect(trem);
      return filtre('bandpass', VOYELLES.a[i], [8, 10, 12][i], g);
    });
    var sat = saturation(60, ac.createGain());
    sat.disconnect();
    formants.forEach(function (f) { sat.connect(f); });
    var source = ac.createGain(); source.gain.value = 0.6; source.connect(sat);
    var f0 = 46;
    var o1 = osc('sawtooth', f0, source), o2 = osc('sawtooth', f0 * 1.013, source);
    var sous = ac.createGain(); sous.gain.value = 0.6; sous.connect(lp);
    var o3 = osc('sine', f0 / 2, sous);
    var souffle = ac.createGain(); souffle.gain.value = 0.25; souffle.connect(sat);
    var b = bruit(filtre('bandpass', 1400, 0.6, souffle), true);
    [o1, o2, o3, mod, b].forEach(function (x) { x.start(t); });
    gorge = { sortie: sortie, formants: formants, oscs: [o1, o2, o3], tout: [o1, o2, o3, mod, b], f0: f0, souffle: souffle };
    return gorge;
  }

  // Une ligne commence : la gorge s'ouvre. Elle finit : elle se ferme.
  var syllabes = 0;
  function voixLigne(parle) {
    if (!pret()) return;
    var g = gorgeOuvrir();
    if (!g) return;
    var t = maintenant();
    if (parle) {
      syllabes = 0;
      g.oscs.forEach(function (o, i) { o.frequency.setTargetAtTime(g.f0 * [1, 1.013, 0.5][i], t, 0.05); });
    } else {
      g.sortie.gain.cancelScheduledValues(t);
      g.sortie.gain.setTargetAtTime(0.0001, t, 0.12);
    }
  }

  var derniereVoix = 0;
  function voix(lettre) {
    if (!pret() || !lettre) return;
    var g = gorgeOuvrir();
    if (!g) return;
    var t = maintenant();
    var l = lettre.toLowerCase();
    if (l === ' ' || l === ',' || l === '.' || l === '…' || l === '’') {
      // Un silence entre les mots, plus long aux ponctuations.
      g.sortie.gain.cancelScheduledValues(t);
      g.sortie.gain.setTargetAtTime(0.0001, t, l === ' ' ? 0.03 : 0.08);
      return;
    }
    if (t - derniereVoix < 0.035) return;
    derniereVoix = t;
    syllabes++;
    var v = VOYELLES[l];
    // Une consonne : un coup de souffle, et l'on garde la voyelle d'avant.
    g.souffle.gain.setTargetAtTime(v ? 0.18 : 0.6, t, 0.01);
    g.souffle.gain.setTargetAtTime(0.18, t + 0.04, 0.03);
    if (v) g.formants.forEach(function (f, i) { f.frequency.setTargetAtTime(v[i] * 0.82, t, 0.025); });
    // L'intonation : elle tombe au fil de la phrase, avec un leger chaos.
    var hauteur = g.f0 * (1.12 - Math.min(0.25, syllabes * 0.006)) * (1 + (Math.random() - 0.5) * 0.06);
    g.oscs.forEach(function (o, i) { o.frequency.setTargetAtTime(hauteur * [1, 1.013, 0.5][i], t, 0.04); });
    g.sortie.gain.cancelScheduledValues(t);
    g.sortie.gain.setTargetAtTime(v ? 0.95 : 0.55, t, 0.015);
    g.sortie.gain.setTargetAtTime(v ? 0.6 : 0.3, t + 0.06, 0.05);
  }

  // Quand le dialogue s'ouvre : une longue inspiration rauque, puis un
  // rale grave qui retombe — avant le premier mot.
  function voixIntro() {
    if (!pret()) return;
    arriveeAttenuer(0.3);
    var t = maintenant();
    // L'inspiration.
    var gi = gain(0.0001), bp = filtre('bandpass', 900, 1.2, gi), bi = bruit(bp, true);
    bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 1.1);
    gi.gain.setValueAtTime(0.0001, t);
    gi.gain.exponentialRampToValueAtTime(0.4, t + 0.9);
    gi.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    versSalle(gi, 0.6);
    bi.start(t); bi.stop(t + 1.3);
    // Le rale : la gorge, sur un "o" qui descend.
    setTimeout(function () {
      var g = gorgeOuvrir();
      if (!g || !ac) return;
      var t2 = maintenant();
      g.formants.forEach(function (f, i) { f.frequency.setValueAtTime(VOYELLES.o[i] * 0.8, t2); });
      g.oscs.forEach(function (o, i) {
        var m = [1, 1.013, 0.5][i];
        o.frequency.setValueAtTime(g.f0 * 1.3 * m, t2);
        o.frequency.exponentialRampToValueAtTime(g.f0 * 0.75 * m, t2 + 1.1);
      });
      g.sortie.gain.cancelScheduledValues(t2);
      g.sortie.gain.setValueAtTime(0.0001, t2);
      g.sortie.gain.exponentialRampToValueAtTime(1, t2 + 0.15);
      g.sortie.gain.exponentialRampToValueAtTime(0.0001, t2 + 1.2);
    }, 1150);
  }

  function voixFin() {
    if (!gorge || !ac) return;
    var g = gorge, t = maintenant();
    gorge = null;
    g.sortie.gain.cancelScheduledValues(t);
    g.sortie.gain.setTargetAtTime(0.0001, t, 0.1);
    setTimeout(function () { g.tout.forEach(function (x) { try { x.stop(); } catch (e) {} }); }, 800);
  }

  // ==========================================================
  //  Le combat : la musique
  // ==========================================================
  // En mi : un glas a chaque mesure, un coeur qui bat, un choeur sur une
  // marche funebre (mi mineur, do, la mineur, si), une lamentation qui
  // descend par demi-tons, et des cordes qui grincent. La seconde phase
  // passe au phrygien (fa naturel), accelere, ajoute une basse qui
  // martele, et sature.

  var musique = null;
  var MI = 7;                                    // mi, au-dessus du la
  var MARCHE = [[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-5, -1, 2]];
  var MARCHE_RAGE = [[0, 3, 7], [1, 5, 8], [-2, 1, 5], [-1, 3, 6]];
  // La lamentation : une note par temps, qui descend et retombe.
  var PLAINTE = [12, 11, 10, 9, 7, 8, 7, 5, 3, 5, 7, 3, 2, 3, 0, null];
  var PLAINTE_RAGE = [12, 13, 12, 10, 8, 7, 8, 5, 13, 12, 10, 8, 7, 5, 1, 0];

  function musiqueDebut() {
    if (!pret() || musique) return;
    musique = Piste(84, function (p, pas, t, dt) {
      var i = pas % 16, mesure = Math.floor(pas / 16) % 4;
      var vers = p.vers;
      var accords = p.rage ? MARCHE_RAGE : MARCHE;
      // Le glas, en tete de mesure.
      if (i === 0) glas(vers, note(MI - 12 + accords[mesure][0], LA * 2), t, p.rage ? 0.3 : 0.24);
      // Le coeur, deux fois par mesure ; a chaque temps en rage.
      if (i === 0 || i === 8 || (p.rage && (i === 4 || i === 12))) coeur(vers, t, p.rage ? 0.75 : 0.55);
      // Un tambour grave, comme une marche.
      if (i === 6 || i === 14) {
        var gt = gain(0.0001, vers), o = osc('sine', 80, gt);
        o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.3);
        env(gt, t, 0.003, 0.4, 0.35); versSalle(gt, 0.4); o.start(t); o.stop(t + 0.5);
      }
      // Le choeur, une mesure entiere.
      if (i === 0) choeur(vers, accords[mesure].map(function (n) { return n + MI - 12; }), t, dt * 16 * 1.1, p.rage ? 0.13 : 0.1);
      // La basse : longue et sourde ; en rage, elle martele.
      if (i === 0 || (p.rage && i % 2 === 0)) {
        var gb = gain(0.0001, vers), lp = filtre('lowpass', p.rage ? 500 : 260, 3, gb);
        var fb = note(MI + accords[mesure][0] - 12, LA);
        var b1 = osc('sawtooth', fb, lp), b2 = osc('sawtooth', fb * 1.006, lp);
        var long = p.rage ? dt * 1.8 : dt * 15;
        env(gb, t, 0.02, long, p.rage ? 0.35 : 0.4);
        b1.start(t); b1.stop(t + long + 0.1); b2.start(t); b2.stop(t + long + 0.1);
      }
      // La lamentation, a chaque temps.
      if (i % 4 === 0) {
        var ligne = p.rage ? PLAINTE_RAGE : PLAINTE;
        var n = ligne[(mesure * 4 + i / 4) % 16];
        if (n != null) plainte(vers, note(n + MI, LA * 4), t, dt * 4 * 0.98, p.rage ? 0.11 : 0.09);
      }
      // Les cordes qui grincent : une seconde mineure, toutes les deux mesures.
      if (i === 0 && mesure % 2 === 1) cordes(vers, [MI + 12, MI + 13], t, dt * 32, p.rage ? 0.08 : 0.05);
    }, 0.75);
  }

  function musiqueRage() {
    if (!musique) return;
    musique.rage = true;
    musique.tempo = 108;
    // La seconde phase sature tout.
    var sat = saturation(5, musique.sortie);
    musique.vers = sat;
  }

  function musiqueFin(duree) {
    if (!musique || !ac) return;
    musique.fin(duree || 1);
    musique = null;
  }

  // ==========================================================
  //  Le combat : les bruits
  // ==========================================================
  var dernierTir = 0, dernierImpact = 0;

  function tir() {
    if (!pret()) return;
    var t = maintenant();
    if (t - dernierTir < 0.05) return;
    dernierTir = t;
    var g = gain(0.0001), o = osc('square', 1800, filtre('lowpass', 5000, 1, g));
    o.frequency.setValueAtTime(1900, t); o.frequency.exponentialRampToValueAtTime(380, t + 0.12);
    env(g, t, 0.002, 0.12, 0.12); o.start(t); o.stop(t + 0.16);
  }

  function impact() {
    if (!pret()) return;
    var t = maintenant();
    if (t - dernierImpact < 0.07) return;
    dernierImpact = t;
    var g = gain(0.0001), bp = filtre('bandpass', 900, 1.5, g), b = bruit(bp);
    env(g, t, 0.002, 0.1, 0.25); b.start(t); b.stop(t + 0.14);
    var gs = gain(0.0001), s = osc('triangle', 160, gs);
    s.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    env(gs, t, 0.002, 0.12, 0.25); s.start(t); s.stop(t + 0.16);
  }

  function blesse() {
    if (!pret()) return;
    var t = maintenant(), g = gain(0.0001), sat = saturation(20, g);
    var o = osc('sawtooth', 220, sat);
    o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.4);
    env(g, t, 0.003, 0.45, 0.5); o.start(t); o.stop(t + 0.5);
    choc(0.6);
  }

  function charge() {
    if (!pret()) return;
    var t = maintenant(), g = gain(0.0001), o = osc('sawtooth', 110, filtre('lowpass', 1600, 6, g));
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(880, t + 1.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.start(t); o.stop(t + 1.7);
  }

  function salve() {
    if (!pret()) return;
    var t = maintenant(), g = gain(0.0001), o = osc('square', 640, filtre('lowpass', 2400, 3, g));
    o.frequency.setValueAtTime(1200, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.35);
    env(g, t, 0.003, 0.35, 0.18); o.start(t); o.stop(t + 0.4);
  }

  function chute(fort) { choc(fort || 0.7); }

  var rayonSon = null;
  function rayon(actif) {
    if (!pret()) return;
    var t = maintenant();
    if (actif && !rayonSon) {
      var g = gain(0.0001), lp = filtre('lowpass', 2400, 4, g);
      var o1 = osc('sawtooth', 110, lp), o2 = osc('sawtooth', 111.5, lp), o3 = osc('square', 55, lp);
      var b = bruit(filtre('bandpass', 3000, 1, g), true);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.15);
      [o1, o2, o3].forEach(function (o) { o.start(t); });
      b.start(t);
      rayonSon = { g: g, src: [o1, o2, o3, b] };
    } else if (!actif && rayonSon) {
      var r = rayonSon; rayonSon = null;
      r.g.gain.cancelScheduledValues(t);
      r.g.gain.setValueAtTime(Math.max(0.0001, r.g.gain.value), t);
      r.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      setTimeout(function () { r.src.forEach(function (s) { try { s.stop(); } catch (e) {} }); }, 400);
    }
  }

  function effondrement() {
    if (!pret()) return;
    choc(1);
    grondement(1.6, 0.7);
  }

  function rage() {
    if (!pret()) return;
    var t = maintenant(), g = gain(0.0001), sat = saturation(30, g), lp = filtre('lowpass', 400, 3, sat);
    lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(3200, t + 2.2);
    [55, 55.8, 82, 110.5].forEach(function (f) {
      var o = osc('sawtooth', f, lp);
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 2.2);
      o.start(t); o.stop(t + 3.2);
    });
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 2.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    versSalle(g, 0.5);
    setTimeout(function () { choc(1); }, 2200);
  }

  // ==========================================================
  //  Ses cris pendant le combat
  // ==========================================================
  // Une gorge jetable : scies tres graves et souffle, sature, puis passe
  // dans les formants d'une voyelle qui glisse vers une autre. La hauteur
  // suit trois points (debut, sommet, fin).
  function gueule(o) {
    var t = maintenant() + (o.retard || 0), D = o.duree;
    var g = gain(0.0001), lp = filtre('lowpass', 3200, 0.7, g);
    versSalle(g, 0.7);
    var trem = ac.createGain(); trem.gain.value = 0.7; trem.connect(lp);
    var mod = osc('sine', o.tremble || 24, ac.createGain()), mg = ac.createGain(); mg.gain.value = 0.3;
    mod.disconnect(); mod.connect(mg); mg.connect(trem.gain);
    var fs = [0, 1, 2].map(function (i) {
      var gi = ac.createGain(); gi.gain.value = [1, 0.7, 0.35][i]; gi.connect(trem);
      var f = filtre('bandpass', o.de[i] * 0.82, [7, 9, 11][i], gi);
      f.frequency.setValueAtTime(o.de[i] * 0.82, t);
      f.frequency.linearRampToValueAtTime(o.vers[i] * 0.82, t + D);
      return f;
    });
    var sat = saturation(o.sature || 70, ac.createGain()); sat.disconnect();
    fs.forEach(function (f) { sat.connect(f); });
    var src = ac.createGain(); src.gain.value = 0.6; src.connect(sat);
    var h = o.hauteur, oscs = [];
    [1, 1.017, 0.5].forEach(function (m, i) {
      var x = osc(i === 2 ? 'sine' : 'sawtooth', h[0] * m, i === 2 ? lp : src);
      x.frequency.setValueAtTime(h[0] * m, t);
      x.frequency.exponentialRampToValueAtTime(h[1] * m, t + D * 0.3);
      x.frequency.exponentialRampToValueAtTime(h[2] * m, t + D);
      oscs.push(x);
    });
    var sg = ac.createGain(); sg.gain.value = 0.3; sg.connect(sat);
    var b = bruit(filtre('bandpass', 1300, 0.6, sg), true);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.fort, t + Math.min(0.12, D * 0.2));
    g.gain.setValueAtTime(o.fort, t + D * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + D);
    oscs.concat([mod, b]).forEach(function (x) { x.start(t); x.stop(t + D + 0.1); });
  }

  var dernierCri = 0;
  function rugir(type) {
    if (!pret()) return;
    var t = maintenant();
    if (type === 'douleur') {
      // Pas a chaque balle : il gronde de douleur de temps en temps.
      if (t - dernierCri < 1.1 || Math.random() > 0.45) return;
      dernierCri = t;
      gueule({ duree: rnd(0.3, 0.45), hauteur: [78, 92, 42], de: VOYELLES.a, vers: VOYELLES.u, fort: 0.55, sature: 50 });
      return;
    }
    if (type === 'grogne') {
      if (t - dernierCri < 2) return;
      dernierCri = t;
      gueule({ duree: rnd(1.1, 1.6), hauteur: [40, 44, 34], de: VOYELLES.o, vers: VOYELLES.u, fort: 0.7, tremble: 17 });
      return;
    }
    dernierCri = t;
    if (type === 'attaque') {
      gueule({ duree: 1, hauteur: [58, 96, 46], de: VOYELLES.o, vers: VOYELLES.a, fort: 0.75 });
    } else if (type === 'rage') {
      gueule({ duree: 2.6, hauteur: [46, 120, 70], de: VOYELLES.u, vers: VOYELLES.a, fort: 0.9, sature: 110, tremble: 31 });
      gueule({ duree: 2.4, hauteur: [23, 60, 35], de: VOYELLES.o, vers: VOYELLES.a, fort: 0.6, retard: 0.1 });
    } else if (type === 'mort') {
      gueule({ duree: 2.4, hauteur: [96, 130, 30], de: VOYELLES.a, vers: VOYELLES.u, fort: 0.9, sature: 90, tremble: 9 });
    }
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // ==========================================================
  //  Sa fuite dans la faille
  // ==========================================================
  // La musique s'efface, il hurle ; une faille se dechire derriere lui,
  // l'aspire en sifflant, puis se referme dans une explosion.
  function mort() {
    if (!pret()) return;
    musiqueFin(2.5);
    rugir('mort');
  }

  function faille() {
    if (!pret()) return;
    var t = maintenant();
    // Le dechirement : un bruit qui monte, crepite, et ne s'arrete plus.
    var g = gain(0.0001), bp = filtre('bandpass', 300, 1.5, g), b = bruit(bp, true);
    bp.frequency.setValueAtTime(200, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 1.2);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.15, t + 1.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    versSalle(g, 0.6);
    b.start(t); b.stop(t + 3.7);
    for (var i = 0; i < 14; i++) {
      var ti = t + Math.random() * 1.6, gi = gain(0.0001), hp = filtre('highpass', 3000, 1, gi), bi = bruit(hp);
      env(gi, ti, 0.002, 0.05, 0.3); bi.start(ti); bi.stop(ti + 0.08);
    }
    // Un accord dissonant, aigu, qui s'ouvre avec elle.
    var ga = gain(0.0001), lp = filtre('lowpass', 2600, 2, ga);
    [440, 466.2, 659.3, 698.5].forEach(function (f) { var o = osc('sawtooth', f / 2, lp); o.start(t); o.stop(t + 4); });
    ga.gain.setValueAtTime(0.0001, t);
    ga.gain.exponentialRampToValueAtTime(0.08, t + 1);
    ga.gain.exponentialRampToValueAtTime(0.0001, t + 4);
    versSalle(ga, 0.8);
    grondement(2.6, 0.6);
  }

  function aspiration() {
    if (!pret()) return;
    var t = maintenant(), D = 3.4;
    // Le souffle aspire : un sifflement qui monte, de plus en plus vite.
    var g = gain(0.0001), bp = filtre('bandpass', 400, 4, g), b = bruit(bp, true);
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(5200, t + D);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + D * 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.05);
    b.start(t); b.stop(t + D + 0.1);
    // Et lui, emporte, dont la plainte s'eloigne et retrecit.
    gueule({ duree: D, hauteur: [70, 60, 160], de: VOYELLES.o, vers: VOYELLES.i, fort: 0.6, tremble: 13 });
  }

  function explosion() {
    if (!pret()) return;
    var t = maintenant();
    choc(1);
    var g = gain(0.0001), lp = filtre('lowpass', 6000, 0.7, g), b = bruit(lp, true);
    lp.frequency.setValueAtTime(7000, t); lp.frequency.exponentialRampToValueAtTime(70, t + 3.2);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.2, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    versSalle(g, 0.7);
    b.start(t); b.stop(t + 3.7);
    var gs = gain(0.0001), s = osc('sine', 60, gs);
    s.frequency.setValueAtTime(90, t); s.frequency.exponentialRampToValueAtTime(22, t + 2);
    env(gs, t, 0.005, 2.2, 1.1); s.start(t); s.stop(t + 2.3);
    // La faille qui se referme : un claquement sec, juste apres.
    setTimeout(function () { if (ac) choc(0.7); }, 650);
  }

  // La victoire n'a rien de triomphal : un dernier choeur, en majeur,
  // presque recueilli, et le glas qui s'eteint.
  function victoire() {
    if (!pret()) return;
    var t = maintenant() + 0.1;
    var vers = gain(0.9);
    choeur(vers, [MI - 12, MI - 8, MI - 5, MI], t, 6, 0.16);
    glas(vers, note(MI - 12, LA * 2), t, 0.3);
    [0, 4, 7, 12, 16].forEach(function (n, i) { boite(vers, note(n + MI + 12, LA * 4), t + 0.8 + i * 0.35, 0.09); });
  }

  function defaite() {
    if (!pret()) return;
    musiqueFin(0.8);
    var t = maintenant() + 0.2, vers = gain(0.9);
    glas(vers, note(MI - 24, LA * 2), t, 0.4);
    [7, 5, 3, 2, 0].forEach(function (n, i) { plainte(vers, note(n + MI, LA * 4), t + i * 0.55, 0.6, 0.12); });
  }

  function couper() {
    voyageFin(0.4);
    nappeFin(0.4);
    musiqueFin(0.4);
    rayon(false);
    voixFin();
  }

  function basculerMuet() {
    muet = !muet;
    try { localStorage.setItem('dinderpad.azh.muet', muet ? '1' : '0'); } catch (e) {}
    if (maitre && ac) maitre.gain.setTargetAtTime(muet ? 0 : 0.7, ac.currentTime, 0.05);
    return muet;
  }

  window.AZHRAKONR_SON = {
    pret: pret, nappeDebut: nappeDebut, nappeTension: nappeTension, nappeFin: nappeFin,
    arriveeDebut: arriveeDebut, arriveeAttenuer: arriveeAttenuer,
    bip: bip, grondement: grondement, choc: choc, montee: montee,
    voix: voix, voixLigne: voixLigne, voixIntro: voixIntro, voixFin: voixFin,
    musiqueDebut: musiqueDebut, musiqueRage: musiqueRage, musiqueFin: musiqueFin,
    tir: tir, impact: impact, blesse: blesse, charge: charge, salve: salve, chute: chute,
    rayon: rayon, effondrement: effondrement, rage: rage, mort: mort,
    rugir: rugir, faille: faille, aspiration: aspiration, explosion: explosion,
    ping: ping, descente: descente, verrou: verrou,
    voyageDebut: voyageDebut, voyagePhase: voyagePhase, voyageGlitch: voyageGlitch, voyageFin: voyageFin,
    victoire: victoire, defaite: defaite, couper: couper,
    muet: function () { return muet; }, basculerMuet: basculerMuet
  };
})();
