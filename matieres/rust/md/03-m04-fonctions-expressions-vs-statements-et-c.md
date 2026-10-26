---
title: Module 4 — Fonctions, expressions vs statements & contrôle de flux
subtitle: Une distinction fondamentale : en Rust, presque tout est une expression qui produit une valeur.
domains: DEV
tags: expressions, flux, fonctions, if, loop, statements
---

### Fonctions

```rust
fn addition(a: i32, b: i32) -> i32 {
    a + b          // PAS de point-virgule : c'est l'expression de retour
}

fn saluer(nom: &str) {   // pas de "-> " => retourne () (unit)
    println!("Salut {nom}");
}
```

::: warn Piège fréquent
Le type des paramètres est **obligatoire** (pas d’inférence sur les signatures). Le type de retour aussi, sauf s’il vaut `()`.
:::

### Expressions vs statements — LE point à comprendre

- Une **instruction** (statement) exécute une action et ne renvoie **pas** de valeur : `let x = 5;`
- Une **expression** produit une **valeur** : `5 + 3`, un appel de fonction, un bloc `{ ... }`, un `if`, un `match`…

```rust
let y = {
    let a = 3;
    a + 1        // pas de ; -> le bloc VAUT 4
};               // y == 4

let z = if y > 2 { "grand" } else { "petit" };  // if est une EXPRESSION
```

::: warn Erreur de compilation typique
Ajouter un point-virgule transforme une expression en instruction qui vaut `()` : `fn f() -> i32 { 5; }` → `error[E0308]: mismatched types, expected i32, found ()`. Retire le `;` après `5`.
:::

::: why Le « pourquoi » de Rust
Faire du `if`, du `match` et des blocs des **expressions** supprime le besoin d’un opérateur ternaire séparé et rend le code plus composable : on peut affecter directement le résultat d’un branchement. Le `;` devient porteur de sens (il « jette » la valeur).
:::

::: py Comparaison Python
Python distingue aussi expressions et instructions, mais son `if` classique n’est pas une expression (il faut `a if cond else b`). En Rust, **le même** `if` sert partout et renvoie une valeur. Autre différence : le `return` explicite est rare en Rust — on laisse la dernière expression.
:::

### Contrôle de flux

```rust
// if / else if / else (les conditions sont des bool STRICTS : pas de "truthy")
if n % 2 == 0 { println!("pair"); } else { println!("impair"); }

// loop : boucle infinie qui peut RENVOYER une valeur via break
let resultat = loop {
    compteur += 1;
    if compteur == 10 { break compteur * 2; }  // renvoie 20
};

// while
while n > 0 { n -= 1; }

// for sur un intervalle ou un itérable
for i in 0..5 { print!("{i} "); }        // 0 1 2 3 4
for x in [10, 20, 30] { print!("{x} "); }
```

::: warn Piège fréquent
Les conditions doivent être des `bool` stricts. `if 3 { ... }` ne compile pas (pas de « truthy/falsy » comme en Python). Écris `if n != 0`.
:::

::: why Le « pourquoi » de Rust
La boucle `loop` qui peut renvoyer une valeur via `break valeur` est unique : elle remplace élégamment les motifs « répéter jusqu’à obtenir un résultat ». `for i in 0..5` utilise un **intervalle** (`Range`), qui est un itérateur — pas une liste matérialisée (comme `range` en Python 3).
:::

## Quiz d'entraînement

::: exo Quiz 1
Quelle est la valeur de `y` affichée ?
```rust
fn main() {
    let y = {
        let a = 3;
        a + 1
    };
    println!("{y}");
}
```
?? Voir la correction
**Sortie attendue :** `4`

4

Le bloc `{ let a = 3; a + 1 }` est une **expression** : sa valeur est celle de sa dernière expression sans `;`, soit `4`. Donc `y == 4`.
:::

::: exo Quiz 2
Compile-t-il ? Si non, pourquoi ?
```rust
fn double(x: i32) -> i32 {
    x * 2;
}
```
*Indice : Regarde le point-virgule sur la dernière ligne.*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur : `E0308 mismatched types (expected i32, found ())`.

Le `;` après `x * 2` en fait une **instruction** qui vaut `()`. La fonction promet `-> i32` mais renvoie `()`. Correction : enlève le point-virgule → `x * 2`.
:::

::: quiz Quiz 3
Pourquoi `let s = if x { "a" } else { "b" };` fonctionne-t-il en Rust ?
- [x] Parce que `if` est une **expression** qui produit une valeur
- [ ] Parce que `let` autorise deux valeurs
- [ ] Ça ne fonctionne pas
- [ ] Seulement avec `match`
> En Rust, `if/else` est une **expression**. Les deux branches doivent renvoyer le **même type**. Ici les deux valent `&str`, donc `s: &str`.
:::

::: quiz Quiz 4
Comment faire renvoyer une valeur par une boucle `loop` ?
- [ ] `return v`
- [x] `break v;`
- [ ] `yield v`
- [ ] Impossible
> `break v;` sort de la `loop` **en renvoyant** `v` comme valeur de l’expression `loop`. Utile pour « réessayer jusqu’au succès ».
:::

::: exo Quiz 5
Écris une fonction `fn max(a: i32, b: i32) -> i32` qui renvoie le plus grand, en utilisant `if` **comme expression** (sans `return`).
Code de départ :
```rust
fn max(a: i32, b: i32) -> i32 {
    
}
```
*Indice : La dernière expression du corps est la valeur de retour.*
?? Voir la correction
fn max(a: i32, b: i32) -> i32 { if a > b { a } else { b } }

Le `if/else` est l’unique expression du corps : sa valeur devient le retour, sans `;` ni `return`. Les deux branches renvoient bien `i32`.
:::
