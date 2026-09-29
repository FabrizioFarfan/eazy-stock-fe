import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, X, Loader2, Power, Shield, Search, ChevronLeft, ChevronRight, Lightbulb, Trash2, RotateCcw, UserX, AlertTriangle, Pencil, Users, Trophy } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useEmployees, useCreateEmployee, useToggleEmployee, useDeleteEmployee } from '../hooks/useEmployees'
import { getUserPermissions, patchUserPermissions } from '../services/endpoints/permissions'
import { getErrorMessage, getErrorField } from '../utils/handleApiError'
import HelpDrawer from '../components/common/HelpDrawer'
import { ReportHero, ReportHeader, NewButton } from '../components/reports/ReportKit'
import { useSellerPerformance } from '../hooks/useReports'
import { formatPrice } from '../utils/formatMoney'
import { localISODate } from '../utils/formatDate'
import { Link } from 'react-router-dom'
import EditUserModal from '../components/EditUserModal'
import { useT, dateLocale } from '../i18n'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
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
  { key: 'canRegisterSale',        label: 'Registrar ventas' },
  { key: 'canCancelSale',          label: 'Cancelar ventas' },
  { key: 'canApplyDiscount',       label: 'Aplicar descuentos' },
  { key: 'canEditPrices',          label: 'Cambiar precios de venta' },
  { key: 'canViewReports',         label: 'Ver reportes' },
  { key: 'canViewCashClosing',     label: 'Ver cierre de caja (sin ganancias ni costos)' },
  { key: 'canManageEmployees',     label: 'Gestionar empleados' },
  { key: 'canManageSuppliers',     label: 'Gestionar proveedores y marcas' },
  // { key: 'canViewAuditLog',     label: 'Ver log de auditoría' }, — oculto hasta que exista la página de auditoría (tarea 251)
  { key: 'canSellOnCredit',        label: 'Vender al fiado' },
  { key: 'canManageCustomers',     label: 'Gestionar clientes y cuentas por cobrar' },
]

function PermissionsPanel({ targetUser, onClose }) {
  const t = useT()
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
            <h3 className="text-base font-bold text-gray-900">{t('Permisos')}</h3>
            <p className="mt-0.5 text-sm text-gray-400">{targetUser.name}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-4 text-xs text-gray-400">{t('Los cambios se aplican de inmediato')}</p>
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
                    <span className="text-sm font-medium text-gray-700">{t(label)}</span>
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
              {getErrorMessage(patch.error)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Create employee modal ─────────────────────────────────────────────────────

const makeSchema = (t) => z.object({
  firstName: z.string().min(2, t('Mínimo 2 caracteres')),
  lastName:  z.string().min(2, t('Mínimo 2 caracteres')),
  email:     z.string().email(t('Email inválido')),
  password:  z.string().min(6, t('Mínimo 6 caracteres')),
})

function CreateEmployeeModal({ businessName, onClose }) {
  const t = useT()
  const createEmployee = useCreateEmployee()
  const schema = useMemo(() => makeSchema(t), [t])
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ firstName, lastName, email, password }) => {
    try {
      const employee = await createEmployee.mutateAsync({
        name: `${firstName} ${lastName}`.trim(), email, password,
      })
      toast.success(t('Empleado {name} creado', { name: employee.name }))
      onClose()
    } catch (err) {
      const field = getErrorField(err)
      if (field && ['email', 'password'].includes(field)) {
        setError(field, { type: 'server', message: getErrorMessage(err) })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">{t('Nuevo empleado')}</h3>
            {businessName && <p className="mt-0.5 text-xs text-gray-400">{t('para {name}', { name: businessName })}</p>}
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
                  {t('Nombre')} <span className="text-red-400">*</span>
                </label>
                <input {...register('firstName')} placeholder="Maria" className={inputCls} />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('Apellido')} <span className="text-red-400">*</span>
                </label>
                <input {...register('lastName')} placeholder="García" className={inputCls} />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('Email')} <span className="text-red-400">*</span>
              </label>
              <input {...register('email')} type="email" placeholder="maria@empresa.com" className={inputCls} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('Contraseña temporal')} <span className="text-red-400">*</span>
              </label>
              <input {...register('password')} type="password" placeholder={t('Mínimo 6 caracteres')} className={inputCls} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {createEmployee.isError && !errors.email && !errors.password && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                {getErrorMessage(createEmployee.error)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {t('Cancelar')}
            </button>
            <button type="submit" disabled={createEmployee.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60">
              {createEmployee.isPending && <Loader2 size={14} className="animate-spin" />}
              {createEmployee.isPending ? t('Creando...') : t('Crear empleado')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confirmación de borrado definitivo ───────────────────────────────────────

function DeleteEmployeeModal({ employee, onClose }) {
  const t = useT()
  const del = useDeleteEmployee()
  const confirm = async () => {
    try {
      await del.mutateAsync(employee.id)
      toast.success(t('{name} borrado. Su correo {email} ya puede usarse de nuevo.', { name: employee.name, email: employee.email }))
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={22} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">{t('¿Borrar a {name} definitivamente?', { name: employee.name })}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {t('Nunca registró ventas ni operaciones, así que no se pierde ningún historial.')}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-500">✓</span>
              {t('El correo {email} queda libre para crear otro empleado.', { email: employee.email })}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-red-500">✕</span>
              {t('No se puede deshacer. Si solo quieres que vuelva a entrar, usa «Reactivar».')}
            </li>
          </ul>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
            {t('Cancelar')}
          </button>
          <button type="button" onClick={confirm} disabled={del.isPending}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60">
            {del.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {t('Borrar definitivamente')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirmación de dar de baja / reactivar ──────────────────────────────────

function ToggleEmployeeModal({ employee, onConfirm, onClose }) {
  const t = useT()
  const deactivating = employee.active
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${deactivating ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {deactivating ? <UserX size={22} /> : <RotateCcw size={22} />}
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">
            {deactivating ? t('¿Dar de baja a {name}?', { name: employee.name }) : t('¿Reactivar a {name}?', { name: employee.name })}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {deactivating ? (
              <>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-red-500">✕</span>{t('Deja de poder entrar al sistema en este mismo momento.')}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>{t('Su historial de ventas se conserva y su cuenta no se borra.')}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>{t('Lo encontrarás en la pestaña «Dados de baja» y podrás reactivarlo cuando quieras.')}</li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>{t('Vuelve a entrar con su mismo correo ({email}) y su contraseña de antes.', { email: employee.email })}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-emerald-500">✓</span>{t('Recupera los permisos que tenía; revísalos en «Permisos» si cambió de puesto.')}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-500">!</span>{t('Si vas a darle la cuenta a otra persona, usa el lápiz «Editar» para cambiar nombre y contraseña.')}</li>
              </>
            )}
          </ul>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
            {t('Cancelar')}
          </button>
          <button type="button" onClick={onConfirm}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] ${
              deactivating ? 'bg-red-600 shadow-red-600/30 hover:bg-red-700' : 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700'}`}>
            {deactivating ? <><Power size={14} />{t('Sí, dar de baja')}</> : <><RotateCcw size={14} />{t('Sí, reactivar')}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20
const BANNER_DISMISSED_KEY = 'permissions_banner_dismissed'

function PermissionsBanner({ onDismiss }) {
  const t = useT()
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 shadow-sm">
      <Lightbulb size={20} className="mt-0.5 flex-shrink-0 text-orange-500" />
      <div className="flex-1 text-sm text-orange-900">
        <p className="font-semibold">{t('Tip: configurá qué puede hacer cada empleado')}</p>
        <p className="mt-0.5 text-orange-800">
          {t('Hacé click en el botón')}{' '}
          <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-1.5 py-0.5 align-middle text-xs font-semibold text-white">
            <Shield size={11} /> {t('Permisos')}
          </span>{' '}
          {t('al lado de cada empleado para activar o desactivar acciones individuales (vender, recibir mercadería, aplicar descuentos, ver reportes y más).')}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
      >
        {t('Entendido')}
      </button>
    </div>
  )
}

export default function EmployeesPage() {
  const t = useT()
  const { user: currentUser } = useAuth()
  const [page, setPage]           = useState(0)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [permTarget, setPermTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [tab, setTab]             = useState('active')   // 'active' | 'inactive'
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem(BANNER_DISMISSED_KEY) === '1',
  )

  const dismissBanner = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, '1')
    setBannerDismissed(true)
  }

  const showInactive = tab === 'inactive'
  const { data, isLoading, isFetching } = useEmployees({ page, size: PAGE_SIZE, sort: 'createdAt,desc', active: !showInactive })
  // contador de la pestaña «Dados de baja» (solo el total, una fila)
  const { data: inactiveMeta } = useEmployees({ page: 0, size: 1, active: false })
  const inactiveCount = inactiveMeta?.totalElements ?? 0
  const { data: activeMeta } = useEmployees({ page: 0, size: 1, active: true })
  // Lo vendido este mes por cada uno (solo si ve reportes).
  const { can } = useAuth()
  const canReports = can('canViewReports')
  const monthStart = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` })()
  const { data: perf } = useSellerPerformance(
    { from: monthStart, to: localISODate(), ...(currentUser?.businessId ? { businessId: currentUser.businessId } : {}) },
    { enabled: canReports },
  )
  const perfById = Object.fromEntries((perf?.sellers ?? []).map((x) => [x.employeeId, x]))
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

  const handleToggle = async (emp) => {
    setToggleTarget(null)
    setTogglingId(emp.id)
    try {
      await toggleEmployee.mutateAsync(emp.id)
      if (emp.active) {
        toast.success(t('{name} dado de baja. Lo encuentras en la pestaña «Dados de baja»; puedes reactivarlo cuando quieras.', { name: emp.name }))
      } else {
        toast.success(t('{name} reactivado: ya puede volver a entrar con su mismo correo.', { name: emp.name }))
        setTab('active')
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally { setTogglingId(null) }
  }

  const switchTab = (next) => { setTab(next); setPage(0); setSearch('') }

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Users} title={t('Empleados')}
        subtitle={t('Tu equipo: quién entra, qué puede hacer y cuánto vende')}
        help={(
          <HelpDrawer title={t('Cómo usar Empleados')} autoOpenKey="eazystock_employees_help_v3">
            <p>{t('Crea cuentas para tu equipo: cada uno entra con su propio usuario y tú controlas qué puede hacer.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🔐 {t('Permisos finos')}</p>
              <p className="mt-1">{t('En el botón "Permisos" de cada empleado activas o desactivas acciones una por una: gestionar productos, recibir mercadería, registrar y cancelar ventas, aplicar descuentos, editar precios, ver reportes, gestionar proveedores y marcas, vender al fiado y gestionar clientes. Lo que no le actives, no lo ve. Los cambios se aplican al instante. El ajuste manual de stock no se delega: es solo del dueño; el vendedor mueve stock con ventas, recepciones y devoluciones.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🧾 {t('Ver cierre de caja (sin ganancias ni costos)')}</p>
              <p className="mt-1">{t('Permiso pensado para quien cierra el turno: el empleado ve en Balance el cierre de caja del día por medio de pago (efectivo, Yape, Plin, tarjeta…) y el total vendido, pero NO ve ganancias, costos ni márgenes. Así puede cuadrar la caja sin conocer cuánto ganas.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🛒 {t('¿Qué ve un vendedor limitado?')}</p>
              <p className="mt-1">{t('Un empleado con solo "Registrar ventas" entra directo al punto de venta: busca productos (también con escáner de código de barras/QR), cobra y emite el ticket. No ve reportes, costos, precios de compra, proveedores ni empleados; no puede fiar ni aplicar descuentos salvo que le des esos permisos; y solo ve su propio ranking de ventas.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📈 {t('Seguimiento')}</p>
              <p className="mt-1">{t('Cada venta queda registrada con su vendedor. En Reportes ves el ranking de vendedores: quién vendió cuánto cada día.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🚫 {t('Dar de baja')}</p>
              <p className="mt-1">{t('Si alguien deja de trabajar contigo, dale de baja: pierde el acceso al instante, pero su historial de ventas se conserva y su cuenta no desaparece.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🗂️ {t('Pestaña «Dados de baja»')}</p>
              <p className="mt-1">{t('Arriba de la tabla tienes dos pestañas: «Activos» y «Dados de baja». En la segunda ves a todos los que desactivaste y puedes:')}</p>
              <ul className="mt-2 space-y-1.5">
                <li>↩️ <span className="font-semibold">{t('Reactivar')}</span>: {t('vuelve a entrar con su mismo correo y contraseña. Ideal si diste de baja a alguien y luego lo necesitas, o si quieres darle esa cuenta a otro trabajador (con el lápiz «Editar» le cambias el nombre y la contraseña).')}</li>
                <li>🗑️ <span className="font-semibold">{t('Borrar definitivamente')}</span>: {t('solo aparece si esa persona NUNCA registró una venta ni una operación (por ejemplo, cuentas de prueba). Libera su correo para usarlo en un empleado nuevo. Si ya vendió, no se puede borrar: se queda dado de baja para no perder el historial.')}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">✉️ {t('«Ese correo ya existe»')}</p>
              <p className="mt-1">{t('Si al crear un empleado te dice que el correo ya existe, casi siempre es de alguien que diste de baja. No hace falta otro correo: ve a «Dados de baja» y reactívalo, o bórralo si nunca vendió.')}</p>
            </div>
          </HelpDrawer>
        )}
        right={<NewButton onClick={() => setShowModal(true)}><UserPlus size={15} />{t('Nuevo empleado')}</NewButton>} />

      {/* Franja del equipo */}
      <ReportHero icon={Users} label={t('Tu equipo')} loading={activeMeta == null}
        value={activeMeta?.totalElements ?? 0}
        sub={<span>{t('empleados activos que pueden entrar hoy')}</span>}
        cells={[
          [t('Dados de baja'), inactiveCount],
          ...(canReports ? [[t('Vendido este mes'), formatPrice(perf?.totalRevenue ?? 0)], [t('Ventas este mes'), perf?.totalSales ?? 0]] : []),
        ]}>
        {canReports && (
          <Link to="/reports/sellers" className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white">
            <Trophy size={13} /> {t('Ver el ranking de vendedores')} <ChevronRight size={13} />
          </Link>
        )}
      </ReportHero>

      {currentUser?.role === 'OWNER' && !bannerDismissed && (
        <PermissionsBanner onDismiss={dismissBanner} />
      )}

      {/* Pestañas + buscador */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1" role="tablist">
          <button type="button" role="tab" aria-selected={!showInactive} onClick={() => switchTab('active')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              !showInactive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Power size={13} className={!showInactive ? 'text-emerald-500' : ''} />{t('Activos')}
          </button>
          <button type="button" role="tab" aria-selected={showInactive} onClick={() => switchTab('inactive')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              showInactive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <UserX size={13} className={showInactive ? 'text-amber-500' : ''} />{t('Dados de baja')}
            {inactiveCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${showInactive ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}`}>{inactiveCount}</span>
            )}
          </button>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder={t('Buscar por nombre o email...')} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20" />
        </div>
      </div>

      {showInactive && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-500" />
          <p>
            <span className="font-semibold">{t('Estas personas ya no pueden entrar.')}</span>{' '}
            {t('«Reactivar» les devuelve el acceso con su mismo correo. «Borrar» solo aparece si nunca vendieron: libera el correo para un empleado nuevo.')}
          </p>
        </div>
      )}

      {/* Una tarjeta por persona (PC y celular): «Permisos» siempre a la vista
          (William no lo encontraba cinco columnas a la derecha de la tabla). */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
          {search ? (
            <p className="text-sm font-medium text-gray-400">{t('Sin resultados para "{q}"', { q: search })}</p>
          ) : showInactive ? (
            <div className="mx-auto max-w-md space-y-2">
              <p className="font-semibold text-gray-700">{t('Nadie dado de baja')}</p>
              <p className="text-sm text-gray-500">{t('Cuando des de baja a alguien aparecerá aquí: podrás reactivarlo o borrarlo si nunca vendió.')}</p>
            </div>
          ) : (
            <div className="mx-auto max-w-md space-y-3">
              <p className="font-semibold text-gray-700">{t('Aún no tenés empleados')}</p>
              <p className="text-sm text-gray-500">{t('Creá empleados y asignales permisos individuales: vender, recibir mercadería, aplicar descuentos, ver reportes y más.')}</p>
              <NewButton onClick={() => setShowModal(true)}><UserPlus size={15} />{t('Nuevo empleado')}</NewButton>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((emp) => {
            const isSelf     = emp.id === currentUser?.id
            const isToggling = togglingId === emp.id
            const mine       = perfById[emp.id]
            return (
              <div key={emp.id} className={`flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md ${isFetching ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3.5 p-5">
                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarGradient(emp.name)} text-base font-extrabold text-white shadow-md`}>
                    {initials(emp.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-bold leading-snug text-gray-900">{emp.name}</p>
                    <p className="truncate text-xs text-gray-400" title={emp.email}>{emp.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        emp.active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {emp.active ? t('Activo') : t('Dado de baja')}
                      </span>
                      <span className="text-[11px] text-gray-400">{t('Desde')} {formatDate(emp.createdAt)}</span>
                    </div>
                    {!emp.active && emp.hasActivity && (
                      <p className="mt-1 text-[11px] text-gray-400">{t('con historial de ventas')}</p>
                    )}
                  </div>
                  <button onClick={() => setEditTarget(emp)} title={t('Editar nombre, correo o contraseña')}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
                    <Pencil size={14} />
                  </button>
                </div>

                {canReports && emp.active && (
                  <div className="mx-5 mb-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('Vendido este mes')}</p>
                      <p className="text-base font-extrabold text-gray-900">{formatPrice(mine?.revenue ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('Ventas')}</p>
                      <p className="text-base font-extrabold text-gray-900">{mine?.sales ?? 0}</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-gray-100 px-5 py-3.5">
                  {emp.active && (
                    <button onClick={() => setPermTarget(emp)} title={t('Configurar permisos')}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-500/30 transition-all hover:bg-orange-600 active:scale-[0.97]">
                      <Shield size={15} />{t('Permisos')}
                    </button>
                  )}
                  <button onClick={() => setToggleTarget(emp)} disabled={isSelf || isToggling}
                    title={isSelf ? t('No puedes darte de baja a ti mismo') : emp.active ? t('Dar de baja: pierde el acceso, se conserva su historial') : t('Reactivar: vuelve a entrar con su mismo correo')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      emp.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'flex-1 bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700'
                    }`}>
                    {isToggling ? <Loader2 size={13} className="animate-spin" /> : emp.active ? <Power size={13} /> : <RotateCcw size={13} />}
                    {emp.active ? t('Dar de baja') : t('Reactivar')}
                  </button>
                  {!emp.active && (
                    <button onClick={() => setDeleteTarget(emp)} disabled={emp.hasActivity}
                      title={emp.hasActivity
                        ? t('Tiene ventas u operaciones: se conserva dado de baja para no perder el historial')
                        : t('Borrar definitivamente (libera su correo)')}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40">
                      <Trash2 size={13} />{t('Borrar')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-sm">
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-gray-700">{fromRow}–{toRow}</span> {t('de')}{' '}
            <span className="font-semibold text-gray-700">{totalElements}</span> {t('empleados')}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              <ChevronLeft size={14} />{t('Anterior')}
            </button>
            <span className="px-3 text-sm font-medium text-gray-500">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              {t('Siguiente')}<ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {showModal && <CreateEmployeeModal businessName={currentUser?.businessName} onClose={() => setShowModal(false)} />}
      {permTarget && <PermissionsPanel targetUser={permTarget} onClose={() => setPermTarget(null)} />}
      {editTarget && <EditUserModal targetUser={editTarget} onClose={() => setEditTarget(null)} />}
      {toggleTarget && <ToggleEmployeeModal employee={toggleTarget} onConfirm={() => handleToggle(toggleTarget)} onClose={() => setToggleTarget(null)} />}
      {deleteTarget && <DeleteEmployeeModal employee={deleteTarget} onClose={() => setDeleteTarget(null)} />}
    </div>
  )
}
