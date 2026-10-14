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
    meta: "16 modules · 117 questions",
    progress: { key: "rust_cursus_v1", type: "rustAnswered", total: 117, unit: "questions" }
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
    meta: "10 modules · 88 quiz · examen blanc",
    progress: { key: "cmd-done-modules", type: "doneMap", total: 11, unit: "modules" }
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

/* ---------- Progression (lit le localStorage de chaque matière) ---------- */
function readProgress(s) {
  const p = s.progress;
  if (!p) return null;
  let raw;
  try { raw = JSON.parse(localStorage.getItem(p.key)); }
  catch (e) { raw = null; }
  let done = 0;
  if (raw) {
    if (p.type === "doneMap") {
      done = Object.values(raw).filter(Boolean).length;
    } else if (p.type === "rustAnswered") {
      const res = raw.results || {};
      Object.values(res).forEach((sec) => { done += Object.keys(sec || {}).length; });
    }
  }
  done = Math.max(0, Math.min(done, p.total));
  const pct = p.total ? Math.round((done / p.total) * 100) : 0;
  return { done, total: p.total, pct, unit: p.unit || "" };
}

function progressBar(pct, color) {
  return `<div class="pbar"><span style="width:${pct}%;background:${color || "var(--accent)"}"></span></div>`;
}

function renderDashboard() {
  const host = document.getElementById("dashboard");
  if (!host) return;
  const tracked = SUBJECTS.filter((s) => s.progress).map((s) => ({ s, pr: readProgress(s) }));
  const gpct = tracked.length
    ? Math.round(tracked.reduce((a, { pr }) => a + pr.pct, 0) / tracked.length)
    : 0;
  const started = tracked.some(({ pr }) => pr.done > 0);

  const ring = `
    <div class="ring" style="--p:${gpct}">
      <div class="ring-in"><div class="ring-pct">${gpct}<small>%</small></div><div class="ring-lbl">global</div></div>
    </div>`;

  const rows = tracked.map(({ s, pr }) => `
    <a class="dash-row" href="${s.href}">
      <span class="dr-emoji" style="background:color-mix(in srgb, ${s.color} 22%, transparent)">${s.emoji}</span>
      <span class="dr-main">
        <span class="dr-top"><b>${s.name}</b><span class="dr-num">${pr.done}/${pr.total} ${pr.unit}</span></span>
        ${progressBar(pr.pct, s.color)}
      </span>
      <span class="dr-pct" style="color:${s.color}">${pr.pct}%</span>
    </a>`).join("");

  const hint = started
    ? `Continue sur ta lancée 👊 — ta progression est enregistrée <b>localement</b> sur cet appareil.`
    : `Commence un module : ta progression (modules terminés, quiz répondus) s'affichera ici automatiquement. 💪`;

  host.innerHTML = `
    <div class="dash">
      <div class="dash-ring">${ring}
        <button class="btn dash-reset" id="dash-reset" title="Effacer ma progression locale">↺ Réinitialiser</button>
      </div>
      <div class="dash-list">
        ${rows}
        <p class="dash-hint">${hint}</p>
      </div>
    </div>`;

  const rst = document.getElementById("dash-reset");
  if (rst) rst.addEventListener("click", () => {
    if (!confirm("Effacer toute ta progression enregistrée sur cet appareil ?")) return;
    tracked.forEach(({ s }) => localStorage.removeItem(s.progress.key));
    renderDashboard();
    renderSubjects();
  });
}

/* ---------- Recherche globale ---------- */
function normalize(str) {
  return (str || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function initSearch() {
  const input = document.getElementById("search-input");
  const panel = document.getElementById("search-results");
  if (!input || !panel || !Array.isArray(window.SEARCH_INDEX)) return;

  const idx = window.SEARCH_INDEX.map((e) => ({
    e, nt: normalize(e.t), ns: normalize(e.s), nk: normalize(e.k), ntype: normalize(e.type)
  }));
  const typeLabel = { module: "Module", section: "Section", fiche: "Fiche", cours: "Cours",
    "matière": "Matière", page: "Page" };
  let active = -1, current = [];

  function score(it, tokens) {
    let sc = 0;
    for (const tk of tokens) {
      if (!tk) continue;
      if (it.nt === tk) sc += 20;
      else if (it.nt.startsWith(tk)) sc += 10;
      else if (it.nt.includes(tk)) sc += 6;
      else if (it.nk.includes(tk)) sc += 3;
      else if (it.ns.includes(tk)) sc += 2;
      else if (it.ntype.includes(tk)) sc += 1;
      else return -1; // chaque token doit matcher quelque part
    }
    if (it.e.type === "module" || it.e.type === "matière") sc += 2; // léger boost
    return sc;
  }

  function search(q) {
    const tokens = normalize(q).split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return idx.map((it) => ({ it, sc: score(it, tokens) }))
      .filter((r) => r.sc >= 0)
      .sort((a, b) => b.sc - a.sc || a.it.nt.length - b.it.nt.length)
      .slice(0, 24).map((r) => r.it.e);
  }

  function render(q) {
    current = search(q);
    active = -1;
    if (!q.trim()) { panel.hidden = true; panel.innerHTML = ""; return; }
    if (!current.length) {
      panel.hidden = false;
      panel.innerHTML = `<div class="sr-empty">Aucun résultat pour « ${q} »</div>`;
      return;
    }
    panel.hidden = false;
    panel.innerHTML = current.map((e, i) => `
      <a class="sr-item" href="${e.u}" data-i="${i}">
        <span class="sr-emoji" style="background:color-mix(in srgb, ${e.color} 22%, transparent)">${e.emoji}</span>
        <span class="sr-txt"><span class="sr-t">${e.t}</span>
          <span class="sr-meta">${e.s} · ${typeLabel[e.type] || e.type}</span></span>
        <span class="sr-go">↵</span>
      </a>`).join("") +
      `<div class="sr-foot">${current.length} résultat${current.length > 1 ? "s" : ""} · ↑↓ pour naviguer · Échap pour fermer</div>`;
  }

  function setActive(n) {
    const items = panel.querySelectorAll(".sr-item");
    if (!items.length) return;
    active = (n + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle("active", i === active));
    items[active].scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("input", () => render(input.value));
  input.addEventListener("focus", () => { if (input.value.trim()) render(input.value); });
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown") { ev.preventDefault(); setActive(active + 1); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); setActive(active - 1); }
    else if (ev.key === "Enter") {
      const items = panel.querySelectorAll(".sr-item");
      if (active >= 0 && items[active]) { window.location.href = items[active].getAttribute("href"); }
      else if (current[0]) { window.location.href = current[0].u; }
    } else if (ev.key === "Escape") { input.value = ""; panel.hidden = true; input.blur(); }
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "/" && document.activeElement !== input &&
        !/^(input|textarea|select)$/i.test((document.activeElement || {}).tagName || "")) {
      ev.preventDefault(); input.focus();
    }
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".search-wrap")) panel.hidden = true;
  });
}

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
    const pr = readProgress(s);
    const prBlock = pr && pr.done > 0
      ? `<div class="card-progress">${progressBar(pr.pct, s.color)}<span class="cp-lbl">${pr.pct}% · ${pr.done}/${pr.total} ${pr.unit}</span></div>`
      : "";
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
          ${prBlock}
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
  renderDashboard();
  renderSubjects();
  initSearch();
});
