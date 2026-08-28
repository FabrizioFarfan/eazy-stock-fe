import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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
 */

export const LANGS = [
  { code: 'es', label: 'Español',  flag: '🇵🇪' },
  { code: 'en', label: 'English',  flag: '🇺🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
]
export const STORAGE_KEY = 'eazystock_lang'

// Intl locales por idioma (la moneda sigue siendo PEN: el mercado es Perú)
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
export function dateLocale() { return LOCALE[currentLang] ?? 'es-PE' }

function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m))
}

/** Traduce con el idioma activo (uso fuera de componentes). */
export function t(key, vars) {
  const dict = DICT[currentLang]
  const out = dict ? (dict[key] ?? key) : key
  return interpolate(out, vars)
}

const LangContext = createContext({ lang: 'es', setLang: () => {}, t })

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(currentLang)

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
    locale: LOCALE[lang],
    t: (key, vars) => {
      const dict = DICT[lang]
      return interpolate(dict ? (dict[key] ?? key) : key, vars)
    },
  }), [lang, setLang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() { return useContext(LangContext) }
export function useT() { return useContext(LangContext).t }
