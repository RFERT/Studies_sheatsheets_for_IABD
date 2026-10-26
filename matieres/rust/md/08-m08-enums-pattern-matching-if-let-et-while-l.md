---
title: Module 8 — Enums, pattern matching, if let & while let
subtitle: Modéliser « l’un parmi plusieurs cas » et déstructurer avec puissance.
domains: DEV
tags: enums, exhaustivité, if let, match, pattern matching, while let
---

### Enums qui portent des données

Un **enum** Rust n’est pas qu’une liste de constantes : chaque variante peut porter **ses propres données** (comme une union typée).

```rust
enum Message {
    Quitter,                       // aucune donnée
    Deplacer { x: i32, y: i32 },   // struct anonyme
    Ecrire(String),                // un tuple
    Couleur(u8, u8, u8),
}

let m = Message::Ecrire(String::from("salut"));
```

::: why Le « pourquoi » de Rust
Regrouper des variantes hétérogènes dans un seul type permet des états **mutuellement exclusifs** et sûrs. En C, on simule ça avec un `enum` + `union` + champ « tag » gérés à la main (source de bugs). Rust en fait un type de première classe, vérifié.
:::

::: py Comparaison Python
Proche des `Enum` Python, mais bien plus riche : les variantes portent des données typées. C’est aussi ce qui remplace, en mieux, le fait de renvoyer `None` ou de lever une exception : voir `Option` et `Result` (Module 10).
:::

### `match` — exhaustif

```rust
fn traiter(m: &Message) -> String {
    match m {
        Message::Quitter => String::from("bye"),
        Message::Deplacer { x, y } => format!("go {x},{y}"),
        Message::Ecrire(txt) => txt.clone(),
        Message::Couleur(r, g, b) => format!("#{r:02x}{g:02x}{b:02x}"),
    }
}
```

::: warn Erreur de compilation typique
`error[E0004]: non-exhaustive patterns` : si tu oublies une variante, le compilateur **refuse**. Tu dois traiter tous les cas, ou ajouter un bras attrape-tout `_ => ...`. C’est une sécurité : ajouter une variante plus tard force à mettre à jour tous les `match`.
:::

::: why Le « pourquoi » de Rust
L’**exhaustivité** du `match` est une garantie majeure : impossible d’oublier un cas silencieusement. Ajoute une variante à ton enum, et le compilateur t’indique **tous** les endroits à corriger — refactoring sûr à grande échelle.
:::

### Patterns : littéraux, intervalles, gardes, liaisons

```rust
let n = 7;
match n {
    0 => println!("zéro"),
    1 | 2 => println!("un ou deux"),         // ou
    3..=9 => println!("entre 3 et 9"),        // intervalle inclusif
    x if x % 2 == 0 => println!("pair {x}"),  // garde
    autre => println!("{autre}"),             // liaison attrape-tout
}
```

### `if let` — un seul cas qui compte

```rust
let config: Option<i32> = Some(3);
if let Some(v) = config {
    println!("valeur = {v}");
} else {
    println!("aucune");
}
```

### `while let` — boucler tant que ça correspond

```rust
let mut pile = vec![1, 2, 3];
while let Some(sommet) = pile.pop() {   // pop() renvoie Option
    println!("{sommet}");               // 3 puis 2 puis 1
}
```

::: warn Piège fréquent
`if let` est un raccourci pour un `match` à deux cas : il **abandonne l’exhaustivité**. Pratique quand un seul motif t’intéresse, mais utilise `match` quand tu veux la garantie de traiter tous les cas.
:::

::: py Comparaison Python
`match` Rust ressemble au `match` structurel de Python 3.10+, mais il est **exhaustif** et intégré au typage. `while let Some(x) = it.pop()` remplace élégamment les boucles « tant qu’il reste des éléments ».
:::

## Quiz d'entraînement

::: exo Quiz 1
Sortie ?
```rust
fn main() {
    let n = 5;
    match n {
        0 => println!("zéro"),
        1 | 2 => println!("un ou deux"),
        3..=9 => println!("entre 3 et 9"),
        _ => println!("autre"),
    }
}
```
?? Voir la correction
**Sortie attendue :** `entre 3 et 9`

entre 3 et 9

`5` ne matche ni `0`, ni `1 | 2`, mais tombe dans l’intervalle inclusif `3..=9`. Le premier bras qui correspond gagne.
:::

::: quiz Quiz 2
Pourquoi un `match` sur un enum sans traiter toutes les variantes ne compile-t-il pas ?
- [ ] Un bug du compilateur
- [x] Rust exige l’**exhaustivité** : tous les cas doivent être couverts (ou un `_`)
- [ ] Il faut toujours un `default`
- [ ] Les enums n’acceptent pas `match`
> L’exhaustivité garantit qu’aucun cas n’est oublié. Ajoute les variantes manquantes ou un bras `_ => ...`. Bénéfice : ajout futur d’une variante = erreurs ciblées à corriger.
:::

::: exo Quiz 3
Sortie (une valeur par ligne) ?
```rust
fn main() {
    let mut p = vec![1, 2, 3];
    while let Some(x) = p.pop() {
        println!("{x}");
    }
}
```
?? Voir la correction
**Sortie attendue :** `3 2 1`

3 2 1

`pop()` retire le dernier élément et renvoie `Some(v)`, puis `None` quand c’est vide (fin de boucle). Ordre LIFO : 3, 2, 1.
:::

::: quiz Quiz 4
`if let Some(v) = opt { ... }` est équivalent à :
- [ ] Un `match` exhaustif
- [x] Un `match` à un seul motif utile, qui abandonne l’exhaustivité
- [ ] Une boucle
- [ ] Un cast
> `if let` = sucre syntaxique pour `match opt { Some(v) => {...}, _ => {} }`. Idéal quand un seul cas t’intéresse ; tu perds la vérification d’exhaustivité.
:::

::: exo Quiz 5
Définis `enum Forme` avec `Cercle(f64)` (rayon) et `Rectangle(f64, f64)`. Écris `fn aire(f: &Forme) -> f64` avec un `match`.
*Indice : π ≈ 3.14159 ; utilise std::f64::consts::PI si tu veux.*
?? Voir la correction
enum Forme { Cercle(f64), Rectangle(f64, f64), } fn aire(f: &Forme) -> f64 { match f { Forme::Cercle(r) => std::f64::consts::PI * r * r, Forme::Rectangle(l, h) => l * h, } }

Le `match` déstructure chaque variante et lie ses données (`r`, ou `l` et `h`). Comme les deux variantes sont traitées, le match est exhaustif — pas besoin de `_`.
:::
