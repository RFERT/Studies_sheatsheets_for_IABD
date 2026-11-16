---
title: Antisèche Machine Learning
subtitle: Fondations, modèles linéaires, arbres & ensembles, non supervisé, évaluation — l'essentiel sur une page.
domains: DATA, IA
tags: généralisation, fuite de données, régularisation, forêts, boosting, K-means, PCA, précision/rappel, validation croisée
niveau: Révision express
---

Mémo dense des 5 modules du cours. Chaque carte = une notion. Survole les termes soulignés pour leur définition, clique sur les zones masquées pour t'auto-tester. Détail complet → [cours Machine Learning](cours.html?c=ML).

## Vocabulaire de base

| Terme | Sens |
|---|---|
| Observation | une ligne (un client, une image…) |
| Feature \(x\) | une variable explicative (une colonne) |
| Cible \(y\) | ce qu'on veut prédire |
| Matrice \(X\) | \(n\) observations × \(p\) features |
| Modèle \(f\) | fonction apprise telle que \(\hat y = f(x)\) |

| Cadre | Données | Exemple |
|---|---|---|
| **Supervisé** — classification | \(X\) + \(y\) catégorielle | spam / non-spam |
| **Supervisé** — régression | \(X\) + \(y\) numérique | prix d'un logement |
| **Non supervisé** | \(X\) seul | segmentation clients |
| **Par renforcement** | actions + récompenses | jeu, robotique |

## Généraliser ≠ mémoriser

- But : bien prédire sur des données **jamais vues**, pas réciter le train.
- **Sous-apprentissage** (underfitting) : erreur train **et** test élevées → modèle trop simple (biais fort).
- **Sur-apprentissage** (overfitting) : erreur train faible, test élevée → modèle trop complexe (variance forte).

| Symptôme | Diagnostic | Remède |
|---|---|---|
| train ↓↓, test ↑ | overfitting | régulariser, simplifier, + de données |
| train ↑, test ↑ | underfitting | modèle plus riche, meilleures features |
| train ≈ test, bas | ✅ bon compromis | — |

::: tip
Toujours comparer à une **baseline** (classe majoritaire, moyenne) : un modèle qui ne la bat pas n'apprend rien.
:::

## Train / validation / test

- **Train** : ajuster les paramètres. **Validation** (ou CV) : choisir modèle et hyperparamètres. **Test** : estimation finale, **utilisé une seule fois**.
- `stratify=y` garde les proportions de classes (classes déséquilibrées).
- Données temporelles : découper **dans le temps** (passé → futur), jamais au hasard.

## Fuite de données (data leakage)

[[Fuite de données|une information indisponible au moment de la prédiction réelle s'est glissée dans l'entraînement]] → score trop beau pour être vrai.

| Fuite classique | Correction |
|---|---|
| `fit` du scaler / imputer sur **tout** le jeu | `fit` sur le train seul → `Pipeline` |
| feature calculée **avec la cible** ou après l'événement | supprimer la feature |
| doublons entre train et test | dédoublonner avant le split |
| split aléatoire sur une série temporelle | `TimeSeriesSplit` |

::: warn
Un score anormalement élevé (99 %) est un **signal d'alarme**, pas une victoire.
:::

## Workflow raisonné

1. Formuler le problème + choisir la **métrique** (coût métier des erreurs).
2. Séparer le **test** tout de suite et ne plus y toucher.
3. Baseline simple.
4. `Pipeline` (prétraitement + modèle) → validation croisée.
5. Recherche d'hyperparamètres (`GridSearchCV`).
6. Évaluation finale sur le test, puis interprétation des erreurs.

```python
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score

X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)
pipe = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
print(cross_val_score(pipe, X_tr, y_tr, cv=5, scoring="f1").mean())
pipe.fit(X_tr, y_tr)          # le scaler n'a vu QUE le train
print(pipe.score(X_te, y_te))  # test : une seule fois, à la fin
```

## Régression linéaire

\[ \hat y = w^\top x + b \qquad \text{MSE} = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat y_i)^2 \]

- Solution fermée (équation normale) : \(w = (X^\top X)^{-1} X^\top y\) — coûteuse si \(p\) est grand, instable si features colinéaires.
- Un coefficient \(w_j\) = variation de \(\hat y\) quand \(x_j\) augmente de 1, **toutes choses égales par ailleurs**.

::: warn
Comparer des coefficients n'a de sens que si les features sont **à la même échelle** (standardisées).
:::

## Descente de gradient

\[ w \leftarrow w - \eta \, \nabla_w L(w) \]

| \(\eta\) (learning rate) | Effet |
|---|---|
| trop petit | convergence très lente |
| bien choisi | la perte décroît régulièrement |
| trop grand | oscillations, **divergence** |

- Variantes : batch (tout le jeu), **stochastique** (1 exemple), **mini-batch** (le standard).
- Standardiser les features accélère nettement la convergence.

## Régression logistique

\[ P(y=1 \mid x) = \sigma(w^\top x + b), \qquad \sigma(z) = \frac{1}{1+e^{-z}} \]

- Sortie = **probabilité** ; classe = 1 si \(p \ge\) seuil (0,5 par défaut, **ajustable**).
- Perte = **log-loss** (entropie croisée) :
\[ L = -\frac{1}{n}\sum_i \big[y_i \log p_i + (1-y_i)\log(1-p_i)\big] \]
- Frontière de décision **linéaire** ; malgré son nom, c'est un **classifieur**.

## Régularisation

| | Pénalité | Effet |
|---|---|---|
| **Ridge (L2)** | \(\lambda \sum_j w_j^2\) | rétrécit tous les poids |
| **Lasso (L1)** | \(\lambda \sum_j \lvert w_j\rvert\) | met des poids **à 0** → sélection de features |
| **Elastic Net** | L1 + L2 | compromis |

::: warn
Dans scikit-learn : `Ridge(alpha=…)` / `Lasso(alpha=…)` → **alpha ↑ = plus de régularisation**. Mais `LogisticRegression(C=…)` : **C = 1/λ**, donc **C ↓ = plus de régularisation**.
:::

## Arbres de décision

- Questions successives « \(x_j \le s\) ? » choisies pour rendre les feuilles les plus **pures** possible.

\[ \text{Gini} = 1 - \sum_k p_k^2 \qquad H = -\sum_k p_k \log_2 p_k \]

- Pas besoin de standardiser ; lisibles ; captent les non-linéarités.
- **Très instables** et sur-apprennent si on les laisse pousser → limiter `max_depth`, `min_samples_leaf`.

## Bagging & forêts aléatoires

- **Bagging** : entraîner N modèles sur des échantillons **bootstrap** (tirage avec remise) puis voter / moyenner → **réduit la variance**.
- **Random Forest** = bagging d'arbres + sous-ensemble aléatoire de features à chaque split (`max_features`) → arbres décorrélés.
- Paramètres : `n_estimators` (plus = plus stable, jamais d'overfit par ce seul paramètre), `max_depth`, `max_features`.
- Bonus : score **OOB** (out-of-bag) = validation gratuite.

## Boosting

- Modèles **faibles en séquence** ; chacun corrige les erreurs (résidus) du précédent → **réduit le biais**.
- Gradient Boosting, `HistGradientBoostingClassifier`, XGBoost, LightGBM, CatBoost.
- Couple clé : `learning_rate` ↓ ⇒ `n_estimators` ↑. Utiliser l'**early stopping**.

| Besoin | Choix |
|---|---|
| Interprétabilité maximale | arbre peu profond |
| Robuste, peu de réglages | Random Forest |
| Meilleure perf. sur données tabulaires | Boosting (bien réglé) |

## K-means

1. Choisir \(k\) centroïdes initiaux (`k-means++`).
2. Affecter chaque point au centroïde le plus proche.
3. Recalculer chaque centroïde = moyenne de son groupe.
4. Répéter jusqu'à stabilité.

\[ \text{Inertie} = \sum_{i} \lVert x_i - \mu_{c(i)} \rVert^2 \]

::: warn
Fondé sur des **distances** → **standardiser** ! Suppose des groupes plutôt sphériques, de tailles comparables. Résultat dépendant de l'initialisation (`n_init`).
:::

## Choisir k & évaluer des groupes

- **Coude** : inertie en fonction de \(k\), chercher la cassure (l'inertie baisse toujours quand \(k\) augmente).
- **Silhouette** \(s = \dfrac{b-a}{\max(a,b)} \in [-1, 1]\) — \(a\) : distance moyenne intra-groupe, \(b\) : au groupe voisin le plus proche. Proche de 1 = bien séparé.
- Toujours **interpréter** les groupes (profils moyens) : un cluster doit avoir un sens métier.

## PCA (ACP)

- Trouve les directions de **variance maximale** = vecteurs propres de la matrice de covariance (via la SVD).
- **Centrer** (et en général standardiser) avant.
- `explained_variance_ratio_` : part de variance par composante ; garder assez de composantes pour ~90–95 %.
- Usages : visualiser en 2D, compresser, débruiter. Les composantes sont des **combinaisons** des features (moins interprétables).

```python
from sklearn.decomposition import PCA
pca = make_pipeline(StandardScaler(), PCA(n_components=0.95))
Z = pca.fit_transform(X)   # garde 95 % de la variance
```

## Matrice de confusion

| | Prédit + | Prédit − |
|---|---|---|
| **Réel +** | VP (TP) | FN |
| **Réel −** | FP | VN (TN) |

\[ \text{Précision} = \frac{VP}{VP+FP} \quad \text{Rappel} = \frac{VP}{VP+FN} \quad F_1 = \frac{2PR}{P+R} \]

- **Précision** : « quand je dis +, ai-je raison ? » (coût des fausses alertes).
- **Rappel** : « ai-je trouvé tous les + ? » (coût des oublis : maladie, fraude).

::: warn
Classes déséquilibrées (1 % de fraudes) : prédire « jamais fraude » donne 99 % d'**accuracy** et 0 % de rappel. Ne jamais se fier à l'accuracy seule.
:::

## Seuil & courbes

- Baisser le seuil → **rappel ↑, précision ↓** (et inversement).
- **ROC** : TPR (rappel) vs FPR = \(FP/(FP+VN)\) ; **AUC** = 0,5 hasard, 1 parfait.
- **Courbe précision-rappel** : plus informative quand la classe positive est **rare**.
- Choisir le seuil sur la **validation**, selon le coût métier, jamais sur le test.

## Métriques de régression

| Métrique | Formule | Lecture |
|---|---|---|
| MAE | \(\frac1n\sum \lvert y-\hat y\rvert\) | erreur moyenne, robuste aux outliers |
| MSE | \(\frac1n\sum (y-\hat y)^2\) | pénalise fort les grosses erreurs |
| RMSE | \(\sqrt{\text{MSE}}\) | même unité que \(y\) |
| R² | \(1 - \frac{\sum (y-\hat y)^2}{\sum (y-\bar y)^2}\) | 1 parfait, 0 = prédire la moyenne, peut être < 0 |

## Validation croisée & hyperparamètres

- **k-fold** : k entraînements, chaque pli sert une fois de validation → moyenne **et écart-type** du score.
- `StratifiedKFold` (classification), `TimeSeriesSplit` (temps), `GroupKFold` (même patient/client dans un seul pli).
- `GridSearchCV` / `RandomizedSearchCV` : chercher les hyperparamètres **par CV sur le train**.

```python
from sklearn.model_selection import GridSearchCV
grid = GridSearchCV(pipe, {"logisticregression__C": [0.01, 0.1, 1, 10]},
                    cv=5, scoring="f1")
grid.fit(X_tr, y_tr); print(grid.best_params_, grid.best_score_)
```

## Trous à réviser

- Le surapprentissage se voit quand l'erreur de ==train est faible et celle de test élevée==.
- Le bagging réduit surtout la ==variance== ; le boosting réduit surtout le ==biais==.
- Rappel = VP / (==VP + FN==) ; précision = VP / (==VP + FP==).
- Dans `LogisticRegression`, diminuer C ==augmente== la régularisation.
- Le Lasso (L1) peut mettre des coefficients ==exactement à zéro==.
- K-means et PCA exigent de ==standardiser== les features.

::: quiz Auto-test — détection de fraude
Seulement 0,5 % des transactions sont frauduleuses. Quelle métrique suivre en priorité ?
- [ ] L'accuracy, car c'est la plus intuitive
- [x] Le rappel (et la précision / courbe PR), car rater une fraude coûte cher et la classe est rare
- [ ] Le R², car il mesure la qualité globale
> Avec 0,5 % de positifs, « toujours non-fraude » atteint 99,5 % d'accuracy en ne détectant rien. Le R² est une métrique de régression. On surveille le rappel, arbitré avec la précision via le seuil.
:::

::: quiz Auto-test — fuite
Quelle façon de standardiser évite la fuite de données ?
- [ ] Standardiser tout le jeu puis faire `train_test_split`
- [x] Faire `train_test_split` puis un `Pipeline(StandardScaler, modèle)` ajusté sur le train
- [ ] Standardiser le test avec ses propres moyenne et écart-type
> Le scaler doit apprendre ses paramètres uniquement sur le train, puis les appliquer tels quels au test. Ajuster sur tout le jeu laisse fuiter des statistiques du test ; ajuster sur le test seul crée deux échelles différentes.
:::

::: culture Pour aller plus loin
- [Guide utilisateur scikit-learn](https://scikit-learn.org/stable/user_guide.html)
- [Common pitfalls (scikit-learn)](https://scikit-learn.org/stable/common_pitfalls.html)
- [An Introduction to Statistical Learning (livre gratuit)](https://www.statlearning.com/)
:::
