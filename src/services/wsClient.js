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
 *
 * BE 1.11.0 (23-oct-2026): el WebSocket pide el JWT en el CONNECT de STOMP y solo deja
 * suscribirse al topic del negocio del token. beforeConnect lee el token de localStorage
 * en CADA (re)conexión, así una reconexión tras renovar la sesión ya va con el nuevo.
 */
const baseUrl =
  import.meta.env.VITE_WS_URL ??
  (import.meta.env.VITE_API_URL ?? '').replace(/\/api$/, '')

/** Avisa que hay un access token nuevo (login, cambio de negocio o renovación en api.js). */
export const TOKEN_EVENT = 'eazystock:token'
export function announceToken() {
  try { window.dispatchEvent(new Event(TOKEN_EVENT)) } catch { /* sin window (tests) */ }
}

const client = new Client({
  webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
  reconnectDelay: 5000,
  beforeConnect: () => {
    const token = localStorage.getItem('eazystock_token')
    client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {}
  },
})

export default client
