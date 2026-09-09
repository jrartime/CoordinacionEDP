// Service worker minimo: solo existe para que el navegador considere la
// app instalable (algunos Android lo exigen). No cachea nada — cada
// peticion va siempre a la red, igual que sin el service worker.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
