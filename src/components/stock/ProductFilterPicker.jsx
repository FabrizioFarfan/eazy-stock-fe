import { useEffect, useRef, useState } from 'react'
import { Search, X, Package } from 'lucide-react'
import { useProductSearch } from '../../hooks/useProducts'
import { useDebounce } from '../../hooks/useDebounce'
import LoadMoreRow from '../common/LoadMoreRow'
import ProductThumb from '../products/ProductThumb'
import { useT } from '../../i18n'

/**
 * Filtro «por producto» de las tablas de Stock (pedido de William: quería ver
 * el historial de UN producto y Movimientos no dejaba buscarlo). Se escribe el
 * nombre, el código o el código del proveedor y se ELIGE el producto exacto de
 * la lista — no filtra por texto suelto, así dos productos de nombre parecido
 * nunca se mezclan. Elegido, queda como una ficha con su código y una ✕.
 *
 * Controlado: `product` ({ id, name, sku } o null) y `onChange(product | null)`.
 */
export default function ProductFilterPicker({ product, onChange, placeholder, className = '' }) {
  const t = useT()
  const [search, setSearch] = useState('')
  const [open, setOpen]     = useState(false)
  const boxRef              = useRef(null)
  const debounced           = useDebounce(search.trim(), 350)

  // Incluye los ocultos: su historial sigue existiendo y también se consulta.
  const productSearch = useProductSearch(debounced, { active: undefined })
  const { items: results, isLoading } = productSearch

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (product) {
    return (
      <div className={`flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-1.5 pl-3 pr-1.5 ${className}`}>
        <Package size={15} className="flex-shrink-0 text-blue-600" />
        <span className="min-w-0 truncate text-sm font-semibold text-blue-900">{product.name}</span>
        {product.sku && <span className="flex-shrink-0 font-mono text-xs text-blue-700/70">{product.sku}</span>}
        <button type="button" onClick={() => onChange(null)}
          className="flex-shrink-0 rounded-lg p-1.5 text-blue-700 hover:bg-blue-100 transition-colors"
          aria-label={t('Quitar el filtro de producto')} title={t('Quitar el filtro de producto')}>
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <div ref={boxRef} className={`relative min-w-0 ${className}`}>
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        placeholder={placeholder ?? t('Buscar un producto por nombre o código...')}
        className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400"
      />
      {open && debounced && (
        <div className="absolute left-0 z-20 mt-1 max-h-80 w-full min-w-[280px] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-gray-400">{t('Buscando...')}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">{t('Sin resultados')}</p>
          ) : (
            <>
              <p className="border-b border-gray-50 px-4 py-2 text-xs text-gray-500">{t('Elige el producto exacto:')}</p>
              {results.map((p) => (
                <button key={p.id} type="button"
                  onClick={() => { onChange(p); setSearch(''); setOpen(false) }}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <ProductThumb product={p} size={28} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-gray-900">{p.name}</span>
                      {p.providerCode && (
                        <span className="block truncate text-[11px] text-gray-500">{t('cód. proveedor')} {p.providerCode}</span>
                      )}
                    </span>
                  </span>
                  <span className="flex-shrink-0 font-mono text-xs text-gray-400">{p.sku}</span>
                </button>
              ))}
              <LoadMoreRow search={productSearch} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
