// sw.js — Service Worker for Drag Race Fantasy League PWA
const CACHE = 'drag-race-v2';
const STATIC = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './config.js',
  './supabase-client.js',
  './manifest.json',
  './icon.svg',
];

// Cache static assets on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Remove old caches on activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Static assets (same origin, not /functions/): cache first, network fallback
// - Supabase API calls (/functions/ or supabase.co): network only
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isSupabase = url.hostname.includes('supabase.co') || url.pathname.includes('/functions/');

  if (isSupabase || e.request.method !== 'GET') {
    // Network only for API calls
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      // Cache successful same-origin GET responses
      if (res.ok && url.origin === self.location.origin) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
