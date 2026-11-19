// File: sw.js — offline support for Pin.Pro
// When you publish a new version, change VERSION so phones refresh their saved copy.
const VERSION = '1.5.0';
const CACHE = 'pinpro-' + new URL(self.registration.scope).pathname + '-' + VERSION;
const PREFIX = 'pinpro-' + new URL(self.registration.scope).pathname + '-';
const FILES = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // Delete only THIS app's old versions (beta and official never touch each other).
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // Open the app: try the internet for the newest version (max 3s), else use the saved copy.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const net = fetch(req).then(res => { if (res.ok) cache.put('./index.html', res.clone()); return res; });
      const timeout = new Promise(r => setTimeout(r, 3000));
      try {
        const res = await Promise.race([net, timeout]);
        if (res) return res;
      } catch (err) {}
      return (await cache.match('./index.html')) || net;
    })());
    return;
  }
  // Icons and other files: saved copy first, internet if missing.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
