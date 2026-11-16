---
title: Séquences — RNN, LSTM, GRU et embeddings
subtitle: Traiter du texte, des séries temporelles ou des signaux, où l'ordre des éléments porte le sens.
domains: IA
tags: séquence, RNN, BPTT, LSTM, GRU, embedding, tokenisation, séries temporelles, gradient évanescent
niveau: Intermédiaire
duree: 60 min
objectifs: Représenter du texte par des tokens et des embeddings ; expliquer la récurrence d'un RNN et la rétropropagation dans le temps ; comprendre le rôle des portes d'un LSTM ; construire un classifieur de séquences en PyTorch ; connaître les limites qui ont mené aux Transformers.
---

::: goal Ce que tu sauras faire à la fin
- Transformer une phrase en tenseur (tokens → indices → embeddings).
- Écrire l'équation d'un RNN et expliquer pourquoi il oublie les dépendances lointaines.
- Décrire les portes d'un LSTM et choisir entre RNN, LSTM, GRU et Transformer.
:::

## 1. Des données où l'ordre compte

« Le chien mord l'homme » et « l'homme mord le chien » contiennent les mêmes mots. Un modèle qui ignore l'ordre (sac de mots) ne peut pas les distinguer. De même, une série de températures ou de ventes n'a de sens que dans l'ordre du temps.

| Problème | Entrée | Sortie | Schéma |
|---|---|---|---|
| Analyse de sentiment | phrase | 1 classe | séquence → 1 |
| Prévision de série | historique | valeur suivante | séquence → 1 (ou plusieurs) |
| Étiquetage (entités nommées) | phrase | 1 étiquette par mot | séquence → séquence (alignée) |
| Traduction, résumé | phrase | autre phrase | séquence → séquence (encodeur-décodeur) |

## 2. Du texte aux vecteurs

1. **Tokenisation** : découper le texte en unités (mots, sous-mots, caractères). Les modèles modernes utilisent des **sous-mots** (BPE, WordPiece) : « anticonstitutionnellement » → « anti », « constitution », « nelle », « ment ». Un mot inconnu se décompose toujours en morceaux connus.
2. **Indices** : chaque token reçoit un entier dans un vocabulaire de taille \(V\).
3. **Embedding** : chaque indice est remplacé par un vecteur dense de dimension \(d\) (50 à 4 096), **appris** comme les autres poids.

```python
import torch, torch.nn as nn
emb = nn.Embedding(num_embeddings=10_000, embedding_dim=128)   # table 10 000 × 128
ids = torch.tensor([[12, 857, 3, 0, 0]])     # (B=1, T=5) ; 0 = token de remplissage
print(emb(ids).shape)                          # torch.Size([1, 5, 128])
```

::: def Embedding
Une table de correspondance \(E \in \mathbb{R}^{V \times d}\) : le token \(i\) est représenté par la ligne \(E_i\). Équivaut à multiplier un vecteur one-hot par \(E\), sans jamais construire le one-hot. Après entraînement, des mots de sens proche ont des vecteurs proches (similarité cosinus élevée).
:::

::: example Arithmétique des embeddings
Avec word2vec (Mikolov et al., 2013), \(\vec{\text{roi}} - \vec{\text{homme}} + \vec{\text{femme}}\) tombe près de \(\vec{\text{reine}}\) : certaines relations sémantiques deviennent des **directions** de l'espace. C'est une observation empirique, pas une garantie, et ces vecteurs reproduisent aussi les **biais** présents dans les textes d'entraînement.
:::

## 3. Le réseau récurrent (RNN)

Un RNN lit la séquence **un élément à la fois** et met à jour un **état caché** \(h_t\), sorte de mémoire résumant tout ce qu'il a vu :

\[ h_t = \tanh\big(W_x x_t + W_h h_{t-1} + b\big) \qquad \hat y_t = W_y h_t + c \]

```text
      h0 → [cellule] → h1 → [cellule] → h2 → [cellule] → h3 → sortie
              ↑                ↑                ↑
              x1               x2               x3
   (les mêmes poids Wx, Wh à chaque pas de temps)
```

- Les **mêmes poids** sont utilisés à chaque pas de temps : partage de poids dans le temps, comme la convolution le fait dans l'espace. Le modèle accepte donc des séquences de **longueur variable**.
- L'entraînement « déroule » le réseau sur les T pas et applique la rétropropagation : c'est la **BPTT** (*backpropagation through time*).

::: quiz Quiz 6.1 — Partage de poids
Un RNN a une couche cachée de taille 64 et des entrées de dimension 32. Combien de paramètres pour \(W_x\), \(W_h\) et \(b\), sur une séquence de 100 pas ?
- [ ] 100 × (64 × 32 + 64 × 64 + 64)
- [x] 64 × 32 + 64 × 64 + 64 = 6 208, quelle que soit la longueur
- [ ] 64 × 64 = 4 096
> Les mêmes matrices servent à chaque pas de temps : le nombre de paramètres ne dépend pas de la longueur de la séquence. W_x est 64 × 32 (2 048), W_h est 64 × 64 (4 096), b a 64 composantes.
:::

## 4. Le problème des dépendances longues

Pendant la BPTT, le gradient qui remonte de l'instant \(T\) vers l'instant \(t\) est multiplié \(T - t\) fois par \(W_h\) (et par les dérivées de tanh). Selon la taille des valeurs propres de \(W_h\) :

- valeurs < 1 → le gradient **s'évanouit** exponentiellement : le réseau n'apprend pas les dépendances lointaines (« Le chat que j'ai adopté l'an dernier chez mes voisins **est** … » : l'accord dépend d'un mot 10 positions avant) ;
- valeurs > 1 → le gradient **explose** : la perte devient `nan`.

L'explosion se traite par **gradient clipping** (`torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)`). L'évanouissement demande de changer l'architecture : c'est le LSTM.

## 5. LSTM et GRU : des portes pour contrôler la mémoire

Le **LSTM** (*Long Short-Term Memory*) ajoute un **état de cellule** \(c_t\), une sorte de tapis roulant où l'information circule avec des modifications **additives**, contrôlées par trois **portes** (valeurs entre 0 et 1 produites par des sigmoïdes) :

| Porte | Formule (idée) | Rôle |
|---|---|---|
| Oubli \(f_t\) | \(\sigma(W_f[h_{t-1}, x_t] + b_f)\) | quelle part de \(c_{t-1}\) garder |
| Entrée \(i_t\) | \(\sigma(W_i[h_{t-1}, x_t] + b_i)\) | quelle part du candidat \(\tilde c_t\) écrire |
| Sortie \(o_t\) | \(\sigma(W_o[h_{t-1}, x_t] + b_o)\) | quelle part de la mémoire exposer dans \(h_t\) |

\[ c_t = f_t \odot c_{t-1} + i_t \odot \tilde c_t \qquad h_t = o_t \odot \tanh(c_t) \]

Comme \(c_t\) se met à jour par **addition** (et non par multiplication répétée par une matrice), le gradient peut traverser de nombreux pas de temps quand \(f_t \approx 1\) — même idée que les connexions résiduelles de ResNet.

Le **GRU** (2014) simplifie le LSTM : deux portes (mise à jour, réinitialisation), pas d'état de cellule séparé, environ 25 % de paramètres en moins, des performances souvent comparables.

## 6. En pratique avec PyTorch

```python
class SentimentLSTM(nn.Module):
    def __init__(self, vocab_size, emb_dim=128, hidden=128, n_classes=2):
        super().__init__()
        self.emb = nn.Embedding(vocab_size, emb_dim, padding_idx=0)
        self.lstm = nn.LSTM(emb_dim, hidden, num_layers=2, batch_first=True,
                            dropout=0.2, bidirectional=True)
        self.head = nn.Linear(2 * hidden, n_classes)   # ×2 : deux directions

    def forward(self, ids):                 # ids : (B, T)
        x = self.emb(ids)                   # (B, T, emb_dim)
        out, (h_n, c_n) = self.lstm(x)      # out : (B, T, 2*hidden)
        h = torch.cat([h_n[-2], h_n[-1]], dim=1)   # dernier état, sens avant et arrière
        return self.head(h)                 # logits (B, n_classes)
```

- `batch_first=True` : entrées `(B, T, D)`. Sans lui, PyTorch attend `(T, B, D)` — source d'erreurs silencieuses.
- **Bidirectionnel** : un LSTM lit de gauche à droite, un autre de droite à gauche ; utile quand toute la séquence est disponible (classification), impossible pour prédire le futur.
- **Padding** : les séquences d'un batch sont complétées à la même longueur par un token 0 ; `padding_idx=0` empêche ce token d'apprendre (et `pack_padded_sequence` évite de le traiter).

::: warn Séries temporelles : pas de fuite du futur
Pour une prévision, le découpage train / validation / test doit être **chronologique**, et la normalisation calculée sur le passé seulement. Un split aléatoire laisse le modèle voir l'avenir : scores excellents, prévisions inutiles en production. Toujours comparer à une baseline naïve (« demain = aujourd'hui », moyenne saisonnière).
:::

::: quiz Quiz 6.2 — Architecture
Tu prédis la consommation électrique de demain à partir des 30 derniers jours. Quel choix est **incorrect** ?
- [ ] Un LSTM unidirectionnel sur les 30 jours
- [x] Un LSTM bidirectionnel entraîné sur un découpage aléatoire des jours
- [ ] Comparer d'abord à la baseline « même jour la semaine dernière »
> Le split aléatoire mélange passé et futur : le modèle s'entraîne sur des jours postérieurs à ceux qu'il doit prédire en validation. Un LSTM bidirectionnel sur une fenêtre passée n'est pas interdit en soi, mais le découpage aléatoire rend l'évaluation trompeuse.
:::

## 7. Les limites qui ont mené aux Transformers

| Limite des RNN/LSTM | Conséquence |
|---|---|
| Traitement **séquentiel** (h_t dépend de h_{t−1}) | impossible de paralléliser sur la longueur : entraînement lent sur GPU |
| Mémoire compressée dans un vecteur de taille fixe | les longues séquences (pages, livres) perdent de l'information |
| Dépendances lointaines encore difficiles | malgré les portes, au-delà de quelques centaines de pas |

En traduction, les modèles encodeur-décodeur à LSTM ajoutaient déjà un mécanisme d'**attention** (Bahdanau et al., 2014) permettant au décodeur de regarder directement tous les états de l'encodeur. En 2017, *Attention Is All You Need* supprime complètement la récurrence : c'est le module suivant.

::: exo Exercice 1 — Un pas de RNN à la main
RNN scalaire : \(h_t = \tanh(w_x x_t + w_h h_{t-1})\) avec \(w_x = 1\), \(w_h = 0{,}5\), \(h_0 = 0\). Séquence \(x = (1, 0, 0)\).
1. Calcule \(h_1\), \(h_2\), \(h_3\).
2. Que montre l'évolution de \(h_t\) sur la mémoire d'un RNN ?
?? Voir la solution
1. \(h_1 = \tanh(1) \approx 0{,}762\) ; \(h_2 = \tanh(0{,}5 \times 0{,}762) = \tanh(0{,}381) \approx 0{,}364\) ; \(h_3 = \tanh(0{,}182) \approx 0{,}180\).
2. Sans nouvelle entrée, la trace de \(x_1\) est divisée environ par 2 à chaque pas (facteur \(w_h = 0{,}5\), et tanh écrase encore) : la mémoire s'efface **exponentiellement**. Le gradient subit le même sort pendant la BPTT : c'est le gradient évanescent.
:::

::: exo Exercice 2 — Dimensions d'un LSTM
`nn.LSTM(input_size=100, hidden_size=64, batch_first=True)` reçoit un tenseur de forme (32, 50, 100).
1. Quelle est la forme de `out` ? De `h_n` ?
2. Combien de paramètres ? (PyTorch utilise deux vecteurs de biais par porte.)
?? Voir la solution
1. `out` : (32, 50, 64) — l'état caché à chaque pas ; `h_n` : (1, 32, 64) — (couches × directions, batch, hidden).
2. Un LSTM calcule 4 blocs (3 portes + candidat), chacun avec \(W_{ih}\) (64 × 100), \(W_{hh}\) (64 × 64) et deux biais de 64 : \(4 \times (64 \times 100 + 64 \times 64 + 64 + 64) = 4 \times 10\,624 = 42\,496\) paramètres.
:::

::: culture Culture & histoire
- **1986–1990** — Michael Jordan puis Jeffrey Elman proposent les premiers réseaux récurrents simples.
- **1991–1994** — Sepp Hochreiter (mémoire de diplôme, 1991) puis Bengio, Simard et Frasconi (1994) analysent le **gradient évanescent**.
- **1997** — Sepp Hochreiter et Jürgen Schmidhuber publient le **LSTM** ; la porte d'oubli est ajoutée par Gers et al. en 2000.
- **2013** — Tomas Mikolov et al. (Google) publient **word2vec** ; **2014** — Kyunghyun Cho et al. proposent le **GRU**, Ilya Sutskever et al. le **seq2seq**, Dzmitry Bahdanau et al. l'**attention**.
- Les LSTM ont équipé la reconnaissance vocale et la traduction de Google, Apple et Amazon au milieu des années 2010, avant d'être largement remplacés par les Transformers.
- [Understanding LSTM Networks (C. Olah)](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)
- [The Unreasonable Effectiveness of RNNs (A. Karpathy)](https://karpathy.github.io/2015/05/21/rnn-effectiveness/)
- [Documentation nn.LSTM](https://pytorch.org/docs/stable/generated/torch.nn.LSTM.html)
:::

## Synthèse

::: note À retenir
- Texte → tokens (sous-mots) → indices → **embeddings** appris.
- RNN : \(h_t = \tanh(W_x x_t + W_h h_{t-1} + b)\), poids partagés dans le temps, entraînement par BPTT.
- Produits répétés → gradient **évanescent** (dépendances longues perdues) ou **explosif** (clipping).
- LSTM / GRU : portes + mise à jour **additive** de la mémoire.
- `batch_first=True`, padding, bidirectionnel seulement si toute la séquence est connue.
- Séries temporelles : split chronologique et baseline naïve.
:::
