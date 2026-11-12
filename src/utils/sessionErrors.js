// «Que se mantenga conectado cuando actualizamos» (Frank, 12-nov-2026).
// Mientras se despliega, el API no contesta (502 de nginx, corte de red): eso NO es una sesión
// vencida. Solo se cierra la sesión cuando el API la rechaza de verdad (401 al refrescar).

// ¿Fallo pasajero? Sin respuesta (red caída, API reiniciando), 5xx, o 408/429.
export function isTransientFailure(error) {
  const status = error?.response?.status
  if (!status) return true
  return status >= 500 || status === 408 || status === 429
}

// Espera antes de volver a preguntar por la sesión: 2 s, 4 s, 8 s y de ahí cada 15 s.
export function reconnectDelay(attempt) {
  return Math.min(15000, 2000 * 2 ** Math.max(0, attempt))
}

// Error con forma de respuesta 401: la sesión ya no existe en este navegador (otra pestaña la cerró).
export function sessionGoneError() {
  return Object.assign(new Error('Sin sesión'), { response: { status: 401 } })
}
