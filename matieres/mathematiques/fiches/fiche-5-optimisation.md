# 📝 Fiche de révision — Module 5 : Analyse & Optimisation

> Dérivées · Gradient · Convexité · Descente de gradient · Backprop — 🟦 DATA · 🟩 IA

---

## 1. Dérivées
- `f'(x)` = pente / taux de variation instantané. f'>0 monte, f'<0 descend, f'=0 extremum.
- Usuelles : `(xⁿ)'=nxⁿ⁻¹`, `(eˣ)'=eˣ`, `(ln x)'=1/x`, `(sin)'=cos`.
- Produit `(uv)'=u'v+uv'` ; **Chain rule** `(f∘g)'=f'(g)·g'`.

## 2. Gradient & dérivées partielles
- `∂f/∂xᵢ` : dérive selon xᵢ, autres fixes.
- `∇f = (∂f/∂x₁, …, ∂f/∂xₙ)`.
- ⭐ **∇f pointe vers la plus forte augmentation** → −∇f vers la diminution (minimiser).

## 3. Convexité
- Convexe = « en bol », `f''≥0` (ou Hessienne ⪰ 0).
- ⭐ Convexe ⇒ **tout minimum local est global**.
- 🟩 Régression/SVM = convexe ; deep learning = non convexe (minima locaux, selles).

## 4. Descente de gradient ⭐
`θ ← θ − η ∇J(θ)`
- η = **learning rate**. Trop petit = lent ; trop grand = oscille/diverge.
- Signe − : on va à l'opposé du gradient pour descendre.

## 5. Variantes
| Variante | Idée |
|---|---|
| Batch GD | tout le dataset (précis, lent) |
| SGD | 1 exemple (rapide, bruité) |
| Mini-batch | paquet 32–256 (standard DL) |
| Momentum | accumule l'élan |
| Adam | learning rate adaptatif (défaut moderne) |
- 🟦 Mini-batch SGD = apprentissage sur gros volumes sans tout charger.

## 6. Backprop
- Réseau = composition de fonctions → gradient par **chain rule** en remontant.
- autograd (PyTorch/TF) automatise ce calcul.

---

## ✅ Auto-test
1. `(x³)'` ? → 3x²
2. ∇f pointe vers ? → plus forte augmentation
3. ∇f de x²+y² en (3,4) ? → (6,8)
4. Convexe ⇒ min local = ? → global
5. Règle MAJ descente ? → θ←θ−η∇J
6. η trop grand ? → divergence/oscillation
7. Backprop repose sur ? → chain rule

*Liens : [3Blue1Brown réseaux de neurones](https://www.3blue1brown.com/topics/neural-networks) · [Descente de gradient](https://fr.wikipedia.org/wiki/Algorithme_du_gradient)*
