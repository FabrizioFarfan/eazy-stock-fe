import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

/**
 * Singleton STOMP client.
 *
 * Uses VITE_WS_URL directly (defined in .env.development and .env.production).
 * Falls back to stripping a trailing /api from VITE_API_URL only if VITE_WS_URL is absent,
 * using a regex end-anchor so it never accidentally removes /api from a subdomain like
 * api.eazy-stock.com (which caused the broken URL https:/.eazy-stock.com bug).
 *
 * Dev  → VITE_WS_URL=http://localhost:9393     → SockJS hits http://localhost:9393/ws
 * Prod → VITE_WS_URL=https://api.eazy-stock.com → SockJS hits https://api.eazy-stock.com/ws
 */
const baseUrl =
  import.meta.env.VITE_WS_URL ??
  (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '')

const client = new Client({
  webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
  reconnectDelay: 5000,
})

export default client
