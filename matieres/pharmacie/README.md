# 💊 Portail Pharmacie — Préparateur / Technicien en pharmacie (DEUST)

Portail web **statique** (HTML/CSS/JS pur, **zéro build, zéro dépendance**) pour réviser le DEUST
Préparateur/Technicien en pharmacie : 9 modules sur 2 ans, flashcards, examen blanc, antisèches,
glossaire, suivi de progression… Il marche en `file://`, sur GitHub Pages (sous-dossier), sur
téléphone (Samsung ~412 px, iPhone 13 = 390 px) et **hors-ligne** (PWA installable).

> 🛡️ **Règle d'or d'autonomie** — ce dossier est **100 % autonome**. Aucun fichier de `matieres/pharmacie/`
> ne référence `../../assets/`, `matieres/cours.js`, une clé `esgi-*` / `cmd-*` ou un autre fichier du
> portail IABD. On peut **lire** le code IABD pour s'en inspirer (copie adaptée), jamais en **dépendre**.
> La CI (`ci/validate_site.py`) le vérifie. Tout le stockage est préfixé `pharma-`.

## 🚀 Démarrer
- Ouvrir [`index.html`](index.html) (double-clic) : la majorité des pages marche en `file://`.
- Tester proprement (antisèches `.md`, service worker) via un serveur local :
  ```powershell
  py -m http.server 8800 --directory "matieres\pharmacie"
  # puis http://localhost:8800/
  ```
- Le service worker n'est actif qu'en `https://` ou `localhost` (jamais en `file://`).

## 🗂️ Arborescence
```
matieres/pharmacie/
  index.html            Accueil : tableau de bord, cartes des modules, recherche, révision du jour, examens J‑X
  flashcards.html       Flashcards SM‑2 (+ cartes à trous, cartes perso, export Anki .csv)
  examen.html           Examen blanc chronométré (QCM mélangés, correction, historique)
  aide.html             Antisèche imprimable d'un module (?m=<id>) — rendue depuis md/aide-<id>.md
  glossaire.html        Glossaire interactif (recherche, A‑Z)
  parametrage.html      Réglages : thème, accent, objectif, emploi du temps, export/import, PWA
  ameliorations.html    Feuille de route filtrable + boîte à idées locale
  manifest.webmanifest  Manifeste PWA (portée = ce dossier)
  sw.js                 Service worker (pré-cache CORE, réseau d'abord) — cache « pharma-vN »
  README.md             Ce fichier
  modules/<id>.html     9 modules : chimie, anatomie, physiologie, galenique, legislation,
                        pharmacologie, pathologie, toxicologie, diagnostic
  md/aide-<id>.md       9 antisèches Markdown (une par module)
  assets/
    data.js             Source unique des modules : window.PHARMA.{years,modules,byId,byFile}
    common.js           Utilitaires + clés localStorage : PHARMA.{root,K,read,write,dstr,today,
                        recordActiveDay,updateStreak,getStreak,logActivity,getDone,setDone,esc}
    nav.js              Navbar + menu, thème clair/sombre/auto, accent, Pomodoro, retour en haut,
                        raccourcis clavier, PWA/iOS, accessibilité (toutes les pages)
    style.css           Design system (variables de thème) — non modifié par les autres fichiers
    tools.css           Styles des outils des pages de module (quiz, notes, favoris, glossaire…)
    app.js              Moteur des pages de module (quiz, progression, notes, favoris, reprise, TTS)
    share.js            Partage d'un module/fiche : lien direct + QR code (généré localement)
    glossary-data.js    Termes du glossaire + cartes à trous
    portal.js           Rendu de l'accueil (cartes, progression, heatmap, objectif, recherche…)
    portal-extra.css    Styles propres à l'accueil
    cards-data.js       Banque de flashcards par module
    flash.css           Styles des flashcards
    markdown.js         Mini-parseur Markdown maison (sans dépendance)
    cheatsheet.js/.css  Rendu des antisèches (cartes en colonnes, impression PDF)
    examen.js/.css      Moteur et styles de l'examen blanc
    icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png   Icônes PWA / iOS
```

## 🧩 Ordre des scripts
- **Pages à la racine** (`index.html`, `flashcards.html`…) :
  `assets/data.js` → `assets/common.js` → `assets/nav.js` → scripts propres à la page.
- **Pages de module** (`modules/*.html`) : dans `<head>` : `../assets/style.css` puis `../assets/tools.css` ;
  en fin de `<body>` : `../assets/data.js`, `../assets/common.js`, `../assets/nav.js`,
  `../assets/glossary-data.js`, `../assets/share.js`, `../assets/app.js` (dans cet ordre).
- **Topbar standard** (toutes pages) :
  `<header class="topbar"><div class="brand"><span class="logo">💊</span> Préparateur en pharmacie</div><div class="spacer"></div> … <button class="btn" id="theme-toggle">☀️ Clair</button></header>`
  — `nav.js` y injecte le menu et rend le logo cliquable (retour à l'accueil).

## 💾 Clés `localStorage` (toutes préfixées `pharma-`, privées à l'appareil)
| Clé | Contenu / format |
|---|---|
| `pharma-theme` | `"dark"`, `"light"` ou `"auto"` (suit le système) |
| `pharma-accent` | couleur d'accent choisie (nom ou code hexadécimal) |
| `pharma-done-modules` | `{ "<idModule>": true }` modules terminés |
| `pharma-streak` | `{ last:"YYYY-MM-DD", count, best }` série de jours consécutifs |
| `pharma-active-days` | `{ "YYYY-MM-DD": n }` activité par jour (heatmap) |
| `pharma-weekly-goal` | objectif hebdomadaire (nombre d'activités / minutes) |
| `pharma-flashcards` | état SM‑2 par carte `{ "<idCarte>": { ef, interval, reps, due, … } }` |
| `pharma-flashcards-custom` | cartes créées par l'utilisateur `[ { id, q, a, module } ]` |
| `pharma-favorites` | favoris / marque‑pages (modules, sections) |
| `pharma-last-module` | dernier module consulté (reprise « où j'en étais ») |
| `pharma-exams` | `[ { name, date:"YYYY-MM-DD" } ]` dates d'examens (comptes à rebours J‑X) |
| `pharma-timetable` | emploi du temps `{ lundi:[idModule…], … }` (révision du prochain jour de cours) |
| `pharma-activity` | journal `[ { t:<ms>, k:"quiz"\|"done"…, m:"<idModule>", ok:true\|false } ]` (max 600) — bilan & points faibles |
| `pharma-notes-<idModule>` | notes personnelles d'un module (texte) |
| `pharma-setup-done` | `true` quand l'utilisateur a validé l'assistant de premier lancement |
| `pharma-gloss-off` | `true` pour désactiver les définitions au survol (glossaire) |
| `pharma-exam-prefs` | préférences de l'examen blanc (modules, nombre de questions, durée) |
| `pharma-exam-history` | historique des examens blancs `[ { t, score, total, modules… } ]` |
| `pharma-ideas` | boîte à idées locale `[ { id, text, author, cat, ts } ]` |
| `pharma-nav-css` | *(pas du stockage)* identifiant de la balise `<style>` injectée par `nav.js` |

> Le cache du service worker s'appelle `pharma-vN` (ce n'est pas une clé `localStorage`), et `pharma-portal`
> est seulement le marqueur `_app` des fichiers d'export/import de progression.
> Exception d'autonomie : le sélecteur de portail de `index.html` contient un simple **lien** `../../index.html`
> vers l'accueil IABD (autorisé par la CI) ; aucune donnée ni script n'est partagé.
> Toute nouvelle clé : préfixe `pharma-`, ajout dans `PHARMA.K` (`common.js`), dans ce tableau et dans
> `docs/CONTEXTE-PROJET.md`. Ne jamais renommer une clé existante sans migration (progression perdue).

## ➕ Comment ajouter…
- **Un module** : créer `modules/<id>.html` (copier un module existant, mêmes `<head>`/scripts) ;
  déclarer l'entrée `{ id, year, num, emoji, title, subtitle, desc, themes, tags, topics, quizzes, exos, file }`
  dans `assets/data.js` ; créer `md/aide-<id>.md` ; ajouter ses cartes dans `assets/cards-data.js` et ses termes dans
  `assets/glossary-data.js` ; ajouter la page et l'antisèche à `CORE` de `sw.js` (la liste `MODULES` de `sw.js`
  doit aussi contenir l'`id`) puis incrémenter `CACHE`.
- **Une carte de module (accueil)** : elle est générée depuis `assets/data.js` — rien d'autre à faire.
- **Une flashcard** : ajouter un objet dans `assets/cards-data.js` (même format que les cartes voisines).
- **Un terme de glossaire** : ajouter l'entrée dans `assets/glossary-data.js` (terme, définition, module).
- **Une antisèche** : un `md/aide-<id>.md` ; chaque titre `##` devient une carte (voir un fichier existant
  comme modèle) ; lien d'accès : `aide.html?m=<id>`.
- **Un paramètre utilisateur** : nouvelle clé `pharma-…` dans `PHARMA.K`, champ dans `parametrage.html`,
  lecture via `PHARMA.read/write`, ligne dans le tableau ci-dessus.
- **Une page** : topbar standard + scripts dans l'ordre ci-dessus ; l'ajouter au menu de `nav.js`, à `CORE` de `sw.js`,
  et (si c'est une fonctionnalité) la cocher dans `FEATURES` de `ameliorations.html`.

## 📱 PWA & hors-ligne
- `manifest.webmanifest` + `sw.js` sont **propres au portail Pharmacie** (portée = ce dossier), distincts de ceux du portail IABD.
- `sw.js` : stratégie **réseau d'abord, repli sur le cache** ; `CORE` liste les fichiers pré-cachés.
- ⚠️ **Quand un fichier de `CORE` change (ou qu'un fichier est ajouté/renommé), incrémenter `CACHE`**
  (`pharma-v1` → `pharma-v2`…) sinon le mobile garde l'ancienne version. Tout fichier du dossier doit figurer dans `CORE`.
- iOS : icône PNG `assets/apple-touch-icon.png`, champs de saisie ≥ 16 px, `100dvh`, `viewport-fit=cover`
  (réglages injectés par `nav.js`).
- Pour re-tester après un changement : DevTools → Application → Service Workers → *Unregister*, puis vider les caches.

## ✅ Conventions & normes
- **Mobile d'abord** : pas de débordement horizontal à 390 px (`document.documentElement.scrollWidth <= innerWidth`),
  cibles tactiles ≥ 40 px, grilles en `minmax(0,1fr)`, `-webkit-backdrop-filter` en plus de `backdrop-filter`.
- **Thèmes clair et sombre** : variables de `assets/style.css` (`--bg --bg-soft --bg-card --bg-elev --border --text
  --text-soft --muted --primary --primary-soft --accent --accent-2 --danger --success --shadow --radius --maxw`),
  thème porté par `data-theme` sur `<html>`. Vérifier chaque nouvelle couleur dans les deux thèmes.
- **Impression** : `.no-print` masque les éléments d'interface.
- **Aucun réseau** : pas de CDN ni d'appel serveur ; tout est local (QR code, TTS du navigateur, etc.).
- Texte visible en **français**.
- Ces contenus sont des supports de révision : ils ne remplacent ni le cours officiel, ni le CSP/ANSM en vigueur.

## 🔍 Valider avant de pousser
```powershell
py ci/validate_site.py
```
Vérifie notamment, pour ce dossier : liens `href`/`src` des pages, 9 antisèches `md/aide-<id>.md`, JSON du manifeste,
présence de chaque fichier dans `CORE` de `sw.js`, et **absence de toute dépendance au portail IABD**.
