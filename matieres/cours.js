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
     page    : (facultatif) chemin d'une page codée sur-mesure. Si présent,
               le portail/menu/recherche pointent vers CETTE page et le cours
               n'est PAS construit depuis le Markdown.
     aide    : (facultatif) chemin d'UN fichier Markdown d'aide-mémoire (antisèche).
               S'il est présent, une antisèche dense/imprimable est générée
               automatiquement à aide.html?c=CODE (lien ajouté au portail, au menu
               « Antisèches » et à la recherche). Rien d'autre à coder.
     modules : liste ordonnée { id, title, desc?, badge?, file }
       - id    : identifiant du module dans l'URL (?m=id), unique dans la matière
       - file  : chemin du .md (relatif à la racine du site)
       - badge : étiquette (ex. "Module 1"), sinon numérotation auto

   ⚙️ PRIORITÉ AU COURS CODÉ (automatique) : si une matière codée sur-mesure
   existe déjà (même `code` ou même dossier matieres/<x>/ qu'une matière
   déclarée dans assets/portal.js), le cours n'est PAS reconstruit depuis le
   Markdown — la version codée est utilisée partout. Pas besoin d'y penser.
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
      aide: "matieres/machine-learning/md/aide.md",
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
      code: "DL",
      name: "Deep Learning",
      emoji: "🧠",
      color: "#b98cff",
      desc: "Des neurones aux Transformers : MLP, rétropropagation, optimiseurs, régularisation, PyTorch, CNN, RNN/LSTM, attention et LLM — avec visualisations interactives.",
      tags: ["PyTorch", "CNN", "LSTM", "Transformers", "rétropropagation"],
      aide: "matieres/deep-learning/md/aide.md",
      modules: [
        { id: "neurone", title: "Du neurone au perceptron multicouche", badge: "Module 1", desc: "Neurone formel, XOR, activations, MLP, passe avant et approximation universelle.", file: "matieres/deep-learning/md/0-neurone.md" },
        { id: "entrainement", title: "Entraîner un réseau — pertes, rétropropagation et optimiseurs", badge: "Module 2", desc: "Entropie croisée, chain rule à la main, SGD, momentum, Adam, initialisation, courbes.", file: "matieres/deep-learning/md/1-entrainement.md" },
        { id: "regularisation", title: "Généraliser — régularisation et normalisation", badge: "Module 3", desc: "Weight decay, dropout, early stopping, augmentation, BatchNorm et LayerNorm.", file: "matieres/deep-learning/md/2-regularisation.md" },
        { id: "pytorch", title: "PyTorch en pratique", badge: "Module 4", desc: "Tenseurs, autograd, nn.Module, DataLoader, boucle complète, GPU, sauvegarde.", file: "matieres/deep-learning/md/3-pytorch.md" },
        { id: "cnn", title: "Réseaux convolutifs (CNN)", badge: "Module 5", desc: "Convolution, padding, stride, pooling, ResNet et transfer learning.", file: "matieres/deep-learning/md/4-cnn.md" },
        { id: "sequences", title: "Séquences — RNN, LSTM, GRU et embeddings", badge: "Module 6", desc: "Tokens, embeddings, récurrence, BPTT, portes du LSTM, séries temporelles.", file: "matieres/deep-learning/md/5-sequences.md" },
        { id: "transformers", title: "Attention et Transformers", badge: "Module 7", desc: "Self-attention, multi-head, bloc Transformer, BERT, GPT et LLM.", file: "matieres/deep-learning/md/6-transformers.md" },
      ],
    },
    {
      code: "GIT",
      name: "Git & GitHub",
      emoji: "🔧",
      color: "#f05133",
      desc: "Versionner son code comme un pro : dépôts, commits, branches, fusion, remote, GitHub. La compétence socle de tout le travail en équipe.",
      tags: ["commit", "branch", "merge", "GitHub"],
      aide: "matieres/git/md/aide.md",
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
      code: "LANGC",
      name: "Langage C",
      emoji: "🅲",
      color: "#3d6fd1",
      desc: "Le C de A à Z, en commençant par un guide pas à pas pour coder, compiler et déboguer en C dans VS Code. Puis types, opérateurs, entrées/sorties, et bientôt pointeurs, mémoire, fichiers et projets.",
      tags: ["C", "VS Code", "gcc", "printf", "scanf", "mémoire"],
      aide: "matieres/langage-c/md/aide.md",
      modules: [
        {
          id: "vscode",
          title: "Coder en C sur VS Code (guide des manips)",
          desc: "Installer GCC avec MSYS2, configurer tasks.json / launch.json, compiler, exécuter et déboguer.",
          badge: "Module 0",
          file: "matieres/langage-c/md/0-vscode.md",
        },
        {
          id: "premiers-programmes",
          title: "Premiers programmes, types et opérateurs",
          desc: "Les 4 étapes de compilation, types et tailles, division entière, conversions, dépassements.",
          badge: "Module 1",
          file: "matieres/langage-c/md/1-premiers-programmes.md",
        },
        {
          id: "entrees-sorties",
          title: "Entrées/sorties console : printf, scanf, fgets",
          desc: "Formats d'affichage, pièges de scanf et du tampon, lecture robuste avec fgets et strtol, EOF, stderr.",
          badge: "Module 2",
          file: "matieres/langage-c/md/2-entrees-sorties.md",
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
        { label: "🧩 Aide-mémoire interactif", href: "matieres/rust/cheatsheet-rust.html" }
      ],
      aide: "matieres/rust/md/aide.md",
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
    // Matières codées sur-mesure : seule l'antisèche est générée depuis le Markdown.
    {
      code: "MATH",
      name: "Mathématiques",
      emoji: "∑",
      color: "#6c8cff",
      page: "matieres/mathematiques/index.html",
      desc: "Maths pour la Data, le Big Data & l'IA : logique, matrices, combinatoire, probas, stats, optimisation, graphes, information.",
      tags: ["Matrices", "Combinatoire", "Probas", "Optimisation"],
      aide: "matieres/mathematiques/md/aide.md",
    },
    {
      code: "DATA",
      name: "Python & Data Science",
      emoji: "🐍",
      color: "#3b82f6",
      page: "matieres/python/index.html",
      desc: "Python avancé puis la stack data : NumPy, Pandas, visualisation, feature engineering, scikit-learn.",
      tags: ["Pandas", "NumPy", "scikit-learn"],
      aide: "matieres/python/md/aide.md",
    },
    {
      code: "SQL",
      name: "Bases de données",
      emoji: "🧮",
      color: "#22c3a6",
      page: "matieres/sql/index.html",
      desc: "SQL de A à Z : SELECT, NULL, agrégation, jointures, sous-requêtes, fenêtrage, DML, transactions & index.",
      tags: ["SQL", "Jointures", "Window functions"],
      aide: "matieres/sql/md/aide.md",
    },
  ],
};
