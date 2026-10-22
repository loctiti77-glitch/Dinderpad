// The Odyssey of Dinder, a la premiere personne.
//
// Un moteur a lancer de rayons, a la maniere des premiers jeux de tir
// en vue subjective : la carte reste la grille de 120 x 84 cases de
// js/odyssey-terrain.js, mais on la parcourt a hauteur d'yeux.
//   - les cretes de roche, les champs de cristal et les structures se
//     dressent en murs textures, peints au pixel a partir de la palette
//     de l'astre ;
//   - le sol est celui de la carte vue du dessus, plaque a plat : les
//     memes nappes, le meme grain, les memes gravats ;
//   - les liquides ondulent et renvoient le ciel ;
//   - la vegetation, les ruines, les creatures, les coffres... sont des
//     panneaux toujours tournes vers nous. Pour tout ce que le jeu
//     dessinait deja (betes, noeuds, coffres, curiosites), on reprend son
//     dessin tel quel : il est peint dans une petite toile, puis pose dans
//     la scene a la bonne distance.
//
// Le moteur garde l'interface de la promenade de js/game-monde.js
// (chef, caseDuChef, caseDevant, tuile, libre...) : la logique du jeu n'a
// presque pas a changer. Il ajoute l'angle de vue (chef.ang), la
// projection d'un point du monde a l'ecran, et la plongee : une seconde
// grille ou le liquide devient l'espace libre et les berges les murs.
//
// Les positions restent en pixels de carte (24 par case). Les hauteurs
// aussi : les yeux sont a 20 px du sol, les murs en font 46.
(function () {
  var M = window.MONDE;
  if (!M) return;
  var TS = M.TS, T = M.T, bruit = M.bruit;
  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var FOV = 66 * Math.PI / 180, TAN = Math.tan(FOV / 2);
  var OEIL = 20, H_MUR = 46, H_SURFACE = 64;
  var HAUT_IMAGE = 200;                  // la hauteur de l'image, en pixels

  // ==========================================================
  //  Les couleurs
  // ==========================================================
  function rgb(c) {
    if (!c) return [128, 128, 128];
    if (c[0] === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var m = c.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function mel(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function fois(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function paq(c) {
    return ((255 << 24) | ((Math.max(0, Math.min(255, c[2])) & 255) << 16) |
            ((Math.max(0, Math.min(255, c[1])) & 255) << 8) | (Math.max(0, Math.min(255, c[0])) & 255)) >>> 0;
  }
  function css(c, a) {
    return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')';
  }
  function hexa(c) { return css(c); }
  function lum(c) { return c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; }

  function toile(L, H) {
    var c = document.createElement('canvas');
    c.width = L; c.height = H;
    return c;
  }

  // Un petit pinceau : des rectangles pleins, comme partout dans le jeu.
  function pinceau(x) {
    return function (px, py, w, h, c) {
      x.fillStyle = typeof c === 'string' ? c : hexa(c);
      x.fillRect(Math.round(px), Math.round(py), Math.round(w), Math.round(h));
    };
  }

  // Lit les pixels d'une toile en entiers 32 bits.
  function pixels(c) {
    var x = c.getContext('2d');
    return new Uint32Array(x.getImageData(0, 0, c.width, c.height).data.buffer);
  }

  // ==========================================================
  //  Les textures des murs
  // ==========================================================
  // 32 x 48 : la largeur d'une case, la hauteur d'un mur. Trois variantes
  // par sorte de mur, pour qu'une crete ne soit pas une frise.
  var TL = 32, TH = 48;

  function texRoche(P, v) {
    var c = toile(TL, TH), x = c.getContext('2d'), p = pinceau(x), i;
    var R = rgb(P.roche), Rh = rgb(P.rocheHaut), Ro = rgb(P.rocheOmbre);
    p(0, 0, TL, TH, R);
    // Des strates, plus ou moins marquees.
    for (var y = 0; y < TH; y++) {
      var n = bruit(v, y, 501);
      if (n < 0.16) p(0, y, TL, 1, mel(R, Ro, 0.6));
      else if (n > 0.88) p(0, y, TL, 1, mel(R, Rh, 0.5));
    }
    // Des blocs, eclaires par le haut a gauche.
    for (i = 0; i < 8; i++) {
      var bx = (bruit(v, i, 510) * 26) | 0, by = (bruit(v, i, 511) * 40) | 0;
      var w = 5 + ((bruit(v, i, 512) * 11) | 0), h = 4 + ((bruit(v, i, 513) * 9) | 0);
      p(bx + 1, by + 1, w - 1, h - 1, mel(R, Rh, 0.18 + bruit(v, i, 514) * 0.2));
      p(bx, by, w, 1, Rh);
      p(bx, by, 1, h, mel(R, Rh, 0.6));
      p(bx, by + h, w + 1, 1, Ro);
      p(bx + w, by, 1, h, Ro);
    }
    // Les fissures.
    for (i = 0; i < 3; i++) {
      var fx = (bruit(v, i, 520) * 30) | 0, fy = (bruit(v, i, 521) * 30) | 0;
      for (var k = 0; k < 10; k++) {
        p(fx + ((bruit(v, i * 10 + k, 522) * 3) | 0) - 1, fy + k, 1, 1, Ro);
        fx += bruit(v, i * 10 + k, 523) < 0.5 ? -1 : 1;
      }
    }
    // Le grain.
    for (i = 0; i < 70; i++) {
      p((bruit(v, i, 530) * TL) | 0, (bruit(v, i, 531) * TH) | 0, 1, 1, i % 3 ? Ro : Rh);
    }
    // Le sommet en pleine lumiere, le pied dans l'ombre.
    p(0, 0, TL, 2, Rh);
    p(0, 2, TL, 1, mel(R, Rh, 0.5));
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, TH - 8, TL, 8);
    x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(0, TH - 3, TL, 3);
    return c;
  }

  function texCristal(P, v) {
    var c = toile(TL, TH), x = c.getContext('2d'), p = pinceau(x), i;
    var C = rgb(P.cristal), C2 = rgb(P.cristal2), fond = mel(C, [8, 10, 20], 0.62);
    p(0, 0, TL, TH, fond);
    // Des eclats verticaux, plantes de biais, plus clairs sur l'arete.
    for (i = 0; i < 6; i++) {
      var cx = (bruit(v, i, 540) * 28) | 0, haut = 14 + ((bruit(v, i, 541) * 32) | 0);
      var w = 4 + ((bruit(v, i, 542) * 5) | 0), base = TH;
      for (var y = 0; y < haut; y++) {
        var ww = Math.max(1, Math.round(w * Math.min(1, y / 6)));
        p(cx - (ww >> 1), base - haut + y, ww, 1, mel(C, fond, 0.15 + 0.4 * (1 - y / haut)));
        p(cx - (ww >> 1), base - haut + y, 1, 1, C2);
      }
      p(cx, base - haut, 1, 2, [255, 255, 255]);
    }
    // Des lueurs prises dans la masse.
    for (i = 0; i < 14; i++) p((bruit(v, i, 545) * TL) | 0, (bruit(v, i, 546) * TH) | 0, 1, 1, i % 2 ? C2 : [255, 255, 255]);
    p(0, 0, TL, 1, C2);
    return c;
  }

  function texStructure(P, v) {
    var c = toile(TL, TH), x = c.getContext('2d'), p = pinceau(x);
    var S = rgb(P.structure), Sh = rgb(P.structureHaut), So = fois(S, 0.62);
    p(0, 0, TL, TH, S);
    // Les panneaux, et leurs biseaux.
    [[0, 0, 16, 22], [16, 0, 16, 22], [0, 22, 32, 14], [0, 36, 10, 12], [10, 36, 22, 12]].forEach(function (q) {
      p(q[0], q[1], q[2], 1, Sh); p(q[0], q[1], 1, q[3], Sh);
      p(q[0], q[1] + q[3] - 1, q[2], 1, So); p(q[0] + q[2] - 1, q[1], 1, q[3], So);
      p(q[0] + 2, q[1] + 2, 1, 1, So); p(q[0] + q[2] - 3, q[1] + 2, 1, 1, So);
    });
    if (v === 1) {
      // Une fenetre eclairee.
      p(5, 6, 8, 10, [10, 14, 22]); p(6, 7, 6, 8, [124, 240, 200]); p(6, 7, 6, 2, [210, 255, 240]);
    } else if (v === 2) {
      // Une grille d'aeration.
      for (var k = 0; k < 4; k++) p(4, 25 + k * 3, 24, 1, So);
      p(26, 40, 2, 2, [255, 90, 74]);
    } else {
      p(20, 8, 6, 2, [124, 240, 200]);
    }
    p(0, 0, TL, 2, Sh);
    x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(0, TH - 4, TL, 4);
    return c;
  }

  function texCabane(v) {
    var c = toile(TL, TH), x = c.getContext('2d'), p = pinceau(x);
    var B = [138, 90, 42], Bo = [74, 46, 18], Bh = [184, 130, 74];
    p(0, 0, TL, TH, B);
    for (var k = 0; k < 4; k++) {
      p(k * 8, 0, 1, TH, Bo);
      p(k * 8 + 1, 0, 1, TH, Bh);
      for (var n = 0; n < 3; n++) p(k * 8 + 3 + ((bruit(v, k * 3 + n, 550) * 4) | 0), (bruit(v, k * 3 + n, 551) * 40) | 0, 1, 4, Bo);
    }
    // Le toit, qui deborde.
    p(0, 0, TL, 9, [120, 46, 36]); p(0, 8, TL, 2, [60, 24, 18]);
    for (k = 0; k < 8; k++) p(k * 4 + (k % 2) * 2, 2 + (k % 3) * 2, 3, 1, [160, 70, 54]);
    if (v === 1) { p(10, 20, 12, 10, [40, 30, 20]); p(11, 21, 10, 8, [255, 210, 120]); p(15, 21, 1, 8, [40, 30, 20]); }
    return c;
  }

  // Les berges, vues de sous la surface : la roche de l'astre, noyee
  // dans la couleur du liquide, et des algues accrochees.
  function texBerge(P, v) {
    var c = texRoche(P, v + 7), x = c.getContext('2d'), p = pinceau(x);
    var L = rgb(P.liquide), F = rgb(P.flore || P.liquide2);
    x.fillStyle = css(mel(L, [0, 0, 0], 0.45), 0.68);
    x.fillRect(0, 0, TL, TH);
    for (var i = 0; i < 7; i++) {
      var ax = (bruit(v, i, 560) * 30) | 0, h = 6 + ((bruit(v, i, 561) * 16) | 0);
      for (var y = 0; y < h; y++) p(ax + Math.round(Math.sin(y * 0.6 + i) * 1.2), TH - y, 1, 1, mel(F, L, 0.3 + y / h * 0.4));
    }
    for (i = 0; i < 10; i++) p((bruit(v, i, 565) * TL) | 0, (bruit(v, i, 566) * 24) | 0, 2, 1, mel(rgb(P.ecume), L, 0.5));
    return c;
  }

  // ==========================================================
  //  Les panneaux de decor
  // ==========================================================
  // Chacun est une petite toile, les pieds en bas au milieu (ax, ay).
  function panneau(L, H) { var c = toile(L, H); return { c: c, x: c.getContext('2d'), ax: L / 2, ay: H - 1 }; }

  function ovale(p, cx, cy, rx, ry, col) {
    for (var y = -ry; y <= ry; y++) {
      var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
      if (w > 0) p(cx - w, cy + y, w * 2, 1, col);
    }
  }

  function grandePlante(P, v) {
    var style = P.plante || 'arbre';
    var f = rgb(P.flore || '#5a7a3a'), f2 = rgb(P.flore2 || '#8ab05a'), fo = fois(f, 0.6);
    var tr = rgb(P.tronc || M.teinte(P.roche || '#6a5a4a', 0.9)), trO = fois(tr, 0.65), fl = rgb(P.fleur || '#e8d27a');
    var h = bruit(v, 3, 350), s, p, i;
    if (style === 'arbre') {
      s = panneau(48, 70); p = pinceau(s.x);
      p(21, 34, 6, 35, tr); p(25, 34, 2, 35, trO); p(21, 34, 1, 35, mel(tr, [255, 255, 255], 0.2));
      p(17, 66, 14, 3, trO); p(15, 68, 18, 2, fois(trO, 0.8));
      p(14, 42, 7, 2, tr); p(27, 38, 8, 2, tr);
      var rr = 16 + ((h * 5) | 0);
      ovale(p, 24, 26, rr + 3, rr - 2, fo);
      ovale(p, 22, 22, rr, rr - 4, f);
      ovale(p, 18, 17, rr - 7, rr - 9, f2);
      ovale(p, 31, 30, 7, 5, fo);
      for (i = 0; i < 16; i++) p(8 + ((bruit(v, i, 600) * 32) | 0), 8 + ((bruit(v, i, 601) * 30) | 0), 2, 1, i % 3 ? fo : f2);
      if (h < 0.5) for (i = 0; i < 5; i++) p(10 + ((bruit(v, i, 602) * 28) | 0), 10 + ((bruit(v, i, 603) * 24) | 0), 2, 2, fl);
      return s;
    }
    if (style === 'fougere') {
      s = panneau(56, 66); p = pinceau(s.x);
      for (i = 0; i < 44; i++) p(26 + Math.round(Math.sin(i / 9) * 2), 64 - i, 4, 1, i % 6 ? tr : trO);
      for (var k = 0; k < 7; k++) {
        var a = -2.6 + k * 0.85, lg = 20 + ((bruit(v, k, 610) * 8) | 0);
        for (var j = 0; j < lg; j++) {
          var px = 28 + Math.cos(a) * j, py = 20 + Math.sin(a) * j * 0.6 + (j * j) * 0.035;
          p(px, py, 2, 2, j % 4 === 0 ? f2 : f);
          if (j % 3 === 0) p(px, py + 2, 1, 3, fo);
        }
      }
      ovale(p, 28, 20, 4, 3, f2);
      return s;
    }
    if (style === 'champignon') {
      s = panneau(50, 58); p = pinceau(s.x);
      var cr = rgb(P.cristal2 || '#e8e0d0');
      p(20, 26, 10, 31, cr); p(27, 26, 3, 31, fois(cr, 0.8)); p(18, 54, 14, 3, fois(cr, 0.7));
      ovale(p, 25, 22, 23, 6, fois(f, 0.5));
      ovale(p, 25, 16, 22, 12, f);
      ovale(p, 21, 12, 13, 6, f2);
      p(4, 22, 42, 2, fo);
      for (i = 0; i < 9; i++) ovale(p, 8 + ((bruit(v, i, 620) * 34) | 0), 8 + ((bruit(v, i, 621) * 10) | 0), 2, 1, fl);
      return s;
    }
    if (style === 'cactus') {
      s = panneau(36, 66); p = pinceau(s.x);
      p(13, 6, 10, 60, f); p(14, 6, 2, 60, f2); p(20, 6, 2, 60, fo); p(13, 4, 10, 3, f);
      p(3, 26, 10, 6, f); p(3, 12, 6, 18, f); p(4, 12, 1, 18, f2);
      p(23, 34, 10, 6, f); p(27, 18, 6, 20, f); p(31, 18, 1, 20, fo);
      for (i = 0; i < 18; i++) p(13 + (i % 3) * 4, 8 + i * 3, 1, 1, [255, 255, 230]);
      p(16, 0, 4, 4, fl); p(17, 1, 2, 2, [255, 255, 255]);
      return s;
    }
    if (style === 'corail') {
      s = panneau(48, 56); p = pinceau(s.x);
      [[24, 55, 0, 30], [24, 34, -0.7, 16], [24, 34, 0.7, 18], [24, 40, -1.2, 14], [24, 42, 1.1, 13]].forEach(function (b, n) {
        for (var j = 0; j < b[3]; j++) {
          var px2 = b[0] + Math.sin(b[2]) * j, py2 = b[1] - Math.cos(b[2]) * j - (n ? 0 : 0);
          p(px2 - 2, py2, 4, 2, j % 5 ? f : fo);
          if (j === b[3] - 1) ovale(p, px2, py2 - 1, 3, 2, f2);
        }
      });
      for (i = 0; i < 8; i++) p(12 + ((bruit(v, i, 630) * 24) | 0), 10 + ((bruit(v, i, 631) * 34) | 0), 1, 1, fl);
      return s;
    }
    if (style === 'flamme') {
      s = panneau(30, 66); p = pinceau(s.x);
      p(7, 22, 16, 44, tr); p(7, 22, 3, 44, mel(tr, [255, 255, 255], 0.2)); p(20, 22, 3, 44, trO);
      for (i = 0; i < 6; i++) p(9, 28 + i * 7, 11, 1, trO);
      ovale(p, 15, 16, 8, 9, f); ovale(p, 15, 12, 5, 9, fl); ovale(p, 15, 13, 2, 4, [255, 244, 176]);
      p(14, 0, 2, 4, fl);
      return s;
    }
    // Les eclats : pics de roche ou de metal, aiguilles de glace, prismes.
    s = panneau(40, 70); p = pinceau(s.x);
    var piques = [[20, 60 + ((h * 8) | 0), 7], [10, 34 + ((bruit(v, 1, 640) * 12) | 0), 5], [30, 40 + ((bruit(v, 2, 640) * 14) | 0), 5]];
    piques.forEach(function (q) {
      for (var y = 0; y < q[1]; y++) {
        var w = Math.max(1, Math.round(q[2] * (y / q[1]) + 1));
        var yy = 69 - q[1] + y;
        p(q[0] - w, yy, w * 2, 1, f);
        p(q[0] - w, yy, 1, 1, f2);
        p(q[0] + w - 1, yy, 1, 1, fo);
      }
      p(q[0] - 1, 69 - q[1], 2, 2, style === 'givre' ? [255, 255, 255] : f2);
    });
    if (style === 'prisme') for (i = 0; i < 6; i++) p(8 + ((bruit(v, i, 650) * 24) | 0), 20 + ((bruit(v, i, 651) * 40) | 0), 2, 2, fl);
    if (style === 'givre') for (i = 0; i < 8; i++) p(8 + ((bruit(v, i, 652) * 24) | 0), 26 + ((bruit(v, i, 653) * 40) | 0), 1, 1, [255, 255, 255]);
    return s;
  }

  function pilierRuine(P, v) {
    var s = panneau(24, 56), p = pinceau(s.x);
    var S = rgb(P.structure), Sh = rgb(P.structureHaut), Ro = rgb(P.rocheOmbre);
    var haut = 24 + ((bruit(v, 4, 360) * 28) | 0);
    p(3, 55 - haut, 18, haut, S); p(3, 55 - haut, 4, haut, Sh); p(17, 55 - haut, 4, haut, fois(S, 0.7));
    for (var i = 0; i < 3; i++) p(8 + i * 4, 58 - haut, 1, haut - 6, fois(S, 0.75));
    p(1, 51, 22, 5, Sh); p(1, 54, 22, 2, fois(S, 0.6));
    // Le sommet casse, en dents.
    p(4, 53 - haut, 4, 2, Sh); p(11, 52 - haut, 5, 3, S); p(17, 54 - haut, 3, 1, S);
    p(0, 53, 3, 2, Ro); p(21, 54, 3, 2, Ro);
    return s;
  }

  function touffe(P, v) {
    var s = panneau(22, 14), p = pinceau(s.x);
    var f = rgb(P.flore || '#5a7a3a'), f2 = rgb(P.flore2 || '#8ab05a'), fl = rgb(P.fleur || '#e8d27a');
    var style = P.plante || 'arbre';
    for (var i = 0; i < 6; i++) {
      var bx = 2 + ((bruit(v, i, 330) * 17) | 0), hh = 4 + ((bruit(v, i, 331) * 8) | 0);
      if (style === 'pic' || style === 'givre' || style === 'prisme') { p(bx, 13 - hh, 2, hh, f); p(bx, 13 - hh, 1, hh - 1, f2); }
      else if (style === 'flamme') { p(bx, 13 - hh, 2, hh, f); p(bx, 12 - hh, 1, 2, fl); }
      else {
        p(bx, 13 - hh, 1, hh, f); p(bx + 1, 13 - hh + 2, 1, hh - 2, f2);
        if (bruit(v, i, 332) < 0.25) p(bx - 1, 12 - hh, 3, 2, fl);
      }
    }
    return s;
  }

  // Sous la surface : des algues qui ondulent (deux poses), et des
  // coquilles accrochees au fond.
  function algue(P, v, pose) {
    var s = panneau(26, 60), p = pinceau(s.x);
    var L = rgb(P.liquide2), F = mel(rgb(P.flore || '#3a8a5a'), L, 0.25), F2 = mel(F, [255, 255, 255], 0.25);
    var brins = 2 + ((bruit(v, 1, 700) * 3) | 0);
    for (var b = 0; b < brins; b++) {
      var bx = 6 + b * 6 + ((bruit(v, b, 701) * 4) | 0), hh = 26 + ((bruit(v, b, 702) * 30) | 0);
      for (var y = 0; y < hh; y++) {
        var o = Math.sin(y / 7 + b + pose * 1.6) * (y / hh) * 4;
        p(bx + o, 59 - y, 3, 1, y % 9 < 2 ? F2 : F);
        if (y % 8 === 4) p(bx + o + (b % 2 ? 3 : -2), 59 - y, 2, 2, F);
      }
    }
    return s;
  }

  // ==========================================================
  //  Le ciel
  // ==========================================================
  // Un panorama de 360 degres, calcule une fois : le degrade du ciel de
  // l'astre, des etoiles s'il fait sombre, des astres dans le ciel, et
  // deux lignes de montagnes au loin.
  function panorama(PW, PH, HOR, ciel, P, astres) {
    var c = toile(PW, PH), x = c.getContext('2d'), p = pinceau(x);
    var c1 = rgb(ciel[0]), c2 = rgb(ciel[1]), c3 = rgb(ciel[2]);
    for (var y = 0; y < PH; y++) {
      var k = y / HOR;
      var col = k < 0.55 ? mel(c1, c2, k / 0.55) : k < 1 ? mel(c2, c3, (k - 0.55) / 0.45) : c3;
      p(0, y, PW, 1, col);
    }
    if (lum(c1) < 70) {
      for (var i = 0; i < PW * 0.35; i++) {
        var sx = (bruit(i, 1, 800) * PW) | 0, sy = (bruit(i, 2, 800) * HOR * 0.9) | 0;
        var b = 120 + bruit(i, 3, 800) * 135;
        p(sx, sy, 1, 1, [b, b, Math.min(255, b + 20)]);
        if (bruit(i, 4, 800) < 0.05) { p(sx - 1, sy, 3, 1, [b, b, b]); p(sx, sy - 1, 1, 3, [b, b, b]); }
      }
    }
    (astres || []).forEach(function (a) {
      var ax = Math.round(a.az * PW), ay = Math.round(HOR * (1 - a.haut)), r = a.r;
      var A = rgb(a.c1), B = rgb(a.c2 || a.c1);
      if (a.halo) {
        for (var h = 3; h >= 1; h--) {
          x.fillStyle = css(A, 0.08 * h);
          x.beginPath(); x.arc(ax, ay, r + h * r * 0.5, 0, 6.3); x.fill();
        }
      }
      for (var dx = -1; dx <= 1; dx++) {
        var cx = ax + dx * PW;
        ovale(p, cx, ay, r, r, A);
        ovale(p, cx - Math.round(r * 0.3), ay - Math.round(r * 0.3), Math.round(r * 0.55), Math.round(r * 0.55), mel(A, B, 0.6));
        if (a.bandes) for (var bb = -r + 2; bb < r; bb += 3) p(cx - r + 2, ay + bb, r * 2 - 4, 1, css(fois(A, 0.8), 0.6));
        if (a.anneau) {
          x.strokeStyle = css(B, 0.85); x.lineWidth = 1.5;
          x.beginPath(); x.ellipse(cx, ay, r * 1.9, r * 0.45, -0.25, 0, 6.3); x.stroke();
        }
        if (a.ombre) ovale(p, cx + Math.round(r * 0.35), ay, Math.round(r * 0.8), r, css([0, 0, 0], 0.35));
      }
    });
    // Les montagnes : des sommes de sinus a frequences entieres, pour que
    // la ligne se referme sur elle-meme apres un tour complet.
    function crete(sel, base, ampl, col) {
      for (var X = 0; X < PW; X++) {
        var u = X / PW * Math.PI * 2;
        var hh = Math.sin(u * 3 + sel) * 0.5 + Math.sin(u * 7 + sel * 2) * 0.3 + Math.sin(u * 17 + sel * 3) * 0.15 + Math.sin(u * 41 + sel) * 0.05;
        var top = Math.round(HOR - base - (hh * 0.5 + 0.5) * ampl);
        p(X, top, 1, PH - top, col);
      }
    }
    var R = rgb(P.roche || '#4a4642'), Ro = rgb(P.rocheOmbre || '#2e2b28');
    crete(1.3, 3, 16, mel(R, c3, 0.62));
    crete(4.1, 0, 9, mel(Ro, c3, 0.42));
    return c;
  }

  // Un bruit en tuile de 64 x 64, pour les reflets de l'eau et la lumiere
  // qui danse au fond.
  var CAUS = null, GRAIN = null;
  function preparerBruits() {
    if (CAUS) return;
    CAUS = new Uint8Array(64 * 64); GRAIN = new Uint8Array(64 * 64);
    for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
      var u = x / 64 * Math.PI * 2, v = y / 64 * Math.PI * 2;
      var c = Math.sin(u * 2 + Math.sin(v * 3) * 1.4) + Math.sin(v * 2 + Math.sin(u * 3) * 1.2) + Math.sin((u + v) * 3) * 0.5;
      c = 1 - Math.abs(c) / 2.5;
      CAUS[y * 64 + x] = Math.max(0, Math.min(255, Math.pow(Math.max(0, c), 5) * 255));
      GRAIN[y * 64 + x] = (bruit(x, y, 900) * 120 + bruit(x >> 2, y >> 2, 901) * 135) | 0;
    }
  }

  // ==========================================================
  //  La promenade a la premiere personne
  // ==========================================================
  var CLAVIER = {
    z: 'av', w: 'av', Z: 'av', W: 'av', ArrowUp: 'av',
    s: 'ar', S: 'ar', ArrowDown: 'ar',
    q: 'g', a: 'g', Q: 'g', A: 'g',
    d: 'd', D: 'd',
    ArrowLeft: 'tg', ArrowRight: 'td'
  };

  function Balade(cfg) {
    preparerBruits();
    var g = cfg.grille, surface = g;
    var MH = g.length, MW = g[0].length;
    var P = (cfg.opts && cfg.opts.palette) || {};
    var cv = cfg.canvas;
    // L'image est basse, et le navigateur l'agrandit sans lisser : c'est
    // ce qui donne son grain de vieux jeu de tir.
    var RH = HAUT_IMAGE;
    var RW = Math.max(240, Math.round(cv.width * RH / cv.height / 2) * 2);
    cv.width = RW; cv.height = RH;
    var ctx = cv.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    var image = ctx.createImageData(RW, RH), buf = new Uint32Array(image.data.buffer);
    var zbuf = new Float32Array(RW);
    var F = (RW / 2) / TAN;
    var DIRS = (window.CHIBI && window.CHIBI.DIRS) || { bas: 0, gauche: 1, droite: 2, haut: 3 };

    var chef = { x: cfg.depart.x, y: cfg.depart.y, ang: cfg.angle != null ? cfg.angle : -Math.PI / 2,
                 dir: DIRS.haut, pas: 0, bouge: false };
    if (cfg.angle == null && cfg.direction != null) {
      chef.ang = cfg.direction === DIRS.bas ? Math.PI / 2 : cfg.direction === DIRS.gauche ? Math.PI
               : cfg.direction === DIRS.droite ? 0 : -Math.PI / 2;
    }
    var vivant = true, dernier = 0, derniereCase = '', mode = 'surface', regard = 0;
    function vitesse() { return typeof cfg.vitesse === 'function' ? cfg.vitesse() : (cfg.vitesse || 86); }

    // ---------- Le sol ----------
    // La carte vue du dessus, sans ses objets : c'est elle qu'on plaque.
    var SW = MW * TS, SH = MH * TS;
    var sol = toile(SW, SH), solX = sol.getContext('2d');
    var ty, tx;
    for (ty = 0; ty < MH; ty++) for (tx = 0; tx < MW; tx++) M.solTuile(solX, g, tx, ty, cfg.opts);
    var solPx = pixels(sol);

    // ---------- Ce qui se dresse ----------
    // Pour chaque case : 0, ou le numero de sa texture de mur ; et si
    // c'est du liquide.
    var murs = new Int16Array(MW * MH), liq = new Uint8Array(MW * MH);
    var TEX = [], texIdx = {};
    function tex(nom, fabrique) {
      if (texIdx[nom] == null) {
        var c = fabrique();
        texIdx[nom] = TEX.length;
        TEX.push({ px: pixels(c), lueur: /cristal/.test(nom) });
      }
      return texIdx[nom] + 1;
    }
    function texDe(tu, x, y) {
      var v = (bruit(x, y, 77) * 3) | 0;
      if (mode === 'sous') return tex('berge' + v, function () { return texBerge(P, v); });
      if (cfg.texture) { var o = cfg.texture(x, y, tu); if (o === 'cabane') return tex('cabane' + v, function () { return texCabane(v); }); }
      if (tu === T.CRISTAL) return tex('cristal' + v, function () { return texCristal(P, v); });
      if (tu === T.STRUCTURE || tu === T.MUR || tu === T.CABANE || tu === T.TOIT) return tex('structure' + v, function () { return texStructure(P, v); });
      return tex('roche' + v, function () { return texRoche(P, v); });
    }
    var EST_MUR = {}, EST_LIQ = {};
    [T.ROCHE_A, T.ROCHER, T.CRISTAL, T.STRUCTURE, T.MUR, T.CABANE, T.TOIT].forEach(function (k) { EST_MUR[k] = true; });
    [T.LIQUIDE, T.EAU, T.EAU_RAD, T.ROSEAU].forEach(function (k) { EST_LIQ[k] = true; });

    function majCase(x, y) {
      var tu = g[y][x], i = y * MW + x;
      if (mode === 'sous') { murs[i] = tu === 1 ? texDe(tu, x, y) : 0; liq[i] = 0; return; }
      murs[i] = EST_MUR[tu] ? texDe(tu, x, y) : 0;
      liq[i] = EST_LIQ[tu] ? 1 : 0;
    }

    // Les panneaux de decor, ranges par paquets de 8 x 8 cases : on ne
    // regarde que les paquets assez proches.
    var PQ = 8, PQW = Math.ceil(MW / PQ), PQH = Math.ceil(MH / PQ), paquets = [];
    var modeles = {};
    function modele(nom, fabrique) { return modeles[nom] || (modeles[nom] = fabrique()); }
    function decorDe(x, y) {
      var tu = g[y][x], v = (bruit(x, y, 78) * 4) | 0;
      if (mode === 'sous') {
        if (tu !== 0) return null;
        // Des algues au fond, plus serrees pres des berges.
        var bord = (g[y - 1] && g[y - 1][x] === 1) || (g[y + 1] && g[y + 1][x] === 1) || g[y][x - 1] === 1 || g[y][x + 1] === 1;
        if (bruit(x, y, 79) > (bord ? 0.42 : 0.14)) return null;
        return { algue: true, v: v };
      }
      if (tu === T.PLANTE || tu === T.ARBRE || tu === T.ARBRE_FAUX || tu === T.BUISSON || tu === T.SOUCHE) {
        return { m: modele('plante' + v, function () { return grandePlante(P, v); }) };
      }
      if (tu === T.RUINE) return { m: modele('ruine' + v, function () { return pilierRuine(P, v); }) };
      if (tu === T.FLORE) return { m: modele('touffe' + v, function () { return touffe(P, v); }), petit: true };
      return null;
    }
    function remplirPaquet(px, py) {
      var liste = [];
      for (var y = py * PQ; y < Math.min(MH, (py + 1) * PQ); y++) {
        for (var x = px * PQ; x < Math.min(MW, (px + 1) * PQ); x++) {
          var d = decorDe(x, y);
          if (!d) continue;
          d.x = (x + 0.5) * TS + (bruit(x, y, 80) - 0.5) * (d.petit ? 10 : 4);
          d.y = (y + 0.5) * TS + (bruit(x, y, 81) - 0.5) * (d.petit ? 10 : 4);
          d.tx = x; d.ty = y;
          liste.push(d);
        }
      }
      paquets[py * PQW + px] = liste;
    }
    function toutPreparer() {
      MH = g.length; MW = g[0].length;
      for (var y = 0; y < MH; y++) for (var x = 0; x < MW; x++) majCase(x, y);
      for (var py = 0; py < PQH; py++) for (var px = 0; px < PQW; px++) remplirPaquet(px, py);
    }

    // ---------- Le ciel et le brouillard ----------
    var PW = Math.round(RW * Math.PI * 2 / FOV), PH = RH + 60, PHOR = (RH >> 1) + 30;
    var pano = null, panoPx = null;
    var brume, PRES, LOIN, lutEau = new Uint32Array(256), lutFond = new Uint32Array(256), lutPlafond = new Uint32Array(256);
    var brumeR, brumeV, brumeB;
    function ambiance() {
      var L = rgb(P.liquide || '#3a6ac8'), L2 = rgb(P.liquide2 || '#5a8ae8'), E = rgb(P.ecume || '#ffffff');
      var ciel = cfg.ciel || ['#000010', '#101030', '#303050'];
      var i;
      if (mode === 'sous') {
        brume = mel(L, [0, 4, 12], 0.7);
        PRES = TS * 0.2; LOIN = TS * 7.5;
        for (i = 0; i < 256; i++) {
          var k = i / 255;
          // Le fond : un sable dans la couleur du liquide, et la lumiere
          // qui danse dessus.
          lutFond[i] = paq(mel(mel(mel(rgb(P.sol2 || P.sol), L, 0.5), [0, 0, 0], 0.25), mel(E, L2, 0.3), Math.pow(k, 1.6) * 0.75));
          lutPlafond[i] = paq(mel(mel(L2, E, 0.25), [255, 255, 255], Math.pow(k, 2) * 0.8));
        }
      } else {
        brume = rgb(ciel[2]);
        PRES = TS * 5; LOIN = TS * 19;
        var reflet = rgb(ciel[1]);
        for (i = 0; i < 256; i++) {
          var kk = i / 255;
          var c = mel(mel(L, L2, kk * 0.8), reflet, 0.18);
          if (i > 225) c = mel(c, E, (i - 225) / 30);
          lutEau[i] = paq(c);
        }
        pano = panorama(PW, PH, PHOR, ciel, P, cfg.astres);
        panoPx = pixels(pano);
      }
      brumeR = brume[0]; brumeV = brume[1]; brumeB = brume[2];
    }

    // ---------- Les commandes ----------
    var touches = {}, stick = cfg.stick, pomme = cfg.pomme;
    var joy = { x: 0, y: 0 }, actif = false, rayon = 0, centre = { x: 0, y: 0 };
    function prendre(e) {
      var r = stick.getBoundingClientRect();
      rayon = r.width / 2; centre.x = r.left + rayon; centre.y = r.top + rayon;
      actif = true; stick.classList.add('is-actif');
      if (stick.setPointerCapture) { try { stick.setPointerCapture(e.pointerId); } catch (err) {} }
      bougerStick(e);
    }
    function bougerStick(e) {
      if (!actif) return;
      var dx = e.clientX - centre.x, dy = e.clientY - centre.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var k = Math.min(1, d / (rayon * 0.72));
      joy.x = dx / d * k; joy.y = dy / d * k;
      pomme.style.transform = 'translate(' + (joy.x * rayon * 0.5) + 'px,' + (joy.y * rayon * 0.5) + 'px)';
    }
    function lacherStick() {
      actif = false; joy.x = joy.y = 0;
      stick.classList.remove('is-actif'); pomme.style.transform = '';
    }
    if (stick) {
      stick.addEventListener('pointerdown', prendre);
      stick.addEventListener('pointermove', bougerStick);
      stick.addEventListener('pointerup', lacherStick);
      stick.addEventListener('pointercancel', lacherStick);
      stick.addEventListener('lostpointercapture', lacherStick);
    }

    function auClavier(e, bas) {
      var k = CLAVIER[e.key];
      if (!k) return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      touches[k] = bas;
      e.preventDefault();
    }
    var kd = function (e) { auClavier(e, true); }, ku = function (e) { auClavier(e, false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    // Une fenetre qui perd la main ne garde pas de touche enfoncee.
    var flou = function () { touches = {}; };
    window.addEventListener('blur', flou);

    // La souris : un clic verrouille le pointeur, et la souris tourne la
    // tete. Clic gauche : tirer ; clic droit : scanner.
    var verrou = false;
    function fige() { return !!(cfg.fige && cfg.fige()); }
    var surVerrou = function () {
      verrou = document.pointerLockElement === cv;
      if (cfg.surVerrou) cfg.surVerrou(verrou);
    };
    var surSouris = function (e) {
      if (!verrou) return;
      regard += (e.movementX || 0) * 0.0026;
    };
    var surClic = function (e) {
      if (!verrou) return;
      if (e.button === 0 && cfg.surTir) cfg.surTir();
      else if (e.button === 2 && cfg.surScan) cfg.surScan();
    };
    document.addEventListener('pointerlockchange', surVerrou);
    document.addEventListener('mousemove', surSouris);
    document.addEventListener('mousedown', surClic);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // Au doigt (ou a la souris sans verrou) : on fait glisser pour tourner
    // la tete ; une touche breve tire.
    var glisse = null;
    cv.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') {
        if (verrou) return;
        if (!fige() && cv.requestPointerLock && !cfg.sansVerrou) {
          try { var r = cv.requestPointerLock(); if (r && r.catch) r.catch(function () {}); } catch (err) {}
          return;
        }
      }
      glisse = { id: e.pointerId, x: e.clientX, t0: performance.now(), bouge: 0 };
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    });
    cv.addEventListener('pointermove', function (e) {
      if (!glisse || e.pointerId !== glisse.id) return;
      var dx = e.clientX - glisse.x;
      glisse.x = e.clientX;
      glisse.bouge += Math.abs(dx);
      var w = cv.getBoundingClientRect().width || 400;
      regard += dx / w * FOV * 1.7;
    });
    function finGlisse(e) {
      if (!glisse || e.pointerId !== glisse.id) return;
      var bref = performance.now() - glisse.t0 < 260 && glisse.bouge < 8;
      glisse = null;
      if (bref && e.type === 'pointerup' && e.pointerType !== 'mouse' && cfg.surTir) cfg.surTir();
    }
    cv.addEventListener('pointerup', finGlisse);
    cv.addEventListener('pointercancel', finGlisse);

    function lacherVerrou() {
      if (verrou && document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} }
    }

    function arreter() {
      vivant = false;
      lacherVerrou();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', flou);
      document.removeEventListener('pointerlockchange', surVerrou);
      document.removeEventListener('mousemove', surSouris);
      document.removeEventListener('mousedown', surClic);
    }

    // ---------- Les collisions ----------
    function bloque(tu) {
      if (mode === 'sous') return tu !== 0;
      return M.BLOQUANT[tu] && !(cfg.traverse && cfg.traverse(tu));
    }
    function libre(x, y) {
      var r = 6;
      var b = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
      for (var i = 0; i < 4; i++) {
        var cx = Math.floor(b[i][0] / TS), cy = Math.floor(b[i][1] / TS);
        if (cx < 0 || cy < 0 || cx >= MW || cy >= MH) return false;
        if (bloque(g[cy][cx])) return false;
      }
      return true;
    }
    function deplacer(dx, dy) {
      var nx = chef.x + dx, ny = chef.y + dy, ok = false;
      if (libre(nx, chef.y)) { chef.x = nx; ok = true; }
      if (libre(chef.x, ny)) { chef.y = ny; ok = true; }
      return ok;
    }
    function caseDuChef() { return [Math.floor(chef.x / TS), Math.floor(chef.y / TS)]; }
    // La case juste devant les yeux.
    function caseDevant(loin) {
      var d = loin || TS * 0.85;
      return [Math.floor((chef.x + Math.cos(chef.ang) * d) / TS), Math.floor((chef.y + Math.sin(chef.ang) * d) / TS)];
    }
    function tuile(x, y) { return g[y] && g[y][x] !== undefined ? g[y][x] : null; }

    // ---------- La projection ----------
    var hor = RH >> 1, bob = 0;
    function projeter(x, y, h) {
      var rx = x - chef.x, ry = y - chef.y;
      var c = Math.cos(chef.ang), s = Math.sin(chef.ang);
      var prof = rx * c + ry * s;
      if (prof < 3) return null;
      var lat = -rx * s + ry * c, k = F / prof;
      return { x: RW / 2 + lat * k, y: hor + (OEIL - (h || 0)) * k, s: k, d: prof };
    }
    // Ce point est-il cache par un mur ?
    function visible(sx, prof) {
      var c = Math.round(sx);
      if (c < 0 || c >= RW) return false;
      return zbuf[c] > prof;
    }

    // ---------- Le rendu ----------
    var ombreEtage = toile(224, 232), ombreX = ombreEtage.getContext('2d');
    ombreX.imageSmoothingEnabled = false;
    var OAX = 112, OAY = 196;
    var basMur = new Int16Array(RW);

    function rendre(t) {
      var W = RW, H = RH, x, y;
      var dX = Math.cos(chef.ang), dY = Math.sin(chef.ang);
      var pX = -dY * TAN, pY = dX * TAN;
      var fr = brumeR, fv = brumeV, fb = brumeB, fogP = paq(brume);
      var sous = mode === 'sous';
      var temps = reduit ? 0 : t;

      // 1. Le ciel (ou la surface, vue d'en dessous).
      if (!sous) {
        var dec = Math.round((((chef.ang / (Math.PI * 2)) % 1) + 1) % 1 * PW) - (W >> 1);
        dec = ((dec % PW) + PW) % PW;
        for (y = 0; y <= hor && y < H; y++) {
          var py = Math.max(0, Math.min(PH - 1, y - hor + PHOR)), row = y * W, prow = py * PW;
          for (x = 0; x < W; x++) {
            var px = dec + x; if (px >= PW) px -= PW;
            buf[row + x] = panoPx[prow + px];
          }
        }
      } else {
        for (y = 0; y <= hor && y < H; y++) {
          var dvh = hor - y + 0.5;
          var dp = (H_SURFACE - OEIL) * F / dvh;
          var rowP = y * W;
          var kP = dp <= PRES ? 0 : dp >= LOIN ? 1 : (dp - PRES) / (LOIN - PRES);
          if (kP >= 1) { for (x = 0; x < W; x++) buf[rowP + x] = fogP; continue; }
          var cx0 = chef.x + dp * (dX - pX), cy0 = chef.y + dp * (dY - pY);
          var sx0 = dp * 2 * pX / W, sy0 = dp * 2 * pY / W;
          var dec1 = temps * 0.006, dec2 = temps * 0.004;
          for (x = 0; x < W; x++) {
            var ux = cx0 + sx0 * x, uy = cy0 + sy0 * x;
            var n = (CAUS[(((uy * 0.5 + dec1) | 0) & 63) * 64 + (((ux * 0.5) | 0) & 63)] +
                     CAUS[(((uy * 0.33) | 0) & 63) * 64 + (((ux * 0.33 - dec2) | 0) & 63)]) >> 1;
            var c = lutPlafond[n];
            buf[rowP + x] = melBrume(c, kP, fr, fv, fb);
          }
        }
      }

      // 2. Le sol.
      var a1 = temps * 0.012;
      for (y = hor + 1; y < H; y++) {
        var dist = OEIL * F / (y - hor);
        var rowS = y * W;
        var k = dist <= PRES ? 0 : dist >= LOIN ? 1 : (dist - PRES) / (LOIN - PRES);
        if (k >= 1) { for (x = 0; x < W; x++) buf[rowS + x] = fogP; continue; }
        var fx = chef.x + dist * (dX - pX), fy = chef.y + dist * (dY - pY);
        var stx = dist * 2 * pX / W, sty = dist * 2 * pY / W;
        for (x = 0; x < W; x++, fx += stx, fy += sty) {
          var col;
          if (fx < 0 || fy < 0 || fx >= SW || fy >= SH) col = fogP;
          else if (sous) {
            var nG = GRAIN[((fy | 0) & 63) * 64 + ((fx | 0) & 63)];
            var nC = CAUS[(((fy * 0.6 + a1) | 0) & 63) * 64 + (((fx * 0.6) | 0) & 63)];
            col = lutFond[Math.min(255, (nG >> 1) + (nC >> 1) + 20)];
          } else {
            var ti = ((fy / TS) | 0) * MW + ((fx / TS) | 0);
            if (liq[ti]) {
              var nE = (CAUS[(((fy * 0.7 + a1) | 0) & 63) * 64 + (((fx * 0.7) | 0) & 63)] +
                        CAUS[(((fy * 0.45) | 0) & 63) * 64 + (((fx * 0.45 + a1 * 0.7) | 0) & 63)]) >> 1;
              col = lutEau[nE];
            } else col = solPx[(fy | 0) * SW + (fx | 0)];
          }
          buf[rowS + x] = k > 0 ? melBrume(col, k, fr, fv, fb) : col;
        }
      }

      // 3. Les murs, colonne par colonne.
      var posX = chef.x / TS, posY = chef.y / TS;
      var loinCases = LOIN / TS + 1;
      for (x = 0; x < W; x++) {
        var camX = 2 * x / W - 1;
        var rX = dX + pX * camX, rY = dY + pY * camX;
        var mX = posX | 0, mY = posY | 0;
        var ddX = Math.abs(1 / rX), ddY = Math.abs(1 / rY);
        var stepX, stepY, sdX, sdY;
        if (rX < 0) { stepX = -1; sdX = (posX - mX) * ddX; } else { stepX = 1; sdX = (mX + 1 - posX) * ddX; }
        if (rY < 0) { stepY = -1; sdY = (posY - mY) * ddY; } else { stepY = 1; sdY = (mY + 1 - posY) * ddY; }
        var cote = 0, touche = 0, perp = 0;
        for (var pas = 0; pas < 64; pas++) {
          if (sdX < sdY) { sdX += ddX; mX += stepX; cote = 0; perp = sdX - ddX; }
          else { sdY += ddY; mY += stepY; cote = 1; perp = sdY - ddY; }
          if (perp > loinCases) break;
          if (mX < 0 || mY < 0 || mX >= MW || mY >= MH) break;
          touche = murs[mY * MW + mX];
          if (touche) break;
        }
        if (!touche || perp > loinCases) { zbuf[x] = 1e9; basMur[x] = hor; continue; }
        var dpx = Math.max(0.02, perp) * TS;
        zbuf[x] = dpx;
        var wallX = cote === 0 ? posY + perp * rY : posX + perp * rX;
        wallX -= Math.floor(wallX);
        var tX = (wallX * TL) | 0;
        if ((cote === 0 && rX < 0) || (cote === 1 && rY > 0)) tX = TL - 1 - tX;
        var haut = hor - (H_MUR - OEIL) * F / dpx, bas = hor + OEIL * F / dpx;
        var y0 = Math.max(0, Math.ceil(haut)), y1 = Math.min(H, Math.ceil(bas));
        basMur[x] = y1;
        var T0 = TEX[touche - 1], tpx = T0.px;
        var kw = dpx <= PRES ? 0 : dpx >= LOIN ? 1 : (dpx - PRES) / (LOIN - PRES);
        if (T0.lueur) kw *= 0.55;
        var ombre = cote === 1 ? 0.8 : 1;
        if (T0.lueur && !sous) ombre = 1;
        var aa = (1 - kw) * ombre, bR = fr * kw, bV = fv * kw, bB = fb * kw;
        var echY = TH / (bas - haut);
        for (y = y0; y < y1; y++) {
          var tY = ((y - haut) * echY) | 0;
          if (tY >= TH) tY = TH - 1;
          var cw = tpx[tY * TL + tX];
          buf[y * W + x] = (0xff000000 |
            ((((cw >> 16) & 255) * aa + bB) << 16) |
            ((((cw >> 8) & 255) * aa + bV) << 8) |
            ((cw & 255) * aa + bR)) >>> 0;
        }
      }

      ctx.putImageData(image, 0, 0);

      // 4. Les panneaux, du plus loin au plus pres.
      var liste = [];
      var cps = Math.ceil(LOIN / TS / PQ) + 1;
      var qx = Math.floor(chef.x / TS / PQ), qy = Math.floor(chef.y / TS / PQ);
      for (var jy = qy - cps; jy <= qy + cps; jy++) {
        if (jy < 0 || jy >= PQH) continue;
        for (var jx = qx - cps; jx <= qx + cps; jx++) {
          if (jx < 0 || jx >= PQW) continue;
          var paquet = paquets[jy * PQW + jx];
          if (!paquet) continue;
          for (var i = 0; i < paquet.length; i++) liste.push(paquet[i]);
        }
      }
      var extras = cfg.extras ? cfg.extras(t) : [];
      for (i = 0; i < extras.length; i++) liste.push(extras[i]);

      var vus = [];
      for (i = 0; i < liste.length; i++) {
        var e = liste[i];
        var ex = e.x, ey = e.y + (e.sol || 0);
        var rx = ex - chef.x, ry = ey - chef.y;
        var prof = rx * dX + ry * dY;
        if (prof < 4 || prof > LOIN) continue;
        if (e.petit && prof > LOIN * 0.45) continue;
        var lat = -rx * dY + ry * dX;
        if (Math.abs(lat) > prof * TAN + 60) continue;
        vus.push({ e: e, prof: prof, lat: lat });
      }
      vus.sort(function (a, b) { return b.prof - a.prof; });
      var tA = reduit ? 0 : Math.floor(t / 700) % 2;
      for (i = 0; i < vus.length; i++) {
        var v = vus[i], ech = F / v.prof, sxC = W / 2 + v.lat * ech, gy = hor + OEIL * ech;
        var kb = v.prof <= PRES ? 0 : (v.prof - PRES) / (LOIN - PRES);
        var alpha = Math.max(0, Math.min(1, 1 - kb * 1.05));
        // Le decor qu'on frole s'efface, au lieu de boucher toute la vue.
        if (!v.e.dessin && v.prof < 40) alpha *= Math.max(0, (v.prof - 14) / 26);
        if (alpha <= 0.02) continue;
        ctx.globalAlpha = alpha;
        if (v.e.algue) {
          var ma = modele('algue' + v.e.v + '-' + tA, function () { return algue(P, v.e.v, tA); });
          poser(ma.c, ma.ax, ma.ay, sxC, gy, ech, v.prof);
        } else if (v.e.m) {
          poser(v.e.m.c, v.e.m.ax, v.e.m.ay, sxC, gy, ech, v.prof);
        } else if (v.e.dessin) {
          ombreX.setTransform(1, 0, 0, 1, 0, 0);
          ombreX.clearRect(0, 0, 224, 232);
          ombreX.globalAlpha = 1;
          try { v.e.dessin(ombreX, OAX, OAY - (v.e.sol || 0), t); } catch (err) {}
          ombreX.setTransform(1, 0, 0, 1, 0, 0);
          poser(ombreEtage, OAX, OAY, sxC, gy, ech * (v.e.echelle || 1), v.prof);
        }
      }
      ctx.globalAlpha = 1;
    }

    // La brume : la couleur tire vers celle du lointain.
    function melBrume(c, k, r, v, b) {
      var a = 1 - k;
      return (0xff000000 |
        ((((c >> 16) & 255) * a + b * k) << 16) |
        ((((c >> 8) & 255) * a + v * k) << 8) |
        ((c & 255) * a + r * k)) >>> 0;
    }

    // Pose un panneau a l'ecran, en ne dessinant que les colonnes que
    // les murs ne cachent pas.
    function poser(src, ax, ay, sx, gy, ech, prof) {
      var dw = src.width * ech, dh = src.height * ech;
      var dx = sx - ax * ech, dy = gy - ay * ech;
      var x0 = Math.max(0, Math.floor(dx)), x1 = Math.min(RW, Math.ceil(dx + dw));
      if (x1 <= x0 || dy > RH || dy + dh < 0) return;
      var debut = -1;
      for (var c = x0; c <= x1; c++) {
        var vu = c < x1 && zbuf[c] > prof;
        if (vu && debut < 0) debut = c;
        else if (!vu && debut >= 0) {
          var srcX = (debut - dx) / ech, srcW = (c - debut) / ech;
          if (srcW > 0) ctx.drawImage(src, srcX, 0, srcW, src.height, debut, dy, c - debut, dh);
          debut = -1;
        }
      }
    }

    // ---------- La boucle ----------
    function sensDe(a) {
      var c = Math.cos(a), s = Math.sin(a);
      if (Math.abs(c) > Math.abs(s)) return c > 0 ? DIRS.droite : DIRS.gauche;
      return s > 0 ? DIRS.bas : DIRS.haut;
    }

    function boucle(t) {
      if (!vivant) return;
      if (cfg.vivant && !cfg.vivant()) { arreter(); return; }
      var dt = dernier ? Math.min(0.05, (t - dernier) / 1000) : 0;
      dernier = t;

      var gel = fige();
      if (gel && verrou) lacherVerrou();
      var av = (touches.av ? 1 : 0) - (touches.ar ? 1 : 0) - joy.y;
      var la = (touches.d ? 1 : 0) - (touches.g ? 1 : 0) + joy.x;
      var tourne = (touches.td ? 1 : 0) - (touches.tg ? 1 : 0);
      if (!gel || cfg.regardLibre) {
        chef.ang += tourne * 2.3 * dt + regard;
      }
      regard = 0;
      chef.ang = Math.atan2(Math.sin(chef.ang), Math.cos(chef.ang));
      var n = Math.sqrt(av * av + la * la);
      if (n > 1) { av /= n; la /= n; }
      chef.bouge = !gel && (Math.abs(av) > 0.05 || Math.abs(la) > 0.05);
      if (chef.bouge) {
        var V = vitesse() * dt, c = Math.cos(chef.ang), s = Math.sin(chef.ang);
        deplacer((c * av - s * la) * V, (s * av + c * la) * V);
        chef.pas += Math.sqrt(av * av + la * la) * dt * 9;
      }
      chef.dir = sensDe(chef.ang);
      if (cfg.pousse) cfg.pousse(dt, chef);
      bob = reduit || !chef.bouge ? 0 : Math.round(Math.sin(chef.pas) * (mode === 'sous' ? 1.5 : 1.2));
      if (mode === 'sous' && !reduit) bob += Math.round(Math.sin(t / 900) * 1.5);
      hor = (RH >> 1) + bob;

      var cc = caseDuChef(), casier = cc[0] + ',' + cc[1];
      if (casier !== derniereCase) {
        derniereCase = casier;
        if (cfg.surCase && mode === 'surface') cfg.surCase(cc[0], cc[1], tuile(cc[0], cc[1]));
      }

      rendre(t);
      if (cfg.apres) {
        ctx.save();
        try { cfg.apres(ctx, api.vue, t); } catch (e) { if (window.console) console.error(e); }
        ctx.restore();
      }
      if (cfg.chaqueImage) cfg.chaqueImage(t);
      requestAnimationFrame(boucle);
    }

    // ---------- Changer de monde : plonger, remonter ----------
    // o.grille : en mode "sous", 0 = l'eau libre, 1 = la berge.
    function changer(o) {
      mode = o.mode || 'surface';
      g = o.grille || surface;
      chef.x = o.x; chef.y = o.y;
      if (o.ang != null) chef.ang = o.ang;
      derniereCase = '';
      toutPreparer();
      ambiance();
    }

    // Une case a change (un rocher casse, une plante coupee) : on
    // repeint le sol autour et on refait son paquet de decor.
    function repeindre(x, y) {
      if (mode !== 'surface') return;
      var i, j;
      for (j = y - 1; j <= y + 1; j++) for (i = x - 1; i <= x + 1; i++) {
        if (i < 0 || j < 0 || i >= MW || j >= MH) continue;
        solX.clearRect(i * TS, j * TS, TS, TS);
        M.solTuile(solX, g, i, j, cfg.opts);
        majCase(i, j);
      }
      var x0 = Math.max(0, (x - 1) * TS), y0 = Math.max(0, (y - 1) * TS);
      var w = Math.min(SW - x0, TS * 3), h = Math.min(SH - y0, TS * 3);
      var morceau = new Uint32Array(solX.getImageData(x0, y0, w, h).data.buffer);
      for (j = 0; j < h; j++) solPx.set(morceau.subarray(j * w, (j + 1) * w), (y0 + j) * SW + x0);
      remplirPaquet(Math.floor(x / PQ), Math.floor(y / PQ));
    }

    toutPreparer();
    ambiance();
    requestAnimationFrame(boucle);

    var api = {
      chef: chef, cam: { x: 0, y: 0 }, arreter: arreter,
      caseDuChef: caseDuChef, caseDevant: caseDevant, tuile: tuile,
      libre: libre, deplacer: deplacer, monde: sol, DIRS: DIRS,
      repeindre: repeindre, changer: changer, projeter: projeter, visible: visible,
      mode: function () { return mode; },
      verrouille: function () { return verrou; },
      lacherVerrou: lacherVerrou,
      vue: { projeter: projeter, visible: visible, L: RW, H: RH, F: F,
             hor: function () { return hor; }, bob: function () { return bob; } }
    };
    return api;
  }

  window.ODYFPS = {
    Balade: Balade, OEIL: OEIL, H_MUR: H_MUR, FOV: FOV,
    rgb: rgb, mel: mel, css: css, toile: toile, pinceau: pinceau, ovale: ovale
  };
})();
