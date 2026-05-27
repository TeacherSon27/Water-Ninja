const CACHE_NAME = "water-ninja-pwa-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./manifest.json",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/cleaning.png",
  "./assets/cooking.png",
  "./assets/drinking.png",
  "./assets/ice.png",
  "./assets/liquid.png",
  "./assets/no-playing.png",
  "./assets/rain.png",
  "./assets/river.png",
  "./assets/save-water.png",
  "./assets/sea.png",
  "./assets/steam.png",
  "./assets/tap.png",
  "./assets/turn-off-tap.png",
  "./assets/washing.png",
  "./assets/water.png",
  "./assets/watering.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
