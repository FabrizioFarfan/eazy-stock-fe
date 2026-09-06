import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, MapPin, Edit, Trash2, Loader2, X, Package } from 'lucide-react'
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
    <div className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all"
      onClick={() => onEdit(location)}>
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <MapPin size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 truncate">{location.name}</p>
        {location.notes && (
          <p className="mt-0.5 text-xs text-gray-400 truncate">{location.notes}</p>
        )}
        {n > 0 ? (
          <Link to={`/products?locationId=${location.id}`} onClick={(e) => e.stopPropagation()}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
            <Package size={11} /> {t('{n} producto(s)', { n })}
          </Link>
        ) : (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
            <Package size={11} /> {t('Sin productos')}
          </p>
        )}
      </div>
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); onEdit(location) }} title={t('Editar')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
          <Edit size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(location) }} title={t('Eliminar')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
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

  const handleDelete = async (l) => {
    if (!window.confirm(t('¿Eliminar "{name}"?\nEsto fallará si tiene productos asignados.', { name: l.name }))) return
    try { await deleteLocation.mutateAsync({ id: l.id, params: adminBizParam(user) }) }
    catch (err) { alert(getErrorMessage(err)) }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">{t('Ubicaciones')}</h2>
          <HelpDrawer title={t('Cómo usar Ubicaciones')} autoOpenKey="eazystock_locations_help_v1">
            <p>{t('Define los lugares físicos de tu negocio (almacén, estante, vitrina) y asigna cada producto a uno.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📍 {t('¿Para qué sirven?')}</p>
              <p className="mt-1">{t('Cuando el vendedor busca un producto, ve dónde está sin preguntar. También puedes filtrar el catálogo por ubicación.')}</p>
            </div>
          </HelpDrawer>
          {!isLoading && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {data?.totalElements ?? 0}
            </span>
          )}
        </div>
        <button onClick={() => setModal({ location: null })}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]">
          <Plus size={15} />
          {t('Nueva ubicación')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder={t('Buscar ubicación...')} value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
      </div>

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
