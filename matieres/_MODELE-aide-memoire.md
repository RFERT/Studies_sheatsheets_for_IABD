---
title: Antisèche <Matière>
subtitle: Une phrase : à quoi sert cette fiche de révision.
domains: DATA, BIG DATA, IA
tags: mot-clé1, mot-clé2, mot-clé3
niveau: Révision express
---

<!--
  MODÈLE D'AIDE-MÉMOIRE (ANTISÈCHE) — système « zéro build ».
  ----------------------------------------------------------------
  1. Copie ce fichier dans matieres/<matière>/md/aide.md
  2. Dans matieres/cours.js, ajoute au sujet concerné :
        aide: "matieres/<matière>/md/aide.md",
  3. C'est tout : l'antisèche est générée à aide.html?c=CODE,
     et reliée automatiquement (carte du portail, menu « Antisèches », recherche).

  PRINCIPE DE MISE EN PAGE :
  - Chaque titre « ## » devient une CARTE dense qui coule en colonnes (imprimable / PDF).
  - Garde chaque carte COURTE et autonome (une notion = une carte).
  - Le texte avant le 1er « ## » devient un chapeau pleine largeur.
  - Mêmes blocs ::: et même syntaxe que les cours (def/tip/warn/info/quiz/exo/culture…),
    maths LaTeX \( \) / \[ \], code ```python … ```.
  Supprime ces commentaires dans ta version finale.
-->

Court chapeau d'introduction (optionnel) : à qui/à quoi sert cette antisèche.

## Première notion

Va droit au but : définition minimale + exemple.

```python
# un exemple court et parlant
resultat = fonction(x)
```

::: tip
Un rappel utile, une astuce, un piège fréquent — en une ligne.
:::

## Deuxième notion

- point clé 1
- point clé 2
- point clé 3

| Cas | Quoi faire |
|---|---|
| Situation A | Action A |
| Situation B | Action B |

## Formule / notation (si pertinent)

\[ f(x) = \frac{1}{1 + e^{-x}} \]

::: warn
Erreur classique à éviter.
:::

## Pour aller plus loin

::: culture Ressources
- [Documentation officielle](https://exemple.org)
- [Référence complémentaire](https://exemple.org)
:::
