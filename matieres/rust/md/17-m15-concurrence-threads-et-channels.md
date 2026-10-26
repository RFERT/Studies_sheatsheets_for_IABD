---
title: Module 15 — Concurrence : threads & channels
subtitle: La « concurrence sans peur » : le borrow checker élimine les data races à la compilation.
domains: DEV
tags: Arc, Mutex, Send, Sync, channels, concurrence
---

### Lancer des threads

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..5 { println!("thread: {i}"); }
    });
    for i in 1..3 { println!("main: {i}"); }
    handle.join().unwrap();     // attend la fin du thread
}
```

### `move` pour capturer

Un thread peut survivre à la portée qui l’a créé : il doit donc **posséder** les données qu’il utilise. D’où le `move`.

```rust
let v = vec![1, 2, 3];
let handle = thread::spawn(move || {   // move : v est déplacé dans le thread
    println!("{v:?}");
});
handle.join().unwrap();
```

::: warn Erreur de compilation typique
`error[E0373]: closure may outlive the current function, but it borrows `v`` — sans `move`, la closure emprunte `v`, mais le thread pourrait vivre plus longtemps que `v`. Le compilateur suggère d’ajouter `move`.
:::

### Channels — communiquer par messages

Idiome Rust : « **ne communiquez pas en partageant la mémoire, partagez la mémoire en communiquant** ». Un **channel** transfère la **propriété** des messages d’un thread à l’autre.

```rust
use std::sync::mpsc;   // multi-producer, single-consumer
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        for i in 0..3 {
            tx.send(i).unwrap();   // envoie i (le transfère)
        }
    });
    for recu in rx {               // itère jusqu'à fermeture du canal
        println!("reçu: {recu}");
    }
}
```

::: why Le « pourquoi » de Rust
Le `send` **déplace** la valeur : après envoi, l’émetteur ne peut plus l’utiliser. Impossible d’avoir deux threads qui modifient la même donnée par accident — l’ownership rend la **data race** inexprimable. C’est ce que Rust appelle la « fearless concurrency ».
:::

### État partagé : `Arc<Mutex<T>>`

Quand il faut vraiment partager un état mutable, on combine `Arc` (partage multi-thread) et `Mutex` (verrou d’accès exclusif).

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let compteur = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    for _ in 0..10 {
        let c = Arc::clone(&compteur);
        handles.push(thread::spawn(move || {
            let mut n = c.lock().unwrap();  // verrouille (bloque si occupé)
            *n += 1;
        }));                                 // verrou relâché en fin de portée
    }
    for h in handles { h.join().unwrap(); }
    println!("{}", *compteur.lock().unwrap());   // 10
}
```

::: warn Piège fréquent
Deux traits marqueurs gouvernent la sûreté : `Send` (transférable entre threads) et `Sync` (partageable par référence). `Rc` n’est ni l’un ni l’autre → le compilateur t’empêche de l’utiliser entre threads. Oublier de `join()` peut laisser un thread inachevé ; un `Mutex` jamais déverrouillé (garde gardée trop longtemps) peut créer un interblocage.
:::

::: py Comparaison Python
Rappelle-toi du GIL de Python : la vraie parallélisation CPU y est limitée (souvent multiprocessing). Rust n’a pas de GIL : vrai parallélisme, et la sûreté est garantie par le typage (`Send`/`Sync`) au lieu d’être laissée à la discipline du développeur.
:::

## Quiz d'entraînement

::: quiz Quiz 1
Pourquoi faut-il souvent `move` dans `thread::spawn(move || ...)` ?
- [ ] Pour la performance
- [x] Parce que le thread peut survivre à la fonction : il doit **posséder** les données capturées
- [ ] Parce que `spawn` l’exige toujours
- [ ] Pour rendre la closure immuable
> Le thread a une durée de vie indépendante. Emprunter des locales serait dangereux si elles disparaissent avant. `move` transfère la propriété dans la closure.
:::

::: quiz Quiz 2
Après `tx.send(x)`, que devient `x` (type non-Copy) chez l’émetteur ?
- [ ] Il reste utilisable
- [x] Il est **déplacé** dans le canal ; l’émetteur ne peut plus l’utiliser
- [ ] Il est copié
- [ ] Il devient `None`
> `send` transfère la propriété du message. C’est ce transfert qui garantit l’absence d’accès concurrent à la même donnée. « Partager en communiquant. »
:::

::: quiz Quiz 3
Pour partager un compteur mutable entre 10 threads, on utilise :
- [ ] `Rc<RefCell<i32>>`
- [x] `Arc<Mutex<i32>>`
- [ ] un `i32` global
- [ ] `Box<i32>`
> `Arc` pour le partage thread-safe, `Mutex` pour l’accès exclusif en écriture. `Rc`/`RefCell` ne sont pas thread-safe et seraient refusés par le compilateur.
:::

::: quiz Quiz 4
Le trait `Send` signifie qu’un type :
- [ ] peut être envoyé sur le réseau
- [x] peut être **transféré** vers un autre thread en toute sûreté
- [ ] est immuable
- [ ] implémente `Clone`
> `Send` = transférable entre threads ; `Sync` = partageable par référence (&T) entre threads. Le compilateur s’appuie dessus pour interdire les usages dangereux (ex. `Rc` non-`Send`).
:::

::: exo Quiz 5
Explique comment l’ownership rend une **data race** impossible à compiler.
*Indice : Une data race = accès concurrent + au moins une écriture + pas de synchro.*
?? Voir la correction
Une data race exige que deux threads accèdent à la même donnée simultanément avec au moins une écriture. En Rust : soit la donnée est **déplacée** (un seul propriétaire, un seul thread y accède), soit elle est partagée mais alors la règle « un seul `&mut` » et les traits `Send`/`Sync` imposent un verrou (`Mutex`) pour toute mutation. Les deux conditions ne peuvent coexister → la data race est inexprimable.

C’est la « fearless concurrency » : les mêmes règles d’emprunt qui protègent le mono-thread (aliasing xor mutation) plus les marqueurs `Send`/`Sync` couvrent le multi-thread. Le compilateur refuse le code potentiellement racé au lieu de le laisser planter aléatoirement à l’exécution.
:::
