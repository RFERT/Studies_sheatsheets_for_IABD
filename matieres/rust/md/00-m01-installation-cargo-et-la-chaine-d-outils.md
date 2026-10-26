---
title: Module 1 — Installation, Cargo & la chaîne d’outils
subtitle: Mettre en place un environnement Rust professionnel et comprendre le rôle de chaque outil.
domains: DEV
tags: Cargo, macros, outils, projet, qualité, release
---

Rust est un langage **compilé**, **statiquement typé** et sans ramasse-miettes (garbage collector). Avant d’écrire du code, il faut comprendre son écosystème d’outils, qui est l’un des plus soignés de l’industrie.

### Installer Rust : `rustup`

`rustup` est le gestionnaire d’installation officiel. Il installe et met à jour le compilateur et les outils, et gère plusieurs versions (« toolchains »).

```bash
# Installer Rust (Linux/macOS)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Vérifier les versions
rustc --version   # le compilateur
cargo --version   # le gestionnaire de projet
rustup update     # mettre à jour
```

### Les outils clés

| Outil | Rôle | Équivalent Python (approx.) |
| --- | --- | --- |
| `rustc` | Le compilateur bas niveau | `CPython` |
| `cargo` | Build system + gestionnaire de paquets + lanceur de tests | `pip` + `venv` + `build` + `pytest` réunis |
| `rustfmt` | Formateur automatique (`cargo fmt`) | `black` |
| `clippy` | Linter très riche (`cargo clippy`) | `ruff` / `pylint` |
| `rust-analyzer` | Serveur de langage pour l’IDE (autocomplétion, erreurs en direct) | `pylance` |

### Créer et lancer un projet

```bash
cargo new mon_projet      # crée un projet binaire (avec un main)
cargo new ma_lib --lib    # crée une bibliothèque

cd mon_projet
cargo run                 # compile PUIS exécute
cargo build               # compile seulement (cible debug)
cargo build --release     # compile optimisé (plus lent à compiler, rapide à l'exécution)
cargo check               # vérifie la compilation SANS produire de binaire (très rapide)
cargo test                # lance les tests
cargo fmt                 # reformate le code
cargo clippy              # analyse le code
```

### Structure d’un projet Cargo

```
mon_projet/
├── Cargo.toml      # manifeste : nom, version, dépendances
├── Cargo.lock      # versions exactes verrouillées (comme requirements.lock / poetry.lock)
└── src/
    └── main.rs     # point d'entrée
```

Le fichier `Cargo.toml` décrit le paquet. Ajouter une dépendance (un « crate ») :

```bash
# Dans Cargo.toml
[dependencies]
rand = "0.8"

# ou en ligne de commande :
# cargo add rand
```

### Le premier programme

```rust
fn main() {
    println!("Bonjour, Rust !");
}
```

::: py Comparaison Python
En Python, un script `hello.py` s’exécute directement avec `python hello.py`, sans compilation ni `main` obligatoire. En Rust, tout binaire a une fonction `main`, et le code est **compilé** en exécutable natif avant de tourner. `println!` est une **macro** (le `!` le signale), pas une fonction.
:::

::: why Le « pourquoi » de Rust
`cargo check` existe parce que la compilation complète de Rust peut être lente (vérifications poussées + optimisations). `check` effectue toute l’analyse de types et d’emprunts **sans** générer de code machine : c’est la boucle de feedback rapide qu’on utilise en développement.
:::

::: warn Piège fréquent
Ne confonds pas **debug** et **release**. Par défaut `cargo run` compile en mode debug : le binaire est lent et gros mais compile vite et garde les vérifications de débordement. Pour mesurer les performances, utilise toujours `--release`.
:::

## Quiz d'entraînement

::: quiz Quiz 1
Quelle commande vérifie que le code compile **sans** produire d’exécutable, pour un retour rapide ?
- [ ] `cargo build`
- [x] `cargo check`
- [ ] `cargo run`
- [ ] `rustc --fast`
> `cargo check` effectue toute l’analyse (types, emprunts) mais saute la génération de code machine, ce qui le rend bien plus rapide que `build`. `build` produit un binaire, `run` compile puis exécute.
:::

::: quiz Quiz 2
Dans `println!("hi")`, que signifie le `!` ?
- [ ] Une négation logique
- [x] Que `println` est une **macro**, pas une fonction
- [ ] Que la ligne peut échouer
- [ ] Rien, c’est décoratif
> Le `!` indique un appel de **macro**. Les macros sont développées à la compilation et peuvent, par exemple, accepter un nombre variable d’arguments typés — ce qu’une fonction Rust ordinaire ne peut pas faire.
:::

::: quiz Quiz 3
`cargo run` produit par défaut un binaire optimisé pour la production.
- [ ] Vrai
- [x] Faux
> Faux. Par défaut c’est le profil **debug** (non optimisé, avec vérifications). Il faut `cargo run --release` pour le profil optimisé.
:::

::: exo Quiz 4
Explique en une ou deux phrases la différence de rôle entre `Cargo.toml` et `Cargo.lock`.
*Indice : Pense à requirements.txt vs un fichier de verrouillage.*
?? Voir la correction
**Cargo.toml** = manifeste écrit à la main : nom, version du paquet, et contraintes de dépendances (ex. `rand = "0.8"`). **Cargo.lock** = généré automatiquement, il fige les versions **exactes** résolues pour des builds reproductibles.

C’est l’analogue de `pyproject.toml`/`requirements.txt` (souhaits) vs `poetry.lock`/`requirements.lock` (versions verrouillées). On commit `Cargo.lock` pour un binaire, pas nécessairement pour une bibliothèque.
:::

::: quiz Quiz 5
Quel outil signale des tournures non idiomatiques et des améliorations possibles (au-delà du simple formatage) ?
- [ ] `rustfmt`
- [x] `clippy`
- [ ] `rustup`
- [ ] `rust-analyzer`
> `clippy` est le **linter** : il propose des centaines de « lints » idiomatiques. `rustfmt` ne fait que reformater. `rustup` gère les versions du toolchain, `rust-analyzer` alimente l’IDE.
:::

::: culture Culture & histoire de Rust
Rust n'est pas né dans un grand labo, mais du **ras-le-bol** d'un développeur : vers 2006, **Graydon Hoare**, excédé qu'un logiciel bogué fasse régulièrement tomber en panne l'ascenseur de son immeuble, se demande pourquoi on continue d'écrire des programmes qui plantent pour de simples erreurs de mémoire. Il lance Rust comme projet personnel.
#### Repères & grands noms
- **Graydon Hoare** (2006) — créateur de Rust. Le nom viendrait de la « rouille » (*rust fungus*), un organisme réputé increvable.
- **Mozilla** (2009→) — sponsorise le projet et s'en sert pour moderniser Firefox (moteur Servo, puis Stylo en 2017).
- **Rust 1.0** (mai 2015) — première version stable : les garanties de compatibilité commencent.
- **Rust Foundation** (2021) — fondée par AWS, Google, Microsoft, Mozilla et Huawei pour gouverner le langage.
- **Le noyau Linux** (2022) — accepte officiellement Rust comme 2ᵉ langage après le C : une véritable consécration.
#### La philosophie
Rust marie deux mondes : la **performance** du C/C++ et la **sûreté** des langages fonctionnels (ML, Haskell : types riches, pattern matching). Sa grande idée — l'*ownership* vérifié à la compilation — offre la « sécurité mémoire sans ramasse-miettes » et la « *fearless concurrency* » (concurrence sans peur), le tout en *zero-cost abstractions*.
#### Pourquoi un tel engouement
Microsoft et Google estiment qu'environ **70 %** de leurs failles de sécurité viennent de bugs mémoire — exactement ce que Rust élimine **à la compilation**. D'où son adoption dans l'infrastructure critique (Linux, Android, Windows, AWS Firecracker, Cloudflare, Discord, Dropbox). Bonus : élu langage « le plus admiré » du sondage Stack Overflow huit années de suite (2016-2023).
- [Rust (Wikipédia)](https://fr.wikipedia.org/wiki/Rust_(langage))
- [Histoire de Rust (EN)](https://en.wikipedia.org/wiki/Rust_(programming_language))
- [Rust Foundation](https://foundation.rust-lang.org/)
- [rust-lang.org](https://www.rust-lang.org/)
:::
