const CACHE = 'namadhej-v2';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// تثبيت وحفظ الأصول
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// تنظيف الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// استراتيجية: Network First → Cache Fallback
self.addEventListener('fetch', e => {
  // تجاهل طلبات API والـ Supabase
  if (e.request.url.includes('supabase') ||
      e.request.url.includes('anthropic') ||
      e.request.url.includes('workers.dev') ||
      e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // حفظ نسخة في الكاش
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // بدون نت → ارجع من الكاش
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // إذا ما في كاش وطلب صفحة → ارجع الصفحة الرئيسية
          if (e.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
