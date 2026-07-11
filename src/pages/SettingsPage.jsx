import { User, Building2, Mail, Shield, LogOut, MonitorX, Moon, Sun, Loader2, Eye, EyeOff, BookOpen, Package, ChevronRight, Pencil, Globe, FileDigit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { usersApi } from '../services/endpoints/users'
import { businessesApi } from '../services/endpoints/businesses'

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  EMPLOYEE: 'Empleado',
}

const ROLE_COLOR = {
  SUPER_ADMIN: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  OWNER:       'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  EMPLOYEE:    'bg-slate-100 text-slate-600',
}

const AVATAR_GRADIENT = {
  SUPER_ADMIN: 'from-indigo-400 to-indigo-600',
  OWNER:       'from-blue-500 to-blue-700',
  EMPLOYEE:    'from-slate-400 to-slate-600',
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3.5 border-b border-gray-50 py-3.5 last:border-0">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h3>
        {action}
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

function EditButton({ editing, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
    >
      <Pencil size={12} />
      {editing ? 'Cancelar' : 'Editar'}
    </button>
  )
}

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword:     z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Requerido'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 pr-10'

function PasswordField({ label, name, register, error, showMap, toggleShow }) {
  const show = showMap[name]
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          {...register(name)}
          type={show ? 'text' : 'password'}
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => toggleShow(name)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  )
}

function ChangePasswordForm() {
  const [pending, setPending] = useState(false)
  const [show, setShow] = useState({ currentPassword: false, newPassword: false, confirmPassword: false })
  const toggleShow = (field) => setShow((s) => ({ ...s, [field]: !s[field] }))

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(pwSchema),
  })

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setPending(true)
    try {
      await usersApi.changePassword({ currentPassword, newPassword })
      toast.success('Contraseña actualizada')
      reset()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al cambiar la contraseña')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3 py-4">
      <PasswordField label="Contraseña actual"   name="currentPassword" register={register} error={errors.currentPassword} showMap={show} toggleShow={toggleShow} />
      <PasswordField label="Nueva contraseña"    name="newPassword"     register={register} error={errors.newPassword}     showMap={show} toggleShow={toggleShow} />
      <PasswordField label="Confirmar contraseña" name="confirmPassword" register={register} error={errors.confirmPassword} showMap={show} toggleShow={toggleShow} />
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {pending ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </div>
    </form>
  )
}

// ── Mi perfil (editar nombre / email propios) ──────────────────────────────

const profileSchema = z.object({
  name:  z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
})

function ProfileSection() {
  const { user, refreshUser, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  const onSubmit = async ({ name, email }) => {
    setPending(true)
    try {
      const emailChanged = email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase()
      await usersApi.updateMe({ name, email })
      if (emailChanged) {
        // El JWT usa el email: la sesión actual deja de ser válida
        toast.success('Email actualizado. Inicia sesión de nuevo con tu nuevo email.')
        await logout()
        return
      }
      toast.success('Perfil actualizado')
      await refreshUser()
      setEditing(false)
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al actualizar el perfil')
    } finally {
      setPending(false)
    }
  }

  const cancel = () => { reset(); setEditing(false) }

  return (
    <Section
      title="Mi perfil"
      action={<EditButton editing={editing} onClick={() => (editing ? cancel() : setEditing(true))} />}
    >
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3 py-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('name')} type="text" className={inputCls} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input {...register('email')} type="email" className={inputCls} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            <p className="mt-1 text-xs text-gray-400">
              Si cambias tu email tendrás que iniciar sesión de nuevo.
            </p>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              {pending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <InfoRow icon={User}      label="Nombre"   value={user?.name} />
          <InfoRow icon={Mail}      label="Email"    value={user?.email} />
          <InfoRow icon={Shield}    label="Rol"      value={ROLE_LABEL[user?.role] ?? user?.role} />
          <InfoRow icon={Building2} label="Negocio"  value={user?.businessName} />
        </>
      )}
    </Section>
  )
}

// ── Mi negocio (OWNER edita los datos de su negocio) ───────────────────────

const COUNTRIES = [
  ['PE', 'Perú'], ['AR', 'Argentina'], ['BO', 'Bolivia'], ['BR', 'Brasil'],
  ['CL', 'Chile'], ['CO', 'Colombia'], ['EC', 'Ecuador'], ['MX', 'México'],
  ['PY', 'Paraguay'], ['UY', 'Uruguay'], ['VE', 'Venezuela'], ['ES', 'España'],
  ['US', 'Estados Unidos'],
]

const COUNTRY_NAME = Object.fromEntries(COUNTRIES)

const businessSchema = z.object({
  name:        z.string().min(1, 'Requerido'),
  countryCode: z.string().min(2, 'Requerido').max(3),
  taxIdType:   z.string().min(1, 'Requerido'),
  taxId:       z.string().min(1, 'Requerido'),
})

function BusinessSection() {
  const { user, refreshUser } = useAuth()
  const [business, setBusiness] = useState(null)
  const [editing, setEditing]   = useState(false)
  const [pending, setPending]   = useState(false)

  const isOwner = user?.role === 'OWNER'

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(businessSchema),
    values: {
      name:        business?.name ?? '',
      countryCode: business?.countryCode ?? 'PE',
      taxIdType:   business?.taxIdType ?? 'RUC',
      taxId:       business?.taxId ?? '',
    },
  })

  useEffect(() => {
    if (!user?.businessId) return
    businessesApi.getMine()
      .then((res) => setBusiness(res.data.data ?? res.data))
      .catch(() => { /* la sección queda en "Cargando..." */ })
  }, [user?.businessId])

  if (!user?.businessId) return null

  const onSubmit = async (data) => {
    setPending(true)
    try {
      const res = await businessesApi.updateMine(data)
      setBusiness(res.data.data ?? res.data)
      toast.success('Datos del negocio actualizados')
      await refreshUser() // refresca businessName en el header
      setEditing(false)
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al actualizar el negocio')
    } finally {
      setPending(false)
    }
  }

  const cancel = () => { reset(); setEditing(false) }

  const countryLabel = business
    ? (COUNTRY_NAME[business.countryCode] ?? business.countryCode)
    : null

  return (
    <Section
      title="Mi negocio"
      action={isOwner ? <EditButton editing={editing} onClick={() => (editing ? cancel() : setEditing(true))} /> : null}
    >
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3 py-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre del negocio</label>
            <input {...register('name')} type="text" className={inputCls} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">País</label>
            <select {...register('countryCode')} className={inputCls}>
              {business?.countryCode && !COUNTRY_NAME[business.countryCode] && (
                <option value={business.countryCode}>{business.countryCode}</option>
              )}
              {COUNTRIES.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            {errors.countryCode && <p className="mt-1 text-xs text-red-500">{errors.countryCode.message}</p>}
          </div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de doc.</label>
              <input {...register('taxIdType')} type="text" placeholder="RUC, CUIT, NIT..." className={inputCls} />
              {errors.taxIdType && <p className="mt-1 text-xs text-red-500">{errors.taxIdType.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Número</label>
              <input {...register('taxId')} type="text" className={inputCls} />
              {errors.taxId && <p className="mt-1 text-xs text-red-500">{errors.taxId.message}</p>}
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              {pending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      ) : business ? (
        <>
          <InfoRow icon={Building2} label="Nombre"   value={business.name} />
          <InfoRow icon={Globe}     label="País"     value={countryLabel} />
          <InfoRow icon={FileDigit} label={business.taxIdType || 'Documento'} value={business.taxId} />
        </>
      ) : (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" /> Cargando...
        </div>
      )}
    </Section>
  )
}

export default function SettingsPage() {
  const { user, logout, logoutAll } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [loggingOutAll, setLoggingOutAll] = useState(false)
  const navigate = useNavigate()

  // Lanzar el tutorial del modal de producto: seteamos bandera en
  // sessionStorage y navegamos a /productos. ProductsPage la lee al
  // montarse y abre el modal en modo tutorial.
  const openProductTutorial = () => {
    try { sessionStorage.setItem('eazystock_product_tutorial_pending', '1') } catch {}
    navigate('/products')
  }

  const handleLogoutAll = async () => {
    if (!confirm('¿Cerrar sesión en todos los dispositivos?')) return
    setLoggingOutAll(true)
    await logoutAll()
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const gradient = AVATAR_GRADIENT[user?.role] ?? 'from-gray-400 to-gray-600'

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">

      {/* Profile header card */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-16 bg-gradient-to-r from-[#111827] to-slate-700" />
        <div className="px-6 pb-5">
          <div className="-mt-7 flex items-end justify-between">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-xl font-extrabold text-white shadow-lg ring-4 ring-white`}>
              {initials}
            </div>
            <span className={`mb-1 rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLOR[user?.role] ?? 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABEL[user?.role] ?? user?.role}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-gray-900">{user?.name}</p>
            {user?.email && <p className="text-sm text-gray-400">{user.email}</p>}
          </div>
        </div>
      </div>

      {/* Profile info (editable) */}
      <ProfileSection />

      {/* Business info (editable por OWNER) */}
      <BusinessSection />

      {/* Appearance */}
      <Section title="Apariencia">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
            {isDark
              ? <Sun  size={15} className="text-yellow-500" />
              : <Moon size={15} className="text-slate-500"  />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {isDark ? 'Modo claro' : 'Modo oscuro'}
            </p>
            <p className="text-xs text-gray-400">
              {isDark ? 'Cambiar a interfaz clara' : 'Cambiar a interfaz oscura'}
            </p>
          </div>
          {/* Toggle pill */}
          <div className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            isDark ? 'bg-blue-600' : 'bg-gray-200'
          }`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </div>
        </button>
      </Section>

      {/* Password */}
      <Section title="Cambiar contraseña">
        <ChangePasswordForm />
      </Section>

      {/* Help */}
      <Section title="Ayuda">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('eazystock:show-tutorial'))}
          className="flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-gray-50 transition-colors border-b border-gray-50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <BookOpen size={15} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Ver tutorial</p>
            <p className="text-xs text-gray-400">Repasa las funciones principales de la app</p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        <button
          onClick={openProductTutorial}
          className="flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <Package size={15} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Cómo agregar un producto</p>
            <p className="text-xs text-gray-400">Tutorial interactivo paso a paso sobre el formulario</p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </Section>

      {/* Session */}
      <Section title="Sesión">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-red-50 transition-colors group border-b border-gray-50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 transition-colors group-hover:bg-red-100">
            <LogOut size={15} className="text-red-500" />
          </div>
          <span className="text-sm font-semibold text-red-500">Cerrar sesión</span>
        </button>
        <button
          onClick={handleLogoutAll}
          disabled={loggingOutAll}
          className="flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-red-50 transition-colors group disabled:opacity-50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 transition-colors group-hover:bg-red-100">
            <MonitorX size={15} className="text-red-400" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-red-400">Cerrar sesión en todos los dispositivos</span>
            <p className="text-xs text-gray-400">Invalida todas las sesiones activas</p>
          </div>
        </button>
      </Section>

      <p className="text-center text-xs text-gray-300">Eazy Stock · v1.0</p>
    </div>
  )
}
