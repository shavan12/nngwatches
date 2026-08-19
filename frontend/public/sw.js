// NNG Luxury — Push Notification Service Worker

const APP_NAME = 'NNG Watches'
const APP_ICON = '/NG.webp'

// Handle push events from the server
self.addEventListener('push', (event) => {
  let data = { title: APP_NAME, body: 'New notification', url: '/' }

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body || data.message || '',
    icon: data.icon || APP_ICON,
    badge: APP_ICON,
    image: data.image || undefined,
    tag: data.tag || `nng-${Date.now()}`,
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || data.action_url || '/',
      notificationId: data.notificationId || null,
    },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    timestamp: data.timestamp || Date.now(),
  }

  event.waitUntil(
    self.registration.showNotification(data.title || APP_NAME, options)
  )
})

// Handle notification click — open the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Otherwise open a new window
      return clients.openWindow(url)
    })
  )
})

// Activate immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})
