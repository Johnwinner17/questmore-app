/**
 * QuestMore PWA Service Worker — Production Grade v2
 * ─────────────────────────────────────────────────────
 * Strategy:
 *  - STATIC ASSETS (JS/CSS/fonts/images): Cache-First with background revalidation
 *  - NAVIGATION (HTML pages): Network-First with offline fallback
 *  - API CALLS: Network-Only (always live data, no stale responses)
 *  - OFFLINE FALLBACK: Branded /offline.html served when all else fails
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE  = `questmore-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `questmore-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL   = '/offline.html';

// Core shell — pre-cached on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// ─── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch((err) => console.warn('[QM SW] Pre-cache failed:', err))
  );
  // Activate immediately — don't wait for old SW to die
  self.skipWaiting();
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) =>
            name.startsWith('questmore-') &&
            name !== STATIC_CACHE &&
            name !== DYNAMIC_CACHE
          )
          .map((name) => {
            console.log('[QM SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ─── FETCH ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle same-origin and a few allowed external origins
  const isOurOrigin = url.origin === self.location.origin;
  const isGoogleFonts = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

  if (!isOurOrigin && !isGoogleFonts) return;

  // 2. Never cache API calls — always network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // 3. Static assets → Cache-First
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 4. Google Fonts → Cache-First
  if (isGoogleFonts) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 5. HTML navigation → Network-First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // 6. Everything else → Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ─── STRATEGIES ──────────────────────────────────────────────────────────────

/** Cache-First: serve from cache, fall back to network and update cache */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

/** Network-First for navigation with branded offline fallback */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Check dynamic cache first
    const cached = await caches.match(request);
    if (cached) return cached;

    // Check static cache
    const staticCached = await caches.match(request, { cacheName: STATIC_CACHE });
    if (staticCached) return staticCached;

    // Last resort: branded offline page
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response(
      '<h1>You are offline</h1><p>Please check your connection and try again.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/** Network-Only: always fetch live (for APIs) */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ error: 'You are offline. Please reconnect and try again.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/** Stale-While-Revalidate: serve from cache instantly, update in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf'];
  const staticPaths = ['/_next/static/', '/_next/image', '/icons/', '/images/'];

  return (
    staticExtensions.some((ext) => url.pathname.endsWith(ext)) ||
    staticPaths.some((path) => url.pathname.startsWith(path))
  );
}

// ─── PUSH NOTIFICATIONS (skeleton for future use) ────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new update from QuestMore.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      image: data.image,
      tag: data.tag || 'questmore-notification',
      renotify: true,
      requireInteraction: false,
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'QuestMore', options)
    );
  } catch (err) {
    console.warn('[QM SW] Push notification error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if already open
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── BACKGROUND SYNC (skeleton) ──────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'questmore-sync') {
    console.log('[QM SW] Background sync triggered');
    // Future: replay failed API requests from IndexedDB
  }
});

console.log('[QM SW] QuestMore Service Worker v2 loaded ✓');
