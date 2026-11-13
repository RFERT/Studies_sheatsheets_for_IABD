/* =========================================================
   sw.js — Service Worker (consultation hors-ligne)
   Stratégie : cache-first avec mise en cache à la volée.
   Ne fonctionne qu'en https:// ou localhost (pas en file://).
   ========================================================= */
const CACHE = "esgi-cours-v22";
const CORE = [
  "./",
  "./index.html",
  "./ameliorations.html",
  "./parametrage.html",
  "./flashcards.html",
  "./cours.html",
  "./aide.html",
  "./manifest.webmanifest",
  "./assets/portal.css",
  "./assets/portal.js",
  "./assets/course.css",
  "./assets/course.js",
  "./assets/cheatsheet.css",
  "./assets/cheatsheet.js",
  "./assets/markdown.js",
  "./assets/share.js",
  "./assets/nav.js",
  "./assets/ideas-config.js",
  "./assets/search-index.js",
  "./assets/icon.svg",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./matieres/cours.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE).catch(() => {}))
      .then(() => precacheCourses())
      .then(() => self.skipWaiting())
  );
});

/* Pré-cache des cours Markdown : lit matieres/cours.js, extrait les chemins
   `file:` (modules) et `aide:` (antisèches) et les met en cache pour une
   consultation 100 % hors-ligne, sans liste à maintenir à la main. */
function precacheCourses() {
  return fetch("./matieres/cours.js", { cache: "no-cache" })
    .then((r) => (r && r.ok ? r.text() : ""))
    .then((txt) => {
      const paths = [];
      const re = /\b(?:file|aide)\s*:\s*["']([^"']+\.md)["']/g;
      let m;
      while ((m = re.exec(txt))) paths.push("./" + m[1].replace(/^\.?\/*/, ""));
      if (!paths.length) return;
      return caches.open(CACHE).then((c) =>
        Promise.all(paths.map((p) =>
          fetch(p, { cache: "no-cache" })
            .then((res) => (res && res.ok ? c.put(p, res.clone()) : null))
            .catch(() => null)
        ))
      );
    })
    .catch(() => {});
}

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // ideas-config.js : réseau d'abord (pour que l'URL de l'API soit toujours à jour),
  // repli sur le cache hors-ligne.
  if (req.url.indexOf("ideas-config.js") !== -1) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
