/* =========================================
   SERVICE WORKER - Catatan Tanaman 🪴
   PWA + Notification + Offline Mode
   ========================================= */

const APP_NAME = 'Catatan Tanaman';
const CACHE_NAME = 'tanaman-cache-v1';

// Daftar file yang akan disimpan untuk mode offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
  // Jika kamu punya file CSS atau JS eksternal lain, tambahkan di sini
];

/* =====================
   INSTALL
   ===================== */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets untuk mode offline...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

/* =====================
   ACTIVATE
   ===================== */
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Bersihkan cache lama jika versi berubah
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

/* =====================
   FETCH (STRATEGY: CACHE FIRST)
   ===================== */
// Bagian ini yang membuat aplikasi bisa dibuka saat offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Jika ada di cache, pakai cache. Jika tidak, ambil dari network.
      return response || fetch(event.request);
    })
  );
});

/* =====================
   NOTIFICATION CLICK
   ===================== */
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || './';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

/* =====================
   PUSH NOTIFICATION (OPSIONAL)
   ===================== */
self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || APP_NAME;
  const options = {
    body: data.body || 'Ada pengingat baru!',
    icon: 'icon-192.png',
    badge: 'icon-96.png',
    data: { url: data.url || './' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
