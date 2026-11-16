---
title: PyTorch en pratique
subtitle: Des tenseurs à la boucle d'entraînement complète — le squelette que l'on réutilise dans tous les projets.
domains: IA
tags: PyTorch, tenseur, autograd, nn.Module, DataLoader, boucle d'entraînement, GPU, state_dict, reproductibilité
niveau: Intermédiaire
duree: 75 min
objectifs: Manipuler des tenseurs et leurs dimensions ; comprendre autograd ; définir un modèle avec nn.Module ; écrire une boucle d'entraînement et d'évaluation correcte ; utiliser le GPU ; sauvegarder et recharger un modèle.
---

::: goal Ce que tu sauras faire à la fin
- Écrire de mémoire la boucle `zero_grad → forward → loss → backward → step`.
- Expliquer ce que contient `.grad` et pourquoi on le remet à zéro.
- Organiser un projet : `Dataset`, `DataLoader`, modèle, entraînement, évaluation, sauvegarde.
:::

## 1. Les tenseurs

Un **tenseur** PyTorch est un tableau multidimensionnel, comme un `ndarray` NumPy, avec deux super-pouvoirs : il peut vivre sur **GPU**, et il peut **enregistrer les opérations** pour calculer des gradients.

```python
import torch

x = torch.tensor([[1., 2.], [3., 4.]])     # à partir de données
z = torch.zeros(3, 4); r = torch.randn(2, 3)  # créations usuelles
print(x.shape, x.dtype, x.device)          # torch.Size([2, 2]) torch.float32 cpu

y = x @ x.T          # produit matriciel
m = x.mean(dim=0)    # moyenne par colonne (dim = axis de NumPy)
v = x.view(4)        # changer de forme (mémoire contiguë) ; .reshape() est plus permissif
b = x.unsqueeze(0)   # ajoute une dimension : (1, 2, 2)
n = x.numpy()        # vers NumPy (partage la mémoire si sur CPU)
t = torch.from_numpy(n)
```

| Convention de forme | Signification |
|---|---|
| `(B, F)` | batch de vecteurs (tabulaire) |
| `(B, C, H, W)` | batch d'images : canaux, hauteur, largeur |
| `(B, T, D)` | batch de séquences : temps, dimension (avec `batch_first=True`) |

::: warn Les types
Les poids sont en `float32` par défaut. Un tenseur créé depuis NumPy est souvent en `float64` : convertis avec `.float()`. Les cibles de `CrossEntropyLoss` doivent être des entiers `long` (indices de classe), pas des floats ni du one-hot.
:::

## 2. Autograd : la rétropropagation automatique

```python
w = torch.tensor(0.5, requires_grad=True)
b = torch.tensor(-0.5, requires_grad=True)
x, y = torch.tensor(2.0), torch.tensor(1.0)

a = torch.sigmoid(w * x + b)   # PyTorch construit le graphe de calcul
loss = (a - y) ** 2
loss.backward()                # rétropropagation : remplit .grad
print(w.grad, b.grad)          # tensor(-0.3549) tensor(-0.1774)  (cf. module précédent)
```

- Chaque opération sur un tenseur `requires_grad=True` est enregistrée ; `backward()` parcourt ce graphe à l'envers.
- Les gradients **s'accumulent** dans `.grad` : un second `backward()` les **additionne**. D'où `optimizer.zero_grad()` à chaque itération.
- Le graphe est **dynamique** : reconstruit à chaque passe avant, on peut donc utiliser des `if` et des boucles Python normales dans le modèle.
- `torch.no_grad()` désactive l'enregistrement (évaluation, inférence) : moins de mémoire, plus rapide.

::: quiz Quiz 4.1 — Accumulation
Que se passe-t-il si on oublie `optimizer.zero_grad()` dans la boucle ?
- [ ] PyTorch lève une erreur
- [x] Les gradients de toutes les itérations s'additionnent : les mises à jour deviennent de plus en plus grandes et fausses
- [ ] Rien, les gradients sont remplacés à chaque backward
> backward() ajoute au contenu de .grad. Sans remise à zéro, l'itération 100 utilise la somme des 100 derniers gradients. Ce comportement est voulu pour l'accumulation de gradient (simuler un gros batch), mais alors on remet à zéro tous les k pas, volontairement.
:::

## 3. Définir un modèle avec nn.Module

```python
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self, n_in, n_hidden, n_out, p_drop=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_in, n_hidden), nn.ReLU(), nn.Dropout(p_drop),
            nn.Linear(n_hidden, n_hidden), nn.ReLU(), nn.Dropout(p_drop),
            nn.Linear(n_hidden, n_out),          # logits : pas de softmax ici
        )

    def forward(self, x):
        return self.net(x)

model = MLP(784, 256, 10)
print(sum(p.numel() for p in model.parameters()))   # nombre de paramètres
```

- Tout `nn.Module` déclaré comme attribut est **enregistré** : ses paramètres apparaissent dans `model.parameters()`, sont déplacés par `model.to(device)` et sauvegardés dans `state_dict()`.
- On appelle le modèle comme une fonction : `model(x)` (et non `model.forward(x)`, qui contourne les hooks).

::: warn Les listes Python ne sont pas enregistrées
`self.couches = [nn.Linear(10, 10) for _ in range(3)]` : ces couches **ne seront pas entraînées** ni déplacées sur GPU. Utiliser `nn.ModuleList([...])` (ou `nn.Sequential`).
:::

## 4. Dataset et DataLoader

```python
from torch.utils.data import Dataset, DataLoader, TensorDataset

class CsvDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.as_tensor(X, dtype=torch.float32)
        self.y = torch.as_tensor(y, dtype=torch.long)
    def __len__(self):
        return len(self.y)
    def __getitem__(self, i):
        return self.X[i], self.y[i]

train_loader = DataLoader(CsvDataset(X_train, y_train), batch_size=64, shuffle=True)
val_loader   = DataLoader(CsvDataset(X_val, y_val), batch_size=256, shuffle=False)
```

- `Dataset` sait donner **un** exemple ; `DataLoader` fabrique les **mini-batchs**, mélange (`shuffle=True` pour le train seulement) et peut charger en parallèle (`num_workers`).
- Pour des tenseurs déjà en mémoire, `TensorDataset(X, y)` suffit.
- Le prétraitement (standardisation…) est ajusté **sur le train uniquement**, comme en scikit-learn.

## 5. La boucle d'entraînement complète

```python
device = "cuda" if torch.cuda.is_available() else "cpu"
torch.manual_seed(42)

model = MLP(784, 256, 10).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)

def run_epoch(loader, train=True):
    model.train(train)                       # active / désactive dropout & batchnorm
    total, correct, n = 0.0, 0, 0
    with torch.set_grad_enabled(train):      # pas de graphe en évaluation
        for X, y in loader:
            X, y = X.to(device), y.to(device)
            logits = model(X)                # 1. passe avant
            loss = criterion(logits, y)      # 2. perte
            if train:
                optimizer.zero_grad()        # 3. remise à zéro des gradients
                loss.backward()              # 4. rétropropagation
                optimizer.step()             # 5. mise à jour des poids
            total += loss.item() * len(y)
            correct += (logits.argmax(dim=1) == y).sum().item()
            n += len(y)
    return total / n, correct / n

for epoch in range(20):
    tr_loss, tr_acc = run_epoch(train_loader, train=True)
    va_loss, va_acc = run_epoch(val_loader, train=False)
    print(f"{epoch:02d}  train {tr_loss:.3f}/{tr_acc:.1%}  val {va_loss:.3f}/{va_acc:.1%}")
```

::: tip Les 5 lignes à connaître par cœur
`logits = model(X)` → `loss = criterion(logits, y)` → `optimizer.zero_grad()` → `loss.backward()` → `optimizer.step()`. Tout le reste (métriques, journalisation, early stopping) s'ajoute autour.
:::

::: why Pourquoi `loss.item()` ?
`loss` est un tenseur relié au graphe de calcul. Accumuler `total += loss` garde **tous les graphes** en mémoire jusqu'à saturation. `.item()` extrait un simple nombre Python.
:::

::: quiz Quiz 4.2 — Évaluation
Laquelle de ces boucles d'évaluation est correcte ?
- [ ] `model.train()` puis calcul des prédictions
- [ ] `model.eval()` puis calcul des prédictions avec `loss.backward()` pour vérifier
- [x] `model.eval()` puis calcul des prédictions dans `with torch.no_grad():`
> eval() fixe le comportement de dropout et batchnorm ; no_grad() évite de construire le graphe (mémoire, vitesse). Appeler backward en évaluation n'a aucun sens et, sans optimizer.step(), ne ferait qu'accumuler des gradients inutiles.
:::

## 6. GPU, précision et performance

- Le modèle **et** les données doivent être sur le même périphérique : `model.to(device)`, `X.to(device)`. Sinon : `RuntimeError: Expected all tensors to be on the same device`.
- Le GPU n'accélère que s'il a assez de travail : augmenter le `batch_size` jusqu'à remplir sa mémoire.
- **Précision mixte** (`torch.autocast`) : calculs en float16/bfloat16, environ 2× plus rapide et 2× moins de mémoire sur GPU récent.
- `torch.compile(model)` (PyTorch 2.x) peut accélérer l'entraînement sans changer le code du modèle.

| Erreur fréquente | Cause | Correction |
|---|---|---|
| `CUDA out of memory` | batch trop gros, graphe gardé en mémoire | réduire le batch, `.item()`, `no_grad()` en eval |
| `mat1 and mat2 shapes cannot be multiplied` | taille d'entrée de `nn.Linear` incorrecte | afficher `x.shape` avant la couche, `nn.Flatten()` |
| `expected scalar type Long` | cibles en float pour `CrossEntropyLoss` | `y.long()` |
| perte bloquée à log(K) | voir module précédent : bug de pipeline | test du petit batch |

## 7. Sauvegarder, recharger, reproduire

```python
torch.save(model.state_dict(), "modele.pt")          # poids uniquement (recommandé)

model = MLP(784, 256, 10)                            # recréer l'architecture
model.load_state_dict(torch.load("modele.pt", map_location="cpu"))
model.eval()                                         # avant toute prédiction
```

- On sauvegarde le **`state_dict`** (dictionnaire des tenseurs), pas l'objet Python entier : plus robuste aux changements de code.
- Pour reprendre un entraînement, sauvegarder aussi `optimizer.state_dict()` et l'époque.
- Reproductibilité : `torch.manual_seed`, `numpy.random.seed`, `random.seed` ; noter les versions. Le GPU peut rester légèrement non déterministe.

::: exo Exercice 1 — Trouver les 4 bugs
```python
model = MLP(20, 64, 3)
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
for X, y in train_loader:
    out = torch.softmax(model(X), dim=1)
    loss = nn.CrossEntropyLoss()(out, y.float())
    loss.backward()
    opt.step()
acc = (model(X_test).argmax(1) == y_test).float().mean()
```
?? Voir la solution
1. **Pas de `opt.zero_grad()`** : les gradients s'accumulent d'une itération à l'autre.
2. **Softmax avant `CrossEntropyLoss`** : la perte applique déjà log-softmax ; il faut lui passer `model(X)` directement.
3. **Cibles en float** : `CrossEntropyLoss` attend des indices de classe `long` → `y` (ou `y.long()`).
4. **Évaluation sans `model.eval()` ni `torch.no_grad()`** : le dropout reste actif (score sous-estimé et aléatoire) et un graphe inutile est construit.
:::

::: exo Exercice 2 — Compter et dimensionner
Le modèle `MLP(784, 256, 10)` ci-dessus reçoit un batch d'images MNIST de forme `(64, 1, 28, 28)`.
1. Que faut-il faire avant la première couche ? Quelle forme obtient-on ?
2. Combien de paramètres a le modèle ?
?? Voir la solution
1. Aplatir chaque image : `x.view(x.size(0), -1)` ou une couche `nn.Flatten()` en tête du `Sequential` → forme `(64, 784)`.
2. \(784 \times 256 + 256 = 200\,960\) ; \(256 \times 256 + 256 = 65\,792\) ; \(256 \times 10 + 10 = 2\,570\). Total : **269 322** paramètres (le dropout n'en a aucun).
:::

::: culture Culture & écosystème
- **2002** — Torch, bibliothèque de calcul scientifique en Lua (Ronan Collobert, Samy Bengio, Johnny Mariéthoz).
- **2016** — Meta (Facebook AI Research) publie **PyTorch** : graphe dynamique, style Python natif. Il devient dominant dans la recherche face à TensorFlow (Google, 2015).
- **2022** — PyTorch rejoint la **PyTorch Foundation** (Linux Foundation) ; **2023** — PyTorch 2.0 et `torch.compile`.
- Écosystème : **torchvision** (images), **Hugging Face Transformers** (modèles pré-entraînés), **PyTorch Lightning** (boucles prêtes à l'emploi), **JAX** (alternative de Google).
- [Tutoriels officiels PyTorch](https://pytorch.org/tutorials/)
- [Learn the Basics (PyTorch)](https://pytorch.org/tutorials/beginner/basics/intro.html)
- [Dive into Deep Learning (version PyTorch)](https://d2l.ai/)
:::

## Synthèse

::: note À retenir
- Tenseur = ndarray + GPU + gradients ; formes conventionnelles `(B, F)`, `(B, C, H, W)`, `(B, T, D)`.
- `backward()` remplit `.grad` en **accumulant** → `zero_grad()` à chaque itération.
- Modèle : sous-classe de `nn.Module`, couches en attributs (`nn.ModuleList`, pas de liste Python), sortie = **logits**.
- Données : `Dataset` + `DataLoader(shuffle=True)` pour le train.
- Évaluation : `model.eval()` + `torch.no_grad()` ; métriques avec `.item()`.
- Sauvegarde : `state_dict()` ; même `device` pour modèle et données.
:::
