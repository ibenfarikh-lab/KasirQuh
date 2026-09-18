const CACHE_NAME = 'kasirquh-v7-refactored';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin/index.html',
  '/pelanggan/index.html',
  '/manifest.json',
  '/pelanggan/manifest-pelanggan.json',
  '/icon-192.png',
  '/icon-512.png',
  '/slide1.png',
  '/slide2.png',
  '/slide3.png'
];

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache).catch(() => {})));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => cacheName !== CACHE_NAME ? caches.delete(cacheName) : undefined)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('firebase')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        const path = new URL(event.request.url).pathname;
        if (path === '/admin.html' || path === '/customer/index.html') {
          return caches.match('/admin/index.html').then(cached => cached || caches.match('/index.html'));
        }
        if (path === '/pelanggan.html') {
          return caches.match('/pelanggan/index.html').then(cached => cached || caches.match('/index.html'));
        }
        if (path.startsWith('/admin/')) return caches.match('/admin/index.html');
        if (path.startsWith('/pelanggan/')) return caches.match('/pelanggan/index.html');
        return caches.match('/index.html');
      })
    );
    return;
  }

  const pathname = new URL(url).pathname;
  const isLocalStatic = /\.(?:css|js|json|png|svg|ico)$/i.test(pathname) || pathname.startsWith('/shared/') || pathname.startsWith('/assets/');
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

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
