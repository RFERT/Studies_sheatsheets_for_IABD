---
title: Travailler en équipe — workflows, conventions et versions
subtitle: Organiser les branches, nommer les commits et publier des versions pour qu'une équipe avance sans se marcher dessus.
domains: DATA, BIG DATA, IA
tags: GitHub Flow, Git Flow, trunk-based, Conventional Commits, SemVer, tags, .gitignore, hooks, pre-commit, monorepo
niveau: Intermédiaire
duree: 50 min
objectifs: Comparer GitHub Flow, Git Flow et trunk-based development ; écrire des messages Conventional Commits ; versionner avec SemVer et des tags ; automatiser la qualité avec des hooks pre-commit ; gérer les fichiers à ne pas versionner (secrets, données, notebooks).
---

::: goal Ce que tu sauras faire à la fin
- Choisir un workflow adapté à la taille et au rythme de livraison d'une équipe.
- Publier une version `v1.4.0` correctement taguée et la justifier par les commits.
- Empêcher qu'un secret ou un fichier de données de 2 Go n'arrive dans le dépôt.
:::

## 1. Pourquoi un workflow ?

Sans règles, une équipe de cinq personnes qui pousse sur `main` produit vite : des conflits quotidiens, une branche principale qui ne compile plus, des versions impossibles à reproduire. Un **workflow** fixe trois choses : **quelles branches** existent, **comment** le code y entre (revue, tests), et **comment** on livre.

## 2. Trois workflows de référence

### GitHub Flow (simple, livraison continue)

```text
main ──●──────●──────────●──────●──►  (toujours déployable)
        \    /            \    /
         ●──●  feature/a   ●──●  fix/b      (courtes, une pull request chacune)
```

1. `main` est **toujours déployable**.
2. Toute modification part d'une branche courte nommée explicitement (`feature/export-csv`, `fix/date-parsing`).
3. On ouvre une **pull request**, la CI teste, un collègue relit.
4. On fusionne dans `main`, puis on déploie.

### Git Flow (versions planifiées)

```text
main     ──●───────────────────●──────────►  (versions publiées, tags v1.0, v1.1)
            \                 / \
release      \           ●──●    \
              \         /          \
develop   ─────●──●──●──●──●──●──●──●──────►  (intégration)
                \  /     \  /
feature          ●●       ●●
hotfix                              ●  (corrige main, reporté dans develop)
```

Branches permanentes `main` et `develop`, plus des branches `feature/*`, `release/*` et `hotfix/*`. Adapté à un logiciel livré en **versions** maintenues en parallèle (application installée, bibliothèque) ; jugé lourd pour du web livré plusieurs fois par jour — son auteur lui-même le déconseille désormais dans ce cas.

### Trunk-based development (grandes équipes, CI mature)

Tout le monde intègre dans le **tronc** (`main`) au moins une fois par jour, via des branches de quelques heures. Les fonctionnalités inachevées sont cachées derrière des **feature flags**. Exige une CI rapide et une bonne couverture de tests.

| | GitHub Flow | Git Flow | Trunk-based |
|---|---|---|---|
| Branches longues | `main` | `main` + `develop` | `main` |
| Durée de vie d'une branche | jours | jours à semaines | heures |
| Livraison | continue | par versions | continue |
| Pour qui | la plupart des projets, projets étudiants | logiciels versionnés, plusieurs versions maintenues | grandes équipes, CI/CD avancée |

::: tip Pour un projet d'école ou un projet data
GitHub Flow suffit presque toujours : `main` protégée, une branche par tâche, une pull request relue avant chaque fusion.
:::

::: quiz Quiz 3.1 — Choisir un workflow
Une équipe publie une bibliothèque Python et doit maintenir en parallèle les versions 2.x (corrections de sécurité) et 3.x. Quel workflow s'y prête le mieux ?
- [ ] Trunk-based sans branche de version
- [x] Un modèle à branches de version (type Git Flow, ou main + branches `release/2.x`)
- [ ] Tout le monde pousse directement sur main
> Maintenir plusieurs versions publiées impose des branches de maintenance où l'on reporte les correctifs (cherry-pick). GitHub Flow et trunk-based supposent une seule version en production.
:::

## 3. Nommer : branches et commits

### Branches

`feature/…`, `fix/…`, `docs/…`, `refactor/…`, éventuellement avec le numéro de ticket : `feature/123-export-csv`.

### Conventional Commits

Une convention de messages lisible par les humains **et** par les outils :

```text
<type>(<portée optionnelle>): <description à l'impératif>

[corps optionnel : pourquoi ce changement]

[pied optionnel : BREAKING CHANGE: …, Refs #123]
```

| Type | Usage | Effet sur la version (SemVer) |
|---|---|---|
| `feat` | nouvelle fonctionnalité | MINEUR |
| `fix` | correction de bug | CORRECTIF |
| `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf` | le reste | aucun (sauf `perf` selon les équipes) |
| `!` ou `BREAKING CHANGE:` | rupture de compatibilité | MAJEUR |

```text
feat(api): ajoute l'export CSV des prédictions
fix(etl): gère les dates au format ISO 8601 avec fuseau
refactor!: renomme la fonction train() en fit()

BREAKING CHANGE: train() n'existe plus, utiliser fit().
```

Des outils (semantic-release, release-please, commitizen) en déduisent automatiquement le **numéro de version** et le **changelog**.

## 4. Versions : SemVer et tags

::: def Semantic Versioning (SemVer)
Une version `MAJEUR.MINEUR.CORRECTIF` (ex. `2.5.1`) :
- **MAJEUR** : changement incompatible de l'API publique ;
- **MINEUR** : ajout de fonctionnalité rétrocompatible ;
- **CORRECTIF** : correction de bug rétrocompatible.
En `0.y.z`, tout peut changer à tout moment (phase de développement initial).
:::

```bash
git tag -a v1.4.0 -m "Version 1.4.0 : export CSV"   # tag annoté (auteur, date, message)
git push origin v1.4.0                               # les tags ne sont pas poussés par défaut
git describe --tags                                  # v1.4.0-3-g9c8d7e6 : 3 commits après v1.4.0
git switch --detach v1.2.0                           # revenir exactement à une version
```

::: quiz Quiz 3.2 — SemVer
Ta bibliothèque est en version 1.7.3. Tu ajoutes un paramètre optionnel à une fonction (les appels existants fonctionnent toujours) et tu corriges un bug. Nouvelle version ?
- [ ] 1.7.4
- [x] 1.8.0
- [ ] 2.0.0
> Un ajout rétrocompatible incrémente le MINEUR et remet le CORRECTIF à 0 : 1.8.0 (la correction de bug est incluse). 2.0.0 serait réservé à un changement qui casse les appels existants.
:::

## 5. Ce qui ne doit pas entrer dans le dépôt

| Type de fichier | Pourquoi | Solution |
|---|---|---|
| **Secrets** (`.env`, clés d'API, mots de passe) | fuite définitive, même supprimés ensuite (ils restent dans l'historique) | `.gitignore`, variables d'environnement, gestionnaire de secrets |
| Données volumineuses (CSV de 2 Go, Parquet) | dépôt énorme, lent à cloner | stockage objet, **DVC**, Git LFS |
| Environnements (`.venv/`, `node_modules/`) | régénérables | `requirements.txt`, `pyproject.toml`, lockfile |
| Fichiers générés (`__pycache__/`, builds, modèles entraînés) | bruit, conflits | `.gitignore`, registre de modèles |
| Sorties de notebooks | diffs illisibles, données sensibles affichées | nettoyer les sorties (`nbstripout`) |

::: warn Un secret poussé est compromis
Supprimer le fichier dans un nouveau commit ne suffit pas : il reste dans l'historique et a pu être copié (des robots scannent GitHub en permanence). **Révoque immédiatement la clé**, puis nettoie l'historique (`git filter-repo`) si nécessaire. GitHub propose une protection (*push protection*) qui bloque les secrets reconnus.
:::

## 6. Automatiser la qualité : hooks et pre-commit

Les **hooks** sont des scripts que Git exécute à certains moments (`pre-commit`, `commit-msg`, `pre-push`). Le framework **pre-commit** les rend partageables via un fichier versionné :

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: check-added-large-files     # refuse les fichiers > 500 Ko
      - id: detect-private-key          # refuse les clés privées
      - id: end-of-file-fixer
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.9
    hooks:
      - id: ruff                        # linter Python
      - id: ruff-format                 # formatage
```

```bash
pip install pre-commit
pre-commit install          # installe le hook dans .git/hooks
pre-commit run --all-files  # vérifier tout le dépôt une première fois
```

Les mêmes vérifications sont relancées dans la **CI** (le hook local peut être contourné avec `--no-verify`).

## 7. Plusieurs projets : monorepo ou multirepo ?

| | Monorepo (un dépôt pour tout) | Multirepo (un dépôt par projet) |
|---|---|---|
| Changements transverses | un seul commit, atomique | plusieurs pull requests coordonnées |
| Outillage | doit gérer la taille (CI sélective) | simple par dépôt |
| Droits d'accès | plus grossiers | fins |
| Exemples | Google, Meta (outils internes) | la plupart des projets open source |

::: exo Exercice 1 — Messages de commit
Réécris ces messages au format Conventional Commits et indique l'effet sur la version 3.2.1 si chacun était publié seul :
(a) « j'ai corrigé le bug du séparateur décimal dans l'import » ; (b) « nouvelle option --verbose » ; (c) « la fonction load() renvoie maintenant un DataFrame au lieu d'une liste » ; (d) « mise à jour du README ».
?? Voir la solution
(a) `fix(import): gère la virgule comme séparateur décimal` → **3.2.2**.
(b) `feat(cli): ajoute l'option --verbose` → **3.3.0**.
(c) `feat(io)!: load() renvoie un DataFrame` avec `BREAKING CHANGE: load() ne renvoie plus une liste` → **4.0.0** (les appelants existants cassent).
(d) `docs: met à jour le README` → aucune nouvelle version nécessaire.
:::

::: exo Exercice 2 — Mettre en place un dépôt d'équipe
Ton groupe de 4 démarre un projet de prédiction de churn (code Python, notebooks, données clients de 3 Go). Liste les décisions et fichiers à mettre en place le premier jour.
?? Voir la solution
1. **Workflow** : GitHub Flow ; protection de `main` (pull request obligatoire, 1 relecture, CI verte).
2. **`.gitignore`** : `.venv/`, `__pycache__/`, `.env`, `data/`, `models/`, `.ipynb_checkpoints/`.
3. **Données** : jamais dans Git ; stockage partagé (bucket, disque de l'école) versionné avec **DVC** ; données personnelles → accès restreint (RGPD).
4. **Reproductibilité** : `pyproject.toml` ou `requirements.txt` avec versions, `README` d'installation.
5. **Qualité** : `pre-commit` (ruff, détection de clés et de gros fichiers, `nbstripout`), mêmes contrôles en CI.
6. **Conventions** : Conventional Commits, noms de branches `feature/…`, tags SemVer pour les livrables (`v0.1.0` pour la première soutenance).
:::

::: culture Culture & histoire
- **2010** — Vincent Driessen publie *A successful Git branching model* : **Git Flow** se répand ; en 2020, il ajoute une note recommandant un workflow plus simple pour les applications livrées en continu.
- **2011** — Scott Chacon (GitHub) décrit le **GitHub Flow**.
- **2013** — Tom Preston-Werner (cofondateur de GitHub) formalise **Semantic Versioning 2.0.0**.
- **2017–2019** — la spécification **Conventional Commits** naît des conventions de messages du projet Angular.
- [Conventional Commits (FR)](https://www.conventionalcommits.org/fr/v1.0.0/)
- [Semantic Versioning (FR)](https://semver.org/lang/fr/)
- [pre-commit](https://pre-commit.com/)
- [Trunk Based Development](https://trunkbaseddevelopment.com/)
:::

## Synthèse

::: note À retenir
- GitHub Flow (main toujours déployable + branches courtes + PR) suffit à la plupart des projets.
- Git Flow : `develop` + `release` + `hotfix`, pour des versions maintenues en parallèle.
- Trunk-based : intégration quotidienne + feature flags + CI solide.
- **Conventional Commits** (`feat`, `fix`, `!`) → **SemVer** automatique (MAJEUR.MINEUR.CORRECTIF) et tags annotés.
- Jamais de secrets ni de grosses données dans Git ; un secret poussé se **révoque**.
- `pre-commit` en local, mêmes contrôles en CI.
:::
