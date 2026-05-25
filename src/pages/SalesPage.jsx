import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart, ChevronLeft, ChevronRight, Eye, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSales } from '../hooks/useSales'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

const PAGE_SIZE = 20

export default function SalesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreate = user?.role === 'OWNER' || user?.role === 'EMPLOYEE'

  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => { setPage(0) }, [from, to])

  const params = {
    page, size: PAGE_SIZE,
    ...(from && { from }),
    ...(to   && { to }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }

  const { data, isLoading, isFetching } = useSales(params)

  const sales         = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Ventas</h2>
          {!isLoading && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {totalElements}
            </span>
          )}
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/sales/new')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            <Plus size={15} />
            Nueva venta
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <Calendar size={15} className="flex-shrink-0 text-gray-400" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Desde</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Hasta</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
        </div>
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo('') }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
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
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Fecha</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Empleado</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Productos</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Total</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Ver</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center gap-4 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <ShoppingCart size={28} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700">No hay ventas en este período</p>
                        <p className="mt-1 text-xs text-gray-400">Ajusta el rango de fechas o registra una nueva venta</p>
                      </div>
                      {canCreate && (
                        <button onClick={() => navigate('/sales/new')}
                          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]">
                          <Plus size={14} />
                          Registrar venta
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale, idx) => (
                  <tr key={sale.id} className={`border-b border-gray-50 transition-colors hover:bg-gray-50/70 ${isFetching ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5 text-center text-xs font-mono text-gray-400">
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap text-xs">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {sale.employeeName ?? sale.createdByName ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                        {sale.items?.length ?? 0} items
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button title="Ver detalle"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-700">{fromRow}–{toRow}</span> de{' '}
              <span className="font-semibold text-gray-700">{totalElements}</span> ventas
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
    </div>
  )
}
