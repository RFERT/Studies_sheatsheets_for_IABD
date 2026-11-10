# Instructions du projet — Studies_sheatsheets_for_IABD

Portail web statique (HTML/CSS/JS pur, **sans build ni dépendance**) qui réunit tous les cours d'un étudiant
en **3ᵉ année IABD à l'ESGI Paris** (Python solide, C débutant correct, bases ailleurs).
Lis aussi `README.md` (structure, conventions) et `docs/CONTEXTE-PROJET.md` (état, backlog, pièges).

## Préférences de l'utilisateur
- Il écrit en **français** : réponds en français, ton chaleureux, concis.
- **Mobile d'abord** : toute page doit être responsive et lisible sur un Samsung S26 Ultra (~412–480 px),
  cibles tactiles larges, pas de débordement horizontal. C'est une norme pour chaque page.
- Il révise aussi sur téléphone et **hors-ligne** (PWA). Pas de dépendance réseau superflue.
- Il aime beaucoup de contenu, des questions complexes, des liens pour approfondir, des antisèches.
- Les cours doivent rester **cohérents** entre eux (mêmes conventions, même design).

## Deux axes de travail (sessions séparées, worktree Git)
Deux sessions d'agent travaillent **en parallèle sur le même dépôt**, chacune dans **son
propre dossier (worktree) et sa propre branche** pour ne pas se marcher dessus :
1. **Site / infrastructure** — session SITE, dossier **principal**, branche **`main`** :
   portail, navbar, recherche, progression, PWA, design system, thèmes, GitHub Pages, CI.
   Fichiers : `index.html`, `assets/`, `sw.js`, `manifest.webmanifest`, `flashcards.html`, `ameliorations.html`.
2. **Contenu des cours** — session PROF (Professeur IABD), worktree **`...-cours`**, branche **`Cours`** :
   modules, quiz, fiches, antisèches, encarts culture, flashcards (contenu). Fichiers : tout `matieres/**`.
   Ne modifie le moteur (`assets/`, `app.js`) que si c'est vraiment nécessaire et signale-le.

> 🌳 **Worktree** = 2ᵉ dossier de travail partageant le même `.git`. Mise en place et flux
> dans [`scripts/README.md`](../scripts/README.md) : `scripts\worktree-prof.ps1` (créer),
> `scripts\cours-sync.ps1` (côté prof : rapatrier `main`), `scripts\integrer-cours.ps1`
> (côté site : fusionner `Cours` dans `main`, valider, pousser). Garder `matieres/cours.js`
> en modifications ciblées (seul fichier touché des deux côtés).

## 🏭 Système de cours « industrialisé » (Markdown, zéro build)
Un cours peut être écrit en **Markdown pur** et rendu automatiquement, sans coder de page HTML.
- Moteur : `cours.html` (coquille) + `assets/course.js` (rendu) + `assets/markdown.js` (parseur maison) + `assets/course.css`.
- Source unique : `matieres/cours.js` → `window.COURS` (liste des matières + modules `{id,title,desc,badge,file}`).
- Contenu : un `.md` par module avec front-matter (`title`, `subtitle`, `domains`, `tags`, `objectifs`, `niveau`, `duree`)
  et des blocs `:::` : `def/theorem/example/tip/warn/info/note/goal/data/py/why`, `jobs` (carte métiers),
  `quiz` (`- [x]` = bonne réponse, `> ` = explication), `exo` (`?? libellé` = solution repliable), `culture`.
  Maths LaTeX `\( \)` / `\[ \]` (MathJax). Le moteur ajoute : sommaire auto, temps de lecture, coloration de
  code (rust/python/bash/sql/js), bouton copier, culture stylée (noms + liens en pills).
- Intégration AUTO : `portal.js` (`mergeManifestCourses`) crée la carte + les entrées de recherche ;
  `nav.js` (`addManifestToMenu`) ajoute le cours au menu sur toutes les pages. URL : `cours.html?c=CODE[&m=ID]`.
- Progression stockée sous `cours-<code>-done` (doneMap des modules).
- Pour ajouter un cours : créer `matieres/<x>/md/*.md` + ajouter l'entrée dans `matieres/cours.js`. Rien d'autre.
- **Priorité au cours codé (auto)** : si une matière codée sur-mesure existe (même `code` ou même dossier
  `matieres/<x>/` qu'une entrée de `SUBJECTS` dans `portal.js`), le Markdown est ignoré et la page codée est
  utilisée partout (`codedPageFor` dans portal.js, filtre équivalent dans nav.js, redirection dans course.js).
  Champ optionnel `page:` dans un sujet de `cours.js` pour pointer explicitement vers une page codée.
- Modèle : `matieres/_MODELE-de-cours.md` ; guide : `docs/CREER-UN-COURS.md`. Exemple : matière `GIT`.
- ⚠️ Le rendu lit les `.md` via `fetch()` : OK sur GitHub Pages / `localhost` ; en `file://` certains navigateurs
  bloquent (le moteur affiche alors un message d'aide). Préférer tester via `python -m http.server`.
- Si tu ajoutes un fichier au moteur, pense à `sw.js` (`CORE` + bump `CACHE`).

## Règles techniques à respecter
- **Chemins relatifs uniquement** (le site doit marcher en `file://`, en sous-dossier GitHub Pages, et sur mobile).
- **Navbar commune** : injectée par `assets/nav.js` (ne pas la recopier dans chaque page). Il déclare aussi
  le manifest PWA et enregistre `sw.js`. Menu « Cours » = tableau dans `nav.js`.
- **Nouvelle page ou nouveau cours ⇒ trois mises à jour** :
  1. déclarer la matière/lien dans `SUBJECTS` (`assets/portal.js`) si c'est une matière ;
  2. déclarer la source dans `assets/build-search-index.py` puis lancer `py assets/build-search-index.py`
     (régénère `search-index.js/.json` : ne jamais les éditer à la main) ;
  3. ajouter la page au tableau `CORE` de `sw.js` **et incrémenter `CACHE`** (`esgi-cours-vN`) quand des
     fichiers déjà en cache changent, sinon le mobile garde l'ancienne version.
- **Thème clair/sombre** : les variables CSS d'accent clair (`--acc2`, `--accent`) sont illisibles sur fond blanc.
  Toute nouvelle couleur de texte/code doit être vérifiée **dans les deux thèmes** (le code dans `<pre>` reste
  clair sur fond sombre ; le code inline est assombri en thème clair).
- **Stockage local** (privé à chaque utilisateur, ne rien envoyer à un serveur) — clés existantes :
  `esgi-portal-theme`, `cmd-theme` (maths/python), `rust-cheat-theme`, `cmd-done-modules` (maths),
  `pds-done-modules` (python), `rust_cursus_v1` (Rust), `cours-<code>-done` (cours Markdown), `cmd-last-module`,
  `cmd-favorites`, `esgi-streak`, `esgi-active-days`, `esgi-weekly-goal`, `esgi-flashcards`. Réutilise ces clés plutôt
  que d'en créer de nouvelles sans raison ; documente toute nouvelle clé dans `docs/CONTEXTE-PROJET.md`.
- Les moteurs `matieres/mathematiques/assets/app.js` et `matieres/python/assets/app.js` sont **dupliqués en
  grande partie** : toute évolution d'un quiz/outil commun doit être répercutée dans les deux (ou factorisée).
- Raccourcis clavier existants : `/` et `Ctrl/⌘+K` (recherche). Ne pas les écraser.
- **Feuille de route filtrable** (`ameliorations.html`) : la liste des fonctionnalités est pilotée par le
  tableau JS `FEATURES` (groupe `g`, libellé `t`, priorité `p` = haute/moyenne/bonus, `done`). La vue par
  défaut n'affiche que les **non implémentées** ; les filtres (statut À faire/Faites/Toutes + priorités)
  permettent de voir les faites. ⇒ **Quand tu implémentes une fonctionnalité, passe son entrée à `done:true`**
  (ne la laisse pas dans les idées). Ajoute toute nouvelle idée comme entrée sans `done`.

## Conventions de contenu
- Encart **« Culture & histoire »** à l'écart du cours fonctionnel (voir README, classe `.culture`).
- Chaque matière : modules, **fiches `.md` téléchargeables**, **antisèche** `aide-memoire.html` / `cheatsheet-*.html`
  qui **renvoie vers les sections du cours** concernées, quiz avec explications, exercices avec solutions repliables.
- Les cours de code incluent les fonctions d'**entrée/sortie** (`input`, lecture de fichiers, etc.).
- Mots-clés riches dans les sections pour améliorer la recherche.

## Environnement et workflow
- Windows + PowerShell (pas de `&&` / `||`). Chemins accentués (`Troisième année`) : toujours les quoter.
  Python : `py ...` (définir `PYTHONIOENCODING=utf-8` pour les scripts qui affichent des accents).
- Vérifier avant de conclure : liens internes qui résolvent, **0 erreur console**, pas de débordement mobile,
  rendu en thème clair **et** sombre.
- **CI (GitHub Actions)** : `.github/workflows/ci.yml` valide chaque push/PR via `ci/validate_site.py`
  (liens morts, manifeste `cours.js`, JSON) puis, sur `main`, régénère l'index de recherche, le committe
  et **déploie sur GitHub Pages**. Lance `python ci/validate_site.py` en local avant de pousser.
  Pré-requis dépôt (une fois) : Settings → Pages → Source = GitHub Actions. Voir `ci/README.md`.
- **Commits** : en français, message court + puces, avec le trailer
  `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`. Branche `main`, remote `origin`
  (`RFERT/Studies_sheatsheets_for_IABD`). Demander avant de pousser.
