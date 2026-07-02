const CACHE_NAME = 'budget-app-couple-cache';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Toujours réseau d'abord pour l'app principale
  const isAppFile =
    request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/style.css') ||
    url.pathname.endsWith('/manifest.json');

  if (isAppFile) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, clone));

          return response;
        })
        .catch(() => caches.match(request))
    );

    return;
  }

  // Pour le reste : cache d'abord, réseau ensuite
  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
  );
});