import { useEffect, useState } from 'react'
import { X, Loader2, AlertTriangle, Trash2, EyeOff, Check } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '../../services/endpoints/products'
import { useDeactivateProduct, useDeleteProductPermanently } from '../../hooks/useProducts'
import { getErrorMessage } from '../../utils/handleApiError'

/**
 * Qué hacer con un producto que ya no querés ver: ocultarlo (desactivar) o
 * borrarlo de verdad. Existe porque desactivar se confundía con borrar — el
 * producto quedaba escondido reteniendo su código y el protocolo saltaba al
 * siguiente número. Borrar solo se ofrece si nunca se usó (sin ventas ni
 * entradas de stock); ahí el código vuelve a quedar libre.
 */
export default function DeleteProductModal({ product, onClose, onDone }) {
  // Un producto ya oculto solo tiene un camino útil: borrarlo de verdad.
  const alreadyHidden = product.active === false
  const [choice, setChoice] = useState(alreadyHidden ? 'delete' : null)   // 'deactivate' | 'delete'
  const [check, setCheck]   = useState(null)          // { deletable, reason }
  const [loadingCheck, setLoadingCheck] = useState(true)
  const [confirmText, setConfirmText]   = useState('')

  const deactivate = useDeactivateProduct()
  const deleteForever = useDeleteProductPermanently()

  useEffect(() => {
    let cancelled = false
    productsApi.checkDeletable(product.id)
      .then((r) => { if (!cancelled) setCheck(r.data.data) })
      .catch(() => { if (!cancelled) setCheck({ deletable: false, reason: 'No se pudo verificar el historial' }) })
      .finally(() => { if (!cancelled) setLoadingCheck(false) })
    return () => { cancelled = true }
  }, [product.id])

  const canDelete = check?.deletable === true
  const confirmed = confirmText.trim().toUpperCase() === 'BORRAR'
  const busy = deactivate.isPending || deleteForever.isPending

  const run = async () => {
    try {
      if (choice === 'deactivate') {
        await deactivate.mutateAsync(product.id)
        // El producto desaparece de la lista: sin decir dónde quedó, el usuario
        // cree que lo borró y después no lo encuentra para borrarlo de verdad.
        toast.success(`"${product.name}" quedó oculto. Su código ${product.sku} sigue reservado.`, {
          description: 'Lo encontrás con el filtro "Ocultos" de Productos.',
          duration: 8000,
          action: {
            label: 'Ver ocultos',
            onClick: () => window.dispatchEvent(new CustomEvent('eazystock:show-hidden-products')),
          },
        })
      } else {
        await deleteForever.mutateAsync(product.id)
        toast.success(`"${product.name}" borrado. El código ${product.sku} volvió a quedar libre.`)
      }
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const optionCls = (active) =>
    `w-full rounded-xl border p-4 text-left transition-colors ${
      active ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/15' : 'border-gray-200 bg-white hover:bg-gray-50'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-red-600" />
            <h3 className="text-base font-bold text-gray-900">Quitar producto</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          <p className="text-sm text-gray-600">
            <b className="text-gray-900">{product.name}</b>
            <span className="ml-2 rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">{product.sku}</span>
          </p>

          {alreadyHidden && (
            <p className="rounded-xl bg-gray-50 px-3.5 py-2.5 text-xs text-gray-600 ring-1 ring-gray-100">
              Este producto ya está oculto: su código sigue reservado. Bórralo para liberarlo, o
              cierra y usa <b>"Reactivar"</b> para devolverlo al catálogo.
            </p>
          )}

          {/* Opción 1 — ocultar */}
          {!alreadyHidden && (
          <button type="button" onClick={() => setChoice('deactivate')} className={optionCls(choice === 'deactivate')}>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <EyeOff size={15} className="text-amber-600" />
              Ocultar del catálogo
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              Deja de aparecer en la lista, pero se conserva su historial y <b>su código {product.sku} queda
              reservado</b>: el próximo producto seguirá con el número siguiente. Después lo encontrás
              con el filtro <b>"Ocultos"</b>, para reactivarlo o borrarlo.
            </p>
          </button>
          )}

          {/* Opción 2 — borrar de verdad */}
          <button
            type="button"
            onClick={() => canDelete && setChoice('delete')}
            disabled={!canDelete || loadingCheck}
            className={`${optionCls(choice === 'delete')} ${!canDelete || loadingCheck ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Trash2 size={15} className="text-red-600" />
              Borrar definitivamente
              {loadingCheck && <Loader2 size={13} className="animate-spin text-gray-400" />}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              Desaparece del sistema y <b>su código {product.sku} vuelve a quedar libre</b> para el próximo
              producto. Para productos de prueba o creados por error.
            </p>
            {!loadingCheck && !canDelete && check?.reason && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
                <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                {check.reason}: solo puede ocultarse.
              </p>
            )}
          </button>

          {/* Confirmación tipeada solo para el borrado real */}
          {choice === 'delete' && (
            <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
              <label className="mb-1.5 block text-xs font-medium text-red-800">
                Esta acción no se puede deshacer. Escribí <b>BORRAR</b> para confirmar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="BORRAR"
                className="w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!choice || busy || (choice === 'delete' && !confirmed)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
              choice === 'delete' ? 'bg-red-600 shadow-red-600/30 hover:bg-red-700' : 'bg-amber-600 shadow-amber-600/30 hover:bg-amber-700'
            }`}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {busy ? 'Aplicando...' : choice === 'delete' ? 'Borrar definitivamente' : 'Ocultar producto'}
          </button>
        </div>
      </div>
    </div>
  )
}
