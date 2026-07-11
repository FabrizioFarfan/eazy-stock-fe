import { useState } from 'react'
import { Plus, Search, Tag, Edit, Trash2, Loader2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '../hooks/useBrands'
import { useDebounce } from '../hooks/useDebounce'
import { getErrorMessage, getErrorField } from '../utils/handleApiError'
import HelpDrawer from '../components/common/HelpDrawer'

const schema = z.object({
  name:  z.string().min(2, 'Mínimo 2 caracteres'),
  notes: z.string().optional(),
})

const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

const BRAND_COLORS = [
  'bg-blue-50 text-blue-600',
  'bg-indigo-50 text-indigo-600',
  'bg-violet-50 text-violet-600',
  'bg-pink-50 text-pink-600',
  'bg-rose-50 text-rose-600',
  'bg-amber-50 text-amber-600',
  'bg-teal-50 text-teal-600',
  'bg-cyan-50 text-cyan-600',
]
function brandColor(name = '') {
  return BRAND_COLORS[(name.charCodeAt(0) || 0) % BRAND_COLORS.length]
}

// ── Brand modal ───────────────────────────────────────────────────────────────

function BrandModal({ brand, onClose }) {
  const isEdit   = !!brand
  const create   = useCreateBrand()
  const update   = useUpdateBrand()
  const mutation = isEdit ? update : create

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? { name: brand.name, notes: brand.notes ?? '' } : {},
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) await update.mutateAsync({ id: brand.id, data: values })
      else await create.mutateAsync(values)
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      if (field && ['name', 'notes'].includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className="text-base font-bold text-gray-900">
            {isEdit ? 'Editar marca' : 'Nueva marca'}
          </h3>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre *</label>
              <input {...register('name')} placeholder="Ej. Castrol, 3M, Bosch" className={inputCls} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas</label>
              <textarea {...register('notes')} rows={2}
                placeholder="Observaciones opcionales"
                className={`${inputCls} resize-none`} />
            </div>
            {mutation.isError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                {getErrorMessage(mutation.error)}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Brand card ────────────────────────────────────────────────────────────────

function BrandCard({ brand, onEdit, onDelete }) {
  const initial = brand.name[0]?.toUpperCase() ?? '?'
  const colorCls = brandColor(brand.name)

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all group">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold ${colorCls}`}>
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 truncate">{brand.name}</p>
        {brand.notes && (
          <p className="mt-0.5 text-xs text-gray-400 truncate">{brand.notes}</p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(brand)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
          <Edit size={14} />
        </button>
        <button onClick={() => onDelete(brand)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BrandsPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)
  const debouncedSearch     = useDebounce(search, 400)
  const deleteBrand         = useDeleteBrand()

  const { data, isLoading } = useBrands({
    size: 50,
    ...(debouncedSearch && { search: debouncedSearch }),
  })
  const brands = data?.content ?? []

  const handleDelete = async (b) => {
    if (!window.confirm(`¿Eliminar "${b.name}"?\nEsto fallará si tiene productos asociados.`)) return
    try { await deleteBrand.mutateAsync(b.id) }
    catch (err) { alert(getErrorMessage(err)) }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Marcas</h2>
          <HelpDrawer title="Cómo usar Marcas" autoOpenKey="eazystock_brands_help_v1">
            <p>Registra las <strong>marcas</strong> de lo que vendes y asígnalas a tus productos.</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🔎 ¿Para qué sirven?</p>
              <p className="mt-1">Para <strong>filtrar el catálogo</strong> y para los reportes: puedes ver cuánto vendes de cada marca y decidir cuáles te convienen más.</p>
            </div>
          </HelpDrawer>
          {!isLoading && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {data?.totalElements ?? 0}
            </span>
          )}
        </div>
        <button onClick={() => setModal({ brand: null })}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]">
          <Plus size={15} />
          Nueva marca
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar marca..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Tag size={28} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">No hay marcas aún</p>
            <p className="mt-1 text-xs text-gray-400">Agrega marcas para organizarlas en tus productos</p>
          </div>
          <button onClick={() => setModal({ brand: null })}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]">
            <Plus size={14} />
            Agregar marca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {brands.map((b) => (
            <BrandCard key={b.id} brand={b}
              onEdit={(br) => setModal({ brand: br })}
              onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal !== null && <BrandModal brand={modal.brand} onClose={() => setModal(null)} />}
    </div>
  )
}
