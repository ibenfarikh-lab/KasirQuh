const CACHE_NAME = 'kasirquh-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/pelanggan.html',
  '/style.css'
];

// 1. Event Install: Langsung aktifkan service worker baru
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 2. Event Activate: Bersihkan cache versi lama secara otomatis
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

// 3. Event Fetch: Utamakan jaringan (Network First), abaikan Firestore/Firebase
self.addEventListener('fetch', event => {
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(() => caches.match(event.request))
  );
});
