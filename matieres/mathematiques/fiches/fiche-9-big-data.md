# 📝 Fiche de révision — Module 9 : Maths du Big Data

> Hashing · Bloom · HyperLogLog · Jaccard/MinHash · LSH · Streaming/MapReduce — 🟪 BIG DATA · 🟦 DATA · 🟩 IA

---

## 1. Hachage & collisions
- `h` : clé → entier taille fixe, rapide/déterministe/uniforme.
- **Collision** = 2 clés différentes, même haché (inévitable, pigeonhole Module 7).
- 🟪 tables O(1), **sharding** `h(clé) mod n` (congruence Module 1), consistent hashing.

## 2. Filtre de Bloom ⭐
- m bits + k hachages. Insert : bits à 1. Test : un bit à 0 → **absent sûr** ; tous à 1 → **probablement présent**.
- ⚠️ **Faux positifs possibles, faux négatifs JAMAIS**.
- 🟪 pré-filtre NoSQL (Cassandra/HBase), URLs malveillantes, dédup.

## 3. HyperLogLog
- Estime le **nombre d'éléments distincts** (cardinalité) avec ~ko de mémoire (~2 % erreur).
- 🟪 visiteurs uniques, `APPROX_COUNT_DISTINCT` (BigQuery/Redis).

## 4. Jaccard & MinHash ⭐
- **Jaccard** : `J(A,B) = |A∩B|/|A∪B| ∈ [0,1]`.
- **MinHash** : `P(min h(A)=min h(B)) = J(A,B)`. Signatures courtes → estime J.
- 🟦 quasi-doublons, plagiat, similarité de documents.

## 5. LSH
- Hachage où les **éléments similaires → même case** (collisions voulues !).
- 🟩🟪 recherche de voisins approchés (ANN), bases vectorielles, reco, RAG. (cf. HNSW, FAISS)

## 6. Streaming & MapReduce
- **Streaming** : flux vu une fois, mémoire limitée → sketches (Count-Min, quantiles).
- **MapReduce** : Map (clé,valeur) → **Shuffle** (regroupe par clé = partition, Module 1) → Reduce (agrège).
- ⭐ opérations **associatives + commutatives** (somme, max, union) = parallélisables.
- 🟪 Hadoop, Spark, Flink ; « word count » = hello world.

---

## ✅ Auto-test
1. Collision = ? → 2 clés diff., même haché
2. Bloom « présent » = ? → probablement (faux positif possible)
3. Bloom ne fait jamais ? → faux négatif
4. HLL estime ? → cardinalité (distincts)
5. J({1,2,3,4},{3,4,5}) ? → 2/5
6. Propriété MinHash ? → P(collision min)=J
7. LSH veut ? → similaires dans même case
8. Shuffle regroupe par ? → clé (partition)

## 🔗 Synthèse transversale
Collisions←tiroirs/congruence · Shuffle←partition · MinHash←probas/ensembles · LSH←vecteurs/cosinus · MapReduce←récurrence/complexité.

*Liens : [Mining of Massive Datasets](http://www.mmds.org/) · [Bloom](https://fr.wikipedia.org/wiki/Filtre_de_Bloom) · [MinHash](https://fr.wikipedia.org/wiki/MinHash) · [MapReduce](https://fr.wikipedia.org/wiki/MapReduce)*
