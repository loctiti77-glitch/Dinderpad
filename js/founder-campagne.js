// La campagne de The Founder War : dix niveaux, chacun avec sa quête dans
// la forêt et son sbire dans l'arène, puis l'Effondrement Terminal contre
// Le Fondateur lui-même.
//
// Ce fichier tient les donnees : les niveaux, les sbires et leurs
// details, les niveaux des Dinders et ce que ça change à leurs attaques.
// Le jeu lui-meme est dans founder-war.js.
(function () {
  var DP = window.DP;
  if (!DP) return;

  // ==========================================================
  //  Les niveaux des Dinders
  // ==========================================================
  // Un Dinder monte en tapant : chaque combat mene lui rapporte de
  // l'experience. Plus il est rare, plus il frappe fort a niveau egal —
  // et plus son ultime fait mal.

  var NIVEAU_MAX = 30;

  // Ce que vaut la rarete, au depart.
  // Plus un Dinder est rare, plus il frappe fort. Threat est au-dessus de
  // tout : c'est ce qui est remonte de la faille.
  var FORCE_RARETE = {
    'Universel': 1, 'Multiversel': 1.14, 'Omniversel': 1.3, 'Temporel': 1.5,
    'Threat': 1.8
  };

  function forceRarete(id) {
    var d = DP.byId(id);
    return (d && FORCE_RARETE[d.rarity]) || 1;
  }

  // L'experience qu'il faut pour passer au niveau suivant. Un Dinder
  // rare monte aussi vite qu'un autre : c'est sa force qui change.
  function seuil(n) { return n <= 1 ? 0 : Math.round(60 * Math.pow(n - 1, 1.45)); }

  function niveauDe(xp) {
    var n = 1;
    while (n < NIVEAU_MAX && xp >= seuil(n + 1)) n++;
    return n;
  }

  function xpDe(id) { return DP.dinderXP(id); }
  function niveau(id) { return niveauDe(xpDe(id)); }

  function etat(id) {
    var xp = xpDe(id), n = niveauDe(xp);
    var bas = seuil(n), haut = n >= NIVEAU_MAX ? bas : seuil(n + 1);
    return {
      id: id, xp: xp, niveau: n, bas: bas, haut: haut, max: NIVEAU_MAX,
      k: n >= NIVEAU_MAX ? 1 : (xp - bas) / Math.max(1, haut - bas),
      force: force(id, n), pv: pointsDeVie(id, n)
    };
  }

  // Le multiplicateur de degats : la rarete donne le socle, le niveau
  // ajoute un peu moins de quatre pour cent par cran. Le palier compte
  // trente crans desormais : le gain par niveau a ete resserre pour que
  // le sommet reste a peine au-dessus de l'ancien maximum, et non trois
  // fois au-dessus.
  function force(id, n) {
    n = n || niveau(id);
    return forceRarete(id) * (1 + 0.038 * (n - 1));
  }

  // Les points de vie suivent la meme logique, plus doucement.
  function pointsDeVie(id, n) {
    n = n || niveau(id);
    return Math.round(100 * forceRarete(id) * (1 + 0.024 * (n - 1)));
  }

  // ==========================================================
  //  Les Credits Evolutifs
  // ==========================================================
  // L'experience fait monter un Dinder toute seule, jusqu'au trentieme
  // niveau. Les Credits Evolutifs, eux, permettent de ne pas attendre :
  // un palier acheté est un palier gagne tout de suite. Plus le Dinder
  // est haut, plus cela coute.

  function coutEvolution(id) {
    var n = niveau(id);
    if (n >= NIVEAU_MAX) return 0;
    return 1 + Math.floor(n / 5);
  }

  function peutEvoluer(id) {
    var c = coutEvolution(id);
    return c > 0 && DP.evos() >= c;
  }

  // Fait monter le Dinder d'un cran, contre paiement. Rend le detail de
  // ce qui s'est passe, pour que l'ecran puisse l'annoncer.
  function evoluer(id) {
    var c = coutEvolution(id);
    if (!c || !DP.depenserEvos(c)) return null;
    var avant = niveau(id);
    var vise = seuil(avant + 1);
    var manque = Math.max(0, vise - xpDe(id));
    if (manque) DP.gagnerDinderXP(id, manque);
    var apres = niveau(id);
    return { cout: c, avant: avant, apres: apres,
             ultime: avant < NIVEAU_ULTIME && apres >= NIVEAU_ULTIME };
  }

  // L'ultime de chaque Dinder : une troisieme attaque, qui ne s'ouvre
  // qu'au niveau six. Une fois par combat.
  var ULTIMES = {
    'dr-islas-human-form':
      { nom: 'Protocole SS-03', degats: [96, 124], ultime: true, soinTous: 30 },
    'dr-islas-demicos-form':
      { nom: 'Greffe Totale', degats: [118, 150], ultime: true, boost: 0.5 },
    'dr-islas-final-form':
      { nom: 'Trou de Ver', degats: [190, 240], ultime: true, etourdit: 0.8 },
    'calder-veyne-veinburner':
      { nom: 'Combustion Veineuse', degats: [150, 190], ultime: true, brulure: 22 },
    'carl-sinars-cardinal-sin':
      { nom: 'Tapis Vert', degats: [22, 34], coups: 7, ultime: true, drain: true },
    'edgar-marks-grincrusher':
      { nom: 'Sourire Final', degats: [160, 205], ultime: true, faiblesse: 0.6 },
    'he-melt':
      { nom: 'Bain d’Acide', degats: [140, 180], ultime: true, brulure: 16 },
    'v':
      { nom: 'Orbe de V', degats: [175, 225], ultime: true, bouclier: 70 },
    'a':
      { nom: 'Axiome Zéro', degats: [185, 235], ultime: true, oubli: true },
    'h':
      { nom: 'Horizon Partagé', degats: [150, 195], ultime: true, soinTous: 45 },
    'multinder':
      { nom: 'Les Cinq Éléments', degats: [40, 56], coups: 5, ultime: true },
    'dr-islas-singularity':
      { nom: 'Point de Non-Retour', degats: [196, 248], ultime: true, etourdit: 0.85 },
    'dr-islas-the-founder':
      { nom: 'Ordre du Vide', degats: [240, 300], ultime: true, soinTous: 60 },
    'harry-hargrove':
      { nom: 'Arrêt sur Image', degats: [112, 146], ultime: true, etourdit: 0.75 },
    'marlon-coach':
      { nom: 'Dernier Round', degats: [120, 155], ultime: true, boost: 0.5 },
    'baron-zofiax':
      { nom: 'Offre Publique', degats: [30, 44], coups: 5, ultime: true, drain: true },
    'timeo-traveler':
      { nom: 'Boucle Fermée', degats: [168, 214], ultime: true, soinTous: 40 },
    'william-batant':
      { nom: 'Nuit Sans Lune', degats: [175, 222], ultime: true, faiblesse: 0.55 },
    'gart-kervelor-king-of-karsovia':
      { nom: 'Couronnement', degats: [165, 210], ultime: true, bouclier: 55 },
    'lefondateur':
      { nom: 'Remise en Ordre', degats: [210, 260], ultime: true, etourdit: 0.6 }
  };

  var NIVEAU_ULTIME = 6;

  function ultimeDe(id) { return ULTIMES[id] || null; }
  function aUltime(id) { return niveau(id) >= NIVEAU_ULTIME && !!ULTIMES[id]; }

  // Les attaques d'un Dinder, degats mis a l'echelle de son niveau.
  function attaques(id) {
    var FW = window.FW;
    var base = FW ? FW.attaquesDe(id) : [];
    var f = force(id);
    var out = base.map(function (a) {
      var b = {};
      for (var k in a) b[k] = a[k];
      b.degats = [Math.round(a.degats[0] * f), Math.round(a.degats[1] * f)];
      return b;
    });
    if (aUltime(id)) {
      var u = ULTIMES[id], c = {};
      for (var k2 in u) c[k2] = u[k2];
      c.degats = [Math.round(u.degats[0] * f), Math.round(u.degats[1] * f)];
      out.push(c);
    }
    return out;
  }

  // Gagner de l'experience, et dire si l'on a change de niveau.
  function gagnerXP(id, n) {
    var avant = niveau(id);
    DP.gagnerDinderXP(id, n);
    var apres = niveau(id);
    return { gain: n, avant: avant, apres: apres, monte: apres > avant,
             ultime: avant < NIVEAU_ULTIME && apres >= NIVEAU_ULTIME };
  }

  // ==========================================================
  //  Les sbires du Fondateur
  // ==========================================================
  // Tous sortent du meme moule : une armure noire zebree de rouge. Chaque
  // niveau ajoute ses pieces — une crete, un bouclier, une seconde paire
  // d'yeux — et sa couleur, pour qu'on les distingue d'un coup d'oeil.

  var IMG_SBIRE = 'assets/games/sbire.webp';
  var imgSbire = null;

  // Ceux qui attendent que l'armure de base soit chargee pour se
  // redessiner. Sans cela, un ecran ouvert trop tot affichait la planche
  // brute — la meme pour tous les sbires.
  var enAttente = [];

  function chargerSbire() {
    if (imgSbire) return imgSbire;
    imgSbire = new Image();
    if (typeof imgSbire.addEventListener === 'function') {
      imgSbire.addEventListener('load', function () {
        var l = enAttente.slice();
        enAttente.length = 0;
        l.forEach(function (fn) { try { fn(); } catch (e) {} });
      });
    }
    imgSbire.src = IMG_SBIRE;
    return imgSbire;
  }

  // Vrai quand la planche est prete a etre dessinee.
  function sbirePret() {
    var img = chargerSbire();
    return !!(img.complete && img.naturalWidth);
  }

  // Pose une image sur le sbire du niveau n, et la repose des que
  // l'armure de base est chargee si elle ne l'etait pas encore.
  function poserSbire(el, n) {
    function maj() { el.src = urlSbire(n); }
    maj();
    if (!sbirePret()) enAttente.push(maj);
    return el;
  }

  // Les details, dessines par-dessus l'armure. Chacun recoit le canevas,
  // la largeur et la hauteur de la case, et la teinte du niveau.
  var DETAILS = {
    // Une crete sur le casque.
    crete: function (x, L, H, c) {
      x.fillStyle = c;
      for (var i = 0; i < 5; i++) {
        var h = 0.06 * H * (1 - Math.abs(i - 2) * 0.22);
        x.fillRect(L * (0.44 + i * 0.03), H * 0.06 - h, L * 0.022, h);
      }
    },
    // Deux cornes qui partent du casque.
    cornes: function (x, L, H, c) {
      x.strokeStyle = c;
      x.lineWidth = Math.max(2, L * 0.016);
      [[-1, 0.42], [1, 0.58]].forEach(function (s) {
        x.beginPath();
        x.moveTo(L * s[1], H * 0.09);
        x.quadraticCurveTo(L * (s[1] + s[0] * 0.12), H * 0.02, L * (s[1] + s[0] * 0.2), H * 0.05);
        x.stroke();
      });
    },
    // Des epaulettes plus larges, posees sur les epaules de l'armure.
    epaules: function (x, L, H, c) {
      [0.29, 0.71].forEach(function (u) {
        x.fillStyle = 'rgba(16,16,20,.95)';
        x.beginPath();
        x.ellipse(L * u, H * 0.235, L * 0.095, H * 0.042, 0, Math.PI, 0);
        x.fill();
        x.strokeStyle = c;
        x.lineWidth = Math.max(2, L * 0.012);
        x.stroke();
        x.fillStyle = c;
        x.fillRect(L * (u - 0.05), H * 0.222, L * 0.1, H * 0.006);
      });
    },
    // Un bouclier tenu au bras gauche.
    bouclier: function (x, L, H, c) {
      x.fillStyle = 'rgba(20,20,24,.92)';
      x.beginPath();
      x.ellipse(L * 0.22, H * 0.52, L * 0.16, H * 0.16, 0, 0, 6.3);
      x.fill();
      x.strokeStyle = c;
      x.lineWidth = Math.max(2, L * 0.014);
      x.stroke();
      x.beginPath();
      x.moveTo(L * 0.22, H * 0.38); x.lineTo(L * 0.22, H * 0.66);
      x.stroke();
    },
    // Une lame au bras droit.
    lame: function (x, L, H, c) {
      x.fillStyle = c;
      x.beginPath();
      x.moveTo(L * 0.80, H * 0.46);
      x.lineTo(L * 0.98, H * 0.30);
      x.lineTo(L * 1.0, H * 0.38);
      x.lineTo(L * 0.84, H * 0.54);
      x.closePath();
      x.fill();
    },
    // Une cape, qui tombe derriere les epaules. Elle se dessine avant le
    // corps : sinon elle le masquerait entierement.
    cape: function (x, L, H, c) {
      x.fillStyle = c;
      x.globalAlpha = 0.5;
      x.beginPath();
      x.moveTo(L * 0.33, H * 0.20);
      x.lineTo(L * 0.67, H * 0.20);
      x.lineTo(L * 0.92, H * 0.88);
      x.lineTo(L * 0.08, H * 0.88);
      x.closePath();
      x.fill();
      x.globalAlpha = 0.8;
      x.strokeStyle = c;
      x.lineWidth = Math.max(2, L * 0.012);
      x.stroke();
      x.globalAlpha = 1;
    },
    // Une seconde paire d'yeux.
    yeux: function (x, L, H, c) {
      x.fillStyle = c;
      x.fillRect(L * 0.44, H * 0.135, L * 0.05, H * 0.008);
      x.fillRect(L * 0.51, H * 0.135, L * 0.05, H * 0.008);
    },
    // --- Ce qui change vraiment la silhouette ---
    // Toutes ces pieces se placent sur B, la boite du corps : B.x, B.y,
    // B.w, B.h, plus B.cx (le milieu) et B.bas (les pieds).

    // La longue-vue du Guetteur : un tube qui s'evase, une lentille au
    // bout, et le rai de lumiere qu'elle renvoie.
    longuevue: function (x, L, H, c, img, B) {
      var ty = B.y + B.h * 0.088;
      var x0 = B.cx + B.w * 0.10, x1 = x0 + B.w * 0.52;
      var e0 = B.h * 0.026, e1 = B.h * 0.046;
      x.fillStyle = 'rgba(18,18,24,.97)';
      x.beginPath();
      x.moveTo(x0, ty - e0 / 2);
      x.lineTo(x1, ty - e1 / 2);
      x.lineTo(x1, ty + e1 / 2);
      x.lineTo(x0, ty + e0 / 2);
      x.closePath();
      x.fill();
      x.strokeStyle = c;
      x.lineWidth = Math.max(2, B.w * 0.016);
      x.stroke();
      // Un seul jonc, aux deux tiers du tube.
      x.fillStyle = c;
      x.fillRect(x0 + (x1 - x0) * 0.62, ty - e1 * 0.56, B.w * 0.018, e1 * 1.12);
      // La lentille.
      x.beginPath();
      x.ellipse(x1, ty, B.w * 0.020, e1 * 0.58, 0, 0, 6.3);
      x.fill();
      x.fillStyle = '#ffffff';
      x.globalAlpha = 0.7;
      x.beginPath();
      x.ellipse(x1, ty - e1 * 0.14, B.w * 0.008, e1 * 0.20, 0, 0, 6.3);
      x.fill();
      x.globalAlpha = 0.18;
      x.fillStyle = c;
      x.beginPath();
      x.moveTo(x1, ty - e1 / 2);
      x.lineTo(x1 + B.w * 0.42, ty - B.h * 0.075);
      x.lineTo(x1 + B.w * 0.42, ty + B.h * 0.075);
      x.lineTo(x1, ty + e1 / 2);
      x.closePath();
      x.fill();
      x.globalAlpha = 1;
    },

    // Les batons de comptage    // Les batons de comptage de la Sentinelle, graves sur le plastron.
    comptes: function (x, L, H, c, img, B) {
      x.strokeStyle = c;
      x.lineWidth = Math.max(2, B.w * 0.020);
      var by = B.y + B.h * 0.26, pas = B.w * 0.040;
      for (var g = 0; g < 2; g++) {
        var bx = B.cx - B.w * 0.20 + g * B.w * 0.26;
        for (var k = 0; k < 4; k++) {
          x.beginPath();
          x.moveTo(bx + k * pas, by);
          x.lineTo(bx + k * pas, by + B.h * 0.070);
          x.stroke();
        }
        x.beginPath();
        x.moveTo(bx - pas * 0.4, by + B.h * 0.064);
        x.lineTo(bx + pas * 3.4, by + B.h * 0.006);
        x.stroke();
      }
    },

    // Le marteau du Brise-Crane, tenu en travers du corps : le manche
    // barre l'armure, la masse repose sur l'epaule.
    marteau: function (x, L, H, c, img, B) {
      var ax = B.x + B.w * 0.86, ay = B.bas - B.h * 0.06;   // la poignee, en bas
      var bx = B.x + B.w * 0.06, by = B.y + B.h * 0.24;     // la masse, en haut
      // Le manche, cerne de clair pour se detacher du fond.
      x.strokeStyle = 'rgba(12,10,14,.95)';
      x.lineWidth = Math.max(6, B.w * 0.085);
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
      x.strokeStyle = '#8a6a44';
      x.lineWidth = Math.max(4, B.w * 0.055);
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.18)';
      x.lineWidth = Math.max(1, B.w * 0.014);
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
      // La masse : un bloc cerne, avec sa bande de couleur.
      var tw = B.w * 0.40, th = B.h * 0.115;
      var tx = bx - tw * 0.62, tyy = by - th / 2;
      x.fillStyle = 'rgba(12,10,14,.95)';
      x.fillRect(tx - 2, tyy - 2, tw + 4, th + 4);
      x.fillStyle = '#3c3c46';
      x.fillRect(tx, tyy, tw, th);
      x.fillStyle = '#585864';
      x.fillRect(tx, tyy, tw, th * 0.34);
      x.fillStyle = c;
      x.fillRect(tx + tw * 0.40, tyy, tw * 0.18, th);
      x.strokeStyle = c;
      x.lineWidth = Math.max(2, B.w * 0.018);
      x.strokeRect(tx, tyy, tw, th);
    },

    // Le double de l'Echo    // Le double de l'Echo : une silhouette decalee, translucide.
    double: function (x, L, H, c, img, B) {
      if (!img) return;
      var dx = B.w * 0.34;
      x.save();
      x.globalAlpha = 0.30;
      x.translate(dx, -B.h * 0.02);
      x.drawImage(img, 0, 0, L, H);
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = c;
      x.globalAlpha = 0.55;
      x.fillRect(0, 0, L, H);
      x.restore();
    },

    // Le pavois de la Muraille : un bouclier qui masque la moitie du corps.
    pavois: function (x, L, H, c, img, B) {
      var px = B.x - B.w * 0.16, pw = B.w * 0.80;
      var py = B.y + B.h * 0.14, ph = B.h * 0.66;
      x.fillStyle = 'rgba(22,24,30,.97)';
      x.beginPath();
      x.moveTo(px, py);
      x.lineTo(px + pw, py);
      x.lineTo(px + pw, py + ph * 0.72);
      x.quadraticCurveTo(px + pw / 2, py + ph * 1.16, px, py + ph * 0.72);
      x.closePath();
      x.fill();
      x.fillStyle = c;
      x.globalAlpha = 0.24;
      x.fill();
      x.globalAlpha = 1;
      x.strokeStyle = c;
      x.lineWidth = Math.max(3, B.w * 0.026);
      x.stroke();
      x.fillStyle = c;
      x.fillRect(px + pw / 2 - B.w * 0.025, py + ph * 0.06, B.w * 0.05, ph * 0.82);
      x.beginPath();
      x.arc(px + pw / 2, py + ph * 0.40, B.w * 0.11, 0, 6.3);
      x.fill();
      x.fillStyle = 'rgba(10,10,14,.92)';
      x.beginPath();
      x.arc(px + pw / 2, py + ph * 0.40, B.w * 0.06, 0, 6.3);
      x.fill();
    },

    // Le miroir du Jumeau : sa moitie droite est un reflet inverse.
    miroir: function (x, L, H, c, img, B) {
      if (!img) return;
      x.save();
      x.beginPath();
      x.rect(B.cx, 0, L - B.cx, H);
      x.clip();
      x.translate(B.cx * 2, 0);
      x.scale(-1, 1);
      x.globalAlpha = 0.6;
      x.drawImage(img, 0, 0, L, H);
      x.restore();
      x.save();
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = c;
      x.globalAlpha = 0.20;
      x.fillRect(B.cx, 0, L - B.cx, H);
      x.restore();
      // La cassure, au milieu.
      x.strokeStyle = c;
      x.globalAlpha = 0.7;
      x.lineWidth = Math.max(2, B.w * 0.016);
      x.beginPath();
      x.moveTo(B.cx, B.y);
      x.lineTo(B.cx, B.bas);
      x.stroke();
      x.globalAlpha = 1;
    },

    // Les flammes de l'Inquisiteur : des langues molles, en degrade,
    // qui montent le long de l'armure.
    flammes: function (x, L, H, c, img, B) {
      function langue(fx, base, haut, larg, alpha) {
        var g = x.createLinearGradient(fx, base, fx, base - haut);
        g.addColorStop(0, 'rgba(255,60,0,0)');
        g.addColorStop(0.35, c);
        g.addColorStop(1, '#ffe9a8');
        x.fillStyle = g;
        x.globalAlpha = alpha;
        x.beginPath();
        x.moveTo(fx - larg / 2, base);
        x.bezierCurveTo(fx - larg * 0.62, base - haut * 0.45,
                        fx - larg * 0.18, base - haut * 0.62,
                        fx, base - haut);
        x.bezierCurveTo(fx + larg * 0.20, base - haut * 0.60,
                        fx + larg * 0.60, base - haut * 0.40,
                        fx + larg / 2, base);
        x.closePath();
        x.fill();
      }
      // Le lit de braise, aux pieds.
      var g2 = x.createRadialGradient(B.cx, B.bas, B.w * 0.05, B.cx, B.bas, B.w * 0.75);
      g2.addColorStop(0, c);
      g2.addColorStop(1, 'rgba(255,60,0,0)');
      x.globalAlpha = 0.35;
      x.fillStyle = g2;
      x.beginPath();
      x.ellipse(B.cx, B.bas, B.w * 0.75, B.h * 0.10, 0, 0, 6.3);
      x.fill();
      for (var i = 0; i < 7; i++) {
        var u = i / 6;
        langue(B.x + B.w * (0.06 + u * 0.88), B.bas + B.h * 0.01,
               B.h * (0.16 + ((i * 37) % 7) * 0.020), B.w * 0.20, 0.72);
      }
      for (var j = 0; j < 4; j++) {
        var v = j / 3;
        langue(B.x + B.w * (0.16 + v * 0.68), B.y + B.h * 0.62,
               B.h * (0.11 + ((j * 29) % 5) * 0.018), B.w * 0.15, 0.5);
      }
      x.globalAlpha = 1;
    },

    // Les plaques rivetees du Colosse    // Le surblindage du Colosse : des plaques sombres bordees de rivets,
    // posees sur les epaules et le torse. Rien qui deborde du corps.
    plaques: function (x, L, H, c, img, B) {
      [[0.04, 0.20, 0.24, 0.24], [0.72, 0.20, 0.24, 0.24],
       [0.26, 0.40, 0.48, 0.28]].forEach(function (r) {
        var rx = B.x + B.w * r[0], ry = B.y + B.h * r[1];
        var rw = B.w * r[2], rh = B.h * r[3];
        var arr = Math.min(rw, rh) * 0.22;
        x.beginPath();
        if (x.roundRect) x.roundRect(rx, ry, rw, rh, arr);
        else x.rect(rx, ry, rw, rh);
        x.fillStyle = 'rgba(26,26,32,.82)';
        x.fill();
        var g = x.createLinearGradient(rx, ry, rx, ry + rh);
        g.addColorStop(0, 'rgba(255,255,255,.14)');
        g.addColorStop(1, 'rgba(0,0,0,.28)');
        x.fillStyle = g;
        x.fill();
        x.strokeStyle = c;
        x.globalAlpha = 0.8;
        x.lineWidth = Math.max(2, B.w * 0.016);
        x.stroke();
        x.globalAlpha = 1;
        for (var k = 0; k < 4; k++) {
          x.fillStyle = c;
          x.beginPath();
          x.arc(rx + (k % 2 ? rw - rw * 0.16 : rw * 0.16),
                ry + (k < 2 ? rh * 0.18 : rh * 0.82), B.w * 0.014, 0, 6.3);
          x.fill();
          x.fillStyle = 'rgba(255,255,255,.35)';
          x.beginPath();
          x.arc(rx + (k % 2 ? rw - rw * 0.16 : rw * 0.16) - B.w * 0.004,
                ry + (k < 2 ? rh * 0.18 : rh * 0.82) - B.w * 0.004, B.w * 0.005, 0, 6.3);
          x.fill();
        }
      });
    },

    // La fumee de l'Ombre    // La fumee de l'Ombre : elle monte du sol et le mange par le bas.
    fumee: function (x, L, H, c, img, B) {
      for (var i = 0; i < 22; i++) {
        var fx = B.x + B.w * (((i * 53) % 100) / 100);
        var fy = B.y + B.h * (0.52 + ((i * 29) % 46) / 100);
        var r = B.w * (0.10 + ((i * 17) % 9) / 60);
        x.globalAlpha = 0.20;
        x.fillStyle = i % 2 ? c : '#0a0a12';
        x.beginPath();
        x.arc(fx, fy, r, 0, 6.3);
        x.fill();
      }
      x.globalAlpha = 1;
    },

    // Le dossier de pics du Premier, derriere lui, comme un trone.
    trone: function (x, L, H, c, img, B) {
      var n = 9, larg = B.w * 1.5;
      var x0 = B.cx - larg / 2, base = B.y + B.h * 0.62;
      for (var i = 0; i < n; i++) {
        var px = x0 + (larg / n) * i;
        var hh = B.h * (0.34 + (i % 3) * 0.10);
        x.beginPath();
        x.moveTo(px, base);
        x.lineTo(px + larg / n / 2, base - hh);
        x.lineTo(px + larg / n, base);
        x.closePath();
        x.fillStyle = 'rgba(20,18,28,.92)';
        x.fill();
        x.strokeStyle = c;
        x.globalAlpha = 0.65;
        x.lineWidth = Math.max(2, B.w * 0.014);
        x.stroke();
        x.globalAlpha = 1;
      }
    },

    // Une aura, derriere le corps.
    aura: function (x, L, H, c) {
      var g = x.createRadialGradient(L / 2, H * 0.5, L * 0.15, L / 2, H * 0.5, L * 0.8);
      g.addColorStop(0, c);
      g.addColorStop(0.45, c);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = 0.3;
      x.fillStyle = g;
      x.fillRect(0, 0, L, H);
      x.globalAlpha = 1;
    },
    // Une couronne, pour le dernier d'entre eux.
    couronne: function (x, L, H, c) {
      x.fillStyle = c;
      x.fillRect(L * 0.38, H * 0.045, L * 0.24, H * 0.014);
      for (var i = 0; i < 5; i++) {
        x.fillRect(L * (0.38 + i * 0.055), H * 0.02, L * 0.02, H * 0.028);
      }
    }
  };

  // ==========================================================
  //  Les dix niveaux, puis l'Effondrement Terminal
  // ==========================================================
  // "quete" dit ce qu'il faut faire dans la foret avant que la porte de
  // l'arene ne s'ouvre : des eclats a ramasser, des bornes a allumer dans
  // l'ordre, des patrouilles a eviter, et parfois un chrono.

  var NIVEAUX = [
    { n: 1, nom: 'Le Guetteur', titre: 'Sbire de veille',
      teinte: '#ff2a2a', taille: 1, details: ['longuevue'],
      pv: 420, coup: [26, 36], quete: { eclats: 2 },
      dialogue: [
        { qui: 'sbire', texte: 'Halte. Ce bois appartient au Fondateur, comme tout le reste.' },
        { qui: 'dinder', texte: 'Un bois n’appartient à personne.' },
        { qui: 'sbire', texte: 'Tout appartient à quelqu’un. C’est ça, l’ordre.' }
      ],
      recit: 'Un guetteur garde l’orée du bois. Il a déjà prévenu les autres.',
      avant: 'Il lève la main. Derrière lui, la forêt s’allume de points rouges.' },
    { n: 2, nom: 'La Sentinelle', titre: 'Sbire de garde',
      teinte: '#ff6a2a', taille: 1, details: ['crete', 'comptes'],
      pv: 560, coup: [30, 42], quete: { eclats: 3, chrono: 100 },
      dialogue: [
        { qui: 'sbire', texte: 'Tu as mis du temps. J’ai compté chaque seconde.' },
        { qui: 'dinder', texte: 'Tu n’as que ça à faire ?' },
        { qui: 'sbire', texte: 'Je compte, je note, je préviens. Et ensuite je frappe.' }
      ],
      recit: 'La Sentinelle ne dort pas. Elle compte, et elle attend.',
      avant: 'Tu as mis trop de temps, dit-elle. Le Fondateur n’aime pas attendre.' },
    { n: 3, nom: 'Le Brise-Crâne', titre: 'Sbire de choc',
      teinte: '#ffb02e', taille: 1.04, details: ['epaules', 'marteau'],
      pv: 720, coup: [34, 48], quete: { bornes: 3 },
      dialogue: [
        { qui: 'sbire', texte: '…' },
        { qui: 'dinder', texte: 'Il ne parle pas ?' },
        { qui: 'sbire', texte: 'Il a fendu trois casques ce matin. Il n’a rien à dire de plus.' }
      ],
      recit: 'Il ne parle pas. Ses épaulettes ont déjà fendu trois casques.',
      avant: 'Il frappe le sol une fois. Les bornes que tu viens d’allumer s’éteignent.' },
    { n: 4, nom: 'L’Écho Rouge', titre: 'Sbire traqueur',
      teinte: '#ff2a6a', taille: 1, details: ['double', 'yeux'],
      pv: 900, coup: [38, 52], quete: { eclats: 4, patrouilles: 1 },
      dialogue: [
        { qui: 'sbire', texte: 'Je te vois deux fois. Le Fondateur aussi, donc.' },
        { qui: 'dinder', texte: 'Alors qu’il regarde bien.' },
        { qui: 'sbire', texte: 'Il regarde. Il regarde toujours.' }
      ],
      recit: 'Il voit deux fois. Ce qu’il voit, Le Fondateur le voit aussi.',
      avant: 'Quatre yeux se braquent sur ton équipe. Aucun ne cligne.' },
    { n: 5, nom: 'La Muraille', titre: 'Sbire bouclier',
      teinte: '#2a9cff', taille: 1.02, details: ['pavois', 'epaules'],
      pv: 1100, coup: [40, 54], bouclier: 90, quete: { bornes: 4, patrouilles: 2 },
      dialogue: [
        { qui: 'sbire', texte: 'On ne passe pas.' },
        { qui: 'dinder', texte: 'On est cinq.' },
        { qui: 'sbire', texte: 'J’en ai arrêté beaucoup plus que cinq, et personne n’est ressorti.' }
      ],
      recit: 'Rien n’est passé devant elle depuis la fondation.',
      avant: 'Elle plante son bouclier dans la dalle. « On ne passe pas. »' },
    { n: 6, nom: 'Le Jumeau', titre: 'Sbire copie',
      teinte: '#c86aff', taille: 1, details: ['cape', 'miroir'],
      pv: 1300, coup: [44, 58], copie: true, quete: { eclats: 5, chrono: 85 },
      dialogue: [
        { qui: 'sbire', texte: 'Tu me trouves familier ? C’est normal.' },
        { qui: 'dinder', texte: 'Tu as pris nos gestes.' },
        { qui: 'sbire', texte: 'J’ai pris mieux que ça. Regarde-toi bien avant de frapper.' }
      ],
      recit: 'Il a le visage de quelqu’un que tu connais. Sous le casque, personne.',
      avant: 'Il prend la pose de ton premier Dinder, à la seconde près.' },
    { n: 7, nom: 'L’Inquisiteur', titre: 'Sbire brûleur',
      teinte: '#ff7a1e', taille: 1.02, details: ['flammes', 'lame', 'crete'],
      pv: 1500, coup: [46, 62], brulure: 14, quete: { bornes: 5, patrouilles: 3 },
      dialogue: [
        { qui: 'sbire', texte: 'J’ai brûlé les dossiers. Les preuves. Et ceux qui les portaient.' },
        { qui: 'dinder', texte: 'Il reste nous.' },
        { qui: 'sbire', texte: 'C’est exactement ce que je disais.' }
      ],
      recit: 'Il brûle les dossiers, les preuves, et ceux qui les portent.',
      avant: 'Sa lame chauffe jusqu’au blanc. L’air sent le métal.' },
    { n: 8, nom: 'Le Colosse d’Acier', titre: 'Sbire de siège',
      teinte: '#8a8f98', taille: 1.16, details: ['plaques', 'epaules', 'cornes'],
      pv: 1800, coup: [52, 68], bouclier: 120, quete: { eclats: 6, patrouilles: 3, chrono: 110 },
      dialogue: [
        { qui: 'sbire', texte: 'Deux tonnes d’armure autour de quelqu’un qui a dit non, une fois.' },
        { qui: 'dinder', texte: 'Et ce quelqu’un, il est encore là-dedans ?' },
        { qui: 'sbire', texte: 'Plus depuis longtemps. Écarte-toi.' }
      ],
      recit: 'Deux tonnes d’armure, montées autour de quelqu’un qui a dit non une fois.',
      avant: 'Le sol de l’arène se fissure sous son premier pas.' },
    { n: 9, nom: 'L’Ombre du Fondateur', titre: 'Sbire d’élite',
      teinte: '#6a1ad8', taille: 1.02, details: ['fumee', 'cape', 'yeux', 'aura'],
      pv: 2100, coup: [56, 74], drain: true, quete: { bornes: 5, patrouilles: 4 },
      dialogue: [
        { qui: 'sbire', texte: 'Je marche trois pas derrière lui depuis toujours.' },
        { qui: 'dinder', texte: 'Ça ne te fatigue pas ?' },
        { qui: 'sbire', texte: 'Je ne me fatigue pas. Je reprends ce que je vois — à commencer par vos forces.' }
      ],
      recit: 'Il marche trois pas derrière Le Fondateur depuis toujours.',
      avant: 'Il ne t’attaque pas tout de suite. Il te regarde, et il reprend ce qu’il voit.' },
    { n: 10, nom: 'Le Premier Sbire', titre: 'Sbire originel',
      teinte: '#ffd84a', taille: 1.10, details: ['trone', 'couronne', 'cape', 'epaules', 'lame', 'aura'],
      pv: 2500, coup: [60, 80], bouclier: 90, brulure: 12,
      quete: { eclats: 7, bornes: 3, patrouilles: 5, chrono: 120 },
      dialogue: [
        { qui: 'sbire', texte: 'Je suis le premier qu’il ait mis dans une armure.' },
        { qui: 'dinder', texte: 'Tu peux l’enlever.' },
        { qui: 'sbire', texte: 'Non. Elle a mon visage, maintenant. Et lui, il attend derrière cette porte.' }
      ],
      recit: 'Le premier que Le Fondateur a mis dans une armure. Il n’en est jamais ressorti.',
      avant: 'Il retire son casque une seconde. Dessous, un visage de Dinder.' }
  ];

  // L'Effondrement Terminal : Le Fondateur en personne, et ce qu'il a a dire.
  // ==========================================================
  //  La faille du Dr. Islas
  // ==========================================================
  // L'Effondrement Terminal ne se joue qu'avec la Singularity du Dr.
  // Islas : c'est elle qui disparait dans la faille, emportant Le
  // Fondateur. Trois quetes l'en ramenent — mais pas seule.

  var ISLAS = 'dr-islas-singularity';
  var FUSION = 'dr-islas-the-founder';

  // Le nom affiche, pris au carnet : il suit le Dinder si celui-ci change.
  function nomIslas() {
    var d = DP.byId(ISLAS);
    if (!d) return 'le Dinder exigé';
    return d.name + (d.form ? ' ' + d.form : '');
  }

  // Combien de fois il faut retourner dans la faille, apres le sacrifice.
  var RANCON = 3;

  var QUETES = [
    {
      id: 'serment',
      nom: 'Le Serment du Docteur',
      det: 'Mener ' + nomIslas() + ' au niveau ' + NIVEAU_MAX + '. ' +
           'Ce qui revient de la faille doit être au sommet de sa forme.',
      jauge: function () { return { n: niveau(ISLAS), sur: NIVEAU_MAX }; }
    },
    {
      id: 'sceaux',
      nom: 'Les Neuf Sceaux',
      det: 'Abattre les neuf gardiens de l’Odyssée. Chacun scelle une ' +
           'part du vide où la Singularity est tombée.',
      jauge: function () {
        var B = window.BOSS;
        if (!B) return { n: 0, sur: 9 };
        var faits = B.ORDRE.filter(function (id) { return B.vaincu(id); }).length;
        return { n: faits, sur: B.ORDRE.length };
      }
    },
    {
      id: 'rancon',
      nom: 'La Rançon du Vide',
      det: 'Gagner ' + RANCON + ' fois de plus l’Effondrement Terminal avec elle ' +
           'dans l’équipe. La faille ne rend rien sans qu’on y retourne.',
      jauge: function () {
        var f = DP.fusion();
        return { n: Math.max(0, Math.min(RANCON, f.victoires - 1)), sur: RANCON };
      }
    }
  ];

  function quete(id) {
    for (var i = 0; i < QUETES.length; i++) if (QUETES[i].id === id) return QUETES[i];
    return null;
  }

  // Une quete est finie quand sa jauge est pleine — ou qu'on l'a deja
  // inscrite au profil, pour qu'un Dinder remis a zero ne la reprenne pas.
  function queteFaite(id) {
    if (DP.aQuete(id)) return true;
    var q = quete(id);
    if (!q) return false;
    var j = q.jauge();
    if (j.n >= j.sur) { DP.noterQuete(id); return true; }
    return false;
  }

  // L'etat de l'histoire, tel que l'ecran l'affiche.
  function etatFusion() {
    var f = DP.fusion();
    var l = QUETES.map(function (q) {
      var j = q.jauge();
      return { id: q.id, nom: q.nom, det: q.det, n: Math.min(j.n, j.sur), sur: j.sur,
               faite: queteFaite(q.id) };
    });
    return {
      ouverte: f.sacrifice,
      faite: f.faite || DP.has(FUSION),
      victoires: f.victoires,
      quetes: l,
      pretes: l.filter(function (q) { return q.faite; }).length,
      prete: f.sacrifice && !f.faite && l.every(function (q) { return q.faite; })
    };
  }

  // La Singularity est-elle indispensable ici, et l'a-t-on ?
  function exigeIslas(n) { return n === DERNIER; }
  function aIslas() { return DP.has(ISLAS); }

  var FINAL = {
    n: 11, nom: 'Effondrement Terminal', titre: 'Le Fondateur',
    teinte: '#ff2a2a', pv: 4800, coup: [74, 98],
    recit: 'Il n’y a plus de sbire entre vous et lui.',
    dialogue: [
      { qui: 'fondateur', texte: 'Vous avez traversé dix niveaux de mon armée pour venir me dire quoi ?' },
      { qui: 'dinder', texte: 'Que l’omnivers n’a pas besoin de toi.' },
      { qui: 'fondateur', texte: 'L’omnivers est un tiroir renversé. Des mondes qui se recopient, des doubles, des erreurs. Toi, par exemple : je compte trois versions de ton docteur.' },
      { qui: 'dinder', texte: 'Ce sont trois vies. Pas trois erreurs.' },
      { qui: 'fondateur', texte: 'Je ne détruis rien. Je remets de l’ordre. Un seul de chaque, à sa place, pour toujours.' },
      { qui: 'dinder', texte: 'Et qui décide de la place ?' },
      { qui: 'fondateur', texte: 'Celui qui a fondé. Écartez-vous, ou je vous range avec le reste.' },
      { qui: 'dinder', texte: 'Alors range-nous. Si tu peux.' }
    ],
    fin: 'Le Fondateur tombe à genoux. « Vous… laissez le désordre gagner. » ' +
         'Puis il se relève, lentement, et vous suit. Il entre à la collection.'
  };

  function parNiveau(n) {
    if (n === FINAL.n) return FINAL;
    for (var i = 0; i < NIVEAUX.length; i++) if (NIVEAUX[i].n === n) return NIVEAUX[i];
    return null;
  }

  var DERNIER = FINAL.n;

  // Le niveau le plus haut deja franchi, et celui qu'on peut tenter.
  function franchi(n) { return DP.fwNiveau() >= n; }
  function ouvert(n) { return n <= DP.fwNiveau() + 1 && n <= DERNIER; }
  function prochain() { return Math.min(DERNIER, DP.fwNiveau() + 1); }

  // ==========================================================
  //  La planche d'un sbire
  // ==========================================================

  var cacheSbire = {};
  var boiteSbire = null;

  // Ou se tient le corps dans la planche, en fractions de la case. Les
  // pieces s'y accrochent : sans cela, une longue-vue posee "a 60 % de la
  // largeur" atterrit dans le vide a cote de la tete.
  function boite() {
    if (boiteSbire) return boiteSbire;
    var img = chargerSbire();
    if (!img.complete || !img.naturalWidth) return { x: 0.25, y: 0, w: 0.5, h: 1 };
    var L = 96, H = Math.round(L * img.naturalHeight / img.naturalWidth);
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = H;
    var x = cv.getContext('2d');
    if (!x) return { x: 0.25, y: 0, w: 0.5, h: 1 };
    x.drawImage(img, 0, 0, L, H);
    var d;
    try { d = x.getImageData(0, 0, L, H).data; }
    catch (e) { return { x: 0.25, y: 0, w: 0.5, h: 1 }; }
    var x0 = L, y0 = H, x1 = 0, y1 = 0, vu = false;
    for (var yy = 0; yy < H; yy++) {
      for (var xx = 0; xx < L; xx++) {
        if (d[(yy * L + xx) * 4 + 3] < 40) continue;
        vu = true;
        if (xx < x0) x0 = xx;
        if (xx > x1) x1 = xx;
        if (yy < y0) y0 = yy;
        if (yy > y1) y1 = yy;
      }
    }
    if (!vu) return { x: 0.25, y: 0, w: 0.5, h: 1 };
    boiteSbire = { x: x0 / L, y: y0 / H, w: (x1 - x0 + 1) / L, h: (y1 - y0 + 1) / H };
    return boiteSbire;
  }

  function feuilleSbire(n) {
    var def = parNiveau(n);
    if (!def) return null;
    var img = chargerSbire();
    if (!img.complete || !img.naturalWidth) return null;
    if (cacheSbire[n]) return cacheSbire[n];

    var L = 260, H = Math.round(L * img.naturalHeight / img.naturalWidth);
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = H;
    var x = cv.getContext('2d');
    if (!x) return null;

    var pieces = def.details || [];
    // Ce qui se dessine derriere le corps. Le double et le trone en font
    // partie : ils doivent apparaitre dans le dos du sbire.
    var ARRIERE = ['aura', 'cape', 'double', 'trone', 'fumee'];

    // La boite du corps, en pixels de la case, une fois l'echelle prise
    // en compte : c'est la-dessus que les pieces se posent.
    var B0 = boite();
    var ech0 = def.taille || 1;
    var bl = L * ech0, bh2 = H * ech0;
    var bdx = (L - bl) / 2, bdy = H - bh2;
    var B = {
      x: bdx + B0.x * bl, y: bdy + B0.y * bh2,
      w: B0.w * bl, h: B0.h * bh2
    };
    B.cx = B.x + B.w / 2;
    B.droite = B.x + B.w;
    B.bas = B.y + B.h;

    ARRIERE.forEach(function (d) {
      if (pieces.indexOf(d) === -1 || !DETAILS[d]) return;
      x.save();
      DETAILS[d](x, L, H, def.teinte, img, B);
      x.restore();
    });

    // Le corps de l'armure, teinte a la couleur du niveau. Le mode
    // "color" ne change que la teinte : les reflets et les creux de
    // l'armure restent lisibles, et les lignes rouges prennent la
    // couleur du sbire.
    var corps = document.createElement('canvas');
    corps.width = L; corps.height = H;
    var cx = corps.getContext('2d');
    // Chaque sbire a sa carrure : le Colosse tient toute la case, le
    // Guetteur en laisse autour de lui.
    var ech = def.taille || 1;
    var cl = L * ech, ch = H * ech;
    var cdx = (L - cl) / 2, cdy = H - ch;

    if (cx) {
      cx.drawImage(img, 0, 0, L, H);
      if (n !== 1) {
        cx.save();
        cx.globalCompositeOperation = 'color';
        cx.globalAlpha = 0.85;
        cx.fillStyle = def.teinte;
        cx.fillRect(0, 0, L, H);
        cx.globalCompositeOperation = 'destination-in';
        cx.globalAlpha = 1;
        cx.drawImage(img, 0, 0, L, H);
        cx.restore();
      }
      x.drawImage(corps, cdx, cdy, cl, ch);
    } else {
      x.drawImage(img, cdx, cdy, cl, ch);
    }

    // Puis les pieces qui se posent par-dessus.
    pieces.forEach(function (d) {
      if (ARRIERE.indexOf(d) !== -1 || !DETAILS[d]) return;
      x.save();
      DETAILS[d](x, L, H, def.teinte, img, B);
      x.restore();
    });

    cacheSbire[n] = { canvas: cv, L: L, H: H };
    return cacheSbire[n];
  }

  function urlSbire(n) {
    var f = feuilleSbire(n);
    return f ? f.canvas.toDataURL('image/png') : IMG_SBIRE;
  }

  window.FWCAMP = {
    ISLAS: ISLAS, FUSION: FUSION, RANCON: RANCON, QUETES: QUETES,
    nomIslas: nomIslas,
    quete: quete, queteFaite: queteFaite, etatFusion: etatFusion,
    exigeIslas: exigeIslas, aIslas: aIslas,
    NIVEAUX: NIVEAUX, FINAL: FINAL, DERNIER: DERNIER, NIVEAU_MAX: NIVEAU_MAX,
    NIVEAU_ULTIME: NIVEAU_ULTIME, ULTIMES: ULTIMES, FORCE_RARETE: FORCE_RARETE,
    parNiveau: parNiveau, franchi: franchi, ouvert: ouvert, prochain: prochain,
    seuil: seuil, niveauDe: niveauDe, niveau: niveau, etat: etat, force: force,
    coutEvolution: coutEvolution, peutEvoluer: peutEvoluer, evoluer: evoluer,
    pointsDeVie: pointsDeVie, attaques: attaques, ultimeDe: ultimeDe, aUltime: aUltime,
    gagnerXP: gagnerXP, feuilleSbire: feuilleSbire, urlSbire: urlSbire,
    chargerSbire: chargerSbire, IMG_SBIRE: IMG_SBIRE,
    sbirePret: sbirePret, poserSbire: poserSbire
  };
})();
