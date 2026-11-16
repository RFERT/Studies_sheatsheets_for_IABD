---
title: Généraliser — régularisation et normalisation
subtitle: Un réseau assez gros peut mémoriser n'importe quel jeu de données. Toute la difficulté est qu'il apprenne ce qui se généralise.
domains: IA
tags: surapprentissage, weight decay, dropout, early stopping, data augmentation, batch normalization, layer normalization, validation
niveau: Intermédiaire
duree: 60 min
objectifs: Diagnostiquer sous- et surapprentissage sur des courbes ; expliquer et mettre en œuvre weight decay, dropout, early stopping et augmentation de données ; comprendre batch norm et layer norm et leur comportement en train vs eval.
---

::: goal Ce que tu sauras faire à la fin
- Lire des courbes train / validation et décider quoi changer.
- Expliquer l'effet de chaque technique de régularisation et savoir la placer dans le code.
- Ne plus oublier `model.train()` / `model.eval()` — et savoir pourquoi c'est indispensable.
:::

## 1. Le problème : mémoriser n'est pas apprendre

En 2017, Zhang et al. ont montré qu'un réseau convolutif standard atteint **100 % de précision d'entraînement sur CIFAR-10 avec des labels tirés au hasard** : il a assez de paramètres pour tout mémoriser. Sur des données de test, il fait évidemment 10 % (le hasard). La capacité d'un réseau moderne n'est donc pas le facteur limitant : ce qui compte, c'est de le **pousser vers des solutions qui généralisent**.

::: viz regression Capacité et surapprentissage
degre: 3
Même phénomène qu'avec un réseau, en miniature : monte le degré jusqu'à faire passer la courbe par tous les points (erreur d'entraînement nulle). Entre les points, la courbe devient absurde. La régularisation consiste à pénaliser ces solutions « tordues » sans réduire brutalement la capacité.
:::

| Situation | Train | Validation | Remède |
|---|---|---|---|
| Sous-apprentissage | élevée | élevée | modèle plus grand, entraîner plus longtemps, η mieux réglé |
| Bon compromis | faible | proche du train | — |
| Surapprentissage | très faible | remonte | régularisation, plus de données, augmentation |

::: warn Trois jeux, trois rôles
- **Train** : calculer les gradients.
- **Validation** : choisir l'architecture, les hyperparamètres, le moment d'arrêt.
- **Test** : une seule mesure finale. Si tu regardes le test pour régler quoi que ce soit, il devient un second jeu de validation et ton score final est optimiste.
:::

## 2. Weight decay (régularisation L2)

On ajoute à la perte une pénalité sur la norme des poids :

\[ \mathcal{L}_{\text{reg}} = \mathcal{L} + \frac{\lambda}{2} \lVert \theta \rVert^2 \qquad\Rightarrow\qquad \theta \leftarrow \theta - \eta\,(\nabla \mathcal{L} + \lambda \theta) = (1 - \eta\lambda)\,\theta - \eta \nabla \mathcal{L} \]

À chaque pas, les poids sont **multipliés par \(1 - \eta\lambda\)** : ils « décroissent » vers 0 sauf si les données justifient qu'ils soient grands. Des poids petits donnent une fonction plus **lisse**, moins sensible au bruit — c'est la Ridge du cours de ML.

::: tip AdamW plutôt que Adam + L2
Avec Adam, ajouter \(\lambda\theta\) au gradient n'équivaut plus à une décroissance des poids (le terme est renormalisé par \(\sqrt{\hat v}\)). **AdamW** (Loshchilov & Hutter) applique la décroissance séparément : c'est la bonne façon de faire, et le choix par défaut pour les Transformers. Valeurs typiques : λ = 0,01 à 0,1.
:::

## 3. Dropout

Pendant l'entraînement, chaque neurone d'une couche est **désactivé au hasard** avec une probabilité \(p\) (souvent 0,1 à 0,5), différemment à chaque mini-batch. Le réseau ne peut plus compter sur un neurone précis : il apprend des représentations **redondantes et robustes**.

```text
entraînement (p = 0,5)              évaluation
h1  h2  h3  h4  h5  h6              h1  h2  h3  h4  h5  h6
●   ✕   ●   ✕   ✕   ●               ●   ●   ●   ●   ●   ●
(sorties survivantes × 2)            (tous actifs, aucune mise à l'échelle)
```

- Les sorties conservées sont multipliées par \(\frac{1}{1-p}\) pendant l'entraînement (*inverted dropout*) pour que l'espérance reste la même : à l'évaluation, on utilise **tous** les neurones sans rien changer.
- Interprétation : on entraîne implicitement un **ensemble** de \(2^n\) sous-réseaux qui partagent leurs poids, et l'évaluation en fait la moyenne — l'idée du bagging (cours de ML).

::: warn train() et eval()
`nn.Dropout` et `nn.BatchNorm` se comportent **différemment** selon le mode. Oublier `model.eval()` avant la validation donne des prédictions aléatoires et des scores sous-estimés ; oublier `model.train()` en revenant à l'entraînement désactive la régularisation.
:::

::: quiz Quiz 3.1 — Dropout
Pourquoi les activations conservées sont-elles multipliées par \(1/(1-p)\) pendant l'entraînement ?
- [ ] Pour accélérer la convergence
- [x] Pour que l'espérance de chaque activation soit la même en entraînement et en évaluation, où tous les neurones sont actifs
- [ ] Pour compenser le weight decay
> Avec p = 0,5, en moyenne la moitié des neurones s'éteint : la somme reçue par la couche suivante serait deux fois plus petite qu'en évaluation. Multiplier les survivants par 2 rétablit la même échelle, si bien que le modèle évalué n'a besoin d'aucune correction.
:::

## 4. Early stopping

On évalue le modèle sur la validation à chaque époque et on **garde les poids de la meilleure époque**. Si la perte de validation ne s'améliore plus pendant \(k\) époques (la **patience**), on arrête.

```python
best, patience, wait = float("inf"), 5, 0
for epoch in range(200):
    train_one_epoch(model, train_loader)
    val_loss = evaluate(model, val_loader)
    if val_loss < best - 1e-4:
        best, wait = val_loss, 0
        torch.save(model.state_dict(), "meilleur.pt")   # on garde le meilleur
    else:
        wait += 1
        if wait >= patience:
            break
model.load_state_dict(torch.load("meilleur.pt"))
```

C'est une régularisation implicite : arrêter tôt limite la distance parcourue depuis l'initialisation, ce qui a un effet comparable à une pénalité L2.

## 5. Augmentation de données

Le meilleur régulariseur reste **plus de données**. Quand on ne peut pas en collecter, on en **fabrique** par des transformations qui ne changent pas l'étiquette :

| Données | Augmentations courantes | Piège |
|---|---|---|
| Images | retournement horizontal, recadrage aléatoire, rotation légère, couleurs | un 6 retourné devient un 9 ; un panneau « gauche » retourné change de sens |
| Texte | synonymes, rétro-traduction, masquage de mots | le sens peut changer |
| Audio | bruit, décalage temporel, changement de vitesse | — |
| Tabulaire | rarement pertinent (bruit léger, SMOTE pour classes rares) | créer des exemples irréalistes |

::: warn Augmenter seulement le train
Les augmentations aléatoires s'appliquent au **jeu d'entraînement**. La validation et le test doivent rester tels qu'ils seront en production (seulement redimensionnés et normalisés).
:::

```python
from torchvision import transforms
train_tf = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
eval_tf = transforms.Compose([
    transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
```

## 6. Normaliser les activations

### Batch normalization

Pour chaque canal, sur le mini-batch, on **centre et réduit** les pré-activations puis on applique une échelle et un décalage **appris** :

\[ \hat z = \frac{z - \mu_{\text{batch}}}{\sqrt{\sigma^2_{\text{batch}} + \varepsilon}} \qquad y = \gamma \hat z + \beta \]

- Effets : entraînement plus **stable**, learning rates plus élevés possibles, moins de sensibilité à l'initialisation, léger effet régularisant (bruit des statistiques du batch).
- En **évaluation**, on n'a pas forcément de batch : on utilise des **moyennes mobiles** de \(\mu\) et \(\sigma^2\) accumulées pendant l'entraînement. D'où l'importance de `model.eval()`.
- Dépend de la taille du batch : peu fiable avec des batchs de 1 à 4.

### Layer normalization

Même calcul, mais les statistiques sont prises **sur les features d'un seul exemple** au lieu du batch. Aucune dépendance au batch, comportement identique en train et en eval : c'est la normalisation des **Transformers** et des RNN.

| | BatchNorm | LayerNorm |
|---|---|---|
| Statistiques calculées sur | le batch, par canal | les features, par exemple |
| Dépend de la taille du batch | oui | non |
| Train ≠ eval | oui (moyennes mobiles) | non |
| Usage typique | CNN | Transformers, RNN |

::: quiz Quiz 3.2 — BatchNorm en évaluation
Un modèle avec BatchNorm donne d'excellents scores en validation pendant l'entraînement, mais des prédictions incohérentes en production, une image à la fois. Cause la plus probable ?
- [ ] Le dropout est trop fort
- [x] Le modèle n'a pas été mis en mode `eval()` : BatchNorm normalise avec les statistiques d'un batch d'une seule image
- [ ] Le weight decay est trop faible
> En mode train, BatchNorm calcule moyenne et variance sur le batch courant ; avec une seule image, ces statistiques n'ont aucun sens. En mode eval, il utilise les moyennes mobiles apprises. Toujours appeler model.eval() (et torch.no_grad()) pour l'inférence.
:::

## 7. Recette pratique

1. Commencer **sans régularisation** et vérifier que le modèle peut sur-apprendre (sinon : bug ou modèle trop petit).
2. Ajouter de l'**augmentation** de données si la modalité s'y prête.
3. Ajouter **weight decay** (AdamW, λ ≈ 0,01–0,05) et un peu de **dropout** sur les couches denses.
4. Utiliser l'**early stopping** sur la perte (ou la métrique) de validation.
5. Ne toucher au test qu'à la toute fin.

::: exo Exercice 1 — Diagnostic sur courbes
Pour chaque journal, donne le diagnostic et deux actions.
- (A) train 0,05 / validation 0,90 après 50 époques, la validation remontait depuis l'époque 12.
- (B) train 1,20 / validation 1,22, les deux stagnent depuis 30 époques.
- (C) train 0,40 / validation 0,30 en permanence, avec dropout 0,5.
?? Voir la solution
(A) **Surapprentissage** marqué : early stopping (garder l'époque 12), plus de régularisation (weight decay, dropout, augmentation), ou plus de données.
(B) **Sous-apprentissage** : augmenter la capacité (couches, largeur), entraîner avec un learning rate mieux réglé (souvent plus grand ou avec scheduler), réduire une régularisation excessive.
(C) Ce n'est pas un bug : la perte d'entraînement est mesurée **avec dropout actif** (réseau handicapé), la validation **sans**. Avec un dropout fort, train > validation est normal. Pour comparer à armes égales, recalcule la perte d'entraînement en mode eval.
:::

::: exo Exercice 2 — Weight decay à la main
Un poids vaut \(w = 2\) et son gradient de perte est nul pendant 100 pas (la donnée ne le justifie plus). Avec \(\eta = 0{,}1\) et \(\lambda = 0{,}01\), que vaut \(w\) après 100 pas ? Et sans weight decay ?
?? Voir la solution
Chaque pas multiplie \(w\) par \(1 - \eta\lambda = 0{,}999\). Après 100 pas : \(w = 2 \times 0{,}999^{100} \approx 2 \times 0{,}905 = 1{,}81\). Sans weight decay, \(w\) reste à 2 : rien ne le ramène vers 0. Le weight decay « oublie » lentement les poids que les données ne soutiennent plus.
:::

::: culture Culture & histoire
- **1943** — Andreï Tikhonov introduit la **régularisation** des problèmes mal posés, ancêtre de la pénalité L2.
- **2012–2014** — Geoffrey Hinton, Nitish Srivastava et al. proposent le **dropout** (article de référence au *JMLR* en 2014), qui contribue au succès d'AlexNet.
- **2015** — Sergey Ioffe et Christian Szegedy introduisent la **batch normalization** ; **2016** — Jimmy Ba, Jamie Kiros et Geoffrey Hinton la **layer normalization**.
- **2017** — Zhang et al., *Understanding deep learning requires rethinking generalization* : les réseaux peuvent mémoriser des labels aléatoires.
- **2019** — Ilya Loshchilov et Frank Hutter publient **AdamW** (weight decay découplé).
- [Dive into Deep Learning — Généralisation et dropout](https://d2l.ai/chapter_multilayer-perceptrons/dropout.html)
- [Documentation torchvision.transforms](https://pytorch.org/vision/stable/transforms.html)
:::

## Synthèse

::: note À retenir
- Capacité ≠ généralisation : un réseau peut mémoriser du bruit.
- **Weight decay** : décroissance multiplicative des poids ; avec Adam, utiliser **AdamW**.
- **Dropout** : désactivation aléatoire en train, tous les neurones en eval.
- **Early stopping** : garder la meilleure époque de validation.
- **Augmentation** : seulement sur le train, transformations qui préservent l'étiquette.
- **BatchNorm** (CNN) dépend du batch et a des moyennes mobiles ; **LayerNorm** (Transformers) non.
- `model.train()` pour entraîner, `model.eval()` + `torch.no_grad()` pour évaluer.
:::
