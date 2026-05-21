import { useState } from 'react'
import SaleDetailModal from './SaleDetailModal'

function formatCurrency(v) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v)
}

function formatRelative(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days === 0 && hours === 0) return `hace ${mins} min`
  if (days === 0) return `hace ${hours} h`
  if (days === 1) return 'ayer'
  if (days < 30)  return `hace ${days} días`
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(new Date(dateStr))
}

function formatDateFull(dateStr) {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

function NameChips({ names }) {
  if (!names?.length) return <span className="text-gray-400">—</span>
  const visible = names.slice(0, 2)
  const rest    = names.length - 2
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((n) => (
        <span key={n} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{n}</span>
      ))}
      {rest > 0 && (
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">+{rest}</span>
      )}
    </div>
  )
}

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

const PAGE_SIZES = [10, 20, 50, 100]

export default function SalesTable({ items, isLoading, isError, page, onPageChange, onSizeChange, pageSize }) {
  const [selectedSaleId, setSelectedSaleId] = useState(null)

  const content       = items?.content ?? []
  const totalElements = items?.totalElements ?? 0
  const totalPages    = items?.totalPages ?? 0
  const currentPage   = items?.number ?? 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3">Proveedores</th>
              <th className="px-4 py-3">Marcas</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : isError ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-red-500">
                  No pudimos cargar el reporte.
                </td>
              </tr>
            ) : content.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <p className="text-sm text-gray-500">No hay ventas en este período.</p>
                  <p className="mt-1 text-xs text-gray-400">Probá ampliar el rango o limpiar filtros.</p>
                </td>
              </tr>
            ) : (
              content.map((row) => (
                <tr
                  key={row.saleId}
                  className="cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => setSelectedSaleId(row.saleId)}
                >
                  <td className="px-4 py-3">
                    <span
                      title={formatDateFull(row.date)}
                      className="text-gray-700"
                    >
                      {formatRelative(row.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{row.employeeName}</td>
                  <td className="px-4 py-3 text-center font-mono text-gray-600">{row.itemCount}</td>
                  <td className="px-4 py-3"><NameChips names={row.supplierNames} /></td>
                  <td className="px-4 py-3"><NameChips names={row.brandNames} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(row.totalAmount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalElements > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Filas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-xs outline-none"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <span>
            Página {currentPage + 1} de {totalPages} · {totalElements} ventas
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Sale detail modal */}
      {selectedSaleId && (
        <SaleDetailModal
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
        />
      )}
    </div>
  )
}
