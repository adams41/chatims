// Empty service worker that immediately unregisters itself
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      const regs = await self.registration.unregister();
      const clients = await self.clients.matchAll();
      clients.forEach(c => c.navigate(c.url));
    })()
  );
});
self.addEventListener('fetch', () => {});
