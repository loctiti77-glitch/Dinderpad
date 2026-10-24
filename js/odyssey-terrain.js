// Les grandes cartes de l'Odyssee.
//
// Chaque monde fait 120 x 84 cases, trois fois la largeur et la hauteur
// d'avant. Le terrain n'est plus un sol seme de rochers : des bruits lisses
// a plusieurs echelles y dessinent des regions — des lacs du liquide de
// l'astre, des cretes rocheuses qui font des labyrinthes, des champs de
// cristaux, des bosquets de la vegetation propre a ce monde (arbres sur
// Terre, champignons sur Venus, coraux sur Neptune, pics de metal sur
// Ferron...), et des ruines. Tout est deterministe : un monde a toujours la
// meme carte.
//
// Trois poches scellees par monde cachent un coffre : l'une est muree de
// roche (il faut la pioche), l'autre de cristal (la foreuse), la derniere
// entouree de liquide (les bottes de flottaison).
//
// Le module place aussi ce qui se ramasse : filons, plantes, debris,
// gisements propres a l'astre, et les coffres.
(function () {
  var M = window.MONDE;
  if (!M) return;
  var T = M.T, TS = M.TS, bruit = M.bruit;

  var MW = 120, MH = 84;
  // Le point d'arrivee, au milieu de la carte, un peu vers le bas.
  var DX = 60, DY = 50;
  // L'ancienne carte de 40 x 28, quand on en garde le coeur (la Lune) :
  // elle se pose ici, et son point d'arrivee tombe sur le nouveau.
  var O = { x: DX - 20, y: DY - 22 };

  // ---------- La vegetation de chaque astre ----------
  // "plante" choisit la silhouette (voir js/game-monde.js), "densite"
  // regle combien il en pousse.
  var FLORE = {
    mercure: { plante: 'pic', flore: '#9a8e80', flore2: '#c8bcae', fleur: '#ffd07a', densite: 0.35 },
    venus:   { plante: 'champignon', flore: '#a8a030', flore2: '#d8d060', fleur: '#f4f79a', densite: 0.6 },
    terre:   { plante: 'arbre', flore: '#2f6a2c', flore2: '#4f9a42', fleur: '#f2e27a', tronc: '#6b4526', densite: 1 },
    lune:    { plante: 'pic', flore: '#9a9aa4', flore2: '#c8c8d2', fleur: '#e8fbff', densite: 0.15 },
    mars:    { plante: 'cactus', flore: '#8a4a2a', flore2: '#b8683a', fleur: '#ffb07a', densite: 0.4 },
    jupiter: { plante: 'champignon', flore: '#b87a4a', flore2: '#e0a870', fleur: '#fff0c0', densite: 0.5 },
    saturne: { plante: 'givre', flore: '#c8b88a', flore2: '#f0e4c0', fleur: '#ffffff', densite: 0.4 },
    uranus:  { plante: 'givre', flore: '#7ad0e8', flore2: '#c8f4ff', fleur: '#ffffff', densite: 0.5 },
    neptune: { plante: 'corail', flore: '#3a5ad8', flore2: '#6a8af4', fleur: '#a8f4ff', densite: 0.65 },
    cryos:   { plante: 'givre', flore: '#a8c8f0', flore2: '#e8f4ff', fleur: '#ffffff', densite: 0.5 },
    opaline: { plante: 'prisme', flore: '#e8b8d8', flore2: '#fff0f8', fleur: '#a8f0ff', densite: 0.55 },
    altera:  { plante: 'arbre', flore: '#5a2a8a', flore2: '#8a4ac8', fleur: '#ffd0f0', tronc: '#3a2a3a', densite: 0.9 },
    viridia: { plante: 'fougere', flore: '#1a7a3a', flore2: '#3ab05a', fleur: '#f0ff7a', tronc: '#4a3a1a', densite: 1 },
    ferron:  { plante: 'pic', flore: '#5a6068', flore2: '#9aa4b0', fleur: '#3ad0ff', densite: 0.45 },
    brisure: { plante: 'prisme', flore: '#2a1a3a', flore2: '#ff5aa8', fleur: '#ff5aa8', densite: 0.45 },
    pyrrhe:  { plante: 'cactus', flore: '#c8a050', flore2: '#ffe08a', fleur: '#ffffff', densite: 0.35 },
    ignis:   { plante: 'flamme', flore: '#ff5a14', flore2: '#ff9a2a', fleur: '#ffe08a', tronc: '#2a1a16', densite: 0.5 }
  };

  // La palette complete d'un astre : la sienne, plus sa vegetation.
  function palette(a) {
    var p = {}, k, f = FLORE[a.id] || FLORE.mercure;
    for (k in a.palette) p[k] = a.palette[k];
    for (k in f) p[k] = f[k];
    return p;
  }

  // Un bruit lisse : le bruit stable, interpole entre les points d'une
  // grille de pas "ech". C'est lui qui fait des regions plutot que du sel.
  function lisse(x, y, ech, sel) {
    var gx = x / ech, gy = y / ech, x0 = Math.floor(gx), y0 = Math.floor(gy);
    var u = gx - x0, v = gy - y0;
    u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    var a = bruit(x0, y0, sel), b = bruit(x0 + 1, y0, sel);
    var c = bruit(x0, y0 + 1, sel), d = bruit(x0 + 1, y0 + 1, sel);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function dans(g, x, y) { return y >= 0 && x >= 0 && y < g.length && x < g[0].length; }

  // ---------- Les chemins ----------
  // Les cases qu'on atteint a pied depuis le point d'arrivee.
  function accessibles(g, dep) {
    dep = dep || [DX, DY];
    var H = g.length, W = g[0].length;
    var vu = {}, file = [dep], i = 0;
    vu[dep[0] + ',' + dep[1]] = true;
    while (i < file.length) {
      var c = file[i++];
      for (var k = 0; k < 4; k++) {
        var nx = c[0] + [1, -1, 0, 0][k], ny = c[1] + [0, 0, 1, -1][k];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (M.BLOQUANT[g[ny][nx]]) continue;
        var cle = nx + ',' + ny;
        if (vu[cle]) continue;
        vu[cle] = true;
        file.push([nx, ny]);
      }
    }
    return vu;
  }

  function compte(vu) { var n = 0; for (var k in vu) n++; return n; }

  // Le relief coupe la carte en poches : on perce un passage depuis
  // chaque poche isolee vers le depart, en equerre, et l'on s'arrete des
  // qu'on retombe sur une case deja reliee. Les passages sont courts.
  function relier(g, dep, tours) {
    dep = dep || [DX, DY];
    var H = g.length, W = g[0].length;
    for (var tour = 0; tour < (tours || 400); tour++) {
      var vu = accessibles(g, dep), cible = null, x, y;
      for (y = 2; y < H - 2 && !cible; y++) {
        for (x = 2; x < W - 2 && !cible; x++) {
          if (!M.BLOQUANT[g[y][x]] && !vu[x + ',' + y]) cible = [x, y];
        }
      }
      if (!cible) return;
      x = cible[0]; y = cible[1];
      var touche = false;
      // On part d'abord a l'horizontale ou a la verticale selon la case,
      // pour que les passages ne soient pas tous orientes pareil.
      var dabordX = bruit(x, y, 77) < 0.5;
      for (var phase = 0; phase < 2 && !touche; phase++) {
        var horiz = (phase === 0) === dabordX;
        while (!touche && (horiz ? x !== dep[0] : y !== dep[1])) {
          if (horiz) x += x < dep[0] ? 1 : -1; else y += y < dep[1] ? 1 : -1;
          if (vu[x + ',' + y]) { touche = true; break; }
          if (M.BLOQUANT[g[y][x]]) g[y][x] = T.GRAVATS;
        }
      }
    }
  }

  // Les petits ilots qu'on ne peut pas atteindre — une langue de terre au
  // milieu d'un lac, un creux entre deux cretes — sont combles plutot que
  // relies : percer un passage droit jusqu'a eux zebrait les lacs.
  function combler(g) {
    var H = g.length, W = g[0].length, vu = accessibles(g), deja = {};
    for (var y = 2; y < H - 2; y++) for (var x = 2; x < W - 2; x++) {
      var cle = x + ',' + y;
      if (M.BLOQUANT[g[y][x]] || vu[cle] || deja[cle]) continue;
      // La poche entiere, et ce qui l'entoure.
      var poche = [[x, y]], i = 0, eau = 0, mur = 0;
      deja[cle] = true;
      while (i < poche.length && poche.length < 60) {
        var c = poche[i++];
        for (var k = 0; k < 4; k++) {
          var nx = c[0] + [1, -1, 0, 0][k], ny = c[1] + [0, 0, 1, -1][k], ck = nx + ',' + ny;
          if (!dans(g, nx, ny)) continue;
          var t = g[ny][nx];
          if (M.BLOQUANT[t]) { if (t === T.LIQUIDE) eau++; else mur++; continue; }
          if (deja[ck]) continue;
          deja[ck] = true;
          poche.push([nx, ny]);
        }
      }
      if (poche.length >= 60) continue;            // assez grande : on la relie
      var tuile = eau > mur ? T.LIQUIDE : T.ROCHE_A;
      poche.forEach(function (q) { g[q[1]][q[0]] = tuile; });
    }
  }

  // ---------- Les ruines ----------
  function ruines(g, sel, nb) {
    var faites = [];
    for (var essai = 0; essai < 80 && faites.length < nb; essai++) {
      var w = 6 + Math.floor(bruit(essai, 1, sel) * 6), h = 5 + Math.floor(bruit(essai, 2, sel) * 4);
      var x0 = 4 + Math.floor(bruit(essai, 3, sel) * (MW - w - 8));
      var y0 = 4 + Math.floor(bruit(essai, 4, sel) * (MH - h - 8));
      if (Math.abs(x0 + w / 2 - DX) < w / 2 + 8 && Math.abs(y0 + h / 2 - DY) < h / 2 + 8) continue;
      var libre = faites.every(function (r) {
        return x0 > r[0] + r[2] + 4 || x0 + w + 4 < r[0] || y0 > r[1] + r[3] + 4 || y0 + h + 4 < r[1];
      });
      if (!libre) continue;
      for (var y = y0; y < y0 + h; y++) {
        for (var x = x0; x < x0 + w; x++) {
          var bord = y === y0 || y === y0 + h - 1 || x === x0 || x === x0 + w - 1;
          if (!bord) { g[y][x] = bruit(x, y, sel + 7) < 0.2 ? T.GRAVATS : T.SOL; continue; }
          var n = bruit(x, y, sel + 8);
          g[y][x] = n < 0.28 ? T.SOL : n < 0.55 ? T.RUINE : T.STRUCTURE;
        }
      }
      // Deux portes, au moins : au milieu du bas et du haut.
      g[y0 + h - 1][x0 + (w >> 1)] = T.SOL; g[y0 + h - 1][x0 + (w >> 1) - 1] = T.SOL;
      g[y0][x0 + (w >> 1)] = T.SOL;
      faites.push([x0, y0, w, h]);
    }
    return faites;
  }

  // ---------- Les poches scellees ----------
  // Un carre de 3 x 3 cases libres, ceint d'un anneau epais de deux cases
  // de roche, de cristal ou de liquide. On verifie qu'elle ne coupe rien
  // d'autre : sinon on la defait et l'on cherche ailleurs.
  var BARRIERES = [
    { id: 'roche', tuile: T.ROCHE_A, outil: 'pioche' },
    { id: 'cristal', tuile: T.CRISTAL, outil: 'foreuse' },
    { id: 'liquide', tuile: T.LIQUIDE, outil: 'bottes' }
  ];

  function poches(g, sel) {
    var out = [];
    var avant = accessibles(g), nAvant = compte(avant);
    BARRIERES.forEach(function (bar, k) {
      for (var essai = 0; essai < 900; essai++) {
        var cx = 6 + Math.floor(bruit(essai, k, sel + 20) * (MW - 12));
        var cy = 6 + Math.floor(bruit(essai, k + 9, sel + 21) * (MH - 12));
        if (Math.abs(cx - DX) + Math.abs(cy - DY) < 22) continue;
        if (out.some(function (p) { return Math.abs(p.x - cx) + Math.abs(p.y - cy) < 20; })) continue;
        var ok = true, x, y;
        // Le coeur doit etre libre ; l'anneau peut mordre sur du decor.
        for (y = cy - 1; y <= cy + 1 && ok; y++) for (x = cx - 1; x <= cx + 1; x++) {
          if (!avant[x + ',' + y]) { ok = false; break; }
        }
        for (y = cy - 3; y <= cy + 3 && ok; y++) for (x = cx - 3; x <= cx + 3; x++) {
          if (g[y][x] === T.STRUCTURE || g[y][x] === T.RUINE) { ok = false; break; }
        }
        if (!ok) continue;
        var sauve = [];
        for (y = cy - 3; y <= cy + 3; y++) {
          sauve.push(g[y].slice(cx - 3, cx + 4));
          for (x = cx - 3; x <= cx + 3; x++) {
            var d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
            g[y][x] = d <= 1 ? T.SOL : bar.tuile;
          }
        }
        var apres = accessibles(g), nApres = compte(apres);
        // Le coeur (9 cases) et l'anneau disparaissent du chemin ; rien
        // d'autre ne doit etre coupe.
        if (nAvant - nApres <= 49 && !apres[cx + ',' + cy]) {
          out.push({ x: cx, y: cy, barriere: bar.id, outil: bar.outil });
          avant = apres; nAvant = nApres;
          break;
        }
        for (y = cy - 3; y <= cy + 3; y++) for (x = cx - 3; x <= cx + 3; x++) g[y][x] = sauve[y - cy + 3][x - cx + 3];
      }
    });
    return out;
  }

  // Une seule poche de plus, pour une cache precise (un fragment du
  // Telescope) : meme anneau de deux cases, loin des poches deja posees.
  // Rend { x, y, barriere }, ou null si la carte n'a pas la place.
  function pocheSeule(g, sel, barId) {
    var bar = BARRIERES.filter(function (b) { return b.id === barId; })[0];
    if (!bar) return null;
    var avant = accessibles(g), nAvant = compte(avant), deja = g.poches || [];
    for (var essai = 0; essai < 1500; essai++) {
      var cx = 6 + Math.floor(bruit(essai, 31, sel + 40) * (MW - 12));
      var cy = 6 + Math.floor(bruit(essai, 37, sel + 41) * (MH - 12));
      if (Math.abs(cx - DX) + Math.abs(cy - DY) < 26) continue;
      if (deja.some(function (p) { return Math.abs(p.x - cx) + Math.abs(p.y - cy) < 16; })) continue;
      var ok = true, x, y;
      for (y = cy - 1; y <= cy + 1 && ok; y++) for (x = cx - 1; x <= cx + 1; x++) {
        if (!avant[x + ',' + y]) { ok = false; break; }
      }
      for (y = cy - 3; y <= cy + 3 && ok; y++) for (x = cx - 3; x <= cx + 3; x++) {
        if (g[y][x] === T.STRUCTURE || g[y][x] === T.RUINE) { ok = false; break; }
      }
      if (!ok) continue;
      var sauve = [];
      for (y = cy - 3; y <= cy + 3; y++) {
        sauve.push(g[y].slice(cx - 3, cx + 4));
        for (x = cx - 3; x <= cx + 3; x++) {
          var d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
          g[y][x] = d <= 1 ? T.SOL : bar.tuile;
        }
      }
      var apres = accessibles(g);
      if (nAvant - compte(apres) <= 49 && !apres[cx + ',' + cy]) return { x: cx, y: cy, barriere: bar.id };
      for (y = cy - 3; y <= cy + 3; y++) for (x = cx - 3; x <= cx + 3; x++) g[y][x] = sauve[y - cy + 3][x - cx + 3];
    }
    return null;
  }

  // ---------- Le monde ----------
  function construire(a) {
    var g = [], x, y, sel = a.rang * 17 + 5;
    var f = FLORE[a.id] || FLORE.mercure, dens = f.densite;
    var seuilEau = 0.2 + (a.eau || 0.05) * 1.1;
    var crete = 0.034 + (a.roche || 0.1) * 0.16;
    var seuilCristal = 0.79 - (a.cristal || 0.02) * 3;

    for (y = 0; y < MH; y++) {
      g.push([]);
      for (x = 0; x < MW; x++) {
        var t = bruit(x, y, sel) < 0.16 ? T.SOL_B : T.SOL;
        var h = lisse(x, y, 13, sel) * 0.7 + lisse(x, y, 5, sel + 1) * 0.3;
        if (h < seuilEau) t = T.LIQUIDE;
        else {
          var r = Math.abs(lisse(x, y, 10, sel + 2) - 0.5);
          if (r < crete && bruit(x, y, sel + 9) < 0.86) t = T.ROCHE_A;
          else if (bruit(x, y, sel + 1) < (a.roche || 0.1) * 0.22) t = T.ROCHE_A;
          else if (lisse(x, y, 9, sel + 3) > seuilCristal && bruit(x, y, sel + 4) < 0.42) t = T.CRISTAL;
          else {
            var zf = lisse(x, y, 8, sel + 5);
            var n = bruit(x, y, sel + 6);
            if (zf > 0.53) {
              // Au coeur du bosquet, la vegetation se serre.
              var coeur = Math.min(1, (zf - 0.53) * 6);
              if (n < (0.12 + 0.22 * coeur) * dens) t = T.PLANTE;
              else if (n < (0.45 + 0.3 * coeur) * dens) t = T.FLORE;
            } else if (n < 0.07 * dens) t = T.FLORE;
          }
        }
        g[y].push(t);
      }
    }

    // Des gravats au pied des rochers.
    for (y = 1; y < MH - 1; y++) for (x = 1; x < MW - 1; x++) {
      if (g[y][x] !== T.SOL && g[y][x] !== T.SOL_B) continue;
      var pres = g[y - 1][x] === T.ROCHE_A || g[y + 1][x] === T.ROCHE_A || g[y][x - 1] === T.ROCHE_A || g[y][x + 1] === T.ROCHE_A;
      if (pres && bruit(x, y, sel + 10) < 0.3) g[y][x] = T.GRAVATS;
    }

    var lesRuines = ruines(g, sel + 30, 5 + Math.floor(bruit(1, 1, sel) * 4));

    // Les bords, et la clairiere de l'arrivee.
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
      if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) g[y][x] = T.ROCHE_A;
      else if (Math.abs(x - DX) + Math.abs(y - DY) <= 5) g[y][x] = T.SOL;
    }

    combler(g);
    relier(g);
    var lesPoches = poches(g, sel);
    g.poches = lesPoches;
    g.ruines = lesRuines;
    return g;
  }

  // La Lune garde son coeur dessine a la main (la base, la falaise, la
  // grotte) : il est pose au milieu d'une grande plaine de crateres.
  function construireAutour(a, coeur) {
    var g = [], x, y, sel = 913;
    for (y = 0; y < MH; y++) {
      g.push([]);
      for (x = 0; x < MW; x++) g[y].push(bruit(x, y, sel) < 0.18 ? T.SOL_B : T.SOL);
    }
    // Des crateres partout.
    for (var c = 0; c < 26; c++) {
      var cx = 4 + Math.floor(bruit(c, 1, sel) * (MW - 8)), cy = 4 + Math.floor(bruit(c, 2, sel) * (MH - 8));
      var r = 1 + Math.floor(bruit(c, 3, sel) * 4);
      for (y = cy - r - 1; y <= cy + r + 1; y++) for (x = cx - r - 1; x <= cx + r + 1; x++) {
        if (!dans(g, x, y)) continue;
        var d = Math.hypot(x - cx, y - cy);
        if (d <= r - 0.5) g[y][x] = T.LIQUIDE;
        else if (d <= r + 1) g[y][x] = T.GRAVATS;
      }
    }
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
      if (g[y][x] !== T.SOL && g[y][x] !== T.SOL_B) continue;
      var n = bruit(x, y, sel + 3);
      if (n < 0.05) g[y][x] = T.ROCHE_A;
      else if (n < 0.065) g[y][x] = T.CRISTAL;
      else if (n < 0.08) g[y][x] = T.FLORE;
    }
    var lesRuines = ruines(g, sel + 30, 4);
    // Le coeur, sans sa bordure (sauf la falaise du nord).
    var CH = coeur.length, CW = coeur[0].length;
    for (y = 0; y < CH; y++) for (x = 0; x < CW; x++) {
      if (x < 2 || x >= CW - 2 || y >= CH - 2) continue;
      g[y + O.y][x + O.x] = coeur[y][x];
    }
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
      if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) g[y][x] = T.ROCHE_A;
    }
    relier(g);
    g.poches = poches(g, sel);
    g.ruines = lesRuines;
    return g;
  }

  // ==========================================================
  //  Ce qui se ramasse
  // ==========================================================
  // Les memes places a chaque visite : on retrouve ses filons. Ils
  // repoussent quand on revient sur le monde ; les coffres, eux, ne se
  // vident qu'une fois.
  function placer(g, a, eviter) {
    var vu = accessibles(g), sel = a.rang * 31 + 11, stellaire = a.systeme && a.systeme !== 'solaire';
    var pris = {}, noeuds = [], coffres = [];
    function prendre(x, y, marge) {
      for (var j = -marge; j <= marge; j++) for (var i = -marge; i <= marge; i++) if (pris[(x + i) + ',' + (y + j)]) return false;
      pris[x + ',' + y] = true;
      return true;
    }
    function loinDe(x, y) {
      if (Math.abs(x - DX) + Math.abs(y - DY) < 6) return false;
      return !(eviter || []).some(function (e) { return Math.abs(e.x - x) + Math.abs(e.y - y) < (e.loin || 4); });
    }
    function voisin(x, y, t) {
      for (var k = 0; k < 4; k++) {
        var nx = x + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
        if (dans(g, nx, ny) && g[ny][nx] === t) return true;
      }
      return false;
    }

    // Les noeuds : on tire des cases au hasard, et chacune donne ce que
    // son voisinage suggere — un filon au pied d'un rocher, une plante
    // dans un bosquet, des debris dans une ruine.
    var VOULUS = 80;
    for (var essai = 0; essai < 4000 && noeuds.length < VOULUS; essai++) {
      var x = 3 + Math.floor(bruit(essai, 1, sel) * (MW - 6)), y = 3 + Math.floor(bruit(essai, 2, sel) * (MH - 6));
      if (!vu[x + ',' + y] || !loinDe(x, y)) continue;
      var t = g[y][x];
      if (t !== T.SOL && t !== T.SOL_B && t !== T.GRAVATS && t !== T.FLORE) continue;
      var n = bruit(essai, 3, sel), type;
      if (voisin(x, y, T.ROCHE_A) && n < 0.75) type = 'filon';
      else if ((t === T.FLORE || voisin(x, y, T.PLANTE)) && n < 0.8) type = 'plante';
      else if ((voisin(x, y, T.STRUCTURE) || voisin(x, y, T.RUINE)) && n < 0.8) type = 'debris';
      else if (voisin(x, y, T.CRISTAL) && n < 0.6) type = 'eclats';
      else {
        var m = bruit(essai, 4, sel);
        type = m < 0.2 ? 'gisement' : m < 0.32 && stellaire ? 'poussiere' : m < 0.55 ? 'filon' : m < 0.8 ? 'plante' : 'debris';
      }
      if (!prendre(x, y, 1)) continue;
      noeuds.push({ type: type, tx: x, ty: y, x: (x + 0.5) * TS, y: (y + 0.5) * TS, k: noeuds.length });
    }

    // Les coffres ordinaires : loin du depart, ecartes les uns des autres.
    for (essai = 0; essai < 3000 && coffres.length < 10; essai++) {
      x = 3 + Math.floor(bruit(essai, 5, sel) * (MW - 6)); y = 3 + Math.floor(bruit(essai, 6, sel) * (MH - 6));
      if (!vu[x + ',' + y] || !loinDe(x, y)) continue;
      if (Math.abs(x - DX) + Math.abs(y - DY) < 14) continue;
      if (M.BLOQUANT[g[y][x]] || g[y][x] === T.LIQUIDE) continue;
      if (coffres.some(function (c) { return Math.abs(c.tx - x) + Math.abs(c.ty - y) < 14; })) continue;
      if (!prendre(x, y, 1)) continue;
      coffres.push({ id: a.id + ':c' + coffres.length, scelle: false, tx: x, ty: y, x: (x + 0.5) * TS, y: (y + 0.5) * TS });
    }
    // Les coffres scelles, au coeur des poches.
    (g.poches || []).forEach(function (p, i) {
      coffres.push({ id: a.id + ':s' + i, scelle: true, barriere: p.barriere, outil: p.outil,
                     tx: p.x, ty: p.y, x: (p.x + 0.5) * TS, y: (p.y + 0.5) * TS });
    });
    return { noeuds: noeuds, coffres: coffres };
  }

  window.ODYTERRAIN = {
    MW: MW, MH: MH, DX: DX, DY: DY, O: O, FLORE: FLORE,
    palette: palette, lisse: lisse,
    construire: construire, construireAutour: construireAutour,
    accessibles: accessibles, relier: relier, placer: placer,
    combler: combler, ruines: ruines, poches: poches, pocheSeule: pocheSeule, dans: dans
  };
})();
