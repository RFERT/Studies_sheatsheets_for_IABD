---
title: Module 2 — Algèbre linéaire
subtitle: Le cœur mathématique du Machine Learning. Tes données sont des vecteurs, tes modèles sont des matrices, et apprendre revient souvent à faire de l'algèbre linéaire à grande échelle. Objectif : PCA et SVD démystifiées.
domains: DATA, BIG DATA, IA
objectifs: Manipuler vecteurs et matrices ; comprendre le produit scalaire et la similarité cosinus ; voir une matrice comme une transformation ; résoudre un système et comprendre rang/base/dimension ; calculer valeurs et vecteurs propres ; comprendre intuitivement la SVD et la PCA.
---

## 1. Vecteurs & espaces vectoriels

::: def Définition
Un **vecteur** de \(\mathbb R^n\) est une liste ordonnée de \(n\) nombres : \(\mathbf v = (v_1,\dots,v_n)\). En Data, c'est une **observation** décrite par \(n\) variables (features). Un **espace vectoriel** est un ensemble stable par deux opérations : l'addition \(\mathbf u + \mathbf v\) et la multiplication par un scalaire \(\lambda\mathbf v\).
:::

::: def Combinaison linéaire
Une **combinaison linéaire** des vecteurs \(\mathbf v_1,\dots,\mathbf v_k\) est \(\lambda_1\mathbf v_1 + \dots + \lambda_k\mathbf v_k\). L'ensemble de toutes ces combinaisons est le **sous-espace engendré** (span). C'est LE concept central : presque tout, en algèbre linéaire, est une histoire de combinaisons linéaires.
:::

::: info Lien Data
Une ligne d'un dataset = un vecteur de features. Une image \(28\times 28\) = un vecteur de \(\mathbb R^{784}\). Un mot (word embedding) = un vecteur de \(\mathbb R^{300}\). **Faire de la Data, c'est géométriser les données en points/vecteurs.**
:::

## 2. Produit scalaire, norme & similarité cosinus

::: def Produit scalaire (dot product)
\[ \mathbf u \cdot \mathbf v = \sum_{i=1}^n u_i v_i = u_1v_1 + \dots + u_nv_n \] Géométriquement : \(\mathbf u\cdot\mathbf v = \|\mathbf u\|\,\|\mathbf v\|\cos\theta\), où \(\theta\) est l'angle entre les deux vecteurs.
:::

::: def Norme & distance
Norme euclidienne : \(\|\mathbf v\| = \sqrt{\mathbf v\cdot\mathbf v} = \sqrt{v_1^2 + \dots + v_n^2}\).

Distance : \(d(\mathbf u,\mathbf v) = \|\mathbf u - \mathbf v\|\). Deux vecteurs sont **orthogonaux** ssi \(\mathbf u\cdot\mathbf v = 0\).
:::

::: info Similarité cosinus — l'outil roi en Data
\[ \cos\theta = \frac{\mathbf u\cdot\mathbf v}{\|\mathbf u\|\,\|\mathbf v\|} \in [-1, 1] \] Proche de \(1\) = très similaires (même direction) ; \(0\) = orthogonaux (sans rapport) ; \(-1\) = opposés. Insensible à la *longueur* des vecteurs, seulement à leur *direction*.
:::

::: info Lien Data / IA
La similarité cosinus mesure la proximité de **documents** (TF-IDF), de **mots** (word2vec : « roi − homme + femme ≈ reine »), d'**utilisateurs** (reco). La **recherche sémantique** et les bases de données **vectorielles** (RAG des LLM) reposent dessus.
:::

::: info Exemple résolu
\(\mathbf u=(1,2,2)\), \(\mathbf v=(2,0,1)\). \(\mathbf u\cdot\mathbf v = 2+0+2 = 4\). \(\|\mathbf u\|=\sqrt{1+4+4}=3\), \(\|\mathbf v\|=\sqrt{4+0+1}=\sqrt5\). Donc \(\cos\theta = \frac{4}{3\sqrt5}\approx 0{,}596\) — assez similaires.
:::

::: quiz Quiz 2.1
Deux vecteurs non nuls ont un produit scalaire nul. Que peut-on dire ?
- [ ] Ils sont égaux
- [ ] Ils ont la même norme
- [x] Ils sont orthogonaux (angle de 90°)
- [ ] Leur similarité cosinus vaut 1
> \(\mathbf u\cdot\mathbf v=0\) avec des vecteurs non nuls signifie \(\cos\theta=0\), donc \(\theta=90°\) : orthogonaux. En Data, cela veut dire « aucune corrélation directionnelle ».
:::

## 3. Matrices & transformations linéaires

::: def Définition
Une **matrice** \(A\) de taille \(m\times n\) est un tableau de nombres \(A_{ij}\) (\(m\) lignes, \(n\) colonnes). Opérations : addition (même taille), multiplication par un scalaire, **transposée** \(A^{\top}\) (\(A^{\top}_{ij}=A_{ji}\)).
:::

::: def Produit matriciel
Si \(A\) est \(m\times n\) et \(B\) est \(n\times p\), alors \(C=AB\) est \(m\times p\) avec \[ C_{ij} = \sum_{k=1}^n A_{ik}B_{kj} \] (ligne \(i\) de \(A\) « · » colonne \(j\) de \(B\)). ⚠️ **Non commutatif** : en général \(AB \neq BA\). Les dimensions intérieures doivent coïncider.
:::

::: info Idée clé — une matrice EST une transformation
Multiplier un vecteur par \(A\) (\(\mathbf x \mapsto A\mathbf x\)) applique une **transformation linéaire** : rotation, étirement, projection, cisaillement… Composer deux transformations = multiplier leurs matrices. C'est pourquoi une couche de réseau de neurones s'écrit \(\mathbf y = \sigma(W\mathbf x + \mathbf b)\).
:::

::: info Lien Data / IA
Un **dataset** = une matrice \(X\) (lignes = observations, colonnes = features). Un **batch** traversant un réseau = une suite de produits matriciels (c'est pour ça qu'on utilise des GPU !). La **rotation/augmentation d'images** = transformations linéaires.
:::

::: info Exemple résolu — produit
\(A=\begin{pmatrix}1&2\\0&1\end{pmatrix}\), \(\mathbf x=\begin{pmatrix}3\\4\end{pmatrix}\). Alors \(A\mathbf x = \begin{pmatrix}1\cdot3+2\cdot4\\0\cdot3+1\cdot4\end{pmatrix}=\begin{pmatrix}11\\4\end{pmatrix}\). (C'est un cisaillement horizontal.)
:::

::: quiz Quiz 3.1
On veut calculer \(AB\) avec \(A\) de taille \(3\times 4\) et \(B\) de taille \(4\times 2\). Quelle est la taille du résultat ?
- [x] \(3\times 2\)
- [ ] \(4\times 4\)
- [ ] Impossible
- [ ] \(2\times 3\)
> Les dimensions intérieures (4 et 4) coïncident, le produit est défini et a la taille des dimensions extérieures : \(3\times 2\).
:::

## 4. Systèmes linéaires, rang, base & dimension

Un système linéaire s'écrit \(A\mathbf x = \mathbf b\). Le résoudre = trouver tous les \(\mathbf x\). La méthode standard est le **pivot de Gauss** (élimination par opérations sur les lignes jusqu'à une forme échelonnée).

::: def Indépendance, base, dimension
- Des vecteurs sont **linéairement indépendants** si aucune combinaison linéaire non triviale ne donne \(\mathbf 0\) (aucun n'est « redondant »).
- Une **base** d'un espace = une famille indépendante qui l'engendre.
- La **dimension** = le nombre de vecteurs d'une base (nombre de « directions indépendantes »).
:::

::: def Rang
Le **rang** de \(A\) = nombre de lignes (ou colonnes) linéairement indépendantes = dimension de l'espace engendré par ses colonnes. Il mesure l'« information réelle » contenue dans la matrice.
:::

::: info Lien Data / IA
Un rang **faible** signifie que des features sont redondantes (corrélées) — c'est la **multicolinéarité**, qui perturbe la régression. Les **recommandations** (Netflix) reposent sur une *approximation de rang faible* de la matrice utilisateurs×films. Réduire la dimension = exploiter un rang effectif faible.
:::

::: quiz Quiz 4.1
Les colonnes d'une matrice \(X\) (features) sont très corrélées. Son rang est donc…
- [ ] maximal (= nombre de colonnes)
- [x] inférieur au nombre de colonnes (features redondantes)
- [ ] toujours égal à 1
- [ ] négatif
> Des colonnes corrélées sont (presque) combinaisons linéaires les unes des autres : elles n'ajoutent pas de direction indépendante, donc le rang chute en dessous du nombre de colonnes. C'est la multicolinéarité.
:::

## 5. Déterminant & inverse

::: def Déterminant
- \(\det(A)=0\) ⇔ \(A\) n'est **pas inversible** (elle « écrase » l'espace, perd de l'information, rang non maximal).
- \(\det(AB)=\det(A)\det(B)\).
:::

::: def Matrice inverse
\(A^{-1}\) vérifie \(AA^{-1}=A^{-1}A=I\) (identité). Elle existe ssi \(\det(A)\neq0\). Résoudre \(A\mathbf x=\mathbf b\) donne alors \(\mathbf x = A^{-1}\mathbf b\) (mais en pratique on résout sans inverser, c'est plus stable).
:::

::: info Attention numérique
En Data, inverser une matrice presque singulière (\(\det\approx0\)) est **instable**. On préfère des méthodes robustes (QR, SVD, régularisation de Ridge qui ajoute \(\lambda I\) pour rendre la matrice inversible).
:::

::: quiz Quiz 5.1
\(\det\begin{pmatrix}2&4\\1&2\end{pmatrix}\) vaut… et qu'en déduit-on ?
- [ ] \(8\), matrice inversible
- [ ] \(-2\), inversible
- [ ] \(2\), inversible
- [x] \(0\), matrice non inversible
> \(2\cdot2 - 4\cdot1 = 0\). Déterminant nul ⇒ non inversible (la 2ᵉ ligne est la moitié de la 1ʳᵉ : colonnes/lignes dépendantes, rang 1).
:::

## 6. Valeurs propres & vecteurs propres

::: def Définition
Un **vecteur propre** \(\mathbf v\neq\mathbf 0\) de \(A\) est un vecteur dont la *direction* est préservée par la transformation : \(A\mathbf v = \lambda\mathbf v\). Le scalaire \(\lambda\) est la **valeur propre** associée (facteur d'étirement sur cette direction).
:::

::: def Calcul
Les valeurs propres sont les racines du **polynôme caractéristique** \(\det(A-\lambda I)=0\). Pour chaque \(\lambda\), on résout \((A-\lambda I)\mathbf v=\mathbf 0\) pour trouver les vecteurs propres.
:::

::: info Diagonalisation
Si \(A\) (\(n\times n\)) possède \(n\) vecteurs propres indépendants, alors \(A = PDP^{-1}\) où \(D\) est diagonale (les valeurs propres) et \(P\) contient les vecteurs propres. Avantage : \(A^k = PD^kP^{-1}\) se calcule instantanément — utile pour les processus itératifs (chaînes de Markov, PageRank).
:::

::: info Lien Data / IA
**PageRank** = vecteur propre dominant de la matrice du web. La **PCA** = vecteurs propres de la matrice de covariance. La **stabilité** d'un système dynamique (et la convergence d'un entraînement) se lit sur les valeurs propres.
:::

::: info Exemple résolu
\(A=\begin{pmatrix}2&1\\0&3\end{pmatrix}\). Polynôme : \(\det\begin{pmatrix}2-\lambda&1\\0&3-\lambda\end{pmatrix}=(2-\lambda)(3-\lambda)=0\). Valeurs propres : \(\lambda_1=2,\ \lambda_2=3\). (Pour une matrice triangulaire, les valeurs propres sont sur la diagonale !)
:::

::: quiz Quiz 6.1
\(A\mathbf v = \lambda\mathbf v\) avec \(\mathbf v\neq\mathbf0\). Que signifie géométriquement un vecteur propre ?
- [ ] Il est envoyé sur le vecteur nul
- [x] Sa direction est préservée, seule sa longueur est multipliée par \(\lambda\)
- [ ] Il tourne de 90°
- [ ] Il devient orthogonal à lui-même
> La transformation ne change pas la direction d'un vecteur propre ; elle l'étire (ou le compresse/inverse) d'un facteur \(\lambda\). Ce sont les « axes naturels » de la transformation.
:::

## 7. SVD & PCA — le sommet du module

::: def Décomposition en valeurs singulières (SVD)
**Toute** matrice \(A\) (\(m\times n\), même non carrée) se décompose en \[ A = U\Sigma V^{\top} \] où \(U\) (\(m\times m\)) et \(V\) (\(n\times n\)) sont **orthogonales** (rotations) et \(\Sigma\) est « diagonale » avec les **valeurs singulières** \(\sigma_1\geq\sigma_2\geq\dots\geq0\) (l'importance de chaque direction). Interprétation : *toute transformation linéaire = rotation → étirement → rotation*.
:::

::: info Approximation de rang faible (le super-pouvoir)
En ne gardant que les \(k\) plus grandes valeurs singulières, on obtient la **meilleure** approximation de \(A\) de rang \(k\) (théorème d'Eckart–Young). C'est la base de la **compression**, du **débruitage** et des **systèmes de recommandation**.
:::

::: def PCA (Analyse en Composantes Principales)
Objectif : réduire la dimension en gardant le maximum de **variance**. Recette :

1. Centrer les données (soustraire la moyenne de chaque feature).
2. Calculer la matrice de **covariance** \(C=\frac1n X^{\top}X\).
3. En extraire les **vecteurs propres** (= composantes principales) et valeurs propres (= variance expliquée).
4. Projeter sur les \(k\) premières composantes.

Équivalent à faire la SVD de \(X\) centrée. Les composantes principales sont orthogonales et classées par variance décroissante.
:::

::: info Lien Data / IA
**PCA :** visualiser des données en 2D, réduire le bruit, accélérer l'entraînement, lutter contre la malédiction de la dimension. **SVD :** compression d'images, LSA (sémantique latente en NLP), recommandation (Netflix Prize), pseudo-inverse pour les moindres carrés.
:::

::: quiz Quiz 7.1
En PCA, que représentent les premières composantes principales ?
- [ ] Les features d'origine, inchangées
- [ ] Les directions de plus faible variance
- [x] Les directions orthogonales de plus grande variance
- [ ] Des vecteurs aléatoires
> La PCA cherche les axes orthogonaux qui capturent le plus de variance. On garde les premiers (grande variance = beaucoup d'information) et on jette les derniers (souvent du bruit).
:::

::: quiz Quiz 7.2
Quelle affirmation sur la SVD est vraie ?
- [x] Toute matrice, même non carrée, admet une SVD
- [ ] Seules les matrices inversibles ont une SVD
- [ ] La SVD n'existe que pour les matrices symétriques
- [ ] La SVD donne toujours des valeurs singulières négatives
> La SVD est universelle : toute matrice \(m\times n\) se décompose en \(U\Sigma V^\top\). Les valeurs singulières sont toujours ≥ 0. C'est ce qui la rend si puissante.
:::

## 8. Applications Data / IA — récapitulatif

- **Représentation** : données = vecteurs/matrices ; features, images, embeddings.
- **Similarité cosinus** : recherche sémantique, bases vectorielles (RAG), recommandation, NLP.
- **Produit matriciel** : propagation avant d'un réseau de neurones, batchs sur GPU.
- **Moindres carrés / régression** : \(\hat{\boldsymbol\beta} = (X^{\top}X)^{-1}X^{\top}\mathbf y\) — tout est matriciel.
- **PCA / SVD** : réduction de dimension, compression, débruitage, LSA, reco.
- **Valeurs propres** : PageRank, chaînes de Markov, stabilité, spectral clustering.

::: info Pour approfondir
[3Blue1Brown — Essence of Linear Algebra (visuel, incontournable)](https://www.3blue1brown.com/topics/linear-algebra) [SVD (Wikipédia)](https://fr.wikipedia.org/wiki/D%C3%A9composition_en_valeurs_singuli%C3%A8res) [PCA (Wikipédia)](https://fr.wikipedia.org/wiki/Analyse_en_composantes_principales) [MIT 18.06 — Gilbert Strang](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/)
:::

## 9. Exercices de synthèse

::: exo Exercice 1 — Produit scalaire & cosinus
Soit \(\mathbf u=(3,4)\) et \(\mathbf v=(4,3)\). Calcule \(\mathbf u\cdot\mathbf v\), les normes, et la similarité cosinus.
?? Voir la solution
\(\mathbf u\cdot\mathbf v = 12+12 = 24\). \(\|\mathbf u\|=\|\mathbf v\|=\sqrt{9+16}=5\). \(\cos\theta = \frac{24}{25}=0{,}96\) → très similaires.
:::

::: exo Exercice 2 — Produit matriciel
\(A=\begin{pmatrix}1&0\\2&1\end{pmatrix}\), \(B=\begin{pmatrix}1&2\\3&4\end{pmatrix}\). Calcule \(AB\) et \(BA\). Sont-ils égaux ?
?? Voir la solution
\(AB=\begin{pmatrix}1&2\\5&8\end{pmatrix}\), \(BA=\begin{pmatrix}5&2\\11&4\end{pmatrix}\). **Non égaux** : le produit matriciel n'est pas commutatif.
:::

::: exo Exercice 3 — Valeurs propres
Trouve les valeurs propres de \(A=\begin{pmatrix}4&1\\2&3\end{pmatrix}\).
?? Voir la solution
\(\det(A-\lambda I)=(4-\lambda)(3-\lambda)-2 = \lambda^2 -7\lambda +10 = 0\). Racines : \(\lambda = \frac{7\pm\sqrt{49-40}}2 = \frac{7\pm3}2\), soit \(\lambda_1=5\) et \(\lambda_2=2\).
:::

::: exo Exercice 4 — Rang & dépendance (⭐)
Quel est le rang de \(M=\begin{pmatrix}1&2&3\\2&4&6\\0&1&1\end{pmatrix}\) ?
?? Voir la solution
La ligne 2 = 2 × ligne 1 (dépendante). Restent les lignes \((1,2,3)\) et \((0,1,1)\), indépendantes. Donc **rang = 2**. La matrice n'est pas inversible (\(\det=0\)).
:::

::: exo Exercice 5 — PCA conceptuel (⭐⭐)
Un dataset a 50 features fortement corrélées. La PCA montre que 3 composantes expliquent 95 % de la variance. Qu'est-ce que cela signifie et pourquoi est-ce utile ?
?? Voir la solution
Les données vivent essentiellement dans un sous-espace de dimension ~3 : le rang effectif est faible, les 50 features sont largement redondantes. On peut **remplacer 50 colonnes par 3** sans perdre grand-chose : entraînement plus rapide, moins de surapprentissage, visualisation possible, débruitage (les ~47 composantes jetées contiennent surtout du bruit). C'est la réduction de dimension en action.
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi.
Vecteurs et matrices ont un air scolaire… mais ce sont les **mots du langage de l'IA moderne** : un *embedding* est un vecteur de sens, un réseau de neurones est une cascade de multiplications de matrices. Leur histoire traverse 2 000 ans, de la Chine antique aux GPU.

#### Les grands noms
- **Les « Neuf Chapitres »** (Chine, ~200 av. J.-C.) — résolvent déjà des systèmes linéaires par élimination, ancêtre du pivot de Gauss.
- **Arthur Cayley & James Sylvester** (années 1850) — inventent la notion de *matrice* (et le mot « matrix »).
- **Hermann Grassmann** (1809-1877) — théorise les *espaces vectoriels* (1844), génie incompris de son vivant.
- **Beltrami & Jordan** (~1873) — découvrent la décomposition en valeurs singulières (SVD).
- **Karl Pearson** (1901) — invente l'ACP (PCA), reine de la réduction de dimension.

#### Le tournant décisif
Le XXᵉ siècle transforme l'algèbre linéaire en *moteur numérique*. Le PageRank de Google est un gigantesque vecteur propre ; la similarité cosinus fait tourner les moteurs de recherche ; et depuis 2012, l'apprentissage profond n'est, au fond, qu'une immense chorégraphie de produits matriciels sur des cartes graphiques.

#### Pourquoi ça te concerne
NumPy, PyTorch, la recommandation, la compression d'images (SVD), les embeddings de mots : si tu fais de la data, tu vis dans des espaces vectoriels toute la journée.
- [3Blue1Brown — Algèbre linéaire](https://www.3blue1brown.com/topics/linear-algebra)
- [Arthur Cayley](https://fr.wikipedia.org/wiki/Arthur_Cayley)
- [SVD](https://fr.wikipedia.org/wiki/D%C3%A9composition_en_valeurs_singuli%C3%A8res)
- [PCA](https://fr.wikipedia.org/wiki/Analyse_en_composantes_principales)
:::
