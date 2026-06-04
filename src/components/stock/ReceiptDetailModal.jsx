import { X, Truck, Loader2, FileText } from 'lucide-react'
import { useReceiptDetail } from '../../hooks/useReceipts'
import { formatPrice } from '../../utils/formatMoney'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

export default function ReceiptDetailModal({ receiptId, onClose }) {
  const { data: receipt, isLoading, isError } = useReceiptDetail(receiptId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">Detalle de recepción</h3>
            {receipt && (
              <p className="mt-0.5 text-xs text-gray-400">{formatDate(receipt.createdAt)}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
          ) : isError || !receipt ? (
            <p className="py-6 text-center text-sm text-red-500">No pudimos cargar la recepción.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-blue-600" />
                  <span className="text-base font-semibold text-gray-900">{receipt.supplierName}</span>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  receipt.paymentMode === 'CREDIT'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {receipt.paymentMode === 'CREDIT' ? 'A crédito' : 'Al contado'}
                </span>
              </div>

              {(receipt.referenceDocument || receipt.notes) && (
                <div className="mb-4 space-y-1 rounded-xl bg-gray-50 px-4 py-3 text-sm">
                  {receipt.referenceDocument && (
                    <p className="flex items-center gap-1.5 text-gray-600">
                      <FileText size={13} className="text-gray-400" />
                      {receipt.referenceDocument}
                    </p>
                  )}
                  {receipt.notes && <p className="text-xs text-gray-500">{receipt.notes}</p>}
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2 text-center">Cant.</th>
                    <th className="pb-2 text-right">P. unit.</th>
                    <th className="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(receipt.movements ?? []).map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-gray-900">{m.productName}</p>
                        <p className="font-mono text-xs text-gray-400">{m.productSku}</p>
                      </td>
                      <td className="py-2.5 text-center font-mono text-gray-700">{m.quantity}</td>
                      <td className="py-2.5 text-right text-gray-600">{formatPrice(m.unitCost)}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">{formatPrice(m.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {receipt.transaction && (
                <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm ring-1 ring-amber-100">
                  <p className="font-semibold text-amber-900">Generó cuenta por pagar</p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    Esta recepción sumó <span className="font-mono font-semibold">{formatPrice(receipt.transaction.amount)}</span>{' '}
                    a la deuda con el proveedor. Saldo después: {formatPrice(receipt.transaction.balanceAfter)}.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {receipt && (
          <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-200 bg-gray-50 px-6 py-4">
            <span className="text-sm font-semibold text-gray-500">Total recepción</span>
            <span className="text-lg font-bold text-gray-900">{formatPrice(receipt.totalAmount)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
