---
title: Réécrire l'historique — rebase, amend, reset, revert
subtitle: Garder un historique lisible et réparer ses erreurs sans rien perdre, ni casser le travail des autres.
domains: DATA, BIG DATA, IA
tags: rebase, rebase interactif, squash, amend, reset, revert, reflog, cherry-pick, stash, bisect
niveau: Intermédiaire
duree: 60 min
objectifs: Choisir entre merge et rebase ; nettoyer ses commits avec un rebase interactif ; distinguer reset (soft, mixed, hard) et revert ; récupérer un commit « perdu » avec le reflog ; utiliser cherry-pick, stash et bisect.
---

::: goal Ce que tu sauras faire à la fin
- Rebaser une branche de fonctionnalité sur `main` et résoudre les conflits commit par commit.
- Transformer 7 commits « wip » en 2 commits propres avant une pull request.
- Annuler une erreur **sans réécrire** un historique partagé.
- Ne plus jamais paniquer : presque rien n'est perdu tant qu'on a le **reflog**.
:::

## 1. Rappel : un commit est immuable

Un commit est identifié par un **hash** (SHA-1, 40 caractères) calculé à partir de son contenu, de son message, de son auteur, de sa date **et de l'identifiant de son parent**. Conséquence : on ne peut **jamais modifier** un commit. Toute « réécriture » (rebase, amend) crée de **nouveaux** commits avec de nouveaux hash, et déplace les étiquettes de branches vers eux. Les anciens commits existent toujours, simplement plus référencés.

::: viz git Merge, rebase et leurs graphes
scenario: rebase
Observe que D et E ne sont pas « déplacés » : Git crée D′ et E′, de nouveaux commits au contenu équivalent mais de parent différent (donc de hash différent). Compare avec le scénario « Merge », qui conserve les commits d'origine et ajoute un commit de fusion.
:::

## 2. Rebase : rejouer ses commits au-dessus d'une autre base

```bash
git switch feature
git fetch origin
git rebase origin/main          # rejoue les commits de feature au-dessus de main
# en cas de conflit :
#   corriger les fichiers, puis
git add fichier_corrige.py
git rebase --continue           # passe au commit suivant
git rebase --abort              # ou : tout annuler et revenir à l'état d'avant
```

| | `git merge main` (dans feature) | `git rebase main` |
|---|---|---|
| Historique | conservé, avec commit de fusion | **linéaire**, commits recréés |
| Hash des commits de feature | inchangés | **nouveaux** |
| Conflits | résolus une fois, dans le commit de fusion | résolus **commit par commit** |
| Sûr sur une branche partagée ? | oui | **non** |

::: warn La règle d'or du rebase
**Ne jamais rebaser des commits déjà poussés sur une branche que d'autres utilisent.** Tes collègues ont les anciens commits ; après ton `push --force`, leurs historiques divergent du tien et ils risquent de réintroduire les anciennes versions. Rebaser **sa propre** branche de travail avant de la proposer est en revanche une pratique saine.
:::

::: tip push --force-with-lease
Après un rebase de ta propre branche déjà poussée, utilise `git push --force-with-lease` plutôt que `--force` : il refuse d'écraser la branche distante si quelqu'un d'autre y a poussé entre-temps.
:::

## 3. Le rebase interactif

```bash
git rebase -i HEAD~4       # retravailler les 4 derniers commits
```

L'éditeur s'ouvre avec la liste des commits, du **plus ancien** au plus récent :

```text
pick 3f2a1c4 Ajoute le chargement des données
pick 9b8e7d1 wip
pick c4d5e6f corrige typo
pick 1a2b3c4 Ajoute la validation croisée
```

| Commande | Effet |
|---|---|
| `pick` | garder le commit tel quel |
| `reword` | garder, mais modifier le message |
| `edit` | s'arrêter pour modifier le contenu du commit |
| `squash` | fusionner avec le commit précédent, en combinant les messages |
| `fixup` | fusionner avec le précédent, en jetant ce message |
| `drop` | supprimer le commit |
| réordonner les lignes | changer l'ordre des commits |

Pour obtenir deux commits propres, on remplace par :

```text
pick 3f2a1c4 Ajoute le chargement des données
fixup 9b8e7d1 wip
fixup c4d5e6f corrige typo
pick 1a2b3c4 Ajoute la validation croisée
```

::: tip Préparer les fixup à l'avance
`git commit --fixup=3f2a1c4` crée un commit nommé « fixup! … » ; plus tard, `git rebase -i --autosquash main` le place et le marque automatiquement.
:::

## 4. Corriger le dernier commit : amend

```bash
git add oubli.py
git commit --amend              # ajoute oubli.py au dernier commit, permet de changer le message
git commit --amend --no-edit    # idem sans rouvrir l'éditeur
```

`--amend` **remplace** le dernier commit par un nouveau : même règle que le rebase, à éviter s'il est déjà partagé.

## 5. Annuler : reset ou revert ?

::: viz git reset réécrit, revert ajoute
scenario: annuler
Les deux commandes « annulent » C, mais pas de la même façon : reset déplace la branche en arrière (C sort de l'historique de la branche), revert ajoute un commit inverse sans rien réécrire.
:::

### git reset : déplacer la branche

| Variante | Branche (HEAD) | Zone de staging | Fichiers de travail |
|---|---|---|---|
| `--soft` | reculée | **conservée** (les changements restent prêts à committer) | conservés |
| `--mixed` (défaut) | reculée | vidée | **conservés** (modifications non stagées) |
| `--hard` | reculée | vidée | **écrasés** ⚠️ |

```bash
git reset --soft HEAD~1     # « décommiter » : refaire le dernier commit autrement
git reset HEAD~1            # décommiter et désindexer, garder le travail
git reset --hard HEAD~1     # tout jeter (seulement si tu es sûr)
```

### git revert : annuler par un nouveau commit

```bash
git revert a1b2c3d          # crée un commit qui applique l'inverse de a1b2c3d
git revert -m 1 <merge>     # annuler un commit de fusion (garder le 1er parent)
```

::: def Règle de décision
- Le commit est **local** (jamais poussé) → `reset` ou `rebase -i`, l'historique reste propre.
- Le commit est **partagé** → `revert` : on ajoute de l'histoire au lieu d'en effacer.
:::

::: quiz Quiz 2.1 — Annuler
Un commit poussé sur `main` il y a une heure casse la production. Tes collègues ont déjà récupéré `main`. Que faire ?
- [ ] `git reset --hard HEAD~1` puis `git push --force`
- [x] `git revert <hash>` puis `git push`
- [ ] Supprimer le dépôt et le recloner
> revert ajoute un commit qui annule l'effet du commit fautif sans réécrire l'historique partagé : les collègues font un simple pull. Un reset suivi d'un push --force réécrirait main sous leurs pieds et pourrait réintroduire le bug depuis leurs copies.
:::

## 6. Le filet de sécurité : le reflog

Le **reflog** enregistre localement chaque déplacement de HEAD (commit, checkout, reset, rebase…). Par défaut, ses entrées sont conservées 90 jours, mais seulement **30 jours** pour les commits devenus inaccessibles — après quoi le ramasse-miettes (`git gc`) peut les supprimer. Un commit « perdu » après un `reset --hard` ou un rebase raté y est donc encore, pour un temps :

```bash
git reflog
# e4f5a6b HEAD@{0}: reset: moving to HEAD~3
# 9c8d7e6 HEAD@{1}: commit: Ajoute la validation croisée     ← ce qu'on croyait perdu
git branch sauvetage 9c8d7e6     # recréer une branche dessus
# ou : git reset --hard HEAD@{1}
```

::: warn Ce que le reflog ne sauve pas
Des modifications **jamais committées** (ni même ajoutées) puis écrasées par `reset --hard` ou `checkout -- fichier` sont perdues : Git ne les a jamais vues. Commite souvent, quitte à nettoyer ensuite avec un rebase interactif.
:::

## 7. Trois outils de plus

### cherry-pick : copier un commit précis

```bash
git switch main
git cherry-pick a1b2c3d          # applique ce commit (de n'importe quelle branche) sur main
```

Utile pour reporter un correctif sur une branche de version. Le commit copié a un nouveau hash.

### stash : mettre de côté un travail en cours

```bash
git stash push -m "essai graphiques"   # range les modifications, répertoire propre
git switch hotfix                       # … corriger autre chose …
git switch -
git stash pop                           # récupérer le travail mis de côté
```

### bisect : trouver le commit qui a introduit un bug

```bash
git bisect start
git bisect bad                 # la version actuelle est boguée
git bisect good v1.2           # cette version-là était saine
# Git place HEAD au milieu : tester, puis dire « good » ou « bad »… jusqu'au coupable
git bisect run pytest tests/test_score.py   # ou automatiser avec un test
git bisect reset
```

C'est une **recherche dichotomique** : sur 1 000 commits, environ 10 tests suffisent (\(\log_2 1000 \approx 10\)).

::: quiz Quiz 2.2 — Rebase interactif
Tu veux fusionner le commit « corrige typo » dans le commit précédent sans garder son message. Quel mot-clé utiliser dans `git rebase -i` ?
- [ ] `squash`
- [x] `fixup`
- [ ] `drop`
> fixup fusionne le commit dans le précédent et jette son message ; squash fusionne aussi mais te propose de combiner les deux messages ; drop supprimerait la correction elle-même.
:::

::: exo Exercice 1 — Nettoyer avant une pull request
Ta branche `feature/meteo` contient, du plus ancien au plus récent :
1. « Ajoute l'appel à l'API météo »
2. « wip »
3. « Ajoute les tests de l'API »
4. « oups, oubli d'un import dans l'appel API »
5. « fix test »

Tu veux deux commits : l'appel API (complet) et les tests. Écris la liste du rebase interactif.
?? Voir la solution
Il faut **réordonner** pour placer la correction de l'import juste après le commit 1 :
```text
pick  <1> Ajoute l'appel à l'API météo
fixup <2> wip
fixup <4> oups, oubli d'un import dans l'appel API
pick  <3> Ajoute les tests de l'API
fixup <5> fix test
```
Commande : `git rebase -i main` (ou `HEAD~5`). Si « wip » concernait les tests, on le place sous le commit 3. Vérifier ensuite avec `git log --oneline` et relancer les tests : un rebase peut produire un état intermédiaire qui ne compile pas.
:::

::: exo Exercice 2 — Sauvetage
Tu as fait `git reset --hard HEAD~2` par erreur sur ta branche et tu as perdu deux commits. Puis tu as fait un nouveau commit. Comment récupérer les deux commits perdus **sans** perdre le nouveau ?
?? Voir la solution
`git reflog` montre l'entrée d'avant le reset, par exemple `HEAD@{2}` ou le hash `9c8d7e6` du dernier commit perdu. Le plus simple : `git branch recup 9c8d7e6` pour le mettre à l'abri, puis rejouer le nouveau commit dessus — `git switch recup` puis `git cherry-pick <hash du nouveau commit>` — et enfin repositionner la branche d'origine : `git switch ma-branche && git reset --hard recup`. Alternative : `git cherry-pick` des deux commits perdus sur la branche actuelle.
:::

::: culture Culture & histoire
- **2005** — Linus Torvalds écrit Git en quelques semaines après la fin de la licence gratuite de BitKeeper pour le noyau Linux ; Junio Hamano en devient rapidement le mainteneur, ce qu'il est toujours.
- Le choix d'un historique fait de commits **immuables** identifiés par leur hash (*content-addressable storage*) rend la réécriture explicite et vérifiable : modifier un ancien commit change le hash de tous ses descendants.
- Les débats « merge contre rebase » opposent deux philosophies : l'historique comme **trace fidèle** de ce qui s'est passé, ou comme **récit lisible** de l'évolution du projet.
- [Pro Git — Réécrire l'historique (FR)](https://git-scm.com/book/fr/v2/Utilitaires-Git-R%C3%A9%C3%A9crire-l%E2%80%99historique)
- [Pro Git — Rebaser (FR)](https://git-scm.com/book/fr/v2/Les-branches-avec-Git-Rebaser-Rebasing)
- [Oh Shit, Git!?! (dépannage)](https://ohshitgit.com/fr)
:::

## Synthèse

::: note À retenir
- Les commits sont **immuables** : rebase et amend créent de nouveaux commits.
- `rebase` = historique linéaire ; jamais sur des commits **partagés** ; `push --force-with-lease`.
- `rebase -i` : `pick`, `reword`, `squash`, `fixup`, `drop`, réordonner.
- `reset` déplace la branche (`--soft` / `--mixed` / `--hard`) ; `revert` ajoute un commit inverse (pour l'historique partagé).
- `reflog` retrouve les commits « perdus » ; le travail jamais committé, lui, est perdu.
- `cherry-pick` (copier), `stash` (mettre de côté), `bisect` (dichotomie sur l'historique).
:::
