// La faune et les objets des neuf mondes de l'Odyssee.
//
// Le moteur (odyssey-vie.js) sait dessiner et ranger ; ce fichier-ci ne
// fait que remplir. Chaque ligne dit, dans l'ordre :
//   creature : identifiant, nom, silhouette, palier (1 a 5), couleur de
//              base, agressive (1) ou non (0), texte du scanner ;
//   objet    : identifiant, nom, forme, couleur de base, texte.
// Le palier fixe la resistance, les degats et la taille ; la couleur de
// base suffit, le clair et le sombre en sont tires.
(function () {
  var V = window.ODYVIE;
  if (!V) return;

  function vies(astre, lignes) {
    lignes.forEach(function (x) {
      V.VIES.push({
        id: x[0], astre: astre, nom: x[1], carrure: x[2], palier: x[3],
        c: V.teintes(x[4]), agressif: !!x[5], texte: x[6],
        taille: 0.7 + x[3] * 0.14,
        rarete: x[3] >= 4 ? 'rare' : 'commun'
      });
    });
  }

  function objets(astre, lignes) {
    lignes.forEach(function (x) {
      V.OBJETS.push({
        id: x[0], astre: astre, nom: x[1], forme: x[2],
        c: V.teintes(x[3]), texte: x[4], objet: true
      });
    });
  }

  // ==========================================================
  //  Mercure
  // ==========================================================
  vies('mercure', [
    ['pou-cendre', 'Pou de Cendre', 'insecte', 1, '#6b5a4a', 0,
      'Il saute d’une craquelure à l’autre pour ne jamais rester plus d’une seconde au soleil.'],
    ['tortue-solaire', 'Tortue Solaire', 'tortue', 2, '#b0782a', 0,
      'Sa carapace est polie comme un miroir : elle renvoie la chaleur vers le ciel, et elle survit.'],
    ['craquelin', 'Craquelin', 'crabe', 1, '#8a7f72', 0,
      'Il s’encastre dans les fissures du sol et ne bouge plus. On marche dessus sans le voir.'],
    ['mange-midi', 'Mange-Midi', 'limace', 2, '#d88a3a', 0,
      'Il ne sort qu’à midi solaire, quand le sol dépasse quatre cents degrés. Il adore ça.'],
    ['scorpion-terminateur', 'Scorpion du Terminateur', 'araignee', 3, '#a0542a', 1,
      'Il chasse sur la ligne entre le jour et la nuit, et suit cette ligne tout autour de la planète.'],
    ['grelon-fer', 'Grêlon de Fer', 'essaim', 2, '#9aa2aa', 0,
      'Une nuée de billes de fer magnétisées qui se déplacent ensemble. Le scanner hésite à dire « vivant ».'],
    ['chauve-ombre', 'Chauve-Ombre', 'oiseau', 2, '#2a2a36', 1,
      'Elle vole côté nuit, à ras du sol, et fond sur tout ce qui a encore un peu de chaleur.'],
    ['rouleur-scories', 'Rouleur de Scories', 'tortue', 1, '#5c4e40', 0,
      'Il pousse devant lui une boule de scories plus grosse que lui, sans que personne sache pourquoi.'],
    ['veilleur-caloris', 'Veilleur de Caloris', 'colosse', 4, '#7a5a3a', 1,
      'Il garde le bassin de Caloris comme si l’impact qui l’a creusé allait revenir.'],
    ['filament-thermique', 'Filament Thermique', 'serpent', 2, '#e8742a', 1,
      'Un serpent de métal chauffé au rouge. Il brûle ce qu’il enlace, sans le vouloir, et sans s’excuser.'],
    ['plaque-rampante', 'Plaque-Rampante', 'limace', 1, '#7a7065', 0,
      'Elle a exactement la couleur du sol, et elle le sait.'],
    ['soufflet', 'Soufflet', 'champignon', 1, '#c8a06a', 0,
      'Il gonfle le jour, se vide la nuit, et projette des spores quand on s’approche trop.'],
    ['rodeur-cratere', 'Rôdeur de Cratère', 'bipede', 3, '#6a6155', 1,
      'Il vit au fond des cratères et n’en sort que pour attraper ce qui passe sur le bord.'],
    ['nuee-mercure', 'Nuée de Vif-Argent', 'essaim', 1, '#c0c4c8', 0,
      'Des gouttelettes de mercure qui roulent ensemble, se séparent, puis se retrouvent. Inoffensives, en principe.'],
    ['geant-plomb', 'Géant de Plomb', 'colosse', 5, '#4a4a52', 1,
      'Le plus lourd de Mercure. Il avance d’un pas par minute, et rien ne l’a jamais fait reculer.'],
    ['lanterne-froide', 'Lanterne Froide', 'meduse', 2, '#8ab0d8', 0,
      'Elle flotte côté nuit et émet une lueur bleue qui ne réchauffe rien.'],
    ['raie-poussiere', 'Raie de Poussière', 'raie', 2, '#a2968a', 0,
      'Elle glisse sur la poussière électrostatique comme sur de l’eau.']
  ]);
  objets('mercure', [
    ['perle-zinc', 'Perle de Zinc', 'sphere', '#c8ccd0',
      'Une perle parfaite de métal solidifié, recrachée par un Fondeur de Zinc.'],
    ['verre-impact', 'Verre d’Impact', 'cristal', '#6a8a7a',
      'Du sable fondu par une météorite, figé en verre vert. Il date de quatre milliards d’années.'],
    ['fossile-fonte', 'Fossile de Fonte', 'fossile', '#7a7065',
      'La forme d’une créature, restée dans le métal quand la flaque a refroidi autour d’elle.'],
    ['scorie-creuse', 'Scorie Creuse', 'geode', '#4a4038',
      'Une coque de scorie vide. Quelque chose y a vécu, puis est parti.'],
    ['sonde-messenger', 'Épave de MESSENGER', 'epave', '#c4c9d0',
      'Une vraie sonde terrienne, écrasée volontairement sur Mercure en 2015. Le Téléportail la reconnaît.'],
    ['flaque-figee', 'Flaque Figée', 'plaque', '#c2541a',
      'Une mare de métal qui a gelé en pleine vague quand la nuit est tombée.']
  ]);

  // ==========================================================
  //  Venus
  // ==========================================================
  vies('venus', [
    ['brume-vive', 'Brume-Vive', 'essaim', 1, '#d6dd62', 0,
      'Un nuage qui se déplace contre le vent. Il est fait de milliers de bestioles d’un demi-millimètre.'],
    ['crabe-corrosif', 'Crabe Corrosif', 'crabe', 2, '#b9c03a', 1,
      'Ses pinces suintent d’acide. Il pince d’abord, et le reste fond ensuite.'],
    ['pieuvre-brume', 'Pieuvre de Brume', 'meduse', 2, '#c9b24a', 0,
      'Elle nage dans l’atmosphère épaisse comme une pieuvre dans la mer.'],
    ['tortue-blindee', 'Tortue Blindée', 'tortue', 2, '#7d6520', 0,
      'Sa carapace fait six centimètres d’épaisseur : c’est ce qu’il faut pour tenir sous cette pression.'],
    ['limace-vitriol', 'Limace Vitriol', 'limace', 1, '#d8e06a', 0,
      'Elle laisse derrière elle un sillon creusé dans la roche.'],
    ['mante-soufre', 'Mante de Soufre', 'insecte', 3, '#e0c83a', 1,
      'Elle attend, immobile et jaune dans le jaune, jusqu’à ce qu’on soit à portée.'],
    ['aile-jaune', 'Aile Jaune', 'oiseau', 2, '#f0d860', 0,
      'Elle ne vole pas : elle nage dans l’air, tant il est dense.'],
    ['serpent-nappes', 'Serpent des Nappes', 'serpent', 3, '#a8b030', 1,
      'Il dort dans les mares d’acide et en sort d’un coup quand quelque chose passe au bord.'],
    ['champignon-fumant', 'Champignon Fumant', 'champignon', 1, '#b0903a', 0,
      'Il fume en permanence. Ce n’est pas de la fumée, ce sont ses spores.'],
    ['tisseuse-acide', 'Tisseuse d’Acide', 'araignee', 3, '#c8c040', 1,
      'Sa toile est en fils de soufre. Elle ne la tend pas : elle la jette.'],
    ['pelerin-maxwell', 'Pèlerin de Maxwell', 'bipede', 2, '#8d7226', 0,
      'Il monte vers le mont Maxwell toute sa vie, et n’y arrive jamais.'],
    ['raie-volcanique', 'Raie Volcanique', 'raie', 3, '#c26a2a', 1,
      'Elle survole les coulées de lave fraîche et fonce sur ce qui bouge dessus.'],
    ['goinfre-lave', 'Goinfre de Lave', 'rampant', 2, '#e05a1a', 0,
      'Il mange de la lave refroidie et devient un peu plus lourd à chaque bouchée.'],
    ['colonne-chantante', 'Colonne Chantante', 'cristallin', 2, '#f0e08a', 0,
      'Des cristaux de soufre qui vibrent dans le vent. Ils chantent faux, mais fort.'],
    ['titan-ishtar', 'Titan d’Ishtar', 'colosse', 5, '#6a4a10', 1,
      'Il règne sur les hauts plateaux d’Ishtar. Le Chanteur de Pression se tait quand il approche.'],
    ['poussiere-ardente', 'Poussière Ardente', 'essaim', 2, '#ffb02e', 1,
      'Un essaim brûlant qui s’enroule autour de ses proies comme une écharpe.'],
    ['bulle-errante', 'Bulle Errante', 'flottant', 1, '#f4f79a', 0,
      'Une bulle vivante qui dérive au ras du sol. Elle éclate si on la touche, puis se reforme.']
  ]);
  objets('venus', [
    ['cristal-soufre', 'Cristal de Soufre', 'cristal', '#f0e08a',
      'Des aiguilles jaunes qui poussent en une nuit et fondent dans la journée.'],
    ['fleur-acide', 'Fleur d’Acide', 'fleur', '#d6dd62',
      'Elle ne fane pas : elle se dissout, et repousse un peu plus loin.'],
    ['epave-venera', 'Épave de Venera', 'epave', '#8a8f96',
      'Un atterrisseur soviétique des années soixante-dix. Il a tenu deux heures ici. C’était un record.'],
    ['pierre-chantante', 'Pierre Chantante', 'totem', '#a98c34',
      'Elle répond au Chanteur de Pression, une note plus haut.'],
    ['bulle-petrifiee', 'Bulle Pétrifiée', 'sphere', '#f4f79a',
      'Une Bulle Errante qui a éclaté trop près d’une mare, et qui n’a pas su se reformer.'],
    ['geyser-soufre', 'Geyser de Soufre', 'geyser', '#e0c83a',
      'Il souffle toutes les quatre minutes, pile. Les Aile Jaune s’en servent pour monter.']
  ]);

  // ==========================================================
  //  La Terre
  // ==========================================================
  vies('terre', [
    ['herisson', 'Hérisson', 'rampant', 1, '#7a6048', 0,
      'Il traverse le jardin toutes les nuits à la même heure. Ce soir, il s’est arrêté devant le cratère.'],
    ['merle', 'Merle', 'oiseau', 1, '#2a2a2a', 0,
      'Il a chanté à trois heures du matin, juste avant l’impact. Le Téléportail l’a noté.'],
    ['escargot', 'Escargot', 'limace', 1, '#a08a5a', 0,
      'Il a mis toute la nuit à traverser l’allée. Il en mettra une autre pour revenir.'],
    ['crapaud', 'Crapaud de la Mare', 'rampant', 1, '#5a7a3a', 0,
      'Il vit dans la mare depuis plus longtemps que toi dans la maison.'],
    ['araignee-cabanon', 'Araignée du Cabanon', 'araignee', 1, '#3a3028', 0,
      'Elle a refait sa toile trois fois cette semaine. Elle refuse de s’installer sous le cabanon, on se demande pourquoi.'],
    ['hibou', 'Hibou', 'oiseau', 2, '#8a7050', 0,
      'Il te regarde depuis le poteau. Il était déjà là quand la comète est tombée, et il n’a pas bougé.'],
    ['renard', 'Renard', 'rampant', 2, '#c8622a', 0,
      'Il vient renifler le cratère toutes les dix minutes, puis repart.'],
    ['guepe', 'Guêpe', 'insecte', 1, '#e8c02a', 1,
      'Elle n’aime pas qu’on s’approche du nid, sous le rebord de la fenêtre.'],
    ['taupe', 'Taupe', 'rampant', 1, '#3a3438', 0,
      'Elle a creusé jusqu’au cratère par en dessous. Elle a dû être surprise.'],
    ['champignon-blanc', 'Champignon Blanc', 'champignon', 1, '#e8e0d0', 0,
      'Il a poussé en une heure, au bord du cratère. Ce n’est pas normal, mais il a l’air content.'],
    ['tortue-voisin', 'Tortue du Voisin', 'tortue', 1, '#6a7a3a', 0,
      'Elle s’échappe tous les étés. Elle est arrivée jusqu’ici, finalement.'],
    ['chauve-souris', 'Chauve-souris', 'oiseau', 1, '#3a3040', 0,
      'Elle tourne autour de la lampe du jardin et ignore tout le reste.'],
    ['ecrevisse-mare', 'Écrevisse de la Mare', 'crabe', 1, '#8a3a22', 0,
      'Personne ne sait comment elle est arrivée dans la mare.'],
    ['sanglier', 'Sanglier', 'colosse', 3, '#4a3a2a', 1,
      'Il est descendu de la forêt, attiré par le bruit. Il n’aime pas qu’on le regarde.'],
    ['chien-errant', 'Chien Errant', 'rampant', 2, '#8a6a4a', 1,
      'Il grogne vers le cratère depuis tout à l’heure. Maintenant, il grogne vers toi.'],
    ['moucherons', 'Nuée de Moucherons', 'essaim', 1, '#6a6a4a', 0,
      'Ils dansent au-dessus de la mare, comme tous les soirs, comme si rien ne s’était passé.'],
    ['chose-qui-regarde', 'La Chose-qui-Regarde', 'flottant', 4, '#1a1a2a', 1,
      'Elle flotte au-dessus du cabanon et ne fait que regarder. Le scanner refuse de l’analyser plus longtemps.']
  ]);
  objets('terre', [
    ['nain-jardin', 'Nain de Jardin', 'totem', '#c8422a',
      'Il était tourné vers la maison. Il est maintenant tourné vers le cratère. Personne ne l’a touché.'],
    ['roses', 'Rosier', 'fleur', '#d8304a',
      'Les roses de ta mère. Elles ont survécu à l’onde de choc, pas le pot.'],
    ['ballon-perdu', 'Ballon Perdu', 'sphere', '#2a68c4',
      'Un ballon de foot oublié depuis l’été dernier, un peu roussi maintenant.'],
    ['eclat-comete', 'Éclat de Comète', 'cristal', '#7cf0c8',
      'Un fragment de la comète. Il pulse au même rythme que le Téléportail.'],
    ['vieux-velo', 'Vieux Vélo', 'epave', '#6a6a6a',
      'Ton premier vélo. Il rouille contre le cabanon depuis des années.'],
    ['os-poulet', 'Os de Poulet', 'os', '#f0e8d8',
      'Le renard est passé par là. Le scanner le classe « vestige organique, dimanche dernier ».']
  ]);

  // ==========================================================
  //  La Lune
  // ==========================================================
  vies('lune', [
    ['poussiere-vivante', 'Poussière Vivante', 'essaim', 1, '#b8b8b0', 0,
      'De la poussière qui se lève toute seule quand le Soleil passe l’horizon. Les astronautes l’avaient signalée.'],
    ['crabe-regolithe', 'Crabe de Régolithe', 'crabe', 1, '#9a9a92', 0,
      'Il s’enterre dans le régolithe et n’en sort que les yeux.'],
    ['sauteur-lunaire', 'Sauteur Lunaire', 'insecte', 1, '#c8c8c0', 0,
      'Avec un sixième de la pesanteur, un saut l’emmène à vingt mètres.'],
    ['tortue-tranquillite', 'Tortue de la Tranquillité', 'tortue', 2, '#8a8a84', 0,
      'Elle vit dans la mer de la Tranquillité, et elle porte bien son nom.'],
    ['limace-grise', 'Limace Grise', 'limace', 1, '#a0a098', 0,
      'Elle mange les traces de pas. Celles d’Apollo 11, elle ne les a pas trouvées.'],
    ['raie-cendre', 'Raie de Cendre', 'raie', 2, '#6a6a66', 0,
      'Elle glisse au ras du sol sans soulever un grain de poussière.'],
    ['oiseau-sans-air', 'Oiseau Sans Air', 'oiseau', 2, '#d0d0c8', 0,
      'Il bat des ailes pour rien — il n’y a pas d’air ici. Il avance quand même.'],
    ['meduse-vide', 'Méduse du Vide', 'meduse', 2, '#c8d0e0', 0,
      'Elle flotte à hauteur d’homme et suit les ombres des cratères.'],
    ['rodeur-copernic', 'Rôdeur de Copernic', 'bipede', 3, '#5a5a56', 1,
      'Il descend du cratère Copernic pour chasser. Il marche en bonds lents et précis.'],
    ['serpent-regolithe', 'Serpent de Régolithe', 'serpent', 2, '#8a8a82', 1,
      'Il nage sous la poussière et ne laisse voir qu’une ride qui file vers toi.'],
    ['araignee-selene', 'Araignée Sélène', 'araignee', 3, '#d8d8d0', 1,
      'Elle tend ses fils entre les rochers, à l’ombre. On ne les voit qu’en les touchant.'],
    ['champignon-base', 'Champignon de Serre', 'champignon', 1, '#b8c8a8', 0,
      'Il s’est échappé de la serre de la base. Il pousse maintenant au soleil, et il a très bien réussi.'],
    ['robot-entretien', 'Robot d’Entretien', 'machine', 1, '#c4c9d0', 0,
      'Il nettoie les panneaux de la base, même si personne ne les utilise plus depuis longtemps.'],
    ['drone-garde', 'Drone de Garde', 'machine', 3, '#8a8f96', 1,
      'Il protège la base. Ses ordres ne prévoient pas de visiteurs, alors il tire.'],
    ['colosse-tycho', 'Colosse de Tycho', 'colosse', 4, '#4a4a46', 1,
      'Il vient du cratère Tycho, le plus jeune et le plus brillant de la Lune. Lui n’a rien de brillant.'],
    ['cristal-helium', 'Cristal d’Hélium', 'cristallin', 1, '#e8f0ff', 0,
      'De l’hélium 3 cristallisé, à l’état pur. La base a été construite pour ça.'],
    ['fouisseur-selenite', 'Fouisseur Sélénite', 'rampant', 2, '#7a7a72', 0,
      'Il creuse des galeries qui mènent toutes vers la grande grotte.'],
    ['veilleur-face-cachee', 'Veilleur de la Face Cachée', 'flottant', 4, '#1a1a24', 1,
      'Il vient de la face qu’on ne voit jamais depuis la Terre. Il ne devrait pas être de ce côté-ci.'],
    ['larve-selenophage', 'Larve du Sélénophage', 'limace', 3, '#d8d0c0', 1,
      'Une larve pâle, grosse comme un chien. Le scanner signale « forme juvénile » et demande de ne pas chercher l’adulte.'],
    ['rampant-pale', 'Rampant Pâle', 'rampant', 1, '#c8c0b0', 0,
      'Il fuit la lumière et vit dans l’ombre de la base.']
  ]);
  objets('lune', [
    ['drapeau-plante', 'Drapeau Planté', 'balise', '#e8e8e8',
      'Un drapeau, décoloré par cinquante ans de soleil sans filtre. Il est resté debout.'],
    ['empreinte-botte', 'Empreinte de Botte', 'plaque', '#8a8a84',
      'Une empreinte parfaite. Sans vent ni pluie, elle restera là des millions d’années.'],
    ['rover-abandonne', 'Rover Abandonné', 'epave', '#c4c9d0',
      'Un rover des missions d’autrefois, garé là où on l’a laissé. Les clés sont encore dessus.'],
    ['anorthosite', 'Roche Anorthosite', 'geode', '#d8d8d0',
      'La roche blanche des hauts plateaux, aussi vieille que la Lune elle-même.'],
    ['verre-orange', 'Verre Orange', 'sphere', '#e8742a',
      'De minuscules billes de verre orange, crachées par un volcan lunaire. Une vraie trouvaille d’Apollo 17.'],
    ['serre-base', 'Serre de la Base', 'fleur', '#6ad06a',
      'Des plantes qui poussent encore sous leur dôme, arrosées par un robot que personne n’a arrêté.'],
    ['module-habitation', 'Module d’Habitation', 'module', '#c4c9d0',
      'Six couchettes, une cuisine, et un calendrier arrêté sur un mois qu’on n’arrive pas à lire.'],
    ['sas-base', 'Sas de la Base', 'module', '#9aa2aa',
      'Le sas est ouvert des deux côtés. Quelqu’un est sorti en courant.'],
    ['antenne-relais', 'Antenne Relais', 'balise', '#e4e8ee',
      'Elle émet encore, vers la Terre, un message en boucle que le Téléportail n’arrive pas à décoder.'],
    ['reacteur', 'Réacteur de la Base', 'module', '#6ad0c8',
      'Il tourne toujours. C’est lui qui garde la base allumée — et qui attire ce qui vit dans la grotte.']
  ]);

  // ==========================================================
  //  Mars
  // ==========================================================
  vies('mars', [
    ['crabe-rouille', 'Crabe Rouillé', 'crabe', 1, '#a05a3a', 0,
      'Sa carapace s’oxyde un peu plus chaque année. Il finit par se confondre avec le paysage.'],
    ['lichen-marcheur', 'Lichen Marcheur', 'champignon', 1, '#8a6a4a', 0,
      'Il avance d’un mètre par an vers les pôles, là où se trouve la glace.'],
    ['scarabee-oxyde', 'Scarabée d’Oxyde', 'insecte', 1, '#7a3a20', 0,
      'Il roule des boulettes de rouille qu’il enterre pour plus tard.'],
    ['faucheur-olympe', 'Faucheur d’Olympe', 'araignee', 3, '#a04a2a', 1,
      'Il descend des flancs d’Olympus Mons, le plus haut volcan du système solaire.'],
    ['planeur-valles', 'Planeur de Valles', 'oiseau', 2, '#c07a4a', 0,
      'Il plane dans les canyons de Valles Marineris, sept kilomètres de profondeur sous ses ailes.'],
    ['tortue-glace', 'Tortue de Glace', 'tortue', 2, '#c9d8e0', 0,
      'Elle hiberne dans la glace des pôles et se réveille à chaque printemps martien.'],
    ['limace-givre', 'Limace de Givre', 'limace', 1, '#e8f2f8', 0,
      'Elle vit sur la glace affleurante et la fait fondre juste assez pour boire.'],
    ['serpent-sables', 'Serpent des Sables', 'serpent', 2, '#bd7150', 1,
      'Il ondule sous le sable rouge. On ne voit que le sillon qui arrive droit sur soi.'],
    ['sentinelle-mars', 'Sentinelle', 'machine', 3, '#8a8f96', 1,
      'Une sonde terrienne dont le logiciel a mal vieilli. Elle considère tout ce qui bouge comme une menace.'],
    ['tempetueux', 'Tempêtueux', 'essaim', 3, '#d09a72', 1,
      'Un tourbillon de poussière qui a appris à chasser.'],
    ['geant-tharsis', 'Géant de Tharsis', 'colosse', 5, '#6a2a1a', 1,
      'Il vit entre les volcans de Tharsis. Le sol tremble quand il marche, et il marche souvent.'],
    ['raie-rouge', 'Raie de Poussière Rouge', 'raie', 2, '#b0603a', 0,
      'Elle glisse sur le sable et soulève derrière elle un voile rouge.'],
    ['demon-poussiere', 'Démon de Poussière', 'flottant', 3, '#c08050', 1,
      'Les rovers en ont photographié des centaines. Aucun n’avait remarqué qu’ils regardaient.'],
    ['marcheur-phobos', 'Marcheur de Phobos', 'bipede', 2, '#6a5a50', 0,
      'Il marche le regard fixé sur Phobos, la petite lune qui file dans le ciel.'],
    ['cristal-pole', 'Cristal de Pôle', 'cristallin', 2, '#f4fafd', 0,
      'De la glace de CO₂ qui pousse en colonnes, puis s’évapore d’un coup au printemps.'],
    ['meduse-seche', 'Méduse Sèche', 'meduse', 2, '#d0a080', 0,
      'Une méduse sans eau, qui flotte dans l’air ténu grâce à un gaz qu’elle fabrique elle-même.'],
    ['goinfre-fer', 'Goinfre de Fer', 'rampant', 4, '#8f4f33', 1,
      'Il mange le fer, les rochers, et les rovers. Il en reste des morceaux autour de son terrier.']
  ]);
  objets('mars', [
    ['beagle-2', 'Épave de Beagle 2', 'epave', '#c4c9d0',
      'Un atterrisseur européen perdu en 2003. Il s’est posé, mais ses panneaux ne se sont jamais tous ouverts.'],
    ['myrtilles', 'Myrtilles Martiennes', 'sphere', '#3a3a4a',
      'Des billes d’hématite grosses comme des myrtilles. Elles ne se forment que dans l’eau.'],
    ['rocher-pyramide', 'Rocher Pyramide', 'totem', '#7a4229',
      'Un rocher taillé en pyramide par le vent. Du moins, c’est ce que dit le scanner.'],
    ['glace-enfouie', 'Glace Enfouie', 'cristal', '#e8f2f8',
      'De la glace d’eau, à trente centimètres sous la poussière. Il y en a partout.'],
    ['fossile-douteux', 'Fossile Douteux', 'fossile', '#bd7150',
      'Une forme qui ressemble à un fossile. Le scanner affiche « probabilité : 50 % » et refuse d’aller plus loin.'],
    ['geyser-co2', 'Geyser de CO₂', 'geyser', '#e8e0d8',
      'Au printemps, la glace sublime d’un coup et projette de la poussière noire sur des dizaines de mètres.']
  ]);

  // ==========================================================
  //  Jupiter
  // ==========================================================
  vies('jupiter', [
    ['flotteur-hydrogene', 'Flotteur d’Hydrogène', 'flottant', 1, '#efdcb4', 0,
      'Un ballon vivant gonflé d’hydrogène. Il monte et descend avec les courants.'],
    ['meduse-bande', 'Méduse de Bande', 'meduse', 1, '#d8b184', 0,
      'Elle suit toujours la même bande de nuages, sans jamais passer dans la voisine.'],
    ['tourbillon-vivant', 'Tourbillon Vivant', 'essaim', 2, '#c2a677', 0,
      'Un petit cyclone qui se nourrit des plus gros.'],
    ['raie-tempete', 'Raie de Tempête', 'raie', 2, '#8e4a2e', 1,
      'Elle chasse dans les rafales et ne s’arrête que quand le vent tombe. Ici, il ne tombe jamais.'],
    ['oiseau-foudre', 'Oiseau-Foudre', 'oiseau', 3, '#f8e878', 1,
      'Il plonge avec la foudre et frappe en même temps qu’elle.'],
    ['nuee-ammoniac', 'Nuée d’Ammoniac', 'essaim', 1, '#fffaec', 0,
      'Des cristaux d’ammoniac qui volent ensemble et changent de forme sans arrêt.'],
    ['colosse-gazeux', 'Colosse Gazeux', 'colosse', 5, '#b8683f', 1,
      'Il fait la taille d’une maison et pèse moins qu’une chaise. Ça ne l’empêche pas d’écraser ce qu’il touche.'],
    ['limace-nuage', 'Limace de Nuage', 'limace', 1, '#e8d8b8', 0,
      'Elle rampe sur les croûtes d’ammoniac et tombe quand elles fondent. Elle remonte toujours.'],
    ['chasseur-io', 'Chasseur d’Io', 'serpent', 3, '#e8c040', 1,
      'Il vient d’Io, la lune volcanique, et il a gardé son sale caractère.'],
    ['tortue-croute', 'Tortue de Croûte', 'tortue', 2, '#9a7a4c', 0,
      'Elle vit sur les croûtes flottantes et saute de l’une à l’autre quand elles se brisent.'],
    ['mangeur-foudre', 'Mangeur de Foudre', 'bipede', 3, '#5e4526', 1,
      'Il se nourrit d’éclairs. Un Téléportail allumé lui fait l’effet d’un casse-croûte.'],
    ['aiguille-glace', 'Aiguille de Glace', 'cristallin', 1, '#fffaec', 0,
      'Des aiguilles de glace qui tournent sur elles-mêmes et sifflent dans le vent.'],
    ['spore-celeste', 'Spore Céleste', 'champignon', 1, '#d9bf92', 0,
      'Un champignon qui ne touche jamais le sol. Ses spores traversent les bandes de nuages.'],
    ['crabe-nuees', 'Crabe des Nuées', 'crabe', 2, '#c2a071', 0,
      'Il s’accroche aux croûtes avec ses pinces, et lâche prise quand il veut changer de ciel.'],
    ['tisseur-vents', 'Tisseur de Vents', 'araignee', 3, '#a08658', 1,
      'Il tend sa toile en travers des courants et attend que le vent lui apporte à manger.'],
    ['ruban-orange', 'Ruban Orange', 'serpent', 2, '#d08a52', 0,
      'Il ondule dans la Grande Tache Rouge, et en prend la couleur.'],
    ['veilleur-ganymede', 'Veilleur de Ganymède', 'machine', 4, '#8a8f96', 1,
      'Personne ne sait qui l’a construit. Il vient de Ganymède, et il n’est pas content de vous voir.']
  ]);
  objets('jupiter', [
    ['grelon-ammoniac', 'Grêlon d’Ammoniac', 'cristal', '#fffaec',
      'Un grêlon gros comme un poing, qui fond en une minute dans la main.'],
    ['eclair-fige', 'Éclair Figé', 'plaque', '#f8e878',
      'La trace d’un éclair, vitrifiée dans la croûte. Elle est encore chaude.'],
    ['epave-galileo', 'Épave de Galileo', 'epave', '#8a8f96',
      'La sonde Galileo, précipitée dans Jupiter en 2003. Il en reste plus que prévu.'],
    ['spore-flottante', 'Spore Flottante', 'sphere', '#d9bf92',
      'Une spore de Spore Céleste, en route vers une autre bande.'],
    ['tourbillon-miniature', 'Tourbillon Miniature', 'geyser', '#b8683f',
      'Une tempête grande comme une table, qui tourne sur place depuis des jours.'],
    ['diamant-pression', 'Diamant de Pression', 'geode', '#e8f0ff',
      'Du carbone comprimé par la pression, remonté par un courant. Le scanner l’évalue « inestimable ».']
  ]);

  // ==========================================================
  //  Saturne
  // ==========================================================
  vies('saturne', [
    ['glacon-vif', 'Glaçon Vif', 'cristallin', 1, '#e8f6ff', 0,
      'Un glaçon qui se déplace tout seul, en tintant.'],
    ['patineur', 'Patineur', 'insecte', 1, '#bcb69c', 0,
      'Il glisse sur la glace sans jamais s’arrêter. Il ne sait pas freiner.'],
    ['tortue-anneau', 'Tortue d’Anneau', 'tortue', 2, '#c0ba9e', 0,
      'Elle porte sur le dos des cercles concentriques, comme les anneaux au-dessus d’elle.'],
    ['raie-glace', 'Raie de Glace', 'raie', 2, '#8fb6c8', 0,
      'Transparente, elle glisse sur la glace et ne se voit qu’à son ombre.'],
    ['oiseau-titan', 'Oiseau de Titan', 'oiseau', 2, '#c8a060', 0,
      'Il vient de Titan, où l’air est si épais qu’on pourrait y voler avec des ailes en carton.'],
    ['limace-pale', 'Limace Pâle', 'limace', 1, '#e6e0c6', 0,
      'Elle laisse sur la glace une trace qui brille quand les anneaux l’éclairent.'],
    ['meduse-encelade', 'Méduse d’Encelade', 'meduse', 2, '#b4d4e2', 0,
      'Elle vient de l’océan caché sous la glace d’Encelade, projetée dehors par les geysers.'],
    ['crabe-banquise', 'Crabe de Banquise', 'crabe', 2, '#9a9478', 1,
      'Il défend son trou dans la glace comme si c’était le dernier.'],
    ['chasseur-blanc', 'Chasseur Blanc', 'bipede', 3, '#e6e0c6', 1,
      'Blanc sur blanc, il ne se voit qu’une fois trop près.'],
    ['nuee-anneau', 'Nuée de Poussière d’Anneau', 'essaim', 1, '#d0cab0', 0,
      'Des grains d’anneau tombés du ciel, qui continuent de tourner ensemble au ras du sol.'],
    ['geant-hyperion', 'Géant d’Hypérion', 'colosse', 4, '#9a9478', 1,
      'Il vient d’Hypérion, une lune qui ressemble à une éponge. Lui ressemble à un rocher qui marche.'],
    ['serpent-faille', 'Serpent de Faille', 'serpent', 3, '#5c583f', 1,
      'Il vit dans les failles de la banquise et en jaillit sans prévenir.'],
    ['champignon-glace', 'Champignon de Glace', 'champignon', 1, '#d8e8f0', 0,
      'Il pousse vers le bas, sous la glace, et seul son chapeau dépasse.'],
    ['araignee-prisme', 'Araignée Prismatique', 'araignee', 3, '#d8e8f0', 1,
      'Son corps décompose la lumière des anneaux en arc-en-ciel. C’est la dernière chose que voient ses proies.'],
    ['sentinelle-cassini', 'Sentinelle de Cassini', 'machine', 2, '#c4c9d0', 0,
      'Un morceau de la sonde Cassini qui a trouvé le moyen de se remettre en marche.'],
    ['brouteur-geant', 'Brouteur Géant', 'flottant', 3, '#cfc9ae', 0,
      'Un Brouteur d’Anneaux qui n’a jamais cessé de grandir. Il avale des blocs de glace entiers.'],
    ['roi-hexagone', 'Roi de l’Hexagone', 'colosse', 5, '#5c583f', 1,
      'Il descend du pôle Nord, là où tourne l’Hexagone. On dit que c’est lui qui le fait tourner.']
  ]);
  objets('saturne', [
    ['fragment-anneau', 'Fragment d’Anneau', 'cristal', '#e8f6ff',
      'Un bloc de glace tombé des anneaux. Il a mis des siècles à descendre.'],
    ['galet-glace', 'Galet de Glace', 'sphere', '#d8e8f0',
      'Poli comme un galet de rivière. Il n’y a jamais eu de rivière ici.'],
    ['epave-cassini', 'Épave de Cassini', 'epave', '#c4c9d0',
      'La sonde Cassini, plongée dans Saturne en 2017 après treize ans d’orbite. Le Téléportail la salue.'],
    ['flocon-hexagonal', 'Flocon Hexagonal', 'plaque', '#d8e8f0',
      'Un flocon grand comme une assiette, parfaitement hexagonal. Comme le pôle.'],
    ['geyser-encelade', 'Geyser d’Encelade', 'geyser', '#b4d4e2',
      'De la vapeur d’eau salée, venue d’un océan caché. Le scanner détecte des traces organiques.'],
    ['fossile-glace', 'Fossile de Glace', 'fossile', '#9a9478',
      'Un animal pris dans la glace. Il ressemble à un Patineur, mais en dix fois plus grand.']
  ]);

  // ==========================================================
  //  Uranus
  // ==========================================================
  vies('uranus', [
    ['givrelin', 'Givrelin', 'insecte', 1, '#8fc6cf', 0,
      'Il se recouvre de givre pour se cacher, et devient invisible dès qu’il ne bouge plus.'],
    ['crabe-methane', 'Crabe de Méthane', 'crabe', 2, '#3fb8c8', 1,
      'Il vit au bord des nappes et pince tout ce qui s’en approche.'],
    ['meduse-couchee', 'Méduse Couchée', 'meduse', 1, '#6ad6e2', 0,
      'Elle nage sur le flanc, comme la planète.'],
    ['raie-cyan', 'Raie Cyan', 'raie', 2, '#3fb8c8', 0,
      'Elle survole les nappes de méthane sans jamais les toucher.'],
    ['oiseau-oblique', 'Oiseau Oblique', 'oiseau', 2, '#6fa8b2', 0,
      'Il vole de travers, penché de quatre-vingt-dix-huit degrés, exactement comme l’axe d’Uranus.'],
    ['tortue-diamant', 'Tortue Diamant', 'tortue', 3, '#e4fbff', 0,
      'Sa carapace est faite de diamants tombés du ciel, qu’elle ramasse depuis des siècles.'],
    ['pluie-diamant', 'Pluie de Diamant', 'essaim', 2, '#e4fbff', 0,
      'Des diamants qui tombent lentement et changent de direction quand on les regarde.'],
    ['limace-bleue', 'Limace Bleue', 'limace', 1, '#5f959f', 0,
      'Elle hiberne quarante ans, le temps d’une saison, et ne mange qu’au printemps.'],
    ['chasseur-miranda', 'Chasseur de Miranda', 'bipede', 3, '#4a7d86', 1,
      'Il vient de Miranda, la lune aux falaises de vingt kilomètres. Il en saute comme d’un tabouret.'],
    ['cristal-penche', 'Cristal Penché', 'cristallin', 1, '#a8e2ea', 0,
      'Il pousse de travers, toujours du côté du Soleil, qui ne bouge presque pas ici.'],
    ['tisseuse-givre', 'Tisseuse de Givre', 'araignee', 3, '#c0f4fb', 1,
      'Sa toile est en givre. Elle fond quand on la traverse, et se reforme derrière.'],
    ['champignon-glace-u', 'Champignon Glacé', 'champignon', 1, '#8fc6cf', 0,
      'Il ne pousse qu’une fois par saison. Celui-ci a quarante ans.'],
    ['serpent-ariel', 'Serpent d’Ariel', 'serpent', 3, '#284a52', 1,
      'Il vient d’Ariel et nage sous la surface gelée, plus vite qu’on ne marche.'],
    ['gardien-oberon', 'Gardien d’Obéron', 'colosse', 5, '#284a52', 1,
      'Il vient d’Obéron, la lune la plus lointaine. Il garde quelque chose, mais personne ne sait quoi.'],
    ['bulle-methane', 'Bulle de Méthane', 'flottant', 1, '#c0f4fb', 0,
      'Une bulle qui monte des nappes et flotte des heures avant d’éclater.'],
    ['rodeur-pale', 'Rôdeur Pâle', 'rampant', 2, '#6ea3ac', 1,
      'Il suit les voyageurs à distance, et se rapproche dès qu’on lui tourne le dos.'],
    ['sonde-egaree', 'Sonde Égarée', 'machine', 2, '#c4c9d0', 0,
      'Une sonde d’origine inconnue, perdue depuis longtemps. Elle cherche encore quelqu’un à qui transmettre.']
  ]);
  objets('uranus', [
    ['diamant-tombe', 'Diamant Tombé', 'geode', '#e4fbff',
      'Un diamant de la taille d’une noix, tombé des nuages. Il en pleut ici en permanence.'],
    ['glace-penchee', 'Glace Penchée', 'cristal', '#a8e2ea',
      'Des colonnes de glace, toutes penchées du même côté.'],
    ['aurore-basse', 'Aurore Basse', 'plaque', '#7cf0c8',
      'Une aurore qui descend jusqu’au sol et s’y étale comme une flaque de lumière.'],
    ['sphere-methane', 'Sphère de Méthane', 'sphere', '#3fb8c8',
      'Du méthane gelé en boule parfaite. Elle fond si on la tient trop longtemps.'],
    ['totem-couche', 'Totem Couché', 'totem', '#4a7d86',
      'Un monolithe allongé sur le flanc. Le scanner ne sait pas s’il est tombé ou s’il a été posé comme ça.'],
    ['geyser-froid', 'Geyser Froid', 'geyser', '#c0f4fb',
      'Il crache du méthane liquide qui gèle en l’air et retombe en neige.']
  ]);

  // ==========================================================
  //  Neptune
  // ==========================================================
  vies('neptune', [
    ['flocon-azote', 'Flocon d’Azote', 'cristallin', 1, '#dce6ff', 0,
      'Un flocon vivant qui se laisse porter par le vent. Il en a vu, du pays.'],
    ['raie-vents', 'Raie des Vents', 'raie', 2, '#5674bd', 1,
      'Elle surfe sur les vents à deux mille kilomètres-heure et fonce sur tout ce qui les freine.'],
    ['meduse-abyssale', 'Méduse Abyssale', 'meduse', 2, '#3f63b8', 0,
      'Elle vient des couches profondes et remonte, lentement, vers la lumière.'],
    ['oiseau-tempete', 'Oiseau-Tempête', 'oiseau', 3, '#8fa8e8', 1,
      'Il chevauche les tempêtes et plonge avec elles.'],
    ['crabe-sombre', 'Crabe Sombre', 'crabe', 2, '#161f3c', 1,
      'Noir sur la croûte bleue, il attend dans les failles.'],
    ['tortue-triton', 'Tortue de Triton', 'tortue', 2, '#9fb6f0', 0,
      'Elle vient de Triton, la lune qui tourne à l’envers. Elle marche à reculons.'],
    ['limace-indigo', 'Limace Indigo', 'limace', 1, '#364e8b', 0,
      'Elle colle au sol si fort que les vents n’arrivent pas à l’emporter.'],
    ['nuee-bleue', 'Nuée Bleue', 'essaim', 1, '#7ad0e8', 0,
      'Des cristaux d’azote qui volent en banc, comme des poissons.'],
    ['chasseur-triton', 'Chasseur de Triton', 'bipede', 3, '#2a3f74', 1,
      'Il chasse sur les plaines de Triton, les plus froides du système solaire. Il n’a jamais eu chaud.'],
    ['serpent-glace-noire', 'Serpent de Glace Noire', 'serpent', 3, '#161f3c', 1,
      'Il est fait de glace sombre et se glisse sous la croûte, où on ne le voit pas venir.'],
    ['champignon-givre', 'Champignon Givré', 'champignon', 1, '#a8e6f6', 0,
      'Il pousse près des geysers et se nourrit de la neige qu’ils retombent.'],
    ['araignee-geysers', 'Araignée des Geysers', 'araignee', 3, '#7ad0e8', 1,
      'Elle tisse sa toile au-dessus des geysers et attrape ce qui en sort.'],
    ['grand-crieur', 'Grand Crieur', 'flottant', 3, '#5169a8', 0,
      'Un Crieur des Vents qui a vécu très vieux. Son cri s’entend d’un bout à l’autre de la planète.'],
    ['colosse-abysses', 'Colosse des Abysses', 'colosse', 5, '#10214e', 1,
      'Il vit dans les couches profondes et ne remonte qu’une fois par siècle. Tu tombes pile ce siècle-là.'],
    ['insecte-vent', 'Insecte-Vent', 'insecte', 1, '#9fb6f0', 0,
      'Il a des ailes minuscules et n’en a pas besoin : le vent fait tout le travail.'],
    ['rodeur-nereide', 'Rôdeur de Néréide', 'rampant', 2, '#48629e', 1,
      'Il vient de Néréide et suit une orbite folle, même au sol : il tourne autour de sa proie avant d’attaquer.'],
    ['balise-morte', 'Balise Morte', 'machine', 2, '#8a8f96', 0,
      'Une machine ancienne, bien plus ancienne que les sondes humaines. Elle clignote encore.']
  ]);
  objets('neptune', [
    ['neige-azote', 'Neige d’Azote', 'cristal', '#dce6ff',
      'Retombée d’un geyser à des kilomètres d’ici, elle s’entasse en congères bleues.'],
    ['geyser-triton', 'Geyser de Triton', 'geyser', '#e8fbff',
      'Un panache d’azote qui monte à huit kilomètres. Voyager 2 l’avait photographié en 1989.'],
    ['galet-noir', 'Galet Noir', 'sphere', '#161f3c',
      'Une pierre si sombre qu’elle absorbe presque toute la lumière.'],
    ['balise-inconnue', 'Balise Inconnue', 'balise', '#7ad0e8',
      'Elle émet sur la même fréquence que le Téléportail. Ce n’est sûrement pas une coïncidence.'],
    ['os-geant', 'Os de Géant', 'os', '#d8e0f0',
      'Un os de dix mètres, à moitié enfoui. Le Colosse des Abysses ? Plus gros encore, dit le scanner.'],
    ['plaque-vent', 'Plaque de Vent', 'plaque', '#5674bd',
      'La croûte, polie par les vents jusqu’à devenir un miroir.']
  ]);

  // ==========================================================
  //  Les curiosites manquantes se rangent avec les objets de leur
  //  astre : il n'y a plus rien a faire ici.
  // ==========================================================
})();
