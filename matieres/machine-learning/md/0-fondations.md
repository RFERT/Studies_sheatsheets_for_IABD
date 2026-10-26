---
title: Fondations du Machine Learning
subtitle: Comprendre ce qu'un modèle apprend, sur quelles données et dans quel but.
domains: IA, DATA
tags: machine learning, apprentissage supervisé, non supervisé, généralisation, fuite de données
niveau: Débutant à intermédiaire
duree: 35 min
objectifs: Distinguer les grands cadres d'apprentissage ; définir observations, variables et cible ; expliquer la généralisation ; repérer les principales fuites de données.
---

## 1. Pourquoi utiliser le Machine Learning ?

En programmation classique, on écrit les règles qui transforment une entrée en résultat. En **Machine Learning (ML)**, on fournit des exemples et un objectif ; un algorithme ajuste un modèle pour produire une règle utile sur de nouveaux cas.

Exemple : au lieu d'écrire toutes les règles d'un filtre anti-spam, on donne des messages étiquetés « spam » ou « légitime ». Le modèle apprend des régularités dans les mots, les liens et les métadonnées.

::: def Modèle et apprentissage
Un **modèle** est une fonction paramétrée qui transforme une entrée en prédiction. L'**apprentissage** consiste à choisir ses paramètres à partir de données, en minimisant une mesure d'erreur appelée **fonction de perte**.
:::

Le ML est utile lorsque les règles sont difficiles à écrire à la main, que des exemples sont disponibles et que les régularités observées ont des chances de se maintenir. Il ne remplace pas la qualité des données ni la compréhension du problème métier.

## 2. Les données : observations, variables et cible

Un jeu de données tabulaire peut se représenter par une matrice \(X\) et, en apprentissage supervisé, une cible \(y\).

- Une **observation** (ligne) décrit un individu, un événement ou un objet.
- Une **variable** ou _feature_ (colonne de \(X\)) décrit une propriété disponible pour la prédiction.
- La **cible** \(y\) est la valeur que le modèle doit apprendre à prédire.

Pour prédire le départ d'un client, une ligne peut contenir ancienneté, formule et nombre d'incidents. La cible est « parti » ou « resté ». Il faut vérifier que chaque variable serait réellement connue au moment où la prédiction est faite.

::: info Notation
On note souvent les données d'entraînement \(\{(x*i, y_i)\}*{i=1}^{n}\). Le modèle \(f*\theta\), défini par des paramètres \(\theta\), produit \(\hat{y}\_i = f*\theta(x_i)\). L'objectif est d'obtenir de bonnes prédictions sur des observations qui n'ont pas servi à ajuster \(\theta\).
:::

## 3. Trois grands cadres d'apprentissage

| Cadre                | Données disponibles                       | Exemple de tâche                               |
| -------------------- | ----------------------------------------- | ---------------------------------------------- |
| **Supervisé**        | Entrées \(X\) et réponses attendues \(y\) | Prédire un prix ou détecter une fraude         |
| **Non supervisé**    | Entrées \(X\), sans cible fournie         | Regrouper des clients ou résumer des variables |
| **Par renforcement** | Actions, récompenses et environnement     | Apprendre une stratégie de contrôle            |

En supervisé, la **régression** prédit une quantité numérique (un prix) et la **classification** prédit une catégorie (fraude ou non). Le non supervisé n'a pas de « bonne réponse » connue pour chaque ligne : il faut interpréter les structures découvertes et vérifier qu'elles sont utiles.

::: quiz Quiz 1.1 — Identifier la tâche
Une équipe veut estimer le délai de livraison en heures à partir de commandes passées contenant le délai réel. Quelle est la tâche ?

- [ ] Classification non supervisée
- [x] Régression supervisée
- [ ] Apprentissage par renforcement
  > La cible est un nombre réel connu dans les exemples : c'est une régression supervisée. Des classes comme « rapide / lent » changeraient la tâche en classification.
  > :::

::: quiz Quiz 1.2 — Cible et variables
Pour entraîner un modèle qui prédit si une transaction est frauduleuse, quelle colonne joue le rôle de cible ?

- [ ] Le montant, nécessairement
- [ ] L'identifiant de la transaction
- [x] L'étiquette fraude / non-fraude
  > La cible est la réponse à prédire. Le montant peut être une variable d'entrée, tandis que l'identifiant n'est généralement pas une caractéristique porteuse de sens.
  > :::

## 4. Apprendre n'est pas mémoriser

Un modèle est entraîné sur un échantillon, mais sa valeur dépend de sa capacité à **généraliser** à des données futures. Un modèle trop simple peut manquer les régularités utiles (**sous-apprentissage**). Un modèle trop complexe peut mémoriser les particularités du jeu d'entraînement (**sur-apprentissage**).

::: def Généralisation
La **généralisation** est la capacité d'un modèle appris sur un échantillon à rester performant sur des observations nouvelles, issues du contexte où il sera utilisé.
:::

On sépare habituellement les données en entraînement, validation et test :

- **Entraînement** : ajuster les paramètres du modèle.
- **Validation** : comparer les choix de modèles et d'hyperparamètres.
- **Test** : estimer une dernière fois la performance, après les décisions de conception.

Un découpage aléatoire n'est pas toujours valable. Pour prévoir le futur, on entraîne sur le passé et on évalue sur une période ultérieure. Pour plusieurs lignes provenant d'une même personne, on évite de placer des lignes de cette personne à la fois dans l'entraînement et le test.

## 5. Fuite de données : le faux raccourci

Une **fuite de données** (_data leakage_) survient lorsque l'apprentissage ou l'évaluation exploite une information qui ne serait pas disponible au moment réel de la prédiction. Le score semble alors excellent, mais ne reflète pas la performance en production.

Exemples fréquents :

- inclure une colonne calculée après l'événement à prédire ;
- ajuster un scaler, un imputer ou une sélection de variables sur tout le jeu avant le découpage ;
- séparer au hasard des mesures du même patient ou du même utilisateur entre train et test ;
- réutiliser le jeu de test pour essayer de nombreux modèles, puis annoncer le meilleur score comme estimation neutre.

Le prétraitement doit être **appris uniquement sur les données d'entraînement** de chaque validation. En pratique, les `Pipeline` de scikit-learn automatisent cette discipline ; le module Python & Data Science sur scikit-learn montre leur usage.

::: warn Un score n'est pas une preuve
Un score parfait doit déclencher une enquête : cherche une variable qui révèle indirectement la réponse, un doublon entre les partitions ou un prétraitement effectué avant le découpage.
:::

::: quiz Quiz 1.3 — Repérer une fuite
Une colonne « date de clôture du dossier » est renseignée après qu'un client a résilié. Elle prédit très bien la résiliation. Quel est le problème ?

- [ ] Le modèle est forcément trop simple
- [x] La colonne contient une information indisponible au moment de la prédiction
- [ ] Il faut seulement augmenter le nombre de lignes
  > Cette information arrive après l'événement. Le modèle ne pourrait pas l'utiliser honnêtement pour anticiper une résiliation.
  > :::

## 6. Un premier workflow raisonné

Avant de choisir un algorithme :

1. Définir la décision à prendre, la population visée et le moment de la prédiction.
2. Construire une cible cohérente avec cette décision et vérifier sa qualité.
3. Établir une référence simple (_baseline_) : prédire la moyenne, la classe majoritaire ou une règle métier.
4. Choisir un découpage qui respecte le temps, les groupes et le contexte de collecte.
5. Comparer des modèles avec une métrique liée au coût des erreurs.
6. Vérifier les erreurs, les limites et le comportement sur les sous-populations pertinentes.

::: exo Exercice — Détecter une fuite
Une banque veut prédire le défaut de paiement dans les 30 prochains jours. Le tableau contient `date_impaye` (date du premier impayé), `solde_actuel`, `anciennete_client` et `defaut_30j` (la cible). Quelle colonne est suspecte ? Donne aussi une règle de découpage prudente si les clients ont plusieurs lignes mensuelles.
?? Voir la solution
`date_impaye` est suspecte : si elle désigne le premier impayé du défaut étudié, elle révèle la cible ou arrive après le moment de décision. Il faut définir précisément la date de prédiction et ne garder que les informations connues à cette date. Pour éviter qu'un même client apparaisse dans train et test, on sépare par client ; si le modèle doit prédire dans le futur, on respecte aussi l'ordre temporel.
:::

::: culture Quelques repères
Le terme _Machine Learning_ s'est popularisé avec **Arthur Samuel** dans les années 1950, autour de programmes qui amélioraient leurs performances à partir de l'expérience. Les progrès récents viennent autant des données et de la puissance de calcul que des algorithmes.

- [Guide scikit-learn : apprentissage supervisé](https://scikit-learn.org/stable/supervised_learning.html)
- [Guide scikit-learn : sélection de modèles](https://scikit-learn.org/stable/model_selection.html)
  :::
