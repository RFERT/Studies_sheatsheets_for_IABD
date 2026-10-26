---
title: Checkpoint — Niveau Intermédiaire confirmé
subtitle: Synthèse des modules 11 à 16 : traits, lifetimes, iterators, smart pointers, concurrence, organisation.
domains: DEV
niveau: Révision
tags: bonnes pratiques, concurrence, dispatch, enums, génériques, iterators
---

::: why Attendu
Écrire du code générique contraint par des **traits**, comprendre les **lifetimes** et leurs messages d’erreur, manier **closures/iterators** idiomatiques, choisir le bon **smart pointer**, écrire de la **concurrence sûre**, et **organiser** un projet proprement. C’est le seuil du niveau avancé.
:::

## Questions de révision

::: quiz Question 1
`Vec<Box<dyn Trait>>` vs `Vec<T> où T: Trait` — différence essentielle ?
- [ ] Aucune
- [x] Le premier autorise des types **hétérogènes** (dispatch dynamique), le second un seul type concret (dispatch statique)
- [ ] Le second est plus lent
- [ ] Le premier ne compile pas
> `dyn` = objets-traits hétérogènes via vtable (dynamique). Génériques monomorphisés = un seul type par instanciation (statique, plus rapide, mais homogène).
:::

::: exo Question 2
Sortie ?
```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];
    let s: i32 = v.iter().filter(|&&x| x > 2).sum();
    println!("{s}");
}
```
?? Voir la correction
**Sortie attendue :** `12`

12

`filter(x > 2)` garde 3, 4, 5 ; `sum` les additionne → 12. Les adaptateurs sont paresseux : le calcul se fait au moment du `sum`.
:::

::: quiz Question 3
`fn f<'a>(x: &'a str, y: &str) -> &'a str` garantit que le résultat :
- [ ] vit aussi longtemps que `y`
- [x] vit aussi longtemps que `x`
- [ ] est `'static`
- [ ] ne peut pas être une référence
> Seul `x` porte `'a`, partagé avec la sortie. Le résultat est lié à `x`, pas à `y`. Renvoyer `y` ici ne compilerait pas.
:::

::: quiz Question 4
Associe le bon outil : « partager un état mutable entre threads ».
- [ ] `Rc<RefCell<T>>`
- [ ] `Box<T>`
- [x] `Arc<Mutex<T>>`
- [ ] `&mut T`
> `Arc` (partage thread-safe) + `Mutex` (exclusion mutuelle). `Rc/RefCell` = mono-thread uniquement.
:::

::: exo Question 5
Écris `fn afficher_tous<T: std::fmt::Display>(items: &[T])` qui affiche chaque élément sur sa ligne. Puis explique pourquoi le trait bound est nécessaire.
Code de départ :
```rust
use std::fmt::Display;

fn afficher_tous<T: Display>(items: &[T]) {
    
}
```
*Indice : for + println!("{}", x). Le {} exige Display.*
?? Voir la correction
use std::fmt::Display; fn afficher_tous(items: &[T]) { for x in items { println!("{x}"); } } // Le bound T: Display est requis car le formatage {} n'est // possible que si T sait s'afficher (implémente Display).

Sans `T: Display`, le compilateur refuse `println!("{x}")` (`E0277`) car un `T` arbitraire ne sait pas forcément se formater. Le trait bound déclare précisément la capacité utilisée.
:::

::: exo Question 6
Que veut dire l’idiome « make illegal states unrepresentable » et comment les enums y aident ?
*Indice : Pense à un état qui ne devrait jamais coexister avec un autre.*
?? Voir la correction
Concevoir les types pour qu’un état invalide ne puisse même pas être écrit. Les **enums** à variantes portant des données modélisent des états **mutuellement exclusifs** : ex. `enum Connexion { Deconnecte, EnCours, Connecte { session: Id } }` — impossible d’avoir un `session` quand on est `Deconnecte`. Le compilateur interdit les combinaisons absurdes.

Plutôt qu’un struct avec des booléens/champs optionnels qui peuvent se contredire (ex. `connecte=true` mais `session=None`), l’enum encode la logique dans le type. Les bugs d’état deviennent des erreurs de compilation. C’est un pilier du design idiomatique en Rust.
:::
