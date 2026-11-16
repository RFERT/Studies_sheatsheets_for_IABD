/* =========================================================
   competences.js — CATALOGUE « Compétences info » (hors cursus)
   =========================================================
   Rendu par competences.html (menu filtrable de cours).
   Chaque cours est d'abord une coquille « À venir » avec son programme prévu.

   👉 Pour REMPLIR un cours du catalogue :
      écris-le normalement en Markdown (matieres/<x>/md/*.md) et déclare-le
      dans matieres/cours.js avec LE MÊME `code` qu'ici.
      La carte devient automatiquement « Disponible » et pointe vers le cours.
      Rien d'autre à toucher dans ce fichier.

   Champs d'un cours : code (UNIQUE, identique à cours.js), emoji, name, desc,
   programme (liste des chapitres prévus).
   Une ligne par cours : build-search-index.py lit ce fichier pour la recherche.
   ========================================================= */
window.COMPETENCES = {
  categories: [
    {
      id: "hardware", emoji: "🖥️", name: "Hardware & architecture", color: "#f59e0b",
      desc: "Ce qu'il y a vraiment sous le capot : processeur, mémoire, stockage, GPU, électronique.",
      courses: [
        { code: "HWARCHI", emoji: "🧩", name: "Architecture des ordinateurs", desc: "Comment un processeur exécute ton code : binaire, registres, caches, pipeline, multicœur.", programme: ["Modèle de von Neumann & cycle fetch-decode-execute", "Représentation des nombres : entiers, complément à 2, flottants IEEE 754", "Hiérarchie mémoire : registres, caches L1/L2/L3, RAM, localité", "Pipeline, prédiction de branchement, SIMD, multicœur", "Premiers pas en assembleur x86-64 / ARM"] },
        { code: "HWPC", emoji: "🔩", name: "Composants & montage d'un PC", desc: "Choisir, assembler et diagnostiquer une machine : carte mère, CPU, RAM, SSD, alimentation.", programme: ["Rôle de chaque composant et goulots d'étranglement", "Compatibilités : sockets, chipsets, générations de RAM, PCIe", "Montage pas à pas, BIOS/UEFI, premier démarrage", "Refroidissement, alimentation, consommation", "Diagnostic de panne et outils de benchmark"] },
        { code: "HWGPU", emoji: "🎮", name: "GPU & accélérateurs pour l'IA", desc: "Pourquoi le deep learning tourne sur GPU : architecture massivement parallèle, CUDA, VRAM, TPU/NPU.", programme: ["CPU vs GPU : latence contre débit", "Architecture GPU : SM, warps, Tensor Cores, VRAM", "CUDA et l'écosystème (cuDNN, PyTorch sur GPU)", "TPU, NPU et puces spécialisées", "Choisir et surveiller un GPU (nvidia-smi, mémoire, précision mixte)"] },
        { code: "HWSTOCK", emoji: "💾", name: "Stockage & systèmes de fichiers", desc: "HDD, SSD, NVMe, RAID, systèmes de fichiers et sauvegardes : où vivent physiquement les données.", programme: ["HDD, SSD SATA, NVMe : fonctionnement et performances", "IOPS, débit, latence : mesurer un disque", "RAID 0/1/5/10 et tolérance aux pannes", "Systèmes de fichiers : NTFS, ext4, APFS, ZFS", "Stratégie de sauvegarde 3-2-1"] },
        { code: "HWEMB", emoji: "📟", name: "Électronique, embarqué & IoT", desc: "Logique booléenne, microcontrôleurs, Arduino, Raspberry Pi, capteurs et IA embarquée (edge AI).", programme: ["Logique booléenne, portes et circuits combinatoires", "Microcontrôleurs vs ordinateurs monocartes", "Arduino et Raspberry Pi : GPIO, capteurs, actionneurs", "Protocoles : I²C, SPI, UART, MQTT", "Edge AI : faire tourner un modèle sur un petit appareil"] }
      ]
    },
    {
      id: "systemes", emoji: "🐧", name: "Systèmes & réseaux", color: "#3b82f6",
      desc: "Le terrain de jeu de tout informaticien : OS, ligne de commande, réseau, virtualisation.",
      courses: [
        { code: "LINUX", emoji: "🐧", name: "Linux & ligne de commande", desc: "Être à l'aise dans un terminal : fichiers, permissions, processus, pipes, scripts bash, SSH.", programme: ["Arborescence, navigation et manipulation de fichiers", "Permissions, utilisateurs, sudo", "Pipes, redirections, grep/sed/awk", "Processus, services, gestion des paquets", "Scripts bash et SSH"] },
        { code: "PWSH", emoji: "🪟", name: "Windows & PowerShell", desc: "Automatiser Windows : objets PowerShell, scripts, WSL, gestion des chemins et des services.", programme: ["Cmdlets, pipeline d'objets, Get-Help", "Fichiers, chemins et encodages", "Scripts, fonctions et modules", "Tâches planifiées et services", "WSL : Linux dans Windows"] },
        { code: "OS", emoji: "⚙️", name: "Systèmes d'exploitation", desc: "Ce que fait l'OS pour toi : processus, threads, ordonnancement, mémoire virtuelle, appels système.", programme: ["Processus, threads et changement de contexte", "Ordonnancement et priorités", "Mémoire virtuelle, pagination, swap", "Appels système et interruptions", "Concurrence : mutex, sémaphores, interblocages"] },
        { code: "LANGC", emoji: "🅲", name: "Langage C & mémoire", desc: "Consolider le C : pointeurs, allocation dynamique, structures, compilation et outils de débogage mémoire.", programme: ["Types, pointeurs et arithmétique de pointeurs", "Pile, tas, malloc/free et fuites mémoire", "Structures, tableaux et chaînes", "Entrées/sorties : stdio, fichiers", "Compilation (gcc, make) et Valgrind"] },
        { code: "NET", emoji: "🌐", name: "Réseaux informatiques", desc: "Comprendre Internet : modèles OSI/TCP-IP, adressage IP, TCP/UDP, DNS, HTTP et outils de diagnostic.", programme: ["Modèles OSI et TCP/IP", "Adressage IPv4/IPv6, masques, sous-réseaux", "TCP vs UDP, ports, sockets", "DNS, DHCP, NAT", "HTTP/HTTPS et diagnostic (ping, traceroute, curl, Wireshark)"] },
        { code: "VIRT", emoji: "🧊", name: "Virtualisation", desc: "Machines virtuelles, hyperviseurs et différences avec les conteneurs.", programme: ["Hyperviseurs de type 1 et 2", "Créer et gérer une VM (VirtualBox, Hyper-V, Proxmox)", "Réseau et stockage virtuels", "VM vs conteneurs : quand choisir quoi", "Snapshots, clones et sauvegardes"] }
      ]
    },
    {
      id: "genie-logiciel", emoji: "🛠️", name: "Génie logiciel", color: "#10b981",
      desc: "Écrire du code fiable, lisible et maintenable, seul ou en équipe.",
      courses: [
        { code: "GIT", emoji: "🔧", name: "Git & GitHub (avancé)", desc: "Branches, rebase, résolution de conflits, workflows d'équipe et pull requests.", programme: ["Les bases de Git", "Branches & fusion", "Rebase interactif et réécriture d'historique", "Workflows d'équipe (GitHub Flow, Git Flow)", "Pull requests et résolution de conflits"] },
        { code: "ALGO", emoji: "🧮", name: "Algorithmique & structures de données", desc: "Complexité, tris, arbres, graphes, tables de hachage, programmation dynamique : la base des entretiens techniques.", programme: ["Complexité temporelle et spatiale (notation O)", "Tableaux, listes, piles, files, tables de hachage", "Tris et recherche dichotomique", "Arbres, tas et graphes (BFS, DFS, Dijkstra)", "Récursivité et programmation dynamique"] },
        { code: "TEST", emoji: "🧪", name: "Tests logiciels & TDD", desc: "Tests unitaires et d'intégration, mocks, couverture et développement piloté par les tests.", programme: ["Pourquoi tester : pyramide des tests", "pytest : assertions, fixtures, paramétrage", "Mocks, stubs et isolation", "Couverture de code et ses limites", "TDD : rouge, vert, refactor"] },
        { code: "CLEAN", emoji: "🧼", name: "Clean code, refactoring & SOLID", desc: "Nommer, découper, simplifier : rendre le code lisible et facile à faire évoluer.", programme: ["Nommage, fonctions courtes, responsabilité unique", "Code smells et refactorings classiques", "Principes SOLID, DRY, KISS, YAGNI", "Gestion des erreurs propre", "Linters et formatters (ruff, black, clippy)"] },
        { code: "PATTERN", emoji: "🧱", name: "Design patterns", desc: "Les solutions éprouvées aux problèmes de conception récurrents, avec exemples en Python.", programme: ["Patterns de création : Factory, Builder, Singleton", "Patterns de structure : Adapter, Decorator, Facade", "Patterns de comportement : Strategy, Observer, Command", "Injection de dépendances", "Anti-patterns à éviter"] },
        { code: "DEBUG", emoji: "🐞", name: "Débogage & logs", desc: "Trouver un bug méthodiquement : stack traces, débogueur, points d'arrêt, journalisation.", programme: ["Lire une stack trace et reproduire un bug", "Débogueur : points d'arrêt, pas à pas, inspection", "Logging : niveaux, formats, rotation", "Débogage par dichotomie (git bisect)", "Lire et filtrer des logs en production"] },
        { code: "PERF", emoji: "🚀", name: "Performance & profilage", desc: "Mesurer avant d'optimiser : profileurs, mémoire, vectorisation, cache et parallélisme.", programme: ["Mesurer : benchmarks et timeit", "Profiler CPU (cProfile, py-spy) et mémoire", "Vectorisation NumPy vs boucles Python", "Cache, mémoïsation, structures adaptées", "Parallélisme : threads, processus, async"] },
        { code: "REVIEW", emoji: "👀", name: "Revue de code & collaboration", desc: "Faire et recevoir une revue de code utile, conventions d'équipe et qualité automatisée.", programme: ["Objectifs d'une revue de code", "Rédiger une bonne pull request", "Commenter avec bienveillance et précision", "Conventions : commits, branches, style", "Automatiser : pre-commit, CI, linters"] },
        { code: "REGEX", emoji: "🔎", name: "Expressions régulières", desc: "Chercher, valider et extraire du texte avec les regex, en Python et en ligne de commande.", programme: ["Caractères, classes et quantificateurs", "Ancres, groupes et captures", "Lookahead / lookbehind", "Le module re de Python", "Regex en ligne de commande (grep, sed) et pièges courants"] },
        { code: "DOC", emoji: "📝", name: "Documentation technique", desc: "README, docstrings, schémas et décisions d'architecture : documenter pour les autres (et pour soi).", programme: ["Un README qui donne envie", "Docstrings et documentation générée (Sphinx, MkDocs)", "Schémas en texte (Mermaid)", "ADR : tracer les décisions d'architecture", "Documenter une API (OpenAPI)"] },
        { code: "DEVENV", emoji: "⌨️", name: "Environnement de dev & productivité", desc: "Maîtriser ses outils : VS Code, terminal, environnements virtuels, raccourcis, dotfiles.", programme: ["VS Code : raccourcis, extensions, débogueur intégré", "Environnements Python : venv, pip, uv, conda", "Terminal efficace et alias", "Gestion des secrets et variables d'environnement", "Dotfiles et reproductibilité du poste"] }
      ]
    },
    {
      id: "architecture-web", emoji: "🏗️", name: "Architecture, web & APIs", color: "#8b5cf6",
      desc: "Concevoir des applications et exposer des services (y compris des modèles d'IA).",
      courses: [
        { code: "ARCHI", emoji: "🏛️", name: "Architecture logicielle", desc: "Monolithe, microservices, architecture en couches ou hexagonale, événements et scalabilité.", programme: ["Monolithe vs microservices", "Architecture en couches et hexagonale", "Communication synchrone vs asynchrone", "Scalabilité, cache, répartition de charge", "Choisir une architecture pour un projet data/IA"] },
        { code: "API", emoji: "🔌", name: "APIs REST & FastAPI", desc: "Concevoir une API REST propre et servir un modèle de ML avec FastAPI.", programme: ["HTTP : méthodes, codes de statut, en-têtes", "Concevoir des routes REST et du JSON", "FastAPI : routes, validation Pydantic, docs auto", "Authentification (clés, OAuth2, JWT)", "Servir un modèle de ML en API"] },
        { code: "WEB", emoji: "🧑‍💻", name: "Développement web (HTML/CSS/JS)", desc: "Les bases du front : structure HTML, mise en page CSS responsive, JavaScript et DOM.", programme: ["HTML sémantique et accessibilité", "CSS : boîtes, flexbox, grid, responsive", "JavaScript : syntaxe, DOM, événements", "fetch et appels d'API", "Publier un site statique (GitHub Pages)"] },
        { code: "UML", emoji: "📐", name: "Modélisation & conception (UML)", desc: "Modéliser un système avant de coder : cas d'utilisation, classes, séquences, modèles de données.", programme: ["Cas d'utilisation et besoins", "Diagrammes de classes", "Diagrammes de séquence et d'activité", "Du modèle conceptuel au schéma de données", "Outils : PlantUML, Mermaid"] }
      ]
    },
    {
      id: "devops", emoji: "☁️", name: "DevOps, Cloud & MLOps", color: "#06b6d4",
      desc: "Livrer, déployer et faire tourner du code et des modèles en production.",
      courses: [
        { code: "DOCKER", emoji: "🐳", name: "Docker & conteneurs", desc: "Images, conteneurs, Dockerfile, volumes, réseaux et Docker Compose.", programme: ["Conteneur vs VM : ce qui change vraiment", "Images, couches et Dockerfile", "Volumes, réseaux et variables d'environnement", "Docker Compose pour une stack complète", "Bonnes pratiques : images légères, multi-stage, sécurité"] },
        { code: "K8S", emoji: "☸️", name: "Kubernetes", desc: "Orchestrer des conteneurs : pods, déploiements, services, configuration et mise à l'échelle.", programme: ["Pourquoi un orchestrateur", "Pods, ReplicaSets, Deployments", "Services, Ingress et réseau", "ConfigMaps, Secrets, volumes", "Mise à l'échelle automatique et Helm"] },
        { code: "CICD", emoji: "🔁", name: "CI/CD", desc: "Automatiser tests, builds et déploiements avec GitHub Actions et GitLab CI.", programme: ["Intégration continue vs déploiement continu", "GitHub Actions : workflows, jobs, steps", "GitLab CI : pipelines et runners", "Tests, lint et artefacts dans le pipeline", "Déploiement automatisé et secrets"] },
        { code: "CLOUD", emoji: "☁️", name: "Cloud computing (AWS, GCP, Azure)", desc: "Les briques du cloud : calcul, stockage, réseau, IAM, services managés et maîtrise des coûts.", programme: ["IaaS, PaaS, SaaS et modèle de responsabilité partagée", "Calcul : VM, serverless, conteneurs managés", "Stockage objet et bases managées", "Réseau, IAM et sécurité", "Coûts : estimer, surveiller, optimiser"] },
        { code: "IAC", emoji: "🏗️", name: "Infrastructure as Code", desc: "Décrire son infrastructure en code versionné avec Terraform et Ansible.", programme: ["Pourquoi l'IaC : reproductibilité et revue", "Terraform : providers, ressources, état", "Modules et environnements", "Ansible : configuration de machines", "Bonnes pratiques et sécurité de l'état"] },
        { code: "MLOPS", emoji: "🤖", name: "MLOps", desc: "Industrialiser le ML : suivi d'expériences, versionnage de données, déploiement et monitoring de modèles.", programme: ["Cycle de vie d'un modèle en production", "Suivi d'expériences avec MLflow", "Versionner données et modèles (DVC)", "Déployer un modèle (batch, API, temps réel)", "Monitoring : dérive des données et du modèle"] },
        { code: "OBS", emoji: "📈", name: "Observabilité & monitoring", desc: "Logs, métriques et traces : savoir ce qui se passe en production avec Prometheus et Grafana.", programme: ["Les trois piliers : logs, métriques, traces", "Prometheus : métriques et requêtes", "Grafana : tableaux de bord", "Alertes utiles (et pas trop nombreuses)", "SLI, SLO et gestion des incidents"] },
        { code: "AIRFLOW", emoji: "🌬️", name: "Orchestration de pipelines (Airflow)", desc: "Planifier et fiabiliser des pipelines de données (ETL/ELT) avec Apache Airflow.", programme: ["ETL vs ELT et pipelines de données", "Airflow : DAGs, tâches, opérateurs", "Planification, rejouabilité, idempotence", "Dépendances, capteurs et XCom", "Surveiller et tester un pipeline"] }
      ]
    },
    {
      id: "securite", emoji: "🔒", name: "Sécurité & conformité", color: "#ef4444",
      desc: "Protéger les systèmes, les données et les utilisateurs, et respecter la loi.",
      courses: [
        { code: "SECAPP", emoji: "🛡️", name: "Sécurité applicative (OWASP)", desc: "Les failles les plus courantes (injections, XSS, secrets exposés) et comment s'en protéger.", programme: ["Le Top 10 OWASP", "Injections SQL et commandes", "XSS, CSRF et sécurité web", "Gestion des secrets et des dépendances vulnérables", "Authentification et contrôle d'accès"] },
        { code: "CRYPTO", emoji: "🔐", name: "Cryptographie appliquée", desc: "Hachage, chiffrement symétrique et asymétrique, signatures, TLS et stockage des mots de passe.", programme: ["Hachage et intégrité (SHA-2, HMAC)", "Chiffrement symétrique (AES) et asymétrique (RSA, courbes elliptiques)", "Signatures et certificats", "TLS / HTTPS de bout en bout", "Stocker des mots de passe (bcrypt, Argon2)"] },
        { code: "CYBER", emoji: "🕵️", name: "Cybersécurité systèmes & réseaux", desc: "Pare-feu, VPN, durcissement, bases du test d'intrusion et entraînement en CTF.", programme: ["Surface d'attaque et modèle de menace", "Pare-feu, VPN, segmentation réseau", "Durcissement d'un serveur Linux", "Bases du test d'intrusion (éthique et légal)", "S'entraîner : CTF et plateformes d'apprentissage"] },
        { code: "RGPD", emoji: "⚖️", name: "RGPD, éthique & IA responsable", desc: "Données personnelles, consentement, biais, explicabilité et cadre européen de l'IA (AI Act).", programme: ["Données personnelles et principes du RGPD", "Bases légales, consentement et droits des personnes", "Anonymisation vs pseudonymisation", "Biais, équité et explicabilité des modèles", "Le règlement européen sur l'IA (AI Act)"] }
      ]
    },
    {
      id: "soft-skills", emoji: "🤝", name: "Méthodes & soft skills", color: "#ec4899",
      desc: "Ce qui fait la différence en entreprise et en entretien, au-delà de la technique.",
      courses: [
        { code: "AGILE", emoji: "🗂️", name: "Gestion de projet Agile", desc: "Scrum, Kanban, user stories, estimation et rituels d'équipe.", programme: ["Manifeste Agile et cycle en V", "Scrum : rôles, sprints, rituels", "Kanban et flux de travail", "User stories, backlog, estimation", "Outils : Jira, GitHub Projects"] },
        { code: "VULGA", emoji: "🗣️", name: "Vulgarisation & communication", desc: "Expliquer la data et l'IA à des non-experts, à l'écrit comme à l'oral.", programme: ["Connaître son public", "Simplifier sans trahir", "Analogies utiles (et trompeuses)", "Présenter des résultats à un décideur", "Écrire un e-mail ou un rapport technique clair"] },
        { code: "STORY", emoji: "📊", name: "Data storytelling & dataviz", desc: "Transformer une analyse en message convaincant : choisir le bon graphique et raconter une histoire.", programme: ["Structure d'une histoire de données", "Choisir le bon graphique", "Couleurs, hiérarchie visuelle, désencombrement", "Tableaux de bord utiles", "Pièges : graphiques trompeurs"] },
        { code: "VEILLE", emoji: "📡", name: "Veille technologique", desc: "Organiser une veille efficace sans se noyer : sources, outils, prise de notes.", programme: ["Pourquoi et comment faire de la veille", "Sources : papiers, blogs, newsletters, conférences", "Lire un article scientifique (arXiv)", "Outils : RSS, agrégateurs, prise de notes", "Partager sa veille"] },
        { code: "ENTRETIEN", emoji: "🎯", name: "Préparation aux entretiens", desc: "Entretiens techniques et comportementaux, tests de code, études de cas data.", programme: ["CV et profil LinkedIn d'un profil IABD", "Entretien comportemental (méthode STAR)", "Exercices de code et live coding", "Études de cas data / ML", "Négociation et questions à poser"] },
        { code: "PORTFOLIO", emoji: "💼", name: "Portfolio & projets perso", desc: "Construire un GitHub soigné et des projets qui montrent tes compétences.", programme: ["Choisir des projets qui parlent aux recruteurs", "Un dépôt GitHub professionnel", "README, démos et notebooks présentables", "Publier : GitHub Pages, Hugging Face Spaces", "Raconter ses projets en entretien"] },
        { code: "ANGLAIS", emoji: "🇬🇧", name: "Anglais technique", desc: "Lire la doc, écrire des issues et présenter en anglais dans un contexte tech.", programme: ["Vocabulaire technique essentiel", "Lire une documentation et un article", "Écrire une issue, une PR, un e-mail", "Présenter un projet à l'oral", "Faux-amis et erreurs fréquentes"] },
        { code: "ORAL", emoji: "🎤", name: "Soutenance & prise de parole", desc: "Préparer une soutenance de projet : structure, slides, démo et questions du jury.", programme: ["Structurer une présentation", "Des slides lisibles", "Réussir une démo en direct", "Gérer le stress et le temps", "Répondre aux questions du jury"] }
      ]
    }
  ]
};
