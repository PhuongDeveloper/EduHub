const CACHE_NAME = 'eduhub-shell-v2';
const SHELL_URL = '/';
async function storeBounded(cache, request, response) {
  try {
    await cache.put(request, response);
    const keys = await cache.keys();
    for (const stale of keys.slice(80)) {
      if (new URL(stale.url).pathname !== SHELL_URL) await cache.delete(stale);
    }
  } catch {
    // Offline caching is best-effort. A quota or storage error must not break a page load.
  }
}
function cacheResponseImmediately(request, response) {
  if (!response.ok) return;
  let responseCopy;
  try {
    // Clone synchronously, before the browser consumes the body of the response returned to the page.
    responseCopy = response.clone();
  } catch {
    return;
  }
  void caches.open(CACHE_NAME)
    .then((cache) => storeBounded(cache, request, responseCopy))
    .catch(() => {});
}
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(SHELL_URL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('eduhub-') && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      cacheResponseImmediately(SHELL_URL, response);
      return response;
    }).catch(() => caches.match(SHELL_URL)));
    return;
  }
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font' || request.destination === 'image') {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      cacheResponseImmediately(request, response);
      return response;
    })));
  }
});
