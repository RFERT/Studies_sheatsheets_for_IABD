---
title: Module 0 — Fondations
subtitle: Le langage mathématique : logique, ensembles, fonctions et preuves. C'est la « grammaire » qui te permettra de lire et écrire tout le reste du cours sans te perdre.
domains: DATA, BIG DATA, IA
objectifs: À la fin, tu sauras : manipuler les connecteurs logiques et les quantificateurs, nier une proposition complexe, calculer sur les ensembles, distinguer injection/surjection/bijection, et rédiger une preuve (directe, par contraposée, par l'absurde, par récurrence).
---

## 1. Logique propositionnelle

Une **proposition** est un énoncé qui est soit **vrai** (V, ou 1), soit **faux** (F, ou 0), jamais les deux. Exemple : « \(2+2=4\) » est vraie ; « il pleut » n'est pas une proposition mathématique (ça dépend du contexte).

::: def Définition — Connecteurs logiques
- \(\neg P\) (**négation**, « non \(P\) »)
- \(P \wedge Q\) (**conjonction**, « \(P\) et \(Q\) »)
- \(P \vee Q\) (**disjonction**, « \(P\) ou \(Q\) », ou *inclusif*)
- \(P \Rightarrow Q\) (**implication**, « si \(P\) alors \(Q\) »)
- \(P \Leftrightarrow Q\) (**équivalence**, « \(P\) si et seulement si \(Q\) »)
:::

### Tables de vérité

| \(P\) | \(Q\) | \(\neg P\) | \(P\wedge Q\) | \(P\vee Q\) | \(P\Rightarrow Q\) | \(P\Leftrightarrow Q\) |
| --- | --- | --- | --- | --- | --- | --- |
| V | V | F | V | V | V | V |
| V | F | F | F | V | F | F |
| F | V | V | F | V | V | F |
| F | F | V | F | F | V | V |

::: info Piège classique — l'implication
\(P \Rightarrow Q\) est **vraie** dès que \(P\) est fausse (« faux implique n'importe quoi »). Elle n'est fausse que dans le cas V ⇒ F. Exemple : « s'il fait \(-100°\)C alors je vole » est *vraie* car la prémisse est toujours fausse.
:::

### Lois fondamentales (tautologies)

Une **tautologie** est une proposition toujours vraie. Quelques équivalences logiques à connaître par cœur :

- **Contraposée :** \((P \Rightarrow Q) \;\Leftrightarrow\; (\neg Q \Rightarrow \neg P)\)
- **Négation de l'implication :** \(\neg(P \Rightarrow Q) \;\Leftrightarrow\; (P \wedge \neg Q)\)
- **Lois de De Morgan :** \(\neg(P \wedge Q) \Leftrightarrow (\neg P \vee \neg Q)\) et \(\neg(P \vee Q) \Leftrightarrow (\neg P \wedge \neg Q)\)
- **Double négation :** \(\neg(\neg P) \Leftrightarrow P\)
- **Distributivité :** \(P \wedge (Q \vee R) \Leftrightarrow (P\wedge Q)\vee(P\wedge R)\)
- **Implication « déguisée » :** \((P \Rightarrow Q) \Leftrightarrow (\neg P \vee Q)\)

::: info Exemple résolu
Nions l'énoncé : « Si un nombre est pair *et* supérieur à 2, alors il n'est pas premier. »

Posons \(P\) : « pair », \(Q\) : « \(>2\) », \(R\) : « premier ». L'énoncé est \((P \wedge Q) \Rightarrow \neg R\).

Sa négation : \(\neg\big((P\wedge Q)\Rightarrow \neg R\big) \Leftrightarrow (P \wedge Q) \wedge R\) — c'est-à-dire « il existe un nombre pair, supérieur à 2 *et* premier ». (Ce nombre n'existe pas, donc l'énoncé de départ est vrai.)
:::

::: quiz Quiz 1.1
Quelle est la négation de \(P \Rightarrow Q\) ?
- [ ] \(\neg P \Rightarrow \neg Q\)
- [x] \(P \wedge \neg Q\)
- [ ] \(\neg P \wedge Q\)
- [ ] \(Q \Rightarrow P\)
> Une implication n'est fausse que lorsque la prémisse est vraie et la conclusion fausse : \(P\) vrai ET \(Q\) faux, donc \(P \wedge \neg Q\).
:::

## 2. Quantificateurs

Quand une propriété dépend d'une variable (un **prédicat** \(P(x)\)), on quantifie :

::: def Définition
- \(\forall x \in E,\; P(x)\) : « **pour tout** \(x\) de \(E\), \(P(x)\) est vraie » (quantificateur universel).
- \(\exists x \in E,\; P(x)\) : « **il existe** (au moins) un \(x\) de \(E\) tel que \(P(x)\) » (quantificateur existentiel).
- \(\exists!\, x \in E,\; P(x)\) : « il existe un **unique** \(x\) ».
:::

::: info Règle d'or — Négation des quantificateurs
Pour nier, on **échange** \(\forall \leftrightarrow \exists\) et on nie le prédicat : \[ \neg\big(\forall x,\; P(x)\big) \Leftrightarrow \exists x,\; \neg P(x) \qquad\qquad \neg\big(\exists x,\; P(x)\big) \Leftrightarrow \forall x,\; \neg P(x) \]
:::

::: info L'ordre des quantificateurs compte !
\(\forall x\, \exists y,\; x < y\) (pour chaque \(x\), on peut trouver un \(y\) plus grand) — **VRAI** dans \(\mathbb{R}\).

\(\exists y\, \forall x,\; x < y\) (il existe un \(y\) plus grand que *tous* les \(x\)) — **FAUX** dans \(\mathbb{R}\).
:::

::: info Exemple résolu — nier une définition de limite
« \(f\) converge vers \(\ell\) » s'écrit \(\forall \varepsilon >0,\; \exists N,\; \forall n \geq N,\; |u_n - \ell| < \varepsilon\).

Sa négation (la suite ne converge pas vers \(\ell\)) :

On a inversé chaque quantificateur et nié l'inégalité finale.
:::

::: quiz Quiz 2.1
Quelle est la négation de \(\forall x \in \mathbb{R},\; \exists y \in \mathbb{R},\; y^2 = x\) ?
- [ ] \(\forall x,\; \forall y,\; y^2 \neq x\)
- [ ] \(\exists x,\; \exists y,\; y^2 = x\)
- [x] \(\exists x \in \mathbb{R},\; \forall y \in \mathbb{R},\; y^2 \neq x\)
- [ ] \(\forall x,\; \exists y,\; y^2 \neq x\)
> On échange chaque quantificateur et on nie : \(\forall \to \exists\), \(\exists \to \forall\), et \(y^2=x\) devient \(y^2\neq x\). (Au passage, l'énoncé original est faux : prendre \(x=-1\).)
:::

## 3. Ensembles

Un **ensemble** est une collection d'objets appelés **éléments**. On note \(x \in E\) (appartenance) et \(x \notin E\).

### Ensembles de nombres usuels

\(\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R} \subset \mathbb{C}\) : entiers naturels, relatifs, rationnels, réels, complexes.

::: def Définition — Inclusion & égalité
\(A \subseteq B\) signifie \(\forall x,\; (x\in A \Rightarrow x \in B)\). Et \(A = B \Leftrightarrow (A\subseteq B \text{ et } B \subseteq A)\). C'est la technique reine pour prouver une égalité d'ensembles : **double inclusion**.
:::

### Opérations

| Opération | Notation | Définition |
| --- | --- | --- |
| Union | \(A \cup B\) | \(\{x : x\in A \;\vee\; x\in B\}\) |
| Intersection | \(A \cap B\) | \(\{x : x\in A \;\wedge\; x\in B\}\) |
| Différence | \(A \setminus B\) | \(\{x : x\in A \;\wedge\; x\notin B\}\) |
| Complémentaire | \(\overline{A}\) ou \(A^c\) | \(\{x \in E : x \notin A\}\) |
| Produit cartésien | \(A \times B\) | \(\{(a,b) : a\in A,\; b\in B\}\) |

::: info Lois de De Morgan (ensembles)
\[ \overline{A \cup B} = \overline{A} \cap \overline{B} \qquad\qquad \overline{A \cap B} = \overline{A} \cup \overline{B} \] On retrouve exactement les lois de De Morgan logiques — normal, un ensemble n'est qu'un prédicat déguisé !
:::

::: def Cardinal & ensemble des parties
Le **cardinal** \(|A|\) (ou \(\#A\)) est le nombre d'éléments. L'**ensemble des parties** \(\mathcal{P}(E)\) contient tous les sous-ensembles de \(E\).

Si \(|E| = n\) alors \(|\mathcal{P}(E)| = 2^n\). Formule du crible : \(|A \cup B| = |A| + |B| - |A \cap B|\).
:::

::: info Exemple résolu
Soit \(E = \{1,2,3\}\). Alors \(\mathcal{P}(E) = \{\emptyset, \{1\},\{2\},\{3\},\{1,2\},\{1,3\},\{2,3\},\{1,2,3\}\}\), soit \(2^3 = 8\) éléments. ✔
:::

::: quiz Quiz 3.1
Si \(|A| = 4\) et \(|B| = 5\) avec \(|A \cap B| = 2\), combien vaut \(|A \cup B|\) ?
- [ ] 9
- [ ] 11
- [x] 7
- [ ] 2
> Formule du crible : \(|A\cup B| = |A|+|B|-|A\cap B| = 4+5-2 = 7\).
:::

## 4. Applications & fonctions

::: def Définition
Une **application** \(f : E \to F\) associe à chaque \(x \in E\) (l'*ensemble de départ*) un **unique** \(f(x) \in F\) (l'*ensemble d'arrivée*). On note \(x \mapsto f(x)\).
:::

::: def Injective, surjective, bijective
- **Injective** : \(f(x_1) = f(x_2) \Rightarrow x_1 = x_2\) (jamais deux antécédents pour une même image).
- **Surjective** : \(\forall y \in F,\; \exists x \in E,\; f(x) = y\) (tout élément d'arrivée est atteint).
- **Bijective** : injective *et* surjective (correspondance parfaite 1-1). Elle admet alors une **réciproque** \(f^{-1}\).
:::

::: info Lien Data
Une **fonction de hachage idéale** voudrait être injective (pas de collision). Un **index** de base de données est une bijection logique entre une clé et une ligne. L'**encodage one-hot** est une injection d'un ensemble de catégories vers \(\{0,1\}^n\).
:::

::: info Exemple résolu
\(f:\mathbb{R}\to\mathbb{R},\; x\mapsto x^2\) n'est **ni** injective (\(f(-2)=f(2)\)) **ni** surjective (aucun \(x\) ne donne \(-1\)).

Mais \(f:\mathbb{R}_{\geq 0}\to\mathbb{R}_{\geq 0},\; x\mapsto x^2\) est **bijective**, de réciproque \(y\mapsto \sqrt{y}\).
:::

::: quiz Quiz 4.1
L'application \(f:\mathbb{Z}\to\mathbb{Z},\; n\mapsto 2n\) est…
- [ ] surjective mais pas injective
- [ ] bijective
- [ ] ni l'une ni l'autre
- [x] injective mais pas surjective
> Injective : \(2n_1=2n_2 \Rightarrow n_1=n_2\) ✔. Mais pas surjective : aucun entier \(n\) ne vérifie \(2n=3\) (les impairs ne sont jamais atteints).
:::

## 5. Méthodes de preuve

Savoir *rédiger* une preuve rapporte énormément de points en partiel. Les quatre schémas à maîtriser :

### a) Preuve directe

On suppose \(P\) et on déroule des implications jusqu'à \(Q\). *Ex :* « \(n\) pair \(\Rightarrow n^2\) pair » : \(n = 2k \Rightarrow n^2 = 4k^2 = 2(2k^2)\), donc pair. ∎

### b) Par contraposée

Pour montrer \(P \Rightarrow Q\), on montre \(\neg Q \Rightarrow \neg P\) (logiquement équivalent). *Ex :* « si \(n^2\) est pair alors \(n\) est pair » se prouve facilement par contraposée : « si \(n\) impair alors \(n^2\) impair ».

### c) Par l'absurde

On suppose \(P\) **et** \(\neg Q\), et on en déduit une contradiction.

::: info Exemple culte — \(\sqrt{2}\) est irrationnel
Supposons \(\sqrt2 = \tfrac{p}{q}\) **irréductible**. Alors \(p^2 = 2q^2\), donc \(p^2\) pair, donc \(p\) pair : \(p=2k\). D'où \(4k^2 = 2q^2\), soit \(q^2 = 2k^2\), donc \(q\) pair aussi. Mais alors \(p\) et \(q\) sont tous deux pairs — contradiction avec « irréductible ». ∎
:::

### d) Par contre-exemple

Pour **réfuter** un \(\forall\), un seul contre-exemple suffit. « Tout nombre premier est impair » ? Faux : \(2\) est premier et pair.

::: quiz Quiz 5.1
Pour prouver « \(n^2\) impair \(\Rightarrow n\) impair », quelle méthode est la plus simple ?
- [x] La contraposée : « \(n\) pair \(\Rightarrow n^2\) pair »
- [ ] Un contre-exemple
- [ ] La récurrence sur \(n\)
- [ ] La preuve directe à partir de \(n^2\)
> La contraposée transforme un énoncé difficile (partir de \(n^2\)) en un énoncé trivial (partir de \(n\) pair). C'est le réflexe à avoir.
:::

## 6. Le raisonnement par récurrence

::: info Principe de récurrence
1. **Initialisation** : montrer \(P(n_0)\).
2. **Hérédité** : montrer \(\forall n \geq n_0,\; \big(P(n) \Rightarrow P(n+1)\big)\).
3. **Conclusion** : alors \(P(n)\) est vraie pour tout \(n \geq n_0\).
:::

::: info Exemple résolu
Montrons \(\displaystyle \sum_{k=1}^{n} k = \frac{n(n+1)}{2}\).

**Initialisation** (\(n=1\)) : \(\sum = 1\) et \(\frac{1\cdot 2}{2} = 1\). ✔

**Hérédité** : supposons \(\sum_{k=1}^n k = \frac{n(n+1)}{2}\). Alors \[\sum_{k=1}^{n+1} k = \frac{n(n+1)}{2} + (n+1) = (n+1)\Big(\frac{n}{2}+1\Big) = \frac{(n+1)(n+2)}{2}.\] C'est bien \(P(n+1)\). ∎
:::

::: info Erreurs qui coûtent cher
Oublier l'initialisation ; confondre « supposer \(P(n)\) » (autorisé, c'est l'hypothèse de récurrence) avec « supposer ce qu'on veut prouver ». Pour certaines suites, utiliser la **récurrence forte** : on suppose \(P(n_0),\dots,P(n)\) tous vrais.
:::

::: info Lien Data / Info
La récurrence est le pendant mathématique de la **récursivité** en programmation. Prouver qu'un algorithme récursif est correct = initialisation (cas de base) + hérédité (appel récursif). C'est aussi la base des preuves de complexité (ex. tri fusion en \(O(n\log n)\)).
:::

::: quiz Quiz 6.1
Dans une récurrence, l'« hypothèse de récurrence » est…
- [ ] ce qu'on veut prouver, supposé vrai pour tout \(n\) (interdit)
- [x] la supposition que \(P(n)\) est vraie, pour en déduire \(P(n+1)\)
- [ ] le cas de base \(P(n_0)\)
- [ ] la conclusion finale
> On suppose \(P(n)\) vraie à un rang \(n\) fixé (hypothèse de récurrence) et on démontre \(P(n+1)\). On ne suppose jamais \(P\) vraie pour tout \(n\) — ce serait supposer le résultat.
:::

## 7. Et dans la Data, concrètement ?

- **SQL = algèbre des ensembles.** `UNION` = \(\cup\), `INTERSECT` = \(\cap\), `EXCEPT` = \(\setminus\), un `JOIN` s'appuie sur le produit cartésien \(A\times B\) filtré par un prédicat.
- **Filtres & requêtes = logique propositionnelle.** Un `WHERE age > 18 AND pays = 'FR'` est une conjonction ; De Morgan sert à réécrire/optimiser les conditions.
- **Quantificateurs = agrégations.** \(\exists\) ↔ `EXISTS` / `ANY` ; \(\forall\) ↔ `ALL` / « aucun contre-exemple ».
- **Fonctions injectives = clés & hachage.** Une clé primaire garantit l'unicité (injectivité) ; les collisions de hachage sont des violations d'injectivité.
- **Récurrence = récursivité & preuves d'algorithmes.** Fondamental pour MapReduce, les parcours de graphes, le diviser-pour-régner.

::: info Pour approfondir
[Calcul propositionnel (Wikipédia)](https://fr.wikipedia.org/wiki/Calcul_des_propositions) [Théorie des ensembles](https://fr.wikipedia.org/wiki/Th%C3%A9orie_des_ensembles) [Khan Academy (maths)](https://www.khanacademy.org/math) [MIT 6.042 — Maths pour l'informatique](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/)
:::

## 8. Exercices de synthèse

::: exo Exercice 1 — Logique
Écris la négation, en français *et* en symboles, de : « Tous les étudiants de la classe ont rendu au moins un devoir. »
?? Voir la solution
Original : \(\forall e,\; \exists d,\; \text{Rendu}(e,d)\). Négation : \(\exists e,\; \forall d,\; \neg\text{Rendu}(e,d)\).

En français : « **Il existe au moins un étudiant qui n'a rendu aucun devoir.** »
:::

::: exo Exercice 2 — Ensembles (double inclusion)
Démontre que \(A \setminus (B \cup C) = (A\setminus B) \cap (A \setminus C)\).
?? Voir la solution
Soit \(x\). On a la chaîne d'équivalences :

\(x \in A\setminus(B\cup C) \Leftrightarrow x\in A \wedge \neg(x\in B \vee x\in C) \Leftrightarrow x\in A \wedge (x\notin B \wedge x\notin C)\) (De Morgan).

\(\Leftrightarrow (x\in A \wedge x\notin B) \wedge (x\in A \wedge x\notin C) \Leftrightarrow x\in(A\setminus B)\cap(A\setminus C)\). ∎
:::

::: exo Exercice 3 — Fonctions
Soit \(f:E\to F\) et \(g:F\to G\). Montre que si \(g\circ f\) est injective, alors \(f\) est injective.
?? Voir la solution
Soit \(x_1,x_2\in E\) avec \(f(x_1)=f(x_2)\). En appliquant \(g\) : \(g(f(x_1))=g(f(x_2))\), i.e. \((g\circ f)(x_1)=(g\circ f)(x_2)\). Comme \(g\circ f\) est injective, \(x_1=x_2\). Donc \(f\) est injective. ∎ *(Remarque : \(g\) n'a pas besoin d'être injective.)*
:::

::: exo Exercice 4 — Récurrence (⭐ difficile)
Montre que \(\forall n\geq 1,\; 7^n - 1\) est divisible par \(6\).
?? Voir la solution
**Init** (\(n=1\)) : \(7-1=6\) divisible par 6 ✔.

**Hérédité** : supposons \(6 \mid 7^n-1\), i.e. \(7^n = 1 + 6k\). Alors \(7^{n+1}-1 = 7\cdot 7^n - 1 = 7(1+6k)-1 = 6 + 42k = 6(1+7k)\), divisible par 6. ∎
:::

::: exo Exercice 5 — Vrai/Faux à justifier
« Si \(A\cup B = A\cup C\) alors \(B = C\). » Vrai ou faux ?
?? Voir la solution
**Faux.** Contre-exemple : \(A=\{1\}\), \(B=\{1\}\), \(C=\{\}\). Alors \(A\cup B = \{1\} = A\cup C\), mais \(B\neq C\). (L'égalité serait vraie en ajoutant \(A\cap B = A\cap C\).)
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi. À lire quand tu veux.
Les maths de ce module — logique, ensembles, preuves — sont nées d'un rêve vieux de 2 000 ans : **mécaniser le raisonnement**. D'Aristote et ses syllogismes (~350 av. J.-C.) jusqu'à l'ordinateur, c'est la longue quête pour rendre la pensée *calculable*. Au XIXᵉ siècle tout s'accélère, puis une « crise des fondements » secoue les mathématiques entre 1900 et 1931.

#### Les grands noms
- **George Boole** (1815-1864) — invente l'*algèbre de la logique* (*The Laws of Thought*, 1854). Le « booléen » (vrai/faux, AND/OR/NOT) porte son nom.
- **Georg Cantor** (1845-1918) — fonde la théorie des ensembles et prouve qu'il existe *plusieurs infinis*. Hué de son vivant, célébré aujourd'hui.
- **Gottlob Frege** (1848-1925) — crée la logique des prédicats (∀, ∃), socle de toutes les maths formelles.
- **David Hilbert** (1862-1943) — rêve de fonder les maths sur des axiomes parfaitement sûrs (le « programme de Hilbert »).
- **Kurt Gödel** (1906-1978) — démontre en 1931 qu'aucun système cohérent ne peut *tout* prouver (théorèmes d'incomplétude). Coup de tonnerre.
- **Alan Turing** (1912-1954) — relie logique et calcul (machine de Turing, 1936) : l'acte de naissance de l'informatique.

#### Le tournant décisif
En 1937, un jeune ingénieur du nom de **Claude Shannon** montre que l'algèbre de Boole décrit exactement le comportement des *circuits électriques*. Résultat : tout ordinateur « raisonne » en booléens. La théorie des ensembles de Cantor, elle, est devenue le *langage universel* dans lequel on écrit presque toutes les mathématiques.

#### Pourquoi ça te concerne
Un `WHERE` en SQL, un `if`, un masque booléen NumPy, une jointure… tu utilises Boole et Frege tous les jours sans le savoir. Et les limites découvertes par Gödel et Turing expliquent pourquoi certains problèmes sont *indécidables* — aucune IA ne les résoudra jamais.
- [George Boole](https://fr.wikipedia.org/wiki/George_Boole)
- [Georg Cantor](https://fr.wikipedia.org/wiki/Georg_Cantor)
- [Incomplétude de Gödel](https://fr.wikipedia.org/wiki/Th%C3%A9or%C3%A8mes_d%27incompl%C3%A9tude_de_G%C3%B6del)
- [Alan Turing](https://fr.wikipedia.org/wiki/Alan_Turing)
- [La crise des fondements](https://fr.wikipedia.org/wiki/Crise_des_fondements_des_math%C3%A9matiques)
:::
