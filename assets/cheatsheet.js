/* =========================================================
   cheatsheet.js — Moteur des aides-mémoires (antisèches)
   Lit le manifeste window.COURS, trouve la matière (?c=CODE),
   charge le fichier Markdown déclaré dans `aide:` et le rend
   sous forme de fiche dense en colonnes (imprimable / PDF).
   Réutilise le parseur window.MD et le design de course.css.
   URL : aide.html?c=<codeMatière>
   ========================================================= */
(function () {
  "use strict";

  var THEME_KEY = "esgi-portal-theme";

  function qs(name) { return new URLSearchParams(location.search).get(name); }
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

  function findSubject(code) {
    if (!window.COURS || !Array.isArray(window.COURS.subjects)) return null;
    code = (code || "").toLowerCase();
    return window.COURS.subjects.find(function (s) { return (s.code || "").toLowerCase() === code; }) || null;
  }

  function setBrand(subject) {
    var logo = document.querySelector(".course-topbar .logo");
    var name = document.querySelector(".course-topbar .txt");
    if (logo) logo.textContent = subject ? subject.emoji : "⚡";
    if (name) name.textContent = subject ? ("Antisèche " + subject.name) : "Antisèche";
    if (subject && subject.color) document.documentElement.style.setProperty("--sc", subject.color);
    if (subject) setFavicon(subject.emoji);
  }
  function setFavicon(emoji) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="52" font-size="52">' + emoji + "</text></svg>";
    var link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function fetchText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    });
  }

  /* ---------- Rendu ---------- */
  function domainsHTML(meta) {
    var dm = meta.domains;
    if (!dm) return "";
    if (!Array.isArray(dm)) dm = String(dm).split(",").map(function (x) { return x.trim(); });
    var map = { data: "data", "big data": "bigdata", bigdata: "bigdata", ia: "ia", ai: "ia" };
    return '<div class="domains">' + dm.filter(Boolean).map(function (d) {
      var cls = map[d.toLowerCase()] || "data";
      return '<span class="domain ' + cls + '"><span class="dot"></span>' + esc(d.toUpperCase()) + "</span>";
    }).join("") + "</div>";
  }
  function chipsHTML(meta) {
    var info = [];
    if (meta.niveau) info.push(meta.niveau);
    if (meta.duree) info.push("⏱️ " + meta.duree);
    var tg = meta.tags; if (tg && !Array.isArray(tg)) tg = String(tg).split(",").map(function (x) { return x.trim(); });
    (tg || []).forEach(function (t) { info.push(t); });
    if (!info.length) return "";
    return '<div class="meta-row">' + info.filter(Boolean).map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") + "</div>";
  }

  /* Découpe le HTML rendu en cartes : chaque <h2> ouvre une nouvelle carte. */
  function buildGrid(html) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    var grid = document.createElement("div");
    grid.className = "cheat-grid";
    var lead = null, card = null, content = null;
    function newCard(h2) {
      card = document.createElement("section");
      card.className = "cheat-card";
      card.appendChild(h2);
      content = document.createElement("div");
      content.className = "content";
      card.appendChild(content);
      grid.appendChild(card);
    }
    Array.prototype.slice.call(tmp.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === "H2") {
        newCard(node);
      } else if (card) {
        content.appendChild(node);
      } else {
        // contenu avant le 1er ## : carte d'introduction pleine largeur
        if (!lead) {
          lead = document.createElement("section");
          lead.className = "cheat-card lead";
          var lc = document.createElement("div"); lc.className = "content";
          lead.appendChild(lc); grid.appendChild(lead);
        }
        lead.querySelector(".content").appendChild(node);
      }
    });
    return grid;
  }

  function render(subject, host) {
    host.innerHTML = '<div class="course-loading">⏳ Chargement de l’antisèche…</div>';
    fetchText(subject.aide).then(function (src) {
      var parsed = window.MD.render(src);
      var meta = parsed.meta || {};
      var title = meta.title || ("Antisèche " + subject.name);
      document.title = title + " — Antisèche";

      var actions =
        '<div class="cheat-actions">' +
        '<button class="btn primary" id="act-print">🖨️ Imprimer / PDF</button>' +
        '<button class="btn" id="act-tts">🔊 Écouter</button>' +
        '<button class="btn" id="act-copy">📋 Copier</button>' +
        '<button class="btn" id="act-dl">⬇️ Télécharger .md</button>' +
        '<a class="btn" href="cours.html?c=' + encodeURIComponent(subject.code) + '">📚 Cours complet</a>' +
        "</div>";

      host.className = "cheat-wrap";
      host.innerHTML =
        '<div class="breadcrumb"><a href="index.html">Accueil</a> › ' +
        '<a href="cours.html?c=' + encodeURIComponent(subject.code) + '">' + esc(subject.name) + "</a> › Antisèche</div>" +
        '<div class="cheat-head"><h1>' + subject.emoji + " " + esc(title) + "</h1>" +
        (meta.subtitle ? '<p class="lede">' + window.MD.inline(meta.subtitle) + "</p>" : "") +
        domainsHTML(meta) + chipsHTML(meta) + actions + "</div>";

      host.appendChild(buildGrid(parsed.html));
      host.insertAdjacentHTML("beforeend",
        '<div class="cheat-foot">⚡ Antisèche générée depuis <code>' + esc(subject.aide) +
        '</code> · <a href="cours.html?c=' + encodeURIComponent(subject.code) + '">aller au cours</a></div>');

      setBrand(subject);
      enhance(host);
      wireQuizzes(host);
      wireActions(subject, src, host);
      typeset(host);
    }).catch(function (err) {
      host.className = "cheat-wrap";
      host.innerHTML = '<div class="course-error"><h2>😕 Impossible de charger l’antisèche</h2>' +
        "<p>Fichier : <code>" + esc(subject.aide) + "</code><br>" + esc(String(err)) + "</p>" +
        "<p>En <code>file://</code>, certains navigateurs bloquent la lecture locale. Ouvre via GitHub Pages " +
        "ou <code>python -m http.server</code>.</p>" +
        '<p><a class="btn" href="cours.html?c=' + encodeURIComponent(subject.code) + '">← Cours ' + esc(subject.name) + "</a></p></div>";
    });
  }

  /* ---------- Actions (imprimer / copier / télécharger) ---------- */
  function wireActions(subject, src, host) {
    var p = host.querySelector("#act-print");
    if (p) p.addEventListener("click", function () { window.print(); });
    var tts = host.querySelector("#act-tts");
    if (tts) {
      if (!("speechSynthesis" in window)) { tts.style.display = "none"; }
      else {
        var speaking = false;
        var stop = function () { window.speechSynthesis.cancel(); speaking = false; tts.classList.remove("ok"); tts.textContent = "🔊 Écouter"; };
        tts.addEventListener("click", function () {
          if (speaking) { stop(); return; }
          var grid = host.querySelector(".cheat-grid");
          var text = grid ? grid.textContent.replace(/\s+/g, " ").trim() : "";
          if (!text) return;
          var u = new SpeechSynthesisUtterance(text.slice(0, 32000));
          u.lang = "fr-FR"; u.onend = stop; u.onerror = stop;
          window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
          speaking = true; tts.classList.add("ok"); tts.textContent = "⏹ Arrêter";
        });
        window.addEventListener("beforeunload", function () { try { window.speechSynthesis.cancel(); } catch (e) {} });
      }
    }
    var c = host.querySelector("#act-copy");
    if (c) c.addEventListener("click", function () {
      var done = function () { c.textContent = "Copié ✓"; c.classList.add("ok"); setTimeout(function () { c.textContent = "📋 Copier"; c.classList.remove("ok"); }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(src).then(done, function () {});
      else { var ta = document.createElement("textarea"); ta.value = src; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} ta.remove(); }
    });
    var d = host.querySelector("#act-dl");
    if (d) d.addEventListener("click", function () {
      var blob = new Blob([src], { type: "text/markdown;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "antiseche-" + subject.code.toLowerCase() + ".md";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    });
  }

  /* ---------- Enrichissement (repris du moteur de cours) ---------- */
  function enhance(host) {
    try { enhanceCulture(host); } catch (e) {}
    try { addCopyButtons(host); } catch (e) {}
    try { highlightCode(host); } catch (e) {}
  }
  function enhanceCulture(host) {
    host.querySelectorAll(".culture ul").forEach(function (ul) {
      var lis = Array.prototype.slice.call(ul.children).filter(function (n) { return n.tagName === "LI"; });
      if (!lis.length) return;
      var allLinks = lis.every(function (li) { var a = li.querySelector("a"); return a && li.textContent.trim() === a.textContent.trim(); });
      if (allLinks) {
        var div = document.createElement("div"); div.className = "clinks";
        lis.forEach(function (li) { div.appendChild(li.querySelector("a")); });
        ul.parentNode.replaceChild(div, ul); return;
      }
      if (lis.some(function (li) { return li.querySelector("strong, b"); })) ul.classList.add("names");
    });
  }
  function addCopyButtons(host) {
    host.querySelectorAll("pre.code").forEach(function (pre) {
      var btn = document.createElement("button");
      btn.className = "copy-btn"; btn.type = "button"; btn.textContent = "Copier";
      btn.addEventListener("click", function () {
        var code = pre.querySelector("code"); var txt = code ? code.textContent : pre.textContent;
        var done = function () { btn.textContent = "Copié ✓"; btn.classList.add("ok"); setTimeout(function () { btn.textContent = "Copier"; btn.classList.remove("ok"); }, 1400); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () {});
        else { var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} ta.remove(); }
      });
      pre.appendChild(btn);
    });
  }
  var KEYWORDS = {
    rust: "as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while",
    python: "and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None",
    bash: "if then else elif fi for while do done case esac function in return export local echo cd",
    sql: "select from where group by order having join left right inner outer on as insert update delete into values create table drop alter index distinct limit union and or not null",
    js: "var let const function return if else for while do switch case break continue new this typeof instanceof class extends super import export default await async yield true false null undefined"
  };
  function escHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function highlightCode(host) {
    host.querySelectorAll("pre.code[data-lang]").forEach(function (pre) {
      var lang = (pre.getAttribute("data-lang") || "").toLowerCase();
      var map = { js: "js", javascript: "js", ts: "js", typescript: "js", py: "python", python: "python",
        rust: "rust", rs: "rust", bash: "bash", sh: "bash", shell: "bash", console: "bash", toml: null, sql: "sql" };
      if (!(lang in map)) return;
      var key = map[lang]; if (!key) return;
      var code = pre.querySelector("code"); if (!code || code.querySelector("span")) return;
      var comment = (key === "python" || key === "bash") ? "#[^\\n]*" : (key === "sql" ? "--[^\\n]*" : "\\/\\/[^\\n]*");
      var kw = KEYWORDS[key].split(" ").join("|");
      var parts = ['"(?:[^"\\\\]|\\\\.)*"', "'(?:[^'\\\\]|\\\\.)*'", comment, "\\b(?:" + kw + ")\\b", "\\b\\d[\\d_.]*\\b", "[A-Za-z_][A-Za-z0-9_]*(?=\\s*\\()"];
      var re = new RegExp("(" + parts[0] + "|" + parts[1] + ")|(" + parts[2] + ")|(" + parts[3] + ")|(" + parts[4] + ")|(" + parts[5] + ")", "g");
      code.innerHTML = escHtml(code.textContent).replace(re, function (m, str, com, k, num, fn) {
        if (str !== undefined) return '<span class="tok-str">' + m + "</span>";
        if (com !== undefined) return '<span class="tok-com">' + m + "</span>";
        if (k !== undefined) return '<span class="tok-kw">' + m + "</span>";
        if (num !== undefined) return '<span class="tok-num">' + m + "</span>";
        if (fn !== undefined) return '<span class="tok-fn">' + m + "</span>";
        return m;
      });
    });
  }
  function wireQuizzes(host) {
    host.querySelectorAll(".quiz").forEach(function (quiz) {
      var answer = parseInt(quiz.getAttribute("data-answer"), 10);
      var opts = Array.prototype.slice.call(quiz.querySelectorAll(".opt"));
      opts.forEach(function (opt, i) {
        opt.addEventListener("click", function () {
          if (quiz.classList.contains("answered")) return;
          quiz.classList.add("answered");
          opts.forEach(function (o, j) { if (j === answer) o.classList.add("correct"); else if (j === i) o.classList.add("wrong"); });
          var fb = quiz.querySelector(".feedback");
          if (fb) { var ex = fb.getAttribute("data-explain"); fb.innerHTML = (i === answer ? "✅ Correct ! " : "❌ Pas tout à fait. ") + (ex || ""); if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([fb]); }
        });
      });
    });
  }
  function typeset(host) {
    var hasMath = /\\\(|\\\[|math-block/.test(host.innerHTML);
    if (!hasMath) return;
    if (window.MathJax && window.MathJax.typesetPromise) { window.MathJax.typesetPromise([host]); return; }
    if (document.getElementById("mathjax-cdn")) return;
    window.MathJax = { tex: { inlineMath: [["\\(", "\\)"]], displayMath: [["\\[", "\\]"]] }, svg: { fontCache: "global" } };
    var s = document.createElement("script"); s.id = "mathjax-cdn"; s.async = true;
    s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    document.head.appendChild(s);
  }

  /* ---------- Chrome (barre lecture, retour haut, thème) ---------- */
  function initChrome() {
    var bar = document.querySelector(".read-progress > span");
    var top = document.querySelector(".to-top");
    window.addEventListener("scroll", function () {
      var h = document.documentElement, sc = h.scrollTop, max = h.scrollHeight - h.clientHeight;
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
    var host = document.getElementById("cheat-root");
    if (!host) return;
    var code = qs("c");
    var subject = findSubject(code);
    if (!subject) {
      host.className = "cheat-wrap";
      host.innerHTML = '<div class="course-error"><h2>Matière introuvable</h2>' +
        "<p>Le paramètre <code>?c=" + esc(code || "") + "</code> ne correspond à aucune matière.</p>" +
        '<p><a class="btn" href="index.html">← Accueil</a></p></div>';
      return;
    }
    if (!subject.aide) {
      host.className = "cheat-wrap";
      host.innerHTML = '<div class="course-error"><h2>Pas encore d’antisèche</h2>' +
        "<p>La matière <b>" + esc(subject.name) + "</b> n’a pas de champ <code>aide:</code> dans le manifeste.</p>" +
        '<p><a class="btn" href="cours.html?c=' + encodeURIComponent(subject.code) + '">📚 Cours ' + esc(subject.name) + "</a></p></div>";
      return;
    }
    render(subject, host);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
