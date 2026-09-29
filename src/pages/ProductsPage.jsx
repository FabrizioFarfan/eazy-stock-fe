import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Package, Trash2, ChevronLeft, ChevronRight, Plus, SlidersHorizontal, HelpCircle, FileSpreadsheet, Download, X, EyeOff, Archive, ArrowRight, AlertTriangle, CalendarClock, CircleDollarSign, Truck, Boxes } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { useProducts, useReactivateProduct, useProductUnits } from '../hooks/useProducts'
import { getErrorMessage } from '../utils/handleApiError'
import { useSuppliers } from '../hooks/useSuppliers'
import { useBrands } from '../hooks/useBrands'
import { useCategories } from '../hooks/useCategories'
import { useLocations } from '../hooks/useLocations'
import ProductThumb from '../components/products/ProductThumb'
import { productsApi } from '../services/endpoints/products'
import { useDebounce } from '../hooks/useDebounce'
import ProductFormModal from '../components/products/ProductFormModal'
import ProductDetailModal from '../components/products/ProductDetailModal'
import BulkDeleteModal from '../components/products/BulkDeleteModal'
import DeleteProductModal from '../components/products/DeleteProductModal'
import DeletedProductsModal from '../components/products/DeletedProductsModal'
import QrModal from '../components/products/QrModal'
import ColumnFilter from '../components/common/ColumnFilter'
import ExpiryBadge from '../components/common/ExpiryBadge'
import UnitBadge from '../components/common/UnitBadge'
import AttributeChips from '../components/products/AttributeChips'
import { formatPrice } from '../utils/formatMoney'
import PageTitle from '../components/common/PageTitle'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'

// Estado inicial de los filtros por columna (embudo por encabezado).
const EMPTY_COL_FILTERS = {
  sku: '', name: '', providerCode: '', unit: '',
  categoryId: '', brandId: '', supplierId: '', locationId: '',
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
      {Array.from({ length: 14 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

function StockBadge({ current, min }) {
  const isLow = current < min   // en el mínimo exacto aún está OK (verde)
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
  const t = useT()
  return active ? (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
      {t('Activo')}
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
      {t('Inactivo')}
    </span>
  )
}

// ── Piezas del diseño (mismo lenguaje que el Dashboard) ───────────────────────

// Franja azul: cuánto catálogo tienes y qué parte pide atención. Cada cifra es
// un atajo al filtro correspondiente.
function CatalogHero({ total, counts, loading, onPick }) {
  const t = useT()
  const cells = [
    { key: 'low',      label: t('Stock bajo'),          n: counts.low },
    { key: 'expiring', label: t('Por vencer'),          n: counts.expiring },
    { key: 'variable', label: t('Sin precio definido'), n: counts.variable },
  ]
  return (
    <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-5 text-white shadow-md shadow-blue-600/30 sm:p-6" data-testid="catalog-hero">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />
      <Boxes className="pointer-events-none absolute right-5 top-5 h-10 w-10 text-white/25 sm:h-12 sm:w-12" />
      <p className="relative text-xs font-semibold uppercase tracking-widest text-white/80">{t('Tu catálogo')}</p>
      {loading ? (
        <div className="relative mt-2 h-10 w-32 animate-pulse rounded-lg bg-white/20" />
      ) : (
        <p className="relative mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight sm:text-5xl">{total}</span>
          <span className="text-sm font-medium text-white/80">{t('productos a la venta')}</span>
        </p>
      )}
      <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-white/20 pt-4">
        {cells.map(({ key, label, n }) => (
          <button key={key} type="button" onClick={() => onPick(key)}
            className="group min-w-0 rounded-xl px-2 py-1 -mx-2 text-left transition-colors hover:bg-white/10">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/70">{label}</p>
            <p className="flex items-center gap-1 text-lg font-bold">
              {loading || n == null ? '—' : n}
              {!!n && <ArrowRight size={13} className="text-white/60 transition-transform group-hover:translate-x-0.5" />}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

// Acceso grande: ícono + nombre + para qué sirve (igual que en el Dashboard).
function ActionTile({ icon: Icon, label, hint, onClick, to, primary, className = '' }) {
  const cls = `group flex items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
    primary
      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700'
      : 'border border-gray-100 bg-white shadow-sm hover:border-blue-200 hover:shadow-md'
  } ${className}`
  const body = (
    <>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
        primary ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${primary ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        <p className={`truncate text-xs ${primary ? 'text-white/80' : 'text-gray-400'}`}>{hint}</p>
      </div>
      <ArrowRight size={15} className={`hidden flex-shrink-0 transition-transform group-hover:translate-x-0.5 sm:block ${primary ? 'text-white/80' : 'text-gray-300'}`} />
    </>
  )
  return to
    ? <Link to={to} className={cls}>{body}</Link>
    : <button type="button" onClick={onClick} className={cls}>{body}</button>
}

// Atajo de filtro con su cuenta: se prende/apaga con un toque.
const SHORTCUT_TONES = {
  red:    'bg-red-50 text-red-600',
  amber:  'bg-amber-50 text-amber-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
  gray:   'bg-gray-100 text-gray-500',
}
function Shortcut({ icon: Icon, label, n, on, onClick, tone = 'gray', title }) {
  return (
    <button type="button" onClick={onClick} title={title} aria-pressed={on}
      className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all active:scale-[0.98] ${
        on
          ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/30'
          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-gray-50'
      }`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${on ? 'bg-white/20 text-white' : SHORTCUT_TONES[tone]}`}>
        <Icon size={13} />
      </span>
      {label}
      {n != null && (
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${on ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{n}</span>
      )}
    </button>
  )
}

// En el celular la tabla de 14 columnas no se lee: cada producto es una tarjeta
// con lo que importa al mostrador (nombre, atributos, precio y stock).
function ProductCardRow({ p, onOpen, showCost }) {
  const t = useT()
  return (
    <li>
      <button type="button" onClick={() => onOpen(p)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-blue-50/40 active:bg-blue-50/60">
        <ProductThumb product={p} size={48} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-gray-900">{p.name}</p>
          <p className="mt-0.5 truncate text-xs text-gray-400">
            <span className="font-mono">{p.sku}</span>
            {p.supplierName && <> · {p.supplierName}</>}
          </p>
          <div className="mt-1.5 empty:hidden"><AttributeChips attributes={p.attributes} empty={null} /></div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <UnitBadge unit={p.unit} />
            <ExpiryBadge product={p} />
            {!p.active && <StatusBadge active={false} />}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          {p.priceIsVariable ? (
            <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">{t('Variable')}</span>
          ) : (
            <span className="text-base font-bold text-gray-900">{formatPrice(p.salePrice)}</span>
          )}
          {showCost && <span className="text-[11px] text-gray-400">{t('Compra')} {formatPrice(p.purchasePrice)}</span>}
          <StockBadge current={p.currentStock} min={p.minStock} />
        </div>
      </button>
    </li>
  )
}

const PAGE_SIZE = 20
const canMutate = (u) => u?.role === 'OWNER' || (u?.role === 'SUPER_ADMIN' && !!u?.businessId)
// Un vendedor nunca ve el precio de compra (William, 15-sep): ni columna, ni filtro, ni ficha.
const hidesCost = (u) => u?.role === 'EMPLOYEE'

export default function ProductsPage() {
  const { user, seenTutorials, markTutorialSeen } = useAuth()
  const t = useT()
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
  // ?locationId= pre-activa el filtro de ubicación (link desde la página Ubicaciones)
  const [colFilters, setColFilters]     = useState(() => ({ ...EMPTY_COL_FILTERS, locationId: searchParams.get('locationId') ?? '' }))
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
  const { data: locationsData }  = useLocations({ size: 200, ...bizParam })
  const { data: unitsData }      = useProductUnits(bizParam)
  const supplierOpts  = (suppliersData?.content  ?? []).map((s) => ({ value: s.id, label: s.name }))
  const brandOpts     = (brandsData?.content     ?? []).map((b) => ({ value: b.id, label: b.name }))
  const categoryOpts  = (categoriesData?.content ?? []).map((c) => ({ value: c.id, label: c.name }))
  const locationOpts  = (locationsData?.content  ?? []).map((l) => ({ value: l.id, label: l.name }))
  const unitOpts      = (unitsData ?? []).map((u) => ({ value: u, label: u }))

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

  // "Ocultos" es el mismo filtro de la columna Estado, pero a la vista.
  const showHidden = colFilters.status === 'inactive'

  // Lo dispara el aviso de "producto oculto" para llevar acá de un click.
  useEffect(() => {
    const handler = () => setColFilters({ ...EMPTY_COL_FILTERS, status: 'inactive' })
    window.addEventListener('eazystock:show-hidden-products', handler)
    return () => window.removeEventListener('eazystock:show-hidden-products', handler)
  }, [])

  // Lo dispara el aviso de "producto borrado (conserva el historial)".
  useEffect(() => {
    const handler = () => setDeletedOpen(true)
    window.addEventListener('eazystock:show-deleted-products', handler)
    return () => window.removeEventListener('eazystock:show-deleted-products', handler)
  }, [])

  useEffect(() => { setPage(0) }, [debouncedSearch, lowStock, orphansOnly, variableOnly, sortBy, debouncedCol])

  const [formModal,   setFormModal]   = useState({ open: false, product: null, tutorial: false })
  const [qrModal,     setQrModal]     = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [removeModal, setRemoveModal] = useState(null)   // producto a ocultar/borrar
  const [deletedOpen, setDeletedOpen] = useState(false)  // la papelera («Borrados»)
  const reactivate = useReactivateProduct()

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
    ...(c.unit && { unit: c.unit }),
    ...(c.categoryId && { categoryId: c.categoryId }),
    ...(c.brandId && { brandId: c.brandId }),
    ...(c.locationId && { locationId: c.locationId }),
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

  // Cuentas para la franja y los atajos: consultas de una sola fila, solo
  // importa totalElements.
  const countBase = { page: 0, size: 1, ...bizParam }
  const { data: cActive }   = useProducts({ ...countBase, active: true })
  const { data: cLow }      = useProducts({ ...countBase, active: true, lowStock: true })
  const { data: cExpiring } = useProducts({ ...countBase, active: true, expiryStatus: 'expiring' })
  const { data: cVariable } = useProducts({ ...countBase, active: true, variablePriceOnly: true })
  const { data: cOrphans }  = useProducts({ ...countBase, active: true, placeholderOnly: true })
  const { data: cHidden }   = useProducts({ ...countBase, active: false })
  const counts = {
    active:   cActive?.totalElements,
    low:      cLow?.totalElements,
    expiring: cExpiring?.totalElements,
    variable: cVariable?.totalElements,
    orphans:  cOrphans?.totalElements,
    hidden:   cHidden?.totalElements,
  }

  // Atajos: un toque prende el filtro, otro lo apaga.
  const expiringOn = colFilters.expiryStatus === 'expiring'
  const pickShortcut = (key) => {
    if (key === 'low')      setLowStock((v) => !v)
    if (key === 'expiring') setField('expiryStatus', expiringOn ? '' : 'expiring')
    if (key === 'variable') setVariableOnly((v) => !v)
    if (key === 'orphans')  setOrphansOnly((v) => !v)
    if (key === 'hidden')   setField('status', showHidden ? 'active' : 'inactive')
  }
  // Desde la franja siempre PRENDE (y lleva a la tabla).
  const focusShortcut = (key) => {
    if (key === 'low')      setLowStock(true)
    if (key === 'expiring') setField('expiryStatus', 'expiring')
    if (key === 'variable') setVariableOnly(true)
    document.getElementById('products-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const anyShortcut = lowStock || expiringOn || variableOnly || orphansOnly || showHidden
  const clearShortcuts = () => {
    setLowStock(false); setVariableOnly(false); setOrphansOnly(false)
    setColFilters((f) => ({ ...f, expiryStatus: '', status: 'active' }))
  }

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
  if (colFilters.name)         activeChips.push({ label: `${t('Nombre')}: "${colFilters.name}"`, onRemove: () => clearFields('name') })
  if (colFilters.sku)          activeChips.push({ label: `${t('Código')}: "${colFilters.sku}"`, onRemove: () => clearFields('sku') })
  if (colFilters.unit)         activeChips.push({ label: `${t('Unidad')}: ${colFilters.unit}`, onRemove: () => clearFields('unit') })
  if (colFilters.categoryId)   activeChips.push({ label: `${t('Categoría')}: ${labelOf(categoryOpts, colFilters.categoryId)}`, onRemove: () => clearFields('categoryId') })
  if (colFilters.brandId)      activeChips.push({ label: `${t('Marca')}: ${labelOf(brandOpts, colFilters.brandId)}`, onRemove: () => clearFields('brandId') })
  if (colFilters.locationId)   activeChips.push({ label: `${t('Ubicación')}: ${labelOf(locationOpts, colFilters.locationId)}`, onRemove: () => clearFields('locationId') })
  if (colFilters.supplierId)   activeChips.push({ label: `${t('Proveedor')}: ${labelOf(supplierOpts, colFilters.supplierId)}`, onRemove: () => clearFields('supplierId') })
  if (colFilters.providerCode) activeChips.push({ label: `${t('Cód. prov.')}: "${colFilters.providerCode}"`, onRemove: () => clearFields('providerCode') })
  if (!hidesCost(user) && (colFilters.purchaseMin !== '' || colFilters.purchaseMax !== ''))
    activeChips.push({ label: rangeChip(colFilters.purchaseMin, colFilters.purchaseMax, t('P. compra'), true), onRemove: () => clearFields('purchaseMin', 'purchaseMax') })
  if (colFilters.saleMin !== '' || colFilters.saleMax !== '')
    activeChips.push({ label: rangeChip(colFilters.saleMin, colFilters.saleMax, t('P. venta'), true), onRemove: () => clearFields('saleMin', 'saleMax') })
  if (colFilters.stockMin !== '' || colFilters.stockMax !== '')
    activeChips.push({ label: rangeChip(colFilters.stockMin, colFilters.stockMax, t('Stock'), false), onRemove: () => clearFields('stockMin', 'stockMax') })
  if (colFilters.status !== 'active')
    activeChips.push({ label: `${t('Estado')}: ${colFilters.status === 'inactive' ? t('Inactivos') : t('Todos')}`, onRemove: () => clearFields('status') })
  if (colFilters.expiryStatus)
    activeChips.push({ label: `${t('Vencimiento')}: ${t(EXPIRY_OPTS.find((o) => o.value === colFilters.expiryStatus)?.label)}`, onRemove: () => clearFields('expiryStatus') })

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

  const handleReactivate = async (p) => {
    try {
      await reactivate.mutateAsync(p.id)
      setDetailModal(null)
      toast.success(t('"{name}" volvió al catálogo con su código {sku}.', { name: p.name, sku: p.sku }))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const filtering  = anyShortcut || activeChips.length > 0
  const emptyState = (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        {showHidden
          ? <EyeOff size={28} className="text-gray-400" />
          : <Package size={28} className="text-gray-400" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">
          {showHidden ? t('No hay productos ocultos')
            : filtering ? t('Ningún producto con estos filtros') : t('No hay productos aún')}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {search ? t('Sin resultados para "{q}"', { q: search })
            : filtering ? t('Quita un filtro para ver más')
            : showHidden ? t('Todo tu catálogo está visible')
            : t('Agrega tu primer producto para empezar')}
        </p>
      </div>
      {filtering && !showHidden && (
        <button type="button" onClick={() => { clearShortcuts(); setColFilters(EMPTY_COL_FILTERS) }}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          {t('Ver todos')}
        </button>
      )}
      {isManager && !search && !showHidden && !filtering && (
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
        >
          <Plus size={14} />
          {t('Crear primer producto')}
        </button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Header — flex-wrap para que en móvil los botones bajen de fila en
          vez de desbordar; las etiquetas largas se acortan en pantalla chica */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PageTitle icon={Package} tone="cyan">{t('Productos')}</PageTitle>
          <HelpDrawer title={t('Cómo usar Productos')} buttonLabel={t('¿Cómo funciona?')} autoOpenKey="eazystock_products_help_v2">
            <p>{hidesCost(user) ? t('Este es el catálogo: todo lo que se vende vive acá, con su precio de venta y stock.') : t('Este es tu catálogo: todo lo que vendes vive acá, con su precio de compra, precio de venta y stock.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">➕ {t('Agregar productos')}</p>
              <p className="mt-1">{t('Con "Nuevo producto" los cargas uno por uno, o usa "Importar" para subir todo tu inventario desde un Excel de una sola vez.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🔢 {t('Código automático y códigos liberados')}</p>
              <p className="mt-1">{t('Al dar de alta, si dejas el código vacío el sistema sigue tu numeración solo (F2963 → F2964). Si borraste productos que nunca se usaron, sus códigos quedan LIBRES y el formulario te los sugiere para tapar el hueco; los códigos que ya circularon (RETIRADOS) se respetan y nunca se renumeran.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">✏️ {t('SKU editable')}</p>
              <p className="mt-1">{t('El código del producto se puede escribir a mano al crearlo o corregir al editarlo. Debe ser único en tu negocio: si ya existe, la app te avisa.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📦 {t('Presentación y unidad de venta')}</p>
              <p className="mt-1">{t('¿Tienes el mismo producto en varias medidas (por ejemplo una armella de 1/4", 1/2" y 1")? No metas la medida en el nombre: ponla como atributo al editar el producto (Medida → 1/2"). El nombre queda corto y la columna "Atributos" te muestra de un vistazo cuál es cuál. Y si un nombre se corta, pasa el mouse por la fila para leerlo entero.')}</p>
              <p className="mt-1">{t('La unidad (unidad, metro, kilo, litro, paquete, gramo…) es cómo lo vendes y se ve como etiqueta en la tabla; puedes filtrar por ella desde la columna "Unidad". La presentación ("Saco de 25 kg", "Caja de 100") es solo informativa y no afecta cómo se vende.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🔔 {t('Stock mínimo')}</p>
              <p className="mt-1">{t('Si le pones un mínimo a un producto, la app te avisa sola cuando está por agotarse (campanita y reporte "Stock bajo"). Desde ese reporte también generas el PDF de pedido al proveedor.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📅 {t('Fecha de vencimiento')}</p>
              <p className="mt-1">{t('Opcional, para productos que caducan. La columna "Vence" muestra una etiqueta: ámbar cuando faltan 30 días o menos ("Por vencer"), roja cuando ya venció. Puedes filtrar por "Por vencer", "Vencidos" o "Con fecha", y en Reportes tienes el listado "Por vencer" completo. También se importa desde Excel.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🔽 {t('Filtros embudo por columna')}</p>
              <p className="mt-1">{t('Como en Excel: haz clic en el embudo de cualquier encabezado para filtrar por texto, elegir una opción o poner un rango (precios, stock) y ordenar. Los filtros activos aparecen como chips arriba de la tabla; "Limpiar todo" los quita de golpe.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📌 {t('Cabecera fija')}</p>
              <p className="mt-1">{t('Al bajar por listas largas la fila de encabezados se queda pegada arriba, así siempre sabes qué columna estás mirando.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">👆 {t('Click en cualquier fila')}</p>
              <p className="mt-1">{t('Se abre el detalle del producto: desde ahí puedes editarlo, ver su código QR o de barras, registrar entradas de stock, ocultarlo o borrarlo.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🏷️ {t('QR y código de barras')}</p>
              <p className="mt-1">{t('Cada producto tiene un QR del sistema y un código de barras (Code 128) descargables para etiquetar. Si el empaque trae su propio EAN de fábrica, guárdalo en "Código de barras": el escáner (cámara o pistola) lo reconoce al vender y al recibir mercadería.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🙈 {t('Ocultar o borrar un producto')}</p>
              <p className="mt-1">{t('Ocultar es para lo que VA A VOLVER (de temporada, el proveedor lo repone): deja de verse y venderse, conserva todo y su código queda reservado; lo ves en "Ocultos" y lo reactivas cuando vuelva. Borrar es para lo que NO vuelve. Si nunca se usó, "Borrar definitivamente" lo elimina y libera su código. Si tiene ventas o recepciones, "Borrar del catálogo (conserva el historial)" lo saca de todas las listas, deja su stock en 0 con un ajuste anotado, retira su código y guarda una copia en "Borrados", desde donde se puede restaurar; sus ventas y recepciones no se tocan. Solo el dueño borra, y para confirmar hay que escribir el nombre del producto.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📥 {t('Importar y exportar')}</p>
              <p className="mt-1">{t('"Importar" sube tu inventario desde Excel/CSV con mapeo de columnas, vista previa y un historial de imports para saber qué se subió, cuándo y con qué resultado. "Exportar" baja el catálogo a un archivo re-importable. "Borrar en masa" deshace un import por fecha de creación.')}</p>
            </div>
            <p className="text-xs text-gray-400">{t('Tip: usa el buscador o escanea el código del producto para encontrarlo al instante.')}</p>
          </HelpDrawer>
        </div>
        {isManager && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('eazystock:show-product-tutorial'))}
              title={t('Ver tutorial: cómo agregar un producto')}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              <HelpCircle size={14} />
              {t('Tutorial')}
            </button>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              title={t('Borrar productos en masa por fecha de creación (ej. deshacer un import)')}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <Trash2 size={14} />
              {t('Borrar')}<span className="hidden md:inline"> {t('en masa')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Franja del catálogo + accesos grandes (mismo lenguaje que el Dashboard) */}
      <div className={`grid grid-cols-1 gap-4 ${isManager ? 'lg:grid-cols-3' : ''}`}>
        <div className={isManager ? 'lg:col-span-2' : ''}>
          <CatalogHero total={counts.active ?? 0} counts={counts} loading={counts.active == null} onPick={focusShortcut} />
        </div>
        {isManager && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <ActionTile icon={Plus} label={t('Nuevo producto')} hint={t('Cárgalo en un minuto')} onClick={openCreate} primary className="col-span-2 lg:col-span-1" />
            <ActionTile icon={FileSpreadsheet} label={t('Importar')} hint={t('Todo tu inventario desde Excel')} to="/products/import" />
            <ActionTile icon={Download} label={t('Exportar')} hint={t('Tu catálogo a Excel')} to="/products/export" />
          </div>
        )}
      </div>

      {/* Buscador grande + atajos con su cuenta */}
      <div id="products-list" className="scroll-mt-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('Buscar por nombre, SKU o código de proveedor...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-3 pl-11 pr-10 text-base text-gray-900 outline-none transition-colors focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} title={t('Limpiar')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
              <X size={15} />
            </button>
          )}
        </div>

        {/* En el celular los atajos se deslizan de lado en vez de apilarse */}
        <div className="-mx-3 mt-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:flex-wrap sm:overflow-visible sm:px-4 sm:pb-0">
          <Shortcut icon={AlertTriangle} tone="red" label={t('Stock bajo')} n={counts.low}
            on={lowStock} onClick={() => pickShortcut('low')} />
          <Shortcut icon={CalendarClock} tone="amber" label={t('Por vencer')} n={counts.expiring}
            on={expiringOn} onClick={() => pickShortcut('expiring')} />
          <Shortcut icon={CircleDollarSign} tone="orange" label={t('Sin precio definido')} n={counts.variable}
            on={variableOnly} onClick={() => pickShortcut('variable')}
            title={t('Productos con precio variable: el precio se pide al momento de vender. Edítalos para ponerles un precio fijo.')} />
          {(!!counts.orphans || orphansOnly) && (
            <Shortcut icon={Truck} tone="purple" label={t('Sin proveedor real')} n={counts.orphans}
              on={orphansOnly} onClick={() => pickShortcut('orphans')}
              title={t("Productos vinculados al placeholder 'Sin proveedor asignado' — data legacy a reasignar")} />
          )}
          {/* Los ocultos no se ven en el catálogo: sin este atajo el único acceso
              era el embudo de la última columna, que casi nadie encontraba. */}
          <Shortcut icon={EyeOff} label={t('Ocultos')} n={counts.hidden}
            on={showHidden} onClick={() => pickShortcut('hidden')}
            title={t('Los productos ocultos (desactivados) no aparecen en el catálogo ni al vender. Márcalo para verlos, reactivarlos o borrarlos definitivamente.')} />
          {/* La papelera: lo borrado conservando el historial. Vive aparte de
              Ocultos a propósito — los ocultos VAN A VOLVER, los borrados no. */}
          {isManager && (
            <Shortcut icon={Archive} label={t('Borrados')} on={false} onClick={() => setDeletedOpen(true)}
              title={t('Productos borrados conservando su historial (ventas y recepciones intactas). Desde aquí se pueden restaurar.')} />
          )}
          {anyShortcut && (
            <button type="button" onClick={clearShortcuts}
              className="flex-shrink-0 px-2 text-xs font-semibold text-gray-500 hover:text-red-600">
              {t('Ver todos')}
            </button>
          )}
          <span className="ml-auto hidden flex-shrink-0 text-xs text-gray-400 lg:inline">
            {t('Filtra y ordena desde el')} <SlidersHorizontal size={11} className="inline -mt-0.5" /> {t('de cada columna')}
          </span>
        </div>
      </div>

      {/* Chips de filtros de columna activos */}
      {activeChips.length > 0 && (
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          {activeChips.map((chip, i) => (
            <span key={i}
              className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
              {chip.label}
              <button onClick={chip.onRemove}
                title={t('Quitar filtro')}
                className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setColFilters(EMPTY_COL_FILTERS)}
            className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            {t('Limpiar todo')}
          </button>
        </div>
      )}

      {/* Listado: tabla en PC, tarjetas en el celular */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 sm:px-5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <Package size={15} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">
            {showHidden ? t('Productos ocultos') : t('Listado')}
          </h3>
          {!isLoading && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">{totalElements}</span>
          )}
          {isFetching && !isLoading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-label={t('Cargando…')} />
          )}
          <span className="ml-auto hidden text-xs text-gray-400 sm:inline">{t('Toca un producto para ver su ficha')}</span>
        </div>

        {/* Celular */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div>
          ) : products.length === 0 ? (
            emptyState
          ) : (
            <ul className={`divide-y divide-gray-100 ${isFetching ? 'opacity-60' : ''}`}>
              {products.map((p) => (
                <ProductCardRow key={p.id} p={p} onOpen={setDetailModal} showCost={!hidesCost(user)} />
              ))}
            </ul>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <ColumnFilter label={t('Nombre')} type="text" align="left"
                  value={colFilters.name} onChange={(v) => setField('name', v)}
                  placeholder={t('Buscar nombre...')} active={!!colFilters.name}
                  sortState={sortStateFor('name')} onSort={onSortBy('name')} ascLabel="A–Z" descLabel="Z–A"
                  onClear={() => clearFields('name')} />
                <ColumnFilter label={t('Proveedor')} type="select" align="left"
                  value={colFilters.supplierId} onChange={(v) => setField('supplierId', v)}
                  options={supplierOpts} active={!!colFilters.supplierId}
                  onClear={() => clearFields('supplierId')} />
                <ColumnFilter label={t('Cód. proveedor')} type="text" align="left"
                  value={colFilters.providerCode} onChange={(v) => setField('providerCode', v)}
                  placeholder={t('Buscar código...')} active={!!colFilters.providerCode}
                  onClear={() => clearFields('providerCode')} />
                {!hidesCost(user) && (
                <ColumnFilter label={t('P. Compra')} type="range" align="right"
                  rangeMin={colFilters.purchaseMin} rangeMax={colFilters.purchaseMax}
                  onRangeChange={setRange('purchaseMin', 'purchaseMax')}
                  active={colFilters.purchaseMin !== '' || colFilters.purchaseMax !== ''}
                  sortState={sortStateFor('purchasePrice')} onSort={onSortBy('purchasePrice')}
                  ascLabel={t('Menor')} descLabel={t('Mayor')}
                  onClear={() => clearFields('purchaseMin', 'purchaseMax')} />
                )}
                <ColumnFilter label={t('P. Venta')} type="range" align="right"
                  rangeMin={colFilters.saleMin} rangeMax={colFilters.saleMax}
                  onRangeChange={setRange('saleMin', 'saleMax')}
                  active={colFilters.saleMin !== '' || colFilters.saleMax !== ''}
                  sortState={sortStateFor('salePrice')} onSort={onSortBy('salePrice')}
                  ascLabel={t('Menor')} descLabel={t('Mayor')}
                  onClear={() => clearFields('saleMin', 'saleMax')} />
                <ColumnFilter label={t('Stock')} type="range" align="center"
                  rangeMin={colFilters.stockMin} rangeMax={colFilters.stockMax}
                  onRangeChange={setRange('stockMin', 'stockMax')}
                  active={colFilters.stockMin !== '' || colFilters.stockMax !== ''}
                  sortState={sortStateFor('currentStock')} onSort={onSortBy('currentStock')}
                  ascLabel={t('Menor')} descLabel={t('Mayor')}
                  onClear={() => clearFields('stockMin', 'stockMax')} />
                <ColumnFilter label={t('Código')} type="text" align="left"
                  value={colFilters.sku} onChange={(v) => setField('sku', v)}
                  placeholder={t('Buscar código...')} active={!!colFilters.sku}
                  sortState={sortStateFor('sku')} onSort={onSortBy('sku')} ascLabel="A–Z" descLabel="Z–A"
                  onClear={() => clearFields('sku')} />
                {/* Atributos (medida, color, material…): distinguen productos de mismo nombre */}
                <th className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Atributos')}</th>
                <ColumnFilter label={t('Unidad')} type="select" align="left"
                  value={colFilters.unit} onChange={(v) => setField('unit', v)}
                  options={unitOpts} active={!!colFilters.unit}
                  onClear={() => clearFields('unit')} />
                <ColumnFilter label={t('Categoría')} type="select" align="left"
                  value={colFilters.categoryId} onChange={(v) => setField('categoryId', v)}
                  options={categoryOpts} active={!!colFilters.categoryId}
                  onClear={() => clearFields('categoryId')} />
                <ColumnFilter label={t('Marca')} type="select" align="left"
                  value={colFilters.brandId} onChange={(v) => setField('brandId', v)}
                  options={brandOpts} active={!!colFilters.brandId}
                  onClear={() => clearFields('brandId')} />
                <ColumnFilter label={t('Ubicación')} type="select" align="left"
                  value={colFilters.locationId} onChange={(v) => setField('locationId', v)}
                  options={locationOpts} active={!!colFilters.locationId}
                  onClear={() => clearFields('locationId')} />
                <ColumnFilter label={t('Vence')} type="select" align="center"
                  value={colFilters.expiryStatus} onChange={(v) => setField('expiryStatus', v)}
                  options={EXPIRY_OPTS.map((o) => ({ ...o, label: t(o.label) }))} active={!!colFilters.expiryStatus}
                  onClear={() => clearFields('expiryStatus')} />
                <ColumnFilter label={t('Estado')} type="select" align="center"
                  value={colFilters.status} onChange={(v) => setField('status', v)}
                  options={[{ value: 'active', label: t('Activos') }, { value: 'inactive', label: t('Inactivos') }]}
                  active={colFilters.status !== 'active'}
                  onClear={() => clearFields('status')} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={14}>
                    {emptyState}
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}
                    onClick={() => setDetailModal(p)}
                    title={`${p.name}${p.presentation ? ` · ${p.presentation}` : ''}\n${t('Click para ver detalles y opciones del producto')}`}
                    className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40 ${isFetching ? 'opacity-60' : ''}`}>
                    <td className="min-w-[260px] max-w-[320px] px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <ProductThumb product={p} size={34} />
                        <div className="min-w-0">
                          <p className="line-clamp-2 break-words font-semibold leading-snug text-gray-900">{p.name}</p>
                          {p.presentation && (
                            <p className="text-xs text-gray-400 truncate">{p.presentation}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[120px] truncate px-5 py-3.5 text-gray-500">{p.supplierName || '—'}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{p.providerCode || '—'}</td>
                    {!hidesCost(user) && <td className="px-5 py-3.5 text-right text-gray-600">{formatPrice(p.purchasePrice)}</td>}
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      {p.priceIsVariable ? (
                        <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                          {t('Variable')}
                        </span>
                      ) : (
                        formatPrice(p.salePrice)
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center"><StockBadge current={p.currentStock} min={p.minStock} /></td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{p.sku}</td>
                    <td className="min-w-[170px] max-w-[260px] px-5 py-3.5"><AttributeChips attributes={p.attributes} /></td>
                    <td className="px-5 py-3.5"><UnitBadge unit={p.unit} /></td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{p.categoryName || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{p.brandName || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{p.locationName || '—'}</td>
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
              <span className="font-semibold text-gray-700">{from}–{to}</span> {t('de')}{' '}
              <span className="font-semibold text-gray-700">{totalElements}</span> {t('productos')}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} />{t('Anterior')}
              </button>
              <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                {t('Siguiente')}<ChevronRight size={14} />
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
          // «Ya tienes este producto» → salta a editar el existente en vez de duplicar
          onEditExisting={(p) => setFormModal({ open: true, product: p, tutorial: false })}
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
          onReactivate={isManager ? handleReactivate : undefined}
          onMerged={isManager ? (updated) => setDetailModal(updated) : undefined}
        />
      )}
      {removeModal && (
        <DeleteProductModal product={removeModal} onClose={() => setRemoveModal(null)} />
      )}
      {bulkDeleteOpen && <BulkDeleteModal onClose={() => setBulkDeleteOpen(false)} />}
      {deletedOpen && (
        <DeletedProductsModal
          onClose={() => setDeletedOpen(false)}
          canRestore={isManager}
          businessId={user?.role === 'SUPER_ADMIN' ? user?.businessId : undefined}
        />
      )}
    </div>
  )
}
