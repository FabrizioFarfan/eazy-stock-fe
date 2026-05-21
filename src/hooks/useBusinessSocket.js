import { useEffect, useState } from 'react'
import client from '../services/wsClient'

/**
 * Subscribes to the business-scoped WebSocket topic.
 *
 * @param {string|null} businessId  UUID of the tenant to subscribe to.
 *                                   Pass null/undefined to skip connection.
 * @param {function}    onEvent     Optional callback invoked with each WsEvent.
 *
 * @returns {{ connected: boolean, lastEvent: object|null }}
 *
 * Usage (not wired to any page yet — infrastructure only):
 *   const { connected, lastEvent } = useBusinessSocket(user?.businessId, handleEvent)
 */
export function useBusinessSocket(businessId, onEvent) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)

  useEffect(() => {
    if (!businessId) return

    client.onConnect = () => {
      setConnected(true)
      client.subscribe(`/topic/business/${businessId}`, (msg) => {
        try {
          const wsEvent = JSON.parse(msg.body)
          setLastEvent(wsEvent)
          onEvent?.(wsEvent)
        } catch {
          // malformed message — ignore
        }
      })
    }

    client.onDisconnect = () => {
      setConnected(false)
    }

    client.activate()

    return () => {
      client.deactivate()
      setConnected(false)
    }
  }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected, lastEvent }
}
