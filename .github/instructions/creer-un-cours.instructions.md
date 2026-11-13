---
description: "Use when creating, writing, adding or editing a course, lesson or module for the IABD study portal (matieres/**). Covers the zero-build Markdown course system: .md authoring syntax (front-matter, ::: callouts, quiz, exo, culture, LaTeX) and the matieres/cours.js manifest."
name: "Créer un cours (système Markdown)"
applyTo: "matieres/**"
---

# Créer un cours sur ce portail (système Markdown « zéro build »)

> 🌳 **Où travailler** : les cours s'écrivent dans le worktree **`...-cours`** (branche **`Cours`**),
> pas dans le dossier principal (réservé à la session SITE sur `main`). Avant de rédiger :
> `powershell -File scripts\cours-sync.ps1` (récupère les évolutions du site). L'intégration dans
> `main` est faite côté site (`scripts\integrer-cours.ps1`). Voir `scripts/README.md`.

Les cours de ce dépôt s'écrivent en **Markdown pur** : on **n'écrit pas de HTML**.
Le moteur (`cours.html` + `assets/course.js` + `assets/markdown.js`) rend la page, et le
portail / la navbar / la recherche se remplissent automatiquement depuis le manifeste.

👉 Référence complète : [`docs/CREER-UN-COURS.md`](../../docs/CREER-UN-COURS.md)
👉 Modèle copiable avec toute la syntaxe : [`matieres/_MODELE-de-cours.md`](../../matieres/_MODELE-de-cours.md)
👉 Exemple réel : `matieres/git/md/*.md` (matière `GIT`)

## Procédure (3 étapes, sans coder)

1. **Crée** `matieres/<matiere>/md/` et écris un fichier `.md` par module.
2. **Déclare** la matière dans [`matieres/cours.js`](../../matieres/cours.js) (`window.COURS.subjects`) :
   ```js
   {
     code: "SQL", name: "Bases de données", emoji: "🧮", color: "#22c3a6",
     desc: "Phrase affichée sur la carte du portail.", tags: ["SQL", "jointures"],
     modules: [
       { id: "intro", title: "Introduction au SQL", desc: "…",
         badge: "Module 1", file: "matieres/sql/md/0-intro.md" }
     ]
   }
   ```
3. **Rien d'autre.** La page est servie par `cours.html?c=SQL&m=intro`.

> ⚙️ **Priorité au cours codé (automatique).** Si une matière existe déjà en
> **version codée sur-mesure** (page HTML déclarée dans `assets/portal.js`, même
> `code` ou même dossier `matieres/<x>/`), le système **n'utilise PAS** le Markdown
> et garde la version codée partout. Tu n'as donc pas à te soucier des doublons.
> Pour forcer un lien vers une page codée depuis le manifeste, ajoute
> `page: "matieres/<x>/index.html"` au sujet (et omets `modules`).

## Créer une antisèche (aide-mémoire) — même principe

Une **antisèche** est une fiche de révision dense et imprimable, générée
automatiquement depuis **un seul fichier Markdown**, sans coder de page.

1. **Écris** `matieres/<matiere>/md/aide.md` (modèle : [`matieres/_MODELE-aide-memoire.md`](../../matieres/_MODELE-aide-memoire.md)).
2. **Déclare-la** dans [`matieres/cours.js`](../../matieres/cours.js) en ajoutant au sujet :
   ```js
   aide: "matieres/<matiere>/md/aide.md",
   ```
3. **Rien d'autre.** L'antisèche est servie par `aide.html?c=CODE`, reliée
   automatiquement (carte du portail, menu « Antisèches », recherche, bouton sur
   la page du cours), avec boutons **Imprimer/PDF**, **Copier**, **Télécharger .md**.

> 📐 **Mise en page** : chaque titre `##` devient une **carte** qui coule en colonnes.
> Garde les cartes **courtes et autonomes** (une notion = une carte). Même syntaxe que
> les cours (`:::`, quiz, `exo`, `culture`, LaTeX, code). Exemple réel : `matieres/git/md/aide.md`.

## Structure d'un fichier `.md`

```markdown
---
title: Introduction au SQL        # obligatoire
subtitle: Interroger une base relationnelle.
domains: DATA, BIG DATA, IA       # badges colorés
tags: SELECT, WHERE, JOIN
niveau: Débutant
duree: 25 min
objectifs: Ce que l'étudiant saura faire (Markdown autorisé).
---

## 1. Première section          # ## = section + entrée de sommaire auto
Texte **gras**, *italique*, `code`, [lien](https://…), listes, tableaux.
```

## Blocs spéciaux `:::` (ouvrir `::: type Titre`, fermer `:::` seul)

- `::: def` · `::: theorem` · `::: example` · `::: tip` · `::: warn` · `::: info` · `::: note` · `::: goal` → encarts.
- `::: data` (application Data/IA, violet), `::: py` (comparaison Python, jaune), `::: why` (pourquoi, bleu).
- `::: jobs Titre` → carte « usages & métiers » (met un tableau Markdown à l'intérieur).
- Quiz interactif (la bonne réponse = `- [x]`, l'explication = ligne `>`) :
  ```markdown
  ::: quiz Quiz 1.1
  Quelle clause filtre les lignes ?
  - [ ] ORDER BY
  - [x] WHERE
  > WHERE filtre AVANT l'agrégation ; HAVING filtre après.
  :::
  ```
- Exercice corrigé (`??` sépare énoncé et solution repliable) :
  ```markdown
  ::: exo Exercice 1
  Écris une requête qui…
  ?? Voir la solution
  (la solution, avec du code, des listes, des maths…)
  :::
  ```
- `::: culture` → encart « Culture & histoire » (histoire, grands noms, liens externes),
  **à l'écart** du cours fonctionnel. À inclure quand c'est cohérent.
- Maths : LaTeX `\( inline \)` et `\[ bloc \]` (MathJax).
- **Carte à trous** (révision active) : `==texte masqué==` → s'affiche caché, se révèle au clic.
  Ex. `La commande est ==git commit==.`
- **Glossaire** (définition au survol) : `[[terme|définition courte]]` → le terme reçoit une bulle d'aide.
  Ex. `[[HEAD|dernier commit de la branche courante]]`. (Ces deux syntaxes marchent aussi dans les antisèches.)

## Conventions de qualité (cohérence avec les cours existants)

- Beaucoup de contenu, progressif (rattrapage → opérationnel), orienté **Data / Big Data / IA**.
- Plusieurs **quiz** avec explications + au moins un **exercice corrigé** par module.
- Section d'**entrées/sorties** pour les langages (lecture clavier/fichier).
- Mots-clés riches (front-matter `tags` + vocabulaire dans le texte) pour la recherche.
- Un **encart culture** quand la notion a une histoire intéressante, avec liens externes.
- Français, ton pédagogique et bienveillant, niveau 3ᵉ année ESGI.

## Ce qu'il NE faut PAS faire
- Ne pas créer de page HTML pour un cours (le moteur s'en charge).
- Ne pas toucher au moteur (`assets/course.js`, `markdown.js`, `cours.html`) sauf nécessité réelle — c'est le périmètre « site », à signaler.
- Ne pas éditer `assets/search-index.js` à la main.
- Après avoir ajouté un fichier au **moteur** (pas un simple `.md`), penser à `sw.js` (`CORE` + bump `CACHE`).
