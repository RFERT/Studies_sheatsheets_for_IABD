---
title: Module 7 — Structs, impl & méthodes
subtitle: Créer ses propres types de données et leur attacher des comportements.
domains: DEV
tags: Debug, impl, méthodes, ownership, structs
---

### Définir une struct

```rust
struct Utilisateur {
    nom: String,
    age: u32,
    actif: bool,
}

let mut u = Utilisateur {
    nom: String::from("Ada"),
    age: 36,
    actif: true,
};
u.age += 1;                 // nécessite que u soit "mut"
println!("{}", u.nom);
```

::: warn Piège fréquent
La mutabilité est au niveau de la **variable entière**, pas du champ : il n’existe pas de champ « mut » individuel. `let u = ...;` (sans `mut`) rend **tous** les champs immuables.
:::

### Raccourcis utiles

```rust
fn creer(nom: String, age: u32) -> Utilisateur {
    Utilisateur { nom, age, actif: true }   // "field init shorthand" : nom = nom
}

// Mise à jour à partir d'une autre instance :
let u2 = Utilisateur { age: 40, ..u };      // reprend les autres champs de u
```

### Tuple structs & unit structs

```rust
struct Point(i32, i32);        // tuple struct
let p = Point(3, 4);
println!("{}", p.0);

struct Marqueur;               // unit struct (aucune donnée)
```

### Méthodes avec `impl`

```rust
impl Utilisateur {
    // méthode : premier paramètre = &self / &mut self / self
    fn description(&self) -> String {
        format!("{} ({} ans)", self.nom, self.age)
    }
    fn anniversaire(&mut self) {      // emprunte en mutable
        self.age += 1;
    }
    // fonction associée (pas de self) = souvent un constructeur
    fn nouveau(nom: String) -> Self {
        Self { nom, age: 0, actif: true }
    }
}

let mut u = Utilisateur::nouveau(String::from("Ada"));  // :: pour l'associée
u.anniversaire();                                        // . pour la méthode
println!("{}", u.description());
```

::: why Le « pourquoi » de Rust
`&self` vs `&mut self` vs `self` reprennent exactement les règles d’ownership : `&self` emprunte en lecture, `&mut self` en écriture, `self` **consomme** l’objet (utile pour des transformations qui « détruisent » l’ancien état). Le choix documente l’intention et est vérifié par le borrow checker.
:::

::: py Comparaison Python
Une struct + `impl` ≈ une classe Python, mais **données** (struct) et **comportement** (impl) sont **séparés**. `&self` ≈ `self` en Python, mais explicite et typé. Les « fonctions associées » sans self (ex. `Utilisateur::nouveau`) jouent le rôle des `@staticmethod`/constructeurs (`__init__`). Rust n’a pas d’héritage de classes : on compose et on utilise des **traits** (Module 11).
:::

### Déboguer une struct : `#[derive(Debug)]`

```rust
#[derive(Debug)]
struct Point { x: i32, y: i32 }

let p = Point { x: 1, y: 2 };
println!("{p:?}");     // {:?} = format Debug -> Point { x: 1, y: 2 }
println!("{p:#?}");    // joli (pretty) multi-lignes
```

::: warn Erreur de compilation typique
`error[E0277]: `Point` doesn't implement `Debug`` si tu fais `println!("{p:?}")` sans `#[derive(Debug)]`. Ajoute l’attribut au-dessus de la struct.
:::

## Quiz d'entraînement

::: quiz Quiz 1
Comment appelle-t-on une fonction associée sans `self`, ex. un constructeur `nouveau` ?
- [ ] `u.nouveau()`
- [x] `Utilisateur::nouveau(...)`
- [ ] `nouveau(Utilisateur)`
- [ ] `new Utilisateur()`
> Les fonctions associées (sans `self`) s’appellent avec `::` sur le type : `Utilisateur::nouveau(...)`. Les méthodes (avec `self`) s’appellent avec `.` sur l’instance.
:::

::: quiz Quiz 2
Une méthode qui modifie l’objet en place doit prendre :
- [ ] `self`
- [ ] `&self`
- [x] `&mut self`
- [ ] aucun paramètre
> `&mut self` emprunte l’instance en mutable → modification en place. `&self` = lecture seule ; `self` = consomme (détruit) l’instance.
:::

::: exo Quiz 3
Compile-t-il ?
```rust
struct P { x: i32 }
fn main() {
    let p = P { x: 5 };
    println!("{p:?}");
}
```
*Indice : Le format {:?} nécessite quoi ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0277 : P doesn’t implement Debug.

`{:?}` requiert le trait `Debug`. Ajoute `#[derive(Debug)]` au-dessus de `struct P`. C’est une erreur de trait bound, pas de syntaxe.
:::

::: exo Quiz 4
Définis `struct Rectangle { l: u32, h: u32 }` avec une méthode `aire(&self) -> u32` et un constructeur associé `carre(cote: u32) -> Self`.
*Indice : impl bloc, &self pour aire, Self pour le constructeur.*
?? Voir la correction
struct Rectangle { l: u32, h: u32 } impl Rectangle { fn aire(&self) -> u32 { self.l * self.h } fn carre(cote: u32) -> Self { Self { l: cote, h: cote } } }

`aire` lit les champs → `&self`. `carre` ne reçoit pas d’instance → fonction associée renvoyant `Self`. Appels : `Rectangle::carre(4).aire()`.
:::

::: exo Quiz 5
Quand est-il pertinent qu’une méthode prenne `self` (par valeur) plutôt que `&self` ? Donne un exemple.
*Indice : Pense aux transformations qui doivent invalider l’ancien objet.*
?? Voir la correction
Quand la méthode **transforme/consomme** l’objet et qu’il ne doit plus être utilisé ensuite. Exemple : un patron « builder » `fn build(self) -> Config`, ou une conversion `fn into_bytes(self) -> Vec<u8>` sur une `String` qui réutilise la mémoire au lieu de copier.

Prendre `self` déplace l’instance dans la méthode : l’appelant ne peut plus l’utiliser. C’est voulu pour les conversions/finalisations, où réutiliser l’ancien objet n’aurait pas de sens et où on veut éviter une copie.
:::
