import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

/**
 * Singleton STOMP client.
 *
 * In dev:  VITE_API_URL=/api  → baseUrl=''  → SockJS connects to /ws
 *          Vite proxy rewrites /ws → http://localhost:8080/ws
 *
 * In prod: VITE_API_URL=https://api.domain.com/api
 *          → baseUrl=https://api.domain.com → SockJS connects to https://api.domain.com/ws
 *
 * The client is configured here but NOT activated.
 * Activation is managed by useBusinessSocket.
 */
const baseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace('/api', '')

const client = new Client({
  webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
  reconnectDelay: 5000,
})

export default client
