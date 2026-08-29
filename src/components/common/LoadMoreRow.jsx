import { useLoadMoreSentinel } from '../../hooks/useInfiniteSearch'
import { useT } from '../../i18n'

/**
 * Pie de un buscador con scroll infinito: dice cuántos resultados faltan y,
 * al verse, los carga. Se pinta solo mientras queden páginas.
 */
export default function LoadMoreRow({ search, className = '' }) {
  const t = useT()
  const ref = useLoadMoreSentinel(search)
  if (!search.hasMore) return null
  const remaining = Math.max(0, search.total - search.items.length)
  return (
    <div ref={ref} className={`border-t border-gray-50 px-4 py-2.5 text-center text-xs text-gray-500 ${className}`}>
      {search.isFetchingMore
        ? t('Cargando más...')
        : t('{n} resultados más — baja para cargarlos o sigue escribiendo para afinar', { n: remaining })}
    </div>
  )
}
