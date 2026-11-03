/* Essence · pornirea fără rețea (lot-2l): pagina din cache, actualizată în fundal. Șterge doar cache-urile ei: pe Android,
   scheletul e pe aceeași origine, iar alertele rămân ale lui până pe 11 nov. */
const PREFIX = 'essence-aplicatie-';
const CACHE = PREFIX + 'v1';
const SHELL = ['./', 'index.html', 'app.js', 'aplicatie.css', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys()
  .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(new URL('./', location.href).pathname)) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const avut = await c.match(e.request, { ignoreSearch: true });
    const proaspat = fetch(e.request).then(async (r) => { if (r.ok) await c.put(e.request, r.clone()).catch(() => {}); return r; }).catch(() => avut);
    e.waitUntil(proaspat.catch(() => {}));   // actualizarea aterizează și după ce pagina a primit răspunsul
    return avut ?? proaspat;
  }));
});
