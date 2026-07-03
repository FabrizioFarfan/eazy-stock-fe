import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { quickRange } from '../../utils/dateRanges'

/**
 * Selector de rango de fechas "para humanos": botones grandes
 * Hoy / Esta semana / Este mes / Este año, y "Elegir fechas" para
 * el rango personalizado. Pensado para usuarios que se confunden
 * con los inputs de fecha — un clic y listo.
 *
 * Controlado: recibe from/to (ISO yyyy-mm-dd) y llama onChange({from,to})
 * apenas se toca un botón (los inputs manuales también disparan onChange).
 */

const CHIPS = [
  { key: 'day',   label: 'Hoy' },
  { key: 'week',  label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'year',  label: 'Este año' },
]

const inputCls = 'rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

export default function DateRangeQuick({ from, to, onChange }) {
  const [customOpen, setCustomOpen] = useState(false)

  // El chip activo se deduce del rango actual — así "Este mes" aparece
  // seleccionado de entrada cuando la página arranca con ese default.
  const activeKey = !customOpen
    ? CHIPS.find((c) => {
        const r = quickRange(c.key)
        return r.from === from && r.to === to
      })?.key
    : null

  const pick = (key) => {
    setCustomOpen(false)
    onChange(quickRange(key))
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => pick(c.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              activeKey === c.key
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            customOpen || !activeKey
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Calendar size={14} />
          Elegir fechas
        </button>
      </div>

      {(customOpen || !activeKey) && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Desde</span>
            <input type="date" value={from ?? ''} max={to || undefined}
              onChange={(e) => onChange({ from: e.target.value, to })} className={inputCls} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Hasta</span>
            <input type="date" value={to ?? ''} min={from || undefined}
              onChange={(e) => onChange({ from, to: e.target.value })} className={inputCls} />
          </div>
        </div>
      )}
    </div>
  )
}
