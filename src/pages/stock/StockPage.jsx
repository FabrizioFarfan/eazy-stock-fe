import { useState, useEffect } from 'react'
import { ArrowDownToLine, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMovements } from '../../hooks/useStock'
import MovementModal from './MovementModal'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

const TYPE_CONFIG = {
  PURCHASE_ENTRY: { label: 'Entrada',  cls: 'bg-green-100 text-green-700' },
  SALE:           { label: 'Venta',    cls: 'bg-blue-100  text-blue-700'  },
  ADJUSTMENT:     { label: 'Ajuste',   cls: 'bg-amber-100 text-amber-700' },
}

function QuantityCell({ type, quantity }) {
  const isPositive = type === 'PURCHASE_ENTRY' || (type === 'ADJUSTMENT' && quantity > 0)
  const isNegative = type === 'SALE'          || (type === 'ADJUSTMENT' && quantity < 0)
  const cls = isPositive ? 'text-green-600 font-semibold'
            : isNegative ? 'text-red-600 font-semibold'
            : 'text-gray-700'
  const sign = type === 'PURCHASE_ENTRY' ? '+' : type === 'SALE' ? '-' : quantity > 0 ? '+' : ''
  return <span className={cls}>{sign}{Math.abs(quantity)}</span>
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function StockPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'

  const [typeFilter, setTypeFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null) // 'PURCHASE_ENTRY' | 'ADJUSTMENT' | null

  useEffect(() => { setPage(0) }, [typeFilter, from, to])

  const params = {
    page,
    size: PAGE_SIZE,
    ...(typeFilter && { type: typeFilter }),
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

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Movimientos de stock</h2>
        {isManager && (
          <div className="flex gap-2">
            <button
              onClick={() => setModal('PURCHASE_ENTRY')}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              <ArrowDownToLine size={15} />
              Nueva entrada
            </button>
            <button
              onClick={() => setModal('ADJUSTMENT')}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <SlidersHorizontal size={15} />
              Ajuste
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Todos</option>
          <option value="PURCHASE_ENTRY">Entradas</option>
          <option value="SALE">Ventas</option>
          <option value="ADJUSTMENT">Ajustes</option>
        </select>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
        </div>
        {(typeFilter || from || to) && (
          <button onClick={() => { setTypeFilter(''); setFrom(''); setTo('') }}
            className="text-sm text-gray-400 underline hover:text-gray-600">
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-3 py-3 whitespace-nowrap">Fecha</th>
                <th className="px-3 py-3">Producto</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3 text-center">Tipo</th>
                <th className="px-3 py-3 text-center">Cantidad</th>
                <th className="px-3 py-3 text-center">Antes</th>
                <th className="px-3 py-3 text-center">Después</th>
                <th className="px-3 py-3">Usuario</th>
                <th className="px-3 py-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-sm text-gray-400">
                    No hay movimientos en este período
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const cfg = TYPE_CONFIG[m.type] ?? { label: m.type, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={m.id} className={`transition-colors hover:bg-gray-50 ${isFetching ? 'opacity-60' : ''}`}>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600 text-xs">{formatDate(m.createdAt)}</td>
                      <td className="px-3 py-3 font-medium text-gray-900 max-w-[160px] truncate">{m.productName}</td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-400">{m.productSku}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <QuantityCell type={m.type} quantity={m.quantity} />
                      </td>
                      <td className="px-3 py-3 text-center text-gray-500">{m.stockBefore ?? '—'}</td>
                      <td className="px-3 py-3 text-center text-gray-500">{m.stockAfter  ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-600 max-w-[120px] truncate">{m.createdByName ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-400 text-xs max-w-[140px] truncate">{m.notes ?? '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Mostrando <span className="font-medium">{fromRow}–{toRow}</span> de{' '}
              <span className="font-medium">{totalElements}</span> movimientos
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft size={14} />Anterior
              </button>
              <span className="px-2 text-sm text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Siguiente<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && <MovementModal type={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
