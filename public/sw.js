/**
 * TicketFlow Service Worker — PWA
 * Stratégie: Network-first pour l'API, Cache-first pour les assets statiques
 */

const CACHE_NAME    = 'ticketflow-v1';
const API_CACHE     = 'ticketflow-api-v1';
const OFFLINE_URL   = '/offline.html';

// Assets à mettre en cache immédiatement
const PRECACHE_ASSETS = [
  '/',
  '/events',
  '/login',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// ── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et les extensions Chrome
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // API backend → Network-first, cache 5min
  if (url.pathname.startsWith('/api/') || url.port === '5000') {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 5 * 60));
    return;
  }

  // Uploads (images) → Cache-first
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(cacheFirstWithNetwork(request, CACHE_NAME));
    return;
  }

  // Assets Vite (JS, CSS, fonts) → Cache-first
  if (url.pathname.match(/\.(js|css|woff2?|ttf|svg|png|jpg|webp)$/)) {
    event.respondWith(cacheFirstWithNetwork(request, CACHE_NAME));
    return;
  }

  // Navigation SPA → Network-first, fallback vers '/' ou offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/') || caches.match(OFFLINE_URL))
    );
    return;
  }

  // Tout le reste → Network-first
  event.respondWith(networkFirstWithCache(request, CACHE_NAME, 60));
});

// ── STRATEGIES ─────────────────────────────────────────────────────────────

async function networkFirstWithCache(request, cacheName, maxAgeSeconds) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = response.clone();
      // Ajouter header d'expiration
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-date', Date.now().toString());
      const cachedResponse = new Response(await responseClone.blob(), {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      const cacheDate = cached.headers.get('sw-cache-date');
      if (cacheDate && maxAgeSeconds) {
        const age = (Date.now() - parseInt(cacheDate)) / 1000;
        if (age < maxAgeSeconds) return cached;
      } else if (cached) {
        return cached;
      }
    }
    // Fallback offline pour la navigation
    return caches.match(OFFLINE_URL) || new Response('Hors ligne', { status: 503 });
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ── PUSH NOTIFICATIONS (optionnel) ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'TicketFlow', {
      body:    data.body || '',
      icon:    '/icons/icon-192x192.svg',
      badge:   '/icons/icon-96x96.svg',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Voir' },
        { action: 'dismiss', title: 'Ignorer' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
