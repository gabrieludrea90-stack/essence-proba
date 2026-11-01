// Essence · proba: păstrează aplicația pe telefon, ca să se deschidă și fără rețea.
const VERSIUNE = 'essence-proba-2';
const FISIERE = ['./', 'index.html', 'galerie.html', 'galerie.js', 'galerie.css', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIUNE).then((c) => c.addAll(FISIERE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((chei) => Promise.all(chei.filter((k) => k !== VERSIUNE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Întâi rețeaua (ca o versiune nouă să ajungă), apoi ce e păstrat pe telefon.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request)
    .then((r) => { const copie = r.clone(); caches.open(VERSIUNE).then((c) => c.put(e.request, copie)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((ferestre) => {
    if (ferestre.length) return ferestre[0].focus();
    return self.clients.openWindow('./');
  }));
});
