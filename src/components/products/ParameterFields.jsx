import { useState } from 'react'
import { useT } from '../../i18n'
import { attrValueFor, withParamValue, normalizeYesNo, YES, NO } from '../../utils/parameters'

/**
 * Los parámetros del negocio como campos de la ficha del producto (Frank, 4-nov-2026). Cada uno escribe en
 * `attributes[<nombre>]`; vacío = el producto no dice nada de ese parámetro. Sí/No son dos botones, las
 * opciones un desplegable (con «otro…» por si el valor no está en la lista), los números llevan su medida.
 */
const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

export default function ParameterFields({ parameters = [], attributes = {}, onChange, columns = 2 }) {
  const t = useT()
  if (!parameters.length) return null
  const set = (p, v) => onChange(withParamValue(attributes, p.name, v))
  const grid = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
  return (
    <div className={`grid gap-3 ${grid}`} data-testid="parameter-fields">
      {parameters.map((p) => {
        const value = attrValueFor(attributes, p.name)
        return (
          <div key={p.id} className="min-w-0">
            <label className="mb-1 block truncate text-xs font-semibold text-gray-600" title={p.name}>
              {p.name}{p.type === 'NUMBER' && p.unit ? <span className="font-normal text-gray-400"> · {p.unit}</span> : null}
            </label>
            {p.type === 'YES_NO' && <YesNo value={normalizeYesNo(value)} onChange={(v) => set(p, v)} />}
            {p.type === 'OPTIONS' && <OptionPick options={p.options ?? []} value={value} onChange={(v) => set(p, v)} />}
            {p.type === 'NUMBER' && (
              <div className="relative">
                <input type="number" inputMode="decimal" step="any" value={value} onChange={(e) => set(p, e.target.value)}
                  placeholder="—" className={`${inputCls} ${p.unit ? 'pr-12' : ''}`} />
                {p.unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">{p.unit}</span>}
              </div>
            )}
            {p.type === 'TEXT' && (
              <input type="text" value={value} onChange={(e) => set(p, e.target.value)} placeholder={t('—')} className={inputCls} maxLength={255} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function YesNo({ value, onChange }) {
  const t = useT()
  const opts = [[YES, t('Sí'), 'bg-emerald-600 text-white'], [NO, t('No'), 'bg-gray-700 text-white']]
  return (
    <div className="inline-flex w-full rounded-lg border border-gray-300 bg-white p-0.5" role="group">
      {opts.map(([v, label, on]) => (
        <button key={v} type="button" aria-pressed={value === v}
          onClick={() => onChange(value === v ? '' : v)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold transition-colors ${value === v ? on : 'text-gray-500 hover:bg-gray-50'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

function OptionPick({ options, value, onChange }) {
  const t = useT()
  const known = options.some((o) => o.toLowerCase() === String(value).toLowerCase())
  const [other, setOther] = useState(!!value && !known)
  if (other) {
    return (
      <div className="flex gap-1.5">
        <input autoFocus type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={t('Escribe el valor…')} className={inputCls} maxLength={60} />
        <button type="button" onClick={() => { setOther(false); onChange('') }} className="flex-shrink-0 rounded-lg border border-gray-200 px-2 text-xs font-semibold text-gray-500 hover:bg-gray-50">{t('Lista')}</button>
      </div>
    )
  }
  return (
    <select value={known ? options.find((o) => o.toLowerCase() === String(value).toLowerCase()) : ''} className={inputCls}
      onChange={(e) => { if (e.target.value === '__other__') { setOther(true); onChange('') } else onChange(e.target.value) }}>
      <option value="">—</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
      <option value="__other__">{t('otro…')}</option>
    </select>
  )
}
