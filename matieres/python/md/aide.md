---
title: Antisèche Python & Data Science
subtitle: Python avancé, NumPy, Pandas, visualisation, nettoyage & features, scikit-learn — les réflexes du data scientist.
domains: DATA, IA
tags: générateurs, décorateurs, typing, NumPy, broadcasting, Pandas, groupby, merge, encodage, Pipeline, scikit-learn
niveau: Révision express
---

Mémo des 6 modules du parcours Python & Data Science. Imports supposés : `import numpy as np`, `import pandas as pd`, `import matplotlib.pyplot as plt`, `import seaborn as sns`. Détail → [cours Python & Data Science](matieres/python/index.html).

## Compréhensions

```python
carres = [x * x for x in range(10) if x % 2 == 0]   # liste
index  = {mot: i for i, mot in enumerate(mots)}       # dict
uniq   = {c.lower() for c in texte if c.isalpha()}    # set
total  = sum(x * x for x in range(10**6))             # générateur : O(1) mémoire
```

::: tip
Lisible tant qu'elle tient sur une ligne. Au-delà de 2 niveaux d'imbrication → boucle `for` explicite.
:::

## Générateurs & itérateurs ★

```python
def lire_lignes(chemin):
    with open(chemin, encoding="utf-8") as f:
        for ligne in f:
            yield ligne.rstrip("\n")    # suspend la fonction, renvoie 1 élément

g = lire_lignes("log.txt")   # rien n'est lu tant qu'on n'itère pas
next(g)                      # 1re ligne ; StopIteration à la fin
```

- **Paresseux** : traite des fichiers plus gros que la RAM.
- Un générateur ne se parcourt **qu'une fois** (épuisé ensuite).
- `yield from sous_gen()` délègue à un autre itérable.

## Fonctions : arguments & closures

```python
def f(a, b=2, *args, kw_only, **kwargs): ...
f(1, 3, 4, 5, kw_only=True, x=9)   # args=(4, 5), kwargs={'x': 9}

def compteur():
    n = 0
    def inc():
        nonlocal n          # sinon UnboundLocalError
        n += 1
        return n
    return inc
```

::: warn
**Argument par défaut mutable** : `def f(l=[])` partage la même liste entre tous les appels. Écrire `def f(l=None): l = [] if l is None else l`.
:::

## Décorateurs ★

```python
import functools, time

def chrono(func):
    @functools.wraps(func)          # garde __name__ / __doc__
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        res = func(*args, **kwargs)
        print(f"{func.__name__}: {time.perf_counter() - t0:.3f}s")
        return res
    return wrapper

@chrono                              # équivaut à calcul = chrono(calcul)
def calcul(n): return sum(range(n))
```

- Utiles : `@functools.lru_cache`, `@property`, `@staticmethod`, `@classmethod`, `@dataclass`.

## Context managers, typing, dataclasses

```python
with open("a.csv") as f, open("b.csv", "w") as g:   # fermeture garantie, même en cas d'erreur
    g.write(f.read())

from dataclasses import dataclass, field
@dataclass(frozen=True)
class Point:
    x: float
    y: float = 0.0
    tags: list[str] = field(default_factory=list)   # jamais tags = []

def moyenne(v: list[float]) -> float | None: ...   # annotations (non vérifiées à l'exécution)
```

- Les annotations sont vérifiées par **mypy** / l'éditeur, **pas** par Python à l'exécution.
- Méthodes spéciales : `__repr__`, `__eq__`, `__len__`, `__iter__`, `__getitem__`, `__enter__/__exit__`.

## functools, itertools & syntaxe moderne

| Outil | Rôle |
|---|---|
| `functools.lru_cache` / `cache` | mémoïsation |
| `functools.partial` | figer des arguments |
| `itertools.chain`, `islice`, `groupby` | enchaîner, découper, grouper (données **triées**) |
| `itertools.product`, `combinations`, `permutations` | combinatoire |
| `collections.Counter`, `defaultdict` | compter, dict à valeur par défaut |

- 3.8 : walrus `if (n := len(x)) > 10:` · f-string `f"{x=}"`.
- 3.10 : `match`/`case` ; unions `int | None`.
- 3.11 : `ExceptionGroup`, messages d'erreur plus précis · 3.12 : `type Alias = …`.

## Erreurs & robustesse

```python
try:
    df = pd.read_csv(chemin)
except FileNotFoundError as e:       # attraper précis, jamais `except:` nu
    raise RuntimeError(f"Données absentes : {chemin}") from e
else:
    print("chargé")                  # si aucune exception
finally:
    print("toujours exécuté")
```

- EAFP (« plus facile de demander pardon ») : essayer puis gérer l'exception — style pythonique.

## NumPy : créer & décrire

```python
a = np.array([[1, 2, 3], [4, 5, 6]])   # shape (2, 3), dtype int64
np.zeros((3, 4)); np.ones(5); np.arange(0, 1, 0.1); np.linspace(0, 1, 11)
a.shape, a.ndim, a.dtype, a.size        # (2, 3), 2, int64, 6
a.sum(axis=0)   # par colonne → [5, 7, 9]   (axis=0 « écrase » les lignes)
a.sum(axis=1)   # par ligne   → [6, 15]
```

::: tip
`axis=k` = l'axe qui **disparaît** dans le résultat.
:::

## Vectorisation & masques ★

```python
x = np.random.default_rng(0).normal(size=1_000_000)
y = 3 * x + 1                 # boucle en C, ~100× plus rapide qu'un for Python
m = (x > 0) & (x < 1)         # & | ~ avec PARENTHÈSES (pas and/or)
x[m].mean(); x[x < 0] = 0     # filtrer, remplacer
np.where(x > 0, x, 0)         # if/else vectorisé
```

- Slicing `a[1:, ::2]` = **vue** (partage la mémoire) ; masque / indexation par liste = **copie**. Copie explicite : `.copy()`.

## Broadcasting ★★

Deux formes sont compatibles si, en comparant les dimensions **de la droite vers la gauche**, chaque paire est **égale** ou contient un **1**.

| A | B | Résultat |
|---|---|---|
| (3, 4) | (4,) | (3, 4) ✅ |
| (3, 4) | (3, 1) | (3, 4) ✅ |
| (3, 4) | (3,) | ❌ 4 ≠ 3 |

```python
X = np.random.rand(100, 3)
Xc = (X - X.mean(axis=0)) / X.std(axis=0)   # standardisation par colonne
a[:, None]   # (n,) → (n, 1)  ;  reshape(-1, 1) équivalent
```

## NumPy : forme & algèbre linéaire

```python
a.reshape(3, 2); a.reshape(-1)  # -1 = « déduis la taille »
a.T; np.concatenate([a, b], axis=0); np.vstack; np.hstack
A @ B                           # produit matriciel (≠ A * B, terme à terme)
np.linalg.inv(A); np.linalg.solve(A, b); np.linalg.eig(A); np.linalg.svd(A)
rng = np.random.default_rng(42)  # générateur moderne, reproductible
```

::: warn
Préférer `np.linalg.solve(A, b)` à `inv(A) @ b` : plus rapide et plus stable numériquement.
:::

## Pandas : charger & explorer

```python
df = pd.read_csv("ventes.csv", parse_dates=["date"])
df.head(); df.info(); df.describe(); df.shape
df["ville"].value_counts(); df.isna().sum(); df.duplicated().sum()
```

- `Series` = colonne indexée ; `DataFrame` = table de Series alignées sur un **index**.

## loc vs iloc & filtres ★

| | Sélection par | Borne de fin |
|---|---|---|
| `df.loc[lignes, cols]` | **étiquettes** / masques | **incluse** |
| `df.iloc[lignes, cols]` | **positions** entières | exclue |

```python
df.loc[df["montant"] > 100, ["client", "montant"]]
df[(df.ville == "Paris") & (df.montant.between(10, 50))]
df.query("ville == 'Paris' and montant > 100")
df.loc[df.montant < 0, "montant"] = 0     # affectation SANS chaînage
```

::: warn
`df[df.a > 0]["b"] = 1` → **SettingWithCopyWarning** : la modification part sur une copie. Utiliser `df.loc[masque, "b"] = 1`.
:::

## Transformer & valeurs manquantes

```python
df["ttc"] = df["ht"] * 1.2
df = df.assign(annee=df["date"].dt.year, nom=df["nom"].str.strip().str.title())
df["cat"] = df["prix"].apply(lambda p: "cher" if p > 100 else "ok")  # lent : préférer np.where
df.dropna(subset=["montant"]); df["age"].fillna(df["age"].median())
```

- `NaN` se propage dans les calculs ; `mean()` l'ignore par défaut (`skipna=True`).

## groupby ★★

```python
df.groupby("ville")["montant"].mean()
df.groupby(["ville", "mois"]).agg(
    ca=("montant", "sum"), nb=("id", "count"), panier=("montant", "mean")
).reset_index()
df["part"] = df["montant"] / df.groupby("ville")["montant"].transform("sum")
pd.pivot_table(df, index="ville", columns="mois", values="montant", aggfunc="sum")
```

- **split → apply → combine**. `agg` réduit (1 ligne par groupe) ; `transform` garde la **taille d'origine**.

## merge & concat ★

```python
pd.merge(cmd, clients, on="client_id", how="left", validate="many_to_one")
pd.concat([df_janv, df_fev], ignore_index=True)   # empiler des lignes
```

| `how` | Équivalent SQL |
|---|---|
| `inner` | INNER JOIN |
| `left` / `right` | LEFT / RIGHT JOIN |
| `outer` | FULL OUTER JOIN |

::: warn
Clé **dupliquée** des deux côtés → explosion du nombre de lignes. Vérifier `len()` avant/après ou `validate=`.
:::

## Visualisation : quel graphe ?

| Question | Graphe |
|---|---|
| Distribution d'une variable | histogramme, `sns.histplot`, boxplot |
| Relation entre 2 numériques | nuage de points `scatter` |
| Évolution dans le temps | courbe `plot` |
| Comparer des catégories | barres `bar` / `sns.barplot` |
| Corrélations multiples | `sns.heatmap(df.corr(numeric_only=True))` |

```python
fig, ax = plt.subplots(figsize=(8, 4))
ax.hist(df["montant"], bins=30); ax.set(title="Montants", xlabel="€", ylabel="n")
fig.tight_layout(); plt.show()
```

::: warn
Axe des ordonnées tronqué sur un diagramme en barres, camemberts à 10 parts, couleurs arc-en-ciel sur une échelle continue : à éviter.
:::

## Nettoyage & outliers

| Manquants | Stratégie |
|---|---|
| très peu, au hasard | supprimer les lignes |
| numérique | médiane (robuste) / moyenne |
| catégoriel | mode ou catégorie « inconnu » |
| informatif | + indicateur `est_manquant` |

- **Outliers (IQR)** : hors de \([Q_1 - 1{,}5\,\text{IQR}\,;\,Q_3 + 1{,}5\,\text{IQR}]\) avec IQR \(= Q_3 - Q_1\). Erreur de saisie → corriger ; valeur réelle rare → garder / transformer (log).

## Encodage & mise à l'échelle ★

| Variable | Encodage |
|---|---|
| nominale (ville, couleur) | `OneHotEncoder(handle_unknown="ignore")` |
| ordinale (S < M < L) | `OrdinalEncoder(categories=[["S", "M", "L"]])` |
| très haute cardinalité | regroupement des rares, target encoding (avec CV) |

| Scaler | Formule | Quand |
|---|---|---|
| `StandardScaler` | \((x - \mu)/\sigma\) | modèles linéaires, SVM, K-means, PCA |
| `MinMaxScaler` | \((x - \min)/(\max - \min)\) | bornes [0, 1], réseaux de neurones |
| `RobustScaler` | médiane / IQR | outliers présents |

- Arbres et forêts : **pas besoin** de mise à l'échelle.

## Fuite de données ★★

- Toute statistique (moyenne d'imputation, scaler, encodage) doit être **apprise sur le train seul**.
- Pas de feature calculée avec la cible ou connue **après** l'événement prédit.
- Séries temporelles : split chronologique.
- Solution systématique : **`Pipeline` + `ColumnTransformer`**.

## scikit-learn : l'API & le Pipeline ★

| Méthode | Rôle |
|---|---|
| `fit(X, y)` | apprendre (paramètres, statistiques) |
| `transform(X)` | appliquer un prétraitement |
| `fit_transform(X)` | les deux (**train uniquement**) |
| `predict(X)` / `predict_proba(X)` | prédire classes / probabilités |

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV

pre = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")),
                      ("sc", StandardScaler())]), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])
model = Pipeline([("pre", pre), ("clf", RandomForestClassifier(random_state=0))])
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2,
                                          stratify=y, random_state=0)
grid = GridSearchCV(model, {"clf__max_depth": [5, 10, None]}, cv=5, scoring="f1")
grid.fit(X_tr, y_tr)
print(grid.best_params_, grid.score(X_te, y_te))
```

- Nom des hyperparamètres dans un pipeline : `étape__paramètre` (double underscore).

## Métriques & diagnostic

| Tâche | Métriques |
|---|---|
| Classification | précision, rappel, F1, ROC-AUC, matrice de confusion |
| Régression | MAE, RMSE, R² |

- Train ≫ validation → **overfitting** (régulariser, simplifier). Les deux mauvais → **underfitting**.
- `cross_val_score` : regarder la moyenne **et** l'écart-type entre plis.

## Trous à réviser

- Un générateur produit ses valeurs ==à la demande (paresseux)== et ne se parcourt ==qu'une fois==.
- `df.loc` sélectionne par ==étiquettes== (fin incluse), `df.iloc` par ==positions== (fin exclue).
- Pour combiner des masques Pandas/NumPy : ==`&` et `|` avec parenthèses==.
- `groupby(...).transform` renvoie un résultat de ==même taille que le DataFrame==.
- Les formes (3, 4) et (3,) ne sont ==pas compatibles== en broadcasting.
- `fit_transform` ne s'appelle que sur ==le train==.

::: quiz Auto-test — mutable par défaut
Que renvoie le 2e appel ? `def f(x, l=[]): l.append(x); return l` puis `f(1)` et `f(2)`.
- [ ] `[2]`
- [x] `[1, 2]`
- [ ] Une erreur
> La valeur par défaut est évaluée une seule fois, à la définition de la fonction : les deux appels partagent la même liste. Solution : `l=None` puis créer la liste dans le corps.
:::

::: quiz Auto-test — broadcasting
`X` a la forme (100, 3). Quelle opération centre chaque colonne ?
- [x] `X - X.mean(axis=0)`
- [ ] `X - X.mean(axis=1)`
- [ ] `X - X.mean()`
> `X.mean(axis=0)` a la forme (3,) : une moyenne par colonne, diffusée sur les 100 lignes. `axis=1` donne (100,), incompatible avec (100, 3) en partant de la droite. `X.mean()` est la moyenne globale : ça centre le tableau entier, pas chaque colonne.
:::

::: culture Pour aller plus loin
- [Documentation Python (tutoriel officiel FR)](https://docs.python.org/fr/3/tutorial/)
- [NumPy — Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)
- [Pandas — User Guide](https://pandas.pydata.org/docs/user_guide/index.html)
- [scikit-learn — Pipelines & composite estimators](https://scikit-learn.org/stable/modules/compose.html)
:::
