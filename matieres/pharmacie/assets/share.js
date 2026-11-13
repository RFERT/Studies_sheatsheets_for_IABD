/* =========================================================
   share.js — Partage d'une page ou d'une section (lien + QR code)
   100 % local : le QR code est généré ici, sans dépendance ni réseau.
   Expose : window.PHShare (et window.ESGIShare, même API que le portail IABD)
     .open(url, title, opts)   ouvre la fenêtre de partage
                               opts.sections = [{ id, title }] -> menu « Page / section »
     .button(label)            HTML d'un bouton de partage
     .qrSvg(text)              chaîne SVG du QR code (ou "" si trop long)
     .qrMatrix(text)           tableau de lignes de 0/1 (ou null)
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Générateur de QR code (octets, correction L ou M, versions 1-40) ---------- */
  var ECC_PER_BLOCK = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]
  };
  var NUM_BLOCKS = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
  };
  var FORMAT_BITS = { L: 1, M: 0 };

  function rawModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver, ecl) {
    return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ecl][ver] * NUM_BLOCKS[ecl][ver];
  }

  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsDivisor(deg) {
    var res = [], i, j;
    for (i = 0; i < deg - 1; i++) res.push(0);
    res.push(1);
    var root = 1;
    for (i = 0; i < deg; i++) {
      for (j = 0; j < deg; j++) {
        res[j] = gfMul(res[j], root);
        if (j + 1 < deg) res[j] ^= res[j + 1];
      }
      root = gfMul(root, 2);
    }
    return res;
  }
  function rsRemainder(data, div) {
    var res = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ res.shift();
      res.push(0);
      div.forEach(function (c, i) { res[i] ^= gfMul(c, f); });
    });
    return res;
  }

  function addEccAndInterleave(data, ver, ecl) {
    var nb = NUM_BLOCKS[ecl][ver], eccLen = ECC_PER_BLOCK[ecl][ver];
    var raw = Math.floor(rawModules(ver) / 8);
    var nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    var blocks = [], div = rsDivisor(eccLen), k = 0, i;
    for (i = 0; i < nb; i++) {
      var dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (i < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var out = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (var j = 0; j < blocks.length; j++) {
        if (i !== shortLen - eccLen || j >= nShort) out.push(blocks[j][i]);
      }
    }
    return out;
  }

  function alignPositions(ver) {
    if (ver === 1) return [];
    var n = Math.floor(ver / 7) + 2;
    var step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    var res = [6];
    for (var pos = ver * 4 + 10; res.length < n; pos -= step) res.splice(1, 0, pos);
    return res;
  }

  function utf8Bytes(str) {
    var s = unescape(encodeURIComponent(str)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function penalty(m, size) {
    var score = 0, x, y, run, i, j;
    var pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], rev = pat.slice().reverse();
    function finderCount(line) {
      var c = 0;
      for (var s = 0; s + 11 <= line.length; s++) {
        var a = true, b = true;
        for (var t = 0; t < 11; t++) {
          if (line[s + t] !== pat[t]) a = false;
          if (line[s + t] !== rev[t]) b = false;
          if (!a && !b) break;
        }
        if (a || b) c++;
      }
      return c;
    }
    for (i = 0; i < 2; i++) {
      for (y = 0; y < size; y++) {
        var line = [];
        for (x = 0; x < size; x++) line.push(i === 0 ? m[y][x] : m[x][y]);
        run = 1;
        for (x = 1; x < size; x++) {
          if (line[x] === line[x - 1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
          else run = 1;
        }
        score += finderCount(line) * 40;
      }
    }
    for (y = 0; y < size - 1; y++) {
      for (x = 0; x < size - 1; x++) {
        var c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
      }
    }
    var dark = 0;
    for (y = 0; y < size; y++) for (j = 0; j < size; j++) if (m[y][j]) dark++;
    var total = size * size;
    score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return score;
  }

  function buildMatrix(bytes, ecl) {
    var ver, cap;
    for (ver = 1; ver <= 40; ver++) {
      cap = dataCodewords(ver, ecl) * 8;
      if (4 + (ver <= 9 ? 8 : 16) + bytes.length * 8 <= cap) break;
    }
    if (ver > 40) return null;

    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, ver <= 9 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    for (var pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var v = 0;
      for (var k = 0; k < 8; k++) v = (v << 1) | bits[i + k];
      data.push(v);
    }
    var all = addEccAndInterleave(data, ver, ecl);

    var size = ver * 4 + 17, mod = [], fn = [], x, y;
    for (y = 0; y < size; y++) { mod.push(new Array(size).fill(0)); fn.push(new Array(size).fill(false)); }
    function setFn(px, py, v) { mod[py][px] = v ? 1 : 0; fn[py][px] = true; }

    for (i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (p) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = p[0] + dx, yy = p[1] + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) setFn(xx, yy, d !== 2 && d !== 4);
      }
    });
    var ap = alignPositions(ver);
    ap.forEach(function (ay, a) {
      ap.forEach(function (ax, b) {
        if ((a === 0 && b === 0) || (a === 0 && b === ap.length - 1) || (a === ap.length - 1 && b === 0)) return;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
          setFn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      });
    });
    function drawFormat(mask) {
      var d = (FORMAT_BITS[ecl] << 3) | mask, rem = d, n;
      for (n = 0; n < 10; n++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var f = ((d << 10) | rem) ^ 0x5412;
      function bit(n) { return ((f >>> n) & 1) === 1; }
      for (n = 0; n <= 5; n++) setFn(8, n, bit(n));
      setFn(8, 7, bit(6)); setFn(8, 8, bit(7)); setFn(7, 8, bit(8));
      for (n = 9; n < 15; n++) setFn(14 - n, 8, bit(n));
      for (n = 0; n < 8; n++) setFn(size - 1 - n, 8, bit(n));
      for (n = 8; n < 15; n++) setFn(8, size - 15 + n, bit(n));
      setFn(8, size - 8, true);
    }
    drawFormat(0);
    if (ver >= 7) {
      var r = ver, n;
      for (n = 0; n < 12; n++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      var vb = (ver << 12) | r;
      for (n = 0; n < 18; n++) {
        var col = ((vb >>> n) & 1) === 1, a = size - 11 + n % 3, b = Math.floor(n / 3);
        setFn(a, b, col); setFn(b, a, col);
      }
    }

    var idx = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var cx = right - j, up = ((right + 1) & 2) === 0, cy = up ? size - 1 - vert : vert;
          if (!fn[cy][cx] && idx < all.length * 8) {
            mod[cy][cx] = (all[idx >>> 3] >>> (7 - (idx & 7))) & 1;
            idx++;
          }
        }
      }
    }

    var masks = [
      function (a, b) { return (a + b) % 2 === 0; },
      function (a, b) { return b % 2 === 0; },
      function (a) { return a % 3 === 0; },
      function (a, b) { return (a + b) % 3 === 0; },
      function (a, b) { return (Math.floor(a / 3) + Math.floor(b / 2)) % 2 === 0; },
      function (a, b) { return a * b % 2 + a * b % 3 === 0; },
      function (a, b) { return (a * b % 2 + a * b % 3) % 2 === 0; },
      function (a, b) { return ((a + b) % 2 + a * b % 3) % 2 === 0; }
    ];
    function applyMask(mk) {
      for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++) {
        if (!fn[yy][xx] && masks[mk](xx, yy)) mod[yy][xx] ^= 1;
      }
    }
    var best = 0, bestScore = Infinity;
    for (var mk = 0; mk < 8; mk++) {
      applyMask(mk); drawFormat(mk);
      var sc = penalty(mod, size);
      if (sc < bestScore) { bestScore = sc; best = mk; }
      applyMask(mk);
    }
    applyMask(best); drawFormat(best);
    return mod;
  }

  function qrMatrix(text) {
    var bytes = utf8Bytes(String(text == null ? "" : text));
    return buildMatrix(bytes, "M") || buildMatrix(bytes, "L");
  }
  function qrSvg(text) {
    var m = qrMatrix(text);
    if (!m) return "";
    var q = 4, n = m.length, d = [];
    m.forEach(function (row, y) {
      var x = 0;
      while (x < n) {
        if (row[x]) {
          var s = x;
          while (x < n && row[x]) x++;
          d.push("M" + (s + q) + " " + (y + q) + "h" + (x - s) + "v1h-" + (x - s) + "z");
        } else x++;
      }
    });
    var t = n + q * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + " " + t +
      '" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="' + t + '" height="' + t +
      '" fill="#fff"/><path d="' + d.join("") + '" fill="#000"/></svg>';
  }

  /* ---------- Fenêtre de partage ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var injected = false;
  function injectCSS() {
    if (injected) return; injected = true;
    var css =
      ".ph-share-ov{position:fixed;inset:0;z-index:1000;background:rgba(5,8,16,.62);display:flex;align-items:center;justify-content:center;padding:14px;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);overflow-y:auto}" +
      ".ph-share-box{position:relative;width:min(380px,100%);max-height:100%;overflow-y:auto;background:var(--bg-card,#1b1f38);border:1px solid var(--border,#2c3358);border-radius:16px;padding:20px;box-shadow:0 24px 60px rgba(0,0,0,.5);color:var(--text,#e8ebff)}" +
      ".ph-share-box h3{margin:0 0 2px;font-size:19px;color:var(--text,#e8ebff)}" +
      ".ph-share-ttl{margin:0 0 12px;color:var(--muted,#7b84b0);font-size:13.5px;word-break:break-word}" +
      ".ph-share-x{position:absolute;top:8px;right:8px;width:40px;height:40px;background:transparent;border:0;color:var(--muted,#7b84b0);font-size:18px;cursor:pointer;border-radius:10px}" +
      ".ph-share-x:hover{color:var(--text,#fff);background:var(--bg-elev,#232848)}" +
      ".ph-share-sel{width:100%;margin:0 0 12px;background:var(--bg-soft,#171a2e);border:1px solid var(--border,#2c3358);color:var(--text,#e8ebff);border-radius:10px;padding:10px 12px;font:inherit;font-size:16px;min-height:44px}" +
      ".ph-share-qr{display:flex;justify-content:center;margin:4px 0 14px}" +
      ".ph-share-qr svg{width:210px;height:210px;max-width:100%;background:#fff;border-radius:12px;border:1px solid var(--border,#2c3358)}" +
      ".ph-share-qr .qr-fallback{width:210px;max-width:100%;min-height:120px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13px;color:var(--muted,#7b84b0);border:1px dashed var(--border,#2c3358);border-radius:12px;padding:12px}" +
      ".ph-share-row{display:flex;gap:8px;margin-bottom:10px}" +
      ".ph-share-row input{flex:1 1 auto;min-width:0;background:var(--bg-soft,#171a2e);border:1px solid var(--border,#2c3358);color:var(--text,#e8ebff);border-radius:10px;padding:9px 12px;font:inherit;font-size:16px;min-height:44px}" +
      ".ph-share-row input:focus,.ph-share-sel:focus{outline:2px solid var(--primary,#2fb37a);outline-offset:1px}" +
      ".ph-share-btn{cursor:pointer;border:1px solid var(--border,#2c3358);background:var(--bg-elev,#232848);color:var(--text,#e8ebff);border-radius:10px;padding:9px 14px;font:inherit;font-size:14px;font-weight:600;white-space:nowrap;min-height:44px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none}" +
      ".ph-share-btn:hover{border-color:var(--primary,#2fb37a);text-decoration:none}" +
      ".ph-share-btn.ok{border-color:var(--success,#27e0b0);color:var(--success,#27e0b0)}" +
      ".ph-share-btn.primary{background:var(--primary,#2fb37a);color:#fff;border-color:transparent}" +
      ".ph-share-actions{display:flex;gap:8px;margin-top:4px}" +
      ".ph-share-actions .ph-share-btn{flex:1 1 0;min-width:0}" +
      "@media print{.ph-share-ov{display:none!important}}";
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
  }

  var currentOv = null, lastFocus = null;
  function close() {
    if (currentOv && currentOv.parentNode) currentOv.parentNode.removeChild(currentOv);
    currentOv = null;
    document.removeEventListener("keydown", onKey, true);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab" || !currentOv) return;
    var f = currentOv.querySelectorAll("button, a[href], input, select");
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(url, title, opts) {
    injectCSS();
    if (currentOv) close();
    opts = opts || {};
    var base = (url || location.href).split("#")[0];
    var shown = url || location.href;
    var sections = opts.sections || [];
    lastFocus = document.activeElement;

    var sel = "";
    if (sections.length) {
      sel = '<select class="ph-share-sel" aria-label="Partager la page ou une section"><option value="">Page entière</option>' +
        sections.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.title) + "</option>"; }).join("") + "</select>";
    }
    var ov = document.createElement("div");
    ov.className = "ph-share-ov no-print";
    ov.innerHTML =
      '<div class="ph-share-box" role="dialog" aria-modal="true" aria-label="Partager">' +
      '<button class="ph-share-x" type="button" aria-label="Fermer">✕</button>' +
      "<h3>🔗 Partager</h3>" +
      '<p class="ph-share-ttl">' + esc(title || document.title) + "</p>" + sel +
      '<div class="ph-share-qr"></div>' +
      '<div class="ph-share-row"><input type="text" readonly value="" aria-label="Lien" />' +
      '<button class="ph-share-btn ph-share-copy" type="button">Copier</button></div>' +
      '<div class="ph-share-actions">' +
      (navigator.share ? '<button class="ph-share-btn primary ph-share-native" type="button">📤 Partager…</button>' : "") +
      '<a class="ph-share-btn ph-share-newtab" href="#" target="_blank" rel="noopener">↗ Ouvrir</a>' +
      "</div></div>";
    document.body.appendChild(ov);
    currentOv = ov;
    document.addEventListener("keydown", onKey, true);

    var input = ov.querySelector(".ph-share-row input");
    var qrBox = ov.querySelector(".ph-share-qr");
    var newtab = ov.querySelector(".ph-share-newtab");
    var select = ov.querySelector(".ph-share-sel");
    function refresh() {
      var cur = shown;
      if (select) cur = select.value ? base + "#" + select.value : base;
      shown = cur;
      input.value = cur;
      newtab.href = cur;
      var svg = qrSvg(cur);
      qrBox.innerHTML = svg || '<div class="qr-fallback">Lien trop long pour un QR code.<br>Utilise le lien ci-dessous.</div>';
    }
    refresh();
    if (select) select.addEventListener("change", refresh);

    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector(".ph-share-x").addEventListener("click", close);

    var copy = ov.querySelector(".ph-share-copy");
    copy.addEventListener("click", function () {
      var done = function () {
        copy.textContent = "Copié ✓"; copy.classList.add("ok");
        setTimeout(function () { copy.textContent = "Copier"; copy.classList.remove("ok"); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(input.value).then(done, function () {});
      else { input.select(); try { document.execCommand("copy"); done(); } catch (e) {} }
    });
    var native = ov.querySelector(".ph-share-native");
    if (native) native.addEventListener("click", function () {
      navigator.share({ title: title || document.title, url: input.value }).catch(function () {});
    });
    setTimeout(function () { copy.focus(); }, 30);
  }

  function button(label) {
    return '<button class="share-btn" id="share-btn" type="button" title="Partager (lien + QR)">' + (label || "🔗 Partager") + "</button>";
  }

  var api = { open: open, button: button, qrSvg: qrSvg, qrMatrix: qrMatrix };
  window.PHShare = api;
  if (!window.ESGIShare) window.ESGIShare = api;
})();
