/* Essence · schelet: pornirea fără rețea. Pagina și scriptul din cache, actualizate în fundal;
   datele nu trec pe aici (le ține pagina, iar serverul e întrebat direct). */
const CACHE = 'essence-schelet-v1';
const SHELL = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys()
  .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const avut = await c.match(e.request, { ignoreSearch: true });
    const proaspat = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => avut);
    return avut ?? proaspat;
  }));
});
