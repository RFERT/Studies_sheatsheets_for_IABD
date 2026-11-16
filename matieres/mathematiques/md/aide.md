---
title: Antisèche Mathématiques pour la Data & l'IA
subtitle: Logique, relations, matrices, probas, stats, optimisation, graphes, complexité, information, Big Data et combinatoire — toutes les formules clés.
domains: DATA, BIG DATA, IA
tags: matrices, déterminant, valeurs propres, SVD, combinatoire, Bayes, lois, tests, gradient, entropie, Bloom
niveau: Révision express
---

Mémo des 11 modules de maths (0 à 10). Les cartes **Matrices** et **Combinatoire** sont volontairement détaillées. Pour les démonstrations et exercices → [cours de maths](matieres/mathematiques/index.html) ; version interactive filtrable → [aide-mémoire maths](matieres/mathematiques/aide-memoire.html).

## Logique

| \(P\) | \(Q\) | \(P \Rightarrow Q\) |
|---|---|---|
| V | V | V |
| V | F | **F** |
| F | V | V |
| F | F | V |

- \(P \Rightarrow Q \equiv \neg P \lor Q \equiv \neg Q \Rightarrow \neg P\) (**contraposée**). La **réciproque** \(Q \Rightarrow P\) n'est **pas** équivalente.
- De Morgan : \(\neg(P \land Q) \equiv \neg P \lor \neg Q\), \(\neg(P \lor Q) \equiv \neg P \land \neg Q\).
- Négation : \(\neg(\forall x,\, P(x)) \equiv \exists x,\, \neg P(x)\) ; \(\neg(\exists x,\, P(x)) \equiv \forall x,\, \neg P(x)\).
- Négation de \(P \Rightarrow Q\) : \(P \land \neg Q\).

## Ensembles, applications, preuves

- \(\lvert A \cup B\rvert = \lvert A\rvert + \lvert B\rvert - \lvert A \cap B\rvert\) ; \(\lvert \mathcal P(E)\rvert = 2^{\lvert E\rvert}\) ; \(\lvert A \times B\rvert = \lvert A\rvert \cdot \lvert B\rvert\).
- \(f : E \to F\) **injective** : \(f(x)=f(y) \Rightarrow x=y\) ; **surjective** : tout \(y\) a un antécédent ; **bijective** : les deux (inversible).
- Ensembles finis : injection \(\Rightarrow \lvert E\rvert \le \lvert F\rvert\) ; surjection \(\Rightarrow \lvert E\rvert \ge \lvert F\rvert\).
- **Récurrence** : initialisation \(P(n_0)\) + hérédité \(P(n) \Rightarrow P(n+1)\) ⟹ \(\forall n \ge n_0,\, P(n)\).
- Autres preuves : directe, contraposée, absurde, contre-exemple (pour réfuter un « pour tout »).

## Relations binaires

| Propriété | Définition |
|---|---|
| Réflexive | \(\forall x,\ x R x\) |
| Symétrique | \(x R y \Rightarrow y R x\) |
| Antisymétrique | \(x R y \land y R x \Rightarrow x = y\) |
| Transitive | \(x R y \land y R z \Rightarrow x R z\) |

- **Équivalence** = réflexive + symétrique + transitive → partition en **classes**.
- **Ordre** = réflexive + antisymétrique + transitive ; **total** si deux éléments sont toujours comparables.
- Matrice d'adjacence \(M\) : réflexive ⇔ diagonale de 1 ; symétrique ⇔ \(M = M^\top\).

## Vecteurs, produit scalaire, cosinus

\[ u \cdot v = \sum_i u_i v_i = \lVert u\rVert\,\lVert v\rVert \cos\theta \qquad \lVert u\rVert_2 = \sqrt{u \cdot u} \]
\[ \cos(u, v) = \frac{u \cdot v}{\lVert u\rVert\,\lVert v\rVert} \in [-1, 1] \]

- \(u \cdot v = 0\) ⇔ orthogonaux. Normes : \(\lVert u\rVert_1 = \sum \lvert u_i\rvert\), \(\lVert u\rVert_\infty = \max \lvert u_i\rvert\).
- Famille **libre** : \(\sum \lambda_i v_i = 0 \Rightarrow\) tous les \(\lambda_i = 0\). **Base** = libre + génératrice ; dimension = nombre de vecteurs d'une base.

## Matrices : calcul ★

- Produit : \(A\) \((m \times n)\) · \(B\) \((n \times p)\) = \(C\) \((m \times p)\), avec \(c_{ij} = \sum_{k=1}^{n} a_{ik} b_{kj}\) (ligne \(i\) de \(A\) · colonne \(j\) de \(B\)).
- **Non commutatif** : en général \(AB \ne BA\) (même quand les deux existent). Associatif, distributif.
- \((AB)^\top = B^\top A^\top\) ; \((AB)^{-1} = B^{-1} A^{-1}\) (ordre **inversé**).
- \(AB = 0\) n'implique **pas** \(A = 0\) ou \(B = 0\).
- Trace : \(\operatorname{tr}(A) = \sum a_{ii}\), \(\operatorname{tr}(AB) = \operatorname{tr}(BA)\).

| Matrice | Propriété |
|---|---|
| Identité \(I\) | \(AI = IA = A\) |
| Diagonale | puissances faciles : \(D^k\) = diagonale des \(d_i^k\) |
| Symétrique | \(A^\top = A\) |
| Orthogonale | \(Q^\top Q = I\), donc \(Q^{-1} = Q^\top\) (rotations, symétries) |

## Déterminant & inverse ★

\[ \det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc \qquad \begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{ad-bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix} \]

- 3×3 : **Sarrus** ou développement selon une ligne/colonne : \(\det A = \sum_j (-1)^{i+j} a_{ij} \det A_{ij}\).
- \(\det(AB) = \det A \cdot \det B\) ; \(\det(A^\top) = \det A\) ; \(\det(A^{-1}) = 1/\det A\) ; \(\det(\lambda A) = \lambda^n \det A\) (\(A\) de taille \(n\)).
- Triangulaire : produit des termes diagonaux.
- Échanger deux lignes → change le signe ; ajouter à une ligne un multiple d'une autre → ne change rien ; deux lignes proportionnelles → \(\det = 0\).
- \(A\) **inversible** ⇔ \(\det A \ne 0\) ⇔ \(\operatorname{rg} A = n\) ⇔ colonnes libres ⇔ \(Ax = 0\) n'a que la solution nulle.
- Interprétation : \(\lvert\det A\rvert\) = facteur de changement d'aire/volume.

## Systèmes linéaires & rang ★

- \(Ax = b\) se résout par **pivot de Gauss** : échelonner \([A \mid b]\), puis remonter.
- **Rang** = nombre de pivots = dimension de l'image = nombre max de colonnes (ou lignes) libres.
- **Théorème du rang** : \(\operatorname{rg} A + \dim \ker A = n\) (nombre de colonnes).

| Situation (A carrée n×n) | Solutions |
|---|---|
| \(\det A \ne 0\) | une **unique** : \(x = A^{-1}b\) |
| \(\det A = 0\), système compatible | une **infinité** |
| \(\det A = 0\), incompatible | **aucune** |

::: tip
En pratique numérique, on ne calcule jamais \(A^{-1}\) pour résoudre : on factorise (LU, QR) — `np.linalg.solve`.
:::

## Valeurs & vecteurs propres ★

\[ A v = \lambda v,\ v \ne 0 \quad\Longleftrightarrow\quad \det(A - \lambda I) = 0 \]

- Méthode : polynôme caractéristique → racines \(\lambda\) → pour chaque \(\lambda\), résoudre \((A - \lambda I)v = 0\).
- \(\operatorname{tr} A = \sum \lambda_i\) ; \(\det A = \prod \lambda_i\) (avec multiplicités). Triangulaire : valeurs propres = diagonale.
- **Diagonalisation** : \(A = P D P^{-1}\) (colonnes de \(P\) = vecteurs propres) ⟹ \(A^k = P D^k P^{-1}\).
- \(n\) valeurs propres **distinctes** ⇒ diagonalisable.
- **Théorème spectral** : \(A\) symétrique réelle ⇒ valeurs propres réelles et \(A = Q D Q^\top\) avec \(Q\) orthogonale.

::: example 2×2 express
\(A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}\) : \(\lambda^2 - 4\lambda + 3 = 0\) ⟹ \(\lambda \in \{1, 3\}\) ; vecteurs propres \((1, -1)\) et \((1, 1)\). Vérif : trace 4 = 1+3, det 3 = 1×3.
:::

## SVD & PCA ★

\[ A = U \Sigma V^\top \]

- \(U\), \(V\) orthogonales ; \(\Sigma\) diagonale des **valeurs singulières** \(\sigma_1 \ge \sigma_2 \ge \dots \ge 0\) = racines des valeurs propres de \(A^\top A\). Existe pour **toute** matrice (même rectangulaire).
- Meilleure approximation de rang \(k\) : garder les \(k\) plus grandes \(\sigma_i\) (Eckart–Young) → compression, débruitage, recommandation.
- **PCA** : centrer \(X\) → covariance \(C = \frac{1}{n-1} X^\top X\) → vecteurs propres = axes principaux, valeurs propres = variances expliquées.
- Part de variance de la composante \(k\) : \(\lambda_k / \sum_i \lambda_i\).

## Combinatoire : les 4 modèles ★

Tirer \(k\) objets parmi \(n\) :

| | Ordre compte | Ordre ne compte pas |
|---|---|---|
| **Sans** remise | \(A_n^k = \dfrac{n!}{(n-k)!}\) | \(\dbinom{n}{k} = \dfrac{n!}{k!\,(n-k)!}\) |
| **Avec** remise | \(n^k\) | \(\dbinom{n+k-1}{k}\) |

- Permutations de \(n\) objets : \(n!\). Anagrammes avec répétitions (\(n_1 + \dots + n_r = n\)) : \(\dfrac{n!}{n_1!\, n_2! \cdots n_r!}\) — ex. MISSISSIPPI : \(\frac{11!}{1!\,4!\,4!\,2!} = 34\,650\).
- Principe **multiplicatif** (étapes successives : ×) ; **additif** (cas disjoints : +).

::: tip Réflexe
1) L'ordre compte-t-il ? 2) Y a-t-il répétition/remise ? → la bonne case du tableau. Mot de passe = ordre + répétition ; main de cartes = sans ordre, sans remise.
:::

## Binôme, Pascal & identités ★

\[ (a+b)^n = \sum_{k=0}^{n} \binom{n}{k} a^k b^{n-k} \qquad \binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k} \]

- \(\binom{n}{k} = \binom{n}{n-k}\) ; \(\sum_{k} \binom{n}{k} = 2^n\) ; \(\sum_k (-1)^k \binom{n}{k} = 0\) (\(n \ge 1\)).
- Vandermonde : \(\sum_{j} \binom{m}{j}\binom{n}{k-j} = \binom{m+n}{k}\).
- \(k\binom{n}{k} = n\binom{n-1}{k-1}\) (« choisir un comité puis son président »).
- Multinôme : \((x_1 + \dots + x_r)^n = \sum \frac{n!}{n_1! \cdots n_r!}\, x_1^{n_1}\cdots x_r^{n_r}\).

## Étoiles & barres, surjections ★

- Solutions de \(x_1 + \dots + x_r = n\) avec \(x_i \ge 0\) : \(\dbinom{n+r-1}{r-1}\) ; avec \(x_i \ge 1\) : \(\dbinom{n-1}{r-1}\).
- = ranger \(n\) boules **identiques** dans \(r\) boîtes **distinctes**.
- Nombre de **surjections** d'un ensemble à \(n\) éléments sur un ensemble à \(k\) éléments :
\[ \text{Surj}(n, k) = \sum_{i=0}^{k} (-1)^i \binom{k}{i} (k-i)^n = k!\, S(n, k) \]

## Inclusion-exclusion & dérangements ★

\[ \lvert A_1 \cup \dots \cup A_n\rvert = \sum \lvert A_i\rvert - \sum_{i<j} \lvert A_i \cap A_j\rvert + \sum_{i<j<k} \lvert A_i \cap A_j \cap A_k\rvert - \dots \]

- **Dérangements** (permutations sans point fixe) :
\[ D_n = n! \sum_{k=0}^{n} \frac{(-1)^k}{k!} \approx \frac{n!}{e}, \qquad D_n = (n-1)(D_{n-1} + D_{n-2}) \]
- \(D_1 = 0,\ D_2 = 1,\ D_3 = 2,\ D_4 = 9,\ D_5 = 44\). Probabilité qu'aucune lettre n'arrive dans la bonne enveloppe → \(1/e \approx 0{,}368\).
- **Tiroirs** : \(n+1\) objets dans \(n\) tiroirs ⇒ un tiroir contient au moins 2 objets (généralisé : au moins \(\lceil N/n \rceil\)).

## Catalan, Stirling, Bell

| Suite | Formule | Premiers termes | Compte… |
|---|---|---|---|
| Catalan \(C_n\) | \(\frac{1}{n+1}\binom{2n}{n}\) | 1, 1, 2, 5, 14, 42 | parenthésages bien formés, arbres binaires |
| Stirling 2ᵉ espèce \(S(n,k)\) | \(S(n,k) = k\,S(n-1,k) + S(n-1,k-1)\) | \(S(4,2) = 7\) | partitions en \(k\) blocs non vides |
| Bell \(B_n\) | \(\sum_k S(n,k)\) | 1, 1, 2, 5, 15, 52 | toutes les partitions d'un ensemble |

## Probabilités ★

- \(P(A \cup B) = P(A) + P(B) - P(A \cap B)\) ; \(P(\bar A) = 1 - P(A)\).
- Conditionnelle : \(P(A \mid B) = \dfrac{P(A \cap B)}{P(B)}\). Indépendance : \(P(A \cap B) = P(A)P(B)\).
- Probabilités totales : \(P(B) = \sum_i P(B \mid A_i) P(A_i)\) (\(A_i\) partition).

\[ \textbf{Bayes : } P(A \mid B) = \frac{P(B \mid A)\, P(A)}{P(B)} \]

::: warn
Test à 99 % de sensibilité, maladie à 1 % de prévalence, 5 % de faux positifs : \(P(\text{malade} \mid +) = \frac{0{,}99 \times 0{,}01}{0{,}99 \times 0{,}01 + 0{,}05 \times 0{,}99} \approx 17\,\%\). Ne pas confondre \(P(A \mid B)\) et \(P(B \mid A)\).
:::

## Lois usuelles

| Loi | \(P\) / densité | \(E\) | \(V\) |
|---|---|---|---|
| Bernoulli \(\mathcal B(p)\) | \(P(1) = p\) | \(p\) | \(p(1-p)\) |
| Binomiale \(\mathcal B(n,p)\) | \(\binom{n}{k}p^k(1-p)^{n-k}\) | \(np\) | \(np(1-p)\) |
| Géométrique (1er succès) | \((1-p)^{k-1}p\) | \(1/p\) | \((1-p)/p^2\) |
| Poisson \(\mathcal P(\lambda)\) | \(e^{-\lambda}\lambda^k/k!\) | \(\lambda\) | \(\lambda\) |
| Uniforme \([a,b]\) | \(1/(b-a)\) | \((a+b)/2\) | \((b-a)^2/12\) |
| Exponentielle \(\mathcal E(\lambda)\) | \(\lambda e^{-\lambda x}\) | \(1/\lambda\) | \(1/\lambda^2\) |
| Normale \(\mathcal N(\mu,\sigma^2)\) | cloche | \(\mu\) | \(\sigma^2\) |

- \(E(aX+b) = aE(X)+b\) ; \(V(aX+b) = a^2 V(X)\) ; \(V(X) = E(X^2) - E(X)^2\).
- \(V(X+Y) = V(X) + V(Y)\) **si indépendantes** (sinon \(+ 2\,\mathrm{Cov}(X,Y)\)).

## LGN & TCL

- **Loi des grands nombres** : la moyenne empirique \(\bar X_n \to \mu\).
- **TCL** : \(\dfrac{\bar X_n - \mu}{\sigma/\sqrt n} \to \mathcal N(0, 1)\) quelle que soit la loi (variance finie).
- Normale : 68 % dans \(\mu \pm \sigma\), 95 % dans \(\mu \pm 1{,}96\sigma\), 99,7 % dans \(\mu \pm 3\sigma\).

## Statistiques ★

- Variance empirique sans biais : \(s^2 = \frac{1}{n-1}\sum (x_i - \bar x)^2\). Médiane et IQR : **robustes** aux outliers.
- \(\mathrm{Cov}(X,Y) = E[(X-\mu_X)(Y-\mu_Y)]\) ; \(r = \dfrac{\mathrm{Cov}(X,Y)}{\sigma_X \sigma_Y} \in [-1, 1]\) — mesure une relation **linéaire** ; corrélation ≠ causalité.
- IC à 95 % d'une moyenne (n grand) : \(\bar x \pm 1{,}96\, \dfrac{s}{\sqrt n}\).
- **p-value** = probabilité, **sous H₀**, d'observer un résultat au moins aussi extrême. \(p < \alpha\) ⇒ on rejette H₀. Ce n'est **pas** \(P(H_0 \text{ vraie})\).
- Erreur type I = rejeter H₀ à tort (\(\alpha\)) ; type II = ne pas la rejeter à tort (\(\beta\)) ; puissance = \(1 - \beta\).
- Régression : \(\hat\beta_1 = \mathrm{Cov}(x,y)/V(x)\), \(\hat\beta_0 = \bar y - \hat\beta_1 \bar x\).
- **MLE** : choisir \(\theta\) maximisant \(\log L(\theta) = \sum \log f(x_i; \theta)\) (ex. Bernoulli : \(\hat p = \bar x\)).

## Optimisation ★

- Dérivées : \((x^n)' = n x^{n-1}\), \((e^x)' = e^x\), \((\ln x)' = 1/x\), \((uv)' = u'v + uv'\), \((f \circ g)' = g' \cdot f' \circ g\).
- Sigmoïde : \(\sigma'(z) = \sigma(z)(1 - \sigma(z))\).
- **Gradient** \(\nabla f\) = vecteur des dérivées partielles, pointe vers la **plus forte montée**.
- **Convexe** : tout minimum local est global (MSE linéaire, log-loss logistique) ; Hessienne semi-définie positive.

\[ \theta_{t+1} = \theta_t - \eta\, \nabla f(\theta_t) \]

- SGD / mini-batch, **momentum**, **Adam** ; learning rate trop grand → divergence.
- **Chain rule** = rétropropagation : \(\dfrac{\partial L}{\partial w} = \dfrac{\partial L}{\partial \hat y}\cdot\dfrac{\partial \hat y}{\partial z}\cdot\dfrac{\partial z}{\partial w}\).

## Graphes

- Somme des degrés \(= 2\lvert E\rvert\) (lemme des poignées de main). Arbre à \(n\) sommets : \(n - 1\) arêtes, connexe, sans cycle.
- Représentation : matrice d'adjacence \(O(V^2)\) (dense) vs listes d'adjacence \(O(V+E)\) (creux). \((A^k)_{ij}\) = nombre de chemins de longueur \(k\) de \(i\) à \(j\).

| Algorithme | Usage | Complexité |
|---|---|---|
| BFS (file) | plus court chemin **non pondéré** | \(O(V+E)\) |
| DFS (pile) | connexité, cycles, tri topologique | \(O(V+E)\) |
| Dijkstra | poids **≥ 0** | \(O((V+E)\log V)\) avec tas |
| Bellman-Ford | poids négatifs, détecte cycles négatifs | \(O(VE)\) |

- **PageRank** : \(PR(i) = \frac{1-d}{N} + d \sum_{j \to i} \frac{PR(j)}{\text{out}(j)}\), \(d \approx 0{,}85\).

## Complexité

| Notation | Exemple |
|---|---|
| \(O(1)\) | accès tableau, dict/hash |
| \(O(\log n)\) | recherche dichotomique |
| \(O(n)\) | parcours |
| \(O(n \log n)\) | tri fusion, tri optimal par comparaisons |
| \(O(n^2)\) | double boucle |
| \(O(2^n)\), \(O(n!)\) | sous-ensembles, permutations (force brute) |

- P ⊆ NP ; NP-complet (SAT, voyageur de commerce décisionnel) ; P = NP ? reste ouvert.

## Théorie de l'information ★

\[ H(X) = -\sum_x p(x)\log_2 p(x) \qquad H(p, q) = -\sum_x p(x)\log q(x) \]
\[ D_{KL}(p \,\Vert\, q) = \sum_x p(x)\log\frac{p(x)}{q(x)} = H(p,q) - H(p) \ge 0 \]

- Surprise d'un évènement : \(-\log_2 p\) bits. Entropie max = \(\log_2 n\) (loi uniforme), min = 0 (certain).
- KL **non symétrique**, nulle ⇔ \(p = q\). Minimiser l'entropie croisée = minimiser KL = log-loss.
- Information mutuelle \(I(X;Y) = H(X) - H(X \mid Y) \ge 0\), nulle ⇔ indépendance.
- **Gain d'information** (arbres) : \(H(\text{parent}) - \sum \frac{n_i}{n} H(\text{enfant}_i)\).

## Maths du Big Data

| Structure | Répond à | Formule clé |
|---|---|---|
| Filtre de **Bloom** (m bits, k hachages, n éléments) | « x ∈ S ? » (faux positifs possibles, **jamais** de faux négatifs) | \(p \approx (1 - e^{-kn/m})^k\), \(k^* = \frac{m}{n}\ln 2\) |
| **HyperLogLog** (m registres) | nombre d'éléments **distincts** | erreur relative \(\approx 1{,}04/\sqrt m\) |
| **MinHash** | similarité de Jaccard | \(P[\min h(A) = \min h(B)] = J(A,B)\) |
| **LSH** (b bandes de r lignes) | paires candidates similaires | \(P(\text{candidat}) = 1 - (1 - s^r)^b\) |

- Jaccard : \(J(A, B) = \dfrac{\lvert A \cap B\rvert}{\lvert A \cup B\rvert}\).
- **Paradoxe des anniversaires** : collisions de hachage probables dès \(\approx \sqrt{N}\) éléments (≈ 23 personnes pour 365 jours → 50 %).
- MapReduce : **map** (clé, valeur) → **shuffle** (regroupe par clé) → **reduce** (agrège).

## Trous à réviser

- \((AB)^{-1}\) = ==\(B^{-1}A^{-1}\)== et \((AB)^\top\) = ==\(B^\top A^\top\)==.
- \(A\) est inversible si et seulement si ==son déterminant est non nul==.
- \(\operatorname{tr}A\) = ==somme== des valeurs propres, \(\det A\) = ==produit== des valeurs propres.
- Tirage sans ordre, avec remise de \(k\) parmi \(n\) : ==\(\binom{n+k-1}{k}\)==.
- \(D_4\) = ==9== dérangements ; \(C_4\) (Catalan) = ==14==.
- Une p-value se calcule ==en supposant H₀ vraie==.
- Un filtre de Bloom ne produit jamais de ==faux négatif==.

::: quiz Auto-test — matrices
\(A\) est 3×3 avec \(\det A = 2\). Que vaut \(\det(2A)\) ?
- [ ] 4
- [x] 16
- [ ] 8
> \(\det(\lambda A) = \lambda^n \det A\) : chacune des 3 lignes est multipliée par 2, donc \(2^3 \times 2 = 16\). Répondre 4 revient à oublier la puissance n ; 8 compte la puissance mais oublie le det A initial.
:::

::: quiz Auto-test — combinatoire
Combien de façons de distribuer 10 bonbons identiques à 3 enfants (un enfant peut ne rien avoir) ?
- [ ] \(3^{10}\)
- [x] \(\binom{12}{2} = 66\)
- [ ] \(\binom{10}{3} = 120\)
> Bonbons identiques, enfants distincts : étoiles et barres, 10 étoiles et 2 barres, soit \(\binom{12}{2} = 66\). \(3^{10}\) suppose des bonbons distincts ; \(\binom{10}{3}\) choisit 3 bonbons, ce qui ne modélise rien ici.
:::

::: culture Pour aller plus loin
- [3Blue1Brown — Essence of linear algebra](https://www.3blue1brown.com/topics/linear-algebra)
- [Mathematics for Machine Learning (livre gratuit)](https://mml-book.github.io/)
- [OEIS — encyclopédie des suites d'entiers](https://oeis.org/)
:::
