import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSales } from '../hooks/useSales'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function SalesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreate = user?.role === 'OWNER' || user?.role === 'EMPLOYEE'

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => { setPage(0) }, [from, to])

  const params = {
    page,
    size: PAGE_SIZE,
    ...(from && { from }),
    ...(to   && { to }),
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId && { businessId: user.businessId }),
  }

  const { data, isLoading, isFetching } = useSales(params)

  const sales          = data?.content       ?? []
  const totalElements  = data?.totalElements ?? 0
  const totalPages     = data?.totalPages    ?? 0
  const fromRow        = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow          = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-semibold text-gray-900">Ventas</h2>
          {!isLoading && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              {totalElements}
            </span>
          )}
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/sales/new')}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={15} />
            Nueva venta
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        {(from || to) && (
          <button
            onClick={() => { setFrom(''); setTo('') }}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
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
                <th className="px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3 text-center">Productos</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <ShoppingCart size={40} className="text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">No hay ventas en este período</p>
                      {canCreate && (
                        <button
                          onClick={() => navigate('/sales/new')}
                          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                          Registrar primera venta
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale, idx) => (
                  <tr
                    key={sale.id}
                    className={`transition-colors hover:bg-gray-50 ${isFetching ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {sale.employeeName ?? sale.createdByName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {sale.items?.length ?? 0} items
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        title="Ver detalle"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Mostrando <span className="font-medium">{fromRow}–{toRow}</span> de{' '}
              <span className="font-medium">{totalElements}</span> ventas
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>
              <span className="px-2 text-sm text-gray-500">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
