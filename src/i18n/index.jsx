import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { spainVariant } from './esES'
import { getRegion, localeFor, subscribeRegion, regionSnapshot } from './region'

/**
 * i18n de EAZY STOCK — el ESPAÑOL es la llave.
 *
 *   const t = useT()
 *   t('Nueva venta')                       → 'New sale' / 'Nuova vendita' / 'Nueva venta'
 *   t('{n} producto(s)', { n: 3 })         → interpola {vars}
 *
 * Los diccionarios viven en ./dict/<dominio>.js y exportan { en: {...}, it: {...} }
 * con el texto español EXACTO como llave. Si falta la traducción se devuelve el
 * español (nunca se rompe la UI). Fuera de React (utils, toasts en hooks) usar
 * `t` exportado abajo, que lee el idioma activo.
 *
 * Multi-país (24-oct-2026): en español, si el negocio es de España (o, sin
 * sesión, el navegador está en es-ES) los textos pasan por la capa `esES.js`
 * («móvil», «ordenador», «presupuesto»). La fecha y los números siguen el
 * locale del negocio (`setBusinessLocale`, lo fija el AuthContext).
 */

export const LANGS = [
  { code: 'es', label: 'Español',  flag: '🇵🇪' },
  { code: 'en', label: 'English',  flag: '🇺🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
]
export const STORAGE_KEY = 'eazystock_lang'

// Intl locales por idioma; en español manda el del negocio (es-PE, es-CO, es-ES…).
export const LOCALE = { es: 'es-PE', en: 'en-US', it: 'it-IT' }

const modules = import.meta.glob('./dict/*.js', { eager: true })
const DICT = { en: {}, it: {} }
for (const m of Object.values(modules)) {
  const d = m.default ?? m
  if (d.en) Object.assign(DICT.en, d.en)
  if (d.it) Object.assign(DICT.it, d.it)
}

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && LANGS.some((l) => l.code === saved)) return saved
  } catch { /* storage bloqueado */ }
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase()
  return LANGS.some((l) => l.code === nav) ? nav : 'es'
}

let currentLang = detectLang()
export function getLang() { return currentLang }

export function dateLocale() { return localeFor(currentLang) }

function lookup(lang, key) {
  if (lang === 'es') return getRegion() === 'ES' ? spainVariant(key) : key
  const dict = DICT[lang]
  return dict ? (dict[key] ?? key) : key
}

function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m))
}

/** Traduce con el idioma activo (uso fuera de componentes). */
export function t(key, vars) {
  return interpolate(lookup(currentLang, key), vars)
}

const LangContext = createContext({ lang: 'es', setLang: () => {}, t })

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(currentLang)
  // País del negocio: cambia los textos de España y el locale de fechas.
  const regionKey = useSyncExternalStore(subscribeRegion, regionSnapshot, regionSnapshot)

  useEffect(() => {
    currentLang = lang
    document.documentElement.lang = lang
    try { localStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
  }, [lang])

  const setLang = useCallback((code) => {
    if (LANGS.some((l) => l.code === code)) setLangState(code)
  }, [])

  const value = useMemo(() => ({
    lang,
    setLang,
    region: regionKey.split('|')[0],
    locale: localeFor(lang),
    t: (key, vars) => interpolate(lookup(lang, key), vars),
  }), [lang, setLang, regionKey]) // regionKey: re-crear t al cambiar de país

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() { return useContext(LangContext) }
export function useT() { return useContext(LangContext).t }
