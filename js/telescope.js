// Le Telescope : voir les deux systemes, de loin, puis de pres.
//
// Il n'arrive qu'une fois deux failles de securite contenues et le
// gardien d'Ignis (ST-I8) vaincu. Il montre le systeme solaire et le
// systeme stellaire, l'etoile au centre et les mondes qui tournent sur
// leurs orbites. Un monde touche ouvre sa fiche ; « GO ! » y emmene en
// un instant, et ses lieux s'affichent un a un, avec les Dinders qui y
// vivent.
(function () {
  var DP = window.DP;
  if (!DP) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function toile(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================
  //  Le deblocage
  // ==========================================================

  var GARDIEN_IGNIS = 'soleil-noye';

  function deblocable() {
    var B = window.BOSS;
    return DP.faillesContenues() >= 2 && !!B && B.vaincu(GARDIEN_IGNIS);
  }

  // L'annonce : la carte des trouvailles, avec le Telescope dedans.
  function annoncer() {
    var pad = document.querySelector('.pad');
    if (!pad) return;
    var carte = el('div', 'art-trouve tel-trouve');
    carte.appendChild(el('div', 'art-trouve-rayons'));
    carte.appendChild(el('span', 'art-trouve-titre', 'Objet trouvé'));
    var im = el('img', 'art-trouve-img');
    im.src = 'assets/items/telescope.webp';
    im.alt = '';
    carte.appendChild(im);
    carte.appendChild(el('strong', 'art-trouve-nom', 'Télescope'));
    carte.appendChild(el('span', 'art-trouve-dinder', 'Deux systèmes, à portée de vue'));
    carte.appendChild(el('span', 'art-trouve-compte', 'Dans tes Items'));
    pad.appendChild(carte);
    setTimeout(function () { carte.classList.add('is-sortie'); }, reduit ? 2200 : 3600);
    setTimeout(function () { carte.remove(); }, reduit ? 2300 : 4100);
  }

  function verifier(fete) {
    if (DP.aLeTelescope() || !deblocable()) return;
    if (DP.prendreTelescope() && fete) annoncer();
  }

  // On regarde apres chaque faille contenue et chaque exploit (un gardien
  // vaincu en est un).
  ['contenirFaille', 'compterExploit'].forEach(function (nom) {
    var orig = DP[nom];
    if (typeof orig !== 'function') return;
    DP[nom] = function () {
      var r = orig.apply(this, arguments);
      try { setTimeout(function () { verifier(true); }, 1200); } catch (e) {}
      return r;
    };
  });
  // Ce qui etait deja acquis avant l'arrivee du Telescope : sans ceremonie.
  function auChargement() { verifier(false); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auChargement);
  else setTimeout(auChargement, 0);

  // ==========================================================
  //  Les lieux de chaque monde, et qui y vit
  //  type : ce qu'est l'endroit ; note : ce qu'en dit le Telescope.
  // ==========================================================

  var LIEUX = {
    // ---------- Systeme solaire ----------
    mercure: [
      { nom: 'Les flaques de métal', type: 'Face brûlée', dinders: [], note: 'C’est ici que dort la Pierre du Feu, le premier élément de Multinder.' },
      { nom: 'Le terminateur', type: 'Frontière jour-nuit', dinders: [], note: 'Cent pas séparent la fournaise du gel.' }
    ],
    venus: [
      { nom: 'L’observatoire englouti', type: 'Ruines', dinders: ['dr-islas-human-form'], note: 'La lentille de son télescope y est restée, sous la brume.' },
      { nom: 'Les mares d’acide', type: 'Plaine', dinders: [], note: 'Tout ce qui tombe ici finit par fondre.' }
    ],
    terre: [
      { nom: 'Le laboratoire du Dr. Islas', type: 'Laboratoire', dinders: ['dr-islas-human-form', 'dr-islas-demicos-form'] },
      { nom: 'La maison des Altérés', type: 'Institution', dinders: ['calder-veyne-veinburner', 'edgar-marks-grincrusher'] },
      { nom: 'Le casino', type: 'Ville', dinders: ['carl-sinars-cardinal-sin'] },
      { nom: 'Le jardin', type: 'Chez toi', dinders: ['multinder'], note: 'Le gardien des cinq éléments veille sur la planète.' },
      { nom: 'Signaux sans origine', type: 'Inconnu', dinders: ['harry-hargrove', 'marlon-coach', 'baron-zofiax', 'william-batant'], note: 'Ils sont là. Le Télescope ne sait pas d’où ils viennent.' }
    ],
    lune: [
      { nom: 'Le camp de l’expédition', type: 'Base', dinders: ['dr-islas-human-form'], note: 'Un fanion planté, et des traces de pas qui repartent.' },
      { nom: 'La face cachée', type: 'Plaine', dinders: [] }
    ],
    mars: [
      { nom: 'Le cratère de la greffe', type: 'Cratère', dinders: ['dr-islas-demicos-form'], note: 'Un rouage d’épaule, à moitié enfoui.' },
      { nom: 'Les canyons rouges', type: 'Canyons', dinders: [] }
    ],
    jupiter: [
      { nom: 'L’œil de la tempête', type: 'Tempête', dinders: [], note: 'La Plume de l’Air tourne au centre depuis toujours.' },
      { nom: 'Les bandes de nuages', type: 'Atmosphère', dinders: [] }
    ],
    saturne: [
      { nom: 'Les anneaux', type: 'Anneaux', dinders: [], note: 'Le Roi des Anneaux y garde une couronne qui n’est pas la sienne.' },
      { nom: 'Le pôle hexagonal', type: 'Tempête', dinders: [] }
    ],
    uranus: [
      { nom: 'Le ciel couché', type: 'Atmosphère', dinders: [] }
    ],
    neptune: [
      { nom: 'Les abysses', type: 'Océan', dinders: ['h'], note: 'L’Orbe de H y brille encore.' },
      { nom: 'Le courant froid', type: 'Profondeurs', dinders: [] }
    ],
    // ---------- Systeme stellaire ----------
    cryos: [
      { nom: 'Les puits de froid', type: 'Gouffres', dinders: [] },
      { nom: 'Les étoiles dans la glace', type: 'Banquise', dinders: [] }
    ],
    opaline: [
      { nom: 'Les mers de perles', type: 'Océan', dinders: ['timeo-traveler'], note: 'D’ici, on voit tous les autres mondes à l’œil nu.' },
      { nom: 'Le rivage de verre', type: 'Côte', dinders: [] }
    ],
    altera: [
      { nom: 'Le royaume de Karsovie', type: 'Royaume', dinders: ['gart-kervelor-king-of-karsovia'] },
      { nom: 'La Maison du Burger', type: 'Restaurant', dinders: ['wade-wolhunter', 'stephen-sharkodon', 'faith-faisandoir', 'charlie-capsule'], note: 'Fermé à minuit. Pas tout à fait vide.' },
      { nom: 'Le sanctuaire des orbes', type: 'Sanctuaire', dinders: ['v', 'a'] }
    ],
    viridia: [
      { nom: 'La jungle sans fin', type: 'Forêt', dinders: [] },
      { nom: 'Les marais tièdes', type: 'Marais', dinders: [] }
    ],
    ferron: [
      { nom: 'L’usine d’acide', type: 'Usine', dinders: ['he-melt'], note: 'La cuve nécrophylactique fume encore.' },
      { nom: 'Les nappes d’éclairs', type: 'Plaine', dinders: [] }
    ],
    brisure: [
      { nom: 'L’Effondrement Terminal', type: 'Éclat', dinders: ['lefondateur', 'dr-islas-the-founder'], note: 'Là où l’on a voulu remettre l’omnivers en ordre.' },
      { nom: 'Le cœur qui luit', type: 'Vide', dinders: [] }
    ],
    pyrrhe: [
      { nom: 'Les dunes qui chantent', type: 'Désert', dinders: [] },
      { nom: 'Le verre encore mou', type: 'Plaine', dinders: [] }
    ],
    ignis: [
      { nom: 'La mer de lave', type: 'Océan de lave', dinders: [], note: 'Le Soleil Noyé n’y est plus.' },
      { nom: 'La plaine de cendre', type: 'Plaine', dinders: [] }
    ]
  };

  // Les deux etoiles : on peut les observer, comme les mondes.
  var ETOILES = {
    solaire: { id: 'soleil', nom: 'Soleil', code: 'SS-0', systeme: 'solaire', etoile: true,
               sous: 'Le cœur du système solaire',
               texte: 'Une naine jaune, au milieu de l’âge. Huit mondes lui tournent autour, et le Téléportail n’a jamais osé s’en approcher : rien ne s’y pose.' },
    stellaire: { id: 'etoile-stellaire', nom: 'L’Étoile qui boit', code: 'ST-0', systeme: 'stellaire', etoile: true,
                 sous: 'Le cœur du système stellaire',
                 texte: 'Pendant longtemps, elle n’a rien donné : elle buvait la chaleur de ses propres mondes. Depuis que le Soleil Noyé est tombé au fond d’Ignis, elle brille enfin.' }
  };
  LIEUX.soleil = [
    { nom: 'La couronne', type: 'Plasma', dinders: [], note: 'Des jets plus hauts que dix Terres, qui retombent en boucles.' },
    { nom: 'Les taches sombres', type: 'Surface', dinders: [], note: 'Des zones plus froides, grandes comme des planètes.' },
    { nom: 'Le noyau', type: 'Cœur', dinders: [], note: 'Quinze millions de degrés. Le Télescope n’y voit que du blanc.' },
    { nom: 'La bouche du trou de ver', type: 'Anomalie', dinders: ['dr-islas-final-form', 'dr-islas-singularity'], note: 'Le passage entre les deux systèmes.' }
  ];
  LIEUX['etoile-stellaire'] = [
    { nom: 'La surface assoiffée', type: 'Surface', dinders: [], note: 'Elle a bu la chaleur de Cryos jusqu’à la glace.' },
    { nom: 'Le cœur rallumé', type: 'Cœur', dinders: [], note: 'Il ne brûle que depuis la chute du Soleil Noyé.' },
    { nom: 'L’embouchure du trou de ver', type: 'Anomalie', dinders: ['dr-islas-final-form', 'dr-islas-singularity'], note: 'L’autre bout du passage ouvert depuis le Soleil.' }
  ];
  // Celui qui a fait les animatroniques travaillait derriere la cuisine.
  LIEUX.altera.forEach(function (l) { if (l.nom === 'La Maison du Burger') l.dinders.push('their-creator'); });
  // De l'autre cote du trou de ver : un espace sans nom, et la planete
  // ou se tient Azhrakonr.
  LIEUX.ailleurs = [
    { nom: 'La balise lointaine', type: 'Anomalie', dinders: ['azhrakonr'], note: 'Le signal qu’on suivait depuis New York. Il venait d’ici.' },
    { nom: 'Les failles', type: 'Fractures', dinders: [], note: 'Elles partent du pied de la balise, et elles s’élargissent.' }
  ];
  var AILLEURS = { id: 'ailleurs', nom: '???', code: '??-?', systeme: 'ailleurs', sous: 'Au-delà du trou de ver' };
  var TROU = { id: 'trou-de-ver', nom: 'Trou de ver' };

  // La taille relative des mondes, et ce qui les distingue a l'oeil.
  var FORME = {
    mercure: { t: 0.5 }, venus: { t: 0.8, voile: 0.55 }, terre: { t: 0.85, lune: true, atmo: '#7ac8ff', mer: 0.58 },
    lune: { t: 0.3 }, mars: { t: 0.65, atmo: '#ff9a6a' },
    jupiter: { t: 1.65, gaz: true }, saturne: { t: 1.4, gaz: true, anneaux: true },
    uranus: { t: 1.05, gaz: true, atmo: '#9ef0ff' }, neptune: { t: 1.05, gaz: true, atmo: '#6a9aff' },
    cryos: { t: 0.7, atmo: '#bfe8ff' }, opaline: { t: 0.8, atmo: '#ffd8ec' }, altera: { t: 0.85, atmo: '#c8a0ff' },
    viridia: { t: 0.9, atmo: '#7cf0a0' }, ferron: { t: 1.25 }, brisure: { t: 1.0, brisee: true },
    pyrrhe: { t: 0.9, atmo: '#ffb070' }, ignis: { t: 1.2, atmo: '#ff6a2a' }
  };

  // ==========================================================
  //  Le bruit, et les textures des mondes
  // ==========================================================

  function hash3(x, y, z) {
    var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function lisse(t) { return t * t * (3 - 2 * t); }
  function bruit3(x, y, z) {
    var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    var fx = lisse(x - X), fy = lisse(y - Y), fz = lisse(z - Z);
    function m(a, b, t) { return a + (b - a) * t; }
    return m(m(m(hash3(X, Y, Z), hash3(X + 1, Y, Z), fx), m(hash3(X, Y + 1, Z), hash3(X + 1, Y + 1, Z), fx), fy),
             m(m(hash3(X, Y, Z + 1), hash3(X + 1, Y, Z + 1), fx), m(hash3(X, Y + 1, Z + 1), hash3(X + 1, Y + 1, Z + 1), fx), fy), fz);
  }
  function fbm3(x, y, z) {
    return bruit3(x, y, z) * 0.5 + bruit3(x * 2.03, y * 2.03, z * 2.03) * 0.28 +
           bruit3(x * 4.1, y * 4.1, z * 4.1) * 0.14 + bruit3(x * 8.3, y * 8.3, z * 8.3) * 0.08;
  }
  function rgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  // Une carte du monde (longitude x latitude), tiree de sa palette : sol,
  // mers, roches et cristaux pour un monde solide ; des bandes pour une
  // geante gazeuse. Le bruit est pris sur une sphere : la carte boucle.
  var TEX = {};
  function texture(a) {
    if (TEX[a.id]) return TEX[a.id];
    var W = 256, H = 128, d = new Uint8ClampedArray(W * H * 4), P = a.palette, F = FORME[a.id] || {};
    var sol = rgb(P.sol), sol2 = rgb(P.sol2), grain = rgb(P.grain), roche = rgb(P.roche), haut = rgb(P.rocheHaut),
        liq = rgb(P.liquide), liq2 = rgb(P.liquide2), ecume = rgb(P.ecume), cri = rgb(P.cristal);
    var graine = a.id.length * 13.7 + a.id.charCodeAt(0);
    var mer = F.mer || Math.min(0.62, (a.eau || 0.05) * 5);
    for (var y = 0; y < H; y++) {
      var lat = (y / H - 0.5) * Math.PI;
      for (var x = 0; x < W; x++) {
        var lon = x / W * Math.PI * 2;
        var cx = Math.cos(lat) * Math.cos(lon), cy = Math.sin(lat), cz = Math.cos(lat) * Math.sin(lon);
        var c;
        if (F.gaz) {
          var tur = fbm3(cx * 2 + graine, cy * 2, cz * 2);
          var bande = Math.sin((cy * 9 + tur * 1.6) * Math.PI) * 0.5 + 0.5;
          c = mix(mix(sol, grain, bande), mix(liq, liq2, tur), 0.35 + Math.sin(cy * 23 + tur * 4) * 0.12);
          if (a.id === 'jupiter') {
            var dx = lon - 4.0, dy = lat + 0.35, tache = (dx * dx) / 0.09 + (dy * dy) / 0.012;
            if (tache < 1) c = mix(c, [200, 90, 50], (1 - tache) * 0.85);
          }
        } else {
          var n = fbm3(cx * 1.8 + graine, cy * 1.8, cz * 1.8);
          var r = fbm3(cx * 5 + 31, cy * 5, cz * 5 + graine);
          if (n < mer) {
            // La mer (ou la lave, ou le vide) : plus clair pres des rivages.
            var k = n / mer;
            c = mix(liq, liq2, Math.pow(k, 3));
            if (k > 0.93) c = mix(c, ecume, (k - 0.93) / 0.07 * 0.6);
          } else {
            var k2 = (n - mer) / (1 - mer);
            c = mix(sol, sol2, r);
            c = mix(c, grain, Math.max(0, r - 0.6) * 1.5);
            if (k2 > 0.45) c = mix(c, roche, Math.min(1, (k2 - 0.45) * 3));
            if (k2 > 0.7) c = mix(c, haut, Math.min(1, (k2 - 0.7) * 3));
            if (r > 0.72 && hash3(x, y, 9) > 0.7) c = mix(c, cri, 0.7);
          }
          // Les poles, plus pales sur les mondes froids et temperes.
          if (Math.abs(cy) > 0.86 && a.id !== 'ignis' && a.id !== 'pyrrhe' && a.id !== 'venus') c = mix(c, [235, 240, 248], (Math.abs(cy) - 0.86) / 0.14 * 0.8);
        }
        if (F.brisee) {
          // Les failles sur le vide, et le coeur qui luit au fond.
          var f = Math.abs(fbm3(cx * 3 + 7, cy * 3, cz * 3) - 0.5);
          if (f < 0.025) c = mix([20, 6, 24], ecume, 1 - f / 0.025);
        }
        if (F.voile) {
          var v = fbm3(cx * 3 + 50, cy * 6, cz * 3);
          c = mix(c, mix(grain, [250, 235, 170], 0.4), F.voile * (0.6 + v * 0.4));
        }
        var i = (y * W + x) * 4;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }
    TEX[a.id] = { w: W, h: H, d: d };
    return TEX[a.id];
  }

  // Une sphere eclairee : la carte enroulee, tournee de rot, avec le
  // soleil dans la direction (lx, ly) a l'ecran et un bord plus sombre.
  function sphere(c, a, rot, lx, ly) {
    var T = texture(a), S = c.width, x = c.getContext('2d');
    var img = x.createImageData(S, S), d = img.data, r = S / 2;
    var ll = Math.sqrt(lx * lx + ly * ly + 0.12) || 1, Lx = lx / ll, Ly = ly / ll, Lz = 0.35 / ll;
    for (var py = 0; py < S; py++) {
      var ny = (py + 0.5 - r) / r;
      for (var px = 0; px < S; px++) {
        var nx = (px + 0.5 - r) / r, q = nx * nx + ny * ny;
        var o = (py * S + px) * 4;
        if (q > 1) { d[o + 3] = 0; continue; }
        var nz = Math.sqrt(1 - q);
        var lon = Math.atan2(nx, nz) + rot, lat = Math.asin(ny);
        var u = ((lon / (Math.PI * 2)) % 1 + 1) % 1, v = lat / Math.PI + 0.5;
        var ti = (Math.min(T.h - 1, Math.floor(v * T.h)) * T.w + Math.floor(u * T.w)) * 4;
        var dif = nx * Lx + ny * Ly + nz * Lz;
        var l = Math.pow(Math.max(0, dif), 0.8) * 1.25 + 0.025;
        var bord = 0.65 + 0.35 * Math.pow(nz, 0.5);
        d[o] = T.d[ti] * l * bord; d[o + 1] = T.d[ti + 1] * l * bord; d[o + 2] = T.d[ti + 2] * l * bord;
        d[o + 3] = q > 0.97 ? 255 * (1 - q) / 0.03 : 255;
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  // ==========================================================
  //  La vue
  // ==========================================================

  function viewTelescope(view) {
    if (!DP.aLeTelescope()) { location.hash = '#items'; return; }
    var O = window.ODYVIE;
    var box = el('div', 'tel');
    var cv = el('canvas', 'tel-cv');
    box.appendChild(cv);
    var ui = el('div', 'tel-ui');
    box.appendChild(ui);
    view.appendChild(box);
    var x = cv.getContext('2d');

    // L'en-tete : le nom de l'instrument.
    var tete = el('div', 'tel-tete');
    tete.appendChild(el('strong', 'tel-titre', 'Télescope'));
    box.appendChild(tete);
    var aide = el('div', 'tel-aide', 'Touche un monde pour l’observer');
    box.appendChild(aide);

    // L'objectif qui s'ouvre.
    var iris = el('div', 'tel-iris');
    box.appendChild(iris);

    var W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
    function taille() {
      var b = box.getBoundingClientRect();
      W = Math.max(10, b.width); H = Math.max(10, b.height);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    }
    taille();
    window.addEventListener('resize', taille);

    // intro : de 0 a 1, l'approche depuis le fond de l'espace.
    var etat = { mode: 'systeme', t: 0, intro: reduit ? 1 : 0, survol: null, choisi: null, voyage: 0, lieux: [] };

    // Les systemes connus, cote a cote : le solaire a gauche, le
    // stellaire a droite (s'il est ouvert).
    var SYS = (O ? O.systemes() : [{ id: 'solaire', nom: 'Système solaire' }]);
    function disposition() {
      var deux = SYS.length > 1;
      return SYS.map(function (s, i) {
        return { id: s.id, nom: s.nom, prefixe: s.prefixe || (s.id === 'stellaire' ? 'ST' : 'SS'),
                 c: [deux ? W * (i ? 0.735 : 0.265) : W * 0.5, H * 0.53],
                 R: deux ? Math.min(W * 0.2, H * 0.39) : Math.min(W * 0.45, H * 0.42) };
      });
    }
    function sysDe(id) { return disposition().filter(function (s) { return s.id === id; })[0]; }

    // ---------- Le fond : des etoiles, et les deux nebuleuses ----------
    var FONDS = {};
    function fond() {
      var k = W + 'x' + H;
      if (FONDS[k]) return FONDS[k];
      var c = toile(Math.round(W * DPR), Math.round(H * DPR)), f = c.getContext('2d');
      f.scale(DPR, DPR);
      f.fillStyle = '#02030a'; f.fillRect(0, 0, W, H);
      // Le bleu du solaire a gauche, le violet du stellaire a droite.
      [[0.2, [40, 110, 200]], [0.3, [30, 170, 170]], [0.1, [90, 60, 180]],
       [0.75, [150, 60, 220]], [0.85, [230, 70, 160]], [0.65, [60, 40, 160]], [0.5, [70, 50, 140]]].forEach(function (n, i) {
        var cx = n[0] * W + (hash3(i, 1, 3) - 0.5) * W * 0.15, cy = hash3(i, 2, 3) * H, r = (0.25 + hash3(i, 3, 5) * 0.35) * Math.max(W, H);
        var g = f.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(' + n[1].join(',') + ',.15)'); g.addColorStop(1, 'rgba(' + n[1].join(',') + ',0)');
        f.fillStyle = g; f.fillRect(0, 0, W, H);
      });
      for (var i = 0; i < 900; i++) {
        var sx = hash3(i, 7, 1) * W, sy = hash3(i, 8, 1) * H, b = hash3(i, 9, 1);
        f.fillStyle = 'rgba(' + (200 + b * 55) + ',' + (210 + b * 45) + ',255,' + (0.2 + b * 0.7).toFixed(2) + ')';
        var s = b > 0.97 ? 2 : b > 0.85 ? 1.4 : 0.9;
        f.fillRect(sx, sy, s, s);
      }
      FONDS[k] = c;
      return c;
    }

    // ---------- La disposition des mondes ----------
    function lune() { return O && O.ASTRES.filter(function (a) { return a.id === 'lune'; })[0]; }
    function base() { return Math.min(W, H) * (SYS.length > 1 ? 0.027 : 0.032); }
    var SPH = {};
    // Ou se trouve chaque monde en ce moment.
    function positions() {
      var out = [];
      if (!O) return out;
      disposition().forEach(function (S) {
        var L = O.astresDe(S.id).filter(function (a) { return !a.satellite; });
        L.forEach(function (a, i) {
          var ro = S.R * (0.22 + 0.78 * i / Math.max(1, L.length - 1));
          var w = 0.16 / Math.pow(i + 1, 0.75);
          var ang = hash3(i, 11, a.id.length) * Math.PI * 2 + etat.t * w;
          var r = base() * ((FORME[a.id] || {}).t || 1);
          var p = { a: a, s: S, x: S.c[0] + Math.cos(ang) * ro, y: S.c[1] + Math.sin(ang) * ro, r: r, ro: ro };
          out.push(p);
          if ((FORME[a.id] || {}).lune && lune()) {
            var la = etat.t * 0.9, lr = r * 2.6;
            out.push({ a: lune(), s: S, x: p.x + Math.cos(la) * lr, y: p.y + Math.sin(la) * lr, r: base() * 0.3, ro: 0, autour: p });
          }
        });
      });
      return out;
    }

    // ---------- L'etoile ----------
    function etoile(cx, cy, r, t, stel) {
      var c1 = stel ? [200, 170, 255] : [255, 230, 150], c2 = stel ? [130, 80, 255] : [255, 150, 40];
      x.save();
      x.globalCompositeOperation = 'lighter';
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 7);
      g.addColorStop(0, 'rgba(' + c1.join(',') + ',.5)'); g.addColorStop(0.2, 'rgba(' + c2.join(',') + ',.2)');
      g.addColorStop(1, 'rgba(' + c2.join(',') + ',0)');
      x.fillStyle = g; x.fillRect(cx - r * 7, cy - r * 7, r * 14, r * 14);
      // La couronne : des jets qui palpitent.
      for (var i = 0; i < 36; i++) {
        var a = i / 36 * Math.PI * 2 + t * 0.05, l = r * (1.3 + 0.5 * bruit3(i * 0.7, t * 0.8, stel ? 7 : 3));
        var gr = x.createLinearGradient(cx, cy, cx + Math.cos(a) * l, cy + Math.sin(a) * l);
        gr.addColorStop(0, 'rgba(' + c1.join(',') + ',.35)'); gr.addColorStop(1, 'rgba(' + c2.join(',') + ',0)');
        x.strokeStyle = gr; x.lineWidth = r * 0.22;
        x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke();
      }
      x.restore();
      var gc = x.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r);
      gc.addColorStop(0, '#fff'); gc.addColorStop(0.45, 'rgb(' + c1.join(',') + ')'); gc.addColorStop(1, 'rgb(' + c2.join(',') + ')');
      x.fillStyle = gc;
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
      // Le grain de la surface, qui bouillonne.
      x.save();
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
      x.globalCompositeOperation = 'overlay';
      for (i = 0; i < 40; i++) {
        var px = cx + (hash3(i, 1, 4) - 0.5) * r * 1.8, py = cy + (hash3(i, 2, 4) - 0.5) * r * 1.8;
        var pr = r * (0.12 + bruit3(i, t * 0.6, 2) * 0.18);
        x.fillStyle = 'rgba(' + (stel ? '255,240,255' : '255,255,200') + ',' + (0.25 * bruit3(i, t, 8)).toFixed(3) + ')';
        x.beginPath(); x.arc(px, py, pr, 0, Math.PI * 2); x.fill();
      }
      x.restore();
    }

    // ---------- Un monde, petit ----------
    function monde(p, eclaire) {
      var a = p.a, F = FORME[a.id] || {}, S = Math.max(8, Math.round(p.r * 2 * DPR));
      var k = a.id + S;
      var cx = p.s.c[0], cy = p.s.c[1];
      var dx = cx - p.x, dy = cy - p.y, dl = Math.sqrt(dx * dx + dy * dy) || 1;
      var rot = etat.t * 0.25 + a.id.length;
      // On ne recalcule la sphere que de temps en temps : elle tourne lentement.
      if (!SPH[k] || etat.t - SPH[k].t > 0.12) SPH[k] = { c: sphere(SPH[k] ? SPH[k].c : toile(S, S), a, rot, dx / dl, dy / dl), t: etat.t };
      if (F.anneaux) anneaux(p, false);
      x.drawImage(SPH[k].c, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      if (F.atmo) {
        var g = x.createRadialGradient(p.x, p.y, p.r * 0.92, p.x, p.y, p.r * 1.35);
        g.addColorStop(0, F.atmo + '66'); g.addColorStop(1, F.atmo + '00');
        x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.r * 1.35, 0, Math.PI * 2); x.fill();
      }
      if (F.anneaux) anneaux(p, true);
      if (eclaire) {
        x.strokeStyle = 'rgba(120,230,255,.9)'; x.lineWidth = 1.5;
        x.setLineDash([4, 4]); x.lineDashOffset = -etat.t * 20;
        x.beginPath(); x.arc(p.x, p.y, p.r * 1.7 + 4, 0, Math.PI * 2); x.stroke();
        x.setLineDash([]);
        x.fillStyle = '#d8f6ff'; x.font = '600 ' + Math.max(11, Math.round(base() * 0.6)) + 'px "Segoe UI", sans-serif';
        x.textAlign = 'center';
        x.fillText(a.nom.toUpperCase() + '  ·  ' + a.code, p.x, p.y - p.r * 1.7 - 10);
      }
    }
    // Les anneaux de Saturne : la moitie de derriere, puis celle de devant.
    function anneaux(p, devant) {
      x.save();
      x.translate(p.x, p.y); x.rotate(-0.35); x.scale(1, 0.32);
      x.beginPath();
      if (devant) x.rect(-p.r * 3, 0, p.r * 6, p.r * 3); else x.rect(-p.r * 3, -p.r * 3, p.r * 6, p.r * 3);
      x.clip();
      for (var i = 0; i < 6; i++) {
        x.strokeStyle = 'rgba(' + [230, 210, 160].join(',') + ',' + (0.18 + (i % 2) * 0.2).toFixed(2) + ')';
        x.lineWidth = p.r * 0.14;
        x.beginPath(); x.arc(0, 0, p.r * (1.45 + i * 0.16), 0, Math.PI * 2); x.stroke();
      }
      x.restore();
    }

    // Le trou de ver : le passage que le docteur a ouvert, entre les deux
    // systemes. Un coeur noir, l'anneau de lumiere courbee autour, le
    // disque de matiere qui tourne en spirale (et dont l'image passe
    // par-dessus le coeur), et deux courants qui s'y engouffrent : l'un
    // part du Soleil, l'autre sort vers l'Etoile qui boit.
    function trouDeVer(Pos) {
      var so = sysDe('solaire'), st = sysDe('stellaire');
      if (!so || !st) return;
      var V = vortex(), R = V.r, cx = V.x, cy = V.y, t = etat.t;
      x.save();
      x.globalCompositeOperation = 'lighter';
      // Les deux courants : des grains qui filent sur une courbe et
      // tournoient en arrivant.
      [[so.c[0], so.c[1], 1, [255, 210, 130]], [st.c[0], st.c[1], -1, [200, 140, 255]]].forEach(function (c, j) {
        var ax = c[0], ay = c[1];
        var mx = (ax + cx) / 2, my = Math.min(ay, cy) - H * 0.12;
        for (var i = 0; i < 70; i++) {
          var k = ((t * 0.18 * c[2] + i / 70) % 1 + 1) % 1;
          if (c[2] < 0) k = 1 - k;
          var q = 1 - k, px = q * q * ax + 2 * q * k * mx + k * k * cx, py = q * q * ay + 2 * q * k * my + k * k * cy;
          // Pres du coeur, le grain s'enroule.
          var proche = Math.max(0, k - 0.8) / 0.2, an = t * 2.4 + i * 0.7;
          px += Math.cos(an) * R * 2.2 * proche * (1 - proche);
          py += Math.sin(an) * R * 0.7 * proche * (1 - proche);
          var a = (0.15 + 0.5 * Math.sin(Math.PI * k)) * (0.6 + hash3(i, j, 3) * 0.4), r = 1 + hash3(i, j, 4) * 1.6;
          x.fillStyle = 'rgba(' + c[3].join(',') + ',' + a.toFixed(2) + ')';
          x.fillRect(px - r / 2, py - r / 2, r, r);
        }
      });
      // Le disque, moitie arriere : on le voit derriere le coeur.
      disque(cx, cy, R, t, false);
      x.restore();
      // Le coeur noir, et la lumiere qu'il courbe.
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25);
      g.addColorStop(0, '#000'); g.addColorStop(0.78, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R * 1.25, 0, Math.PI * 2); x.fill();
      x.save();
      x.globalCompositeOperation = 'lighter';
      // L'anneau de photons : fin, presque blanc, qui palpite.
      var f = 0.75 + 0.25 * Math.sin(t * 3);
      [[R * 1.02, 2.4, 'rgba(255,245,255,' + (0.85 * f).toFixed(2) + ')'], [R * 1.08, 6, 'rgba(180,140,255,' + (0.35 * f).toFixed(2) + ')'],
       [R * 1.16, 10, 'rgba(110,200,255,.14)']].forEach(function (a) {
        x.strokeStyle = a[2]; x.lineWidth = a[1];
        x.beginPath(); x.arc(cx, cy, a[0], 0, Math.PI * 2); x.stroke();
      });
      // L'image du disque, courbee par-dessus et par-dessous le coeur.
      [[-1, 0.55], [1, 0.25]].forEach(function (s) {
        var gl = x.createLinearGradient(cx - R * 1.6, 0, cx + R * 1.6, 0);
        gl.addColorStop(0, 'rgba(200,140,255,0)'); gl.addColorStop(0.5, 'rgba(255,230,255,' + s[1] + ')'); gl.addColorStop(1, 'rgba(120,220,255,0)');
        x.strokeStyle = gl; x.lineWidth = R * 0.18;
        x.beginPath(); x.ellipse(cx, cy, R * 1.45, R * 1.3, 0, s[0] < 0 ? Math.PI * 1.08 : Math.PI * 0.08, s[0] < 0 ? Math.PI * 1.92 : Math.PI * 0.92); x.stroke();
      });
      // Le disque, moitie avant : il passe devant le coeur.
      disque(cx, cy, R, t, true);
      // La lueur qui baigne tout autour.
      var hl = x.createRadialGradient(cx, cy, R, cx, cy, R * 5);
      hl.addColorStop(0, 'rgba(160,110,255,.18)'); hl.addColorStop(1, 'rgba(60,40,160,0)');
      x.fillStyle = hl; x.fillRect(cx - R * 5, cy - R * 5, R * 10, R * 10);
      x.restore();
      if (etat.survol === 'trou-de-ver') anneauSurvol(cx, cy, R * 3.4, 'TROU DE VER');
      x.fillStyle = 'rgba(210,180,255,.6)'; x.font = '600 ' + Math.max(10, Math.round(base() * 0.45)) + 'px "Segoe UI", sans-serif';
      x.textAlign = 'center';
      x.fillText('TROU DE VER', cx, cy + R * 3.2);
    }

    // Le disque de matiere : des centaines de grains sur des orbites
    // ellipsoidales, plus chauds et plus rapides vers le coeur.
    function disque(cx, cy, R, t, devant) {
      for (var i = 0; i < 420; i++) {
        var k = hash3(i, 1, 77), rr = R * (1.25 + Math.pow(k, 1.6) * 2.6);
        var w = 1.6 / Math.pow(rr / R, 1.5);
        var a = hash3(i, 2, 77) * Math.PI * 2 + t * w;
        var sn = Math.sin(a);
        if ((sn > 0) !== devant) continue;
        var px = cx + Math.cos(a) * rr, py = cy + sn * rr * 0.26;
        var chaud = 1 - k;
        var c = chaud > 0.7 ? [255, 240, 255] : chaud > 0.4 ? [210, 160, 255] : [120, 190, 255];
        var al = (0.25 + chaud * 0.6) * (devant ? 1 : 0.7);
        var s = 1 + chaud * 1.8;
        x.fillStyle = 'rgba(' + c.join(',') + ',' + al.toFixed(2) + ')';
        x.fillRect(px - s / 2, py - s / 2, s * 2.2, s);
      }
    }

    // Ou se tient le trou de ver : entre les deux systemes.
    function vortex() {
      return { x: W * 0.5, y: H * 0.5, r: Math.min(W, H) * 0.028 };
    }

    // L'anneau en pointilles d'un objet survole, et son nom.
    function anneauSurvol(cx, cy, r, nom) {
      x.strokeStyle = 'rgba(120,230,255,.9)'; x.lineWidth = 1.5;
      x.setLineDash([4, 4]); x.lineDashOffset = -etat.t * 20;
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
      x.setLineDash([]);
      x.fillStyle = '#d8f6ff'; x.font = '600 ' + Math.max(11, Math.round(base() * 0.6)) + 'px "Segoe UI", sans-serif';
      x.textAlign = 'center';
      x.fillText(nom, cx, cy - r - 10);
    }

    // ---------- Les deux systemes ----------
    var POS = [];
    function dessinerSysteme(zoom) {
      // L'approche : on vient du fond de l'espace. Le fond grossit a peine,
      // les systemes, eux, viennent de tres loin.
      // Vite au depart, puis on freine en arrivant.
      var k = etat.intro, e = k < 1 ? 1 - Math.pow(1 - k, 2.4) : 1;
      var sApp = Math.exp(Math.log(0.05) * (1 - e));
      x.save();
      x.translate(W / 2, H / 2); x.scale(1 + (1 - e) * 0.12, 1 + (1 - e) * 0.12); x.translate(-W / 2, -H / 2);
      x.drawImage(fond(), 0, 0, W, H);
      x.restore();
      if (k < 1) {
        // Les etoiles qui filent pendant l'approche.
        var vit = Math.sin(Math.PI * Math.min(1, k * 1.25));
        x.save();
        x.globalCompositeOperation = 'lighter';
        for (var i = 0; i < 120; i++) {
          var a = hash3(i, 3, 9) * Math.PI * 2, d0 = (0.08 + hash3(i, 4, 9)) * Math.max(W, H) * 0.6;
          var l = vit * (30 + 220 * hash3(i, 5, 9));
          var x0 = W / 2 + Math.cos(a) * d0, y0 = H / 2 + Math.sin(a) * d0;
          x.strokeStyle = 'rgba(200,230,255,' + (vit * 0.55).toFixed(2) + ')'; x.lineWidth = 1 + vit;
          x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); x.stroke();
        }
        x.restore();
      }
      x.save();
      x.translate(W / 2, H / 2); x.scale(sApp, sApp); x.translate(-W / 2, -H / 2);
      if (zoom) { x.translate(zoom.x, zoom.y); x.scale(zoom.s, zoom.s); x.translate(-zoom.fx, -zoom.fy); }
      POS = positions();
      var D = disposition();
      trouDeVer(POS);
      // Les orbites, bien rondes.
      POS.forEach(function (p) {
        if (!p.ro) return;
        var sel = etat.survol === p.a.id || (etat.choisi && etat.choisi.id === p.a.id);
        x.strokeStyle = sel ? 'rgba(120,230,255,.55)' : 'rgba(140,190,255,.16)';
        x.lineWidth = (sel ? 1.6 : 1) / sApp;
        x.beginPath(); x.arc(p.s.c[0], p.s.c[1], p.ro, 0, Math.PI * 2); x.stroke();
      });
      D.forEach(function (S) {
        etoile(S.c[0], S.c[1], base() * 2.1, etat.t, S.id === 'stellaire');
        var E = ETOILES[S.id];
        if (E && !zoom && etat.intro >= 1 && (etat.survol === E.id || (etat.choisi && etat.choisi.id === E.id))) {
          anneauSurvol(S.c[0], S.c[1], base() * 3.2, E.nom.toUpperCase() + '  ·  ' + E.code);
        }
        // Vu de loin, le systeme n'est qu'un point : on garde une lueur
        // de taille constante pour qu'on le voie arriver.
        if (sApp < 0.6) {
          var r = 18 / sApp, al = (0.6 - sApp) / 0.6;
          var g = x.createRadialGradient(S.c[0], S.c[1], 0, S.c[0], S.c[1], r);
          g.addColorStop(0, S.id === 'stellaire' ? 'rgba(210,180,255,' + al + ')' : 'rgba(255,230,160,' + al + ')');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          x.save(); x.globalCompositeOperation = 'lighter';
          x.fillStyle = g; x.fillRect(S.c[0] - r, S.c[1] - r, r * 2, r * 2);
          x.restore();
        }
      });
      POS.forEach(function (p) {
        monde(p, !zoom && etat.intro >= 1 && (etat.survol === p.a.id || (etat.choisi && etat.choisi.id === p.a.id)));
      });
      x.restore();
      // Le nom de chaque systeme, sous lui (a l'ecran, a taille fixe).
      D.forEach(function (S) {
        var sx = W / 2 + (S.c[0] - W / 2) * sApp, sy = H / 2 + (S.c[1] + S.R + base() * 1.2 - H / 2) * sApp;
        if (zoom || sApp < 0.55) return;
        var al = Math.min(1, (sApp - 0.55) / 0.3) * 0.85;
        x.fillStyle = S.id === 'stellaire' ? 'rgba(210,180,255,' + al.toFixed(2) + ')' : 'rgba(255,225,160,' + al.toFixed(2) + ')';
        x.font = '700 ' + Math.max(11, Math.round(Math.min(W, H) * 0.02)) + 'px "Segoe UI", sans-serif';
        x.textAlign = 'center';
        x.fillText(S.nom.toUpperCase() + '  ·  ' + S.prefixe, sx, Math.min(H - 34, sy + 14));
      });
    }

    // ---------- Le voyage, puis le monde en grand ----------
    var GRAND = toile(10, 10);
    function dessinerPlanete(k) {
      var a = etat.choisi, F = FORME[a.id] || {};
      if (a === AILLEURS) { dessinerAilleurs(k); return; }
      x.drawImage(fond(), 0, 0, W, H);
      var R = Math.min(W, H) * 0.3 * (0.35 + 0.65 * k), cx = W / 2, cy = H * 0.54;
      if (a.etoile) {
        etoile(cx, cy, R * 0.82, etat.t, a.systeme === 'stellaire');
        lieuxSur(cx, cy, R);
        return;
      }
      var S = Math.round(Math.min(420, R * 2 * DPR));
      if (GRAND.width !== S) { GRAND.width = S; GRAND.height = S; }
      if (!etat.derniere || etat.t - etat.derniere > 0.05) {
        sphere(GRAND, a, etat.t * 0.05 + 1.2, -0.85, -0.45);
        etat.derniere = etat.t;
      }
      // La lueur de l'etoile, derriere a gauche.
      var gl = x.createRadialGradient(cx - R * 1.4, cy - R * 1.1, 0, cx - R * 1.4, cy - R * 1.1, R * 3);
      gl.addColorStop(0, a.systeme === 'stellaire' ? 'rgba(170,130,255,.25)' : 'rgba(255,210,140,.25)');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gl; x.fillRect(0, 0, W, H);
      var p = { x: cx, y: cy, r: R, a: a };
      if (F.anneaux) anneaux(p, false);
      x.drawImage(GRAND, cx - R, cy - R, R * 2, R * 2);
      if (F.atmo) {
        var g = x.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.18);
        g.addColorStop(0, F.atmo + '55'); g.addColorStop(1, F.atmo + '00');
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R * 1.18, 0, Math.PI * 2); x.fill();
      }
      if (F.anneaux) anneaux(p, true);
      // Le balayage du Telescope sur la surface.
      if (k >= 1) {
        x.save();
        x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip();
        var sy = cy - R + ((etat.t * 0.5) % 1) * R * 2;
        var gs = x.createLinearGradient(0, sy - 20, 0, sy + 4);
        gs.addColorStop(0, 'rgba(120,240,255,0)'); gs.addColorStop(1, 'rgba(120,240,255,.25)');
        x.fillStyle = gs; x.fillRect(cx - R, sy - 20, R * 2, 24);
        x.restore();
      }
      lieuxSur(cx, cy, R);
    }

    // Les lieux : un point sur la surface, relie a sa fiche.
    function lieuxSur(cx, cy, R) {
      etat.lieux.forEach(function (l) {
        if (!l.vu) return;
        var age = etat.t - l.vu, pulse = (age * 1.2) % 1;
        var mx = cx + l.u * R, my = cy + l.v * R;
        x.strokeStyle = 'rgba(120,240,255,' + (1 - pulse).toFixed(2) + ')'; x.lineWidth = 1.5;
        x.beginPath(); x.arc(mx, my, 4 + pulse * 14, 0, Math.PI * 2); x.stroke();
        x.fillStyle = '#9ff4ff'; x.beginPath(); x.arc(mx, my, 3.5, 0, Math.PI * 2); x.fill();
        if (l.carte) {
          var b = l.carte.getBoundingClientRect(), bb = box.getBoundingClientRect();
          var ax = (l.cote < 0 ? b.right : b.left) - bb.left, ay = b.top - bb.top + 18;
          var k2 = Math.min(1, age / 0.25);
          x.strokeStyle = 'rgba(120,240,255,.65)'; x.lineWidth = 1.2;
          x.beginPath(); x.moveTo(mx, my);
          var ex = mx + (ax - mx) * k2, ey = my + (ay - my) * k2;
          x.lineTo(ex, my + (ey - my) * 0.0); x.lineTo(ex, ey); x.stroke();
        }
      });
    }

    function dessinerVoyage(u) {
      // Le Telescope plonge sur le monde : tout s'etire, puis le monde vient.
      if (u < 0.62) {
        var k = u / 0.62, e = k * k * k;
        var p = POS.filter(function (q) { return q.a.id === etat.choisi.id; })[0];
        if (!p && etat.choisi.etoile) { var Se = sysDe(etat.choisi.systeme); p = { x: Se.c[0], y: Se.c[1], r: base() * 2 }; }
        p = p || { x: W / 2, y: H / 2, r: 10 };
        var s = 1 + e * 22;
        dessinerSysteme({ x: W / 2 + (p.x - W / 2) * (1 - e), y: H / 2 + (p.y - H / 2) * (1 - e), s: s, fx: p.x, fy: p.y });
        // Les etoiles qui filent.
        x.save();
        x.globalCompositeOperation = 'lighter';
        for (var i = 0; i < 90; i++) {
          var a = hash3(i, 3, 3) * Math.PI * 2, d0 = hash3(i, 4, 4) * Math.max(W, H) * 0.7;
          var l = 20 + e * 260 * hash3(i, 5, 5);
          var x0 = W / 2 + Math.cos(a) * d0, y0 = H / 2 + Math.sin(a) * d0;
          x.strokeStyle = 'rgba(200,230,255,' + (0.15 + e * 0.6).toFixed(2) + ')'; x.lineWidth = 1 + e * 1.5;
          x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); x.stroke();
        }
        x.restore();
        if (k > 0.85) { x.fillStyle = 'rgba(220,245,255,' + ((k - 0.85) / 0.15).toFixed(2) + ')'; x.fillRect(0, 0, W, H); }
      } else {
        var k3 = Math.min(1, (u - 0.62) / 0.45);
        dessinerPlanete(1 - Math.pow(1 - k3, 3));
        x.fillStyle = 'rgba(220,245,255,' + Math.max(0, 1 - k3 * 2.5).toFixed(2) + ')'; x.fillRect(0, 0, W, H);
      }
    }

    // ---------- Le trou de ver : la traversee, et ce qu'il y a derriere ----------
    // On plonge dans le coeur noir ; un tunnel d'anneaux de lumiere file
    // autour de nous en tournoyant ; un eclair blanc, et l'on debouche
    // dans un autre espace : celui de la planete aux failles, ou se
    // tient Azhrakonr.
    var TRAVERSEE = reduit ? 0.5 : 3.2, musique = false;
    var imMains = new Image(); imMains.src = 'assets/items/azhrakonr-mains.webp';
    var imEmbleme = new Image(); imEmbleme.src = 'assets/items/localext.webp';
    // Son illustration s'arrete net en bas : on la fond dans l'espace.
    var mainsFondues = null;
    function mains() {
      if (mainsFondues || !imMains.complete || !imMains.naturalWidth) return mainsFondues;
      var c = toile(1024, 683), f = c.getContext('2d');
      f.drawImage(imMains, 0, 0, 1024, 683);
      f.globalCompositeOperation = 'destination-in';
      var g = f.createLinearGradient(0, 0, 0, 683);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.72, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = g; f.fillRect(0, 0, 1024, 683);
      mainsFondues = c;
      return c;
    }

    function traverser() {
      fermerPanneau();
      etat.mode = 'faille'; etat.voyage = 0; etat.survol = null;
      cv.style.cursor = '';
      box.classList.add('is-voyage');
      woosh();
      setTimeout(woosh, 1100);
      grondement(TRAVERSEE);
      texturePlanete();
      var S = window.AZHRAKONR_SON;
      if (S && S.pret()) { S.voyageDebut('lieu'); musique = true; }
    }

    // Un grondement qui enfle pendant la traversee, puis un coup sourd.
    function grondement(d) {
      var a = audio(); if (!a) return;
      var t = a.currentTime, o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(40, t); o.frequency.exponentialRampToValueAtTime(90, t + d * 0.8);
      o2.type = 'sawtooth'; o2.frequency.setValueAtTime(40.6, t); o2.frequency.exponentialRampToValueAtTime(91, t + d * 0.8);
      f.type = 'lowpass'; f.frequency.setValueAtTime(120, t); f.frequency.exponentialRampToValueAtTime(900, t + d * 0.8);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + d * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(f); o2.connect(f); f.connect(g); g.connect(a.destination);
      o.start(t); o2.start(t); o.stop(t + d + 0.05); o2.stop(t + d + 0.05);
      var b = a.createOscillator(), gb = a.createGain();
      b.type = 'sine'; b.frequency.setValueAtTime(70, t + d * 0.86); b.frequency.exponentialRampToValueAtTime(28, t + d * 0.86 + 1.2);
      gb.gain.setValueAtTime(0.0001, t + d * 0.86); gb.gain.exponentialRampToValueAtTime(0.4, t + d * 0.86 + 0.02); gb.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.86 + 1.4);
      b.connect(gb); gb.connect(a.destination); b.start(t + d * 0.86); b.stop(t + d * 0.86 + 1.5);
    }

    function dessinerTraversee(u) {
      var V = vortex();
      if (u < 1) {
        // On fonce dans le coeur : il grossit jusqu'a tout avaler.
        var e = u * u * u, zs = 1 + e * 12;
        dessinerSysteme({ x: W / 2 + (V.x - W / 2) * (1 - e), y: H / 2 + (V.y - H / 2) * (1 - e), s: zs, fx: V.x, fy: V.y });
        // Puis son noir s'ouvre et avale tout l'ecran.
        var rn = V.r * zs * 1.1 + Math.max(W, H) * lisse(Math.max(0, (u - 0.45) / 0.55));
        var gn = x.createRadialGradient(W / 2, H / 2, rn * 0.7, W / 2, H / 2, rn);
        gn.addColorStop(0, '#000'); gn.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gn; x.fillRect(0, 0, W, H);
      } else {
        tunnel(u - 1);
      }
      // L'eclair de la sortie, puis l'autre espace dessous.
      var fin = TRAVERSEE - 0.55;
      if (u > fin - 0.15) {
        if (u > fin) dessinerAilleurs(1);
        var f = u < fin ? (u - (fin - 0.15)) / 0.15 : 1 - (u - fin) / 0.55;
        x.fillStyle = 'rgba(245,235,255,' + Math.max(0, Math.min(1, f)).toFixed(3) + ')';
        x.fillRect(0, 0, W, H);
      }
    }

    function tunnel(v) {
      var cx = W / 2, cy = H / 2, t = etat.t, M = Math.max(W, H);
      x.fillStyle = '#020006'; x.fillRect(0, 0, W, H);
      x.save();
      x.globalCompositeOperation = 'lighter';
      var avance = v * (1.2 + v * 0.9);           // on accelere
      // La lumiere au bout, qui grandit.
      var bout = M * (0.03 + 0.5 * Math.pow(Math.min(1, v / 1.9), 3));
      var gb = x.createRadialGradient(cx, cy, 0, cx, cy, bout * 3);
      gb.addColorStop(0, 'rgba(255,250,255,.95)'); gb.addColorStop(0.25, 'rgba(210,160,255,.45)'); gb.addColorStop(1, 'rgba(120,60,220,0)');
      x.fillStyle = gb; x.fillRect(cx - bout * 3, cy - bout * 3, bout * 6, bout * 6);
      // Les anneaux : ils viennent du fond, grossissent et passent sur nous.
      var N = 30;
      for (var i = 0; i < N; i++) {
        var z = ((i / N - avance * 0.55) % 1 + 1) % 1;
        var zz = 0.035 + z * 1.4, r = M * 0.09 / zz;
        if (r > M * 1.6) continue;
        var ang = t * 0.8 + i * 0.5;
        var ox = Math.cos(t * 1.3 + i * 0.4) * M * 0.05 * z, oy = Math.sin(t * 1.1 + i * 0.3) * M * 0.04 * z;
        var col = i % 3 === 0 ? '120,220,255' : i % 3 === 1 ? '190,130,255' : '255,110,220';
        var a = Math.min(1, z * 5) * Math.min(1, (1 - z) * 1.5);
        x.strokeStyle = 'rgba(' + col + ',' + (a * 0.65).toFixed(3) + ')';
        x.lineWidth = Math.max(1, 2.2 / zz);
        x.beginPath(); x.ellipse(cx + ox, cy + oy, r, r * 0.9, ang * 0.25, 0, Math.PI * 2); x.stroke();
      }
      // Les grains qui filent le long des parois, en spirale.
      for (var j = 0; j < 260; j++) {
        var zp = ((hash3(j, 1, 31) - avance * (0.6 + hash3(j, 2, 31) * 0.5)) % 1 + 1) % 1;
        var zq = 0.03 + zp * 1.3, rp = M * 0.1 / zq;
        if (rp > M) continue;
        var ap = hash3(j, 3, 31) * Math.PI * 2 + t * 1.6 + zp * 4;
        var l = rp * 0.18 * (0.5 + v);
        var x0 = cx + Math.cos(ap) * rp, y0 = cy + Math.sin(ap) * rp * 0.9;
        var al = Math.min(1, zp * 4) * Math.min(1, (1 - zp) * 2) * 0.8;
        x.strokeStyle = j % 4 ? 'rgba(200,170,255,' + al.toFixed(2) + ')' : 'rgba(140,230,255,' + al.toFixed(2) + ')';
        x.lineWidth = 1 + 1.5 * (1 - zp);
        x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(ap) * l, y0 + Math.sin(ap) * l * 0.9); x.stroke();
      }
      x.restore();
      // Les bords de l'image s'assombrissent : on est dedans.
      var vg = x.createRadialGradient(cx, cy, M * 0.25, cx, cy, M * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)');
      x.fillStyle = vg; x.fillRect(0, 0, W, H);
    }

    // Le ciel d'ailleurs : plus sombre, des nebuleuses magenta et violettes.
    var FONDS_A = {};
    function fondAilleurs() {
      var k = W + 'x' + H;
      if (FONDS_A[k]) return FONDS_A[k];
      var c = toile(Math.round(W * DPR), Math.round(H * DPR)), f = c.getContext('2d');
      f.scale(DPR, DPR);
      f.fillStyle = '#040109'; f.fillRect(0, 0, W, H);
      [[0.18, 0.3, [200, 50, 200]], [0.82, 0.25, [110, 60, 255]], [0.5, 0.1, [214, 92, 255]], [0.3, 0.85, [60, 80, 220]],
       [0.75, 0.8, [170, 40, 140]], [0.55, 0.5, [80, 30, 160]]].forEach(function (n, i) {
        var cx = n[0] * W, cy = n[1] * H, r = (0.3 + hash3(i, 3, 17) * 0.3) * Math.max(W, H);
        var g = f.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(' + n[2].join(',') + ',.2)'); g.addColorStop(1, 'rgba(' + n[2].join(',') + ',0)');
        f.fillStyle = g; f.fillRect(0, 0, W, H);
      });
      for (var i = 0; i < 700; i++) {
        var b = hash3(i, 9, 17), s = b > 0.97 ? 2 : b > 0.85 ? 1.4 : 0.9;
        f.fillStyle = 'rgba(' + (210 + b * 45) + ',' + (190 + b * 50) + ',255,' + (0.2 + b * 0.7).toFixed(2) + ')';
        f.fillRect(hash3(i, 7, 17) * W, hash3(i, 8, 17) * H, s, s);
      }
      FONDS_A[k] = c;
      return c;
    }

    // La planete : une sphere sombre, grenue, criblee de crateres,
    // eclairee d'en haut a gauche ; et ses failles, peintes a part.
    var PLA = null;
    function texturePlanete() {
      if (PLA) return PLA;
      var S = 300, c = toile(S, S), f = c.getContext('2d'), im = f.createImageData(S, S), d = im.data;
      for (var j = 0; j < S; j++) for (var i = 0; i < S; i++) {
        var nx = (i + 0.5) / S * 2 - 1, ny = (j + 0.5) / S * 2 - 1, q = nx * nx + ny * ny;
        if (q > 1) continue;
        var nz = Math.sqrt(1 - q);
        var n = fbm3(nx * 3 + 7, ny * 3, nz * 3);
        var cr = bruit3(nx * 9, ny * 9, nz * 9 + 3);
        var lum = 0.18 + 0.95 * Math.max(0, -0.55 * nx - 0.45 * ny + 0.7 * nz);
        var r = (26 + n * 30) * lum, g = (12 + n * 14) * lum, b = (44 + n * 40) * lum;
        if (cr > 0.72) { r *= 0.55; g *= 0.55; b *= 0.65; }
        var o = (j * S + i) * 4;
        d[o] = Math.min(255, r); d[o + 1] = Math.min(255, g); d[o + 2] = Math.min(255, b);
        d[o + 3] = q > 0.985 ? Math.round((1 - q) / 0.015 * 255) : 255;
      }
      f.putImageData(im, 0, 0);
      // Les failles : des lignes brisees qui partent du pied de la balise.
      var failles = [];
      for (var k = 0; k < 7; k++) {
        var pts = [[0, -0.96]], ang = Math.PI * (0.18 + k / 6 * 0.64) + (hash3(k, 1, 23) - 0.5) * 0.3, px = 0, py = -0.96;
        for (var m = 0; m < 9; m++) {
          px += Math.cos(ang) * (0.07 + hash3(k, m, 24) * 0.06);
          py += Math.sin(ang) * (0.06 + hash3(k, m, 25) * 0.05);
          ang += (hash3(k, m, 26) - 0.5) * 0.8;
          if (px * px + py * py > 0.95) break;
          pts.push([px, py]);
        }
        failles.push(pts);
      }
      PLA = { c: c, failles: failles };
      return PLA;
    }

    function dessinerAilleurs(k) {
      var t = etat.t, P = texturePlanete();
      x.drawImage(fondAilleurs(), 0, 0, W, H);
      var lui = !DP.has('azhrakonr');
      var R = Math.min(W, H) * (lui ? 0.17 : 0.24) * (0.4 + 0.6 * k), cx = W / 2, cy = H * (lui ? 0.6 : 0.55);
      // Azhrakonr, immense, derriere : la planete repose entre ses mains.
      if (lui && mains()) {
        var souffle = Math.sin(t * 0.7);
        var sc = (2 * R * 1.9) / 680 * (1 + souffle * 0.01);
        var iw = 1024 * sc, ih = 683 * sc;
        x.save();
        x.globalAlpha = Math.min(1, k * 1.5);
        x.drawImage(mains(), cx - 512 * sc, cy + R * 0.55 - 545 * sc + souffle * R * 0.03, iw, ih);
        x.restore();
        // Son regard : une lueur qui palpite sous le casque.
        var ey = cy + R * 0.55 - 545 * sc + 330 * sc, pe = 0.5 + 0.5 * Math.sin(t * 2.1);
        var ge = x.createRadialGradient(cx, ey, 0, cx, ey, R * 0.6);
        ge.addColorStop(0, 'rgba(120,200,255,' + (0.25 + pe * 0.25).toFixed(2) + ')'); ge.addColorStop(1, 'rgba(60,120,255,0)');
        x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = ge; x.fillRect(cx - R, ey - R, R * 2, R * 2); x.restore();
      }
      // L'atmosphere : un halo violet.
      var ga = x.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.3);
      ga.addColorStop(0, 'rgba(150,100,255,.45)'); ga.addColorStop(1, 'rgba(150,100,255,0)');
      x.fillStyle = ga; x.beginPath(); x.arc(cx, cy, R * 1.3, 0, Math.PI * 2); x.fill();
      x.drawImage(P.c, cx - R, cy - R, R * 2, R * 2);
      x.strokeStyle = 'rgba(190,150,255,.8)'; x.lineWidth = Math.max(1, R * 0.012);
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
      // Les failles respirent.
      var pouls = reduit ? 0.8 : 0.55 + 0.4 * Math.sin(t * 2.3);
      x.save();
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip();
      x.globalCompositeOperation = 'lighter';
      x.shadowColor = 'rgba(214,92,255,1)'; x.shadowBlur = R * 0.08;
      x.strokeStyle = 'rgba(230,110,255,' + pouls.toFixed(2) + ')';
      x.lineWidth = Math.max(1, R * 0.014); x.lineJoin = 'round';
      P.failles.forEach(function (pts) {
        x.beginPath();
        pts.forEach(function (p, i) { if (i) x.lineTo(cx + p[0] * R, cy + p[1] * R); else x.moveTo(cx + p[0] * R, cy + p[1] * R); });
        x.stroke();
      });
      x.restore();
      // La balise, plantee au sommet : sa colonne de lumiere, ses ondes,
      // et l'embleme.
      var bx = cx, by = cy - R * 0.96;
      var col = x.createLinearGradient(0, by - H, 0, by);
      col.addColorStop(0, 'rgba(220,200,255,0)'); col.addColorStop(1, 'rgba(230,210,255,' + (0.25 + 0.1 * Math.sin(t * 3)).toFixed(2) + ')');
      x.fillStyle = col; x.fillRect(bx - R * 0.04, by - H, R * 0.08, H); x.fillRect(bx - R * 0.012, by - H, R * 0.024, H);
      for (var o = 0; o < 3; o++) {
        var ph = reduit ? o / 3 : ((t * 0.55) + o / 3) % 1;
        x.strokeStyle = 'rgba(220,190,255,' + (0.7 * (1 - ph)).toFixed(2) + ')'; x.lineWidth = 1.2;
        x.beginPath(); x.ellipse(bx, by, R * (0.04 + ph * 0.5), R * (0.04 + ph * 0.5) * 0.2, 0, 0, Math.PI * 2); x.stroke();
      }
      var hp = R * 0.26, wp = hp * 0.72;
      x.save();
      x.translate(bx, by);
      x.beginPath();
      x.moveTo(0, 0);
      x.bezierCurveTo(-wp * 0.15, -hp * 0.3, -wp * 0.5, -hp * 0.45, -wp * 0.5, -hp * 0.68);
      x.arc(0, -hp * 0.68, wp * 0.5, Math.PI, 0);
      x.bezierCurveTo(wp * 0.5, -hp * 0.45, wp * 0.15, -hp * 0.3, 0, 0);
      x.closePath();
      x.shadowColor = 'rgba(255,255,255,.8)'; x.shadowBlur = R * 0.06;
      x.fillStyle = '#ffffff'; x.fill();
      x.shadowBlur = 0;
      x.strokeStyle = '#151822'; x.lineWidth = Math.max(1, R * 0.008); x.stroke();
      if (imEmbleme.complete && imEmbleme.naturalWidth) {
        var ew = wp * 0.78, eh = ew * imEmbleme.naturalHeight / imEmbleme.naturalWidth;
        x.drawImage(imEmbleme, -ew / 2, -hp * 0.68 - eh / 2, ew, eh);
      }
      x.restore();
      lieuxSur(cx, cy, R);
    }

    // ---------- L'interface : la fiche, les lieux ----------
    var panneau = null, cartes = null, retourB = null;
    function fermerPanneau() { if (panneau) { panneau.remove(); panneau = null; } etat.choisi = etat.mode === 'systeme' ? null : etat.choisi; }

    function fiche(a) {
      fermerPanneau();
      etat.choisi = a;
      // La fiche s'ouvre du cote oppose au systeme du monde choisi.
      var p = el('div', 'tel-panneau' + (a.systeme === 'stellaire' ? ' tel-panneau--g' : ''));
      p.appendChild(el('span', 'tel-p-code', a.code + '  ·  ' + (a.systeme === 'stellaire' ? 'Système stellaire' : 'Système solaire')));
      p.appendChild(el('strong', 'tel-p-nom', a.nom));
      p.appendChild(el('span', 'tel-p-sous', a.sous || ''));
      var t = el('p', 'tel-p-texte');
      p.appendChild(t);
      var L = LIEUX[a.id] || [], ids = {};
      L.forEach(function (l) { l.dinders.forEach(function (d) { ids[d] = 1; }); });
      var n = Object.keys(ids).length;
      var vies = O && O.VIES ? O.VIES.filter(function (v) { return v.astre === a.id; }).length : 0;
      var lignes = a.etoile ? [
        ['Type', 'Étoile'],
        ['Mondes en orbite', String(O ? O.astresDe(a.systeme).filter(function (m) { return !m.satellite; }).length : 0)],
        ['Lieux repérés', String(L.length)],
        ['Dinders détectés', n ? String(n) : 'Aucun'],
        ['Statut', 'Hors de portée du Téléportail']] : null;
      (lignes || [['Orbite', a.satellite ? 'Satellite de la Terre' : 'n° ' + (a.ordre || a.rang)],
       ['Lieux repérés', String(L.length)],
       ['Dinders détectés', n ? String(n) : 'Aucun'],
       ['Formes de vie', vies ? vies + ' espèce' + (vies > 1 ? 's' : '') : 'Aucune'],
       ['Statut', DP.aVuAstre && DP.aVuAstre(a.id) ? 'Visité' : 'Jamais visité']]).forEach(function (r) {
        var l = el('div', 'tel-p-ligne');
        l.appendChild(el('span', null, r[0])); l.appendChild(el('strong', null, r[1]));
        p.appendChild(l);
      });
      var go = el('button', 'tel-go', 'GO !');
      go.type = 'button';
      go.addEventListener('click', function () { partir(a); });
      p.appendChild(go);
      var x_ = el('button', 'tel-fermer', '✕');
      x_.type = 'button';
      x_.setAttribute('aria-label', 'Fermer');
      x_.addEventListener('click', fermerPanneau);
      p.appendChild(x_);
      ui.appendChild(p);
      panneau = p;
      // Le texte s'ecrit, comme sur un terminal.
      var txt = a.texte || '', i = 0;
      (function ecrire() {
        if (!panneau || panneau !== p) return;
        i = Math.min(txt.length, i + 3);
        t.textContent = txt.slice(0, i);
        if (i < txt.length) setTimeout(ecrire, 16);
      })();
      bip(1200, 0.05);
    }

    function partir(a) {
      if (panneau) { panneau.remove(); panneau = null; }
      etat.mode = 'voyage'; etat.voyage = 0;
      box.classList.add('is-voyage');
      woosh();
    }

    function arriver() {
      etat.mode = 'planete';
      box.classList.remove('is-voyage');
      box.classList.add('is-planete');
      cartes = el('div', 'tel-lieux');
      ui.appendChild(cartes);
      retourB = el('button', 'tel-retour', '◀  Système');
      retourB.type = 'button';
      retourB.addEventListener('click', retourSysteme);
      ui.appendChild(retourB);
      var titre = el('div', 'tel-planete-titre');
      titre.appendChild(el('span', 'tel-p-code', etat.choisi.code));
      titre.appendChild(el('strong', null, etat.choisi.nom));
      cartes.appendChild(titre);
      var L = LIEUX[etat.choisi.id] || [];
      etat.lieux = L.map(function (l, i) {
        // Une place sur la face visible, et la fiche a gauche ou a droite.
        var ang = (i / Math.max(1, L.length)) * Math.PI * 2 + 0.6, rr = 0.35 + hash3(i, 2, etat.choisi.id.length) * 0.4;
        return { l: l, u: Math.cos(ang) * rr, v: Math.sin(ang) * rr * 0.85, cote: Math.cos(ang) < 0 ? -1 : 1, vu: 0, carte: null };
      });
      etat.lieux.forEach(function (o, i) {
        setTimeout(function () { if (etat.mode === 'planete') montrerLieu(o, i); }, (reduit ? 80 : 420) + i * (reduit ? 60 : 420));
      });
    }

    function montrerLieu(o, i) {
      o.vu = etat.t;
      var c = el('div', 'tel-lieu tel-lieu--' + (o.cote < 0 ? 'g' : 'd'));
      c.appendChild(el('span', 'tel-lieu-num', 'LOC-' + String(i + 1).padStart(2, '0') + '  ·  ' + (o.l.type || '')));
      c.appendChild(el('strong', 'tel-lieu-nom', o.l.nom));
      var rang = el('div', 'tel-lieu-dinders');
      if (!o.l.dinders.length) rang.appendChild(el('span', 'tel-lieu-vide', 'Aucun Dinder détecté'));
      o.l.dinders.forEach(function (id) {
        var d = DP.byId(id);
        if (!d) return;
        var connu = DP.has(id);
        var dd = el('span', 'tel-dinder' + (connu ? '' : ' is-inconnu'));
        var im = el('img');
        im.src = DP.dinderImg(id); im.alt = '';
        dd.appendChild(im);
        dd.appendChild(el('span', null, connu ? d.name : '???'));
        rang.appendChild(dd);
      });
      c.appendChild(rang);
      if (o.l.note) c.appendChild(el('p', 'tel-lieu-note', o.l.note));
      (o.cote < 0 ? colonne('g') : colonne('d')).appendChild(c);
      o.carte = c;
      bip(880 + i * 120, 0.06);
    }
    var COLS = {};
    function colonne(k) {
      if (COLS[k] && COLS[k].parentNode) return COLS[k];
      COLS[k] = el('div', 'tel-col tel-col--' + k);
      cartes.appendChild(COLS[k]);
      return COLS[k];
    }

    function retourSysteme() {
      if (musique && window.AZHRAKONR_SON) { window.AZHRAKONR_SON.voyageFin(1.5); musique = false; }
      etat.mode = 'systeme'; etat.lieux = []; etat.choisi = null;
      box.classList.remove('is-planete');
      if (cartes) { cartes.remove(); cartes = null; }
      if (retourB) { retourB.remove(); retourB = null; }
      COLS = {};
    }


    // ---------- Les clics et le survol ----------
    function sous(ev) {
      var b = cv.getBoundingClientRect(), mx = ev.clientX - b.left, my = ev.clientY - b.top, best = null;
      POS.forEach(function (p) {
        var d = Math.hypot(mx - p.x, my - p.y);
        if (d < Math.max(14, p.r * 1.6) && (!best || d < best.d)) best = { p: p, d: d };
      });
      if (best) return best.p;
      disposition().forEach(function (S) {
        var d = Math.hypot(mx - S.c[0], my - S.c[1]);
        if (ETOILES[S.id] && d < base() * 2.6) best = { p: { a: ETOILES[S.id], x: S.c[0], y: S.c[1], r: base() * 2.1, s: S } };
      });
      if (best) return best.p;
      // Le trou de ver, s'il est la.
      if (sysDe('stellaire')) {
        var V = vortex();
        if (Math.hypot(mx - V.x, my - V.y) < V.r * 3.2) return { a: TROU, x: V.x, y: V.y, r: V.r };
      }
      return null;
    }
    cv.addEventListener('pointermove', function (ev) {
      if (etat.mode !== 'systeme' || etat.intro < 1) return;
      var p = sous(ev);
      etat.survol = p ? p.a.id : null;
      cv.style.cursor = p ? 'pointer' : '';
    });
    cv.addEventListener('pointerdown', function (ev) {
      if (etat.mode !== 'systeme' || etat.intro < 1) return;
      var p = sous(ev);
      if (p && p.a === TROU) traverser();
      else if (p) fiche(p.a); else fermerPanneau();
    });

    // ---------- Le son : quelques bips d'instrument ----------
    var ac = null;
    function audio() {
      try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {}
      return ac;
    }
    function bip(f, d) {
      var a = audio(); if (!a) return;
      var t = a.currentTime, o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.02);
    }
    function woosh() {
      var a = audio(); if (!a) return;
      var t = a.currentTime, n = a.createBufferSource(), buf = a.createBuffer(1, a.sampleRate * 1.3, a.sampleRate), dd = buf.getChannelData(0);
      for (var i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
      n.buffer = buf;
      var f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3500, t + 0.65); f.frequency.exponentialRampToValueAtTime(400, t + 1.2);
      var g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
      n.connect(f); f.connect(g); g.connect(a.destination); n.start(t);
      var o = a.createOscillator(), go = a.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(40, t + 1);
      go.gain.setValueAtTime(0.0001, t + 0.55); go.gain.exponentialRampToValueAtTime(0.3, t + 0.65); go.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      o.connect(go); go.connect(a.destination); o.start(t); o.stop(t + 1.35);
    }

    // ---------- La boucle ----------
    var avant = 0, raf = 0;
    function image(ms) {
      if (!document.body.contains(box)) {
        window.removeEventListener('resize', taille);
        if (ac) try { ac.close(); } catch (e) {}
        if (musique && window.AZHRAKONR_SON) window.AZHRAKONR_SON.voyageFin(0.8);
        return;
      }
      var dt = avant ? Math.min(0.05, (ms - avant) / 1000) : 0;
      avant = ms;
      etat.t += dt;
      if (etat.intro < 1) etat.intro = Math.min(1, etat.intro + dt / 2.8);
      x.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (etat.mode === 'systeme') dessinerSysteme(null);
      else if (etat.mode === 'voyage') {
        etat.voyage += dt;
        dessinerVoyage(etat.voyage);
        if (etat.voyage >= 1.1) arriver();
      } else if (etat.mode === 'faille') {
        etat.voyage += dt;
        dessinerTraversee(etat.voyage);
        if (etat.voyage >= TRAVERSEE) { etat.choisi = AILLEURS; arriver(); }
      } else dessinerPlanete(1);
      raf = requestAnimationFrame(image);
    }
    raf = requestAnimationFrame(image);
    // Pour les essais.
    box._tel = { etat: etat, pos: function () { return POS; }, fiche: fiche, partir: partir };
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.telescope = { title: 'Télescope', render: viewTelescope };
  window.TELESCOPE = { LIEUX: LIEUX, deblocable: deblocable, verifier: verifier };
})();
