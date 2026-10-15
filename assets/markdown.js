/* =========================================================
   markdown.js — Mini-parseur Markdown maison (sans dépendance)
   Pensé pour les cours du portail IABD :
   - front-matter (--- ... ---)
   - titres, paragraphes, listes, tables, citations, code
   - **gras**, *italique*, `code`, [lien](url), images
   - protège le LaTeX \( \) \[ \] et le code (MathJax typeset ensuite)
   - blocs conteneurs ::: pour callouts / quiz / exercices / culture
   Expose : window.MD.render(markdown) -> { meta, html, headings }
   ========================================================= */
(function () {
  "use strict";

  var NULc = "\u0000", NULm = "\u0001"; // marqueurs de protection

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escAttr(s) { return esc(s).replace(/"/g, "&quot;"); }

  function slug(s) {
    return (s || "").toString().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim().replace(/\s+/g, "-").replace(/-+/g, "-") || "section";
  }

  /* ---------- Front-matter ---------- */
  function parseFront(src) {
    var meta = {};
    var m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
    if (!m) return { meta: meta, body: src.replace(/^\uFEFF/, "") };
    m[1].split(/\r?\n/).forEach(function (line) {
      var mm = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
      if (!mm) return;
      var key = mm[1].trim(), val = mm[2].trim();
      if (/^\[.*\]$/.test(val)) {
        val = val.slice(1, -1).split(",").map(function (x) { return x.trim(); }).filter(Boolean);
      } else if (val.indexOf(",") !== -1 && /^(domains|tags|keywords)$/i.test(key)) {
        val = val.split(",").map(function (x) { return x.trim(); }).filter(Boolean);
      }
      meta[key] = val;
    });
    return { meta: meta, body: src.slice(m[0].length) };
  }

  /* ---------- Inline ---------- */
  function inline(text) {
    var store = [];
    function keep(html) { store.push(html); return NULc + (store.length - 1) + NULm; }

    // 1. maths display \[...\] et inline \(...\) + $...$  (gardés bruts pour MathJax)
    text = text.replace(/\\\[([\s\S]+?)\\\]/g, function (_, m) { return keep("\\[" + m + "\\]"); });
    text = text.replace(/\\\(([\s\S]+?)\\\)/g, function (_, m) { return keep("\\(" + m + "\\)"); });
    // 2. code inline `...`
    text = text.replace(/`([^`]+?)`/g, function (_, m) { return keep("<code>" + esc(m) + "</code>"); });
    // 3. images ![alt](src)
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, src, title) {
      return keep('<img src="' + escAttr(src) + '" alt="' + escAttr(alt) + '"' +
        (title ? ' title="' + escAttr(title) + '"' : "") + ' loading="lazy">');
    });
    // 4. liens [texte](url)
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, t, href, title) {
      var ext = /^https?:\/\//.test(href);
      return keep('<a href="' + escAttr(href) + '"' + (title ? ' title="' + escAttr(title) + '"' : "") +
        (ext ? ' target="_blank" rel="noopener"' : "") + ">" + esc(t) + "</a>");
    });

    // échappe le reste
    text = esc(text);

    // emphase sur le texte échappé
    text = text.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_]+?)__/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
    text = text.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?![\w])/g, "$1<em>$2</em>");
    text = text.replace(/~~([^~]+?)~~/g, "<del>$1</del>");

    // restaure les segments protégés
    text = text.replace(new RegExp(NULc + "(\\d+)" + NULm, "g"), function (_, i) { return store[+i]; });
    return text;
  }

  /* ---------- Blocs ---------- */
  function renderBlocks(src, headings) {
    var lines = src.replace(/\r\n/g, "\n").split("\n");
    var out = [];
    var i = 0;

    function isBlank(l) { return !l || !l.trim(); }

    while (i < lines.length) {
      var line = lines[i];

      // conteneur :::type titre
      var cont = /^:::\s*([A-Za-z]+)\s*(.*)$/.exec(line);
      if (cont) {
        var type = cont[1].toLowerCase(), title = cont[2].trim();
        var buf = [];
        i++;
        var depth = 1;
        while (i < lines.length) {
          if (/^:::\s*[A-Za-z]/.test(lines[i])) { depth++; buf.push(lines[i]); i++; continue; }
          if (/^:::\s*$/.test(lines[i])) { depth--; if (depth === 0) { i++; break; } buf.push(lines[i]); i++; continue; }
          buf.push(lines[i]); i++;
        }
        out.push(renderContainer(type, title, buf, headings));
        continue;
      }

      // code clôturé ```
      var fence = /^(`{3,}|~{3,})\s*([A-Za-z0-9+#-]*)\s*$/.exec(line);
      if (fence) {
        var marker = fence[1][0], lang = fence[2];
        var code = [];
        i++;
        while (i < lines.length && !(lines[i].trim()[0] === marker && new RegExp("^" + marker + "{3,}\\s*$").test(lines[i].trim()))) {
          code.push(lines[i]); i++;
        }
        i++; // saute la clôture
        out.push('<pre class="code"' + (lang ? ' data-lang="' + escAttr(lang) + '"' : "") +
          "><code>" + esc(code.join("\n")) + "</code></pre>");
        continue;
      }

      // maths en bloc \[ ... \] sur plusieurs lignes
      if (/^\s*\\\[/.test(line) && !/\\\]/.test(line)) {
        var mbuf = [line];
        i++;
        while (i < lines.length && !/\\\]/.test(lines[i])) { mbuf.push(lines[i]); i++; }
        if (i < lines.length) { mbuf.push(lines[i]); i++; }
        out.push('<p class="math-block">' + mbuf.join("\n") + "</p>");
        continue;
      }

      // titres
      var h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        var lvl = h[1].length, txt = h[2].replace(/\s+#+\s*$/, "");
        var id = slug(txt);
        if (headings && lvl <= 3) headings.push({ level: lvl, text: txt.replace(/[*_`]/g, ""), id: id });
        out.push("<h" + lvl + ' id="' + id + '">' + inline(txt) + "</h" + lvl + ">");
        i++;
        continue;
      }

      // ligne horizontale
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

      // tableau
      if (line.indexOf("|") !== -1 && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
        var headRow = splitRow(line);
        var aligns = splitRow(lines[i + 1]).map(function (c) {
          var l = /^:/.test(c.trim()), r = /:$/.test(c.trim());
          return l && r ? "center" : r ? "right" : l ? "left" : "";
        });
        i += 2;
        var body = [];
        while (i < lines.length && lines[i].indexOf("|") !== -1 && lines[i].trim()) { body.push(splitRow(lines[i])); i++; }
        var th = "<tr>" + headRow.map(function (c, k) {
          return "<th" + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : "") + ">" + inline(c.trim()) + "</th>";
        }).join("") + "</tr>";
        var tb = body.map(function (row) {
          return "<tr>" + row.map(function (c, k) {
            return "<td" + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : "") + ">" + inline(c.trim()) + "</td>";
          }).join("") + "</tr>";
        }).join("");
        out.push('<div class="tablewrap"><table><thead>' + th + "</thead><tbody>" + tb + "</tbody></table></div>");
        continue;
      }

      // citation >
      if (/^\s*>\s?/.test(line)) {
        var q = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
        out.push("<blockquote>" + renderBlocks(q.join("\n"), null) + "</blockquote>");
        continue;
      }

      // listes
      if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
        var res = parseList(lines, i);
        out.push(res.html); i = res.i;
        continue;
      }

      // blanc
      if (isBlank(line)) { i++; continue; }

      // paragraphe
      var para = [];
      while (i < lines.length && !isBlank(lines[i]) &&
        !/^(#{1,6})\s/.test(lines[i]) && !/^:::\s*[A-Za-z]/.test(lines[i]) &&
        !/^(`{3,}|~{3,})/.test(lines[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) &&
        !/^\s*>\s?/.test(lines[i]) && !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      if (para.length) out.push("<p>" + inline(para.join("\n")) + "</p>");
    }
    return out.join("\n");
  }

  function splitRow(line) {
    var s = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    var cells = [], cur = "", escp = false;
    for (var k = 0; k < s.length; k++) {
      var ch = s[k];
      if (escp) { cur += ch; escp = false; continue; }
      if (ch === "\\") { cur += ch; escp = true; continue; }
      if (ch === "|") { cells.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur);
    return cells;
  }

  function parseList(lines, i) {
    var ordered = /^\s*\d+[.)]\s+/.test(lines[i]);
    var baseIndent = /^(\s*)/.exec(lines[i])[1].length;
    var items = [];
    while (i < lines.length) {
      var m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
      if (!m || m[1].length < baseIndent) break;
      if (m[1].length > baseIndent) break; // sous-liste gérée via continuation
      var content = [m[3]];
      i++;
      // lignes de continuation (indentées, non-item)
      while (i < lines.length && lines[i].trim() &&
        !/^(\s*)([-*+]|\d+[.)])\s+/.test(lines[i]) && /^\s{2,}/.test(lines[i])) {
        content.push(lines[i].trim()); i++;
      }
      // sous-listes imbriquées
      var sub = "";
      if (i < lines.length) {
        var mm = /^(\s*)([-*+]|\d+[.)])\s+/.exec(lines[i]);
        if (mm && mm[1].length > baseIndent) {
          var r = parseList(lines, i); sub = r.html; i = r.i;
        }
      }
      items.push("<li>" + inline(content.join(" ")) + sub + "</li>");
      // sauter les lignes blanches entre items
      var save = i;
      while (i < lines.length && !lines[i].trim()) i++;
      if (i < lines.length && !/^(\s*)([-*+]|\d+[.)])\s+/.test(lines[i])) { i = save; break; }
      if (i < lines.length) {
        var next = /^(\s*)/.exec(lines[i])[1].length;
        if (next < baseIndent) { i = save; break; }
      }
    }
    var tag = ordered ? "ol" : "ul";
    return { html: "<" + tag + ">" + items.join("") + "</" + tag + ">", i: i };
  }

  /* ---------- Conteneurs ::: ---------- */
  var CALLOUTS = {
    def: { cls: "def", label: "Définition", ico: "📘" },
    info: { cls: "info", label: "Info", ico: "ℹ️" },
    tip: { cls: "tip", label: "Astuce", ico: "💡" },
    astuce: { cls: "tip", label: "Astuce", ico: "💡" },
    warn: { cls: "warn", label: "Attention", ico: "⚠️" },
    piege: { cls: "warn", label: "Piège", ico: "⚠️" },
    note: { cls: "note", label: "Note", ico: "📝" },
    goal: { cls: "goal", label: "Objectifs", ico: "🎯" },
    objectifs: { cls: "goal", label: "Objectifs", ico: "🎯" },
    exemple: { cls: "info", label: "Exemple", ico: "🔎" }
  };

  function renderContainer(type, title, buf, headings) {
    if (type === "quiz") return renderQuiz(title, buf);
    if (type === "exo" || type === "exercice") return renderExo(title, buf);
    if (type === "culture") return renderCulture(title, buf);
    var c = CALLOUTS[type];
    if (c) {
      var lab = title || c.label;
      return '<div class="callout ' + c.cls + '"><span class="label">' + c.ico + " " + esc(lab) +
        "</span>" + renderBlocks(buf.join("\n"), null) + "</div>";
    }
    // type inconnu : simple encart
    return '<div class="callout">' + (title ? '<span class="label">' + esc(title) + "</span>" : "") +
      renderBlocks(buf.join("\n"), null) + "</div>";
  }

  function renderQuiz(title, buf) {
    var q = [], opts = [], feedback = [], answer = 0, started = false;
    buf.forEach(function (l) {
      var o = /^\s*[-*]\s*\[([ xX])\]\s*(.*)$/.exec(l);
      if (o) {
        if (o[1].toLowerCase() === "x") answer = opts.length;
        opts.push(o[2]);
        started = true;
        return;
      }
      var fb = /^\s*>\s?(.*)$/.exec(l);
      if (fb) { feedback.push(fb[1]); return; }
      if (!started && l.trim()) q.push(l);
    });
    var optsHtml = opts.map(function (o) {
      return '<button type="button" class="opt">' + inline(o) + "</button>";
    }).join("");
    return '<div class="quiz" data-answer="' + answer + '">' +
      '<div class="qhead"><span class="ico">❓</span><strong>' + (esc(title) || "Quiz") + "</strong></div>" +
      '<div class="qtext">' + inline(q.join(" ")) + "</div>" +
      '<div class="options">' + optsHtml + "</div>" +
      '<div class="feedback" data-explain="' + escAttr(inline(feedback.join(" "))) + '"></div></div>';
  }

  function renderExo(title, buf) {
    var text = buf.join("\n");
    var idx = buf.findIndex(function (l) { return /^\?\?/.test(l.trim()); });
    var statement, summary = "Voir la solution", solution = "";
    if (idx !== -1) {
      statement = buf.slice(0, idx).join("\n");
      var sm = /^\?\?\s*(.*)$/.exec(buf[idx].trim());
      if (sm && sm[1].trim()) summary = sm[1].trim();
      solution = buf.slice(idx + 1).join("\n");
    } else {
      statement = text;
    }
    var html = '<div class="exo"><div class="exo-head">✍️ ' + (esc(title) || "Exercice") + "</div>" +
      renderBlocks(statement, null);
    if (solution.trim()) {
      html += '<details class="solution"><summary>' + esc(summary) + "</summary>" +
        renderBlocks(solution, null) + "</details>";
    }
    return html + "</div>";
  }

  function renderCulture(title, buf) {
    return '<section class="culture">' +
      '<div class="chead"><span class="cic">📜</span><span class="ctitle">' + (esc(title) || "Culture & histoire") +
      '</span><span class="ctag">hors programme · pour le contexte</span></div>' +
      renderBlocks(buf.join("\n"), null) + "</section>";
  }

  /* ---------- API ---------- */
  function render(src) {
    var fm = parseFront(src || "");
    var headings = [];
    var html = renderBlocks(fm.body, headings);
    return { meta: fm.meta, html: html, headings: headings };
  }

  window.MD = { render: render, inline: inline, slug: slug };
})();
