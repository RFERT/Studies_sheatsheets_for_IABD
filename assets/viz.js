/* =========================================================
   viz.js — Visualisations interactives (canvas, zéro dépendance)
   Monte les blocs <figure class="viz" data-viz="nom" data-opts="{…}">
   produits par le Markdown « ::: viz nom légende » (voir markdown.js)
   ou écrits à la main dans une page (ex. labo.html).
   Expose : window.Viz.mount(racine), window.Viz.catalog
   ========================================================= */
(function () {
  "use strict";
  if (window.Viz) return;

  var SCRIPT = document.currentScript;
  var BASE = SCRIPT && SCRIPT.src ? SCRIPT.src.replace(/[^\/]*$/, "") : "assets/";
  if (!document.querySelector("link[data-viz-css]")) {
    var css = document.createElement("link");
    css.rel = "stylesheet"; css.href = BASE + "viz.css"; css.setAttribute("data-viz-css", "1");
    document.head.appendChild(css);
  }

  /* ---------- Petits utilitaires DOM ---------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function fmt(x, d) {
    if (!isFinite(x)) return x > 0 ? "+∞" : (x < 0 ? "−∞" : "—");
    if (Math.abs(x) >= 1e5) return x.toExponential(2).replace("e+", "·10^");
    var p = Math.pow(10, d == null ? 3 : d);
    var r = Math.round(x * p) / p;
    if (r === 0) r = 0;
    return String(r).replace("-", "−").replace(".", ",");
  }
  function ctl(label, input, out) {
    var w = el("label", "viz-ctl");
    w.appendChild(el("span", "viz-lbl", label));
    w.appendChild(input);
    if (out) w.appendChild(out);
    return w;
  }
  function range(min, max, step, val) {
    var i = el("input"); i.type = "range"; i.min = min; i.max = max; i.step = step; i.value = val;
    return i;
  }
  function select(options, val) {
    var s = el("select");
    options.forEach(function (o) {
      var op = el("option"); op.value = o[0]; op.textContent = o[1];
      if (o[0] === val) op.selected = true;
      s.appendChild(op);
    });
    return s;
  }
  function btn(txt, title) {
    var b = el("button", "viz-btn", txt); b.type = "button";
    if (title) b.title = title;
    return b;
  }
  function num(o, k, d) { var v = parseFloat(o[k]); return isFinite(v) ? v : d; }

  function palette(node) {
    var cs = getComputedStyle(node);
    function v(n, d) { var x = cs.getPropertyValue(n).trim(); return x || d; }
    return {
      text: v("--text", "#eef1fb"), soft: v("--text-soft", "#a7b0d0"), muted: v("--muted", "#727c9e"),
      border: v("--border", "#2a3047"), card: v("--bg-card", "#181c2a"),
      primary: v("--sc", "") || v("--primary", "#6c8cff"), accent: v("--accent", "#27e0b0"),
      red: "#ff6b81", orange: "#ffb454", green: "#22c39a", blue: "#5b8cff"
    };
  }

  /* ---------- Scène canvas (HiDPI + responsive) ---------- */
  function Stage(parent, ratio, maxH, label) {
    var wrap = el("div", "viz-stage");
    var c = el("canvas", "viz-canvas");
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", label);
    wrap.appendChild(c);
    parent.appendChild(wrap);
    var st = { canvas: c, w: 0, h: 0, ctx: null };
    st.fit = function () {
      var w = c.clientWidth;
      if (w < 40) return false;
      var hh = Math.round(Math.max(220, Math.min(maxH || 380, w * (ratio || 0.6))));
      var dpr = window.devicePixelRatio || 1;
      c.style.height = hh + "px";
      var W = Math.round(w * dpr), H = Math.round(hh * dpr);
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      st.ctx = c.getContext("2d");
      st.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      st.ctx.clearRect(0, 0, w, hh);
      st.w = w; st.h = hh;
      return true;
    };
    st.pos = function (ev) {
      var r = c.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    };
    return st;
  }

  // Repère : coordonnées « maths » -> pixels
  function Frame(st, xmin, xmax, ymin, ymax, pad, equal) {
    var p = pad == null ? 30 : pad;
    var W = st.w - 2 * p, H = st.h - 2 * p;
    if (equal) {
      var s = Math.min(W / (xmax - xmin), H / (ymax - ymin));
      var cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
      xmin = cx - W / (2 * s); xmax = cx + W / (2 * s);
      ymin = cy - H / (2 * s); ymax = cy + H / (2 * s);
    }
    return {
      xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax,
      X: function (x) { return p + (x - xmin) / (xmax - xmin) * W; },
      Y: function (y) { return p + H - (y - ymin) / (ymax - ymin) * H; },
      ix: function (px) { return xmin + (px - p) / W * (xmax - xmin); },
      iy: function (py) { return ymin + (p + H - py) / H * (ymax - ymin); }
    };
  }
  function niceStep(r) {
    var raw = r / 8, m = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), q = raw / m;
    return (q < 1.5 ? 1 : q < 3.5 ? 2 : q < 7.5 ? 5 : 10) * m;
  }
  function drawAxes(ctx, F, C) {
    var sx = niceStep(F.xmax - F.xmin), sy = niceStep(F.ymax - F.ymin), i, v;
    ctx.save();
    ctx.lineWidth = 1; ctx.strokeStyle = C.border; ctx.globalAlpha = 0.6;
    ctx.beginPath();
    for (i = Math.ceil(F.xmin / sx); i * sx <= F.xmax + 1e-9; i++) { v = i * sx; ctx.moveTo(F.X(v), F.Y(F.ymin)); ctx.lineTo(F.X(v), F.Y(F.ymax)); }
    for (i = Math.ceil(F.ymin / sy); i * sy <= F.ymax + 1e-9; i++) { v = i * sy; ctx.moveTo(F.X(F.xmin), F.Y(v)); ctx.lineTo(F.X(F.xmax), F.Y(v)); }
    ctx.stroke();
    ctx.globalAlpha = 1; ctx.strokeStyle = C.muted; ctx.beginPath();
    var hasY0 = F.ymin <= 0 && F.ymax >= 0, hasX0 = F.xmin <= 0 && F.xmax >= 0;
    if (hasY0) { ctx.moveTo(F.X(F.xmin), F.Y(0)); ctx.lineTo(F.X(F.xmax), F.Y(0)); }
    if (hasX0) { ctx.moveTo(F.X(0), F.Y(F.ymin)); ctx.lineTo(F.X(0), F.Y(F.ymax)); }
    ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    var yl = hasY0 ? F.Y(0) : F.Y(F.ymin);
    for (i = Math.ceil(F.xmin / sx); i * sx <= F.xmax + 1e-9; i++) { v = i * sx; if (Math.abs(v) > 1e-9) ctx.fillText(fmt(v, 2), F.X(v), yl + 3); }
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    var xl = hasX0 ? F.X(0) : F.X(F.xmin);
    for (i = Math.ceil(F.ymin / sy); i * sy <= F.ymax + 1e-9; i++) { v = i * sy; if (Math.abs(v) > 1e-9) ctx.fillText(fmt(v, 2), xl - 4, F.Y(v)); }
    ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, color, w) {
    var a = Math.atan2(y2 - y1, x2 - x1), L = 9;
    ctx.save();
    ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = w || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - L * Math.cos(a - 0.4), y2 - L * Math.sin(a - 0.4));
    ctx.lineTo(x2 - L * Math.cos(a + 0.4), y2 - L * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function dot(ctx, x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function layout(body) {
    return { ctls: el("div", "viz-ctls"), out: el("div", "viz-out") };
  }
  function finish(body, parts) {
    parts.out.setAttribute("aria-live", "polite");
    body.appendChild(parts.ctls);
    body.appendChild(parts.out);
  }

  /* =========================================================
     1. Descente de gradient
     ========================================================= */
  var FUNCS = {
    convexe: { label: "x² (convexe)", f: function (x) { return x * x; }, d: function (x) { return 2 * x; },
      x: [-3, 3], y: [-0.6, 9.5], x0: 2.6, lr: 0.1 },
    nonconvexe: { label: "x⁴ − 3x² + x (2 minima)", f: function (x) { return x * x * x * x - 3 * x * x + x; },
      d: function (x) { return 4 * x * x * x - 6 * x + 1; }, x: [-2.2, 2.2], y: [-4.2, 7], x0: 1.9, lr: 0.02 },
    plateau: { label: "1 − e^(−x²) (gradient évanescent)", f: function (x) { return 1 - Math.exp(-x * x); },
      d: function (x) { return 2 * x * Math.exp(-x * x); }, x: [-4, 4], y: [-0.1, 1.15], x0: 3.2, lr: 0.5 }
  };
  var LR_MIN = -3, LR_MAX = Math.log(1.5) / Math.LN10;
  function sToLr(s) { return Math.pow(10, LR_MIN + s / 100 * (LR_MAX - LR_MIN)); }
  function lrToS(lr) { return Math.round((Math.log(lr) / Math.LN10 - LR_MIN) / (LR_MAX - LR_MIN) * 100); }

  function Gradient(body, o) {
    var key = FUNCS[o.fonction] ? o.fonction : (FUNCS[o.fn] ? o.fn : "convexe");
    var fn = FUNCS[key];
    var lr = num(o, "lr", fn.lr), beta = num(o, "momentum", 0), x0 = num(o, "x0", fn.x0);
    var st = Stage(body, 0.55, 360, "Courbe de la fonction et trajectoire de la descente de gradient");
    var P = layout(body);
    var sFn = select(Object.keys(FUNCS).map(function (k) { return [k, FUNCS[k].label]; }), key);
    var rLr = range(0, 100, 1, lrToS(lr)), oLr = el("output", "viz-val");
    var rX0 = range(fn.x[0], fn.x[1], 0.05, x0), oX0 = el("output", "viz-val");
    var rB = range(0, 0.95, 0.05, beta), oB = el("output", "viz-val");
    var bPlay = btn("▶ Animer"), bStep = btn("Pas +1", "Faire une itération"), bReset = btn("↺ Réinitialiser");
    P.ctls.appendChild(ctl("Fonction", sFn));
    P.ctls.appendChild(ctl("Taux η", rLr, oLr));
    P.ctls.appendChild(ctl("Départ x₀", rX0, oX0));
    P.ctls.appendChild(ctl("Momentum β", rB, oB));
    var bar = el("div", "viz-btns"); bar.appendChild(bPlay); bar.appendChild(bStep); bar.appendChild(bReset);
    P.ctls.appendChild(bar);
    finish(body, P);

    var S, timer = null;
    function reset() { stop(); S = { x: x0, v: 0, k: 0, path: [x0], status: "" }; draw(); }
    function step() {
      if (S.status) return false;
      var g = fn.d(S.x);
      S.v = beta * S.v - lr * g;
      S.x += S.v; S.k++;
      S.path.push(S.x);
      if (!isFinite(S.x) || Math.abs(S.x) > 1e6) S.status = "diverge";
      else if (Math.abs(fn.d(S.x)) < 1e-4 && Math.abs(S.v) < 1e-4) S.status = "converge";
      else if (S.k >= 400) S.status = "max";
      return !S.status;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } bPlay.textContent = "▶ Animer"; }
    function play() {
      if (timer) { stop(); return; }
      if (S.status) reset();
      bPlay.textContent = "⏸ Pause";
      timer = setInterval(function () { if (!step()) stop(); draw(); }, 90);
    }
    function oscillating() {
      var p = S.path, n = p.length;
      if (n < 8) return false;
      for (var i = n - 6; i < n - 1; i++) {
        if ((p[i] - p[i - 1]) * (p[i + 1] - p[i]) >= 0) return false;
      }
      return true;
    }
    function draw() {
      oLr.textContent = fmt(lr, lr < 0.01 ? 4 : 3);
      oX0.textContent = fmt(x0, 2);
      oB.textContent = fmt(beta, 2);
      if (!S) return;
      var g = fn.d(S.x), msg;
      if (S.status === "diverge") msg = "💥 <b>Diverge</b> : le pas η est trop grand, chaque mise à jour dépasse le minimum de plus en plus loin.";
      else if (S.status === "converge") {
        msg = "✅ <b>Convergé</b> en " + S.k + " itérations vers x ≈ " + fmt(S.x, 3) + ".";
        if (key === "nonconvexe") msg += S.x > 0
          ? " ⚠️ C'est un minimum <b>local</b> (le global est en x ≈ −1,30) : l'initialisation compte !"
          : " 🎯 C'est le minimum <b>global</b>.";
      } else if (S.status === "max") msg = "⏱️ 400 itérations sans converger.";
      else if (oscillating()) msg = "↔️ <b>Ça oscille</b> autour du minimum : η est grand (mais pas encore assez pour diverger).";
      else if (key === "plateau" && S.k > 30 && Math.abs(g) < 0.02) msg = "🐢 Progression très lente : loin du minimum le gradient est presque nul (<b>gradient évanescent</b>).";
      else msg = "Règle : <code>v ← β·v − η·f′(x)</code> puis <code>x ← x + v</code>. Clique sur la courbe pour choisir le départ.";
      P.out.innerHTML = '<div class="viz-kv"><span>Itération <b>' + S.k + "</b></span><span>x = <b>" + fmt(S.x, 4) +
        "</b></span><span>f(x) = <b>" + fmt(fn.f(S.x), 4) + "</b></span><span>f′(x) = <b>" + fmt(g, 4) + "</b></span></div>" +
        '<p class="viz-msg">' + msg + "</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx;
      var F = Frame(st, fn.x[0], fn.x[1], fn.y[0], fn.y[1]);
      drawAxes(ctx, F, C);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, st.w, st.h); ctx.clip();
      ctx.strokeStyle = C.primary; ctx.lineWidth = 2.5; ctx.beginPath();
      for (var i = 0; i <= 300; i++) {
        var x = fn.x[0] + (fn.x[1] - fn.x[0]) * i / 300;
        if (i === 0) ctx.moveTo(F.X(x), F.Y(fn.f(x))); else ctx.lineTo(F.X(x), F.Y(fn.f(x)));
      }
      ctx.stroke();
      // trajectoire
      var pts = S.path.filter(function (v) { return isFinite(v) && v >= fn.x[0] - 0.5 && v <= fn.x[1] + 0.5; });
      ctx.strokeStyle = C.orange; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8; ctx.beginPath();
      pts.forEach(function (v, j) { var X = F.X(v), Y = F.Y(fn.f(v)); if (j === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
      ctx.stroke(); ctx.globalAlpha = 1;
      pts.forEach(function (v, j) { dot(ctx, F.X(v), F.Y(fn.f(v)), j === pts.length - 1 ? 0 : 3, C.orange); });
      // point courant + tangente
      if (isFinite(S.x) && S.x >= fn.x[0] && S.x <= fn.x[1]) {
        var y0 = fn.f(S.x), dx = (fn.x[1] - fn.x[0]) * 0.12;
        ctx.strokeStyle = C.muted; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2; ctx.beginPath();
        ctx.moveTo(F.X(S.x - dx), F.Y(y0 - g * dx)); ctx.lineTo(F.X(S.x + dx), F.Y(y0 + g * dx)); ctx.stroke();
        ctx.setLineDash([]);
        dot(ctx, F.X(S.x), F.Y(y0), 7, C.red, C.card);
      } else if (S.status === "diverge" || !isFinite(S.x) || S.x < fn.x[0] || S.x > fn.x[1]) {
        ctx.fillStyle = C.red; ctx.font = "bold 13px system-ui, sans-serif"; ctx.textAlign = "center";
        ctx.fillText("x hors du graphe →  " + fmt(S.x, 2), st.w / 2, 18);
      }
      ctx.restore();
    }
    sFn.addEventListener("change", function () {
      key = sFn.value; fn = FUNCS[key];
      rX0.min = fn.x[0]; rX0.max = fn.x[1]; x0 = fn.x0; rX0.value = x0;
      lr = fn.lr; rLr.value = lrToS(lr);
      reset();
    });
    rLr.addEventListener("input", function () { lr = sToLr(+rLr.value); reset(); });
    rX0.addEventListener("input", function () { x0 = +rX0.value; reset(); });
    rB.addEventListener("input", function () { beta = +rB.value; reset(); });
    bPlay.addEventListener("click", play);
    bStep.addEventListener("click", function () { stop(); if (S.status) reset(); step(); draw(); });
    bReset.addEventListener("click", reset);
    st.canvas.addEventListener("click", function (ev) {
      if (!st.w) return;
      var F = Frame(st, fn.x[0], fn.x[1], fn.y[0], fn.y[1]);
      x0 = Math.max(fn.x[0], Math.min(fn.x[1], F.ix(st.pos(ev).x)));
      rX0.value = x0; reset();
    });
    reset();
    return { draw: draw };
  }

  /* =========================================================
     2. Transformations linéaires 2D (matrice 2×2)
     ========================================================= */
  var R45 = Math.SQRT1_2;
  var MPRESETS = {
    identite: ["Identité", [1, 0, 0, 1]],
    rotation: ["Rotation 45°", [R45, -R45, R45, R45]],
    homothetie: ["Homothétie ×2", [2, 0, 0, 2]],
    etirement: ["Étirement (2 ; 0,5)", [2, 0, 0, 0.5]],
    cisaillement: ["Cisaillement", [1, 1, 0, 1]],
    symetrie: ["Symétrie axe x", [1, 0, 0, -1]],
    projection: ["Projection sur x", [1, 0, 0, 0]],
    singuliere: ["Singulière (det = 0)", [1, 2, 0.5, 1]],
    propres: ["Symétrique [[2,1],[1,2]]", [2, 1, 1, 2]]
  };
  function eigen(a, b, c, d) {
    var tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
    if (disc < -1e-12) return { complex: true, re: tr / 2, im: Math.sqrt(-disc) / 2, tr: tr, det: det };
    var s = Math.sqrt(Math.max(0, disc)), l1 = (tr + s) / 2, l2 = (tr - s) / 2;
    function vec(l) {
      var v;
      if (Math.abs(b) > 1e-9) v = [b, l - a];
      else if (Math.abs(c) > 1e-9) v = [l - d, c];
      else v = Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1];
      var n = Math.hypot(v[0], v[1]) || 1;
      return [v[0] / n, v[1] / n];
    }
    var vs = [vec(l1)];
    if (Math.abs(l1 - l2) > 1e-9) vs.push(vec(l2));
    else if (Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9) vs = [[1, 0], [0, 1]];
    return { complex: false, l1: l1, l2: l2, vecs: vs, tr: tr, det: det };
  }

  function Matrix(body, o) {
    var pk = MPRESETS[o.preset] ? o.preset : "cisaillement";
    var M = MPRESETS[pk][1].slice(), t = 1;
    var st = Stage(body, 0.62, 420, "Plan transformé par la matrice : grille, vecteurs de base et carré unité");
    var P = layout(body);
    var grid = el("div", "viz-matrix"), inputs = [];
    for (var k = 0; k < 4; k++) {
      var inp = el("input"); inp.type = "number"; inp.step = "0.1"; inp.value = fmt(M[k], 3).replace(",", ".").replace("−", "-");
      inp.setAttribute("aria-label", ["a (ligne 1, colonne 1)", "b (ligne 1, colonne 2)", "c (ligne 2, colonne 1)", "d (ligne 2, colonne 2)"][k]);
      inputs.push(inp); grid.appendChild(inp);
    }
    var sP = select(Object.keys(MPRESETS).map(function (x) { return [x, MPRESETS[x][0]]; }), pk);
    var rT = range(0, 1, 0.01, 1), oT = el("output", "viz-val");
    var bAnim = btn("▶ Animer I → M");
    P.ctls.appendChild(ctl("Matrice M", grid));
    P.ctls.appendChild(ctl("Exemple", sP));
    P.ctls.appendChild(ctl("Interpolation t", rT, oT));
    var bar = el("div", "viz-btns"); bar.appendChild(bAnim); P.ctls.appendChild(bar);
    finish(body, P);

    function cur() { return [1 + t * (M[0] - 1), t * M[1], t * M[2], 1 + t * (M[3] - 1)]; }
    function draw() {
      oT.textContent = fmt(t, 2);
      var m = cur(), a = m[0], b = m[1], c = m[2], d = m[3];
      var E = eigen(M[0], M[1], M[2], M[3]);
      var det = E.det, interp;
      if (Math.abs(det) < 1e-9) interp = "⚠️ det = 0 : le plan est <b>écrasé</b> sur une droite (ou un point) → M n'est <b>pas inversible</b>.";
      else if (det < 0) interp = "🔄 det &lt; 0 : l'orientation est <b>inversée</b> (effet miroir). Les aires sont multipliées par |det| = " + fmt(Math.abs(det), 3) + ".";
      else interp = "📐 Les aires sont multipliées par det = " + fmt(det, 3) + ". M est inversible.";
      var ev = E.complex
        ? "λ = " + fmt(E.re, 3) + " ± " + fmt(E.im, 3) + "i (complexes : <b>rotation</b>, aucune direction réelle conservée)"
        : "λ₁ = " + fmt(E.l1, 3) + (E.vecs.length > 1 || Math.abs(E.l1 - E.l2) > 1e-9 ? " · λ₂ = " + fmt(E.l2, 3) : " (double)") +
          " — les droites en pointillés orange sont <b>conservées</b> (vecteurs propres)";
      P.out.innerHTML = '<div class="viz-kv"><span>det(M) = <b>' + fmt(det, 3) + "</b></span><span>tr(M) = <b>" + fmt(E.tr, 3) +
        "</b></span><span>M·e₁ = (" + fmt(M[0], 2) + " ; " + fmt(M[2], 2) + ")</span><span>M·e₂ = (" + fmt(M[1], 2) + " ; " + fmt(M[3], 2) + ")</span></div>" +
        '<p class="viz-msg">' + interp + "<br>Valeurs propres : " + ev + ".</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx;
      var F = Frame(st, -3.5, 3.5, -3.5, 3.5, 16, true);
      function T(x, y) { return [F.X(a * x + b * y), F.Y(c * x + d * y)]; }
      // grille d'origine (pâle)
      ctx.save(); ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.beginPath();
      for (var i = Math.ceil(F.xmin); i <= F.xmax; i++) { ctx.moveTo(F.X(i), F.Y(F.ymin)); ctx.lineTo(F.X(i), F.Y(F.ymax)); }
      for (i = Math.ceil(F.ymin); i <= F.ymax; i++) { ctx.moveTo(F.X(F.xmin), F.Y(i)); ctx.lineTo(F.X(F.xmax), F.Y(i)); }
      ctx.stroke();
      // grille transformée
      ctx.strokeStyle = C.primary; ctx.globalAlpha = 0.45; ctx.beginPath();
      for (i = -6; i <= 6; i++) {
        var p1 = T(i, -6), p2 = T(i, 6); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
        p1 = T(-6, i); p2 = T(6, i); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
      // carré unité transformé
      var q = [T(0, 0), T(1, 0), T(1, 1), T(0, 1)];
      ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]);
      for (i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]);
      ctx.closePath(); ctx.fillStyle = C.accent; ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.stroke();
      // vecteurs propres (de M final)
      if (!E.complex && t === 1) {
        ctx.strokeStyle = C.orange; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.8; ctx.beginPath();
        E.vecs.forEach(function (v) { ctx.moveTo(F.X(-6 * v[0]), F.Y(-6 * v[1])); ctx.lineTo(F.X(6 * v[0]), F.Y(6 * v[1])); });
        ctx.stroke(); ctx.setLineDash([]);
      }
      // axes + vecteurs de base
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(F.X(F.xmin), F.Y(0)); ctx.lineTo(F.X(F.xmax), F.Y(0));
      ctx.moveTo(F.X(0), F.Y(F.ymin)); ctx.lineTo(F.X(0), F.Y(F.ymax)); ctx.stroke();
      var o0 = T(0, 0), e1 = T(1, 0), e2 = T(0, 1);
      arrow(ctx, o0[0], o0[1], e1[0], e1[1], C.red, 3);
      arrow(ctx, o0[0], o0[1], e2[0], e2[1], C.green, 3);
      ctx.font = "bold 13px system-ui, sans-serif"; ctx.fillStyle = C.red; ctx.fillText("M·e₁", e1[0] + 6, e1[1] - 6);
      ctx.fillStyle = C.green; ctx.fillText("M·e₂", e2[0] + 6, e2[1] - 6);
      ctx.restore();
    }
    function readInputs() {
      M = inputs.map(function (i) { var v = parseFloat(i.value); return isFinite(v) ? v : 0; });
      draw();
    }
    function setPreset(k) {
      M = MPRESETS[k][1].slice();
      inputs.forEach(function (inp, j) { inp.value = String(Math.round(M[j] * 1000) / 1000); });
      draw();
    }
    inputs.forEach(function (i) { i.addEventListener("input", readInputs); });
    sP.addEventListener("change", function () { setPreset(sP.value); });
    rT.addEventListener("input", function () { t = +rT.value; draw(); });
    var raf = null;
    bAnim.addEventListener("click", function () {
      if (raf) cancelAnimationFrame(raf);
      var t0 = null;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        t = Math.min(1, (ts - t0) / 1600); rT.value = t; draw();
        raf = t < 1 ? requestAnimationFrame(frame) : null;
      }
      t = 0; raf = requestAnimationFrame(frame);
    });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     3. Relations binaires (matrice booléenne + graphe + propriétés)
     ========================================================= */
  var RPRESETS = {
    vide: ["∅ (vide)", function () { return false; }],
    egal: ["= (égalité)", function (i, j) { return i === j; }],
    le: ["≤", function (i, j) { return i <= j; }],
    lt: ["< (strict)", function (i, j) { return i < j; }],
    divise: ["divise (a | b)", function (i, j) { return j % i === 0; }],
    parite: ["même parité", function (i, j) { return (i - j) % 2 === 0; }],
    mod3: ["congru modulo 3", function (i, j) { return (i - j) % 3 === 0; }],
    plein: ["E × E (tout)", function () { return true; }]
  };

  function Relation(body, o) {
    var n = Math.max(2, Math.min(7, Math.round(num(o, "n", 4))));
    var pk = RPRESETS[o.preset] ? o.preset : "le";
    var R = [];
    function fill(f) { R = []; for (var i = 0; i < n; i++) { R.push([]); for (var j = 0; j < n; j++) R[i].push(!!f(i + 1, j + 1)); } }
    fill(RPRESETS[pk][1]);

    var top = el("div", "viz-rel-top");
    var tableWrap = el("div", "viz-rel-mat");
    top.appendChild(tableWrap);
    body.appendChild(top);
    var st = Stage(top, 0.9, 340, "Graphe orienté de la relation");
    var P = layout(body);
    var sN = select([2, 3, 4, 5, 6, 7].map(function (x) { return [String(x), "E = {1…" + x + "}"]; }), String(n));
    var sP = select(Object.keys(RPRESETS).map(function (x) { return [x, RPRESETS[x][0]]; }), pk);
    var bRef = btn("+ Clôture réflexive"), bSym = btn("+ Clôture symétrique"), bTr = btn("+ Clôture transitive", "Algorithme de Warshall");
    P.ctls.appendChild(ctl("Ensemble", sN));
    P.ctls.appendChild(ctl("Exemple", sP));
    var bar = el("div", "viz-btns"); bar.appendChild(bRef); bar.appendChild(bSym); bar.appendChild(bTr);
    P.ctls.appendChild(bar);
    finish(body, P);

    function buildTable() {
      var h = '<table><caption class="viz-sr">Matrice booléenne : clique une case pour ajouter ou retirer le couple (ligne, colonne)</caption>' +
        '<thead><tr><th scope="col">R</th>';
      for (var j = 0; j < n; j++) h += '<th scope="col">' + (j + 1) + "</th>";
      h += "</tr></thead><tbody>";
      for (var i = 0; i < n; i++) {
        h += '<tr><th scope="row">' + (i + 1) + "</th>";
        for (j = 0; j < n; j++) {
          h += '<td><button type="button" data-i="' + i + '" data-j="' + j + '" aria-pressed="' + R[i][j] +
            '" aria-label="' + (i + 1) + " R " + (j + 1) + '">' + (R[i][j] ? "1" : "0") + "</button></td>";
        }
        h += "</tr>";
      }
      tableWrap.innerHTML = h + "</tbody></table>";
      tableWrap.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          var i = +b.getAttribute("data-i"), j = +b.getAttribute("data-j");
          R[i][j] = !R[i][j];
          b.setAttribute("aria-pressed", R[i][j]); b.textContent = R[i][j] ? "1" : "0";
          draw();
        });
      });
    }

    function props() {
      var i, j, k, r = {};
      r.refl = { ok: true }; r.irrefl = { ok: true };
      for (i = 0; i < n; i++) {
        if (!R[i][i] && r.refl.ok) r.refl = { ok: false, why: "(" + (i + 1) + "," + (i + 1) + ") manque" };
        if (R[i][i] && r.irrefl.ok) r.irrefl = { ok: false, why: "(" + (i + 1) + "," + (i + 1) + ") présent" };
      }
      r.sym = { ok: true }; r.anti = { ok: true }; r.total = { ok: true };
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
        if (R[i][j] && !R[j][i] && r.sym.ok) r.sym = { ok: false, why: "(" + (i + 1) + "," + (j + 1) + ") sans (" + (j + 1) + "," + (i + 1) + ")" };
        if (i !== j && R[i][j] && R[j][i] && r.anti.ok) r.anti = { ok: false, why: "(" + (i + 1) + "," + (j + 1) + ") et (" + (j + 1) + "," + (i + 1) + ")" };
        if (i < j && !R[i][j] && !R[j][i] && r.total.ok) r.total = { ok: false, why: (i + 1) + " et " + (j + 1) + " incomparables" };
      }
      r.trans = { ok: true };
      outer: for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (R[i][j]) for (k = 0; k < n; k++) {
        if (R[j][k] && !R[i][k]) { r.trans = { ok: false, why: "(" + (i + 1) + "," + (j + 1) + ") et (" + (j + 1) + "," + (k + 1) + ") mais pas (" + (i + 1) + "," + (k + 1) + ")" }; break outer; }
      }
      return r;
    }
    function classes() {
      var seen = [], out = [];
      for (var i = 0; i < n; i++) {
        if (seen[i]) continue;
        var cl = [];
        for (var j = 0; j < n; j++) if (R[i][j]) { cl.push(j + 1); seen[j] = true; }
        out.push("{" + cl.join(", ") + "}");
      }
      return out;
    }
    function draw() {
      var p = props(), pairs = 0;
      R.forEach(function (row) { row.forEach(function (v) { if (v) pairs++; }); });
      function chip(lbl, x) {
        return '<span class="viz-prop ' + (x.ok ? "ok" : "ko") + '">' + (x.ok ? "✓ " : "✗ ") + lbl +
          (x.ok ? "" : ' <small>' + x.why + "</small>") + "</span>";
      }
      var concl = [];
      if (p.refl.ok && p.sym.ok && p.trans.ok) concl.push("🟰 <b>Relation d'équivalence</b> — classes : " + classes().join(" ") + " (une <b>partition</b> de E)");
      if (p.refl.ok && p.anti.ok && p.trans.ok) concl.push(p.total.ok ? "📏 <b>Ordre total</b> (tous les éléments sont comparables)" : "🌳 <b>Ordre partiel</b> (certains éléments sont incomparables)");
      if (p.irrefl.ok && p.trans.ok && pairs) concl.push("⬆️ <b>Ordre strict</b> (irréflexive + transitive)");
      if (!concl.length) concl.push("Ni équivalence ni ordre. Utilise les clôtures pour compléter la relation.");
      P.out.innerHTML = '<div class="viz-props">' + chip("réflexive", p.refl) + chip("irréflexive", p.irrefl) + chip("symétrique", p.sym) +
        chip("antisymétrique", p.anti) + chip("transitive", p.trans) + chip("totale", p.total) + "</div>" +
        '<p class="viz-msg">|R| = ' + pairs + " couple" + (pairs > 1 ? "s" : "") + " sur " + n * n + ". " + concl.join("<br>") + "</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx;
      var cx = st.w / 2, cy = st.h / 2, rad = Math.min(st.w, st.h) / 2 - 38, nr = 15;
      var pos = [];
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / n;
        pos.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a), a]);
      }
      for (i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        if (!R[i][j]) continue;
        var A = pos[i], B = pos[j];
        if (i === j) {
          var lx = A[0] + Math.cos(A[2]) * (nr + 9), ly = A[1] + Math.sin(A[2]) * (nr + 9);
          ctx.strokeStyle = C.accent; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(lx, ly, 10, 0, Math.PI * 2); ctx.stroke();
          continue;
        }
        var dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        var both = R[j][i], off = both ? 6 : 0;
        var sx = A[0] + ux * nr - uy * off, sy = A[1] + uy * nr + ux * off;
        var ex = B[0] - ux * (nr + 2) - uy * off, ey = B[1] - uy * (nr + 2) + ux * off;
        arrow(ctx, sx, sy, ex, ey, both ? C.primary : C.orange, 1.8);
      }
      pos.forEach(function (q, k) {
        dot(ctx, q[0], q[1], nr, C.card, C.text);
        ctx.fillStyle = C.text; ctx.font = "bold 14px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(k + 1), q[0], q[1]);
      });
    }
    function rebuild() { buildTable(); draw(); }
    sN.addEventListener("change", function () { n = +sN.value; fill(RPRESETS[sP.value][1]); rebuild(); });
    sP.addEventListener("change", function () { fill(RPRESETS[sP.value][1]); rebuild(); });
    bRef.addEventListener("click", function () { for (var i = 0; i < n; i++) R[i][i] = true; rebuild(); });
    bSym.addEventListener("click", function () {
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) if (R[i][j]) R[j][i] = true;
      rebuild();
    });
    bTr.addEventListener("click", function () {
      for (var k = 0; k < n; k++) for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) if (R[i][k] && R[k][j]) R[i][j] = true;
      rebuild();
    });
    rebuild();
    return { draw: draw };
  }

  /* =========================================================
     4. Régression polynomiale & surapprentissage
     ========================================================= */
  function solve(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      var tmp = M[c]; M[c] = M[p]; M[p] = tmp;
      if (Math.abs(M[c][c]) < 1e-12) return null;
      for (r = 0; r < n; r++) {
        if (r === c) continue;
        var f = M[r][c] / M[c][c];
        for (var k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    return M.map(function (row, i) { return row[n] / row[i]; });
  }
  function polyfit(pts, deg) {
    var A = [], b = [], i, j;
    for (i = 0; i <= deg; i++) { A.push([]); for (j = 0; j <= deg; j++) A[i].push(i === j ? 1e-9 : 0); b.push(0); }
    pts.forEach(function (p) {
      var t = (p.x - 5) / 5, pw = [];
      for (i = 0; i <= 2 * deg; i++) pw.push(Math.pow(t, i));
      for (i = 0; i <= deg; i++) { b[i] += pw[i] * p.y; for (j = 0; j <= deg; j++) A[i][j] += pw[i + j]; }
    });
    return solve(A, b);
  }
  function peval(w, x) { var t = (x - 5) / 5, s = 0; for (var i = w.length - 1; i >= 0; i--) s = s * t + w[i]; return s; }

  function Regression(body, o) {
    var deg = Math.max(1, Math.min(9, Math.round(num(o, "degre", num(o, "degree", 1)))));
    var pts = [], showRes = true;
    function randomCloud() {
      pts = [];
      for (var i = 0; i < 12; i++) {
        var x = 0.6 + i * 0.8 + Math.random() * 0.4;
        pts.push({ x: x, y: Math.max(0.2, Math.min(9.8, 0.65 * x + 1.6 + (Math.random() - 0.5) * 2.4)) });
      }
    }
    randomCloud();
    var st = Stage(body, 0.58, 380, "Nuage de points et modèle ajusté par moindres carrés");
    var P = layout(body);
    var rD = range(1, 9, 1, deg), oD = el("output", "viz-val");
    var cRes = el("input"); cRes.type = "checkbox"; cRes.checked = true;
    var bRand = btn("🎲 Nouveau nuage"), bOut = btn("➕ Valeur aberrante"), bClr = btn("🧹 Effacer");
    P.ctls.appendChild(ctl("Degré du polynôme", rD, oD));
    P.ctls.appendChild(ctl("Résidus", cRes));
    var bar = el("div", "viz-btns"); bar.appendChild(bRand); bar.appendChild(bOut); bar.appendChild(bClr);
    P.ctls.appendChild(bar);
    finish(body, P);

    function draw() {
      oD.textContent = String(deg);
      var n = pts.length, d = Math.min(deg, Math.max(0, n - 1)), w = n ? polyfit(pts, d) : null;
      var msg = "Clique dans le graphe pour <b>ajouter</b> un point, clique sur un point pour le <b>retirer</b>.";
      var kv = '<span>n = <b>' + n + "</b></span>";
      if (w) {
        var my = pts.reduce(function (s, p) { return s + p.y; }, 0) / n, ssr = 0, sst = 0;
        pts.forEach(function (p) { var e = p.y - peval(w, p.x); ssr += e * e; sst += (p.y - my) * (p.y - my); });
        var r2 = sst > 1e-12 ? 1 - ssr / sst : 1;
        kv += "<span>MSE = <b>" + fmt(ssr / n, 3) + "</b></span><span>R² = <b>" + fmt(r2, 3) + "</b></span>";
        if (d === 1) kv += "<span>ŷ = <b>" + fmt(w[1] / 5, 3) + "</b>·x + <b>" + fmt(w[0] - w[1], 3) + "</b></span>";
        if (n >= 2 && d >= n - 1) msg = "🚨 Degré ≥ n − 1 : la courbe passe par <b>tous</b> les points (erreur nulle) mais elle <b>ne généralise pas</b> : c'est du <b>surapprentissage</b>.";
        else if (deg >= 6) msg = "⚠️ Degré élevé : l'erreur d'entraînement baisse, mais regarde les bords — la courbe part en vrille (<b>variance</b> élevée).";
        else if (deg === 1) msg = "Droite des <b>moindres carrés</b> : elle minimise la somme des carrés des résidus (traits pointillés). Ajoute une valeur aberrante pour voir sa sensibilité.";
      }
      P.out.innerHTML = '<div class="viz-kv">' + kv + '</div><p class="viz-msg">' + msg + "</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, F = Frame(st, 0, 10, 0, 10);
      drawAxes(ctx, F, C);
      ctx.save(); ctx.beginPath(); ctx.rect(F.X(0), F.Y(10), F.X(10) - F.X(0), F.Y(0) - F.Y(10)); ctx.clip();
      if (w && showRes) {
        ctx.strokeStyle = C.red; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2; ctx.beginPath();
        pts.forEach(function (p) { ctx.moveTo(F.X(p.x), F.Y(p.y)); ctx.lineTo(F.X(p.x), F.Y(peval(w, p.x))); });
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (w) {
        ctx.strokeStyle = C.primary; ctx.lineWidth = 2.5; ctx.beginPath();
        for (var i = 0; i <= 300; i++) { var x = i / 30, y = peval(w, x); if (i === 0) ctx.moveTo(F.X(x), F.Y(y)); else ctx.lineTo(F.X(x), F.Y(y)); }
        ctx.stroke();
      }
      ctx.restore();
      pts.forEach(function (p) { dot(ctx, F.X(p.x), F.Y(p.y), 5, C.accent, C.card); });
    }
    rD.addEventListener("input", function () { deg = +rD.value; draw(); });
    cRes.addEventListener("change", function () { showRes = cRes.checked; draw(); });
    bRand.addEventListener("click", function () { randomCloud(); draw(); });
    bOut.addEventListener("click", function () { pts.push({ x: 1 + Math.random() * 8, y: Math.random() < 0.5 ? 9.5 : 0.5 }); draw(); });
    bClr.addEventListener("click", function () { pts = []; draw(); });
    st.canvas.addEventListener("click", function (ev) {
      if (!st.w) return;
      var F = Frame(st, 0, 10, 0, 10), m = st.pos(ev);
      for (var i = 0; i < pts.length; i++) {
        if (Math.hypot(F.X(pts[i].x) - m.x, F.Y(pts[i].y) - m.y) < 11) { pts.splice(i, 1); draw(); return; }
      }
      var x = F.ix(m.x), y = F.iy(m.y);
      if (x >= 0 && x <= 10 && y >= 0 && y <= 10) { pts.push({ x: x, y: y }); draw(); }
    });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     5. Loi normale N(μ, σ²) et probabilité d'un intervalle
     ========================================================= */
  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function Phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function pdf(x, mu, s) { return Math.exp(-0.5 * Math.pow((x - mu) / s, 2)) / (s * Math.sqrt(2 * Math.PI)); }

  function Normal(body, o) {
    var mu = num(o, "mu", 0), sg = num(o, "sigma", 1), a = num(o, "a", mu - sg), b = num(o, "b", mu + sg), ref = true;
    var st = Stage(body, 0.5, 340, "Densité de la loi normale et aire de l'intervalle choisi");
    var P = layout(body);
    var rMu = range(-3, 3, 0.1, mu), oMu = el("output", "viz-val");
    var rSg = range(0.3, 3, 0.1, sg), oSg = el("output", "viz-val");
    var rA = range(-7, 7, 0.1, a), oA = el("output", "viz-val");
    var rB = range(-7, 7, 0.1, b), oB = el("output", "viz-val");
    var cRef = el("input"); cRef.type = "checkbox"; cRef.checked = true;
    P.ctls.appendChild(ctl("Moyenne μ", rMu, oMu));
    P.ctls.appendChild(ctl("Écart-type σ", rSg, oSg));
    P.ctls.appendChild(ctl("Borne a", rA, oA));
    P.ctls.appendChild(ctl("Borne b", rB, oB));
    P.ctls.appendChild(ctl("N(0, 1) en référence", cRef));
    var bar = el("div", "viz-btns");
    [1, 2, 3].forEach(function (k) {
      var bb = btn("μ ± " + (k > 1 ? k : "") + "σ");
      bb.addEventListener("click", function () { a = mu - k * sg; b = mu + k * sg; rA.value = a; rB.value = b; draw(); });
      bar.appendChild(bb);
    });
    P.ctls.appendChild(bar);
    finish(body, P);

    function draw() {
      oMu.textContent = fmt(mu, 1); oSg.textContent = fmt(sg, 1); oA.textContent = fmt(a, 1); oB.textContent = fmt(b, 1);
      var lo = Math.min(a, b), hi = Math.max(a, b);
      var za = (lo - mu) / sg, zb = (hi - mu) / sg, pr = Phi(zb) - Phi(za);
      P.out.innerHTML = '<div class="viz-kv"><span>P(' + fmt(lo, 1) + " ≤ X ≤ " + fmt(hi, 1) + ") = <b>" + fmt(pr * 100, 2) + " %</b></span>" +
        "<span>z(a) = <b>" + fmt(za, 2) + "</b></span><span>z(b) = <b>" + fmt(zb, 2) + "</b></span></div>" +
        '<p class="viz-msg">Centrer-réduire : <code>Z = (X − μ) / σ</code> suit N(0, 1). Règle 68 – 95 – 99,7 : μ ± σ, μ ± 2σ, μ ± 3σ.</p>';
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx;
      var ymax = Math.max(0.45, pdf(mu, mu, sg) * 1.12);
      var F = Frame(st, -7, 7, 0, ymax);
      drawAxes(ctx, F, C);
      var i, x, N = 400;
      ctx.beginPath(); ctx.moveTo(F.X(lo), F.Y(0));
      for (i = 0; i <= N; i++) { x = lo + (hi - lo) * i / N; ctx.lineTo(F.X(x), F.Y(pdf(x, mu, sg))); }
      ctx.lineTo(F.X(hi), F.Y(0)); ctx.closePath();
      ctx.fillStyle = C.accent; ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1;
      if (ref) {
        ctx.strokeStyle = C.muted; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.3; ctx.beginPath();
        for (i = 0; i <= N; i++) { x = -7 + 14 * i / N; if (i === 0) ctx.moveTo(F.X(x), F.Y(pdf(x, 0, 1))); else ctx.lineTo(F.X(x), F.Y(pdf(x, 0, 1))); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.strokeStyle = C.primary; ctx.lineWidth = 2.5; ctx.beginPath();
      for (i = 0; i <= N; i++) { x = -7 + 14 * i / N; if (i === 0) ctx.moveTo(F.X(x), F.Y(pdf(x, mu, sg))); else ctx.lineTo(F.X(x), F.Y(pdf(x, mu, sg))); }
      ctx.stroke();
      ctx.strokeStyle = C.orange; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(F.X(mu), F.Y(0)); ctx.lineTo(F.X(mu), F.Y(pdf(mu, mu, sg))); ctx.stroke();
    }
    rMu.addEventListener("input", function () { mu = +rMu.value; draw(); });
    rSg.addEventListener("input", function () { sg = +rSg.value; draw(); });
    rA.addEventListener("input", function () { a = +rA.value; draw(); });
    rB.addEventListener("input", function () { b = +rB.value; draw(); });
    cRef.addEventListener("change", function () { ref = cRef.checked; draw(); });
    draw();
    return { draw: draw };
  }

  /* ---------- Utilitaires partagés par les widgets 6 et suivants ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function txt(ctx, s, x, y, color, font, align, base) {
    ctx.fillStyle = color; ctx.font = font || "12px system-ui, sans-serif";
    ctx.textAlign = align || "center"; ctx.textBaseline = base || "middle"; ctx.fillText(s, x, y);
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function rgba(hex, a) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return hex;
    var n = parseInt(m[1], 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }
  function check(on) { var c = el("input"); c.type = "checkbox"; c.checked = !!on; return c; }
  function intFmt(n) { return Math.abs(n) < 1e15 ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f") : fmt(n); }

  /* =========================================================
     6. K-means pas à pas
     ========================================================= */
  var KCOL = ["#5b8cff", "#ff6b81", "#22c39a", "#ffb454", "#b98cff", "#2ec5d3"];
  function KMeans(body, o) {
    var k = clamp(Math.round(num(o, "k", 3)), 1, 6), g = clamp(Math.round(num(o, "groupes", 3)), 1, 6);
    var mode = o.init === "aleatoire" ? "rand" : "pp", seed = Math.round(num(o, "graine", 7));
    var pts = [], cen = [], asg = [], it = 0, phase = "assign", done = false, last = "";
    var st = Stage(body, 0.62, 400, "Nuage de points, groupes et centroïdes de l'algorithme K-means");
    var P = layout(body);
    var rK = range(1, 6, 1, k), oK = el("output", "viz-val");
    var rG = range(1, 6, 1, g), oG = el("output", "viz-val");
    var sI = select([["pp", "k-means++"], ["rand", "Aléatoire"]], mode);
    var bStep = btn("Étape ▶"), bRun = btn("⏩ Converger"), bInit = btn("🎲 Nouvelle init."), bData = btn("🔄 Nouveau jeu");
    P.ctls.appendChild(ctl("k (centroïdes)", rK, oK));
    P.ctls.appendChild(ctl("Vrais groupes", rG, oG));
    P.ctls.appendChild(ctl("Initialisation", sI));
    var bar = el("div", "viz-btns"); [bStep, bRun, bInit, bData].forEach(function (b) { bar.appendChild(b); });
    P.ctls.appendChild(bar);
    finish(body, P);

    function d2(p, c) { var dx = p.x - c[0], dy = p.y - c[1]; return dx * dx + dy * dy; }
    function gen() {
      var r = rng(seed * 7919 + g), centers = [], i;
      for (i = 0; i < g; i++) centers.push([1.6 + r() * 6.8, 1.6 + r() * 6.8]);
      pts = [];
      for (i = 0; i < 96; i++) {
        var c = centers[i % g], u = r() || 1e-9, v = r(), R = Math.sqrt(-2 * Math.log(u)) * 0.75;
        pts.push({ x: clamp(c[0] + R * Math.cos(2 * Math.PI * v), 0.2, 9.8), y: clamp(c[1] + R * Math.sin(2 * Math.PI * v), 0.2, 9.8) });
      }
    }
    function init() {
      var r = rng(seed * 104729 + k * 13 + (mode === "pp" ? 1 : 2)), i, q;
      cen = []; asg = pts.map(function () { return -1; }); it = 0; phase = "assign"; done = false;
      if (!pts.length) { last = "Clique dans le graphe pour ajouter des points."; return; }
      last = "Centroïdes initiaux placés (" + (mode === "pp" ? "<b>k-means++</b> : tirés loin les uns des autres" : "<b>au hasard</b> parmi les points") + "). Clique sur <b>Étape</b>.";
      if (mode === "pp") {
        q = pts[Math.floor(r() * pts.length)]; cen.push([q.x, q.y]);
        while (cen.length < k) {
          var D = pts.map(function (p) { return Math.min.apply(null, cen.map(function (c) { return d2(p, c); })); });
          var t = r() * D.reduce(function (s, v) { return s + v; }, 0), j = 0;
          while (j < D.length - 1 && (t -= D[j]) > 0) j++;
          cen.push([pts[j].x, pts[j].y]);
        }
      } else {
        for (i = 0; i < k; i++) { q = pts[Math.floor(r() * pts.length)]; cen.push([q.x, q.y]); }
      }
    }
    function inertia() { var s = 0; pts.forEach(function (p, i) { if (asg[i] >= 0) s += d2(p, cen[asg[i]]); }); return s; }
    function step() {
      if (done || !pts.length) return false;
      if (phase === "assign") {
        var ch = 0;
        pts.forEach(function (p, i) {
          var best = 0, bd = Infinity;
          cen.forEach(function (c, j) { var d = d2(p, c); if (d < bd) { bd = d; best = j; } });
          if (asg[i] !== best) { asg[i] = best; ch++; }
        });
        if (ch === 0 && it > 0) { done = true; last = "✅ <b>Convergé</b> en " + it + " itérations : plus aucun point ne change de groupe."; return false; }
        last = "<b>Affectation</b> : chaque point rejoint le centroïde le plus proche (" + ch + " changement" + (ch > 1 ? "s" : "") + ").";
        phase = "update";
      } else {
        cen = cen.map(function (c, j) {
          var sx = 0, sy = 0, n = 0;
          pts.forEach(function (p, i) { if (asg[i] === j) { sx += p.x; sy += p.y; n++; } });
          return n ? [sx / n, sy / n] : c;
        });
        it++;
        last = "<b>Mise à jour</b> : chaque centroïde se place au barycentre (moyenne) de ses points — itération " + it + ".";
        phase = "assign";
      }
      return true;
    }
    function draw() {
      oK.textContent = String(k); oG.textContent = String(g);
      var msg = last;
      if (done && k !== g) msg += k < g ? " ⚠️ k est plus petit que le nombre réel de groupes : des groupes distincts sont fusionnés."
        : " ⚠️ k dépasse le nombre réel de groupes : un vrai groupe est découpé artificiellement (et l'inertie baisse quand même !).";
      else if (done) msg += " Relance une <b>nouvelle init.</b> : l'inertie finale peut changer (minimum local).";
      P.out.innerHTML = '<div class="viz-kv"><span>Itération <b>' + it + "</b></span><span>Inertie = <b>" + fmt(inertia(), 2) +
        "</b></span><span>n = <b>" + pts.length + "</b></span></div>" + '<p class="viz-msg">' + msg + "</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, F = Frame(st, 0, 10, 0, 10, 24, true);
      drawAxes(ctx, F, C);
      if (phase === "update" && !done) {
        ctx.save(); ctx.globalAlpha = 0.25; ctx.lineWidth = 1;
        pts.forEach(function (p, i) {
          if (asg[i] < 0) return;
          ctx.strokeStyle = KCOL[asg[i]]; ctx.beginPath(); ctx.moveTo(F.X(p.x), F.Y(p.y));
          ctx.lineTo(F.X(cen[asg[i]][0]), F.Y(cen[asg[i]][1])); ctx.stroke();
        });
        ctx.restore();
      }
      pts.forEach(function (p, i) { dot(ctx, F.X(p.x), F.Y(p.y), 4.5, asg[i] >= 0 ? KCOL[asg[i]] : C.muted); });
      cen.forEach(function (c, j) {
        var X = F.X(c[0]), Y = F.Y(c[1]);
        ctx.save(); ctx.fillStyle = KCOL[j]; ctx.strokeStyle = C.text; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.rect(X - 8, Y - 8, 16, 16); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X - 5, Y - 5); ctx.lineTo(X + 5, Y + 5); ctx.moveTo(X + 5, Y - 5); ctx.lineTo(X - 5, Y + 5); ctx.stroke();
        ctx.restore();
      });
    }
    rK.addEventListener("input", function () { k = clamp(Math.round(+rK.value), 1, 6); init(); draw(); });
    rG.addEventListener("input", function () { g = clamp(Math.round(+rG.value), 1, 6); gen(); init(); draw(); });
    sI.addEventListener("change", function () { mode = sI.value; init(); draw(); });
    bStep.addEventListener("click", function () { step(); draw(); });
    bRun.addEventListener("click", function () { var n = 0; while (step() && n++ < 400) {} draw(); });
    bInit.addEventListener("click", function () { seed++; init(); draw(); });
    bData.addEventListener("click", function () { seed++; gen(); init(); draw(); });
    st.canvas.addEventListener("click", function (ev) {
      if (!st.w) return;
      var F = Frame(st, 0, 10, 0, 10, 24, true), m = st.pos(ev), x = F.ix(m.x), y = F.iy(m.y);
      if (x < 0 || x > 10 || y < 0 || y > 10) return;
      pts.push({ x: x, y: y }); asg.push(-1);
      if (!cen.length) init(); else { done = false; phase = "assign"; }
      last = "Point ajouté : relance des <b>Étapes</b> pour voir l'algorithme s'adapter.";
      draw();
    });
    gen(); init(); draw();
    return { draw: draw };
  }

  /* =========================================================
     7. Seuil de décision : matrice de confusion & courbe ROC
     ========================================================= */
  function Seuil(body, o) {
    var sep = clamp(num(o, "separation", 1.6), 0, 4), prev = clamp(num(o, "prevalence", 0.3), 0.01, 0.9), t = clamp(num(o, "seuil", 0), -4, 4);
    var st = Stage(body, 0.5, 360, "Distributions des scores des classes négative et positive, seuil de décision et courbe ROC");
    var P = layout(body);
    var rS = range(0, 4, 0.1, sep), oS = el("output", "viz-val");
    var rP = range(1, 90, 1, Math.round(prev * 100)), oP = el("output", "viz-val");
    var rT = range(-4, 4, 0.05, t), oT = el("output", "viz-val");
    P.ctls.appendChild(ctl("Séparation des classes", rS, oS));
    P.ctls.appendChild(ctl("Part de positifs", rP, oP));
    P.ctls.appendChild(ctl("Seuil de décision", rT, oT));
    finish(body, P);
    var N = 1000, wl = 0;
    function rates(th) { return { tpr: 1 - Phi(th - sep / 2), fpr: 1 - Phi(th + sep / 2) }; }
    function draw() {
      oS.textContent = fmt(sep, 1); oP.textContent = Math.round(prev * 100) + " %"; oT.textContent = fmt(t, 2);
      var Pn = N * prev, Nn = N - Pn, r = rates(t);
      var TP = Pn * r.tpr, FN = Pn - TP, FP = Nn * r.fpr, TN = Nn - FP;
      var prec = TP + FP > 1e-9 ? TP / (TP + FP) : 1, rec = r.tpr, f1 = prec + rec > 0 ? 2 * prec * rec / (prec + rec) : 0;
      var acc = (TP + TN) / N, auc = Phi(sep / Math.SQRT2), R = Math.round, msg;
      if (sep < 0.15) msg = "Classes indiscernables : la courbe ROC colle à la diagonale (AUC ≈ 0,5) — le modèle ne fait pas mieux que le hasard.";
      else if (rec > 0.9 && prec < 0.6) msg = "Seuil <b>bas</b> : presque tous les positifs sont détectés (rappel ↑) au prix de nombreuses fausses alertes (précision ↓). Utile en dépistage.";
      else if (prec > 0.9 && rec < 0.6) msg = "Seuil <b>haut</b> : quand le modèle dit « positif » il a presque toujours raison (précision ↑), mais il en rate beaucoup (rappel ↓). Utile contre le spam.";
      else msg = "Déplace le seuil (ou clique sur le graphe de gauche) : VP, FP, FN et VN s'échangent. La courbe ROC, elle, ne dépend que de la <b>séparation</b> des classes.";
      if (prev < 0.1 && acc > 0.9) msg += " ⚠️ Avec si peu de positifs, l'accuracy est élevée même quand on rate des positifs : ne la regarde pas seule.";
      P.out.innerHTML = '<table class="viz-cm"><tr><th></th><th>Prédit +</th><th>Prédit −</th></tr>' +
        '<tr><th>Réel +</th><td class="tp">VP ' + R(TP) + '</td><td class="fn">FN ' + R(FN) + "</td></tr>" +
        '<tr><th>Réel −</th><td class="fp">FP ' + R(FP) + '</td><td class="tn">VN ' + R(TN) + "</td></tr></table>" +
        '<div class="viz-kv"><span>Précision <b>' + fmt(prec * 100, 1) + " %</b></span><span>Rappel <b>" + fmt(rec * 100, 1) +
        " %</b></span><span>F1 <b>" + fmt(f1, 3) + "</b></span><span>Accuracy <b>" + fmt(acc * 100, 1) + " %</b></span><span>Taux de FP <b>" +
        fmt(r.fpr * 100, 1) + " %</b></span><span>AUC <b>" + fmt(auc, 3) + "</b></span></div>" +
        '<p class="viz-msg">' + msg + "</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx;
      wl = Math.round(st.w * 0.6);
      var FL = Frame({ w: wl, h: st.h }, -5, 5, 0, Math.max(prev, 1 - prev) * 0.43, 26);
      drawAxes(ctx, FL, C);
      function area(mu, w, a, b, color) {
        if (b <= a) return;
        ctx.beginPath(); ctx.moveTo(FL.X(a), FL.Y(0));
        for (var i = 0; i <= 120; i++) { var x = a + (b - a) * i / 120; ctx.lineTo(FL.X(x), FL.Y(w * pdf(x, mu, 1))); }
        ctx.lineTo(FL.X(b), FL.Y(0)); ctx.closePath(); ctx.fillStyle = rgba(color, 0.38); ctx.fill();
      }
      function curve(mu, w, color) {
        ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath();
        for (var i = 0; i <= 200; i++) { var x = -5 + 10 * i / 200; if (i === 0) ctx.moveTo(FL.X(x), FL.Y(w * pdf(x, mu, 1))); else ctx.lineTo(FL.X(x), FL.Y(w * pdf(x, mu, 1))); }
        ctx.stroke();
      }
      area(-sep / 2, 1 - prev, -5, t, C.muted); area(-sep / 2, 1 - prev, t, 5, C.red);
      area(sep / 2, prev, -5, t, C.orange); area(sep / 2, prev, t, 5, C.green);
      curve(-sep / 2, 1 - prev, C.soft); curve(sep / 2, prev, C.green);
      ctx.save(); ctx.strokeStyle = C.text; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(FL.X(t), FL.Y(FL.ymin)); ctx.lineTo(FL.X(t), FL.Y(FL.ymax)); ctx.stroke(); ctx.restore();
      txt(ctx, "seuil", FL.X(t), 12, C.text, "bold 12px system-ui, sans-serif");
      txt(ctx, "négatifs", FL.X(-sep / 2 - 1.6), 30, C.soft); txt(ctx, "positifs", FL.X(sep / 2 + 1.6), 30, C.green);
      ctx.save(); ctx.translate(wl, 0);
      var FR = Frame({ w: st.w - wl, h: st.h }, 0, 1, 0, 1, 26, true);
      drawAxes(ctx, FR, C);
      ctx.strokeStyle = C.muted; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(FR.X(0), FR.Y(0)); ctx.lineTo(FR.X(1), FR.Y(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.primary; ctx.lineWidth = 2.5; ctx.beginPath();
      for (var i = 0; i <= 160; i++) { var q = rates(7 - 14 * i / 160); if (i === 0) ctx.moveTo(FR.X(q.fpr), FR.Y(q.tpr)); else ctx.lineTo(FR.X(q.fpr), FR.Y(q.tpr)); }
      ctx.stroke();
      dot(ctx, FR.X(r.fpr), FR.Y(r.tpr), 6, C.red, C.card);
      txt(ctx, "ROC (TPR vs FPR)", FR.X(0.5), 12, C.text, "bold 12px system-ui, sans-serif");
      ctx.restore();
    }
    rS.addEventListener("input", function () { sep = +rS.value; draw(); });
    rP.addEventListener("input", function () { prev = +rP.value / 100; draw(); });
    rT.addEventListener("input", function () { t = +rT.value; draw(); });
    st.canvas.addEventListener("click", function (ev) {
      var m = st.pos(ev);
      if (!st.w || m.x > wl) return;
      var FL = Frame({ w: wl, h: st.h }, -5, 5, 0, 1, 26);
      t = clamp(Math.round(FL.ix(m.x) * 20) / 20, -4, 4); rT.value = t; draw();
    });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     8. Théorème de Bayes en population (1 000 personnes)
     ========================================================= */
  function Bayes(body, o) {
    var p = clamp(num(o, "prevalence", 0.01), 0.001, 0.5), se = clamp(num(o, "sensibilite", 0.99), 0.5, 1), sp = clamp(num(o, "specificite", 0.95), 0.5, 1);
    function sOf(x) { return Math.round(Math.log(x / 0.001) / Math.log(500) * 100); }
    function pOf(s) { return 0.001 * Math.pow(500, s / 100); }
    var st = Stage(body, 0.42, 300, "Population de 1000 personnes répartie en vrais positifs, faux positifs, faux négatifs et vrais négatifs");
    var P = layout(body);
    var rP = range(0, 100, 1, sOf(p)), oP = el("output", "viz-val");
    var rSe = range(50, 100, 0.5, se * 100), oSe = el("output", "viz-val");
    var rSp = range(50, 100, 0.5, sp * 100), oSp = el("output", "viz-val");
    P.ctls.appendChild(ctl("Prévalence P(M)", rP, oP));
    P.ctls.appendChild(ctl("Sensibilité P(+ | M)", rSe, oSe));
    P.ctls.appendChild(ctl("Spécificité P(− | non M)", rSp, oSp));
    finish(body, P);
    function draw() {
      oP.textContent = fmt(p * 100, p < 0.01 ? 2 : 1) + " %"; oSe.textContent = fmt(se * 100, 1) + " %"; oSp.textContent = fmt(sp * 100, 1) + " %";
      var M = Math.round(1000 * p), TP = Math.round(M * se), FN = M - TP, FP = Math.round((1000 - M) * (1 - sp)), TN = 1000 - M - FP;
      var vpp = se * p / (se * p + (1 - sp) * (1 - p)), vpn = sp * (1 - p) / (sp * (1 - p) + (1 - se) * p);
      var C = palette(body);
      var leg = function (c, t) { return '<span><i style="display:inline-block;width:11px;height:11px;border-radius:3px;background:' + c + ';margin-right:5px"></i>' + t + "</span>"; };
      var msg = "Sur 1 000 personnes : <b>" + M + "</b> malades, <b>" + (TP + FP) + "</b> tests positifs dont seulement <b>" + TP + "</b> vrais positifs.";
      if (vpp < 0.5) msg += " ⚠️ <b>Paradoxe du faux positif</b> : la maladie est si rare que les sains testés positifs sont plus nombreux que les malades. P(M | +) ≠ P(+ | M) !";
      P.out.innerHTML = '<div class="viz-kv">' + leg(C.green, "VP " + TP) + leg(C.red, "FP " + FP) + leg(C.orange, "FN " + FN) + leg(rgba(C.muted, 0.45), "VN " + TN) + "</div>" +
        '<div class="viz-kv"><span>P(M | +) = VPP = <b>' + fmt(vpp * 100, 1) + " %</b></span><span>P(non M | −) = VPN = <b>" + fmt(vpn * 100, 2) + " %</b></span></div>" +
        '<p class="viz-msg">' + msg + " Bayes : <code>P(M | +) = P(+ | M)·P(M) / P(+)</code>.</p>";
      if (!st.fit()) return;
      var ctx = st.ctx, cols = 50, rows = 20, cs = Math.min((st.w - 16) / cols, (st.h - 16) / rows), x0 = (st.w - cs * cols) / 2, y0 = (st.h - cs * rows) / 2;
      for (var i = 0; i < 1000; i++) {
        var col = i < TP ? C.green : i < TP + FP ? C.red : i < TP + FP + FN ? C.orange : rgba(C.muted, 0.35);
        ctx.fillStyle = col;
        ctx.fillRect(x0 + (i % cols) * cs + 1, y0 + Math.floor(i / cols) * cs + 1, Math.max(1, cs - 2), Math.max(1, cs - 2));
      }
    }
    rP.addEventListener("input", function () { p = pOf(+rP.value); draw(); });
    rSe.addEventListener("input", function () { se = +rSe.value / 100; draw(); });
    rSp.addEventListener("input", function () { sp = +rSp.value / 100; draw(); });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     9. Triangle de Pascal & modèles de dénombrement
     ========================================================= */
  function binom(n, k) { if (k < 0 || k > n) return 0; k = Math.min(k, n - k); var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  function Pascal(body, o) {
    var N = clamp(Math.round(num(o, "lignes", 8)), 3, 15), n = clamp(Math.round(num(o, "n", 5)), 0, N), k = clamp(Math.round(num(o, "k", 2)), 0, n), par = o.mode === "parite";
    var st = Stage(body, 0.6, 420, "Triangle de Pascal avec le coefficient binomial sélectionné et ses deux parents");
    var P = layout(body);
    var rN = range(3, 15, 1, N), oN = el("output", "viz-val");
    var rn = range(0, 15, 1, n), on = el("output", "viz-val");
    var rk = range(0, 15, 1, k), ok = el("output", "viz-val");
    var cPar = check(par);
    P.ctls.appendChild(ctl("Lignes affichées", rN, oN));
    P.ctls.appendChild(ctl("n", rn, on));
    P.ctls.appendChild(ctl("k", rk, ok));
    P.ctls.appendChild(ctl("Colorier la parité", cPar));
    finish(body, P);
    function geom() { var cw = Math.min(48, (st.w - 12) / (N + 1)), ch = Math.min(30, (st.h - 12) / (N + 1)); return { cw: cw, ch: ch }; }
    function cell(r, c, G) { return { x: st.w / 2 + (c - r / 2) * G.cw, y: 6 + G.ch / 2 + r * G.ch }; }
    function draw() {
      n = Math.min(n, N); k = Math.min(k, n);
      rn.max = N; rn.value = n; rk.max = n; rk.value = k;
      oN.textContent = String(N); on.textContent = String(n); ok.textContent = String(k);
      var v = binom(n, k), A = 1, i;
      for (i = 0; i < k; i++) A *= (n - i);
      P.out.innerHTML = '<div class="viz-kv"><span>C(' + n + ", " + k + ") = n! / (k!·(n−k)!) = <b>" + intFmt(v) + "</b></span>" +
        (n > 0 ? "<span>Pascal : C(" + (n - 1) + ", " + (k - 1) + ") + C(" + (n - 1) + ", " + k + ") = " + binom(n - 1, k - 1) + " + " + binom(n - 1, k) + "</span>" : "") +
        "<span>Somme de la ligne = 2^" + n + " = <b>" + intFmt(Math.pow(2, n)) + "</b></span></div>" +
        '<p class="viz-msg">Tirer k = ' + k + " objets parmi n = " + n + " : ordonné avec remise <b>n^k = " + intFmt(Math.pow(n, k)) +
        "</b> · ordonné sans remise <b>A = n!/(n−k)! = " + intFmt(A) + "</b> · non ordonné sans remise <b>C(n, k) = " + intFmt(v) +
        "</b> · non ordonné avec remise <b>C(n+k−1, k) = " + intFmt(binom(n + k - 1, k)) + "</b>. Clique sur une case du triangle.</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, G = geom(), fs = Math.max(8, Math.min(13, G.cw * 0.3));
      for (var r = 0; r <= N; r++) for (var c = 0; c <= r; c++) {
        var q = cell(r, c, G), val = binom(r, c), fill = C.card, tc = C.text;
        if (r === n && c === k) { fill = C.primary; tc = "#fff"; }
        else if (r === n - 1 && (c === k - 1 || c === k)) { fill = C.orange; tc = "#1b1b1b"; }
        else if (par && val % 2 === 1) fill = rgba(C.accent, 0.45);
        rrect(ctx, q.x - G.cw / 2 + 1.5, q.y - G.ch / 2 + 1.5, G.cw - 3, G.ch - 3, 5);
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.stroke();
        txt(ctx, val >= 1e4 ? (val / 1000).toFixed(0) + "k" : String(val), q.x, q.y + 0.5, tc, fs + "px system-ui, sans-serif");
      }
    }
    rN.addEventListener("input", function () { N = +rN.value; draw(); });
    rn.addEventListener("input", function () { n = +rn.value; draw(); });
    rk.addEventListener("input", function () { k = +rk.value; draw(); });
    cPar.addEventListener("change", function () { par = cPar.checked; draw(); });
    st.canvas.addEventListener("click", function (ev) {
      if (!st.w) return;
      var m = st.pos(ev), G = geom(), r = Math.floor((m.y - 6) / G.ch);
      if (r < 0 || r > N) return;
      var c = Math.round((m.x - st.w / 2) / G.cw + r / 2);
      if (c < 0 || c > r) return;
      n = r; k = c; draw();
    });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     10. Entropie de Shannon & impureté de Gini
     ========================================================= */
  function Entropie(body, o) {
    var k = clamp(Math.round(num(o, "k", 4)), 2, 6), w = [];
    var init = String(o.poids || "").split(/[\s,;]+/).map(parseFloat);
    for (var i = 0; i < 6; i++) w.push(isFinite(init[i]) ? init[i] : 50);
    var st = Stage(body, 0.42, 300, "Diagramme en barres d'une distribution de probabilité et son entropie");
    var P = layout(body);
    var rK = range(2, 6, 1, k), oK = el("output", "viz-val");
    var box = el("div", "viz-ctls"), sl = [];
    var b1 = btn("Uniforme"), b2 = btn("Presque certaine"), b3 = btn("Pièce truquée 90/10");
    P.ctls.appendChild(ctl("Nombre de classes", rK, oK));
    var bar = el("div", "viz-btns"); [b1, b2, b3].forEach(function (b) { bar.appendChild(b); });
    P.ctls.appendChild(bar);
    P.ctls.appendChild(box);
    finish(body, P);
    function rebuild() {
      box.innerHTML = ""; sl = [];
      for (var j = 0; j < k; j++) (function (j) {
        var r = range(0, 100, 1, w[j]);
        r.addEventListener("input", function () { w[j] = +r.value; draw(); });
        box.appendChild(ctl("Poids classe " + (j + 1), r)); sl.push(r);
      })(j);
    }
    function probs() {
      var s = 0, j; for (j = 0; j < k; j++) s += w[j];
      var p = []; for (j = 0; j < k; j++) p.push(s > 0 ? w[j] / s : 1 / k);
      return p;
    }
    function draw() {
      oK.textContent = String(k);
      var p = probs(), H = 0, G = 1, Hm = Math.log(k) / Math.LN2;
      p.forEach(function (q) { if (q > 0) H -= q * Math.log(q) / Math.LN2; G -= q * q; });
      var msg = H < 0.05 ? "Distribution (presque) certaine : aucune surprise, entropie ≈ 0 bit. Un nœud d'arbre <b>pur</b>."
        : H > Hm - 0.02 ? "Distribution <b>uniforme</b> : incertitude maximale, H = log₂ k = " + fmt(Hm, 3) + " bits."
        : "Entre les deux : plus les probabilités sont déséquilibrées, plus l'entropie baisse.";
      P.out.innerHTML = '<div class="viz-kv"><span>H = −Σ p log₂ p = <b>' + fmt(H, 3) + " bits</b></span><span>H max = log₂ " + k + " = <b>" + fmt(Hm, 3) +
        "</b></span><span>Gini = 1 − Σ p² = <b>" + fmt(G, 3) + "</b></span></div>" +
        '<p class="viz-msg">' + msg + " Au-dessus des barres : la <b>surprise</b> −log₂ p d'un résultat. Un arbre de décision choisit la coupure qui fait le plus baisser H (ou Gini) : c'est le <b>gain d'information</b>.</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, F = Frame(st, 0, k, 0, 1.15, 28);
      drawAxes(ctx, F, C);
      p.forEach(function (q, j) {
        var x0 = F.X(j + 0.15), x1 = F.X(j + 0.85), y = F.Y(q);
        ctx.fillStyle = KCOL[j]; ctx.fillRect(x0, y, x1 - x0, F.Y(0) - y);
        txt(ctx, fmt(q, 2), (x0 + x1) / 2, y - 18, C.text, "bold 12px system-ui, sans-serif");
        txt(ctx, q > 0 ? fmt(-Math.log(q) / Math.LN2, 2) + " bit" : "∞", (x0 + x1) / 2, y - 6, C.soft, "11px system-ui, sans-serif");
      });
    }
    function setAll(arr) { for (var j = 0; j < 6; j++) w[j] = arr[j] != null ? arr[j] : 0; rebuild(); draw(); }
    rK.addEventListener("input", function () { k = +rK.value; rebuild(); draw(); });
    b1.addEventListener("click", function () { setAll([50, 50, 50, 50, 50, 50]); });
    b2.addEventListener("click", function () { setAll([100, 1, 1, 1, 1, 1]); });
    b3.addEventListener("click", function () { k = 2; rK.value = 2; setAll([90, 10]); });
    rebuild(); draw();
    return { draw: draw };
  }

  /* =========================================================
     11. Parcours de graphe : BFS, DFS, Dijkstra pas à pas
     ========================================================= */
  var GNODES = { A: [0.05, 0.5], B: [0.28, 0.12], C: [0.28, 0.88], D: [0.52, 0.36], E: [0.52, 0.8], F: [0.76, 0.1], G: [0.76, 0.56], H: [0.96, 0.9] };
  var GEDGES = [["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["C", "D", 9], ["C", "E", 8], ["D", "E", 2],
    ["D", "F", 3], ["D", "G", 6], ["E", "G", 4], ["F", "G", 1], ["G", "H", 2], ["E", "H", 7]];
  function Graphe(body, o) {
    var algo = ["bfs", "dfs", "dijkstra"].indexOf(o.algo) >= 0 ? o.algo : "bfs", src = GNODES[o.depart] ? o.depart : "A";
    var names = Object.keys(GNODES), adj = {};
    names.forEach(function (n) { adj[n] = []; });
    GEDGES.forEach(function (e) { adj[e[0]].push([e[1], e[2]]); adj[e[1]].push([e[0], e[2]]); });
    names.forEach(function (n) { adj[n].sort(function (a, b) { return a[0] < b[0] ? -1 : 1; }); });
    var st = Stage(body, 0.55, 380, "Graphe pondéré parcouru pas à pas");
    var P = layout(body);
    var sA = select([["bfs", "BFS (largeur, file)"], ["dfs", "DFS (profondeur, pile)"], ["dijkstra", "Dijkstra (poids ≥ 0)"]], algo);
    var sS = select(names.map(function (n) { return [n, n]; }), src);
    var bPrev = btn("◀ Pas"), bNext = btn("Pas ▶"), bPlay = btn("▶ Animer"), bReset = btn("↺");
    P.ctls.appendChild(ctl("Algorithme", sA));
    P.ctls.appendChild(ctl("Sommet de départ", sS));
    var bar = el("div", "viz-btns"); [bPrev, bNext, bPlay, bReset].forEach(function (b) { bar.appendChild(b); });
    P.ctls.appendChild(bar);
    finish(body, P);
    var steps = [], idx = 0, timer = null;
    function build() {
      steps = [];
      var S = { cur: null, done: [], front: [], dist: {}, parent: {}, order: [], msg: "" };
      function snap() { steps.push(JSON.parse(JSON.stringify(S))); }
      if (algo === "bfs") {
        var q = [src], seen = {}; seen[src] = 1; S.dist[src] = 0; S.front = q.slice();
        S.msg = "Départ : on enfile <b>" + src + "</b> (distance 0)."; snap();
        while (q.length) {
          var u = q.shift(), added = [];
          S.cur = u; S.order.push(u); S.done.push(u);
          adj[u].forEach(function (e) { var v = e[0]; if (!seen[v]) { seen[v] = 1; S.dist[v] = S.dist[u] + 1; S.parent[v] = u; q.push(v); added.push(v); } });
          S.front = q.slice();
          S.msg = "On défile <b>" + u + "</b> et on enfile ses voisins pas encore vus" + (added.length ? " : " + added.join(", ") : " (aucun)") + ".";
          snap();
        }
        S.cur = null; S.msg = "✅ BFS terminé : les distances en <b>nombre d'arêtes</b> sont minimales. BFS = plus court chemin d'un graphe <b>non pondéré</b>."; snap();
      } else if (algo === "dfs") {
        var vis = {}, stack = [];
        (function dfs(u, d) {
          vis[u] = 1; stack.push(u); S.cur = u; S.order.push(u); S.done.push(u); S.front = stack.slice(); S.dist[u] = d;
          S.msg = "On visite <b>" + u + "</b> et on s'enfonce vers son premier voisin non visité."; snap();
          adj[u].forEach(function (e) { if (!vis[e[0]]) { S.parent[e[0]] = u; dfs(e[0], d + 1); } });
          stack.pop(); S.cur = stack.length ? stack[stack.length - 1] : null; S.front = stack.slice();
          S.msg = "<b>" + u + "</b> n'a plus de voisin non visité : on <b>remonte</b> (backtrack)."; snap();
        })(src, 0);
        S.cur = null; S.msg = "✅ DFS terminé. Les arêtes colorées forment l'<b>arbre de parcours en profondeur</b> ; la profondeur affichée n'est PAS une plus courte distance."; snap();
      } else {
        var D = {}, fixed = {};
        names.forEach(function (n) { D[n] = Infinity; }); D[src] = 0; S.dist[src] = 0; S.front = [src];
        S.msg = "Initialisation : d(" + src + ") = 0, tous les autres à +∞."; snap();
        for (;;) {
          var m = null;
          names.forEach(function (n) { if (!fixed[n] && D[n] < Infinity && (m === null || D[n] < D[m])) m = n; });
          if (m === null) break;
          fixed[m] = 1; S.cur = m; S.order.push(m); S.done.push(m);
          var rel = [];
          adj[m].forEach(function (e) {
            var v = e[0], nd = D[m] + e[1];
            if (!fixed[v] && nd < D[v]) { rel.push(v + " : " + (D[v] === Infinity ? "∞" : D[v]) + " → " + nd); D[v] = nd; S.dist[v] = nd; S.parent[v] = m; }
          });
          S.front = names.filter(function (n) { return !fixed[n] && D[n] < Infinity; });
          S.msg = "On <b>fixe " + m + "</b> (plus petite distance provisoire = " + D[m] + ") puis on relâche ses arêtes" + (rel.length ? " : " + rel.join(" ; ") : " (aucune amélioration)") + ".";
          snap();
        }
        S.cur = null; S.msg = "✅ Dijkstra terminé : distances minimales depuis " + src + ". Les arêtes colorées forment l'arbre des plus courts chemins."; snap();
      }
      idx = 0;
    }
    function px(n) { var pd = 26; return { x: pd + GNODES[n][0] * (st.w - 2 * pd), y: pd + GNODES[n][1] * (st.h - 2 * pd) }; }
    function draw() {
      var s = steps[idx], lab = algo === "bfs" ? "File" : algo === "dfs" ? "Pile d'appels" : "Provisoires";
      P.out.innerHTML = '<div class="viz-kv"><span>Étape <b>' + idx + " / " + (steps.length - 1) + "</b></span><span>Ordre : <b>" +
        (s.order.join(" → ") || "—") + "</b></span><span>" + lab + " : <b>[" + s.front.join(", ") + "]</b></span>" +
        (algo === "dijkstra" ? "<span>d = <b>" + names.map(function (n) { return n + ":" + (s.dist[n] != null ? s.dist[n] : "∞"); }).join(" ") + "</b></span>" : "") +
        '</div><p class="viz-msg">' + s.msg + "</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, R = clamp(st.w / 32, 12, 19);
      GEDGES.forEach(function (e) {
        var a = px(e[0]), b = px(e[1]), tree = s.parent[e[1]] === e[0] || s.parent[e[0]] === e[1];
        ctx.strokeStyle = tree ? C.primary : C.border; ctx.lineWidth = tree ? 4 : 1.6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (algo === "dijkstra") {
          var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          dot(ctx, mx, my, 9, C.card); txt(ctx, String(e[2]), mx, my + 0.5, C.soft, "bold 11px system-ui, sans-serif");
        }
      });
      names.forEach(function (n) {
        var q = px(n), fill = C.card, tc = C.text;
        if (n === s.cur) { fill = C.red; tc = "#fff"; }
        else if (s.front.indexOf(n) >= 0) { fill = C.orange; tc = "#1b1b1b"; }
        else if (s.done.indexOf(n) >= 0) { fill = C.green; tc = "#0b1d16"; }
        dot(ctx, q.x, q.y, R, fill, n === src ? C.text : C.muted);
        txt(ctx, n, q.x, q.y + 0.5, tc, "bold 14px system-ui, sans-serif");
        if (s.dist[n] != null) txt(ctx, (algo === "dfs" ? "p=" : "d=") + s.dist[n], q.x, q.y - R - 8, C.text, "11px system-ui, sans-serif");
      });
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } bPlay.textContent = "▶ Animer"; }
    sA.addEventListener("change", function () { stop(); algo = sA.value; build(); draw(); });
    sS.addEventListener("change", function () { stop(); src = sS.value; build(); draw(); });
    bNext.addEventListener("click", function () { stop(); if (idx < steps.length - 1) idx++; draw(); });
    bPrev.addEventListener("click", function () { stop(); if (idx > 0) idx--; draw(); });
    bReset.addEventListener("click", function () { stop(); idx = 0; draw(); });
    bPlay.addEventListener("click", function () {
      if (timer) { stop(); return; }
      if (idx >= steps.length - 1) idx = 0;
      bPlay.textContent = "⏸ Pause";
      timer = setInterval(function () { if (idx < steps.length - 1) { idx++; draw(); } else stop(); }, 900);
    });
    st.canvas.addEventListener("click", function (ev) {
      if (!st.w) return;
      var m = st.pos(ev);
      names.forEach(function (n) { var q = px(n); if (Math.hypot(q.x - m.x, q.y - m.y) < 22) { stop(); src = n; sS.value = n; build(); draw(); } });
    });
    build(); draw();
    return { draw: draw };
  }

  /* =========================================================
     12. Fonctions d'activation & leurs dérivées
     ========================================================= */
  function gelu(x) { return x * Phi(x); }
  var ACT = {
    sigmoide: ["Sigmoïde σ(x)", function (x) { return 1 / (1 + Math.exp(-x)); }, function (x) { var s = 1 / (1 + Math.exp(-x)); return s * (1 - s); },
      "Sortie dans ]0 ; 1[, lisible comme une probabilité. Mais σ′(x) ≤ 0,25 : à travers 10 couches, le gradient est multiplié par au plus 0,25¹⁰ ≈ 10⁻⁶ → <b>gradient évanescent</b>. À réserver à la sortie d'une classification binaire."],
    tanh: ["Tangente hyperbolique", function (x) { var e = Math.exp(2 * x); return isFinite(e) ? (e - 1) / (e + 1) : 1; }, function (x) { var e = Math.exp(2 * x), t = isFinite(e) ? (e - 1) / (e + 1) : 1; return 1 - t * t; },
      "Sortie dans ]−1 ; 1[ et <b>centrée en 0</b> (mieux que la sigmoïde en couche cachée), mais elle sature aussi : pour |x| grand, la dérivée tend vers 0."],
    relu: ["ReLU = max(0, x)", function (x) { return Math.max(0, x); }, function (x) { return x > 0 ? 1 : 0; },
      "Dérivée = 1 pour x > 0 : le gradient traverse les couches sans s'atténuer, et le calcul est trivial → activation <b>par défaut</b> des réseaux profonds. Pour x < 0 la dérivée est nulle : un neurone toujours négatif ne s'entraîne plus (<b>ReLU morte</b>)."],
    leaky: ["Leaky ReLU (α = 0,1)", function (x) { return x > 0 ? x : 0.1 * x; }, function (x) { return x > 0 ? 1 : 0.1; },
      "Petite pente α pour x < 0 (souvent 0,01 ; 0,1 ici pour la lisibilité) : la dérivée ne s'annule jamais, ce qui évite les neurones morts."],
    gelu: ["GELU = x·Φ(x)", gelu, function (x) { return (gelu(x + 1e-4) - gelu(x - 1e-4)) / 2e-4; },
      "Version lisse de ReLU : x pondéré par la probabilité gaussienne Φ(x). Activation des <b>Transformers</b> (BERT, GPT)."],
    lineaire: ["Identité (aucune activation)", function (x) { return x; }, function () { return 1; },
      "Sans non-linéarité, empiler des couches ne sert à rien : W₂(W₁x) = (W₂W₁)x reste <b>linéaire</b>. Un tel réseau ne peut même pas apprendre XOR."]
  };
  function Activation(body, o) {
    var key = ACT[o.fonction] ? o.fonction : "relu", x0 = clamp(num(o, "x", 1), -5, 5), showD = o.derivee !== "non";
    var st = Stage(body, 0.5, 340, "Courbe d'une fonction d'activation et de sa dérivée");
    var P = layout(body);
    var sF = select(Object.keys(ACT).map(function (k) { return [k, ACT[k][0]]; }), key);
    var rX = range(-5, 5, 0.05, x0), oX = el("output", "viz-val"), cD = check(showD);
    P.ctls.appendChild(ctl("Fonction", sF));
    P.ctls.appendChild(ctl("Entrée x", rX, oX));
    P.ctls.appendChild(ctl("Afficher la dérivée", cD));
    finish(body, P);
    function draw() {
      var A = ACT[key], f = A[1], d = A[2];
      oX.textContent = fmt(x0, 2);
      P.out.innerHTML = '<div class="viz-kv"><span>f(' + fmt(x0, 2) + ") = <b>" + fmt(f(x0), 4) + "</b></span><span>f′(" + fmt(x0, 2) + ") = <b>" + fmt(d(x0), 4) +
        '</b></span></div><p class="viz-msg">' + A[3] + "</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, F = Frame(st, -5, 5, -1.5, 3, 28);
      drawAxes(ctx, F, C);
      ctx.save(); ctx.beginPath(); ctx.rect(F.X(-5), F.Y(3), F.X(5) - F.X(-5), F.Y(-1.5) - F.Y(3)); ctx.clip();
      function plot(g, color, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash(dash || []); ctx.beginPath();
        for (var i = 0; i <= 400; i++) { var x = -5 + 10 * i / 400; if (i === 0) ctx.moveTo(F.X(x), F.Y(g(x))); else ctx.lineTo(F.X(x), F.Y(g(x))); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      plot(f, C.primary);
      if (showD) plot(d, C.orange, [6, 4]);
      ctx.restore();
      dot(ctx, F.X(x0), F.Y(f(x0)), 6, C.primary, C.card);
      if (showD) dot(ctx, F.X(x0), F.Y(d(x0)), 5, C.orange, C.card);
      txt(ctx, "f", F.X(4.6), F.Y(clamp(f(4.6), -1.3, 2.8)) - 10, C.primary, "bold 13px system-ui, sans-serif");
      if (showD) txt(ctx, "f′", F.X(-4.6), F.Y(clamp(d(-4.6), -1.3, 2.8)) - 10, C.orange, "bold 13px system-ui, sans-serif");
    }
    sF.addEventListener("change", function () { key = sF.value; draw(); });
    rX.addEventListener("input", function () { x0 = +rX.value; draw(); });
    cD.addEventListener("change", function () { showD = cD.checked; draw(); });
    st.canvas.addEventListener("click", function (ev) {
      if (!st.w) return;
      var F = Frame(st, -5, 5, -1.5, 3, 28);
      x0 = clamp(Math.round(F.ix(st.pos(ev).x) * 20) / 20, -5, 5); rX.value = x0; draw();
    });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     13. Convolution 2D (couche de CNN)
     ========================================================= */
  function imgFrom(rows) { return rows.map(function (r) { return r.split("").map(function (c) { return (+c) / 9; }); }); }
  var CIMG = {
    carre: ["Carré", imgFrom(["00000000", "00000000", "00999900", "00999900", "00999900", "00999900", "00000000", "00000000"])],
    bord: ["Bord vertical", imgFrom(["00009999", "00009999", "00009999", "00009999", "00009999", "00009999", "00009999", "00009999"])],
    croix: ["Croix", imgFrom(["00099000", "00099000", "00099000", "99999999", "99999999", "00099000", "00099000", "00099000"])],
    diagonale: ["Diagonale", imgFrom(["90000000", "99000000", "09900000", "00990000", "00099000", "00009900", "00000990", "00000099"])],
    damier: ["Damier", imgFrom(["90909090", "09090909", "90909090", "09090909", "90909090", "09090909", "90909090", "09090909"])]
  };
  var CKER = {
    identite: ["Identité", [[0, 0, 0], [0, 1, 0], [0, 0, 0]]],
    flou: ["Flou (moyenne)", [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]]],
    sobelx: ["Sobel : bords verticaux", [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]],
    sobely: ["Sobel : bords horizontaux", [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]],
    nettete: ["Netteté", [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]],
    laplacien: ["Laplacien (contours)", [[0, 1, 0], [1, -4, 1], [0, 1, 0]]]
  };
  function Convolution(body, o) {
    var im = CIMG[o.image] ? o.image : "carre", ke = CKER[o.noyau] ? o.noyau : "sobelx";
    var pad = num(o, "padding", 0) ? 1 : 0, str = num(o, "stride", 1) === 2 ? 2 : 1, relu = o.relu === "oui", si = 0, sj = 0;
    var st = Stage(body, 0.5, 340, "Image d'entrée, noyau de convolution et carte de caractéristiques en sortie");
    var P = layout(body);
    var sI = select(Object.keys(CIMG).map(function (k) { return [k, CIMG[k][0]]; }), im);
    var sK = select(Object.keys(CKER).map(function (k) { return [k, CKER[k][0]]; }), ke);
    var sP = select([["0", "0 (valid)"], ["1", "1 (same)"]], String(pad)), sS = select([["1", "1"], ["2", "2"]], String(str)), cR = check(relu);
    P.ctls.appendChild(ctl("Image", sI)); P.ctls.appendChild(ctl("Noyau", sK));
    P.ctls.appendChild(ctl("Padding", sP)); P.ctls.appendChild(ctl("Stride", sS)); P.ctls.appendChild(ctl("ReLU", cR));
    finish(body, P);
    var L = null;
    function compute() {
      var I = CIMG[im][1], K = CKER[ke][1], S = 8 + 2 * pad, n = Math.floor((S - 3) / str) + 1, Pd = [], out = [], a, b, i, j;
      for (i = 0; i < S; i++) { Pd.push([]); for (j = 0; j < S; j++) Pd[i].push(i - pad >= 0 && i - pad < 8 && j - pad >= 0 && j - pad < 8 ? I[i - pad][j - pad] : 0); }
      for (i = 0; i < n; i++) { out.push([]); for (j = 0; j < n; j++) {
        var s = 0; for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) s += K[a][b] * Pd[i * str + a][j * str + b];
        out[i].push(relu ? Math.max(0, s) : s);
      } }
      return { K: K, S: S, n: n, Pd: Pd, out: out };
    }
    function draw() {
      var R = compute();
      si = Math.min(si, R.n - 1); sj = Math.min(sj, R.n - 1);
      var terms = [], a, b;
      for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) {
        var kv = R.K[a][b], xv = R.Pd[si * str + a][sj * str + b];
        if (kv !== 0 && xv !== 0) terms.push(fmt(kv, 2) + "×" + fmt(xv, 2));
      }
      P.out.innerHTML = '<div class="viz-kv"><span>Taille de sortie = ⌊(8 + 2·' + pad + " − 3) / " + str + "⌋ + 1 = <b>" + R.n + "×" + R.n +
        "</b></span><span>Sortie[" + si + "][" + sj + "] = <b>" + fmt(R.out[si][sj], 3) + "</b></span></div>" +
        '<p class="viz-msg">Σ noyau × fenêtre = ' + (terms.length ? terms.join(" + ") : "0") + (relu ? " puis ReLU" : "") +
        ". Clique sur une case de la sortie : sa <b>fenêtre</b> (champ récepteur) s'allume dans l'entrée. Les mêmes 9 poids glissent sur toute l'image : c'est le <b>partage de poids</b> des CNN.</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, cols = R.S + 1 + 3 + 1 + R.n;
      var cs = Math.min((st.w - 16) / cols, (st.h - 36) / R.S, 34), y0 = 26;
      var xi = (st.w - cs * cols) / 2, xk = xi + (R.S + 1) * cs, xo = xk + 4 * cs;
      L = { cs: cs, y0: y0, xo: xo, n: R.n };
      txt(ctx, "Entrée " + R.S + "×" + R.S, xi + R.S * cs / 2, 12, C.soft, "bold 12px system-ui, sans-serif");
      txt(ctx, "Noyau 3×3", xk + 1.5 * cs, 12, C.soft, "bold 12px system-ui, sans-serif");
      txt(ctx, "Sortie " + R.n + "×" + R.n, xo + R.n * cs / 2, 12, C.soft, "bold 12px system-ui, sans-serif");
      var i, j, v;
      for (i = 0; i < R.S; i++) for (j = 0; j < R.S; j++) {
        v = R.Pd[i][j]; var g = Math.round(30 + v * 210);
        ctx.fillStyle = "rgb(" + g + "," + g + "," + g + ")"; ctx.fillRect(xi + j * cs, y0 + i * cs, cs - 1, cs - 1);
        if (pad && (i === 0 || j === 0 || i === R.S - 1 || j === R.S - 1)) { ctx.strokeStyle = C.muted; ctx.setLineDash([2, 2]); ctx.strokeRect(xi + j * cs + 0.5, y0 + i * cs + 0.5, cs - 2, cs - 2); ctx.setLineDash([]); }
      }
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(xi + sj * str * cs, y0 + si * str * cs, 3 * cs - 1, 3 * cs - 1);
      var km = 0; R.K.forEach(function (r) { r.forEach(function (x) { km = Math.max(km, Math.abs(x)); }); });
      for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) {
        v = R.K[i][j]; ctx.fillStyle = rgba(v >= 0 ? C.blue : C.red, 0.15 + 0.6 * Math.abs(v) / (km || 1));
        ctx.fillRect(xk + j * cs, y0 + i * cs, cs - 1, cs - 1);
        if (cs >= 18) txt(ctx, Math.abs(v) < 1 && v !== 0 ? fmt(v, 2) : String(v), xk + j * cs + cs / 2, y0 + i * cs + cs / 2, C.text, Math.min(12, cs * 0.38) + "px system-ui, sans-serif");
      }
      var om = 0; R.out.forEach(function (r) { r.forEach(function (x) { om = Math.max(om, Math.abs(x)); }); });
      for (i = 0; i < R.n; i++) for (j = 0; j < R.n; j++) {
        v = R.out[i][j]; ctx.fillStyle = rgba(v >= 0 ? C.green : C.red, 0.1 + 0.8 * Math.abs(v) / (om || 1));
        ctx.fillRect(xo + j * cs, y0 + i * cs, cs - 1, cs - 1);
        if (cs >= 22) txt(ctx, fmt(v, 1), xo + j * cs + cs / 2, y0 + i * cs + cs / 2, C.text, Math.min(11, cs * 0.32) + "px system-ui, sans-serif");
      }
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(xo + sj * cs, y0 + si * cs, cs - 1, cs - 1);
      txt(ctx, "∗", xk - cs / 2, y0 + 1.5 * cs, C.text, "bold 18px system-ui, sans-serif");
      txt(ctx, "=", xk + 3.5 * cs, y0 + 1.5 * cs, C.text, "bold 18px system-ui, sans-serif");
    }
    sI.addEventListener("change", function () { im = sI.value; draw(); });
    sK.addEventListener("change", function () { ke = sK.value; draw(); });
    sP.addEventListener("change", function () { pad = +sP.value; draw(); });
    sS.addEventListener("change", function () { str = +sS.value; draw(); });
    cR.addEventListener("change", function () { relu = cR.checked; draw(); });
    st.canvas.addEventListener("click", function (ev) {
      if (!L) return;
      var m = st.pos(ev), j = Math.floor((m.x - L.xo) / L.cs), i = Math.floor((m.y - L.y0) / L.cs);
      if (i >= 0 && j >= 0 && i < L.n && j < L.n) { si = i; sj = j; draw(); }
    });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     14. Filtre de Bloom
     ========================================================= */
  function fnv(s, seed) { var h = (2166136261 ^ seed) >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  var BWORDS = ["spark", "kafka", "hadoop", "python", "rust", "sql", "data", "cluster", "stream", "bloom", "hash", "lac", "nosql", "parquet", "hive"];
  function Bloom(body, o) {
    var m = clamp(Math.round(num(o, "m", 32)), 8, 128), k = clamp(Math.round(num(o, "k", 3)), 1, 8), items = [], hl = [], mode = "", res = "", wi = 0;
    var st = Stage(body, 0.32, 240, "Tableau de bits d'un filtre de Bloom");
    var P = layout(body);
    var rM = range(8, 128, 8, m), oM = el("output", "viz-val"), rK = range(1, 8, 1, k), oK = el("output", "viz-val");
    var inp = el("input"); inp.type = "text"; inp.placeholder = "un mot"; inp.setAttribute("aria-label", "Mot à ajouter ou tester");
    inp.style.cssText = "font:inherit;padding:7px 9px;border-radius:8px;border:1px solid var(--border);background:var(--bg-elev);color:var(--text);width:140px";
    var bAdd = btn("➕ Ajouter"), bTest = btn("🔎 Tester"), b5 = btn("+5 mots"), bClr = btn("🧹 Vider");
    P.ctls.appendChild(ctl("m (bits)", rM, oM)); P.ctls.appendChild(ctl("k (hachages)", rK, oK)); P.ctls.appendChild(ctl("Mot", inp));
    var bar = el("div", "viz-btns"); [bAdd, bTest, b5, bClr].forEach(function (b) { bar.appendChild(b); });
    P.ctls.appendChild(bar);
    finish(body, P);
    function pos(w) { var h1 = fnv(w, 0), h2 = fnv(w, 0x9e3779b9) | 1, out = []; for (var i = 0; i < k; i++) out.push((h1 + i * h2) % m); return out; }
    function bits() { var b = []; for (var i = 0; i < m; i++) b.push(0); items.forEach(function (w) { pos(w).forEach(function (p) { b[p] = 1; }); }); return b; }
    function add(w) { w = (w || "").trim().toLowerCase(); if (!w) return; if (items.indexOf(w) < 0) items.push(w); hl = pos(w); mode = "add"; res = "« " + w + " » ajouté : ses " + k + " bits [" + hl.join(", ") + "] passent à 1."; }
    function test(w) {
      w = (w || "").trim().toLowerCase(); if (!w) return;
      var B = bits(); hl = pos(w); mode = "test";
      var all = hl.every(function (p) { return B[p]; });
      if (!all) res = "« " + w + " » : au moins un bit vaut 0 → <b>certainement absent</b> (jamais de faux négatif).";
      else if (items.indexOf(w) >= 0) res = "« " + w + " » : tous ses bits valent 1 → <b>probablement présent</b> (et c'est vrai).";
      else res = "« " + w + " » : tous ses bits valent 1 alors qu'il n'a jamais été ajouté → ⚠️ <b>faux positif</b> !";
    }
    function draw() {
      oM.textContent = String(m); oK.textContent = String(k);
      var B = bits(), ones = B.reduce(function (s, v) { return s + v; }, 0), n = items.length;
      var th = Math.pow(1 - Math.exp(-k * n / m), k), kopt = n ? Math.max(1, Math.round(m / n * Math.LN2)) : null;
      P.out.innerHTML = '<div class="viz-kv"><span>n = <b>' + n + "</b> mot(s)</span><span>bits à 1 : <b>" + ones + " / " + m + "</b></span><span>P(faux positif) ≈ (1 − e^(−kn/m))^k = <b>" +
        fmt(th * 100, 2) + " %</b></span>" + (kopt ? "<span>k optimal ≈ (m/n)·ln 2 = <b>" + kopt + "</b></span>" : "") + "</div>" +
        '<p class="viz-msg">' + (res || "Ajoute des mots puis teste-en d'autres : quand le tableau se remplit de 1, les faux positifs apparaissent.") + "</p>" +
        (n ? '<p class="viz-msg">Ensemble : ' + items.join(", ") + "</p>" : "");
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, cols = Math.min(32, m), rows = Math.ceil(m / cols), cs = Math.min((st.w - 16) / cols, (st.h - 16) / rows, 40);
      var x0 = (st.w - cs * cols) / 2, y0 = (st.h - cs * rows) / 2;
      for (var i = 0; i < m; i++) {
        var x = x0 + (i % cols) * cs, y = y0 + Math.floor(i / cols) * cs;
        rrect(ctx, x + 1, y + 1, cs - 2, cs - 2, 4); ctx.fillStyle = B[i] ? C.primary : C.card; ctx.fill();
        if (hl.indexOf(i) >= 0) { ctx.lineWidth = 3; ctx.strokeStyle = mode === "add" ? C.green : (B[i] ? C.orange : C.red); ctx.stroke(); }
        else { ctx.lineWidth = 1; ctx.strokeStyle = C.border; ctx.stroke(); }
        if (cs >= 20) txt(ctx, String(B[i]), x + cs / 2, y + cs / 2, B[i] ? "#fff" : C.muted, Math.min(12, cs * 0.4) + "px system-ui, sans-serif");
      }
    }
    rM.addEventListener("input", function () { m = +rM.value; hl = []; res = ""; draw(); });
    rK.addEventListener("input", function () { k = +rK.value; hl = []; res = ""; draw(); });
    bAdd.addEventListener("click", function () { add(inp.value); inp.value = ""; draw(); });
    bTest.addEventListener("click", function () { test(inp.value); draw(); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); add(inp.value); inp.value = ""; draw(); } });
    b5.addEventListener("click", function () { for (var i = 0; i < 5; i++) { add(BWORDS[wi % BWORDS.length]); wi++; } res = "5 mots ajoutés. Teste maintenant un mot jamais ajouté (ex. « java », « scala »)."; hl = []; draw(); });
    bClr.addEventListener("click", function () { items = []; hl = []; res = ""; wi = 0; draw(); });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     15. Ownership Rust : pile, tas, moves et emprunts pas à pas
     Variables : [nom, valeur, état]. Valeur "#id" = possède un bloc du tas,
     "&x" / "&mut x" = référence vers x (variable ou bloc "#id"), sinon littéral.
     ========================================================= */
  var OWN = {
    move: ["Move d'une String", [
      'let s1 = String::from("salut");', "let s2 = s1;", '// println!("{s1}");  ← E0382', 'println!("{s2}");', "}   // fin de portée"], [
      [0, [["main", [["s1", "#1"]]]], [["#1", '"salut"']], "<code>s1</code> vit sur la <b>pile</b> (pointeur, longueur 5, capacité 5) ; les octets sont sur le <b>tas</b>. s1 en est l'unique <b>propriétaire</b>."],
      [1, [["main", [["s1", "#1", "moved"], ["s2", "#1"]]]], [["#1", '"salut"']], "<b>Move</b> : seuls (ptr, len, cap) sont copiés dans s2 — le tas n'est <b>pas</b> dupliqué. Pour éviter une double libération, Rust <b>invalide s1</b>."],
      [2, [["main", [["s1", "#1", "moved"], ["s2", "#1"]]]], [["#1", '"salut"']], "Décommenter cette ligne → <b>E0382 borrow of moved value</b>. En Python, s1 et s2 désigneraient le même objet ; en C, ce serait un futur <i>double free</i>.", 1],
      [3, [["main", [["s1", "#1", "moved"], ["s2", "#1"]]]], [["#1", '"salut"']], "s2 est le seul propriétaire : on l'utilise normalement."],
      [4, [["main", []]], [["#1", '"salut"', "freed"]], "Fin de portée : <b>drop</b> est appelé <b>une seule fois</b>, pour s2. s1 (déplacée) n'est pas libérée. Ni GC, ni fuite, ni double free."]]],
    clone: ["clone() : copie profonde", [
      'let s1 = String::from("salut");', "let s2 = s1.clone();", 'println!("{s1} {s2}");', "}   // fin de portée"], [
      [0, [["main", [["s1", "#1"]]]], [["#1", '"salut"']], "s1 possède un tampon sur le tas."],
      [1, [["main", [["s1", "#1"], ["s2", "#2"]]]], [["#1", '"salut"'], ["#2", '"salut"']], "<b>clone()</b> alloue un <b>nouveau</b> tampon et copie les octets : deux propriétaires indépendants. Coût O(n) — c'est pour ça qu'il est explicite."],
      [2, [["main", [["s1", "#1"], ["s2", "#2"]]]], [["#1", '"salut"'], ["#2", '"salut"']], "Les deux variables restent utilisables."],
      [3, [["main", []]], [["#1", '"salut"', "freed"], ["#2", '"salut"', "freed"]], "Fin de portée : drop dans l'ordre <b>inverse</b> de déclaration (s2 puis s1), chaque tampon libéré une fois."]]],
    copy: ["Types Copy (i32)", [
      "let x = 5;", "let y = x;", 'println!("{x} {y}");', "}"], [
      [0, [["main", [["x", "5"]]]], [], "Un i32 tient entièrement sur la pile : rien sur le tas."],
      [1, [["main", [["x", "5"], ["y", "5"]]]], [], "i32 implémente <b>Copy</b> : l'affectation copie les 4 octets, <b>x reste valide</b>. Pas de move pour les types simples (entiers, flottants, bool, char, &T)."],
      [2, [["main", [["x", "5"], ["y", "5"]]]], [], "Les deux sont utilisables."],
      [3, [["main", []]], [], "Fin de portée : rien à libérer sur le tas."]]],
    emprunt: ["Emprunts partagés &T (NLL)", [
      'let mut s = String::from("hi");', "let r1 = &s;", "let r2 = &s;", 'println!("{r1} {r2}");', "s.push('!');", "}"], [
      [0, [["main", [["s", "#1"]]]], [["#1", '"hi"']], "s possède le tampon « hi »."],
      [1, [["main", [["s", "#1"], ["r1", "&s"]]]], [["#1", '"hi"']], "<b>r1 = &s</b> : r1 pointe vers s mais ne possède rien. Tant que r1 sert encore, s est <b>gelée</b> (pas de modification)."],
      [2, [["main", [["s", "#1"], ["r1", "&s"], ["r2", "&s"]]]], [["#1", '"hi"']], "Plusieurs références <b>partagées</b> en même temps : autorisé, ce ne sont que des lectures."],
      [3, [["main", [["s", "#1"], ["r1", "&s"], ["r2", "&s"]]]], [["#1", '"hi"']], "Dernière utilisation de r1 et r2 : grâce aux <b>NLL</b> (non-lexical lifetimes), leurs emprunts se terminent ici, pas à la fin du bloc."],
      [4, [["main", [["s", "#1"]]]], [["#1", '"hi!"']], "Plus aucun emprunt vivant : s peut être modifiée. Si r1 était encore utilisé après cette ligne → <b>E0502</b>."],
      [5, [["main", []]], [["#1", '"hi!"', "freed"]], "Fin de portée : s est libérée ; les références n'avaient rien à libérer."]]],
    realloc: ["Pourquoi E0502 ? (Vec)", [
      "let mut v = vec![1, 2, 3];", "let premier = &v[0];", "// v.push(4);  ← E0502", 'println!("{premier}");', "v.push(4);", "}"], [
      [0, [["main", [["v", "#1"]]]], [["#1", "[1, 2, 3]  cap 3"]], "v possède un tampon de capacité 3, plein."],
      [1, [["main", [["v", "#1"], ["premier", "&#1"]]]], [["#1", "[1, 2, 3]  cap 3"]], "<b>premier</b> pointe <b>dans</b> le tampon du vecteur, sur le tas."],
      [2, [["main", [["v", "#1"], ["premier", "&#1"]]]], [["#1", "[1, 2, 3]  cap 3"]], "push pourrait <b>réallouer</b> (capacité pleine) : premier pointerait vers de la mémoire libérée. Rust refuse → <b>E0502</b> : emprunt mutable pendant un emprunt partagé.", 1],
      [3, [["main", [["v", "#1"], ["premier", "&#1"]]]], [["#1", "[1, 2, 3]  cap 3"]], "Dernière utilisation de premier : l'emprunt se termine."],
      [4, [["main", [["v", "#2"]]]], [["#1", "[1, 2, 3]  cap 3", "freed"], ["#2", "[1, 2, 3, 4]  cap 6"]], "push réalloue : nouveau tampon plus grand, copie, <b>l'ancien est libéré</b>. Exactement le scénario dangereux que le borrow checker a empêché à la ligne 3."],
      [5, [["main", []]], [["#1", "[1, 2, 3]  cap 3", "freed"], ["#2", "[1, 2, 3, 4]  cap 6", "freed"]], "Fin de portée : v est libéré."]]],
    fonction: ["Passer à une fonction", [
      "fn main() {", '    let s = String::from("hey");', "    prend(s);                 // move", '    // println!("{s}");     ← E0382', "}", "fn prend(t: String) { /* … */ }   // drop(t) ici"], [
      [1, [["main", [["s", "#1"]]]], [["#1", '"hey"']], "s possède « hey »."],
      [5, [["main", [["s", "#1", "moved"]]], ["prend", [["t", "#1"]]]], [["#1", '"hey"']], "Passer par valeur = <b>move</b> : le paramètre t devient propriétaire. Un nouveau cadre de pile est créé pour prend."],
      [2, [["main", [["s", "#1", "moved"]]]], [["#1", '"hey"', "freed"]], "Au retour de prend, t sort de portée → <b>drop</b> : le tas est libéré. Pour garder s, passer <code>&s</code> (emprunt) ou renvoyer la String."],
      [3, [["main", [["s", "#1", "moved"]]]], [["#1", '"hey"', "freed"]], "Utiliser s ici → <b>E0382</b> : elle a été déplacée dans prend.", 1],
      [4, [["main", []]], [["#1", '"hey"', "freed"]], "Fin de main : s étant déplacée, il n'y a rien à libérer."]]]
  };
  function Ownership(body, o) {
    var key = OWN[o.exemple] ? o.exemple : "move", idx = 0;
    var code = el("pre", "viz-code");
    body.appendChild(code);
    var st = Stage(body, 0.42, 300, "Schéma mémoire : pile à gauche, tas à droite, flèches de possession et d'emprunt");
    var P = layout(body);
    var sE = select(Object.keys(OWN).map(function (k) { return [k, OWN[k][0]]; }), key);
    var bPrev = btn("◀ Précédent"), bNext = btn("Suivant ▶"), bReset = btn("↺");
    P.ctls.appendChild(ctl("Exemple", sE));
    var bar = el("div", "viz-btns"); [bPrev, bNext, bReset].forEach(function (b) { bar.appendChild(b); });
    P.ctls.appendChild(bar);
    finish(body, P);
    function escH(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function draw() {
      var E = OWN[key], S = E[2][idx];
      code.innerHTML = E[1].map(function (l, i) { return '<span class="' + (i === S[0] ? (S[4] ? "cur err" : "cur") : "") + '">' + escH(l) + "</span>"; }).join("\n");
      P.out.innerHTML = '<div class="viz-kv"><span>Étape <b>' + (idx + 1) + " / " + E[2].length + '</b></span></div><p class="viz-msg">' + S[3] + "</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, W = st.w, xs = 10, ws = Math.round(W * 0.5) - 20, xh = Math.round(W * 0.58), wh = W - xh - 10;
      txt(ctx, "PILE", xs + ws / 2, 12, C.soft, "bold 12px system-ui, sans-serif");
      txt(ctx, "TAS", xh + wh / 2, 12, C.soft, "bold 12px system-ui, sans-serif");
      var rowH = 30, y = 26, rows = {}, heap = {};
      S[1].forEach(function (fr) {
        var h = 22 + fr[1].length * rowH + 6;
        rrect(ctx, xs, y, ws, h, 8); ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.stroke();
        txt(ctx, "cadre " + fr[0] + "()", xs + 8, y + 11, C.muted, "11px system-ui, sans-serif", "left");
        fr[1].forEach(function (v, i) {
          var ry = y + 22 + i * rowH, moved = v[2] === "moved";
          var borrowed = S[1].some(function (f) { return f[1].some(function (w) { return w[1] === "&" + v[0] || w[1] === "&mut " + v[0]; }); });
          rrect(ctx, xs + 6, ry, ws - 12, rowH - 6, 6); ctx.fillStyle = moved ? rgba(C.muted, 0.15) : C.card; ctx.fill();
          ctx.strokeStyle = borrowed ? C.orange : C.border; ctx.lineWidth = borrowed ? 2 : 1; ctx.stroke();
          txt(ctx, v[0], xs + 14, ry + (rowH - 6) / 2, moved ? C.muted : C.text, "bold 13px ui-monospace, monospace", "left");
          var val = v[1].charAt(0) === "#" ? "ptr ●" : v[1].charAt(0) === "&" ? "& ●" : v[1];
          var note = moved ? "déplacée" : borrowed ? "empruntée" : "";
          txt(ctx, val + (note ? "  · " + note : ""), xs + ws - 14, ry + (rowH - 6) / 2, moved ? C.muted : C.soft, "12px ui-monospace, monospace", "right");
          if (moved) { ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xs + 12, ry + (rowH - 6) / 2); ctx.lineTo(xs + 14 + ctx.measureText(v[0]).width + 30, ry + (rowH - 6) / 2); ctx.stroke(); }
          rows[v[0]] = { x: xs + ws - 8, y: ry + (rowH - 6) / 2, v: v, moved: moved };
        });
        y += h + 8;
      });
      var hy = 26;
      S[2].forEach(function (b) {
        var freed = b[2] === "freed";
        rrect(ctx, xh, hy, wh, 34, 8); ctx.fillStyle = freed ? "transparent" : rgba(C.accent, 0.16); ctx.fill();
        ctx.setLineDash(freed ? [5, 4] : []); ctx.strokeStyle = freed ? C.muted : C.accent; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, b[1], xh + wh / 2, hy + 13, freed ? C.muted : C.text, "13px ui-monospace, monospace");
        txt(ctx, b[0] + (freed ? " · libéré" : ""), xh + wh / 2, hy + 27, C.muted, "10px system-ui, sans-serif");
        heap[b[0]] = { x: xh, y: hy + 17, freed: freed };
        hy += 44;
      });
      Object.keys(rows).forEach(function (n) {
        var r = rows[n], v = r.v[1];
        if (r.moved) return;
        if (v.charAt(0) === "#" && heap[v]) arrow(ctx, r.x, r.y, heap[v].x - 2, heap[v].y, C.accent, 2);
        else if (v.charAt(0) === "&") {
          var t = v.replace(/^&(mut )?/, "");
          if (t.charAt(0) === "#" && heap[t]) arrow(ctx, r.x, r.y, heap[t].x - 2, heap[t].y + 8, C.orange, 2);
          else if (rows[t]) {
            ctx.save(); ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.beginPath();
            var bx = r.x + 26; ctx.moveTo(r.x, r.y); ctx.bezierCurveTo(bx, r.y, bx, rows[t].y, rows[t].x + 6, rows[t].y); ctx.stroke(); ctx.restore();
            dot(ctx, rows[t].x + 6, rows[t].y, 3.5, C.orange);
          }
        }
      });
    }
    sE.addEventListener("change", function () { key = sE.value; idx = 0; draw(); });
    bNext.addEventListener("click", function () { if (idx < OWN[key][2].length - 1) idx++; draw(); });
    bPrev.addEventListener("click", function () { if (idx > 0) idx--; draw(); });
    bReset.addEventListener("click", function () { idx = 0; draw(); });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     16. Jointures SQL (tables HTML)
     ========================================================= */
  var JCLI = [[1, "Ada", "Paris"], [2, "Alan", "Lyon"], [3, "Grace", "Paris"], [4, "Linus", null]];
  var JCMD = [[10, 1, 120], [11, 1, 40], [12, 3, 75], [13, 5, 60]];
  var JT = {
    inner: ["INNER JOIN", "FROM clients c\nINNER JOIN commandes o ON o.client_id = c.id", "Seules les paires qui vérifient la condition ON. Alan et Linus (sans commande) et la commande 13 (client 5 inexistant) disparaissent. Ada apparaît <b>2 fois</b> : une ligne par correspondance."],
    left: ["LEFT JOIN", "FROM clients c\nLEFT JOIN commandes o ON o.client_id = c.id", "<b>Tous les clients</b> sont gardés ; sans commande, les colonnes de o valent NULL (Alan, Linus). C'est la jointure la plus utilisée en analyse."],
    right: ["RIGHT JOIN", "FROM clients c\nRIGHT JOIN commandes o ON o.client_id = c.id", "<b>Toutes les commandes</b> sont gardées, même l'orpheline 13 (client 5 inconnu) avec des NULL côté c. Équivaut à un LEFT JOIN en inversant les tables."],
    full: ["FULL OUTER JOIN", "FROM clients c\nFULL OUTER JOIN commandes o ON o.client_id = c.id", "LEFT + RIGHT : rien n'est perdu. Indisponible en MySQL (on l'émule avec un UNION de LEFT et RIGHT)."],
    cross: ["CROSS JOIN", "FROM clients c\nCROSS JOIN commandes o", "<b>Produit cartésien</b> : 4 × 4 = 16 lignes, sans aucune condition. C'est ce qu'on obtient en oubliant le ON !"],
    anti: ["Anti-jointure", "FROM clients c\nLEFT JOIN commandes o ON o.client_id = c.id\nWHERE o.id IS NULL", "Les clients <b>sans aucune commande</b> : LEFT JOIN puis on garde les lignes où o.id IS NULL (équivaut à NOT EXISTS)."],
    semi: ["Semi-jointure (EXISTS)", "FROM clients c\nWHERE EXISTS (SELECT 1 FROM commandes o\n              WHERE o.client_id = c.id)", "Les clients ayant <b>au moins une</b> commande, chacun <b>une seule fois</b> (contrairement à INNER JOIN qui duplique Ada)."]
  };
  function Jointure(body, o) {
    var type = JT[o.type] ? o.type : "inner";
    var P = layout(body), sT = select(Object.keys(JT).map(function (k) { return [k, JT[k][0]]; }), type);
    var top = el("div", "viz-join-src"), res = el("div", "viz-join-res");
    body.appendChild(top);
    P.ctls.appendChild(ctl("Type de jointure", sT));
    body.appendChild(P.ctls); body.appendChild(res); body.appendChild(P.out);
    P.out.setAttribute("aria-live", "polite");
    function cell(v) { return v === null || v === undefined ? '<td class="null">NULL</td>' : "<td>" + v + "</td>"; }
    function rowsFor(t) {
      var out = [], hit = {};
      function match(c) { return JCMD.filter(function (x) { return x[1] === c[0]; }); }
      if (t === "cross") JCLI.forEach(function (c) { JCMD.forEach(function (x) { out.push([c, x]); }); });
      else if (t === "anti") JCLI.forEach(function (c) { if (!match(c).length) out.push([c, null]); });
      else if (t === "semi") JCLI.forEach(function (c) { if (match(c).length) out.push([c, null]); });
      else if (t === "right") JCMD.forEach(function (x) { var cs = JCLI.filter(function (c) { return c[0] === x[1]; }); if (cs.length) cs.forEach(function (c) { out.push([c, x]); }); else out.push([null, x]); });
      else {
        JCLI.forEach(function (c) { var m = match(c); m.forEach(function (x) { out.push([c, x]); hit[x[0]] = 1; }); if (!m.length && t !== "inner") out.push([c, null]); });
        JCLI.forEach(function (c) { match(c).forEach(function (x) { hit[x[0]] = 1; }); });
        if (t === "full") JCMD.forEach(function (x) { if (!hit[x[0]]) out.push([null, x]); });
      }
      return out;
    }
    function draw() {
      var rows = rowsFor(type), only = type === "anti" || type === "semi";
      var usedC = {}, usedO = {};
      rows.forEach(function (r) { if (r[0]) usedC[r[0][0]] = 1; if (r[1]) usedO[r[1][0]] = 1; });
      top.innerHTML = '<div><div class="viz-lbl">clients c</div><table class="viz-tbl"><tr><th>id</th><th>nom</th><th>ville</th></tr>' +
        JCLI.map(function (c) { return '<tr class="' + (usedC[c[0]] ? "in" : "out") + '">' + cell(c[0]) + cell(c[1]) + cell(c[2]) + "</tr>"; }).join("") + "</table></div>" +
        '<div><div class="viz-lbl">commandes o</div><table class="viz-tbl"><tr><th>id</th><th>client_id</th><th>montant</th></tr>' +
        JCMD.map(function (x) { return '<tr class="' + (only ? "na" : usedO[x[0]] ? "in" : "out") + '">' + cell(x[0]) + cell(x[1]) + cell(x[2]) + "</tr>"; }).join("") + "</table></div>";
      var head = only ? "<tr><th>c.id</th><th>c.nom</th></tr>" : "<tr><th>c.id</th><th>c.nom</th><th>o.id</th><th>o.client_id</th><th>o.montant</th></tr>";
      res.innerHTML = '<pre class="viz-code"><span>SELECT ' + (only ? "c.id, c.nom" : "c.id, c.nom, o.id, o.client_id, o.montant") + "</span>\n<span>" +
        JT[type][1].replace(/&/g, "&amp;").replace(/</g, "&lt;").split("\n").join("</span>\n<span>") + ";</span></pre>" +
        '<div class="viz-lbl">Résultat : ' + rows.length + " ligne" + (rows.length > 1 ? "s" : "") + '</div><table class="viz-tbl res">' + head +
        rows.map(function (r) {
          var c = r[0] || [null, null], x = r[1] || [null, null, null];
          return "<tr>" + cell(c[0]) + cell(c[1]) + (only ? "" : cell(x[0]) + cell(x[1]) + cell(x[2])) + "</tr>";
        }).join("") + "</table>";
      P.out.innerHTML = '<p class="viz-msg">' + JT[type][2] + " Lignes en surbrillance dans les tables sources = celles qui participent au résultat.</p>";
    }
    sT.addEventListener("change", function () { type = sT.value; draw(); });
    draw();
    return { draw: function () {} };
  }

  /* =========================================================
     17. MapReduce pas à pas (word count, tables HTML)
     ========================================================= */
  var MRTEXT = {
    chat: "le chat dort\nle chien et le chat\nle chat mange",
    logs: "GET /home 200\nGET /panier 404\nPOST /panier 200\nGET /home 200",
    big: "spark lit hdfs\nkafka nourrit spark\nspark ecrit parquet\nhdfs stocke parquet"
  };
  function hstr(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function MapReduce(body, o) {
    var preset = MRTEXT[o.texte] ? o.texte : "chat", R = clamp(Math.round(num(o, "reducers", 2)), 1, 3), comb = o.combiner === "oui", phase = 3;
    var ta = el("textarea", "viz-mr-in"); ta.value = MRTEXT[preset]; ta.rows = 4; ta.setAttribute("aria-label", "Texte d'entrée, une ligne par bloc");
    var P = layout(body);
    var sT = select([["chat", "Phrases"], ["logs", "Logs web"], ["big", "Vocabulaire Big Data"]], preset);
    var rR = range(1, 3, 1, R), oR = el("output", "viz-val"), cC = check(comb);
    var bM = btn("1 · Map"), bS = btn("2 · Shuffle"), bRd = btn("3 · Reduce");
    P.ctls.appendChild(ctl("Exemple", sT)); P.ctls.appendChild(ctl("Reducers", rR, oR)); P.ctls.appendChild(ctl("Combiner", cC));
    var bar = el("div", "viz-btns"); [bM, bS, bRd].forEach(function (b) { bar.appendChild(b); });
    P.ctls.appendChild(bar);
    var lbl = el("div", "viz-lbl", "Entrée : une ligne = un bloc HDFS (modifiable)");
    var grid = el("div", "viz-mr");
    body.appendChild(lbl); body.appendChild(ta); body.appendChild(P.ctls); body.appendChild(grid); body.appendChild(P.out);
    P.out.setAttribute("aria-live", "polite");
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
    function draw() {
      oR.textContent = String(R);
      var blocks = ta.value.split("\n").map(function (l) { return l.trim(); }).filter(Boolean).slice(0, 6);
      var maps = blocks.map(function (b) {
        var pairs = b.toLowerCase().split(/\s+/).map(function (w) { return [w, 1]; });
        if (!comb) return pairs;
        var acc = {}, order = [];
        pairs.forEach(function (p) { if (!(p[0] in acc)) { acc[p[0]] = 0; order.push(p[0]); } acc[p[0]] += 1; });
        return order.map(function (w) { return [w, acc[w]]; });
      });
      var sent = maps.reduce(function (s, m) { return s + m.length; }, 0), raw = blocks.reduce(function (s, b) { return s + b.split(/\s+/).length; }, 0);
      var red = []; for (var r = 0; r < R; r++) red.push({});
      maps.forEach(function (m) { m.forEach(function (p) { var g = red[hstr(p[0]) % R]; (g[p[0]] = g[p[0]] || []).push(p[1]); }); });
      var col = function (title, inner) { return '<div class="viz-mr-col"><div class="viz-lbl">' + title + "</div>" + inner + "</div>"; };
      var html = col("Blocs", blocks.map(function (b, i) { return '<div class="viz-mr-box"><small>bloc ' + (i + 1) + "</small>" + esc(b) + "</div>"; }).join(""));
      if (phase >= 1) html += col("Map" + (comb ? " + combiner" : ""), maps.map(function (m, i) {
        return '<div class="viz-mr-box"><small>map ' + (i + 1) + "</small>" + m.map(function (p) { return "(" + esc(p[0]) + ", " + p[1] + ")"; }).join(" ") + "</div>"; }).join(""));
      if (phase >= 2) html += col("Shuffle & tri", red.map(function (g, i) {
        return '<div class="viz-mr-box"><small>reducer ' + (i + 1) + "</small>" + Object.keys(g).sort().map(function (k) { return esc(k) + " → [" + g[k].join(", ") + "]"; }).join("<br>") + "</div>"; }).join(""));
      if (phase >= 3) html += col("Reduce", red.map(function (g, i) {
        return '<div class="viz-mr-box"><small>sortie ' + (i + 1) + "</small>" + Object.keys(g).sort().map(function (k) { return "(" + esc(k) + ", <b>" + g[k].reduce(function (s, v) { return s + v; }, 0) + "</b>)"; }).join(" ") + "</div>"; }).join(""));
      grid.innerHTML = html;
      P.out.innerHTML = '<div class="viz-kv"><span>Paires envoyées sur le réseau : <b>' + sent + "</b>" + (comb ? " (au lieu de " + raw + " sans combiner)" : "") + "</span><span>Reducers : <b>" + R + "</b></span></div>" +
        '<p class="viz-msg">' + (phase < 2 ? "Chaque map traite <b>son</b> bloc, localement, sans communiquer avec les autres." :
          phase < 3 ? "Le shuffle envoie chaque clé vers le reducer <b>hash(clé) mod " + R + "</b> : toutes les valeurs d'un même mot se retrouvent au même endroit, triées." :
          "Chaque reducer additionne la liste de valeurs de ses clés. " + (comb ? "Le combiner a déjà sommé localement : moins de paires transférées, même résultat." : "Active le <b>combiner</b> pour réduire le volume transféré.")) + "</p>";
    }
    sT.addEventListener("change", function () { ta.value = MRTEXT[sT.value]; draw(); });
    rR.addEventListener("input", function () { R = clamp(Math.round(+rR.value), 1, 3); draw(); });
    cC.addEventListener("change", function () { comb = cC.checked; draw(); });
    ta.addEventListener("input", draw);
    bM.addEventListener("click", function () { phase = 1; draw(); });
    bS.addEventListener("click", function () { phase = 2; draw(); });
    bRd.addEventListener("click", function () { phase = 3; draw(); });
    draw();
    return { draw: function () {} };
  }

  /* =========================================================
     18. Répartir des clés : modulo N vs hachage cohérent
     ========================================================= */
  function Hachage(body, o) {
    var meth = ["modulo", "coherent", "virtuels"].indexOf(o.methode) >= 0 ? o.methode : "modulo";
    var N = clamp(Math.round(num(o, "noeuds", 4)), 2, 10), K = clamp(Math.round(num(o, "cles", 120)), 20, 300), prev = null, moved = null;
    var st = Stage(body, 0.5, 360, "Anneau de hachage : clés colorées selon le nœud qui les stocke");
    var P = layout(body);
    var sM = select([["modulo", "hash(clé) mod N"], ["coherent", "Hachage cohérent"], ["virtuels", "Cohérent + 20 nœuds virtuels"]], meth);
    var rK = range(20, 300, 10, K), oK = el("output", "viz-val"), oN = el("output", "viz-val");
    var bAdd = btn("➕ Ajouter un nœud"), bDel = btn("➖ Retirer un nœud");
    P.ctls.appendChild(ctl("Méthode", sM)); P.ctls.appendChild(ctl("Nombre de clés", rK, oK)); P.ctls.appendChild(ctl("Nœuds", el("span"), oN));
    var bar = el("div", "viz-btns"); bar.appendChild(bAdd); bar.appendChild(bDel); P.ctls.appendChild(bar);
    finish(body, P);
    function u(s) { return fnv(s, 7) / 4294967296; }
    function owner(key, n) {
      if (meth === "modulo") return fnv(key, 7) % n;
      var pts = [], v = meth === "virtuels" ? 20 : 1, h = u(key), best = null, first = null;
      for (var i = 0; i < n; i++) for (var j = 0; j < v; j++) pts.push([u("noeud-" + i + "#" + j), i]);
      pts.forEach(function (p) { if (p[0] >= h && (!best || p[0] < best[0])) best = p; if (!first || p[0] < first[0]) first = p; });
      return (best || first)[1];
    }
    function assign(n) { var a = []; for (var i = 0; i < K; i++) a.push(owner("cle-" + i, n)); return a; }
    function change(dn) {
      var n2 = clamp(N + dn, 2, 10); if (n2 === N) return;
      prev = assign(N); N = n2; var now = assign(N);
      moved = prev.map(function (x, i) { return x !== now[i]; });
      draw();
    }
    function draw() {
      oK.textContent = String(K); oN.textContent = String(N);
      var a = assign(N), load = []; for (var i = 0; i < N; i++) load.push(0);
      a.forEach(function (x) { load[x]++; });
      var nm = moved ? moved.filter(Boolean).length : 0, ideal = K / N;
      var mx = Math.max.apply(null, load), mn = Math.min.apply(null, load);
      P.out.innerHTML = '<div class="viz-kv">' + (moved ? "<span>Clés déplacées : <b>" + nm + " / " + K + " (" + Math.round(100 * nm / K) + " %)</b></span>" : "") +
        "<span>Charge min / max : <b>" + mn + " / " + mx + "</b> (idéal " + fmt(ideal, 1) + ")</span></div>" +
        '<p class="viz-msg">' + (meth === "modulo" ? "Avec <code>hash mod N</code>, changer N redistribue presque <b>toutes</b> les clés (≈ 1 − 1/N déplacées) : un cache se vide, une base doit tout migrer."
          : meth === "coherent" ? "Sur l'anneau, chaque clé va au premier nœud rencontré dans le sens horaire. Ajouter un nœud ne déplace que les clés de <b>son arc</b> (≈ 1/N). Mais avec un seul point par nœud, les arcs sont très inégaux : charge déséquilibrée."
          : "Chaque nœud occupe 20 positions sur l'anneau (<b>nœuds virtuels</b>) : la charge s'équilibre et un ajout ne déplace toujours qu'≈ 1/N des clés. C'est la technique de Dynamo et Cassandra.") +
        " Clique sur « Ajouter un nœud » : les clés entourées de rouge ont changé de nœud.</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, cx = st.h / 2 + 10, cy = st.h / 2, R = st.h / 2 - 26;
      ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
      function at(t, r) { var ang = -Math.PI / 2 + 2 * Math.PI * t; return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)]; }
      for (var k = 0; k < K; k++) {
        var p = at(u("cle-" + k), R);
        dot(ctx, p[0], p[1], 4, KCOL[a[k] % 6], moved && moved[k] ? C.red : null);
      }
      if (meth !== "modulo") {
        var v = meth === "virtuels" ? 20 : 1;
        for (var i2 = 0; i2 < N; i2++) for (var j = 0; j < v; j++) {
          var q = at(u("noeud-" + i2 + "#" + j), R + 12);
          ctx.fillStyle = KCOL[i2 % 6]; ctx.fillRect(q[0] - 4, q[1] - 4, 8, 8);
        }
      } else txt(ctx, "position = hash(clé), couleur = hash mod " + N, cx, cy, C.muted, "12px system-ui, sans-serif");
      var x0 = cx + R + 40, w = st.w - x0 - 16, bh = Math.min(26, (st.h - 40) / N);
      if (w > 60) {
        txt(ctx, "Charge par nœud", x0 + w / 2, 12, C.soft, "bold 12px system-ui, sans-serif");
        load.forEach(function (l, i) {
          var y = 26 + i * bh; ctx.fillStyle = KCOL[i % 6]; ctx.fillRect(x0, y, w * l / Math.max(mx, 1), bh - 6);
          txt(ctx, "n" + (i + 1) + " : " + l, x0 + 4, y + (bh - 6) / 2, "#fff", "11px system-ui, sans-serif", "left");
        });
        ctx.strokeStyle = C.text; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x0 + w * ideal / Math.max(mx, 1), 22); ctx.lineTo(x0 + w * ideal / Math.max(mx, 1), 26 + N * bh); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    sM.addEventListener("change", function () { meth = sM.value; moved = null; draw(); });
    rK.addEventListener("input", function () { K = clamp(Math.round(+rK.value), 20, 300); moved = null; draw(); });
    bAdd.addEventListener("click", function () { change(1); });
    bDel.addEventListener("click", function () { change(-1); });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     19. Matrice d'attention (softmax, échelle, masque causal)
     ========================================================= */
  var ATOK = ["le", "chat", "noir", "dort", "sur", "le", "tapis"];
  var ASC = [ // scores QKᵀ illustratifs (fictifs) : ligne = token qui « regarde »
    [1, 3, 0.5, 0, 0, 0.5, 1], [1, 2, 3, 2.5, 0, 0, 0.5], [0.5, 3.5, 1, 0.5, 0, 0, 0], [0, 3.5, 0.5, 1, 1.5, 0, 1.5],
    [0, 0.5, 0, 2.5, 1, 1, 3], [0.5, 0, 0, 0, 1, 1, 3.5], [0.5, 1, 0, 1, 2.5, 2, 1]];
  function Attention(body, o) {
    var q = clamp(Math.round(num(o, "token", 1)), 0, ATOK.length - 1), tau = clamp(num(o, "echelle", 1), 0.2, 5), causal = o.masque === "causal";
    var st = Stage(body, 0.5, 360, "Matrice des poids d'attention entre les mots d'une phrase");
    var P = layout(body);
    var sQ = select(ATOK.map(function (t, i) { return [String(i), (i + 1) + ". " + t]; }), String(q));
    var rT = range(0.2, 5, 0.1, tau), oT = el("output", "viz-val"), cM = check(causal);
    P.ctls.appendChild(ctl("Token qui regarde (query)", sQ)); P.ctls.appendChild(ctl("Diviseur des scores (≈ √d_k)", rT, oT)); P.ctls.appendChild(ctl("Masque causal (GPT)", cM));
    finish(body, P);
    function weights() {
      return ASC.map(function (row, i) {
        var s = row.map(function (v, j) { return causal && j > i ? -Infinity : v / tau; }), m = Math.max.apply(null, s);
        var e = s.map(function (v) { return v === -Infinity ? 0 : Math.exp(v - m); }), z = e.reduce(function (a, b) { return a + b; }, 0);
        return e.map(function (v) { return v / z; });
      });
    }
    var L = null;
    function draw() {
      oT.textContent = fmt(tau, 1);
      var W = weights(), row = W[q], top = row.indexOf(Math.max.apply(null, row));
      var H = -row.reduce(function (s, p) { return p > 0 ? s + p * Math.log(p) / Math.LN2 : s; }, 0);
      P.out.innerHTML = '<div class="viz-kv"><span>« ' + ATOK[q] + " » regarde surtout <b>« " + ATOK[top] + " » (" + fmt(row[top] * 100, 0) + " %)</b></span><span>Entropie des poids : <b>" + fmt(H, 2) + " bit</b></span></div>" +
        '<p class="viz-msg">' + (tau < 0.5 ? "Diviseur petit → scores énormes → la softmax <b>sature</b> : presque tout le poids sur un seul mot, gradients quasi nuls. C'est ce qu'évite la division par √d_k."
          : tau > 3 ? "Diviseur grand → scores écrasés → poids presque <b>uniformes</b> : le mot n'apprend rien de spécifique."
          : "Chaque ligne est une softmax (somme = 1) : la sortie du mot est la moyenne des valeurs des autres mots, pondérée par ces poids.") +
        (causal ? " Masque causal : un mot ne voit que les mots <b>précédents</b> (triangle inférieur)." : "") + " Scores fictifs, choisis pour l'illustration.</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, n = ATOK.length, lab = 46, cs = Math.min((st.h - lab - 8) / n, (st.w * 0.55 - lab) / n), x0 = lab + 8, y0 = lab;
      L = { x0: x0, y0: y0, cs: cs, n: n };
      for (var i = 0; i < n; i++) {
        txt(ctx, ATOK[i], x0 - 6, y0 + i * cs + cs / 2, i === q ? C.text : C.soft, (i === q ? "bold " : "") + "12px system-ui, sans-serif", "right");
        ctx.save(); ctx.translate(x0 + i * cs + cs / 2, y0 - 6); ctx.rotate(-Math.PI / 4); txt(ctx, ATOK[i], 0, 0, C.soft, "11px system-ui, sans-serif", "left"); ctx.restore();
        for (var j = 0; j < n; j++) {
          ctx.fillStyle = causal && j > i ? rgba(C.muted, 0.12) : rgba(C.primary, 0.08 + 0.92 * W[i][j]);
          ctx.fillRect(x0 + j * cs + 1, y0 + i * cs + 1, cs - 2, cs - 2);
          if (cs > 26 && !(causal && j > i)) txt(ctx, fmt(W[i][j], 2), x0 + j * cs + cs / 2, y0 + i * cs + cs / 2, W[i][j] > 0.5 ? "#fff" : C.text, "10px system-ui, sans-serif");
        }
      }
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5; ctx.strokeRect(x0, y0 + q * cs, n * cs, cs);
      var bx = x0 + n * cs + 30, bw = st.w - bx - 12, bh = Math.min(28, (st.h - 30) / n);
      if (bw > 60) {
        txt(ctx, "Poids de « " + ATOK[q] + " »", bx + bw / 2, 12, C.soft, "bold 12px system-ui, sans-serif");
        row.forEach(function (p, j) {
          var y = 26 + j * bh; ctx.fillStyle = j === top ? C.orange : C.primary; ctx.fillRect(bx + 44, y, (bw - 90) * p, bh - 6);
          txt(ctx, ATOK[j], bx + 40, y + (bh - 6) / 2, C.soft, "11px system-ui, sans-serif", "right");
          txt(ctx, fmt(p * 100, 0) + " %", bx + 48 + (bw - 90) * p, y + (bh - 6) / 2, C.text, "11px system-ui, sans-serif", "left");
        });
      }
    }
    sQ.addEventListener("change", function () { q = +sQ.value; draw(); });
    rT.addEventListener("input", function () { tau = +rT.value; draw(); });
    cM.addEventListener("change", function () { causal = cM.checked; draw(); });
    st.canvas.addEventListener("click", function (ev) {
      if (!L) return;
      var m = st.pos(ev), i = Math.floor((m.y - L.y0) / L.cs);
      if (i >= 0 && i < L.n && m.x >= L.x0 && m.x <= L.x0 + L.n * L.cs) { q = i; sQ.value = String(i); draw(); }
    });
    draw();
    return { draw: draw };
  }

  /* =========================================================
     20. Graphe de commits Git (scénarios pas à pas)
     Commit : [id, x, voie, parents, "ghost"?] ; branches : {nom: id} ; head : branche active.
     ========================================================= */
  var GITS = {
    merge: ["Merge (commit de fusion)", [
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]]], { main: "B" }, "main", "git commit (×2)", "Deux commits sur <b>main</b>. Une branche n'est qu'une <b>étiquette mobile</b> qui pointe vers un commit."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["D", 2, 1, ["B"]]], { main: "B", feature: "D" }, "feature", "git switch -c feature ; git commit", "Créer une branche est instantané (on écrit 41 octets). HEAD suit <b>feature</b>, qui avance avec le commit D."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["D", 2, 1, ["B"]], ["E", 3, 1, ["D"]]], { main: "B", feature: "E" }, "feature", "git commit", "feature avance encore ; main n'a pas bougé."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["D", 2, 1, ["B"]], ["E", 3, 1, ["D"]], ["C", 2, 0, ["B"]]], { main: "C", feature: "E" }, "main", "git switch main ; git commit", "Pendant ce temps, quelqu'un a ajouté C sur main : les deux branches ont <b>divergé</b>."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["D", 2, 1, ["B"]], ["E", 3, 1, ["D"]], ["C", 2, 0, ["B"]], ["M", 4, 0, ["C", "E"]]], { main: "M", feature: "E" }, "main", "git merge feature", "Fusion à trois points (ancêtre commun B) : un <b>commit de fusion M à deux parents</b>. L'historique réel est conservé, mais il devient non linéaire. En cas de modifications concurrentes des mêmes lignes : <b>conflit</b> à résoudre."]]],
    ff: ["Fast-forward", [
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["C", 2, 1, ["B"]], ["D", 3, 1, ["C"]]], { main: "B", feature: "D" }, "main", "git switch main", "feature a deux commits d'avance ; main n'a <b>rien</b> de nouveau depuis le point de départ."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["C", 2, 1, ["B"]], ["D", 3, 1, ["C"]]], { main: "D", feature: "D" }, "main", "git merge feature", "Aucune divergence : Git se contente d'<b>avancer l'étiquette</b> main jusqu'à D (fast-forward). Pas de commit de fusion. <code>--no-ff</code> force un commit de fusion pour garder la trace de la branche."]]],
    rebase: ["Rebase", [
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["D", 2, 1, ["B"]], ["E", 3, 1, ["D"]], ["C", 2, 0, ["B"]]], { main: "C", feature: "E" }, "feature", "git switch feature", "Même divergence que dans le scénario « merge »."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["D", 2, 1, ["B"], 1], ["E", 3, 1, ["D"], 1], ["C", 2, 0, ["B"]], ["D'", 3, 2, ["C"]], ["E'", 4, 2, ["D'"]]], { main: "C", feature: "E'" }, "feature", "git rebase main", "Rebase <b>rejoue</b> D et E au-dessus de C : ce sont de <b>nouveaux commits</b> D′ et E′ (autres identifiants). Les anciens deviennent inaccessibles (en pointillés, récupérables via <code>git reflog</code>)."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["C", 2, 0, ["B"]], ["D'", 3, 2, ["C"]], ["E'", 4, 2, ["D'"]]], { main: "E'", feature: "E'" }, "main", "git switch main ; git merge feature", "main avance en fast-forward : historique <b>linéaire</b>. Règle d'or : ne jamais rebaser des commits déjà <b>poussés et partagés</b> — les autres ont encore D et E."]]],
    squash: ["Squash merge", [
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["w1", 2, 1, ["B"]], ["w2", 3, 1, ["w1"]], ["w3", 4, 1, ["w2"]]], { main: "B", feature: "w3" }, "main", "git switch main", "feature contient trois petits commits de travail (« wip », « fix typo »…)."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["w1", 2, 1, ["B"]], ["w2", 3, 1, ["w1"]], ["w3", 4, 1, ["w2"]], ["S", 2, 0, ["B"]]], { main: "S", feature: "w3" }, "main", "git merge --squash feature ; git commit", "Toutes les modifications sont regroupées en <b>un seul commit S</b> sur main (un seul parent). Historique propre, mais le détail des commits de feature n'est pas dans main : on supprime ensuite la branche."]]],
    annuler: ["reset vs revert", [
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["C", 2, 0, ["B"]]], { main: "C" }, "main", "git log", "C contient un bug et a déjà été <b>poussé</b>."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["C", 2, 0, ["B"], 1]], { main: "B" }, "main", "git reset --hard B", "<b>reset</b> recule l'étiquette main sur B : C disparaît de la branche (réécriture d'historique). Acceptable en local ; sur une branche partagée, il faudrait un <code>push --force</code> qui casse le travail des autres."],
      [[["A", 0, 0, []], ["B", 1, 0, ["A"]], ["C", 2, 0, ["B"]], ["C̄", 3, 0, ["C"]]], { main: "C̄" }, "main", "git revert C", "<b>revert</b> crée un <b>nouveau</b> commit C̄ qui applique l'inverse de C. L'historique n'est pas réécrit : c'est la bonne façon d'annuler un commit déjà partagé."]]]
  };
  function GitGraph(body, o) {
    var key = GITS[o.scenario] ? o.scenario : "merge", idx = 0;
    var cmd = el("pre", "viz-code");
    body.appendChild(cmd);
    var st = Stage(body, 0.36, 260, "Graphe des commits Git avec les branches et HEAD");
    var P = layout(body);
    var sS = select(Object.keys(GITS).map(function (k) { return [k, GITS[k][0]]; }), key);
    var bPrev = btn("◀ Précédent"), bNext = btn("Suivant ▶"), bReset = btn("↺");
    P.ctls.appendChild(ctl("Scénario", sS));
    var bar = el("div", "viz-btns"); [bPrev, bNext, bReset].forEach(function (b) { bar.appendChild(b); });
    P.ctls.appendChild(bar);
    finish(body, P);
    function draw() {
      var S = GITS[key][1][idx];
      cmd.innerHTML = '<span class="cur">$ ' + S[3].replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>";
      P.out.innerHTML = '<div class="viz-kv"><span>Étape <b>' + (idx + 1) + " / " + GITS[key][1].length + '</b></span></div><p class="viz-msg">' + S[4] + "</p>";
      if (!st.fit()) return;
      var C = palette(body), ctx = st.ctx, commits = S[0], pos = {};
      var maxX = Math.max.apply(null, commits.map(function (c) { return c[1]; })), dx = Math.min(110, (st.w - 120) / Math.max(1, maxX)), dy = Math.min(70, (st.h - 50) / 3);
      commits.forEach(function (c) { pos[c[0]] = { x: 50 + c[1] * dx, y: 34 + c[2] * dy, ghost: !!c[4] }; });
      commits.forEach(function (c) {
        c[3].forEach(function (p) {
          var a = pos[p], b = pos[c[0]]; if (!a) return;
          ctx.save(); ctx.strokeStyle = b.ghost ? C.muted : C.soft; ctx.lineWidth = 2; if (b.ghost) ctx.setLineDash([5, 4]);
          ctx.beginPath(); ctx.moveTo(a.x, a.y);
          if (a.y === b.y) ctx.lineTo(b.x, b.y); else ctx.bezierCurveTo((a.x + b.x) / 2, a.y, (a.x + b.x) / 2, b.y, b.x, b.y);
          ctx.stroke(); ctx.restore();
        });
      });
      commits.forEach(function (c) {
        var q = pos[c[0]];
        ctx.save(); if (q.ghost) { ctx.globalAlpha = 0.45; ctx.setLineDash([4, 3]); }
        dot(ctx, q.x, q.y, 15, q.ghost ? C.card : (c[3].length > 1 ? C.orange : C.primary), C.text);
        ctx.restore();
        txt(ctx, c[0], q.x, q.y + 0.5, q.ghost ? C.muted : "#fff", "bold 12px system-ui, sans-serif");
      });
      var stack = {};
      Object.keys(S[1]).forEach(function (b) {
        var q = pos[S[1][b]]; if (!q) return;
        var k = stack[S[1][b]] = (stack[S[1][b]] || 0) + 1, label = b + (S[2] === b ? "  ← HEAD" : "");
        ctx.font = "bold 12px system-ui, sans-serif"; var w = ctx.measureText(label).width + 14, y = q.y + 22 + (k - 1) * 22;
        rrect(ctx, q.x - w / 2, y, w, 19, 6); ctx.fillStyle = b === S[2] ? C.green : C.card; ctx.fill(); ctx.strokeStyle = C.border; ctx.stroke();
        txt(ctx, label, q.x, y + 10, b === S[2] ? "#0b1d16" : C.text, "bold 12px system-ui, sans-serif");
      });
    }
    sS.addEventListener("change", function () { key = sS.value; idx = 0; draw(); });
    bNext.addEventListener("click", function () { if (idx < GITS[key][1].length - 1) idx++; draw(); });
    bPrev.addEventListener("click", function () { if (idx > 0) idx--; draw(); });
    bReset.addEventListener("click", function () { idx = 0; draw(); });
    draw();
    return { draw: draw };
  }

  /* ---------- Registre & montage ---------- */
  var WIDGETS = {
    gradient: Gradient, matrice: Matrix, matrix: Matrix, relation: Relation,
    regression: Regression, normale: Normal, gauss: Normal,
    kmeans: KMeans, seuil: Seuil, roc: Seuil, pascal: Pascal, bayes: Bayes, graphe: Graphe, entropie: Entropie,
    activation: Activation, convolution: Convolution, bloom: Bloom, ownership: Ownership, jointure: Jointure,
    mapreduce: MapReduce, hachage: Hachage, attention: Attention, git: GitGraph
  };
  var CATALOG = [
    { id: "relation", emoji: "🔗", title: "Relations binaires",
      desc: "Coche les couples d'une relation sur E = {1…n} : la matrice booléenne, le graphe et les propriétés (réflexive, symétrique, antisymétrique, transitive) se mettent à jour, avec un contre-exemple quand une propriété tombe. Teste les clôtures (Warshall) et repère équivalences et ordres.",
      course: { label: "Maths · Relations binaires", href: "matieres/mathematiques/modules/module-1-relations-binaires.html" } },
    { id: "matrice", emoji: "🧮", title: "Matrices = transformations du plan",
      desc: "Une matrice 2×2 déforme le plan : vois la grille, le carré unité (aire × det), les vecteurs de base et les vecteurs propres (directions conservées). Anime le passage de l'identité à M.",
      course: { label: "Maths · Algèbre linéaire", href: "matieres/mathematiques/modules/module-2-algebre-lineaire.html" } },
    { id: "gradient", emoji: "⛰️", title: "Descente de gradient",
      desc: "Règle le taux d'apprentissage η, le point de départ et le momentum : observe la convergence, l'oscillation, la divergence, les minima locaux et le gradient évanescent.",
      course: { label: "Maths · Optimisation", href: "matieres/mathematiques/modules/module-5-optimisation.html" } },
    { id: "regression", emoji: "📈", title: "Régression & surapprentissage",
      desc: "Ajoute/retire des points, monte le degré du polynôme : MSE, R² et résidus en direct. Comprends le compromis biais/variance et l'effet d'une valeur aberrante.",
      course: { label: "Machine Learning · Modèles linéaires", href: "cours.html?c=ML&m=modeles-lineaires" } },
    { id: "normale", emoji: "🔔", title: "Loi normale",
      desc: "Fais varier μ et σ, choisis un intervalle [a, b] : la probabilité, les z-scores et la règle 68-95-99,7 deviennent visuels.",
      course: { label: "Maths · Probabilités", href: "matieres/mathematiques/modules/module-3-probabilites.html" } },
    { id: "bayes", emoji: "🧫", title: "Bayes & paradoxe du faux positif",
      desc: "1 000 personnes, un test de dépistage : règle prévalence, sensibilité et spécificité et vois pourquoi un test « fiable à 99 % » peut donner surtout des faux positifs.",
      course: { label: "Maths · Probabilités (Bayes)", href: "matieres/mathematiques/modules/module-3-probabilites.html" } },
    { id: "pascal", emoji: "🔺", title: "Triangle de Pascal & dénombrement",
      desc: "Clique une case : C(n, k), ses deux parents (règle de Pascal), la somme 2ⁿ et les 4 modèles de tirage (avec/sans ordre, avec/sans remise). Colorie la parité pour faire apparaître Sierpiński.",
      course: { label: "Maths · Combinatoire avancée", href: "matieres/mathematiques/modules/module-10-combinatoire.html" } },
    { id: "graphe", emoji: "🕸️", title: "Parcours de graphe : BFS, DFS, Dijkstra",
      desc: "Déroule pas à pas un parcours en largeur, en profondeur ou l'algorithme de Dijkstra : file/pile, ordre de visite, distances et arbre de parcours.",
      course: { label: "Maths · Graphes", href: "matieres/mathematiques/modules/module-6-graphes.html" } },
    { id: "entropie", emoji: "🎲", title: "Entropie & impureté de Gini",
      desc: "Modifie une distribution : entropie de Shannon, surprise de chaque issue et indice de Gini — les mesures d'impureté des arbres de décision.",
      course: { label: "Maths · Théorie de l'information", href: "matieres/mathematiques/modules/module-8-information.html" } },
    { id: "bloom", emoji: "🌸", title: "Filtre de Bloom",
      desc: "Ajoute des mots, teste-en d'autres : bits à 1, faux positifs (jamais de faux négatifs) et taux théorique (1 − e^(−kn/m))^k.",
      course: { label: "Maths · Big Data", href: "matieres/mathematiques/modules/module-9-big-data.html" } },
    { id: "kmeans", emoji: "🎯", title: "K-means pas à pas",
      desc: "Alterne affectation et mise à jour des centroïdes, compare initialisation aléatoire et k-means++, observe l'inertie et l'effet d'un mauvais k.",
      course: { label: "Machine Learning · Non supervisé", href: "cours.html?c=ML&m=non-supervise" } },
    { id: "seuil", emoji: "🚦", title: "Seuil de décision & courbe ROC",
      desc: "Déplace le seuil d'un classifieur : matrice de confusion, précision, rappel, F1, accuracy et point sur la courbe ROC en direct.",
      course: { label: "Machine Learning · Évaluation", href: "cours.html?c=ML&m=evaluation" } },
    { id: "activation", emoji: "⚡", title: "Fonctions d'activation",
      desc: "Sigmoïde, tanh, ReLU, Leaky ReLU, GELU : la courbe et sa dérivée, pour comprendre le gradient évanescent et les neurones morts.",
      course: { label: "Deep Learning · Le neurone", href: "cours.html?c=DL&m=neurone" } },
    { id: "convolution", emoji: "🖼️", title: "Convolution (CNN)",
      desc: "Fais glisser un noyau 3×3 sur une image : détection de bords, flou, padding, stride, ReLU et champ récepteur.",
      course: { label: "Deep Learning · CNN", href: "cours.html?c=DL&m=cnn" } },
    { id: "ownership", emoji: "🦀", title: "Ownership Rust : pile & tas",
      desc: "Avance ligne par ligne : moves, clone, Copy, emprunts, réallocation d'un Vec et passage à une fonction, avec les erreurs E0382/E0502 expliquées.",
      course: { label: "Rust · Ownership", href: "cours.html?c=RUST&m=m05-ownership-la-possession" } },
    { id: "jointure", emoji: "🔗", title: "Jointures SQL",
      desc: "INNER, LEFT, RIGHT, FULL, CROSS, anti- et semi-jointure sur deux petites tables : la requête, le résultat et les lignes qui participent.",
      course: { label: "SQL · Jointures", href: "matieres/sql/index.html" } },
    { id: "mapreduce", emoji: "🗂️", title: "MapReduce pas à pas",
      desc: "Un word count réparti en blocs : map local, shuffle par hachage de la clé, reduce. Active le combiner et compare le nombre de paires envoyées sur le réseau.",
      course: { label: "Big Data · Hadoop & MapReduce", href: "cours.html?c=BIGD&m=hadoop" } },
    { id: "hachage", emoji: "💍", title: "Partitionner : modulo vs hachage cohérent",
      desc: "Ajoute ou retire un nœud : avec hash mod N presque toutes les clés bougent, avec l'anneau de hachage cohérent seulement ≈ 1/N. Les nœuds virtuels équilibrent la charge.",
      course: { label: "Big Data · Fondations", href: "cours.html?c=BIGD&m=fondations" } },
    { id: "attention", emoji: "👁️", title: "Matrice d'attention",
      desc: "Choisis un mot : ses poids d'attention sur la phrase, l'effet de la division par √d_k sur la softmax (saturation ou uniformité) et le masque causal d'un GPT.",
      course: { label: "Deep Learning · Transformers", href: "cours.html?c=DL&m=transformers" } },
    { id: "git", emoji: "🌿", title: "Graphe de commits Git",
      desc: "Merge, fast-forward, rebase, squash, reset ou revert : vois comment chaque commande déplace les branches et HEAD et transforme l'historique.",
      course: { label: "Git · Rebase & historique", href: "cours.html?c=GIT&m=rebase" } }
  ];

  var live = [];
  function mount(root) {
    (root || document).querySelectorAll(".viz[data-viz]").forEach(function (fig) {
      if (fig.__viz) return;
      var name = (fig.getAttribute("data-viz") || "").toLowerCase();
      var W = WIDGETS[name];
      var fb = fig.querySelector(".viz-fallback");
      if (!W) {
        if (fb) fb.textContent = "⚠️ Visualisation inconnue : « " + name + " ». Disponibles : " + CATALOG.map(function (c) { return c.id; }).join(", ") + ".";
        fig.__viz = { draw: function () {} };
        return;
      }
      var opts = {};
      try { opts = JSON.parse(fig.getAttribute("data-opts") || "{}") || {}; } catch (e) {}
      var body = el("div", "viz-body");
      if (fb) fig.replaceChild(body, fb); else fig.insertBefore(body, fig.firstChild);
      try {
        fig.__viz = W(body, opts);
        live.push(fig.__viz);
      } catch (e) {
        body.textContent = "⚠️ Impossible d'afficher cette visualisation (" + e.message + ").";
        fig.__viz = { draw: function () {} };
      }
    });
    if (window.ResizeObserver && !mount.__ro) {
      mount.__ro = new ResizeObserver(redraw);
    }
    if (mount.__ro) (root || document).querySelectorAll(".viz-stage").forEach(function (s) { mount.__ro.observe(s); });
  }
  var pending = null;
  function redraw() {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = null;
      live.forEach(function (w) { try { w.draw(); } catch (e) {} });
    });
  }
  window.addEventListener("resize", redraw);
  if (window.MutationObserver) {
    new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });
  }

  window.Viz = { mount: mount, catalog: CATALOG, widgets: Object.keys(WIDGETS) };
})();
