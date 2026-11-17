// Koloun Boutique — service worker : l'application s'ouvre même avec une connexion faible.
const VERSION = 'kb-v1';
const COQUILLE = ['/', '/index.html', '/manifest.webmanifest', '/logo.jpg', '/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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
