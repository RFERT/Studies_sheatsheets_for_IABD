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

  /* ---------- Registre & montage ---------- */
  var WIDGETS = {
    gradient: Gradient, matrice: Matrix, matrix: Matrix, relation: Relation,
    regression: Regression, normale: Normal, gauss: Normal
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
      course: { label: "Maths · Probabilités", href: "matieres/mathematiques/modules/module-3-probabilites.html" } }
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
