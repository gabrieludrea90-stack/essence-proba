/* Essence · schelet: pornirea fără rețea. Pagina și scriptul din cache, actualizate în fundal;
   datele nu trec pe aici (le ține pagina, iar serverul e întrebat direct). */
const CACHE = 'essence-schelet-v3';
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

// Alertele (lot §7; revizorul, 12): mesajul e declarativ (iPhone 18.4+ îl arată și singur); aici îl arătăm mereu noi,
// ca un mesaj să nu rămână fără notificare (iOS taie abonamentul după push-uri „tăcute”) și ca Android să-l vadă.
self.addEventListener('push', (e) => {
  let m = {};
  try { m = e.data?.json() ?? {}; } catch { /* mesaj fără JSON */ }
  const n = m.notification ?? {};
  e.waitUntil(self.registration.showNotification(n.title || 'Essence', {
    body: n.body || '', tag: n.tag, data: { navigate: n.navigate, lucru: n.data?.lucru ?? n.tag },
    icon: 'icon-192.png', badge: 'icon-192.png' }));
});

// Atinsă: fereastra deschisă vine în față și primește lucrul; altfel se deschide aplicația pe el.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const { navigate, lucru } = e.notification.data ?? {};
  e.waitUntil((async () => {
    const ferestre = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const f = ferestre.find((c) => new URL(c.url).origin === location.origin);
    if (f) { await f.focus(); f.postMessage({ lucru }); return; }
    await self.clients.openWindow(navigate || `./?lucru=${encodeURIComponent(lucru ?? '')}`);
  })());
});
