import { useEffect, useRef, useState } from 'react'
import client from '../services/wsClient'

/**
 * Subscribes to the business-scoped WebSocket topic.
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
      onStompError: (frame) => console.error('[WS] STOMP error:', frame.headers?.message),
      onWebSocketError: (evt) => console.error('[WS] WebSocket error:', evt),
    })

    // If already connected (e.g. hot-reload), subscribe immediately without re-activating
    if (client.connected) {
      handleConnect()
    } else {
      client.activate()
    }

    return () => {
      subscription?.unsubscribe()
      subscription = null
      client.deactivate()
      setConnected(false)
    }
  }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected }
}
