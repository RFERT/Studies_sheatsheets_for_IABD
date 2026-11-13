---
title: Antisèche Git & GitHub
subtitle: L'essentiel de Git sur une page — commandes, workflow, dépannage.
domains: DATA, BIG DATA, IA
tags: commit, branch, merge, remote, rebase
niveau: Révision express
---

Mémo condensé pour réviser vite ou dépanner. Chaque bloc = une carte. Un terme à revoir ? Survole-le : [[HEAD|pointeur vers le dernier commit de la branche courante]]. Besoin du détail ? → [cours complet](cours.html?c=GIT).

## Configuration initiale

```bash
git config --global user.name "Prénom Nom"
git config --global user.email "moi@exemple.fr"
git config --global init.defaultBranch main
git config --list          # vérifier
```

::: tip
À faire **une seule fois** par machine. `--global` = pour tous tes dépôts.
:::

## Créer / cloner un dépôt

```bash
git init                   # nouveau dépôt ici
git clone <url>            # copier un dépôt distant
git clone <url> dossier    # dans un dossier précis
```

## Le cycle de base

```bash
git status                 # où en suis-je ?
git add fichier.py         # préparer (stage) un fichier
git add -A                 # préparer TOUT
git commit -m "message"    # enregistrer un instantané
git log --oneline -10      # historique court
```

::: info
Les 3 zones : **working dir** (tes fichiers) → **staging** (`add`) → **dépôt** (`commit`).
La commande pour préparer un fichier est ==git add==, et celle qui enregistre un instantané est ==git commit==.
:::

## Branches

```bash
git branch                 # lister
git switch -c feature      # créer + aller dessus
git switch main            # changer de branche
git branch -d feature      # supprimer (fusionnée)
git branch -D feature      # forcer la suppression
```

## Fusionner

```bash
git switch main
git merge feature          # fusionner feature dans main
```

::: warn
**Conflit ?** Édite les zones `<<<<<<<` / `=======` / `>>>>>>>`, garde le bon,
puis `git add` le fichier et `git commit`.
:::

## Remote (GitHub)

```bash
git remote -v                       # voir les remotes
git remote add origin <url>         # relier à GitHub
git push -u origin main             # 1er envoi (mémorise)
git push                            # envois suivants
git pull                            # récupérer + fusionner
git fetch                           # récupérer SANS fusionner
```

## Annuler / corriger

```bash
git restore fichier.py              # annuler modifs non stagées
git restore --staged fichier.py     # retirer du staging
git commit --amend -m "nouveau"     # corriger le dernier commit
git revert <hash>                   # annuler un commit (nouveau commit)
git reset --hard <hash>             # ⚠️ revenir en arrière (destructif)
```

::: warn
`reset --hard` **supprime** tes modifications locales. À manier avec prudence.
:::

## Voir les différences

```bash
git diff                   # non stagé vs working
git diff --staged          # stagé vs dernier commit
git diff main..feature     # entre deux branches
git show <hash>            # détail d'un commit
```

## Ranger temporairement (stash)

```bash
git stash                  # mettre de côté
git stash list             # lister
git stash pop              # récupérer + supprimer
git stash drop             # jeter
```

## Workflow collaboratif type

1. `git switch -c feature/ma-tache`
2. coder, puis `git add -A` + `git commit -m "..."`
3. `git push -u origin feature/ma-tache`
4. ouvrir une **Pull Request** sur GitHub
5. relire, corriger, **merger**, supprimer la branche

::: tip
Commits **petits et fréquents**, messages à l'impératif (« Ajoute… », « Corrige… »).
:::

## .gitignore (essentiel)

```bash
# Python
__pycache__/
*.pyc
.venv/
# Data / secrets
*.env
data/*.csv
.DS_Store
```

::: info
Déjà suivi par erreur ? `git rm --cached fichier` puis commit.
:::

## Dépannage express

| Problème | Solution |
|---|---|
| Mauvais message de commit | `git commit --amend` |
| Oublié un fichier au dernier commit | `git add f` puis `git commit --amend` |
| Push refusé (rejected) | `git pull --rebase` puis `git push` |
| Revenir à un fichier d'avant | `git restore --source=<hash> f` |
| Voir qui a modifié une ligne | `git blame fichier` |

::: culture Pour aller plus loin
- [Documentation officielle Git](https://git-scm.com/doc)
- [Pro Git (livre gratuit, FR)](https://git-scm.com/book/fr/v2)
- [GitHub Docs](https://docs.github.com/fr)
:::
