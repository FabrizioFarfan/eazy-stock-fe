import { useMemo, useState } from 'react'
import { Plus, Tag, Loader2, X } from 'lucide-react'
import { CatalogSwitcher, ReportHero, ReportHeader, BigSearch, NewButton, EntityCard } from '../components/reports/ReportKit'
import { useProducts } from '../hooks/useProducts'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '../hooks/useBrands'
import { useAuth } from '../context/AuthContext'
import { adminBizParam } from '../utils/adminBiz'
import { useDebounce } from '../hooks/useDebounce'
import { getErrorMessage, getErrorField } from '../utils/handleApiError'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'

const makeSchema = (t) => z.object({
  name:  z.string().min(2, t('Mínimo 2 caracteres')),
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
  const t = useT()
  const { user } = useAuth()
  const isEdit   = !!brand
  const create   = useCreateBrand()
  const update   = useUpdateBrand()
  const mutation = isEdit ? update : create
  const schema   = useMemo(() => makeSchema(t), [t])

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? { name: brand.name, notes: brand.notes ?? '' } : {},
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) await update.mutateAsync({ id: brand.id, data: values, params: adminBizParam(user) })
      else await create.mutateAsync({ ...values, ...adminBizParam(user) })
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
            {isEdit ? t('Editar marca') : t('Nueva marca')}
          </h3>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Nombre')} *</label>
              <input {...register('name')} placeholder={t('Ej. Castrol, 3M, Bosch')} className={inputCls} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Notas')}</label>
              <textarea {...register('notes')} rows={2}
                placeholder={t('Observaciones opcionales')}
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
              {t('Cancelar')}
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? t('Guardando...') : t('Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Brand card ────────────────────────────────────────────────────────────────

function BrandCard({ brand, onEdit, onDelete }) {
  const t = useT()
  const initial = brand.name[0]?.toUpperCase() ?? '?'
  return (
    <EntityCard
      avatar={<div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold ${brandColor(brand.name)}`}>{initial}</div>}
      title={brand.name}
      subtitle={brand.notes || null}
      onOpen={() => onEdit(brand)} onEdit={() => onEdit(brand)} onDelete={() => onDelete(brand)}
      link={{ to: `/products?brandId=${brand.id}`, label: t('Ver sus productos') }}
    />
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BrandsPage() {
  const t = useT()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)
  const debouncedSearch     = useDebounce(search, 400)
  const deleteBrand         = useDeleteBrand()

  const { data, isLoading } = useBrands({
    size: 50,
    ...adminBizParam(user),
    ...(debouncedSearch && { search: debouncedSearch }),
  })
  const brands = data?.content ?? []
  const { data: catalog } = useProducts({ page: 0, size: 1, active: true, ...adminBizParam(user) })

  const handleDelete = async (b) => {
    if (!window.confirm(t('¿Eliminar "{name}"?\nEsto fallará si tiene productos asociados.', { name: b.name }))) return
    try { await deleteBrand.mutateAsync({ id: b.id, params: adminBizParam(user) }) }
    catch (err) { alert(getErrorMessage(err)) }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <ReportHeader icon={Tag} title={t('Marcas')}
        subtitle={t('De qué marca es cada producto')}
        help={(
          <HelpDrawer title={t('Cómo usar Marcas')} autoOpenKey="eazystock_brands_help_v1">
            <p>{t('Registra las marcas de lo que vendes y asígnalas a tus productos.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🔎 {t('¿Para qué sirven?')}</p>
              <p className="mt-1">{t('Para filtrar el catálogo y para los reportes: puedes ver cuánto vendes de cada marca y decidir cuáles te convienen más.')}</p>
            </div>
          </HelpDrawer>
        )}
        right={<NewButton onClick={() => setModal({ brand: null })}><Plus size={15} />{t('Nueva marca')}</NewButton>} />

      <CatalogSwitcher />

      <ReportHero icon={Tag} label={t('Tus marcas')} loading={isLoading}
        value={data?.totalElements ?? 0}
        cells={[
          [t('Productos en el catálogo'), catalog?.totalElements ?? '—'],
          [t('Con notas'), brands.filter((x) => x.notes).length],
        ]} />

      <BigSearch value={search} onChange={setSearch} placeholder={t('Buscar marca...')} />

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
            <p className="text-sm font-semibold text-gray-700">{t('No hay marcas aún')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('Agrega marcas para organizarlas en tus productos')}</p>
          </div>
          <button onClick={() => setModal({ brand: null })}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]">
            <Plus size={14} />
            {t('Agregar marca')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
