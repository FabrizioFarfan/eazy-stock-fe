import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Package, Trash2, ChevronLeft, ChevronRight, Plus, SlidersHorizontal, HelpCircle, FileSpreadsheet, Download, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../hooks/useProducts'
import { useSuppliers } from '../hooks/useSuppliers'
import { useBrands } from '../hooks/useBrands'
import { useCategories } from '../hooks/useCategories'
import { productsApi } from '../services/endpoints/products'
import { useDebounce } from '../hooks/useDebounce'
import ProductFormModal from '../components/products/ProductFormModal'
import ProductDetailModal from '../components/products/ProductDetailModal'
import BulkDeleteModal from '../components/products/BulkDeleteModal'
import DeleteProductModal from '../components/products/DeleteProductModal'
import QrModal from '../components/products/QrModal'
import ColumnFilter from '../components/common/ColumnFilter'
import ExpiryBadge from '../components/common/ExpiryBadge'
import { formatPrice } from '../utils/formatMoney'
import PageTitle from '../components/common/PageTitle'
import HelpDrawer from '../components/common/HelpDrawer'

// Estado inicial de los filtros por columna (embudo por encabezado).
const EMPTY_COL_FILTERS = {
  sku: '', name: '', providerCode: '',
  categoryId: '', brandId: '', supplierId: '',
  status: 'active',                  // active | inactive | all
  purchaseMin: '', purchaseMax: '',
  saleMin: '', saleMax: '',
  stockMin: '', stockMax: '',
  expiryStatus: '',                  // '' | expiring | expired | has_date
}
const EXPIRY_OPTS = [
  { value: 'expiring', label: 'Por vencer' },
  { value: 'expired',  label: 'Vencidos' },
  { value: 'has_date', label: 'Con fecha' },
]
const DEFAULT_SORT = { key: 'name', dir: 'asc' }

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 11 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

function StockBadge({ current, min }) {
  const isLow = current <= min
  return isLow ? (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-100">
      ↓ {current}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
      {current}
    </span>
  )
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
      Activo
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
      Inactivo
    </span>
  )
}

const PAGE_SIZE = 20
const canMutate = (u) => u?.role === 'OWNER' || (u?.role === 'SUPER_ADMIN' && !!u?.businessId)

export default function ProductsPage() {
  const { user, seenTutorials, markTutorialSeen } = useAuth()
  const isManager   = canMutate(user)

  // Tutorial interactivo del modal "Nuevo producto".
  //
  // Disparadores:
  //  - Primera visita a /productos (visto persistido por usuario en el BE)
  //  - Bandera sessionStorage seteada desde Ajustes
  //  - Evento `eazystock:show-product-tutorial` (botón "Tutorial" en header)
  //
  // En todos los casos: abrimos el modal en modo CREATE con tutorial=true.
  // El modal monta el overlay interactivo (spotlight + cartelito).
  const FIRST_VISIT_KEY = 'eazystock_product_tutorial_seen_v3'
  const SESSION_FLAG    = 'eazystock_product_tutorial_pending'

  useEffect(() => {
    if (!isManager || !user) return

    // Trigger desde Ajustes: bandera de sesión
    try {
      if (sessionStorage.getItem(SESSION_FLAG) === '1') {
        sessionStorage.removeItem(SESSION_FLAG)
        openCreateWithTour()
        return
      }
    } catch { /* sessionStorage bloqueado */ }

    // Auto-show de primera visita (espera a que los vistos carguen del BE)
    if (seenTutorials && !seenTutorials.has(FIRST_VISIT_KEY)) {
      openCreateWithTour()
      markTutorialSeen(FIRST_VISIT_KEY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, user, seenTutorials])

  // Listener para el botón "Tutorial" en el header (y para cualquier otro
  // lugar que dispare el evento mientras estamos en /productos).
  useEffect(() => {
    const handler = () => openCreateWithTour()
    window.addEventListener('eazystock:show-product-tutorial', handler)
    return () => window.removeEventListener('eazystock:show-product-tutorial', handler)
  }, [])

  // ?variablePrice=1 en la URL pre-activa el filtro (link desde Balance)
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch]             = useState('')
  const [lowStock, setLowStock]         = useState(false)
  const [orphansOnly, setOrphansOnly]   = useState(false)
  const [variableOnly, setVariableOnly] = useState(searchParams.get('variablePrice') === '1')
  const [colFilters, setColFilters]     = useState(EMPTY_COL_FILTERS)
  const [sort, setSort]                 = useState(DEFAULT_SORT)
  const [page, setPage]                 = useState(0)
  const debouncedSearch                 = useDebounce(search, 400)
  const debouncedCol                    = useDebounce(colFilters, 400)

  // Catálogos para los filtros tipo "select" de las columnas. Como SUPER_ADMIN
  // estos endpoints exigen businessId — sin él responden 400 y los selects
  // quedarían vacíos.
  const bizParam = user?.role === 'SUPER_ADMIN' && user?.businessId
    ? { businessId: user.businessId } : {}
  const { data: suppliersData }  = useSuppliers({ size: 200, ...bizParam })
  const { data: brandsData }     = useBrands({ size: 200, ...bizParam })
  const { data: categoriesData } = useCategories({ size: 200, ...bizParam })
  const supplierOpts  = (suppliersData?.content  ?? []).map((s) => ({ value: s.id, label: s.name }))
  const brandOpts     = (brandsData?.content     ?? []).map((b) => ({ value: b.id, label: b.name }))
  const categoryOpts  = (categoriesData?.content ?? []).map((c) => ({ value: c.id, label: c.name }))

  // Helpers de filtros por columna
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

  useEffect(() => { setPage(0) }, [debouncedSearch, lowStock, orphansOnly, variableOnly, sortBy, debouncedCol])

  const [formModal,   setFormModal]   = useState({ open: false, product: null, tutorial: false })
  const [qrModal,     setQrModal]     = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [removeModal, setRemoveModal] = useState(null)   // producto a ocultar/borrar

  const c = debouncedCol
  const params = {
    page, size: PAGE_SIZE,
    sort: sortBy,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(lowStock && { lowStock: true }),
    ...(orphansOnly && { placeholderOnly: true }),
    ...(variableOnly && { variablePriceOnly: true }),
    // Filtros por columna
    ...(c.name && { name: c.name }),
    ...(c.sku && { sku: c.sku }),
    ...(c.providerCode && { providerCode: c.providerCode }),
    ...(c.categoryId && { categoryId: c.categoryId }),
    ...(c.brandId && { brandId: c.brandId }),
    ...(c.supplierId && { supplierId: c.supplierId }),
    ...(c.status !== '' && { active: c.status === 'active' }),
    ...(c.purchaseMin !== '' && { purchaseMin: c.purchaseMin }),
    ...(c.purchaseMax !== '' && { purchaseMax: c.purchaseMax }),
    ...(c.saleMin !== '' && { saleMin: c.saleMin }),
    ...(c.saleMax !== '' && { saleMax: c.saleMax }),
    ...(c.stockMin !== '' && { stockMin: c.stockMin }),
    ...(c.stockMax !== '' && { stockMax: c.stockMax }),
    ...(c.expiryStatus && { expiryStatus: c.expiryStatus }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }

  const { data, isLoading, isFetching } = useProducts(params)

  const products      = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const from          = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const to            = Math.min((page + 1) * PAGE_SIZE, totalElements)

  // Chips de filtros de columna activos (usa el estado en vivo para que quitar
  // un chip sea inmediato). El "Estado: Activos" por defecto no genera chip.
  const labelOf = (opts, val) => opts.find((o) => String(o.value) === String(val))?.label ?? val
  const rangeChip = (min, max, prefix, money) => {
    const fmt = (v) => (money ? formatPrice(v) : v)
    if (min !== '' && max !== '') return `${prefix}: ${fmt(min)}–${fmt(max)}`
    if (min !== '') return `${prefix}: ≥ ${fmt(min)}`
    return `${prefix}: ≤ ${fmt(max)}`
  }
  const activeChips = []
  if (colFilters.name)         activeChips.push({ label: `Nombre: "${colFilters.name}"`, onRemove: () => clearFields('name') })
  if (colFilters.sku)          activeChips.push({ label: `Código: "${colFilters.sku}"`, onRemove: () => clearFields('sku') })
  if (colFilters.categoryId)   activeChips.push({ label: `Categoría: ${labelOf(categoryOpts, colFilters.categoryId)}`, onRemove: () => clearFields('categoryId') })
  if (colFilters.brandId)      activeChips.push({ label: `Marca: ${labelOf(brandOpts, colFilters.brandId)}`, onRemove: () => clearFields('brandId') })
  if (colFilters.supplierId)   activeChips.push({ label: `Proveedor: ${labelOf(supplierOpts, colFilters.supplierId)}`, onRemove: () => clearFields('supplierId') })
  if (colFilters.providerCode) activeChips.push({ label: `Cód. prov.: "${colFilters.providerCode}"`, onRemove: () => clearFields('providerCode') })
  if (colFilters.purchaseMin !== '' || colFilters.purchaseMax !== '')
    activeChips.push({ label: rangeChip(colFilters.purchaseMin, colFilters.purchaseMax, 'P. compra', true), onRemove: () => clearFields('purchaseMin', 'purchaseMax') })
  if (colFilters.saleMin !== '' || colFilters.saleMax !== '')
    activeChips.push({ label: rangeChip(colFilters.saleMin, colFilters.saleMax, 'P. venta', true), onRemove: () => clearFields('saleMin', 'saleMax') })
  if (colFilters.stockMin !== '' || colFilters.stockMax !== '')
    activeChips.push({ label: rangeChip(colFilters.stockMin, colFilters.stockMax, 'Stock', false), onRemove: () => clearFields('stockMin', 'stockMax') })
  if (colFilters.status !== 'active')
    activeChips.push({ label: `Estado: ${colFilters.status === 'inactive' ? 'Inactivos' : 'Todos'}`, onRemove: () => clearFields('status') })
  if (colFilters.expiryStatus)
    activeChips.push({ label: `Vencimiento: ${EXPIRY_OPTS.find((o) => o.value === colFilters.expiryStatus)?.label}`, onRemove: () => clearFields('expiryStatus') })

  const openCreate         = () => setFormModal({ open: true, product: null, tutorial: false })
  const openCreateWithTour = () => setFormModal({ open: true, product: null, tutorial: true  })
  const openEdit           = (p) => setFormModal({ open: true, product: p,   tutorial: false })
  const closeForm          = () => setFormModal({ open: false, product: null, tutorial: false })

  // ?edit=<id> abre directo el modal de edición (link desde Stock). Se quita
  // el param de la URL para que cerrar el modal no lo re-abra al navegar.
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (!editId) return
    const next = new URLSearchParams(searchParams)
    next.delete('edit')
    setSearchParams(next, { replace: true })
    productsApi.getById(editId)
      .then((r) => {
        const product = r.data.data
        if (product) setFormModal({ open: true, product, tutorial: false })
      })
      .catch(() => { /* producto inexistente: queda la lista normal */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ocultar o borrar: el modal explica la diferencia y solo ofrece el borrado
  // real cuando el producto nunca se usó.
  const handleRemove = (p) => setRemoveModal(p)

  return (
    <div className="flex flex-col gap-5">
      {/* Header — flex-wrap para que en móvil los botones bajen de fila en
          vez de desbordar; las etiquetas largas se acortan en pantalla chica */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PageTitle icon={Package} tone="cyan">Productos</PageTitle>
          <HelpDrawer title="Cómo usar Productos" autoOpenKey="eazystock_products_help_v1">
            <p>Este es tu <strong>catálogo</strong>: todo lo que vendes vive acá, con su precio de compra, precio de venta y stock.</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">➕ Agregar productos</p>
              <p className="mt-1">Con <strong>"Nuevo producto"</strong> los cargas uno por uno, o usa <strong>"Importar"</strong> para subir todo tu inventario desde un Excel de una sola vez.</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">👆 Click en cualquier fila</p>
              <p className="mt-1">Se abre el detalle del producto: desde ahí puedes <strong>editarlo, ver su código QR, registrar entradas de stock o desactivarlo</strong>.</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🔔 Stock mínimo</p>
              <p className="mt-1">Si le pones un mínimo a un producto, la app te <strong>avisa sola</strong> cuando está por agotarse (campanita y reporte "Stock bajo").</p>
            </div>
            <p className="text-xs text-gray-400">Tip: usa el buscador o escanea el código del producto para encontrarlo al instante.</p>
          </HelpDrawer>
          {!isLoading && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {totalElements}
            </span>
          )}
        </div>
        {isManager && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('eazystock:show-product-tutorial'))}
              title="Ver tutorial: cómo agregar un producto"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              <HelpCircle size={14} />
              Tutorial
            </button>
            <Link
              to="/products/import"
              title="Importar productos desde un Excel o CSV"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <FileSpreadsheet size={14} />
              Importar<span className="hidden md:inline"> desde Excel</span>
            </Link>
            <Link
              to="/products/export"
              title="Exportar productos a un Excel o CSV (re-importable)"
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Download size={14} />
              Exportar<span className="hidden md:inline"> a Excel</span>
            </Link>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              title="Borrar productos en masa por fecha de creación (ej. deshacer un import)"
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} />
              Borrar<span className="hidden md:inline"> en masa</span>
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <Plus size={15} />
              Nuevo<span className="hidden md:inline"> producto</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <SlidersHorizontal size={15} className="flex-shrink-0 text-gray-400" />
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o código de proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 transition-colors select-none">
          <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} className="accent-blue-600" />
          <span className="text-gray-600 font-medium">Stock bajo</span>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm hover:bg-amber-100 transition-colors select-none"
          title="Productos vinculados al placeholder 'Sin proveedor asignado' — data legacy a reasignar">
          <input type="checkbox" checked={orphansOnly}
            onChange={(e) => setOrphansOnly(e.target.checked)} className="accent-amber-600" />
          <span className="text-amber-700 font-semibold">Sin proveedor real</span>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm hover:bg-orange-100 transition-colors select-none"
          title="Productos con precio variable: el precio se pide al momento de vender. Edítalos para ponerles un precio fijo.">
          <input type="checkbox" checked={variableOnly}
            onChange={(e) => setVariableOnly(e.target.checked)} className="accent-orange-600" />
          <span className="text-orange-700 font-semibold">Sin precio definido</span>
        </label>

        <span className="hidden text-xs text-gray-400 lg:inline">
          Filtra y ordena desde el <SlidersHorizontal size={11} className="inline -mt-0.5" /> de cada columna
        </span>
      </div>

      {/* Chips de filtros de columna activos */}
      {activeChips.length > 0 && (
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          {activeChips.map((chip, i) => (
            <span key={i}
              className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
              {chip.label}
              <button onClick={chip.onRemove}
                title="Quitar filtro"
                className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setColFilters(EMPTY_COL_FILTERS)}
            className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <ColumnFilter label="Código" type="text" align="left"
                  value={colFilters.sku} onChange={(v) => setField('sku', v)}
                  placeholder="Buscar código..." active={!!colFilters.sku}
                  sortState={sortStateFor('sku')} onSort={onSortBy('sku')} ascLabel="A–Z" descLabel="Z–A"
                  onClear={() => clearFields('sku')} />
                <ColumnFilter label="Nombre" type="text" align="left"
                  value={colFilters.name} onChange={(v) => setField('name', v)}
                  placeholder="Buscar nombre..." active={!!colFilters.name}
                  sortState={sortStateFor('name')} onSort={onSortBy('name')} ascLabel="A–Z" descLabel="Z–A"
                  onClear={() => clearFields('name')} />
                <ColumnFilter label="Categoría" type="select" align="left"
                  value={colFilters.categoryId} onChange={(v) => setField('categoryId', v)}
                  options={categoryOpts} active={!!colFilters.categoryId}
                  onClear={() => clearFields('categoryId')} />
                <ColumnFilter label="Marca" type="select" align="left"
                  value={colFilters.brandId} onChange={(v) => setField('brandId', v)}
                  options={brandOpts} active={!!colFilters.brandId}
                  onClear={() => clearFields('brandId')} />
                <ColumnFilter label="Proveedor" type="select" align="left"
                  value={colFilters.supplierId} onChange={(v) => setField('supplierId', v)}
                  options={supplierOpts} active={!!colFilters.supplierId}
                  onClear={() => clearFields('supplierId')} />
                <ColumnFilter label="Cód. proveedor" type="text" align="left"
                  value={colFilters.providerCode} onChange={(v) => setField('providerCode', v)}
                  placeholder="Buscar código..." active={!!colFilters.providerCode}
                  onClear={() => clearFields('providerCode')} />
                <ColumnFilter label="P. Compra" type="range" align="right"
                  rangeMin={colFilters.purchaseMin} rangeMax={colFilters.purchaseMax}
                  onRangeChange={setRange('purchaseMin', 'purchaseMax')}
                  active={colFilters.purchaseMin !== '' || colFilters.purchaseMax !== ''}
                  sortState={sortStateFor('purchasePrice')} onSort={onSortBy('purchasePrice')}
                  ascLabel="Menor" descLabel="Mayor"
                  onClear={() => clearFields('purchaseMin', 'purchaseMax')} />
                <ColumnFilter label="P. Venta" type="range" align="right"
                  rangeMin={colFilters.saleMin} rangeMax={colFilters.saleMax}
                  onRangeChange={setRange('saleMin', 'saleMax')}
                  active={colFilters.saleMin !== '' || colFilters.saleMax !== ''}
                  sortState={sortStateFor('salePrice')} onSort={onSortBy('salePrice')}
                  ascLabel="Menor" descLabel="Mayor"
                  onClear={() => clearFields('saleMin', 'saleMax')} />
                <ColumnFilter label="Stock" type="range" align="center"
                  rangeMin={colFilters.stockMin} rangeMax={colFilters.stockMax}
                  onRangeChange={setRange('stockMin', 'stockMax')}
                  active={colFilters.stockMin !== '' || colFilters.stockMax !== ''}
                  sortState={sortStateFor('currentStock')} onSort={onSortBy('currentStock')}
                  ascLabel="Menor" descLabel="Mayor"
                  onClear={() => clearFields('stockMin', 'stockMax')} />
                <ColumnFilter label="Vence" type="select" align="center"
                  value={colFilters.expiryStatus} onChange={(v) => setField('expiryStatus', v)}
                  options={EXPIRY_OPTS} active={!!colFilters.expiryStatus}
                  onClear={() => clearFields('expiryStatus')} />
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className="flex flex-col items-center gap-4 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <Package size={28} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700">No hay productos aún</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {search ? `Sin resultados para "${search}"` : 'Agrega tu primer producto para empezar'}
                        </p>
                      </div>
                      {isManager && !search && (
                        <button
                          onClick={openCreate}
                          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
                        >
                          <Plus size={14} />
                          Crear primer producto
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}
                    onClick={() => setDetailModal(p)}
                    title="Ver detalles y opciones del producto"
                    className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40 ${isFetching ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{p.sku}</td>
                    <td className="max-w-[180px] truncate px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      {p.presentation && (
                        <p className="text-xs text-gray-400 truncate">{p.presentation}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{p.categoryName || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{p.brandName || '—'}</td>
                    <td className="max-w-[120px] truncate px-5 py-3.5 text-gray-500">{p.supplierName || '—'}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{p.providerCode || '—'}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600">{formatPrice(p.purchasePrice)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      {p.priceIsVariable ? (
                        <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                          Variable
                        </span>
                      ) : (
                        formatPrice(p.salePrice)
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center"><StockBadge current={p.currentStock} min={p.minStock} /></td>
                    <td className="px-5 py-3.5 text-center"><ExpiryBadge product={p} dash /></td>
                    <td className="px-5 py-3.5 text-center"><StatusBadge active={p.active} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-5 py-3.5">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-700">{from}–{to}</span> de{' '}
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

      {formModal.open && (
        <ProductFormModal
          product={formModal.product}
          autoTutorial={formModal.tutorial}
          onClose={closeForm}
        />
      )}
      {qrModal && <QrModal product={qrModal} onClose={() => setQrModal(null)} />}
      {detailModal && (
        <ProductDetailModal
          product={detailModal}
          onClose={() => setDetailModal(null)}
          onEdit={isManager ? (p) => { setDetailModal(null); openEdit(p) } : undefined}
          onShowQr={isManager ? (p) => { setDetailModal(null); setQrModal(p) } : undefined}
          onDeactivate={isManager ? (p) => { setDetailModal(null); handleRemove(p) } : undefined}
        />
      )}
      {removeModal && (
        <DeleteProductModal product={removeModal} onClose={() => setRemoveModal(null)} />
      )}
      {bulkDeleteOpen && <BulkDeleteModal onClose={() => setBulkDeleteOpen(false)} />}
    </div>
  )
}
