/* =========================================================
   cheatsheet.js — Antisèches du portail Pharmacie
   Sans ?m= : sommaire des 9 antisèches (cartes, Année 1 / 2).
   Avec ?m=<idModule> : charge md/aide-<id>.md (fetch), le rend avec
   window.MD et affiche une fiche dense en colonnes, imprimable (PDF).
   Dépend de : window.PHARMA (data.js, common.js), window.MD (markdown.js).
   Optionnel : window.PHShare (assets/share.js), nav.js (menu, thème).
   ========================================================= */
(function () {
  "use strict";

  var P = window.PHARMA || { modules: [], years: [], byId: function () { return null; } };

  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function fetchText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    });
  }
  function mdUrl(id) { return "md/aide-" + id + ".md"; }
  function ficheUrl(id) { return "aide.html?m=" + encodeURIComponent(id); }
  function coursUrl(id) { return "modules/" + id + ".html"; }
  function shareApi() {
    var s = window.PHShare || window.PHARMAShare || (P && P.share);
    return s && typeof s.open === "function" ? s : null;
  }
  function flash(btn, label, back) {
    btn.textContent = label; btn.classList.add("ok");
    setTimeout(function () { btn.textContent = back; btn.classList.remove("ok"); }, 1500);
  }

  /* ---------- Sommaire des antisèches ---------- */
  function renderIndex(host) {
    document.title = "Antisèches — Préparateur en pharmacie";
    var html =
      '<div class="breadcrumb"><a href="index.html">Accueil</a> › Antisèches</div>' +
      '<div class="cheat-head"><h1>⚡ Antisèches</h1>' +
      '<p class="lede">Une fiche dense par module : définitions, tableaux, calculs, pièges d’examen et trous à réviser. ' +
      "Imprimable en PDF, lisible hors-ligne.</p>" +
      '<div class="cheat-search"><input id="sum-q" type="search" placeholder="Filtrer : posologie, AMM, pH, insuline…" ' +
      'autocomplete="off" aria-label="Filtrer les antisèches"></div></div>';
    (P.years || []).forEach(function (y) {
      var mods = P.modules.filter(function (m) { return m.year === y.id; });
      if (!mods.length) return;
      html += '<section class="sum-year"><h2 class="sum-yh">' + esc(y.label) + "</h2>" +
        '<div class="sum-grid">' + mods.map(cardHTML).join("") + "</div></section>";
    });
    html += '<p class="sum-empty" id="sum-empty" hidden>Aucune antisèche ne correspond à ce filtre.</p>' +
      '<div class="cheat-foot">Support pédagogique : vérifier les référentiels officiels (ANSM, Légifrance, Vidal).</div>';
    host.className = "cheat-wrap";
    host.innerHTML = html;
    wireFilter(host);
  }
  function cardHTML(m) {
    var hay = norm([m.title, m.subtitle, (m.tags || []).join(" "), (m.topics || []).join(" ")].join(" "));
    return '<article class="sum-card" data-hay="' + esc(hay) + '">' +
      '<a class="sum-main" href="' + ficheUrl(m.id) + '">' +
      '<span class="sum-ico" aria-hidden="true">' + m.emoji + "</span>" +
      '<span class="sum-txt"><span class="sum-num">Module ' + m.num + "</span>" +
      '<span class="sum-title">' + esc(m.title) + "</span>" +
      '<span class="sum-sub">' + esc(m.subtitle) + "</span></span></a>" +
      '<div class="sum-links"><a class="btn primary" href="' + ficheUrl(m.id) + '">⚡ Ouvrir</a>' +
      '<a class="btn" href="' + coursUrl(m.id) + '">📚 Cours</a></div></article>';
  }
  function wireFilter(host) {
    var input = host.querySelector("#sum-q");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = norm(input.value).trim().split(/\s+/).filter(Boolean), shown = 0;
      host.querySelectorAll(".sum-card").forEach(function (c) {
        var hay = c.getAttribute("data-hay"), ok = q.every(function (t) { return hay.indexOf(t) !== -1; });
        c.hidden = !ok; if (ok) shown++;
      });
      host.querySelectorAll(".sum-year").forEach(function (y) {
        y.hidden = !y.querySelector(".sum-card:not([hidden])");
      });
      var empty = host.querySelector("#sum-empty");
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* ---------- Fiche ---------- */
  function chipsHTML(mod, meta) {
    var info = ["Année " + mod.year, "Module " + mod.num];
    (mod.themes || []).forEach(function (t) { info.push(t); });
    var tg = meta.tags;
    if (tg && !Array.isArray(tg)) tg = String(tg).split(",").map(function (x) { return x.trim(); });
    (tg || []).forEach(function (t) { info.push(t); });
    return '<div class="meta-row">' + info.filter(Boolean).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>";
  }

  /* Découpe le HTML rendu en cartes : chaque <h2> ouvre une nouvelle carte. */
  function buildGrid(html) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    var grid = document.createElement("div");
    grid.className = "cheat-grid";
    var lead = null, card = null, content = null;
    Array.prototype.slice.call(tmp.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === "H2") {
        card = document.createElement("section");
        card.className = "cheat-card";
        card.id = "c-" + node.id;
        card.appendChild(node);
        content = document.createElement("div");
        content.className = "content";
        card.appendChild(content);
        grid.appendChild(card);
      } else if (card) {
        content.appendChild(node);
      } else {
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

  function pagerHTML(mod) {
    var mods = P.modules, i = mods.indexOf(mod);
    var prev = i > 0 ? mods[i - 1] : null, next = i < mods.length - 1 ? mods[i + 1] : null;
    return '<nav class="cheat-pager" aria-label="Autres antisèches">' +
      (prev ? '<a class="prev" href="' + ficheUrl(prev.id) + '"><span class="dir">← Précédente</span><span class="ttl">' + prev.emoji + " " + esc(prev.title) + "</span></a>" : "<span></span>") +
      (next ? '<a class="next" href="' + ficheUrl(next.id) + '"><span class="dir">Suivante →</span><span class="ttl">' + next.emoji + " " + esc(next.title) + "</span></a>" : "<span></span>") +
      "</nav>";
  }

  function renderFiche(mod, host) {
    host.className = "cheat-wrap";
    host.innerHTML = '<div class="course-loading">⏳ Chargement de l’antisèche…</div>';
    fetchText(mdUrl(mod.id)).then(function (src) {
      var parsed = window.MD.render(src);
      var meta = parsed.meta || {};
      var title = meta.title || ("Antisèche " + mod.title);
      document.title = title + " — Antisèche";

      var actions =
        '<div class="cheat-actions no-print">' +
        '<button class="btn primary" id="act-print" type="button">🖨️ Imprimer / PDF</button>' +
        '<button class="btn" id="act-tts" type="button">🔊 Écouter</button>' +
        '<button class="btn" id="act-cloze" type="button">👁️ Révéler les trous</button>' +
        '<button class="btn" id="act-share" type="button">🔗 Partager</button>' +
        '<button class="btn" id="act-copy" type="button">📋 Copier</button>' +
        '<button class="btn" id="act-dl" type="button">⬇️ Télécharger .md</button>' +
        '<a class="btn" href="' + coursUrl(mod.id) + '">📚 Cours complet</a>' +
        "</div>";

      host.innerHTML =
        '<div class="breadcrumb no-print"><a href="index.html">Accueil</a> › <a href="aide.html">Antisèches</a> › ' + esc(mod.title) + "</div>" +
        '<div class="cheat-head"><h1>' + mod.emoji + " " + esc(title) + "</h1>" +
        (meta.subtitle ? '<p class="lede">' + window.MD.inline(meta.subtitle) + "</p>" : "") +
        chipsHTML(mod, meta) + actions + "</div>";

      host.appendChild(buildGrid(parsed.html));
      host.insertAdjacentHTML("beforeend", pagerHTML(mod) +
        '<div class="cheat-foot">⚡ Antisèche générée depuis <code>' + esc(mdUrl(mod.id)) +
        '</code> · <a href="' + coursUrl(mod.id) + '">aller au cours</a></div>');

      wireCloze(host);
      wireGloss(host);
      wireQuizzes(host);
      wireActions(mod, src, host);
      scrollToHash();
      try { if (P.logActivity) P.logActivity({ k: "aide", m: mod.id }); } catch (e) {}
    }).catch(function (err) {
      host.innerHTML = '<div class="course-error"><h2>😕 Impossible de charger l’antisèche</h2>' +
        "<p>Fichier : <code>" + esc(mdUrl(mod.id)) + "</code><br>" + esc(String(err)) + "</p>" +
        "<p>En <code>file://</code>, certains navigateurs bloquent la lecture locale des fichiers. " +
        "Ouvre le portail via GitHub Pages ou un petit serveur : <code>python -m http.server</code>.</p>" +
        '<p><a class="btn" href="aide.html">← Toutes les antisèches</a> <a class="btn" href="' + coursUrl(mod.id) + '">📚 Cours</a></p></div>';
    });
  }

  function scrollToHash() {
    var h = location.hash && location.hash.slice(1);
    if (!h) return;
    var el = document.getElementById(h) || document.getElementById("c-" + h);
    if (el) setTimeout(function () { el.scrollIntoView(); }, 60);
  }

  /* ---------- Trous (cloze) ---------- */
  function wireCloze(host) {
    var list = host.querySelectorAll(".cloze");
    list.forEach(function (c) {
      c.addEventListener("click", function () { c.classList.toggle("revealed"); });
      c.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); c.classList.toggle("revealed"); }
      });
    });
    var btn = host.querySelector("#act-cloze");
    if (!btn) return;
    if (!list.length) { btn.style.display = "none"; return; }
    var hidden = true;
    btn.addEventListener("click", function () {
      hidden = !hidden;
      list.forEach(function (c) { c.classList.toggle("revealed", !hidden); });
      btn.textContent = hidden ? "👁️ Révéler les trous" : "🙈 Masquer les trous";
    });
  }

  /* ---------- Bulles de glossaire (survol / focus / tap) ---------- */
  /* La bulle est en position: fixed : on la place près du terme, bornée à l'écran. */
  var activeGloss = null;
  function placePop(g) {
    var pop = g.querySelector(".gloss-pop");
    if (!pop) return;
    activeGloss = g;
    pop.style.left = "0px"; pop.style.top = "0px";
    var gr = g.getClientRects()[0] || g.getBoundingClientRect();
    var w = pop.offsetWidth, h = pop.offsetHeight, vw = document.documentElement.clientWidth;
    var left = Math.max(8, Math.min(gr.left, vw - w - 8));
    var top = gr.top - h - 6;
    if (top < 56) top = gr.bottom + 6;
    pop.style.left = Math.round(left) + "px"; pop.style.top = Math.round(top) + "px";
  }
  function wireGloss(host) {
    host.querySelectorAll(".gloss").forEach(function (g) {
      ["mouseenter", "focus"].forEach(function (ev) { g.addEventListener(ev, function () { placePop(g); }); });
      g.addEventListener("click", function () {
        g.classList.toggle("open");
        if (g.classList.contains("open")) placePop(g); else g.blur();
      });
      g.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { g.classList.remove("open"); g.blur(); }
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); g.classList.toggle("open"); placePop(g); }
      });
    });
    document.addEventListener("click", function (e) {
      host.querySelectorAll(".gloss.open").forEach(function (g) { if (!g.contains(e.target)) g.classList.remove("open"); });
    });
    window.addEventListener("scroll", function () { if (activeGloss) placePop(activeGloss); }, { passive: true });
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
          if (fb) {
            fb.innerHTML = (i === answer ? "✅ Correct ! " : "❌ Pas tout à fait. ") + (fb.getAttribute("data-explain") || "");
            fb.classList.add("show", i === answer ? "ok" : "ko");
          }
        });
      });
    });
  }

  /* ---------- Lecture audio ---------- */
  function wireTTS(btn, host) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") { btn.style.display = "none"; return; }
    var speaking = false, queue = [];
    function stop() {
      queue = []; speaking = false;
      try { window.speechSynthesis.cancel(); } catch (e) {}
      btn.classList.remove("ok"); btn.textContent = "🔊 Écouter";
    }
    function chunks(text) {
      var out = [], cur = "";
      text.replace(/([.!?;:])\s+/g, "$1\u0001").split("\u0001").forEach(function (s) {
        if ((cur + " " + s).length > 220 && cur) { out.push(cur); cur = s; } else cur = cur ? cur + " " + s : s;
      });
      if (cur) out.push(cur);
      return out;
    }
    function next() {
      if (!speaking) return;
      var c = queue.shift();
      if (!c) { stop(); return; }
      var u = new SpeechSynthesisUtterance(c);
      u.lang = "fr-FR"; u.onend = next; u.onerror = stop;
      window.speechSynthesis.speak(u);
    }
    btn.addEventListener("click", function () {
      if (speaking) { stop(); return; }
      var grid = host.querySelector(".cheat-grid");
      if (!grid) return;
      var clone = grid.cloneNode(true);
      clone.querySelectorAll(".gloss-pop, .copy-btn").forEach(function (n) { n.remove(); });
      var text = clone.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      try { queue = chunks(text); } catch (e) { queue = [text.slice(0, 3000)]; }
      speaking = true; btn.classList.add("ok"); btn.textContent = "⏹ Arrêter";
      window.speechSynthesis.cancel();
      next();
    });
    window.addEventListener("pagehide", function () { try { window.speechSynthesis.cancel(); } catch (e) {} });
  }

  /* ---------- Actions ---------- */
  function wireActions(mod, src, host) {
    var p = host.querySelector("#act-print");
    if (p) p.addEventListener("click", function () { window.print(); });
    var tts = host.querySelector("#act-tts");
    if (tts) wireTTS(tts, host);

    var c = host.querySelector("#act-copy");
    if (c) c.addEventListener("click", function () {
      var done = function () { flash(c, "Copié ✓", "📋 Copier"); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(src).then(done, function () {});
      else {
        var ta = document.createElement("textarea"); ta.value = src; ta.style.fontSize = "16px";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        ta.remove();
      }
    });

    var sh = host.querySelector("#act-share");
    if (sh) {
      var api = shareApi();
      if (!api) sh.style.display = "none";
      else sh.addEventListener("click", function () { (shareApi() || api).open(location.href, "Antisèche " + mod.title); });
    }

    var d = host.querySelector("#act-dl");
    if (d) d.addEventListener("click", function () {
      var blob = new Blob([src], { type: "text/markdown;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "antiseche-" + mod.id + ".md";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    });
  }

  /* ---------- Chrome (barre de lecture, retour haut) ---------- */
  function initChrome() {
    var bar = document.querySelector(".read-progress > span");
    var top = document.querySelector(".to-top");
    window.addEventListener("scroll", function () {
      var h = document.documentElement, sc = h.scrollTop, max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.width = (max > 0 ? (sc / max * 100) : 0) + "%";
      if (top) top.classList.toggle("show", sc > 400);
    }, { passive: true });
    if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initChrome();
    var host = document.getElementById("cheat-root");
    if (!host) return;
    var id = qs("m");
    if (!id) { renderIndex(host); return; }
    var mod = P.byId(id);
    if (!mod) {
      host.className = "cheat-wrap";
      host.innerHTML = '<div class="course-error"><h2>Antisèche introuvable</h2>' +
        "<p>Le paramètre <code>?m=" + esc(id) + "</code> ne correspond à aucun module.</p>" +
        '<p><a class="btn" href="aide.html">← Toutes les antisèches</a></p></div>';
      return;
    }
    if (!window.MD) {
      host.innerHTML = '<div class="course-error"><h2>Moteur indisponible</h2><p>markdown.js n’a pas pu être chargé.</p></div>';
      return;
    }
    renderFiche(mod, host);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
