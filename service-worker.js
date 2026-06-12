const CACHE_PREFIX = 'pomocnik-instalatora-pwa-';
const STATIC_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './js/bootstrap.js',
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
  './js/workflow.js',
  './dane_uczace_transkrypcji.json',
  './cennik.json',
  './material-prices.json',
  './manifest.json',
  './app-version.json',
  './icon-192.svg',
  './icon-512.svg'
];

function normalizeCachePart(value) {
  return String(value || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

async function readVersionConfigFromNetwork() {
  const response = await fetch('./app-version.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const config = await response.json();
  if (!config?.build && !config?.version) throw new Error('Brak wersji aplikacji.');
  return config;
}

async function findExistingAppCacheName() {
  const names = await caches.keys();
  const appCaches = names.filter(name => name.startsWith(CACHE_PREFIX)).sort();
  return appCaches.at(-1) || '';
}

const cacheNamePromise = (async () => {
  try {
    const config = await readVersionConfigFromNetwork();
    return `${CACHE_PREFIX}${normalizeCachePart(config.build || config.version)}`;
  } catch {
    return (await findExistingAppCacheName()) || `${CACHE_PREFIX}bootstrap`;
  }
})();

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cacheName = await cacheNamePromise;
    const cache = await caches.open(cacheName);
    await cache.addAll(STATIC_FILES);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheName = await cacheNamePromise;
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== cacheName)
        .map(name => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cacheName = await cacheNamePromise;
    try {
      const response = await fetch(event.request);
      if (response?.ok) {
        const cache = await caches.open(cacheName);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(event.request);
      return cached || caches.match('./index.html');
    }
  })());
});
