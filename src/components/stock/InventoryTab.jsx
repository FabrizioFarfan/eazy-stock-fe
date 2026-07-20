import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Package, X } from 'lucide-react'
import ProductDetailModal from '../products/ProductDetailModal'
import MovementModal from '../../pages/stock/MovementModal'
import SupplierReceiptModal from './SupplierReceiptModal'
import ColumnFilter from '../common/ColumnFilter'
import { useAuth } from '../../context/AuthContext'
import { useProducts } from '../../hooks/useProducts'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useBrands } from '../../hooks/useBrands'
import { useCategories } from '../../hooks/useCategories'
import { useDebounce } from '../../hooks/useDebounce'
import { formatPrice } from '../../utils/formatMoney'

const PAGE_SIZE = 20

const EMPTY_COL_FILTERS = {
  sku: '', name: '',
  supplierId: '', brandId: '',
  status: 'active',                  // active | inactive | '' (todos)
  purchaseMin: '', purchaseMax: '',
  stockMin: '', stockMax: '',
}
const DEFAULT_SORT = { key: 'name', dir: 'asc' }

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
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Stock-side inventory view: product-centric con filtros por columna (embudo
 * tipo Excel en cada encabezado) + búsqueda global y filtro de categoría en la
 * barra superior (la tabla de Stock no tiene columna de categoría). Click en una
 * fila abre el detalle del producto con acciones de stock directas.
 */
export default function InventoryTab() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [detail, setDetail]     = useState(null)
  const [adjusting, setAdjusting] = useState(null)
  const [receiving, setReceiving] = useState(null)

  // Barra superior
  const [search, setSearch]         = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [lowStock, setLowStock]     = useState(false)
  // Filtros por columna
  const [colFilters, setColFilters] = useState(EMPTY_COL_FILTERS)
  const [sort, setSort]             = useState(DEFAULT_SORT)
  const [page, setPage]             = useState(0)

  const debouncedSearch = useDebounce(search, 350)
  const debouncedCol    = useDebounce(colFilters, 350)

  const { data: suppliersData }  = useSuppliers({ size: 200 })
  const { data: brandsData }     = useBrands({ size: 200 })
  const { data: categoriesData } = useCategories({ size: 200 })
  const suppliers     = suppliersData?.content ?? []
  const categories    = categoriesData?.content ?? []
  const supplierOpts  = suppliers.map((s) => ({ value: s.id, label: s.placeholderForUnassigned ? `⚠ ${s.name}` : s.name }))
  const brandOpts     = (brandsData?.content ?? []).map((b) => ({ value: b.id, label: b.name }))

  const setField    = (k, v) => setColFilters((f) => ({ ...f, [k]: v }))
  const setRange    = (minK, maxK) => ({ min, max }) => setColFilters((f) => ({ ...f, [minK]: min, [maxK]: max }))
  const clearFields = (...keys) => setColFilters((f) => {
    const next = { ...f }
    keys.forEach((k) => { next[k] = EMPTY_COL_FILTERS[k] })
    return next
  })
  const sortStateFor = (key) => (sort.key === key ? sort.dir : null)
  const onSortBy     = (key) => (dir) => setSort(dir ? { key, dir } : DEFAULT_SORT)
  const sortBy       = `${sort.key},${sort.dir}`

  useEffect(() => { setPage(0) }, [debouncedSearch, categoryId, lowStock, sortBy, debouncedCol])

  const c = debouncedCol
  const params = {
    page,
    size: PAGE_SIZE,
    sort: sortBy,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(categoryId && { categoryId }),
    ...(lowStock && { lowStock: true }),
    ...(c.name && { name: c.name }),
    ...(c.sku && { sku: c.sku }),
    ...(c.supplierId && { supplierId: c.supplierId }),
    ...(c.brandId && { brandId: c.brandId }),
    ...(c.status !== '' && { active: c.status === 'active' }),
    ...(c.purchaseMin !== '' && { purchaseMin: c.purchaseMin }),
    ...(c.purchaseMax !== '' && { purchaseMax: c.purchaseMax }),
    ...(c.stockMin !== '' && { stockMin: c.stockMin }),
    ...(c.stockMax !== '' && { stockMax: c.stockMax }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }
  const { data, isLoading, isFetching } = useProducts(params)

  const items         = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  // Chips de filtros por columna
  const labelOf = (opts, val) => opts.find((o) => String(o.value) === String(val))?.label ?? val
  const rangeChip = (min, max, prefix, money) => {
    const fmt = (v) => (money ? formatPrice(v) : v)
    if (min !== '' && max !== '') return `${prefix}: ${fmt(min)}–${fmt(max)}`
    if (min !== '') return `${prefix}: ≥ ${fmt(min)}`
    return `${prefix}: ≤ ${fmt(max)}`
  }
  const activeChips = []
  if (colFilters.name)       activeChips.push({ label: `Producto: "${colFilters.name}"`, onRemove: () => clearFields('name') })
  if (colFilters.sku)        activeChips.push({ label: `SKU: "${colFilters.sku}"`, onRemove: () => clearFields('sku') })
  if (colFilters.supplierId) activeChips.push({ label: `Proveedor: ${labelOf(supplierOpts, colFilters.supplierId)}`, onRemove: () => clearFields('supplierId') })
  if (colFilters.brandId)    activeChips.push({ label: `Marca: ${labelOf(brandOpts, colFilters.brandId)}`, onRemove: () => clearFields('brandId') })
  if (colFilters.purchaseMin !== '' || colFilters.purchaseMax !== '')
    activeChips.push({ label: rangeChip(colFilters.purchaseMin, colFilters.purchaseMax, 'Costo', true), onRemove: () => clearFields('purchaseMin', 'purchaseMax') })
  if (colFilters.stockMin !== '' || colFilters.stockMax !== '')
    activeChips.push({ label: rangeChip(colFilters.stockMin, colFilters.stockMax, 'Stock', false), onRemove: () => clearFields('stockMin', 'stockMax') })
  if (colFilters.status !== 'active')
    activeChips.push({ label: `Estado: ${colFilters.status === 'inactive' ? 'Inactivos' : 'Todos'}`, onRemove: () => clearFields('status') })

  const selectCls = 'rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

  return (
    <div className="flex flex-col gap-4">

      {/* Barra superior: búsqueda global + categoría (sin columna) + stock bajo */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU o código..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className={`${selectCls} min-w-44`}>
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={lowStock}
              onChange={(e) => setLowStock(e.target.checked)}
              className="accent-blue-600" />
            Solo stock bajo
          </label>
        </div>
      </div>

      {/* Chips de filtros de columna activos */}
      {activeChips.length > 0 && (
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          {activeChips.map((chip, i) => (
            <span key={i}
              className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
              {chip.label}
              <button onClick={chip.onRemove} title="Quitar filtro"
                className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
          <button onClick={() => setColFilters(EMPTY_COL_FILTERS)}
            className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors">
            Limpiar todo
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <ColumnFilter label="SKU" type="text" align="left"
                  value={colFilters.sku} onChange={(v) => setField('sku', v)}
                  placeholder="Buscar código..." active={!!colFilters.sku}
                  sortState={sortStateFor('sku')} onSort={onSortBy('sku')} ascLabel="A–Z" descLabel="Z–A"
                  onClear={() => clearFields('sku')} />
                <ColumnFilter label="Producto" type="text" align="left"
                  value={colFilters.name} onChange={(v) => setField('name', v)}
                  placeholder="Buscar nombre..." active={!!colFilters.name}
                  sortState={sortStateFor('name')} onSort={onSortBy('name')} ascLabel="A–Z" descLabel="Z–A"
                  onClear={() => clearFields('name')} />
                <ColumnFilter label="Proveedor" type="select" align="left"
                  value={colFilters.supplierId} onChange={(v) => setField('supplierId', v)}
                  options={supplierOpts} active={!!colFilters.supplierId}
                  onClear={() => clearFields('supplierId')} />
                <ColumnFilter label="Marca" type="select" align="left"
                  value={colFilters.brandId} onChange={(v) => setField('brandId', v)}
                  options={brandOpts} active={!!colFilters.brandId}
                  onClear={() => clearFields('brandId')} />
                <ColumnFilter label="Stock actual" type="range" align="center"
                  rangeMin={colFilters.stockMin} rangeMax={colFilters.stockMax}
                  onRangeChange={setRange('stockMin', 'stockMax')}
                  active={colFilters.stockMin !== '' || colFilters.stockMax !== ''}
                  sortState={sortStateFor('currentStock')} onSort={onSortBy('currentStock')}
                  ascLabel="Menor" descLabel="Mayor"
                  onClear={() => clearFields('stockMin', 'stockMax')} />
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Mín.</th>
                <ColumnFilter label="Último costo" type="range" align="right"
                  rangeMin={colFilters.purchaseMin} rangeMax={colFilters.purchaseMax}
                  onRangeChange={setRange('purchaseMin', 'purchaseMax')}
                  active={colFilters.purchaseMin !== '' || colFilters.purchaseMax !== ''}
                  sortState={sortStateFor('purchasePrice')} onSort={onSortBy('purchasePrice')}
                  ascLabel="Menor" descLabel="Mayor"
                  onClear={() => clearFields('purchaseMin', 'purchaseMax')} />
                <ColumnFilter label="Estado" type="select" align="center"
                  value={colFilters.status} onChange={(v) => setField('status', v)}
                  options={[{ value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }]}
                  active={colFilters.status !== 'active'}
                  onClear={() => clearFields('status')} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
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
                    <tr
                      key={p.id}
                      onClick={() => setDetail(p)}
                      title="Ver detalle del producto"
                      className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/30 ${isFetching ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="max-w-[200px] truncate px-4 py-3.5 font-semibold text-gray-900">{p.name}</td>
                      <td className="px-4 py-3.5">
                        {p.supplierId ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setField('supplierId', p.supplierId) }}
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
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} />Anterior
              </button>
              <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Siguiente<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <ProductDetailModal
          product={items.find((i) => i.id === detail.id) ?? detail}
          onClose={() => setDetail(null)}
          onRegisterEntry={(p) => setReceiving(p)}
          onAdjust={(p) => setAdjusting(p)}
          onEdit={(p) => navigate(`/products?edit=${p.id}`)}
        />
      )}

      {adjusting && (
        <MovementModal
          type="ADJUSTMENT"
          initialProduct={adjusting}
          onClose={() => setAdjusting(null)}
        />
      )}

      {receiving && (
        <SupplierReceiptModal
          initialSupplier={receiving.supplierId ? { id: receiving.supplierId, name: receiving.supplierName } : null}
          initialProduct={receiving.supplierId ? receiving : null}
          onClose={() => setReceiving(null)}
        />
      )}
    </div>
  )
}
