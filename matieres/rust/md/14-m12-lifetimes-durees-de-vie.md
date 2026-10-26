---
title: Module 12 — Lifetimes (durées de vie) ★
subtitle: Comment Rust garantit qu’une référence ne survit jamais à la donnée qu’elle désigne.
domains: DEV
tags: annotations, erreurs, lifetimes, structs, élision
---

Une **lifetime** (durée de vie) est la portée pendant laquelle une référence est valide. Le borrow checker les utilise pour interdire les **références pendouillantes**. La plupart du temps, elles sont **inférées** ; parfois il faut les **annoter**.

### Le problème que ça résout

```rust
fn main() {
    let r;
    {
        let x = 5;
        r = &x;        // r emprunte x
    }                  // x est droppé ici
    // println!("{r}"); // ERREUR : x ne vit plus assez longtemps
}
```

::: warn Erreur de compilation typique
`error[E0597]: `x` does not live long enough` — la référence `r` vivrait plus longtemps que `x`. En C, ce serait un pointeur pendouillant silencieux ; Rust le **refuse à la compilation**.
:::

### Annoter une fonction

Quand une fonction renvoie une référence, Rust doit savoir à quelle entrée elle est liée. On l’exprime avec un paramètre de durée de vie `'a` (un nom, souvent `'a`).

```rust
// "La référence renvoyée vit aussi longtemps que la PLUS COURTE de x et y."
fn plus_long<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

::: why Le « pourquoi » de Rust
`'a` ne **change pas** la durée de vie réelle des données : c’est une **annotation** qui **relie** les durées de vie des entrées et de la sortie, pour que le compilateur puisse vérifier la cohérence. Ici, on promet que le résultat ne survivra pas aux deux entrées. Sans ça, le compilateur ne pourrait pas savoir si la référence renvoyée reste valide.
:::

::: warn Erreur de compilation typique
`error[E0106]: missing lifetime specifier` — tu renvoies une référence sans dire à quelle entrée elle est liée. Ajoute les annotations `'a` comme ci-dessus.
:::

### Élision : pourquoi on n’en écrit presque jamais

Rust applique des **règles d’élision** qui déduisent les lifetimes dans les cas courants. Ex. `fn f(s: &str) -> &str` : la sortie est liée à l’entrée unique, pas besoin d’annoter.

### Lifetimes dans les structs

Une struct qui **stocke une référence** doit annoter sa durée de vie : elle ne peut pas survivre à la donnée référencée.

```rust
struct Extrait<'a> {
    partie: &'a str,     // emprunte une chaîne qui doit vivre au moins autant
}

let phrase = String::from("Rust est sûr. Et rapide.");
let premiere = phrase.split('.').next().unwrap();
let e = Extrait { partie: premiere };  // e ne peut pas survivre à phrase
println!("{}", e.partie);
```

::: warn Piège fréquent
Erreur fréquente : vouloir renvoyer une référence vers une variable **locale** à la fonction. Impossible : la locale meurt à la fin de la fonction. Solution : renvoyer une valeur **possédée** (`String` plutôt que `&str`).
:::

::: py Comparaison Python
Python n’a rien de tel : le GC garde en vie tout objet encore référencé. Les lifetimes sont le **coût conceptuel** qui permet à Rust de se passer de GC tout en restant sûr. Bonne nouvelle : l’élision fait qu’on les écrit rarement au niveau débutant/intermédiaire — mais il faut les **comprendre** pour lire les messages d’erreur.
:::

### La lifetime spéciale `'static`

```rust
let s: &'static str = "je vis toute la durée du programme"; // littéraux = 'static
```

## Quiz d'entraînement

::: exo Quiz 1
Compile-t-il ?
```rust
fn main() {
    let r;
    {
        let x = 5;
        r = &x;
    }
    println!("{r}");
}
```
*Indice : x vit-il assez longtemps pour r ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0597 : x does not live long enough.

`r` emprunte `x`, mais `x` est droppé à la fin du bloc interne. Utiliser `r` ensuite lirait de la mémoire libérée → refusé. C’est exactement le bug de « dangling pointer » évité à la compilation.
:::

::: quiz Quiz 2
Que signifie `&'a` dans `fn f<'a>(x: &'a str) -> &'a str` ?
- [ ] Que `x` vit plus longtemps grâce à l’annotation
- [x] Que la référence renvoyée est liée à la même durée de vie que `x`
- [ ] Que `x` devient `'static`
- [ ] Que `x` est copié
> `'a` **relie** les durées de vie sans les modifier : la sortie ne pourra pas vivre plus longtemps que `x`. C’est une contrainte de vérification, pas une allocation.
:::

::: quiz Quiz 3
Pourquoi n’écrit-on pas d’annotation dans `fn premier(s: &str) -> &str` ?
- [ ] Parce que les lifetimes sont interdites ici
- [x] Grâce aux **règles d’élision** : la sortie est liée à l’unique entrée
- [ ] Parce que `&str` est `'static`
- [ ] Parce que la fonction ne compile pas
> Avec une seule référence en entrée, l’élision lie automatiquement la sortie à cette entrée. Le compilateur écrit `'a` pour toi.
:::

::: quiz Quiz 4
Renvoyer `&String` vers une variable locale créée dans la fonction :
- [ ] Fonctionne toujours
- [x] Est refusé : la locale meurt en fin de fonction ; renvoyer une valeur possédée (`String`)
- [ ] Nécessite `unsafe`
- [ ] Nécessite `Box`
> La référence pendouillerait. Solution idiomatique : renvoyer la **valeur possédée** (`String`), transférant l’ownership à l’appelant.
:::

::: exo Quiz 5
Pourquoi une struct qui contient un champ `&str` doit-elle porter une durée de vie, ex. `struct S<'a> { x: &'a str }` ?
*Indice : La struct peut-elle vivre plus longtemps que ce qu’elle référence ?*
?? Voir la correction
Parce que la struct **emprunte** une donnée qu’elle ne possède pas. La lifetime `'a` exprime que l’instance de la struct ne peut pas **survivre** à la chaîne référencée par `x` ; sinon `x` pointerait vers de la mémoire libérée.

Le paramètre `'a` lie la durée de vie de l’instance à celle de la donnée empruntée. Le compilateur refusera toute utilisation de la struct après la disparition de la donnée. C’est la même garantie « pas de dangling » appliquée aux champs.
:::
