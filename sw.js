const CACHE_NAME = 'kasirquh-shell-v16';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/pelanggan/index.html',
  '/pelanggan/style.css',
  '/pelanggan/_core/style.css',
  '/pelanggan/_core/router.js',
  '/pelanggan/_core/navigation.js',
  '/pelanggan/_core/firebase.js',
  '/pelanggan/_core/script.js',
  '/pelanggan/_core/modules/auth.js',
  '/pelanggan/_core/modules/common.js',
  '/pelanggan/_core/modules/products.js',
  '/pelanggan/_core/modules/cart.js',
  '/pelanggan/_core/modules/transactions.js',
  '/pelanggan/_core/modules/chat.js',
  '/pelanggan/_core/modules/settings.js',
  '/pelanggan/produk/index.html',
  '/pelanggan/produk/style.css',
  '/pelanggan/produk/script.js',
  '/pelanggan/keranjang/index.html',
  '/pelanggan/keranjang/style.css',
  '/pelanggan/keranjang/script.js',
  '/pelanggan/chat/index.html',
  '/pelanggan/chat/style.css',
  '/pelanggan/chat/script.js',
  '/pelanggan/akun/index.html',
  '/pelanggan/akun/style.css',
  '/pelanggan/akun/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
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
      }).catch(() => caches.match(request).then(cached => cached || caches.match('/pelanggan/index.html')))
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
