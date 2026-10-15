---
title: Examen blanc final
subtitle: Partiel type, toutes notions mélangées (Modules 0 à 9). Mets-toi en conditions réelles : chrono, sans tes fiches d'abord, puis corrige-toi avec les solutions dépliables.
---

## Partie A — QCM express (20 questions, 1 pt chacune)

Une seule bonne réponse par question. Clique pour vérifier.

::: quiz [Module 0]
La négation de \(\forall x,\ \exists y,\ P(x,y)\) est…
- [ ] \(\forall x,\ \forall y,\ \neg P\)
- [ ] \(\exists x,\ \exists y,\ P\)
- [x] \(\exists x,\ \forall y,\ \neg P(x,y)\)
- [ ] \(\forall x,\ \exists y,\ \neg P\)
> On échange chaque quantificateur et on nie le prédicat.
:::

::: quiz [Module 1]
Une relation Réflexive + Symétrique + Transitive est une relation…
- [ ] d'ordre
- [x] d'équivalence
- [ ] totale
- [ ] antisymétrique
> RST = relation d'équivalence (ses classes forment une partition).
:::

::: quiz [Module 1]
Dans \((\mathbb N, \mid)\), que vaut \(\inf\{12,18\}\) (le meet) ?
- [x] 6 (pgcd)
- [ ] 36 (ppcm)
- [ ] 3
- [ ] 216
> Le meet dans l'ordre de divisibilité est le pgcd : pgcd(12,18)=6.
:::

::: quiz [Module 2]
Deux vecteurs non nuls vérifient \(\mathbf u\cdot\mathbf v=0\). Ils sont…
- [ ] égaux
- [ ] colinéaires
- [ ] de même norme
- [x] orthogonaux
> Produit scalaire nul ⇒ cos θ = 0 ⇒ angle droit ⇒ orthogonaux.
:::

::: quiz [Module 2]
En PCA, les premières composantes principales correspondent aux directions de…
- [ ] plus faible variance
- [ ] corrélation nulle
- [x] plus grande variance
- [ ] moyenne maximale
> La PCA garde les axes orthogonaux de plus grande variance (plus d'information).
:::

::: quiz [Module 2]
\(A\mathbf v=\lambda\mathbf v\) (\(\mathbf v\neq 0\)) : \(\mathbf v\) est un…
- [ ] scalaire
- [ ] déterminant
- [x] vecteur propre (valeur propre λ)
- [ ] gradient
> Direction préservée par A, étirée d'un facteur λ : vecteur propre.
:::

::: quiz [Module 3]
\(A,B\) indépendants, \(P(A)=0{,}3\), \(P(B)=0{,}5\). \(P(A\cap B)=\)
- [ ] 0,8
- [x] 0,15
- [ ] 0,2
- [ ] 0
> Indépendance : P(A∩B)=P(A)·P(B)=0,3×0,5=0,15.
:::

::: quiz [Module 3]
La loi décrivant « le nombre de succès sur n essais indépendants » est…
- [x] binomiale
- [ ] normale
- [ ] uniforme
- [ ] géométrique
> n essais, p de succès → binomiale B(n,p), espérance np.
:::

::: quiz [Module 3]
Le théorème central limite affirme que la moyenne d'un grand échantillon est approximativement…
- [ ] uniforme
- [ ] de Poisson
- [x] normale
- [ ] exponentielle
> TCL : X̄ₙ ≈ N(μ, σ²/n), quelle que soit la loi de départ.
:::

::: quiz [Module 4]
Une p-value de 0,02 (seuil α=0,05) conduit à…
- [ ] garder H₀
- [ ] dire que H₀ a 2 % de chances d'être vraie
- [ ] ne rien conclure
- [x] rejeter H₀
> 0,02 < 0,05 → on rejette H₀. (La p-value n'est pas P(H₀ vraie).)
:::

::: quiz [Module 4]
Pour diviser par 2 la largeur d'un intervalle de confiance, on multiplie n par…
- [x] 4
- [ ] 2
- [ ] 8
- [ ] 16
> Largeur ∝ 1/√n : diviser par 2 demande n ×4.
:::

::: quiz [Module 5]
Le gradient \(\nabla f\) pointe vers…
- [ ] la plus forte diminution
- [x] la plus forte augmentation
- [ ] l'origine
- [ ] un minimum
> ∇f = montée la plus raide. On minimise en allant vers −∇f.
:::

::: quiz [Module 5]
Dans \(\theta\leftarrow\theta-\eta\nabla J\), un \(\eta\) beaucoup trop grand provoque…
- [ ] une convergence rapide et sûre
- [ ] rien de spécial
- [x] oscillations / divergence
- [ ] un gradient nul
> Pas trop grand = on dépasse le minimum à chaque étape → ça diverge.
:::

::: quiz [Module 6]
Pour un plus court chemin pondéré (poids ≥ 0), on utilise…
- [ ] BFS
- [x] Dijkstra
- [ ] DFS
- [ ] un tri
> Dijkstra pour poids positifs. BFS seulement pour non pondéré.
:::

::: quiz [Module 6]
PageRank est mathématiquement…
- [ ] un plus court chemin
- [ ] une moyenne de degrés
- [x] le vecteur propre dominant de la matrice de transition
- [ ] un tri topologique
> r = Mr : vecteur propre (λ=1), calculé par power iteration.
:::

::: quiz [Module 7]
Choisir 3 personnes parmi 10 (sans rôle) : combien de façons ?
- [ ] 720
- [x] 120
- [ ] 30
- [ ] 1000
> Ordre indifférent → C(10,3)=120.
:::

::: quiz [Module 7]
La recherche dichotomique a une complexité…
- [ ] O(n)
- [ ] O(n²)
- [x] O(log n)
- [ ] O(1)
> On divise l'espace par 2 à chaque étape : O(log n).
:::

::: quiz [Module 8]
L'entropie de Shannon est maximale quand les issues sont…
- [x] équiprobables
- [ ] certaines
- [ ] au nombre de 1
- [ ] très inégales
> Incertitude max = équiprobabilité (H_max = log₂ n).
:::

::: quiz [Module 8]
En classification, la fonction de perte standard est…
- [ ] la variance
- [ ] la distance de Jaccard
- [ ] le déterminant
- [x] l'entropie croisée (cross-entropy)
> Cross-entropy H(p,q), minimale quand q=p. Équivaut au maximum de vraisemblance.
:::

::: quiz [Module 9]
Un filtre de Bloom ne commet jamais…
- [ ] de faux positif
- [x] de faux négatif
- [ ] d'erreur du tout
- [ ] de collision
> Bloom : faux positifs possibles, faux négatifs impossibles. « Absent » est toujours certain.
:::

## Partie B — Exercices rédigés (5 exercices, 8 pts chacun)

::: exo Exercice B1 — Ensembles & preuve [Modules 0-1] /8
Soit \(\sim\) définie sur \(\mathbb Z\) par \(a\sim b \Leftrightarrow 5\mid(a-b)\).

**a)** Montre que \(\sim\) est une relation d'équivalence. **b)** Combien de classes ? Décris-les. **c)** À quelle notion du Big Data (Module 9) cela se relie-t-il ?
?? Voir la solution
**a)** *Réflexive* : \(5\mid(a-a)=0\) ✔. *Symétrique* : \(5\mid(a-b)\Rightarrow 5\mid(b-a)\) ✔. *Transitive* : \(5\mid(a-b)\) et \(5\mid(b-c)\Rightarrow 5\mid(a-c)\) (somme) ✔. Donc équivalence.

**b)** **5 classes** : \([0],[1],[2],[3],[4]\) selon le reste modulo 5. C'est \(\mathbb Z/5\mathbb Z\).

**c)** Le **sharding** par \(h(\text{clé})\bmod 5\) répartit les données en 5 partitions : exactement ces classes de congruence.
:::

::: exo Exercice B2 — Algèbre linéaire [Module 2] /8
Soit \(A=\begin{pmatrix}3&1\\0&2\end{pmatrix}\).

**a)** Calcule \(\det(A)\). **b)** \(A\) est-elle inversible ? **c)** Trouve ses valeurs propres. **d)** Calcule \(A\mathbf x\) pour \(\mathbf x=(2,1)\).
?? Voir la solution
**a)** \(\det(A)=3\times2-1\times0=6\).

**b)** \(\det\neq0\) ⇒ **inversible**.

**c)** Matrice triangulaire ⇒ valeurs propres = diagonale : \(\lambda_1=3,\ \lambda_2=2\).

**d)** \(A\mathbf x=\begin{pmatrix}3\cdot2+1\cdot1\\0\cdot2+2\cdot1\end{pmatrix}=\begin{pmatrix}7\\2\end{pmatrix}\).
:::

::: exo Exercice B3 — Probabilités & Bayes [Module 3] /8
Un filtre anti-spam : 40 % des mails sont du spam. Le mot « gratuit » apparaît dans 60 % des spams et 5 % des mails légitimes. Un mail contient « gratuit ».

**a)** Quelle est la probabilité qu'il soit du spam ? **b)** Nomme la méthode utilisée.
?? Voir la solution
**a)** \(P(S)=0{,}4\), \(P(G\mid S)=0{,}6\), \(P(G\mid \bar S)=0{,}05\).

\(P(G)=0{,}6\times0{,}4 + 0{,}05\times0{,}6 = 0{,}24 + 0{,}03 = 0{,}27\).

\(P(S\mid G)=\dfrac{0{,}24}{0{,}27}\approx \mathbf{0{,}889}\) soit ~88,9 %.

**b)** **Théorème de Bayes** (principe du classifieur Naive Bayes).
:::

::: exo Exercice B4 — Optimisation [Module 5] /8
Soit \(J(\theta)=(\theta-4)^2\), learning rate \(\eta=0{,}25\), départ \(\theta_0=0\).

**a)** Donne \(\nabla J\). **b)** Effectue 2 itérations de descente de gradient. **c)** Vers quelle valeur converge-t-on et pourquoi ?
?? Voir la solution
**a)** \(\nabla J = 2(\theta-4)\).

**b)** \(\theta_1=0-0{,}25\cdot2(0-4)=0+2=2\). \(\theta_2=2-0{,}25\cdot2(2-4)=2+1=3\).

**c)** On converge vers \(\theta=4\) (le minimum, où \(\nabla J=0\)). \(J\) est convexe ⇒ ce minimum est global.
:::

::: exo Exercice B5 — Information & complexité [Modules 7-8] /8
**a)** Calcule l'entropie d'une source à 8 symboles équiprobables. **b)** Combien de bits pour coder chaque symbole ? **c)** Un algo fait une double boucle sur \(n\) données : complexité ? Est-ce viable pour \(n=10^9\) ?
?? Voir la solution
**a)** \(H=\log_2 8 = 3\) bits.

**b)** 3 bits/symbole (000 à 111) : l'entropie donne la limite de compression.

**c)** Double boucle = \(O(n^2)\). Pour \(n=10^9\) : \(10^{18}\) opérations ⇒ **infaisable**. Il faut un algo en \(O(n)\) ou \(O(n\log n)\).
:::

## Partie C — Problème transversal Data (/20)

::: info Contexte
Tu es Data Engineer. Tu dois dédupliquer et analyser **1 milliard** de documents textuels, trouver les quasi-doublons, compter les utilisateurs uniques, et préparer les données pour un modèle de classification.
:::

**C1.** [Module 9] Pour éviter des lectures disque inutiles en vérifiant si un document a déjà été vu, quelle structure utilises-tu, et quel type d'erreur accepte-t-elle ? /4

**C2.** [Module 9] Pour mesurer la similarité entre deux documents (vus comme ensembles de mots), quel indice ? Pour l'estimer à grande échelle sans comparer les ensembles entiers, quelle technique ? /4

**C3.** [Module 9] Pour compter les utilisateurs uniques sur 1 milliard d'événements avec peu de mémoire ? /3

**C4.** [Modules 2-8] Les documents sont vectorisés (TF-IDF). Quelle mesure pour leur similarité de direction ? Quelle fonction de perte pour le classifieur final ? /5

**C5.** [Modules 1-9] En MapReduce, l'étape Shuffle regroupe les paires par clé. À quelle notion mathématique du cours cela correspond-il ? /4

::: exo Exercice
?? Voir la correction complète
**C1.** Un **filtre de Bloom** : il répond « absent » de façon certaine (on évite la lecture disque) et « probablement présent » sinon. Il accepte les **faux positifs** (jamais de faux négatif).

**C2.** L'**indice de Jaccard** \(J=|A\cap B|/|A\cup B|\). Pour l'estimer à l'échelle : **MinHash** (signatures compactes, car \(P(\min h(A)=\min h(B))=J\)), éventuellement combiné à **LSH** pour ne comparer que les candidats proches.

**C3.** **HyperLogLog** : estime la cardinalité (distincts) avec ~quelques Ko et ~2 % d'erreur.

**C4.** La **similarité cosinus** \(\frac{\mathbf u\cdot\mathbf v}{\|\mathbf u\|\|\mathbf v\|}\) pour la proximité de direction (insensible à la longueur). Pour le classifieur : l'**entropie croisée** (cross-entropy).

**C5.** Le Shuffle regroupe par clé = construit les classes de la **relation d'équivalence** « avoir la même clé » = une **partition** (Module 1). Reduce agrège ensuite chaque classe.

**Bilan :** ce problème seul mobilise les Modules 1, 2, 8 et 9 — c'est tout l'intérêt du cours : les maths s'enchaînent.
:::

## Barème & auto-évaluation

| Score /80 | Niveau | Conseil |
| --- | --- | --- |
| ≥ 68 (85 %) | 🏆 Excellent — tu passes haut la main | Révise juste les fiches la veille |
| 56–67 (70-84 %) | ✅ Solide | Cible les 2-3 modules les plus faibles |
| 40–55 (50-69 %) | 🟡 À consolider | Reprends les modules ratés + leurs quiz |
| < 40 | 🔴 Rattrapage nécessaire | Refais les Modules 0-1-2-3 dans l'ordre |

::: info Repère tes points faibles
Chaque question indique son module entre crochets [Module X]. Note les numéros ratés, identifie les modules récurrents, et retourne faire leurs quiz et exercices. La répétition espacée (revoir à J+1, J+3, J+7) est ta meilleure alliée.
:::
