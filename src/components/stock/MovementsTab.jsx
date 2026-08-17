import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, ClipboardList } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMovements, useSalesSummary } from '../../hooks/useStock'
import { useSuppliers } from '../../hooks/useSuppliers'
import { formatPrice } from '../../utils/formatMoney'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

const TYPE_CONFIG = {
  PURCHASE_ENTRY: { label: 'Entrada',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  SALE:           { label: 'Venta',      cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  ADJUSTMENT:     { label: 'Ajuste',     cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  RETURN:         { label: 'Devolución', cls: 'bg-purple-50 text-purple-700 ring-1 ring-purple-100' },
}

function QuantityCell({ type, quantity }) {
  const isPositive = type === 'PURCHASE_ENTRY' || type === 'RETURN' || (type === 'ADJUSTMENT' && quantity > 0)
  const isNegative = type === 'SALE'           || (type === 'ADJUSTMENT' && quantity < 0)
  const cls = isPositive ? 'font-bold text-emerald-600'
            : isNegative ? 'font-bold text-red-500'
            : 'font-medium text-gray-700'
  const sign = isPositive ? '+' : type === 'SALE' ? '-' : ''
  return <span className={cls}>{sign}{Math.abs(quantity)}</span>
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

/** 5.000 → "5", 1.300 → "1.3" — cantidades sin ceros decimales sobrantes. */
function fmtQty(q) {
  if (q == null) return '0'
  return String(parseFloat(q))
}

function rangeLabel(from, to) {
  const fmt = (d) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long' }).format(new Date(`${d}T12:00:00`))
  if (from && to) return from === to ? `del ${fmt(from)}` : `del ${fmt(from)} al ${fmt(to)}`
  if (from) return `desde el ${fmt(from)}`
  if (to)   return `hasta el ${fmt(to)}`
  return null
}

const sumThCls = 'px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400'

/**
 * Panel de reposición: aparece al filtrar por Ventas, ENCIMA del detalle (no
 * lo reemplaza — a veces se necesita ver una venta puntual). El total lo suma
 * el servidor sobre todo el rango filtrado, no solo la página visible.
 */
function ReplenishmentSummary({ rows, isLoading, from, to }) {
  const range = rangeLabel(from, to)
  const list = rows ?? []
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-blue-100/60 bg-blue-50/50 px-5 py-3.5">
        <ClipboardList size={16} className="flex-shrink-0 text-blue-600" />
        <h3 className="text-sm font-bold text-gray-900">Resumen de reposición</h3>
        <p className="text-xs text-gray-500">
          {range ? (
            <>Ventas <span className="font-semibold text-gray-700">{range}</span> sumadas por producto — la lista para armar tu pedido. Abajo sigue el detalle una por una.</>
          ) : (
            <>Resumen de todas tus ventas — elige fechas arriba para armar el pedido de la semana.</>
          )}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className={`${sumThCls} text-left whitespace-nowrap`}>Cód. proveedor</th>
              <th className={`${sumThCls} text-left`}>Producto</th>
              <th className={`${sumThCls} text-left`}>Proveedor</th>
              <th className={`${sumThCls} text-center`}>Vendido</th>
              <th className={`${sumThCls} text-center whitespace-nowrap`}>Stock actual</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded-lg bg-gray-100" /></td>
                  ))}
                </tr>
              ))
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm font-medium text-gray-400">
                  No hay ventas en este período
                </td>
              </tr>
            ) : (
              list.map((r) => {
                const low = parseFloat(r.currentStock ?? 0) <= parseFloat(r.minStock ?? 0)
                return (
                  <tr key={r.productId} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">{r.providerCode ?? '—'}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-semibold text-gray-900">{r.productName}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.supplierName ?? '—'}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-700">{fmtQty(r.totalSold)}</td>
                    <td className={`px-4 py-3 text-center ${low ? 'font-bold text-red-500' : 'font-medium text-gray-700'}`}>
                      {fmtQty(r.currentStock)}
                    </td>
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

export default function MovementsTab() {
  const { user } = useAuth()
  const [typeFilter, setTypeFilter]   = useState('')
  const [supplierId, setSupplierId]   = useState('')
  const [from, setFrom]               = useState('')
  const [to, setTo]                   = useState('')
  const [page, setPage]               = useState(0)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(0) }, [typeFilter, supplierId, from, to])

  const { data: suppliersData } = useSuppliers({ size: 200 })
  const suppliers = suppliersData?.content ?? []

  const params = {
    page, size: PAGE_SIZE,
    ...(typeFilter && { type: typeFilter }),
    ...(supplierId && { supplierId }),
    ...(from && { from }),
    ...(to   && { to   }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }
  const { data, isLoading, isFetching } = useMovements(params)

  const isSalesFilter = typeFilter === 'SALE'
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

  const selectCls = 'rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white'

  return (
    <div className="flex flex-col gap-4">

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <Calendar size={15} className="flex-shrink-0 text-gray-400" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls}>
          <option value="">Todos los tipos</option>
          <option value="PURCHASE_ENTRY">Entradas</option>
          <option value="SALE">Ventas</option>
          <option value="ADJUSTMENT">Ajustes</option>
          <option value="RETURN">Devoluciones</option>
        </select>
        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={`${selectCls} min-w-48`}>
          <option value="">Todos los proveedores</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Desde</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Hasta</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={selectCls} />
        </div>
        {(typeFilter || supplierId || from || to) && (
          <button onClick={() => { setTypeFilter(''); setSupplierId(''); setFrom(''); setTo('') }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Limpiar
          </button>
        )}
      </div>

      {/* Resumen de reposición — solo al filtrar por Ventas */}
      {isSalesFilter && (
        <ReplenishmentSummary rows={summaryRows} isLoading={summaryLoading} from={from} to={to} />
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">Fecha</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Producto</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">Cód. prov.</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Proveedor</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Tipo</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Cantidad</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Costo unit.</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-sm font-medium text-gray-400">
                    No hay movimientos en este período
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const cfg = TYPE_CONFIG[m.type] ?? { label: m.type, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${isFetching ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">{formatDate(m.createdAt)}</td>
                      <td className="max-w-[180px] truncate px-4 py-3.5 font-semibold text-gray-900">{m.productName}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-600 whitespace-nowrap">{m.providerCode ?? '—'}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">{m.supplierName ?? '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center"><QuantityCell type={m.type} quantity={m.quantity} /></td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-700">{formatPrice(m.unitCost)}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900">{formatPrice(m.subtotal)}</td>
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
              <span className="font-semibold text-gray-700">{totalElements}</span> movimientos
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft size={14} />Anterior
              </button>
              <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Siguiente<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
