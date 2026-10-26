---
title: Checkpoint — Niveau Intermédiaire
subtitle: Synthèse des modules 9 et 10 : collections et gestion des erreurs.
domains: DEV
niveau: Révision
tags: &str, ?, HashMap, Option, Result, String
---

::: why Attendu
Choisir la bonne collection et l’accès sûr (`get`, `entry`), distinguer `String`/`&str`, et surtout maîtriser **Option/Result**, l’opérateur `?` et les combinateurs. À ce stade tu écris du Rust « qui gère ses erreurs proprement ».
:::

## Questions de révision

::: quiz Question 1
Pourquoi préférer `&str` à `&String` comme paramètre de lecture ?
- [ ] C’est identique
- [x] `&str` accepte aussi les littéraux et sous-slices, pas seulement les `String`
- [ ] `&String` n’existe pas
- [ ] `&str` copie la chaîne
> `&str` est plus général : une `String` se déréférence en `&str`, mais l’inverse est faux. Idiome : `fn f(s: &str)`.
:::

::: exo Question 2
Quelle variante renvoie `run("x", "3")` ? (réponds Ok ou Err)
```rust
fn run(a: &str, b: &str) -> Result<i32, std::num::ParseIntError> {
    let x: i32 = a.parse()?;
    let y: i32 = b.parse()?;
    Ok(x + y)
}
```
*Indice : "x" est-il un entier valide ?*
?? Voir la correction
**Sortie attendue :** `Err`

Err (le parse de "x" échoue, ? propage l’erreur).

`"x".parse::()` échoue → `?` retourne immédiatement `Err(...)`. La 2e ligne n’est jamais atteinte. Avec `"5","3"`, on aurait `Ok(8)`.
:::

::: quiz Question 3
Que renvoie `map.get("absent")` pour une clé absente ?
- [ ] Panique
- [x] `None`
- [ ] `0`
- [ ] Chaîne vide
> `get` renvoie `Option<&V>` → `None` si absent. Pas de `KeyError`. Pour une valeur par défaut : `.copied().unwrap_or(0)`.
:::

::: quiz Question 4
Comment transformer une `Option<T>` en `Result<T, E>` ?
- [ ] `opt.ok()`
- [x] `opt.ok_or(err)`
- [ ] `opt.unwrap()`
- [ ] impossible
> `opt.ok_or(err)` : `Some(v)→Ok(v)`, `None→Err(err)`. L’inverse est `res.ok()` (Result→Option, jette l’erreur).
:::

::: exo Question 5
Écris `fn premier_pair(v: &[i32]) -> Option<i32>` qui renvoie le premier nombre pair, ou `None`.
Code de départ :
```rust
fn premier_pair(v: &[i32]) -> Option<i32> {
    
}
```
*Indice : Boucle + return Some(...), ou iterators (Module 13).*
?? Voir la correction
fn premier_pair(v: &[i32]) -> Option{ for &x in v { if x % 2 == 0 { return Some(x); } } None } // Version idiomatique : v.iter().copied().find(|x| x % 2 == 0)

On renvoie `Some(x)` dès qu’on trouve un pair, sinon `None` à la fin. La version avec `.find(...)` (Module 13) est plus concise et exprime la même chose.
:::
