#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Validation du site (CI) — aucune dépendance externe.
Vérifie, pour empêcher les régressions :
  1. Liens internes des pages .html (href/src) -> le fichier/dossier cible existe.
  2. Liens de pages .html cités dans assets/nav.js et assets/portal.js.
  3. Manifeste matieres/cours.js : chaque module `file` existe.
  4. Fichiers JSON bien formés (manifest.webmanifest, assets/search-index.json).

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

# Rapport
print("Validation du site :")
print(f"  - liens HTML verifies    : {checked['html_links']}")
print(f"  - liens JS verifies      : {checked['js_links']}")
print(f"  - modules de cours (.md) : {checked['md_files']}")
print(f"  - fichiers JSON          : {checked['json']}")

if errors:
    print(f"\n[ECHEC] {len(errors)} probleme(s) detecte(s) :")
    for e in errors:
        print("   -", e)
    sys.exit(1)

print("\n[OK] Aucune regression detectee.")
