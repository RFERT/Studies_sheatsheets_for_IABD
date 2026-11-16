---
title: Entraîner un réseau — pertes, rétropropagation et optimiseurs
subtitle: Comment un réseau apprend ses millions de poids : la fonction de perte, le calcul du gradient par la chain rule, et les algorithmes qui l'exploitent.
domains: IA
tags: fonction de perte, entropie croisée, rétropropagation, chain rule, SGD, momentum, Adam, learning rate, initialisation, mini-batch
niveau: Intermédiaire
duree: 75 min
objectifs: Choisir une fonction de perte adaptée ; dérouler la rétropropagation sur un petit réseau ; expliquer SGD, momentum et Adam ; diagnostiquer un learning rate mal réglé à partir des courbes.
---

::: goal Ce que tu sauras faire à la fin
- Associer à chaque tâche la bonne couche de sortie et la bonne perte.
- Calculer à la main les gradients d'un petit réseau avec la **chain rule**.
- Expliquer ce que font `loss.backward()` et `optimizer.step()`.
- Lire une courbe de perte et corriger le learning rate, la taille de batch ou l'initialisation.
:::

## 1. Apprendre = minimiser une perte

Entraîner un réseau, c'est chercher les paramètres \(\theta\) (tous les poids et biais) qui minimisent l'**erreur moyenne** sur les données d'entraînement :

\[ \mathcal{L}(\theta) = \frac{1}{N} \sum_{i=1}^{N} \ell\big(f_\theta(x_i),\ y_i\big) \]

Le réseau a souvent des millions de paramètres et la perte n'est **pas convexe** : impossible de résoudre analytiquement. On utilise la **descente de gradient**, vue en maths (module Optimisation) :

\[ \theta \leftarrow \theta - \eta \, \nabla_\theta \mathcal{L}(\theta) \]

Toute la difficulté est de calculer \(\nabla_\theta \mathcal{L}\) **efficacement** pour des millions de paramètres : c'est le rôle de la **rétropropagation**.

## 2. Choisir la fonction de perte

| Tâche | Sortie du réseau | Perte | PyTorch |
|---|---|---|---|
| Régression | 1 neurone linéaire | MSE \(\frac1N\sum(y - \hat y)^2\) | `nn.MSELoss()` |
| Régression robuste | 1 neurone linéaire | MAE / Huber | `nn.L1Loss()`, `nn.HuberLoss()` |
| Classification binaire | 1 logit \(z\) | entropie croisée binaire | `nn.BCEWithLogitsLoss()` |
| Classification K classes | K logits | entropie croisée | `nn.CrossEntropyLoss()` |
| Multi-label (plusieurs vraies) | K logits indépendants | BCE par classe | `nn.BCEWithLogitsLoss()` |

### L'entropie croisée, intuitivement

Pour une classification à K classes, la softmax transforme les logits en probabilités \(p_k\). Si la vraie classe est \(c\), la perte vaut :

\[ \ell = -\log p_c \]

- Le modèle donne \(p_c = 0{,}9\) à la bonne classe → \(\ell = 0{,}105\) (faible).
- Il donne \(p_c = 0{,}01\) → \(\ell = 4{,}6\) (forte) : une erreur **confiante** coûte très cher.

C'est l'entropie croisée de la théorie de l'information (maths, module 8) entre la distribution vraie (one-hot) et la prédiction, et c'est aussi le **maximum de vraisemblance** (maths, module 4).

::: why Pourquoi pas la MSE pour classer ?
Avec une sigmoïde + MSE, le gradient contient le facteur \(\sigma'(z)\), presque nul quand le neurone sature : un modèle qui se trompe avec certitude apprend **très lentement**. Avec l'entropie croisée, ce facteur se simplifie et le gradient par rapport au logit devient simplement \(p - y\) : grand quand l'erreur est grande.
:::

::: quiz Quiz 2.1 — Perte et sortie
Tu classes des images en 10 catégories avec PyTorch. Que doit renvoyer le `forward` du modèle pour `nn.CrossEntropyLoss` ?
- [ ] Les probabilités après softmax
- [x] Les 10 logits bruts (sans softmax)
- [ ] L'indice de la classe prédite (argmax)
> CrossEntropyLoss applique elle-même log-softmax, de façon numériquement stable. Lui passer des probabilités applique la softmax deux fois (gradients écrasés). L'argmax n'est pas dérivable : on ne peut pas apprendre avec. Les cibles, elles, sont des indices de classe (0 à 9).
:::

## 3. La rétropropagation

### Le graphe de calcul

Toute passe avant est une composition d'opérations élémentaires. Pour un neurone avec perte MSE :

```text
x ──┐
    ├─(×w)──(+b)── z ──σ── a ──(− y)²── ℓ
w ──┘
```

La **chain rule** donne la dérivée de \(\ell\) par rapport à chaque paramètre en multipliant les dérivées locales **le long du chemin** :

\[ \frac{\partial \ell}{\partial w} = \frac{\partial \ell}{\partial a} \cdot \frac{\partial a}{\partial z} \cdot \frac{\partial z}{\partial w} \]

La rétropropagation calcule ces produits **de la sortie vers l'entrée**, en réutilisant les résultats intermédiaires : le coût total est du même ordre qu'**une passe avant** (environ 2 à 3 fois), quel que soit le nombre de paramètres. Calculer chaque dérivée séparément par différences finies demanderait une passe avant **par paramètre** — impossible pour un milliard de poids.

::: example Rétropropagation à la main
Un neurone : \(z = wx + b\), \(a = \sigma(z)\), perte \(\ell = (a - y)^2\). Valeurs : \(x = 2\), \(w = 0{,}5\), \(b = -0{,}5\), \(y = 1\).

**Passe avant** : \(z = 0{,}5 \times 2 - 0{,}5 = 0{,}5\) ; \(a = \sigma(0{,}5) \approx 0{,}622\) ; \(\ell = (0{,}622 - 1)^2 \approx 0{,}143\).

**Passe arrière** (de droite à gauche) :
- \(\frac{\partial \ell}{\partial a} = 2(a - y) = -0{,}756\)
- \(\frac{\partial a}{\partial z} = a(1 - a) = 0{,}622 \times 0{,}378 \approx 0{,}235\)
- \(\frac{\partial \ell}{\partial z} = -0{,}756 \times 0{,}235 \approx -0{,}178\)
- \(\frac{\partial \ell}{\partial w} = \frac{\partial \ell}{\partial z} \cdot x \approx -0{,}355\) et \(\frac{\partial \ell}{\partial b} = \frac{\partial \ell}{\partial z} \approx -0{,}178\)

**Mise à jour** avec \(\eta = 1\) : \(w \leftarrow 0{,}5 + 0{,}355 = 0{,}855\), \(b \leftarrow -0{,}5 + 0{,}178 = -0{,}322\). Nouvelle prédiction : \(z = 1{,}388\), \(a \approx 0{,}80\) — plus proche de 1. ✓
:::

### Pour une couche entière (forme matricielle)

Avec \(Z = XW^\top + b\) sur un batch \(X\) de forme \((B, n)\), et \(\delta = \partial \mathcal{L} / \partial Z\) de forme \((B, m)\) :

\[ \frac{\partial \mathcal{L}}{\partial W} = \delta^\top X \quad (m \times n) \qquad \frac{\partial \mathcal{L}}{\partial b} = \sum_{\text{batch}} \delta \qquad \frac{\partial \mathcal{L}}{\partial X} = \delta\, W \quad (B \times n) \]

Le dernier terme est le \(\delta\) **transmis à la couche précédente** : c'est littéralement l'erreur qui « remonte ». À travers une ReLU, on le multiplie terme à terme par \(\mathbb{1}[z > 0]\).

```python
import numpy as np
# Rétropropagation d'un MLP 1 couche cachée, softmax + entropie croisée
def forward_backward(X, y, W1, b1, W2, b2):
    B = X.shape[0]
    Z1 = X @ W1.T + b1; H = np.maximum(0, Z1)               # couche cachée
    Z2 = H @ W2.T + b2
    Z2 = Z2 - Z2.max(axis=1, keepdims=True)
    P = np.exp(Z2) / np.exp(Z2).sum(axis=1, keepdims=True)  # softmax
    loss = -np.log(P[np.arange(B), y]).mean()

    d2 = P.copy(); d2[np.arange(B), y] -= 1; d2 /= B       # dL/dZ2 = (P - Y) / B
    gW2, gb2 = d2.T @ H, d2.sum(axis=0)
    dH = d2 @ W2                                           # erreur transmise
    d1 = dH * (Z1 > 0)                                     # à travers la ReLU
    gW1, gb1 = d1.T @ X, d1.sum(axis=0)
    return loss, (gW1, gb1, gW2, gb2)
```

::: tip Vérifier un gradient
Pour déboguer une rétropropagation écrite à la main, compare-la à un **gradient numérique** : \(\frac{\mathcal{L}(\theta + \varepsilon) - \mathcal{L}(\theta - \varepsilon)}{2\varepsilon}\) avec \(\varepsilon \approx 10^{-5}\), sur quelques paramètres. En PyTorch, `torch.autograd.gradcheck` le fait pour toi.
:::

::: viz activation Pourquoi la profondeur peut tuer le gradient
fonction: sigmoide
x: 0
La rétropropagation multiplie une dérivée d'activation **par couche**. La dérivée de la sigmoïde vaut au plus 0,25 (en x = 0) : sur 10 couches, le gradient est divisé par au moins 4¹⁰ ≈ 10⁶. C'est le **gradient évanescent**, qui a bloqué les réseaux profonds jusqu'à l'adoption de ReLU (dérivée 1 pour x > 0).
:::

::: quiz Quiz 2.2 — Chain rule
Dans un réseau de 20 couches à activation sigmoïde, les premières couches n'apprennent presque pas. Pourquoi ?
- [ ] Parce que leurs poids sont initialisés à zéro
- [x] Parce que le gradient qui leur parvient est un produit de nombreuses dérivées inférieures à 0,25 : il s'évanouit
- [ ] Parce que le learning rate est appliqué seulement à la dernière couche
> La chain rule multiplie les dérivées locales le long du chemin. Avec des facteurs ≤ 0,25, le produit décroît exponentiellement avec la profondeur. Des poids tous nuls posent un autre problème (symétrie), et le learning rate s'applique à toutes les couches.
:::

## 4. Mini-batch et époques

| Variante | Gradient calculé sur | Avantage | Inconvénient |
|---|---|---|---|
| Batch complet | tout le jeu | direction exacte | trop lent, mémoire |
| Stochastique (SGD pur) | 1 exemple | très rapide par pas | très bruité |
| **Mini-batch** | 32 à 512 exemples | bon compromis, exploite le GPU | — |

- **Itération** (*step*) : une mise à jour des poids, sur un mini-batch.
- **Époque** (*epoch*) : un passage complet sur le jeu d'entraînement = \(\lceil N / B \rceil\) itérations.
- Le bruit du mini-batch n'est pas qu'un défaut : il aide à sortir de zones plates et tend à trouver des minima qui généralisent mieux.

::: example Compter les itérations
60 000 images, batch de 128, 10 époques : \(\lceil 60\,000 / 128 \rceil = 469\) itérations par époque, soit 4 690 mises à jour.
:::

## 5. Les optimiseurs

::: viz gradient Taux d'apprentissage et momentum
fonction: nonconvexe
lr: 0.02
momentum: 0
Commence sans momentum depuis x₀ = 1,9 : la descente s'arrête dans le minimum local. Monte β vers 0,8 : la « vitesse » accumulée permet de franchir la bosse. Puis augmente η jusqu'à la divergence.
:::

| Optimiseur | Règle (idée) | Hyperparamètres usuels |
|---|---|---|
| SGD | \(\theta \leftarrow \theta - \eta g\) | η |
| SGD + momentum | \(v \leftarrow \beta v + g\) ; \(\theta \leftarrow \theta - \eta v\) | η, β = 0,9 |
| RMSProp | divise η par la moyenne mobile de \(g^2\) | η, ρ = 0,9 |
| **Adam** | momentum + mise à l'échelle par \(\sqrt{\hat v}\) | η = 10⁻³, β₁ = 0,9, β₂ = 0,999 |
| AdamW | Adam + weight decay découplé | η, λ |

**Adam** maintient pour chaque paramètre une moyenne mobile du gradient \(m\) (direction) et de son carré \(v\) (échelle) :

\[ m \leftarrow \beta_1 m + (1-\beta_1) g \qquad v \leftarrow \beta_2 v + (1-\beta_2) g^2 \qquad \theta \leftarrow \theta - \eta \frac{\hat m}{\sqrt{\hat v} + \varepsilon} \]

où \(\hat m, \hat v\) sont corrigés du biais d'initialisation. Chaque paramètre reçoit ainsi son **propre pas effectif** : grand pour les paramètres rarement mis à jour, petit pour ceux dont le gradient est bruité.

::: tip Valeurs de départ raisonnables
- Adam / AdamW avec η = 10⁻³ (ou 3·10⁻⁴) : bon point de départ presque partout.
- SGD + momentum 0,9 avec un learning rate plus grand (0,01 à 0,1) et un **scheduler** : souvent meilleur en vision quand il est bien réglé.
- Un **scheduler** fait décroître η au fil de l'entraînement (paliers, cosinus) ; un **warmup** l'augmente progressivement au début (indispensable pour les Transformers).
:::

## 6. Lire les courbes d'apprentissage

| Ce que tu vois | Diagnostic probable | Action |
|---|---|---|
| Perte qui explose ou devient `nan` | η trop grand, données non normalisées | diviser η par 10, normaliser, gradient clipping |
| Perte qui baisse très lentement | η trop petit, ou gradient évanescent | augmenter η, ReLU, batch norm |
| Perte qui stagne dès le début | bug (labels mélangés, mauvaise perte), neurones morts | tester sur **un seul batch** : le modèle doit le mémoriser |
| Perte d'entraînement ↓, validation ↑ | **surapprentissage** | régularisation (module suivant) |
| Perte très bruitée | batch trop petit, η trop grand | augmenter le batch ou baisser η |

::: warn Le test du petit batch
Avant tout long entraînement, entraîne le modèle sur **un seul mini-batch** pendant quelques centaines d'itérations. Il doit atteindre une perte proche de 0. S'il n'y arrive pas, le problème est un **bug** (pipeline, perte, dimensions), pas un manque de données.
:::

## 7. Initialiser les poids

- **Tout à zéro** : tous les neurones d'une couche calculent la même chose et reçoivent le même gradient — ils restent **identiques** pour toujours (problème de symétrie).
- **Trop grand** : les activations explosent couche après couche (ou saturent la sigmoïde).
- **Trop petit** : le signal s'éteint.

On choisit l'échelle pour que la **variance des activations reste stable** d'une couche à l'autre :

| Initialisation | Variance des poids | Pour |
|---|---|---|
| Xavier / Glorot | \(\frac{2}{n_{in} + n_{out}}\) | tanh, sigmoïde |
| He / Kaiming | \(\frac{2}{n_{in}}\) | ReLU |

PyTorch initialise déjà `nn.Linear` et `nn.Conv2d` raisonnablement : il est rare de devoir y toucher, mais il faut savoir pourquoi un réseau « maison » mal initialisé n'apprend pas.

::: quiz Quiz 2.3 — Diagnostic
La perte d'entraînement vaut `nan` après quelques itérations. Quelle est la première chose à essayer ?
- [ ] Ajouter des couches
- [x] Diviser le learning rate par 10 et vérifier la normalisation des entrées
- [ ] Augmenter le nombre d'époques
> Un nan signale presque toujours une divergence numérique : pas trop grand, entrées à très grande échelle, ou log(0) dans une perte calculée à la main. Ajouter des couches ou des époques ne corrige rien et aggrave souvent le problème.
:::

::: exo Exercice 1 — Une itération complète à la main
Reprends l'exemple de la section 3 mais avec la perte d'entropie croisée binaire \(\ell = -[y \log a + (1 - y)\log(1 - a)]\). On admet que \(\frac{\partial \ell}{\partial z} = a - y\).
1. Calcule \(\frac{\partial \ell}{\partial w}\) et \(\frac{\partial \ell}{\partial b}\) pour \(x = 2\), \(w = 0{,}5\), \(b = -0{,}5\), \(y = 1\).
2. Compare avec la MSE : quel gradient est le plus grand ? Pourquoi est-ce souhaitable ici ?
?? Voir la solution
1. \(a \approx 0{,}622\), donc \(\frac{\partial \ell}{\partial z} = a - y \approx -0{,}378\). Alors \(\frac{\partial \ell}{\partial w} = -0{,}378 \times 2 \approx -0{,}756\) et \(\frac{\partial \ell}{\partial b} \approx -0{,}378\).
2. Avec la MSE on avait \(\frac{\partial \ell}{\partial z} \approx -0{,}178\) : l'entropie croisée donne un gradient **2 fois plus grand**. La MSE est freinée par le facteur \(\sigma'(z) \approx 0{,}235\) ; l'entropie croisée l'élimine, si bien que plus l'erreur est grande, plus la correction est forte — y compris quand la sigmoïde sature.
:::

::: exo Exercice 2 — Lire un journal d'entraînement
Un camarade obtient : époque 1 perte 2,30 ; époque 5 perte 2,30 ; époque 20 perte 2,30, sur un problème à 10 classes. Les données sont des images MNIST.
1. Que vaut \(-\log(1/10)\) ? Qu'en déduis-tu sur les prédictions du modèle ?
2. Cite trois causes plausibles et la vérification correspondante.
?? Voir la solution
1. \(-\log(0{,}1) \approx 2{,}303\) : le modèle prédit une distribution **uniforme** sur les 10 classes, il n'a rien appris.
2. (a) Learning rate beaucoup trop petit, ou optimiseur jamais appelé — vérifier qu'il y a bien `optimizer.step()` et `optimizer.zero_grad()` dans la boucle. (b) Labels et images désalignés (mélange indépendant) — afficher quelques images avec leur label. (c) Gradient bloqué : softmax avant `CrossEntropyLoss`, neurones ReLU tous morts, paramètres non passés à l'optimiseur — faire le **test du petit batch**.
:::

::: culture Culture & histoire
- **1847** — Augustin-Louis Cauchy décrit la **méthode du gradient** pour résoudre des systèmes d'équations.
- **1951** — Herbert Robbins et Sutton Monro posent les bases de l'**approximation stochastique**, ancêtre du SGD.
- **1970** — Seppo Linnainmaa formalise la **différentiation automatique en mode inverse**, le cœur mathématique de la rétropropagation.
- **1986** — Rumelhart, Hinton et Williams montrent dans *Nature* que la rétropropagation fait émerger des représentations internes utiles.
- **2010** — Xavier Glorot et Yoshua Bengio analysent l'initialisation ; **2015** — Kaiming He et al. l'adaptent à ReLU.
- **2014** — Diederik Kingma et Jimmy Ba publient **Adam**, aujourd'hui l'optimiseur par défaut.
- [Calculus on Computational Graphs (C. Olah)](https://colah.github.io/posts/2015-08-Backprop/)
- [CS231n — Optimization & Backpropagation (Stanford)](https://cs231n.github.io/optimization-2/)
- [Documentation torch.optim](https://pytorch.org/docs/stable/optim.html)
:::

## Synthèse

::: note À retenir
- Entraîner = minimiser une perte moyenne par descente de gradient sur des **mini-batchs**.
- Régression → MSE ; classification → **entropie croisée sur les logits**.
- Rétropropagation = chain rule appliquée de la sortie vers l'entrée, au coût d'environ une passe avant.
- Gradient d'une couche : \(\delta^\top X\) pour W, somme de \(\delta\) pour b, \(\delta W\) transmis en amont.
- Adam (η = 10⁻³) est le point de départ ; surveiller les courbes, faire le test du petit batch.
- Initialisation : ni zéro (symétrie), ni trop grande ; He pour ReLU.
:::
