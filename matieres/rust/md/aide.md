---
title: Antisèche Rust
subtitle: Du premier cargo new aux threads — ownership, borrowing, lifetimes, traits, iterators et erreurs sur une page.
domains: DATA, BIG DATA, IA
tags: Cargo, ownership, borrowing, lifetimes, traits, iterators, Option/Result, Box/Rc/RefCell, threads
niveau: Révision express
---

Mémo du parcours Rust (16 modules + checkpoints). Les ★ marquent ce qui fait la différence avec Python, C ou Java. Pour chaque erreur de compilation, le code `E0xxx` s'explique avec `rustc --explain E0xxx`. Détail → [cours Rust](cours.html?c=RUST).

## Cargo & outils

| Commande | Rôle |
|---|---|
| `cargo new app` / `--lib` | créer un binaire / une bibliothèque |
| `cargo check` | vérifier sans produire de binaire (rapide) |
| `cargo build` / `--release` | compiler (debug / optimisé) |
| `cargo run` | compiler + exécuter |
| `cargo test` | lancer les tests |
| `cargo fmt` / `cargo clippy` | formater / linter idiomatique |
| `cargo add serde` | ajouter une dépendance |
| `cargo doc --open` | documentation locale |

- `Cargo.toml` = manifeste (nom, édition, dépendances) ; `Cargo.lock` = versions exactes figées.
- `rustup update` met à jour la chaîne ; `rustc --explain E0382` explique une erreur.

## Variables, mutabilité, shadowing

```rust
let x = 5;          // immuable par défaut
let mut y = 5;      // mutable
y += 1;
const MAX: u32 = 100_000;   // type obligatoire, évalué à la compilation
let s = "42";
let s: i32 = s.parse().unwrap(); // shadowing : nouvelle variable, peut changer de type
```

| Erreur | Cause | Correctif |
|---|---|---|
| E0384 | réassigner une variable non `mut` | `let mut` ou shadowing |
| E0308 | types incompatibles | conversion explicite (`as`, `into`, `parse`) |

::: why
Immutabilité par défaut = l'intention de modifier est **visible** dans le code et le compilateur peut raisonner sur les accès concurrents.
:::

## Types primitifs & composés

- Entiers `i8…i128`, `u8…u128`, `isize/usize` (index) — défaut **`i32`** ; flottants `f32`, **`f64`** ; `bool` ; `char` (Unicode, 4 octets).
- Dépassement d'entier : **panique en debug**, bouclage en release → utiliser `checked_add`, `wrapping_add`, `saturating_add`.
- Pas de conversion implicite : `x as f64`, `u8::try_from(n)?`.
- Tuple `(i32, &str)` → `t.0` ; tableau `[i32; 3]` taille **fixe** sur la pile ; `Vec<T>` taille variable sur le tas.
- **Slice** `&v[1..3]` = vue (pointeur + longueur) sur une suite contiguë ; `&str` = slice de chaîne UTF-8.

::: warn
`&s[0..1]` sur une `String` découpe des **octets** : couper au milieu d'un caractère multi-octet (é, emoji) **panique**. Utiliser `s.chars()`.
:::

## Expressions vs statements

- Presque tout est une **expression** : `if`, `match`, `loop`, les blocs `{ }`.
- **Dernière expression sans `;`** = valeur renvoyée. Avec `;` → statement, valeur `()`.

```rust
fn carre(x: i32) -> i32 { x * x }          // pas de ;
let signe = if n < 0 { "neg" } else { "pos" };
let r = loop { break 42; };                  // loop renvoie une valeur
for i in 0..5 {}   // 0 à 4      for i in 0..=5 {}  // 0 à 5
```

::: warn
`fn f() -> i32 { 5; }` → **E0308** (attendu `i32`, trouvé `()`) : retire le `;`.
:::

## Ownership ★

1. Chaque valeur a **un seul propriétaire**.
2. Quand le propriétaire sort de portée, la valeur est **libérée** (`drop`).
3. L'affectation / le passage par valeur **déplace** (move) les types qui possèdent du tas.

```rust
let s1 = String::from("hi");
let s2 = s1;            // move : s1 n'est plus valide
// println!("{s1}");    // E0382 borrow of moved value
let s3 = s2.clone();    // copie profonde explicite
let a = 5; let b = a;   // i32 est Copy : a reste valide
```

| Langage | Libération mémoire |
|---|---|
| C | manuelle (`free`) → double free, use-after-free |
| Python / Java | ramasse-miettes (GC) à l'exécution |
| **Rust** | **à la compilation**, via ownership — pas de GC |

::: tip
Types `Copy` : entiers, flottants, `bool`, `char`, tuples/tableaux de `Copy`, `&T`. `String`, `Vec`, `Box` ne sont **pas** `Copy`.
:::

## Borrowing ★

- `&T` : référence **partagée** (lecture). `&mut T` : référence **exclusive** (écriture).
- **Règle d'or** : à un instant donné, **soit plusieurs `&T`, soit une seule `&mut T`**. Et une référence ne survit jamais à la donnée.
- **NLL** : un emprunt se termine à sa **dernière utilisation**, pas forcément à la fin du bloc.

```rust
fn longueur(s: &String) -> usize { s.len() }   // emprunte, ne prend pas
fn ajoute(s: &mut String) { s.push('!'); }
let mut v = vec![1, 2, 3];
let premier = &v[0];
// v.push(4);          // E0502 : v emprunté en lecture plus bas
println!("{premier}");
v.push(4);             // OK : l'emprunt `premier` est terminé (NLL)
```

| Erreur | Signification |
|---|---|
| E0499 | deux `&mut` simultanées |
| E0502 | `&mut` pendant qu'une `&` est vivante (ou l'inverse) |
| E0596 | `&mut` sur une variable non `mut` |
| E0505 | move d'une valeur encore empruntée |
| E0507 | move hors d'une référence (`*r` non `Copy`) → `clone()` ou `std::mem::take` |

::: why
Pourquoi `v.push` est interdit pendant un `&v[0]` ? `push` peut **réallouer** le vecteur : la référence pointerait vers de la mémoire libérée. Rust empêche ce bug **à la compilation**.
:::

## Lifetimes ★

- Une lifetime `'a` **ne prolonge rien** : elle **décrit** une relation entre durées de vie que le compilateur vérifie.
- Nécessaire quand une fonction **renvoie une référence** et qu'il y a ambiguïté sur sa provenance.

```rust
fn plus_long<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
struct Extrait<'a> { texte: &'a str }   // la struct ne survit pas au texte
```

**Règles d'élision** (quand on peut omettre `'a`) :
1. chaque paramètre référence reçoit sa propre lifetime ;
2. s'il y a **une seule** lifetime en entrée, elle est donnée à la sortie ;
3. s'il y a `&self` / `&mut self`, la sortie reçoit celle de `self`.

| Erreur | Correctif |
|---|---|
| E0106 missing lifetime specifier | annoter `'a` ou renvoyer une valeur possédée (`String`) |
| E0597 borrowed value does not live long enough | allonger la vie de la donnée ou ne pas garder la référence |
| E0515 returns a reference to data owned by the current function | renvoyer la valeur possédée |

::: tip
`'static` = vit toute l'exécution (littéraux `&'static str`). Ne pas « corriger » une erreur en mettant `'static` partout.
:::

## Structs, impl & méthodes

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point { x: f64, y: f64 }

impl Point {
    fn new(x: f64, y: f64) -> Self { Self { x, y } }   // fonction associée
    fn norme(&self) -> f64 { (self.x * self.x + self.y * self.y).sqrt() }
    fn translate(&mut self, dx: f64) { self.x += dx; }
    fn into_tuple(self) -> (f64, f64) { (self.x, self.y) } // consomme
}
let p = Point::new(3.0, 4.0);
```

| Receveur | Accès | Après l'appel |
|---|---|---|
| `&self` | lecture | l'objet reste utilisable |
| `&mut self` | écriture | idem (variable `mut` requise) |
| `self` | prend possession | l'objet est **consommé** |

## Enums & pattern matching

```rust
enum Forme { Cercle(f64), Rect { l: f64, h: f64 }, Vide }

fn aire(f: &Forme) -> f64 {
    match f {
        Forme::Cercle(r) => std::f64::consts::PI * r * r,
        Forme::Rect { l, h } if *l > 0.0 => l * h,   // garde
        Forme::Rect { .. } | Forme::Vide => 0.0,
    }
}
if let Some(x) = opt { println!("{x}"); }
while let Some(top) = pile.pop() { println!("{top}"); }
let Some(v) = opt else { return; };   // let-else
```

- `match` est **exhaustif** : oublier un cas → **E0004**. `_` attrape le reste.
- Motifs : littéraux, plages `1..=9`, `|`, `@` (`n @ 1..=9`), déstructuration de tuples/structs.

## Collections

| Type | Création | Pièges |
|---|---|---|
| `Vec<T>` | `vec![1, 2]`, `Vec::with_capacity(n)` | `v[i]` panique hors bornes → `v.get(i)` renvoie `Option` |
| `String` | `String::from("a")`, `format!` | UTF-8 : pas d'indexation `s[0]` ; `chars()` / `bytes()` |
| `HashMap<K, V>` | `HashMap::new()` | ordre non garanti ; clé `Eq + Hash` |

```rust
use std::collections::HashMap;
let mut freq: HashMap<&str, u32> = HashMap::new();
for mot in texte.split_whitespace() {
    *freq.entry(mot).or_insert(0) += 1;   // API Entry : idiomatique
}
let s = format!("{a}-{b}");   // concaténer sans move
```

::: warn
`let s3 = s1 + &s2;` **déplace** `s1` (l'opérateur `+` prend `self`). Préférer `format!`.
:::

## Option & Result ★

- Pas de `null`, pas d'exceptions : `Option<T>` (`Some` / `None`) et `Result<T, E>` (`Ok` / `Err`).

| Méthode | Effet |
|---|---|
| `unwrap()` / `expect("msg")` | valeur ou **panique** (prototypes, tests) |
| `unwrap_or(d)` / `unwrap_or_else(f)` | valeur par défaut |
| `map(f)` / `and_then(f)` | transformer / chaîner |
| `ok_or(e)` | `Option` → `Result` |
| `?` | renvoie l'erreur tôt (propagation) |

```rust
use std::fs;
fn lire_nombre(chemin: &str) -> Result<i64, Box<dyn std::error::Error>> {
    let txt = fs::read_to_string(chemin)?;     // io::Error converti via From
    let n: i64 = txt.trim().parse()?;          // ParseIntError aussi
    Ok(n)
}
```

::: warn
`?` ne s'utilise que dans une fonction qui renvoie `Result` / `Option` (E0277 sinon, ex. dans `main` sans `-> Result<…>`). L'erreur source doit être convertible (`From`) vers l'erreur de retour.
:::

## Erreurs : bonnes pratiques

- **`panic!`** = bug irrécupérable (invariant cassé). **`Result`** = échec attendu (fichier absent, saisie invalide).
- Bibliothèque : enum d'erreurs dédiée (`thiserror`). Application : `anyhow::Result` + `.context("…")`.
- Éviter les `unwrap()` en production ; `expect` avec un message explicatif si l'invariant est garanti.

## Génériques, traits & trait bounds ★

```rust
trait Resume {
    fn auteur(&self) -> String;
    fn resume(&self) -> String { format!("(par {})", self.auteur()) } // défaut
}
fn plus_grand<T: PartialOrd + Copy>(v: &[T]) -> T {
    let mut m = v[0];
    for &x in v { if x > m { m = x; } }
    m
}
fn affiche(x: &impl std::fmt::Display) { println!("{x}"); }
fn liste<T>(v: &[T]) -> String where T: std::fmt::Debug { format!("{v:?}") }
```

| Statique (générique / `impl Trait`) | Dynamique (`dyn Trait`) |
|---|---|
| monomorphisation : un code par type, **aucun coût** à l'exécution | appel via vtable, léger coût |
| un seul type concret à la fois | collections hétérogènes : `Vec<Box<dyn Trait>>` |

- Traits courants : `Debug`, `Clone`, `Copy`, `PartialEq/Eq`, `PartialOrd/Ord`, `Hash`, `Default`, `Display`, `From/Into`, `Iterator`, `Drop`.
- **Règle de l'orphelin** : on implémente un trait pour un type seulement si l'un des deux est local à la crate.

::: warn
E0369 / E0277 « binary operation `>` cannot be applied to type `T` » → ajouter la borne `T: PartialOrd`.
:::

## Closures ★

```rust
let seuil = 10;
let grand = |x: i32| x > seuil;          // capture seuil par référence
let mut compteur = 0;
let mut inc = || compteur += 1;           // capture mutable
let s = String::from("hi");
let prend = move || println!("{s}");      // move : s est déplacée dans la closure
```

| Trait | La closure… | Appelable |
|---|---|---|
| `Fn` | lit ses captures | plusieurs fois |
| `FnMut` | modifie ses captures | plusieurs fois (`mut`) |
| `FnOnce` | consomme ses captures | une fois |

## Iterators ★

- **Paresseux** : rien ne se passe sans **consommateur** (`collect`, `sum`, `count`, `for`…).
- `iter()` → `&T` · `iter_mut()` → `&mut T` · `into_iter()` → `T` (consomme la collection).

```rust
let v = vec![1, 2, 3, 4, 5, 6];
let pairs_carres: Vec<i32> = v.iter()
    .filter(|&&x| x % 2 == 0)
    .map(|x| x * x)
    .collect();                        // [4, 16, 36]
let total: i32 = v.iter().sum();
let idx = v.iter().position(|&x| x == 4);   // Some(3)
for (i, x) in v.iter().enumerate() {}
let paires: Vec<_> = a.iter().zip(b.iter()).collect();
```

- Adaptateurs : `map`, `filter`, `filter_map`, `flat_map`, `take`, `skip`, `chain`, `zip`, `enumerate`, `rev`, `peekable`.
- Consommateurs : `collect`, `sum`, `count`, `fold`, `any`, `all`, `find`, `min/max(_by_key)`.
- `collect::<Result<Vec<_>, _>>()` : s'arrête à la **première erreur**.

::: tip
Abstraction **à coût nul** : une chaîne d'itérateurs compile en général vers une boucle aussi rapide qu'un `for` écrit à la main, sans contrôle de bornes répété.
:::

## Smart pointers

| Type | Pour quoi | Coût / limite |
|---|---|---|
| `Box<T>` | valeur sur le tas, type récursif, `dyn Trait` | un seul propriétaire |
| `Rc<T>` | **plusieurs propriétaires** (mono-thread) | compteur de références ; lecture seule |
| `RefCell<T>` | **mutabilité intérieure** : règles d'emprunt vérifiées **à l'exécution** | `borrow_mut` en double → **panique** |
| `Rc<RefCell<T>>` | données partagées et modifiables (graphes, arbres) | cycles → fuite : casser avec `Weak` |
| `Arc<T>` / `Mutex<T>` | équivalents **thread-safe** | atomiques / verrou |

```rust
enum Liste { Cons(i32, Box<Liste>), Nil }      // sans Box : taille infinie (E0072)
use std::{rc::Rc, cell::RefCell};
let partage = Rc::new(RefCell::new(vec![1]));
let autre = Rc::clone(&partage);               // compteur = 2, pas de copie profonde
autre.borrow_mut().push(2);
```

## Concurrence ★

```rust
use std::{sync::{mpsc, Arc, Mutex}, thread};
let compteur = Arc::new(Mutex::new(0));
let mut handles = vec![];
for _ in 0..4 {
    let c = Arc::clone(&compteur);
    handles.push(thread::spawn(move || { *c.lock().unwrap() += 1; }));
}
for h in handles { h.join().unwrap(); }

let (tx, rx) = mpsc::channel();
thread::spawn(move || tx.send("salut").unwrap());
println!("{}", rx.recv().unwrap());
```

- `Send` : peut être **transféré** à un autre thread. `Sync` : peut être **partagé** par référence. `Rc` n'est ni l'un ni l'autre → E0277, utiliser `Arc`.
- Oublier `move` dans `thread::spawn` → **E0373** (la closure pourrait survivre aux variables empruntées).
- Le compilateur empêche les **data races** ; les **deadlocks** restent possibles.

## Modules, crates, packages

```text
mon_app/
├── Cargo.toml          # package
└── src/
    ├── main.rs         # racine de la crate binaire
    ├── lib.rs          # racine de la crate bibliothèque
    └── reseau/
        ├── mod.rs      # (ou reseau.rs à côté du dossier)
        └── client.rs
```

- **Package** (Cargo.toml) ⊃ **crates** (lib + binaires) ⊃ **modules** (`mod`).
- Tout est **privé par défaut** : `pub`, `pub(crate)`, `pub(super)`. Les champs d'une struct `pub` restent privés sauf `pub` explicite ; les variantes d'un enum `pub` sont publiques.
- Chemins : `crate::`, `super::`, `self::` ; `use` raccourcit, `pub use` ré-exporte.
- Tests unitaires dans `#[cfg(test)] mod tests` ; tests d'intégration dans `tests/`.

## Écosystème & idiomes

| Besoin | Crate |
|---|---|
| Sérialisation JSON/CSV | `serde`, `serde_json`, `csv` |
| Erreurs | `thiserror` (lib), `anyhow` (app) |
| CLI | `clap` |
| Async / réseau | `tokio`, `reqwest` |
| Parallélisme data | `rayon` |
| DataFrames | `polars` |

- Accepter `&str` / `&[T]` en paramètre plutôt que `&String` / `&Vec<T>`.
- Préférer les itérateurs aux index ; `if let` / `?` plutôt que `unwrap`.
- Builder pattern, newtype (`struct Metres(f64)`), `impl From<…>` pour les conversions.
- `cargo clippy` + `cargo fmt` avant chaque commit.

## Checklist « ce code compile-t-il ? »

1. La valeur a-t-elle été **déplacée** avant cet usage ? (E0382)
2. Y a-t-il une `&mut` en même temps qu'une autre référence encore utilisée ? (E0499/E0502)
3. La variable modifiée est-elle `mut` ? (E0384/E0596)
4. La référence renvoyée survit-elle à sa donnée ? (E0106/E0515/E0597)
5. Le `match` couvre-t-il tous les cas ? (E0004)
6. Le type générique a-t-il les **bornes** nécessaires ? (E0277/E0369)
7. Le `?` est-il dans une fonction qui renvoie `Result`/`Option` ?
8. Les données envoyées dans un thread sont-elles `Send` et capturées avec `move` ? (E0373)

## Trous à réviser

- À un instant donné : plusieurs références ==partagées `&T`== **ou** une seule ==référence mutable `&mut T`==.
- `let s2 = s1;` avec une String : `s1` est ==déplacée (move)== et devient inutilisable.
- Une lifetime ne prolonge pas la vie d'une donnée : elle ==décrit une contrainte vérifiée par le compilateur==.
- Les itérateurs sont ==paresseux== : sans consommateur, rien n'est calculé.
- `RefCell` vérifie les règles d'emprunt ==à l'exécution== et panique en cas de violation.
- Pour partager une donnée modifiable entre threads : ==`Arc<Mutex<T>>`==.

::: quiz Auto-test — ownership
Que se passe-t-il ? `let v = vec![1]; let w = v; println!("{:?}", v);`
- [ ] Affiche `[1]`, car `w` est une copie
- [x] Erreur E0382 : `v` a été déplacé dans `w`
- [ ] Erreur à l'exécution (use-after-free)
> `Vec` n'est pas `Copy` : l'affectation transfère la possession à `w`. Le compilateur refuse l'usage de `v` ensuite — l'erreur est détectée à la compilation, jamais à l'exécution. Pour garder les deux : `let w = v.clone();`.
:::

::: quiz Auto-test — lifetimes
Pourquoi `fn f(x: &str, y: &str) -> &str` ne compile-t-il pas ?
- [ ] Parce qu'on ne peut pas renvoyer de `&str`
- [x] Deux références en entrée, aucune `&self` : le compilateur ne sait pas de laquelle dépend la sortie (E0106)
- [ ] Parce qu'il faut écrire `'static`
> La règle d'élision n°2 ne s'applique qu'avec une seule lifetime en entrée. On écrit `fn f<'a>(x: &'a str, y: &'a str) -> &'a str`. `'static` compilerait seulement si le résultat ne dépendait d'aucun paramètre.
:::

::: culture Pour aller plus loin
- [The Rust Programming Language (le « Book »)](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Index des codes d'erreur rustc](https://doc.rust-lang.org/error_codes/error-index.html)
- [Rustlings (exercices)](https://github.com/rust-lang/rustlings)
:::
