---
title: Branches & fusion
subtitle: Travailler en parallèle sans se marcher dessus, puis réunir les histoires.
domains: DATA, BIG DATA, IA
tags: branch, merge, conflit, remote, pull request
niveau: Débutant
duree: 30 min
objectifs: Comprendre à quoi sert une branche ; créer et changer de branche ; fusionner (merge) ; résoudre un conflit ; pousser vers un remote et ouvrir une pull request.
---

## 1. Qu'est-ce qu'une branche ?

Une **branche** est une ligne de développement indépendante. Techniquement, c'est juste un
**pointeur léger** vers un commit — créer une branche ne copie rien, c'est quasi instantané.

::: def Branche
Un **pointeur mobile** vers un commit. Quand tu commits sur une branche, le pointeur avance
automatiquement vers le nouveau commit. `HEAD` indique la branche sur laquelle tu te trouves.
:::

Pourquoi ? Pour développer une fonctionnalité, corriger un bug ou faire un essai **sans toucher**
à la version stable (`main`). Si l'expérience échoue, on supprime la branche : `main` n'a rien vu.

::: info Modèle courant
`main` reste toujours stable et déployable. Chaque tâche vit dans une branche dédiée
(`feature/export-csv`, `fix/login`), puis est fusionnée dans `main` une fois terminée et relue.
:::

## 2. Créer, lister, changer de branche

```bash
git branch                    # liste les branches (* = branche courante)
git branch ma-feature         # crée une branche (sans y aller)
git switch ma-feature         # bascule dessus   (ancien : git checkout)
git switch -c ma-feature      # crée ET bascule en une commande
git switch main               # revenir sur main
```

::: quiz Quiz 2.1
Quelle commande crée une nouvelle branche **et** te place dessus en une seule fois ?
- [ ] `git branch -c ma-feature`
- [x] `git switch -c ma-feature`
- [ ] `git new ma-feature`
- [ ] `git checkout ma-feature`
> `git switch -c` (ou l'ancien `git checkout -b`) crée et bascule. `git checkout ma-feature` sans `-b`
> suppose que la branche existe déjà.
:::

## 3. Fusionner (merge)

Une fois ta fonctionnalité prête, tu la ramènes dans `main` :

```bash
git switch main               # on se place sur la branche cible
git merge ma-feature          # on y intègre le travail de ma-feature
```

Deux cas se présentent :

| Cas | Ce qui se passe |
|-----|-----------------|
| **Fast-forward** | `main` n'a pas bougé depuis : Git avance simplement le pointeur. Aucun commit de fusion. |
| **Merge commit** | `main` et la branche ont divergé : Git crée un **commit de fusion** à deux parents. |

::: tip Astuce
`git log --oneline --graph --all` te montre le dessin des branches et des fusions.
Indispensable pour « voir » ce qui se passe.
:::

## 4. Résoudre un conflit

Un **conflit** survient quand deux branches modifient **les mêmes lignes** du même fichier.
Git ne peut pas choisir à ta place : il te confie l'arbitrage.

```text
<<<<<<< HEAD
couleur = "bleu"
=======
couleur = "rouge"
>>>>>>> ma-feature
```

Tu édites le fichier pour garder la bonne version (en supprimant les marqueurs `<<<`, `===`, `>>>`),
puis :

```bash
git add fichier-en-conflit.py   # marque le conflit comme résolu
git commit                      # finalise la fusion
```

::: warn Attention
Ne laisse **jamais** traîner les marqueurs `<<<<<<<`, `=======`, `>>>>>>>` dans ton code : il ne
compilerait plus. Relis bien le fichier après résolution.
:::

::: quiz Quiz 4.1
Dans un conflit, que signifie la partie entre `<<<<<<< HEAD` et `=======` ?
- [x] La version de **ta branche courante** (celle sur laquelle tu es)
- [ ] La version de la branche que tu fusionnes
- [ ] Une suggestion automatique de Git
- [ ] La version la plus ancienne
> `HEAD` = là où tu es. La partie après `=======` jusqu'à `>>>>>>> nom` vient de la branche fusionnée.
:::

## 5. Travailler avec un remote (GitHub)

Un **remote** est une copie du dépôt hébergée ailleurs (souvent GitHub), nommée `origin` par défaut.

```bash
git remote -v                 # voir les remotes configurés
git clone <url>               # récupérer un dépôt distant en entier
git push origin main          # envoyer mes commits vers le remote
git pull                      # récupérer + fusionner les commits distants
git fetch                     # récupérer SANS fusionner (pour inspecter d'abord)
```

::: def Pull request (PR)
Sur GitHub, une **pull request** propose de fusionner ta branche dans une autre. Elle ouvre un espace
de **revue de code** : discussion, commentaires ligne à ligne, tests automatiques (CI), puis fusion.
C'est le cœur du travail collaboratif moderne.
:::

::: exo Exercice — Cycle complet d'une fonctionnalité
Écris la suite de commandes pour : créer une branche `feature/ajout-stats`, y faire un commit,
la publier sur GitHub, puis (après fusion de la PR) nettoyer.
?? Voir la solution
```bash
git switch -c feature/ajout-stats
# ... tu codes ...
git add .
git commit -m "Ajoute le calcul des statistiques descriptives"
git push -u origin feature/ajout-stats
# -> tu ouvres la Pull Request sur GitHub, elle est relue puis fusionnée

git switch main
git pull                      # récupère la version fusionnée
git branch -d feature/ajout-stats   # supprime la branche locale devenue inutile
```
:::

::: tip Pour aller plus loin
La publication de **ce** portail sur le web utilise exactement ces commandes :
voir le guide [Publier avec GitHub Pages](../../guide-github-pages.html).
:::

::: culture Culture & histoire
La fonction qui a fait exploser l'adoption de Git n'est pas technique mais **sociale** : la
**pull request**, introduite par **GitHub** en 2008. Avant, contribuer à un projet voulait dire
envoyer des *patchs* par e-mail sur des listes de diffusion (ce que fait encore le noyau Linux).
GitHub a transformé cette mécanique en une interface visuelle où n'importe qui peut *forker* un
projet, proposer une amélioration et en discuter publiquement.

Ce modèle a donné naissance à la culture **open source de masse** : des millions de projets, des
contributions d'inconnus, et le fameux « graphe de contributions » vert qui a rendu le versioning
presque ludique. En **2018**, Microsoft rachète GitHub pour 7,5 milliards de dollars — signe que
l'historique du code est devenu une infrastructure stratégique mondiale.

- [GitHub Flow (guide officiel)](https://docs.github.com/fr/get-started/using-github/github-flow)
- [Visualiser Git — Learn Git Branching (interactif)](https://learngitbranching.js.org/?locale=fr_FR)
:::
