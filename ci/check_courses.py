#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests de rendu des cours Markdown (CI) — aucune dépendance externe.
Pour chaque fichier .md référencé dans matieres/cours.js (`file:` et `aide:`),
vérifie que le cours est « rendable » par le moteur (assets/markdown.js) :

  1. Front-matter présent (--- ... ---) avec un `title:` non vide.
  2. Blocs conteneurs ::: équilibrés (chaque « ::: type » a son « ::: » de fermeture).
  3. Fences de code ``` en nombre pair (pas de bloc de code non fermé).
  4. Chaque bloc « ::: quiz » a au moins une bonne réponse « - [x] » et ≥ 2 options.
  5. Chaque bloc « ::: exo » contient le séparateur « ?? » (énoncé / solution).

Sort en code 1 si au moins une erreur est trouvée.
Usage :  python ci/check_courses.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []
checked = 0


def md_paths_from_manifest():
    cours = ROOT / "matieres" / "cours.js"
    if not cours.exists():
        errors.append("Manifeste introuvable : matieres/cours.js")
        return []
    txt = cours.read_text(encoding="utf-8", errors="replace")
    rels = re.findall(r"""\b(?:file|aide)\s*:\s*["']([^"']+\.md)["']""", txt)
    # dédoublonne en gardant l'ordre
    seen, out = set(), []
    for r in rels:
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out


def check_front_matter(rel, text, errs):
    m = re.match(r"^\ufeff?---\r?\n(.*?)\r?\n---\r?\n", text, re.S)
    if not m:
        errs.append(f"{rel} : front-matter manquant (--- ... ---)")
        return
    block = m.group(1)
    tm = re.search(r"(?mi)^\s*title\s*:\s*(.+?)\s*$", block)
    if not tm or not tm.group(1).strip():
        errs.append(f"{rel} : champ `title` manquant ou vide dans le front-matter")


def check_blocks(rel, text, errs):
    lines = text.replace("\r\n", "\n").split("\n")
    depth = 0
    fences = 0
    quiz_buf = None
    quizzes = []
    exo_buf = None
    exos = []
    for ln in lines:
        if re.match(r"^```", ln) or re.match(r"^~~~", ln):
            fences += 1
            # à l'intérieur d'un quiz/exo on continue à collecter
            if quiz_buf is not None:
                quiz_buf.append(ln)
            if exo_buf is not None:
                exo_buf.append(ln)
            continue
        open_m = re.match(r"^:::\s*([A-Za-z]+)\s*(.*)$", ln)
        close_m = re.match(r"^:::\s*$", ln)
        if open_m:
            depth += 1
            kind = open_m.group(1).lower()
            if kind == "quiz":
                quiz_buf = []
            elif kind == "exo":
                exo_buf = []
            continue
        if close_m:
            depth -= 1
            if quiz_buf is not None:
                quizzes.append(quiz_buf)
                quiz_buf = None
            if exo_buf is not None:
                exos.append(exo_buf)
                exo_buf = None
            continue
        if quiz_buf is not None:
            quiz_buf.append(ln)
        if exo_buf is not None:
            exo_buf.append(ln)

    if depth != 0:
        errs.append(f"{rel} : bloc ::: non équilibré (ouvertures/fermetures ::: différentes)")
    if fences % 2 != 0:
        errs.append(f"{rel} : bloc de code ``` non fermé (nombre impair de fences)")

    for q in quizzes:
        opts = [l for l in q if re.match(r"^\s*-\s*\[[ xX]\]", l)]
        good = [l for l in q if re.match(r"^\s*-\s*\[[xX]\]", l)]
        if len(opts) < 2:
            errs.append(f"{rel} : un quiz a moins de 2 options")
        if len(good) < 1:
            errs.append(f"{rel} : un quiz n'a pas de bonne réponse « - [x] »")

    for ex in exos:
        if not any(l.strip().startswith("??") for l in ex):
            errs.append(f"{rel} : un exercice « ::: exo » n'a pas de séparateur « ?? » (énoncé / solution)")


def main():
    global checked
    for rel in md_paths_from_manifest():
        p = ROOT / rel
        if not p.exists():
            errors.append(f"{rel} : fichier introuvable (référencé dans cours.js)")
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        check_front_matter(rel, text, errors)
        check_blocks(rel, text, errors)
        checked += 1

    print("Tests de rendu des cours Markdown :")
    print(f"  - fichiers .md verifies : {checked}")
    if errors:
        print(f"\n[ECHEC] {len(errors)} probleme(s) :")
        for e in errors:
            print("   -", e)
        sys.exit(1)
    print("\n[OK] Tous les cours Markdown sont rendables.")


if __name__ == "__main__":
    main()
