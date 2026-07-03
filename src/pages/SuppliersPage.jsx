import { useState } from 'react'
import { Plus, Search, Truck, Edit, Trash2, Loader2, X, Phone, User, FileText } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../hooks/useSuppliers'
import { useDebounce } from '../hooks/useDebounce'
import PageTitle from '../components/common/PageTitle'
import { getErrorMessage, getErrorField } from '../utils/handleApiError'

const schema = z.object({
  name:    z.string().min(2, 'Mínimo 2 caracteres'),
  ruc:     z.string().optional(),
  contact: z.string().optional(),
  phone:   z.string().optional(),
  notes:   z.string().optional(),
})

const inputCls =
  'rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 w-full bg-white'

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Supplier modal ────────────────────────────────────────────────────────────

function SupplierModal({ supplier, onClose }) {
  const isEdit   = !!supplier
  const create   = useCreateSupplier()
  const update   = useUpdateSupplier()
  const mutation = isEdit ? update : create

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? { name: supplier.name, ruc: supplier.ruc ?? '', contact: supplier.contact ?? '', phone: supplier.phone ?? '', notes: supplier.notes ?? '' }
      : {},
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) await update.mutateAsync({ id: supplier.id, data: values })
      else await create.mutateAsync(values)
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      if (field && ['name', 'ruc', 'contact', 'phone', 'notes'].includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h3 className="text-base font-bold text-gray-900">
            {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h3>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            <Field label="Nombre *" error={errors.name?.message}>
              <input {...register('name')} placeholder="Ej. Distribuidora Lima SAC" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="RUC" error={errors.ruc?.message}>
                <input {...register('ruc')} placeholder="20123456789" className={inputCls} />
              </Field>
              <Field label="Teléfono" error={errors.phone?.message}>
                <input {...register('phone')} placeholder="999 000 000" className={inputCls} />
              </Field>
            </div>
            <Field label="Contacto" error={errors.contact?.message}>
              <input {...register('contact')} placeholder="Nombre del contacto" className={inputCls} />
            </Field>
            <Field label="Notas" error={errors.notes?.message}>
              <textarea {...register('notes')} rows={2}
                placeholder="Condiciones de pago, observaciones..."
                className={`${inputCls} resize-none`} />
            </Field>
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

// ── Supplier card ─────────────────────────────────────────────────────────────

function SupplierCard({ supplier, onEdit, onDelete }) {
  const initials = supplier.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-600">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{supplier.name}</p>
            {supplier.ruc && (
              <p className="text-xs font-mono text-gray-400 mt-0.5">RUC: {supplier.ruc}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(supplier)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
            <Edit size={14} />
          </button>
          <button onClick={() => onDelete(supplier)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {supplier.contact && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User size={12} className="flex-shrink-0 text-gray-400" />
            {supplier.contact}
          </div>
        )}
        {supplier.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone size={12} className="flex-shrink-0 text-gray-400" />
            {supplier.phone}
          </div>
        )}
        {supplier.notes && (
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <FileText size={12} className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{supplier.notes}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(null)
  const debouncedSearch     = useDebounce(search, 400)
  const deleteSupplier      = useDeleteSupplier()

  const { data, isLoading } = useSuppliers({
    size: 50,
    ...(debouncedSearch && { search: debouncedSearch }),
  })
  const suppliers = data?.content ?? []

  const handleDelete = async (s) => {
    if (!window.confirm(`¿Eliminar "${s.name}"?\nEsto fallará si tiene productos asociados.`)) return
    try { await deleteSupplier.mutateAsync(s.id) }
    catch (err) { alert(getErrorMessage(err)) }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PageTitle icon={Truck} tone="cyan">Proveedores</PageTitle>
          {!isLoading && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {data?.totalElements ?? 0}
            </span>
          )}
        </div>
        <button onClick={() => setModal({ supplier: null })}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]">
          <Plus size={15} />
          Nuevo proveedor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar proveedor..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Truck size={28} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">No hay proveedores aún</p>
            <p className="mt-1 text-xs text-gray-400">Agrega tu primer proveedor para asociarlo a productos</p>
          </div>
          <button onClick={() => setModal({ supplier: null })}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]">
            <Plus size={14} />
            Agregar proveedor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s) => (
            <SupplierCard key={s.id} supplier={s}
              onEdit={(sup) => setModal({ supplier: sup })}
              onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal !== null && <SupplierModal supplier={modal.supplier} onClose={() => setModal(null)} />}
    </div>
  )
}
