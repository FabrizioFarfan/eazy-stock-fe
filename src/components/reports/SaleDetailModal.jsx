import { useMemo, useState } from 'react'
import { X, Tag, Undo2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSaleDetail } from '../../hooks/useReports'
import { useSaleReturns, useCreateSaleReturn } from '../../hooks/useSales'
import { useAuth } from '../../context/AuthContext'
import { formatPrice } from '../../utils/formatMoney'

// Per-line prices may carry up to 6 decimals (extended price precision);
// aggregates (subtotal/discount/total) are always 2-decimal from the BE.
// formatPrice adapts to whatever the value actually carries.
const formatCurrency = formatPrice

function formatDateFull(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

export default function SaleDetailModal({ saleId, onClose }) {
  const { can } = useAuth()
  const { data: sale, isLoading } = useSaleDetail(saleId)
  const { data: returns = [] } = useSaleReturns(saleId)
  const createReturn = useCreateSaleReturn(saleId)

  const [returnMode, setReturnMode] = useState(false)
  const [returnQty, setReturnQty] = useState({})   // { saleItemId: "1.5" }
  const [returnNotes, setReturnNotes] = useState('')

  // Backwards compatibility: ventas pre-descuentos no tienen subtotalBeforeDiscount,
  // así que cualquier valor null lo derivamos del total.
  const subtotal = sale?.subtotalBeforeDiscount ?? sale?.total
  const hasDiscount = sale?.discountAmount != null && sale.discountAmount > 0

  // Cantidad ya devuelta por línea (suma de todas las devoluciones previas)
  const returnedByItem = useMemo(() => {
    const map = {}
    for (const r of returns) {
      for (const ri of r.items ?? []) {
        map[ri.saleItemId] = (map[ri.saleItemId] ?? 0) + Number(ri.quantity)
      }
    }
    return map
  }, [returns])

  const totalReturned = returns.reduce((acc, r) => acc + Number(r.totalRefund), 0)
  const anythingReturnable = (sale?.items || []).some(
    (item) => Number(item.quantity) - (returnedByItem[item.id] ?? 0) > 0,
  )

  const setQty = (saleItemId, value) =>
    setReturnQty((prev) => ({ ...prev, [saleItemId]: value }))

  const submitReturn = () => {
    const items = Object.entries(returnQty)
      .map(([saleItemId, qty]) => ({ saleItemId, quantity: Number(qty) }))
      .filter((i) => Number.isFinite(i.quantity) && i.quantity > 0)

    if (items.length === 0) {
      toast.error('Indica la cantidad a devolver en al menos un producto')
      return
    }
    for (const i of items) {
      const saleItem = sale.items.find((s) => s.id === i.saleItemId)
      const remaining = Number(saleItem.quantity) - (returnedByItem[i.saleItemId] ?? 0)
      if (i.quantity > remaining) {
        toast.error(`'${saleItem.productName}': solo quedan ${remaining} por devolver`)
        return
      }
    }

    createReturn.mutate(
      { items, notes: returnNotes || undefined },
      {
        onSuccess: (data) => {
          toast.success(`Devolución registrada · ${formatCurrency(data.totalRefund)}`)
          setReturnMode(false)
          setReturnQty({})
          setReturnNotes('')
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message ?? 'No pudimos registrar la devolución')
        },
      },
    )
  }

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
                    {returnMode && <th className="pb-2 text-right">Devolver</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(sale?.items || []).map((item) => {
                    const hasOverride = item.unitPriceOverride != null
                      && Number(item.unitPriceOverride) !== Number(item.unitPrice)
                    const effectivePrice = hasOverride ? item.unitPriceOverride : item.unitPrice
                    const returned = returnedByItem[item.id] ?? 0
                    const remaining = Number(item.quantity) - returned
                    return (
                      <tr key={item.id}>
                        <td className="py-2.5">
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="font-mono text-xs text-gray-400">{item.productSku}</p>
                          {hasOverride && (
                            <p className="mt-0.5 text-xs text-orange-600">
                              <Tag size={10} className="-mt-0.5 inline" /> Precio modificado de{' '}
                              <span className="line-through">{formatCurrency(item.unitPrice)}</span>
                            </p>
                          )}
                          {returned > 0 && (
                            <p className="mt-0.5 text-xs text-purple-600">
                              <Undo2 size={10} className="-mt-0.5 inline" /> Devuelto: {returned}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 text-center font-mono text-gray-700">{item.quantity}</td>
                        <td className={`py-2.5 text-right ${hasOverride ? 'font-semibold text-orange-600' : 'text-gray-600'}`}>
                          {formatCurrency(effectivePrice)}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                        {returnMode && (
                          <td className="py-2.5 text-right">
                            {remaining > 0 ? (
                              <input
                                type="number"
                                min="0"
                                max={remaining}
                                step="any"
                                value={returnQty[item.id] ?? ''}
                                onChange={(e) => setQty(item.id, e.target.value)}
                                placeholder={`máx ${remaining}`}
                                className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-right text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                              />
                            ) : (
                              <span className="text-xs text-gray-300">Devuelto</span>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {returnMode && (
                <div className="mt-4">
                  <input
                    type="text"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Motivo de la devolución (opcional)"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              )}

              {/* Devoluciones previas */}
              {returns.length > 0 && !returnMode && (
                <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-600">
                    <Undo2 size={11} /> Devoluciones
                  </p>
                  <ul className="space-y-1">
                    {returns.map((r) => (
                      <li key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {formatDateFull(r.createdAt)}
                          {r.notes ? <span className="text-gray-400"> · {r.notes}</span> : null}
                        </span>
                        <span className="font-semibold text-purple-700">−{formatCurrency(r.totalRefund)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {sale && (
          <div className="space-y-1.5 rounded-b-2xl border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm">
            {hasDiscount && (
              <>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-orange-600">
                  <span>
                    Descuento{sale.discountType === 'PERCENTAGE' ? ` (${sale.discountValue}%)` : ''}
                  </span>
                  <span>−{formatCurrency(sale.discountAmount)}</span>
                </div>
                <div className="my-1.5 border-t border-gray-200" />
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Total cobrado</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(sale.total)}</span>
            </div>
            {totalReturned > 0 && (
              <div className="flex items-center justify-between text-purple-700">
                <span>Total devuelto</span>
                <span className="font-semibold">−{formatCurrency(totalReturned)}</span>
              </div>
            )}

            {can('canCancelSale') && anythingReturnable && (
              <div className="flex justify-end gap-2 pt-2">
                {returnMode ? (
                  <>
                    <button
                      onClick={() => { setReturnMode(false); setReturnQty({}); setReturnNotes('') }}
                      disabled={createReturn.isPending}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={submitReturn}
                      disabled={createReturn.isPending}
                      className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60 transition-all"
                    >
                      {createReturn.isPending
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Undo2 size={14} />}
                      Confirmar devolución
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setReturnMode(true)}
                    className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    <Undo2 size={14} />
                    Registrar devolución
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
