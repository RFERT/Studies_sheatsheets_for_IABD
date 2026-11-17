---
title: Volumes, réseaux et Docker Compose
subtitle: Faire tourner une stack complète (API, base de données, cache) de façon reproductible, persistante et sûre.
domains: DATA, IA
tags: volume, bind mount, réseau Docker, variables d'environnement, Docker Compose, healthcheck, multi-stage, sécurité, image légère
niveau: Intermédiaire
duree: 60 min
objectifs: Persister des données avec des volumes ; faire communiquer des conteneurs par un réseau ; configurer une application par variables d'environnement ; décrire une stack avec Docker Compose ; produire des images légères et sûres (multi-stage, non-root, secrets).
---

::: goal Ce que tu sauras faire à la fin
- Lancer une API + PostgreSQL + Redis avec une seule commande.
- Savoir où vivent les données, et ce qui survit à un `docker compose down`.
- Diviser par 5 la taille d'une image grâce au multi-stage build.
:::

## 1. Persister les données

La couche inscriptible d'un conteneur est **éphémère**. Pour garder des données, on monte un stockage externe :

| Type | Syntaxe | Géré par | Usage |
|---|---|---|---|
| **Volume nommé** | `-v pgdata:/var/lib/postgresql/data` | Docker | données de bases, production |
| **Bind mount** | `-v ./src:/app/src` | toi (un dossier de l'hôte) | développement : le code modifié est vu immédiatement |
| tmpfs | `--tmpfs /tmp` | mémoire | fichiers temporaires sensibles |

```bash
docker volume create pgdata
docker run -d --name db -e POSTGRES_PASSWORD=secret -v pgdata:/var/lib/postgresql/data postgres:16
docker rm -f db
docker run -d --name db -e POSTGRES_PASSWORD=secret -v pgdata:/var/lib/postgresql/data postgres:16
# les tables sont toujours là : elles vivent dans le volume, pas dans le conteneur
docker volume ls ; docker volume inspect pgdata
```

::: warn Bind mounts et permissions
Un bind mount expose un dossier de l'hôte au conteneur. Si le processus du conteneur tourne avec un autre identifiant d'utilisateur, il peut ne pas avoir le droit d'écrire (ou créer des fichiers appartenant à root sur ton poste). En production, préférer les volumes nommés.
:::

## 2. Faire communiquer des conteneurs

Chaque conteneur a sa propre interface réseau. Sur un **réseau défini par l'utilisateur**, Docker fournit un **DNS interne** : un conteneur en joint un autre par son **nom**.

```bash
docker network create app-net
docker run -d --name db    --network app-net -e POSTGRES_PASSWORD=secret postgres:16
docker run -d --name api   --network app-net -p 8000:8000 \
           -e DATABASE_URL=postgresql://postgres:secret@db:5432/postgres mon-api:1.0
#                                                   ^^ le nom du conteneur sert de nom d'hôte
```

::: warn localhost dans un conteneur
Dans un conteneur, `localhost` désigne **le conteneur lui-même**, pas ton PC ni les autres conteneurs. L'API doit joindre la base via `db:5432` (nom du service), pas `localhost:5432`. Erreur la plus fréquente des débutants avec Docker.
:::

- `-p 8000:8000` publie un port **vers l'hôte** ; deux conteneurs d'un même réseau se parlent **sans** publier de port. Ne publie donc pas le port de la base de données si seule l'API doit y accéder.

## 3. Configurer par l'environnement

Une même image doit tourner en développement, en test et en production : la **configuration** (URL de base, niveau de logs, clés) passe par des **variables d'environnement**, pas par le code — principe du *Twelve-Factor App*.

```python
import os
DATABASE_URL = os.environ["DATABASE_URL"]               # obligatoire : échoue tôt si absente
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")              # optionnelle, avec valeur par défaut
```

::: warn Secrets
Ne jamais écrire un mot de passe dans le Dockerfile (`ENV PASSWORD=…`) : il est inscrit dans une **couche** de l'image, visible avec `docker history` par quiconque récupère l'image. Les fournir à l'exécution (fichier `.env` non versionné, secrets de Compose, gestionnaire de secrets du cloud).
:::

## 4. Docker Compose : décrire toute la stack

Plutôt que des commandes `docker run` à rallonge, on décrit les services dans un fichier `compose.yaml` :

```yaml
# compose.yaml
services:
  api:
    build: .                          # construit l'image depuis le Dockerfile du dossier
    ports:
      - "8000:8000"
    env_file: .env                    # DATABASE_URL, clés… (fichier NON versionné)
    depends_on:
      db:
        condition: service_healthy    # attendre que la base soit réellement prête
      cache:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:16.4
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}   # lu depuis .env ou l'environnement
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10

  cache:
    image: redis:7.4-alpine

volumes:
  pgdata:
```

```bash
docker compose up -d --build     # construire et lancer toute la stack
docker compose ps                # état des services
docker compose logs -f api       # journaux d'un service
docker compose exec db psql -U app   # commande dans un service
docker compose down              # arrêter et supprimer conteneurs + réseau (volumes conservés)
docker compose down -v           # … et supprimer aussi les volumes ⚠️ données perdues
```

- Compose crée automatiquement un **réseau** pour le projet : `api` joint la base via l'hôte `db`.
- `depends_on` seul ne garantit que l'**ordre de démarrage**, pas que PostgreSQL accepte déjà les connexions : d'où le `healthcheck` et `condition: service_healthy`.

::: quiz Quiz 2.1 — Réseau
Dans le Compose ci-dessus, quelle URL de base de données l'API doit-elle utiliser ?
- [ ] `postgresql://app:…@localhost:5432/app`
- [x] `postgresql://app:…@db:5432/app`
- [ ] `postgresql://app:…@127.0.0.1:8000/app`
> Les services d'un même projet Compose sont sur un réseau commun avec un DNS interne : le nom du service (db) est le nom d'hôte. localhost désignerait le conteneur de l'API lui-même ; 8000 est le port de l'API, pas celui de PostgreSQL.
:::

## 5. Des images légères et sûres

### Le multi-stage build

On compile ou installe dans une première image « atelier », et on ne copie que le **résultat** dans une image finale minimale :

```dockerfile
# Étape 1 : construire les dépendances (outils de compilation disponibles)
FROM python:3.12-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Étape 2 : image finale, sans compilateur ni caches
FROM python:3.12-slim
COPY --from=builder /install /usr/local
WORKDIR /app
COPY . .
RUN useradd --create-home appuser
USER appuser
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Checklist

| Pratique | Pourquoi |
|---|---|
| Base `-slim` (ou distroless) et versions épinglées | taille, surface d'attaque, reproductibilité |
| Multi-stage | pas d'outils de build en production |
| `USER` non root | limite les dégâts d'une faille |
| Un processus par conteneur | journaux, redémarrage et mise à l'échelle indépendants |
| `HEALTHCHECK` | l'orchestrateur sait si le service répond |
| Scanner l'image (`docker scout`, Trivy) | vulnérabilités connues des dépendances |
| Journaux sur stdout/stderr | collectés par Docker et l'orchestrateur |
| Pas de secrets dans l'image | `docker history` les révèle |

::: tip GPU et deep learning
Pour PyTorch sur GPU NVIDIA : partir d'une image officielle (`pytorch/pytorch:…-cuda…`), installer le *NVIDIA Container Toolkit* sur l'hôte et lancer avec `docker run --gpus all …`. Les images CUDA pèsent plusieurs Go : le cache et le multi-stage comptent encore plus.
:::

::: quiz Quiz 2.2 — Données
Tu lances `docker compose down -v` sur la stack ci-dessus. Que se passe-t-il ?
- [ ] Les conteneurs s'arrêtent, les données PostgreSQL sont conservées
- [x] Les conteneurs et le réseau sont supprimés, ainsi que le volume pgdata : la base est perdue
- [ ] Rien n'est supprimé, seul le réseau est arrêté
> Sans -v, down supprime conteneurs et réseau mais garde les volumes nommés. L'option -v supprime aussi les volumes déclarés : toutes les données de la base disparaissent.
:::

::: exo Exercice 1 — Écrire un compose.yaml
Écris un `compose.yaml` pour un notebook Jupyter (image officielle `scipy-notebook`, port 8888) qui accède à une base PostgreSQL, avec : le dossier `./notebooks` de l'hôte monté dans `/home/jovyan/work`, les données de la base persistantes, le mot de passe lu depuis `.env`, et la base non exposée sur l'hôte.
?? Voir la solution
```yaml
services:
  notebook:
    image: quay.io/jupyter/scipy-notebook:python-3.11   # images Jupyter officielles (quay.io), tag épinglé
    ports: ["8888:8888"]
    volumes:
      - ./notebooks:/home/jovyan/work           # bind mount : les notebooks restent sur l'hôte
    environment:
      DATABASE_URL: postgresql://app:${POSTGRES_PASSWORD}@db:5432/app
    depends_on:
      db: { condition: service_healthy }
  db:
    image: postgres:16.4
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: app
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10
    # pas de "ports" : la base n'est joignable que depuis le réseau du projet
volumes:
  pgdata:
```
Le fichier `.env` (contenant `POSTGRES_PASSWORD=…`) est listé dans `.gitignore`.
:::

::: exo Exercice 2 — Déboguer
`docker compose up` affiche dans les logs de l'API : `could not connect to server: Connection refused — Is the server running on host "localhost" (127.0.0.1) and accepting TCP/IP connections on port 5432?` Donne deux causes possibles et leurs corrections.
?? Voir la solution
1. L'API utilise **localhost** comme hôte de base : dans un conteneur, c'est le conteneur de l'API lui-même. Corriger l'URL avec le **nom du service** (`db`).
2. L'API démarre **avant** que PostgreSQL soit prêt : ajouter un `healthcheck` sur `db` et `depends_on: db: condition: service_healthy`, et prévoir des **réessais** de connexion dans l'application (une base peut aussi redémarrer en production).
:::

::: culture Culture & histoire
- **2013–2014** — l'outil **Fig** (Orchard) permet de décrire plusieurs conteneurs dans un fichier YAML ; Docker le rachète et il devient **Docker Compose**.
- **2011** — Adam Wiggins (Heroku) publie le manifeste **The Twelve-Factor App** : configuration par variables d'environnement, processus sans état, journaux en flux… des principes que les conteneurs ont généralisés.
- **2017** — Docker introduit le **multi-stage build** ; **2020–2023** — la spécification Compose devient un standard ouvert et la commande `docker compose` (v2) remplace `docker-compose`.
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [The Twelve-Factor App (FR)](https://12factor.net/fr/)
- [Trivy (scanner de vulnérabilités)](https://trivy.dev/)
:::

## Synthèse

::: note À retenir
- Données : **volumes nommés** (persistants) ; bind mounts pour le développement.
- Réseau défini par l'utilisateur / Compose : **DNS par nom de service** ; `localhost` = le conteneur lui-même.
- Configuration par **variables d'environnement** ; secrets jamais dans l'image.
- Compose : `up -d --build`, `logs -f`, `exec`, `down` (volumes gardés) / `down -v` (volumes supprimés) ; `healthcheck` + `service_healthy`.
- Images de production : multi-stage, `-slim`, non-root, un processus, scan de vulnérabilités.
:::
