# 🐍 Fiche de révision — Module 2 : Pandas

## Objets
- `Series` = une colonne (valeurs + index). `DataFrame` = tableau (Series partageant un index).
- Chaque colonne est un array NumPy typé.

## Charger & explorer (réflexe EDA)
```python
df = pd.read_csv("data.csv")
df.head(); df.info(); df.describe()
df.shape; df.columns; df.dtypes
df["c"].value_counts(); df["c"].nunique()
df.isna().sum()           # NaN par colonne
```

## Sélection : loc vs iloc
- `df["col"]`, `df[["a","b"]]`.
- `df.loc[0, "nom"]` → **étiquette**, bornes **incluses**.
- `df.iloc[0, 1]` → **position**, bornes **exclues**.

## Filtrer
```python
df[df["age"] > 24]
df[(df["age"] > 24) & (df["ville"] == "Paris")]   # & | + parenthèses
df[df["ville"].isin(["Paris","Lyon"])]
df.query("age > 24 and ville == 'Paris'")
```
- ⚠️ Modifier : `df.loc[masque, "col"] = v` (évite SettingWithCopyWarning).

## Colonnes
```python
df["x2"] = df["x"] * 12
df["ville"] = df["ville"].str.upper()   # accesseur .str
df = df.rename(columns={"nom":"prenom"}).drop(columns=["x2"])
pd.cut(df["age"], [0,25,60,120], labels=["jeune","adulte","senior"])
```

## Valeurs manquantes
- `df.isna().sum()`, `df.dropna(subset=["age"])`, `df["age"].fillna(df["age"].median())`.
- Numérique → médiane ; catégoriel → mode/"inconnu".

## groupby (split → apply → combine) ⭐
```python
df.groupby("ville")["age"].mean()
df.groupby("ville").agg(moy=("age","mean"), n=("age","count"))
df.groupby("v")["a"].transform("mean")   # garde la forme
```

## merge & concat ⭐
```python
pd.merge(a, b, on="id", how="left")      # inner/left/right/outer
pd.concat([a, b])            # empile (lignes)
pd.concat([a, b], axis=1)    # colle (colonnes)
```
- `inner` = INNER JOIN ; `left` = LEFT JOIN.

## Avancé
- `.apply(lambda ...)` (lent, dernier recours) ; `.map(dict)`.
- Dates : `pd.to_datetime`, `.dt.year`, `.dt.day_name()`.
- `df.pivot_table(index=..., columns=..., values=..., aggfunc="mean")`.
- `df.sort_values("x", ascending=False)` ; `df.to_csv("out.csv", index=False)`.

*Liens : [Doc pandas](https://pandas.pydata.org/docs/) · [Python for Data Analysis](https://wesmckinney.com/book/)*
