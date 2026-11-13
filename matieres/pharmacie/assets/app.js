/* =========================================================
   app.js — Interactivité des pages de module (portail Pharmacie)
   Le thème, le menu, le Pomodoro, le streak… sont gérés par nav.js / common.js.
   Ici : quiz (+ bilan), examen chronométré, notes, lecture audio, partage,
   glossaire interactif, mode révision (cartes à trous), favoris, reprise,
   progression, raccourcis clavier, impression.
   Clés localStorage (toutes via PHARMA.K, préfixe pharma-) :
     favs, last, done, notesPrefix + <idModule>, + pharma-gloss-off (glossaire désactivé)
   ========================================================= */
(function () {
  "use strict";

  var P = window.PHARMA = window.PHARMA || {};
  var K = P.K || {};
  var GLOSS_OFF_KEY = "pharma-gloss-off";

  var lesson, doneBtn, modId = "", mod = null, pageUrl = "", pageTitle = "";
  var examCtl = null, quizSet = [];

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return P.esc ? P.esc(s) : String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function log(entry) { if (P.logActivity) P.logActivity(entry); }
  function typing(t) { return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }

  var toastEl = null, toastT = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "mod-toast no-print";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  function setFavicon(emoji) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="52" font-size="52">' + emoji + "</text></svg>";
    var link = $('link[rel="icon"]');
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = "data:image/svg+xml," + encodeURIComponent(svg);
  }

  /* ---------- Contexte du module ---------- */
  function initContext() {
    lesson = $(".lesson");
    doneBtn = document.getElementById("mark-done");
    var file = location.pathname.split("/").pop();
    var byFile = (P.byFile && file) ? P.byFile(file) : null;
    modId = (doneBtn && doneBtn.getAttribute("data-module")) || (byFile && byFile.id) || "";
    mod = (P.byId && modId) ? P.byId(modId) : byFile;
    pageUrl = "modules/" + file;
    var h1 = lesson && $("h1", lesson);
    pageTitle = (h1 ? h1.textContent : document.title).replace(/\s*⭐\s*$/, "").trim();
  }

  /* ---------- Progression : bouton « terminé » (sans rechargement) ---------- */
  function initDoneButton() {
    if (!doneBtn) return;
    function paint() {
      var d = !!P.getDone()[modId];
      doneBtn.textContent = d ? "✓ Module terminé" : "Marquer comme terminé";
      doneBtn.classList.toggle("primary", d);
      doneBtn.setAttribute("aria-pressed", d ? "true" : "false");
    }
    paint();
    doneBtn.addEventListener("click", function () {
      var now = !P.getDone()[modId];
      P.setDone(modId, now);
      if (now) log({ k: "done", m: modId });
      paint();
      toast(now ? "✓ Module marqué comme terminé" : "Module remis « à faire »");
    });
  }

  function paintHomeProgress() {
    var cards = $$("[data-module-card]");
    if (!cards.length) return;
    var done = P.getDone();
    cards.forEach(function (card) {
      if (done[card.getAttribute("data-module-card")] && !$(".progress-badge", card)) {
        var badge = document.createElement("span");
        badge.className = "progress-badge";
        badge.textContent = "✓ Terminé";
        card.appendChild(badge);
      }
    });
  }

  /* ---------- Barre de progression de lecture ---------- */
  function initReadingProgress() {
    var bar = $(".lesson-progress .bar");
    if (!bar) return;
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var r = max > 0 ? h.scrollTop / max : 0;
      bar.style.width = Math.min(100, Math.max(0, r * 100)) + "%";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Temps de lecture estimé ---------- */
  function initReadingTime() {
    var h1 = lesson && $("h1", lesson);
    if (!h1) return null;
    var words = (lesson.innerText || "").trim().split(/\s+/).length;
    var min = Math.max(1, Math.round(words / 200));
    var badge = document.createElement("div");
    badge.className = "readtime";
    badge.textContent = "⏱️ ~" + min + " min de lecture";
    ($(".subtitle", lesson) || h1).insertAdjacentElement("afterend", badge);
    return badge;
  }

  /* =========================================================
     Quiz
     <div class="quiz" data-answer="2"> .qtext / .options > .opt* / .feedback[data-explain]
     ========================================================= */
  function quizCounts() {
    var total = quizSet.length, answered = 0, ok = 0;
    quizSet.forEach(function (q) {
      var r = q.getAttribute("data-result");
      if (r) { answered++; if (r === "ok") ok++; }
    });
    return { total: total, answered: answered, ok: ok };
  }

  function initQuizzes() {
    quizSet = $$(".quiz");
    quizSet.forEach(function (quiz) {
      var fb = $(".feedback", quiz);
      if (!fb) {
        fb = document.createElement("div");
        fb.className = "feedback";
        quiz.appendChild(fb);
      }
      fb.setAttribute("aria-live", "polite");
      var explain = fb.getAttribute("data-explain") || "";

      $$(".opt", quiz).forEach(function (opt) {
        opt.setAttribute("role", "button");
        opt.tabIndex = 0;
        function choose() {
          if (quiz.classList.contains("answered")) return;
          quiz.classList.add("answered");
          var answer = parseInt(quiz.getAttribute("data-answer"), 10);
          var opts = $$(".opt", quiz);
          var i = opts.indexOf(opt);
          opts.forEach(function (o) { o.classList.add("disabled"); });
          if (opts[answer]) opts[answer].classList.add("correct");
          var ok = i === answer;
          if (!ok) opt.classList.add("wrong");
          quiz.setAttribute("data-result", ok ? "ok" : "ko");
          fb.classList.add("show", ok ? "ok" : "ko");
          fb.innerHTML = (ok ? "✅ <strong>Bravo !</strong> " : "❌ <strong>Pas tout à fait.</strong> ") + explain;
          log({ k: "quiz", m: modId, ok: ok });
          quiz.dispatchEvent(new CustomEvent("quiz-answered", { bubbles: true, detail: { ok: ok, quiz: quiz } }));
          if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([fb]);
        }
        opt.addEventListener("click", choose);
        opt.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); }
        });
      });
    });
  }

  function shuffleQuiz(quiz) {
    var opts = $$(".opt", quiz);
    if (opts.length < 2) return;
    var answer = parseInt(quiz.getAttribute("data-answer"), 10);
    var correct = opts[answer];
    var parent = opts[0].parentNode;
    var fb = $(".feedback", quiz);
    quiz.classList.remove("answered");
    quiz.removeAttribute("data-result");
    opts.forEach(function (o) { o.classList.remove("disabled", "correct", "wrong"); });
    if (fb) fb.classList.remove("show", "ok", "ko");
    var arr = opts.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    arr.forEach(function (o) { parent.appendChild(o); });
    quiz.setAttribute("data-answer", arr.indexOf(correct));
  }

  // Remet tous les quiz à zéro (réponses remélangées)
  function shuffleAll() { quizSet.forEach(shuffleQuiz); updateRecap(); }

  /* ---------- Récapitulatif des quiz (fin de page) ---------- */
  var recapEl = null;
  function initRecap() {
    if (!quizSet.length || !doneBtn) return;
    var anchor = doneBtn.parentNode && doneBtn.parentNode !== lesson ? doneBtn.parentNode : doneBtn;
    recapEl = document.createElement("div");
    recapEl.className = "quiz-recap no-print";
    recapEl.innerHTML =
      '<div class="qr-title">🧮 Bilan des quiz de la page</div>' +
      '<div class="qr-score" role="status" aria-live="polite"></div>' +
      '<div class="qr-bar"><span></span></div>' +
      '<button class="btn" id="quiz-redo" type="button">🔀 Refaire le quiz mélangé</button>';
    anchor.parentNode.insertBefore(recapEl, anchor);
    $("#quiz-redo", recapEl).addEventListener("click", function () {
      if (examCtl) examCtl.restart(); else shuffleAll();
      if (quizSet[0]) quizSet[0].scrollIntoView({ block: "center" });
    });
    updateRecap();
    document.addEventListener("quiz-answered", updateRecap);
  }
  function updateRecap() {
    if (!recapEl) return;
    var c = quizCounts();
    var left = c.total - c.answered;
    var txt = "<strong>" + c.ok + " / " + c.total + "</strong> bonnes réponses";
    if (left > 0) txt += " · " + left + " question" + (left > 1 ? "s" : "") + " restante" + (left > 1 ? "s" : "");
    else {
      var r = c.total ? c.ok / c.total : 0;
      txt += " · " + (r === 1 ? "🏆 sans faute !" : r >= 0.7 ? "👍 solide, continue !" : "💪 relis le cours puis refais le quiz.");
    }
    $(".qr-score", recapEl).innerHTML = txt;
    $(".qr-bar span", recapEl).style.width = (c.total ? Math.round(c.answered / c.total * 100) : 0) + "%";
  }

  /* ---------- Mode examen chronométré ---------- */
  function examWanted() { return document.body.hasAttribute("data-exam") || /[?&]exam=1\b/.test(location.search); }
  function initExamMode() {
    if (!examWanted() || !quizSet.length) return;
    var bar = document.createElement("div");
    bar.className = "exam-bar no-print";
    bar.innerHTML =
      '<span class="exam-timer" id="exam-timer">00:00</span>' +
      '<span class="exam-score" id="exam-score" role="status" aria-live="polite"></span>' +
      '<button class="btn" id="exam-toggle" type="button">⏸ Pause</button>' +
      '<button class="btn" id="exam-restart" type="button">↺ Recommencer</button>';
    document.body.appendChild(bar);
    document.body.classList.add("has-exam");
    var tEl = $("#exam-timer", bar), sEl = $("#exam-score", bar), toggle = $("#exam-toggle", bar);
    var st = { sec: 0, running: true, finished: false };
    var total = quizSet.length;
    function fmt(s) { return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
    function render() {
      var c = quizCounts();
      if (st.finished) {
        sEl.textContent = "✅ Terminé en " + fmt(st.sec) + " · score final " + c.ok + "/" + total + " (" + Math.round(c.ok / total * 100) + " %)";
      } else {
        sEl.textContent = c.answered + " / " + total + " répondues · " + c.ok + " correctes";
      }
      tEl.textContent = fmt(st.sec);
    }
    setInterval(function () { if (st.running && !st.finished) { st.sec++; tEl.textContent = fmt(st.sec); } }, 1000);
    document.addEventListener("quiz-answered", function () {
      var c = quizCounts();
      if (c.answered === total && !st.finished) {
        st.finished = true; st.running = false;
        bar.classList.add("done");
        toggle.disabled = true;
        log({ k: "exam", m: modId, score: c.ok, total: total, sec: st.sec });
      }
      render();
    });
    toggle.addEventListener("click", function () {
      st.running = !st.running;
      toggle.textContent = st.running ? "⏸ Pause" : "▶ Reprendre";
    });
    function restart() {
      shuffleAll();
      st.sec = 0; st.running = true; st.finished = false;
      bar.classList.remove("done");
      toggle.disabled = false; toggle.textContent = "⏸ Pause";
      render();
    }
    $("#exam-restart", bar).addEventListener("click", restart);
    examCtl = { restart: restart };
    render();
  }

  /* ---------- Notes personnelles ---------- */
  var notesBox = null;
  function initNotes() {
    if (!modId || !notesBox) return;
    var key = (K.notesPrefix || "pharma-notes-") + modId;
    var ta = $("#notes-area", notesBox), status = $("#notes-status", notesBox), count = $("#notes-count", notesBox);
    try { ta.value = localStorage.getItem(key) || ""; } catch (e) {}
    function recount() {
      var v = ta.value.trim();
      var w = v ? v.split(/\s+/).length : 0;
      count.textContent = w + " mot" + (w > 1 ? "s" : "") + " · " + ta.value.length + " car.";
    }
    recount();
    if (ta.value) notesBox.open = true;
    var t = null, dirty = false;
    function save() {
      clearTimeout(t); dirty = false;
      try {
        if (ta.value) localStorage.setItem(key, ta.value); else localStorage.removeItem(key);
      } catch (e) {}
      status.textContent = "Enregistré ✓";
      setTimeout(function () { status.textContent = "Sauvegarde auto"; }, 1400);
    }
    ta.addEventListener("input", function () {
      dirty = true; status.textContent = "…"; recount();
      clearTimeout(t); t = setTimeout(save, 450);
    });
    window.addEventListener("pagehide", function () { if (dirty) save(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden && dirty) save(); });
    $("#notes-copy", notesBox).addEventListener("click", function () {
      var btn = this;
      function ok() { btn.textContent = "Copié ✓"; setTimeout(function () { btn.textContent = "Copier"; }, 1300); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(ok, function () {});
      else { ta.select(); try { document.execCommand("copy"); ok(); } catch (e) {} }
    });
    $("#notes-clear", notesBox).addEventListener("click", function () {
      if (!ta.value) return;
      if (!window.confirm("Effacer toutes tes notes sur ce module ?")) return;
      ta.value = ""; recount(); save();
    });
  }
  function openNotes() {
    if (!notesBox) return;
    notesBox.open = true;
    notesBox.scrollIntoView({ block: "center" });
    var ta = $("#notes-area", notesBox);
    if (ta) ta.focus({ preventScroll: true });
  }

  /* =========================================================
     Lecture audio (speechSynthesis)
     ========================================================= */
  var TTS_SKIP = ".breadcrumb,.readtime,.domains,.tags,.toc,.mod-tools,.mod-notes,.mod-panel,.quiz,.quiz-recap,details,.culture,.pager,.lesson-progress,.exam-bar,.tts-bar,script,style,button,.gloss-tip";
  function ttsCollect() {
    var parts = [];
    function addEl(el) {
      var clone = el.cloneNode(true);
      $$(TTS_SKIP, clone).forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      $$("li,tr,h1,h2,h3,h4,p,.label", clone).forEach(function (n) { n.appendChild(document.createTextNode(". ")); });
      $$("td,th", clone).forEach(function (n) { n.appendChild(document.createTextNode(", ")); });
      var text = clone.textContent.replace(/\s+/g, " ").replace(/([.!?:;])\s*[.,]/g, "$1").replace(/\.(\s*\.)+/g, ".").trim();
      if (text.length > 1) parts.push({ el: el, text: text });
    }
    function walk(node) {
      Array.prototype.forEach.call(node.children, function (el) {
        if (el.matches(TTS_SKIP)) return;
        if (el.tagName === "SECTION") { walk(el); return; }
        addEl(el);
      });
    }
    if (lesson) walk(lesson);
    var chunks = [];
    parts.forEach(function (p) {
      var sentences = p.text.match(/[^.!?;:]+[.!?;:]?\s*/g) || [p.text];
      var cur = "";
      sentences.forEach(function (s) {
        if ((cur + s).length > 200 && cur) { chunks.push({ text: cur.trim(), el: p.el }); cur = ""; }
        cur += s;
      });
      if (cur.trim()) chunks.push({ text: cur.trim(), el: p.el });
    });
    return chunks;
  }

  function initTTS(btn) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { btn.hidden = true; return; }
    var synth = window.speechSynthesis;
    var RATES = [0.9, 1, 1.25];
    var rateI = 1, chunks = [], idx = 0, state = "idle", run = 0, curEl = null;
    var bar = document.createElement("div");
    bar.className = "tts-bar no-print";
    bar.hidden = true;
    bar.innerHTML =
      '<button class="btn" id="tts-pause" type="button" aria-label="Pause">⏸</button>' +
      '<button class="btn" id="tts-stop" type="button" aria-label="Arrêter la lecture">⏹</button>' +
      '<button class="btn" id="tts-rate" type="button" aria-label="Vitesse de lecture">×1</button>' +
      '<span class="tts-pos"></span>';
    document.body.appendChild(bar);
    var pauseB = $("#tts-pause", bar), stopB = $("#tts-stop", bar), rateB = $("#tts-rate", bar), pos = $(".tts-pos", bar);

    function voice() {
      var best = null;
      (synth.getVoices ? synth.getVoices() : []).forEach(function (v) {
        if (/^fr/i.test(v.lang) && (!best || (/^fr[-_]FR/i.test(v.lang) && !/^fr[-_]FR/i.test(best.lang)))) best = v;
      });
      return best;
    }
    function mark(el) {
      if (curEl === el) return;
      if (curEl) curEl.classList.remove("tts-now");
      curEl = el;
      if (el) {
        el.classList.add("tts-now");
        var r = el.getBoundingClientRect();
        if (r.top < 70 || r.bottom > window.innerHeight - 90) el.scrollIntoView({ block: "center" });
      }
    }
    function paint() {
      btn.classList.toggle("on", state !== "idle");
      btn.textContent = state === "idle" ? "🔊 Écouter" : "⏹ Arrêter";
      btn.setAttribute("aria-pressed", state === "idle" ? "false" : "true");
      bar.hidden = state === "idle";
      pauseB.textContent = state === "paused" ? "▶" : "⏸";
      pauseB.setAttribute("aria-label", state === "paused" ? "Reprendre" : "Pause");
      rateB.textContent = "×" + RATES[rateI];
      pos.textContent = chunks.length ? Math.min(idx + 1, chunks.length) + " / " + chunks.length : "";
    }
    function speak() {
      var my = ++run;
      synth.cancel();
      if (idx >= chunks.length) { stop(); return; }
      var c = chunks[idx];
      mark(c.el);
      var u = new SpeechSynthesisUtterance(c.text);
      u.lang = "fr-FR"; u.rate = RATES[rateI];
      var v = voice(); if (v) u.voice = v;
      u.onend = function () { if (my !== run || state !== "playing") return; idx++; speak(); };
      u.onerror = function () { if (my === run && state === "playing") stop(); };
      paint();
      synth.speak(u);
    }
    function stop() {
      run++; state = "idle";
      try { synth.cancel(); } catch (e) {}
      mark(null); idx = 0; paint();
    }
    function startFromViewport() {
      chunks = ttsCollect();
      if (!chunks.length) return;
      idx = 0;
      for (var i = 0; i < chunks.length; i++) {
        if (chunks[i].el.getBoundingClientRect().bottom > 90) { idx = i; break; }
      }
      state = "playing";
      speak();
    }
    btn.addEventListener("click", function () { if (state === "idle") startFromViewport(); else stop(); });
    stopB.addEventListener("click", stop);
    pauseB.addEventListener("click", function () {
      if (state === "playing") { state = "paused"; run++; synth.cancel(); paint(); }
      else if (state === "paused") { state = "playing"; speak(); }
    });
    rateB.addEventListener("click", function () {
      rateI = (rateI + 1) % RATES.length;
      if (state === "playing") speak(); else paint();
    });
    window.addEventListener("pagehide", function () { try { synth.cancel(); } catch (e) {} });
  }

  /* =========================================================
     Glossaire interactif (window.PHARMA_GLOSSARY = [{t, d, m?, a?}])
     ========================================================= */
  var GLOSS_MAX = 25;
  var GLOSS_SKIP = "h1,h2,h3,h4,h5,h6,a,code,pre,summary,button,textarea,select,script,style,.quiz,details.solution,.callout.warn,.callout.note strong,.callout.note .cloze-src,.toc,.culture,.mod-tools,.mod-notes,.mod-panel,.quiz-recap,.label,.tag,.tags,.domains,.pager,.breadcrumb,.readtime,.gloss,.cloze,.subtitle,.chead,.jhead,.exam-bar,.tts-bar,.gloss-tip,.lesson-progress,.mod-toast";

  // Minuscules sans accents, en gardant exactement 1 caractère par caractère (les index restent valides)
  function fold(s, keepCase) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      var n = c.normalize ? c.normalize("NFD").charAt(0) : c;
      out += keepCase ? n : n.toLowerCase().charAt(0);
    }
    return out;
  }
  function isWordCh(ch) { return !!ch && /[a-z0-9\u00c0-\u024f]/i.test(ch); }

  function glossEntries() {
    var g = window.PHARMA_GLOSSARY;
    if (!Array.isArray(g)) return [];
    var list = [];
    g.forEach(function (e) {
      if (!e || !e.t || !e.d) return;
      var names = [String(e.t)];
      if (e.a) names = names.concat(Array.isArray(e.a) ? e.a : String(e.a).split(/[|;]/));
      var needles = [];
      names.forEach(function (n) {
        n = String(n).trim();
        if (n.length < 2) return;
        var keep = n.length <= 3;
        needles.push({ n: fold(n, keep), keep: keep });
      });
      if (needles.length) list.push({ t: String(e.t), d: String(e.d), needles: needles, own: e.m && e.m === modId ? 0 : 1 });
    });
    list.sort(function (x, y) { return x.own - y.own || y.t.length - x.t.length; });
    return list;
  }

  function textNodes(root) {
    var out = [], n;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    while ((n = w.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      var p = n.parentNode;
      if (!p || (p.closest && p.closest(GLOSS_SKIP))) continue;
      out.push(n);
    }
    return out;
  }

  function findIn(text, needle) {
    var hay = fold(text, needle.keep), from = 0, i;
    while ((i = hay.indexOf(needle.n, from)) !== -1) {
      var end = i + needle.n.length;
      if (!isWordCh(hay.charAt(i - 1))) {
        if (!isWordCh(hay.charAt(end))) return { start: i, end: end };
        if (/[sx]/.test(hay.charAt(end)) && !isWordCh(hay.charAt(end + 1))) return { start: i, end: end + 1 };
      }
      from = i + 1;
    }
    return null;
  }

  function applyGlossary() {
    if (!lesson) return;
    var entries = glossEntries(), used = 0;
    for (var e = 0; e < entries.length && used < GLOSS_MAX; e++) {
      var entry = entries[e], nodes = textNodes(lesson), done = false;
      for (var ni = 0; ni < nodes.length && !done; ni++) {
        for (var k = 0; k < entry.needles.length && !done; k++) {
          var hit = findIn(nodes[ni].nodeValue, entry.needles[k]);
          if (!hit) continue;
          var rest = nodes[ni].splitText(hit.start);
          rest.splitText(hit.end - hit.start);
          var span = document.createElement("span");
          span.className = "gloss";
          span.tabIndex = 0;
          span.setAttribute("data-def", entry.d);
          span.setAttribute("data-term", entry.t);
          span.textContent = rest.nodeValue;
          rest.parentNode.replaceChild(span, rest);
          done = true; used++;
        }
      }
    }
  }
  function removeGlossary() {
    if (!lesson) return;
    var parents = [];
    $$(".gloss", lesson).forEach(function (s) {
      var p = s.parentNode;
      p.replaceChild(document.createTextNode(s.textContent), s);
      if (parents.indexOf(p) === -1) parents.push(p);
    });
    parents.forEach(function (p) { p.normalize(); });
    hideTip();
  }

  var tip = null, tipFor = null, tipAt = 0;
  function showTip(el) {
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "gloss-tip no-print";
      tip.id = "gloss-tip";
      tip.setAttribute("role", "tooltip");
      tip.hidden = true;
      document.body.appendChild(tip);
    }
    tip.innerHTML = "<strong></strong><span></span>";
    tip.firstChild.textContent = el.getAttribute("data-term") || el.textContent;
    tip.lastChild.textContent = el.getAttribute("data-def");
    tip.hidden = false;
    tip.style.visibility = "hidden";
    tip.style.left = "0px"; tip.style.top = "0px";
    var r = el.getClientRects()[0] || el.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, vw - w - 8));
    var top = r.top - h - 8;
    if (top < 8) top = Math.min(r.bottom + 8, vh - h - 8);
    tip.style.left = left + "px";
    tip.style.top = Math.max(8, top) + "px";
    tip.style.visibility = "";
    if (tipFor && tipFor !== el) tipFor.removeAttribute("aria-describedby");
    el.setAttribute("aria-describedby", "gloss-tip");
    tipFor = el; tipAt = Date.now();
  }
  function hideTip() {
    if (tip) tip.hidden = true;
    if (tipFor) { tipFor.removeAttribute("aria-describedby"); tipFor = null; }
  }
  function glossOf(e) { return e.target.closest ? e.target.closest(".gloss") : null; }
  function initGlossEvents() {
    lesson.addEventListener("mouseover", function (e) {
      var g = glossOf(e);
      if (g && g !== tipFor) showTip(g);
    });
    lesson.addEventListener("mouseout", function (e) {
      var g = glossOf(e);
      if (g && !(e.relatedTarget && g.contains(e.relatedTarget))) hideTip();
    });
    lesson.addEventListener("focusin", function (e) { var g = glossOf(e); if (g) showTip(g); });
    lesson.addEventListener("focusout", function (e) { if (glossOf(e)) hideTip(); });
    lesson.addEventListener("click", function (e) {
      var g = glossOf(e);
      if (!g) return;
      if (tipFor === g && Date.now() - tipAt > 350) hideTip(); else showTip(g);
    });
    document.addEventListener("click", function (e) { if (tipFor && !glossOf(e)) hideTip(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); });
    window.addEventListener("scroll", hideTip, { passive: true });
    window.addEventListener("resize", hideTip);
  }

  function initGlossToggle(btn) {
    if (!Array.isArray(window.PHARMA_GLOSSARY) || !window.PHARMA_GLOSSARY.length) { btn.hidden = true; return; }
    var off = !!P.read(GLOSS_OFF_KEY, false);
    function paint() {
      btn.classList.toggle("on", !off);
      btn.setAttribute("aria-pressed", off ? "false" : "true");
      btn.title = off ? "Définitions au survol : désactivées" : "Définitions au survol : activées";
    }
    if (!off) applyGlossary();
    initGlossEvents();
    paint();
    btn.addEventListener("click", function () {
      off = !off;
      if (off) { removeGlossary(); try { localStorage.setItem(GLOSS_OFF_KEY, "true"); } catch (e) {} }
      else { applyGlossary(); try { localStorage.removeItem(GLOSS_OFF_KEY); } catch (e) {} }
      paint();
      toast(off ? "Définitions désactivées" : "Définitions activées");
    });
  }

  /* ---------- Mode révision : cartes à trous ---------- */
  var revisePanel = null;
  function clozeTargets() { return $$(".callout.note strong, .callout.note .cloze-src", lesson); }

  // Sans mots en gras, on masque ce qui suit « = », « → » ou « : », sinon le contenu des parenthèses.
  function autoCloze() {
    var note = $(".callout.note", lesson);
    if (!note || $("strong", note)) return;
    $$("li", note).forEach(function (li) {
      var nodes = [], w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT, null, false), n;
      while ((n = w.nextNode())) nodes.push(n);
      [/(\s(?:=|→|:)\s)([^;.()]+)/g, /(\()([^)]{2,})(?=\))/g].some(function (re) {
        var found = false;
        nodes.forEach(function (tn) {
          var txt = tn.nodeValue, last = 0, m, frag = document.createDocumentFragment();
          re.lastIndex = 0;
          while ((m = re.exec(txt))) {
            var start = m.index + m[1].length;
            var body = m[2], trimmed = body.replace(/\s+$/, "");
            frag.appendChild(document.createTextNode(txt.slice(last, start)));
            var s = document.createElement("span");
            s.className = "cloze-src"; s.textContent = trimmed;
            frag.appendChild(s);
            last = start + trimmed.length;
            found = true;
          }
          if (last) {
            frag.appendChild(document.createTextNode(txt.slice(last)));
            tn.parentNode.replaceChild(frag, tn);
          }
        });
        return found;
      });
    });
  }
  function reviseCount() {
    var all = $$(".cloze", lesson);
    var shown = all.filter(function (c) { return c.classList.contains("revealed"); }).length;
    var el = $(".rev-count", revisePanel);
    if (el) el.textContent = shown + " / " + all.length + " révélé" + (shown > 1 ? "s" : "");
  }
  function setReveal(c, on) {
    c.classList.toggle("revealed", on);
    if (on) c.removeAttribute("aria-label"); else c.setAttribute("aria-label", "Trou à révéler");
    c.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function onClozeClick() { setReveal(this, !this.classList.contains("revealed")); reviseCount(); }
  function onClozeKey(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClozeClick.call(this); }
  }
  function setRevise(btn, on) {
    document.body.classList.toggle("revising", on);
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    revisePanel.hidden = !on;
    clozeTargets().forEach(function (s) {
      if (on) {
        s.classList.add("cloze");
        s.tabIndex = 0; s.setAttribute("role", "button");
        setReveal(s, false);
        s.addEventListener("click", onClozeClick);
        s.addEventListener("keydown", onClozeKey);
      } else {
        s.classList.remove("cloze", "revealed");
        ["tabindex", "role", "aria-label", "aria-pressed"].forEach(function (a) { s.removeAttribute(a); });
        s.removeEventListener("click", onClozeClick);
        s.removeEventListener("keydown", onClozeKey);
      }
    });
    if (on) reviseCount();
  }
  function initRevise(btn) {
    autoCloze();
    if (!clozeTargets().length) { btn.hidden = true; return; }
    revisePanel = document.createElement("div");
    revisePanel.className = "mod-panel rev-panel no-print";
    revisePanel.hidden = true;
    revisePanel.innerHTML =
      '<span class="rev-msg">🙈 Les mots clés des encadrés « À retenir » sont masqués : touche-les pour les révéler.</span>' +
      '<span class="rev-count" role="status" aria-live="polite"></span>' +
      '<button class="btn" id="rev-all" type="button">👁 Tout révéler</button>' +
      '<button class="btn" id="rev-none" type="button">🙈 Tout masquer</button>';
    var toolbar = btn.closest(".mod-tools");
    toolbar.parentNode.insertBefore(revisePanel, toolbar.nextSibling);
    $("#rev-all", revisePanel).addEventListener("click", function () { $$(".cloze", lesson).forEach(function (c) { setReveal(c, true); }); reviseCount(); });
    $("#rev-none", revisePanel).addEventListener("click", function () { $$(".cloze", lesson).forEach(function (c) { setReveal(c, false); }); reviseCount(); });
    btn.addEventListener("click", function () {
      var on = !document.body.classList.contains("revising");
      setRevise(btn, on);
      if (on) { var n = $(".callout.note", lesson); if (n) n.scrollIntoView({ block: "center" }); }
    });
  }

  /* ---------- Favori / marque-page ---------- */
  function initFavorite(btn) {
    var KEY = K.favs || "pharma-favorites";
    var label = (mod && mod.emoji ? mod.emoji + " " : "") + pageTitle;
    function get() { var v = P.read(KEY, []); return Array.isArray(v) ? v : []; }
    function isFav() { return get().some(function (f) { return f.url === pageUrl; }); }
    function paint() {
      var f = isFav();
      btn.textContent = f ? "★ Favori" : "☆ Favori";
      btn.classList.toggle("on", f);
      btn.setAttribute("aria-pressed", f ? "true" : "false");
    }
    btn.addEventListener("click", function () {
      var favs = get();
      if (isFav()) favs = favs.filter(function (f) { return f.url !== pageUrl; });
      else favs.push({ url: pageUrl, title: label });
      P.write(KEY, favs);
      paint();
      toast(isFav() ? "★ Ajouté aux favoris" : "Retiré des favoris");
    });
    paint();
  }

  /* ---------- Dernier module visité (bouton « Reprendre » du portail) ---------- */
  function recordLastModule() {
    if (!doneBtn) return;
    P.write(K.last || "pharma-last-module", { url: pageUrl, title: (mod && mod.emoji ? mod.emoji + " " : "") + pageTitle });
  }

  /* ---------- Retour en haut ---------- */
  function initBackToTop() {
    var btn = document.createElement("button");
    btn.className = "to-top no-print";
    btn.type = "button";
    btn.setAttribute("aria-label", "Revenir en haut");
    btn.textContent = "↑";
    document.body.appendChild(btn);
    function toggle() { btn.classList.toggle("show", window.scrollY > 600); }
    window.addEventListener("scroll", toggle, { passive: true });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    toggle();
  }

  /* ---------- Aide raccourcis + raccourcis clavier ---------- */
  var helpEl = null, helpFocus = null;
  function toggleHelp(show) {
    if (!helpEl) {
      helpEl = document.createElement("div");
      helpEl.className = "kbd-help no-print";
      helpEl.hidden = true;
      helpEl.innerHTML =
        '<div class="kbd-box" role="dialog" aria-modal="true" aria-label="Raccourcis clavier">' +
        '<button class="kbd-x" type="button" aria-label="Fermer">✕</button><h3>⌨️ Raccourcis clavier</h3>' +
        '<dl><dt><kbd>n</kbd> / <kbd>p</kbd></dt><dd>module suivant / précédent</dd>' +
        "<dt><kbd>m</kbd></dt><dd>marquer le module terminé</dd>" +
        "<dt><kbd>s</kbd></dt><dd>ouvrir mes notes</dd>" +
        "<dt><kbd>t</kbd></dt><dd>thème clair / sombre</dd>" +
        "<dt><kbd>/</kbd> ou <kbd>Ctrl</kbd>+<kbd>K</kbd></dt><dd>recherche</dd>" +
        "<dt><kbd>g</kbd> puis <kbd>m</kbd></dt><dd>ouvrir le menu</dd>" +
        "<dt><kbd>?</kbd></dt><dd>afficher / masquer cette aide</dd>" +
        "<dt><kbd>Échap</kbd></dt><dd>fermer</dd></dl></div>";
      document.body.appendChild(helpEl);
      helpEl.addEventListener("click", function (e) { if (e.target === helpEl || e.target.closest(".kbd-x")) toggleHelp(false); });
    }
    helpEl.hidden = !show;
    if (show) { helpFocus = document.activeElement; $(".kbd-x", helpEl).focus(); }
    else if (helpFocus && helpFocus.focus) { helpFocus.focus(); helpFocus = null; }
  }

  function initKeys() {
    var gAt = 0;
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      if (helpEl && !helpEl.hidden) { if (e.key === "Escape" || e.key === "?") toggleHelp(false); return; }
      if ($(".ph-share-ov")) return;
      if (e.key === "?") { e.preventDefault(); toggleHelp(true); return; }
      var key = (e.key || "").toLowerCase();
      if (key === "g") { gAt = Date.now(); return; }
      var afterG = gAt && Date.now() - gAt < 1200;
      gAt = 0;
      if (key === "n") { var nx = $(".pager a.next"); if (nx) location.href = nx.href; }
      else if (key === "p") { var pv = $(".pager a.prev"); if (pv) location.href = pv.href; }
      else if (key === "m" && !afterG && doneBtn) { doneBtn.click(); }
      else if (key === "s" && notesBox) { e.preventDefault(); openNotes(); }
    });
  }

  /* ---------- Impression : solutions dépliées ---------- */
  function initPrint() {
    var closed = [], theme = null, root = document.documentElement;
    window.addEventListener("beforeprint", function () {
      closed = $$("details").filter(function (d) { return !d.open; });
      closed.forEach(function (d) { d.open = true; });
      theme = root.getAttribute("data-theme");
      root.setAttribute("data-theme", "light");
    });
    window.addEventListener("afterprint", function () {
      closed.forEach(function (d) { d.open = false; });
      closed = [];
      if (theme !== null) root.setAttribute("data-theme", theme);
      theme = null;
    });
  }

  /* ---------- Barre d'outils ---------- */
  function buildToolbar(anchor) {
    var ref = anchor || $(".subtitle", lesson) || $("h1", lesson);
    var cheat = modId ? "../aide.html?m=" + encodeURIComponent(modId) : "../aide.html";
    var bar = document.createElement("div");
    bar.className = "mod-tools no-print";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Outils du module");
    bar.innerHTML =
      '<div class="mt-main">' +
      '<button class="btn" id="tool-notes" type="button" aria-controls="mod-notes">📝 Notes</button>' +
      '<button class="btn" id="tool-tts" type="button" aria-pressed="false">🔊 Écouter</button>' +
      '<button class="btn" id="tool-share" type="button">🔗 Partager</button>' +
      '<a class="btn" id="tool-cheat" href="' + esc(cheat) + '">⚡ Antisèche</a>' +
      '<a class="btn" id="tool-gloss-page" href="../glossaire.html">📖 Glossaire</a>' +
      '<button class="btn" id="tool-revise" type="button" aria-pressed="false">🙈 Révision</button>' +
      '<button class="btn mt-more-btn" id="tool-more" type="button" aria-expanded="false" aria-controls="mt-more">⋯ Plus</button>' +
      "</div>" +
      '<div class="mt-more" id="mt-more">' +
      '<button class="btn" id="tool-gloss" type="button" aria-pressed="true">💡 Définitions</button>' +
      (quizSet.length ? '<button class="btn" id="shuffle-quiz" type="button">🔀 Mélanger</button>' : "") +
      (quizSet.length ? '<button class="btn" id="tool-exam" type="button">⏱ Examen</button>' : "") +
      '<button class="btn" id="tool-fav" type="button" aria-pressed="false">☆ Favori</button>' +
      '<button class="btn" id="tool-print" type="button" title="Ouvre l\'impression — choisis « Enregistrer au format PDF »">🖨️ PDF</button>' +
      '<button class="btn" id="tool-keys" type="button">⌨️ Raccourcis</button>' +
      "</div>";
    ref.insertAdjacentElement("afterend", bar);

    notesBox = document.createElement("details");
    notesBox.className = "mod-notes no-print";
    notesBox.id = "mod-notes";
    notesBox.innerHTML =
      "<summary>📝 Mes notes sur ce module</summary>" +
      '<textarea id="notes-area" rows="6" placeholder="Écris ici tes notes perso (sauvegardées sur cet appareil)…" aria-label="Notes personnelles"></textarea>' +
      '<div class="notes-foot"><span id="notes-status" role="status">Sauvegarde auto</span><span id="notes-count"></span>' +
      '<button class="btn" id="notes-copy" type="button">Copier</button><button class="btn" id="notes-clear" type="button">Effacer</button></div>';
    bar.insertAdjacentElement("afterend", notesBox);
    return bar;
  }

  function wireToolbar(bar) {
    function el(id) { return $("#" + id, bar); }
    el("tool-notes").addEventListener("click", function () {
      if (notesBox.open) notesBox.open = false; else openNotes();
    });
    notesBox.addEventListener("toggle", function () {
      el("tool-notes").setAttribute("aria-expanded", notesBox.open ? "true" : "false");
    });
    initTTS(el("tool-tts"));
    el("tool-share").addEventListener("click", function () {
      var api = window.PHShare || window.ESGIShare;
      var url = location.href.split("#")[0];
      if (api) {
        var sections = $$("section.block[id]", lesson).map(function (s) {
          var h = $("h2", s);
          return { id: s.id, title: h ? h.textContent.trim() : s.id };
        });
        api.open(url, pageTitle, { sections: sections });
      } else if (navigator.share) {
        navigator.share({ title: pageTitle, url: url }).catch(function () {});
      }
    });
    initRevise(el("tool-revise"));
    initGlossToggle(el("tool-gloss"));
    initFavorite(el("tool-fav"));
    el("tool-print").addEventListener("click", function () { window.print(); });
    el("tool-keys").addEventListener("click", function () { toggleHelp(true); });
    var more = el("tool-more"), moreBox = el("mt-more");
    more.addEventListener("click", function () {
      var o = !moreBox.classList.contains("open");
      moreBox.classList.toggle("open", o);
      more.setAttribute("aria-expanded", o ? "true" : "false");
      more.textContent = o ? "⋯ Moins" : "⋯ Plus";
    });
    var sh = el("shuffle-quiz");
    if (sh) sh.addEventListener("click", function () {
      shuffleAll();
      sh.textContent = "🔀 Remélangé !";
      setTimeout(function () { sh.textContent = "🔀 Mélanger"; }, 1200);
    });
    var ex = el("tool-exam");
    if (ex) {
      var inExam = examWanted();
      ex.classList.toggle("on", inExam);
      ex.setAttribute("aria-pressed", inExam ? "true" : "false");
      ex.textContent = inExam ? "⏱ Quitter l'examen" : "⏱ Examen";
      ex.addEventListener("click", function () {
        var u = new URL(location.href);
        if (inExam) u.searchParams.delete("exam"); else u.searchParams.set("exam", "1");
        location.href = u.pathname + u.search;
      });
    }
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    setFavicon("💊");
    initContext();
    initReadingProgress();
    paintHomeProgress();
    initBackToTop();
    if (!lesson) return;
    initQuizzes();
    initDoneButton();
    recordLastModule();
    var bar = buildToolbar(initReadingTime());
    initNotes();
    wireToolbar(bar);
    initRecap();
    initExamMode();
    initKeys();
    initPrint();
    if (location.hash.length > 1) {
      window.addEventListener("load", function () {
        var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (t) t.scrollIntoView({ block: "start" });
      });
    }
  });
})();
