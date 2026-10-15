# Contexte du projet & passation entre discussions

Ce document permet de reprendre le travail dans une **nouvelle discussion** sans rien perdre.
Les règles techniques détaillées sont dans [`.github/copilot-instructions.md`](../.github/copilot-instructions.md)
(chargé automatiquement par Copilot) et la structure dans [`README.md`](../README.md).

## 1. L'objectif
Un « site » unique, bien organisé et extensible, qui réunit **tous** les cours de l'étudiant (3ᵉ année IABD, ESGI Paris),
utilisable sur PC et sur téléphone (Samsung S26 Ultra), hors-ligne, et publiable sur GitHub Pages.

## 2. État actuel (résumé)
| Domaine | Contenu |
|---|---|
| Matières | **Mathématiques** (modules 0 à 9 + examen blanc + fiches `.md` + aide-mémoire), **Python & Data Science** (modules 0 à 5 + fiches + aide-mémoire), **Rust** (cursus 117 questions + révision express + antisèche) |
| Portail | tableau de bord (progression, séries, objectif hebdo, calendrier d'activité), recherche globale, favoris, reprise du dernier module |
| Outils | navbar commune, Pomodoro, couleur d'accent, flashcards (répétition espacée), quiz mélangeables, mode examen chronométré, export PDF (maths) |
| Technique | PWA (manifest + service worker), thème clair/sombre, responsive mobile, guides « accès mobile » et « GitHub Pages » |
| Culture | encarts « Culture & histoire » dans les cours existants |

Matières encore **à construire** : voir `SUBJECTS` dans `assets/portal.js` et la page `ameliorations.html`
(compétences hors programme ESGI : Git, SQL, Docker, Spark, MLOps…).

## 3. Séparation proposée du travail
### 🛠️ Discussion « SITE » (infrastructure)
Périmètre : `index.html`, `assets/*`, `sw.js`, `manifest.webmanifest`, `flashcards.html` (moteur),
`ameliorations.html`, guides, thèmes, accessibilité, performance, déploiement.

Backlog (voir aussi `ameliorations.html`) :
- **Éditeur de code exécutable** (Pyodide pour Python, Rust Playground pour Rust) — priorité haute.
- **Visualisations interactives** (graphes, matrices, descente de gradient animée).
- **MathJax/KaTeX en local** (supprimer la dépendance CDN pour un vrai hors-ligne).
- **Design system partagé** : factoriser `style.css`/`app.js` dupliqués entre maths et python (quiz, thème, streak…).
- Raccourcis globaux (`g` puis `m`/`p`/`r` pour changer de matière, `t` pour le thème).
- Auto-déploiement GitHub Pages (workflow Actions) et génération automatique de l'index de recherche.
- Dette connue : `app.js` quasi dupliqués ; la liste `CORE` de `sw.js` est manuelle.

### 📚 Discussion « COURS » (contenu)
Périmètre : tout `matieres/**` + banque de cartes dans `flashcards.html` (données uniquement).

Backlog :
- Approfondir/ajouter des modules (maths ; Python/Data Science : ML avancé, deep learning, etc.).
- Cours **Rust** : poursuivre la structuration, ajouter des exercices, un mini-projet.
- Nouvelles matières (C, SQL, Big Data/Spark, ML/IA…) en respectant les conventions du README.
- Pour chaque cours : quiz avec explications, exercices corrigés, fiche `.md`, antisèche reliée au cours,
  encart « Culture & histoire », mots-clés de recherche, section « entrées/sorties » pour les langages.
- Étendre la banque de flashcards (actuellement 30 cartes : maths/python/rust).

## 4. Pièges connus
- **Thème clair** : couleurs d'accent trop claires = texte illisible ; toujours tester les 2 thèmes.
- **Cache PWA** : après modification d'un fichier mis en cache, incrémenter `CACHE` dans `sw.js`.
- **Service worker** actif seulement en `https://` ou `localhost`, jamais en `file://`.
- **Index de recherche** : régénérer (`py assets/build-search-index.py`) après toute modification de cours.
- **Duplication** des moteurs de quiz maths/python : répercuter les changements des deux côtés.
- **Accents dans les chemins** : quoter les chemins PowerShell ; pas de `&&`.
- Les clés `localStorage` sont listées dans `.github/copilot-instructions.md` : ne pas les renommer sans migration
  (sinon la progression de l'utilisateur est perdue).

## 5. Brief de démarrage à coller dans une nouvelle discussion
### 🛠️ Pour la discussion SITE
> Je continue le projet de portail de cours IABD (dépôt `Studies_sheatsheets_for_IABD`). Lis `.github/copilot-instructions.md`,
> `README.md` et `docs/CONTEXTE-PROJET.md`. Dans cette discussion on ne travaille **que sur le site/infrastructure**
> (portail, navbar, recherche, PWA, design system, thèmes, déploiement), pas sur le contenu des cours. Commence par
> me résumer l'état et me proposer les 3 chantiers les plus utiles du backlog « SITE ».

### 📚 Pour la discussion COURS
> Je continue le projet de portail de cours IABD (dépôt `Studies_sheatsheets_for_IABD`). Lis `.github/copilot-instructions.md`,
> `README.md` et `docs/CONTEXTE-PROJET.md`. Dans cette discussion on ne travaille **que sur le contenu des cours**
> (`matieres/**`) en respectant les conventions (quiz, fiches, antisèche reliée au cours, culture & histoire, mots-clés).
> Aujourd'hui je veux travailler sur : **[matière / sujet]**. Mon partiel est le : **[date]**.
