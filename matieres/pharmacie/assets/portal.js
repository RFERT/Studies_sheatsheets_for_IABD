/* =========================================================
   portal.js — Portail autonome « Préparateur en pharmacie »
   Indépendant du portail IABD : recherche, filtres par thème,
   tableau de progression, cartes détaillées avec tags.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Thème (partagé avec les modules) ---------- */
  var THEME_KEY = "cmd-theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_KEY, t);
    var b = document.getElementById("theme-toggle");
    if (b) b.textContent = t === "light" ? "🌙 Sombre" : "☀️ Clair";
  }
  function initTheme() {
    var s = localStorage.getItem(THEME_KEY);
    if (!s) s = (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
    applyTheme(s);
    var b = document.getElementById("theme-toggle");
    if (b) b.addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
    });
  }

  /* ---------- Données ---------- */
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

  /* ---------- Progression (localStorage des modules) ---------- */
  var DONE_KEY = "pharma-done-modules";
  function getDone() {
    try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  /* ---------- Stats ---------- */
  function renderStats() {
    var el = document.getElementById("stats");
    if (!el) return;
    var quizzes = MODULES.reduce(function (s, m) { return s + m.quizzes; }, 0);
    var exos = MODULES.reduce(function (s, m) { return s + m.exos; }, 0);
    var done = getDone();
    var nbDone = MODULES.filter(function (m) { return done[m.id]; }).length;
    var cards = [
      [MODULES.length, "Modules"],
      [quizzes, "Quiz"],
      [exos, "Exercices"],
      [nbDone + "/" + MODULES.length, "Terminés"]
    ];
    el.innerHTML = cards.map(function (c) {
      return '<div class="stat"><div class="num">' + c[0] + '</div><div class="lbl">' + c[1] + '</div></div>';
    }).join("");
  }

  /* ---------- Tableau de progression ---------- */
  function renderDash() {
    var el = document.getElementById("dash");
    if (!el) return;
    var done = getDone();
    var nb = MODULES.filter(function (m) { return done[m.id]; }).length;
    var pct = Math.round((nb / MODULES.length) * 100);
    var pills = MODULES.map(function (m) {
      var d = !!done[m.id];
      return '<span class="dash-pill' + (d ? " done" : "") + '" title="' + m.title + '">' +
        (d ? "✓ " : "") + "M" + m.num + "</span>";
    }).join("");
    var next = MODULES.filter(function (m) { return !done[m.id]; })[0];
    var cta = next
      ? 'Reprendre : <a href="' + next.file + '">' + next.emoji + " " + next.title + "</a>"
      : "🎉 Tous les modules sont terminés. Bravo !";
    el.innerHTML =
      '<div class="dash-ring" style="--p:' + pct + '"><span>' + pct + '%</span></div>' +
      '<div class="dash-info"><div class="dh">' + nb + " / " + MODULES.length + " modules terminés</div>" +
      '<div class="ds">' + cta + "</div>" +
      '<div class="dash-list">' + pills + "</div></div>";
  }

  /* ---------- Barre de filtres par thème ---------- */
  var activeTheme = null;
  function allThemes() {
    var set = [];
    MODULES.forEach(function (m) { m.themes.forEach(function (t) { if (set.indexOf(t) < 0) set.push(t); }); });
    return set.sort();
  }
  function renderTagbar() {
    var el = document.getElementById("tagbar");
    if (!el) return;
    var chips = ['<span class="tb-lbl">Filtrer :</span>'];
    chips.push('<span class="chip' + (activeTheme === null ? " on" : "") + '" data-theme="">Tout</span>');
    allThemes().forEach(function (t) {
      chips.push('<span class="chip' + (activeTheme === t ? " on" : "") + '" data-theme="' + t + '">' + t + "</span>");
    });
    el.innerHTML = chips.join("");
    Array.prototype.forEach.call(el.querySelectorAll(".chip"), function (c) {
      c.addEventListener("click", function () {
        var t = c.getAttribute("data-theme");
        activeTheme = t ? t : null;
        renderTagbar();
        applyFilter();
      });
    });
  }

  /* ---------- Cartes ---------- */
  function cardHTML(m) {
    var done = getDone();
    var tags = m.tags.map(function (t) { return '<span class="tag">' + t + "</span>"; }).join("");
    var topics = m.topics.map(function (t) { return "<li>" + t + "</li>"; }).join("");
    var badge = done[m.id] ? '<div class="status ready">✓ Terminé</div>' : '<div class="status ready">● Disponible</div>';
    return '<a class="card module" data-id="' + m.id + '" data-themes="' + m.themes.join(",") + '" href="' + m.file + '">' +
      '<div class="num">A' + m.year + " · Module " + m.num + " · " + m.emoji + (m.star ? " ⭐" : "") + "</div>" +
      "<h3>" + m.title + "</h3>" +
      '<p style="color:var(--text-soft);font-style:italic;margin:.2em 0 .4em">' + m.subtitle + "</p>" +
      "<p>" + m.desc + "</p>" +
      '<ul class="card-topics">' + topics + "</ul>" +
      '<div class="tags">' + tags + "</div>" +
      '<div class="card-meta"><span>📝 ' + m.quizzes + " quiz</span><span>🧩 " + m.exos + " exercices</span><span>📚 " + m.topics.length + " sections</span></div>" +
      badge + "</a>";
  }
  function renderCards() {
    YEARS.forEach(function (y) {
      var grid = document.getElementById("year" + y.id);
      if (!grid) return;
      grid.innerHTML = MODULES.filter(function (m) { return m.year === y.id; }).map(cardHTML).join("");
    });
  }
  function applyFilter() {
    Array.prototype.forEach.call(document.querySelectorAll(".card.module"), function (card) {
      var themes = (card.getAttribute("data-themes") || "").split(",");
      var show = activeTheme === null || themes.indexOf(activeTheme) >= 0;
      card.classList.toggle("filtered", !show);
    });
    YEARS.forEach(function (y) {
      var head = document.getElementById("yh" + y.id);
      var grid = document.getElementById("year" + y.id);
      if (!head || !grid) return;
      var any = grid.querySelector(".card.module:not(.filtered)");
      head.style.display = any ? "" : "none";
      grid.style.display = any ? "" : "none";
    });
  }

  /* ---------- Recherche ---------- */
  function searchIndex() {
    var idx = [];
    MODULES.forEach(function (m) {
      idx.push({ m: m, label: m.title, type: "Module", hay: (m.title + " " + m.subtitle + " " + m.desc + " " + m.tags.join(" ") + " " + m.themes.join(" ")).toLowerCase() });
      m.topics.forEach(function (t) {
        idx.push({ m: m, label: t, type: "Section · " + m.title, hay: (t + " " + m.title).toLowerCase() });
      });
      m.tags.forEach(function (t) {
        idx.push({ m: m, label: t, type: "Notion · " + m.title, hay: (t + " " + m.title).toLowerCase() });
      });
    });
    return idx;
  }
  function initSearch() {
    var input = document.getElementById("search-input");
    var box = document.getElementById("search-results");
    if (!input || !box) return;
    var idx = searchIndex();
    var active = -1, items = [];

    function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    function run(q) {
      q = norm(q.trim());
      if (!q) { box.hidden = true; box.innerHTML = ""; return; }
      var seen = {}, res = [];
      idx.forEach(function (e) {
        if (norm(e.hay).indexOf(q) >= 0) {
          var k = e.type + "|" + e.label;
          if (!seen[k]) { seen[k] = 1; res.push(e); }
        }
      });
      res = res.slice(0, 12);
      items = res;
      active = -1;
      if (!res.length) { box.hidden = false; box.innerHTML = '<div class="sr-empty">Aucun résultat pour « ' + q + " »</div>"; return; }
      box.innerHTML = res.map(function (e, i) {
        return '<a class="sr-item" data-i="' + i + '" href="' + e.m.file + '">' +
          '<span class="sr-emoji">' + e.m.emoji + "</span>" +
          '<span><span class="sr-title">' + e.label + "</span><br><span class=\"sr-sub\">" + e.type + "</span></span></a>";
      }).join("");
      box.hidden = false;
    }
    input.addEventListener("input", function () { run(input.value); });
    input.addEventListener("keydown", function (ev) {
      var links = box.querySelectorAll(".sr-item");
      if (ev.key === "ArrowDown") { ev.preventDefault(); active = Math.min(active + 1, links.length - 1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); active = Math.max(active - 1, 0); }
      else if (ev.key === "Enter") { if (active >= 0 && links[active]) { window.location = links[active].getAttribute("href"); } return; }
      else if (ev.key === "Escape") { box.hidden = true; input.blur(); return; }
      else return;
      Array.prototype.forEach.call(links, function (l, i) { l.classList.toggle("active", i === active); });
      if (links[active]) links[active].scrollIntoView({ block: "nearest" });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search-wrap")) box.hidden = true;
    });
    document.addEventListener("keydown", function (e) {
      if ((e.key === "/" || (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey))) &&
          document.activeElement !== input) { e.preventDefault(); input.focus(); }
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initTheme();
    renderStats();
    renderDash();
    renderCards();
    renderTagbar();
    applyFilter();
    initSearch();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
