// Fondu au noir entre les pages.
// Ce script doit rester dans le <head> : il pose le voile avant le premier
// rendu, sinon la page apparait une fraction de seconde avant le fondu.
(function () {
  var DURATION = 380; // ms, doit correspondre a la transition CSS .fade-veil

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) DURATION = 0;

  var veil = document.createElement('div');
  veil.className = 'fade-veil';
  veil.setAttribute('aria-hidden', 'true');
  (document.body || document.documentElement).appendChild(veil);

  function reveal() {
    veil.classList.remove('leaving');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { veil.classList.add('out'); });
    });
  }

  // 'pageshow' couvre le chargement normal ET le retour arriere (bfcache),
  // ou la page est restauree telle quelle, voile compris.
  window.addEventListener('pageshow', reveal);

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var a = e.target.closest && e.target.closest('a');
    if (!a) return;

    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;          // ancre : pas de fondu
    if (a.target && a.target !== '_self') return;         // nouvel onglet
    if (a.hasAttribute('download')) return;
    if (a.href.indexOf(location.origin) !== 0) return;    // lien externe

    e.preventDefault();
    veil.classList.remove('out');
    veil.classList.add('leaving');
    setTimeout(function () { location.href = a.href; }, DURATION);
  });

  // Bouton retour : meme fondu, puis on remonte l'historique.
  // Si la page a ete ouverte directement, il n'y a rien derriere : on
  // renvoie vers l'accueil plutot que de laisser le bouton sans effet.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-nav="back"]');
    if (!btn) return;

    e.preventDefault();
    veil.classList.remove('out');
    veil.classList.add('leaving');

    var home = btn.getAttribute('data-home') || '../index.html';
    var canGoBack = history.length > 1 && document.referrer &&
                    document.referrer.indexOf(location.origin) === 0;

    setTimeout(function () {
      if (canGoBack) history.back(); else location.href = home;
    }, DURATION);
  });
})();
