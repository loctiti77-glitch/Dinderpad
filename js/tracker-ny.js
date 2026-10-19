// La balise blanche de New York, sur le DinderTracker.
//
// Rien dessus, rien qui l'annonce : un symbole de localisation blanc,
// plante sur New York. Un clic, et la carte plonge sur la ville en cinq
// secondes ; au fond, une petite tablette attend un code. Le bon code
// fait reculer la camera — la ville, la Terre toute ronde, le systeme
// solaire — puis on file vers la droite, hors du systeme, jusqu'a une
// autre balise. Celle-la ne dit que « ??? ».
//
// Le recul est peint au pixel, sur une toile basse resolution agrandie
// sans lissage : la Terre est la carte meme du tracker, enroulee sur une
// sphere.
(function () {
  var DP = window.DP;
  if (!DP) return;

  var CODE = '12677234690';

  // Le code de la balise lointaine : quatre paires de chiffres, chacune
  // cachee dans un mini-jeu. La case de chaque paire prend la couleur de
  // son jeu.
  //   The Founder War : l'enigme de H, au jardin du niveau 6 (27) ;
  //   Fish n'Der : le poisson en papier, sous le ponton (43) ;
  //   The Odyssey : les pierres sous le nain mauve d'Altera (13) ;
  //   Wade and Friends : l'etiquette du carton, camera 07 (96).
  var AZH = [
    { jeu: 'The Founder War',       couleur: '#ff2a2a', img: 'assets/games/icones/founder-war.webp',      code: '27' },
    { jeu: 'Fish n’Der',            couleur: '#3cc8ff', img: 'assets/games/icones/fish-n-der.webp',       code: '43' },
    { jeu: 'The Odyssey of Dinder', couleur: '#7cf0c8', img: 'assets/games/icones/odyssey.webp',          code: '13' },
    { jeu: 'Wade and Friends',      couleur: '#f2c41c', img: 'assets/games/icones/wade-and-friends.webp', code: '96' }
  ];
  var CODE_AZH = AZH.map(function (p) { return p.code; }).join('');

  // Ce que dit le devoreur, une fois la planete entre ses mains.
  var DIALOGUE = [
    'Petite chose.',
    'Tu as suivi les codes, un par un, jusqu’au bout du ciel.',
    'Tu croyais trouver un secret. Tu as trouvé mon assiette.',
    'Je suis Azhrakonr. J’ai faim depuis avant vos étoiles.',
    'Ce monde-ci sera le premier.',
    'Le tien viendra après.'
  ];
  var NY = { lon: -74.006, lat: 40.713 };
  // New York sur la carte, en fractions de sa largeur et de sa hauteur :
  // la carte est equirectangulaire et remplit tout l'ecran du tracker.
  var NX = (NY.lon + 180) / 360, NYY = (90 - NY.lat) / 180;

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Les temps de la sequence, en millisecondes.
  var DUREE = reduit
    ? { zoom: 400, globe: 600, systeme: 600, cap: 700, glitch: 300, approche: 300 }
    : { zoom: 5000, globe: 6000, systeme: 6500, cap: 7000, glitch: 1900, approche: 2600 };
  var ZOOM = 9;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  // ==========================================================
  //  Les dessins au pixel
  // ==========================================================

  // Le symbole de localisation, en gros pixels : W blanc, X cerne.
  var PIN = [
    '...XXXXX...',
    '..XWWWWWX..',
    '.XWWWWWWWX.',
    'XWWWXXXWWWX',
    'XWWX...XWWX',
    'XWWX...XWWX',
    'XWWX...XWWX',
    'XWWWXXXWWWX',
    '.XWWWWWWWX.',
    '.XWWWWWWWX.',
    '..XWWWWWX..',
    '...XWWWX...',
    '....XWX....',
    '....XWX....',
    '.....X.....'
  ];
  // L'autre balise : plus grande, la tete ronde et pleine pour porter
  // l'embleme, une ombre grise sur le flanc droit (S).
  var PIN_EXT = [
    '.....XXXXX.....',
    '...XXWWWWWXX...',
    '..XWWWWWWWWWX..',
    '.XWWWWWWWWWSSX.',
    '.XWWWWWWWWWWSX.',
    'XWWWWWWWWWWWWSX',
    'XWWWWWWWWWWWWSX',
    'XWWWWWWWWWWWWSX',
    'XWWWWWWWWWWWWSX',
    'XWWWWWWWWWWWWSX',
    '.XWWWWWWWWWWSX.',
    '.XWWWWWWWWWWSX.',
    '..XWWWWWWWWSX..',
    '...XWWWWWWSX...',
    '....XWWWWSX....',
    '.....XWWSX.....',
    '.....XWWSX.....',
    '......XWX......',
    '......XWX......',
    '.......X.......'
  ];

  // Un texte brouille : des caracteres remplaces au hasard.
  function brouille(txt, force) {
    var sym = '#@%&$?!*_~ø¥§×';
    return txt.split('').map(function (c) {
      if (c === ' ' || Math.random() > force) return c;
      return sym[Math.floor(Math.random() * sym.length)];
    }).join('');
  }

  function svgPixels(grille, couleurs) {
    var h = grille.length, w = grille[0].length, r = '';
    grille.forEach(function (l, y) {
      for (var x = 0; x < w; x++) {
        var c = couleurs[l[x]];
        if (c) r += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + c + '"/>';
      }
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h +
           '" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
  }

  // La petite tablette posee sur la ville.
  var tabletteUrl = null;
  function tablette() {
    if (tabletteUrl) return tabletteUrl;
    var c = document.createElement('canvas');
    c.width = 20; c.height = 26;
    var x = c.getContext('2d');
    if (!x) return '';
    function p(px, py, w, h, col) { x.fillStyle = col; x.fillRect(px, py, w, h); }
    p(1, 0, 18, 26, '#151822');               // le cerne
    p(0, 1, 20, 24, '#151822');
    p(1, 1, 18, 24, '#2c3142');               // le boitier
    p(2, 1, 16, 1, '#4a5168');
    p(3, 3, 14, 16, '#0b2a30');               // l'ecran
    p(3, 3, 14, 1, '#14444c');
    p(5, 6, 10, 1, '#3ad6f0');                // ce qu'il affiche : une invite
    p(5, 9, 2, 2, '#3ad6f0'); p(8, 9, 2, 2, '#3ad6f0');
    p(11, 9, 2, 2, '#3ad6f0'); p(14, 9, 1, 2, '#3ad6f0');
    p(5, 13, 10, 3, '#14444c');
    p(6, 14, 1, 1, '#9af6ff');
    p(9, 21, 2, 2, '#5d6474');                // le bouton
    p(9, 21, 1, 1, '#8a92a4');
    tabletteUrl = c.toDataURL('image/png');
    return tabletteUrl;
  }

  // ==========================================================
  //  La balise et la sequence
  // ==========================================================

  function poser(view, carte) {
    var pin = el('button', 'ny-pin');
    pin.type = 'button';
    pin.setAttribute('aria-label', 'Localisation');
    pin.style.setProperty('--x', (NX * 100).toFixed(3) + '%');
    pin.style.setProperty('--y', (NYY * 100).toFixed(3) + '%');
    pin.innerHTML = svgPixels(PIN, { W: '#ffffff', X: '#151822' });
    carte.appendChild(pin);

    var scene = null;          // la sequence en cours, s'il y en a une
    var minuteurs = [];
    var anim = 0;

    function plusTard(fn, ms) { minuteurs.push(setTimeout(fn, ms)); }

    function vivant() { return scene && document.body.contains(scene); }

    function sortir() {
      minuteurs.forEach(clearTimeout);
      minuteurs = [];
      if (anim) cancelAnimationFrame(anim);
      anim = 0;
      window.removeEventListener('keydown', auClavier);
      if (scene && scene.parentNode) {
        var s = scene;
        s.classList.add('is-sortie');
        setTimeout(function () { if (s.parentNode) s.remove(); }, reduit ? 0 : 400);
      }
      scene = null;
      view.classList.remove('is-ny');
      pin.focus();
    }

    function auClavier(e) {
      if (!scene) return;
      if (pave && !pave.hidden) return clavierPave(e);
      // Le pave d'Azhrakonr a son propre clavier.
      if (scene.querySelector('.azh-code:not([hidden])')) return;
      if (e.key === 'Escape') { e.preventDefault(); sortir(); }
    }

    // ---------- 1. La plongee sur New York ----------
    var pave = null, saisie = '', affichage = null, verrou = false;

    pin.addEventListener('click', function () {
      if (scene) return;
      view.classList.add('is-ny');
      scene = el('div', 'ny');
      minuteurs = [];

      var zoom = el('div', 'ny-zoom');
      var im = el('img', 'ny-zoom-img');
      im.src = 'assets/items/worldmap.png';
      im.alt = '';
      zoom.appendChild(im);
      zoom.style.transformOrigin = (NX * 100) + '% ' + (NYY * 100) + '%';
      scene.appendChild(zoom);

      // Le viseur du tracker, qui se resserre sur la ville.
      var viseur = el('div', 'ny-viseur');
      ['hg', 'hd', 'bg', 'bd'].forEach(function (c) { viseur.appendChild(el('span', 'ny-coin ny-coin--' + c)); });
      scene.appendChild(viseur);

      var hud = el('p', 'ny-hud', '');
      scene.appendChild(hud);

      var fermer = el('button', 'ny-fermer', '×');
      fermer.type = 'button';
      fermer.setAttribute('aria-label', 'Revenir à la carte');
      fermer.addEventListener('click', sortir);
      scene.appendChild(fermer);

      carte.appendChild(scene);
      window.addEventListener('keydown', auClavier);

      var fin = 'translate(' + ((0.5 - NX) * 100).toFixed(3) + '%,' +
                ((0.5 - NYY) * 100).toFixed(3) + '%) scale(' + ZOOM + ')';
      if (zoom.animate && !reduit) {
        zoom.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: fin }],
                     { duration: DUREE.zoom, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
      } else {
        zoom.style.transform = fin;
      }
      scene.classList.add('is-plonge');

      // Les coordonnees s'affinent pendant la plongee.
      var t0 = Date.now();
      var lecture = setInterval(function () {
        if (!vivant()) return clearInterval(lecture);
        var k = Math.min(1, (Date.now() - t0) / DUREE.zoom);
        var bruit = (1 - k) * 9;
        hud.textContent = 'CIBLE  ' + (NY.lat + (Math.random() - 0.5) * bruit).toFixed(3) + '°N  ' +
                          (-NY.lon + (Math.random() - 0.5) * bruit).toFixed(3) + '°O';
        if (k >= 1) {
          clearInterval(lecture);
          hud.textContent = 'NEW YORK  ·  40.713°N  74.006°O';
        }
      }, 90);
      minuteurs.push(lecture);

      plusTard(function () { if (vivant()) poserTablette(); }, DUREE.zoom + 150);
    });

    function poserTablette() {
      scene.classList.add('is-arrive');
      var t = el('button', 'ny-tablette');
      t.type = 'button';
      t.setAttribute('aria-label', 'Tablette');
      var im = el('img', 'ny-tablette-img');
      im.src = tablette();
      im.alt = '';
      t.appendChild(im);
      t.addEventListener('click', ouvrirPave);
      scene.appendChild(t);
    }

    // ---------- 2. Le code ----------

    function ouvrirPave() {
      if (pave) { pave.hidden = false; return; }
      pave = el('div', 'ny-pave');
      var boitier = el('div', 'ny-pave-boitier');
      var ecran = el('div', 'ny-pave-ecran');
      ecran.appendChild(el('span', 'ny-pave-invite', 'CODE D’ACCÈS'));
      affichage = el('div', 'ny-pave-code');
      ecran.appendChild(affichage);
      boitier.appendChild(ecran);

      var touches = el('div', 'ny-pave-touches');
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', 'OK'].forEach(function (k) {
        var b = el('button', 'ny-touche' + (k === 'OK' ? ' ny-touche--ok' : ''), k);
        b.type = 'button';
        if (k === '←') b.setAttribute('aria-label', 'Effacer');
        b.addEventListener('click', function () { taper(k); });
        touches.appendChild(b);
      });
      boitier.appendChild(touches);

      var retour = el('button', 'ny-pave-retour', 'Ranger la tablette');
      retour.type = 'button';
      retour.addEventListener('click', function () { pave.hidden = true; });
      boitier.appendChild(retour);

      pave.appendChild(boitier);
      scene.appendChild(pave);
      majAffichage();
    }

    function majAffichage(etat) {
      affichage.textContent = '';
      affichage.dataset.etat = etat || '';
      if (etat === 'ok') { affichage.textContent = 'ACCÈS AUTORISÉ'; return; }
      if (etat === 'refus') { affichage.textContent = 'CODE REFUSÉ'; return; }
      for (var i = 0; i < CODE.length; i++) {
        affichage.appendChild(el('span', 'ny-chiffre' + (i < saisie.length ? ' is-plein' : ''),
                                 i < saisie.length ? saisie[i] : '_'));
      }
    }

    function taper(k) {
      if (verrou) return;
      if (k === '←') saisie = saisie.slice(0, -1);
      else if (k === 'OK') return valider();
      else if (saisie.length < CODE.length) saisie += k;
      majAffichage();
    }

    function clavierPave(e) {
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); taper(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); taper('←'); }
      else if (e.key === 'Enter') { e.preventDefault(); taper('OK'); }
      else if (e.key === 'Escape') { e.preventDefault(); pave.hidden = true; }
    }

    function valider() {
      if (saisie !== CODE) {
        verrou = true;
        pave.classList.remove('is-refus');
        void pave.offsetWidth;
        pave.classList.add('is-refus');
        majAffichage('refus');
        plusTard(function () { verrou = false; saisie = ''; if (vivant()) majAffichage(); }, 1100);
        return;
      }
      verrou = true;
      DP.noterCode('ny');
      pave.classList.add('is-ok');
      majAffichage('ok');
      plusTard(function () {
        if (!vivant()) return;
        pave.classList.add('is-range');
        scene.classList.add('is-recul');
        plusTard(function () { if (vivant()) recul(); }, reduit ? 0 : 500);
      }, reduit ? 200 : 1300);
    }

    // ---------- 3. Le recul, puis le cap a droite ----------

    function recul() {
      if (pave) { pave.remove(); pave = null; }
      var tab = scene.querySelector('.ny-tablette');
      if (tab) tab.remove();
      var hud = scene.querySelector('.ny-hud');

      var r = carte.getBoundingClientRect();
      var W = 320, H = Math.max(120, Math.round(W * r.height / Math.max(1, r.width) / 2) * 2);
      var cv = el('canvas', 'ny-espace');
      cv.width = W; cv.height = H;
      scene.insertBefore(cv, hud);
      var ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      // La texture de la Terre : la carte meme du tracker.
      var src = scene.querySelector('.ny-zoom-img');
      var TW = src.naturalWidth || 1152, TH = src.naturalHeight || 768;
      var tc = document.createElement('canvas');
      tc.width = TW; tc.height = TH;
      var tx = tc.getContext('2d');
      tx.drawImage(src, 0, 0, TW, TH);
      var tex = new Uint32Array(tx.getImageData(0, 0, TW, TH).data.buffer);

      var image = ctx.createImageData(W, H);
      var buf = new Uint32Array(image.data.buffer);

      // Le ciel : des etoiles tirees une fois, chacune a sa profondeur.
      var graine = 20261019;
      function alea() { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; }
      var etoiles = [];
      for (var i = 0; i < 240; i++) {
        etoiles.push({ x: alea() * W, y: alea() * H, b: 0.35 + alea() * 0.65,
                       par: 0.15 + alea() * 0.85, ph: alea() * 6.3 });
      }
      var FOND = 0xff0a0503;                     // #03050a, en ABGR

      function rgba(r2, g2, b2) { return (0xff << 24) | (b2 << 16) | (g2 << 8) | r2; }

      // Une sphere texturee en projection orthographique, centree sur
      // (lon0, lat0). La lumiere vient d'en haut a gauche, par paliers :
      // c'est ce qui la garde en 8 bits.
      var L = [-0.55, 0.45, 0.70];
      function globe(cx, cy, R, lon0, lat0) {
        var sp = Math.sin(lat0), cp = Math.cos(lat0);
        var x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W - 1, Math.ceil(cx + R));
        var y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(H - 1, Math.ceil(cy + R));
        for (var y = y0; y <= y1; y++) {
          var v = -((y + 0.5 - cy) / R);
          for (var x = x0; x <= x1; x++) {
            var u = (x + 0.5 - cx) / R;
            var q = u * u + v * v;
            if (q > 1) continue;
            var z = Math.sqrt(1 - q);
            var lat = Math.asin(Math.max(-1, Math.min(1, z * sp + v * cp)));
            var lon = lon0 + Math.atan2(u, z * cp - v * sp);
            var fx = ((lon / 6.283185 + 0.5) % 1 + 1) % 1;
            var c = tex[Math.min(TH - 1, ((0.5 - lat / Math.PI) * TH) | 0) * TW + ((fx * TW) | 0)];
            var lum = u * L[0] + v * L[1] + z * L[2];
            lum = 0.32 + 0.68 * Math.max(0, lum);
            lum = Math.round(lum * 5) / 5 + 0.08;
            var rr = Math.min(255, (c & 255) * lum) | 0;
            var gg = Math.min(255, ((c >> 8) & 255) * lum) | 0;
            var bb = Math.min(255, ((c >> 16) & 255) * lum) | 0;
            buf[y * W + x] = rgba(rr, gg, bb);
          }
        }
      }

      function ciel(t, decalage) {
        buf.fill(FOND);
        for (var i = 0; i < etoiles.length; i++) {
          var s = etoiles[i];
          var x = (((s.x - decalage * s.par) % W) + W) % W | 0;
          var y = s.y | 0;
          var b = s.b * (reduit ? 1 : 0.75 + 0.25 * Math.sin(t / 500 + s.ph));
          var g = (b * 230) | 0;
          buf[y * W + x] = rgba(g, g, Math.min(255, g + 20));
        }
      }

      // Le systeme solaire, en unites libres : les orbites sont tassees et
      // les astres grossis, sinon on ne verrait que des points.
      var TERRE = { a: 1.0, ang: Math.PI + 0.35, r: 0.06 };
      var PLANETES = [
        { a: 0.42, ang: 2.3, r: 0.022, c: '#a8a29a' },
        { a: 0.70, ang: 4.1, r: 0.048, c: '#e8c27a' },
        { a: 1.45, ang: 0.8, r: 0.036, c: '#d0603a' },
        { a: 2.40, ang: 5.4, r: 0.13, c: '#d8b48a', bandes: '#a87a52' },
        { a: 3.40, ang: 2.0, r: 0.11, c: '#e6d29a', anneau: '#c8b47a' },
        { a: 4.40, ang: 3.7, r: 0.075, c: '#8fd8e0' },
        { a: 5.30, ang: 0.35, r: 0.075, c: '#4a6ee0' }
      ];
      var SOLEIL = 0.17;
      // Jusqu'ou file la camera : les dernieres orbites sont encore au
      // bord de l'ecran quand le signal decroche.
      var SORTIE = 12;
      var E = { x: Math.cos(TERRE.ang) * TERRE.a, y: Math.sin(TERRE.ang) * TERRE.a };

      var R0 = W / (2 * (Math.PI / ZOOM));        // la Terre aussi grande que la carte zoomee
      var R1 = H * 0.30;
      var s0 = R1 / TERRE.r, s1 = (H * 0.46) / 5.6;
      var LON_NY = NY.lon * Math.PI / 180, LAT_NY = NY.lat * Math.PI / 180;

      function lisse(k) { return k * k * (3 - 2 * k); }

      function disque(x, y, r, c) {
        ctx.fillStyle = c;
        if (r < 1.2) { ctx.fillRect(Math.round(x), Math.round(y), 1, 1); return; }
        // Un disque en gros pixels : des bandes horizontales.
        var R = Math.round(r);
        for (var dy = -R; dy <= R; dy++) {
          var dx = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
          ctx.fillRect(Math.round(x) - dx, Math.round(y) + dy, dx * 2 + 1, 1);
        }
      }

      function orbite(cx, cy, rayon, alpha) {
        if (rayon < 3 || rayon > 6000 || alpha <= 0) return;
        var n = Math.min(360, Math.max(24, Math.round(rayon * 6.283 / 5)));
        ctx.fillStyle = 'rgba(120,140,210,' + alpha.toFixed(2) + ')';
        for (var i = 0; i < n; i++) {
          var a = i / n * 6.283;
          var x = Math.round(cx + Math.cos(a) * rayon), y = Math.round(cy + Math.sin(a) * rayon);
          if (x >= 0 && y >= 0 && x < W && y < H) ctx.fillRect(x, y, 1, 1);
        }
      }

      // Une image du systeme : camera centree en (cx, cy), s pixels par unite.
      function systeme(t, cx, cy, s, lon, alphaOrb) {
        function ecran(wx, wy) { return [(wx - cx) * s + W / 2, (wy - cy) * s + H / 2]; }
        ciel(t, cx * s);
        // La Terre d'abord dans le tampon, si elle est assez grande pour
        // qu'on voie ses continents.
        var pe = ecran(E.x, E.y), re = TERRE.r * s;
        if (re >= 3) globe(pe[0], pe[1], re, lon, 0.25);
        ctx.putImageData(image, 0, 0);

        var ps = ecran(0, 0);
        PLANETES.forEach(function (p) { orbite(ps[0], ps[1], p.a * s, alphaOrb); });
        orbite(ps[0], ps[1], TERRE.a * s, alphaOrb);

        // Le Soleil : un disque, un halo, et des rayons qui tournent.
        var rs = Math.max(2.5, SOLEIL * s);
        if (ps[0] + rs * 4 > 0 && ps[0] - rs * 4 < W && ps[1] + rs * 4 > 0 && ps[1] - rs * 4 < H) {
          var halo = ctx.createRadialGradient(ps[0], ps[1], rs * 0.6, ps[0], ps[1], rs * 3.2);
          halo.addColorStop(0, 'rgba(255,200,90,.55)');
          halo.addColorStop(1, 'rgba(255,140,40,0)');
          ctx.fillStyle = halo;
          ctx.fillRect(ps[0] - rs * 3.2, ps[1] - rs * 3.2, rs * 6.4, rs * 6.4);
          ctx.fillStyle = '#ffcf5a';
          for (var k = 0; k < 8; k++) {
            var a = k / 8 * 6.283 + (reduit ? 0 : t / 4000);
            var d = rs * (1.35 + (k % 2) * 0.3);
            ctx.fillRect(Math.round(ps[0] + Math.cos(a) * d) - 1, Math.round(ps[1] + Math.sin(a) * d) - 1, 2, 2);
          }
          disque(ps[0], ps[1], rs, '#ffb23a');
          disque(ps[0] - rs * 0.2, ps[1] - rs * 0.2, rs * 0.7, '#ffe27a');
        }

        PLANETES.forEach(function (p) {
          var a = p.ang + (reduit ? 0 : t / (9000 * p.a));
          var q = ecran(Math.cos(a) * p.a, Math.sin(a) * p.a), r2 = Math.max(1, p.r * s);
          if (q[0] < -40 || q[0] > W + 40 || q[1] < -40 || q[1] > H + 40) return;
          if (p.anneau) {
            ctx.strokeStyle = p.anneau;
            ctx.lineWidth = Math.max(1, r2 * 0.25);
            ctx.beginPath();
            ctx.ellipse(q[0], q[1], r2 * 2.1, r2 * 0.7, -0.35, 0, 6.3);
            ctx.stroke();
          }
          disque(q[0], q[1], r2, p.c);
          if (p.bandes && r2 >= 4) {
            ctx.fillStyle = p.bandes;
            ctx.fillRect(Math.round(q[0] - r2 * 0.8), Math.round(q[1] - r2 * 0.3), Math.round(r2 * 1.6), 1);
            ctx.fillRect(Math.round(q[0] - r2 * 0.7), Math.round(q[1] + r2 * 0.35), Math.round(r2 * 1.4), 1);
          }
        });

        // La Terre trop petite pour ses continents : un point bleu. Et la
        // Lune, qui lui tourne autour.
        if (re < 3) disque(pe[0], pe[1], Math.max(1, re), '#3f82dd');
        else {
          ctx.strokeStyle = 'rgba(140,200,255,.55)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(pe[0], pe[1], re + 0.5, 0, 6.3); ctx.stroke();
        }
        var al = 0.8 + t / 2600;
        var pl = ecran(E.x + Math.cos(al) * 0.17, E.y + Math.sin(al) * 0.17);
        disque(pl[0], pl[1], Math.max(1, 0.018 * s), '#cfcfd4');
      }

      // ---------- Le lieu de l'autre balise ----------
      // Une planete sombre, inconnue, dont on ne voit que l'horizon. Des
      // failles magenta la parcourent ; la balise est plantee au sommet,
      // dans une colonne de lumiere, et des ondes partent de son pied.
      var PL = { cx: W / 2, cy: H * 1.55, R: H * 0.95 };
      var POINT = { x: W / 2, y: Math.round(PL.cy - PL.R) + 3 };

      // La planete est peinte en entier, dans les coordonnees de l'image
      // finale : on l'apercoit d'abord toute ronde, au loin, avant de
      // plonger sur son horizon.
      var OX = Math.floor(PL.cx - PL.R) - 2, OY = Math.floor(PL.cy - PL.R) - 2;
      var D = Math.ceil(PL.R * 2) + 4;
      var planete = document.createElement('canvas');
      planete.width = D; planete.height = D;
      var failles = [];
      (function peindrePlanete() {
        var px = planete.getContext('2d');
        var im = px.createImageData(D, D);
        var b = new Uint32Array(im.data.buffer);
        function h(x, y, s) {
          var v = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
          v = (v ^ (v >>> 13)) * 1274126177;
          return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
        }
        for (var j = 0; j < D; j++) {
          for (var i = 0; i < D; i++) {
            var x = i + OX, y = j + OY;
            var dx = x + 0.5 - PL.cx, dy = y + 0.5 - PL.cy;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d > PL.R) continue;
            // Un grain par blocs de trois pixels, des cratères plus sombres.
            var n = h(Math.floor(x / 3), Math.floor(y / 3), 7);
            var cr = h(Math.floor(x / 9), Math.floor(y / 7), 9) > 0.86;
            var lum = 0.55 + 0.45 * (1 - (d / PL.R)) * 2.2 - (dx / PL.R) * 0.5;
            lum = Math.max(0.35, Math.min(1.1, Math.round(lum * 4) / 4));
            var r = (28 + n * 18) * lum, g = (14 + n * 10) * lum, bl = (46 + n * 26) * lum;
            if (cr) { r *= 0.6; g *= 0.6; bl *= 0.7; }
            // Le liseré d'atmosphère, violet, tout au bord.
            if (PL.R - d < 2.2) { r = 150; g = 100; bl = 255; }
            b[j * D + i] = rgba(Math.min(255, r) | 0, Math.min(255, g) | 0, Math.min(255, bl) | 0);
          }
        }
        px.putImageData(im, 0, 0);
        // Les failles : des lignes brisees qui partent du pied de la balise.
        var g2 = 4242;
        function al() { g2 = (g2 * 1103515245 + 12345) & 0x7fffffff; return g2 / 0x7fffffff; }
        for (var f = 0; f < 6; f++) {
          var pts = [[POINT.x, POINT.y + 2]];
          var ang = (f / 6) * Math.PI * 0.9 + 0.12 * Math.PI + (al() - 0.5) * 0.3;
          var x0 = POINT.x, y0 = POINT.y + 2;
          for (var k = 0; k < 7; k++) {
            x0 += Math.cos(ang) * (6 + al() * 9) * (1 + k * 0.25);
            y0 += Math.sin(ang) * (2 + al() * 4) * (1 + k * 0.2);
            ang += (al() - 0.5) * 0.7;
            pts.push([x0, y0]);
          }
          failles.push(pts);
        }
      })();

      var NEBULEUSES = [[-70, -40, 120, 'rgba(150,80,255,'], [80, -20, 100, 'rgba(60,110,255,'],
                        [10, -70, 80, 'rgba(214,92,255,']];

      // La camera du lieu : z est le grossissement, (fx, fy) le point de
      // l'image finale qu'on met au centre de l'ecran. z = 1 au centre de
      // l'ecran, c'est l'image finale telle quelle.
      var ZMIN = 0.06;
      function cameraLieu(e) {
        return {
          z: ZMIN * Math.pow(1 / ZMIN, e),
          fx: PL.cx + (W / 2 - PL.cx) * e,
          fy: PL.cy + (H / 2 - PL.cy) * e
        };
      }

      // "derriere" peint ce qui passe entre le ciel et la planete : c'est
      // la qu'Azhrakonr arrive, plus grand qu'elle.
      function lieu(t, cam, derriere) {
        cam = cam || { z: 1, fx: W / 2, fy: H / 2 };
        ciel(t, 913);
        ctx.putImageData(image, 0, 0);
        // Les nebuleuses sont loin : elles grossissent a peine.
        var zn = 0.7 + 0.3 * cam.z;
        NEBULEUSES.forEach(function (n) {
          var x = W / 2 + n[0] * zn, y = H / 2 + n[1] * zn, r2 = n[2] * zn;
          var gr = ctx.createRadialGradient(x, y, 0, x, y, r2);
          gr.addColorStop(0, n[3] + '0.30)');
          gr.addColorStop(1, n[3] + '0)');
          ctx.fillStyle = gr;
          ctx.fillRect(x - r2, y - r2, r2 * 2, r2 * 2);
        });

        if (derriere) derriere();
        // Pendant la venue d'Azhrakonr, la planete vit dans son propre
        // calque : la toile ne peint plus que le ciel.
        if (cam.sansPlanete) return;

        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(cam.z, cam.z);
        ctx.translate(-cam.fx, -cam.fy);
        ctx.drawImage(planete, OX, OY);

        // Les failles respirent.
        var pouls = reduit ? 0.8 : 0.5 + 0.4 * Math.sin(t / 420);
        ctx.strokeStyle = 'rgba(214,92,255,' + pouls.toFixed(2) + ')';
        ctx.lineWidth = 1;
        failles.forEach(function (pts) {
          ctx.beginPath();
          ctx.moveTo(Math.round(pts[0][0]) + 0.5, Math.round(pts[0][1]) + 0.5);
          for (var i = 1; i < pts.length; i++) ctx.lineTo(Math.round(pts[i][0]) + 0.5, Math.round(pts[i][1]) + 0.5);
          ctx.stroke();
        });

        // La colonne de lumiere au-dessus de la balise. Elle monte bien
        // plus haut que l'ecran : de loin, on la voit sortir de la planete.
        var haut = POINT.y - H * 1.6;
        var col = ctx.createLinearGradient(0, haut, 0, POINT.y);
        col.addColorStop(0, 'rgba(200,170,255,0)');
        col.addColorStop(1, 'rgba(220,200,255,' + (reduit ? 0.3 : 0.18 + 0.1 * Math.sin(t / 300)).toFixed(2) + ')');
        ctx.fillStyle = col;
        ctx.fillRect(POINT.x - 6, haut, 12, POINT.y - haut);
        ctx.fillRect(POINT.x - 2, haut, 4, POINT.y - haut);

        // Les ondes, couchees sur le sol.
        for (var o = 0; o < 3; o++) {
          var ph = reduit ? o / 3 : ((t / 1800) + o / 3) % 1;
          ctx.strokeStyle = 'rgba(220,190,255,' + (0.7 * (1 - ph)).toFixed(2) + ')';
          ctx.beginPath();
          ctx.ellipse(POINT.x, POINT.y + 1, 6 + ph * 70, (6 + ph * 70) * 0.18, 0, 0, 6.3);
          ctx.stroke();
        }
        ctx.restore();

        // De loin, la balise n'est qu'un signal qui clignote au sommet.
        if (cam.z < 0.9) {
          var sx = Math.round((POINT.x - cam.fx) * cam.z + W / 2);
          var sy = Math.round((POINT.y - cam.fy) * cam.z + H / 2);
          if (reduit || Math.floor(t / 220) % 2) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(sx - 1, sy - 2, 3, 1);
            ctx.fillRect(sx, sy - 3, 1, 3);
            ctx.fillStyle = 'rgba(214,92,255,.8)';
            ctx.fillRect(sx - 2, sy - 2, 1, 1); ctx.fillRect(sx + 2, sy - 2, 1, 1);
          }
        }
      }

      // Les etoiles filent vers les bords pendant qu'on fonce : v de 0 a 1.
      function filees(v) {
        if (reduit || v <= 0.02) return;
        ctx.lineWidth = 1;
        for (var i = 0; i < 90; i++) {
          var s = etoiles[i];
          var dx = s.x - W / 2, dy = s.y - H / 2;
          var l = 0.05 + 0.5 * v * s.par;
          ctx.strokeStyle = 'rgba(230,225,255,' + (0.35 + 0.5 * v * s.b).toFixed(2) + ')';
          ctx.beginPath();
          ctx.moveTo(Math.round(s.x) + 0.5, Math.round(s.y) + 0.5);
          ctx.lineTo(Math.round(s.x + dx * l) + 0.5, Math.round(s.y + dy * l) + 0.5);
          ctx.stroke();
        }
      }

      // Le decrochage : l'image se dechire en bandes, les couleurs se
      // separent, la neige monte, et l'autre lieu perce de plus en plus
      // souvent a travers, jusqu'a prendre toute la place.
      var tampon = document.createElement('canvas');
      tampon.width = W; tampon.height = H;
      var tctx = tampon.getContext('2d');
      function brouillage(t, g, fond) {
        if (!reduit && Math.random() < g * g * 0.9) lieu(t, cameraLieu(0)); else fond();
        tctx.clearRect(0, 0, W, H);
        tctx.drawImage(cv, 0, 0);
        var force = Math.sin(g * Math.PI) * 0.8 + 0.2;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        for (var y = 0; y < H;) {
          var hb = 2 + ((Math.random() * 12) | 0);
          var dec = Math.random() < 0.55 ? (Math.random() - 0.5) * 70 * force : 0;
          ctx.drawImage(tampon, 0, y, W, hb, Math.round(dec), y, W, hb);
          y += hb;
        }
        // Les canaux qui se separent.
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 * force;
        ctx.drawImage(tampon, Math.round(4 * force), 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        // La neige et les blocs de couleur.
        var n = (90 * force) | 0;
        for (var i = 0; i < n; i++) {
          var c = Math.random();
          ctx.fillStyle = c < 0.5 ? 'rgba(255,255,255,.8)' : c < 0.75 ? 'rgba(214,92,255,.7)' : 'rgba(58,214,240,.7)';
          ctx.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0,
                       1 + ((Math.random() * (c < 0.9 ? 3 : 30)) | 0), 1 + ((Math.random() * 2) | 0));
        }
      }

      // La balise au-dela : un symbole de localisation blanc, plus grand
      // que celui de New York, qui porte l'embleme fourni.
      var ext = el('button', 'ny-ext');
      ext.type = 'button';
      ext.setAttribute('aria-label', 'Localisation inconnue');
      ext.innerHTML = svgPixels(PIN_EXT, { W: '#ffffff', S: '#c8c2de', X: '#151822' });
      var emb = el('img', 'ny-ext-embleme');
      emb.src = 'assets/items/localext.webp';
      emb.alt = '';
      ext.appendChild(emb);
      ext.hidden = true;
      ext.style.setProperty('--x', (POINT.x / W * 100).toFixed(2) + '%');
      ext.style.setProperty('--y', (POINT.y / H * 100).toFixed(2) + '%');
      ext.addEventListener('click', ouvrirCodeAzh);
      scene.appendChild(ext);

      var mot = el('strong', 'ny-glitch-mot', '');
      scene.appendChild(mot);

      // ==========================================================
      //  Azhrakonr
      // ==========================================================

      // Les deux illustrations sont des images a pleine definition, posees
      // par-dessus la toile et deplacees en continu : elles ne passent pas
      // par les gros pixels. Leurs bords se fondent dans l'espace (CSS).
      var imLoin = el('img', 'azh-loin');
      imLoin.src = 'assets/items/azhrakonr-approche.webp';
      imLoin.alt = '';
      imLoin.hidden = true;
      scene.insertBefore(imLoin, hud);
      var imMains = el('img', 'azh-mains');
      imMains.src = 'assets/items/azhrakonr-mains.webp';
      imMains.alt = '';
      imMains.hidden = true;
      scene.insertBefore(imMains, hud);

      // L'etat de la rencontre : null, puis 'rebours', puis 'venue'.
      var azh = null;

      // ---------- Le code a quatre cases ----------
      var panneau = null, saisieAzh = '', verrouAzh = false;

      function ouvrirCodeAzh() {
        if (azh) return;
        if (panneau) { panneau.hidden = false; return; }
        panneau = el('div', 'azh-code');
        var boite = el('div', 'azh-code-boite');
        boite.appendChild(el('strong', 'azh-code-titre', '???'));
        var cases = el('div', 'azh-cases');
        AZH.forEach(function (p, i) {
          var c = el('div', 'azh-case');
          c.style.setProperty('--c', p.couleur);
          c.appendChild(el('span', 'azh-case-chiffres', '_ _'));
          cases.appendChild(c);
          if (i < AZH.length - 1) cases.appendChild(el('span', 'azh-tiret', '-'));
        });
        boite.appendChild(cases);
        boite.appendChild(el('p', 'azh-code-mot', ''));

        var touches = el('div', 'ny-pave-touches');
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', 'OK'].forEach(function (k) {
          var b = el('button', 'ny-touche' + (k === 'OK' ? ' ny-touche--ok' : ''), k);
          b.type = 'button';
          if (k === '←') b.setAttribute('aria-label', 'Effacer');
          b.addEventListener('click', function () { taperAzh(k); });
          touches.appendChild(b);
        });
        boite.appendChild(touches);

        var fermer = el('button', 'ny-pave-retour', 'Fermer');
        fermer.type = 'button';
        fermer.addEventListener('click', function () { panneau.hidden = true; });
        boite.appendChild(fermer);
        panneau.appendChild(boite);
        scene.appendChild(panneau);
        window.addEventListener('keydown', clavierAzh);
        majCases();
      }

      function majCases(etat) {
        var cs = panneau.querySelectorAll('.azh-case-chiffres');
        for (var i = 0; i < cs.length; i++) {
          var p = saisieAzh.slice(i * 2, i * 2 + 2);
          cs[i].textContent = (p[0] || '_') + ' ' + (p[1] || '_');
          cs[i].parentNode.classList.toggle('is-pleine', p.length === 2);
        }
        var m = panneau.querySelector('.azh-code-mot');
        m.textContent = etat === 'refus' ? 'CODE REFUSÉ' : etat === 'ok' ? 'SIGNAL ACCEPTÉ' : '';
        panneau.dataset.etat = etat || '';
      }

      function taperAzh(k) {
        if (verrouAzh) return;
        if (k === '←') saisieAzh = saisieAzh.slice(0, -1);
        else if (k === 'OK') return validerAzh();
        else if (saisieAzh.length < CODE_AZH.length) saisieAzh += k;
        majCases();
      }

      function clavierAzh(e) {
        if (!panneau || panneau.hidden || !vivant()) return;
        if (/^[0-9]$/.test(e.key)) { e.preventDefault(); taperAzh(e.key); }
        else if (e.key === 'Backspace') { e.preventDefault(); taperAzh('←'); }
        else if (e.key === 'Enter') { e.preventDefault(); taperAzh('OK'); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); panneau.hidden = true; }
      }

      function validerAzh() {
        if (saisieAzh !== CODE_AZH) {
          verrouAzh = true;
          panneau.classList.remove('is-refus');
          void panneau.offsetWidth;
          panneau.classList.add('is-refus');
          majCases('refus');
          plusTard(function () { verrouAzh = false; saisieAzh = ''; if (vivant()) majCases(); }, 1100);
          return;
        }
        verrouAzh = true;
        DP.noterCode('azhrakonr');
        majCases('ok');
        plusTard(function () {
          if (!vivant()) return;
          window.removeEventListener('keydown', clavierAzh);
          panneau.classList.add('is-range');
          plusTard(function () { if (panneau) panneau.remove(); panneau = null; rebours(); }, reduit ? 0 : 450);
        }, reduit ? 200 : 1200);
      }

      // ---------- Le compte a rebours ----------
      var REBOURS = reduit ? 3 : 10;
      function rebours() {
        azh = { etat: 'rebours' };
        ext.classList.add('is-verrou');
        var r = el('div', 'azh-rebours');
        r.appendChild(el('span', 'azh-rebours-mot', 'QUELQUE CHOSE A ENTENDU'));
        var n = el('strong', 'azh-rebours-n', String(REBOURS));
        r.appendChild(n);
        scene.appendChild(r);
        scene.classList.add('is-alerte');
        hud.textContent = 'SIGNAL ENTRANT';
        var reste = REBOURS;
        function tic() {
          if (!vivant()) return;
          reste--;
          if (reste <= 0) {
            r.classList.add('is-fin');
            scene.classList.remove('is-alerte');
            plusTard(function () { r.remove(); }, 500);
            return venue();
          }
          n.textContent = String(reste);
          n.classList.remove('is-tic');
          void n.offsetWidth;
          n.classList.add('is-tic');
          hud.textContent = 'SIGNAL ENTRANT  ·  T-' + reste;
          plusTard(tic, 1000);
        }
        plusTard(tic, 1000);
      }

      // ---------- La venue ----------
      // Les temps, en millisecondes : la camera recule pour montrer la
      // planete entiere, il nait au fond de l'espace, au milieu de l'ecran,
      // et grandit lentement ; il plonge sous l'ecran, puis remonte et la
      // prend dans ses mains.
      var VENUE = reduit
        ? { recul: 200, attente: 100, approche: 800, plonge: 200, vide: 100, montee: 400 }
        : { recul: 2600, attente: 1800, approche: 16000, plonge: 1700, vide: 1000, montee: 4200 };
      var V1 = VENUE.recul, V2 = V1 + VENUE.attente, V3 = V2 + VENUE.approche;
      var V4 = V3 + VENUE.plonge, V5 = V4 + VENUE.vide, V6 = V5 + VENUE.montee;

      // Ou se tient la planete a l'ecran : son centre et son rayon. On part
      // de l'horizon de l'image finale ; elle recule, petite et basse,
      // pour laisser toute la place a celui qui arrive ; puis elle monte
      // se poser entre ses paumes.
      var POSES = {
        finale: { x: W / 2, y: PL.cy, r: PL.R },
        loin:   { x: W / 2, y: H * 0.8, r: W * 0.07 },
        tenue:  { x: W / 2, y: H * 0.6, r: W * 0.17 }
      };
      function poseEntre(a, b, k) {
        return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k,
                 r: a.r * Math.pow(b.r / a.r, k) };
      }
      // La planete, le temps de la venue : un calque a elle, qui garde ses
      // gros pixels mais glisse en continu, sans sauter de pixel en pixel.
      var calquePlanete = null;
      function poserCalquePlanete() {
        var c = document.createElement('canvas');
        c.width = D; c.height = D;
        var x = c.getContext('2d');
        x.drawImage(planete, 0, 0);
        x.strokeStyle = 'rgba(214,92,255,.75)';
        x.lineWidth = 1;
        failles.forEach(function (pts) {
          x.beginPath();
          x.moveTo(Math.round(pts[0][0] - OX) + 0.5, Math.round(pts[0][1] - OY) + 0.5);
          for (var i = 1; i < pts.length; i++) x.lineTo(Math.round(pts[i][0] - OX) + 0.5, Math.round(pts[i][1] - OY) + 0.5);
          x.stroke();
        });
        c.className = 'azh-planete';
        scene.insertBefore(c, hud);
        calquePlanete = c;
      }

      function venue() {
        azh = { etat: 'venue', t0: performance.now() };
        ext.classList.add('is-cache');
        hud.textContent = '???';
        poserCalquePlanete();
      }

      // Une courbe douce, aux deux bouts.
      function doux(k) { k = Math.max(0, Math.min(1, k)); return k * k * k * (k * (k * 6 - 15) + 10); }

      function imageAzh(now) {
        var u = now - azh.t0;
        var pose = u < V5
          ? poseEntre(POSES.finale, POSES.loin, doux(u / VENUE.recul))
          : poseEntre(POSES.loin, POSES.tenue, doux((u - V5) / VENUE.montee));
        // Le ciel seul, sur la toile.
        lieu(now, { z: pose.r / PL.R, fx: W / 2, fy: H / 2, sansPlanete: true });

        // Les mesures de l'ecran : la toile y est etiree sur toute la scene.
        var sw = scene.clientWidth, sh = scene.clientHeight;
        var kx = sw / W, ky = sh / H;

        // La planete : son centre et son rayon, convertis en pixels d'ecran.
        var flotte = u > V6 && !reduit ? Math.sin((u - V6) / 1100) * 3 : 0;
        calquePlanete.style.transform =
          'translate3d(' + (pose.x * kx - D / 2).toFixed(2) + 'px,' + (pose.y * ky - D / 2 + flotte).toFixed(2) + 'px,0)' +
          ' scale(' + (pose.r / PL.R * kx).toFixed(4) + ')';

        // Il nait au fond de l'espace, au milieu de l'ecran, et grandit
        // lentement, puis de plus en plus vite.
        var tremble = 0;
        if (u >= V2 && u < V4) {
          var k = Math.min(1, (u - V2) / VENUE.approche);
          var echelle = 0.02 * Math.pow(1.8 / 0.02, Math.pow(k, 1.7));
          var dy = 0;
          if (u >= V3) {
            // Il plonge sous l'ecran.
            var p = doux((u - V3) / VENUE.plonge);
            dy = p * sh * 1.4;
            echelle *= 1 + p * 0.3;
            tremble = 4 * Math.sin(p * Math.PI);
          }
          imLoin.hidden = false;
          imLoin.style.opacity = String(Math.min(1, doux(k * 3.2)));
          imLoin.style.transform = 'translate3d(-50%, calc(-50% + ' + dy.toFixed(2) + 'px), 0) scale(' + echelle.toFixed(4) + ')';
        } else if (!imLoin.hidden) {
          imLoin.hidden = true;
        }

        // Il remonte du bas, les mains ouvertes, jusqu'a la planete.
        if (u >= V5) {
          var m = doux((u - V5) / VENUE.montee);
          imMains.hidden = false;
          // Une fois en place, il respire avec la planete.
          imMains.style.transform = u > V6
            ? 'translate3d(0,' + flotte.toFixed(2) + 'px,0)'
            : 'translate3d(0,' + ((1 - m) * 110).toFixed(3) + '%,0)';
          if (m < 1) tremble = Math.max(tremble, 2.5 * Math.sin(m * Math.PI));
        }

        // Une secousse souple, faite de sinus : rien qui saute.
        if (tremble > 0.05 && !reduit) {
          scene.style.translate = (tremble * Math.sin(now / 41)).toFixed(2) + 'px ' +
                                  (tremble * Math.sin(now / 57 + 1)).toFixed(2) + 'px';
        } else if (scene.style.translate) scene.style.translate = '';

        if (u >= V6 + 500 && !azh.parle) {
          azh.parle = true;
          hud.textContent = '';
          dialogue();
        }
      }

      // ---------- Le devoreur parle ----------
      function dialogue() {
        var d = el('div', 'azh-dialogue');
        d.appendChild(el('span', 'azh-dialogue-nom', 'AZHRAKONR'));
        var txt = el('p', 'azh-dialogue-txt', '');
        d.appendChild(txt);
        var suite = el('span', 'azh-dialogue-suite', '▼');
        d.appendChild(suite);
        scene.appendChild(d);

        var i = 0, c = 0, ecrit = null;
        function ligne() {
          var l = DIALOGUE[i];
          c = 0;
          txt.textContent = '';
          d.classList.remove('is-fini');
          clearInterval(ecrit);
          ecrit = setInterval(function () {
            if (!vivant()) return clearInterval(ecrit);
            c++;
            txt.textContent = l.slice(0, c);
            if (c >= l.length) { clearInterval(ecrit); ecrit = null; d.classList.add('is-fini'); }
          }, reduit ? 1 : 42);
          minuteurs.push(ecrit);
        }
        function avancer() {
          if (ecrit) {
            // Un clic pendant qu'il parle : la phrase s'affiche d'un coup.
            clearInterval(ecrit); ecrit = null;
            txt.textContent = DIALOGUE[i];
            d.classList.add('is-fini');
            return;
          }
          if (i >= DIALOGUE.length - 1) return;
          i++;
          ligne();
          // La derniere phrase dite, il n'y a plus qu'a partir.
          if (i === DIALOGUE.length - 1) {
            d.classList.add('is-derniere');
            var part = el('button', 'azh-dialogue-btn', 'Revenir');
            part.type = 'button';
            part.addEventListener('click', function (e) { e.stopPropagation(); sortir(); });
            d.appendChild(part);
          }
        }
        d.addEventListener('click', avancer);
        window.addEventListener('keydown', function clavier(e) {
          if (!vivant()) return window.removeEventListener('keydown', clavier);
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avancer(); }
        });
        ligne();
      }

      var debut = performance.now();
      var T1 = DUREE.globe, T2 = T1 + DUREE.systeme, T3 = T2 + DUREE.cap, T4 = T3 + DUREE.glitch;
      var T5 = T4 + DUREE.approche;
      var lonFin = LON_NY - 0.6;
      var lonGele = lonFin - DUREE.systeme / 9000;

      function image1(t, k) {
        // La ville, puis la Terre entiere : le rayon fond, la sphere tourne
        // un peu, l'equateur remonte au centre.
        var e = lisse(k);
        var R = R0 * Math.pow(R1 / R0, e);
        ciel(t, 0);
        globe(W / 2, H / 2, R, LON_NY - 0.6 * e, LAT_NY + (0.25 - LAT_NY) * e);
        ctx.putImageData(image, 0, 0);
        if (R < W) {
          ctx.strokeStyle = 'rgba(140,200,255,' + (0.55 * Math.min(1, (W - R) / W * 3)).toFixed(2) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(W / 2, H / 2, R + 0.5, 0, 6.3); ctx.stroke();
        }
      }

      function boucle(now) {
        if (!vivant()) return;
        var t = now - debut;
        if (t < T1) {
          image1(now, t / T1);
          hud.textContent = t < T1 * 0.45 ? 'NEW YORK' : 'TERRE';
        } else if (t < T2) {
          // Du globe au systeme : l'echelle recule, et la camera glisse de
          // la Terre vers le Soleil une fois le recul bien engage.
          var u = lisse((t - T1) / DUREE.systeme);
          var s = s0 * Math.pow(s1 / s0, u);
          var f = lisse(Math.pow(u, 1.6));
          var lon = lonFin - (t - T1) / 9000;
          systeme(now, E.x * (1 - f), E.y * (1 - f), s, lon, Math.min(0.35, u * 0.5));
          hud.textContent = 'SYSTÈME SOLAIRE';
        } else if (t < T3) {
          // Cap a droite : le systeme glisse et sort de l'ecran par la gauche.
          var v = (t - T2) / DUREE.cap;
          v = v * v * (1.6 - 0.6 * v);             // part doucement, ne freine pas
          systeme(now, SORTIE * v, 0, s1, lonGele, 0.35);
          hud.textContent = 'SORTIE DU SYSTÈME SOLAIRE  ·  ' + Math.round(v * 140) + ' UA';
        } else if (t < T4) {
          // Le signal decroche.
          var g = (t - T3) / DUREE.glitch;
          if (!scene.classList.contains('is-glitch')) scene.classList.add('is-glitch');
          brouillage(now, g, function () { systeme(now, SORTIE, 0, s1, lonGele, 0.35); });
          var txt = g < 0.6 ? 'SIGNAL PERDU' : 'SIGNAL ???';
          mot.textContent = brouille(txt, 0.15 + Math.sin(g * Math.PI) * 0.5);
          hud.textContent = brouille('HORS SYSTÈME  ·  ??? UA', 0.5);
        } else if (t < T5) {
          // Le signal raccroche : une planete, toute ronde au loin, et l'on
          // fonce dessus jusqu'a son horizon.
          if (scene.classList.contains('is-glitch')) {
            scene.classList.remove('is-glitch');
            mot.remove();
          }
          var a = (t - T4) / DUREE.approche;
          var e = lisse(a);
          lieu(now, cameraLieu(e));
          filees(Math.sin(a * Math.PI));
          hud.textContent = 'APPROCHE  ·  ' + Math.round((1 - e) * 9999) + ' KM';
          // La neige du decrochage retombe, la premiere seconde.
          var neige = 1 - (t - T4) / 900;
          if (neige > 0 && !reduit) {
            for (var i = 0; i < 60 * neige; i++) {
              ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * neige).toFixed(2) + ')';
              ctx.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1 + ((Math.random() * 3) | 0), 1);
            }
          }
        } else {
          // Le lieu, et la balise qui s'y pose.
          if (!ext.dataset.pose) {
            ext.dataset.pose = '1';
            if (mot.parentNode) { scene.classList.remove('is-glitch'); mot.remove(); }
            ext.hidden = false;
            ext.classList.add('is-pose');
            hud.textContent = 'LOCALISATION INCONNUE  ·  ??? UA';
            plusTard(function () {
              if (!vivant()) return;
              if (!azh) ext.classList.add('is-arrive');
              ext.focus();
            }, reduit ? 0 : 1500);
          }
          if (azh && azh.etat === 'venue') imageAzh(now);
          else lieu(now);
        }
        anim = requestAnimationFrame(boucle);
      }

      // La carte zoomee s'efface sous la Terre qui apparait.
      scene.classList.add('is-espace');
      anim = requestAnimationFrame(boucle);
    }

  }

  window.TRACKER_NY = { poser: poser, CODE: CODE, AZH: AZH };
})();
