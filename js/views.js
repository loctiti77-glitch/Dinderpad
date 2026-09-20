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

    var name = el('span', 'slot-name');
    name.appendChild(el('span', 'slot-name-main', got ? d.name : '???'));
    if (got && d.form) name.appendChild(el('span', 'slot-name-sub', d.form));
    node.appendChild(name);

    // La rarete, a droite. Seulement pour un Dinder obtenu : l'afficher
    // sur une case verrouillee revelerait ce qui s'y cache.
    if (got) {
      var tag = el('span', 'slot-rarity', d.rarity);
      tag.dataset.rarity = DP.rarityKey(d.rarity);
      node.appendChild(tag);
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
      txt.appendChild(el('span', 'credit-units', c.units + ' unités'));
      row.appendChild(txt);
      list.appendChild(row);
    });
    view.appendChild(list);
  }

  // ==========================================================
  //  Win Dinders : la boutique de Dindises
  // ==========================================================

  function viewWinDinders(view) {
    var SHAKE = 1100, CRACK = 700;
    var reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var shop = el('div', 'shop');
    shop.dataset.state = 'idle';

    var status = el('p', 'shop-status', ' ');
    shop.appendChild(status);

    var stage = el('div', 'capsule-stage');
    var burst = el('div', 'burst');
    burst.setAttribute('aria-hidden', 'true');
    stage.appendChild(burst);

    var capsule = el('div', 'capsule');
    ['top', 'bottom'].forEach(function (half) {
      var h = el('div', 'capsule-half capsule-half--' + half);
      var img = el('img');
      img.src = 'assets/dindise.webp';
      img.alt = half === 'top' ? 'Dindise' : '';
      h.appendChild(img);
      capsule.appendChild(h);
    });
    stage.appendChild(capsule);

    var prize = el('img', 'prize');
    prize.alt = '';
    prize.width = 400; prize.height = 400;
    stage.appendChild(prize);
    shop.appendChild(stage);

    var prizeName = el('p', 'prize-name');
    prizeName.setAttribute('aria-live', 'polite');
    shop.appendChild(prizeName);

    var pay = el('div', 'shop-pay');
    shop.appendChild(pay);

    var after = el('div', 'shop-after');
    var againBtn = el('button', 'shop-btn shop-btn--wide', 'Encore une');
    againBtn.type = 'button';
    after.appendChild(againBtn);
    var seeBtn = el('a', 'shop-btn shop-btn--wide', 'Ma collection');
    seeBtn.href = '#dinders';
    after.appendChild(seeBtn);
    shop.appendChild(after);

    view.appendChild(shop);

    function refreshStatus() {
      var got = DP.owned().length, all = DP.DINDERS.length;
      status.textContent = (DP.complete() ? 'Collection complète — ' : 'Collection : ') +
                           got + ' / ' + all;
      shop.classList.toggle('is-complete', DP.complete());
    }

    function buildPay() {
      pay.textContent = '';
      DP.ORDER.forEach(function (key) {
        var btn = el('button', 'shop-btn');
        btn.type = 'button';
        btn.dataset.credit = key;
        btn.disabled = !DP.canAfford(key) || DP.complete();

        var img = el('img', 'shop-btn-card');
        img.src = DP.creditImg(key);
        img.alt = '';
        btn.appendChild(img);

        var txt = el('span', 'shop-btn-text');
        txt.appendChild(el('strong', 'shop-btn-price', '× ' + DP.PRICE[key]));
        txt.appendChild(el('span', 'shop-btn-label',
                           DP.CREDITS[key].name.replace(/^Crédit\s+/, '')));
        btn.appendChild(txt);

        btn.addEventListener('click', function () { buy(key); });
        pay.appendChild(btn);
      });
    }

    function buy(key) {
      if (shop.dataset.state !== 'idle' || DP.complete()) return;
      if (!DP.spend(key)) return;
      var won = DP.draw();
      if (!won) return;

      status.textContent = 'Dindise en cours d’ouverture…';
      shop.dataset.state = 'opening';

      setTimeout(function () {
        shop.dataset.state = 'cracking';
        setTimeout(function () { reveal(won); }, reduce ? 0 : CRACK);
      }, reduce ? 0 : SHAKE);
    }

    function reveal(d) {
      prize.src = DP.dinderImg(d.id);
      prize.alt = d.name;
      prizeName.textContent = d.form ? d.name + ' — ' + d.form : d.name;
      DP.collect(d.id);
      DP.markNew(d.id);
      shop.dataset.state = 'revealed';
      refreshStatus();
    }

    againBtn.addEventListener('click', function () {
      prize.removeAttribute('src');
      prizeName.textContent = '';
      shop.dataset.state = 'idle';
      buildPay();
      refreshStatus();
    });

    buildPay();
    refreshStatus();
  }

  // ==========================================================
  //  Parametres : le compte, la progression, la remise a zero
  // ==========================================================

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

    var a3 = row('', 'Recommencer', 'Vider la collection', 'Le compte est conservé');
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

    resetBtn.addEventListener('click', function () {
      open('Réinitialiser', function () {
        body.appendChild(el('p', 'sheet-note sheet-note--warn',
          'Les ' + me.owned + ' Dinders de « ' + me.name +
          ' » seront effacés. Le compte, lui, reste en place. C’est définitif.'));
      }, function () { DP.reset(); close(); redraw(); });
    });
  }

  // ==========================================================
  //  Items : l'inventaire
  // ==========================================================

  function viewItems(view) {
    var list = el('div', 'screen-scroll');

    DP.ITEMS.forEach(function (it) {
      var row = el('a', 'slot slot--item');
      row.href = '#' + it.view;
      row.dataset.item = it.id;

      var img = el('img', 'slot-face');
      img.src = it.img;
      img.alt = '';
      img.decoding = 'async';
      row.appendChild(img);

      var name = el('span', 'slot-name');
      name.appendChild(el('span', 'slot-name-main', it.name));
      name.appendChild(el('span', 'slot-name-sub', it.sub));
      row.appendChild(name);

      row.appendChild(el('span', 'slot-open', 'Ouvrir'));
      list.appendChild(row);
    });

    // Les emplacements encore vides, pour montrer qu'il y a de la place.
    for (var i = DP.ITEMS.length; i < 6; i++) {
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

  function viewTracker(view) {
    view.classList.add('view--tracker');

    var wrap = el('div', 'tracker');

    var carte = el('div', 'tracker-map');
    var fond = el('img', 'tracker-img');
    fond.src = 'assets/items/worldmap.png';
    fond.alt = 'Carte du monde';
    carte.appendChild(fond);

    DP.SPOTS.forEach(function (s) {
      var pin = el('button', 'pin');
      pin.type = 'button';
      pin.dataset.spot = s.id;
      pin.style.setProperty('--x', s.x + '%');
      pin.style.setProperty('--y', s.y + '%');
      pin.setAttribute('aria-label', s.nom);
      // Les balises du bas afficheraient leur nom hors cadre.
      if (s.y > 55) pin.classList.add('pin--haut');

      pin.appendChild(el('span', 'pin-onde'));
      var chip = el('img', 'pin-chip');
      chip.src = 'assets/items/propaitious.webp';
      chip.alt = '';
      pin.appendChild(chip);
      pin.appendChild(el('span', 'pin-nom', s.nom));

      carte.appendChild(pin);
    });

    wrap.appendChild(carte);
    view.appendChild(wrap);
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
