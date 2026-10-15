// Wade and Friends : le rendu des pieces.
//
// FNaF tient son allure d'images precalculees en 3D : des pieces sombres,
// une lumiere qui tombe d'une seule lampe, des ombres franches, du grain.
// On fait la meme chose, en petit : chaque piece est decrite en boites
// (murs, tables, banquettes, comptoir...), et un lancer de rayons la
// calcule une fois pour toutes, avec ses ombres, son occlusion dans les
// coins et les reflets du carrelage. Le calcul tourne dans des workers,
// pendant que le joueur lit le menu.
//
// Les animatroniques ne sont pas dans la 3D : ce sont les rendus de
// l'auteur, poses ensuite par-dessus, a la bonne taille, eclaires comme
// la piece les eclaire, et caches par ce qui se trouve devant eux grace a
// la profondeur que le rendu laisse derriere lui.
(function () {

  // ==========================================================
  //  La projection
  //  Commune au worker et a la page : le worker lance les rayons, la
  //  page y pose les personnages. Repere : y en haut ; a un lacet nul, la
  //  camera regarde vers +z, et +x est a sa droite.
  // ==========================================================

  function PROJ() {
    function base(c) {
      var hf = c.fov * Math.PI / 360;
      return { cy: Math.cos(c.lacet || 0), sy: Math.sin(c.lacet || 0),
               cp: Math.cos(c.tangage || 0), sp: Math.sin(c.tangage || 0),
               hf: hf, t: Math.tan(hf), asp: c.h / c.w, cyl: c.mode === 'cyl',
               w: c.w, h: c.h, pos: c.pos };
    }
    function versMonde(b, v) {
      var y = v[1] * b.cp + v[2] * b.sp, z = -v[1] * b.sp + v[2] * b.cp, x = v[0];
      return [x * b.cy + z * b.sy, y, -x * b.sy + z * b.cy];
    }
    function versCam(b, v) {
      var x = v[0] * b.cy - v[2] * b.sy, z = v[0] * b.sy + v[2] * b.cy;
      return [x, v[1] * b.cp - z * b.sp, v[1] * b.sp + z * b.cp];
    }
    // La direction du rayon qui passe par le point (px, py) de l'image.
    function rayon(b, px, py) {
      var nx = px / b.w * 2 - 1, ny = 1 - py / b.h * 2, v;
      if (b.cyl) {
        var a = nx * b.hf;
        v = [Math.sin(a), ny * b.hf * b.asp, Math.cos(a)];
      } else {
        v = [nx * b.t, ny * b.t * b.asp, 1];
      }
      var d = versMonde(b, v);
      var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
      return [d[0] / l, d[1] / l, d[2] / l];
    }
    // Ou tombe un point du monde : [x, y, distance], ou null derriere.
    function projeter(b, p) {
      var c = versCam(b, [p[0] - b.pos[0], p[1] - b.pos[1], p[2] - b.pos[2]]);
      var dist = Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]);
      if (b.cyl) {
        var r = Math.sqrt(c[0] * c[0] + c[2] * c[2]);
        if (r < 1e-6) return null;
        var a = Math.atan2(c[0], c[2]);
        return [(a / b.hf + 1) / 2 * b.w, (1 - (c[1] / r) / (b.hf * b.asp)) / 2 * b.h, dist];
      }
      if (c[2] <= 0.01) return null;
      return [(c[0] / c[2] / b.t + 1) / 2 * b.w,
              (1 - c[1] / c[2] / (b.t * b.asp)) / 2 * b.h, dist];
    }
    return { base: base, rayon: rayon, projeter: projeter };
  }

  // ==========================================================
  //  Les pieces
  //  De la donnee pure : des boites, des matieres nommees, des lampes, et
  //  la place des personnages. Le worker en tire l'image ; la page, les
  //  poses et les contours des portes.
  // ==========================================================

  function SCENES() {
    var EP = 0.25;                     // l'epaisseur des murs

    function B(x0, y0, z0, x1, y1, z1, m, o) {
      var b = { a: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)],
                b: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], m: m };
      if (o) for (var k in o) b[k] = o[k];
      return b;
    }

    // Un mur le long d'un axe, perce de baies : [debut, fin, bas, haut].
    // axe 'x' : mur a x = pos, qui court en z de u0 a u1 ; 'z' : l'inverse.
    // dehors : -1 ou 1, le cote ou s'epaissit le mur.
    function mur(axe, pos, dehors, u0, u1, h, m, baies) {
      var L = [];
      var e0 = dehors < 0 ? pos - EP : pos, e1 = dehors < 0 ? pos : pos + EP;
      function boite(ua, ub, ya, yb) {
        if (ub - ua < 0.001 || yb - ya < 0.001) return;
        if (axe === 'x') L.push(B(e0, ya, ua, e1, yb, ub, m));
        else L.push(B(ua, ya, e0, ub, yb, e1, m));
      }
      var bs = (baies || []).slice().sort(function (a, b) { return a[0] - b[0]; });
      var u = u0 - EP;
      bs.forEach(function (o) {
        boite(u, o[0], 0, h);
        boite(o[0], o[1], 0, o[2]);
        boite(o[0], o[1], o[3], h);
        u = o[1];
      });
      boite(u, u1 + EP, 0, h);
      return L;
    }

    // Une piece fermee : sol, plafond, quatre murs (et leurs baies).
    function piece(o) {
      var L = [];
      L.push(B(o.x0 - 1, -0.3, o.z0 - 1, o.x1 + 1, 0, o.z1 + 1, o.sol));
      L.push(B(o.x0 - 1, o.h, o.z0 - 1, o.x1 + 1, o.h + 0.3, o.z1 + 1, o.plafond));
      var b = o.baies || {};
      L = L.concat(mur('x', o.x0, -1, o.z0, o.z1, o.h, o.murs.x0 || o.murs.d, b.x0));
      L = L.concat(mur('x', o.x1, 1, o.z0, o.z1, o.h, o.murs.x1 || o.murs.d, b.x1));
      L = L.concat(mur('z', o.z0, -1, o.x0, o.x1, o.h, o.murs.z0 || o.murs.d, b.z0));
      L = L.concat(mur('z', o.z1, 1, o.x0, o.x1, o.h, o.murs.z1 || o.murs.d, b.z1));
      return { nom: 'coque', boites: L, ombre: false };
    }

    function obj(nom, boites, o) {
      var r = { nom: nom, boites: boites, ombre: true };
      if (o) for (var k in o) r[k] = o[k];
      return r;
    }

    // Une table de diner : plateau stratifie cercle de chrome, pied central.
    function table(x, z, l, p) {
      l = l || 1.2; p = p || 0.8;
      return obj('table', [
        B(x - l / 2, 0.72, z - p / 2, x + l / 2, 0.77, z + p / 2, 'formica'),
        B(x - l / 2 - 0.02, 0.70, z - p / 2 - 0.02, x + l / 2 + 0.02, 0.72, z + p / 2 + 0.02, 'chrome'),
        B(x - 0.05, 0.05, z - 0.05, x + 0.05, 0.70, z + 0.05, 'chrome'),
        B(x - 0.3, 0, z - 0.3, x + 0.3, 0.05, z + 0.3, 'chrome')
      ]);
    }

    // Une chaise : assise de vinyle, dossier, quatre pieds reduits a deux.
    function chaise(x, z, sens) {
      var dz = sens * 0.2;
      return obj('chaise', [
        B(x - 0.22, 0.44, z - 0.22, x + 0.22, 0.5, z + 0.22, 'vinyle'),
        B(x - 0.22, 0.5, z + dz - 0.03, x + 0.22, 0.95, z + dz + 0.03, 'vinyle'),
        B(x - 0.2, 0, z - 0.2, x - 0.17, 0.44, z + 0.2, 'chrome'),
        B(x + 0.17, 0, z - 0.2, x + 0.2, 0.44, z + 0.2, 'chrome')
      ]);
    }

    // Une banquette adossee a un mur en x (cote -1 ou 1), centree en z.
    function banquette(xMur, cote, z, l) {
      var x0 = xMur, x1 = xMur - cote * 0.65;
      return obj('banquette', [
        B(x0, 0, z - l / 2, x1, 0.46, z + l / 2, 'vinyle'),
        B(x0, 0.46, z - l / 2, x0 - cote * 0.18, 1.2, z + l / 2, 'vinyle'),
        B(x0 - cote * 0.18, 1.12, z - l / 2, x0 - cote * 0.22, 1.2, z + l / 2, 'chrome')
      ]);
    }

    // Une plaque : une image decoupee, debout dans la piece. Elle prend la
    // lumiere et l'ombre comme le reste, et en jette. p : le milieu du bas ;
    // n : la direction ou elle regarde ('cam' : vers la camera).
    // relief : un faux volume, pour une peluche ou une bouteille.
    function plaque(tex, p, h, o) {
      var s = { tex: tex, p: p, h: h, n: 'cam', relief: 0.8, ombre: true, sale: 0.5 };
      if (o) for (var k in o) s[k] = o[k];
      return { nom: 'plaque', boites: [], sprite: s };
    }

    // Une affiche contre un mur : une plaque de papier, jaunie, tachee, et
    // parfois dechiree jusqu'au mur. face : la normale.
    function affiche(face, pos, u0, u1, y0, y1, img, o) {
      var N = { px: [1, 0, 0], nx: [-1, 0, 0], pz: [0, 0, 1], nz: [0, 0, -1] }[face];
      var uc = (u0 + u1) / 2, d = 0.012;
      var p = face === 'px' || face === 'nx' ? [pos + N[0] * d, y0, uc] : [uc, y0, pos + N[2] * d];
      var s = { tex: img, p: p, h: y1 - y0, w: u1 - u0, n: N, relief: 0, ombre: false,
                papier: true, vieux: 0.6, dechire: 0.5, graine: Math.abs(pos * 13 + u0 * 7 + y0 * 3) };
      if (o) for (var k in o) s[k] = o[k];
      return { nom: 'affiche', boites: [], sprite: s };
    }

    // Une toile d'araignee, dans un angle du plafond.
    function toileAraignee(x, y, z, h) {
      return plaque('toile', [x, y - h, z], h, { relief: 0, ombre: false, sale: 0, ajour: true });
    }

    // Des papiers, des emballages, des gobelets : ce que personne ne
    // ramasse plus.
    function detritus(x, z, n, graine) {
      var L = [], g = graine || 1;
      function h(i) { var v = Math.sin(g * 91.7 + i * 47.3) * 43758.5; return v - Math.floor(v); }
      for (var i = 0; i < n; i++) {
        var px = x + (h(i) - 0.5) * 2.4, pz = z + (h(i + 50) - 0.5) * 2.4;
        var w = 0.12 + h(i + 9) * 0.22, l = 0.1 + h(i + 19) * 0.2;
        L.push(B(px - w / 2, 0, pz - l / 2, px + w / 2, 0.006 + h(i + 3) * 0.01, pz + l / 2,
                 h(i + 7) < 0.6 ? 'papierSale' : 'emballage'));
      }
      return obj('detritus', L, { ombre: false });
    }

    // Un sac poubelle eventre, contre un mur.
    function sacs(x, z, k) {
      var L = [B(x - 0.3, 0, z - 0.25, x + 0.3, 0.5, z + 0.25, 'sac')];
      if (k > 1) L.push(B(x + 0.25, 0, z - 0.1, x + 0.75, 0.38, z + 0.35, 'sac'));
      if (k > 2) L.push(B(x - 0.1, 0.5, z - 0.15, x + 0.3, 0.75, z + 0.15, 'sac'));
      return obj('sacs', L);
    }

    // Une chaise renversee, couchee sur le dossier.
    function chaiseTombee(x, z) {
      return obj('chaise', [
        B(x - 0.22, 0, z - 0.25, x + 0.22, 0.06, z + 0.2, 'vinyle'),
        B(x - 0.22, 0.06, z + 0.14, x + 0.22, 0.5, z + 0.2, 'vinyle'),
        B(x - 0.2, 0.06, z - 0.25, x - 0.17, 0.5, z - 0.22, 'chrome'),
        B(x + 0.17, 0.06, z - 0.25, x + 0.2, 0.5, z - 0.22, 'chrome')
      ]);
    }

    // Une dalle de plafond tombee par terre.
    function dalle(x, z) {
      return obj('dalle', [B(x - 0.3, 0, z - 0.3, x + 0.3, 0.025, z + 0.3, 'plafond')]);
    }

    // Une lampe suspendue : l'abat-jour lumineux et sa lumiere.
    function suspension(x, z, h, coul) {
      return obj('suspension', [
        B(x - 0.01, h - 0.6, z - 0.01, x + 0.01, h, z + 0.01, 'noir'),
        B(x - 0.22, h - 0.75, z - 0.22, x + 0.22, h - 0.6, z + 0.22, 'abatjour'),
        B(x - 0.16, h - 0.77, z - 0.16, x + 0.16, h - 0.75, z + 0.16, { e: coul || [3, 2.5, 1.8] })
      ], { ombre: false });
    }

    function tube(x0, z0, x1, z1, h, coul) {
      return obj('tube', [B(x0, h - 0.06, z0, x1, h, z1, { e: coul || [2.2, 2.4, 2.6] })], { ombre: false });
    }

    // Un couloir droit, vu depuis le bout cote bureau. sens : -1 pour
    // l'ouest, 1 pour l'est (les affiches changent de mur).
    function couloir(sens, affiches) {
      var o = { x0: -1.15, x1: 1.15, z0: 0, z1: 14, h: 3, sol: 'damier', plafond: 'plafond',
                murs: { d: 'murCouloir' },
                baies: { z1: [[-0.7, 0.7, 0, 2.4]] } };
      var objets = [piece(o)];
      objets.push(obj('noir', [B(-3, 0, 14.25, 3, 3, 15, 'noir')], { ombre: false }));
      objets = objets.concat(affiches);
      objets.push(tube(-0.08, 3.6, 0.08, 4.8, 3), tube(-0.08, 9.6, 0.08, 10.8, 3));
      // Un carton oublie, des sacs, des papiers, et la poussiere des angles.
      objets.push(obj('carton', [B(sens * 0.6, 0, 11.2, sens * 1.12, 0.5, 11.9, 'carton')]));
      objets.push(sacs(-sens * 0.75, 7.2, 2), detritus(0, 5.5, 14, 3 + sens), detritus(0, 10, 10, 8 + sens));
      objets.push(dalle(-sens * 0.3, 8.6));
      objets.push(toileAraignee(-1.0, 3, 6.5, 0.7), toileAraignee(1.0, 3, 12.5, 0.8));
      return {
        cam: { pos: [sens * -0.75, 2.65, 0.25], lacet: sens * 0.06, tangage: -0.14, fov: 68 },
        objets: objets,
        lampes: [
          { id: 'a', p: [0, 2.85, 4.2], c: [1.1, 1.05, 0.9], r: 2.6, taille: 0.3 },
          { id: 'b', p: [0, 2.85, 10.2], c: [0.6, 0.62, 0.55], r: 2.4, taille: 0.3 }
        ],
        ambiant: [0.012, 0.012, 0.016], brume: 0.07, expo: 1.4
      };
    }

    var S = {};

    // ---------- Le bureau ----------
    // La seule piece en panoramique : on y tourne la tete, comme dans la
    // loge du gardien de FNaF. Les deux portes donnent sur le bout des
    // couloirs, que seule la lampe du couloir eclaire.
    S.bureau = (function () {
      var porte = [0.1, 1.5, 0, 2.35];
      var o = { x0: -3, x1: 3, z0: -1.6, z1: 3.6, h: 3, sol: 'damier', plafond: 'plafond',
                murs: { d: 'murBureau' }, baies: { x0: [porte], x1: [porte] } };
      var coque = piece(o);
      // Seule piece eclairee du dehors : ses murs doivent arreter la
      // lumiere des couloirs.
      coque.ombre = true;
      var objets = [coque];
      // Le bout des deux couloirs, derriere les portes.
      [-1, 1].forEach(function (s) {
        var xa = s * 3.25, xb = s * 5.6;
        objets.push(obj('couloir', [
          B(xa, -0.3, -5, xb, 0, 6, 'damier'),
          B(xa, 3, -5, xb, 3.3, 6, 'plafond'),
          B(xb, 0, -5, xb + s * 0.25, 3, 6, 'murCouloir'),
          B(xa, 0, -5, xb, 3, -4.7, 'noir'),
          B(xa, 0, 5.7, xb, 3, 6, 'noir')
        ], { ombre: false }));
        objets.push(affiche(s < 0 ? 'px' : 'nx', xb, 0.2, 1.3, 1.1, 2.0, s < 0 ? 'dessins' : 'souriez'));
        // L'encadrement de la porte, en acier, et le caisson du rideau.
        var xi = s * 3;
        objets.push(obj('cadre', [
          B(xi, 0, porte[0] - 0.08, xi - s * 0.06, 2.43, porte[0], 'acier'),
          B(xi, 0, porte[1], xi - s * 0.06, 2.43, porte[1] + 0.08, 'acier'),
          B(xi, 2.35, porte[0] - 0.08, xi - s * 0.06, 2.43, porte[1] + 0.08, 'acier'),
          B(xi, 2.43, porte[0] - 0.12, xi - s * 0.2, 2.75, porte[1] + 0.12, 'acier')
        ], { ombre: false }));
        // Le boitier des boutons, a cote de la porte, cote bureau.
        objets.push(obj('boitier', [B(xi, 0.95, 1.62, xi - s * 0.07, 1.75, 1.98, 'boitier')], { ombre: false }));
      });
      // Le bureau, ses deux ecrans, ses papiers.
      objets.push(obj('bureau', [
        B(-1.55, 0.74, 1.15, 1.55, 0.8, 2.05, 'bois'),
        B(-1.55, 0, 1.18, 1.55, 0.74, 1.24, 'boisSombre'),
        B(-1.55, 0, 1.24, -1.45, 0.74, 2.05, 'boisSombre'),
        B(1.45, 0, 1.24, 1.55, 0.74, 2.05, 'boisSombre')
      ]));
      // Deux moniteurs a tube : la caisse, et la dalle un peu en retrait.
      objets.push(obj('ecran1', [
        B(-1.05, 0.8, 1.52, -0.4, 1.32, 2.0, 'plastique'),
        B(-0.97, 0.88, 1.5, -0.48, 1.25, 1.52, 'ecran')
      ]));
      objets.push(obj('ecran2', [
        B(0.45, 0.8, 1.57, 1.0, 1.25, 2.0, 'plastique'),
        B(0.52, 0.87, 1.55, 0.93, 1.19, 1.57, 'ecran2')
      ]));
      objets.push(obj('papiers', [B(-0.25, 0.8, 1.35, 0.25, 0.81, 1.7, 'papierSale')], { ombre: false }));
      // La peluche de Wade et des Fizzies entames, poses sur le bureau.
      objets.push(plaque('pl-wade', [-1.22, 0.8, 1.55], 0.42));
      objets.push(plaque('bt-wade', [0.22, 0.8, 1.72], 0.3));
      objets.push(plaque('bt-charlie', [1.33, 0.8, 1.75], 0.27, { sale: 0.8 }));
      objets.push(detritus(0, 0.7, 9, 11), detritus(-2.2, 2.6, 6, 12), detritus(2.2, 2.4, 6, 13));
      objets.push(sacs(2.55, 3.15, 2));
      objets.push(toileAraignee(-2.75, 3, 3.35, 0.8), toileAraignee(2.75, 3, 3.35, 0.65));
      objets.push(obj('tasse', [B(1.15, 0.8, 1.35, 1.27, 0.93, 1.47, 'tasse')]));
      // Les affiches du mur du fond.
      objets.push(affiche('nz', 3.6, -0.9, 0.9, 1.15, 2.95, 'logo', { e: 0.02 }));
      objets.push(affiche('nz', 3.6, -2.75, -1.2, 1.25, 2.3, 'fizzies'));
      objets.push(affiche('nz', 3.6, 1.15, 2.7, 1.3, 2.35, 'dessins'));
      objets.push(affiche('px', -3, 2.2, 3.3, 1.2, 2.3, 'regles'));
      objets.push(affiche('nx', 3, 2.2, 3.2, 1.25, 2.4, 'employe'));
      objets.push(suspension(0, 1.4, 3));
      return {
        cam: { pos: [0, 1.32, -0.15], lacet: 0, tangage: -0.04, fov: 184, mode: 'cyl' },
        taille: [1180, 360],
        objets: objets,
        lampes: [
          { id: 'lampe', p: [0, 2.15, 1.4], c: [2.2, 1.65, 1.1], r: 1.25, taille: 0.15 },
          { id: 'ecrans', p: [-0.2, 1.1, 1.3], c: [0.04, 0.12, 0.1], r: 1.0, taille: 0.3, ombre: false },
          { id: 'couloirG', p: [-4.0, 2.8, 0.8], c: [4.2, 4.1, 3.7], r: 1.5, taille: 0.25,
            spot: [0.25, -0.97, 0], cone: [0.4, -0.1] },
          { id: 'couloirD', p: [4.0, 2.8, 0.8], c: [4.2, 4.1, 3.7], r: 1.5, taille: 0.25,
            spot: [-0.25, -0.97, 0], cone: [0.4, -0.1] }
        ],
        variantes: {
          base: ['lampe', 'ecrans'], lumG: ['lampe', 'ecrans', 'couloirG'],
          lumD: ['lampe', 'ecrans', 'couloirD'], noir: []
        },
        ambiant: [0.01, 0.01, 0.012], brume: 0.05, expo: 1.25,
        porte: porte,
        poses: {
          porteG: { p: [-3.85, 0, 0.82], h: 2.15 },
          porteD: { p: [3.85, 0, 0.82], h: 2.15 }
        },
        lumiere: 0.85
      };
    })();

    // ---------- CAM 01 : la scene ----------
    S.scene = {
      cam: { pos: [0, 3.05, 0.6], lacet: 0, tangage: -0.17, fov: 72 },
      objets: [
        piece({ x0: -5.5, x1: 5.5, z0: 0, z1: 10, h: 4.2, sol: 'damier', plafond: 'plafond',
                murs: { d: 'murSalle', z1: 'murScene' } }),
        obj('estrade', [B(-4.6, 0, 6.4, 4.6, 0.7, 10, { f: { py: 'planches' }, d: 'estrade' }),
                        B(-4.6, 0.66, 6.38, 4.6, 0.72, 6.44, 'chrome')]),
        obj('rideaux', [B(-5.5, 0.7, 9.0, -3.7, 4.2, 9.8, 'rideau'),
                        B(3.7, 0.7, 9.0, 5.5, 4.2, 9.8, 'rideau'),
                        B(-5.5, 3.55, 6.2, 5.5, 4.2, 6.6, 'rideau')], { ombre: false }),
        affiche('nz', 10, -1.25, 1.25, 1.2, 4.05, 'logo', { e: 0.06 }),
        obj('enceintes', [B(-3.5, 0.7, 9.1, -2.9, 1.75, 9.6, 'enceinte'),
                          B(2.9, 0.7, 9.1, 3.5, 1.75, 9.6, 'enceinte')]),
        obj('micro', [B(0.62, 0.7, 7.62, 0.66, 1.75, 7.66, 'chrome'),
                      B(0.56, 1.72, 7.56, 0.72, 1.85, 7.72, 'noir')]),
        affiche('nz', 6.2, -5.4, 5.4, 3.25, 3.55, 'fanions', { papier: false, dechire: 0 }),
        table(-3.2, 2.8), table(3.1, 3.4), chaise(-3.2, 2.1, -1), chaiseTombee(3.4, 2.4),
        chaise(-2.4, 3.4, 1),
        plaque('bt-faith', [-3.0, 0.77, 2.75], 0.3), plaque('bt-stephen', [3.3, 0.77, 3.3], 0.28),
        plaque('pl-stephen', [3.9, 0.7, 7.2], 0.45),
        detritus(0, 4.5, 20, 21), detritus(-2.5, 7.5, 6, 22), sacs(-5.0, 0.6, 3), dalle(1.6, 2.2),
        toileAraignee(-5.2, 4.2, 6.3, 1.0), toileAraignee(5.2, 4.2, 6.3, 0.9)
      ],
      lampes: [
        { id: 'face', p: [0, 3.9, 4.0], c: [3.0, 2.4, 1.8], r: 3.2, taille: 0.25,
          spot: [0, -0.45, 0.89], cone: [0.86, 0.6] },
        { id: 'rose', p: [-3.8, 3.9, 5.2], c: [1.6, 0.35, 0.9], r: 3, taille: 0.2,
          spot: [0.45, -0.5, 0.74], cone: [0.85, 0.55] },
        { id: 'bleu', p: [3.8, 3.9, 5.2], c: [0.35, 0.7, 1.6], r: 3, taille: 0.2,
          spot: [-0.45, -0.5, 0.74], cone: [0.85, 0.55] },
        { id: 'salle', p: [0, 3.8, 2.2], c: [0.25, 0.22, 0.2], r: 3, taille: 0.4 }
      ],
      ambiant: [0.01, 0.009, 0.012], brume: 0.04, expo: 1.3,
      poses: {
        wade: { p: [0, 0.7, 8.35], h: 2.2 },
        faith: { p: [-2.0, 0.7, 8.55], h: 2.15 },
        charlie: { p: [2.05, 0.7, 8.55], h: 2.0 }
      }
    };

    // ---------- CAM 02 : la salle ----------
    S.salle = {
      cam: { pos: [5.4, 2.95, 0.55], lacet: -0.72, tangage: -0.24, fov: 76 },
      objets: [
        piece({ x0: -6, x1: 6, z0: 0, z1: 12, h: 3.4, sol: 'damier', plafond: 'plafond',
                murs: { d: 'murSalle' }, baies: { z1: [[-1, 1, 0, 2.4]], x0: [[1.0, 2.4, 0, 2.3]] } }),
        obj('noir', [B(-1.2, 0, 12.25, 1.2, 2.6, 13, 'noir'), B(-7, 0, 0.8, -6.25, 2.5, 2.6, 'noir')], { ombre: false }),
        banquette(-6, -1, 4.5, 1.5), banquette(-6, -1, 7.5, 1.5), banquette(-6, -1, 10.3, 1.5),
        table(-5.0, 4.5, 0.75, 1.2), table(-5.0, 7.5, 0.75, 1.2), table(-5.0, 10.3, 0.75, 1.2),
        table(-1.2, 4.0), table(1.6, 6.2), table(-1.0, 8.8),
        chaise(-1.2, 3.35, -1), chaiseTombee(-0.3, 5.0), chaise(1.6, 5.55, -1),
        chaise(1.6, 6.85, 1), chaiseTombee(-1.8, 9.8),
        plaque('bt-wade', [-1.35, 0.77, 4.0], 0.3), plaque('bt-stephen', [1.45, 0.77, 6.25], 0.3),
        plaque('bt-faith', [-4.95, 0.77, 7.4], 0.28),
        plaque('pl-charlie', [-5.35, 0.46, 10.2], 0.42, { sale: 0.9 }),
        detritus(0, 6, 26, 31), detritus(-3, 9.5, 14, 32), detritus(3.5, 3, 10, 33),
        sacs(5.3, 11.4, 3), sacs(-5.5, 1.4, 1), dalle(1.0, 9.4), dalle(-3.2, 2.6),
        toileAraignee(5.75, 3.4, 11.8, 0.9), toileAraignee(-5.75, 3.4, 11.8, 1.0),
        affiche('nz', 12, 1.8, 4.6, 1.3, 2.9, 'fizzies'),
        affiche('nz', 12, -4.4, -2.2, 1.4, 2.8, 'souriez'),
        affiche('px', -6, 5.5, 6.5, 1.5, 2.6, 'dessins'),
        affiche('nz', 12, -5.9, 5.9, 2.95, 3.2, 'fanions', { papier: false, dechire: 0 }),
        // La lampe du fond a grille : il n'en reste que l'abat-jour.
        suspension(-1.1, 4.1, 3.4), suspension(-1.0, 8.8, 3.4, [0.02, 0.02, 0.02]), suspension(1.6, 6.2, 3.4, [1.4, 1.1, 0.8])
      ],
      lampes: [
        { id: 'a', p: [-1.1, 2.62, 4.1], c: [1.5, 1.2, 0.9], r: 2.2, taille: 0.2 },
        { id: 'c', p: [1.6, 2.62, 6.2], c: [0.7, 0.55, 0.4], r: 1.8, taille: 0.2 }
      ],
      ambiant: [0.008, 0.008, 0.011], brume: 0.05, expo: 1.35,
      poses: {
        faith: { p: [-2.6, 0, 6.6], h: 2.15 },
        charlie: { p: [2.7, 0, 7.5], h: 2.0 },
        wade: { p: [0.2, 0, 10.9], h: 2.2 }
      }
    };

    // ---------- CAM 03 : le comptoir ----------
    S.comptoir = {
      cam: { pos: [-4.4, 2.75, 0.45], lacet: 0.62, tangage: -0.2, fov: 74 },
      objets: [
        piece({ x0: -5, x1: 5, z0: 0, z1: 8, h: 3.2, sol: 'damier', plafond: 'plafond',
                murs: { d: 'murSalle', z1: 'carrelage' }, baies: { z1: [[3.0, 4.3, 0, 2.3]] } }),
        obj('noir', [B(2.8, 0, 8.25, 4.5, 2.5, 9, 'noir')], { ombre: false }),
        obj('comptoir', [B(-4.2, 0, 4.6, 2.6, 1.02, 5.3, { f: { nz: 'faceComptoir', nx: 'faceComptoir', px: 'faceComptoir' }, d: 'formica' }),
                         B(-4.25, 1.02, 4.55, 2.65, 1.07, 5.35, 'inox')]),
        obj('caisse', [B(-2.7, 1.07, 4.75, -2.1, 1.36, 5.15, 'plastique'),
                       B(-2.65, 1.36, 4.85, -2.15, 1.5, 4.95, { e: [0.15, 0.6, 0.25] })]),
        obj('fontaine', [B(0.8, 1.07, 4.95, 2.3, 1.85, 5.3, { f: { nz: { img: 'fontaine', e: 0.25 } }, d: 'inox' })]),
        affiche('nz', 8, -3.4, 1.8, 1.85, 3.05, 'menu', { e: 0.32, papier: false, vieux: 0.3, dechire: 0 }),
        obj('etagere', [B(-4.2, 1.2, 7.55, -0.2, 1.24, 8, 'inox'), B(-4.2, 0.5, 7.55, -0.2, 0.54, 8, 'inox')]),
        obj('lampeChauffe', [B(-1.8, 1.9, 4.8, -0.6, 1.98, 5.1, { e: [1.6, 0.6, 0.2] })], { ombre: false }),
        tube(-3, 2.5, 1, 2.62, 3.2),
        plaque('bt-charlie', [-3.6, 1.07, 4.9], 0.3), plaque('bt-wade', [-1.3, 1.07, 4.95], 0.3, { sale: 0.8 }),
        plaque('pl-faith', [-0.6, 1.24, 7.75], 0.4),
        detritus(-1, 2.5, 22, 41), sacs(3.6, 7.4, 3), dalle(-2.2, 1.8),
        toileAraignee(-4.75, 3.2, 7.75, 0.9), toileAraignee(4.75, 3.2, 0.25, 0.8)
      ],
      lampes: [
        { id: 'tube', p: [-1, 3.0, 2.6], c: [0.9, 0.95, 0.9], r: 2.6, taille: 0.5 },
        { id: 'chauffe', p: [-1.2, 1.8, 4.95], c: [0.9, 0.35, 0.1], r: 1.0, taille: 0.2, ombre: false },
        { id: 'menu', p: [-0.8, 2.4, 7.4], c: [0.5, 0.42, 0.3], r: 1.6, taille: 0.6, ombre: false }
      ],
      ambiant: [0.009, 0.009, 0.012], brume: 0.05, expo: 1.35,
      poses: {
        charlie: { p: [-0.9, 0, 6.35], h: 2.0 },
        wade: { p: [1.9, 0, 3.0], h: 2.2 }
      }
    };

    // ---------- CAM 04 : le bassin de Stephen ----------
    S.bassin = {
      cam: { pos: [0.3, 2.9, 0.35], lacet: -0.02, tangage: -0.15, fov: 72 },
      objets: [
        piece({ x0: -5, x1: 5, z0: 0, z1: 9, h: 3.8, sol: 'damier', plafond: 'plafond',
                murs: { d: 'murBassin' } }),
        obj('socle', [B(-2.8, 0, 5.8, 2.8, 0.5, 8.7, 'estrade')]),
        obj('cuve', [B(-2.6, 0.5, 6.0, 2.6, 2.6, 8.5, 'eau')], { ombre: false, cuve: true }),
        obj('montants', [B(-2.66, 0.5, 5.94, -2.54, 2.66, 6.06, 'chrome'),
                         B(2.54, 0.5, 5.94, 2.66, 2.66, 6.06, 'chrome'),
                         B(-2.66, 2.58, 5.94, 2.66, 2.66, 6.06, 'chrome'),
                         B(-2.66, 0.5, 5.94, 2.66, 0.58, 6.06, 'chrome')], { ombre: false }),
        obj('panneau', [B(-2.2, 2.75, 5.92, 2.2, 3.2, 6.0, { img: 'splash', e: 0.45 })], { ombre: false }),
        obj('poteaux', [-2.4, -1.2, 0, 1.2, 2.4].map(function (x) {
          return B(x - 0.04, 0, 4.4, x + 0.04, 1.0, 4.48, 'chrome');
        }).concat([B(-2.4, 0.86, 4.42, 2.4, 0.9, 4.46, 'corde')])),
        affiche('px', -5, 3.5, 5.0, 1.2, 2.5, 'regles'),
        affiche('nx', 5, 3.2, 4.8, 1.3, 2.4, 'souriez'),
        detritus(0, 2.8, 18, 51), sacs(-4.4, 8.4, 2), dalle(-2.6, 3.0),
        toileAraignee(-4.75, 3.8, 8.75, 1.0), toileAraignee(4.75, 3.8, 8.75, 0.9),
        // La pancarte, seulement quand la cuve est vide.
        { nom: 'pancarte', boites: [], seulement: 'vide',
          sprite: { tex: 'pancarte', p: [-0.6, 0, 4.9], h: 1.1, n: 'cam', relief: 0.1, ombre: true, sale: 0.4 } }
      ],
      lampes: [
        { id: 'eau', p: [0, 1.6, 5.6], c: [0.2, 0.75, 0.95], r: 2.0, taille: 1.2, ombre: false },
        { id: 'haut', p: [0, 3.6, 3.6], c: [0.5, 0.48, 0.45], r: 2.2, taille: 0.3 }
      ],
      ambiant: [0.004, 0.007, 0.01], brume: 0.05, expo: 1.35,
      variantes: { base: ['eau', 'haut'], vide: ['eau', 'haut'] },
      cuve: { a: [-2.6, 0.5, 6.0], b: [2.6, 2.6, 6.0] },
      poses: {
        nage: { p: [0.4, 0.55, 7.4], h: 2.0, dansCuve: true },
        vitre: { p: [-0.3, 0.25, 6.08], h: 2.5, dansCuve: true },
        dehors: { p: [1.2, 0, 5.15], h: 2.2 }
      }
    };

    // ---------- CAM 05 : la boutique ----------
    S.boutique = {
      cam: { pos: [3.5, 2.7, 0.4], lacet: -0.62, tangage: -0.24, fov: 76 },
      objets: [
        piece({ x0: -4, x1: 4, z0: 0, z1: 7, h: 3, sol: 'parquet', plafond: 'plafond',
                murs: { d: 'murBoutique' } }),
        obj('rayonnage', [
          B(-3.6, 0, 6.3, 2.4, 0.08, 6.95, 'bois'),
          B(-3.6, 0.6, 6.3, 2.4, 0.64, 6.95, 'bois'),
          B(-3.6, 1.25, 6.3, 2.4, 1.29, 6.95, 'bois'),
          B(-3.6, 1.9, 6.3, 2.4, 1.94, 6.95, 'bois'),
          B(-3.62, 0, 6.3, -3.55, 2.2, 6.95, 'bois'),
          B(2.35, 0, 6.3, 2.42, 2.2, 6.95, 'bois')
        ]),
        affiche('nz', 7, 2.65, 3.85, 0.8, 2.6, 'plushies', { e: 0.04 }),
        obj('frigo', [B(-4, 0, 2.6, -3.1, 2.25, 4.7, { f: { px: { img: 'frigo', e: 0.7 } }, d: 'plastique' })]),
        obj('caisse', [B(-0.6, 0, 1.6, 1.2, 0.95, 2.3, { f: { nz: 'faceComptoir', px: 'faceComptoir' }, d: 'formica' }),
                       B(0.2, 0.95, 1.75, 0.7, 1.25, 2.1, 'plastique')], { id: 'caisseB' }),
        affiche('px', -4, 5.0, 6.0, 1.3, 2.3, 'souriez'),
        tube(-1.5, 3.2, 1.5, 3.32, 3),
        // Les peluches, rangees sur les etageres, et celles qui sont tombees.
        plaque('pl-wade', [-2.7, 0.64, 6.6], 0.5), plaque('pl-faith', [-1.75, 0.64, 6.6], 0.5),
        plaque('pl-charlie', [-0.7, 0.64, 6.6], 0.48), plaque('pl-stephen', [0.35, 0.64, 6.6], 0.5),
        plaque('pl-charlie', [-2.2, 1.29, 6.6], 0.48), plaque('pl-wade', [-1.1, 1.29, 6.6], 0.5),
        plaque('pl-stephen', [1.4, 1.29, 6.6], 0.5), plaque('pl-faith', [-1.6, 1.94, 6.6], 0.5),
        plaque('pl-wade', [1.7, 0, 5.4], 0.42, { sale: 1 }), plaque('pl-faith', [-2.6, 0, 1.2], 0.4, { sale: 1 }),
        plaque('bt-stephen', [0.85, 0.95, 1.95], 0.28),
        detritus(0, 4, 18, 61),
        obj('cartonsB', [B(2.6, 0, 5.6, 3.6, 0.6, 6.6, 'carton'), B(2.8, 0.6, 5.8, 3.4, 0.95, 6.4, 'carton')]),
        toileAraignee(-3.75, 3, 6.75, 0.9), toileAraignee(3.75, 3, 6.75, 0.7)
      ],
      lampes: [
        { id: 'tube', p: [0, 2.85, 3.3], c: [0.75, 0.75, 0.72], r: 2.3, taille: 0.6 },
        { id: 'frigo', p: [-2.9, 1.2, 3.65], c: [0.35, 0.5, 0.7], r: 1.2, taille: 0.8, ombre: false },
        // La lampe de la vitrine, qui eclaire encore un peu les peluches.
        { id: 'vitrine', p: [-0.8, 2.5, 5.7], c: [1.5, 1.2, 0.85], r: 1.6, taille: 0.2,
          spot: [0, -0.8, 0.6], cone: [0.75, 0.3] }
      ],
      ambiant: [0.008, 0.008, 0.01], brume: 0.05, expo: 1.35,
      poses: {
        faith: { p: [0.6, 0, 4.6], h: 2.15 }
      }
    };

    // ---------- CAM 07 : la chambre froide ----------
    S.froid = {
      cam: { pos: [-2.1, 2.45, 0.3], lacet: 0.32, tangage: -0.26, fov: 76 },
      objets: [
        piece({ x0: -2.6, x1: 2.6, z0: 0, z1: 6, h: 2.8, sol: 'betonGivre', plafond: 'givre',
                murs: { d: 'givre' } }),
        obj('rack', [
          B(1.6, 0, 1.2, 2.55, 0.05, 5.6, 'inox'), B(1.6, 0.8, 1.2, 2.55, 0.84, 5.6, 'inox'),
          B(1.6, 1.6, 1.2, 2.55, 1.64, 5.6, 'inox'), B(1.6, 2.3, 1.2, 2.55, 2.34, 5.6, 'inox'),
          B(1.6, 0, 1.2, 1.64, 2.34, 1.24, 'inox'), B(1.6, 0, 5.56, 1.64, 2.34, 5.6, 'inox')
        ]),
        obj('cartons', [
          B(1.75, 0.05, 1.4, 2.45, 0.6, 2.4, 'carton'), B(1.7, 0.84, 2.6, 2.45, 1.35, 3.5, 'carton'),
          B(1.8, 1.64, 1.4, 2.5, 2.1, 2.2, 'carton'), B(1.75, 0.05, 3.9, 2.5, 0.7, 5.0, 'carton'),
        ]),
        // Les trois cartons de gauche, chacun a part : on peut les bruler.
        obj('cartonA', [B(-2.5, 0, 4.2, -1.6, 0.9, 5.4, 'carton')], { id: 'cartonA' }),
        obj('cartonB', [B(-2.45, 0.9, 4.4, -1.75, 1.4, 5.2, 'carton')], { id: 'cartonB' }),
        obj('cartonC', [B(-2.5, 0, 2.7, -1.8, 0.6, 3.6, 'carton')], { id: 'cartonC' }),
        obj('viande', [B(-0.9, 1.3, 5.2, -0.6, 2.2, 5.5, 'viande'), B(-0.2, 1.4, 5.3, 0.1, 2.25, 5.6, 'viande'),
                       B(-1.0, 2.2, 5.0, 0.4, 2.24, 5.8, 'inox')]),
        tube(-0.6, 2.0, 0.6, 2.1, 2.8, [0.9, 1.4, 2.2]),
        detritus(0, 2.5, 10, 71), toileAraignee(-2.35, 2.8, 5.75, 0.7)
      ],
      lampes: [{ id: 'tube', p: [0, 2.65, 2.05], c: [0.55, 0.8, 1.15], r: 2.2, taille: 0.5 }],
      ambiant: [0.008, 0.011, 0.016], brume: 0.06, expo: 1.4,
      poses: { charlie: { p: [0.5, 0, 4.1], h: 2.0 }, wade: { p: [-0.6, 0, 3.6], h: 2.2 } }
    };

    // ---------- CAM 08 : l'atelier ----------
    S.atelier = {
      cam: { pos: [3.1, 2.7, 0.3], lacet: -0.5, tangage: -0.26, fov: 74 },
      objets: [
        piece({ x0: -3.5, x1: 3.5, z0: 0, z1: 6, h: 3, sol: 'beton', plafond: 'plafond',
                murs: { d: 'murAtelier' } }),
        obj('etabli', [B(-3.2, 0.86, 4.9, 0.4, 0.92, 5.8, 'bois'),
                       B(-3.15, 0, 4.95, -3.05, 0.86, 5.75, 'boisSombre'),
                       B(0.25, 0, 4.95, 0.35, 0.86, 5.75, 'boisSombre'),
                       B(-3.15, 0.25, 4.95, 0.35, 0.29, 5.75, 'boisSombre')]),
        affiche('nz', 6, -3.1, 0.3, 1.15, 2.4, 'outils'),
        obj('pieces', [B(-2.6, 0.92, 5.1, -2.0, 1.12, 5.5, 'acier'), B(-1.1, 0.92, 5.2, -0.6, 1.2, 5.6, 'acier'),
                       B(-1.7, 0.92, 5.05, -1.5, 0.98, 5.3, 'cuivre')]),
        obj('socles', [B(0.9, 0, 4.4, 2.3, 0.12, 5.6, 'acier'), B(2.4, 0, 3.4, 3.4, 0.12, 4.6, 'acier')]),
        obj('caisses', [B(-3.4, 0, 0.6, -2.4, 0.8, 1.8, 'carton'), B(-3.35, 0.8, 0.8, -2.6, 1.3, 1.6, 'carton')]),
        plaque('pl-stephen', [-2.6, 0.92, 5.35], 0.36, { sale: 1 }),
        detritus(-0.5, 2.5, 18, 81), sacs(-3.0, 3.2, 2),
        toileAraignee(-3.25, 3, 5.75, 1.0), toileAraignee(3.25, 3, 5.75, 0.9), toileAraignee(-3.25, 3, 0.25, 0.8),
        obj('ampoule', [B(-0.82, 2.25, 3.08, -0.78, 3, 3.12, 'noir'),
                        B(-0.88, 2.17, 3.02, -0.72, 2.27, 3.18, { e: [6, 4.6, 2.6] })], { ombre: false })
      ],
      lampes: [{ id: 'ampoule', p: [-0.8, 2.12, 3.1], c: [1.6, 1.25, 0.75], r: 1.7, taille: 0.06 }],
      // L'incendie : l'ampoule a eclate, et le feu eclaire la piece.
      feu: { eteint: ['ampoule'], lampes: [
        { id: 'f1', p: [-1.6, 0.5, 5.0], c: [3.2, 1.2, 0.25], r: 1.6, taille: 0.6 },
        { id: 'f2', p: [-2.8, 0.6, 2.2], c: [2.4, 0.85, 0.18], r: 1.4, taille: 0.6 },
        { id: 'f3', p: [0.6, 0.4, 4.4], c: [2.0, 0.7, 0.14], r: 1.2, taille: 0.6 }] },
      // Les flammes, ou le jeu les dessine.
      flammes: [[-1.6, 0.9, 5.0, 1.6], [-2.9, 1.3, 1.2, 1.2], [0.6, 0.5, 4.4, 1.0], [-2.2, 0, 3.0, 1.2], [1.8, 0, 4.9, 0.9]],
      ambiant: [0.005, 0.005, 0.006], brume: 0.06, expo: 1.4,
      poses: {
        faith: { p: [-1.1, 0, 3.0], h: 2.15 }
      }
    };

    // ---------- Le laboratoire, derriere la cuisine ----------
    // La CAM 06 n'a jamais marche. C'est la qu'il travaille.
    S.labo = (function () {
      var o = [
        piece({ x0: -3.6, x1: 3.6, z0: -2.2, z1: 7, h: 3.2, sol: 'beton', plafond: 'plafond',
                murs: { d: 'carrelage', z1: 'murAtelier' } })
      ];
      // L'etabli d'acier, au milieu : un etau, des outils, une lampe
      // d'operation au-dessus.
      o.push(obj('etabli', [
        B(-1.7, 0.86, 3.2, 1.7, 0.94, 4.2, 'inox'),
        B(-1.65, 0, 3.25, -1.55, 0.86, 4.15, 'acier'), B(1.55, 0, 3.25, 1.65, 0.86, 4.15, 'acier'),
        B(-1.65, 0.25, 3.25, 1.65, 0.3, 4.15, 'acier')
      ]));
      o.push(obj('etau', [B(-1.3, 0.94, 3.4, -0.95, 1.12, 3.65, 'acier'), B(-1.4, 1.1, 3.35, -0.85, 1.15, 3.7, 'acier')]));
      o.push(obj('outils', [B(0.95, 0.94, 3.35, 1.45, 0.99, 3.6, 'cuivre'), B(1.1, 0.94, 3.75, 1.5, 1.06, 4.05, 'acier'),
                            B(-0.6, 0.94, 3.95, -0.3, 0.97, 4.12, 'noir')]));
      o.push(obj('lampeOp', [B(-0.02, 2.45, 3.48, 0.02, 3.2, 3.52, 'noir'),
                             B(-0.45, 2.35, 3.1, 0.45, 2.45, 3.9, 'acier'),
                             B(-0.38, 2.33, 3.17, 0.38, 2.35, 3.83, { e: [3, 3.3, 2.8] })], { ombre: false }));
      // Les cuves : un liquide vert qui luit, dans des cylindres d'acier.
      [[-3.0, 6.2], [-2.0, 6.4], [2.9, 6.2]].forEach(function (c) {
        o.push(obj('cuve', [
          B(c[0] - 0.36, 0.28, c[1] - 0.36, c[0] + 0.36, 2.25, c[1] + 0.36, 'liquide'),
          B(c[0] - 0.42, 0, c[1] - 0.42, c[0] + 0.42, 0.28, c[1] + 0.42, 'acier'),
          B(c[0] - 0.42, 2.25, c[1] - 0.42, c[0] + 0.42, 2.45, c[1] + 0.42, 'acier'),
          B(c[0] - 0.05, 2.45, c[1] - 0.05, c[0] + 0.05, 3.2, c[1] + 0.05, 'noir')
        ], { ombre: false }));
      });
      // Les etageres de bocaux, sur le mur de gauche.
      var bocaux = [];
      for (var e = 0; e < 3; e++) {
        bocaux.push(B(-3.6, 0.9 + e * 0.6, 1.2, -3.2, 0.94 + e * 0.6, 4.6, 'bois'));
        for (var k = 0; k < 6; k++) {
          var z = 1.4 + k * 0.55, h = 0.18 + ((k + e) % 3) * 0.07;
          bocaux.push(B(-3.5, 0.94 + e * 0.6, z, -3.32, 0.94 + e * 0.6 + h, z + 0.18,
                        (k + e) % 4 === 0 ? { e: [0.22, 0.15, 0.02] } : { e: [0.02, 0.12 + ((k * 7 + e) % 3) * 0.05, 0.05] }));
        }
      }
      o.push(obj('bocaux', bocaux, { ombre: false }));
      // Le poste aux moniteurs, a droite.
      o.push(obj('poste', [B(2.3, 0.75, 1.6, 3.5, 0.8, 3.4, 'bois'), B(2.35, 0, 1.65, 3.45, 0.75, 1.75, 'boisSombre')]));
      [[1.75], [2.5]].forEach(function (z) {
        o.push(obj('moniteur', [B(3.0, 0.8, z[0] - 0.3, 3.45, 1.25, z[0] + 0.3, 'plastique'),
                                B(2.98, 0.86, z[0] - 0.24, 3.0, 1.2, z[0] + 0.24, 'ecran')]));
      });
      // Des cables qui pendent du plafond.
      o.push(obj('cables', [B(-1.2, 2.5, 2.4, -1.17, 3.2, 2.43, 'noir'), B(0.9, 2.2, 4.8, 0.93, 3.2, 4.83, 'noir'),
                            B(-2.3, 2.7, 3.6, -2.27, 3.2, 3.63, 'noir'), B(1.8, 2.4, 2.1, 1.83, 3.2, 2.13, 'noir')], { ombre: false }));
      // Le presentoir des masques termines, contre le mur du fond.
      o.push(obj('presentoir', [B(-3.1, 1.55, 6.65, -1.2, 1.6, 7, 'acier'), B(1.2, 1.55, 6.65, 3.1, 1.6, 7, 'acier'),
                                B(-3.1, 0, 6.85, -3.05, 1.6, 7, 'acier'), B(3.05, 0, 6.85, 3.1, 1.6, 7, 'acier'),
                                B(-1.25, 0, 6.85, -1.2, 1.6, 7, 'acier'), B(1.2, 0, 6.85, 1.25, 1.6, 7, 'acier')]));
      o.push(affiche('nz', 7, -1.0, 1.0, 2.0, 3.0, 'plans'));
      o.push(affiche('nz', 7, 1.3, 2.6, 1.95, 2.95, 'plans2'));
      o.push(affiche('px', -3.6, 4.9, 6.3, 1.2, 2.4, 'plans2'));
      o.push(detritus(0, 2, 16, 101), detritus(1.5, 5.5, 8, 102));
      o.push(toileAraignee(-3.35, 3.2, 6.75, 0.8), toileAraignee(3.35, 3.2, 6.75, 0.7));
      return {
        cam: { pos: [2.4, 2.45, -0.6], lacet: -0.3, tangage: -0.18, fov: 64 },
        objets: o,
        lampes: [
          { id: 'op', p: [0, 2.28, 3.5], c: [3.2, 3.4, 3.0], r: 1.5, taille: 0.5,
            spot: [0, -1, 0], cone: [0.6, 0.1] },
          { id: 'cuves', p: [-2.3, 1.3, 5.6], c: [0.15, 0.9, 0.3], r: 1.8, taille: 0.8, ombre: false },
          { id: 'cuve3', p: [2.6, 1.3, 5.6], c: [0.1, 0.6, 0.2], r: 1.4, taille: 0.8, ombre: false },
          { id: 'ecrans', p: [2.7, 1.1, 2.1], c: [0.1, 0.4, 0.25], r: 1.0, taille: 0.4, ombre: false },
          { id: 'fond', p: [0, 2.9, 5.9], c: [0.9, 1.0, 0.8], r: 1.5, taille: 0.3, spot: [0, -0.5, 0.86], cone: [0.7, 0.2] }
        ],
        lumiere: 0.9,
        feu: { eteint: [], lampes: [
          { id: 'f1', p: [-2, 0.5, 4.8], c: [3.6, 1.3, 0.3], r: 1.8, taille: 0.6 },
          { id: 'f2', p: [2.4, 0.6, 3.0], c: [3.0, 1.0, 0.2], r: 1.6, taille: 0.6 }] },
        flammes: [[-2, 0, 5.2, 1.8], [2.4, 0, 3.0, 1.6], [-0.6, 0.94, 3.7, 1.0], [1.2, 0, 5.6, 1.4], [-2.8, 0, 1.6, 1.3]],
        ambiant: [0.006, 0.01, 0.007], brume: 0.05, expo: 1.45,
        // Ou il se tient, ou il travaille, et les places du presentoir.
        poses: { createur: { p: [0, 0, 4.75], h: 1.9 } },
        masque: [0.15, 0.94, 3.62],
        presentoir: [[-2.6, 1.6, 6.8], [-1.7, 1.6, 6.8], [1.7, 1.6, 6.8], [2.6, 1.6, 6.8]]
      };
    })();

    // ---------- CAM 09 et 11 : les couloirs ----------
    S.couloirO = couloir(-1, [
      affiche('px', -1.15, 3.6, 4.6, 1.2, 2.3, 'regles'),
      affiche('nx', 1.15, 6.8, 8.6, 1.2, 2.4, 'dessins'),
      affiche('px', -1.15, 9.8, 11.4, 1.3, 2.4, 'fizzies')
    ]);
    S.couloirO.poses = {
      faith: { p: [-0.25, 0, 8.2], h: 2.15 },
      course: { p: [0, 0, 12.5], h: 2.2, sansMasque: true, echantillons: [12.5, 9, 6, 3.5, 2] }
    };
    S.couloirE = couloir(1, [
      affiche('nx', 1.15, 3.6, 5.1, 1.2, 2.3, 'souriez'),
      affiche('px', -1.15, 6.8, 8.2, 1.2, 2.3, 'employe'),
      affiche('nx', 1.15, 9.8, 11.6, 1.2, 2.5, 'fizzies')
    ]);
    S.couloirE.poses = {
      charlie: { p: [0.3, 0, 7.6], h: 2.0 },
      wade: { p: [-0.2, 0, 10.4], h: 2.2 }
    };

    // ---------- CAM 10 et 12 : les coins, a deux pas des portes ----------
    // Le dernier bout de couloir, vu d'en haut, avec au fond la porte du
    // bureau. Celui qui arrive ici passe juste sous la camera.
    function coin(sens, img) {
      return {
        cam: { pos: [sens * 0.8, 2.6, 5.0], lacet: Math.PI - sens * 0.12, tangage: -0.36, fov: 80 },
        objets: [
          piece({ x0: -1.25, x1: 1.25, z0: 0, z1: 5.3, h: 2.9, sol: 'damier', plafond: 'plafond',
                  murs: { d: 'murCouloir' }, baies: { z0: [[-0.65, 0.65, 0, 2.35]] } }),
          obj('noir', [B(-1.5, 0, -1.2, 1.5, 2.6, -0.25, 'noir')], { ombre: false }),
          obj('cadre', [B(-0.73, 0, -0.02, -0.65, 2.43, 0.02, 'acier'), B(0.65, 0, -0.02, 0.73, 2.43, 0.02, 'acier'),
                        B(-0.73, 2.35, -0.02, 0.73, 2.43, 0.02, 'acier')], { ombre: false }),
          affiche(sens < 0 ? 'px' : 'nx', sens < 0 ? -1.25 : 1.25, 1.2, 2.4, 1.1, 2.3, img),
          affiche(sens < 0 ? 'nx' : 'px', sens < 0 ? 1.25 : -1.25, 0.9, 2.2, 1.2, 2.2, 'dessins'),
          affiche(sens < 0 ? 'nx' : 'px', sens < 0 ? 1.25 : -1.25, 2.8, 3.7, 1.3, 2.3, 'regles'),
          tube(-0.08, 1.6, 0.08, 2.6, 2.9),
          detritus(0, 2.2, 14, 91 + sens), sacs(sens * 0.85, 4.6, 2),
          toileAraignee(-1.1, 2.9, 0.15, 0.7), toileAraignee(1.1, 2.9, 5.15, 0.6)
        ],
        lampes: [{ id: 'tube', p: [0, 2.72, 2.1], c: [0.85, 0.85, 0.78], r: 1.7, taille: 0.3 }],
        ambiant: [0.006, 0.006, 0.008], brume: 0.05, expo: 1.4,
        poses: {}
      };
    }
    S.coinO = coin(-1, 'souriez');
    S.coinO.poses = { faith: { p: [0.15, 0, 2.9], h: 2.15 } };
    S.coinE = coin(1, 'fizzies');
    S.coinE.poses = { charlie: { p: [-0.2, 0, 2.9], h: 2.0 }, wade: { p: [0.25, 0, 1.0], h: 2.2 } };

    // La taille de rendu par defaut : un peu plus large que l'ecran, pour
    // que la camera puisse balayer la piece de gauche a droite.
    Object.keys(S).forEach(function (k) {
      var s = S[k];
      if (!s.taille) s.taille = [760, 360];
      s.cam.w = s.taille[0];
      s.cam.h = s.taille[1];
      if (!s.variantes) s.variantes = { base: s.lampes.map(function (l) { return l.id; }) };
    });
    return S;
  }

  // ==========================================================
  //  Le moteur, cote worker
  // ==========================================================

  function MOTEUR() {
    var P = PROJ(), S = SCENES();
    var TEX = {};

    // ---------- Le bruit ----------
    function hash(x, y, z) {
      var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    function lisse(t) { return t * t * (3 - 2 * t); }
    function bruit(x, y, z) {
      var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
      var fx = lisse(x - X), fy = lisse(y - Y), fz = lisse(z - Z);
      function m(a, b, t) { return a + (b - a) * t; }
      return m(m(m(hash(X, Y, Z), hash(X + 1, Y, Z), fx), m(hash(X, Y + 1, Z), hash(X + 1, Y + 1, Z), fx), fy),
               m(m(hash(X, Y, Z + 1), hash(X + 1, Y, Z + 1), fx), m(hash(X, Y + 1, Z + 1), hash(X + 1, Y + 1, Z + 1), fx), fy), fz);
    }
    function fbm(x, y, z) {
      return bruit(x, y, z) * 0.55 + bruit(x * 2.1, y * 2.1, z * 2.1) * 0.3 + bruit(x * 4.3, y * 4.3, z * 4.3) * 0.15;
    }

    // Les couleurs sont donnees en sRGB 0..255 et passees en lineaire.
    function lin(c) { return Math.pow(c / 255, 2.2); }
    function C(r, g, b) { return [lin(r), lin(g), lin(b)]; }
    function poser(o, c, k) {
      k = k == null ? 1 : k;
      o.r = c[0] * k; o.g = c[1] * k; o.b = c[2] * k;
    }
    function melanger(o, a, b, t) {
      o.r = a[0] + (b[0] - a[0]) * t; o.g = a[1] + (b[1] - a[1]) * t; o.b = a[2] + (b[2] - a[2]) * t;
    }

    // La crasse : une tache sombre, etiree vers le bas sur les murs.
    function crasse(p, n, f) {
      var v = Math.abs(n[1]) > 0.5 ? fbm(p[0] * 1.3, p[2] * 1.3, 3.1)
                                   : fbm(p[0] * 1.6 + p[2] * 1.6, p[1] * 0.45, 7.7);
      return 1 - Math.max(0, v - 0.45) * f;
    }

    var ROUGE = C(150, 24, 30), CREME = C(226, 214, 186), JOINT = C(60, 52, 44);
    var CHROMEC = C(190, 194, 200);

    var MAT = {
      // Le damier du diner : rouge et creme, joints sombres, sol use.
      damier: function (p, n, o) {
        var t = 0.42, u = p[0] / t, v = p[2] / t;
        var fu = u - Math.floor(u), fv = v - Math.floor(v);
        var j = fu < 0.035 || fv < 0.035;
        var c = (Math.floor(u) + Math.floor(v)) & 1 ? ROUGE : CREME;
        // Un carreau sur quinze est casse, ou parti : il reste la chape.
        var h = hash(Math.floor(u), 77, Math.floor(v));
        if (h < 0.065) {
          poser(o, C(52, 49, 44), 0.6 + fbm(p[0] * 9, p[2] * 9, 4) * 0.5); o.s = 0.05; o.k = 10; return;
        }
        if (h > 0.93 && Math.abs(fu - fv) < 0.025) j = true;
        poser(o, j ? JOINT : c, crasse(p, n, 0.9) * (0.85 + hash(Math.floor(u), 0, Math.floor(v)) * 0.15));
        o.s = j ? 0.05 : 0.45; o.k = 60;
      },
      // Ce que le feu a laisse : du noir, de la cendre, des braises.
      brule: function (p, n, o) {
        var g = fbm(p[0] * 7, p[1] * 7, p[2] * 7);
        poser(o, C(20, 16, 12), 0.5 + g * 0.6);
        if (g > 0.66) { o.er = 0.05 * (g - 0.66) * 6; o.eg = o.er * 0.3; }
        o.s = 0.05; o.k = 8;
      },
      papierSale: function (p, n, o) {
        var g = fbm(p[0] * 20, p[2] * 20, 2);
        poser(o, C(170, 160, 132), 0.55 + g * 0.45); o.s = 0.03; o.k = 6;
      },
      emballage: function (p, n, o) {
        var h = hash(Math.floor(p[0] * 9), 5, Math.floor(p[2] * 9));
        poser(o, h < 0.33 ? C(150, 30, 30) : h < 0.66 ? C(200, 170, 60) : C(60, 90, 150), 0.6);
        o.s = 0.5; o.k = 40;
      },
      sac: function (p, n, o) {
        var g = fbm(p[0] * 7, p[1] * 7, p[2] * 7);
        poser(o, C(16, 16, 18), 0.7 + g * 0.6); o.s = 1.3; o.k = 70;
      },
      parquet: function (p, n, o) {
        var l = p[0] / 0.16, k = Math.floor(l);
        var dec = hash(k, 3, 0) * 3;
        var lame = Math.floor(p[2] / 1.4 + dec);
        var g = fbm(p[0] * 30, p[2] * 2, lame);
        poser(o, C(120, 78, 48), (0.7 + g * 0.45) * (l - k < 0.05 ? 0.5 : 1) * crasse(p, n, 0.6));
        o.s = 0.3; o.k = 40;
      },
      planches: function (p, n, o) {
        var l = p[2] / 0.2, k = Math.floor(l);
        var g = fbm(p[0] * 2, p[2] * 25, k);
        poser(o, C(110, 70, 40), (0.7 + g * 0.5) * (l - k < 0.06 ? 0.45 : 1));
        o.s = 0.35; o.k = 50;
      },
      estrade: function (p, n, o) {
        // Le devant de l'estrade : rouge sombre, liseres dores.
        var y = p[1];
        if (y > 0.6 || (y > 0.08 && y < 0.12)) { poser(o, C(200, 160, 70)); o.s = 0.7; o.k = 80; return; }
        poser(o, C(90, 14, 22), crasse(p, n, 0.5)); o.s = 0.15; o.k = 20;
      },
      // Les murs de la salle : lambris rouge en bas, creme au-dessus, un
      // jonc chrome entre les deux.
      murSalle: function (p, n, o) {
        var y = p[1], c = crasse(p, n, 1.1);
        if (y < 0.12) { poser(o, C(40, 30, 28), c); o.s = 0.1; o.k = 20; return; }
        if (y < 1.05) {
          var u = (p[0] + p[2]) / 0.12;
          poser(o, ROUGE, c * (u - Math.floor(u) < 0.08 ? 0.7 : 1)); o.s = 0.25; o.k = 30; return;
        }
        if (y < 1.11) { poser(o, CHROMEC); o.s = 1.2; o.k = 120; return; }
        poser(o, CREME, c * 0.92); o.s = 0.04; o.k = 8;
      },
      murScene: function (p, n, o) {
        // Le fond de scene : un velours bleu nuit pique d'etoiles.
        var f = 0.75 + 0.25 * Math.sin(p[0] * 9);
        var ci = Math.floor(p[0] * 7), cj = Math.floor(p[1] * 7);
        var e = hash(ci, cj, 5) > 0.965;
        if (e && ETOILES[ci + ',' + cj]) { poser(o, C(14, 10, 8)); o.s = 0; o.k = 1; o.er = 0.012; o.eg = 0.003; return; }
        poser(o, e ? C(240, 210, 110) : C(26, 22, 60), e ? 1 : f);
        o.s = e ? 0.6 : 0.05; o.k = 30;
      },
      murBureau: function (p, n, o) {
        var y = p[1], c = crasse(p, n, 1.4);
        if (y < 1.25) {
          // Les carreaux de cuisine du bureau, petits et uses.
          var t = 0.15, u = (Math.abs(n[0]) > 0.5 ? p[2] : p[0]) / t, v = y / t;
          var j = u - Math.floor(u) < 0.06 || v - Math.floor(v) < 0.06;
          poser(o, j ? C(80, 76, 70) : (((Math.floor(u) + Math.floor(v)) & 1) ? C(52, 70, 68) : C(64, 84, 80)), c);
          o.s = j ? 0.05 : 0.45; o.k = 70; return;
        }
        if (y < 1.3) { poser(o, ROUGE, c); o.s = 0.3; o.k = 40; return; }
        poser(o, C(150, 142, 120), c * 0.9); o.s = 0.03; o.k = 8;
      },
      murCouloir: function (p, n, o) {
        var y = p[1], c = crasse(p, n, 1.5);
        if (y < 0.1) { poser(o, C(30, 26, 24), c); return; }
        if (y < 1.0) { poser(o, C(110, 22, 26), c); o.s = 0.2; o.k = 30; return; }
        if (y < 1.05) { poser(o, C(30, 30, 32)); return; }
        poser(o, C(92, 104, 88), c * 0.85); o.s = 0.03; o.k = 8;
      },
      murBassin: function (p, n, o) {
        var c = crasse(p, n, 1.0);
        var v = Math.sin((p[0] + p[2]) * 3 + Math.sin(p[1] * 2) * 1.5);
        poser(o, v > 0.6 ? C(40, 90, 120) : C(26, 58, 84), c);
        if (p[1] < 1.0) poser(o, C(30, 40, 52), c);
        o.s = 0.05; o.k = 10;
      },
      murBoutique: function (p, n, o) {
        var u = (p[0] + p[2]) / 0.25;
        var r = u - Math.floor(u) < 0.5;
        poser(o, r ? C(196, 168, 120) : C(180, 150, 104), crasse(p, n, 1.1));
        if (p[1] < 0.15) poser(o, C(60, 40, 30));
        o.s = 0.03; o.k = 8;
      },
      murAtelier: function (p, n, o) {
        // Des parpaings peints, ecailles.
        var bx = (Math.abs(n[0]) > 0.5 ? p[2] : p[0]) / 0.4, by = p[1] / 0.2;
        var dec = Math.floor(by) & 1 ? 0.5 : 0;
        var j = (bx + dec) - Math.floor(bx + dec) < 0.04 || by - Math.floor(by) < 0.07;
        var g = fbm(p[0] * 4, p[1] * 4, p[2] * 4);
        poser(o, j ? C(50, 50, 48) : C(110, 112, 100), (0.75 + g * 0.35) * crasse(p, n, 1.3));
        o.s = 0.02; o.k = 8;
      },
      carrelage: function (p, n, o) {
        var t = 0.15, u = p[0] / t, v = p[1] / t;
        var j = u - Math.floor(u) < 0.06 || v - Math.floor(v) < 0.06;
        poser(o, j ? C(90, 88, 80) : C(214, 212, 200), crasse(p, n, 1.2));
        o.s = j ? 0.05 : 0.6; o.k = 80;
      },
      plafond: function (p, n, o) {
        var t = 0.6, u = p[0] / t, v = p[2] / t;
        var j = u - Math.floor(u) < 0.03 || v - Math.floor(v) < 0.03;
        var g = fbm(p[0] * 3, p[2] * 3, 9);
        var h = hash(Math.floor(u), 7, Math.floor(v));
        // Des dalles tombees : le trou noir du faux plafond, et ses cables.
        if (h < 0.11 && n[1] < -0.5) { poser(o, C(6, 6, 6)); o.s = 0; o.k = 1; return; }
        var tache = h > 0.85 ? 0.6 : 1;
        poser(o, j ? C(60, 58, 52) : C(150, 144, 128), (0.75 + g * 0.3) * tache);
        o.s = 0; o.k = 1;
      },
      beton: function (p, n, o) {
        var g = fbm(p[0] * 2, p[1] * 2 + p[2] * 2, 1);
        poser(o, C(90, 88, 84), 0.7 + g * 0.5); o.s = 0.1; o.k = 20;
      },
      betonGivre: function (p, n, o) {
        var g = fbm(p[0] * 3, p[2] * 3, 2);
        poser(o, C(150, 170, 186), 0.6 + g * 0.5); o.s = 0.5; o.k = 50;
      },
      givre: function (p, n, o) {
        // Des panneaux d'inox, voiles de givre vers le bas.
        var u = (Math.abs(n[0]) > 0.5 ? p[2] : p[0]) / 1.0;
        var j = u - Math.floor(u) < 0.02;
        var g = fbm(p[0] * 5, p[1] * 5, p[2] * 5);
        var blanc = Math.max(0, 0.9 - p[1] * 0.4) * g;
        melanger(o, C(120, 130, 140), C(225, 235, 245), Math.min(1, blanc));
        if (j) poser(o, C(60, 66, 72));
        o.s = 0.6; o.k = 40;
      },
      rideau: function (p, n, o) {
        var u = Math.abs(n[0]) > 0.5 ? p[2] : p[0];
        var pli = 0.55 + 0.45 * Math.sin(u * 14 + Math.sin(u * 3) * 2);
        poser(o, C(130, 16, 28), pli * crasse(p, n, 0.5)); o.s = 0.15; o.k = 12;
      },
      vinyle: function (p, n, o) {
        var g = fbm(p[0] * 6, p[1] * 6, p[2] * 6);
        poser(o, C(170, 26, 34), 0.75 + g * 0.3); o.s = 0.7; o.k = 50;
      },
      formica: function (p, n, o) {
        var g = fbm(p[0] * 12, p[2] * 12, 4);
        poser(o, C(222, 208, 170), 0.85 + g * 0.2); o.s = 0.55; o.k = 60;
      },
      faceComptoir: function (p, n, o) {
        var y = p[1];
        if (y > 0.82 && y < 0.88) { poser(o, CHROMEC); o.s = 1.2; o.k = 100; return; }
        if (y < 0.1) { poser(o, C(30, 24, 22)); return; }
        var u = (p[0] + p[2]) / 0.3;
        poser(o, u - Math.floor(u) < 0.06 ? C(120, 18, 24) : ROUGE, crasse(p, n, 0.9));
        o.s = 0.35; o.k = 40;
      },
      chrome: function (p, n, o) { poser(o, CHROMEC, 0.8); o.s = 1.6; o.k = 150; },
      acier: function (p, n, o) {
        var g = fbm(p[0] * 8, p[1] * 8, p[2] * 8);
        poser(o, C(80, 84, 90), 0.75 + g * 0.4); o.s = 0.7; o.k = 50;
      },
      cuivre: function (p, n, o) { poser(o, C(170, 100, 50)); o.s = 1.2; o.k = 90; },
      inox: function (p, n, o) {
        var g = fbm(p[0] * 20, p[1] * 2, p[2] * 20);
        poser(o, C(150, 154, 158), 0.8 + g * 0.25); o.s = 1.0; o.k = 70;
      },
      boitier: function (p, n, o) { poser(o, C(40, 42, 46)); o.s = 0.4; o.k = 40; },
      bois: function (p, n, o) {
        var g = fbm(p[0] * 2, p[1] * 18, p[2] * 2);
        poser(o, C(112, 74, 44), 0.65 + g * 0.5); o.s = 0.35; o.k = 40;
      },
      boisSombre: function (p, n, o) {
        var g = fbm(p[0] * 2, p[1] * 14, p[2] * 2);
        poser(o, C(64, 40, 26), 0.7 + g * 0.4); o.s = 0.25; o.k = 30;
      },
      plastique: function (p, n, o) { poser(o, C(196, 188, 164), crasse(p, n, 0.7)); o.s = 0.35; o.k = 30; },
      papier: function (p, n, o) {
        var l = Math.floor(p[2] * 60) & 1;
        poser(o, l ? C(220, 214, 196) : C(200, 196, 180)); o.s = 0.02; o.k = 4;
      },
      tasse: function (p, n, o) { poser(o, C(200, 40, 40)); o.s = 0.6; o.k = 60; },
      carton: function (p, n, o) {
        var g = fbm(p[0] * 6, p[1] * 6, p[2] * 6);
        poser(o, C(150, 112, 70), 0.75 + g * 0.35);
        if (Math.abs(p[1] % 0.5 - 0.25) < 0.02 && n[1] === 0) poser(o, C(190, 170, 120));
        o.s = 0.05; o.k = 6;
      },
      viande: function (p, n, o) {
        var g = fbm(p[0] * 9, p[1] * 9, p[2] * 9);
        poser(o, C(120, 30, 34), 0.6 + g * 0.6); o.s = 0.5; o.k = 30;
      },
      enceinte: function (p, n, o) {
        var g = Math.sin(p[0] * 300) * Math.sin(p[1] * 300) > 0.2;
        poser(o, g ? C(20, 20, 22) : C(36, 36, 40)); o.s = 0.1; o.k = 10;
      },
      corde: function (p, n, o) { poser(o, C(130, 20, 30)); o.s = 0.3; o.k = 20; },
      noir: function (p, n, o) { poser(o, C(6, 6, 7)); o.s = 0; o.k = 1; },
      abatjour: function (p, n, o) { poser(o, C(30, 60, 40)); o.s = 0.6; o.k = 40; },
      // L'eau du bassin : elle eclaire d'elle-meme, et la lumiere y ondule.
      eau: function (p, n, o) {
        var c = Math.abs(Math.sin(p[0] * 3.1 + fbm(p[0], p[1] * 2, p[2]) * 6)) *
                Math.abs(Math.sin(p[1] * 2.3 + p[2] * 2.7 + fbm(p[1], p[2], p[0]) * 5));
        // Une eau croupie : verdatre, trouble, pleine de particules, et la
        // vitre couverte d'algues vers le bas.
        poser(o, C(12, 34, 26));
        var algue = Math.max(0, fbm(p[0] * 2.5, p[1] * 3, p[2] * 2.5) - 0.45 + (1.4 - p[1]) * 0.25);
        var k = (0.04 + c * 0.09 + Math.max(0, p[1] - 2.3) * 0.2) * (1 - Math.min(0.85, algue * 1.6));
        if (hash(Math.floor(p[0] * 40), Math.floor(p[1] * 40), 3) > 0.985) k += 0.06;
        o.er = 0.06 * k; o.eg = 0.26 * k; o.eb = 0.2 * k;
        o.s = 0.6; o.k = 60;
      },
      // Le liquide des cuves : un vert trouble qui luit d'en bas, des bulles
      // qui montent, et le reflet du verre sur les bords.
      liquide: function (p, n, o) {
        poser(o, C(10, 30, 14));
        var u = Math.abs(n[0]) > 0.5 ? p[2] : p[0];
        var tr = fbm(u * 3, p[1] * 2, 4);
        var k = 0.05 + (2.3 - p[1]) * 0.05 + tr * 0.08;
        var fr = u * 9 - Math.floor(u * 9);
        if (fr < 0.08) k += 0.08;
        if (hash(Math.floor(u * 30), Math.floor(p[1] * 22), 7) > 0.97) k += 0.18;
        o.er = 0.12 * k; o.eg = 0.75 * k; o.eb = 0.3 * k;
        o.s = 1.4; o.k = 90;
      },
      ecran: function (p, n, o) {
        var l = Math.sin(p[1] * 900) * 0.5 + 0.5;
        poser(o, C(10, 14, 12));
        o.er = 0.02; o.eg = 0.07 + l * 0.02; o.eb = 0.05;
        o.s = 1.4; o.k = 120;
      },
      ecran2: function (p, n, o) {
        poser(o, C(10, 12, 16));
        o.er = 0.02; o.eg = 0.03; o.eb = 0.06;
        o.s = 1.4; o.k = 120;
      }
    };

    // Les coordonnees de texture d'un point sur la face d'une boite, vue
    // de face : u de gauche a droite, v de haut en bas.
    function uv(bx, p, n, out) {
      var a = bx.a, b = bx.b;
      var sy = b[1] - a[1];
      if (n[2] > 0.5) { out[0] = (b[0] - p[0]) / (b[0] - a[0]); out[1] = (b[1] - p[1]) / sy; }
      else if (n[2] < -0.5) { out[0] = (p[0] - a[0]) / (b[0] - a[0]); out[1] = (b[1] - p[1]) / sy; }
      else if (n[0] > 0.5) { out[0] = (p[2] - a[2]) / (b[2] - a[2]); out[1] = (b[1] - p[1]) / sy; }
      else if (n[0] < -0.5) { out[0] = (b[2] - p[2]) / (b[2] - a[2]); out[1] = (b[1] - p[1]) / sy; }
      else { out[0] = (p[0] - a[0]) / (b[0] - a[0]); out[1] = (p[2] - a[2]) / (b[2] - a[2]); }
    }

    var UV = [0, 0];
    // Une image collee sur une face : on lit le texel, et l'alpha de
    // l'image laisse voir un papier jauni.
    function texel(m, bx, p, n, o) {
      var T = TEX[m.img];
      uv(bx, p, n, UV);
      if (!T) { poser(o, C(120, 110, 100)); return; }
      var x = Math.min(T.w - 1, Math.max(0, Math.floor(UV[0] * T.w)));
      var y = Math.min(T.h - 1, Math.max(0, Math.floor(UV[1] * T.h)));
      var i = (y * T.w + x) * 4, al = T.d[i + 3] / 255;
      var fond = m.fond || T.fond || [0.6, 0.55, 0.42];
      o.r = lin(T.d[i]) * al + fond[0] * (1 - al);
      o.g = lin(T.d[i + 1]) * al + fond[1] * (1 - al);
      o.b = lin(T.d[i + 2]) * al + fond[2] * (1 - al);
      var c = crasse(p, n, 0.6);
      o.r *= c; o.g *= c; o.b *= c;
      o.s = m.s != null ? m.s : 0.12; o.k = 30;
      if (m.e) { o.er = o.r * m.e; o.eg = o.g * m.e; o.eb = o.b * m.e; }
    }

    // La matiere d'une face : le nom, l'objet { img }, l'emission pure
    // { e: [r, g, b] }, ou un jeu par face { f: { nz: ... }, d: defaut }.
    var ETEINT = false;
    function matiere(bx, face, p, n, o) {
      var m = bx.m;
      if (m && m.f) m = m.f[face] || m.d;
      o.er = o.eg = o.eb = 0; o.s = 0; o.k = 1;
      o.nom = typeof m === 'string' ? m : (m && m.img ? 'image' : null);
      if (typeof m === 'string') {
        (MAT[m] || MAT.noir)(p, n, o);
        // La panne eteint les ecrans ; l'eau, elle, garde sa lueur.
        if (ETEINT && m !== 'eau') o.er = o.eg = o.eb = 0;
        return;
      }
      if (m && m.img) { texel(m, bx, p, n, o); if (ETEINT) o.er = o.eg = o.eb = 0; return; }
      if (m && m.e) {
        o.r = o.g = o.b = 0.02; o.s = 0; o.k = 1;
        if (ETEINT) return;
        o.er = m.e[0]; o.eg = m.e[1]; o.eb = m.e[2];
        return;
      }
      MAT.noir(p, n, o);
    }

    // ---------- Les plaques ----------
    function gris(c) { return c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; }
    function mix3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    var PAPIER = C(190, 176, 140);

    // La matiere d'une plaque en (u, v) : l'image, vieillie. Une affiche
    // jaunit, se tache et se plie ; une peluche ou une bouteille prend la
    // poussiere.
    function matierePlaque(s, u, v, o) {
      o.er = o.eg = o.eb = 0; o.s = 0.1; o.k = 30; o.nom = null;
      var T = TEX[s.tex], col = [0.3, 0.3, 0.3], al = 1, k = 1;
      if (T) {
        var x = Math.min(T.w - 1, Math.floor(u * T.w)), y = Math.min(T.h - 1, Math.floor(v * T.h));
        var i = (y * T.w + x) * 4;
        al = T.d[i + 3] / 255;
        col = [lin(T.d[i]), lin(T.d[i + 1]), lin(T.d[i + 2])];
      }
      var vieux = s.vieux || 0;
      if (s.papier) {
        col = mix3(PAPIER, col, al);
        var l = gris(col);
        col = mix3(col, [l * 1.1, l * 0.95, l * 0.62], 0.45 * vieux);
        var tache = fbm(u * 5 + s.graine, v * 5, 3);
        if (tache > 0.56) k *= 1 - Math.min(0.75, (tache - 0.56) * 2.6 * vieux);
        // Les coulures de l'humidite, qui descendent du haut de l'affiche.
        k *= 1 - fbm(u * 16 + s.graine, v * 1.2, 5) * 0.45 * vieux * (1 - v * 0.5);
        if (Math.abs(u - 0.5) < 0.004 || Math.abs(v - 0.5) < 0.004) k *= 0.72;
        o.s = 0.04; o.k = 10;
      } else if (s.ajour) {
        col = C(150, 148, 140); o.s = 0;
      } else {
        // La poussiere voile la couleur, plus sur le dessus.
        var p_ = (s.sale || 0) * (0.25 + fbm(u * 9 + s.graine, v * 9, 7) * 0.5) * (1.2 - v * 0.5);
        var g_ = gris(col);
        col = mix3(col, [g_ * 0.9 + 0.025, g_ * 0.85 + 0.022, g_ * 0.78 + 0.018], Math.min(0.85, p_));
        k *= 0.82;
        if (/^bt-/.test(s.tex)) { o.s = 1.1 * (1 - (s.sale || 0) * 0.6); o.k = 90; }
        else o.s = 0.12;
      }
      o.r = col[0] * k; o.g = col[1] * k; o.b = col[2] * k;
      if (s.e && !ETEINT) { o.er = o.r * s.e; o.eg = o.g * s.e; o.eb = o.b * s.e; }
      if (s.brule) {
        var b_ = fbm(u * 6 + s.graine, v * 6, 9);
        var k_ = 0.04 + Math.max(0, 0.5 - b_) * 0.25;
        o.r *= k_; o.g *= k_ * 0.85; o.b *= k_ * 0.7; o.s = 0.02;
        if (b_ > 0.52) { var br = (b_ - 0.52) / 0.06; o.er = 0.25 * br; o.eg = 0.07 * br; o.eb = 0.01; }
      }
    }

    // La normale d'une plaque : plate pour une affiche, bombee pour un
    // objet, pour que la lumiere en dessine le volume.
    function normalePlaque(s, u, v, n) {
      var r = s.relief || 0;
      var x = s.n[0] + s.r[0] * (u - 0.5) * 1.8 * r, z = s.n[2] + s.r[2] * (u - 0.5) * 1.8 * r;
      var y = (0.45 - v) * 1.1 * r;
      var l = Math.sqrt(x * x + y * y + z * z) || 1;
      n[0] = x / l; n[1] = y / l; n[2] = z / l;
    }

    // ---------- Le delabrement ----------
    // Applique a toutes les surfaces : la crasse, les coulures d'humidite
    // sur les murs, la peinture qui s'ecaille, les flaques et les fissures
    // au sol, les taches d'eau au plafond.
    var EPARGNE = { noir: 1, eau: 1, ecran: 1, ecran2: 1, image: 1 };
    function delabrer(p, n, o) {
      var nom = o.nom;
      if (!nom || EPARGNE[nom]) return;
      var k = 1, brun = 0;
      var g = Math.abs(n[1]) > 0.5 ? fbm(p[0] * 0.9 + 5, p[2] * 0.9, 11)
                                   : fbm((p[0] + p[2]) * 1.1, p[1] * 0.6, 13);
      k *= 1 - Math.max(0, g - 0.36) * 1.0;
      if (n[1] > 0.5 && p[1] < 0.03) {
        var fl = fbm(p[0] * 0.5 + 3, p[2] * 0.5, 17);
        if (fl > 0.63) {
          var w = Math.min(1, (fl - 0.63) * 14);
          k *= 1 - 0.6 * w;
          o.s = o.s * (1 - w) + 2.2 * w; o.k = o.k * (1 - w) + 160 * w;
        }
        // Quelques fissures, la ou le sol a travaille : pas partout.
        if (bruit(p[0] * 0.35, p[2] * 0.35, 41) > 0.62 && Math.abs(fbm(p[0] * 1.6, p[2] * 1.6, 23) - 0.5) < 0.006) k *= 0.3;
        brun = 0.35;
      } else if (n[1] < -0.5) {
        var ta = fbm(p[0] * 0.8, p[2] * 0.8, 29);
        if (ta > 0.55) { brun = Math.min(1, (ta - 0.55) * 4); k *= 1 - brun * 0.45; }
      } else if (Math.abs(n[1]) < 0.5) {
        var u = p[0] + p[2];
        var coul = fbm(u * 6.5, p[1] * 0.18, 31);
        var haut = Math.min(1, Math.max(0, (p[1] - 0.5) / 2.2));
        var c2 = Math.max(0, coul - 0.5) * 3.2 * (0.45 + haut);
        k *= 1 - Math.min(0.75, c2);
        brun = Math.min(1, c2 * 1.3);
        if (p[1] < 0.5) k *= 0.62 + p[1] * 0.76;
        if (/^mur/.test(nom) && nom !== 'murScene' && p[1] > 1.12) {
          var ec = fbm(u * 2.2 + 9, p[1] * 2.2, 37);
          if (ec > 0.68) {
            // Le platre sous la peinture, et le bord sombre de l'ecaille.
            o.r = 0.26; o.g = 0.26; o.b = 0.22; o.s = 0.02;
            if (ec < 0.695) k *= 0.45;
          }
        }
      }
      o.r = (o.r * (1 - brun * 0.55) + 0.04 * brun * 0.55) * k;
      o.g = (o.g * (1 - brun * 0.55) + 0.028 * brun * 0.55) * k;
      o.b = (o.b * (1 - brun * 0.55) + 0.014 * brun * 0.55) * k;
    }

    // ---------- La geometrie ----------
    // Les groupes gardent leur boite englobante : un rayon qui la rate
    // n'a rien a tester dedans.
    // variante : certains objets n'existent que dans une variante (la
    // pancarte devant le bassin vide).
    var ETOILES = {};
    function preparer(sc, variante, mods) {
      mods = mods || {};
      var brules = mods.brules || [], remplace = mods.tex || {};
      var objets = sc.objets.filter(function (g) { return !g.seulement || g.seulement === variante; });
      var G = objets.filter(function (g) { return g.boites.length; }).map(function (g) {
        var a = [1e9, 1e9, 1e9], b = [-1e9, -1e9, -1e9];
        // Un objet brule : memes boites, en matiere brulee.
        var boites = g.id && brules.indexOf('id:' + g.id) !== -1
          ? g.boites.map(function (bx) { return { a: bx.a, b: bx.b, m: 'brule' }; })
          : g.boites;
        g = { boites: boites, ombre: g.ombre };
        g.boites.forEach(function (bx) {
          for (var k = 0; k < 3; k++) { a[k] = Math.min(a[k], bx.a[k]); b[k] = Math.max(b[k], bx.b[k]); }
        });
        return { a: a, b: b, boites: g.boites, ombre: g.ombre !== false };
      });
      // Les plaques : leur normale, leur droite, et leur largeur, d'apres
      // les proportions de l'image si on ne l'a pas donnee.
      G.sprites = objets.filter(function (g) { return g.sprite; }).map(function (g) {
        var s = {}, k;
        for (k in g.sprite) s[k] = g.sprite[k];
        if (brules.indexOf('tex:' + s.tex) !== -1) s.brule = true;
        if (remplace[s.tex]) s.tex = remplace[s.tex];
        var n = s.n;
        if (n === 'cam') {
          var dx = sc.cam.pos[0] - s.p[0], dz = sc.cam.pos[2] - s.p[2], l = Math.sqrt(dx * dx + dz * dz) || 1;
          n = [dx / l, 0, dz / l];
        }
        s.n = n;
        s.r = [-n[2], 0, n[0]];
        var T = TEX[s.tex];
        if (!s.w) s.w = T ? s.h * T.w / T.h : s.h;
        s.graine = s.graine || (s.p[0] * 17 + s.p[2] * 31);
        return s;
      });
      return G;
    }

    // Une plaque touchee en (u, v) est-elle pleine a cet endroit ? Une
    // affiche dechiree laisse voir le mur ; une peluche, le vide autour.
    function pleine(s, u, v) {
      if (s.brule && fbm(u * 6 + s.graine, v * 6, 9) > 0.58) return false;
      if (s.papier) {
        var de = Math.min(u, 1 - u, v, 1 - v);
        if (s.dechire && de < 0.2) {
          var bord = (fbm(u * 7 + s.graine, v * 7, s.graine) - 0.42) * 0.5 * s.dechire;
          if (de < bord) return false;
        }
        return true;
      }
      var T = TEX[s.tex];
      if (!T) return false;
      var x = Math.min(T.w - 1, Math.floor(u * T.w)), y = Math.min(T.h - 1, Math.floor(v * T.h));
      return T.d[(y * T.w + x) * 4 + 3] > (s.ajour ? 70 : 128);
    }

    var SU = 0, SV = 0;
    function plaqueTouchee(s, o, d, tmax) {
      var dn = d[0] * s.n[0] + d[2] * s.n[2];
      if (Math.abs(dn) < 1e-5) return -1;
      var t = ((s.p[0] - o[0]) * s.n[0] + (s.p[2] - o[2]) * s.n[2]) / dn;
      if (t < 1e-3 || t >= tmax) return -1;
      var hx = o[0] + d[0] * t - s.p[0], hz = o[2] + d[2] * t - s.p[2];
      var u = (hx * s.r[0] + hz * s.r[2]) / s.w + 0.5;
      if (u < 0 || u > 1) return -1;
      var v = 1 - (o[1] + d[1] * t - s.p[1]) / s.h;
      if (v < 0 || v > 1) return -1;
      if (!pleine(s, u, v)) return -1;
      SU = u; SV = v;
      return t;
    }

    // Le point d'entree d'un rayon dans une boite, ou -1.
    var FACE = 0;
    function entree(o, inv, a, b, tmax) {
      var t1 = (a[0] - o[0]) * inv[0], t2 = (b[0] - o[0]) * inv[0];
      var tn = Math.min(t1, t2), tf = Math.max(t1, t2), ax = 0;
      t1 = (a[1] - o[1]) * inv[1]; t2 = (b[1] - o[1]) * inv[1];
      var n1 = Math.min(t1, t2), f1 = Math.max(t1, t2);
      if (n1 > tn) { tn = n1; ax = 1; }
      if (f1 < tf) tf = f1;
      t1 = (a[2] - o[2]) * inv[2]; t2 = (b[2] - o[2]) * inv[2];
      n1 = Math.min(t1, t2); f1 = Math.max(t1, t2);
      if (n1 > tn) { tn = n1; ax = 2; }
      if (f1 < tf) tf = f1;
      if (tf < tn || tf < 1e-4 || tn > tmax) return -1;
      FACE = ax;
      return tn > 1e-4 ? tn : 0;
    }

    // Le premier obstacle sur le rayon. Rend la distance, et remplit TOUCHE.
    var TOUCHE = { bx: null, ax: 0, g: null, sp: null, u: 0, v: 0 };
    function lancer(G, o, d, inv, tmax) {
      var best = tmax, trouve = false;
      TOUCHE.sp = null;
      for (var i = 0; i < G.length; i++) {
        var g = G[i];
        if (entree(o, inv, g.a, g.b, best) < 0) continue;
        for (var j = 0; j < g.boites.length; j++) {
          var bx = g.boites[j];
          var t = entree(o, inv, bx.a, bx.b, best);
          if (t > 0 && t < best) { best = t; TOUCHE.bx = bx; TOUCHE.ax = FACE; TOUCHE.g = g; trouve = true; }
        }
      }
      var S_ = G.sprites || [];
      for (var k = 0; k < S_.length; k++) {
        var ts = plaqueTouchee(S_[k], o, d, best);
        if (ts > 0) { best = ts; TOUCHE.sp = S_[k]; TOUCHE.u = SU; TOUCHE.v = SV; trouve = true; }
      }
      return trouve ? best : -1;
    }

    function ombre(G, o, d, inv, dist) {
      var S_ = G.sprites || [];
      for (var k = 0; k < S_.length; k++) {
        if (S_[k].ombre && plaqueTouchee(S_[k], o, d, dist) > 0) return true;
      }
      for (var i = 0; i < G.length; i++) {
        var g = G[i];
        if (!g.ombre) continue;
        if (entree(o, inv, g.a, g.b, dist) < 0) continue;
        for (var j = 0; j < g.boites.length; j++) {
          var bx = g.boites[j];
          if (bx.m && bx.m.e) continue;
          var t = entree(o, inv, bx.a, bx.b, dist);
          if (t > 0 && t < dist) return true;
        }
      }
      return false;
    }

    // L'occlusion : ce qui se dresse tout pres du point, du cote de sa
    // normale, retient la lumiere ambiante. Les coins et le pied des murs
    // s'assombrissent.
    var R_AO = 0.55;
    function occlusion(G, bxHit, p, n) {
      var occ = 0;
      for (var i = 0; i < G.length; i++) {
        var g = G[i];
        if (dBoite(g.a, g.b, p) > R_AO) continue;
        for (var j = 0; j < g.boites.length; j++) {
          var bx = g.boites[j];
          if (bx === bxHit) continue;
          var d = dBoite(bx.a, bx.b, p);
          if (d > R_AO) continue;
          // Ce que la boite depasse au-dessus du plan de la surface.
          var ext = n[0] > 0.5 ? bx.b[0] - p[0] : n[0] < -0.5 ? p[0] - bx.a[0] :
                    n[1] > 0.5 ? bx.b[1] - p[1] : n[1] < -0.5 ? p[1] - bx.a[1] :
                    n[2] > 0.5 ? bx.b[2] - p[2] : p[2] - bx.a[2];
          if (ext < 0.01) continue;
          var k = 1 - d / R_AO;
          occ += k * k * Math.min(1, ext / R_AO);
        }
      }
      return Math.max(0.22, 1 - occ * 0.55);
    }

    function dBoite(a, b, p) {
      var dx = Math.max(a[0] - p[0], 0, p[0] - b[0]);
      var dy = Math.max(a[1] - p[1], 0, p[1] - b[1]);
      var dz = Math.max(a[2] - p[2], 0, p[2] - b[2]);
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // ---------- La lumiere ----------
    var alea = 1;
    function hasard() { alea = (Math.imul(alea, 1664525) + 1013904223) >>> 0; return alea / 4294967296; }

    // La lumiere recue en p (normale n), vue depuis la direction v.
    // Rend [r, g, b] diffus et [r, g, b] speculaire dans L et SP.
    var L = [0, 0, 0], SP = [0, 0, 0];
    function eclairer(G, lampes, p, n, v, k) {
      L[0] = L[1] = L[2] = 0; SP[0] = SP[1] = SP[2] = 0;
      for (var i = 0; i < lampes.length; i++) {
        var l = lampes[i];
        var lx = l.p[0] + (hasard() - 0.5) * l.taille, ly = l.p[1] + (hasard() - 0.5) * l.taille,
            lz = l.p[2] + (hasard() - 0.5) * l.taille;
        var dx = lx - p[0], dy = ly - p[1], dz = lz - p[2];
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        dx /= dist; dy /= dist; dz /= dist;
        var nl = n ? n[0] * dx + n[1] * dy + n[2] * dz : 1;
        if (nl <= 0) continue;
        var f = 1 / (1 + (dist / l.r) * (dist / l.r));
        if (l.spot) {
          var c = -(dx * l.spot[0] + dy * l.spot[1] + dz * l.spot[2]);
          var tt = (c - l.cone[1]) / (l.cone[0] - l.cone[1]);
          if (tt <= 0) continue;
          f *= tt >= 1 ? 1 : tt * tt * (3 - 2 * tt);
        }
        if (l.ombre !== false) {
          var o = [p[0] + (n ? n[0] : 0) * 0.003, p[1] + (n ? n[1] : 0) * 0.003, p[2] + (n ? n[2] : 0) * 0.003];
          var inv = [1 / (dx || 1e-9), 1 / (dy || 1e-9), 1 / (dz || 1e-9)];
          if (ombre(G, o, [dx, dy, dz], inv, dist - 0.05)) continue;
        }
        L[0] += l.c[0] * f * nl; L[1] += l.c[1] * f * nl; L[2] += l.c[2] * f * nl;
        if (v && k) {
          var hx = dx - v[0], hy = dy - v[1], hz = dz - v[2];
          var hl = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
          var nh = (n[0] * hx + n[1] * hy + n[2] * hz) / hl;
          if (nh > 0) {
            var s = Math.pow(nh, k) * f;
            SP[0] += l.c[0] * s; SP[1] += l.c[1] * s; SP[2] += l.c[2] * s;
          }
        }
      }
    }

    // La mise en image : exposition douce, gamma, une couleur un peu
    // eteinte, comme dans les images de FNaF.
    function ton(c, expo) { return Math.pow(1 - Math.exp(-c * expo), 1 / 2.2); }

    // ---------- Le rendu d'une piece ----------
    function rendre(cle, variante, mods) {
      var sc = S[cle];
      mods = mods || {};
      var G = preparer(sc, variante, mods);
      ETOILES = {};
      (mods.etoiles || []).forEach(function (c) { ETOILES[c] = 1; });
      var ids = (sc.variantes[variante] || sc.variantes.base).slice();
      var lampesSc = sc.lampes;
      if (mods.feu && sc.feu) {
        ids = ids.filter(function (id) { return sc.feu.eteint.indexOf(id) === -1; });
        lampesSc = sc.lampes.concat(sc.feu.lampes);
        sc.feu.lampes.forEach(function (l) { ids.push(l.id); });
      }
      // Le restaurant est a l'abandon : ses lampes ne donnent plus qu'une
      // partie de leur lumiere.
      var fl = sc.lumiere || 0.6;
      var lampes = lampesSc.filter(function (l) { return ids.indexOf(l.id) !== -1; }).map(function (l) {
        var c = {}, k;
        for (k in l) c[k] = l[k];
        c.c = [l.c[0] * fl, l.c[1] * fl, l.c[2] * fl];
        return c;
      });
      ETEINT = !ids.length;
      var cam = P.base(sc.cam);
      var W = sc.cam.w, H = sc.cam.h;
      var img = new Uint8ClampedArray(W * H * 4);
      var prof = new Float32Array(W * H);
      var o = sc.cam.pos, m = { r: 0, g: 0, b: 0, s: 0, k: 1, er: 0, eg: 0, eb: 0 };
      var amb = sc.ambiant.map(function (a) { return a * 0.55; });
      var expo = sc.expo || 1.3, brume = (sc.brume || 0.05) * 1.35;
      var contraste = sc.contraste || 1.5;
      var n = [0, 0, 0], pt = [0, 0, 0];
      alea = 12345;
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          // Un rayon tire au hasard dans le pixel : le crenelage se change
          // en grain, ce grain qui fait l'image de FNaF.
          var d = P.rayon(cam, x + hasard(), y + hasard());
          var inv = [1 / (d[0] || 1e-9), 1 / (d[1] || 1e-9), 1 / (d[2] || 1e-9)];
          var t = lancer(G, o, d, inv, 60);
          var i = y * W + x, r = 0, g = 0, b = 0;
          if (t < 0) { prof[i] = 60; }
          else {
            prof[i] = t;
            pt[0] = o[0] + d[0] * t; pt[1] = o[1] + d[1] * t; pt[2] = o[2] + d[2] * t;
            var bx = TOUCHE.bx, ax = TOUCHE.ax, ao;
            if (TOUCHE.sp) {
              matierePlaque(TOUCHE.sp, TOUCHE.u, TOUCHE.v, m);
              normalePlaque(TOUCHE.sp, TOUCHE.u, TOUCHE.v, n);
              // Le bas d'un objet pose touche son support : un peu d'ombre.
              ao = TOUCHE.sp.relief ? 0.7 + Math.min(0.3, (1 - TOUCHE.v) * 1.5) : 0.9;
            } else {
              n[0] = n[1] = n[2] = 0;
              n[ax] = d[ax] > 0 ? -1 : 1;
              var face = (n[ax] > 0 ? 'p' : 'n') + 'xyz'[ax];
              matiere(bx, face, pt, n, m);
              delabrer(pt, n, m);
              ao = occlusion(G, bx, pt, n);
            }
            eclairer(G, lampes, pt, n, d, m.s > 0 ? m.k : 0);
            r = m.r * (amb[0] * ao + L[0] * (0.55 + ao * 0.45)) + SP[0] * m.s * 0.25 + m.er;
            g = m.g * (amb[1] * ao + L[1] * (0.55 + ao * 0.45)) + SP[1] * m.s * 0.25 + m.eg;
            b = m.b * (amb[2] * ao + L[2] * (0.55 + ao * 0.45)) + SP[2] * m.s * 0.25 + m.eb;
            var f = Math.exp(-Math.max(0, t - 2) * brume);
            r *= f; g *= f; b *= f;
          }
          var R = ton(r, expo), Gc = ton(g, expo), Bc = ton(b, expo);
          // Le pied de courbe : les ombres tombent dans un vrai noir, la
          // ou le gamma seul les laisserait grises.
          R = Math.pow(R, contraste); Gc = Math.pow(Gc, contraste); Bc = Math.pow(Bc, contraste);
          // Une teinte eteinte : on rapproche un peu chaque couleur du gris.
          var lum = R * 0.3 + Gc * 0.59 + Bc * 0.11;
          R = R + (lum - R) * 0.22; Gc = Gc + (lum - Gc) * 0.22; Bc = Bc + (lum - Bc) * 0.22;
          var q = i * 4, gr = (hasard() - 0.5) * 2;
          img[q] = R * 255 + gr; img[q + 1] = Gc * 255 + gr; img[q + 2] = Bc * 255 + gr; img[q + 3] = 255;
        }
      }

      // Un flou a peine marque : le grain du lancer de rayons se fond en
      // une image douce, comme les rendus de FNaF.
      var flou = new Uint8ClampedArray(img.length);
      for (var fy = 0; fy < H; fy++) {
        for (var fx = 0; fx < W; fx++) {
          for (var ca = 0; ca < 3; ca++) {
            var s = 0, poids = 0;
            for (var dy2 = -1; dy2 <= 1; dy2++) {
              var yy2 = fy + dy2;
              if (yy2 < 0 || yy2 >= H) continue;
              for (var dx2 = -1; dx2 <= 1; dx2++) {
                var xx2 = fx + dx2;
                if (xx2 < 0 || xx2 >= W) continue;
                var wgt = (dx2 ? 1 : 2) * (dy2 ? 1 : 2);
                s += img[(yy2 * W + xx2) * 4 + ca] * wgt; poids += wgt;
              }
            }
            flou[(fy * W + fx) * 4 + ca] = s / poids;
          }
          flou[(fy * W + fx) * 4 + 3] = 255;
        }
      }
      img = flou;

      // La lumiere que recoit chaque personnage, de la tete aux pieds :
      // la page s'en sert pour l'assombrir et le teinter comme la piece.
      var eclairages = {};
      Object.keys(sc.poses || {}).forEach(function (k) {
        var ps = sc.poses[k];
        var zs = ps.echantillons || [ps.p[2]];
        eclairages[k] = zs.map(function (z) {
          var dist = Math.sqrt(Math.pow(o[0] - ps.p[0], 2) + Math.pow(o[1] - ps.p[1] - ps.h * 0.6, 2) + Math.pow(o[2] - z, 2));
          var fog = Math.exp(-Math.max(0, dist - 2) * brume);
          return [0.85, 0.45, 0.08].map(function (hk) {
            var acc = [0, 0, 0];
            for (var s = 0; s < 6; s++) {
              // Sans normale : un personnage prend la lumiere d'ou qu'elle
              // vienne, meme d'une lampe juste au-dessus de lui.
              eclairer(G, lampes, [ps.p[0], ps.p[1] + ps.h * hk, z], null, null, 0);
              acc[0] += L[0]; acc[1] += L[1]; acc[2] += L[2];
            }
            return [0, 1, 2].map(function (c) {
              var v = (acc[c] / 6 + amb[c]) * fog;
              // Le rendu de l'auteur est deja eclaire ; on le ramene a la
              // lumiere de la piece : 1 veut dire "comme en studio".
              // 0.78 : la peau d'un animatronique n'est pas un mur blanc,
              // elle rend moins de lumiere que la reference.
              return Math.min(1.1, 0.78 * Math.pow(ton(v * 0.8, expo), contraste) /
                                   Math.pow(ton(0.8, expo), contraste));
            });
          });
        });
      });

      return { cle: cle, variante: variante, w: W, h: H, img: img.buffer, prof: prof.buffer, eclairages: eclairages };
    }

    self.onmessage = function (ev) {
      var m = ev.data;
      if (m.type === 'textures') {
        m.liste.forEach(function (t) { TEX[t.id] = { w: t.w, h: t.h, d: new Uint8ClampedArray(t.d), fond: t.fond }; });
        return;
      }
      if (m.type === 'rendu') {
        var r = rendre(m.cle, m.variante, m.mods);
        r.n = m.n;
        r.k = m.k;
        self.postMessage(r, [r.img, r.prof]);
      }
    };
  }

  // ==========================================================
  //  Cote page
  // ==========================================================

  var P = PROJ(), SC = SCENES();

  // Les textures des affiches : les illustrations de l'auteur, et
  // quelques pancartes peintes ici.
  var IMAGES = {
    logo: 'assets/games/wade/logo.webp',
    fizzies: 'assets/games/wade/fizzies.webp',
    plushies: 'assets/games/wade/plushies.webp'
  };

  function toile(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function chargerImage(src) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { ok(null); };
      im.src = src;
    });
  }

  // Les pancartes peintes a la main : le menu, les regles, les dessins
  // d'enfants, l'employe du mois.
  function peindrePancartes(imgs) {
    var T = {};

    var c = toile(900, 220), x = c.getContext('2d');
    x.fillStyle = '#16100c'; x.fillRect(0, 0, 900, 220);
    x.fillStyle = '#f2c94c'; x.font = 'bold 34px Georgia, serif'; x.textAlign = 'center';
    x.fillText('★  LE MENU DE WADE  ★', 450, 46);
    x.font = 'bold 24px Georgia, serif'; x.textAlign = 'left';
    var plats = [['Le Wade Burger', '4,99'], ['Le Requin de Stephen', '5,49'],
                 ['Le Croustillant de Faith', '4,49'], ['Le Fondant de Charlie', '3,99'],
                 ['Frites maison', '1,99'], ['Fizzies (toutes saveurs)', '1,49']];
    plats.forEach(function (p, i) {
      var cx = i < 3 ? 40 : 480, cy = 98 + (i % 3) * 44;
      x.fillStyle = '#f4ecd8'; x.fillText(p[0], cx, cy);
      x.fillStyle = '#e8483a'; x.textAlign = 'right'; x.fillText(p[1] + ' $', cx + 380, cy); x.textAlign = 'left';
    });
    T.menu = c;

    c = toile(400, 520); x = c.getContext('2d');
    x.fillStyle = '#efe6cc'; x.fillRect(0, 0, 400, 520);
    x.fillStyle = '#b8261e'; x.fillRect(0, 0, 400, 86);
    x.fillStyle = '#fff'; x.font = 'bold 40px Arial'; x.textAlign = 'center';
    x.fillText('LES RÈGLES', 200, 58);
    x.fillStyle = '#2a2018'; x.font = 'bold 21px Arial'; x.textAlign = 'left';
    ['1. On ne court pas.', '2. On ne tape pas', '   sur la vitre de Stephen.', '3. On ne nourrit pas',
     '   les animatroniques.', '4. On ne reste pas', '   après la fermeture.', '', '   Merci !  — Wade'].forEach(function (l, i) {
      x.fillText(l, 30, 136 + i * 40);
    });
    T.regles = c;

    c = toile(420, 300); x = c.getContext('2d');
    x.fillStyle = '#f6f1e2'; x.fillRect(0, 0, 420, 300);
    // Quatre dessins d'enfants : le loup, le requin, l'oiseau, le capybara.
    function bonhomme(cx, cy, col, oreilles) {
      x.lineWidth = 5; x.strokeStyle = col; x.fillStyle = col;
      x.beginPath(); x.arc(cx, cy, 30, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.moveTo(cx, cy + 30); x.lineTo(cx, cy + 100); x.stroke();
      x.beginPath(); x.moveTo(cx - 34, cy + 56); x.lineTo(cx + 34, cy + 56); x.stroke();
      x.beginPath(); x.moveTo(cx, cy + 100); x.lineTo(cx - 24, cy + 140); x.moveTo(cx, cy + 100); x.lineTo(cx + 24, cy + 140); x.stroke();
      x.fillStyle = '#111'; x.fillRect(cx - 12, cy - 8, 6, 6); x.fillRect(cx + 7, cy - 8, 6, 6);
      x.beginPath(); x.arc(cx, cy + 6, 14, 0.1, Math.PI - 0.1); x.stroke();
      x.strokeStyle = col;
      if (oreilles === 'loup') { x.beginPath(); x.moveTo(cx - 24, cy - 18); x.lineTo(cx - 20, cy - 50); x.lineTo(cx - 6, cy - 28); x.moveTo(cx + 24, cy - 18); x.lineTo(cx + 20, cy - 50); x.lineTo(cx + 6, cy - 28); x.stroke(); }
      if (oreilles === 'requin') { x.beginPath(); x.moveTo(cx - 8, cy - 30); x.lineTo(cx + 10, cy - 64); x.lineTo(cx + 16, cy - 26); x.stroke(); }
      if (oreilles === 'oiseau') { for (var k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(cx + k * 7, cy - 28); x.lineTo(cx + k * 10, cy - 52); x.stroke(); } }
      if (oreilles === 'capy') { x.beginPath(); x.arc(cx - 22, cy - 24, 9, 0, Math.PI * 2); x.arc(cx + 22, cy - 24, 9, 0, Math.PI * 2); x.stroke(); }
    }
    bonhomme(60, 80, '#6a6a72', 'loup');
    bonhomme(160, 90, '#5a7aa8', 'requin');
    bonhomme(260, 80, '#4a6ad0', 'oiseau');
    bonhomme(360, 90, '#b8662a', 'capy');
    x.fillStyle = '#d0302a'; x.font = 'bold 26px "Comic Sans MS", cursive'; x.textAlign = 'center';
    x.fillText('MES AMIS', 210, 286);
    T.dessins = c;

    c = toile(420, 300); x = c.getContext('2d');
    x.fillStyle = '#f2c94c'; x.fillRect(0, 0, 420, 300);
    x.fillStyle = '#b8261e'; x.font = 'bold 86px Arial Black, Arial'; x.textAlign = 'center';
    x.fillText('SOURIEZ', 210, 150);
    x.font = 'bold 30px Arial'; x.fillStyle = '#2a1a10';
    x.fillText('Wade vous regarde !', 210, 220);
    T.souriez = c;

    c = toile(320, 400); x = c.getContext('2d');
    x.fillStyle = '#3a2a1a'; x.fillRect(0, 0, 320, 400);
    x.fillStyle = '#c8a050'; x.fillRect(12, 12, 296, 376);
    x.fillStyle = '#efe6cc'; x.fillRect(24, 24, 272, 352);
    x.fillStyle = '#2a2018'; x.font = 'bold 26px Georgia'; x.textAlign = 'center';
    x.fillText('EMPLOYÉ', 160, 66); x.fillText('DU MOIS', 160, 98);
    x.fillStyle = '#9a9488'; x.fillRect(70, 120, 180, 190);
    x.fillStyle = '#1a1612'; x.beginPath(); x.arc(160, 190, 46, 0, Math.PI * 2); x.fill();
    x.fillRect(110, 236, 100, 74);
    x.fillStyle = '#efe6cc'; x.font = 'bold 40px Georgia'; x.fillText('?', 160, 204);
    x.fillStyle = '#2a2018'; x.font = 'italic 20px Georgia'; x.fillText('(poste à pourvoir)', 160, 350);
    T.employe = c;

    c = toile(900, 90); x = c.getContext('2d');
    x.fillStyle = '#0c1a2a'; x.fillRect(0, 0, 900, 90);
    x.fillStyle = '#5ae0ff'; x.font = 'bold 52px Arial Black, Arial'; x.textAlign = 'center';
    x.fillText("STEPHEN'S SPLASH", 450, 66);
    T.splash = c;

    // Les fanions de fete, une guirlande de triangles colores.
    c = toile(800, 24); x = c.getContext('2d');
    var cols = ['#d8302a', '#f2c94c', '#3a8ad8', '#3aa850', '#e87a20'];
    for (var i = 0; i < 40; i++) {
      x.fillStyle = cols[i % cols.length];
      x.beginPath(); x.moveTo(i * 20, 0); x.lineTo(i * 20 + 20, 0); x.lineTo(i * 20 + 10, 24); x.fill();
    }
    T.fanions = c;

    // ---------- Les produits derives, decoupes un par un ----------
    // Rogne un canevas a ce qu'il a d'opaque.
    function rogner(c) {
      var cx = c.getContext('2d'), d = cx.getImageData(0, 0, c.width, c.height).data;
      var x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (var yy = 0; yy < c.height; yy++) {
        for (var xx = 0; xx < c.width; xx++) {
          if (d[(yy * c.width + xx) * 4 + 3] > 24) {
            if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
          }
        }
      }
      if (x1 <= x0 || y1 <= y0) return c;
      var r = toile(x1 - x0 + 1, y1 - y0 + 1);
      r.getContext('2d').drawImage(c, -x0, -y0);
      return r;
    }
    function decoupe(im, sx, sy, sw, sh, efface) {
      var c = toile(Math.round(sw), Math.round(sh)), cx = c.getContext('2d');
      cx.drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
      if (efface) cx.clearRect(efface[0], efface[1], efface[2], efface[3]);
      return rogner(c);
    }
    var BT = ['bt-wade', 'bt-stephen', 'bt-faith', 'bt-charlie'];
    if (imgs.fizzies) {
      var F = imgs.fizzies, fw = F.width, fh = F.height;
      // Les quatre bouteilles ; le petit logo du coin n'en fait pas partie.
      var bornes = [[0.04, 0.27], [0.29, 0.49], [0.51, 0.71], [0.73, 0.935]];
      bornes.forEach(function (bo, i) {
        var x0 = bo[0] * fw, w = (bo[1] - bo[0]) * fw;
        T[BT[i]] = decoupe(F, x0, fh * 0.04, w, fh * 0.92, i === 3 ? [w - 0.02 * fw, 0, 0.06 * fw, 0.16 * fh] : null);
      });
    }
    if (imgs.plushies) {
      var Pl = imgs.plushies, pw = Pl.width / 2, ph = Pl.height / 2;
      T['pl-wade'] = decoupe(Pl, 0, 0, pw, ph);
      T['pl-faith'] = decoupe(Pl, pw, 0, pw, ph, [pw * 0.7, 0, pw * 0.3, ph * 0.27]);
      T['pl-charlie'] = decoupe(Pl, 0, ph, pw, ph);
      T['pl-stephen'] = decoupe(Pl, pw, ph, pw, ph);
    }

    // Des salissures peintes : taches sombres, coulures, rouille.
    function salir(x, w, h, n, coul, graine) {
      var g = graine || 1;
      function hz() { g = (g * 16807) % 2147483647; return g / 2147483647; }
      for (var i = 0; i < n; i++) {
        var cx = hz() * w, cy = hz() * h, r = 4 + hz() * Math.min(w, h) * 0.12;
        var gr = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        gr.addColorStop(0, coul.replace('A', (0.15 + hz() * 0.35).toFixed(2)));
        gr.addColorStop(1, coul.replace('A', '0'));
        x.fillStyle = gr;
        x.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      for (i = 0; i < n / 3; i++) {
        var sx = hz() * w, sy = hz() * h * 0.6, l = 20 + hz() * h * 0.5;
        var lg = x.createLinearGradient(0, sy, 0, sy + l);
        lg.addColorStop(0, coul.replace('A', '0.35'));
        lg.addColorStop(1, coul.replace('A', '0'));
        x.fillStyle = lg;
        x.fillRect(sx, sy, 2 + hz() * 4, l);
      }
    }

    // La fontaine a soda : un panneau d'inox use, quatre distributeurs,
    // chacun avec sa bouteille en etiquette. Un bec est condamne.
    c = toile(512, 260); x = c.getContext('2d');
    var inox = x.createLinearGradient(0, 0, 0, 260);
    inox.addColorStop(0, '#9aa0a6'); inox.addColorStop(0.5, '#6e747a'); inox.addColorStop(1, '#3e4246');
    x.fillStyle = inox; x.fillRect(0, 0, 512, 260);
    for (var lgn = 0; lgn < 260; lgn += 2) { x.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.05).toFixed(3) + ')'; x.fillRect(0, lgn, 512, 1); }
    x.fillStyle = '#7a1414'; x.fillRect(0, 0, 512, 42);
    x.fillStyle = '#e8dcc0'; x.font = 'bold 30px Arial Black, Arial'; x.textAlign = 'center';
    x.fillText('FIZZIES', 256, 32);
    var couls = ['#5a0e10', '#0e2a6a', '#8a7a10', '#8a3a08'];
    for (var dI = 0; dI < 4; dI++) {
      var dx = 14 + dI * 124;
      x.fillStyle = couls[dI]; x.fillRect(dx, 54, 108, 120);
      x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 3; x.strokeRect(dx, 54, 108, 120);
      if (T[BT[dI]]) {
        var bc = T[BT[dI]], bh = 112, bw = bh * bc.width / bc.height;
        x.drawImage(bc, dx + 54 - bw / 2, 58, bw, bh);
      }
      // Le levier et le bec.
      x.fillStyle = '#2a2c30'; x.fillRect(dx + 44, 176, 20, 34);
      x.fillStyle = '#1a1c1e'; x.fillRect(dx + 48, 206, 12, 10);
    }
    // La grille d'egouttage, tachee de sirop sec.
    x.fillStyle = '#1a1c1e'; x.fillRect(0, 222, 512, 38);
    x.fillStyle = '#2e3236';
    for (var gx = 4; gx < 512; gx += 10) x.fillRect(gx, 226, 5, 30);
    salir(x, 512, 260, 60, 'rgba(40,24,10,A)', 7);
    salir(x, 512, 260, 25, 'rgba(110,50,20,A)', 9);
    // Un bout de scotch : HORS SERVICE, sur le bec de Stephen.
    x.save(); x.translate(200, 120); x.rotate(-0.18);
    x.fillStyle = 'rgba(230,220,180,.92)'; x.fillRect(-56, -14, 112, 28);
    x.fillStyle = '#5a1010'; x.font = 'bold 15px Arial'; x.fillText('HORS SERVICE', 0, 6);
    x.restore();
    T.fontaine = c;

    // La porte vitree du frigo : trois rayons de Fizzies dans le froid,
    // la vitre embuee, des traces de doigts, un coin fele.
    c = toile(420, 512); x = c.getContext('2d');
    var fondF = x.createLinearGradient(0, 0, 0, 512);
    fondF.addColorStop(0, '#16242c'); fondF.addColorStop(1, '#070c10');
    x.fillStyle = fondF; x.fillRect(0, 0, 420, 512);
    x.fillStyle = 'rgba(200,230,255,.85)'; x.fillRect(20, 30, 380, 6);
    for (var rg = 0; rg < 3; rg++) {
      var by = 50 + rg * 150;
      for (var bI = 0; bI < 6; bI++) {
        var kk = (bI + rg * 2) % 4;
        // Deux vides sur le rayon du bas : quelqu'un s'est servi.
        if (rg === 2 && (bI === 1 || bI === 4)) continue;
        var bc2 = T[BT[kk]];
        if (!bc2) continue;
        var hh = 128 - (bI % 2) * 6, ww = hh * bc2.width / bc2.height;
        x.globalAlpha = 0.85;
        x.drawImage(bc2, 24 + bI * 63 + (63 - ww) / 2, by + (134 - hh), ww, hh);
        x.globalAlpha = 1;
      }
      x.fillStyle = '#8a959c'; x.fillRect(14, by + 134, 392, 7);
      x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(14, by + 141, 392, 6);
    }
    // Le verre : un reflet en biais, la buee du bas, la salete.
    var refl = x.createLinearGradient(0, 0, 420, 512);
    refl.addColorStop(0, 'rgba(255,255,255,0)'); refl.addColorStop(0.42, 'rgba(255,255,255,.1)');
    refl.addColorStop(0.47, 'rgba(255,255,255,0)'); refl.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = refl; x.fillRect(0, 0, 420, 512);
    var buee = x.createLinearGradient(0, 330, 0, 512);
    buee.addColorStop(0, 'rgba(200,215,225,0)'); buee.addColorStop(1, 'rgba(200,215,225,.38)');
    x.fillStyle = buee; x.fillRect(0, 330, 420, 182);
    salir(x, 420, 512, 50, 'rgba(30,26,20,A)', 13);
    // Des traces de doigts dans la buee.
    for (var tI = 0; tI < 9; tI++) {
      x.fillStyle = 'rgba(10,16,20,.35)';
      x.beginPath(); x.ellipse(150 + tI * 9 + (tI % 3) * 14, 420 + (tI % 3) * 18, 7, 10, 0.3, 0, Math.PI * 2); x.fill();
    }
    // La felure, partie du coin.
    x.strokeStyle = 'rgba(230,240,250,.55)'; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(420, 60); x.lineTo(360, 110); x.lineTo(372, 150); x.moveTo(360, 110); x.lineTo(310, 128); x.stroke();
    x.fillStyle = '#3e464c';
    x.fillRect(0, 0, 420, 14); x.fillRect(0, 498, 420, 14); x.fillRect(0, 0, 14, 512); x.fillRect(406, 0, 14, 512);
    x.fillStyle = '#7a1414'; x.fillRect(14, 0, 392, 14);
    T.frigo = c;

    // Une toile d'araignee : des rayons qui partent du coin haut, et la
    // spirale, cassee par endroits.
    c = toile(256, 256); x = c.getContext('2d');
    x.strokeStyle = 'rgba(225,225,215,.75)'; x.lineWidth = 1.3;
    var cxw = 128, cyw = 6, ang;
    for (ang = 0.25; ang < Math.PI - 0.2; ang += 0.28) {
      x.beginPath(); x.moveTo(cxw, cyw); x.lineTo(cxw + Math.cos(ang) * 250, cyw + Math.sin(ang) * 250); x.stroke();
    }
    for (var rr = 20; rr < 240; rr += 16) {
      x.beginPath();
      var premier = true;
      for (ang = 0.25; ang < Math.PI - 0.2; ang += 0.28) {
        var jit = rr + Math.sin(ang * 7 + rr) * 3;
        var px_ = cxw + Math.cos(ang) * jit, py_ = cyw + Math.sin(ang) * jit;
        if (premier || Math.random() < 0.12) x.moveTo(px_, py_); else x.lineTo(px_, py_);
        premier = false;
      }
      x.stroke();
    }
    T.toile = c;

    // La pancarte du bassin vide.
    c = toile(300, 330); x = c.getContext('2d');
    x.fillStyle = '#2a2a2e'; x.fillRect(140, 150, 20, 180);
    x.fillStyle = '#c8a832'; x.fillRect(10, 10, 280, 160);
    x.fillStyle = '#1a1612'; x.fillRect(18, 18, 264, 144);
    x.fillStyle = '#d8b83a'; x.fillRect(24, 24, 252, 132);
    x.fillStyle = '#1a1612'; x.font = 'bold 40px Arial'; x.textAlign = 'center';
    x.fillText('DÉSOLÉ !', 150, 76);
    x.font = 'bold 30px Arial'; x.fillText('HORS SERVICE', 150, 126);
    salir(x, 300, 170, 30, 'rgba(40,24,10,A)', 21);
    T.pancarte = c;

    // Le panneau d'outils de l'atelier.
    c = toile(500, 260); x = c.getContext('2d');
    x.fillStyle = '#9a7a50'; x.fillRect(0, 0, 500, 260);
    x.fillStyle = '#5a4428';
    for (var py = 10; py < 260; py += 20) for (var px = 10; px < 500; px += 20) x.fillRect(px, py, 4, 4);
    x.strokeStyle = '#2a2a2e'; x.lineWidth = 10; x.lineCap = 'round';
    [[60, 40, 60, 190], [120, 50, 160, 180], [240, 40, 240, 140], [330, 60, 380, 200], [430, 40, 430, 210]].forEach(function (s) {
      x.beginPath(); x.moveTo(s[0], s[1]); x.lineTo(s[2], s[3]); x.stroke();
    });
    x.fillStyle = '#b02020'; x.fillRect(215, 140, 50, 60);
    x.fillStyle = '#c8c8cc'; x.beginPath(); x.arc(330, 60, 18, 0, Math.PI * 2); x.fill();
    T.outils = c;

    // Les memes outils, trois d'entre eux ranges en F.
    c = toile(500, 260); x = c.getContext('2d');
    x.drawImage(T.outils, 0, 0);
    x.fillStyle = '#9a7a50';
    [[60, 40, 60, 190], [120, 50, 160, 180], [430, 40, 430, 210]].forEach(function (sg) {
      x.save(); x.lineWidth = 18; x.lineCap = 'round'; x.strokeStyle = '#9a7a50';
      x.beginPath(); x.moveTo(sg[0], sg[1]); x.lineTo(sg[2], sg[3]); x.stroke(); x.restore();
    });
    x.fillStyle = '#5a4428';
    for (var py2 = 10; py2 < 260; py2 += 20) for (var px2 = 10; px2 < 500; px2 += 20) {
      if (Math.abs(px2 - 60) < 14 || Math.abs(px2 - 430) < 14 || (px2 > 100 && px2 < 180)) x.fillRect(px2, py2, 4, 4);
    }
    x.strokeStyle = '#2a2a2e'; x.lineWidth = 10; x.lineCap = 'round';
    [[70, 40, 70, 215], [70, 40, 200, 40], [70, 125, 165, 125]].forEach(function (sg) {
      x.beginPath(); x.moveTo(sg[0], sg[1]); x.lineTo(sg[2], sg[3]); x.stroke();
    });
    T.outilsF = c;

    // Les plans du laboratoire : quatre tetes de masques, griffonnees.
    c = toile(420, 400); x = c.getContext('2d');
    x.fillStyle = '#1c2a3a'; x.fillRect(0, 0, 420, 400);
    x.strokeStyle = 'rgba(200,225,255,.75)'; x.lineWidth = 2;
    for (var gi = 0; gi < 420; gi += 20) { x.globalAlpha = 0.15; x.beginPath(); x.moveTo(gi, 0); x.lineTo(gi, 400); x.stroke(); }
    for (gi = 0; gi < 400; gi += 20) { x.beginPath(); x.moveTo(0, gi); x.lineTo(420, gi); x.stroke(); }
    x.globalAlpha = 1;
    x.fillStyle = 'rgba(220,235,255,.85)'; x.font = 'bold 18px Arial'; x.textAlign = 'center';
    ['M1', 'M2', 'M3', 'M4'].forEach(function (m, i) {
      var cx2 = 105 + (i % 2) * 210, cy2 = 100 + Math.floor(i / 2) * 190;
      x.beginPath(); x.ellipse(cx2, cy2, 55 + i * 6, 48, 0, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(cx2 - 18, cy2, 10, 0, Math.PI * 2); x.arc(cx2 + 18, cy2, 10, 0, Math.PI * 2); x.stroke();
      x.fillText(m, cx2, cy2 + 80);
    });
    T.plans = c;

    c = toile(420, 300); x = c.getContext('2d');
    x.fillStyle = '#d8d2c0'; x.fillRect(0, 0, 420, 300);
    x.strokeStyle = 'rgba(30,40,90,.8)'; x.lineWidth = 2;
    x.beginPath(); x.ellipse(130, 140, 80, 90, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(100, 120, 16, 0, Math.PI * 2); x.arc(160, 120, 16, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(80, 190); x.lineTo(180, 190); x.stroke();
    for (var dt2 = 0; dt2 < 8; dt2++) { x.beginPath(); x.moveTo(88 + dt2 * 12, 190); x.lineTo(92 + dt2 * 12, 205); x.stroke(); }
    x.beginPath(); x.moveTo(230, 60); x.lineTo(400, 60); x.moveTo(230, 100); x.lineTo(380, 100); x.moveTo(230, 140); x.lineTo(390, 140); x.moveTo(230, 180); x.lineTo(360, 180); x.stroke();
    x.fillStyle = 'rgba(30,40,90,.9)'; x.font = 'bold 18px Arial'; x.fillText('PROJET W-01', 240, 240);
    x.fillStyle = 'rgba(150,20,20,.85)'; x.font = 'bold 22px Arial'; x.fillText('CONFIDENTIEL', 240, 275);
    T.plans2 = c;

    // Les illustrations, telles quelles.
    ['logo', 'fizzies', 'plushies'].forEach(function (k) { if (imgs[k]) T[k] = imgs[k]; });
    return T;
  }

  // Les fonds que l'alpha d'une affiche laisse voir.
  var FONDS = { logo: [0.03, 0.02, 0.05], fizzies: [0.05, 0.04, 0.03], plushies: [0.02, 0.02, 0.02] };

  function texturesPourWorker(T) {
    return Object.keys(T).map(function (k) {
      var src = T[k];
      var w = Math.min(512, src.width), h = Math.round(src.height * w / src.width);
      var c = toile(w, h), x = c.getContext('2d');
      x.drawImage(src, 0, 0, w, h);
      var d = x.getImageData(0, 0, w, h).data;
      return { id: k, w: w, h: h, d: d.buffer, fond: FONDS[k] };
    });
  }

  // ---------- La file des rendus ----------

  var workers = [], libres = [], file = [], attente = {}, CACHE = {}, demarre = null;
  var compteur = 0;

  function source() {
    return PROJ.toString() + '\n' + SCENES.toString() + '\n(' + MOTEUR.toString() + ')();';
  }

  function demarrer() {
    if (demarre) return demarre;
    demarre = Promise.all(Object.keys(IMAGES).map(function (k) {
      return chargerImage(IMAGES[k]).then(function (im) { return [k, im]; });
    })).then(function (paires) {
      var imgs = {};
      paires.forEach(function (p) { imgs[p[0]] = p[1]; });
      var tex = texturesPourWorker(peindrePancartes(imgs));
      var url = URL.createObjectURL(new Blob([source()], { type: 'text/javascript' }));
      var n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
      for (var i = 0; i < n; i++) {
        var w = new Worker(url);
        // Chaque worker recoit sa propre copie des textures.
        w.postMessage({ type: 'textures', liste: tex.map(function (t) {
          return { id: t.id, w: t.w, h: t.h, d: t.d.slice(0), fond: t.fond };
        }) });
        w.onmessage = recu.bind(null, w);
        workers.push(w);
        libres.push(w);
      }
      pomper();
    });
    return demarre;
  }

  function recu(w, ev) {
    var r = ev.data;
    var cle = r.k;
    var c = toile(r.w, r.h);
    c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.img), r.w, r.h), 0, 0);
    CACHE[cle] = { canvas: c, prof: new Float32Array(r.prof), eclairages: r.eclairages, w: r.w, h: r.h };
    (attente[cle] || []).forEach(function (f) { f(CACHE[cle]); });
    delete attente[cle];
    libres.push(w);
    pomper();
  }

  function pomper() {
    while (libres.length && file.length) {
      var t = file.shift();
      libres.shift().postMessage({ type: 'rendu', cle: t[0], variante: t[1], mods: t[2], k: t[3], n: compteur++ });
    }
  }

  // Le rendu d'une piece (et d'une variante d'eclairage), une seule fois.
  // mods : ce qui a change dans la piece (objets brules, textures
  // remplacees, incendie). Chaque combinaison est un rendu a part.
  function cleDe(cle, variante, mods) {
    return cle + ':' + (variante || 'base') + (mods ? '|' + JSON.stringify(mods) : '');
  }
  function obtenir(cle, variante, mods) {
    variante = variante || 'base';
    var k = cleDe(cle, variante, mods);
    if (CACHE[k]) return Promise.resolve(CACHE[k]);
    return new Promise(function (ok) {
      if (!attente[k]) {
        attente[k] = [];
        // Une piece modifiee passe devant : le joueur attend de la voir.
        if (mods) {
          var i = 0;
          while (i < file.length && file[i][2]) i++;
          file.splice(i, 0, [cle, variante, mods, k]);
        }
        else file.push([cle, variante, null, k]);
        demarrer().then(pomper);
      }
      attente[k].push(ok);
    });
  }

  function deja(cle, variante, mods) { return CACHE[cleDe(cle, variante, mods)] || null; }

  // Le point de la piece que montre un pixel du rendu : la profondeur
  // gardee par le rendu le dit exactement.
  function point(cle, rendu, px, py) {
    var ix = Math.floor(px), iy = Math.floor(py);
    if (!rendu || ix < 0 || iy < 0 || ix >= rendu.w || iy >= rendu.h) return null;
    var t = rendu.prof[iy * rendu.w + ix];
    if (!(t < 59)) return null;
    var c = SC[cle].cam, b = P.base(c), d = P.rayon(b, ix + 0.5, iy + 0.5);
    return [c.pos[0] + d[0] * t, c.pos[1] + d[1] * t, c.pos[2] + d[2] * t];
  }

  // Si le point est sur une affiche (tex) de la piece, ou on l'a touchee :
  // u de gauche a droite, v de haut en bas, comme dans l'image.
  function surAffiche(cle, tex, pt) {
    if (!pt) return null;
    var sc = SC[cle], best = null;
    sc.objets.forEach(function (g) {
      var s = g.sprite;
      if (!s || s.tex !== tex || !s.w) return;
      var n = s.n;
      if (n === 'cam') return;
      var dx = pt[0] - s.p[0], dy = pt[1] - s.p[1], dz = pt[2] - s.p[2];
      if (Math.abs(dx * n[0] + dz * n[2]) > 0.08) return;
      var r = [-n[2], 0, n[0]];
      var u = (dx * r[0] + dz * r[2]) / s.w + 0.5, v = 1 - dy / s.h;
      if (u < -0.03 || u > 1.03 || v < -0.03 || v > 1.03) return;
      best = { u: u, v: v };
    });
    return best;
  }

  // Une etoile du fond de scene sous ce point ? Rend sa case, ou null.
  function hash(x, y, z) {
    var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function etoile(pt) {
    if (!pt || Math.abs(pt[2] - 10) > 0.05) return null;
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        var ci = Math.floor(pt[0] * 7) + dx, cj = Math.floor(pt[1] * 7) + dy;
        if (hash(ci, cj, 5) > 0.965) return { cle: ci + ',' + cj, x: (ci + 0.5) / 7, y: (cj + 0.5) / 7 };
      }
    }
    return null;
  }

  // Tout ce que le jeu va demander, du plus urgent au moins urgent.
  function precharger() {
    var L = [['bureau', 'base'], ['scene', 'base'], ['bureau', 'lumG'], ['bureau', 'lumD'],
             ['salle', 'base'], ['bassin', 'base'], ['couloirO', 'base'], ['coinO', 'base'],
             ['couloirE', 'base'], ['coinE', 'base'], ['comptoir', 'base'], ['boutique', 'base'],
             ['atelier', 'base'], ['froid', 'base'], ['bureau', 'noir'], ['bassin', 'vide']];
    return Promise.all(L.map(function (p) { return obtenir(p[0], p[1]); }));
  }

  function progression() {
    return Object.keys(CACHE).length / 16;
  }

  window.WADE_RENDU = {
    SCENES: SC, projeter: function (cle, p) { return P.projeter(P.base(SC[cle].cam), p); },
    obtenir: obtenir, deja: deja, precharger: precharger, progression: progression,
    point: point, surAffiche: surAffiche, etoile: etoile
  };
})();
