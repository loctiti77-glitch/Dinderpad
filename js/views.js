// Le contenu des ecrans du DinderPad.
// Chaque rubrique est une fonction qui remplit #view. Le chassis, lui,
// ne bouge jamais : c'est js/router.js qui decide quel ecran afficher.
(function () {
  var DP = window.DP;

  // Petit raccourci de construction : el('div', 'classe', 'texte')
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // ==========================================================
  //  Dinders : la collection
  // ==========================================================

  function slotNode(index) {
    var d = DP.DINDERS[index];
    var got = d && DP.has(d.id);

    var node = el(got ? 'a' : 'div', 'slot' + (got ? '' : ' slot--locked'));
    node.dataset.slot = String(index + 1).padStart(2, '0');
    if (got) { node.href = '#dinder/' + d.id; node.dataset.dinder = d.id; }

    if (got) {
      var img = el('img', 'slot-face');
      img.src = DP.dinderImg(d.id);
      img.alt = '';
      img.width = 400; img.height = 400;
      img.loading = 'lazy'; img.decoding = 'async';
      node.appendChild(img);
    } else {
      var mark = el('span', 'slot-face slot-face--locked', '?');
      mark.setAttribute('aria-hidden', 'true');
      node.appendChild(mark);
    }

    // Un nom long ne doit pas finir en points de suspension : la ligne
    // le compose plus petit plutot que de le couper.
    var name = el('span', 'slot-name' + (got && d.name.length > 11 ? ' slot-name--long' : ''));
    name.appendChild(el('span', 'slot-name-main', got ? d.name : '???'));
    if (got && d.form) name.appendChild(el('span', 'slot-name-sub', d.form));
    node.appendChild(name);

    // La rarete, a droite. Seulement pour un Dinder obtenu : l'afficher
    // sur une case verrouillee revelerait ce qui s'y cache.
    if (got) {
      var tag = el('span', 'slot-rarity', d.rarity);
      tag.dataset.rarity = DP.rarityKey(d.rarity);
      node.appendChild(tag);

      // Son niveau de combat, gagne dans The Founder War.
      var C = window.FWCAMP;
      if (C) {
        var e = C.etat(d.id);
        var niv = el('span', 'slot-niveau');
        niv.appendChild(el('span', 'slot-niveau-n', 'Niv. ' + e.niveau));
        var j = el('span', 'slot-niveau-jauge');
        var pl = el('span', 'slot-niveau-plein');
        pl.style.width = (e.k * 100).toFixed(0) + '%';
        j.appendChild(pl);
        niv.appendChild(j);
        niv.title = e.niveau >= e.max ? e.xp + ' XP · niveau maximum'
                                      : e.xp + ' / ' + e.haut + ' XP';
        node.appendChild(niv);
      }
    }
    return node;
  }

  function viewDinders(view) {
    var list = el('div', 'screen-scroll');
    for (var i = 0; i < DP.SLOTS; i++) list.appendChild(slotNode(i));
    view.appendChild(list);

    // Le Dinder tout juste sorti d'une Dindise se signale a l'arrivee.
    var fresh = DP.takeNew();
    if (!fresh) return;
    var target = list.querySelector('[data-dinder="' + fresh + '"]');
    if (!target) return;
    target.classList.add('slot--fresh');
    requestAnimationFrame(function () {
      // Absent de quelques navigateurs anciens : on s'en passe plutot que
      // de casser l'affichage de toute la collection.
      if (target.scrollIntoView) {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
    setTimeout(function () { target.classList.remove('slot--fresh'); }, 2600);
  }

  // ==========================================================
  //  La fiche d'un Dinder : le personnage en pied et son etat civil
  // ==========================================================

  function viewDinder(view, id) {
    var d = DP.byId(id);

    // Adresse inventee, ou personnage pas encore obtenu : on renvoie
    // vers la collection plutot que d'afficher une fiche vide.
    if (!d || !DP.has(d.id)) { location.hash = '#dinders'; return; }

    var sheet = el('div', 'fiche');

    var left = el('div', 'fiche-art');
    var img = el('img', 'fiche-full');
    img.src = DP.dinderFull(d.id);
    img.alt = d.name;
    img.decoding = 'async';
    left.appendChild(img);
    sheet.appendChild(left);

    var right = el('div', 'fiche-info');

    var head = el('div', 'fiche-head');
    head.appendChild(el('h2', 'fiche-name', d.name));
    if (d.form) head.appendChild(el('p', 'fiche-form', d.form));
    right.appendChild(head);

    function line(label, value, cls) {
      var row = el('div', 'fiche-line' + (cls ? ' ' + cls : ''));
      row.appendChild(el('span', 'fiche-label', label));
      var v = el('span', 'fiche-value', value);
      if (cls === 'fiche-line--rarity') v.dataset.rarity = DP.rarityKey(value);
      row.appendChild(v);
      right.appendChild(row);
    }

    line('Rareté',  d.rarity, 'fiche-line--rarity');
    line('Univers', d.universe);

    // Ce qu'il vaut au combat : son niveau, sa force, ses attaques.
    var C = window.FWCAMP;
    if (C) {
      var e = C.etat(d.id);
      var bloc = el('div', 'fiche-line fiche-line--niveau');
      bloc.appendChild(el('span', 'fiche-label', 'Niveau'));
      var col = el('div', 'fiche-niveau');
      var haut = el('div', 'fiche-niveau-haut');
      haut.appendChild(el('strong', 'fiche-niveau-n', 'Niv. ' + e.niveau + ' / ' + e.max));
      haut.appendChild(el('span', 'fiche-niveau-force',
        'force ×' + e.force.toFixed(2) + '  ·  ' + e.pv + ' PV'));
      col.appendChild(haut);
      var jauge = el('div', 'fiche-niveau-jauge');
      var plein = el('div', 'fiche-niveau-plein');
      plein.style.width = (e.k * 100).toFixed(1) + '%';
      jauge.appendChild(plein);
      col.appendChild(jauge);
      col.appendChild(el('span', 'fiche-niveau-xp', e.niveau >= e.max
        ? e.xp + ' XP  ·  niveau maximum'
        : e.xp + ' / ' + e.haut + ' XP  ·  il monte en combattant dans The Founder War'));
      var atk = el('div', 'fiche-attaques');
      C.attaques(d.id).forEach(function (a) {
        var b = el('span', 'fiche-attaque' + (a.ultime ? ' is-ultime' : ''));
        b.appendChild(el('strong', null, a.nom));
        b.appendChild(el('span', null, ' ' + a.degats[0] + '–' + a.degats[1]));
        atk.appendChild(b);
      });
      var u = C.ultimeDe(d.id);
      if (u && !C.aUltime(d.id)) {
        atk.appendChild(el('span', 'fiche-attaque is-ferme',
          u.nom + ' — niveau ' + C.NIVEAU_ULTIME));
      }
      col.appendChild(atk);
      bloc.appendChild(col);
      right.appendChild(bloc);
    }

    var descRow = el('div', 'fiche-line fiche-line--desc');
    descRow.appendChild(el('span', 'fiche-label', 'Description'));
    descRow.appendChild(el('p', 'fiche-desc' + (d.desc ? '' : ' is-empty'),
                           d.desc || 'À venir.'));
    right.appendChild(descRow);

    sheet.appendChild(right);
    view.appendChild(sheet);
  }

  // ==========================================================
  //  Credits : le bandeau des monnaies et les quatre cartes
  // ==========================================================

  function viewCredits(view) {
    view.classList.add('view--tally');

    var tally = el('div', 'credit-tally');
    DP.ORDER.forEach(function (key) {
      var box = el('div', 'tally');
      box.dataset.credit = key;
      var img = el('img', 'tally-img');
      img.src = DP.creditImg(key);
      img.alt = DP.CREDITS[key].name;
      box.appendChild(img);
      var n = DP.creditCount(key);
      box.appendChild(el('span', 'tally-count', n === Infinity ? '∞' : String(n)));
      tally.appendChild(box);
    });
    view.appendChild(tally);

    var list = el('div', 'screen-scroll is-static');
    DP.ORDER.forEach(function (key) {
      var c = DP.CREDITS[key];
      var row = el('div', 'slot slot--credit');
      row.dataset.credit = key;

      var card = el('img', 'credit-card');
      card.src = DP.creditImg(key);
      card.alt = '';
      row.appendChild(card);

      var txt = el('span', 'credit-text');
      txt.appendChild(el('strong', 'credit-name', c.name));
      txt.appendChild(el('span', 'credit-units', c.label || (c.units + ' unités')));
      row.appendChild(txt);
      list.appendChild(row);
    });
    view.appendChild(list);
  }

  // ==========================================================
  //  Win Dinders : la boutique de Dindises
  // ==========================================================

  function viewWinDinders(view) {
    var CHARGE = 1500, CRACK = 900;          // doit suivre les animations CSS
    var reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var shop = el('div', 'shop');
    shop.dataset.state = 'idle';

    // Le solde, en haut : on doit voir ce qu'on a avant de tenter sa chance.
    var solde = el('div', 'shop-solde');
    var soldeN = {};
    DP.ORDER.forEach(function (key) {
      var chip = el('span', 'shop-solde-chip');
      chip.dataset.credit = key;
      var im = el('img', 'shop-solde-img');
      im.src = DP.creditImg(key);
      im.alt = DP.CREDITS[key].name;
      chip.appendChild(im);
      soldeN[key] = el('strong', 'shop-solde-n', '');
      chip.appendChild(soldeN[key]);
      chip.title = DP.CREDITS[key].name;
      solde.appendChild(chip);
    });
    shop.appendChild(solde);

    function majSolde() {
      DP.ORDER.forEach(function (key) {
        var n = DP.creditCount(key);
        soldeN[key].textContent = n === Infinity ? '∞' : String(n);
      });
    }
    majSolde();

    var status = el('p', 'shop-status', ' ');
    shop.appendChild(status);

    // ---- La scene : capsule, rayons, eclats, lot ----
    var stage = el('div', 'stage');

    var halo = el('div', 'halo');       // lueur de fond, teintee par la rarete
    halo.setAttribute('aria-hidden', 'true');
    stage.appendChild(halo);

    var burst = el('div', 'burst');     // rayons qui jaillissent
    burst.setAttribute('aria-hidden', 'true');
    stage.appendChild(burst);

    var rings = el('div', 'rings');     // anneaux qui convergent pendant la charge
    for (var r = 0; r < 3; r++) {
      var ring = el('span', 'ring');
      ring.style.setProperty('--i', r);
      rings.appendChild(ring);
    }
    rings.setAttribute('aria-hidden', 'true');
    stage.appendChild(rings);

    var capsule = el('div', 'capsule');
    var capTop = el('div', 'capsule-half capsule-half--top');
    var capBot = el('div', 'capsule-half capsule-half--bottom');
    var imgTop = el('img'), imgBot = el('img');
    imgTop.alt = 'Dindise'; imgBot.alt = '';
    capTop.appendChild(imgTop); capBot.appendChild(imgBot);
    capsule.appendChild(capTop); capsule.appendChild(capBot);
    stage.appendChild(capsule);

    var eclats = el('div', 'eclats');   // les morceaux qui volent a l'ouverture
    eclats.setAttribute('aria-hidden', 'true');
    stage.appendChild(eclats);

    var prize = el('img', 'prize');
    prize.alt = '';
    prize.width = 400; prize.height = 400;
    stage.appendChild(prize);

    shop.appendChild(stage);

    // ---- Le nom du lot, frappe lettre par lettre ----
    var nomWrap = el('div', 'prize-bloc');
    var prizeName = el('p', 'prize-name');
    prizeName.setAttribute('aria-live', 'polite');
    var prizeTag = el('span', 'prize-rarete');
    nomWrap.appendChild(prizeName);
    nomWrap.appendChild(prizeTag);
    shop.appendChild(nomWrap);

    // ---- Le choix des quatre Dindises ----
    var choix = el('div', 'shop-choix');
    shop.appendChild(choix);

    var after = el('div', 'shop-after');
    var againBtn = el('button', 'shop-btn shop-btn--wide', 'Encore');
    againBtn.type = 'button';
    var seeBtn = el('a', 'shop-btn shop-btn--wide', 'Ma collection');
    seeBtn.href = '#dinders';
    after.appendChild(againBtn);
    after.appendChild(seeBtn);
    shop.appendChild(after);

    view.appendChild(shop);

    // Une ouverture enchaine plusieurs minuteurs : on les garde pour
    // pouvoir tout annuler si le joueur relance avant la fin.
    var minuteur = [];
    function plusTard(fn, ms) { minuteur.push(setTimeout(fn, ms)); }
    function toutAnnuler() { minuteur.forEach(clearTimeout); minuteur = []; }

    function refreshStatus() {
      var got = DP.owned().length, all = DP.DINDERS.length;
      status.textContent = (DP.complete() ? 'Collection complète — ' : 'Collection : ')
                         + got + ' / ' + all;
      shop.classList.toggle('is-complete', DP.complete());
    }

    // ---- Les quatre capsules a choisir ----
    function construireChoix() {
      choix.textContent = '';
      DP.DINDISES.forEach(function (d) {
        var etat = DP.dindiseEtat(d);

        var btn = el('button', 'dindise');
        btn.type = 'button';
        btn.dataset.dindise = d.id;                    // 'universel', 'temporel'...
        btn.dataset.rarity = DP.rarityKey(d.rarete);   // la couleur associee
        btn.disabled = !etat.ouvrable;
        btn.setAttribute('aria-label', d.nom);

        var bulle = el('span', 'dindise-bulle');
        var img = el('img', 'dindise-img');
        img.src = d.img; img.alt = '';
        bulle.appendChild(img);
        btn.appendChild(bulle);

        btn.appendChild(el('span', 'dindise-nom', d.rarete));

        var prix = el('span', 'dindise-prix' + (etat.offerte ? ' is-offerte' : ''));
        if (etat.offerte) {
          // La toute premiere : on ne montre pas de prix, on l'annonce.
          prix.appendChild(el('strong', null, 'OFFERTE'));
        } else {
          var carte = el('img', 'dindise-carte');
          carte.src = DP.creditImg(d.credit); carte.alt = '';
          prix.appendChild(carte);
          prix.appendChild(el('strong', null, '× ' + DP.PRICE[d.credit]));
        }
        btn.appendChild(prix);

        btn.appendChild(el('span', 'dindise-reste',
          etat.ouvrable ? etat.reste + ' à trouver' : etat.raison));

        btn.addEventListener('click', function () { ouvrir(d); });
        choix.appendChild(btn);
      });
    }

    // ---- L'ouverture ----

    // Une gerbe d'eclats : chacun part dans sa direction, a sa vitesse.
    function semerEclats() {
      eclats.textContent = '';
      for (var i = 0; i < 20; i++) {
        var e = el('span', 'eclat');
        e.style.setProperty('--a', (i * 18 + Math.random() * 12 - 6) + 'deg');
        e.style.setProperty('--d', (120 + Math.random() * 150) + '%');
        e.style.setProperty('--t', Math.round(Math.random() * 120) + 'ms');
        e.style.setProperty('--s', (0.5 + Math.random()).toFixed(2));
        eclats.appendChild(e);
      }
    }

    function ouvrir(d) {
      if (shop.dataset.state !== 'idle') return;
      var etatOuv = DP.dindiseEtat(d);
      if (!etatOuv.ouvrable) return;
      if (etatOuv.offerte) DP.consommerDindiseOfferte();
      else if (!DP.spend(d.credit)) return;
      majSolde();

      var gagne = DP.draw(d.rarete);
      if (!gagne) return;

      imgTop.src = d.img;
      imgBot.src = d.img;
      shop.dataset.rarity = DP.rarityKey(d.rarete);
      status.textContent = d.nom + '…';

      shop.dataset.state = 'charge';
      plusTard(function () {
        semerEclats();
        shop.dataset.state = 'crack';
        plusTard(function () { reveler(gagne); }, reduce ? 0 : CRACK);
      }, reduce ? 0 : CHARGE);
    }

    // Le nom s'inscrit lettre par lettre, comme sur une machine a ecrire.
    function frapper(texte, cible, fini) {
      cible.textContent = '';
      if (reduce) { cible.textContent = texte; if (fini) fini(); return; }
      var i = 0;
      (function suite() {
        cible.textContent = texte.slice(0, ++i);
        if (i < texte.length) plusTard(suite, 45);
        else if (fini) fini();
      })();
    }

    function reveler(d) {
      prize.src = DP.dinderImg(d.id);
      prize.alt = d.name;
      DP.collect(d.id);
      DP.markNew(d.id);
      shop.dataset.state = 'revealed';
      refreshStatus();

      prizeTag.textContent = d.rarity;
      prizeTag.dataset.rarity = DP.rarityKey(d.rarity);
      prizeTag.classList.remove('is-in');

      var texte = d.form ? d.name + ' — ' + d.form : d.name;
      plusTard(function () {
        frapper(texte, prizeName, function () { prizeTag.classList.add('is-in'); });
      }, 420);
    }

    againBtn.addEventListener('click', function () {
      toutAnnuler();
      prize.removeAttribute('src');
      prizeName.textContent = '';
      prizeTag.textContent = '';
      prizeTag.classList.remove('is-in');
      eclats.textContent = '';
      shop.removeAttribute('data-rarity');
      shop.dataset.state = 'idle';
      construireChoix();
      refreshStatus();
    });

    construireChoix();
    refreshStatus();
  }

  // ==========================================================
  //  Parametres : le compte, la progression, la remise a zero
  // ==========================================================

  // Vrai juste apres une bascule des credits : la ligne s'anime au redessin.
  var basculeCredits = false;
  // Les noms des collections tout juste videes, montres une fois.
  var videesRecentes = null;

  function viewSettings(view) {
    var wrap = el('div', 'settings');

    function row(cls, label, value, sub) {
      var s = el('section', 'setting' + (cls ? ' ' + cls : ''));
      s.appendChild(el('span', 'setting-label', label));
      s.appendChild(el('strong', 'setting-value', value));
      s.appendChild(el('span', 'setting-sub', sub));
      var actions = el('span', 'setting-actions');
      s.appendChild(actions);
      wrap.appendChild(s);
      return actions;
    }

    var me = DP.currentProfile(), all = DP.profiles();

    var a1 = row('setting--account', 'Compte', me.name,
                 all.length > 1 ? all.length + ' comptes sur cet appareil'
                                : 'Seul compte sur cet appareil');
    var signIn = el('button', 'set-btn', 'Se connecter');
    signIn.type = 'button';
    signIn.disabled = all.length < 2;
    var signUp = el('button', 'set-btn set-btn--key', 'Créer un compte');
    signUp.type = 'button';
    a1.appendChild(signIn); a1.appendChild(signUp);

    var a2 = row('', 'Progression', me.owned + ' / ' + DP.DINDERS.length + ' Dinders',
                 'Sauvegardée sur ce compte');
    var see = el('a', 'set-btn', 'Ma collection');
    see.href = '#dinders';
    a2.appendChild(see);

    // Credits infinis ou normaux : le solde normal est mis de cote au
    // passage a l'infini, et rendu tel quel au retour.
    function solde(c) {
      return ['green', 'blue', 'gold', 'pink'].map(function (k) {
        return (c && c[k] || 0) + ' ' + { green: 'U', blue: 'M', gold: 'O', pink: 'T' }[k];
      }).join(' · ');
    }
    var inf = DP.illimite();
    var mis = DP.creditsMisDeCote();
    var actuel = {};
    DP.ORDER.forEach(function (k) { actuel[k] = DP.creditPurse(k); });
    var aC = row('setting--credits' + (basculeCredits ? ' is-bascule' : ''), 'Crédits',
                 inf ? 'Infinis ∞' : 'Normaux',
                 inf ? (mis ? 'Solde mis de côté : ' + solde(mis) : 'Les achats ne retirent rien')
                     : 'Solde : ' + solde(actuel));
    basculeCredits = false;
    var bascule = el('button', 'set-btn' + (inf ? '' : ' set-btn--key'),
                     inf ? 'Revenir aux crédits normaux' : 'Revenir aux crédits infinis');
    bascule.type = 'button';
    bascule.dataset.credits = inf ? 'normaux' : 'infinis';
    bascule.addEventListener('click', function () {
      DP.passerIllimite(!DP.illimite());
      basculeCredits = true;
      window.ROUTER.reload();
    });
    aC.appendChild(bascule);

    var a3 = row(videesRecentes ? 'is-vide-anim' : '', 'Recommencer', 'Vider des collections',
                 videesRecentes ? 'Vidé : ' + videesRecentes : 'Tout, ou seulement ce que tu choisis');
    videesRecentes = null;
    var resetBtn = el('button', 'set-btn set-btn--danger', 'Réinitialiser');
    resetBtn.type = 'button';
    a3.appendChild(resetBtn);

    view.appendChild(wrap);

    // ---------- Le panneau qui se leve par-dessus l'ecran ----------

    var sheet = el('div', 'sheet');
    sheet.hidden = true;
    var inner = el('div', 'sheet-inner');
    var title = el('h2', 'sheet-title');
    var body  = el('div', 'sheet-body');
    var error = el('p', 'sheet-error', ' ');
    error.setAttribute('role', 'alert');
    var foot  = el('div', 'sheet-foot');
    var cancel = el('button', 'set-btn', 'Annuler'); cancel.type = 'button';
    var ok     = el('button', 'set-btn set-btn--key', 'Valider'); ok.type = 'button';
    foot.appendChild(cancel); foot.appendChild(ok);
    inner.appendChild(title); inner.appendChild(body);
    inner.appendChild(error); inner.appendChild(foot);
    sheet.appendChild(inner);
    view.appendChild(sheet);

    var onValidate = null;

    function open(text, build, validate) {
      title.textContent = text;
      body.textContent = '';
      error.textContent = ' ';
      build();
      onValidate = validate;
      sheet.hidden = false;
      requestAnimationFrame(function () {
        sheet.classList.add('is-open');
        var first = body.querySelector('input, button');
        if (first) first.focus();
      });
    }

    function close() {
      sheet.classList.remove('is-open');
      onValidate = null;
      setTimeout(function () { sheet.hidden = true; }, 220);
    }

    function redraw() { window.ROUTER.reload(); }

    ok.addEventListener('click', function () { if (onValidate) onValidate(); });
    cancel.addEventListener('click', close);

    signUp.addEventListener('click', function () {
      var input;
      open('Créer un compte', function () {
        var label = el('label', 'sheet-field', 'Nom du compte');
        input = el('input');
        input.type = 'text'; input.maxLength = 18;
        input.placeholder = 'Ton pseudo'; input.autocomplete = 'off';
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); go(); }
        });
        label.appendChild(input);
        body.appendChild(label);
        body.appendChild(el('p', 'sheet-note',
          'Ce compte vit dans ce navigateur. Sa collection lui est propre.'));
      }, go);

      function go() {
        var res = DP.createProfile(input.value);
        if (!res.ok) { error.textContent = res.error; return; }
        close(); redraw();
      }
    });

    signIn.addEventListener('click', function () {
      var current = DP.currentProfile().id, chosen = current;
      open('Se connecter', function () {
        var list = el('div', 'sheet-list');
        DP.profiles().forEach(function (p) {
          var r = el('button', 'sheet-row' + (p.id === current ? ' is-current' : ''));
          r.type = 'button';
          r.dataset.id = p.id;
          r.appendChild(el('strong', null, p.name));
          r.appendChild(el('span', null, p.owned + ' / ' + DP.DINDERS.length +
                           (p.id === current ? '  •  connecté' : '')));
          r.addEventListener('click', function () {
            chosen = p.id;
            list.querySelectorAll('.sheet-row').forEach(function (x) {
              x.classList.toggle('is-picked', x.dataset.id === chosen);
            });
          });
          list.appendChild(r);
        });
        body.appendChild(list);
      }, function () { DP.switchProfile(chosen); close(); redraw(); });
    });

    // Vider tout, ou seulement certaines collections : on coche.
    resetBtn.addEventListener('click', function () {
      var cases = [], tout;
      open('Réinitialiser', function () {
        body.appendChild(el('p', 'sheet-note sheet-note--top',
          'Que veux-tu vider sur « ' + me.name + ' » ?'));
        var liste = el('div', 'sheet-choix');

        function ligne(id, nom, det, cls) {
          var l = el('label', 'sheet-choix-ligne' + (cls ? ' ' + cls : ''));
          var c = el('input');
          c.type = 'checkbox';
          c.value = id;
          l.appendChild(c);
          var t = el('span', 'sheet-choix-txt');
          t.appendChild(el('strong', null, nom));
          if (det) t.appendChild(el('span', 'sheet-choix-det', det));
          l.appendChild(t);
          liste.appendChild(l);
          return c;
        }

        tout = ligne('tout', 'Tout', 'Toutes les collections d’un coup', 'is-tout');
        DP.PARTIES.forEach(function (x) { cases.push(ligne(x.id, x.nom, x.det)); });

        // "Tout" coche ou decoche le reste ; le reste tient "Tout" a jour.
        tout.addEventListener('change', function () {
          cases.forEach(function (c) { c.checked = tout.checked; });
          error.textContent = ' ';
        });
        cases.forEach(function (c) {
          c.addEventListener('change', function () {
            tout.checked = cases.every(function (x) { return x.checked; });
            error.textContent = ' ';
          });
        });
        body.appendChild(liste);
        body.appendChild(el('p', 'sheet-note sheet-note--warn',
          'Le compte reste en place. C’est définitif.'));
      }, function () {
        var ids = cases.filter(function (c) { return c.checked; })
                       .map(function (c) { return c.value; });
        if (!ids.length) { error.textContent = 'Coche au moins une collection.'; return; }
        DP.viderParties(ids);
        videesRecentes = ids.length === DP.PARTIES.length ? 'tout'
          : DP.PARTIES.filter(function (x) { return ids.indexOf(x.id) !== -1; })
              .map(function (x) { return x.nom; }).join(', ');
        close(); redraw();
      });
    });
  }

  // ==========================================================
  //  Items : l'inventaire
  // ==========================================================

  function viewItems(view) {
    // Deux onglets : les objets qu'on utilise, et les artefacts qu'on
    // collectionne.
    if (window.ARTEFACTS) {
      view.classList.add('view--items');
      window.ARTEFACTS.onglets(view, 'items');
    }
    var list = el('div', 'screen-scroll');

    var possedes = DP.items();
    possedes.forEach(function (it) {
      var row = el('a', 'slot slot--item');
      row.href = '#' + it.view;
      row.dataset.item = it.id;

      // Un item peut se montrer sous l'etat ou il est : la canne affiche
      // celle qui est montee, et le sous-titre la nomme.
      var img = el('img', 'slot-face');
      // Un item peint a la volee peut n'avoir encore aucune image : on
      // laisse alors la case vide plutot que de demander une adresse nulle.
      var face = it.visuel ? it.visuel() : it.img;
      if (face) img.src = face;
      img.alt = '';
      img.decoding = 'async';
      row.appendChild(img);

      var name = el('span', 'slot-name');
      name.appendChild(el('span', 'slot-name-main', it.name));
      name.appendChild(el('span', 'slot-name-sub', it.detail ? it.detail() : it.sub));
      row.appendChild(name);

      row.appendChild(el('span', 'slot-open', 'Ouvrir'));
      list.appendChild(row);
    });

    // Les emplacements encore vides, pour montrer qu'il y a de la place.
    for (var i = possedes.length; i < 6; i++) {
      var vide = el('div', 'slot slot--locked');
      var mark = el('span', 'slot-face slot-face--locked', '?');
      mark.setAttribute('aria-hidden', 'true');
      vide.appendChild(mark);
      var n = el('span', 'slot-name');
      n.appendChild(el('span', 'slot-name-main', '???'));
      vide.appendChild(n);
      list.appendChild(vide);
    }

    view.appendChild(list);
  }

  // ==========================================================
  //  DinderTracker : la carte du monde et ses balises
  // ==========================================================

  // Les phrases que SinAIster fait defiler pendant une faille.
  var SINAISTER = [
    'SinAIster a pris la main sur le réseau de balises.',
    'Vos relevés ne vous appartiennent plus.',
    'Chaque balise est désormais une paire d’yeux.',
    'PropAItious ne répond plus. Il ne répondra plus.',
    'Purgez-en une, il en restera sept.',
    'Je connais l’heure qu’il est chez vous.'
  ];

  // Un texte brouille : des caracteres remplaces au hasard.
  function brouiller(txt, force) {
    var sym = '#@%&$?!*_~ø¥§×';
    return txt.split('').map(function (c) {
      if (c === ' ' || Math.random() > force) return c;
      return sym[Math.floor(Math.random() * sym.length)];
    }).join('');
  }

  function viewTracker(view, arg) {
    view.classList.add('view--tracker');

    // La faille du jour : SinAIster remplace PropAItious sur toutes les
    // balises, et l'ecran clignote en rouge tant qu'on ne l'a pas purgee.
    // "#tracker/essai" en ouvre une a la demande, pour voir ce que ca donne
    // sans attendre le jour dit. Rien dans le pad n'y renvoie.
    var essai = arg === 'essai';
    var F = DP.faille();
    if (essai) {
      F = { active: true, cle: 'essai', reste: 86400000,
            jour: F.jour, prochaine: F.prochaine, prochainJour: F.prochainJour };
    }
    var etatF = DP.etatFaille(F.cle);
    var purgees = etatF.purges.slice();
    var enFaille = F.active && !etatF.contenue;
    var coups = {};                     // les coups portes sur chaque balise
    view.classList.toggle('view--faille', enFaille);

    var carte = el('div', 'tracker-map');
    var fond = el('img', 'tracker-img');
    fond.src = 'assets/items/worldmap.png';
    fond.alt = 'Carte du monde';
    carte.appendChild(fond);

    // Le panneau d'information, cache tant qu'on n'a clique nulle part.
    var fiche = el('div', 'spot-card');
    fiche.hidden = true;
    var fVille = el('strong', 'spot-ville');
    var fPays  = el('span', 'spot-pays');
    var fCont  = el('span', 'spot-cont');
    var fHeure = el('span', 'spot-heure', '--:--:--');
    var fDate  = el('span', 'spot-date');
    var fermer = el('button', 'spot-fermer', '×');
    fermer.type = 'button';
    fermer.setAttribute('aria-label', 'Fermer');
    fiche.appendChild(fCont);
    fiche.appendChild(fVille);
    fiche.appendChild(fPays);
    fiche.appendChild(fHeure);
    fiche.appendChild(fDate);
    fiche.appendChild(fermer);

    // Le compte a rebours avant que les balises ne se deplacent.
    var rebours = el('p', 'tracker-rebours');

    // Le voile rouge qui bat une fois par seconde, et le bandeau d'alerte.
    var voile = el('div', 'faille-voile');
    voile.hidden = !enFaille;
    // Rien n'annonce la faille avant qu'elle n'arrive : le bandeau reste
    // vide tant qu'il n'y en a pas.
    var bandeau = el('div', 'faille-bandeau');
    bandeau.hidden = !F.active;
    var bTitre = el('strong', 'faille-titre', '');
    var bTexte = el('span', 'faille-texte', '');
    var bEtat = el('span', 'faille-etat', '');
    bandeau.appendChild(bTitre);
    bandeau.appendChild(bTexte);
    bandeau.appendChild(bEtat);

    var actif = null;          // le lieu ouvert dans le panneau
    var horloge = null;        // l'intervalle qui fait avancer l'heure

    function stopHorloge() {
      if (horloge) { clearInterval(horloge); horloge = null; }
    }

    function afficher(spot, pin) {
      actif = spot;
      carte.querySelectorAll('.pin').forEach(function (p) {
        p.classList.toggle('is-actif', p === pin);
      });
      var pirate = enFaille && purgees.indexOf(spot.id) === -1;
      fiche.classList.toggle('is-pirate', pirate);
      fCont.textContent  = spot.continent;
      fVille.textContent = pirate ? brouiller(spot.ville, 0.5) : spot.ville;
      fPays.textContent  = pirate ? brouiller(spot.pays, 0.35) : spot.pays;
      fHeure.textContent = pirate ? brouiller(DP.heureLocale(spot.tz), 0.6) : DP.heureLocale(spot.tz);
      fDate.textContent  = pirate ? 'RELEVÉ CORROMPU — SinAIster' : DP.dateLocale(spot.tz);
      fiche.hidden = false;

      stopHorloge();
      horloge = setInterval(function () {
        if (!document.body.contains(fiche)) { stopHorloge(); return; }
        var pir = enFaille && purgees.indexOf(spot.id) === -1;
        fHeure.textContent = pir ? brouiller(DP.heureLocale(spot.tz), 0.6) : DP.heureLocale(spot.tz);
        if (pir) fVille.textContent = brouiller(spot.ville, 0.5);
      }, 1000);
    }

    function cacher() {
      actif = null;
      fiche.hidden = true;
      stopHorloge();
      carte.querySelectorAll('.pin').forEach(function (p) {
        p.classList.remove('is-actif');
      });
    }

    fermer.addEventListener('click', cacher);

    // Pose les balises du moment. Rappelee a chaque heure pleine.
    // Pose une balise sur la carte. "pirate" force SinAIster dessus :
    // c'est ainsi qu'il rebondit ailleurs quand on le chasse d'un point.
    function poserBalise(s, force) {
        var pin = el('button', 'pin');
        pin.type = 'button';
        pin.dataset.spot = s.id;
        pin.dataset.ville = s.ville;

        // Anadyr ou Utqiagvik frolent le bord de la carte : on rentre la
        // balise de quelques pixels pour qu'elle reste entiere.
        var x = Math.min(95, Math.max(5, s.x));
        var y = Math.min(95.5, Math.max(4.5, s.y));
        pin.style.setProperty('--x', x + '%');
        pin.style.setProperty('--y', y + '%');
        pin.setAttribute('aria-label', s.continent + ' : ' + s.ville + ', ' + s.pays);

        if (y > 55) pin.classList.add('pin--haut');          // nom au-dessus
        if (x > 82) pin.classList.add('pin--nom-gauche');    // nom vers l'interieur
        else if (x < 18) pin.classList.add('pin--nom-droite');

        pin.appendChild(el('span', 'pin-onde'));
        var chip = el('img', 'pin-chip');
        var pirate = force || (enFaille && purgees.indexOf(s.id) === -1);
        chip.src = pirate ? 'assets/items/sinaister.webp' : 'assets/items/propaitious.webp';
        chip.alt = '';
        pin.classList.toggle('is-pirate', pirate);
        pin.appendChild(chip);
        pin.appendChild(el('span', 'pin-nom', pirate ? brouiller(s.ville, 0.4) : s.ville));

        pin.addEventListener('click', function () {
          if (enFaille && pin.classList.contains('is-pirate')) return frapper(s, pin, chip);
          if (actif && actif.id === s.id) cacher(); else afficher(s, pin);
        });
        carte.appendChild(pin);
        return pin;
    }

    function poser() {
      carte.querySelectorAll('.pin').forEach(function (p) { p.remove(); });
      DP.spots().forEach(function (s) { poserBalise(s, false); });
      relais.forEach(function (s) {
        if (purgees.indexOf(s.id) === -1) poserBalise(s, true).classList.add('is-relais');
      });

      // Si le panneau etait ouvert, il suit le nouveau lieu du continent.
      if (actif) {
        var suite = DP.spots().filter(function (s) { return s.id === actif.id; })[0];
        var pin = carte.querySelector('[data-spot="' + actif.id + '"]');
        if (suite && pin) afficher(suite, pin); else cacher();
      }
    }

    // Purger une balise : trois coups. Au troisieme, SinAIster lache
    // prise et PropAItious revient.
    var COUPS = 3;
    var RELAIS_MAX = 5;                 // combien de balises il peut encore poser
    var relais = [];                    // celles qu'il a posees pendant la purge

    // Purger n'est pas gagner : SinAIster saute souvent sur une autre
    // balise, ailleurs sur la carte. Il n'en pose qu'un nombre limite,
    // sinon on n'en verrait jamais le bout.
    function relancerAilleurs(depuis) {
      if (relais.length >= RELAIS_MAX || Math.random() > 0.55) return null;
      var villes = [];
      DP.CONTINENTS.forEach(function (c) {
        c.lieux.forEach(function (l) { villes.push({ c: c, l: l }); });
      });
      var libres = villes.filter(function (v) {
        return !carte.querySelector('[data-ville="' + v.l.ville + '"]') &&
               v.l.ville !== depuis.ville;
      });
      if (!libres.length) return null;
      var v = libres[Math.floor(Math.random() * libres.length)];
      var s = {
        id: 'relais-' + relais.length, continent: v.c.nom,
        ville: v.l.ville, pays: v.l.pays, tz: v.l.tz,
        x: (v.l.lon + 180) / 360 * 100, y: (90 - v.l.lat) / 180 * 100
      };
      relais.push(s);
      var pin = poserBalise(s, true);
      pin.classList.add('is-relais');
      bTexte.textContent = 'SinAIster a sauté sur ' + s.ville + '.';
      return s;
    }

    // Reste-t-il une balise sous SinAIster ?
    function resteDesPirates() {
      return !!carte.querySelector('.pin.is-pirate');
    }

    function frapper(s, pin, chip) {
      coups[s.id] = (coups[s.id] || 0) + 1;
      pin.classList.remove('is-frappee');
      void pin.offsetWidth;
      pin.classList.add('is-frappee');
      if (COUPS - coups[s.id] > 0) {
        bEtat.textContent = 'Purge de ' + s.ville + ' : ' + coups[s.id] + ' / ' + COUPS;
        return;
      }
      purgees.push(s.id);
      if (s.id.indexOf('relais-') !== 0) DP.purgerBalise(F.cle, s.id);
      pin.classList.remove('is-pirate');
      pin.classList.add('is-purgee');
      chip.src = 'assets/items/propaitious.webp';
      pin.querySelector('.pin-nom').textContent = s.ville;
      // Il se déplace : une autre balise tombe souvent juste apres.
      relancerAilleurs(s);
      if (!resteDesPirates()) contenir();
      else majBandeau();
    }

    // Toutes les balises rendues : la faille est contenue, et elle paie.
    function contenir() {
      enFaille = false;
      view.classList.remove('view--faille');
      voile.hidden = true;
      var neuf = DP.contenirFaille(F.cle);
      if (neuf) { DP.earn('gold', 3); DP.earn('pink', 1); }
      majBandeau();
      var fete = el('div', 'faille-fete');
      fete.appendChild(el('strong', 'faille-fete-titre', 'FAILLE CONTENUE'));
      fete.appendChild(el('span', 'faille-fete-txt',
        'Toutes les balises sont rendues au réseau. SinAIster décroche.'));
      if (neuf) {
        fete.appendChild(el('span', 'faille-fete-prime',
          '+3 Crédits Omniversels  ·  +1 Crédit Temporel'));
      }
      carte.appendChild(fete);
      setTimeout(function () { fete.classList.add('is-sortie'); }, 2600);
      setTimeout(function () { if (fete.parentNode) fete.remove(); }, 3100);
    }

    function majBandeau() {
      if (!F.active) {
        bandeau.hidden = true;
        bTitre.textContent = bTexte.textContent = bEtat.textContent = '';
        return;
      }
      bandeau.hidden = false;
      var contenue = DP.etatFaille(F.cle).contenue;
      bandeau.classList.toggle('is-contenue', contenue);
      bTitre.textContent = contenue ? '✓  FAILLE CONTENUE' : '⚠  FAILLE DE SÉCURITÉ  ⚠';
      if (!contenue && !bTexte.textContent) bTexte.textContent = SINAISTER[0];
      if (contenue) {
        bTexte.textContent = 'Le réseau de balises est propre. SinAIster a décroché.';
        bEtat.textContent = 'Les relevés sont de nouveau fiables.';
        return;
      }
      var reste = DP.faille().reste;
      var pirates = carte.querySelectorAll('.pin.is-pirate').length;
      bEtat.textContent = 'Balises purgées ' + purgees.length + '  ·  ' + pirates +
        ' encore sous SinAIster  ·  fin dans ' +
        Math.floor(reste / 3600000) + ' h ' + Math.floor(reste % 3600000 / 60000) + ' min';
    }

    function tictac() {
      var reste = DP.prochainSaut();
      var m = Math.floor(reste / 60000), sec = Math.floor(reste % 60000 / 1000);
      rebours.textContent = 'Prochain relevé dans ' + m + ' min ' +
                            String(sec).padStart(2, '0') + ' s';
      if (reste <= 1000) setTimeout(poser, 1100);

      // La faille commence ou s'acheve pendant qu'on regarde : on redessine.
      var f2 = essai ? F : DP.faille();
      if (f2.cle !== F.cle || f2.active !== F.active) {
        if (window.ROUTER) window.ROUTER.reload();
        return;
      }
      if (enFaille) {
        bTexte.textContent = SINAISTER[Math.floor(DP.maintenant() / 4000) % SINAISTER.length];
      }
      majBandeau();
    }

    carte.appendChild(voile);
    carte.appendChild(fiche);
    view.appendChild(carte);
    view.appendChild(bandeau);
    view.appendChild(rebours);

    poser();
    majBandeau();
    tictac();
    var battement = setInterval(function () {
      if (!document.body.contains(carte)) {
        clearInterval(battement);
        stopHorloge();
        return;
      }
      tictac();
    }, 1000);
  }

  // ==========================================================
  //  Les rubriques pas encore construites
  // ==========================================================

  function soon(label) {
    return function (view) {
      var box = el('div', 'soon');
      box.appendChild(el('h2', 'soon-title', label));
      box.appendChild(el('p', 'soon-text', 'Cette rubrique est en chantier.'));
      view.appendChild(box);
    };
  }

  window.VIEWS = {
    'dinders':     { title: 'Dinders',     render: viewDinders },
    'dinder':      { title: 'Dinder',      render: viewDinder },
    'credits':     { title: 'Crédits', render: viewCredits },
    'win-dinders': { title: 'Win Dinders', render: viewWinDinders },
    'settings':    { title: 'Paramètres', render: viewSettings },
    'items':       { title: 'Items',       render: viewItems },
    'tracker':     { title: 'DinderTracker', render: viewTracker },
    'codanex':     { title: 'Codanex',     render: soon('Codanex') },
    'quests':      { title: 'Quests',      render: soon('Quests') },
    'badges':      { title: 'Badges',      render: soon('Badges') }
  };
})();
