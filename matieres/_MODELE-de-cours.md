---
title: Titre du module (obligatoire)
subtitle: Une phrase d'accroche qui résume le module.
domains: DATA, BIG DATA, IA
tags: mot-clé1, mot-clé2, mot-clé3
niveau: Débutant
duree: 25 min
objectifs: Ce que l'étudiant saura faire à la fin. On peut utiliser du `code` et du **gras**.
---

<!--
  ⬆️ Ci-dessus : le FRONT-MATTER (entre les deux ---). Seul `title` est obligatoire.
  Tout le reste du fichier est du Markdown normal + quelques blocs spéciaux ci-dessous.
  Pour publier ce module : ajoute-le dans matieres/cours.js (voir le bas de ce fichier).
-->

## 1. Titres et texte

Un `##` crée une **section** (et une entrée de sommaire automatique). `###` et `####` pour les sous-titres.

On écrit du texte normal avec **gras**, *italique*, `code en ligne`, ~~barré~~ et des
[liens](https://exemple.com). Les liens externes s'ouvrent dans un nouvel onglet automatiquement.

- Liste à puces
- Deuxième élément
  - Sous-élément (indenter de 2 espaces)

1. Liste numérotée
2. Deuxième étape

> Une citation (blockquote) pour une remarque mise en valeur.

## 2. Code et maths

```python
def bonjour(nom):
    return f"Salut {nom}"
```

Les mathématiques utilisent LaTeX : en ligne \( x^2 + y^2 = r^2 \) ou en bloc :

\[ \sum_{i=1}^{n} i = \frac{n(n+1)}{2} \]

## 3. Tableaux

| Colonne A | Colonne B | Aligné à droite |
|-----------|-----------|----------------:|
| valeur 1  | valeur 2  |              42 |
| valeur 3  | valeur 4  |             100 |

## 4. Les blocs spéciaux `:::`

On ouvre avec `::: type Titre optionnel` et on ferme avec `:::` seul sur une ligne.

::: def Terme à définir
Un encart **définition** (bleu). Idéal pour poser le vocabulaire.
:::

::: tip Astuce
Encart vert pour un conseil pratique. Alias : `::: astuce`.
:::

::: warn Piège
Encart orange pour une erreur fréquente. Alias : `::: piege`.
:::

::: info
Encart neutre d'information. Autres types : `::: note`, `::: exemple`, `::: goal`.
:::

### Quiz interactif

::: quiz Quiz 4.1
La question posée à l'étudiant (peut tenir sur plusieurs lignes).
- [ ] Une mauvaise réponse
- [x] La bonne réponse (marquée d'un x entre crochets)
- [ ] Une autre mauvaise réponse
> L'explication affichée APRÈS que l'étudiant a répondu. Commence la ligne par `>`.
:::

### Exercice avec solution repliable

::: exo Exercice 1
L'énoncé de l'exercice, en Markdown normal.
?? Voir la solution
La solution, cachée derrière un bouton dépliable. Le texte après `??` devient le libellé du bouton.
On peut y mettre du ```code```, des listes, des maths, etc.
:::

### Encart culture (hors programme)

::: culture Culture & histoire
Le contexte historique, les grands noms, les anecdotes — à l'écart du cours fonctionnel.
On termine souvent par des liens pour approfondir :

- [Une ressource externe](https://exemple.com)
:::

---

<!--
  ====================================================================
  COMMENT PUBLIER CE MODULE (une seule édition "technique") :
  Ouvre matieres/cours.js et ajoute/complète une matière, par ex. :

  {
    code: "GIT",                      // identifiant court unique (URL ?c=GIT)
    name: "Git & GitHub",
    emoji: "🔧",
    color: "#f05133",
    desc: "Description courte affichée sur la carte du portail.",
    tags: ["commit", "branch"],
    modules: [
      { id: "bases", title: "Les bases", desc: "…", badge: "Module 1",
        file: "matieres/git/md/0-bases.md" }
    ]
  }

  C'est tout. Le portail, la navbar et la recherche se mettent à jour tout seuls.
  ====================================================================
-->
