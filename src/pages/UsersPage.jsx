import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, X, Loader2, Power, Shield, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useUsers, useCreateUser, useToggleUser } from '../hooks/useUsers'
import EditUserModal from '../components/EditUserModal'
import { getUserPermissions, patchUserPermissions } from '../services/endpoints/permissions'

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
  OWNER:       { label: 'Owner',       cls: 'bg-blue-100 text-blue-700' },
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

// ── permission labels ─────────────────────────────────────────────────────────

const PERMISSION_META = [
  { key: 'canManageProducts',      label: 'Gestionar productos' },
  { key: 'canReceiveMerchandise',  label: 'Recibir mercadería' },
  { key: 'canModifyStockManually', label: 'Ajuste de stock manual' },
  { key: 'canRegisterSale',        label: 'Registrar ventas' },
  { key: 'canCancelSale',          label: 'Cancelar ventas' },
  { key: 'canApplyDiscount',       label: 'Aplicar descuentos' },
  { key: 'canEditPrices',          label: 'Editar precios' },
  { key: 'canViewReports',         label: 'Ver reportes' },
  { key: 'canManageEmployees',     label: 'Gestionar empleados' },
  { key: 'canManageSuppliers',     label: 'Gestionar proveedores y marcas' },
  { key: 'canViewAuditLog',        label: 'Ver log de auditoría' },
]

// ── PermissionsPanel ──────────────────────────────────────────────────────────

function PermissionsPanel({ targetUser, onClose }) {
  const qc = useQueryClient()

  const { data: perms, isLoading } = useQuery({
    queryKey: ['permissions', targetUser.id],
    queryFn: () => getUserPermissions(targetUser.id),
  })

  const patch = useMutation({
    mutationFn: (update) => patchUserPermissions(targetUser.id, update),
    onSuccess: (updated) => {
      qc.setQueryData(['permissions', targetUser.id], updated)
    },
  })

  const handleToggle = (key, current) => {
    patch.mutate({ [key]: !current })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Permisos — {targetUser.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Los cambios se aplican de inmediato
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toggles */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                  <div className="h-6 w-10 animate-pulse rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {PERMISSION_META.map(({ key, label }) => {
                const value = perms?.[key] ?? false
                const busy  = patch.isPending

                return (
                  <li key={key} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-700">{label}</span>
                    <button
                      role="switch"
                      aria-checked={value}
                      disabled={busy}
                      onClick={() => handleToggle(key, value)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-wait ${
                        value ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {patch.isError && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {patch.error?.response?.data?.message ?? 'Error al actualizar permisos'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── form schema ───────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

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
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
  const [showModal, setShowModal]       = useState(false)
  const [togglingId, setTogglingId]     = useState(null)
  const [permTarget, setPermTarget]     = useState(null)
  const [editTarget, setEditTarget]     = useState(null)

  const { data: usersPage, isLoading } = useUsers()
  const users = usersPage?.content ?? []
  const toggleUser = useToggleUser()

  const isOwner      = currentUser?.role === 'OWNER'
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

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
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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
                  const roleCfg      = ROLE_CONFIG[u.role] ?? { label: u.role, cls: 'bg-gray-100 text-gray-600' }
                  const isSelf       = u.id === currentUser?.id
                  const isToggling   = togglingId === u.id
                  const canEditPerms = isOwner && u.role === 'EMPLOYEE'
                  const canEdit      = isSuperAdmin || (isOwner && u.role === 'EMPLOYEE')

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

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Edit button */}
                          {canEdit && (
                            <button
                              onClick={() => setEditTarget(u)}
                              title="Editar usuario"
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                            >
                              <Pencil size={12} />
                              Editar
                            </button>
                          )}

                          {/* Permissions button — only OWNER on EMPLOYEE rows */}
                          {canEditPerms && (
                            <button
                              onClick={() => setPermTarget(u)}
                              title="Editar permisos"
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                            >
                              <Shield size={12} />
                              Permisos
                            </button>
                          )}

                          {/* Toggle active */}
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
                        </div>
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
      {editTarget && (
        <EditUserModal targetUser={editTarget} onClose={() => setEditTarget(null)} />
      )}
      {permTarget && (
        <PermissionsPanel
          targetUser={permTarget}
          onClose={() => setPermTarget(null)}
        />
      )}
    </div>
  )
}
