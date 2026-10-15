---
title: Module 3 — Visualisation de données
subtitle: Un graphique n'est pas une décoration : c'est un outil pour *comprendre* (analyse exploratoire) et *convaincre* (communication). On apprend l'anatomie de Matplotlib, la concision de Seaborn, et surtout : quel graphe pour quelle question.
domains: DATA
objectifs: Comprendre la structure Figure / Axes de Matplotlib ; tracer les graphes essentiels ; utiliser Seaborn pour la stat visuelle ; choisir le bon graphe selon la question ; éviter les pièges qui trompent l'œil.
---

## 1. Anatomie de Matplotlib

Deux objets clés : la **Figure** (la toile entière) et les **Axes** (une zone de tracé, avec ses axes x/y). On privilégie l'API « orientée objet » (`fig, ax`), plus claire et contrôlable.

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 5))
ax.plot(x, y, label="série 1")
ax.set_xlabel("temps"); ax.set_ylabel("valeur")
ax.set_title("Mon graphe")
ax.legend()
fig.savefig("figure.png", dpi=150, bbox_inches="tight")
plt.show()
```

### Plusieurs sous-graphes

```python
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
axes[0].hist(data); axes[1].scatter(x, y)
```

::: info pyplot « state-machine » vs objet
`plt.plot()` agit sur le graphe « courant » (pratique en notebook, fragile en script). Dès que tu fais plusieurs sous-graphes, utilise `fig, ax = plt.subplots()` et les méthodes `ax.*`.
:::

::: quiz Quiz 1.1
Dans Matplotlib, qu'est-ce qu'un objet `Axes` ?
- [ ] La fenêtre entière contenant tout
- [x] Une zone de tracé individuelle (avec ses axes x et y)
- [ ] Uniquement l'axe des abscisses
- [ ] La légende
> La <strong>Figure</strong> est la toile entière ; elle contient un ou plusieurs <strong>Axes</strong>, chacun étant une zone de tracé complète avec ses propres axes x/y, titre et légende.
:::

## 2. Les graphes essentiels

| Graphe | Méthode | Pour… |
| --- | --- | --- |
| Courbe | `ax.plot` | Évolution dans le temps |
| Nuage de points | `ax.scatter` | Relation entre 2 variables |
| Histogramme | `ax.hist` | Distribution d'une variable |
| Barres | `ax.bar` | Comparer des catégories |
| Boîte à moustaches | `ax.boxplot` | Dispersion & outliers |
| Camembert | `ax.pie` | Proportions (à éviter souvent) |

### Tracer directement depuis pandas

```python
df["age"].plot(kind="hist", bins=20)
df.plot(x="date", y="ventes", kind="line")
df["ville"].value_counts().plot(kind="bar")
```

::: info Astuce
pandas branche Matplotlib automatiquement : `df.plot()` suffit pour un aperçu rapide pendant l'exploration.
:::

## 3. Seaborn : la statistique visuelle

Seaborn est bâti sur Matplotlib mais pense « statistique » : beaux graphes, intégration pandas, et calculs (régression, distributions) intégrés.

```python
import seaborn as sns

sns.histplot(data=df, x="age", hue="ville", kde=True)
sns.scatterplot(data=df, x="taille", y="poids", hue="sexe")
sns.boxplot(data=df, x="ville", y="salaire")
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap="coolwarm")
sns.pairplot(df, hue="classe")   # matrice de nuages (EDA express)
```

::: info Le réflexe EDA
Une `heatmap` des corrélations + un `pairplot` donnent en deux lignes une vue d'ensemble des relations entre variables.
:::

::: quiz Quiz 3.1
Quel graphe pour repérer rapidement les **corrélations** entre toutes les variables numériques ?
- [x] Une heatmap de `df.corr()`
- [ ] Un camembert
- [ ] Un histogramme
- [ ] Un graphe en barres
> Une heatmap de la matrice de corrélation montre d'un coup d'œil les paires fortement corrélées (positif/négatif), utile avant un modèle (multicolinéarité).
:::

## 4. Quel graphe pour quelle question ?

- **Distribution d'une variable** → histogramme, boxplot, KDE.
- **Relation entre deux variables numériques** → nuage de points (scatter).
- **Évolution dans le temps** → courbe (line).
- **Comparer des catégories** → barres (bar).
- **Composition / parts d'un tout** → barres empilées (plutôt que camembert).
- **Corrélations multiples** → heatmap, pairplot.

::: info Le camembert, avec parcimonie
L'œil compare mal des angles. Au-delà de 3-4 parts, un graphe en barres est presque toujours plus lisible.
:::

## 5. Pièges & bonnes pratiques

- **Axe Y tronqué** : ne pas commencer à 0 exagère les différences — grand classique de la manipulation visuelle.
- **Toujours étiqueter** : titre, axes (avec unités), légende. Un graphe sans contexte ne vaut rien.
- **Trop d'info tue l'info** : une idée par graphe. Enlève le superflu (« data-ink ratio », Tufte).
- **Couleurs accessibles** : évite rouge/vert seuls (daltonisme) ; utilise des palettes perceptuelles (`viridis`).
- **Échelle log** quand les ordres de grandeur varient beaucoup (`ax.set_yscale("log")`).

::: info Métier
En entreprise, 80 % de l'impact d'une analyse vient de sa *restitution*. Savoir raconter une histoire avec un graphe clair est une compétence aussi valorisée que modéliser.
:::

## 6. Exercices

::: exo Exercice 1 — Choix du graphe
Tu veux montrer la relation entre la surface d'un logement et son prix. Quel graphe, et pourquoi ?
?? Voir la solution
Un **nuage de points** (`scatter`) : deux variables numériques continues, on cherche une tendance/corrélation. On peut ajouter une couleur (`hue`) pour une 3ᵉ variable (ville) et une droite de régression (`sns.regplot`).
:::

::: exo Exercice 2 — Figure propre
Trace l'histogramme des âges avec titre, axes étiquetés et 20 classes, via l'API objet.
?? Voir la solution
```python
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(df["age"], bins=20)
ax.set_title("Distribution des âges")
ax.set_xlabel("âge"); ax.set_ylabel("effectif")
plt.show()
```
:::

::: culture Culture & histoire
La dataviz, de la rose de Nightingale aux bibliothèques Python.
Bien avant l'informatique, la visualisation sauvait des vies. En 1854, **John Snow** cartographie les cas de choléra à Londres et identifie une pompe à eau contaminée — acte de naissance de l'épidémiologie moderne. En 1858, **Florence Nightingale** invente son « diagramme en rose » pour convaincre l'armée britannique que l'hygiène tuait plus que les combats.

#### Repères
- **John Snow** (1854) — la carte du choléra, pionnière de la data géographique.
- **Florence Nightingale** (1858) — pionnière de la dataviz statistique au service de la décision.
- **Edward Tufte** (1983) — *The Visual Display of Quantitative Information* ; invente le « data-ink ratio » (maximiser l'info, minimiser l'encre).
- **John Hunter** (2003) — crée Matplotlib pour visualiser des signaux de neurologie ; en fait un standard open source.
- **Michael Waskom** (2012) — crée Seaborn pour rendre la stat visuelle élégante et simple.
- [Doc Matplotlib](https://matplotlib.org/stable/)
- [Doc Seaborn](https://seaborn.pydata.org/)
- [John Snow & le choléra](https://fr.wikipedia.org/wiki/John_Snow_(m%C3%A9decin))
- [data-to-viz (choisir son graphe)](https://www.data-to-viz.com/)
:::
