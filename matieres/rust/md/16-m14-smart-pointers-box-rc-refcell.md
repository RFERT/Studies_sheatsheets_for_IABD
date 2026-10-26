---
title: Module 14 — Smart pointers : Box, Rc, RefCell
subtitle: Des pointeurs « intelligents » pour l’allocation sur le tas, le partage et la mutabilité contrôlée.
domains: DEV
tags: Arc, Box, Rc, RefCell, concurrence
---

Un **smart pointer** est une struct qui agit comme un pointeur mais ajoute des capacités (allocation, comptage de références, vérifications). Ils implémentent `Deref` (accès transparent) et souvent `Drop` (nettoyage).

### `Box<T>` — allouer sur le tas

Stocke une valeur sur le **tas**. Utile pour : les types **récursifs** (taille inconnue à la compilation), les grosses données à ne pas copier, ou les objets-traits.

```rust
let b = Box::new(5);        // 5 est sur le tas, b sur la pile
println!("{b}");             // Deref automatique

// Type récursif : impossible sans indirection
enum Liste {
    Cons(i32, Box<Liste>),   // Box brise la récursion infinie de taille
    Nil,
}
use Liste::*;
let l = Cons(1, Box::new(Cons(2, Box::new(Nil))));
```

::: warn Erreur de compilation typique
`error[E0072]: recursive type `Liste` has infinite size` — un enum qui se contient directement aurait une taille infinie. `Box` introduit une indirection (un pointeur de taille fixe) qui résout le problème.
:::

### `Rc<T>` — propriété partagée (mono-thread)

`Rc` (Reference Counted) permet à **plusieurs** propriétaires de partager une donnée immuable. Il compte les références ; la donnée est libérée quand le compteur tombe à 0.

```rust
use std::rc::Rc;
let a = Rc::new(String::from("partagé"));
let b = Rc::clone(&a);      // n'copie PAS la donnée : incrémente le compteur
let c = Rc::clone(&a);
println!("compteur = {}", Rc::strong_count(&a));  // 3
```

::: why Le « pourquoi » de Rust
`Rc::clone` est **bon marché** : il ne duplique pas la donnée, juste le compteur. C’est le plus proche du modèle Python (comptage de références) — mais **uniquement mono-thread**. Pour du multi-thread, on utilise `Arc` (Atomic Rc), au compteur thread-safe (Module 15).
:::

### `RefCell<T>` — mutabilité intérieure

Normalement, la règle d’emprunt est vérifiée à la **compilation**. `RefCell` la déplace à l’**exécution** : tu peux muter une donnée derrière une référence immuable, mais violer la règle « un seul écrivain » **panique** au runtime.

```rust
use std::cell::RefCell;
let c = RefCell::new(5);
*c.borrow_mut() += 10;              // emprunt mutable vérifié à l'exécution
println!("{}", c.borrow());         // 15

// PANIQUE : deux emprunts mutables simultanés
// let m1 = c.borrow_mut();
// let m2 = c.borrow_mut();         // thread panicked: already borrowed
```

::: warn Piège fréquent
`RefCell` échange une garantie **compile-time** contre une vérification **runtime** : une violation de l’emprunt ne se voit plus à la compilation mais **panique** à l’exécution. À n’utiliser que quand le compilateur est trop strict pour un motif que tu sais correct.
:::

### Le combo `Rc<RefCell<T>>`

Motif classique : **plusieurs propriétaires** (`Rc`) d’une donnée **mutable** (`RefCell`). Fréquent pour les graphes/arbres partagés.

```rust
use std::rc::Rc;
use std::cell::RefCell;
let partage = Rc::new(RefCell::new(vec![1, 2, 3]));
let autre = Rc::clone(&partage);
partage.borrow_mut().push(4);
println!("{:?}", autre.borrow());   // [1, 2, 3, 4]
```

::: py Comparaison Python
En Python, tout objet est déjà un `Rc<RefCell<T>>` implicite : partagé (comptage de refs) et librement mutable. Rust rend ces choix **explicites** et te fait payer exactement ce que tu utilises : `Box` (tas), `Rc` (partage), `RefCell` (mutabilité contrôlée).
:::

::: why Le « pourquoi » de Rust
Ces types matérialisent des compromis : `Box` = possession unique + tas ; `Rc` = partage + immuable ; `RefCell` = mutabilité intérieure + vérif runtime. En les combinant, tu obtiens précisément la sémantique voulue, sans GC généralisé.
:::

## Quiz d'entraînement

::: quiz Quiz 1
Pourquoi un enum récursif comme une liste chaînée nécessite-t-il `Box` ?
- [ ] Pour la vitesse
- [x] Sans indirection, sa taille serait infinie ; `Box` (pointeur, taille fixe) la borne
- [ ] Parce que les enums sont interdits
- [ ] Pour partager la propriété
> Un type qui se contient directement aurait une taille non bornée. `Box` stocke la suite sur le tas et n’occupe qu’un pointeur de taille fixe dans la variante.
:::

::: quiz Quiz 2
Que fait `Rc::clone(&a)` ?
- [ ] Copie profondément la donnée
- [x] Incrémente le compteur de références et partage la même donnée
- [ ] Déplace `a`
- [ ] Crée un thread
> `Rc::clone` est peu coûteux : il n’duplique pas la donnée, il ajoute un propriétaire (compteur +1). La donnée vit tant que le compteur > 0.
:::

::: quiz Quiz 3
Quelle est la différence clé entre le borrow checker normal et `RefCell` ?
- [ ] Aucune
- [x] `RefCell` vérifie les règles d’emprunt à l’**exécution** (et panique si violées), pas à la compilation
- [ ] `RefCell` désactive toute vérification
- [ ] `RefCell` est thread-safe
> `RefCell` = « mutabilité intérieure » : la règle un-écrivain-xor-plusieurs-lecteurs est vérifiée **au runtime** via `borrow()`/`borrow_mut()`, et une violation panique. `RefCell` n’est PAS thread-safe.
:::

::: exo Quiz 4
Sortie ?
```rust
use std::rc::Rc;
use std::cell::RefCell;
fn main() {
    let a = Rc::new(RefCell::new(vec![1, 2, 3]));
    let b = Rc::clone(&a);
    b.borrow_mut().push(4);
    println!("{:?}", a.borrow());
}
```
?? Voir la correction
**Sortie attendue :** `[1, 2, 3, 4]`

[1, 2, 3, 4]

`a` et `b` partagent le **même** `RefCell` (Rc). Muter via `b` se voit via `a`. `Rc` = partage, `RefCell` = mutation intérieure : le combo pour données mutables partagées mono-thread.
:::

::: exo Quiz 5
Pourquoi utilise-t-on `Arc` plutôt que `Rc` pour partager entre threads ?
*Indice : Pense à la sûreté du compteur en présence de plusieurs threads.*
?? Voir la correction
`Rc` utilise un compteur **non atomique** (rapide mais non thread-safe) : deux threads pourraient le corrompre. `Arc` (Atomic Reference Counted) utilise un compteur **atomique**, sûr en concurrence — il implémente `Send`/`Sync`. Le compilateur refuse `Rc` entre threads.

C’est un compromis performance/sûreté : `Rc` évite le coût des opérations atomiques quand tu es mono-thread ; `Arc` paie ce coût pour la sûreté multi-thread. Rust t’oblige à choisir le bon — passer un `Rc` à un thread ne compile pas.
:::
