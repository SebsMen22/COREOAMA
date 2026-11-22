// Service worker de COREOAMA: guarda la app en el dispositivo para que abra sin internet.
// Los datos (coreografías) NO están aquí: viven en IndexedDB y nunca se borran al actualizar.
const CACHE = 'coreoama-app-v2'
// Solo se guardan archivos de la app, fuentes y el SDK de Firebase (nunca las llamadas a la base de datos)
const CACHEABLE = [self.location.origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://www.gstatic.com']
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png']

self.addEventListener('install', (e) => {
  // Guarda la página y también los archivos de la app que ella usa (JS/CSS con nombre único)
  e.waitUntil((async () => {
    const c = await caches.open(CACHE)
    await c.addAll(CORE)
    const html = await (await c.match('./index.html')).text()
    const assets = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((m) => m[1])
    await c.addAll(assets)
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  if (!CACHEABLE.includes(new URL(req.url).origin)) return
  // Páginas: primero internet (para recibir actualizaciones), si no hay, la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return r })
        .catch(() => caches.match('./index.html'))
    )
    return
  }
  // Archivos de la app y fuentes: primero la copia guardada
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)) }
      return r
    }))
  )
})
