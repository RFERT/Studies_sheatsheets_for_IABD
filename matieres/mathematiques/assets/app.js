/* =========================================================
   app.js — Interactivité du cours
   - Thème clair/sombre (persistant)
   - Quiz à choix multiples avec feedback immédiat
   - Barre de progression de lecture
   - Suivi des modules terminés (localStorage)
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
    const saved = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(saved);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme");
        applyTheme(cur === "light" ? "dark" : "light");
      });
    }
  }

  /* ---------- Progression des modules (home) ---------- */
  const DONE_KEY = "cmd-done-modules";
  function getDone() {
    try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function setDone(id, val) {
    const d = getDone();
    if (val) d[id] = true; else delete d[id];
    localStorage.setItem(DONE_KEY, JSON.stringify(d));
  }

  function markModuleDoneButton() {
    const btn = document.getElementById("mark-done");
    if (!btn) return;
    const id = btn.getAttribute("data-module");
    const done = getDone();
    const refresh = () => {
      btn.textContent = done[id] ? "✓ Module terminé" : "Marquer comme terminé";
      btn.classList.toggle("primary", !!done[id]);
    };
    refresh();
    btn.addEventListener("click", () => {
      const d = getDone();
      setDone(id, !d[id]);
      location.reload();
    });
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

  /* ---------- Barre de progression de lecture ---------- */
  function initReadingProgress() {
    const bar = document.querySelector(".lesson-progress .bar");
    if (!bar) return;
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
      bar.style.width = Math.min(100, Math.max(0, scrolled * 100)) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Moteur de quiz ---------- */
  // Markup attendu :
  // <div class="quiz" data-answer="2">
  //   <div class="qtext">...</div>
  //   <div class="options">
  //     <div class="opt">...</div> x N
  //   </div>
  //   <div class="feedback" data-explain="...">...</div>
  // </div>
  function initQuizzes() {
    document.querySelectorAll(".quiz").forEach((quiz) => {
      const answer = parseInt(quiz.getAttribute("data-answer"), 10);
      const opts = Array.from(quiz.querySelectorAll(".opt"));
      let fb = quiz.querySelector(".feedback");
      if (!fb) {
        fb = document.createElement("div");
        fb.className = "feedback";
        quiz.appendChild(fb);
      }
      const explain = fb.getAttribute("data-explain") || "";
      opts.forEach((opt, i) => {
        opt.addEventListener("click", () => {
          opts.forEach((o) => o.classList.add("disabled"));
          opts[answer] && opts[answer].classList.add("correct");
          const ok = i === answer;
          if (!ok) opt.classList.add("wrong");
          fb.classList.add("show", ok ? "ok" : "ko");
          fb.innerHTML = (ok ? "✅ <strong>Bravo !</strong> " : "❌ <strong>Pas tout à fait.</strong> ") + explain;
          if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([fb]);
          }
        });
      });
    });
  }

  /* ---------- Bouton Export PDF (impression navigateur) ---------- */
  function initPrintButton() {
    const ref = document.getElementById("mark-done");
    if (!ref || !ref.parentNode) return;
    const btn = document.createElement("button");
    btn.className = "btn no-print";
    btn.type = "button";
    btn.textContent = "🖨️ Exporter en PDF";
    btn.title = "Ouvre l'impression — choisis « Enregistrer au format PDF »";
    btn.addEventListener("click", () => window.print());
    ref.insertAdjacentElement("afterend", btn);
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initQuizzes();
    initReadingProgress();
    markModuleDoneButton();
    paintHomeProgress();
    initPrintButton();
  });
})();
