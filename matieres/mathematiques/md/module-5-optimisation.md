---
title: Module 5 — Analyse & Optimisation
subtitle: Comment un modèle « apprend » : en minimisant une fonction de coût. Dérivées, gradient et descente de gradient sont le moteur de TOUT le deep learning. Si tu ne devais retenir qu'un module pour l'IA, ce serait celui-ci.
domains: DATA, IA
objectifs: Comprendre dérivée et gradient ; interpréter les dérivées partielles ; savoir ce qu'est la convexité ; dérouler la descente de gradient et ses variantes ; comprendre la rétropropagation à haut niveau.
---

## 1. Dérivées

::: def Définition
La **dérivée** \(f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}\) est la **pente** de la courbe en \(x\) : le taux de variation instantané. \(f'(x)>0\) = ça monte, \(<0\) = ça descend, \(=0\) = plat (extremum potentiel).
:::

| \(f(x)\) | \(f'(x)\) |
| --- | --- |
| \(x^n\) | \(n x^{n-1}\) |
| \(e^x\) | \(e^x\) |
| \(\ln x\) | \(1/x\) |
| \(\sin x\) | \(\cos x\) |

::: info Règles essentielles
Produit : \((uv)'=u'v+uv'\). Quotient : \((u/v)'=\frac{u'v-uv'}{v^2}\). **Composition (chain rule)** : \((f\circ g)'(x)=f'(g(x))\cdot g'(x)\) — la clé de la rétropropagation.
:::

::: quiz Quiz 1.1
Que vaut la dérivée de \(f(x)=x^3\) ?
- [ ] \(x^2\)
- [x] \(3x^2\)
- [ ] \(3x\)
- [ ] \(x^3/3\)
> Règle de puissance : \((x^n)'=nx^{n-1}\), donc \((x^3)'=3x^2\).
:::

::: quiz Quiz 1.2
En un minimum local d'une fonction dérivable, la dérivée vaut…
- [ ] toujours positive
- [ ] l'infini
- [x] 0 (tangente horizontale)
- [ ] négative
> À un extremum intérieur, f'(x)=0 : la pente est nulle. (Condition nécessaire, pas suffisante : il faut vérifier f'' ou le signe.)
:::

## 2. Gradient & dérivées partielles

::: def Dérivée partielle & gradient
Pour \(f(x_1,\dots,x_n)\), la **dérivée partielle** \(\frac{\partial f}{\partial x_i}\) dérive par rapport à \(x_i\) (les autres fixes). Le **gradient** est le vecteur de toutes : \[ \nabla f = \left(\frac{\partial f}{\partial x_1},\dots,\frac{\partial f}{\partial x_n}\right) \]
:::

::: info Propriété clé
Le gradient \(\nabla f\) pointe dans la direction de **plus forte augmentation** de \(f\). Donc \(-\nabla f\) pointe vers la **plus forte diminution** : c'est la direction où aller pour *minimiser*. Tout l'apprentissage est là.
:::

::: info Exemple
\(f(x,y)=x^2+3y^2\). \(\frac{\partial f}{\partial x}=2x\), \(\frac{\partial f}{\partial y}=6y\), donc \(\nabla f=(2x,6y)\). Au point \((1,1)\) : \(\nabla f=(2,6)\).
:::

::: quiz Quiz 2.1
Le gradient \(\nabla f\) pointe vers…
- [x] la plus forte augmentation de f
- [ ] la plus forte diminution de f
- [ ] un point au hasard
- [ ] toujours l'origine
> ∇f indique la montée la plus raide. Pour minimiser une fonction de coût, on va dans le sens OPPOSÉ : −∇f.
:::

::: quiz Quiz 2.2
Pour \(f(x,y)=x^2+y^2\), que vaut \(\nabla f\) au point \((3,4)\) ?
- [ ] \((3,4)\)
- [ ] \((9,16)\)
- [ ] \((2,2)\)
- [x] \((6,8)\)
> ∂f/∂x=2x, ∂f/∂y=2y, donc ∇f=(2x,2y)=(6,8) en (3,4).
:::

## 3. Convexité

::: def Fonction convexe
\(f\) est **convexe** si son graphe est « en bol » : tout segment entre deux points de la courbe reste au-dessus d'elle. Critère : \(f''(x)\ge0\) (1D) ou Hessienne semi-définie positive (nD).
:::

::: info Pourquoi c'est crucial
Pour une fonction convexe, **tout minimum local est global** : la descente de gradient trouve LA solution. Les fonctions non convexes (réseaux profonds) ont des minima locaux et points-selles — d'où la difficulté de l'entraînement.
:::

::: info IA Lien
Régression linéaire / logistique, SVM = problèmes **convexes** (optimum garanti). Deep learning = **non convexe** (on se contente d'un bon minimum local).
:::

::: quiz Quiz 3.1
Pour une fonction convexe, un minimum local est…
- [ ] rarement global
- [x] forcément global
- [ ] impossible
- [ ] toujours en zéro
> La convexité garantit qu'il n'y a qu'un « bol » : tout minimum local est le minimum global. C'est pourquoi on adore les problèmes convexes.
:::

## 4. Descente de gradient ⭐

::: info L'algorithme (à connaître par cœur)
Pour minimiser une fonction de coût \(J(\theta)\), on répète : \[ \theta \leftarrow \theta - \eta\,\nabla J(\theta) \] où \(\eta\) est le **taux d'apprentissage** (learning rate). On fait de petits pas « vers le bas » jusqu'à convergence (gradient ≈ 0).
:::

::: info Exemple à la main
\(J(\theta)=\theta^2\), \(\nabla J=2\theta\), \(\eta=0{,}1\), départ \(\theta_0=5\).

\(\theta_1=5-0{,}1\times10=4\). \(\theta_2=4-0{,}1\times8=3{,}2\). \(\theta_3=3{,}2-0{,}1\times6{,}4=2{,}56\)… ça converge bien vers 0 (le minimum). ✔
:::

::: info Le learning rate, paramètre critique
Trop **petit** : convergence très lente. Trop **grand** : on « saute » le minimum, ça diverge (oscille et explose). Le régler est un art (voir variantes).
:::

::: quiz Quiz 4.1
Dans \(\theta \leftarrow \theta - \eta\nabla J\), pourquoi le signe « − » ?
- [ ] Par convention arbitraire
- [ ] Pour augmenter J
- [x] Pour aller dans le sens opposé au gradient (descendre)
- [ ] Pour annuler η
> ∇J monte ; on veut descendre (minimiser), donc on va dans la direction −∇J. D'où le signe moins.
:::

::: quiz Quiz 4.2
Un learning rate beaucoup trop grand provoque…
- [ ] une convergence parfaite
- [x] des oscillations / divergence (on saute le minimum)
- [ ] un apprentissage plus précis
- [ ] rien de spécial
> Un pas trop grand fait dépasser le minimum à chaque itération : la perte oscille ou explose. Trop petit = lent. Il faut un juste milieu.
:::

## 5. Variantes & learning rate

| Variante | Idée | Usage |
| --- | --- | --- |
| **Batch GD** | gradient sur TOUT le dataset | précis mais lent |
| **SGD** (stochastique) | gradient sur 1 exemple | rapide, bruité |
| **Mini-batch** | gradient sur un paquet (32–256) | standard en deep learning |
| **Momentum** | accumule l'élan | traverse les plateaux |
| **Adam** | learning rate adaptatif par paramètre | défaut moderne |

::: info IA DATA Lien
Le **mini-batch SGD** rend l'apprentissage possible sur des datasets gigantesques (Big Data) : on n'a pas besoin de tout charger. **Adam** est l'optimiseur par défaut de la plupart des réseaux de neurones.
:::

::: quiz Quiz 5.1
Pourquoi le mini-batch SGD est-il adapté au Big Data ?
- [ ] Il utilise tout le dataset à chaque pas
- [ ] Il n'a pas besoin de gradient
- [x] Il met à jour sur de petits paquets, sans tout charger en mémoire
- [ ] Il est exact
> En traitant des mini-lots, on met à jour les paramètres fréquemment sans charger l'intégralité des données : idéal pour des volumes massifs et un entraînement rapide.
:::

## 6. Chain rule & rétropropagation

::: def Rétropropagation (backprop)
Un réseau de neurones est une **composition** de fonctions. Pour calculer le gradient de la perte par rapport à chaque poids, on applique la **règle de la chaîne** en remontant du coût vers les premières couches. C'est juste \((f\circ g)' = f'(g)\cdot g'\) appliqué à grande échelle.
:::

::: info IA Lien
PyTorch / TensorFlow calculent ces gradients automatiquement (**autograd**). Comprendre la chain rule, c'est comprendre pourquoi/comment un réseau apprend.
:::

::: quiz Quiz 6.1
La rétropropagation repose mathématiquement sur…
- [x] la règle de la chaîne (dérivée de composée)
- [ ] le théorème de Bayes
- [ ] la SVD
- [ ] la loi des grands nombres
> Backprop = application systématique de la chain rule (f∘g)'=f'(g)·g' pour propager les gradients couche par couche, de la sortie vers l'entrée.
:::

## 7. Domaines, usages & métiers

| Notion | Domaine | Usage | Métiers |
| --- | --- | --- | --- |
| Gradient | IA | Direction d'apprentissage de tout modèle | ML Engineer, Chercheur |
| Descente de gradient | IA | Entraînement (deep learning, régression) | Data Scientist, ML Eng. |
| Convexité | IA | Garantie d'optimum (SVM, régression) | Chercheur, Optimisation |
| Mini-batch SGD | DATA | Apprentissage sur gros volumes | ML Engineer, MLOps |
| Backprop | IA | Cœur des frameworks (PyTorch/TF) | Deep Learning Engineer |

::: info Pour approfondir
[3Blue1Brown — Réseaux de neurones & backprop](https://www.3blue1brown.com/topics/neural-networks) [Descente de gradient](https://fr.wikipedia.org/wiki/Algorithme_du_gradient) [Khan Academy — Calcul multivariable](https://www.khanacademy.org/math/multivariable-calculus)
:::

## 8. Exercices de synthèse

::: exo Exercice 1 — Dérivée
Calcule la dérivée de \(f(x)=3x^2 - 4x + 7\) et trouve son minimum.
?? Voir la solution
\(f'(x)=6x-4\). Minimum quand \(f'=0\) : \(x=4/6=2/3\). (Et \(f''=6>0\) confirme un minimum.)
:::

::: exo Exercice 2 — Gradient
\(f(x,y)=x^2 + xy + y^2\). Calcule \(\nabla f\) au point \((1,2)\).
?? Voir la solution
\(\frac{\partial f}{\partial x}=2x+y\), \(\frac{\partial f}{\partial y}=x+2y\). En \((1,2)\) : \(\nabla f=(2+2,\ 1+4)=(4,5)\).
:::

::: exo Exercice 3 — Descente de gradient (⭐)
\(J(\theta)=(\theta-3)^2\), \(\eta=0{,}5\), départ \(\theta_0=0\). Fais 2 itérations.
?? Voir la solution
\(\nabla J=2(\theta-3)\). \(\theta_1=0-0{,}5\times2(0-3)=0+3=3\). On tombe directement sur le minimum ! \(\theta_2=3-0{,}5\times2(3-3)=3\). (Avec η=0,5 et cette parabole, convergence en 1 pas.)
:::

::: exo Exercice 4 — Learning rate (⭐⭐)
Avec \(J(\theta)=\theta^2\) (\(\nabla J=2\theta\)) et \(\eta=1\), que se passe-t-il depuis \(\theta_0=1\) ?
?? Voir la solution
\(\theta_1=1-1\times2=-1\). \(\theta_2=-1-1\times(-2)=1\). \(\theta_3=-1\)… ça **oscille** entre 1 et −1 sans converger ! Le learning rate est trop grand. Il faudrait \(\eta<1\) ici pour converger.
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi.
Pour une machine, « apprendre » revient à **minimiser une erreur**. L'optimisation est le moteur silencieux — et souvent invisible — de toute l'intelligence artificielle moderne.

#### Les grands noms
- **Joseph-Louis Lagrange** (1736-1813) — les *multiplicateurs de Lagrange* pour l'optimisation sous contrainte.
- **Augustin-Louis Cauchy** (1789-1857) — décrit la *descente de gradient* dès 1847.
- **Leonid Kantorovich** (1912-1986) — fonde la programmation linéaire (1939), prix Nobel d'économie 1975.
- **George Dantzig** (1914-2005) — invente l'algorithme du *simplexe* (1947). Étudiant, il résout deux problèmes « impossibles » en les prenant pour des devoirs !
- **Rumelhart, Hinton & Williams** (1986) — popularisent la *rétropropagation*, qui applique le gradient aux réseaux de neurones.

#### Le tournant décisif
La rétropropagation (*backprop*) couplée à la descente de gradient stochastique rend l'apprentissage profond possible à grande échelle. En 2014, l'optimiseur *Adam* devient le standard de fait, utilisé pour entraîner la quasi-totalité des réseaux actuels.

#### Pourquoi ça te concerne
Entraîner un modèle = « descendre » une fonction de perte vers son minimum. Comprendre le gradient, c'est comprendre *pourquoi* un réseau apprend — ou reste bloqué.
- [Descente de gradient](https://fr.wikipedia.org/wiki/Algorithme_du_gradient)
- [George Dantzig](https://fr.wikipedia.org/wiki/George_Dantzig)
- [Rétropropagation](https://fr.wikipedia.org/wiki/R%C3%A9tropropagation_du_gradient)
- [3Blue1Brown — réseaux de neurones](https://www.3blue1brown.com/topics/neural-networks)
:::
