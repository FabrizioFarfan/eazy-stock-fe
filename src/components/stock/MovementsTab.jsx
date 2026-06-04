import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMovements } from '../../hooks/useStock'
import { useSuppliers } from '../../hooks/useSuppliers'
import { formatPrice } from '../../utils/formatMoney'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

const TYPE_CONFIG = {
  PURCHASE_ENTRY: { label: 'Entrada', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  SALE:           { label: 'Venta',   cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  ADJUSTMENT:     { label: 'Ajuste',  cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
}

function QuantityCell({ type, quantity }) {
  const isPositive = type === 'PURCHASE_ENTRY' || (type === 'ADJUSTMENT' && quantity > 0)
  const isNegative = type === 'SALE'           || (type === 'ADJUSTMENT' && quantity < 0)
  const cls = isPositive ? 'font-bold text-emerald-600'
            : isNegative ? 'font-bold text-red-500'
            : 'font-medium text-gray-700'
  const sign = type === 'PURCHASE_ENTRY' ? '+' : type === 'SALE' ? '-' : quantity > 0 ? '+' : ''
  return <span className={cls}>{sign}{Math.abs(quantity)}</span>
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
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
    ...(from && { from: `${from}T00:00:00` }),
    ...(to   && { to:   `${to}T23:59:59`  }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }
  const { data, isLoading, isFetching } = useMovements(params)
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">Fecha</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Producto</th>
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
                  <td colSpan={7} className="py-14 text-center text-sm font-medium text-gray-400">
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
