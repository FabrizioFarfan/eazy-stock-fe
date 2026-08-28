import { useState } from 'react'
import { X, Loader2, AlertTriangle, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '../../services/endpoints/products'
import { useBulkDeleteProducts } from '../../hooks/useProducts'
import { getErrorMessage } from '../../utils/handleApiError'
import { localISODate } from '../../utils/formatDate'
import { useT } from '../../i18n'

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

/**
 * Borrado masivo de productos por rango de fecha de creación. Operación delicada:
 *  1. El OWNER elige el rango y previsualiza (cuántos se borran vs se omiten).
 *  2. Para habilitar el borrado debe tipear exactamente la cantidad a borrar.
 *  3. Recién ahí se ejecuta. Los productos con ventas/recepciones se preservan.
 */
export default function BulkDeleteModal({ onClose }) {
  const t = useT()
  const today = localISODate()
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState(today)
  const [preview, setPreview] = useState(null)   // { total, deletable, withHistory }
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [confirmText, setConfirmText]       = useState('')
  const bulkDelete = useBulkDeleteProducts()

  const validRange = from && to && from <= to

  const runPreview = async () => {
    if (!validRange) return
    setLoadingPreview(true)
    setPreview(null)
    setConfirmText('')
    try {
      const data = (await productsApi.bulkDeletePreview(from, to)).data.data
      setPreview(data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoadingPreview(false)
    }
  }

  // Al tocar las fechas se invalida el preview previo (evita borrar con un conteo viejo).
  const onRangeChange = (setter) => (e) => {
    setter(e.target.value)
    setPreview(null)
    setConfirmText('')
  }

  const canDelete = preview && preview.deletable > 0
    && confirmText.trim() === String(preview.deletable)

  const handleDelete = async () => {
    if (!canDelete) return
    try {
      const res = await bulkDelete.mutateAsync({ from, to })
      toast.success(t('{n} producto(s) borrado(s).', { n: res.deleted })
        + (res.skipped > 0 ? ' ' + t('{n} omitido(s) por tener ventas/recepciones.', { n: res.skipped }) : ''))
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-red-600" />
            <h3 className="text-base font-bold text-gray-900">{t('Borrar productos en masa')}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800 ring-1 ring-amber-100">
            {t('Borra los productos creados dentro del rango de fechas (útil para deshacer un import equivocado).')}{' '}
            <b>{t('Ojo: cuenta la fecha en que el producto se creó por primera vez')}</b> — {t('un import que solo actualiza productos existentes no cambia esa fecha.')}{' '}
            {t('Los que ya tienen ventas o recepciones se preservan.')}{' '}
            <b>{t('Esta acción no se puede deshacer.')}</b>
          </p>

          {/* Rango de fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Desde')}</label>
              <input type="date" value={from} max={to || today} onChange={onRangeChange(setFrom)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Hasta')}</label>
              <input type="date" value={to} max={today} onChange={onRangeChange(setTo)} className={inputCls} />
            </div>
          </div>

          <button
            type="button"
            onClick={runPreview}
            disabled={!validRange || loadingPreview}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loadingPreview ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loadingPreview ? t('Calculando...') : t('Previsualizar')}
          </button>

          {/* Resultado del preview + confirmación */}
          {preview && (
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              {preview.total === 0 ? (
                <p className="text-sm text-gray-500">
                  {t('No hay productos creados en ese rango. Si buscás deshacer un import, revisá en el historial de imports cuántos productos creó (los actualizados mantienen su fecha de creación original).')}
                </p>
              ) : (
                <>
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-red-500" />
                    <p className="text-gray-700">
                      {t('Se borrarán')} <b className="text-red-600">{preview.deletable}</b> {t('producto(s).')}
                      {preview.withHistory > 0 && (
                        <> {t('Se omitirán')} <b>{preview.withHistory}</b> {t('por tener ventas/recepciones.')}</>
                      )}
                    </p>
                  </div>

                  {preview.deletable > 0 && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        {t('Para confirmar, escribí el número')} <b>{preview.deletable}</b>:
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={String(preview.deletable)}
                        className={inputCls}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            {t('Cancelar')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || bulkDelete.isPending}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-600/30 hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {bulkDelete.isPending && <Loader2 size={14} className="animate-spin" />}
            {bulkDelete.isPending ? t('Borrando...') : t('Borrar definitivamente')}
          </button>
        </div>
      </div>
    </div>
  )
}
