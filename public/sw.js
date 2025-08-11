// Service Worker for Emergencize Push Notifications
const CACHE_NAME = 'emergencize-v1'
const STATIC_CACHE = 'emergencize-static-v1'

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
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
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
    icon: '/icon-192x192.svg',
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
        title: '💬 Respond',
        icon: '/action-respond.png'
      },
      {
        action: 'call',
        title: '📞 Call',
        icon: '/action-call.png'
      },
      {
        action: 'dismiss',
        title: '✕ Dismiss',
        icon: '/action-dismiss.png'
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
            )
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
  
  const { action, data } = event
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
    // Mark as dismissed
    event.waitUntil(
      fetch('/api/alerts/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      }).catch((error) => {
        console.error('Error dismissing alert:', error)
      })
    )
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
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone)
                })
            }
            return fetchResponse
          })
      })
      .catch(() => {
        // If offline.html is not present, simply fail silently
        if (event.request.mode === 'navigate') {
          return new Response('', { status: 204 })
        }
      })
  )
})