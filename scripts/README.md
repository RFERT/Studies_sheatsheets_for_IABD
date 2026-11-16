# Scripts — collaboration à deux sessions (worktree Git)

Ce dépôt est travaillé par **deux sessions d'agent en parallèle**. Pour éviter qu'elles
se marchent dessus (même dossier, même index Git, conflits de commit), chacune a **son
propre dossier de travail et sa propre branche**, grâce à un **worktree Git**.

| Session | Rôle | Dossier | Branche |
|---|---|---|---|
| **SITE** | Architecture, fonctionnalités, design, PWA, CI | `Studies_sheatsheets_for_IABD/` (principal) | `main` |
| **PROF** (Professeur IABD) | Rédaction/édition des cours (`matieres/**`) | `Studies_sheatsheets_for_IABD-cours/` (worktree) | `Cours` |

> Un **worktree** est un deuxième dossier de travail qui partage le **même `.git`**.
> Les deux branches voient donc instantanément les commits l'une de l'autre, sans passer
> par le réseau. On intègre les cours dans `main` par une simple fusion locale.

## Mise en place (une fois)

Depuis le dossier principal :

```powershell
powershell -File scripts\worktree-prof.ps1
```

Cela crée la branche `Cours` et le dossier voisin `..\Studies_sheatsheets_for_IABD-cours`.
Ensuite, **ouvrir la session du PROF avec ce dossier comme espace de travail** (c'est le
seul réglage à faire côté utilisateur — voir aussi `parametrage.html`).

## Au quotidien

### Côté PROF (dans le dossier `...-cours`, branche `Cours`)
1. Récupérer les dernières évolutions du site avant de rédiger :
   ```powershell
   powershell -File scripts\cours-sync.ps1
   ```
2. Rédiger les cours (`matieres/**/md/*.md` + `matieres/cours.js`), committer normalement.

### Côté SITE (dans le dossier principal, branche `main`)
Pour rapatrier les cours écrits par le prof dans `main`, les valider et les pousser :
```powershell
powershell -File scripts\integrer-cours.ps1
```
(ajouter `-NoPush` pour ne pas pousser tout de suite).

> 🤖 **Intégration auto (préférence de l'utilisateur)** : à **chaque prompt**, la session SITE
> **intègre automatiquement** le travail du prof au début (vérifier `git log --oneline main..Cours` ;
> s'il y a du nouveau, lancer `scripts\integrer-cours.ps1 -NoPush`) et, **à la fin**, lance
> `scripts\cours-sync.ps1` dans le worktree `...-cours` pour y redescendre `main`. La session PROF
> lance `cours-sync.ps1` au début de chaque prompt et committe ses cours à la fin. Pense à **bumper `CACHE` dans `sw.js`** si le merge
> a modifié des fichiers CORE (`portal.js`, `nav.js`, etc.) sans que le prof l'ait fait.

### Si une 3ᵉ session modifie `main` en direct (worktree `...-site`, branche `Site`)
Quand une autre session travaille directement dans le dossier principal, la session SITE
travaille dans son propre worktree pour ne pas lui marcher dessus :
```powershell
git worktree add -b Site ..\Studies_sheatsheets_for_IABD-site main   # une fois
```
Elle committe sur `Site` (et pousse `origin/Site` en sauvegarde), puis fusionne dans `main`
**depuis le dossier principal** une fois que celui-ci est propre :
`git merge --no-ff Site` → résoudre (index de recherche : régénérer avec
`py assets\build-search-index.py` ; `sw.js` : prendre la version la plus haute **+1**) →
valider (`ci\validate_site.py`, `ci\check_courses.py`) → pousser. Enfin réaligner les
worktrees : `git merge --ff-only main` dans `...-site` et `...-cours`.
On ne committe jamais le travail d'une autre session sans l'accord de l'utilisateur.

## Règles pour ne pas se gêner
- Le **PROF ne touche pas** au périmètre site (`assets/`, `sw.js`, `index.html`, pages HTML…)
  sauf nécessité réelle, qu'il signale.
- La **SITE ne réécrit pas** les cours (`matieres/**/md/*.md`).
- Le fichier `matieres/cours.js` (manifeste) peut être touché par les deux : garder des
  modifications **ciblées** pour limiter les conflits. En cas de conflit, c'est quasi
  toujours une simple concaténation d'entrées.
- Les worktrees sont **locaux** (non versionnés) : rien de ceci ne « casse » pour quelqu'un
  qui clone le dépôt ; les scripts recréent le worktree au besoin.
