import { useMemo, useState } from 'react'
import { Plus, X, Pin, Sparkles } from 'lucide-react'
import ParameterModal from './ParameterModal'
import { useT } from '../../i18n'
import { attrValueFor, withParamValue, normalizeYesNo, YES, NO } from '../../utils/parameters'

/**
 * Los parámetros del negocio como campos de la ficha del producto (Frank, 4-nov-2026). Cada uno escribe en
 * `attributes[<nombre>]`; vacío = el producto no dice nada de ese parámetro.
 *
 * Qué se ve (Frank: «que el usuario pueda escoger qué parámetros quiere ver, no que estén fijos»): los FIJADOS
 * en Catálogo › Parámetros, los que ya tienen valor en este producto y los que el usuario añade con
 * «Añadir parámetro». Cada campo tiene una ✕ que lo vacía (y lo esconde si no está fijado).
 */
const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

export default function ParameterFields({ parameters = [], attributes = {}, onChange, columns = 2 }) {
  const t = useT()
  const [added, setAdded] = useState(() => new Set())
  const [picking, setPicking] = useState(false)
  // William (varias veces): crear el parámetro desde el propio producto, sin cerrar nada.
  const [creating, setCreating] = useState(false)
  const shown = useMemo(() => parameters.filter((p) => p.pinned || added.has(p.id) || attrValueFor(attributes, p.name) !== ''), [parameters, added, attributes])
  const hidden = useMemo(() => parameters.filter((p) => !shown.includes(p)), [parameters, shown])
  const set = (p, v) => onChange(withParamValue(attributes, p.name, v))
  const remove = (p) => { set(p, ''); setAdded((s) => { const n = new Set(s); n.delete(p.id); return n }) }
  const add = (p) => { setAdded((s) => new Set(s).add(p.id)); setPicking(false) }
  const onCreated = (p) => { if (p?.id) setAdded((s) => new Set(s).add(p.id)); setPicking(false) }
  const grid = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
  return (
    <div className="flex flex-col gap-2" data-testid="parameter-fields">
      {shown.length > 0 && (
        <div className={`grid gap-3 ${grid}`}>
          {shown.map((p) => {
            const value = attrValueFor(attributes, p.name)
            return (
              <div key={p.id} className="min-w-0" data-testid="parameter-field">
                <div className="mb-1 flex items-center justify-between gap-1">
                  <label className="flex min-w-0 items-center gap-1 truncate text-xs font-semibold text-gray-600" title={p.name}>
                    {p.pinned && <Pin size={10} className="flex-shrink-0 text-gray-400" />}
                    <span className="truncate">{p.name}</span>
                    {p.type === 'NUMBER' && p.unit ? <span className="font-normal text-gray-400">· {p.unit}</span> : null}
                  </label>
                  {(value !== '' || !p.pinned) && (
                    <button type="button" onClick={() => remove(p)} aria-label={t('Quitar {name}', { name: p.name })} title={p.pinned ? t('Vaciar') : t('Quitar de esta ficha')}
                      className="flex-shrink-0 rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500"><X size={12} /></button>
                  )}
                </div>
                <ParameterValueInput parameter={p} value={value} onChange={(v) => set(p, v)} />
              </div>
            )
          })}
        </div>
      )}
      <div>
          {!picking ? (
            <button type="button" onClick={() => setPicking(true)} data-testid="add-parameter"
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
              <Plus size={12} /> {shown.length ? t('Añadir parámetro') : t('Añadir un parámetro (color, medida, material…)')}
              {hidden.length > 0 && <span className="text-gray-400">· {hidden.length}</span>}
            </button>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2" data-testid="parameter-picker">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t('¿Qué parámetro añadir?')}</p>
                <button type="button" onClick={() => setPicking(false)} aria-label={t('Cerrar')} className="rounded p-0.5 text-gray-400 hover:bg-white"><X size={12} /></button>
              </div>
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {hidden.map((p) => (
                  <button key={p.id} type="button" onClick={() => add(p)}
                    className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-700">
                    + {p.name}{p.unit ? <span className="font-normal text-gray-400"> ({p.unit})</span> : null}
                  </button>
                ))}
                <button type="button" onClick={() => setCreating(true)} data-testid="new-parameter-inline"
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-blue-400 bg-white px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50">
                  <Sparkles size={11} /> {t('Nuevo parámetro…')}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400">{t('Para que uno salga siempre, fíjalo en Catálogo › Parámetros.')}</p>
            </div>
          )}
        </div>
      {creating && <ParameterModal parameter={null} onClose={() => setCreating(false)} onCreated={onCreated} />}
    </div>
  )
}

/** El campo de un parámetro según su tipo. Lo comparten la ficha y la factura. */
export function ParameterValueInput({ parameter: p, value, onChange }) {
  return (
    <>
      {p.type === 'YES_NO' && <YesNo value={normalizeYesNo(value)} onChange={onChange} />}
      {p.type === 'OPTIONS' && <OptionPick options={p.options ?? []} value={value} onChange={onChange} />}
      {p.type === 'NUMBER' && (
        <div className="relative">
          <input type="number" inputMode="decimal" step="any" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder="—" className={`${inputCls} ${p.unit ? 'pr-12' : ''}`} />
          {p.unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">{p.unit}</span>}
        </div>
      )}
      {p.type === 'TEXT' && (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="—" className={inputCls} maxLength={200} />
      )}
    </>
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
