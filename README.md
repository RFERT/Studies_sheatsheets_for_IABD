# Studies_sheatsheets_for_IABD

Tous les cours d'un·e étudiant·e **IABD** (IA & Big Data) de l'ESGI, réunis dans un
portail web unique, interactif, responsive (optimisé mobile / Samsung S26 Ultra) et
pensé pour grandir.

## 🚀 Démarrer
Ouvre simplement [`index.html`](index.html) dans un navigateur (double-clic).
Aucune dépendance ni serveur requis : tout fonctionne en `file://`.

## 🗂️ Structure
```
index.html               Portail : tableau de bord, recherche, cartes de matières
ameliorations.html       Feuille de route & idées d'évolution
assets/
  portal.css             Design system du hub
  portal.js              Rendu des matières, progression, recherche
  search-index.js        Index de recherche (généré — ne pas éditer à la main)
  build-search-index.py  Générateur de l'index (Python 3, sans dépendance)
matieres/
  mathematiques/         Cours de maths (modules, fiches, examen blanc, aide-mémoire)
  rust/                  Cursus Rust + révision express + antisèche
  python/                Python & Data Science (6 modules, fiches, aide-mémoire)
```

## ✨ Fonctionnalités
- **Tableau de bord de progression** (anneau global + barres par matière), stocké
  localement et privé.
- **Recherche globale** dans tous les cours et sections (raccourci `/`, insensible
  aux accents, liens profonds vers les sections).
- **Antisèches / aide-mémoire** par matière (référence rapide filtrable : Rust et maths).
- **Export PDF** des cours de maths (bouton 🖨️ ou impression du navigateur).
- **Thème clair/sombre** et design **responsive** mobile.

## ➕ Ajouter une matière
1. Crée un dossier dans `matieres/`.
2. Ajoute une entrée dans le tableau `SUBJECTS` de [`assets/portal.js`](assets/portal.js).
3. (Optionnel) Déclare la source dans [`assets/build-search-index.py`](assets/build-search-index.py).

## 🔎 Régénérer l'index de recherche
Après avoir ajouté ou modifié des cours :
```
python assets/build-search-index.py
```
Cela met à jour `assets/search-index.js` (et `.json`).

## 📜 Convention : encart « Culture & histoire »
Chaque cours peut inclure un encart **à l'écart du cours fonctionnel** (hors programme)
qui raconte l'histoire de la notion, ses grands noms et pourquoi elle compte.
- Dans un cours **statique** (maths) : une section `<section class="culture" id="culture">`
  placée en fin de module (le style `.culture` est dans `matieres/mathematiques/assets/style.css`).
- Dans le **cursus Rust** (dynamique) : un champ `culture:` (chaîne HTML) ajouté à une entrée
  de `COURSE`, rendu automatiquement sous la leçon.
- Structure type : un `.chead` (titre + badge), un `.csub`, un paragraphe d'intro,
  `<h4>` thématiques, une liste `.names` (figures + dates), puis des liens `.clinks`.
Les encarts sont automatiquement indexés dans la recherche (type « Culture & histoire »).

## ⚡ Convention : antisèche / aide-mémoire
Chaque matière peut fournir une page **antisèche** autonome (référence rapide) :
- Rust : `matieres/rust/cheatsheet-rust.html` (syntaxe, méthodes, paradigmes).
- Maths : `matieres/mathematiques/aide-memoire.html` (formules, règles, marches à suivre).
Patron : un **filtre de recherche instantané** (raccourci `/`), des cartes `.cs-card`
en colonnes (`column-width`), styles d'impression, thème auto. Pour les maths, des
**puces de catégorie** filtrent par domaine. Déclare chaque page dans
`build-search-index.py` et ajoute un lien `extra` dans `SUBJECTS` (`portal.js`).
