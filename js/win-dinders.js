// Boutique de Dindises : on paie avec une des quatre monnaies, la capsule
// s'ouvre, et le Dinder rejoint la collection.
(function () {
  var DP = window.DP;

  var shop, status, capsule, prizeImg, prizeName, pay, after;

  // Duree des etapes, en ms. Doit suivre les animations de style.css.
  var SHAKE = 1100;   // la capsule tremble et monte en puissance
  var CRACK = 700;    // les deux moities s'ecartent
  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function state(s) { shop.dataset.state = s; }

  // ---------- Les boutons de paiement ----------

  function buildPay() {
    pay.textContent = '';
    DP.ORDER.forEach(function (key) {
      var c = DP.CREDITS[key];
      var n = DP.PRICE[key];

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-btn';
      btn.dataset.credit = key;
      btn.disabled = !DP.canAfford(key) || DP.complete();

      var img = document.createElement('img');
      img.className = 'shop-btn-card';
      img.src = DP.creditImg(key);
      img.alt = '';
      btn.appendChild(img);

      var txt = document.createElement('span');
      txt.className = 'shop-btn-text';

      var price = document.createElement('strong');
      price.className = 'shop-btn-price';
      price.textContent = '× ' + n;
      txt.appendChild(price);

      var label = document.createElement('span');
      label.className = 'shop-btn-label';
      // "Credit Universel" -> "Universel", le mot "Credit" est deja implicite.
      label.textContent = c.name.replace(/^Crédit\s+/, '');
      txt.appendChild(label);

      btn.appendChild(txt);
      btn.addEventListener('click', function () { buy(key); });
      pay.appendChild(btn);
    });
  }

  // ---------- Le cycle d'achat ----------

  function buy(key) {
    if (shop.dataset.state !== 'idle') return;      // une ouverture en cours
    if (DP.complete()) return;
    if (!DP.spend(key)) return;

    var prize = DP.draw();
    if (!prize) return;

    status.textContent = 'Dindise en cours d’ouverture…';
    state('opening');

    var wait = reduce ? 0 : SHAKE;
    setTimeout(function () {
      state('cracking');
      setTimeout(function () { reveal(prize); }, reduce ? 0 : CRACK);
    }, wait);
  }

  function reveal(d) {
    prizeImg.src = DP.dinderImg(d.id);
    prizeImg.alt = d.name;
    prizeName.textContent = d.form ? d.name + ' — ' + d.form : d.name;

    DP.collect(d.id);
    DP.markNew(d.id);

    state('revealed');
    refreshStatus();
  }

  function again() {
    prizeImg.removeAttribute('src');
    prizeName.textContent = '';
    state('idle');
    buildPay();
    refreshStatus();
  }

  function refreshStatus() {
    var got = DP.owned().length, all = DP.DINDERS.length;
    if (DP.complete()) {
      status.textContent = 'Collection complète — ' + got + ' / ' + all;
      shop.classList.add('is-complete');
    } else {
      status.textContent = 'Collection : ' + got + ' / ' + all;
      shop.classList.remove('is-complete');
    }
  }

  // ---------- Demarrage ----------

  function init() {
    shop      = document.getElementById('shop');
    status    = document.getElementById('shopStatus');
    capsule   = document.getElementById('capsule');
    prizeImg  = document.getElementById('prizeImg');
    prizeName = document.getElementById('prizeName');
    pay       = document.getElementById('shopPay');
    after     = document.getElementById('shopAfter');
    if (!shop || !DP) return;

    document.getElementById('againBtn').addEventListener('click', again);
    buildPay();
    refreshStatus();
    state('idle');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
