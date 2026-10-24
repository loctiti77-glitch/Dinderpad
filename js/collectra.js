// Collectra : le carnet de collection du DinderPad. Il remplace Quests.
//
// Trois etages, chacun avec ses cases :
//   #collectra            les themes (Lego, Montres...)
//   #collectra/T          les sous-collections d'un theme (Star Wars...)
//   #collectra/T/S        les objets, chacun avec sa photo
//   #collectra/T/S/O      la fiche d'un objet
//
// Les photos sont prises a l'appareil ou choisies dans la phototheque,
// reduites, puis gardees dans le navigateur (IndexedDB) : localStorage est
// bien trop petit pour des images. Chaque profil du pad a sa collection.
(function () {
  var DP = window.DP;
  if (!DP || !window.VIEWS) return;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================
  //  Le stockage
  // ==========================================================

  var BASE = 'dinderpad-collectra';
  var base = null;

  function ouvrir() {
    if (base) return base;
    base = new Promise(function (ok, ko) {
      if (!window.indexedDB) { ko(new Error('Pas de stockage')); return; }
      var r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = function () {
        var s = r.result.createObjectStore('noeuds', { keyPath: 'id' });
        s.createIndex('profil', 'profil');
      };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { base = null; ko(r.error); };
    });
    // Demande au navigateur de ne pas effacer les photos pour faire de la
    // place. Il peut refuser : on n'y peut rien.
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    return base;
  }

  function req(mode, fn) {
    return ouvrir().then(function (db) {
      return new Promise(function (ok, ko) {
        var tx = db.transaction('noeuds', mode);
        var res;
        tx.oncomplete = function () { ok(res); };
        tx.onerror = function () { ko(tx.error); };
        tx.onabort = function () { ko(tx.error); };
        fn(tx.objectStore('noeuds'), function (v) { res = v; });
      });
    });
  }

  function profil() {
    try { return DP.currentProfile().id; } catch (e) { return 'commun'; }
  }

  function tous() {
    var p = profil();
    return req('readonly', function (s, rendre) {
      var r = s.index('profil').getAll(p);
      r.onsuccess = function () { rendre(r.result || []); };
    });
  }

  function poser(n) {
    n.modif = Date.now();
    return req('readwrite', function (s) { s.put(n); });
  }

  function effacer(ids) {
    return req('readwrite', function (s) { ids.forEach(function (id) { s.delete(id); }); });
  }

  function nouvelId() {
    return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ==========================================================
  //  Les photos
  // ==========================================================

  // Reduit une image a "max" pixels sur son grand cote, en JPEG. Le
  // navigateur redresse deja les photos de telephone a l'affichage.
  function reduire(fichier, max, qualite) {
    return new Promise(function (ok, ko) {
      var url = URL.createObjectURL(fichier);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * k));
        c.height = Math.max(1, Math.round(h * k));
        var g = c.getContext('2d');
        g.fillStyle = '#fff';
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : ko(new Error('Image illisible')); }, 'image/jpeg', qualite);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ko(new Error('Image illisible')); };
      img.src = url;
    });
  }

  function preparerPhoto(fichier) {
    return Promise.all([reduire(fichier, 1600, 0.86), reduire(fichier, 480, 0.8)])
      .then(function (r) { return { photo: r[0], vignette: r[1] }; });
  }

  // Les adresses d'images de la page en cours, liberees au changement.
  var urls = [];
  function urlDe(blob) {
    var u = URL.createObjectURL(blob);
    urls.push(u);
    return u;
  }
  function libererUrls() {
    urls.forEach(function (u) { URL.revokeObjectURL(u); });
    urls = [];
  }

  // Ouvre l'appareil photo ("camera") ou la phototheque.
  function choisirPhoto(camera) {
    return new Promise(function (ok) {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      if (camera) inp.setAttribute('capture', 'environment');
      inp.style.display = 'none';
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0];
        inp.remove();
        ok(f || null);
      });
      document.body.appendChild(inp);
      inp.click();
    });
  }

  // ==========================================================
  //  L'arbre de la collection
  // ==========================================================

  function arbre(liste) {
    var parId = {}, enfants = {};
    liste.forEach(function (n) {
      parId[n.id] = n;
      var p = n.parent || '';
      (enfants[p] = enfants[p] || []).push(n);
    });
    Object.keys(enfants).forEach(function (k) {
      enfants[k].sort(function (a, b) { return a.cree - b.cree; });
    });
    function de(id) { return enfants[id || ''] || []; }
    function objetsSous(id) {
      var out = [];
      de(id).forEach(function (n) {
        if (n.type === 'objet') out.push(n);
        else out = out.concat(objetsSous(n.id));
      });
      return out;
    }
    function descendants(id) {
      var out = [];
      de(id).forEach(function (n) { out.push(n.id); out = out.concat(descendants(n.id)); });
      return out;
    }
    // La couverture d'une case : celle qu'on a choisie, sinon la photo du
    // dernier objet range dedans.
    function couverture(n) {
      if (n.vignette) return n.vignette;
      var o = objetsSous(n.id).filter(function (x) { return x.vignette; });
      o.sort(function (a, b) { return b.cree - a.cree; });
      return o.length ? o[0].vignette : null;
    }
    return { get: function (id) { return parId[id] || null; }, de: de,
             objetsSous: objetsSous, descendants: descendants, couverture: couverture };
  }

  function pluriel(n, un, plusieurs) { return n + ' ' + (n > 1 ? plusieurs : un); }

  // ==========================================================
  //  La page
  // ==========================================================

  var jeton = 0;          // la page affichee ; une reponse en retard l'ignore
  var fete = null;        // la case a faire apparaitre en grand au prochain dessin

  function viewCollectra(view, arg) {
    libererUrls();
    var mien = ++jeton;
    view.classList.add('view--collectra');

    var chemin = (arg || '').split('/').filter(Boolean);

    var tete = el('header', 'cx-tete');
    var logo = el('a', 'cx-logo');
    logo.href = '#collectra';
    logo.setAttribute('aria-label', 'Collectra');
    logo.appendChild(el('span', 'cx-logo-c'));
    logo.appendChild(el('span', 'cx-logo-eclat'));
    tete.appendChild(logo);
    var titres = el('div', 'cx-titres');
    var titre = el('h2', 'cx-titre', 'Collectra');
    var fil = el('nav', 'cx-fil');
    titres.appendChild(titre);
    titres.appendChild(fil);
    tete.appendChild(titres);
    view.appendChild(tete);

    var corps = el('div', 'cx-corps');
    corps.appendChild(el('p', 'cx-attente', 'Ouverture de la collection…'));
    view.appendChild(corps);

    tous().then(function (liste) {
      if (mien !== jeton || !document.body.contains(view)) return;
      var A = arbre(liste);

      // Le chemin doit tenir debout : un theme, puis une de ses
      // sous-collections, puis un de ses objets.
      var t = chemin[0] ? A.get(chemin[0]) : null;
      var s = chemin[1] ? A.get(chemin[1]) : null;
      var o = chemin[2] ? A.get(chemin[2]) : null;
      if (chemin[0] && (!t || t.type !== 'theme')) { location.replace('#collectra'); return; }
      if (chemin[1] && (!s || s.parent !== t.id)) { location.replace('#collectra/' + t.id); return; }
      if (chemin[2] && (!o || o.parent !== s.id)) { location.replace('#collectra/' + t.id + '/' + s.id); return; }

      // Le fil d'Ariane.
      var etapes = [['#collectra', 'Collections']];
      if (t) etapes.push(['#collectra/' + t.id, t.nom]);
      if (s) etapes.push(['#collectra/' + t.id + '/' + s.id, s.nom]);
      if (o) etapes.push(['', o.nom]);
      etapes.forEach(function (e, i) {
        if (i) fil.appendChild(el('span', 'cx-fil-sep', '›'));
        var last = i === etapes.length - 1;
        var a = el(last ? 'span' : 'a', 'cx-fil-pas' + (last ? ' is-ici' : ''), e[1]);
        if (!last) a.href = e[0];
        fil.appendChild(a);
      });
      titre.textContent = o ? o.nom : s ? s.nom : t ? t.nom : 'Collectra';
      document.title = (o || s || t ? titre.textContent + ' · ' : '') + 'Collectra – DinderPad';

      corps.textContent = '';
      var ctx = { view: view, corps: corps, A: A, t: t, s: s, o: o };
      if (o) dessinerFiche(ctx);
      else if (s) dessinerObjets(ctx);
      else dessinerDossiers(ctx, t);
    }).catch(function () {
      if (mien !== jeton) return;
      corps.textContent = '';
      corps.appendChild(el('p', 'cx-attente',
        'Impossible d’ouvrir la collection sur cet appareil (navigation privée ?).'));
    });
  }

  function recharger() {
    // Redessine la page courante sans toucher a l'historique.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  function aller(hash) {
    if (location.hash === hash) recharger();
    else location.hash = hash;
  }

  // ---------- Themes et sous-collections ----------

  function dessinerDossiers(ctx, parent) {
    var A = ctx.A;
    var enfants = A.de(parent ? parent.id : null);
    var grille = el('div', 'cx-grille cx-grille--dossiers');

    // La case pour ajouter, toujours en premier.
    var plus = el('button', 'cx-case cx-case--plus');
    plus.type = 'button';
    plus.appendChild(el('span', 'cx-plus-signe', '+'));
    plus.appendChild(el('span', 'cx-plus-mot', parent ? 'Nouvelle sous-collection' : 'Nouveau thème'));
    plus.addEventListener('click', function () {
      feuilleNom(ctx.view, {
        titre: parent ? 'Nouvelle sous-collection' : 'Nouveau thème',
        aide: parent ? 'Une famille dans « ' + parent.nom + ' » : une gamme, une marque, une série…'
                     : 'Ce que tu collectionnes.',
        idees: parent ? null : ['Lego', 'Montres', 'Cartes', 'Figurines', 'Pièces', 'Vinyles', 'Sneakers', 'Jeux vidéo'],
        valider: 'Créer'
      }).then(function (nom) {
        if (!nom) return;
        var n = { id: nouvelId(), profil: profil(), parent: parent ? parent.id : null,
                  type: parent ? 'sous' : 'theme', nom: nom, note: '', cree: Date.now(),
                  photo: null, vignette: null };
        return poser(n).then(function () { fete = n.id; recharger(); });
      });
    });
    grille.appendChild(plus);

    enfants.forEach(function (n) {
      var a = el('a', 'cx-case cx-case--dossier' + (n.type === 'theme' ? ' is-theme' : ''));
      a.href = '#collectra/' + (parent ? parent.id + '/' : '') + n.id;
      a.dataset.id = n.id;

      var cadre = el('span', 'cx-cadre');
      var couv = A.couverture(n);
      if (couv) {
        var img = el('img', 'cx-photo');
        img.src = urlDe(couv);
        img.alt = '';
        img.decoding = 'async';
        cadre.appendChild(img);
      } else {
        cadre.appendChild(el('span', 'cx-vide'));
      }
      a.appendChild(cadre);

      var nom = el('span', 'cx-nom');
      nom.appendChild(el('span', 'cx-nom-main', n.nom));
      var nbObj = A.objetsSous(n.id).length;
      var sous = n.type === 'theme'
        ? pluriel(A.de(n.id).length, 'sous-coll.', 'sous-coll.') + ' · ' + pluriel(nbObj, 'objet', 'objets')
        : pluriel(nbObj, 'objet', 'objets');
      nom.appendChild(el('span', 'cx-nom-sub', sous));
      a.appendChild(nom);

      a.appendChild(boutonReglages(ctx, n));
      grille.appendChild(a);
      if (fete === n.id) celebrer(a, false);
    });
    fete = null;

    ctx.corps.appendChild(grille);
    if (!enfants.length) {
      ctx.corps.appendChild(el('p', 'cx-conseil', parent
        ? 'Range « ' + parent.nom + ' » en sous-collections, puis ajoute tes objets en photo.'
        : 'Crée un thème (Lego, montres…), puis des sous-collections, puis prends tes objets en photo.'));
    }
  }

  // Le petit bouton "..." d'une case : renommer, couverture, supprimer.
  function boutonReglages(ctx, n) {
    var b = el('button', 'cx-reglages');
    b.type = 'button';
    b.setAttribute('aria-label', 'Réglages de ' + n.nom);
    b.appendChild(el('span', '', '•••'));
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var choix = [
        { id: 'nom', mot: 'Renommer' },
        { id: 'couv', mot: n.vignette ? 'Changer la couverture' : 'Choisir une couverture' }
      ];
      if (n.vignette) choix.push({ id: 'sanscouv', mot: 'Couverture automatique' });
      choix.push({ id: 'suppr', mot: 'Supprimer', danger: true });
      feuilleChoix(ctx.view, n.nom, choix).then(function (c) {
        if (c === 'nom') {
          return feuilleNom(ctx.view, { titre: 'Renommer', valeur: n.nom, valider: 'Enregistrer' })
            .then(function (nom) { if (nom) { n.nom = nom; return poser(n).then(recharger); } });
        }
        if (c === 'couv') {
          return feuillePhoto(ctx.view, 'Couverture de « ' + n.nom + ' »').then(function (f) {
            if (!f) return;
            return preparerPhoto(f).then(function (p) {
              n.vignette = p.vignette;
              return poser(n).then(function () { fete = n.id; recharger(); });
            });
          });
        }
        if (c === 'sanscouv') { n.vignette = null; return poser(n).then(recharger); }
        if (c === 'suppr') {
          var desc = ctx.A.descendants(n.id);
          var nbO = ctx.A.objetsSous(n.id).length;
          var msg = nbO ? 'Ses ' + pluriel(nbO, 'objet', 'objets') + ' et leurs photos seront effacés.'
                        : 'Cette case est vide.';
          return feuilleConfirmer(ctx.view, 'Supprimer « ' + n.nom + ' » ?', msg).then(function (ok) {
            if (ok) return effacer([n.id].concat(desc)).then(recharger);
          });
        }
      });
    });
    return b;
  }

  // ---------- Les objets d'une sous-collection ----------

  function dessinerObjets(ctx) {
    var A = ctx.A, t = ctx.t, s = ctx.s;
    var objets = A.de(s.id);
    var grille = el('div', 'cx-grille cx-grille--objets');

    var plus = el('button', 'cx-case cx-case--plus');
    plus.type = 'button';
    plus.appendChild(el('span', 'cx-plus-signe', '+'));
    plus.appendChild(el('span', 'cx-plus-mot', 'Ajouter un objet'));
    plus.addEventListener('click', function () { ajouterObjet(ctx); });
    grille.appendChild(plus);

    objets.forEach(function (o, i) {
      var a = el('a', 'cx-case cx-case--objet');
      a.href = '#collectra/' + t.id + '/' + s.id + '/' + o.id;
      var cadre = el('span', 'cx-cadre');
      if (o.vignette) {
        var img = el('img', 'cx-photo');
        img.src = urlDe(o.vignette);
        img.alt = '';
        img.decoding = 'async';
        cadre.appendChild(img);
      } else cadre.appendChild(el('span', 'cx-vide'));
      cadre.appendChild(el('span', 'cx-numero', '#' + String(i + 1).padStart(2, '0')));
      a.appendChild(cadre);
      var nom = el('span', 'cx-nom');
      nom.appendChild(el('span', 'cx-nom-main', o.nom));
      a.appendChild(nom);
      grille.appendChild(a);
      if (fete === o.id) celebrer(a, true);
    });
    fete = null;

    ctx.corps.appendChild(grille);
    if (!objets.length) {
      ctx.corps.appendChild(el('p', 'cx-conseil',
        'Prends ton premier objet en photo, ou choisis-le dans ta photothèque.'));
    }
  }

  function ajouterObjet(ctx) {
    var s = ctx.s;
    var numero = ctx.A.de(s.id).length + 1;
    feuillePhoto(ctx.view, 'Ajouter à « ' + s.nom + ' »').then(function (f) {
      if (!f) return;
      flash(ctx.view);
      return preparerPhoto(f).then(function (p) {
        return feuilleNom(ctx.view, {
          titre: 'Nom de l’objet',
          apercu: p.vignette,
          valeur: '',
          placeholder: s.nom + ' n°' + numero,
          note: true,
          valider: 'Ajouter à la collection'
        }, true).then(function (r) {
          if (!r) return;
          var o = { id: nouvelId(), profil: profil(), parent: s.id, type: 'objet',
                    nom: r.nom || (s.nom + ' n°' + numero), note: r.note || '',
                    cree: Date.now(), photo: p.photo, vignette: p.vignette };
          return poser(o).then(function () { fete = o.id; recharger(); });
        });
      });
    }).catch(function () {
      feuilleConfirmer(ctx.view, 'Photo illisible', 'Cette image n’a pas pu être ouverte. Essaie une autre photo.', true);
    });
  }

  // ---------- La fiche d'un objet ----------

  function dessinerFiche(ctx) {
    var o = ctx.o, s = ctx.s, t = ctx.t;
    var fiche = el('div', 'cx-fiche');

    var cadre = el('div', 'cx-fiche-cadre');
    if (o.photo || o.vignette) {
      var img = el('img', 'cx-fiche-photo');
      img.src = urlDe(o.photo || o.vignette);
      img.alt = o.nom;
      cadre.appendChild(img);
    } else cadre.appendChild(el('span', 'cx-vide'));
    fiche.appendChild(cadre);

    var info = el('div', 'cx-fiche-info');
    info.appendChild(el('h3', 'cx-fiche-nom', o.nom));
    info.appendChild(el('p', 'cx-fiche-ou', t.nom + ' › ' + s.nom));
    var d = new Date(o.cree);
    info.appendChild(el('p', 'cx-fiche-date', 'Ajouté le ' + d.toLocaleDateString('fr-FR',
      { day: 'numeric', month: 'long', year: 'numeric' })));
    if (o.note) info.appendChild(el('p', 'cx-fiche-note', o.note));

    var actions = el('div', 'cx-fiche-actions');
    function bouton(mot, cls, fn) {
      var b = el('button', 'cx-bouton' + (cls ? ' ' + cls : ''), mot);
      b.type = 'button';
      b.addEventListener('click', fn);
      actions.appendChild(b);
    }
    bouton('Modifier', '', function () {
      feuilleNom(ctx.view, { titre: 'Modifier l’objet', valeur: o.nom, note: true, noteValeur: o.note,
                             valider: 'Enregistrer' }, true)
        .then(function (r) {
          if (!r) return;
          o.nom = r.nom || o.nom;
          o.note = r.note || '';
          return poser(o).then(recharger);
        });
    });
    bouton('Changer la photo', '', function () {
      feuillePhoto(ctx.view, 'Nouvelle photo').then(function (f) {
        if (!f) return;
        flash(ctx.view);
        return preparerPhoto(f).then(function (p) {
          o.photo = p.photo; o.vignette = p.vignette;
          return poser(o).then(recharger);
        });
      });
    });
    bouton('Supprimer', 'is-danger', function () {
      feuilleConfirmer(ctx.view, 'Supprimer « ' + o.nom + ' » ?', 'L’objet et sa photo seront effacés.')
        .then(function (ok) {
          if (ok) effacer([o.id]).then(function () { location.replace('#collectra/' + t.id + '/' + s.id); });
        });
    });
    info.appendChild(actions);
    fiche.appendChild(info);
    ctx.corps.appendChild(fiche);
  }

  // ==========================================================
  //  Les feuilles (fenetres posees sur l'ecran du pad)
  // ==========================================================

  function feuille(view, titre) {
    var voile = el('div', 'cx-voile');
    var p = el('div', 'cx-feuille');
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-modal', 'true');
    p.appendChild(el('h3', 'cx-feuille-titre', titre));
    voile.appendChild(p);
    view.appendChild(voile);
    requestAnimationFrame(function () { voile.classList.add('is-ouvert'); });
    function fermer() {
      voile.classList.remove('is-ouvert');
      setTimeout(function () { voile.remove(); }, 220);
    }
    return { voile: voile, panneau: p, fermer: fermer };
  }

  function rangeeBoutons(f, boutons) {
    var r = el('div', 'cx-feuille-boutons');
    boutons.forEach(function (b) {
      var x = el('button', 'cx-bouton' + (b.cls ? ' ' + b.cls : ''), b.mot);
      x.type = b.submit ? 'submit' : 'button';
      if (b.fn) x.addEventListener('click', b.fn);
      r.appendChild(x);
    });
    f.panneau.appendChild(r);
    return r;
  }

  // Demande un nom (et une note si "avecNote"). Rend le nom, ou
  // { nom, note } avec une note, ou null si on annule.
  function feuilleNom(view, o, avecNote) {
    return new Promise(function (ok) {
      var f = feuille(view, o.titre);
      var form = el('form', 'cx-form');
      f.panneau.appendChild(form);
      if (o.apercu) {
        var ap = el('img', 'cx-apercu');
        ap.src = urlDe(o.apercu);
        ap.alt = '';
        form.appendChild(ap);
      }
      if (o.aide) form.appendChild(el('p', 'cx-aide', o.aide));
      var champ = el('input', 'cx-champ');
      champ.type = 'text';
      champ.maxLength = 40;
      champ.value = o.valeur || '';
      champ.placeholder = o.placeholder || 'Nom';
      champ.autocomplete = 'off';
      form.appendChild(champ);
      var note = null;
      if (o.note) {
        note = el('textarea', 'cx-champ cx-champ--note');
        note.maxLength = 300;
        note.rows = 2;
        note.placeholder = 'Note (année, état, prix…) — facultatif';
        note.value = o.noteValeur || '';
        form.appendChild(note);
      }
      if (o.idees) {
        var idees = el('div', 'cx-idees');
        o.idees.forEach(function (i) {
          var b = el('button', 'cx-idee', i);
          b.type = 'button';
          b.addEventListener('click', function () { champ.value = i; champ.focus(); });
          idees.appendChild(b);
        });
        form.appendChild(idees);
      }
      var fini = false;
      function finir(v) { if (fini) return; fini = true; f.fermer(); ok(v); }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nom = champ.value.trim();
        if (!nom && !o.placeholder) { champ.classList.add('is-erreur'); champ.focus(); return; }
        if (avecNote) finir({ nom: nom, note: note ? note.value.trim() : '' });
        else finir(nom);
      });
      // Les boutons vont dans le formulaire : Entree vaut "valider".
      var r = rangeeBoutons(f, [
        { mot: 'Annuler', cls: 'is-discret', fn: function () { finir(null); } },
        { mot: o.valider || 'OK', cls: 'is-principal', submit: true }
      ]);
      form.appendChild(r);
      f.voile.addEventListener('click', function (e) { if (e.target === f.voile) finir(null); });
      setTimeout(function () { try { champ.focus(); } catch (e) {} }, 60);
    });
  }

  // Appareil photo ou phototheque : rend le fichier choisi, ou null.
  function feuillePhoto(view, titre) {
    return new Promise(function (ok) {
      var f = feuille(view, titre);
      var choix = el('div', 'cx-sources');
      var fini = false;
      function finir(v) { if (fini) return; fini = true; f.fermer(); ok(v); }
      [[true, 'Prendre une photo', 'cx-source--camera'], [false, 'Photothèque', 'cx-source--album']]
        .forEach(function (c) {
          var b = el('button', 'cx-source ' + c[2]);
          b.type = 'button';
          b.appendChild(el('span', 'cx-source-ico'));
          b.appendChild(el('span', 'cx-source-mot', c[1]));
          b.addEventListener('click', function () {
            choisirPhoto(c[0]).then(function (fichier) { if (fichier) finir(fichier); });
          });
          choix.appendChild(b);
        });
      f.panneau.appendChild(choix);
      rangeeBoutons(f, [{ mot: 'Annuler', cls: 'is-discret', fn: function () { finir(null); } }]);
      f.voile.addEventListener('click', function (e) { if (e.target === f.voile) finir(null); });
    });
  }

  function feuilleChoix(view, titre, choix) {
    return new Promise(function (ok) {
      var f = feuille(view, titre);
      var fini = false;
      function finir(v) { if (fini) return; fini = true; f.fermer(); ok(v); }
      var liste = el('div', 'cx-choix');
      choix.forEach(function (c) {
        var b = el('button', 'cx-bouton' + (c.danger ? ' is-danger' : ''), c.mot);
        b.type = 'button';
        b.addEventListener('click', function () { finir(c.id); });
        liste.appendChild(b);
      });
      f.panneau.appendChild(liste);
      rangeeBoutons(f, [{ mot: 'Annuler', cls: 'is-discret', fn: function () { finir(null); } }]);
      f.voile.addEventListener('click', function (e) { if (e.target === f.voile) finir(null); });
    });
  }

  function feuilleConfirmer(view, titre, texte, seulOk) {
    return new Promise(function (ok) {
      var f = feuille(view, titre);
      f.panneau.appendChild(el('p', 'cx-aide', texte));
      var fini = false;
      function finir(v) { if (fini) return; fini = true; f.fermer(); ok(v); }
      rangeeBoutons(f, seulOk
        ? [{ mot: 'OK', cls: 'is-principal', fn: function () { finir(true); } }]
        : [{ mot: 'Annuler', cls: 'is-discret', fn: function () { finir(false); } },
           { mot: 'Supprimer', cls: 'is-danger', fn: function () { finir(true); } }]);
    });
  }

  // ==========================================================
  //  Les mises en scene
  // ==========================================================

  // Le declic : un eclair blanc sur l'ecran quand la photo arrive.
  function flash(view) {
    if (calme) return;
    var f = el('div', 'cx-flash');
    view.appendChild(f);
    setTimeout(function () { f.remove(); }, 700);
  }

  // Une case qui vient d'entrer dans la collection : elle surgit, l'etoile
  // de Collectra la traverse et des eclats en jaillissent. Un objet a en
  // plus son tampon "Ajouté !".
  function celebrer(caseEl, objet) {
    caseEl.classList.add('is-neuve');
    requestAnimationFrame(function () {
      try { caseEl.scrollIntoView({ block: 'nearest', behavior: calme ? 'auto' : 'smooth' }); } catch (e) {}
    });
    if (calme) return;
    var fx = el('span', 'cx-fx');
    fx.setAttribute('aria-hidden', 'true');
    fx.appendChild(el('span', 'cx-fx-etoile'));
    for (var i = 0; i < 10; i++) {
      var p = el('span', 'cx-fx-p');
      p.style.setProperty('--a', (i * 36 + Math.random() * 18) + 'deg');
      p.style.setProperty('--d', (90 + Math.random() * 70).toFixed(0));
      fx.appendChild(p);
    }
    if (objet) fx.appendChild(el('span', 'cx-fx-tampon', 'Ajouté !'));
    caseEl.appendChild(fx);
    setTimeout(function () { fx.remove(); caseEl.classList.remove('is-neuve'); }, 2200);
  }

  window.VIEWS['collectra'] = { title: 'Collectra', render: viewCollectra };
  // L'ancienne adresse de Quests mene desormais a Collectra.
  window.VIEWS['quests'] = { title: 'Collectra', render: function () { location.replace('#collectra'); } };
})();
