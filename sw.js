/**
 * sw.js — AccessiMart Service Worker (Offline & Cache Manager)
 * Roman Urdu: Yeh file browser cache manage karti hai taake website fast load ho
 * aur internet na hone par bhi basic files chal sakein.
 */

const CACHE_NAME = 'accessimart-v15';

// Yeh saari local files install ke waqt cache hoti hain
const PRE_CACHE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/db.js',
  './js/state.js',
  './js/colorFilters.js',
  './js/typography.js',
  './js/visualHaptics.js',
  './js/acousticEngine.js',
  './js/voiceEngine.js',
  './js/store.js',
  './js/workspace.js',
  './js/app.js',
  './favicon.svg',
  './manifest.json',
];

// Install event: sab zaroori files ko cache mein save karta hai
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRE_CACHE_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event: purane aur bekaar caches ko delete karta hai
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Fetch event: Network-First strategy (pehle fresh file server se lata hai, offline ho to cache use karta hai)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestURL = new URL(event.request.url);
  // External CDNs (Tailwind, Supabase, Unsplash) ko direct network par chhor deta hai
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
