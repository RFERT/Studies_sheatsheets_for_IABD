/* =========================================================================
   ideas-worker.js — API « Boîte à idées » (Cloudflare Worker + Workers KV)
   -------------------------------------------------------------------------
   Endpoints :
     GET    /            -> { ok:true, ideas:[ {id,cid,text,author,cat,ts}, ... ] }
     POST   /            body JSON {text, author?, cat?, cid?, website?}
                         -> { ok:true, idea:{...} }         (website = honeypot anti-spam)
     DELETE /?id=<id>    en-tête  X-Admin-Key: <ADMIN_KEY>  -> { ok:true, removed:n }
     OPTIONS /           -> 204 (préflight CORS)

   CORS ouvert (*) pour fonctionner depuis GitHub Pages / file://.
   Stockage : Workers KV (binding IDEAS_KV), une seule clé "ideas" = tableau JSON.
   Déploiement : voir backend/README.md.
   ========================================================================= */

const MAX_TEXT = 500;
const MAX_AUTHOR = 40;
const MAX_CAT = 40;
const MAX_IDEAS = 3000;
const STORE_KEY = "ideas";

function cors(extra) {
  return Object.assign({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Admin-Key",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
  }, extra || {});
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: cors() });
}

function clean(value, max) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

async function readAll(env) {
  const raw = await env.IDEAS_KV.get(STORE_KEY);
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

async function writeAll(env, arr) {
  await env.IDEAS_KV.put(STORE_KEY, JSON.stringify(arr.slice(-MAX_IDEAS)));
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors() });
    }

    const url = new URL(req.url);

    try {
      if (req.method === "GET") {
        const ideas = await readAll(env);
        ideas.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        return json({ ok: true, ideas });
      }

      if (req.method === "POST") {
        let body = {};
        try { body = await req.json(); } catch (e) { body = {}; }

        // Honeypot : un bot remplit souvent ce champ invisible -> on ignore en silence.
        if (body && body.website) return json({ ok: true, idea: null });

        const text = clean(body.text, MAX_TEXT);
        if (!text) return json({ ok: false, error: "Texte vide." }, 400);

        const arr = await readAll(env);

        // Idempotence : si l'id client (cid) existe déjà, on ne duplique pas.
        const cid = typeof body.cid === "string" ? body.cid.slice(0, 40) : "";
        if (cid) {
          const existing = arr.find((i) => i.cid === cid);
          if (existing) return json({ ok: true, idea: existing });
        }

        const idea = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          cid: cid,
          text: text,
          author: clean(body.author, MAX_AUTHOR),
          cat: clean(body.cat, MAX_CAT) || "Idée",
          ts: Date.now(),
        };
        arr.push(idea);
        await writeAll(env, arr);
        return json({ ok: true, idea });
      }

      if (req.method === "DELETE") {
        const admin = env.ADMIN_KEY;
        if (!admin || req.headers.get("X-Admin-Key") !== admin) {
          return json({ ok: false, error: "Non autorisé." }, 401);
        }
        const id = url.searchParams.get("id");
        if (!id) return json({ ok: false, error: "Paramètre id manquant." }, 400);

        const arr = await readAll(env);
        const next = arr.filter((i) => i.id !== id && i.cid !== id);
        await writeAll(env, next);
        return json({ ok: true, removed: arr.length - next.length });
      }

      return json({ ok: false, error: "Méthode non supportée." }, 405);
    } catch (e) {
      return json({ ok: false, error: String((e && e.message) || e) }, 500);
    }
  },
};
