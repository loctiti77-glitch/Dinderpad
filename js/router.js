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

  function show(name, arg) {
    var home = !name;

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
