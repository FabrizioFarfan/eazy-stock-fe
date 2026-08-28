import { Globe } from 'lucide-react'
import { LANGS, useLang } from './index'

/**
 * Selector de idioma. `compact` = solo bandera+código (topbar / landing);
 * por defecto pinta los tres como segmentos (Ajustes).
 */
export default function LangSwitcher({ compact = false, className = '' }) {
  const { lang, setLang } = useLang()

  if (compact) {
    return (
      <label className={`inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-600 ${className}`} title="Idioma / Language / Lingua">
        <Globe size={14} className="text-gray-400" />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-transparent outline-none cursor-pointer"
          aria-label="Idioma"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>{l.flag} {l.code.toUpperCase()}</option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <div className={`inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 ${className}`} role="radiogroup" aria-label="Idioma">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          role="radio"
          aria-checked={lang === l.code}
          onClick={() => setLang(l.code)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
            lang === l.code ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-100' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>{l.flag}</span>{l.label}
        </button>
      ))}
    </div>
  )
}
