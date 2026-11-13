/* =========================================================
   portal.js — Accueil du portail « Préparateur en pharmacie »
   Autonome (aucune dépendance au portail IABD). Lit :
   PHARMA (data.js + common.js), PHARMA_GLOSSARY et PHARMA_CARDS
   (facultatifs : l'accueil fonctionne sans). Thème et menu : nav.js.
   Rend : stats, révision du jour, progression (anneau, streak,
   objectif, heatmap, reprise, favoris, export/import), cartes de
   modules + filtres, bilan, examens J-X, emploi du temps, recherche.
   ========================================================= */
(function () {
  "use strict";

  var P = window.PHARMA;
  if (!P || !P.modules || !P.read) return;
  var K = P.K, MODULES = P.modules, YEARS = P.years, esc = P.esc;

  /* Ancres des sections de chaque module (dans l'ordre de `topics`) */
  var ANCHORS = {
    chimie: ["atome", "liaisons", "solutions", "ph", "orga"],
    anatomie: ["niveaux", "reperes", "loco", "cardio", "respi", "autres"],
    physiologie: ["homeo", "coeur", "respi", "rein", "nerf"],
    galenique: ["pa", "voies", "formes", "excipients", "prep"],
    legislation: ["prepa", "medic", "veneneuses", "ordo", "stup"],
    pharmacologie: ["adme", "demi", "pd", "classes", "interactions"],
    pathologie: ["vocab", "cardio", "diabete", "respi", "infect"],
    toxicologie: ["dose", "medic", "domestique", "cat"],
    diagnostic: ["constantes", "trod", "urine", "dm"]
  };

  function $(id) { return document.getElementById(id); }
  function norm(s) {
    return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
  function plural(n, a, b) { return n > 1 ? (b || a + "s") : a; }
  function safeUrl(u) {
    return typeof u === "string" && u && !/^[a-z][a-z0-9+.\-]*:/i.test(u) && u.indexOf("//") !== 0;
  }
  function modUrl(m) { return m.file; }
  function aideUrl(id) { return "aide.html?m=" + encodeURIComponent(id); }
  function modPlace(m) { return "A" + m.year + " · " + m.title; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function glossary() { return arr(window.PHARMA_GLOSSARY); }
  function allCards() {
    try { if (typeof P.allCards === "function") return arr(P.allCards()); } catch (e) {}
    return arr(window.PHARMA_CARDS);
  }
  function cards() { return allCards(); }
  function plain(s) { return String(s == null ? "" : s).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }
  function daysUntil(dateStr) {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((new Date(dateStr + "T00:00:00") - t) / 86400000);
  }
  function fmtDate(s) {
    try {
      return new Date(s + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    } catch (e) { return s; }
  }
  function matchModule(label) {
    var n = norm(label).trim();
    if (!n) return null;
    for (var i = 0; i < MODULES.length; i++) {
      var m = MODULES[i], t = norm(m.title);
      if (t === n || m.id === n) return m;
    }
    if (n.length < 3) return null;
    for (var j = 0; j < MODULES.length; j++) {
      if (norm(MODULES[j].title).indexOf(n) === 0) return MODULES[j];
    }
    return null;
  }
  function pbar(pct, color) {
    return '<div class="pbar"><span style="width:' + pct + "%;background:" + (color || "var(--primary)") + '"></span></div>';
  }

  /* ---------- Flashcards dues (état SM-2 dans K.cards) ---------- */
  function flashcardsDue() {
    var st = P.read(K.cards, {});
    if (!st || typeof st !== "object") st = {};
    var today = Math.floor(Date.now() / 86400000);
    var bank = allCards(), due = 0, fresh = 0;
    bank.forEach(function (c) {
      var s = st[c.id];
      if (s && typeof s === "object") { if ((s.due || 0) <= today) due++; }
      else fresh++;
    });
    if (typeof P.cardsDue === "function" && bank.length) {
      var all = P.cardsDue();
      if (typeof all === "number" && all !== due + fresh) due = Math.max(0, all - fresh);
    }
    return { due: due, fresh: fresh, total: bank.length };
  }

  /* ---------- Stats & tuiles d'accès rapide ---------- */
  function renderStats() {
    var el = $("stats");
    if (!el) return;
    var quizzes = MODULES.reduce(function (s, m) { return s + m.quizzes; }, 0);
    var exos = MODULES.reduce(function (s, m) { return s + m.exos; }, 0);
    var done = P.getDone();
    var nbDone = MODULES.filter(function (m) { return done[m.id]; }).length;
    var list = [
      [MODULES.length, "Modules"],
      [quizzes, "Quiz"],
      [exos, "Exercices"],
      [nbDone + "/" + MODULES.length, "Terminés"]
    ];
    if (cards().length) list.push([cards().length, "Flashcards"]);
    if (glossary().length) list.push([glossary().length, "Termes"]);
    el.innerHTML = list.map(function (c) {
      return '<div class="stat"><div class="num">' + c[0] + '</div><div class="lbl">' + c[1] + "</div></div>";
    }).join("");
  }

  function renderTiles() {
    var fc = $("qt-fc"), gl = $("qt-gl");
    if (fc) {
      var f = flashcardsDue();
      if (f.due > 0) fc.textContent = f.due + " " + plural(f.due, "carte") + " à revoir";
      else if (f.fresh > 0) fc.textContent = f.fresh + " " + plural(f.fresh, "nouvelle carte", "nouvelles cartes");
    }
    if (gl && glossary().length) gl.textContent = glossary().length + " termes & définitions";
  }

  /* ---------- Reprise, favoris ---------- */
  function getLast() {
    var l = P.read(K.last, null);
    return (l && safeUrl(l.url) && l.title) ? l : null;
  }
  function getFavs() {
    return arr(P.read(K.favs, [])).filter(function (f) { return f && safeUrl(f.url) && f.title; });
  }

  /* ---------- Objectif hebdomadaire, jours actifs ---------- */
  function activeDays() {
    var d = P.read(K.days, {});
    return d && typeof d === "object" ? d : {};
  }
  function getGoal() {
    var g = parseInt(P.read(K.goal, 4), 10);
    return (g >= 1 && g <= 7) ? g : 4;
  }
  function activeDaysThisWeek() {
    var days = activeDays();
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    var n = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday); d.setDate(monday.getDate() + i);
      if (days[P.dstr(d)]) n++;
    }
    return n;
  }
  function buildGoal() {
    var goal = getGoal();
    var done = Math.min(activeDaysThisWeek(), 7);
    var pct = Math.round(Math.min(done, goal) / goal * 100);
    var reached = done >= goal;
    var todayDone = !!activeDays()[P.today()];
    var msg;
    if (reached) msg = "🎉 Objectif de la semaine atteint, bravo ! Chaque jour en plus est du bonus.";
    else if (todayDone) msg = "Encore <b>" + (goal - done) + "</b> " + plural(goal - done, "jour") + " de révision cette semaine pour tenir ton objectif. 💪";
    else msg = "⏰ Tu n'as pas encore révisé aujourd'hui — un petit module suffit pour avancer vers ton objectif.";
    var opts = [1, 2, 3, 4, 5, 6, 7].map(function (n) {
      return '<option value="' + n + '"' + (n === goal ? " selected" : "") + ">" + n + " j/sem.</option>";
    }).join("");
    return '<div class="goal-card' + (reached ? " reached" : "") + '">' +
      '<div class="goal-head"><b>🎯 Objectif de la semaine</b>' +
      '<label class="goal-set">Cible : <select id="goal-select" aria-label="Objectif hebdomadaire">' + opts + "</select></label></div>" +
      '<div class="goal-bar">' + pbar(pct, reached ? "var(--accent)" : "var(--primary)") + "</div>" +
      '<div class="goal-info"><span class="goal-num">' + done + " / " + goal + " jours actifs</span>" +
      '<span class="goal-msg">' + msg + "</span></div></div>";
  }

  /* ---------- Heatmap d'activité (~26 semaines) ---------- */
  var MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  function buildHeatmap() {
    var days = activeDays(), WEEKS = 26;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var end = new Date(today);
    end.setDate(end.getDate() + (6 - ((today.getDay() + 6) % 7)));
    var total = WEEKS * 7, cells = [], activeCount = 0;
    for (var i = total - 1; i >= 0; i--) {
      var d = new Date(end); d.setDate(end.getDate() - i);
      var c = days[P.dstr(d)] || 0;
      if (c > 0 && d <= today) activeCount++;
      var lvl = c >= 10 ? 4 : c >= 6 ? 3 : c >= 3 ? 2 : c >= 1 ? 1 : 0;
      cells.push({ lvl: lvl, future: d > today, month: d.getMonth(),
        label: P.dstr(d) + (c ? " · " + c + " visite(s)" : "") });
    }
    var cols = "", lastMonth = -1;
    for (var w = 0; w < WEEKS; w++) {
      var col = "", first = cells[w * 7];
      var lab = (first.month !== lastMonth && w < WEEKS - 1) ? MONTHS[first.month] : "";
      lastMonth = first.month;
      for (var r = 0; r < 7; r++) {
        var cell = cells[w * 7 + r];
        col += '<span class="hm-cell l' + cell.lvl + (cell.future ? " fut" : "") + '" title="' + cell.label + '"></span>';
      }
      cols += '<div class="hm-col"><span class="hm-mon">' + lab + "</span>" + col + "</div>";
    }
    return '<div class="heatmap-card">' +
      '<div class="hm-head"><b>📅 Calendrier de révision</b><span class="hm-sub">' + activeCount + " " + plural(activeCount, "jour actif", "jours actifs") + " sur ~" + WEEKS + " semaines</span></div>" +
      '<div class="hm-grid" id="hm-grid">' + cols + "</div>" +
      '<div class="hm-legend">Moins <span class="hm-cell l0"></span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span><span class="hm-cell l4"></span> Plus</div></div>';
  }

  /* ---------- Export / import / réinitialisation ---------- */
  var PREFIX = "pharma-";
  var KEEP = [K.theme, K.accent, K.setup];
  function pharmaKeys() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0) keys.push(k);
    }
    return keys;
  }
  function exportProgress() {
    var store = {};
    pharmaKeys().forEach(function (k) { store[k] = localStorage.getItem(k); });
    var data = { _app: "pharma-portal", _v: 1, _date: new Date().toISOString(), store: store };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "progression-pharmacie-" + P.today() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(reader.result); } catch (e) { data = null; }
      if (!data || data._app !== "pharma-portal" || !data.store || typeof data.store !== "object") {
        alert("Fichier invalide. Choisis un export « progression-pharmacie-….json » de ce portail.");
        return;
      }
      if (!confirm("Importer cette progression ? Elle remplacera celle de cet appareil.")) return;
      Object.keys(data.store).forEach(function (k) {
        if (k.indexOf(PREFIX) === 0 && typeof data.store[k] === "string") {
          try { localStorage.setItem(k, data.store[k]); } catch (e) {}
        }
      });
      alert("Progression importée ✅");
      location.reload();
    };
    reader.readAsText(file);
  }
  function resetAll() {
    if (!confirm("Tout effacer : progression, flashcards, notes, favoris, examens, emploi du temps et statistiques de cet appareil ? (le thème et l'accent sont conservés). Cette action est définitive.")) return;
    pharmaKeys().forEach(function (k) { if (KEEP.indexOf(k) < 0) localStorage.removeItem(k); });
    location.reload();
  }

  /* ---------- Tableau de bord ---------- */
  function renderDashboard() {
    var host = $("dash");
    if (!host) return;
    var done = P.getDone();
    var nb = MODULES.filter(function (m) { return done[m.id]; }).length;
    var pct = Math.round(nb / MODULES.length * 100);
    var st = P.getStreak();
    var last = getLast();

    var resume = last ? '<a class="resume" href="' + esc(last.url) + '"><span class="resume-ic">▶️</span>' +
      '<span class="resume-txt"><b>Reprendre où j\'en étais</b><span>' + esc(last.title) + "</span></span>" +
      '<span class="resume-go">Continuer →</span></a>' : "";

    var pills = MODULES.map(function (m) {
      var d = !!done[m.id];
      return '<a class="pd-pill' + (d ? " done" : "") + '" href="' + modUrl(m) + '" title="' + esc(m.title) + '">' +
        (d ? "✓ " : "") + m.emoji + " M" + m.num + "</a>";
    }).join("");
    var next = MODULES.filter(function (m) { return !done[m.id]; })[0];
    var cta = next
      ? 'Prochain : <a href="' + modUrl(next) + '">' + next.emoji + " " + esc(next.title) + "</a>"
      : "🎉 Tous les modules sont terminés. Bravo !";
    var streak = st.count > 0
      ? '<div class="streak" title="Jours de révision consécutifs">🔥 ' + st.count + " j" + (st.best > st.count ? " · record " + st.best : "") + "</div>"
      : "";

    var favs = getFavs();
    var favBlock = favs.length ? '<div class="favs"><h3>⭐ Mes favoris</h3><div class="fav-list">' +
      favs.map(function (f) {
        return '<div class="fav-item"><a href="' + esc(f.url) + '">' + esc(f.title) + "</a>" +
          '<button class="fav-del" data-url="' + esc(f.url) + '" title="Retirer des favoris" aria-label="Retirer des favoris">✕</button></div>';
      }).join("") + "</div></div>" : "";

    host.innerHTML = resume +
      '<div class="pd-main">' +
        '<div class="pd-ringcol"><div class="ring" style="--p:' + pct + '"><div class="ring-in"><div class="ring-pct">' + pct + "<small>%</small></div>" +
        '<div class="ring-lbl">terminé</div></div></div>' + streak + "</div>" +
        '<div class="pd-side"><div class="dh">' + nb + " / " + MODULES.length + " modules terminés</div>" +
        '<div class="ds">' + cta + "</div>" +
        '<div class="pd-pills">' + pills + "</div>" +
        '<div class="pd-actions no-print">' +
          '<button class="btn" id="dash-export" title="Télécharger ma progression (fichier .json)">⬇️ Exporter</button>' +
          '<button class="btn" id="dash-import" title="Charger une progression depuis un fichier .json">⬆️ Importer</button>' +
          '<button class="btn pd-reset" id="dash-reset" title="Effacer toutes mes données locales">↺ Tout effacer</button>' +
        '</div><input type="file" id="dash-file" accept="application/json,.json" hidden /></div>' +
      "</div>" + buildGoal() + buildHeatmap() + favBlock;

    var el = $("dash-export"); if (el) el.addEventListener("click", exportProgress);
    el = $("dash-reset"); if (el) el.addEventListener("click", resetAll);
    var imp = $("dash-import"), file = $("dash-file");
    if (imp && file) {
      imp.addEventListener("click", function () { file.click(); });
      file.addEventListener("change", function () { if (file.files[0]) importProgress(file.files[0]); });
    }
    var sel = $("goal-select");
    if (sel) sel.addEventListener("change", function () {
      P.write(K.goal, parseInt(sel.value, 10));
      renderDashboard(); renderDaily();
    });
    Array.prototype.forEach.call(host.querySelectorAll(".fav-del"), function (b) {
      b.addEventListener("click", function () {
        var url = b.getAttribute("data-url");
        P.write(K.favs, arr(P.read(K.favs, [])).filter(function (f) { return f.url !== url; }));
        renderDashboard();
      });
    });
    var hm = $("hm-grid");
    if (hm) hm.scrollLeft = hm.scrollWidth;
  }

  /* ---------- Filtres par thème & cartes de modules ---------- */
  var activeTheme = null;
  function allThemes() {
    var set = [];
    MODULES.forEach(function (m) { m.themes.forEach(function (t) { if (set.indexOf(t) < 0) set.push(t); }); });
    return set.sort();
  }
  function renderTagbar() {
    var el = $("tagbar");
    if (!el) return;
    var chips = ['<span class="tb-lbl">Filtrer :</span>',
      '<button type="button" class="chip' + (activeTheme === null ? " on" : "") + '" data-th="">Tout</button>'];
    allThemes().forEach(function (t) {
      chips.push('<button type="button" class="chip' + (activeTheme === t ? " on" : "") + '" data-th="' + esc(t) + '">' + esc(t) + "</button>");
    });
    el.innerHTML = chips.join("");
    Array.prototype.forEach.call(el.querySelectorAll(".chip"), function (c) {
      c.addEventListener("click", function () {
        activeTheme = c.getAttribute("data-th") || null;
        renderTagbar();
        applyFilter();
      });
    });
  }
  function cardHTML(m) {
    var done = P.getDone();
    var tags = m.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    var topics = m.topics.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var badge = done[m.id] ? '<div class="status ready">✓ Terminé</div>' : '<div class="status ready">● Disponible</div>';
    return '<a class="card module" data-id="' + m.id + '" data-themes="' + esc(m.themes.join(",")) + '" href="' + modUrl(m) + '">' +
      '<div class="num">A' + m.year + " · Module " + m.num + " · " + m.emoji + (m.star ? " ⭐" : "") + "</div>" +
      "<h3>" + esc(m.title) + "</h3>" +
      '<p style="color:var(--text-soft);font-style:italic;margin:.2em 0 .4em">' + esc(m.subtitle) + "</p>" +
      "<p>" + esc(m.desc) + "</p>" +
      '<ul class="card-topics">' + topics + "</ul>" +
      '<div class="tags">' + tags + "</div>" +
      '<div class="card-meta"><span>📝 ' + m.quizzes + " quiz</span><span>🧩 " + m.exos + " exercices</span><span>📚 " + m.topics.length + " sections</span></div>" +
      badge + "</a>";
  }
  function renderCards() {
    YEARS.forEach(function (y) {
      var grid = $("year" + y.id);
      if (!grid) return;
      grid.innerHTML = MODULES.filter(function (m) { return m.year === y.id; }).map(cardHTML).join("");
    });
  }
  function applyFilter() {
    Array.prototype.forEach.call(document.querySelectorAll(".card.module"), function (card) {
      var themes = (card.getAttribute("data-themes") || "").split(",");
      card.classList.toggle("filtered", !(activeTheme === null || themes.indexOf(activeTheme) >= 0));
    });
    YEARS.forEach(function (y) {
      var head = $("yh" + y.id), grid = $("year" + y.id);
      if (!head || !grid) return;
      var any = grid.querySelector(".card.module:not(.filtered)");
      head.style.display = any ? "" : "none";
      grid.style.display = any ? "" : "none";
    });
  }

  /* ---------- Examens & comptes à rebours (J-X) ---------- */
  function getExams() { return arr(P.read(K.exams, [])).filter(function (e) { return e && e.date && e.name; }); }
  function setExams(l) { P.write(K.exams, l); }
  function nextExam() {
    return getExams().sort(function (a, b) { return a.date.localeCompare(b.date); })
      .filter(function (e) { return daysUntil(e.date) >= 0; })[0] || null;
  }
  function renderExams() {
    var host = $("exams"), sec = $("exams-section");
    if (!host) return;
    if (sec) sec.hidden = false;
    var list = getExams().sort(function (a, b) { return a.date.localeCompare(b.date); });
    var rows = list.map(function (ex) {
      var n = daysUntil(ex.date), badge, cls;
      if (n < 0) { badge = "passé"; cls = "past"; }
      else if (n === 0) { badge = "aujourd'hui"; cls = "today"; }
      else if (n === 1) { badge = "J‑1"; cls = "soon"; }
      else { badge = "J‑" + n; cls = n <= 7 ? "soon" : "far"; }
      var m = ex.m ? P.byId(ex.m) : null;
      return '<div class="exam-row ' + cls + '"><span class="exam-cd">' + badge + "</span>" +
        '<span class="exam-main"><b>' + (m ? m.emoji + " " : "") + esc(ex.name) + '</b><span class="exam-date">' + fmtDate(ex.date) + "</span></span>" +
        '<button class="exam-del" data-id="' + esc(ex.id) + '" title="Supprimer" aria-label="Supprimer">✕</button></div>';
    }).join("");
    var opts = '<option value="">Module (facultatif)</option>' + MODULES.map(function (m) {
      return '<option value="' + m.id + '">' + m.emoji + " " + esc(m.title) + "</option>";
    }).join("");
    host.innerHTML = '<div class="exams-box">' +
      (list.length ? '<div class="exam-list">' + rows + "</div>" : '<p class="exam-empty">Aucun examen pour l\'instant. Ajoute ta première date de partiel 👇</p>') +
      '<form class="exam-form" id="exam-form">' +
      '<input type="text" id="exam-name" placeholder="Intitulé (ex. Partiel de pharmacologie)" maxlength="80" aria-label="Intitulé de l\'examen" />' +
      '<select id="exam-mod" aria-label="Module concerné">' + opts + "</select>" +
      '<input type="date" id="exam-date" min="' + P.today() + '" required aria-label="Date de l\'examen" />' +
      '<button type="submit" class="btn primary">+ Ajouter</button></form></div>';
    var form = $("exam-form");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var mid = $("exam-mod").value, mod = mid ? P.byId(mid) : null;
      var name = ($("exam-name").value || "").trim() || (mod ? "Partiel — " + mod.title : "");
      var date = $("exam-date").value;
      if (!name || !date) { $("exam-name").focus(); return; }
      var l = getExams();
      var entry = { id: "e" + Date.now().toString(36), name: name, date: date };
      if (mod) entry.m = mod.id;
      l.push(entry);
      setExams(l);
      renderExams(); renderDaily();
    });
    Array.prototype.forEach.call(host.querySelectorAll(".exam-del"), function (b) {
      b.addEventListener("click", function () {
        setExams(getExams().filter(function (x) { return x.id !== b.getAttribute("data-id"); }));
        renderExams(); renderDaily();
      });
    });
  }

  /* ---------- Emploi du temps ---------- */
  var DOW = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  function getTimetable() { return arr(P.read(K.timetable, [])).filter(function (e) { return e && e.label; }); }
  function setTimetable(l) { P.write(K.timetable, l); }
  function ttTimeToMin(t) { var m = /^(\d{1,2}):(\d{2})/.exec(t || ""); return m ? (+m[1] * 60 + +m[2]) : null; }
  function nextClassDay(entries) {
    var now = new Date(), dow = now.getDay(), nowMin = now.getHours() * 60 + now.getMinutes();
    for (var off = 0; off <= 7; off++) {
      var d = (dow + off) % 7;
      var day = entries.filter(function (e) { return e.day === d; });
      if (!day.length) continue;
      if (off === 0) {
        day = day.filter(function (e) { var tm = ttTimeToMin(e.time); return tm === null || tm >= nowMin; });
        if (!day.length) continue;
      }
      day = day.slice().sort(function (a, b) {
        var ta = ttTimeToMin(a.time), tb = ttTimeToMin(b.time);
        return (ta === null ? 1e9 : ta) - (tb === null ? 1e9 : tb);
      });
      return { offset: off, day: d, entries: day };
    }
    return null;
  }
  function entryModule(e) { return (e.code && P.byId(e.code)) || matchModule(e.label); }
  function renderTimetable() {
    var host = $("timetable"), sec = $("timetable-section");
    if (!host) return;
    if (sec) sec.hidden = false;
    var tt = getTimetable(), next = nextClassDay(tt), suggestion;
    if (next) {
      var when = next.offset === 0 ? "aujourd'hui" : next.offset === 1 ? "demain" : (next.offset === 7 ? "dans une semaine" : "dans " + next.offset + " jours");
      var rows = next.entries.map(function (e) {
        var m = entryModule(e);
        var links = m ? '<a class="tt-go" href="' + modUrl(m) + '">Réviser →</a> <a class="tt-aide" href="' + aideUrl(m.id) + '">⚡ Antisèche</a>' : "";
        var meta = (e.time || "") + (m ? "" : (e.time ? " · " : "") + "pas de module en ligne");
        return '<div class="daily-item"><div class="di-main"><span class="di-ic">' + (m ? m.emoji : "📘") + '</span><span class="di-txt"><b>' + esc(e.label) +
          "</b><span>" + esc(meta) + "</span></span></div>" + (links ? '<span class="tt-links">' + links + "</span>" : "") + "</div>";
      }).join("");
      suggestion = '<div class="tt-next"><div class="tt-next-head">🎒 <b>' + DOW[next.day] + '</b> <span class="tt-when">' + when + "</span> — révise :</div>" + rows + "</div>";
    } else {
      suggestion = '<p class="tt-empty">Ajoute tes cours ci-dessous : je te proposerai ensuite, à chaque visite, de réviser les modules de ta prochaine journée. 👇</p>';
    }
    var dayOpts = [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<option value="' + d + '">' + DOW[d] + "</option>"; }).join("");
    var data = MODULES.map(function (m) { return '<option value="' + esc(m.title) + '"></option>'; }).join("");
    var list = tt.slice().sort(function (a, b) {
      return ((a.day === 0 ? 7 : a.day) - (b.day === 0 ? 7 : b.day)) || (a.time || "").localeCompare(b.time || "");
    }).map(function (e) {
      return '<div class="tt-row"><span class="tt-rday">' + (DOW[e.day] || "?").slice(0, 3) + '.</span><span class="tt-rsubj">' + esc(e.label) +
        '</span><span class="tt-rtime">' + esc(e.time || "") + '</span><button class="tt-del" data-id="' + esc(e.id) + '" title="Supprimer" aria-label="Supprimer">✕</button></div>';
    }).join("");
    host.innerHTML = suggestion +
      '<details class="tt-editor"' + (tt.length ? "" : " open") + "><summary>🗓️ Mon emploi du temps" + (tt.length ? " (" + tt.length + " cours)" : "") + "</summary>" +
      '<div class="tt-list">' + (list || '<p class="tt-empty">Aucun cours enregistré pour l\'instant.</p>') + "</div>" +
      '<form class="tt-form" id="tt-form"><select id="tt-day" aria-label="Jour de la semaine">' + dayOpts + "</select>" +
      '<input id="tt-subj" list="tt-subjects" placeholder="Matière (ex. Pharmacologie…)" autocomplete="off" maxlength="60" required />' +
      '<datalist id="tt-subjects">' + data + "</datalist>" +
      '<input id="tt-time" type="time" aria-label="Heure (facultatif)" />' +
      '<button type="submit" class="btn primary">+ Ajouter</button></form>' +
      '<p class="tt-note">🔒 Enregistré uniquement sur cet appareil, réutilisé à chaque visite.</p></details>';
    var form = $("tt-form");
    if (form) form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var label = ($("tt-subj").value || "").trim();
      if (!label) return;
      var m = matchModule(label), l = getTimetable();
      l.push({ id: "t" + Date.now().toString(36), day: +$("tt-day").value, label: label, code: m ? m.id : undefined, time: $("tt-time").value || "" });
      setTimetable(l);
      renderTimetable(); renderDaily();
    });
    Array.prototype.forEach.call(host.querySelectorAll(".tt-del"), function (b) {
      b.addEventListener("click", function () {
        setTimetable(getTimetable().filter(function (x) { return x.id !== b.getAttribute("data-id"); }));
        renderTimetable(); renderDaily();
      });
    });
  }

  /* ---------- Révision du jour ---------- */
  function dItem(ic, title, sub, href, extra, cls) {
    var inner = '<span class="di-ic">' + ic + '</span><span class="di-txt"><b>' + esc(title) + "</b><span>" + esc(sub) + "</span></span>";
    var main = href ? '<a class="di-main" href="' + esc(href) + '">' + inner + '<span class="di-go">→</span></a>' : '<div class="di-main">' + inner + "</div>";
    return '<div class="daily-item' + (cls ? " " + cls : "") + '">' + main + (extra || "") + "</div>";
  }
  function renderDaily() {
    var host = $("daily"), sec = $("daily-section");
    if (!host) return;
    var items = [], done = P.getDone(), ne = nextExam();

    if (ne) {
      var n = daysUntil(ne.date), em = ne.m ? P.byId(ne.m) : null;
      var extra = em ? '<span class="tt-links"><a class="tt-go" href="' + modUrl(em) + '">Réviser →</a> <a class="tt-aide" href="' + aideUrl(em.id) + '">⚡ Antisèche</a></span>' : "";
      items.push(dItem("⏰", ne.name, n === 0 ? "c'est aujourd'hui !" : "dans " + n + " " + plural(n, "jour"), null, extra, n <= 3 ? "urgent" : ""));
    }
    var last = getLast();
    if (last) items.push(dItem("▶️", "Reprendre", last.title, last.url));

    var todo = MODULES.filter(function (m) { return !done[m.id]; });
    var picks = [];
    if (ne && ne.m && !done[ne.m] && P.byId(ne.m)) picks.push(P.byId(ne.m));
    todo.forEach(function (m) { if (picks.length < 2 && picks.indexOf(m) < 0) picks.push(m); });
    var nbDone = MODULES.length - todo.length;
    picks.forEach(function (m) {
      items.push(dItem(m.emoji, m.title, "Module " + m.num + " · " + nbDone + "/" + MODULES.length + " terminés", modUrl(m),
        '<span class="tt-links"><a class="tt-aide" href="' + aideUrl(m.id) + '">⚡ Antisèche</a></span>'));
    });
    if (!todo.length) items.push(dItem("🎉", "Tous les modules sont terminés", "Entretiens-les avec les flashcards et l'examen blanc.", "examen.html"));

    var f = flashcardsDue(), sub;
    if (f.due > 0) sub = f.due + " " + plural(f.due, "carte planifiée", "cartes planifiées") + " à revoir" + (f.fresh ? " · " + f.fresh + " " + plural(f.fresh, "nouvelle") : "");
    else if (f.fresh > 0) sub = f.fresh + " " + plural(f.fresh, "nouvelle carte", "nouvelles cartes") + " à découvrir";
    else sub = "Révise tes cartes du jour";
    items.push(dItem("🗂️", "Flashcards", sub, "flashcards.html"));

    if (sec) sec.hidden = false;
    host.innerHTML = '<div class="daily-box">' + items.join("") + "</div>";
  }

  /* ---------- Bilan hebdomadaire & points faibles ---------- */
  function renderInsights() {
    var host = $("insights"), sec = $("insights-section");
    if (!host) return;
    var act = arr(P.read(K.activity, [])).filter(function (e) { return e && typeof e.t === "number"; });
    if (!act.length) { if (sec) sec.hidden = true; return; }
    var weekAgo = Date.now() - 7 * 864e5;
    var week = act.filter(function (e) { return e.t >= weekAgo; });
    var modW = week.filter(function (e) { return e.k === "done" || e.k === "module"; }).length;
    var quizW = week.filter(function (e) { return e.k === "quiz"; });
    var okW = quizW.filter(function (e) { return e.ok; }).length;
    var seen = {};
    week.forEach(function (e) { seen[new Date(e.t).toDateString()] = 1; });
    var nDays = Object.keys(seen).length;
    var rate = quizW.length ? Math.round(okW / quizW.length * 100) : null;
    function stat(v, l) { return '<div class="ins-stat"><b>' + v + "</b><span>" + l + "</span></div>"; }
    var html = '<div class="ins-week">' +
      stat(modW, plural(modW, "module terminé", "modules terminés")) +
      stat(quizW.length, plural(quizW.length, "quiz répondu", "quiz répondus")) +
      (rate !== null ? stat(rate + "%", "de réussite") : "") +
      stat(nDays, plural(nDays, "jour actif", "jours actifs")) + "</div>";

    var by = {};
    act.forEach(function (e) {
      if (e.k !== "quiz" || !e.m) return;
      var b = by[e.m] || (by[e.m] = { ok: 0, t: 0 });
      b.t++; if (e.ok) b.ok++;
    });
    var stats = Object.keys(by).filter(function (id) { return P.byId(id); }).map(function (id) {
      return { m: P.byId(id), ok: by[id].ok, t: by[id].t, pct: Math.round(by[id].ok / by[id].t * 100) };
    }).sort(function (a, b) { return a.pct - b.pct; });
    var weak = stats.filter(function (x) { return x.t >= 3 && x.pct < 70; }).slice(0, 3);
    if (weak.length) {
      html += '<h3 class="ins-h">🎯 À retravailler en priorité</h3>' + weak.map(function (w) {
        return dItem(w.m.emoji, w.m.title, w.pct + "% de réussite aux quiz (" + w.ok + "/" + w.t + ")", modUrl(w.m),
          '<span class="tt-links"><a class="tt-aide" href="' + aideUrl(w.m.id) + '">⚡ Antisèche</a></span>');
      }).join("");
    } else {
      html += '<p class="ins-none">' + (stats.length ? "Aucun point faible détecté pour l'instant : continue comme ça ! 💪" : "Réponds aux quiz des modules : je repèrerai ici tes points faibles. 💪") + "</p>";
    }
    if (stats.length) {
      html += '<h3 class="ins-h">📊 Réussite aux quiz par module</h3><div class="ins-bars">' + stats.map(function (s) {
        return '<a class="ins-bar" href="' + modUrl(s.m) + '"><span class="ib-l">' + s.m.emoji + " " + esc(s.m.title) + '</span><span class="ib-b">' +
          pbar(s.pct, s.pct < 50 ? "var(--danger)" : s.pct < 70 ? "var(--accent-2)" : "var(--success)") + '</span><span class="ib-p">' + s.pct + "%</span></a>";
      }).join("") + "</div>";
    }
    if (sec) sec.hidden = false;
    host.innerHTML = html;
  }

  /* ---------- Recherche globale avancée ---------- */
  var TYPES = [
    ["module", "Module", "📚"], ["section", "Section", "📑"], ["notion", "Notion", "🏷️"],
    ["glossaire", "Glossaire", "📖"], ["flashcard", "Flashcard", "🗂️"], ["antiseche", "Antisèche", "⚡"]
  ];
  function typeInfo(t) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i][0] === t) return TYPES[i]; return TYPES[0]; }
  function cut(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

  function buildIndex() {
    var idx = [];
    function add(type, t, mod, url, nk, ns, snip) {
      idx.push({ type: type, t: t, mod: mod, url: url, nt: norm(t), nk: norm(nk), ns: norm(ns), snip: snip || "" });
    }
    MODULES.forEach(function (m) {
      add("module", m.title, m, modUrl(m), m.tags.join(" ") + " " + m.themes.join(" ") + " " + m.subtitle, m.desc, m.subtitle);
      var anc = ANCHORS[m.id] || [];
      m.topics.forEach(function (t, i) {
        add("section", t, m, modUrl(m) + (anc[i] ? "#" + anc[i] : ""), m.title, "");
      });
      m.tags.forEach(function (t) { add("notion", t, m, modUrl(m), m.title, ""); });
      add("antiseche", "Antisèche — " + m.title, m, aideUrl(m.id), m.tags.join(" ") + " aide-memoire fiche resume", "");
    });
    glossary().forEach(function (g) {
      if (!g || !g.t) return;
      var m = g.m ? P.byId(g.m) : null;
      add("glossaire", plain(g.t), m, "glossaire.html?q=" + encodeURIComponent(plain(g.t)), m ? m.title : "", plain(g.d), plain(g.d));
    });
    cards().forEach(function (c) {
      if (!c || !c.q) return;
      var m = P.byId(c.deck);
      add("flashcard", plain(c.q), m, "flashcards.html" + (m ? "?d=" + encodeURIComponent(m.id) : ""), (m ? m.title : "") + " " + (c.deck || ""), plain(c.a), plain(c.a));
    });
    return idx;
  }

  function highlight(text, tokens) {
    var n = "", map = [], i, j, c;
    for (i = 0; i < text.length; i++) {
      c = norm(text.charAt(i));
      for (j = 0; j < c.length; j++) { n += c.charAt(j); map.push(i); }
    }
    var ranges = [];
    tokens.forEach(function (tk) {
      if (!tk) return;
      var at = n.indexOf(tk);
      while (at >= 0) {
        if (tk.length > 1 || at === 0 || n.charAt(at - 1) === " ") ranges.push([map[at], map[at + tk.length - 1] + 1]);
        at = n.indexOf(tk, at + tk.length);
      }
    });
    if (!ranges.length) return esc(text);
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [ranges[0]];
    for (i = 1; i < ranges.length; i++) {
      var last = merged[merged.length - 1];
      if (ranges[i][0] <= last[1]) last[1] = Math.max(last[1], ranges[i][1]);
      else merged.push(ranges[i]);
    }
    var out = "", pos = 0;
    merged.forEach(function (r) {
      out += esc(text.slice(pos, r[0])) + "<mark>" + esc(text.slice(r[0], r[1])) + "</mark>";
      pos = r[1];
    });
    return out + esc(text.slice(pos));
  }

  function initSearch() {
    var input = $("search-input"), panel = $("search-results");
    if (!input || !panel) return;
    var idx = buildIndex();
    var filt = { type: "", year: 0, mod: "" };
    var active = -1, MAX = 20;

    function has(h, tk) { return tk.length < 2 ? (h.indexOf(tk) === 0 || h.indexOf(" " + tk) >= 0) : h.indexOf(tk) >= 0; }
    function score(it, tokens) {
      var sc = 0;
      for (var i = 0; i < tokens.length; i++) {
        var tk = tokens[i];
        if (it.nt === tk) sc += 20;
        else if (it.nt.indexOf(tk) === 0) sc += 10;
        else if (it.nt.indexOf(" " + tk) >= 0) sc += 8;
        else if (has(it.nt, tk)) sc += 6;
        else if (has(it.nk, tk)) sc += 3;
        else if (has(it.ns, tk)) sc += 2;
        else return -1;
      }
      if (it.type === "module") sc += 3;
      else if (it.type === "section") sc += 1;
      return sc;
    }
    function passes(it, ignoreType) {
      if (!ignoreType && filt.type && it.type !== filt.type) return false;
      if (filt.year && !(it.mod && it.mod.year === filt.year)) return false;
      if (filt.mod && !(it.mod && it.mod.id === filt.mod)) return false;
      return true;
    }
    function run(q) {
      var tokens = norm(q).split(/\s+/).filter(Boolean);
      var hasFilter = !!(filt.type || filt.year || filt.mod);
      var res = [], seen = {};
      idx.forEach(function (it) {
        if (!passes(it, true)) return;
        var sc = tokens.length ? score(it, tokens) : 0;
        if (sc < 0) return;
        var key = it.type + "|" + it.nt + "|" + (it.mod ? it.mod.id : "");
        if (seen[key]) return;
        seen[key] = 1;
        res.push({ it: it, sc: sc });
      });
      if (tokens.length) res.sort(function (a, b) { return b.sc - a.sc || a.it.nt.length - b.it.nt.length; });
      return { tokens: tokens, res: res, active: !!(tokens.length || hasFilter) };
    }

    function filtersHTML(counts, total) {
      var h = '<div class="sr-filters"><div class="sr-row"><button type="button" class="sr-chip' + (filt.type ? "" : " on") + '" data-type="">Tout (' + total + ")</button>";
      TYPES.forEach(function (t) {
        var n = counts[t[0]] || 0;
        if (!n && filt.type !== t[0]) return;
        h += '<button type="button" class="sr-chip' + (filt.type === t[0] ? " on" : "") + '" data-type="' + t[0] + '">' + t[2] + " " + t[1] + " (" + n + ")</button>";
      });
      h += '</div><div class="sr-row">';
      YEARS.forEach(function (y) {
        h += '<button type="button" class="sr-chip' + (filt.year === y.id ? " on" : "") + '" data-year="' + y.id + '">Année ' + y.id + "</button>";
      });
      h += '<select class="sr-mod" aria-label="Filtrer par module"><option value="">Tous les modules</option>';
      MODULES.forEach(function (m) {
        h += '<option value="' + m.id + '"' + (filt.mod === m.id ? " selected" : "") + ">" + m.emoji + " " + esc(m.title) + "</option>";
      });
      return h + "</select></div></div>";
    }

    function render() {
      var q = input.value, r = run(q);
      active = -1;
      var counts = {}, all = [];
      r.res.forEach(function (x) { counts[x.it.type] = (counts[x.it.type] || 0) + 1; });
      all = filt.type ? r.res.filter(function (x) { return x.it.type === filt.type; }) : r.res;
      var shown = all.slice(0, MAX);
      var body;
      if (!r.active) {
        body = '<div class="sr-empty">Tape un mot (ex. « paracétamol », « pH », « liste I ») ou choisis un filtre.</div>';
      } else if (!shown.length) {
        body = '<div class="sr-empty">Aucun résultat' + (q.trim() ? " pour « " + esc(q.trim()) + " »" : "") + ". Essaie un autre mot ou retire un filtre.</div>";
      } else {
        body = shown.map(function (x, i) {
          var it = x.it, ti = typeInfo(it.type);
          var place = it.mod ? modPlace(it.mod) : "";
          var snip = it.snip && (it.type === "glossaire" || it.type === "flashcard") ? '<span class="sr-snip">' + esc(cut(it.snip, 90)) + "</span>" : "";
          return '<a class="sr-item" href="' + esc(it.url) + '" data-i="' + i + '">' +
            '<span class="sr-emoji">' + (it.mod ? it.mod.emoji : ti[2]) + "</span>" +
            '<span class="sr-txt"><span class="sr-t">' + highlight(it.t, r.tokens) + "</span>" +
            '<span class="sr-meta">' + ti[1] + (place ? " · " + esc(place) : "") + "</span>" + snip + "</span>" +
            '<span class="sr-go">↵</span></a>';
        }).join("");
        body += '<div class="sr-foot">' + shown.length + (all.length > shown.length ? " sur " + all.length : "") + " " + plural(all.length, "résultat") +
          " · ↑↓ naviguer · Entrée ouvrir · Échap fermer</div>";
      }
      panel.innerHTML = filtersHTML(counts, r.res.length) + '<div class="sr-list">' + body + "</div>";
      panel.hidden = false;
    }

    function setActive(n) {
      var items = panel.querySelectorAll(".sr-item");
      if (!items.length) return;
      active = (n + items.length) % items.length;
      Array.prototype.forEach.call(items, function (el, i) { el.classList.toggle("active", i === active); });
      items[active].scrollIntoView({ block: "nearest" });
    }

    panel.addEventListener("mousedown", function (e) {
      if (e.target.closest && e.target.closest(".sr-chip")) e.preventDefault();
    });
    panel.addEventListener("click", function (e) {
      var chip = e.target.closest ? e.target.closest(".sr-chip") : null;
      if (!chip) return;
      e.preventDefault(); e.stopPropagation();
      if (chip.hasAttribute("data-year")) {
        var y = parseInt(chip.getAttribute("data-year"), 10);
        filt.year = filt.year === y ? 0 : y;
      } else {
        filt.type = chip.getAttribute("data-type") || "";
      }
      render();
    });
    panel.addEventListener("change", function (e) {
      if (e.target.classList && e.target.classList.contains("sr-mod")) { filt.mod = e.target.value; render(); }
    });

    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", function (ev) {
      var items = panel.querySelectorAll(".sr-item");
      if (ev.key === "ArrowDown") { ev.preventDefault(); setActive(active + 1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); setActive(active - 1); }
      else if (ev.key === "Enter") {
        var go = active >= 0 ? items[active] : items[0];
        if (go) { ev.preventDefault(); window.location.href = go.getAttribute("href"); }
      } else if (ev.key === "Escape") { input.value = ""; panel.hidden = true; input.blur(); }
    });
    document.addEventListener("keydown", function (ev) {
      var el = document.activeElement || {};
      var typing = /^(input|textarea|select)$/i.test(el.tagName || "") || el.isContentEditable;
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === "k" || ev.key === "K")) {
        ev.preventDefault(); input.focus(); input.select();
      } else if (ev.key === "/" && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        ev.preventDefault(); input.focus();
      }
    });
    document.addEventListener("click", function (ev) {
      if (!ev.target.closest || !ev.target.closest(".search-wrap")) panel.hidden = true;
    });

    function focusFromHash() {
      if (/#recherche$/.test(location.hash)) {
        var w = $("recherche");
        if (w && w.scrollIntoView) w.scrollIntoView({ block: "center" });
        input.focus();
      }
    }
    focusFromHash();
    window.addEventListener("hashchange", focusFromHash);
  }

  /* ---------- Boot ---------- */
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }
  function renderDynamic() {
    safe(renderStats); safe(renderTiles); safe(renderDaily); safe(renderDashboard);
    safe(renderCards); safe(applyFilter); safe(renderInsights); safe(renderExams); safe(renderTimetable);
  }
  function boot() {
    renderDynamic();
    safe(renderTagbar);
    safe(initSearch);
    window.addEventListener("pageshow", function (e) { if (e.persisted) renderDynamic(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
