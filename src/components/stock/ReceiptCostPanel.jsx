import { useMemo, useState } from 'react'
import { Loader2, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useCompleteReceiptCost, useReferenceCheck } from '../../hooks/useReceipts'
import ReferenceCheckHint from './ReferenceCheckHint'
import PriceInput from '../inputs/PriceInput'
import { formatPrice } from '../../utils/formatMoney'
import { formatQty } from '../../utils/quantity'
import { getErrorMessage } from '../../utils/handleApiError'
import { useT } from '../../i18n'

/**
 * El dueño completa la plata de una ENTRADA SIMPLE que anotó un vendedor
 * (24-oct-2026): costo de cada producto (precargado con su precio de compra
 * vigente), total de la factura, contado o crédito y número de factura / guía.
 * Queda igual que si la hubiera registrado él con «Registrar recepción»: el
 * costo pasa a ser el precio de compra del producto y, a crédito, se suma a la
 * deuda con el proveedor.
 */
export default function ReceiptCostPanel({ receipt, onDone, onCancel }) {
  const t = useT()
  const complete = useCompleteReceiptCost()
  const suggested = receipt.suggestedCosts ?? {}

  // Una línea por producto (la entrada simple no repite productos).
  const [lines, setLines] = useState(() => (receipt.movements ?? []).map((m) => ({
    productId: m.productId,
    productName: m.productName,
    productSku: m.productSku,
    quantity: Number(m.quantity),
    unitCost: suggested[m.productId] != null ? Number(suggested[m.productId]) : null,
  })))
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [totalAmount, setTotalAmount] = useState(null)
  const [totalTouched, setTotalTouched] = useState(false)
  const [reference, setReference] = useState(receipt.referenceDocument ?? '')
  const [error, setError] = useState(null)

  const refCheck = useReferenceCheck(receipt.supplierId, reference, receipt.id)
  const refDuplicated = !!(refCheck.result?.exists && refCheck.result?.sameSupplier)

  const computedTotal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.unitCost ?? 0) * l.quantity, 0),
    [lines],
  )
  const finalTotal = totalTouched && totalAmount != null ? Number(totalAmount) : computedTotal

  const setCost = (productId, value) => setLines((prev) =>
    prev.map((l) => l.productId === productId ? { ...l, unitCost: value } : l))

  const submit = async () => {
    setError(null)
    const missing = lines.find((l) => l.unitCost == null || !Number.isFinite(Number(l.unitCost)) || Number(l.unitCost) < 0)
    if (missing) { setError(t('Falta el costo de {name}', { name: missing.productName })); return }
    if (!finalTotal || finalTotal <= 0) { setError(t('Ingresá el monto total de la compra')); return }
    if (refDuplicated) {
      setError(t('La factura «{ref}» ya está registrada para {supplier}. Corregí el número o anulá la recepción anterior.', { ref: refCheck.result.referenceDocument, supplier: receipt.supplierName }))
      return
    }
    try {
      await complete.mutateAsync({
        id: receipt.id,
        supplierId: receipt.supplierId,
        data: {
          items: lines.map((l) => ({ productId: l.productId, unitCost: Number(l.unitCost), salePrice: null })),
          totalAmount: Math.round(finalTotal * 100) / 100,
          paymentMode,
          referenceDocument: reference.trim() || null,
        },
      })
      toast.success(paymentMode === 'CREDIT'
        ? t('Costo guardado — {amount} sumados a la deuda con {supplier}', { amount: formatPrice(finalTotal), supplier: receipt.supplierName })
        : t('Costo guardado — {amount} pagados al contado a {supplier}', { amount: formatPrice(finalTotal), supplier: receipt.supplierName }))
      onDone()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4" data-testid="receipt-cost-panel">
      <p className="text-sm text-gray-600">
        {t('{who} anotó lo que llegó de {supplier}. Pon cuánto costó cada producto y cómo se pagó.', { who: receipt.createdByName, supplier: receipt.supplierName })}
      </p>

      <div className="space-y-2">
        {lines.map((l) => (
          <div key={l.productId} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{l.productName}</p>
                <p className="font-mono text-[10px] text-gray-400">{l.productSku}</p>
              </div>
              <span className="flex-shrink-0 font-mono text-sm text-gray-700">× {formatQty(l.quantity)}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 items-center gap-2">
              <PriceInput value={l.unitCost} onChange={(v) => setCost(l.productId, v)} maxDecimals={6} />
              <p className="text-right text-sm font-semibold text-gray-900">
                {formatPrice(Number(l.unitCost ?? 0) * l.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700">{t('Forma de pago')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setPaymentMode('CASH')}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${paymentMode === 'CASH'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
            {t('Al contado')}
          </button>
          <button type="button" onClick={() => setPaymentMode('CREDIT')}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${paymentMode === 'CREDIT'
              ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
            {t('A crédito (suma deuda)')}
          </button>
        </div>
      </div>

      <PriceInput
        label={t('Monto total de la compra')}
        value={totalTouched ? totalAmount : (computedTotal > 0 ? computedTotal : null)}
        onChange={(v) => { setTotalAmount(v); setTotalTouched(true) }}
        maxDecimals={2}
        helperText={totalTouched && Math.abs(computedTotal - Number(totalAmount ?? 0)) > 0.005
          ? t('Diferencia con la suma de líneas: {sum}', { sum: formatPrice(computedTotal) })
          : t('Se autocalcula desde las líneas — podés sobrescribirlo si la factura cobró distinto')}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Referencia (factura / guía)')}</label>
        <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100}
          placeholder={t('Factura 0023-001234')}
          className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${refDuplicated ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600/20'}`} />
        <ReferenceCheckHint result={refCheck.result} checking={refCheck.checking} supplierName={receipt.supplierName} />
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600 ring-1 ring-red-100">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />{error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
          {t('Volver')}
        </button>
        <button type="button" onClick={submit} disabled={complete.isPending}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          {complete.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {t('Guardar el costo')}
        </button>
      </div>
    </div>
  )
}
