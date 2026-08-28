const CACHE_NAME = 'kasirquh-v13';
const urlsToCache = [
  './',
  './index.html',
  './pelanggan.html',
  './style.css',
  './script.js'
];

// 1. Event Install: Gunakan Promise.allSettled agar cache tetap aman walau ada file yang terlewat[span_0](start_span)[span_0](end_span)
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url).catch(err => console.log('Gagal cache file:', url)))
        );
      })
  );
});

// 2. Event Activate: Bersihkan cache versi lama secara otomatis[span_1](start_span)[span_1](end_span)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Event Fetch: Utamakan jaringan, abaikan Firestore/Firebase, dengan fallback navigasi[span_2](start_span)[span_2](end_span)
self.addEventListener('fetch', event => {
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
      })
  );
});
