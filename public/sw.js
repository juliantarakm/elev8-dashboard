// No-op service worker to override any cached SW from previous builds
self.addEventListener('install', function() {
  self.skipWaiting()
})
self.addEventListener('activate', function(event) {
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({ type: 'SW_NOOP_UNREGISTER' })
      })
    }).then(function() {
      return self.registration.unregister()
    }).then(function() {
      return self.clients.claim().then(function() {
        if (typeof self.registration.scope !== 'undefined') {
          return self.registration.unregister()
        }
      })
    })
  )
})
self.addEventListener('fetch', function() {
  // No-op
})
