---
title: Pull requests, revue de code et conflits
subtitle: Le cycle complet d'une contribution sur GitHub — de la branche à la fusion, en passant par la CI, la revue et la résolution méthodique des conflits.
domains: DATA, BIG DATA, IA
tags: pull request, code review, GitHub Actions, CI, branch protection, merge strategies, conflit, fork, upstream, CODEOWNERS
niveau: Intermédiaire
duree: 60 min
objectifs: Ouvrir une pull request utile ; faire et recevoir une revue de code ; connaître les trois stratégies de fusion de GitHub ; résoudre un conflit de façon méthodique ; contribuer à un projet via un fork ; protéger une branche avec une CI.
---

::: goal Ce que tu sauras faire à la fin
- Mener une pull request de bout en bout, CI comprise.
- Résoudre un conflit en comprenant les **trois** versions en jeu.
- Contribuer à un projet open source dont tu n'es pas membre.
:::

## 1. Qu'est-ce qu'une pull request ?

Une **pull request** (PR ; *merge request* sur GitLab) est une demande de fusion d'une branche dans une autre, accompagnée d'un espace de discussion : description, commentaires ligne par ligne, résultats de la CI, approbations. Ce n'est **pas** une fonctionnalité de Git, mais des plateformes (GitHub, GitLab, Bitbucket).

```bash
git switch -c feature/export-csv
# … commits …
git push -u origin feature/export-csv
gh pr create --fill --base main          # avec la CLI GitHub (ou via l'interface web)
```

### Une bonne PR

| Bonne pratique | Pourquoi |
|---|---|
| **Petite** (idéalement < 400 lignes modifiées) | la qualité d'une relecture chute avec la taille |
| Un seul sujet | plus facile à relire, à annuler, à comprendre plus tard |
| Titre clair + description : quoi, **pourquoi**, comment tester | le relecteur n'a pas ton contexte |
| Lien vers le ticket (`Closes #42`) | ferme le ticket automatiquement à la fusion |
| Captures ou résultats pour les changements visibles ou les modèles | « l'AUC passe de 0,81 à 0,84 sur la validation » |
| À jour avec `main`, CI verte | évite au relecteur de déboguer |

::: tip Draft PR
Ouvre une PR en **brouillon** (*draft*) tôt pour montrer la direction prise et obtenir des retours avant d'avoir tout écrit.
:::

## 2. La revue de code

**Pour le relecteur** — chercher dans cet ordre :
1. Le changement fait-il **ce qui est annoncé** ? Le besoin est-il le bon ?
2. **Correction** : cas limites, erreurs, données manquantes, fuite de données en ML.
3. **Lisibilité** et cohérence avec le reste du code.
4. Tests présents et pertinents.
5. Le style est laissé aux outils automatiques (formatter, linter).

**Formuler** : commenter le code, pas la personne ; distinguer bloquant et suggestion (`nit:` pour un détail) ; poser des questions (« Que se passe-t-il si la liste est vide ? ») plutôt qu'imposer.

**Pour l'auteur** : répondre à chaque commentaire (corrigé, ou expliquer pourquoi non), pousser les corrections dans de nouveaux commits pendant la revue (plus facile à relire), demander une nouvelle revue.

::: quiz Quiz 4.1 — Taille de PR
Ta fonctionnalité représente 2 000 lignes. Que faire ?
- [ ] Une seule PR, c'est plus cohérent
- [x] La découper en plusieurs PR successives et indépendantes (par exemple : modèle de données, puis traitement, puis interface), éventuellement derrière un feature flag
- [ ] Fusionner sans revue pour gagner du temps
> Une PR de 2 000 lignes est relue en diagonale : les bugs passent. Des PR de quelques centaines de lignes, chacune testée et fusionnable seule, sont relues sérieusement et plus faciles à annuler.
:::

## 3. Intégration continue sur les PR

Une CI exécute automatiquement les vérifications à chaque push sur une PR. Avec **GitHub Actions** :

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - run: ruff check .
      - run: pytest -q
```

### Protéger la branche principale

Dans *Settings → Branches* (règles de protection ou *rulesets*) : PR obligatoire, **au moins une approbation**, **CI verte obligatoire**, branche à jour avec `main`, interdiction des `push --force`. Un fichier `CODEOWNERS` désigne automatiquement les relecteurs selon les dossiers modifiés :

```text
# .github/CODEOWNERS
/src/models/   @equipe-ml
/infra/        @alice
```

## 4. Les trois stratégies de fusion de GitHub

| Bouton | Ce qui arrive dans `main` | Historique | Quand |
|---|---|---|---|
| **Create a merge commit** | tous les commits de la branche + un commit de fusion | complet, non linéaire | garder le détail du travail |
| **Squash and merge** | **un seul** commit regroupant tout | linéaire, un commit par PR | branches aux commits « wip » ; le plus courant |
| **Rebase and merge** | les commits de la branche, recréés au-dessus de `main` | linéaire, détaillé | commits déjà propres et atomiques |

::: viz git Squash merge
scenario: squash
Trois commits de travail deviennent un seul commit S sur main. Pratique, mais la branche d'origine n'est plus « fusionnée » au sens de Git : on la supprime après la fusion, et on ne continue pas à travailler dessus.
:::

## 5. Résoudre un conflit, méthodiquement

Un conflit survient quand les deux branches ont modifié **les mêmes lignes** (ou qu'une a supprimé un fichier que l'autre a modifié) depuis leur **ancêtre commun**. Git s'arrête et marque le fichier :

```text
<<<<<<< HEAD
seuil = 0.5
||||||| ancêtre commun
seuil = 0.4
=======
seuil = 0.45
>>>>>>> feature/calibration
```

Le bloc central (ancêtre) n'apparaît qu'avec le style `diff3` — à activer une fois pour toutes : `git config --global merge.conflictStyle zdiff3`. Il change tout : on voit que **les deux** côtés ont modifié 0,4, chacun pour une raison. Sans lui, on ne voit que deux valeurs et on choisit au hasard.

**Méthode** :
1. `git status` : lister les fichiers en conflit.
2. Pour chaque bloc : comprendre l'**intention** de chaque côté (lire les messages de commit, `git log --merge -p fichier`).
3. Écrire la version qui respecte **les deux intentions** (ce n'est souvent ni l'une ni l'autre).
4. Supprimer les marqueurs, `git add fichier`.
5. **Lancer les tests** : un merge sans conflit textuel peut quand même casser le code (conflit sémantique).
6. `git commit` (merge) ou `git rebase --continue` (rebase).

::: warn « ours » et « theirs » s'inversent pendant un rebase
Pendant un `merge`, `--ours` désigne ta branche actuelle. Pendant un `rebase`, Git rejoue **tes** commits sur la base : `--ours` désigne alors la **base** (main) et `--theirs` **tes** commits. Lis les marqueurs plutôt que de raisonner de mémoire.
:::

::: quiz Quiz 4.2 — Conflit sémantique
Deux PR fusionnent sans aucun conflit textuel. Pourtant `main` ne passe plus les tests. Comment est-ce possible ?
- [ ] C'est impossible : sans conflit, le résultat est forcément correct
- [x] Les deux PR modifient des endroits différents mais incompatibles (ex. l'une renomme une fonction, l'autre ajoute un appel à l'ancien nom)
- [ ] GitHub a mal fusionné les fichiers
> Git ne compare que des lignes de texte. Un renommage d'un côté et un nouvel appel de l'autre ne touchent pas les mêmes lignes : pas de conflit, mais un code cassé. C'est pourquoi on exige que la branche soit à jour avec main et que la CI repasse avant la fusion (merge queue).
:::

## 6. Contribuer via un fork

Sans droit d'écriture sur un dépôt, on en crée une **copie** sur son compte (*fork*) :

```bash
git clone https://github.com/moi/projet.git
cd projet
git remote add upstream https://github.com/organisation/projet.git   # le dépôt d'origine
git switch -c fix/typo-doc
# … commit …
git push -u origin fix/typo-doc        # vers MON fork
# puis ouvrir une PR de moi/projet:fix/typo-doc vers organisation/projet:main

# Plus tard, se remettre à jour avec le projet d'origine :
git fetch upstream
git switch main && git merge --ff-only upstream/main && git push origin main
```

::: tip Avant de contribuer à un projet open source
Lire le `CONTRIBUTING.md`, chercher un ticket marqué *good first issue*, annoncer dans le ticket qu'on s'en occupe, et respecter le code de conduite.
:::

::: exo Exercice 1 — Résoudre ce conflit
En fusionnant `feature/normalisation` dans `main` :
```text
<<<<<<< HEAD
X = df[["age", "revenu", "anciennete"]]
||||||| ancêtre commun
X = df[["age", "revenu"]]
=======
X = scaler.fit_transform(df[["age", "revenu"]])
>>>>>>> feature/normalisation
```
1. Quelle est l'intention de chaque côté ?
2. Propose la résolution.
3. Y a-t-il un problème de fond dans la branche feature ?
?? Voir la solution
1. `main` a **ajouté une feature** (`anciennete`) ; `feature/normalisation` a **standardisé** les features.
2. Combiner les deux : `X = scaler.fit_transform(df[["age", "revenu", "anciennete"]])`. Ni « garder HEAD » ni « garder feature » ne serait correct.
3. Oui : `fit_transform` sur tout `df` **avant** la séparation train/test provoque une **fuite de données** (le scaler voit les statistiques du test). En revue, on demanderait un `Pipeline` scikit-learn ajusté sur le train seulement. Un conflit est aussi une occasion de relire le code.
:::

::: exo Exercice 2 — Choisir la stratégie de fusion
Pour chaque PR, choisis merge commit, squash ou rebase and merge : (a) 12 commits « wip », « test », « fix » pour une petite fonctionnalité ; (b) 3 commits propres et atomiques (« ajoute le modèle », « ajoute les tests », « documente l'API ») ; (c) une branche de version `release/2.0` contenant 40 PR déjà relues.
?? Voir la solution
(a) **Squash** : un seul commit clair dans `main`, les « wip » disparaissent. (b) **Rebase and merge** (ou merge commit) : les 3 commits ont chacun un sens et méritent d'être conservés. (c) **Merge commit** : on veut garder tout l'historique et la trace explicite de l'intégration de la version ; squasher 40 PR détruirait l'information.
:::

::: culture Culture & histoire
- La « pull request » vient de la commande `git request-pull`, qui génère un **e-mail** demandant au mainteneur de récupérer (*pull*) des changements : c'est toujours ainsi que fonctionne le développement du noyau Linux, par listes de diffusion.
- **2008** — GitHub ouvre ses portes ; les pull requests y deviennent une interface web de discussion en 2010–2011. **2018** — Microsoft rachète GitHub ; **2019** — lancement de **GitHub Actions** en version publique.
- Les revues de code formelles remontent aux *inspections de Fagan* chez IBM dans les années 1970 ; des études chez Google ou Microsoft montrent que leur principal bénéfice est le **partage de connaissances**, avant même la détection de bugs.
- [GitHub Docs — Pull requests (FR)](https://docs.github.com/fr/pull-requests)
- [Google Engineering Practices — Code Review](https://google.github.io/eng-practices/review/)
- [Pro Git — Contribution à un projet (FR)](https://git-scm.com/book/fr/v2/GitHub-Contribution-%C3%A0-un-projet)
:::

## Synthèse

::: note À retenir
- PR = branche + discussion + CI + approbation ; **petite**, un sujet, avec le **pourquoi** et comment tester.
- Revue : besoin → correction → lisibilité → tests ; le style aux outils ; commenter le code, pas la personne.
- Protéger `main` : PR, approbation, CI verte, branche à jour, pas de force push ; `CODEOWNERS`.
- Merge commit (détail) / **squash** (un commit par PR) / rebase and merge (linéaire détaillé).
- Conflit : `zdiff3`, comprendre les deux intentions, combiner, **lancer les tests** ; ours/theirs inversés en rebase.
- Fork : remote `upstream` pour suivre le projet d'origine, PR depuis son fork.
:::
