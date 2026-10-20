import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Zap, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { useQuickCreateProduct } from '../../hooks/useProducts'
import PriceInput from '../inputs/PriceInput'
import { getErrorMessage, getErrorCode } from '../../utils/handleApiError'
import { useT } from '../../i18n'

const UNITS = ['unidad', 'kg', 'metro', 'litro', 'paquete', 'caja', 'bolsa', 'par']

/**
 * Crear un producto AL VUELO desde Nueva venta (Frank, 20-oct-2026, task 1014):
 * nombre + precio y a vender. Es un producto REAL, marcado «por completar»
 * (sin costo, sin stock, proveedor por asignar); el dueño lo termina después
 * desde Productos. Montado en portal (regla: todo modal que se abre desde una
 * lista va en document.body).
 */
export default function QuickProductModal({ initialName = '', barcode = '', onClose, onCreated }) {
  const t = useT()
  const create = useQuickCreateProduct()
  const [name, setName]   = useState(initialName)
  const [price, setPrice] = useState(null)
  const [unit, setUnit]   = useState('unidad')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !create.isPending) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, create.isPending])

  const valid = name.trim().length > 0 && price != null && Number(price) > 0

  const submit = async (e) => {
    e.preventDefault()
    if (!valid) return
    setError('')
    try {
      const product = await create.mutateAsync({ name: name.trim(), salePrice: Number(price), unit, barcode: barcode || undefined })
      toast.success(t('«{name}» creado y agregado. Complétalo después en Productos.', { name: product.name }))
      onCreated(product)
    } catch (err) {
      setError(getErrorCode(err) === 'DUPLICATE_PRODUCT_NAME'
        ? t('Ya tienes un producto con ese nombre: búscalo arriba y agrégalo.')
        : getErrorMessage(err))
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={() => !create.isPending && onClose()}>
      <form onSubmit={submit} noValidate onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="relative overflow-hidden bg-blue-600 px-5 pb-5 pt-4 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/80"><Zap size={13} /> {t('Crear y vender ahora')}</p>
            <button type="button" onClick={onClose} aria-label={t('Cerrar')} className="rounded-xl p-1.5 text-white/80 hover:bg-white/15 hover:text-white"><X size={20} /></button>
          </div>
          <p className={`relative mt-3 break-words text-2xl font-extrabold leading-tight ${name.trim() ? '' : 'text-white/50'}`}>{name.trim() || t('Nombre del producto')}</p>
          <p className="relative mt-1 text-xs text-white/80">{t('Queda guardado de verdad, marcado «por completar»: el costo, el stock y el proveedor los pones después.')}</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">{t('Nombre')}</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Ej.: Clavos 2" (kg)')} className={inputCls} data-testid="quick-name" />
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <PriceInput label={t('Precio de venta')} value={price} onChange={setPrice} />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">{t('Unidad')}</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
                {UNITS.map((u) => <option key={u} value={u}>{t(u)}</option>)}
              </select>
            </div>
          </div>
          {barcode && (
            <p className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <ScanLine size={14} className="text-blue-600" /> {t('Código de barras')}: <span className="font-mono">{barcode}</span>
            </p>
          )}
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100">{t('Cancelar')}</button>
          <button type="submit" disabled={!valid || create.isPending} data-testid="quick-submit"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {create.isPending ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            {t('Crear y agregar al carrito')}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
