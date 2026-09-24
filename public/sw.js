// Service worker MealsUp
//
// - Pages (index.html) : réseau d'abord, pour toujours charger la dernière
//   version déployée ; le cache ne sert que hors ligne.
// - /assets/* : fichiers générés par Vite avec un hash dans leur nom (un nouveau
//   déploiement = de nouveaux noms), donc on peut les garder en cache sans risque.
// - Autres fichiers du site (icônes, manifest) : cache, rafraîchi en arrière-plan.
// - Les appels à Supabase (autre domaine) ne passent jamais par le cache.
//
// Changer CACHE_NAME vide le cache de tous les appareils (v3 : nouveaux logos, et photos
// de recettes mises en cache par erreur sous forme de page HTML).
const CACHE_NAME = 'mealsup-v3'

self.addEventListener('install', (event) => {
  // La nouvelle version prend la main tout de suite, sans attendre la fermeture de l'app
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/manifest.json']).catch(() => undefined))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request))
  } else {
    event.respondWith(staleWhileRevalidate(request))
  }
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request, { cache: 'no-store' })
    if (response.ok) cache.put('/', response.clone())
    return response
  } catch {
    return (await cache.match('/')) || Response.error()
  }
}

/** Never keep an HTML page (an old "not found" fallback) in place of an image or a file. */
function isCacheable(request, response) {
  if (!response.ok) return false
  const type = response.headers.get('content-type') || ''
  return request.destination === 'document' || !type.includes('text/html')
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (isCacheable(request, response)) cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (isCacheable(request, response)) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)
  return cached || network
}

// ---- Notifications push (alertes de péremption) ----
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'MealsUp', {
      body: data.body || '',
      icon: '/brand/icon.png',
      badge: '/brand/icon.png',
      tag: data.tag,
      data: { url: data.url || '/' },
    })
  )
})

// Tap on a notification: open (or focus) the app on the suggested page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
