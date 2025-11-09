// Service Worker for Emergencize Push Notifications
const CACHE_NAME = 'emergencize-v1'
const STATIC_CACHE = 'emergencize-static-v1'
const NOTIFICATION_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

// Cache static assets
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/notifications',
  '/about',
  '/manifest.json'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE)
        await cache.addAll(STATIC_ASSETS)
      } catch (error) {
        console.warn('Failed to cache some static assets during install:', error)
      }

      await self.skipWaiting()
    })()
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
      .then(() => cleanupExpiredNotificationCache())
      .catch((error) => {
        console.warn('Failed to complete activation tasks:', error)
      })
  )
})

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)
  
  let notificationData = {}
  
  try {
    if (event.data) {
      notificationData = event.data.json()
    }
  } catch (e) {
    console.error('Error parsing push data:', e)
    notificationData = {
      title: 'Emergency Alert',
      message: 'New emergency notification received',
      type: 'danger'
    }
  }
  
  const {
    title = 'Emergency Alert',
    message = 'New emergency notification',
    type = 'danger',
    fromUser = 'Unknown',
    location,
    timestamp = new Date().toISOString(),
    alertId = Date.now().toString()
  } = notificationData
  
  const notificationTitle = type === 'danger' ? '🚨 EMERGENCY ALERT' : '💙 HELP REQUEST'
  const notificationOptions = {
    body: `From: ${fromUser}\n${message}${location ? '\n📍 Location included' : ''}`,
    icon: '/icon-1280x1280.PNG',
    // Optional assets commented out until provided
    // badge: '/badge-72x72.png',
    // image: type === 'danger' ? '/emergency-banner.png' : '/help-banner.png',
    tag: `alert-${alertId}`,
    renotify: true,
    requireInteraction: type === 'danger', // Keep emergency alerts visible
    silent: false,
    vibrate: type === 'danger' ? [200, 100, 200, 100, 200] : [200],
    data: {
      alertId,
      type,
      fromUser,
      message,
      location,
      timestamp,
      url: '/dashboard'
    },
    actions: [
      {
        action: 'respond',
        title: '💬 Respond'
      },
      {
        action: 'call',
        title: '📞 Call'
      },
      {
        action: 'dismiss',
        title: '✕ Dismiss'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        // Store notification for offline access
        return caches.open(CACHE_NAME)
          .then((cache) => {
            const notificationRecord = {
              id: alertId,
              ...notificationData,
              receivedAt: new Date().toISOString()
            }
            return cache.put(
              `/notifications/${alertId}`,
              new Response(JSON.stringify(notificationRecord))
            ).then(() => cleanupExpiredNotificationCache())
          })
      })
      .catch((error) => {
        console.error('Error showing notification:', error)
      })
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  const action = event.action
  const data = event.notification?.data
  const { alertId, type, fromUser, url = '/dashboard' } = data || {}
  
  if (action === 'respond') {
    // Open chat/response interface
    event.waitUntil(
      clients.openWindow(`/dashboard?action=respond&alertId=${alertId}`)
    )
  } else if (action === 'call') {
    // Initiate call
    event.waitUntil(
      clients.openWindow(`/dashboard?action=call&alertId=${alertId}`)
    )
  } else if (action === 'dismiss') {
    event.waitUntil(handleDismissAction(alertId))
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus()
            }
          }
          // Open new window if app not open
          if (clients.openWindow) {
            return clients.openWindow(url)
          }
        })
    )
  }
})

// Background sync for offline alerts
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag)
  
  if (event.tag === 'sync-alerts') {
    event.waitUntil(
      syncPendingAlerts()
    )
  }
})

async function syncPendingAlerts() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const requests = await cache.keys()
    
    const pendingAlerts = await Promise.all(
      requests
        .filter(req => req.url.includes('/pending-alerts/'))
        .map(async (req) => {
          const response = await cache.match(req)
          return response.json()
        })
    )
    
    for (const alert of pendingAlerts) {
      try {
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(alert)
        })
        
        if (response.ok) {
          // Remove from pending cache
          await cache.delete(`/pending-alerts/${alert.id}`)
        }
      } catch (error) {
        console.error('Error syncing alert:', error)
      }
    }
  } catch (error) {
    console.error('Error in background sync:', error)
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_ALERT':
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.put(
              `/pending-alerts/${payload.id}`,
              new Response(JSON.stringify(payload))
            )
          })
      )
      break
      
    case 'REQUEST_PERMISSION':
      // Handle permission request response
      if ('Notification' in self && Notification.permission === 'granted') {
        event.ports[0].postMessage({ success: true })
      } else {
        event.ports[0].postMessage({ 
          success: false, 
          error: 'Notification permission not granted' 
        })
      }
      break
  }
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET and same-origin
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // Do not intercept API or auth-related requests
  if (url.pathname.startsWith('/api/')) return
  if (event.request.headers.has('Authorization')) return

  // Determine if this is a static asset we allow caching
  const isStaticAsset = (() => {
    if (url.pathname.startsWith('/_next/static/')) return true
    if (url.pathname === '/manifest.json') return true
    if (url.pathname.startsWith('/icon-')) return true
    return /\.(?:js|css|png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf)$/.test(url.pathname)
  })()

  if (!isStaticAsset) {
    // Network-first for non-static; fallback to cache if available
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // Cache-first for static assets, then update cache in background
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => cached || new Response('', { status: 204 }))

      return cached || networkFetch
    })
  )
})

async function handleDismissAction(alertId) {
  if (!alertId) {
    return
  }

  const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true })
  if (clientList.length > 0) {
    clientList.forEach((client) => {
      client.postMessage({
        type: 'DISMISS_ALERT',
        payload: { alertId }
      })
    })
    return
  }

  if (clients.openWindow) {
    return clients.openWindow(`/dashboard?action=dismiss&alertId=${alertId}`)
  }
}

async function cleanupExpiredNotificationCache() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const requests = await cache.keys()
    const now = Date.now()
    const maxToProcess = 100
    const notificationRequests = requests.filter((request) => request.url.includes('/notifications/'))

    const batch = notificationRequests.slice(0, maxToProcess)

    await Promise.all(
      batch
        .map(async (request) => {
          const response = await cache.match(request)
          if (!response) {
            return
          }

          try {
            const data = await response.clone().json()
            const receivedAt = Date.parse(data?.receivedAt || '')
            if (!receivedAt || now - receivedAt > NOTIFICATION_CACHE_MAX_AGE_MS) {
              await cache.delete(request)
            }
          } catch {
            await cache.delete(request)
          }
        })
    )

    if (notificationRequests.length > maxToProcess) {
      setTimeout(() => {
        cleanupExpiredNotificationCache().catch((error) =>
          console.warn('Deferred notification cache cleanup failed:', error)
        )
      }, 0)
    }
  } catch (error) {
    console.warn('Failed to clean notification cache:', error)
  }
}