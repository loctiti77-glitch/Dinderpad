// Calcule --px : la taille d'un pixel de l'image source une fois affichee.
// Toutes les mesures du CSS sont exprimees en pixels de l'image d'origine,
// donc les cases restent alignees sur le cadre quel que soit le zoom.
(function () {
  function sync(pad) {
    var img = pad.querySelector('.pad-img');
    if (!img) return;
    var base = parseFloat(pad.dataset.padWidth) || 1612;
    var w = img.getBoundingClientRect().width;
    if (w > 0) pad.style.setProperty('--px', (w / base) + 'px');
  }

  function init() {
    document.querySelectorAll('.pad').forEach(function (pad) {
      sync(pad);
      var img = pad.querySelector('.pad-img');
      if (img && !img.complete) img.addEventListener('load', function () { sync(pad); });
      if (window.ResizeObserver) new ResizeObserver(function () { sync(pad); }).observe(pad);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('resize', init);
})();
