const CACHE_NAME = "mus-gents-lords-v326";
const ASSETS = [
  "./?v=326",
  "./index.html?v=326",
  "./manifest.json?v=326",
  "./assets/logo.png?v=326",
  "./assets/background.jpg?v=326"
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
      caches.match(event.request).then(res => res || caches.match("./index.html?v=326"))
    )
  );
});
