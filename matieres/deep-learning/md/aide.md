---
title: Antisèche Deep Learning
subtitle: Neurones, entraînement, régularisation, PyTorch, CNN, RNN et Transformers — formules, dimensions et réflexes.
domains: IA
tags: MLP, rétropropagation, Adam, dropout, BatchNorm, PyTorch, CNN, LSTM, attention, Transformer
niveau: Révision express
---

Mémo des 7 modules du cours Deep Learning. Détail, exercices et visualisations → [cours Deep Learning](cours.html?c=DL).

## Neurone & couche

\[ a = \varphi(w^\top x + b) \qquad A = \varphi(XW^\top + b) \]

- \(W\) de forme (sorties, entrées) ; paramètres d'une couche dense : \(n_{in} \times n_{out} + n_{out}\).
- Sans activation non linéaire, empiler des couches = **une seule** couche linéaire.
- Un neurone sigmoïde = une régression logistique ; XOR exige une couche cachée.

## Activations

| Couche | Choix |
|---|---|
| cachées | **ReLU** (GELU dans les Transformers) |
| sortie binaire | sigmoïde (ou 1 logit + `BCEWithLogitsLoss`) |
| sortie K classes | softmax (ou K logits + `CrossEntropyLoss`) |
| sortie régression | **aucune** (linéaire) |

- σ′ ≤ 0,25 → gradient évanescent en cascade ; ReLU : dérivée 1 si x > 0, 0 sinon (neurones morts).

## Pertes

| Tâche | Perte PyTorch | Le modèle renvoie |
|---|---|---|
| régression | `MSELoss`, `HuberLoss` | valeur réelle |
| binaire | `BCEWithLogitsLoss` | 1 logit |
| multi-classe | `CrossEntropyLoss` | K logits (cibles `long`) |
| multi-label | `BCEWithLogitsLoss` | K logits |

- Entropie croisée : \(\ell = -\log p_{\text{vraie classe}}\) ; gradient par rapport aux logits : \(p - y\).
- Perte bloquée à \(\log K\) = prédiction uniforme = rien n'est appris.

## Rétropropagation

- Chain rule de la sortie vers l'entrée ; coût ≈ 2–3 passes avant.
- Couche \(Z = XW^\top + b\), \(\delta = \partial\mathcal L/\partial Z\) : \(\nabla_W = \delta^\top X\), \(\nabla_b = \sum \delta\), transmis : \(\delta W\).
- À travers ReLU : multiplier par \(\mathbb 1[z > 0]\).
- Vérification : gradient numérique \(\frac{f(\theta+\varepsilon) - f(\theta-\varepsilon)}{2\varepsilon}\).

## Optimisation

| Optimiseur | Départ conseillé |
|---|---|
| Adam / **AdamW** | η = 10⁻³ (ou 3·10⁻⁴), weight decay 0,01 |
| SGD + momentum | η = 0,01–0,1, β = 0,9, + scheduler |

- Époque = \(\lceil N/B \rceil\) itérations. Warmup + décroissance (cosinus) pour les Transformers.
- `nan` → η ÷ 10, normaliser les entrées, gradient clipping.
- Initialisation : He (ReLU), Xavier (tanh) ; jamais tout à zéro (symétrie).

## Régularisation

| Technique | Où / quand |
|---|---|
| Weight decay (AdamW) | toujours, λ ≈ 0,01–0,1 |
| Dropout p = 0,1–0,5 | couches denses ; inactif en eval |
| Early stopping | garder la meilleure époque de validation |
| Augmentation | **train seulement**, préserve l'étiquette |
| BatchNorm / LayerNorm | CNN / Transformers & RNN |

::: warn
`model.train()` pour entraîner ; `model.eval()` + `torch.no_grad()` pour évaluer (dropout, BatchNorm).
:::

## Boucle PyTorch

```python
model.train()
for X, y in train_loader:
    X, y = X.to(device), y.to(device)
    logits = model(X)
    loss = criterion(logits, y)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
```

- `.item()` pour journaliser ; `nn.ModuleList` (pas de liste Python) ; sauvegarder `state_dict()`.
- Test du petit batch : le modèle doit pouvoir le mémoriser.

## CNN

\[ H_{out} = \left\lfloor \frac{H_{in} + 2p - k}{s} \right\rfloor + 1 \qquad \text{params} = C_{out}(C_{in}k^2 + 1) \]

- Poids partagés + localité ; `padding=1` avec 3×3 conserve la taille ; MaxPool 2 divise par 2.
- Résolution ↓, canaux ↑ ; deux 3×3 = champ récepteur 5×5.
- ResNet : \(y = F(x) + x\). Peu de données → **transfer learning** + `weights.transforms()`.

## RNN, LSTM, GRU

\[ h_t = \tanh(W_x x_t + W_h h_{t-1} + b) \]

- Poids partagés dans le temps ; BPTT ; gradient évanescent / explosif (clipping).
- LSTM : portes oubli / entrée / sortie, \(c_t = f_t \odot c_{t-1} + i_t \odot \tilde c_t\) (mise à jour additive).
- `batch_first=True` → `(B, T, D)` ; texte → tokens → `nn.Embedding`.
- Séries temporelles : split **chronologique** + baseline naïve.

## Transformers

\[ \text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V \]

- Matrice T × T → coût **quadratique** en la longueur du contexte.
- Multi-head ; encodage positionnel (sinus, appris, RoPE) ; bloc = attention + FFN, résiduels + LayerNorm.
- BERT = encodeur (MLM) ; GPT = décodeur **causal** (token suivant) ; T5 = encodeur-décodeur.
- LLM : pré-entraînement → fine-tuning (LoRA) → alignement (RLHF/DPO). Hallucinations → RAG + vérification.

## Trous à réviser

- Sans activation non linéaire, un réseau profond reste ==linéaire==.
- `CrossEntropyLoss` attend des ==logits bruts== et des cibles de type ==long==.
- Les gradients s'==accumulent== dans `.grad` : d'où `zero_grad()`.
- `Conv2d(64, 128, 3)` a ==73 856== paramètres.
- Le dropout est ==désactivé== en mode eval.
- Dans l'attention, on divise les scores par ==√d_k== pour éviter la saturation de la softmax.

::: quiz Auto-test — sortie
Pour classer des images en 10 classes avec `nn.CrossEntropyLoss`, que renvoie le modèle ?
- [ ] 10 probabilités après softmax
- [x] 10 logits bruts
- [ ] l'indice de la classe prédite
> La perte applique log-softmax elle-même, de façon stable. Une softmax en plus écrase les gradients ; l'argmax n'est pas dérivable.
:::

::: quiz Auto-test — CNN
Entrée 3×32×32, `Conv2d(3, 16, 3, stride=2, padding=1)`. Forme de sortie ?
- [ ] 16×32×32
- [x] 16×16×16
- [ ] 16×15×15
> (32 + 2 − 3) / 2 = 15,5, partie entière 15, + 1 = 16. Le padding 1 compense le noyau, le stride 2 divise la taille par deux.
:::

::: culture Pour aller plus loin
- [Dive into Deep Learning](https://d2l.ai/)
- [Tutoriels PyTorch](https://pytorch.org/tutorials/)
- [CS231n (Stanford)](https://cs231n.github.io/)
- [Cours NLP Hugging Face (FR)](https://huggingface.co/learn/nlp-course/fr/chapter1/1)
:::
