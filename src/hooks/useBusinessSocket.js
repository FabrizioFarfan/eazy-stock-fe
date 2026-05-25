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

    client.onConnect = () => {
      setConnected(true)
      client.subscribe(`/topic/business/${businessId}`, (msg) => {
        try {
          const wsEvent = JSON.parse(msg.body)
          onEventRef.current?.(wsEvent)
        } catch {
          // malformed message — ignore
        }
      })
    }

    client.onDisconnect = () => setConnected(false)
    client.activate()

    return () => {
      client.deactivate()
      setConnected(false)
    }
  }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected }
}
