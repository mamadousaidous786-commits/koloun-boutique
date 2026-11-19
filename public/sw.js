// Koloun Boutique — service worker : l'application s'ouvre même avec une connexion faible.
const VERSION = 'kb-v2';
const COQUILLE = ['/', '/index.html', '/manifest.webmanifest', '/logo.jpg', '/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// « Nouvel arrivage » : notification envoyée par Koloun Gestion quand un produit est ajouté
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { corps: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titre || 'Koloun Luxure', {
    body: d.corps || 'Nouveaux articles disponibles.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    image: d.image,
    tag: d.tag || 'koloun',
    data: { url: d.url || '/' },
  }));
});

// Toucher la notification ouvre l'article (dans l'application si elle est déjà ouverte)
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const cible = new URL(e.notification.data?.url || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenetres) => {
    const ouverte = fenetres.find((f) => new URL(f.url).origin === self.location.origin);
    if (ouverte) return ouverte.focus().then((f) => (f && 'navigate' in f ? f.navigate(cible) : null));
    return self.clients.openWindow(cible);
  }));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // API : réseau d'abord, dernière réponse connue si hors ligne
  if (url.pathname.includes('/api/boutique/') && !url.pathname.includes('/admin/')) {
    e.respondWith(
      fetch(req).then((r) => { const copie = r.clone(); caches.open(VERSION).then((c) => c.put(req, copie)); return r; })
        .catch(() => caches.match(req))
    );
    return;
  }
  // Photos : cache d'abord (elles ne changent pas)
  if (req.destination === 'image') {
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => {
      if (r.ok || r.type === 'opaque') { const copie = r.clone(); caches.open(VERSION).then((c) => c.put(req, copie)); }
      return r;
    })));
    return;
  }
  // Pages : réseau d'abord, coquille hors ligne
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => {
      const copie = r.clone(); caches.open(VERSION).then((c) => c.put(req, copie)); return r;
    })));
  }
});
