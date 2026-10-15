# 🐍 Fiche de révision — Module 3 : Visualisation

## Anatomie Matplotlib
- **Figure** = toile entière ; **Axes** = zone de tracé (avec axes x/y, titre, légende).
- API objet (recommandée) :
```python
import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(8,5))
ax.plot(x, y, label="s1")
ax.set_xlabel("t"); ax.set_ylabel("v"); ax.set_title("...")
ax.legend()
fig.savefig("f.png", dpi=150, bbox_inches="tight")
```
- Plusieurs : `fig, axes = plt.subplots(1, 2)`.

## Graphes essentiels
| Graphe | Méthode | Pour |
|---|---|---|
| Courbe | `ax.plot` | évolution temporelle |
| Nuage | `ax.scatter` | relation 2 variables |
| Histogramme | `ax.hist` | distribution |
| Barres | `ax.bar` | comparer catégories |
| Boxplot | `ax.boxplot` | dispersion + outliers |

- Depuis pandas : `df["age"].plot(kind="hist")`, `df.plot(x=..., y=..., kind="line")`.

## Seaborn (stat visuelle)
```python
import seaborn as sns
sns.histplot(data=df, x="age", hue="ville", kde=True)
sns.scatterplot(data=df, x="t", y="p", hue="sexe")
sns.boxplot(data=df, x="ville", y="salaire")
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap="coolwarm")
sns.pairplot(df, hue="classe")
```

## Quel graphe pour quelle question ?
- Distribution → histogramme / boxplot / KDE.
- Relation 2 numériques → scatter.
- Temps → courbe. Catégories → barres. Corrélations → heatmap / pairplot.

## Pièges
- Axe Y **non tronqué** (commencer à 0 pour les barres).
- Toujours titre + axes + unités + légende.
- Une idée par graphe. Palettes accessibles (`viridis`). Échelle log si grands écarts.
- Camembert : à éviter au-delà de 3-4 parts.

*Liens : [Matplotlib](https://matplotlib.org/stable/) · [Seaborn](https://seaborn.pydata.org/) · [data-to-viz](https://www.data-to-viz.com/)*
