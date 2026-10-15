/* =========================================================
   sw.js — Service Worker (consultation hors-ligne)
   Stratégie : cache-first avec mise en cache à la volée.
   Ne fonctionne qu'en https:// ou localhost (pas en file://).
   ========================================================= */
const CACHE = "esgi-cours-v1";
const CORE = [
  "./",
  "./index.html",
  "./ameliorations.html",
  "./guide-mobile.html",
  "./guide-github-pages.html",
  "./flashcards.html",
  "./manifest.webmanifest",
  "./assets/portal.css",
  "./assets/portal.js",
  "./assets/nav.js",
  "./assets/search-index.js",
  "./assets/icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())
  );
});

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
