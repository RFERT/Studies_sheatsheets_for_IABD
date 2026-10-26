---
title: Module 10 — Gestion des erreurs : Option, Result & propagation ★
subtitle: Rust n’a pas d’exceptions. Les erreurs sont des valeurs typées que l’on manipule explicitement.
domains: DEV
tags: ?, Option, Result, erreurs, main, propagation
---

### Deux familles d’« absence/échec »

- `Option<T>` : une valeur **peut être absente** — `Some(T)` ou `None`.
- `Result<T, E>` : une opération **peut échouer** — `Ok(T)` ou `Err(E)`.

```rust
enum Option<T> { Some(T), None }
enum Result<T, E> { Ok(T), Err(E) }
```

::: why Le « pourquoi » de Rust
En rendant l’absence (`Option`) et l’échec (`Result`) **visibles dans le type**, Rust élimine le « null » (l’« erreur à un milliard de dollars ») et les exceptions non capturées. Le compilateur t’**oblige** à gérer le cas d’échec — impossible d’ignorer un `None` ou un `Err` par accident.
:::

::: py Comparaison Python
Python signale l’échec par des **exceptions** (`raise`/`try/except`), qui peuvent remonter silencieusement. Rust en fait des **valeurs de retour typées**. Le `None` remplace le `None` Python, mais avec vérification obligatoire. `panic!` existe (proche d’une exception), mais est réservé aux bugs irrécupérables, pas au flux normal.
:::

### Extraire une valeur

```rust
let x: Option<i32> = Some(5);

match x {
    Some(v) => println!("{v}"),
    None => println!("rien"),
}

let a = x.unwrap();            // renvoie 5, mais PANIQUE si None
let b = x.unwrap_or(0);        // 5, ou 0 si None (sûr)
let c = x.unwrap_or_else(|| calcul());  // défaut paresseux
if let Some(v) = x { /* ... */ }
```

::: warn Piège fréquent
`unwrap()` et `expect("msg")` **paniquent** en cas de `None`/`Err`. Pratiques pour un prototype ou quand l’échec est « impossible », mais en code robuste on préfère `match`, `unwrap_or`, `?`, etc. `expect` est meilleur qu’`unwrap` car il documente la raison.
:::

### L’opérateur `?` — propagation

`?` après une expression `Result`/`Option` : si `Ok(v)`/`Some(v)`, il **extrait** `v` ; sinon il **retourne immédiatement** l’erreur/`None` depuis la fonction courante.

```rust
use std::num::ParseIntError;

fn somme_texte(a: &str, b: &str) -> Result<i32, ParseIntError> {
    let x: i32 = a.parse()?;   // si Err -> return Err(...)
    let y: i32 = b.parse()?;
    Ok(x + y)
}

// Équivalent SANS ? :
fn somme_v2(a: &str) -> Result<i32, ParseIntError> {
    let x = match a.parse::<i32>() {
        Ok(v) => v,
        Err(e) => return Err(e),
    };
    Ok(x)
}
```

::: warn Erreur de compilation typique
`error[E0277]: the `?` operator can only be used in a function that returns Result or Option` — `?` exige que la fonction renvoie un type compatible. Dans `main`, écris `fn main() -> Result<(), Box<dyn std::error::Error>>` pour utiliser `?`.
:::

::: why Le « pourquoi » de Rust
`?` supprime le boilerplate des `match` répétés tout en gardant les erreurs **explicites** dans les signatures. C’est le meilleur des deux mondes : concision proche des exceptions, sûreté du typage. Le `?` convertit aussi l’erreur via le trait `From` (utile pour agréger plusieurs types d’erreurs).
:::

### Combinateurs utiles

```rust
let n: Option<i32> = Some(4);
let d = n.map(|x| x * 2);           // Some(8)
let e = n.and_then(|x| if x > 0 { Some(x) } else { None });
let r: Result<i32, String> = Ok(3);
let f = r.map_err(|e| format!("échec: {e}"));   // transforme l'erreur
```

::: warn Piège fréquent
`Option` et `Result` ne sont pas interchangeables. Conversion : `opt.ok_or(err)` transforme `Option` → `Result` ; `res.ok()` transforme `Result` → `Option` (jette l’erreur).
:::

## Quiz d'entraînement

::: quiz Quiz 1
Quel type modélise « une opération qui peut échouer avec une raison » ?
- [ ] `Option<T>`
- [x] `Result<T, E>`
- [ ] `bool`
- [ ] `panic!`
> `Result<T,E>` porte l’erreur `E` en cas d’échec. `Option` exprime juste présence/absence, sans raison.
:::

::: exo Quiz 2
Que se passe-t-il à l’exécution ?
```rust
fn main() {
    let x: Option<i32> = None;
    println!("{}", x.unwrap());
}
```
*Indice : unwrap sur None ?*
?? Voir la correction
**Sortie attendue :** `panique`

Panique à l’exécution : called `Option::unwrap()` on a `None` value.

`unwrap()` sur `None` **panique**. Le code compile mais s’arrête à l’exécution. Alternatives sûres : `unwrap_or(0)`, `match`, ou `?`.
:::

::: quiz Quiz 3
Dans `let x: i32 = a.parse()?;`, que fait `?` si `parse()` renvoie `Err(e)` ?
- [ ] Il panique
- [ ] Il ignore l’erreur et met 0
- [x] Il fait `return Err(e)` depuis la fonction courante
- [ ] Il boucle
> `?` propage : sur `Err(e)` il retourne immédiatement `Err(e)` (après conversion via `From`). Sur `Ok(v)` il extrait `v`. La fonction doit renvoyer un `Result` compatible.
:::

::: exo Quiz 4
Compile-t-il ?
```rust
fn main() {
    let n: i32 = "12".parse()?;
    println!("{n}");
}
```
*Indice : Le type de retour de main permet-il ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0277 : le ? nécessite un retour Result/Option ; main renvoie ().

Pour utiliser `?` dans `main`, il faut `fn main() -> Result<(), Box<dyn std::error::Error>> { ...; Ok(()) }`. Sinon, la propagation n’a nulle part où aller.
:::

::: exo Quiz 5
Écris `fn division(a: i32, b: i32) -> Result<i32, String>` qui renvoie `Err("division par zéro")` si `b == 0`, sinon `Ok(a / b)`.
Code de départ :
```rust
fn division(a: i32, b: i32) -> Result<i32, String> {
    
}
```
*Indice : Un if qui renvoie Err, sinon Ok.*
?? Voir la correction
fn division(a: i32, b: i32) -> Result{ if b == 0 { Err(String::from("division par zéro")) } else { Ok(a / b) } }

On renvoie explicitement `Ok` ou `Err` — l’échec fait partie du type de retour, forçant l’appelant à le gérer. L’appelant pourra faire `division(10, x)?` pour propager.
:::
