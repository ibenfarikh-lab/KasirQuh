const CACHE_NAME = 'kasirquh-pelanggan-v1';
const urlsToCache = [
  '/pelanggan.html',
  '/style.css'
];

// 1. Event Install: Menyimpan cache aset dasar
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 2. Event Activate: Membersihkan cache lama jika ada pembaruan
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Event Fetch: Mengambil data dari cache atau jaringan
self.addEventListener('fetch', event => {
  // Lewati request ke Firebase/Firestore agar data tetap real-time
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// 4. Event Push: Menangkap sinyal notifikasi masuk di background & memutar suara sistem
self.addEventListener('push', event => {
  let data = { 
    title: 'Pesanan Online Masuk! 🛒', 
    body: 'Ada pesanan baru dari pelanggan yang perlu diproses.', 
    icon: 'icon-192.png',
    url: '/'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'icon-192.png',
    badge: 'icon-192.png',
    sound: 'default', // Memanfaatkan suara notifikasi bawaan sistem Android
    vibrate: [300, 100, 300], // Getar otomatis
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Event Notification Click: Membuka aplikasi saat notifikasi ditekan oleh admin
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
