// La rubrique Badges.
//
// Trente emplacements, comme la collection de Dinders, et la meme liste
// deroulante. Onze recompenses sont en place ; les autres attendent.
//
// Un badge reste SECRET tant qu'il n'est pas obtenu : sa case n'affiche
// alors ni son nom, ni sa condition, ni son image. Tout ce qu'on sait,
// c'est qu'il y en a trente a decrocher.
(function () {
  var DP = window.DP;
  if (!DP) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var CASES = 30;                       // autant que la collection

  // Les paliers, du plus modeste au plus rare. La couleur sert a teinter
  // l'etiquette de droite, comme la rarete sur la page Dinders.
  var PALIERS = {
    bois:    { nom: 'Bois',    couleur: '#b5834a' },
    bronze:  { nom: 'Bronze',  couleur: '#cf8442' },
    argent:  { nom: 'Argent',  couleur: '#cdd7e2' },
    or:      { nom: 'Or',      couleur: '#f5c93a' },
    diamant: { nom: 'Diamant', couleur: '#c56bff' }
  };

  // Combien d'especes de poissons legendaires sont au carnet.
  function legendairesPeches() {
    var P = window.POISSONS;
    if (!P) return 0;
    var prises = DP.prises();
    return P.LISTE.filter(function (f) {
      return f.rarete === 'legende' && prises[f.id];
    }).length;
  }

  function especesPechees() { return Object.keys(DP.prises()).length; }

  // "gagne" se relit a chaque affichage : un badge n'est jamais "donne",
  // il decoule de l'etat du profil.
  var BADGES = [
    { id: 'dinder-bois', nom: 'Premier Dinder', palier: 'bois',
      condition: 'Collecter son premier Dinder.',
      gagne: function () { return DP.owned().length >= 1; } },
    { id: 'dinder-bronze', nom: 'Trois au Compteur', palier: 'bronze',
      condition: 'Collecter 3 Dinders.',
      gagne: function () { return DP.owned().length >= 3; } },
    { id: 'dinder-argent', nom: 'Cinq de Front', palier: 'argent',
      condition: 'Collecter 5 Dinders.',
      gagne: function () { return DP.owned().length >= 5; } },
    { id: 'dinder-or', nom: 'Dizaine Rassemblée', palier: 'or',
      condition: 'Collecter 10 Dinders.',
      gagne: function () { return DP.owned().length >= 10; } },
    { id: 'dinder-diamant', nom: 'Collection Complète', palier: 'diamant',
      condition: 'Collecter 30 Dinders.',
      gagne: function () { return DP.owned().length >= 30; } },

    { id: 'poisson-bronze', nom: 'Dix Prises', palier: 'bronze',
      condition: 'Pêcher 10 espèces différentes.',
      gagne: function () { return especesPechees() >= 10; } },
    { id: 'poisson-argent', nom: 'Vingt Prises', palier: 'argent',
      condition: 'Pêcher 20 espèces différentes.',
      gagne: function () { return especesPechees() >= 20; } },
    { id: 'poisson-or', nom: 'Carnet Rempli', palier: 'or',
      condition: 'Pêcher 30 espèces différentes.',
      gagne: function () { return especesPechees() >= 30; } },
    { id: 'poisson-diamant', nom: 'Les Trois Légendes', palier: 'diamant',
      condition: 'Pêcher les 3 poissons légendaires.',
      gagne: function () { return legendairesPeches() >= 3; } },

    { id: 'fondateur-or', nom: 'Le Fondateur à Terre', palier: 'or',
      condition: 'Vaincre Le Fondateur.',
      gagne: function () { return DP.exploit('fondateurVaincu') >= 1; } },
    { id: 'fondateur-diamant', nom: 'Trente Secondes Chrono', palier: 'diamant',
      condition: 'Vaincre Le Fondateur en 30 secondes ou moins.',
      gagne: function () {
        var t = DP.exploit('fondateurChrono');
        return t > 0 && t <= 30;
      } }
  ];

  function img(id) { return 'assets/badges/' + id + '.webp'; }

  function obtenus() {
    return BADGES.filter(function (b) { return b.gagne(); });
  }

  // ==========================================================
  //  L'ecran
  // ==========================================================

  function caseNode(index) {
    var b = BADGES[index];
    var eu = b && b.gagne();

    var node = el('div', 'slot slot--badge' + (eu ? '' : ' slot--locked'));
    node.dataset.slot = String(index + 1).padStart(2, '0');
    if (eu) node.dataset.badge = b.id;

    if (eu) {
      var im = el('img', 'slot-face');
      im.src = img(b.id);
      im.alt = '';
      im.width = 400; im.height = 400;
      im.loading = 'lazy'; im.decoding = 'async';
      node.appendChild(im);
    } else {
      var mark = el('span', 'slot-face slot-face--locked', '?');
      mark.setAttribute('aria-hidden', 'true');
      node.appendChild(mark);
    }

    var nom = el('span', 'slot-name');
    nom.appendChild(el('span', 'slot-name-main', eu ? b.nom : '???'));
    // La condition ne se lit qu'une fois le badge decroche : l'afficher
    // avant reviendrait a devoiler ce qu'il y a a faire.
    if (eu) nom.appendChild(el('span', 'slot-name-sub', b.condition));
    node.appendChild(nom);

    if (eu) {
      var tag = el('span', 'slot-rarity slot-palier', PALIERS[b.palier].nom);
      tag.dataset.palier = b.palier;
      node.appendChild(tag);
    }
    return node;
  }

  function viewBadges(view) {
    var box = el('div', 'badges');

    var tete = el('div', 'badges-tete');
    tete.appendChild(el('h2', 'badges-titre', 'Badges'));
    tete.appendChild(el('p', 'badges-compte',
      obtenus().length + ' / ' + CASES + ' décrochés'));
    box.appendChild(tete);

    var list = el('div', 'screen-scroll badges-liste');
    for (var i = 0; i < CASES; i++) list.appendChild(caseNode(i));
    box.appendChild(list);

    view.appendChild(box);
  }

  // ==========================================================
  //  L'annonce d'un badge
  //  Quand un badge tombe, la medaille se pose sur l'ecran du pad,
  //  ou que le joueur se trouve — en plein combat comme au bord de l'eau.
  // ==========================================================

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var file = [];                         // les badges qui attendent leur tour
  var enScene = false;

  function scene() {
    // L'annonce se pose sur le pad lui-meme : elle suit donc son zoom,
    // et survit au changement d'ecran.
    return document.querySelector('.pad') || document.body;
  }

  function jouerSuivant() {
    if (enScene || !file.length) return;
    var b = file.shift();
    enScene = true;

    var hote = scene();
    var box = el('div', 'bdg-pop');
    box.dataset.palier = b.palier;

    var rayons = el('div', 'bdg-rayons');
    rayons.setAttribute('aria-hidden', 'true');
    box.appendChild(rayons);

    var carte = el('div', 'bdg-carte');
    carte.appendChild(el('p', 'bdg-sus', 'BADGE DÉBLOQUÉ'));

    var im = el('img', 'bdg-medaille');
    im.src = img(b.id);
    im.alt = '';
    carte.appendChild(im);

    carte.appendChild(el('p', 'bdg-nom', b.nom));
    var tag = el('span', 'bdg-palier', PALIERS[b.palier].nom);
    tag.dataset.palier = b.palier;
    carte.appendChild(tag);
    carte.appendChild(el('p', 'bdg-cond', b.condition));
    box.appendChild(carte);

    // Les etincelles, semees autour de la medaille.
    if (!reduit) {
      var etincelles = el('div', 'bdg-etincelles');
      etincelles.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 14; i++) {
        var e = el('span', 'bdg-etincelle');
        e.style.setProperty('--a', (i * 26 + Math.random() * 16 - 8) + 'deg');
        e.style.setProperty('--d', (90 + Math.random() * 90) + '%');
        e.style.setProperty('--t', Math.round(Math.random() * 260) + 'ms');
        etincelles.appendChild(e);
      }
      box.appendChild(etincelles);
    }

    hote.appendChild(box);

    var duree = reduit ? 1800 : 3200;
    var fin = setTimeout(retirer, duree);

    function retirer() {
      clearTimeout(fin);
      box.removeEventListener('click', retirer);
      box.classList.add('is-sortie');
      setTimeout(function () {
        if (box.parentNode) box.parentNode.removeChild(box);
        enScene = false;
        setTimeout(jouerSuivant, 320);
      }, reduit ? 0 : 340);
    }

    box.addEventListener('click', retirer);
  }

  // Compare ce qui est acquis a ce qui a deja ete fete, et annonce la
  // difference. Rend la liste des nouveaux, pour les tests.
  function verifier(silencieux) {
    var vus = DP.badgesVus();
    var neufs = obtenus().filter(function (b) { return vus.indexOf(b.id) === -1; });
    if (!neufs.length) return [];
    DP.marquerVus(neufs.map(function (b) { return b.id; }));
    if (silencieux) return neufs;

    // Pendant l'identification, on ne fete rien : l'ecran est pris.
    if (document.body.classList.contains('is-locked')) return neufs;

    neufs.forEach(function (b) { file.push(b); });
    setTimeout(jouerSuivant, 900);
    return neufs;
  }

  // Au premier chargement d'un profil, ce qui est deja acquis est marque
  // sans ceremonie : sinon un joueur de longue date recevrait la volee de
  // toutes ses medailles d'un coup.
  function rattraper() { verifier(true); }

  // views.js a pose un ecran "en chantier" pour cette rubrique : on le
  // remplace maintenant qu'elle existe.
  window.VIEWS['badges'] = { title: 'Badges', render: viewBadges };

  // Le rattrapage attend que la page soit prete, puis chaque ecriture de
  // l'etat declenche une verification.
  function demarrer() {
    rattraper();
    DP.onChange(function () { verifier(false); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }

  window.BADGES = {
    LISTE: BADGES, PALIERS: PALIERS, CASES: CASES,
    obtenus: obtenus, img: img, verifier: verifier, rattraper: rattraper,
    enAttente: function () { return file.length; },
    legendairesPeches: legendairesPeches, especesPechees: especesPechees
  };
})();
