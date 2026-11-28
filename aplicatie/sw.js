/* Essence · pornirea fără rețea (lot-2l): pagina din cache, actualizată în fundal. Șterge doar cache-urile ei: pe Android,
   scheletul e pe aceeași origine. Alertele (4d, mutate din schelet): mesajul push arătat mereu, ora sosirii, atingerea. */
const PREFIX = 'essence-aplicatie-';
const CACHE = PREFIX + 'v2';
const SHELL = ['./', 'index.html', 'app.js', 'aplicatie.css', 'fonturi/figtree.woff2', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
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

// Alertele (lot-1a; revizorul 1s-b, 12): mesajul e declarativ (iPhone 18.4+ îl arată și singur); aici îl arătăm mereu
// noi, ca un mesaj să nu rămână fără notificare (iOS taie abonamentul după push-uri „tăcute”) și ca Android să-l vadă.
/** Numărul ciocnirii unei alerte (`tag` `c<nr>`, `data.ciocnire` sau `?ciocnire=` din adresă); alertele lucrurilor n-au. */
const ciocnireDin = (n) => {
  const nr = n.data?.ciocnire ?? (/^c(\d+)$/.exec(n.tag ?? '')?.[1]) ?? (/[?&]ciocnire=(\d+)/.exec(n.navigate ?? '')?.[1]);
  return nr ? Number(nr) : undefined;
};
self.addEventListener('push', (e) => {
  let m = {};
  try { m = e.data?.json() ?? {}; } catch { /* mesaj fără JSON */ }
  const n = m.notification ?? {};
  const arata = self.registration.showNotification(n.title || 'Essence', {
    body: n.body || '', tag: n.tag, data: { navigate: n.navigate, lucru: n.data?.ciocnire || /^c\d+$/.test(n.tag ?? '') ? undefined : n.data?.lucru ?? n.tag,
      ciocnire: ciocnireDin(n) },
    icon: 'icon-192.png', badge: 'icon-192.png' });
  // Întâi notificarea; ora sosirii e doar o măsurătoare, iar o eroare a ei nu atinge alerta (lot-1a).
  e.waitUntil(arata.then(() => (n.data?.sosit_la ? fetch(n.data.sosit_la, {
    method: 'POST', mode: 'no-cors', body: JSON.stringify({ sosit: n.data.sosit }), signal: AbortSignal.timeout(5000),
  }) : null)).catch(() => {}));
});

// Atinsă: fereastra aplicației vine în față și primește lucrul; altfel se deschide aplicația pe el. Lucrul atins se
// pune și deoparte (`ATINS`), iar pagina îl ia la întoarcere: pe iPhone, cu aplicația deschisă, mesajul se poate
// pierde (pagina e oprită cât e în fundal, iar `focus()` poate refuza), și atunci se deschidea lista (16 nov).
const ATINS = 'essence-atins';
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const { navigate, lucru, ciocnire } = e.notification.data ?? {};
  const aici = new URL('./', location.href).href;
  e.waitUntil((async () => {
    if (lucru || ciocnire) await caches.open(ATINS).then((c) => c.put('atins', new Response(JSON.stringify({ lucru, ciocnire, la: Date.now() })))).catch(() => {});
    const ferestre = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const f = ferestre.find((c) => c.url.startsWith(aici));
    if (f) { f.postMessage({ lucru, ciocnire }); await f.focus().catch(() => {}); return; }
    await self.clients.openWindow(navigate || (ciocnire ? `./?ciocnire=${ciocnire}` : `./?lucru=${encodeURIComponent(lucru ?? '')}`));
  })());
});

// Erorile service worker-ului ajung în jurnalul paginii (aici nu există `localStorage`): doar mesajul scurt și locul din cod
// (auditul de cod, 15 nov, 4). Fără nicio fereastră deschisă, se pierd.
const spunePaginii = (mesaj, sursa) => self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  .then((fs) => fs.forEach((c) => c.postMessage({ eroareSw: { mesaj: 'service worker: ' + String(mesaj ?? '').slice(0, 150), sursa } }))).catch(() => {});
self.addEventListener('error', (e) => { spunePaginii(e.message, 'sw.js:' + (e.lineno || 0)); });
self.addEventListener('unhandledrejection', (e) => { spunePaginii(e.reason?.message ?? e.reason, 'sw.js:0'); });
