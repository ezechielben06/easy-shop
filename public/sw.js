// Service Worker pour Easy-Shop PWA

const CACHE_NAME = 'easy-shop-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]
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

// Fetch - Stratégie cache-first avec fallback réseau
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes vers Supabase
  if (event.request.url.includes('supabase.co')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response
        }

        // Cloner la requête
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest)
          .then(response => {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Cloner la réponse
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // En cas d'échec, retourner une page hors ligne
            return caches.match('/index.html')
          })
      })
  )
})