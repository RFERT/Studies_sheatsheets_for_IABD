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
      { label: "🔥 Révision express partiel", href: "matieres/rust/revision-express.html" },
      { label: "⚡ Antisèche", href: "matieres/rust/cheatsheet-rust.html" }
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
    extra: [
      { label: "⚡ Aide-mémoire", href: "matieres/mathematiques/aide-memoire.html" }
    ],
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
    status: "ready",
    featured: true,
    href: "matieres/python/index.html",
    extra: [
      { label: "⚡ Aide-mémoire", href: "matieres/python/aide-memoire.html" }
    ],
    desc: "Python avancé (générateurs, décorateurs, typing) puis la stack data : NumPy, Pandas, visualisation, feature engineering, scikit-learn. Niveau pro.",
    tags: ["Pandas", "NumPy", "scikit-learn"],
    meta: "6 modules · 30+ quiz",
    progress: { key: "pds-done-modules", type: "doneMap", total: 6, unit: "modules" }
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

/* ---------- Streak de révision (jours consécutifs) ---------- */
const STREAK_KEY = "esgi-streak";
function dstr(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function getStreak() {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY)) || { last: null, count: 0, best: 0 }; }
  catch (e) { return { last: null, count: 0, best: 0 }; }
}
function updateStreak() {
  const s = getStreak();
  const today = dstr(new Date());
  if (s.last !== today) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    s.count = (s.last === dstr(y)) ? (s.count || 0) + 1 : 1;
    s.last = today;
  }
  s.best = Math.max(s.best || 0, s.count);
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}

/* ---------- Favoris / marque-pages ---------- */
const FAV_KEY = "cmd-favorites";
function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
  catch (e) { return []; }
}
function removeFavorite(url) {
  const favs = getFavorites().filter((f) => f.url !== url);
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

/* ---------- Export / Import de la progression ---------- */
function exportProgress() {
  const store = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    store[k] = localStorage.getItem(k);
  }
  const data = { _app: "esgi-portal", _v: 1, _date: new Date().toISOString(), store };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "progression-esgi-" + dstr(new Date()) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = JSON.parse(reader.result); } catch (e) { data = null; }
    if (!data || data._app !== "esgi-portal" || !data.store) {
      alert("Fichier invalide. Choisis un export « progression-esgi-….json » de ce site.");
      return;
    }
    if (!confirm("Importer cette progression ? Elle remplacera la progression actuelle de cet appareil.")) return;
    Object.keys(data.store).forEach((k) => localStorage.setItem(k, data.store[k]));
    alert("Progression importée ✅");
    location.reload();
  };
  reader.readAsText(file);
}

/* ---------- Calendrier de révision (heatmap façon GitHub) ---------- */
/* ---------- Objectif hebdomadaire ---------- */
const GOAL_KEY = "esgi-weekly-goal";
function activeDaysThisWeek() {
  let days = {};
  try { days = JSON.parse(localStorage.getItem("esgi-active-days")) || {}; } catch (e) {}
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  const dow = (today.getDay() + 6) % 7; // lundi = 0
  monday.setDate(today.getDate() - dow);
  const key = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  let n = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(monday); d.setDate(monday.getDate() + i); if (days[key(d)]) n++; }
  return n;
}
function getGoal() { const g = parseInt(localStorage.getItem(GOAL_KEY), 10); return (g >= 1 && g <= 7) ? g : 4; }
function buildGoal() {
  const goal = getGoal();
  const done = Math.min(activeDaysThisWeek(), 7);
  const pct = Math.round(Math.min(done, goal) / goal * 100);
  const reached = done >= goal;
  const todayDone = (function () {
    try { const days = JSON.parse(localStorage.getItem("esgi-active-days")) || {}; const d = new Date(); const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); return !!days[k]; } catch (e) { return false; }
  })();
  let msg;
  if (reached) msg = "🎉 Objectif de la semaine atteint, bravo ! Chaque jour en plus est du bonus.";
  else if (todayDone) msg = `Encore <b>${goal - done}</b> jour(s) de révision cette semaine pour tenir ton objectif. 💪`;
  else msg = `⏰ Tu n'as pas encore révisé aujourd'hui — un petit module suffit pour avancer vers ton objectif.`;
  const opts = [2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}"${n === goal ? " selected" : ""}>${n} j/sem.</option>`).join("");
  return `
    <div class="goal-card${reached ? " reached" : ""}">
      <div class="goal-head">
        <b>🎯 Objectif de la semaine</b>
        <label class="goal-set">Cible : <select id="goal-select">${opts}</select></label>
      </div>
      <div class="goal-bar">${progressBar(pct, reached ? "var(--accent)" : "var(--primary)")}</div>
      <div class="goal-info"><span class="goal-num">${done} / ${goal} jours actifs</span><span class="goal-msg">${msg}</span></div>
    </div>`;
}

function buildHeatmap() {
  let days = {};
  try { days = JSON.parse(localStorage.getItem("esgi-active-days")) || {}; } catch (e) {}
  const WEEKS = 18;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // aller au dimanche de fin de semaine courante
  const end = new Date(today); end.setDate(end.getDate() + (6 - end.getDay()));
  const total = WEEKS * 7;
  const cells = [];
  let activeCount = 0;
  const key = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const months = [];
  for (let i = total - 1; i >= 0; i--) {
    const d = new Date(end); d.setDate(end.getDate() - i);
    const c = days[key(d)] || 0;
    if (c > 0 && d <= today) activeCount++;
    let lvl = 0;
    if (c >= 1) lvl = 1; if (c >= 3) lvl = 2; if (c >= 6) lvl = 3; if (c >= 10) lvl = 4;
    const future = d > today;
    cells.push({ lvl, future, label: key(d) + (c ? ` · ${c} visite(s)` : "") });
  }
  // colonnes (semaines) : 7 cellules chacune, l'ordre cells est chronologique
  let cols = "";
  for (let w = 0; w < WEEKS; w++) {
    let col = "";
    for (let dow = 0; dow < 7; dow++) {
      const cell = cells[w * 7 + dow];
      col += `<span class="hm-cell l${cell.lvl}${cell.future ? " fut" : ""}" title="${cell.label}"></span>`;
    }
    cols += `<div class="hm-col">${col}</div>`;
  }
  return `
    <div class="heatmap-card">
      <div class="hm-head"><b>📅 Calendrier de révision</b><span class="hm-sub">${activeCount} jour${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""} sur ~${WEEKS} semaines</span></div>
      <div class="hm-grid">${cols}</div>
      <div class="hm-legend">Moins <span class="hm-cell l0"></span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span><span class="hm-cell l4"></span> Plus</div>
    </div>`;
}

function renderDashboard() {
  const host = document.getElementById("dashboard");
  if (!host) return;
  const tracked = SUBJECTS.filter((s) => s.progress).map((s) => ({ s, pr: readProgress(s) }));
  const gpct = tracked.length
    ? Math.round(tracked.reduce((a, { pr }) => a + pr.pct, 0) / tracked.length)
    : 0;
  const started = tracked.some(({ pr }) => pr.done > 0);
  const st = getStreak();

  let resume = "";
  try {
    const last = JSON.parse(localStorage.getItem("cmd-last-module"));
    if (last && last.url && last.title) {
      resume = `<a class="resume" href="${last.url}">
        <span class="resume-ic">▶️</span>
        <span class="resume-txt"><b>Reprendre où j'en étais</b><span>${last.title}</span></span>
        <span class="resume-go">Continuer →</span></a>`;
    }
  } catch (e) {}

  const ring = `
    <div class="ring" style="--p:${gpct}">
      <div class="ring-in"><div class="ring-pct">${gpct}<small>%</small></div><div class="ring-lbl">global</div></div>
    </div>`;

  const streakChip = st.count > 0
    ? `<div class="streak" title="Jours de révision consécutifs">🔥 ${st.count} j${st.best > st.count ? ` · record ${st.best}` : ""}</div>`
    : "";

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

  const favs = getFavorites();
  const favBlock = favs.length ? `
    <div class="favs">
      <h3>⭐ Mes favoris</h3>
      <div class="fav-list">
        ${favs.map((f) => `<div class="fav-item">
          <a href="${f.url}">${f.title}</a>
          <button class="fav-del" data-url="${f.url}" title="Retirer des favoris" aria-label="Retirer">✕</button>
        </div>`).join("")}
      </div>
    </div>` : "";

  host.innerHTML = `
    ${resume}
    <div class="dash">
      <div class="dash-ring">${ring}${streakChip}
        <div class="dash-actions">
          <button class="btn" id="dash-export" title="Télécharger ma progression (fichier .json)">⬇️ Exporter</button>
          <button class="btn" id="dash-import" title="Charger une progression depuis un fichier .json">⬆️ Importer</button>
          <button class="btn dash-reset" id="dash-reset" title="Effacer ma progression locale">↺ Réinitialiser</button>
        </div>
        <input type="file" id="dash-file" accept="application/json,.json" hidden />
      </div>
      <div class="dash-list">
        ${rows}
        <p class="dash-hint">${hint}</p>
      </div>
    </div>
    ${buildGoal()}
    ${buildHeatmap()}
    ${favBlock}`;

  const rst = document.getElementById("dash-reset");
  if (rst) rst.addEventListener("click", () => {
    if (!confirm("Effacer toute ta progression enregistrée sur cet appareil ?")) return;
    tracked.forEach(({ s }) => localStorage.removeItem(s.progress.key));
    localStorage.removeItem("cmd-last-module");
    renderDashboard();
    renderSubjects();
  });
  const exp = document.getElementById("dash-export");
  if (exp) exp.addEventListener("click", exportProgress);
  const goalSel = document.getElementById("goal-select");
  if (goalSel) goalSel.addEventListener("change", () => {
    localStorage.setItem(GOAL_KEY, goalSel.value);
    renderDashboard();
  });
  const imp = document.getElementById("dash-import");
  const file = document.getElementById("dash-file");
  if (imp && file) {
    imp.addEventListener("click", () => file.click());
    file.addEventListener("change", () => { if (file.files[0]) importProgress(file.files[0]); });
  }
  host.querySelectorAll(".fav-del").forEach((b) => b.addEventListener("click", () => {
    removeFavorite(b.getAttribute("data-url"));
    renderDashboard();
  }));
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
    "matière": "Matière", page: "Page", culture: "Culture & histoire" };
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
    const el = document.activeElement || {};
    const typing = /^(input|textarea|select)$/i.test(el.tagName || "") || el.isContentEditable;
    // Ctrl/⌘ + K : ouvrir la recherche depuis n'importe où
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === "k" || ev.key === "K")) {
      ev.preventDefault();
      input.focus(); input.select();
      return;
    }
    // "/" : ouvrir la recherche (hors champ de saisie)
    if (ev.key === "/" && !typing) {
      ev.preventDefault(); input.focus();
    }
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".search-wrap")) panel.hidden = true;
  });
}

/* ---------- Favicon emoji (évite le 404, petite touche) ---------- */
function setFavicon(emoji) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="52" font-size="52">${emoji}</text></svg>`;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  link.href = "data:image/svg+xml," + encodeURIComponent(svg);
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
  let saved = localStorage.getItem(THEME_KEY);
  if (!saved) {
    saved = (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches)
      ? "light" : "dark";
  }
  applyTheme(saved);
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
    const mainTag = clickable && s.href ? "a" : "div";
    const hrefAttr = clickable && s.href ? ` href="${s.href}"` : "";
    const statusTxt = { ready: "● Disponible", soon: "○ Bientôt", wip: "◐ En cours" }[s.status] || "";
    const extras = (s.extra || []).map((e) =>
      `<a class="tag extra" href="${e.href}" style="border-color:${s.color};color:${s.color}">${e.label}</a>`
    ).join("");
    const extrasRow = extras ? `<div class="subject-extras">${extras}</div>` : "";
    const pr = readProgress(s);
    const prBlock = pr && pr.done > 0
      ? `<div class="card-progress">${progressBar(pr.pct, s.color)}<span class="cp-lbl">${pr.pct}% · ${pr.done}/${pr.total} ${pr.unit}</span></div>`
      : "";
    return `
      <div class="subject${s.status === "soon" && !s.href ? " locked" : ""}" style="--sc:${s.color}">
        ${s.featured ? '<div class="ribbon">PRÊT</div>' : ""}
        <${mainTag} class="subject-main"${hrefAttr}>
          <div class="banner">
            <div class="emoji">${s.emoji}</div>
            <div class="bt"><div class="code">${s.code}</div><div class="name">${s.name}</div></div>
          </div>
          <div class="body">
            <p>${s.desc}</p>
            <div class="tags">${s.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
            ${prBlock}
            <div class="foot">
              <span class="status ${s.status}">${statusTxt} · ${s.meta}</span>
              ${clickable && s.href ? `<span class="go">Ouvrir →</span>` : ""}
            </div>
          </div>
        </${mainTag}>
        ${extrasRow}
      </div>`;
  }).join("");

  // Stats dynamiques
  const ready = SUBJECTS.filter((s) => s.status === "ready").length;
  const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setT("stat-subjects", SUBJECTS.length);
  setT("stat-ready", ready);
}

document.addEventListener("DOMContentLoaded", () => {
  setFavicon("🎓");
  initTheme();
  updateStreak();
  renderDashboard();
  renderSubjects();
  initSearch();
});
