---
title: Stocker à grande échelle — data lake, formats et NoSQL
subtitle: Où et sous quelle forme ranger des téraoctets pour qu'ils restent fiables, peu coûteux et rapides à interroger.
domains: BIG DATA, DATA
tags: data lake, data warehouse, lakehouse, Parquet, Avro, format colonnaire, partitionnement, Delta Lake, Iceberg, NoSQL, ETL, ELT
niveau: Intermédiaire
duree: 60 min
objectifs: Comparer entrepôt, lac et lakehouse ; choisir un format de fichier (CSV, JSON, Avro, Parquet) ; concevoir un partitionnement de dossiers ; expliquer ce qu'apportent Delta Lake et Iceberg ; choisir une famille NoSQL selon le besoin.
---

::: goal Ce que tu sauras faire à la fin
- Expliquer pourquoi Parquet peut rendre une requête 10 à 100 fois plus rapide qu'un CSV.
- Organiser un data lake en zones et en partitions.
- Choisir entre base relationnelle, document, clé-valeur, colonnes larges ou graphe.
:::

## 1. Entrepôt, lac, lakehouse

| | Data warehouse | Data lake | Lakehouse |
|---|---|---|---|
| Données | structurées, nettoyées | **brutes**, tous formats | brutes et structurées |
| Schéma | à l'écriture (*schema on write*) | à la lecture (*schema on read*) | à l'écriture, évolutif |
| Stockage | moteur propriétaire | stockage objet bon marché (S3, ADLS, GCS, HDFS) | stockage objet + format de table |
| Transactions | oui | non (fichiers) | **oui** (Delta, Iceberg, Hudi) |
| Utilisateurs | BI, reporting | data science, archivage | les deux |
| Exemples | Snowflake, BigQuery, Redshift | S3 + Parquet | Databricks, Iceberg sur S3 |

::: warn Le « data swamp »
Un lac sans catalogue, sans propriétaires ni règles de qualité devient un **marécage** : personne ne sait ce que contiennent les dossiers, ni s'ils sont à jour. Un data lake exige de la **gouvernance** (catalogue, schémas, droits d'accès, RGPD).
:::

### Zones d'un lac (architecture « médaillon »)

```text
bronze/  données brutes, telles qu'ingérées (jamais modifiées, rejouables)
silver/  nettoyées, typées, dédoublonnées, jointes
gold/    agrégées, prêtes pour la BI ou le ML (tables métier)
```

## 2. ETL ou ELT ?

- **ETL** (*Extract, Transform, Load*) : on transforme **avant** de charger dans l'entrepôt — historique, quand le stockage et le calcul de l'entrepôt étaient chers.
- **ELT** : on charge les données brutes **puis** on transforme dans l'entrepôt ou le lakehouse, en SQL (outil phare : **dbt**). Avantage : les données brutes restent disponibles, on peut rejouer une transformation corrigée.

## 3. Les formats de fichiers

| Format | Organisation | Schéma | Compression | Usage |
|---|---|---|---|---|
| CSV | lignes, texte | aucun (tout est chaîne) | faible | échange simple, petits volumes |
| JSON / JSONL | lignes, texte | implicite, imbriqué | faible | API, logs, données semi-structurées |
| **Avro** | lignes, binaire | intégré, évolutif | bonne | **écriture** fréquente, messages Kafka |
| **Parquet** | **colonnes**, binaire | intégré | excellente | **analyse** (lecture de quelques colonnes) |
| ORC | colonnes, binaire | intégré | excellente | écosystème Hive |

### Pourquoi le colonnaire accélère l'analyse

Une requête analytique typique lit **peu de colonnes** sur **beaucoup de lignes** : `SELECT pays, SUM(montant) FROM ventes GROUP BY pays`.

```text
Stockage en lignes (CSV, Avro)          Stockage en colonnes (Parquet)
[id, date, pays, montant, ... 50 col]   id:      [1, 2, 3, ...]
[id, date, pays, montant, ... 50 col]   pays:    [FR, FR, DE, ...]   ← lu
...  → on lit les 50 colonnes            montant: [12, 40, 7, ...]    ← lu
                                         ... 48 autres colonnes : ignorées
```

1. **Lecture sélective** (*column pruning*) : 2 colonnes sur 50 → environ 25 fois moins d'octets lus.
2. **Compression** bien meilleure : une colonne contient des valeurs du même type, souvent répétitives (encodage par dictionnaire, *run-length*).
3. **Statistiques** par groupe de lignes (min, max) : un filtre `date >= '2025-06-01'` saute les blocs dont le max est antérieur (*predicate pushdown*).
4. Le **schéma typé** évite de deviner les types (un CSV ne sait pas si « 01234 » est un nombre ou un code postal).

::: quiz Quiz 4.1 — Format
Une table de 200 colonnes est interrogée chaque jour par des requêtes qui n'en lisent que 3. Quel format de stockage privilégier ?
- [ ] CSV compressé en gzip
- [x] Parquet (colonnaire), éventuellement partitionné par date
- [ ] JSON, pour garder la flexibilité
> Parquet ne lit que les 3 colonnes utiles et saute les groupes de lignes grâce à ses statistiques. Un CSV, même compressé, oblige à décompresser et analyser chaque ligne entière ; le JSON répète en plus les noms de champs à chaque ligne.
:::

## 4. Partitionner les dossiers

On range les fichiers dans une arborescence par valeur d'une ou plusieurs colonnes souvent filtrées :

```text
ventes/
  annee=2025/mois=05/part-0000.parquet
  annee=2025/mois=06/part-0000.parquet
  annee=2025/mois=06/part-0001.parquet
```

```python
df.write.partitionBy("annee", "mois").mode("overwrite").parquet("s3://lac/silver/ventes/")
spark.read.parquet("s3://lac/silver/ventes/").filter("annee = 2025 AND mois = 6")
# ← seuls les dossiers annee=2025/mois=06 sont lus (partition pruning)
```

::: warn Ni trop, ni trop peu
- Partitionner par une colonne à **forte cardinalité** (`user_id`, horodatage à la seconde) crée des millions de dossiers et de **petits fichiers** : catastrophique pour HDFS comme pour S3 (coût des listages, des ouvertures).
- Viser des fichiers de **128 Mo à 1 Go** ; partitionner par date (jour ou mois) et éventuellement une dimension peu variée (pays, catégorie).
:::

## 5. Formats de table : Delta Lake, Apache Iceberg, Hudi

Un dossier de fichiers Parquet n'est pas une table fiable : deux écritures simultanées peuvent se corrompre, une écriture interrompue laisse des fichiers partiels, impossible de faire un `UPDATE` ou `DELETE` (RGPD : droit à l'effacement). Les **formats de table** ajoutent un **journal de transactions** au-dessus des fichiers Parquet :

| Apport | Exemple |
|---|---|
| Transactions **ACID** | une écriture est visible entièrement ou pas du tout |
| `UPDATE`, `DELETE`, `MERGE` (upsert) | supprimer les données d'un client |
| **Time travel** | relire la table telle qu'elle était hier, annuler une erreur |
| Évolution de schéma | ajouter une colonne sans réécrire la table |
| Compaction | fusionner les petits fichiers |

```sql
-- Delta Lake / Spark SQL
MERGE INTO clients AS c
USING maj AS m ON c.client_id = m.client_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

SELECT * FROM clients VERSION AS OF 12;     -- time travel
```

## 6. Les familles NoSQL

« NoSQL » (*Not only SQL*) regroupe des bases qui abandonnent une partie du modèle relationnel pour gagner en **scalabilité horizontale**, en flexibilité de schéma ou en latence.

| Famille | Modèle | Exemples | Idéal pour | Moins adapté à |
|---|---|---|---|---|
| **Clé-valeur** | clé → valeur opaque | Redis, DynamoDB | cache, sessions, compteurs | requêtes sur le contenu |
| **Document** | clé → document JSON imbriqué | MongoDB, Couchbase | catalogues, profils, contenus variés | jointures nombreuses |
| **Colonnes larges** | ligne → familles de colonnes, partitionnée | Cassandra, HBase | écritures massives, séries temporelles | requêtes ad hoc non prévues |
| **Graphe** | nœuds + relations | Neo4j | réseaux sociaux, recommandations, fraude | agrégations massives |
| Recherche | index inversé | Elasticsearch, OpenSearch | recherche plein texte, logs | transactions |

::: tip Modéliser pour les requêtes
En relationnel, on normalise puis on écrit n'importe quelle requête. En NoSQL distribué (Cassandra, DynamoDB), on **conçoit le schéma à partir des requêtes** : la clé de partition doit permettre de répondre à chaque requête fréquente en lisant **une seule partition**, quitte à dupliquer les données dans plusieurs tables.
:::

```python
# MongoDB (pymongo) : un document imbriqué, requête sur un champ interne
from pymongo import MongoClient
db = MongoClient("mongodb://localhost:27017")["boutique"]
db.commandes.insert_one({"client": {"id": 42, "ville": "Lyon"},
                         "lignes": [{"produit": "clavier", "qte": 1, "prix": 49.9}]})
db.commandes.find({"client.ville": "Lyon", "lignes.prix": {"$gt": 20}})
```

::: quiz Quiz 4.2 — NoSQL
Tu dois stocker les dernières positions GPS de 2 millions de véhicules (une écriture par véhicule toutes les 5 secondes) et lire l'historique d'un véhicule donné. Quel choix est le plus adapté ?
- [ ] Une base graphe
- [x] Une base à colonnes larges partitionnée par identifiant de véhicule (et période), comme Cassandra
- [ ] Un fichier CSV sur un serveur
> Environ 400 000 écritures par seconde, et des lectures toujours par véhicule : une clé de partition (véhicule, jour) répartit les écritures sur le cluster et regroupe l'historique d'un véhicule dans une même partition triée par temps. Un graphe n'apporte rien ici ; un CSV ne supporte ni ce débit ni les lectures ciblées.
:::

::: exo Exercice 1 — Estimer un gain
Une table CSV de 500 Go a 40 colonnes de tailles comparables. Convertie en Parquet, la compression divise la taille par 5. Une requête lit 4 colonnes et ne porte que sur 1 mois sur 24 (table partitionnée par mois).
1. Combien d'octets lit la requête sur le CSV ? Sur le Parquet ?
2. Quel facteur de gain approximatif ?
?? Voir la solution
1. CSV : il faut tout lire, **500 Go** (pas de partitionnement ni de lecture par colonne). Parquet : 500 / 5 = 100 Go au total ; 1 mois sur 24 → ≈ 4,2 Go ; 4 colonnes sur 40 → ≈ **0,42 Go**.
2. 500 / 0,42 ≈ **1 200 fois** moins de données lues. Les statistiques min/max peuvent encore réduire ce volume. C'est l'ordre de grandeur qui explique la domination de Parquet en analyse.
:::

::: exo Exercice 2 — Concevoir un lac
Une enseigne reçoit chaque nuit les ventes des magasins (fichiers CSV) et en continu les clics du site (JSON via Kafka). Les analystes veulent un tableau de bord des ventes par jour, magasin et catégorie ; les data scientists veulent l'historique brut.
Propose l'organisation bronze / silver / gold, les formats et le partitionnement.
?? Voir la solution
**Bronze** : CSV et JSON bruts copiés tels quels (`bronze/ventes/date_ingestion=…`, `bronze/clics/…`), conservés pour rejouer. **Silver** : tables Delta ou Iceberg en Parquet, types corrigés, dédoublonnées, clients et produits joints ; `ventes` partitionnée par **jour** (pas par magasin × jour si cela crée des fichiers minuscules), `clics` par jour (et éventuellement par heure si le volume est énorme). **Gold** : table agrégée `ventes_jour_magasin_categorie`, petite, servie au tableau de bord. Les data scientists lisent silver (détail propre) ou bronze (brut). Catalogue et droits d'accès pour les données personnelles (clics).
:::

::: culture Culture & histoire
- **1970** — Edgar F. Codd publie le **modèle relationnel** ; **années 1990** — Bill Inmon et Ralph Kimball théorisent le **data warehouse**.
- **2006** — Google publie l'article **Bigtable**, à l'origine de HBase et des bases à colonnes larges ; **2007** — Amazon publie **Dynamo**.
- **2009** — MongoDB ; **2008** — Cassandra, créée chez Facebook. Le terme **NoSQL** se popularise en 2009.
- **2010** — James Dixon (Pentaho) invente l'expression **data lake** ; Google publie **Dremel**, qui inspire le format colonnaire imbriqué de **Parquet** (Twitter et Cloudera, 2013).
- **2017–2019** — Netflix crée **Iceberg**, Uber **Hudi**, Databricks ouvre **Delta Lake** : naissance du **lakehouse**.
- [Documentation Apache Parquet](https://parquet.apache.org/docs/)
- [Delta Lake](https://delta.io/) · [Apache Iceberg](https://iceberg.apache.org/)
- [NoSQL Distilled (Sadalage & Fowler)](https://martinfowler.com/books/nosql.html)
:::

## Synthèse

::: note À retenir
- Warehouse (structuré, SQL, BI) ; lake (brut, objet, bon marché) ; **lakehouse** (lake + transactions).
- Zones bronze → silver → gold ; ELT avec dbt.
- **Parquet** : colonnaire, compressé, typé, statistiques → lecture sélective et pushdown.
- Partitionner par colonnes filtrées à **faible cardinalité** ; fichiers de 128 Mo à 1 Go.
- Delta / Iceberg / Hudi : ACID, MERGE, time travel, évolution de schéma.
- NoSQL : clé-valeur, document, colonnes larges, graphe ; **modéliser à partir des requêtes**.
:::
