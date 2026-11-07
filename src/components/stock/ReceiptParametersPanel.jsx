import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import ReceiptParameters from './ReceiptParameters'
import { receiptsApi } from '../../services/endpoints/receipts'
import { PRODUCTS_KEY } from '../../hooks/useProducts'
import { PARAMETERS_KEY } from '../../hooks/useParameters'
import { attributesDelta } from '../../utils/parameters'
import { getErrorMessage } from '../../utils/handleApiError'
import { useT } from '../../i18n'

/** Los parámetros de una factura ya registrada: lo mismo que al registrarla, y se guarda aquí. */
export default function ReceiptParametersPanel({ receipt, onDone, onCancel }) {
  const t = useT()
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['receipt-parameters', receipt.id],
    queryFn: () => receiptsApi.parameters(receipt.id).then((r) => r.data.data ?? []),
    gcTime: 0,
  })
  const [edited, setEdited] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const lines = (data ?? []).map((l) => ({ id: l.productId, name: l.productName, sku: l.productSku, attributes: edited[l.productId] ?? l.attributes ?? {} }))
  const changes = (data ?? [])
    .map((l) => ({ productId: l.productId, values: attributesDelta(l.attributes, edited[l.productId] ?? l.attributes) }))
    .filter((c) => Object.keys(c.values).length > 0)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await receiptsApi.updateParameters(receipt.id, changes)
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      qc.invalidateQueries({ queryKey: [PARAMETERS_KEY] })
      toast.success(t('Parámetros guardados en {n} producto(s)', { n: changes.length }))
      onDone()
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4" data-testid="receipt-parameters-panel">
      <p className="text-sm text-gray-600">{t('Elige un parámetro y ponlo a los productos de esta factura de una vez.')}</p>
      {isLoading && <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-gray-400" /></div>}
      {isError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{t('No se pudieron cargar los productos de esta factura.')}</p>}
      {data && <ReceiptParameters lines={lines} onChange={(id, attributes) => setEdited((e) => ({ ...e, [id]: attributes }))} />}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          {t('Volver')}
        </button>
        <button type="button" onClick={save} disabled={saving || changes.length === 0} data-testid="receipt-params-save"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {t('Guardar parámetros')}
        </button>
      </div>
    </div>
  )
}
