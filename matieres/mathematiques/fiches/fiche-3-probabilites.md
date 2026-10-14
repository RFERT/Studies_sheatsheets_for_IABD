# 📝 Fiche de révision — Module 3 : Probabilités

> Bayes · Lois · Espérance/Variance · LGN & TCL — 🟦 DATA · 🟪 BIG DATA · 🟩 IA

---

## 1. Bases & axiomes
- Univers Ω, événement A ⊆ Ω, `P(A)∈[0,1]`, `P(Ω)=1`.
- `P(A∪B)=P(A)+P(B)−P(A∩B)` ; `P(Ā)=1−P(A)`.
- Incompatibles (A∩B=∅) → `P(A∪B)=P(A)+P(B)`.

## 2. Conditionnelles & indépendance
- `P(A|B)=P(A∩B)/P(B)`
- **Indépendants** ⇔ `P(A∩B)=P(A)P(B)` ⇔ `P(A|B)=P(A)`
- Probas totales : `P(A)=Σ P(A|Bᵢ)P(Bᵢ)`

## 3. Bayes ⭐
`P(A|B) = P(B|A)P(A) / P(B)`
- P(A)=**a priori**, P(A|B)=**a posteriori**, P(B|A)=**vraisemblance**
- ⚠️ **Paradoxe du taux de base** : maladie rare + test à 99 % → P(malade|+) peut être ~17 %.
- 🟩 IA : Naive Bayes (spam), diagnostic, fraude, inférence bayésienne.

## 4. Variables aléatoires
- Discrète : `P(X=k)`, Σ=1. Continue : densité f, `P(a≤X≤b)=∫f`.
- Répartition `F(x)=P(X≤x)`.

## 5. Lois usuelles

| Loi | Modélise | E[X] | Var |
|---|---|---|---|
| Bernoulli(p) | 1 essai binaire | p | p(1−p) |
| Binomiale(n,p) | nb succès /n | np | np(1−p) |
| Géométrique(p) | essais avant 1er succès | 1/p | (1−p)/p² |
| Poisson(λ) | événements rares | λ | λ |
| Uniforme[a,b] | hasard plat | (a+b)/2 | (b−a)²/12 |
| Normale(μ,σ²) | en cloche | μ | σ² |

- Binomiale : `P(X=k)=C(n,k) pᵏ(1−p)ⁿ⁻ᵏ`
- Normale : règle **68–95–99,7** (±1σ, ±2σ, ±3σ)

## 6. Espérance & variance
- `E[X]=Σ k·P(X=k)` ; `Var(X)=E[X²]−E[X]²` ; `σ=√Var`
- `E[aX+b]=aE[X]+b` ; `Var(aX+b)=a²Var(X)`
- Linéarité : `E[X+Y]=E[X]+E[Y]` (toujours). Si indép. : `Var(X+Y)=Var(X)+Var(Y)`
- 🟩 IA : compromis **biais-variance**.

## 7. LGN & TCL ⭐
- **LGN** : moyenne empirique `X̄ₙ → μ`. → justifie le **sampling** (🟪 Big Data).
- **TCL** : `X̄ₙ ≈ N(μ, σ²/n)` quelle que soit la loi de départ. → base des **intervalles de confiance** et A/B tests.
- Écart-type de la moyenne = `σ/√n` (décroît en 1/√n).

---

## ✅ Auto-test
1. P(Ā) ? → 1−P(A)
2. Critère d'indépendance ? → P(A∩B)=P(A)P(B)
3. a priori dans Bayes ? → P(A)
4. 10 lancers de pièce, nb face ? → Binomiale(10 ; 0,5)
5. ±2σ en normale ? → ~95 %
6. Var(3X) si Var(X)=4 ? → 36
7. Loi de la moyenne (TCL) ? → N(μ, σ²/n)

*Liens : [Seeing Theory](https://seeing-theory.brown.edu/fr.html) · [Bayes](https://fr.wikipedia.org/wiki/Th%C3%A9or%C3%A8me_de_Bayes) · [TCL](https://fr.wikipedia.org/wiki/Th%C3%A9or%C3%A8me_central_limite)*
