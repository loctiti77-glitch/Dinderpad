// Le moteur de carte des mini-jeux : les tuiles, leur dessin, et la
// promenade au joystick.
//
// Il est partage par The Founder War et la Peche. Chaque jeu fournit sa
// grille de tuiles et ses ajouts de decor ; tout ce qui concerne le
// terrain, la camera, les collisions et le pas des personnages vit ici.
(function () {

  var TS = 24;                            // la taille d'une case, en pixels

  var T = {
    HERBE: 0, FLEUR: 1, CHEMIN: 2, ARBRE: 3, BUISSON: 4, ROCHER: 5,
    EAU: 6, MUR: 7, DALLE: 8, PORTE: 9, SABLE: 10, PONTON: 11, ROSEAU: 12,
    CABANE: 13, TOIT: 14, PORTE_BOIS: 15, EAU_RAD: 16, SOUCHE: 17,
    // Les tuiles des autres mondes. Elles n'ont pas de couleur a elles :
    // chaque astre fournit sa palette, et le meme jeu de sept tuiles
    // donne huit planetes qui ne se ressemblent pas.
    SOL: 18, SOL_B: 19, GRAVATS: 20, ROCHE_A: 21, LIQUIDE: 22,
    CRISTAL: 23, STRUCTURE: 24,
    // Un arbre cosmique de Fish n'Der. La carte ne le peint pas : il
    // scintille, puis tombe sous la hache, et c'est le jeu qui le dessine.
    ARBRE_COSMOS: 25,
    // Un arbre qui n'en est pas un : il se dessine comme les autres, mais
    // on passe au travers. Le niveau 6 de The Founder War en cache.
    ARBRE_FAUX: 26,
    // Les grandes cartes de l'Odyssee : une touffe qu'on traverse, une
    // grande plante et un pilier de ruine qui barrent le passage.
    FLORE: 27, PLANTE: 28, RUINE: 29
  };

  // Ce qu'on ne traverse pas. L'eau se longe, elle ne se marche pas.
  var BLOQUANT = {};
  [T.ARBRE, T.BUISSON, T.ROCHER, T.EAU, T.EAU_RAD, T.MUR, T.ROSEAU,
   T.CABANE, T.TOIT, T.SOUCHE, T.ARBRE_COSMOS,
   T.ROCHE_A, T.LIQUIDE, T.CRISTAL, T.STRUCTURE, T.PLANTE, T.RUINE].forEach(function (k) {
    BLOQUANT[k] = true;
  });

  // Tout ce qui se peche : l'eau claire, les joncs, et l'eau irradiee.
  function estEau(t) { return t === T.EAU || t === T.ROSEAU || t === T.EAU_RAD; }

  // Un bruit stable : la meme case est toujours dessinee pareil, d'une
  // partie a l'autre et d'un joueur a l'autre.
  function bruit(x, y, sel) {
    var h = (x | 0) * 374761393 + (y | 0) * 668265263 + (sel || 0) * 2147483647;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function borne(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // Deux couleurs melangees, k de l'une vers l'autre.
  var melanges = {};
  function melange(c1, c2, k) {
    var cle = c1 + c2 + k;
    if (melanges[cle]) return melanges[cle];
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k);
    var v = Math.round(((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k);
    var u = Math.round((a & 255) * (1 - k) + (b & 255) * k);
    return (melanges[cle] = 'rgb(' + r + ',' + v + ',' + u + ')');
  }

  // Un bruit lisse, interpole : des nappes plutot que du sel.
  function nappe(x, y, ech, sel) {
    var gx = x / ech, gy = y / ech, x0 = Math.floor(gx), y0 = Math.floor(gy);
    var u = gx - x0, v = gy - y0;
    u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    var a = bruit(x0, y0, sel), b = bruit(x0 + 1, y0, sel), c = bruit(x0, y0 + 1, sel), d = bruit(x0 + 1, y0 + 1, sel);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  // Les feuillages d'automne : ombre, masse, lumiere, taches. Du brun de
  // noix au roux, avec un arbre jaune de loin en loin.
  var AUTOMNE = [
    ['#4a2a14', '#6e3f1c', '#8f5a2a', '#3a200e'],
    ['#5a3016', '#83461c', '#b0642a', '#43230f'],
    ['#5c2a12', '#8a3a18', '#c0562a', '#46200d'],
    ['#4e3216', '#76501f', '#a0742e', '#3c2610'],
    ['#6a4210', '#a0661a', '#d89a2a', '#4e300c']
  ];
  var FEUILLES_MORTES = ['#a0561e', '#c0762a', '#7a3e16', '#d89a2a', '#8a2e14'];

  // Les lacs speciaux, vague par vague : le fond, le bord, les reflets, les
  // bulles, et ce qui bouge dessus (lueur qui respire, vaguelettes).
  var SPECIAL = {
    radio: { fond: '#6fa814', bord: '#9ad11e', reflet: '#c8f02a', bulle: '#e8ff8a',
             lueur: 'rgba(232,255,138,', vague: 'rgba(240,255,170,.55)' },
    magma: { fond: '#b8341a', bord: '#e0581e', reflet: '#ff9a2a', bulle: '#ffe27a',
             lueur: 'rgba(255,170,60,', vague: 'rgba(255,220,130,.6)' }
  };

  // La palette d'un astre. Sans elle, les tuiles de monde lointain se
  // peignent en gris : c'est le jeu qui fournit la sienne, par opts.
  var PALETTE_PAR_DEFAUT = {
    sol: '#6b6560', sol2: '#5f5a55', grain: '#7d766f',
    roche: '#4a4642', rocheHaut: '#6d6862', rocheOmbre: '#2e2b28',
    liquide: '#3b3a38', liquide2: '#56534f', ecume: '#8d8781',
    cristal: '#9fb6c8', cristal2: '#d8e6f2',
    structure: '#5a5f68', structureHaut: '#7d838c'
  };

  function palette(opts) {
    return (opts && opts.palette) || PALETTE_PAR_DEFAUT;
  }

  // Les tuiles d'astre, toutes peintes a partir de la meme palette. Le
  // bruit stable fait le reste : deux cases voisines ne se ressemblent
  // jamais tout a fait.
  function solAstre(x, g, tx, ty, opts) {
    var t = g[ty][tx], px = tx * TS, py = ty * TS, i, n;
    var c = palette(opts);

    if (t === T.LIQUIDE) {
      // Une nappe : lave, acide, methane — c'est la palette qui tranche.
      var bord = false;
      for (var k = 0; k < 4; k++) {
        var nx = tx + [1, -1, 0, 0][k], ny = ty + [0, 0, 1, -1][k];
        if (!g[ny] || g[ny][nx] === undefined) continue;
        if (g[ny][nx] !== T.LIQUIDE) bord = true;
      }
      x.fillStyle = bord ? c.liquide2 : c.liquide;
      x.fillRect(px, py, TS, TS);
      x.fillStyle = c.ecume;
      for (i = 0; i < 4; i++) {
        n = bruit(tx, ty, 240 + i);
        x.fillRect(px + (n * 18 | 0), py + 2 + i * 5, 5, 2);
      }
      return;
    }

    if (t === T.CRISTAL) {
      x.fillStyle = c.sol; x.fillRect(px, py, TS, TS);
      // Trois eclats plantes de travers.
      for (i = 0; i < 3; i++) {
        n = bruit(tx, ty, 250 + i);
        var cx = px + 4 + (n * 14 | 0);
        var h = 9 + ((bruit(tx, ty, 255 + i) * 11) | 0);
        x.fillStyle = c.cristal;
        x.fillRect(cx, py + TS - h, 4, h);
        x.fillStyle = c.cristal2;
        x.fillRect(cx + 1, py + TS - h + 1, 1, h - 2);
        x.fillRect(cx, py + TS - h, 4, 2);
      }
      return;
    }

    if (t === T.STRUCTURE) {
      x.fillStyle = c.structure; x.fillRect(px, py, TS, TS);
      x.fillStyle = c.structureHaut;
      x.fillRect(px + 1, py + 1, TS - 2, 6);
      x.fillRect(px + 1, py + 9, TS - 2, 5);
      x.fillStyle = 'rgba(0,0,0,.3)';
      x.fillRect(px, py + 7, TS, 2);
      x.fillRect(px + ((ty % 2) ? 7 : 16), py, 2, 7);
      x.fillRect(px + ((ty % 2) ? 16 : 7), py + 9, 2, 5);
      return;
    }

    if (t === T.GRAVATS) {
      x.fillStyle = c.sol2; x.fillRect(px, py, TS, TS);
      x.fillStyle = c.rocheOmbre;
      for (i = 0; i < 7; i++) {
        n = bruit(tx, ty, 260 + i);
        x.fillRect(px + (n * 20 | 0), py + ((bruit(tx, ty, 270 + i) * 20) | 0), 3, 2);
      }
      x.fillStyle = c.grain;
      for (i = 0; i < 4; i++) {
        n = bruit(tx, ty, 280 + i);
        x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 285 + i) * 21) | 0), 2, 2);
      }
      return;
    }

    // Le sol nu. Sur les grandes cartes (opts.regions), sa teinte suit des
    // nappes lisses — plus claires ici, plus sombres la — au lieu d'un
    // damier qui, repete sur cent vingt cases, se voyait de loin. Sinon,
    // deux tons en damier. Puis du grain, et parfois une fissure.
    if (opts && opts.regions) {
      var nap = nappe(tx, ty, 7, 401) * 0.75 + nappe(tx, ty, 3, 402) * 0.25;
      x.fillStyle = nap < 0.42 ? c.sol2 : nap > 0.6 ? melange(c.sol, c.grain, 0.35) : c.sol;
      x.fillRect(px, py, TS, TS);
      // Le passage d'une nappe a l'autre se fait en pointilles.
      if (nap > 0.4 && nap < 0.46) {
        x.fillStyle = c.sol2;
        for (i = 0; i < 6; i++) x.fillRect(px + ((bruit(tx, ty, 410 + i) * 22) | 0), py + ((bruit(tx, ty, 420 + i) * 22) | 0), 3, 3);
      }
    } else {
      x.fillStyle = (tx + ty) % 2 ? c.sol : c.sol2;
      x.fillRect(px, py, TS, TS);
    }
    x.fillStyle = c.grain;
    for (i = 0; i < 5; i++) {
      n = bruit(tx, ty, 290 + i);
      x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 295 + i) * 21) | 0), 2, 2);
    }
    if (t === T.SOL_B) {
      // La variante : une craquelure en diagonale.
      x.fillStyle = c.rocheOmbre;
      var d = (bruit(tx, ty, 300) * 8) | 0;
      for (i = 0; i < 11; i++) {
        x.fillRect(px + 6 + i, py + d + ((i * 7) % 9), 2, 1);
      }
    }
  }

  // ---------- La flore et les ruines des astres ----------
  // Trois tuiles de plus pour les grandes cartes de l'Odyssee : une touffe
  // qu'on traverse (FLORE), une grande plante qui barre le passage
  // (PLANTE), un pilier de ruine (RUINE). Leur allure vient de la palette :
  // "plante" dit quelle sorte de vegetation pousse sur cet astre.
  function teinte(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    var v = Math.min(255, Math.round(((n >> 8) & 255) * k));
    var b = Math.min(255, Math.round((n & 255) * k));
    return 'rgb(' + r + ',' + v + ',' + b + ')';
  }

  function touffe(x, tx, ty, px, py, c) {
    var f = c.flore || '#5a7a3a', f2 = c.flore2 || teinte(f, 1.3), fl = c.fleur || '#e8d27a';
    var style = c.plante || 'arbre', i, n;
    for (i = 0; i < 4; i++) {
      n = bruit(tx, ty, 330 + i);
      var bx = px + 2 + (n * 18 | 0), by = py + 6 + ((bruit(tx, ty, 335 + i) * 14) | 0);
      if (style === 'pic' || style === 'givre' || style === 'prisme') {
        // Des eclats plantes dans le sol.
        x.fillStyle = f; x.fillRect(bx, by - 4, 2, 5);
        x.fillStyle = f2; x.fillRect(bx, by - 4, 1, 3);
      } else if (style === 'flamme') {
        x.fillStyle = f; x.fillRect(bx, by - 3, 2, 4);
        x.fillStyle = fl; x.fillRect(bx, by - 4, 1, 2);
      } else {
        // Trois brins, et parfois une fleur.
        x.fillStyle = f;
        x.fillRect(bx, by - 3, 1, 4); x.fillRect(bx + 2, by - 4, 1, 5); x.fillRect(bx + 4, by - 2, 1, 3);
        x.fillStyle = f2; x.fillRect(bx + 2, by - 4, 1, 2);
        if (bruit(tx, ty, 340 + i) < 0.35) { x.fillStyle = fl; x.fillRect(bx + 1, by - 6, 2, 2); }
      }
    }
  }

  // La grande plante : une silhouette par sorte de vegetation.
  function grandePlante(x, tx, ty, px, py, c) {
    var f = c.flore || '#5a7a3a', f2 = c.flore2 || teinte(f, 1.3), fo = teinte(f, 0.6);
    var tronc = c.tronc || teinte(c.roche || '#6a5a4a', 0.9), fl = c.fleur || '#e8d27a';
    var style = c.plante || 'arbre', i, n;
    var h = bruit(tx, ty, 350);
    x.fillStyle = 'rgba(0,0,0,.28)';
    x.fillRect(px + 3, py + TS - 5, TS - 6, 4);

    if (style === 'arbre' || style === 'fougere') {
      x.fillStyle = tronc; x.fillRect(px + 10, py + 10, 4, 13);
      x.fillStyle = teinte(tronc, 0.7); x.fillRect(px + 13, py + 10, 1, 13);
      if (style === 'fougere') {
        // Des palmes qui retombent de chaque cote.
        for (i = 0; i < 4; i++) {
          x.fillStyle = i % 2 ? f2 : f;
          x.fillRect(px + 1 + i, py + 2 + i * 2, 10 - i, 2);
          x.fillRect(px + 13, py + 2 + i * 2, 10 - i, 2);
        }
        x.fillStyle = f2; x.fillRect(px + 9, py - 2, 6, 6);
      } else {
        x.fillStyle = fo; x.fillRect(px + 1, py - 3, TS - 2, 15);
        x.fillStyle = f; x.fillRect(px + 2, py - 5, TS - 4, 15);
        x.fillStyle = f2; x.fillRect(px + 4, py - 5, 8, 4); x.fillRect(px + 3, py - 1, 4, 3);
        if (h < 0.4) { x.fillStyle = fl; x.fillRect(px + 15, py + 1, 2, 2); x.fillRect(px + 7, py + 5, 2, 2); }
      }
      return;
    }
    if (style === 'champignon') {
      x.fillStyle = c.cristal2 || '#e8e0d0'; x.fillRect(px + 9, py + 8, 6, 15);
      x.fillStyle = fo; x.fillRect(px + 1, py + 2, TS - 2, 7);
      x.fillStyle = f; x.fillRect(px + 3, py - 1, TS - 6, 7);
      x.fillStyle = fl;
      [[6, 1], [14, 0], [10, 4], [17, 3]].forEach(function (q) { x.fillRect(px + q[0], py + q[1], 2, 2); });
      return;
    }
    if (style === 'cactus') {
      x.fillStyle = f; x.fillRect(px + 9, py - 2, 6, 25);
      x.fillRect(px + 3, py + 6, 6, 4); x.fillRect(px + 3, py + 1, 3, 6);
      x.fillRect(px + 15, py + 9, 6, 4); x.fillRect(px + 18, py + 4, 3, 6);
      x.fillStyle = f2; x.fillRect(px + 10, py - 2, 1, 24);
      x.fillStyle = fl; x.fillRect(px + 11, py - 4, 2, 2);
      return;
    }
    if (style === 'corail') {
      x.fillStyle = f;
      x.fillRect(px + 11, py + 6, 3, 17);
      x.fillRect(px + 5, py + 2, 3, 12); x.fillRect(px + 5, py + 12, 7, 3);
      x.fillRect(px + 17, py - 1, 3, 13); x.fillRect(px + 13, py + 10, 7, 3);
      x.fillStyle = f2; x.fillRect(px + 5, py + 1, 3, 2); x.fillRect(px + 17, py - 2, 3, 2); x.fillRect(px + 11, py + 5, 3, 2);
      return;
    }
    if (style === 'flamme') {
      // Une colonne de basalte, du feu au sommet.
      x.fillStyle = tronc; x.fillRect(px + 7, py + 6, 10, 17);
      x.fillStyle = teinte(tronc, 1.3); x.fillRect(px + 7, py + 6, 2, 17);
      x.fillStyle = f; x.fillRect(px + 8, py - 2, 8, 9);
      x.fillStyle = fl; x.fillRect(px + 10, py - 5, 4, 8);
      x.fillStyle = '#fff4b0'; x.fillRect(px + 11, py, 2, 3);
      return;
    }
    // Les eclats : pic de roche ou de metal, aiguille de glace, prisme.
    var haut = 18 + ((h * 10) | 0);
    x.fillStyle = fo;
    x.fillRect(px + 5, py + TS - haut + 6, 6, haut - 6);
    x.fillRect(px + 13, py + TS - haut + 10, 6, haut - 10);
    x.fillStyle = f;
    x.fillRect(px + 6, py + TS - haut, 4, haut);
    x.fillRect(px + 14, py + TS - haut + 5, 4, haut - 5);
    x.fillStyle = f2;
    x.fillRect(px + 7, py + TS - haut, 1, haut - 2);
    x.fillRect(px + 15, py + TS - haut + 5, 1, haut - 7);
    if (style === 'prisme') {
      x.fillStyle = fl; x.fillRect(px + 7, py + TS - haut + 3, 2, 2); x.fillRect(px + 15, py + TS - haut + 8, 2, 2);
    }
  }

  // Un pilier de ruine, brise a une hauteur differente a chaque case.
  function pilierRuine(x, tx, ty, px, py, c) {
    var s = c.structure, sh = c.structureHaut;
    var haut = 12 + ((bruit(tx, ty, 360) * 14) | 0);
    x.fillStyle = 'rgba(0,0,0,.28)';
    x.fillRect(px + 2, py + TS - 5, TS - 4, 4);
    x.fillStyle = s; x.fillRect(px + 4, py + TS - haut, TS - 8, haut);
    x.fillStyle = sh; x.fillRect(px + 4, py + TS - haut, 3, haut);
    x.fillRect(px + 3, py + TS - 4, TS - 6, 3);
    x.fillStyle = 'rgba(0,0,0,.3)';
    for (var i = 0; i < 3; i++) x.fillRect(px + 7 + i * 4, py + TS - haut + 3, 1, haut - 6);
    // Le sommet casse, en dents.
    x.fillStyle = sh;
    x.fillRect(px + 5, py + TS - haut - 2, 3, 2); x.fillRect(px + 12, py + TS - haut - 3, 3, 3);
    // Des gravats au pied.
    x.fillStyle = c.rocheOmbre;
    x.fillRect(px + 1, py + TS - 3, 3, 2); x.fillRect(px + TS - 4, py + TS - 2, 3, 2);
  }

  // Le relief d'astre : les rochers, qu'on ne traverse pas.
  function objetAstre(x, g, tx, ty, opts) {
    var t = g[ty][tx], px = tx * TS, py = ty * TS, i, n;
    var c = palette(opts);
    if (t === T.FLORE) { touffe(x, tx, ty, px, py, c); return true; }
    if (t === T.PLANTE) { grandePlante(x, tx, ty, px, py, c); return true; }
    if (t === T.RUINE) { pilierRuine(x, tx, ty, px, py, c); return true; }
    if (t !== T.ROCHE_A) return false;
    // Un bloc arrondi, plus ou moins haut selon la case : alignes, des
    // carres pleins faisaient un mur de briques.
    var haut = 8 + ((bruit(tx, ty, 318) * 8) | 0);
    x.fillStyle = 'rgba(0,0,0,.28)';
    x.fillRect(px + 3, py + TS - 5, TS - 6, 4);
    x.fillStyle = c.roche;
    x.fillRect(px + 4, py + TS - 3 - haut, TS - 8, haut);
    x.fillRect(px + 2, py + TS - haut, TS - 4, haut - 4);
    x.fillStyle = c.rocheHaut;
    x.fillRect(px + 6, py + TS - 3 - haut, TS - 14, 3);
    x.fillStyle = c.rocheOmbre;
    for (i = 0; i < 3; i++) {
      n = bruit(tx, ty, 310 + i);
      x.fillRect(px + 4 + (n * 13 | 0), py + 10 + ((bruit(tx, ty, 315 + i) * 8) | 0), 3, 2);
    }
    return true;
  }

  // ==========================================================
  //  Le dessin du terrain
  // ==========================================================

  function solTuile(x, g, tx, ty, opts) {
    var t = g[ty][tx], px = tx * TS, py = ty * TS, i, n;

    if (t === T.ARBRE_COSMOS || t === T.ARBRE_FAUX) t = T.HERBE;
    else if (t >= T.SOL) return solAstre(x, g, tx, ty, opts);

    if (estEau(t)) {
      // Un fond plus sombre au large, plus clair pres du bord : ca donne
      // de la profondeur sans avoir a dessiner les hauts-fonds a la main.
      var bord = false;
      for (var k = 0; k < 4; k++) {
        var nx = tx + [1, -1, 0, 0][k], ny = ty + [0, 0, 1, -1][k];
        if (!g[ny] || g[ny][nx] === undefined) continue;
        if (!estEau(g[ny][nx])) bord = true;
      }
      var rad = t === T.EAU_RAD;
      // Les lacs speciaux prennent la couleur de la vague en cours : fluo
      // pour la Radioactivite, lave pour le Magma.
      var SP = rad ? SPECIAL[(opts && opts.vague) || 'radio'] || SPECIAL.radio : null;
      x.fillStyle = rad ? (bord ? SP.bord : SP.fond)
                        : (bord ? '#2a68c4' : '#1d4f9c');
      x.fillRect(px, py, TS, TS);
      x.fillStyle = rad ? (bord ? SP.reflet : SP.bord)
                        : (bord ? '#3f82dd' : '#2a68c4');
      for (i = 0; i < 5; i++) {
        n = bruit(tx, ty, 10 + i);
        x.fillRect(px + (n * 18 | 0), py + i * 5 + 1, 6, 2);
      }
      // Quelques bulles remontent du fond.
      if (rad) {
        x.fillStyle = SP.bulle;
        for (i = 0; i < 3; i++) {
          n = bruit(tx, ty, 190 + i);
          x.fillRect(px + 3 + (n * 17 | 0), py + 3 + ((bruit(tx, ty, 195 + i) * 17) | 0), 2, 2);
        }
      }
      return;
    }

    if (t === T.SABLE) {
      x.fillStyle = (tx + ty) % 2 ? '#e0cf94' : '#d8c68a';
      x.fillRect(px, py, TS, TS);
      x.fillStyle = '#c9b478';
      for (i = 0; i < 5; i++) {
        n = bruit(tx, ty, 140 + i);
        x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 150 + i) * 21) | 0), 2, 2);
      }
      return;
    }

    if (t === T.CABANE || t === T.TOIT || t === T.PORTE_BOIS) {
      // Les murs en planches verticales, le toit en bardeaux.
      if (t === T.TOIT) {
        x.fillStyle = '#7a3b2c'; x.fillRect(px, py, TS, TS);
        x.fillStyle = '#8f4835';
        for (i = 0; i < 3; i++) x.fillRect(px + 1, py + i * 8 + 1, TS - 2, 6);
        x.fillStyle = '#5c2a1f';
        for (i = 0; i < 3; i++) x.fillRect(px + ((ty + i) % 2 ? 4 : 14), py + i * 8, 2, 8);
        return;
      }
      x.fillStyle = '#9b6b3c'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#ac7a47';
      for (i = 0; i < 4; i++) x.fillRect(px + i * 6 + 1, py, 4, TS);
      x.fillStyle = '#7a5129';
      for (i = 0; i < 4; i++) x.fillRect(px + i * 6, py, 1, TS);
      return;
    }

    if (t === T.PONTON) {
      x.fillStyle = '#8a6136'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#9d7040';
      x.fillRect(px + 1, py + 1, TS - 2, 6);
      x.fillRect(px + 1, py + 9, TS - 2, 6);
      x.fillRect(px + 1, py + 17, TS - 2, 6);
      x.fillStyle = '#6b4826';
      x.fillRect(px, py + 7, TS, 2);
      x.fillRect(px, py + 15, TS, 2);
      return;
    }

    // Le sol de l'arene : du sable ratisse, pas des dalles. Le cercle de
    // combat est trace au centre, et le sable se marque de traces.
    if (t === T.DALLE) {
      var A0 = opts && opts.arene;
      x.fillStyle = '#b2884f'; x.fillRect(px, py, TS, TS);
      // Le grain.
      for (i = 0; i < 7; i++) {
        n = bruit(tx, ty, 190 + i);
        x.fillStyle = n > 0.5 ? 'rgba(255,240,205,.16)' : 'rgba(90,58,26,.16)';
        x.fillRect(px + ((n * 20) | 0), py + ((bruit(tx, ty, 200 + i) * 20) | 0), 2, 1);
      }
      // Les raies du rateau.
      x.fillStyle = 'rgba(120,80,40,.16)';
      x.fillRect(px, py + 5, TS, 1);
      x.fillRect(px, py + 15, TS, 1);
      if (A0) {
        // Le cercle de combat. On le trace en sous-cases de quatre pixels :
        // sinon la case entiere se colore et l'ellipse tourne en patchwork.
        var cxA = (A0.x0 + A0.x1 + 1) / 2, cyA = (A0.y0 + A0.y1 + 1) / 2;
        var PAS = 4, SOUS = TS / PAS;
        for (var sy2 = 0; sy2 < PAS; sy2++) {
          for (var sx3 = 0; sx3 < PAS; sx3++) {
            var ux = tx + (sx3 + 0.5) / PAS, uy = ty + (sy2 + 0.5) / PAS;
            var dxA = ux - cxA, dyA = (uy - cyA) * 1.85;
            var dA = Math.sqrt(dxA * dxA + dyA * dyA);
            var qx = px + sx3 * SOUS, qy = py + sy2 * SOUS;
            if (dA > 2.92 && dA < 3.12) {
              x.fillStyle = 'rgba(86,50,18,.55)';
              x.fillRect(qx, qy, SOUS, SOUS);
            } else if (dA >= 3.12 && dA < 3.26) {
              x.fillStyle = 'rgba(255,240,200,.16)';
              x.fillRect(qx, qy, SOUS, SOUS);
            } else if (dA < 0.92) {
              // Le medaillon grave au centre.
              x.fillStyle = dA < 0.55 ? 'rgba(178,52,44,.38)' : 'rgba(86,50,18,.40)';
              x.fillRect(qx, qy, SOUS, SOUS);
            }
          }
        }
        // Des traces de lutte, ici et la.
        if (bruit(tx, ty, 210) > 0.88) {
          x.fillStyle = 'rgba(70,40,18,.30)';
          x.fillRect(px + 3, py + 11, 14, 2);
          x.fillRect(px + 5, py + 8, 9, 2);
        }
      }
      return;
    }

    if (t === T.PORTE) {
      x.fillStyle = '#6b6f7d'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#7c8090';
      x.fillRect(px + 1, py + 1, TS - 3, 10);
      x.fillRect(px + 1, py + 13, TS - 3, 9);
      return;
    }

    if (t === T.MUR) {
      // Le mur d'enceinte : de la pierre appareillee, sombre en bas.
      var g1 = x.createLinearGradient(px, py, px, py + TS);
      g1.addColorStop(0, '#7a7f90');
      g1.addColorStop(1, '#4e5262');
      x.fillStyle = g1; x.fillRect(px, py, TS, TS);
      x.fillStyle = 'rgba(0,0,0,.26)';
      x.fillRect(px, py + 10, TS, 2);
      x.fillRect(px + (ty % 2 ? 6 : 16), py, 2, 10);
      x.fillRect(px + (ty % 2 ? 16 : 6), py + 12, 2, 10);
      x.fillStyle = 'rgba(255,255,255,.08)';
      x.fillRect(px + 1, py + 1, TS - 4, 2);
      x.fillRect(px + 1, py + 13, TS - 4, 2);
      return;
    }

    if (t === T.CHEMIN) {
      x.fillStyle = '#a5794a'; x.fillRect(px, py, TS, TS);
      x.fillStyle = '#b98c59';
      for (i = 0; i < 6; i++) {
        n = bruit(tx, ty, 20 + i);
        x.fillRect(px + (n * 20 | 0), py + ((bruit(tx, ty, 30 + i) * 20) | 0), 3, 2);
      }
      x.fillStyle = '#8e6539';
      for (i = 0; i < 3; i++) {
        n = bruit(tx, ty, 40 + i);
        x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 50 + i) * 21) | 0), 2, 2);
      }
      return;
    }

    // Herbe : deux verts en damier, puis des touffes.
    // En automne, l'herbe tire sur l'olive.
    var aut = opts && opts.automne;
    x.fillStyle = (tx + ty) % 2 ? (aut ? '#55833a' : '#3d8b38') : (aut ? '#5a883c' : '#438f3c');
    x.fillRect(px, py, TS, TS);
    x.fillStyle = aut ? '#6a9644' : '#4d9c42';
    for (i = 0; i < 4; i++) {
      n = bruit(tx, ty, 60 + i);
      x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 70 + i) * 21) | 0), 3, 2);
    }
    x.fillStyle = aut ? '#4a7432' : '#347a30';
    for (i = 0; i < 3; i++) {
      n = bruit(tx, ty, 80 + i);
      x.fillRect(px + (n * 22 | 0), py + ((bruit(tx, ty, 90 + i) * 22) | 0), 2, 3);
    }
    // L'automne : des feuilles mortes jonchent l'herbe, plus serrees au
    // pied des arbres.
    if (opts && opts.automne) {
      var sousBois = 0;
      for (var dy = -1; dy <= 1; dy++)
        for (var dx = -1; dx <= 1; dx++)
          if (g[ty + dy] && g[ty + dy][tx + dx] === T.ARBRE) sousBois++;
      var nb = 1 + Math.min(4, sousBois);
      for (i = 0; i < nb; i++) {
        n = bruit(tx, ty, 400 + i);
        x.fillStyle = FEUILLES_MORTES[(bruit(tx, ty, 410 + i) * FEUILLES_MORTES.length) | 0];
        x.fillRect(px + (n * 21 | 0), py + ((bruit(tx, ty, 420 + i) * 21) | 0), 2 + (i % 2), 2);
      }
    }
    if (t === T.FLEUR) {
      var fx = px + 8 + ((bruit(tx, ty, 3) * 6) | 0);
      var fy = py + 8 + ((bruit(tx, ty, 4) * 6) | 0);
      var tons = ['#f6e05e', '#f28ab2', '#e8eef7', '#f0a15a'];
      x.fillStyle = '#2f6e2c'; x.fillRect(fx + 2, fy + 3, 2, 4);
      x.fillStyle = tons[(bruit(tx, ty, 5) * 4) | 0];
      x.fillRect(fx + 1, fy, 4, 3);
      x.fillRect(fx, fy + 1, 6, 1);
    }
  }

  function objetTuile(x, g, tx, ty, opts) {
    var t = g[ty][tx], px = tx * TS, py = ty * TS, i, n;

    if (t === T.ARBRE_COSMOS) return;
    if (t === T.ARBRE_FAUX) t = T.ARBRE;
    if (t >= T.SOL) { objetAstre(x, g, tx, ty, opts); return; }

    if (t === T.ROSEAU) {
      // Des joncs qui depassent de l'eau, au bord des etangs.
      x.fillStyle = '#2f6e2c';
      for (i = 0; i < 5; i++) {
        n = bruit(tx, ty, 160 + i);
        var rx = px + 2 + (n * 19 | 0), rh = 9 + ((bruit(tx, ty, 170 + i) * 9) | 0);
        x.fillRect(rx, py + TS - rh, 2, rh);
        x.fillStyle = '#7c5a2c';
        x.fillRect(rx, py + TS - rh - 3, 2, 3);
        x.fillStyle = '#2f6e2c';
      }
      return;
    }

    if (t === T.SOUCHE) {
      // Une vieille souche creuse, au fond du bois. Rien ne la distingue
      // d'un tronc mort tant qu'on ne s'en approche pas : c'est le jeu
      // qui allume sa lueur, par "opts.souche", quand le joueur est la.
      x.fillStyle = 'rgba(0,0,0,.28)';
      x.fillRect(px + 2, py + TS - 5, TS - 4, 4);
      x.fillStyle = '#4e3a22'; x.fillRect(px + 3, py + 9, TS - 6, TS - 11);
      x.fillStyle = '#5f4729'; x.fillRect(px + 3, py + 9, 5, TS - 11);
      // Les anneaux du bois, sur la tranche.
      x.fillStyle = '#7a5c33'; x.fillRect(px + 3, py + 7, TS - 6, 4);
      x.fillStyle = '#8d6c3d'; x.fillRect(px + 5, py + 8, TS - 10, 2);
      x.fillStyle = '#2b1f12'; x.fillRect(px + 8, py + 8, TS - 16, 2);
      // La mousse, cote nord.
      x.fillStyle = '#4d7a33';
      x.fillRect(px + 3, py + 11, 4, 3);
      x.fillRect(px + TS - 7, py + 13, 3, 3);
      // Quelques eclats d'ecorce au pied.
      x.fillStyle = '#3a2a18';
      for (i = 0; i < 3; i++) {
        n = bruit(tx, ty, 210 + i);
        x.fillRect(px + 2 + (n * 18 | 0), py + TS - 4, 3, 2);
      }
      return;
    }

    if (t === T.ARBRE) {
      // Un arbre deborde d'une case vers le haut : c'est ce qui donne du
      // relief a la foret.
      var hx = px + TS / 2;
      x.fillStyle = 'rgba(0,0,0,.25)';
      x.fillRect(px + 3, py + TS - 5, TS - 6, 4);
      x.fillStyle = '#6b4526'; x.fillRect(hx - 4, py + 8, 8, TS - 10);
      x.fillStyle = '#7d5430'; x.fillRect(hx - 4, py + 8, 3, TS - 10);
      x.fillStyle = '#573619'; x.fillRect(hx + 1, py + 12, 2, 5);

      if (opts && opts.automne) {
        // Le meme arbre, roussi : chaque tronc tire au hasard sa teinte,
        // du brun sombre au roux, et le feuillage s'eclaircit deja par
        // endroits, la ou il commence a tomber.
        var A = AUTOMNE[(bruit(tx, ty, 430) * AUTOMNE.length) | 0];
        x.fillStyle = A[0];
        x.fillRect(px - 2, py - 12, TS + 4, 22);
        x.fillRect(px + 2, py - 18, TS - 4, 30);
        x.fillStyle = A[1];
        x.fillRect(px + 1, py - 14, TS - 6, 16);
        x.fillStyle = A[2];
        x.fillRect(px + 3, py - 16, 9, 7);
        x.fillRect(px + 2, py - 9, 5, 4);
        x.fillStyle = A[3];
        for (i = 0; i < 4; i++) {
          n = bruit(tx, ty, 100 + i);
          x.fillRect(px + 2 + (n * 18 | 0), py - 12 + ((bruit(tx, ty, 110 + i) * 18) | 0), 4, 3);
        }
        // Des trouees : quelques branches nues percent le feuillage.
        x.fillStyle = '#4a2c14';
        if (bruit(tx, ty, 440) > 0.45) {
          x.fillRect(px + 15, py - 17, 1, 5);
          x.fillRect(px + 16, py - 19, 1, 2);
        }
        if (bruit(tx, ty, 441) > 0.6) {
          x.fillRect(px + 4, py - 14, 1, 4);
          x.fillRect(px + 3, py - 16, 1, 2);
        }
        return;
      }

      x.fillStyle = '#1f5c26';
      x.fillRect(px - 2, py - 12, TS + 4, 22);
      x.fillRect(px + 2, py - 18, TS - 4, 30);
      x.fillStyle = '#2a7a2f';
      x.fillRect(px + 1, py - 14, TS - 6, 16);
      x.fillStyle = '#3a9b3a';
      x.fillRect(px + 3, py - 16, 9, 7);
      x.fillRect(px + 2, py - 9, 5, 4);
      x.fillStyle = '#16451c';
      for (i = 0; i < 4; i++) {
        n = bruit(tx, ty, 100 + i);
        x.fillRect(px + 2 + (n * 18 | 0), py - 12 + ((bruit(tx, ty, 110 + i) * 18) | 0), 4, 3);
      }
      return;
    }

    if (t === T.BUISSON && opts && opts.automne) {
      x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(px + 3, py + TS - 4, TS - 6, 3);
      x.fillStyle = '#6b3a18'; x.fillRect(px + 2, py + 6, TS - 4, TS - 9);
      x.fillStyle = '#9a5622'; x.fillRect(px + 3, py + 5, TS - 8, 9);
      x.fillStyle = '#c47a2c'; x.fillRect(px + 5, py + 6, 6, 4);
      x.fillStyle = '#7a1e22';
      for (i = 0; i < 3; i++) {
        n = bruit(tx, ty, 120 + i);
        x.fillRect(px + 4 + (n * 14 | 0), py + 9 + ((bruit(tx, ty, 130 + i) * 9) | 0), 2, 2);
      }
      return;
    }

    if (t === T.BUISSON) {
      x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(px + 3, py + TS - 4, TS - 6, 3);
      x.fillStyle = '#1f5f28'; x.fillRect(px + 2, py + 6, TS - 4, TS - 9);
      x.fillStyle = '#2d8034'; x.fillRect(px + 3, py + 5, TS - 8, 9);
      x.fillStyle = '#3f9c42'; x.fillRect(px + 5, py + 6, 6, 4);
      x.fillStyle = '#d8434f';
      for (i = 0; i < 3; i++) {
        n = bruit(tx, ty, 120 + i);
        x.fillRect(px + 4 + (n * 14 | 0), py + 9 + ((bruit(tx, ty, 130 + i) * 9) | 0), 2, 2);
      }
      return;
    }

    if (t === T.ROCHER) {
      x.fillStyle = 'rgba(0,0,0,.24)'; x.fillRect(px + 3, py + TS - 4, TS - 6, 3);
      x.fillStyle = '#5d6270'; x.fillRect(px + 3, py + 7, TS - 6, TS - 10);
      x.fillStyle = '#767c8c'; x.fillRect(px + 4, py + 6, TS - 10, 7);
      x.fillStyle = '#8f95a6'; x.fillRect(px + 6, py + 7, 5, 3);
      x.fillStyle = '#43485a'; x.fillRect(px + 10, py + 12, 7, 3);
      return;
    }

    if (t === T.EAU_RAD && opts && opts.vague === 'magma') {
      // Un bloc de basalte qui flotte sur la lave, fendu de braise.
      if (bruit(tx, ty, 182) > 0.9) {
        x.fillStyle = '#2a2224'; x.fillRect(px + 5, py + 8, 14, 9);
        x.fillStyle = '#3e3436'; x.fillRect(px + 6, py + 8, 10, 4);
        x.fillStyle = '#ff7a2a'; x.fillRect(px + 9, py + 12, 5, 1);
        x.fillRect(px + 13, py + 11, 1, 2);
        x.fillStyle = 'rgba(255,200,90,.35)'; x.fillRect(px + 4, py + 17, 16, 2);
      }
      return;
    }

    if (t === T.EAU_RAD) {
      // Un fut rouille echoue de loin en loin : l'origine de tout ca.
      if (bruit(tx, ty, 182) > 0.93) {
        x.fillStyle = '#3f3a2a'; x.fillRect(px + 7, py + 6, 10, 13);
        x.fillStyle = '#5c5436'; x.fillRect(px + 8, py + 7, 8, 11);
        x.fillStyle = '#c8f02a'; x.fillRect(px + 10, py + 10, 4, 4);
        x.fillStyle = '#1d2410'; x.fillRect(px + 11, py + 11, 2, 2);
        x.fillStyle = '#3f3a2a'; x.fillRect(px + 7, py + 9, 10, 1);
        x.fillRect(px + 7, py + 15, 10, 1);
      }
      return;
    }

    if (t === T.EAU) {
      // Un nenuphar de loin en loin, pour que l'eau ne soit pas nue.
      if (bruit(tx, ty, 180) > 0.9) {
        x.fillStyle = '#2f7a34';
        x.fillRect(px + 6, py + 9, 11, 7);
        x.fillRect(px + 8, py + 7, 7, 11);
        x.fillStyle = '#3f9c42'; x.fillRect(px + 8, py + 9, 5, 3);
        x.fillStyle = '#1d4f9c'; x.fillRect(px + 11, py + 12, 2, 4);
        if (bruit(tx, ty, 181) > 0.5) {
          x.fillStyle = '#f2d8e8'; x.fillRect(px + 13, py + 6, 3, 3);
          x.fillStyle = '#f6e05e'; x.fillRect(px + 14, py + 7, 1, 1);
        }
      }
      return;
    }

    if (t === T.MUR && opts && opts.arene) {
      var AR = opts.arene;
      var BANDEROLES = ['#c9303f', '#2f6fd0', '#c9a227', '#3f9c42'];

      // Le chaperon du mur.
      x.fillStyle = '#4d5160'; x.fillRect(px, py, TS, 3);
      x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(px, py, TS, 1);

      // ---- Le mur du fond : les gradins et leur public ----
      if (ty === AR.y0) {
        // Trois rangees de bancs, en hauteur, au-dessus de la case.
        for (var r = 0; r < 3; r++) {
          var by = py - 6 - r * 6;
          x.fillStyle = ['#2d2448', '#261e3d', '#1f1932'][r];
          x.fillRect(px, by, TS, 6);
          x.fillStyle = 'rgba(0,0,0,.35)';
          x.fillRect(px, by + 5, TS, 1);
          // Deux spectateurs par case et par rangee.
          for (var k = 0; k < 2; k++) {
            var nn = bruit(tx, ty + r * 7 + k, 220);
            if (nn < 0.18) continue;
            var sx2 = px + 3 + k * 10 + ((bruit(tx, k + r, 221) * 3) | 0);
            var haut2 = 5 + ((bruit(tx, k + r, 222) * 2) | 0);
            x.fillStyle = ['#6d5c96', '#8a4f62', '#4f6a8a', '#7d6a4a',
                           '#4c4070', '#84709f'][(nn * 6) | 0];
            x.fillRect(sx2, by + 6 - haut2, 4, haut2);
            x.fillStyle = ['#e8c9a0', '#c99a72', '#8d6244', '#f0d8b8'][(bruit(tx, k, 223) * 4) | 0];
            x.fillRect(sx2, by + 6 - haut2 - 2, 4, 2);
          }
        }
        // Une banderole tous les quatre pas, qui pend du chaperon.
        if (tx % 4 === 1) {
          var col = BANDEROLES[(tx / 4 | 0) % 4];
          x.fillStyle = col; x.fillRect(px + 7, py + 2, 8, 15);
          x.fillStyle = 'rgba(0,0,0,.30)'; x.fillRect(px + 12, py + 2, 3, 15);
          x.fillStyle = col;
          x.beginPath();
          x.moveTo(px + 7, py + 17); x.lineTo(px + 11, py + 21);
          x.lineTo(px + 15, py + 17); x.closePath(); x.fill();
        }
        return;
      }

      // ---- Les cotes : colonnes et torches ----
      var angle = (tx === AR.x0 || tx === AR.x1) && (ty === AR.y0 + 1);
      if (tx === AR.x0 || tx === AR.x1) {
        // Une colonne cannelee, tous les trois pas.
        if (ty % 3 === 0) {
          x.fillStyle = '#8f95a8'; x.fillRect(px + 2, py - 4, TS - 4, TS + 4);
          x.fillStyle = 'rgba(0,0,0,.22)';
          x.fillRect(px + 6, py - 4, 2, TS + 4);
          x.fillRect(px + 13, py - 4, 2, TS + 4);
          x.fillStyle = '#a9afc2'; x.fillRect(px, py - 7, TS, 4);
          x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(px, py - 4, TS, 1);
        }
        // Une torche allumee entre deux colonnes.
        if (ty % 3 === 1) {
          x.fillStyle = '#4a3420'; x.fillRect(px + 10, py + 5, 3, 11);
          x.fillStyle = '#2f2418'; x.fillRect(px + 7, py + 3, 9, 3);
          x.fillStyle = 'rgba(255,170,70,.20)';
          x.beginPath(); x.ellipse(px + 11, py + 4, 14, 12, 0, 0, 6.3); x.fill();
          x.fillStyle = '#ff9b35'; x.fillRect(px + 8, py - 2, 7, 6);
          x.fillStyle = '#ffe27a'; x.fillRect(px + 10, py - 1, 3, 4);
          x.fillStyle = '#fff3c8'; x.fillRect(px + 11, py, 1, 2);
        }
        if (angle) {
          // Une statue de gardien a l'angle du fond.
          x.fillStyle = '#9aa0b4'; x.fillRect(px + 4, py - 14, 12, 18);
          x.fillStyle = '#7f8598'; x.fillRect(px + 6, py - 20, 8, 7);
          x.fillStyle = '#5d6274'; x.fillRect(px + 7, py - 18, 6, 2);
          x.fillStyle = '#b4bacd'; x.fillRect(px + 2, py + 2, 16, 4);
        }
        return;
      }

      // ---- Le mur du bas : des torches de part et d'autre de la porte ----
      if (ty === AR.y1 && tx % 3 === 0) {
        x.fillStyle = '#4a3420'; x.fillRect(px + 10, py + 6, 3, 10);
        x.fillStyle = 'rgba(255,170,70,.18)';
        x.beginPath(); x.ellipse(px + 11, py + 4, 13, 11, 0, 0, 6.3); x.fill();
        x.fillStyle = '#ff9b35'; x.fillRect(px + 9, py + 1, 5, 6);
        x.fillStyle = '#ffe27a'; x.fillRect(px + 10, py + 2, 3, 3);
      }
      return;
    }

    if (t === T.PORTE_BOIS) {
      // La porte de la cabane : un rectangle sombre, un linteau, une poignee.
      x.fillStyle = '#4a2c18'; x.fillRect(px + 2, py + 2, TS - 4, TS - 2);
      x.fillStyle = '#5e3a20'; x.fillRect(px + 4, py + 5, TS - 8, TS - 6);
      x.fillStyle = '#c9a227'; x.fillRect(px + TS - 8, py + 13, 2, 2);
      x.fillStyle = '#7a5129'; x.fillRect(px, py, TS, 3);
      x.fillStyle = 'rgba(255,225,120,.14)'; x.fillRect(px + 2, py + 3, TS - 4, TS - 4);
      return;
    }

    if (t === T.CABANE && opts && opts.cabane) {
      var C = opts.cabane;
      // Une fenetre eclairee, et l'enseigne au poisson au-dessus de la porte.
      if (ty === C.y1 && tx === C.x0 + 1) {
        x.fillStyle = '#3a2414'; x.fillRect(px + 3, py + 4, TS - 6, TS - 10);
        x.fillStyle = '#ffd98a'; x.fillRect(px + 5, py + 6, TS - 10, TS - 14);
        x.fillStyle = '#3a2414'; x.fillRect(px + TS / 2 - 1, py + 4, 2, TS - 10);
      }
      if (ty === C.y1 && tx === C.porte + 2) {
        x.fillStyle = '#2b1a0f'; x.fillRect(px + 1, py + 3, TS - 2, 13);
        x.fillStyle = '#e8eef7'; x.fillRect(px + 4, py + 7, 10, 4);
        x.fillRect(px + 13, py + 6, 4, 6);
        x.fillStyle = '#2b1a0f'; x.fillRect(px + 6, py + 8, 1, 1);
        x.fillStyle = '#c9a227'; x.fillRect(px + 1, py + 2, TS - 2, 1);
      }
      return;
    }

    if (t === T.TOIT && opts && opts.cabane) {
      // Le debord du toit, qui mange un peu sur la case du dessus.
      if (ty === opts.cabane.y0) {
        x.fillStyle = '#5c2a1f';
        x.fillRect(px - 2, py - 5, TS + 4, 5);
      }
      return;
    }

    if (t === T.PORTE) {
      x.fillStyle = '#20232e'; x.fillRect(px, py + 2, TS, TS - 2);
      x.fillStyle = '#c9a227'; x.fillRect(px, py, TS, 3);
      x.fillStyle = 'rgba(255,225,120,.16)'; x.fillRect(px, py + 4, TS, TS - 6);
    }
  }

  // Peint la carte entiere une fois pour toutes : la boucle de jeu n'a
  // plus qu'a en decouper la fenetre visible.
  function peindre(g, opts) {
    var MH = g.length, MW = g[0].length;
    var c = document.createElement('canvas');
    c.width = MW * TS; c.height = MH * TS;
    var x = c.getContext('2d');
    if (!x) return c;
    var tx, ty;
    for (ty = 0; ty < MH; ty++) for (tx = 0; tx < MW; tx++) solTuile(x, g, tx, ty, opts);
    for (ty = 0; ty < MH; ty++) for (tx = 0; tx < MW; tx++) objetTuile(x, g, tx, ty, opts);
    return c;
  }

  // Repeint une case et ses voisines sur une carte deja peinte : une roche
  // cassee a la pioche redevient du sol, sans tout repeindre. Les voisines
  // suivent, parce que les objets debordent sur la case du dessus.
  function repeindre(monde, g, tx, ty, opts) {
    var x = monde.getContext('2d');
    if (!x) return;
    var MH = g.length, MW = g[0].length, i, j;
    for (j = ty - 1; j <= ty + 2; j++) for (i = tx - 1; i <= tx + 1; i++) {
      if (i < 0 || j < 0 || i >= MW || j >= MH) continue;
      x.clearRect(i * TS, j * TS, TS, TS);
      solTuile(x, g, i, j, opts);
    }
    x.save();
    x.beginPath();
    x.rect((tx - 1) * TS, (ty - 1) * TS, TS * 3, TS * 4);
    x.clip();
    for (j = ty - 1; j <= ty + 3; j++) for (i = tx - 1; i <= tx + 1; i++) {
      if (i < 0 || j < 0 || i >= MW || j >= MH) continue;
      objetTuile(x, g, i, j, opts);
    }
    x.restore();
  }

  // ==========================================================
  //  La promenade
  // ==========================================================

  var CLAVIER = {
    ArrowUp: 'h', ArrowDown: 'b', ArrowLeft: 'g', ArrowRight: 'd',
    z: 'h', s: 'b', q: 'g', d: 'd', w: 'h', a: 'g'
  };

  function Balade(cfg) {
    var g = cfg.grille;
    var MH = g.length, MW = g[0].length;
    var cv = cfg.canvas, ctx = cv.getContext('2d');
    if (ctx) ctx.imageSmoothingEnabled = false;

    var monde = cfg.monde || peindre(g, cfg.opts);
    var VUE_W = cv.width, VUE_H = cv.height;
    // La vitesse peut changer en route (des bottes, par exemple) : le jeu
    // peut fournir une fonction plutot qu'un nombre.
    function vitesse() { return typeof cfg.vitesse === 'function' ? cfg.vitesse() : (cfg.vitesse || 86); }
    var DIRS = (window.CHIBI && window.CHIBI.DIRS) || { bas: 0, gauche: 1, droite: 2, haut: 3 };
    var reduit = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var chef = { x: cfg.depart.x, y: cfg.depart.y,
                 dir: cfg.direction == null ? DIRS.bas : cfg.direction,
                 pas: 0, bouge: false };
    var trace = [];
    var suite = (cfg.troupe || []).slice(1);
    var meneur = (cfg.troupe || [])[0];
    var dir = { x: 0, y: 0 };
    var cam = { x: 0, y: 0 };
    var vivant = true, dernier = 0, derniereCase = '';

    // --- Le joystick ---
    var actif = false, rayon = 0, centre = { x: 0, y: 0 };
    var stick = cfg.stick, pomme = cfg.pomme;

    function prendre(e) {
      var r = stick.getBoundingClientRect();
      rayon = r.width / 2;
      centre.x = r.left + rayon; centre.y = r.top + rayon;
      actif = true;
      stick.classList.add('is-actif');
      if (stick.setPointerCapture) { try { stick.setPointerCapture(e.pointerId); } catch (err) {} }
      bouger(e);
    }
    function bouger(e) {
      if (!actif) return;
      var dx = e.clientX - centre.x, dy = e.clientY - centre.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var k = Math.min(1, d / (rayon * 0.72));
      dir.x = dx / d * k; dir.y = dy / d * k;
      pomme.style.transform = 'translate(' + (dir.x * rayon * 0.5) + 'px,' +
                                             (dir.y * rayon * 0.5) + 'px)';
    }
    function lacher() {
      actif = false;
      dir.x = dir.y = 0;
      stick.classList.remove('is-actif');
      pomme.style.transform = '';
    }
    if (stick) {
      stick.addEventListener('pointerdown', prendre);
      stick.addEventListener('pointermove', bouger);
      stick.addEventListener('pointerup', lacher);
      stick.addEventListener('pointercancel', lacher);
      stick.addEventListener('lostpointercapture', lacher);
    }

    // --- Le clavier, pour jouer au bureau ---
    var touches = {};
    function auClavier(e, enfonce) {
      var k = CLAVIER[e.key];
      if (!k) return;
      touches[k] = enfonce;
      e.preventDefault();
    }
    var kd = function (e) { auClavier(e, true); };
    var ku = function (e) { auClavier(e, false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    function arreter() {
      vivant = false;
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    }

    // --- Les collisions ---
    // On teste les pieds du sprite, pas tout son corps : c'est ce qui
    // permet de passer devant un arbre sans se coincer dedans.
    function libre(x, y) {
      var b = [[x - 7, y - 3], [x + 7, y - 3], [x - 7, y + 4], [x + 7, y + 4]];
      for (var i = 0; i < b.length; i++) {
        var tx = Math.floor(b[i][0] / TS), ty = Math.floor(b[i][1] / TS);
        if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return false;
        // Le jeu peut ouvrir certaines tuiles (marcher sur un liquide).
        if (BLOQUANT[g[ty][tx]] && !(cfg.traverse && cfg.traverse(g[ty][tx]))) return false;
      }
      return true;
    }

    function caseDuChef() {
      return [Math.floor(chef.x / TS), Math.floor(chef.y / TS)];
    }

    // La case que le personnage a juste devant lui : c'est elle qu'on
    // interroge pour savoir s'il fait face a l'eau.
    function caseDevant() {
      var c = caseDuChef();
      if (chef.dir === DIRS.gauche) c[0]--;
      else if (chef.dir === DIRS.droite) c[0]++;
      else if (chef.dir === DIRS.haut) c[1]--;
      else c[1]++;
      return c;
    }

    function tuile(tx, ty) { return g[ty] && g[ty][tx] !== undefined ? g[ty][tx] : null; }

    function poserSprite(p, t) {
      if (p.dessin) return p.dessin(ctx, p.x - cam.x, p.y - cam.y, t);
      var f = window.CHIBI && window.CHIBI.feuille(p.id);
      if (!f) return;
      var sx = Math.round(p.x - cam.x - f.L / 2);
      var sy = Math.round(p.y - cam.y - f.H + 5);

      // La pose suit la distance parcourue : le pas s'accorde a la vitesse
      // reelle au lieu de tourner en rond dans le vide.
      var pose = 0;
      if (reduit) pose = 0;
      else if (p.fixe) pose = Math.floor(t / 600) % 2 ? 2 : 0;
      else if (p.bouge) pose = Math.floor(p.pas / 5) % f.poses;

      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath();
      ctx.ellipse(p.x - cam.x, p.y - cam.y + 2, f.L * 0.32, 3, 0, 0, 6.3);
      ctx.fill();

      ctx.drawImage(f.canvas, pose * f.L, (p.dir || 0) * f.H, f.L, f.H, sx, sy, f.L, f.H);
    }

    var SPV = SPECIAL[(cfg.opts && cfg.opts.vague) || 'radio'] || SPECIAL.radio;

    function dessiner(t) {
      ctx.drawImage(monde, cam.x | 0, cam.y | 0, VUE_W, VUE_H, 0, 0, VUE_W, VUE_H);

      // L'eau bouge : deux lignes claires qui glissent.
      var t0 = t / 320;
      for (var ty = Math.floor(cam.y / TS); ty <= (cam.y + VUE_H) / TS; ty++) {
        for (var tx = Math.floor(cam.x / TS); tx <= (cam.x + VUE_W) / TS; tx++) {
          if (!g[ty] || !estEau(g[ty][tx])) continue;
          var px = tx * TS - cam.x, py = ty * TS - cam.y;
          var rad = g[ty][tx] === T.EAU_RAD;
          // Le lac special respire : sa lueur monte et descend.
          if (rad) {
            var pulse = 0.12 + 0.1 * Math.sin(t / 420 + tx * 0.5 + ty * 0.3);
            ctx.fillStyle = SPV.lueur + pulse.toFixed(2) + ')';
            ctx.fillRect(px, py, TS, TS);
          }
          ctx.fillStyle = rad ? SPV.vague : 'rgba(190,225,255,.5)';
          var o = ((Math.sin(t0 + tx * 0.7 + ty) * 7) | 0) + 8;
          ctx.fillRect(px + o, py + 6, 7, 2);
          ctx.fillRect(px + (TS - o - 6), py + 15, 5, 2);
        }
      }

      if (cfg.avant) cfg.avant(ctx, cam, t);

      // La troupe, plus ce que le jeu veut faire trier avec elle.
      var ordre = (cfg.extras ? cfg.extras(t) : []).slice();
      for (var k = suite.length - 1; k >= 0; k--) {
        var p = trace[Math.min(trace.length - 1, (k + 1) * 22)] || chef;
        ordre.push({ id: suite[k], x: p.x, y: p.y, dir: p.dir,
                     pas: chef.pas + k * 2, bouge: chef.bouge });
      }
      if (meneur) {
        ordre.push({ id: meneur, x: chef.x, y: chef.y, dir: chef.dir,
                     pas: chef.pas, bouge: chef.bouge });
      }
      ordre.sort(function (a, b) { return a.y - b.y; });
      ordre.forEach(function (p) { poserSprite(p, t); });

      if (cfg.apres) cfg.apres(ctx, cam, t);
    }

    function boucle(t) {
      if (!vivant) return;
      if (cfg.vivant && !cfg.vivant()) { arreter(); return; }
      var dt = dernier ? Math.min(0.05, (t - dernier) / 1000) : 0;
      dernier = t;

      var vx = dir.x, vy = dir.y;
      if (touches.g) vx = -1; if (touches.d) vx = 1;
      if (touches.h) vy = -1; if (touches.b) vy = 1;
      var n = Math.sqrt(vx * vx + vy * vy);
      if (n > 1) { vx /= n; vy /= n; }

      var fige = cfg.fige && cfg.fige();
      chef.bouge = !fige && !!(vx || vy);
      if (chef.bouge) {
        var V = vitesse();
        var nx = chef.x + vx * V * dt;
        var ny = chef.y + vy * V * dt;
        if (libre(nx, chef.y)) chef.x = nx;
        if (libre(chef.x, ny)) chef.y = ny;
        chef.dir = window.CHIBI ? window.CHIBI.sens(vx, vy, chef.dir) : chef.dir;
        chef.pas += (Math.abs(vx) + Math.abs(vy)) * dt * 30;
        trace.unshift({ x: chef.x, y: chef.y, dir: chef.dir });
        if (trace.length > 400) trace.length = 400;
      }

      // La camera suit, mais ne sort jamais de la carte.
      cam.x = borne(chef.x - VUE_W / 2, 0, MW * TS - VUE_W);
      cam.y = borne(chef.y - VUE_H / 2, 0, MH * TS - VUE_H);

      var c = caseDuChef(), casier = c[0] + ',' + c[1];
      if (casier !== derniereCase) {
        derniereCase = casier;
        if (cfg.surCase) cfg.surCase(c[0], c[1], tuile(c[0], c[1]));
      }

      dessiner(t);
      if (cfg.chaqueImage) cfg.chaqueImage(t);

      requestAnimationFrame(boucle);
    }

    requestAnimationFrame(boucle);

    return {
      chef: chef, cam: cam, arreter: arreter,
      caseDuChef: caseDuChef, caseDevant: caseDevant, tuile: tuile,
      libre: libre, monde: monde, DIRS: DIRS
    };
  }

  // La taille de la toile d'une scene de marche. Dans le pad, c'est
  // 480 x 316. En plein ecran, elle prend la forme de la fenetre : on ne
  // grossit pas davantage les pixels, on montre plus de terrain, sur les
  // cotes ou en hauteur. Jamais plus que la carte elle-meme.
  function vue(MW, MH) {
    var L = 480, H = 316;
    var ecran = document.getElementById('screen');
    if (ecran && document.body.classList.contains('is-plein')) {
      var r = ecran.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        var forme = r.width / r.height;
        if (forme >= L / H) L = Math.round(H * forme / 2) * 2;
        else H = Math.round(L / forme / 2) * 2;
      }
    }
    return { L: Math.min(L, MW * TS), H: Math.min(H, MH * TS) };
  }

  window.MONDE = {
    TS: TS, T: T, BLOQUANT: BLOQUANT, estEau: estEau,
    bruit: bruit, borne: borne, vue: vue,
    peindre: peindre, repeindre: repeindre, Balade: Balade,
    // Pour la vue a la premiere personne de l'Odyssee (js/odyssey-fps.js) :
    // le sol seul, sans ce qui pousse ou se dresse dessus.
    solTuile: solTuile, teinte: teinte
  };
})();
