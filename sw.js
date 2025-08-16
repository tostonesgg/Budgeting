const CACHE = 'budget-restart-v2';
const ASSETS = [
  'index.html',
  'app.js',
  'manifest.webmanifest',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('index.html')));
    return;
  }

  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(resp => {
        const copy = resp.clone(); caches.open(CACHE).then(c => c.put(req, copy));
        return resp;
      }))
    );
    return;
  }

  if (req.url.includes('unpkg.com/lucide')) {
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone(); caches.open(CACHE).then(c => c.put(req, copy));
        return resp;
      }).catch(() => caches.match(req))
    );
  }
});
