---
title: Attention et Transformers
subtitle: Le mécanisme d'attention, l'architecture Transformer et les grands modèles de langage qui en découlent (BERT, GPT).
domains: IA
tags: attention, self-attention, Q K V, multi-head, encodage positionnel, Transformer, BERT, GPT, LLM, fine-tuning
niveau: Avancé
duree: 90 min
objectifs: Calculer une self-attention sur un petit exemple ; expliquer chaque bloc d'un Transformer ; distinguer encodeur (BERT) et décodeur (GPT) ; comprendre pré-entraînement, fine-tuning et limites des LLM ; utiliser un modèle pré-entraîné avec Hugging Face.
---

::: goal Ce que tu sauras faire à la fin
- Écrire et interpréter la formule \(\text{softmax}(QK^\top/\sqrt{d_k})V\).
- Dessiner un bloc Transformer et justifier chaque composant (multi-head, résiduel, LayerNorm, FFN, positions).
- Expliquer comment un GPT génère du texte, et pourquoi il peut « halluciner ».
:::

## 1. L'idée de l'attention

Dans « L'animal n'a pas traversé la rue car **il** était trop fatigué », comprendre « il » demande de le relier à « animal », 7 mots plus tôt. Un RNN doit transporter cette information de proche en proche. L'**attention** permet à chaque mot de **regarder directement tous les autres** et de pondérer ceux qui comptent.

Analogie de la recherche d'information :

| Rôle | Question posée | Exemple |
|---|---|---|
| **Query** \(q\) | « qu'est-ce que je cherche ? » | « il » cherche son référent |
| **Key** \(k\) | « qu'est-ce que je contiens ? » | « animal » : nom, masculin, être vivant |
| **Value** \(v\) | « que transmets-je si l'on me choisit ? » | le contenu sémantique d'« animal » |

Chaque token produit les trois vecteurs par des projections apprises : \(q = W_Q x\), \(k = W_K x\), \(v = W_V x\). Le score entre deux tokens est le **produit scalaire** \(q \cdot k\) (similarité, comme en algèbre linéaire), transformé en poids par une softmax.

## 2. Scaled dot-product attention

Pour une séquence de \(T\) tokens, en empilant les vecteurs en matrices \(Q, K \in \mathbb{R}^{T \times d_k}\), \(V \in \mathbb{R}^{T \times d_v}\) :

\[ \text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V \]

1. \(QK^\top\) : matrice \(T \times T\) des scores de chaque token (ligne) envers chaque token (colonne).
2. Division par \(\sqrt{d_k}\) : sans elle, les produits scalaires grandissent avec la dimension, la softmax sature (une seule colonne à 1) et ses gradients s'annulent.
3. Softmax **par ligne** : chaque ligne devient une distribution de poids (somme 1).
4. Multiplication par \(V\) : chaque sortie est une **moyenne pondérée** des valeurs.

::: example Attention à la main (T = 3, d_k = 2)
\(Q = K = \begin{pmatrix} 1 & 0 \\ 0 & 1 \\ 1 & 1 \end{pmatrix}\), \(V = \begin{pmatrix} 1 & 0 \\ 0 & 1 \\ 0{,}5 & 0{,}5 \end{pmatrix}\).
Scores du token 1 : \(q_1 \cdot k_j = (1, 0, 1)\), divisés par \(\sqrt 2\) : \((0{,}71;\ 0;\ 0{,}71)\).
Softmax : \(e^{0{,}71} \approx 2{,}03\), \(e^{0} = 1\) → poids \((0{,}40;\ 0{,}20;\ 0{,}40)\).
Sortie du token 1 : \(0{,}40 \times (1, 0) + 0{,}20 \times (0, 1) + 0{,}40 \times (0{,}5;\ 0{,}5) = (0{,}60;\ 0{,}40)\).
Le token 1 s'est « enrichi » du contenu des tokens qui lui ressemblent (lui-même et le token 3).
:::

```python
import torch, math
def attention(Q, K, V, mask=None):
    scores = Q @ K.transpose(-2, -1) / math.sqrt(Q.size(-1))   # (…, T, T)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float("-inf"))  # positions interdites
    weights = torch.softmax(scores, dim=-1)                      # chaque ligne somme à 1
    return weights @ V, weights
```

::: quiz Quiz 7.1 — Complexité
Pour une séquence de T tokens, quelle est la taille de la matrice des poids d'attention, et quel problème cela pose-t-il ?
- [ ] T × d_k : aucun problème
- [x] T × T : le coût en mémoire et en calcul croît quadratiquement avec la longueur du contexte
- [ ] d_k × d_k : le coût dépend seulement de la dimension
> Chaque token regarde chaque token : T² scores. Doubler le contexte quadruple ce coût. C'est la raison des contextes limités des premiers modèles et de nombreuses recherches (attention creuse, FlashAttention, fenêtres glissantes).
:::

::: viz attention Une matrice d'attention en direct
token: 1
echelle: 1
Chaque ligne montre où « regarde » un mot (scores fictifs, choisis pour l'illustration). Baisse le diviseur : la softmax sature et un seul mot reçoit tout le poids. Monte-le : les poids deviennent uniformes. Active le **masque causal** pour voir ce qu'un modèle de type GPT a le droit de regarder.
:::

## 3. Multi-head attention

Une seule attention ne peut capturer qu'un type de relation à la fois. On en calcule \(h\) en parallèle (les **têtes**), chacune avec ses propres projections de dimension \(d_{\text{model}}/h\), puis on concatène et on projette :

\[ \text{MultiHead}(X) = \text{Concat}(\text{head}_1, \dots, \text{head}_h)\, W_O \qquad \text{head}_i = \text{Attention}(XW_Q^i, XW_K^i, XW_V^i) \]

Dans les modèles entraînés, on observe des têtes spécialisées (accord sujet-verbe, coréférence, mot précédent…), même si toutes ne sont pas aussi interprétables.

## 4. Où est l'ordre ? L'encodage positionnel

L'attention est **invariante par permutation** : sans information supplémentaire, « chien mord homme » et « homme mord chien » donneraient les mêmes représentations (à l'ordre près). On ajoute donc à chaque embedding un **vecteur de position** :

- sinusoïdes de fréquences différentes (Transformer original) : \(PE_{(pos, 2i)} = \sin(pos / 10000^{2i/d})\), \(PE_{(pos, 2i+1)} = \cos(pos / 10000^{2i/d})\) ;
- positions **apprises** (BERT, GPT-2) ;
- positions **relatives / rotatives** (RoPE, dans la plupart des LLM récents), qui généralisent mieux aux longs contextes.

## 5. Le bloc Transformer

```text
          entrée (T × d_model)
               │
     ┌─────────┴─────────┐
     │  Multi-Head Self-  │
     │     Attention      │
     └─────────┬─────────┘
       + résiduel → LayerNorm
               │
     ┌─────────┴─────────┐
     │ Feed-Forward (FFN) │   Linear(d → 4d) → GELU → Linear(4d → d), par token
     └─────────┬─────────┘
       + résiduel → LayerNorm
               │
          sortie (T × d_model)      … répété N fois (12, 24, 96…)
```

| Composant | Rôle |
|---|---|
| Self-attention | mélanger l'information **entre** tokens |
| FFN | transformer chaque token **individuellement** (l'essentiel des paramètres) |
| Connexions résiduelles | faire circuler le gradient (comme ResNet), empiler des dizaines de blocs |
| LayerNorm | stabiliser l'entraînement, indépendamment du batch |
| Dropout, warmup du learning rate, AdamW | régulariser et stabiliser l'optimisation |

::: info Pre-LN et Post-LN
Le Transformer original applique la normalisation **après** l'addition résiduelle (Post-LN). La plupart des modèles récents la placent **avant** chaque sous-bloc (Pre-LN), ce qui rend l'entraînement des réseaux très profonds plus stable.
:::

## 6. Encodeur, décodeur et les familles de modèles

| Famille | Attention | Pré-entraînement | Exemples | Usage typique |
|---|---|---|---|---|
| **Encodeur** | bidirectionnelle (chaque token voit tout) | mots masqués (MLM) | BERT, RoBERTa, CamemBERT | classification, extraction, recherche sémantique |
| **Décodeur** | **causale** (masque : chaque token ne voit que le passé) | prédire le token suivant | GPT, Llama, Mistral | génération de texte, assistants |
| **Encodeur-décodeur** | encodeur + attention croisée | débruitage / traduction | T5, BART, Transformer original | traduction, résumé |

Le **masque causal** est une matrice triangulaire inférieure : les scores vers les positions futures sont mis à \(-\infty\) avant la softmax, donc leur poids vaut 0. Sans lui, le modèle « tricherait » en lisant le mot qu'il doit prédire.

```python
T = 4
mask = torch.tril(torch.ones(T, T))   # 1 sous la diagonale (passé et présent), 0 au-dessus
# [[1,0,0,0],
#  [1,1,0,0],
#  [1,1,1,0],
#  [1,1,1,1]]
```

::: quiz Quiz 7.2 — Masque causal
Pourquoi un modèle de type GPT utilise-t-il un masque causal pendant l'entraînement ?
- [ ] Pour réduire le nombre de paramètres
- [x] Pour qu'en prédisant le token t+1, chaque position ne puisse voir que les tokens 1 à t, comme lors de la génération
- [ ] Pour accélérer la softmax
> On entraîne en parallèle la prédiction de tous les tokens suivants d'une séquence. Sans masque, la position t verrait directement la réponse t+1 et n'apprendrait rien d'utile. Le masque n'enlève aucun paramètre et ne change pas le coût de la softmax.
:::

## 7. Des Transformers aux grands modèles de langage

### Pré-entraîner, puis adapter

1. **Pré-entraînement** auto-supervisé sur d'énormes corpus (des milliers de milliards de tokens) : prédire le token suivant (GPT) ou les mots masqués (BERT). Aucune annotation humaine n'est nécessaire.
2. **Adaptation** : fine-tuning sur une tâche annotée ; pour les assistants, *instruction tuning* puis alignement sur les préférences humaines (RLHF, DPO).
3. **Fine-tuning efficace** : LoRA n'entraîne que de petites matrices de rang faible ajoutées aux poids gelés — quelques millions de paramètres au lieu de milliards.

### Comment un GPT génère

À chaque étape, le modèle produit une distribution sur le vocabulaire pour le **token suivant** ; on en choisit un (le plus probable, ou par échantillonnage avec une **température**), on l'ajoute au contexte, et on recommence. Le modèle optimise la **vraisemblance** du texte, pas sa véracité.

::: warn Limites à connaître
- **Hallucinations** : des affirmations plausibles mais fausses, faute de mécanisme interne de vérification. Pour des faits, on combine avec une recherche documentaire (**RAG**) et on vérifie les sources.
- **Contexte limité** et coût quadratique de l'attention.
- **Biais** hérités des données d'entraînement ; données personnelles et droit d'auteur (RGPD, AI Act).
- Coût énergétique et matériel important de l'entraînement comme de l'inférence.
:::

### Utiliser un modèle pré-entraîné

```python
from transformers import pipeline
clf = pipeline("sentiment-analysis",
               model="nlptown/bert-base-multilingual-uncased-sentiment")
print(clf("Ce cours sur les Transformers est vraiment clair !"))
# [{'label': '5 stars', 'score': ...}]
```

::: tip Les Transformers au-delà du texte
**Vision Transformer** (ViT, 2020) : l'image est découpée en patchs 16×16 traités comme des tokens. **Whisper** (audio), **AlphaFold 2** (structures de protéines), modèles multimodaux texte-image : la même architecture s'applique dès qu'on peut représenter les données comme une suite de vecteurs.
:::

::: exo Exercice 1 — Self-attention à la main
Reprends l'exemple de la section 2 et calcule la sortie du **token 3** (\(q_3 = (1, 1)\)).
?? Voir la solution
Scores : \(q_3 \cdot k_j = (1, 1, 2)\), divisés par \(\sqrt 2\) : \((0{,}71;\ 0{,}71;\ 1{,}41)\). Exponentielles : \((2{,}03;\ 2{,}03;\ 4{,}11)\), somme 8,17. Poids : \((0{,}25;\ 0{,}25;\ 0{,}50)\). Sortie : \(0{,}25 (1, 0) + 0{,}25 (0, 1) + 0{,}50 (0{,}5;\ 0{,}5) = (0{,}50;\ 0{,}50)\). Le token 3, qui « ressemble » aux deux autres, réalise un mélange équilibré.
:::

::: exo Exercice 2 — Compter les paramètres d'un bloc
Un bloc Transformer a \(d_{\text{model}} = 768\), 12 têtes et une FFN de dimension 3 072 (= 4 × 768). En négligeant biais et LayerNorm :
1. Combien de paramètres pour l'attention (\(W_Q, W_K, W_V, W_O\)) ?
2. Pour la FFN ?
3. BERT-base a 12 blocs : estime les paramètres des blocs, et compare aux ≈ 110 millions annoncés.
?? Voir la solution
1. Quatre matrices 768 × 768 (les 12 têtes se partagent ces dimensions) : \(4 \times 768^2 = 2\,359\,296\).
2. \(768 \times 3\,072 + 3\,072 \times 768 = 4\,718\,592\) : la FFN pèse **deux fois** l'attention.
3. Par bloc ≈ 7,08 M, soit ≈ 85 M pour 12 blocs. Le reste vient surtout des **embeddings** (30 522 tokens × 768 ≈ 23 M) et des positions, biais et normalisations : on retrouve bien ≈ 110 M.
:::

::: culture Culture & histoire
- **2014** — Dzmitry Bahdanau, Kyunghyun Cho et Yoshua Bengio introduisent l'**attention** pour la traduction neuronale.
- **2017** — Ashish Vaswani et al. (Google) publient *Attention Is All You Need* : le **Transformer**, sans récurrence ni convolution.
- **2018** — Google publie **BERT** ; OpenAI publie **GPT** ; **2019** — GPT-2 ; **2020** — GPT-3 (175 milliards de paramètres) révèle l'apprentissage « en contexte » à partir de quelques exemples.
- **2020** — Le **Vision Transformer** (Dosovitskiy et al.) ; **2021** — AlphaFold 2 (DeepMind), dont les auteurs Demis Hassabis et John Jumper reçoivent avec David Baker le **prix Nobel de chimie 2024**.
- **2022** — ChatGPT popularise les assistants conversationnels ; **2023** — modèles ouverts (Llama de Meta, Mistral, entreprise française) ; **2024** — l'Union européenne adopte l'**AI Act**.
- [The Illustrated Transformer (J. Alammar)](https://jalammar.github.io/illustrated-transformer/)
- [Attention Is All You Need (arXiv)](https://arxiv.org/abs/1706.03762)
- [Cours Hugging Face NLP (FR)](https://huggingface.co/learn/nlp-course/fr/chapter1/1)
- [Let's build GPT from scratch (A. Karpathy, vidéo)](https://www.youtube.com/watch?v=kCc8FmEb1nY)
:::

## Synthèse

::: note À retenir
- Attention : \(\text{softmax}(QK^\top / \sqrt{d_k})\,V\) = moyenne pondérée des valeurs, poids = similarité query–key.
- Coût **quadratique** en la longueur du contexte ; \(\sqrt{d_k}\) évite la saturation de la softmax.
- Multi-head : plusieurs relations en parallèle ; positions ajoutées car l'attention ignore l'ordre.
- Bloc : attention + FFN, chacune avec résiduel et LayerNorm ; empilé N fois.
- Encodeur (BERT, compréhension) / décodeur causal (GPT, génération) / encodeur-décodeur (T5, traduction).
- LLM : pré-entraînement auto-supervisé, puis fine-tuning (LoRA) ; prédit le plausible, pas le vrai.
:::
