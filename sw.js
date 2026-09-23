const CACHE_NAME = 'kasirquh-v11';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin/',
  '/admin/index.html',
  '/admin/style.css',
  '/admin/script.js',
  '/pelanggan/',
  '/pelanggan/index.html',
  '/pelanggan/style.css',
  '/pelanggan/script.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/assets/gateway/slide1.png',
  '/assets/gateway/slide2.png',
  '/assets/gateway/slide3.png',
];


self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('firebase')) return;

  // Keep navigation fresh, but fall back instantly to the cached app shell.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        const path = new URL(event.request.url).pathname;
        if (path === '/admin/' || path === '/admin/index.html' || path === '/pelanggan/' || path === '/pelanggan/index.html') {
          if (path === '/admin/' || path === '/admin/index.html') return caches.match('/admin/index.html');
          return caches.match(path === '/pelanggan/' ? '/pelanggan/index.html' : path);
        }
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Static opening/PWA assets: cache first for the fastest possible startup.
  const isLocalStatic = /\/(manifest\.json|icon-192\.png|icon-512\.png|assets/gateway/slide[123]\.png|welcome-visual-4\.png|style\.css|script\.js)(\?|$)/.test(new URL(url).pathname);
  if (isLocalStatic) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => response).catch(() => caches.match(event.request))
  );
});
