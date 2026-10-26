---
title: Module 3 — Types composés : tuples, tableaux & slices
subtitle: Regrouper des valeurs. Introduction douce à une idée centrale : les slices.
domains: DEV
tags: fonctions, ownership, slices, sécurité, tableaux, tuples
---

### Tuples

Un **tuple** regroupe des valeurs de types éventuellement différents, avec une taille **fixe**.

```rust
let tup: (i32, f64, char) = (500, 6.4, 'z');
let (x, y, z) = tup;          // déstructuration
let premier = tup.0;          // accès par index avec un point
println!("{y}");              // 6.4
let unit = ();                // le tuple vide = type "unit", la "rien" de Rust
```

::: py Comparaison Python
Comme les tuples Python, ils sont hétérogènes et déstructurables. Différence : la taille et les types sont **fixés à la compilation**. Et le tuple vide `()` — le type « unit » — joue le rôle de `None`/`void` : c’est ce que renvoie une fonction sans valeur de retour.
:::

### Tableaux (arrays)

Un **tableau** a une taille fixe et des éléments du **même type**. Il vit généralement sur la pile (stack).

```rust
let a = [1, 2, 3, 4, 5];        // [i32; 5]
let b: [i32; 3] = [0; 3];      // [0, 0, 0] (répétition)
let premier = a[0];
let taille = a.len();          // 5
// let x = a[10];              // panique à l'exécution : index out of bounds
```

::: warn Piège fréquent
Indexer hors limites (`a[10]`) **ne corrompt pas la mémoire** comme en C : Rust vérifie et **panique** proprement (« index out of bounds »). C’est plus sûr, mais reste une erreur à éviter — souvent avec `.get(i)` qui renvoie une `Option`.
:::

### Vec vs tableau

Le tableau `[T; N]` a une taille figée. Pour une liste **dynamique**, on utilise `Vec<T>` (Module 9), l’équivalent de la `list` Python.

### Slices — l’idée clé

Un **slice** `&[T]` est une **vue empruntée** sur une portion contiguë d’un tableau, d’un `Vec` ou d’une chaîne : un couple (pointeur, longueur). Il ne possède **pas** les données — il les référence.

```rust
let a = [10, 20, 30, 40, 50];
let milieu = &a[1..4];   // &[i32] -> [20, 30, 40] (fin exclusive)
let debut  = &a[..2];    // [10, 20]
let tout   = &a[..];     // le tableau entier

let mot = String::from("bonjour");
let bon = &mot[0..3];    // &str -> "bon" (slice de chaîne)
```

::: why Le « pourquoi » de Rust
Les slices sont fondamentaux : ils permettent d’écrire des fonctions qui travaillent indifféremment sur un tableau, un `Vec` ou une sous-partie, **sans copier** les données. Une fonction qui prend `&[i32]` accepte `&mon_tableau` comme `&mon_vec`. C’est plus flexible et plus performant que de passer la collection entière.

Attention : `&str` est un slice de chaîne UTF-8. Découper au milieu d’un caractère multi-octets (ex. `&mot[0..1]` sur « é ») **panique**, car les indices sont en **octets**.
:::

::: py Comparaison Python
Le slicing Python (`liste[1:4]`) **copie** les éléments dans une nouvelle liste. Le slice Rust ne copie **rien** : c’est une fenêtre sur les données existantes, soumise au borrow checker (Module 6).
:::

## Quiz d'entraînement

::: exo Quiz 1
Quelle est la sortie ?
```rust
fn main() {
    let t = (1, 6.4, 'x');
    let (_, y, _) = t;
    println!("{y}");
}
```
?? Voir la correction
**Sortie attendue :** `6.4`

6.4

La déstructuration `let (_, y, _) = t;` lie `y` au deuxième élément (`6.4`). `_` ignore les autres. On aurait aussi pu écrire `t.1`.
:::

::: quiz Quiz 2
Que représente `&a[1..4]` pour `let a = [10,20,30,40,50];` ?
- [ ] Une copie `[20,30,40,50]`
- [x] Une vue empruntée `[20,30,40]` (fin exclusive), sans copie
- [ ] Une erreur : les slices n’existent que sur les String
- [ ] Le tableau entier
> `1..4` va de l’index 1 inclus à 4 **exclus** → éléments d’indices 1,2,3 = `[20,30,40]`. C’est un `&[i32]`, une **vue** empruntée, aucune copie.
:::

::: quiz Quiz 3
Un slice possède (owns) les données qu’il désigne.
- [ ] Vrai
- [x] Faux
> Faux. Un slice **emprunte** les données : c’est une référence (pointeur + longueur). Il dépend de la durée de vie de la collection sous-jacente (cf. borrow checker).
:::

::: quiz Quiz 4
Que fait `a[10]` si `a` n’a que 5 éléments ?
- [ ] Comportement indéfini (comme en C)
- [ ] Renvoie 0
- [x] Panique à l’exécution : « index out of bounds »
- [ ] Erreur de compilation systématique
> Rust insère une vérification de borne : accès hors limites → **panique contrôlée** à l’exécution, pas de corruption mémoire. Pour un accès sûr renvoyant une `Option`, utilise `a.get(10)`.
:::

::: exo Quiz 5
Pourquoi préfère-t-on écrire une fonction `fn somme(v: &[i32]) -> i32` plutôt que `fn somme(v: Vec<i32>) -> i32` ? Donne deux raisons.
*Indice : Pense à la flexibilité des types acceptés et à l’ownership.*
?? Voir la correction
1) `&[i32]` accepte à la fois un `Vec`, un tableau `[i32; N]` et une sous-partie, sans copie. 2) La fonction **emprunte** au lieu de **prendre possession** : l’appelant garde sa collection après l’appel. C’est plus flexible et évite un déplacement/clone inutile.

Prendre `Vec<i32>` par valeur **consomme** (move) la collection : l’appelant la perd. Prendre `&[i32]` emprunte une vue en lecture seule, réutilisable, compatible avec plusieurs types. C’est l’idiome recommandé pour les paramètres « lecture ».
:::
