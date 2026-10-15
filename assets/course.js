/* =========================================================
   course.js — Moteur de rendu des cours Markdown
   Lit le manifeste window.COURS + le fichier .md du module,
   fabrique la page (sommaire, quiz, progression, MathJax).
   URL : cours.html?c=<codeMatière>[&m=<idModule>]
   ========================================================= */
(function () {
  "use strict";

  var THEME_KEY = "esgi-portal-theme";
  var LAST_KEY = "cmd-last-module";

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  /* ---------- Thème ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    var b = document.getElementById("theme-toggle");
    if (b) b.textContent = t === "light" ? "🌙 Sombre" : "☀️ Clair";
  }
  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY) ||
      ((window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark");
    applyTheme(saved);
  }

  /* ---------- Progression (doneMap par matière) ---------- */
  function doneKey(code) { return "cours-" + code.toLowerCase() + "-done"; }
  function getDone(code) {
    try { return JSON.parse(localStorage.getItem(doneKey(code))) || {}; } catch (e) { return {}; }
  }
  function setDone(code, id, val) {
    var d = getDone(code);
    if (val) d[id] = true; else delete d[id];
    try { localStorage.setItem(doneKey(code), JSON.stringify(d)); } catch (e) {}
  }

  function findSubject(code) {
    if (!window.COURS || !Array.isArray(window.COURS.subjects)) return null;
    code = (code || "").toLowerCase();
    return window.COURS.subjects.find(function (s) { return (s.code || "").toLowerCase() === code; }) || null;
  }

  function setBrand(subject) {
    var logo = document.querySelector(".course-topbar .logo");
    var name = document.querySelector(".course-topbar .txt");
    if (logo) logo.textContent = subject ? subject.emoji : "📚";
    if (name) name.textContent = subject ? subject.name : "Cours";
    if (subject && subject.color) document.documentElement.style.setProperty("--sc", subject.color);
    if (subject) { var f = document.querySelector('link[rel="icon"]'); if (f) setFavicon(subject.emoji); }
  }
  function setFavicon(emoji) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="52" font-size="52">' + emoji + "</text></svg>";
    var link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = "data:image/svg+xml," + encodeURIComponent(svg);
  }

  /* ---------- Rendu : index d'une matière ---------- */
  function renderIndex(subject, host) {
    document.title = subject.name + " — Cours";
    var done = getDone(subject.code);
    var cards = (subject.modules || []).map(function (m, i) {
      var flag = done[m.id] ? '<span class="done-flag">✓</span>' : "";
      return '<a class="mod-card" href="cours.html?c=' + encodeURIComponent(subject.code) + "&m=" + encodeURIComponent(m.id) + '">' +
        flag +
        '<span class="num">' + (m.badge || ("Module " + (i + 1))) + "</span>" +
        "<h3>" + esc(m.title) + "</h3>" +
        (m.desc ? "<p>" + esc(m.desc) + "</p>" : "") + "</a>";
    }).join("");
    var nDone = (subject.modules || []).filter(function (m) { return done[m.id]; }).length;
    var total = (subject.modules || []).length;
    host.className = "course-wrap index";
    host.innerHTML =
      '<div class="breadcrumb"><a href="index.html">Accueil</a> › ' + esc(subject.name) + "</div>" +
      "<h1>" + subject.emoji + " " + esc(subject.name) + "</h1>" +
      (subject.desc ? '<p class="lede">' + esc(subject.desc) + "</p>" : "") +
      '<div class="meta-row"><span class="chip">' + total + " module" + (total > 1 ? "s" : "") + "</span>" +
      '<span class="chip">' + nDone + " terminé" + (nDone > 1 ? "s" : "") + "</span>" +
      (subject.tags ? subject.tags.map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") : "") +
      "</div>" +
      '<div class="mod-grid">' + cards + "</div>";
    setBrand(subject);
  }

  /* ---------- Rendu : un module ---------- */
  function fetchText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    });
  }

  function renderModule(subject, module, host) {
    host.innerHTML = '<div class="course-loading">⏳ Chargement du cours…</div>';
    fetchText(module.file).then(function (src) {
      var parsed = window.MD.render(src);
      var meta = parsed.meta || {};
      var title = meta.title || module.title || "Module";
      document.title = title + " — " + subject.name;

      // sommaire auto (h2 + h3)
      var toc = "";
      if (parsed.headings.length > 1) {
        toc = '<div class="toc"><h4>Sommaire</h4><ol>' +
          parsed.headings.map(function (h) {
            return '<li class="lvl' + h.level + '"><a href="#' + h.id + '">' + esc(h.text) + "</a></li>";
          }).join("") + "</ol></div>";
      }

      // domaines & objectifs
      var domains = "";
      var dm = meta.domains;
      if (dm) {
        if (!Array.isArray(dm)) dm = String(dm).split(",").map(function (x) { return x.trim(); });
        var map = { data: "data", "big data": "bigdata", bigdata: "bigdata", ia: "ia", ai: "ia" };
        domains = '<div class="domains">' + dm.filter(Boolean).map(function (d) {
          var cls = map[d.toLowerCase()] || "data";
          return '<span class="domain ' + cls + '"><span class="dot"></span>' + esc(d.toUpperCase()) + "</span>";
        }).join("") + "</div>";
      }
      var chips = "";
      var info = [];
      if (meta.niveau) info.push(meta.niveau);
      if (meta.duree) info.push("⏱️ " + meta.duree);
      var tg = meta.tags; if (tg && !Array.isArray(tg)) tg = String(tg).split(",").map(function (x) { return x.trim(); });
      (tg || []).forEach(function (t) { info.push(t); });
      if (info.length) chips = '<div class="meta-row">' + info.filter(Boolean).map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") + "</div>";
      var objectifs = meta.objectifs ? '<div class="callout goal"><span class="label">🎯 Objectifs</span>' + window.MD.inline(meta.objectifs) + "</div>" : "";

      // navigation prev/next
      var mods = subject.modules || [];
      var idx = mods.findIndex(function (m) { return m.id === module.id; });
      var prev = idx > 0 ? mods[idx - 1] : null;
      var next = idx >= 0 && idx < mods.length - 1 ? mods[idx + 1] : null;
      var link = function (m) { return "cours.html?c=" + encodeURIComponent(subject.code) + "&m=" + encodeURIComponent(m.id); };
      var prevnext = '<div class="prevnext">' +
        (prev ? '<a class="prev" href="' + link(prev) + '"><span class="pn-lbl">← Précédent</span><span class="pn-ttl">' + esc(prev.title) + "</span></a>" : "") +
        (next ? '<a class="next" href="' + link(next) + '"><span class="pn-lbl">Suivant →</span><span class="pn-ttl">' + esc(next.title) + "</span></a>" : "") +
        "</div>";

      var isDone = !!getDone(subject.code)[module.id];
      var doneBtn = '<button class="done-btn' + (isDone ? " is-done" : "") + '" id="done-btn">' +
        (isDone ? "✓ Module terminé" : "Marquer ce module comme terminé") + "</button>";

      host.className = "course-wrap";
      host.innerHTML =
        '<div class="breadcrumb"><a href="index.html">Accueil</a> › ' +
        '<a href="cours.html?c=' + encodeURIComponent(subject.code) + '">' + esc(subject.name) + "</a> › " + esc(title) + "</div>" +
        "<h1>" + esc(title) + "</h1>" +
        (meta.subtitle ? '<p class="lede">' + window.MD.inline(meta.subtitle) + "</p>" : "") +
        domains + chips + objectifs + toc +
        '<div class="content">' + parsed.html + "</div>" +
        '<div class="lesson-end">' + doneBtn + "</div>" + prevnext;

      setBrand(subject);
      wireQuizzes(host);
      wireDone(subject, module, host);
      typeset(host);
      recordLast(subject, module, title);
    }).catch(function (err) {
      host.className = "course-wrap";
      host.innerHTML = '<div class="course-error"><h2>😕 Impossible de charger ce cours</h2>' +
        "<p>Fichier : <code>" + esc(module.file) + "</code><br>" + esc(String(err)) + "</p>" +
        "<p>Si tu ouvres le site par double-clic (<code>file://</code>), certains navigateurs bloquent la lecture des fichiers locaux. " +
        "Ouvre-le via <b>GitHub Pages</b>, ou lance un petit serveur local : <code>python -m http.server</code> puis va sur <code>http://localhost:8000</code>.</p>" +
        '<p><a class="btn" href="cours.html?c=' + encodeURIComponent(subject.code) + '">← Retour à la matière</a></p></div>';
    });
  }

  /* ---------- Quiz ---------- */
  function wireQuizzes(host) {
    host.querySelectorAll(".quiz").forEach(function (quiz) {
      var answer = parseInt(quiz.getAttribute("data-answer"), 10);
      var opts = Array.prototype.slice.call(quiz.querySelectorAll(".opt"));
      opts.forEach(function (opt, i) {
        opt.addEventListener("click", function () {
          if (quiz.classList.contains("answered")) return;
          quiz.classList.add("answered");
          opts.forEach(function (o, j) {
            if (j === answer) o.classList.add("correct");
            else if (j === i) o.classList.add("wrong");
          });
          var fb = quiz.querySelector(".feedback");
          if (fb) {
            var ex = fb.getAttribute("data-explain");
            fb.innerHTML = (i === answer ? "✅ Correct ! " : "❌ Pas tout à fait. ") + (ex || "");
            if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([fb]);
          }
        });
      });
    });
  }

  /* ---------- Bouton « terminé » ---------- */
  function wireDone(subject, module, host) {
    var btn = host.querySelector("#done-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var now = !btn.classList.contains("is-done");
      setDone(subject.code, module.id, now);
      btn.classList.toggle("is-done", now);
      btn.textContent = now ? "✓ Module terminé" : "Marquer ce module comme terminé";
    });
  }

  function recordLast(subject, module, title) {
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify({
        url: "cours.html?c=" + encodeURIComponent(subject.code) + "&m=" + encodeURIComponent(module.id),
        title: subject.emoji + " " + title
      }));
    } catch (e) {}
  }

  /* ---------- MathJax (chargé à la demande) ---------- */
  function typeset(host) {
    var hasMath = /\\\(|\\\[|math-block/.test(host.innerHTML);
    if (!hasMath) return;
    if (window.MathJax && window.MathJax.typesetPromise) { window.MathJax.typesetPromise([host]); return; }
    if (document.getElementById("mathjax-cdn")) return;
    window.MathJax = { tex: { inlineMath: [["\\(", "\\)"]], displayMath: [["\\[", "\\]"]] }, svg: { fontCache: "global" } };
    var s = document.createElement("script");
    s.id = "mathjax-cdn"; s.async = true;
    s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    document.head.appendChild(s);
  }

  /* ---------- Barre de lecture + retour haut ---------- */
  function initChrome() {
    var bar = document.querySelector(".read-progress > span");
    var top = document.querySelector(".to-top");
    window.addEventListener("scroll", function () {
      var h = document.documentElement;
      var sc = h.scrollTop, max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.width = (max > 0 ? (sc / max * 100) : 0) + "%";
      if (top) top.classList.toggle("show", sc > 400);
    }, { passive: true });
    if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    var tgl = document.getElementById("theme-toggle");
    if (tgl) tgl.addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initTheme();
    initChrome();
    var host = document.getElementById("course-root");
    if (!host) return;
    var code = qs("c"), mid = qs("m");
    var subject = findSubject(code);
    if (!subject) {
      host.className = "course-wrap";
      host.innerHTML = '<div class="course-error"><h2>Matière introuvable</h2>' +
        "<p>Le paramètre <code>?c=" + esc(code || "") + "</code> ne correspond à aucune matière du manifeste.</p>" +
        '<p><a class="btn" href="index.html">← Retour à l\'accueil</a></p></div>';
      return;
    }
    if (!mid) { renderIndex(subject, host); return; }
    var module = (subject.modules || []).find(function (m) { return m.id === mid; });
    if (!module) {
      host.className = "course-wrap";
      host.innerHTML = '<div class="course-error"><h2>Module introuvable</h2>' +
        '<p><a class="btn" href="cours.html?c=' + encodeURIComponent(subject.code) + '">← Retour à la matière</a></p></div>';
      return;
    }
    renderModule(subject, module, host);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
