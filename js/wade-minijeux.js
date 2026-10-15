// Wade and Friends : les jeux caches, facon MS-DOS.
//
// Trois petits jeux, lances par les secrets des nuits (js/wade-secrets.js).
// Ecran de 320 x 200 en 16 couleurs EGA, police bitmap, bips de
// haut-parleur PC, et le demarrage en ligne de commande.
//   charlie : porter le steak jusqu'a l'enfant qui pleure ;
//   stephen : manger les trois poissons dores parmi tous les autres ;
//   wade    : trouver les cinq moutons d'emeraude dans le troupeau.
(function () {

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function hasard(a, b) { return a + Math.random() * (b - a); }

  var W = 320, H = 200;
  var EGA = ['#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
             '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff'];

  // ==========================================================
  //  La police : 5 x 7, en majuscules
  // ==========================================================

  var GLYPHES = {
    A: '0E11111F111111', B: '1E11111E11111E', C: '0E11101010110E', D: '1E11111111111E',
    E: '1F10101E10101F', F: '1F10101E101010', G: '0E1110171111 0F', H: '1111111F111111',
    I: '0E04040404040E', J: '07020202 02120C', K: '11121418141211', L: '1010101010101F',
    M: '111B1515111111', N: '11111915131111', O: '0E11111111110E', P: '1E11111E101010',
    Q: '0E111111151 20D', R: '1E11111E141211', S: '0F10100E01011E', T: '1F040404040404',
    U: '1111111111110E', V: '11111111110A04', W: '1111111515150A', X: '11110A040A1111',
    Y: '11110A04040404', Z: '1F01020408101F',
    '0': '0E11131519110E', '1': '040C040404040E', '2': '0E11010204081F', '3': '1F02040201110E',
    '4': '02060A121F0202', '5': '1F101E0101110E', '6': '0608101E11110E', '7': '1F010204080808',
    '8': '0E11110E11110E', '9': '0E11110F01020C',
    ':': '000C0C000C0C00', '.': '00000000000C0C', '!': '04040404040004', '?': '0E110102040004',
    '-': '0000001F000000', '>': '08040201020408', '<': '02040810080402', '\\': '10100804020101',
    '/': '01010204081010', "'": '04040800000000', ',': '00000000 0C0408', '_': '0000000000001F',
    '(': '02040808080402', ')': '08040202020408', '+': '0004041F040400', '=': '00001F001F0000',
    '%': '18190204081303', '*': '00150E1F0E1500'
  };
  Object.keys(GLYPHES).forEach(function (k) { GLYPHES[k] = GLYPHES[k].replace(/\s/g, ''); });

  function texte(x, s, X, Y, coul, ech) {
    ech = ech || 1;
    s = String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    x.fillStyle = coul;
    for (var i = 0; i < s.length; i++) {
      var g = GLYPHES[s[i]];
      if (g) {
        for (var r = 0; r < 7; r++) {
          var v = parseInt(g.substr(r * 2, 2), 16);
          for (var c = 0; c < 5; c++) if (v & (16 >> c)) x.fillRect(X + (i * 6 + c) * ech, Y + r * ech, ech, ech);
        }
      }
    }
  }
  function largeur(s, ech) { return String(s).length * 6 * (ech || 1) - (ech || 1); }
  function centre(x, s, Y, coul, ech) { texte(x, s, Math.round((W - largeur(s, ech)) / 2), Y, coul, ech); }

  // ==========================================================
  //  Les sprites : des grilles de caracteres, une couleur par lettre
  // ==========================================================

  function sprite(lignes, pal) {
    var h = lignes.length, w = lignes[0].length;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d');
    for (var y = 0; y < h; y++) {
      for (var i = 0; i < w; i++) {
        var k = lignes[y][i];
        if (k === '.' || !pal[k]) continue;
        x.fillStyle = pal[k];
        x.fillRect(i, y, 1, 1);
      }
    }
    return c;
  }
  function miroir(sp) {
    var c = document.createElement('canvas'); c.width = sp.width; c.height = sp.height;
    var x = c.getContext('2d'); x.translate(sp.width, 0); x.scale(-1, 1); x.drawImage(sp, 0, 0);
    return c;
  }

  // Un animatronique en sprite de balade (24 x 34), comme dans The Founder
  // War. dir : 'bas', 'gauche', 'droite', 'haut' ; pose : 0 a 3.
  function chibi(x, id, dir, pose, X, Y) {
    var C = window.CHIBI, f = C && C.feuille(id);
    if (!f) return;
    var d = C.DIRS[dir] || 0;
    x.drawImage(f.canvas || f, (pose % C.POSES) * C.L, d * C.H, C.L, C.H, Math.round(X), Math.round(Y), C.L, C.H);
  }

  // ==========================================================
  //  Le haut-parleur PC
  // ==========================================================

  var ac = null;
  function bip(f, d, type, vol) {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(vol || 0.05, t);
      g.gain.setValueAtTime(vol || 0.05, t + d * 0.8);
      g.gain.linearRampToValueAtTime(0, t + d);
      o.connect(g); g.connect(ac.destination);
      o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }
  function air(notes, tempo) {
    notes.forEach(function (n, i) { setTimeout(function () { if (n) bip(n, tempo * 0.9); }, i * tempo * 1000); });
  }

  // ==========================================================
  //  Le cadre commun : ecran, clavier, commandes tactiles
  // ==========================================================

  function lancer(hote, jeu, fini) {
    var box = el('div', 'wfj');
    var ecran = el('div', 'wfj-ecran');
    var cv = el('canvas', 'wfj-cv');
    cv.width = W; cv.height = H;
    ecran.appendChild(cv);
    box.appendChild(ecran);
    var x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;

    // Les commandes tactiles : une croix et un bouton.
    var pad = el('div', 'wfj-pad');
    var touches = {};
    function btn(cls, txt, cle) {
      var b = el('button', 'wfj-btn ' + cls, txt);
      b.type = 'button';
      b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); touches[cle] = true; appui(cle); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) {
        b.addEventListener(t, function () { touches[cle] = false; });
      });
      pad.appendChild(b);
    }
    btn('wfj-btn--g', '◀', 'gauche'); btn('wfj-btn--d', '▶', 'droite');
    btn('wfj-btn--h', '▲', 'haut'); btn('wfj-btn--b', '▼', 'bas');
    btn('wfj-btn--a', 'A', 'action');
    box.appendChild(pad);
    var quitterB = el('button', 'wfj-quitter', 'ÉCHAP · QUITTER');
    quitterB.type = 'button';
    quitterB.addEventListener('click', function () { finir(false); });
    box.appendChild(quitterB);
    hote.appendChild(box);

    var CLES = { arrowleft: 'gauche', q: 'gauche', a: 'gauche', arrowright: 'droite', d: 'droite',
                 arrowup: 'haut', z: 'haut', w: 'haut', arrowdown: 'bas', s: 'bas',
                 ' ': 'action', enter: 'action' };
    function clavier(ev) {
      var k = (ev.key || '').toLowerCase();
      if (k === 'escape') { ev.preventDefault(); finir(false); return; }
      var c = CLES[k];
      if (!c) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.type === 'keydown') { if (!touches[c]) appui(c); touches[c] = true; }
      else touches[c] = false;
    }
    window.addEventListener('keydown', clavier, true);
    window.addEventListener('keyup', clavier, true);

    var J = JEUX[jeu](x, touches);
    var phase = 'boot', tp = 0, boot = BOOT(jeu.toUpperCase() + '.EXE');
    function appui(c) {
      if (phase === 'titre' && c === 'action') { phase = 'jeu'; tp = 0; J.debut(); bip(880, 0.08); }
      else if (phase === 'perdu' && c === 'action') { phase = 'jeu'; tp = 0; J.debut(); }
      else if (phase === 'jeu' && J.appui) J.appui(c);
    }

    var avant = 0, raf = 0, fin = false, acc = 0;
    function image(ms) {
      if (fin) return;
      if (!document.body.contains(box)) { finir(false); return; }
      var dt = avant ? Math.min(0.1, (ms - avant) / 1000) : 0;
      avant = ms;
      tp += dt;
      x.setTransform(1, 0, 0, 1, 0, 0);
      if (phase === 'boot') {
        if (boot(x, tp)) { phase = 'titre'; tp = 0; air([523, 659, 784, 1047], 0.12); }
      } else if (phase === 'titre') {
        J.titre(tp);
        if (Math.floor(tp * 2) % 2) centre(x, 'APPUIE SUR ENTREE / A', 176, EGA[15]);
      } else if (phase === 'jeu') {
        // Le jeu tourne a pas fixe : 60 fois par seconde.
        acc += dt;
        while (acc > 1 / 60) {
          acc -= 1 / 60;
          var r = J.pas(1 / 60);
          if (r === 'gagne') { phase = 'gagne'; tp = 0; air([523, 659, 784, 1047, 1319], 0.14); break; }
          if (r === 'perdu') { phase = 'perdu'; tp = 0; air([392, 330, 262, 196], 0.18); break; }
        }
        J.dessin();
      } else if (phase === 'gagne') {
        J.dessin();
        if (J.victoire) J.victoire(tp);
        if (tp > 4.2) finir(true);
      } else if (phase === 'perdu') {
        J.dessin();
        x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 70, W, 60);
        centre(x, 'PERDU', 80, EGA[12], 2);
        if (Math.floor(tp * 2) % 2) centre(x, 'ENTREE / A : REJOUER', 106, EGA[15]);
        centre(x, 'ECHAP : RETOUR A LA NUIT', 118, EGA[7]);
      }
      raf = requestAnimationFrame(image);
    }
    raf = requestAnimationFrame(image);

    function finir(gagne) {
      if (fin) return;
      fin = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', clavier, true);
      window.removeEventListener('keyup', clavier, true);
      box.classList.add('is-sortie');
      setTimeout(function () { box.remove(); }, 300);
      fini(gagne);
    }
  }

  // Le demarrage : quelques lignes de DOS qui s'ecrivent.
  function BOOT(exe) {
    var L = ['WADE BIOS V1.03  (C) 1987 SST-03 ELECTRONICS', 'MEMOIRE : 640K OK', '',
             'C:\\>CD WADE', 'C:\\WADE>' + exe, 'CHARGEMENT...'];
    return function (x, t) {
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      var n = Math.floor(t * 18), y = 8;
      for (var i = 0; i < L.length; i++) {
        var l = L[i].slice(0, Math.max(0, n));
        n -= L[i].length + 4;
        texte(x, l, 6, y, EGA[7]);
        y += 10;
        if (n <= 0) { if (Math.floor(t * 3) % 2) x.fillRect(6 + largeur(l) + 2, y - 10, 5, 7); break; }
      }
      return t > 3.2;
    };
  }

  // ==========================================================
  //  Les jeux
  // ==========================================================

  var JEUX = {};

  // ---------- CHARLIE : le steak ----------
  JEUX.charlie = function (x, T) {
    var PAL = { b: '#aa5500', B: '#552a00', k: '#000000', w: '#ffffff', p: '#ff5555', y: '#ffff55', r: '#aa0000' };
    var CH = [
      '................',
      '..BB......BB....',
      '.BbbB....BbbB...',
      '.BbbbBBBBbbbB...',
      'BbbbbbbbbbbbbBBB',
      'BbbwkbbbbbbwkbbB',
      'BbbbbbbbbbbbbbbB',
      'BbbbbbkkbbbbbbbB',
      '.BbbbbbbbbbbbbB.',
      '..BbbbbbbbbbbB..',
      '..BbbBBBBBBbbB..',
      '..BBB......BBB..'];
    var CH2 = CH.slice(0, 10).concat(['..BbbBBBBBBbbB..', '...BBB....BBB...']);
    var sCH = [sprite(CH, PAL), sprite(CH2, PAL)], sCHg = sCH.map(miroir);
    var STEAK = sprite(['.rrrr.', 'rpppwr', 'rppppr', '.rrrr.'], PAL);
    var PAL2 = { s: '#ffff55', h: '#aa5500', c: '#5555ff', w: '#ffffff', k: '#000000', l: '#55ffff', m: '#aa0000' };
    var ENF = sprite([
      '..hhhh..', '.hhhhhh.', '.hssssh.', '.skssks.', '.ssssss.', '.ssmmss.', '..ssss..',
      '.cccccc.', 'cccccccc', 'sccccccs', '.cccccc.', '.cc..cc.', '.cc..cc.', '.kk..kk.'], PAL2);
    var ENFc = sprite([
      '..hhhh..', '.hhhhhh.', '.hssssh.', '.swssws.', '.ssssss.', '.smssms.', '..smms..',
      '.cccccc.', 'cccccccc', 'sccccccs', '.cccccc.', '.cc..cc.', '.cc..cc.', '.kk..kk.'], PAL2);

    // Le niveau : des colonnes de sol (hauteur en pixels depuis le bas),
    // 0 pour un trou. Des fourchettes, des flammes de gril qui crachent.
    var LONG = 1700, sol = [];
    var TRAMES = [[0, 220, 40], [220, 260, 0], [260, 420, 40], [420, 470, 0], [470, 560, 70], [560, 610, 0],
                  [610, 760, 40], [760, 800, 0], [800, 860, 60], [860, 900, 0], [900, 960, 80], [960, 1010, 0],
                  [1010, 1200, 40], [1200, 1260, 0], [1260, 1330, 55], [1330, 1380, 0], [1380, 1700, 40]];
    TRAMES.forEach(function (t) { for (var i = t[0]; i < t[1]; i++) sol[i] = t[2]; });
    var PLATS = [[300, 110, 50], [640, 120, 40], [1080, 115, 50], [1140, 90, 40]];
    var FOURCHETTES = [340, 680, 1050, 1440, 1460];
    var GRILS = [[520, 0], [1110, 1.2], [1550, 0.6]];
    var DRAPEAUX = [610, 1010];
    var c, cam, mort, gagne, depuis;

    function hauteur(px) { var h = sol[Math.floor(px)]; return h === undefined ? 0 : h; }
    function debut() {
      var r = c && c.repart ? c.repart : 20;
      c = { x: r, y: H - 40 - 12, vx: 0, vy: 0, sol: true, dir: 1, repart: r, anim: 0, coyote: 0 };
      cam = Math.max(0, r - 60); mort = 0; gagne = false; depuis = 0;
    }
    function solSous(px, py) {
      var best = H - hauteur(px);
      PLATS.forEach(function (p) { if (px >= p[0] && px <= p[0] + p[2] && py <= p[1] + 1) best = Math.min(best, p[1]); });
      return best;
    }
    function pas(dt) {
      depuis += dt;
      if (mort) { mort -= dt; if (mort <= 0) debut(); return; }
      if (gagne) return 'gagne';
      var acc = T.gauche ? -1 : T.droite ? 1 : 0;
      c.vx += acc * 0.35; c.vx *= 0.86;
      if (acc) c.dir = acc;
      c.vy += 0.32;
      c.coyote = c.sol ? 0.1 : c.coyote - dt;
      var xAvant = c.x;
      c.x += c.vx; c.y += c.vy;
      c.x = Math.max(4, Math.min(LONG - 20, c.x));
      // Une marche plus haute que les pieds : on bute dessus.
      var bord = c.x + 8 + (c.vx > 0 ? 6 : -6), hb = hauteur(bord);
      if (hb && c.y + 12 > H - hb + 3) { c.x = xAvant; c.vx = 0; }
      var bas = solSous(c.x + 8, c.y + 12 - c.vy);
      c.sol = false;
      if (c.vy >= 0 && c.y + 12 >= bas && c.y + 12 - c.vy <= bas + 2) { c.y = bas - 12; c.vy = 0; c.sol = true; }
      if (Math.abs(c.vx) > 0.3) c.anim += dt * 10;
      DRAPEAUX.forEach(function (d) { if (c.x > d) c.repart = Math.max(c.repart, d + 4); });
      if (c.y > H) { mort = 1; bip(150, 0.3, 'sawtooth'); return; }
      FOURCHETTES.forEach(function (f) {
        if (Math.abs(c.x + 8 - f) < 7 && c.y + 12 > H - hauteur(f) - 9) { mort = 1; bip(200, 0.25, 'sawtooth'); }
      });
      GRILS.forEach(function (g) {
        var actif = (depuis + g[1]) % 2.4 < 1.0;
        if (actif && Math.abs(c.x + 8 - g[0]) < 10 && c.y + 12 > H - hauteur(g[0]) - 30) { mort = 1; bip(240, 0.3, 'sawtooth'); }
      });
      if (c.x > LONG - 70) gagne = true;
      cam += (Math.max(0, Math.min(LONG - W, c.x - 120)) - cam) * 0.12;
    }
    function appui(k) {
      if ((k === 'action' || k === 'haut') && (c.sol || c.coyote > 0) && !mort) { c.vy = -5.6; c.sol = false; c.coyote = 0; bip(660, 0.06); }
    }
    function dessin() {
      x.fillStyle = EGA[1]; x.fillRect(0, 0, W, H);
      // Le ciel : des etoiles, une lune, et la Maison du Burger au loin.
      for (var i = 0; i < 40; i++) { x.fillStyle = EGA[i % 3 ? 7 : 15]; x.fillRect((i * 97 - cam * 0.1) % W, (i * 53) % 90, 1, 1); }
      // Un croissant de lune : un disque, mange par un autre.
      var lx = Math.round(266 - cam * 0.05);
      for (var ly = -8; ly <= 8; ly++) {
        for (var lz = -8; lz <= 8; lz++) {
          if (lz * lz + ly * ly > 64) continue;
          if ((lz - 4) * (lz - 4) + (ly + 2) * (ly + 2) <= 49) continue;
          x.fillStyle = EGA[14]; x.fillRect(lx + lz, 26 + ly, 1, 1);
        }
      }
      for (i = 0; i < 8; i++) { x.fillStyle = EGA[8]; x.fillRect(i * 70 - (cam * 0.3) % 70, 110 + (i % 3) * 10, 50, 90); }
      x.save(); x.translate(-Math.round(cam), 0);
      for (var px = Math.floor(cam); px < cam + W; px++) {
        var h = hauteur(px);
        if (!h) continue;
        x.fillStyle = EGA[2]; x.fillRect(px, H - h, 1, 3);
        x.fillStyle = EGA[6]; x.fillRect(px, H - h + 3, 1, h - 3);
        if ((px * 7) % 11 === 0) { x.fillStyle = EGA[0]; x.fillRect(px, H - h + 6 + (px % 5) * 4, 1, 1); }
      }
      PLATS.forEach(function (p) { x.fillStyle = EGA[7]; x.fillRect(p[0], p[1], p[2], 4); x.fillStyle = EGA[8]; x.fillRect(p[0], p[1] + 4, p[2], 2); });
      FOURCHETTES.forEach(function (f) {
        var y0 = H - hauteur(f);
        x.fillStyle = EGA[7];
        x.fillRect(f - 1, y0 - 12, 2, 12);
        for (var d = -4; d <= 4; d += 4) x.fillRect(f + d - 0, y0 - 18, 1, 7);
        x.fillRect(f - 4, y0 - 12, 9, 1);
      });
      GRILS.forEach(function (g) {
        var y0 = H - hauteur(g[0]), actif = (depuis + g[1]) % 2.4 < 1.0;
        x.fillStyle = EGA[8]; x.fillRect(g[0] - 9, y0 - 4, 18, 4);
        if (actif) {
          for (var k = 0; k < 7; k++) {
            x.fillStyle = EGA[[12, 14, 4][k % 3]];
            var hh = 10 + Math.random() * 20;
            x.fillRect(g[0] - 8 + k * 2.4, y0 - 4 - hh, 2, hh);
          }
        } else if (Math.random() < 0.3) { x.fillStyle = EGA[4]; x.fillRect(g[0] - 2 + Math.random() * 4, y0 - 7, 1, 2); }
      });
      DRAPEAUX.forEach(function (d) {
        var y0 = H - hauteur(d);
        x.fillStyle = EGA[7]; x.fillRect(d, y0 - 20, 1, 20);
        x.fillStyle = c.repart > d ? EGA[10] : EGA[12]; x.fillRect(d + 1, y0 - 20, 7, 5);
      });
      // L'enfant qui pleure, au bout.
      var ex = LONG - 40, ey = H - hauteur(ex) - 14;
      x.drawImage(gagne ? ENFc : ENF, ex, ey);
      if (!gagne) {
        x.fillStyle = EGA[11];
        x.fillRect(ex + 2, ey + 4 + (depuis * 20) % 8, 1, 2);
        x.fillRect(ex + 5, ey + 4 + (depuis * 20 + 4) % 8, 1, 2);
        if (Math.floor(depuis * 2) % 2) texte(x, 'OUIN', ex - 6, ey - 12, EGA[11]);
      }
      // Charlie, son steak au-dessus de la tete.
      if (!(mort && Math.floor(mort * 12) % 2)) {
        // Les pieds a c.y + 12, comme avant : le sprite monte au-dessus.
        var pose = Math.abs(c.vx) > 0.3 ? Math.floor(c.anim) % 4 : 0;
        chibi(x, 'charlie-capsule', c.dir > 0 ? 'droite' : 'gauche', pose, c.x - 4, c.y + 12 - 34);
        if (!gagne) x.drawImage(STEAK, Math.round(c.x) + 5, Math.round(c.y) - 27);
        else x.drawImage(STEAK, ex + 1, ey + 9);
      }
      x.restore();
      texte(x, 'CHARLIE', 4, 4, EGA[14]);
      texte(x, 'APPORTE LE STEAK A L\'ENFANT', 60, 4, EGA[15]);
      var k2 = Math.min(1, c.x / (LONG - 70));
      x.fillStyle = EGA[8]; x.fillRect(4, 14, 80, 3); x.fillStyle = EGA[10]; x.fillRect(4, 14, 80 * k2, 3);
    }
    function titre(t) {
      x.fillStyle = EGA[0]; x.fillRect(0, 0, W, H);
      centre(x, 'CHARLIE', 40, EGA[14], 3);
      centre(x, 'ET LE STEAK PERDU', 72, EGA[12], 2);
      chibi(x, 'charlie-capsule', 'droite', Math.floor(t * 4) % 4, 118, 92); x.drawImage(STEAK, 127, 86);
      x.drawImage(ENF, 190, 108);
      centre(x, 'FLECHES : MARCHER   ESPACE : SAUTER', 150, EGA[7]);
    }
    function victoire(t) {
      x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 76, W, 40);
      if (t > 2.6 && t < 3.1) {
        // Une image, une seule, qui n'aurait pas du etre la.
        x.fillStyle = EGA[4]; x.fillRect(0, 0, W, H);
        centre(x, 'IL A ENCORE FAIM', 92, EGA[0], 2);
        return;
      }
      centre(x, 'MERCI CHARLIE !', 86, EGA[10], 2);
    }
    debut();
    return { debut: debut, pas: pas, appui: appui, dessin: dessin, titre: titre, victoire: victoire };
  };

  // ---------- STEPHEN : les poissons dores ----------
  JEUX.stephen = function (x, T) {
    var PAL = { g: '#aaaaaa', G: '#555555', w: '#ffffff', k: '#000000', y: '#ffff55', r: '#aa0000' };
    var REQ = sprite([
      '..........G.............',
      '.........GgG............',
      '......GGGgggGGGG......G.',
      '....GGgggggggggggGG..Gg.',
      '..GGgggkggggggggggggGgG.',
      '.Gggggggggggggggggggggg.',
      'Gwwwwwwgggggggggggggg.Gg',
      '.GwkwkwwwwwggggggGGG...G',
      '..GGwwwwwwwwwwGGG.......',
      '....GGGGGGGGGG..........'], PAL);
    var REQg = miroir(REQ);
    var stp, poissons, vies, dores, msg, depuis;
    function poisson(dore) {
      var c = dore ? 14 : [11, 13, 10, 12, 9, 6, 3][Math.floor(Math.random() * 7)];
      return { x: Math.random() * W, y: 30 + Math.random() * 140, v: hasard(0.4, 1.0) * (Math.random() < 0.5 ? -1 : 1),
               ph: Math.random() * 6, c: c, dore: dore, taille: dore ? 1 : (Math.random() < 0.3 ? 2 : 1) };
    }
    function debut() {
      stp = { x: 40, y: 100, vx: 0, vy: 0, dir: 1, gueule: 0 };
      poissons = [];
      for (var i = 0; i < 46; i++) poissons.push(poisson(false));
      for (i = 0; i < 3; i++) poissons.push(poisson(true));
      vies = 5; dores = 0; msg = null; depuis = 0;
    }
    function pas(dt) {
      depuis += dt;
      var ax = (T.droite ? 1 : 0) - (T.gauche ? 1 : 0), ay = (T.bas ? 1 : 0) - (T.haut ? 1 : 0);
      stp.vx = (stp.vx + ax * 0.25) * 0.93; stp.vy = (stp.vy + ay * 0.25) * 0.93;
      stp.x = Math.max(0, Math.min(W - 24, stp.x + stp.vx)); stp.y = Math.max(22, Math.min(H - 26, stp.y + stp.vy));
      if (ax) stp.dir = ax;
      stp.gueule = Math.max(0, stp.gueule - dt);
      var bx = stp.x + 12 + stp.dir * 9, by = stp.y + 6;
      for (var i = poissons.length - 1; i >= 0; i--) {
        var p = poissons[i];
        p.ph += dt * 3;
        // Les dores fuient le requin.
        if (p.dore) {
          var dx = p.x - bx, dy = p.y - by, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 40) { p.v += (dx > 0 ? 0.05 : -0.05); p.y += dy > 0 ? 0.35 : -0.35; }
          p.v = Math.max(-1.5, Math.min(1.5, p.v)) * 0.99;
          if (Math.abs(p.v) < 0.5) p.v = p.v < 0 ? -0.5 : 0.5;
        }
        p.x += p.v; p.y += Math.sin(p.ph) * 0.3;
        p.y = Math.max(26, Math.min(H - 20, p.y));
        if (p.x < -10) p.x = W + 8; if (p.x > W + 10) p.x = -8;
        if (depuis > 1.5 && Math.abs(p.x - bx) < 6 && Math.abs(p.y - by) < 6) {
          poissons.splice(i, 1);
          stp.gueule = 0.25;
          if (p.dore) { dores++; msg = { t: 'MIAM !', c: 14, fin: depuis + 1 }; air([784, 1047], 0.08); }
          else { msg = { t: 'BEURK !', c: 12, fin: depuis + 1 }; bip(130, 0.2, 'sawtooth'); poissons.push(poisson(false)); }
        }
      }
      if (dores >= 3) return 'gagne';
    }
    function dessin() {
      x.fillStyle = EGA[1]; x.fillRect(0, 0, W, H);
      for (var y = 20; y < H; y += 4) { x.fillStyle = (y / 4) % 2 ? '#0000a0' : EGA[1]; x.fillRect(0, y, W, 2); }
      x.fillStyle = EGA[6]; x.fillRect(0, H - 12, W, 12);
      x.fillStyle = EGA[14]; for (var i = 0; i < W; i += 5) x.fillRect(i, H - 12 + (i % 3), 1, 1);
      for (i = 0; i < 9; i++) {
        var ax = 18 + i * 36;
        for (var k = 0; k < 6; k++) { x.fillStyle = EGA[2]; x.fillRect(ax + Math.round(Math.sin(depuis * 1.5 + k * 0.7 + i) * 2), H - 12 - k * 5, 2, 5); }
      }
      for (i = 0; i < 12; i++) { x.fillStyle = EGA[11]; x.fillRect((i * 29) % W, H - ((depuis * 30 + i * 47) % (H - 20)), 1, 1); }
      poissons.forEach(function (p) {
        var X = Math.round(p.x), Y = Math.round(p.y), d = p.v > 0 ? 1 : -1, t = p.taille;
        x.fillStyle = EGA[p.c];
        x.fillRect(X - 3 * t, Y - 1 * t, 6 * t, 3 * t);
        x.fillRect(X - 2 * t, Y - 2 * t, 4 * t, 5 * t);
        x.fillRect(d > 0 ? X - 5 * t : X + 3 * t, Y - 2 * t, 2 * t, 5 * t);
        x.fillStyle = EGA[0]; x.fillRect(X + d * 2 * t, Y - 1 * t, 1, 1);
        if (p.dore && Math.floor(depuis * 6 + p.ph) % 9 === 0) { x.fillStyle = EGA[15]; x.fillRect(X, Y - 4, 1, 1); }
      });
      // Il nage : les jambes battent, le corps ondule un peu.
      chibi(x, 'stephen-sharkodon', stp.dir > 0 ? 'droite' : 'gauche', Math.floor(depuis * 8) % 4,
            stp.x, stp.y - 8 + Math.sin(depuis * 5) * 1.5);
      if (stp.gueule > 0) { x.fillStyle = EGA[4]; x.fillRect(Math.round(bx) - 2, Math.round(by), 4, 2); }
      x.fillStyle = EGA[0]; x.fillRect(0, 0, W, 18);
      texte(x, 'STEPHEN', 4, 6, EGA[11]);
      texte(x, 'DORES', 120, 6, EGA[14]);
      for (i = 0; i < 3; i++) { x.fillStyle = i < dores ? EGA[14] : EGA[8]; x.fillRect(156 + i * 9, 7, 6, 5); }
      if (msg && depuis < msg.fin) centre(x, msg.t, 90, EGA[msg.c], 2);
    }
    function titre(t) {
      x.fillStyle = EGA[0]; x.fillRect(0, 0, W, H);
      centre(x, 'STEPHEN', 36, EGA[11], 3);
      centre(x, 'ET LES POISSONS DORES', 68, EGA[14], 2);
      chibi(x, 'stephen-sharkodon', Math.floor(t / 1.5) % 2 ? 'gauche' : 'droite', Math.floor(t * 6) % 4, 148, 92);
      centre(x, 'MANGE LES 3 POISSONS DORES', 132, EGA[15]);
      centre(x, 'LES AUTRES SONT DEGOUTANTS.', 144, EGA[12]);
      centre(x, 'FLECHES : NAGER', 158, EGA[7]);
    }
    function victoire(t) { centre(x, 'BON APPETIT STEPHEN !', 110, EGA[14], 1); }
    debut();
    return { debut: debut, pas: pas, dessin: dessin, titre: titre, victoire: victoire };
  };

  // ---------- WADE : les moutons d'emeraude ----------
  JEUX.wade = function (x, T) {
    var PAL = { g: '#aaaaaa', G: '#555555', w: '#ffffff', k: '#000000', y: '#ffff55', r: '#aa0000' };
    var LOUP = [sprite([
      '.G..........G.', 'GgG........GgG', 'GggG......GggG', '.GggGGGGGGggG.', '.GgggggggggggG', 'GgyggggggggygG',
      'GggggggggggggG', '.GggggkkggggG.', '..GgggrrgggG..', '...GggggggG...', '..GggGGGGggG..', '..GG......GG..'], PAL)];
    var stp, moutons, pris, temps, msg, depuis, eclats;
    function debut() {
      stp = { x: 152, y: 96, dir: 1, anim: 0 };
      moutons = [];
      for (var i = 0; i < 26; i++) moutons.push(mouton(false));
      for (i = 0; i < 5; i++) moutons.push(mouton(true));
      pris = 0; temps = 120; msg = null; depuis = 0; eclats = [];
    }
    function mouton(em) {
      return { x: 20 + Math.random() * 280, y: 30 + Math.random() * 150, vx: 0, vy: 0, t: Math.random() * 3,
               em: em, fuite: 0, ph: Math.random() * 10 };
    }
    function pas(dt) {
      depuis += dt; temps -= dt;
      var ax = (T.droite ? 1 : 0) - (T.gauche ? 1 : 0), ay = (T.bas ? 1 : 0) - (T.haut ? 1 : 0);
      stp.x = Math.max(4, Math.min(W - 18, stp.x + ax * 2.1)); stp.y = Math.max(24, Math.min(H - 16, stp.y + ay * 2.1));
      if (ax) stp.dir = ax;
      if (ax || ay) stp.anim += dt * 8;
      for (var i = moutons.length - 1; i >= 0; i--) {
        var m = moutons[i];
        m.t -= dt;
        if (m.t <= 0) { m.t = hasard(0.8, 3); var a = Math.random() * 6.3, v = Math.random() < 0.4 ? 0 : 0.4; m.vx = Math.cos(a) * v; m.vy = Math.sin(a) * v; }
        m.fuite = Math.max(0, m.fuite - dt);
        var dx = m.x - stp.x, dy = m.y - stp.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (m.fuite > 0) { m.vx = dx / d * 1.2; m.vy = dy / d * 1.2; }
        m.x = Math.max(6, Math.min(W - 16, m.x + m.vx)); m.y = Math.max(26, Math.min(H - 14, m.y + m.vy));
        if (Math.abs(m.x - stp.x) < 10 && Math.abs(m.y - stp.y) < 9) {
          if (m.em) {
            moutons.splice(i, 1); pris++;
            msg = { t: 'EMERAUDE !', c: 10, fin: depuis + 1 };
            for (var k = 0; k < 14; k++) eclats.push({ x: m.x + 6, y: m.y + 4, vx: hasard(-1.5, 1.5), vy: hasard(-2, 0.5), fin: depuis + 0.8 });
            air([880, 1175, 1568], 0.07);
          } else if (m.fuite <= 0) {
            m.fuite = 1.2; temps -= 2;
            msg = { t: 'BEEE ! -2 S', c: 12, fin: depuis + 1 };
            bip(300, 0.08); setTimeout(function () { bip(280, 0.12); }, 90);
          }
        }
      }
      eclats.forEach(function (e) { e.x += e.vx; e.y += e.vy; e.vy += 0.08; });
      eclats = eclats.filter(function (e) { return depuis < e.fin; });
      if (pris >= 5) return 'gagne';
      if (temps <= 0) { temps = 0; return 'perdu'; }
    }
    function dessin() {
      x.fillStyle = EGA[2]; x.fillRect(0, 0, W, H);
      for (var i = 0; i < 160; i++) { x.fillStyle = EGA[i % 2 ? 10 : 0]; x.fillRect((i * 83) % W, 22 + (i * 37) % (H - 22), 1, 2); }
      x.fillStyle = EGA[6];
      for (i = 0; i < W; i += 12) { x.fillRect(i, 22, 2, 8); x.fillRect(i, H - 8, 2, 8); }
      x.fillRect(0, 25, W, 1); x.fillRect(0, H - 5, W, 1);
      var tous = moutons.slice().sort(function (a, b) { return a.y - b.y; });
      var vu = false;
      tous.forEach(function (m) {
        if (!vu && stp.y < m.y) { loup(); vu = true; }
        var X = Math.round(m.x), Y = Math.round(m.y);
        x.fillStyle = EGA[0]; x.fillRect(X + 2, Y + 8, 2, 3); x.fillRect(X + 8, Y + 8, 2, 3);
        x.fillStyle = EGA[15]; x.fillRect(X, Y + 1, 12, 7); x.fillRect(X + 1, Y, 10, 9);
        // La laine d'emeraude : quelques boucles vertes, a peine visibles,
        // et un eclat de temps en temps.
        if (m.em) {
          // Une laine vert d'eau, des boucles d'emeraude, et un eclat
          // qui revient souvent.
          x.fillStyle = '#bfffcf'; x.fillRect(X + 1, Y + 1, 10, 7);
          x.fillStyle = EGA[10];
          x.fillRect(X + 2, Y + 2, 2, 1); x.fillRect(X + 7, Y + 3, 2, 1); x.fillRect(X + 4, Y + 5, 2, 1); x.fillRect(X + 8, Y + 6, 1, 1);
          if (Math.floor(depuis * 5 + m.ph) % 5 === 0) { x.fillStyle = EGA[15]; x.fillRect(X + 5, Y - 4, 1, 4); x.fillRect(X + 3, Y - 2, 5, 1); }
        } else {
          x.fillStyle = EGA[7]; x.fillRect(X + 3, Y + 3, 1, 1); x.fillRect(X + 8, Y + 5, 1, 1);
        }
        var face = m.vx < 0 ? X - 3 : X + 11;
        x.fillStyle = EGA[8]; x.fillRect(face, Y + 1, 4, 4);
        x.fillStyle = EGA[0]; x.fillRect(face + (m.vx < 0 ? 0 : 3), Y + 2, 1, 1);
      });
      if (!vu) loup();
      eclats.forEach(function (e) { x.fillStyle = EGA[Math.random() < 0.5 ? 10 : 15]; x.fillRect(Math.round(e.x), Math.round(e.y), 1, 1); });
      x.fillStyle = EGA[0]; x.fillRect(0, 0, W, 20);
      texte(x, 'WADE', 4, 6, EGA[7]);
      texte(x, 'EMERAUDES ' + pris + '/5', 80, 6, EGA[10]);
      texte(x, 'TEMPS ' + Math.ceil(temps), 230, 6, temps < 15 ? EGA[12] : EGA[15]);
      if (msg && depuis < msg.fin) centre(x, msg.t, 92, EGA[msg.c], 2);
      function loup() {
        x.save();
        var marche = T.gauche || T.droite || T.haut || T.bas;
        var d = T.haut ? 'haut' : T.bas ? 'bas' : stp.dir < 0 ? 'gauche' : 'droite';
        if (!marche) d = stp.vue || 'bas';
        stp.vue = d;
        chibi(x, 'wade-wolhunter', d, marche ? Math.floor(stp.anim) % 4 : 0, stp.x - 5, stp.y + 12 - 34);
        x.restore();
      }
    }
    function titre(t) {
      x.fillStyle = EGA[0]; x.fillRect(0, 0, W, H);
      centre(x, 'WADE', 36, EGA[7], 3);
      centre(x, 'ET LES MOUTONS D\'EMERAUDE', 68, EGA[10], 2);
      chibi(x, 'wade-wolhunter', 'bas', Math.floor(t * 4) % 4, 148, 88);
      centre(x, 'TROUVE LES 5 MOUTONS D\'EMERAUDE', 128, EGA[15]);
      centre(x, 'ILS ONT LA LAINE VERTE ET BRILLENT.', 140, EGA[10]);
      centre(x, 'FLECHES : MARCHER', 156, EGA[7]);
    }
    function victoire(t) { centre(x, 'LE TROUPEAU EST A TOI, WADE.', 110, EGA[10], 1); }
    debut();
    return { debut: debut, pas: pas, dessin: dessin, titre: titre, victoire: victoire };
  };

  window.WADE_MINIJEUX = { lancer: lancer, texte: texte, EGA: EGA };
})();
