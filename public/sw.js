const CACHE_NAME = 'easy-shop-v2'
const STATIC_CACHE = 'easy-shop-static-v2'
const DYNAMIC_CACHE = 'easy-shop-dynamic-v2'
const API_CACHE = 'easy-shop-api-v2'

// Fichiers à mettre en cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Cache statique ouvert')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE]
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Stratégie de cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // 1. Ne pas intercepter les requêtes Supabase (Network First)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone()
          caches.open(API_CACHE).then(cache => {
            cache.put(event.request, clonedResponse)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => {
              if (cached) return cached
              // Fallback pour les requêtes API
              return new Response(JSON.stringify({ 
                offline: true, 
                message: 'Mode hors ligne - Données en cache' 
              }), {
                headers: { 'Content-Type': 'application/json' }
              })
            })
        })
    )
    return
  }

  // 2. Fichiers statiques (Cache First)
  if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached
          return fetch(event.request).then(response => {
            const clonedResponse = response.clone()
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(event.request, clonedResponse)
            })
            return response
          })
        })
    )
    return
  }

  // 3. Pages HTML (Stale While Revalidate)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone()
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, clonedResponse)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => {
              if (cached) return cached
              return caches.match('/offline.html')
                .then(offlinePage => {
                  if (offlinePage) return offlinePage
                  return new Response('Page hors ligne', {
                    status: 503,
                    statusText: 'Service Unavailable'
                  })
                })
            })
        })
    )
    return
  }

  // 4. Autres requêtes (Network First)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clonedResponse = response.clone()
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(event.request, clonedResponse)
        })
        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})