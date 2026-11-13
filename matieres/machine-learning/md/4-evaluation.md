---
title: Évaluer et choisir un modèle
subtitle: Relier les scores aux erreurs réelles et éviter de sélectionner un modèle sur le test.
domains: IA, DATA
tags: métriques, matrice de confusion, précision, rappel, F1, validation croisée, seuil, ROC-AUC
niveau: Intermédiaire
duree: 40 min
objectifs: Lire une matrice de confusion ; choisir des métriques selon les coûts d'erreur ; comparer des modèles sans contaminer le test final.
---

## 1. Une métrique répond à une question

Un score résume un aspect du comportement du modèle. Il faut commencer par demander : **quelle erreur coûte le plus cher ?** Une fraude manquée et une transaction légitime bloquée n'ont pas le même coût.

En classification binaire, la matrice de confusion distingue :

|              | Prédit positif    | Prédit négatif    |
| ------------ | ----------------- | ----------------- |
| Réel positif | Vrai positif (VP) | Faux négatif (FN) |
| Réel négatif | Faux positif (FP) | Vrai négatif (VN) |

L'**accuracy** est la proportion de prédictions correctes. Elle peut être trompeuse si une classe est très rare : avec 99 % de transactions légitimes, prédire toujours « légitime » donne 99 % d'accuracy tout en ratant chaque fraude.

## 2. Précision, rappel et F1

\[ \text{Précision} = \frac{VP}{VP+FP} \qquad \text{Rappel} = \frac{VP}{VP+FN} \]

- La **précision** répond à : parmi les cas prédits positifs, quelle part l'est réellement ?
- Le **rappel** répond à : parmi les vrais positifs, quelle part a été détectée ?
- Le **F1-score** est leur moyenne harmonique : \(2PR/(P+R)\). Il est faible si l'une des deux composantes est faible.

Si manquer une maladie est particulièrement grave, on cherche souvent un rappel élevé ; si une alerte injustifiée est très coûteuse, on peut privilégier la précision. Le contexte métier fixe le compromis acceptable.

::: quiz Quiz 5.1 — Classe rare
Un système de dépistage doit éviter de manquer des cas positifs. Quelle métrique surveiller en priorité ?

- [ ] La précision seule
- [x] Le rappel
- [ ] Le nombre de variables du modèle
  > Le rappel mesure la proportion des positifs réels détectés. La précision reste utile pour quantifier les fausses alertes, mais elle répond à une autre question.
:::

::: quiz Quiz 5.2 — Faux positifs
Parmi les transactions signalées comme suspectes, une grande proportion est légitime. Quel indicateur est directement faible ?

- [x] La précision
- [ ] Le rappel
- [ ] Le nombre de plis de validation
  > Les transactions légitimes signalées sont des faux positifs. La précision diminue lorsque les prédictions positives contiennent beaucoup de faux positifs.
:::

## 3. Seuil de décision et courbes

Un classifieur probabiliste donne un score ou une probabilité ; un **seuil** transforme cette sortie en décision. Baisser le seuil détecte généralement plus de positifs (rappel plus haut), au prix de davantage de faux positifs. Le seuil se choisit sur des données de validation selon les coûts et capacités opérationnelles.

La **ROC-AUC** résume la capacité à classer un positif au-dessus d'un négatif pour différents seuils. En présence d'une classe très rare, une courbe précision-rappel et son aire peuvent être plus informatives ; aucune aire ne remplace l'examen des erreurs au seuil réellement utilisé.

::: warn Probabilité et calibration
Un score de 0,8 ne signifie « environ 80 % de chances » que si les probabilités sont raisonnablement calibrées dans le contexte concerné. Un bon classement des exemples n'assure pas une bonne calibration.
:::

## 4. Métriques de régression

| Métrique | Interprétation                                                   | Point d'attention                           |
| -------- | ---------------------------------------------------------------- | ------------------------------------------- |
| **MAE**  | Erreur absolue moyenne, dans l'unité de la cible                 | Moins sensible aux grosses erreurs que RMSE |
| **RMSE** | Racine de l'erreur quadratique moyenne, dans l'unité de la cible | Pénalise fortement les grandes erreurs      |
| **R²**   | Comparaison à une prédiction constante égale à la moyenne        | Peut être négatif sur des données évaluées  |

Un RMSE de 10 n'a pas le même sens si l'on prédit des euros ou des milliers d'euros. Il faut comparer les erreurs à une baseline, aux exigences métier et à la distribution de la cible.

::: quiz Quiz 5.3 — Erreurs extrêmes
Une très grosse erreur isolée doit peser davantage dans le score. Quelle métrique de régression est généralement la plus sensible ?

- [ ] MAE
- [x] RMSE
- [ ] Accuracy
  > RMSE met les erreurs au carré avant d'en prendre la moyenne et la racine ; les grosses erreurs ont donc un poids accru. La MAE est moins sensible aux extrêmes.
:::

## 5. Validation et test final

Un seul découpage peut être chanceux. La **validation croisée** répète entraînement et évaluation sur plusieurs partitions ; on examine la moyenne et la variabilité des scores. Les données temporelles ou groupées demandent des stratégies adaptées, pas un `KFold` aléatoire aveugle.

La sélection des hyperparamètres (profondeur, pénalité, nombre d'arbres…) doit se faire dans la boucle d'entraînement/validation. Le jeu de test reste de côté jusqu'à la décision finale. Si l'on choisit à répétition en fonction de son score de test, le test finit lui aussi par influencer le modèle : il n'est plus une estimation neutre.

Le module Python & Data Science « scikit-learn & workflow ML » montre les API `train_test_split`, `cross_val_score`, `Pipeline` et `GridSearchCV`. Ici, le point central est la logique d'évaluation : comparer les mêmes modèles sur le même protocole et garder le test final intact.

::: quiz Quiz 5.4 — Test final
Tu essaies 30 modèles et ajustes leur seuil en fonction des résultats sur le jeu de test, puis tu annonces le meilleur score de test. Quel est le problème ?

- [x] Le test a servi à la sélection ; le score final est optimiste
- [ ] Il faut calculer la moyenne des 30 scores de test
- [ ] Il faut augmenter le seuil pour obtenir un score plus stable
  > Chaque décision guidée par le test l'intègre indirectement au développement. Il faut sélectionner avec validation et ne consulter le test qu'à la fin.
:::

## 6. Exercice — Choisir une métrique et un seuil

::: exo Exercice — Choisir une métrique et un seuil
Un modèle de détection de fraude renvoie un score entre 0 et 1. L'équipe enquête manuellement sur au plus 100 alertes par jour. Explique pourquoi l'accuracy seule ne suffit pas et décris comment choisir le seuil.
?? Voir la solution
Si les fraudes sont rares, un modèle qui prédit toujours « légitime » peut avoir une excellente accuracy et ne détecter aucune fraude. Il faut examiner au minimum précision, rappel et volume d'alertes. Sur des données de validation représentatives, on compare les seuils et on choisit un compromis respectant la capacité de 100 enquêtes, en tenant compte du coût d'une fraude manquée et d'une fausse alerte. Le test final sert ensuite à évaluer une seule fois le protocole retenu.
:::

::: exo Exercice — Comparer deux modèles
Sur la même validation, le modèle A a précision 0,90 et rappel 0,40 ; le modèle B a précision 0,70 et rappel 0,75. Lequel choisir pour un premier tri médical où manquer un patient atteint est très coûteux ? Quelle vérification reste indispensable ?
?? Voir la solution
Le modèle B est un meilleur candidat si l'objectif prioritaire est de réduire les faux négatifs, car son rappel est supérieur. Il faut cependant examiner le nombre de faux positifs, la qualité des données, les performances par sous-population et le protocole de validation. La décision finale dépend du contexte clinique et ne se réduit pas à un score unique.
:::

::: culture La mesure fait partie du modèle
Les métriques de classification encodent des choix de décision. Le seuil, la population évaluée et le coût relatif des erreurs peuvent changer le modèle préféré, même si ses probabilités restent identiques. Dans un système réel, les distributions peuvent aussi évoluer : une surveillance après déploiement est donc nécessaire.

- [Guide scikit-learn : métriques et scoring](https://scikit-learn.org/stable/modules/model_evaluation.html)
- [Guide scikit-learn : calibration des probabilités](https://scikit-learn.org/stable/modules/calibration.html)
:::
