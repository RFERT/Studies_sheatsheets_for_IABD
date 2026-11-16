---
title: Réseaux convolutifs (CNN)
subtitle: Exploiter la structure spatiale des images — convolution, pooling, architectures célèbres et transfer learning.
domains: IA
tags: convolution, noyau, padding, stride, pooling, champ récepteur, ResNet, transfer learning, vision par ordinateur
niveau: Intermédiaire
duree: 75 min
objectifs: Calculer la taille de sortie et le nombre de paramètres d'une convolution ; expliquer partage de poids et invariance par translation ; décrire l'évolution LeNet → AlexNet → VGG → ResNet ; mettre en place un transfer learning en PyTorch.
---

::: goal Ce que tu sauras faire à la fin
- Expliquer pourquoi un MLP est inadapté aux images et ce que la convolution apporte.
- Calculer forme de sortie et nombre de paramètres de n'importe quelle couche convolutive.
- Lire une architecture (VGG, ResNet) et réutiliser un modèle pré-entraîné.
:::

## 1. Pourquoi pas un MLP sur des images ?

Une image couleur 224 × 224 contient \(224 \times 224 \times 3 = 150\,528\) valeurs. Une seule couche dense de 1 000 neurones aurait **150 millions de poids**, et surtout elle ignorerait deux propriétés essentielles des images :

- **Localité** : un pixel est surtout lié à ses voisins (un bord, une texture sont des motifs locaux).
- **Invariance par translation** : un chat reste un chat qu'il soit en haut à gauche ou en bas à droite. Un MLP devrait réapprendre le même motif à chaque position.

La **convolution** encode ces deux idées : un petit **noyau** (filtre) de poids, typiquement 3 × 3, glisse sur toute l'image et réutilise **les mêmes poids partout**.

## 2. L'opération de convolution

Pour une image \(I\) et un noyau \(K\) de taille \(k \times k\), la sortie (carte de caractéristiques, *feature map*) vaut :

\[ S(i, j) = \sum_{a=0}^{k-1} \sum_{b=0}^{k-1} K(a, b)\, I(i + a,\ j + b) + b_0 \]

::: info Convolution ou corrélation ?
Mathématiquement, une vraie convolution retourne le noyau. Les bibliothèques de deep learning calculent en fait une **corrélation croisée** (sans retournement). Comme les poids sont appris, la distinction n'a aucune importance pratique.
:::

::: viz convolution La convolution en direct
image: carre
noyau: sobelx
Le noyau de Sobel horizontal réagit fortement aux **bords verticaux** : positif d'un côté du carré, négatif de l'autre, nul dans les zones uniformes. Clique sur une case de la sortie pour voir sa fenêtre dans l'entrée et le calcul. Essaie le noyau « flou », puis active le padding et le stride 2 pour voir la taille de sortie changer.
:::

::: example Calcul d'une case
Fenêtre de l'image \(\begin{pmatrix} 0 & 0 & 1 \\ 0 & 0 & 1 \\ 0 & 0 & 1 \end{pmatrix}\) (un bord vertical), noyau de Sobel \(\begin{pmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{pmatrix}\).
Somme des produits terme à terme : \(1 \times 1 + 2 \times 1 + 1 \times 1 = 4\). Sur une zone uniforme, les poids positifs et négatifs s'annulent : 0.
:::

Dans un CNN, personne ne choisit Sobel : les valeurs des noyaux sont des **paramètres appris** par rétropropagation. On constate a posteriori que les premières couches apprennent d'elles-mêmes des détecteurs de bords et de couleurs.

## 3. Padding, stride et taille de sortie

| Paramètre | Rôle |
|---|---|
| **Padding** \(p\) | ajoute \(p\) pixels (souvent des 0) autour de l'entrée ; `padding=1` avec un noyau 3×3 conserve la taille (« same ») |
| **Stride** \(s\) | pas de déplacement du noyau ; \(s = 2\) divise environ la taille par 2 |
| **Noyau** \(k\) | taille de la fenêtre (3×3 le plus souvent) |

\[ H_{\text{out}} = \left\lfloor \frac{H_{\text{in}} + 2p - k}{s} \right\rfloor + 1 \]

::: example Applications de la formule
- Entrée 32×32, \(k = 3\), \(p = 1\), \(s = 1\) : \((32 + 2 - 3)/1 + 1 = 32\) → taille conservée.
- Entrée 32×32, \(k = 3\), \(p = 1\), \(s = 2\) : \(\lfloor 31/2 \rfloor + 1 = 16\).
- Entrée 28×28, \(k = 5\), \(p = 0\), \(s = 1\) : \(28 - 5 + 1 = 24\).
:::

## 4. Canaux et nombre de paramètres

Une image couleur a \(C_{\text{in}} = 3\) canaux (R, V, B). Un filtre a donc la forme \(C_{\text{in}} \times k \times k\) : il regarde **tous les canaux à la fois**. Une couche avec \(C_{\text{out}}\) filtres produit \(C_{\text{out}}\) cartes.

\[ \text{paramètres} = C_{\text{out}} \times (C_{\text{in}} \times k \times k + 1) \]

::: example Comparaison avec une couche dense
`nn.Conv2d(3, 64, kernel_size=3, padding=1)` sur une image 224×224 : \(64 \times (3 \times 9 + 1) = 1\,792\) paramètres, indépendamment de la taille de l'image. Une couche dense produisant une sortie de même taille (64 × 224 × 224 ≈ 3,2 millions de valeurs) à partir des 150 528 entrées en aurait près de \(5 \times 10^{11}\). Le **partage de poids** change tout.
:::

```python
import torch, torch.nn as nn
conv = nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, stride=1, padding=1)
x = torch.randn(8, 3, 224, 224)          # (B, C, H, W)
print(conv(x).shape)                     # torch.Size([8, 64, 224, 224])
print(sum(p.numel() for p in conv.parameters()))   # 1792
```

::: quiz Quiz 5.1 — Paramètres
Combien de paramètres a `nn.Conv2d(64, 128, kernel_size=3)` ?
- [ ] 1 152
- [x] 73 856
- [ ] 73 728
> Chaque filtre a 64 × 3 × 3 = 576 poids plus 1 biais ; il y a 128 filtres : 128 × 577 = 73 856. La réponse 73 728 oublie les biais ; 1 152 oublie les canaux d'entrée.
:::

## 5. Pooling et champ récepteur

Le **max pooling** 2×2 de stride 2 garde le maximum de chaque bloc 2×2 : il divise la hauteur et la largeur par 2, n'a **aucun paramètre**, et rend la représentation un peu tolérante aux petits décalages.

```text
1 3 | 2 0
5 2 | 1 4        max pool 2×2       5 4
----+----       ───────────────►    7 9
0 7 | 9 1
2 1 | 3 3
```

Le **champ récepteur** d'un neurone est la zone de l'image d'entrée qui influence sa valeur. Il grandit avec la profondeur : deux convolutions 3×3 empilées voient une zone 5×5, trois voient 7×7. C'est ainsi que les couches profondes « voient » des objets entiers alors que chaque noyau reste petit.

::: tip Pourquoi des noyaux 3×3 ?
Deux 3×3 empilés ont le même champ récepteur qu'un 5×5 avec moins de paramètres (\(2 \times 9 = 18\) contre 25 par paire de canaux) et une non-linéarité de plus. C'est l'idée clé de VGG.
:::

## 6. Architecture type d'un CNN

```text
image (3×32×32)
 → [Conv 3×3, 32] → ReLU → [Conv 3×3, 32] → ReLU → MaxPool   → 32×16×16
 → [Conv 3×3, 64] → ReLU → [Conv 3×3, 64] → ReLU → MaxPool   → 64×8×8
 → Flatten (4096) → Linear 256 → ReLU → Dropout → Linear 10 (logits)
```

On diminue la résolution spatiale et on **augmente le nombre de canaux** : moins de « où », plus de « quoi ».

```python
class PetitCNN(nn.Module):
    def __init__(self, n_classes=10):
        super().__init__()
        def bloc(c_in, c_out):
            return nn.Sequential(
                nn.Conv2d(c_in, c_out, 3, padding=1), nn.BatchNorm2d(c_out), nn.ReLU(),
                nn.Conv2d(c_out, c_out, 3, padding=1), nn.BatchNorm2d(c_out), nn.ReLU(),
                nn.MaxPool2d(2))
        self.features = nn.Sequential(bloc(3, 32), bloc(32, 64))
        self.head = nn.Sequential(nn.Flatten(), nn.Linear(64 * 8 * 8, 256), nn.ReLU(),
                                  nn.Dropout(0.3), nn.Linear(256, n_classes))
    def forward(self, x):
        return self.head(self.features(x))
```

## 7. Les architectures qui ont marqué l'histoire

| Année | Modèle | Apport principal |
|---|---|---|
| 1998 | **LeNet-5** (LeCun) | conv + pooling pour lire des chèques (chiffres manuscrits) |
| 2012 | **AlexNet** | ReLU, dropout, GPU : erreur top-5 ImageNet ≈ 16 % contre ≈ 26 % |
| 2014 | **VGG** | uniquement des 3×3, profondeur 16–19 couches |
| 2014 | **GoogLeNet / Inception** | branches parallèles de tailles différentes |
| 2015 | **ResNet** | connexions résiduelles : 152 couches entraînables |
| 2019 | **EfficientNet** | mise à l'échelle conjointe profondeur / largeur / résolution |
| 2020 | **Vision Transformer (ViT)** | l'attention remplace la convolution (module 7) |

### Les connexions résiduelles

Empiler naïvement des couches finit par **dégrader** la précision d'entraînement (pas seulement de test) : l'optimisation devient trop difficile. ResNet fait apprendre à chaque bloc une **correction** \(F(x)\) ajoutée à son entrée :

\[ y = F(x) + x \]

Si une couche est inutile, il lui suffit d'apprendre \(F = 0\) pour devenir l'identité. Et le gradient dispose d'un « raccourci » direct vers les premières couches (la dérivée de \(x\) par rapport à \(x\) vaut 1) : fini le gradient évanescent dans les réseaux très profonds. Les Transformers réutilisent exactement cette idée.

## 8. Transfer learning

Entraîner un ResNet sur ImageNet demande 1,2 million d'images et des jours de GPU. Mais ses premières couches (bords, textures, formes) sont utiles pour **presque toutes** les images. On réutilise donc un modèle **pré-entraîné** :

1. **Extraction de features** : on gèle tout le réseau et on n'entraîne qu'une nouvelle tête de classification (peu de données, quelques centaines d'images).
2. **Fine-tuning** : on dégèle aussi les dernières couches (ou tout) avec un learning rate petit (plus de données).

```python
from torchvision import models
weights = models.ResNet18_Weights.DEFAULT
model = models.resnet18(weights=weights)
for p in model.parameters():
    p.requires_grad = False                      # geler le corps pré-entraîné
model.fc = nn.Linear(model.fc.in_features, 5)    # nouvelle tête : 5 classes (entraînable)
optimizer = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)
preprocess = weights.transforms()                # la normalisation attendue par le modèle
```

::: warn Utiliser le prétraitement du modèle pré-entraîné
Un modèle ImageNet attend des images normalisées avec **ses** moyennes et écarts-types (et une taille donnée). Lui fournir des images normalisées autrement dégrade fortement les performances. `weights.transforms()` donne le bon prétraitement.
:::

::: quiz Quiz 5.2 — Transfer learning
Tu disposes de 400 photos réparties en 4 classes de pièces industrielles. Quelle stratégie choisir d'abord ?
- [ ] Entraîner un ResNet-50 à partir de zéro
- [x] Partir d'un modèle pré-entraîné, geler le corps et entraîner seulement une nouvelle tête, avec augmentation de données
- [ ] Un MLP sur les pixels aplatis
> Avec 400 images, un réseau entraîné de zéro sur-apprendra massivement. Les features génériques d'un modèle pré-entraîné sont un excellent point de départ ; on n'entraîne que quelques milliers de paramètres. On pourra ensuite dégeler les dernières couches si la validation le permet.
:::

::: exo Exercice 1 — Dimensions d'un réseau
Une image 3×64×64 traverse : Conv(3→16, k=3, p=1) → MaxPool 2 → Conv(16→32, k=3, p=0) → MaxPool 2 → Flatten → Linear(?, 10).
1. Donne la forme après chaque couche.
2. Quelle est la taille d'entrée de la couche linéaire ?
3. Combien de paramètres ont les deux convolutions ?
?? Voir la solution
1. Conv1 (p=1) : 16×64×64 → MaxPool : 16×32×32 → Conv2 (p=0) : \(32 - 3 + 1 = 30\), donc 32×30×30 → MaxPool : 32×15×15.
2. Flatten : \(32 \times 15 \times 15 = 7\,200\), donc `Linear(7200, 10)`.
3. Conv1 : \(16 \times (3 \times 9 + 1) = 448\). Conv2 : \(32 \times (16 \times 9 + 1) = 4\,640\). La couche linéaire, elle, en a \(7\,200 \times 10 + 10 = 72\,010\) : comme souvent, la tête dense pèse plus lourd que les convolutions — d'où l'usage d'un *global average pooling* dans les architectures modernes.
:::

::: exo Exercice 2 — Champ récepteur
Quel est le champ récepteur d'un neurone après trois convolutions 3×3 de stride 1 ? Et après Conv 3×3 → MaxPool 2×2 (stride 2) → Conv 3×3 ?
?? Voir la solution
Avec stride 1, chaque convolution 3×3 ajoute 2 pixels : \(3 \to 5 \to 7\), soit **7×7**. Dans le second cas : la première conv voit 3×3 ; le pooling 2×2 porte le champ à 4×4 et double l'écart entre pixels voisins (le « pas » effectif devient 2) ; la conv suivante ajoute \(2 \times 2 = 4\) pixels : **8×8**. Le sous-échantillonnage fait grandir le champ récepteur beaucoup plus vite.
:::

::: culture Culture & histoire
- **1959–1962** — David Hubel et Torsten Wiesel découvrent dans le cortex visuel du chat des neurones sensibles aux **bords orientés** et organisés en hiérarchie (prix Nobel 1981). Inspiration directe des CNN.
- **1980** — Kunihiko Fukushima propose le **Néocognitron**, premier réseau hiérarchique de type convolutif.
- **1989–1998** — Yann LeCun (Bell Labs) entraîne des CNN par rétropropagation ; **LeNet-5** lit une part importante des chèques aux États-Unis à la fin des années 1990.
- **2009** — Fei-Fei Li et son équipe publient **ImageNet** (plus de 14 millions d'images annotées) ; le défi ILSVRC débute en 2010.
- **2012** — AlexNet gagne ILSVRC ; **2015** — ResNet (Kaiming He et al.) dépasse le niveau humain estimé sur ce benchmark.
- [CS231n — Convolutional Networks](https://cs231n.github.io/convolutional-networks/)
- [Distill — Feature Visualization](https://distill.pub/2017/feature-visualization/)
- [torchvision — modèles pré-entraînés](https://pytorch.org/vision/stable/models.html)
:::

## Synthèse

::: note À retenir
- Convolution = petit noyau aux **poids partagés** qui glisse sur l'image : localité + invariance par translation.
- Taille de sortie : \(\lfloor (H + 2p - k)/s \rfloor + 1\) ; paramètres : \(C_{out}(C_{in}k^2 + 1)\).
- Pooling : sous-échantillonne, sans paramètre ; le champ récepteur grandit avec la profondeur.
- Schéma type : résolution ↓, canaux ↑, puis tête de classification.
- ResNet : \(y = F(x) + x\) rend les réseaux très profonds entraînables.
- Peu de données ? **Transfer learning** avec le prétraitement du modèle d'origine.
:::
