---
title: Checkpoint — Niveau Débutant
subtitle: Examen de synthèse sur les modules 1 à 5. Objectif : ≥ 70% pour avancer sereinement.
domains: DEV
niveau: Révision
tags: Cargo, expressions, fonctions, move, mutabilité, ownership
---

::: why Ce que tu dois maîtriser
Cargo & la boucle `check/build/run`, l’immutabilité par défaut, le shadowing, les types primitifs et le cast `as`, tuples/tableaux/slices, expressions vs statements, et surtout les **règles d’ownership** (move, Copy, drop). Les lacunes détectées seront listées à la fin.
:::

## Questions de révision

::: quiz Question 1
Boucle de dev la plus rapide pour vérifier les erreurs de type sans binaire ?
- [ ] `cargo run`
- [x] `cargo check`
- [ ] `cargo build --release`
- [ ] `cargo new`
> `cargo check` : analyse complète sans génération de code machine.
:::

::: exo Question 2
Sortie ?
```rust
fn main() {
    let x = 5;
    let x = x + 1;
    println!("{x}");
}
```
?? Voir la correction
**Sortie attendue :** `6`

6

Shadowing : le second `let x` crée une nouvelle variable valant `x+1 = 6`. Pas besoin de `mut` car ce sont des variables distinctes.
:::

::: quiz Question 3
Type de `&v[1..3]` où `v: Vec<i32>` ?
- [ ] `Vec<i32>`
- [ ] `[i32; 2]`
- [x] `&[i32]`
- [ ] `i32`
> Un slice emprunté `&[i32]` : une vue, pas une copie ni un nouveau Vec.
:::

::: exo Question 4
Compile-t-il ?
```rust
fn afficher(s: String) { println!("{s}"); }
fn main() {
    let m = String::from("salut");
    afficher(m);
    afficher(m);
}
```
*Indice : Combien de fois m peut-il être déplacé ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0382 : use of moved value m au 2e appel.

Le 1er `afficher(m)` **déplace** `m` ; au 2e appel `m` n’existe plus. Correctifs : `fn afficher(s: &str)` puis `afficher(&m)`, ou cloner.
:::

::: quiz Question 5
Quelle affirmation est vraie ?
- [ ] En Rust `if` ne peut pas produire de valeur
- [x] Un bloc `{ ... }` sans `;` final vaut la valeur de sa dernière expression
- [ ] Toute ligne doit se terminer par `return`
- [ ] Les conditions `if` acceptent les entiers comme booléens
> Les blocs sont des expressions ; leur valeur est la dernière expression sans `;`. Les conditions exigent un `bool` strict.
:::

::: exo Question 6
On a `let mut v = vec![1,2,3];` et on veut une fonction qui calcule la somme **sans consommer** `v`. Donne sa signature idéale et explique pourquoi.
*Indice : Emprunt en lecture + type de paramètre flexible.*
?? Voir la correction
`fn somme(v: &[i32]) -> i32`, appelée `somme(&v)`. On **emprunte** une vue en lecture (slice), donc `v` reste la propriété de l’appelant et est réutilisable ; en bonus, la fonction accepte aussi bien un `Vec` qu’un tableau.

Prendre `Vec<i32>` par valeur consommerait `v`. Le slice emprunté `&[i32]` est l’idiome : pas de move, pas de copie, compatible avec plusieurs types de collections.
:::
