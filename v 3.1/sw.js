const CACHE_NAME = "mus-gents-lords-v323";
const ASSETS = [
  "./?v=323",
  "./index.html?v=323",
  "./manifest.json?v=323",
  "./assets/logo.png?v=323",
  "./assets/background.jpg?v=323"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(res => res || caches.match("./index.html?v=323"))
    )
  );
});
