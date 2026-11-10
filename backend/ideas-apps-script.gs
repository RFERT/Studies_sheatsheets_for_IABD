/* =========================================================================
   ideas-apps-script.gs — API « Boîte à idées » (Google Apps Script + Sheet)
   -------------------------------------------------------------------------
   Alternative SANS ligne de commande au Cloudflare Worker.
   Les idées sont stockées dans un Google Sheet que TU possèdes.

   Mise en place (5 min) :
     1. Crée un Google Sheet (feuille de calcul vide).
     2. Menu  Extensions > Apps Script  puis colle TOUT ce fichier.
     3. Clique  Déployer > Nouveau déploiement > type « Application Web ».
        - « Exécuter en tant que » : Moi
        - « Accès » : Tout le monde
     4. Autorise, puis copie l'URL qui finit par /exec.
     5. Colle cette URL dans  assets/ideas-config.js  (window.IDEAS_API).

   Contrat :
     GET   /exec            -> { ok:true, ideas:[ {id,cid,text,author,cat,ts}, ... ] }
     POST  /exec  (JSON)    -> { ok:true, idea:{...} }
   La SUPPRESSION se fait à la main dans le Sheet (supprime la ligne).
   Le front envoie le POST en text/plain pour éviter le préflight CORS.
   ========================================================================= */

var SHEET_NAME = "Idees";
var MAX_TEXT = 500;
var MAX_AUTHOR = 40;

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["id", "cid", "ts", "author", "cat", "text"]);
  }
  return sh;
}

function out_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
}

function doGet() {
  var sh = sheet_();
  var rows = sh.getDataRange().getValues();
  rows.shift(); // en-tête
  var ideas = rows
    .map(function (r) {
      return { id: r[0], cid: r[1], ts: Number(r[2]) || 0, author: r[3], cat: r[4], text: r[5] };
    })
    .filter(function (i) { return i.text; });
  return out_({ ok: true, ideas: ideas });
}

function doPost(e) {
  var b = {};
  try { b = JSON.parse(e.postData.contents); } catch (err) { b = {}; }

  if (b.website) return out_({ ok: true, idea: null }); // honeypot

  var text = clean_(b.text, MAX_TEXT);
  if (!text) return out_({ ok: false, error: "Texte vide." });

  var sh = sheet_();
  var cid = clean_(b.cid, 40);

  // Idempotence : si le cid existe déjà, on renvoie la ligne existante.
  if (cid) {
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === cid) {
        return out_({ ok: true, idea: {
          id: rows[i][0], cid: rows[i][1], ts: Number(rows[i][2]) || 0,
          author: rows[i][3], cat: rows[i][4], text: rows[i][5]
        } });
      }
    }
  }

  var idea = {
    id: Utilities.getUuid().slice(0, 10),
    cid: cid,
    ts: Date.now(),
    author: clean_(b.author, MAX_AUTHOR),
    cat: clean_(b.cat, 40) || "Idée",
    text: text
  };
  sh.appendRow([idea.id, idea.cid, idea.ts, idea.author, idea.cat, idea.text]);
  return out_({ ok: true, idea: idea });
}
