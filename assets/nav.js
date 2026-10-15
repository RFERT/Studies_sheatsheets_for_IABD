/* =========================================================
   nav.js — Barre de navigation commune + widgets partagés
   À inclure sur chaque page : <script src="<chemin>/assets/nav.js"></script>
   Fournit : menu « Cours » commun, sélecteur de couleur d'accent,
   minuteur Pomodoro flottant, et améliorations d'accessibilité.
   Se style tout seul (indépendant du CSS de la page).
   ========================================================= */
(function () {
  "use strict";
  var cs = document.currentScript;
  var root = cs ? cs.src.replace(/assets\/nav\.js(\?.*)?$/, "") : "";

  /* ---------- Styles injectés une seule fois ---------- */
  var css = `
  .xnav{position:relative;display:flex;align-items:center}
  .xnav-btn{cursor:pointer;border:1px solid var(--xline);background:var(--xcard);color:var(--xtext);
    padding:8px 13px;border-radius:9px;font-size:14px;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:.15s}
  .xnav-btn:hover{border-color:var(--xacc)}
  .xnav-menu{position:absolute;top:calc(100% + 8px);left:0;z-index:200;min-width:230px;
    background:var(--xcard);border:1px solid var(--xline);border-radius:12px;box-shadow:0 16px 44px rgba(0,0,0,.4);
    padding:7px;display:none;flex-direction:column;gap:2px}
  .xnav-menu.open{display:flex}
  .xnav-menu a{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;color:var(--xtext);
    text-decoration:none;font-size:14px}
  .xnav-menu a:hover{background:var(--xelev)}
  .xnav-sep{height:1px;background:var(--xline);margin:6px 2px}
  .xnav-lbl{font-size:10.5px;text-transform:uppercase;letter-spacing:1px;color:var(--xmuted);padding:4px 11px 2px;font-weight:700}
  .xnav-acc{display:flex;gap:7px;padding:6px 11px 8px;flex-wrap:wrap}
  .xnav-sw{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:.12s}
  .xnav-sw:hover{transform:scale(1.15)}
  .xnav-sw.on{border-color:var(--xtext)}
  /* Pomodoro flottant */
  .pomo{position:fixed;left:18px;bottom:18px;z-index:60;
    left:max(18px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));font-family:inherit}
  .pomo-fab{width:46px;height:46px;border-radius:50%;border:1px solid var(--xline);cursor:pointer;
    background:var(--xcard);color:var(--xtext);font-size:20px;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:.15s}
  .pomo-fab:hover{border-color:var(--xacc)}
  .pomo-fab.run{background:linear-gradient(135deg,#ff6b4a,#ff3b3b);color:#fff;border-color:transparent}
  .pomo-panel{position:absolute;left:0;bottom:56px;width:210px;background:var(--xcard);border:1px solid var(--xline);
    border-radius:14px;box-shadow:0 16px 44px rgba(0,0,0,.4);padding:14px;display:none}
  .pomo-panel.open{display:block}
  .pomo-time{font-size:40px;font-weight:800;text-align:center;color:var(--xtext);font-variant-numeric:tabular-nums;letter-spacing:1px}
  .pomo-mode{text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--xmuted);margin-bottom:8px}
  .pomo-row{display:flex;gap:7px;margin-top:10px}
  .pomo-row button{flex:1;cursor:pointer;border:1px solid var(--xline);background:var(--xelev);color:var(--xtext);
    padding:8px;border-radius:9px;font-size:13px;font-family:inherit}
  .pomo-row button:hover{border-color:var(--xacc)}
  .pomo-row button.primary{background:var(--xacc);color:#07121f;border-color:transparent;font-weight:700}
  .xskip{position:absolute;left:-999px;top:0;z-index:300;background:var(--xacc);color:#07121f;padding:10px 16px;border-radius:0 0 10px 0;font-weight:700;text-decoration:none}
  .xskip:focus{left:0}
  :focus-visible{outline:2px solid var(--xacc);outline-offset:2px}
  @media (max-width:560px){ .xnav-btn span.lbl{display:none} .pomo-fab{width:42px;height:42px;font-size:18px} }
  `;
  // Variables thème-agnostiques (fixées selon data-theme)
  var vars = `
  :root{--xbg:#12141c;--xcard:#1b1f2c;--xelev:#262c3d;--xline:#2f3650;--xtext:#eaeefc;--xmuted:#8891b4;--xacc:#6c8cff}
  :root[data-theme="light"]{--xbg:#fff;--xcard:#fff;--xelev:#eef1ff;--xline:#dbe1f5;--xtext:#161a2e;--xmuted:#5c6488;--xacc:#4169e1}
  `;
  var st = document.createElement("style");
  st.textContent = vars + css;
  document.head.appendChild(st);

  /* ---------- PWA : manifest + thème + service worker ---------- */
  (function pwa() {
    if (!document.querySelector('link[rel="manifest"]')) {
      var m = document.createElement("link");
      m.rel = "manifest"; m.href = root + "manifest.webmanifest";
      document.head.appendChild(m);
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      var at = document.createElement("link");
      at.rel = "apple-touch-icon"; at.href = root + "assets/icon.svg";
      document.head.appendChild(at);
    }
    var canSW = ("serviceWorker" in navigator) &&
      (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1");
    if (canSW) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register(root + "sw.js").catch(function () {});
      });
    }
  })();

  /* ---------- Accent personnalisé (appliqué partout) ---------- */
  var ACCENTS = [
    { name: "Défaut", v: "" },
    { name: "Bleu", v: "#6c8cff" },
    { name: "Émeraude", v: "#27e0b0" },
    { name: "Orange", v: "#ff8a3d" },
    { name: "Violet", v: "#b98cff" },
    { name: "Rose", v: "#ff6b9d" },
    { name: "Cyan", v: "#38bdf8" },
  ];
  var ACC_KEY = "esgi-accent";
  function applyAccent(v) {
    var el = document.documentElement;
    ["--primary", "--acc", "--accent-1"].forEach(function (p) {
      if (v) el.style.setProperty(p, v); else el.style.removeProperty(p);
    });
    el.style.setProperty("--xacc", v || (el.getAttribute("data-theme") === "light" ? "#4169e1" : "#6c8cff"));
  }
  applyAccent(localStorage.getItem(ACC_KEY) || "");

  /* ---------- Jours d'activité (pour la heatmap du portail) ---------- */
  (function recordActiveDay() {
    try {
      var k = "esgi-active-days";
      var d = new Date();
      var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      var days = JSON.parse(localStorage.getItem(k)) || {};
      days[key] = (days[key] || 0) + 1;
      localStorage.setItem(k, JSON.stringify(days));
    } catch (e) {}
  })();

  /* ---------- Lien d'évitement (accessibilité) ---------- */
  var skip = document.createElement("a");
  skip.className = "xskip";
  skip.href = "#";
  skip.textContent = "Aller au contenu";
  skip.addEventListener("click", function (e) {
    e.preventDefault();
    var main = document.querySelector("main, .wrap, .section, .rm, .guide") || document.body;
    main.setAttribute("tabindex", "-1");
    main.focus();
    main.scrollIntoView();
  });
  document.body.insertBefore(skip, document.body.firstChild);

  /* ---------- Menu « Cours » commun ---------- */
  function ensureManifest(cb) {
    if (window.COURS) return cb();
    var existing = document.querySelector("script[data-cours-manifest]");
    if (existing) { existing.addEventListener("load", cb); existing.addEventListener("error", cb); return; }
    var s = document.createElement("script");
    s.src = root + "matieres/cours.js";
    s.setAttribute("data-cours-manifest", "1");
    s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }
  function addManifestToMenu(menu) {
    ensureManifest(function () {
      if (!window.COURS || !Array.isArray(window.COURS.subjects)) return;
      var anchor = menu.querySelector('a[href*="rust-cursus"]');
      if (!anchor) return;
      var frag = window.COURS.subjects
        .filter(function (s) { return s.modules && s.modules.length; })
        .map(function (s) {
          return '<a href="' + root + "cours.html?c=" + encodeURIComponent(s.code) +
            '"><span>' + (s.emoji || "📘") + "</span> " + s.name + "</a>";
        }).join("");
      if (frag) anchor.insertAdjacentHTML("afterend", frag);
    });
  }

  var items = [
    { e: "🏠", t: "Accueil", h: root + "index.html" },
    { sep: 1 },
    { lbl: "Matières" },
    { e: "∑", t: "Mathématiques", h: root + "matieres/mathematiques/index.html" },
    { e: "🐍", t: "Python & Data Science", h: root + "matieres/python/index.html" },
    { e: "🦀", t: "Rust", h: root + "matieres/rust/rust-cursus.html" },
    { sep: 1 },
    { lbl: "Antisèches" },
    { e: "∑", t: "Aide-mémoire maths", h: root + "matieres/mathematiques/aide-memoire.html" },
    { e: "🐍", t: "Antisèche Python", h: root + "matieres/python/aide-memoire.html" },
    { e: "🦀", t: "Antisèche Rust", h: root + "matieres/rust/cheatsheet-rust.html" },
    { sep: 1 },
    { e: "📱", t: "Accès mobile", h: root + "guide-mobile.html" },
    { e: "🌐", t: "Publier (GitHub Pages)", h: root + "guide-github-pages.html" },
    { sep: 1 },
    { e: "🗂️", t: "Flashcards", h: root + "flashcards.html" },
    { e: "🚀", t: "Améliorations", h: root + "ameliorations.html" },
  ];
  var menuHTML = items.map(function (it) {
    if (it.sep) return '<div class="xnav-sep"></div>';
    if (it.lbl) return '<div class="xnav-lbl">' + it.lbl + "</div>";
    return '<a href="' + it.h + '"><span>' + it.e + "</span> " + it.t + "</a>";
  }).join("");
  var accHTML = '<div class="xnav-sep"></div><div class="xnav-lbl">🎨 Couleur d\'accent</div><div class="xnav-acc">' +
    ACCENTS.map(function (a) {
      var cur = localStorage.getItem(ACC_KEY) || "";
      var on = cur === a.v ? " on" : "";
      var bg = a.v || "linear-gradient(135deg,#6c8cff,#27e0b0)";
      return '<span class="xnav-sw' + on + '" title="' + a.name + '" data-acc="' + a.v + '" style="background:' + bg + '"></span>';
    }).join("") + "</div>";

  var mount = document.querySelector(".topbar, header.top, .top, .topbar-m");
  if (mount) {
    var xnav = document.createElement("div");
    xnav.className = "xnav";
    xnav.innerHTML =
      '<button class="xnav-btn" id="xnavBtn" aria-haspopup="true" aria-expanded="false">📚 <span class="lbl">Cours</span> ▾</button>' +
      '<div class="xnav-menu" id="xnavMenu" role="menu">' + menuHTML + accHTML + "</div>";
    var spacer = mount.querySelector(".spacer");
    if (spacer) mount.insertBefore(xnav, spacer);
    else mount.appendChild(xnav);

    var btn = xnav.querySelector("#xnavBtn");
    var menu = xnav.querySelector("#xnavMenu");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!xnav.contains(e.target)) menu.classList.remove("open");
    });
    menu.querySelectorAll(".xnav-sw").forEach(function (sw) {
      sw.addEventListener("click", function () {
        var v = sw.getAttribute("data-acc");
        localStorage.setItem(ACC_KEY, v);
        applyAccent(v);
        menu.querySelectorAll(".xnav-sw").forEach(function (o) { o.classList.remove("on"); });
        sw.classList.add("on");
      });
    });
    addManifestToMenu(menu);
  }

  /* ---------- Minuteur Pomodoro flottant ---------- */
  var WORK = 25 * 60, BREAK = 5 * 60;
  var remaining = WORK, mode = "Travail", timer = null;
  function fmt(s) { return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
  var pomo = document.createElement("div");
  pomo.className = "pomo no-print";
  pomo.innerHTML =
    '<div class="pomo-panel" id="pomoPanel">' +
    '<div class="pomo-time" id="pomoTime">25:00</div>' +
    '<div class="pomo-mode" id="pomoMode">Travail</div>' +
    '<div class="pomo-row"><button class="primary" id="pomoToggle">▶ Démarrer</button><button id="pomoReset">↺</button></div>' +
    '<div class="pomo-row"><button id="pomoWork">25 min</button><button id="pomoBreak">Pause 5</button></div>' +
    "</div>" +
    '<button class="pomo-fab" id="pomoFab" title="Minuteur Pomodoro" aria-label="Minuteur Pomodoro">🍅</button>';
  document.body.appendChild(pomo);
  var fab = pomo.querySelector("#pomoFab"), panel = pomo.querySelector("#pomoPanel");
  var timeEl = pomo.querySelector("#pomoTime"), modeEl = pomo.querySelector("#pomoMode");
  var toggle = pomo.querySelector("#pomoToggle");
  function paint() { timeEl.textContent = fmt(remaining); modeEl.textContent = mode; }
  function stop() { clearInterval(timer); timer = null; toggle.textContent = "▶ Reprendre"; fab.classList.remove("run"); }
  function tick() {
    remaining--;
    if (remaining <= 0) {
      stop();
      mode = (mode === "Travail") ? "Pause" : "Travail";
      remaining = (mode === "Travail") ? WORK : BREAK;
      try { new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play(); } catch (e) {}
      alert(mode === "Pause" ? "🍅 Session terminée ! Fais une pause de 5 min." : "⏰ Pause finie — au travail !");
    }
    paint();
  }
  fab.addEventListener("click", function () { panel.classList.toggle("open"); });
  toggle.addEventListener("click", function () {
    if (timer) { stop(); }
    else { timer = setInterval(tick, 1000); toggle.textContent = "⏸ Pause"; fab.classList.add("run"); }
  });
  pomo.querySelector("#pomoReset").addEventListener("click", function () { stop(); remaining = (mode === "Travail") ? WORK : BREAK; toggle.textContent = "▶ Démarrer"; paint(); });
  pomo.querySelector("#pomoWork").addEventListener("click", function () { stop(); mode = "Travail"; remaining = WORK; toggle.textContent = "▶ Démarrer"; paint(); });
  pomo.querySelector("#pomoBreak").addEventListener("click", function () { stop(); mode = "Pause"; remaining = BREAK; toggle.textContent = "▶ Démarrer"; paint(); });
  paint();
})();
