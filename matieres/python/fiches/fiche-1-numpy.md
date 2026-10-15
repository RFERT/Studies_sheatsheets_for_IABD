# 🐍 Fiche de révision — Module 1 : NumPy

## Créer
```python
import numpy as np
np.array([1,2,3]); np.zeros((2,3)); np.ones(5); np.full((2,2),7)
np.arange(0,10,2); np.linspace(0,1,5); np.eye(3)
```

## Attributs & axes
- `a.shape`, `a.ndim`, `a.size`, `a.dtype`, `a.astype(np.float32)`.
- **axis=0** = sur les lignes (résultat par colonne) ; **axis=1** = par ligne.
- Mnémo : l'axe indiqué **disparaît**.

## Vectorisation (le cœur)
```python
x * 2; x + x; x ** 2          # élément par élément
np.sqrt(x); np.exp(x); np.log(x)
```
- Si tu écris un `for` sur un array → demande-toi « puis-je vectoriser ? » (oui 9×/10).

## Indexation
- `a[2:5]`, `a[::2]`, `b[0,1]`, `b[:,0]` (colonne), `b[1,:]` (ligne).
- ⚠️ Un slice est une **vue** (modifie l'original) → `.copy()` pour un tableau indépendant.
- Fancy indexing : `a[[0,3,5]]`.

## Masques booléens
```python
a[a > 0]                 # sélection
a[a < 0] = 0             # modification
(a > 0).sum()            # compte
np.where(a > 2, "grand", "petit")
```
- ⚠️ Opérateurs : `&`, `|`, `~` (+ parenthèses), **jamais** `and`/`or`.

## Broadcasting ⭐
- Dimensions compatibles si **égales** ou si **l'une vaut 1** (comparées de droite à gauche).
- Standardisation : `Z = (X - X.mean(axis=0)) / X.std(axis=0)`.

## Agrégations
- `.sum() .mean() .std() .min() .max() .argmax() .cumsum()` ; `np.median`, `np.percentile`.
- Avec `axis=` pour agréger par ligne/colonne.

## Reshape
- `a.reshape(3, -1)` (-1 = calcule), `M.T`, `M.flatten()`, `np.vstack`, `np.hstack`, `a[:, np.newaxis]`.

## Algèbre linéaire & aléatoire
- `A @ A` = produit matriciel ; `A * A` = terme à terme (⚠️ ne pas confondre).
- `np.linalg.inv/det/eig/norm`.
- `rng = np.random.default_rng(42)` → `rng.normal(0,1,n)`, `rng.integers`, `rng.choice`. Graine = reproductible.

*Liens : [Doc NumPy](https://numpy.org/doc/stable/) · [Article Nature 2020](https://www.nature.com/articles/s41586-020-2649-2)*
