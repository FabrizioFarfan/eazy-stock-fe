import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, X, Loader2, Power } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUsers, useCreateUser, useToggleUser } from '../hooks/useUsers'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(str))
}

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const ROLE_CONFIG = {
  SUPER_ADMIN: { label: 'Super Admin', cls: 'bg-purple-100 text-purple-700' },
  OWNER:       { label: 'Owner',       cls: 'bg-orange-100 text-orange-700' },
  EMPLOYEE:    { label: 'Empleado',    cls: 'bg-slate-100  text-slate-700'  },
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-green-500',
  'bg-amber-500', 'bg-pink-500', 'bg-teal-500',
]

function avatarColor(name = '') {
  const code = name.charCodeAt(0) || 0
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
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

// ── form schema ───────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder-gray-400'

function buildSchema(isSuperAdmin) {
  return z.object({
    name:       z.string().min(2, 'Mínimo 2 caracteres'),
    email:      z.string().email('Email inválido'),
    password:   z.string().min(6, 'Mínimo 6 caracteres'),
    role:       z.enum(['OWNER', 'EMPLOYEE']),
    businessId: isSuperAdmin
      ? z.string().uuid('Debe ser un UUID válido').optional().or(z.literal(''))
      : z.string().optional(),
  })
}

// ── UserFormModal ─────────────────────────────────────────────────────────────

function UserFormModal({ onClose }) {
  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const createUser   = useCreateUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildSchema(isSuperAdmin)),
    defaultValues: {
      role:       'EMPLOYEE',
      businessId: currentUser?.businessId ?? '',
    },
  })

  const onSubmit = async ({ name, email, password, role, businessId }) => {
    try {
      await createUser.mutateAsync({
        name,
        email,
        password,
        role,
        businessId: businessId || currentUser?.businessId || undefined,
      })
      onClose()
    } catch {
      // error shown via createUser.isError
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">Nuevo usuario</h3>
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
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="Ej. Juan Pérez"
                className={inputCls}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="usuario@negocio.com"
                className={inputCls}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="Mínimo 6 caracteres"
                className={inputCls}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Role — SUPER_ADMIN can choose OWNER or EMPLOYEE; OWNER always creates EMPLOYEE */}
            {isSuperAdmin && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select {...register('role')} className={inputCls}>
                  <option value="EMPLOYEE">Empleado</option>
                  <option value="OWNER">Owner</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
                )}
              </div>
            )}

            {/* BusinessId — only shown for SUPER_ADMIN without an assigned business */}
            {isSuperAdmin && !currentUser?.businessId && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  ID del negocio <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('businessId')}
                  type="text"
                  placeholder="UUID del negocio..."
                  className={inputCls}
                />
                {errors.businessId && (
                  <p className="mt-1 text-xs text-red-500">{errors.businessId.message}</p>
                )}
              </div>
            )}

            {createUser.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {createUser.error?.response?.data?.message ?? 'Error al crear el usuario'}
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
              disabled={createUser.isPending}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {createUser.isPending && <Loader2 size={14} className="animate-spin" />}
              {createUser.isPending ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [showModal, setShowModal]   = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const { data: usersPage, isLoading } = useUsers()
  const users = usersPage?.content ?? []
  const toggleUser = useToggleUser()

  const handleToggle = async (id) => {
    setTogglingId(id)
    try {
      await toggleUser.mutateAsync(id)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Usuarios</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <UserPlus size={15} />
          Nuevo usuario
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Rol</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Registrado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleCfg = ROLE_CONFIG[u.role] ?? { label: u.role, cls: 'bg-gray-100 text-gray-600' }
                  const isSelf  = u.id === currentUser?.id
                  const isToggling = togglingId === u.id

                  return (
                    <tr key={u.id} className="transition-colors hover:bg-gray-50">
                      {/* Avatar + name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(u.name)}`}>
                            {initials(u.name)}
                          </div>
                          <span className="font-medium text-gray-900 max-w-[140px] truncate">
                            {u.name}
                            {isSelf && (
                              <span className="ml-1.5 text-xs text-gray-400">(tú)</span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                        {u.email}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleCfg.cls}`}>
                          {roleCfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Toggle active */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(u.id)}
                          disabled={isSelf || isToggling}
                          title={isSelf ? 'No puedes desactivarte a ti mismo' : u.active ? 'Desactivar' : 'Activar'}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            u.active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Power size={12} />
                          )}
                          {u.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <UserFormModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
