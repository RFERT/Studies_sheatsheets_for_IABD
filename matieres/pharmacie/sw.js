/* =========================================================
   sw.js — Service Worker du portail Pharmacie (consultation hors-ligne)
   Portée : dossier du portail (matieres/pharmacie/). Autonome.
   Stratégie : réseau d'abord, repli sur le cache (contenu toujours à jour
   en ligne, utilisable hors-ligne). Ne fonctionne qu'en https:// ou localhost.
   ========================================================= */
const CACHE = "pharma-v1";
const MODULES = ["chimie", "anatomie", "physiologie", "galenique", "legislation", "pharmacologie", "pathologie", "toxicologie", "diagnostic"];
const CORE = [
  "./",
  "./index.html",
  "./flashcards.html",
  "./aide.html",
  "./glossaire.html",
  "./examen.html",
  "./parametrage.html",
  "./ameliorations.html",
  "./manifest.webmanifest",
  "./assets/style.css",
  "./assets/tools.css",
  "./assets/portal-extra.css",
  "./assets/flash.css",
  "./assets/cheatsheet.css",
  "./assets/examen.css",
  "./assets/data.js",
  "./assets/common.js",
  "./assets/nav.js",
  "./assets/portal.js",
  "./assets/cards-data.js",
  "./assets/markdown.js",
  "./assets/cheatsheet.js",
  "./assets/glossary-data.js",
  "./assets/share.js",
  "./assets/app.js",
  "./assets/examen.js",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png"
].concat(
  MODULES.map((m) => "./modules/" + m + ".html"),
  MODULES.map((m) => "./md/aide-" + m + ".md")
);

// Un fichier absent ou en erreur n'empêche pas l'installation (pas de cache.addAll)
function precache() {
  return caches.open(CACHE).then((c) =>
    Promise.all(CORE.map((u) =>
      fetch(u, { cache: "no-cache" })
        .then((res) => (res && res.ok ? c.put(u, res) : null))
        .catch(() => null)
    ))
  );
}

self.addEventListener("install", (e) => {
  e.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.indexOf("pharma-") === 0 && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() =>
      caches.match(req)
        .then((hit) => hit || caches.match(req, { ignoreSearch: true }))
        .then((hit) => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error()))
    )
  );
});
