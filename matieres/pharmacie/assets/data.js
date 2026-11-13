/* =========================================================
   data.js — Source unique des modules du portail Pharmacie
   Chargé avant common.js / nav.js / portal.js sur toutes les pages.
   Expose : window.PHARMA = { years, modules, byId(id), byFile(name) }
   (les chemins `file` sont relatifs à la RACINE du portail pharmacie)
   ========================================================= */
(function () {
  "use strict";

  var YEARS = [
    { id: 1, label: "Année 1 — Sciences fondamentales & bases du métier",
      sub: "Le socle scientifique et les fondamentaux du comptoir." },
    { id: 2, label: "Année 2 — Clinique & pratique officinale",
      sub: "Du médicament au patient : agir, conseiller, sécuriser." }
  ];

  var MODULES = [
    {
      id: "chimie", year: 1, num: 1, emoji: "⚗️",
      title: "Chimie générale & organique",
      subtitle: "Le langage du médicament",
      desc: "Comprendre ce qu'est un atome, une liaison, une solution et un pH avant d'aborder le médicament. Le socle scientifique de toute la formation : des calculs de concentrations aux grandes fonctions organiques.",
      themes: ["Sciences"],
      tags: ["Atome", "Tableau périodique", "Ions & électrolytes", "Liaisons", "pH & tampons", "Concentrations", "Dilutions (C₁V₁=C₂V₂)", "Fonctions organiques"],
      topics: ["L'atome & le tableau périodique", "Liaisons chimiques (covalente, ionique, H)", "Mole, concentrations & dilutions", "Acides, bases & pH", "Chimie organique & fonctions"],
      quizzes: 5, exos: 3, file: "modules/chimie.html"
    },
    {
      id: "anatomie", year: 1, num: 2, emoji: "🦴",
      title: "Anatomie du corps humain",
      subtitle: "La carte du corps",
      desc: "Situer les organes et maîtriser le vocabulaire anatomique : niveaux d'organisation, tissus, plans de l'espace et grands systèmes (locomoteur, cardiovasculaire, respiratoire, digestif, nerveux).",
      themes: ["Sciences"],
      tags: ["Cellule & tissus", "Plans anatomiques", "Proximal/distal", "Squelette & moelle", "Cœur (4 cavités)", "Artères/veines", "Alvéoles", "Tube digestif", "SNC/SNP"],
      topics: ["Niveaux d'organisation & tissus", "Position & repères anatomiques", "Système locomoteur", "Système cardiovasculaire", "Système respiratoire", "Digestif & nerveux"],
      quizzes: 6, exos: 3, file: "modules/anatomie.html"
    },
    {
      id: "physiologie", year: 1, num: 3, emoji: "❤️",
      title: "Physiologie",
      subtitle: "Comment le corps fonctionne",
      desc: "Le fonctionnement normal pour comprendre la maladie et l'action des médicaments : homéostasie, cœur & circulation, respiration, rein, digestion, systèmes nerveux et hormonal, régulation de la glycémie.",
      themes: ["Sciences"],
      tags: ["Homéostasie", "Rétrocontrôle négatif", "Systole/diastole", "Pression artérielle", "Échanges gazeux", "Hémoglobine", "Néphron", "Insuline/Glucagon"],
      topics: ["Homéostasie & régulation", "Cœur & circulation", "Respiration", "Rein & équilibre hydrique", "Nerveux & hormonal"],
      quizzes: 5, exos: 3, file: "modules/physiologie.html"
    },
    {
      id: "galenique", year: 1, num: 4, emoji: "🧪", star: true,
      title: "Galénique & formes pharmaceutiques",
      subtitle: "Du principe actif au médicament",
      desc: "Le cœur technique du métier : transformer un principe actif en médicament utilisable. Voies d'administration, formes galéniques, excipients (et excipients à effet notoire), préparations magistrales et calculs de doses.",
      themes: ["Officine", "Technique"],
      tags: ["Voies d'administration", "Premier passage hépatique", "Formes sèches/liquides/pâteuses", "LP & gastro-résistant", "Excipients", "Effet notoire (EEN)", "Préparations magistrales", "BPP", "Calculs de doses"],
      topics: ["Principe actif, excipient, forme", "Voies d'administration", "Les formes pharmaceutiques", "Excipients & effet notoire", "Préparations à l'officine & calculs"],
      quizzes: 5, exos: 3, file: "modules/galenique.html"
    },
    {
      id: "legislation", year: 1, num: 5, emoji: "⚖️", star: true,
      title: "Législation pharmaceutique",
      subtitle: "Le cadre légal de la dispensation",
      desc: "Exercer en toute légalité : statut du préparateur (L4241-1), définition du médicament (L5111-1), monopole, substances vénéneuses (listes I/II, stupéfiants), règles de l'ordonnance et du renouvellement. Calé sur le CSP et l'ANSM.",
      themes: ["Officine", "Droit"],
      tags: ["Préparateur (L4241-1)", "Médicament (L5111-1)", "AMM", "DCI", "Monopole", "Liste I (rouge)", "Liste II (vert)", "Stupéfiants", "Ordonnance sécurisée", "Renouvellement", "ANSM"],
      topics: ["Le préparateur en pharmacie", "Le médicament & le monopole", "Substances vénéneuses", "L'ordonnance & le renouvellement", "Stupéfiants"],
      quizzes: 5, exos: 3, file: "modules/legislation.html"
    },
    {
      id: "pharmacologie", year: 2, num: 6, emoji: "💊", star: true,
      title: "Pharmacologie & pharmacocinétique",
      subtitle: "Ce que le corps fait au médicament… et inversement",
      desc: "Le module pivot de l'Année 2. Pharmacocinétique (ADME, demi-vie, biodisponibilité) et pharmacodynamie (récepteurs, agonistes/antagonistes, index thérapeutique), grandes classes et interactions médicamenteuses à repérer au comptoir.",
      themes: ["Pharmacologie", "Officine", "Sciences"],
      tags: ["ADME", "Absorption", "Distribution", "Métabolisme (CYP450)", "Élimination", "Demi-vie (t½)", "Biodisponibilité", "Pro-drogue", "Pharmacodynamie", "Récepteurs", "Agoniste/Antagoniste", "Index thérapeutique", "Interactions", "Inducteurs/Inhibiteurs", "Paliers OMS", "Pharmacovigilance"],
      topics: ["Pharmacocinétique : ADME", "Demi-vie & posologie", "Pharmacodynamie : mécanismes", "Grandes classes de médicaments", "Interactions médicamenteuses"],
      quizzes: 5, exos: 3, file: "modules/pharmacologie.html"
    },
    {
      id: "pathologie", year: 2, num: 7, emoji: "🩺",
      title: "Pathologie par système",
      subtitle: "Comprendre, conseiller, orienter",
      desc: "Reconnaître les grandes maladies et leurs traitements pour comprendre une ordonnance et repérer les signes de gravité : HTA, diabète (type 1 et 2), asthme/BPCO, infections et antibiorésistance, douleur et inflammation.",
      themes: ["Clinique", "Officine"],
      tags: ["Signe/Symptôme", "Aigu/Chronique", "HTA", "Observance", "Diabète type 1/2", "Hypoglycémie (urgence)", "Asthme", "BPCO", "Infections", "Antibiorésistance"],
      topics: ["Vocabulaire de la maladie", "Cardiovasculaire : HTA", "Métabolique : diabète", "Respiratoire : asthme & BPCO", "Pathologies infectieuses"],
      quizzes: 5, exos: 3, file: "modules/pathologie.html"
    },
    {
      id: "toxicologie", year: 2, num: 8, emoji: "☠️",
      title: "Toxicologie",
      subtitle: "Quand le médicament devient poison",
      desc: "Repérer un risque de surdosage et connaître les premiers réflexes : relation dose-effet, intoxications fréquentes (paracétamol, opioïdes, CO), antidotes, conduite à tenir et centres antipoison.",
      themes: ["Clinique", "Urgence"],
      tags: ["Dose-effet (Paracelse)", "DL50", "Paracétamol → NAC", "Opioïdes → Naloxone", "Benzodiazépines → Flumazénil", "CO → Oxygène", "AVK → Vitamine K", "Caustiques", "Centres antipoison"],
      topics: ["Dose, effet & toxique", "Intoxications médicamenteuses", "Intoxications domestiques", "Conduite à tenir & antidotes"],
      quizzes: 4, exos: 3, file: "modules/toxicologie.html"
    },
    {
      id: "diagnostic", year: 2, num: 9, emoji: "🔬",
      title: "Diagnostic : tests & dispositifs",
      subtitle: "Mesurer, interpréter, orienter",
      desc: "Les services de l'officine moderne : mesure des constantes (tension, glycémie, IMC), tests rapides (TROD) et autotests, bandelettes urinaires, dispositifs médicaux et marquage CE.",
      themes: ["Officine", "Clinique"],
      tags: ["Tension", "Glycémie capillaire", "Température", "SpO₂", "IMC", "TROD angine", "Autotests", "Bandelette urinaire", "Dispositifs médicaux", "Marquage CE"],
      topics: ["Constantes & mesures", "Tests rapides & autotests", "Bandelettes urinaires", "Dispositifs médicaux"],
      quizzes: 4, exos: 3, file: "modules/diagnostic.html"
    }
  ];

  window.PHARMA = {
    years: YEARS,
    modules: MODULES,
    byId: function (id) {
      for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === id) return MODULES[i];
      return null;
    },
    // Retrouve un module à partir d'un nom de fichier ("toxicologie.html") ou d'un chemin
    byFile: function (name) {
      var f = String(name || "").split(/[?#]/)[0].split("/").pop();
      for (var i = 0; i < MODULES.length; i++) {
        if (MODULES[i].file.split("/").pop() === f) return MODULES[i];
      }
      return null;
    }
  };
})();
