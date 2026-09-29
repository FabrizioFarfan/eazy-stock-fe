import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Loader2, Check, ArrowRight, Package } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useT } from '../../i18n'

/**
 * Marco común de los modales de Marca, Categoría y Ubicación (rediseño 29-sep,
 * Frank): cabecera azul con vista previa en vivo de cómo se verá la tarjeta,
 * campos grandes, «Ver sus productos» al editar y pie con el botón principal.
 * En el celular sube como hoja desde abajo.
 */
export default function EntityModal({
  onClose, onSubmit, isEdit, title, subtitle, avatar, previewName, placeholderName,
  productFilter, submitting, submitLabel, error, children,
}) {
  const t = useT()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  // Cuántos productos usan este registro (solo al editar).
  const { data: count } = useProducts(
    { page: 0, size: 1, active: true, ...(productFilter?.params ?? {}) },
    { enabled: !!(isEdit && productFilter) },
  )
  const n = count?.totalElements

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={() => !submitting && onClose()}>
      <form onSubmit={onSubmit} noValidate onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">

        {/* Cabecera con vista previa */}
        <div className="relative overflow-hidden bg-blue-600 px-5 pb-5 pt-4 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">{title}</p>
            <button type="button" onClick={onClose} aria-label={t('Cerrar')}
              className="rounded-xl p-1.5 text-white/80 hover:bg-white/15 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="relative mt-3 flex items-center gap-4">
            {avatar}
            <div className="min-w-0">
              <p className={`break-words text-2xl font-extrabold leading-tight ${previewName ? '' : 'text-white/50'}`}>
                {previewName || placeholderName}
              </p>
              {subtitle && <p className="mt-0.5 text-xs text-white/80">{subtitle}</p>}
            </div>
          </div>
        </div>

        {/* Campos */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {children}

          {isEdit && productFilter && (
            <Link to={productFilter.to} onClick={onClose}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 transition-colors hover:border-blue-200 hover:bg-blue-50/50">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Package size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-gray-900">
                  {n == null ? t('Ver sus productos') : n === 0 ? t('Todavía sin productos') : t('Ver sus {n} producto(s)', { n })}
                </span>
                <span className="block text-xs text-gray-400">{t('Abre Productos ya filtrado')}</span>
              </span>
              <ArrowRight size={16} className="text-gray-300 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{error}</p>
          )}
        </div>

        {/* Pie */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100">
            {t('Cancelar')}
          </button>
          <button type="submit" disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60">
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {submitting ? t('Guardando...') : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

// Campo con etiqueta grande y ayuda.
export function EntityField({ label, hint, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-gray-800">{label}</label>
      {hint && <p className="-mt-1 mb-2 text-xs text-gray-400">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
