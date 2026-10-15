---
title: Module 5 — scikit-learn & workflow ML
subtitle: Le pont vers le Machine Learning. scikit-learn offre une API d'une élégance rare : `fit`/`predict`/`transform`, la même pour des dizaines d'algorithmes. On voit le workflow complet, les métriques, les pipelines et la validation — les réflexes qui évitent de se mentir à soi-même.
domains: IA, DATA
objectifs: Comprendre l'API `fit`/`predict`/`transform` ; séparer train/test ; choisir et lire les bonnes métriques ; construire un **Pipeline** ; valider avec la **cross-validation** ; optimiser avec `GridSearchCV` ; diagnostiquer sur/sous-apprentissage.
---

## 1. L'API unifiée : fit / predict / transform

Tout objet scikit-learn (*estimator*) suit le même contrat. Change de modèle = change une ligne.

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X_train, y_train)      # apprend
y_pred = model.predict(X_test)    # prédit
proba  = model.predict_proba(X_test)  # probabilités
model.score(X_test, y_test)     # métrique par défaut
```

| Méthode | Qui | Rôle |
| --- | --- | --- |
| `fit` | Tous | Apprend les paramètres |
| `predict` | Modèles | Prédit une sortie |
| `transform` | Préprocesseurs | Transforme les données |
| `fit_transform` | Préprocesseurs | fit + transform d'un coup |

::: info Supervisé vs non supervisé
Supervisé : on a une cible `y` (classification, régression). Non supervisé : pas de `y` (clustering avec `KMeans`, réduction avec `PCA`).
:::

## 2. Train / test split

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42,
    stratify=y)   # stratify : garde les proportions de classes
```

::: info Toujours évaluer sur des données jamais vues
Mesurer la performance sur le train donne un score optimiste et trompeur. Le test simule la « vraie vie ». Pour les séries temporelles, on ne mélange pas : on coupe dans le temps.
:::

::: quiz Quiz 2.1
À quoi sert `stratify=y` dans un problème de classification déséquilibré ?
- [x] À conserver les mêmes proportions de classes dans train et test
- [ ] À trier les données
- [ ] À normaliser X
- [ ] À supprimer les classes rares
> La stratification garantit que chaque classe est représentée dans les mêmes proportions dans le train et le test — crucial si une classe est rare (fraude, maladie).
:::

## 3. Métriques : mesurer la bonne chose

### Classification

| Métrique | Répond à… |
| --- | --- |
| **Accuracy** | % de prédictions correctes (trompeur si déséquilibré) |
| **Précision** | Parmi les positifs prédits, combien sont vrais ? |
| **Rappel (recall)** | Parmi les vrais positifs, combien détectés ? |
| **F1-score** | Moyenne harmonique précision/rappel |
| **ROC-AUC** | Qualité du classement des probabilités |

```python
from sklearn.metrics import classification_report, confusion_matrix
print(classification_report(y_test, y_pred))
confusion_matrix(y_test, y_pred)
```

::: info Le piège de l'accuracy
Sur un dataset à 99 % de cas négatifs (fraude), un modèle qui dit « jamais de fraude » a 99 % d'accuracy… et est inutile. Regarde **rappel** et **F1**.
:::

### Régression

| Métrique | Sens |
| --- | --- |
| **MAE** | Erreur absolue moyenne (même unité, robuste) |
| **RMSE** | Pénalise fort les grosses erreurs |
| **R²** | Part de variance expliquée (1 = parfait) |

::: quiz Quiz 3.1
Détection de maladie rare : on veut surtout rater le moins de malades possible. Quelle métrique privilégier ?
- [ ] L'accuracy
- [ ] La précision
- [x] Le rappel (recall)
- [ ] Le R²
> Le rappel mesure la proportion de vrais malades effectivement détectés. Le maximiser = minimiser les faux négatifs (malades manqués), ce qui est l'objectif ici.
:::

## 4. Pipeline : enchaîner proprement ⭐

Un `Pipeline` enchaîne préprocessing + modèle en un seul objet. Avantage majeur : le préprocessing est **réappris à chaque pli** de validation → pas de fuite de données (Module 4 §6).

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

pre = ColumnTransformer([
    ("num", StandardScaler(), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])
pipe = Pipeline([
    ("prep", pre),
    ("model", RandomForestClassifier(random_state=42)),
])
pipe.fit(X_train, y_train)      # tout s'enchaîne
pipe.predict(X_test)
```

::: info Pourquoi c'est pro
Un seul objet contient tout le traitement : facile à sauvegarder (`joblib.dump`), à déployer, et garanti sans fuite. C'est le standard en entreprise.
:::

## 5. Validation croisée (cross-validation)

Un seul split peut être « chanceux ». La validation croisée en *k* plis entraîne/évalue k fois sur des découpes différentes, puis moyenne : une estimation bien plus fiable.

```python
from sklearn.model_selection import cross_val_score
scores = cross_val_score(pipe, X, y, cv=5, scoring="f1")
print(scores.mean(), "±", scores.std())
```

::: info k-fold
Avec `cv=5` : 5 entraînements, chacun testé sur 1/5 des données jamais vu à l'entraînement de ce pli. L'écart-type des scores indique la *stabilité* du modèle.
:::

## 6. Optimiser les hyperparamètres

```python
from sklearn.model_selection import GridSearchCV

grid = {
    "model__n_estimators": [100, 300],
    "model__max_depth": [None, 5, 10],
}
search = GridSearchCV(pipe, grid, cv=5, scoring="f1", n_jobs=-1)
search.fit(X_train, y_train)
search.best_params_; search.best_score_
```

::: info Paramètres vs hyperparamètres
Les **paramètres** sont appris par `fit` (poids). Les **hyperparamètres** sont fixés par toi (profondeur, nb d'arbres, régularisation) et optimisés par recherche. `RandomizedSearchCV` est plus rapide quand l'espace est grand.
:::

## 7. Sur-apprentissage & sous-apprentissage

| Situation | Symptôme | Remède |
| --- | --- | --- |
| **Overfitting** | Train ≫ test (modèle « par cœur ») | Régulariser, simplifier, plus de données |
| **Underfitting** | Train et test faibles | Modèle plus riche, meilleures features |
| **Bon** | Train ≈ test, tous deux bons | 🎉 |

::: info Compromis biais-variance
Sous-apprentissage = biais élevé (trop simple) ; sur-apprentissage = variance élevée (trop sensible aux données). Tout le ML consiste à trouver l'équilibre.
:::

::: quiz Quiz 7.1
Ton modèle a 99 % sur le train mais 65 % sur le test. Diagnostic ?
- [ ] Sous-apprentissage
- [x] Sur-apprentissage (overfitting)
- [ ] Fuite de données
- [ ] Le modèle est parfait
> Grand écart train/test = le modèle a mémorisé le train sans généraliser : overfitting. Remèdes : régularisation, modèle plus simple, plus de données, moins de features.
:::

## 8. Exercices

::: exo Exercice 1 — Choix de métrique
Pour un filtre anti-spam, vaut-il mieux maximiser la précision ou le rappel ? Discute.
?? Voir la solution
On privilégie souvent la **précision** : classer à tort un mail important comme spam (faux positif) est très coûteux pour l'utilisateur. On accepte de laisser passer quelques spams (faux négatifs) pour ne pas perdre de vrais messages. C'est un arbitrage métier : le F1 (ou un seuil ajusté) équilibre les deux.
:::

::: exo Exercice 2 — Pipeline (⭐)
Construis un pipeline : standardisation du numérique + one-hot du catégoriel + régression logistique, évalué en validation croisée 5 plis.
?? Voir la solution
```python
pre = ColumnTransformer([
    ("num", StandardScaler(), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])
pipe = Pipeline([("prep", pre), ("clf", LogisticRegression(max_iter=1000))])
cross_val_score(pipe, X, y, cv=5, scoring="f1").mean()
```
:::

::: culture Culture & histoire
scikit-learn : d'un projet d'été à l'outil ML le plus utilisé au monde.
En 2007, **David Cournapeau** lance scikit-learn pendant un Google Summer of Code. En 2010, une équipe de l'**INRIA** (institut de recherche français) reprend et structure le projet. Résultat : une bibliothèque à l'API si cohérente qu'elle est devenue le standard d'enseignement et d'industrie du ML classique.

#### Repères
- **David Cournapeau** (2007) — initie scikit-learn (le « scikit » = SciPy Toolkit).
- **INRIA** (2010) — Fabian Pedregosa, Gaël Varoquaux, Alexandre Gramfort & al. professionnalisent le projet (fierté française 🇫🇷).
- **L'API fit/predict** — sa cohérence a inspiré presque toutes les bibliothèques ML suivantes.
- **Jupyter / IPython** (Fernando Pérez, 2001→2014) — le notebook qui a rendu la data science interactive et partageable.

#### Où ça mène
scikit-learn couvre le ML « classique » (régression, arbres, SVM, clustering). Pour le deep learning (images, texte, LLM), on passe à **PyTorch** ou **TensorFlow** — mais les réflexes vus ici (split, métriques, validation, éviter la fuite) restent universels.
- [Doc scikit-learn](https://scikit-learn.org/stable/)
- [scikit-learn (Wikipédia)](https://fr.wikipedia.org/wiki/Scikit-learn)
- [Tutoriels officiels](https://scikit-learn.org/stable/tutorial/index.html)
:::
