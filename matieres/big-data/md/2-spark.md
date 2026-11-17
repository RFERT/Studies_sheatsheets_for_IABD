---
title: Apache Spark et PySpark
subtitle: Le moteur de calcul distribué de référence — évaluation paresseuse, transformations, shuffles, DataFrames et optimisation.
domains: BIG DATA, DATA
tags: Spark, PySpark, RDD, DataFrame, évaluation paresseuse, transformation, action, shuffle, partition, cache, broadcast join, Spark SQL
niveau: Intermédiaire
duree: 90 min
objectifs: Expliquer driver, executors, partitions et tâches ; distinguer transformations et actions, dépendances étroites et larges ; écrire des traitements PySpark avec l'API DataFrame et Spark SQL ; diagnostiquer et corriger les problèmes de performance courants (shuffle, skew, petits fichiers, collect).
---

::: goal Ce que tu sauras faire à la fin
- Prévoir, en lisant un script PySpark, **quand** le calcul a réellement lieu et **où** se produisent les shuffles.
- Écrire une agrégation, une jointure et une fonction de fenêtre en PySpark.
- Choisir entre `cache`, `repartition`, `coalesce` et une jointure broadcast.
:::

## 1. Pourquoi Spark ?

Spark (UC Berkeley, 2009) reprend les idées de MapReduce mais garde les données intermédiaires **en mémoire** et exécute un **graphe d'opérations** quelconque. Sur des algorithmes itératifs (ML, graphes), il est souvent plus rapide d'un ordre de grandeur. Il offre une seule API pour le batch, le SQL, le streaming et le ML, en Python, Scala, Java, R et SQL.

## 2. Architecture d'exécution

```text
             ┌──────────── Driver ────────────┐
             │ ton script, SparkSession        │
             │ construit le plan, le découpe   │
             │ en stages et en tâches          │
             └──────┬──────────────┬──────────┘
                    │ tâches       │ tâches
          ┌─────────▼───┐     ┌────▼────────┐
          │ Executor 1  │     │ Executor 2  │   … (sur les nœuds du cluster)
          │ cœurs + RAM │     │ cœurs + RAM │
          │ partitions  │     │ partitions  │
          └─────────────┘     └─────────────┘
```

| Notion | Définition |
|---|---|
| **Driver** | processus qui exécute ton programme et planifie le travail |
| **Executor** | processus sur un nœud du cluster qui exécute des tâches et garde des données en cache |
| **Partition** | morceau d'un jeu de données ; l'unité de parallélisme |
| **Tâche** | traitement d'**une** partition par **un** cœur |
| **Stage** | ensemble de tâches exécutables sans shuffle |
| **Job** | tout ce que déclenche **une action** |

Avec 200 partitions et 50 cœurs au total, une étape s'exécute en 4 « vagues » de 50 tâches.

## 3. Transformations et actions : l'évaluation paresseuse

Les opérations sur un DataFrame sont de deux natures :

| Transformations (paresseuses) | Actions (déclenchent le calcul) |
|---|---|
| `select`, `filter`/`where`, `withColumn`, `groupBy().agg()`, `join`, `orderBy`, `distinct`, `union` | `count()`, `show()`, `collect()`, `take(n)`, `write…`, `toPandas()` |

Une transformation **ne calcule rien** : elle ajoute une étape au plan. Seule une action lance l'exécution, après que l'optimiseur a réécrit le plan complet.

```python
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.appName("ventes").getOrCreate()

ventes = spark.read.parquet("s3://bucket/ventes/")          # rien n'est lu
grosses = (ventes
           .filter(F.col("montant") > 100)                  # rien n'est calculé
           .withColumn("annee", F.year("date"))
           .select("client_id", "annee", "montant"))
par_an = grosses.groupBy("annee").agg(F.sum("montant").alias("ca"))
par_an.show()                                               # ← ACTION : tout s'exécute ici
```

::: why Pourquoi la paresse ?
Voir **tout** le plan avant d'exécuter permet d'optimiser : ne lire que les colonnes utiles (*column pruning*), appliquer les filtres au plus tôt, directement à la lecture du fichier (*predicate pushdown*), fusionner des étapes, choisir la meilleure stratégie de jointure. C'est le rôle de l'optimiseur **Catalyst**.
:::

::: warn Le piège de l'action répétée
Chaque action **recalcule tout le plan depuis la source**. Appeler `df.count()` puis `df.show()` puis `df.write…` relit et retraite trois fois les données. Si un résultat intermédiaire est réutilisé, on le met en cache (section 6).
:::

::: quiz Quiz 3.1 — Paresse
Combien de fois les données sources sont-elles lues ?
`df = spark.read.csv(p).filter(...)` puis `a = df.count()` puis `df.groupBy("x").count().show()`
- [ ] Une fois, à la lecture
- [x] Deux fois, une par action
- [ ] Zéro fois, tant qu'on n'écrit pas de fichier
> read et filter sont des transformations : rien n'est lu à ce moment-là. count() et show() sont deux actions, chacune déclenche un job qui relit la source (sauf si df est mis en cache).
:::

## 4. Dépendances étroites, larges et shuffle

| Type | Chaque partition de sortie dépend de… | Exemples | Coût |
|---|---|---|---|
| **Étroite** (*narrow*) | une seule partition d'entrée | `select`, `filter`, `withColumn`, `map` | faible, pas de réseau |
| **Large** (*wide*) | plusieurs partitions d'entrée | `groupBy`, `join` (non broadcast), `distinct`, `orderBy`, `repartition` | **shuffle** : écriture disque, réseau, tri |

Un shuffle coupe le plan en **stages**. Lire le plan avec `df.explain()` : chaque `Exchange` est un shuffle.

```text
== Physical Plan ==
HashAggregate(keys=[annee], functions=[sum(montant)])
+- Exchange hashpartitioning(annee, 200)        ← shuffle
   +- HashAggregate(keys=[annee], functions=[partial_sum(montant)])   ← « combiner »
      +- Project [...] +- Filter (montant > 100) +- FileScan parquet [...] PushedFilters: [GreaterThan(montant,100)]
```

On reconnaît le MapReduce du module précédent : agrégation **partielle** avant le shuffle (le combiner), puis agrégation finale.

::: tip spark.sql.shuffle.partitions
Le nombre de partitions après un shuffle vaut **200** par défaut. Trop peu pour 1 To (partitions énormes, débordement mémoire) ; beaucoup trop pour 100 Mo (200 tâches minuscules). L'**Adaptive Query Execution** (AQE, activée par défaut depuis Spark 3.2) ajuste ce nombre à l'exécution, mais il faut savoir que le réglage existe.
:::

## 5. L'API DataFrame et Spark SQL

```python
from pyspark.sql import Window

clients = spark.read.parquet("clients/")           # client_id, nom, ville
cmd = spark.read.parquet("commandes/")             # cmd_id, client_id, montant, date

# Agrégation
stats = (cmd.groupBy("client_id")
            .agg(F.count("*").alias("nb"), F.sum("montant").alias("total"),
                 F.avg("montant").alias("panier_moyen")))

# Jointure
enrichi = stats.join(clients, on="client_id", how="left")

# Fonction de fenêtre : top 3 clients par ville
w = Window.partitionBy("ville").orderBy(F.desc("total"))
top3 = enrichi.withColumn("rang", F.row_number().over(w)).filter("rang <= 3")

# Même chose en SQL
enrichi.createOrReplaceTempView("enrichi")
top3_sql = spark.sql("""
    SELECT * FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY ville ORDER BY total DESC) AS rang
      FROM enrichi) t
    WHERE rang <= 3
""")
top3.write.mode("overwrite").partitionBy("ville").parquet("sortie/top3/")
```

::: info DataFrame ou RDD ?
Le **RDD** (*Resilient Distributed Dataset*) est l'API d'origine : une collection distribuée d'objets quelconques, manipulée par des fonctions Python (`map`, `reduceByKey`). Le **DataFrame** ajoute un **schéma** (colonnes typées) : Catalyst peut alors optimiser, et le calcul s'exécute dans la JVM sans passer par Python. Préférer les DataFrames et les fonctions de `pyspark.sql.functions` ; éviter les UDF Python (lentes : chaque ligne traverse la frontière JVM ↔ Python), ou utiliser des **pandas UDF** vectorisées si nécessaire.
:::

::: quiz Quiz 3.2 — Shuffle
Laquelle de ces opérations ne provoque **pas** de shuffle ?
- [ ] `df.groupBy("pays").count()`
- [x] `df.filter(F.col("age") > 18).withColumn("x2", F.col("x") * 2)`
- [ ] `df.orderBy("date")`
> filter et withColumn traitent chaque ligne indépendamment, partition par partition (dépendances étroites). groupBy doit réunir toutes les lignes d'un même pays ; orderBy doit établir un ordre global : tous deux redistribuent les données.
:::

## 6. Performance : les réflexes

### Cache et persistance

```python
base = cmd.filter(F.col("date") >= "2025-01-01").cache()   # marque pour le cache
base.count()                         # 1re action : calcule ET remplit le cache
base.groupBy("client_id").count().show()   # réutilise la version en mémoire
base.unpersist()                     # libérer quand on a fini
```

Le cache n'est utile que si le résultat est **réutilisé plusieurs fois**. Mettre en cache tout et n'importe quoi sature la mémoire des executors.

### Jointure broadcast

Joindre une grande table (1 To) à une petite (50 Mo) par shuffle fait voyager la grande table. En **diffusant** la petite table à chaque executor, la jointure devient locale, sans shuffle de la grande :

```python
from pyspark.sql.functions import broadcast
res = cmd.join(broadcast(produits), on="produit_id")
```

Spark le fait automatiquement sous un seuil (`spark.sql.autoBroadcastJoinThreshold`, 10 Mo par défaut).

### Partitions : repartition ou coalesce ?

| | `repartition(n)` | `coalesce(n)` |
|---|---|---|
| Effet | redistribue équitablement en n partitions | fusionne des partitions existantes |
| Shuffle | **oui** (complet) | non (seulement pour réduire) |
| Usage | augmenter le parallélisme, rééquilibrer, partitionner par colonne | réduire le nombre de fichiers en sortie |

### Le déséquilibre (*data skew*)

Si 40 % des lignes ont la même clé (ex. `pays = "FR"` ou une clé NULL), la tâche qui la traite dure 100 fois plus que les autres : tout le job l'attend. Remèdes : AQE (découpage des partitions déséquilibrées), traiter la clé dominante à part, ajouter un **sel** aléatoire à la clé puis agréger en deux temps.

::: warn collect() et toPandas()
Ces actions rapatrient **tout** le résultat dans la mémoire du **driver**. Sur un résultat volumineux : plantage par manque de mémoire. Réserve-les à de petits résultats (agrégats, échantillons : `df.limit(1000).toPandas()`), et écris les gros résultats avec `write`.
:::

## 7. Spark et le machine learning

**MLlib** fournit des algorithmes distribués (régression, forêts, K-means, ALS) et des `Pipeline` proches de scikit-learn :

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.classification import LogisticRegression

assembler = VectorAssembler(inputCols=["age", "revenu", "nb_achats"], outputCol="features_raw")
scaler = StandardScaler(inputCol="features_raw", outputCol="features")
lr = LogisticRegression(featuresCol="features", labelCol="churn")
model = Pipeline(stages=[assembler, scaler, lr]).fit(train_df)
pred = model.transform(test_df)
```

En pratique, on utilise souvent Spark pour **préparer** les données (nettoyage, features, agrégations sur des téraoctets), puis on entraîne sur un échantillon ou un agrégat avec scikit-learn, XGBoost ou PyTorch.

::: exo Exercice 1 — Lire un script
```python
df = spark.read.parquet("events/")                      # 2 To
a = df.filter(F.col("type") == "achat")
b = a.groupBy("user_id").agg(F.sum("montant").alias("total"))
c = b.join(spark.read.parquet("users/"), "user_id")     # users : 20 Mo
print(c.count())
c.write.parquet("out/")
```
1. Combien d'actions ? Combien de fois `events/` est-il lu ?
2. Où sont les shuffles ? La jointure en provoque-t-elle un ?
3. Propose deux améliorations.
?? Voir la solution
1. Deux actions (`count`, `write`) : `events/` est lu **deux fois**.
2. `groupBy("user_id")` provoque un shuffle. `users` pèse 20 Mo, au-dessus du seuil automatique de 10 Mo : sans indication, Spark choisira probablement une jointure par shuffle (*sort-merge join*) ; avec `broadcast(users)`, elle devient locale.
3. Mettre `c` en cache avant les deux actions — ou mieux, supprimer le `count()` et lire le nombre de lignes écrites ensuite ; forcer `broadcast(users)` (ou relever le seuil) ; grâce au predicate pushdown, le filtre sur `type` est déjà appliqué à la lecture du Parquet.
:::

::: exo Exercice 2 — Du MapReduce au DataFrame
Réécris le word count du module précédent en PySpark DataFrame, à partir d'un fichier texte, et indique où se trouve le shuffle.
?? Voir la solution
```python
lignes = spark.read.text("livre.txt")                     # colonne "value"
mots = lignes.select(F.explode(F.split(F.lower("value"), r"\s+")).alias("mot"))
compte = (mots.filter(F.col("mot") != "")
              .groupBy("mot").count()
              .orderBy(F.desc("count")))
compte.show(10)
```
`explode` et `filter` sont étroites (équivalent du map). `groupBy("mot").count()` déclenche le shuffle (avec agrégation partielle préalable, l'équivalent du combiner) ; `orderBy` en provoque un second pour le tri global.
:::

::: culture Culture & histoire
- **2009** — Matei Zaharia commence Spark à l'AMPLab de UC Berkeley ; l'article sur les **RDD** (NSDI 2012) reçoit un prix du meilleur article.
- **2013** — Spark est confié à la fondation Apache (projet de premier niveau en 2014) ; ses créateurs fondent **Databricks**.
- **2014** — Spark bat le record du tri de 100 To (Daytona GraySort) en utilisant 10 fois moins de machines que le précédent record détenu par Hadoop MapReduce.
- **2016** — Spark 2.0 unifie DataFrame et Dataset ; **2020** — Spark 3.0 introduit l'Adaptive Query Execution.
- [Documentation Apache Spark](https://spark.apache.org/docs/latest/)
- [PySpark — guide de l'API](https://spark.apache.org/docs/latest/api/python/index.html)
- [Spark: The Definitive Guide (Chambers & Zaharia)](https://www.oreilly.com/library/view/spark-the-definitive/9781491912201/)
:::

## Synthèse

::: note À retenir
- Driver (planifie) + executors (exécutent) ; **partition** = unité de parallélisme ; tâche = 1 partition sur 1 cœur.
- Transformations **paresseuses**, **actions** déclenchent un job ; chaque action recalcule tout sauf cache.
- Dépendances étroites (filter, select) vs larges (groupBy, join, orderBy) → **shuffle** = `Exchange` dans `explain()`.
- DataFrame + `pyspark.sql.functions` plutôt que RDD et UDF Python.
- Réflexes : cache si réutilisation, **broadcast** des petites tables, `coalesce` pour réduire les fichiers, surveiller le **skew**, jamais `collect()` sur un gros résultat.
:::
