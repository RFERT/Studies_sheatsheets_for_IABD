# 📝 Fiche de révision — Module 10 : Combinatoire avancée

> Modèles de tirage · Permutations · Binôme & Pascal · Étoiles & barres · Inclusion-exclusion · Catalan/Stirling — 🟦 DATA · 🟪 BIG DATA · 🟩 IA

---

## 1. Les 4 modèles de tirage (LE tableau)
Deux questions : **l'ordre compte ?** et **la répétition est-elle permise ?**

| Ordre | Répétition | Formule | Nom |
|---|---|---|---|
| oui | oui | `nᵏ` | k-uplets (listes) |
| oui | non | `A(n,k) = n!/(n−k)!` | arrangements |
| non | non | `C(n,k) = n!/(k!(n−k)!)` | combinaisons |
| non | oui | `C(n+k−1, k)` | multi-ensembles (étoiles & barres) |

Réflexe : dire à voix haute « ordre oui/non, répétition oui/non » avant toute formule.

## 2. Permutations & anagrammes
- Permutation de n objets distincts : `n!` (avec `0! = 1`).
- Objets répétés (tailles n₁…nₘ) : `n! / (n₁!·n₂!···nₘ!)` (coefficient multinomial).
- Ex. MISSISSIPPI → `11!/(1!4!4!2!) = 34 650`.

## 3. Arrangements & combinaisons
- Lien clé : **choisir puis ordonner** → `A(n,k) = C(n,k)·k!`.
- Poker : `C(52,5) = 2 598 960`.

## 4. Binôme, Pascal & identités
- `(x+y)ⁿ = Σ C(n,k) xᵏ yⁿ⁻ᵏ`
- Pascal : `C(n,k) = C(n−1,k−1) + C(n−1,k)` ; symétrie `C(n,k)=C(n,n−k)`.
- `Σ C(n,k) = 2ⁿ` → 🟦 **feature selection exhaustive = 2ⁿ modèles** (explosif).
- Vandermonde : `Σₖ C(m,k)C(n,p−k) = C(m+n,p)`.

## 5. Étoiles & barres (répétition sans ordre)
- Solutions entières `≥ 0` de `x₁+…+xₙ = k` : `C(n+k−1, n−1)`.
- Parts `≥ 1` : poser `yᵢ = xᵢ−1` → `C(k−1, n−1)`.
- Ex. 10 bonbons identiques à 4 enfants : `C(13,3) = 286`.

## 6. Multinôme & surjections
- `(x₁+…+xₘ)ⁿ = Σ [n!/(n₁!···nₘ!)] x₁ⁿ¹···xₘⁿᵐ`.
- Surjections n → k : `Σⱼ (−1)ʲ C(k,j)(k−j)ⁿ = k!·S(n,k)`.
- Ex. 5 tâches sur 3 serveurs, aucun vide : `243 − 96 + 3 = 150`.

## 7. Inclusion-exclusion & dérangements
- Crible : `|A₁∪…∪Aₙ| = Σ|Aᵢ| − Σ|Aᵢ∩Aⱼ| + Σ|Aᵢ∩Aⱼ∩Aₗ| − …`
- Dérangements (sans point fixe) : `Dₙ = n!·Σ (−1)ᵏ/k!`, et `Dₙ/n! → 1/e ≈ 0,368`.
- `D₄ = 9`, `D₅ = 44`.

## 8. Catalan, Stirling, Bell
- Catalan : `Cₙ = C(2n,n)/(n+1)` → `1,1,2,5,14,42,…` (parenthésages, arbres binaires).
- Stirling 2ᵉ espèce `S(n,k)` : partitions en k blocs **anonymes** ; `S(n,k)=k·S(n−1,k)+S(n−1,k−1)`.
- Bell `Bₙ = Σₖ S(n,k)` : toutes les partitions d'un ensemble.
- Ne pas confondre : `C(n,k)` = 2 catégories étiquetées ; `S(n,k)` = k blocs anonymes (×k! pour étiqueter).

---

## ✅ Auto-test
1. 3 médailles distinctes à 8 athlètes ? → `A(8,3) = 336`
2. Anagrammes de ANANAS ? → `6!/(3!2!) = 60`
3. Coefficient de x² dans (1+x)⁵ ? → `C(5,2) = 10`
4. 10 bonbons identiques, 4 enfants ? → `C(13,3) = 286`
5. 5 tâches sur 3 serveurs sans serveur vide ? → `150`
6. 4 lettres, 4 enveloppes, aucune bonne ? → `D₄/4! = 9/24 = 0,375`
7. Parenthésages de 3 paires ? → `C₃ = 5`
8. Entiers de 1 à 100 non divisibles par 2, 3 ou 5 ? → `26`

*Liens : [Analyse combinatoire](https://fr.wikipedia.org/wiki/Analyse_combinatoire) · [Inclusion-exclusion](https://fr.wikipedia.org/wiki/Crible_de_Poincar%C3%A9) · [Catalan](https://fr.wikipedia.org/wiki/Nombre_de_Catalan) · [OEIS](https://oeis.org/)*
