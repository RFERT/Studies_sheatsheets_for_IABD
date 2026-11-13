/* =========================================================
   examen.js — Examen blanc & quiz mélangés (portail Pharmacie)
   Source des questions : les blocs .quiz des modules (fetch + DOMParser).
   Clés localStorage : pharma-exam-prefs (derniers réglages),
   pharma-exam-history (20 dernières sessions), pharma-activity (via logActivity).
   ========================================================= */
(function () {
  "use strict";
  var P = window.PHARMA;
  if (!P || !P.read || !P.modules) return;

  var KP = "pharma-exam-prefs";
  var KH = "pharma-exam-history";
  var PERQ = [0, 30, 60, 90, 120];
  var COUNTS = [10, 20, 0];

  var esc = P.esc;
  var bank = [];
  var byMod = {};
  var cfg = null;
  var S = null;      // session en cours
  var R = null;      // résultats de la dernière session
  var timer = null;

  function $(id) { return document.getElementById(id); }
  function qa(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function say(msg) { var l = $("ex-live"); if (l) { l.textContent = ""; setTimeout(function () { l.textContent = msg; }, 30); } }

  function rnd(n) {
    var c = window.crypto;
    if (c && c.getRandomValues) {
      var u = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n;
      do { c.getRandomValues(u); } while (u[0] >= lim);
      return u[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function fmt(secs) {
    secs = Math.max(0, Math.round(secs));
    var h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    var p = function (x) { return String(x).padStart(2, "0"); };
    return (h ? h + ":" + p(m) : p(m)) + ":" + p(s);
  }
  function mod(id) { return P.byId ? P.byId(id) : null; }
  function modLabel(id) { var m = mod(id); return m ? (m.emoji || "") + " " + m.title : id; }
  function modShort(id) { var m = mod(id); return m ? (m.emoji || "") + " " + m.title.split(/\s*[&—:]\s*/)[0] : id; }

  /* ---------- Banque de questions ---------- */
  function cleanHTML(node) {
    var c = node.cloneNode(true);
    qa(c, "script,style,iframe,object,embed,link").forEach(function (n) { n.parentNode.removeChild(n); });
    qa(c, "*").forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
      });
    });
    return c.innerHTML.trim();
  }

  function parseModule(m, html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var out = [];
    qa(doc, ".quiz[data-answer]").forEach(function (q, idx) {
      var qt = q.querySelector(".qtext");
      var opts = qa(q, ".opt");
      var ans = parseInt(q.getAttribute("data-answer"), 10);
      if (!qt || opts.length < 2 || isNaN(ans) || ans < 0 || ans >= opts.length) return;
      var fb = q.querySelector(".feedback");
      var sec = q.closest ? q.closest("section[id]") : null;
      var h2 = sec ? sec.querySelector("h2") : null;
      var head = q.querySelector(".qhead strong");
      out.push({
        id: m.id + "#" + idx,
        mod: m.id,
        sec: sec ? sec.id : "",
        secTitle: h2 ? h2.textContent.replace(/^\s*\d+[.)]\s*/, "").trim() : "",
        label: head ? head.textContent.trim() : "",
        q: cleanHTML(qt),
        opts: opts.map(cleanHTML),
        ans: ans,
        expl: fb ? (fb.getAttribute("data-explain") || "") : ""
      });
    });
    return out;
  }

  function loadBank() {
    var jobs = P.modules.map(function (m) {
      return fetch(m.file).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      }).then(function (t) { return parseModule(m, t); })
        .catch(function () { return []; });
    });
    return Promise.all(jobs).then(function (lists) {
      bank = [];
      lists.forEach(function (l) { bank = bank.concat(l); });
      bank.forEach(function (b) { (byMod[b.mod] = byMod[b.mod] || []).push(b); });
    });
  }

  /* ---------- Préférences & historique ---------- */
  function defaults() {
    return { mods: P.modules.map(function (m) { return m.id; }), count: 10, perQ: 0,
      shuffleQ: true, shuffleA: true, instant: true, exam: false };
  }
  function loadPrefs() {
    var d = defaults(), p = P.read(KP, null);
    if (p && typeof p === "object") {
      if (Array.isArray(p.mods)) {
        var ok = p.mods.filter(function (id) { return byMod[id]; });
        if (ok.length) d.mods = ok;
      }
      if (COUNTS.indexOf(p.count) >= 0) d.count = p.count;
      if (PERQ.indexOf(p.perQ) >= 0) d.perQ = p.perQ;
      ["shuffleQ", "shuffleA", "instant", "exam"].forEach(function (k) { if (typeof p[k] === "boolean") d[k] = p[k]; });
    }
    var m = (location.search.match(/[?&]m=([\w-]+)/) || [])[1];
    if (m && byMod[m]) d.mods = [m];
    if (d.exam) d.instant = false;
    return d;
  }
  function savePrefs() { P.write(KP, cfg); }
  function getHistory() { var h = P.read(KH, []); return Array.isArray(h) ? h : []; }

  function weakModules() {
    var st = {};
    var a = P.read(P.K.activity, []);
    if (!Array.isArray(a)) a = [];
    a.forEach(function (e) {
      if (e && e.k === "quiz" && e.m && byMod[e.m]) {
        var s = st[e.m] || (st[e.m] = { ok: 0, ko: 0 });
        if (e.ok) s.ok++; else s.ko++;
      }
    });
    return Object.keys(st).filter(function (id) { return st[id].ko > 0; })
      .sort(function (a, b) {
        var ra = st[a].ko / (st[a].ko + st[a].ok), rb = st[b].ko / (st[b].ko + st[b].ok);
        return rb - ra || st[b].ko - st[a].ko;
      }).slice(0, 3);
  }

  /* ---------- Écran de configuration ---------- */
  function sparkline(vals) {
    if (!vals.length) return "";
    var w = 220, h = 56, pad = 7, pts = [];
    vals.forEach(function (v, i) {
      var x = vals.length > 1 ? pad + i * (w - 2 * pad) / (vals.length - 1) : w / 2;
      var y = h - pad - Math.max(0, Math.min(100, v)) / 100 * (h - 2 * pad);
      pts.push([x.toFixed(1), y.toFixed(1)]);
    });
    var line = vals.length > 1 ? '<polyline fill="none" stroke="var(--primary)" stroke-width="2" stroke-linejoin="round" points="' +
      pts.map(function (p) { return p.join(","); }).join(" ") + '"/>' : "";
    var dots = pts.map(function (p, i) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === pts.length - 1 ? 4 : 2.5) + '" fill="var(--primary)"/>';
    }).join("");
    return '<svg class="ex-spark" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Évolution des scores : ' +
      vals.join(" %, ") + ' %" preserveAspectRatio="xMidYMid meet">' +
      '<line x1="0" x2="' + w + '" y1="' + (h - pad - 0.7 * (h - 2 * pad)) + '" y2="' + (h - pad - 0.7 * (h - 2 * pad)) +
      '" stroke="var(--border)" stroke-dasharray="3 3"/>' + line + dots + "</svg>";
  }

  function historyHTML(limit) {
    var hist = getHistory();
    if (!hist.length) return "";
    var rows = hist.slice(-limit).reverse().map(function (e) {
      var d = new Date(e.t);
      return '<li><span>' + String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") +
        '</span><strong>' + e.ok + "/" + e.n + "</strong><span>" + e.pct + " %</span><span>" + fmt(e.secs) +
        '</span><span class="ex-muted">' + esc(e.mode || "") + "</span></li>";
    }).join("");
    return '<div class="ex-panel"><h2>📈 Mes dernières sessions</h2>' +
      sparkline(hist.map(function (e) { return e.pct; })) +
      '<ul class="ex-hist">' + rows + "</ul>" +
      '<p class="ex-hint">Ligne pointillée = 70 %. ' + hist.length + " session(s) mémorisée(s) sur cet appareil.</p></div>";
  }

  function renderConfig() {
    var h = "";
    h += '<div class="ex-panel"><h2>⚡ Préréglages</h2><div class="ex-chips" role="group" aria-label="Préréglages">' +
      '<button type="button" class="ex-chip-btn" data-preset="y1">📘 Année 1</button>' +
      '<button type="button" class="ex-chip-btn" data-preset="y2">🩺 Année 2</button>' +
      '<button type="button" class="ex-chip-btn" data-preset="full">🎓 Examen complet</button>' +
      '<button type="button" class="ex-chip-btn" data-preset="weak">🎯 Points faibles</button></div>' +
      '<p class="ex-hint" id="ex-presethint">Choisis un préréglage ou règle tout à la main ci-dessous.</p></div>';

    h += '<div class="ex-panel"><h2>📚 Modules</h2>';
    P.years.forEach(function (y) {
      h += '<div class="ex-year" role="group" aria-label="' + esc(y.label) + '"><div class="ex-yhead"><strong>' + esc(y.label.split("—")[0].trim()) +
        '</strong><span><button type="button" class="ex-mini" data-ysel="' + y.id + '" data-v="1">Tout</button>' +
        '<button type="button" class="ex-mini" data-ysel="' + y.id + '" data-v="0">Rien</button></span></div><div class="ex-checks">';
      P.modules.filter(function (m) { return m.year === y.id; }).forEach(function (m) {
        var n = (byMod[m.id] || []).length;
        h += '<label class="ex-check"><input type="checkbox" name="mod" value="' + m.id + '" data-y="' + y.id + '"' + (n ? "" : " disabled") + '>' +
          '<span><span class="ex-ce">' + (m.emoji || "") + '</span> ' + esc(m.title) + ' <em>(' + n + ' q.)</em></span></label>';
      });
      h += "</div></div>";
    });
    h += '<div class="ex-row"><button type="button" class="ex-mini" data-all="1">Tout cocher</button><button type="button" class="ex-mini" data-all="0">Tout décocher</button></div></div>';

    h += '<div class="ex-panel"><h2>🔢 Questions &amp; durée</h2><div class="ex-grid2">' +
      '<div role="radiogroup" aria-label="Nombre de questions"><div class="ex-lbl">Nombre de questions</div><div class="ex-radios">' +
      COUNTS.map(function (c) {
        return '<label class="ex-radio"><input type="radio" name="count" value="' + c + '"><span>' + (c || "Toutes") + "</span></label>";
      }).join("") + '</div></div>' +
      '<div><label class="ex-lbl" for="ex-perq">Durée (compte à rebours)</label><select id="ex-perq" class="ex-select">' +
      PERQ.map(function (v) {
        var t = v === 0 ? "Libre (chronomètre seul)" : v === 60 ? "1 min / question" : v < 60 ? v + " s / question" : Math.floor(v / 60) + " min " + (v % 60 ? v % 60 + " s " : "") + "/ question";
        return '<option value="' + v + '">' + t + "</option>";
      }).join("") + "</select></div></div></div>";

    h += '<div class="ex-panel"><h2>⚙️ Options</h2><div class="ex-checks">' +
      '<label class="ex-check"><input type="checkbox" name="shuffleQ"><span>🔀 Mélanger l\'ordre des questions</span></label>' +
      '<label class="ex-check"><input type="checkbox" name="shuffleA"><span>🔀 Mélanger l\'ordre des réponses</span></label>' +
      '<label class="ex-check"><input type="checkbox" name="instant"><span>💡 Explication immédiate après chaque réponse</span></label>' +
      '<label class="ex-check"><input type="checkbox" name="exam"><span>🎓 Mode examen : correction seulement à la fin</span></label></div></div>';

    h += '<div class="ex-panel ex-startbox"><div id="ex-summary" class="ex-summary" aria-live="polite"></div>' +
      '<button type="button" class="btn primary ex-start" id="ex-start">▶ Démarrer la session</button></div>';

    h += historyHTML(5);
    $("ex-config").innerHTML = h;
    syncForm();
  }

  function syncForm() {
    var f = $("ex-config");
    qa(f, 'input[name="mod"]').forEach(function (i) { i.checked = cfg.mods.indexOf(i.value) >= 0; });
    qa(f, 'input[name="count"]').forEach(function (i) { i.checked = +i.value === cfg.count; });
    f.querySelector("#ex-perq").value = String(cfg.perQ);
    ["shuffleQ", "shuffleA", "instant", "exam"].forEach(function (k) { f.querySelector('input[name="' + k + '"]').checked = !!cfg[k]; });
    f.querySelector('input[name="instant"]').disabled = !!cfg.exam;
    updateSummary();
  }

  function readForm() {
    var f = $("ex-config");
    cfg.mods = qa(f, 'input[name="mod"]:checked').map(function (i) { return i.value; });
    var c = f.querySelector('input[name="count"]:checked');
    cfg.count = c ? +c.value : 10;
    cfg.perQ = +f.querySelector("#ex-perq").value;
    ["shuffleQ", "shuffleA", "instant", "exam"].forEach(function (k) { cfg[k] = f.querySelector('input[name="' + k + '"]').checked; });
    if (cfg.exam) cfg.instant = false;
    f.querySelector('input[name="instant"]').checked = !!cfg.instant;
    f.querySelector('input[name="instant"]').disabled = !!cfg.exam;
    savePrefs();
    updateSummary();
  }

  function pool() {
    var l = [];
    cfg.mods.forEach(function (id) { l = l.concat(byMod[id] || []); });
    return l;
  }
  function updateSummary() {
    var avail = pool().length;
    var n = cfg.count > 0 ? Math.min(cfg.count, avail) : avail;
    var d = cfg.perQ ? "⏱ " + fmt(n * cfg.perQ) + " (compte à rebours)" : "⏱ durée libre";
    $("ex-summary").innerHTML = n
      ? "<strong>" + n + " question" + (n > 1 ? "s" : "") + "</strong> sur " + avail + " disponibles · " + cfg.mods.length + " module" + (cfg.mods.length > 1 ? "s" : "") + " · " + d
      : "⚠️ Coche au moins un module contenant des questions.";
    $("ex-start").disabled = !n;
  }

  function preset(name) {
    var all = P.modules.map(function (m) { return m.id; });
    var hint = "";
    if (name === "y1" || name === "y2") {
      var y = name === "y1" ? 1 : 2;
      cfg.mods = P.modules.filter(function (m) { return m.year === y; }).map(function (m) { return m.id; });
      cfg.count = 20; cfg.perQ = 0; cfg.exam = false; cfg.instant = true;
      hint = "Année " + y + " : 20 questions mélangées, explication immédiate.";
    } else if (name === "full") {
      cfg.mods = all; cfg.count = 0; cfg.perQ = 60; cfg.exam = true; cfg.instant = false;
      cfg.shuffleQ = true; cfg.shuffleA = true;
      hint = "Examen complet : toutes les questions, 1 min par question, correction à la fin.";
    } else if (name === "weak") {
      var w = weakModules();
      if (!w.length) {
        $("ex-presethint").textContent = "Pas encore assez de données : fais quelques quiz (modules ou sessions) pour repérer tes points faibles.";
        return;
      }
      cfg.mods = w; cfg.count = 20; cfg.perQ = 0; cfg.exam = false; cfg.instant = true;
      hint = "Points faibles repérés : " + w.map(modShort).join(", ") + ".";
    }
    cfg.mods = cfg.mods.filter(function (id) { return byMod[id]; });
    savePrefs();
    syncForm();
    $("ex-presethint").textContent = "✔ " + hint;
  }

  /* ---------- Session ---------- */
  function buildItems(list, c) {
    var l = list.slice();
    if (c.count > 0 && c.count < l.length) {
      shuffle(l);
      l = l.slice(0, c.count);
      if (!c.shuffleQ) l.sort(function (a, b) { return bank.indexOf(a) - bank.indexOf(b); });
    } else if (c.shuffleQ) shuffle(l);
    return l.map(function (b) {
      var order = b.opts.map(function (_, i) { return i; });
      if (c.shuffleA) shuffle(order);
      return { b: b, order: order, ans: order.indexOf(b.ans), sel: -1, flag: false };
    });
  }

  function startSession(items, c) {
    S = {
      items: items, cfg: { shuffleQ: c.shuffleQ, shuffleA: c.shuffleA, instant: c.instant && !c.exam, exam: !!c.exam, perQ: c.perQ, count: c.count },
      cur: 0, acc: 0, ts: Date.now(), paused: false, done: false
    };
    S.limit = c.perQ ? c.perQ * items.length : 0;
    window.addEventListener("beforeunload", onLeave);
    show("run");
    setBarTop();
    buildRun();
    paintAll();
    clearInterval(timer);
    timer = setInterval(tick, 250);
    window.scrollTo(0, 0);
  }

  function setBarTop() {
    var t = document.querySelector(".topbar");
    document.documentElement.style.setProperty("--ex-top", (t ? Math.round(t.getBoundingClientRect().height) - 1 : 0) + "px");
  }
  window.addEventListener("resize", setBarTop);

  function elapsed() { return S ? S.acc + (S.paused ? 0 : Date.now() - S.ts) : 0; }
  function onLeave(e) {
    if (S && !S.done) { e.preventDefault(); e.returnValue = "Une session est en cours : tes réponses seront perdues."; return e.returnValue; }
  }

  function tick() {
    if (!S || S.done) return;
    var el = $("ex-timer");
    var s = elapsed() / 1000;
    if (S.limit) {
      var left = S.limit - s;
      el.textContent = "⏱ " + fmt(left);
      el.classList.toggle("is-low", left <= 60);
      if (left <= 0) { finish(true); }
    } else el.textContent = "⏱ " + fmt(s);
  }

  function buildRun() {
    var n = S.items.length;
    $("ex-run").innerHTML =
      '<div class="ex-bar"><div class="ex-bar-top"><span id="ex-count" class="ex-count"></span>' +
      '<span id="ex-timer" class="ex-timer" role="timer" aria-label="Chronomètre">⏱ 00:00</span>' +
      '<button type="button" class="btn ex-pause" id="ex-pause" aria-pressed="false" aria-label="Pause">⏸<span class="ex-pl"> Pause</span></button></div>' +
      '<div class="ex-prog" id="ex-prog" role="progressbar" aria-label="Questions répondues" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="0"><i></i></div></div>' +
      '<div id="ex-pausebox" class="ex-panel ex-pausebox" hidden><p>⏸ Session en pause — le chronomètre est arrêté et les questions sont masquées.</p>' +
      '<button type="button" class="btn primary ex-big" id="ex-resume">▶ Reprendre</button></div>' +
      '<div id="ex-body"><article id="ex-card" class="ex-card" tabindex="-1"></article>' +
      '<div class="ex-nav" role="group" aria-label="Navigation entre les questions">' +
      '<button type="button" class="btn ex-navbtn" id="ex-prev">← Précédente</button>' +
      '<button type="button" class="btn ex-navbtn" id="ex-flag" aria-pressed="false">🚩 À revoir</button>' +
      '<button type="button" class="btn primary ex-navbtn" id="ex-next">Suivante →</button></div>' +
      '<div class="ex-panel"><h2 class="ex-h2s" id="ex-gridtitle">🧭 Navigation</h2><div id="ex-grid" class="ex-gridnav" role="group" aria-labelledby="ex-gridtitle"></div>' +
      '<div class="ex-legend"><span><i class="lg-a"></i>répondue</span><span><i class="lg-f"></i>à revoir</span><span><i class="lg-c"></i>en cours</span></div></div>' +
      '<div class="ex-foot"><button type="button" class="btn ex-navbtn" id="ex-abandon">✖ Abandonner</button>' +
      '<button type="button" class="btn primary ex-navbtn" id="ex-finish">🏁 Terminer</button></div></div>';
    var g = "";
    for (var i = 0; i < n; i++) g += '<button type="button" class="ex-gbtn" data-go="' + i + '">' + (i + 1) + "</button>";
    $("ex-grid").innerHTML = g;
  }

  function secLink(b) { return "modules/" + b.mod + ".html" + (b.sec ? "#" + b.sec : ""); }

  function paintCard() {
    var it = S.items[S.cur], b = it.b, locked = S.cfg.instant && it.sel >= 0;
    var h = '<div class="ex-qmeta"><span class="ex-chip">' + esc(modLabel(b.mod)) + "</span>" +
      (b.label ? '<span class="ex-qlab">' + esc(b.label) + "</span>" : "") +
      (it.flag ? '<span class="ex-flagged">🚩 À revoir</span>' : "") + "</div>" +
      '<h2 class="ex-qtext" id="ex-qtext">' + b.q + "</h2>" +
      '<div class="ex-opts" role="radiogroup" aria-labelledby="ex-qtext">';
    it.order.forEach(function (oi, j) {
      var cls = "ex-opt", state = "";
      if (j === it.sel) cls += " sel";
      if (locked) {
        if (j === it.ans) { cls += " correct"; state = " — bonne réponse"; }
        else if (j === it.sel) { cls += " wrong"; state = " — réponse fausse"; }
      }
      h += '<button type="button" class="' + cls + '" role="radio" aria-checked="' + (j === it.sel) + '" data-opt="' + j + '"' + (locked ? ' aria-disabled="true"' : "") +
        '><span class="ex-key" aria-hidden="true">' + (j + 1) + '</span><span class="ex-otext">' + b.opts[oi] +
        '<span class="sr-only">' + state + "</span></span></button>";
    });
    h += '</div><div class="ex-fb" id="ex-fb" aria-live="polite">';
    if (locked) {
      var ok = it.sel === it.ans;
      h += '<div class="ex-fbbox ' + (ok ? "ok" : "ko") + '"><strong>' + (ok ? "✅ Bonne réponse !" : "❌ Raté — bonne réponse : « " + stripTags(b.opts[b.ans]) + " »") + "</strong>" +
        (b.expl ? "<p>💡 " + esc(b.expl) + "</p>" : "") +
        '<a href="' + secLink(b) + '">📖 Revoir la section' + (b.secTitle ? " « " + esc(b.secTitle) + " »" : "") + "</a></div>";
    }
    h += "</div>";
    $("ex-card").innerHTML = h;
  }

  function stripTags(html) { var d = document.createElement("div"); d.innerHTML = html; return esc(d.textContent); }

  function counts() {
    var a = 0, f = 0;
    S.items.forEach(function (it) { if (it.sel >= 0) a++; if (it.flag) f++; });
    return { a: a, f: f };
  }

  function paintBar() {
    var c = counts(), n = S.items.length;
    $("ex-count").textContent = "Question " + (S.cur + 1) + " / " + n;
    var p = $("ex-prog");
    p.setAttribute("aria-valuenow", c.a);
    p.setAttribute("aria-valuetext", c.a + " question" + (c.a > 1 ? "s" : "") + " répondue" + (c.a > 1 ? "s" : "") + " sur " + n);
    p.firstChild.style.width = (n ? c.a / n * 100 : 0) + "%";
    qa($("ex-grid"), ".ex-gbtn").forEach(function (b, i) {
      var it = S.items[i];
      b.className = "ex-gbtn" + (it.sel >= 0 ? " answered" : "") + (it.flag ? " flagged" : "") + (i === S.cur ? " current" : "");
      b.setAttribute("aria-label", "Question " + (i + 1) + (it.sel >= 0 ? ", répondue" : ", sans réponse") + (it.flag ? ", à revoir" : ""));
      if (i === S.cur) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    var fl = $("ex-flag");
    fl.setAttribute("aria-pressed", S.items[S.cur].flag);
    fl.classList.toggle("on", S.items[S.cur].flag);
    $("ex-prev").disabled = S.cur === 0;
    var last = S.cur === n - 1;
    $("ex-next").textContent = last ? "Fin 🏁" : "Suivante →";
  }
  function paintAll() { paintCard(); paintBar(); tick(); }

  function go(i, focus) {
    if (!S || S.paused || i < 0 || i >= S.items.length) return;
    S.cur = i;
    paintAll();
    var r = $("ex-run").getBoundingClientRect();
    if (r.top < 0) window.scrollTo(0, window.pageYOffset + r.top - 70);
    if (focus) $("ex-card").focus({ preventScroll: true });
    say("Question " + (i + 1) + " sur " + S.items.length);
  }

  function choose(j) {
    if (!S || S.paused || S.done) return;
    var it = S.items[S.cur];
    if (j < 0 || j >= it.order.length) return;
    if (S.cfg.instant && it.sel >= 0) return;
    it.sel = j;
    paintCard();
    paintBar();
    var btn = $("ex-card").querySelector('[data-opt="' + j + '"]');
    if (btn && !S.cfg.instant) btn.focus({ preventScroll: true });
    if (S.cfg.instant) say(j === it.ans ? "Bonne réponse" : "Réponse fausse");
    else say("Réponse " + (j + 1) + " enregistrée");
  }

  function togglePause() {
    if (!S || S.done) return;
    if (S.paused) { S.paused = false; S.ts = Date.now(); }
    else { S.acc += Date.now() - S.ts; S.paused = true; }
    $("ex-pausebox").hidden = !S.paused;
    $("ex-body").hidden = S.paused;
    var b = $("ex-pause");
    b.innerHTML = (S.paused ? "▶" : "⏸") + '<span class="ex-pl"> ' + (S.paused ? "Reprendre" : "Pause") + "</span>";
    b.setAttribute("aria-label", S.paused ? "Reprendre" : "Pause");
    b.setAttribute("aria-pressed", S.paused);
    say(S.paused ? "Session en pause" : "Session reprise");
  }

  function abandon() {
    if (!S || S.done) return;
    if (!window.confirm("Abandonner la session en cours ? Tes réponses seront perdues.")) return;
    endSession();
    show("config");
    renderConfig();
  }

  function endSession() {
    clearInterval(timer);
    window.removeEventListener("beforeunload", onLeave);
    if (S) S.done = true;
  }

  function tryFinish() {
    if (!S || S.done) return;
    var c = counts(), n = S.items.length, msg = "";
    if (c.a < n) msg = (n - c.a) + " question(s) sans réponse (comptées fausses). ";
    if (window.confirm(msg + "Terminer la session et voir la correction ?")) finish(false);
  }

  /* ---------- Résultats ---------- */
  function finish(timeUp) {
    if (!S || S.done) return;
    var secs = Math.round(elapsed() / 1000);
    if (timeUp && S.limit) secs = Math.min(secs, S.limit);
    endSession();
    var byM = {}, ok = 0, blank = 0;
    S.items.forEach(function (it) {
      var m = byM[it.b.mod] || (byM[it.b.mod] = { ok: 0, n: 0 });
      m.n++;
      if (it.sel < 0) { blank++; return; }
      var good = it.sel === it.ans;
      if (good) { ok++; m.ok++; }
      P.logActivity({ k: "quiz", m: it.b.mod, ok: good, src: "examen" });
    });
    var n = S.items.length;
    R = { items: S.items, cfg: S.cfg, n: n, ok: ok, blank: blank, wrong: n - ok - blank, secs: secs,
      pct: n ? Math.round(ok / n * 100) : 0, byM: byM, timeUp: !!timeUp, t: Date.now() };
    var hist = getHistory();
    hist.push({ t: R.t, n: n, ok: ok, pct: R.pct, secs: secs, mode: modeLabel(S.cfg), mods: Object.keys(byM) });
    P.write(KH, hist.slice(-20));
    P.updateStreak();
    P.recordActiveDay();
    show("result");
    renderResult();
    window.scrollTo(0, 0);
  }

  function modeLabel(c) { return c.exam ? "Examen" : c.instant ? "Entraînement" : "Correction finale"; }
  function mention(p) {
    return p >= 90 ? "🏆 Excellent !" : p >= 75 ? "🎉 Très bien" : p >= 60 ? "👍 Bien" : p >= 50 ? "😐 Juste — à consolider" : "💪 À retravailler";
  }
  function lvl(p) { return p >= 70 ? "ok" : p >= 50 ? "mid" : "low"; }

  function renderResult() {
    var h = '<div class="ex-panel ex-scorebox"><div class="ex-score" role="status" aria-live="polite"><div class="ex-big-score">' + R.ok + " / " + R.n +
      '</div><div class="ex-pct ' + lvl(R.pct) + '">' + R.pct + ' %</div><div class="ex-mention">' + mention(R.pct) + "</div></div>" +
      '<ul class="ex-facts"><li>⏱ Temps : <strong>' + fmt(R.secs) + "</strong>" + (R.cfg.perQ ? " / " + fmt(R.cfg.perQ * R.n) : "") + "</li>" +
      "<li>✅ Justes : <strong>" + R.ok + "</strong></li><li>❌ Fausses : <strong>" + R.wrong + "</strong></li>" +
      (R.blank ? "<li>➖ Sans réponse : <strong>" + R.blank + "</strong></li>" : "") +
      "<li>🎓 Mode : <strong>" + modeLabel(R.cfg) + "</strong></li></ul>" +
      (R.timeUp ? '<p class="ex-timeup">⏰ Temps écoulé : la session a été terminée automatiquement.</p>' : "") +
      '<div class="ex-actions no-print">' +
      (R.wrong + R.blank > 0 ? '<button type="button" class="btn primary" id="ex-redo">🔁 Refaire les questions ratées (' + (R.wrong + R.blank) + ")</button>" : "") +
      '<button type="button" class="btn" id="ex-new">🆕 Nouvelle session</button>' +
      '<button type="button" class="btn" id="ex-print">🖨️ Imprimer / PDF</button>' +
      '<button type="button" class="btn" id="ex-copy">📋 Copier le résumé</button></div></div>';

    var ids = Object.keys(R.byM).sort(function (a, b) { return R.byM[a].ok / R.byM[a].n - R.byM[b].ok / R.byM[b].n; });
    h += '<div class="ex-panel"><h2>📊 Répartition par module</h2><div class="ex-bars">' + ids.map(function (id) {
      var m = R.byM[id], p = Math.round(m.ok / m.n * 100);
      return '<div class="ex-brow"><span class="ex-bl">' + esc(modShort(id)) + '</span><span class="ex-bv">' + m.ok + "/" + m.n + " · " + p + ' %</span>' +
        '<div class="ex-track" role="img" aria-label="' + esc(modShort(id)) + " : " + p + ' %"><i class="' + lvl(p) + '" style="width:' + p + '%"></i></div></div>';
    }).join("") + "</div></div>";

    var weak = ids.filter(function (id) { return R.byM[id].ok / R.byM[id].n < 0.7; });
    h += '<div class="ex-panel"><h2>🎯 Points faibles</h2>';
    if (weak.length) {
      h += '<ul class="ex-weak">' + weak.map(function (id) {
        var m = R.byM[id], secs = {};
        R.items.forEach(function (it) {
          if (it.b.mod === id && it.sel !== it.ans && it.b.secTitle) secs[it.b.sec + "|" + it.b.secTitle] = 1;
        });
        var sl = Object.keys(secs).map(function (k) {
          var p = k.split("|");
          return '<a href="modules/' + id + ".html#" + p[0] + '">' + esc(p[1]) + "</a>";
        }).join(" · ");
        return "<li><div><strong>" + esc(modLabel(id)) + '</strong> <span class="ex-muted">' + m.ok + "/" + m.n + "</span>" +
          (sl ? '<div class="ex-secs">Sections à relire : ' + sl + "</div>" : "") + '</div><div class="ex-wl no-print">' +
          '<a class="btn" href="modules/' + id + '.html">📖 Réviser</a><a class="btn" href="aide.html?m=' + id + '">⚡ Antisèche</a></div></li>';
      }).join("") + "</ul>";
    } else h += '<p class="ex-hint">Aucun module sous 70 % sur cette session. Continue comme ça ! 💚</p>';
    h += "</div>";

    var hist = getHistory();
    if (hist.length > 1) {
      h += '<div class="ex-panel"><h2>📈 Progression (dernières sessions)</h2>' + sparkline(hist.map(function (e) { return e.pct; })) +
        '<p class="ex-hint">Dernier point = cette session. Ligne pointillée = 70 %.</p></div>';
    }

    h += '<div class="ex-panel"><h2>📝 Correction détaillée</h2><div class="ex-filters no-print" role="group" aria-label="Filtrer la correction">' +
      '<button type="button" class="ex-mini on" data-f="all">Toutes (' + R.n + ")</button>" +
      '<button type="button" class="ex-mini" data-f="wrong">Erreurs (' + (R.wrong + R.blank) + ")</button>" +
      '<button type="button" class="ex-mini" data-f="flag">🚩 À revoir (' + R.items.filter(function (i) { return i.flag; }).length + ")</button></div>" +
      '<div class="ex-corr" id="ex-corr" data-f="all">' + R.items.map(corrItem).join("") + "</div></div>";
    $("ex-result").innerHTML = h;
  }

  function corrItem(it, i) {
    var b = it.b, st = it.sel < 0 ? "blank" : it.sel === it.ans ? "ok" : "wrong";
    var h = '<article class="ex-q is-' + st + (it.flag ? " is-flag" : "") + '"><header><span class="ex-qn">' + (i + 1) + '</span><span class="ex-chip">' + esc(modLabel(b.mod)) + "</span>" +
      '<span class="ex-st">' + (st === "ok" ? "✅ Juste" : st === "wrong" ? "❌ Faux" : "➖ Sans réponse") + "</span>" + (it.flag ? '<span class="ex-flagged">🚩</span>' : "") +
      '</header><div class="ex-qt">' + b.q + '</div><ul class="ex-ol">';
    it.order.forEach(function (oi, j) {
      var cls = j === it.ans ? "good" : j === it.sel ? "bad" : "";
      h += '<li class="' + cls + '">' + (j === it.ans ? '<span class="ex-tag">✔ Bonne réponse</span> ' : j === it.sel ? '<span class="ex-tag">✖ Ta réponse</span> ' : "") + b.opts[oi] + "</li>";
    });
    h += "</ul>" + (b.expl ? '<p class="ex-expl">💡 ' + esc(b.expl) + "</p>" : "") +
      '<a class="ex-seclink no-print" href="' + secLink(b) + '">📖 Revoir la section' + (b.secTitle ? " « " + esc(b.secTitle) + " »" : "") + "</a></article>";
    return h;
  }

  function summaryText() {
    var lines = ["Examen blanc — Préparateur en pharmacie", "Score : " + R.ok + "/" + R.n + " (" + R.pct + " %) en " + fmt(R.secs) + " · " + modeLabel(R.cfg)];
    Object.keys(R.byM).forEach(function (id) {
      lines.push("• " + stripToText(modLabel(id)) + " : " + R.byM[id].ok + "/" + R.byM[id].n);
    });
    var weak = Object.keys(R.byM).filter(function (id) { return R.byM[id].ok / R.byM[id].n < 0.7; });
    if (weak.length) lines.push("À réviser : " + weak.map(function (id) { return mod(id) ? mod(id).title : id; }).join(", "));
    return lines.join("\n");
  }
  function stripToText(s) { return String(s).replace(/\s+/g, " ").trim(); }

  function copy(text, btn) {
    var done = function (ok) {
      var old = btn.textContent;
      btn.textContent = ok ? "✅ Copié !" : "⚠️ Copie impossible";
      say(ok ? "Résumé copié" : "Copie impossible");
      setTimeout(function () { btn.textContent = old; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;opacity:0;font-size:16px";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      done(ok);
    }
  }

  /* ---------- Navigation d'écrans & événements ---------- */
  function show(which) {
    ["loading", "error", "config", "run", "result"].forEach(function (k) { $("ex-" + k).hidden = k !== which; });
    document.body.setAttribute("data-screen", which);
  }

  function showError() {
    var file = location.protocol === "file:";
    $("ex-error").innerHTML = "<h2>⚠️ Questions indisponibles</h2><p>" +
      (file
        ? "Cette page lit les questions directement dans les modules, ce que ton navigateur bloque quand le site est ouvert en <code>file://</code>. <strong>Ouvre le portail via GitHub Pages ou un serveur local</strong> (par exemple <code>py -m http.server</code> dans le dossier du portail, puis <code>http://localhost:8000/examen.html</code>)."
        : "Impossible de charger les modules du cours. Vérifie ta connexion (ou que le portail est bien en cache hors-ligne) puis recharge la page.") +
      '</p><p><a class="btn" href="index.html">← Retour à l\'accueil</a></p>';
    show("error");
  }

  function bind() {
    var cf = $("ex-config");
    cf.addEventListener("change", readForm);
    cf.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("button") : null;
      if (!t) return;
      if (t.id === "ex-start") {
        readForm();
        var items = buildItems(pool(), cfg);
        if (items.length) startSession(items, cfg);
      } else if (t.hasAttribute("data-preset")) preset(t.getAttribute("data-preset"));
      else if (t.hasAttribute("data-ysel")) {
        var y = t.getAttribute("data-ysel"), v = t.getAttribute("data-v") === "1";
        qa(cf, 'input[name="mod"][data-y="' + y + '"]').forEach(function (i) { if (!i.disabled) i.checked = v; });
        readForm();
      } else if (t.hasAttribute("data-all")) {
        var all = t.getAttribute("data-all") === "1";
        qa(cf, 'input[name="mod"]').forEach(function (i) { if (!i.disabled) i.checked = all; });
        readForm();
      }
    });

    var run = $("ex-run");
    run.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("button") : null;
      if (!t) return;
      if (t.hasAttribute("data-opt")) choose(+t.getAttribute("data-opt"));
      else if (t.hasAttribute("data-go")) go(+t.getAttribute("data-go"), true);
      else if (t.id === "ex-prev") go(S.cur - 1, true);
      else if (t.id === "ex-next") { if (S.cur === S.items.length - 1) tryFinish(); else go(S.cur + 1, true); }
      else if (t.id === "ex-flag") { S.items[S.cur].flag = !S.items[S.cur].flag; paintCard(); paintBar(); }
      else if (t.id === "ex-pause" || t.id === "ex-resume") togglePause();
      else if (t.id === "ex-abandon") abandon();
      else if (t.id === "ex-finish") tryFinish();
    });

    $("ex-result").addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("button") : null;
      if (!t) return;
      if (t.id === "ex-new") { show("config"); renderConfig(); window.scrollTo(0, 0); }
      else if (t.id === "ex-print") window.print();
      else if (t.id === "ex-copy") copy(summaryText(), t);
      else if (t.id === "ex-redo") {
        var missed = R.items.filter(function (it) { return it.sel !== it.ans; }).map(function (it) { return it.b; });
        var c = { shuffleQ: R.cfg.shuffleQ, shuffleA: R.cfg.shuffleA, instant: R.cfg.instant, exam: R.cfg.exam, perQ: R.cfg.perQ, count: 0 };
        startSession(buildItems(missed, c), c);
      } else if (t.hasAttribute("data-f")) {
        $("ex-corr").setAttribute("data-f", t.getAttribute("data-f"));
        qa($("ex-result"), ".ex-filters .ex-mini").forEach(function (b) { b.classList.toggle("on", b === t); });
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!S || S.done || e.ctrlKey || e.metaKey || e.altKey) return;
      var tg = e.target, tag = tg && tg.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (tg && tg.isContentEditable)) return;
      var k = e.key;
      if (/^[1-9]$/.test(k)) { choose(+k - 1); e.preventDefault(); }
      else if (k === "ArrowLeft") { go(S.cur - 1, false); e.preventDefault(); }
      else if (k === "ArrowRight") { go(S.cur + 1, false); e.preventDefault(); }
      else if (k === "Enter" && tag !== "BUTTON" && tag !== "A" && tag !== "SUMMARY") {
        if (S.paused) togglePause();
        else if (S.cur < S.items.length - 1) go(S.cur + 1, false);
        else tryFinish();
        e.preventDefault();
      } else if (k === "r" || k === "R") { if (!S.paused) { S.items[S.cur].flag = !S.items[S.cur].flag; paintCard(); paintBar(); } }
      else if (k === "p" || k === "P") togglePause();
    });
  }

  /* ---------- Démarrage ---------- */
  show("loading");
  loadBank().then(function () {
    if (!bank.length) { showError(); return; }
    cfg = loadPrefs();
    bind();
    renderConfig();
    show("config");
  });
})();
