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

  function liste(type) { return type === 'flotteur' ? FLOTTEURS : CANNES; }

  function parId(type, id) {
    var l = liste(type);
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return l[0];
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

  // ---------- Les doublons ----------
  // Un doublon, c'est une prise au-dela de la premiere : le carnet garde
  // toujours l'espece, on ne monnaie que le surplus.

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
    PALIERS: PALIERS, ORDRE_PALIERS: ORDRE_PALIERS,
    liste: liste, parId: parId, equipee: equipee,
    prix: prix, etat: etat, acheter: acheter,
    doublons: doublons, depenserDoublons: depenserDoublons,
    peutVendre: peutVendre, vendre: vendre, palierDeRarete: palierDeRarete,
    couleurPalier: couleurPalier,
    fenetreFerrage: fenetreFerrage, chanceRarete: chanceRarete,
    FENETRE: FENETRE, PENALITE: PENALITE
  };
})();
