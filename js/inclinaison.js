// L'espace qui suit le telephone (et, sur ordinateur, la souris).
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
  var neutre = null, ecoute = false, accorde = false, dernier = 0, capteur = 0;
  var AMPLITUDE = 22;                      // degres pour aller au bout

  function borne(v) { return Math.max(-1, Math.min(1, v)); }

  function angleEcran() {
    var o = window.screen && window.screen.orientation;
    var a = o && typeof o.angle === 'number' ? o.angle : (window.orientation || 0);
    return ((a % 360) + 360) % 360;
  }

  function surOrientation(e) {
    if (e.beta == null || e.gamma == null) return;
    capteur = performance.now();
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

  // A appeler pendant un geste du joueur. Tant que la permission n'est
  // pas accordee, on la redemande au geste suivant.
  function demander() {
    if (reduit || accorde || !('DeviceOrientationEvent' in window)) return;
    ecouter();
    var DOE = window.DeviceOrientationEvent;
    if (typeof DOE.requestPermission !== 'function') { accorde = true; return; }
    try {
      DOE.requestPermission().then(function (r) { if (r === 'granted') accorde = true; }, function () {});
    } catch (e) {}
  }

  // Sur un ordinateur, pas de capteur : c'est la souris qui fait glisser
  // l'espace. Elle cede la place des que le capteur parle.
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || reduit) return;
    if (capteur && performance.now() - capteur < 2000) return;
    var w = window.innerWidth || 1, h = window.innerHeight || 1;
    cible.x = borne((e.clientX / w - 0.5) * 2);
    cible.y = borne((e.clientY / h - 0.5) * 2);
  }, { passive: true });

  // Le premier toucher, n'importe ou, suffit a demander la permission la
  // ou elle ne se montre pas (Android) ; sur iPhone, les scenes la
  // redemandent au bon moment.
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
            (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  if (!IOS) window.addEventListener('touchend', function () { demander(); }, { passive: true });

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

  // On ecoute des le depart : la ou il faut une permission, rien
  // n'arrive avant qu'elle soit accordee, et c'est sans danger.
  if (!reduit && 'DeviceOrientationEvent' in window) ecouter();

  window.INCLINAISON = { lire: lire, demander: demander };
})();
