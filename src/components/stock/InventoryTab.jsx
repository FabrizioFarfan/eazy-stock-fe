import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Package, Edit } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useProducts } from '../../hooks/useProducts'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useCategories } from '../../hooks/useCategories'
import { useDebounce } from '../../hooks/useDebounce'
import { formatPrice } from '../../utils/formatMoney'

const PAGE_SIZE = 20

function StockBadge({ current, min }) {
  if (current <= min) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-100">
        ↓ {current}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
      {current}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Stock-side inventory view: product-centric con filtros combinables y URL
 * persistente. Para edición/QR/desactivación seguimos enviando al user a
 * /products (que ya tiene esos modales). Acá solo es read + filter + jump.
 */
export default function InventoryTab() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const search          = searchParams.get('search')         || ''
  const supplierId      = searchParams.get('supplierId')     || ''
  const categoryId      = searchParams.get('categoryId')     || ''
  const lowStock        = searchParams.get('lowStock')       === 'true'
  const onlyActive      = searchParams.get('onlyActive')     !== 'false'  // default true
  const page            = Number(searchParams.get('page'))   || 0

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value === '' || value == null || value === false) next.delete(key)
    else next.set(key, String(value))
    // Si cambia cualquier filtro, reseteamos page
    if (key !== 'page') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const debouncedSearch = useDebounce(search, 350)

  const { data: suppliersData } = useSuppliers({ size: 200 })
  const suppliers = suppliersData?.content ?? []
  const { data: categoriesData } = useCategories({ size: 200 })
  const categories = categoriesData?.content ?? []

  const params = {
    page,
    size: PAGE_SIZE,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(supplierId && { supplierId }),
    ...(categoryId && { categoryId }),
    ...(lowStock && { lowStock: true }),
    ...(onlyActive ? { active: true } : {}),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }
  const { data, isLoading, isFetching } = useProducts(params)

  const items         = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  const selectCls = 'rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

  return (
    <div className="flex flex-col gap-4">

      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setParam('search', e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <select value={supplierId} onChange={(e) => setParam('supplierId', e.target.value)}
            className={`${selectCls} min-w-44`}>
            <option value="">Todos los proveedores</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.placeholderForUnassigned ? `⚠ ${s.name}` : s.name}
              </option>
            ))}
          </select>

          <select value={categoryId} onChange={(e) => setParam('categoryId', e.target.value)}
            className={`${selectCls} min-w-44`}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={lowStock}
              onChange={(e) => setParam('lowStock', e.target.checked)}
              className="accent-blue-600" />
            Solo stock bajo
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={onlyActive}
              onChange={(e) => setParam('onlyActive', e.target.checked)}
              className="accent-blue-600" />
            Solo activos
          </label>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">SKU</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Producto</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Proveedor</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Marca</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Stock actual</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Mín.</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Último costo</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Estado</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <Package size={28} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No hay productos con estos filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const isOrphan = p.supplierName === 'Sin proveedor asignado'
                  return (
                    <tr key={p.id} className={`border-b border-gray-50 transition-colors hover:bg-blue-50/30 ${isFetching ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="max-w-[200px] truncate px-4 py-3.5 font-semibold text-gray-900">{p.name}</td>
                      <td className="px-4 py-3.5">
                        {p.supplierId ? (
                          <button
                            onClick={() => setParam('supplierId', p.supplierId)}
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
                              isOrphan
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                            }`}
                          >
                            {p.supplierName}
                          </button>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{p.brandName ?? '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <StockBadge current={p.currentStock} min={p.minStock} />
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-gray-500">{p.minStock}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-700">
                        {formatPrice(p.purchasePrice)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.active
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => navigate(`/products?edit=${p.id}`)}
                          title="Editar en Productos"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-700">{fromRow}–{toRow}</span> de{' '}
              <span className="font-semibold text-gray-700">{totalElements}</span> productos
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setParam('page', Math.max(0, page - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} />Anterior
              </button>
              <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setParam('page', Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Siguiente<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
