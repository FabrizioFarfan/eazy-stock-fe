// País del negocio para la UI (multi-país, 24-oct-2026): decide la capa de
// textos de España (esES.js) y el locale de Intl para fechas en cada idioma.
// Lo fija el AuthContext con /auth/me; sin sesión manda el navegador.

const BASE_LOCALE = { es: 'es-PE', en: 'en-US', it: 'it-IT' }

/**
 * Regiones del navegador en orden (navigator.languages): ['es-CO', 'en'] → ['CO'].
 * `onlySpanish`: solo las de entradas en español (para la capa de textos de España).
 */
export function browserRegions({ onlySpanish = false } = {}) {
  const out = []
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const l of langs) {
      const m = /^([a-z]{2,3})-([a-z]{2})\b/i.exec(l || '')
      if (m && (!onlySpanish || m[1].toLowerCase() === 'es')) out.push(m[2].toUpperCase())
    }
  } catch { /* sin navigator (prerender) */ }
  return out
}

const NAV_REGION = browserRegions({ onlySpanish: true })[0] ?? null
let region = NAV_REGION
let bizLocale = null
let bizDateFormat = 'dd/MM/yyyy'
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

/** País (ISO alpha-2) cuyos textos se usan en español; null = vuelve al del navegador. */
export function setRegion(code) {
  const next = code ? String(code).toUpperCase() : NAV_REGION
  if (next === region) return
  region = next
  emit()
}
export function getRegion() { return region }
/** true si en español toca «móvil / ordenador / presupuesto». */
export function isSpainSpanish() { return region === 'ES' }

/** Lo fija el AuthContext con el negocio: { locale: 'es-ES', dateFormat: 'dd/MM/yyyy' } (o null al salir). */
export function setBusinessLocale(b) {
  bizLocale = b?.locale || null
  bizDateFormat = b?.dateFormat || 'dd/MM/yyyy'
  emit()
}
export function getDateFormat() { return bizDateFormat }

/** Locale para Intl (fechas) según el idioma y el país del negocio. */
export function localeFor(lang) {
  if (lang === 'es') {
    if (bizLocale && /^es\b/i.test(bizLocale)) return bizLocale
    return region === 'ES' ? 'es-ES' : 'es-PE'
  }
  // Inglés con fecha día/mes (todo LatAm y España): en-GB, no el mes primero de en-US.
  if (lang === 'en' && /^d/i.test(bizDateFormat)) return 'en-GB'
  return BASE_LOCALE[lang] ?? 'es-PE'
}

export function subscribeRegion(fn) { listeners.add(fn); return () => listeners.delete(fn) }
/** Cambia con el país y el locale: lo usa el LangProvider para re-renderizar. */
export const regionSnapshot = () => `${region}|${bizLocale}|${bizDateFormat}`
