/* =========================================================
   cours.js — MANIFESTE DES COURS (source unique)
   =========================================================
   👉 Pour AJOUTER UN COURS sans coder :
      1. Crée un dossier matieres/<matiere>/md/
      2. Écris tes modules en Markdown (voir matieres/_MODELE-de-cours.md)
      3. Ajoute une entrée "subject" ci-dessous avec la liste des modules.
   Le portail, la navbar et la recherche se remplissent automatiquement.

   Champs d'une matière :
     code    : identifiant court UNIQUE (sert dans l'URL ?c=CODE)
     name    : nom affiché
     emoji   : icône
     color   : couleur d'accent (hex)
     desc    : description (carte du portail)
     tags    : mots-clés (facultatif)
     modules : liste ordonnée { id, title, desc?, badge?, file }
       - id    : identifiant du module dans l'URL (?m=id), unique dans la matière
       - file  : chemin du .md (relatif à la racine du site)
       - badge : étiquette (ex. "Module 1"), sinon numérotation auto
   ========================================================= */
window.COURS = {
  subjects: [
    {
      code: "ML",
      name: "Machine Learning",
      emoji: "🧠",
      color: "#168b78",
      desc: "Comprendre les modèles supervisés et non supervisés, choisir une méthode et évaluer sa capacité à généraliser.",
      tags: [
        "IA",
        "classification",
        "régression",
        "clustering",
        "scikit-learn",
      ],
      modules: [
        {
          id: "fondations",
          title: "Fondations du Machine Learning",
          desc: "Données, apprentissage, généralisation et pièges méthodologiques.",
          badge: "Module 1",
          file: "matieres/machine-learning/md/0-fondations.md",
        },
        {
          id: "modeles-lineaires",
          title: "Modèles linéaires",
          desc: "Régression linéaire et logistique, fonction de perte et régularisation.",
          badge: "Module 2",
          file: "matieres/machine-learning/md/1-modeles-lineaires.md",
        },
        {
          id: "arbres-ensembles",
          title: "Arbres et méthodes d'ensemble",
          desc: "Arbres de décision, bagging, forêts aléatoires et boosting.",
          badge: "Module 3",
          file: "matieres/machine-learning/md/2-arbres-ensembles.md",
        },
        {
          id: "non-supervise",
          title: "Apprentissage non supervisé",
          desc: "Clustering avec K-means et réduction de dimension avec PCA.",
          badge: "Module 4",
          file: "matieres/machine-learning/md/3-non-supervise.md",
        },
        {
          id: "evaluation",
          title: "Évaluer et choisir un modèle",
          desc: "Métriques, validation, seuils de décision et sélection sans fuite de données.",
          badge: "Module 5",
          file: "matieres/machine-learning/md/4-evaluation.md",
        },
      ],
    },
    {
      code: "GIT",
      name: "Git & GitHub",
      emoji: "🔧",
      color: "#f05133",
      desc: "Versionner son code comme un pro : dépôts, commits, branches, fusion, remote, GitHub. La compétence socle de tout le travail en équipe.",
      tags: ["commit", "branch", "merge", "GitHub"],
      modules: [
        {
          id: "bases",
          title: "Les bases de Git",
          desc: "Dépôt, commit, historique : le cycle de vie d'un fichier versionné.",
          badge: "Module 1",
          file: "matieres/git/md/0-bases.md",
        },
        {
          id: "branches",
          title: "Branches & fusion",
          desc: "Travailler en parallèle sans se marcher dessus : branch, merge, conflits.",
          badge: "Module 2",
          file: "matieres/git/md/1-branches.md",
        },
      ],
    },
    {
      code: "RUST",
      name: "Rust",
      emoji: "🦀",
      color: "#f74c00",
      featured: true,
      desc: "Du débutant total à l'intermédiaire : Cargo, ownership, borrowing, lifetimes, traits, closures, concurrence. 16 modules, checkpoints & examen final.",
      tags: ["Ownership", "Borrowing", "Lifetimes", "Traits"],
      extra: [
        { label: "🔥 Révision express", href: "matieres/rust/revision-express.html" },
        { label: "⚡ Antisèche", href: "matieres/rust/cheatsheet-rust.html" }
      ],
      modules: [
        { id: "m01-installation-cargo-et-la-chaine-d-outils", title: "Module 1 — Installation, Cargo & la chaîne d’outils", badge: "Module 1", desc: "Mettre en place un environnement Rust professionnel et comprendre le rôle de chaque outil.", file: "matieres/rust/md/00-m01-installation-cargo-et-la-chaine-d-outils.md" },
        { id: "m02-variables-mutabilite-shadowing-et-types", title: "Module 2 — Variables, mutabilité, shadowing & types primitifs", badge: "Module 2", desc: "Immutabilité par défaut, inférence de types, et les types scalaires de base.", file: "matieres/rust/md/01-m02-variables-mutabilite-shadowing-et-types.md" },
        { id: "m03-types-composes-tuples-tableaux-et-slices", title: "Module 3 — Types composés : tuples, tableaux & slices", badge: "Module 3", desc: "Regrouper des valeurs. Introduction douce à une idée centrale : les slices.", file: "matieres/rust/md/02-m03-types-composes-tuples-tableaux-et-slices.md" },
        { id: "m04-fonctions-expressions-vs-statements-et-c", title: "Module 4 — Fonctions, expressions vs statements & contrôle de flux", badge: "Module 4", desc: "Une distinction fondamentale : en Rust, presque tout est une expression qui produit une valeur.", file: "matieres/rust/md/03-m04-fonctions-expressions-vs-statements-et-c.md" },
        { id: "m05-ownership-la-possession", title: "Module 5 — Ownership (la possession) ★", badge: "Module 5", desc: "Le concept le plus différenciant de Rust. Prends ton temps ici.", file: "matieres/rust/md/04-m05-ownership-la-possession.md" },
        { id: "cp-niveau-debutant", title: "Checkpoint — Niveau Débutant", badge: "✔ Checkpoint", desc: "Examen de synthèse sur les modules 1 à 5. Objectif : ≥ 70% pour avancer sereinement.", file: "matieres/rust/md/05-cp-niveau-debutant.md" },
        { id: "m06-borrowing-references-et-le-borrow-checke", title: "Module 6 — Borrowing, références & le borrow checker ★", badge: "Module 6", desc: "Utiliser une valeur sans la posséder. Les règles qui font la réputation de Rust.", file: "matieres/rust/md/06-m06-borrowing-references-et-le-borrow-checke.md" },
        { id: "m07-structs-impl-et-methodes", title: "Module 7 — Structs, impl & méthodes", badge: "Module 7", desc: "Créer ses propres types de données et leur attacher des comportements.", file: "matieres/rust/md/07-m07-structs-impl-et-methodes.md" },
        { id: "m08-enums-pattern-matching-if-let-et-while-l", title: "Module 8 — Enums, pattern matching, if let & while let", badge: "Module 8", desc: "Modéliser « l’un parmi plusieurs cas » et déstructurer avec puissance.", file: "matieres/rust/md/08-m08-enums-pattern-matching-if-let-et-while-l.md" },
        { id: "cp-niveau-debutant-avance", title: "Checkpoint — Niveau Débutant avancé", badge: "✔ Checkpoint", desc: "Synthèse des modules 6 à 8 : borrowing, structs/impl, enums & pattern matching.", file: "matieres/rust/md/09-cp-niveau-debutant-avance.md" },
        { id: "m09-collections-vec-string-et-hashmap", title: "Module 9 — Collections : Vec, String & HashMap", badge: "Module 9", desc: "Les structures dynamiques du quotidien, stockées sur le tas.", file: "matieres/rust/md/10-m09-collections-vec-string-et-hashmap.md" },
        { id: "m10-gestion-des-erreurs-option-result-et-pro", title: "Module 10 — Gestion des erreurs : Option, Result & propagation ★", badge: "Module 10", desc: "Rust n’a pas d’exceptions. Les erreurs sont des valeurs typées que l’on manipule explicitement.", file: "matieres/rust/md/11-m10-gestion-des-erreurs-option-result-et-pro.md" },
        { id: "cp-niveau-intermediaire", title: "Checkpoint — Niveau Intermédiaire", badge: "✔ Checkpoint", desc: "Synthèse des modules 9 et 10 : collections et gestion des erreurs.", file: "matieres/rust/md/12-cp-niveau-intermediaire.md" },
        { id: "m11-generiques-traits-et-trait-bounds", title: "Module 11 — Génériques, traits & trait bounds ★", badge: "Module 11", desc: "Le polymorphisme de Rust : du code réutilisable et des comportements partagés, vérifiés statiquement.", file: "matieres/rust/md/13-m11-generiques-traits-et-trait-bounds.md" },
        { id: "m12-lifetimes-durees-de-vie", title: "Module 12 — Lifetimes (durées de vie) ★", badge: "Module 12", desc: "Comment Rust garantit qu’une référence ne survit jamais à la donnée qu’elle désigne.", file: "matieres/rust/md/14-m12-lifetimes-durees-de-vie.md" },
        { id: "m13-closures-et-iterators", title: "Module 13 — Closures & iterators ★", badge: "Module 13", desc: "Le style fonctionnel de Rust : concis, expressif et sans surcoût.", file: "matieres/rust/md/15-m13-closures-et-iterators.md" },
        { id: "m14-smart-pointers-box-rc-refcell", title: "Module 14 — Smart pointers : Box, Rc, RefCell", badge: "Module 14", desc: "Des pointeurs « intelligents » pour l’allocation sur le tas, le partage et la mutabilité contrôlée.", file: "matieres/rust/md/16-m14-smart-pointers-box-rc-refcell.md" },
        { id: "m15-concurrence-threads-et-channels", title: "Module 15 — Concurrence : threads & channels", badge: "Module 15", desc: "La « concurrence sans peur » : le borrow checker élimine les data races à la compilation.", file: "matieres/rust/md/17-m15-concurrence-threads-et-channels.md" },
        { id: "m16-modules-crates-packages-et-organisation", title: "Module 16 — Modules, crates, packages & organisation", badge: "Module 16", desc: "Structurer un vrai projet Rust et adopter les conventions idiomatiques.", file: "matieres/rust/md/18-m16-modules-crates-packages-et-organisation.md" },
        { id: "cp-niveau-intermediaire-confirme", title: "Checkpoint — Niveau Intermédiaire confirmé", badge: "✔ Checkpoint", desc: "Synthèse des modules 11 à 16 : traits, lifetimes, iterators, smart pointers, concurrence, organisation.", file: "matieres/rust/md/19-cp-niveau-intermediaire-confirme.md" },
        { id: "examen-final", title: "Examen final — Tout le langage", badge: "★ Examen final", desc: "15 questions couvrant l’ensemble du parcours. À la fin : évaluation détaillée et feuille de route.", file: "matieres/rust/md/20-examen-final.md" }
      ]
    },
  ],
};
