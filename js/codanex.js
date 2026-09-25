// Le Codanex : un carnet de bord, et rien de plus. Deux categories —
// Subjects (des Dinders) et Universes (des mondes de l'Odyssee) — dont
// il tire cinq fiches au hasard a chaque ouverture de la page.
//
// On barre une fiche d'un clic : elle vire au gris, une grande croix
// rouge la traverse et le mot TERMINATED s'inscrit en travers. C'est
// purement decoratif : rien dans le jeu n'en depend, aucune recompense,
// aucun deblocage.
//
// Rien n'est sauvegarde non plus : les marques vivent en memoire, le
// temps de la page. On recharge, et le carnet repart vierge.
(function () {
  var DP = window.DP;
  if (!DP) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var PAR_PAGE = 5;

  // Ce qui est barre, par categorie. Volontairement en memoire seule :
  // le profil ne doit rien en savoir.
  var marques = { subjects: {}, universes: {} };

  function marque(cat, id) { return !!(marques[cat] && marques[cat][id]); }

  function basculer(cat, id) {
    if (!marques[cat]) return false;
    if (marques[cat][id]) { delete marques[cat][id]; return false; }
    marques[cat][id] = true;
    return true;
  }

  function comptees(cat) {
    return marques[cat] ? Object.keys(marques[cat]).length : 0;
  }

  function oublier() { marques = { subjects: {}, universes: {} }; }

  // ==========================================================
  //  Le portrait d'un monde
  // ==========================================================
  // Un disque uni ne dit rien. On peint donc chaque astre a partir de sa
  // propre palette : le ciel en fond avec ses etoiles, la sphere, ses
  // taches de terrain, sa calotte, son terminateur, et ce qui lui est
  // propre — cratères, bandes de tempête, anneaux, geysers.

  var L_MONDE = 240, H_MONDE = 360;
  var cacheMondes = {};

  // Un hasard reproductible : le meme monde se dessine toujours pareil.
  function dé(graine) {
    var n = graine;
    return function () {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      return n / 0x7fffffff;
    };
  }

  function teinte(hex, k) {
    var v = parseInt(String(hex).slice(1), 16);
    var r = Math.min(255, Math.max(0, ((v >> 16) & 255) * k));
    var g = Math.min(255, Math.max(0, ((v >> 8) & 255) * k));
    var b = Math.min(255, Math.max(0, (v & 255) * k));
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }

  // Ce qui distingue un monde des autres, au-dela de sa palette.
  var TRAITS = {
    mercure:  { crateres: 16, calotte: 0 },
    venus:    { voile: 0.45, bandes: 3 },
    terre:    { continents: 5, nuages: 7, calotte: 0.16 },
    lune:     { crateres: 22, calotte: 0 },
    mars:     { crateres: 7, calotte: 0.2, poussiere: true },
    jupiter:  { bandes: 7, tache: true },
    saturne:  { bandes: 5, anneaux: 1 },
    uranus:   { bandes: 3, anneaux: 0.55, couche: true },
    neptune:  { bandes: 4, tache: true, geysers: 5 }
  };

  function peindreMonde(a) {
    if (cacheMondes[a.id]) return cacheMondes[a.id];
    var cv = document.createElement('canvas');
    cv.width = L_MONDE; cv.height = H_MONDE;
    var x = cv.getContext('2d');
    if (!x) return '';

    var P = a.palette, T = TRAITS[a.id] || {};
    var r = dé(a.rang * 7919 + 13);

    // Le ciel du monde, et ses etoiles.
    var fond = x.createLinearGradient(0, 0, 0, H_MONDE);
    fond.addColorStop(0, a.ciel[2]);
    fond.addColorStop(0.55, a.ciel[0]);
    fond.addColorStop(1, a.ciel[2]);
    x.fillStyle = fond;
    x.fillRect(0, 0, L_MONDE, H_MONDE);
    for (var e = 0; e < 90; e++) {
      var ex = r() * L_MONDE, ey = r() * H_MONDE, et = r();
      x.globalAlpha = 0.25 + et * 0.6;
      x.fillStyle = '#ffffff';
      x.fillRect(ex, ey, et > 0.85 ? 2 : 1, et > 0.85 ? 2 : 1);
    }
    x.globalAlpha = 1;

    var cx = L_MONDE / 2, cy = H_MONDE * 0.44, R = L_MONDE * 0.36;

    // Les anneaux passent derriere avant de repasser devant.
    function anneaux(devant) {
      if (!T.anneaux) return;
      x.save();
      x.translate(cx, cy);
      x.rotate(T.couche ? -1.25 : -0.22);
      x.scale(1, T.couche ? 1 : 0.2);
      for (var i = 0; i < 5; i++) {
        var rr = R * (1.35 + i * 0.14);
        x.beginPath();
        x.arc(0, 0, rr, devant ? 0 : Math.PI, devant ? Math.PI : Math.PI * 2);
        x.strokeStyle = i % 2 ? P.cristal2 : P.cristal;
        x.globalAlpha = (devant ? 0.75 : 0.5) * (1 - i * 0.12) * (T.anneaux);
        x.lineWidth = R * 0.11;
        x.stroke();
      }
      x.restore();
      x.globalAlpha = 1;
    }
    anneaux(false);

    // La sphere.
    x.save();
    x.beginPath();
    x.arc(cx, cy, R, 0, 6.3);
    x.clip();

    var sol = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    sol.addColorStop(0, P.grain);
    sol.addColorStop(0.5, P.sol);
    sol.addColorStop(1, P.sol2);
    x.fillStyle = sol;
    x.fillRect(cx - R, cy - R, R * 2, R * 2);

    // Les bandes des geantes : des rubans horizontaux, un peu ondules.
    for (var b = 0; b < (T.bandes || 0); b++) {
      var by = cy - R + (b + 0.5) * (R * 2 / (T.bandes + 0.001));
      var ep = R * (0.12 + r() * 0.16);
      x.globalAlpha = 0.35 + r() * 0.3;
      x.fillStyle = b % 2 ? P.roche : P.rocheHaut;
      x.beginPath();
      x.moveTo(cx - R, by - ep / 2);
      x.bezierCurveTo(cx - R / 3, by - ep, cx + R / 3, by, cx + R, by - ep / 2);
      x.lineTo(cx + R, by + ep / 2);
      x.bezierCurveTo(cx + R / 3, by + ep, cx - R / 3, by, cx - R, by + ep / 2);
      x.closePath();
      x.fill();
    }
    x.globalAlpha = 1;

    // Les continents : des taches molles de roche.
    for (var c = 0; c < (T.continents || 0); c++) {
      x.fillStyle = c % 2 ? P.roche : P.rocheHaut;
      x.globalAlpha = 0.85;
      x.beginPath();
      var px = cx + (r() - 0.5) * R * 1.5, py = cy + (r() - 0.5) * R * 1.5;
      x.ellipse(px, py, R * (0.18 + r() * 0.3), R * (0.12 + r() * 0.2), r() * 3, 0, 6.3);
      x.fill();
    }
    x.globalAlpha = 1;

    // Les cratères : un creux sombre, un bord clair.
    for (var k = 0; k < (T.crateres || 0); k++) {
      var kx = cx + (r() - 0.5) * R * 1.7, ky = cy + (r() - 0.5) * R * 1.7;
      var kr = R * (0.05 + r() * 0.13);
      x.fillStyle = P.rocheOmbre;
      x.globalAlpha = 0.55;
      x.beginPath(); x.arc(kx, ky, kr, 0, 6.3); x.fill();
      x.strokeStyle = P.rocheHaut;
      x.globalAlpha = 0.5;
      x.lineWidth = Math.max(1, kr * 0.22);
      x.beginPath(); x.arc(kx, ky - kr * 0.12, kr * 0.92, 0, 6.3); x.stroke();
    }
    x.globalAlpha = 1;

    // La grande tache : un oeil de tempête.
    if (T.tache) {
      var tx = cx + R * 0.28, ty = cy + R * 0.2;
      var g = x.createRadialGradient(tx, ty, 0, tx, ty, R * 0.3);
      g.addColorStop(0, P.ecume);
      g.addColorStop(0.45, P.liquide2);
      g.addColorStop(1, P.liquide);
      x.fillStyle = g;
      x.globalAlpha = 0.9;
      x.beginPath(); x.ellipse(tx, ty, R * 0.3, R * 0.18, -0.2, 0, 6.3); x.fill();
      x.globalAlpha = 1;
    }

    // Les geysers : des panaches clairs qui montent du limbe.
    for (var j = 0; j < (T.geysers || 0); j++) {
      var jx = cx + (r() - 0.5) * R * 1.4, jy = cy + (r() - 0.2) * R * 0.9;
      x.strokeStyle = P.ecume;
      x.globalAlpha = 0.5;
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(jx, jy);
      x.lineTo(jx + (r() - 0.5) * R * 0.2, jy - R * (0.2 + r() * 0.2));
      x.stroke();
    }
    x.globalAlpha = 1;

    // Les nuages, en echarpes.
    for (var nu = 0; nu < (T.nuages || 0); nu++) {
      x.fillStyle = '#ffffff';
      x.globalAlpha = 0.18 + r() * 0.2;
      x.beginPath();
      x.ellipse(cx + (r() - 0.5) * R * 1.8, cy + (r() - 0.5) * R * 1.6,
                R * (0.2 + r() * 0.3), R * 0.07, r() * 0.6 - 0.3, 0, 6.3);
      x.fill();
    }
    x.globalAlpha = 1;

    // Les calottes polaires.
    if (T.calotte) {
      x.fillStyle = P.cristal2;
      x.globalAlpha = 0.85;
      [-1, 1].forEach(function (sens) {
        x.beginPath();
        x.ellipse(cx, cy + sens * R * 0.93, R * 0.55, R * T.calotte, 0, 0, 6.3);
        x.fill();
      });
      x.globalAlpha = 1;
    }

    // Un voile d'atmosphere, pour les mondes couverts.
    if (T.voile) {
      x.fillStyle = P.grain;
      x.globalAlpha = T.voile;
      x.fillRect(cx - R, cy - R, R * 2, R * 2);
      x.globalAlpha = 1;
    }

    // Le terminateur : la nuit qui mange le bord droit.
    var nuit = x.createRadialGradient(cx - R * 0.42, cy - R * 0.42, R * 0.15,
                                      cx, cy, R * 1.25);
    nuit.addColorStop(0, 'rgba(255,255,255,.22)');
    nuit.addColorStop(0.42, 'rgba(0,0,0,0)');
    nuit.addColorStop(1, 'rgba(0,0,0,.78)');
    x.fillStyle = nuit;
    x.fillRect(cx - R, cy - R, R * 2, R * 2);
    x.restore();

    // Le liseré lumineux du limbe, puis les anneaux de devant.
    x.strokeStyle = teinte(P.cristal2, 1);
    x.globalAlpha = 0.55;
    x.lineWidth = 2;
    x.beginPath(); x.arc(cx, cy, R - 1, 2.2, 5.1); x.stroke();
    x.globalAlpha = 1;
    anneaux(true);

    // Une lune, pour les mondes qui en ont une a montrer.
    if (a.id === 'terre') {
      x.fillStyle = '#cfcabf';
      x.beginPath(); x.arc(L_MONDE * 0.82, H_MONDE * 0.18, 12, 0, 6.3); x.fill();
      x.fillStyle = 'rgba(0,0,0,.35)';
      x.beginPath(); x.arc(L_MONDE * 0.85, H_MONDE * 0.17, 10, 0, 6.3); x.fill();
    }

    cacheMondes[a.id] = cv.toDataURL('image/png');
    return cacheMondes[a.id];
  }

  // Cinq elements tires au hasard, sans doublon. Le tirage est refait a
  // chaque ouverture : c'est ce qui fait tourner le carnet.
  function tirer(liste, n) {
    var reste = liste.slice(), out = [];
    while (out.length < n && reste.length) {
      out.push(reste.splice(Math.floor(Math.random() * reste.length), 1)[0]);
    }
    return out;
  }

  // ---------- Les deux categories ----------

  var CATEGORIES = [
    {
      id: 'subjects',
      nom: 'Subjects',
      sous: 'Sujets répertoriés',
      // Tous les Dinders du carnet, obtenus ou non : le Codanex recense,
      // il ne recompense pas.
      pioche: function () {
        return DP.DINDERS.map(function (d) {
          return {
            id: d.id,
            nom: d.name,
            // L'univers d'un Dinder est souvent "???" : la rarete dit
            // quelque chose, elle.
            sous: d.form || d.rarity,
            code: (d.rarity || '').slice(0, 3).toUpperCase() + '-' + d.id.slice(0, 4).toUpperCase(),
            rarete: DP.rarityKey(d.rarity),
            // La planche en pied, pas le portrait : la fiche montre le
            // Dinder en entier, quitte a le rogner sur les cotes.
            image: DP.dinderFull(d.id)
          };
        });
      }
    },
    {
      id: 'universes',
      nom: 'Universes',
      sous: 'Mondes relevés',
      pioche: function () {
        var V = window.ODYVIE;
        if (!V) return [];
        return V.ASTRES.map(function (a) {
          return {
            id: a.id,
            nom: a.nom,
            sous: a.sous || ('Rang ' + a.rang),
            code: a.code,
            image: peindreMonde(a)
          };
        });
      }
    }
  ];

  function categorie(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return CATEGORIES[0];
  }

  // ---------- Une fiche ----------

  function fiche(cat, sujet) {
    var fini = marque(cat.id, sujet.id);
    var n = el('button', 'cx-fiche' + (fini ? ' is-finie' : ''));
    n.type = 'button';
    n.dataset.sujet = sujet.id;
    n.setAttribute('aria-pressed', fini ? 'true' : 'false');

    var haut = el('span', 'cx-fiche-code', sujet.code);
    n.appendChild(haut);

    // Le portrait occupe toute la case : on le cadre large, quitte a le
    // rogner. C'est ce qui donne au Codanex son air de fiche.
    var vign = el('span', 'cx-fiche-vignette');
    if (sujet.image) {
      var im = el('img', 'cx-fiche-img');
      im.src = sujet.image;
      im.alt = '';
      im.loading = 'lazy';
      vign.appendChild(im);
    }
    n.appendChild(vign);

    var txt = el('span', 'cx-fiche-txt');
    txt.appendChild(el('strong', 'cx-fiche-nom', sujet.nom));
    if (sujet.sous) txt.appendChild(el('span', 'cx-fiche-sous', sujet.sous));
    n.appendChild(txt);

    // La croix et le mot ne servent qu'une fois la fiche barree : ils
    // sont poses d'avance et reveles par la classe.
    n.appendChild(el('span', 'cx-croix'));
    n.appendChild(el('span', 'cx-terminated', 'TERMINATED'));

    n.addEventListener('click', function () {
      var desormais = basculer(cat.id, sujet.id);
      n.classList.toggle('is-finie', desormais);
      n.setAttribute('aria-pressed', desormais ? 'true' : 'false');
      if (desormais) {
        n.classList.remove('is-barre');
        void n.offsetWidth;
        n.classList.add('is-barre');
      }
      majCompte();
    });
    return n;
  }

  var majCompte = function () {};

  // ---------- La page ----------

  function viewCodanex(view, arg) {
    var cat = categorie(arg);
    var box = el('div', 'cx');
    view.appendChild(box);

    var tete = el('div', 'cx-tete');
    tete.appendChild(el('h2', 'cx-titre', 'Codanex'));
    var compte = el('span', 'cx-compte', '');
    tete.appendChild(compte);
    box.appendChild(tete);

    var sujets = tirer(cat.pioche(), PAR_PAGE);

    var rang = el('div', 'cx-rang');
    rang.dataset.categorie = cat.id;
    sujets.forEach(function (s) { rang.appendChild(fiche(cat, s)); });
    box.appendChild(rang);

    majCompte = function () {
      var faits = sujets.filter(function (s) {
        return marque(cat.id, s.id);
      }).length;
      compte.textContent = cat.nom + '  ·  ' + faits + ' / ' + sujets.length +
                           ' terminées  ·  rien n’est gardé';
    };
    majCompte();

    // Les deux onglets, en bas, comme sur le plan.
    var pied = el('div', 'cx-onglets');
    CATEGORIES.forEach(function (c, i) {
      var a = el('a', 'cx-onglet' + (c.id === cat.id ? ' is-actif' : ''));
      a.href = '#codanex/' + c.id;
      a.appendChild(el('strong', 'cx-onglet-nom', 'Catégorie ' + (i + 1)));
      a.appendChild(el('span', 'cx-onglet-sous', c.nom));
      pied.appendChild(a);
    });
    box.appendChild(pied);

    // Pour les essais : de quoi verifier le tirage sans lire l'ecran.
    box._cx = {
      categorie: cat.id, sujets: sujets,
      fiches: function () { return [].slice.call(rang.querySelectorAll('.cx-fiche')); }
    };
  }

  if (window.VIEWS) {
    window.VIEWS['codanex'] = { title: 'Codanex', render: viewCodanex };
  }

  window.CODANEX = {
    CATEGORIES: CATEGORIES, PAR_PAGE: PAR_PAGE,
    categorie: categorie, tirer: tirer,
    marque: marque, basculer: basculer, comptees: comptees, oublier: oublier
  };
})();
