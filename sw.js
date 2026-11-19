// مسارك: يخلي الموقع يفتح كتطبيق ويشتغل حتى لو النت ضعيف أو مقطوع.
// غيّري رقم الإصدار كل ما عدلتي ملفات كثير عشان الجوالات تاخذ النسخة الجديدة.
const VERSION = 'masarak-v1';
const CORE = ['./', 'index.html', 'map.html', 'news.html', 'news.json', 'poster.jpg',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;      // الفيديو يمشي عادي
  const url = new URL(req.url);
  const sameSite = url.origin === location.origin;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('news.json');

  if (sameSite && isPage) {
    // الصفحات والأخبار: الأحدث من النت أول، ولو ما فيه نت نعرض المحفوظ
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  if (sameSite || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    // الصور والخطوط: من المحفوظ أول عشان السرعة
    if (url.pathname.endsWith('.mp4')) return;
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
