// L'espace qui suit le telephone.
//
// Sur un telephone ou une tablette, pencher l'appareil fait glisser le
// fond etoile : les etoiles proches bougent plus que les lointaines, et
// l'on sent la profondeur. Les scenes spatiales (la venue d'Azhrakonr, le
// combat, le Telescope) lisent ici un decalage entre -1 et 1 sur chaque
// axe, et l'appliquent a leurs etoiles selon leur profondeur.
//
// La position "a plat" n'est pas imposee : la premiere mesure sert de
// repere, et ce repere suit lentement la main. On peut tenir l'appareil
// comme on veut, seul le geste compte.
//
// Sur iOS, il faut la permission du joueur, et elle ne se demande que
// pendant un geste (un clic) : les scenes appellent demander() au moment
// ou on les ouvre.
(function () {
  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cible = { x: 0, y: 0 }, lisse = { x: 0, y: 0 };
  var neutre = null, ecoute = false, demande = false, dernier = 0;
  var AMPLITUDE = 22;                      // degres pour aller au bout

  function borne(v) { return Math.max(-1, Math.min(1, v)); }

  function angleEcran() {
    var o = window.screen && window.screen.orientation;
    var a = o && typeof o.angle === 'number' ? o.angle : (window.orientation || 0);
    return ((a % 360) + 360) % 360;
  }

  function surOrientation(e) {
    if (e.beta == null || e.gamma == null) return;
    var b = e.beta, g = e.gamma, a = angleEcran(), x, y;
    // Les axes de l'appareil, ramenes a ceux de l'ecran tel qu'on le tient.
    if (a === 90)       { x = b;  y = -g; }
    else if (a === 270) { x = -b; y = g; }
    else if (a === 180) { x = -g; y = -b; }
    else                { x = g;  y = b; }
    if (!neutre) neutre = { x: x, y: y };
    neutre.x += (x - neutre.x) * 0.006;
    neutre.y += (y - neutre.y) * 0.006;
    cible.x = borne((x - neutre.x) / AMPLITUDE);
    cible.y = borne((y - neutre.y) / AMPLITUDE);
  }

  function ecouter() {
    if (ecoute) return;
    ecoute = true;
    window.addEventListener('deviceorientation', surOrientation);
    // L'ecran pivote : le repere d'avant ne vaut plus rien.
    window.addEventListener('orientationchange', function () { neutre = null; });
  }

  // A appeler pendant un geste du joueur.
  function demander() {
    if (reduit || demande || !('DeviceOrientationEvent' in window)) return;
    demande = true;
    var DOE = window.DeviceOrientationEvent;
    if (typeof DOE.requestPermission === 'function') {
      try {
        DOE.requestPermission().then(function (r) { if (r === 'granted') ecouter(); }, function () {});
      } catch (e) {}
    } else {
      ecouter();
    }
  }

  // Le decalage du moment, adouci : on le lit a chaque image.
  function lire() {
    if (reduit) return lisse;
    var t = performance.now();
    var k = dernier ? 1 - Math.pow(0.002, Math.min(0.1, (t - dernier) / 1000)) : 1;
    dernier = t;
    lisse.x += (cible.x - lisse.x) * k;
    lisse.y += (cible.y - lisse.y) * k;
    return lisse;
  }

  // Sans permission a demander (Android), on ecoute des le depart.
  if (!reduit && 'DeviceOrientationEvent' in window &&
      typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
    ecouter();
  }

  window.INCLINAISON = { lire: lire, demander: demander };
})();
