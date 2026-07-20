const CACHE_NAME = 'wegogym-pwa-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// 1. Service Worker Installation Phase
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Pre-caching core application assets...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Service Worker Activation Phase (Cache Cleanup)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA SW] Deleting legacy cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Interceptor (Cache First for Assets, Network First for Nav)
self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/HTTPS GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // Strategy A: Network First with Cache Fallback for Navigation HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }

  // Strategy B: Stale-While-Revalidate for JS, CSS, Fonts, Images
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[PWA SW] Network fetch failed, falling back to cache:', err);
        });

      return cachedResponse || fetchPromise;
    })
  );
});
