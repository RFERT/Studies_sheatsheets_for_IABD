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
          file: "matieres/git/md/0-bases.md"
        },
        {
          id: "branches",
          title: "Branches & fusion",
          desc: "Travailler en parallèle sans se marcher dessus : branch, merge, conflits.",
          badge: "Module 2",
          file: "matieres/git/md/1-branches.md"
        }
      ]
    }
  ]
};
