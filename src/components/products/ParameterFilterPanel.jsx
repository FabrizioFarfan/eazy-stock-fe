import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { useParameters } from '../../hooks/useParameters'
import { countActiveParamFilters, YES, NO } from '../../utils/parameters'
import { useT } from '../../i18n'

/**
 * Botón «Parámetros» + panel con un control por parámetro (Frank, 4-nov-2026). El estado vive en la página:
 * { [parameterId]: { value, min, max } }; la página lo convierte a pf / pfMin / pfMax con paramFiltersToQuery.
 * Sí/No y opciones filtran por igualdad; los números por rango; el texto por «contiene».
 */
const ctl = 'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

export default function ParameterFilterPanel({ value = {}, onChange, bizParam = {}, align = 'left' }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { data: parameters = [] } = useParameters(bizParam)
  const n = countActiveParamFilters(value)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!parameters.length) return null
  const get = (id) => value[id] ?? {}
  const set = (id, patch) => onChange({ ...value, [id]: { ...get(id), ...patch } })
  const clear = () => onChange({})

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid="param-filter-button"
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
          n ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
        <SlidersHorizontal size={14} />
        {t('Parámetros')}
        {n > 0 && <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">{n}</span>}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`absolute z-30 mt-1 w-[min(92vw,22rem)] rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`} data-testid="param-filter-panel">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('Filtrar por parámetros')}</p>
            <div className="flex items-center gap-2">
              {n > 0 && <button type="button" onClick={clear} className="text-[11px] font-semibold text-gray-500 hover:text-red-600">{t('Limpiar')}</button>}
              <button type="button" onClick={() => setOpen(false)} aria-label={t('Cerrar')} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
            </div>
          </div>
          <div className="max-h-[60vh] space-y-2.5 overflow-y-auto pr-0.5">
            {parameters.map((p) => {
              const f = get(p.id)
              return (
                <div key={p.id} className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
                  <label className="truncate text-xs font-semibold text-gray-700" title={p.name}>{p.name}{p.unit ? <span className="font-normal text-gray-400"> ({p.unit})</span> : null}</label>
                  {p.type === 'YES_NO' && (
                    <select value={f.value ?? ''} onChange={(e) => set(p.id, { value: e.target.value })} className={ctl}>
                      <option value="">{t('Todos')}</option>
                      <option value={YES}>{t('Sí')}</option>
                      <option value={NO}>{t('No')}</option>
                    </select>
                  )}
                  {p.type === 'OPTIONS' && (
                    <select value={f.value ?? ''} onChange={(e) => set(p.id, { value: e.target.value })} className={ctl}>
                      <option value="">{t('Todas')}</option>
                      {(p.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                  {p.type === 'NUMBER' && (
                    <div className="flex items-center gap-1.5">
                      <input type="number" inputMode="decimal" step="any" placeholder={t('desde')} value={f.min ?? ''} onChange={(e) => set(p.id, { min: e.target.value })} className={ctl} />
                      <span className="text-xs text-gray-300">–</span>
                      <input type="number" inputMode="decimal" step="any" placeholder={t('hasta')} value={f.max ?? ''} onChange={(e) => set(p.id, { max: e.target.value })} className={ctl} />
                    </div>
                  )}
                  {p.type === 'TEXT' && (
                    <input type="text" placeholder={t('contiene…')} value={f.value ?? ''} onChange={(e) => set(p.id, { value: e.target.value })} className={ctl} />
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[10px] text-gray-400">{t('Los parámetros se definen en Catálogo › Parámetros y se rellenan en cada producto.')}</p>
        </div>
      )}
    </div>
  )
}
