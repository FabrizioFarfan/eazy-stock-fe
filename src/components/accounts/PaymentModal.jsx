import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import PriceInput from '../inputs/PriceInput'
import PriceInputModeToggle from '../inputs/PriceInputModeToggle'
import { formatPrice } from '../../utils/formatMoney'
import { getErrorMessage } from '../../utils/handleApiError'

/**
 * Modal genérico para registrar un pago.
 *
 *  - mode="customer": header "Registrar pago de {entity.name}" (cliente nos paga).
 *  - mode="supplier": header "Registrar pago a {entity.name}" (le pagamos al proveedor).
 *
 * Props comunes:
 *  - entity: { id, name, currentDebt }
 *  - mutation: react-query mutation que recibe { [entityIdKey]: id, data: {...} }
 *  - onClose: cierra el modal.
 *  - mode: "customer" | "supplier" (cambia copy + agrega referenceDocument para supplier).
 */
export default function PaymentModal({ entity, mutation, onClose, mode = 'customer' }) {
  const isSupplier = mode === 'supplier'

  const [amount, setAmount]         = useState(null)
  const [notes,  setNotes]          = useState('')
  const [refDoc, setRefDoc]         = useState('')
  const [error,  setError]          = useState(null)

  const debt = Number(entity?.currentDebt ?? 0)
  const remaining = amount != null ? Math.max(0, debt - amount) : debt

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!amount || amount <= 0) {
      setError('Ingresá un monto mayor a 0')
      return
    }
    if (amount > debt + 0.005) {
      setError(`El pago no puede superar la deuda actual de ${formatPrice(debt)}`)
      return
    }
    try {
      const data = isSupplier
        ? { amount, referenceDocument: refDoc.trim() || null, notes: notes.trim() || null }
        : { amount, notes: notes.trim() || null }

      await mutation.mutateAsync(
        isSupplier
          ? { supplierId: entity.id, data }
          : { customerId: entity.id, data },
      )
      toast.success(isSupplier
        ? `Pago a ${entity.name} registrado`
        : `Pago de ${entity.name} registrado`)
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
            {isSupplier ? `Registrar pago a ${entity.name}` : `Registrar pago de ${entity.name}`}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-700">Monto del pago</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">Formato del precio</span>
                <PriceInputModeToggle />
              </div>
            </div>
            <PriceInput
              value={amount}
              onChange={setAmount}
              maxDecimals={2}
            />
          </div>

          {isSupplier && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Referencia (opcional)</label>
              <input
                value={refDoc}
                onChange={(e) => setRefDoc(e.target.value)}
                maxLength={100}
                placeholder="Factura 0023-001234"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          )}

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
              <span>Deuda actual</span>
              <span>{formatPrice(debt)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-orange-600">
              <span>Este pago</span>
              <span>−{formatPrice(amount ?? 0)}</span>
            </div>
            <div className="mt-1 border-t border-gray-200 pt-1.5 flex items-center justify-between font-semibold text-gray-900">
              <span>Deuda restante</span>
              <span>{formatPrice(remaining)}</span>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-200 -mx-5 px-5 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? 'Guardando...' : 'Registrar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
