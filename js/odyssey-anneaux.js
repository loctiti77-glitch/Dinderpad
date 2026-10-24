// Aurelle : les anneaux de la geante du systeme stellaire.
//
// On n'y va pas au Teleportail, du moins pas la premiere fois. Depuis
// Viridia, la geante a anneaux pend dans le ciel ; il faut la viser au
// Telescope assez longtemps pour que le saut se declenche
// (js/odyssey-lunette.js). Tant qu'on n'y a pas pose le pied, Aurelle
// n'apparait nulle part : ni au journal, ni dans les compteurs.
//
// On y marche sur les anneaux eux-memes : des bandes de glace et de roche
// cassees en plaques, au-dessus d'une mer de nuages. Des ponts de gravats
// relient les plaques. La geante occupe la moitie du ciel.
(function () {
  var V = window.ODYVIE, B = window.BOSS, TER = window.ODYTERRAIN, M = window.MONDE;
  if (!V || !TER || !M) return;
  var T = M.T, bruit = M.bruit;

  // ==========================================================
  //  Le monde
  // ==========================================================
  var ASTRE = {
    code: 'AN-R9', id: 'aurelle', nom: 'Aurelle', rang: 19, ordre: 1, systeme: 'anneaux', secret: true,
    sous: 'Les anneaux de la géante',
    texte: 'Des milliards de blocs de glace et de roche qui tournent autour ' +
           'de la géante, si serrés qu’on marche de l’un à l’autre. Dessous, ' +
           'une mer de nuages dorés. Au-dessus, la planète entière.',
    ciel: ['#120a26', '#d8a860', '#05030c'],
    palette: {
      sol: '#c8b48c', sol2: '#b8a47c', grain: '#e0d0a8',
      roche: '#5a5070', rocheHaut: '#8a80a8', rocheOmbre: '#2a2438',
      liquide: '#e8d0a0', liquide2: '#fff0cc', ecume: '#ffffff',
      cristal: '#ffd86a', cristal2: '#fff6c8',
      structure: '#7a5a3a', structureHaut: '#b8885a'
    },
    liquideNom: 'la mer de nuages', eau: 0.2, roche: 0.12, cristal: 0.07,
    construire: construire
  };
  V.ASTRES.push(ASTRE);
  V.SYSTEMES.push({ id: 'anneaux', nom: 'Aurelle', prefixe: 'AN', secret: true });
  TER.FLORE.aurelle = { plante: 'prisme', flore: '#c8a868', flore2: '#fff0c0', fleur: '#ffffff', densite: 0.3 };

  // Les anneaux tournent autour d'un centre loin au nord de la carte : vus
  // d'ici, ce sont des bandes qui s'incurvent d'un bord a l'autre. Les
  // divisions sont les grands vides entre deux anneaux ; les plaques se
  // fendent en travers.
  var BANDES = [[150, 161], [168, 180], [187, 212], [220, 228], [235, 246]];
  function construire(a) {
    var MW = TER.MW, MH = TER.MH, DX = TER.DX, DY = TER.DY;
    var g = [], x, y, sel = 919;
    for (y = 0; y < MH; y++) {
      g.push([]);
      for (x = 0; x < MW; x++) {
        var d = Math.hypot(x - DX, (y + 150) * 1.0) + (TER.lisse(x, y, 7, sel) - 0.5) * 5;
        var dansBande = BANDES.some(function (b) { return d >= b[0] && d <= b[1]; });
        var t = T.LIQUIDE;
        if (dansBande) {
          // Les fentes, en travers des bandes.
          var th = Math.atan2(y + 150, x - DX);
          var f = (th * 60 + TER.lisse(x, y, 5, sel + 1) * 2) % 1;
          if (f < 0.07 && bruit(x, y, sel + 2) < 0.9) t = T.LIQUIDE;
          else {
            t = bruit(x, y, sel + 3) < 0.15 ? T.SOL_B : T.SOL;
            var n = bruit(x, y, sel + 4);
            if (TER.lisse(x, y, 6, sel + 5) > 0.68 && n < 0.55) t = T.ROCHE_A;       // des blocs de glace empiles
            else if (n < 0.04) t = T.ROCHE_A;
            else if (TER.lisse(x, y, 8, sel + 6) > 0.74 && n < 0.35) t = T.CRISTAL;   // de la glace doree
            else if (TER.lisse(x, y, 9, sel + 7) > 0.6 && n < 0.3) t = T.PLANTE;      // des prismes de givre
            else if (n < 0.08) t = T.FLORE;
          }
        }
        g[y].push(t);
      }
    }
    var lesRuines = TER.ruines(g, sel + 30, 4);
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
      if (x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2) g[y][x] = T.ROCHE_A;
      else if (Math.abs(x - DX) + Math.abs(y - DY) <= 5) g[y][x] = T.SOL;
    }
    TER.combler(g);
    TER.relier(g);
    g.poches = TER.poches(g, sel);
    g.ruines = lesRuines;
    return g;
  }

  // Ce qu'on voit au-dessus de soi : la geante, enorme, a demi levee
  // derriere l'horizon ; l'etoile ; et Viridia, petite et verte.
  ASTRE.ciel3d = function () {
    return [
      { az: 0.1, haut: 0.7, r: 6, c1: '#ffc890', c2: '#ffffff', halo: true },
      { az: 0.52, haut: 0.36, r: 58, c1: '#b8844a', c2: '#fff0c8', bandes: true, anneau: true, ombre: true },
      { az: 0.86, haut: 0.58, r: 4, c1: '#2f8a4c', c2: '#a8f4e0', ombre: true }
    ];
  };

  // ==========================================================
  //  Ses habitants : chacun son dessin
  // ==========================================================
  var D = V.DESSINS, O = V.ovale, E = V.oeil, BLANC = '#ffffff';
  function L(p, x0, y0, x1, y1, col, ep) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    ep = ep || 1;
    for (var i = 0; i <= n; i++) p(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), ep, ep, col);
  }

  // Un caillou a pattes, avec son propre petit anneau qui lui tourne autour.
  D['grain-orbite'] = function (p, a, b, d) {
    O(p, 20, 17, 8, 7, a); O(p, 18, 15, 4, 3, b); p(23, 19, 3, 2, d); p(15, 20, 2, 2, d);
    E(p, 15, 15);
    L(p, 6, 19, 34, 13, b); L(p, 6, 20, 34, 14, d);
    p(14, 24, 2, 4, d); p(19, 24, 2, 4, d); p(24, 24, 2, 4, d);
  };
  // Une raie plate qui glisse sur la poussiere des anneaux, et sa traine.
  D['glisseur-poussiere'] = function (p, a, b, d) {
    for (var y = -5; y <= 5; y++) { var w = Math.round(15 * (1 - Math.abs(y) / 6)); p(20 - w, 18 + y, w * 2, 1, a); }
    p(8, 17, 22, 1, b); p(30, 17, 8, 1, d); p(36, 16, 2, 3, d);
    E(p, 11, 15); E(p, 11, 20);
    for (var i = 0; i < 4; i++) p(33 + i, 21 + (i % 2), 1, 1, BLANC);
  };
  // Il porte sa reserve de glacons sur le dos, en pyramide.
  D['berger-glacons'] = function (p, a, b, d) {
    O(p, 21, 20, 11, 7, a); O(p, 21, 18, 8, 4, b);
    p(14, 6, 6, 6, '#e8f4ff'); p(20, 5, 6, 7, '#c8e0f0'); p(17, 1, 6, 5, '#ffffff'); p(15, 7, 2, 2, '#a8c8e0');
    p(8, 16, 7, 7, a); E(p, 9, 18); p(7, 21, 3, 1, d);
    p(13, 26, 3, 4, d); p(20, 26, 3, 4, d); p(27, 26, 3, 4, d);
    L(p, 4, 12, 9, 28, '#8a6a4a');
  };
  // Une meduse faite de nuage, qui remonte des profondeurs en pleuvant.
  D['meduse-nuage'] = function (p, a, b, d) {
    O(p, 13, 9, 6, 5, a); O(p, 21, 7, 7, 6, a); O(p, 28, 10, 5, 4, a); p(8, 10, 26, 5, a);
    O(p, 19, 6, 3, 2, b); p(10, 14, 22, 1, d);
    E(p, 16, 11); E(p, 25, 11);
    for (var i = 0; i < 6; i++) { L(p, 11 + i * 4, 15, 10 + i * 4 + (i % 2) * 2, 26, d); p(10 + i * 4 + (i % 2) * 2, 27, 1, 2, '#a8d8ff'); }
  };
  // Un heron gris-dore, juche sur ses pattes fines ; une aureole de
  // poussiere lui tient lieu de crete.
  D['heron-anneau'] = function (p, a, b, d) {
    L(p, 20, 30, 21, 19, d); L(p, 24, 30, 23, 19, d); p(18, 30, 4, 1, d); p(23, 30, 4, 1, d);
    O(p, 23, 16, 7, 4, a); p(26, 14, 8, 2, b);
    L(p, 18, 15, 13, 6, a, 2); O(p, 12, 5, 3, 2, a); E(p, 11, 5);
    L(p, 9, 5, 2, 7, '#e8b83a');
    O(p, 13, 2, 5, 1, '#fff0c0'); p(13, 2, 1, 1, '#00000000');
  };
  // Un papillon de nuit aux ailes de miroir : il boit la lumiere des anneaux.
  D['mangeur-lumiere'] = function (p, a, b, d) {
    O(p, 11, 12, 9, 8, b); O(p, 29, 12, 9, 8, b); O(p, 12, 22, 6, 5, a); O(p, 28, 22, 6, 5, a);
    O(p, 11, 12, 5, 4, '#e8f0ff'); O(p, 29, 12, 5, 4, '#e8f0ff'); p(9, 10, 2, 2, BLANC); p(27, 10, 2, 2, BLANC);
    p(18, 8, 4, 18, d); p(19, 7, 2, 2, d);
    E(p, 18, 9); E(p, 21, 9);
    L(p, 18, 6, 14, 1, d); L(p, 21, 6, 25, 1, d);
  };
  // Une araignee aux longues pattes terminees de glace : elle tend des fils
  // d'un anneau a l'autre.
  D['fileur-orbite'] = function (p, a, b, d) {
    [[4, 26], [9, 30], [31, 30], [36, 26]].forEach(function (q, i) {
      var kx = i < 2 ? 13 : 27;
      L(p, kx, 18, (kx + q[0]) / 2, 9, d); L(p, (kx + q[0]) / 2, 9, q[0], q[1], d);
      p(q[0] - 1, q[1] - 2, 3, 3, '#c8f0ff');
    });
    O(p, 20, 18, 8, 6, a); O(p, 20, 16, 5, 3, b);
    E(p, 16, 17); E(p, 19, 16); E(p, 22, 16); E(p, 25, 17);
    L(p, 20, 24, 20, 31, '#e8f4ff');
  };
  // Un bloc de l'anneau qui s'est mis debout : de la glace et de la roche
  // soudees, un visage pris dedans.
  D['bloc-errant'] = function (p, a, b, d) {
    p(8, 6, 24, 20, a); p(8, 6, 24, 3, b); p(5, 10, 4, 12, a); p(31, 9, 4, 13, a);
    p(12, 3, 8, 4, '#e8f4ff'); p(22, 4, 6, 3, '#c8e0f0');
    p(10, 14, 6, 6, '#e8f4ff'); p(24, 16, 5, 5, '#c8e0f0');
    E(p, 15, 11); E(p, 24, 11); p(14, 19, 12, 2, d); p(16, 18, 2, 1, BLANC); p(22, 18, 2, 1, BLANC);
    p(9, 26, 7, 5, d); p(24, 26, 7, 5, d);
  };

  var vies = [
    ['grain-orbite', 'Grain d’Orbite', 1, '#8a80a8', 0,
      'Un caillou qui a appris à marcher, et qui n’a jamais su s’arrêter de tourner. Il emmène son propre petit anneau partout.'],
    ['glisseur-poussiere', 'Glisseur de Poussière', 1, '#c8b48c', 0,
      'Il ne touche jamais le sol : il glisse sur la poussière fine des anneaux, et laisse derrière lui une traîne qui scintille.'],
    ['berger-glacons', 'Berger des Glaçons', 2, '#7a7090', 0,
      'Il ramasse les glaçons tombés des plaques et les empile sur son dos. Personne ne sait ce qu’il en fait.'],
    ['meduse-nuage', 'Méduse de Nuage', 2, '#f0e0c0', 1,
      'Elle remonte de la mer de nuages, et il pleut sous elle. Ses filaments piquent comme le givre.'],
    ['heron-anneau', 'Héron des Anneaux', 3, '#a8a0b8', 0,
      'Il pêche dans les nuages, au bord des plaques, immobile pendant des jours. Il a une auréole de poussière d’or.'],
    ['mangeur-lumiere', 'Mangeur de Lumière', 3, '#3a3450', 1,
      'Ses ailes renvoient tout : on ne le voit qu’à l’endroit où la lumière disparaît.'],
    ['fileur-orbite', 'Fileur d’Orbites', 4, '#5a5070', 1,
      'Il tend des fils de glace d’un anneau à l’autre. Les plaques tiennent peut-être grâce à lui.'],
    ['bloc-errant', 'Le Bloc Errant', 5, '#6a6080', 1,
      'Un morceau d’anneau qui s’est levé. Il fait le tour de la géante à pied, et il a déjà fait le tour plusieurs fois.']
  ];
  vies.forEach(function (x) {
    V.VIES.push({ id: x[0], astre: 'aurelle', nom: x[1], carrure: 'rampant', palier: x[2],
                  c: V.teintes(x[3]), agressif: !!x[4], texte: x[5],
                  taille: 0.7 + x[2] * 0.14, rarete: x[2] >= 4 ? 'rare' : 'commun' });
  });

  [
    ['glacon-or', 'Glaçon d’Or', 'cristal', '#ffd86a',
      'De la glace qui a pris la couleur de la géante. Elle ne fond pas, même dans la main.'],
    ['geode-orbitale', 'Géode Orbitale', 'geode', '#8a80a8',
      'Une pierre ronde, creuse, avec un petit anneau de cristal qui tourne à l’intérieur.'],
    ['sonde-perdue', 'Sonde Perdue', 'epave', '#b8885a',
      'Une sonde en cuivre, bien plus vieille que le Téléportail. Son objectif est tourné vers Viridia.'],
    ['balise-astronome', 'Balise de l’Astronome', 'balise', '#c87a3a',
      'Elle clignote toujours vers le même point du ciel. Quelqu’un attendait qu’on vienne.']
  ].forEach(function (x) {
    V.OBJETS.push({ id: x[0], astre: 'aurelle', nom: x[1], forme: x[2], c: V.teintes(x[3]), texte: x[4], objet: true });
  });

  // Le lieu remarquable : un observatoire de cuivre, renverse sur le bord
  // d'une plaque, sa coupole fendue tournee vers le vide.
  V.CURIO_DESSINS.observatoire = function (p, a, b, d) {
    p(4, 24, 32, 5, '#5a5070'); p(4, 24, 32, 1, '#8a80a8');
    p(10, 14, 20, 10, a); p(10, 14, 20, 2, b); p(13, 17, 3, 5, d); p(24, 17, 3, 5, d);
    O(p, 20, 13, 10, 7, b); p(10, 13, 21, 2, a); p(19, 6, 3, 8, d);
    L(p, 21, 9, 33, 2, d, 2); p(33, 1, 3, 3, '#a8e0ff');
    p(17, 19, 6, 5, '#1a1420');
  };
  V.CURIOSITES.push({ id: 'observatoire-renverse', astre: 'aurelle', nom: 'L’Observatoire Renversé',
    forme: 'observatoire', c: ['#b8885a', '#e8c890', '#4a2a10'],
    texte: 'Une coupole de cuivre, couchée au bord du vide. La lunette pointe encore vers Viridia, ' +
           'et dans le registre resté ouvert, la dernière ligne dit : « Quelqu’un finira par regarder par ici. »' });

  // ==========================================================
  //  Son gardien
  // ==========================================================
  if (B && B.definir && B.arene) {
    var ovale = B.ovale, sourcil = B.sourcil;
    var G = {
      id: 'veilleur-anneaux', astre: 'aurelle', rang: 19,
      nom: 'Le Veilleur des Anneaux',
      c: ['#5a5070', '#c87a3a', '#ffd86a'],
      texte: 'Une silhouette de roche et de glace, drapée dans la poussière des anneaux, ' +
             'avec une lunette de cuivre à la place d’un œil. Elle regarde Viridia depuis toujours. ' +
             'Elle n’aime pas qu’on la regarde en retour.',
      pv: 80000, cadence: [2180, 1580, 1080], coup: [26, 34, 42],
      prepare: 765, etourdi: 815, interrompre: 6, xp: 4300,
      recompense: { roches: 400, credit: ['pink', 5] },
      corps: { rx: 56, ry: 46, dy: 0 },
      faibles: [{ x: 98, y: 40, r: 9 }, { x: 52, y: 42, r: 7 }, { x: 75, y: 10, r: 8 }],
      gorge: { x: 75, y: 78, r: 11 },
      dessiner: function (p, ouverte) {
        var i;
        // La cape de poussiere, en anneaux superposes.
        for (i = 0; i < 5; i++) ovale(p, 75, 96 - i * 6, 58 - i * 4, 14, i % 2 ? '#7a7090' : '#5a5070');
        ovale(p, 75, 56, 50, 40, '#5a5070');
        ovale(p, 75, 46, 42, 26, '#8a80a8');
        // La glace prise dans la roche.
        p(36, 50, 10, 14, '#c8e0f0'); p(104, 54, 8, 12, '#e8f4ff'); p(60, 22, 8, 6, '#e8f4ff');
        // La couronne : un anneau dore au-dessus de la tete.
        for (i = 0; i < 24; i++) {
          var an = i / 24 * Math.PI * 2;
          p(Math.round(75 + Math.cos(an) * 30), Math.round(10 + Math.sin(an) * 6), 3, 2, i % 3 ? '#ffd86a' : '#fff6c8');
        }
        // L'oeil gauche, de roche, et l'autre : une lunette de cuivre.
        ovale(p, 52, 42, 8, 6, '#1a1420'); ovale(p, 52, 42, 5, 3, '#ffd86a'); p(51, 41, 2, 2, '#ffffff');
        sourcil(p, 52, 40, -1, '#2a2438', 1.1);
        p(88, 36, 30, 10, '#c87a3a'); p(88, 36, 30, 2, '#ffd8a8'); p(116, 34, 6, 14, '#8a4a1a');
        ovale(p, 98, 41, 9, 9, '#8a4a1a'); ovale(p, 98, 41, 7, 7, '#1a2438'); ovale(p, 98, 41, 4, 4, '#5aa8d8'); p(95, 38, 2, 2, '#ffffff');
        if (!ouverte) {
          p(56, 76, 38, 3, '#2a2438');
          for (i = 0; i < 6; i++) p(58 + i * 6, 79, 2, 3, '#c8e0f0');
        } else {
          ovale(p, 75, 78, 26, 14, '#0a0814');
          ovale(p, 75, 82, 16, 6, '#ffd86a'); ovale(p, 75, 83, 8, 3, '#fff6c8');
          for (i = 0; i < 8; i++) {
            p(54 + i * 6, 66, 3, 7 - (i % 2) * 2, '#e8f4ff');
            p(56 + i * 6, 89, 3, 5 - (i % 2) * 2, '#e8f4ff');
          }
        }
      },
      arene: {
        ciel: ['#05030c', '#3a2448'], sol: ['#8a7a5a', '#b8a47c'], lueur: '#ffd86a', etoiles: true,
        decor: function (ctx, t, W) {
          // La geante, enorme, et ses anneaux qui traversent tout le ciel.
          var g = ctx.createRadialGradient(W * 0.32, 40, 20, W * 0.4, 90, 170);
          g.addColorStop(0, '#fff0c8'); g.addColorStop(0.5, '#d8a860'); g.addColorStop(1, '#7a4a2a');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(W * 0.4, 110, 150, Math.PI, 0); ctx.fill();
          ctx.fillStyle = 'rgba(90,50,30,.35)';
          for (var i = 0; i < 6; i++) ctx.fillRect(W * 0.4 - 150, 20 + i * 16, 300, 4);
          ctx.strokeStyle = 'rgba(255,240,200,.55)';
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.ellipse(W * 0.4, 112, 260, 34, -0.08, Math.PI, Math.PI * 2); ctx.stroke();
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(W * 0.4, 112, 230, 28, -0.08, Math.PI, Math.PI * 2); ctx.stroke();
          // La poussiere qui derive.
          ctx.fillStyle = 'rgba(255,230,170,.7)';
          for (i = 0; i < 30; i++) ctx.fillRect(((t / 30 + i * 53) % (W + 20)) - 10, 60 + (i * 37) % 80, 1, 1);
        }
      },
      textes: {
        victoire: 'LE VEILLEUR A FERMÉ L’ŒIL',
        recit: 'Sa lunette se fend, et pour la première fois depuis toujours, il baisse la tête. Dessous, Viridia continue de tourner, sans savoir qu’on la regardait.',
        echec: 'Le Téléportail t’a tiré des anneaux. Le Veilleur a déjà repris sa garde, l’œil collé à sa lunette.',
        reveil: 'La poussière se soulève en anneaux autour de toi. Un œil de cuivre pivote, et se pose sur toi…',
        indice: 'Une silhouette immobile au bord d’une plaque, tournée vers Viridia. Elle ne regarde pas encore par ici.'
      }
    };
    G.fond = B.arene(G.arene);
    B.definir(G);
    V.MONSTRES.push({ id: G.id, astre: G.astre, nom: G.nom, boss: true, carrure: 'colosse', palier: 6, c: G.c, texte: G.texte });
  }

  window.ODYANNEAUX = { ASTRE: ASTRE };
})();
