// L'ecran-titre commun aux mini-jeux.
//
// Chaque jeu s'ouvre sur sa jaquette : l'illustration monte en place, le
// texte de presentation s'ecrit ligne apres ligne, puis le bouton de
// depart apparait. Un clic ou une touche passe l'intro d'un coup, pour
// ceux qui la connaissent deja.
(function () {

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cfg : { icone, lignes: [texte...], bouton, teinte, commencer: fn }
  // Rend un noeud a poser dans la vue, et rappelle "commencer" quand le
  // joueur lance la partie.
  function ecran(cfg) {
    var box = el('div', 'intro');
    if (cfg.teinte) box.style.setProperty('--t', cfg.teinte);

    var halo = el('div', 'intro-halo');
    halo.setAttribute('aria-hidden', 'true');
    box.appendChild(halo);

    var jaquette = el('img', 'intro-jaquette');
    jaquette.src = cfg.icone;
    jaquette.alt = cfg.titre || '';
    box.appendChild(jaquette);

    var texte = el('div', 'intro-texte');
    (cfg.lignes || []).forEach(function (l, i) {
      var p = el('p', 'intro-ligne', l);
      p.style.setProperty('--i', i);
      texte.appendChild(p);
    });
    box.appendChild(texte);

    var go = el('button', 'intro-btn', cfg.bouton || 'COMMENCER');
    go.type = 'button';
    go.style.setProperty('--i', (cfg.lignes || []).length);
    box.appendChild(go);

    var parti = false;
    function partir() {
      if (parti) return;
      parti = true;
      retirer();
      cfg.commencer();
    }

    // Avant la fin de l'animation, un clic n'importe ou l'accelere ;
    // ensuite, il lance la partie.
    var fini = reduit;
    var t = setTimeout(function () { fini = true; }, reduit ? 0 : 1400);

    function auClavier(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (fini) partir(); else passer();
    }
    function auClic(e) {
      if (e.target === go) return;          // le bouton a son propre gestionnaire
      if (!fini) passer();
    }
    function passer() {
      fini = true;
      box.classList.add('is-vite');
    }
    function retirer() {
      clearTimeout(t);
      window.removeEventListener('keydown', auClavier);
      box.removeEventListener('click', auClic);
    }

    go.addEventListener('click', partir);
    box.addEventListener('click', auClic);
    window.addEventListener('keydown', auClavier);

    // Si la vue disparait avant que le joueur ait choisi, on retire les
    // ecoutes posees sur la fenetre.
    var veille = setInterval(function () {
      if (document.body.contains(box)) return;
      clearInterval(veille);
      retirer();
    }, 500);

    return box;
  }

  window.INTRO = { ecran: ecran };
})();
