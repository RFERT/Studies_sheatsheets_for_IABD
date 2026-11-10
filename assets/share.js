/* =========================================================
   share.js — Partage d'une page (lien direct + QR code)
   Part du principe que l'utilisateur est en ligne.
   Expose : window.ESGIShare.open(url, title)
            window.ESGIShare.button() -> HTML d'un bouton
   Le QR est généré via api.qrserver.com (aucune dépendance locale).
   ========================================================= */
(function () {
  "use strict";

  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  var injected = false;
  function injectCSS() {
    if (injected) return; injected = true;
    var css = "" +
      ".esgi-share-ov{position:fixed;inset:0;z-index:1000;background:rgba(5,8,16,.62);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(2px)}" +
      ".esgi-share-box{position:relative;width:min(380px,100%);background:var(--bg-card,#141824);border:1px solid var(--border,#263); border-radius:16px;padding:20px 20px 22px;box-shadow:0 24px 60px rgba(0,0,0,.5);color:var(--text,#e8ecf5)}" +
      ".esgi-share-box h3{margin:0 0 2px;font-size:19px}" +
      ".esgi-share-ttl{margin:0 0 14px;color:var(--muted,#9aa3b8);font-size:13.5px;word-break:break-word}" +
      ".esgi-share-x{position:absolute;top:12px;right:12px;background:transparent;border:0;color:var(--muted,#9aa3b8);font-size:18px;cursor:pointer;border-radius:8px;padding:2px 8px}" +
      ".esgi-share-x:hover{color:var(--text,#fff);background:var(--bg-elev,#1c2233)}" +
      ".esgi-share-qr{display:flex;justify-content:center;margin:4px 0 14px}" +
      ".esgi-share-qr img{width:200px;height:200px;background:#fff;border-radius:12px;padding:10px;border:1px solid var(--border,#263)}" +
      ".esgi-share-qr .qr-fallback{width:200px;height:200px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13px;color:var(--muted,#9aa3b8);border:1px dashed var(--border,#263);border-radius:12px;padding:12px}" +
      ".esgi-share-row{display:flex;gap:8px;margin-bottom:10px}" +
      ".esgi-share-row input{flex:1 1 auto;min-width:0;background:var(--bg-soft,#0f1320);border:1px solid var(--border,#263);color:var(--text,#e8ecf5);border-radius:10px;padding:9px 12px;font:inherit;font-size:13px}" +
      ".esgi-share-row input:focus{outline:none;border-color:var(--primary,#6c8cff)}" +
      ".esgi-share-btn{cursor:pointer;border:1px solid var(--border,#263);background:var(--bg-elev,#1c2233);color:var(--text,#e8ecf5);border-radius:10px;padding:9px 14px;font:inherit;font-size:13.5px;font-weight:600;white-space:nowrap}" +
      ".esgi-share-btn:hover{border-color:var(--primary,#6c8cff);color:var(--primary,#6c8cff)}" +
      ".esgi-share-btn.ok{border-color:#22c38a;color:#22c38a}" +
      ".esgi-share-btn.primary{background:var(--primary,#6c8cff);color:#07121f;border-color:transparent}" +
      ".esgi-share-actions{display:flex;gap:8px;margin-top:4px}" +
      ".esgi-share-actions .esgi-share-btn{flex:1 1 auto;text-align:center}";
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  }

  function close(ov) { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); document.removeEventListener("keydown", onEsc); }
  var currentOv = null;
  function onEsc(e) { if (e.key === "Escape") close(currentOv); }

  function open(url, title) {
    injectCSS();
    url = url || location.href;
    var qr = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=" + encodeURIComponent(url);
    var ov = document.createElement("div");
    ov.className = "esgi-share-ov";
    ov.innerHTML =
      '<div class="esgi-share-box" role="dialog" aria-modal="true" aria-label="Partager">' +
      '<button class="esgi-share-x" aria-label="Fermer">✕</button>' +
      "<h3>🔗 Partager</h3>" +
      '<p class="esgi-share-ttl">' + esc(title || document.title) + "</p>" +
      '<div class="esgi-share-qr"><img src="' + esc(qr) + '" alt="QR code vers ' + esc(title || "la page") + '" ' +
      'onerror="this.outerHTML=\'<div class=&quot;qr-fallback&quot;>QR indisponible hors-ligne.<br>Utilise le lien ci-dessous.</div>\'"></div>' +
      '<div class="esgi-share-row"><input type="text" readonly value="' + esc(url) + '" aria-label="Lien" />' +
      '<button class="esgi-share-btn esgi-share-copy">Copier</button></div>' +
      '<div class="esgi-share-actions">' +
      (navigator.share ? '<button class="esgi-share-btn primary esgi-share-native">📤 Partager…</button>' : "") +
      '<a class="esgi-share-btn esgi-share-newtab" href="' + esc(url) + '" target="_blank" rel="noopener">↗ Ouvrir</a>' +
      "</div></div>";
    document.body.appendChild(ov);
    currentOv = ov;
    document.addEventListener("keydown", onEsc);

    ov.addEventListener("click", function (e) { if (e.target === ov) close(ov); });
    ov.querySelector(".esgi-share-x").addEventListener("click", function () { close(ov); });

    var input = ov.querySelector(".esgi-share-row input");
    var copy = ov.querySelector(".esgi-share-copy");
    copy.addEventListener("click", function () {
      var done = function () { copy.textContent = "Copié ✓"; copy.classList.add("ok"); setTimeout(function () { copy.textContent = "Copier"; copy.classList.remove("ok"); }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () {});
      else { input.select(); try { document.execCommand("copy"); done(); } catch (e) {} }
    });
    var native = ov.querySelector(".esgi-share-native");
    if (native) native.addEventListener("click", function () {
      navigator.share({ title: title || document.title, url: url }).catch(function () {});
    });
    setTimeout(function () { input.focus(); input.select(); }, 30);
  }

  function button(label) {
    return '<button class="share-btn" id="share-btn" type="button" title="Partager (lien + QR)">' + (label || "🔗 Partager") + "</button>";
  }

  window.ESGIShare = { open: open, button: button };
})();
