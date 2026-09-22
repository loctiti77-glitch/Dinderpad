// Les gardiens des planetes : un par monde, du plus faible (Mercure) au
// plus redoutable (Neptune). Le Selenophage, sur la Lune, se place entre
// la Terre et Mars.
//
// Chaque gardien dort dans un repaire, quelque part sur sa carte, et ne
// se reveille que si l'on s'en approche arme. On ne le bat qu'une fois ;
// il entre alors au carnet du scanner.
//
// Les reglages suivent la puissance du pistolet de l'Odyssee : chaque
// gardien demande, pour un tireur correct, un cran de plus que le
// precedent (Mk II pour Mercure, jusqu'au Mk X pour Neptune).
(function () {
  var B = window.BOSS, V = window.ODYVIE;
  if (!B || !V) return;

  var ovale = B.ovale;

  // Un sourcil fronce au-dessus d'un oeil : haut a l'exterieur, bas vers
  // le centre du visage. cote vaut -1 pour l'oeil gauche, 1 pour le droit.
  function sourcil(p, cx, cy, cote, col, e) {
    e = e || 1;
    for (var i = 0; i <= 10; i++) {
      var u = i / 10;
      p(Math.round(cx + cote * (9 - u * 15) * e), Math.round(cy - (10 - u * 5) * e), 3, 3, col);
    }
  }

  // Un oeil rouge qui luit, avec son halo.
  function oeilRouge(p, cx, cy, r) {
    ovale(p, cx, cy, r + 2, r + 1, '#1a0404');
    ovale(p, cx, cy, r, r - 1, '#c81e14');
    ovale(p, cx, cy, Math.max(1, r - 2), Math.max(1, r - 3), '#ff5a3a');
    p(cx - 1, cy - 1, 2, 2, '#ffe0c0');
  }

  // ==========================================================
  //  Les decors
  // ==========================================================
  // Un ciel, un sol, et au centre l'antre d'ou sort le gardien. Chaque
  // monde y ajoute ce qui le distingue.

  function arene(o) {
    return function (ctx, t, W, H) {
      var g = ctx.createLinearGradient(0, 0, 0, 160);
      g.addColorStop(0, o.ciel[0]);
      g.addColorStop(1, o.ciel[1]);
      ctx.fillStyle = g;
      ctx.fillRect(-10, -10, W + 20, 175);
      var i;
      if (o.etoiles) {
        ctx.fillStyle = 'rgba(234,247,255,.75)';
        for (i = 0; i < 60; i++) {
          ctx.fillRect((i * 97) % W, (i * 41) % 140, i % 7 ? 1 : 2, i % 7 ? 1 : 2);
        }
      }
      if (o.decor) o.decor(ctx, B.reduit ? 0 : t, W, H);
      ctx.fillStyle = o.sol[0];
      ctx.fillRect(-10, 150, W + 20, H - 140);
      ctx.fillStyle = o.sol[1];
      for (i = 0; i < 12; i++) ctx.fillRect(i * 44, 144 + (i % 3) * 6, 40, 10);
      if (o.sol2) o.sol2(ctx, W, H);
      // L'antre, et la lueur de son bord.
      ctx.fillStyle = o.lueur;
      ctx.beginPath(); ctx.ellipse(W / 2, 252, 180, 118, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#07070a';
      ctx.beginPath(); ctx.ellipse(W / 2, 250, 170, 110, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(W / 2 - 170, 250, 340, 70);
    };
  }

  // ==========================================================
  //  Les huit gardiens
  // ==========================================================

  var LISTE = [

    // ---------- 1. Mercure ----------
    {
      id: 'salamandre-zinc', astre: 'mercure', rang: 1,
      nom: 'La Salamandre de Zinc',
      c: ['#8a8580', '#b5aea6', '#ff7a1e'],
      texte: 'Une salamandre de métal en fusion, grande comme un immeuble. ' +
             'Elle dort sous la croûte le jour et remonte boire la chaleur ' +
             'quand le Soleil frappe. Sa crête coule encore.',
      pv: 400, cadence: [3600, 3000, 2400], coup: [8, 10, 13],
      prepare: 1200, etourdi: 1300, interrompre: 2, xp: 100,
      recompense: { roches: 10, credit: ['green', 5] },
      corps: { rx: 50, ry: 36, dy: 4 },
      faibles: [{ x: 50, y: 52, r: 8 }, { x: 100, y: 52, r: 8 }, { x: 75, y: 20, r: 8 }],
      gorge: { x: 75, y: 82, r: 10 },
      dessiner: function (p, ouverte) {
        var i;
        ovale(p, 75, 100, 34, 14, '#5a5652');
        ovale(p, 75, 60, 50, 32, '#8a8580');
        ovale(p, 75, 50, 42, 20, '#b5aea6');
        // La crete : du metal qui coule.
        for (i = 0; i < 7; i++) {
          var h = 16 + (i % 2) * 6;
          p(36 + i * 12, 30 - h, 6, h, '#ff7a1e');
          p(36 + i * 12, 30 - h, 6, 4, '#ffd23a');
        }
        // Les fissures qui luisent.
        p(40, 62, 14, 2, '#ff7a1e'); p(52, 64, 2, 6, '#ff7a1e');
        p(96, 62, 14, 2, '#ff7a1e'); p(96, 64, 2, 6, '#ff7a1e');
        // Les yeux, fendus.
        [50, 100].forEach(function (x, k) {
          ovale(p, x, 52, 7, 5, '#1a0a0a');
          ovale(p, x, 52, 5, 4, '#ff4a14');
          ovale(p, x, 52, 3, 2, '#ffcf3a');
          p(x - 1, 47, 2, 10, '#1a0a0a');
          sourcil(p, x, 52, k ? 1 : -1, '#4a4440');
        });
        if (!ouverte) {
          p(45, 76, 60, 3, '#3a2a20');
          p(66, 68, 3, 2, '#3a2a20'); p(81, 68, 3, 2, '#3a2a20');
        } else {
          ovale(p, 75, 82, 28, 14, '#2a0a04');
          ovale(p, 75, 84, 20, 9, '#ff5a14');
          ovale(p, 75, 85, 10, 4, '#ffd23a');
          for (i = 0; i < 8; i++) {
            p(52 + i * 6, 70, 3, 5, '#e8e2d8');
            p(54 + i * 6, 91, 3, 4, '#e8e2d8');
          }
        }
      },
      arene: {
        ciel: ['#2a1a10', '#7a3a1a'], sol: ['#6a6560', '#7e7872'], lueur: '#ff7a1e',
        decor: function (ctx, t, W) {
          var g = ctx.createRadialGradient(W / 2, 150, 20, W / 2, 150, 190);
          g.addColorStop(0, 'rgba(255,220,120,.95)');
          g.addColorStop(0.4, 'rgba(255,150,40,.7)');
          g.addColorStop(1, 'rgba(255,90,20,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(W / 2, 150, 190, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#ffd87a';
          ctx.beginPath(); ctx.arc(W / 2, 150, 70, Math.PI, 0); ctx.fill();
        }
      },
      textes: {
        victoire: 'LA SALAMANDRE S’EST FIGÉE',
        recit: 'Son métal refroidit d’un coup et se fend. Il n’en reste qu’une statue de zinc, tournée vers le Soleil.',
        echec: 'Le Téléportail t’a tiré de la fournaise. La Salamandre s’est rendormie dans sa coulée.',
        reveil: 'La roche fond sous tes pieds. Quelque chose remonte de la coulée…',
        indice: 'Le sol est encore chaud, creusé de coulées. Quelque chose dort dessous.'
      }
    },

    // ---------- 2. Venus ----------
    {
      id: 'reine-soufree', astre: 'venus', rang: 2,
      nom: 'La Reine Soufrée',
      c: ['#c9b53a', '#e8dc6a', '#7ae84a'],
      texte: 'Une méduse géante qui flotte dans l’acide comme dans de l’eau. ' +
             'Les nuages de Vénus sont peut-être son souffle. Ses nodules ' +
             'verts concentrent assez d’acide pour percer une coque.',
      pv: 1000, cadence: [3400, 2800, 2200], coup: [11, 14, 18],
      prepare: 1100, etourdi: 1200, interrompre: 2, xp: 160,
      recompense: { roches: 18, credit: ['blue', 3] },
      corps: { rx: 56, ry: 40, dy: -8 },
      faibles: [{ x: 48, y: 36, r: 8 }, { x: 75, y: 24, r: 8 }, { x: 102, y: 36, r: 8 }],
      gorge: { x: 75, y: 68, r: 9 },
      dessiner: function (p, ouverte) {
        var i, j;
        // Les tentacules, sous la cloche.
        for (i = 0; i < 9; i++) {
          var x = 30 + i * 11;
          for (j = 0; j < 11; j++) {
            p(x + Math.round(Math.sin(j / 3 + i) * 3), 78 + j * 3, 4, 3, i % 2 ? '#a8962a' : '#c9b53a');
          }
        }
        ovale(p, 75, 46, 56, 34, '#c9b53a');
        ovale(p, 75, 40, 46, 24, '#e8dc6a');
        for (i = 0; i < 8; i++) ovale(p, 26 + i * 14, 76, 8, 5, '#a8962a');
        // Les nodules d'acide.
        [[48, 36], [75, 24], [102, 36]].forEach(function (n) {
          ovale(p, n[0], n[1], 7, 7, '#4aa82a');
          ovale(p, n[0], n[1], 4, 4, '#7ae84a');
          p(n[0] - 2, n[1] - 3, 2, 2, '#d8ffb0');
        });
        [58, 92].forEach(function (x, k) {
          oeilRouge(p, x, 58, 5);
          sourcil(p, x, 58, k ? 1 : -1, '#7a6a1a', 0.8);
        });
        if (!ouverte) {
          p(64, 67, 22, 2, '#3a3208');
          p(64, 65, 2, 2, '#3a3208'); p(84, 65, 2, 2, '#3a3208');
        } else {
          ovale(p, 75, 68, 16, 10, '#2a2404');
          ovale(p, 75, 70, 10, 6, '#8aff4a');
          ovale(p, 75, 71, 5, 3, '#e0ffc0');
        }
      },
      arene: {
        ciel: ['#8a7a2a', '#d8c05a'], sol: ['#8a6a2a', '#a8843a'], lueur: '#8aff4a',
        decor: function (ctx, t, W) {
          for (var i = 0; i < 7; i++) {
            var x = ((i * 90 + t / 60) % (W + 160)) - 80;
            ctx.fillStyle = 'rgba(240,230,140,.45)';
            ctx.beginPath(); ctx.ellipse(x, 30 + (i % 3) * 30, 70, 16, 0, 0, 6.3); ctx.fill();
          }
        }
      },
      textes: {
        victoire: 'LA REINE SOUFRÉE S’EST DISSOUTE',
        recit: 'Sa cloche se crève et l’acide retombe en pluie jaune. Le ciel de Vénus, pour une fois, s’éclaircit.',
        echec: 'Le Téléportail t’a arraché aux vapeurs. La Reine flotte toujours au-dessus de son puits.',
        reveil: 'Les vapeurs s’épaississent. Quelque chose d’immense monte du puits…',
        indice: 'L’air pique les yeux ici. Un puits d’acide respire, tout près.'
      }
    },

    // ---------- 3. Terre ----------
    {
      id: 'colosse-verger', astre: 'terre', rang: 3,
      nom: 'Le Colosse du Verger',
      c: ['#6b4a2b', '#3f7a2e', '#ffe36a'],
      texte: 'La terre du jardin, levée d’un bloc et tenue par les racines. ' +
             'Il dormait sous le verger bien avant la maison. La comète l’a ' +
             'réveillé, et il n’aime pas qu’on marche sur ses pommes.',
      pv: 1800, cadence: [3300, 2600, 2000], coup: [12, 16, 20],
      prepare: 1050, etourdi: 1150, interrompre: 3, xp: 250,
      recompense: { roches: 28, credit: ['gold', 2] },
      corps: { rx: 48, ry: 40, dy: 0 },
      faibles: [{ x: 58, y: 52, r: 8 }, { x: 92, y: 52, r: 8 }, { x: 75, y: 24, r: 8 }],
      gorge: { x: 75, y: 78, r: 10 },
      dessiner: function (p, ouverte) {
        var i;
        ovale(p, 75, 98, 64, 16, '#5a3d22');
        // Les racines qui pendent des joues.
        for (i = 0; i < 12; i++) {
          p(28 - Math.round(i / 3), 54 + i * 3, 4, 3, '#4a3018');
          p(118 + Math.round(i / 3), 54 + i * 3, 4, 3, '#4a3018');
        }
        ovale(p, 75, 56, 46, 38, '#6b4a2b');
        ovale(p, 75, 60, 38, 28, '#7a5634');
        ovale(p, 75, 28, 40, 14, '#3f7a2e');
        for (i = 0; i < 9; i++) p(40 + i * 8, 12 + (i % 3) * 2, 3, 6, '#5aa03e');
        [[55, 24], [68, 18], [92, 25], [80, 30]].forEach(function (a) {
          ovale(p, a[0], a[1], 3, 3, '#d8342a');
          p(a[0], a[1] - 4, 1, 2, '#2a1a0c');
        });
        ovale(p, 46, 74, 6, 4, '#8a8a82');
        ovale(p, 104, 70, 5, 4, '#8a8a82');
        [58, 92].forEach(function (x, k) {
          ovale(p, x, 52, 8, 7, '#140c06');
          ovale(p, x, 53, 4, 3, '#ff9a2a');
          p(x - 1, 52, 2, 2, '#ffe36a');
          sourcil(p, x, 52, k ? 1 : -1, '#3a2410');
        });
        if (!ouverte) {
          p(58, 78, 34, 3, '#2a1a0c');
        } else {
          ovale(p, 75, 78, 22, 12, '#1a0e06');
          for (i = 0; i < 6; i++) {
            p(59 + i * 6, 68, 3, 6, '#8a6a40');
            p(61 + i * 6, 85, 3, 5, '#8a6a40');
          }
        }
      },
      arene: {
        ciel: ['#050a1c', '#10224a'], sol: ['#1f3a1a', '#2a4a22'], lueur: '#ffe36a', etoiles: true,
        decor: function (ctx, t, W) {
          ctx.fillStyle = '#f4f0d8';
          ctx.beginPath(); ctx.arc(70, 44, 18, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#10224a';
          ctx.beginPath(); ctx.arc(78, 40, 16, 0, 6.3); ctx.fill();
          // La maison, au loin, et la clotûre.
          ctx.fillStyle = '#0a0f1c';
          ctx.fillRect(360, 96, 70, 54);
          ctx.beginPath(); ctx.moveTo(352, 98); ctx.lineTo(395, 66); ctx.lineTo(438, 98); ctx.fill();
          ctx.fillStyle = '#ffd87a';
          ctx.fillRect(376, 112, 12, 12); ctx.fillRect(404, 112, 12, 12);
          ctx.fillStyle = '#1a2436';
          for (var i = 0; i < 16; i++) ctx.fillRect(i * 30, 128, 5, 22);
          ctx.fillRect(0, 134, W, 4);
        }
      },
      textes: {
        victoire: 'LE COLOSSE RETOURNE À LA TERRE',
        recit: 'Ses racines lâchent, et il s’effondre en un tas de bonne terre. Au printemps, le verger donnera plus que jamais.',
        echec: 'Le Téléportail t’a ramené dans ta chambre. Dans le jardin, la terre bouge encore.',
        reveil: 'Les arbres du verger se penchent. Le sol se soulève…',
        indice: 'La terre est retournée, comme labourée de l’intérieur. Ça respire, là-dessous.'
      }
    },

    // ---------- 4. Mars ----------
    {
      id: 'behemoth-rouille', astre: 'mars', rang: 4,
      nom: 'Le Béhémoth de Rouille',
      c: ['#8a3a1e', '#b0522a', '#ff7a2e'],
      texte: 'Moitié crabe, moitié machine : on ne sait plus lequel a mangé ' +
             'l’autre. Sa carapace est faite de coques de sondes. Il garde ' +
             'le fond d’un canyon comme on garde un trésor.',
      pv: 4500, cadence: [3000, 2400, 1800], coup: [16, 21, 27],
      prepare: 1000, etourdi: 1100, interrompre: 3, xp: 550,
      recompense: { roches: 55, credit: ['gold', 3] },
      corps: { rx: 58, ry: 32, dy: 8 },
      faibles: [{ x: 62, y: 20, r: 7 }, { x: 88, y: 20, r: 7 }, { x: 34, y: 58, r: 7 }, { x: 116, y: 58, r: 7 }],
      gorge: { x: 75, y: 80, r: 9 },
      dessiner: function (p, ouverte) {
        var i;
        for (i = 0; i < 4; i++) {
          p(34 + i * 9, 86, 4, 24, '#6a2a14');
          p(112 - i * 9, 86, 4, 24, '#6a2a14');
        }
        // Les pinces.
        [[20, 1], [130, -1]].forEach(function (c) {
          for (i = 0; i < 6; i++) p(c[0] + c[1] * (8 + i * 2) - 3, 56 + i, 6, 5, '#7a3218');
          ovale(p, c[0], 44, 15, 11, '#9a4422');
          ovale(p, c[0] - c[1] * 6, 33, 10, 5, '#b0522a');
          ovale(p, c[0] - c[1] * 6, 55, 10, 5, '#b0522a');
        });
        ovale(p, 75, 66, 58, 30, '#8a3a1e');
        ovale(p, 75, 58, 50, 20, '#b0522a');
        for (i = 0; i < 9; i++) p(35 + i * 10, 52, 3, 3, '#d88a5a');
        for (i = 0; i < 7; i++) {
          var hp = 6 + (i % 2) * 4;
          p(36 + i * 13, 40 - hp, 4, hp, '#5a2210');
          p(37 + i * 13, 40 - hp, 2, 2, '#d88a5a');
        }
        p(40, 64, 70, 2, '#6a2a14');
        [62, 88].forEach(function (x) {
          p(x - 2, 22, 4, 20, '#7a3218');
          ovale(p, x, 20, 6, 6, '#f2e6c8');
          p(x - 5, 18, 3, 1, '#c81e14'); p(x + 3, 22, 3, 1, '#c81e14');
          ovale(p, x, 20, 3, 3, '#c81e14');
          p(x, 20, 1, 1, '#1a0a0a');
        });
        if (!ouverte) {
          p(62, 76, 26, 4, '#4a1a0a');
        } else {
          ovale(p, 75, 80, 18, 10, '#2a0804');
          ovale(p, 75, 82, 10, 5, '#ff7a2e');
          for (i = 0; i < 5; i++) p(64 + i * 5, 72, 2, 5, '#d8c8b0');
        }
      },
      arene: {
        ciel: ['#c8703a', '#e8a870'], sol: ['#9a3a1a', '#b04a24'], lueur: '#ff7a2e',
        decor: function (ctx, t, W) {
          ctx.fillStyle = '#6a4a3a';
          ctx.beginPath(); ctx.arc(390, 40, 9, 0, 6.3); ctx.fill();
          ctx.beginPath(); ctx.arc(430, 64, 5, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#b8603a';
          for (var i = 0; i < 5; i++) {
            ctx.beginPath(); ctx.ellipse(i * 120, 150, 110, 30, 0, Math.PI, 0); ctx.fill();
          }
        }
      },
      textes: {
        victoire: 'LE BÉHÉMOTH S’EST DÉMANTIBULÉ',
        recit: 'Ses pinces retombent, sa carapace s’ouvre en plaques de tôle. Dedans, des morceaux de sondes vieilles de cinquante ans.',
        echec: 'Le Téléportail t’a tiré du canyon. Le Béhémoth a repris sa garde.',
        reveil: 'Un grincement de métal monte du canyon. Le sable glisse…',
        indice: 'Des débris de sondes jonchent le sable, tordus comme par des pinces.'
      }
    },

    // ---------- 5. Jupiter ----------
    {
      id: 'oeil-tempete', astre: 'jupiter', rang: 5,
      nom: 'L’Œil de la Tempête',
      c: ['#c8905a', '#e8c89a', '#c8282a'],
      texte: 'Une tempête qui a ouvert un œil. Elle tourne sur elle-même ' +
             'depuis des siècles, et ses éclairs se ramassent en trois ' +
             'nœuds qu’elle lance comme des bras.',
      pv: 7500, cadence: [2900, 2300, 1700], coup: [18, 24, 30],
      prepare: 950, etourdi: 1050, interrompre: 4, xp: 700,
      recompense: { roches: 75, credit: ['pink', 1] },
      corps: { rx: 62, ry: 44, dy: 0 },
      faibles: [{ x: 14, y: 44, r: 7 }, { x: 136, y: 44, r: 7 }, { x: 75, y: 12, r: 7 }],
      gorge: { x: 75, y: 56, r: 11 },
      dessiner: function (p, ouverte) {
        var i;
        ovale(p, 75, 58, 64, 44, '#c8905a');
        for (i = 0; i < 6; i++) {
          ovale(p, 75, 24 + i * 12, Math.round(60 - Math.abs(i - 2.5) * 8), 5, i % 2 ? '#e8c89a' : '#a86a3a');
        }
        ovale(p, 75, 56, 30, 22, '#b0552a');
        ovale(p, 75, 56, 22, 16, '#d8703a');
        // Les bras d'eclairs et leurs noeuds.
        for (i = 0; i < 6; i++) {
          p(14 + i * 4, 40 + (i % 2) * 6, 4, 3, '#ffe84a');
          p(132 - i * 4, 40 + (i % 2) * 6, 4, 3, '#ffe84a');
          p(74 + (i % 2) * 3, 12 + i * 3, 3, 3, '#ffe84a');
        }
        [[14, 44], [136, 44], [75, 12]].forEach(function (n) {
          ovale(p, n[0], n[1], 5, 5, '#fff6a8');
        });
        ovale(p, 75, 56, 14, 11, '#f8f2e0');
        ovale(p, 75, 56, 8, 8, '#c8282a');
        ovale(p, 75, 56, 3, 6, '#1a0404');
        if (!ouverte) {
          // La paupiere, a demi baissee.
          ovale(p, 75, 50, 16, 8, '#b0552a');
          p(60, 54, 30, 2, '#6a2a14');
        } else {
          p(59, 43, 32, 2, '#ffe84a');
          p(59, 68, 32, 2, '#ffe84a');
        }
      },
      arene: {
        ciel: ['#8a5a34', '#e2b48a'], sol: ['#6a4a2a', '#8a6a44'], lueur: '#ffe84a',
        decor: function (ctx, t, W) {
          for (var i = 0; i < 8; i++) {
            ctx.fillStyle = i % 2 ? 'rgba(255,230,190,.25)' : 'rgba(120,60,20,.25)';
            ctx.fillRect(-10, i * 19 + Math.sin(t / 900 + i) * 3, W + 20, 10);
          }
          if (Math.floor(t / 1700) % 3 === 0 && (t % 1700) < 120) {
            ctx.fillStyle = 'rgba(255,250,210,.5)';
            ctx.fillRect(-10, -10, W + 20, 170);
          }
        }
      },
      textes: {
        victoire: 'L’ŒIL S’EST FERMÉ',
        recit: 'La tempête perd sa forme, s’étire, et se défait en vent ordinaire. Pour la première fois, Jupiter a l’air calme.',
        echec: 'Le Téléportail t’a tiré du tourbillon. L’Œil ne dort que d’un œil.',
        reveil: 'Le vent tourne, de plus en plus vite. Un œil s’ouvre dans les nuages…',
        indice: 'Les nuages tournent en rond ici, lentement, comme autour d’un regard.'
      }
    },

    // ---------- 6. Saturne ----------
    {
      id: 'roi-anneaux', astre: 'saturne', rang: 6,
      nom: 'Le Roi des Anneaux',
      c: ['#8a78b0', '#d8c9a0', '#ff4ad8'],
      texte: 'Un serpent de cristal couronné, qui porte un anneau comme ' +
             'on porte une cape. On dit que les anneaux de Saturne sont ses ' +
             'mues. Chaque joyau de sa couronne est une lune avalée.',
      pv: 11000, cadence: [2800, 2200, 1600], coup: [17, 23, 29],
      prepare: 950, etourdi: 1000, interrompre: 4, xp: 900,
      recompense: { roches: 95, credit: ['pink', 1] },
      corps: { rx: 44, ry: 48, dy: 0 },
      faibles: [{ x: 55, y: 14, r: 7 }, { x: 75, y: 8, r: 7 }, { x: 95, y: 14, r: 7 }, { x: 75, y: 66, r: 7 }],
      gorge: { x: 75, y: 52, r: 8 },
      dessiner: function (p, ouverte) {
        var i;
        ovale(p, 75, 98, 58, 14, '#6a5a8a');
        ovale(p, 75, 86, 46, 12, '#8a78b0');
        p(58, 48, 34, 44, '#7a68a0');
        p(62, 48, 6, 44, '#9a88c0');
        // L'anneau, qui passe devant le cou.
        for (i = 0; i <= 40; i++) {
          var a = i / 40 * Math.PI;
          p(Math.round(75 + Math.cos(a) * 68) - 2, Math.round(72 + Math.sin(a) * 10) - 2, 5, 4, i % 4 ? '#d8c9a0' : '#f4ead0');
        }
        ovale(p, 75, 66, 7, 7, '#ff4ad8');
        ovale(p, 75, 66, 3, 3, '#ffd0f4');
        ovale(p, 75, 36, 32, 22, '#8a78b0');
        ovale(p, 75, 46, 20, 10, '#a898c8');
        for (i = 0; i < 5; i++) {
          var h = 16 - Math.abs(i - 2) * 4;
          p(49 + i * 12, 20 - h, 6, h, '#c8b8ff');
          p(49 + i * 12, 20 - h, 6, 2, '#ffffff');
        }
        [[55, 14], [75, 8], [95, 14]].forEach(function (j) {
          ovale(p, j[0], j[1], 4, 4, '#ffe36a');
          p(j[0] - 1, j[1] - 2, 1, 1, '#fff6cf');
        });
        [62, 88].forEach(function (x, k) {
          ovale(p, x, 34, 5, 4, '#1a0a2a');
          ovale(p, x, 34, 3, 3, '#ff4ad8');
          p(x, 31, 1, 6, '#1a0a2a');
          sourcil(p, x, 35, k ? 1 : -1, '#4a3a6a', 0.8);
        });
        if (!ouverte) {
          p(66, 50, 18, 2, '#2a1a3a');
        } else {
          ovale(p, 75, 52, 14, 8, '#1a0a24');
          p(68, 45, 2, 7, '#ffffff'); p(80, 45, 2, 7, '#ffffff');
          ovale(p, 75, 54, 6, 3, '#ff4ad8');
        }
      },
      arene: {
        ciel: ['#140e24', '#3a2a5a'], sol: ['#4a3e6a', '#5a4e7e'], lueur: '#ff4ad8', etoiles: true,
        decor: function (ctx, t, W) {
          ctx.fillStyle = '#d8c090';
          ctx.beginPath(); ctx.arc(380, 60, 34, 0, 6.3); ctx.fill();
          ctx.strokeStyle = 'rgba(240,220,170,.8)';
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.ellipse(380, 60, 70, 14, -0.25, 0, 6.3); ctx.stroke();
          ctx.strokeStyle = 'rgba(216,201,160,.35)';
          ctx.lineWidth = 10;
          ctx.beginPath(); ctx.ellipse(W / 2, 170, 400, 60, 0, Math.PI, 0); ctx.stroke();
        }
      },
      textes: {
        victoire: 'LE ROI A PERDU SA COURONNE',
        recit: 'Sa couronne se brise en éclats de cristal qui s’envolent rejoindre les anneaux. Il n’en reste qu’une mue vide.',
        echec: 'Le Téléportail t’a arraché à son étreinte. Le Roi remonte sur son trône de glace.',
        reveil: 'Les cristaux se mettent à chanter. Un anneau se soulève du sol…',
        indice: 'Des éclats de cristal forment un cercle parfait. Quelqu’un règne ici.'
      }
    },

    // ---------- 7. Uranus ----------
    {
      id: 'titan-glace', astre: 'uranus', rang: 7,
      nom: 'Le Titan de Glace',
      c: ['#9fd8e0', '#c8f0f4', '#6ff2ff'],
      texte: 'Un visage de glace plus vieux que le système solaire, pris ' +
             'dans le manteau d’Uranus. Il a tout vu basculer, la planète ' +
             'et ses lunes. Ses cornes sont les deux seuls points tièdes.',
      pv: 16000, cadence: [2700, 2100, 1500], coup: [18, 24, 30],
      prepare: 900, etourdi: 1000, interrompre: 4, xp: 1100,
      recompense: { roches: 120, credit: ['pink', 2] },
      corps: { rx: 48, ry: 42, dy: 2 },
      faibles: [{ x: 16, y: 8, r: 7 }, { x: 134, y: 8, r: 7 }, { x: 58, y: 50, r: 7 }, { x: 92, y: 50, r: 7 }],
      gorge: { x: 75, y: 76, r: 10 },
      dessiner: function (p, ouverte) {
        var i;
        // Les cornes, qui montent en s'evasant.
        for (i = 0; i < 10; i++) {
          p(Math.round(32 - i * 1.6), Math.round(32 - i * 2.5), 6, 4, i > 7 ? '#ffffff' : '#6ff2ff');
          p(Math.round(112 + i * 1.6), Math.round(32 - i * 2.5), 6, 4, i > 7 ? '#ffffff' : '#6ff2ff');
        }
        ovale(p, 75, 58, 48, 40, '#9fd8e0');
        ovale(p, 75, 48, 40, 26, '#c8f0f4');
        p(50, 36, 2, 18, '#6ab0c0'); p(98, 30, 2, 22, '#6ab0c0'); p(70, 22, 2, 12, '#6ab0c0');
        for (i = 0; i < 18; i++) {
          p(38 + i * 2, 38 + Math.round(i / 3), 3, 5, '#5a98a8');
          p(110 - i * 2, 38 + Math.round(i / 3), 3, 5, '#5a98a8');
        }
        for (i = 0; i < 7; i++) p(46 + i * 9, 88, 4, 12 + (i % 3) * 6, '#c8f0f4');
        [58, 92].forEach(function (x) {
          ovale(p, x, 50, 7, 4, '#0a2a3a');
          ovale(p, x, 50, 4, 2, '#6ff2ff');
          p(x - 1, 49, 2, 2, '#ffffff');
        });
        if (!ouverte) {
          p(60, 74, 30, 3, '#4a8a9a');
        } else {
          ovale(p, 75, 76, 20, 11, '#0a2030');
          ovale(p, 75, 78, 12, 6, '#6ff2ff');
          for (i = 0; i < 5; i++) p(63 + i * 6, 66, 3, 5, '#ffffff');
        }
      },
      arene: {
        ciel: ['#0a1a24', '#2a5a6a'], sol: ['#6aa8b8', '#8ac8d4'], lueur: '#6ff2ff', etoiles: true,
        decor: function (ctx) {
          ctx.fillStyle = '#9fe0e8';
          ctx.beginPath(); ctx.arc(390, 58, 30, 0, 6.3); ctx.fill();
          ctx.strokeStyle = 'rgba(200,240,244,.7)';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(390, 58, 10, 50, 0.15, 0, 6.3); ctx.stroke();
        },
        sol2: function (ctx, W) {
          ctx.fillStyle = '#c8f0f4';
          for (var i = 0; i < 9; i++) {
            var x = i * 56 + 10;
            ctx.beginPath(); ctx.moveTo(x, 160); ctx.lineTo(x + 8, 128 - (i % 3) * 10); ctx.lineTo(x + 16, 160); ctx.fill();
          }
        }
      },
      textes: {
        victoire: 'LE TITAN S’EST BRISÉ',
        recit: 'Une fissure court de corne à corne, puis le visage entier s’effondre en neige fine. Uranus a l’air, soudain, moins penché.',
        echec: 'Le Téléportail t’a tiré du froid juste avant qu’il ne te fige. Le Titan te regarde toujours.',
        reveil: 'La glace craque sous tes pas. Un visage remonte à travers…',
        indice: 'La glace est lisse comme un miroir, et quelque chose regarde dessous.'
      }
    },

    // ---------- 8. Neptune ----------
    {
      id: 'leviathan-abysses', astre: 'neptune', rang: 8,
      nom: 'Le Léviathan des Abysses',
      c: ['#2a3e9a', '#3e5ac4', '#7affd8'],
      texte: 'Le dernier gardien, au bout du système solaire. Un serpent des ' +
             'profondeurs qui nage dans l’océan de diamants de Neptune et ' +
             'attire ses proies avec une lueur au bout d’une antenne.',
      pv: 22000, cadence: [2600, 2000, 1400], coup: [18, 24, 30],
      prepare: 900, etourdi: 950, interrompre: 4, xp: 1400,
      recompense: { roches: 150, credit: ['pink', 3] },
      corps: { rx: 56, ry: 38, dy: 0 },
      faibles: [{ x: 82, y: 6, r: 7 }, { x: 48, y: 50, r: 7 }, { x: 102, y: 50, r: 7 },
                { x: 34, y: 66, r: 7 }, { x: 116, y: 66, r: 7 }],
      gorge: { x: 75, y: 80, r: 11 },
      dessiner: function (p, ouverte) {
        var i;
        ovale(p, 75, 100, 40, 16, '#1a2a6e');
        for (i = 0; i < 6; i++) p(44 + i * 11, 96, 6, 3, '#3e5ac4');
        // Les nageoires en collerette.
        for (i = 0; i < 8; i++) {
          p(14 + i * 3, 30 + i * 5, 7, 3, '#5a7ae8');
          p(129 - i * 3, 30 + i * 5, 7, 3, '#5a7ae8');
        }
        ovale(p, 75, 56, 56, 34, '#2a3e9a');
        ovale(p, 75, 46, 48, 20, '#3e5ac4');
        ovale(p, 75, 74, 40, 12, '#6a8ad8');
        // L'antenne et sa lueur.
        for (i = 0; i < 12; i++) p(74 + Math.round(Math.sin(i / 4) * 4), 26 - i * 2, 2, 2, '#1a2a6e');
        ovale(p, 82, 6, 5, 5, '#7affd8');
        ovale(p, 82, 6, 2, 2, '#e8fff8');
        [48, 102].forEach(function (x, k) {
          ovale(p, x, 50, 8, 6, '#050a1a');
          ovale(p, x, 50, 5, 4, '#7affd8');
          p(x - 1, 45, 2, 10, '#050a1a');
          sourcil(p, x, 50, k ? 1 : -1, '#101c50', 1.1);
        });
        for (i = 0; i < 3; i++) {
          p(28, 62 + i * 5, 12, 2, '#ff5a8a');
          p(110, 62 + i * 5, 12, 2, '#ff5a8a');
        }
        if (!ouverte) {
          p(40, 74, 70, 3, '#0a1030');
          for (i = 0; i < 10; i++) p(44 + i * 7, 76, 2, 3, '#e8f0ff');
        } else {
          ovale(p, 75, 80, 40, 18, '#050818');
          ovale(p, 75, 84, 24, 8, '#0a2a4a');
          for (i = 0; i < 10; i++) {
            p(42 + i * 7, 64, 3, 8 - (i % 2) * 3, '#e8f0ff');
            p(44 + i * 7, 92, 3, 7 - (i % 2) * 3, '#e8f0ff');
          }
        }
      },
      arene: {
        ciel: ['#020618', '#0a1a5a'], sol: ['#0a1a4a', '#14286a'], lueur: '#7affd8', etoiles: true,
        decor: function (ctx, t, W) {
          ctx.fillStyle = '#060e30';
          ctx.beginPath(); ctx.ellipse(120, 70, 50, 22, 0.1, 0, 6.3); ctx.fill();
          ctx.strokeStyle = 'rgba(122,180,255,.35)';
          ctx.lineWidth = 2;
          for (var i = 0; i < 6; i++) {
            var x = ((t / 5 + i * 97) % (W + 120)) - 60;
            ctx.beginPath(); ctx.moveTo(x, 20 + i * 20); ctx.lineTo(x + 60, 20 + i * 20); ctx.stroke();
          }
        }
      },
      textes: {
        victoire: 'LE LÉVIATHAN A SOMBRÉ',
        recit: 'Sa lueur s’éteint, et il coule, lentement, vers l’océan de diamants. Le système solaire t’appartient.',
        echec: 'Le Téléportail t’a tiré des abysses. Au loin, une petite lueur verte se rallume.',
        reveil: 'Une lueur verte s’allume dans le noir. Puis une autre, et des dents…',
        indice: 'Une petite lumière verte flotte au-dessus d’un gouffre. Ne la suis pas.'
      }
    }
  ];

  // ==========================================================
  //  L'enregistrement
  // ==========================================================

  LISTE.forEach(function (g) {
    g.fond = arene(g.arene);
    B.definir(g);
    V.MONSTRES.push({
      id: g.id, astre: g.astre, nom: g.nom, boss: true, carrure: 'colosse', palier: 6,
      c: g.c, texte: g.texte
    });
  });

  // Le Selenophage a aussi ses textes de reveil et d'indice.
  var S = B.GARDIENS.selenophage;
  S.textes.reveil = 'Le sol tremble. Quelque chose remonte de la grotte…';
  S.textes.indice = 'La grotte respire. Quelque chose dort là-dedans.';
  S.c = V.MONSTRE.c;
})();
