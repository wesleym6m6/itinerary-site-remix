const CACHE_VERSION = "itinerary-site-remix-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "WARM_CACHE") return;

  const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.allSettled(
        urls.map((url) =>
          fetch(url, { cache: "reload" }).then((response) => {
            if (response && response.ok) return cache.put(url, response.clone());
            if (response && response.type === "opaque") return cache.put(url, response.clone());
            return undefined;
          })
        )
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request.url).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response || (!response.ok && response.type !== "opaque")) return response;
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") return caches.match(new URL("./index.html", self.registration.scope).href);
          return undefined;
        });
    })
  );
});
