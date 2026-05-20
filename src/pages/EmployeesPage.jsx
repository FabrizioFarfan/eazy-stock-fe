import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, X, Loader2, Power, Shield, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useEmployees, useCreateEmployee, useToggleEmployee } from '../hooks/useEmployees'
import { getUserPermissions, patchUserPermissions } from '../services/endpoints/permissions'

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
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder-gray-400'

// ── PERMISSION PANEL ──────────────────────────────────────────────────────────

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

function PermissionsPanel({ targetUser, onClose }) {
  const qc = useQueryClient()

  const { data: perms, isLoading } = useQuery({
    queryKey: ['permissions', targetUser.id],
    queryFn: () => getUserPermissions(targetUser.id),
  })

  const patch = useMutation({
    mutationFn: (update) => patchUserPermissions(targetUser.id, update),
    onSuccess: (updated) => qc.setQueryData(['permissions', targetUser.id], updated),
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Permisos — {targetUser.name}</h3>
            <p className="mt-0.5 text-xs text-gray-400">Los cambios se aplican de inmediato</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

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
                return (
                  <li key={key} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-700">{label}</span>
                    <button
                      role="switch"
                      aria-checked={value}
                      disabled={patch.isPending}
                      onClick={() => patch.mutate({ [key]: !value })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-wait ${
                        value ? 'bg-orange-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
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

// ── CREATE EMPLOYEE MODAL ─────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName:  z.string().min(2, 'Mínimo 2 caracteres'),
  email:     z.string().email('Email inválido'),
  password:  z.string().min(6, 'Mínimo 6 caracteres'),
})

function CreateEmployeeModal({ businessName, onClose }) {
  const createEmployee = useCreateEmployee()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ firstName, lastName, email, password }) => {
    try {
      const employee = await createEmployee.mutateAsync({
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
      })
      toast.success(`Empleado ${employee.name} creado. Ajustá sus permisos desde el botón Shield.`)
      onClose()
    } catch {
      // error shown via createEmployee.isError
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Nuevo empleado</h3>
            {businessName && (
              <p className="mt-0.5 text-xs text-gray-400">para {businessName}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input {...register('firstName')} placeholder="Maria" className={inputCls} />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input {...register('lastName')} placeholder="García" className={inputCls} />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input {...register('email')} type="email" placeholder="maria@ferreteria.com" className={inputCls} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Contraseña temporal <span className="text-red-500">*</span>
              </label>
              <input {...register('password')} type="password" placeholder="Mínimo 6 caracteres" className={inputCls} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {createEmployee.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {createEmployee.error?.response?.data?.message ?? 'Error al crear el empleado'}
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
              disabled={createEmployee.isPending}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {createEmployee.isPending && <Loader2 size={14} className="animate-spin" />}
              {createEmployee.isPending ? 'Creando...' : 'Crear empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function EmployeesPage() {
  const { user: currentUser } = useAuth()
  const [page, setPage]         = useState(0)
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [permTarget, setPermTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const { data, isLoading, isFetching } = useEmployees({
    page,
    size: PAGE_SIZE,
    sort: 'createdAt,desc',
  })

  const toggleEmployee = useToggleEmployee()

  const employees     = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  // Client-side search filter (server search not yet in endpoint)
  const filtered = search
    ? employees.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase()),
      )
    : employees

  const handleToggle = async (id) => {
    setTogglingId(id)
    try {
      await toggleEmployee.mutateAsync(id)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Empleados</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <UserPlus size={15} />
          Nuevo empleado
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Registrado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-gray-400">
                    {search
                      ? `Sin resultados para "${search}"`
                      : 'Aún no tenés empleados. Agregá el primero para empezar.'}
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const isSelf     = emp.id === currentUser?.id
                  const isToggling = togglingId === emp.id

                  return (
                    <tr
                      key={emp.id}
                      className={`transition-colors hover:bg-gray-50 ${isFetching ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(emp.name)}`}>
                            {initials(emp.name)}
                          </div>
                          <span className="max-w-[140px] truncate font-medium text-gray-900">
                            {emp.name}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">{emp.email}</td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          emp.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {emp.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(emp.createdAt)}</td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPermTarget(emp)}
                            title="Editar permisos"
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                          >
                            <Shield size={12} />
                            Permisos
                          </button>

                          <button
                            onClick={() => handleToggle(emp.id)}
                            disabled={isSelf || isToggling}
                            title={isSelf ? 'No puedes desactivarte a ti mismo' : emp.active ? 'Desactivar' : 'Activar'}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              emp.active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {isToggling ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
                            {emp.active ? 'Desactivar' : 'Activar'}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Mostrando <span className="font-medium">{fromRow}–{toRow}</span> de{' '}
              <span className="font-medium">{totalElements}</span> empleados
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

      {showModal && (
        <CreateEmployeeModal
          businessName={currentUser?.businessName}
          onClose={() => setShowModal(false)}
        />
      )}
      {permTarget && (
        <PermissionsPanel targetUser={permTarget} onClose={() => setPermTarget(null)} />
      )}
    </div>
  )
}
