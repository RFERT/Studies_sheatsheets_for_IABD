---
title: Examen final — Tout le langage
subtitle: 15 questions couvrant l’ensemble du parcours. À la fin : évaluation détaillée, niveau estimé et feuille de route.
domains: DEV
niveau: Évaluation
tags: ?, Option, RefCell, Result, borrowing, concurrence
---

::: py Consignes
Réponds sans revenir en arrière tant que possible. Les questions balaient ownership, borrowing, lifetimes, traits, iterators, error handling, collections, concurrence et organisation. Ton **niveau estimé** et une **feuille de route** personnalisée s’affichent en bas de page (mis à jour en direct).
:::

## Questions de révision

::: exo Question 1
Compile-t-il ?
```rust
fn main() {
    let s = String::from("hi");
    let s2 = s;
    println!("{s} {s2}");
}
```
*Indice : s est-il encore valide après le move ?*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0382 : borrow of moved value s.

`let s2 = s;` déplace la String ; `s` est invalide. Utilise `s.clone()` ou n’affiche que `s2`.
:::

::: quiz Question 2
Combien de `&mut` simultanés sur une même donnée ?
- [ ] Autant qu’on veut
- [x] Un seul
- [ ] Deux
- [ ] Zéro
> Exactement un `&mut` à la fois (et alors aucun `&`). C’est la règle qui exclut les data races.
:::

::: exo Question 3
Valeur de x ?
```rust
fn main() {
    let x = { let a = 3; let b = 4; a + b };
    println!("{x}");
}
```
?? Voir la correction
**Sortie attendue :** `7`

7

Le bloc est une expression valant sa dernière expression sans `;` : `a + b = 7`.
:::

::: quiz Question 4
Quel type pour « peut échouer avec une cause » ?
- [ ] `Option<T>`
- [x] `Result<T,E>`
- [ ] `bool`
- [ ] `Vec<T>`
> `Result<T,E>` porte l’erreur. `Option` exprime juste présence/absence.
:::

::: quiz Question 5
`?` sur un `Err(e)` dans une fonction qui renvoie `Result` :
- [ ] panique
- [ ] met la valeur par défaut
- [x] fait `return Err(e)`
- [ ] ignore l’erreur
> `?` propage l’erreur en quittant la fonction avec `Err(e)` (après conversion `From`).
:::

::: exo Question 6
Contenu de r ?
```rust
fn main() {
    let v = vec![1, 2, 3, 4];
    let r: Vec<i32> = v.iter().filter(|&&x| x % 2 == 0).copied().collect();
    println!("{r:?}");
}
```
?? Voir la correction
**Sortie attendue :** `[2, 4]`

[2, 4]

`filter` garde les pairs 2 et 4 ; `copied` transforme `&i32` en `i32` ; `collect` matérialise.
:::

::: quiz Question 7
Pourquoi un `T` générique doit-il souvent porter un trait bound (ex. `T: Display`) ?
- [ ] Pour la syntaxe uniquement
- [x] Pour déclarer explicitement les capacités utilisées, vérifiées à la compilation
- [ ] Pour rendre le code plus lent
- [ ] Ce n’est jamais nécessaire
> Un `T` non contraint n’offre aucune opération. Le bound déclare ce dont le code a besoin (affichage, comparaison…), vérifié à la définition.
:::

::: quiz Question 8
Le rôle d’une annotation de durée de vie `'a` est de :
- [ ] prolonger la vie d’une donnée
- [x] relier les durées de vie des références pour que le compilateur vérifie la validité
- [ ] allouer sur le tas
- [ ] activer le GC
> `'a` ne change rien à la vie réelle : il exprime des relations vérifiables, empêchant les références pendouillantes.
:::

::: quiz Question 9
Pour un type récursif (liste chaînée), on a besoin de :
- [ ] `Rc`
- [x] `Box`
- [ ] `RefCell`
- [ ] `Mutex`
> `Box` introduit une indirection de taille fixe → borne la taille du type récursif.
:::

::: quiz Question 10
`RefCell` déplace la vérification d’emprunt :
- [ ] à la compilation
- [x] à l’exécution (panique si violée)
- [ ] au linker
- [ ] elle est désactivée
> Mutabilité intérieure : `borrow()`/`borrow_mut()` vérifient au runtime, et paniquent en cas de violation.
:::

::: quiz Question 11
Partager un compteur mutable entre threads :
- [ ] `Rc<RefCell<i32>>`
- [x] `Arc<Mutex<i32>>`
- [ ] `Box<i32>`
- [ ] un global mutable
> `Arc` (partage thread-safe) + `Mutex` (exclusion). `Rc/RefCell` ne sont pas `Send/Sync`.
:::

::: quiz Question 12
Visibilité par défaut d’un item dans un module :
- [ ] public
- [x] privé
- [ ] protégé
- [ ] statique
> Privé par défaut ; `pub` pour exposer. Encapsulation stricte, API explicite.
:::

::: exo Question 13
Compile-t-il ?
```rust
fn main() {
    let mut v = vec![1, 2, 3];
    let r = &v[0];
    v.push(4);
    println!("{r}");
}
```
*Indice : push peut réallouer le Vec.*
?? Voir la correction
**Sortie attendue :** `erreur de compilation`

Erreur E0502.

`r` emprunte `v` en lecture et est utilisé après `push` (emprunt mutable) → conflit. Déplacer `println!` avant `push` corrige.
:::

::: exo Question 14
Écris `fn parse_somme(entrees: &[&str]) -> Result<i32, std::num::ParseIntError>` qui parse chaque chaîne en i32 et renvoie leur somme, en propageant la 1re erreur avec `?`.
Code de départ :
```rust
fn parse_somme(entrees: &[&str]) -> Result<i32, std::num::ParseIntError> {
    
}
```
*Indice : Boucle + let n: i32 = s.parse()?; accumulateur.*
?? Voir la correction
fn parse_somme(entrees: &[&str]) -> Result{ let mut total = 0; for s in entrees { let n: i32 = s.parse()?; // propage la 1re erreur total += n; } Ok(total) } // Idiomatique : entrees.iter().map(|s| s.parse::()).sum()

`?` extrait l’`i32` ou quitte avec l’erreur de parsing. La version avec `.sum()` sur un itérateur de `Result` renvoie directement un `Result` et court-circuite à la première erreur.
:::

::: exo Question 15
En 3–4 phrases, explique à un développeur Python ce qui rend Rust fondamentalement différent, en citant ownership, borrowing et l’absence de GC.
*Indice : Sécurité mémoire à la compilation, coût zéro, erreurs comme valeurs.*
?? Voir la correction
Rust garantit la **sécurité mémoire sans ramasse-miettes** : l’**ownership** (un propriétaire unique, libération automatique) et le **borrowing** (lecteurs multiples XOR un écrivain) sont vérifiés **à la compilation**, éliminant use-after-free, double-free et data races sans coût à l’exécution. Là où Python résout « qui libère » via un GC au runtime et signale les échecs par exceptions, Rust résout tout statiquement et fait des erreurs des **valeurs typées** (`Result`/`Option`). Le prix est une phase d’apprentissage (ownership, lifetimes, traits) en échange de performances natives et d’une robustesse forte.

Points clés attendus : sécurité mémoire garantie à la compilation, pas de GC (coût zéro), ownership/borrowing comme mécanismes centraux, erreurs comme valeurs plutôt qu’exceptions, et le compromis apprentissage ↔ performance/robustesse. Si tu as cité tout cela, tu as le modèle mental correct de Rust.
:::
