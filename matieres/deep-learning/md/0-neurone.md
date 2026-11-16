---
title: Du neurone au perceptron multicouche
subtitle: Comprendre ce que calcule un réseau de neurones, couche par couche, avant de l'entraîner.
domains: IA
tags: neurone formel, perceptron, activation, ReLU, sigmoïde, MLP, XOR, forward pass, approximation universelle
niveau: Intermédiaire
duree: 60 min
objectifs: Calculer la sortie d'un neurone et d'un petit réseau à la main ; expliquer pourquoi une activation non linéaire est indispensable ; choisir une activation selon la couche ; écrire la passe avant d'un MLP en NumPy.
---

::: goal Ce que tu sauras faire à la fin
- Écrire la formule d'un neurone et la vectoriser pour une couche entière.
- Expliquer pourquoi un perceptron seul ne peut pas apprendre XOR, et comment une couche cachée résout le problème.
- Choisir une activation (ReLU, sigmoïde, softmax…) **en fonction du rôle de la couche**.
- Compter les paramètres d'un réseau et lire les dimensions de chaque tenseur.
:::

## 1. Pourquoi des réseaux de neurones ?

Les modèles du cours de Machine Learning (régression logistique, arbres, forêts) fonctionnent très bien sur des **données tabulaires** dont les features ont déjà un sens (âge, prix, surface). Ils peinent dès que l'information utile est **cachée dans une structure brute** : les pixels d'une image, les mots d'une phrase, les échantillons d'un signal audio.

Exemple : pour reconnaître un chat, aucun pixel isolé n'est informatif. Ce qui compte, ce sont des **motifs** (bords, textures, oreilles) construits à partir de milliers de pixels. Pendant des décennies, on a fabriqué ces features à la main (*feature engineering* : filtres de Gabor, SIFT…). Le **deep learning** apprend ces représentations **automatiquement**, couche après couche :

| Couche | Ce qu'elle apprend (vision) |
|---|---|
| 1re | bords, contrastes, couleurs |
| intermédiaires | textures, coins, motifs |
| profondes | parties d'objets (œil, roue) |
| sortie | classes (chat, voiture…) |

::: def Deep learning
Famille de méthodes d'apprentissage qui utilisent des **réseaux de neurones à plusieurs couches** pour apprendre directement, à partir de données brutes, une hiérarchie de représentations de plus en plus abstraites. « Profond » = beaucoup de couches.
:::

::: why Pourquoi maintenant ?
Les idées datent des années 1950–1980. L'explosion des années 2010 vient de trois facteurs réunis : des **données massives** (ImageNet, le web), des **GPU** capables de multiplier des matrices en parallèle, et des **astuces d'entraînement** (ReLU, initialisation, dropout, batch norm, Adam).
:::

## 2. Le neurone formel

Un neurone artificiel reçoit un vecteur d'entrées \(x = (x_1, \dots, x_n)\), calcule une **somme pondérée** puis applique une **fonction d'activation** \(\varphi\) :

\[ z = \sum_{i=1}^{n} w_i x_i + b = w^\top x + b \qquad\qquad a = \varphi(z) \]

| Symbole | Nom | Rôle |
|---|---|---|
| \(w\) | poids | importance de chaque entrée (appris) |
| \(b\) | biais | décale le seuil d'activation (appris) |
| \(z\) | pré-activation | combinaison linéaire |
| \(\varphi\) | activation | introduit la non-linéarité |
| \(a\) | activation (sortie) | ce que le neurone transmet |

::: example Un neurone à la main
Entrées \(x = (2, -1)\), poids \(w = (0{,}5;\ 1)\), biais \(b = 0{,}5\), activation ReLU.
\(z = 0{,}5 \times 2 + 1 \times (-1) + 0{,}5 = 0{,}5\) puis \(a = \max(0;\ 0{,}5) = 0{,}5\).
Avec \(b = -1\) : \(z = -1\), donc \(a = 0\) — le neurone est « éteint ».
:::

::: tip Lien avec le cours de ML
Un neurone avec activation **sigmoïde** est exactement une **régression logistique** : \(P(y=1 \mid x) = \sigma(w^\top x + b)\). Un réseau de neurones, c'est donc d'abord un empilement de « régressions logistiques » dont les sorties nourrissent les suivantes.
:::

## 3. Le perceptron et la limite de XOR

Le **perceptron** de Rosenblatt (1958) est un neurone avec une activation en **marche** : il sort 1 si \(z \ge 0\), sinon 0. Sa frontière de décision \(w^\top x + b = 0\) est une **droite** (un hyperplan en dimension \(n\)). Il ne peut donc séparer que des classes **linéairement séparables**.

| \(x_1\) | \(x_2\) | ET | OU | XOR |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 |

- **ET** : \(w = (1, 1)\), \(b = -1{,}5\) convient (seul (1, 1) donne \(z \ge 0\)).
- **OU** : \(w = (1, 1)\), \(b = -0{,}5\).
- **XOR** : impossible. Les points (0, 1) et (1, 0) doivent être d'un côté, (0, 0) et (1, 1) de l'autre — aucune droite ne fait cela.

::: example Résoudre XOR avec une couche cachée
\(h_1 = \text{marche}(x_1 + x_2 - 0{,}5)\) calcule **OU** ; \(h_2 = \text{marche}(x_1 + x_2 - 1{,}5)\) calcule **ET**.
Sortie : \(y = \text{marche}(h_1 - h_2 - 0{,}5)\) = « OU mais pas ET » = **XOR**.
Vérification pour (1, 1) : \(h_1 = 1\), \(h_2 = 1\), \(y = \text{marche}(-0{,}5) = 0\). ✓
:::

La couche cachée a **transformé l'espace** : dans le plan \((h_1, h_2)\), les quatre points deviennent linéairement séparables. C'est l'idée centrale du deep learning : chaque couche re-représente les données pour que la suivante ait un problème plus simple.

::: quiz Quiz 1.1 — Linéarité
Pourquoi un perceptron seul ne peut-il pas apprendre XOR ?
- [ ] Parce qu'il n'a pas assez de poids
- [x] Parce que sa frontière de décision est une droite et que XOR n'est pas linéairement séparable
- [ ] Parce que la fonction marche n'est pas dérivable
> Un neurone découpe le plan avec une droite. Ajouter des poids sur les mêmes entrées ne change pas la nature de la frontière. La non-dérivabilité de la marche gêne l'entraînement par gradient, mais ce n'est pas la raison de l'impossibilité : même avec une sigmoïde, un neurone seul échoue sur XOR.
:::

## 4. Les fonctions d'activation

Sans activation non linéaire, empiler des couches ne sert à rien : \(W_2(W_1 x + b_1) + b_2 = (W_2 W_1)x + (W_2 b_1 + b_2)\) est **encore une seule couche linéaire**. Le réseau entier ne pourrait représenter que des frontières droites.

::: viz activation Les activations et leurs dérivées
fonction: relu
x: 1
Compare la courbe (bleu) et sa dérivée (orange pointillé). La dérivée compte autant que la fonction : c'est elle qui transporte le signal d'erreur pendant l'entraînement. Repère pour la sigmoïde le maximum de 0,25 de la dérivée, et pour ReLU la zone x < 0 où la dérivée est nulle.
:::

| Activation | Formule | Sortie | Usage typique | Défaut principal |
|---|---|---|---|---|
| Sigmoïde | \(\frac{1}{1+e^{-z}}\) | ]0, 1[ | **sortie** binaire | sature → gradient évanescent |
| Tanh | \(\frac{e^{z}-e^{-z}}{e^{z}+e^{-z}}\) | ]−1, 1[ | couches cachées (RNN) | sature aussi |
| ReLU | \(\max(0, z)\) | [0, +∞[ | **couches cachées** par défaut | neurones morts si z < 0 |
| Leaky ReLU | \(\max(\alpha z, z)\) | ℝ | variante de ReLU | hyperparamètre α |
| GELU | \(z\,\Phi(z)\) | ≈ [−0,17 ; +∞[ | Transformers | plus coûteuse |
| Softmax | \(\frac{e^{z_k}}{\sum_j e^{z_j}}\) | probabilités (somme 1) | **sortie** multi-classe | — |

::: warn Choisir l'activation selon la couche
- **Couches cachées** : ReLU (ou GELU dans un Transformer). Pas de sigmoïde en cascade.
- **Sortie** : dépend de la tâche — sigmoïde (binaire), softmax (une classe parmi K), **aucune** (régression, sortie réelle quelconque).
- Mettre une ReLU en sortie d'une régression qui doit prédire des valeurs négatives est une erreur classique.
:::

## 5. Le perceptron multicouche (MLP)

Un **MLP** (*multilayer perceptron*, ou réseau *dense / fully connected*) empile des couches où chaque neurone est connecté à tous les neurones de la couche précédente. Pour une couche \(\ell\) :

\[ z^{(\ell)} = W^{(\ell)} a^{(\ell-1)} + b^{(\ell)} \qquad a^{(\ell)} = \varphi\big(z^{(\ell)}\big) \]

avec \(a^{(0)} = x\). Si la couche \(\ell - 1\) a \(n\) neurones et la couche \(\ell\) en a \(m\) : \(W^{(\ell)}\) est de taille \(m \times n\), \(b^{(\ell)}\) de taille \(m\).

```text
entrée (4)      cachée (5)       sortie (3)
  x1 ─┐      ┌─ h1 ─┐
  x2 ─┼──W1──┼─ h2 ─┼──W2── softmax → P(classe 1..3)
  x3 ─┤ 5×4  ├─ h3 ─┤ 3×5
  x4 ─┘      ├─ h4 ─┤
             └─ h5 ─┘
paramètres : (5×4 + 5) + (3×5 + 3) = 25 + 18 = 43
```

::: tip Compter les paramètres
Une couche dense de \(n\) entrées vers \(m\) sorties a \(n \times m + m\) paramètres. Un MLP 784 → 128 → 10 (MNIST) en a \(784 \times 128 + 128 + 128 \times 10 + 10 = 101\,770\).
:::

### La passe avant en NumPy

En pratique on traite un **mini-batch** de \(B\) exemples à la fois : \(X\) est de forme \((B, n)\) et on écrit \(XW^\top + b\) (convention des bibliothèques : une ligne par exemple).

```python
import numpy as np

rng = np.random.default_rng(0)
B, n_in, n_hid, n_out = 32, 4, 5, 3

X  = rng.normal(size=(B, n_in))                                # (32, 4)
W1 = rng.normal(scale=np.sqrt(2 / n_in), size=(n_hid, n_in))   # init de He
b1 = np.zeros(n_hid)
W2 = rng.normal(scale=np.sqrt(1 / n_hid), size=(n_out, n_hid))
b2 = np.zeros(n_out)

def relu(z):
    return np.maximum(0, z)

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)    # stabilité numérique : évite exp(1000)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

H = relu(X @ W1.T + b1)        # (32, 5)  broadcasting de b1 sur les lignes
P = softmax(H @ W2.T + b2)     # (32, 3)  chaque ligne somme à 1
print(P.shape, P[0].round(3), P[0].sum())
```

::: warn Stabilité de la softmax
Soustraire le maximum de chaque ligne ne change pas le résultat (le facteur commun se simplifie) mais évite le dépassement de capacité de `exp`. Les bibliothèques le font pour toi : c'est une des raisons de passer les **logits** bruts à `CrossEntropyLoss` plutôt que des probabilités.
:::

::: quiz Quiz 1.2 — Dimensions
Une couche dense reçoit un batch de forme (64, 300) et produit 100 sorties. Quelle est la forme de la matrice de poids (convention `X @ W.T`) et combien de paramètres a la couche ?
- [ ] (300, 100) et 30 000 paramètres
- [x] (100, 300) et 30 100 paramètres
- [ ] (64, 100) et 6 400 paramètres
> Avec X @ W.T, W a la forme (sorties, entrées) = (100, 300). Paramètres : 100 × 300 poids + 100 biais = 30 100. La taille du batch (64) n'intervient jamais dans le nombre de paramètres : les mêmes poids servent pour tous les exemples.
:::

## 6. Ce qu'un réseau peut représenter

::: theorem Théorème d'approximation universelle (Cybenko 1989, Hornik 1991)
Un réseau à **une seule couche cachée**, avec assez de neurones et une activation non linéaire adaptée, peut approcher **n'importe quelle fonction continue** sur un domaine borné, avec la précision voulue.
:::

Ce théorème rassure (les MLP sont expressifs) mais il **ne dit pas** : combien de neurones il faut (parfois exponentiellement trop), ni comment trouver les bons poids, ni si le réseau **généralisera**. En pratique, des réseaux **profonds** représentent les mêmes fonctions avec beaucoup moins de paramètres que des réseaux larges et peu profonds, car ils réutilisent les motifs appris (composition).

::: quiz Quiz 1.3 — Activation de sortie
Tu prédis le prix d'un appartement (un nombre réel positif, parfois très grand). Quelle couche de sortie ?
- [ ] Softmax sur 1 neurone
- [ ] Sigmoïde sur 1 neurone
- [x] Un neurone sans activation (linéaire), éventuellement en prédisant le log du prix
> Une sigmoïde bornerait la sortie dans ]0, 1[ et une softmax sur un seul neurone vaut toujours 1. Pour une régression, on laisse la sortie linéaire ; prédire log(prix) stabilise l'apprentissage quand les valeurs couvrent plusieurs ordres de grandeur.
:::

::: exo Exercice 1 — Passe avant à la main
Un réseau 2 → 2 → 1 utilise ReLU en couche cachée et une sigmoïde en sortie.
\(W_1 = \begin{pmatrix} 1 & -1 \\ 2 & 1 \end{pmatrix}\), \(b_1 = (0, -1)\), \(W_2 = (1,\ -2)\), \(b_2 = 0{,}5\). Entrée \(x = (1, 2)\).
1. Calcule \(z^{(1)}\), puis \(h = \text{ReLU}(z^{(1)})\).
2. Calcule \(z^{(2)}\) et la probabilité de sortie \(\sigma(z^{(2)})\).
3. Combien ce réseau a-t-il de paramètres ?
?? Voir la solution
1. \(z^{(1)} = W_1 x + b_1 = (1 \cdot 1 - 1 \cdot 2 + 0,\ 2 \cdot 1 + 1 \cdot 2 - 1) = (-1,\ 3)\). Donc \(h = (0, 3)\) : le premier neurone est éteint.
2. \(z^{(2)} = 1 \cdot 0 - 2 \cdot 3 + 0{,}5 = -5{,}5\), et \(\sigma(-5{,}5) = 1 / (1 + e^{5{,}5}) \approx 0{,}004\) : le réseau prédit la classe 0 avec une grande confiance.
3. \(2 \times 2 + 2 = 6\) pour la couche cachée, \(2 \times 1 + 1 = 3\) pour la sortie : **9 paramètres**.
:::

::: exo Exercice 2 — La profondeur sans non-linéarité ne sert à rien
Montre que deux couches linéaires \(y = W_2(W_1 x + b_1) + b_2\) équivalent à une seule couche \(y = Wx + b\). Donne \(W\) et \(b\). Que se passe-t-il si on insère une ReLU entre les deux ?
?? Voir la solution
En développant : \(y = W_2 W_1 x + W_2 b_1 + b_2\). Donc \(W = W_2 W_1\) et \(b = W_2 b_1 + b_2\) : la profondeur n'a rien ajouté. Avec une ReLU, \(y = W_2\,\text{ReLU}(W_1 x + b_1) + b_2\) n'est plus linéaire : la ReLU « plie » l'espace selon les hyperplans \(W_1 x + b_1 = 0\), et la sortie devient une fonction **affine par morceaux** — capable de représenter XOR, des frontières courbes, etc.
:::

## 7. Erreurs fréquentes

| Erreur | Conséquence | Correction |
|---|---|---|
| Aucune activation entre les couches | le réseau reste linéaire | ReLU entre les couches cachées |
| Sigmoïde dans toutes les couches cachées | gradient évanescent, apprentissage très lent | ReLU / GELU |
| Softmax **et** `CrossEntropyLoss` en PyTorch | softmax appliquée deux fois, gradients faibles | passer les **logits** bruts |
| Features non standardisées | certaines entrées dominent, entraînement instable | `StandardScaler` (ajusté sur le train) |
| Confondre taille du batch et nombre de paramètres | mauvais dimensionnement | les poids ne dépendent que des tailles de couches |

::: culture Culture & histoire
- **1943** — Warren McCulloch et Walter Pitts proposent le **neurone formel**, un modèle logique du neurone biologique.
- **1958** — Frank Rosenblatt présente le **Perceptron**, qui apprend à classer des formes simples.
- **1969** — Marvin Minsky et Seymour Papert publient *Perceptrons* et formalisent les limites d'un perceptron seul (XOR) : l'intérêt pour les réseaux de neurones s'effondre pour plus d'une décennie.
- **1986** — David Rumelhart, Geoffrey Hinton et Ronald Williams popularisent la **rétropropagation**, qui permet d'entraîner des réseaux multicouches.
- **2012** — AlexNet (Krizhevsky, Sutskever, Hinton) écrase la compétition ImageNet grâce aux GPU : début de la vague deep learning.
- **2018** — Yoshua Bengio, Geoffrey Hinton et Yann LeCun reçoivent le **prix Turing** ; en **2024**, John Hopfield et Geoffrey Hinton reçoivent le **prix Nobel de physique** pour leurs travaux fondateurs sur les réseaux de neurones.
- [Deep Learning — Goodfellow, Bengio, Courville (livre en ligne)](https://www.deeplearningbook.org/)
- [3Blue1Brown — Neural networks (vidéos)](https://www.3blue1brown.com/topics/neural-networks)
- [TensorFlow Playground : jouer avec un MLP](https://playground.tensorflow.org/)
:::

## Synthèse

::: note À retenir
- Neurone : \(a = \varphi(w^\top x + b)\). Couche : \(a = \varphi(Wx + b)\), avec \(W\) de forme (sorties, entrées).
- Sans **non-linéarité**, un réseau profond reste une fonction linéaire.
- Une couche cachée **re-représente** les données : XOR devient séparable.
- ReLU dans les couches cachées ; sigmoïde / softmax / linéaire en **sortie** selon la tâche.
- Paramètres d'une couche dense : \(n \times m + m\).
- Approximation universelle : expressivité garantie, mais ni la taille, ni l'apprentissage, ni la généralisation.
:::
