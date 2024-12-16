
const CACHE_NAME = 'webrtc-file-transfer-cache';
const FILES_TO_CACHE = ['/', '/index.html', '/app.js', '/manifest.json', '/sw.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
