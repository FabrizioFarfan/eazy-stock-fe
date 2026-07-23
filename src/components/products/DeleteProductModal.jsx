import { useEffect, useState } from 'react'
import { X, Loader2, AlertTriangle, Trash2, EyeOff, Check, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '../../services/endpoints/products'
import {
  useDeactivateProduct,
  useDeleteProductPermanently,
  useForceDeleteProduct,
} from '../../hooks/useProducts'
import { getErrorMessage } from '../../utils/handleApiError'
import { formatPrice } from '../../utils/formatMoney'

/**
 * Qué hacer con un producto que ya no querés ver: ocultarlo (desactivar),
 * borrarlo de verdad, o —si quedó atrapado por tener historial— borrarlo A LA
 * FUERZA arrastrando todo lo ligado (ventas, fiado, devoluciones, recepciones).
 *
 * Existe porque desactivar se confundía con borrar: el producto quedaba
 * escondido reteniendo su código y el protocolo saltaba al siguiente número.
 * El borrado normal solo se ofrece si nunca se usó; el forzado es el "último
 * seguro" para productos de prueba que sí se usaron. En ambos, el código
 * vuelve a quedar libre.
 */
export default function DeleteProductModal({ product, onClose, onDone }) {
  // Un producto ya oculto solo tiene un camino útil: borrarlo de verdad.
  const alreadyHidden = product.active === false
  const [choice, setChoice] = useState(alreadyHidden ? 'delete' : null)   // 'deactivate' | 'delete' | 'force'
  const [check, setCheck]   = useState(null)          // { deletable, reason }
  const [loadingCheck, setLoadingCheck] = useState(true)
  const [confirmText, setConfirmText]   = useState('')

  // Impacto del borrado forzado (se pide recién al elegir esa opción).
  const [force, setForce] = useState(null)            // ProductForceDeletePreview
  const [loadingForce, setLoadingForce] = useState(false)

  const deactivate = useDeactivateProduct()
  const deleteForever = useDeleteProductPermanently()
  const forceDelete = useForceDeleteProduct()

  useEffect(() => {
    let cancelled = false
    productsApi.checkDeletable(product.id)
      .then((r) => { if (!cancelled) setCheck(r.data.data) })
      .catch(() => { if (!cancelled) setCheck({ deletable: false, reason: 'No se pudo verificar el historial' }) })
      .finally(() => { if (!cancelled) setLoadingCheck(false) })
    return () => { cancelled = true }
  }, [product.id])

  const canDelete = check?.deletable === true
  // El producto está atrapado por historial (no por falta de permisos): ahí el
  // único camino real para liberar el código es el borrado forzado.
  const blockedByHistory = !canDelete && !!check?.reason && !check.reason.includes('dueño')
  const confirmed = confirmText.trim().toUpperCase() === 'BORRAR'
  const busy = deactivate.isPending || deleteForever.isPending || forceDelete.isPending

  // Al elegir "forzar", pedimos el impacto una sola vez.
  const pickForce = () => {
    setChoice('force')
    if (force || loadingForce) return
    setLoadingForce(true)
    productsApi.forceDeletePreview(product.id)
      .then((r) => setForce(r.data.data))
      .catch(() => toast.error('No se pudo calcular el impacto del borrado'))
      .finally(() => setLoadingForce(false))
  }

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
      } else if (choice === 'force') {
        await forceDelete.mutateAsync(product.id)
        toast.success(`"${product.name}" y todo su historial fueron borrados. El código ${product.sku} volvió a quedar libre.`)
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

  const optionCls = (active, tone = 'blue') =>
    `w-full rounded-xl border p-4 text-left transition-colors ${
      active
        ? tone === 'red'
          ? 'border-red-600 bg-red-50/60 ring-2 ring-red-600/15'
          : 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/15'
        : 'border-gray-200 bg-white hover:bg-gray-50'
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

        <div className="space-y-3 px-6 py-5 max-h-[70vh] overflow-y-auto">
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

          {/* Opción 2 — borrar de verdad (sin historial) */}
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
            {!loadingCheck && !canDelete && !blockedByHistory && check?.reason && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
                <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                {check.reason}: solo puede ocultarse.
              </p>
            )}
          </button>

          {/* Opción 3 — borrado FORZADO en cascada (producto atrapado por historial) */}
          {blockedByHistory && (
            <button type="button" onClick={pickForce} className={optionCls(choice === 'force', 'red')}>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Flame size={15} className="text-red-600" />
                Borrar el producto y TODO su historial
                {loadingForce && <Loader2 size={13} className="animate-spin text-gray-400" />}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Este producto tiene movimientos ({check.reason.toLowerCase()}), así que el borrado normal
                no lo deja. Esta opción arrasa con <b>todo lo ligado</b> —ventas, fiado, devoluciones y
                recepciones— y <b>libera su código {product.sku}</b>. Pensada para productos de prueba.
              </p>
            </button>
          )}

          {/* Detalle de impacto del borrado forzado */}
          {choice === 'force' && (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5">
              {loadingForce && (
                <p className="flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 size={13} className="animate-spin" /> Calculando qué se va a borrar…
                </p>
              )}

              {!loadingForce && force && !force.owner && (
                <p className="flex items-start gap-1.5 text-xs text-amber-800">
                  <AlertTriangle size={14} className="mt-px flex-shrink-0" />
                  Solo el dueño del negocio puede hacer un borrado forzado.
                </p>
              )}

              {!loadingForce && force && force.owner && (
                <>
                  <p className="mb-2 text-xs font-semibold text-red-800">Se borrará definitivamente:</p>
                  <ul className="space-y-1 text-xs text-gray-700">
                    {force.salesCount > 0 && (
                      <li>• <b>{force.salesCount}</b> {force.salesCount === 1 ? 'venta completa' : 'ventas completas'}</li>
                    )}
                    {force.returnsCount > 0 && (
                      <li>• <b>{force.returnsCount}</b> {force.returnsCount === 1 ? 'devolución' : 'devoluciones'}</li>
                    )}
                    {force.customerCreditsCount > 0 && (
                      <li>• <b>{force.customerCreditsCount}</b> {force.customerCreditsCount === 1 ? 'fiado de cliente' : 'fiados de cliente'}
                        {force.customerDebtRemoved > 0 && <> (se descuenta <b>{formatPrice(force.customerDebtRemoved)}</b> de deuda)</>}</li>
                    )}
                    {force.receiptsCount > 0 && (
                      <li>• <b>{force.receiptsCount}</b> {force.receiptsCount === 1 ? 'recepción de proveedor' : 'recepciones de proveedor'}</li>
                    )}
                    {force.supplierCreditsCount > 0 && (
                      <li>• <b>{force.supplierCreditsCount}</b> {force.supplierCreditsCount === 1 ? 'deuda con proveedor' : 'deudas con proveedor'}
                        {force.supplierDebtRemoved > 0 && <> (se descuenta <b>{formatPrice(force.supplierDebtRemoved)}</b>)</>}</li>
                    )}
                    {force.stockMovementsCount > 0 && (
                      <li>• <b>{force.stockMovementsCount}</b> {force.stockMovementsCount === 1 ? 'movimiento de stock' : 'movimientos de stock'}</li>
                    )}
                    <li>• el producto <b>{product.name}</b> (código {product.sku} liberado)</li>
                  </ul>

                  {force.otherProducts?.length > 0 && (
                    <div className="mt-2.5 rounded-lg bg-amber-100/70 px-2.5 py-2 text-[11px] text-amber-900">
                      <p className="flex items-start gap-1.5 font-semibold">
                        <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                        ¡Atención! Esas ventas/recepciones también tienen otros productos, y su historial
                        se borrará junto:
                      </p>
                      <p className="mt-1 pl-4">{force.otherProducts.join(', ')}</p>
                    </div>
                  )}

                  <div className="mt-3">
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
                </>
              )}
            </div>
          )}

          {/* Confirmación tipeada para el borrado real (sin historial) */}
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
            disabled={
              !choice || busy ||
              (choice === 'delete' && !confirmed) ||
              (choice === 'force' && (!force?.owner || !confirmed))
            }
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
              choice === 'delete' || choice === 'force'
                ? 'bg-red-600 shadow-red-600/30 hover:bg-red-700'
                : 'bg-amber-600 shadow-amber-600/30 hover:bg-amber-700'
            }`}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {busy
              ? 'Aplicando...'
              : choice === 'force'
                ? 'Borrar todo'
                : choice === 'delete'
                  ? 'Borrar definitivamente'
                  : 'Ocultar producto'}
          </button>
        </div>
      </div>
    </div>
  )
}
