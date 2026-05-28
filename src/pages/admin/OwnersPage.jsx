import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, X, Loader2, ChevronLeft, ChevronRight, Search, Pencil } from 'lucide-react'
import { useOwners, useCreateOwner } from '../../hooks/useOwners'
import { useBusinesses } from '../../hooks/useBusinesses'
import EditUserModal from '../../components/EditUserModal'
import { getErrorMessage, getErrorField } from '../../utils/handleApiError'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(str))
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-green-500',
  'bg-amber-500', 'bg-pink-500', 'bg-teal-500',
]
function avatarColor(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

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

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

// ── form schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  firstName:  z.string().min(2, 'Mínimo 2 caracteres'),
  lastName:   z.string().min(2, 'Mínimo 2 caracteres'),
  email:      z.string().email('Email inválido'),
  password:   z.string().min(6, 'Mínimo 6 caracteres'),
  businessId: z.string().uuid('Seleccioná un negocio'),
})

// ── CreateOwnerModal ──────────────────────────────────────────────────────────

function CreateOwnerModal({ onClose }) {
  const createOwner = useCreateOwner()
  const [bizSearch, setBizSearch] = useState('')

  // Fetch all active businesses for the dropdown (max 200 for now)
  const { data: bizPage, isLoading: bizLoading } = useBusinesses({ page: 0, size: 200 })
  const allBusinesses = bizPage?.content ?? []

  const filteredBiz = useMemo(() => {
    const q = bizSearch.toLowerCase()
    return q
      ? allBusinesses.filter(
          (b) => b.name.toLowerCase().includes(q) || b.taxId.includes(q),
        )
      : allBusinesses
  }, [allBusinesses, bizSearch])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ firstName, lastName, email, password, businessId }) => {
    try {
      await createOwner.mutateAsync({
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        businessId,
      })
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      if (field && ['email', 'password', 'businessId'].includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">Nuevo Owner</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-5 py-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input {...register('firstName')} placeholder="Juan" className={inputCls} />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input {...register('lastName')} placeholder="Pérez" className={inputCls} />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input {...register('email')} type="email" placeholder="owner@negocio.com" className={inputCls} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input {...register('password')} type="password" placeholder="Mínimo 6 caracteres" className={inputCls} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Business dropdown */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Negocio <span className="text-red-500">*</span>
              </label>

              {bizLoading ? (
                <div className="h-9 animate-pulse rounded-lg bg-gray-100" />
              ) : allBusinesses.length === 0 ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  No hay negocios creados todavía. Crea uno primero desde "Negocios".
                </p>
              ) : (
                <>
                  {allBusinesses.length > 10 && (
                    <div className="relative mb-1.5">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o RUC..."
                        value={bizSearch}
                        onChange={(e) => setBizSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                  )}
                  <select {...register('businessId')} className={inputCls}>
                    <option value="">— Seleccioná un negocio —</option>
                    {filteredBiz.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} · {b.taxIdType} {b.taxId}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {errors.businessId && (
                <p className="mt-1 text-xs text-red-500">{errors.businessId.message}</p>
              )}
            </div>

            {createOwner.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {getErrorMessage(createOwner.error)}
              </p>
            )}
          </div>

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
              disabled={createOwner.isPending || allBusinesses.length === 0}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createOwner.isPending && <Loader2 size={14} className="animate-spin" />}
              {createOwner.isPending ? 'Creando...' : 'Crear Owner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function OwnersPage() {
  const [page, setPage]           = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const { data, isLoading, isFetching } = useOwners({
    page,
    size: PAGE_SIZE,
    sort: 'createdAt,desc',
  })

  const owners        = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Owners</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <UserPlus size={15} />
          Nuevo Owner
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Registrado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    No hay owners registrados
                  </td>
                </tr>
              ) : (
                owners.map((u) => (
                  <tr
                    key={u.id}
                    className={`transition-colors hover:bg-gray-50 ${isFetching ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(u.name)}`}>
                          {initials(u.name)}
                        </div>
                        <span className="max-w-[140px] truncate font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.businessName ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setEditTarget(u)}
                        title="Editar usuario"
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Mostrando <span className="font-medium">{fromRow}–{toRow}</span> de{' '}
              <span className="font-medium">{totalElements}</span> owners
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

      {showModal && <CreateOwnerModal onClose={() => setShowModal(false)} />}
      {editTarget && (
        <EditUserModal targetUser={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </div>
  )
}
