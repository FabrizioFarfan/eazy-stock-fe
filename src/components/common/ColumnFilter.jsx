import { useEffect, useRef, useState } from 'react'
import { Filter, ArrowUp, ArrowDown, Check } from 'lucide-react'

/**
 * Filtro por columna estilo Excel: un botón en el encabezado (con embudo) que
 * abre un popover con el control adecuado según `type`:
 *   - 'text'  → input "contiene"
 *   - 'select'→ lista de opciones (single-select) con opción "Todos"
 *   - 'range' → dos inputs numéricos (mín / máx)
 *
 * Opcionalmente ordena por la columna (`onSort`). El encabezado se resalta en
 * azul cuando la columna tiene filtro u orden activo.
 *
 * El estado real vive en el padre; este componente es controlado. Para 'text'
 * y 'range' conviene que el padre debouncee los valores antes de pegarle al API.
 */
export default function ColumnFilter({
  label,
  align = 'left',                 // 'left' | 'right' | 'center'
  type,                           // 'text' | 'select' | 'range'
  // text
  value = '',
  onChange,
  placeholder,
  // select
  options = [],
  // range
  rangeMin = '',
  rangeMax = '',
  onRangeChange,
  // sort
  sortState = null,               // 'asc' | 'desc' | null
  onSort,
  ascLabel = 'Ascendente',
  descLabel = 'Descendente',
  // meta
  active = false,                 // ¿hay filtro aplicado en esta columna?
  onClear,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' }[align]
  const rowCls   = { left: 'justify-start', right: 'justify-end', center: 'justify-center' }[align]
  const popCls   = { left: 'left-0', right: 'right-0', center: 'left-1/2 -translate-x-1/2' }[align]

  const highlighted = active || !!sortState

  const optRow = 'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors'
  const inputCls = 'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

  return (
    <th className={`relative px-4 py-3.5 ${alignCls}`}>
      <div ref={ref} className={`flex ${rowCls} items-center`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          title={`Filtrar u ordenar por ${label}`}
          className={`group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest transition-colors ${
            highlighted ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>{label}</span>
          {sortState === 'asc'  && <ArrowUp   size={12} className="text-blue-600" />}
          {sortState === 'desc' && <ArrowDown size={12} className="text-blue-600" />}
          <Filter
            size={11}
            className={`transition-opacity ${
              active ? 'text-blue-600' : 'text-gray-300 opacity-0 group-hover:opacity-100'
            }`}
            {...(active ? { fill: 'currentColor' } : {})}
          />
        </button>

        {open && (
          <div
            className={`absolute top-full z-30 mt-1.5 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-xl ${popCls}`}
            onClick={(e) => e.stopPropagation()}
          >
            {type === 'text' && (
              <input
                autoFocus
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || 'Buscar...'}
                className={inputCls}
              />
            )}

            {type === 'select' && (
              <div className="max-h-60 overflow-y-auto pr-0.5">
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false) }}
                  className={`${optRow} ${value === '' ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="truncate">Todos</span>
                  {value === '' && <Check size={13} className="flex-shrink-0" />}
                </button>
                {options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { onChange(o.value); setOpen(false) }}
                    className={`${optRow} ${String(value) === String(o.value) ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span className="truncate">{o.label}</span>
                    {String(value) === String(o.value) && <Check size={13} className="flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {type === 'range' && (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  value={rangeMin}
                  onChange={(e) => onRangeChange({ min: e.target.value, max: rangeMax })}
                  placeholder="Mín"
                  className={inputCls}
                />
                <span className="text-gray-300">–</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={rangeMax}
                  onChange={(e) => onRangeChange({ min: rangeMin, max: e.target.value })}
                  placeholder="Máx"
                  className={inputCls}
                />
              </div>
            )}

            {onSort && (
              <div className="mt-2 flex items-center gap-1 border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() => onSort(sortState === 'asc' ? null : 'asc')}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    sortState === 'asc' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ArrowUp size={12} />{ascLabel}
                </button>
                <button
                  type="button"
                  onClick={() => onSort(sortState === 'desc' ? null : 'desc')}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    sortState === 'desc' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ArrowDown size={12} />{descLabel}
                </button>
              </div>
            )}

            {active && (
              <button
                type="button"
                onClick={() => { onClear(); setOpen(false) }}
                className="mt-2 w-full rounded-lg border border-gray-100 px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        )}
      </div>
    </th>
  )
}
