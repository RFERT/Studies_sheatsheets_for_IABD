#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Validation du site (CI) — aucune dépendance externe.
Vérifie, pour empêcher les régressions :
  1. Liens internes des pages .html (href/src) -> le fichier/dossier cible existe.
  2. Liens de pages .html cités dans assets/nav.js et assets/portal.js.
  3. Manifeste matieres/cours.js : chaque module `file` existe.
  4. Fichiers JSON bien formés (manifest.webmanifest, assets/search-index.json).
  5. Portail Pharmacie (matieres/pharmacie/) : une antisèche md/aide-<id>.md et une page par module
     de assets/data.js, pages citées dans nav.js/portal.js, manifest JSON, chaque fichier présent dans
     CORE de son sw.js (et inversement), et aucune dépendance au portail IABD (autonomie).

Sort en code 1 si au moins une erreur est trouvée.
Usage :  python ci/validate_site.py
"""
import json, re, sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
errors = []
checked = {"html_links": 0, "js_links": 0, "md_files": 0, "json": 0}

SKIP = re.compile(r"^(?:[a-z][a-z0-9+.\-]*:|//|#)", re.I)  # http:, mailto:, data:, //, #ancre


def is_internal(url):
    url = url.strip()
    if not url or SKIP.match(url):
        return False
    return True


def target_path(base_dir, url):
    """Résout une URL interne en chemin de fichier, sans query ni fragment."""
    clean = unquote(url.split("#", 1)[0].split("?", 1)[0]).strip()
    if not clean:
        return None
    return (base_dir / clean).resolve()


def check_target(src_file, url, label):
    base = src_file.parent
    p = target_path(base, url)
    if p is None:
        return  # lien vide après retrait de #/?
    if not p.exists():
        errors.append(f"{label} : {src_file.relative_to(ROOT).as_posix()} -> lien mort « {url} »")


# 1) Liens internes dans toutes les pages .html
ATTR = re.compile(r"""(?:href|src)\s*=\s*["']([^"']*)["']""", re.I)
for htmlf in ROOT.rglob("*.html"):
    if ".git" in htmlf.parts:
        continue
    text = htmlf.read_text(encoding="utf-8", errors="replace")
    for url in ATTR.findall(text):
        if is_internal(url):
            checked["html_links"] += 1
            check_target(htmlf, url, "Lien HTML")

# 2) Pages .html citées comme littéraux dans nav.js / portal.js (résolues depuis la racine)
LIT = re.compile(r"""["']([\w./\-]+\.html)["']""")
for jsname in ("assets/nav.js", "assets/portal.js"):
    jsf = ROOT / jsname
    if not jsf.exists():
        continue
    text = jsf.read_text(encoding="utf-8", errors="replace")
    for rel in sorted(set(LIT.findall(text))):
        checked["js_links"] += 1
        if not (ROOT / rel).exists():
            errors.append(f"Lien JS : {jsname} -> page absente « {rel} »")

# 3) Manifeste des cours : chaque `file` existe
cours = ROOT / "matieres" / "cours.js"
if cours.exists():
    text = cours.read_text(encoding="utf-8", errors="replace")
    for rel in re.findall(r"""\bfile\s*:\s*["']([^"']+)["']""", text):
        checked["md_files"] += 1
        if not (ROOT / rel).exists():
            errors.append(f"Manifeste cours.js : module introuvable « {rel} »")
    # Antisèches : chaque `aide` (fichier Markdown) doit exister
    for rel in re.findall(r"""\baide\s*:\s*["']([^"']+)["']""", text):
        checked["md_files"] += 1
        if not (ROOT / rel).exists():
            errors.append(f"Manifeste cours.js : antisèche introuvable « {rel} »")
else:
    errors.append("Manifeste introuvable : matieres/cours.js")

# 4) JSON bien formés
for rel in ("manifest.webmanifest", "assets/search-index.json"):
    f = ROOT / rel
    if not f.exists():
        errors.append(f"Fichier JSON manquant : {rel}")
        continue
    try:
        json.loads(f.read_text(encoding="utf-8"))
        checked["json"] += 1
    except Exception as e:
        errors.append(f"JSON invalide ({rel}) : {e}")

# 5) Portail Pharmacie (matieres/pharmacie/) : autonome, avec son propre service worker.
#    Les liens des pages .html (étape 1) sont déjà couverts ; on vérifie ici le reste.
PH = ROOT / "matieres" / "pharmacie"
PH_REL = PH.relative_to(ROOT).as_posix()
ph_checked = {"aide": 0, "pages_js": 0, "precache": 0, "autonomie": 0}


def ph_text(f):
    return f.read_text(encoding="utf-8", errors="replace")


if PH.is_dir():
    # 5a) Une antisèche md/aide-<id>.md par module déclaré dans assets/data.js
    data_js = PH / "assets" / "data.js"
    ph_ids = re.findall(r"""\bid\s*:\s*["']([a-z0-9_\-]+)["']""", ph_text(data_js)) if data_js.exists() else []
    if not ph_ids:
        errors.append(f"Pharmacie : aucun module trouvé dans {PH_REL}/assets/data.js")
    for mid in ph_ids:
        ph_checked["aide"] += 1
        if not (PH / "md" / f"aide-{mid}.md").exists():
            errors.append(f"Pharmacie : antisèche manquante {PH_REL}/md/aide-{mid}.md")
        if not (PH / "modules" / f"{mid}.html").exists():
            errors.append(f"Pharmacie : page de module manquante {PH_REL}/modules/{mid}.html")

    # 5b) Pages .html citées comme littéraux dans nav.js / portal.js (relatives à la racine du portail)
    for jsname in ("assets/nav.js", "assets/portal.js"):
        jsf = PH / jsname
        if not jsf.exists():
            errors.append(f"Pharmacie : script manquant {PH_REL}/{jsname}")
            continue
        for rel in sorted(set(LIT.findall(ph_text(jsf)))):
            ph_checked["pages_js"] += 1
            if not (PH / rel).exists():
                errors.append(f"Lien JS : {PH_REL}/{jsname} -> page absente « {rel} »")

    # 5c) JSON bien formé
    wm = PH / "manifest.webmanifest"
    if wm.exists():
        try:
            json.loads(wm.read_text(encoding="utf-8"))
            checked["json"] += 1
        except Exception as e:
            errors.append(f"JSON invalide ({PH_REL}/manifest.webmanifest) : {e}")
    else:
        errors.append(f"Fichier JSON manquant : {PH_REL}/manifest.webmanifest")

    # 5d) Chaque fichier du portail doit figurer dans CORE de sw.js (sinon absent hors-ligne),
    #     et chaque entrée de CORE doit exister. md/ : seules les entrées listées sont vérifiées.
    sw = PH / "sw.js"
    if not sw.exists():
        errors.append(f"Pharmacie : service worker manquant {PH_REL}/sw.js")
    else:
        sw_text = ph_text(sw)
        core = set(re.findall(r"""["'](\./[^"']*)["'](?!\s*\+)""", sw_text))
        mods = re.search(r"""\bMODULES\s*=\s*\[([^\]]*)\]""", sw_text)
        mod_ids = re.findall(r"""["']([^"']+)["']""", mods.group(1)) if mods else []
        # Motif « "./dossier/" + m + ".ext" » appliqué à chaque entrée de MODULES
        for pre, suf in re.findall(r"""["'](\./[^"']*)["']\s*\+\s*\w+\s*\+\s*["']([^"']*)["']""", sw_text):
            for val in mod_ids:
                core.add(pre + val + suf)
        core_norm = {c[2:] if c != "./" else "index.html" for c in core}
        core_norm = {c if c else "index.html" for c in core_norm}
        for c in sorted(core_norm):
            ph_checked["precache"] += 1
            if not (PH / c).exists():
                errors.append(f"Pharmacie : sw.js CORE référence un fichier absent « {c} »")
        exempt = {"sw.js", "README.md"}
        for f in sorted(PH.rglob("*")):
            if not f.is_file():
                continue
            rel = f.relative_to(PH).as_posix()
            if rel in exempt or rel.startswith("md/") or any(p.startswith(".") for p in f.relative_to(PH).parts):
                continue
            if rel not in core_norm:
                errors.append(f"Pharmacie : « {rel} » absent de CORE dans {PH_REL}/sw.js (introuvable hors-ligne)")

    # 5e) Autonomie : aucun renvoi vers le portail IABD (fichiers de code et pages)
    # Le sélecteur de portail peut renvoyer vers l'accueil IABD (simple lien, pas une dépendance)
    AUTONOMY = re.compile(r"""\.\./\.\./(?!index\.html)|matieres/cours\.js|["'](?:esgi|cmd|pds|rust)[-_][\w\-]+["']""")
    for f in sorted(PH.rglob("*")):
        if f.is_file() and f.suffix in (".html", ".js", ".css", ".webmanifest"):
            for m in AUTONOMY.finditer(ph_text(f)):
                ph_checked["autonomie"] += 1
                errors.append(f"Pharmacie : {f.relative_to(ROOT).as_posix()} dépend du portail IABD (« {m.group(0)} »)")
else:
    errors.append(f"Dossier introuvable : {PH_REL}")

# Rapport
print("Validation du site :")
print(f"  - liens HTML verifies    : {checked['html_links']}")
print(f"  - liens JS verifies      : {checked['js_links']}")
print(f"  - modules de cours (.md) : {checked['md_files']}")
print(f"  - fichiers JSON          : {checked['json']}")
print(f"  - pharmacie : {ph_checked['aide']} modules/antiseches, {ph_checked['pages_js']} pages JS, "
      f"{ph_checked['precache']} entrees sw.js CORE")

if errors:
    print(f"\n[ECHEC] {len(errors)} probleme(s) detecte(s) :")
    for e in errors:
        print("   -", e)
    sys.exit(1)

print("\n[OK] Aucune regression detectee.")
