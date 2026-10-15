# Créer un cours en Markdown (sans coder)

Ce portail intègre un **système de cours industrialisé** : tu écris un simple fichier
Markdown (`.md`), et le moteur fabrique automatiquement la page complète (sommaire, quiz,
exercices, encarts, maths), l'ajoute au **portail**, à la **navbar** et à la **recherche**.

> 🧭 Modèle prêt à copier avec toute la syntaxe : [`matieres/_MODELE-de-cours.md`](../matieres/_MODELE-de-cours.md)

## Les 3 étapes pour ajouter un cours

### 1. Crée un dossier pour la matière
```
matieres/<nom-matiere>/md/
```

### 2. Écris tes modules en Markdown
Un fichier `.md` par module, par exemple `matieres/<nom-matiere>/md/0-intro.md`.
Commence par le **front-matter** (bloc entre `---`), puis le contenu :

```markdown
---
title: Mon premier module
subtitle: Une phrase d'accroche.
domains: DATA, IA
tags: mot-clé1, mot-clé2
objectifs: Ce que l'étudiant saura faire.
---

## 1. Première section
Du texte **Markdown** normal...

::: quiz Quiz 1.1
Ma question ?
- [ ] Mauvaise réponse
- [x] Bonne réponse
> Explication affichée après la réponse.
:::
```

### 3. Déclare la matière dans le manifeste
Ouvre [`matieres/cours.js`](../matieres/cours.js) et ajoute une entrée dans `subjects` :

```js
{
  code: "GIT",                          // identifiant court UNIQUE (URL ?c=GIT)
  name: "Git & GitHub",
  emoji: "🔧",
  color: "#f05133",
  desc: "Description de la carte du portail.",
  tags: ["commit", "branch"],
  modules: [
    { id: "bases", title: "Les bases", desc: "…",
      badge: "Module 1", file: "matieres/git/md/0-bases.md" }
  ]
}
```

**C'est fini.** La matière apparaît sur le portail, dans le menu « Cours » et dans la recherche.
La page du cours est servie par `cours.html?c=GIT` (index) et `cours.html?c=GIT&m=bases` (module).

## Syntaxe disponible

| Élément | Écriture |
|---|---|
| Section (+ sommaire auto) | `## Titre` |
| Gras / italique / code | `**gras**` · `*italique*` · `` `code` `` |
| Lien | `[texte](url)` |
| Liste | `- item` ou `1. item` |
| Tableau | `\| A \| B \|` + ligne `\|---\|---\|` |
| Bloc de code | ` ```python ... ``` ` |
| Maths | `\( inline \)` et `\[ bloc \]` (LaTeX, via MathJax) |
| Définition / astuce / piège | `::: def`, `::: tip`, `::: warn` … + `:::` |
| Quiz | `::: quiz` avec `- [x]` pour la bonne réponse + `> explication` |
| Exercice corrigé | `::: exo` … `?? Voir la solution` … `:::` |
| Culture & histoire | `::: culture` … `:::` |

## Bon à savoir

- **Aucune compilation** : le rendu se fait à l'ouverture de la page.
- **Progression** : chaque matière a sa barre de progression (modules terminés), stockée
  localement par navigateur. Clé : `cours-<code>-done`.
- **Hors-ligne / `file://`** : la lecture des `.md` nécessite un contexte `http(s)`
  (GitHub Pages, ou `python -m http.server`). En `file://`, certains navigateurs la bloquent ;
  le moteur affiche alors un message expliquant comment faire.
- **Recherche fine** : les titres de matière et de module sont indexés automatiquement au
  chargement. Pour indexer aussi les **sections** (recherche profonde) dans l'index global
  partagé, lance `py assets/build-search-index.py` (optionnel).
