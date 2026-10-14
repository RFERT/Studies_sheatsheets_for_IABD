/* =========================================================
   portal.js — Hub de cours ESGI (data-driven)
   Pour AJOUTER une matière : ajoute une entrée dans SUBJECTS.
   ========================================================= */

const SUBJECTS = [
  {
    code: "LANG",
    name: "Rust",
    emoji: "🦀",
    color: "#f74c00",
    status: "ready",
    featured: true,
    href: "matieres/rust/rust-cursus.html",
    extra: [
      { label: "🔥 Révision express partiel", href: "matieres/rust/revision-express.html" }
    ],
    desc: "Du débutant total à l'intermédiaire : Cargo, ownership, borrowing, lifetimes, traits, closures, concurrence. 16 modules + examen final.",
    tags: ["Ownership", "Borrowing", "Lifetimes", "Traits"],
    meta: "16 modules · 117 questions"
  },
  {
    code: "MATH",
    name: "Mathématiques",
    emoji: "∑",
    color: "#6c8cff",
    status: "ready",
    featured: true,
    href: "matieres/mathematiques/index.html",
    desc: "Maths pour la Data, le Big Data & l'IA : logique, relations binaires, algèbre linéaire, probas, stats, optimisation, graphes, info, Big Data.",
    tags: ["Algèbre", "Probas", "Optimisation", "Big Data"],
    meta: "10 modules · 88 quiz · examen blanc"
  },
  {
    code: "DATA",
    name: "Python & Data Science",
    emoji: "🐍",
    color: "#3b82f6",
    status: "soon",
    desc: "NumPy, Pandas, visualisation, nettoyage de données, feature engineering, pipelines. À construire ensemble.",
    tags: ["Pandas", "NumPy", "EDA"],
    meta: "À venir"
  },
  {
    code: "ML",
    name: "Machine Learning",
    emoji: "🤖",
    color: "#27e0b0",
    status: "soon",
    desc: "Apprentissage supervisé/non supervisé, évaluation, régularisation, arbres, ensembles, scikit-learn.",
    tags: ["Supervisé", "Clustering", "Évaluation"],
    meta: "À venir"
  },
  {
    code: "DL",
    name: "Deep Learning",
    emoji: "🧠",
    color: "#b98cff",
    status: "soon",
    desc: "Réseaux de neurones, CNN, RNN, Transformers, PyTorch. Suite logique du module Optimisation des maths.",
    tags: ["PyTorch", "CNN", "Transformers"],
    meta: "À venir"
  },
  {
    code: "BIGD",
    name: "Big Data & Distribué",
    emoji: "🗄️",
    color: "#ffb454",
    status: "soon",
    desc: "Hadoop, Spark, Kafka, data lakes, MapReduce en pratique. Prolonge le module Maths du Big Data.",
    tags: ["Spark", "Hadoop", "Kafka"],
    meta: "À venir"
  },
  {
    code: "SQL",
    name: "Bases de données",
    emoji: "🧮",
    color: "#22c3a6",
    status: "soon",
    desc: "SQL avancé, modélisation, NoSQL (MongoDB, Redis), optimisation de requêtes, transactions.",
    tags: ["SQL", "NoSQL", "Modélisation"],
    meta: "À venir"
  },
  {
    code: "PRO",
    name: "Compétences pro",
    emoji: "💼",
    color: "#ff6b81",
    status: "soon",
    href: "ameliorations.html",
    desc: "Git avancé, Docker, CI/CD, Agile, clean code, cloud... Compétences clés pour l'entreprise (voir la feuille de route).",
    tags: ["Git", "Docker", "Cloud"],
    meta: "Idées & roadmap"
  }
];

/* ---------- Thème ---------- */
const THEME_KEY = "esgi-portal-theme";
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = t === "light" ? "🌙 Sombre" : "☀️ Clair";
}
function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || "dark");
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "light" ? "dark" : "light");
  });
}

/* ---------- Rendu des matières ---------- */
function renderSubjects() {
  const grid = document.getElementById("subjects");
  if (!grid) return;
  grid.innerHTML = SUBJECTS.map((s) => {
    const clickable = s.status !== "soon" || s.href;
    const tag = clickable && s.href ? "a" : "div";
    const hrefAttr = clickable && s.href ? ` href="${s.href}"` : "";
    const statusTxt = { ready: "● Disponible", soon: "○ Bientôt", wip: "◐ En cours" }[s.status] || "";
    const extras = (s.extra || []).map((e) =>
      `<a class="tag" href="${e.href}" style="border-color:${s.color};color:${s.color}">${e.label}</a>`
    ).join("");
    return `
      <${tag} class="subject${s.status === "soon" && !s.href ? " locked" : ""}"${hrefAttr} style="--sc:${s.color}">
        ${s.featured ? '<div class="ribbon">PRÊT</div>' : ""}
        <div class="banner">
          <div class="emoji">${s.emoji}</div>
          <div class="bt"><div class="code">${s.code}</div><div class="name">${s.name}</div></div>
        </div>
        <div class="body">
          <p>${s.desc}</p>
          <div class="tags">${s.tags.map((t) => `<span class="tag">${t}</span>`).join("")}${extras}</div>
          <div class="foot">
            <span class="status ${s.status}">${statusTxt} · ${s.meta}</span>
            ${clickable && s.href ? `<span class="go">Ouvrir →</span>` : ""}
          </div>
        </div>
      </${tag}>`;
  }).join("");

  // Stats dynamiques
  const ready = SUBJECTS.filter((s) => s.status === "ready").length;
  const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setT("stat-subjects", SUBJECTS.length);
  setT("stat-ready", ready);
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderSubjects();
});
