// Le materiel de Fish n'Der : cannes, flotteurs, et le commerce qui va
// avec.
//
// Deux axes, deliberement separes :
//   - la CANNE decide de la force du poisson qu'on peut tenir. Plus elle
//     vaut cher, plus les prises lourdes restent maniables.
//   - le FLOTTEUR decide de ce qui vient mordre. Plus il vaut cher, plus
//     les especes rares se presentent.
//
// Tout se paie de deux facons, au choix : en doublons de poissons, ou en
// credits du DinderPad.
(function () {
  var DP = window.DP;
  if (!DP) return;

  // ---------- Les paliers ----------
  // Le prix en credits est celui du DinderPad : 10 Universels, 6
  // Multiversels, 3 Omniversels, 1 Temporel. Le prix en poissons suit la
  // meme echelle, dans la rarete correspondante.
  var PALIERS = {
    commun:  { nom: 'Commun',     rarete: 'commun',  poissons: 5, credit: 'green' },
    peu:     { nom: 'Peu commun', rarete: 'peu',     poissons: 3, credit: 'blue'  },
    rare:    { nom: 'Rare',       rarete: 'rare',    poissons: 2, credit: 'gold'  },
    legende: { nom: 'Légendaire', rarete: 'legende', poissons: 1, credit: 'pink'  },
    // Le materiel irradie se paie en prises irradiees : deux doublons
    // Speciaux, ou un Credit Temporel pour ceux qui sont presses.
    special: { nom: 'Spécial',    rarete: 'special', poissons: 2, credit: 'pink'  }
  };

  var ORDRE_PALIERS = ['commun', 'peu', 'rare', 'legende', 'special'];

  function couleurPalier(cle) {
    var P = window.POISSONS;
    if (!P || !PALIERS[cle]) return '#c7d3de';
    return P.rarete(PALIERS[cle].rarete).couleur;
  }

  // ---------- Les cannes ----------
  // "puissance" annule une part de la resistance du poisson : a 0, on
  // encaisse tout ; a 0,85, presque plus rien.
  var CANNES = [
    { id: 'base', nom: 'Canne d’Origine', palier: null, puissance: 0,
      img: 'assets/items/canne.webp',
      texte: 'Celle qui flottait au bord de l’eau. Elle fait le travail.' },
    { id: 'standard', nom: 'Canne Standard', palier: 'commun', puissance: 0.2,
      img: 'assets/peche/cannes/standard.webp',
      texte: 'Une vraie poignée, un vrai moulinet.' },
    { id: 'azur', nom: 'Canne Azur', palier: 'commun', puissance: 0.2,
      img: 'assets/peche/cannes/azur.webp',
      texte: 'Même tenue que la Standard, en bleu de rivière.' },
    { id: 'emeraude', nom: 'Canne Émeraude', palier: 'peu', puissance: 0.4,
      img: 'assets/peche/cannes/emeraude.webp',
      texte: 'Le blank encaisse sans broncher les belles pièces.' },
    { id: 'amethyste', nom: 'Canne Améthyste', palier: 'rare', puissance: 0.62,
      img: 'assets/peche/cannes/amethyste.webp',
      texte: 'De quoi ramener ce qui vit au fond des lacs.' },
    { id: 'doree', nom: 'Canne Dorée', palier: 'legende', puissance: 0.85,
      img: 'assets/peche/cannes/doree.webp',
      texte: 'Rien de ce qui nage ne lui résiste vraiment.' },
    { id: 'radioactive', nom: 'Canne Radioactive', palier: 'special', puissance: 0.92,
      img: 'assets/peche/cannes/radioactive.webp',
      texte: 'Taillée pour ce qui remonte des eaux fluo.' }
  ];

  // ---------- Les flotteurs ----------
  // "chance" pousse le tirage vers les raretes. Les couleurs servent aussi
  // a peindre le bouchon sur l'eau.
  var FLOTTEURS = [
    { id: 'base', nom: 'Flotteur d’Origine', palier: null, chance: 0,
      img: null, couleurs: ['#e8402f', '#f4f7fb'],
      texte: 'Rouge et blanc. Il flotte, c’est déjà ça.' },
    { id: 'standard', nom: 'Flotteur Standard', palier: 'commun', chance: 0.12,
      img: 'assets/peche/flotteurs/standard.webp', couleurs: ['#2f6fd0', '#e8eef7'],
      texte: 'Attire un peu plus l’œil des espèces discrètes.' },
    { id: 'azur', nom: 'Flotteur Azur', palier: 'commun', chance: 0.12,
      img: 'assets/peche/flotteurs/azur.webp', couleurs: ['#3aa8e8', '#dff4ff'],
      texte: 'Même effet que le Standard, en plus clair.' },
    { id: 'emeraude', nom: 'Flotteur Émeraude', palier: 'peu', chance: 0.3,
      img: 'assets/peche/flotteurs/emeraude.webp', couleurs: ['#3f9c42', '#dff5e0'],
      texte: 'Les espèces peu communes montent nettement plus souvent.' },
    { id: 'amethyste', nom: 'Flotteur Améthyste', palier: 'rare', chance: 0.55,
      img: 'assets/peche/flotteurs/amethyste.webp', couleurs: ['#a05cd8', '#f0e2ff'],
      texte: 'Les raretés se pressent autour de la ligne.' },
    { id: 'doree', nom: 'Flotteur Doré', palier: 'legende', chance: 1,
      img: 'assets/peche/flotteurs/doree.webp', couleurs: ['#f5c93a', '#fff3c8'],
      texte: 'Les légendes elles-mêmes finissent par mordre.' },
    { id: 'radioactif', nom: 'Flotteur Radioactif', palier: 'special', chance: 1,
      img: 'assets/peche/flotteurs/radioactif.webp', couleurs: ['#c8f02a', '#1d2410'],
      texte: 'Dans les eaux fluo, il fait monter le fond du lac.' }
  ];

  // ---------- Les hamecons ----------
  // Troisieme axe, et le seul qui ne se paie pas comme les autres : ces
  // deux-la ne s'achetent pas avec des doublons mais se meritent — il
  // faut d'abord avoir fait quelque chose — puis se paient en credits.
  //
  // "exige" dit la condition prealable, "credit"/"credits" le tarif.
  var HAMECONS = [
    { id: 'base', nom: 'Hameçon d’Origine', palier: null,
      shiny: 1, double: false,
      img: null, couleurs: ['#8c97a5', '#d6dee8'],
      texte: 'Une simple pointe courbe. Elle tient le poisson, c’est tout.' },
    { id: 'rose', nom: 'Hameçon Rose', palier: 'rare',
      shiny: 4, double: false,
      img: 'assets/peche/hamecons/rose.webp', couleurs: ['#e0629a', '#ffd6e8'],
      credit: 'gold', credits: 3,
      exige: { shinys: 1 },
      exigeTexte: 'Avoir déjà sorti un poisson brillant',
      texte: 'Quatre fois plus de chances de voir une seconde livrée.' },
    { id: 'double', nom: 'Double-Hameçon', palier: 'legende',
      shiny: 1, double: true,
      img: 'assets/peche/hamecons/double.webp', couleurs: ['#c9a227', '#f6e7a8'],
      credit: 'blue', credits: 5,
      exige: { doublons: 30 },
      exigeTexte: 'Avoir 30 poissons en double',
      texte: 'Deux pointes, deux prises à chaque ferrage.' }
  ];

  // ---------- Les leurres ----------
  // Ils ne se montent pas : ils se posent, et la bete les emporte. Un
  // leurre garantit la rencontre — y compris avec un requin trop gros
  // pour l'arme du moment, ce que le poissonnier ne manque pas de dire.
  //
  // Le tarif suit le palier du requin appele : le bareme est celui du
  // reste de la boutique, doublons ou credits au choix.
  var LEURRES = [
    { id: 'recif', requin: 'recif', nom: 'Leurre de Récif', palier: 'commun',
      img: 'assets/peche/leurres/recif.webp',
      couleurs: ['#8fa3b6', '#e4ebf2'],
      texte: 'Un petit poisson de fer-blanc. Les jeunes requins s’y trompent.' },
    { id: 'mako', requin: 'mako', nom: 'Leurre à Mako', palier: 'peu',
      img: 'assets/peche/leurres/mako.webp',
      couleurs: ['#3f82c8', '#eef4fb'],
      texte: 'Il file vite sous la surface. Seul un Mako le rattrape.' },
    { id: 'tigre', requin: 'tigre', nom: 'Leurre à Tigre', palier: 'rare',
      img: 'assets/peche/leurres/tigre.webp',
      couleurs: ['#8f9455', '#e8e8cf'],
      texte: 'Rayé, et sentant la charogne. Personne d’autre n’en veut.' },
    { id: 'blanc', requin: 'blanc', nom: 'Leurre à Grand Blanc', palier: 'legende',
      img: 'assets/peche/leurres/blanc.webp',
      couleurs: ['#a8b4c0', '#fbfdff'],
      texte: 'Une silhouette de phoque. Il n’en faut pas plus.' },
    { id: 'megalodon', requin: 'megalodon', nom: 'Leurre à Mégalodon', palier: 'special',
      img: 'assets/peche/leurres/megalodon.webp',
      couleurs: ['#63627e', '#cfcde0'],
      texte: 'Un os. Très vieux. Ce qui répond n’aurait pas dû survivre.' }
  ];

  function liste(type) {
    if (type === 'flotteur') return FLOTTEURS;
    if (type === 'hamecon') return HAMECONS;
    if (type === 'leurre') return LEURRES;
    return CANNES;
  }

  function parId(type, id) {
    var l = liste(type);
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return l[0];
  }

  // La meme recherche, mais qui ne se rabat sur rien : les leurres n'ont
  // pas d'article "par defaut", et vendre un Leurre de Recif a qui en
  // demandait un autre serait pire qu'un refus.
  function trouver(type, id) {
    var l = liste(type);
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }

  function equipee(type) { return parId(type, DP.equipe(type)); }

  // ---------- Ce que le materiel change ----------

  var FENETRE = 1700;                 // le temps pour ferrer, au repos
  var PENALITE = 1200;                // ce qu'un monstre en retire

  // Combien de temps on a pour ferrer une prise de ce poids, avec la
  // canne actuellement montee.
  function fenetreFerrage(kg) {
    var P = window.POISSONS;
    var charge = P ? P.charge(kg) : 0;
    var reste = 1 - equipee('canne').puissance;
    return Math.round(FENETRE - charge * PENALITE * reste);
  }

  function chanceRarete() { return equipee('flotteur').chance; }

  // Le facteur qui divise la chance d'une seconde livree : a 4, un
  // brillant sort une fois sur trente au lieu d'une fois sur cent vingt.
  function chanceShiny() { return equipee('hamecon').shiny || 1; }

  // Le Double-Hameçon ramene deux prises a chaque ferrage.
  function doublePrise() { return !!equipee('hamecon').double; }

  // ---------- Les doublons ----------
  // Un doublon, c'est une prise au-dela de la premiere : le carnet garde
  // toujours l'espece, on ne monnaie que le surplus.

  // Sans rarete, le compte porte sur tout le carnet : c'est ce total-la
  // que le Double-Hameçon exige.
  function doublons(rareteCle) {
    var P = window.POISSONS;
    if (!P) return 0;
    var prises = DP.prises(), n = 0;
    P.LISTE.forEach(function (f) {
      if (rareteCle && f.rarete !== rareteCle) return;
      var e = prises[f.id];
      if (e && e.n > 1) n += e.n - 1;
    });
    return n;
  }

  // Retire n doublons de cette rarete, en commencant par les especes qui
  // en ont le plus. Rend le nombre reellement retire.
  function depenserDoublons(rareteCle, n) {
    var P = window.POISSONS;
    if (!P || n <= 0) return 0;
    var prises = DP.prises();
    var dispo = P.LISTE
      .filter(function (f) {
        return f.rarete === rareteCle && prises[f.id] && prises[f.id].n > 1;
      })
      .sort(function (a, b) { return prises[b.id].n - prises[a.id].n; });

    var reste = n;
    for (var i = 0; i < dispo.length && reste > 0; i++) {
      reste -= DP.retirerPrise(dispo[i].id, reste);
    }
    return n - reste;
  }

  // ---------- Ce qu'un hamecon exige avant de se vendre ----------

  function exigence(item) {
    var e = item.exige;
    if (!e) return { requise: false, remplie: true, texte: '', fait: 0, seuil: 0 };
    if (e.shinys !== undefined) {
      var n = DP.shinys();
      return { requise: true, remplie: n >= e.shinys, texte: item.exigeTexte,
               fait: n, seuil: e.shinys };
    }
    if (e.doublons !== undefined) {
      var d = doublons(null);
      return { requise: true, remplie: d >= e.doublons, texte: item.exigeTexte,
               fait: d, seuil: e.doublons };
    }
    return { requise: false, remplie: true, texte: '', fait: 0, seuil: 0 };
  }

  // Un tarif libre, hors du bareme des paliers : le nombre est ecrit sur
  // l'article et non deduit de sa rarete.
  function peutPayer(item) {
    return DP.creditCount(item.credit) >= item.credits;
  }

  function payer(item) {
    if (!peutPayer(item)) return false;
    if (!DP.UNLIMITED) {
      // On passe par "spend" autant de fois qu'il faut : lui seul sait
      // retirer une carte du solde.
      for (var i = 0; i < item.credits; i++) DP.spend(item.credit);
    }
    return true;
  }

  // Acheter un hamecon : la condition d'abord, le prix ensuite.
  function acheterHamecon(id) {
    var item = trouver('hamecon', id);
    if (!item || !item.palier) return { ok: false, raison: 'pas à vendre' };
    if (DP.possede('hamecon', id)) return { ok: false, raison: 'déjà possédé' };
    var ex = exigence(item);
    if (!ex.remplie) return { ok: false, raison: ex.texte.toLowerCase() };
    if (!peutPayer(item)) return { ok: false, raison: 'crédits manquants' };
    payer(item);
    DP.acquerir('hamecon', id);
    return { ok: true, item: item };
  }

  function etatHamecon(item) {
    if (DP.possede('hamecon', item.id)) {
      return { possede: true, exigence: exigence(item), payable: false };
    }
    var ex = exigence(item);
    return {
      possede: false, exigence: ex,
      payable: ex.remplie && peutPayer(item),
      credits: peutPayer(item)
    };
  }

  // ---------- Les leurres ----------
  // Ils suivent le bareme ordinaire : doublons de la rarete du palier, ou
  // credits. On en achete un a la fois.

  function acheterLeurre(id, mode) {
    var item = trouver('leurre', id);
    if (!item) return { ok: false, raison: 'introuvable' };
    var p = prix(item);
    if (!p) return { ok: false, raison: 'pas à vendre' };

    if (mode === 'poissons') {
      if (doublons(p.rarete) < p.poissons) {
        return { ok: false, raison: 'pas assez de doublons' };
      }
      depenserDoublons(p.rarete, p.poissons);
    } else {
      if (!DP.spend(p.credit)) return { ok: false, raison: 'crédits manquants' };
    }
    var n = DP.ajouterLeurre(id, 1);
    return { ok: true, item: item, prix: p, total: n };
  }

  // ---------- Acheter ----------

  function prix(item) {
    var p = PALIERS[item.palier];
    if (!p) return null;
    return {
      palier: item.palier, nom: p.nom,
      poissons: p.poissons, rarete: p.rarete,
      credit: p.credit, credits: DP.PRICE[p.credit],
      couleur: couleurPalier(item.palier)
    };
  }

  // Ce qu'on peut faire de cet objet, et pourquoi pas.
  function etat(type, item) {
    if (DP.possede(type, item.id)) return { possede: true, poissons: false, credits: false };
    var p = prix(item);
    if (!p) return { possede: false, poissons: false, credits: false, raison: 'introuvable' };
    return {
      possede: false,
      poissons: doublons(p.rarete) >= p.poissons,
      credits: DP.canAfford(p.credit),
      prix: p
    };
  }

  // mode : 'poissons' ou 'credits'.
  function acheter(type, id, mode) {
    var item = parId(type, id);
    if (!item || DP.possede(type, item.id)) return { ok: false, raison: 'déjà possédé' };
    var p = prix(item);
    if (!p) return { ok: false, raison: 'pas à vendre' };

    if (mode === 'poissons') {
      if (doublons(p.rarete) < p.poissons) return { ok: false, raison: 'pas assez de doublons' };
      depenserDoublons(p.rarete, p.poissons);
    } else {
      if (!DP.spend(p.credit)) return { ok: false, raison: 'crédits manquants' };
    }
    DP.acquerir(type, item.id);
    return { ok: true, item: item, prix: p };
  }

  // ---------- Vendre ----------
  // Le meme bareme, dans l'autre sens : cinq doublons communs valent dix
  // Credits Universels, comme une canne commune.

  function peutVendre(rareteCle) {
    var p = PALIERS[palierDeRarete(rareteCle)];
    return !!p && doublons(rareteCle) >= p.poissons;
  }

  function palierDeRarete(rareteCle) {
    for (var i = 0; i < ORDRE_PALIERS.length; i++) {
      if (PALIERS[ORDRE_PALIERS[i]].rarete === rareteCle) return ORDRE_PALIERS[i];
    }
    return 'commun';
  }

  function vendre(rareteCle) {
    var cle = palierDeRarete(rareteCle);
    var p = PALIERS[cle];
    if (doublons(rareteCle) < p.poissons) return { ok: false, raison: 'pas assez de doublons' };
    depenserDoublons(rareteCle, p.poissons);
    var total = DP.earn(p.credit, DP.PRICE[p.credit]);
    return { ok: true, credit: p.credit, gagne: DP.PRICE[p.credit], cagnotte: total };
  }

  window.MATERIEL = {
    CANNES: CANNES, FLOTTEURS: FLOTTEURS,
    HAMECONS: HAMECONS, LEURRES: LEURRES,
    PALIERS: PALIERS, ORDRE_PALIERS: ORDRE_PALIERS,
    chanceShiny: chanceShiny, doublePrise: doublePrise,
    exigence: exigence, peutPayer: peutPayer,
    acheterHamecon: acheterHamecon, etatHamecon: etatHamecon,
    acheterLeurre: acheterLeurre,
    liste: liste, parId: parId, trouver: trouver, equipee: equipee,
    prix: prix, etat: etat, acheter: acheter,
    doublons: doublons, depenserDoublons: depenserDoublons,
    peutVendre: peutVendre, vendre: vendre, palierDeRarete: palierDeRarete,
    couleurPalier: couleurPalier,
    fenetreFerrage: fenetreFerrage, chanceRarete: chanceRarete,
    FENETRE: FENETRE, PENALITE: PENALITE
  };
})();
