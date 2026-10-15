---
description: "Use when creating, writing, adding or editing a course, lesson or module for the IABD study portal (matieres/**). Covers the zero-build Markdown course system: .md authoring syntax (front-matter, ::: callouts, quiz, exo, culture, LaTeX) and the matieres/cours.js manifest."
name: "Créer un cours (système Markdown)"
applyTo: "matieres/**"
---

# Créer un cours sur ce portail (système Markdown « zéro build »)

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

- `::: def` · `::: tip` · `::: warn` · `::: info` · `::: note` · `::: goal` → encarts.
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
