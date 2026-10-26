---
title: Module 11 — Génériques, traits & trait bounds ★
subtitle: Le polymorphisme de Rust : du code réutilisable et des comportements partagés, vérifiés statiquement.
domains: DEV
tags: dispatch, dyn, génériques, impl, performance, trait bounds
---

### Génériques

Un **paramètre de type** `<T>` permet d’écrire une fonction/struct valable pour de nombreux types, sans duplication.

```rust
fn premier<T>(v: &[T]) -> &T {
    &v[0]
}

struct Paire<T> { a: T, b: T }

// Contrainte : T doit être comparable (PartialOrd) pour utiliser >
fn plus_grand<T: PartialOrd>(a: T, b: T) -> T {
    if a > b { a } else { b }
}
```

::: why Le « pourquoi » de Rust
Les génériques Rust sont **monomorphisés** : le compilateur génère une version spécialisée par type concret utilisé. Résultat : **zéro coût à l’exécution** (pas de boxing ni de vérification dynamique), contrairement aux génériques « effacés » de Java. Le prix : des binaires potentiellement plus gros et des temps de compilation plus longs.
:::

### Traits — des interfaces

Un **trait** définit un ensemble de méthodes qu’un type peut **implémenter**. C’est l’équivalent des interfaces (Java) / protocoles (Python) / typeclasses (Haskell).

```rust
trait Resume {
    fn resume(&self) -> String;              // méthode requise
    fn apercu(&self) -> String {             // méthode par défaut
        format!("Lire : {}", self.resume())
    }
}

struct Article { titre: String }
impl Resume for Article {
    fn resume(&self) -> String {
        self.titre.clone()
    }
}

let a = Article { titre: String::from("Rust") };
println!("{}", a.apercu());
```

::: py Comparaison Python
Un trait ≈ une classe de base abstraite / un `Protocol` Python, mais **vérifié à la compilation** et sans héritage de champs. Différence majeure : on peut implémenter un trait pour un type **déjà existant** (même de la bibliothèque standard), tant que le trait ou le type est défini chez toi (« règle de cohérence/orphan rule »).
:::

### Trait bounds — contraindre les génériques

```rust
use std::fmt::Display;

fn afficher_tout<T: Display>(items: &[T]) {
    for x in items { println!("{x}"); }
}

// Plusieurs contraintes : + , ou clause where pour lisibilité
fn traiter<T>(x: T) where T: Display + Clone {
    let copie = x.clone();
    println!("{copie}");
}

// Syntaxe "impl Trait" (sucre) :
fn creer_resume() -> impl Resume { Article { titre: String::from("x") } }
```

::: warn Erreur de compilation typique
`error[E0369]: binary operation `>` cannot be applied to type `T`` — tu utilises `>` sur un `T` sans contrainte. Ajoute `<T: PartialOrd>`. De même, `{}` exige `T: Display`, `{:?}` exige `T: Debug`.
:::

::: why Le « pourquoi » de Rust
Les trait bounds rendent le polymorphisme **sûr et explicite** : la signature déclare précisément ce dont le code a besoin (`T: Display + Clone`). Le compilateur vérifie **au site de définition**, pas seulement à l’appel — les erreurs sont locales et claires, contrairement au « duck typing » de Python où l’erreur surgit à l’exécution.
:::

### Dispatch statique vs dynamique

```rust
// Statique (monomorphisé, rapide) :
fn notifier(item: &impl Resume) { println!("{}", item.resume()); }

// Dynamique (objet-trait, une seule copie de code, indirection) :
fn notifier_dyn(item: &dyn Resume) { println!("{}", item.resume()); }

let liste: Vec<Box<dyn Resume>> = vec![Box::new(Article{titre:"a".into()})];
```

::: warn Piège fréquent
`impl Trait` / génériques = **dispatch statique** (le type est connu, monomorphisé). `dyn Trait` = **dispatch dynamique** (table virtuelle, un seul code, léger surcoût). Utilise `dyn` quand tu veux stocker des **types différents** dans une même collection (`Vec<Box<dyn Trait>>`).
:::

## Quiz d'entraînement

::: quiz Quiz 1
Pourquoi `fn max<T>(a: T, b: T) -> T { if a > b {a} else {b} }` ne compile-t-il pas tel quel ?
- [ ] Il manque `mut`
- [x] `T` n’est pas contraint : il faut `T: PartialOrd` pour utiliser `>`
- [ ] Les génériques sont interdits dans les fonctions
- [ ] Il faut renvoyer une référence
> Sans contrainte, `T` pourrait être un type non comparable. Le trait bound `T: PartialOrd` autorise `>`. Le compilateur vérifie ça à la définition.
:::

::: quiz Quiz 2
Un trait peut fournir :
- [ ] Uniquement des signatures abstraites
- [x] Des méthodes requises **et** des méthodes par défaut
- [ ] Uniquement des champs
- [ ] De l’héritage de champs
> Un trait peut déclarer des méthodes requises (à implémenter) et fournir des **implémentations par défaut** réutilisables. Il ne contient pas de champs de données.
:::

::: quiz Quiz 3
La « monomorphisation » des génériques signifie que :
- [ ] Le type est vérifié à l’exécution
- [x] Le compilateur génère une version spécialisée par type concret → coût d’exécution nul
- [ ] Tout devient `dyn`
- [ ] Les génériques sont plus lents que les fonctions concrètes
> Rust duplique le code pour chaque type utilisé (comme les templates C++), éliminant l’indirection. Compromis : binaire plus gros, compilation plus longue, mais exécution optimale.
:::

::: quiz Quiz 4
Pour stocker dans un même `Vec` plusieurs types implémentant le trait `Dessin`, on utilise :
- [ ] `Vec<impl Dessin>`
- [x] `Vec<Box<dyn Dessin>>`
- [ ] `Vec<Dessin>`
- [ ] C’est impossible
> Des types **différents** ont des tailles différentes : il faut les « boxer » derrière un objet-trait `Box<dyn Dessin>` (dispatch dynamique). `Vec<impl Dessin>` impose un seul type concret.
:::

::: exo Quiz 5
Définis un trait `Aire { fn aire(&self) -> f64; }` et implémente-le pour `struct Carre { cote: f64 }`.
*Indice : trait Aire { ... } puis impl Aire for Carre { ... }*
?? Voir la correction
trait Aire { fn aire(&self) -> f64; } struct Carre { cote: f64 } impl Aire for Carre { fn aire(&self) -> f64 { self.cote * self.cote } }

On sépare le **contrat** (trait) de son **implémentation** pour un type donné (`impl Aire for Carre`). N’importe quelle fonction générique `fn f<T: Aire>(...)` accepte désormais `Carre`.
:::
