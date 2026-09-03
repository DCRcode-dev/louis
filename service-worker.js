// Louis PWA Service Worker — Build: 2026.09.03-v5
const CACHE_NAME = 'louis-briefings-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './js/app.js',
  './js/data-service.js',
  './js/markdown.js',
  './components/pull-to-refresh.js',
  './components/calendar.js',
  './components/modal.js',
  './views/daily-view.js',
  './views/synthesis-view.js'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass Google API / external network requests through to network with offline fallback
  if (event.request.url.includes('script.google.com') || event.request.url.includes('googleusercontent.com') || event.request.url.includes('sheets.googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline - showing cached data' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // App shell: Cache first, then network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
