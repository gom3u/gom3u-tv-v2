const CACHE_NAME = 'gom3u-v2-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './player.html',
  './admin.html',
  './login.html',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/player.js',
  './assets/js/admin.js',
  './channels.json',
  './categories.json',
  './notice.json',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
