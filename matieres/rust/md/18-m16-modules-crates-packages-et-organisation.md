---
title: Module 16 — Modules, crates, packages & organisation
subtitle: Structurer un vrai projet Rust et adopter les conventions idiomatiques.
domains: DEV
tags: bonnes pratiques, chemins, crate, modules, organisation, package
---

### Le vocabulaire

| Terme | Définition |
| --- | --- |
| **Crate** | Unité de compilation : soit un **binaire** (`main.rs`), soit une **bibliothèque** (`lib.rs`). |
| **Package** | Un ou plusieurs crates + un `Cargo.toml`. (max 1 lib, plusieurs bins possibles.) |
| **Module** | Espace de noms interne à un crate (`mod`), pour organiser et contrôler la visibilité. |

### Déclarer des modules

```rust
// src/main.rs
mod reseau {                    // module
    pub fn connecter() {}       // pub = visible à l'extérieur du module
    fn secret() {}              // privé par défaut

    pub mod client {            // sous-module
        pub fn envoyer() {
            super::connecter(); // super:: = module parent
        }
    }
}

fn main() {
    reseau::connecter();               // chemin absolu depuis la racine
    reseau::client::envoyer();
}
```

::: why Le « pourquoi » de Rust
Tout est **privé par défaut** en Rust : un item n’est visible hors de son module que si tu écris `pub`. Ce choix inverse la tendance de beaucoup de langages et pousse à une **encapsulation stricte** : ton API publique est explicite et minimale, le reste reste un détail d’implémentation modifiable.
:::

### Découper en fichiers

```rust
// src/main.rs
mod reseau;              // charge src/reseau.rs OU src/reseau/mod.rs

// src/reseau.rs
pub mod client;         // charge src/reseau/client.rs
pub fn connecter() {}

// src/reseau/client.rs
pub fn envoyer() {}
```

### `use` — raccourcir les chemins

```rust
use std::collections::HashMap;
use reseau::client::envoyer;
use std::io::{self, Write};        // groupes
use std::fmt::Result as FmtResult; // alias

envoyer();                          // au lieu de reseau::client::envoyer()
```

::: py Comparaison Python
`mod` ≈ un module/package Python, mais la structure est déclarée **explicitement** (`mod nom;`) plutôt que déduite de l’arborescence + `__init__.py`. `use` ≈ `import`. Différence forte : la **visibilité privée par défaut** (Python n’a que la convention `_prefixe`).
:::

### Organisation d’un projet réaliste

```
mon_app/
├── Cargo.toml
├── src/
│   ├── main.rs         # binaire : orchestre
│   ├── lib.rs          # bibliothèque : logique testable
│   ├── config.rs       # mod config;
│   └── domaine/
│       ├── mod.rs      # mod domaine;
│       └── modele.rs
├── tests/              # tests d'INTÉGRATION (boîte noire)
│   └── api.rs
├── benches/            # benchmarks
└── examples/           # exemples exécutables
```

### Bonnes pratiques idiomatiques

- Nommage : `snake_case` (fonctions/variables), `CamelCase` (types/traits), `SCREAMING_CASE` (constantes).
- Préfère emprunter (`&str`, `&[T]`) plutôt que consommer, quand tu lis seulement.
- Modélise les états impossibles hors d’atteinte avec des **enums** (« make illegal states unrepresentable »).
- Gère les erreurs avec `Result` + `?` ; réserve `panic!/unwrap` aux bugs/prototypes. En biblio, exporte des erreurs typées (crates `thiserror`/`anyhow`).
- Lance `cargo fmt` et `cargo clippy` systématiquement ; écris des tests (`#[test]`) et de la doc (`///` + `cargo doc`).
- Mets la logique dans `lib.rs` (testable), garde `main.rs` mince.

````rust
/// Additionne deux entiers. (commentaire de doc -> apparait dans cargo doc)
///
/// # Exemples
/// ```
/// assert_eq!(mon_crate::add(2, 3), 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 { a + b }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_add() {
        assert_eq!(add(2, 2), 4);
    }
}
````

::: warn Piège fréquent
Erreur fréquente du débutant : oublier `pub` et obtenir `error[E0603]: function is private`. Rends public **uniquement** ce qui doit l’être ; garde le reste privé pour préserver ta liberté de refactoring.
:::

## Quiz d'entraînement

::: quiz Quiz 1
Par défaut, un item (fonction, struct…) dans un module est :
- [ ] public
- [x] privé (visible seulement dans son module et ses enfants)
- [ ] déprécié
- [ ] statique
> Tout est **privé par défaut**. Il faut `pub` pour exposer hors du module. Cela force une API publique explicite et minimale.
:::

::: quiz Quiz 2
Quelle affirmation est correcte ?
- [ ] Un package contient exactement un crate
- [x] Un crate est soit un binaire, soit une bibliothèque ; un package peut contenir plusieurs crates (max 1 lib)
- [ ] Un module et un crate sont synonymes
- [ ] Un package ne peut pas avoir de binaire et de lib
> **Crate** = unité de compilation (bin ou lib). **Package** = Cargo.toml + ses crates (au plus une lib, plusieurs bins). **Module** = découpage interne d’un crate.
:::

::: exo Quiz 3
Compile-t-il ?
```rust
mod outils {
    fn aide() -> i32 { 42 }
}
fn main() {
    println!("{}", outils::aide());
}
```
*Indice : aide est-elle publique ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0603 : function aide is private.

`aide` n’est pas `pub` → invisible hors du module `outils`. Correction : `pub fn aide()`. C’est la privacité par défaut de Rust.
:::

::: quiz Quiz 4
À quoi sert `use` ?
- [ ] À exécuter du code
- [x] À raccourcir un chemin en l’amenant dans la portée courante (comme `import`)
- [ ] À rendre un item public
- [ ] À créer un module
> `use` importe un chemin dans la portée pour éviter de le réécrire en entier. Il ne change pas la visibilité (sauf `pub use`, ré-export).
:::

::: exo Quiz 5
Pourquoi met-on la logique dans `lib.rs` et garde-t-on `main.rs` mince ? Cite un bénéfice concret.
*Indice : Pense aux tests d’intégration et à la réutilisation.*
?? Voir la correction
La logique dans `lib.rs` devient une **bibliothèque** réutilisable et surtout **testable** : les tests d’intégration dans `tests/` et d’autres binaires peuvent l’importer. `main.rs` ne fait qu’orchestrer (parsing d’arguments, I/O), ce qui est difficile à tester.

Séparer « logique pure » (lib) de « point d’entrée » (bin) améliore testabilité, réutilisation (plusieurs binaires, exemples, benchmarks partagent la lib) et clarté de l’API publique. C’est une convention idiomatique répandue.
:::
