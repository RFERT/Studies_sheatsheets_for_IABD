---
title: Module 4 — Nettoyage & feature engineering
subtitle: « Garbage in, garbage out. » 80 % du travail réel d'un data scientist, c'est préparer les données : nettoyer, encoder, mettre à l'échelle, créer des variables utiles. Un bon feature engineering bat souvent un modèle sophistiqué sur des données brutes.
domains: DATA, IA
objectifs: Traiter valeurs manquantes et aberrantes ; encoder les variables catégorielles ; normaliser/standardiser le numérique ; extraire des features (dates, texte) ; comprendre et éviter la **fuite de données** (data leakage), l'erreur n°1 qui ruine un modèle.
---

## 1. Valeurs manquantes — stratégies

| Stratégie | Quand |
| --- | --- |
| Supprimer la ligne | Peu de cas, manquant « au hasard » |
| Supprimer la colonne | Majorité de la colonne vide |
| Imputer (médiane/moyenne) | Numérique ; médiane = robuste aux outliers |
| Imputer (mode / « inconnu ») | Catégoriel |
| Indicateur de manque | Si le fait « manque » porte de l'info |

```python
from sklearn.impute import SimpleImputer
imp = SimpleImputer(strategy="median")
X_num = imp.fit_transform(X_num)       # apprend la médiane puis remplace

df["a_manque"] = df["revenu"].isna().astype(int)  # flag d'absence
```

::: info Moyenne vs médiane
La moyenne est tirée par les valeurs extrêmes ; sur des revenus ou des prix, la **médiane** est presque toujours un meilleur choix d'imputation.
:::

## 2. Valeurs aberrantes (outliers)

Les détecter avec la règle de l'IQR (écart interquartile) ou le z-score.

```python
q1, q3 = df["prix"].quantile([0.25, 0.75])
iqr = q3 - q1
bas, haut = q1 - 1.5*iqr, q3 + 1.5*iqr
outliers = df[(df["prix"] < bas) | (df["prix"] > haut)]

# Traiter : plafonner (winsoriser) plutôt que supprimer
df["prix"] = df["prix"].clip(bas, haut)
```

::: info Un outlier n'est pas forcément une erreur
Une transaction énorme peut être une fraude *à détecter*, pas un bruit à supprimer. Comprends l'origine avant d'agir : supprimer aveuglément peut effacer le signal le plus intéressant.
:::

::: quiz Quiz 2.1
Avec la règle de l'IQR, une valeur est « aberrante » si elle dépasse…
- [ ] la moyenne ± l'écart-type
- [x] Q1 − 1,5·IQR ou Q3 + 1,5·IQR
- [ ] toujours 100
- [ ] le maximum
> La règle classique (celle du boxplot) : en dessous de Q1 − 1,5·IQR ou au-dessus de Q3 + 1,5·IQR, avec IQR = Q3 − Q1. Robuste car basée sur les quantiles.
:::

## 3. Encodage des variables catégorielles ⭐

Les modèles ne mangent que des nombres. Il faut transformer les catégories.

| Méthode | Pour… | Attention |
| --- | --- | --- |
| **One-Hot** | Catégories sans ordre (ville, couleur) | Explose si bcp de modalités |
| **Ordinal** | Ordre naturel (petit<moyen<grand) | Impose un ordre faux sinon |
| **Target / mean** | Haute cardinalité | Risque de fuite (voir §6) |
| **Fréquence** | Haute cardinalité | Perd l'identité |

```python
# One-hot avec pandas
pd.get_dummies(df, columns=["ville"], drop_first=True)

# Avec scikit-learn (réutilisable dans un pipeline)
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder
ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
X_cat = ohe.fit_transform(df[["ville"]])
```

::: info Label encoding abusif
Encoder {Paris:0, Lyon:1, Nice:2} crée un *faux ordre* (« Nice > Lyon ») que le modèle croira réel. Pour des catégories sans ordre, utilise le one-hot.
:::

::: quiz Quiz 3.1
Pour une variable « couleur » (rouge, vert, bleu) sans ordre, quel encodage ?
- [x] One-Hot (une colonne 0/1 par couleur)
- [ ] Ordinal (0, 1, 2)
- [ ] Standardisation
- [ ] Aucun, on laisse le texte
> Sans ordre naturel, le one-hot évite d'introduire une fausse hiérarchie. L'ordinal conviendrait à « petit < moyen < grand ».
:::

## 4. Normalisation & standardisation

Beaucoup d'algorithmes (k-NN, SVM, descente de gradient, PCA) sont sensibles à l'échelle : une variable en milliers écrase une variable en unités.

| Technique | Formule | Résultat |
| --- | --- | --- |
| **StandardScaler** | (x − μ) / σ | Moyenne 0, écart-type 1 |
| **MinMaxScaler** | (x − min) / (max − min) | Entre 0 et 1 |
| **RobustScaler** | (x − médiane) / IQR | Robuste aux outliers |

```python
from sklearn.preprocessing import StandardScaler
sc = StandardScaler()
X_train_s = sc.fit_transform(X_train)   # apprend μ, σ sur le TRAIN
X_test_s  = sc.transform(X_test)        # applique SANS réapprendre
```

::: info fit sur le train uniquement
On apprend les paramètres (μ, σ) sur le **train**, puis on les applique au test. Faire `fit` sur l'ensemble complet = fuite de données (§6).
:::

::: info Les arbres s'en fichent
Les modèles à base d'arbres (Random Forest, XGBoost) ne sont pas sensibles à l'échelle : le scaling y est inutile. Il est crucial pour les modèles « à distance » ou « à gradient ».
:::

## 5. Créer des features (le nerf de la guerre)

- **Dates** → jour de la semaine, mois, week-end, heure, ancienneté. Une date brute est inutilisable ; ses composantes sont de l'or.
- **Texte** → longueur, nombre de mots, présence de mots-clés, TF-IDF (`TfidfVectorizer`).
- **Agrégats** → moyenne/somme par groupe (via `groupby().transform`), ratios, différences.
- **Interactions** → produits/ratios de variables (prix/surface = prix au m²).
- **Binning** → découper une variable continue en tranches (`pd.cut`).
- **Transformations** → `log1p` sur des variables très asymétriques (revenus, prix).

```python
df["prix_m2"] = df["prix"] / df["surface"]
df["log_revenu"] = np.log1p(df["revenu"])     # atténue l'asymétrie
df["weekend"] = df["date"].dt.dayofweek >= 5
```

::: info Le secret des bons modèles
En pratique (et sur Kaggle), ce sont souvent les *features* intelligentes — pas l'algorithme — qui font la différence. Connaître le domaine métier est ici un superpouvoir.
:::

## 6. Fuite de données (data leakage) ⭐⭐

La fuite = quand une information du futur ou du jeu de test « fuit » dans l'entraînement. Le modèle paraît excellent… puis s'effondre en production. C'est **l'erreur n°1** des débutants (et de quelques pros).

- **Scaler/imputer sur tout le dataset** avant le split → les stats du test contaminent le train. ✅ Fais `fit` sur le train seul.
- **Utiliser une variable non disponible au moment de la prédiction** (ex. « date de remboursement » pour prédire un défaut). ✅ Ne garde que l'info connue à l'instant T.
- **Target encoding naïf** calculé sur tout le jeu → la cible fuit. ✅ Validation croisée interne.
- **Doublons** présents dans train ET test → score gonflé.

::: info La parade : le Pipeline
Enchaîner préprocessing + modèle dans un `Pipeline` scikit-learn garantit que chaque étape ne voit que le train à chaque pli de validation. (Module 5.)
:::

::: quiz Quiz 6.1
Pourquoi standardiser *avant* de séparer train/test est-il une erreur ?
- [ ] Ça ralentit le calcul
- [ ] Ça change les types de données
- [x] Les statistiques (μ, σ) du test fuient dans le train : fuite de données
- [ ] Ce n'est pas une erreur
> Calculer μ et σ sur l'ensemble complet utilise de l'information du test pour transformer le train : le modèle « a vu » le test. On ajuste le scaler sur le train uniquement, puis on applique au test.
:::

## 7. Exercices

::: exo Exercice 1 — Imputation
Impute la colonne `revenu` (numérique, avec outliers) et la colonne `pays` (catégorielle). Quelles stratégies ?
?? Voir la solution
```python
df["revenu"] = df["revenu"].fillna(df["revenu"].median())   # médiane (robuste)
df["pays"] = df["pays"].fillna("inconnu")                    # catégorie dédiée
```
:::

::: exo Exercice 2 — Fuite de données (⭐)
Un collègue obtient 99 % d'accuracy en prédisant le churn, mais le modèle échoue en prod. Dans ses features : `date_de_resiliation`. Explique le problème.
?? Voir la solution
`date_de_resiliation` n'existe **que** pour les clients déjà partis : elle « révèle » la cible. Le modèle apprend « si cette date existe → churn », score parfait sur l'historique mais **inutilisable** au moment de prédire (la date n'est pas encore connue). C'est une fuite de données : retirer toute variable postérieure à l'instant de prédiction.
:::

::: culture Culture & histoire
Pourquoi « préparer la donnée » est le vrai métier.
Une enquête devenue célèbre affirmait que les data scientists passent environ **80 % de leur temps** à collecter et nettoyer les données, et se plaignent de cette corvée. Derrière la boutade se cache une vérité du métier : sans données propres, le modèle le plus brillant produit du vent.

#### Repères & idées
- **« Garbage in, garbage out »** (années 1950) — adage né avec les premiers ordinateurs ; toujours la règle d'or.
- **Tukey & l'EDA** (1977) — John Tukey impose l'*analyse exploratoire* : regarder et nettoyer avant de modéliser.
- **Andrew Ng & le « Data-Centric AI »** (2021) — plaide pour améliorer les *données* plutôt que de complexifier les modèles.
- **Feature engineering** — longtemps l'arme secrète des vainqueurs de Kaggle, avant l'essor du deep learning qui apprend ses propres features.
- [Préprocessing (scikit-learn)](https://scikit-learn.org/stable/modules/preprocessing.html)
- [Data cleansing](https://en.wikipedia.org/wiki/Data_cleansing)
- [Data leakage (EN)](https://en.wikipedia.org/wiki/Leakage_(machine_learning))
:::
