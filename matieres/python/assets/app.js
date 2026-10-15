/* =========================================================
   app.js — Python & Data Science (interactivité)
   Mêmes fonctions que le cours de maths, clés de progression propres.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Thème ---------- */
  const THEME_KEY = "cmd-theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_KEY, t);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = t === "light" ? "🌙 Sombre" : "☀️ Clair";
  }
  function initTheme() {
    let saved = localStorage.getItem(THEME_KEY);
    if (!saved) saved = (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
    applyTheme(saved);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "light" ? "dark" : "light");
    });
  }

  /* ---------- Favicon ---------- */
  function setFavicon(emoji) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="52" font-size="52">' + emoji + '</text></svg>';
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = "data:image/svg+xml," + encodeURIComponent(svg);
  }

  /* ---------- Streak partagé ---------- */
  function dstr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function updateStreak() {
    const K = "esgi-streak";
    let s; try { s = JSON.parse(localStorage.getItem(K)); } catch (e) { s = null; }
    if (!s || typeof s !== "object") s = { last: null, count: 0, best: 0 };
    const today = dstr(new Date());
    if (s.last !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      s.count = (s.last === dstr(y)) ? (s.count || 0) + 1 : 1;
      s.last = today;
    }
    s.best = Math.max(s.best || 0, s.count);
    try { localStorage.setItem(K, JSON.stringify(s)); } catch (e) {}
  }

  /* ---------- Progression des modules ---------- */
  const DONE_KEY = "pds-done-modules";
  function getDone() { try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; } catch (e) { return {}; } }
  function setDone(id, val) { const d = getDone(); if (val) d[id] = true; else delete d[id]; localStorage.setItem(DONE_KEY, JSON.stringify(d)); }

  function markModuleDoneButton() {
    const btn = document.getElementById("mark-done");
    if (!btn) return;
    const id = btn.getAttribute("data-module");
    const done = getDone();
    const refresh = () => { btn.textContent = done[id] ? "✓ Module terminé" : "Marquer comme terminé"; btn.classList.toggle("primary", !!done[id]); };
    refresh();
    btn.addEventListener("click", () => { const d = getDone(); setDone(id, !d[id]); location.reload(); });
  }

  function paintHomeProgress() {
    const done = getDone();
    document.querySelectorAll("[data-module-card]").forEach((card) => {
      const id = card.getAttribute("data-module-card");
      if (done[id]) {
        const badge = document.createElement("span");
        badge.className = "progress-badge";
        badge.textContent = "✓ Terminé";
        card.appendChild(badge);
      }
    });
  }

  /* ---------- Barre de lecture ---------- */
  function initReadingProgress() {
    const bar = document.querySelector(".lesson-progress .bar");
    if (!bar) return;
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      bar.style.width = Math.min(100, Math.max(0, scrolled * 100)) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Temps de lecture ---------- */
  function initReadingTime() {
    const lesson = document.querySelector(".lesson");
    const h1 = lesson && lesson.querySelector("h1");
    if (!lesson || !h1) return;
    const words = (lesson.innerText || "").trim().split(/\s+/).length;
    const min = Math.max(1, Math.round(words / 200));
    const badge = document.createElement("div");
    badge.className = "readtime";
    badge.textContent = "⏱️ ~" + min + " min de lecture";
    const subtitle = lesson.querySelector(".subtitle");
    (subtitle || h1).insertAdjacentElement("afterend", badge);
  }

  /* ---------- Quiz ---------- */
  function initQuizzes() {
    document.querySelectorAll(".quiz").forEach((quiz) => {
      let fb = quiz.querySelector(".feedback");
      if (!fb) { fb = document.createElement("div"); fb.className = "feedback"; quiz.appendChild(fb); }
      const explain = fb.getAttribute("data-explain") || "";
      Array.from(quiz.querySelectorAll(".opt")).forEach((opt) => {
        opt.addEventListener("click", () => {
          if (quiz.classList.contains("answered")) return;
          quiz.classList.add("answered");
          const answer = parseInt(quiz.getAttribute("data-answer"), 10);
          const opts = Array.from(quiz.querySelectorAll(".opt"));
          const i = opts.indexOf(opt);
          opts.forEach((o) => o.classList.add("disabled"));
          opts[answer] && opts[answer].classList.add("correct");
          const ok = i === answer;
          if (!ok) opt.classList.add("wrong");
          fb.classList.add("show", ok ? "ok" : "ko");
          fb.innerHTML = (ok ? "✅ <strong>Bravo !</strong> " : "❌ <strong>Pas tout à fait.</strong> ") + explain;
        });
      });
    });
  }

  /* ---------- Mélanger les réponses ---------- */
  function shuffleQuiz(quiz) {
    const opts = Array.from(quiz.querySelectorAll(".opt"));
    if (opts.length < 2) return;
    const answer = parseInt(quiz.getAttribute("data-answer"), 10);
    const correct = opts[answer];
    const parent = opts[0].parentNode;
    const fb = quiz.querySelector(".feedback");
    quiz.classList.remove("answered");
    opts.forEach((o) => o.classList.remove("disabled", "correct", "wrong"));
    if (fb) fb.classList.remove("show", "ok", "ko");
    const arr = opts.slice();
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    arr.forEach((o) => parent.appendChild(o));
    quiz.setAttribute("data-answer", arr.indexOf(correct));
  }
  function initQuizShuffle() {
    const quizzes = document.querySelectorAll(".quiz");
    if (!quizzes.length) return;
    const lesson = document.querySelector(".lesson");
    const h1 = lesson && lesson.querySelector("h1");
    if (!h1) return;
    const bar = document.createElement("div");
    bar.className = "quiz-tools no-print";
    bar.innerHTML = '<button class="btn" id="shuffle-quiz" type="button">🔀 Mélanger les réponses</button>';
    const anchor = lesson.querySelector(".readtime") || h1;
    anchor.insertAdjacentElement("afterend", bar);
    document.getElementById("shuffle-quiz").addEventListener("click", () => {
      document.querySelectorAll(".quiz").forEach(shuffleQuiz);
      const b = document.getElementById("shuffle-quiz");
      b.textContent = "🔀 Remélangé !";
      setTimeout(() => { b.textContent = "🔀 Mélanger les réponses"; }, 1200);
    });
  }

  /* ---------- Export PDF ---------- */
  function initPrintButton() {
    const ref = document.getElementById("mark-done");
    if (!ref || !ref.parentNode) return;
    const btn = document.createElement("button");
    btn.className = "btn no-print"; btn.type = "button";
    btn.textContent = "🖨️ Exporter en PDF";
    btn.title = "Ouvre l'impression — choisis « Enregistrer au format PDF »";
    btn.addEventListener("click", () => window.print());
    ref.insertAdjacentElement("afterend", btn);
  }

  /* ---------- Dernier module (Reprendre) ---------- */
  function recordLastModule() {
    const marker = document.getElementById("mark-done");
    if (!marker) return;
    const file = location.pathname.split("/").pop();
    if (!file) return;
    const h1 = document.querySelector(".lesson h1");
    const title = (h1 ? h1.textContent : document.title).replace(/\s*⭐\s*$/, "").trim();
    try { localStorage.setItem("cmd-last-module", JSON.stringify({ url: "matieres/python/modules/" + file, title: title })); } catch (e) {}
  }

  /* ---------- Favori ---------- */
  function initFavoriteButton() {
    const ref = document.getElementById("mark-done");
    if (!ref || !ref.parentNode) return;
    const file = location.pathname.split("/").pop();
    const url = "matieres/python/modules/" + file;
    const h1 = document.querySelector(".lesson h1");
    const title = (h1 ? h1.textContent : document.title).replace(/\s*⭐\s*$/, "").trim();
    const KEY = "cmd-favorites";
    const get = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
    const isFav = () => get().some((f) => f.url === url);
    const btn = document.createElement("button");
    btn.className = "btn no-print"; btn.type = "button";
    const paint = () => { btn.textContent = isFav() ? "★ En favori" : "☆ Ajouter aux favoris"; btn.classList.toggle("primary", isFav()); };
    btn.addEventListener("click", () => {
      let favs = get();
      if (isFav()) favs = favs.filter((f) => f.url !== url); else favs.push({ url: url, title: title });
      localStorage.setItem(KEY, JSON.stringify(favs)); paint();
    });
    paint();
    ref.insertAdjacentElement("afterend", btn);
  }

  /* ---------- Retour en haut ---------- */
  function initBackToTop() {
    const btn = document.createElement("button");
    btn.className = "to-top no-print"; btn.type = "button";
    btn.setAttribute("aria-label", "Revenir en haut"); btn.innerHTML = "↑";
    document.body.appendChild(btn);
    const toggle = () => btn.classList.toggle("show", window.scrollY > 600);
    window.addEventListener("scroll", toggle, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    toggle();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setFavicon("🐍");
    initTheme();
    updateStreak();
    initQuizzes();
    initQuizShuffle();
    initReadingProgress();
    initReadingTime();
    markModuleDoneButton();
    paintHomeProgress();
    initPrintButton();
    initFavoriteButton();
    recordLastModule();
    initBackToTop();
  });
})();
