import { useMemo, useState } from 'react'
import { Plus, FolderOpen, X } from 'lucide-react'
import { CatalogSwitcher, ReportHero, ReportHeader, BigSearch, NewButton, EntityCard } from '../components/reports/ReportKit'
import { useProducts } from '../hooks/useProducts'
import EntityModal, { EntityField } from '../components/common/EntityModal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import { useAuth } from '../context/AuthContext'
import { adminBizParam } from '../utils/adminBiz'
import { useDebounce } from '../hooks/useDebounce'
import { getErrorMessage, getErrorField } from '../utils/handleApiError'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'

const makeSchema = (t) => z.object({
  name:        z.string().min(2, t('Mínimo 2 caracteres')),
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
  const t = useT()
  const { user } = useAuth()
  const isEdit   = !!category
  const create   = useCreateCategory()
  const update   = useUpdateCategory()
  const mutation = isEdit ? update : create
  const schema   = useMemo(() => makeSchema(t), [t])

  const [attrInput, setAttrInput]         = useState('')
  const [suggestedAttrs, setSuggestedAttrs] = useState(
    category?.suggestedAttributes ?? [],
  )

  const { register, handleSubmit, setError, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? { name: category.name, description: category.description ?? '' } : {},
  })
  const name = watch('name')

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
      if (isEdit) await update.mutateAsync({ id: category.id, data: payload, params: adminBizParam(user) })
      else        await create.mutateAsync({ ...payload, ...adminBizParam(user) })
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      if (field && ['name', 'description'].includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  return (
    <EntityModal onClose={onClose} onSubmit={handleSubmit(onSubmit)} isEdit={isEdit}
      title={isEdit ? t('Editar categoría') : t('Nueva categoría')}
      subtitle={suggestedAttrs.length ? (suggestedAttrs.length !== 1 ? t('{n} atributos', { n: suggestedAttrs.length }) : t('1 atributo')) : t('Sin atributos sugeridos')}
      avatar={(
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl font-extrabold ring-1 ring-white/30">
          {(name || '?').trim()[0]?.toUpperCase() ?? '?'}
        </div>
      )}
      previewName={name} placeholderName={t('Nombre de la categoría')}
      productFilter={isEdit ? { params: { categoryId: category.id, ...adminBizParam(user) }, to: `/products?categoryId=${category.id}` } : null}
      submitting={mutation.isPending} submitLabel={isEdit ? t('Guardar cambios') : t('Crear categoría')}
      error={mutation.isError ? getErrorMessage(mutation.error) : null}>
      <EntityField label={`${t('Nombre')} *`} error={errors.name?.message}>
        <input {...register('name')} placeholder={t('Ej. Herramientas manuales')} className={`${inputCls} py-3 text-base font-semibold`} autoFocus />
      </EntityField>
      <EntityField label={t('Descripción')}>
        <textarea {...register('description')} rows={2} placeholder={t('Descripción opcional')} className={`${inputCls} resize-none`} />
      </EntityField>
      <EntityField label={t('Atributos sugeridos')} hint={t('Los atributos que aparecerán como chips al crear productos de esta categoría.')}>
        <div className="flex gap-2">
          <input
            value={attrInput}
            onChange={(e) => setAttrInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttr() } }}
            placeholder={t('Ej. material, longitud...')}
            className={`${inputCls} flex-1`}
          />
          <button type="button" onClick={addAttr} disabled={!attrInput.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40">
            <Plus size={15} />{t('Agregar')}
          </button>
        </div>
        {suggestedAttrs.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedAttrs.map((attr) => (
              <span key={attr}
                className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
                {attr}
                <button type="button" onClick={() => removeAttr(attr)} aria-label={t('Quitar')}
                  className="flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border-2 border-dashed border-gray-100 px-3 py-3 text-center text-xs text-gray-400">
            {t('Aún sin atributos: escribe uno y toca Agregar')}
          </p>
        )}
      </EntityField>
    </EntityModal>
  )
}

// ── Category card ─────────────────────────────────────────────────────────────

function CategoryCard({ category, onEdit, onDelete }) {
  const t = useT()
  const initial = category.name[0]?.toUpperCase() ?? '?'
  const attrs   = category.suggestedAttributes ?? []
  return (
    <EntityCard
      avatar={<div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold ${catColor(category.name)}`}>{initial}</div>}
      title={category.name}
      subtitle={category.description || (attrs.length ? (attrs.length !== 1 ? t('{n} atributos', { n: attrs.length }) : t('1 atributo')) : t('Sin atributos sugeridos'))}
      onOpen={() => onEdit(category)} onEdit={() => onEdit(category)} onDelete={() => onDelete(category)}
      link={{ to: `/products?categoryId=${category.id}`, label: t('Ver sus productos') }}
    >
      {attrs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attrs.map((attr) => (
            <span key={attr} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{attr}</span>
          ))}
        </div>
      )}
    </EntityCard>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const t = useT()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)
  const debouncedSearch     = useDebounce(search, 400)
  const deleteCategory      = useDeleteCategory()

  const { data, isLoading } = useCategories({
    size: 50,
    ...adminBizParam(user),
    ...(debouncedSearch && { search: debouncedSearch }),
  })
  const categories = data?.content ?? []
  const { data: catalog } = useProducts({ page: 0, size: 1, active: true, ...adminBizParam(user) })

  const handleDelete = async (c) => {
    if (!window.confirm(t('¿Eliminar "{name}"?\nEsto fallará si tiene productos asociados.', { name: c.name }))) return
    try { await deleteCategory.mutateAsync({ id: c.id, params: adminBizParam(user) }) }
    catch (err) { alert(getErrorMessage(err)) }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <ReportHeader icon={FolderOpen} title={t('Categorías')}
        subtitle={t('Cómo ordenas el catálogo')}
        help={(
          <HelpDrawer title={t('Cómo usar Categorías')} autoOpenKey="eazystock_categories_help_v1">
            <p>{t('Las categorías ordenan tu catálogo y hacen que buscar y filtrar sea mucho más rápido.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🏷️ {t('Atributos sugeridos')}</p>
              <p className="mt-1">{t('Cada categoría puede sugerir campos al crear un producto (talla, color, presentación…). Así todos los productos de una categoría quedan completos y parejos.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">✏️ {t('Editar')}</p>
              <p className="mt-1">{t('Click en una categoría para renombrarla o ajustar sus atributos. Los productos existentes no se pierden.')}</p>
            </div>
          </HelpDrawer>
        )}
        right={<NewButton onClick={() => setModal({ category: null })}><Plus size={15} />{t('Nueva categoría')}</NewButton>} />

      <CatalogSwitcher />

      <ReportHero icon={FolderOpen} label={t('Tus categorías')} loading={isLoading}
        value={data?.totalElements ?? 0}
        cells={[
          [t('Productos en el catálogo'), catalog?.totalElements ?? '—'],
          [t('Atributos sugeridos'), categories.reduce((n, c) => n + (c.suggestedAttributes?.length ?? 0), 0)],
        ]} />

      <BigSearch value={search} onChange={setSearch} placeholder={t('Buscar categoría...')} />

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
            <p className="text-sm font-semibold text-gray-700">{t('No hay categorías aún')}</p>
            <p className="mt-1 text-xs text-gray-400">
              {search ? t('Sin resultados para "{q}"', { q: search }) : t('Crea categorías para organizar tus productos')}
            </p>
          </div>
          {!search && (
            <button onClick={() => setModal({ category: null })}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]">
              <Plus size={14} />
              {t('Agregar categoría')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
