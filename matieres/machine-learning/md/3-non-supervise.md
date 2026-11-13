---
title: Apprentissage non supervisé
subtitle: Explorer la structure des données sans disposer d'une cible à prédire.
domains: IA, DATA, BIG DATA
tags: apprentissage non supervisé, clustering, K-means, PCA, réduction de dimension, silhouette
niveau: Intermédiaire
duree: 40 min
objectifs: Expliquer le clustering et la réduction de dimension ; appliquer K-means ; interpréter les limites de PCA et d'une métrique de silhouette.
---

## 1. Explorer sans étiquette

En **apprentissage non supervisé**, on observe des variables \(X\) sans cible \(y\) fournie. L'algorithme cherche une structure : groupes, axes de variation ou représentation plus compacte.

Deux objectifs fréquents :

- **Clustering** : réunir des observations jugées proches selon une mesure choisie.
- **Réduction de dimension** : représenter les données avec moins de variables, en conservant une partie de leur structure.

Ces résultats ne découvrent pas nécessairement des catégories « naturelles ». Le nombre de groupes, la distance, les unités et les variables choisies influencent ce que l'algorithme trouve.

## 2. K-means : regrouper autour de centroïdes

K-means cherche à répartir les observations en \(K\) groupes en minimisant la somme des distances carrées aux centroïdes :

\[ \sum*{k=1}^{K}\sum*{x_i \in C_k}\|x_i-\mu_k\|^2 \]

Le principe itératif est le suivant :

1. Initialiser \(K\) centroïdes.
2. Affecter chaque observation au centroïde le plus proche.
3. Recalculer chaque centroïde comme la moyenne des points de son groupe.
4. Répéter jusqu'à stabilisation.

```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

X_scaled = StandardScaler().fit_transform(X)
model = KMeans(n_clusters=4, n_init=10, random_state=42)
groupes = model.fit_predict(X_scaled)
```

La standardisation est importante lorsque les variables ont des échelles très différentes : sinon une variable exprimée en milliers peut dominer une autre exprimée entre 0 et 1. Dans un vrai workflow d'évaluation, le scaler se place dans un `Pipeline` pour éviter les fuites.

::: warn K-means n'est pas universel
K-means privilégie des groupes compacts selon la distance euclidienne. Il est sensible à l'initialisation et aux valeurs extrêmes, et ne convient pas à toutes les formes de groupes. Le nombre \(K\) doit être choisi et justifié.
:::

## 3. Évaluer et interpréter des groupes

Sans étiquettes de référence, il n'existe pas de score unique qui prouve qu'un clustering est « vrai ». On peut combiner :

- la stabilité des groupes si l'on change légèrement les données ou l'initialisation ;
- la cohésion et la séparation, par exemple avec le **coefficient de silhouette** ;
- l'utilité pour l'objectif métier et l'interprétation des profils obtenus.

La silhouette compare la distance d'une observation à son groupe et à son groupe voisin. Elle est généralement comprise entre -1 et 1 ; une valeur plus haute indique une meilleure séparation selon la distance choisie, pas une vérité métier.

::: quiz Quiz 4.1 — Échelles
Une variable « chiffre d'affaires » va de 0 à 1 000 000 et une variable « satisfaction » de 1 à 5. Tu lances K-means avec distance euclidienne brute. Quel risque est le plus direct ?

- [ ] La cible est automatiquement prédite
- [x] Le chiffre d'affaires peut dominer la distance à cause de son échelle
- [ ] Le nombre de groupes devient égal à cinq
  > Les grandes amplitudes contribuent davantage aux distances. Une mise à l'échelle peut être nécessaire, en respectant le découpage des données.
:::

::: quiz Quiz 4.2 — Choix de K
La silhouette maximale est obtenue pour \(K=2\). Peut-on conclure automatiquement qu'il existe exactement deux segments métier ?

- [ ] Oui, la silhouette prouve le nombre réel de segments
- [x] Non, elle mesure une séparation géométrique selon une représentation donnée
- [ ] Oui, à condition d'avoir standardisé les variables
  > La métrique aide à comparer des partitions mais ne valide pas leur sens métier. Il faut étudier les profils, la stabilité et l'objectif de segmentation.
:::

## 4. PCA : résumer les directions de variation

L'**Analyse en composantes principales** (_Principal Component Analysis_, PCA) construit de nouveaux axes orthogonaux. La première composante capture la plus grande variance possible ; les suivantes capturent le maximum restant sous contrainte d'orthogonalité.

La PCA sert à visualiser, compresser ou réduire le bruit. Elle ne sélectionne pas les variables d'origine : chaque composante est une combinaison de celles-ci. Une forte variance conservée n'implique pas que l'information utile pour une cible soit conservée.

```python
from sklearn.decomposition import PCA
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

pca = make_pipeline(StandardScaler(), PCA(n_components=2))
X_2d = pca.fit_transform(X)
```

Ici, les deux composantes facilitent une visualisation en deux dimensions. Une figure ainsi obtenue ne montre pas nécessairement toutes les distances ou séparations présentes dans l'espace original.

::: quiz Quiz 4.3 — Interpréter PCA
Les deux premières composantes de PCA expliquent 95 % de la variance. Quelle affirmation est correcte ?

- [ ] Un classifieur utilisant ces deux composantes aura nécessairement 95 % d'accuracy
- [x] La représentation conserve 95 % de la variance mesurée, pas une garantie de performance supervisée
- [ ] PCA a sélectionné les deux variables les plus importantes
  > La variance expliquée mesure l'information géométrique préservée au regard de la variance totale. Ce n'est ni une accuracy ni une sélection de colonnes d'origine.
:::

## 5. Exercice — Segmentation de clients

::: exo Exercice — Segmentation de clients
Une équipe veut segmenter ses clients à partir du montant d'achat mensuel, du nombre de visites et de l'ancienneté. Elle choisit K-means avec \(K=3\), sans mise à l'échelle, puis appelle les groupes « fidèles », « occasionnels » et « à risque ». Que faut-il corriger ou vérifier avant d'adopter ces noms ?
?? Voir la solution
Mettre les variables à l'échelle pour éviter que le montant d'achat domine mécaniquement les distances. Comparer plusieurs valeurs de \(K\), vérifier la stabilité et décrire les profils de chaque groupe. Les noms doivent découler des comportements réellement observés, pas être imposés par l'algorithme. « À risque » demande en plus une définition et une validation métier : K-means ne prédit pas un risque sans cible.
:::

::: culture Réduire les dimensions
La PCA s'appuie sur l'algèbre linéaire et la décomposition en valeurs propres, avec une formulation moderne liée à la décomposition en valeurs singulières. **Karl Pearson** a développé une forme de l'analyse en 1901 ; **Harold Hotelling** l'a systématisée en 1933.

- [Guide scikit-learn : clustering](https://scikit-learn.org/stable/modules/clustering.html)
- [Guide scikit-learn : décomposition et PCA](https://scikit-learn.org/stable/modules/decomposition.html#pca)
:::
