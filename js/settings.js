// Page Parametres : le compte, la progression, la remise a zero.
// Un "compte" est ici un profil enregistre dans ce navigateur : il porte
// sa propre collection, et on passe de l'un a l'autre a volonte.
(function () {
  var DP = window.DP;
  var sheet, title, body, error, okBtn, cancelBtn;
  var onValidate = null;   // ce que fait "Valider" selon le panneau ouvert

  // ---------- L'ecran principal ----------

  function refresh() {
    var me = DP.currentProfile();
    var all = DP.profiles();

    document.getElementById('accountName').textContent = me.name;
    document.getElementById('accountSub').textContent =
      all.length > 1 ? all.length + ' comptes sur cet appareil' : 'Seul compte sur cet appareil';

    document.getElementById('progressValue').textContent =
      me.owned + ' / ' + DP.DINDERS.length + ' Dinders';

    // Sans deuxieme compte, "Se connecter" n'a nulle part ou aller.
    document.getElementById('signInBtn').disabled = all.length < 2;
  }

  // ---------- Le panneau ----------

  function open(titleText, build, validate) {
    title.textContent = titleText;
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

  function fail(msg) { error.textContent = msg; }

  // ---------- Creer un compte ----------

  function askNewAccount() {
    var input;
    open('Créer un compte', function () {
      var label = document.createElement('label');
      label.className = 'sheet-field';
      label.textContent = 'Nom du compte';
      input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 18;
      input.placeholder = 'Ton pseudo';
      input.autocomplete = 'off';
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); validate(); }
      });
      label.appendChild(input);
      body.appendChild(label);

      var note = document.createElement('p');
      note.className = 'sheet-note';
      note.textContent = 'Ce compte vit dans ce navigateur. Sa collection lui est propre.';
      body.appendChild(note);
    }, validate);

    function validate() {
      var res = DP.createProfile(input.value);
      if (!res.ok) return fail(res.error);
      close();
      refresh();
    }
  }

  // ---------- Se connecter a un compte existant ----------

  function askSignIn() {
    var all = DP.profiles();
    var current = DP.currentProfile().id;
    var chosen = current;

    open('Se connecter', function () {
      var list = document.createElement('div');
      list.className = 'sheet-list';

      all.forEach(function (p) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'sheet-row' + (p.id === current ? ' is-current' : '');
        row.dataset.id = p.id;

        var n = document.createElement('strong');
        n.textContent = p.name;
        row.appendChild(n);

        var s = document.createElement('span');
        s.textContent = p.owned + ' / ' + DP.DINDERS.length +
                        (p.id === current ? '  •  connecté' : '');
        row.appendChild(s);

        row.addEventListener('click', function () {
          chosen = p.id;
          list.querySelectorAll('.sheet-row').forEach(function (r) {
            r.classList.toggle('is-picked', r.dataset.id === chosen);
          });
        });
        list.appendChild(row);
      });

      body.appendChild(list);
    }, function () {
      DP.switchProfile(chosen);
      close();
      refresh();
    });
  }

  // ---------- Vider la collection ----------

  function askReset() {
    var me = DP.currentProfile();
    open('Réinitialiser', function () {
      var p = document.createElement('p');
      p.className = 'sheet-note sheet-note--warn';
      p.textContent = 'Les ' + me.owned + ' Dinders de « ' + me.name +
                      ' » seront effacés. Le compte, lui, reste en place. ' +
                      'C’est définitif.';
      body.appendChild(p);
    }, function () {
      DP.reset();
      close();
      refresh();
    });
  }

  // ---------- Demarrage ----------

  function init() {
    if (!DP) return;
    sheet     = document.getElementById('sheet');
    title     = document.getElementById('sheetTitle');
    body      = document.getElementById('sheetBody');
    error     = document.getElementById('sheetError');
    okBtn     = document.getElementById('sheetOk');
    cancelBtn = document.getElementById('sheetCancel');

    document.getElementById('signUpBtn').addEventListener('click', askNewAccount);
    document.getElementById('signInBtn').addEventListener('click', askSignIn);
    document.getElementById('resetBtn').addEventListener('click', askReset);

    okBtn.addEventListener('click', function () { if (onValidate) onValidate(); });
    cancelBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sheet.hidden) close();
    });

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
