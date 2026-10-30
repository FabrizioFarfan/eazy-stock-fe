import { isPublicPath, normalizePath, optedOut } from '../utils/analytics'

// Envío de eventos de la analítica propia (ver Tracker.jsx). Fuera del componente por react-refresh.

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'
export function canTrack() {
  if (typeof window === 'undefined' || optedOut(navigator)) return false
  try { if (localStorage.getItem('eazystock_token')) return false } catch { /* bloqueado */ }
  return isPublicPath(window.location.pathname)
}

export function track(name, extra = {}) {
  if (!canTrack()) return
  const body = JSON.stringify({ name, path: normalizePath(window.location.pathname), lang: document.documentElement.lang || undefined, ...extra })
  try {
    // keepalive: el clic que cambia de página no corta el envío. Sin credenciales: no viaja ninguna cookie.
    fetch(`${BASE_URL}/public/analytics/event`, {
      method: 'POST', keepalive: true, credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body,
    }).catch(() => {})
  } catch { /* nunca rompe la página */ }
}

