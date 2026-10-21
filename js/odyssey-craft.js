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
// sacs qu'on fabrique. On fabrique comme dans Minecraft : on pose les
// objets dans une grille (2 x 2 dans le sac, 3 x 3 a cote d'un etabli
// pose sur la carte), et la forme dit ce qui en sort. Un four, pose lui
// aussi, cuit les minerais en lingots, le cristal en verre, la viande...
// L'interface (grilles, livre de recettes, four) est dans
// js/odyssey-atelier.js. Ce qu'on fabrique :
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
    repas:   { nom: 'Nourriture', pile: 10 },
    bloc:    { nom: 'Station', pile: 4 },
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

    // ---- Les pieces : ce qu'on fabrique pour fabriquer ----
    { id: 'planches', nom: 'Planches', cat: 'mat', f: 'planches', c: ['#b8864a', '#e0b878', '#7a5428'],
      desc: 'Du bois scié. On en tire presque tout.' },
    { id: 'baton', nom: 'Bâton', cat: 'mat', f: 'baton', c: ['#a87a42', '#d8a868', '#5a3a1a'],
      desc: 'Un manche, pour les outils et les brochettes.' },
    { id: 'corde', nom: 'Corde', cat: 'mat', f: 'corde', c: ['#c8b07a', '#f0dca8', '#7a6438'],
      desc: 'De la fibre tressée. Elle tient tout.' },
    { id: 'lingot-fer', nom: 'Lingot de fer', cat: 'mat', f: 'lingot', c: ['#b8bcc4', '#ffffff', '#5a5e68'],
      desc: 'Du minerai de fer fondu au four.' },
    { id: 'lingot-cuivre', nom: 'Lingot de cuivre', cat: 'mat', f: 'lingot', c: ['#d8803a', '#ffc08a', '#7a3a14'],
      desc: 'Il brille comme une pièce neuve.' },
    { id: 'verre', nom: 'Verre', cat: 'mat', f: 'verre', c: ['#a8e0f0', '#ffffff', '#5a9ab0'],
      desc: 'Du cristal fondu au four, puis refroidi d’un coup.' },
    { id: 'plaque', nom: 'Plaque de fer', cat: 'mat', f: 'plaque', c: ['#9aa0aa', '#d8dce4', '#4a4e58'],
      desc: 'Deux lingots battus en une feuille.' },
    { id: 'rouage', nom: 'Rouage', cat: 'mat', f: 'rouage', c: ['#d8803a', '#ffc08a', '#7a3a14'],
      desc: 'Il fait tourner ce qui doit tourner.' },
    { id: 'charbon', nom: 'Charbon', cat: 'mat', f: 'charbon', c: ['#2a2a30', '#5a5a68', '#0a0a0e'],
      desc: 'Le meilleur combustible qu’on trouve sans aller sur Ignis.' },
    { id: 'bol', nom: 'Bol', cat: 'mat', f: 'bol', c: ['#b8864a', '#e0b878', '#7a5428'],
      desc: 'Pour y servir un ragoût.' },

    // ---- La nourriture ----
    { id: 'viande-crue', nom: 'Viande crue', cat: 'repas', f: 'viande', c: ['#d8505a', '#ff9aa0', '#7a1a24'], soin: 4,
      desc: 'Rend 4 PV. Mangeable, à peine : bien meilleure cuite au four.' },
    { id: 'viande-cuite', nom: 'Viande grillée', cat: 'repas', f: 'viande', c: ['#9a5a2a', '#d8945a', '#4a2a10'], soin: 30,
      desc: 'Rend 30 PV.' },
    { id: 'baies', nom: 'Baies', cat: 'repas', f: 'baies', c: ['#c83a6a', '#ff8ab0', '#2a6a1a'], soin: 6,
      desc: 'Rend 6 PV. Sucrées, un peu acides.' },
    { id: 'champignon', nom: 'Champignon', cat: 'repas', f: 'champignon', c: ['#c8402a', '#f0e8d8', '#6a1a10'], soin: 3,
      desc: 'Rend 3 PV. Cru, il ne vaut pas grand-chose ; grillé, si.' },
    { id: 'champignon-grille', nom: 'Champignon grillé', cat: 'repas', f: 'champignon', c: ['#8a4a2a', '#d8b088', '#3a1a0a'], soin: 15,
      desc: 'Rend 15 PV.' },
    { id: 'racine', nom: 'Racine', cat: 'repas', f: 'racine', c: ['#c8945a', '#f0c88a', '#6a4a22'], soin: 3,
      desc: 'Rend 3 PV. Dure comme du bois : à rôtir.' },
    { id: 'racine-rotie', nom: 'Racine rôtie', cat: 'repas', f: 'racine', c: ['#a8642a', '#e0a060', '#5a2a0a'], soin: 15,
      desc: 'Rend 15 PV.' },
    { id: 'brochette', nom: 'Brochette', cat: 'repas', f: 'brochette', c: ['#9a5a2a', '#d8945a', '#a87a42'], soin: 45,
      desc: 'Rend 45 PV.' },
    { id: 'ragout', nom: 'Ragoût', cat: 'repas', f: 'ragout', c: ['#b8864a', '#c8703a', '#7a5428'], soin: 80, regen: 15,
      desc: 'Rend 80 PV, puis soigne vite pendant 15 secondes.' },

    // ---- Les stations : on les pose sur la carte ----
    { id: 'etabli', nom: 'Établi', cat: 'bloc', f: 'etabli', c: ['#b8864a', '#e0b878', '#5a3a1a'],
      desc: 'À poser sur la carte. À côté de lui, la grille de fabrication passe à 3 × 3.' },
    { id: 'four', nom: 'Four', cat: 'bloc', f: 'four', c: ['#8a8680', '#b8b4ac', '#3a3834'],
      desc: 'À poser sur la carte. Il cuit les minerais, le cristal et la nourriture, avec du combustible.' },

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

    // ---- Les outils : ils s'usent, et se reparent avec leur materiau ----
    // "outil" est leur sorte, "rang" leur palier, "dur" leur solidite.
    { id: 'pioche-pierre', nom: 'Pioche en pierre', cat: 'outil', outil: 'pioche', rang: 1, dur: 40, repare: 'pierre',
      f: 'pioche', c: ['#8a8680', '#b8b4ac', '#7a5a2a'],
      desc: 'Casse les rochers : face à un rocher, MINER. Elle s’use vite.' },
    { id: 'pioche-fer', nom: 'Pioche en fer', cat: 'outil', outil: 'pioche', rang: 2, dur: 150, repare: 'lingot-fer',
      f: 'pioche', c: ['#c8ccd4', '#ffffff', '#7a5a2a'],
      desc: 'Casse les rochers, et en tire davantage. Solide.' },
    { id: 'pioche-astrale', nom: 'Pioche astrale', cat: 'outil', outil: 'pioche', rang: 3, dur: 500, repare: 'lingot',
      f: 'pioche', c: ['#7a6ae8', '#e0d8ff', '#2a2a5a'],
      desc: 'Chaque rocher donne le double. Presque inusable.' },
    { id: 'hache-pierre', nom: 'Hache en pierre', cat: 'outil', outil: 'hache', rang: 1, dur: 40, repare: 'pierre',
      f: 'hache', c: ['#8a8680', '#b8b4ac', '#7a5a2a'],
      desc: 'Coupe les grandes plantes : COUPER. Deux fois plus qu’à mains nues.' },
    { id: 'hache-fer', nom: 'Hache en fer', cat: 'outil', outil: 'hache', rang: 2, dur: 150, repare: 'lingot-fer',
      f: 'hache', c: ['#c8ccd4', '#ffffff', '#7a5a2a'],
      desc: 'Coupe les grandes plantes, et en tire encore plus.' },
    { id: 'foreuse', nom: 'Foreuse à cristaux', cat: 'outil', outil: 'foreuse', rang: 2, dur: 120, repare: 'lingot-fer',
      f: 'foreuse', c: ['#e8a82a', '#fff0a0', '#5a5a64'],
      desc: 'Perce les cristaux : face à un cristal, FORER. Elle s’use.' },
    { id: 'foreuse-astrale', nom: 'Foreuse astrale', cat: 'outil', outil: 'foreuse', rang: 3, dur: 400, repare: 'lingot',
      f: 'foreuse', c: ['#8a6ae8', '#e0d0ff', '#2a2a5a'],
      desc: 'Perce les cristaux, et en tire le double.' },
    { id: 'bottes', nom: 'Bottes de flottaison', cat: 'outil', outil: 'bottes', rang: 1, dur: 300, repare: 'resine',
      f: 'bottes', c: ['#3a8ad8', '#a8e0ff', '#1a3a6a'],
      desc: 'Dans le sac, tu marches sur les liquides. Chaque case de liquide les use un peu.' },
    { id: 'detecteur', nom: 'Détecteur', cat: 'outil', outil: 'detecteur', rang: 1,
      f: 'detecteur', c: ['#5a6070', '#7af0a8', '#2a2e38'],
      desc: 'Dans le sac, il montre les coffres sur la mini-carte. Il ne s’use pas.' },

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
  // Comme dans Minecraft : une recette a une FORME (les lettres disent
  // quoi mettre ou, l'espace laisse la case vide ; on peut la poser
  // n'importe ou dans la grille, et en miroir), ou n'en a pas ("sans" :
  // les ingredients, dans n'importe quel ordre). Ce qui tient en 2 x 2 se
  // fait dans le sac ; le reste demande un etabli, et sa grille de 3 x 3.
  var RECETTES = [
    { id: 'planches', n: 4, sans: ['bois'] },
    { id: 'baton', n: 4, forme: ['P', 'P'], cles: { P: 'planches' } },
    { id: 'corde', sans: ['fibre', 'fibre', 'fibre'] },
    { id: 'etabli', forme: ['PP', 'PP'], cles: { P: 'planches' } },
    { id: 'bandage', n: 2, sans: ['corde', 'resine'] },
    { id: 'trousse', sans: ['bandage', 'glande', 'resine'] },
    { id: 'elixir', sans: ['verre', 'coeur-bete', 'poussiere', 'poussiere'] },
    { id: 'repulsif', sans: ['resine', 'resine', 'glande', 'baies'] },
    { id: 'plaque', forme: ['LL'], cles: { L: 'lingot-fer' } },
    { id: 'ragout', sans: ['bol', 'viande-cuite', 'racine-rotie', 'champignon-grille'] },

    { id: 'four', forme: ['PPP', 'P P', 'PPP'], cles: { P: 'pierre' } },
    { id: 'bol', n: 4, forme: ['P P', ' P '], cles: { P: 'planches' } },
    { id: 'rouage', n: 2, forme: [' L ', 'L L', ' L '], cles: { L: 'lingot-cuivre' } },
    { id: 'brochette', forme: ['V', 'C', 'B'], cles: { V: 'viande-cuite', C: 'champignon-grille', B: 'baton' } },
    { id: 'pioche-pierre', forme: ['PPP', ' B ', ' B '], cles: { P: 'pierre', B: 'baton' } },
    { id: 'pioche-fer', forme: ['LLL', ' B ', ' B '], cles: { L: 'lingot-fer', B: 'baton' } },
    { id: 'pioche-astrale', forme: ['NXN', ' B ', ' B '], cles: { N: 'lingot', X: 'noyau', B: 'baton' } },
    { id: 'hache-pierre', forme: ['PP', 'PB', ' B'], cles: { P: 'pierre', B: 'baton' } },
    { id: 'hache-fer', forme: ['LL', 'LB', ' B'], cles: { L: 'lingot-fer', B: 'baton' } },
    { id: 'foreuse', forme: ['CCC', 'LRL', ' B '], cles: { C: 'cristal', L: 'lingot-fer', R: 'rouage', B: 'baton' } },
    { id: 'foreuse-astrale', forme: ['PPP', 'NRN', ' X '], cles: { P: 'poussiere', N: 'lingot', R: 'rouage', X: 'noyau' } },
    { id: 'bottes', forme: ['C C', 'E E'], cles: { C: 'cuir', E: 'ecaille' } },
    { id: 'detecteur', forme: [' B ', 'LVL', 'LRL'], cles: { B: 'baton', L: 'lingot-cuivre', V: 'verre', R: 'rouage' } },
    { id: 'bouclier', forme: ['FCF', 'FFF', ' F '], cles: { F: 'ferraille', C: 'cristal' } },
    { id: 'bombe', n: 2, forme: [' C ', 'FGF', ' F '], cles: { C: 'corde', F: 'ferraille', G: 'glande' } },
    { id: 'grenade-givre', n: 2, forme: [' C ', 'FGF', ' F '], cles: { C: 'corde', F: 'ferraille', G: 'givre' } },
    { id: 'armure-ferraille', forme: ['F F', 'FCF', 'FFF'], cles: { F: 'ferraille', C: 'cuir' } },
    { id: 'armure-ecailles', forme: ['E E', 'ECE', 'EEE'], cles: { E: 'ecaille', C: 'cuir' } },
    { id: 'armure-astrale', forme: ['N N', 'PXP', 'NNN'], cles: { N: 'lingot', P: 'poussiere', X: 'noyau' } },
    { id: 'amulette-vie', forme: [' C ', 'C C', ' H '], cles: { C: 'corde', H: 'coeur-bete' } },
    { id: 'bottes-course', forme: ['C C', 'C C', 'O O'], cles: { C: 'cuir', O: 'oxyde' } },
    { id: 'anneau-ambre', forme: [' A ', 'L L', ' L '], cles: { A: 'ambre', L: 'lingot-cuivre' } },
    { id: 'sac-toile', forme: [' C ', 'F F', 'FFF'], cles: { C: 'corde', F: 'fibre' } },
    { id: 'sac-renforce', forme: [' C ', 'K K', 'KEK'], cles: { C: 'corde', K: 'cuir', E: 'ecaille' } },
    { id: 'sac-vide', forme: [' X ', 'V V', 'VPV'], cles: { X: 'noyau', V: 'eclat-vide', P: 'poussiere' } }
  ];

  // La forme d'une recette en tableau d'identifiants (null : case vide),
  // et la grille qu'il lui faut.
  RECETTES.forEach(function (r) {
    if (r.forme) {
      r.motif = r.forme.map(function (ligne) {
        return ligne.split('').map(function (ch) { return ch === ' ' ? null : r.cles[ch]; });
      });
      r.l = Math.max.apply(null, r.forme.map(function (x) { return x.length; }));
      r.h = r.forme.length;
      r.motif.forEach(function (ligne) { while (ligne.length < r.l) ligne.push(null); });
      r.grille = Math.max(r.l, r.h) > 2 ? 3 : 2;
      r.ingredients = [].concat.apply([], r.motif).filter(Boolean);
    } else {
      r.grille = r.sans.length > 4 ? 3 : 2;
      r.ingredients = r.sans.slice();
    }
  });

  // ---------- Le four ----------
  // Ce qui cuit, ce que ca donne ; et combien de cuissons tient chaque
  // combustible. Une cuisson dure CUISSON_S secondes.
  var CUISSON = {
    fer: 'lingot-fer', cuivre: 'lingot-cuivre', cristal: 'verre', 'sable-chantant': 'verre', regolithe: 'verre',
    'viande-crue': 'viande-cuite', champignon: 'champignon-grille', racine: 'racine-rotie', bois: 'charbon'
  };
  var COMBUSTIBLE = { fibre: 1, corde: 1, baton: 0.5, planches: 1.5, bois: 4, resine: 2, charbon: 8, braise: 16 };
  var CUISSON_S = 5;

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
    planches: function (p, c) {
      p(1, 3, 14, 4, c[0]); p(1, 9, 14, 4, c[0]); p(1, 3, 14, 1, c[1]); p(1, 9, 14, 1, c[1]);
      p(1, 6, 14, 1, c[2]); p(1, 12, 14, 1, c[2]); p(5, 4, 1, 2, c[2]); p(11, 10, 1, 2, c[2]); p(9, 4, 3, 1, c[2]);
    },
    baton: function (p, c) {
      for (var i = 0; i < 11; i++) p(3 + i, 13 - i, 2, 2, i % 3 ? c[0] : c[1]);
      p(4, 13, 1, 1, c[2]); p(13, 3, 1, 1, c[2]);
    },
    corde: function (p, c) {
      ovale(p, 8, 8, 6, 5, c[0]); ovale(p, 8, 8, 3, 2, '#00000000');
      for (var i = 0; i < 6; i++) { p(3 + i * 2, 4 + (i % 2) * 7, 1, 2, c[2]); p(4 + i * 2, 5 + (i % 2) * 6, 1, 1, c[1]); }
      p(12, 11, 3, 3, c[0]); p(13, 13, 2, 2, c[2]);
    },
    verre: function (p, c) {
      p(3, 2, 10, 12, c[0]); p(4, 3, 8, 10, c[1]); p(4, 3, 8, 10, 'rgba(255,255,255,0)');
      p(4, 3, 8, 10, c[0]); p(5, 4, 1, 4, '#ffffff'); p(6, 4, 1, 2, '#ffffff'); p(10, 10, 1, 2, c[1]);
      p(3, 2, 10, 1, c[2]); p(3, 13, 10, 1, c[2]);
    },
    plaque: function (p, c) {
      p(2, 5, 12, 7, c[0]); p(2, 5, 12, 1, c[1]); p(2, 11, 12, 1, c[2]);
      p(3, 6, 1, 1, c[2]); p(12, 6, 1, 1, c[2]); p(3, 10, 1, 1, c[2]); p(12, 10, 1, 1, c[2]); p(5, 7, 5, 1, c[1]);
    },
    rouage: function (p, c) {
      ovale(p, 8, 8, 5, 5, c[0]);
      [[7, 1], [7, 13], [1, 7], [13, 7], [3, 3], [11, 3], [3, 11], [11, 11]].forEach(function (q) { p(q[0], q[1], 2, 2, c[0]); });
      ovale(p, 8, 8, 2, 2, c[2]); p(8, 8, 1, 1, '#00000000'); p(5, 5, 2, 1, c[1]);
    },
    charbon: function (p, c) {
      ovale(p, 8, 9, 6, 5, c[0]); p(4, 6, 3, 2, c[1]); p(9, 5, 2, 1, c[1]); p(11, 9, 2, 1, c[1]); p(6, 11, 2, 1, c[1]);
      p(8, 8, 1, 1, '#8a8a98');
    },
    viande: function (p, c) {
      ovale(p, 7, 8, 5, 5, c[0]); ovale(p, 6, 7, 3, 2, c[1]);
      p(11, 10, 4, 2, '#f0e8d8'); p(13, 9, 2, 1, '#f0e8d8'); p(13, 12, 2, 1, '#f0e8d8'); p(4, 11, 4, 1, c[2]);
    },
    baies: function (p, c) {
      ovale(p, 5, 9, 3, 3, c[0]); ovale(p, 10, 10, 3, 3, c[0]); ovale(p, 8, 6, 3, 3, c[0]);
      p(4, 8, 1, 1, c[1]); p(9, 9, 1, 1, c[1]); p(7, 5, 1, 1, c[1]);
      p(8, 1, 1, 3, c[2]); p(9, 1, 3, 2, c[2]);
    },
    champignon: function (p, c) {
      ovale(p, 8, 6, 6, 4, c[0]); p(2, 7, 13, 2, c[0]); p(6, 9, 4, 5, c[1]); p(6, 13, 4, 1, c[2]);
      p(5, 4, 2, 2, c[1]); p(10, 3, 2, 2, c[1]); p(8, 6, 1, 1, c[1]);
    },
    racine: function (p, c) {
      for (var i = 0; i < 10; i++) p(5 + Math.round(i * 0.3), 2 + i, Math.max(1, 5 - (i >> 1)), 1, c[0]);
      p(6, 3, 1, 6, c[1]); p(7, 12, 1, 3, c[2]); p(4, 1, 2, 2, '#5ac83a'); p(7, 0, 2, 2, '#5ac83a');
    },
    bol: function (p, c) {
      p(1, 6, 14, 2, c[1]); for (var y = 8; y < 13; y++) p(1 + (y - 7), y, 14 - (y - 7) * 2, 1, c[0]);
      p(5, 13, 6, 1, c[2]); p(2, 6, 12, 1, c[2]);
    },
    ragout: function (p, c) {
      p(1, 6, 14, 2, c[1]); for (var y = 8; y < 13; y++) p(1 + (y - 7), y, 14 - (y - 7) * 2, 1, c[0]);
      p(5, 13, 6, 1, c[2]); p(2, 5, 12, 2, c[1]); p(2, 5, 12, 1, '#7a3a14');
      p(4, 4, 2, 2, '#5ac83a'); p(8, 4, 2, 2, '#c8402a'); p(11, 4, 2, 2, '#e8c87a'); p(6, 1, 1, 2, '#e8e8f0'); p(10, 0, 1, 2, '#e8e8f0');
    },
    brochette: function (p, c) {
      for (var i = 0; i < 14; i++) p(1 + i, 14 - i, 1, 1, c[2]);
      ovale(p, 5, 10, 2, 2, c[0]); ovale(p, 9, 6, 2, 2, '#c8402a'); ovale(p, 12, 3, 2, 2, c[0]); p(4, 9, 1, 1, c[1]);
    },
    etabli: function (p, c) {
      p(1, 3, 14, 4, c[1]); p(1, 3, 14, 1, '#fff0c8'); p(2, 7, 12, 6, c[0]); p(2, 13, 2, 2, c[2]); p(12, 13, 2, 2, c[2]);
      p(4, 4, 1, 2, c[2]); p(8, 4, 1, 2, c[2]); p(12, 4, 1, 2, c[2]); p(5, 9, 6, 2, c[2]);
      p(10, 0, 1, 3, '#9aa4b0'); p(9, 0, 3, 1, '#c8ccd4');
    },
    four: function (p, c) {
      p(1, 2, 14, 13, c[0]); p(1, 2, 14, 1, c[1]); p(1, 14, 14, 1, c[2]);
      p(4, 7, 8, 5, '#1a1410'); p(5, 9, 6, 3, '#ff8a2a'); p(6, 10, 4, 2, '#ffe08a'); p(4, 4, 8, 1, c[2]);
      p(2, 4, 1, 1, c[2]); p(13, 6, 1, 1, c[2]);
    },
    hache: function (p, c) {
      for (var i = 0; i < 11; i++) p(3 + i, 14 - i, 2, 1, c[2]);
      p(8, 1, 5, 6, c[0]); p(7, 2, 2, 4, c[0]); p(12, 0, 2, 3, c[0]); p(8, 1, 5, 1, c[1]); p(12, 0, 1, 2, c[1]);
    },
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
  // Des cases fixes, comme dans Minecraft : s.cases[i] est la case i, vide
  // (null) ou { id, n } — un outil porte en plus son usure : { id, n: 1,
  // u: ce qu'il lui reste }. La grille du sac (2 x 2), celle de l'etabli
  // (3 x 3) et l'objet tenu en main sont gardes aussi : rien ne se perd en
  // refermant le sac.
  var OUTILS_V1 = { pioche: 'pioche-fer', foreuse: 'foreuse', bottes: 'bottes', detecteur: 'detecteur' };

  function etat() {
    var s = DP.sacOdyssee();
    if ((s.version || 1) < 2) {
      // L'ancien sac : des outils sans usure, qui ne prenaient pas de case.
      // Ils deviennent des objets neufs, dans le sac.
      s.grille2 = [null, null, null, null];
      s.grille3 = [null, null, null, null, null, null, null, null, null];
      s.main = null; s.vus = s.vus || {}; s.poses = s.poses || {};
      s.cases = s.cases.filter(Boolean);
      s.version = 2;
      Object.keys(OUTILS_V1).forEach(function (vieux) {
        if (!s.outils[vieux]) return;
        delete s.outils[vieux];
        var o = objet(OUTILS_V1[vieux]), cas = { id: o.id, n: 1 };
        if (o.dur) cas.u = o.dur;
        if (s.cases.length < s.taille) s.cases.push(cas);
        else s.grille2[s.grille2.indexOf(null)] = cas;
      });
      s.cases.forEach(function (c) { s.vus[c.id] = 1; });
      DP.sauverSac();
    }
    return s;
  }
  function sauver() { DP.sauverSac(); }
  function taille() { return etat().taille; }

  function compter(id) {
    return etat().cases.reduce(function (n, c) { return n + (c && c.id === id ? c.n : 0); }, 0);
  }
  function occupees(cases) {
    var n = 0; for (var i = 0; i < cases.length; i++) if (cases[i]) n++; return n;
  }
  function libres(cases) { return Math.max(0, taille() - occupees(cases)); }

  // Une case neuve pour "id" : avec son usure si c'est un outil.
  function neuve(id, n) {
    var o = objet(id), c = { id: id, n: n };
    if (o && o.dur) c.u = o.dur;
    return c;
  }

  // Combien de "id" peuvent encore entrer.
  function place(id, cases) {
    cases = cases || etat().cases;
    var P = pile(id), n = 0;
    cases.forEach(function (c) { if (c && c.id === id && !c.u) n += P - c.n; });
    return n + libres(cases) * P;
  }

  // Ajoute ce qui rentre (dans les piles entamees, puis dans les cases
  // vides) ; rend ce qui a vraiment ete ajoute. "u" : l'usure d'un outil
  // qu'on remet dans le sac.
  function ajouterDans(cases, id, n, u) {
    var P = pile(id), mis = 0, i;
    if (u == null) {
      for (i = 0; i < cases.length && n > 0; i++) {
        var c = cases[i];
        if (!c || c.id !== id || c.u != null) continue;
        var k = Math.min(P - c.n, n); c.n += k; n -= k; mis += k;
      }
    }
    var T_ = taille();
    for (i = 0; i < T_ && n > 0; i++) {
      if (cases[i]) continue;
      var k2 = Math.min(P, n);
      cases[i] = neuve(id, k2);
      if (u != null) cases[i].u = u;
      n -= k2; mis += k2;
    }
    return mis;
  }

  function ajouter(id, n, u) {
    var o = objet(id);
    if (!o || n <= 0) return 0;
    var s = etat();
    s.vus[id] = 1;
    // Les reliques vont dans la vitrine, les sacs agrandissent le sac.
    if (o.cat === 'relique') { if (!s.vitrine[id]) s.vitrine[id] = Date.now(); sauver(); return n; }
    if (o.cat === 'sac') { s.taille = Math.max(s.taille, o.taille); s.outils[id] = true; sauver(); return n; }
    var mis = ajouterDans(s.cases, id, n, u);
    sauver();
    return mis;
  }

  function retirer(id, n) {
    var s = etat();
    for (var i = s.cases.length - 1; i >= 0 && n > 0; i--) {
      var c = s.cases[i];
      if (!c || c.id !== id) continue;
      var k = Math.min(c.n, n); c.n -= k; n -= k;
      if (!c.n) s.cases[i] = null;
    }
    sauver();
    return n === 0;
  }

  // Est-ce qu'une liste [{id, n}] entre tout entiere dans le sac ?
  function rentre(liste) {
    var copie = etat().cases.map(function (c) { return c ? { id: c.id, n: c.n, u: c.u } : null; });
    return liste.every(function (g) {
      var o = objet(g.id);
      if (!o || o.cat === 'relique' || o.cat === 'sac') return true;
      return ajouterDans(copie, g.id, g.n) === g.n;
    });
  }

  function aRelique(id) { return !!etat().vitrine[id]; }

  // ---------- Les outils ----------
  // Le meilleur outil d'une sorte, dans le sac : le palier le plus haut.
  function meilleur(sorte) {
    var s = etat(), mieux = null;
    s.cases.forEach(function (c, i) {
      var o = c && objet(c.id);
      if (!o || o.outil !== sorte) return;
      if (!mieux || o.rang > mieux.o.rang) mieux = { i: i, c: c, o: o };
    });
    return mieux;
  }
  function aOutil(sorte) { return !!meilleur(sorte); }

  // On se sert d'un outil : il s'use d'un cran. A zero, il casse. "garder"
  // le laisse a un cran tant qu'on en a besoin (les bottes, au milieu d'un
  // lac) : il cassera en touchant terre.
  function user(sorte, garder) {
    var m = meilleur(sorte);
    if (!m) return null;
    var r = { o: m.o, rang: m.o.rang, brise: false };
    if (!m.o.dur) return r;
    m.c.u = Math.max(garder ? 1 : 0, (m.c.u == null ? m.o.dur : m.c.u) - 1);
    if (m.c.u <= 0) { etat().cases[m.i] = null; r.brise = true; }
    sauver();
    return r;
  }
  // Les bottes a bout, une fois revenu sur la terre ferme.
  function finirBottes() {
    var m = meilleur('bottes');
    if (!m || !m.o.dur || m.c.u > 1) return null;
    etat().cases[m.i] = null;
    sauver();
    return m.o;
  }

  // ---------- L'equipement ----------
  function equipe(place_) { return etat().equipe[place_] || null; }
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
  function desequiper(place_) {
    var s = etat(), id = s.equipe[place_];
    if (!id || !rentre([{ id: id, n: 1 }])) return false;
    delete s.equipe[place_];
    ajouterDans(s.cases, id, 1);
    sauver();
    return true;
  }
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

  // ==========================================================
  //  La grille de fabrication
  // ==========================================================
  // La grille est un tableau de n x n cases. On la reduit au rectangle
  // occupe, puis on la compare a chaque forme, telle quelle et en miroir.
  function cadre(grille, n) {
    var x0 = n, y0 = n, x1 = -1, y1 = -1;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      if (!grille[y * n + x]) continue;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    if (x1 < 0) return null;
    var m = [];
    for (y = y0; y <= y1; y++) {
      var l = [];
      for (x = x0; x <= x1; x++) { var c = grille[y * n + x]; l.push(c ? c.id : null); }
      m.push(l);
    }
    return m;
  }
  function memeMotif(a, b, miroir) {
    if (a.length !== b.length || a[0].length !== b[0].length) return false;
    var L = a[0].length;
    for (var y = 0; y < a.length; y++) for (var x = 0; x < L; x++) {
      if (a[y][x] !== b[y][miroir ? L - 1 - x : x]) return false;
    }
    return true;
  }

  // Ce que la grille fabrique : { r, sortie: { id, n, u? } }, ou null.
  function trouver(grille, n) {
    var pleines = grille.filter(Boolean);
    if (!pleines.length) return null;
    // La reparation : un outil use et son materiau, n'importe ou.
    if (pleines.length === 2) {
      var outil = pleines.filter(function (c) { var o = objet(c.id); return o && o.dur; })[0];
      var autre = pleines.filter(function (c) { return c !== outil; })[0];
      var oo = outil && objet(outil.id);
      if (oo && autre && autre.id === oo.repare && outil.u < oo.dur) {
        return { r: { repare: true, id: oo.id }, sortie: { id: oo.id, n: 1, u: Math.min(oo.dur, outil.u + Math.ceil(oo.dur / 2)) } };
      }
    }
    var motif = cadre(grille, n);
    var ids = pleines.map(function (c) { return c.id; }).sort();
    for (var i = 0; i < RECETTES.length; i++) {
      var r = RECETTES[i];
      if (r.grille > n) continue;
      if (r.forme) {
        if (memeMotif(motif, r.motif, false) || memeMotif(motif, r.motif, true)) return { r: r, sortie: neuve(r.id, r.n || 1) };
      } else if (r.sans.length === ids.length && r.sans.slice().sort().join('|') === ids.join('|')) {
        return { r: r, sortie: neuve(r.id, r.n || 1) };
      }
    }
    return null;
  }

  // Fabrique une fois : chaque case de la grille perd un objet.
  function consommer(grille) {
    for (var i = 0; i < grille.length; i++) {
      var c = grille[i];
      if (!c) continue;
      c.n--;
      if (c.n <= 0) grille[i] = null;
    }
    sauver();
  }
  function noterFabrique(id, n) {
    var s = etat();
    s.fabrique[id] = (s.fabrique[id] || 0) + n;
    s.vus[id] = 1;
    sauver();
  }

  // Le livre : une recette s'y inscrit des qu'on a tenu un de ses
  // ingredients, ou fabrique l'objet.
  function debloquee(r) {
    var s = etat();
    if (s.fabrique[r.id]) return true;
    return r.ingredients.some(function (id) { return s.vus[id]; });
  }

  // Remplit la grille avec une recette, en prenant dans le sac. Rend la
  // liste de ce qui manque (vide : c'est fait).
  function remplir(grille, n, r) {
    var besoin = {};
    r.ingredients.forEach(function (id) { besoin[id] = (besoin[id] || 0) + 1; });
    var manque = Object.keys(besoin).filter(function (id) { return compter(id) < besoin[id]; });
    if (manque.length) return manque;
    // Ce qui occupait la grille retourne au sac.
    var s = etat();
    for (var i = 0; i < grille.length; i++) {
      var c = grille[i];
      if (!c) continue;
      if (ajouterDans(s.cases, c.id, c.n, c.u) < c.n) return ['place'];
      grille[i] = null;
    }
    if (r.forme) {
      for (var y = 0; y < r.h; y++) for (var x = 0; x < r.l; x++) {
        var id = r.motif[y][x];
        if (!id) continue;
        retirer(id, 1);
        grille[y * n + x] = { id: id, n: 1 };
      }
    } else {
      r.sans.forEach(function (id, k) { retirer(id, 1); grille[k] = { id: id, n: 1 }; });
    }
    sauver();
    return [];
  }

  // ==========================================================
  //  Les stations posees : l'etabli et le four
  // ==========================================================
  // Elles restent la ou on les a posees, monde par monde.
  function poses(astre) {
    var s = etat();
    return s.poses[astre] || (s.poses[astre] = []);
  }
  function poser(astre, id, tx, ty) {
    var o = objet(id), s = etat();
    if (!o || o.cat !== 'bloc') return false;
    // On la pose depuis la main, ou depuis le sac.
    if (s.main && s.main.id === id) { s.main.n--; if (s.main.n <= 0) s.main = null; }
    else if (compter(id)) retirer(id, 1);
    else return false;
    var p = { id: id, tx: tx, ty: ty, k: Date.now() };
    if (id === 'four') { p.entree = null; p.combu = null; p.sortie = null; p.prog = 0; p.flamme = 0; p.t = Date.now(); }
    poses(astre).push(p);
    sauver();
    return p;
  }
  // On ne ramasse un four que vide : on ne veut pas perdre ce qui cuit.
  function ramasser(astre, p) {
    if (p.id === 'four' && (p.entree || p.combu || p.sortie)) return 'plein';
    if (!rentre([{ id: p.id, n: 1 }])) return 'place';
    var l = poses(astre), i = l.indexOf(p);
    if (i !== -1) l.splice(i, 1);
    ajouter(p.id, 1);
    return 'ok';
  }

  // Le four cuit en temps reel, meme quand on est loin : a chaque fois
  // qu'on le regarde, on rattrape le temps passe.
  function peutCuire(f) {
    if (!f.entree || !CUISSON[f.entree.id]) return false;
    var res = CUISSON[f.entree.id];
    return !f.sortie || (f.sortie.id === res && f.sortie.n < pile(res));
  }
  function avancerFour(f, maintenant) {
    maintenant = maintenant || Date.now();
    var dt = Math.max(0, (maintenant - (f.t || maintenant)) / 1000), change = false;
    f.t = maintenant;
    while (dt > 0.0001) {
      if (!peutCuire(f)) { f.prog = 0; break; }
      if (f.flamme <= 0) {
        if (!f.combu || !COMBUSTIBLE[f.combu.id]) break;
        f.flamme += COMBUSTIBLE[f.combu.id];
        f.combu.n--; if (f.combu.n <= 0) f.combu = null;
        change = true;
      }
      var pas = Math.min(dt, (1 - f.prog) * CUISSON_S, f.flamme * CUISSON_S);
      f.prog += pas / CUISSON_S; f.flamme -= pas / CUISSON_S; dt -= pas;
      if (f.prog >= 0.9999) {
        var res = CUISSON[f.entree.id];
        f.prog = 0;
        f.entree.n--; if (f.entree.n <= 0) f.entree = null;
        if (f.sortie) f.sortie.n++; else f.sortie = { id: res, n: 1 };
        etat().vus[res] = 1;
        change = true;
      }
    }
    if (change) sauver();
    return f;
  }
  function fourActif(f) { return f.flamme > 0 && peutCuire(f); }

  // ==========================================================
  //  Le butin
  // ==========================================================
  function un(liste, id, n) { if (n > 0) liste.push({ id: id, n: n }); }
  function chance(k) { return Math.random() < k; }

  // Ce que donne un noeud de la carte. "stellaire" : le monde est du
  // systeme stellaire (la poussiere d'etoile n'y tombe que la).
  function recolte(type, astre, opts) {
    var out = [], mm = MAT_MONDE[astre.id];
    if (type === 'filon') {
      un(out, 'pierre', hasard(1, 2));
      un(out, chance(0.55) ? 'fer' : 'cuivre', 1);
      if (chance(0.25)) un(out, 'charbon', 1);
      if (mm && chance(0.1)) un(out, mm, 1);
    } else if (type === 'plante') {
      un(out, 'fibre', hasard(2, 3));
      if (chance(0.35)) un(out, 'resine', 1);
      // De quoi manger : des baies, une racine, un champignon.
      var m = Math.random();
      if (m < 0.4) un(out, 'baies', hasard(1, 3));
      else if (m < 0.6) un(out, 'racine', 1);
      else if (m < 0.78) un(out, 'champignon', 1);
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
      // Le palier de la pioche compte : le fer en tire plus, l'astrale
      // double tout.
      var r = (opts && opts.rang) || 1;
      un(out, 'pierre', 2 + (r >= 2 ? 1 : 0));
      if (chance(0.3 + (r - 1) * 0.15)) un(out, 'fer', 1);
      if (chance(0.15 + (r - 1) * 0.1)) un(out, 'cuivre', 1);
      if (chance(0.2)) un(out, 'charbon', 1);
      if (mm && chance(0.06 * r)) un(out, mm, 1);
    } else if (type === 'cristal') {
      var rc = (opts && opts.rang) || 2;
      un(out, 'cristal', 3);
      if (mm && chance(0.15)) un(out, mm, 1);
      if (chance(0.03)) un(out, 'noyau', 1);
    } else if (type === 'grande-plante') {
      // Ce qu'on tire d'une grande plante depend de ce qu'elle est.
      var st = (opts && opts.style) || 'arbre', h = (opts && opts.rang) || 0;
      var k = h >= 2 ? 3 : h >= 1 ? 2 : 1;
      if (st === 'pic') { un(out, 'ferraille', k); if (chance(0.3)) un(out, 'fer', 1); }
      else if (st === 'givre') un(out, 'cristal', k);
      else if (st === 'prisme') { un(out, 'cristal', k); if (mm && chance(0.2)) un(out, mm, 1); }
      else if (st === 'flamme') { un(out, 'charbon', k); if (chance(0.25)) un(out, 'braise', 1); }
      else {
        un(out, 'bois', k);
        if (chance(0.4)) un(out, 'fibre', hasard(1, 2));
        if (st === 'champignon') un(out, 'champignon', hasard(1, 2));
        else if (chance(0.3)) un(out, 'baies', hasard(1, 2));
      }
    }
    // Une pioche ou une foreuse astrale : tout est double.
    if ((type === 'roche' || type === 'cristal') && opts && opts.rang >= 3) out.forEach(function (g) { g.n *= 2; });
    return out;
  }

  // Ce que laisse une bete abattue, selon sa force.
  function butinBete(v, astre) {
    var out = [], pal = v.palier || 1, mm = MAT_MONDE[astre.id];
    if (chance(0.6)) un(out, 'viande-crue', pal >= 3 ? 2 : 1);
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
  var COMMUNS = ['pierre', 'ferraille', 'fibre', 'resine', 'cristal', 'fer', 'cuivre', 'cuir', 'os',
                 'charbon', 'baies', 'planches', 'corde', 'baton', 'lingot-fer'];
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

  // Une station posee : l'etabli (une table de bois, une grille gravee, des
  // outils accroches) ou le four (un cube de pierre, la gueule qui rougeoie
  // quand il cuit, et sa fumee).
  function dessinerPose(ctx, sx, sy, p, t, proche) {
    var x = Math.round(sx), y = Math.round(sy);
    function q(px, py, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x + px, y + py, w, h); }
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(x, y + 3, 12, 3, 0, 0, 6.3); ctx.fill();
    if (p.id === 'etabli') {
      q(-11, -14, 22, 6, '#c8945a'); q(-11, -14, 22, 1, '#f0d0a0'); q(-11, -9, 22, 1, '#6a4422');
      q(-10, -8, 3, 10, '#8a5a2a'); q(7, -8, 3, 10, '#8a5a2a'); q(-10, -3, 20, 2, '#7a4a22');
      q(-6, -13, 1, 4, '#7a4a22'); q(-1, -13, 1, 4, '#7a4a22'); q(4, -13, 1, 4, '#7a4a22');
      q(-9, -12, 12, 1, '#7a4a22');
      // Une scie et un marteau poses dessus.
      q(5, -17, 5, 2, '#c8ccd4'); q(9, -17, 2, 3, '#8a5a2a'); q(-8, -18, 1, 4, '#8a5a2a'); q(-10, -19, 5, 2, '#8a8e98');
    } else {
      var f = p;
      avancerFour(f);
      var actif = fourActif(f);
      q(-11, -20, 22, 22, '#8a8680'); q(-11, -20, 22, 2, '#b8b4ac'); q(-11, 0, 22, 2, '#4a4844');
      q(-10, -15, 4, 3, '#7a7670'); q(4, -12, 5, 3, '#7a7670'); q(-4, -18, 6, 2, '#9a968e');
      q(-6, -10, 12, 8, '#1a1410');
      if (actif) {
        var ph = reduit ? 0.5 : (Math.sin(t / 120) + 1) / 2;
        q(-5, -6, 10, 4, ph > 0.5 ? '#ff8a2a' : '#ff6a1a'); q(-3, -8, 6, 3, '#ffc23a'); q(-1, -9, 2, 2, '#fff4b0');
        var g = ctx.createRadialGradient(x, y - 6, 1, x, y - 6, 22);
        g.addColorStop(0, 'rgba(255,170,60,.35)'); g.addColorStop(1, 'rgba(255,170,60,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 22, y - 28, 44, 34);
        // La fumee qui monte de la cheminee.
        if (!reduit) for (var i = 0; i < 3; i++) {
          var k = ((t / 1400) + i / 3) % 1;
          ctx.fillStyle = 'rgba(200,200,210,' + (0.4 * (1 - k)).toFixed(2) + ')';
          ctx.fillRect(Math.round(x + 6 + Math.sin(k * 6 + i) * 3), Math.round(y - 24 - k * 20), 3 + Math.round(k * 3), 3 + Math.round(k * 3));
        }
      }
      q(5, -24, 4, 5, '#6a6660');
      if (f.sortie) { q(-9, -19, 3, 3, '#ffd23a'); }
    }
    if (proche) {
      var a = reduit ? 0.7 : 0.45 + 0.35 * Math.sin(t / 200);
      ctx.strokeStyle = 'rgba(255,240,170,' + a.toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(x, y + 2, 15, 5, 0, 0, 6.3); ctx.stroke();
    }
  }

  // Un outil qui casse : un bandeau rouge, l'icone qui se fend.
  function annoncerBris(scene, o) {
    var pile_ = scene.querySelector('.ocr-gains');
    if (!pile_) { pile_ = el('div', 'ocr-gains'); scene.appendChild(pile_); }
    var b = el('div', 'ocr-gain ocr-gain--bris');
    var im = el('img', 'ocr-gain-ic ocr-bris-ic');
    im.src = url(o.id); im.alt = '';
    b.appendChild(im);
    b.appendChild(el('span', 'ocr-gain-nom', o.nom + ' s’est brisé' + (/e$|ée$/.test(o.nom.split(' ')[0]) ? 'e' : '') + ' !'));
    pile_.appendChild(b);
    setTimeout(function () { b.classList.add('is-sortie'); }, 2800);
    setTimeout(function () { b.remove(); }, 3300);
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
  // Il vit dans js/odyssey-atelier.js.
  function ouvrir(jeu, opts) {
    return window.ODYATELIER ? window.ODYATELIER.ouvrir(jeu, opts || {}) : null;
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

  // Les neuf premieres cases du sac forment la barre rapide, toujours
  // visible en bas de l'ecran, comme dans Minecraft.
  var BARRE = 9;

  window.ODYCRAFT = {
    BARRE: BARRE,
    nomNoeud: nomNoeud, nomMonde: nomMonde,
    LISTE: LISTE, CATS: CATS, RECETTES: RECETTES, RELIQUES: RELIQUES, MAT_MONDE: MAT_MONDE,
    CUISSON: CUISSON, COMBUSTIBLE: COMBUSTIBLE, CUISSON_S: CUISSON_S,
    objet: objet, pile: pile, icone: icone, url: url, imgIcone: imgIcone,
    etat: etat, sauver: sauver, taille: taille,
    compter: compter, ajouter: ajouter, ajouterDans: ajouterDans, retirer: retirer, place: place, rentre: rentre,
    aOutil: aOutil, meilleur: meilleur, user: user, finirBottes: finirBottes, aRelique: aRelique,
    equipe: equipe, equiper: equiper, desequiper: desequiper, bonus: bonus,
    trouver: trouver, consommer: consommer, noterFabrique: noterFabrique, debloquee: debloquee, remplir: remplir,
    poses: poses, poser: poser, ramasser: ramasser, avancerFour: avancerFour, fourActif: fourActif, peutCuire: peutCuire,
    recolte: recolte, butinBete: butinBete, butinGardien: butinGardien, contenuCoffre: contenuCoffre,
    coffreOuvert: coffreOuvert, marquerCoffre: marquerCoffre, empocher: empocher,
    dessinerNoeud: dessinerNoeud, dessinerCoffre: dessinerCoffre, dessinerPose: dessinerPose,
    annoncer: annoncer, annoncerBris: annoncerBris, devoiler: devoiler, ouvrir: ouvrir
  };
})();
