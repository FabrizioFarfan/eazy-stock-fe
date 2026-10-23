import { useEffect, useRef, useState } from 'react'
import client, { TOKEN_EVENT } from '../services/wsClient'
import api from '../services/api'

// Si el CONNECT falla por sesión caducada, una llamada cualquiera al API dispara la
// renovación del token en api.js (401 → refresh); como mucho una vez cada 30 s.
const REFRESH_POKE_MS = 30_000
let lastPoke = 0
function pokeRefresh() {
  const now = Date.now()
  if (now - lastPoke < REFRESH_POKE_MS) return
  lastPoke = now
  api.get('/auth/me').catch(() => { /* api.js ya manda al login si no se puede renovar */ })
}

/**
 * Subscribes to the business-scoped WebSocket topic.
 *
 * El token va en las cabeceras del CONNECT (wsClient.beforeConnect). Si el backend
 * responde ERROR «SESSION_EXPIRED» se renueva la sesión y, al llegar el token nuevo
 * (evento TOKEN_EVENT), se reconecta enseguida en vez de esperar al reintento.
 *
 * @param {string|null} businessId  UUID of the tenant to subscribe to.
 * @param {function}    onEvent     Called with each WsEvent (always latest version via ref).
 * @returns {{ connected: boolean }}
 */
export function useBusinessSocket(businessId, onEvent) {
  const [connected, setConnected] = useState(false)
  const onEventRef = useRef(onEvent)

  // Keep ref current so the subscription closure always calls the latest callback
  useEffect(() => { onEventRef.current = onEvent })

  useEffect(() => {
    if (!businessId) return

    let subscription = null
    let alive = true

    const handleConnect = () => {
      setConnected(true)
      // Unsubscribe any previous subscription before creating a new one
      subscription?.unsubscribe()
      subscription = client.subscribe(`/topic/business/${businessId}`, (msg) => {
        try {
          const wsEvent = JSON.parse(msg.body)
          onEventRef.current?.(wsEvent)
        } catch {
          // malformed message — ignore
        }
      })
    }

    client.configure({
      onConnect:    handleConnect,
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onStompError: (frame) => {
        const message = frame.headers?.message ?? ''
        if (message.startsWith('SESSION_EXPIRED')) pokeRefresh()
        else console.error('[WS] STOMP error:', message)
      },
      onWebSocketError: (evt) => console.error('[WS] WebSocket error:', evt),
    })

    // Token nuevo (renovado, login o cambio de negocio): si no estamos conectados,
    // reconectar ya con él. Conectados no hace falta: el token solo se valida al conectar.
    const onToken = async () => {
      if (!alive || client.connected) return
      await client.deactivate()
      if (alive) client.activate()
    }
    window.addEventListener(TOKEN_EVENT, onToken)

    // If already connected (e.g. hot-reload), subscribe immediately without re-activating
    if (client.connected) {
      handleConnect()
    } else {
      client.activate()
    }

    return () => {
      alive = false
      window.removeEventListener(TOKEN_EVENT, onToken)
      subscription?.unsubscribe()
      subscription = null
      client.deactivate()
      setConnected(false)
    }
  }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected }
}
