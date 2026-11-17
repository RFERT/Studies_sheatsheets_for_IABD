---
title: Streaming — Kafka et traitement de flux
subtitle: Traiter les données au fil de l'eau — journal distribué, partitions et offsets, fenêtres temporelles, garanties de livraison et structures probabilistes.
domains: BIG DATA, DATA
tags: streaming, Kafka, topic, partition, offset, consumer group, fenêtre, event time, watermark, exactly-once, Spark Structured Streaming, Flink, Bloom, HyperLogLog
niveau: Intermédiaire
duree: 75 min
objectifs: Expliquer le modèle de Kafka (topics, partitions, offsets, groupes de consommateurs) ; raisonner sur l'ordre et le parallélisme ; définir fenêtres, temps d'événement et watermarks ; comparer les garanties de livraison ; utiliser des structures probabilistes pour compter à grande échelle.
---

::: goal Ce que tu sauras faire à la fin
- Dimensionner les partitions d'un topic et un groupe de consommateurs.
- Choisir une fenêtre (fixe, glissante, de session) et gérer les événements en retard.
- Dire ce que garantit réellement « exactly-once ».
:::

## 1. Pourquoi un journal distribué ?

Dans une entreprise, des dizaines de systèmes produisent des événements (clics, paiements, capteurs) et des dizaines d'autres veulent les consommer (fraude, tableau de bord, data lake, recommandations). Les relier deux à deux donne un plat de spaghettis. **Apache Kafka** place au milieu un **journal** (*log*) partagé :

```text
 producteurs                     Kafka                       consommateurs
 site web  ─┐            ┌──────────────────┐           ┌─► détection de fraude
 paiements ─┼──écrit──►  │ topic "paiements" │ ──lit──►  ├─► data lake (S3)
 capteurs  ─┘            └──────────────────┘           └─► tableau de bord
```

- Le journal est **append-only** : on ajoute à la fin, on ne modifie jamais.
- Les messages sont **conservés** un temps donné (7 jours par défaut, ou une taille) **même après lecture** : plusieurs consommateurs lisent indépendamment, et un consommateur peut **relire** le passé (rejouer après un bug).
- Producteurs et consommateurs sont **découplés** : un consommateur en panne rattrape son retard à son redémarrage.

## 2. Topics, partitions et offsets

| Notion | Définition |
|---|---|
| **Topic** | flux nommé de messages (« paiements ») |
| **Partition** | sous-journal ordonné ; un topic en a plusieurs, réparties sur les brokers |
| **Offset** | position d'un message dans sa partition (0, 1, 2…) |
| **Broker** | serveur Kafka ; un cluster en compte plusieurs |
| **Réplication** | chaque partition a un leader et des copies (facteur souvent 3) |
| **Clé** | détermine la partition : `hash(clé) mod nb_partitions` |

```text
topic "paiements" (3 partitions)
P0 : [0][1][2][3][4][5]  ──►
P1 : [0][1][2][3]        ──►     (chaque partition grandit à son rythme)
P2 : [0][1][2][3][4]     ──►
```

::: warn L'ordre n'est garanti que dans une partition
Kafka garantit l'ordre des messages **au sein d'une partition**, pas entre partitions. Pour que tous les événements d'un même client soient traités dans l'ordre, on utilise l'**identifiant client comme clé** : ils iront tous dans la même partition.
:::

```python
# Producteur (bibliothèque confluent-kafka)
from confluent_kafka import Producer
import json
p = Producer({"bootstrap.servers": "localhost:9092", "acks": "all", "enable.idempotence": True})
evt = {"client_id": 42, "montant": 59.90, "ts": "2025-06-01T10:15:02Z"}
p.produce("paiements", key=str(evt["client_id"]), value=json.dumps(evt))
p.flush()
```

## 3. Groupes de consommateurs

Les consommateurs qui partagent un même `group.id` forment un **groupe** : Kafka répartit les partitions entre eux, et **chaque partition est lue par un seul consommateur du groupe**. Deux groupes différents reçoivent chacun **tous** les messages.

| Partitions | Consommateurs du groupe | Résultat |
|---|---|---|
| 6 | 3 | 2 partitions chacun |
| 6 | 6 | 1 partition chacun (parallélisme maximal) |
| 6 | 8 | 6 actifs, **2 inactifs** |

Le nombre de partitions **borne le parallélisme** de consommation : on le choisit avec de la marge (on peut l'augmenter plus tard, mais cela change la répartition des clés).

Chaque groupe **enregistre (commit) l'offset** jusqu'où il a traité chaque partition. Après un redémarrage, il reprend à partir de cet offset.

```python
from confluent_kafka import Consumer
c = Consumer({"bootstrap.servers": "localhost:9092", "group.id": "fraude",
              "auto.offset.reset": "earliest", "enable.auto.commit": False})
c.subscribe(["paiements"])
while True:
    msg = c.poll(1.0)
    if msg is None or msg.error():
        continue
    traiter(json.loads(msg.value()))
    c.commit(msg)            # commit APRÈS traitement : au moins une fois
```

::: quiz Quiz 5.1 — Parallélisme
Un topic a 4 partitions. Tu lances 10 consommateurs dans le même groupe pour aller plus vite. Que se passe-t-il ?
- [ ] Chaque consommateur lit 4/10 de chaque partition
- [x] 4 consommateurs reçoivent une partition chacun, les 6 autres restent inactifs
- [ ] Chaque message est traité 10 fois
> Une partition n'est attribuée qu'à un seul consommateur d'un groupe, pour préserver l'ordre. Au-delà du nombre de partitions, les consommateurs supplémentaires attendent (ils prendront le relais en cas de panne). Pour paralléliser davantage, il faut plus de partitions.
:::

## 4. Garanties de livraison

| Garantie | Comment | Risque |
|---|---|---|
| **Au plus une fois** | commit de l'offset **avant** traitement | perte si crash pendant le traitement |
| **Au moins une fois** | commit **après** traitement | **doublons** si crash entre traitement et commit |
| **Exactement une fois** | producteur idempotent + transactions Kafka, ou sortie idempotente | plus complexe, plus coûteux |

::: tip L'idempotence, solution universelle
« Exactly-once » de bout en bout n'existe que si **le système de sortie** coopère. La stratégie la plus robuste : traiter **au moins une fois** et rendre l'écriture **idempotente** — par exemple un `MERGE`/upsert sur l'identifiant de l'événement : rejouer un message ne crée pas de doublon.
:::

## 5. Le temps dans un flux

| Temps | Définition |
|---|---|
| **Temps d'événement** (*event time*) | moment où l'événement s'est produit (horodatage dans le message) |
| **Temps de traitement** (*processing time*) | moment où le système le traite |

Un téléphone hors réseau envoie ses clics avec 10 minutes de retard : en temps de traitement, ils tombent dans la mauvaise minute. Les calculs corrects se font en **temps d'événement**.

### Les fenêtres

```text
Fixes (tumbling, 5 min)     |──── w1 ────|──── w2 ────|──── w3 ────|
Glissantes (10 min / 5 min) |───────── w1 ─────────|
                                         |───────── w2 ─────────|
Session (inactivité 30 min) |─ s1 ─|        |──── s2 ────|     (selon l'activité de chaque utilisateur)
```

### Retards et watermarks

Comme des événements arrivent en retard, quand peut-on **clore** une fenêtre et émettre son résultat ? Le **watermark** déclare : « je ne m'attends plus à des événements antérieurs à T − délai ». Les événements plus en retard que ce délai sont ignorés (ou traités à part). C'est un compromis entre **latence** (délai court) et **exhaustivité** (délai long).

```python
# Spark Structured Streaming : nombre de paiements par fenêtre de 5 minutes, en temps d'événement
from pyspark.sql import functions as F
flux = (spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", "localhost:9092")
        .option("subscribe", "paiements").load())
schema = "client_id INT, montant DOUBLE, ts TIMESTAMP"
evts = flux.select(F.from_json(F.col("value").cast("string"), schema).alias("e")).select("e.*")
agg = (evts.withWatermark("ts", "10 minutes")
           .groupBy(F.window("ts", "5 minutes"))
           .agg(F.count("*").alias("nb"), F.sum("montant").alias("total")))
query = (agg.writeStream.outputMode("update").format("console")
            .option("checkpointLocation", "/tmp/ckpt").start())
```

::: info Spark Structured Streaming ou Flink ?
Spark traite le flux en **micro-batchs** (latence typique : de la centaine de millisecondes à quelques secondes) avec la même API que le batch. **Apache Flink** traite **événement par événement** (latences de quelques millisecondes) et offre une gestion d'état et du temps très fine. **Kafka Streams** est une bibliothèque Java légère, sans cluster dédié.
:::

::: quiz Quiz 5.2 — Temps d'événement
Tu calcules le chiffre d'affaires par minute. Des paiements mobiles arrivent avec jusqu'à 3 minutes de retard. Que faire ?
- [ ] Utiliser le temps de traitement pour ne pas attendre
- [x] Agréger en temps d'événement avec un watermark d'au moins 3 minutes
- [ ] Rejeter tous les événements en retard
> En temps de traitement, les paiements en retard seraient comptés dans la mauvaise minute. Un watermark de 3 minutes (ou un peu plus) laisse le temps aux retardataires d'arriver avant de clore chaque fenêtre, au prix de 3 minutes de latence sur le résultat définitif.
:::

## 6. Compter un flux sans tout stocker

Sur un flux infini, impossible de garder tous les identifiants vus. Les **structures probabilistes** (maths, module 9) échangent un peu de précision contre une mémoire minuscule et **fusionnable** entre partitions :

| Question | Structure | Mémoire | Erreur |
|---|---|---|---|
| « Cet élément a-t-il déjà été vu ? » | **filtre de Bloom** | quelques bits par élément | faux positifs, jamais de faux négatif |
| « Combien d'éléments distincts ? » | **HyperLogLog** | quelques Ko | ≈ 1,04 / √m (≈ 2 % avec m = 2 048 registres) |
| « Combien de fois chaque élément ? » | Count-Min Sketch | tableau fixe | surestimation bornée |

::: viz bloom Dédoublonner un flux avec un filtre de Bloom
m: 32
k: 3
Un consommateur veut ignorer les messages déjà traités (relivrés en « au moins une fois »). Il teste l'identifiant dans un filtre de Bloom : « certainement absent » → on traite ; « peut-être présent » → on vérifie dans la base. Ajoute des identifiants jusqu'à voir apparaître des faux positifs, puis augmente m.
:::

```python
# Spark : nombre approximatif d'utilisateurs distincts par jour (HyperLogLog)
evts.groupBy(F.to_date("ts").alias("jour")) \
    .agg(F.approx_count_distinct("client_id", rsd=0.02).alias("clients_distincts"))
```

::: exo Exercice 1 — Concevoir un topic
Une banque traite 50 000 paiements par seconde. Un consommateur de détection de fraude traite 4 000 messages par seconde. Les paiements d'une même carte doivent être analysés dans l'ordre.
1. Quelle clé de message ?
2. Combien de partitions au minimum ? Que conseilles-tu ?
3. Quelle garantie de livraison, et comment éviter les doubles alertes ?
?? Voir la solution
1. Le **numéro de carte** (ou un identifiant de carte) : tous ses paiements vont dans la même partition, donc dans l'ordre.
2. \(50\,000 / 4\,000 = 12{,}5\) → au moins **13 consommateurs**, donc au moins 13 partitions. On prévoit une marge pour les pics et la croissance : par exemple **24 ou 32 partitions**, avec 13 à 16 consommateurs au départ.
3. **Au moins une fois** (commit après traitement, aucune perte de paiement), avec des alertes **idempotentes** : l'alerte est identifiée par l'identifiant du paiement, et son écriture est un upsert — une relivraison ne crée pas de seconde alerte.
:::

::: exo Exercice 2 — Fenêtres
Événements (temps d'événement, en minutes) : 1, 2, 4, 6, 7, 11, et un événement horodaté 3 qui arrive au moment où le flux est à 12.
1. Avec des fenêtres fixes de 5 minutes [0, 5[, [5, 10[, [10, 15[, combien d'événements par fenêtre ?
2. Avec un watermark de 5 minutes, l'événement horodaté 3 est-il pris en compte ? Et avec un watermark de 10 minutes ?
?? Voir la solution
1. [0, 5[ : 1, 2, 4 (+ éventuellement 3) ; [5, 10[ : 6, 7 → 2 ; [10, 15[ : 11 → 1.
2. Le temps d'événement maximal vu est 12. Watermark de 5 min : 12 − 5 = 7 → la fenêtre [0, 5[ est close (5 ≤ 7), l'événement 3 arrive **trop tard** et est ignoré : la fenêtre compte 3 événements. Watermark de 10 min : 12 − 10 = 2 → la fenêtre [0, 5[ est encore ouverte, l'événement 3 est compté : 4 événements, au prix d'un résultat publié plus tard.
:::

::: culture Culture & histoire
- **2011** — Jay Kreps, Neha Narkhede et Jun Rao créent **Kafka** chez LinkedIn pour faire circuler des milliards d'événements par jour ; Jay Kreps le nomme d'après l'écrivain Franz Kafka, « un système optimisé pour l'écriture ». Il devient projet Apache de premier niveau en 2012 ; ses créateurs fondent **Confluent** en 2014.
- **2013** — Jay Kreps publie *The Log: What every software engineer should know about real-time data's unifying abstraction*, texte fondateur de l'architecture orientée événements.
- **2011** — Nathan Marz (créateur de Storm) décrit l'**architecture Lambda** ; en **2014**, Jay Kreps lui oppose l'**architecture Kappa**.
- **2015** — Tyler Akidau et al. (Google) publient le **Dataflow Model**, qui formalise fenêtres, temps d'événement et watermarks ; **Apache Flink** devient projet de premier niveau en 2014.
- **2007** — Philippe Flajolet, Éric Fusy, Olivier Gandouet et Frédéric Meunier publient **HyperLogLog** (travaux de l'INRIA).
- [Documentation Apache Kafka](https://kafka.apache.org/documentation/)
- [The Log (J. Kreps)](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying)
- [Structured Streaming Programming Guide](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html)
:::

## Synthèse

::: note À retenir
- Kafka = journal **append-only**, **conservé** après lecture, rejouable ; découple producteurs et consommateurs.
- Topic → partitions → offsets ; **ordre garanti par partition** ; la **clé** choisit la partition.
- Groupe de consommateurs : 1 partition = 1 consommateur ; nb de partitions = plafond de parallélisme.
- Au plus / au moins / exactement une fois ; en pratique : au moins une fois + **écriture idempotente**.
- Temps d'événement ≠ temps de traitement ; fenêtres fixes, glissantes, de session ; **watermark** = latence vs exhaustivité.
- Bloom (déjà vu ?), HyperLogLog (combien de distincts ?) : mémoire minuscule, fusionnable.
:::
