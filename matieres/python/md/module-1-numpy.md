---
title: Module 1 — NumPy : le calcul vectoriel
subtitle: NumPy est la fondation de toute la data en Python : un tableau N-dimensionnel ultra-rapide (écrit en C) et la **vectorisation**, qui remplace les boucles Python par des opérations sur des tableaux entiers. Pandas, scikit-learn, PyTorch… tout repose dessus.
domains: DATA, IA
objectifs: Créer et manipuler des `ndarray` ; comprendre `shape`, `dtype` et les axes ; vectoriser au lieu de boucler ; maîtriser l'indexation avancée et les masques booléens ; appliquer le **broadcasting** ; utiliser les fonctions d'agrégation, l'algèbre linéaire et l'aléatoire.
---

## 1. Créer des tableaux

```python
import numpy as np

a = np.array([1, 2, 3])              # depuis une liste
b = np.array([[1, 2], [3, 4]])       # 2D (matrice)
np.zeros((2, 3)); np.ones((3,)); np.full((2,2), 7)
np.arange(0, 10, 2)             # [0 2 4 6 8]
np.linspace(0, 1, 5)            # [0. .25 .5 .75 1.]
np.eye(3)                          # identité 3x3
```

::: info Liste ≠ ndarray
Un `ndarray` a un **type unique** et une taille fixe : c'est ce qui le rend rapide. Additionner deux listes Python les concatène ; additionner deux arrays fait une somme *élément par élément*.
:::

## 2. shape, dtype & axes

```python
b = np.array([[1, 2, 3], [4, 5, 6]])
b.shape      # (2, 3) -> 2 lignes, 3 colonnes
b.ndim       # 2 (nombre de dimensions)
b.size       # 6 (nombre total d'éléments)
b.dtype      # int64
b.astype(np.float32)   # conversion de type
```

::: info Les axes
Pour un tableau 2D : **axis=0** = « vers le bas » (colonnes / sur les lignes), **axis=1** = « vers la droite » (lignes / sur les colonnes). `b.sum(axis=0)` somme chaque colonne → `[5 7 9]`.
:::

::: quiz Quiz 2.1
Pour un tableau de forme `(3, 4)`, que donne `.sum(axis=1)` ?
- [ ] Un tableau de 4 valeurs (somme par colonne)
- [x] Un tableau de 3 valeurs (somme par ligne)
- [ ] Un seul nombre
- [ ] Une erreur
> <code>axis=1</code> réduit la dimension des colonnes : on somme chaque ligne, il reste 3 valeurs. Mnémo : l'axe indiqué est celui qui <em>disparaît</em>.
:::

## 3. Vectorisation (le cœur de NumPy) ⭐

On applique des opérations sur des tableaux entiers, sans boucle Python. C'est à la fois plus court et **10 à 100× plus rapide**.

```python
x = np.arange(1, 6)      # [1 2 3 4 5]
x * 2                   # [2 4 6 8 10]
x + x                   # [2 4 6 8 10] (élément par élément)
x ** 2                  # [1 4 9 16 25]
np.sqrt(x); np.exp(x); np.log(x)   # ufuncs vectorisées
(x > 2)                 # [False False True True True]
```

::: info Boucle vs vectorisation
```
# ❌ lent (boucle Python)
r = [v**2 for v in x]
# ✅ rapide (vectorisé, calcul en C)
r = x**2
```
:::

::: info Règle d'or
Si tu écris une boucle `for` sur un array NumPy, demande-toi toujours : « puis-je vectoriser ? ». 9 fois sur 10, oui.
:::

## 4. Indexation & slicing

```python
a = np.arange(10)       # [0 1 2 3 4 5 6 7 8 9]
a[2]; a[-1]              # 2 ; 9
a[2:5]                 # [2 3 4]
a[::2]                  # [0 2 4 6 8]

b = np.array([[1,2,3],[4,5,6]])
b[0, 1]                # 2  (ligne 0, colonne 1)
b[:, 0]                 # [1 4] (toute la colonne 0)
b[1, :]                 # [4 5 6] (toute la ligne 1)
```

::: info Vue, pas copie !
Un slice NumPy est une **vue** : modifier `a[2:5]` modifie `a`. Pour un tableau indépendant, utilise `.copy()`.
:::

### Fancy indexing

```python
a[[0, 3, 5]]            # sélectionne ces indices -> [0 3 5]
```

## 5. Masques booléens ⭐

Sélectionner/modifier selon une condition : omniprésent en nettoyage de données.

```python
a = np.array([1, -2, 3, -4, 5])
a[a > 0]                 # [1 3 5]
a[a < 0] = 0              # remplace les négatifs -> [1 0 3 0 5]
np.where(a > 2, "grand", "petit")  # ternaire vectorisé
(a > 0).sum()            # compte les valeurs positives
((a > 0) & (a < 4))       # & = et, | = ou (PAS and/or !)
```

::: info Opérateurs
Avec les tableaux NumPy, on utilise `&`, `|`, `~` (et parenthèses !), jamais `and`/`or`/`not` qui lèvent une erreur sur un array.
:::

::: quiz Quiz 5.1
Comment compter le nombre d'éléments > 10 dans un array `a` ?
- [ ] `len(a > 10)`
- [ ] `count(a, >10)`
- [x] `(a > 10).sum()`
- [ ] `a.count(10)`
> <code>a > 10</code> donne un masque de booléens ; <code>True</code> vaut 1, donc <code>.sum()</code> compte combien sont vrais. Idiome ultra-courant.
:::

## 6. Broadcasting ⭐⭐

Le broadcasting permet d'opérer sur des tableaux de formes différentes en « étirant » automatiquement la plus petite, **sans copie mémoire**.

```python
M = np.array([[1, 2, 3],
              [4, 5, 6]])   # (2, 3)
M + 10                 # scalaire diffusé partout
M + np.array([10, 20, 30])   # (3,) ajouté à chaque ligne
M * np.array([[1], [0]])      # (2,1) : multiplie ligne par ligne
```

::: info Règle
Deux dimensions sont compatibles si elles sont **égales** ou si **l'une vaut 1**. On compare les shapes de droite à gauche. Exemple phare : **centrer** des données → `X - X.mean(axis=0)` (soustrait la moyenne de chaque colonne).
:::

::: info Standardisation (z-score) en une ligne
```
Z = (X - X.mean(axis=0)) / X.std(axis=0)
```
:::

::: quiz Quiz 6.1
Un tableau `(3, 4)` et un tableau `(4,)` : l'addition est-elle possible ?
- [x] Oui : le `(4,)` est diffusé sur chacune des 3 lignes
- [ ] Non : les formes diffèrent
- [ ] Oui mais seulement avec `np.add`
- [ ] Non, il faut un `(3,)`
> En comparant de droite à gauche : 4==4 (OK), puis 3 contre rien → le (4,) est étiré sur les 3 lignes. Résultat (3, 4).
:::

## 7. Agrégations & axes

| Fonction | Rôle |
| --- | --- |
| `.sum()` `.mean()` `.std()` | Somme, moyenne, écart-type |
| `.min()` `.max()` | Extrêmes |
| `.argmin()` `.argmax()` | Indice du min/max |
| `.cumsum()` | Somme cumulée |
| `np.median`, `np.percentile` | Médiane, quantiles |
| `.any()` `.all()` | Au moins un / tous vrais |

```python
M.sum()            # total global
M.sum(axis=0)      # par colonne -> [5 7 9]
M.mean(axis=1)     # moyenne par ligne
```

## 8. Reshape & manipulation de forme

```python
a = np.arange(12)
a.reshape(3, 4)      # 3 lignes, 4 colonnes
a.reshape(3, -1)     # -1 = « calcule toi-même » (ici 4)
M.T                     # transposée
M.flatten()           # aplatit en 1D
np.concatenate([a, b]); np.vstack([a, b]); np.hstack([a, b])
a[:, np.newaxis]        # ajoute une dimension (3,) -> (3,1)
```

::: info reshape conserve le nombre d'éléments
`reshape(3, 4)` exige exactement 12 éléments, sinon `ValueError`.
:::

## 9. Algèbre linéaire & aléatoire

```python
A = np.array([[1, 2], [3, 4]])
A @ A                   # produit matriciel (ou np.dot)
A * A                   # produit ÉLÉMENT PAR ÉLÉMENT (≠ @)
np.linalg.inv(A)        # inverse
np.linalg.det(A)        # déterminant
np.linalg.eig(A)        # valeurs/vecteurs propres
np.linalg.norm(v)       # norme d'un vecteur
```

::: info @ vs *
`@` = produit matriciel (lignes × colonnes) ; `*` = produit terme à terme. Confusion classique en examen et en ML.
:::

### Aléatoire (reproductible)

```python
rng = np.random.default_rng(42)   # graine = reproductibilité
rng.random((2, 3))        # uniformes [0,1)
rng.normal(0, 1, 1000)     # gaussienne
rng.integers(0, 10, 5)      # entiers
rng.choice(data, 100)       # échantillonnage
```

::: info Reproductibilité
Fixer la graine (`seed`) garantit que tes expériences ML donnent les mêmes résultats — indispensable pour comparer des modèles et débugger.
:::

## 10. Exercices

::: exo Exercice 1 — Vectorisation
Sans boucle, calcule la distance euclidienne entre deux vecteurs `u` et `v`.
?? Voir la solution
```python
np.sqrt(((u - v)**2).sum())   # ou np.linalg.norm(u - v)
```
:::

::: exo Exercice 2 — Masque
Remplace toutes les valeurs négatives d'un array par leur valeur absolue, sans boucle.
?? Voir la solution
```python
a[a < 0] *= -1        # ou np.abs(a)
```
:::

::: exo Exercice 3 — Standardisation (⭐)
Standardise chaque colonne d'une matrice `X` (moyenne 0, écart-type 1) en une ligne.
?? Voir la solution
```python
Z = (X - X.mean(axis=0)) / X.std(axis=0)
```

Le broadcasting diffuse les vecteurs `mean` et `std` (shape `(n_colonnes,)`) sur chaque ligne.
:::

::: culture Culture & histoire
Comment un tableau est devenu le socle de toute la science computationnelle en Python.
Dans les années 1990, calculer en Python était lent et fragmenté. Deux bibliothèques rivales, *Numeric* et *Numarray*, divisaient la communauté. En 2005, **Travis Oliphant** les unifie en une seule : **NumPy**. Ce geste a littéralement rendu possible l'écosystème scientifique Python d'aujourd'hui.

#### Repères
- **Travis Oliphant** (2005) — crée NumPy, puis co-fonde Anaconda et SciPy. Figure centrale de la PyData.
- **Le concept d'`ndarray`** — un bloc mémoire contigu + des métadonnées (shape, strides) : d'où la vitesse.
- **BLAS / LAPACK** (années 1970-90) — les bibliothèques Fortran d'algèbre linéaire que NumPy appelle en coulisses.
- **Article *Nature*** (2020) — « Array programming with NumPy » : reconnaissance scientifique de son rôle (imagerie des trous noirs, détection d'ondes gravitationnelles).

#### Pourquoi c'est rapide
Une liste Python stocke des *pointeurs* vers des objets éparpillés ; un `ndarray` stocke les données **côte à côte**, d'un seul type. Les opérations s'exécutent alors en C/Fortran optimisé, en exploitant le cache du processeur et les instructions vectorielles (SIMD). C'est la différence entre interpréter et calculer.
- [Doc NumPy](https://numpy.org/doc/stable/)
- [NumPy (Wikipédia)](https://fr.wikipedia.org/wiki/NumPy)
- [Article Nature 2020](https://www.nature.com/articles/s41586-020-2649-2)
:::
