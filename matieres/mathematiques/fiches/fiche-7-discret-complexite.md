# 📝 Fiche de révision — Module 7 : Discret & Complexité

> Dénombrement · Arrangements/Combinaisons · Pascal · Pigeonhole · Big-O — 🟦 DATA · 🟪 BIG DATA · 🟩 IA

---

## 1. Dénombrement
- **Multiplicatif** : k étapes, n₁×…×nₖ. **Additif** : choix exclusifs → +.

## 2. Arrangements & combinaisons
- Factorielle `n! = n(n−1)…1`, `0!=1`.
- **Arrangement** (ordre compte) : `A(n,k) = n!/(n−k)!`
- **Combinaison** (ordre indifférent) : `C(n,k) = n!/(k!(n−k)!)`
- Réflexe : **l'ordre compte ?** oui→arrangement, non→combinaison.

## 3. Binôme & Pascal
- `(a+b)ⁿ = Σ C(n,k) aᵏ bⁿ⁻ᵏ`
- `C(n,k) = C(n−1,k−1) + C(n−1,k)` (Pascal) ; `Σ C(n,k) = 2ⁿ` ; `C(n,k)=C(n,n−k)`.

## 4. Principe des tiroirs
- n objets, k tiroirs, n>k → un tiroir a ≥2 objets (≥⌈n/k⌉).
- 🟪 garantit les **collisions de hachage** (n>k inévitable).

## 5. Big-O ⭐
`f=O(g)` : f croît au plus comme g (constantes/termes négligés).

| O | Nom | Exemple |
|---|---|---|
| O(1) | constante | hash lookup |
| O(log n) | log | dichotomie |
| O(n) | linéaire | parcours |
| O(n log n) | quasi-lin | tri fusion |
| O(n²) | quadratique | double boucle |
| O(2ⁿ) | exponentielle | sous-ensembles |
| O(n!) | factorielle | permutations |

- 🟪 Sur n=10⁹ : O(n) ok, O(n²)=10¹⁸ infaisable. L'échelle change tout.

## 6. Classes
- P (facile), NP (vérifiable), NP-complet (SAT, TSP, sac à dos).
- NP-difficile → **heuristiques/approximations** (souvent via ML).

---

## ✅ Auto-test
1. PIN 4 chiffres ? → 10⁴=10 000
2. Équipe 3 parmi 10 ? → C(10,3)=120
3. Podium 3 parmi 8 ? → A(8,3)=336
4. Σ C(n,k) ? → 2ⁿ
5. 1000 clés, 999 cases → collision ? → oui (pigeonhole)
6. Dichotomie ? → O(log n)
7. 3n²+100n+7 ? → O(n²)

*Liens : [Combinatoire](https://fr.wikipedia.org/wiki/Analyse_combinatoire) · [Big-O Cheat Sheet](https://www.bigocheatsheet.com/)*
