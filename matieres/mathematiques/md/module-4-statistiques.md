---
title: Module 4 — Statistiques
subtitle: Faire parler les données : résumer, estimer, tester, prédire. Là où les probabilités modélisent le hasard « vers l'avant », les statistiques remontent des données vers le modèle. C'est le quotidien du Data Analyst et du Data Scientist.
domains: DATA, BIG DATA, IA
objectifs: Calculer et interpréter les statistiques descriptives ; comprendre l'estimation (ponctuelle, par intervalle) ; maîtriser les tests d'hypothèses et la p-value ; comprendre la régression linéaire et le maximum de vraisemblance.
---

## 1. Statistiques descriptives

::: def Tendance centrale & dispersion
- **Moyenne** \(\bar x=\frac1n\sum x_i\) — sensible aux valeurs extrêmes.
- **Médiane** : valeur du milieu — robuste aux outliers.
- **Mode** : valeur la plus fréquente.
- **Variance empirique** \(s^2=\frac1{n-1}\sum(x_i-\bar x)^2\), écart-type \(s\).
- **Quantiles** : quartiles Q1, Q2 (médiane), Q3 ; IQR = Q3−Q1.
:::

::: info Moyenne vs médiane
Sur des salaires (distribution asymétrique), la **médiane** est bien plus représentative : quelques très hauts salaires tirent la moyenne vers le haut. Toujours regarder la distribution, pas qu'un seul chiffre (quartet d'Anscombe !).
:::

::: info DATA Lien
Boîte à moustaches (boxplot), détection d'**outliers** via l'IQR (au-delà de Q3 + 1,5·IQR), premiers pas de toute analyse exploratoire (EDA).
:::

::: quiz Quiz 1.1
Sur des revenus très inégaux, quel indicateur de centre est le plus représentatif ?
- [ ] La moyenne
- [x] La médiane (robuste aux extrêmes)
- [ ] Le maximum
- [ ] La variance
> La médiane n'est pas tirée par les valeurs extrêmes : elle reflète mieux le « salarié typique ». La moyenne est gonflée par les très hauts revenus.
:::

::: quiz Quiz 1.2
Pourquoi divise-t-on par \(n-1\) dans la variance empirique ?
- [ ] Par erreur historique
- [ ] Pour avoir un résultat plus petit
- [x] Pour corriger le biais d'estimation (correction de Bessel)
- [ ] Ça ne change rien
> Diviser par n−1 (correction de Bessel) rend l'estimateur de variance non biaisé, car on a « consommé » un degré de liberté en estimant la moyenne.
:::

## 2. Covariance & corrélation

::: def Définitions
- **Covariance** : \(\mathrm{Cov}(X,Y)=\frac1n\sum(x_i-\bar x)(y_i-\bar y)\) — signe = sens de la relation.
- **Corrélation de Pearson** : \(r=\dfrac{\mathrm{Cov}(X,Y)}{s_X s_Y}\in[-1,1]\) — intensité d'une relation *linéaire*.
:::

::: info Corrélation ≠ causalité
Deux variables corrélées ne sont pas forcément liées causalement (variable cachée, hasard). Et \(r=0\) n'exclut pas une relation *non linéaire* (ex. \(y=x^2\)).
:::

::: quiz Quiz 2.1
Le coefficient de corrélation de Pearson \(r\) mesure…
- [ ] la causalité
- [ ] n'importe quelle relation
- [ ] la moyenne
- [x] l'intensité d'une relation linéaire, entre −1 et 1
> r ∈ [−1,1] quantifie une relation LINÉAIRE. r≈0 ne signifie pas « aucun lien » (une parabole a r≈0), et corrélation n'implique jamais causalité.
:::

## 3. Estimation & intervalles de confiance

::: def Estimateur
Un **estimateur** \(\hat\theta\) calcule une quantité inconnue (ex. \(\bar x\) estime \(\mu\)). Bon estimateur = **sans biais** (\(E[\hat\theta]=\theta\)) et de **faible variance** (précis).
:::

::: info Intervalle de confiance (IC) pour une moyenne
Via le TCL, à 95 % : \[ \mathrm{IC}_{95\%} = \left[\bar x - 1{,}96\,\frac{s}{\sqrt n},\ \ \bar x + 1{,}96\,\frac{s}{\sqrt n}\right] \] Interprétation : si on répétait l'expérience, 95 % des IC construits contiendraient le vrai \(\mu\). La largeur décroît en \(1/\sqrt n\).
:::

::: info DATA BIG DATA Lien
Les « marges d'erreur » des sondages, les barres d'incertitude des dashboards, la taille d'échantillon nécessaire pour un A/B test : tout vient de l'IC.
:::

::: quiz Quiz 3.1
Pour diviser par 2 la largeur d'un intervalle de confiance, il faut multiplier la taille d'échantillon par…
- [x] 4
- [ ] 2
- [ ] 1,5
- [ ] 10
> La largeur est en 1/√n. Pour la diviser par 2, il faut √n ×2, donc n ×4. La précision coûte cher !
:::

::: quiz Quiz 3.2
Un bon estimateur est « sans biais ». Cela signifie…
- [ ] qu'il vaut toujours la vraie valeur
- [ ] qu'il a une variance nulle
- [x] qu'en moyenne il vaut la vraie valeur : \(E[\hat\theta]=\theta\)
- [ ] qu'il est toujours positif
> Sans biais = correct « en espérance ». Un estimateur peut être sans biais tout en fluctuant (variance) ; on veut les deux : sans biais ET faible variance.
:::

## 4. Tests d'hypothèses & p-value ⭐

::: def Démarche
- **\(H_0\)** (hypothèse nulle) : « rien ne change » (ex. le nouveau bouton ne change pas le taux de clic).
- **\(H_1\)** : l'effet existe.
- **p-value** : probabilité d'observer un résultat au moins aussi extrême *si \(H_0\) était vraie*.
- Si p-value < seuil \(\alpha\) (souvent 0,05) → on **rejette \(H_0\)**.
:::

|  | \(H_0\) vraie | \(H_0\) fausse |
| --- | --- | --- |
| On rejette \(H_0\) | **Erreur type I** (faux positif, proba α) | ✔ Bonne décision |
| On garde \(H_0\) | ✔ Bonne décision | **Erreur type II** (faux négatif, proba β) |

::: info Pièges classiques (très demandés)
La p-value n'est **PAS** « la probabilité que \(H_0\) soit vraie ». Ne pas rejeter \(H_0\) ≠ « \(H_0\) est vraie ». Et le **p-hacking** (tester plein de choses jusqu'à p<0,05) invalide les résultats.
:::

::: info DATA Lien
**A/B testing** = test d'hypothèses appliqué aux produits. La puissance (1−β) détermine la taille d'échantillon nécessaire.
:::

::: quiz Quiz 4.1
Une p-value de 0,03 avec seuil α=0,05 signifie…
- [ ] H₀ a 3 % de chances d'être vraie
- [x] on rejette H₀ (résultat « significatif »)
- [ ] on garde H₀
- [ ] le test est raté
> 0,03 < 0,05 → on rejette H₀. Attention : ça ne dit PAS que H₀ a 3 % de chances d'être vraie — c'est la proba des données sous H₀.
:::

::: quiz Quiz 4.2
Rejeter H₀ alors qu'elle est vraie, c'est une erreur de type…
- [ ] type II (faux négatif)
- [ ] aucune erreur
- [x] type I (faux positif)
- [ ] type III
> Rejeter à tort H₀ = faux positif = erreur de type I, de probabilité α. Le faux négatif (garder H₀ fausse) est l'erreur de type II.
:::

::: quiz Quiz 4.3
Le « p-hacking » consiste à…
- [x] multiplier les tests jusqu'à trouver p<0,05 (mauvaise pratique)
- [ ] baisser le seuil α
- [ ] augmenter la taille d'échantillon
- [ ] calculer la médiane
> Tester beaucoup d'hypothèses et ne garder que les « significatives » produit des faux positifs. On corrige avec Bonferroni, pré-enregistrement, etc.
:::

## 5. Régression linéaire

::: def Modèle
On cherche \(\hat y = \beta_0 + \beta_1 x\) (ou \(\hat y = X\boldsymbol\beta\) en multivarié) minimisant la somme des carrés des erreurs (**moindres carrés**) : \[ \min_{\boldsymbol\beta}\ \sum_i (y_i - \hat y_i)^2 \] Solution matricielle : \(\hat{\boldsymbol\beta}=(X^{\top}X)^{-1}X^{\top}\mathbf y\) (lien direct avec le Module 2 !).
:::

::: def Qualité : \(R^2\)
\(R^2\in[0,1]\) = proportion de variance expliquée par le modèle. \(R^2=1\) = ajustement parfait ; \(R^2=0\) = le modèle ne fait pas mieux que la moyenne.
:::

::: info IA Lien
La régression linéaire est le « hello world » du ML supervisé. La **régularisation** (Ridge \(L_2\), Lasso \(L_1\)) évite le surapprentissage et gère la multicolinéarité.
:::

::: quiz Quiz 5.1
Que minimise la régression par moindres carrés ?
- [ ] la somme des erreurs
- [ ] la somme des valeurs absolues
- [x] la somme des carrés des erreurs
- [ ] le nombre de points
> On minimise Σ(yᵢ−ŷᵢ)² : les carrés pénalisent fortement les grosses erreurs et donnent une solution analytique élégante.
:::

::: quiz Quiz 5.2
Un \(R^2 = 0{,}85\) signifie…
- [ ] 85 % des points sont sur la droite
- [x] le modèle explique 85 % de la variance de y
- [ ] 85 % de chances que le modèle soit correct
- [ ] la pente vaut 0,85
> R² = part de la variance de y expliquée par le modèle. 0,85 = bon ajustement, mais à croiser avec l'analyse des résidus.
:::

## 6. Maximum de vraisemblance (MLE)

::: def Principe
On choisit les paramètres \(\theta\) qui **maximisent la vraisemblance** des données observées : \(\hat\theta = \arg\max_\theta\ L(\theta) = \arg\max_\theta \prod_i P(x_i\mid\theta)\). En pratique on maximise la **log-vraisemblance** \(\sum_i \log P(x_i\mid\theta)\) (plus simple, mêmes maxima).
:::

::: info IA Lien fondamental
Entraîner un modèle = souvent maximiser une vraisemblance = minimiser une **log-vraisemblance négative**. La **cross-entropy** (Module 8) en est un cas particulier. La régression par moindres carrés = MLE sous bruit gaussien.
:::

::: quiz Quiz 6.1
Pourquoi maximise-t-on la *log*-vraisemblance plutôt que la vraisemblance ?
- [x] Le log transforme le produit en somme (plus stable et dérivable)
- [ ] Pour changer le résultat
- [ ] Le log est obligatoire mathématiquement
- [ ] Pour rendre les probas négatives
> log(∏) = Σ log : on évite les produits de nombreuses petites probabilités (underflow numérique) et on simplifie la dérivation. Le log étant croissant, l'argmax est inchangé.
:::

## 7. Domaines, usages & métiers

| Notion | Domaine | Usage | Métiers |
| --- | --- | --- | --- |
| Descriptif / EDA | DATA | Dashboards, détection d'outliers, reporting | Data Analyst, BI |
| Tests & p-value | DATA | A/B testing, décisions produit | Product/Growth Analyst |
| IC / Sampling | BIG DATA | Estimer sur échantillon, marges d'erreur | Data Engineer, Analyst |
| Régression | IA | Prédiction, modélisation, baseline ML | Data Scientist, ML Eng. |
| MLE | IA | Fondement de l'entraînement des modèles | ML Engineer, Chercheur |

::: info Pour approfondir
[Khan Academy — Stats](https://www.khanacademy.org/math/statistics-probability) [Tests statistiques](https://fr.wikipedia.org/wiki/Test_statistique) [Régression linéaire](https://fr.wikipedia.org/wiki/R%C3%A9gression_lin%C3%A9aire) [Seeing Theory](https://seeing-theory.brown.edu/fr.html)
:::

## 8. Exercices de synthèse

::: exo Exercice 1 — Descriptif
Données : 2, 4, 4, 5, 100. Calcule moyenne et médiane. Lequel décrit mieux le « centre » ?
?? Voir la solution
Moyenne = 115/5 = 23. Médiane = 4 (valeur du milieu). La médiane (4) décrit bien mieux le centre : 100 est un outlier qui gonfle la moyenne.
:::

::: exo Exercice 2 — Intervalle de confiance
Échantillon n=100, moyenne \(\bar x=50\), écart-type s=10. Donne l'IC à 95 % de la moyenne.
?? Voir la solution
Marge = 1,96 × 10/√100 = 1,96 × 1 = 1,96. IC = [50 − 1,96 ; 50 + 1,96] = [48,04 ; 51,96].
:::

::: exo Exercice 3 — Test (⭐)
Un A/B test donne p-value = 0,12 avec α=0,05. Conclusion ? Peut-on dire que B n'a aucun effet ?
?? Voir la solution
0,12 > 0,05 → on **ne rejette pas H₀** : pas de preuve d'effet significatif. Mais cela ne prouve PAS l'absence d'effet (peut-être échantillon trop petit, manque de puissance). « Absence de preuve » ≠ « preuve d'absence ».
:::

::: exo Exercice 4 — Régression (⭐⭐)
Pourquoi, quand deux features sont presque identiques (colinéaires), la formule \((X^\top X)^{-1}\) pose-t-elle problème ? Quelle solution ?
?? Voir la solution
La colinéarité rend \(X^\top X\) presque singulière (\(\det\approx0\), Module 2) : l'inverse explose, les coefficients deviennent instables et énormes. Solution : **régularisation Ridge** \((X^\top X + \lambda I)^{-1}\), qui rend la matrice inversible et stabilise. (Lien direct algèbre linéaire ↔ stats.)
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi.
Mesurer, comparer, décider sous incertitude : la statistique moderne s'est bâtie en un siècle à peine — et pas sans **disputes féroces** entre ses fondateurs.

#### Les grands noms
- **Gauss & Legendre** (~1805-1809) — méthode des *moindres carrés* et loi normale (la « courbe en cloche »).
- **Francis Galton** (1822-1911) — invente la *régression* et la corrélation (mais aussi, côté sombre, l'eugénisme — à connaître de façon critique).
- **Karl Pearson** (1857-1936) — fonde la statistique mathématique (test du χ², coefficient de corrélation).
- **Ronald Fisher** (1890-1962) — p-value, test d'hypothèse, ANOVA, maximum de vraisemblance.
- **Neyman & Egon Pearson** (années 1930) — théorie des tests (erreurs de type I et II).

#### Le tournant… et la controverse
La fameuse « *p-value < 0,05* » de Fisher est devenue le standard de la science expérimentale. Mais son usage mécanique a nourri une **crise de reproductibilité** : depuis 2016, l'American Statistical Association met officiellement en garde contre le culte du 0,05.

#### Pourquoi ça te concerne
Tests A/B, intervalles de confiance, évaluation de modèles ML : la rigueur statistique est ce qui sépare un résultat *réel* d'un simple coup de chance.
- [Ronald Fisher](https://fr.wikipedia.org/wiki/Ronald_Aylmer_Fisher)
- [Moindres carrés](https://fr.wikipedia.org/wiki/M%C3%A9thode_des_moindres_carr%C3%A9s)
- [p-value & controverse](https://fr.wikipedia.org/wiki/Valeur_p)
- [Seeing Theory](https://seeing-theory.brown.edu/fr.html)
:::
