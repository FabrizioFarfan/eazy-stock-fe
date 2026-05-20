import { useState } from 'react'
import { Plus, Search, Truck, Edit, Trash2, Loader2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '../hooks/useSuppliers'
import { useDebounce } from '../hooks/useDebounce'

// ── Form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  name:    z.string().min(2, 'Mínimo 2 caracteres'),
  ruc:     z.string().optional(),
  contact: z.string().optional(),
  phone:   z.string().optional(),
  notes:   z.string().optional(),
})

const inputCls =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder-gray-400 w-full'

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Supplier modal ────────────────────────────────────────────────────────────

function SupplierModal({ supplier, onClose }) {
  const isEdit = !!supplier
  const create = useCreateSupplier()
  const update = useUpdateSupplier()
  const mutation = isEdit ? update : create

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? { name: supplier.name, ruc: supplier.ruc ?? '', contact: supplier.contact ?? '', phone: supplier.phone ?? '', notes: supplier.notes ?? '' }
      : {},
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await update.mutateAsync({ id: supplier.id, data: values })
      } else {
        await create.mutateAsync(values)
      }
      onClose()
    } catch (_) {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
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
              <textarea {...register('notes')} rows={2} placeholder="Condiciones de pago, observaciones..." className={`${inputCls} resize-none`} />
            </Field>

            {mutation.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {mutation.error?.response?.data?.message ?? 'Error al guardar'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null) // null | { supplier? }
  const debouncedSearch       = useDebounce(search, 400)
  const deleteSupplier        = useDeleteSupplier()

  const { data, isLoading } = useSuppliers({
    size: 50,
    ...(debouncedSearch && { search: debouncedSearch }),
  })

  const suppliers = data?.content ?? []

  const handleDelete = async (s) => {
    if (!window.confirm(`¿Eliminar "${s.name}"?\nEsto fallará si tiene productos asociados.`)) return
    try {
      await deleteSupplier.mutateAsync(s.id)
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Error al eliminar')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-semibold text-gray-900">Proveedores</h2>
          {!isLoading && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              {data?.totalElements ?? 0}
            </span>
          )}
        </div>
        <button
          onClick={() => setModal({ supplier: null })}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Plus size={15} />
          Nuevo proveedor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar proveedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">RUC</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Notas</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center gap-3 py-16">
                    <Truck size={40} className="text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">No hay proveedores aún</p>
                    <button
                      onClick={() => setModal({ supplier: null })}
                      className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                    >
                      Agregar primer proveedor
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.ruc || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.contact || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{s.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setModal({ supplier: s })}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Editar"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <SupplierModal supplier={modal.supplier} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
