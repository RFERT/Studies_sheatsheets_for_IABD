---
title: Module 9 — Maths du Big Data
subtitle: Quand les données ne tiennent plus en mémoire ni en temps raisonnable, on troque l'exactitude contre des réponses *approchées mais ultra-rapides et compactes*. Hashing, structures probabilistes, streaming et similarité à grande échelle : les maths qui font tourner le Big Data.
domains: BIG DATA, DATA, IA
objectifs: Comprendre le hachage et les collisions ; savoir ce qu'est un filtre de Bloom et un HyperLogLog ; comprendre similarité de Jaccard, MinHash et LSH ; saisir le modèle streaming et la logique MapReduce.
---

## 1. Hachage & collisions

::: def Fonction de hachage
Une **fonction de hachage** \(h\) transforme une donnée (clé) de taille quelconque en un entier de taille fixe (l'empreinte), idéalement réparti uniformément. Propriétés voulues : rapide, déterministe, uniforme.
:::

::: info Collisions (lien Modules 1, 7)
Deux clés différentes peuvent avoir le même haché : c'est une **collision**. Par le principe des tiroirs, elles sont inévitables dès qu'il y a plus de clés que de cases. On les gère (chaînage, adressage ouvert) ou on les *exploite* (structures probabilistes ci-dessous).
:::

::: info BIG DATA Lien
Hachage = base des **tables de hachage** (O(1) moyen), du **sharding** (répartir les données par \(h(\text{clé}) \bmod n\), lien congruence Module 1), du **consistent hashing** (équilibrage de charge, caches distribués).
:::

::: quiz Quiz 1.1
Une collision de hachage se produit quand…
- [ ] deux clés identiques ont le même haché
- [x] deux clés différentes ont le même haché
- [ ] une clé n'a pas de haché
- [ ] la table est vide
> Collision = deux clés DIFFÉRENTES tombent sur la même case. Inévitable dès qu'il y a plus de clés que de cases (principe des tiroirs, Module 7).
:::

## 2. Filtre de Bloom ⭐

::: def Principe
Un **filtre de Bloom** teste l'appartenance à un ensemble de façon ultra-compacte. Un tableau de \(m\) bits + \(k\) fonctions de hachage. Pour *insérer* \(x\) : on met à 1 les bits \(h_1(x),\dots,h_k(x)\). Pour *tester* \(x\) : si l'un de ces bits est 0 → **absent à coup sûr** ; s'ils sont tous à 1 → **probablement présent**.
:::

::: info Compromis fondamental
**Faux positifs possibles, faux négatifs impossibles.** On peut croire à tort qu'un élément est présent, jamais l'inverse. En échange : mémoire minuscule, tests en O(k). Taux de faux positifs ≈ \(\left(1 - e^{-kn/m}\right)^k\).
:::

::: info BIG DATA Lien
Bases NoSQL (Cassandra, HBase, Bigtable) : éviter de lire le disque pour une clé absente. Navigateurs : URLs malveillantes. Caches, dédup, « cet utilisateur a-t-il déjà vu ce contenu ? ».
:::

::: quiz Quiz 2.1
Un filtre de Bloom répond « présent ». Que peut-on conclure ?
- [ ] l'élément est certainement présent
- [ ] l'élément est certainement absent
- [x] l'élément est probablement présent (faux positif possible)
- [ ] le filtre est cassé
> Bloom : « présent » = PROBABLEMENT présent (faux positif possible). Seul « absent » est certain. D'où son usage comme pré-filtre avant une vérification coûteuse.
:::

::: quiz Quiz 2.2
Quel type d'erreur un filtre de Bloom ne commet JAMAIS ?
- [x] faux négatif (dire « absent » à tort)
- [ ] faux positif
- [ ] aucune erreur
- [ ] il se trompe toujours
> Un élément inséré a tous ses bits à 1 : le test le retrouvera toujours. Donc jamais de faux négatif. Seuls les faux positifs existent.
:::

## 3. HyperLogLog — compter les éléments distincts

::: def Problème & idée
Compter le nombre d'**éléments distincts** (cardinalité) dans un flux massif, sans stocker tous les éléments. **HyperLogLog** estime ce nombre avec une précision ~2 % en utilisant seulement quelques **kilo-octets**, en observant le plus long préfixe de zéros dans les hachés (plus on voit de zéros, plus il y a probablement d'éléments distincts).
:::

::: info BIG DATA Lien
« Combien de visiteurs uniques aujourd'hui ? » sur des milliards d'événements : Redis, Presto, BigQuery (`APPROX_COUNT_DISTINCT`) utilisent HyperLogLog. Compter l'exact coûterait trop de mémoire.
:::

::: quiz Quiz 3.1
HyperLogLog sert à estimer…
- [ ] la somme des valeurs
- [x] le nombre d'éléments distincts (cardinalité)
- [ ] la médiane
- [ ] le maximum
> HLL estime le nombre de valeurs DISTINCTES d'un flux avec très peu de mémoire (ex. visiteurs uniques). Idéal quand l'exact serait trop coûteux.
:::

## 4. Similarité de Jaccard & MinHash ⭐

::: def Indice de Jaccard
Pour deux ensembles \(A,B\) : \[ J(A,B) = \frac{|A\cap B|}{|A\cup B|} \in [0,1] \] 1 = identiques, 0 = disjoints. Mesure la similarité de deux ensembles (ex. mots de deux documents).
:::

::: info MinHash — l'astuce géniale
En appliquant une permutation aléatoire \(h\) et en gardant le minimum des hachés, on a la propriété magique : \[ P\big(\min h(A) = \min h(B)\big) = J(A,B) \] En répétant avec \(k\) fonctions, on estime \(J\) en comparant de petites **signatures** au lieu des ensembles entiers. Compression énorme.
:::

::: info DATA Lien
Détection de **quasi-doublons** (pages web, articles), de plagiat, de similarité de documents à l'échelle du web.
:::

::: quiz Quiz 4.1
\(A=\{1,2,3,4\}\), \(B=\{3,4,5\}\). Que vaut l'indice de Jaccard \(J(A,B)\) ?
- [ ] 1/2
- [ ] 3/4
- [ ] 2/3
- [x] 2/5
> A∩B={3,4} (2 éléments), A∪B={1,2,3,4,5} (5 éléments). J = 2/5 = 0,4.
:::

::: quiz Quiz 4.2
La propriété clé de MinHash est que \(P(\min h(A)=\min h(B))\) égale…
- [x] la similarité de Jaccard J(A,B)
- [ ] 0 toujours
- [ ] la taille de A
- [ ] la distance euclidienne
> C'est le théorème central de MinHash : la probabilité de collision des minima estime exactement J(A,B). On remplace des ensembles énormes par de courtes signatures.
:::

## 5. LSH — Locality-Sensitive Hashing

::: def Idée
Problème : trouver les voisins proches parmi des milliards de vecteurs est trop coûteux en comparaison exhaustive (\(O(n^2)\)). **LSH** utilise des fonctions de hachage spéciales telles que les éléments **similaires** tombent dans la **même case** avec forte probabilité. On ne compare alors qu'au sein des cases.
:::

::: info IA BIG DATA Lien
**Recherche de voisins approchés (ANN)** dans les bases vectorielles (recommandation, recherche d'images, RAG des LLM). Alternatives modernes : HNSW, FAISS. Transforme une recherche \(O(n)\) en quasi-\(O(1)\).
:::

::: quiz Quiz 5.1
Contrairement au hachage classique, LSH veut que…
- [ ] tout soit réparti uniformément sans structure
- [ ] chaque élément ait une case unique
- [x] les éléments similaires tombent dans la même case
- [ ] il n'y ait jamais de collision
> LSH cherche justement à provoquer des collisions ENTRE éléments similaires, pour regrouper les candidats voisins et éviter la comparaison exhaustive.
:::

## 6. Streaming & MapReduce

::: def Modèle streaming
Les données arrivent en **flux continu**, vues une seule fois, trop volumineuses pour être stockées. On maintient un **résumé** (sketch) en mémoire limitée : moyenne glissante, comptage approché, top-k fréquents (Count-Min Sketch), quantiles approchés.
:::

::: def MapReduce — diviser pour régner (lien récurrence Module 0)
- **Map** : transformer chaque donnée en paires (clé, valeur), en parallèle sur des milliers de machines.
- **Shuffle** : regrouper par clé (lien partition / relation d'équivalence, Module 1 !).
- **Reduce** : agréger les valeurs de chaque clé.
:::

::: info BIG DATA Lien
Hadoop, Spark, Flink. Le fameux « word count » est le hello world de MapReduce. Le streaming alimente la détection de fraude en temps réel, les dashboards live, l'IoT.
:::

::: quiz Quiz 6.1
Dans MapReduce, l'étape « Shuffle » regroupe les données…
- [ ] au hasard
- [x] par clé (comme une partition / relation d'équivalence)
- [ ] par ordre d'arrivée
- [ ] par taille
> Le shuffle regroupe toutes les valeurs d'une même clé ensemble : c'est exactement une partition par la relation « avoir la même clé » (Module 1). Puis Reduce agrège chaque groupe.
:::

::: quiz Quiz 6.2
Quelle propriété mathématique d'une opération la rend facilement parallélisable (MapReduce) ?
- [x] être associative et commutative (ex. somme, max, union)
- [ ] être une division
- [ ] être non déterministe
- [ ] être récursive uniquement
> Associativité + commutativité permettent de combiner les résultats partiels dans n'importe quel ordre/regroupement → parallélisme massif. La soustraction/division ne le permettent pas.
:::

## 7. Domaines, usages & métiers

| Notion | Domaine | Usage | Métiers |
| --- | --- | --- | --- |
| Hashing / sharding | BIG DATA | Tables O(1), répartition, caches distribués | Data Engineer, SRE |
| Filtre de Bloom | BIG DATA | Pré-filtre NoSQL, dédup, sécurité URL | Data Engineer, Backend |
| HyperLogLog | BIG DATA | Visiteurs uniques, cardinalité approchée | Data Engineer, Analyst |
| MinHash/Jaccard | DATA | Quasi-doublons, plagiat, similarité docs | Data Scientist |
| LSH / ANN | IA | Recherche vectorielle, reco, RAG | ML Engineer, Search |
| MapReduce/Streaming | BIG DATA | Traitement distribué, temps réel | Data Engineer, MLOps |

::: info Pour approfondir
[Mining of Massive Datasets (livre gratuit, référence)](http://www.mmds.org/) [Filtre de Bloom](https://fr.wikipedia.org/wiki/Filtre_de_Bloom) [MinHash](https://fr.wikipedia.org/wiki/MinHash) [MapReduce](https://fr.wikipedia.org/wiki/MapReduce)
:::

## 8. Exercices de synthèse

::: exo Exercice 1 — Jaccard
Deux documents ont pour ensembles de mots \(A=\{data,big,math,ia\}\) et \(B=\{big,math,ia,ml\}\). Calcule leur similarité de Jaccard.
?? Voir la solution
\(A\cap B=\{big,math,ia\}\) (3), \(A\cup B=\{data,big,math,ia,ml\}\) (5). \(J=3/5=0{,}6\) → assez similaires.
:::

::: exo Exercice 2 — Bloom (⭐)
Pourquoi un filtre de Bloom est-il parfait comme pré-filtre avant une lecture disque coûteuse dans une base NoSQL ?
?? Voir la solution
Si Bloom dit « absent » (certain), on évite une lecture disque inutile — gain énorme pour les clés inexistantes. S'il dit « présent » (peut-être), on lit le disque pour vérifier. Comme il n'y a jamais de faux négatif, on ne rate jamais une vraie donnée. Coût mémoire minuscule pour un gain massif en I/O.
:::

::: exo Exercice 3 — MapReduce (⭐)
Esquisse le « word count » (compter les occurrences de chaque mot) en Map/Reduce.
?? Voir la solution
**Map** : pour chaque mot \(w\) lu, émettre \((w, 1)\). **Shuffle** : regrouper par mot. **Reduce** : pour chaque mot, sommer les 1 → \((w, \text{total})\). La somme est associative/commutative → parallélisable sur tout le cluster.
:::

::: exo Exercice 4 — Synthèse transversale (⭐⭐)
Relie chaque outil de ce module à une notion d'un module précédent.
?? Voir la solution
- Collisions ← principe des tiroirs (Module 7) & congruence (Module 1).
- Shuffle MapReduce ← partition / relation d'équivalence (Module 1).
- MinHash ← probabilités (Module 3) & ensembles (Module 0).
- LSH/ANN ← similarité cosinus & vecteurs (Module 2).
- MapReduce « diviser pour régner » ← récurrence (Module 0) & complexité (Module 7).

Tout le cours se referme ici : le Big Data, c'est l'algèbre + les probas + le discret appliqués à l'échelle. 🎯
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi.
Au début des années 2000, Google doit indexer **tout le web**. Les solutions qu'il invente pour y parvenir vont, presque par accident, créer tout l'écosystème Big Data moderne.

#### Les grands noms
- **Doug Laney** (2001) — formule les « *3 V* » du Big Data : Volume, Vélocité, Variété.
- **Jeff Dean & Sanjay Ghemawat** (Google, 2003-2004) — GFS puis *MapReduce* : calculer sur des milliers de machines… simplement.
- **Doug Cutting** (2006) — crée *Hadoop*, implémentation libre de MapReduce. Le nom ? L'éléphant en peluche jaune de son fils.
- **Eric Brewer** (2000) — le théorème *CAP* : un système distribué ne peut garantir à la fois cohérence, disponibilité et tolérance au partitionnement.
- **Matei Zaharia** (Berkeley, ~2012) — crée *Apache Spark*, souvent 100× plus rapide que Hadoop.

#### Le tournant décisif
MapReduce *démocratise* le calcul distribué ; Spark le rend rapide et interactif ; le mouvement *NoSQL* repense les bases de données pour l'échelle du web. Des structures malignes comme le **filtre de Bloom** (Burton Bloom, 1970) permettent de « tenir » des milliards d'éléments en mémoire.

#### Pourquoi ça te concerne
Spark, Kafka, data lakes, filtres de Bloom, MinHash : ce module est le **pont direct** vers ton futur métier de data engineer / ingénieur IABD.
- [MapReduce](https://fr.wikipedia.org/wiki/MapReduce)
- [Hadoop](https://fr.wikipedia.org/wiki/Hadoop)
- [Apache Spark](https://fr.wikipedia.org/wiki/Apache_Spark)
- [Théorème CAP](https://fr.wikipedia.org/wiki/Th%C3%A9or%C3%A8me_CAP)
- [Mining of Massive Datasets (livre)](http://www.mmds.org/)
:::
