// Le niveau du joueur : un cercle sur le flanc droit du pad, et la page
// des niveaux avec leurs recompenses.
//
// L'XP ne se stocke pas : elle se deduit de la progression (Dinders,
// poissons, requins, mondes, scans, badges...). Rien a brancher dans
// chaque jeu, et une remise a zero la fait redescendre d'elle-meme. Le
// profil ne retient que les recompenses deja reclamees.
(function () {
  var DP = window.DP;
  if (!DP) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================
  //  L'XP
  // ==========================================================

  function somme(obj, champ) {
    var n = 0;
    for (var k in obj) if (obj[k]) n += champ ? (obj[k][champ] || 0) : (obj[k] || 0);
    return n;
  }

  // Chaque source : ce qu'on compte, et ce que vaut une unite.
  var SOURCES = [
    { id: 'dinders', nom: 'Dinders collectés', pts: 100,
      compte: function () { return DP.owned().length; } },
    { id: 'especes', nom: 'Espèces de poissons', pts: 20,
      compte: function () { return Object.keys(DP.prises()).length; } },
    { id: 'prises', nom: 'Poissons pêchés', pts: 2,
      compte: function () { return somme(DP.prises(), 'n'); } },
    { id: 'brillants', nom: 'Poissons brillants', pts: 60,
      compte: function () { return DP.shinys(); } },
    { id: 'requins', nom: 'Requins abattus', pts: 60,
      compte: function () { return somme(DP.requins(), 'n'); } },
    { id: 'mondes', nom: 'Mondes visités', pts: 80,
      compte: function () { return DP.astresVus().length; } },
    { id: 'scans', nom: 'Scans du Téléportail', pts: 15,
      compte: function () { return Object.keys(DP.scans()).length; } },
    { id: 'abattues', nom: 'Créatures abattues', pts: 6,
      compte: function () { return somme(DP.abattus()); } },
    { id: 'boss', nom: 'Sélénophage vaincu', pts: 400,
      compte: function () { return DP.exploit('selenophage') > 0 ? 1 : 0; } },
    { id: 'badges', nom: 'Badges obtenus', pts: 50,
      compte: function () { return window.BADGES ? window.BADGES.obtenus().length : 0; } },
    { id: 'revetements', nom: 'Revêtements gagnés', pts: 40,
      compte: function () {
        // Ni l'acier d'origine, ni ceux que donnent les niveaux : l'XP ne
        // doit pas se nourrir de ses propres recompenses.
        var A = window.ARME;
        return DP.revetements().filter(function (id) {
          if (id === 'origine') return false;
          return !(A && A.revetement(id).niveau);
        }).length;
      } },
    { id: 'arme', nom: 'Améliorations du pistolet', pts: 50,
      compte: function () {
        return DP.aLArme() ? (DP.armeNiveau() - 1) + (DP.armeNiveau('odyssee') - 1) : 0;
      } }
  ];

  function detailXP() {
    return SOURCES.map(function (s) {
      var n = 0;
      try { n = s.compte() || 0; } catch (e) { n = 0; }
      return { id: s.id, nom: s.nom, n: n, pts: s.pts, xp: n * s.pts };
    });
  }

  function xp() {
    return detailXP().reduce(function (t, d) { return t + d.xp; }, 0);
  }

  // ==========================================================
  //  Les paliers
  // ==========================================================
  // Trente niveaux, de plus en plus espaces : le niveau 10 tombe vers
  // 1 250 XP, le 30 vers 10 000.

  var MAX = 30;

  function seuil(n) {
    if (n <= 1) return 0;
    return Math.round(25 * Math.pow(n - 1, 1.78) / 5) * 5;
  }

  function niveauDe(x) {
    var n = 1;
    while (n < MAX && x >= seuil(n + 1)) n++;
    return n;
  }

  function etat() {
    var x = xp(), n = niveauDe(x);
    var bas = seuil(n), haut = n >= MAX ? bas : seuil(n + 1);
    return {
      xp: x, niveau: n, bas: bas, haut: haut,
      k: n >= MAX ? 1 : (x - bas) / Math.max(1, haut - bas)
    };
  }

  // ==========================================================
  //  Les recompenses
  // ==========================================================

  var TITRES = {
    1: 'Recrue', 5: 'Explorateur', 10: 'Aventurier', 15: 'Chasseur',
    20: 'Vétéran', 25: 'Maître des Dinders', 30: 'Légende du DinderPad'
  };

  function C(key, n) { return { type: 'credit', key: key, n: n }; }
  function N(n) { return { type: 'noyaux', n: n }; }
  function R(n) { return { type: 'roches', n: n }; }
  function V(id) { return { type: 'revetement', id: id }; }
  function T(n) { return { type: 'titre', nom: TITRES[n] }; }
  var D = { type: 'dinder' };

  var RECOMPENSES = {
    2:  [C('green', 3)],
    3:  [N(3)],
    4:  [R(3)],
    5:  [T(5), C('blue', 2)],
    6:  [C('green', 5)],
    7:  [N(5)],
    8:  [R(5)],
    9:  [C('gold', 1)],
    10: [T(10), V('galon'), C('blue', 3)],
    11: [C('green', 6)],
    12: [N(7)],
    13: [R(7)],
    14: [C('gold', 2)],
    15: [T(15), D],
    16: [C('green', 8)],
    17: [N(9)],
    18: [R(9)],
    19: [C('gold', 3)],
    20: [T(20), V('etoile'), C('pink', 1)],
    21: [C('green', 10)],
    22: [N(12)],
    23: [R(12)],
    24: [C('gold', 4)],
    25: [T(25), D],
    26: [C('blue', 6)],
    27: [N(15)],
    28: [R(15)],
    29: [C('gold', 5)],
    30: [T(30), V('couronne'), C('pink', 2)]
  };

  function libelle(r) {
    if (r.type === 'credit') {
      var nom = DP.CREDITS[r.key].name;
      return r.n + ' ' + (r.n > 1 ? nom.replace(/^Crédit /, 'Crédits ') + 's' : nom);
    }
    if (r.type === 'noyaux') return r.n + ' Noyaux Lumithiques';
    if (r.type === 'roches') return r.n + ' Roches Solaires';
    if (r.type === 'revetement') {
      var A = window.ARME;
      return 'Revêtement ' + (A ? A.revetement(r.id).nom : r.id);
    }
    if (r.type === 'dinder') return 'Un Dinder mystère';
    if (r.type === 'titre') return 'Titre « ' + r.nom + ' »';
    return '';
  }

  // Donne une recompense ; rend ce qui a vraiment ete recu (le Dinder
  // mystere retombe sur des credits quand la collection est complete).
  function donner(r) {
    if (r.type === 'credit') { DP.earn(r.key, r.n); return libelle(r); }
    if (r.type === 'noyaux') { DP.gagnerNoyaux(r.n); return libelle(r); }
    if (r.type === 'roches') { DP.gagnerRoches(r.n); return libelle(r); }
    if (r.type === 'revetement') { DP.acquerirRevetement(r.id); return libelle(r); }
    if (r.type === 'titre') return libelle(r);
    if (r.type === 'dinder') {
      var d = DP.draw();
      if (!d) { DP.earn('gold', 3); return '3 Crédits Omniversels (collection complète)'; }
      DP.collect(d.id);
      if (DP.markNew) DP.markNew(d.id);
      return 'Dinder : ' + d.name;
    }
    return '';
  }

  function reclame(n) { return DP.niveauxReclames().indexOf(n) !== -1; }

  function aReclamer() {
    var n = etat().niveau, out = [];
    for (var i = 2; i <= n; i++) if (!reclame(i)) out.push(i);
    return out;
  }

  function reclamer(n) {
    if (n > etat().niveau || !RECOMPENSES[n] || !DP.reclamerNiveau(n)) return null;
    return RECOMPENSES[n].map(donner);
  }

  // Le titre porte : le plus haut deja reclame.
  function titre() {
    var t = TITRES[1];
    Object.keys(TITRES).forEach(function (k) {
      k = +k;
      if (k > 1 && reclame(k)) t = TITRES[k];
    });
    return t;
  }

  // ==========================================================
  //  Le cercle du flanc droit
  // ==========================================================

  var cercle = null;

  function construireCercle() {
    var pad = document.querySelector('.pad');
    if (!pad || cercle) return;
    cercle = el('a', 'pad-niveau');
    cercle.href = '#niveaux';
    cercle.setAttribute('aria-label', 'Niveau du joueur');
    var anneau = el('span', 'pad-niveau-anneau');
    var coeur = el('span', 'pad-niveau-coeur');
    coeur.appendChild(el('span', 'pad-niveau-niv', 'NIV'));
    coeur.appendChild(el('strong', 'pad-niveau-n', '1'));
    anneau.appendChild(coeur);
    cercle.appendChild(anneau);
    cercle.appendChild(el('span', 'pad-niveau-alerte', '!'));
    pad.appendChild(cercle);
    majCercle();
  }

  function majCercle() {
    if (!cercle) return;
    var e = etat();
    cercle.style.setProperty('--k', e.k.toFixed(3));
    var n = cercle.querySelector('.pad-niveau-n');
    if (n.textContent !== String(e.niveau)) n.textContent = String(e.niveau);
    var attente = aReclamer().length;
    cercle.classList.toggle('a-reclamer', attente > 0);
    // Un niveau pas encore vu : le cercle s'illumine jusqu'a la visite.
    cercle.classList.toggle('is-monte', e.niveau > DP.niveauVu());
    cercle.title = 'Niveau ' + e.niveau + ' · ' + e.xp + ' XP' +
                   (attente ? ' · ' + attente + ' récompense' + (attente > 1 ? 's' : '') + ' à réclamer' : '');
  }

  // ==========================================================
  //  La page des niveaux
  // ==========================================================

  function puce(r) {
    var p = el('span', 'nv-puce nv-puce--' + r.type);
    var A = window.ARME;
    if (r.type === 'credit') {
      var im = el('img', 'nv-puce-img');
      im.src = DP.creditImg(r.key); im.alt = '';
      p.appendChild(im);
      p.appendChild(el('span', null, '×' + r.n));
    } else if (r.type === 'noyaux') {
      p.appendChild(el('span', 'nv-puce-ico', '◈'));
      p.appendChild(el('span', null, r.n));
    } else if (r.type === 'roches') {
      p.appendChild(el('span', 'nv-puce-ico', '☀'));
      p.appendChild(el('span', null, r.n));
    } else if (r.type === 'revetement' && A) {
      var ia = el('img', 'nv-puce-arme');
      ia.src = A.url(r.id); ia.alt = '';
      p.appendChild(ia);
      p.appendChild(el('span', null, A.revetement(r.id).nom));
    } else if (r.type === 'dinder') {
      p.appendChild(el('span', 'nv-puce-ico', '?'));
      p.appendChild(el('span', null, 'Dinder mystère'));
    } else if (r.type === 'titre') {
      p.appendChild(el('span', 'nv-puce-ico', '♛'));
      p.appendChild(el('span', null, r.nom));
    }
    p.title = libelle(r);
    return p;
  }

  function viewNiveaux(view) {
    var e = etat();
    var box = el('div', 'nv');

    // ---------- A gauche : le joueur ----------
    var gauche = el('div', 'nv-gauche');
    var grand = el('div', 'nv-cercle');
    grand.style.setProperty('--k', e.k.toFixed(3));
    var coeur = el('div', 'nv-cercle-coeur');
    coeur.appendChild(el('span', 'nv-cercle-niv', 'NIVEAU'));
    coeur.appendChild(el('strong', 'nv-cercle-n', String(e.niveau)));
    grand.appendChild(coeur);
    gauche.appendChild(grand);
    gauche.appendChild(el('p', 'nv-nom', DP.currentProfile().name));
    gauche.appendChild(el('p', 'nv-titre', titre()));

    var barre = el('div', 'nv-barre');
    var plein = el('div', 'nv-barre-plein');
    plein.style.width = (e.k * 100).toFixed(1) + '%';
    barre.appendChild(plein);
    gauche.appendChild(barre);
    gauche.appendChild(el('p', 'nv-xp', e.niveau >= MAX
      ? e.xp + ' XP · niveau maximum'
      : e.xp + ' / ' + e.haut + ' XP · encore ' + (e.haut - e.xp) + ' pour le niveau ' + (e.niveau + 1)));

    var attente = aReclamer();
    var tout = el('button', 'nv-tout', attente.length
      ? 'Tout réclamer (' + attente.length + ')' : 'Rien à réclamer');
    tout.type = 'button';
    tout.disabled = !attente.length;
    gauche.appendChild(tout);

    gauche.appendChild(el('p', 'nv-sous-titre', 'D’où vient ton XP'));
    var sources = el('div', 'nv-sources');
    detailXP().forEach(function (d) {
      var l = el('div', 'nv-source' + (d.n ? '' : ' is-vide'));
      l.appendChild(el('span', 'nv-source-nom', d.nom));
      l.appendChild(el('span', 'nv-source-n', d.n + ' × ' + d.pts));
      l.appendChild(el('strong', 'nv-source-xp', d.xp + ' XP'));
      sources.appendChild(l);
    });
    gauche.appendChild(sources);
    box.appendChild(gauche);

    // ---------- A droite : les trente paliers ----------
    var droite = el('div', 'nv-droite');
    droite.appendChild(el('p', 'nv-sous-titre', 'Les niveaux et leurs récompenses'));
    var liste = el('div', 'nv-liste');
    var cartes = {};
    for (var n = 1; n <= MAX; n++) {
      var c = el('div', 'nv-carte');
      c.dataset.niveau = n;
      var tete = el('div', 'nv-carte-tete');
      tete.appendChild(el('span', 'nv-carte-n', 'Niv. ' + n));
      tete.appendChild(el('span', 'nv-carte-seuil', seuil(n) + ' XP'));
      c.appendChild(tete);
      var puces = el('div', 'nv-puces');
      if (n === 1) puces.appendChild(puce({ type: 'titre', nom: TITRES[1] }));
      (RECOMPENSES[n] || []).forEach(function (r) { puces.appendChild(puce(r)); });
      c.appendChild(puces);
      var action = el('span', 'nv-carte-action');
      c.appendChild(action);
      liste.appendChild(c);
      cartes[n] = c;
    }
    droite.appendChild(liste);
    box.appendChild(droite);
    view.appendChild(box);

    var toast = el('div', 'nv-toast');
    toast.hidden = true;
    box.appendChild(toast);

    function majCarte(n) {
      var c = cartes[n], action = c.querySelector('.nv-carte-action');
      var atteint = n <= etat().niveau;
      var fait = n === 1 || reclame(n);
      c.classList.toggle('is-atteint', atteint);
      c.classList.toggle('is-fait', atteint && fait);
      c.classList.toggle('is-dispo', atteint && !fait);
      c.classList.toggle('is-actuel', n === etat().niveau);
      action.textContent = '';
      if (!atteint) {
        action.appendChild(el('span', 'nv-verrou', '🔒'));
      } else if (fait) {
        action.appendChild(el('span', 'nv-ok', n === 1 ? 'Départ' : 'Reçu ✓'));
      } else {
        var b = el('button', 'nv-reclamer', 'Réclamer');
        b.type = 'button';
        b.addEventListener('click', function () { prendre([n]); });
        action.appendChild(b);
      }
    }

    function majTout() {
      for (var n = 1; n <= MAX; n++) majCarte(n);
      var reste = aReclamer();
      tout.disabled = !reste.length;
      tout.textContent = reste.length ? 'Tout réclamer (' + reste.length + ')' : 'Rien à réclamer';
      gauche.querySelector('.nv-titre').textContent = titre();
      majCercle();
    }

    var minuteToast = null;
    function annoncer(lignes) {
      toast.textContent = '';
      toast.appendChild(el('strong', 'nv-toast-titre', 'Récompenses reçues'));
      lignes.slice(0, 6).forEach(function (l) { toast.appendChild(el('span', 'nv-toast-ligne', '+ ' + l)); });
      if (lignes.length > 6) toast.appendChild(el('span', 'nv-toast-ligne', '… et ' + (lignes.length - 6) + ' de plus'));
      toast.hidden = false;
      toast.classList.remove('is-in'); void toast.offsetWidth; toast.classList.add('is-in');
      clearTimeout(minuteToast);
      minuteToast = setTimeout(function () { toast.hidden = true; }, 3200);
    }

    // Reclamer : la carte s'illumine, ses puces s'envolent, puis le
    // resume s'affiche.
    function prendre(niveaux) {
      var recu = [];
      niveaux.forEach(function (n) {
        var r = reclamer(n);
        if (!r) return;
        recu = recu.concat(r);
        var c = cartes[n];
        c.classList.remove('is-prise'); void c.offsetWidth; c.classList.add('is-prise');
        c.querySelectorAll('.nv-puce').forEach(function (p, i) {
          var vol = p.cloneNode(true);
          vol.classList.add('nv-puce--vol');
          vol.style.left = p.offsetLeft + 'px';
          vol.style.top = p.offsetTop + 'px';
          vol.style.animationDelay = (i * 90) + 'ms';
          p.parentNode.appendChild(vol);
          setTimeout(function () { vol.remove(); }, 1200 + i * 90);
        });
      });
      majTout();
      if (recu.length) annoncer(recu);
    }

    tout.addEventListener('click', function () { prendre(aReclamer()); });
    majTout();

    // On amene sous les yeux la premiere recompense a prendre, sinon le
    // niveau actuel.
    var cible = cartes[aReclamer()[0] || e.niveau];
    requestAnimationFrame(function () {
      if (cible && liste.scrollTo) liste.scrollTo({ top: Math.max(0, cible.offsetTop - liste.offsetTop - 12) });
    });

    // Un niveau gagne depuis la derniere visite : on le fete.
    var vu = DP.niveauVu();
    if (e.niveau > vu) {
      var fete = el('div', 'nv-fete');
      fete.appendChild(el('span', 'nv-fete-haut', vu + ' → ' + e.niveau));
      fete.appendChild(el('strong', 'nv-fete-titre', 'NIVEAU ' + e.niveau + ' !'));
      fete.appendChild(el('span', 'nv-fete-bas', attente.length
        ? attente.length + ' récompense' + (attente.length > 1 ? 's' : '') + ' t’attend' + (attente.length > 1 ? 'ent' : '')
        : 'Continue comme ça'));
      for (var i = 0; i < 14; i++) {
        var eclat = el('span', 'nv-fete-eclat');
        eclat.style.setProperty('--a', (i / 14 * 360) + 'deg');
        fete.appendChild(eclat);
      }
      box.appendChild(fete);
      setTimeout(function () { fete.classList.add('is-sortie'); }, reduit ? 1500 : 2300);
      setTimeout(function () { fete.remove(); }, reduit ? 1600 : 2800);
    }
    DP.voirNiveau(e.niveau);
    majCercle();
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS['niveaux'] = { title: 'Niveaux', render: viewNiveaux };

  function demarrer() {
    construireCercle();
    window.addEventListener('hashchange', function () { setTimeout(majCercle, 30); });
    // Les jeux font gagner de l'XP sans changer d'adresse : un coup d'oeil
    // regulier suffit a garder le cercle juste.
    setInterval(function () { if (!document.hidden) majCercle(); }, 3000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();

  window.NIVEAUX = {
    SOURCES: SOURCES, RECOMPENSES: RECOMPENSES, TITRES: TITRES, MAX: MAX,
    xp: xp, detailXP: detailXP, seuil: seuil, niveauDe: niveauDe, etat: etat,
    aReclamer: aReclamer, reclamer: reclamer, titre: titre, libelle: libelle,
    majCercle: majCercle
  };
})();
