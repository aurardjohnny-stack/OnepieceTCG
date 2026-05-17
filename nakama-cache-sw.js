const CACHE_NAME = 'nakama-binder-cache-v1';
const STATIC_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.json', '.css', '.js'];

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if(req.method !== 'GET') return;

  const isStatic = STATIC_EXTENSIONS.some(ext => url.pathname.toLowerCase().endsWith(ext));
  if(!isStatic) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if(cached) return cached;

      return fetch(req).then(res => {
        if(!res || res.status !== 200) return res;

        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        return res;
      }).catch(() => cached)
    })
  );
});