import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Loader2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBusinesses, useCreateBusiness, useUpdateBusiness } from '../../hooks/useBusinesses'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(str))
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

const PAGE_SIZE = 20

// ── form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  name:        z.string().min(2, 'Mínimo 2 caracteres'),
  countryCode: z.string().min(2).max(3, 'Código de 2-3 letras'),
  taxIdType:   z.string().min(1, 'Requerido'),
  taxId:       z.string().min(1, 'Requerido'),
})

// Common country options
const COUNTRIES = [
  { code: 'PE', label: 'Perú (PE)' },
  { code: 'CO', label: 'Colombia (CO)' },
  { code: 'AR', label: 'Argentina (AR)' },
  { code: 'MX', label: 'México (MX)' },
  { code: 'CL', label: 'Chile (CL)' },
  { code: 'EC', label: 'Ecuador (EC)' },
  { code: 'BO', label: 'Bolivia (BO)' },
  { code: 'UY', label: 'Uruguay (UY)' },
]

// Common tax ID types
const TAX_TYPES = ['RUC', 'CUIT', 'RFC', 'NIT', 'RUT', 'DNI', 'OTRO']

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

// ── BusinessFormModal ─────────────────────────────────────────────────────────

function BusinessFormModal({ business, onClose }) {
  const isEdit        = !!business
  const createBiz     = useCreateBusiness()
  const updateBiz     = useUpdateBusiness()
  const mutation      = isEdit ? updateBiz : createBiz
  const isPending     = mutation.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: business
      ? {
          name:        business.name,
          countryCode: business.countryCode,
          taxIdType:   business.taxIdType,
          taxId:       business.taxId,
        }
      : { countryCode: 'PE', taxIdType: 'RUC' },
  })

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateBiz.mutateAsync({ id: business.id, data: values })
      } else {
        await createBiz.mutateAsync(values)
      }
      onClose()
    } catch {
      // error shown via mutation.isError
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Editar negocio' : 'Nuevo negocio'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-5 py-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nombre del negocio <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="Ej. Ferretería El Sol"
                className={inputCls}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Country + taxIdType side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  País <span className="text-red-500">*</span>
                </label>
                <select {...register('countryCode')} className={inputCls}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                {errors.countryCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.countryCode.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Tipo ID tributario <span className="text-red-500">*</span>
                </label>
                <select {...register('taxIdType')} className={inputCls}>
                  {TAX_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.taxIdType && (
                  <p className="mt-1 text-xs text-red-500">{errors.taxIdType.message}</p>
                )}
              </div>
            </div>

            {/* Tax ID */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Número de identificación <span className="text-red-500">*</span>
              </label>
              <input
                {...register('taxId')}
                type="text"
                placeholder="Ej. 20601234567"
                className={inputCls}
              />
              {errors.taxId && (
                <p className="mt-1 text-xs text-red-500">{errors.taxId.message}</p>
              )}
            </div>

            {mutation.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {mutation.error?.response?.data?.message ?? 'Error al guardar el negocio'}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear negocio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function BusinessesPage() {
  const [page, setPage]       = useState(0)
  const [modal, setModal]     = useState(null) // null | 'create' | business object

  const { data, isLoading, isFetching } = useBusinesses({
    page,
    size: PAGE_SIZE,
    sort: 'name',
  })

  const businesses    = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Negocios</h2>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={15} />
          Nuevo negocio
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">País</th>
                <th className="px-4 py-3">Tipo ID</th>
                <th className="px-4 py-3">Nro. Identificación</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Registrado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    No hay negocios registrados
                  </td>
                </tr>
              ) : (
                businesses.map((b) => (
                  <tr
                    key={b.id}
                    className={`transition-colors hover:bg-gray-50 ${isFetching ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">
                      {b.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {b.countryCode}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.taxIdType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.taxId}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(b.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setModal(b)}
                        title="Editar"
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        <Pencil size={12} />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Mostrando{' '}
              <span className="font-medium">{fromRow}–{toRow}</span> de{' '}
              <span className="font-medium">{totalElements}</span> negocios
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />Anterior
              </button>
              <span className="px-2 text-sm text-gray-500">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <BusinessFormModal
          business={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
