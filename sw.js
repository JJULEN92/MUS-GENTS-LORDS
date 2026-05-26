const CACHE_NAME = "mus-gents-lords-v0132";
const ASSETS = [
  "./?v=0132",
  "./index.html?v=0132",
  "./manifest.json?v=0132",
  "./assets/logo.png?v=0132",
  "./assets/background.jpg?v=0132"
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
      caches.match(event.request).then(res => res || caches.match("./index.html?v=0132"))
    )
  );
});
