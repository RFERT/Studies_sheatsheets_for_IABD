---
title: Arbres de décision et méthodes d'ensemble
subtitle: Construire des règles lisibles, puis combiner des modèles pour gagner en robustesse.
domains: IA, DATA
tags: arbre de décision, entropie, indice de Gini, random forest, bagging, boosting
niveau: Intermédiaire
duree: 40 min
objectifs: Expliquer un arbre de décision ; comparer bagging et boosting ; utiliser une forêt aléatoire ; connaître les limites des importances de variables.
---

## 1. Un arbre apprend des questions

Un **arbre de décision** partitionne les données en posant des questions successives : « la surface est-elle supérieure à 70 m² ? », puis « le quartier est-il central ? ». Chaque feuille contient une prédiction ou une distribution de classes.

À chaque nœud, l'algorithme cherche une séparation qui rend les groupes obtenus plus homogènes pour la cible. En classification, il peut utiliser l'indice de Gini :

\[ G = 1 - \sum\_{k=1}^{K} p_k^2 \]

où \(p_k\) est la proportion de la classe \(k\) dans le nœud. Gini vaut 0 quand toutes les observations sont de la même classe. Une séparation est intéressante si elle réduit suffisamment l'impureté pondérée des enfants.

::: info Un exemple de Gini
Dans un nœud composé pour moitié de positifs et pour moitié de négatifs, \(G = 1 - 0{,}5^2 - 0{,}5^2 = 0{,}5\). Un nœud contenant une seule classe a un Gini égal à 0.
:::

## 2. Profondeur et sur-apprentissage

Un arbre très profond peut isoler presque chaque ligne : il apprend alors le bruit de l'entraînement. On limite sa complexité avec `max_depth`, `min_samples_leaf` ou une procédure d'élagage. Ces choix sont des **hyperparamètres** à comparer sur validation.

```python
from sklearn.tree import DecisionTreeClassifier

tree = DecisionTreeClassifier(max_depth=4, min_samples_leaf=10, random_state=42)
tree.fit(X_train, y_train)
predictions = tree.predict(X_test)
```

Les arbres gèrent les relations non linéaires et les interactions sans normalisation obligatoire des variables. Selon l'implémentation et le traitement des données, il faut toutefois préparer les catégories manquantes ou non numériques.

::: quiz Quiz 3.1 — Impureté
Un nœud ne contient que des exemples d'une classe. Quelle est son impureté de Gini ?

- [ ] 1
- [x] 0
- [ ] Elle ne peut pas être calculée
  > Si une classe a une proportion de 1, alors Gini vaut \(1 - 1^2 = 0\) : le nœud est parfaitement pur.
  > :::

## 3. Bagging et forêts aléatoires

Le **bagging** entraîne plusieurs modèles sur des échantillons bootstrap, tirés avec remise, puis agrège leurs prédictions. Cette diversité réduit souvent la variance d'un modèle instable comme un arbre.

Une **Random Forest** ajoute une sélection aléatoire de variables candidates à chaque séparation. Les arbres sont ainsi moins semblables : leurs erreurs se compensent mieux lorsqu'on agrège les votes ou les moyennes.

```python
from sklearn.ensemble import RandomForestClassifier

forest = RandomForestClassifier(
    n_estimators=300,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
)
forest.fit(X_train, y_train)
predictions = forest.predict(X_test)
```

Une forêt est souvent une bonne baseline tabulaire, mais elle est moins lisible qu'un arbre seul et peut être volumineuse. `feature_importances_` peut favoriser des variables avec beaucoup de valeurs possibles ; une importance n'indique ni une causalité ni le sens de l'effet.

::: quiz Quiz 3.2 — Pourquoi plusieurs arbres ?
Quel est l'objectif principal du bagging dans une forêt aléatoire ?

- [ ] Forcer tous les arbres à apprendre exactement les mêmes erreurs
- [x] Combiner des arbres variés pour réduire l'instabilité des prédictions
- [ ] Remplacer les données d'entraînement par des données synthétiques
  > Le bagging crée des échantillons bootstrap et agrège leurs modèles. La diversité des arbres aide à réduire la variance de l'ensemble.
  > :::

## 4. Boosting : corriger progressivement

Le **boosting** construit une suite de modèles. Chaque nouvel apprenant contribue à corriger les erreurs ou les résidus de l'ensemble déjà construit. Des arbres peu profonds servent souvent de base ; leur combinaison peut être très performante sur des données tabulaires.

- Le **gradient boosting** optimise une perte en ajoutant des apprenants successifs.
- **HistGradientBoosting** de scikit-learn accélère le calcul sur des jeux tabulaires en regroupant les valeurs en histogrammes.
- XGBoost, LightGBM et CatBoost sont des bibliothèques populaires, avec des compromis et fonctionnalités propres.

Le boosting peut sur-apprendre si le nombre d'itérations ou la complexité des arbres est trop élevé. Le taux d'apprentissage et la validation sont importants. Contrairement à une forêt, les arbres ne sont pas indépendants : leur ordre compte.

::: quiz Quiz 3.3 — Comparer les ensembles
Quelle description correspond le mieux au boosting ?

- [ ] Entraîner des arbres indépendants puis faire une moyenne sans ordre particulier
- [x] Ajouter les apprenants successivement pour améliorer l'ensemble courant
- [ ] Retirer la cible avant l'entraînement
  > Le boosting construit le modèle par étapes, chaque étape dépendant de l'ensemble déjà appris. L'agrégation d'arbres indépendants caractérise plutôt le bagging.
  > :::

## 5. Choisir entre arbre, forêt et boosting

| Modèle            | Atout courant                            | Limite courante                       |
| ----------------- | ---------------------------------------- | ------------------------------------- |
| Arbre seul        | Règles visualisables, non-linéarités     | Instable et vite sur-appris           |
| Random Forest     | Robuste, peu de réglages au départ       | Modèle moins compact et moins lisible |
| Gradient Boosting | Très performant sur beaucoup de tableaux | Réglages et validation plus exigeants |

Les performances dépendent du jeu de données. Il faut comparer ces modèles avec le même découpage, la même cible et une métrique justifiée. Un modèle complexe n'est pas automatiquement meilleur pour le besoin métier.

::: exo Exercice — Règle ou ensemble ?
Un analyste doit expliquer en réunion une décision de crédit individuelle. Il propose une Random Forest avec 1000 arbres et dit que l'importance de la variable « revenu » prouve que le revenu cause le refus. Identifie deux limites de son argument et propose une première approche plus défendable.
?? Voir la solution
Une forêt de 1000 arbres n'offre pas une règle individuelle simple à expliquer, et l'importance de variable ne prouve pas une causalité. On peut commencer par un arbre peu profond comme support de discussion, puis comparer sa performance à des ensembles. Pour une décision à fort impact, il faut aussi documenter les erreurs, les biais, les explications locales et les contraintes réglementaires ; une importance globale seule ne suffit pas.
:::

::: culture Des arbres aux ensembles
Les arbres de décision existent depuis plusieurs décennies en statistique et en intelligence artificielle. Le bagging a été formalisé par **Leo Breiman** en 1996 ; son article sur les forêts aléatoires date de 2001. Le boosting, dont AdaBoost est une méthode historique importante, combine lui aussi des apprenants faibles mais par une construction séquentielle.

- [Guide scikit-learn : arbres de décision](https://scikit-learn.org/stable/modules/tree.html)
- [Guide scikit-learn : méthodes d'ensemble](https://scikit-learn.org/stable/modules/ensemble.html)
  :::
