---
title: Pipes, processus, scripts bash et SSH
subtitle: Combiner de petites commandes pour traiter des données, surveiller ce qui tourne, automatiser avec bash et travailler sur des machines distantes.
domains: DATA, BIG DATA
tags: pipe, redirection, grep, sed, awk, sort, uniq, processus, ps, kill, systemd, apt, script bash, cron, SSH, scp, rsync
niveau: Débutant à intermédiaire
duree: 75 min
objectifs: Enchaîner des commandes avec pipes et redirections ; filtrer et transformer du texte avec grep, sed et awk ; gérer processus et services ; installer des paquets ; écrire un script bash robuste ; se connecter et transférer des fichiers par SSH avec des clés.
---

::: goal Ce que tu sauras faire à la fin
- Répondre en une ligne à « quelles sont les 10 IP qui ont fait le plus d'erreurs 500 hier ? ».
- Trouver et arrêter le processus qui sature la mémoire.
- Te connecter à un serveur avec une clé SSH et y lancer un entraînement qui survit à la déconnexion.
:::

## 1. Flux, redirections et pipes

Tout programme a trois flux : l'**entrée standard** (stdin, 0), la **sortie standard** (stdout, 1) et la **sortie d'erreur** (stderr, 2).

| Syntaxe | Effet |
|---|---|
| `cmd > f` | stdout dans un fichier (écrase) |
| `cmd >> f` | stdout ajouté à la fin du fichier |
| `cmd 2> erreurs.log` | stderr dans un fichier |
| `cmd > tout.log 2>&1` | stdout **et** stderr dans le même fichier |
| `cmd < f` | f comme entrée |
| `cmd1 \| cmd2` | **pipe** : la sortie de cmd1 devient l'entrée de cmd2 |
| `cmd > /dev/null` | jeter la sortie |

La **philosophie Unix** : de petits programmes qui font une seule chose bien, combinés par des pipes.

```bash
cat access.log | grep " 500 " | wc -l          # nombre de requêtes en erreur 500
ls -l | sort -k5 -n -r | head -5               # les 5 plus gros fichiers
history | grep docker | tail -20               # mes 20 dernières commandes docker
```

## 2. Les filtres de texte

| Commande | Rôle | Exemple |
|---|---|---|
| `grep` | garder les lignes qui correspondent | `grep -i "error" app.log`, `-v` inverse, `-c` compte, `-E` regex étendue |
| `cut` | extraire des colonnes | `cut -d',' -f1,3 data.csv` |
| `sort` | trier | `sort -t',' -k3 -n` (numérique sur la 3e colonne) |
| `uniq` | dédoublonner des lignes **adjacentes** | `sort \| uniq -c` compte les occurrences |
| `tr` | remplacer des caractères | `tr 'A-Z' 'a-z'` |
| `sed` | éditer en flux | `sed 's/,/;/g'` remplace toutes les virgules |
| `awk` | traiter des colonnes, calculer | `awk -F',' '{s += $3} END {print s}'` |
| `xargs` | transformer des lignes en arguments | `find . -name "*.tmp" \| xargs rm` |

::: example L'analyse de logs classique
Lignes de la forme `192.168.1.10 - - [12/May/2025:10:02:11] "GET /api HTTP/1.1" 500 512`.

```bash
# Top 10 des IP ayant provoqué des erreurs 500
grep '" 500 ' access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10
```

`awk '{print $1}'` extrait la première colonne (l'IP) ; `sort | uniq -c` compte chaque IP (uniq n'agit que sur des lignes **voisines**, d'où le tri préalable) ; `sort -rn` trie par compte décroissant.
:::

```bash
# awk : moyenne de la 3e colonne d'un CSV, en sautant l'en-tête
awk -F',' 'NR > 1 {s += $3; n++} END {printf "moyenne = %.2f\n", s / n}' ventes.csv

# sed : supprimer les lignes vides, puis remplacer "NA" par une chaîne vide
sed '/^$/d; s/NA//g' brut.csv > propre.csv
sed -i 's/localhost/db/' config.ini           # modifier le fichier sur place (-i)
```

::: quiz Quiz 2.1 — uniq
Pourquoi `cat ips.txt | uniq -c` peut-il compter la même IP sur plusieurs lignes ?
- [ ] Parce que uniq ignore les adresses IP
- [x] Parce que uniq ne fusionne que les lignes identiques **adjacentes** : il faut trier avant (`sort | uniq -c`)
- [ ] Parce qu'il faut l'option -d
> uniq compare chaque ligne à la précédente seulement. Si la même IP apparaît à plusieurs endroits du fichier, elle forme plusieurs groupes. Trier regroupe les lignes identiques.
:::

## 3. Processus

Chaque programme lancé est un **processus**, identifié par un **PID**.

```bash
ps aux | grep python            # tous les processus, filtrés
top                             # vue en direct (htop : version plus lisible)
pgrep -f train.py               # PID des processus dont la commande contient train.py
kill 12345                      # demander l'arrêt (SIGTERM : le programme peut nettoyer)
kill -9 12345                   # forcer (SIGKILL : en dernier recours, aucun nettoyage)
free -h                         # mémoire
nvidia-smi                      # occupation des GPU (machines NVIDIA)
```

### Tâches longues et déconnexion

```bash
python train.py &               # en arrière-plan dans le shell actuel
jobs ; fg %1                    # lister / ramener au premier plan
nohup python train.py > train.log 2>&1 &    # survit à la fermeture du terminal
tmux new -s entrainement        # session persistante : Ctrl+B puis D pour se détacher
tmux attach -t entrainement     # se rattacher plus tard, même depuis une autre connexion
```

::: tip tmux sur un serveur distant
Lance toujours un entraînement long **dans tmux** (ou screen) : si ta connexion SSH coupe, le processus continue et tu retrouves l'affichage en te reconnectant.
:::

## 4. Services et paquets

Les **services** (démons) tournent en arrière-plan : serveur web, base de données, Docker. Sur la plupart des distributions, ils sont gérés par **systemd** :

```bash
systemctl status docker          # état, PID, dernières lignes de journal
sudo systemctl start|stop|restart nginx
sudo systemctl enable nginx      # démarrer automatiquement au boot
journalctl -u nginx -f           # journaux du service, en direct
journalctl --since "1 hour ago" -p err   # erreurs de la dernière heure
```

| Distribution | Gestionnaire | Installer | Mettre à jour |
|---|---|---|---|
| Debian, Ubuntu | `apt` | `sudo apt install htop` | `sudo apt update && sudo apt upgrade` |
| Fedora, RHEL | `dnf` | `sudo dnf install htop` | `sudo dnf upgrade` |
| Alpine (conteneurs) | `apk` | `apk add htop` | `apk upgrade` |

`apt update` rafraîchit la **liste** des paquets disponibles ; `apt upgrade` installe les **nouvelles versions**.

## 5. Écrire un script bash robuste

```bash
#!/usr/bin/env bash
# sauvegarde.sh — archive un dossier de données avec la date du jour
set -euo pipefail                # s'arrêter à la 1re erreur, variable non définie = erreur, erreurs dans les pipes

SOURCE="${1:?usage : $0 <dossier> [destination]}"   # 1er argument obligatoire
DEST="${2:-$HOME/sauvegardes}"                     # 2e argument, valeur par défaut
DATE="$(date +%Y-%m-%d)"

if [[ ! -d "$SOURCE" ]]; then
  echo "Erreur : $SOURCE n'est pas un dossier" >&2
  exit 1
fi

mkdir -p "$DEST"
ARCHIVE="$DEST/$(basename "$SOURCE")-$DATE.tar.gz"
tar -czf "$ARCHIVE" -C "$(dirname "$SOURCE")" "$(basename "$SOURCE")"
echo "Archive créée : $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# garder seulement les 7 archives les plus récentes de ce dossier
ls -1t "$DEST"/"$(basename "$SOURCE")"-*.tar.gz | tail -n +8 | xargs -r rm --
```

```bash
chmod +x sauvegarde.sh
./sauvegarde.sh ~/projet/data
```

| Élément | Rôle |
|---|---|
| `#!/usr/bin/env bash` | *shebang* : quel interpréteur exécute le fichier |
| `set -euo pipefail` | échouer vite au lieu de continuer sur une erreur |
| `"$VAR"` | **toujours** entre guillemets (noms avec espaces) |
| `$1`, `$2`, `$#`, `$@` | arguments, leur nombre, tous les arguments |
| `$(commande)` | substitution : résultat d'une commande |
| `[[ -f f ]]`, `[[ -d d ]]`, `[[ -z "$x" ]]` | tests : fichier, dossier, chaîne vide |
| `$?` | code de retour de la dernière commande (0 = succès) |

```bash
for f in data/brut/*.csv; do                 # boucle sur des fichiers
  echo "Traitement de $f"
  python nettoyer.py "$f" "data/propre/$(basename "$f")"
done
```

::: warn Les guillemets
`rm $FICHIER` avec `FICHIER="mes données.csv"` tente de supprimer deux fichiers, `mes` et `données.csv`. Avec `rm "$FICHIER"`, un seul. Guillemeter les variables évite des bugs… et des suppressions accidentelles.
:::

### Planifier avec cron

```bash
crontab -e
# minute heure jour-du-mois mois jour-de-la-semaine  commande
30 2 * * * /home/alice/sauvegarde.sh /home/alice/projet/data >> /home/alice/sauvegarde.log 2>&1
```

Ici : chaque jour à 2 h 30. Cron s'exécute avec un environnement minimal : utiliser des **chemins absolus**.

## 6. SSH : travailler à distance

```bash
ssh-keygen -t ed25519 -C "alice@esgi"      # générer une paire de clés (une fois)
ssh-copy-id alice@serveur.exemple.fr       # installer la clé publique sur le serveur
ssh alice@serveur.exemple.fr               # se connecter, sans mot de passe

scp data.csv alice@serveur:/home/alice/    # copier un fichier
rsync -avz --progress data/ alice@serveur:~/data/    # synchroniser un dossier (ne transfère que les différences)
ssh -L 8888:localhost:8888 alice@serveur   # tunnel : ouvrir sur ton PC le Jupyter du serveur
```

- La **clé privée** (`~/.ssh/id_ed25519`, droits `600`) ne quitte **jamais** ton poste ; la **clé publique** (`.pub`) se copie sur les serveurs (`~/.ssh/authorized_keys`).
- Un fichier `~/.ssh/config` évite de retaper les options :

```text
Host gpu
    HostName serveur.exemple.fr
    User alice
    IdentityFile ~/.ssh/id_ed25519
```

Ensuite : `ssh gpu`, `rsync -avz data/ gpu:~/data/`.

::: quiz Quiz 2.2 — SSH
Que faut-il copier sur le serveur pour se connecter par clé ?
- [ ] La clé privée `id_ed25519`
- [x] La clé publique `id_ed25519.pub` (dans `~/.ssh/authorized_keys`)
- [ ] Les deux clés
> La clé publique peut être diffusée sans risque : elle permet seulement de vérifier que tu possèdes la clé privée. La clé privée reste exclusivement sur ta machine ; si elle fuit, il faut la révoquer partout.
:::

::: exo Exercice 1 — Une ligne de commande
Un fichier `ventes.csv` a l'en-tête `date,magasin,categorie,montant`.
1. Combien de lignes de données (sans l'en-tête) ?
2. Les 3 catégories les plus fréquentes, avec leur nombre de lignes.
3. Le chiffre d'affaires total du magasin `Lyon`.
?? Voir la solution
1. `tail -n +2 ventes.csv | wc -l` (`tail -n +2` commence à la 2e ligne).
2. `tail -n +2 ventes.csv | cut -d',' -f3 | sort | uniq -c | sort -rn | head -3`
3. `awk -F',' '$2 == "Lyon" {s += $4} END {print s}' ventes.csv` (l'en-tête est ignoré car `magasin` ≠ `Lyon`).
Pour des CSV avec des virgules à l'intérieur de champs entre guillemets, ces outils ne suffisent plus : passer à Python, DuckDB, `csvkit` ou `miller`.
:::

::: exo Exercice 2 — Lancer un entraînement distant
Tu dois entraîner un modèle pendant 10 heures sur un serveur GPU, depuis ton portable, puis récupérer le modèle. Écris la suite de commandes.
?? Voir la solution
```bash
rsync -avz --exclude .venv --exclude data/ ./projet/ gpu:~/projet/   # envoyer le code
ssh gpu
tmux new -s train                     # session persistante
cd ~/projet && source .venv/bin/activate
python train.py 2>&1 | tee train.log  # afficher ET enregistrer
# Ctrl+B puis D : se détacher ; on peut fermer le portable
# … plus tard :
ssh gpu ; tmux attach -t train        # vérifier l'avancement (ou : tail -f ~/projet/train.log)
exit
rsync -avz gpu:~/projet/models/ ./models/                              # récupérer le modèle
```
Surveiller le GPU pendant ce temps : `ssh gpu nvidia-smi`.
:::

::: culture Culture & histoire
- **1964** — Doug McIlroy imagine de connecter des programmes « comme des tuyaux d'arrosage » ; les **pipes** apparaissent dans Unix en **1973**, avec la syntaxe `|`.
- **1977** — Alfred **A**ho, Peter **W**einberger et Brian **K**ernighan créent **awk** ; **sed** (Lee McMahon) date de 1974.
- **1995** — Tatu Ylönen, chercheur finlandais, écrit **SSH** après une attaque par écoute de mots de passe sur le réseau de son université ; **OpenSSH** (1999) en devient l'implémentation de référence.
- **2010** — **systemd** (Lennart Poettering, Kay Sievers) commence à remplacer les scripts d'initialisation dans la plupart des distributions.
- [Bash Reference Manual (GNU)](https://www.gnu.org/software/bash/manual/)
- [ShellCheck : analyseur de scripts bash](https://www.shellcheck.net/)
- [The Art of Command Line (FR)](https://github.com/jlevy/the-art-of-command-line/blob/master/README-fr.md)
:::

## Synthèse

::: note À retenir
- Flux stdin/stdout/stderr ; `>`, `>>`, `2>&1`, `|` ; une commande = un rôle.
- `grep`, `cut`, `sort | uniq -c | sort -rn`, `sed 's/a/b/g'`, `awk -F',' '{…}'`.
- `ps aux`, `top`/`htop`, `kill` (puis `-9` en dernier recours), `nohup`, **tmux**.
- `systemctl` + `journalctl` pour les services ; `apt update` puis `apt upgrade`.
- Script : shebang, `set -euo pipefail`, variables **entre guillemets**, codes de retour ; cron avec chemins absolus.
- SSH par **clé ed25519** ; la privée ne quitte jamais ton poste ; `rsync`, tunnels, `~/.ssh/config`.
:::
