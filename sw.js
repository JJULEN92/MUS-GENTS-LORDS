const CACHE_NAME = "mus-gents-lords-v0180";
const ASSETS = [
  "./?v=0180",
  "./index.html?v=0180",
  "./manifest.json?v=0180",
  "./assets/logo.png?v=0180",
  "./assets/background.jpg?v=0180"
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
      caches.match(event.request).then(res => res || caches.match("./index.html?v=0180"))
    )
  );
});
