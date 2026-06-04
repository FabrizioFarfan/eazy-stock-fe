import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import PriceInput from '../inputs/PriceInput'
import { formatPrice } from '../../utils/formatMoney'
import { getErrorMessage } from '../../utils/handleApiError'

/**
 * Registrar manualmente "el proveedor X nos entregó mercadería al fiado por S/ Y".
 * Solo aplica a proveedores (para clientes la deuda se genera vía venta al fiado).
 *
 * Props:
 *  - supplier: { id, name, currentDebt, creditLimitFromSupplier }
 *  - mutation: useAddSupplierDebt mutation
 *  - onClose
 */
export default function DebtAddModal({ supplier, mutation, onClose }) {
  const [amount, setAmount] = useState(null)
  const [refDoc, setRefDoc] = useState('')
  const [notes,  setNotes]  = useState('')
  const [error,  setError]  = useState(null)

  const debt    = Number(supplier?.currentDebt ?? 0)
  const limit   = supplier?.creditLimitFromSupplier != null ? Number(supplier.creditLimitFromSupplier) : null
  const newDebt = debt + (amount ?? 0)
  const exceeds = limit != null && newDebt > limit

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!amount || amount <= 0) {
      setError('Ingresá un monto mayor a 0')
      return
    }
    try {
      await mutation.mutateAsync({
        supplierId: supplier.id,
        data: {
          amount,
          referenceDocument: refDoc.trim() || null,
          notes: notes.trim() || null,
        },
      })
      toast.success('Recepción a crédito registrada')
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            Recepción a crédito — {supplier.name}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">

          <PriceInput
            label="Monto que entregó"
            value={amount}
            onChange={setAmount}
            maxDecimals={2}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Referencia (factura / guía)</label>
            <input
              value={refDoc}
              onChange={(e) => setRefDoc(e.target.value)}
              maxLength={100}
              placeholder="Factura 0023-001234"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between text-gray-500">
              <span>Deuda actual con {supplier.name}</span>
              <span>{formatPrice(debt)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-red-600">
              <span>Nueva entrega</span>
              <span>+{formatPrice(amount ?? 0)}</span>
            </div>
            <div className="mt-1 border-t border-gray-200 pt-1.5 flex items-center justify-between font-semibold text-gray-900">
              <span>Deuda total</span>
              <span>{formatPrice(newDebt)}</span>
            </div>
            {exceeds && (
              <p className="mt-2 rounded-lg bg-orange-50 px-2 py-1.5 text-xs text-orange-700">
                Esta entrega excede el crédito informado por el proveedor
                ({formatPrice(limit)}). Continuá igual si está OK.
              </p>
            )}
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-gray-200 -mx-5 px-5 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? 'Guardando...' : 'Registrar entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
