/* =========================================================
   pk.js — Simulateur de pharmacocinétique (portail Pharmacie, autonome)
   Monte les blocs <figure class="pk-viz" data-opts='{"preset":"…"}'>.
   Modèle à 1 compartiment, élimination d'ordre 1 :
     IV bolus : C(t) = (D / V) · e^(−ke·t)
     Orale    : C(t) = F·D·ka / (V·(ka − ke)) · (e^(−ke·t) − e^(−ka·t))   (Bateman)
   Prises répétées : superposition des prises. ke = ln 2 / t½.
   Médicament FICTIF (V = 40 L, fenêtre 4–10 mg/L) : support pédagogique.
   ========================================================= */
(function () {
  "use strict";
  if (window.PK) return;

  var PRESETS = {
    demi: { voie: "orale", dose: 200, thalf: 6, tau: 6, n: 8, F: 80 },
    adme: { voie: "iv", dose: 300, thalf: 6, tau: 24, n: 1, F: 80 },
    accumulation: { voie: "orale", dose: 250, thalf: 12, tau: 8, n: 10, F: 80 },
    surdosage: { voie: "orale", dose: 200, thalf: 6, tau: 6, n: 8, F: 80, renal: true }
  };
  var V = 40, KA = 1.2, CME = 4, CMT = 10;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmt(x, d) { if (!isFinite(x)) return "—"; var p = Math.pow(10, d == null ? 2 : d); return String(Math.round(x * p) / p).replace(".", ","); }
  function range(min, max, step, val) { var i = el("input"); i.type = "range"; i.min = min; i.max = max; i.step = step; i.value = val; return i; }
  function ctl(label, input, out) {
    var w = el("label", "pk-ctl"); w.appendChild(el("span", "pk-lbl", label)); w.appendChild(input); if (out) w.appendChild(out); return w;
  }
  function check(on) { var c = el("input"); c.type = "checkbox"; c.checked = !!on; return c; }
  function select(opts, val) {
    var s = el("select");
    opts.forEach(function (o) { var op = el("option"); op.value = o[0]; op.textContent = o[1]; if (o[0] === val) op.selected = true; s.appendChild(op); });
    return s;
  }
  function css(node) {
    var cs = getComputedStyle(node);
    function v(n, d) { var x = cs.getPropertyValue(n).trim(); return x || d; }
    return { text: v("--text", "#e8ebff"), soft: v("--text-soft", "#a9b0d6"), muted: v("--muted", "#7b84b0"), border: v("--border", "#2c3358"),
      card: v("--bg-card", "#1b1f38"), primary: v("--primary", "#22c39a"), red: "#ff6b81", orange: "#ffb454", green: "#22c39a" };
  }

  function conc(t, s) {
    var ke = Math.LN2 / (s.renal ? s.thalf * 2 : s.thalf), c = 0;
    for (var i = 0; i < s.n; i++) {
      var ti = i * s.tau, d = (i === 0 && s.charge ? 2 : 1) * s.dose, dt = t - ti;
      if (dt < 0) break;
      if (s.voie === "iv") c += d / V * Math.exp(-ke * dt);
      else c += (s.F / 100) * d * KA / (V * (KA - ke)) * (Math.exp(-ke * dt) - Math.exp(-KA * dt));
    }
    return c;
  }

  function Widget(fig) {
    var o = {};
    try { o = JSON.parse(fig.getAttribute("data-opts") || "{}") || {}; } catch (e) {}
    var p = PRESETS[o.preset] || PRESETS.demi, s = {};
    Object.keys(p).forEach(function (k) { s[k] = p[k]; });
    s.charge = !!o.charge; s.renal = !!p.renal;
    var body = el("div", "pk-body");
    var fb = fig.querySelector(".pk-fallback");
    if (fb) fig.replaceChild(body, fb); else fig.insertBefore(body, fig.firstChild);
    var cv = el("canvas", "pk-canvas"); cv.setAttribute("role", "img");
    cv.setAttribute("aria-label", "Concentration plasmatique en fonction du temps avec la fenêtre thérapeutique");
    body.appendChild(cv);
    var ctls = el("div", "pk-ctls"), out = el("div", "pk-out");
    out.setAttribute("aria-live", "polite");
    var sV = select([["orale", "Orale (comprimé)"], ["iv", "Intraveineuse (bolus)"]], s.voie);
    var rD = range(100, 1000, 50, s.dose), oD = el("output", "pk-val");
    var rH = range(1, 24, 1, s.thalf), oH = el("output", "pk-val");
    var rT = range(2, 24, 1, s.tau), oT = el("output", "pk-val");
    var rN = range(1, 12, 1, s.n), oN = el("output", "pk-val");
    var rF = range(10, 100, 5, s.F), oF = el("output", "pk-val");
    var cC = check(s.charge), cR = check(s.renal);
    ctls.appendChild(ctl("Voie", sV));
    ctls.appendChild(ctl("Dose (mg)", rD, oD));
    ctls.appendChild(ctl("Demi-vie t½ (h)", rH, oH));
    ctls.appendChild(ctl("Intervalle entre prises (h)", rT, oT));
    ctls.appendChild(ctl("Nombre de prises", rN, oN));
    ctls.appendChild(ctl("Biodisponibilité F (%)", rF, oF));
    ctls.appendChild(ctl("Dose de charge (1re prise ×2)", cC));
    ctls.appendChild(ctl("Insuffisance rénale (t½ ×2)", cR));
    body.appendChild(ctls); body.appendChild(out);

    function draw() {
      oD.textContent = s.dose; oH.textContent = s.thalf; oT.textContent = s.tau; oN.textContent = s.n; oF.textContent = s.F;
      rF.disabled = s.voie === "iv";
      var th = s.renal ? s.thalf * 2 : s.thalf, ke = Math.LN2 / th;
      var Tmax = Math.max(24, (s.n - 1) * s.tau + 5 * th), N = 600, pts = [], cmax = 0, inWin = 0, toxic = 0, sub = 0, tFirst = null;
      for (var i = 0; i <= N; i++) {
        var t = Tmax * i / N, c = conc(t, s); pts.push([t, c]); cmax = Math.max(cmax, c);
        if (t > 0) { if (c > CMT) toxic++; else if (c >= CME) { inWin++; if (tFirst === null) tFirst = t; } else sub++; }
      }
      var R = 1 / (1 - Math.exp(-ke * s.tau)), tss = 5 * th;
      var lastStart = (s.n - 1) * s.tau, lastMin = s.n > 1 ? conc(lastStart - 0.001, s) : null;
      var msg;
      if (toxic > 0) msg = "⚠️ La concentration dépasse le <b>seuil toxique</b> (zone rouge) : dose trop forte, prises trop rapprochées ou élimination ralentie (insuffisance rénale → accumulation).";
      else if (s.n > 1 && lastMin !== null && lastMin < CME) msg = "Entre deux prises, la concentration retombe <b>sous la CME</b> : l'effet disparaît. Rapprocher les prises (ou une forme à libération prolongée) réduit ces creux.";
      else if (s.n === 1) msg = "Une prise unique : la concentration monte (absorption) puis décroît de moitié à chaque demi-vie. Après ≈ 5 t½, il ne reste qu'environ 3 % de la quantité.";
      else {
        msg = "✅ À l'équilibre, la concentration reste dans la <b>fenêtre thérapeutique</b>. L'état d'équilibre est atteint après ≈ 4 à 5 demi-vies, quelle que soit la dose.";
        if (tFirst !== null && tFirst > s.tau) msg += " Mais il faut attendre ≈ " + fmt(tFirst, 0) + " h avant d'être efficace : une <b>dose de charge</b> raccourcit ce délai.";
      }
      out.innerHTML = '<div class="pk-kv"><span>Cmax = <b>' + fmt(cmax, 1) + " mg/L</b></span><span>t½ effective = <b>" + th + " h</b></span><span>Équilibre ≈ 5 t½ = <b>" +
        fmt(tss, 0) + " h</b></span>" + (s.n > 1 ? "<span>Accumulation R = 1/(1 − e^(−ke·τ)) = <b>" + fmt(R, 2) + "</b></span>" : "") +
        "<span>Temps dans la fenêtre : <b>" + Math.round(100 * inWin / N) + " %</b></span>" +
        (tFirst !== null ? "<span>Efficace dès <b>" + fmt(tFirst, 1) + " h</b></span>" : "") + "</div>" +
        '<p class="pk-msg">' + msg + "</p>";
      var w = cv.clientWidth; if (w < 40) return;
      var h = Math.round(Math.max(220, Math.min(360, w * 0.5))), dpr = window.devicePixelRatio || 1;
      cv.style.height = h + "px"; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      var C = css(body), pl = 44, pr = 12, pt = 14, pb = 30, ymax = Math.max(CMT * 1.25, cmax * 1.1);
      function X(t) { return pl + t / Tmax * (w - pl - pr); }
      function Y(c) { return pt + (1 - c / ymax) * (h - pt - pb); }
      ctx.fillStyle = "rgba(34,195,154,0.14)"; ctx.fillRect(X(0), Y(CMT), X(Tmax) - X(0), Y(CME) - Y(CMT));
      ctx.fillStyle = "rgba(255,107,129,0.12)"; ctx.fillRect(X(0), Y(ymax), X(Tmax) - X(0), Y(CMT) - Y(ymax));
      ctx.font = "11px system-ui, sans-serif"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
      ctx.fillStyle = C.red; ctx.fillText("zone toxique (> " + CMT + " mg/L)", X(0) + 6, Y(CMT) - 9);
      ctx.fillStyle = C.green; ctx.fillText("fenêtre thérapeutique", X(0) + 6, Y(CME) - 9);
      ctx.fillStyle = C.muted; ctx.fillText("sous la CME (inefficace)", X(0) + 6, Y(CME) + 10);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(Tmax), Y(0)); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0), Y(ymax)); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.textAlign = "center"; ctx.textBaseline = "top";
      var step = Tmax > 96 ? 24 : Tmax > 48 ? 12 : 6;
      for (var tt = 0; tt <= Tmax; tt += step) ctx.fillText(tt + " h", X(tt), Y(0) + 6);
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      [0, CME, CMT, Math.round(ymax)].forEach(function (v) { ctx.fillText(String(v), X(0) - 6, Y(v)); });
      ctx.save(); ctx.translate(12, (pt + h - pb) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.fillText("mg/L", 0, 0); ctx.restore();
      ctx.strokeStyle = C.orange; ctx.setLineDash([3, 4]);
      for (var k = 0; k < s.n; k++) { ctx.beginPath(); ctx.moveTo(X(k * s.tau), Y(0)); ctx.lineTo(X(k * s.tau), Y(ymax * 0.97)); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.strokeStyle = C.primary; ctx.lineWidth = 2.5; ctx.beginPath();
      pts.forEach(function (q, j) { if (j === 0) ctx.moveTo(X(q[0]), Y(q[1])); else ctx.lineTo(X(q[0]), Y(q[1])); });
      ctx.stroke();
    }
    sV.addEventListener("change", function () { s.voie = sV.value; draw(); });
    rD.addEventListener("input", function () { s.dose = +rD.value; draw(); });
    rH.addEventListener("input", function () { s.thalf = +rH.value; draw(); });
    rT.addEventListener("input", function () { s.tau = +rT.value; draw(); });
    rN.addEventListener("input", function () { s.n = Math.round(+rN.value); draw(); });
    rF.addEventListener("input", function () { s.F = +rF.value; draw(); });
    cC.addEventListener("change", function () { s.charge = cC.checked; draw(); });
    cR.addEventListener("change", function () { s.renal = cR.checked; draw(); });
    draw();
    return { draw: draw };
  }

  var live = [];
  function mount(root) {
    (root || document).querySelectorAll(".pk-viz").forEach(function (fig) {
      if (fig.__pk) return;
      try { fig.__pk = Widget(fig); live.push(fig.__pk); } catch (e) { fig.__pk = { draw: function () {} }; }
    });
  }
  var pending = false;
  function redraw() {
    if (pending) return; pending = true;
    requestAnimationFrame(function () { pending = false; live.forEach(function (w) { try { w.draw(); } catch (e) {} }); });
  }
  window.addEventListener("resize", redraw);
  if (window.MutationObserver) new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.PK = { mount: mount, conc: conc };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { mount(document); });
  else mount(document);
})();
