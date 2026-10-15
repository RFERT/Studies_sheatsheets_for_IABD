---
title: Module 2 — Pandas : les données tabulaires
subtitle: Pandas est l'outil n°1 du data analyst : un tableur programmable. On charge, explore, filtre, agrège, joint et nettoie des données tabulaires avec une concision redoutable. C'est là que tu passeras le plus de temps en projet.
domains: DATA, BIG DATA
objectifs: Manier `Series` et `DataFrame` ; charger/explorer un jeu de données ; sélectionner avec `loc`/`iloc` et filtrer par condition ; agréger avec `groupby` ; joindre avec `merge` ; gérer les valeurs manquantes ; transformer avec `apply` et les méthodes vectorisées.
---

## 1. Series & DataFrame

Une `Series` = une colonne (valeurs + index). Un `DataFrame` = un tableau (plusieurs Series partageant un index).

```python
import pandas as pd

s = pd.Series([10, 20, 30], index=["a", "b", "c"])

df = pd.DataFrame({
    "nom": ["Ana", "Ben", "Cléo"],
    "age": [25, 30, 22],
    "ville": ["Paris", "Lyon", "Paris"],
})
```

::: info Sous le capot
Chaque colonne d'un DataFrame est un tableau NumPy typé. Tout ce que tu as appris au Module 1 (vectorisation, masques) s'applique ici.
:::

## 2. Charger & explorer (le premier réflexe)

```python
df = pd.read_csv("data.csv")        # aussi : read_excel, read_json, read_parquet, read_sql

df.head(); df.tail(3)            # aperçu début / fin
df.shape                        # (lignes, colonnes)
df.info()                       # types & valeurs non nulles
df.describe()                   # stats des colonnes numériques
df.columns; df.dtypes
df["ville"].value_counts()      # fréquence des catégories
df["age"].nunique()            # nombre de valeurs distinctes
```

::: info La check-list d'exploration (EDA)
`.head()` → `.info()` → `.describe()` → `.isna().sum()` → `.value_counts()` sur les catégories. En 5 commandes tu « sens » un dataset.
:::

::: quiz Quiz 2.1
Quelle méthode donne un résumé statistique (moyenne, min, quartiles) des colonnes numériques ?
- [x] `df.describe()`
- [ ] `df.info()`
- [ ] `df.head()`
- [ ] `df.stats()`
> <code>describe()</code> renvoie count, mean, std, min, quartiles et max. <code>info()</code> donne types et valeurs non nulles ; <code>head()</code> affiche les premières lignes.
:::

## 3. Sélection : `loc` vs `iloc` ⭐

```python
df["age"]                  # une colonne (Series)
df[["nom", "age"]]          # plusieurs colonnes (DataFrame)

df.loc[0, "nom"]           # loc = par ÉTIQUETTE (nom)
df.loc[0:2, ["nom", "age"]]  # bornes INCLUSES avec loc
df.iloc[0, 1]              # iloc = par POSITION (entiers)
df.iloc[:3, :2]            # bornes exclues (comme Python)
```

|  | `loc` | `iloc` |
| --- | --- | --- |
| Clé | Étiquette (nom de ligne/colonne) | Position entière |
| Bornes | Incluses | Exclues |

::: info Confusion n°1
Avec `loc`, `0:2` renvoie 3 lignes (0, 1, 2) ; avec `iloc`, 2 lignes (0, 1). Choisis selon que tu raisonnes en *noms* ou en *positions*.
:::

## 4. Filtrer par condition (masques booléens)

```python
df[df["age"] > 24]                       # lignes où age > 24
df[(df["age"] > 24) & (df["ville"] == "Paris")]  # & / | + parenthèses
df[df["ville"].isin(["Paris", "Lyon"])]      # appartenance
df.query("age > 24 and ville == 'Paris'")  # syntaxe lisible
```

::: info SettingWithCopyWarning
Pour modifier un sous-ensemble, utilise `df.loc[masque, "col"] = valeur` plutôt que `df[masque]["col"] = ...` (qui opère sur une copie et n'a pas d'effet).
:::

::: quiz Quiz 4.1
Pourquoi `df[df.a > 5 and df.b < 3]` plante-t-il ?
- [ ] Il manque un `.loc`
- [ ] `a` et `b` ne sont pas numériques
- [x] Il faut `&` et des parenthèses, pas `and` (qui ne marche pas sur des Series)
- [ ] `df` est vide
> Sur des Series, on combine les masques avec <code>&</code> (et), <code>|</code> (ou), chaque condition entre parenthèses : <code>df[(df.a > 5) & (df.b < 3)]</code>. <code>and</code>/<code>or</code> ne fonctionnent que sur des booléens scalaires.
:::

## 5. Créer & transformer des colonnes

```python
df["age_mois"] = df["age"] * 12          # vectorisé
df["majeur"] = df["age"] >= 18
df["cat"] = pd.cut(df["age"], [0, 25, 60, 120],
                  labels=["jeune", "adulte", "senior"])  # binning
df = df.rename(columns={"nom": "prenom"})
df = df.drop(columns=["age_mois"])
df["ville"] = df["ville"].str.upper()         # accesseur .str vectorisé
```

::: info Accesseurs
`.str` (texte), `.dt` (dates), `.cat` (catégories) appliquent des opérations vectorisées sur toute une colonne, sans boucle.
:::

## 6. Valeurs manquantes (NaN)

```python
df.isna().sum()                 # nombre de NaN par colonne
df.dropna()                     # supprime les lignes avec NaN
df.dropna(subset=["age"])       # seulement si age manque
df["age"].fillna(df["age"].median())  # impute par la médiane
df["ville"].fillna("inconnu")       # impute une catégorie
df.ffill()                      # propage la dernière valeur (séries temporelles)
```

::: info Supprimer ou imputer ?
Supprimer est simple mais perd de l'information (et peut biaiser). Imputer (médiane pour le numérique, mode/« inconnu » pour les catégories) préserve les lignes. Le bon choix dépend du *pourquoi* la donnée manque.
:::

## 7. `groupby` : agréger par groupe ⭐⭐

Le schéma **split → apply → combine** : on découpe par clé, on agrège chaque groupe, on recombine.

```python
df.groupby("ville")["age"].mean()        # âge moyen par ville
df.groupby("ville").size()                # effectif par ville

# Plusieurs agrégations d'un coup
df.groupby("ville").agg(
    age_moyen=("age", "mean"),
    age_max=("age", "max"),
    effectif=("age", "count"),
)

# Grouper par plusieurs clés
df.groupby(["ville", "majeur"])["age"].mean()
```

::: info transform : agréger en gardant la forme
```
# moyenne du groupe, alignée sur chaque ligne (utile pour centrer par groupe)
df["age_moy_ville"] = df.groupby("ville")["age"].transform("mean")
```
:::

::: quiz Quiz 7.1
Que renvoie `df.groupby("ville")["age"].mean()` ?
- [ ] La moyenne globale des âges
- [x] Une Series : l'âge moyen pour chaque ville
- [ ] Le nombre de personnes par ville
- [ ] Une erreur
> <code>groupby(\
:::

## 8. `merge` & `concat` : combiner des tables ⭐

`merge` = jointure SQL (associer des lignes via une clé commune).

```python
clients = pd.DataFrame({"id": [1, 2, 3], "nom": ["A", "B", "C"]})
cmds    = pd.DataFrame({"id": [1, 1, 2], "montant": [10, 20, 5]})

pd.merge(clients, cmds, on="id", how="inner")   # seulement les id communs
pd.merge(clients, cmds, on="id", how="left")    # tous les clients
```

| `how` | Garde… |
| --- | --- |
| `inner` | Les clés présentes des **deux** côtés (défaut) |
| `left` | Toutes les lignes de gauche |
| `right` | Toutes les lignes de droite |
| `outer` | L'union des deux |

### concat : empiler

```python
pd.concat([df1, df2])              # empile les lignes (axis=0)
pd.concat([df1, df2], axis=1)      # colle les colonnes
```

::: info merge = JOIN
`how="inner"` ↔ `INNER JOIN`, `how="left"` ↔ `LEFT JOIN`. Si tu connais SQL, tu connais déjà `merge`.
:::

::: quiz Quiz 8.1
Tu veux garder *tous* les clients, même ceux sans commande. Quel `how` ?
- [ ] `inner`
- [ ] `right`
- [ ] `cross`
- [x] `left` (si clients est à gauche)
> <code>how=\
:::

## 9. apply, dates, texte & pivot

### apply / map (quand la vectorisation ne suffit pas)

```python
df["initiale"] = df["prenom"].apply(lambda s: s[0])
df["age2"] = df["age"].map({25: "jeune"})   # remplacement par dict
```

::: info apply est lent
Préfère toujours les opérations vectorisées (`.str`, `.dt`, arithmétique) ; `apply` boucle en Python. Garde-le pour la logique qui ne se vectorise pas.
:::

### Dates (.dt)

```python
df["date"] = pd.to_datetime(df["date"])
df["annee"] = df["date"].dt.year
df["jour_sem"] = df["date"].dt.day_name()
```

### Pivot (tableau croisé)

```python
df.pivot_table(index="ville", columns="majeur",
               values="age", aggfunc="mean")
```

### Trier & exporter

```python
df.sort_values("age", ascending=False)
df.to_csv("sortie.csv", index=False)
```

## 10. Exercices

::: exo Exercice 1 — Filtrage
Sélectionne les lignes où `age > 30` *et* `ville` vaut « Paris », en ne gardant que les colonnes `nom` et `age`.
?? Voir la solution
```python
df.loc[(df["age"] > 30) & (df["ville"] == "Paris"), ["nom", "age"]]
```
:::

::: exo Exercice 2 — groupby (⭐)
Calcule, pour chaque ville, l'âge moyen et le nombre de personnes, trié par effectif décroissant.
?? Voir la solution
```python
(df.groupby("ville")
   .agg(age_moyen=("age", "mean"), effectif=("age", "count"))
   .sort_values("effectif", ascending=False))
```
:::

::: exo Exercice 3 — Jointure (⭐)
Associe chaque commande au nom de son client (garde toutes les commandes), puis calcule le montant total par client.
?? Voir la solution
```python
(cmds.merge(clients, on="id", how="left")
     .groupby("nom")["montant"].sum())
```
:::

::: culture Culture & histoire
Comment un outil né dans la finance est devenu le couteau suisse de la data.
En 2008, **Wes McKinney**, analyste quantitatif chez AQR Capital, en a assez de jongler entre Excel et des scripts bricolés pour manipuler des séries financières. Il crée pandas (de « *panel data* ») pour avoir, en Python, la souplesse d'un tableur avec la puissance du code.

#### Repères
- **Wes McKinney** (2008) — créateur de pandas ; auteur de *Python for Data Analysis*, la référence.
- **Le DataFrame** — concept emprunté au langage **R** (`data.frame`), lui-même inspiré des tableurs.
- **Open source** (2009) — libéré, pandas explose avec la montée de la data science (2012+).
- **Apache Arrow** (2016) — McKinney s'attaque ensuite à la performance mémoire inter-langages ; pandas 2.0 (2023) s'appuie sur Arrow.

#### L'écosystème aujourd'hui
pandas reste la porte d'entrée, mais pour le très gros volume, des alternatives au même « look » émergent : **Polars** (ultra-rapide, en Rust 🦀), **Dask** et **Spark** (distribué). Apprendre pandas, c'est apprendre un vocabulaire (filtrer, grouper, joindre) qui se transpose partout.
- [Doc pandas](https://pandas.pydata.org/docs/)
- [pandas (Wikipédia)](https://fr.wikipedia.org/wiki/Pandas)
- [Python for Data Analysis (livre)](https://wesmckinney.com/book/)
- [Polars (alternative Rust)](https://pola.rs/)
:::
