// Analítica propia de la web pública (Frank, 30-oct-2026). Sin cookies, sin localStorage ni sessionStorage y
// sin datos personales: cada evento viaja solo, y el servidor cuenta visitantes con un hash que cambia cada día
// (ver AnalyticsService en el API). Aquí está la lógica pura (con tests); el componente es analytics/Tracker.jsx.

/** Solo la web pública cuenta; dentro de la app no se sigue a nadie. */
export const PUBLIC_PATHS = ['/', '/planes', '/funciones', '/para-quien', '/preguntas', '/registro', '/login',
  '/impressum', '/datenschutz', '/terminos', '/eliminar-cuenta']

export function isPublicPath(pathname) {
  const p = normalizePath(pathname)
  return PUBLIC_PATHS.includes(p)
}

export function normalizePath(pathname) {
  if (!pathname) return '/'
  const p = pathname.split('?')[0].split('#')[0]
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p
}

/** utm_* del enlace (lo que reparte el marketing: ?utm_source=instagram&utm_campaign=fabrizio). */
export function utmFrom(search) {
  const q = new URLSearchParams(search || '')
  const pick = (k) => {
    const v = (q.get(k) || '').trim().toLowerCase()
    return /^[a-z0-9_.+-]{1,60}$/.test(v) ? v : undefined
  }
  return { utmSource: pick('utm_source'), utmMedium: pick('utm_medium'), utmCampaign: pick('utm_campaign') }
}

const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)

/**
 * Qué botón se pulsó. Primero `data-track` (el nombre que le pusimos); si no, por adónde lleva: WhatsApp,
 * registro, planes, entrar, correo o teléfono. Lo demás no se cuenta (no queremos cada clic de la página).
 */
export function clickLabel({ track, href }) {
  if (track) return slug(track) || null
  const h = String(href || '')
  if (/wa\.me|whatsapp\.com/i.test(h)) return 'whatsapp'
  if (/^mailto:/i.test(h)) return 'email'
  if (/^tel:/i.test(h)) return 'phone'
  let path = h
  try { path = new URL(h, 'https://eazy-stock.com').pathname } catch { /* href raro */ }
  if (/^\/(registro|register|signup)\/?$/.test(path)) return 'go_register'
  if (/^\/(planes|precios)\/?$/.test(path)) return 'go_plans'
  if (/^\/login\/?$/.test(path)) return 'go_login'
  if (/^\/(funciones|para-quien|preguntas)\/?$/.test(path)) return 'go_' + slug(path)
  return null
}

/** «No me sigas» del navegador (Do Not Track o Global Privacy Control): no se manda nada. */
export function optedOut(nav) {
  return nav?.doNotTrack === '1' || nav?.globalPrivacyControl === true
}
