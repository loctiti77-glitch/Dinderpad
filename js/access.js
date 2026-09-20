// Identification du DinderPad.
// C'est l'ecran du pad qui demande le code : la carte d'acces vient s'y
// inserer, puis les huit cases apparaissent. Les etapes sont portees par
// l'attribut data-phase du <body>, le style fait le reste.
//
// Le code fait 8 chiffres, en deux morceaux :
//   - les 6 premiers viennent de l'application d'authentification (TOTP
//     standard : 6 chiffres, 30 secondes, SHA-1 -- accepte partout) ;
//   - les 2 derniers sont le code personnel, connu de toi seul.
// Les deux bouts mis ensemble remplissent les 8 cases de la carte d'acces.
//
// ATTENTION : le site est statique, donc le secret et le code personnel
// partent dans le navigateur de chaque visiteur. C'est un portail a theme,
// pas une serrure. Pour une vraie protection il faudra verifier cote serveur.
(function () {

  var CONFIG = {
    secret: 'OZKBMLJHASEIMDWAOVPOMVHPG7PKXXKZ',  // base32, a scanner dans l'app
    digits: 6,       // ce que produit l'application (standard)
    period: 30,      // secondes (standard)
    hash:   'SHA-1', // standard
    pin:    '24',    // <-- TES 2 CHIFFRES : change-les pour ce que tu veux
    drift:  1,       // tolere une fenetre avant et apres (horloges decalees)
    session: 'dinderpad.unlocked'
  };

  // La longueur totale attendue a l'ecran : 6 + 2 = 8 cases.
  var TOTAL = CONFIG.digits + CONFIG.pin.length;

  // ---------- TOTP ----------

  function base32ToBytes(s) {
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    var bits = '', out = [];
    s = String(s).toUpperCase().replace(/[^A-Z2-7]/g, '');
    for (var i = 0; i < s.length; i++) {
      bits += A.indexOf(s.charAt(i)).toString(2).padStart(5, '0');
    }
    for (var j = 0; j + 8 <= bits.length; j += 8) {
      out.push(parseInt(bits.slice(j, j + 8), 2));
    }
    return new Uint8Array(out);
  }

  function counterBytes(counter) {
    var buf = new ArrayBuffer(8), view = new DataView(buf);
    view.setUint32(0, Math.floor(counter / 4294967296));
    view.setUint32(4, counter >>> 0);
    return buf;
  }

  function codeAt(counter) {
    var key = base32ToBytes(CONFIG.secret);
    return crypto.subtle
      .importKey('raw', key, { name: 'HMAC', hash: CONFIG.hash }, false, ['sign'])
      .then(function (k) { return crypto.subtle.sign('HMAC', k, counterBytes(counter)); })
      .then(function (sig) {
        var h = new Uint8Array(sig);
        var o = h[h.length - 1] & 0x0f;
        var bin = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
        var mod = Math.pow(10, CONFIG.digits);
        return String(bin % mod).padStart(CONFIG.digits, '0');
      });
  }

  // Compare sans court-circuit, pour ne pas reveler la bonne reponse
  // chiffre par chiffre via le temps de reponse.
  function same(a, b) {
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  // On coupe la saisie en deux : le bout de l'application, puis le code
  // personnel. Les deux doivent tomber juste.
  function verify(entered) {
    var fromApp = entered.slice(0, CONFIG.digits);
    var fromYou = entered.slice(CONFIG.digits);

    var now = Math.floor(Date.now() / 1000 / CONFIG.period);
    var wanted = [];
    for (var d = -CONFIG.drift; d <= CONFIG.drift; d++) wanted.push(codeAt(now + d));

    return Promise.all(wanted).then(function (list) {
      var appOk = list.some(function (c) { return same(c, fromApp); });
      var pinOk = same(fromYou, CONFIG.pin);
      return appOk && pinOk;
    });
  }

  // ---------- L'ecran ----------

  var lock, input, boxes, msg, phase = 'boot', busy = false;

  function setPhase(p) { phase = p; document.body.dataset.phase = p; }

  function paintBoxes() {
    var v = input.value;
    for (var i = 0; i < TOTAL; i++) {
      var b = boxes.children[i];
      b.textContent = v.charAt(i) || '';
      b.classList.toggle('is-filled', !!v.charAt(i));
      b.classList.toggle('is-active', i === v.length && phase === 'input');
    }
  }

  function unlock(animated) {
    try { sessionStorage.setItem(CONFIG.session, '1'); } catch (e) {}

    function open() {
      setPhase('done');
      document.body.classList.remove('is-locked');
      // On laisse le fondu se terminer avant de retirer l'ecran du DOM.
      setTimeout(function () {
        lock.remove();
        var card = document.getElementById('lockCard');
        if (card) card.remove();
      }, 700);
    }

    if (!animated) { open(); return; }
    setPhase('welcome');
    setTimeout(open, 1800);
  }

  function refuse() {
    busy = false;
    document.body.classList.add('is-wrong');
    msg.textContent = 'Code refusé.';
    setTimeout(function () {
      document.body.classList.remove('is-wrong');
      input.value = '';
      paintBoxes();
      input.focus();
    }, 620);
  }

  function submit() {
    if (busy || input.value.length !== TOTAL) return;
    busy = true;
    msg.textContent = 'Vérification…';

    verify(input.value).then(function (ok) {
      if (ok) { msg.textContent = ''; unlock(true); }
      else refuse();
    }).catch(function () {
      busy = false;
      msg.textContent = 'Vérification impossible sur ce navigateur.';
    });
  }

  // ---------- Demarrage ----------

  function init() {
    lock  = document.getElementById('lock');
    if (!lock) return;

    input = document.getElementById('lockInput');
    boxes = document.getElementById('lockBoxes');
    msg   = document.getElementById('lockMsg');

    for (var i = 0; i < TOTAL; i++) {
      var b = document.createElement('span');
      b.className = 'lock-box' + (i === CONFIG.digits ? ' is-split' : '');
      boxes.appendChild(b);
    }

    // Deja identifie pendant cette session : on passe sans ceremonie.
    var done = false;
    try { done = sessionStorage.getItem(CONFIG.session) === '1'; } catch (e) {}
    if (done) { unlock(false); return; }

    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, TOTAL);
      msg.textContent = ' ';
      paintBoxes();
      if (input.value.length === TOTAL) submit();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });

    lock.addEventListener('click', function () { input.focus(); });

    // La carte s'insere, puis le clavier s'ouvre.
    var reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPhase('boot');
    setTimeout(function () { setPhase('card'); },  reduce ? 0 : 500);
    setTimeout(function () {
      setPhase('input');
      paintBoxes();
      input.focus();
    }, reduce ? 0 : 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
