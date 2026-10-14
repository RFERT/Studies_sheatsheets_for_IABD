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
  mathematiques/         Cours de maths (modules, fiches, examen blanc)
  rust/                  Cursus Rust + révision express
```

## ✨ Fonctionnalités
- **Tableau de bord de progression** (anneau global + barres par matière), stocké
  localement et privé.
- **Recherche globale** dans tous les cours et sections (raccourci `/`, insensible
  aux accents, liens profonds vers les sections).
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
