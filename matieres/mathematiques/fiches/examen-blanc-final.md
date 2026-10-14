# 📝 Examen blanc final — Partiel type (toutes notions)

> Modules 0 à 9 mélangés · Durée conseillée : 2 h · Total /80
> Partie A (QCM) /20 · Partie B (exercices) /40 · Partie C (problème Data) /20

*Fais d'abord sans aide, puis corrige-toi. Les solutions sont en bas.*

---

## Partie A — QCM express (/20, 1 pt chacun)

**A1. [M0]** Négation de `∀x ∃y P(x,y)` ?
**A2. [M1]** Une relation R+S+T est une relation… ?
**A3. [M1]** Dans (ℕ,|), inf{12,18} (meet) ?
**A4. [M2]** Deux vecteurs non nuls avec u·v=0 sont… ?
**A5. [M2]** En PCA, les premières composantes = directions de… ?
**A6. [M2]** Av=λv (v≠0) : v est un… ?
**A7. [M3]** A,B indép., P(A)=0,3, P(B)=0,5 → P(A∩B) ?
**A8. [M3]** Loi du « nb de succès sur n essais » ?
**A9. [M3]** Le TCL : la moyenne d'un grand échantillon est ~ ?
**A10. [M4]** p-value=0,02, α=0,05 → ?
**A11. [M4]** Diviser par 2 la largeur d'un IC → n ×? ?
**A12. [M5]** ∇f pointe vers… ?
**A13. [M5]** η trop grand → ?
**A14. [M6]** Plus court chemin pondéré (poids≥0) → algo ?
**A15. [M6]** PageRank = mathématiquement… ?
**A16. [M7]** Choisir 3 parmi 10 (sans rôle) → ?
**A17. [M7]** Complexité de la recherche dichotomique ?
**A18. [M8]** Entropie maximale quand les issues sont… ?
**A19. [M8]** Fonction de perte standard en classification ?
**A20. [M9]** Un filtre de Bloom ne commet jamais… ?

### Réponses Partie A
A1 : `∃x ∀y ¬P(x,y)` · A2 : équivalence · A3 : 6 (pgcd) · A4 : orthogonaux · A5 : plus grande variance · A6 : vecteur propre · A7 : 0,15 · A8 : binomiale · A9 : normale · A10 : rejeter H₀ · A11 : 4 · A12 : plus forte augmentation · A13 : oscillations/divergence · A14 : Dijkstra · A15 : vecteur propre dominant de M · A16 : C(10,3)=120 · A17 : O(log n) · A18 : équiprobables · A19 : entropie croisée · A20 : faux négatif

---

## Partie B — Exercices rédigés (/40, 8 pts chacun)

**B1. [M0-1]** Sur ℤ, `a∼b ⇔ 5|(a−b)`. (a) Montre que c'est une équivalence. (b) Combien de classes ? (c) Lien Big Data ?

**B2. [M2]** `A = [[3,1],[0,2]]`. (a) det(A) ? (b) Inversible ? (c) Valeurs propres ? (d) A·(2,1) ?

**B3. [M3]** Anti-spam : 40 % spam ; « gratuit » dans 60 % des spams, 5 % des légitimes. Mail avec « gratuit » : (a) P(spam) ? (b) Méthode ?

**B4. [M5]** `J(θ)=(θ−4)²`, η=0,25, θ₀=0. (a) ∇J ? (b) 2 itérations ? (c) Convergence ?

**B5. [M7-8]** (a) Entropie de 8 symboles équiprobables ? (b) Bits/symbole ? (c) Double boucle sur n : complexité ? Viable pour n=10⁹ ?

### Solutions Partie B
- **B1 :** (a) Réflexive (5|0), symétrique, transitive (somme de multiples de 5). (b) **5 classes** [0]…[4] = ℤ/5ℤ. (c) **Sharding** par `h(clé) mod 5`.
- **B2 :** (a) det=6. (b) Oui (det≠0). (c) Triangulaire → λ=3 et 2. (d) (3·2+1·1 ; 0·2+2·1)=(7,2).
- **B3 :** (a) P(G)=0,6·0,4+0,05·0,6=0,27 ; P(S|G)=0,24/0,27≈**0,889**. (b) **Bayes** (Naive Bayes).
- **B4 :** (a) ∇J=2(θ−4). (b) θ₁=0+2=2 ; θ₂=2+1=3. (c) → **4** (minimum, convexe → global).
- **B5 :** (a) H=log₂8=**3 bits**. (b) 3 bits/symbole. (c) **O(n²)** → 10¹⁸ pour n=10⁹ = **infaisable**.

---

## Partie C — Problème transversal Data (/20)

*Contexte : Data Engineer, 1 milliard de documents à dédupliquer/analyser.*

- **C1. [M9]** /4 — Éviter des lectures disque inutiles (doc déjà vu ?) : structure + type d'erreur acceptée ?
- **C2. [M9]** /4 — Similarité de documents (ensembles de mots) : indice ? Estimation à grande échelle ?
- **C3. [M9]** /3 — Compter les utilisateurs uniques sur 1 Md d'événements, peu de mémoire ?
- **C4. [M2-8]** /5 — Docs vectorisés (TF-IDF) : mesure de similarité de direction ? Perte du classifieur ?
- **C5. [M1-9]** /4 — Le Shuffle de MapReduce regroupe par clé : quelle notion maths ?

### Solutions Partie C
- **C1 :** **Filtre de Bloom** — « absent » certain (évite le disque), accepte les **faux positifs** (jamais de faux négatif).
- **C2 :** **Jaccard** `|A∩B|/|A∪B|` ; estimation par **MinHash** (+ **LSH** pour ne comparer que les candidats proches).
- **C3 :** **HyperLogLog** (cardinalité approchée, ~Ko de mémoire).
- **C4 :** **Similarité cosinus** ; perte = **entropie croisée**.
- **C5 :** Regrouper par clé = **relation d'équivalence / partition** (Module 1). Reduce agrège chaque classe.

*Ce problème seul mobilise les Modules 1, 2, 8 et 9.*

---

## Barème /80
| Score | Niveau | Conseil |
|---|---|---|
| ≥ 68 | 🏆 Excellent | Révise juste les fiches |
| 56–67 | ✅ Solide | Cible 2-3 modules faibles |
| 40–55 | 🟡 À consolider | Reprends les modules ratés + quiz |
| < 40 | 🔴 Rattrapage | Refais M0-1-2-3 dans l'ordre |

**Astuce :** note les [Modules] des questions ratées → ce sont tes priorités de révision. Répétition espacée (J+1, J+3, J+7). Bonne chance ! 💙
