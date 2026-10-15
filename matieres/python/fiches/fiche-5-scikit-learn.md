# 🐍 Fiche de révision — Module 5 : scikit-learn & workflow ML

## API unifiée
```python
model.fit(X_train, y_train)     # apprend
model.predict(X_test)           # prédit
model.predict_proba(X_test)     # probas
model.score(X_test, y_test)
```
| Méthode | Rôle |
|---|---|
| `fit` | apprend les paramètres |
| `predict` | prédit (modèles) |
| `transform` | transforme (préprocesseurs) |
| `fit_transform` | fit + transform |

- Supervisé (avec `y`) vs non supervisé (KMeans, PCA).

## Train / test split
```python
from sklearn.model_selection import train_test_split
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2,
                           random_state=42, stratify=y)
```
- `stratify=y` garde les proportions de classes. Toujours évaluer sur données **jamais vues**.

## Métriques
**Classification** : accuracy (trompeur si déséquilibré), précision, **rappel** (minimise les faux négatifs), F1, ROC-AUC.
`classification_report(y_te, y_pred)`, `confusion_matrix(...)`.
**Régression** : MAE, RMSE (pénalise gros écarts), R².
- ⚠️ Accuracy trompeuse sur classes déséquilibrées → regarder rappel/F1.

## Pipeline ⭐
```python
pre = ColumnTransformer([
    ("num", StandardScaler(), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])
pipe = Pipeline([("prep", pre), ("model", RandomForestClassifier())])
pipe.fit(X_tr, y_tr)
```
- Évite la fuite (préprocessing réappris à chaque pli). Sauvegarde : `joblib.dump`.

## Validation croisée
```python
from sklearn.model_selection import cross_val_score
cross_val_score(pipe, X, y, cv=5, scoring="f1").mean()
```

## Hyperparamètres
```python
GridSearchCV(pipe, grid, cv=5, scoring="f1", n_jobs=-1)
```
- **Paramètres** appris par `fit` (poids) ; **hyperparamètres** fixés par toi.

## Diagnostic
| Situation | Symptôme | Remède |
|---|---|---|
| Overfitting | train ≫ test | régulariser, simplifier, + données |
| Underfitting | train & test faibles | modèle plus riche, meilleures features |
- Compromis **biais-variance**.

*Liens : [Doc scikit-learn](https://scikit-learn.org/stable/) · [Tutoriels](https://scikit-learn.org/stable/tutorial/index.html)*
