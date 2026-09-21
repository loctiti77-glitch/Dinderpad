// Les requins de Fish n'Der, et le duel qui va avec.
//
// On ne les croise que si l'on porte le Pistolet Lumithique, et
// rarement : une ligne sur seize, quand tout va bien. Le duel se joue
// dans l'eau, de profil, au viseur : le flanc encaisse les degats de
// l'arme, les quatre points faibles couleur lave en encaissent le
// triple. Il y a un temps limite ; passe ce delai, la bete plonge et
// l'on en est quitte pour la peur.
//
// Comme le reste du mini-jeu, tout est peint a la volee : une silhouette,
// une palette, un facteur d'echelle par forme.
(function () {
  var DP = window.DP;
  if (!DP) return;

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================
  //  Les cinq formes
  // ==========================================================
  // "pv" est calibre sur les degats de l'arme de meme palier : une forme
  // de son palier se bat serre, une forme au-dessus demande une adresse
  // peu commune ou un niveau de plus.
  //
  // couleurs : dos / flanc / ventre.
  var REQUINS = [
    { id: 'recif', nom: 'Requin de Récif', palier: 1,
      pv: 360, vitesse: 34, echelle: 1.05, duree: 40000, plonge: 9000,
      couleurs: ['#5f7386', '#8fa3b6', '#e4ebf2'], oeil: '#e0a83a',
      credit: 'green', credits: 10, noyaux: 2, poissons: 1,
      texte: 'Petit, nerveux, et déjà trop curieux.' },
    { id: 'mako', nom: 'Mako', palier: 2,
      pv: 680, vitesse: 54, echelle: 1.32, duree: 40000, plonge: 7200,
      couleurs: ['#23538f', '#3f82c8', '#eef4fb'], oeil: '#e8d24a',
      credit: 'blue', credits: 6, noyaux: 3, poissons: 2,
      texte: 'Le plus rapide de tous. Il ne tient jamais en place.' },
    { id: 'tigre', nom: 'Requin-Tigre', palier: 3,
      pv: 1380, vitesse: 46, echelle: 1.6, duree: 42000, plonge: 7800,
      couleurs: ['#5d6238', '#8f9455', '#e8e8cf'], oeil: '#e07a2a',
      credit: 'gold', credits: 3, noyaux: 5, poissons: 3,
      texte: 'Rayé comme son nom, et aussi peu regardant sur ce qu’il avale.' },
    { id: 'blanc', nom: 'Grand Blanc', palier: 4,
      pv: 2750, vitesse: 42, echelle: 1.92, duree: 44000, plonge: 8600,
      couleurs: ['#6d7885', '#a8b4c0', '#fbfdff'], oeil: '#d8452c',
      credit: 'pink', credits: 1, noyaux: 8, poissons: 4,
      texte: 'Celui dont on parle. Il est plus gros que ce qu’on raconte.' },
    { id: 'megalodon', nom: 'Mégalodon', palier: 5,
      pv: 5600, vitesse: 34, echelle: 2.3, duree: 48000, plonge: 9400,
      couleurs: ['#3b3a4e', '#63627e', '#cfcde0'], oeil: '#ff2a1e',
      credit: 'pink', credits: 2, noyaux: 12, poissons: 6,
      texte: 'Il n’aurait pas dû rester un seul de ces lacs assez profond pour lui.' }
  ];

  // Les deux variantes. Elles ne changent pas la forme, seulement la
  // livree, la resistance, et ce qu'elle rapporte.
  var VARIANTES = {
    normal:    { nom: '',          pv: 1,    vitesse: 1,   gain: 1, noyaux: 0 },
    brillant:  { nom: 'Brillant',  pv: 1.4,  vitesse: 1.1, gain: 2, noyaux: 3,
                 couleurs: ['#a8842a', '#f0c85a', '#fff6cf'], oeil: '#ffffff' },
    irradie:   { nom: 'Irradié',   pv: 1.25, vitesse: 1.2, gain: 1, noyaux: 4,
                 couleurs: ['#4a6b16', '#8fbf1e', '#e8ff6a'], oeil: '#eaff3a' }
  };

  var CHANCE_BRILLANT = 32;     // une rencontre sur trente-deux
  var CHANCE_IRRADIE = 0.4;     // en eau fluo seulement
  var CHANCE_RENCONTRE = 16;    // un lancer sur seize, arme au poing

  function parId(id) {
    for (var i = 0; i < REQUINS.length; i++) if (REQUINS[i].id === id) return REQUINS[i];
    return null;
  }

  // Quelle forme se presente. On ne croise jamais plus d'un palier
  // au-dessus de son arme, et rarement : un requin hors de portee n'est
  // pas un defi, c'est une perte de temps.
  var POIDS = [40, 26, 17, 11, 6];

  function tirerForme(niveauArme) {
    var maxi = Math.min(REQUINS.length, (niveauArme || 1) + 1);
    var poids = [], total = 0;
    for (var i = 0; i < maxi; i++) {
      // Au-dessus de son arme, la rencontre reste possible mais rare.
      var w = POIDS[i] * (i + 1 > niveauArme ? 0.25 : 1);
      poids.push(w);
      total += w;
    }
    var d = Math.random() * total;
    for (var k = 0; k < maxi; k++) {
      d -= poids[k];
      if (d <= 0) return REQUINS[k];
    }
    return REQUINS[0];
  }

  function tirerVariante(irradieLac) {
    if (Math.floor(Math.random() * CHANCE_BRILLANT) === 0) return 'brillant';
    if (irradieLac && Math.random() < CHANCE_IRRADIE) return 'irradie';
    return 'normal';
  }

  // La bete que reclame un leurre : la forme est imposee, la variante
  // reste au hasard — un leurre appelle une espece, pas une livree.
  function appeler(id, irradieLac) {
    var f = parId(id) || REQUINS[0];
    return composer(f, tirerVariante(irradieLac));
  }

  function composer(f, v) {
    var m = VARIANTES[v];
    return {
      forme: f, variante: v,
      nom: m.nom ? f.nom + ' ' + m.nom : f.nom,
      pv: Math.round(f.pv * m.pv),
      vitesse: f.vitesse * m.vitesse,
      duree: f.duree,
      couleurs: m.couleurs || f.couleurs
    };
  }

  // La bete telle qu'elle se presente : forme, variante, et ce que ca
  // donne une fois multiplie.
  function tirer(niveauArme, irradieLac) {
    return composer(tirerForme(niveauArme), tirerVariante(irradieLac));
  }

  // ==========================================================
  //  Le dessin de la bete
  // ==========================================================

  // La feuille est longue et basse : c'est le rapport qui fait lire
  // "requin" plutot que "poisson". Le corps court de x = 10 a x = 126,
  // la queue occupe les quarante derniers pixels.
  var L = 168, H = 76;
  var CY = 44;                 // la ligne de flottaison du corps
  var CERNE = [12, 16, 26, 255];

  // L'epaisseur du corps a cette abscisse : nulle au museau, maximale au
  // quart avant, puis un long effilement jusqu'a la queue.
  function galbe(x) {
    var u = (x - 10) / 116;
    if (u < 0 || u > 1) return null;
    var e = Math.sin(Math.pow(u, 0.55) * Math.PI);
    return {
      haut: Math.max(1, Math.round(2 + e * 15)),
      bas:  Math.max(1, Math.round(1 + e * 11))
    };
  }

  // Assombrir ou eclaircir un ton, pour tailler les ombres sans avoir a
  // ecrire trois nuances de plus dans chaque palette.
  function melange(hex, vers, k) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(vers.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k);
    var v = Math.round(((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k);
    var u = Math.round((a & 255) * (1 - k) + (b & 255) * k);
    return 'rgb(' + r + ',' + v + ',' + u + ')';
  }

  // Un triangle de nageoire : elle monte vite, retombe lentement — c'est
  // ce qui lui donne son air de fendre l'eau vers l'arriere.
  function aileron(p, x0, largeur, hauteur, versLeHaut, couleur, pointe) {
    for (var i = 0; i < largeur; i++) {
      var k = i / (largeur - 1);
      var h = Math.round(hauteur * Math.sin(Math.pow(k, pointe || 0.45) * Math.PI));
      if (h <= 0) continue;
      var g = galbe(x0 + i);
      var base = g ? (versLeHaut ? CY - g.haut : CY + g.bas) : CY;
      if (versLeHaut) p(x0 + i, base - h, 1, h + 1, couleur);
      else p(x0 + i, base, 1, h + 1, couleur);
    }
  }

  // ---------- La gueule ----------
  // C'est elle qui fait peur, pas la silhouette. Le maxillaire suit le
  // galbe, la mandibule tombe, et entre les deux s'ouvre un gosier sombre
  // herisse de dents. "ouv" dit de combien elle beance : une bete qui
  // croise en montre deja, une bete qui charge en montre le double.
  var GUEULE_X0 = 17, GUEULE_X1 = 48;
  var GORGE = '#2e0a0f', GORGE_CLAIR = '#5e141c';
  var DENT = '#fbf7ec', DENT_OMBRE = '#c9c2ac';

  function bordsGueule(x, ouv) {
    var u = (GUEULE_X1 - x) / (GUEULE_X1 - GUEULE_X0);   // 1 au museau
    var g = galbe(x) || { haut: 2, bas: 1 };
    return {
      u: u,
      haut: CY - Math.round(g.haut * 0.20) - Math.round(ouv * 0.30 * u),
      bas:  CY + Math.round(g.bas * 0.40) + Math.round(ouv * u)
    };
  }

  function machoire(p, q, ouv) {
    var dos = q.couleurs[0], ventre = q.couleurs[2];
    var sombre = melange(dos, '#000000', 0.45);
    var x, i;

    for (x = GUEULE_X0; x <= GUEULE_X1; x++) {
      var b = bordsGueule(x, ouv);
      if (b.bas <= b.haut) continue;
      // Le fond de la gorge s'assombrit a mesure qu'on s'enfonce.
      p(x, b.haut, 1, b.bas - b.haut + 1,
        b.u > 0.62 ? GORGE_CLAIR : GORGE);
      // La mandibule, sous la gueule : elle a de l'epaisseur.
      p(x, b.bas + 1, 1, 3, ventre);
      p(x, b.bas + 4, 1, 1, sombre);
    }

    // Le liset des gencives, le long des deux machoires : c'est lui qui
    // detache les dents du fond sombre.
    for (x = GUEULE_X0 + 1; x <= GUEULE_X1 - 1; x++) {
      var l = bordsGueule(x, ouv);
      if (l.bas <= l.haut + 2) continue;
      p(x, l.haut + 1, 1, 1, DENT_OMBRE);
      p(x, l.bas - 1, 1, 1, DENT_OMBRE);
    }

    // Les crocs : espaces, isoles, et plus longs a l'avant. Serres, ils
    // ne faisaient qu'une barre blanche.
    for (i = 0; i < 10; i++) {
      var tx = GUEULE_X0 + 3 + i * 4;
      if (tx > GUEULE_X1 - 3) break;
      var t = bordsGueule(tx, ouv);
      var jour = t.bas - t.haut - 3;
      if (jour < 2) continue;
      var h = Math.min(1 + Math.round(2.8 * t.u), Math.floor(jour / 2));
      if (h < 1) continue;
      // En haut, pointe vers le bas.
      p(tx - 1, t.haut + 1, 2, 1, DENT);
      p(tx, t.haut + 2, 1, h, DENT);
      // En bas, pointe vers le haut.
      p(tx - 1, t.bas - 1, 2, 1, DENT);
      p(tx, t.bas - 1 - h, 1, h, DENT);
    }
  }

  // Une silhouette de profil, museau a gauche. "ouv" est la beance de la
  // gueule, en pixels a la pointe du museau.
  function dessiner(p, q, ouv) {
    var dos = q.couleurs[0], flanc = q.couleurs[1], ventre = q.couleurs[2];
    var creux = melange(dos, '#000000', 0.42);
    var arete = melange(dos, '#000000', 0.62);
    var clair = melange(flanc, '#ffffff', 0.35);
    var oeil = q.oeil || '#d8452c';
    var x, i, g;

    // Le corps, en tranches verticales : l'arete du dos, le dos, le
    // flanc clair, le ventre. Le passage dos/flanc est net : c'est ce
    // contraste-la qui donne la masse.
    for (x = 10; x <= 126; x++) {
      g = galbe(x);
      p(x, CY - g.haut, 1, g.haut, dos);
      p(x, CY - g.haut, 1, Math.max(1, Math.round(g.haut * 0.34)), arete);
      var f = Math.round(g.haut * 0.34);
      p(x, CY - f, 1, f + 1, flanc);
      p(x, CY, 1, g.bas, ventre);
      // L'ombre portee sous le ventre.
      p(x, CY + g.bas - 1, 1, 1, melange(ventre, '#000000', 0.3));
    }

    // Trois balafres en travers du flanc : cette bete a deja vecu.
    [[64, -5, 6], [82, 3, 8], [100, -2, 5]].forEach(function (b) {
      for (var k = 0; k < b[2]; k++) {
        p(b[0] + k, CY + b[1] - Math.round(k * 0.7), 1, 1, clair);
      }
    });

    // Les cinq fentes branchiales : courtes, dans le haut du flanc, et
    // penchees vers l'arriere. Descendues jusqu'au ventre, elles
    // faisaient des cotes de squelette.
    var fente = melange(flanc, '#000000', 0.38);
    for (i = 0; i < 5; i++) {
      var bx = 53 + i * 3;
      g = galbe(bx);
      p(bx, CY - Math.round(g.haut * 0.46) + i, 1, Math.round(g.haut * 0.42), fente);
    }

    // La gueule, avant l'oeil : les dents doivent mordre sur le corps.
    machoire(p, q, ouv === undefined ? 5 : ouv);

    // L'arcade sourciliere, lourde, et l'oeil dessous : c'est elle qui
    // fait le regard mauvais. Sans arcade, l'oeil n'est qu'un point.
    p(26, CY - 13, 12, 3, arete);
    p(27, CY - 11, 10, 2, creux);
    p(29, CY - 10, 6, 5, '#07090f');
    p(30, CY - 9, 4, 3, oeil);
    p(31, CY - 8, 2, 1, melange(oeil, '#000000', 0.55));
    p(30, CY - 9, 1, 1, '#ffffff');
    // Une ride qui part de l'oeil vers l'arriere.
    for (i = 0; i < 7; i++) p(38 + i, CY - 11 + Math.round(i * 0.4), 1, 1, creux);

    // Les narines, deux fentes devant l'arcade.
    p(19, CY - 6, 3, 1, creux);
    p(23, CY - 8, 2, 1, creux);

    // L'aileron dorsal : le signe distinctif, cerne d'une arete sombre.
    aileron(p, 58, 28, 23, true, dos, 0.42);
    aileron(p, 58, 28, 23, true, arete, 0.42);
    aileron(p, 59, 26, 20, true, dos, 0.42);
    // Le second dorsal, bien plus bas.
    aileron(p, 104, 12, 7, true, dos, 0.5);
    // Les pectorales, longues et jetees vers l'arriere. Un lisere clair
    // sur l'avant, sans quoi elles se perdent dans le ventre.
    aileron(p, 54, 34, 18, false, arete, 0.32);
    aileron(p, 56, 30, 15, false, melange(dos, '#ffffff', 0.18), 0.32);
    // La pelvienne et l'anale.
    aileron(p, 92, 13, 7, false, dos, 0.5);
    aileron(p, 110, 11, 6, false, dos, 0.5);

    // La queue en croissant : lobe haut long, lobe bas court, et le
    // creux qui les separe.
    for (i = 0; i <= 40; i++) {
      var u = i / 40;
      var haut = Math.round(4 + u * 26);
      var bas = Math.round(2 + u * 16);
      var trou = Math.round(Math.pow(u, 2) * 14);
      if (haut - trou >= 0) p(126 + i, CY - haut, 1, haut - trou + 1, dos);
      if (bas - trou >= 0) p(126 + i, CY + trou, 1, bas - trou + 1, dos);
      if (i % 3 === 0 && haut - trou >= 2) p(126 + i, CY - haut, 1, 2, arete);
    }
  }

  function cerner(ctx) {
    var img = ctx.getImageData(0, 0, L, H);
    var d = img.data;
    var plein = new Uint8Array(L * H), i;
    for (i = 0; i < L * H; i++) plein[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < L; x++) {
        i = y * L + x;
        if (plein[i]) continue;
        var voisin = false;
        for (var k = 0; k < 4; k++) {
          var nx = x + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
          if (nx < 0 || ny < 0 || nx >= L || ny >= H) continue;
          if (plein[ny * L + nx]) { voisin = true; break; }
        }
        if (!voisin) continue;
        d[i * 4] = CERNE[0]; d[i * 4 + 1] = CERNE[1];
        d[i * 4 + 2] = CERNE[2]; d[i * 4 + 3] = CERNE[3];
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var cache = {};

  // Deux beances : celle de la bete qui croise, et celle de la bete qui
  // charge. C'est la seule pose qui change.
  var BEANCE = { calme: 10, charge: 22 };

  function feuille(id, variante, pose) {
    var f = parId(id);
    if (!f) return null;
    var m = VARIANTES[variante] || VARIANTES.normal;
    pose = pose === 'charge' ? 'charge' : 'calme';
    var cle = id + '|' + (variante || 'normal') + '|' + pose;
    if (cache[cle]) return cache[cle];
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = H;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;
    dessiner(function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    }, { couleurs: m.couleurs || f.couleurs, oeil: m.oeil || f.oeil }, BEANCE[pose]);
    cerner(x);
    cache[cle] = { canvas: cv, L: L, H: H };
    return cache[cle];
  }

  function url(id, variante, pose) {
    var f = feuille(id, variante, pose);
    return f ? f.canvas.toDataURL('image/png') : '';
  }

  // ==========================================================
  //  Les quatre points faibles
  // ==========================================================
  // Quatre ancrages le long du corps, en coordonnees relatives a la
  // silhouette. Ils derivent un peu, chacun a son rythme : viser demande
  // de suivre la bete, pas seulement de cliquer dessus.
  var ANCRES = [
    { x: 0.17, y: 0.55, amp: 0.022, vit: 1700 },   // la joue
    { x: 0.42, y: 0.45, amp: 0.026, vit: 2300 },   // la base de l'aileron
    { x: 0.57, y: 0.62, amp: 0.024, vit: 1900 },   // le flanc bas
    { x: 0.70, y: 0.56, amp: 0.020, vit: 2600 }    // la naissance de la queue
  ];

  // ==========================================================
  //  Le duel
  // ==========================================================
  // On rend un objet avec une methode arreter(), et on previent par
  // surFin({ vaincu, bete, recompenses }).

  var CV_L = 480, CV_H = 316;

  function Duel(cfg) {
    var bete = cfg.bete;
    var irradieLac = !!cfg.irradie;
    var A = window.ARME;
    var nv = A ? A.niveau() : { degats: 6, cadence: 620, n: 1 };

    var hote = document.createElement('div');
    hote.className = 'rq';
    hote.dataset.phase = 'ouverture';

    var cv = document.createElement('canvas');
    cv.className = 'rq-cv';
    cv.width = CV_L; cv.height = CV_H;
    hote.appendChild(cv);

    var hud = document.createElement('div');
    hud.className = 'rq-hud';
    hud.innerHTML =
      '<div class="rq-titre"><span class="rq-nom"></span>' +
      '<span class="rq-palier"></span></div>' +
      '<div class="rq-jauge"><div class="rq-jauge-plein"></div>' +
      '<span class="rq-pv"></span></div>' +
      '<div class="rq-temps"><div class="rq-temps-plein"></div></div>';
    hote.appendChild(hud);

    var pied = document.createElement('div');
    pied.className = 'rq-pied';
    pied.innerHTML = '<span class="rq-arme"></span><span class="rq-aide">' +
      'Vise les points orange : ils encaissent le triple.</span>';
    hote.appendChild(pied);

    var fin = document.createElement('div');
    fin.className = 'rq-fin';
    fin.hidden = true;
    hote.appendChild(fin);

    (cfg.parent || document.body).appendChild(hote);

    var ctx = cv.getContext('2d');
    var elNom = hote.querySelector('.rq-nom');
    var elPalier = hote.querySelector('.rq-palier');
    var elPlein = hote.querySelector('.rq-jauge-plein');
    var elPv = hote.querySelector('.rq-pv');
    var elTemps = hote.querySelector('.rq-temps-plein');
    var elArme = hote.querySelector('.rq-arme');
    var elAide = hote.querySelector('.rq-aide');

    elNom.textContent = bete.nom;
    elPalier.textContent = 'Palier ' + bete.forme.palier;
    elArme.textContent = (A ? A.niveau().nom : 'Pistolet') +
                         '  ·  ' + nv.degats + ' / ' + (nv.degats * 3);
    if (bete.variante !== 'normal') hote.dataset.variante = bete.variante;

    // --- L'etat du duel ---
    var pvMax = bete.pv, pv = bete.pv;
    var t0 = 0, dernierTir = -9999, fini = false;
    var etat = 'nage';            // nage | plonge | remonte | fini
    var etatDepuis = 0;
    var prochainePlongee = 0;

    // La bete, en coordonnees du canevas.
    var ech = bete.forme.echelle;
    var largeur = L * ech, hauteur = H * ech;
    var pos = { x: CV_L * 0.62, y: CV_H * 0.56 };
    // Au sommet de sa charge, elle occupe presque tout le cadre : d'ou un
    // grossissement plus fort pour les petites formes que pour le
    // Megalodon, qui le remplit deja.
    var MAX_CHARGE = Math.min(CV_L * 1.15, largeur * 1.8) / largeur;
    var sens = -1;                // -1 : museau a gauche
    var opacite = 1;
    var roulis = 0;               // l'inclinaison, quand elle se retourne
    var finDepuis = 0;

    // Le viseur.
    var viseur = { x: CV_L / 2, y: CV_H / 2 };
    var tirs = [], chiffres = [], eclats = [], sang = [];
    var echelleCharge = 1;

    // --- Les points faibles, en coordonnees du canevas ---
    function pointsFaibles(t) {
      return ANCRES.map(function (a, i) {
        var d = Math.sin(t / a.vit + i * 2.1) * a.amp;
        var rx = (a.x + d) * largeur;
        var ry = (a.y + Math.cos(t / (a.vit * 1.3) + i) * a.amp) * hauteur;
        // Le sprite est dessine museau a gauche : on miroite au besoin.
        var ox = sens < 0 ? rx : largeur - rx;
        return {
          x: pos.x - largeur / 2 + ox,
          y: pos.y - hauteur / 2 + ry,
          r: Math.max(7, 9 * ech)
        };
      });
    }

    // La ligne du corps n'est pas au milieu de la feuille : le dos monte
    // plus haut que le ventre ne descend. On ramene donc la touche sur la
    // vraie ligne de flottaison.
    function centreCorps() { return pos.y + (CY / H - 0.5) * hauteur; }

    function dansLeCorps(x, y) {
      var dx = (x - (pos.x - sens * 0.03 * largeur)) / (largeur * 0.42);
      var dy = (y - centreCorps()) / (hauteur * 0.21);
      return dx * dx + dy * dy <= 1;
    }

    // --- Tirer ---
    function tirerCoup(t) {
      if (fini || t - dernierTir < nv.cadence) return;
      dernierTir = t;
      var x = viseur.x, y = viseur.y;
      tirs.push({ t0: t, x: x, y: y });

      if (etat !== 'nage') {
        chiffres.push({ t0: t, x: x, y: y, txt: 'raté', faible: false, vide: true });
        return;
      }

      var faibles = pointsFaibles(t), touche = null;
      for (var i = 0; i < faibles.length; i++) {
        var f = faibles[i];
        var dx = x - f.x, dy = y - f.y;
        if (dx * dx + dy * dy <= f.r * f.r) { touche = f; break; }
      }

      var degats = 0, faible = false;
      if (touche) { degats = nv.degats * 3; faible = true; }
      else if (dansLeCorps(x, y)) degats = nv.degats;

      if (!degats) {
        chiffres.push({ t0: t, x: x, y: y, txt: 'raté', faible: false, vide: true });
        return;
      }

      pv = Math.max(0, pv - degats);
      chiffres.push({ t0: t, x: x, y: y, txt: '-' + degats, faible: faible });
      eclats.push({ t0: t, x: x, y: y, faible: faible });
      // Le sang : quelques nuages, plus nombreux sur un point faible.
      for (var ns = 0; ns < (faible ? 5 : 2); ns++) {
        sang.push({
          t0: t, x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 10,
          r: 3 + Math.random() * (faible ? 7 : 4),
          dx: (Math.random() - 0.5) * 2, faible: faible
        });
      }
      majJauges();
      if (pv <= 0) terminer(true);
    }

    function majJauges() {
      var k = pv / pvMax;
      elPlein.style.width = (k * 100).toFixed(1) + '%';
      elPlein.dataset.bas = k < 0.25 ? '1' : '0';
      elPv.textContent = pv + ' / ' + pvMax;
    }

    // --- La boucle ---
    var brut = null;

    function image(t) {
      if (fini && !hote.isConnected) return;
      if (!t0) { t0 = t; etatDepuis = t; prochainePlongee = t + bete.forme.plonge; }
      var age = t - t0;
      if (!fini) {
        var reste = Math.max(0, bete.duree - age);
        elTemps.style.width = (reste / bete.duree * 100).toFixed(1) + '%';
        elTemps.dataset.court = reste < 8000 ? '1' : '0';
        if (reste <= 0) terminer(false);
      }

      // L'image suivante est demandee avant de peindre : un seul dessin
      // rate ne doit pas arreter le duel pour de bon.
      brut = requestAnimationFrame(image);
      avancer(t);
      peindre(t);

      var mot = etat === 'charge' ? 'ELLE CHARGE !'
              : 'Vise les points orange : ils encaissent le triple.';
      if (elAide.textContent !== mot) elAide.textContent = mot;
    }

    var MORT = 1100, FUITE = 900;
    // La charge, puis le plongeon et le retour : 520 + 440 + 440 font les
    // mille quatre cents millisecondes qui servaient deja au calcul du
    // temps perdu. Ajouter la charge n'enleve donc rien au joueur.
    var CHARGE = 520, PLONGE = 440;

    function avancer(t) {
      var dt = 1 / 60;

      // Abattue : elle se retourne sur le flanc, s'enfonce et s'efface.
      if (etat === 'mort') {
        var k = Math.min(1, (t - finDepuis) / (reduit ? 1 : MORT));
        roulis = Math.PI * Math.pow(k, 0.7);
        pos.y += 26 * dt * (0.4 + k);
        pos.x += sens * 8 * dt;
        opacite = 1 - Math.pow(k, 2.2) * 0.85;
        return;
      }

      // Le temps a manque : elle pique droit vers le fond.
      if (etat === 'fuite') {
        var k2 = Math.min(1, (t - finDepuis) / (reduit ? 1 : FUITE));
        pos.y += 150 * dt * (0.5 + k2 * 1.6);
        opacite = 1 - k2;
        return;
      }

      if (fini) return;

      if (etat === 'nage') {
        pos.x += sens * bete.vitesse * dt;
        pos.y = CV_H * 0.56 + Math.sin(t / 900) * 12;
        var marge = largeur * 0.45;
        if (pos.x < marge) { pos.x = marge; sens = 1; }
        if (pos.x > CV_L - marge) { pos.x = CV_L - marge; sens = -1; }
        opacite = 1;
        echelleCharge = 1;
        if (t > prochainePlongee) {
          etat = 'charge'; etatDepuis = t;
          hote.classList.add('is-charge');
        }
        return;
      }

      // La charge : elle fonce sur la vitre, gueule ouverte, grossit, et
      // s'en va. Le temps qu'elle prend est celui qu'elle prenait avant a
      // plonger : l'equilibre du duel ne bouge pas.
      if (etat === 'charge') {
        var kc = Math.min(1, (t - etatDepuis) / CHARGE);
        var bosse = Math.sin(kc * Math.PI);
        echelleCharge = 1 + (MAX_CHARGE - 1) * bosse;
        // Elle vient se planter au milieu de la vitre, et repart : une
        // bete qui continuerait sa route en travers ne chargerait rien.
        pos.x += (CV_L / 2 - pos.x) * 0.10;
        pos.y = CV_H * 0.56 + 14 * bosse;
        opacite = 1;
        if (kc >= 1) {
          etat = 'plonge'; etatDepuis = t;
          hote.classList.remove('is-charge');
        }
        return;
      }

      if (etat === 'plonge') {
        var k = Math.min(1, (t - etatDepuis) / PLONGE);
        echelleCharge = 1;
        opacite = 1 - k;
        pos.y += 60 * (1 / 60);
        if (k >= 1) {
          etat = 'remonte'; etatDepuis = t;
          // Elle ressort ailleurs, et dans l'autre sens.
          sens = Math.random() < 0.5 ? -1 : 1;
          pos.x = Math.max(largeur * 0.45,
                  Math.min(CV_L - largeur * 0.45,
                           largeur * 0.5 + Math.random() * (CV_L - largeur)));
          pos.y = CV_H * 0.56;
        }
        return;
      }

      // remonte
      var k2 = Math.min(1, (t - etatDepuis) / PLONGE);
      opacite = k2;
      if (k2 >= 1) {
        etat = 'nage'; etatDepuis = t;
        prochainePlongee = t + bete.forme.plonge * (0.7 + Math.random() * 0.6);
      }
    }

    // --- Peindre ---
    function peindre(t) {
      if (!ctx) return;
      // L'eau, plus sombre vers le fond.
      var g = ctx.createLinearGradient(0, 0, 0, CV_H);
      if (bete.variante === 'irradie' || irradieLac) {
        g.addColorStop(0, '#b6e838'); g.addColorStop(0.42, '#5d8a14');
        g.addColorStop(1, '#1b2a0c');
      } else {
        g.addColorStop(0, '#4f9ae0'); g.addColorStop(0.42, '#1d5aa8');
        g.addColorStop(1, '#06182e');
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CV_L, CV_H);

      // La surface, tout en haut : une bande claire et ses vaguelettes.
      var clair = (bete.variante === 'irradie' || irradieLac) ? '#d8ff6a' : '#a8d8ff';
      ctx.fillStyle = clair;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, 0, CV_L, 3);
      ctx.globalAlpha = 0.24;
      for (var v = 0; v < CV_L; v += 8) {
        var dec = reduit ? 0 : Math.sin((v + t / 9) / 22) * 2;
        ctx.fillRect(v, 3 + Math.round(dec), 5, 2);
      }
      ctx.globalAlpha = 1;

      // Les rais de lumiere qui descendent de la surface.
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = '#eaf7ff';
      for (var r = 0; r < 5; r++) {
        var bx = ((r * 113 + (reduit ? 0 : t / 40)) % (CV_L + 160)) - 80;
        ctx.beginPath();
        ctx.moveTo(bx, 0); ctx.lineTo(bx + 26, 0);
        ctx.lineTo(bx + 70, CV_H); ctx.lineTo(bx + 8, CV_H);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      // Les bulles.
      ctx.fillStyle = 'rgba(224,244,255,.30)';
      for (var b = 0; b < 26; b++) {
        var bxx = (b * 97) % CV_L;
        var byy = CV_H - (((reduit ? b * 40 : t / (9 + (b % 5) * 3) + b * 43)) % (CV_H + 40));
        ctx.fillRect(bxx, byy, 2 + (b % 3), 2 + (b % 3));
      }

      // Le sang, sous la bete : il monte et se dilue.
      for (var sg = sang.length - 1; sg >= 0; sg--) {
        var nu = sang[sg], ans = (t - nu.t0) / 1500;
        if (ans >= 1) { sang.splice(sg, 1); continue; }
        ctx.fillStyle = 'rgba(' + (nu.faible ? '150,14,18' : '116,20,24') +
                        ',' + (0.5 * (1 - ans)).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(nu.x + nu.dx * ans * 26, nu.y - ans * 30,
                nu.r * (1 + ans * 2.4), 0, 6.3);
        ctx.fill();
      }

      // La bete. Gueule beante quand elle charge, et plus grosse : c'est
      // la seule fois ou elle vient vraiment vers le joueur.
      var pose = etat === 'charge' ? 'charge' : 'calme';
      var f = feuille(bete.forme.id, bete.variante, pose);
      if (f) {
        var lg = largeur * echelleCharge, ht = hauteur * echelleCharge;
        ctx.save();
        ctx.globalAlpha = opacite;
        ctx.translate(pos.x, pos.y);
        ctx.scale(sens < 0 ? 1 : -1, 1);
        // Un leger roulis de nage — ou le demi-tour de l'agonie.
        ctx.rotate(roulis || (reduit ? 0 : Math.sin(t / 620) * 0.05));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(f.canvas, -lg / 2, -ht / 2, lg, ht);
        ctx.restore();
      }

      // Le voile rouge de la charge, en bordure d'ecran.
      if (etat === 'charge') {
        var kk = Math.min(1, (t - etatDepuis) / CHARGE);
        // Le voile monte vite et ne redescend qu'a la toute fin : pris au
        // sinus, il n'etait visible qu'un instant au milieu.
        var kv = Math.min(1, kk * 5) * Math.min(1, (1 - kk) * 5);
        var v = ctx.createRadialGradient(CV_L / 2, CV_H / 2, CV_H * 0.12,
                                         CV_L / 2, CV_H / 2, CV_H * 0.88);
        v.addColorStop(0, 'rgba(150,10,14,0)');
        v.addColorStop(0.55, 'rgba(150,10,14,' + (0.30 * kv).toFixed(2) + ')');
        v.addColorStop(1, 'rgba(120,6,10,' + (0.85 * kv).toFixed(2) + ')');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, CV_L, CV_H);
        // Le coup de blanc du depart : c'est lui qui fait sursauter.
        if (kk < 0.14) {
          ctx.fillStyle = 'rgba(255,236,232,' +
            (0.55 * (1 - kk / 0.14)).toFixed(2) + ')';
          ctx.fillRect(0, 0, CV_L, CV_H);
        }
      }

      // La position de la bete et de ses points faibles, inscrites sur le
      // conteneur : c'est ce qui rend le duel verifiable de l'exterieur,
      // comme la phase l'est pour la peche.
      hote.dataset.cible = Math.round(pos.x) + ',' + Math.round(centreCorps());
      hote.dataset.etat = etat;

      // Les points faibles, par-dessus.
      if (etat === 'nage' && !fini) {
        var faibles = pointsFaibles(t);
        hote.dataset.faibles = faibles.map(function (q) {
          return Math.round(q.x) + ',' + Math.round(q.y) + ',' + Math.round(q.r);
        }).join(' ');
        faibles.forEach(function (p2, i) {
          var puls = 0.7 + 0.3 * Math.sin(t / 220 + i);
          var rr = p2.r * (reduit ? 1 : puls);
          var hal = ctx.createRadialGradient(p2.x, p2.y, 0, p2.x, p2.y, rr * 2);
          hal.addColorStop(0, 'rgba(255,168,40,.85)');
          hal.addColorStop(0.5, 'rgba(255,92,20,.45)');
          hal.addColorStop(1, 'rgba(255,60,0,0)');
          ctx.fillStyle = hal;
          ctx.beginPath(); ctx.arc(p2.x, p2.y, rr * 2, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#ffdd7a';
          ctx.beginPath(); ctx.arc(p2.x, p2.y, rr * 0.5, 0, 6.3); ctx.fill();
        });
      }

      // Les tirs, du canon vers la cible.
      for (var k = tirs.length - 1; k >= 0; k--) {
        var s = tirs[k], age = Math.max(0, (t - s.t0) / 190);
        if (age >= 1) { tirs.splice(k, 1); continue; }
        ctx.strokeStyle = 'rgba(124,240,255,' + (1 - age).toFixed(2) + ')';
        ctx.lineWidth = 3 - age * 2;
        ctx.beginPath();
        ctx.moveTo(CV_L / 2, CV_H + 6);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }

      // Les impacts.
      for (k = eclats.length - 1; k >= 0; k--) {
        var e = eclats[k], ag = Math.max(0, (t - e.t0) / 320);
        if (ag >= 1) { eclats.splice(k, 1); continue; }
        ctx.strokeStyle = e.faible
          ? 'rgba(255,150,40,' + (1 - ag).toFixed(2) + ')'
          : 'rgba(180,240,255,' + (1 - ag).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 3 + ag * (e.faible ? 26 : 15), 0, 6.3);
        ctx.stroke();
      }

      // Les chiffres qui montent.
      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.textAlign = 'center';
      for (k = chiffres.length - 1; k >= 0; k--) {
        var c = chiffres[k], a2 = Math.max(0, (t - c.t0) / 800);
        if (a2 >= 1) { chiffres.splice(k, 1); continue; }
        ctx.fillStyle = c.vide ? 'rgba(180,200,215,' + (1 - a2).toFixed(2) + ')'
          : c.faible ? 'rgba(255,176,46,' + (1 - a2).toFixed(2) + ')'
                     : 'rgba(234,247,255,' + (1 - a2).toFixed(2) + ')';
        ctx.fillText(c.txt, c.x, c.y - a2 * 26);
      }
      ctx.textAlign = 'left';

      // Le viseur.
      if (!fini) {
        var pret = t - dernierTir >= nv.cadence;
        ctx.strokeStyle = pret ? '#7cf0ff' : 'rgba(124,240,255,.35)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(viseur.x, viseur.y, 11, 0, 6.3); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(viseur.x - 17, viseur.y); ctx.lineTo(viseur.x - 5, viseur.y);
        ctx.moveTo(viseur.x + 5, viseur.y);  ctx.lineTo(viseur.x + 17, viseur.y);
        ctx.moveTo(viseur.x, viseur.y - 17); ctx.lineTo(viseur.x, viseur.y - 5);
        ctx.moveTo(viseur.x, viseur.y + 5);  ctx.lineTo(viseur.x, viseur.y + 17);
        ctx.stroke();
        if (!pret) {
          var kk = Math.max(0, Math.min(1, (t - dernierTir) / nv.cadence));
          ctx.strokeStyle = '#ffb02e';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(viseur.x, viseur.y, 15, -1.57, -1.57 + kk * 6.283);
          ctx.stroke();
        }
      }
    }

    // --- Les commandes ---
    function versCanevas(ev) {
      var r = cv.getBoundingClientRect();
      var cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      var cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
      viseur.x = Math.max(0, Math.min(CV_L, cx * CV_L / r.width));
      viseur.y = Math.max(0, Math.min(CV_H, cy * CV_H / r.height));
    }

    function surPointeur(ev) { versCanevas(ev); }
    function surClic(ev) {
      ev.preventDefault();
      versCanevas(ev);
      tirerCoup(performance.now());
    }
    function surTouche(ev) {
      var pas = 18;
      if (ev.key === 'ArrowLeft')  { viseur.x = Math.max(0, viseur.x - pas); }
      else if (ev.key === 'ArrowRight') { viseur.x = Math.min(CV_L, viseur.x + pas); }
      else if (ev.key === 'ArrowUp')    { viseur.y = Math.max(0, viseur.y - pas); }
      else if (ev.key === 'ArrowDown')  { viseur.y = Math.min(CV_H, viseur.y + pas); }
      else if (ev.key === ' ' || ev.key === 'Enter') { tirerCoup(performance.now()); }
      else return;
      ev.preventDefault();
    }

    cv.addEventListener('mousemove', surPointeur);
    cv.addEventListener('mousedown', surClic);
    cv.addEventListener('touchstart', surClic, { passive: false });
    cv.addEventListener('touchmove', function (ev) {
      ev.preventDefault(); versCanevas(ev);
    }, { passive: false });
    window.addEventListener('keydown', surTouche);

    // --- La fin ---
    function terminer(vaincu) {
      if (fini) return;
      fini = true;
      // La bete coule, ou plonge, avant que la carte ne tombe : sans ce
      // temps-la, elle disparaitrait d'un coup en pleine nage.
      etat = vaincu ? 'mort' : 'fuite';
      echelleCharge = 1;
      hote.classList.remove('is-charge');
      finDepuis = maintenant();
      hote.dataset.phase = vaincu ? 'victoire' : 'echec';
      var recompenses = vaincu ? recompenser() : null;
      var attente = reduit ? 0 : (vaincu ? MORT - 180 : FUITE - 120);
      setTimeout(function () {
        if (hote.isConnected) montrerFin(vaincu, recompenses);
      }, attente);
      if (cfg.surFin) cfg.surFin({ vaincu: vaincu, bete: bete, recompenses: recompenses });
    }

    function maintenant() {
      return (window.performance && performance.now) ? performance.now() : Date.now();
    }

    // Ce que la bete laisse : des credits, des Noyaux Lumithiques, ce
    // qu'elle avait avale, et parfois un revetement pour l'arme.
    function recompenser() {
      var f = bete.forme, m = VARIANTES[bete.variante];
      var out = { credits: [], noyaux: 0, poissons: [], revetement: null };

      var n = f.credits * m.gain;
      DP.earn(f.credit, n);
      out.credits.push({ cle: f.credit, n: n });

      out.noyaux = Math.round(f.noyaux * m.gain) + m.noyaux;
      DP.gagnerNoyaux(out.noyaux);

      // Ce qu'elle avait dans le ventre : des prises du lac ou elle nage.
      // On passe par le tirage ordinaire, et non par un choix uniforme :
      // sinon le plus petit requin recracherait autant de legendes qu'un
      // Megalodon, et le carnet perdrait tout son sel. Le palier de la
      // bete sert de coup de pouce aux raretes — elle a avale plus gros.
      var P = window.POISSONS;
      if (P) {
        var radio = bete.variante === 'irradie' || irradieLac;
        var chance = (f.palier - 1) / 4;
        for (var i = 0; i < f.poissons * m.gain; i++) {
          var p2 = P.tirer(chance, radio, DP.aPeche);
          var cm = P.taille(p2), kg = P.poids(p2, cm);
          var neuf = !DP.aPeche(p2.id);
          DP.noterPrise(p2.id, cm, kg);
          out.poissons.push({ f: p2, cm: cm, kg: kg, neuf: neuf });
        }
      }

      var A2 = window.ARME;
      if (A2) {
        var rev = A2.revetementPour(f.id, bete.variante);
        if (rev) { DP.acquerirRevetement(rev); out.revetement = A2.revetement(rev); }
      }

      DP.noterRequin(f.id, {
        brillant: bete.variante === 'brillant',
        irradie: bete.variante === 'irradie'
      });
      return out;
    }

    function ligne(cls, txt) {
      var n = document.createElement('p');
      n.className = cls;
      n.textContent = txt;
      return n;
    }

    function montrerFin(vaincu, r) {
      fin.hidden = false;
      fin.textContent = '';
      var carte = document.createElement('div');
      carte.className = 'rq-carte' + (vaincu ? ' is-victoire' : ' is-echec');

      carte.appendChild(ligne('rq-carte-titre', vaincu ? 'ABATTU !' : 'Il a plongé.'));

      var im = document.createElement('img');
      im.className = 'rq-carte-img';
      im.src = url(bete.forme.id, bete.variante);
      im.alt = '';
      carte.appendChild(im);
      carte.appendChild(ligne('rq-carte-nom', bete.nom));

      if (vaincu && r) {
        var butin = document.createElement('div');
        butin.className = 'rq-butin';
        r.credits.forEach(function (c) {
          var l = document.createElement('span');
          l.className = 'rq-gain';
          var ic = document.createElement('img');
          ic.className = 'rq-gain-img';
          ic.src = DP.creditImg(c.cle);
          ic.alt = '';
          l.appendChild(ic);
          l.appendChild(document.createTextNode('× ' + c.n));
          butin.appendChild(l);
        });
        var nn = document.createElement('span');
        nn.className = 'rq-gain rq-gain--noyau';
        nn.textContent = '◈ × ' + r.noyaux;
        butin.appendChild(nn);
        if (r.poissons.length) {
          var pp = document.createElement('span');
          pp.className = 'rq-gain rq-gain--poissons';
          pp.textContent = '🐟 × ' + r.poissons.length;
          butin.appendChild(pp);
        }
        carte.appendChild(butin);

        if (r.poissons.length) {
          carte.appendChild(ligne('rq-carte-txt',
            'Recraché : ' + r.poissons.map(function (x) { return x.f.nom; })
              .filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + '.'));
        }
        if (r.revetement) {
          carte.appendChild(ligne('rq-revetement',
            'Nouveau revêtement : ' + r.revetement.nom));
        }
      } else {
        carte.appendChild(ligne('rq-carte-txt',
          'Le temps a manqué. Elle rôde toujours quelque part sous la surface.'));
      }

      var b = document.createElement('button');
      b.className = 'rq-btn';
      b.type = 'button';
      b.textContent = 'Retourner pêcher';
      b.addEventListener('click', fermer);
      carte.appendChild(b);
      fin.appendChild(carte);
      b.focus();
    }

    function fermer() {
      arreter();
      if (cfg.surSortie) cfg.surSortie();
    }

    function arreter() {
      fini = true;
      hote.classList.remove('is-charge');
      if (brut) cancelAnimationFrame(brut);
      cv.removeEventListener('mousemove', surPointeur);
      cv.removeEventListener('mousedown', surClic);
      window.removeEventListener('keydown', surTouche);
      if (hote.parentNode) hote.parentNode.removeChild(hote);
    }

    majJauges();
    brut = requestAnimationFrame(image);

    return { hote: hote, arreter: arreter, fermer: fermer,
             etat: function () { return { pv: pv, pvMax: pvMax, fini: fini }; } };
  }

  window.REQUIN = {
    LISTE: REQUINS, VARIANTES: VARIANTES, ANCRES: ANCRES,
    CHANCE_RENCONTRE: CHANCE_RENCONTRE,
    CHANCE_BRILLANT: CHANCE_BRILLANT, CHANCE_IRRADIE: CHANCE_IRRADIE,
    parId: parId, tirer: tirer, appeler: appeler, composer: composer,
    tirerForme: tirerForme, tirerVariante: tirerVariante,
    feuille: feuille, url: url, Duel: Duel, L: L, H: H,
    BEANCE: BEANCE, melange: melange,
    vider: function () { cache = {}; }
  };
})();
