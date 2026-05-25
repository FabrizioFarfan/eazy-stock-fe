import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, X, Loader2, Power, Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useEmployees, useCreateEmployee, useToggleEmployee } from '../hooks/useEmployees'
import { getUserPermissions, patchUserPermissions } from '../services/endpoints/permissions'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-indigo-400 to-indigo-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-pink-400 to-pink-600',
  'from-teal-400 to-teal-600',
]
function avatarGradient(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

// ── Permissions panel ─────────────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Permisos</h3>
            <p className="mt-0.5 text-sm text-gray-400">{targetUser.name}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-4 text-xs text-gray-400">Los cambios se aplican de inmediato</p>
          {isLoading ? (
            <div className="space-y-5">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-40 animate-pulse rounded-lg bg-gray-100" />
                  <div className="h-6 w-11 animate-pulse rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-4">
              {PERMISSION_META.map(({ key, label }) => {
                const value = perms?.[key] ?? false
                return (
                  <li key={key} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <button
                      role="switch"
                      aria-checked={value}
                      disabled={patch.isPending}
                      onClick={() => patch.mutate({ [key]: !value })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-wait ${
                        value ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {patch.isError && (
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
              {patch.error?.response?.data?.message ?? 'Error al actualizar permisos'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Create employee modal ─────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName:  z.string().min(2, 'Mínimo 2 caracteres'),
  email:     z.string().email('Email inválido'),
  password:  z.string().min(6, 'Mínimo 6 caracteres'),
})

function CreateEmployeeModal({ businessName, onClose }) {
  const createEmployee = useCreateEmployee()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ firstName, lastName, email, password }) => {
    try {
      const employee = await createEmployee.mutateAsync({
        name: `${firstName} ${lastName}`.trim(), email, password,
      })
      toast.success(`Empleado ${employee.name} creado`)
      onClose()
    } catch { /* error shown in form */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Nuevo empleado</h3>
            {businessName && <p className="mt-0.5 text-xs text-gray-400">para {businessName}</p>}
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input {...register('firstName')} placeholder="Maria" className={inputCls} />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Apellido <span className="text-red-400">*</span>
                </label>
                <input {...register('lastName')} placeholder="García" className={inputCls} />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email <span className="text-red-400">*</span>
              </label>
              <input {...register('email')} type="email" placeholder="maria@empresa.com" className={inputCls} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Contraseña temporal <span className="text-red-400">*</span>
              </label>
              <input {...register('password')} type="password" placeholder="Mínimo 6 caracteres" className={inputCls} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {createEmployee.isError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                {createEmployee.error?.response?.data?.message ?? 'Error al crear el empleado'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={createEmployee.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60">
              {createEmployee.isPending && <Loader2 size={14} className="animate-spin" />}
              {createEmployee.isPending ? 'Creando...' : 'Crear empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function EmployeesPage() {
  const { user: currentUser } = useAuth()
  const [page, setPage]           = useState(0)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [permTarget, setPermTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const { data, isLoading, isFetching } = useEmployees({ page, size: PAGE_SIZE, sort: 'createdAt,desc' })
  const toggleEmployee = useToggleEmployee()

  const employees     = data?.content       ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages    ?? 0
  const fromRow       = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const toRow         = Math.min((page + 1) * PAGE_SIZE, totalElements)

  const filtered = search
    ? employees.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()))
    : employees

  const handleToggle = async (id) => {
    setTogglingId(id)
    try { await toggleEmployee.mutateAsync(id) }
    finally { setTogglingId(null) }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Empleados</h2>
          {!isLoading && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {totalElements}
            </span>
          )}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98]">
          <UserPlus size={15} />
          Nuevo empleado
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nombre o email..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Empleado</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Email</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Estado</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Registrado</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 animate-pulse rounded-lg bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-sm font-medium text-gray-400">
                    {search ? `Sin resultados para "${search}"` : 'Aún no tenés empleados. Agregá el primero para empezar.'}
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const isSelf     = emp.id === currentUser?.id
                  const isToggling = togglingId === emp.id
                  return (
                    <tr key={emp.id}
                      className={`border-b border-gray-50 transition-colors hover:bg-gray-50/70 ${isFetching ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(emp.name)} text-xs font-bold text-white shadow-sm`}>
                            {initials(emp.name)}
                          </div>
                          <span className="max-w-[140px] truncate font-semibold text-gray-900">{emp.name}</span>
                        </div>
                      </td>
                      <td className="max-w-[180px] truncate px-5 py-3.5 text-gray-500">{emp.email}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          emp.active
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {emp.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{formatDate(emp.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setPermTarget(emp)}
                            className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                            <Shield size={12} />Permisos
                          </button>
                          <button onClick={() => handleToggle(emp.id)}
                            disabled={isSelf || isToggling}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              emp.active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}>
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
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-700">{fromRow}–{toRow}</span> de{' '}
              <span className="font-semibold text-gray-700">{totalElements}</span> empleados
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} />Anterior
              </button>
              <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Siguiente<ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && <CreateEmployeeModal businessName={currentUser?.businessName} onClose={() => setShowModal(false)} />}
      {permTarget && <PermissionsPanel targetUser={permTarget} onClose={() => setPermTarget(null)} />}
    </div>
  )
}
