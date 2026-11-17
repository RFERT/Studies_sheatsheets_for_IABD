---
title: Antisèche Big Data & calcul distribué
subtitle: Ordres de grandeur, HDFS, MapReduce, Spark, formats, NoSQL et Kafka — l'essentiel pour concevoir et déboguer.
domains: BIG DATA, DATA
tags: CAP, HDFS, MapReduce, Spark, shuffle, Parquet, lakehouse, NoSQL, Kafka, watermark
niveau: Révision express
---

Mémo des 5 modules du cours Big Data. Détail et exercices → [cours Big Data](cours.html?c=BIGD).

## Ordres de grandeur

| Opération | ≈ |
|---|---|
| RAM | 100 ns |
| SSD (aléatoire) | 100 µs |
| réseau datacenter (aller-retour) | 0,5 ms |
| disque dur (positionnement) | 10 ms |
| débit disque dur | 150 Mo/s |

- 10 To sur 1 disque ≈ 18 h ; sur 100 disques en parallèle ≈ 11 min.
- 1 000 machines → environ une panne par jour : la panne est **normale**.

## Principes du distribué

- **Partitionner** (intervalle ou hachage ; hachage cohérent pour ajouter des nœuds).
- **Répliquer** (souvent ×3).
- **Envoyer le calcul aux données** ; le **shuffle** est l'étape coûteuse.

::: def CAP
Pendant une partition réseau : **Cohérence** (CP : refuser plutôt que mentir — banque, réservation) ou **Disponibilité** (AP : répondre quitte à être périmé — panier, compteurs). P est inévitable.
:::

## HDFS & MapReduce

- Blocs **128 Mo**, **3 copies** ; NameNode = métadonnées, DataNodes = blocs ; mauvais avec les petits fichiers.
- Map (local) → **shuffle & sort** (par clé) → reduce.
- **Combiner** = reduce local avant shuffle : somme/max oui, moyenne via (somme, effectif).
- Limite : écritures disque entre jobs → lent pour l'itératif → Spark.

```bash
cat data.txt | python mapper.py | sort | python reducer.py   # MapReduce local
```

## Spark : modèle d'exécution

| Notion | Rôle |
|---|---|
| driver | planifie |
| executors | exécutent, cachent |
| partition | unité de parallélisme (1 tâche = 1 partition = 1 cœur) |
| stage | entre deux shuffles |
| job | déclenché par une **action** |

- Transformations **paresseuses** : `select`, `filter`, `withColumn`, `groupBy`, `join`.
- Actions : `count`, `show`, `collect`, `write`, `toPandas` — chacune recalcule tout (sauf cache).
- Étroites (pas de réseau) vs **larges** (shuffle : `groupBy`, `join`, `distinct`, `orderBy`).

## Spark : réflexes de performance

| Problème | Remède |
|---|---|
| résultat réutilisé | `.cache()` puis `unpersist()` |
| grande ⋈ petite table | `broadcast(petite)` (auto < 10 Mo) |
| trop de fichiers en sortie | `coalesce(n)` |
| déséquilibre (skew) | AQE, clé dominante à part, salage |
| UDF Python lente | `pyspark.sql.functions`, pandas UDF |
| plantage du driver | pas de `collect()` sur un gros résultat |

```python
df.groupBy("k").agg(F.sum("v").alias("s"))   # shuffle
df.explain()                                  # "Exchange" = shuffle
```

## Stockage

- **Warehouse** (structuré, BI) / **lake** (brut, objet) / **lakehouse** (lake + ACID).
- Zones **bronze → silver → gold** ; ELT (dbt).
- **Parquet** : colonnaire, compressé, typé, min/max par bloc → column pruning + predicate pushdown.
- Partitionner par date / colonne à faible cardinalité ; fichiers de 128 Mo à 1 Go.
- **Delta / Iceberg / Hudi** : ACID, `MERGE`, `DELETE` (RGPD), time travel.

## NoSQL

| Besoin | Famille |
|---|---|
| cache, sessions | clé-valeur (Redis) |
| documents variés, imbriqués | document (MongoDB) |
| écritures massives, séries temporelles | colonnes larges (Cassandra) |
| relations, chemins | graphe (Neo4j) |
| plein texte, logs | recherche (Elasticsearch) |

- En distribué : **modéliser à partir des requêtes** (une requête = une partition).

## Kafka

- Journal **append-only**, rétention (7 j par défaut), **rejouable**.
- Topic → partitions → offsets ; **ordre seulement dans une partition** ; clé → partition.
- Groupe : 1 partition ↔ 1 consommateur ; nb partitions = plafond de parallélisme.
- Commit avant traitement = au plus une fois ; après = **au moins une fois** (+ écriture idempotente).

## Flux & temps

- **Temps d'événement** (horodatage) ≠ temps de traitement.
- Fenêtres fixes, glissantes, de session.
- **Watermark** = retard maximal accepté : latence ↔ exhaustivité.
- Comptage approximatif : Bloom (vu ?), HyperLogLog (distincts, ≈ 1,04/√m), Count-Min (fréquences).

## Trous à réviser

- Un bloc HDFS fait ==128 Mo== et est répliqué ==3== fois.
- Une moyenne ne peut pas servir directement de combiner : on transporte ==(somme, effectif)==.
- En Spark, une ==transformation== est paresseuse ; une ==action== déclenche le calcul.
- Un `Exchange` dans `explain()` signale un ==shuffle==.
- Kafka garantit l'ordre ==au sein d'une partition== seulement.
- Pendant une partition réseau, un système bancaire choisit ==la cohérence (CP)==.

::: quiz Auto-test — Spark
Quelle opération ne déclenche aucun calcul ?
- [ ] `df.count()`
- [x] `df.groupBy("pays").agg(F.sum("ca"))`
- [ ] `df.write.parquet("out/")`
> groupBy().agg() est une transformation : elle s'ajoute au plan. count et write sont des actions, qui lancent un job.
:::

::: quiz Auto-test — Kafka
Un topic a 6 partitions et un groupe compte 9 consommateurs. Combien travaillent ?
- [ ] 9
- [x] 6
- [ ] 3
> Chaque partition est attribuée à un seul consommateur du groupe : 6 actifs, 3 en réserve.
:::

::: culture Pour aller plus loin
- [Designing Data-Intensive Applications (M. Kleppmann)](https://dataintensive.net/)
- [Documentation Apache Spark](https://spark.apache.org/docs/latest/)
- [Documentation Apache Kafka](https://kafka.apache.org/documentation/)
:::
