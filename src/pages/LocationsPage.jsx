import { useMemo, useState } from 'react'
import { Plus, MapPin, Loader2, X, Package } from 'lucide-react'
import { CatalogSwitcher, ReportHero, ReportHeader, BigSearch, NewButton, EntityCard } from '../components/reports/ReportKit'
import { useProducts } from '../hooks/useProducts'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '../hooks/useLocations'
import { useAuth } from '../context/AuthContext'
import { adminBizParam } from '../utils/adminBiz'
import { useDebounce } from '../hooks/useDebounce'
import { getErrorMessage, getErrorField } from '../utils/handleApiError'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT } from '../i18n'

/**
 * UBICACIONES: los lugares físicos del negocio (Almacén 1, Estante B3,
 * Vitrina…). Cada producto apunta a una; el vendedor la ve en el buscador de
 * Nueva venta y en el detalle, y el catálogo se puede filtrar por ella.
 * Misma estructura que Marcas/Categorías (tarjetas + modal).
 */

const makeSchema = (t) => z.object({
  name:  z.string().min(2, t('Mínimo 2 caracteres')).max(80, t('Máximo 80 caracteres')),
  notes: z.string().optional(),
})

const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

// ── Modal ─────────────────────────────────────────────────────────────────────

function LocationModal({ location, onClose }) {
  const t = useT()
  const { user } = useAuth()
  const isEdit   = !!location
  const create   = useCreateLocation()
  const update   = useUpdateLocation()
  const mutation = isEdit ? update : create
  const schema   = useMemo(() => makeSchema(t), [t])

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? { name: location.name, notes: location.notes ?? '' } : {},
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) await update.mutateAsync({ id: location.id, data: values, params: adminBizParam(user) })
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
            {isEdit ? t('Editar ubicación') : t('Nueva ubicación')}
          </h3>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Nombre')} *</label>
              <input {...register('name')} placeholder={t('Ej. Almacén 1, Estante B3, Vitrina')} className={inputCls} autoFocus />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Indicaciones (opcional)')}</label>
              <textarea {...register('notes')} rows={2}
                placeholder={t('Ej. Al fondo a la derecha, segundo piso')}
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

// ── Tarjeta ───────────────────────────────────────────────────────────────────

function LocationCard({ location, onEdit, onDelete }) {
  const t = useT()
  const n = location.productCount ?? 0
  return (
    <EntityCard
      avatar={<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><MapPin size={22} /></div>}
      title={location.name}
      subtitle={location.notes || null}
      onOpen={() => onEdit(location)} onEdit={() => onEdit(location)} onDelete={() => onDelete(location)}
      link={n > 0 ? { to: `/products?locationId=${location.id}`, label: t('Ver sus {n} producto(s)', { n }) } : null}
    >
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
        n > 0 ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-gray-50 text-gray-400 ring-gray-100'}`}>
        <Package size={11} /> {n > 0 ? t('{n} producto(s)', { n }) : t('Sin productos')}
      </span>
    </EntityCard>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const t = useT()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)
  const debouncedSearch     = useDebounce(search, 400)
  const deleteLocation      = useDeleteLocation()

  const { data, isLoading } = useLocations({
    size: 100,
    ...adminBizParam(user),
    ...(debouncedSearch && { search: debouncedSearch }),
  })
  const locations = data?.content ?? []
  const { data: catalog } = useProducts({ page: 0, size: 1, active: true, ...adminBizParam(user) })

  const handleDelete = async (l) => {
    if (!window.confirm(t('¿Eliminar "{name}"?\nEsto fallará si tiene productos asignados.', { name: l.name }))) return
    try { await deleteLocation.mutateAsync({ id: l.id, params: adminBizParam(user) }) }
    catch (err) { alert(getErrorMessage(err)) }
  }

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={MapPin} title={t('Ubicaciones')}
        subtitle={t('Dónde está cada producto')}
        help={(
          <HelpDrawer title={t('Cómo usar Ubicaciones')} autoOpenKey="eazystock_locations_help_v1">
            <p>{t('Define los lugares físicos de tu negocio (almacén, estante, vitrina) y asigna cada producto a uno.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📍 {t('¿Para qué sirven?')}</p>
              <p className="mt-1">{t('Cuando el vendedor busca un producto, ve dónde está sin preguntar. También puedes filtrar el catálogo por ubicación.')}</p>
            </div>
          </HelpDrawer>
        )}
        right={<NewButton onClick={() => setModal({ location: null })}><Plus size={15} />{t('Nueva ubicación')}</NewButton>} />

      <CatalogSwitcher />

      <ReportHero icon={MapPin} label={t('Tus ubicaciones')} loading={isLoading}
        value={data?.totalElements ?? 0}
        cells={[
          [t('Productos ubicados'), locations.reduce((n, l) => n + (l.productCount ?? 0), 0)],
          [t('Productos en el catálogo'), catalog?.totalElements ?? '—'],
        ]} />

      <BigSearch value={search} onChange={setSearch} placeholder={t('Buscar ubicación...')} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <MapPin size={28} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">{t('No hay ubicaciones aún')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('Crea lugares como «Almacén 1» o «Estante B3» y asígnalos a tus productos')}</p>
          </div>
          <button onClick={() => setModal({ location: null })}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]">
            <Plus size={14} />
            {t('Agregar ubicación')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((l) => (
            <LocationCard key={l.id} location={l}
              onEdit={(loc) => setModal({ location: loc })}
              onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal !== null && <LocationModal location={modal.location} onClose={() => setModal(null)} />}
    </div>
  )
}
