// Les arbres cosmiques de Fish n'Der, la hache qui les abat, et le code
// qu'ils livrent morceau par morceau.
//
// Cinq arbres d'un bleu de nuit, semes dans le bois d'automne. Une hache
// plantee dans une souche, au fond d'un recoin du nord-est. Elle ne sert
// qu'une fois : a abattre les cinq, puis elle se brise. Chaque arbre
// laisse un fragment ; les cinq ensemble font le code que la tablette de
// New York attend, dans le DinderTracker.
(function () {
  var DP = window.DP;
  if (!DP) return;

  var CODE = '12677234690';
  // Le morceau de chaque rang. Les rangs ne suivent pas la carte : on ne
  // lit le code qu'une fois les cinq reunis.
  var MORCEAUX = { 1: '12', 2: '67', 3: '72', 4: '34', 5: '690' };

  // En cases de la carte de peche. Chaque arbre a une case libre a cote,
  // d'ou on lui fait face : verifie sur la grille generee.
  var ARBRES = [
    { rang: 3, x: 22, y: 7 },     // entre les deux grands lacs du nord
    { rang: 1, x: 46, y: 12 },    // a la lisiere est
    { rang: 5, x: 3,  y: 16 },    // a l'ouest, derriere le petit lac
    { rang: 2, x: 18, y: 29 },    // dans la lisiere sud
    { rang: 4, x: 38, y: 27 }     // au bord des eaux irradiees du sud-est
  ];

  // La souche ou la hache est plantee : un creux entre les arbres du
  // coin nord-est, qu'on ne voit qu'en y allant.
  var HACHE = { x: 44, y: 4 };

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function arbreEn(x, y) {
    for (var i = 0; i < ARBRES.length; i++) {
      if (ARBRES[i].x === x && ARBRES[i].y === y) return ARBRES[i];
    }
    return null;
  }

  function abattu(rang) { return DP.cosmos().abattus.indexOf(rang) !== -1; }

  // Le code tel qu'on le connait : les morceaux trouves, des tirets pour
  // les autres.
  function morceaux() {
    var c = DP.cosmos();
    var r = [];
    for (var k = 1; k <= 5; k++) {
      r.push(c.abattus.indexOf(k) !== -1 ? MORCEAUX[k] : null);
    }
    return r;
  }

  // ==========================================================
  //  Les dessins, au pixel
  // ==========================================================

  function ombre(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * k));
    var b = Math.min(255, Math.round((n & 255) * k));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Le cerne sombre, comme pour les sprites des Dinders.
  function cerner(ctx, w, h) {
    var img = ctx.getImageData(0, 0, w, h), d = img.data, i;
    var plein = new Uint8Array(w * h);
    for (i = 0; i < w * h; i++) plein[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        i = y * w + x;
        if (plein[i]) continue;
        for (var k = 0; k < 4; k++) {
          var nx = x + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || !plein[ny * w + nx]) continue;
          d[i * 4] = 23; d[i * 4 + 1] = 20; d[i * 4 + 2] = 31; d[i * 4 + 3] = 255;
          break;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function toile(w, h, dessin) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    if (!x) return c;
    var p = function (px, py, pw, ph, col) { x.fillStyle = col; x.fillRect(px, py, pw, ph); };
    dessin(p, x);
    cerner(x, w, h);
    return c;
  }

  // La hache : un manche de bois, un fer d'acier au fil tres clair, et
  // une lueur violette sur le tranchant — elle est faite pour ces arbres-la.
  var hacheCv = null;
  function hache() {
    if (hacheCv) return hacheCv;
    hacheCv = toile(18, 22, function (p) {
      // Le manche.
      p(10, 5, 3, 15, '#8a5a2b');
      p(10, 5, 1, 15, '#b07a3e');
      p(12, 7, 1, 13, '#6b4320');
      p(9, 19, 5, 2, '#5a3618');
      // La douille, qui serre le fer.
      p(9, 3, 5, 5, '#5d6474');
      p(9, 3, 5, 1, '#8a92a4');
      // Le fer, vers la gauche.
      p(3, 2, 6, 8, '#9aa4b4');
      p(3, 2, 6, 2, '#c4ccd8');
      p(4, 8, 5, 2, '#7a8394');
      p(2, 3, 1, 6, '#e8eef7');
      p(1, 4, 1, 4, '#f4f7fb');
      // Le tranchant garde un reflet cosmique.
      p(2, 4, 1, 3, '#c49bff');
      // Le talon, a droite.
      p(14, 4, 2, 3, '#5d6474');
    });
    return hacheCv;
  }

  // Un fragment de code : un eclat de cristal nocturne pique d'etoiles.
  var fragCv = null;
  function fragment() {
    if (fragCv) return fragCv;
    fragCv = toile(16, 20, function (p) {
      p(7, 1, 2, 18, '#3a2a8a');
      p(6, 3, 4, 14, '#4a3aa8');
      p(5, 6, 6, 8, '#5a46c8');
      p(4, 8, 8, 4, '#6a52e0');
      p(6, 4, 2, 6, '#9a84ff');
      p(7, 2, 1, 3, '#c8b8ff');
      p(9, 11, 1, 1, '#ffffff');
      p(6, 13, 1, 1, '#e0d0ff');
      p(8, 7, 1, 1, '#ffffff');
    });
    return fragCv;
  }

  function url(cv, echelle) {
    var c = document.createElement('canvas');
    c.width = cv.width * echelle; c.height = cv.height * echelle;
    var x = c.getContext('2d');
    if (!x) return '';
    x.imageSmoothingEnabled = false;
    x.drawImage(cv, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  var urls = {};
  function hacheUrl() { return urls.h || (urls.h = url(hache(), 4)); }
  function fragmentUrl() { return urls.f || (urls.f = url(fragment(), 4)); }

  // Un arbre cosmique, pose sur sa case : (sx, sy) est le pied du tronc,
  // au bas de la case. Il deborde vers le haut comme les autres arbres,
  // mais son feuillage est un morceau de ciel de nuit, et ses etoiles
  // s'allument et s'eteignent.
  var TS = 24;
  function dessinerArbre(ctx, sx, sy, t, graine) {
    var px = Math.round(sx - TS / 2), py = Math.round(sy - TS);
    var hx = px + TS / 2;

    // Le halo, qui respire.
    var a = reduit ? 0.16 : 0.12 + 0.07 * Math.sin(t / 700 + graine);
    ctx.fillStyle = 'rgba(150,110,255,' + a.toFixed(2) + ')';
    ctx.beginPath();
    ctx.ellipse(hx, py - 2, 22, 20, 0, 0, 6.3);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fillRect(px + 3, py + TS - 5, TS - 6, 4);
    // Le tronc, d'un bois presque noir veine de violet.
    ctx.fillStyle = '#241a36'; ctx.fillRect(hx - 4, py + 8, 8, TS - 10);
    ctx.fillStyle = '#3a2a58'; ctx.fillRect(hx - 4, py + 8, 3, TS - 10);
    ctx.fillStyle = '#7a4fd0'; ctx.fillRect(hx + 1, py + 12, 1, 6);

    // Le feuillage : trois bleus de nuit, du plus sombre au plus clair.
    ctx.fillStyle = '#140f38';
    ctx.fillRect(px - 2, py - 12, TS + 4, 22);
    ctx.fillRect(px + 2, py - 18, TS - 4, 30);
    ctx.fillStyle = '#231a62';
    ctx.fillRect(px + 1, py - 14, TS - 6, 16);
    ctx.fillStyle = '#3a2a9a';
    ctx.fillRect(px + 3, py - 16, 9, 7);
    ctx.fillRect(px + 2, py - 9, 5, 4);
    // Une nebuleuse rose au creux.
    ctx.fillStyle = 'rgba(214,92,255,.55)';
    ctx.fillRect(px + 12, py - 8, 6, 3);
    ctx.fillRect(px + 14, py - 10, 3, 2);

    // Les etoiles : chacune a son rythme.
    for (var i = 0; i < 7; i++) {
      var ex = px + 1 + ((graine * 37 + i * 53) % (TS - 2));
      var ey = py - 16 + ((graine * 17 + i * 29) % 24);
      var lu = reduit ? 0.8 : 0.35 + 0.65 * Math.max(0, Math.sin(t / (380 + i * 70) + i * 1.7 + graine));
      ctx.fillStyle = 'rgba(' + (i % 3 ? '255,255,255' : '160,240,255') + ',' + lu.toFixed(2) + ')';
      ctx.fillRect(ex, ey, 1, 1);
      if (lu > 0.92) {
        ctx.fillRect(ex - 1, ey, 3, 1);
        ctx.fillRect(ex, ey - 1, 1, 3);
      }
    }
  }

  // La souche qui reste, encore tiede d'etoiles.
  function dessinerSouche(ctx, sx, sy, t, graine) {
    var px = Math.round(sx - TS / 2), py = Math.round(sy - TS);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fillRect(px + 2, py + TS - 5, TS - 4, 4);
    ctx.fillStyle = '#241a36'; ctx.fillRect(px + 4, py + 11, TS - 8, TS - 13);
    ctx.fillStyle = '#3a2a58'; ctx.fillRect(px + 4, py + 11, 4, TS - 13);
    ctx.fillStyle = '#4a3aa8'; ctx.fillRect(px + 4, py + 9, TS - 8, 4);
    ctx.fillStyle = '#7a64e8'; ctx.fillRect(px + 6, py + 10, TS - 12, 2);
    ctx.fillStyle = '#140f38'; ctx.fillRect(px + 9, py + 10, TS - 18, 2);
    // Une etincelle qui s'echappe de loin en loin.
    if (!reduit) {
      var ph = ((t / 1600) + graine * 0.13) % 1;
      ctx.fillStyle = 'rgba(200,184,255,' + (0.9 * (1 - ph)).toFixed(2) + ')';
      ctx.fillRect(px + 10 + Math.round(Math.sin(ph * 6 + graine) * 3), py + 8 - Math.round(ph * 14), 1, 1);
    }
  }

  // La souche du recoin, avec la hache plantee dedans, fer en bas.
  function dessinerHacheplantee(ctx, sx, sy, t) {
    var h = hache();
    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy - 12));
    ctx.scale(1, -1);
    ctx.drawImage(h, -9, -8);
    ctx.restore();
    // Un eclat sur le fer, de temps en temps : de quoi l'apercevoir.
    if (!reduit && Math.floor(t / 1900) % 3 === 0) {
      var k = (t % 1900) / 1900;
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - k).toFixed(2) + ')';
      ctx.fillRect(Math.round(sx) - 6, Math.round(sy) - 14, 3, 1);
      ctx.fillRect(Math.round(sx) - 5, Math.round(sy) - 15, 1, 3);
    }
  }

  window.COSMOS = {
    CODE: CODE, MORCEAUX: MORCEAUX, ARBRES: ARBRES, HACHE: HACHE,
    arbreEn: arbreEn, abattu: abattu, morceaux: morceaux,
    hache: hache, fragment: fragment, hacheUrl: hacheUrl, fragmentUrl: fragmentUrl,
    dessinerArbre: dessinerArbre, dessinerSouche: dessinerSouche,
    dessinerHacheplantee: dessinerHacheplantee
  };
})();
