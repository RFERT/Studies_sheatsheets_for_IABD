---
title: Module 8 — Théorie de l'information
subtitle: Mesurer l'information, l'incertitude et la surprise. De la compression de données aux fonctions de perte des réseaux de neurones, l'entropie de Shannon est un pilier discret mais omniprésent de l'IA.
domains: DATA, BIG DATA, IA
objectifs: Comprendre l'information et l'entropie de Shannon ; connaître entropie croisée et divergence KL ; relier à l'arbre de décision (gain d'information) et aux fonctions de perte ; voir le lien avec la compression.
---

## 1. Information & surprise

::: def Quantité d'information
L'information d'un événement de probabilité \(p\) est \(I = -\log_2 p\) (en **bits**). Un événement **rare** (p petit) apporte **beaucoup** d'information (grande surprise) ; un événement certain (p=1) n'apporte rien (\(I=0\)).
:::

::: info Exemple
Une pièce équilibrée : chaque résultat a \(p=1/2\), donc \(I=-\log_2(1/2)=1\) bit. Apprendre le résultat d'un lancer = 1 bit d'information. Un dé à 8 faces : \(-\log_2(1/8)=3\) bits.
:::

::: quiz Quiz 1.1
Quel événement apporte le PLUS d'information ?
- [ ] un événement certain (p=1)
- [x] un événement très rare (p proche de 0)
- [ ] un événement à p=0,5
- [ ] tous apportent autant
> I = −log₂ p augmente quand p diminue. Un événement rare est très « surprenant » → beaucoup d'information. Le certain n'apprend rien (I=0).
:::

## 2. Entropie de Shannon ⭐

::: def Définition
L'**entropie** d'une variable \(X\) est l'information moyenne (l'incertitude) : \[ H(X) = -\sum_i p_i \log_2 p_i \] Mesurée en bits. Maximale quand tout est équiprobable (incertitude totale), nulle quand le résultat est certain.
:::

::: info Exemple
Pièce équilibrée : \(H=-(0{,}5\log_2 0{,}5 + 0{,}5\log_2 0{,}5)=1\) bit (max pour 2 issues).

Pièce truquée (p=0,9 / 0,1) : \(H\approx 0{,}47\) bit — moins d'incertitude, donc moins d'information moyenne, donc **plus compressible**.
:::

::: info BIG DATA Lien — compression
L'entropie est la **limite théorique** de compression (théorème de Shannon) : on ne peut pas compresser en dessous de \(H\) bits/symbole sans perte. Huffman, ZIP, codage arithmétique s'en approchent.
:::

::: quiz Quiz 2.1
L'entropie d'une variable est maximale quand…
- [x] toutes les issues sont équiprobables
- [ ] une issue est certaine
- [ ] il n'y a qu'une seule issue
- [ ] les probas sont très inégales
> L'incertitude (donc l'entropie) est maximale quand on ne peut rien prédire : équiprobabilité. Pour n issues, H_max = log₂ n.
:::

::: quiz Quiz 2.2
Un jeu de données très prévisible (une classe à 99 %) a une entropie…
- [ ] maximale
- [ ] infinie
- [x] faible (donc très compressible)
- [ ] négative
> Peu d'incertitude → faible entropie → forte compressibilité. Les données répétitives/prévisibles se compressent bien.
:::

## 3. Entropie croisée & divergence KL ⭐

::: def Entropie croisée
Pour une vraie distribution \(p\) et une distribution prédite \(q\) : \[ H(p,q) = -\sum_i p_i \log q_i \] C'est le « coût » d'utiliser \(q\) pour coder des données issues de \(p\). Minimale quand \(q=p\).
:::

::: def Divergence de Kullback-Leibler (KL)
\[ D_{KL}(p\,\|\,q) = \sum_i p_i \log\frac{p_i}{q_i} = H(p,q) - H(p) \ge 0 \] Mesure « combien \(q\) s'éloigne de \(p\) ». \(D_{KL}=0\) ssi \(q=p\). ⚠️ Non symétrique : \(D_{KL}(p\|q)\neq D_{KL}(q\|p)\).
:::

::: info IA Lien fondamental
La **cross-entropy est LA fonction de perte** de la classification (régression logistique, réseaux de neurones, softmax). Minimiser la cross-entropy = rapprocher les prédictions \(q\) de la vérité \(p\) = maximum de vraisemblance (Module 4). La KL apparaît dans les VAE, la distillation, le RLHF.
:::

::: quiz Quiz 3.1
En classification, minimiser la cross-entropy revient à…
- [ ] augmenter l'erreur
- [x] rapprocher les prédictions q de la vraie distribution p
- [ ] ignorer les labels
- [ ] maximiser l'entropie
> H(p,q) est minimale quand q=p. L'entraînement ajuste les prédictions q pour coller aux vrais labels p. C'est équivalent au maximum de vraisemblance.
:::

::: quiz Quiz 3.2
Quelle propriété a la divergence KL ?
- [ ] elle est symétrique
- [ ] elle peut être négative
- [ ] elle vaut toujours 1
- [x] elle est ≥ 0, nulle ssi q = p, et non symétrique
> D_KL(p‖q) ≥ 0 (inégalité de Gibbs), = 0 ⇔ q=p, et D_KL(p‖q) ≠ D_KL(q‖p) en général. Ce n'est donc pas une vraie distance.
:::

## 4. Information mutuelle

::: def Définition
L'**information mutuelle** \(I(X;Y) = H(X) - H(X\mid Y)\) mesure combien connaître \(Y\) réduit l'incertitude sur \(X\). \(I(X;Y)=0\) ssi \(X\) et \(Y\) sont indépendants.
:::

::: info DATA Lien
Sélection de features (garder les variables les plus informatives sur la cible), détection de dépendances non linéaires (là où la corrélation de Pearson échoue, Module 4).
:::

::: quiz Quiz 4.1
Si \(X\) et \(Y\) sont indépendants, leur information mutuelle vaut…
- [x] 0
- [ ] 1
- [ ] l'infini
- [ ] H(X)
> Indépendance ⇒ connaître Y n'apprend rien sur X ⇒ I(X;Y)=0. À l'inverse, forte dépendance = forte information mutuelle.
:::

## 5. Gain d'information (arbres de décision)

::: def Gain d'information
Lors de la construction d'un **arbre de décision**, on choisit à chaque nœud l'attribut qui maximise le **gain d'information** = réduction d'entropie après la séparation : \[ \text{Gain} = H(\text{avant}) - \sum_j \frac{n_j}{n} H(\text{branche}_j) \] On sépare là où l'on « purifie » le plus les classes.
:::

::: info IA Lien
ID3, C4.5, et le critère de Gini (proche) dans CART / Random Forest / arbres de gradient (XGBoost). L'entropie guide les meilleurs splits.
:::

::: quiz Quiz 5.1
Un arbre de décision choisit la séparation qui…
- [ ] augmente l'entropie
- [ ] choisit au hasard
- [x] maximise le gain d'information (réduit le plus l'entropie)
- [ ] minimise le nombre de branches
> On privilégie l'attribut qui rend les groupes les plus « purs » (faible entropie après split), donc le plus grand gain d'information.
:::

## 6. Domaines, usages & métiers

| Notion | Domaine | Usage | Métiers |
| --- | --- | --- | --- |
| Entropie | BIG DATA | Compression (ZIP, Huffman), limite théorique | Data Engineer, Systèmes |
| Cross-entropy | IA | Fonction de perte en classification | ML/DL Engineer |
| KL | IA | VAE, distillation, RLHF, régularisation | Research Scientist |
| Info mutuelle | DATA | Sélection de features | Data Scientist |
| Gain d'info | IA | Arbres de décision, Random Forest | Data Scientist, ML Eng. |

::: info Pour approfondir
[Entropie de Shannon](https://fr.wikipedia.org/wiki/Entropie_de_Shannon) [Entropie croisée](https://fr.wikipedia.org/wiki/Entropie_crois%C3%A9e) [Divergence KL](https://fr.wikipedia.org/wiki/Divergence_de_Kullback-Leibler) [Visual Information Theory (colah)](https://colah.github.io/posts/2015-09-Visual-Information/)
:::

## 7. Exercices de synthèse

::: exo Exercice 1 — Information
Quelle information (en bits) apporte le résultat d'un dé équilibré à 6 faces ?
?? Voir la solution
\(I = -\log_2(1/6) = \log_2 6 \approx 2{,}585\) bits. (Entre 2 bits pour 4 issues et 3 bits pour 8.)
:::

::: exo Exercice 2 — Entropie
Calcule l'entropie d'une source à 4 symboles équiprobables.
?? Voir la solution
\(H = -4\times\frac14\log_2\frac14 = \log_2 4 = 2\) bits. (On peut coder chaque symbole sur exactement 2 bits : 00, 01, 10, 11.)
:::

::: exo Exercice 3 — Cross-entropy (⭐)
Vrai label one-hot \(p=(1,0)\), prédiction \(q=(0{,}8,\ 0{,}2)\). Calcule la cross-entropy.
?? Voir la solution
\(H(p,q) = -[1\cdot\log 0{,}8 + 0\cdot\log 0{,}2] = -\log 0{,}8\). En log₂ : \(\approx 0{,}32\) bit. Si la prédiction avait été \(q=(0{,}99,0{,}01)\), la perte serait bien plus faible (bonne prédiction).
:::

::: exo Exercice 4 — Gain d'information (⭐⭐)
Pourquoi un attribut qui sépare parfaitement les classes a-t-il le gain d'information maximal ?
?? Voir la solution
Après une séparation parfaite, chaque branche ne contient qu'une seule classe → entropie de chaque branche = 0 → le terme soustrait \(\sum \frac{n_j}{n}H(\text{branche}_j)=0\). Le gain = \(H(\text{avant}) - 0 = H(\text{avant})\), c'est-à-dire le maximum possible. L'arbre privilégie donc ces splits « purs ».
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi.
En 1948, un seul article de 79 pages invente une science entière *et* le mot « **bit** ». Son auteur, Claude Shannon, y pose les fondations de toute notre ère numérique — de la sonde Voyager à la 5G, du ZIP au machine learning.

#### Les grands noms
- **Claude Shannon** (1916-2001) — *A Mathematical Theory of Communication* (1948) : entropie, bit, limites de compression et de transmission. Le « père de l'ère de l'information ».
- **Nyquist & Hartley** (années 1920) — précurseurs sur la capacité des canaux de communication.
- **David Huffman** (1925-1999) — le codage de Huffman (1952), inventé pour un devoir d'étudiant qu'il préférait à l'examen !
- **Richard Hamming** (1915-1998) — les codes correcteurs d'erreurs (1950), nés de sa frustration face aux cartes perforées.
- **Ludwig Boltzmann** (1844-1906) — l'entropie thermodynamique (*S = k·log W*, gravée sur sa tombe), cousine de celle de Shannon.

#### Le tournant décisif
L'entropie de Shannon fixe une **limite théorique infranchissable** à la compression (ZIP, JPEG, MP3) et à la transmission fiable des données. En machine learning, la *cross-entropy* (entropie croisée) est devenue la fonction de perte reine de la classification, et le *gain d'information* construit les arbres de décision.

#### Pourquoi ça te concerne
Compression, encodage, arbres de décision, fonction de perte des réseaux de neurones : l'entropie n'est pas une curiosité, c'est un outil que le data scientist manipule au quotidien.
- [Claude Shannon](https://fr.wikipedia.org/wiki/Claude_Shannon)
- [Entropie de Shannon](https://fr.wikipedia.org/wiki/Entropie_de_Shannon)
- [Codage de Huffman](https://fr.wikipedia.org/wiki/Codage_de_Huffman)
- [Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/)
:::
