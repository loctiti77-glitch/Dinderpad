// Construit les 30 cases de la collection a partir de ce que l'on possede.
// Une case verrouillee reste muette : ni portrait, ni nom, juste un "?".
(function () {
  var DP = window.DP;

  function slotNode(index) {
    var n = String(index + 1).padStart(2, '0');
    var d = DP.DINDERS[index];               // undefined au-dela du roster
    var got = d && DP.has(d.id);

    var el = document.createElement(got ? 'a' : 'div');
    el.className = 'slot' + (got ? '' : ' slot--locked');
    el.dataset.slot = n;
    if (got) { el.href = '#'; el.dataset.dinder = d.id; }

    if (got) {
      var img = document.createElement('img');
      img.className = 'slot-face';
      img.src = DP.dinderImg(d.id);
      img.alt = '';
      img.width = 400; img.height = 400;
      img.loading = 'lazy'; img.decoding = 'async';
      el.appendChild(img);
    } else {
      var mark = document.createElement('span');
      mark.className = 'slot-face slot-face--locked';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = '?';
      el.appendChild(mark);
    }

    var name = document.createElement('span');
    name.className = 'slot-name';
    var main = document.createElement('span');
    main.className = 'slot-name-main';
    main.textContent = got ? d.name : '???';
    name.appendChild(main);
    if (got && d.form) {
      var sub = document.createElement('span');
      sub.className = 'slot-name-sub';
      sub.textContent = d.form;
      name.appendChild(sub);
    }
    el.appendChild(name);
    return el;
  }

  function render() {
    var list = document.getElementById('screenScroll');
    if (!list || !DP) return;

    list.textContent = '';
    for (var i = 0; i < DP.SLOTS; i++) list.appendChild(slotNode(i));

    // Compteur de progression affiche sous l'ecran.
    var tally = document.getElementById('collectionCount');
    if (tally) tally.textContent = DP.owned().length + ' / ' + DP.DINDERS.length;

    // Le Dinder tout juste sorti d'une Dindise se signale, puis on l'amene
    // sous les yeux du joueur.
    var fresh = DP.takeNew();
    if (!fresh) return;
    var target = list.querySelector('[data-dinder="' + fresh + '"]');
    if (!target) return;
    target.classList.add('slot--fresh');
    requestAnimationFrame(function () {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    setTimeout(function () { target.classList.remove('slot--fresh'); }, 2600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
