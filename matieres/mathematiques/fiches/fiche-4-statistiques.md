# 📝 Fiche de révision — Module 4 : Statistiques

> Descriptif · Corrélation · Estimation · Tests · Régression · MLE — 🟦 DATA · 🟪 BIG DATA · 🟩 IA

---

## 1. Descriptif
- Moyenne `x̄=Σxᵢ/n` (sensible aux extrêmes) · Médiane (robuste) · Mode.
- Variance empirique `s²=Σ(xᵢ−x̄)²/(n−1)` (−1 = correction de Bessel, non biaisé).
- Quartiles Q1/Q2/Q3, **IQR=Q3−Q1** ; outlier si > Q3+1,5·IQR.

## 2. Covariance & corrélation
- `Cov(X,Y)=Σ(xᵢ−x̄)(yᵢ−ȳ)/n`
- **Pearson** `r = Cov/(sₓsᵧ) ∈ [−1,1]` = relation **linéaire**.
- ⚠️ Corrélation ≠ causalité ; r=0 n'exclut pas une relation non linéaire.

## 3. Estimation & IC
- Estimateur **sans biais** : `E[θ̂]=θ` ; + faible variance = précis.
- **IC 95 % moyenne** : `x̄ ± 1,96·s/√n`. Largeur en 1/√n.
- Diviser la largeur par 2 → ×4 la taille d'échantillon.

## 4. Tests & p-value ⭐
- H₀ = « rien ne change » ; H₁ = effet.
- **p-value** = P(données aussi extrêmes | H₀). Si p < α (0,05) → **rejet de H₀**.
- Type I = faux positif (proba α) ; Type II = faux négatif (proba β) ; puissance = 1−β.
- ⚠️ p-value ≠ P(H₀ vraie). Non-rejet ≠ preuve de H₀. Attention au **p-hacking**.
- 🟦 DATA : A/B testing.

## 5. Régression linéaire
- `ŷ = β₀ + β₁x` ; moindres carrés : `min Σ(yᵢ−ŷᵢ)²`.
- Solution : `β̂ = (XᵀX)⁻¹Xᵀy` (lien Module 2).
- **R² ∈ [0,1]** = variance expliquée.
- 🟩 IA : baseline ML ; régularisation Ridge (L2) / Lasso (L1).

## 6. Maximum de vraisemblance (MLE)
- `θ̂ = argmax ∏ P(xᵢ|θ)` → en pratique **log-vraisemblance** `Σ log P(xᵢ|θ)`.
- Entraîner un modèle = maximiser vraisemblance = minimiser −log-vraisemblance.
- Moindres carrés = MLE sous bruit gaussien ; cross-entropy = cas particulier.

---

## ✅ Auto-test
1. Centre robuste aux outliers ? → médiane
2. r mesure quoi ? → relation linéaire ∈[−1,1]
3. IC largeur /2 → n ×? → 4
4. p=0,03, α=0,05 → ? → rejet de H₀
5. Rejeter H₀ vraie = erreur type ? → I (faux positif)
6. β̂ = ? → (XᵀX)⁻¹Xᵀy
7. Colinéarité → solution ? → Ridge (+λI)

*Liens : [Tests](https://fr.wikipedia.org/wiki/Test_statistique) · [Régression](https://fr.wikipedia.org/wiki/R%C3%A9gression_lin%C3%A9aire) · [Seeing Theory](https://seeing-theory.brown.edu/fr.html)*
