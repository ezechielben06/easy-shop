const CACHE_NAME = 'easy-shop-v3'
const STATIC_CACHE = 'easy-shop-static-v3'
const DYNAMIC_CACHE = 'easy-shop-dynamic-v3'
const API_CACHE = 'easy-shop-api-v3'

// Fichiers statiques à mettre en cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Styles et scripts à mettre en cache dynamiquement
const CACHE_URIS = [
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css'
]

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Cache statique')
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('📦 Cache dynamique')
        return cache.addAll(CACHE_URIS)
      })
    ])
    .then(() => self.skipWaiting())
  )
})

// Activation - nettoyer les anciens caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE]
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('🗑️ Suppression cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
    .then(() => self.clients.claim())
  )
})

// Stratégie de cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // 1. REQUÊTES SUPABASE - Network First avec fallback
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
        .catch(async () => {
          const cached = await caches.match(event.request)
          if (cached) return cached
          // Fallback pour les requêtes API
          return new Response(JSON.stringify({ 
            offline: true, 
            message: 'Mode hors ligne',
            data: []
          }), {
            headers: { 'Content-Type': 'application/json' }
          })
        })
    )
    return
  }

  // 2. IMAGES - Cache First
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached
          return fetch(event.request)
            .then(response => {
              const clonedResponse = response.clone()
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(event.request, clonedResponse)
              })
              return response
            })
            .catch(() => {
              // Image par défaut si hors ligne
              return caches.match('/icons/icon-192x192.png')
            })
        })
    )
    return
  }

  // 3. FICHIERS STATIQUES - Cache First
  if (url.pathname.match(/\.(js|css|woff2)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached
          return fetch(event.request)
            .then(response => {
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

  // 4. PAGES HTML - Stale While Revalidate (priorité cache)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          // Si en cache, on le retourne immédiatement
          // ET on met à jour en arrière-plan
          const fetchPromise = fetch(event.request)
            .then(response => {
              const clonedResponse = response.clone()
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(event.request, clonedResponse)
              })
              return response
            })
            .catch(() => {
              // Si la requête échoue, on garde le cache existant
              return cached
            })

          // Si on a un cache, on le retourne directement
          if (cached) {
            // Mise à jour en arrière-plan
            event.waitUntil(fetchPromise)
            return cached
          }

          // Sinon on attend la requête
          return fetchPromise
        })
        .catch(() => {
          return caches.match('/offline.html')
        })
    )
    return
  }

  // 5. AUTRES REQUÊTES - Network First
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