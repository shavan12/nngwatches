// NNG Luxury — Web Push & PWA Service Worker

const APP_NAME = 'NNG Watches'
const APP_ICON = '/NNGF.png'
const APP_BADGE = '/NNGF.png'

// Install event — skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate event — claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handle push events from Web Push (APNs for iOS, FCM for Chrome/Android/Desktop)
self.addEventListener('push', (event) => {
  let data = { title: APP_NAME, body: 'New notification from NNG Watches', url: '/' }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (err) {
      data.body = event.data.text() || 'New notification'
    }
  }

  const title = data.title || APP_NAME
  const options = {
    body: data.body || data.message || '',
    icon: data.icon || APP_ICON,
    badge: data.badge || APP_BADGE,
    image: data.image || undefined,
    tag: data.tag || `nng-${data.notificationId || Date.now()}`,
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || data.action_url || data.actionUrl || '/',
      notificationId: data.notificationId || null,
      timestamp: data.timestamp || Date.now()
    },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    timestamp: data.timestamp || Date.now(),
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification click — open or focus PWA window
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'
  const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a matching window/PWA client is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          if ('focus' in client) {
            client.focus()
          }
          if ('navigate' in client) {
            client.navigate(absoluteTargetUrl)
          }
          return
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteTargetUrl)
      }
    })
  )
})
