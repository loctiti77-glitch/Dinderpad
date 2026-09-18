# DinderPad

Site statique : une console (le DinderPad) dont chaque case du menu ouvre un
ecran dedie.

## Lancer en local

```
node serve.js
```
Puis ouvrir http://localhost:8000

## Structure

| Chemin              | Role                                                      |
|---------------------|-----------------------------------------------------------|
| `index.html`        | Le menu : l'image du pad + 7 zones cliquables             |
| `pages/`            | Un ecran par case du menu                                 |
| `css/style.css`     | Toute la mise en forme                                    |
| `js/pad.js`         | Calcule `--px`, l'unite qui cale les elements sur l'image  |
| `js/transition.js`  | Fondu au noir entre les pages + bouton retour             |
| `assets/`           | Images ; `_source/` garde les originaux non compresses    |

## Le systeme de positionnement

Les elements poses sur le pad (cases, boutons) sont mesures en **pixels de
l'image source**, puis convertis par la variable CSS `--px` que `js/pad.js`
met a jour selon la taille reellement affichee. Un element ecrit
`calc(205 * var(--px))` fait donc toujours 205 px de l'image d'origine, quelle
que soit la taille de la fenetre.

Les deux images de reference font 1612 px de large (`data-pad-width` sur `.pad`).
