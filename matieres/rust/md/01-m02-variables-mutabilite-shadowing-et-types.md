---
title: Module 2 — Variables, mutabilité, shadowing & types primitifs
subtitle: Immutabilité par défaut, inférence de types, et les types scalaires de base.
domains: DEV
tags: cast, char, mutabilité, shadowing, types
---

### Immuable par défaut

En Rust, une variable déclarée avec `let` est **immuable** par défaut. Pour pouvoir la modifier, il faut `let mut`.

```rust
let x = 5;
x = 6;        // ERREUR : cannot assign twice to immutable variable
let mut y = 5;
y = 6;        // OK
```

::: warn Erreur de compilation typique
`error[E0384]: cannot assign twice to immutable variable `x`` Solution : déclarer `let mut x = 5;` si la mutation est voulue — sinon, c’est souvent le signe d’un bug.
:::

::: why Le « pourquoi » de Rust
L’immutabilité par défaut n’est pas un caprice : elle rend le code plus facile à raisonner, permet des optimisations, et est **essentielle au modèle de concurrence** de Rust (on peut partager sans risque ce qui ne change pas). Tu déclares explicitement ton intention de muter.
:::

::: py Comparaison Python
En Python, tout est mutable par défaut (`x = 5; x = 6` fonctionne toujours). Rust inverse ce défaut. De plus, `const` en Python n’existe pas vraiment (convention MAJUSCULES) ; en Rust les **constantes** sont réelles : `const MAX: u32 = 100_000;` — type obligatoire, évaluées à la compilation.
:::

### Constantes

```rust
const MAX_POINTS: u32 = 100_000;  // type OBLIGATOIRE, toujours immuable, portée globale possible
```

### Shadowing (ombrage)

On peut redéclarer une variable avec le même nom via `let` : c’est du **shadowing**. La nouvelle variable **remplace** l’ancienne dans la portée, et peut changer de type.

```rust
let spaces = "   ";        // &str
let spaces = spaces.len();  // usize — nouveau type, même nom : OK grâce au shadowing

let mut guess = "42";
// guess = guess.len();     // ERREUR : mut ne change PAS le type
```

::: warn Piège fréquent
Ne confonds pas **mutabilité** et **shadowing**. `mut` réutilise le **même** emplacement, même type. Le shadowing crée une **nouvelle** variable (nouvel emplacement) qui peut avoir un autre type. Le shadowing est très utilisé pour transformer une valeur par étapes tout en gardant l’immutabilité.
:::

### Types scalaires

| Catégorie | Types | Notes |
| --- | --- | --- |
| Entiers signés | `i8 i16 i32 i64 i128 isize` | défaut : `i32` |
| Entiers non signés | `u8 u16 u32 u64 u128 usize` | `usize` = taille d’un pointeur (indices) |
| Flottants | `f32 f64` | défaut : `f64` |
| Booléen | `bool` | `true`/`false` |
| Caractère | `char` | 4 octets, un **scalaire Unicode** (pas un octet !) |

```rust
let a: i64 = 9_000_000_000;   // annotation de type explicite
let b = 2.0;                  // f64 inféré
let c = b'A';                 // u8 (octet)
let d = 'é';                  // char (Unicode), 4 octets
let sum = 5 + 10;             // i32
let overflow: u8 = 255 + 1;   // panique en debug, "wrappe" en release
```

::: why Le « pourquoi » de Rust
`usize` existe parce que l’indexation et les tailles dépendent de l’architecture (32 vs 64 bits). Les indices de tableaux et longueurs sont des `usize`. Le typage précis des entiers permet un contrôle mémoire fin, impossible en Python où `int` est illimité.
:::

::: warn Erreur de compilation typique
`error[E0308]: mismatched types` apparaît si tu mélanges les types : `let x: i32 = 5; let y: i64 = x;` échoue. Rust ne convertit **jamais** implicitement : il faut `x as i64` (cast explicite).
:::

## Quiz d'entraînement

::: exo Quiz 1
Que se passe-t-il à la compilation ?
```rust
fn main() {
    let n = 10;
    n = 20;
    println!("{n}");
}
```
*Indice : La variable est-elle déclarée mutable ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur de compilation : `E0384 cannot assign twice to immutable variable`.

`let n = 10;` est immuable. Réassigner `n = 20;` est interdit. Correction : `let mut n = 10;`. C’est l’immutabilité-par-défaut de Rust.
:::

::: quiz Quiz 2
Ce code compile-t-il, et pourquoi ? `let x = " hi "; let x = x.trim(); let x = x.len();`
- [ ] Non : on ne peut pas réassigner `x`
- [x] Oui : le shadowing crée à chaque `let` une nouvelle variable, le type peut changer
- [ ] Non : il manque `mut`
- [ ] Oui mais seulement parce que les types sont identiques
> Chaque `let x = ...` **ombrage** le précédent : ce sont de nouvelles variables. Le type passe de `&str` à `&str` puis `usize` sans problème. Avec `mut` seul, changer le type serait interdit.
:::

::: quiz Quiz 3
Pourquoi `let y: i64 = my_i32;` ne compile-t-il pas (avec `my_i32: i32`) ?
- [ ] Rust convertit seulement vers des types plus petits
- [x] Rust n’effectue aucune conversion numérique implicite ; il faut `my_i32 as i64`
- [ ] Il faut `mut`
- [ ] i64 n’existe pas
> Rust interdit les conversions numériques implicites (source fréquente de bugs en C). Il faut un cast explicite `as` : `let y = my_i32 as i64;`. C’est verbeux mais sans surprise.
:::

::: quiz Quiz 4
En Rust, un `char` fait 1 octet, comme en C.
- [ ] Vrai
- [x] Faux
> Faux. Un `char` Rust fait **4 octets** et représente un **scalaire Unicode** (ex. `'é'`, `'🦀'`). L’équivalent « un octet » est `u8` (ex. `b'A'`).
:::

::: exo Quiz 5
Donne une situation concrète où le **shadowing** est préférable à `mut`. Explique le bénéfice.
*Indice : Pense à un changement de type ou à garder l’immutabilité.*
?? Voir la correction
Exemple : lire une saisie `let input = "42";` (un `&str`) puis `let input: i32 = input.parse().unwrap();`. Le shadowing permet de **changer le type** (&str → i32) tout en gardant le même nom pertinent, et le résultat reste **immuable**.

Avantage : on évite d’inventer des noms (`input_str`, `input_num`), on garde l’immutabilité (sécurité), et on peut transformer le type — impossible avec `mut`. Le shadowing exprime « voici la version finale de cette donnée ».
:::
