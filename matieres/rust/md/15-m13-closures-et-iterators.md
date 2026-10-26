---
title: Module 13 — Closures & iterators ★
subtitle: Le style fonctionnel de Rust : concis, expressif et sans surcoût.
domains: DEV
tags: closures, iterators, ownership, paresse
---

### Closures (fermetures)

Une **closure** est une fonction anonyme qui peut **capturer** son environnement.

```rust
let facteur = 3;
let multiplier = |x| x * facteur;   // capture 'facteur'
println!("{}", multiplier(10));      // 30

let addition = |a: i32, b: i32| -> i32 { a + b };
```

### Trois façons de capturer

Le compilateur choisit automatiquement le mode le plus permissif nécessaire, correspondant à trois traits :

| Trait | Capture | Analogie |
| --- | --- | --- |
| `Fn` | par référence immuable `&T` | lecture |
| `FnMut` | par référence mutable `&mut T` | écriture |
| `FnOnce` | par valeur (move), appelable une seule fois | consomme |

```rust
let mut compte = 0;
let mut incr = || compte += 1;   // FnMut : capture &mut compte
incr(); incr();
println!("{compte}");             // 2

let s = String::from("hi");
let consomme = move || s;         // move : prend possession de s
println!("{}", consomme());
```

::: py Comparaison Python
Closures ≈ `lambda` Python, mais bien plus puissantes (corps multi-lignes, capture typée). Le mot-clé `move` force la capture **par valeur** — crucial pour passer une closure à un thread (Module 15), où l’environnement emprunté ne survivrait pas.
:::

### Iterators — paresseux et composables

Un **iterator** produit des éléments à la demande. Les **adaptateurs** (`map`, `filter`…) sont **paresseux** : rien ne se calcule tant qu’un **consommateur** (`collect`, `sum`, `for`…) ne les tire.

```rust
let v = vec![1, 2, 3, 4, 5, 6];

let pairs_doubles: Vec<i32> = v.iter()
    .filter(|&&x| x % 2 == 0)   // 2,4,6   (adaptateur, paresseux)
    .map(|&x| x * 2)            // 4,8,12  (adaptateur, paresseux)
    .collect();                 // consommateur -> déclenche le calcul

let somme: i32 = v.iter().sum();
let total: i32 = v.iter().filter(|&&x| x > 3).sum();  // 4+5+6 = 15
let trouve = v.iter().find(|&&x| x > 4);              // Some(&5)
let compte = v.iter().filter(|&&x| x % 2 == 0).count();
```

::: why Le « pourquoi » de Rust
Les itérateurs Rust sont une abstraction à **coût nul** (« zero-cost abstraction ») : la chaîne `iter().filter().map().sum()` compile en code aussi rapide qu’une boucle `for` manuelle, souvent plus, grâce à la monomorphisation et à l’inlining. Tu obtiens l’expressivité du fonctionnel **sans** la pénalité habituelle.
:::

### iter vs iter_mut vs into_iter

| Méthode | Produit | Effet sur la collection |
| --- | --- | --- |
| `iter()` | `&T` | emprunte (lecture) |
| `iter_mut()` | `&mut T` | emprunte (modification en place) |
| `into_iter()` | `T` | **consomme** la collection (move) |

```rust
let mut v = vec![1, 2, 3];
for x in v.iter_mut() { *x *= 10; }   // v = [10,20,30]
let somme: i32 = v.into_iter().sum(); // v est CONSOMMÉ ici
```

::: warn Piège fréquent
Après `into_iter()`, la collection est **déplacée** : tu ne peux plus l’utiliser. Autre piège classique : les closures de `filter` reçoivent des **références** (d’où `|&&x|` ou `|x| **x`), car `iter()` donne des `&T` et `filter` passe encore une référence.
:::

### collect : le couteau suisse

```rust
use std::collections::HashMap;
let carres: Vec<i32> = (1..=5).map(|x| x * x).collect();      // [1,4,9,16,25]
let map: HashMap<i32,i32> = (1..=3).map(|x| (x, x*x)).collect();
// collect peut aussi produire un Result<Vec<_>, E> et court-circuiter à la 1re erreur
```

## Quiz d'entraînement

::: exo Quiz 1
Que contient `r` ?
```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];
    let r: Vec<i32> = v.iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * 2)
        .collect();
    println!("{r:?}");
}
```
?? Voir la correction
**Sortie attendue :** `[4, 8, 12]`

[4, 8, 12]

`filter` garde 2,4,6 ; `map` les double → 4,8,12 ; `collect` matérialise le `Vec`. Les adaptateurs sont paresseux : le calcul n’a lieu qu’au `collect`.
:::

::: quiz Quiz 2
Pourquoi `v.iter().map(|x| x*2)` seul « ne fait rien » ?
- [ ] C’est un bug
- [x] Les adaptateurs sont **paresseux** ; il faut un consommateur (`collect`, `sum`, `for`…)
- [ ] Il faut `mut`
- [ ] `map` n’existe pas sur les Vec
> Un iterator ne calcule rien tant qu’il n’est pas **consommé**. Sans `collect()`/`sum()`/boucle, la chaîne est inerte (le compilateur émet d’ailleurs un avertissement).
:::

::: quiz Quiz 3
Quelle méthode **consomme** la collection en produisant des valeurs possédées `T` ?
- [ ] `iter()`
- [ ] `iter_mut()`
- [x] `into_iter()`
- [ ] `get()`
> `into_iter()` déplace les éléments hors de la collection (move) → après, elle n’est plus utilisable. `iter()`=&T, `iter_mut()`=&mut T.
:::

::: quiz Quiz 4
À quoi sert `move` devant une closure, ex. `move || s` ?
- [ ] À accélérer l’exécution
- [x] À forcer la capture **par valeur** (prise de possession) de l’environnement
- [ ] À rendre la closure asynchrone
- [ ] À la rendre immuable
> `move` transfère la propriété des variables capturées dans la closure. Indispensable pour passer une closure à un thread, dont la durée de vie dépasse la portée locale.
:::

::: exo Quiz 5
En une seule chaîne d’itérateurs, calcule la somme des carrés des nombres **impairs** de `v: &[i32]`.
Code de départ :
```rust
fn somme_carres_impairs(v: &[i32]) -> i32 {
    
}
```
*Indice : filter puis map puis sum.*
?? Voir la correction
fn somme_carres_impairs(v: &[i32]) -> i32 { v.iter() .filter(|&&x| x % 2 != 0) .map(|&x| x * x) .sum() }

`filter` garde les impairs, `map` les élève au carré, `sum` consomme et additionne. Aussi rapide qu’une boucle manuelle (abstraction à coût nul), mais plus lisible.
:::
