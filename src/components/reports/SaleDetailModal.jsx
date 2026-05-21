import { X } from 'lucide-react'
import { useSaleDetail } from '../../hooks/useReports'

function formatCurrency(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v)
}

function formatDateFull(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

export default function SaleDetailModal({ saleId, onClose }) {
  const { data: sale, isLoading } = useSaleDetail(saleId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">Detalle de venta</h3>
            {sale && (
              <p className="mt-0.5 text-xs text-gray-400">{formatDateFull(sale.createdAt)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            <>
              {sale?.employeeName && (
                <p className="mb-4 text-sm text-gray-500">
                  Vendedor: <span className="font-medium text-gray-800">{sale.employeeName}</span>
                </p>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2 text-center">Cant.</th>
                    <th className="pb-2 text-right">P. unitario</th>
                    <th className="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(sale?.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="font-mono text-xs text-gray-400">{item.productSku}</p>
                      </td>
                      <td className="py-2.5 text-center font-mono text-gray-700">{item.quantity}</td>
                      <td className="py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Footer */}
        {sale && (
          <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-200 bg-gray-50 px-6 py-4">
            <span className="text-sm font-semibold text-gray-500">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(sale.total)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
