// La pause des jeux.
//
// En plein ecran, un bouton pause remplace le retour au DinderPad. La
// pause gele vraiment le jeu, quel qu'il soit, sans que chaque jeu ait a
// s'en occuper : ce script se charge avant tous les autres et prend la
// main sur ce qui fait avancer le temps.
//   - les minuteries (setTimeout, setInterval) gardent ce qu'il leur
//     restait et repartent de la a la reprise ;
//   - les images (requestAnimationFrame) sont retenues ;
//   - performance.now() s'arrete : les durees mesurees par les jeux ne
//     comptent pas le temps passe en pause ;
//   - les animations CSS et Web Animations, les sons (Web Audio et
//     balises audio) s'arretent et reprennent ou ils en etaient.
// Pendant la pause, le clavier et les clics n'atteignent plus le jeu.
(function () {
  var vraiST = window.setTimeout.bind(window);
  var vraiCT = window.clearTimeout.bind(window);
  var vraiRAF = window.requestAnimationFrame.bind(window);
  var vraiCAF = window.cancelAnimationFrame.bind(window);
  var perf = window.performance;
  var vraiNow = perf.now.bind(perf);

  var enPause = false, debutPause = 0, decalage = 0;

  // ---------- L'horloge ----------
  function maintenant() { return (enPause ? debutPause : vraiNow()) - decalage; }
  try { perf.now = maintenant; } catch (e) {}

  // ---------- Les minuteries ----------
  var minuteurs = {}, prochain = 1;

  function armer(id, m) {
    m.fin = vraiNow() + m.reste;
    m.vrai = vraiST(function () {
      if (minuteurs[id] !== m) return;
      if (m.repete) { m.reste = m.ms; armer(id, m); }
      else delete minuteurs[id];
      m.fn.apply(window, m.args);
    }, m.reste);
  }

  function creer(fn, ms, args, repete) {
    if (typeof fn !== 'function') {
      var code = String(fn);
      fn = function () { (0, eval)(code); };
    }
    var id = prochain++;
    var m = { fn: fn, args: args, ms: Math.max(repete ? 4 : 0, +ms || 0), repete: repete };
    m.reste = m.ms;
    minuteurs[id] = m;
    if (!enPause) armer(id, m);
    return id;
  }

  function effacer(id) {
    var m = minuteurs[id];
    if (!m) return;
    if (m.vrai) vraiCT(m.vrai);
    delete minuteurs[id];
  }

  window.setTimeout = function (fn, ms) { return creer(fn, ms, [].slice.call(arguments, 2), false); };
  window.setInterval = function (fn, ms) { return creer(fn, ms, [].slice.call(arguments, 2), true); };
  window.clearTimeout = effacer;
  window.clearInterval = effacer;

  // ---------- Les images ----------
  var images = {};

  function demanderImage(id, cb) {
    images[id] = { cb: cb, vrai: vraiRAF(function (ts) {
      if (!images[id]) return;
      delete images[id];
      cb(ts - decalage);
    }) };
  }

  window.requestAnimationFrame = function (cb) {
    var id = prochain++;
    if (enPause) images[id] = { cb: cb, vrai: 0 };
    else demanderImage(id, cb);
    return id;
  };
  window.cancelAnimationFrame = function (id) {
    var r = images[id];
    if (!r) return;
    if (r.vrai) vraiCAF(r.vrai);
    delete images[id];
  };

  // ---------- Les sons ----------
  var contextes = [];
  ['AudioContext', 'webkitAudioContext'].forEach(function (nom) {
    var AC = window[nom];
    if (!AC || AC.__pause) return;
    var Enrobe = function () {
      var c = new (Function.prototype.bind.apply(AC, [null].concat([].slice.call(arguments))))();
      contextes.push(c);
      return c;
    };
    Enrobe.prototype = AC.prototype;
    Enrobe.__pause = true;
    window[nom] = Enrobe;
  });

  var medias = [];
  if (window.HTMLMediaElement) {
    var vraiPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (medias.indexOf(this) === -1) medias.push(this);
      return vraiPlay.apply(this, arguments);
    };
  }

  // ---------- Geler, degeler ----------
  var gelees = { anim: [], audio: [], media: [] };

  function geler() {
    if (enPause) return;
    enPause = true;
    debutPause = vraiNow();
    Object.keys(minuteurs).forEach(function (id) {
      var m = minuteurs[id];
      vraiCT(m.vrai);
      m.vrai = 0;
      m.reste = Math.max(0, m.fin - debutPause);
    });
    Object.keys(images).forEach(function (id) {
      var r = images[id];
      if (r.vrai) vraiCAF(r.vrai);
      r.vrai = 0;
    });
    gelees.anim = [];
    if (document.getAnimations) {
      document.getAnimations().forEach(function (a) {
        // Les animations du panneau de pause lui-meme continuent.
        var cible = a.effect && a.effect.target;
        if (cible && cible.closest && cible.closest('.pause')) return;
        if (a.playState === 'running') { a.pause(); gelees.anim.push(a); }
      });
    }
    gelees.audio = contextes.filter(function (c) { return c.state === 'running'; });
    gelees.audio.forEach(function (c) { try { c.suspend(); } catch (e) {} });
    gelees.media = medias.filter(function (m) { return !m.paused; });
    gelees.media.forEach(function (m) { try { m.pause(); } catch (e) {} });
  }

  function degeler() {
    if (!enPause) return;
    decalage += vraiNow() - debutPause;
    enPause = false;
    Object.keys(minuteurs).forEach(function (id) { armer(id, minuteurs[id]); });
    Object.keys(images).forEach(function (id) {
      var cb = images[id].cb;
      delete images[id];
      demanderImage(id, cb);
    });
    gelees.anim.forEach(function (a) { try { a.play(); } catch (e) {} });
    gelees.audio.forEach(function (c) { try { c.resume(); } catch (e) {} });
    gelees.media.forEach(function (m) { try { m.play(); } catch (e) {} });
    gelees = { anim: [], audio: [], media: [] };
  }

  // ---------- Le panneau ----------
  // Les jeux qui ont une pause. Le Telescope n'est pas un jeu : il garde
  // le simple retour au DinderPad.
  var JEUX = {
    'founder-war': 'The Founder War',
    'peche': 'Fish n’Der',
    'odyssee': 'The Odyssey of Dinder',
    'wade': 'Wade and Friends'
  };

  var panneau = null;

  function jeuCourant() {
    var nom = (location.hash || '').replace(/^#/, '').split('/')[0];
    return JEUX[nom] ? nom : null;
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function ouvrir() {
    var jeu = jeuCourant();
    if (!jeu || enPause) return;
    geler();
    document.body.classList.add('is-pause');
    panneau = el('div', 'pause');
    panneau.setAttribute('role', 'dialog');
    panneau.setAttribute('aria-modal', 'true');
    panneau.setAttribute('aria-label', 'Pause');
    var boite = el('div', 'pause-boite');
    boite.appendChild(el('span', 'pause-jeu', JEUX[jeu]));
    boite.appendChild(el('strong', 'pause-titre', 'PAUSE'));
    var reprendre = el('button', 'pause-btn pause-btn--reprendre', 'Reprendre');
    reprendre.type = 'button';
    reprendre.addEventListener('click', fermer);
    boite.appendChild(reprendre);
    var quitter = el('button', 'pause-btn', 'Quitter vers le DinderPad');
    quitter.type = 'button';
    quitter.addEventListener('click', function () {
      fermer();
      location.hash = '';
    });
    boite.appendChild(quitter);
    panneau.appendChild(boite);
    // Un clic a cote du panneau ne fait rien : seul "Reprendre" relance.
    document.body.appendChild(panneau);
    reprendre.focus();
  }

  function fermer() {
    if (panneau) { panneau.remove(); panneau = null; }
    document.body.classList.remove('is-pause');
    degeler();
  }

  // Le clavier n'atteint plus le jeu pendant la pause ; Echap la ferme.
  // Hors pause, Echap l'ouvre, dans un jeu.
  function clavier(e) {
    if (enPause) {
      if (e.key === 'Escape' && e.type === 'keydown') { e.preventDefault(); fermer(); }
      else if (!(panneau && panneau.contains(e.target) && (e.key === 'Enter' || e.key === ' ' || e.key === 'Tab'))) {
        e.preventDefault();
      }
      e.stopImmediatePropagation();
      return;
    }
    if (e.type === 'keydown' && e.key === 'Escape' && jeuCourant() &&
        document.body.classList.contains('is-plein')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      ouvrir();
    }
  }
  window.addEventListener('keydown', clavier, true);
  window.addEventListener('keyup', clavier, true);

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pad-pause]');
    if (!b) return;
    e.preventDefault();
    ouvrir();
  });

  // Changer d'ecran (bouton du navigateur, par exemple) leve la pause.
  window.addEventListener('hashchange', function () {
    if (enPause && !jeuCourant()) fermer();
  });

  // Un onglet qu'on quitte en plein jeu se met en pause tout seul.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && jeuCourant() && document.body.classList.contains('is-plein')) ouvrir();
  });

  window.PAUSE = {
    ouvrir: ouvrir, fermer: fermer,
    active: function () { return enPause; },
    JEUX: JEUX
  };
})();
