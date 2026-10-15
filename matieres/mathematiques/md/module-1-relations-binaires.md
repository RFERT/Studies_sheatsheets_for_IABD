---
title: Module 1 — Relations binaires
subtitle: Comment relier les éléments d'un ensemble entre eux. Ce module structure énormément d'informatique : bases de données, clustering, ordonnancement, graphes, treillis de concepts. Un grand classique de partiel.
domains: DATA, BIG DATA, IA
objectifs: Reconnaître et démontrer les propriétés d'une relation (réflexivité, symétrie, antisymétrie, transitivité) ; manier les relations d'équivalence (classes, partitions, quotient) ; manier les relations d'ordre (Hasse, éléments remarquables, treillis) ; calculer composition, inverse et clôtures.
---

## 1. Définition & représentations

::: def Définition — Relation binaire
Une **relation binaire** \(\mathcal{R}\) sur un ensemble \(E\) est un sous-ensemble du produit cartésien : \(\mathcal{R} \subseteq E \times E\). On écrit \(x\,\mathcal{R}\,y\) (lire « \(x\) est en relation avec \(y\) ») pour dire \((x,y) \in \mathcal{R}\).
:::

Exemples : « \(\leq\) » sur \(\mathbb{R}\), « divise » sur \(\mathbb{N}\), « a le même âge que » sur une population, « suit » sur un réseau social.

### Trois façons de représenter une relation

| Représentation | Idée | Utile pour |
| --- | --- | --- |
| **Ensemble de couples** | Lister les \((x,y)\in\mathcal R\) | Petits exemples, définitions |
| **Matrice booléenne** \(M\) | \(M_{ij}=1\) si \(x_i\,\mathcal R\,x_j\), sinon 0 | Calculs, clôtures, ordinateur |
| **Graphe orienté** | Un arc \(x\to y\) si \(x\,\mathcal R\,y\) | Visualisation, intuition |

::: info Exemple — relation « divise » sur \(\{1,2,3,6\}\)
\(\mathcal R = \{(1,1),(2,2),(3,3),(6,6),(1,2),(1,3),(1,6),(2,6),(3,6)\}\). Matrice (lignes/colonnes dans l'ordre 1,2,3,6) :

```
     1  2  3  6
 1 [ 1  1  1  1 ]
 2 [ 0  1  0  1 ]
 3 [ 0  0  1  1 ]
 6 [ 0  0  0  1 ]
```
:::

## 2. Les propriétés fondamentales

Tout le module repose sur ces propriétés. Apprends-les avec leur « lecture graphe/matrice ».

| Propriété | Définition formelle | Lecture intuitive |
| --- | --- | --- |
| **Réflexive** | \(\forall x,\; x\,\mathcal R\,x\) | Boucle sur chaque sommet / diagonale de \(M\) = 1 |
| **Irréflexive** | \(\forall x,\; \neg(x\,\mathcal R\,x)\) | Aucune boucle / diagonale = 0 |
| **Symétrique** | \(\forall x,y,\; x\mathcal R y \Rightarrow y\mathcal R x\) | Arcs toujours à double sens / \(M=M^{\top}\) |
| **Antisymétrique** | \((x\mathcal R y \wedge y\mathcal R x)\Rightarrow x=y\) | Jamais deux sens entre points distincts |
| **Asymétrique** | \(x\mathcal R y \Rightarrow \neg(y\mathcal R x)\) | Antisymétrique + irréflexive |
| **Transitive** | \((x\mathcal R y \wedge y\mathcal R z)\Rightarrow x\mathcal R z\) | Tout « raccourci » existe déjà |
| **Totale (complète)** | \(\forall x,y,\; x\mathcal R y \vee y\mathcal R x\) | Deux éléments sont toujours comparables |

::: info Antisymétrique ≠ « non symétrique » !
Antisymétrie n'interdit pas \(x\mathcal R x\) ; elle interdit seulement d'avoir \(x\mathcal R y\) *et* \(y\mathcal R x\) avec \(x\neq y\). Une relation peut être **à la fois** symétrique et antisymétrique : c'est le cas de l'égalité \(=\) (uniquement des couples \((x,x)\)).
:::

::: info Exemple résolu — prouver la transitivité
Montrons que « divise » (\(a\mid b\)) est transitive sur \(\mathbb N\). Supposons \(a\mid b\) et \(b\mid c\). Alors \(b = ka\) et \(c = k'b\) pour des entiers \(k,k'\). Donc \(c = k'(ka) = (k'k)a\), d'où \(a\mid c\). ∎
:::

::: quiz Quiz 2.1
La relation « \(\leq\) » sur \(\mathbb{R}\) est réflexive, antisymétrique, transitive et totale. Est-elle symétrique ?
- [ ] Oui, toujours
- [ ] Oui car \(x\leq x\)
- [x] Non : \(2\leq 3\) mais \(3\not\leq 2\)
- [ ] La question n'a pas de sens
> La symétrie exigerait que \(x\leq y \Rightarrow y\leq x\), ce qui est faux dès que \(x<y\). \(\leq\) est antisymétrique, pas symétrique.
:::

::: quiz Quiz 2.2
Une relation dont la matrice booléenne vérifie \(M = M^{\top}\) (symétrique en tant que matrice) est forcément…
- [x] symétrique
- [ ] réflexive
- [ ] transitive
- [ ] antisymétrique
> \(M=M^{\top}\) signifie \(M_{ij}=M_{ji}\), soit \(x_i\mathcal R x_j \Leftrightarrow x_j\mathcal R x_i\) : c'est exactement la symétrie. Les autres propriétés sont indépendantes.
:::

## 3. Relations d'équivalence

::: def Définition
Une relation \(\mathcal R\) sur \(E\) est une **relation d'équivalence** si elle est à la fois **R**éflexive, **S**ymétrique et **T**ransitive (moyen mnémotechnique : **RST**). On note souvent \(\sim\).
:::

Intuition : « \(\sim\) » regroupe les éléments *indiscernables* pour un certain critère (même couleur, même reste, même classe…).

::: def Classe d'équivalence
La **classe** de \(x\) est \(\;[x] = \{\, y \in E \;:\; y \sim x \,\}\). C'est l'ensemble de tous les éléments équivalents à \(x\). N'importe quel élément de la classe peut la *représenter*.
:::

::: info Théorème fondamental (équivalence  partition)
Les classes d'équivalence d'une relation \(\sim\) sur \(E\) forment une **partition** de \(E\) : elles sont non vides, deux à deux disjointes, et leur union vaut \(E\). Réciproquement, toute partition de \(E\) définit une unique relation d'équivalence (« être dans le même paquet »). **Équivalence et partition, c'est la même chose vue de deux côtés.**
:::

::: def Ensemble quotient
L'ensemble des classes est le **quotient** \(E/\!\sim\; = \{\,[x] : x\in E\,\}\). Passer au quotient = « fusionner » les éléments équivalents en un seul point.
:::

::: info Exemple roi — congruence modulo \(n\)
Sur \(\mathbb Z\), on pose \(a \equiv b \pmod{n} \Leftrightarrow n \mid (a-b)\). C'est une relation d'équivalence (RST).

Pour \(n=3\), les classes sont \([0]=\{\dots,-3,0,3,6\dots\}\), \([1]=\{\dots,-2,1,4\dots\}\), \([2]=\{\dots,-1,2,5\dots\}\). Le quotient \(\mathbb Z/3\mathbb Z = \{[0],[1],[2]\}\) a 3 éléments — c'est la base de l'arithmétique modulaire (hachage, cryptographie, codes correcteurs).
:::

::: info Lien Data / IA
**Un clustering est une partition** — donc une relation d'équivalence « être dans le même cluster ». La **déduplication** d'enregistrements regroupe en classes les doublons (« même entité réelle »). Le **sharding** par \(\text{clé} \bmod n\) répartit les données selon des classes de congruence.
:::

::: quiz Quiz 3.1
Combien de classes d'équivalence possède la congruence modulo 7 sur \(\mathbb Z\) ?
- [ ] Une infinité
- [x] 7
- [ ] 14
- [ ] 6
> Les restes possibles de la division par 7 sont \(0,1,2,3,4,5,6\) : exactement 7 classes, \(\mathbb Z/7\mathbb Z\).
:::

::: quiz Quiz 3.2
Pourquoi la relation « \(x\) et \(y\) ont un ami commun » sur un réseau social n'est-elle (en général) pas une relation d'équivalence ?
- [ ] Elle n'est pas réflexive
- [ ] Elle n'est pas symétrique
- [ ] Elle n'a pas de classes
- [x] Elle n'est pas transitive
> Si A et B ont un ami commun, et B et C ont un ami commun, A et C n'en ont pas forcément : la transitivité tombe. (Elle est bien symétrique, et réflexive si l'on se considère son propre ami.)
:::

## 4. Relations d'ordre

::: def Définition
Une relation \(\preceq\) sur \(E\) est une **relation d'ordre** (partiel) si elle est **R**éflexive, **A**nti­symétrique et **T**ransitive (mnémo : **RAT**). Le couple \((E,\preceq)\) est un **ensemble ordonné** (poset).
:::

- **Ordre total** : en plus, deux éléments sont toujours comparables (\(\forall x,y,\; x\preceq y \vee y\preceq x\)). Ex : \(\leq\) sur \(\mathbb R\).
- **Ordre partiel** : certains éléments sont *incomparables*. Ex : l'inclusion \(\subseteq\) (\(\{1\}\) et \(\{2\}\) ne sont pas comparables), ou « divise » sur \(\mathbb N\).

::: info Équivalence vs Ordre — le seul changement
On passe de l'un à l'autre en changeant **une seule** propriété au milieu du « R_T » :

Équivalence = R + **Symétrie** + T • Ordre = R + **Antisymétrie** + T.
:::

### Éléments remarquables d'un ordre

| Terme | Définition |
| --- | --- |
| **Minimal** | \(m\) tel qu'aucun \(x\neq m\) ne vérifie \(x\prec m\) (rien en dessous) |
| **Maximal** | \(M\) tel qu'aucun \(x\neq M\) ne vérifie \(M\prec x\) (rien au dessus) |
| **Minimum** (plus petit) | \(m\preceq x\) pour *tout* \(x\) — unique s'il existe |
| **Maximum** (plus grand) | \(x\preceq M\) pour *tout* \(x\) — unique s'il existe |
| **Majorant** de \(A\) | \(M\) tel que \(\forall a\in A,\; a\preceq M\) |
| **Borne sup** \(\sup A\) | Le plus petit des majorants de \(A\) |
| **Borne inf** \(\inf A\) | Le plus grand des minorants de \(A\) |

::: info Minimal ≠ Minimum
Un ordre partiel peut avoir **plusieurs** éléments minimaux mais **aucun** minimum. Ex : sur \(\{2,3,4,9\}\) ordonné par « divise », \(2\) et \(3\) sont tous deux minimaux (aucun diviseur strict dans l'ensemble), mais il n'y a pas de minimum (pas d'élément qui divise tous les autres).
:::

### Diagramme de Hasse

C'est le dessin épuré d'un ordre : on place les éléments par niveaux et on relie \(x\) à \(y\) (avec \(x\) en dessous) **seulement** si \(y\) *couvre* \(x\) — c'est-à-dire \(x\prec y\) sans élément intermédiaire. On **omet** les boucles (réflexivité) et les arcs déductibles par transitivité.

::: info Exemple — diviseurs de 12 ordonnés par « divise »
```
            12
           /   \
          4     6
          |   /  |
          2      3
           \    /
             1
```

\(1\) est le minimum, \(12\) le maximum. \(4\) et \(6\) sont incomparables (aucun ne divise l'autre). On lit \(\sup\{4,6\}=12\) et \(\inf\{4,6\}=2\).
:::

::: info Lien Data / IA
Un **DAG** (graphe orienté acyclique) représente un ordre partiel : dépendances de tâches (Airflow, Spark, Makefile), ordre de calcul des couches d'un réseau de neurones (rétropropagation), historique Git. Le **tri topologique** consiste à « linéariser » un ordre partiel en ordre total compatible.
:::

::: quiz Quiz 4.1
Dans le diagramme de Hasse, pourquoi ne dessine-t-on pas l'arc de \(1\) à \(12\) (diviseurs de 12) ?
- [ ] Parce que \(1\) ne divise pas \(12\)
- [ ] Par oubli, on devrait le dessiner
- [x] Car il se déduit par transitivité (\(1\to 2\to 4\to 12\))
- [ ] Car \(1\) est minimal
> Le diagramme de Hasse n'affiche que les relations de couverture. \(1\prec 12\) est déductible par transitivité via des éléments intermédiaires, donc on ne le dessine pas.
:::

::: quiz Quiz 4.2
\((\mathcal P(E), \subseteq)\) (parties d'un ensemble, ordonnées par inclusion) est un ordre…
- [x] partiel (certaines parties sont incomparables)
- [ ] total
- [ ] qui n'est pas un ordre
- [ ] symétrique
> \(\subseteq\) est réflexive, antisymétrique (double inclusion ⇒ égalité) et transitive. Mais \(\{1\}\) et \(\{2\}\) ne sont pas comparables : l'ordre est seulement partiel.
:::

## 5. Treillis (lattices)

::: def Définition
Un **treillis** est un ensemble ordonné \((E,\preceq)\) dans lequel *toute paire* \(\{x,y\}\) admet une borne supérieure \(x\vee y = \sup\{x,y\}\) (le **join**) **et** une borne inférieure \(x\wedge y = \inf\{x,y\}\) (le **meet**).
:::

- \((\mathcal P(E),\subseteq)\) est un treillis : \(A\vee B = A\cup B\), \(A\wedge B = A\cap B\).
- \((\mathbb N, \mid)\) (divisibilité) est un treillis : \(x\vee y = \text{ppcm}(x,y)\), \(x\wedge y = \text{pgcd}(x,y)\).
- \((\{0,1\}^n, \leq \text{bit à bit})\) est un treillis : join = OU bit à bit, meet = ET bit à bit.

::: info Lien Data / IA — là où ça devient puissant
- **Analyse formelle de concepts (FCA)** : les « concepts » (objets ↔ attributs) forment un **treillis de concepts** ; outil de fouille de données et d'ontologies.
- **Treillis de version space** en apprentissage : les hypothèses cohérentes avec les données forment un treillis entre l'hypothèse la plus générale et la plus spécifique.
- **CRDT** (bases de données distribuées) : les états forment un semi-treillis, la fusion = join — ce qui garantit la convergence sans conflit.
- **Analyse de programmes** (compilateurs, sécurité) : l'analyse statique propage de l'information dans un treillis d'abstractions.
:::

::: quiz Quiz 5.1
Dans le treillis \((\mathbb N,\mid)\), que vaut \(12 \vee 18\) (le join, c'est-à-dire \(\sup\)) ?
- [ ] 6 (le pgcd)
- [x] 36 (le ppcm)
- [ ] 30 (la somme)
- [ ] 216 (le produit)
> Dans l'ordre de divisibilité, la borne supérieure de deux nombres est leur ppcm : \(\text{ppcm}(12,18)=36\). (Le meet serait le pgcd = 6.)
:::

## 6. Opérations & clôtures

::: def Relation inverse & composition
- **Inverse** : \(\mathcal R^{-1} = \{(y,x) : (x,y)\in\mathcal R\}\). En matrice : \(M^{\top}\).
- **Composition** : \(x\,(\mathcal S \circ \mathcal R)\,z \Leftrightarrow \exists y,\; x\mathcal R y \wedge y\mathcal S z\). En matrice booléenne : produit \(M_{\mathcal R}\cdot M_{\mathcal S}\) (avec \(+ = \text{OU}\), \(\times = \text{ET}\)).
:::

::: def Clôtures (fermetures)
- **Clôture réflexive** : ajouter tous les \((x,x)\).
- **Clôture symétrique** : ajouter \((y,x)\) pour chaque \((x,y)\), i.e. \(\mathcal R \cup \mathcal R^{-1}\).
- **Clôture transitive** \(\mathcal R^{+}\) : ajouter tous les couples reliés par un *chemin*. Se calcule avec l'algorithme de **Warshall** (\(O(n^3)\)).
:::

::: info Exemple — clôture transitive = accessibilité
Si \(\mathcal R\) = « il y a un vol direct de \(x\) à \(y\) », alors la clôture transitive \(\mathcal R^{+}\) = « on peut aller de \(x\) à \(y\) (avec escales) ». C'est exactement le calcul d'**accessibilité** dans un graphe.
:::

::: info Lien Data / IA — Union-Find
Pour maintenir dynamiquement les classes d'équivalence (clôture réflexive-symétrique-transitive de connexions), on utilise la structure **Union-Find** (presque \(O(1)\) amorti). Utilisée pour : composantes connexes, détection de cycles (Kruskal), déduplication, segmentation d'images.
:::

::: quiz Quiz 6.1
La clôture transitive d'une relation d'« amitié directe » symétrique donne…
- [ ] rien de nouveau
- [ ] la relation inverse
- [x] « appartenir à la même communauté (composante connexe) »
- [ ] un ordre total
> En rendant transitive une relation symétrique et réflexive, on obtient une relation d'équivalence dont les classes sont les composantes connexes du graphe — les « communautés ».
:::

## 7. Applications Data / IA — récapitulatif

- **Bases de données relationnelles.** Une « relation » SQL *est* un sous-ensemble d'un produit cartésien. Les **dépendances fonctionnelles** \(X\to Y\) et la normalisation (formes normales) reposent sur des propriétés relationnelles.
- **Clustering & déduplication.** Partition = relation d'équivalence. Évaluer un clustering (Rand index) compare deux partitions.
- **Ordonnancement & pipelines.** DAG = ordre partiel ; tri topologique pour planifier les tâches (Spark, Airflow, build systems).
- **Optimisation multi-objectif.** La **dominance de Pareto** est un ordre partiel : un point en domine un autre s'il est au moins aussi bon partout et strictement meilleur quelque part. Le *front de Pareto* = les éléments maximaux.
- **Treillis de concepts (FCA)** pour la fouille de motifs et les systèmes de recommandation.
- **Accessibilité & graphes.** Clôture transitive = quelles données/pages/personnes sont atteignables (PageRank, propagation d'influence).

::: info Pour approfondir
[Relation binaire (Wikipédia)](https://fr.wikipedia.org/wiki/Relation_binaire) [Relation d'équivalence](https://fr.wikipedia.org/wiki/Relation_d%27%C3%A9quivalence) [Ordre partiel](https://fr.wikipedia.org/wiki/Ordre_partiel) [Treillis](https://fr.wikipedia.org/wiki/Treillis_(ensemble_ordonn%C3%A9)) [MIT 6.042](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/)
:::

## 8. Exercices de synthèse

::: exo Exercice 1 — Identifier les propriétés
Sur \(E=\{1,2,3\}\), soit \(\mathcal R = \{(1,1),(2,2),(3,3),(1,2),(2,1)\}\). Quelles propriétés possède-t-elle ? Est-ce une équivalence ? Un ordre ?
?? Voir la solution
Réflexive ✔ (les trois \((i,i)\) sont là). Symétrique ✔ (\((1,2)\) et \((2,1)\)). Transitive ✔ (à vérifier : \((1,2)\) et \((2,1)\) ⇒ \((1,1)\) ✔, etc.). Donc c'est une **relation d'équivalence**. Ses classes : \([1]=[2]=\{1,2\}\) et \([3]=\{3\}\) — partition \(\{\{1,2\},\{3\}\}\). Ce n'est pas un ordre (elle est symétrique mais pas antisymétrique : \((1,2)\) et \((2,1)\) avec \(1\neq 2\)).
:::

::: exo Exercice 2 — Démonstration (équivalence)
Sur \(\mathbb R\), on pose \(x\sim y \Leftrightarrow x - y \in \mathbb Z\). Montre que \(\sim\) est une relation d'équivalence et décris les classes.
?? Voir la solution
**Réflexive** : \(x-x=0\in\mathbb Z\) ✔. **Symétrique** : si \(x-y\in\mathbb Z\) alors \(y-x=-(x-y)\in\mathbb Z\) ✔. **Transitive** : si \(x-y\in\mathbb Z\) et \(y-z\in\mathbb Z\), alors \(x-z=(x-y)+(y-z)\in\mathbb Z\) ✔.

Classe de \(x\) : \([x]=\{x+k : k\in\mathbb Z\}\). Chaque classe est représentée par sa *partie fractionnaire* dans \([0,1[\). Le quotient \(\mathbb R/\mathbb Z\) est le « cercle » — fondamental en traitement du signal (phase, périodicité).
:::

::: exo Exercice 3 — Ordre & Hasse
On ordonne \(\{1,2,3,4,6,12\}\) par divisibilité. Dessine (mentalement) le diagramme de Hasse, donne les éléments minimaux/maximaux, et calcule \(\sup\{2,3\}\) et \(\inf\{4,6\}\).
?? Voir la solution
Minimum = \(1\) (unique minimal), maximum = \(12\) (unique maximal). \(\sup\{2,3\}=\text{ppcm}(2,3)=6\). \(\inf\{4,6\}=\text{pgcd}(4,6)=2\). Couvertures : \(1\!-\!2,\,1\!-\!3,\,2\!-\!4,\,2\!-\!6,\,3\!-\!6,\,4\!-\!12,\,6\!-\!12\).
:::

::: exo Exercice 4 — Antisymétrie (⭐)
Montre que si \(\mathcal R\) est à la fois symétrique et antisymétrique sur \(E\), alors \(\mathcal R \subseteq \{(x,x):x\in E\}\) (elle est incluse dans la diagonale).
?? Voir la solution
Soit \((x,y)\in\mathcal R\). Par **symétrie**, \((y,x)\in\mathcal R\). On a donc \(x\mathcal R y\) et \(y\mathcal R x\) ; par **antisymétrie**, \(x=y\). Donc tout couple de \(\mathcal R\) est de la forme \((x,x)\). ∎
:::

::: exo Exercice 5 — Compter (⭐⭐)
Combien y a-t-il de relations binaires sur un ensemble à \(n\) éléments ? Combien sont réflexives ? Combien sont symétriques ?
?? Voir la solution
Une relation = un sous-ensemble de \(E\times E\) qui a \(n^2\) couples. Donc **\(2^{n^2}\)** relations au total.

**Réflexives** : les \(n\) couples diagonaux sont imposés (présents), les \(n^2-n\) autres sont libres ⇒ \(2^{\,n^2-n}\).

**Symétriques** : on choisit librement la diagonale (\(n\) bits) et, pour chaque paire \(\{i,j\}\) hors diagonale (\(\binom n2\) paires), un seul choix fixe les deux cases ⇒ \(2^{\,n + \binom{n}{2}} = 2^{\,n(n+1)/2}\).
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi.
Relier les éléments d'un ensemble (les ordonner, les regrouper) semble très abstrait… jusqu'à ce qu'on réalise que c'est devenu le **cœur des bases de données** et de l'organisation des connaissances. L'algèbre des relations s'est construite au XIXᵉ siècle, puis a trouvé sa killer app en 1970.

#### Les grands noms
- **Augustus De Morgan** (1806-1871) — formalise la logique et les relations ; ses lois (¬(A∧B)…) te suivent partout.
- **Charles Sanders Peirce** (1839-1914) — développe l'*algèbre des relations* (logique des relatifs).
- **Richard Dedekind** (1831-1916) — définit rigoureusement ordre et continuité (les « coupures de Dedekind », 1872).
- **Garrett Birkhoff** (1911-1996) — fonde la théorie moderne des *treillis* (*Lattice Theory*, 1940).
- **Edgar F. « Ted » Codd** (1923-2003) — invente chez IBM le *modèle relationnel* des bases de données.

#### Le tournant décisif
En 1970, Codd publie *A Relational Model of Data for Large Shared Data Banks* : une *relation* mathématique devient une *table*, et le langage SQL en découle directement. Plus tard, l'analyse de concepts formels (Rudolf Wille, années 1980) utilise les treillis pour structurer automatiquement la connaissance.

#### Pourquoi ça te concerne
Chaque base relationnelle (clés, jointures), chaque *clustering* (classes d'équivalence), chaque ordonnancement de tâches (ordre partiel, graphes de dépendances) applique *directement* ce module.
- [Edgar F. Codd](https://fr.wikipedia.org/wiki/Edgar_F._Codd)
- [Modèle relationnel](https://fr.wikipedia.org/wiki/Mod%C3%A8le_relationnel)
- [Treillis](https://fr.wikipedia.org/wiki/Treillis_(ensemble_ordonn%C3%A9))
- [Analyse de concepts formels](https://fr.wikipedia.org/wiki/Analyse_de_concepts_formels)
:::
