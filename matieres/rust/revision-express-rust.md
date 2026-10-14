# 🦀 Rust — Antisèche révision partiel

> L'essentiel pour l'examen. Focus : **ownership, borrowing, lifetimes**.

---

## ⚡ Si tu n'as que 10 minutes
Lis **Ownership**, **Borrowing**, **Lifetimes** + l'antisèche finale. = 70 % des points.

---

## 1. Pourquoi Rust
- Compilé, typé statiquement, rapide comme le C, **sûr en mémoire sans garbage collector**.
- Le **borrow checker** interdit *use-after-free*, *double free*, *data races* **à la compilation**.
- Macro : `println!` (le `!` = macro).

## 2. Cargo
| Commande | Rôle |
|---|---|
| `cargo new p` | nouveau projet |
| `cargo build` | compile (debug) |
| `cargo build --release` | compile optimisé |
| `cargo run` | compile + exécute |
| `cargo check` | vérifie sans binaire |
| `cargo test` | tests |
- `Cargo.toml` = manifeste + dépendances (**crates**). Une lib = une **crate**.

## 3. Variables & types
- **Immuable par défaut** ; `let mut` pour modifier ; `const MAX: u32 = 100;`.
- **Shadowing** : redéclarer avec `let` (peut changer de type), ≠ `mut`.
- Entiers `i8..i128`/`u8..u128` (défaut `i32`), `f32/f64`, `bool`, `char`.

## 4. Fonctions & flux
- ⚠️ **Dernière expression sans `;` = valeur de retour**. Avec `;` → renvoie `()`.
- `fn plus_un(x: i32) -> i32 { x + 1 }` (pas de `;`).
- `if`/`loop`/`match` sont des **expressions**. `for i in 0..5` (0..=5 inclut 5).

## 5. Ownership ★★★
- 1 valeur = **1 propriétaire** ; fin de portée `}` → `drop` auto.
- **Move** (types tas : String, Vec) : `let s2 = s1;` → **s1 invalide**.
- **Copy** (types pile : i32, bool, char, f64) : copiés, l'original reste valide.
- Passer à une fonction = move aussi (sauf Copy).
- `.clone()` = copie profonde explicite.
- Erreur typique : `borrow of moved value`.

## 6. Borrowing ★★★
- `&T` = emprunt **lecture** (immuable), `&mut T` = emprunt **écriture**.
- **Règle d'or** : soit **plusieurs `&T`**, soit **un seul `&mut T`**, **jamais les deux**.
- Emprunter ≠ posséder → le propriétaire garde sa valeur.
- Pas de **référence pendante** : interdit de renvoyer `&` vers une locale.
- **Slice** `&str` / `&[T]` = référence vers une portion.

## 7. Lifetimes ★★
- `'a` : disent combien de temps une référence est valide (vérif **compilation**, coût nul).
- Nécessaire quand une fonction renvoie une ref ambiguë :
  `fn plus_long<'a>(x: &'a str, y: &'a str) -> &'a str`
- **Élision** : Rust devine dans les cas simples.
- `'static` = toute la durée du programme (ex. littéraux `"..."`).

## 8. Structs & enums
- `struct User { nom: String, age: u32 }` + `impl User { fn new()... fn m(&self)... }`.
- `&self` lecture · `&mut self` modifie · `self` consomme · sans self = fonction associée (`::new`).
- `enum Message { Quitter, Bouger { x:i32, y:i32 }, Ecrire(String) }` (variantes avec données).
- Stars : `Option<T>` (Some/None), `Result<T,E>` (Ok/Err).

## 9. Pattern matching
- `match` **exhaustif** (tous les cas, ou `_` = reste).
- Déstructuration : `Message::Bouger { x, y } => ...`.
- `if let Some(v) = opt { ... }` = match raccourci pour un cas.

## 10. Collections
- `Vec<T>` : `vec![1,2,3]`, `.push()`, `v[0]` (panique si hors limites) vs `.get(0)` → `Option`.
- `HashMap` : `use std::collections::HashMap;` `.insert()`, `.get()`.
- `String` (possédée, tas) vs `&str` (slice emprunté, littéraux).

## 11. Erreurs ★
- Pas d'exceptions : erreurs = **valeurs**.
- `Option<T>` = Some/None (remplace null). `Result<T,E>` = Ok/Err.
- `?` : sur `Ok(v)` → v ; sur `Err(e)` → `return Err(e)` (propagation).
- `.unwrap()`/`.expect("msg")` → **panique** si None/Err. `panic!()` arrête tout.

## 12. Traits & génériques
- Génériques : `fn max<T: PartialOrd>(a:T, b:T) -> T`.
- **Trait** = interface : `trait Animal { fn crier(&self)->String; }` + `impl Animal for Chien`.
- Méthodes par défaut possibles. `<T: Animal>` = trait bound.
- `#[derive(Debug, Clone, Copy, PartialEq)]` génère les traits ; `{:?}` affiche Debug.

## 13. Closures & iterators
- Closure : `let f = |a, b| a + b;` (capture l'environnement).
- Iterators **lazy** : `v.iter().filter(|x| *x%2==0).map(|x| x*10).collect()`.
- Rien ne s'exécute avant un **consommateur** (`collect`, `sum`, `for`, `count`).

## 14. Smart pointers
| Type | Rôle |
|---|---|
| `Box<T>` | tas, propriété unique (types récursifs) |
| `Rc<T>` | plusieurs propriétaires (lecture), mono-thread |
| `RefCell<T>` | mutabilité intérieure, emprunts vérifiés à l'exécution |
| `Arc<T>`/`Mutex<T>` | versions thread-safe |
- Combos : `Rc<RefCell<T>>` (mono-thread), `Arc<Mutex<T>>` (multi-thread).

## 15. Concurrence
- `thread::spawn(|| {...})` + `.join()`.
- **Fearless concurrency** : data races interdites à la compilation.
- Partage : `Arc<Mutex<T>>`. Communication : channels `mpsc::channel()` (tx.send / rx.recv).

## 16. Pièges d'examen 🎯
1. **`;` final** : `x+1` (retour) vs `x+1;` (→ `()`).
2. **Move puis réutilisation** d'une String/Vec → erreur (entiers = Copy, ok).
3. **Mélange `&` et `&mut`** simultanés → interdit.
4. **match non exhaustif** → erreur.
5. Oubli de **`mut`** → "cannot assign twice".
6. **unwrap sur None/Err** → panique.
7. **Référence pendante** (renvoyer `&` vers local) → interdit.
8. **Macros** finissent par `!`.

**Question type « ça compile ? »**
```rust
let s1 = String::from("hi");
let s2 = s1;
println!("{} {}", s1, s2); // ❌ NON : s1 déplacé. Fix: s1.clone() ou &s1
```

---

## 🧠 Checklist "ce code compile-t-il ?"
1. `mut` présent si on modifie ?
2. Valeur **déplacée** puis réutilisée ?
3. Conflit `&` / `&mut` ?
4. `;` de retour en trop ?
5. `match` exhaustif ?

→ 90 % des pièges attrapés. Tu vas gérer ! 💪🦀
