---
title: Fichiers, arborescence et permissions
subtitle: Se repérer et agir efficacement dans un terminal Linux — navigation, manipulation de fichiers, droits d'accès, utilisateurs et sudo.
domains: DATA, BIG DATA
tags: Linux, shell, bash, arborescence, chemins, ls, cp, mv, find, permissions, chmod, chown, sudo, utilisateurs
niveau: Débutant
duree: 60 min
objectifs: Se déplacer dans l'arborescence avec des chemins absolus et relatifs ; créer, copier, déplacer, rechercher des fichiers ; lire et modifier des permissions (notation symbolique et octale) ; comprendre utilisateurs, groupes et sudo.
---

::: goal Ce que tu sauras faire à la fin
- Naviguer sans souris sur un serveur distant.
- Lire `-rwxr-x---` et savoir qui peut faire quoi.
- Corriger un « Permission denied » sans dégainer `chmod 777`.
:::

## 1. Pourquoi le terminal ?

Les serveurs, les clusters Big Data, les conteneurs et les machines du cloud n'ont **pas d'interface graphique**. Le terminal permet aussi d'**automatiser** : une commande se rejoue, se scripte, se combine. Sous Windows, **WSL** donne un vrai Linux en quelques minutes.

Un **shell** (le plus souvent `bash`, ou `zsh`) lit tes commandes et lance les programmes. Une commande suit la forme :

```text
commande  -options  arguments
ls        -l -a     /etc        (équivalent : ls -la /etc)
```

::: tip Survivre dans le terminal
`Tab` complète noms de commandes et de fichiers (deux fois : liste les possibilités) ; `↑` rappelle l'historique ; `Ctrl+R` recherche dans l'historique ; `Ctrl+C` interrompt ; `Ctrl+L` efface l'écran ; `man ls` ou `ls --help` documente une commande.
:::

## 2. L'arborescence Linux

Tout part de la **racine** `/`. Il n'y a pas de lettres de lecteur : les disques sont **montés** dans des dossiers.

| Dossier | Contenu |
|---|---|
| `/home/alice` | dossier personnel d'alice (raccourci `~`) |
| `/root` | dossier personnel de l'administrateur |
| `/etc` | fichiers de **configuration** |
| `/var` | données variables : **journaux** (`/var/log`), bases, files |
| `/tmp` | fichiers temporaires (vidé au redémarrage) |
| `/usr/bin`, `/bin` | programmes |
| `/opt` | logiciels installés hors gestionnaire de paquets |
| `/mnt`, `/media` | points de montage (disques, clés) |
| `/proc`, `/sys` | fichiers virtuels exposant l'état du noyau et des processus |

### Chemins absolus et relatifs

- **Absolu** : commence par `/` — `/home/alice/projet/data.csv`, valable de partout.
- **Relatif** : par rapport au dossier courant — `projet/data.csv`, `../autre`, `./script.sh`.
- `.` = dossier courant ; `..` = dossier parent ; `~` = dossier personnel ; `-` (avec `cd`) = dossier précédent.

```bash
pwd                    # où suis-je ?
cd /var/log            # chemin absolu
cd ..                  # remonter
cd ~/projet            # dossier projet dans mon répertoire personnel
cd -                   # revenir au dossier précédent
ls -lah                # liste détaillée (-l), fichiers cachés (-a), tailles lisibles (-h)
tree -L 2              # arborescence sur 2 niveaux (si installé)
```

::: info Fichiers cachés
Un fichier dont le nom commence par un point (`.bashrc`, `.gitignore`, `.ssh/`) est **caché** : `ls` ne l'affiche qu'avec `-a`. C'est une convention, pas une protection.
:::

## 3. Manipuler fichiers et dossiers

```bash
mkdir -p data/brut/2025          # créer, y compris les dossiers parents
touch notes.txt                  # créer un fichier vide (ou mettre à jour sa date)
cp source.csv copie.csv          # copier un fichier
cp -r data/ sauvegarde/          # copier un dossier (récursif)
mv ancien.txt nouveau.txt        # renommer
mv *.csv data/brut/              # déplacer (le * est développé par le shell)
rm fichier.txt                   # supprimer (PAS de corbeille !)
rm -r dossier/                   # supprimer un dossier et son contenu
rmdir dossier_vide/
```

| Lire un fichier | Usage |
|---|---|
| `cat f` | tout afficher (petits fichiers) |
| `less f` | paginer (`q` pour quitter, `/` pour chercher) |
| `head -n 20 f` / `tail -n 20 f` | début / fin |
| `tail -f app.log` | suivre un journal en direct |
| `wc -l f` | compter les lignes |
| `du -sh dossier/` / `df -h` | taille d'un dossier / espace libre des disques |

::: warn rm est définitif
`rm -rf` supprime sans confirmation et sans corbeille. Une faute de frappe (`rm -rf / tmp` au lieu de `rm -rf /tmp`) peut être catastrophique. Vérifier d'abord avec `ls` ce que le motif désigne ; `rm -i` demande confirmation.
:::

### Rechercher

```bash
find . -name "*.csv"                       # fichiers .csv sous le dossier courant
find /var/log -name "*.log" -mtime -1      # modifiés depuis moins d'un jour
find . -size +100M                         # plus de 100 Mo
grep -rn "TODO" src/                       # chercher un texte dans les fichiers (récursif, numéros de ligne)
which python3                              # où est le programme appelé
```

::: quiz Quiz 1.1 — Chemins
Tu es dans `/home/alice/projet/src`. Quel chemin désigne `/home/alice/projet/data/ventes.csv` ?
- [ ] `data/ventes.csv`
- [x] `../data/ventes.csv`
- [ ] `/data/ventes.csv`
> `..` remonte à /home/alice/projet, puis on descend dans data. Le premier chemin chercherait src/data ; le troisième, absolu, désigne un dossier data à la racine du système.
:::

## 4. Les permissions

Chaque fichier a un **propriétaire**, un **groupe**, et trois triplets de droits :

```text
-rwxr-x---  1  alice  datateam  4096  12 mai  10:02  pipeline.sh
│└┬┘└┬┘└┬┘      └─┬─┘ └──┬───┘
│ │  │  │        propriétaire  groupe
│ │  │  └─ autres (o) : ---  aucun droit
│ │  └──── groupe (g) : r-x  lire, exécuter
│ └─────── propriétaire (u) : rwx  lire, écrire, exécuter
└───────── type : - fichier, d dossier, l lien symbolique
```

| Droit | Sur un fichier | Sur un dossier |
|---|---|---|
| `r` (4) | lire le contenu | lister les noms (`ls`) |
| `w` (2) | modifier le contenu | créer, renommer, **supprimer** des fichiers dedans |
| `x` (1) | exécuter (programme, script) | **traverser** (`cd`, accéder aux fichiers) |

### Notation octale

Chaque triplet est la **somme** des valeurs : r = 4, w = 2, x = 1.

| Octal | Droits | Usage typique |
|---|---|---|
| `755` | `rwxr-xr-x` | scripts, dossiers partagés en lecture |
| `644` | `rw-r--r--` | fichiers ordinaires |
| `700` | `rwx------` | dossier privé (`~/.ssh`) |
| `600` | `rw-------` | clé privée SSH, fichier de secrets |

```bash
chmod +x pipeline.sh          # ajouter l'exécution pour tous
chmod u+x,g-w,o-rwx f         # notation symbolique : u/g/o/a, +/-/=, r/w/x
chmod 640 config.ini          # notation octale : rw- r-- ---
chown alice:datateam f        # changer propriétaire et groupe (souvent avec sudo)
chmod -R g+rX partage/        # récursif ; X = exécution seulement pour les dossiers
```

::: warn chmod 777, la fausse solution
`777` donne **tous** les droits à **tout le monde** : n'importe quel utilisateur ou service compromis peut modifier ou remplacer le fichier. Face à « Permission denied », identifier **qui** doit faire **quoi**, puis donner le droit minimal (bon propriétaire, bon groupe, `644`/`755`).
:::

::: quiz Quiz 1.2 — Lire des droits
Un dossier a les droits `drwxr-x--x`. Que peut faire un utilisateur qui n'est ni propriétaire ni membre du groupe ?
- [ ] Lister et lire tous les fichiers du dossier
- [x] Traverser le dossier et accéder à un fichier dont il connaît le nom (selon les droits du fichier), mais pas lister son contenu
- [ ] Rien du tout
> Pour « autres », le triplet est --x : x sur un dossier permet de le traverser, mais sans r on ne peut pas lister les noms. Il peut donc ouvrir /dossier/fichier.txt s'il connaît le nom et si le fichier lui-même est lisible.
:::

## 5. Utilisateurs, groupes et sudo

```bash
whoami                      # mon nom d'utilisateur
id                          # mes identifiants et groupes
sudo apt update             # exécuter UNE commande en administrateur (mot de passe demandé)
sudo -u postgres psql       # exécuter en tant qu'un autre utilisateur
sudo adduser bob            # créer un utilisateur (Debian/Ubuntu)
sudo usermod -aG docker bob # ajouter bob au groupe docker (-a : sans retirer les autres groupes)
```

- **root** (UID 0) a tous les droits. On ne travaille pas en root : on utilise `sudo` ponctuellement, ce qui laisse une trace dans les journaux.
- Les **groupes** permettent de partager des droits (`datateam`, `docker`) sans tout ouvrir.
- Après un ajout à un groupe, il faut se **reconnecter** pour qu'il soit pris en compte.

::: warn Le groupe docker
Être membre du groupe `docker` permet de lancer des conteneurs… y compris un conteneur qui monte `/` de l'hôte en root. C'est **équivalent à un accès root** : à n'accorder qu'aux personnes de confiance.
:::

::: exo Exercice 1 — Organiser un projet
Depuis ton dossier personnel, en une ligne chacune :
1. Crée l'arborescence `projet/data/brut`, `projet/data/propre`, `projet/src`.
2. Déplace tous les `.csv` du dossier courant dans `projet/data/brut`.
3. Trouve dans `projet` tous les fichiers de plus de 50 Mo.
4. Affiche les 5 dernières lignes de `projet/src/train.log` et continue à les suivre.
?? Voir la solution
1. `mkdir -p projet/data/{brut,propre} projet/src` — les accolades sont développées par bash en deux chemins.
2. `mv *.csv projet/data/brut/`
3. `find projet -type f -size +50M`
4. `tail -n 5 -f projet/src/train.log`
:::

::: exo Exercice 2 — Diagnostiquer des droits
`./deploy.sh` répond `Permission denied`. `ls -l deploy.sh` affiche `-rw-r--r-- 1 alice alice 812 deploy.sh`. Puis, une fois corrigé, le script échoue en écrivant dans `/var/log/deploy.log` (`-rw-r----- 1 root adm`).
1. Pourquoi le premier refus ? Corrige-le.
2. Pourquoi le second ? Propose une solution qui n'utilise ni `chmod 777` ni `sudo` sur tout le script.
?? Voir la solution
1. Le fichier n'a pas le droit **x** : `chmod u+x deploy.sh` (ou `chmod 755`). Alternative : `bash deploy.sh`, qui n'a besoin que du droit de lecture.
2. Le journal appartient à root, groupe `adm`, et seul root peut écrire (`rw-` pour le propriétaire, `r--` pour le groupe). Solutions propres : écrire le journal dans un dossier appartenant à alice (`~/logs/deploy.log`) ; ou créer un fichier dédié qu'alice peut écrire (`sudo install -o alice -m 640 /dev/null /var/log/deploy.log`) ; ou utiliser `sudo` uniquement pour la commande qui en a besoin.
:::

::: culture Culture & histoire
- **1969–1971** — Ken Thompson et Dennis Ritchie créent **Unix** aux Bell Labs ; le modèle « tout est fichier » et les permissions propriétaire/groupe/autres datent de cette époque.
- **1983** — Richard Stallman lance le projet **GNU** (outils libres : bash, coreutils, gcc) ; **1991** — Linus Torvalds publie le noyau **Linux**. Un système « Linux » combine le noyau Linux et les outils GNU.
- **1989** — Brian Fox écrit **bash** (*Bourne Again SHell*), successeur du Bourne shell de 1979.
- Aujourd'hui, Linux équipe la quasi-totalité des serveurs du cloud, des supercalculateurs du TOP500 et, via Android, la majorité des téléphones.
- [The Linux Command Line (W. Shotts, livre gratuit)](https://linuxcommand.org/tlcl.php)
- [explainshell : décortiquer une commande](https://explainshell.com/)
- [OverTheWire Bandit : apprendre en jouant](https://overthewire.org/wargames/bandit/)
:::

## Synthèse

::: note À retenir
- Racine `/` ; `~` = dossier personnel ; `/etc` configuration, `/var/log` journaux.
- Chemins absolus (`/…`) et relatifs (`.`, `..`) ; `Tab` et `Ctrl+R` pour aller vite.
- `mkdir -p`, `cp -r`, `mv`, `rm` (définitif), `find`, `grep -rn`, `less`, `tail -f`, `du -sh`, `df -h`.
- Permissions u/g/o × r/w/x ; octal r = 4, w = 2, x = 1 ; `644` fichiers, `755` scripts, `600` secrets.
- Sur un dossier : `r` lister, `w` créer/supprimer, `x` traverser.
- `sudo` ponctuel, droits minimaux, jamais `777` ; groupe `docker` ≈ root.
:::
