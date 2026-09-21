import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, ClipboardList, Lightbulb, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { useMovements, useSalesSummary, useProductTotals } from '../../hooks/useStock'
import { productsApi } from '../../services/endpoints/products'
import { lastMonthsRange, quickRange } from '../../utils/dateRanges'
import ProductFilterPicker from './ProductFilterPicker'
import { useSuppliers } from '../../hooks/useSuppliers'
import { formatAmount, formatPrice } from '../../utils/formatMoney'
import { useT, dateLocale } from '../../i18n'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

const TYPE_CONFIG = {
  PURCHASE_ENTRY: { label: 'Entrada',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  SALE:           { label: 'Venta',      cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  ADJUSTMENT:     { label: 'Ajuste',     cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  RETURN:         { label: 'Devolución', cls: 'bg-purple-50 text-purple-700 ring-1 ring-purple-100' },
}

function QuantityCell({ type, quantity, stockAfter }) {
  const t = useT()
  const isPositive = type === 'PURCHASE_ENTRY' || type === 'RETURN' || (type === 'ADJUSTMENT' && quantity > 0)
  const isNegative = type === 'SALE'           || (type === 'ADJUSTMENT' && quantity < 0)
  const cls = isPositive ? 'font-bold text-emerald-600'
            : isNegative ? 'font-bold text-red-500'
            : 'font-medium text-gray-700'
  const sign = isPositive ? '+' : type === 'SALE' ? '-' : ''
  return (
    <span className={`whitespace-nowrap ${cls}`}>
      {sign}{Math.abs(quantity)}
      {stockAfter != null && (
        // Idea de William: el stock que QUEDÓ del producto tras este movimiento
        <span className="ml-1 text-xs font-normal text-gray-500" title={t('Stock del producto tras este movimiento')}>
          ({fmtQty(stockAfter)})
        </span>
      )}
    </span>
  )
}

function SkeletonRow({ cols = 8 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

/** 5.000 → "5", 1.300 → "1.3" — cantidades sin ceros decimales sobrantes. */
function fmtQty(q) {
  if (q == null) return '0'
  return String(parseFloat(q))
}

function rangeLabel(t, from, to) {
  const fmt = (d) => new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'long' }).format(new Date(`${d}T12:00:00`))
  if (from && to) return from === to ? t('del {from}', { from: fmt(from) }) : t('del {from} al {to}', { from: fmt(from), to: fmt(to) })
  if (from) return t('desde el {from}', { from: fmt(from) })
  if (to)   return t('hasta el {to}', { to: fmt(to) })
  return null
}

const thCls = 'px-4 py-3.5 text-xs font-semibold uppercase tracking-widest text-gray-400'

/**
 * Modal con las ventas una por una de UN producto del resumen, respetando el
 * rango de fechas activo. El detalle vive aquí para que el resumen sea la
 * única tabla en pantalla (decisión de Frank: nunca dos tablas a la vez).
 */
function ProductSalesModal({ row, from, to, onClose }) {
  const t = useT()
  const range = rangeLabel(t, from, to)
  const { data, isLoading } = useMovements({
    type: 'SALE', productId: row.productId, size: 100,
    ...(from && { from }), ...(to && { to }),
  })
  const sales = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4" onMouseDown={onClose}>
      <div className="flex max-h-[88dvh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <ClipboardList size={20} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-gray-900">{row.productName}</h3>
              <p className="text-xs text-gray-500">
                {t('Ventas una por una')} {range ?? t('· todo el historial')}
                {row.providerCode && <> · {t('cód. proveedor')} <span className="font-mono font-semibold text-gray-700">{row.providerCode}</span></>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors" aria-label={t('Cerrar')}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                <th className={`${thCls} text-left whitespace-nowrap`}>{t('Fecha')}</th>
                <th className={`${thCls} text-center`}>{t('Cantidad')}</th>
                <th className={`${thCls} text-left`}>{t('Vendedor')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
              ) : sales.length === 0 ? (
                <tr><td colSpan={3} className="py-12 text-center text-sm font-medium text-gray-400">{t('No hay ventas en este período')}</td></tr>
              ) : (
                sales.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap font-bold text-red-500">
                      -{fmtQty(m.quantity)}
                      {m.stockAfter != null && (
                        <span className="ml-1 text-xs font-normal text-gray-500" title={t('Stock del producto tras esta venta')}>
                          ({fmtQty(m.stockAfter)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{m.createdByName ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalElements > 100 && (
            <p className="px-5 py-2 text-center text-xs text-gray-400">{t('Mostrando las 100 ventas más recientes de {n}', { n: totalElements })}</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
          <p className="text-sm text-gray-500">
            {t('Total vendido:')} <span className="font-bold text-blue-600">{fmtQty(row.totalSold)}</span>
          </p>
          <p className="text-sm text-gray-500">
            {t('Stock actual:')} <span className="font-bold text-gray-900">{fmtQty(row.currentStock)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * El resumen de reposición ES la tabla cuando se filtra por Ventas (nunca dos
 * tablas a la vez). El total lo suma el servidor sobre todo el rango filtrado,
 * no solo la página visible. Click en una fila → modal con el detalle.
 */
function ReplenishmentSummary({ rows, isLoading, from, to, onRowClick }) {
  const t = useT()
  const range = rangeLabel(t, from, to)
  const list = rows ?? []
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-gray-100 px-5 py-3.5">
        <ClipboardList size={16} className="flex-shrink-0 text-blue-600" />
        <h3 className="text-sm font-bold text-gray-900">{t('Resumen de reposición')}</h3>
        <p className="text-xs text-gray-500">
          {range ? (
            <>{t('Ventas')} <span className="font-semibold text-gray-700">{range}</span> {t('sumadas por producto — la lista para armar tu pedido.')}</>
          ) : (
            <>{t('Todas tus ventas sumadas por producto — elige fechas arriba para armar el pedido de la semana.')}</>
          )}
          {' '}<span className="text-gray-400">{t('Click en un producto para ver sus ventas una por una.')}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className={`${thCls} text-left whitespace-nowrap`}>{t('Cód. proveedor')}</th>
              <th className={`${thCls} text-left`}>{t('Producto')}</th>
              <th className={`${thCls} text-left`}>{t('Proveedor')}</th>
              <th className={`${thCls} text-center`}>{t('Vendido')}</th>
              <th className={`${thCls} text-center whitespace-nowrap`}>{t('Stock actual')}</th>
              <th className={`${thCls} w-10`}><span className="sr-only">{t('Detalle')}</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm font-medium text-gray-400">
                  {t('No hay ventas en este período')}
                </td>
              </tr>
            ) : (
              list.map((r) => {
                const low = parseFloat(r.currentStock ?? 0) <= parseFloat(r.minStock ?? 0)
                return (
                  <tr key={r.productId} onClick={() => onRowClick(r)} title={t('Ver ventas una por una')}
                    className="cursor-pointer border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">{r.providerCode ?? '—'}</td>
                    <td className="max-w-[220px] truncate px-4 py-3.5 font-semibold text-gray-900">{r.productName}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{r.supplierName ?? '—'}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-blue-600">{fmtQty(r.totalSold)}</td>
                    <td className={`px-4 py-3.5 text-center ${low ? 'font-bold text-red-500' : 'font-medium text-gray-700'}`}>
                      {fmtQty(r.currentStock)}
                    </td>
                    <td className="px-2 py-3.5 text-gray-400"><ChevronRight size={15} /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const PAGE_SIZE = 20

// Períodos de un toque (pedido de William: «los 2 o 3 últimos meses» o «desde
// que entró el producto» sin pelearse con los calendarios).
const PERIODS = [
  { key: 'all', label: 'Todo el historial', range: () => ({ from: '', to: '' }) },
  { key: 'm1',  label: 'Último mes',        range: () => lastMonthsRange(1) },
  { key: 'm3',  label: 'Últimos 3 meses',   range: () => lastMonthsRange(3) },
  { key: 'm6',  label: 'Últimos 6 meses',   range: () => lastMonthsRange(6) },
  { key: 'year', label: 'Este año',         range: () => quickRange('year') },
]

/**
 * Cabecera del historial de UN producto: stock de hoy + cuánto entró, se
 * vendió, se devolvió y se ajustó en el período (suma el servidor sobre todo
 * el rango, no sobre la página visible).
 */
function ProductHistoryHeader({ product, from, to }) {
  const t = useT()
  const range = rangeLabel(t, from, to)
  const { data: totals } = useProductTotals(product.id, {
    ...(from && { from }), ...(to && { to }),
  })
  const byType = Object.fromEntries((totals ?? []).map((r) => [r.type, r]))
  const qty = (type) => parseFloat(byType[type]?.quantity ?? 0)
  const adj = qty('ADJUSTMENT')
  const cells = [
    { label: 'Entró',      value: `+${fmtQty(qty('PURCHASE_ENTRY'))}`, cls: 'text-emerald-600' },
    { label: 'Se vendió',  value: `-${fmtQty(qty('SALE'))}`,           cls: 'text-red-500' },
    { label: 'Devuelto',   value: `+${fmtQty(qty('RETURN'))}`,         cls: 'text-purple-600' },
    { label: 'Ajustes',    value: `${adj > 0 ? '+' : ''}${fmtQty(adj)}`, cls: 'text-amber-600' },
  ]
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 px-4 py-3.5 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{t('Historial del producto')}</p>
          <h3 className="truncate text-base font-bold text-gray-900">
            {product.name} {product.sku && <span className="ml-1 font-mono text-xs font-normal text-gray-500">{product.sku}</span>}
          </h3>
        </div>
        {product.currentStock != null && (
          <p className="text-sm text-gray-500">
            {t('Stock actual:')} <span className="text-base font-bold text-gray-900">{fmtQty(product.currentStock)}</span>
            {product.unit && <span className="ml-1 text-xs text-gray-500">{product.unit}</span>}
          </p>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-100 bg-white px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t(c.label)}</p>
            <p className={`text-lg font-bold ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {range ? t('Totales {range}.', { range }) : t('Totales desde que el producto entró a tu catálogo.')}
      </p>
    </div>
  )
}

/**
 * `productId` vive en la URL (?product=) para que la ficha del producto pueda
 * traer hasta acá con el filtro puesto; `productHint` es el producto ya cargado
 * (viene de la ficha o del buscador) y evita pedirlo de nuevo.
 */
export default function MovementsTab({ productId = null, productHint = null, onProductChange = () => {} }) {
  const t = useT()
  const { user } = useAuth()
  const [typeFilter, setTypeFilter]   = useState('')
  const [supplierId, setSupplierId]   = useState('')
  const [from, setFrom]               = useState('')
  const [to, setTo]                   = useState('')
  const [page, setPage]               = useState(0)
  const [detailRow, setDetailRow]     = useState(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(0) }, [typeFilter, supplierId, from, to, productId])

  const hint = productHint?.id === productId ? productHint : null
  const { data: fetchedProduct } = useQuery({
    queryKey: ['products', 'by-id', productId],
    queryFn: () => productsApi.getById(productId).then((r) => r.data.data),
    enabled: !!productId && !hint,
    retry: false,
  })

  const { data: suppliersData } = useSuppliers({ size: 200 })
  const suppliers = suppliersData?.content ?? []

  // Con un producto elegido siempre se ve SU historial, también si filtra Ventas:
  // el resumen de reposición es la vista de TODOS los productos.
  const isSalesFilter = typeFilter === 'SALE' && !productId

  const params = {
    page, size: PAGE_SIZE,
    ...(typeFilter && { type: typeFilter }),
    ...(supplierId && { supplierId }),
    ...(productId && { productId }),
    ...(from && { from }),
    ...(to   && { to   }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }
  // Con el filtro Ventas la tabla visible es el resumen — el historial no se pide.
  const { data, isLoading, isFetching } = useMovements(params, { enabled: !isSalesFilter })

  const summaryParams = {
    ...(supplierId && { supplierId }),
    ...(from && { from }),
    ...(to   && { to   }),
  }
  const { data: summaryRows, isLoading: summaryLoading } =
    useSalesSummary(summaryParams, { enabled: isSalesFilter })

  const movements     = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  // Un producto oculto no responde a /products/{id}: su nombre sale de sus movimientos.
  const firstRow = productId ? movements.find((m) => m.productId === productId) : null
  const product = !productId ? null
    : hint ?? fetchedProduct
      ?? { id: productId, name: firstRow?.productName ?? '…', sku: firstRow?.productSku }

  const activePeriod = PERIODS.find((p) => {
    const r = p.range()
    return r.from === from && r.to === to
  })?.key
  const hasFilters = !!(typeFilter || supplierId || from || to || productId)

  const selectCls = 'rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

  return (
    <div className="flex flex-col gap-4">

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <ProductFilterPicker product={product} onChange={onProductChange} className="w-full sm:w-80" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls}>
          <option value="">{t('Todos los tipos')}</option>
          <option value="PURCHASE_ENTRY">{t('Entradas')}</option>
          <option value="SALE">{t('Ventas')}</option>
          <option value="ADJUSTMENT">{t('Ajustes')}</option>
          <option value="RETURN">{t('Devoluciones')}</option>
        </select>
        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={`${selectCls} min-w-48`}>
          <option value="">{t('Todos los proveedores')}</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">{t('Desde')}</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">{t('Hasta')}</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={selectCls} />
        </div>
        {hasFilters && (
          <button onClick={() => { setTypeFilter(''); setSupplierId(''); setFrom(''); setTo(''); onProductChange(null) }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700">
            {t('Limpiar')}
          </button>
        )}

        {/* Períodos de un toque */}
        <div className="-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-2 overflow-x-auto border-t border-gray-100 px-1 pb-1 pt-3 sm:flex-wrap">
          <Calendar size={15} className="flex-shrink-0 text-gray-400" />
          {PERIODS.map((p) => (
            <button key={p.key} type="button"
              onClick={() => { const r = p.range(); setFrom(r.from); setTo(r.to) }}
              className={`flex-shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                activePeriod === p.key
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {t(p.label)}
            </button>
          ))}
        </div>
      </div>

      {product && <ProductHistoryHeader product={product} from={from} to={to} />}

      {/* Guía fija (pedido de Frank): la feature no es banal, que se descubra sola */}
      {!isSalesFilter && !productId && (
        <p className="flex items-start gap-2 px-1 text-[13px] leading-snug text-gray-500">
          <Lightbulb size={15} className="mt-0.5 flex-shrink-0 text-amber-500" />
          <span>
            {t('¿Quieres el')} <span className="font-semibold text-gray-700">{t('Resumen de reposición')}</span>?{' '}
            {t('Filtra por')} <span className="font-semibold text-gray-700">{t('Ventas')}</span>: {t('verás cuánto vendiste de cada producto con su código de proveedor, listo para armar tu pedido.')}
          </span>
        </p>
      )}

      {/* Una sola tabla a la vez: resumen si filtras Ventas, historial si no */}
      {isSalesFilter ? (
        <ReplenishmentSummary rows={summaryRows} isLoading={summaryLoading}
          from={from} to={to} onRowClick={setDetailRow} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className={`${thCls} text-left whitespace-nowrap`}>{t('Fecha')}</th>
                  <th className={`${thCls} text-left`}>{t('Producto')}</th>
                  <th className={`${thCls} text-left whitespace-nowrap`}>{t('Cód. prov.')}</th>
                  <th className={`${thCls} text-left`}>{t('Proveedor')}</th>
                  <th className={`${thCls} text-center`}>{t('Tipo')}</th>
                  <th className={`${thCls} text-center`}>{t('Cantidad')}</th>
                  <th className={`${thCls} text-right whitespace-nowrap`} title={t('Entradas: costo de compra · Ventas: precio de venta')}>{t('Precio unit.')}</th>
                  <th className={`${thCls} text-right`}>{t('Subtotal')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-sm font-medium text-gray-400">
                      {productId && (from || to)
                        ? t('Este producto no tuvo movimientos en este período — prueba con «Todo el historial».')
                        : t('No hay movimientos en este período')}
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const cfg = TYPE_CONFIG[m.type] ?? { label: m.type, cls: 'bg-gray-100 text-gray-600' }
                    return (
                      <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${isFetching ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">{formatDate(m.createdAt)}</td>
                        <td className="max-w-[180px] truncate px-4 py-3.5 font-semibold text-gray-900" title={m.productName}>
                          {productId ? m.productName : (
                            <button type="button" title={`${m.productName}\n${t('Click para ver todo el historial de este producto')}`}
                              onClick={() => onProductChange({ id: m.productId, name: m.productName, sku: m.productSku })}
                              className="max-w-full truncate text-left hover:text-blue-600 hover:underline">
                              {m.productName}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-600 whitespace-nowrap">{m.providerCode ?? '—'}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{m.supplierName ?? '—'}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>{t(cfg.label)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center"><QuantityCell type={m.type} quantity={m.quantity} stockAfter={m.stockAfter} /></td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-700">{formatPrice(m.unitCost)}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-gray-900">{formatAmount(m.subtotal)}</td>
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
                <span className="font-semibold text-gray-700">{fromRow}–{toRow}</span> {t('de')}{' '}
                <span className="font-semibold text-gray-700">{totalElements}</span> {t('movimientos')}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft size={14} />{t('Anterior')}
                </button>
                <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  {t('Siguiente')}<ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {detailRow && (
        <ProductSalesModal row={detailRow} from={from} to={to} onClose={() => setDetailRow(null)} />
      )}
    </div>
  )
}
