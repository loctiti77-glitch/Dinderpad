// L'XP de l'Odyssee, comme dans Minecraft.
//
// Les creatures abattues, les minerais qu'on casse, les coffres qu'on
// ouvre et ce que le four a cuit lachent des orbes vertes. Elles sautent,
// roulent, puis filent vers le voyageur quand il passe pres d'elles. La
// barre se remplit au-dessus de la barre rapide, et le niveau s'affiche au
// milieu, en vert.
//
// Les niveaux se depensent a deux stations qu'on pose sur la carte :
//   - la table d'enchantement : trois offres, du moins cher au plus
//     puissant, payees en niveaux et en cristal ;
//   - l'enclume : elle repare un outil contre des niveaux, sans toucher a
//     ses enchantements.
//
// Les points se comptent comme dans Minecraft : 7 pour passer du niveau
// 0 au niveau 1, puis de plus en plus.
(function () {
  var DP = window.DP, CR = window.ODYCRAFT;
  if (!DP || !CR) return;

  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  // ==========================================================
  //  Les points et les niveaux
  // ==========================================================
  // Ce qu'il faut de points pour passer du niveau n au suivant.
  function pointsPour(n) { return n >= 31 ? 9 * n - 158 : n >= 16 ? 5 * n - 38 : 2 * n + 7; }
  function totalPour(n) { var t = 0; for (var i = 0; i < n; i++) t += pointsPour(i); return t; }
  function lire(total) {
    var n = 0;
    while (total >= pointsPour(n)) { total -= pointsPour(n); n++; }
    return { niveau: n, reste: total, besoin: pointsPour(n), k: total / pointsPour(n) };
  }
  function total() { return CR.etat().xp || 0; }
  function etat() { return lire(total()); }
  function niveau() { return etat().niveau; }

  var ecoutes = [];
  function ecouter(fn) { ecoutes.push(fn); }

  // Ajoute des points. Le Raccommodage passe d'abord : chaque point repare
  // deux d'usure d'un outil abime qui le porte. Rend { avant, apres, mis }.
  function gagner(n) {
    if (!(n > 0)) return null;
    var s = CR.etat();
    var reste = raccommoder(n);
    var avant = lire(s.xp || 0).niveau;
    s.xp = (s.xp || 0) + reste;
    CR.sauver();
    var apres = lire(s.xp).niveau;
    var r = { avant: avant, apres: apres, mis: reste, recu: n };
    ecoutes.forEach(function (fn) { try { fn(r); } catch (e) {} });
    return r;
  }

  // Depense des niveaux en gardant la part de la barre deja remplie.
  function depenser(k) {
    var s = CR.etat(), e = lire(s.xp || 0);
    if (e.niveau < k) return false;
    var cible = e.niveau - k;
    s.xp = totalPour(cible) + Math.floor(e.k * pointsPour(cible));
    CR.sauver();
    ecoutes.forEach(function (fn) { try { fn({ avant: e.niveau, apres: cible, mis: 0, depense: k }); } catch (er) {} });
    return true;
  }

  function raccommoder(n) {
    var s = CR.etat();
    var abimes = s.cases.filter(function (c) {
      var o = c && CR.objet(c.id);
      return o && o.dur && c.e && c.e.raccommodage && c.u != null && c.u < o.dur;
    });
    while (n > 0 && abimes.length) {
      var c = abimes[0], o = CR.objet(c.id);
      var manque = o.dur - c.u, pris = Math.min(n, Math.ceil(manque / 2));
      c.u = Math.min(o.dur, c.u + pris * 2);
      n -= pris;
      if (c.u >= o.dur) abimes.shift();
    }
    return n;
  }

  // ==========================================================
  //  Les enchantements
  // ==========================================================
  var ENCHANTS = {
    fortune:      { nom: 'Fortune', max: 3, desc: 'Plus de butin par rocher, cristal ou plante.',
                    pour: function (o) { return o.outil === 'pioche' || o.outil === 'hache' || o.outil === 'foreuse'; } },
    solidite:     { nom: 'Solidité', max: 3, desc: 'L’outil a des chances de ne pas s’user.',
                    pour: function (o) { return !!o.dur; } },
    raccommodage: { nom: 'Raccommodage', max: 1, rare: 18, desc: 'Les orbes d’XP réparent l’outil au lieu de te faire monter.',
                    pour: function (o) { return !!o.dur; } },
    protection:   { nom: 'Protection', max: 4, desc: '8 % de dégâts en moins par niveau.',
                    pour: function (o) { return o.place === 'armure'; } },
    epines:       { nom: 'Épines', max: 3, desc: 'Ce qui te mord a des chances de se blesser.',
                    pour: function (o) { return o.place === 'armure'; } },
    vitalite:     { nom: 'Vitalité', max: 3, desc: '+10 PV max par niveau.',
                    pour: function (o) { return o.place === 'armure'; } }
  };
  var ROMAIN = ['', 'I', 'II', 'III', 'IV', 'V'];

  function enchantable(o) {
    if (!o) return false;
    return Object.keys(ENCHANTS).some(function (k) { return ENCHANTS[k].pour(o); });
  }
  function nomEnchant(k, n) { return ENCHANTS[k] ? ENCHANTS[k].nom + ' ' + ROMAIN[n] : k; }
  function texte(e) {
    if (!e) return '';
    return Object.keys(e).map(function (k) { return nomEnchant(k, e[k]); }).join(', ');
  }

  // Un hasard rejouable : les offres ne changent pas tant qu'on n'a pas
  // enchante (comme dans Minecraft, ou rouvrir la table ne retire rien).
  function hasard(graine) {
    var h = graine >>> 0 || 1;
    return function () {
      h = (h + 0x6D2B79F5) | 0;
      var t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hacher(txt) {
    var h = 2166136261;
    for (var i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // Ce que la puissance p (le niveau demande) donne sur l'objet o.
  function tirer(o, p, r) {
    var cles = Object.keys(ENCHANTS).filter(function (k) {
      var E = ENCHANTS[k];
      return E.pour(o) && (!E.rare || p >= E.rare);
    });
    if (!cles.length) return null;
    var e = {};
    function un() {
      var libres = cles.filter(function (k) { return !e[k]; });
      if (!libres.length) return false;
      var k = libres[Math.floor(r() * libres.length)], E = ENCHANTS[k];
      var n = Math.max(1, Math.min(E.max, Math.ceil(p / (31 / E.max)) - (r() < 0.35 ? 1 : 0)));
      e[k] = n;
      return true;
    }
    un();
    var chance = (p + 1) / 50;
    while (r() < chance && un()) chance /= 2;
    return e;
  }

  // Les trois offres pour l'objet de la case c.
  function offres(c) {
    var o = c && CR.objet(c.id);
    if (!o || !enchantable(o) || c.e) return [];
    var s = CR.etat();
    if (!s.enchGraine) { s.enchGraine = Math.floor(Math.random() * 1e9); CR.sauver(); }
    var r = hasard(s.enchGraine ^ hacher(c.id));
    var paliers = [[1, 5], [6, 14], [15, 30]];
    return paliers.map(function (pl, i) {
      var req = pl[0] + Math.floor(r() * (pl[1] - pl[0] + 1));
      return { i: i, requis: req, cout: i + 1, cristal: i + 1, e: tirer(o, req, r) };
    });
  }

  // Enchante l'objet de la case c avec l'offre choisie. Rend un message
  // d'erreur, ou true.
  // "paye" : le cristal a deja ete pris (dans la case de la table).
  function enchanter(c, offre, paye) {
    var n = niveau();
    if (n < offre.requis) return 'Il faut être au niveau ' + offre.requis + '.';
    if (!paye && CR.compter('cristal') < offre.cristal) return 'Il faut ' + offre.cristal + ' cristal' + (offre.cristal > 1 ? 'aux' : '') + ' brut' + (offre.cristal > 1 ? 's' : '') + '.';
    if (!offre.e) return 'Rien à enchanter.';
    if (!paye) CR.retirer('cristal', offre.cristal);
    depenser(offre.cout);
    c.e = offre.e;
    var s = CR.etat();
    s.enchGraine = Math.floor(Math.random() * 1e9);
    CR.sauver();
    return true;
  }

  // L'enclume : combien de niveaux pour remettre l'outil a neuf.
  function coutReparation(c) {
    var o = c && CR.objet(c.id);
    if (!o || !o.dur || c.u == null || c.u >= o.dur) return 0;
    var k = (o.dur - c.u) / o.dur;
    return Math.max(1, Math.ceil(k * 5) + (c.e ? Object.keys(c.e).length : 0));
  }
  function reparer(c) {
    var cout = coutReparation(c);
    if (!cout) return 'Il est déjà comme neuf.';
    if (niveau() < cout) return 'Il faut ' + cout + ' niveau' + (cout > 1 ? 'x' : '') + '.';
    depenser(cout);
    c.u = CR.objet(c.id).dur;
    CR.sauver();
    return true;
  }

  // ==========================================================
  //  Les sons
  // ==========================================================
  function audio() {
    var MJ = window.MUSIQUE_JEUX;
    return MJ && MJ.audio ? MJ.audio() : null;
  }
  // Le "ding" d'une orbe : une note claire, a une hauteur au hasard.
  var dernierDing = 0;
  function ding() {
    var A = audio();
    if (!A) return;
    var ac = A.ac, t = ac.currentTime;
    if (t - dernierDing < 0.04) return;
    dernierDing = t;
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1400 + Math.random() * 900, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(A.sortie);
    o.start(t); o.stop(t + 0.2);
  }
  // Le niveau gagne : un petit arpege qui monte ; tous les cinq niveaux,
  // une fanfare plus longue.
  function fanfare(grand) {
    var A = audio();
    if (!A) return;
    var ac = A.ac, t = ac.currentTime;
    var notes = grand ? [523, 659, 784, 1047, 1319, 1568] : [659, 831, 988];
    notes.forEach(function (f, i) {
      var o = ac.createOscillator(), g = ac.createGain(), d = t + i * (grand ? 0.09 : 0.07);
      o.type = 'square';
      o.frequency.setValueAtTime(f, d);
      g.gain.setValueAtTime(0.0001, d);
      g.gain.exponentialRampToValueAtTime(0.06, d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, d + (grand ? 0.5 : 0.3));
      o.connect(g); g.connect(A.sortie);
      o.start(d); o.stop(d + 0.55);
    });
  }
  // L'enchantement : un balayage qui monte, scintillant.
  function sonEnchant() {
    var A = audio();
    if (!A) return;
    var ac = A.ac, t = ac.currentTime;
    for (var i = 0; i < 8; i++) {
      var o = ac.createOscillator(), g = ac.createGain(), d = t + i * 0.06;
      o.type = 'triangle';
      o.frequency.setValueAtTime(600 + i * 180 + Math.random() * 60, d);
      g.gain.setValueAtTime(0.0001, d);
      g.gain.exponentialRampToValueAtTime(0.05, d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, d + 0.35);
      o.connect(g); g.connect(A.sortie);
      o.start(d); o.stop(d + 0.4);
    }
  }
  // L'enclume : un coup de marteau.
  function sonEnclume() {
    var A = audio();
    if (!A) return;
    var ac = A.ac, t = ac.currentTime;
    [0, 0.22].forEach(function (dt) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(880, t + dt);
      o.frequency.exponentialRampToValueAtTime(420, t + dt + 0.15);
      g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.exponentialRampToValueAtTime(0.08, t + dt + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.25);
      o.connect(g); g.connect(A.sortie);
      o.start(t + dt); o.stop(t + dt + 0.3);
    });
  }

  // ==========================================================
  //  Les orbes, dans le monde
  // ==========================================================
  // Les tailles de Minecraft : un gros tas se partage en orbes de 17, 7,
  // 3 et 1 points.
  var TAILLES = [17, 7, 3, 1];

  function Orbes() {
    var liste = [];
    function semer(x, y, n, t) {
      n = Math.round(n);
      if (!(n > 0)) return;
      var k = 0;
      while (n > 0 && liste.length < 120) {
        var v = TAILLES.filter(function (q) { return q <= n; })[0];
        n -= v;
        var a = Math.random() * 6.283, f = 30 + Math.random() * 40;
        liste.push({ x: x, y: y, z: 8, vx: Math.cos(a) * f, vy: Math.sin(a) * f, vz: 60 + Math.random() * 50,
                     val: v, t0: t + k * 40, ph: Math.random() * 6.3 });
        k++;
      }
    }
    // Rend la somme ramassee pendant ce pas.
    function animer(dt, t, chef, libre) {
      var pris = 0;
      for (var i = liste.length - 1; i >= 0; i--) {
        var o = liste[i];
        if (t < o.t0) continue;
        if (t - o.t0 > 300000) { liste.splice(i, 1); continue; }
        var dx = chef.x - o.x, dy = chef.y - o.y, d = Math.hypot(dx, dy) || 1;
        if (libre && t - o.t0 > 450 && d < 80) {
          // Aspiree vers le voyageur, de plus en plus vite.
          var v = 60 + (1 - d / 80) * 260;
          o.x += dx / d * v * dt; o.y += dy / d * v * dt;
          o.z += (12 - o.z) * Math.min(1, dt * 6);
          if (d < 12) { pris += o.val; liste.splice(i, 1); }
          continue;
        }
        // Le saut, puis les rebonds.
        o.vz -= 160 * dt;
        o.z += o.vz * dt;
        if (o.z <= 3) { o.z = 3; o.vz = Math.abs(o.vz) > 20 ? -o.vz * 0.45 : 0; o.vx *= 0.6; o.vy *= 0.6; }
        o.x += o.vx * dt; o.y += o.vy * dt;
        o.vx *= Math.pow(0.4, dt); o.vy *= Math.pow(0.4, dt);
      }
      return pris;
    }
    function extras(t) {
      return liste.filter(function (o) { return t >= o.t0; }).map(function (o) {
        return {
          x: o.x, y: o.y,
          dessin: function (ctx, sx, sy) {
            var r = o.val >= 17 ? 2.4 : o.val >= 7 ? 2 : o.val >= 3 ? 1.6 : 1.25;
            var puls = reduit ? 0.5 : (Math.sin(t / 140 + o.ph) + 1) / 2;
            var yy = sy - o.z - (o.vz === 0 && !reduit ? Math.sin(t / 300 + o.ph) * 1.5 : 0);
            // L'ombre, le halo, la bille et son coeur.
            ctx.fillStyle = 'rgba(0,0,0,.25)';
            ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.35, 0, 0, 6.3); ctx.fill();
            ctx.fillStyle = 'rgba(190,255,90,' + (0.18 + 0.15 * puls).toFixed(2) + ')';
            ctx.beginPath(); ctx.arc(sx, yy, r * 1.7, 0, 6.3); ctx.fill();
            ctx.fillStyle = puls > 0.5 ? '#c8ff3a' : '#8ae83a';
            ctx.beginPath(); ctx.arc(sx, yy, r, 0, 6.3); ctx.fill();
            ctx.fillStyle = '#f4ffc8';
            ctx.fillRect(Math.round(sx - r * 0.4), Math.round(yy - r * 0.5), Math.max(1, Math.round(r * 0.6)), Math.max(1, Math.round(r * 0.6)));
          }
        };
      });
    }
    return { semer: semer, animer: animer, extras: extras, liste: liste };
  }

  // ==========================================================
  //  La barre, a l'ecran
  // ==========================================================
  // Une barre verte, fine, au-dessus de la barre rapide, et le niveau au
  // milieu. Elle s'eclaire quand une orbe arrive ; un niveau gagne fait
  // sauter le chiffre et monter un bandeau.
  function Barre(scene) {
    var b = el('div', 'oxp');
    var fond = el('div', 'oxp-fond');
    var plein = el('div', 'oxp-plein');
    fond.appendChild(plein);
    b.appendChild(fond);
    var num = el('span', 'oxp-n', '');
    b.appendChild(num);
    scene.appendChild(b);
    function maj() {
      var e = etat();
      plein.style.width = (e.k * 100).toFixed(1) + '%';
      num.textContent = e.niveau ? String(e.niveau) : '';
      b.classList.toggle('is-zero', !e.niveau);
    }
    function tic() {
      b.classList.remove('is-tic'); void b.offsetWidth; b.classList.add('is-tic');
    }
    function monter(n) {
      num.classList.remove('is-monte'); void num.offsetWidth; num.classList.add('is-monte');
      var grand = n % 5 === 0;
      fanfare(grand);
      var a = el('div', 'oxp-annonce' + (grand ? ' is-grand' : ''));
      a.appendChild(el('span', 'oxp-annonce-haut', grand ? 'Palier atteint' : 'Niveau'));
      a.appendChild(el('strong', 'oxp-annonce-n', String(n)));
      for (var i = 0; i < (grand ? 14 : 8); i++) {
        var p = el('i', 'oxp-annonce-p');
        p.style.setProperty('--a', (i * (360 / (grand ? 14 : 8))) + 'deg');
        a.appendChild(p);
      }
      scene.appendChild(a);
      setTimeout(function () { a.remove(); }, reduit ? 1200 : 2200);
    }
    function cacher(oui) { b.classList.toggle('is-cachee', !!oui); }
    maj();
    return { maj: maj, tic: tic, monter: monter, cacher: cacher, noeud: b };
  }

  window.ODYXP = {
    pointsPour: pointsPour, totalPour: totalPour, lire: lire, total: total, etat: etat, niveau: niveau,
    gagner: gagner, depenser: depenser, ecouter: ecouter,
    ENCHANTS: ENCHANTS, ROMAIN: ROMAIN, enchantable: enchantable, nomEnchant: nomEnchant, texte: texte,
    offres: offres, enchanter: enchanter, coutReparation: coutReparation, reparer: reparer,
    ding: ding, fanfare: fanfare, sonEnchant: sonEnchant, sonEnclume: sonEnclume,
    Orbes: Orbes, Barre: Barre
  };
})();
