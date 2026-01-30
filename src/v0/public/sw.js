// Service Worker for Semantic Todo PWA
// Provides offline-first caching strategy

const CACHE_NAME = 'semantic-todo-v1'

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
]

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets')
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Take control immediately
  self.clients.claim()
})

// Fetch event - network-first for HTML, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip WebSocket connections (used for sync)
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return

  // Skip external requests
  if (url.origin !== self.location.origin) return

  // For HTML pages: network-first strategy
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest version
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Fall back to cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/')
          })
        })
    )
    return
  }

  // For static assets: stale-while-revalidate strategy
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          // Update cache in background
          if (response.ok) {
            cache.put(request, response.clone())
          }
          return response
        })

        // Return cached immediately, update in background
        return cached || fetchPromise
      })
    })
  )
})

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})
