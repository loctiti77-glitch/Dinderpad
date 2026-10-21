// L'atelier de l'Odyssee : le sac, les grilles de fabrication, le livre
// de recettes et le four. Les donnees (objets, recettes, cuisson) sont
// dans js/odyssey-craft.js ; ici, seulement ce qu'on voit et ce qu'on
// touche.
//
// On joue comme dans Minecraft : toucher une case prend la pile en main,
// toucher une autre case l'y pose (ou echange). Clic droit, ou appui
// long au doigt : on prend la moitie de la pile, ou l'on n'en pose qu'un.
// Ce qu'on pose dans la grille, selon sa FORME, fait apparaitre un objet
// dans la case de droite : la toucher le fabrique.
//
// Dans le sac, la grille fait 2 x 2. A cote d'un etabli pose sur la
// carte, elle passe a 3 x 3. A cote d'un four, un onglet de plus : on y
// met ce qui doit cuire et du combustible, et le four travaille, meme
// quand on s'en va.
(function () {
  var CR = window.ODYCRAFT;
  if (!CR) return;

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  var objet = CR.objet, pile = CR.pile;

  // Les familles du livre, d'apres ce que la recette fabrique.
  var FAMILLES = [
    { cat: 'mat', nom: 'Pièces' }, { cat: 'bloc', nom: 'Stations' }, { cat: 'outil', nom: 'Outils' },
    { cat: 'conso', nom: 'Survie' }, { cat: 'repas', nom: 'Cuisine' }, { cat: 'equip', nom: 'Équipement' },
    { cat: 'sac', nom: 'Sacs' }
  ];

  // jeu : { scene, dire(txt), maj(), fermer(), utiliser(o) -> txt | false, poser(id) -> true | txt }
  // opts : { station: 'etabli' | 'four' | null, pose, astre, onglet }
  function ouvrir(jeu, opts) {
    var vieux = jeu.scene.querySelector('.ocr');
    if (vieux) vieux.remove();
    var s = CR.etat();
    var station = opts.station || null, pose = opts.pose || null;
    var N = station === 'etabli' ? 3 : 2;
    var grille = N === 3 ? s.grille3 : s.grille2;
    var fantome = null;          // la recette montree en transparence dans la grille

    var box = el('div', 'ocr');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', station === 'four' ? 'Four' : station === 'etabli' ? 'Établi' : 'Sac');
    var fen = el('div', 'ocr-fen');
    box.appendChild(fen);

    var tete = el('div', 'ocr-tete');
    var onglets = el('div', 'ocr-onglets');
    var ONGLETS = (station === 'four' ? [['four', 'Four']] : [])
      .concat([['sac', station === 'etabli' ? 'Établi' : 'Sac'], ['livre', 'Recettes'], ['equip', 'Équipement'], ['vitrine', 'Vitrine']]);
    var boutons = {};
    ONGLETS.forEach(function (o) {
      var b = el('button', 'ocr-onglet', o[1]);
      b.type = 'button';
      b.addEventListener('click', function () { montrer(o[0]); });
      boutons[o[0]] = b;
      onglets.appendChild(b);
    });
    tete.appendChild(onglets);
    var fermer = el('button', 'ocr-fermer', '×');
    fermer.type = 'button';
    fermer.setAttribute('aria-label', 'Fermer');
    fermer.addEventListener('click', clore);
    tete.appendChild(fermer);
    fen.appendChild(tete);

    var corps = el('div', 'ocr-corps');
    fen.appendChild(corps);
    var courant = opts.onglet || (station === 'four' ? 'four' : 'sac');

    // L'objet tenu, qui suit le pointeur.
    // La bulle : le nom et la description d'un objet, des qu'on le survole
    // (a la souris). Au doigt, il n'y a pas de survol : la zone "en main"
    // montre la description de ce qu'on a pris.
    var bulle = el('div', 'ocr-bulle');
    bulle.hidden = true;
    box.appendChild(bulle);
    function montrerBulle(noeud, c) {
      var o = c && objet(c.id);
      if (!o) return cacherBulle();
      bulle.textContent = '';
      var t = el('div', 'ocr-bulle-tete');
      t.appendChild(CR.imgIcone(c.id, 'ocr-bulle-ic'));
      var n = el('div');
      n.appendChild(el('strong', 'ocr-bulle-nom', o.nom + (c.n > 1 ? '  ×' + c.n : '')));
      n.appendChild(el('span', 'ocr-bulle-cat', CR.CATS[o.cat].nom + (o.monde ? ' · ' + CR.nomMonde(o.monde) : '')));
      t.appendChild(n);
      bulle.appendChild(t);
      bulle.appendChild(el('p', 'ocr-bulle-desc', o.desc));
      if (o.dur && c.u != null) bulle.appendChild(el('span', 'ocr-bulle-usure', 'Usure : ' + c.u + ' / ' + o.dur));
      if (CR.CUISSON[c.id]) bulle.appendChild(el('span', 'ocr-bulle-plus', 'Au four : ' + objet(CR.CUISSON[c.id]).nom.toLowerCase()));
      if (CR.COMBUSTIBLE[c.id]) bulle.appendChild(el('span', 'ocr-bulle-plus', 'Combustible : ' + CR.COMBUSTIBLE[c.id] + ' cuisson' + (CR.COMBUSTIBLE[c.id] > 1 ? 's' : '')));
      bulle.hidden = false;
      // A cote de la case, sans deborder de la fenetre.
      var r = box.getBoundingClientRect(), b = noeud.getBoundingClientRect();
      var x = b.right - r.left + 8, y = b.top - r.top;
      var l = bulle.offsetWidth, h = bulle.offsetHeight;
      if (x + l > r.width - 8) x = b.left - r.left - l - 8;
      if (x < 8) x = 8;
      if (y + h > r.height - 8) y = r.height - h - 8;
      bulle.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(Math.max(8, y)) + 'px)';
    }
    function cacherBulle() { bulle.hidden = true; }
    // Survoler une case, une icone : la bulle suit.
    function survol(noeud, fournir) {
      noeud.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') montrerBulle(noeud, fournir()); });
      noeud.addEventListener('pointerleave', cacherBulle);
    }

    var curseur = el('img', 'ocr-curseur');
    curseur.alt = '';
    box.appendChild(curseur);
    var pointeurVu = false;
    box.addEventListener('pointermove', function (e) {
      pointeurVu = true;
      curseur.hidden = !s.main;
      var r = box.getBoundingClientRect();
      curseur.style.transform = 'translate(' + (e.clientX - r.left + 6) + 'px,' + (e.clientY - r.top + 6) + 'px)';
    });
    function majCurseur() {
      curseur.hidden = !s.main || !pointeurVu;
      if (s.main) curseur.src = CR.url(s.main.id);
    }

    // ---------- Fermer : ce qui est en main et dans la grille rentre ----------
    function ranger() {
      if (s.main) {
        var m = s.main, mis = CR.ajouterDans(s.cases, m.id, m.n, m.u);
        m.n -= mis;
        if (m.n <= 0) s.main = null;
      }
      [s.grille2, s.grille3].forEach(function (g) {
        for (var i = 0; i < g.length; i++) {
          var c = g[i];
          if (!c) continue;
          var mis2 = CR.ajouterDans(s.cases, c.id, c.n, c.u);
          c.n -= mis2;
          if (c.n <= 0) g[i] = null;
        }
      });
      CR.sauver();
    }
    var minuteurFour = 0;
    function clore() {
      ranger();
      clearInterval(minuteurFour);
      box.classList.add('is-sortie');
      window.removeEventListener('keydown', clavier, true);
      window.removeEventListener('pointerup', finirGlisse);
      window.removeEventListener('pointercancel', finirGlisse);
      setTimeout(function () { box.remove(); }, reduit ? 0 : 200);
      if (jeu.fermer) jeu.fermer();
    }
    function clavier(e) {
      if (e.key === 'Escape' || e.key === 'i' || e.key === 'I' || e.key === 'Tab' || e.key === 'e' || e.key === 'E') {
        e.preventDefault(); e.stopPropagation(); clore();
      }
    }
    window.addEventListener('keydown', clavier, true);

    function montrer(o) {
      courant = o;
      cacherBulle();
      for (var k in boutons) boutons[k].classList.toggle('is-actif', k === o);
      var haut = corps.scrollTop;
      corps.textContent = '';
      if (o === 'sac') vueSac();
      else if (o === 'four') vueFour();
      else if (o === 'livre') vueLivre();
      else if (o === 'equip') vueEquip();
      else vueVitrine();
      corps.scrollTop = haut;
      majCurseur();
    }
    function redessiner() { CR.sauver(); montrer(courant); }

    // ==========================================================
    //  Les cases, et la main
    // ==========================================================
    // Une case : { get(), set(v), accepte(id), sortie } — "sortie" : on
    // ne peut qu'y prendre (le resultat du four).
    function caseSac(i) {
      return { get: function () { return s.cases[i] || null; }, set: function (v) { s.cases[i] = v; },
               accepte: function () { return true; } };
    }
    function caseGrille(i) {
      return { get: function () { return grille[i] || null; }, set: function (v) { grille[i] = v; fantome = null; },
               accepte: function () { return true; } };
    }

    function agir(cs, secondaire) {
      var c = cs.get(), m = s.main;
      if (cs.sortie) {
        // On ne fait qu'y prendre.
        if (!c) return;
        if (!m) { s.main = c; cs.set(null); }
        else if (m.id === c.id && m.u == null && m.n + c.n <= pile(c.id)) { m.n += c.n; cs.set(null); }
        return redessiner();
      }
      if (!m) {
        if (!c) return;
        if (secondaire && c.n > 1) {
          var moitie = Math.ceil(c.n / 2);
          s.main = { id: c.id, n: moitie };
          c.n -= moitie;
        } else { s.main = c; cs.set(null); }
        return redessiner();
      }
      if (!cs.accepte(m.id)) { jeu.dire && jeu.dire(objet(m.id).nom + ' ne va pas ici.'); return; }
      var P = pile(m.id);
      if (!c) {
        if (secondaire && m.n > 1) { cs.set({ id: m.id, n: 1 }); m.n--; }
        else { cs.set(m); s.main = null; }
      } else if (c.id === m.id && c.u == null && m.u == null && c.n < P) {
        var k = secondaire ? 1 : Math.min(P - c.n, m.n);
        c.n += k; m.n -= k;
        if (m.n <= 0) s.main = null;
      } else if (!secondaire) {
        cs.set(m); s.main = c;
      }
      redessiner();
    }

    // Le dessin d'une case : l'icone, le nombre, l'usure d'un outil, et
    // le fantome d'une recette quand la case est vide.
    function caseEl(cs, cls, fant) {
      var c = cs.get();
      var b = el('button', 'ocr-case ' + (cls || '') + (c ? '' : ' is-vide'));
      b.type = 'button';
      if (c) {
        var o = objet(c.id);
        b.appendChild(CR.imgIcone(c.id));
        if (c.n > 1) b.appendChild(el('span', 'ocr-n', String(c.n)));
        if (o && o.dur && c.u != null && c.u < o.dur) {
          var u = el('span', 'ocr-usure'), k = c.u / o.dur;
          var plein = el('i');
          plein.style.width = Math.round(k * 100) + '%';
          plein.style.background = k > 0.5 ? '#5ad06a' : k > 0.2 ? '#ffd23a' : '#ff5a4a';
          u.appendChild(plein);
          b.appendChild(u);
        }
        survol(b, function () { return cs.get(); });
      } else if (fant) {
        b.appendChild(CR.imgIcone(fant, 'ocr-ic ocr-fantome'));
      }
      b._cs = cs;
      // Clic : la pile ; clic droit ou appui long : la moitie, ou un seul.
      // Avec une pile en main, appuyer puis glisser sur plusieurs cases
      // la repartit entre elles (voir "Le glisser", plus bas).
      var long = false, minuteur = 0;
      b.addEventListener('pointerdown', function (e) {
        if (commencerGlisse(cs, b, e)) return;
        if (e.button === 2) return;
        long = false;
        minuteur = setTimeout(function () { if (glisse && glisse.cases.length > 1) return; long = true; agir(cs, true); }, 420);
        minuteurLong = minuteur;
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) {
        b.addEventListener(t, function () { clearTimeout(minuteur); });
      });
      b.addEventListener('click', function () {
        if (sansClic) { sansClic = false; return; }
        if (long) { long = false; return; }
        agir(cs, false);
      });
      b.addEventListener('contextmenu', function (e) {
        e.preventDefault(); clearTimeout(minuteur);
        if (sansClic) { sansClic = false; return; }
        agir(cs, true);
      });
      return b;
    }

    // ---------- Le glisser ----------
    // Comme dans Minecraft : une pile en main, on appuie sur une case et
    // l'on passe sur d'autres. Au relachement, la pile se partage a parts
    // egales entre toutes (clic gauche), ou l'on en pose une dans chacune
    // (clic droit). Le reste demeure en main.
    var glisse = null, sansClic = false, minuteurLong = 0;
    function recoit(cs) {
      var m = s.main, c = cs.get();
      if (!m || cs.sortie || !cs.accepte(m.id)) return false;
      if (!c) return true;
      return c.id === m.id && c.u == null && m.u == null && c.n < pile(m.id);
    }
    function commencerGlisse(cs, b, e) {
      var m = s.main;
      if (!m || m.u != null || pile(m.id) < 2 || !recoit(cs)) return false;
      glisse = { droit: e.button === 2, cases: [cs], noeuds: [b] };
      b.classList.add('is-glisse');
      majApercu();
      return false;
    }
    function apercu(k) {
      // Combien chaque case recevrait.
      var m = s.main, n = glisse.cases.length;
      if (glisse.droit) return k < m.n ? 1 : 0;
      var par = Math.floor(m.n / n);
      return par || (k < m.n ? 1 : 0);
    }
    function majApercu() {
      glisse.noeuds.forEach(function (nd, k) {
        var a = nd.querySelector('.ocr-apercu');
        if (!a) { a = el('span', 'ocr-apercu'); nd.appendChild(a); }
        var q = apercu(k);
        a.textContent = q ? '+' + q : '';
      });
    }
    box.addEventListener('pointermove', function (e) {
      if (!glisse) return;
      // Au doigt, les evenements restent sur la premiere case : on cherche
      // ce qu'il y a sous le doigt.
      var sous = document.elementFromPoint(e.clientX, e.clientY);
      var nd = sous && sous.closest && sous.closest('.ocr-case');
      if (!nd || !nd._cs || glisse.noeuds.indexOf(nd) !== -1 || !recoit(nd._cs)) return;
      glisse.cases.push(nd._cs);
      glisse.noeuds.push(nd);
      nd.classList.add('is-glisse');
      clearTimeout(minuteurLong);
      majApercu();
    });
    function finirGlisse() {
      if (!glisse) return;
      var g = glisse;
      glisse = null;
      if (g.cases.length < 2) {
        g.noeuds.forEach(function (nd) { nd.classList.remove('is-glisse'); var a = nd.querySelector('.ocr-apercu'); if (a) a.remove(); });
        return;
      }
      var m = s.main, P = pile(m.id);
      var parts = g.cases.map(function (cs, k) { glisse = g; var q = apercu(k); glisse = null; return q; });
      g.cases.forEach(function (cs, k) {
        if (!s.main || !parts[k]) return;
        var c = cs.get(), place_ = c ? P - c.n : P, q = Math.min(parts[k], place_, s.main.n);
        if (q <= 0) return;
        if (c) c.n += q; else cs.set({ id: m.id, n: q });
        s.main.n -= q;
        if (s.main.n <= 0) s.main = null;
      });
      // Le clic qui suit le relachement ne doit rien faire de plus.
      sansClic = true;
      setTimeout(function () { sansClic = false; }, 50);
      redessiner();
    }
    window.addEventListener('pointerup', finirGlisse);
    window.addEventListener('pointercancel', finirGlisse);

    function grilleSac() {
      var wrap = el('div');
      var haut = el('div', 'ocr-ligne');
      var nb = s.cases.filter(Boolean).length;
      haut.appendChild(el('span', 'ocr-titre', 'Sac'));
      haut.appendChild(el('span', 'ocr-cpt', nb + ' / ' + s.taille + ' cases'));
      wrap.appendChild(haut);
      var g = el('div', 'ocr-grille');
      for (var i = 0; i < s.taille; i++) g.appendChild(caseEl(caseSac(i), i < CR.BARRE ? 'ocr-case--barre' : ''));
      wrap.appendChild(g);
      return wrap;
    }

    // ---------- La main : ce qu'on tient, et ce qu'on peut en faire ----------
    function zoneMain() {
      var z = el('div', 'ocr-mainz');
      var m = s.main;
      if (!m) {
        z.appendChild(el('p', 'ocr-aide', 'Touche un objet pour le prendre en main, puis une case pour l’y poser. ' +
          'Clic droit ou appui long : la moitié de la pile, ou un seul objet.'));
        return z;
      }
      var o = objet(m.id);
      var l = el('div', 'ocr-det-tete');
      l.appendChild(CR.imgIcone(m.id, 'ocr-det-ic'));
      var txt = el('div', 'ocr-det-txt');
      txt.appendChild(el('strong', 'ocr-det-nom', o.nom + (m.n > 1 ? '  ×' + m.n : '')));
      txt.appendChild(el('span', 'ocr-det-cat', 'En main · ' + CR.CATS[o.cat].nom +
        (o.dur ? '  ·  usure ' + m.u + ' / ' + o.dur : '')));
      txt.appendChild(el('p', 'ocr-det-desc', o.desc));
      l.appendChild(txt);
      z.appendChild(l);
      var actions = el('div', 'ocr-actions');
      function bouton(t, f, plat) {
        var b = el('button', 'ocr-btn' + (plat ? ' ocr-btn--plat' : ''), t);
        b.type = 'button';
        b.addEventListener('click', f);
        actions.appendChild(b);
      }
      if (o.cat === 'conso' || o.cat === 'repas') {
        bouton(o.cat === 'repas' ? 'Manger' : 'Utiliser', function () {
          var dit = jeu.utiliser ? jeu.utiliser(o) : null;
          if (dit === false) return;
          m.n--;
          if (m.n <= 0) s.main = null;
          if (dit && jeu.dire) jeu.dire(dit);
          if (o.bombe || o.givre || o.repulsif) return clore();
          redessiner();
        });
      }
      if (o.cat === 'equip') {
        bouton('Équiper', function () {
          var avant = s.equipe[o.place];
          s.equipe[o.place] = m.id;
          m.n--;
          if (m.n <= 0) s.main = null;
          if (avant) { if (!s.main) s.main = { id: avant, n: 1 }; else CR.ajouterDans(s.cases, avant, 1); }
          if (jeu.maj) jeu.maj();
          redessiner();
        });
      }
      if (o.cat === 'bloc') {
        bouton('Poser sur la carte', function () {
          var r = jeu.poser ? jeu.poser(m.id) : 'Impossible ici.';
          if (r !== true) { if (jeu.dire) jeu.dire(r); return; }
          clore();
        });
      }
      bouton('Ranger dans le sac', function () {
        var mis = CR.ajouterDans(s.cases, m.id, m.n, m.u);
        m.n -= mis;
        if (m.n <= 0) s.main = null;
        else if (jeu.dire) jeu.dire('Plus de place dans le sac.');
        redessiner();
      }, true);
      bouton(m.n > 1 ? 'Jeter 1' : 'Jeter', function () { m.n--; if (m.n <= 0) s.main = null; redessiner(); }, true);
      z.appendChild(actions);
      return z;
    }

    // ==========================================================
    //  Le sac, et sa grille de fabrication
    // ==========================================================
    function vueSac() {
      var atelier = el('div', 'ocr-atelier');
      var zone = el('div', 'ocr-fabz');
      zone.appendChild(el('span', 'ocr-titre ocr-titre--groupe', station === 'etabli' ? 'Établi · 3 × 3' : 'Fabrication · 2 × 2'));
      var ligne = el('div', 'ocr-fab-ligne');
      var g = el('div', 'ocr-gfab ocr-gfab--' + N);
      var f = fantome;
      for (var i = 0; i < N * N; i++) {
        var fid = null;
        if (f && !grille[i]) {
          var y = Math.floor(i / N), x = i % N;
          fid = f.forme ? (f.motif[y] && f.motif[y][x]) || null : f.sans[i] || null;
        }
        g.appendChild(caseEl(caseGrille(i), 'ocr-case--fab', fid));
      }
      ligne.appendChild(g);
      ligne.appendChild(el('span', 'ocr-fleche', '➜'));
      var t = CR.trouver(grille, N);
      var res = el('button', 'ocr-case ocr-case--res' + (t ? '' : ' is-vide'));
      res.type = 'button';
      if (t) {
        res.appendChild(CR.imgIcone(t.sortie.id));
        if (t.sortie.n > 1) res.appendChild(el('span', 'ocr-n', String(t.sortie.n)));
        (function (so) { survol(res, function () { return so; }); })(t.sortie);
        res.addEventListener('click', function () { fabriquerUne(res); });
        res.addEventListener('contextmenu', function (e) { e.preventDefault(); fabriquerUne(res); });
      }
      ligne.appendChild(res);
      zone.appendChild(ligne);
      var sous = el('div', 'ocr-fab-sous-l');
      if (t) {
        sous.appendChild(el('span', 'ocr-fab-quoi', (t.r.repare ? 'Réparer : ' : '') + objet(t.sortie.id).nom +
          (t.sortie.n > 1 ? ' ×' + t.sortie.n : '')));
        var tout = el('button', 'ocr-btn ocr-btn--plat', 'Tout fabriquer');
        tout.type = 'button';
        tout.addEventListener('click', function () { toutFabriquer(res); });
        sous.appendChild(tout);
      } else if (N === 2 && grille.some(Boolean)) {
        sous.appendChild(el('span', 'ocr-aide', 'Rien ne correspond. Certaines recettes demandent un établi (3 × 3).'));
      } else if (!grille.some(Boolean)) {
        sous.appendChild(el('span', 'ocr-aide', f ? 'Les cases claires montrent la recette choisie.'
                                                 : 'Pose des objets dans la grille. Le livre de recettes montre les formes.'));
      }
      zone.appendChild(sous);
      atelier.appendChild(zone);
      atelier.appendChild(zoneMain());
      corps.appendChild(atelier);
      corps.appendChild(grilleSac());
    }

    // Toucher le resultat : on le fabrique, il arrive en main.
    function fabriquerUne(caseRes) {
      var t = CR.trouver(grille, N);
      if (!t) return;
      var m = s.main, so = t.sortie;
      if (m && !(m.id === so.id && m.u == null && so.u == null && m.n + so.n <= pile(so.id))) {
        if (jeu.dire) jeu.dire('Ta main est déjà pleine : pose d’abord ce que tu tiens.');
        return;
      }
      var premiere = !s.fabrique[so.id];
      CR.consommer(grille);
      if (m) m.n += so.n; else s.main = { id: so.id, n: so.n, u: so.u };
      if (s.main.u == null) delete s.main.u;
      if (!t.r.repare) CR.noterFabrique(so.id, so.n);
      eclat(caseRes, so, t.r.repare);
      redessiner();
      if (premiere && !t.r.repare) celebrer(so.id, so.n);
    }

    // Autant que les ingredients le permettent, directement dans le sac.
    function toutFabriquer(caseRes) {
      var t = CR.trouver(grille, N), fait = 0, premier = t;
      if (!t) return;
      var premiere = !s.fabrique[t.sortie.id];
      while (t && t.r === premier.r && fait < 64) {
        var so = t.sortie;
        if (!CR.rentre([{ id: so.id, n: so.n }])) break;
        CR.consommer(grille);
        CR.ajouterDans(s.cases, so.id, so.n, so.u);
        if (!t.r.repare) CR.noterFabrique(so.id, so.n);
        fait += so.n;
        t = CR.trouver(grille, N);
      }
      if (!fait) { if (jeu.dire) jeu.dire('Plus de place dans le sac.'); return; }
      eclat(caseRes, { id: premier.sortie.id, n: fait }, premier.r.repare);
      redessiner();
      if (premiere && !premier.r.repare) celebrer(premier.sortie.id, fait);
    }

    // Un eclat sur la case du resultat, et un "+n" qui monte.
    function eclat(caseRes, so, repare) {
      var r = box.getBoundingClientRect(), b = caseRes.getBoundingClientRect();
      var e = el('div', 'ocr-plus');
      e.appendChild(CR.imgIcone(so.id, 'ocr-plus-ic'));
      e.appendChild(el('span', null, (repare ? 'réparé' : '+' + so.n)));
      e.style.left = (b.left - r.left + b.width / 2) + 'px';
      e.style.top = (b.top - r.top) + 'px';
      box.appendChild(e);
      setTimeout(function () { e.remove(); }, 1000);
    }

    // La premiere fois qu'on fabrique un objet : il arrive dans ses rayons.
    function celebrer(id, n) {
      var o = objet(id);
      var voile = el('div', 'ocr-fab-anim is-eclair');
      var res = el('div', 'ocr-fab-res');
      res.appendChild(el('div', 'ocr-fab-rayons'));
      res.appendChild(CR.imgIcone(id, 'ocr-fab-ic'));
      res.appendChild(el('strong', 'ocr-fab-nom', (n > 1 ? n + ' × ' : '') + o.nom));
      res.appendChild(el('span', 'ocr-fab-sous', o.cat === 'outil' ? 'Nouvel outil' : o.cat === 'bloc' ? 'Nouvelle station' :
        o.cat === 'sac' ? 'Le sac s’agrandit' : 'Première fabrication'));
      voile.appendChild(res);
      box.appendChild(voile);
      setTimeout(function () {
        voile.classList.add('is-sortie');
        setTimeout(function () { voile.remove(); }, 300);
      }, reduit ? 700 : 1600);
    }

    // ==========================================================
    //  Le four
    // ==========================================================
    function vueFour() {
      var f = pose;
      CR.avancerFour(f);
      var four = el('div', 'ocr-four');
      function caseFour(cle, accepte, sortie) {
        return { get: function () { return f[cle] || null; }, set: function (v) { f[cle] = v; },
                 accepte: accepte, sortie: !!sortie };
      }
      var g = el('div', 'ocr-four-g');
      g.appendChild(el('span', 'ocr-four-lab', 'À cuire'));
      g.appendChild(caseEl(caseFour('entree', function (id) { return !!CR.CUISSON[id]; })));
      var actif = CR.fourActif(f);
      var flamme = el('div', 'ocr-flamme' + (actif ? ' is-actif' : ''));
      var fl = el('i');
      fl.style.height = Math.round(Math.min(1, f.flamme) * 100) + '%';
      flamme.appendChild(fl);
      g.appendChild(flamme);
      g.appendChild(caseEl(caseFour('combu', function (id) { return !!CR.COMBUSTIBLE[id]; })));
      g.appendChild(el('span', 'ocr-four-lab', 'Combustible'));
      four.appendChild(g);
      var fleche = el('div', 'ocr-four-fleche');
      var pr = el('i');
      pr.style.width = Math.round(f.prog * 100) + '%';
      fleche.appendChild(pr);
      four.appendChild(fleche);
      var d = el('div', 'ocr-four-d');
      d.appendChild(caseEl(caseFour('sortie', function () { return false; }, true), 'ocr-case--res'));
      d.appendChild(el('span', 'ocr-four-lab', 'Sortie'));
      four.appendChild(d);
      corps.appendChild(four);
      var etat_ = el('p', 'ocr-aide ocr-four-etat',
        actif ? 'Le four chauffe. Il continue même si tu t’éloignes.'
          : !f.entree ? 'Mets à cuire : minerai, cristal, viande, champignon, racine, bois.'
          : !CR.CUISSON[f.entree.id] ? 'Ça ne se cuit pas.'
          : f.flamme <= 0 && !f.combu ? 'Il manque du combustible : bois, charbon, planches, fibre, résine, braise.'
          : 'La sortie est pleine : prends ce qui est cuit.');
      corps.appendChild(etat_);
      var bas = el('div', 'ocr-atelier');
      bas.appendChild(zoneMain());
      var ram = el('button', 'ocr-btn ocr-btn--plat', 'Ramasser le four');
      ram.type = 'button';
      ram.addEventListener('click', function () { ramasserPose(); });
      bas.appendChild(ram);
      corps.appendChild(bas);
      corps.appendChild(grilleSac());
    }

    function ramasserPose() {
      if (!pose || !opts.astre) return;
      var r = CR.ramasser(opts.astre.id, pose);
      if (r === 'plein') { if (jeu.dire) jeu.dire('Vide d’abord le four.'); return; }
      if (r === 'place') { if (jeu.dire) jeu.dire('Plus de place dans le sac.'); return; }
      if (jeu.dire) jeu.dire(objet(pose.id).nom + ' rangé dans le sac.');
      clore();
    }

    // Le four avance tout seul : on le redessine tant que l'onglet est la.
    if (station === 'four') {
      minuteurFour = setInterval(function () {
        if (!box.isConnected) { clearInterval(minuteurFour); return; }
        if (courant !== 'four') return;
        var avant = JSON.stringify([pose.entree, pose.combu, pose.sortie, Math.round(pose.prog * 20), Math.round(pose.flamme * 10)]);
        CR.avancerFour(pose);
        var apres = JSON.stringify([pose.entree, pose.combu, pose.sortie, Math.round(pose.prog * 20), Math.round(pose.flamme * 10)]);
        if (avant !== apres) montrer('four');
      }, 250);
    }

    // ==========================================================
    //  Le livre de recettes
    // ==========================================================
    var seulementPossible = false;
    function vueLivre() {
      var toutes = CR.RECETTES.filter(CR.debloquee);
      var haut = el('div', 'ocr-ligne');
      haut.appendChild(el('span', 'ocr-titre', 'Recettes'));
      var filtre = el('button', 'ocr-btn ocr-btn--plat', seulementPossible ? 'Afficher tout' : 'Seulement ce que je peux faire');
      filtre.type = 'button';
      filtre.addEventListener('click', function () { seulementPossible = !seulementPossible; montrer('livre'); });
      haut.appendChild(filtre);
      corps.appendChild(haut);
      var reste = CR.RECETTES.length - toutes.length;
      corps.appendChild(el('p', 'ocr-aide', toutes.length + ' recette' + (toutes.length > 1 ? 's' : '') + ' dans le livre' +
        (reste ? ' · ' + reste + ' à découvrir : ramasse de nouveaux objets.' : '.') +
        ' Touche une recette pour la placer dans la grille.'));
      FAMILLES.forEach(function (fa) {
        var liste = toutes.filter(function (r) {
          if (objet(r.id).cat !== fa.cat) return false;
          return !seulementPossible || possible(r);
        });
        if (!liste.length) return;
        corps.appendChild(el('span', 'ocr-titre ocr-titre--groupe', fa.nom));
        var g = el('div', 'ocr-livre');
        liste.forEach(function (r) { g.appendChild(carteLivre(r)); });
        corps.appendChild(g);
      });
      // Ce que cuit le four.
      var vus = Object.keys(CR.CUISSON).filter(function (id) { return s.vus[id]; });
      if (vus.length) {
        corps.appendChild(el('span', 'ocr-titre ocr-titre--groupe', 'Au four'));
        var g2 = el('div', 'ocr-cuissons');
        vus.forEach(function (id) {
          var c = el('div', 'ocr-cuisson');
          c.appendChild(CR.imgIcone(id, 'ocr-mat-ic'));
          c.appendChild(el('span', null, '➜'));
          c.appendChild(CR.imgIcone(CR.CUISSON[id], 'ocr-mat-ic'));
          c.appendChild(el('span', 'ocr-cuisson-nom', objet(CR.CUISSON[id]).nom));
          g2.appendChild(c);
        });
        corps.appendChild(g2);
        corps.appendChild(el('p', 'ocr-aide', 'Combustibles : ' + Object.keys(CR.COMBUSTIBLE).map(function (id) {
          return objet(id).nom.toLowerCase() + ' (' + CR.COMBUSTIBLE[id] + ')';
        }).join(', ') + '.'));
      }
    }

    function possible(r) {
      var besoin = {};
      r.ingredients.forEach(function (id) { besoin[id] = (besoin[id] || 0) + 1; });
      return Object.keys(besoin).every(function (id) { return CR.compter(id) >= besoin[id]; });
    }

    function carteLivre(r) {
      var o = objet(r.id), ok = possible(r);
      var c = el('button', 'ocr-rl' + (ok ? ' is-pret' : ''));
      c.type = 'button';
      var mini = el('div', 'ocr-rl-g ocr-rl-g--' + r.grille);
      for (var i = 0; i < r.grille * r.grille; i++) {
        var y = Math.floor(i / r.grille), x = i % r.grille;
        var id = r.forme ? (r.motif[y] && r.motif[y][x]) || null : r.sans[i] || null;
        var cell = el('span', 'ocr-rl-c' + (id && CR.compter(id) ? '' : id ? ' is-manque' : ''));
        if (id) {
          cell.appendChild(CR.imgIcone(id, 'ocr-rl-ic'));
          (function (iid) { survol(cell, function () { return { id: iid, n: 1 }; }); })(id);
        }
        mini.appendChild(cell);
      }
      c.appendChild(mini);
      c.appendChild(el('span', 'ocr-fleche', '➜'));
      var res = el('span', 'ocr-rl-res');
      res.appendChild(CR.imgIcone(r.id, 'ocr-rec-ic'));
      if ((r.n || 1) > 1) res.appendChild(el('span', 'ocr-n', '×' + r.n));
      c.appendChild(res);
      var info = el('span', 'ocr-rl-info');
      info.appendChild(el('strong', 'ocr-rec-nom', o.nom));
      info.appendChild(el('span', 'ocr-rec-desc', r.grille === 3 ? 'Établi · ' + (r.forme ? 'forme imposée' : 'sans forme')
                                                                : 'Dans le sac · ' + (r.forme ? 'forme imposée' : 'sans forme')));
      c.appendChild(info);
      c.addEventListener('click', function () { choisirRecette(r); });
      return c;
    }

    function choisirRecette(r) {
      if (r.grille > N) {
        if (jeu.dire) jeu.dire('Il faut un établi pour « ' + objet(r.id).nom + ' » : pose-en un et ouvre-le.');
        fantome = null;
        montrer('livre');
        return;
      }
      var manque = CR.remplir(grille, N, r);
      if (manque.length) {
        // Il en manque : on montre la forme en transparence.
        fantome = r;
        if (jeu.dire) jeu.dire(manque[0] === 'place' ? 'Plus de place dans le sac pour vider la grille.'
          : 'Il te manque : ' + manque.map(function (id) { return objet(id).nom.toLowerCase(); }).join(', ') + '.');
      } else fantome = null;
      montrer('sac');
    }

    // ==========================================================
    //  L'equipement et la vitrine
    // ==========================================================
    function vueEquip() {
      var b = CR.bonus();
      var st = el('div', 'ocr-stats');
      [['PV max', String(100 + b.pv)], ['Régénération', '×' + b.regen], ['Vitesse', '×' + b.vitesse.toFixed(2)], ['Dégâts', '×' + b.degats.toFixed(2)]]
        .forEach(function (q) { var s2 = el('span', 'ocr-stat'); s2.appendChild(el('em', null, q[0])); s2.appendChild(el('strong', null, q[1])); st.appendChild(s2); });
      corps.appendChild(st);
      corps.appendChild(el('span', 'ocr-titre ocr-titre--groupe', 'Porté'));
      var porte = el('div', 'ocr-portes');
      [['armure', 'Armure'], ['accessoire', 'Accessoire']].forEach(function (pl) {
        var id = CR.equipe(pl[0]);
        var c = el('div', 'ocr-porte' + (id ? '' : ' is-vide'));
        c.appendChild(el('span', 'ocr-porte-place', pl[1]));
        if (id) {
          c.appendChild(CR.imgIcone(id, 'ocr-rec-ic'));
          c.appendChild(el('strong', 'ocr-rec-nom', objet(id).nom));
          c.appendChild(el('span', 'ocr-rec-desc', objet(id).desc));
          var r = el('button', 'ocr-btn ocr-btn--plat', 'Retirer');
          r.type = 'button';
          r.addEventListener('click', function () {
            if (!CR.desequiper(pl[0])) { if (jeu.dire) jeu.dire('Pas de place dans le sac pour le retirer.'); return; }
            if (jeu.maj) jeu.maj();
            montrer('equip');
          });
          c.appendChild(r);
        } else c.appendChild(el('span', 'ocr-rec-desc', 'Rien. Prends une armure ou un accessoire en main, puis « Équiper ».'));
        porte.appendChild(c);
      });
      corps.appendChild(porte);
      corps.appendChild(el('span', 'ocr-titre ocr-titre--groupe', 'Outils dans le sac'));
      var outils = el('div', 'ocr-outils');
      [['pioche', 'Pioche', 'pioche-pierre'], ['hache', 'Hache', 'hache-pierre'], ['foreuse', 'Foreuse', 'foreuse'],
       ['bottes', 'Bottes de flottaison', 'bottes'], ['detecteur', 'Détecteur', 'detecteur']].forEach(function (q) {
        var m = CR.meilleur(q[0]);
        var c = el('div', 'ocr-outil' + (m ? '' : ' is-manque'));
        c.appendChild(CR.imgIcone(m ? m.o.id : q[2], 'ocr-rec-ic'));
        c.appendChild(el('strong', 'ocr-rec-nom', m ? m.o.nom : q[1] + ' · à fabriquer'));
        c.appendChild(el('span', 'ocr-rec-desc', m && m.o.dur ? 'Usure : ' + m.c.u + ' / ' + m.o.dur : (m ? m.o.desc : objet(q[2]).desc)));
        outils.appendChild(c);
      });
      corps.appendChild(outils);
    }

    function vueVitrine() {
      var haut = el('div', 'ocr-ligne');
      haut.appendChild(el('span', 'ocr-titre', 'Vitrine'));
      haut.appendChild(el('span', 'ocr-cpt', Object.keys(s.vitrine).length + ' / ' + CR.RELIQUES.length));
      corps.appendChild(haut);
      var g = el('div', 'ocr-vitrine');
      CR.RELIQUES.forEach(function (o) {
        var a = !!s.vitrine[o.id];
        var c = el('div', 'ocr-vit' + (a ? '' : ' is-manque'));
        if (a) {
          c.appendChild(CR.imgIcone(o.id, 'ocr-vit-ic'));
          c.appendChild(el('strong', 'ocr-vit-nom', o.nom));
          c.title = o.desc;
        } else c.appendChild(el('span', 'ocr-vit-q', '?'));
        c.appendChild(el('span', 'ocr-vit-ou', o.monde ? CR.nomMonde(o.monde) : 'Curiosité'));
        g.appendChild(c);
      });
      corps.appendChild(g);
    }

    jeu.scene.appendChild(box);
    montrer(courant);
    fermer.focus();
    return { fermer: clore };
  }

  window.ODYATELIER = { ouvrir: ouvrir };
})();
