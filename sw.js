// Service Worker para SOS Servicios PWA
const CACHE_NAME = 'sos-servicios-v1';
const ASSETS_TO_CACHE = [
  './',
  './qrpage.html',
  './tarjetapresentacion.html',
  './custom.css',
  './javascript.js',
  './qrcode.min.js',
  './manifest.json',
  './img/SOSLogoSinFondo.webp'
];

// Instalación: cachear recursos estáticos principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activación: limpiar cachés antiguas si hubiera
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network first, con fallback a caché (ideal para mantener actualizada la app y funcionar offline)
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la respuesta es válida, clonar y actualizar en la caché
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si falla la red (offline), recuperar de la caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si es una navegación HTML, devolver qrpage.html por defecto
          if (event.request.mode === 'navigate') {
            return caches.match('./qrpage.html');
          }
        });
      })
  );
});
