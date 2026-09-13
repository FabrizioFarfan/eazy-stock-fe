import { useEffect, useState } from 'react'
import { X, Loader2, AlertTriangle, Trash2, EyeOff, Check, Flame, Archive, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '../../services/endpoints/products'
import {
  useDeactivateProduct,
  useDeleteProductPermanently,
  useDeleteProductKeepHistory,
  useForceDeleteProduct,
} from '../../hooks/useProducts'
import { getErrorMessage } from '../../utils/handleApiError'
import { formatPrice } from '../../utils/formatMoney'
import { formatQtyWithUnit } from '../../utils/quantity'
import { useT } from '../../i18n'

/**
 * Qué hacer con un producto que ya no querés ver. Cuatro caminos, y el modal
 * solo muestra los que aplican:
 *
 *  1. OCULTAR — para lo que SÍ va a volver (temporada, el proveedor lo repone).
 *     Conserva todo, el código queda reservado, se ve en «Ocultos».
 *  2. BORRAR DEFINITIVAMENTE — solo si nunca se usó (sin ventas ni
 *     recepciones). Desaparece y libera el código.
 *  3. BORRAR CONSERVANDO EL HISTORIAL — pedido de William (sep-2026): para lo
 *     que ya no volverá pero tiene ventas/recepciones. Sale de Productos, de
 *     Ocultos y del POS; el stock queda en 0 con un ajuste anotado; el código
 *     se retira; ventas y recepciones intactas; copia plana en «Borrados»
 *     desde donde se restaura. Es el camino recomendado cuando hay historial.
 *  4. BORRAR CON TODO SU HISTORIAL (forzado) — el «último seguro» para productos
 *     de prueba que sí se usaron. Arrasa ventas, fiado, devoluciones y
 *     recepciones. Queda plegado como opción avanzada.
 *
 * Seguridad tipo GitHub (idea de Frank): para cualquier borrado hay que
 * escribir el NOMBRE del producto tal como se muestra, no una palabra genérica.
 */
export default function DeleteProductModal({ product, onClose, onDone }) {
  const t = useT()
  const alreadyHidden = product.active === false
  const [choice, setChoice] = useState(null)      // 'deactivate' | 'delete' | 'keep' | 'force'
  const [check, setCheck]   = useState(null)      // { deletable, reason }
  const [loadingCheck, setLoadingCheck] = useState(true)
  const [confirmText, setConfirmText]   = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Impacto (ventas/recepciones ligadas). Lo usan «conservar» (para decir qué
  // se conserva) y «forzado» (para decir qué se arrasa). Se pide una sola vez.
  const [impact, setImpact] = useState(null)      // ProductForceDeletePreview
  const [loadingImpact, setLoadingImpact] = useState(false)

  const deactivate    = useDeactivateProduct()
  const deleteForever = useDeleteProductPermanently()
  const keepHistory   = useDeleteProductKeepHistory()
  const forceDelete   = useForceDeleteProduct()

  useEffect(() => {
    let cancelled = false
    productsApi.checkDeletable(product.id)
      .then((r) => {
        if (cancelled) return
        const c = r.data.data
        setCheck(c)
        // Un producto ya oculto solo tiene un camino útil: borrarlo. Elegimos
        // el que aplica para ahorrarle el clic.
        if (alreadyHidden) {
          const blocked = !c.deletable && !!c.reason && !c.reason.includes('dueño')
          if (c.deletable) setChoice('delete')
          else if (blocked) pickWithImpact('keep')
        }
      })
      .catch(() => { if (!cancelled) setCheck({ deletable: false, reason: t('No se pudo verificar el historial') }) })
      .finally(() => { if (!cancelled) setLoadingCheck(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  const canDelete = check?.deletable === true
  // Atrapado por historial (no por falta de permisos): ahí se ofrecen
  // «conservar el historial» (recomendado) y el forzado (avanzado).
  const blockedByHistory = !canDelete && !!check?.reason && !check.reason.includes('dueño')

  // Confirmación tipo GitHub: el nombre del producto, sin importar mayúsculas
  // ni espacios de más.
  const norm = (s) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase()
  const confirmed = norm(confirmText) === norm(product.name)
  const needsConfirm = choice === 'delete' || choice === 'keep' || choice === 'force'
  const busy = deactivate.isPending || deleteForever.isPending || keepHistory.isPending || forceDelete.isPending

  const pickWithImpact = (which) => {
    setChoice(which)
    if (impact || loadingImpact) return
    setLoadingImpact(true)
    productsApi.forceDeletePreview(product.id)
      .then((r) => setImpact(r.data.data))
      .catch(() => toast.error(t('No se pudo calcular el impacto del borrado')))
      .finally(() => setLoadingImpact(false))
  }

  const run = async () => {
    try {
      if (choice === 'deactivate') {
        await deactivate.mutateAsync(product.id)
        toast.success(t('"{name}" quedó oculto. Su código {sku} sigue reservado.', { name: product.name, sku: product.sku }), {
          description: t('Lo encontrás con el filtro "Ocultos" de Productos.'),
          duration: 8000,
          action: {
            label: t('Ver ocultos'),
            onClick: () => window.dispatchEvent(new CustomEvent('eazystock:show-hidden-products')),
          },
        })
      } else if (choice === 'keep') {
        await keepHistory.mutateAsync(product.id)
        toast.success(t('"{name}" se borró del catálogo. Sus ventas y recepciones siguen intactas.', { name: product.name }), {
          description: t('Su stock quedó en 0 y su código {sku} queda retirado. Lo encuentras en «Borrados» si hace falta restaurarlo.', { sku: product.sku }),
          duration: 9000,
          action: {
            label: t('Ver borrados'),
            onClick: () => window.dispatchEvent(new CustomEvent('eazystock:show-deleted-products')),
          },
        })
      } else if (choice === 'force') {
        await forceDelete.mutateAsync(product.id)
        toast.success(t('"{name}" y todo su historial fueron borrados. El código {sku} volvió a quedar libre.', { name: product.name, sku: product.sku }))
      } else {
        await deleteForever.mutateAsync(product.id)
        toast.success(t('"{name}" borrado. El código {sku} volvió a quedar libre.', { name: product.name, sku: product.sku }))
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

  const confirmName = (
    <div className="mt-3">
      <label className="mb-1.5 block text-xs font-medium text-red-800">
        {t('Para confirmar, escribe el nombre del producto tal como aparece:')}
      </label>
      <p className="mb-1.5 select-none rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-gray-900 ring-1 ring-red-100">
        {product.name}
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={t('Escribe el nombre aquí')}
        autoComplete="off"
        className="w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      />
      {confirmText && !confirmed && (
        <p className="mt-1 text-[11px] text-red-700">{t('Todavía no coincide con el nombre del producto.')}</p>
      )}
    </div>
  )

  const hasStock = Number(product.currentStock) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-red-600" />
            <h3 className="text-base font-bold text-gray-900">{t('Quitar producto')}</h3>
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
              {t('Este producto ya está oculto: su código sigue reservado. Si no va a volver, bórralo; si va a volver, cierra y usa "Reactivar".')}
            </p>
          )}

          {/* Opción 1 — ocultar (para lo que SÍ vuelve) */}
          {!alreadyHidden && (
          <button type="button" onClick={() => setChoice('deactivate')} className={optionCls(choice === 'deactivate')}>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <EyeOff size={15} className="text-amber-600" />
              {t('Ocultar del catálogo')}
              <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100">{t('va a volver')}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              {t('Para lo que SÍ vas a volver a vender (de temporada, el proveedor lo repone). Deja de aparecer y de venderse, conserva su historial y')}{' '}
              <b>{t('su código {sku} queda reservado', { sku: product.sku })}</b>. {t('Lo encuentras en')}{' '}
              <b>{t('"Ocultos"')}</b> {t('para reactivarlo cuando vuelva.')}
            </p>
          </button>
          )}

          {/* Opción 2 — borrar de verdad (nunca se usó) */}
          {(canDelete || loadingCheck || (!blockedByHistory && !canDelete)) && (
          <button
            type="button"
            onClick={() => canDelete && setChoice('delete')}
            disabled={!canDelete || loadingCheck}
            className={`${optionCls(choice === 'delete', 'red')} ${!canDelete || loadingCheck ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Trash2 size={15} className="text-red-600" />
              {t('Borrar definitivamente')}
              {loadingCheck && <Loader2 size={13} className="animate-spin text-gray-400" />}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              {t('Nunca se vendió ni se recibió: desaparece del sistema y')} <b>{t('su código {sku} vuelve a quedar libre', { sku: product.sku })}</b> {t('para el próximo producto. Para productos de prueba o creados por error.')}
            </p>
            {!loadingCheck && !canDelete && !blockedByHistory && check?.reason && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
                <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                {check.reason}: {t('solo puede ocultarse.')}
              </p>
            )}
          </button>
          )}

          {/* Opción 3 — borrar CONSERVANDO el historial (para lo que no vuelve) */}
          {blockedByHistory && (
            <button type="button" onClick={() => pickWithImpact('keep')} className={optionCls(choice === 'keep', 'red')}>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Archive size={15} className="text-red-600" />
                {t('Borrar del catálogo (conserva el historial)')}
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">{t('recomendado')}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {t('Para lo que ya no volverá (descontinuado o que ya no te interesa). Desaparece de Productos, de Ocultos y del punto de venta; el stock queda en 0 con un ajuste anotado y')}{' '}
                <b>{t('su código {sku} se retira', { sku: product.sku })}</b>. {t('Sus ventas, devoluciones y recepciones quedan intactas, y guarda una copia en')}{' '}
                <b>{t('"Borrados"')}</b> {t('por si hay que restaurarlo.')}
              </p>
            </button>
          )}

          {/* Detalle de «conservar»: qué se conserva y qué pasa con el stock */}
          {choice === 'keep' && (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5">
              {loadingImpact && (
                <p className="flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 size={13} className="animate-spin" /> {t('Revisando su historial…')}
                </p>
              )}
              {!loadingImpact && impact && !impact.owner && (
                <p className="flex items-start gap-1.5 text-xs text-amber-800">
                  <AlertTriangle size={14} className="mt-px flex-shrink-0" />
                  {t('Solo el dueño del negocio puede borrar productos.')}
                </p>
              )}
              {!loadingImpact && impact && impact.owner && (
                <>
                  <p className="mb-2 text-xs font-semibold text-red-800">{t('Qué pasa al borrarlo:')}</p>
                  <ul className="space-y-1 text-xs text-gray-700">
                    <li>• {t('Se conservan')} <b>{impact.salesCount}</b> {impact.salesCount === 1 ? t('venta') : t('ventas')}
                      {impact.returnsCount > 0 && <>, <b>{impact.returnsCount}</b> {impact.returnsCount === 1 ? t('devolución') : t('devoluciones')}</>}
                      {' '}{t('y')} <b>{impact.receiptsCount}</b> {impact.receiptsCount === 1 ? t('recepción') : t('recepciones')} {t('tal como están.')}</li>
                    {hasStock ? (
                      <li>• {t('Su stock pasa de')} <b>{formatQtyWithUnit(product.currentStock, product.unit)}</b> {t('a')} <b>0</b>: {t('queda un ajuste en Movimientos con el motivo "Producto borrado".')}</li>
                    ) : (
                      <li>• {t('Su stock ya está en 0.')}</li>
                    )}
                    <li>• {t('El código')} <b>{product.sku}</b> {t('se retira: no se vuelve a usar para otro producto.')}</li>
                    <li>• {t('Queda una copia completa en «Borrados», con la opción Restaurar.')}</li>
                  </ul>
                  {confirmName}
                </>
              )}
            </div>
          )}

          {/* Opción 4 — borrado FORZADO en cascada, plegado como avanzado */}
          {blockedByHistory && (
            <div>
              <button type="button" onClick={() => setAdvancedOpen((v) => !v)}
                className="flex w-full items-center gap-1.5 px-1 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700">
                {advancedOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {t('Opción avanzada: borrar también su historial')}
              </button>
              {advancedOpen && (
                <button type="button" onClick={() => pickWithImpact('force')} className={`mt-1 ${optionCls(choice === 'force', 'red')}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Flame size={15} className="text-red-600" />
                    {t('Borrar el producto y TODO su historial')}
                    {loadingImpact && <Loader2 size={13} className="animate-spin text-gray-400" />}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    {t('Arrasa con')} <b>{t('todo lo ligado')}</b> {t('—ventas, fiado, devoluciones y recepciones— y')}{' '}
                    <b>{t('libera su código {sku}', { sku: product.sku })}</b>. {t('Solo para productos de prueba: borra ventas reales de tus reportes.')}
                  </p>
                </button>
              )}
            </div>
          )}

          {/* Detalle de impacto del borrado forzado */}
          {choice === 'force' && (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5">
              {loadingImpact && (
                <p className="flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 size={13} className="animate-spin" /> {t('Calculando qué se va a borrar…')}
                </p>
              )}

              {!loadingImpact && impact && !impact.owner && (
                <p className="flex items-start gap-1.5 text-xs text-amber-800">
                  <AlertTriangle size={14} className="mt-px flex-shrink-0" />
                  {t('Solo el dueño del negocio puede hacer un borrado forzado.')}
                </p>
              )}

              {!loadingImpact && impact && impact.owner && (
                <>
                  <p className="mb-2 text-xs font-semibold text-red-800">{t('Se borrará definitivamente:')}</p>
                  <ul className="space-y-1 text-xs text-gray-700">
                    {impact.salesCount > 0 && (
                      <li>• <b>{impact.salesCount}</b> {impact.salesCount === 1 ? t('venta completa') : t('ventas completas')}</li>
                    )}
                    {impact.returnsCount > 0 && (
                      <li>• <b>{impact.returnsCount}</b> {impact.returnsCount === 1 ? t('devolución') : t('devoluciones')}</li>
                    )}
                    {impact.customerCreditsCount > 0 && (
                      <li>• <b>{impact.customerCreditsCount}</b> {impact.customerCreditsCount === 1 ? t('fiado de cliente') : t('fiados de cliente')}
                        {impact.customerDebtRemoved > 0 && <> ({t('se descuenta')} <b>{formatPrice(impact.customerDebtRemoved)}</b> {t('de deuda')})</>}</li>
                    )}
                    {impact.receiptsCount > 0 && (
                      <li>• <b>{impact.receiptsCount}</b> {impact.receiptsCount === 1 ? t('recepción de proveedor') : t('recepciones de proveedor')}</li>
                    )}
                    {impact.supplierCreditsCount > 0 && (
                      <li>• <b>{impact.supplierCreditsCount}</b> {impact.supplierCreditsCount === 1 ? t('deuda con proveedor') : t('deudas con proveedor')}
                        {impact.supplierDebtRemoved > 0 && <> ({t('se descuenta')} <b>{formatPrice(impact.supplierDebtRemoved)}</b>)</>}</li>
                    )}
                    {impact.stockMovementsCount > 0 && (
                      <li>• <b>{impact.stockMovementsCount}</b> {impact.stockMovementsCount === 1 ? t('movimiento de stock') : t('movimientos de stock')}</li>
                    )}
                    <li>• {t('el producto')} <b>{product.name}</b> ({t('código {sku} liberado', { sku: product.sku })})</li>
                  </ul>

                  {impact.otherProducts?.length > 0 && (
                    <div className="mt-2.5 rounded-lg bg-amber-100/70 px-2.5 py-2 text-[11px] text-amber-900">
                      <p className="flex items-start gap-1.5 font-semibold">
                        <AlertTriangle size={13} className="mt-px flex-shrink-0" />
                        {t('¡Atención! Esas ventas/recepciones también tienen otros productos, y su historial se borrará junto:')}
                      </p>
                      <p className="mt-1 pl-4">{impact.otherProducts.join(', ')}</p>
                    </div>
                  )}

                  <p className="mt-3 text-[11px] font-semibold text-red-800">{t('Esta acción no se puede deshacer.')}</p>
                  {confirmName}
                </>
              )}
            </div>
          )}

          {/* Confirmación tipeada para el borrado real (sin historial) */}
          {choice === 'delete' && (
            <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
              <p className="text-[11px] font-semibold text-red-800">{t('Esta acción no se puede deshacer.')}</p>
              {confirmName}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            {t('Cancelar')}
          </button>
          <button
            type="button"
            onClick={run}
            disabled={
              !choice || busy ||
              (needsConfirm && !confirmed) ||
              ((choice === 'keep' || choice === 'force') && !impact?.owner)
            }
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
              needsConfirm
                ? 'bg-red-600 shadow-red-600/30 hover:bg-red-700'
                : 'bg-amber-600 shadow-amber-600/30 hover:bg-amber-700'
            }`}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {busy
              ? t('Aplicando...')
              : choice === 'force'
                ? t('Borrar todo')
                : choice === 'keep'
                  ? t('Borrar del catálogo')
                  : choice === 'delete'
                    ? t('Borrar definitivamente')
                    : t('Ocultar producto')}
          </button>
        </div>
      </div>
    </div>
  )
}
