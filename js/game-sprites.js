// Les sprites de balade du mini-jeu, dessines pixel par pixel.
//
// Ils suivent la grammaire des jeux Pokemon de l'epoque Game Boy Advance :
// un corps chibi de 24 x 34, grosse tete et petit corps, vu de trois quarts
// dessus, avec quatre orientations et quatre poses de marche.
//
// Ce qui fait reconnaitre un Dinder tient a trois choses, communes a
// presque tous : les cheveux en pics, la VISIERE en bandeau sur les yeux,
// et le large sourire. Chaque personnage est ensuite decrit a la main —
// couleur de visiere, oeil decouvert, medaillon, couronne, machoire — au
// lieu d'etre un corps generique repeint, ce qui les rendait
// interchangeables.
(function () {

  var L = 24, H = 34;                    // une case de la planche
  var DIRS = { bas: 0, gauche: 1, droite: 2, haut: 3 };
  var POSES = 4;                         // repos, pas gauche, repos, pas droit

  var DENT = '#f6f8fb';                  // l'email du sourire
  var BOUCHE = '#2a1016';                // l'ombre autour des dents

  // Les silhouettes de cheveux : une hauteur de pic par colonne, de x=5
  // a x=18. C'est ce decoupage en dents de scie qui donne la coiffure.
  var PIQUES = {
    herisse: [1, 4, 2, 5, 3, 6, 3, 5, 2, 4, 3, 5, 2, 1],
    sauvage: [3, 5, 2, 6, 4, 2, 5, 3, 6, 2, 4, 5, 3, 2],
    dresse:  [2, 3, 5, 7, 4, 6, 8, 5, 7, 4, 6, 3, 4, 2],
    court:   [1, 2, 1, 3, 2, 3, 2, 3, 1, 2, 1, 2, 1, 1]
  };

  // ==========================================================
  //  Les treize personnages, decrits a la main
  // ==========================================================
  //
  //  cheveux / cheveux2 : la chevelure, en deux tons pour les bicolores
  //  visiere            : le bandeau ; demi = il ne couvre qu'un oeil
  //  oeil               : l'oeil laisse decouvert, quand il y en a un
  //  torse / accent     : le vetement et sa garniture
  //  medaillon          : la lettre gravee sur le plastron
  //
  var LOOKS = {
    'dr-islas-human-form': {
      piques: 'herisse', cheveux: '#17141c', cheveuxClair: '#3b3547',
      peau: '#f7cfa2', visiere: '#ddd3f4', demi: true, oeil: '#241f2c',
      torse: '#f3effc', accent: '#6d5a9b', bas: '#cec7e3', chaussures: '#2a2338',
      blouse: true, cravate: '#241d33'
    },
    'dr-islas-demicos-form': {
      piques: 'herisse', cheveux: '#17141c', cheveuxClair: '#3b3547',
      peau: '#f8d3ae', visiere: '#ddd3f4', demi: true, oeil: '#241f2c',
      torse: '#8566aa', accent: '#5b4686', bas: '#463857', chaussures: '#221d2d',
      cravate: '#241d33', cerveau: '#f2a8c4'
    },
    'dr-islas-final-form': {
      piques: 'court', cheveux: '#efe8f6', cheveuxClair: '#ffffff',
      peau: '#1a1030', visiere: null,
      torse: '#2a1f4a', accent: '#efe8f6', bas: '#efe8f6', chaussures: '#1a1526',
      capuche: '#efe8f6', capucheOmbre: '#b9aecd', galaxie: true, cape: '#3a2a63'
    },
    'calder-veyne-veinburner': {
      piques: 'herisse', cheveux: '#17141c', cheveuxClair: '#3b3547',
      peau: '#f6c894', visiere: '#f2c53a', demi: true, oeil: '#241f2c',
      torse: '#2f3128', accent: '#4a4d3e', bas: '#242620', chaussures: '#171814',
      veines: '#e0392b', ceinture: true
    },
    'carl-sinars-cardinal-sin': {
      piques: 'herisse', cheveux: '#1d1a1c', cheveuxClair: '#423c3f',
      peau: '#eeb47c', visiere: '#1c1a1f', demi: false, oeil: null,
      torse: '#2b2226', accent: '#8e2230', bas: '#241d20', chaussures: '#161114',
      cravate: '#8e2230'
    },
    'edgar-marks-grincrusher': {
      piques: 'herisse', cheveux: '#17141c', cheveuxClair: '#3b3547',
      peau: '#fbe7d6', visiere: '#1c1a1f', demi: false, oeil: null,
      torse: '#6b2a18', accent: '#b8442e', bas: '#2a1a16', chaussures: '#170f0d',
      machoire: '#c9ccd4'
    },
    'he-melt': {
      piques: 'sauvage', cheveux: '#141318', cheveuxClair: '#37343d',
      peau: '#e9c89b', visiere: null, hurle: true,
      torse: '#37323f', accent: '#5b5468', bas: '#231f2a', chaussures: '#2f2b36',
      fantome: true
    },
    'v': {
      piques: 'dresse', cheveux: '#17141c', cheveuxClair: '#3b3547',
      peau: '#f9cf8f', visiere: '#1c1a1f', demi: false, oeil: null,
      torse: '#1d3a78', accent: '#c9a227', bas: '#8e1f28', chaussures: '#141b2e',
      armure: '#c9a227', medaillon: 'V', medaillonFond: '#8e1f28'
    },
    'a': {
      piques: 'dresse', cheveux: '#8c1410', cheveuxClair: '#c4433a',
      peau: '#f7cc96', visiere: '#b8241c', demi: false, oeil: '#ff5a4a',
      torse: '#7c828e', accent: '#d8dce4', bas: '#2a2d34', chaussures: '#1a1c21',
      armure: '#d8dce4', medaillon: 'A', medaillonFond: '#b8241c'
    },
    'h': {
      piques: 'dresse', cheveux: '#f2c02e', cheveuxClair: '#ffe27a',
      peau: '#f9cd8c', visiere: '#7a3fa8', demi: true, oeil: '#4bf06a',
      torse: '#2f7a3c', accent: '#c9a227', bas: '#6a3d96', chaussures: '#1f2a22',
      armure: '#c9a227', medaillon: 'H', medaillonFond: '#7a3fa8'
    },
    'multinder': {
      piques: 'dresse', cheveux: '#3aa8e8', cheveux2: '#f07a2a',
      cheveuxClair: '#8fd6ff', peau: '#c78a52',
      visiere: '#3ad6f0', demi: true, oeil: '#f2f6ff', visiereLueur: true,
      torse: '#e8edf4', accent: '#5a6270', bas: '#b9c4d2', chaussures: '#3f4652',
      armure: '#c6cfda', cape: '#3aa8e8'
    },
    'gart-kervelor-king-of-karsovia': {
      piques: 'herisse', cheveux: '#a3221a', cheveuxClair: '#d4574a',
      peau: '#f8c788', visiere: '#241a1c', demi: false, oeil: null,
      visiereFente: '#e0392b',
      torse: '#5e1418', accent: '#c9a227', bas: '#3a0f12', chaussures: '#1d0a0c',
      couronne: '#f5c93a', couronneGemme: '#e0453a', cape: '#8e1f28'
    },
    // Les deux formes venues de la faille : la capuche remplace le
    // visage, et pour la fusion l'armure du Fondateur s'y ajoute.
    'dr-islas-singularity': {
      piques: 'court', cheveux: '#451b59', cheveuxClair: '#81648e',
      peau: '#1a0626', visiere: null,
      torse: '#2e113e', accent: '#b45cff', bas: '#1d0a26', chaussures: '#140718',
      capuche: '#3a1450', capucheOmbre: '#220a30', galaxie: true, cape: '#2a0f3a'
    },
    'dr-islas-the-founder': {
      piques: 'court', cheveux: '#2a0167', cheveuxClair: '#6e5298',
      peau: '#160522', visiere: null,
      torse: '#1e0730', accent: '#b45cff', bas: '#180426', chaussures: '#12041a',
      capuche: '#31104a', capucheOmbre: '#1d0629', galaxie: true,
      armure: '#3d2b5c', cape: '#26093a', gemme: '#c86aff'
    },
    // Les cinq derniers arrives.
    'harry-hargrove': {
      piques: 'court', cheveux: '#141318', cheveuxClair: '#34323a',
      peau: '#e8dcc6', visiere: '#1b1a20', demi: false, oeil: null,
      beret: '#23222c',
      torse: '#1d1b22', accent: '#3a3742', bas: '#16151b', chaussures: '#0e0d12',
      cape: '#16151c', gemme: '#e8c65a'
    },
    'marlon-coach': {
      piques: 'court', cheveux: '#141318', cheveuxClair: '#34323a',
      peau: '#1a1920', visiere: '#141319', demi: true, oeil: '#ece7dd',
      beret: '#22212b',
      torse: '#1a191f', accent: '#d8d4cc', bas: '#151419', chaussures: '#0d0c11',
      medaillon: 'M', medaillonFond: '#26252f'
    },
    'baron-zofiax': {
      piques: 'herisse', cheveux: '#17151c', cheveuxClair: '#3b3844',
      peau: '#f7cd93', visiere: '#e3b93a', demi: true, oeil: '#f2e2b0',
      visiereLueur: true,
      torse: '#1e1c22', accent: '#cbbfa6', bas: '#191720', chaussures: '#101017',
      cravate: '#cbbfa6'
    },
    'timeo-traveler': {
      piques: 'dresse', cheveux: '#17141c', cheveux2: '#3aa8e8',
      cheveuxClair: '#8fd6ff', peau: '#f8d0a0',
      visiere: '#e8c24a', demi: true, oeil: '#3ad6f0', visiereLueur: true,
      torse: '#b4712f', accent: '#3aa8e8', bas: '#6d4a24', chaussures: '#2d1c15',
      ceinture: true, gemme: '#3ad6f0'
    },
    'william-batant': {
      piques: 'sauvage', cheveux: '#5a4f45', cheveuxClair: '#8e8176',
      peau: '#8b7a6c', visiere: null,
      oreilles: '#6b5e52',
      torse: '#1f1c1e', accent: '#e6e2dc', bas: '#191618', chaussures: '#0f0d0f',
      cravate: '#131113'
    },
    'lefondateur': {
      piques: 'dresse', cheveux: '#101018', cheveuxClair: '#32323f',
      peau: '#f0b978', visiere: '#c41e12', demi: true, oeil: '#f2a93a',
      visiereLueur: true,
      torse: '#191c26', accent: '#2a6ea8', bas: '#12141b', chaussures: '#0b0d12',
      armure: '#2a3140', gemme: '#ff3a1e'
    },
    // La collection Spookinder. Ce ne sont pas des Dinders a visiere mais
    // des animatroniques : une tete de peluche, un museau, de grands yeux
    // et une rangee de dents (voir animatronique() plus bas).
    'freddy-fazbear': {
      anim: 'ours', fourrure: '#a8582a', museau: '#d89a62', yeux: '#7fd0e8',
      chapeau: '#1c1416', noeud: '#141016',
      torse: '#a8582a', ventre: '#d89a62', accent: '#d89a62',
      bas: '#9a4f25', chaussures: '#7a3c1a', peau: '#a8582a'
    },
    'bonnie-the-bunny': {
      anim: 'lapin', fourrure: '#5a5ab8', museau: '#a8a8e6', yeux: '#e0306a',
      noeud: '#c41e2a',
      torse: '#5a5ab8', ventre: '#a8a8e6', accent: '#a8a8e6',
      bas: '#4e4ea6', chaussures: '#3c3c86', peau: '#5a5ab8'
    },
    'chica-the-chicken': {
      anim: 'poule', fourrure: '#e0c22a', museau: '#f08a1a', yeux: '#d84aa8',
      bavoir: '#f4f2ea', bavoirTexte: '#c838a0',
      torse: '#e0c22a', ventre: '#e0c22a', accent: '#f4f2ea',
      bas: '#f08a1a', chaussures: '#e07a10', peau: '#e0c22a'
    },
    'foxy-the-fox-pirate': {
      anim: 'renard', fourrure: '#b8302a', museau: '#d8a080', yeux: '#f0c020',
      cache: '#141016', crochet: '#b8bcc4',
      torse: '#b8302a', ventre: '#8a2420', accent: '#d8a080',
      bas: '#4a3a30', chaussures: '#2a2226', peau: '#b8302a'
    },
    // Wade and Friends : un loup, un requin, un oiseau, un capybara.
    'wade-wolhunter': {
      anim: 'loup', fourrure: '#7a7c84', museau: '#c8c4bc', yeux: '#f2c41c',
      torse: '#7a7c84', ventre: '#b8b4ac', accent: '#2a2a30',
      bas: '#6a6c74', chaussures: '#3a3a42', peau: '#7a7c84'
    },
    'stephen-sharkodon': {
      anim: 'requin', fourrure: '#8c949e', museau: '#eef0f2', yeux: '#f2c41c',
      torse: '#8c949e', ventre: '#eef0f2', accent: '#2a2a30',
      bas: '#7c848e', chaussures: '#3a3e46', peau: '#8c949e'
    },
    'faith-faisandoir': {
      anim: 'oiseau', fourrure: '#7a88a8', museau: '#e8d8a8', yeux: '#f2c41c',
      torse: '#6a7898', ventre: '#c8d0e0', accent: '#4a5878',
      bas: '#5a6888', chaussures: '#d8c890', peau: '#7a88a8'
    },
    'charlie-capsule': {
      anim: 'capybara', fourrure: '#b0602a', museau: '#8a4a22', yeux: '#f2c41c',
      torse: '#b0602a', ventre: '#c87a40', accent: '#2a2a30',
      bas: '#9a5224', chaussures: '#5a2e14', peau: '#b0602a'
    },
    // Their Creator, tel que sa carte le montre : le masque vert en tete
    // de requin-marteau, quatre hublots cercles de laiton, et le costume
    // vert sur chemise noire, cravate verte, souliers noirs.
    'their-creator': {
      marteau: '#2a9a3e', hublot: '#27c060', laiton: '#c9a227',
      peau: '#f2c49a', visiere: null,
      torse: '#1f8a3a', accent: '#176a2c', bas: '#1c7a33', chaussures: '#101014',
      chemise: '#141318', cravate: '#2fbf55', poignets: '#141318'
    },
    // Azhrakonr, le devoreur : casque a cimier et cornes, visiere de ciel
    // etoile, armure sombre parcourue de bleu. Pas de cheveux ni de
    // sourire : on ne voit jamais que son casque. Pas de cape ni
    // d'epaulieres non plus : il doit garder la carrure des autres.
    'azhrakonr': {
      casque: '#34408c', casqueClair: '#a8b4e8', casqueLueur: '#3fd6ff', casqueVide: '#0d1236',
      piques: 'dresse', cheveux: '#2a3170', cheveuxClair: '#3fd6ff',
      peau: '#20264a', visiere: '#2a5aff', demi: false, oeil: null, visiereLueur: true,
      torse: '#262c5c', accent: '#3fd6ff', bas: '#1c2148', chaussures: '#0c0e22',
      gemme: '#3fd6ff',
      couronne: '#3a4a9a', couronneGemme: '#3fd6ff'
    },
    // Golden Freddy : Freddy en or terni, et deux orbites vides.
    'golden-freddy': {
      anim: 'ours', fourrure: '#b8902a', museau: '#d8b850', yeux: '#f4f0e8',
      orbites: true, chapeau: '#1c1416', noeud: '#141016',
      torse: '#b8902a', ventre: '#d8b850', accent: '#d8b850',
      bas: '#a8822a', chaussures: '#7a5e1a', peau: '#b8902a'
    }
  };

  var DEFAUT = {
    piques: 'herisse', cheveux: '#39323f', cheveuxClair: '#5d5566',
    peau: '#e7be99', visiere: '#2a2a33', demi: false, oeil: null,
    torse: '#5a6078', accent: '#8d93a8', bas: '#3a3d4c', chaussures: '#23242c'
  };

  // Un Dinder ajoute plus tard sans description prend les couleurs
  // relevees automatiquement sur son illustration.
  function look(id) {
    if (LOOKS[id]) return LOOKS[id];
    var p = (window.FW_PALETTES || {})[id];
    if (!p) return DEFAUT;
    return {
      piques: 'herisse', cheveux: p.cheveux, cheveuxClair: p.cheveuxClair,
      peau: p.peau, visiere: '#22202a', demi: false, oeil: null,
      torse: p.vetement, accent: p.accent, bas: p.bas, chaussures: p.chaussures
    };
  }

  function ombre(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * k));
    var b = Math.min(255, Math.round((n & 255) * k));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ==========================================================
  //  Les morceaux du dessin
  // ==========================================================

  // La chevelure : une masse arrondie, surmontee de pics.
  function chevelure(p, c, dos) {
    var pics = PIQUES[c.piques] || PIQUES.herisse;
    var i;

    // Les pics, colonne par colonne. Bicolore : moitie gauche, moitie droite.
    for (i = 0; i < pics.length; i++) {
      var col = (c.cheveux2 && i >= pics.length / 2) ? c.cheveux2 : c.cheveux;
      if (pics[i] > 0) p(5 + i, 8 - pics[i], 1, pics[i], col);
    }

    // La masse : x5..18, arrondie en haut et sur les cotes.
    var g = c.cheveux, d = c.cheveux2 || c.cheveux;
    p(7, 7, 5, 1, g);  p(12, 7, 5, 1, d);
    p(6, 8, 6, 1, g);  p(12, 8, 6, 1, d);
    p(5, 9, 7, 4, g);  p(12, 9, 7, 4, d);
    p(5, 13, 2, 5, g); p(17, 13, 2, 5, d);       // les meches qui encadrent
    p(6, 10, 3, 2, c.cheveuxClair);              // le reflet

    if (dos) {
      p(5, 13, 7, 5, g); p(12, 13, 7, 5, d);
      p(7, 14, 4, 2, c.cheveuxClair);
      // La sangle du bandeau passe derriere le crane : de dos aussi, on
      // reconnait a qui on a affaire.
      if (c.visiere) {
        p(5, 12, 14, 2, ombre(c.visiere, 0.8));
        p(5, 12, 14, 1, c.visiere);
      }
    }
  }

  // Le bandeau sur les yeux : l'element qui identifie un Dinder au premier
  // coup d'oeil, meme reduit a trois pixels de haut.
  function visiere(p, c, profil) {
    if (!c.visiere) return;
    var x0 = profil ? 10 : 4;
    var larg = profil ? 10 : 16;
    if (c.demi) larg = profil ? 6 : 10;

    p(x0, 12, larg, 3, c.visiere);
    p(x0, 12, larg, 1, ombre(c.visiere, 1.45));
    p(x0, 14, larg, 1, ombre(c.visiere, 0.55));
    if (c.visiereLueur) p(x0 + 1, 13, larg - 2, 1, ombre(c.visiere, 1.9));
    if (c.visiereFente) p(x0 + 2, 13, larg - 4, 1, c.visiereFente);

    // De profil, la branche du bandeau file vers l'arriere du crane.
    if (profil) p(5, 13, 5, 1, ombre(c.visiere, 0.75));

    // L'oeil laisse decouvert, a cote du bandeau.
    if (c.demi && c.oeil) {
      var ox = profil ? 17 : 15;
      p(ox, 12, 2, 2, c.oeil);
      p(ox, 12, 1, 1, ombre(c.oeil, 1.6));
    }
  }

  // Un hublot : un anneau de laiton, un verre vert et son reflet.
  function hublot(p, c, x, y) {
    p(x, y, 4, 4, c.laiton);
    p(x, y, 1, 1, ombre(c.marteau, 0.7)); p(x + 3, y, 1, 1, ombre(c.marteau, 0.7));
    p(x, y + 3, 1, 1, ombre(c.marteau, 0.7)); p(x + 3, y + 3, 1, 1, ombre(c.marteau, 0.7));
    p(x + 1, y + 1, 2, 2, c.hublot);
    p(x + 1, y + 1, 1, 1, ombre(c.hublot, 1.9));
  }

  // Le masque de Their Creator : un dome pose sur une barre transversale,
  // comme la tete d'un requin-marteau. Un hublot a chaque bout de la
  // barre, deux sur le devant. De profil, on voit le bout de la barre :
  // un rond, et son hublot en plein milieu.
  function masqueMarteau(p, c, dos, profil) {
    var f = c.marteau, fo = ombre(f, 0.7), fc = ombre(f, 1.3);
    if (profil) {
      p(7, 4, 9, 2, f);                            // le dome
      p(6, 6, 11, 12, f);
      p(8, 17, 8, 2, fo);                          // le menton du masque
      p(7, 5, 5, 1, fc);
      p(6, 6, 1, 11, fo);
      p(3, 8, 5, 6, fo);                           // la barre, vers l'arriere
      p(14, 7, 8, 8, f);                           // son bout, face a nous
      p(14, 7, 8, 1, fc);
      p(14, 14, 8, 1, fo);
      hublot(p, c, 16, 9);
      p(16, 16, 2, 1, fo);                         // la jointure de la machoire
      return;
    }
    p(8, 3, 8, 2, f);                              // le dome
    p(6, 5, 12, 13, f);
    p(8, 17, 8, 2, fo);
    p(9, 4, 4, 1, fc);
    p(17, 6, 1, 11, fo);
    p(1, 8, 22, 6, f);                             // la barre
    p(2, 8, 20, 1, fc);
    p(1, 13, 22, 1, fo);
    if (dos) {
      p(11, 5, 2, 12, fo);                         // la couture du crane
      return;
    }
    // Les bouts de la barre, vus de biais : un rebord de laiton.
    p(1, 9, 1, 4, c.laiton); p(22, 9, 1, 4, c.laiton);
    p(2, 10, 1, 2, c.hublot); p(21, 10, 1, 2, c.hublot);
    hublot(p, c, 7, 10);
    hublot(p, c, 13, 10);
    p(8, 16, 8, 1, fo);                            // la jointure de la machoire
  }

  // ---------- Azhrakonr ----------
  // Ni cheveux ni sourire : un casque et une armure, dessines d'apres son
  // illustration. Ils tiennent dans la place d'un Dinder ordinaire.

  // Une forme par rangees : [y, x debut, x fin].
  function rangees(p, R, col) {
    R.forEach(function (r) { p(r[1], r[0], r[2] - r[1] + 1, 1, col); });
  }

  var DOME_FACE = [[3, 9, 14], [4, 7, 16], [5, 6, 17], [6, 5, 18], [7, 5, 18], [8, 5, 18], [9, 5, 18],
                   [10, 5, 18], [11, 5, 18], [12, 6, 17], [13, 6, 17], [14, 7, 16], [15, 8, 15], [16, 9, 14], [17, 10, 13]];
  var DOME_PROFIL = [[3, 8, 13], [4, 7, 15], [5, 6, 16], [6, 6, 17], [7, 6, 17], [8, 6, 17], [9, 6, 18], [10, 6, 18],
                     [11, 6, 18], [12, 6, 18], [13, 7, 17], [14, 9, 17], [15, 11, 17], [16, 13, 16]];

  // Le casque : un dome arrondi, une crete a trois lames parcourue de
  // bleu, l'anneau du front, deux cornes en croissant, des disques aux
  // tempes, la visiere incurvee — le vide etoile, deux fentes qui
  // luisent — et le masque qui se resserre en pointe sous elle.
  function casqueDevoreur(p, c, dos, profil) {
    var f = c.casque, fo = ombre(f, 0.6), fc = c.casqueClair, l = c.casqueLueur, v = c.casqueVide;
    var lv = ombre(l, 1.5), masque = ombre(fc, 0.62);
    if (profil) {
      rangees(p, DOME_PROFIL, f);
      p(7, 4, 4, 1, fc); p(6, 5, 1, 8, fc); p(18, 9, 1, 4, fo);
      // La crete, vue en long : trois lames, la lueur au milieu.
      p(8, 0, 6, 3, f); p(8, 0, 6, 1, fc); p(9, 1, 4, 1, l); p(12, 1, 1, 1, lv);
      p(14, 1, 1, 2, fo);
      // Le disque de la tempe, et la corne qui en part vers l'arriere
      // pour remonter en croissant.
      p(8, 9, 3, 3, fc); p(9, 10, 1, 1, l);
      [[7, 9], [6, 8], [5, 7], [4, 6], [4, 5], [4, 4], [5, 3], [5, 2]].forEach(function (q, i) {
        p(q[0], q[1], 1, 1, i > 2 && i < 6 ? l : fc);
      });
      p(5, 8, 1, 1, f); p(5, 6, 1, 2, f);
      // La visiere, a l'avant, et le masque en pointe.
      rangees(p, [[8, 13, 18], [9, 13, 18], [10, 14, 18], [11, 15, 18]], v);
      p(13, 8, 6, 1, c.visiere);
      p(15, 9, 1, 1, '#ffffff'); p(17, 11, 1, 1, '#8fb4ff'); p(16, 10, 2, 1, l);
      rangees(p, [[12, 14, 18], [13, 14, 17], [14, 15, 17], [15, 15, 17], [16, 15, 16]], masque);
      p(14, 12, 5, 1, fc); p(16, 13, 1, 3, fo);
      return;
    }
    // Les cornes en croissant : elles sortent des tempes, s'ecartent et
    // remontent ; un liseré bleu les suit.
    var CORNE = [[4, 10], [3, 9], [3, 8], [2, 8], [2, 7], [2, 6], [2, 5], [2, 4], [3, 3], [3, 2], [4, 1]];
    CORNE.forEach(function (q, i) {
      var col = i === 0 || i > 8 ? fc : f;
      p(q[0], q[1], 1, 1, col); p(23 - q[0], q[1], 1, 1, col);
    });
    p(3, 4, 1, 4, l); p(20, 4, 1, 4, l);
    // Le dome.
    rangees(p, DOME_FACE, f);
    p(9, 3, 3, 1, fc); p(7, 4, 2, 1, fc); p(6, 5, 1, 1, fc); p(5, 6, 1, 5, fc);
    p(18, 6, 1, 5, fo); p(17, 12, 1, 2, fo);
    // La crete : trois lames, la grande au milieu.
    p(11, 0, 2, 5, f); p(10, 1, 1, 4, fc); p(13, 1, 1, 4, fo);
    p(11, 0, 1, 4, l); p(12, 0, 1, 4, lv);
    p(9, 2, 1, 2, fo); p(14, 2, 1, 2, fo);
    if (dos) {
      p(11, 5, 2, 12, fo);                         // l'arete du crane
      p(11, 7, 2, 1, l); p(11, 11, 2, 1, l);
      p(6, 9, 12, 1, fo);
      return;
    }
    // L'anneau du front : argent, le coeur bleu.
    p(10, 5, 4, 2, fc); p(11, 5, 2, 1, lv); p(11, 6, 2, 1, l);
    // Les disques des tempes.
    p(5, 8, 2, 3, fc); p(17, 8, 2, 3, fc);
    p(5, 9, 1, 1, l); p(18, 9, 1, 1, l);
    // La visiere incurvee : le vide etoile, deux fentes qui luisent.
    rangees(p, [[8, 7, 16], [9, 7, 16], [10, 8, 15], [11, 9, 14]], v);
    p(7, 8, 10, 1, c.visiere);
    p(8, 9, 1, 1, '#ffffff'); p(15, 9, 1, 1, '#8fb4ff'); p(12, 11, 1, 1, '#ffffff');
    p(9, 10, 2, 1, l); p(13, 10, 2, 1, l);
    // Le masque, qui se resserre en pointe, sa grille et son arete.
    rangees(p, [[12, 8, 15], [13, 8, 15], [14, 9, 14], [15, 10, 13], [16, 11, 12]], masque);
    p(8, 12, 8, 1, fc);
    p(11, 12, 2, 5, fc);
    p(9, 13, 1, 2, fo); p(14, 13, 1, 2, fo);
  }

  // Son armure : des epaulieres rondes cerclees d'argent, l'anneau de la
  // poitrine, une ceinture et son anneau, le tabard central qui luit, un
  // manteau qui s'evase, double d'un ciel etoile, et des bottes blindees.
  function corpsDevoreur(p, c, pas, profil, dos) {
    var f = c.casque, fo = ombre(f, 0.6), fc = c.casqueClair, l = c.casqueLueur, v = c.casqueVide;
    var m = c.torse, mo = ombre(m, 0.7), lv = ombre(l, 1.5);
    var etoile = function (x, y, col) { p(x, y, 1, 1, col || '#ffffff'); };

    if (profil) {
      var av = 12 + (pas > 0 ? 2 : 0), ar = 8 - (pas < 0 ? 2 : 0);
      // Les jambes, puis le manteau par-dessus.
      p(ar, 28, 4, 4, fo); p(av, 28, 4, 4, f);
      p(ar, 32, 5, 2, '#0c0e22'); p(av, 32, 5, 2, '#0c0e22');
      p(av, 32, 5, 1, fc); p(av + 1, 29, 1, 1, l);
      rangees(p, [[19, 8, 16], [20, 7, 16], [21, 7, 16], [22, 7, 16], [23, 7, 16], [24, 6, 16],
                  [25, 6, 16], [26, 5, 15], [27, 4, 15], [28, 4, 13], [29, 3, 11]], m);
      // La doublure etoilee, qui se voit a l'arriere du manteau.
      rangees(p, [[25, 6, 7], [26, 5, 6], [27, 4, 6], [28, 4, 6], [29, 3, 5]], v);
      etoile(5, 27); etoile(6, 25, '#8fb4ff'); etoile(4, 29, '#8fb4ff');
      p(16, 20, 1, 7, mo);
      // L'anneau de la poitrine, de biais, et la ceinture.
      p(14, 20, 2, 3, fc); p(15, 21, 1, 1, l);
      p(7, 25, 10, 1, f); p(14, 25, 2, 1, l);
      // L'epauliere et le bras.
      var b = 20 + (pas > 0 ? 1 : 0);
      p(9, 18, 6, 3, f); p(9, 18, 6, 1, fc); p(10, 20, 4, 1, l);
      p(11, b + 1, 3, 5, m); p(11, b + 4, 3, 1, l);
      p(11, b + 6, 3, 2, f);
      return;
    }

    // Les jambes blindees et leurs bottes.
    var levee = pas < 0 ? 'g' : (pas > 0 ? 'd' : '');
    var bg = levee === 'g' ? 30 : 32, bd = levee === 'd' ? 30 : 32;
    p(7, 28, 4, bg - 28, f); p(13, 28, 4, bd - 28, f);
    p(7, 28, 1, bg - 28, fc); p(13, 28, 1, bd - 28, fc);
    p(8, bg - 2, 2, 1, l); p(14, bd - 2, 2, 1, l);
    p(6, bg, 5, 2, '#0c0e22'); p(13, bd, 5, 2, '#0c0e22');
    p(6, bg, 5, 1, fc); p(13, bd, 5, 1, fc);

    // Le manteau, qui s'evase en bas.
    rangees(p, [[19, 6, 17], [20, 6, 17], [21, 6, 17], [22, 6, 17], [23, 6, 17], [24, 6, 17],
                [25, 6, 17], [26, 5, 18], [27, 5, 18], [28, 4, 19], [29, 4, 19]], m);
    if (dos) {
      // De dos : le manteau ouvert sur le ciel etoile qu'il porte en
      // doublure, et une arete d'argent le long du dos.
      rangees(p, [[21, 8, 15], [22, 8, 15], [23, 8, 15], [24, 7, 16], [25, 7, 16], [26, 7, 16], [27, 6, 17], [28, 6, 17]], v);
      etoile(9, 22); etoile(14, 23, '#8fb4ff'); etoile(11, 25); etoile(8, 27, '#8fb4ff'); etoile(15, 27); etoile(12, 28, '#8fb4ff');
      p(11, 19, 2, 2, fc);
      p(6, 19, 1, 10, fc); p(17, 19, 1, 10, fo);
    } else {
      // Les pans du manteau, doubles d'etoiles, de part et d'autre.
      rangees(p, [[26, 5, 6], [27, 5, 6], [28, 4, 6], [29, 4, 6]], v);
      rangees(p, [[26, 17, 18], [27, 17, 18], [28, 17, 19], [29, 17, 19]], v);
      etoile(5, 28); etoile(18, 27, '#8fb4ff'); etoile(6, 26, '#8fb4ff'); etoile(18, 29);
      p(7, 26, 1, 4, fc); p(16, 26, 1, 4, fc);
      p(17, 19, 1, 7, mo);
      // L'anneau de la poitrine : argent, le vide au milieu, liseré bleu.
      p(10, 19, 4, 4, fc); p(11, 20, 2, 2, l); p(11, 20, 1, 1, v);
      // La ceinture et son anneau.
      p(6, 24, 12, 2, f); p(6, 24, 12, 1, fc);
      p(11, 24, 2, 2, l);
      // Le tabard qui descend, borde d'argent, la lueur au milieu.
      p(10, 26, 4, 4, fo); p(10, 26, 1, 4, fc); p(13, 26, 1, 4, fc);
      p(11, 26, 2, 3, l); p(11, 29, 2, 1, lv);
    }

    // Les epaulieres rondes, cerclees d'argent, un trait bleu.
    [[3, 0], [16, 1]].forEach(function (e) {
      var x = e[0];
      p(x + 1, 18, 3, 1, fc);
      p(x, 19, 5, 3, f);
      p(x, 19, 5, 1, fc);
      p(x + 1, 20, 3, 1, l);
      p(x, 21, 5, 1, fo);
    });
    // Les bras, et les gantelets aux poignets lumineux.
    var gg = 22 + (pas > 0 ? 1 : 0), gd = 22 + (pas < 0 ? 1 : 0);
    p(4, gg, 3, 4, m); p(17, gd, 3, 4, m);
    p(4, gg + 3, 3, 1, l); p(17, gd + 3, 3, 1, l);
    p(4, gg + 4, 3, 2, f); p(17, gd + 4, 3, 2, f);
  }

  // Le sourire : deux rangees de dents cernees de sombre.
  function sourire(p, c, profil) {
    var x0 = profil ? 12 : 8, larg = profil ? 6 : 8;
    p(x0, 16, larg, 1, BOUCHE);
    p(x0, 17, larg, 2, DENT);
    p(x0, 19, larg, 1, BOUCHE);
    for (var i = 1; i < larg; i += 2) p(x0 + i, 17, 1, 2, '#c4ccd6');
  }

  // ==========================================================
  //  Les poses
  // ==========================================================

  function poseDe(i) { return [0, -1, 0, 1][i]; }

  function jambes(p, c, pas, profil) {
    if (c.fantome) {
      p(7, 26, 10, 5, ombre(c.torse, 0.8));
      p(8, 31, 8, 2, c.torse);
      p(10, 33, 4, 1, ombre(c.torse, 0.7));
      return;
    }
    if (profil) {
      var av = 11 + (pas > 0 ? 2 : 0), ar = 7 - (pas < 0 ? 2 : 0);
      p(ar, 27, 5, 5, ombre(c.bas, 0.75));
      p(av, 27, 5, 5, c.bas);
      p(ar, 32, 5, 2, c.chaussures);
      p(av, 32, 6, 2, c.chaussures);
      return;
    }
    var levee = pas < 0 ? 'g' : (pas > 0 ? 'd' : '');
    var bg = levee === 'g' ? 30 : 32, bd = levee === 'd' ? 30 : 32;
    p(7, 27, 5, bg - 26, c.bas);
    p(13, 27, 5, bd - 26, c.bas);
    p(7, bg, 5, 2, c.chaussures);
    p(13, bd, 5, 2, c.chaussures);
  }

  function buste(p, c, pas, profil, dos) {
    var bas = c.blouse ? 30 : 26;
    var x0 = profil ? 7 : 6, larg = profil ? 10 : 12;

    p(x0, 19, larg, bas - 18, c.torse);
    p(x0 + larg - 2, 19, 2, bas - 18, ombre(c.torse, 0.72));
    if (c.blouse) {
      p(11, 21, 1, bas - 20, ombre(c.torse, 0.72));
      p(x0, 19, larg, 2, c.accent);
    }
    if (c.armure) {
      p(3, 19, 5, 4, c.armure);
      p(16, 19, 5, 4, c.armure);
      p(3, 22, 5, 1, ombre(c.armure, 0.6));
      p(16, 22, 5, 1, ombre(c.armure, 0.6));
      p(x0, 19, larg, 2, c.armure);
    }
    if (c.ceinture) p(x0, 24, larg, 2, c.accent);
    // Une veste ouverte sur la chemise : le col en V et ses revers.
    if (c.chemise && !dos && !profil) {
      p(9, 19, 6, 2, c.chemise);
      p(10, 21, 4, 2, c.chemise);
      p(8, 19, 1, 4, c.accent); p(15, 19, 1, 4, c.accent);
      p(9, 21, 1, 2, c.accent); p(14, 21, 1, 2, c.accent);
      p(12, 24, 1, 1, ombre(c.torse, 0.6));        // un bouton
    }
    if (c.chemise && profil && !dos) p(15, 19, 2, 3, c.chemise);
    if (c.cravate && !dos) p(11, 20, 2, 5, c.cravate);

    // Le medaillon grave : la lettre du personnage, lisible en 3 x 5.
    if (c.medaillon && !dos) {
      p(9, 21, 6, 6, c.medaillonFond || '#8e1f28');
      p(9, 21, 6, 1, ombre(c.medaillonFond || '#8e1f28', 1.5));
      lettre(p, c.medaillon, 10, 22, c.accent || '#f5c93a');
    }
    if (c.gemme && !dos) {
      p(10, 21, 4, 4, c.gemme);
      p(10, 21, 4, 1, '#ffd36b');
      p(11, 22, 2, 1, '#fff2c0');
    }
    // Le dome a cerveau de la forme Demicos, sur l'epaule droite.
    if (c.cerveau && !dos) {
      p(17, 18, 6, 6, '#cfe6f7');
      p(18, 19, 4, 4, c.cerveau);
      p(18, 19, 4, 1, ombre(c.cerveau, 1.2));
      p(19, 24, 1, 3, '#7f8a99');
      p(21, 24, 1, 2, '#7f8a99');
    }
    // Les animatroniques : un ventre plus clair, un noeud papillon, le
    // bavoir "Let's Eat!!!" de Chica.
    if (c.anim && !dos) {
      if (c.ventre) p(8, 21, 8, 5, c.ventre);
      if (c.bavoir) {
        p(7, 20, 10, 6, c.bavoir);
        p(8, 22, 8, 1, c.bavoirTexte);
        p(9, 24, 6, 1, c.bavoirTexte);
      }
      if (c.noeud) {
        p(9, 19, 6, 2, c.noeud);
        p(11, 19, 2, 2, ombre(c.noeud, 1.6));
      }
    }
  }

  // Un alphabet minuscule, juste ce qu'il faut pour V, A et H.
  function lettre(p, ch, x, y, col) {
    var G = {
      V: ['101', '101', '101', '101', '010'],
      A: ['010', '101', '111', '101', '101'],
      H: ['101', '101', '111', '101', '101']
    }[ch];
    if (!G) return;
    for (var j = 0; j < G.length; j++)
      for (var i = 0; i < 3; i++)
        if (G[j][i] === '1') p(x + i, y + j, 1, 1, col);
  }

  function bras(p, c, pas, profil) {
    if (profil) {
      var b = 20 + (pas > 0 ? 1 : 0);
      p(12, b, 4, 5, c.torse);
      p(12, b + 5, 4, 2, c.peau);
      return;
    }
    var bg = 20 + (pas > 0 ? 1 : 0), bd = 20 + (pas < 0 ? 1 : 0);
    p(4, bg, 3, 5, c.torse);
    p(17, bd, 3, 5, c.torse);
    p(4, bg + 5, 3, 2, c.peau);
    p(17, bd + 5, 3, 2, c.peau);
    if (c.poignets) { p(4, bg + 4, 3, 1, c.poignets); p(17, bd + 4, 3, 1, c.poignets); }
    // Le crochet de Foxy, a la place de la main droite.
    if (c.crochet) {
      p(17, bd + 5, 3, 2, ombre(c.torse, 0.6));
      p(18, bd + 7, 1, 2, c.crochet);
      p(19, bd + 8, 1, 1, c.crochet);
      p(20, bd + 7, 1, 1, c.crochet);
    }
  }

  // La tete d'un animatronique : peluche, oreilles de l'espece, grands
  // yeux ronds, museau et dents. C'est elle qui fait reconnaitre Freddy,
  // Bonnie, Chica et Foxy a vingt-quatre pixels de large.
  function animatronique(p, c, dos, profil) {
    var f = c.fourrure, fo = ombre(f, 0.72), fc = ombre(f, 1.22);
    var NEZ = '#1a1214', BLANC = '#f4f0e8';

    // Les oreilles, posees avant la tete pour s'y rattacher.
    if (c.anim === 'ours') {
      p(4, 5, 4, 4, f); p(16, 5, 4, 4, f);
      if (!dos) { p(5, 6, 2, 2, c.museau); p(17, 6, 2, 2, c.museau); }
    } else if (c.anim === 'lapin') {
      p(6, 0, 3, 9, f); p(15, 0, 3, 9, f);
      p(6, 0, 3, 1, fc); p(15, 0, 3, 1, fc);
      if (!dos) { p(7, 1, 1, 6, c.museau); p(16, 1, 1, 6, c.museau); }
    } else if (c.anim === 'renard') {
      p(5, 3, 2, 2, f); p(5, 5, 4, 3, f);
      p(17, 3, 2, 2, f); p(15, 5, 4, 3, f);
      if (!dos) { p(6, 5, 2, 2, c.museau); p(16, 5, 2, 2, c.museau); }
    } else if (c.anim === 'poule') {
      p(10, 3, 1, 4, f); p(12, 2, 1, 5, f); p(14, 3, 1, 4, f);
    } else if (c.anim === 'loup') {
      // De grandes oreilles pointues, dressees.
      p(5, 1, 2, 3, f); p(5, 4, 4, 4, f); p(6, 0, 1, 1, f);
      p(17, 1, 2, 3, f); p(15, 4, 4, 4, f); p(17, 0, 1, 1, f);
      if (!dos) { p(6, 3, 2, 4, c.museau); p(16, 3, 2, 4, c.museau); }
    } else if (c.anim === 'requin') {
      // L'aileron, sur le crane.
      p(11, 1, 2, 2, f); p(10, 3, 4, 2, f); p(9, 5, 6, 3, f);
      p(11, 1, 1, 6, fc);
    } else if (c.anim === 'oiseau') {
      // La crete, en plumes herissees.
      p(8, 2, 1, 5, f); p(10, 0, 1, 7, f); p(12, 1, 1, 6, f); p(14, 0, 1, 7, f); p(16, 2, 1, 5, f);
      p(10, 0, 1, 1, fc); p(14, 0, 1, 1, fc);
    } else if (c.anim === 'capybara') {
      // De toutes petites oreilles rondes.
      p(6, 6, 3, 2, f); p(15, 6, 3, 2, f);
      if (!dos) { p(7, 7, 1, 1, c.museau); p(16, 7, 1, 1, c.museau); }
    }

    // La tete, ronde et un peu large.
    var haut = c.anim === 'poule' || c.anim === 'oiseau' ? 6 : 8;
    p(6, haut - 1, 12, 1, f);
    p(5, haut, 14, 18 - haut, f);
    p(7, haut, 6, 1, fc);
    p(17, haut + 1, 2, 17 - haut, fo);
    p(5, 17, 14, 1, fo);

    if (c.chapeau) {
      p(9, 2, 6, 5, c.chapeau);
      p(9, 5, 6, 1, ombre(c.chapeau, 1.8));
      p(8, 7, 8, 1, c.chapeau);
    }
    if (dos) return;

    if (profil) {
      // Un seul oeil, et le museau qui pointe vers l'avant.
      p(13, 10, 3, 3, c.orbites ? '#050405' : BLANC);
      p(15, 11, 1, 1, c.yeux);
      p(14, 13, 6, 4, c.museau);
      p(19, 13, 1, 1, c.anim === 'poule' || c.anim === 'oiseau' ? ombre(c.museau, 0.7) : NEZ);
      p(14, 16, 6, 1, BOUCHE);
      p(15, 15, 4, 1, DENT);
      if (c.cache) p(13, 9, 4, 4, c.cache);
      return;
    }

    // Les yeux, ronds et fixes : ce regard-la fait tout le malaise. Des
    // orbites vides n'ont qu'un point de lumiere tout au fond.
    var fond = c.orbites ? '#050405' : BLANC;
    p(7, 10, 4, 3, fond); p(13, 10, 4, 3, fond);
    if (c.orbites) { p(9, 11, 1, 1, c.yeux); p(15, 11, 1, 1, c.yeux); }
    else { p(8, 11, 2, 1, c.yeux); p(14, 11, 2, 1, c.yeux); }
    if (c.anim === 'ours' || c.anim === 'poule' || c.anim === 'loup' || c.anim === 'oiseau') {
      p(7, 9, 4, 1, NEZ); p(13, 9, 4, 1, NEZ);   // les sourcils
    }
    if (c.cache) {
      p(13, 9, 5, 4, c.cache);
      p(5, 9, 8, 1, c.cache);                     // le cordon
    }

    if (c.anim === 'requin') {
      // Pas de museau : une gueule large, pleine de dents en scie.
      p(6, 13, 12, 4, c.museau);
      p(7, 14, 10, 2, BOUCHE);
      for (var j = 0; j < 10; j += 2) { p(7 + j, 14, 1, 1, DENT); p(8 + j, 15, 1, 1, DENT); }
      return;
    }
    if (c.anim === 'capybara') {
      // Un grand museau carre, le nez tout en haut, deux incisives.
      p(7, 12, 10, 5, c.museau);
      p(9, 12, 6, 1, NEZ);
      p(8, 16, 8, 1, BOUCHE);
      p(11, 16, 1, 1, DENT); p(12, 16, 1, 1, DENT);
      return;
    }
    if (c.anim === 'poule' || c.anim === 'oiseau') {
      // Le bec, ouvert sur une rangee de dents.
      p(8, 13, 8, 2, c.museau);
      p(9, 15, 6, 1, DENT);
      p(9, 16, 6, 2, ombre(c.museau, 0.8));
      return;
    }
    p(8, 13, 8, 4, c.museau);
    p(11, 13, 2, 1, NEZ);
    p(8, 16, 8, 1, BOUCHE);
    for (var i = 0; i < 6; i += 2) p(9 + i, 15, 1, 1, DENT);
    if (c.anim === 'renard' || c.anim === 'loup') {
      // La machoire pend, grande ouverte.
      p(9, 17, 6, 1, BOUCHE);
      p(9, 17, 1, 1, DENT); p(14, 17, 1, 1, DENT);
    }
  }

  // De grandes oreilles, de part et d'autre du crane. Elles se posent
  // avant la chevelure : la masse de cheveux vient ensuite les recouvrir
  // a leur base, et l'oreille parait bien attachee a la tete.
  function oreilles(p, c) {
    var o = c.oreilles;
    p(1, 5, 4, 8, o);
    p(19, 5, 4, 8, o);
    p(1, 5, 4, 1, ombre(o, 1.35));
    p(19, 5, 4, 1, ombre(o, 1.35));
    p(2, 7, 2, 5, ombre(o, 0.62));                // le creux de l'oreille
    p(20, 7, 2, 5, ombre(o, 0.62));
    p(1, 13, 4, 1, ombre(o, 0.5));
    p(19, 13, 4, 1, ombre(o, 0.5));
  }

  // Un beret, pose de biais sur le crane.
  function beret(p, c, dos) {
    var b = c.beret;
    p(6, 5, 12, 3, b);                            // la calotte, bombee
    p(6, 5, 12, 1, ombre(b, 1.45));
    p(4, 7, 16, 2, b);                            // le bord, qui deborde
    p(4, 8, 16, 1, ombre(b, 0.55));
    if (!dos) p(17, 4, 2, 1, ombre(b, 1.5));      // la petite queue
  }

  function tete(p, c, dos, profil) {
    p(11, 18, 3, 2, ombre(c.peau, 0.78));         // le cou
    if (c.anim) return animatronique(p, c, dos, profil);
    if (c.marteau) {
      p(10, 18, 4, 2, c.chemise || '#141318');     // le col noir, sous le masque
      return masqueMarteau(p, c, dos, profil);
    }
    if (c.casque) return casqueDevoreur(p, c, dos, profil);
    if (c.oreilles) oreilles(p, c);

    if (c.capuche) {
      // La capuche remplace la chevelure et encadre un visage d'ombre.
      p(5, 6, 14, 3, c.capuche);
      p(4, 9, 16, 9, c.capuche);
      p(4, 9, 2, 9, c.capucheOmbre);
      p(18, 9, 2, 9, c.capucheOmbre);
      p(5, 6, 14, 1, c.capucheOmbre);
      if (!dos) {
        p(7, 10, 10, 8, c.peau);
        if (c.galaxie) {
          p(8, 12, 3, 1, '#7a4fd0');
          p(12, 14, 4, 1, '#5a3aa8');
          p(9, 15, 2, 1, '#9a6ff0');
          p(10, 11, 1, 1, '#ffffff');
          p(14, 12, 1, 1, '#ffffff');
          p(12, 16, 1, 1, '#e0d0ff');
        }
      }
      if (c.beret) beret(p, c, dos);
      return;
    }

    chevelure(p, c, dos);
    if (c.beret) beret(p, c, dos);
    if (dos) return;

    if (profil) {
      // De profil, le visage est pousse vers l'avant et la masse des
      // cheveux couvre l'arriere du crane : sans ce decalage, le profil se
      // confond avec la face.
      p(10, 10, 9, 8, c.peau);
      p(10, 17, 9, 1, ombre(c.peau, 0.78));
      p(4, 9, 7, 9, c.cheveux);
      p(5, 11, 2, 3, c.cheveuxClair);
      p(19, 13, 1, 2, c.peau);                    // le nez
      p(19, 15, 1, 1, ombre(c.peau, 0.78));
    } else {
      p(6, 10, 12, 8, c.peau);                    // le visage
      p(6, 17, 12, 1, ombre(c.peau, 0.78));
      p(5, 10, 1, 5, c.cheveux);                  // les meches de cote
      p(18, 10, 1, 5, c.cheveux2 || c.cheveux);
    }

    if (c.veines) {                               // les veines de Calder
      var vx = profil ? 2 : 0;
      p(16 + vx, 11, 1, 4, c.veines);
      p(15 + vx, 13, 1, 3, c.veines);
      p(17 + vx - (profil ? 1 : 0), 15, 1, 2, c.veines);
    }

    if (c.hurle) {
      // He Melt ne porte pas de visiere : deux yeux blancs, des coulees
      // noires et une bouche grande ouverte.
      var h0 = profil ? 4 : 0;
      if (!profil) p(8, 12, 3, 3, '#f4f7fb');
      p(14 + h0, 12, 3, 3, '#f4f7fb');
      if (!profil) p(9, 15, 1, 4, '#141318');
      p(15 + h0, 15, 1, 3, '#141318');
      p(10 + h0, 16, 5, 4, BOUCHE);
      p(10 + h0, 16, 5, 1, DENT);
      return;
    }

    visiere(p, c, profil);

    if (c.machoire) {
      // La machoire mecanique d'Edgar : deux rangees de dents d'acier.
      var m0 = profil ? 4 : 0;
      p(6 + m0, 15, 12 - m0, 6, ombre(c.machoire, 0.55));
      p(7 + m0, 16, 10 - m0, 4, c.machoire);
      for (var i = 0; i < (profil ? 3 : 5); i++) {
        p(7 + m0 + i * 2, 16, 1, 2, DENT);
        p(8 + m0 + i * 2, 18, 1, 2, DENT);
      }
      return;
    }

    sourire(p, c, profil);

    if (c.couronne) {
      p(5, 5, 14, 3, c.couronne);
      p(5, 4, 2, 1, c.couronne);
      p(9, 3, 2, 2, c.couronne);
      p(13, 4, 2, 1, c.couronne);
      p(17, 4, 2, 1, c.couronne);
      p(11, 6, 2, 1, c.couronneGemme);
      p(7, 6, 1, 1, c.couronneGemme);
      p(16, 6, 1, 1, c.couronneGemme);
    }
  }

  function dessinerPose(x, c, dir, pas) {
    // Le corps se souleve d'un pixel quand une jambe est levee : c'est ce
    // sautillement qui fait lire la marche.
    var p = function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py + (pas ? -1 : 0), w, h);
    };
    var fixe = function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(px, py, w, h);
    };

    if (c.cape) {
      fixe(3, 18, 18, 12, c.cape);
      fixe(3, 29, 18, 2, ombre(c.cape, 0.65));
      fixe(3, 18, 2, 12, ombre(c.cape, 0.7));
    }

    var profil = dir === DIRS.gauche || dir === DIRS.droite;
    var dos = dir === DIRS.haut;

    if (c.casque) {
      corpsDevoreur(p, c, pas, profil, dos);
      tete(p, c, dos, profil);
      return;
    }

    jambes(p, c, pas, profil);
    buste(p, c, pas, profil, dos);
    bras(p, c, pas, profil);
    tete(p, c, dos, profil);
  }

  // ==========================================================
  //  Le cerne
  //  Un sprite pixel se lit a son contour sombre : sans lui, le
  //  personnage se fond dans l'herbe.
  // ==========================================================

  function cerner(ctx, x0, y0, w, h) {
    var img = ctx.getImageData(x0, y0, w, h);
    var d = img.data;
    var plein = new Uint8Array(w * h);
    var i;
    for (i = 0; i < w * h; i++) plein[i] = d[i * 4 + 3] > 40 ? 1 : 0;

    var c = [23, 20, 31, 255];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        i = y * w + x;
        if (plein[i]) continue;
        var voisin = false;
        for (var k = 0; k < 4; k++) {
          var nx = x + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (plein[ny * w + nx]) { voisin = true; break; }
        }
        if (!voisin) continue;
        d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = c[3];
      }
    }
    ctx.putImageData(img, x0, y0);
  }

  // ==========================================================
  //  La planche complete
  // ==========================================================

  var cache = {};

  function feuille(id) {
    if (cache[id]) return cache[id];

    var c = look(id);
    var cv = document.createElement('canvas');
    cv.width = L * POSES;
    cv.height = H * 4;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;

    ['bas', 'gauche', 'droite', 'haut'].forEach(function (nom) {
      var d = DIRS[nom];
      for (var i = 0; i < POSES; i++) {
        x.save();
        x.beginPath();
        x.rect(i * L, d * H, L, H);
        x.clip();
        if (nom === 'gauche') {
          // Le profil n'est dessine qu'une fois : la gauche en est le miroir.
          x.translate(i * L + L, d * H);
          x.scale(-1, 1);
        } else {
          x.translate(i * L, d * H);
        }
        dessinerPose(x, c, d, poseDe(i));
        x.restore();
        cerner(x, i * L, d * H, L, H);
      }
    });

    cache[id] = { canvas: cv, L: L, H: H, poses: POSES, dirs: DIRS };
    return cache[id];
  }

  // Le portrait seul, pour les listes en HTML : la tete de face, agrandie.
  function portrait(id) {
    var f = feuille(id);
    if (!f) return '';
    var cv = document.createElement('canvas');
    cv.width = L; cv.height = 22;
    var x = cv.getContext('2d');
    if (!x) return '';
    x.imageSmoothingEnabled = false;
    x.drawImage(f.canvas, 0, 0, L, 22, 0, 0, L, 22);
    return cv.toDataURL('image/png');
  }

  // La direction regardee, deduite du deplacement. On privilegie
  // l'horizontale : c'est ce que fait Pokemon quand on va en diagonale.
  function sens(vx, vy, actuel) {
    if (!vx && !vy) return actuel || DIRS.bas;
    if (Math.abs(vx) >= Math.abs(vy)) return vx < 0 ? DIRS.gauche : DIRS.droite;
    return vy < 0 ? DIRS.haut : DIRS.bas;
  }

  window.CHIBI = {
    feuille: feuille, portrait: portrait, sens: sens,
    DIRS: DIRS, LOOKS: LOOKS, TENUES: LOOKS,
    L: L, H: H, POSES: POSES,
    vider: function () { cache = {}; }
  };
})();
