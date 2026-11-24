const CACHE_NAME = 'shopflow-pwa-v17';
const scopeUrl = self.registration.scope;
const shellUrls = [
  scopeUrl,
  new URL('index.html', scopeUrl).href,
  new URL('manifest.json', scopeUrl).href,
  new URL('shopflow-logo.png', scopeUrl).href,
  ...['fr', 'en', 'ln', 'sw', 'zh'].map((lang) =>
      new URL(`locales/${lang}/translation.json?v=6`, scopeUrl).href
  ),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(shellUrls)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('shopflow-pwa-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { /* Show a safe fallback for malformed payloads. */ }
  const title = typeof payload.title === 'string' && payload.title.trim() ? payload.title : 'ShopFlow';
  const body = typeof payload.body === 'string' ? payload.body : '';
  const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
  const icon = new URL('shopflow-logo.png', scopeUrl).href;
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon,
    badge: icon,
    tag: typeof data.recordId === 'string' ? `shopflow-${data.recordId}` : 'shopflow-notification',
    data: { ...data, url: typeof data.url === 'string' ? data.url : scopeUrl },
    renotify: false,
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || scopeUrl, scopeUrl).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        if (client.url !== destination && 'navigate' in client) await client.navigate(destination);
        await client.focus();
        return;
      }
    }
    await self.clients.openWindow(destination);
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.href.startsWith(scopeUrl)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(new URL('index.html', scopeUrl).href, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(new URL('index.html', scopeUrl).href)) || (await caches.match(scopeUrl)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })
  );
});
