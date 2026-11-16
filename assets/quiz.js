/* =========================================================
   quiz.js — Quiz adaptatif (banque construite automatiquement)
   1. Aspire TOUS les quiz du site : modules Markdown (cours.js),
      antisèches, pages codées (index de recherche) et pages « extra ».
   2. Génère des questions depuis le Markdown : glossaire [[terme|déf]],
      définitions (::: def, « **Terme** : définition », tableaux à 2
      colonnes) et cartes à trous ==…==.
   3. Choisit les questions selon tes erreurs (pondération adaptative)
      et repropose les ratées dans la même série.
   Stats par question : localStorage « esgi-qstats ».
   ========================================================= */
(function () {
  "use strict";

  var QSTATS_KEY = "esgi-qstats", ACT_KEY = "esgi-activity", PREF_KEY = "esgi-quiz-prefs";
  var root = document.getElementById("qz-root");
  if (!root) return;

  /* ---------- Utilitaires ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function norm(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function load(key, def) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? def : v; } catch (e) { return def; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function subjects() { return (window.COURS && Array.isArray(window.COURS.subjects)) ? window.COURS.subjects : []; }
  function subjectByCode(c) { return subjects().find(function (s) { return s.code === c; }) || null; }
  function subjectByName(n) { return subjects().find(function (s) { return s.name === n; }) || null; }
  function qs(name) { return new URLSearchParams(location.search).get(name); }

  function logActivity(entry) {
    var l = load(ACT_KEY, []);
    if (!Array.isArray(l)) l = [];
    entry.t = Date.now();
    l.push(entry);
    if (l.length > 600) l = l.slice(l.length - 600);
    save(ACT_KEY, l);
  }
  function weakCodes() {
    var by = {};
    load(ACT_KEY, []).forEach(function (e) {
      if (!e || e.k !== "quiz") return;
      var c = e.c || "?";
      if (!by[c]) by[c] = { ok: 0, t: 0 };
      by[c].t++; if (e.ok) by[c].ok++;
    });
    var out = {};
    Object.keys(by).forEach(function (c) { if (by[c].t >= 4 && by[c].ok / by[c].t < 0.7) out[c] = true; });
    return out;
  }

  /* ---------- Sources de questions ---------- */
  function listSources() {
    var out = [], seen = {};
    function add(s) { if (!s.url || seen[s.url]) return; seen[s.url] = 1; out.push(s); }
    subjects().forEach(function (s) {
      (s.modules || []).forEach(function (m) {
        add({ c: s.code, type: "md", url: m.file, title: m.title, href: "cours.html?c=" + encodeURIComponent(s.code) + "&m=" + encodeURIComponent(m.id) });
      });
      if (s.aide) add({ c: s.code, type: "md", url: s.aide, title: "Antisèche " + s.name, href: "aide.html?c=" + encodeURIComponent(s.code) });
      (s.extra || []).forEach(function (e) {
        if (/^matieres\/.+\.html$/.test(e.href || "")) add({ c: s.code, type: "html", url: e.href, title: e.label, href: e.href });
      });
    });
    (window.SEARCH_INDEX || []).forEach(function (e) {
      if (e.type !== "module" || !/\.html$/.test(e.u || "")) return;
      var s = subjectByName(e.s);
      if (s) add({ c: s.code, type: "html", url: e.u, title: e.t, href: e.u });
    });
    return out;
  }

  function sectionNode(node) {
    var n = node;
    while (n && n.nodeType === 1) {
      var p = n.previousElementSibling;
      while (p) {
        if (/^H[23]$/.test(p.tagName) && p.id) return p;
        p = p.previousElementSibling;
      }
      n = n.parentElement;
      if (n && n.tagName === "SECTION" && n.id) return n;
    }
    return null;
  }
  function sectionId(node) { var s = sectionNode(node); return s ? s.id : ""; }
  function sectionTitle(node) {
    var s = sectionNode(node);
    if (!s) return "";
    var h = /^H[23]$/.test(s.tagName) ? s : s.querySelector("h2, h3");
    return h ? norm(h.textContent).replace(/^[\d.]+\s*/, "") : "";
  }

  // Quiz rédigés (même structure HTML pour le Markdown rendu et les pages codées)
  function extractQuizzes(doc, src, bank) {
    doc.querySelectorAll(".quiz").forEach(function (qz) {
      var a = parseInt(qz.getAttribute("data-answer") != null ? qz.getAttribute("data-answer") : qz.getAttribute("data-a"), 10);
      var qt = qz.querySelector(".qtext, .q");
      var opts = Array.prototype.map.call(qz.querySelectorAll(".opt"), function (o) { return o.innerHTML.trim(); });
      var fb = qz.querySelector(".feedback, .fb");
      var ex = fb ? (fb.getAttribute("data-explain") || fb.getAttribute("data-ex") || "") : "";
      if (!qt || opts.length < 2 || !(a >= 0 && a < opts.length)) return;
      var qhtml = qt.innerHTML.replace(/^\s*❓\s*/, "").trim();
      var id = src.c + ":" + hash(norm(qt.textContent) + "|" + opts.join("|"));
      var sec = sectionId(qz);
      bank.push({ id: id, c: src.c, kind: "quiz", q: qhtml, opts: opts, a: a, ex: ex,
        src: src.title, sec: sectionTitle(qz), href: src.href + (sec && src.href.indexOf("#") === -1 ? "#" + sec : "") });
    });
  }

  // Paires terme / définition + trous, depuis le Markdown rendu
  function extractPairs(doc, src, pairs, clozes) {
    function addPair(term, def, node, extra) {
      term = norm(term).replace(/[:：]\s*$/, ""); def = norm(def);
      if (term.length < 2 || term.length > 60 || def.length < 12 || def.length > 240) return;
      if (def.toLowerCase().indexOf(term.toLowerCase()) === 0) return;
      var ctx = node ? sectionTitle(node) : "";
      if (extra) ctx = ctx ? ctx + " · " + extra : extra;
      pairs.push({ c: src.c, term: term, def: def, ctx: ctx, sec: node ? sectionTitle(node) : "", src: src.title, href: src.href + (node ? (sectionId(node) ? "#" + sectionId(node) : "") : "") });
    }
    doc.querySelectorAll(".gloss").forEach(function (g) {
      var pop = g.querySelector(".gloss-pop");
      var term = g.firstChild ? g.firstChild.textContent : "";
      addPair(term, g.getAttribute("data-def") || (pop ? pop.textContent : ""), g);
    });
    doc.querySelectorAll(".gloss-pop").forEach(function (p) { p.remove(); });
    doc.querySelectorAll(".callout.def").forEach(function (c) {
      var lab = c.querySelector(".label");
      var title = lab ? norm(lab.textContent).replace(/^\S+\s+/, "") : "";
      var body = c.cloneNode(true);
      var l2 = body.querySelector(".label"); if (l2) l2.remove();
      if (!title || /^définition$/i.test(title)) {
        var st = body.querySelector("strong");
        if (!st) return;
        title = st.textContent;
      }
      var text = norm(body.textContent);
      if (text.length > 240) { var cut = text.slice(0, 240).lastIndexOf(". "); if (cut < 40) return; text = text.slice(0, cut + 1); }
      addPair(title, text, c);
    });
    doc.querySelectorAll("li").forEach(function (li) {
      if (li.closest(".quiz, .exo, .culture, .jobs")) return;
      var first = li.firstChild;
      while (first && first.nodeType === 3 && !first.textContent.trim()) first = first.nextSibling;
      if (!first || first.nodeType !== 1 || first.tagName !== "STRONG") return;
      var clone = li.cloneNode(true);
      clone.querySelectorAll("ul, ol").forEach(function (x) { x.remove(); });
      var rest = norm(clone.textContent).slice(norm(first.textContent).length);
      var m = /^\s*(?::|—|–|-|→|=>|=)\s*(.+)$/.exec(rest);
      if (m) addPair(first.textContent, m[1], li);
    });
    doc.querySelectorAll("table").forEach(function (t) {
      var heads = t.querySelectorAll("thead th");
      if (heads.length !== 2) return;
      var cols = norm(heads[0].textContent) + " → " + norm(heads[1].textContent);
      t.querySelectorAll("tbody tr").forEach(function (tr) {
        var td = tr.querySelectorAll("td");
        if (td.length === 2) addPair(td[0].textContent, td[1].textContent, t, cols);
      });
    });
    doc.querySelectorAll(".cloze").forEach(function (cz) {
      var ctx = cz.closest("p, li, td");
      if (!ctx || cz.closest(".quiz")) return;
      var ans = norm(cz.textContent);
      if (!ans || ans.length > 60) return;
      var all = Array.prototype.slice.call(ctx.querySelectorAll(".cloze"));
      var idx = all.indexOf(cz);
      var clone = ctx.cloneNode(true);
      clone.querySelectorAll("ul, ol").forEach(function (x) { x.remove(); });
      Array.prototype.forEach.call(clone.querySelectorAll(".cloze"), function (x, k) {
        var span = doc.createElement("span");
        if (k === idx) { span.className = "qz-blank"; span.textContent = "______"; }
        else span.textContent = x.textContent;
        x.parentNode.replaceChild(span, x);
      });
      var sentence = clone.innerHTML.trim();
      if (norm(clone.textContent).length > 320) return;
      clozes.push({ c: src.c, ans: ans, html: sentence, ctx: sectionTitle(ctx), src: src.title, href: src.href + (sectionId(ctx) ? "#" + sectionId(ctx) : "") });
    });
  }

  // Transforme paires & trous en questions (les distracteurs sont tirés à l'affichage)
  function generate(pairs, clozes, bank) {
    var seenTerm = {};
    pairs.forEach(function (p) {
      var k = p.c + "|" + p.term.toLowerCase();
      if (seenTerm[k]) return;
      seenTerm[k] = 1;
      var poolSize = pairs.filter(function (x) { return x.c === p.c; }).length;
      if (poolSize < 4) return;
      bank.push({ id: p.c + ":g-def:" + hash(p.term), c: p.c, kind: "def", gen: true, pair: p, src: p.src, sec: p.sec, href: p.href });
      bank.push({ id: p.c + ":g-term:" + hash(p.term), c: p.c, kind: "term", gen: true, pair: p, src: p.src, sec: p.sec, href: p.href });
    });
    var seenCz = {};
    clozes.forEach(function (z) {
      var k = z.c + "|" + hash(z.html);
      if (seenCz[k]) return;
      seenCz[k] = 1;
      var pool = clozes.filter(function (x) { return x.c === z.c && x.ans.toLowerCase() !== z.ans.toLowerCase(); });
      if (pool.length < 3) return;
      bank.push({ id: z.c + ":g-cz:" + hash(z.html), c: z.c, kind: "cloze", gen: true, cz: z, src: z.src, sec: z.ctx, href: z.href });
    });
  }

  function pickDistractors(pool, right, key, n) {
    var uniq = {}, cands = [];
    uniq[right.toLowerCase()] = 1;
    pool.forEach(function (x) {
      var v = x[key], lv = v.toLowerCase();
      if (uniq[lv]) return;
      uniq[lv] = 1; cands.push(x);
    });
    // privilégie la même source et une longueur proche (distracteurs plausibles)
    cands.sort(function (a, b) {
      var sa = Math.abs(a[key].length - right.length) - (a.src === pool.__src ? 30 : 0);
      var sb = Math.abs(b[key].length - right.length) - (b.src === pool.__src ? 30 : 0);
      return sa - sb;
    });
    return shuffle(cands.slice(0, Math.max(n * 3, 8))).slice(0, n).map(function (x) { return x[key]; });
  }

  // Instancie une question générée (options mélangées)
  function materialize(q, state) {
    if (q.kind === "quiz") return { q: q.q, opts: q.opts, a: q.a, ex: q.ex };
    var opts, right, prompt, ex;
    if (q.kind === "def" || q.kind === "term") {
      var lt = q.pair.term.toLowerCase(), ld = q.pair.def.toLowerCase();
      // exclut les homonymes (même terme, autre sens) et les doublons de définition
      var pool = state.pairs.filter(function (x) { return x.c === q.c && x !== q.pair && x.term.toLowerCase() !== lt && x.def.toLowerCase() !== ld; });
      pool.__src = q.src;
      var ctxHtml = q.pair.ctx ? '<span class="qz-ctx">📍 ' + esc(q.pair.ctx) + "</span>" : "";
      if (q.kind === "def") {
        right = q.pair.term;
        var defTxt = q.pair.def.replace(new RegExp(q.pair.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "…");
        prompt = ctxHtml + "Quel élément correspond à cette description ?<blockquote>" + esc(defTxt) + "</blockquote>";
        opts = pickDistractors(pool, right, "term", 3);
        ex = "<b>" + esc(q.pair.term) + "</b> : " + esc(q.pair.def);
      } else {
        right = q.pair.def;
        prompt = ctxHtml + "Quelle proposition correspond à <b>« " + esc(q.pair.term) + " »</b> ?";
        opts = pickDistractors(pool, right, "def", 3);
        ex = "<b>" + esc(q.pair.term) + "</b> : " + esc(q.pair.def);
      }
    } else {
      var cpool = state.clozes.filter(function (x) { return x.c === q.c; });
      cpool.__src = q.src;
      right = q.cz.ans;
      prompt = (q.cz.ctx ? '<span class="qz-ctx">📍 ' + esc(q.cz.ctx) + "</span>" : "") + "Complète le trou :<div class=\"qz-sent\">" + q.cz.html + "</div>";
      opts = pickDistractors(cpool, right, "ans", 3);
      ex = "Réponse : <b>" + esc(right) + "</b>.";
    }
    if (opts.length < 2) return null;
    opts = opts.map(esc);
    var all = shuffle(opts.concat([esc(right)]));
    return { q: prompt, opts: all, a: all.indexOf(esc(right)), ex: ex };
  }

  /* ---------- Chargement de la banque ---------- */
  function fetchText(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });
  }
  function buildBank(onProgress) {
    var srcs = listSources(), done = 0;
    var bank = [], pairs = [], clozes = [];
    var parser = new DOMParser();
    return Promise.all(srcs.map(function (s) {
      return fetchText(s.url).then(function (txt) {
        var html = s.type === "md" ? (window.MD ? window.MD.render(txt).html : "") : txt;
        var doc = parser.parseFromString(html, "text/html");
        if (s.type === "md") extractPairs(doc, s, pairs, clozes);
        else doc.querySelectorAll(".gloss-pop").forEach(function (p) { p.remove(); });
        extractQuizzes(doc, s, bank);
      }).catch(function () {}).then(function () { done++; if (onProgress) onProgress(done, srcs.length); });
    })).then(function () {
      var seen = {}, uniq = [];
      bank.forEach(function (q) { if (!seen[q.id]) { seen[q.id] = 1; uniq.push(q); } });
      generate(pairs, clozes, uniq);
      return { bank: uniq, pairs: pairs, clozes: clozes, sources: srcs.length };
    });
  }

  /* ---------- Algorithme adaptatif ---------- */
  function errRate(s) { return 1 - (s.ok + 1) / (s.n + 2); }
  function weight(q, stats, weak) {
    var s = stats[q.id], w;
    if (!s) w = 2.2;
    else {
      w = 0.4 + 4 * errRate(s);
      if (s.s >= 3) w *= 0.35;
      var ageH = (Date.now() - (s.t || 0)) / 36e5;
      if (ageH < 0.2) w *= 0.15; else if (ageH > 72) w *= 1.4;
    }
    if (weak[q.c]) w *= 1.6;
    if (q.gen) w *= 0.85;
    return w;
  }
  function isWrongish(s) { return s && s.n > 0 && (s.last === false || errRate(s) > 0.4); }
  function pickSeries(pool, n, mode, stats) {
    var weak = weakCodes();
    if (mode === "erreurs") pool = pool.filter(function (q) { return isWrongish(stats[q.id]); });
    if (mode === "nouvelles") pool = pool.filter(function (q) { return !stats[q.id]; });
    var items = pool.map(function (q) { return { q: q, w: mode === "aleatoire" ? 1 : weight(q, stats, weak) }; });
    var out = [];
    while (out.length < n && items.length) {
      var tot = items.reduce(function (s, x) { return s + x.w; }, 0), r = Math.random() * tot, k = 0;
      while (k < items.length - 1 && (r -= items[k].w) > 0) k++;
      out.push(items[k].q); items.splice(k, 1);
    }
    return out;
  }
  function record(q, ok) {
    var st = load(QSTATS_KEY, {});
    var s = st[q.id] || { n: 0, ok: 0, s: 0 };
    s.n++; if (ok) { s.ok++; s.s = (s.s || 0) + 1; } else s.s = 0;
    s.last = ok; s.t = Date.now();
    st[q.id] = s;
    save(QSTATS_KEY, st);
  }

  /* ---------- MathJax (à la demande) ---------- */
  function typeset(host) {
    if (!/\\\(|\\\[/.test(host.innerHTML)) return;
    if (window.MathJax && window.MathJax.typesetPromise) { window.MathJax.typesetPromise([host]).catch(function () {}); return; }
    if (document.getElementById("mathjax-cdn")) return;
    window.MathJax = { tex: { inlineMath: [["\\(", "\\)"]], displayMath: [["\\[", "\\]"]] }, svg: { fontCache: "global" } };
    var s = document.createElement("script"); s.id = "mathjax-cdn"; s.async = true;
    s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    document.head.appendChild(s);
  }

  /* ---------- Interface ---------- */
  var STATE = null;
  var prefs = load(PREF_KEY, {});
  var sel = { codes: {}, mode: qs("mode") || prefs.mode || "adaptatif", n: +(prefs.n || 10), authored: prefs.authored !== false, gen: prefs.gen !== false };

  function poolFor() {
    var codes = Object.keys(sel.codes).filter(function (c) { return sel.codes[c]; });
    return STATE.bank.filter(function (q) {
      if (codes.length && !sel.codes[q.c]) return false;
      if (q.gen ? !sel.gen : !sel.authored) return false;
      return true;
    });
  }

  function renderSetup() {
    var stats = load(QSTATS_KEY, {});
    var byC = {};
    STATE.bank.forEach(function (q) { byC[q.c] = (byC[q.c] || 0) + 1; });
    var nGen = STATE.bank.filter(function (q) { return q.gen; }).length;
    var nErr = STATE.bank.filter(function (q) { return isWrongish(stats[q.id]); }).length;
    var nNew = STATE.bank.filter(function (q) { return !stats[q.id]; }).length;
    var chips = subjects().filter(function (s) { return byC[s.code]; }).map(function (s) {
      return '<button type="button" class="qz-chip" data-c="' + esc(s.code) + '" aria-pressed="' + !!sel.codes[s.code] + '">' +
        esc(s.emoji || "📘") + " " + esc(s.name) + ' <span class="n">' + byC[s.code] + "</span></button>";
    }).join("");
    var modes = [
      ["adaptatif", "🧠 Adaptatif", "insiste sur ce que tu rates"],
      ["erreurs", "🎯 Mes erreurs", nErr + " à retravailler"],
      ["nouvelles", "✨ Jamais vues", nNew + " inédites"],
      ["aleatoire", "🎲 Aléatoire", "tirage uniforme"]
    ].map(function (m) {
      return '<button type="button" class="qz-mode" data-mode="' + m[0] + '" aria-pressed="' + (sel.mode === m[0]) + '"><b>' + m[1] + "</b><small>" + m[2] + "</small></button>";
    }).join("");
    root.innerHTML =
      '<div class="qz-bankinfo">📦 Banque : <b>' + STATE.bank.length + "</b> questions (" + (STATE.bank.length - nGen) + " rédigées + " + nGen +
      ' générées automatiquement) · <b>' + nErr + "</b> à retravailler · " + nNew + " jamais vues</div>" +
      '<h2 class="qz-h">1. Matières <small>(aucune sélection = toutes)</small></h2><div class="qz-chips" role="group" aria-label="Matières">' + chips + "</div>" +
      '<h2 class="qz-h">2. Mode</h2><div class="qz-modes" role="group" aria-label="Mode">' + modes + "</div>" +
      '<h2 class="qz-h">3. Réglages</h2><div class="qz-opts">' +
      '<label>Questions par série <select id="qz-n">' + [5, 10, 20, 30].map(function (k) { return '<option value="' + k + '"' + (sel.n === k ? " selected" : "") + ">" + k + "</option>"; }).join("") + "</select></label>" +
      '<label><input type="checkbox" id="qz-auth"' + (sel.authored ? " checked" : "") + "> Quiz rédigés des cours</label>" +
      '<label><input type="checkbox" id="qz-gen"' + (sel.gen ? " checked" : "") + "> 🤖 Questions générées (glossaire, définitions, trous)</label></div>" +
      '<p class="qz-avail" id="qz-avail" aria-live="polite"></p>' +
      '<div class="qz-actions"><button type="button" class="btn qz-go" id="qz-go">▶ Lancer la série</button>' +
      (Object.keys(stats).length ? '<button type="button" class="btn" id="qz-reset">↺ Réinitialiser mes statistiques</button>' : "") + "</div>";

    function avail() {
      var p = poolFor(), s2 = load(QSTATS_KEY, {});
      if (sel.mode === "erreurs") p = p.filter(function (q) { return isWrongish(s2[q.id]); });
      if (sel.mode === "nouvelles") p = p.filter(function (q) { return !s2[q.id]; });
      var el = document.getElementById("qz-avail");
      el.textContent = p.length ? p.length + " question" + (p.length > 1 ? "s" : "") + " disponible" + (p.length > 1 ? "s" : "") + " avec ces réglages."
        : "Aucune question avec ces réglages" + (sel.mode === "erreurs" ? " : pas encore d'erreur enregistrée 🎉" : ".");
      document.getElementById("qz-go").disabled = !p.length;
    }
    function persist() { save(PREF_KEY, { mode: sel.mode, n: sel.n, authored: sel.authored, gen: sel.gen }); avail(); }
    root.querySelectorAll(".qz-chip").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.getAttribute("data-c"); sel.codes[c] = !sel.codes[c];
        b.setAttribute("aria-pressed", !!sel.codes[c]); avail();
      });
    });
    root.querySelectorAll(".qz-mode").forEach(function (b) {
      b.addEventListener("click", function () {
        sel.mode = b.getAttribute("data-mode");
        root.querySelectorAll(".qz-mode").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        persist();
      });
    });
    document.getElementById("qz-n").addEventListener("change", function (e) { sel.n = +e.target.value; persist(); });
    document.getElementById("qz-auth").addEventListener("change", function (e) { sel.authored = e.target.checked; persist(); });
    document.getElementById("qz-gen").addEventListener("change", function (e) { sel.gen = e.target.checked; persist(); });
    document.getElementById("qz-go").addEventListener("click", start);
    var rs = document.getElementById("qz-reset");
    if (rs) rs.addEventListener("click", function () {
      if (!confirm("Effacer toutes tes statistiques de quiz (réussites/erreurs par question) ?")) return;
      save(QSTATS_KEY, {}); renderSetup();
    });
    avail();
  }

  var RUN = null;
  function start() {
    var series = pickSeries(poolFor(), sel.n, sel.mode, load(QSTATS_KEY, {}));
    if (!series.length) return;
    RUN = { queue: series.map(function (q) { return { q: q, retry: false }; }), i: 0, total: series.length, first: {}, results: [] };
    showQuestion();
  }

  function showQuestion() {
    if (RUN.i >= RUN.queue.length) { showEnd(); return; }
    var item = RUN.queue[RUN.i], q = item.q;
    var m = materialize(q, STATE);
    if (!m) { RUN.queue.splice(RUN.i, 1); RUN.total = Math.min(RUN.total, RUN.queue.length); showQuestion(); return; }
    var s = subjectByCode(q.c);
    var answered = Object.keys(RUN.first).length;
    root.innerHTML =
      '<div class="qz-progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + RUN.total + '" aria-valuenow="' + answered + '" aria-label="Progression de la série"><span style="width:' + (answered / RUN.total * 100) + '%"></span></div>' +
      '<div class="qz-card">' +
      '<div class="qz-meta"><span class="qz-tag">' + esc((s && s.emoji) || "📘") + " " + esc(s ? s.name : q.c) + "</span>" +
      (q.gen ? '<span class="qz-tag gen" title="Question construite automatiquement à partir du cours">🤖 générée</span>' : "") +
      (item.retry ? '<span class="qz-tag retry">🔁 on la revoit</span>' : "") +
      '<span class="qz-count">' + Math.min(answered + 1, RUN.total) + " / " + RUN.total + "</span></div>" +
      '<h2 class="qz-q" id="qz-q" tabindex="-1">' + m.q + "</h2>" +
      '<div class="qz-opts-list" role="group" aria-labelledby="qz-q">' + m.opts.map(function (o, k) {
        var txt = String(o).replace(/<[^>]+>/g, "");
        var aria = /^\s*\\\((?:(?!\\\)).)*\\\)\s*$/.test(txt) ? ' aria-label="' + esc(txt.replace(/\\\(|\\\)/g, "").trim()) + '"' : "";
        return '<button type="button" class="qz-opt" data-k="' + k + '"' + aria + '><span class="qz-key" aria-hidden="true">' + (k + 1) + "</span><span>" + o + "</span></button>";
      }).join("") + "</div>" +
      '<div class="qz-fb" id="qz-fb" aria-live="polite"></div>' +
      '<div class="qz-nav"><a class="qz-src" href="' + esc(q.href) + '">📘 ' + esc(q.src) + '</a><button type="button" class="btn qz-next" id="qz-next" hidden>Suivant →</button></div>' +
      "</div>" +
      '<p class="qz-help">Raccourcis : <kbd>1</kbd>–<kbd>' + m.opts.length + '</kbd> pour répondre, <kbd>Entrée</kbd> pour continuer.</p>';
    var opts = root.querySelectorAll(".qz-opt");
    opts.forEach(function (b) { b.addEventListener("click", function () { answer(+b.getAttribute("data-k"), m, item); }); });
    document.getElementById("qz-next").addEventListener("click", next);
    typeset(root);
    var h = document.getElementById("qz-q"); if (h) h.focus({ preventScroll: true });
  }

  function answer(k, m, item) {
    var card = root.querySelector(".qz-card");
    if (!card || card.classList.contains("answered")) return;
    card.classList.add("answered");
    var ok = k === m.a, q = item.q;
    root.querySelectorAll(".qz-opt").forEach(function (b, j) {
      b.disabled = true;
      if (j === m.a) b.classList.add("correct");
      else if (j === k) b.classList.add("wrong");
    });
    if (!item.retry && !(q.id in RUN.first)) {
      RUN.first[q.id] = ok;
      RUN.results.push({ q: q, ok: ok });
      logActivity({ k: "quiz", c: q.c, m: "adaptatif", ok: ok });
    }
    record(q, ok);
    if (!ok && !item.retry) RUN.queue.splice(Math.min(RUN.i + 3, RUN.queue.length), 0, { q: q, retry: true });
    var fb = document.getElementById("qz-fb");
    fb.className = "qz-fb " + (ok ? "ok" : "ko");
    fb.innerHTML = (ok ? "✅ <b>Correct !</b> " : "❌ <b>Pas tout à fait.</b> " + (item.retry ? "" : "Je te la reposerai dans quelques questions. ")) + (m.ex || "");
    typeset(fb);
    var nx = document.getElementById("qz-next");
    nx.hidden = false;
    nx.textContent = RUN.i + 1 >= RUN.queue.length ? "Voir le bilan →" : "Suivant →";
    nx.focus();
  }
  function next() { RUN.i++; showQuestion(); window.scrollTo({ top: root.offsetTop - 80, behavior: "smooth" }); }

  function showEnd() {
    var res = RUN.results, ok = res.filter(function (r) { return r.ok; }).length, pct = res.length ? Math.round(ok / res.length * 100) : 0;
    var byC = {};
    res.forEach(function (r) { var c = r.q.c; if (!byC[c]) byC[c] = { ok: 0, t: 0 }; byC[c].t++; if (r.ok) byC[c].ok++; });
    var rows = Object.keys(byC).map(function (c) {
      var s = subjectByCode(c), p = Math.round(byC[c].ok / byC[c].t * 100);
      return '<div class="qz-row"><span>' + esc((s && s.emoji) || "📘") + " " + esc(s ? s.name : c) + '</span><span class="qz-bar"><span style="width:' + p + '%"></span></span><b>' + byC[c].ok + "/" + byC[c].t + "</b></div>";
    }).join("");
    var missed = res.filter(function (r) { return !r.ok; });
    var mhtml = missed.length ? '<h3>📘 À revoir dans les cours</h3><ul class="qz-missed">' + missed.map(function (r) {
      return '<li><a href="' + esc(r.q.href) + '">' + esc(r.q.src) + (r.q.sec ? " › " + esc(r.q.sec) : "") + "</a></li>";
    }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join("") + "</ul>" : "";
    var msg = pct >= 90 ? "🏆 Excellent, c'est maîtrisé !" : pct >= 70 ? "💪 Solide ! Encore quelques points à consolider." : pct >= 50 ? "📈 C'est en bonne voie, revois les notions ratées." : "🧱 On construit : relis les modules indiqués puis relance une série « Mes erreurs ».";
    root.innerHTML = '<div class="qz-end"><h2>Bilan de la série</h2><div class="qz-score">' + pct + '<small>%</small></div><p>' + ok + " bonne" + (ok > 1 ? "s" : "") + " réponse" + (ok > 1 ? "s" : "") + " sur " + res.length + " · " + msg + "</p>" +
      '<div class="qz-rows">' + rows + "</div>" + mhtml +
      '<div class="qz-actions"><button type="button" class="btn qz-go" id="qz-again">🔁 Nouvelle série</button>' +
      (missed.length ? '<button type="button" class="btn" id="qz-err">🎯 Série sur mes erreurs</button>' : "") +
      '<button type="button" class="btn" id="qz-setup">⚙️ Réglages</button></div></div>';
    document.getElementById("qz-again").addEventListener("click", start);
    var e = document.getElementById("qz-err");
    if (e) e.addEventListener("click", function () { sel.mode = "erreurs"; start(); });
    document.getElementById("qz-setup").addEventListener("click", renderSetup);
    var h = root.querySelector("h2"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }

  document.addEventListener("keydown", function (e) {
    if (!RUN || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
    var card = root.querySelector(".qz-card");
    if (!card) return;
    if (/^[1-9]$/.test(e.key) && !card.classList.contains("answered")) {
      var b = root.querySelector('.qz-opt[data-k="' + (+e.key - 1) + '"]');
      if (b) { e.preventDefault(); b.click(); }
    } else if (e.key === "Enter" && card.classList.contains("answered") && !(t && t.tagName === "BUTTON")) {
      e.preventDefault(); next();
    }
  });

  /* ---------- Démarrage ---------- */
  (qs("c") || "").toUpperCase().split(",").forEach(function (c0) {
    if (c0 && subjectByCode(c0)) sel.codes[c0] = true;
  });
  root.innerHTML = '<p class="qz-loading" aria-live="polite">⏳ Construction de la banque de questions… <span id="qz-prog"></span></p>';
  buildBank(function (d, t) { var p = document.getElementById("qz-prog"); if (p) p.textContent = d + " / " + t + " sources"; })
    .then(function (st) { STATE = st; renderSetup(); })
    .catch(function (err) { root.innerHTML = '<p class="qz-loading">😕 Impossible de construire la banque : ' + esc(err && err.message) + "</p>"; });

  window.ESGIQuiz = { buildBank: buildBank, weight: weight };
})();
