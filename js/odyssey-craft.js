// L'inventaire et l'artisanat de l'Odyssee.
//
// Sur les grandes cartes, on ramasse : des filons au pied des rochers,
// des plantes dans les bosquets, des debris dans les ruines, des eclats
// pres des cristaux, et sur chaque monde un gisement qui n'existe que la.
// Les betes abattues laissent des os, du cuir, des ecailles... Des coffres
// dorment un peu partout ; trois par monde sont scelles, derriere de la
// roche, du cristal ou un lac.
//
// Tout va dans un SAC a cases, limite : seize au depart, plus avec les
// sacs qu'on fabrique. Ce qu'on fabrique :
//   - des consommables (soins, bouclier, bombe, grenade de givre,
//     repulsif) pour survivre ;
//   - des outils, qui ouvrent la carte : la pioche casse les rochers, la
//     foreuse les cristaux, les bottes de flottaison marchent sur les
//     liquides, le detecteur montre les coffres sur la mini-carte ;
//   - de l'equipement : une armure (des PV en plus) et un accessoire ;
//   - des sacs plus grands.
// Les objets de collection, eux, vont dans la VITRINE, sans prendre de
// place : une relique par monde, au fond de ses coffres scelles, et dix
// curiosites qu'on trouve au hasard des coffres.
//
// Comme le reste du jeu, rien n'est stocke en image : chaque icone est
// peinte au pixel dans une case de 16 x 16, a partir d'une forme et de
// trois couleurs.
(function () {
  var DP = window.DP;
  if (!DP) return;

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function hasard(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  // ==========================================================
  //  Le catalogue
  // ==========================================================
  // cat : mat (materiau), conso, equip, outil, sac, relique.
  // f : la forme de l'icone ; c : ses trois couleurs (corps, clair, sombre).

  var CATS = {
    mat:     { nom: 'Matériau', pile: 30 },
    conso:   { nom: 'Consommable', pile: 10 },
    equip:   { nom: 'Équipement', pile: 1 },
    outil:   { nom: 'Outil', pile: 1 },
    sac:     { nom: 'Sac', pile: 1 },
    relique: { nom: 'Collection', pile: 1 }
  };

  var LISTE = [
    // ---- Les materiaux communs ----
    { id: 'pierre', nom: 'Pierre', cat: 'mat', f: 'galet', c: ['#8a8680', '#b8b4ac', '#55524e'],
      desc: 'Un caillou bien plein. La base de presque tout.' },
    { id: 'ferraille', nom: 'Ferraille', cat: 'mat', f: 'ferraille', c: ['#8a929c', '#c8d0d8', '#4a5058'],
      desc: 'Des tôles tordues, des boulons. On trouve toujours à s’en servir.' },
    { id: 'fibre', nom: 'Fibre végétale', cat: 'mat', f: 'fibre', c: ['#6a9a3a', '#a8d06a', '#7a5a2a'],
      desc: 'Des tiges souples, tressées en botte.' },
    { id: 'resine', nom: 'Résine', cat: 'mat', f: 'goutte', c: ['#d8901e', '#ffd06a', '#8a5010'],
      desc: 'Une sève épaisse qui colle à tout. Elle durcit à l’air.' },
    { id: 'cristal', nom: 'Cristal brut', cat: 'mat', f: 'cristal', c: ['#7ad0e8', '#d8f6ff', '#3a7a9a'],
      desc: 'Un éclat qui garde un peu de lumière en lui.' },
    { id: 'fer', nom: 'Minerai de fer', cat: 'mat', f: 'minerai', c: ['#6a6460', '#d0805a', '#3a3430'],
      desc: 'Une roche lourde, veinée de rouille.' },
    { id: 'cuivre', nom: 'Minerai de cuivre', cat: 'mat', f: 'minerai', c: ['#6a6460', '#5ad0a0', '#3a3430'],
      desc: 'Des veines vertes dans la pierre : du cuivre.' },
    { id: 'os', nom: 'Os', cat: 'mat', f: 'os', c: ['#e8e0c8', '#ffffff', '#a89878'],
      desc: 'Ce qu’il reste d’une bête. Solide et léger.' },
    { id: 'cuir', nom: 'Cuir épais', cat: 'mat', f: 'cuir', c: ['#8a5a32', '#b8824a', '#5a361a'],
      desc: 'Une peau tannée par un soleil qui n’est pas le nôtre.' },
    { id: 'ecaille', nom: 'Écaille', cat: 'mat', f: 'ecaille', c: ['#3a9a8a', '#7ae0c8', '#1a5a50'],
      desc: 'Dure comme du métal, souple comme du tissu.' },
    { id: 'croc', nom: 'Croc', cat: 'mat', f: 'croc', c: ['#f4ecd8', '#ffffff', '#b8a888'],
      desc: 'Arraché à une mâchoire qui n’en avait pas besoin d’autant.' },
    { id: 'glande', nom: 'Glande volatile', cat: 'mat', f: 'glande', c: ['#7ab83a', '#d0f07a', '#3a6a1a'],
      desc: 'Elle palpite encore. Manipuler avec soin : ça explose.' },
    { id: 'coeur-bete', nom: 'Cœur de bête', cat: 'mat', f: 'coeur', c: ['#c8303a', '#ff7a7a', '#6a1018'],
      desc: 'Le cœur d’une grosse créature. Il bat, lentement.' },
    { id: 'noyau', nom: 'Noyau d’énergie', cat: 'mat', f: 'noyau', c: ['#3ad0ff', '#d8faff', '#2a3a5a'],
      desc: 'Une pile qui ne s’éteint pas. Rare, et précieux.' },
    { id: 'poussiere', nom: 'Poussière d’étoile', cat: 'mat', f: 'poussiere', c: ['#c8a8ff', '#ffffff', '#6a4ac8'],
      desc: 'Elle ne tombe que sur les mondes du système stellaire.' },

    // ---- Les materiaux propres a un monde ----
    { id: 'perle-mercure', nom: 'Perle de mercure', cat: 'mat', f: 'perle', c: ['#c8ccd4', '#ffffff', '#6a6e78'], monde: 'mercure',
      desc: 'Du métal liquide figé en goutte parfaite.' },
    { id: 'soufre', nom: 'Soufre', cat: 'mat', f: 'cristal', c: ['#e8d82a', '#fff8a0', '#8a7a10'], monde: 'venus',
      desc: 'Jaune vif, et cette odeur d’œuf pourri qui ne part pas.' },
    { id: 'bois', nom: 'Bois', cat: 'mat', f: 'bois', c: ['#8a5a2a', '#d8a86a', '#4a2e12'], monde: 'terre',
      desc: 'Une bûche du jardin. Ici, c’est presque exotique.' },
    { id: 'regolithe', nom: 'Régolithe', cat: 'mat', f: 'galet', c: ['#a8a8b0', '#e0e0e8', '#5a5a64'], monde: 'lune',
      desc: 'La poussière grise de la Lune, tassée en bloc.' },
    { id: 'oxyde', nom: 'Oxyde rouge', cat: 'mat', f: 'galet', c: ['#c0502a', '#ff8a5a', '#6a2410'], monde: 'mars',
      desc: 'C’est lui qui rend Mars rouge. Il tache les doigts.' },
    { id: 'ambre', nom: 'Ambre de tempête', cat: 'mat', f: 'ambre', c: ['#e8901e', '#ffd07a', '#8a4a10'], monde: 'jupiter',
      desc: 'Un éclair est resté pris dedans.' },
    { id: 'glace-anneau', nom: 'Glace d’anneau', cat: 'mat', f: 'eclat', c: ['#e8e0c8', '#ffffff', '#a8987a'], monde: 'saturne',
      desc: 'Un morceau des anneaux de Saturne. Il ne fond pas.' },
    { id: 'cristal-glace', nom: 'Cristal de glace', cat: 'mat', f: 'cristal', c: ['#8ae0f0', '#ffffff', '#3a8aa8'], monde: 'uranus',
      desc: 'Froid à brûler les doigts à travers le gant.' },
    { id: 'perle-abysse', nom: 'Perle abyssale', cat: 'mat', f: 'perle', c: ['#3a5ad8', '#a8c0ff', '#1a2a6a'], monde: 'neptune',
      desc: 'Elle luit faiblement, comme le fond d’un océan.' },
    { id: 'givre', nom: 'Givre éternel', cat: 'mat', f: 'flocon', c: ['#c8e8ff', '#ffffff', '#6a9ac8'], monde: 'cryos',
      desc: 'Un flocon qui ne fondra jamais. Il refroidit l’air autour.' },
    { id: 'nacre', nom: 'Nacre', cat: 'mat', f: 'nacre', c: ['#f0d8e8', '#ffffff', '#b898b8'], monde: 'opaline',
      desc: 'Irisée, lisse, et pourtant dure comme la pierre.' },
    { id: 'amethyste', nom: 'Améthyste mauve', cat: 'mat', f: 'cristal', c: ['#8a4ac8', '#d8a8ff', '#4a1a7a'], monde: 'altera',
      desc: 'La même couleur que le nain de jardin. Coïncidence ?' },
    { id: 'seve', nom: 'Sève luminescente', cat: 'mat', f: 'goutte', c: ['#5ae87a', '#e0ffa8', '#1a8a3a'], monde: 'viridia',
      desc: 'Elle éclaire la jungle la nuit. Elle soigne aussi.' },
    { id: 'lingot', nom: 'Lingot natif', cat: 'mat', f: 'lingot', c: ['#9aa4b0', '#e0e8f0', '#4a525c'], monde: 'ferron',
      desc: 'Du fer si pur qu’il sort du sol déjà en barre.' },
    { id: 'eclat-vide', nom: 'Éclat du vide', cat: 'mat', f: 'eclat', c: ['#2a1a3a', '#ff5aa8', '#0a0410'], monde: 'brisure',
      desc: 'Un morceau de rien. Il pèse plus lourd qu’il ne devrait.' },
    { id: 'sable-chantant', nom: 'Sable chantant', cat: 'mat', f: 'sable', c: ['#e8c87a', '#fff0c0', '#a8884a'], monde: 'pyrrhe',
      desc: 'Il fredonne quand on le verse.' },
    { id: 'braise', nom: 'Braise vive', cat: 'mat', f: 'braise', c: ['#ff5a14', '#ffe08a', '#6a1a0a'], monde: 'ignis',
      desc: 'Elle ne s’éteint pas, même au fond du sac.' },

    // ---- Les consommables ----
    { id: 'bandage', nom: 'Bandage', cat: 'conso', f: 'bandage', c: ['#f0ece0', '#ffffff', '#e03a3a'],
      soin: 25, desc: 'Rend 25 PV.' },
    { id: 'trousse', nom: 'Trousse de soin', cat: 'conso', f: 'trousse', c: ['#f0ece0', '#ffffff', '#e03a3a'],
      soin: 60, desc: 'Rend 60 PV.' },
    { id: 'elixir', nom: 'Élixir stellaire', cat: 'conso', f: 'fiole', c: ['#8a6ae8', '#e0d0ff', '#4a2a8a'],
      soin: 999, regen: 30, desc: 'Rend tous les PV, puis soigne vite pendant 30 secondes.' },
    { id: 'bouclier', nom: 'Bouclier portatif', cat: 'conso', f: 'bouclier', c: ['#5a8ac8', '#a8d0ff', '#2a4a7a'],
      bouclier: 50, desc: 'Absorbe les 50 prochains points de dégâts.' },
    { id: 'bombe', nom: 'Bombe', cat: 'conso', f: 'bombe', c: ['#2a2a32', '#6a6a78', '#ff9a2a'],
      bombe: 90, desc: 'Inflige 90 dégâts à toutes les créatures proches.' },
    { id: 'grenade-givre', nom: 'Grenade de givre', cat: 'conso', f: 'bombe', c: ['#5aa8e0', '#e0f4ff', '#c8f0ff'],
      givre: 6, desc: 'Fige les créatures proches pendant 6 secondes.' },
    { id: 'repulsif', nom: 'Répulsif', cat: 'conso', f: 'spray', c: ['#d8c82a', '#fff8a0', '#5a5a20'],
      repulsif: 20, desc: 'Les créatures te fuient pendant 20 secondes.' },

    // ---- L'equipement ----
    { id: 'armure-ferraille', nom: 'Armure de ferraille', cat: 'equip', place: 'armure', f: 'armure', c: ['#8a929c', '#c8d0d8', '#4a5058'],
      pv: 25, desc: '+25 PV max. Bruyante, mais elle tient.' },
    { id: 'armure-ecailles', nom: 'Armure d’écailles', cat: 'equip', place: 'armure', f: 'armure', c: ['#3a9a8a', '#7ae0c8', '#1a5a50'],
      pv: 55, desc: '+55 PV max. Souple et dure à la fois.' },
    { id: 'armure-astrale', nom: 'Armure astrale', cat: 'equip', place: 'armure', f: 'armure', c: ['#4a4ad8', '#c8b8ff', '#1a1a5a'],
      pv: 100, desc: '+100 PV max. Forgée dans un métal d’ailleurs.' },
    { id: 'amulette-vie', nom: 'Amulette de vie', cat: 'equip', place: 'accessoire', f: 'amulette', c: ['#e8c84a', '#ff7a7a', '#8a6a1a'],
      regen: 3, desc: 'Les PV remontent trois fois plus vite, et plus tôt.' },
    { id: 'bottes-course', nom: 'Bottes de course', cat: 'equip', place: 'accessoire', f: 'bottes', c: ['#c8402a', '#ff8a5a', '#5a1a10'],
      vitesse: 1.3, desc: 'Tu marches 30 % plus vite.' },
    { id: 'anneau-ambre', nom: 'Anneau d’ambre', cat: 'equip', place: 'accessoire', f: 'anneau', c: ['#c8a040', '#ffb02a', '#6a5018'],
      degats: 1.3, desc: 'Ton pistolet fait 30 % de dégâts en plus.' },

    // ---- Les outils ----
    { id: 'pioche', nom: 'Pioche', cat: 'outil', f: 'pioche', c: ['#9aa4b0', '#e0e8f0', '#7a5a2a'],
      desc: 'Casse les rochers : face à un rocher, MINER. Ouvre des passages, et les poches murées de roche.' },
    { id: 'foreuse', nom: 'Foreuse à cristaux', cat: 'outil', f: 'foreuse', c: ['#e8a82a', '#fff0a0', '#5a5a64'],
      desc: 'Perce les cristaux : face à un cristal, FORER. Ouvre les poches murées de cristal.' },
    { id: 'bottes', nom: 'Bottes de flottaison', cat: 'outil', f: 'bottes', c: ['#3a8ad8', '#a8e0ff', '#1a3a6a'],
      desc: 'Tu marches sur les liquides — lacs, lave, acide. Plus rien ne t’arrête.' },
    { id: 'detecteur', nom: 'Détecteur', cat: 'outil', f: 'detecteur', c: ['#5a6070', '#7af0a8', '#2a2e38'],
      desc: 'Montre les coffres sur la mini-carte, même ceux qu’on n’a pas encore vus.' },

    // ---- Les sacs ----
    { id: 'sac-toile', nom: 'Sac de toile', cat: 'sac', f: 'sac', c: ['#c8a870', '#f0dca8', '#7a5a2a'],
      taille: 24, desc: 'Ton sac passe à 24 cases.' },
    { id: 'sac-renforce', nom: 'Sac renforcé', cat: 'sac', f: 'sac', c: ['#8a5a32', '#c8945a', '#4a2a12'],
      taille: 32, desc: 'Ton sac passe à 32 cases.' },
    { id: 'sac-vide', nom: 'Sac du vide', cat: 'sac', f: 'sac', c: ['#2a1a3a', '#ff5aa8', '#0a0410'],
      taille: 48, desc: 'Ton sac passe à 48 cases. Il est plus grand dedans que dehors.' },

    // ---- La vitrine : une relique par monde... ----
    { id: 'r-mercure', nom: 'Thermomètre fondu', cat: 'relique', f: 'thermometre', c: ['#e8e0d0', '#ff3a2a', '#8a8070'], monde: 'mercure',
      desc: 'Il indiquait la température. Puis il a renoncé.' },
    { id: 'r-venus', nom: 'Ombrelle rongée', cat: 'relique', f: 'ombrelle', c: ['#d8c84a', '#fff8a0', '#6a5a1a'], monde: 'venus',
      desc: 'Quelqu’un a cru qu’une ombrelle suffirait contre la pluie d’acide.' },
    { id: 'r-terre', nom: 'Billes d’enfance', cat: 'relique', f: 'billes', c: ['#3a8ad8', '#ff5a5a', '#5ad06a'], monde: 'terre',
      desc: 'Elles étaient sous le cabanon depuis des années.' },
    { id: 'r-lune', nom: 'Drapeau oublié', cat: 'relique', f: 'drapeau', c: ['#e8e8f0', '#e03a3a', '#8a8a94'], monde: 'lune',
      desc: 'Planté, puis oublié. Il n’a jamais flotté.' },
    { id: 'r-mars', nom: 'Rover miniature', cat: 'relique', f: 'rover', c: ['#c8c8d0', '#e8b83a', '#5a5a64'], monde: 'mars',
      desc: 'Il roule encore, très lentement, vers nulle part.' },
    { id: 'r-jupiter', nom: 'Œil de tempête figé', cat: 'relique', f: 'oeil', c: ['#d8704a', '#ffe0c0', '#6a2a1a'], monde: 'jupiter',
      desc: 'Une tempête plus vieille que l’humanité, tenue dans la main.' },
    { id: 'r-saturne', nom: 'Fragment d’anneau', cat: 'relique', f: 'anneau-sat', c: ['#e8d8a8', '#ffffff', '#8a7a5a'], monde: 'saturne',
      desc: 'Un morceau de l’anneau, avec sa planète en miniature.' },
    { id: 'r-uranus', nom: 'Toupie couchée', cat: 'relique', f: 'toupie', c: ['#7ad0e8', '#ffffff', '#2a6a8a'], monde: 'uranus',
      desc: 'Elle tourne couchée sur le côté, comme sa planète.' },
    { id: 'r-neptune', nom: 'Trident brisé', cat: 'relique', f: 'trident', c: ['#c8a040', '#fff0a0', '#6a5018'], monde: 'neptune',
      desc: 'Trop grand pour une main humaine. Trop petit pour un dieu.' },
    { id: 'r-cryos', nom: 'Flocon éternel', cat: 'relique', f: 'flocon', c: ['#e8f4ff', '#ffffff', '#8ab8e8'], monde: 'cryos',
      desc: 'Le premier flocon tombé sur Cryos. Il n’a pas fondu depuis.' },
    { id: 'r-opaline', nom: 'Miroir sans reflet', cat: 'relique', f: 'miroir', c: ['#e8b8d8', '#ffffff', '#8a5a7a'], monde: 'opaline',
      desc: 'On s’y regarde, et il n’y a personne.' },
    { id: 'r-altera', nom: 'Nain de poche', cat: 'relique', f: 'nain', c: ['#7a44cc', '#f2c49a', '#2a1a4a'], monde: 'altera',
      desc: 'Un petit nain mauve. Il te regarde.' },
    { id: 'r-viridia', nom: 'Graine qui chante', cat: 'relique', f: 'graine', c: ['#5ac83a', '#e0ffa8', '#2a6a1a'], monde: 'viridia',
      desc: 'Elle fredonne quand on l’arrose. Personne ne sait quoi.' },
    { id: 'r-ferron', nom: 'Clé de fer', cat: 'relique', f: 'cle', c: ['#9aa4b0', '#e0e8f0', '#4a525c'], monde: 'ferron',
      desc: 'Elle ouvre quelque chose, quelque part, sur Ferron.' },
    { id: 'r-brisure', nom: 'Morceau de monde', cat: 'relique', f: 'morceau', c: ['#5aa85a', '#3a8ad8', '#2a1a3a'], monde: 'brisure',
      desc: 'Un bout de la planète d’avant, avec un peu d’océan dedans.' },
    { id: 'r-pyrrhe', nom: 'Coquillage des dunes', cat: 'relique', f: 'coquillage', c: ['#f0d0a8', '#ffffff', '#a8784a'], monde: 'pyrrhe',
      desc: 'Il y a eu une mer, ici. On l’entend encore dedans.' },
    { id: 'r-ignis', nom: 'Étincelle en bocal', cat: 'relique', f: 'bocal', c: ['#c8e8f0', '#ffe08a', '#ff5a14'], monde: 'ignis',
      desc: 'Une flamme d’Ignis, enfermée. Elle cherche la sortie.' },

    // ---- ... et dix curiosites, au hasard des coffres ----
    { id: 'r-meteorite', nom: 'Météorite', cat: 'relique', f: 'galet', c: ['#4a4048', '#c8a87a', '#1a1418'],
      desc: 'Encore tiède. Elle vient de plus loin que tout le reste.' },
    { id: 'r-fossile', nom: 'Fossile spiralé', cat: 'relique', f: 'fossile', c: ['#c8b898', '#f0e4c8', '#6a5a42'],
      desc: 'Quelque chose vivait ici, il y a très longtemps.' },
    { id: 'r-boussole', nom: 'Boussole folle', cat: 'relique', f: 'boussole', c: ['#c8a040', '#f0f0f0', '#e03a3a'],
      desc: 'Elle indique toujours le Téléportail.' },
    { id: 'r-montre', nom: 'Montre arrêtée', cat: 'relique', f: 'montre', c: ['#c8a040', '#f8f0d8', '#5a4410'],
      desc: 'Arrêtée à 3 h 07. Le temps, ici, ne compte pas pareil.' },
    { id: 'r-de', nom: 'Dé à vingt faces', cat: 'relique', f: 'de', c: ['#e03a5a', '#ffffff', '#6a1020'],
      desc: 'Il tombe toujours sur vingt. Toujours.' },
    { id: 'r-cassette', nom: 'Cassette sans étiquette', cat: 'relique', f: 'cassette', c: ['#2a2a32', '#e8e0c8', '#5a5a64'],
      desc: 'Personne n’a de quoi la lire. Tant mieux, peut-être.' },
    { id: 'r-statuette', nom: 'Statuette du Dinder', cat: 'relique', f: 'statuette', c: ['#c8a040', '#ffe08a', '#6a5018'],
      desc: 'Un Dinder en or, cheveux en pics, visière et sourire. Qui l’a sculpté ?' },
    { id: 'r-carte', nom: 'Carte postale de nulle part', cat: 'relique', f: 'carte', c: ['#f0e8d0', '#3a8ad8', '#8a7a5a'],
      desc: '« Il fait beau. Tu nous manques. » Pas d’adresse.' },
    { id: 'r-oeuf', nom: 'Œuf de pierre', cat: 'relique', f: 'oeuf', c: ['#a8a0b8', '#e8e0f0', '#5a5068'],
      desc: 'Il est chaud. Il bouge parfois.' },
    { id: 'r-cle', nom: 'Clé sans serrure', cat: 'relique', f: 'cle', c: ['#c8a040', '#fff0a0', '#6a5018'],
      desc: 'Aucune porte connue ne lui correspond. Pas encore.' }
  ];

  var PAR_ID = {};
  LISTE.forEach(function (o) { PAR_ID[o.id] = o; });
  function objet(id) { return PAR_ID[id] || null; }
  function pile(id) { var o = objet(id); return o ? CATS[o.cat].pile : 1; }

  // Le materiau propre a chaque monde.
  var MAT_MONDE = {};
  var RELIQUE_MONDE = {};
  LISTE.forEach(function (o) {
    if (!o.monde) return;
    if (o.cat === 'mat') MAT_MONDE[o.monde] = o.id;
    if (o.cat === 'relique') RELIQUE_MONDE[o.monde] = o.id;
  });
  var CURIOSITES = LISTE.filter(function (o) { return o.cat === 'relique' && !o.monde; }).map(function (o) { return o.id; });
  var RELIQUES = LISTE.filter(function (o) { return o.cat === 'relique'; });

  // ==========================================================
  //  Les recettes
  // ==========================================================
  // "requis" : un sac ne se fabrique qu'apres le precedent.
  var RECETTES = [
    { id: 'bandage', n: 2, mats: { fibre: 3 } },
    { id: 'trousse', mats: { fibre: 2, resine: 2, glande: 1 } },
    { id: 'elixir', mats: { 'coeur-bete': 1, poussiere: 3, cristal: 2 } },
    { id: 'bouclier', mats: { ferraille: 4, cristal: 2 } },
    { id: 'bombe', n: 2, mats: { ferraille: 3, pierre: 2, glande: 1 } },
    { id: 'grenade-givre', n: 2, mats: { givre: 1, cristal: 2, ferraille: 1 } },
    { id: 'repulsif', mats: { resine: 2, glande: 1, fibre: 2 } },

    { id: 'pioche', mats: { pierre: 5, fer: 2, fibre: 3 } },
    { id: 'foreuse', mats: { fer: 6, cuivre: 4, cristal: 3, noyau: 1 } },
    { id: 'bottes', mats: { cuir: 5, resine: 4, ecaille: 3 } },
    { id: 'detecteur', mats: { cuivre: 5, cristal: 3, ferraille: 4 } },

    { id: 'armure-ferraille', mats: { ferraille: 8, cuir: 3, pierre: 4 } },
    { id: 'armure-ecailles', mats: { ecaille: 8, cuir: 4, fer: 4, croc: 2 } },
    { id: 'armure-astrale', mats: { lingot: 3, poussiere: 6, noyau: 2, 'coeur-bete': 2 } },
    { id: 'amulette-vie', mats: { os: 4, cristal: 3, 'coeur-bete': 1 } },
    { id: 'bottes-course', mats: { cuir: 4, fer: 2, resine: 2, oxyde: 2 } },
    { id: 'anneau-ambre', mats: { ambre: 2, cuivre: 3, cristal: 2 } },

    { id: 'sac-toile', mats: { fibre: 10, cuir: 3 } },
    { id: 'sac-renforce', requis: 'sac-toile', mats: { cuir: 8, fer: 4, ecaille: 4 } },
    { id: 'sac-vide', requis: 'sac-renforce', mats: { 'eclat-vide': 3, poussiere: 8, noyau: 2 } }
  ];
  var GROUPES = [
    { cat: 'conso', nom: 'Survie' },
    { cat: 'outil', nom: 'Outils' },
    { cat: 'equip', nom: 'Équipement' },
    { cat: 'sac', nom: 'Sacs' }
  ];

  // ==========================================================
  //  Les icones
  // ==========================================================
  var IC = 16, CERNE = '#10121c';

  function ovale(p, cx, cy, rx, ry, col) {
    for (var dy = -ry; dy <= ry; dy++) {
      var k = 1 - (dy / (ry + 0.5)) * (dy / (ry + 0.5));
      if (k <= 0) continue;
      var w = Math.round(rx * Math.sqrt(k));
      p(cx - w, cy + dy, w * 2 + 1, 1, col);
    }
  }

  // Chaque forme : p(x, y, l, h, couleur), c = [corps, clair, sombre].
  var FORMES = {
    galet: function (p, c) {
      ovale(p, 8, 9, 6, 5, c[0]); ovale(p, 7, 8, 4, 3, c[1]); ovale(p, 8, 9, 3, 2, c[0]);
      p(10, 12, 3, 1, c[2]); p(4, 11, 2, 1, c[2]); p(5, 6, 2, 1, '#ffffff');
    },
    ferraille: function (p, c) {
      p(2, 8, 7, 5, c[0]); p(2, 8, 7, 1, c[1]); p(7, 3, 6, 6, c[1]); p(7, 3, 6, 1, '#ffffff');
      p(8, 5, 1, 1, c[2]); p(11, 7, 1, 1, c[2]); p(4, 10, 1, 1, c[2]);
      p(9, 10, 5, 2, c[2]); p(13, 9, 1, 2, c[2]);
    },
    fibre: function (p, c) {
      for (var i = 0; i < 5; i++) p(4 + i * 2, 2 + (i % 2), 1, 12 - (i % 2), i % 2 ? c[1] : c[0]);
      p(3, 8, 11, 2, c[2]); p(3, 8, 11, 1, '#a8824a');
    },
    goutte: function (p, c) {
      p(7, 2, 2, 2, c[0]); p(6, 4, 4, 2, c[0]); ovale(p, 8, 10, 4, 4, c[0]);
      p(6, 8, 1, 3, c[1]); p(7, 7, 1, 1, c[1]); p(9, 13, 2, 1, c[2]);
    },
    cristal: function (p, c) {
      p(6, 3, 4, 11, c[0]); p(7, 1, 2, 2, c[1]); p(6, 2, 1, 1, c[0]); p(9, 2, 1, 1, c[0]);
      p(4, 6, 2, 7, c[2]); p(10, 5, 2, 8, c[1]); p(7, 3, 1, 9, c[1]);
      p(3, 9, 2, 5, c[0]); p(11, 10, 2, 4, c[2]);
    },
    eclat: function (p, c) {
      for (var y = 2; y < 14; y++) { var w = y < 8 ? y - 1 : 15 - y; p(8 - (w >> 1), y, Math.max(1, w), 1, c[0]); }
      p(7, 3, 1, 9, c[1]); p(9, 6, 1, 5, c[2]); p(6, 6, 1, 1, '#ffffff');
    },
    minerai: function (p, c) {
      ovale(p, 8, 9, 6, 5, c[0]); ovale(p, 7, 8, 3, 2, '#8a8480');
      [[5, 7], [9, 6], [11, 10], [6, 11], [8, 9]].forEach(function (q, i) { p(q[0], q[1], i % 2 ? 1 : 2, 2, c[1]); });
      p(10, 13, 3, 1, c[2]);
    },
    os: function (p, c) {
      p(4, 7, 8, 2, c[0]); p(2, 5, 3, 3, c[0]); p(2, 8, 3, 3, c[0]); p(11, 5, 3, 3, c[0]); p(11, 8, 3, 3, c[0]);
      p(4, 7, 8, 1, c[1]); p(2, 5, 2, 1, c[1]); p(5, 9, 6, 1, c[2]);
    },
    cuir: function (p, c) {
      p(3, 4, 10, 8, c[0]); p(2, 6, 1, 3, c[0]); p(13, 5, 1, 4, c[0]); p(5, 12, 6, 1, c[0]); p(6, 3, 4, 1, c[0]);
      p(4, 5, 8, 1, c[1]); for (var i = 0; i < 4; i++) p(4 + i * 2, 10, 1, 1, c[2]);
    },
    ecaille: function (p, c) {
      ovale(p, 8, 8, 6, 6, c[0]);
      [4, 7, 10].forEach(function (y, i) { for (var x = 3 + i % 2; x < 13; x += 3) { p(x, y, 2, 1, c[1]); p(x + 2, y + 1, 1, 1, c[2]); } });
    },
    croc: function (p, c) {
      for (var y = 2; y < 14; y++) { var w = Math.max(1, Math.round((14 - y) * 0.55)); p(6 + ((14 - y) > 9 ? 0 : 1), y, w, 1, c[0]); }
      p(6, 2, 7, 2, c[2]); p(7, 4, 1, 6, c[1]);
    },
    glande: function (p, c) {
      ovale(p, 8, 9, 5, 4, c[0]); ovale(p, 7, 8, 2, 1, c[1]);
      p(5, 11, 4, 1, c[2]); p(10, 7, 1, 3, c[2]); p(8, 4, 1, 2, c[0]); p(9, 3, 1, 1, c[1]);
    },
    coeur: function (p, c) {
      p(3, 4, 4, 3, c[0]); p(9, 4, 4, 3, c[0]); p(2, 5, 12, 4, c[0]); p(3, 9, 10, 2, c[0]);
      p(5, 11, 6, 2, c[0]); p(7, 13, 2, 1, c[0]); p(4, 5, 2, 2, c[1]); p(10, 9, 2, 2, c[2]);
    },
    noyau: function (p, c) {
      p(3, 3, 10, 10, c[2]); p(3, 3, 10, 1, '#5a6a8a'); p(4, 4, 8, 8, '#1a2238');
      ovale(p, 8, 8, 3, 3, c[0]); p(7, 7, 2, 2, c[1]); p(2, 7, 1, 2, c[0]); p(13, 7, 1, 2, c[0]); p(7, 2, 2, 1, c[0]); p(7, 13, 2, 1, c[0]);
    },
    poussiere: function (p, c) {
      [[4, 4, 2], [10, 3, 1], [7, 8, 2], [12, 10, 1], [3, 11, 1], [10, 13, 1]].forEach(function (q) {
        p(q[0] - q[2], q[1], q[2] * 2 + 1, 1, c[0]); p(q[0], q[1] - q[2], 1, q[2] * 2 + 1, c[0]); p(q[0], q[1], 1, 1, c[1]);
      });
    },
    perle: function (p, c) {
      ovale(p, 8, 8, 5, 5, c[0]); ovale(p, 6, 6, 2, 2, c[1]); p(5, 5, 1, 1, '#ffffff'); p(9, 12, 3, 1, c[2]);
    },
    lingot: function (p, c) {
      p(3, 8, 10, 4, c[0]); p(4, 6, 8, 2, c[1]); p(3, 11, 10, 1, c[2]); p(5, 6, 3, 1, '#ffffff');
    },
    bois: function (p, c) {
      p(2, 6, 11, 5, c[0]); p(2, 6, 11, 1, c[2]); p(2, 10, 11, 1, c[2]);
      ovale(p, 12, 8, 2, 2, c[1]); p(12, 8, 1, 1, c[2]); p(4, 8, 4, 1, c[2]);
    },
    ambre: function (p, c) {
      ovale(p, 8, 8, 5, 5, c[0]); ovale(p, 7, 7, 3, 3, c[1]); p(8, 8, 2, 1, '#3a2a10'); p(9, 9, 1, 1, '#3a2a10');
      p(5, 4, 4, 1, '#ffffff'); p(11, 12, 2, 1, c[2]);
    },
    nacre: function (p, c) {
      for (var i = 0; i < 5; i++) p(3 + i * 2, 4 + Math.abs(2 - i), 2, 9 - Math.abs(2 - i), i % 2 ? c[1] : c[0]);
      p(6, 12, 4, 2, c[2]); p(4, 6, 1, 1, '#a8f0ff'); p(10, 5, 1, 1, '#ffd0f0');
    },
    flocon: function (p, c) {
      p(7, 2, 2, 12, c[0]); p(2, 7, 12, 2, c[0]);
      for (var k = 0; k < 4; k++) { p(4 + k, 4 + k, 1, 1, c[1]); p(11 - k, 4 + k, 1, 1, c[1]); p(4 + k, 11 - k, 1, 1, c[1]); p(11 - k, 11 - k, 1, 1, c[1]); }
      p(6, 3, 1, 1, c[2]); p(9, 3, 1, 1, c[2]); p(6, 12, 1, 1, c[2]); p(9, 12, 1, 1, c[2]); p(7, 7, 2, 2, '#ffffff');
    },
    sable: function (p, c) {
      for (var y = 6; y < 14; y++) { var w = (y - 5) * 3 / 2 | 0; p(8 - w, y, w * 2, 1, y < 9 ? c[1] : c[0]); }
      p(5, 12, 1, 1, c[2]); p(10, 11, 1, 1, c[2]); p(7, 9, 1, 1, c[2]); p(12, 3, 1, 1, c[1]); p(3, 4, 1, 1, c[1]);
    },
    braise: function (p, c) {
      ovale(p, 8, 11, 5, 3, c[2]); p(5, 7, 6, 4, c[0]); p(7, 3, 2, 5, c[0]); p(6, 5, 1, 2, c[1]); p(9, 4, 1, 3, c[1]);
      p(7, 8, 2, 2, c[1]); p(4, 11, 2, 1, c[0]); p(10, 12, 2, 1, c[0]);
    },
    bandage: function (p, c) {
      p(2, 5, 12, 7, c[0]); p(2, 5, 12, 1, c[1]); p(2, 11, 12, 1, '#c8c4b8');
      ovale(p, 12, 8, 2, 3, '#d8d4c8'); p(12, 8, 1, 1, '#a8a498');
      p(6, 6, 2, 5, c[2]); p(4, 8, 6, 1, c[2]);
    },
    trousse: function (p, c) {
      p(2, 5, 12, 9, c[0]); p(2, 5, 12, 1, c[1]); p(6, 3, 4, 2, '#8a8478'); p(7, 3, 2, 1, '#2a2a2a');
      p(7, 7, 2, 5, c[2]); p(5, 9, 6, 1, c[2]); p(2, 13, 12, 1, '#a8a498');
    },
    fiole: function (p, c) {
      p(7, 1, 2, 2, '#8a5a32'); p(7, 3, 2, 3, '#d8e8f0'); ovale(p, 8, 10, 5, 4, '#d8e8f0');
      ovale(p, 8, 11, 4, 3, c[0]); p(5, 10, 1, 2, c[1]); p(6, 8, 1, 1, '#ffffff'); p(9, 12, 2, 1, c[2]);
    },
    bouclier: function (p, c) {
      for (var y = 2; y < 14; y++) { var w = y < 8 ? 6 : Math.max(1, 6 - (y - 7)); p(8 - w, y, w * 2, 1, c[0]); }
      p(2, 2, 12, 1, c[1]); p(7, 3, 2, 9, c[1]); p(4, 6, 8, 2, c[1]); p(3, 3, 1, 4, '#ffffff');
    },
    bombe: function (p, c) {
      ovale(p, 7, 10, 5, 5, c[0]); ovale(p, 5, 8, 2, 2, c[1]); p(9, 3, 2, 3, '#8a8478'); p(11, 2, 2, 1, '#a8824a');
      p(13, 1, 1, 1, c[2]); p(12, 0, 1, 1, '#fff4b0'); p(14, 2, 1, 1, c[2]);
    },
    spray: function (p, c) {
      p(5, 5, 6, 10, c[0]); p(5, 5, 6, 1, c[1]); p(6, 8, 4, 4, c[1]); p(7, 9, 2, 2, c[2]);
      p(6, 2, 3, 3, '#8a8a94'); p(9, 2, 2, 1, '#5a5a64'); p(12, 1, 1, 1, c[1]); p(13, 3, 1, 1, c[1]); p(12, 4, 1, 1, c[1]);
    },
    armure: function (p, c) {
      p(2, 3, 4, 3, c[0]); p(10, 3, 4, 3, c[0]); p(4, 4, 8, 10, c[0]); p(6, 3, 4, 2, '#1a1a22');
      p(2, 3, 4, 1, c[1]); p(10, 3, 4, 1, c[1]); p(5, 6, 6, 1, c[1]); p(7, 8, 2, 4, c[1]);
      p(4, 13, 8, 1, c[2]); p(11, 5, 1, 8, c[2]);
    },
    amulette: function (p, c) {
      for (var i = 0; i < 6; i++) { p(3 + i, 2 + i, 1, 1, c[0]); p(12 - i, 2 + i, 1, 1, c[0]); }
      ovale(p, 8, 11, 3, 3, c[0]); ovale(p, 8, 11, 2, 2, c[1]); p(7, 10, 1, 1, '#ffffff');
    },
    bottes: function (p, c) {
      p(3, 2, 5, 9, c[0]); p(3, 10, 9, 4, c[0]); p(3, 2, 5, 1, c[1]); p(3, 13, 10, 1, c[2]); p(4, 6, 3, 1, c[2]);
      p(11, 11, 2, 2, c[0]); p(5, 11, 3, 1, c[1]);
    },
    anneau: function (p, c) {
      ovale(p, 8, 10, 5, 4, c[0]); ovale(p, 8, 10, 3, 2, 'rgba(0,0,0,0)');
      p(5, 9, 6, 3, '#00000000'); ovale(p, 8, 4, 3, 2, c[1]); p(7, 3, 1, 1, '#ffffff');
    },
    pioche: function (p, c) {
      for (var i = 0; i < 10; i++) p(4 + i, 13 - i, 2, 1, c[2]);
      p(3, 3, 3, 2, c[0]); p(5, 2, 4, 2, c[0]); p(9, 3, 3, 2, c[0]); p(12, 5, 2, 3, c[0]); p(2, 5, 2, 2, c[0]);
      p(5, 2, 4, 1, c[1]); p(12, 5, 1, 2, c[1]);
    },
    foreuse: function (p, c) {
      p(2, 6, 7, 6, c[2]); p(2, 6, 7, 1, '#8a8a94'); p(3, 12, 3, 3, c[2]);
      for (var i = 0; i < 6; i++) p(9 + i, 7 + (i >> 1), 1, 4 - (i >> 1) * 2 + (i % 2 ? 0 : 0) || 1, c[0]);
      p(9, 7, 2, 4, c[0]); p(11, 8, 2, 2, c[0]); p(13, 8, 2, 1, c[1]); p(10, 7, 1, 1, c[1]); p(4, 8, 2, 2, '#ff5a3a');
    },
    detecteur: function (p, c) {
      p(3, 5, 10, 9, c[0]); p(3, 5, 10, 1, '#8a909c'); p(4, 6, 8, 5, '#0a1a12'); p(5, 8, 6, 1, c[1]);
      p(6, 7, 1, 1, c[1]); p(9, 9, 1, 1, c[1]); p(10, 1, 1, 4, c[2]); p(10, 0, 2, 1, c[1]);
      p(5, 12, 2, 1, c[2]); p(9, 12, 2, 1, '#ff5a3a');
    },
    sac: function (p, c) {
      ovale(p, 8, 10, 6, 4, c[0]); p(3, 6, 10, 5, c[0]); p(4, 5, 8, 2, c[2]); p(5, 3, 6, 2, c[0]);
      p(6, 2, 4, 1, c[2]); p(4, 6, 8, 1, c[1]); p(7, 7, 2, 2, c[2]); p(3, 13, 10, 1, c[2]);
    },
    thermometre: function (p, c) {
      p(7, 1, 2, 10, c[0]); p(8, 4, 1, 7, c[1]); ovale(p, 8, 12, 2, 2, c[1]); p(6, 6, 1, 1, c[2]); p(6, 3, 1, 1, c[2]);
      p(9, 9, 3, 2, c[0]); p(11, 11, 2, 1, c[0]);
    },
    ombrelle: function (p, c) {
      for (var y = 2; y < 7; y++) { var w = y * 2; p(8 - w / 2 - 1, y, w + 2, 1, y % 2 ? c[0] : c[1]); }
      p(1, 7, 3, 1, c[2]); p(9, 7, 2, 1, c[2]); p(8, 7, 1, 7, c[2]); p(6, 13, 2, 1, c[2]);
    },
    billes: function (p, c) {
      ovale(p, 5, 6, 3, 3, c[0]); ovale(p, 11, 7, 3, 3, c[1]); ovale(p, 8, 12, 3, 3, c[2]);
      p(4, 5, 1, 1, '#ffffff'); p(10, 6, 1, 1, '#ffffff'); p(7, 11, 1, 1, '#ffffff');
    },
    drapeau: function (p, c) {
      p(3, 1, 1, 14, c[2]); p(4, 2, 9, 6, c[0]); p(4, 2, 3, 3, '#3a5ad8'); p(7, 3, 6, 1, c[1]); p(7, 5, 6, 1, c[1]); p(4, 7, 9, 1, c[1]);
    },
    rover: function (p, c) {
      p(3, 6, 10, 4, c[0]); p(3, 6, 10, 1, '#ffffff'); p(5, 3, 4, 3, c[1]); p(10, 2, 1, 4, c[2]); p(9, 1, 3, 1, c[1]);
      [3, 7, 11].forEach(function (x) { ovale(p, x + 1, 11, 1, 1, c[2]); });
    },
    oeil: function (p, c) {
      ovale(p, 8, 8, 6, 5, c[0]); ovale(p, 8, 8, 4, 3, c[1]); ovale(p, 9, 8, 2, 2, c[2]);
      p(3, 6, 10, 1, c[1]); p(4, 10, 8, 1, c[2]);
    },
    'anneau-sat': function (p, c) {
      ovale(p, 8, 8, 4, 4, c[0]); p(1, 8, 14, 1, c[2]); p(2, 7, 12, 1, c[1]); p(3, 9, 10, 1, c[1]); p(6, 6, 2, 1, '#ffffff');
    },
    toupie: function (p, c) {
      for (var x = 2; x < 13; x++) { var h = x < 8 ? x - 1 : 14 - x; p(x, 8 - (h >> 1), 1, Math.max(1, h), x % 3 ? c[0] : c[1]); }
      p(13, 7, 2, 2, c[2]); p(1, 8, 1, 1, c[2]);
    },
    trident: function (p, c) {
      p(7, 4, 2, 11, c[2]); p(3, 3, 10, 2, c[0]); p(3, 0, 2, 4, c[0]); p(7, 0, 2, 4, c[0]); p(11, 0, 2, 4, c[0]);
      p(3, 0, 1, 1, c[1]); p(7, 0, 1, 1, c[1]); p(11, 0, 1, 1, c[1]); p(8, 10, 1, 2, '#00000000');
    },
    miroir: function (p, c) {
      ovale(p, 8, 6, 5, 5, c[0]); ovale(p, 8, 6, 4, 4, '#d8d8e8'); p(7, 11, 2, 4, c[2]); p(6, 3, 2, 1, '#ffffff'); p(5, 4, 1, 2, '#ffffff');
    },
    nain: function (p, c) {
      for (var y = 0; y < 5; y++) p(8 - y, 1 + y, y * 2 + 1, 1, c[0]);
      p(5, 6, 6, 3, c[1]); p(6, 7, 1, 1, '#1a1a22'); p(9, 7, 1, 1, '#1a1a22'); p(5, 9, 6, 3, '#f0f0f0');
      p(4, 12, 8, 3, c[0]); p(4, 14, 3, 1, c[2]); p(9, 14, 3, 1, c[2]);
    },
    graine: function (p, c) {
      ovale(p, 8, 10, 4, 4, '#8a5a2a'); ovale(p, 7, 9, 2, 2, '#c8945a'); p(8, 3, 1, 4, c[0]); p(5, 3, 3, 2, c[1]); p(9, 2, 3, 2, c[0]);
      p(12, 7, 1, 1, c[1]); p(13, 5, 1, 1, c[1]);
    },
    cle: function (p, c) {
      ovale(p, 5, 5, 3, 3, c[0]); p(4, 4, 2, 2, '#00000000'); p(7, 7, 7, 2, c[0]); p(11, 9, 1, 3, c[0]); p(13, 9, 1, 2, c[0]);
      p(5, 3, 2, 1, c[1]); p(8, 7, 5, 1, c[1]);
    },
    morceau: function (p, c) {
      for (var y = 3; y < 14; y++) p(3 + (y < 6 ? 6 - y : 0), y, 10 - (y > 10 ? y - 10 : 0) * 2, 1, c[2]);
      p(4, 4, 7, 4, c[1]); p(5, 5, 4, 2, c[0]); p(9, 7, 3, 2, c[0]); p(3, 3, 6, 1, c[0]);
    },
    coquillage: function (p, c) {
      for (var y = 3; y < 13; y++) { var w = Math.round(6 * Math.sin((y - 2) / 11 * Math.PI)); p(8 - w, y, w * 2, 1, c[0]); }
      for (var i = 0; i < 5; i++) p(4 + i * 2, 4 + Math.abs(2 - i), 1, 8 - Math.abs(2 - i), c[2]);
      p(6, 13, 4, 2, c[0]); p(5, 4, 2, 1, c[1]);
    },
    bocal: function (p, c) {
      p(4, 3, 8, 2, '#8a8a94'); p(3, 5, 10, 9, c[0]); p(3, 13, 10, 1, '#a8c8d0');
      p(7, 8, 2, 4, c[2]); p(7, 7, 1, 2, c[1]); p(8, 9, 1, 2, c[1]); p(4, 6, 1, 5, '#ffffff');
    },
    fossile: function (p, c) {
      ovale(p, 8, 8, 6, 6, c[0]);
      [[8, 8], [9, 8], [9, 9], [8, 10], [7, 10], [6, 9], [6, 8], [6, 7], [7, 6], [8, 5], [9, 5], [10, 6], [11, 7], [11, 8], [11, 9], [11, 10], [10, 11], [9, 12], [8, 12], [7, 12]]
        .forEach(function (q) { p(q[0], q[1], 1, 1, c[2]); });
      p(4, 4, 2, 1, c[1]);
    },
    boussole: function (p, c) {
      ovale(p, 8, 8, 6, 6, c[0]); ovale(p, 8, 8, 5, 5, c[1]);
      p(8, 4, 1, 4, c[2]); p(7, 5, 1, 2, c[2]); p(8, 8, 1, 4, '#3a3a44'); p(8, 8, 1, 1, '#1a1a22');
    },
    montre: function (p, c) {
      p(7, 0, 2, 3, c[0]); ovale(p, 8, 9, 6, 6, c[0]); ovale(p, 8, 9, 5, 5, c[1]);
      p(8, 5, 1, 4, c[2]); p(8, 9, 3, 1, c[2]); p(5, 6, 1, 1, '#ffffff');
    },
    de: function (p, c) {
      for (var y = 1; y < 15; y++) { var w = y < 5 ? y + 3 : y > 11 ? 18 - y : 7; p(8 - w, y, w * 2, 1, c[0]); }
      p(7, 2, 2, 11, c[2]); p(2, 6, 12, 1, c[2]); p(4, 8, 3, 3, c[1]); p(9, 8, 3, 3, c[1]); p(5, 9, 1, 1, c[2]); p(10, 9, 1, 1, c[2]);
    },
    cassette: function (p, c) {
      p(1, 4, 14, 9, c[0]); p(3, 5, 10, 4, c[1]); ovale(p, 5, 7, 1, 1, c[2]); ovale(p, 11, 7, 1, 1, c[2]); p(4, 10, 8, 2, c[2]);
    },
    statuette: function (p, c) {
      for (var i = 0; i < 6; i++) p(4 + i * 2, 1 + (i % 2), 1, 3, c[0]);
      p(4, 3, 9, 5, c[1]); p(4, 5, 9, 2, '#1a1a22'); p(5, 8, 7, 2, '#ffffff'); p(5, 10, 7, 3, c[0]); p(3, 13, 11, 2, c[2]);
    },
    carte: function (p, c) {
      p(1, 3, 14, 10, c[0]); p(2, 4, 6, 6, c[1]); p(3, 7, 4, 2, '#5ac83a'); p(9, 5, 5, 1, c[2]); p(9, 7, 5, 1, c[2]); p(9, 9, 3, 1, c[2]);
      p(12, 4, 2, 2, '#e03a3a');
    },
    oeuf: function (p, c) {
      ovale(p, 8, 9, 5, 6, c[0]); ovale(p, 7, 7, 2, 3, c[1]); p(9, 6, 1, 3, c[2]); p(10, 9, 1, 2, c[2]); p(8, 11, 2, 1, c[2]);
    }
  };

  // Le cerne sombre autour de l'icone.
  function cerner(ctx, L, H) {
    var img = ctx.getImageData(0, 0, L, H), d = img.data, plein = new Uint8Array(L * H), i;
    for (i = 0; i < L * H; i++) plein[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    var c = [16, 18, 28];
    for (var y = 0; y < H; y++) for (var x = 0; x < L; x++) {
      i = y * L + x;
      if (plein[i]) continue;
      for (var k = 0; k < 4; k++) {
        var nx = x + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
        if (nx < 0 || ny < 0 || nx >= L || ny >= H || !plein[ny * L + nx]) continue;
        d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
        break;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var cache = {};
  // L'icone sur une toile de 18 x 18 (le cerne deborde d'un pixel).
  function icone(id) {
    if (cache[id]) return cache[id];
    var o = objet(id);
    var cv = document.createElement('canvas');
    cv.width = IC + 2; cv.height = IC + 2;
    var x = cv.getContext('2d');
    if (!x || !o) return cv;
    x.imageSmoothingEnabled = false;
    var f = FORMES[o.f] || FORMES.galet;
    f(function (px, py, w, h, col) {
      if (col === '#00000000' || col === 'rgba(0,0,0,0)') { x.clearRect(px + 1, py + 1, w, h); return; }
      x.fillStyle = col; x.fillRect(px + 1, py + 1, w, h);
    }, o.c);
    cerner(x, IC + 2, IC + 2);
    cache[id] = cv;
    return cv;
  }
  var urls = {};
  function url(id) { return urls[id] || (urls[id] = icone(id).toDataURL('image/png')); }

  function imgIcone(id, cls) {
    var im = el('img', cls || 'ocr-ic');
    im.src = url(id);
    im.alt = '';
    im.draggable = false;
    return im;
  }

  // ==========================================================
  //  Le sac
  // ==========================================================
  function etat() { return DP.sacOdyssee(); }
  function sauver() { DP.sauverSac(); }
  function taille() { return etat().taille; }

  function compter(id) {
    return etat().cases.reduce(function (n, c) { return n + (c && c.id === id ? c.n : 0); }, 0);
  }

  // Combien de "id" peuvent encore entrer, compte tenu des piles
  // entamees et des cases libres.
  function place(id, cases) {
    cases = cases || etat().cases;
    var P = pile(id), n = 0, occupees = 0;
    cases.forEach(function (c) { if (!c) return; occupees++; if (c.id === id) n += P - c.n; });
    return n + Math.max(0, taille() - occupees) * P;
  }

  // Ajoute ce qui rentre ; rend ce qui a vraiment ete ajoute.
  function ajouterDans(cases, id, n) {
    var P = pile(id), mis = 0;
    cases.forEach(function (c) {
      if (!c || c.id !== id || n <= 0) return;
      var k = Math.min(P - c.n, n); c.n += k; n -= k; mis += k;
    });
    while (n > 0 && cases.filter(Boolean).length < taille()) {
      var k = Math.min(P, n);
      cases.push({ id: id, n: k }); n -= k; mis += k;
    }
    return mis;
  }

  function ajouter(id, n) {
    var o = objet(id);
    if (!o || n <= 0) return 0;
    var s = etat();
    // Les outils, les sacs et les reliques ne prennent pas de case.
    if (o.cat === 'outil') { s.outils[id] = true; sauver(); return n; }
    if (o.cat === 'relique') { if (!s.vitrine[id]) s.vitrine[id] = Date.now(); sauver(); return n; }
    if (o.cat === 'sac') { s.taille = Math.max(s.taille, o.taille); s.outils[id] = true; sauver(); return n; }
    var mis = ajouterDans(s.cases, id, n);
    sauver();
    return mis;
  }

  function retirer(id, n) {
    var s = etat();
    for (var i = s.cases.length - 1; i >= 0 && n > 0; i--) {
      var c = s.cases[i];
      if (!c || c.id !== id) continue;
      var k = Math.min(c.n, n); c.n -= k; n -= k;
      if (!c.n) s.cases.splice(i, 1);
    }
    sauver();
    return n === 0;
  }

  // Est-ce qu'une liste [{id, n}] entre tout entiere dans le sac ?
  function rentre(liste) {
    var copie = etat().cases.map(function (c) { return { id: c.id, n: c.n }; });
    return liste.every(function (g) {
      var o = objet(g.id);
      if (!o || o.cat === 'outil' || o.cat === 'relique' || o.cat === 'sac') return true;
      return ajouterDans(copie, g.id, g.n) === g.n;
    });
  }

  function aOutil(id) { return !!etat().outils[id]; }
  function aRelique(id) { return !!etat().vitrine[id]; }

  // ---------- L'equipement ----------
  function equipe(place) { return etat().equipe[place] || null; }
  function equiper(id) {
    var o = objet(id);
    if (!o || o.cat !== 'equip' || !compter(id)) return false;
    var s = etat(), avant = s.equipe[o.place];
    retirer(id, 1);
    s.equipe[o.place] = id;
    if (avant) ajouterDans(s.cases, avant, 1);
    sauver();
    return true;
  }
  function desequiper(place) {
    var s = etat(), id = s.equipe[place];
    if (!id || !place || !rentre([{ id: id, n: 1 }])) return false;
    delete s.equipe[place];
    ajouterDans(s.cases, id, 1);
    sauver();
    return true;
  }

  // Ce que l'equipement porte apporte.
  function bonus() {
    var b = { pv: 0, regen: 1, vitesse: 1, degats: 1 };
    var s = etat();
    ['armure', 'accessoire'].forEach(function (pl) {
      var o = objet(s.equipe[pl]);
      if (!o) return;
      if (o.pv) b.pv += o.pv;
      if (o.regen) b.regen *= o.regen;
      if (o.vitesse) b.vitesse *= o.vitesse;
      if (o.degats) b.degats *= o.degats;
    });
    return b;
  }

  // ---------- La fabrication ----------
  function recette(id) { for (var i = 0; i < RECETTES.length; i++) if (RECETTES[i].id === id) return RECETTES[i]; return null; }
  function dejaFait(r) {
    var o = objet(r.id);
    return (o.cat === 'outil' || o.cat === 'sac') && aOutil(r.id);
  }
  function verrouillee(r) { return !!r.requis && !aOutil(r.requis); }
  function manque(r) {
    var m = [];
    for (var id in r.mats) { var a = compter(id); if (a < r.mats[id]) m.push(id); }
    return m;
  }
  function peutFabriquer(r) {
    if (dejaFait(r) || verrouillee(r) || manque(r).length) return false;
    // Ce qu'on fabrique doit trouver sa place, une fois les materiaux
    // retires du sac.
    var copie = etat().cases.map(function (c) { return { id: c.id, n: c.n }; });
    for (var id in r.mats) {
      var n = r.mats[id];
      for (var i = copie.length - 1; i >= 0 && n > 0; i--) {
        if (copie[i].id !== id) continue;
        var k = Math.min(copie[i].n, n); copie[i].n -= k; n -= k;
        if (!copie[i].n) copie.splice(i, 1);
      }
    }
    var o = objet(r.id);
    if (o.cat === 'outil' || o.cat === 'sac') return true;
    return ajouterDans(copie, r.id, r.n || 1) === (r.n || 1);
  }
  function fabriquer(id) {
    var r = recette(id);
    if (!r || !peutFabriquer(r)) return false;
    for (var m in r.mats) retirer(m, r.mats[m]);
    ajouter(r.id, r.n || 1);
    var s = etat();
    s.fabrique[r.id] = (s.fabrique[r.id] || 0) + (r.n || 1);
    sauver();
    return true;
  }

  // ==========================================================
  //  Le butin
  // ==========================================================
  function un(liste, id, n) { if (n > 0) liste.push({ id: id, n: n }); }
  function chance(k) { return Math.random() < k; }

  // Ce que donne un noeud de la carte. "stellaire" : le monde est du
  // systeme stellaire (la poussiere d'etoile n'y tombe que la).
  function recolte(type, astre) {
    var out = [], mm = MAT_MONDE[astre.id];
    if (type === 'filon') {
      un(out, 'pierre', hasard(1, 2));
      un(out, chance(0.55) ? 'fer' : 'cuivre', 1);
      if (mm && chance(0.1)) un(out, mm, 1);
    } else if (type === 'plante') {
      un(out, 'fibre', hasard(2, 3));
      if (chance(0.35)) un(out, 'resine', 1);
      if (mm && chance(0.12)) un(out, mm, 1);
    } else if (type === 'debris') {
      un(out, 'ferraille', hasard(2, 3));
      if (chance(0.25)) un(out, 'cuivre', 1);
      if (chance(0.04)) un(out, 'noyau', 1);
    } else if (type === 'eclats') {
      un(out, 'cristal', 2);
      if (mm && chance(0.15)) un(out, mm, 1);
    } else if (type === 'gisement') {
      un(out, mm || 'cristal', hasard(2, 3));
      if (chance(0.5)) un(out, 'pierre', 1);
    } else if (type === 'poussiere') {
      un(out, 'poussiere', hasard(2, 3));
    } else if (type === 'roche') {
      un(out, 'pierre', 2);
      if (chance(0.3)) un(out, 'fer', 1);
      if (chance(0.15)) un(out, 'cuivre', 1);
      if (mm && chance(0.06)) un(out, mm, 1);
    } else if (type === 'cristal') {
      un(out, 'cristal', 3);
      if (mm && chance(0.15)) un(out, mm, 1);
      if (chance(0.03)) un(out, 'noyau', 1);
    }
    return out;
  }

  // Ce que laisse une bete abattue, selon sa force.
  function butinBete(v, astre) {
    var out = [], pal = v.palier || 1, mm = MAT_MONDE[astre.id];
    if (pal <= 1) {
      if (chance(0.6)) un(out, 'os', 1);
      if (chance(0.6)) un(out, 'cuir', 1);
      if (chance(0.25)) un(out, 'glande', 1);
    } else if (pal === 2) {
      un(out, 'cuir', 1);
      un(out, 'ecaille', hasard(1, 2));
      if (chance(0.5)) un(out, 'croc', 1);
      if (chance(0.3)) un(out, 'glande', 1);
    } else {
      un(out, 'ecaille', 2);
      un(out, 'croc', 1);
      un(out, 'glande', 1);
      if (chance(0.4 + (pal - 3) * 0.2)) un(out, 'coeur-bete', 1);
    }
    if (mm && chance(0.15)) un(out, mm, 1);
    return out;
  }

  // Ce que laisse un gardien vaincu, la premiere fois.
  function butinGardien(astre) {
    var out = [];
    un(out, 'noyau', 2);
    un(out, 'coeur-bete', 2);
    un(out, MAT_MONDE[astre.id] || 'cristal', 3);
    return out;
  }

  // Le contenu d'un coffre. Tire une fois pour toutes a l'ouverture.
  var COMMUNS = ['pierre', 'ferraille', 'fibre', 'resine', 'cristal', 'fer', 'cuivre', 'cuir', 'os'];
  function contenuCoffre(c, astre) {
    var out = [], mm = MAT_MONDE[astre.id];
    var stellaire = astre.systeme === 'stellaire';
    if (c.scelle) {
      un(out, 'noyau', hasard(1, 2));
      un(out, mm || 'cristal', hasard(3, 4));
      un(out, 'coeur-bete', 1);
      if (stellaire) un(out, 'poussiere', hasard(3, 5));
      un(out, chance(0.5) ? 'trousse' : 'elixir', 1);
      // La relique du monde, si on ne l'a pas encore.
      var rel = RELIQUE_MONDE[astre.id];
      if (rel && !aRelique(rel)) un(out, rel, 1);
      else {
        var reste = CURIOSITES.filter(function (id) { return !aRelique(id); });
        if (reste.length) un(out, reste[Math.floor(Math.random() * reste.length)], 1);
      }
      return out;
    }
    var tirages = hasard(3, 5);
    for (var i = 0; i < tirages; i++) un(out, COMMUNS[Math.floor(Math.random() * COMMUNS.length)], hasard(2, 4));
    if (mm && chance(0.5)) un(out, mm, hasard(1, 2));
    if (stellaire && chance(0.5)) un(out, 'poussiere', hasard(1, 3));
    if (chance(0.35)) un(out, chance(0.6) ? 'bandage' : 'trousse', 1);
    if (chance(0.15)) un(out, 'noyau', 1);
    if (chance(0.12)) {
      var r = CURIOSITES.filter(function (id) { return !aRelique(id); });
      if (r.length) un(out, r[Math.floor(Math.random() * r.length)], 1);
    }
    // Les doublons d'un meme materiau se regroupent.
    var vu = {}, net = [];
    out.forEach(function (g) { if (vu[g.id]) vu[g.id].n += g.n; else { vu[g.id] = { id: g.id, n: g.n }; net.push(vu[g.id]); } });
    return net;
  }

  function coffreOuvert(id) { return !!etat().coffres[id]; }
  function marquerCoffre(id) { etat().coffres[id] = Date.now(); sauver(); }

  // Met une liste dans le sac. Rend { pris: [...], laisse: [...], reliques: [...] }.
  function empocher(liste) {
    var pris = [], laisse = [], rel = [];
    liste.forEach(function (g) {
      var o = objet(g.id);
      if (!o) return;
      if (o.cat === 'relique') {
        var neuve = !aRelique(g.id);
        ajouter(g.id, 1);
        if (neuve) rel.push(g.id);
        return;
      }
      var mis = ajouter(g.id, g.n);
      if (mis) pris.push({ id: g.id, n: mis });
      if (mis < g.n) laisse.push({ id: g.id, n: g.n - mis });
    });
    return { pris: pris, laisse: laisse, reliques: rel };
  }

  // ==========================================================
  //  Le dessin sur la carte
  // ==========================================================
  // Les noeuds de recolte et les coffres, a la taille du decor.
  function teinte(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    var v = Math.min(255, Math.round(((n >> 8) & 255) * k));
    var b = Math.min(255, Math.round((n & 255) * k));
    return 'rgb(' + r + ',' + v + ',' + b + ')';
  }

  function dessinerNoeud(ctx, sx, sy, n, t, pal, astre, proche) {
    var x = Math.round(sx), y = Math.round(sy);
    function p(px, py, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x + px, y + py, w, h); }
    // Une ombre au sol, et un liseré qui respire quand on est a portee.
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(x, y + 4, 8, 3, 0, 0, 6.3); ctx.fill();
    var o = objet(MAT_MONDE[astre.id]);
    if (n.type === 'filon') {
      p(-7, -6, 14, 10, pal.roche); p(-6, -8, 10, 3, pal.rocheHaut); p(-7, 2, 14, 2, pal.rocheOmbre);
      p(-4, -4, 2, 2, '#d0805a'); p(1, -2, 2, 2, '#5ad0a0'); p(3, -6, 2, 1, '#d0805a'); p(-2, 0, 1, 1, '#ffd07a');
    } else if (n.type === 'plante') {
      var f = pal.flore || '#5a8a3a', f2 = pal.flore2 || '#8ac85a', fl = pal.fleur || '#f2e27a';
      p(-6, -4, 3, 7, f); p(-2, -8, 3, 11, f2); p(2, -5, 3, 8, f); p(5, -2, 2, 5, f2);
      p(-1, -10, 2, 2, fl); p(-6, -6, 2, 2, fl); p(3, -7, 2, 2, fl);
    } else if (n.type === 'debris') {
      p(-8, -2, 9, 5, '#6a727c'); p(-8, -2, 9, 1, '#a8b0b8'); p(-2, -7, 7, 7, '#8a929c'); p(-2, -7, 7, 1, '#c8d0d8');
      p(4, 0, 4, 3, '#4a5058'); p(0, -4, 1, 1, '#2a2e34'); p(-5, 0, 1, 1, '#2a2e34'); p(6, -3, 1, 4, '#8a5a32');
    } else if (n.type === 'eclats') {
      var cr = pal.cristal || '#9fd8e8', cr2 = pal.cristal2 || '#e8f8ff';
      p(-5, -8, 3, 11, cr); p(-4, -8, 1, 9, cr2); p(-1, -11, 3, 14, cr); p(0, -11, 1, 12, cr2); p(3, -5, 3, 8, cr);
    } else if (n.type === 'gisement' && o) {
      // Le materiau du monde, qui affleure et brille.
      var ph = reduit ? 0.5 : (Math.sin(t / 380 + n.k) + 1) / 2;
      ctx.fillStyle = 'rgba(' + hexRgb(o.c[1]) + ',' + (0.15 + ph * 0.2).toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(x, y - 3, 12, 8, 0, 0, 6.3); ctx.fill();
      p(-7, -2, 14, 5, pal.roche); p(-7, -2, 14, 1, pal.rocheHaut);
      ctx.drawImage(icone(o.id), x - 9, y - 16);
    } else if (n.type === 'poussiere') {
      var ph2 = reduit ? 0.5 : (Math.sin(t / 300 + n.k) + 1) / 2;
      [[-5, -6], [3, -9], [0, -2], [6, -3], [-3, -11]].forEach(function (q, i) {
        var a = 0.4 + 0.6 * ((ph2 + i * 0.2) % 1);
        ctx.fillStyle = 'rgba(220,200,255,' + a.toFixed(2) + ')';
        ctx.fillRect(x + q[0] - 1, y + q[1], 3, 1); ctx.fillRect(x + q[0], y + q[1] - 1, 1, 3);
      });
      p(-6, 1, 12, 2, 'rgba(200,170,255,.5)');
    }
    if (proche) {
      var a2 = reduit ? 0.7 : 0.45 + 0.35 * Math.sin(t / 200);
      ctx.strokeStyle = 'rgba(255,240,170,' + a2.toFixed(2) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y + 3, 11, 4, 0, 0, 6.3); ctx.stroke();
    }
  }

  function hexRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }

  // Un coffre : bois cercle de fer, ou coffre scelle en metal mauve et or.
  // "ouv" de 0 (ferme) a 1 (le couvercle rabattu).
  function dessinerCoffre(ctx, sx, sy, c, t, ouv, proche) {
    var x = Math.round(sx), y = Math.round(sy);
    function p(px, py, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x + px, y + py, w, h); }
    var bois = c.scelle ? '#4a2a6a' : '#8a5a2a', bois2 = c.scelle ? '#7a4aa8' : '#b8824a';
    var fer = c.scelle ? '#e8c84a' : '#5a5a64', fer2 = c.scelle ? '#fff0a0' : '#9a9aa4';
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(x, y + 4, 11, 3, 0, 0, 6.3); ctx.fill();
    // La lueur de ce qui attend dedans.
    if (ouv > 0) {
      var g = ctx.createRadialGradient(x, y - 8, 1, x, y - 8, 26);
      g.addColorStop(0, 'rgba(255,240,170,' + (0.7 * ouv).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 26, y - 34, 52, 40);
    }
    // La caisse.
    p(-10, -8, 20, 11, bois); p(-10, -8, 20, 1, bois2); p(-10, 2, 20, 1, '#2a1a10');
    p(-10, -8, 2, 11, fer); p(8, -8, 2, 11, fer); p(-2, -6, 4, 4, fer2); p(-1, -4, 2, 1, '#1a1a22');
    // Le couvercle : il pivote vers l'arriere.
    var h = Math.round(6 * (1 - ouv));
    if (ouv < 1) {
      p(-10, -8 - h, 20, h, bois2); p(-10, -8 - h, 20, 1, '#fff2c8'); p(-10, -8 - h, 2, h, fer); p(8, -8 - h, 2, h, fer);
    }
    if (ouv > 0) {
      p(-10, -8 - Math.round(7 * ouv), 20, 2, bois2);
      p(-8, -7, 16, 3, '#1a1008');
    }
    if (c.scelle && ouv === 0) {
      // Des runes qui luisent sur le flanc.
      var a = reduit ? 0.8 : 0.5 + 0.5 * Math.sin(t / 260);
      ctx.fillStyle = 'rgba(255,120,220,' + a.toFixed(2) + ')';
      ctx.fillRect(x - 6, y - 3, 1, 3); ctx.fillRect(x + 5, y - 3, 1, 3); ctx.fillRect(x - 5, y - 1, 2, 1);
    }
    if (proche && ouv === 0) {
      var a3 = reduit ? 0.7 : 0.45 + 0.35 * Math.sin(t / 200);
      ctx.strokeStyle = 'rgba(255,240,170,' + a3.toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(x, y + 3, 14, 5, 0, 0, 6.3); ctx.stroke();
    }
  }

  // ==========================================================
  //  Les annonces
  // ==========================================================
  // Ce qu'on vient de gagner, en petits bandeaux qui s'empilent en haut
  // de l'ecran et s'effacent tout seuls.
  function annoncer(scene, liste, plein) {
    var pile_ = scene.querySelector('.ocr-gains');
    if (!pile_) { pile_ = el('div', 'ocr-gains'); scene.appendChild(pile_); }
    liste.forEach(function (g, i) {
      var o = objet(g.id);
      if (!o) return;
      var b = el('div', 'ocr-gain');
      b.style.animationDelay = (i * 0.12) + 's';
      b.appendChild(imgIcone(g.id, 'ocr-gain-ic'));
      b.appendChild(el('span', 'ocr-gain-n', '+' + g.n));
      b.appendChild(el('span', 'ocr-gain-nom', o.nom));
      pile_.appendChild(b);
      setTimeout(function () { b.classList.add('is-sortie'); }, 2400 + i * 120);
      setTimeout(function () { b.remove(); }, 2900 + i * 120);
    });
    if (plein) {
      var m = el('div', 'ocr-gain ocr-gain--plein', 'Sac plein');
      pile_.appendChild(m);
      setTimeout(function () { m.classList.add('is-sortie'); }, 2400);
      setTimeout(function () { m.remove(); }, 2900);
    }
  }

  // Une relique trouvee : elle monte au milieu de l'ecran, dans des
  // rayons, puis rejoint la vitrine.
  function devoiler(scene, id, fini) {
    var o = objet(id);
    if (!o) { if (fini) fini(); return; }
    var d = el('div', 'ocr-relique');
    d.appendChild(el('div', 'ocr-relique-rayons'));
    var cadre = el('div', 'ocr-relique-cadre');
    cadre.appendChild(imgIcone(id, 'ocr-relique-ic'));
    d.appendChild(cadre);
    d.appendChild(el('span', 'ocr-relique-haut', 'Objet de collection'));
    d.appendChild(el('strong', 'ocr-relique-nom', o.nom));
    d.appendChild(el('p', 'ocr-relique-txt', o.desc));
    var n = Object.keys(etat().vitrine).length;
    d.appendChild(el('span', 'ocr-relique-cpt', 'Vitrine · ' + n + ' / ' + RELIQUES.length));
    var ok = el('button', 'ocr-btn', 'Ranger dans la vitrine');
    ok.type = 'button';
    ok.addEventListener('click', function () {
      d.classList.add('is-sortie');
      setTimeout(function () { d.remove(); if (fini) fini(); }, reduit ? 0 : 350);
    });
    d.appendChild(ok);
    scene.appendChild(d);
    setTimeout(function () { ok.focus(); }, 50);
  }

  // ==========================================================
  //  Le panneau du sac
  // ==========================================================
  // jeu : { scene, utiliser(objet) -> texte | null, pv(), pvMax(), fermer() }
  function ouvrir(jeu, onglet) {
    var vieux = jeu.scene.querySelector('.ocr');
    if (vieux) vieux.remove();
    var box = el('div', 'ocr');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Sac');
    var fen = el('div', 'ocr-fen');
    box.appendChild(fen);

    var tete = el('div', 'ocr-tete');
    var onglets = el('div', 'ocr-onglets');
    var ONGLETS = [['sac', 'Sac'], ['fab', 'Fabrication'], ['equip', 'Équipement'], ['vitrine', 'Vitrine']];
    var boutons = {};
    ONGLETS.forEach(function (o) {
      var b = el('button', 'ocr-onglet', o[1]);
      b.type = 'button';
      b.addEventListener('click', function () { montrer(o[0]); });
      boutons[o[0]] = b;
      onglets.appendChild(b);
    });
    tete.appendChild(onglets);
    var fermer = el('button', 'ocr-fermer', '×');
    fermer.type = 'button';
    fermer.setAttribute('aria-label', 'Fermer le sac');
    fermer.addEventListener('click', clore);
    tete.appendChild(fermer);
    fen.appendChild(tete);

    var corps = el('div', 'ocr-corps');
    fen.appendChild(corps);
    var courant = onglet || 'sac', choisi = null;

    function clore() {
      box.classList.add('is-sortie');
      window.removeEventListener('keydown', clavier, true);
      setTimeout(function () { box.remove(); }, reduit ? 0 : 200);
      if (jeu.fermer) jeu.fermer();
    }
    function clavier(e) {
      if (e.key === 'Escape' || e.key === 'i' || e.key === 'I' || e.key === 'Tab') {
        e.preventDefault(); e.stopPropagation(); clore();
      }
    }
    window.addEventListener('keydown', clavier, true);

    function montrer(o) {
      courant = o;
      for (var k in boutons) boutons[k].classList.toggle('is-actif', k === o);
      corps.textContent = '';
      corps.scrollTop = 0;
      if (o === 'sac') vueSac();
      else if (o === 'fab') vueFab();
      else if (o === 'equip') vueEquip();
      else vueVitrine();
    }

    // ---------- Le sac ----------
    function vueSac() {
      var s = etat();
      var haut = el('div', 'ocr-ligne');
      haut.appendChild(el('span', 'ocr-titre', 'Sac'));
      haut.appendChild(el('span', 'ocr-cpt', s.cases.length + ' / ' + s.taille + ' cases'));
      corps.appendChild(haut);
      var grille = el('div', 'ocr-grille');
      for (var i = 0; i < s.taille; i++) {
        var c = s.cases[i];
        var b = el('button', 'ocr-case' + (c ? '' : ' is-vide'));
        b.type = 'button';
        if (c) {
          b.appendChild(imgIcone(c.id));
          if (c.n > 1) b.appendChild(el('span', 'ocr-n', String(c.n)));
          b.title = objet(c.id).nom;
          (function (cc, bb) {
            bb.addEventListener('click', function () { choisi = cc.id; detail(cc.id); marquer(bb); });
          })(c, b);
        } else b.disabled = true;
        grille.appendChild(b);
      }
      corps.appendChild(grille);
      var det = el('div', 'ocr-detail');
      det.appendChild(el('p', 'ocr-aide', s.cases.length ? 'Touche un objet pour le voir.' :
        'Ton sac est vide. Ramasse ce qui brille sur la carte : filons, plantes, débris, coffres…'));
      corps.appendChild(det);
      if (choisi && compter(choisi)) detail(choisi);
    }
    function marquer(b) {
      corps.querySelectorAll('.ocr-case.is-choisi').forEach(function (x) { x.classList.remove('is-choisi'); });
      b.classList.add('is-choisi');
    }

    function detail(id) {
      var det = corps.querySelector('.ocr-detail');
      if (!det) return;
      det.textContent = '';
      var o = objet(id);
      var l = el('div', 'ocr-det-tete');
      l.appendChild(imgIcone(id, 'ocr-det-ic'));
      var txt = el('div', 'ocr-det-txt');
      txt.appendChild(el('strong', 'ocr-det-nom', o.nom));
      txt.appendChild(el('span', 'ocr-det-cat', CATS[o.cat].nom + (o.monde ? ' · ' + nomMonde(o.monde) : '') + '  ·  ×' + compter(id)));
      txt.appendChild(el('p', 'ocr-det-desc', o.desc));
      l.appendChild(txt);
      det.appendChild(l);
      var actions = el('div', 'ocr-actions');
      if (o.cat === 'conso') {
        var u = el('button', 'ocr-btn', 'Utiliser');
        u.type = 'button';
        u.addEventListener('click', function () {
          var dit = jeu.utiliser ? jeu.utiliser(o) : null;
          if (dit === false) return;
          retirer(id, 1);
          if (dit) jeu.dire && jeu.dire(dit);
          // Une bombe, une grenade : on referme pour voir l'effet.
          if (o.bombe || o.givre || o.repulsif) return clore();
          montrer('sac');
        });
        actions.appendChild(u);
      }
      if (o.cat === 'equip') {
        var e = el('button', 'ocr-btn', 'Équiper');
        e.type = 'button';
        e.addEventListener('click', function () { equiper(id); if (jeu.maj) jeu.maj(); montrer('equip'); });
        actions.appendChild(e);
      }
      var j = el('button', 'ocr-btn ocr-btn--plat', 'Jeter 1');
      j.type = 'button';
      j.addEventListener('click', function () { retirer(id, 1); montrer('sac'); });
      actions.appendChild(j);
      det.appendChild(actions);
    }

    // ---------- La fabrication ----------
    function vueFab() {
      var s = etat();
      if (s.cases.length >= s.taille) {
        corps.appendChild(el('p', 'ocr-alerte', 'Ton sac est plein : fabriquer demande une case libre. Jette ou utilise quelque chose dans l’onglet Sac.'));
      }
      GROUPES.forEach(function (gr) {
        corps.appendChild(el('span', 'ocr-titre ocr-titre--groupe', gr.nom));
        var liste = el('div', 'ocr-recettes');
        RECETTES.filter(function (r) { return objet(r.id).cat === gr.cat; }).forEach(function (r) {
          liste.appendChild(carteRecette(r));
        });
        corps.appendChild(liste);
      });
    }

    function carteRecette(r) {
      var o = objet(r.id), fait = dejaFait(r), ferme = verrouillee(r), ok = peutFabriquer(r);
      var c = el('div', 'ocr-recette' + (fait ? ' is-fait' : '') + (ok ? ' is-pret' : ''));
      var res = el('div', 'ocr-rec-res');
      res.appendChild(imgIcone(r.id, 'ocr-rec-ic'));
      if (r.n > 1) res.appendChild(el('span', 'ocr-n', '×' + r.n));
      c.appendChild(res);
      var info = el('div', 'ocr-rec-info');
      info.appendChild(el('strong', 'ocr-rec-nom', o.nom));
      info.appendChild(el('span', 'ocr-rec-desc', o.desc));
      var mats = el('div', 'ocr-mats');
      for (var id in r.mats) {
        var a = compter(id), b = r.mats[id];
        var m = el('span', 'ocr-mat' + (a >= b ? ' is-ok' : ''));
        m.title = objet(id).nom;
        m.appendChild(imgIcone(id, 'ocr-mat-ic'));
        m.appendChild(el('span', null, Math.min(a, b) + '/' + b));
        m.dataset.id = id;
        mats.appendChild(m);
      }
      info.appendChild(mats);
      c.appendChild(info);
      var b2 = el('button', 'ocr-btn ocr-fab', fait ? (o.cat === 'outil' ? 'Possédé' : 'Fait') : ferme ? 'Verrouillé' : 'Fabriquer');
      b2.type = 'button';
      b2.disabled = !ok;
      if (ferme) b2.title = 'Il faut d’abord le ' + objet(r.requis).nom;
      else if (!fait && !ok && !manque(r).length) b2.title = 'Plus de place dans le sac';
      b2.addEventListener('click', function () {
        if (!peutFabriquer(r)) return;
        animerFabrication(c, r, function () {
          fabriquer(r.id);
          if (jeu.maj) jeu.maj();
          montrer('fab');
        });
      });
      c.appendChild(b2);
      return c;
    }

    // Les materiaux s'envolent de la carte de la recette, convergent, un
    // eclair, et l'objet apparait dans des rayons.
    function animerFabrication(carte, r, fini) {
      var o = objet(r.id);
      var voile = el('div', 'ocr-fab-anim');
      var centre = el('div', 'ocr-fab-centre');
      voile.appendChild(centre);
      box.appendChild(voile);
      var rb = box.getBoundingClientRect(), cb = centre.getBoundingClientRect();
      var cx = cb.left + cb.width / 2 - rb.left, cy = cb.top + cb.height / 2 - rb.top;
      carte.querySelectorAll('.ocr-mat').forEach(function (m, i) {
        var mb = m.getBoundingClientRect();
        var vol = imgIcone(m.dataset.id, 'ocr-fab-vol');
        vol.style.left = (mb.left - rb.left) + 'px';
        vol.style.top = (mb.top - rb.top) + 'px';
        vol.style.setProperty('--dx', (cx - (mb.left - rb.left) - 16) + 'px');
        vol.style.setProperty('--dy', (cy - (mb.top - rb.top) - 16) + 'px');
        vol.style.animationDelay = (i * 0.08) + 's';
        voile.appendChild(vol);
      });
      var duree = reduit ? 0 : 750;
      setTimeout(function () {
        voile.classList.add('is-eclair');
        var res = el('div', 'ocr-fab-res');
        res.appendChild(el('div', 'ocr-fab-rayons'));
        res.appendChild(imgIcone(r.id, 'ocr-fab-ic'));
        res.appendChild(el('strong', 'ocr-fab-nom', (r.n > 1 ? r.n + ' × ' : '') + o.nom));
        res.appendChild(el('span', 'ocr-fab-sous', o.cat === 'outil' ? 'Nouvel outil' : o.cat === 'sac' ? 'Le sac s’agrandit' : 'Fabriqué'));
        voile.appendChild(res);
        fini();
        setTimeout(function () {
          voile.classList.add('is-sortie');
          setTimeout(function () { voile.remove(); }, 300);
        }, reduit ? 600 : 1500);
      }, duree);
    }

    // ---------- L'equipement ----------
    function vueEquip() {
      var b = bonus();
      var st = el('div', 'ocr-stats');
      [['PV max', String(100 + b.pv)], ['Régénération', '×' + b.regen], ['Vitesse', '×' + b.vitesse.toFixed(2)], ['Dégâts', '×' + b.degats.toFixed(2)]]
        .forEach(function (q) { var s2 = el('span', 'ocr-stat'); s2.appendChild(el('em', null, q[0])); s2.appendChild(el('strong', null, q[1])); st.appendChild(s2); });
      corps.appendChild(st);
      corps.appendChild(el('span', 'ocr-titre ocr-titre--groupe', 'Porté'));
      var porte = el('div', 'ocr-portes');
      [['armure', 'Armure'], ['accessoire', 'Accessoire']].forEach(function (pl) {
        var id = equipe(pl[0]);
        var c = el('div', 'ocr-porte' + (id ? '' : ' is-vide'));
        c.appendChild(el('span', 'ocr-porte-place', pl[1]));
        if (id) {
          c.appendChild(imgIcone(id, 'ocr-rec-ic'));
          c.appendChild(el('strong', 'ocr-rec-nom', objet(id).nom));
          c.appendChild(el('span', 'ocr-rec-desc', objet(id).desc));
          var r = el('button', 'ocr-btn ocr-btn--plat', 'Retirer');
          r.type = 'button';
          r.addEventListener('click', function () {
            if (!desequiper(pl[0])) { jeu.dire && jeu.dire('Pas de place dans le sac pour le retirer.'); return; }
            if (jeu.maj) jeu.maj();
            montrer('equip');
          });
          c.appendChild(r);
        } else c.appendChild(el('span', 'ocr-rec-desc', 'Rien. Fabrique-en un dans l’onglet Fabrication.'));
        porte.appendChild(c);
      });
      corps.appendChild(porte);
      corps.appendChild(el('span', 'ocr-titre ocr-titre--groupe', 'Outils'));
      var outils = el('div', 'ocr-outils');
      ['pioche', 'foreuse', 'bottes', 'detecteur'].forEach(function (id) {
        var a = aOutil(id), o = objet(id);
        var c = el('div', 'ocr-outil' + (a ? '' : ' is-manque'));
        c.appendChild(imgIcone(id, 'ocr-rec-ic'));
        c.appendChild(el('strong', 'ocr-rec-nom', a ? o.nom : o.nom + ' · à fabriquer'));
        c.appendChild(el('span', 'ocr-rec-desc', o.desc));
        outils.appendChild(c);
      });
      corps.appendChild(outils);
    }

    // ---------- La vitrine ----------
    function vueVitrine() {
      var s = etat();
      var haut = el('div', 'ocr-ligne');
      haut.appendChild(el('span', 'ocr-titre', 'Vitrine'));
      haut.appendChild(el('span', 'ocr-cpt', Object.keys(s.vitrine).length + ' / ' + RELIQUES.length));
      corps.appendChild(haut);
      var g = el('div', 'ocr-vitrine');
      RELIQUES.forEach(function (o) {
        var a = !!s.vitrine[o.id];
        var c = el('div', 'ocr-vit' + (a ? '' : ' is-manque'));
        if (a) {
          c.appendChild(imgIcone(o.id, 'ocr-vit-ic'));
          c.appendChild(el('strong', 'ocr-vit-nom', o.nom));
          c.appendChild(el('span', 'ocr-vit-ou', o.monde ? nomMonde(o.monde) : 'Curiosité'));
          c.title = o.desc;
        } else {
          c.appendChild(el('span', 'ocr-vit-q', '?'));
          c.appendChild(el('span', 'ocr-vit-ou', o.monde ? nomMonde(o.monde) : 'Curiosité'));
        }
        g.appendChild(c);
      });
      corps.appendChild(g);
    }

    jeu.scene.appendChild(box);
    montrer(courant);
    fermer.focus();
    return { fermer: clore };
  }

  function nomMonde(id) {
    var V = window.ODYVIE, a = V && V.astre(id);
    return a ? a.nom : id;
  }

  // Ce qu'on voit d'un noeud, pour le bandeau du haut.
  function nomNoeud(type, astre) {
    var o = objet(MAT_MONDE[astre.id]);
    return {
      filon: 'Un filon de minerai', plante: 'Des plantes à fibres', debris: 'Des débris de métal',
      eclats: 'Des éclats de cristal', poussiere: 'De la poussière d’étoile',
      gisement: o ? 'Un gisement : ' + o.nom.toLowerCase() : 'Un gisement'
    }[type] || 'Quelque chose à ramasser';
  }

  window.ODYCRAFT = {
    nomNoeud: nomNoeud,
    LISTE: LISTE, RECETTES: RECETTES, RELIQUES: RELIQUES, MAT_MONDE: MAT_MONDE,
    objet: objet, icone: icone, url: url,
    compter: compter, ajouter: ajouter, retirer: retirer, place: place, rentre: rentre, taille: taille,
    aOutil: aOutil, aRelique: aRelique, equipe: equipe, equiper: equiper, desequiper: desequiper, bonus: bonus,
    peutFabriquer: function (id) { var r = recette(id); return !!r && peutFabriquer(r); }, fabriquer: fabriquer,
    recolte: recolte, butinBete: butinBete, butinGardien: butinGardien, contenuCoffre: contenuCoffre,
    coffreOuvert: coffreOuvert, marquerCoffre: marquerCoffre, empocher: empocher,
    dessinerNoeud: dessinerNoeud, dessinerCoffre: dessinerCoffre,
    annoncer: annoncer, devoiler: devoiler, ouvrir: ouvrir
  };
})();
