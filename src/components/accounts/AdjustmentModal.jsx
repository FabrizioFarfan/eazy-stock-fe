import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import PriceInput from '../inputs/PriceInput'
import { formatPrice } from '../../utils/formatMoney'
import { getErrorMessage } from '../../utils/handleApiError'

/**
 * Modal genérico de ajuste manual de deuda — sirve para customer y supplier.
 *
 * mode="customer" → onSubmit ({ customerId, data: { amount, direction, notes } })
 * mode="supplier" → onSubmit ({ supplierId, data: { amount, direction, notes } })
 *
 * Notes son obligatorias.
 */
export default function AdjustmentModal({ entity, mutation, onClose, mode = 'customer' }) {
  const isSupplier = mode === 'supplier'

  const [amount, setAmount]       = useState(null)
  const [direction, setDirection] = useState('INCREASE')
  const [notes, setNotes]         = useState('')
  const [error, setError]         = useState(null)

  const debt   = Number(entity?.currentDebt ?? 0)
  const delta  = amount != null ? amount : 0
  const newDebt = direction === 'INCREASE' ? debt + delta : Math.max(0, debt - delta)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!amount || amount <= 0) {
      setError('Ingresá un monto mayor a 0')
      return
    }
    if (!notes.trim()) {
      setError('La nota es obligatoria para un ajuste — explicá el motivo')
      return
    }
    if (direction === 'DECREASE' && amount > debt + 0.005) {
      setError(`El ajuste DECREASE no puede superar la deuda actual de ${formatPrice(debt)}`)
      return
    }
    try {
      const data = { amount, direction, notes: notes.trim() }
      await mutation.mutateAsync(
        isSupplier
          ? { supplierId: entity.id, data }
          : { customerId: entity.id, data },
      )
      toast.success('Ajuste aplicado')
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
            Ajustar deuda — {entity.name}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">

          <div className="grid grid-cols-2 gap-2">
            <button type="button"
              onClick={() => setDirection('INCREASE')}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                direction === 'INCREASE'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              + Aumentar deuda
            </button>
            <button type="button"
              onClick={() => setDirection('DECREASE')}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                direction === 'DECREASE'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              − Bajar deuda
            </button>
          </div>

          <PriceInput
            label="Monto del ajuste"
            value={amount}
            onChange={setAmount}
            maxDecimals={2}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Explicá por qué se ajusta — queda en el historial."
              className="resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between text-gray-500">
              <span>Deuda actual</span>
              <span>{formatPrice(debt)}</span>
            </div>
            <div className={`mt-1 flex items-center justify-between ${
              direction === 'INCREASE' ? 'text-red-600' : 'text-emerald-600'
            }`}>
              <span>Ajuste</span>
              <span>{direction === 'INCREASE' ? '+' : '−'}{formatPrice(delta)}</span>
            </div>
            <div className="mt-1 border-t border-gray-200 pt-1.5 flex items-center justify-between font-semibold text-gray-900">
              <span>Deuda resultante</span>
              <span>{formatPrice(newDebt)}</span>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-gray-200 -mx-5 px-5 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? 'Guardando...' : 'Aplicar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
