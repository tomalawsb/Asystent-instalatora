const CACHE_PREFIX = 'pomocnik-instalatora-pwa-';
const CACHE_NAME = 'pomocnik-instalatora-pwa-3-8-etap-2-moduly-1206260710';
const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './js/storage.js',
  './js/catalog.js',
  './js/quote.js',
  './js/parser-local.js',
  './js/parser-ai.js',
  './js/sync.js',
  './js/export.js',
  './js/ui.js',
  './js/state.js',
  './js/patches.js',
  './js/ai-runtime.js',
  './pricing-data.js',
  './material-prices.js',
  './material-prices.json',
  './dane_uczace_transkrypcji.json',
  './cennik.json',
  './manifest.json',
  './app-version.json',
  './icon-192.svg',
  './icon-512.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
