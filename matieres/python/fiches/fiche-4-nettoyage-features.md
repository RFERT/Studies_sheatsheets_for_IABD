# 🐍 Fiche de révision — Module 4 : Nettoyage & feature engineering

> « Garbage in, garbage out. » ~80 % du travail réel.

## Valeurs manquantes
| Stratégie | Quand |
|---|---|
| Supprimer ligne | peu de cas, manquant au hasard |
| Supprimer colonne | majorité vide |
| Imputer médiane | numérique (robuste aux outliers) |
| Imputer mode/"inconnu" | catégoriel |
| Flag d'absence | si le manque porte de l'info |

```python
from sklearn.impute import SimpleImputer
imp = SimpleImputer(strategy="median")
X = imp.fit_transform(X)
```

## Outliers
- IQR : `q1, q3 = s.quantile([.25,.75]); iqr = q3-q1`.
- Aberrant si `< q1 - 1.5*iqr` ou `> q3 + 1.5*iqr`.
- Traiter : **plafonner** (`.clip(bas, haut)`) souvent mieux que supprimer.
- ⚠️ Un outlier ≠ une erreur (peut être le signal à détecter : fraude).

## Encodage des catégories
| Méthode | Pour | Attention |
|---|---|---|
| One-Hot | sans ordre (ville) | explose si haute cardinalité |
| Ordinal | ordre naturel (S<M<L) | impose un ordre sinon |
| Target/fréquence | haute cardinalité | risque de fuite |

- ⚠️ Label encoding abusif crée un **faux ordre**. `pd.get_dummies(df, columns=[...], drop_first=True)`.

## Scaling
| Technique | Formule | Résultat |
|---|---|---|
| StandardScaler | (x−μ)/σ | moyenne 0, std 1 |
| MinMaxScaler | (x−min)/(max−min) | [0,1] |
| RobustScaler | (x−médiane)/IQR | robuste outliers |

- `fit` sur le **train** seulement, puis `transform` sur le test.
- Arbres (RF, XGBoost) : scaling **inutile**. k-NN, SVM, gradient : **crucial**.

## Créer des features
- Dates → jour/mois/weekend/ancienneté. Texte → longueur, mots-clés, TF-IDF.
- Agrégats (`groupby().transform`), ratios (prix/surface), binning (`pd.cut`), `np.log1p` (asymétrie).

## Fuite de données (data leakage) ⭐
- Scaler/imputer **avant** le split → stats du test fuient. ✅ `fit` sur train.
- Variable non dispo au moment de la prédiction (date de résiliation…). ✅ retirer.
- Parade : enchaîner dans un **Pipeline** scikit-learn.

*Liens : [Préprocessing sklearn](https://scikit-learn.org/stable/modules/preprocessing.html) · [Data leakage](https://en.wikipedia.org/wiki/Leakage_(machine_learning))*
