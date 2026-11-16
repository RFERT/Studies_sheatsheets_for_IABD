---
title: Hadoop — HDFS, MapReduce et YARN
subtitle: Le premier écosystème Big Data open source, dont les idées (blocs répliqués, map/shuffle/reduce) sont partout.
domains: BIG DATA
tags: Hadoop, HDFS, NameNode, DataNode, bloc, réplication, MapReduce, shuffle, combiner, YARN, Hive
niveau: Intermédiaire
duree: 60 min
objectifs: Décrire le stockage d'un fichier dans HDFS ; écrire un traitement en map/reduce (word count, agrégations, jointure) ; expliquer le shuffle et l'intérêt d'un combiner ; situer YARN et Hive ; connaître les limites qui ont mené à Spark.
---

::: goal Ce que tu sauras faire à la fin
- Calculer en combien de blocs et de copies un fichier est stocké dans HDFS.
- Exprimer un calcul (comptage, moyenne, jointure) sous forme de fonctions `map` et `reduce`.
- Expliquer pourquoi MapReduce est lent pour les algorithmes itératifs.
:::

## 1. HDFS : un système de fichiers distribué

**HDFS** (*Hadoop Distributed File System*) présente des milliers de disques comme un seul système de fichiers. Il est conçu pour de **très gros fichiers**, lus **séquentiellement**, écrits une fois (*write once, read many*).

| Composant | Rôle |
|---|---|
| **NameNode** | le « catalogue » : arborescence, liste des blocs de chaque fichier, emplacement des copies (métadonnées en mémoire) |
| **DataNode** | stocke les blocs sur ses disques locaux, envoie régulièrement un *heartbeat* au NameNode |
| Bloc | morceau de fichier de **128 Mo** par défaut |
| Réplication | **3 copies** par défaut, placées sur des machines (et si possible des baies) différentes |

::: example Un fichier de 1 Go
1 Go = 1 024 Mo → \(\lceil 1\,024 / 128 \rceil = 8\) blocs, chacun copié 3 fois : **24 blocs** répartis sur le cluster, soit 3 Go d'espace disque. Un fichier de 130 Mo occupe 2 blocs ; le second ne contient que 2 Mo (un bloc incomplet n'occupe que sa taille réelle sur le disque).
:::

- Si un DataNode cesse d'envoyer ses heartbeats, le NameNode le déclare mort et **re-réplique** ses blocs ailleurs pour revenir à 3 copies.
- Les gros blocs limitent le nombre de métadonnées et favorisent les lectures séquentielles. Revers : HDFS gère mal des **millions de petits fichiers** (chacun coûte de la mémoire au NameNode).
- Le NameNode est un point critique : en production on le double (*High Availability*, NameNode de secours).

```bash
hdfs dfs -mkdir -p /data/logs
hdfs dfs -put access.log /data/logs/          # copier vers HDFS
hdfs dfs -ls /data/logs
hdfs fsck /data/logs/access.log -files -blocks -locations   # voir blocs et copies
```

::: quiz Quiz 2.1 — Blocs
Un fichier de 300 Mo est stocké dans HDFS (blocs de 128 Mo, réplication 3). Combien de blocs physiques au total ?
- [ ] 3
- [x] 9
- [ ] 7
> 300 / 128 = 2,34 → 3 blocs logiques (128 + 128 + 44 Mo), chacun en 3 copies : 9 blocs physiques. La réponse 3 oublie la réplication ; 7 viendrait d'un mauvais arrondi.
:::

## 2. Le modèle MapReduce

L'idée (Google, 2004) : beaucoup de traitements sur de gros volumes s'écrivent en **deux fonctions** que le framework exécute en parallèle, en gérant lui-même la distribution et les pannes.

\[ \text{map} : (k_1, v_1) \to \text{liste}(k_2, v_2) \qquad \text{reduce} : (k_2, \text{liste}(v_2)) \to \text{liste}(k_3, v_3) \]

```text
 Entrée (blocs HDFS)      MAP                SHUFFLE & SORT            REDUCE           Sortie
 ┌───────────────┐   ┌────────────┐       ┌───────────────────┐     ┌──────────┐
 │ le chat dort  │ → │ (le,1)     │       │ chat → [1,1]      │  →  │ (chat,2) │
 │               │   │ (chat,1)   │  ───► │ dort → [1]        │  →  │ (dort,1) │
 ├───────────────┤   │ (dort,1)   │       │ le   → [1,1,1]    │  →  │ (le,3)   │
 │ le chat et le │ → │ (le,1)…    │       │ et   → [1]        │  →  │ (et,1)   │
 └───────────────┘   └────────────┘       └───────────────────┘     └──────────┘
   1 tâche map par bloc      regroupement de toutes les valeurs d'une même clé
```

1. **Map** : chaque bloc est traité **localement** par une tâche map (localité des données) qui émet des paires (clé, valeur).
2. **Shuffle & sort** : le framework envoie toutes les paires d'une même clé vers le **même** reducer (par hachage de la clé) et les trie. C'est le seul moment où les données traversent massivement le réseau.
3. **Reduce** : pour chaque clé, une fonction agrège la liste des valeurs.

### Le word count en Python (style Hadoop Streaming)

```python
# mapper.py — lit des lignes sur stdin, émet "mot\t1"
import sys
for line in sys.stdin:
    for word in line.lower().split():
        print(f"{word}\t1")
```

```python
# reducer.py — reçoit les lignes TRIÉES par clé : on somme tant que la clé ne change pas
import sys
current, total = None, 0
for line in sys.stdin:
    word, count = line.rstrip("\n").split("\t")
    if word != current:
        if current is not None:
            print(f"{current}\t{total}")
        current, total = word, 0
    total += int(count)
if current is not None:
    print(f"{current}\t{total}")
```

::: tip Tester sans cluster
Le pipeline Unix reproduit exactement le modèle : `cat texte.txt | python mapper.py | sort | python reducer.py`. Le `sort` joue le rôle du shuffle.
:::

## 3. Le combiner : réduire avant de transférer

Pour un mot fréquent comme « le », chaque tâche map émet des milliers de paires (le, 1) qui traversent le réseau. Un **combiner** applique une réduction **locale**, sur la sortie de chaque map, avant le shuffle : (le, 1) × 3 000 devient (le, 3 000).

::: warn Quand un combiner est-il correct ?
Seulement si l'opération est **associative et commutative** et que le combiner produit le même type de valeurs que le map. La **somme**, le **max**, le **min** : oui. La **moyenne** : non directement — moyenne de moyennes ≠ moyenne globale. On transporte alors des paires **(somme, effectif)** et on divise seulement à la fin.
:::

::: example Moyenne correcte avec combiner
Map émet (ville, (montant, 1)). Combiner et reducer additionnent composante par composante : (Paris, (120, 1)) + (Paris, (80, 1)) → (Paris, (200, 2)). Reducer final : 200 / 2 = 100. Avec des moyennes partielles (100 sur 2 ventes, 50 sur 1 vente), la moyenne des moyennes donnerait 75 au lieu de \(250/3 \approx 83{,}3\).
:::

## 4. Exprimer d'autres traitements

| Traitement | Map émet | Reduce fait |
|---|---|---|
| Comptage par catégorie | (catégorie, 1) | somme |
| Maximum par groupe | (groupe, valeur) | max |
| Index inversé (moteur de recherche) | (mot, id_document) | liste des documents |
| Dédoublonnage | (ligne, rien) | émet la clé une fois |
| Jointure (*reduce-side*) | (clé_jointure, (« A », ligne)) et (clé, (« B », ligne)) | combine les lignes A et B de la même clé |

::: quiz Quiz 2.2 — Shuffle
Dans un word count, pourquoi tous les (« chat », 1) arrivent-ils au même reducer ?
- [ ] Parce qu'ils sont produits par la même tâche map
- [x] Parce que le shuffle route chaque clé vers un reducer déterminé par le hachage de la clé
- [ ] Parce que HDFS stocke les mots par ordre alphabétique
> Les paires d'une même clé viennent de toutes les tâches map. Le partitionneur (par défaut hash(clé) mod nombre de reducers) garantit qu'une clé donnée aboutit toujours au même reducer, qui voit donc toutes ses valeurs.
:::

## 5. YARN et l'écosystème

**YARN** (*Yet Another Resource Negotiator*, Hadoop 2, 2013) sépare la **gestion des ressources** du **modèle de calcul** : un ResourceManager attribue des conteneurs (CPU, mémoire) sur les NodeManagers. MapReduce n'est plus qu'une application parmi d'autres ; Spark, Hive ou Flink tournent aussi sur YARN.

| Outil | Rôle |
|---|---|
| **Hive** | SQL sur des fichiers HDFS (traduit en jobs MapReduce, puis Tez ou Spark) |
| **HBase** | base NoSQL orientée colonnes au-dessus de HDFS, accès aléatoire rapide |
| **Sqoop** | import/export entre bases relationnelles et HDFS (projet retiré depuis) |
| **Oozie / Airflow** | orchestration des chaînes de traitements |

```sql
-- Hive : la même agrégation, en SQL, sur un fichier HDFS
CREATE EXTERNAL TABLE logs (ip STRING, url STRING, status INT)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t' LOCATION '/data/logs';
SELECT status, COUNT(*) AS n FROM logs GROUP BY status ORDER BY n DESC;
```

## 6. Les limites de MapReduce

- Chaque job **écrit ses résultats sur disque** (HDFS, répliqué 3 fois) avant que le suivant les relise.
- Un algorithme **itératif** (K-means, PageRank, descente de gradient : des dizaines de passes sur les mêmes données) relit tout depuis le disque à chaque itération : très lent.
- Le modèle map/reduce est **rigide** : une requête complexe devient une longue chaîne de jobs.
- Latence élevée (démarrage des tâches) : inadapté à l'interactif et au temps réel.

Spark (module suivant) garde les idées de MapReduce (partitionnement, localité, shuffle, tolérance aux pannes) mais travaille **en mémoire** et sur un graphe d'opérations quelconque.

::: exo Exercice 1 — Concevoir un MapReduce
À partir de logs `date \t ip \t url \t code_http`, on veut le nombre de visiteurs **distincts** (IP) par jour.
1. Propose map et reduce.
2. Un combiner simple « compter » est-il correct ? Pourquoi ?
?? Voir la solution
1. **Map** : émettre ((date, ip), 1) — ou simplement (date, ip). **Reduce** pour la clé date : construire l'**ensemble** des IP reçues et émettre (date, taille de l'ensemble). Variante en deux jobs : job 1 dédoublonne les couples (date, ip), job 2 compte les couples par date.
2. Non : un combiner qui compterait les IP par date sur chaque map donnerait des comptes partiels qu'on ne peut pas additionner (une même IP peut apparaître dans plusieurs blocs → comptée plusieurs fois). Le combiner peut seulement **dédoublonner localement** les IP. À très grande échelle, on utilise un **HyperLogLog** (maths, module 9), dont les sketches **se fusionnent** correctement.
:::

::: exo Exercice 2 — Quel volume traverse le réseau ?
Un word count traite 100 blocs ; chaque map émet 10 millions de paires d'environ 10 octets, mais seulement 50 000 mots distincts par bloc.
1. Volume du shuffle sans combiner ?
2. Avec combiner ?
?? Voir la solution
1. \(100 \times 10^7 \times 10\) octets = \(10^{10}\) octets ≈ **10 Go**.
2. Chaque map n'émet plus qu'une paire par mot distinct : \(100 \times 50\,000 \times 10 \approx 5 \times 10^7\) octets ≈ **50 Mo**, soit 200 fois moins. Le combiner est souvent l'optimisation la plus rentable d'un job.
:::

::: culture Culture & histoire
- **2003** — Google publie l'article **GFS** ; **2004** — Jeffrey Dean et Sanjay Ghemawat publient **MapReduce**.
- **2006** — Doug Cutting et Mike Cafarella, qui travaillaient sur le moteur de recherche Nutch, en tirent **Hadoop**, développé chez Yahoo! — nommé d'après l'éléphant en peluche du fils de Doug Cutting.
- **2008** — Hadoop devient un projet de premier niveau de la fondation Apache ; Yahoo! fait tourner des clusters de milliers de nœuds.
- **2008–2010** — Facebook développe **Hive** (SQL sur Hadoop) et le confie à Apache, où il devient projet de premier niveau en 2010 ; **2013** — Hadoop 2 et **YARN**.
- Depuis la fin des années 2010, le stockage objet du cloud (S3, GCS, ADLS) et Spark remplacent souvent HDFS et MapReduce, mais leurs concepts restent la base.
- [Documentation Apache Hadoop](https://hadoop.apache.org/docs/stable/)
- [Article MapReduce (OSDI 2004)](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/)
:::

## Synthèse

::: note À retenir
- HDFS : blocs de **128 Mo**, **3 copies**, NameNode (métadonnées) + DataNodes (blocs) ; mauvais avec les petits fichiers.
- MapReduce : **map** local → **shuffle & sort** (par clé, via le réseau) → **reduce**.
- Combiner : réduction locale avant le shuffle, valable pour les opérations associatives et commutatives (somme oui, moyenne non sans (somme, effectif)).
- YARN gère les ressources ; Hive apporte le SQL.
- Limite majeure : écritures disque entre chaque étape → lent pour l'itératif → Spark.
:::
