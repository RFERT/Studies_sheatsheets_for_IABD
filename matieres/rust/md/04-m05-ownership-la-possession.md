---
title: Module 5 — Ownership (la possession) ★
subtitle: Le concept le plus différenciant de Rust. Prends ton temps ici.
domains: DEV
tags: clone, copy, fonctions, move, ownership, sécurité
---

Rust gère la mémoire **sans ramasse-miettes** et **sans `malloc/free` manuels**. Le mécanisme s’appelle l’**ownership** (possession). C’est un ensemble de règles vérifiées **à la compilation** — coût nul à l’exécution.

### Pile vs tas (stack vs heap)

Les données de taille connue et fixe vont sur la **pile** (rapide). Les données de taille variable (ex. `String`) vont sur le **tas** (heap), et il faut savoir **quand les libérer**. C’est ce que l’ownership résout.

### Les trois règles

1. Chaque valeur a une **unique variable propriétaire** (owner).
2. Il ne peut y avoir qu’**un seul** propriétaire à la fois.
3. Quand le propriétaire sort de sa **portée**, la valeur est **libérée** automatiquement (appel de `drop`).

```rust
{
    let s = String::from("hello");  // s possède la String (allouée sur le tas)
    // ... on utilise s ...
}   // fin de portée : s est "droppé", la mémoire est libérée automatiquement
```

### Le « move » (déplacement)

Affecter une valeur du tas à une autre variable **déplace** la possession. L’ancienne variable devient **invalide**.

```rust
let s1 = String::from("hello");
let s2 = s1;              // MOVE : s1 est déplacé dans s2
// println!("{s1}");      // ERREUR : borrow of moved value: `s1`
println!("{s2}");         // OK
```

::: warn Erreur de compilation typique
`error[E0382]: borrow of moved value: `s1`` Cause : `s1` a été déplacé dans `s2`. Solutions : soit utiliser `s2`, soit cloner explicitement `let s2 = s1.clone();` (copie profonde), soit emprunter (Module 6).
:::

::: why Le « pourquoi » de Rust
Pourquoi invalider `s1` ? Parce que `String` possède un pointeur vers le tas. Si `s1` et `s2` pointaient tous deux vers la même mémoire, à la fin de portée on la libérerait **deux fois** (« double free », bug de sécurité classique en C++). Le move garantit un **unique** propriétaire, donc une **unique** libération.
:::

### Copy vs Move

Les types simples entièrement sur la pile (entiers, `bool`, `char`, `f64`, tuples de Copy…) implémentent le trait `Copy` : ils sont **copiés**, pas déplacés.

```rust
let x = 5;
let y = x;         // COPY : x reste valide (i32 est Copy)
println!("{x} {y}");   // 5 5  -> OK

let s1 = String::from("hi");
let s2 = s1;       // MOVE : String n'est PAS Copy
// x est copié, s1 est déplacé
```

::: py Comparaison Python
En Python, `s2 = s1` crée deux références vers le **même** objet (compté par le garbage collector). En Rust, il n’y a pas de comptage automatique par défaut : soit copie (types `Copy`), soit transfert de propriété (move). Le GC de Python résout le « qui libère » à l’exécution ; Rust le résout à la **compilation**, sans coût.
:::

### Ownership et fonctions

```rust
fn prendre(s: String) {      // s prend possession
    println!("{s}");
}                             // s est droppé ici

fn main() {
    let a = String::from("x");
    prendre(a);               // a est MOVE dans la fonction
    // println!("{a}");       // ERREUR : a n'est plus valide
}
```

::: warn Piège fréquent
Passer une `String` (ou tout type non-Copy) à une fonction **par valeur** la **consomme**. Si tu veux la réutiliser après, il faut soit la faire **renvoyer**, soit — bien mieux — la passer par **référence** (`&String` ou `&str`), ce qu’on voit au Module 6.
:::

::: why Le « pourquoi » de Rust
Ce modèle élimine des classes entières de bugs **à la compilation** : use-after-free, double-free, fuites, data races. C’est le cœur de la promesse de Rust : « sécurité mémoire sans GC ». Le prix à payer est l’apprentissage de ces règles — d’où l’importance de ce module.
:::

## Quiz d'entraînement

::: exo Quiz 1
Compile-t-il ?
```rust
fn main() {
    let s1 = String::from("hi");
    let s2 = s1;
    println!("{s1}");
}
```
*Indice : Que devient s1 après le move ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur : `E0382 borrow of moved value: s1`.

`let s2 = s1;` **déplace** la `String` : `s1` devient invalide. Utiliser `s1` ensuite est interdit. Solutions : afficher `s2`, ou `let s2 = s1.clone();`, ou emprunter `&s1`.
:::

::: exo Quiz 2
Quelle est la sortie ?
```rust
fn main() {
    let x = 5;
    let y = x;
    println!("{x} {y}");
}
```
?? Voir la correction
**Sortie attendue :** `5 5`

5 5

`i32` implémente `Copy` : `let y = x;` effectue une **copie**, pas un move. `x` reste valide → `5 5`. La différence avec `String` est cruciale.
:::

::: quiz Quiz 3
Pourquoi Rust invalide-t-il `s1` après `let s2 = s1;` pour une `String` ?
- [ ] Pour économiser de la RAM
- [x] Pour éviter que la mémoire du tas soit libérée deux fois (double free)
- [ ] Parce que String est un mot-clé réservé
- [ ] Pour forcer l’usage du GC
> Une `String` possède un pointeur vers le tas. Deux propriétaires → double libération en fin de portée (« double free », faille classique). En imposant un **propriétaire unique**, Rust garantit une libération unique et sûre.
:::

::: quiz Quiz 4
Après `prendre(a);` où `fn prendre(s: String)` et `a: String`, quel est l’état de `a` ?
- [ ] `a` est toujours utilisable
- [x] `a` a été déplacé (moved) dans la fonction et n’est plus utilisable
- [ ] `a` vaut maintenant `None`
- [ ] `a` a été copié
> Passer par valeur un type non-`Copy` le **déplace**. `a` est consommé par `prendre` et droppé à la fin de la fonction ; on ne peut plus l’utiliser dans `main`. Pour l’éviter : passer `&a`.
:::

::: exo Quiz 5
Explique la différence entre `Copy` et `Clone`, et quand chacun s’applique.
*Indice : L’un est implicite et peu coûteux, l’autre explicite et potentiellement coûteux.*
?? Voir la correction
**Copy** : copie bit-à-bit **implicite**, réservée aux types entièrement sur la pile et peu coûteux (i32, bool, char, f64, tuples de Copy). L’ancienne variable **reste valide**. **Clone** : copie **explicite** (`.clone()`), potentiellement **profonde** et coûteuse (alloue sur le tas pour une String, un Vec…).

Un type `Copy` est aussi `Clone`, mais l’inverse est faux : `String` est `Clone` mais pas `Copy` (car elle possède de la mémoire tas). Rust rend le coût **visible** : tu écris `.clone()` quand tu duplique de la mémoire, ce qui évite les copies cachées coûteuses des autres langages.
:::
