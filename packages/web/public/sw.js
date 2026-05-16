const CACHE_NAME = "amanah-v1"
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          if (response.status === 200) {
            cache.put(event.request, clone)
          }
        })
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

self.addEventListener("push", (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: "Amanah", body: event.data.text() }
  }

  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/icon-192.png",
    data: payload.data || {},
    tag: payload.tag || "default",
    requireInteraction: payload.requireInteraction || false,
    actions: payload.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Amanah", options)
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(urlToOpen)
    })
  )
})

self.addEventListener("notificationclose", (event) => {
  // Optional: track notification dismissal
})
