---
title: Module 6 — Borrowing, références & le borrow checker ★
subtitle: Utiliser une valeur sans la posséder. Les règles qui font la réputation de Rust.
domains: DEV
tags: &mut, borrowing, data race, mut, règles
---

Consommer (move) une valeur à chaque usage serait pénible. La solution : **emprunter** (borrow) via une **référence**. Une référence pointe vers une valeur **sans en prendre possession**.

### Références immuables `&T`

```rust
fn longueur(s: &String) -> usize {   // emprunte, ne possède pas
    s.len()
}                                     // s sort de portée mais NE libère RIEN (n'est pas propriétaire)

fn main() {
    let texte = String::from("hello");
    let n = longueur(&texte);          // on prête &texte
    println!("{texte} fait {n}");      // texte TOUJOURS valide
}
```

### Références mutables `&mut T`

```rust
fn ajoute(s: &mut String) {
    s.push_str(" !");
}
fn main() {
    let mut t = String::from("hi");
    ajoute(&mut t);        // prêt mutable
    println!("{t}");       // "hi !"
}
```

### Les règles du borrow checker

À tout instant, pour une donnée, tu peux avoir **SOIT** :

- **autant de références immuables `&T` que tu veux**, **OU**
- **exactement une référence mutable `&mut T`**,

… mais **jamais les deux en même temps**. Et aucune référence ne peut **survivre** à la valeur qu’elle désigne (pas de « dangling reference »).

```rust
let mut s = String::from("hi");
let r1 = &s;        // ok
let r2 = &s;        // ok, plusieurs lecteurs
// let rm = &mut s; // ERREUR ici si r1/r2 encore utilisés
println!("{r1} {r2}");   // dernière utilisation de r1/r2
let rm = &mut s;    // maintenant OK (r1/r2 ne sont plus utilisés)
rm.push('!');
```

::: warn Erreur de compilation typique
`error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable` Cause : un `&mut` coexiste avec un `&` actif. Solution : réduire la portée d’usage des emprunts immuables (les utiliser plus tôt), ou réorganiser le code. Le compilateur t’indique la ligne fautive.
:::

::: why Le « pourquoi » de Rust
Cette règle « lecteurs multiples **xor** un seul écrivain » est exactement ce qui interdit les **data races** — **à la compilation**, même en mono-thread pour les invariants (ex. invalidation d’itérateur). Si une donnée est modifiable par un seul chemin à la fois, personne ne peut lire un état incohérent. C’est le même principe que « readers–writer lock », mais vérifié statiquement, coût zéro à l’exécution.
:::

### NLL : les emprunts finissent à leur dernière utilisation

Depuis « Non-Lexical Lifetimes », un emprunt s’arrête à sa **dernière utilisation**, pas à la fin du bloc. D’où le fait que l’exemple ci-dessus compile.

```rust
let mut v = vec![1, 2, 3];
let first = &v[0];      // emprunt immuable
println!("{first}");    // dernière utilisation de first -> emprunt terminé
v.push(4);              // OK : plus d'emprunt actif
```

::: warn Piège fréquent
Le classique : emprunter un élément puis modifier la collection. `let first = &v[0]; v.push(4); println!("{first}");` → **ERREUR**. `push` peut réallouer le tampon et invalider `first`. Rust refuse à la compilation ce qui, en C++, serait un pointeur pendouillant silencieux.
:::

::: py Comparaison Python
Python n’a pas ce problème car tout est référence comptée par le GC : tu peux garder une référence à un élément et modifier la liste (au risque d’un bug logique). Rust rend ces situations **impossibles à compiler**, t’obligeant à un code correct. C’est déroutant au début (« fighting the borrow checker »), puis libérateur.
:::

::: why Le « pourquoi » de Rust
Pas de `&mut` sur une valeur non déclarée `mut` : la mutabilité de la variable et celle de la référence doivent être cohérentes. `let x = 5; let r = &mut x;` échoue → il faut `let mut x`.
:::

## Quiz d'entraînement

::: exo Quiz 1
Compile-t-il ?
```rust
fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];
    v.push(4);
    println!("{first}");
}
```
*Indice : Que peut faire push à la mémoire du Vec ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0502 : cannot borrow v as mutable because it is also borrowed as immutable.

`first` emprunte `v` en lecture et est **encore utilisé** après le `push` (qui emprunte en mutable). `push` pourrait réallouer et invalider `first`. Rust refuse. Déplacer le `println!("{first}")` **avant** le `push` compilerait (NLL).
:::

::: quiz Quiz 2
Quelle combinaison d’emprunts **simultanés** est autorisée ?
- [ ] Un `&mut` et un `&`
- [ ] Deux `&mut`
- [x] Plusieurs `&` (immuables)
- [ ] Un `&mut` et plusieurs `&`
> Règle : lecteurs multiples **OU** un seul écrivain, jamais les deux. Donc plusieurs `&` immuables simultanés = OK ; tout ce qui mêle un `&mut` à un autre emprunt actif = interdit.
:::

::: quiz Quiz 3
Quel bug la règle « un seul `&mut` à la fois » empêche-t-elle en priorité ?
- [ ] Les fuites mémoire uniquement
- [x] Les data races et l’observation d’un état incohérent (ex. itérateur invalidé)
- [ ] Les dépassements de pile
- [ ] Les erreurs de syntaxe
> Aliasing + mutation = source des data races et des invalidations. Interdire l’écriture concurrente à toute lecture rend ces bugs impossibles, vérifié statiquement.
:::

::: exo Quiz 4
Écris `fn double_tout(v: &mut Vec<i32>)` qui multiplie chaque élément par 2 **en place**.
Code de départ :
```rust
fn double_tout(v: &mut Vec<i32>) {
    
}
```
*Indice : Itère sur &mut v et déréférence avec *.*
?? Voir la correction
fn double_tout(v: &mut Vec) { for x in v.iter_mut() { *x *= 2; } }

`iter_mut()` donne des `&mut i32`. Il faut **déréférencer** avec `*x` pour modifier la valeur pointée. La fonction emprunte le Vec en mutable ; l’appelant le conserve.
:::

::: exo Quiz 5
Compile-t-il ?
```rust
fn main() {
    let x = 10;
    let r = &mut x;
    *r += 1;
}
```
*Indice : x est-il déclaré mutable ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur : cannot borrow x as mutable, as it is not declared as mutable (E0596).

On ne peut pas prendre `&mut` sur une variable non déclarée `mut`. Correction : `let mut x = 10;`. La mutabilité de la variable et de la référence doivent concorder.
:::
