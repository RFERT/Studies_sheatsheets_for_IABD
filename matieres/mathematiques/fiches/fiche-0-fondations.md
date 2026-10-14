# 📝 Fiche de révision — Module 0 : Fondations

> Logique · Ensembles · Fonctions · Preuves · Récurrence
> *Cours de maths pour la Data, le Big Data & l'IA*

---

## 1. Logique propositionnelle

**Connecteurs :** ¬ (non), ∧ (et), ∨ (ou inclusif), ⇒ (implique), ⇔ (équivaut).

**Table de vérité de l'implication** — `P ⇒ Q` est FAUSSE uniquement quand `P=V` et `Q=F`.

| P | Q | P⇒Q |
|---|---|-----|
| V | V | V |
| V | F | **F** |
| F | V | V |
| F | F | V |

**Lois à connaître par cœur :**
- Contraposée : `(P ⇒ Q) ⇔ (¬Q ⇒ ¬P)`
- Négation implication : `¬(P ⇒ Q) ⇔ (P ∧ ¬Q)`
- De Morgan : `¬(P ∧ Q) ⇔ (¬P ∨ ¬Q)` ; `¬(P ∨ Q) ⇔ (¬P ∧ ¬Q)`
- Implication déguisée : `(P ⇒ Q) ⇔ (¬P ∨ Q)`

---

## 2. Quantificateurs

- `∀x, P(x)` : pour tout x. — `∃x, P(x)` : il existe x. — `∃!x` : il existe un unique x.

**Négation (RÈGLE D'OR) :** on échange `∀ ↔ ∃` et on nie le prédicat.
- `¬(∀x, P(x)) ⇔ ∃x, ¬P(x)`
- `¬(∃x, P(x)) ⇔ ∀x, ¬P(x)`

⚠️ **L'ordre compte !** `∀x ∃y, x<y` (VRAI dans ℝ) ≠ `∃y ∀x, x<y` (FAUX).

---

## 3. Ensembles

**Nombres :** ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ ⊂ ℂ.

**Inclusion / égalité :** `A ⊆ B ⇔ (∀x, x∈A ⇒ x∈B)`. Pour prouver `A = B` → **double inclusion**.

| Opération | Notation | Définition |
|-----------|----------|------------|
| Union | A ∪ B | x∈A ∨ x∈B |
| Intersection | A ∩ B | x∈A ∧ x∈B |
| Différence | A \ B | x∈A ∧ x∉B |
| Complémentaire | Aᶜ | x∈E ∧ x∉A |
| Produit cartésien | A × B | (a,b), a∈A, b∈B |

- **De Morgan (ensembles) :** `∁(A∪B) = ∁A ∩ ∁B` ; `∁(A∩B) = ∁A ∪ ∁B`
- **Crible :** `|A ∪ B| = |A| + |B| − |A ∩ B|`
- **Parties :** si `|E| = n` alors `|P(E)| = 2ⁿ`

---

## 4. Applications & fonctions

`f : E → F`, chaque x a une **unique** image f(x).

- **Injective** : `f(x₁)=f(x₂) ⇒ x₁=x₂` (pas deux antécédents)
- **Surjective** : `∀y∈F, ∃x∈E, f(x)=y` (tout y atteint)
- **Bijective** : injective + surjective → admet une réciproque `f⁻¹`

🔗 *Data :* hachage idéal = injectif ; clé primaire = bijection logique ; one-hot = injection.

---

## 5. Méthodes de preuve

| Méthode | Principe |
|---------|----------|
| **Directe** | Supposer P, dérouler jusqu'à Q |
| **Contraposée** | Prouver `¬Q ⇒ ¬P` au lieu de `P ⇒ Q` |
| **Absurde** | Supposer `P ∧ ¬Q`, trouver une contradiction |
| **Contre-exemple** | Réfuter un `∀` avec un seul cas |

*Exemple absurde : √2 irrationnel (si p/q irréductible ⇒ p et q pairs ⇒ contradiction).*

---

## 6. Récurrence

Pour prouver `∀n ≥ n₀, P(n)` :
1. **Initialisation** : P(n₀) vraie.
2. **Hérédité** : `∀n ≥ n₀, P(n) ⇒ P(n+1)`.
3. **Conclusion**.

*Formule clé :* `1 + 2 + … + n = n(n+1)/2`.

⚠️ Ne jamais oublier l'initialisation. Variante : **récurrence forte** (supposer P(n₀)…P(n)).

🔗 *Info :* récurrence = pendant mathématique de la récursivité ; sert aux preuves de correction/complexité d'algorithmes.

---

## 7. Ponts avec la Data

- **SQL = algèbre des ensembles** : UNION=∪, INTERSECT=∩, EXCEPT=\, JOIN=produit cartésien filtré.
- **WHERE = logique propositionnelle** ; De Morgan pour optimiser.
- **EXISTS ↔ ∃**, **ALL ↔ ∀**.
- **Clés / hachage = injectivité**.
- **Récursivité & MapReduce = récurrence**.

---

## ✅ Auto-test express
1. Négation de `P ⇒ Q` ? → `P ∧ ¬Q`
2. `|A|=4, |B|=5, |A∩B|=2` ⇒ `|A∪B|` ? → 7
3. `n ↦ 2n` sur ℤ : injective ? surjective ? → injective, pas surjective
4. Méthode pour « n² impair ⇒ n impair » ? → contraposée

*Liens : [Calcul propositionnel](https://fr.wikipedia.org/wiki/Calcul_des_propositions) · [MIT 6.042](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/)*
