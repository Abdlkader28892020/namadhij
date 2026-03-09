const CACHE = 'namadhej-v4';
const BASE = '/namadhej';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/icon.png',
  BASE + '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.3/math.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (
    e.request.url.includes('supabase') ||
    e.request.url.includes('anthropic') ||
    e.request.url.includes('workers.dev') ||
    e.request.url.includes('googletagmanager') ||
    e.request.method !== 'GET'
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          if (e.request.destination === 'document') {
            return caches.match(BASE + '/index.html');
          }
        })
      )
  );
});
