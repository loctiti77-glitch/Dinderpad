// Aiguillage du DinderPad.
// Tout se passe sur un seul ecran : on ne charge jamais de nouvelle page,
// on change seulement ce que le pad affiche. L'adresse porte la rubrique
// (#dinders, #credits...), ce qui garde le bouton Retour du navigateur.
(function () {
  var body, padMenu, padScreen, menu, screen, view, nav;
  var current = null, currentArg = null;

  // Une adresse peut porter un argument : #dinder/he-melt ouvre la fiche
  // de ce personnage. Rien de connu : on reste a l'accueil.
  function fromHash() {
    var h = (location.hash || '').replace(/^#/, '');
    if (!h) return { name: null, arg: null };
    var i = h.indexOf('/');
    var name = i === -1 ? h : h.slice(0, i);
    var arg  = i === -1 ? null : decodeURIComponent(h.slice(i + 1));
    return window.VIEWS[name] ? { name: name, arg: arg } : { name: null, arg: null };
  }

  // Les jeux prennent toute la fenetre : le chassis du pad s'efface et
  // son ecran s'agrandit jusqu'aux bords. Les autres rubriques restent
  // dans l'appareil.
  var PLEIN_ECRAN = { 'founder-war': true, 'peche': true, 'odyssee': true, 'wade': true };

  function pleinEcran(oui) {
    if (body.classList.contains('is-plein') === oui) return;
    body.classList.toggle('is-plein', oui);
    // Le pad vient de changer de taille : --px doit suivre avant que la
    // rubrique ne se dessine.
    window.dispatchEvent(new Event('resize'));
  }

  // Chaque jeu a son entree en scene, jouee par-dessus la fenetre le
  // temps que l'ecran s'agrandisse derriere. "suite" nomme les rubriques
  // d'ou l'on revient sans ceremonie : sortir de la Poissonnerie pour
  // retourner au lac n'est pas une entree dans le jeu.
  var ENTREES = {
    'founder-war': { titre: 'The Founder War', suite: [] },
    'peche':       { titre: 'Fish n\u2019Der',
                     suite: ['peche-hub', 'poissonnerie', 'vestiaire', 'peche-collection', 'armurerie'] },
    'odyssee':     { titre: 'The Odyssey of Dinder',
                     suite: ['odyssee-equipier', 'odyssee-carnet', 'armurerie'] },
    'wade':        { titre: 'Wade and Friends', suite: [] }
  };

  function jouerEntree(name, depuis) {
    var e = ENTREES[name];
    if (!e || depuis === name || e.suite.indexOf(depuis) !== -1) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var vieux = document.querySelector('.entree');
    if (vieux) vieux.remove();

    var scene = document.createElement('div');
    scene.className = 'entree entree--' + name;
    scene.setAttribute('aria-hidden', 'true');
    ['fond', 'a', 'b'].forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'entree-' + c;
      scene.appendChild(d);
    });
    // Une poignee de particules : bulles ou etincelles selon le jeu. Le
    // style decide de ce qu'elles sont.
    for (var i = 0; i < 14; i++) {
      var p = document.createElement('span');
      p.className = 'entree-p';
      p.style.setProperty('--i', String(i));
      scene.appendChild(p);
    }
    var t = document.createElement('strong');
    t.className = 'entree-titre';
    t.textContent = e.titre;
    scene.appendChild(t);
    body.appendChild(scene);
    setTimeout(function () { if (scene.parentNode) scene.remove(); }, 1750);
  }

  function show(name, arg) {
    var home = !name;
    if (!home && PLEIN_ECRAN[name]) jouerEntree(name, current);
    pleinEcran(!home && !!PLEIN_ECRAN[name]);

    // Le chassis ne change pas : on ne fait glisser que la face avant.
    padMenu.classList.toggle('is-hidden', !home);
    padScreen.classList.toggle('is-hidden', home);
    menu.classList.toggle('is-hidden', !home);
    nav.classList.toggle('is-hidden', home);
    screen.classList.toggle('is-hidden', home);
    body.classList.toggle('is-home', home);

    view.textContent = '';
    view.className = 'view';

    if (!home) {
      // Un court fondu : on doit sentir l'ecran qui bascule.
      screen.classList.remove('is-live');
      window.VIEWS[name].render(view, arg);
      requestAnimationFrame(function () { screen.classList.add('is-live'); });
      document.title = window.VIEWS[name].title + ' – DinderPad';
    } else {
      document.title = 'DinderPad';
    }

    current = name;
    currentArg = arg;
  }

  function route() {
    var r = fromHash();
    show(r.name, r.arg);
  }

  function init() {
    body      = document.body;
    padMenu   = document.getElementById('padMenu');
    padScreen = document.getElementById('padScreen');
    menu      = document.getElementById('menu');
    screen    = document.getElementById('screen');
    view      = document.getElementById('view');
    nav       = document.getElementById('padNav');
    if (!view) return;

    // Retour : on remonte l'historique si on vient d'un autre ecran du pad,
    // sinon on rentre simplement a l'accueil.
    document.addEventListener('click', function (e) {
      var back = e.target.closest && e.target.closest('[data-pad-back]');
      if (back) {
        e.preventDefault();
        if (history.length > 1) history.back();
        else location.hash = '';
        return;
      }
      var home = e.target.closest && e.target.closest('[data-pad-home]');
      if (home) {
        e.preventDefault();
        if (location.hash) location.hash = '';
        else route();
      }
    });

    // En plein ecran, le bouton d'accueil du pad reste a portee, au
    // milieu du bord gauche (css/style.css). Echap fait de meme.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || e.defaultPrevented || !body.classList.contains('is-plein')) return;
      var retour = nav && nav.querySelector('[data-pad-home]');
      if (!retour) return;
      e.preventDefault();
      retour.click();
    });

    window.addEventListener('hashchange', route);
    route();
  }

  // Permet a une vue de se redessiner apres avoir change l'etat.
  window.ROUTER = {
    reload: function () { show(current, currentArg); },
    go: function (name) { location.hash = name ? '#' + name : ''; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
