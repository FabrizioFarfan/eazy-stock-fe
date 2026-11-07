import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import LotFields from './LotFields'
import { useMarkReceiptLot } from '../../hooks/useReceipts'
import { formatQty } from '../../utils/quantity'
import { getErrorMessage } from '../../utils/handleApiError'
import { useT } from '../../i18n'

/** Una compra ya registrada venía distinta: lo que entró pasa a su lote, sin cambiar el stock total. */
export default function ReceiptLotPanel({ receipt, movement, onDone }) {
  const t = useT()
  const mark = useMarkReceiptLot()
  const [value, setValue] = useState({})
  const [error, setError] = useState(null)
  const save = async (parameters) => {
    setError(null)
    try {
      await mark.mutateAsync({ id: receipt.id, supplierId: receipt.supplierId, productId: movement.productId, parameters })
      toast.success(t('Lote guardado'))
      onDone()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }
  return (
    <div className="space-y-4" data-testid="receipt-lot-panel">
      <div>
        <p className="text-base font-semibold text-gray-900">{movement.productName}</p>
        <p className="mt-0.5 text-sm text-gray-600">
          {t('Estas {n} unidades venían distintas. Pasan a su propio lote; lo demás de este producto no cambia.', { n: formatQty(movement.quantity) })}
        </p>
        {movement.lotLabel && <p className="mt-1 text-sm font-medium text-violet-700">{t('Ahora: {label}', { label: movement.lotLabel })}</p>}
      </div>
      <LotFields value={value} onChange={setValue} />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onDone} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">{t('Volver')}</button>
        {movement.lotLabel && (
          <button type="button" onClick={() => save({})} disabled={mark.isPending} data-testid="receipt-lot-remove"
            className="flex-1 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">{t('Quitar el lote')}</button>
        )}
        <button type="button" onClick={() => save(value)} disabled={mark.isPending || Object.keys(value).length === 0} data-testid="receipt-lot-save"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
          {mark.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {t('Guardar el lote')}
        </button>
      </div>
    </div>
  )
}
