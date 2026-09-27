const CACHE_NAME = 'kasirquh-shell-v17';
// Daftar ini WAJIB sinkron dengan file yang benar-benar ada di repo.
// cache.addAll() bersifat all-or-nothing: satu URL saja 404 akan
// membatalkan seluruh instalasi service worker.
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/gateway/index.css',
  '/gateway/index.js',
  '/pelanggan/index.html',
  '/pelanggan/style.css',
  '/pelanggan/script.js',
  '/admin/index.html',
  '/admin/style.css',
  '/admin/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Gagal cache:', url, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE_NAME && key.startsWith('kasirquh-')).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

function isSameOrigin(url) { return url.origin === self.location.origin; }
function isFirebaseOrExternal(url) {
  return url.origin !== self.location.origin || /(?:^|\/)api(?:\/|$)/i.test(url.pathname);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!isSameOrigin(url) || isFirebaseOrExternal(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'KQ_SW_SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'KQ_SW_CLEAR_CACHE') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kasirquh-')).map(k => caches.delete(k)))));
  }
});
