import { useState, useCallback, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Package, Trash2, ChevronLeft, ChevronRight, Plus, SlidersHorizontal, HelpCircle, FileSpreadsheet, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProducts, useDeactivateProduct } from '../hooks/useProducts'
import { productsApi } from '../services/endpoints/products'
import { useDebounce } from '../hooks/useDebounce'
import ProductFormModal from '../components/products/ProductFormModal'
import ProductDetailModal from '../components/products/ProductDetailModal'
import BulkDeleteModal from '../components/products/BulkDeleteModal'
import QrModal from '../components/products/QrModal'
import { formatPrice } from '../utils/formatMoney'
import PageTitle from '../components/common/PageTitle'
import HelpDrawer from '../components/common/HelpDrawer'

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 10 }).map((_, i) => (
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
  const [statusFilter, setStatusFilter] = useState('active')
  const [orphansOnly, setOrphansOnly]   = useState(false)
  const [variableOnly, setVariableOnly] = useState(searchParams.get('variablePrice') === '1')
  const [sortBy, setSortBy]             = useState('name,asc')
  const [page, setPage]                 = useState(0)
  const debouncedSearch                 = useDebounce(search, 400)

  useEffect(() => { setPage(0) }, [debouncedSearch, lowStock, statusFilter, orphansOnly, variableOnly, sortBy])

  const [formModal,   setFormModal]   = useState({ open: false, product: null, tutorial: false })
  const [qrModal,     setQrModal]     = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const params = {
    page, size: PAGE_SIZE,
    sort: sortBy,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(lowStock && { lowStock: true }),
    ...(statusFilter !== 'all' && { active: statusFilter === 'active' }),
    ...(orphansOnly && { placeholderOnly: true }),
    ...(variableOnly && { variablePriceOnly: true }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }

  const { data, isLoading, isFetching } = useProducts(params)
  const deactivate = useDeactivateProduct()

  const products      = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const from          = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const to            = Math.min((page + 1) * PAGE_SIZE, totalElements)

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

  const handleDeactivate = useCallback((p) => {
    if (!window.confirm(`¿Desactivar "${p.name}"?`)) return
    deactivate.mutate(p.id)
  }, [deactivate])

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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white"
        >
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="all">Todos</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          title="Ordenar los productos"
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white"
        >
          <option value="name,asc">Nombre (A–Z)</option>
          <option value="salePrice,desc">Precio: mayor a menor</option>
          <option value="salePrice,asc">Precio: menor a mayor</option>
          <option value="currentStock,desc">Stock: mayor a menor</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Código</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Nombre</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Categoría</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Marca</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Proveedor</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Cód. proveedor</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">P. Compra</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">P. Venta</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Stock</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10}>
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
          onDeactivate={isManager ? (p) => { setDetailModal(null); handleDeactivate(p) } : undefined}
        />
      )}
      {bulkDeleteOpen && <BulkDeleteModal onClose={() => setBulkDeleteOpen(false)} />}
    </div>
  )
}
