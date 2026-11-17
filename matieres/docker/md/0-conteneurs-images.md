---
title: Conteneurs, images et Dockerfile
subtitle: Ce qu'est vraiment un conteneur, comment une image est construite couche par couche, et comment conteneuriser une application Python.
domains: DATA, IA
tags: Docker, conteneur, machine virtuelle, image, couche, Dockerfile, registre, namespaces, cgroups, cache de build
niveau: Débutant à intermédiaire
duree: 60 min
objectifs: Expliquer la différence entre conteneur et machine virtuelle ; manipuler images et conteneurs avec la CLI ; écrire un Dockerfile efficace pour une application Python ; exploiter le cache de construction.
---

::: goal Ce que tu sauras faire à la fin
- Dire ce qu'isole un conteneur, et ce qu'il n'isole pas.
- Lancer, inspecter, arrêter et nettoyer des conteneurs.
- Conteneuriser une petite API Python avec un Dockerfile dont le build est rapide.
:::

## 1. Le problème : « ça marche sur ma machine »

Un projet data dépend d'une version de Python, de bibliothèques précises (NumPy, PyTorch, pilotes), de variables d'environnement, parfois de dépendances système (`libgomp`, `gdal`). Reproduire tout cela sur le poste d'un collègue, un serveur de CI et la production est fragile. Un **conteneur** emballe l'application **avec tout son environnement** dans un format qu'on exécute à l'identique partout où Docker tourne.

## 2. Conteneur ou machine virtuelle ?

```text
     Machines virtuelles                    Conteneurs
┌───────┐ ┌───────┐ ┌───────┐        ┌───────┐ ┌───────┐ ┌───────┐
│ App A │ │ App B │ │ App C │        │ App A │ │ App B │ │ App C │
│ libs  │ │ libs  │ │ libs  │        │ libs  │ │ libs  │ │ libs  │
│ OS    │ │ OS    │ │ OS    │        └───────┘ └───────┘ └───────┘
│invité │ │invité │ │invité │        ┌─────────────────────────────┐
└───────┘ └───────┘ └───────┘        │   moteur de conteneurs      │
┌─────────────────────────────┐      ├─────────────────────────────┤
│        hyperviseur          │      │  noyau Linux de l'hôte      │
├─────────────────────────────┤      │  (partagé)                  │
│          matériel           │      ├─────────────────────────────┤
└─────────────────────────────┘      │          matériel           │
                                     └─────────────────────────────┘
```

| | Machine virtuelle | Conteneur |
|---|---|---|
| Ce qui est virtualisé | le **matériel** (chaque VM a son propre noyau) | le **système** (le noyau de l'hôte est partagé) |
| Démarrage | dizaines de secondes | fraction de seconde |
| Taille | gigaoctets | mégaoctets à quelques centaines de Mo |
| Isolation | forte | plus faible (même noyau) |
| Usage | OS différents, isolation forte | empaqueter et déployer des applications |

::: def Ce qu'est techniquement un conteneur
Un **processus Linux ordinaire** que le noyau isole grâce à deux mécanismes :
- les **namespaces** : le processus a sa propre vue des PID, du réseau, des points de montage, des utilisateurs, du nom d'hôte — il se croit seul ;
- les **cgroups** : limites de ressources (CPU, mémoire, entrées/sorties).
Son système de fichiers vient d'une **image**. Il n'y a pas de « mini-OS » qui démarre.
:::

::: info Et sous Windows ou macOS ?
Les conteneurs Linux ont besoin d'un noyau Linux. Docker Desktop fait donc tourner une **petite VM Linux** (WSL 2 sous Windows) dans laquelle s'exécutent les conteneurs.
:::

::: quiz Quiz 1.1 — Isolation
Pourquoi un conteneur démarre-t-il en une fraction de seconde alors qu'une VM met des dizaines de secondes ?
- [ ] Parce que les conteneurs sont compilés à l'avance
- [x] Parce qu'un conteneur est un processus isolé qui réutilise le noyau déjà démarré de l'hôte : il n'y a pas d'OS à amorcer
- [ ] Parce que les conteneurs n'utilisent pas de mémoire
> Une VM doit démarrer un système d'exploitation complet (noyau, services). Un conteneur est simplement un processus que le noyau de l'hôte place dans des namespaces et des cgroups.
:::

## 3. Images et couches

Une **image** est un modèle **en lecture seule** : un empilement de **couches** (chacune = les fichiers ajoutés ou modifiés par une instruction de construction) plus des métadonnées (commande par défaut, variables, port). Un **conteneur** est une instance en cours d'exécution d'une image, avec une fine couche **inscriptible** au-dessus.

```text
conteneur   [ couche inscriptible (éphémère) ]
image       [ COPY . /app            ]  ← ton code
            [ RUN pip install …      ]  ← dépendances
            [ python:3.12-slim       ]  ← image de base (elle-même en couches)
```

- Les couches sont **partagées** : dix images basées sur `python:3.12-slim` ne stockent cette base qu'une fois.
- Tout ce qu'un conteneur écrit dans sa couche inscriptible **disparaît** quand on le supprime → les données à garder vont dans des **volumes** (module suivant).
- Une image est identifiée par `dépôt:tag` (`python:3.12-slim`) et, de façon immuable, par son **digest** (`sha256:…`).

## 4. Les commandes essentielles

```bash
docker run -d --name web -p 8080:80 nginx:1.27   # lancer en arrière-plan, port hôte 8080 → 80
docker ps                                          # conteneurs en cours (-a : tous)
docker logs -f web                                 # suivre les journaux
docker exec -it web sh                             # ouvrir un shell DANS le conteneur
docker stop web && docker rm web                   # arrêter puis supprimer
docker run --rm -it python:3.12-slim python        # conteneur jetable (supprimé à la sortie)

docker images                                      # images locales
docker pull postgres:16                            # télécharger depuis un registre
docker system df                                   # place utilisée
docker system prune                                # nettoyer conteneurs arrêtés, réseaux, images orphelines
```

| Option de `docker run` | Rôle |
|---|---|
| `-d` | détaché (arrière-plan) |
| `-it` | interactif avec terminal |
| `-p 8080:80` | publier le port 80 du conteneur sur le 8080 de l'hôte |
| `-e CLE=valeur` | variable d'environnement |
| `-v nom:/chemin` | monter un volume |
| `--rm` | supprimer le conteneur à l'arrêt |
| `--name` | nommer le conteneur |

::: warn Le tag latest
`latest` n'est qu'un tag comme un autre, pas « la dernière version garantie ». En production et en CI, **épingle une version** (`postgres:16.4`) pour que le même build donne le même résultat demain.
:::

## 5. Écrire un Dockerfile

Pour une petite API FastAPI (`main.py`, `requirements.txt`) :

```dockerfile
# 1. Image de base officielle, légère, version épinglée
FROM python:3.12-slim

# 2. Réglages Python utiles en conteneur
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 3. Dépendances D'ABORD : cette couche reste en cache tant que requirements.txt ne change pas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Code ENSUITE : modifié souvent, seule cette couche est reconstruite
COPY . .

# 5. Ne pas tourner en root
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t meteo-api:1.0 .
docker run --rm -p 8000:8000 meteo-api:1.0     # puis ouvrir http://localhost:8000/docs
```

| Instruction | Rôle |
|---|---|
| `FROM` | image de base |
| `WORKDIR` | répertoire courant (créé si besoin) |
| `COPY` | copier des fichiers du contexte de build (préférer à `ADD`) |
| `RUN` | exécuter une commande **pendant le build** (crée une couche) |
| `ENV` | variable d'environnement |
| `EXPOSE` | documente le port écouté (ne le publie pas) |
| `USER` | utilisateur qui exécutera les commandes suivantes |
| `CMD` | commande par défaut **au lancement** (remplaçable) |
| `ENTRYPOINT` | exécutable fixe ; `CMD` lui fournit alors des arguments par défaut |

::: tip Le cache de construction
Docker réutilise une couche si l'instruction **et** ses entrées n'ont pas changé ; dès qu'une couche change, **toutes les suivantes** sont reconstruites. D'où l'ordre : ce qui change rarement (base, dépendances) en haut, ce qui change souvent (code) en bas. Inverser `COPY . .` et `pip install` relancerait l'installation complète des dépendances à chaque modification d'une ligne de code.
:::

::: warn .dockerignore
Le « contexte de build » (le dossier `.`) est envoyé au moteur. Sans fichier `.dockerignore`, tu copies dans l'image `.git/`, `.venv/`, des données de plusieurs Go… et peut-être un `.env` avec des secrets.
```text
.git
.venv
__pycache__/
data/
*.ipynb
.env
```
:::

::: quiz Quiz 1.2 — Cache
Dans un Dockerfile, `COPY . .` est placé **avant** `RUN pip install -r requirements.txt`. Quel est l'effet ?
- [ ] Aucun, l'ordre n'a pas d'importance
- [x] À chaque modification du code, la couche COPY change et toutes les couches suivantes, dont l'installation des dépendances, sont reconstruites
- [ ] Les dépendances ne seront jamais installées
> Le cache s'invalide en cascade à partir de la première couche modifiée. En copiant d'abord seulement requirements.txt puis en installant, l'installation reste en cache tant que la liste des dépendances ne change pas.
:::

## 6. Partager une image : les registres

```bash
docker tag meteo-api:1.0 ghcr.io/moi/meteo-api:1.0
docker login ghcr.io
docker push ghcr.io/moi/meteo-api:1.0
```

Registres courants : Docker Hub, GitHub Container Registry, registres des clouds (ECR, Artifact Registry, ACR). Le format des images et du runtime est standardisé par l'**OCI** (Open Container Initiative) : une image construite avec Docker s'exécute aussi avec Podman, containerd ou Kubernetes.

::: exo Exercice 1 — Corriger un Dockerfile
```dockerfile
FROM python:latest
COPY . /app
RUN pip install -r /app/requirements.txt
CMD python /app/train.py
```
Liste les problèmes et propose une version corrigée.
?? Voir la solution
Problèmes : (1) `latest` non épinglé et image complète (environ 1 Go) au lieu de `-slim` ; (2) `COPY . /app` avant l'installation → cache invalidé à chaque modification du code ; (3) pas de `.dockerignore` → `.git`, données, secrets copiés ; (4) exécution en **root** ; (5) `CMD` en forme « shell » (le processus Python n'est pas le PID 1 et reçoit mal les signaux d'arrêt) ; (6) `pip` garde son cache dans l'image.
```dockerfile
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd --create-home appuser
USER appuser
CMD ["python", "train.py"]
```
:::

::: exo Exercice 2 — Prédire le comportement
1. Tu lances `docker run -d postgres:16`, tu crées une table, puis `docker rm -f` le conteneur et tu en relances un nouveau. La table existe-t-elle ?
2. Un conteneur écoute sur le port 8000 et tu lances `docker run -d mon-api` sans `-p`. Peux-tu ouvrir `http://localhost:8000` depuis ton navigateur ?
?? Voir la solution
1. **Non** : la table était dans la couche inscriptible du premier conteneur, supprimée avec lui. Il fallait un **volume** (`-v pgdata:/var/lib/postgresql/data`).
2. **Non** : sans `-p 8000:8000`, le port n'est accessible que depuis le réseau interne de Docker. `EXPOSE` dans le Dockerfile ne publie rien, il documente.
:::

::: culture Culture & histoire
- **1979** — `chroot` (Unix V7) change la racine du système de fichiers d'un processus : l'ancêtre de l'isolation.
- **2000–2008** — Jails (FreeBSD), zones (Solaris), puis dans Linux les **namespaces** (à partir de 2002) et les **cgroups** (développés chez Google, intégrés en 2008) ; **LXC** combine les deux en 2008.
- **2013** — Solomon Hykes présente **Docker** (société dotCloud) lors d'un *lightning talk* à PyCon : l'idée d'une image portable et d'un Dockerfile rend les conteneurs accessibles à tous.
- **2014** — Google ouvre **Kubernetes** pour orchestrer des conteneurs à grande échelle ; **2015** — création de l'**Open Container Initiative** (OCI) pour standardiser images et runtimes.
- [Documentation Docker](https://docs.docker.com/)
- [Bonnes pratiques Dockerfile](https://docs.docker.com/build/building/best-practices/)
- [Play with Docker (bac à sable en ligne)](https://labs.play-with-docker.com/)
:::

## Synthèse

::: note À retenir
- Conteneur = **processus** isolé (namespaces + cgroups) partageant le noyau de l'hôte ; VM = matériel virtualisé avec son propre OS.
- Image = couches en lecture seule ; conteneur = image + couche inscriptible **éphémère**.
- `docker run -d -p hôte:conteneur --name … image:tag`, `ps`, `logs`, `exec -it`, `stop`, `rm`.
- Dockerfile : base `-slim` épinglée, dépendances **avant** le code (cache), `.dockerignore`, `USER` non root, `CMD` en forme JSON.
- Épingler les versions ; partager via un registre ; images au format **OCI**.
:::
