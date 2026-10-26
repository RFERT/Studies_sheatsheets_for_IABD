---
title: Checkpoint — Niveau Débutant avancé
subtitle: Synthèse des modules 6 à 8 : borrowing, structs/impl, enums & pattern matching.
domains: DEV
niveau: Révision
tags: borrowing, enums, exhaustivité, impl, méthodes, pattern matching
---

::: why Attendu
Manier les références `&`/`&mut` et respecter la règle « lecteurs multiples XOR un écrivain », concevoir des **structs** avec `impl` (méthodes vs fonctions associées, choix de `self`), et modéliser avec des **enums** déstructurés par `match`/`if let`/`while let` de façon exhaustive.
:::

## Questions de révision

::: exo Question 1
Compile-t-il ?
```rust
fn main() {
    let mut s = String::from("hi");
    let r1 = &mut s;
    let r2 = &mut s;
    println!("{r1} {r2}");
}
```
*Indice : Combien de &mut simultanés sont permis ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0499 : cannot borrow s as mutable more than once at a time.

Deux `&mut` actifs en même temps sur `s` = interdit. Un seul écrivain à la fois. Il faut utiliser/terminer `r1` avant de créer `r2`.
:::

::: quiz Question 2
Différence entre `Type::f()` et `instance.f()` ?
- [ ] Aucune
- [x] `::` appelle une fonction associée (sans self), `.` une méthode (avec self)
- [ ] `::` est réservé aux enums
- [ ] `.` ne marche que sur les tuples
> `::` → fonction associée (souvent un constructeur). `.` → méthode prenant `self`/`&self`/`&mut self`.
:::

::: exo Question 3
Sortie ?
```rust
fn main() {
    let n = 4;
    match n {
        1 | 2 => println!("petit"),
        x if x % 2 == 0 => println!("pair {x}"),
        _ => println!("autre"),
    }
}
```
?? Voir la correction
**Sortie attendue :** `pair 4`

pair 4

`4` n’est pas `1|2` ; il atteint la **garde** `x if x % 2 == 0`, vraie → « pair 4 ». La liaison `x` capture la valeur.
:::

::: quiz Question 4
Bénéfice concret de l’exhaustivité du `match` lors d’un refactoring ?
- [ ] Le code s’exécute plus vite
- [x] Ajouter une variante d’enum fait échouer la compilation partout où un cas manque, guidant les corrections
- [ ] Ça réduit la taille du binaire
- [ ] Ça active le GC
> C’est un filet de sécurité au refactoring : le compilateur liste tous les `match` à mettre à jour. Impossible d’oublier un cas silencieusement.
:::

::: exo Question 5
Pour `struct Compteur { n: u32 }`, écris une méthode `incr(&mut self)` et une méthode `valeur(&self) -> u32`. Explique en commentaire pourquoi les self diffèrent.
Code de départ :
```rust
struct Compteur { n: u32 }

impl Compteur {
    
}
```
*Indice : Écriture = &mut self, lecture = &self.*
?? Voir la correction
struct Compteur { n: u32 } impl Compteur { fn incr(&mut self) { // modifie -> emprunt mutable self.n += 1; } fn valeur(&self) -> u32 { // lit seulement -> emprunt immuable self.n } }

`incr` modifie `self.n` → il faut `&mut self`. `valeur` ne fait que lire → `&self` suffit et permet des appels concurrents en lecture. Le choix du receveur applique les règles d’ownership aux méthodes.
:::
