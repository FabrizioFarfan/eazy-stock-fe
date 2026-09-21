import { useMemo, useState } from 'react'
import { Loader2, Undo2, Minus, Plus, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useReturnReceiptItems } from '../../hooks/useReceipts'
import { formatAmount, formatPrice } from '../../utils/formatMoney'
import { formatQty } from '../../utils/quantity'
import { getErrorMessage } from '../../utils/handleApiError'
import { useT } from '../../i18n'

/**
 * Devolver al proveedor parte de una recepción ya registrada (pedido de William:
 * pide tantos productos que a menudo regresa más de uno, y en las facturas a
 * crédito no lograba descontarlos). Se elige cuánto regresa de cada producto;
 * al confirmar baja el stock y, si fue a crédito, baja la deuda con el proveedor.
 * El valor lo calcula el servidor — acá se muestra el mismo cálculo como vista previa.
 */
export default function ReceiptReturnPanel({ receipt, onDone, onCancel }) {
  const t = useT()
  const [qty, setQty]     = useState({})   // productId → texto
  const [notes, setNotes] = useState('')
  const [error, setError] = useState(null)
  const returnItems = useReturnReceiptItems()
  const isCredit = receipt.paymentMode === 'CREDIT'

  // Una fila por producto: recibido − ya devuelto = lo que aún se puede devolver.
  const { rows, ratio } = useMemo(() => {
    const map = new Map()
    let linesTotal = 0
    for (const m of receipt.movements ?? []) {
      const r = map.get(m.productId) ?? { productId: m.productId, name: m.productName, sku: m.productSku, received: 0, returned: 0, unitCost: Number(m.unitCost ?? 0) }
      r.received += Number(m.quantity)
      linesTotal += Number(m.unitCost ?? 0) * Number(m.quantity)
      map.set(m.productId, r)
    }
    for (const m of receipt.returns ?? []) {
      const r = map.get(m.productId)
      if (r) r.returned += Number(m.quantity)
    }
    const list = [...map.values()].map((r) => ({ ...r, available: Math.max(0, +(r.received - r.returned).toFixed(3)) }))
    // Si el total de la factura no es la suma de las líneas (IGV, descuento
    // global), lo devuelto pesa en la misma proporción en que entró.
    return { rows: list, ratio: linesTotal > 0 ? Number(receipt.totalAmount) / linesTotal : 1 }
  }, [receipt])

  const parsed = (id) => {
    const n = parseFloat(String(qty[id] ?? '').replace(',', '.'))
    return Number.isFinite(n) && n > 0 ? n : 0
  }
  const setClamped = (r, n) => {
    const v = Math.min(r.available, Math.max(0, +n.toFixed(3)))
    setQty((prev) => ({ ...prev, [r.productId]: v === 0 ? '' : String(v) }))
  }

  const chosen   = rows.filter((r) => parsed(r.productId) > 0)
  const tooMuch  = rows.some((r) => parsed(r.productId) > r.available)
  const amount   = chosen.reduce((sum, r) => sum + parsed(r.productId) * r.unitCost * ratio, 0)
  const nothingLeft = rows.every((r) => r.available === 0)

  const submit = async () => {
    setError(null)
    try {
      await returnItems.mutateAsync({
        id: receipt.id, supplierId: receipt.supplierId,
        items: chosen.map((r) => ({ productId: r.productId, quantity: parsed(r.productId) })),
        ...(notes.trim() && { notes: notes.trim() }),
      })
      toast.success(isCredit
        ? t('Devolución registrada — stock descontado y {amount} menos de deuda con {supplier}', { amount: formatPrice(amount.toFixed(2)), supplier: receipt.supplierName })
        : t('Devolución registrada — stock descontado'))
      onDone()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900 ring-1 ring-blue-100">
        <p className="flex items-center gap-2 font-semibold"><Undo2 size={15} /> {t('¿Qué le regresas a {supplier}?', { supplier: receipt.supplierName })}</p>
        <p className="mt-1 text-xs text-blue-800">
          {isCredit
            ? t('Pon cuánto devuelves de cada producto. Al confirmar se descuenta de tu stock y el valor de lo devuelto se resta de lo que le debes al proveedor.')
            : t('Pon cuánto devuelves de cada producto. Al confirmar se descuenta de tu stock. Esta compra fue al contado: el reembolso lo arreglas con el proveedor.')}
        </p>
      </div>

      {nothingLeft ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">{t('Ya devolviste todo lo de esta recepción.')}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => {
            const n = parsed(r.productId)
            const over = n > r.available
            return (
              <li key={r.productId} className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 ${r.available === 0 ? 'opacity-50' : ''}`}>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-mono text-gray-400">{r.sku}</span> · {t('recibiste {n}', { n: formatQty(r.received) })}
                    {r.returned > 0 && <> · <span className="text-purple-600">{t('ya devolviste {n}', { n: formatQty(r.returned) })}</span></>}
                  </p>
                </div>
                {r.available > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setClamped(r, n - 1)} disabled={n <= 0}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30" aria-label={t('Menos')}>
                      <Minus size={16} />
                    </button>
                    <input inputMode="decimal" value={qty[r.productId] ?? ''} placeholder="0"
                      onChange={(e) => setQty((prev) => ({ ...prev, [r.productId]: e.target.value }))}
                      aria-label={t('Cantidad a devolver de {name}', { name: r.name })}
                      className={`h-10 w-16 rounded-xl border text-center font-mono text-sm outline-none focus:ring-2 ${over ? 'border-red-400 text-red-600 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600/20'}`} />
                    <button type="button" onClick={() => setClamped(r, n + 1)} disabled={n >= r.available}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30" aria-label={t('Más')}>
                      <Plus size={16} />
                    </button>
                    <button type="button" onClick={() => setClamped(r, r.available)}
                      className="h-10 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50">
                      {t('Todo ({n})', { n: formatQty(r.available) })}
                    </button>
                  </div>
                )}
                {over && <p className="w-full text-right text-xs text-red-600">{t('Solo quedan {n} por devolver', { n: formatQty(r.available) })}</p>}
              </li>
            )
          })}
        </ul>
      )}

      {!nothingLeft && (
        <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500}
          placeholder={t('Motivo (opcional): llegó fallado, medida equivocada...')}
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400" />
      )}

      {chosen.length > 0 && !tooMuch && (
        <div className={`space-y-1 rounded-xl px-4 py-3 text-sm ring-1 ${isCredit ? 'bg-amber-50 ring-amber-100' : 'bg-gray-50 ring-gray-100'}`}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">{t('Valor de lo que devuelves')}</span>
            <span className="font-mono font-bold text-gray-900">{formatAmount(amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{t('La factura queda en')}</span>
            <span className="font-mono">
              {formatAmount(receipt.netAmount ?? receipt.totalAmount)}
              <ArrowRight size={11} className="mx-1 inline text-gray-300" />
              <span className="font-semibold text-gray-900">{formatAmount(Math.max(0, Number(receipt.netAmount ?? receipt.totalAmount) - amount))}</span>
            </span>
          </div>
          {isCredit && (
            <p className="pt-1 text-xs font-medium text-amber-800">
              {t('Se resta de tu deuda con {supplier}. Si ya la pagaste, baja hasta cero y el resto lo arreglas con el proveedor.', { supplier: receipt.supplierName })}
            </p>
          )}
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
          {t('Volver')}
        </button>
        <button type="button" onClick={submit}
          disabled={chosen.length === 0 || tooMuch || returnItems.isPending}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {returnItems.isPending ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
          {returnItems.isPending ? t('Registrando...') : t('Confirmar devolución')}
        </button>
      </div>
    </div>
  )
}
