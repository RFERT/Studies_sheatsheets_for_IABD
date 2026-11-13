/* =========================================================
   nav.js — Barre de navigation commune + widgets partagés (portail Pharmacie)
   Chargé APRÈS data.js et common.js sur chaque page :
     <script src="<chemin>/assets/nav.js"></script>
   Fournit : thème clair/sombre/auto (bouton #theme-toggle), couleur d'accent,
   menu 📚 (modules, antisèches, outils), minuteur Pomodoro flottant,
   retour en haut, raccourcis clavier, PWA (manifest, iOS, service worker)
   et accessibilité (lien d'évitement, focus visible).
   Se style tout seul. 100 % autonome : aucun fichier hors du dossier Pharmacie.
   Expose : window.PHARMA.nav = { applyTheme, applyAccent }
   ========================================================= */
(function () {
  "use strict";
  var P = window.PHARMA = window.PHARMA || {};
  var K = P.K || { theme: "pharma-theme", accent: "pharma-accent" };

  var cs = document.currentScript;
  if (!cs) {
    var ss = document.querySelectorAll('script[src*="assets/nav.js"]');
    cs = ss.length ? ss[ss.length - 1] : null;
  }
  var root = cs && cs.src ? cs.src.replace(/assets\/nav\.js(\?.*)?$/, "") : (P.root || "");

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- Styles injectés une seule fois ---------- */
  var vars =
    ':root{--xbg:#0f1221;--xcard:#1b1f38;--xelev:#232848;--xline:#2c3358;--xtext:#e8ebff;--xmuted:#8d96c2;--xacc:#2fb37a;--xonacc:#04170f}' +
    ':root[data-theme="light"]{--xbg:#f3fbf7;--xcard:#ffffff;--xelev:#e7f6ef;--xline:#cde9dc;--xtext:#0f2a20;--xmuted:#5e7a6e;--xacc:#138a5c;--xonacc:#ffffff}';
  var css = `
  .xnav{position:relative;display:flex;align-items:center}
  .brand-home{display:inline-flex;align-items:center;text-decoration:none !important;color:inherit;border-radius:10px;transition:.15s;min-width:0}
  .brand-home:hover{opacity:.9;text-decoration:none}
  .brand-home:hover .logo{transform:scale(1.08)}
  .brand-home .logo{transition:transform .15s}
  .xnav-btn{cursor:pointer;border:1px solid var(--xline);background:var(--xcard);color:var(--xtext);min-height:40px;
    padding:8px 13px;border-radius:10px;font-size:14px;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:.15s}
  .xnav-btn:hover{border-color:var(--xacc)}
  .xnav-menu{position:absolute;top:calc(100% + 8px);left:0;z-index:200;min-width:240px;max-width:calc(100vw - 24px);
    background:var(--xcard);border:1px solid var(--xline);border-radius:12px;box-shadow:0 16px 44px rgba(0,0,0,.4);
    padding:6px;display:none;flex-direction:column;gap:1px;
    max-height:calc(100vh - 74px);max-height:calc(100dvh - 74px);overflow-y:auto;overscroll-behavior:contain;
    -webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--xline) transparent}
  .xnav-menu::-webkit-scrollbar{width:8px}
  .xnav-menu::-webkit-scrollbar-thumb{background:var(--xline);border-radius:8px}
  .xnav-menu.open{display:flex}
  .xnav-menu a{display:flex;align-items:center;gap:10px;padding:9px 11px;min-height:40px;border-radius:9px;color:var(--xtext);
    text-decoration:none;font-size:14px;line-height:1.2}
  .xnav-menu a:hover{background:var(--xelev);text-decoration:none}
  .xnav-menu a[aria-current="page"]{background:var(--xelev);font-weight:700;box-shadow:inset 3px 0 0 var(--xacc)}
  .xnav-menu a>span:first-child{width:1.4em;text-align:center;flex:0 0 auto}
  .xnav-sep{height:1px;background:var(--xline);margin:5px 2px;flex:0 0 auto}
  .xnav-lbl{position:sticky;top:-6px;z-index:1;background:var(--xcard);font-size:10.5px;text-transform:uppercase;letter-spacing:1px;color:var(--xmuted);padding:6px 11px 3px;font-weight:700}
  .xnav-acc{display:flex;gap:8px;padding:4px 11px 8px;flex-wrap:wrap}
  .xnav-sw{width:26px;height:26px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:.12s;padding:0;font:inherit}
  .xnav-sw:hover{transform:scale(1.12)}
  .xnav-sw.on{border-color:var(--xtext)}
  .xnav-modes{display:flex;gap:6px;padding:4px 11px 8px}
  .xnav-chip{flex:1;cursor:pointer;border:1px solid var(--xline);background:var(--xelev);color:var(--xtext);min-height:40px;
    border-radius:9px;font:inherit;font-size:13px}
  .xnav-chip.on{background:var(--xacc);color:var(--xonacc);border-color:transparent;font-weight:700}
  .xnav-keys{font-size:11.5px;color:var(--xmuted);padding:6px 11px 4px;line-height:1.5}
  .xnav-keys kbd{border:1px solid var(--xline);background:var(--xelev);border-radius:5px;padding:0 5px;font:inherit;font-size:11px}
  /* Pomodoro flottant */
  .pomo{position:fixed;left:18px;bottom:18px;z-index:60;
    left:max(18px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));font-family:inherit}
  .pomo-fab{width:46px;height:46px;border-radius:50%;border:1px solid var(--xline);cursor:pointer;
    background:var(--xcard);color:var(--xtext);font-size:20px;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:.15s}
  .pomo-fab:hover{border-color:var(--xacc)}
  .pomo-fab.run{background:linear-gradient(135deg,#ff6b4a,#ff3b3b);color:#fff;border-color:transparent}
  .pomo-panel{position:absolute;left:0;bottom:56px;width:214px;max-width:calc(100vw - 36px);background:var(--xcard);border:1px solid var(--xline);
    border-radius:14px;box-shadow:0 16px 44px rgba(0,0,0,.4);padding:14px;display:none;color:var(--xtext)}
  .pomo-panel.open{display:block}
  .pomo-time{font-size:40px;font-weight:800;text-align:center;color:var(--xtext);font-variant-numeric:tabular-nums;letter-spacing:1px;line-height:1.3}
  .pomo-mode{text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--xmuted);margin-bottom:8px}
  .pomo-row{display:flex;gap:7px;margin-top:10px}
  .pomo-row button{flex:1;cursor:pointer;border:1px solid var(--xline);background:var(--xelev);color:var(--xtext);
    min-height:40px;padding:8px;border-radius:9px;font-size:13px;font-family:inherit}
  .pomo-row button:hover{border-color:var(--xacc)}
  .pomo-row button.primary{background:var(--xacc);color:var(--xonacc);border-color:transparent;font-weight:700}
  /* Retour en haut (pages sans bouton propre) */
  .xtop{position:fixed;right:18px;bottom:18px;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));
    z-index:55;width:44px;height:44px;border-radius:50%;border:1px solid var(--xline);background:var(--xcard);color:var(--xtext);
    font-size:18px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.3);display:none;align-items:center;justify-content:center}
  .xtop.show{display:flex}
  .xtop:hover{border-color:var(--xacc)}
  .xskip{position:absolute;left:-999px;top:0;z-index:300;background:var(--xacc);color:var(--xonacc);padding:12px 16px;border-radius:0 0 10px 0;font-weight:700;text-decoration:none}
  .xskip:focus{left:0}
  :focus-visible{outline:2px solid var(--xacc);outline-offset:2px}
  @media (max-width:560px){
    .xnav-btn span.lbl{display:none}
    .pomo-fab{width:44px;height:44px;font-size:18px}
    .topbar{gap:8px !important;padding-left:max(12px,env(safe-area-inset-left)) !important;padding-right:max(12px,env(safe-area-inset-right)) !important}
    .topbar .btn{padding:8px 10px}
    .topbar .brand{font-size:14px;gap:8px}
  }
  /* Petits écrans : seul le logo reste (il renvoie à l'accueil), pour laisser la place aux boutons */
  @media (max-width:520px){ .topbar .brand{font-size:0;gap:0} .topbar .brand .logo{font-size:17px} }
  @media print{ .xnav,.pomo,.xtop,.xskip{display:none !important} }
  /* ---------- Réglages iPhone / iOS Safari (sans effet ailleurs) ---------- */
  html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
  a,button,summary,label,select,input,textarea{-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  /* iOS zoome la page au focus d'un champ dont la police est < 16 px */
  @supports (-webkit-touch-callout:none){
    input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]),
    select,textarea{font-size:16px !important}
    body{background-attachment:scroll !important}
  }
  /* Paysage : l'encoche / les coins arrondis ne doivent pas rogner le contenu */
  @media (orientation:landscape){
    body{padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
  }
  /* clip n'ouvre pas de conteneur de défilement (contrairement à hidden) : position:sticky reste OK */
  @media (max-width:560px){ body{overflow-x:clip} }
  `;
  var st = document.createElement("style");
  st.id = "pharma-nav-css";
  st.textContent = vars + css;
  document.head.appendChild(st);

  /* ---------- PWA : manifest, iOS, service worker ---------- */
  (function pwa() {
    if (!document.querySelector('link[rel="manifest"]')) {
      var m = document.createElement("link");
      m.rel = "manifest"; m.href = root + "manifest.webmanifest";
      document.head.appendChild(m);
    }
    // iOS n'accepte pas le SVG pour l'icône d'écran d'accueil : PNG 180×180
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      var at = document.createElement("link");
      at.rel = "apple-touch-icon"; at.href = root + "assets/apple-touch-icon.png";
      at.setAttribute("sizes", "180x180");
      document.head.appendChild(at);
    }
    if (!document.querySelector('link[rel="icon"]')) {
      var ic = document.createElement("link");
      ic.rel = "icon"; ic.type = "image/svg+xml"; ic.href = root + "assets/icon.svg";
      document.head.appendChild(ic);
    }
    [["apple-mobile-web-app-capable", "yes"],
     ["mobile-web-app-capable", "yes"],
     ["apple-mobile-web-app-status-bar-style", "black"],
     ["apple-mobile-web-app-title", "Pharmacie DEUST"],
     ["format-detection", "telephone=no"]].forEach(function (p) {
      if (document.querySelector('meta[name="' + p[0] + '"]')) return;
      var mt = document.createElement("meta");
      mt.name = p[0]; mt.content = p[1];
      document.head.appendChild(mt);
    });
    var canSW = ("serviceWorker" in navigator) &&
      (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1");
    if (canSW) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register(root + "sw.js").catch(function () {});
      });
    }
  })();

  /* ---------- Thème : clair / sombre / auto ---------- */
  var THEME_BG = { dark: "#0f1221", light: "#f3fbf7" };
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

  function themeMode() {
    var v = lsGet(K.theme);
    return (v === "light" || v === "dark") ? v : "auto";
  }
  function effectiveTheme(mode) {
    if (mode === "light" || mode === "dark") return mode;
    return (mq && mq.matches) ? "light" : "dark";
  }
  var curAccent = lsGet(K.accent) || "";

  function shade(hex, f) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return hex;
    var n = parseInt(m[1], 16), out = "#";
    [n >> 16, (n >> 8) & 255, n & 255].forEach(function (c) {
      var h = Math.round(c * f).toString(16);
      out += h.length < 2 ? "0" + h : h;
    });
    return out;
  }
  function onColor(hex) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return "";
    var n = parseInt(m[1], 16);
    var l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return l > 0.55 ? "#04170f" : "#ffffff";
  }
  function applyAccent(v, persist) {
    v = v || "";
    curAccent = v;
    if (persist) lsSet(K.accent, v);
    var el = document.documentElement;
    var light = el.getAttribute("data-theme") === "light";
    var c = v ? (light ? shade(v, 0.72) : v) : "";
    ["--primary", "--accent", "--xacc"].forEach(function (p) {
      if (c) el.style.setProperty(p, c); else el.style.removeProperty(p);
    });
    if (c) el.style.setProperty("--xonacc", onColor(c));
    else el.style.removeProperty("--xonacc");
    var sws = document.querySelectorAll(".xnav-sw");
    for (var i = 0; i < sws.length; i++) {
      sws[i].classList.toggle("on", (sws[i].getAttribute("data-acc") || "") === v);
    }
  }

  function syncThemeUI(mode, eff) {
    var b = document.getElementById("theme-toggle");
    if (b) b.textContent = eff === "light" ? "🌙 Sombre" : "☀️ Clair";
    var chips = document.querySelectorAll(".xnav-chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle("on", chips[i].getAttribute("data-mode") === mode);
    }
    var tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute("content", THEME_BG[eff]);
  }
  function applyTheme(mode, persist) {
    if (mode !== "light" && mode !== "dark") mode = "auto";
    if (persist) lsSet(K.theme, mode);
    var eff = effectiveTheme(mode);
    document.documentElement.setAttribute("data-theme", eff);
    applyAccent(curAccent);
    syncThemeUI(mode, eff);
    try { document.dispatchEvent(new CustomEvent("pharma:theme", { detail: { mode: mode, theme: eff } })); } catch (e) {}
    return eff;
  }
  applyTheme(themeMode());
  applyAccent(curAccent);
  if (mq) {
    var onSys = function () { if (themeMode() === "auto") applyTheme("auto"); };
    if (mq.addEventListener) mq.addEventListener("change", onSys);
    else if (mq.addListener) mq.addListener(onSys);
  }
  function toggleTheme() {
    var eff = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(eff === "light" ? "dark" : "light", true);
  }
  var tbtn = document.getElementById("theme-toggle");
  // Capture + stopImmediatePropagation : évite qu'un gestionnaire de page antérieur ne rebascule le thème
  if (tbtn) tbtn.addEventListener("click", function (e) {
    e.stopImmediatePropagation();
    toggleTheme();
    if (mount && mount._xSetOpen) mount._xSetOpen(false);
  }, true);

  P.nav = {
    applyTheme: function (mode) { return applyTheme(mode, true); },
    applyAccent: function (v) { applyAccent(v, true); }
  };

  /* ---------- Lien d'évitement (accessibilité) ---------- */
  var skip = document.createElement("a");
  skip.className = "xskip no-print";
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

  /* ---------- Menu 📚 ---------- */
  var ACCENTS = [
    { name: "Défaut", v: "" },
    { name: "Bleu", v: "#6c8cff" },
    { name: "Émeraude", v: "#27e0b0" },
    { name: "Orange", v: "#ff8a3d" },
    { name: "Violet", v: "#b98cff" },
    { name: "Rose", v: "#ff6b9d" },
    { name: "Cyan", v: "#38bdf8" }
  ];
  var mods = Array.isArray(P.modules) ? P.modules : [];
  function shortTitle(m) { return String(m.title || m.id).split(/ [&:\-–—] /)[0]; }

  var items = [{ e: "🏠", t: "Accueil", h: root + "index.html" }, { sep: 1 }];
  (P.years || [{ id: 1, label: "Année 1" }, { id: 2, label: "Année 2" }]).forEach(function (y) {
    var list = mods.filter(function (m) { return m.year === y.id; });
    if (!list.length) return;
    items.push({ lbl: "Modules · Année " + y.id });
    list.forEach(function (m) { items.push({ e: m.emoji, t: shortTitle(m), h: root + m.file }); });
  });
  if (mods.length) items.push({ sep: 1 });
  items.push({ lbl: "Antisèches" }, { e: "⚡", t: "Toutes les antisèches", h: root + "aide.html" });
  mods.forEach(function (m) { items.push({ e: m.emoji, t: "Antisèche " + shortTitle(m), h: root + "aide.html?m=" + encodeURIComponent(m.id) }); });
  items.push({ sep: 1 }, { lbl: "Outils" },
    { e: "🗂️", t: "Flashcards", h: root + "flashcards.html" },
    { e: "📝", t: "Examen blanc", h: root + "examen.html" },
    { e: "📖", t: "Glossaire", h: root + "glossaire.html" },
    { e: "🚀", t: "Améliorations", h: root + "ameliorations.html" },
    { e: "⚙️", t: "À configurer", h: root + "parametrage.html" });

  var here = location.href.split("#")[0];
  var hereNoQ = here.split("?")[0];
  var menuHTML = items.map(function (it) {
    if (it.sep) return '<div class="xnav-sep"></div>';
    if (it.lbl) return '<div class="xnav-lbl">' + it.lbl + "</div>";
    var cur = "";
    if (it.h.split("#")[0] === here || (it.h.indexOf("?") === -1 && it.h === hereNoQ) ||
        (it.h === root + "index.html" && hereNoQ === root)) cur = ' aria-current="page"';
    return '<a href="' + it.h + '"' + cur + "><span>" + it.e + "</span> " + it.t + "</a>";
  }).join("");

  var accHTML = '<div class="xnav-sep"></div><div class="xnav-lbl">🎨 Couleur d\'accent</div><div class="xnav-acc">' +
    ACCENTS.map(function (a) {
      var bg = a.v || "linear-gradient(135deg,#2fb37a,#38b6c4)";
      return '<button type="button" class="xnav-sw' + (curAccent === a.v ? " on" : "") + '" title="' + a.name +
        '" aria-label="Accent ' + a.name + '" data-acc="' + a.v + '" style="background:' + bg + '"></button>';
    }).join("") + "</div>" +
    '<div class="xnav-lbl">🌓 Thème</div><div class="xnav-modes">' +
    '<button type="button" class="xnav-chip" data-mode="auto">Auto</button>' +
    '<button type="button" class="xnav-chip" data-mode="light">☀️ Clair</button>' +
    '<button type="button" class="xnav-chip" data-mode="dark">🌙 Sombre</button></div>' +
    '<div class="xnav-keys"><kbd>g</kbd> puis <kbd>m</kbd> menu · <kbd>t</kbd> thème · <kbd>/</kbd> recherche</div>';

  var mount = document.querySelector(".topbar, header.top, .top, .topbar-m");

  // Logo cliquable : retour à l'accueil depuis n'importe quelle page
  var brand = document.querySelector(".brand");
  if (brand && brand.tagName !== "A" && !brand.closest("a")) {
    var home = document.createElement("a");
    home.className = "brand-home";
    home.href = root + "index.html";
    home.title = "Retour à l'accueil";
    home.setAttribute("aria-label", "Retour à l'accueil");
    brand.parentNode.insertBefore(home, brand);
    home.appendChild(brand);
  }

  var menu = null, btn = null;
  if (mount) {
    var xnav = document.createElement("div");
    xnav.className = "xnav no-print";
    xnav.innerHTML =
      '<button class="xnav-btn" id="xnavBtn" aria-haspopup="true" aria-expanded="false">📚 <span class="lbl">Menu</span> ▾</button>' +
      '<div class="xnav-menu" id="xnavMenu" role="menu">' + menuHTML + accHTML + "</div>";
    var spacer = mount.querySelector(".spacer");
    if (spacer) mount.insertBefore(xnav, spacer);
    else mount.appendChild(xnav);

    btn = xnav.querySelector("#xnavBtn");
    menu = xnav.querySelector("#xnavMenu");
    var sizeMenu = function () {
      menu.style.maxHeight = "none";
      menu.style.left = "0px";
      var margin = 12;
      var r = menu.getBoundingClientRect();
      var avail = window.innerHeight - r.top - margin;
      menu.style.maxHeight = Math.max(160, avail) + "px";
      var overR = r.right - (document.documentElement.clientWidth - margin);
      if (overR > 0) menu.style.left = (-overR) + "px";
      var r2 = menu.getBoundingClientRect();
      if (r2.left < margin) menu.style.left = (parseFloat(menu.style.left) + (margin - r2.left)) + "px";
    };
    var setOpen = function (open) {
      menu.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) sizeMenu();
    };
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!menu.classList.contains("open"));
    });
    window.addEventListener("resize", function () { if (menu.classList.contains("open")) sizeMenu(); });
    document.addEventListener("click", function (e) { if (!xnav.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) { setOpen(false); btn.focus(); }
    });
    menu.addEventListener("click", function (e) {
      var sw = e.target.closest ? e.target.closest(".xnav-sw") : null;
      if (sw) { applyAccent(sw.getAttribute("data-acc") || "", true); return; }
      var chip = e.target.closest ? e.target.closest(".xnav-chip") : null;
      if (chip) applyTheme(chip.getAttribute("data-mode"), true);
    });
    syncThemeUI(themeMode(), document.documentElement.getAttribute("data-theme"));
    mount._xSetOpen = setOpen;
  }

  /* ---------- Raccourcis clavier ---------- */
  var gPending = 0;
  function typing(t) {
    return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }
  var onHome = (hereNoQ === root || hereNoQ === root + "index.html");
  document.addEventListener("keydown", function (e) {
    var key = (e.key || "").toLowerCase();
    // Recherche avancée : sur l'accueil c'est le portail qui gère « / » et Ctrl/⌘+K
    if (!onHome && !P.noGlobalSearchKey && !e.defaultPrevented &&
        ((key === "k" && (e.ctrlKey || e.metaKey) && !e.altKey) || (key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e.target)))) {
      e.preventDefault();
      location.href = root + "index.html#recherche";
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
    if (key === "t") { toggleTheme(); gPending = 0; return; }
    if (key === "g") { gPending = Date.now(); return; }
    if (key === "m" && gPending && Date.now() - gPending < 1200) {
      gPending = 0;
      if (btn && menu) { e.preventDefault(); var o = !menu.classList.contains("open"); mount._xSetOpen(o); if (o) btn.focus(); }
      return;
    }
    gPending = 0;
  });

  /* ---------- Retour en haut (si la page n'en a pas déjà un) ---------- */
  window.addEventListener("load", function () {
    if (document.querySelector(".to-top, .xtop")) return;
    var up = document.createElement("button");
    up.type = "button"; up.className = "xtop no-print";
    up.title = "Retour en haut"; up.setAttribute("aria-label", "Retour en haut");
    up.textContent = "↑";
    document.body.appendChild(up);
    up.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    var onScroll = function () { up.classList.toggle("show", (window.pageYOffset || 0) > 500); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  });

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
    '<div class="pomo-row"><button class="primary" id="pomoToggle">▶ Démarrer</button><button id="pomoReset" aria-label="Réinitialiser">↺</button></div>' +
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
