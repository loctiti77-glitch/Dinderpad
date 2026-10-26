// VAULT — clavier à symboles mélangés
// Les images doivent être dans le dossier "symboles/" à côté de la page.
(function () {
  "use strict";

  // ================== RÉGLAGES ==================
  // Le code qui ouvre le coffre (en lettres / chiffres normaux).
  var CODE_SECRET = "dinder3307";
  // Combien de fois chaque symbole apparaît sur la grille (2 = 72 touches).
  var COPIES = 2;
  // true = les touches changent de place à chaque chargement de la page.
  var MELANGER_AU_DEMARRAGE = true;
  // Où aller une fois le coffre ouvert, et la clé de session que le
  // DinderPad vérifie avant de s'afficher (voir le haut de index.html).
  var DESTINATION = "../";
  var CLE_SESSION = "dinderpad.vault";
  // ==============================================

  var DOSSIER = "symboles/";
  var CARACTERES = "abcdefghijklmnopqrstuvwxyz0123456789".split("");

  var grille = document.getElementById("grille");
  var champ = document.getElementById("champ");
  var statut = document.getElementById("statut");
  var compteur = document.getElementById("compteur");
  var vault = document.getElementById("vault");

  var saisie = []; // caractères tapés, gardés en mémoire seulement
  var touchesTapees = []; // la touche utilisée pour chaque symbole tapé

  function majLueur(b) {
    var n = touchesTapees.filter(function (t) { return t === b; }).length;
    b.classList.toggle("selectionnee", n > 0);
  }

  function image(c) {
    return DOSSIER + (/[0-9]/.test(c) ? "chiffre_" : "lettre_") + c + ".png";
  }

  function melanger(liste) {
    for (var i = liste.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = liste[i]; liste[i] = liste[j]; liste[j] = t;
    }
    return liste;
  }

  // ---------- Grille ----------
  function construireGrille(avecAnimation) {
    var liste = [];
    for (var k = 0; k < COPIES; k++) liste = liste.concat(CARACTERES);
    if (MELANGER_AU_DEMARRAGE || avecAnimation) melanger(liste);

    grille.innerHTML = "";
    grille.classList.remove("melange");
    touchesTapees = touchesTapees.map(function () { return null; });
    liste.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "touche";
      b.setAttribute("aria-label", "Symbole");
      b.style.animationDelay = (i % 8) * 18 + Math.floor(i / 8) * 12 + "ms";
      var img = document.createElement("img");
      img.src = image(c);
      img.alt = "";
      img.draggable = false;
      b.appendChild(img);
      b.addEventListener("click", function () { ajouter(c, b); });
      grille.appendChild(b);
    });
    if (avecAnimation) {
      void grille.offsetWidth;
      grille.classList.add("melange");
    }
  }

  // ---------- Saisie ----------
  function majCompteur() {
    compteur.textContent = String(saisie.length).padStart(2, "0");
  }

  function ajouter(c, bouton) {
    if (ouvert) return;
    reinitEtat();
    saisie.push(c);
    touchesTapees.push(bouton || null);
    if (bouton) majLueur(bouton);
    var img = document.createElement("img");
    img.src = image(c);
    img.alt = "";
    champ.appendChild(img);
    champ.scrollLeft = champ.scrollWidth;
    majCompteur();
    if (bouton) {
      bouton.classList.add("appuyee");
      setTimeout(function () { bouton.classList.remove("appuyee"); }, 120);
    }
  }

  function retirer() {
    if (ouvert) return;
    reinitEtat();
    if (!saisie.length) return;
    saisie.pop();
    var b = touchesTapees.pop();
    if (b) majLueur(b);
    champ.removeChild(champ.lastElementChild);
    majCompteur();
  }

  function vider() {
    if (ouvert) return;
    saisie = [];
    touchesTapees.forEach(function (b) { if (b) b.classList.remove("selectionnee"); });
    touchesTapees = [];
    champ.innerHTML = "";
    majCompteur();
  }

  function reinitEtat() {
    vault.classList.remove("refuse", "accepte");
    statut.className = "statut";
    statut.textContent = "";
  }

  function valider() {
    if (ouvert) return;
    reinitEtat();
    if (!saisie.length) {
      statut.textContent = "AUCUN MOTIF";
      return;
    }
    void vault.offsetWidth;
    if (saisie.join("") === CODE_SECRET.toLowerCase()) {
      vault.classList.add("accepte");
      statut.className = "statut ok";
      statut.textContent = "ACCÈS AUTORISÉ";
      ouvrir();
    } else {
      vault.classList.add("refuse");
      statut.className = "statut non";
      statut.textContent = "ACCÈS REFUSÉ";
      setTimeout(vider, 500);
    }
  }

  // ---------- Ouverture ----------
  // Les touches s'allument en vague, l'écran s'ouvre en deux, puis on
  // entre sur le DinderPad.
  var ouvert = false;
  function ouvrir() {
    ouvert = true;
    try { sessionStorage.setItem(CLE_SESSION, "1"); } catch (e) {}
    var reduit = window.matchMedia &&
                 window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Array.prototype.forEach.call(grille.children, function (b, i) {
      b.style.animationDelay = (i % 8) * 25 + Math.floor(i / 8) * 45 + "ms";
    });
    grille.classList.remove("melange");
    document.body.classList.add("ouverture");
    setTimeout(function () { document.body.classList.add("ouverture-portes"); }, reduit ? 0 : 900);
    setTimeout(function () { location.replace(DESTINATION); }, reduit ? 150 : 1900);
  }

  // ---------- Portrait uniquement ----------
  // Là où le navigateur le permet (appli installée, plein écran sur
  // Android), on verrouille l'orientation. Ailleurs, le style affiche
  // « tourne ton appareil » tant qu'on est en paysage.
  // Au premier toucher, on passe aussi en plein écran (barres du
  // navigateur masquées) là où c'est permis — c'est d'ailleurs ce qui
  // autorise le verrouillage du portrait sur Android.
  function verrouillerPortrait() {
    var o = window.screen && window.screen.orientation;
    if (o && o.lock) o.lock("portrait").catch(function () {});
  }
  function pleinEcran() {
    var d = document.documentElement;
    var demande = d.requestFullscreen || d.webkitRequestFullscreen;
    if (!demande || document.fullscreenElement || document.webkitFullscreenElement) {
      verrouillerPortrait();
      return;
    }
    try {
      var p = demande.call(d, { navigationUI: "hide" });
      if (p && p.then) p.then(verrouillerPortrait, verrouillerPortrait);
      else verrouillerPortrait();
    } catch (e) { verrouillerPortrait(); }
  }
  verrouillerPortrait();
  document.addEventListener("pointerdown", pleinEcran, { once: true });

  // ---------- Boutons ----------
  document.getElementById("btn-clear").addEventListener("click", function () {
    reinitEtat();
    vider();
  });
  document.getElementById("btn-enter").addEventListener("click", valider);
  document.getElementById("btn-retour").addEventListener("click", retirer);
  document.getElementById("btn-melanger").addEventListener("click", function () {
    if (ouvert) return;
    construireGrille(true);
  });

  // Seules Entrée et Retour arrière marchent au clavier de l'ordi,
  // pour ne pas révéler quel symbole correspond à quelle lettre.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); valider(); }
    else if (e.key === "Backspace") { e.preventDefault(); retirer(); }
    else if (e.key === "Escape") { reinitEtat(); vider(); }
  });

  construireGrille(false);
  majCompteur();
})();
