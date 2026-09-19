// Remplit le bandeau du haut avec le nombre de credits possedes.
(function () {
  function render() {
    document.querySelectorAll('.credit-tally .tally').forEach(function (box) {
      var n = window.DP.creditCount(box.dataset.credit);
      box.querySelector('.tally-count').textContent = n === Infinity ? '∞' : n;
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
