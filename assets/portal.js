/* =========================================================
   portal.js — Hub de cours ESGI (data-driven)
   Pour AJOUTER une matière : ajoute une entrée dans SUBJECTS.
   ========================================================= */

const SUBJECTS = [
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
    status: "ready",
    featured: true,
    href: "matieres/sql/index.html",
    desc: "SQL de A à Z : SELECT, filtres & NULL, agrégation (GROUP BY/HAVING), jointures, sous-requêtes, fonctions de fenêtrage, DML, transactions & index. Parcours interactif avec quiz adaptatifs, checkpoints & examen final.",
    tags: ["SQL", "Jointures", "Window functions"],
    meta: "8 modules · 2 checkpoints · 66 quiz · examen final"
  },
  {
    code: "PHARMA",
    name: "Préparateur en pharmacie",
    emoji: "💊",
    color: "#2fb37a",
    status: "ready",
    featured: true,
    href: "matieres/pharmacie/index.html",
    desc: "DEUST Préparateur / Technicien en pharmacie, réparti sur 2 ans : chimie, anatomie, physiologie, galénique, législation, pharmacologie, pathologie, toxicologie, diagnostic. Cours interactifs avec quiz et exercices corrigés.",
    tags: ["Galénique", "Pharmacologie", "Législation"],
    meta: "2 années · 9 modules · 40+ quiz",
    progress: { key: "pharma-done-modules", type: "doneMap", total: 9, unit: "modules" }
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
    "matière": "Matière", page: "Page", culture: "Culture & histoire", "antisèche": "Antisèche" };
  let active = -1, current = [], allResults = [], typeFilter = "";

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
    allResults = search(q);
    active = -1;
    if (!q.trim()) { panel.hidden = true; panel.innerHTML = ""; return; }
    if (!allResults.length) {
      panel.hidden = false;
      panel.innerHTML = `<div class="sr-empty">Aucun résultat pour « ${q} »</div>`;
      return;
    }
    // Comptage par type pour les filtres
    const counts = {};
    allResults.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
    if (typeFilter && !counts[typeFilter]) typeFilter = ""; // filtre devenu vide
    current = typeFilter ? allResults.filter((e) => e.type === typeFilter) : allResults;

    const chips = ['<button class="sr-chip' + (typeFilter ? "" : " on") + '" data-type="">Tout (' + allResults.length + ")</button>"]
      .concat(Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map((t) =>
        '<button class="sr-chip' + (typeFilter === t ? " on" : "") + '" data-type="' + t + '">' +
        (typeLabel[t] || t) + " (" + counts[t] + ")</button>"
      )).join("");

    panel.hidden = false;
    panel.innerHTML = `<div class="sr-filters">${chips}</div>` +
      current.map((e, i) => `
      <a class="sr-item" href="${e.u}" data-i="${i}">
        <span class="sr-emoji" style="background:color-mix(in srgb, ${e.color} 22%, transparent)">${e.emoji}</span>
        <span class="sr-txt"><span class="sr-t">${e.t}</span>
          <span class="sr-meta">${e.s} · ${typeLabel[e.type] || e.type}</span></span>
        <span class="sr-go">↵</span>
      </a>`).join("") +
      `<div class="sr-foot">${current.length} résultat${current.length > 1 ? "s" : ""}${typeFilter ? " · filtre : " + (typeLabel[typeFilter] || typeFilter) : ""} · ↑↓ naviguer · Échap fermer</div>`;

    panel.querySelectorAll(".sr-chip").forEach((ch) => ch.addEventListener("click", (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      typeFilter = ch.getAttribute("data-type") || "";
      renderFiltered();
      input.focus();
    }));
  }

  // Re-render en ne changeant que le filtre (sans relancer la recherche)
  function renderFiltered() {
    active = -1;
    current = typeFilter ? allResults.filter((e) => e.type === typeFilter) : allResults;
    const counts = {};
    allResults.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
    const chips = ['<button class="sr-chip' + (typeFilter ? "" : " on") + '" data-type="">Tout (' + allResults.length + ")</button>"]
      .concat(Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map((t) =>
        '<button class="sr-chip' + (typeFilter === t ? " on" : "") + '" data-type="' + t + '">' +
        (typeLabel[t] || t) + " (" + counts[t] + ")</button>"
      )).join("");
    panel.innerHTML = `<div class="sr-filters">${chips}</div>` +
      current.map((e, i) => `
      <a class="sr-item" href="${e.u}" data-i="${i}">
        <span class="sr-emoji" style="background:color-mix(in srgb, ${e.color} 22%, transparent)">${e.emoji}</span>
        <span class="sr-txt"><span class="sr-t">${e.t}</span>
          <span class="sr-meta">${e.s} · ${typeLabel[e.type] || e.type}</span></span>
        <span class="sr-go">↵</span>
      </a>`).join("") +
      `<div class="sr-foot">${current.length} résultat${current.length > 1 ? "s" : ""}${typeFilter ? " · filtre : " + (typeLabel[typeFilter] || typeFilter) : ""} · ↑↓ naviguer · Échap fermer</div>`;
    panel.querySelectorAll(".sr-chip").forEach((ch) => ch.addEventListener("click", (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      typeFilter = ch.getAttribute("data-type") || "";
      renderFiltered();
      input.focus();
    }));
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

/* ---------- Cours Markdown (manifeste matieres/cours.js) ---------- */
/* Fusionne les matières déclarées dans window.COURS : cartes du portail
   + entrées de recherche, sans rien coder à la main. */

/* Dossier d'une matière du manifeste, déduit du chemin de ses modules
   ("matieres/<x>/md/*.md" -> "matieres/<x>"). */
function manifestFolder(c) {
  const mods = (c && c.modules) || [];
  for (let i = 0; i < mods.length; i++) {
    const f = mods[i] && mods[i].file;
    if (typeof f === "string") {
      const m = f.match(/^\.?\/?(.*?)\/md\//);
      if (m) return m[1];
    }
  }
  return null;
}

/* Renvoie l'URL d'une page codée sur-mesure existante pour cette matière,
   sinon null. Priorité au cours codé : on ne (re)construit pas depuis le Markdown.
   Détection : champ `page` explicite, OU même code, OU même dossier qu'une
   matière codée COMPLÈTE (avec `href`) déclarée dans SUBJECTS.
   (Un simple placeholder « à venir » sans `href` ne compte pas.) */
function codedPageFor(c) {
  if (c.page) return c.page;
  const folder = manifestFolder(c);
  const hit = SUBJECTS.find((s) =>
    !s.fromManifest && s.href && (
      (s.code || "").toLowerCase() === (c.code || "").toLowerCase() ||
      (folder && s.href.replace(/\/index\.html$/, "") === folder)
    )
  );
  return hit ? hit.href : null;
}

/* Lien « Antisèche » auto si le sujet déclare un fichier `aide:` (Markdown). */
function aideExtra(c) {
  return c && c.aide ? { label: "⚡ Antisèche", href: "aide.html?c=" + encodeURIComponent(c.code) } : null;
}
function withAide(extra, c) {
  const list = Array.isArray(extra) ? extra.slice() : [];
  const a = aideExtra(c);
  if (a && !list.some((e) => /antis[eè]che/i.test(e.label || ""))) list.push(a);
  return list.length ? list : undefined;
}
function pushAideSearch(c) {
  if (!c.aide || !Array.isArray(window.SEARCH_INDEX)) return;
  window.SEARCH_INDEX.push({
    s: c.name, emoji: c.emoji || "📘", color: c.color || "#6c8cff",
    type: "antisèche", t: "Antisèche " + c.name,
    u: "aide.html?c=" + encodeURIComponent(c.code),
    k: "aide-mémoire révision " + (c.desc || "") + " " + (c.tags || []).join(" ")
  });
}

/* Carte pointant vers une page codée (seulement si elle n'est pas déjà sur le portail). */
function addCodedCard(c, href) {
  const url = typeof href === "string" ? href : null;
  const already = SUBJECTS.some((s) => !s.fromManifest &&
    ((s.code || "").toLowerCase() === (c.code || "").toLowerCase() || (url && s.href === url)));
  if (already || !url) return;
  SUBJECTS.push({
    code: c.code, name: c.name, emoji: c.emoji || "📘", color: c.color || "#6c8cff",
    status: "ready", featured: !!c.featured, href: url, extra: withAide(c.extra, c),
    desc: c.desc || "", tags: c.tags || [], meta: "Cours complet", fromManifest: true
  });
  pushAideSearch(c);
  if (Array.isArray(window.SEARCH_INDEX)) {
    window.SEARCH_INDEX.push({
      s: c.name, emoji: c.emoji || "📘", color: c.color || "#6c8cff",
      type: "matière", t: c.name, u: url, k: (c.desc || "") + " " + (c.tags || []).join(" ")
    });
  }
}

function mergeManifestCourses() {
  if (!window.COURS || !Array.isArray(window.COURS.subjects)) return;
  window.COURS.subjects.forEach((c) => {
    if (!c || !c.code) return;
    // Un cours codé sur-mesure existe déjà ? On l'utilise et on saute le Markdown.
    const coded = codedPageFor(c);
    if (coded) { addCodedCard(c, coded); return; }
    // Sinon, un éventuel placeholder « à venir » (même code, sans page) est
    // remplacé par le vrai cours Markdown.
    for (let i = SUBJECTS.length - 1; i >= 0; i--) {
      const s = SUBJECTS[i];
      if (!s.fromManifest && !s.href && (s.code || "").toLowerCase() === c.code.toLowerCase()) {
        SUBJECTS.splice(i, 1);
      }
    }
    const mods = Array.isArray(c.modules) ? c.modules : [];
    const base = "cours.html?c=" + encodeURIComponent(c.code);
    SUBJECTS.push({
      code: c.code,
      name: c.name,
      emoji: c.emoji || "📘",
      color: c.color || "#6c8cff",
      status: mods.length ? "ready" : "soon",
      featured: !!c.featured,
      href: mods.length ? base : undefined,
      extra: withAide(c.extra, c),
      desc: c.desc || "",
      tags: c.tags || [],
      meta: mods.length ? (mods.length + " module" + (mods.length > 1 ? "s" : "")) : "À venir",
      fromManifest: true,
      progress: mods.length
        ? { key: "cours-" + c.code.toLowerCase() + "-done", type: "doneMap", total: mods.length, unit: "modules" }
        : undefined
    });
    // entrées de recherche : la matière + chaque module
    if (Array.isArray(window.SEARCH_INDEX)) {
      const kw = (c.tags || []).join(" ");
      window.SEARCH_INDEX.push({
        s: c.name, emoji: c.emoji || "📘", color: c.color || "#6c8cff",
        type: "matière", t: c.name, u: base, k: (c.desc || "") + " " + kw
      });
      mods.forEach((m) => {
        window.SEARCH_INDEX.push({
          s: c.name, emoji: c.emoji || "📘", color: c.color || "#6c8cff",
          type: "module", t: m.title, u: base + "&m=" + encodeURIComponent(m.id),
          k: (m.desc || "") + " " + c.name + " " + kw
        });
      });
    }
    pushAideSearch(c);
  });
  // regroupe les matières « prêtes » en tête (tri stable)
  const rank = (s) => (s.status === "ready" ? 0 : s.status === "wip" ? 1 : 2);
  SUBJECTS.sort((a, b) => rank(a) - rank(b));
}

/* ---------- Examens & comptes à rebours (J-X) ---------- */
const EXAMS_KEY = "esgi-exams";
function escapeHtml(s) {
  return (s || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function getExams() {
  try { const v = JSON.parse(localStorage.getItem(EXAMS_KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
function setExams(list) { try { localStorage.setItem(EXAMS_KEY, JSON.stringify(list)); } catch (e) {} }
function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d - today) / 86400000);
}
function renderExams() {
  const host = document.getElementById("exams");
  if (!host) return;
  const list = getExams().slice().sort((a, b) => a.date.localeCompare(b.date));
  const fmt = (s) => { try { return new Date(s + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); } catch (e) { return s; } };
  const rows = list.map((ex) => {
    const n = daysUntil(ex.date);
    let badge, cls;
    if (n < 0) { badge = "passé"; cls = "past"; }
    else if (n === 0) { badge = "aujourd'hui"; cls = "today"; }
    else if (n === 1) { badge = "J‑1"; cls = "soon"; }
    else { badge = "J‑" + n; cls = n <= 7 ? "soon" : "far"; }
    return `<div class="exam-row ${cls}">
      <span class="exam-cd">${badge}</span>
      <span class="exam-main"><b>${escapeHtml(ex.name)}</b><span class="exam-date">${fmt(ex.date)}</span></span>
      <button class="exam-del" data-id="${ex.id}" title="Supprimer" aria-label="Supprimer">✕</button>
    </div>`;
  }).join("");
  const today = new Date().toISOString().slice(0, 10);
  host.innerHTML = `
    <div class="exams-box">
      ${list.length ? `<div class="exam-list">${rows}</div>` : `<p class="exam-empty">Aucun examen pour l'instant. Ajoute ta première date de partiel 👇</p>`}
      <form class="exam-form" id="exam-form">
        <input type="text" id="exam-name" placeholder="Intitulé (ex. Partiel Rust)" maxlength="80" required />
        <input type="date" id="exam-date" min="${today}" required />
        <button type="submit" class="btn primary">+ Ajouter</button>
      </form>
    </div>`;
  const form = document.getElementById("exam-form");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (document.getElementById("exam-name").value || "").trim();
    const date = document.getElementById("exam-date").value;
    if (!name || !date) return;
    const l = getExams();
    l.push({ id: "e" + Date.now().toString(36), name, date });
    setExams(l);
    renderExams();
  });
  host.querySelectorAll(".exam-del").forEach((b) => b.addEventListener("click", () => {
    setExams(getExams().filter((x) => x.id !== b.getAttribute("data-id")));
    renderExams();
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  mergeManifestCourses();
  setFavicon("🎓");
  initTheme();
  updateStreak();
  renderDashboard();
  renderExams();
  renderSubjects();
  initSearch();
});
