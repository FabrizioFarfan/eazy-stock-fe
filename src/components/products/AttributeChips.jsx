import { useT } from '../../i18n'

/**
 * Atributos del producto como etiquetas cortas («Medida 1/2"») para las tablas.
 * Nació del caso de William: ARMELLA CERRADA 1" 1/2, ARMELLA CERRADA 1/4… con
 * la medida en el nombre, la tabla lo cortaba y no sabía cuál era cuál. Con la
 * medida como atributo el nombre queda corto y la diferencia se ve de un vistazo.
 * Muestra hasta `max` y resume el resto en «+N» (el detalle completo va en el title).
 */
export default function AttributeChips({ attributes, max = 2, empty = '—' }) {
  const t = useT()
  const entries = Object.entries(attributes ?? {}).filter(([, v]) => String(v ?? '').trim() !== '')
  if (entries.length === 0) return empty ? <span className="text-gray-300">{empty}</span> : null
  const all = entries.map(([k, v]) => `${k}: ${v}`).join(' · ')
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1" title={`${t('Atributos')} — ${all}`}>
      {entries.slice(0, max).map(([k, v]) => (
        <span key={k} className="inline-flex max-w-[150px] items-baseline gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-xs ring-1 ring-indigo-100">
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-indigo-500">{k}</span>
          <span className="truncate font-bold text-indigo-800">{v}</span>
        </span>
      ))}
      {entries.length > max && (
        <span className="rounded-lg bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">+{entries.length - max}</span>
      )}
    </span>
  )
}
