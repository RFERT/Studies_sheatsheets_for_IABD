---
title: Fondations du Big Data et du calcul distribué
subtitle: Pourquoi une seule machine ne suffit plus, et les principes qui gouvernent tous les systèmes distribués.
domains: BIG DATA, DATA
tags: 3V, scale up, scale out, latence, partitionnement, réplication, localité des données, théorème CAP, batch, streaming
niveau: Intermédiaire
duree: 60 min
objectifs: Définir le Big Data sans jargon ; raisonner en ordres de grandeur (latences, débits) ; expliquer partitionnement, réplication et localité ; énoncer et appliquer le théorème CAP ; choisir entre traitement batch et streaming.
---

::: goal Ce que tu sauras faire à la fin
- Dire, chiffres à l'appui, quand un traitement **ne tient plus** sur une machine.
- Expliquer les trois mécanismes de base : **partitionner**, **répliquer**, **rapprocher le calcul des données**.
- Appliquer le théorème CAP à un cas concret.
:::

## 1. Qu'est-ce que le Big Data ?

Le terme ne désigne pas une taille précise : il y a « Big Data » quand **le volume, la vitesse ou la variété des données dépassent ce qu'un outil classique sur une seule machine peut traiter dans un temps acceptable**. On résume souvent par les **3 V** (Doug Laney, 2001), complétés ensuite :

| V | Question | Exemple |
|---|---|---|
| **Volume** | combien ? | des téraoctets de logs par jour |
| **Vélocité** | à quelle vitesse arrivent-elles ? | des millions d'événements par seconde (clics, capteurs) |
| **Variété** | sous quelle forme ? | tables, JSON, texte, images, vidéos |
| Véracité | sont-elles fiables ? | capteurs défaillants, doublons |
| Valeur | servent-elles à quelque chose ? | une donnée stockée mais jamais analysée coûte sans rapporter |

::: warn Pas de Big Data par réflexe
Un fichier de 5 Go se traite très bien avec Pandas (ou mieux, Polars / DuckDB) sur un portable. Un cluster ajoute de la complexité, de la latence et des coûts. Règle pratique : **commence sur une machine**, passe au distribué quand la mesure prouve que c'est nécessaire.
:::

## 2. Penser en ordres de grandeur

Les chiffres exacts varient selon le matériel, mais les **rapports** entre eux structurent toute l'architecture distribuée :

| Opération | Ordre de grandeur |
|---|---|
| accès à la mémoire cache du processeur | ~1 ns |
| accès à la RAM | ~100 ns |
| lecture aléatoire sur SSD | ~100 µs |
| aller-retour réseau dans un datacenter | ~0,5 ms |
| positionnement de la tête d'un disque dur | ~10 ms |
| aller-retour réseau Europe ↔ États-Unis | ~100 ms |

| Débit (ordre de grandeur) | |
|---|---|
| lecture séquentielle en RAM | ~10 Go/s |
| lecture séquentielle SSD NVMe | ~3 Go/s |
| lecture séquentielle disque dur | ~150 Mo/s |
| réseau 10 Gbit/s | ~1,2 Go/s |

::: example Lire 10 To
Sur un seul disque dur à 150 Mo/s : \(10^{13} / (1{,}5 \times 10^{8}) \approx 67\,000\) s, soit **18 heures** juste pour lire. Réparti sur 100 machines lisant chacune 1/100 des données en parallèle : **11 minutes**. C'est l'argument fondamental du calcul distribué : on ne rend pas un disque plus rapide, on en utilise beaucoup **en même temps**.
:::

## 3. Scale up ou scale out ?

| | Scale up (vertical) | Scale out (horizontal) |
|---|---|---|
| Principe | une machine plus grosse | plus de machines ordinaires |
| Limite | le plus gros serveur du marché | quasi illimitée |
| Coût | croît plus vite que la puissance | à peu près linéaire |
| Pannes | un point de défaillance unique | une panne = une machine parmi d'autres |
| Complexité logicielle | faible | élevée (réseau, coordination, pannes partielles) |

Avec 1 000 machines, si chacune tombe en panne en moyenne une fois tous les 3 ans, il y a **presque une panne par jour** dans le cluster. Un système distribué doit donc considérer la panne comme **normale** et la gérer automatiquement.

## 4. Les trois mécanismes fondamentaux

### Partitionner (sharding)

On découpe les données en morceaux répartis sur les machines. Deux stratégies classiques :

| Stratégie | Principe | Avantage | Risque |
|---|---|---|---|
| Par **intervalle** | clés de A à F → machine 1… | requêtes par plage efficaces | **points chauds** (tout le monde écrit « aujourd'hui ») |
| Par **hachage** | machine = hash(clé) mod N | répartition uniforme | requêtes par plage coûteuses ; changer N déplace presque tout |

::: tip Hachage cohérent
Avec `hash(clé) mod N`, passer de 10 à 11 machines déplace environ 90 % des clés. Le **hachage cohérent** (anneau) n'en déplace qu'environ 1/N : c'est ce qu'utilisent Cassandra, DynamoDB et de nombreux caches distribués.
:::

::: viz hachage Modulo ou hachage cohérent ?
methode: modulo
noeuds: 4
cles: 150
Ajoute un nœud avec `hash(clé) mod N` : presque toutes les clés changent de machine. Passe en **hachage cohérent** et recommence : seules les clés de l'arc pris par le nouveau nœud bougent. Avec un seul point par nœud, la charge est très inégale ; les **nœuds virtuels** corrigent ce défaut.
:::

### Répliquer

Chaque partition est copiée sur plusieurs machines (souvent 3) : si une machine tombe, les données restent disponibles et lisibles ailleurs. Mais il faut alors **synchroniser les copies** lors des écritures — d'où le théorème CAP.

### Rapprocher le calcul des données

Déplacer 10 To sur le réseau coûte cher ; déplacer un programme de quelques kilooctets ne coûte rien. Les systèmes Big Data (Hadoop, Spark) envoient donc le **code vers les machines qui détiennent les données** : c'est la **localité des données**. Le moment où l'on ne peut plus l'éviter — regrouper des données de toutes les machines, par exemple pour un `GROUP BY` — s'appelle le **shuffle**, et c'est souvent l'étape la plus coûteuse d'un traitement.

::: quiz Quiz 1.1 — Localité
Pourquoi Hadoop et Spark envoient-ils le programme vers les nœuds qui stockent les données, plutôt que l'inverse ?
- [ ] Parce que le code doit être compilé sur chaque nœud
- [x] Parce que transférer quelques kilooctets de code coûte beaucoup moins que transférer des téraoctets de données sur le réseau
- [ ] Parce que les données sont chiffrées
> Le réseau est la ressource la plus lente et la plus partagée d'un cluster. Calculer là où les données se trouvent évite de les déplacer ; seules les étapes de regroupement (shuffle) font transiter des données intermédiaires, souvent beaucoup plus petites.
:::

## 5. Le théorème CAP

::: theorem Théorème CAP (Brewer 2000, démontré par Gilbert et Lynch en 2002)
Un système de données distribué et répliqué ne peut garantir simultanément que **deux** des trois propriétés suivantes **en cas de partition réseau** :
- **C**ohérence (*consistency*) : toute lecture renvoie la dernière écriture ;
- **D**isponibilité (*availability*) : toute requête reçoit une réponse (non erreur) ;
- **T**olérance au **P**artitionnement : le système continue de fonctionner si le réseau coupe le cluster en deux.
:::

Les partitions réseau **arrivent** dans un vrai cluster : P n'est pas négociable. Le vrai choix, quand le réseau est coupé, est donc :

| Choix | Comportement pendant la coupure | Exemples de cas d'usage |
|---|---|---|
| **CP** | refuser certaines requêtes plutôt que renvoyer une donnée périmée | solde bancaire, stock, réservation de siège |
| **AP** | toujours répondre, quitte à renvoyer une valeur ancienne, puis réconcilier | panier d'achat, compteur de « j'aime », fil d'actualité |

::: info Cohérence à terme
Un système AP offre souvent une **cohérence à terme** (*eventual consistency*) : si les écritures s'arrêtent, toutes les copies finissent par converger. Beaucoup de bases (Cassandra, DynamoDB) permettent de **régler** ce compromis requête par requête (niveaux de cohérence).
:::

::: quiz Quiz 1.2 — CAP
Une application de réservation de places de concert ne doit jamais vendre deux fois le même siège. Pendant une coupure réseau entre deux datacenters, que doit-elle privilégier ?
- [ ] La disponibilité : accepter toutes les réservations et corriger plus tard
- [x] La cohérence : refuser ou retarder les réservations qui ne peuvent pas être confirmées de façon certaine
- [ ] Ni l'une ni l'autre : CAP ne s'applique qu'aux bases NoSQL
> Une double vente est irréversible et coûteuse : on choisit CP. Pour un compteur de vues, on choisirait AP. CAP concerne tout système de données répliqué, relationnel ou non.
:::

## 6. Batch ou streaming ?

| | Batch | Streaming |
|---|---|---|
| Données | un ensemble **borné** (les ventes d'hier) | un flux **non borné** (chaque vente dès qu'elle arrive) |
| Latence | minutes à heures | millisecondes à secondes |
| Simplicité | plus simple, facile à rejouer | gestion du temps, du désordre, de l'état |
| Outils | Spark, Hive, MapReduce, dbt | Kafka, Flink, Spark Structured Streaming |
| Exemples | rapport quotidien, entraînement d'un modèle | détection de fraude, alertes, tableaux de bord temps réel |

Les architectures réelles combinent souvent les deux (architecture **Lambda** : une couche batch exacte + une couche temps réel approximative ; architecture **Kappa** : tout en streaming, le batch n'étant qu'un rejeu du flux).

## 7. Le paysage des outils

```text
 Ingestion            Stockage                 Traitement             Usage
 ─────────            ────────                 ──────────             ─────
 Kafka, Flume   →   HDFS, S3 (data lake)   →   Spark, Flink, Hive  →  BI, ML, API
 API, CDC           Parquet, Delta, Iceberg     SQL distribué          tableaux de bord
                    NoSQL (Cassandra…)          Airflow (orchestration)
```

Les modules suivants détaillent chaque étage : Hadoop et MapReduce (module 2), Spark (module 3), stockage et formats (module 4), streaming et Kafka (module 5).

::: exo Exercice 1 — Dimensionner
Une entreprise stocke 40 To de logs, répliqués 3 fois, sur des serveurs offrant chacun 12 disques de 4 To. On veut garder 25 % d'espace libre.
1. Quel volume brut faut-il ?
2. Combien de serveurs au minimum ?
3. Chaque disque lit à 150 Mo/s. Combien de temps faut-il pour lire **une copie** complète des logs si tous les disques lisent en parallèle ?
?? Voir la solution
1. \(40 \times 3 = 120\) To de données ; avec 25 % libres, la capacité utile ne doit être remplie qu'à 75 % : \(120 / 0{,}75 = 160\) To bruts.
2. Un serveur offre \(12 \times 4 = 48\) To : \(\lceil 160 / 48 \rceil = 4\) serveurs (192 To).
3. 48 disques lisent ensemble à \(48 \times 150 = 7\,200\) Mo/s ≈ 7,2 Go/s. Une copie fait 40 To : \(40\,000 / 7{,}2 \approx 5\,560\) s, soit **environ 1 h 30**. Sur un seul disque, il faudrait plus de 3 jours.
:::

::: exo Exercice 2 — Choisir CP ou AP
Pour chaque système, choisis CP ou AP et justifie : (a) le compteur de vues d'une vidéo ; (b) le solde d'un compte bancaire ; (c) le panier d'un site marchand ; (d) l'inventaire d'un entrepôt pour des produits rares.
?? Voir la solution
(a) **AP** : afficher 1 203 vues au lieu de 1 205 n'a aucune conséquence. (b) **CP** : une incohérence permettrait de dépenser deux fois le même argent. (c) **AP** : Amazon a popularisé ce choix (Dynamo, 2007) — il vaut mieux accepter un ajout au panier et fusionner ensuite que refuser une vente. (d) **CP** pour la validation de commande (éviter de vendre un article inexistant), éventuellement AP pour l'affichage indicatif du stock.
:::

::: culture Culture & histoire
- **2001** — Doug Laney (META Group) décrit les **3 V** du volume, de la vélocité et de la variété des données.
- **2003–2004** — Google publie les articles **GFS** (système de fichiers distribué) et **MapReduce** (Jeffrey Dean et Sanjay Ghemawat), qui inspirent tout l'écosystème Hadoop.
- **2000** — Eric Brewer énonce la conjecture **CAP** ; Seth Gilbert et Nancy Lynch la démontrent en **2002**.
- **2007** — Amazon publie l'article **Dynamo** (disponibilité avant tout, cohérence à terme), qui inspire Cassandra et DynamoDB.
- Les « *Latency numbers every programmer should know* », popularisés par Jeff Dean et Peter Norvig, restent la référence pour raisonner en ordres de grandeur.
- [Designing Data-Intensive Applications (M. Kleppmann)](https://dataintensive.net/)
- [Latency numbers (visualisation interactive)](https://colin-scott.github.io/personal_website/research/interactive_latency.html)
- [MapReduce: Simplified Data Processing on Large Clusters (Google)](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/)
:::

## Synthèse

::: note À retenir
- Big Data = volume, vélocité ou variété **au-delà d'une machine** ; ne pas distribuer par principe.
- Raisonner en ordres de grandeur : RAM ≪ SSD ≪ réseau ≪ disque dur.
- Scale out : beaucoup de machines ordinaires, la **panne est normale**.
- Trois mécanismes : **partitionner**, **répliquer**, **envoyer le calcul aux données** ; le **shuffle** est l'étape coûteuse.
- CAP : pendant une partition réseau, choisir entre cohérence (CP) et disponibilité (AP).
- Batch (données bornées, simple) vs streaming (flux, faible latence).
:::
