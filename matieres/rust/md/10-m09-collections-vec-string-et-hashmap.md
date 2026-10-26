---
title: Module 9 — Collections : Vec, String & HashMap
subtitle: Les structures dynamiques du quotidien, stockées sur le tas.
domains: DEV
tags: &str, HashMap, String, Vec, entry, indexation
---

### `Vec<T>` — le tableau dynamique

```rust
let mut v: Vec<i32> = Vec::new();
v.push(1);
v.push(2);

let mut v2 = vec![10, 20, 30];   // macro vec!
v2.pop();                         // Some(30)
let x = v2[0];                    // panique si hors borne
let y = v2.get(5);                // Option: None si hors borne (sûr)

for e in &v2 { println!("{e}"); }         // itère par référence
for e in &mut v2 { *e += 1; }             // itère en mutable
```

::: warn Piège fréquent
`v[i]` panique hors borne ; `v.get(i)` renvoie une `Option` — préfère `get` quand l’index peut être invalide. Et rappel du Module 6 : tu ne peux pas garder `&v[0]` pendant que tu fais `v.push(...)`.
:::

### `String` vs `&str`

Deux types de chaînes, souvent source de confusion :

| Type | Nature | Analogie |
| --- | --- | --- |
| `String` | Chaîne **possédée**, extensible, sur le tas | owned / mutable |
| `&str` | Slice de chaîne **empruntée** (vue UTF-8) | vue en lecture |

```rust
let s: String = String::from("hello");
let vue: &str = &s;              // emprunt -> &str
let litt: &str = "monde";        // les littéraux sont des &str
let concat = s + " " + litt;     // + consomme s (move) et emprunte le reste
let f = format!("{vue} !");      // format! n'emprunte pas destructivement
```

::: why Le « pourquoi » de Rust
Deux types de chaînes = deux besoins : **posséder/modifier** (`String`) vs **lire sans copier** (`&str`). Idiome clé : une fonction qui **lit** une chaîne prend `&str` (accepte `String` ET littéraux) ; une fonction qui **stocke** prend `String`. Attention : indexer une chaîne par entier (`s[0]`) est **interdit**, car un caractère UTF-8 peut faire plusieurs octets — utilise `.chars()` ou `.bytes()`.
:::

::: warn Erreur de compilation typique
`error[E0277]: the type `String` cannot be indexed by `{integer}`` — Rust interdit `s[0]`. Utilise `s.chars().nth(0)` (renvoie `Option<char>`) ou une slice d’octets `&s[0..1]` (à tes risques sur l’UTF-8).
:::

### `HashMap<K, V>` — le dictionnaire

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Ada"), 10);
scores.insert(String::from("Lin"), 7);

// accès sûr : get renvoie Option<&V>
if let Some(s) = scores.get("Ada") { println!("{s}"); }

// valeur par défaut
let s = scores.get("X").copied().unwrap_or(0);

// insérer si absent, puis modifier
*scores.entry(String::from("Ada")).or_insert(0) += 5;

for (nom, score) in &scores { println!("{nom}: {score}"); }
```

::: py Comparaison Python
`Vec` ≈ `list`, `HashMap` ≈ `dict`. Mais l’accès est **sûr par défaut** : `scores.get(k)` renvoie `Option<&V>` (jamais de `KeyError` inattendu). Le patron `entry(k).or_insert(d)` remplace `dict.setdefault`. L’ownership s’applique : insérer une `String` la **déplace** dans la map.
:::

::: warn Piège fréquent
`entry().or_insert(v)` renvoie une **référence mutable** `&mut V` ; d’où le `*` pour incrémenter : `*map.entry(k).or_insert(0) += 1;`. Oublier le `*` = erreur de type.
:::

## Quiz d'entraînement

::: quiz Quiz 1
Pour un accès qui ne panique pas si l’index est hors borne, on utilise :
- [ ] `v[i]`
- [x] `v.get(i)` (renvoie `Option`)
- [ ] `v.at(i)`
- [ ] `v.index(i)`
> `v.get(i)` renvoie `Some(&T)` ou `None`. `v[i]` panique hors borne. Choisis selon que l’index peut être invalide.
:::

::: quiz Quiz 2
Quelle signature est la plus flexible pour une fonction qui **lit** une chaîne ?
- [ ] `fn f(s: String)`
- [ ] `fn f(s: &String)`
- [x] `fn f(s: &str)`
- [ ] `fn f(s: char)`
> `&str` accepte à la fois `String` (via déréférencement automatique) et les littéraux, sans consommer ni copier. C’est l’idiome pour les paramètres « lecture de texte ».
:::

::: exo Quiz 3
Compile-t-il ?
```rust
fn main() {
    let s = String::from("café");
    let c = s[0];
    println!("{c}");
}
```
*Indice : Peut-on indexer une String par entier ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0277 : String cannot be indexed by {integer}.

L’indexation par entier d’une `String` est interdite (UTF-8 = octets de taille variable). Utilise `s.chars().next()` → `Option<char>`, ou `s.as_bytes()[0]` pour un octet.
:::

::: exo Quiz 4
Que vaut `scores["a"]` à la fin (valeur affichée) ?
```rust
use std::collections::HashMap;
fn main() {
    let mut scores: HashMap<&str, i32> = HashMap::new();
    *scores.entry("a").or_insert(0) += 1;
    *scores.entry("a").or_insert(0) += 1;
    println!("{}", scores["a"]);
}
```
?? Voir la correction
**Sortie attendue :** `2`

2

1er `entry("a").or_insert(0)` insère 0 puis `+=1` → 1. 2e appel : la clé existe, `or_insert` ne réinsère pas, `+=1` → 2. `*` déréférence le `&mut i32` renvoyé.
:::

::: exo Quiz 5
Écris `fn compter(mots: &[&str]) -> HashMap<&str, i32>` qui compte les occurrences de chaque mot.
Code de départ :
```rust
use std::collections::HashMap;

fn compter(mots: &[&str]) -> HashMap<&str, i32> {
    
}
```
*Indice : Boucle + entry().or_insert(0).*
?? Voir la correction
use std::collections::HashMap; fn compter<'a>(mots: &[&'a str]) -> HashMap<&'a str, i32> { let mut map = HashMap::new(); for &m in mots { *map.entry(m).or_insert(0) += 1; } map }

Le patron `entry(clé).or_insert(0)` renvoie `&mut i32` ; `*... += 1` incrémente. La map est renvoyée par valeur (move) à l’appelant. Note : une annotation de durée de vie `'a` lie les clés empruntées à l’entrée (Module 12).
:::
