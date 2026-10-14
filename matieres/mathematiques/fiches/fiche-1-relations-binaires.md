# 📝 Fiche de révision — Module 1 : Relations binaires

> Propriétés · Équivalence · Ordre · Treillis · Clôtures
> *Cours de maths pour la Data, le Big Data & l'IA*

---

## 1. Définition & représentations

Une **relation binaire** sur E est un sous-ensemble `R ⊆ E × E`. On note `x R y` pour `(x,y) ∈ R`.

Trois représentations : **ensemble de couples**, **matrice booléenne** (`M[i][j]=1` si `xᵢ R xⱼ`), **graphe orienté** (arc `x → y`).

---

## 2. Propriétés fondamentales (⭐ à mémoriser)

| Propriété | Définition | Lecture |
|-----------|------------|---------|
| Réflexive | ∀x, x R x | diagonale de M = 1 / boucles partout |
| Irréflexive | ∀x, ¬(x R x) | diagonale = 0 |
| Symétrique | x R y ⇒ y R x | M = Mᵀ / arcs à double sens |
| Antisymétrique | (x R y ∧ y R x) ⇒ x=y | jamais 2 sens entre points distincts |
| Asymétrique | x R y ⇒ ¬(y R x) | antisym. + irréflexive |
| Transitive | (x R y ∧ y R z) ⇒ x R z | tout raccourci existe déjà |
| Totale | ∀x,y, x R y ∨ y R x | toujours comparables |

⚠️ **Antisymétrique ≠ non symétrique.** L'égalité `=` est à la fois symétrique ET antisymétrique.

---

## 3. Relation d'équivalence = **R + S + T** (RST)

**Réflexive + Symétrique + Transitive.** Notée `∼`.

- **Classe :** `[x] = { y : y ∼ x }`
- **Théorème clé :** les classes forment une **PARTITION** de E (non vides, disjointes, union = E). Équivalence ⇔ Partition.
- **Quotient :** `E/∼ = { [x] : x ∈ E }`.

**Exemple roi — congruence mod n :** `a ≡ b (mod n) ⇔ n | (a−b)`. → n classes (`ℤ/nℤ`).

🔗 *Data :* **clustering = partition** ; déduplication ; sharding par `clé mod n`.

---

## 4. Relation d'ordre = **R + A + T** (RAT)

**Réflexive + Antisymétrique + Transitive.** Notée `⪯`. Couple `(E,⪯)` = **poset**.

- **Ordre total** : toujours comparables (ex. `≤` sur ℝ).
- **Ordre partiel** : éléments incomparables possibles (ex. `⊆`, divisibilité `|`).

> 💡 **Seule différence équivalence/ordre** : Symétrie (regroupe) vs Antisymétrie (hiérarchise).

**Éléments remarquables :**

| Terme | Définition |
|-------|------------|
| Minimal / Maximal | rien en dessous / au dessus (peut y en avoir plusieurs) |
| Minimum / Maximum | ⪯ tous / tous ⪯ lui (unique si existe) |
| Majorant de A | ⪰ tous les éléments de A |
| sup A / inf A | plus petit majorant / plus grand minorant |

⚠️ **Minimal ≠ Minimum** : plusieurs minimaux possibles, zéro minimum.

**Diagramme de Hasse :** on ne dessine que les **couvertures** (pas de boucles, pas d'arcs transitifs). On place le plus petit en bas.

🔗 *Data :* **DAG = ordre partiel** (pipelines Airflow/Spark, Git, rétropropagation) ; **tri topologique** = linéariser en ordre total.

---

## 5. Treillis (lattice)

Ordre où **toute paire** `{x,y}` a un **join** `x∨y = sup` et un **meet** `x∧y = inf`.

| Treillis | Join (∨) | Meet (∧) |
|----------|----------|----------|
| (P(E), ⊆) | ∪ | ∩ |
| (ℕ, \|) | ppcm | pgcd |
| ({0,1}ⁿ, ≤) | OU bit-à-bit | ET bit-à-bit |

🔗 *Data :* FCA (treillis de concepts), version space (ML), CRDT (fusion = join), analyse statique.

---

## 6. Opérations & clôtures

- **Inverse :** `R⁻¹ = {(y,x) : (x,y)∈R}` → Mᵀ.
- **Composition :** `x (S∘R) z ⇔ ∃y, x R y ∧ y S z` → produit matriciel booléen.
- **Clôtures** (plus petite relation ayant la propriété) :
  - réflexive : ajouter tous les (x,x)
  - symétrique : `R ∪ R⁻¹`
  - transitive `R⁺` : relier par chemins → **algo de Warshall** O(n³) = accessibilité

🔗 *Data :* **Union-Find** maintient les classes d'équivalence (composantes connexes, Kruskal, déduplication) en ~O(1) amorti.

---

## 7. Ponts avec la Data / IA

- **BDD relationnelles** : relation SQL = sous-ensemble d'un produit cartésien ; dépendances fonctionnelles, normalisation.
- **Clustering / dédup** = équivalence/partition ; Rand index compare 2 partitions.
- **Pipelines / ordonnancement** = DAG = ordre partiel ; tri topologique.
- **Optimisation multi-objectif** = **dominance de Pareto** (ordre partiel) ; front = éléments maximaux.
- **Accessibilité / influence** = clôture transitive (PageRank, propagation).

---

## ✅ Auto-test express
1. RST = ? → relation d'équivalence
2. RAT = ? → relation d'ordre
3. Différence minimal / minimum ? → plusieurs minimaux possibles ; minimum unique et ⪯ tous
4. `12 ∨ 18` dans (ℕ, |) ? → ppcm = 36
5. Nombre de relations sur n éléments ? → 2^(n²)
6. Clôture transitive d'une amitié symétrique ? → composantes connexes (communautés)

*Liens : [Relation binaire](https://fr.wikipedia.org/wiki/Relation_binaire) · [Équivalence](https://fr.wikipedia.org/wiki/Relation_d%27%C3%A9quivalence) · [Ordre partiel](https://fr.wikipedia.org/wiki/Ordre_partiel) · [Treillis](https://fr.wikipedia.org/wiki/Treillis_(ensemble_ordonn%C3%A9))*
