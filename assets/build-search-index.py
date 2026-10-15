#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère assets/search-index.json à partir du contenu du site.
À relancer après avoir ajouté/modifié des cours :  python assets/build-search-index.py
Parse les modules de maths (sections ancrées), la révision Rust, les fiches,
et ajoute les entrées de matières + pages. Aucune dépendance externe.
"""
import json, re, html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def clean(t):
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t).strip()
    t = re.sub(r"^\d+(\.\d+)*[\.\)]\s*", "", t)   # retire "3. " / "3.1 "
    t = re.sub(r"\s+", " ", t)
    return t.strip(" ⭐–—-").strip()

def rel(p):
    return p.relative_to(ROOT).as_posix()

# Matières (miroir de portal.js, pour que la recherche trouve les matières)
SUBJECTS = {
    "math": {"name": "Mathématiques", "emoji": "∑",  "color": "#6c8cff"},
    "rust": {"name": "Rust",          "emoji": "🦀", "color": "#f74c00"},
    "python": {"name": "Python & Data Science", "emoji": "🐍", "color": "#3b82f6"},
    "portal": {"name": "Portail",     "emoji": "🎓", "color": "#27e0b0"},
}

entries = []
def add(subj, kind, title, url, keywords=""):
    if not title:
        return
    entries.append({
        "s": SUBJECTS[subj]["name"], "emoji": SUBJECTS[subj]["emoji"],
        "color": SUBJECTS[subj]["color"], "type": kind,
        "t": title, "u": url, "k": keywords
    })

# ---- Modules de maths : titre de page + sections ancrées ----
mod_dir = ROOT / "matieres" / "mathematiques" / "modules"
for f in sorted(mod_dir.glob("*.html")):
    txt = f.read_text(encoding="utf-8")
    url = rel(f)
    m = re.search(r"<h1[^>]*>(.*?)</h1>", txt, re.S)
    page_title = clean(m.group(1)) if m else f.stem
    sub = re.search(r'<p class="subtitle"[^>]*>(.*?)</p>', txt, re.S)
    add("math", "module", page_title, url, clean(sub.group(1)) if sub else "")
    for sm in re.finditer(r'<section[^>]*id="([^"]+)"[^>]*>\s*<h2[^>]*>(.*?)</h2>', txt, re.S):
        anchor, h2 = sm.group(1), clean(sm.group(2))
        add("math", "section", h2, f"{url}#{anchor}", page_title)
    # Encart Culture & histoire (noms historiques indexés)
    cm = re.search(r'<section class="culture"[^>]*id="culture".*?</section>', txt, re.S)
    if cm:
        names = [clean(x) for x in re.findall(r"<li><b>(.*?)</b>", cm.group(0))]
        add("math", "culture", "Culture & histoire — " + page_title,
            f"{url}#culture", page_title + " histoire " + " ".join(names))

# ---- Modules de Python : même structure ----
py_dir = ROOT / "matieres" / "python" / "modules"
for f in sorted(py_dir.glob("*.html")):
    txt = f.read_text(encoding="utf-8")
    url = rel(f)
    m = re.search(r"<h1[^>]*>(.*?)</h1>", txt, re.S)
    page_title = clean(m.group(1)) if m else f.stem
    sub = re.search(r'<p class="subtitle"[^>]*>(.*?)</p>', txt, re.S)
    add("python", "module", page_title, url, clean(sub.group(1)) if sub else "")
    for sm in re.finditer(r'<section[^>]*id="([^"]+)"[^>]*>\s*<h2[^>]*>(.*?)</h2>', txt, re.S):
        anchor, h2 = sm.group(1), clean(sm.group(2))
        add("python", "section", h2, f"{url}#{anchor}", page_title)
    cm = re.search(r'<section class="culture"[^>]*id="culture".*?</section>', txt, re.S)
    if cm:
        names = [clean(x) for x in re.findall(r"<li><b>(.*?)</b>", cm.group(0))]
        add("python", "culture", "Culture & histoire — " + page_title,
            f"{url}#culture", page_title + " histoire " + " ".join(names))

add("python", "matière", "Python & Data Science",
    "matieres/python/index.html",
    "python numpy pandas data science visualisation matplotlib seaborn scikit-learn machine learning feature engineering")
add("python", "fiche", "Antisèche Python & Data (aide-mémoire)",
    "matieres/python/aide-memoire.html",
    "cheat sheet référence rapide numpy pandas groupby comprehension broadcasting dict liste")

# ---- Fiches Python téléchargeables ----
py_fic = ROOT / "matieres" / "python" / "fiches"
for f in sorted(py_fic.glob("*.md")):
    first = ""
    for line in f.read_text(encoding="utf-8").splitlines():
        if line.startswith("#"):
            first = clean(line.lstrip("# ").replace("🐍", ""))
            break
    add("python", "fiche", first or f.stem, rel(f), "fiche révision téléchargeable python")

# ---- Fiches de révision téléchargeables ----
fic_dir = ROOT / "matieres" / "mathematiques" / "fiches"
for f in sorted(fic_dir.glob("*.md")):
    first = ""
    for line in f.read_text(encoding="utf-8").splitlines():
        if line.startswith("#"):
            first = clean(line.lstrip("# ").replace("📝", ""))
            break
    add("math", "fiche", first or f.stem, rel(f), "fiche révision téléchargeable")

# ---- Rust : cursus + révision express (sections) ----
add("rust", "cours", "Cursus Rust complet", "matieres/rust/rust-cursus.html",
    "ownership borrowing lifetimes traits cargo closures itérateurs concurrence enums pattern matching Result Option")
add("rust", "culture", "Culture & histoire de Rust", "matieres/rust/rust-cursus.html",
    "Graydon Hoare Mozilla Rust Foundation noyau Linux histoire philosophie sécurité mémoire")
add("rust", "fiche", "Antisèche Rust (cheat sheet)", "matieres/rust/cheatsheet-rust.html",
    "cheat sheet référence rapide syntaxe méthodes Vec HashMap Option Result match iterator cargo closures lifetimes traits")
rev = ROOT / "matieres" / "rust" / "revision-express.html"
if rev.exists():
    rtxt = rev.read_text(encoding="utf-8")
    add("rust", "cours", "Rust — Révision express", "matieres/rust/revision-express.html",
        "partiel examen essentiel")
    for hm in re.finditer(r"<h2[^>]*>(.*?)</h2>", rtxt, re.S):
        add("rust", "section", clean(hm.group(1)), "matieres/rust/revision-express.html",
            "Rust révision express")

# ---- Matières & pages du portail ----
add("math", "matière", "Mathématiques pour la Data & l'IA",
    "matieres/mathematiques/index.html",
    "logique relations binaires algèbre linéaire probabilités statistiques optimisation graphes information big data")
add("math", "fiche", "Aide-mémoire maths (formulaire)", "matieres/mathematiques/aide-memoire.html",
    "formulaire antisèche formules Bayes gradient entropie matrice cosinus régression Big-O combinatoire règles")
add("rust", "matière", "Rust", "matieres/rust/rust-cursus.html", "langage système")
add("portal", "page", "Améliorations & feuille de route", "ameliorations.html",
    "roadmap idées compétences pro git docker ci cd mlops")
add("portal", "page", "Ouvrir le site sur mon téléphone (guide mobile)", "guide-mobile.html",
    "mobile téléphone smartphone samsung serveur local github pages hors-ligne installer")
add("portal", "page", "Publier mon site avec GitHub Pages (guide)", "guide-github-pages.html",
    "github pages git publier déployer en ligne hébergement gratuit url site web push commit vs code progression locale localstorage privée chaque utilisateur")

# Dé-duplication (title+url)
seen, uniq = set(), []
for e in entries:
    key = (e["t"].lower(), e["u"])
    if key not in seen:
        seen.add(key); uniq.append(e)

out = ROOT / "assets" / "search-index.json"
out.write_text(json.dumps(uniq, ensure_ascii=False, indent=0), encoding="utf-8")

# Version .js (chargée via <script>) pour fonctionner en file:// sans fetch/CORS
outjs = ROOT / "assets" / "search-index.js"
outjs.write_text(
    "/* Généré par build-search-index.py — ne pas éditer à la main. */\n"
    "window.SEARCH_INDEX = " + json.dumps(uniq, ensure_ascii=False) + ";\n",
    encoding="utf-8")
print(f"{len(uniq)} entrees ecrites dans {rel(out)} et {rel(outjs)}")

