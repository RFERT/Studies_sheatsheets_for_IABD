---
title: Les bases de Git
subtitle: Comprendre ce qu'est un dépôt, faire ses premiers commits et lire l'historique.
domains: DATA, BIG DATA, IA
tags: commit, add, status, log
niveau: Débutant
duree: 25 min
objectifs: Savoir ce qu'est un système de gestion de versions ; initialiser un dépôt ; enregistrer des modifications avec `add` + `commit` ; lire et naviguer dans l'historique.
---

## 1. Pourquoi versionner son code ?

Imagine un dossier `projet_final_v2_vraiment_final_CORRIGÉ.zip`. On a tous connu ça.
Un **système de gestion de versions** (VCS) remplace ce chaos par un historique propre :
chaque changement est enregistré, daté, signé et **réversible**.

::: def Dépôt (repository)
Un **dépôt** est un dossier suivi par Git. Il contient tes fichiers **et** l'historique complet
de toutes leurs versions, stocké dans un sous-dossier caché `.git`.
:::

Git est **distribué** : chaque personne possède une copie complète de l'historique sur sa machine.
Pas besoin d'être connecté à un serveur pour committer, consulter le passé ou créer des branches.

::: tip À retenir
Git ≠ GitHub. **Git** est l'outil (en ligne de commande) ; **GitHub** est un service en ligne
qui héberge des dépôts Git et ajoute la collaboration (pull requests, issues, Actions…).
:::

## 2. Créer un dépôt et configurer son identité

```bash
# Dans le dossier de ton projet
git init                      # crée le dépôt (dossier .git)

# À faire une seule fois par machine
git config --global user.name  "Ada Lovelace"
git config --global user.email "ada@example.com"
```

::: quiz Quiz 1.1
Quelle commande transforme un dossier ordinaire en dépôt Git ?
- [ ] `git start`
- [x] `git init`
- [ ] `git new`
- [ ] `git create`
> `git init` crée le sous-dossier `.git` qui contient tout l'historique. Les autres commandes n'existent pas.
:::

## 3. Les trois zones de Git

C'est **le** concept clé à maîtriser. Un fichier voyage entre trois espaces :

| Zone | Rôle | Commande pour y aller |
|------|------|-----------------------|
| **Répertoire de travail** | tes fichiers réels, modifiables | (édition normale) |
| **Index / staging** | la « photo » que tu prépares pour le prochain commit | `git add` |
| **Dépôt** | l'historique des commits scellés | `git commit` |

::: info Le flux normal
On **modifie** un fichier → on le **stage** (`git add`) pour dire « ce changement fera partie du prochain
instantané » → on **commit** (`git commit`) pour sceller cet instantané dans l'historique.
:::

```bash
git status                    # où en est chaque fichier ?
git add fichier.py            # ajoute UN fichier à l'index
git add .                     # ajoute TOUT le répertoire courant
git commit -m "Message clair" # scelle un instantané
```

::: warn Piège fréquent
`git add` ne « sauvegarde » rien tout seul. Tant que tu n'as pas fait `git commit`, rien n'est
enregistré dans l'historique. Et un `git add` **avant** une nouvelle modification ne capture pas
cette nouvelle modification : il faut re-`add`.
:::

::: quiz Quiz 3.1
Tu modifies `app.py`, tu fais `git add app.py`, puis tu modifies **encore** `app.py`.
Que contient le prochain commit si tu fais `git commit` tout de suite ?
- [x] La version de `app.py` au moment du `git add` (pas la dernière modif)
- [ ] La toute dernière version de `app.py`
- [ ] Les deux versions
- [ ] Rien, Git refusera
> L'index est une photo figée au moment du `add`. La modification faite **après** n'y est pas :
> il faudrait refaire `git add app.py`. C'est la source d'erreur n°1 des débutants.
:::

## 4. Écrire de bons messages de commit

Un bon message explique le **pourquoi**, pas seulement le quoi. Convention répandue :
une ligne de résumé courte à l'impératif, puis un corps optionnel.

```
Corrige le calcul de la moyenne mobile

La fenêtre glissante incluait la valeur courante deux fois,
ce qui biaisait les stats sur les petits échantillons.
```

::: tip Astuce
Un commit = **une idée**. Évite les commits fourre-tout « wip », « fix », « truc ».
Un historique lisible, c'est un futur-toi qui te remercie.
:::

## 5. Lire l'historique

```bash
git log                       # historique complet
git log --oneline             # une ligne par commit (très pratique)
git log --oneline --graph     # avec le graphe des branches
git show <hash>               # détail d'un commit précis
git diff                      # ce que tu as modifié mais pas encore stagé
git diff --staged             # ce qui est stagé mais pas encore committé
```

Chaque commit possède un identifiant unique (un **hash** SHA-1, ex. `a1b2c3d`). On peut y revenir,
le comparer, l'annuler. L'historique est un **graphe orienté acyclique** (DAG) de commits — exactement
la structure que tu croises en maths (Module Graphes) et dans les pipelines de données.

::: exo Exercice — Ton premier dépôt
Dans un nouveau dossier, crée un dépôt, ajoute un fichier `notes.txt` contenant une ligne,
et fais ton premier commit. Écris les 4 commandes.
?? Voir la solution
```bash
git init
echo "Ma première ligne versionnée" > notes.txt
git add notes.txt
git commit -m "Ajoute notes.txt avec une première note"
```
Vérifie ensuite avec `git log --oneline` : tu dois voir ton commit.
:::

::: culture Culture & histoire
Git est né en **2005** dans des circonstances mouvementées. Le noyau **Linux** utilisait alors un
outil propriétaire, **BitKeeper**, dont la licence gratuite fut retirée à la communauté.
**Linus Torvalds** — le créateur de Linux — décida d'écrire son propre outil en **deux semaines**,
avec des exigences radicales : rapidité extrême, nature **distribuée**, et intégrité cryptographique
(chaque commit est un hash de son contenu, ce qui rend l'historique infalsifiable).

#### Les grands noms
- **Linus Torvalds** : conçoit Git en 2005, puis en délègue la maintenance.
- **Junio Hamano** : mainteneur principal depuis 2005, l'architecte de la maturité de Git.
- **Tom Preston-Werner, Chris Wanstrath, PJ Hyett** : fondent **GitHub** en 2008, qui popularise
  Git bien au-delà des développeurs Linux et invente la *pull request* moderne.

#### Pourquoi « git » ?
Torvalds, fidèle à son humour, a dit avoir nommé le projet d'après l'argot britannique *git*
(« sale type »), ajoutant qu'il nommait ses projets d'après lui-même.

- [Pro Git (livre gratuit, FR)](https://git-scm.com/book/fr/v2)
- [Documentation officielle](https://git-scm.com/doc)
:::
