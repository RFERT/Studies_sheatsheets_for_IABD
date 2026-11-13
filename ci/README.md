# ⚙️ Intégration continue (CI)

Workflow : [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Fidèle au principe **« zéro build »** —
aucune compilation : on **valide** le site, on **régénère l'index de recherche**, puis on **publie** les
fichiers statiques tels quels.

## Ce qui tourne

| Déclencheur | Étapes |
|-------------|--------|
| **Pull request** vers `main` | Validation uniquement (ne déploie pas) |
| **Push** sur `main` (ou *Run workflow*) | Validation → régénère l'index → le committe si besoin → **déploie sur GitHub Pages** |

### 1. Validation — [`ci/validate_site.py`](validate_site.py)
Sans dépendance (Python seul). Échoue (rouge) si :
- un **lien interne** d'une page `.html` pointe vers un fichier/dossier inexistant ;
- une page `.html` citée dans `assets/nav.js` / `assets/portal.js` n'existe pas ;
- un module `file` du manifeste `matieres/cours.js` est introuvable ;
- un JSON (`manifest.webmanifest`, `assets/search-index.json`) est mal formé ;
- **portail Pharmacie** (`matieres/pharmacie/`) : antisèche `md/aide-<id>.md` ou page `modules/<id>.html`
  manquante pour un module de `assets/data.js`, page citée dans son `nav.js`/`portal.js` absente,
  `manifest.webmanifest` invalide, fichier du portail **absent de `CORE` dans son `sw.js`** (ou entrée de
  `CORE` qui n'existe pas), ou **dépendance au portail IABD** (`../../`, `matieres/cours.js`, clés `esgi-*`/`cmd-*`/…).

Lancer en local avant de pousser :
```bash
python ci/validate_site.py
```

### 1 bis. Tests de rendu des cours — [`ci/check_courses.py`](check_courses.py)
Sans dépendance. Pour chaque `.md` référencé dans `matieres/cours.js`, vérifie qu'il est
**rendable** par le moteur : front-matter avec `title`, blocs `:::` équilibrés (chaque
`::: type` a son `:::` de fermeture **seul en début de ligne**), fences ``` en nombre pair,
quiz avec une bonne réponse `- [x]`, exercices avec séparateur `??`. Évite qu'un bloc mal
fermé « avale » le reste du cours.
```bash
python ci/check_courses.py
```

### 2. Index de recherche
`assets/build-search-index.py` est relancé automatiquement ; si `search-index.js/.json`
changent, la CI les **committe** (`[skip ci]`). Plus besoin d'y penser à la main.

### 3. Déploiement GitHub Pages
Les fichiers statiques sont publiés via `actions/deploy-pages`.

## 🔧 Réglage unique à faire une fois (sinon le déploiement échoue)
Sur GitHub : **Settings → Pages → Build and deployment → Source = GitHub Actions**.
(Facultatif : **Settings → Actions → General → Workflow permissions = Read and write**
si le commit de l'index est refusé.)

Après ça, chaque push sur `main` met le site en ligne automatiquement. 💙
