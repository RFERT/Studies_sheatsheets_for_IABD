/* =========================================================
   common.js — Utilitaires partagés du portail Pharmacie
   Chargé APRÈS data.js, AVANT nav.js et les scripts de page.
   Étend window.PHARMA avec :
     PHARMA.root            URL absolue du dossier du portail (finit par "/")
     PHARMA.K               noms des clés localStorage (TOUTES préfixées pharma-)
     PHARMA.read(k, def)    JSON.parse(localStorage[k]) ou def
     PHARMA.write(k, v)     JSON.stringify -> localStorage (silencieux si erreur)
     PHARMA.dstr(date)      "YYYY-MM-DD"
     PHARMA.today()         dstr(new Date())
     PHARMA.recordActiveDay()   +1 pour aujourd'hui dans K.days
     PHARMA.updateStreak()      met à jour K.streak, retourne {last,count,best}
     PHARMA.getStreak()
     PHARMA.logActivity(e)      ajoute {t:Date.now(), ...e} à K.activity (max 600)
     PHARMA.getDone()           doneMap des modules {id:true}
     PHARMA.setDone(id, bool)
     PHARMA.esc(s)              échappement HTML
   Stockage 100 % local (rien n'est envoyé à un serveur).
   ========================================================= */
(function () {
  "use strict";
  var P = window.PHARMA = window.PHARMA || {};

  var cs = document.currentScript;
  P.root = cs && cs.src ? cs.src.replace(/assets\/common\.js(\?.*)?$/, "") : "";

  P.K = {
    theme: "pharma-theme",
    accent: "pharma-accent",
    done: "pharma-done-modules",
    streak: "pharma-streak",
    days: "pharma-active-days",
    goal: "pharma-weekly-goal",
    cards: "pharma-flashcards",
    favs: "pharma-favorites",
    last: "pharma-last-module",
    exams: "pharma-exams",
    timetable: "pharma-timetable",
    activity: "pharma-activity",
    notesPrefix: "pharma-notes-",
    setup: "pharma-setup-done"
  };

  P.read = function (k, def) {
    try {
      var v = JSON.parse(localStorage.getItem(k));
      return v === null || v === undefined ? def : v;
    } catch (e) { return def; }
  };
  P.write = function (k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  };
  P.esc = function (s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  P.dstr = function (d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };
  P.today = function () { return P.dstr(new Date()); };

  P.recordActiveDay = function () {
    var days = P.read(P.K.days, {});
    if (!days || typeof days !== "object") days = {};
    var k = P.today();
    days[k] = (days[k] || 0) + 1;
    P.write(P.K.days, days);
  };

  P.getStreak = function () {
    var s = P.read(P.K.streak, null);
    return (s && typeof s === "object") ? s : { last: null, count: 0, best: 0 };
  };
  P.updateStreak = function () {
    var s = P.getStreak();
    var today = P.today();
    if (s.last !== today) {
      var y = new Date(); y.setDate(y.getDate() - 1);
      s.count = (s.last === P.dstr(y)) ? (s.count || 0) + 1 : 1;
      s.last = today;
    }
    s.best = Math.max(s.best || 0, s.count);
    P.write(P.K.streak, s);
    return s;
  };

  P.logActivity = function (entry) {
    var l = P.read(P.K.activity, []);
    if (!Array.isArray(l)) l = [];
    entry = entry || {};
    entry.t = Date.now();
    l.push(entry);
    if (l.length > 600) l = l.slice(l.length - 600);
    P.write(P.K.activity, l);
  };

  P.getDone = function () {
    var d = P.read(P.K.done, {});
    return (d && typeof d === "object") ? d : {};
  };
  P.setDone = function (id, val) {
    var d = P.getDone();
    if (val) d[id] = true; else delete d[id];
    P.write(P.K.done, d);
  };

  // Streak + jour actif : une fois par chargement de page (comme le portail IABD)
  P.updateStreak();
  P.recordActiveDay();
})();
