import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Layers, Loader2, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import LotFields from '../stock/LotFields'
import { productsApi } from '../../services/endpoints/products'
import { PRODUCTS_KEY } from '../../hooks/useProducts'
import { lotBuckets } from '../../utils/lots'
import { formatQty } from '../../utils/quantity'
import { getErrorMessage } from '../../utils/handleApiError'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'

const qtyInput = 'w-24 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-600'

/** Etiquetas de los lotes en listas: «Sacapuntas: Sí · 10». */
export function LotChips({ lots }) {
  const shown = (lots ?? []).filter((l) => Number(l.quantity) > 0)
  if (shown.length === 0) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1" data-testid="lot-chips">
      {shown.map((l) => (
        <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
          <Layers size={10} /> {l.label} · {formatQty(l.quantity)}
        </span>
      ))}
    </div>
  )
}

/**
 * En la ficha: cómo se reparte el stock. Separar o corregir un lote no cambia el total: es repartir lo que ya hay, para
 * cuando se cuenta el almacén o había mercadería de antes de esta función.
 */
export default function ProductLots({ product: initial }) {
  const t = useT()
  const qc = useQueryClient()
  const { can } = useAuth()
  const canEdit = can('canManageProducts')
  const { data } = useQuery({
    queryKey: [PRODUCTS_KEY, 'lots', initial.id],
    queryFn: () => productsApi.getById(initial.id).then((r) => r.data.data),
    initialData: initial,
    staleTime: 0,
  })
  const product = data ?? initial
  const buckets = lotBuckets(product)
  const [separating, setSeparating] = useState(false)
  const [params, setParams] = useState({})
  const [qty, setQty] = useState('')
  const [editing, setEditing] = useState(null)
  const [editQty, setEditQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (buckets.length === 0 && !canEdit) return null

  const run = async (action) => {
    setSaving(true)
    setError(null)
    try {
      await action()
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success(t('Lote guardado'))
      setSeparating(false); setParams({}); setQty(''); setEditing(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }
  const separate = () => run(() => productsApi.separateLot(product.id, { parameters: params, quantity: Number(qty) }))
  const saveQty = (lotId) => run(() => productsApi.setLotQuantity(product.id, lotId, Number(editQty)))
  const qtyOk = Number(qty) > 0 && Object.keys(params).length > 0

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3" data-testid="product-lots">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900"><Layers size={15} className="text-violet-600" /> {t('Lotes')}</p>
      {buckets.length > 0 ? (
        <ul className="mt-2 divide-y divide-gray-100">
          {buckets.map((b) => (
            <li key={b.lotId ?? 'loose'} className="flex items-center justify-between gap-2 py-1.5 text-sm" data-testid="product-lot-row">
              <span className="min-w-0 text-gray-700">{b.label ?? t('Sin lote')}</span>
              {editing === b.lotId && b.lotId ? (
                <span className="flex items-center gap-1.5">
                  <input type="number" min="0" step="any" value={editQty} onChange={(e) => setEditQty(e.target.value)} className={qtyInput} aria-label={t('Cantidad')} data-testid="lot-qty-input" />
                  <button type="button" onClick={() => saveQty(b.lotId)} disabled={saving || editQty === ''} aria-label={t('Guardar')} data-testid="lot-qty-save" className="rounded-lg bg-blue-600 p-1.5 text-white disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                </span>
              ) : (
                <span className="flex flex-shrink-0 items-center gap-1.5 font-semibold text-gray-900">
                  {formatQty(b.quantity)}
                  {canEdit && b.lotId && (
                    <button type="button" onClick={() => { setEditing(b.lotId); setEditQty(String(b.quantity)); setError(null) }} aria-label={t('Corregir')} data-testid="lot-qty-edit" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                      <Pencil size={12} />
                    </button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-gray-500">{t('Si parte de este producto es distinta (por ejemplo, unos vienen con sacapuntas), sepárala en un lote para saber cuántos quedan de cada uno.')}</p>
      )}
      {canEdit && !separating && (
        <button type="button" onClick={() => { setSeparating(true); setError(null) }} data-testid="lot-separate-open"
          className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <Plus size={12} /> {t('Separar en un lote')}
        </button>
      )}
      {separating && (
        <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-2.5">
          <LotFields value={params} onChange={setParams} lots={product.lots ?? []} />
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-gray-600" htmlFor="lot-qty">{t('¿Cuántos?')}</label>
            <input id="lot-qty" type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} className={qtyInput} data-testid="lot-separate-qty" />
            <button type="button" onClick={() => setSeparating(false)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">{t('Cancelar')}</button>
            <button type="button" onClick={separate} disabled={saving || !qtyOk} data-testid="lot-separate-save" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">{t('Guardar el lote')}</button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
