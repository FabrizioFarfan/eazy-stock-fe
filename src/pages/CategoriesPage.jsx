import { useState } from 'react'
import { Plus, Search, FolderOpen, Edit, Trash2, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import { useDebounce } from '../hooks/useDebounce'

const schema = z.object({
  name:        z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().optional(),
})

const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

const CAT_COLORS = [
  'bg-blue-50 text-blue-600',
  'bg-indigo-50 text-indigo-600',
  'bg-violet-50 text-violet-600',
  'bg-teal-50 text-teal-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-rose-50 text-rose-600',
  'bg-cyan-50 text-cyan-600',
  'bg-pink-50 text-pink-600',
]
const catColor = (name = '') => CAT_COLORS[(name.charCodeAt(0) || 0) % CAT_COLORS.length]

// ── Category modal ────────────────────────────────────────────────────────────

function CategoryModal({ category, onClose }) {
  const isEdit   = !!category
  const create   = useCreateCategory()
  const update   = useUpdateCategory()
  const mutation = isEdit ? update : create

  const [attrInput, setAttrInput]         = useState('')
  const [suggestedAttrs, setSuggestedAttrs] = useState(
    category?.suggestedAttributes ?? [],
  )

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? { name: category.name, description: category.description ?? '' } : {},
  })

  const addAttr = () => {
    const v = attrInput.trim()
    if (v && !suggestedAttrs.includes(v)) {
      setSuggestedAttrs((prev) => [...prev, v])
    }
    setAttrInput('')
  }

  const removeAttr = (attr) =>
    setSuggestedAttrs((prev) => prev.filter((a) => a !== attr))

  const onSubmit = async (values) => {
    try {
      const payload = { ...values, suggestedAttributes: suggestedAttrs }
      if (isEdit) await update.mutateAsync({ id: category.id, data: payload })
      else        await create.mutateAsync(payload)
      onClose()
    } catch (_) {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className="text-base font-bold text-gray-900">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h3>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre *</label>
              <input {...register('name')} placeholder="Ej. Herramientas manuales" className={inputCls} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
              <textarea {...register('description')} rows={2}
                placeholder="Descripción opcional"
                className={`${inputCls} resize-none`} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Atributos sugeridos
              </label>
              <p className="mb-2 text-xs text-gray-400">
                Los atributos que aparecerán como chips al crear productos de esta categoría.
              </p>
              <div className="flex gap-2">
                <input
                  value={attrInput}
                  onChange={(e) => setAttrInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttr() } }}
                  placeholder="Ej. material, longitud..."
                  className={`${inputCls} flex-1`}
                />
                <button type="button" onClick={addAttr}
                  className="flex items-center rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              {suggestedAttrs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestedAttrs.map((attr) => (
                    <span key={attr}
                      className="flex items-center gap-1 rounded-full bg-blue-100 py-0.5 pl-2.5 pr-1.5 text-xs font-semibold text-blue-700">
                      {attr}
                      <button type="button" onClick={() => removeAttr(attr)}
                        className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {mutation.isError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                {mutation.error?.response?.data?.message ?? 'Error al guardar'}
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

// ── Category card ─────────────────────────────────────────────────────────────

function CategoryCard({ category, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const initial  = category.name[0]?.toUpperCase() ?? '?'
  const colorCls = catColor(category.name)
  const attrs    = category.suggestedAttributes ?? []

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4 p-4 group">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold ${colorCls}`}>
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{category.name}</p>
          {category.description && (
            <p className="mt-0.5 text-xs text-gray-400 truncate">{category.description}</p>
          )}
          {attrs.length > 0 && (
            <p className="mt-0.5 text-xs text-gray-400">{attrs.length} atributo{attrs.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex gap-1 items-center">
          {attrs.length > 0 && (
            <button onClick={() => setExpanded((v) => !v)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(category)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
              <Edit size={14} />
            </button>
            <button onClick={() => onDelete(category)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
      {expanded && attrs.length > 0 && (
        <div className="border-t border-gray-50 px-4 pb-3 pt-2">
          <div className="flex flex-wrap gap-1.5">
            {attrs.map((attr) => (
              <span key={attr}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {attr}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)
  const debouncedSearch     = useDebounce(search, 400)
  const deleteCategory      = useDeleteCategory()

  const { data, isLoading } = useCategories({
    size: 50,
    ...(debouncedSearch && { search: debouncedSearch }),
  })
  const categories = data?.content ?? []

  const handleDelete = async (c) => {
    if (!window.confirm(`¿Eliminar "${c.name}"?\nEsto fallará si tiene productos asociados.`)) return
    try { await deleteCategory.mutateAsync(c.id) }
    catch (err) { alert(err?.response?.data?.message ?? 'Error al eliminar') }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
          {!isLoading && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {data?.totalElements ?? 0}
            </span>
          )}
        </div>
        <button onClick={() => setModal({ category: null })}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]">
          <Plus size={15} />
          Nueva categoría
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar categoría..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <FolderOpen size={28} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">No hay categorías aún</p>
            <p className="mt-1 text-xs text-gray-400">
              {search ? `Sin resultados para "${search}"` : 'Crea categorías para organizar tus productos'}
            </p>
          </div>
          {!search && (
            <button onClick={() => setModal({ category: null })}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]">
              <Plus size={14} />
              Agregar categoría
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c}
              onEdit={(cat) => setModal({ category: cat })}
              onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal !== null && (
        <CategoryModal category={modal.category} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
