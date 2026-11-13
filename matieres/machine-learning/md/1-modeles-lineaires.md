---
title: Modèles linéaires
subtitle: Prédire une valeur ou une classe à partir d'une combinaison pondérée des variables.
domains: IA, DATA
tags: régression linéaire, régression logistique, descente de gradient, fonction de perte, régularisation
niveau: Intermédiaire
duree: 40 min
objectifs: Écrire une régression linéaire et une régression logistique ; relier fonction de perte et apprentissage ; expliquer le rôle de la régularisation.
---

## 1. L'idée d'un modèle linéaire

Un modèle linéaire combine les variables avec des poids appris :

\[ \hat{y} = w_0 + w_1 x_1 + \cdots + w_p x_p = w_0 + \mathbf{w}^{\mathsf T}\mathbf{x} \]

Le poids \(w_j\) indique comment la prédiction varie quand \(x_j\) augmente d'une unité, **à variables restantes constantes**. Cette lecture dépend des unités, des transformations et des relations entre variables ; elle ne prouve pas une causalité.

L'apprentissage choisit les poids pour réduire une **fonction de perte** sur les exemples. Minimiser l'erreur d'entraînement ne suffit pas : il faut évaluer sur des données séparées pour vérifier la généralisation.

## 2. Régression linéaire : prédire une quantité

Pour une cible numérique, la régression linéaire minimise souvent l'erreur quadratique moyenne :

\[ \operatorname{MSE}(y,\hat{y}) = \frac{1}{n}\sum\_{i=1}^{n}(y_i-\hat{y}\_i)^2 \]

Le carré pénalise fortement les grosses erreurs et la perte est sensible aux valeurs extrêmes. Une relation réelle courbe peut être représentée en transformant les variables (par exemple ajouter \(x^2\)) ; le modèle reste alors linéaire par rapport aux poids.

```python
from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
```

`X_train` doit être une matrice à deux dimensions, même avec une seule variable. `fit` estime les coefficients ; `predict` applique ensuite le modèle à de nouvelles lignes.

::: quiz Quiz 2.1 — Lire un coefficient
Dans un modèle de prix de logement, le coefficient de la surface est positif. Quelle conclusion est la plus rigoureuse ?

- [ ] Augmenter la surface cause toujours une hausse de prix
- [x] À autres variables du modèle constantes, une surface plus grande augmente la prédiction
- [ ] Le modèle sera précis sur n'importe quelle ville
  > Le coefficient décrit une association conditionnelle dans le modèle, pas une causalité. La qualité dépend aussi des données, de la forme du modèle et du contexte d'utilisation.
:::

## 3. Descente de gradient : ajuster les poids

Quand la solution exacte n'est pas pratique, la **descente de gradient** améliore les poids dans la direction qui fait diminuer la perte :

\[ \mathbf{w}_{t+1} = \mathbf{w}\_t - \eta\,\nabla_{\mathbf{w}} L(\mathbf{w}\_t) \]

Le taux d'apprentissage \(\eta\) règle la taille du pas. Trop grand, il peut dépasser le minimum ; trop petit, l'apprentissage est lent. Les algorithmes modernes utilisent plusieurs variantes de cette idée.

::: info Une fonction de perte est un choix de modélisation
La perte formalise ce que l'algorithme considère comme une erreur. Une erreur quadratique, une erreur absolue et une perte logistique ne punissent pas les prédictions de la même manière.
:::

## 4. Régression logistique : prédire une probabilité

Malgré son nom, la **régression logistique** sert à la classification. Elle calcule d'abord un score linéaire \(z = w_0 + \mathbf{w}^{\mathsf T}\mathbf{x}\), puis le transforme en probabilité avec la fonction sigmoïde :

\[ \sigma(z) = \frac{1}{1+e^{-z}} \]

La probabilité estimée appartient à \([0,1]\). Un seuil, souvent 0,5 par défaut mais pas obligatoirement optimal, transforme cette probabilité en classe. L'apprentissage minimise généralement la **log-loss** (entropie croisée), qui pénalise les prédictions confiantes mais fausses.

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)
probabilites = model.predict_proba(X_test)[:, 1]
classes = model.predict(X_test)
```

La première colonne de `predict_proba` correspond à une classe et la seconde à l'autre ; vérifie l'ordre avec `model.classes_` plutôt que de le supposer aveuglément.

::: quiz Quiz 2.2 — Probabilité et décision
Un classifieur logistique estime une probabilité de fraude de 0,35. Le seuil de décision est 0,20. Quelle classe prédit-il ?

- [ ] Non-fraude, car la probabilité est sous 0,5
- [x] Fraude, car la probabilité dépasse le seuil choisi
- [ ] Il est impossible de produire une classe
  > La classe dépend du seuil appliqué, ici 0,20. Le seuil par défaut n'est pas une règle universelle : il se choisit selon les coûts des faux positifs et faux négatifs.
:::

## 5. Régulariser pour limiter le sur-apprentissage

Une régularisation ajoute une pénalité sur les poids à la perte d'entraînement. Elle décourage les modèles trop sensibles aux données.

- **L2** (_Ridge_) pénalise la somme des carrés des poids ; les coefficients sont rapprochés de zéro.
- **L1** (_Lasso_) pénalise la somme des valeurs absolues ; certains poids peuvent devenir exactement nuls.

\[ L*{\text{régularisée}} = L*{\text{données}} + \lambda\,\Omega(\mathbf{w}) \]

Le paramètre \(\lambda\) règle la force de la pénalité. Il se choisit à l'aide des données d'entraînement et de validation, jamais en optimisant directement sur le test final.

::: warn Échelles des variables
La régularisation pénalise les coefficients. Si une variable est mesurée en euros et une autre en milliers d'euros, leurs coefficients ne sont pas directement comparables. Une standardisation est souvent utile ; elle doit être ajustée seulement sur les données d'entraînement, idéalement dans un `Pipeline`.
:::

::: quiz Quiz 2.3 — L1 ou L2 ?
Tu veux obtenir un modèle plus parcimonieux où certaines variables peuvent avoir un coefficient exactement nul. Quelle pénalité est associée à cet effet ?

- [x] L1
- [ ] L2 uniquement
- [ ] La fonction sigmoïde
  > L1 peut annuler certains coefficients et effectuer une forme de sélection de variables. L2 les réduit généralement sans les annuler exactement.
:::

## 6. Exercice — Prix et probabilité

::: exo Exercice — Prix et probabilité
Tu dois construire deux modèles : l'un estime le prix d'un appartement ; l'autre estime la probabilité qu'un client résilie. Choisis un modèle linéaire adapté à chaque cible et décris la sortie attendue.
?? Voir la solution
Pour le prix, on peut commencer par `LinearRegression` : la sortie est une quantité numérique. Pour la résiliation, on peut commencer par `LogisticRegression` : la sortie de `predict_proba` est une probabilité de classe, puis un seuil permet de décider. Dans les deux cas, il faut comparer à une baseline et évaluer sur des données jamais utilisées pour ajuster le modèle.
:::

::: culture Origines et limites
La régression linéaire s'inscrit dans une longue histoire de l'ajustement statistique, notamment les travaux de **Legendre** et **Gauss** sur les moindres carrés au début du XIXe siècle. La régression logistique, développée au XXe siècle, relie un score linéaire à une probabilité.

Les modèles linéaires restent utiles parce qu'ils sont rapides, interprétables sous certaines hypothèses et constituent d'excellentes baselines. Leur simplicité est aussi une limite lorsque les relations sont fortement non linéaires ou comportent des interactions non représentées.

- [Guide scikit-learn : modèles linéaires](https://scikit-learn.org/stable/modules/linear_model.html)
:::
