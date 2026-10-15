---
title: Module 3 — Probabilités
subtitle: La science de l'incertitude. En Data et en IA, on ne prédit jamais « la » vérité mais une probabilité. Ce module te donne le langage pour modéliser le hasard, raisonner avec Bayes et comprendre pourquoi « plus de données = plus de fiabilité ».
domains: DATA, BIG DATA, IA
objectifs: Manier le vocabulaire probabiliste (univers, événements, indépendance) ; appliquer les probabilités conditionnelles et le théorème de Bayes ; connaître les lois usuelles (Bernoulli, binomiale, Poisson, normale) ; comprendre espérance/variance, la loi des grands nombres et le théorème central limite.
---

## 1. Vocabulaire & axiomes

::: def Définitions de base
- **Univers** \(\Omega\) : ensemble de tous les résultats possibles (ex. \(\{1,\dots,6\}\) pour un dé).
- **Événement** \(A\) : une partie de \(\Omega\) (ex. « obtenir un pair » = \(\{2,4,6\}\)).
- **Probabilité** \(P(A)\in[0,1]\).
:::

::: info Axiomes de Kolmogorov & règles
\[ 0\le P(A)\le 1,\quad P(\Omega)=1,\quad P(A\cup B)=P(A)+P(B)-P(A\cap B) \] Complémentaire : \(P(\bar A)=1-P(A)\). Si \(A,B\) incompatibles (\(A\cap B=\varnothing\)) : \(P(A\cup B)=P(A)+P(B)\).
:::

::: info Exemple
Dé équilibré : \(P(\text{pair})=\tfrac36=\tfrac12\). \(P(\text{pair ou} >4)=P(\{2,4,6\})+P(\{5\})=\tfrac36+\tfrac16=\tfrac46\) (5 est impair, aucune intersection avec pair sauf 6 déjà compté → on fait attention au crible).
:::

::: quiz Quiz 1.1
Si \(P(A)=0{,}3\) et \(P(B)=0{,}5\) avec \(A,B\) incompatibles, que vaut \(P(A\cup B)\) ?
- [ ] 0,15
- [x] 0,8
- [ ] 0,2
- [ ] 1,0
> Incompatibles ⇒ \(P(A\cap B)=0\), donc \(P(A\cup B)=0{,}3+0{,}5=0{,}8\).
:::

::: quiz Quiz 1.2
Que vaut toujours \(P(\bar A)\) ?
- [ ] \(P(A)\)
- [ ] \(1+P(A)\)
- [x] \(1-P(A)\)
- [ ] \(0\)
> La probabilité du complémentaire est \(1-P(A)\) : utile pour calculer « au moins un » via « aucun ».
:::

## 2. Probabilités conditionnelles & indépendance

::: def Probabilité conditionnelle
\[ P(A\mid B) = \frac{P(A\cap B)}{P(B)} \quad (P(B)>0) \] « Probabilité de \(A\) sachant que \(B\) est réalisé. » On *réduit l'univers* à \(B\).
:::

::: def Indépendance
\(A\) et \(B\) sont **indépendants** ssi \(P(A\cap B)=P(A)P(B)\), c'est-à-dire \(P(A\mid B)=P(A)\) (savoir \(B\) n'apprend rien sur \(A\)).
:::

::: info Probabilités totales
Si \(B_1,\dots,B_n\) forment une partition de \(\Omega\) : \[ P(A)=\sum_{i} P(A\mid B_i)\,P(B_i) \]
:::

::: info IA Lien
L'hypothèse d'indépendance (naïve) est le cœur du classifieur **Naive Bayes** (anti-spam, classification de texte). Les **réseaux bayésiens** modélisent des dépendances conditionnelles complexes.
:::

::: quiz Quiz 2.1
On tire 2 cartes sans remise dans un jeu de 52. Les deux tirages sont-ils indépendants ?
- [x] Non : le 1ᵉʳ tirage change les probabilités du 2ᵉ
- [ ] Oui, toujours
- [ ] Oui, car 52 est grand
- [ ] Impossible à dire
> Sans remise, l'univers du 2ᵉ tirage a changé (51 cartes). \(P(2^e\mid 1^{er})\neq P(2^e)\) : dépendants. Avec remise, ils seraient indépendants.
:::

::: quiz Quiz 2.2
\(P(A)=0{,}5\), \(P(B)=0{,}4\), \(P(A\cap B)=0{,}2\). \(A\) et \(B\) sont-ils indépendants ?
- [ ] Non
- [ ] Impossible à dire
- [ ] Ils sont incompatibles
- [x] Oui : \(P(A)P(B)=0{,}2=P(A\cap B)\)
> \(P(A)P(B)=0{,}5\times0{,}4=0{,}2\), égal à \(P(A\cap B)\). Le critère d'indépendance est vérifié.
:::

## 3. Théorème de Bayes ⭐

::: info Formule de Bayes
\[ P(A\mid B) = \frac{P(B\mid A)\,P(A)}{P(B)} \] On **inverse** le conditionnement. \(P(A)\) = *a priori*, \(P(A\mid B)\) = *a posteriori* (après observation de \(B\)), \(P(B\mid A)\) = *vraisemblance*.
:::

::: info Exemple culte — test médical (piège d'intuition)
Maladie touchant \(1\%\) de la population. Test : \(99\%\) de vrais positifs, \(5\%\) de faux positifs. Tu es positif. Quelle probabilité d'être malade ?

\(P(M)=0{,}01\), \(P(+\mid M)=0{,}99\), \(P(+\mid \bar M)=0{,}05\).

\(P(+)=0{,}99\times0{,}01 + 0{,}05\times0{,}99 = 0{,}0099 + 0{,}0495 = 0{,}0594\).

\(P(M\mid +)=\dfrac{0{,}0099}{0{,}0594}\approx \mathbf{16{,}7\%}\) seulement ! La rareté de la maladie domine. C'est le **paradoxe du taux de base**.
:::

::: info IA DATA Lien
Bayes est partout : filtres anti-spam, diagnostic, A/B testing bayésien, mise à jour de croyances d'un modèle, détection de fraude. Toute l'**inférence bayésienne** en dépend.
:::

::: quiz Quiz 3.1
Dans l'exemple du test, pourquoi \(P(M\mid+)\) est-il si bas malgré un test « à 99 % » ?
- [ ] Le test est mauvais
- [ ] Un calcul est faux
- [x] La maladie est rare : beaucoup de faux positifs noient les vrais
- [ ] Bayes ne s'applique pas ici
> Avec une maladie à 1 %, les 5 % de faux positifs sur les 99 % de gens sains produisent beaucoup plus de positifs que les vrais malades. L'a priori (taux de base) pèse énormément.
:::

::: quiz Quiz 3.2
Dans \(P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)}\), comment s'appelle \(P(A)\) ?
- [ ] La vraisemblance
- [x] L'a priori (prior)
- [ ] L'a posteriori
- [ ] L'évidence
> \(P(A)\) est l'a priori (prior) : ce qu'on croyait avant d'observer \(B\). \(P(A\mid B)\) est l'a posteriori.
:::

## 4. Variables aléatoires

::: def Définition
Une **variable aléatoire** (VA) \(X\) associe un nombre à chaque résultat. **Discrète** (valeurs dénombrables, ex. nb de clics) ou **continue** (valeurs réelles, ex. temps de réponse).
:::

- **Loi discrète** : \(P(X=k)\), avec \(\sum_k P(X=k)=1\).
- **Densité** \(f\) (cas continu) : \(P(a\le X\le b)=\int_a^b f(x)\,dx\), avec \(\int_{\mathbb R} f = 1\).
- **Fonction de répartition** : \(F(x)=P(X\le x)\).

::: quiz Quiz 4.1
« Le nombre d'e-mails reçus par heure » est une variable aléatoire plutôt…
- [x] discrète
- [ ] continue
- [ ] constante
- [ ] ni l'une ni l'autre
> C'est un comptage (0, 1, 2, …) : variable discrète. On la modélise souvent par une loi de Poisson.
:::

## 5. Lois usuelles

| Loi | Modélise | Espérance | Variance |
| --- | --- | --- | --- |
| **Bernoulli**(p) | 1 essai binaire (succès/échec) | \(p\) | \(p(1-p)\) |
| **Binomiale**(n,p) | nb de succès sur n essais | \(np\) | \(np(1-p)\) |
| **Géométrique**(p) | nb d'essais avant 1ᵉʳ succès | \(1/p\) | \((1-p)/p^2\) |
| **Poisson**(λ) | nb d'événements rares / unité | \(\lambda\) | \(\lambda\) |
| **Uniforme**[a,b] | hasard « plat » | \(\frac{a+b}{2}\) | \(\frac{(b-a)^2}{12}\) |
| **Normale**(μ,σ²) | phénomènes « en cloche » | \(\mu\) | \(\sigma^2\) |

::: def Binomiale — formule
\[ P(X=k)=\binom{n}{k}p^k(1-p)^{n-k} \]
:::

::: def Loi normale (gaussienne)
\[ f(x)=\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}} \] Règle **68–95–99,7** : 68 % des valeurs dans \([\mu\pm\sigma]\), 95 % dans \([\mu\pm2\sigma]\), 99,7 % dans \([\mu\pm3\sigma]\).
:::

::: info DATA Lien
Poisson : requêtes serveur, arrivées de clics, pannes. Normale : erreurs de mesure, tailles, bruit. Binomiale : taux de conversion, A/B testing.
:::

::: quiz Quiz 5.1
On lance 10 fois une pièce équilibrée. Quelle loi décrit le nombre de « face » ?
- [ ] Poisson(10)
- [x] Binomiale(10, 0,5)
- [ ] Normale(0,1)
- [ ] Géométrique(0,5)
> n=10 essais indépendants, p=0,5 de succès : c'est une binomiale B(10 ; 0,5). Espérance np=5.
:::

::: quiz Quiz 5.2
Pour une loi normale, environ quel pourcentage des valeurs tombe dans \([\mu-2\sigma,\ \mu+2\sigma]\) ?
- [ ] 68 %
- [ ] 50 %
- [x] 95 %
- [ ] 99,7 %
> Règle 68–95–99,7 : à ±2σ on couvre ~95 % des valeurs. C'est la base des intervalles de confiance.
:::

::: quiz Quiz 5.3
Quelle particularité a la loi de Poisson(λ) ?
- [x] Son espérance ET sa variance valent λ
- [ ] Sa variance vaut toujours 1
- [ ] Elle est continue
- [ ] Elle n'a pas d'espérance
> Pour Poisson, E[X]=Var[X]=λ. Si sur des données réelles la variance dépasse largement la moyenne, on parle de surdispersion (Poisson mal adaptée).
:::

## 6. Espérance & variance

::: def Définitions
- **Espérance** (moyenne théorique) : \(E[X]=\sum_k k\,P(X=k)\) (discret) ou \(\int x f(x)dx\) (continu).
- **Variance** : \(\mathrm{Var}(X)=E[(X-E[X])^2]=E[X^2]-E[X]^2\). **Écart-type** : \(\sigma=\sqrt{\mathrm{Var}(X)}\).
:::

::: info Propriétés (à connaître)
\[ E[aX+b]=aE[X]+b,\qquad \mathrm{Var}(aX+b)=a^2\mathrm{Var}(X) \] Linéarité de l'espérance (toujours vraie) : \(E[X+Y]=E[X]+E[Y]\). Si \(X,Y\) indépendants : \(\mathrm{Var}(X+Y)=\mathrm{Var}(X)+\mathrm{Var}(Y)\).
:::

::: info IA Lien — biais & variance
Le compromis **biais-variance** gouverne le sur/sous-apprentissage. La variance mesure l'instabilité d'un modèle selon les données ; le biais, son erreur systématique.
:::

::: quiz Quiz 6.1
\(E[X]=3\). Que vaut \(E[2X+1]\) ?
- [ ] 6
- [x] 7
- [ ] 3
- [ ] 4
> Linéarité : \(E[2X+1]=2E[X]+1=2\times3+1=7\).
:::

::: quiz Quiz 6.2
\(\mathrm{Var}(X)=4\). Que vaut \(\mathrm{Var}(3X)\) ?
- [ ] 12
- [ ] 4
- [ ] 7
- [x] 36
> \(\mathrm{Var}(aX)=a^2\mathrm{Var}(X)=3^2\times4=36\). La constante additive n'aurait rien changé.
:::

## 7. Loi des grands nombres & Théorème central limite

::: info Loi des grands nombres (LGN)
La moyenne empirique \(\bar X_n=\frac1n\sum X_i\) converge vers l'espérance \(\mu\) quand \(n\to\infty\). **Plus on a de données, plus la moyenne observée est fiable.** C'est le fondement de l'estimation.
:::

::: info Théorème central limite (TCL)
Pour \(n\) grand, la moyenne \(\bar X_n\) suit approximativement une **loi normale** : \[ \bar X_n \approx \mathcal N\!\left(\mu,\ \frac{\sigma^2}{n}\right) \] **Peu importe la loi de départ** (du moment que \(\sigma\) est fini). C'est pourquoi la gaussienne est partout.
:::

::: info BIG DATA Lien
LGN = justification du **sampling** (échantillonnage) : estimer une statistique sur un échantillon plutôt que sur des téraoctets. TCL = base des **intervalles de confiance** et des tests A/B (Module 4).
:::

::: quiz Quiz 7.1
Le TCL dit que la moyenne d'un grand échantillon est approximativement…
- [ ] uniforme
- [ ] de Poisson
- [x] normale, quelle que soit la loi de départ
- [ ] toujours égale à μ exactement
> Le TCL affirme la normalité approchée de la moyenne pour n grand, indépendamment de la distribution d'origine (variance finie). D'où l'omniprésence de la loi normale.
:::

::: quiz Quiz 7.2
Quand n augmente, la variance de la moyenne \(\bar X_n\) (\(=\sigma^2/n\))…
- [x] diminue (la moyenne se concentre autour de μ)
- [ ] augmente
- [ ] reste constante
- [ ] devient négative
> \(\sigma^2/n\) décroît en 1/n : plus l'échantillon est grand, plus la moyenne est précise. C'est la LGN quantifiée.
:::

## 8. Domaines, usages & métiers

| Notion | Domaine | Usage concret | Métiers |
| --- | --- | --- | --- |
| Bayes | IA | Naive Bayes (spam), diagnostic, détection de fraude | Data Scientist, ML Engineer |
| Lois (Poisson/Normale) | DATA | Modéliser trafic, pannes, erreurs de mesure | Data Analyst, Statisticien |
| LGN / Sampling | BIG DATA | Estimer sur échantillon au lieu de scanner tout | Data Engineer, Analytics Engineer |
| TCL / Intervalles | DATA | A/B testing, marges d'erreur, dashboards | Product Analyst, Growth |
| Espérance/Variance | IA | Compromis biais-variance, régularisation | ML Engineer, Chercheur |

::: info Pour approfondir
[Khan Academy — Probabilités](https://www.khanacademy.org/math/statistics-probability) [Seeing Theory (visuel & interactif)](https://seeing-theory.brown.edu/fr.html) [Théorème de Bayes](https://fr.wikipedia.org/wiki/Th%C3%A9or%C3%A8me_de_Bayes) [TCL](https://fr.wikipedia.org/wiki/Th%C3%A9or%C3%A8me_central_limite)
:::

## 9. Exercices de synthèse

::: exo Exercice 1 — Bayes
Une usine a 2 machines : A produit 60 % des pièces (2 % défectueuses), B produit 40 % (5 % défectueuses). Une pièce est défectueuse. Probabilité qu'elle vienne de B ?
?? Voir la solution
\(P(D)=0{,}6\times0{,}02+0{,}4\times0{,}05=0{,}012+0{,}02=0{,}032\). \(P(B\mid D)=\frac{0{,}02}{0{,}032}=0{,}625=\mathbf{62{,}5\%}\).
:::

::: exo Exercice 2 — Binomiale
Un site a un taux de conversion de 10 %. Sur 5 visiteurs, probabilité d'exactement 2 conversions ?
?? Voir la solution
\(P(X=2)=\binom52 (0{,}1)^2(0{,}9)^3 = 10\times0{,}01\times0{,}729 = 0{,}0729 \approx \mathbf{7{,}3\%}\).
:::

::: exo Exercice 3 — Espérance (⭐)
Un jeu : tu gagnes 10 € avec proba 0,2, tu perds 3 € sinon. Espérance de gain ? Jeu favorable ?
?? Voir la solution
\(E=10\times0{,}2 + (-3)\times0{,}8 = 2 - 2{,}4 = -0{,}4\) €. Espérance négative ⇒ jeu **défavorable** sur le long terme (LGN).
:::

::: exo Exercice 4 — TCL (⭐⭐)
Les temps de réponse d'un serveur ont μ=200 ms, σ=40 ms. On mesure la moyenne sur 100 requêtes. Quelle est la loi approchée de cette moyenne et son écart-type ?
?? Voir la solution
Par le TCL : \(\bar X_{100}\approx \mathcal N(200,\ 40^2/100)=\mathcal N(200,\ 16)\). Écart-type de la moyenne = \(\sqrt{16}=4\) ms. La moyenne est donc bien plus stable (4 ms) qu'une mesure individuelle (40 ms).
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi.
La théorie des probabilités est née… d'un **problème de jeux d'argent**, en 1654. Deux génies échangent des lettres pour savoir comment partager équitablement une mise si la partie s'arrête — et fondent sans le savoir une science qui gouverne aujourd'hui l'IA.

#### Les grands noms
- **Blaise Pascal & Pierre de Fermat** (1654) — leur correspondance sur le « problème des partis » fonde le calcul des probabilités.
- **Jacob Bernoulli** (1655-1705) — démontre la *loi des grands nombres* (*Ars Conjectandi*, 1713).
- **Thomas Bayes** (1701-1761) — son théorème (publié en 1763) révolutionne l'inférence… deux siècles plus tard.
- **Pierre-Simon Laplace** (1749-1827) — systématise toute la théorie (1812).
- **Andreï Kolmogorov** (1903-1987) — axiomatise rigoureusement les probabilités en 1933.

#### Le tournant décisif
Pendant le projet Manhattan (années 1940), Ulam, von Neumann et Metropolis inventent les méthodes de *Monte-Carlo* : simuler le hasard pour calculer l'incalculable. Et le théorème de Bayes, longtemps marginal, devient central : filtres anti-spam, diagnostic médical, apprentissage bayésien.

#### Pourquoi ça te concerne
Naive Bayes, l'incertitude des prédictions, l'échantillonnage de données, l'A/B testing : dès que tu modélises le hasard, tu marches dans les pas de Pascal et Bayes.
- [Le problème des partis](https://fr.wikipedia.org/wiki/Probl%C3%A8me_des_partis)
- [Théorème de Bayes](https://fr.wikipedia.org/wiki/Th%C3%A9or%C3%A8me_de_Bayes)
- [Méthodes de Monte-Carlo](https://fr.wikipedia.org/wiki/M%C3%A9thode_de_Monte-Carlo)
- [Seeing Theory (visuel)](https://seeing-theory.brown.edu/fr.html)
:::
