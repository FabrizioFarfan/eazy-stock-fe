// Service worker mínimo de Eazy Stock.
// Existe SOLO para que Brave / Chrome Android consideren la app instalable
// (esos navegadores aún exigen un SW con fetch handler para ofrecer el prompt).
// NO cachea nada a propósito: siempre red directa, un build viejo jamás
// sobrevive a un deploy.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(fetch(event.request))
})
