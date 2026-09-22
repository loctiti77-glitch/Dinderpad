// Le Selenophage : le gardien de la grande grotte, sur la Lune.
//
// Un duel au viseur, comme contre les requins, mais la bete rend les
// coups. Elle attaque a intervalles reguliers ; chaque attaque s'annonce
// une seconde a l'avance — la gueule s'ouvre, les yeux rougissent. Deux
// touches sur un point faible pendant ce temps-la, et l'attaque avorte :
// la bete reste etourdie un instant. Sinon, le coup porte.
//
// Le voyageur arrive avec ce qu'il lui reste de points de vie : on ne
// soigne pas avant le combat, on arrive comme on est.
(function () {
  var DP = window.DP;
  if (!DP) return;

  var reduit = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CV_L = 480, CV_H = 316;

  // ==========================================================
  //  Les reglages
  // ==========================================================
  // Mille cinq cents points de vie. Un Mk III correct en vient a bout en
  // une demi-minute, avant que la bete n'ait pu le mettre a terre ; un
  // Mk I n'y arrive qu'en interrompant presque chaque attaque. A mille
  // huit cents, le Mk III tombait a peu pres en meme temps qu'elle.
  var PV = 1500;
  var CADENCE = 3400, CADENCE_RAGE = 2600;      // entre deux attaques
  var PREPARE = 1100;                           // le temps de l'annonce
  var ETOURDI = 1300;
  var COUP = 13, COUP_RAGE = 17;
  var POUR_INTERROMPRE = 2;                     // touches faibles pendant l'annonce

  var RECOMPENSE = { roches: 25, temporel: 1, revetement: 'selenite' };

  // ==========================================================
  //  Le dessin
  // ==========================================================
  // Vu de face, sortant de la grotte : une tete cuirassee plus large que
  // haute, trois yeux de chaque cote, deux mandibules en crochet, et au
  // milieu une gueule ronde herissee de dents qui ne s'ouvre en grand
  // qu'au moment de frapper.

  var SL = 150, SH = 112;

  function ovale(p, cx, cy, rx, ry, col) {
    for (var dy = -ry; dy <= ry; dy++) {
      var k = 1 - (dy / (ry + 0.5)) * (dy / (ry + 0.5));
      if (k <= 0) continue;
      var w = Math.round(rx * Math.sqrt(k));
      p(cx - w, cy + dy, w * 2 + 1, 1, col);
    }
  }

  function dessiner(p, ouverte) {
    var peau = '#cfc7b4', clair = '#efe8d6', sombre = '#8f8676', creux = '#5a5246';
    var gorge = '#2e0a0f', dent = '#fbf7ec', oeil = '#e8483a';
    var cx = 75, i;

    // Le cou, en anneaux qui descendent dans la grotte.
    for (i = 0; i < 4; i++) {
      ovale(p, cx, 96 + i * 5, 38 + i * 4, 9, i % 2 ? sombre : peau);
      p(cx - 38 - i * 4, 96 + i * 5, 76 + i * 8, 1, creux);
    }

    // La tete : une grosse carapace, et ses plaques.
    ovale(p, cx, 54, 58, 40, peau);
    ovale(p, cx, 44, 50, 26, clair);
    for (i = 0; i < 5; i++) {
      p(cx - 44 + i * 22, 20 + Math.abs(i - 2) * 4, 2, 30, creux);
    }
    ovale(p, cx, 22, 30, 7, sombre);

    // Les mandibules, en crochet de chaque cote.
    for (i = 0; i < 22; i++) {
      var dx = Math.round(Math.sin(i / 21 * 2.2) * 14);
      p(cx - 56 - dx, 52 + i * 1.6, 7, 3, sombre);
      p(cx + 49 + dx, 52 + i * 1.6, 7, 3, sombre);
    }
    p(cx - 70, 84, 9, 4, dent); p(cx + 61, 84, 9, 4, dent);

    // Les yeux : trois de chaque cote, en arc.
    [[-36, 36], [-28, 28], [-19, 24]].forEach(function (e) {
      ovale(p, cx + e[0], e[1], 4, 3, '#1a0a0a');
      ovale(p, cx + e[0], e[1], 2, 2, oeil);
      ovale(p, cx - e[0], e[1], 4, 3, '#1a0a0a');
      ovale(p, cx - e[0], e[1], 2, 2, oeil);
    });

    // La gueule : une fente, ou un gouffre rond borde de dents.
    if (!ouverte) {
      ovale(p, cx, 70, 22, 5, creux);
      p(cx - 20, 70, 40, 2, gorge);
      for (i = 0; i < 9; i++) p(cx - 18 + i * 4.5, 68, 2, 3, dent);
    } else {
      ovale(p, cx, 70, 26, 20, creux);
      ovale(p, cx, 70, 22, 17, gorge);
      ovale(p, cx, 72, 10, 8, '#170406');
      // Les dents, tournees vers le centre.
      for (i = 0; i < 16; i++) {
        var ang = i / 16 * Math.PI * 2;
        var bx = cx + Math.cos(ang) * 21, by = 70 + Math.sin(ang) * 16;
        var tx = cx + Math.cos(ang) * 13, ty = 70 + Math.sin(ang) * 10;
        for (var k = 0; k <= 4; k++) {
          var u = k / 4;
          p(Math.round(bx + (tx - bx) * u), Math.round(by + (ty - by) * u),
            Math.max(1, 3 - k), Math.max(1, 3 - k), k < 2 ? dent : '#d8d0bc');
        }
      }
    }
  }

  function cerner(ctx) {
    var img = ctx.getImageData(0, 0, SL, SH), d = img.data;
    var plein = new Uint8Array(SL * SH), i;
    for (i = 0; i < SL * SH; i++) plein[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (var y = 0; y < SH; y++) {
      for (var x = 0; x < SL; x++) {
        i = y * SL + x;
        if (plein[i]) continue;
        var voisin = false;
        for (var k = 0; k < 4; k++) {
          var nx = x + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
          if (nx < 0 || ny < 0 || nx >= SL || ny >= SH) continue;
          if (plein[ny * SL + nx]) { voisin = true; break; }
        }
        if (!voisin) continue;
        d[i * 4] = 16; d[i * 4 + 1] = 12; d[i * 4 + 2] = 10; d[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var cache = {};

  function feuille(ouverte) {
    var cle = ouverte ? 'o' : 'f';
    if (cache[cle]) return cache[cle];
    var cv = document.createElement('canvas');
    cv.width = SL; cv.height = SH;
    var x = cv.getContext('2d');
    if (!x) return null;
    x.imageSmoothingEnabled = false;
    dessiner(function (px, py, w, h, col) {
      x.fillStyle = col;
      x.fillRect(Math.round(px), Math.round(py), w, h);
    }, ouverte);
    cerner(x);
    cache[cle] = { canvas: cv, L: SL, H: SH };
    return cache[cle];
  }

  // Les points faibles, en coordonnees de la feuille : les deux grappes
  // d'yeux et les deux articulations des mandibules. La gorge s'y ajoute
  // quand la gueule est ouverte.
  var FAIBLES = [
    { x: 47, y: 28, r: 9 }, { x: 103, y: 28, r: 9 },
    { x: 22, y: 58, r: 8 }, { x: 128, y: 58, r: 8 }
  ];
  var GORGE = { x: 75, y: 71, r: 11 };

  // ==========================================================
  //  Le duel
  // ==========================================================

  function Duel(cfg) {
    var A = window.ARME;
    var nv = A ? A.niveau() : { degats: 6, cadence: 620, nom: 'Mk I' };
    var pvJ = Math.max(1, cfg.pvJoueur || 100), pvJMax = cfg.pvMax || 100;
    var pv = PV;

    var hote = document.createElement('div');
    hote.className = 'bs';
    hote.dataset.phase = 'combat';

    var cv = document.createElement('canvas');
    cv.className = 'bs-cv';
    cv.width = CV_L; cv.height = CV_H;
    hote.appendChild(cv);

    hote.insertAdjacentHTML('beforeend',
      '<div class="bs-haut"><div class="bs-titre">' +
      '<span class="bs-nom">Le Sélénophage</span>' +
      '<span class="bs-etat"></span></div>' +
      '<div class="bs-jauge"><div class="bs-plein"></div><span class="bs-pv"></span></div></div>' +
      '<div class="bs-bas"><div class="bs-moi"><span class="bs-moi-nom">Toi</span>' +
      '<div class="bs-jauge bs-jauge--moi"><div class="bs-plein bs-plein--moi"></div>' +
      '<span class="bs-pv bs-pv--moi"></span></div></div>' +
      '<span class="bs-aide">Vise les points orange. Pendant qu’il prépare son coup, deux touches l’interrompent.</span></div>' +
      '<div class="bs-fin" hidden></div>');

    (cfg.parent || document.body).appendChild(hote);

    var ctx = cv.getContext('2d');
    var elPlein = hote.querySelector('.bs-plein');
    var elPv = hote.querySelector('.bs-pv');
    var elMoi = hote.querySelector('.bs-plein--moi');
    var elPvMoi = hote.querySelector('.bs-pv--moi');
    var elEtat = hote.querySelector('.bs-etat');
    var fin = hote.querySelector('.bs-fin');

    var ECH = 2.05;
    var base = { x: CV_L / 2, y: 150 };
    var pos = { x: base.x, y: base.y }, echelle = 1;
    var etat = 'nage';                 // nage | prepare | frappe | etourdi | mort
    var etatDepuis = 0, prochaine = 0, touchesPrep = 0;
    var t0 = 0, dernierTir = -9999, fini = false, brut = null;
    var viseur = { x: CV_L / 2, y: CV_H / 2 };
    var tirs = [], chiffres = [], eclats = [];
    var secousse = 0, flash = 0;

    function rage() { return pv <= PV / 2; }

    function majJauges() {
      elPlein.style.width = (pv / PV * 100).toFixed(1) + '%';
      elPv.textContent = pv + ' / ' + PV;
      elMoi.style.width = (pvJ / pvJMax * 100).toFixed(1) + '%';
      elMoi.dataset.bas = pvJ / pvJMax < 0.3 ? '1' : '0';
      elPvMoi.textContent = Math.ceil(pvJ) + ' / ' + pvJMax;
      elEtat.textContent = etat === 'prepare' ? 'IL PRÉPARE SON COUP'
                         : etat === 'etourdi' ? 'ÉTOURDI'
                         : rage() ? 'ENRAGÉ' : '';
      hote.dataset.etat = etat;
    }

    // Les points faibles a l'ecran, selon la pose.
    function faibles() {
      var lst = FAIBLES.slice();
      if (etat === 'prepare') lst.push(GORGE);
      var e = ECH * echelle;
      return lst.map(function (f) {
        return {
          x: pos.x + (f.x - SL / 2) * e,
          y: pos.y + (f.y - SH / 2) * e,
          r: f.r * e * 0.9,
          gorge: f === GORGE
        };
      });
    }

    function dansLeCorps(x, y) {
      var e = ECH * echelle;
      var dx = (x - pos.x) / (58 * e), dy = (y - (pos.y - 4 * e)) / (44 * e);
      return dx * dx + dy * dy <= 1;
    }

    function tirer(t) {
      if (fini || etat === 'mort' || t - dernierTir < nv.cadence) return;
      dernierTir = t;
      var x = viseur.x, y = viseur.y;
      tirs.push({ t0: t, x: x, y: y });

      var touche = null;
      faibles().forEach(function (f) {
        var dx = x - f.x, dy = y - f.y;
        if (!touche && dx * dx + dy * dy <= f.r * f.r) touche = f;
      });
      var degats = touche ? nv.degats * 3 : (dansLeCorps(x, y) ? nv.degats : 0);
      if (!degats) {
        chiffres.push({ t0: t, x: x, y: y, txt: 'raté', vide: true });
        return;
      }
      pv = Math.max(0, pv - degats);
      chiffres.push({ t0: t, x: x, y: y, txt: '-' + degats, faible: !!touche });
      eclats.push({ t0: t, x: x, y: y, faible: !!touche });

      // Interrompre : deux touches faibles pendant l'annonce, ou une seule
      // dans la gorge ouverte.
      if (etat === 'prepare' && touche) {
        touchesPrep += touche.gorge ? POUR_INTERROMPRE : 1;
        if (touchesPrep >= POUR_INTERROMPRE) {
          etat = 'etourdi'; etatDepuis = t;
          chiffres.push({ t0: t, x: pos.x, y: pos.y - 90, txt: 'INTERROMPU !', faible: true, gros: true });
        }
      }
      majJauges();
      if (pv <= 0) mourir(t);
    }

    function frapper(t) {
      var coup = rage() ? COUP_RAGE : COUP;
      pvJ = Math.max(0, pvJ - coup);
      secousse = t; flash = t;
      chiffres.push({ t0: t, x: CV_L / 2, y: CV_H - 60, txt: '-' + coup, moi: true, gros: true });
      majJauges();
      if (pvJ <= 0) perdre(t);
    }

    // --- La boucle ---
    function image(t) {
      if (!hote.isConnected) return;
      brut = requestAnimationFrame(image);
      if (!t0) { t0 = t; prochaine = t + 1800; etatDepuis = t; }
      avancer(t);
      peindre(t);
    }

    function avancer(t) {
      var k;
      if (etat === 'mort') {
        k = Math.min(1, (t - etatDepuis) / 1400);
        pos.y = base.y + k * 140;
        echelle = 1 - k * 0.2;
        return;
      }
      if (fini) return;

      // Le balancement de fond : il ne tient jamais en place.
      var balance = reduit ? 0 : Math.sin((t - t0) / 1300) * 60;
      var bob = reduit ? 0 : Math.sin((t - t0) / 700) * 8;

      if (etat === 'nage') {
        pos.x = base.x + balance; pos.y = base.y + bob; echelle = 1;
        if (t >= prochaine) { etat = 'prepare'; etatDepuis = t; touchesPrep = 0; majJauges(); }
        return;
      }
      if (etat === 'prepare') {
        k = Math.min(1, (t - etatDepuis) / PREPARE);
        // Il se cabre : recule et monte, gueule ouverte.
        pos.x = base.x + balance * (1 - k); pos.y = base.y - 22 * k + bob;
        echelle = 1 - 0.08 * k;
        if (k >= 1) { etat = 'frappe'; etatDepuis = t; frapper(t); majJauges(); }
        return;
      }
      if (etat === 'frappe') {
        k = Math.min(1, (t - etatDepuis) / 420);
        pos.y = base.y - 22 + 40 * Math.sin(k * Math.PI);
        echelle = 0.92 + 0.26 * Math.sin(k * Math.PI);
        if (k >= 1) {
          etat = 'nage'; etatDepuis = t;
          prochaine = t + (rage() ? CADENCE_RAGE : CADENCE);
          majJauges();
        }
        return;
      }
      if (etat === 'etourdi') {
        k = (t - etatDepuis) / ETOURDI;
        pos.x = base.x + Math.sin(t / 60) * 5; pos.y = base.y + 10; echelle = 0.97;
        if (k >= 1) {
          etat = 'nage'; etatDepuis = t;
          prochaine = t + (rage() ? CADENCE_RAGE : CADENCE);
          majJauges();
        }
      }
    }

    function peindre(t) {
      if (!ctx) return;
      ctx.save();
      if (secousse && t - secousse < 380 && !reduit) {
        var s = (1 - (t - secousse) / 380) * 9;
        ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
      }

      // Le ciel noir, les etoiles, et la Terre suspendue.
      ctx.fillStyle = '#03050a';
      ctx.fillRect(-10, -10, CV_L + 20, CV_H + 20);
      ctx.fillStyle = 'rgba(234,247,255,.8)';
      for (var i = 0; i < 70; i++) {
        ctx.fillRect((i * 97) % CV_L, (i * 41) % 150, i % 7 ? 1 : 2, i % 7 ? 1 : 2);
      }
      ctx.fillStyle = '#2a68c4';
      ctx.beginPath(); ctx.arc(404, 52, 22, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#3d8b38';
      ctx.fillRect(394, 44, 10, 8); ctx.fillRect(408, 56, 8, 6);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fillRect(390, 38, 14, 3);
      ctx.fillStyle = 'rgba(3,5,10,.55)';
      ctx.beginPath(); ctx.arc(412, 56, 22, 0, 6.3); ctx.fill();

      // La falaise et la grotte.
      ctx.fillStyle = '#4a4a46';
      ctx.fillRect(0, 150, CV_L, CV_H - 150);
      ctx.fillStyle = '#5a5a56';
      for (i = 0; i < 12; i++) ctx.fillRect(i * 44, 144 + (i % 3) * 6, 40, 10);
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath(); ctx.ellipse(CV_L / 2, 250, 170, 110, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(CV_L / 2 - 170, 250, 340, 70);

      // Le monstre.
      var f = feuille(etat === 'prepare' || etat === 'frappe');
      if (f) {
        var e = ECH * echelle;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (etat === 'mort') ctx.globalAlpha = Math.max(0, 1 - (t - etatDepuis) / 1400);
        if (etat === 'etourdi') ctx.filter = 'saturate(.3) brightness(.85)';
        ctx.drawImage(f.canvas, pos.x - SL * e / 2, pos.y - SH * e / 2, SL * e, SH * e);
        ctx.restore();
      }

      // Les points faibles, couleur lave.
      if (etat !== 'mort' && !fini) {
        faibles().forEach(function (q, n) {
          var puls = reduit ? 1 : 0.7 + 0.3 * Math.sin(t / 200 + n);
          var rr = q.r * puls;
          var h = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, rr * 1.8);
          h.addColorStop(0, q.gorge ? 'rgba(255,90,60,.95)' : 'rgba(255,168,40,.9)');
          h.addColorStop(0.5, 'rgba(255,92,20,.45)');
          h.addColorStop(1, 'rgba(255,60,0,0)');
          ctx.fillStyle = h;
          ctx.beginPath(); ctx.arc(q.x, q.y, rr * 1.8, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#ffdd7a';
          ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2, rr * 0.4), 0, 6.3); ctx.fill();
        });
      }

      // L'annonce : un cercle rouge qui se referme.
      if (etat === 'prepare') {
        var kp = Math.min(1, (t - etatDepuis) / PREPARE);
        ctx.strokeStyle = 'rgba(232,40,28,' + (0.4 + 0.5 * kp).toFixed(2) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(CV_L / 2, CV_H / 2, 230 * (1 - kp) + 40, 0, 6.3);
        ctx.stroke();
      }

      // Les tirs, les impacts, les chiffres.
      for (var k = tirs.length - 1; k >= 0; k--) {
        var tr = tirs[k], ag = Math.max(0, (t - tr.t0) / 190);
        if (ag >= 1) { tirs.splice(k, 1); continue; }
        ctx.strokeStyle = 'rgba(124,240,255,' + (1 - ag).toFixed(2) + ')';
        ctx.lineWidth = 3 - ag * 2;
        ctx.beginPath(); ctx.moveTo(CV_L / 2, CV_H + 6); ctx.lineTo(tr.x, tr.y); ctx.stroke();
      }
      for (k = eclats.length - 1; k >= 0; k--) {
        var ec = eclats[k], ae = Math.max(0, (t - ec.t0) / 320);
        if (ae >= 1) { eclats.splice(k, 1); continue; }
        ctx.strokeStyle = ec.faible ? 'rgba(255,150,40,' + (1 - ae).toFixed(2) + ')'
                                    : 'rgba(210,220,230,' + (1 - ae).toFixed(2) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ec.x, ec.y, 3 + ae * (ec.faible ? 26 : 14), 0, 6.3); ctx.stroke();
      }
      ctx.textAlign = 'center';
      for (k = chiffres.length - 1; k >= 0; k--) {
        var c = chiffres[k], ac = Math.max(0, (t - c.t0) / (c.gros ? 1100 : 800));
        if (ac >= 1) { chiffres.splice(k, 1); continue; }
        ctx.font = 'bold ' + (c.gros ? 20 : 15) + 'px "Courier New", monospace';
        ctx.fillStyle = c.vide ? 'rgba(180,200,215,' + (1 - ac).toFixed(2) + ')'
          : c.moi ? 'rgba(255,90,74,' + (1 - ac).toFixed(2) + ')'
          : c.faible ? 'rgba(255,176,46,' + (1 - ac).toFixed(2) + ')'
          : 'rgba(234,247,255,' + (1 - ac).toFixed(2) + ')';
        ctx.fillText(c.txt, c.x, c.y - ac * 26);
      }
      ctx.textAlign = 'left';

      // Le viseur.
      if (!fini && etat !== 'mort') {
        var pret = t - dernierTir >= nv.cadence;
        ctx.strokeStyle = pret ? '#7cf0ff' : 'rgba(124,240,255,.35)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(viseur.x, viseur.y, 11, 0, 6.3); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(viseur.x - 17, viseur.y); ctx.lineTo(viseur.x - 5, viseur.y);
        ctx.moveTo(viseur.x + 5, viseur.y); ctx.lineTo(viseur.x + 17, viseur.y);
        ctx.moveTo(viseur.x, viseur.y - 17); ctx.lineTo(viseur.x, viseur.y - 5);
        ctx.moveTo(viseur.x, viseur.y + 5); ctx.lineTo(viseur.x, viseur.y + 17);
        ctx.stroke();
        if (!pret) {
          var kk = Math.max(0, Math.min(1, (t - dernierTir) / nv.cadence));
          ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(viseur.x, viseur.y, 15, -1.57, -1.57 + kk * 6.283); ctx.stroke();
        }
      }
      ctx.restore();

      // Le coup recu : l'ecran vire au rouge.
      if (flash && t - flash < 450) {
        ctx.fillStyle = 'rgba(200,20,16,' + (0.45 * (1 - (t - flash) / 450)).toFixed(2) + ')';
        ctx.fillRect(0, 0, CV_L, CV_H);
      }
    }

    // --- Les commandes ---
    function versCanevas(ev) {
      var r = cv.getBoundingClientRect();
      var src = ev.touches ? ev.touches[0] : ev;
      viseur.x = Math.max(0, Math.min(CV_L, (src.clientX - r.left) * CV_L / r.width));
      viseur.y = Math.max(0, Math.min(CV_H, (src.clientY - r.top) * CV_H / r.height));
    }
    function surPointeur(ev) { versCanevas(ev); }
    function surClic(ev) { ev.preventDefault(); versCanevas(ev); tirer(performance.now()); }
    function surTouche(ev) {
      var pas = 18;
      if (ev.key === 'ArrowLeft') viseur.x = Math.max(0, viseur.x - pas);
      else if (ev.key === 'ArrowRight') viseur.x = Math.min(CV_L, viseur.x + pas);
      else if (ev.key === 'ArrowUp') viseur.y = Math.max(0, viseur.y - pas);
      else if (ev.key === 'ArrowDown') viseur.y = Math.min(CV_H, viseur.y + pas);
      else if (ev.key === ' ' || ev.key === 'Enter') tirer(performance.now());
      else return;
      ev.preventDefault();
    }
    cv.addEventListener('mousemove', surPointeur);
    cv.addEventListener('mousedown', surClic);
    cv.addEventListener('touchstart', surClic, { passive: false });
    cv.addEventListener('touchmove', function (ev) { ev.preventDefault(); versCanevas(ev); },
                        { passive: false });
    window.addEventListener('keydown', surTouche);

    // --- La fin ---
    function mourir(t) {
      etat = 'mort'; etatDepuis = t; fini = true;
      hote.dataset.phase = 'victoire';
      var r = recompenser();
      setTimeout(function () {
        if (hote.isConnected) montrerFin(true, r);
      }, reduit ? 0 : 1300);
      if (cfg.surFin) cfg.surFin({ vaincu: true, pvJoueur: pvJ, recompenses: r });
    }

    function perdre(t) {
      fini = true;
      hote.dataset.phase = 'echec';
      setTimeout(function () {
        if (hote.isConnected) montrerFin(false, null);
      }, reduit ? 0 : 700);
      if (cfg.surFin) cfg.surFin({ vaincu: false, pvJoueur: 0 });
    }

    function recompenser() {
      DP.compterExploit('selenophage');
      DP.noterScan('selenophage', 'lune');
      DP.gagnerRoches(RECOMPENSE.roches);
      DP.earn('pink', RECOMPENSE.temporel);
      var rev = null;
      if (DP.aLArme() && !DP.aRevetement(RECOMPENSE.revetement)) {
        DP.acquerirRevetement(RECOMPENSE.revetement);
        rev = window.ARME ? window.ARME.revetement(RECOMPENSE.revetement) : null;
      }
      return { roches: RECOMPENSE.roches, temporel: RECOMPENSE.temporel, revetement: rev };
    }

    function montrerFin(vaincu, r) {
      fin.hidden = false;
      fin.textContent = '';
      var carte = document.createElement('div');
      carte.className = 'bs-carte ' + (vaincu ? 'is-victoire' : 'is-echec');
      function ligne(cls, txt) {
        var n = document.createElement('p');
        n.className = cls; n.textContent = txt; carte.appendChild(n); return n;
      }
      ligne('bs-carte-titre', vaincu ? 'LE SÉLÉNOPHAGE EST TOMBÉ' : 'RAPATRIEMENT D’URGENCE');
      ligne('bs-carte-txt', vaincu
        ? 'Il s’enfonce dans sa grotte et ne remonte pas. La base est silencieuse, pour la première fois depuis des années.'
        : 'Le Téléportail t’a arraché à la grotte juste à temps. La bête t’attend toujours.');
      if (vaincu && r) {
        var butin = document.createElement('div');
        butin.className = 'bs-butin';
        [['☀ × ' + r.roches + ' Roches Solaires', 'roche'],
         ['Crédit Temporel × ' + r.temporel, 'credit']]
          .forEach(function (g) {
            var s = document.createElement('span');
            s.className = 'bs-gain bs-gain--' + g[1];
            s.textContent = g[0];
            butin.appendChild(s);
          });
        carte.appendChild(butin);
        if (r.revetement) ligne('bs-revetement', 'Nouveau revêtement : ' + r.revetement.nom);
        ligne('bs-carte-txt bs-carte-txt--sous', 'Le Sélénophage entre à ton carnet du scanner.');
      }
      var b = document.createElement('button');
      b.className = 'bs-btn'; b.type = 'button';
      b.textContent = vaincu ? 'Continuer' : 'Retour au Téléportail';
      b.addEventListener('click', fermer);
      carte.appendChild(b);
      fin.appendChild(carte);
      b.focus();
    }

    function fermer() {
      arreter();
      if (cfg.surSortie) cfg.surSortie({ pvJoueur: pvJ, vaincu: pv <= 0 });
    }

    function arreter() {
      fini = true;
      if (brut) cancelAnimationFrame(brut);
      window.removeEventListener('keydown', surTouche);
      if (hote.parentNode) hote.parentNode.removeChild(hote);
    }

    majJauges();
    brut = requestAnimationFrame(image);

    return {
      hote: hote, arreter: arreter, fermer: fermer,
      etat: function () { return { pv: pv, pvJoueur: pvJ, etat: etat, fini: fini }; },
      // Pour les essais : une touche faible, sans viser.
      _toucher: function (idx) {
        var f = faibles()[idx || 0];
        viseur.x = f.x; viseur.y = f.y; dernierTir = -9999;
        tirer(performance.now());
      }
    };
  }

  window.BOSS = {
    PV: PV, COUP: COUP, COUP_RAGE: COUP_RAGE, CADENCE: CADENCE, PREPARE: PREPARE,
    POUR_INTERROMPRE: POUR_INTERROMPRE, RECOMPENSE: RECOMPENSE,
    FAIBLES: FAIBLES, feuille: feuille, Duel: Duel
  };
})();
