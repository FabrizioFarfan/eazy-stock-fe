import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Search, Loader2, ArrowDownToLine, SlidersHorizontal } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useCreateMovement } from '../../hooks/useStock'
import { useDebounce } from '../../hooks/useDebounce'

const entrySchema = z.object({
  quantity: z.coerce.number().int('Debe ser entero').positive('Debe ser mayor a 0'),
  notes: z.string().optional(),
})

const adjustSchema = z.object({
  quantity: z.coerce.number().int('Debe ser entero').refine((v) => v !== 0, 'No puede ser 0'),
  notes: z.string().optional(),
})

const TITLES = {
  PURCHASE_ENTRY: 'Registrar entrada',
  ADJUSTMENT:     'Ajuste de stock',
}

const ICONS = {
  PURCHASE_ENTRY: ArrowDownToLine,
  ADJUSTMENT:     SlidersHorizontal,
}

const ACCENT = {
  PURCHASE_ENTRY: 'text-emerald-600',
  ADJUSTMENT:     'text-amber-600',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder-gray-400 bg-white'

export default function MovementModal({ type, onClose }) {
  const [search, setSearch]                   = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showDropdown, setShowDropdown]       = useState(false)
  const debouncedSearch                       = useDebounce(search, 400)
  const createMovement                        = useCreateMovement()

  const schema = type === 'PURCHASE_ENTRY' ? entrySchema : adjustSchema
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const { data: productsData, isLoading: loadingProducts } = useProducts(
    debouncedSearch ? { search: debouncedSearch, size: 8, active: true } : null,
    { enabled: !!debouncedSearch },
  )
  const results = productsData?.content ?? []

  const selectProduct = (p) => {
    setSelectedProduct(p)
    setSearch(p.name)
    setShowDropdown(false)
  }

  const onSubmit = async ({ quantity, notes }) => {
    if (!selectedProduct) return
    try {
      await createMovement.mutateAsync({
        productId: selectedProduct.id,
        type,
        quantity: Number(quantity),
        ...(notes?.trim() && { notes: notes.trim() }),
      })
      onClose()
    } catch { /* error shown via createMovement.isError */ }
  }

  const TitleIcon = ICONS[type] ?? ArrowDownToLine

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <TitleIcon size={18} className={ACCENT[type]} />
            <h3 className="text-base font-bold text-gray-900">{TITLES[type]}</h3>
          </div>
          <button onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            {/* Product search */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Producto <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedProduct(null); setShowDropdown(true) }}
                  onFocus={() => search && setShowDropdown(true)}
                  placeholder="Buscar producto..."
                  className={`${inputCls} pl-10`}
                />
                {showDropdown && debouncedSearch && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-xl">
                    {loadingProducts ? (
                      <p className="px-4 py-3 text-sm text-gray-400">Buscando...</p>
                    ) : results.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
                    ) : (
                      results.map((p) => (
                        <button key={p.id} type="button" onClick={() => selectProduct(p)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-orange-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
                          <span className="font-semibold text-gray-900">{p.name}</span>
                          <span className="ml-2 flex-shrink-0 font-mono text-xs text-gray-400">{p.sku}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedProduct && (
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-2.5">
                  <div>
                    <span className="text-xs text-gray-500">Stock actual: </span>
                    <span className="text-sm font-bold text-gray-900">{selectedProduct.currentStock} uds.</span>
                  </div>
                  <span className="font-mono text-xs text-gray-400">{selectedProduct.sku}</span>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Cantidad <span className="text-red-400">*</span>
              </label>
              <input {...register('quantity')} type="number" step="1"
                placeholder={type === 'ADJUSTMENT' ? 'Ej. -5 o +10' : 'Ej. 50'}
                className={inputCls} />
              {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity.message}</p>}
              {type === 'ADJUSTMENT' && (
                <p className="mt-1 text-xs text-gray-400">Positivo para agregar, negativo para reducir</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas</label>
              <textarea {...register('notes')} rows={2}
                placeholder="Observaciones opcionales..."
                className={`${inputCls} resize-none`} />
            </div>

            {createMovement.isError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                {createMovement.error?.response?.data?.message ?? 'Error al registrar el movimiento'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={!selectedProduct || createMovement.isPending}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/30 hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-60">
              {createMovement.isPending && <Loader2 size={14} className="animate-spin" />}
              {createMovement.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
