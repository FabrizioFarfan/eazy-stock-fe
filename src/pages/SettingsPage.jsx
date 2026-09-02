import { User, Building2, Coins, Mail, Shield, LogOut, MonitorX, Moon, Sun, Loader2, Eye, EyeOff, BookOpen, Package, ChevronRight, Pencil, Globe, FileDigit, MonitorDown, CheckCircle2, Share, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { usersApi } from '../services/endpoints/users'
import { businessesApi } from '../services/endpoints/businesses'
import { useInstallApp, promptInstall } from '../utils/installApp'
import { useT } from '../i18n'
import LangSwitcher from '../i18n/LangSwitcher'
import { CURRENCIES, CURRENCY_OPTIONS, CURRENCY_BY_COUNTRY } from '../utils/formatMoney'
import TutorialModal from '../components/tutorial/TutorialModal'
import { GUIDES, GUIDE_ORDER } from '../components/tutorial/guides'

const ROLE_LABEL = {
  BOSS: '👑 Boss',
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  EMPLOYEE: 'Empleado',
}

const ROLE_COLOR = {
  BOSS:        'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  SUPER_ADMIN: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  OWNER:       'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  EMPLOYEE:    'bg-slate-100 text-slate-600',
}

const AVATAR_GRADIENT = {
  BOSS:        'from-amber-400 to-orange-600',
  SUPER_ADMIN: 'from-indigo-400 to-indigo-600',
  OWNER:       'from-blue-500 to-blue-700',
  EMPLOYEE:    'from-slate-400 to-slate-600',
}

// El AuthContext normaliza BOSS → SUPER_ADMIN (+ isBoss); acá recuperamos la etiqueta real
const displayRole = (user) => (user?.isBoss ? 'BOSS' : user?.role)

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
  const t = useT()
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
    >
      <Pencil size={12} />
      {editing ? t('Cancelar') : t('Editar')}
    </button>
  )
}

const makePwSchema = (t) => z.object({
  currentPassword: z.string().min(1, t('Requerido')),
  newPassword:     z.string().min(6, t('Mínimo 6 caracteres')),
  confirmPassword: z.string().min(1, t('Requerido')),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: t('Las contraseñas no coinciden'),
  path: ['confirmPassword'],
})

const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400 pr-10'

function PasswordField({ label, name, register, error, showMap, toggleShow }) {
  const t = useT()
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
          aria-label={show ? t('Ocultar contraseña') : t('Mostrar contraseña')}
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
  const t = useT()
  const pwSchema = useMemo(() => makePwSchema(t), [t])
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
      toast.success(t('Contraseña actualizada'))
      reset()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t('Error al cambiar la contraseña'))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3 py-4">
      <PasswordField label={t('Contraseña actual')}    name="currentPassword" register={register} error={errors.currentPassword} showMap={show} toggleShow={toggleShow} />
      <PasswordField label={t('Nueva contraseña')}     name="newPassword"     register={register} error={errors.newPassword}     showMap={show} toggleShow={toggleShow} />
      <PasswordField label={t('Confirmar contraseña')} name="confirmPassword" register={register} error={errors.confirmPassword} showMap={show} toggleShow={toggleShow} />
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {pending ? t('Guardando...') : t('Cambiar contraseña')}
        </button>
      </div>
    </form>
  )
}

// ── Mi perfil (editar nombre / email propios) ──────────────────────────────

const makeProfileSchema = (t) => z.object({
  name:  z.string().min(1, t('Requerido')),
  email: z.string().email(t('Email inválido')),
})

function ProfileSection() {
  const t = useT()
  const profileSchema = useMemo(() => makeProfileSchema(t), [t])
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
        toast.success(t('Email actualizado. Inicia sesión de nuevo con tu nuevo email.'))
        await logout()
        return
      }
      toast.success(t('Perfil actualizado'))
      await refreshUser()
      setEditing(false)
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t('Error al actualizar el perfil'))
    } finally {
      setPending(false)
    }
  }

  const cancel = () => { reset(); setEditing(false) }

  return (
    <Section
      title={t('Mi perfil')}
      action={<EditButton editing={editing} onClick={() => (editing ? cancel() : setEditing(true))} />}
    >
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3 py-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Nombre')}</label>
            <input {...register('name')} type="text" className={inputCls} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input {...register('email')} type="email" className={inputCls} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            <p className="mt-1 text-xs text-gray-400">
              {t('Si cambias tu email tendrás que iniciar sesión de nuevo.')}
            </p>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              {pending ? t('Guardando...') : t('Guardar cambios')}
            </button>
          </div>
        </form>
      ) : (
        <>
          <InfoRow icon={User}      label={t('Nombre')}  value={user?.name} />
          <InfoRow icon={Mail}      label="Email"        value={user?.email} />
          <InfoRow icon={Shield}    label={t('Rol')}     value={t(ROLE_LABEL[displayRole(user)] ?? user?.role)} />
          <InfoRow icon={Building2} label={t('Negocio')} value={user?.businessName} />
        </>
      )}
    </Section>
  )
}

// ── Mi negocio (OWNER edita los datos de su negocio) ───────────────────────

const COUNTRIES = [
  ['PE', 'Perú'], ['AR', 'Argentina'], ['BO', 'Bolivia'], ['BR', 'Brasil'],
  ['CL', 'Chile'], ['CO', 'Colombia'], ['EC', 'Ecuador'], ['MX', 'México'],
  ['PY', 'Paraguay'], ['UY', 'Uruguay'], ['VE', 'Venezuela'], ['US', 'Estados Unidos'],
  // Europa (Frank, sep-2026): los mercados donde ya hay clientes o contactos
  ['ES', 'España'], ['IT', 'Italia'], ['PL', 'Polonia'], ['DE', 'Alemania'], ['FR', 'Francia'], ['PT', 'Portugal'],
]

const COUNTRY_NAME = Object.fromEntries(COUNTRIES)

const makeBusinessSchema = (t) => z.object({
  name:        z.string().min(1, t('Requerido')),
  countryCode: z.string().min(2, t('Requerido')).max(3),
  currency:    z.string().length(3, t('Requerido')),
  taxIdType:   z.string().min(1, t('Requerido')),
  taxId:       z.string().min(1, t('Requerido')),
})

function BusinessSection() {
  const t = useT()
  const businessSchema = useMemo(() => makeBusinessSchema(t), [t])
  const { user, refreshUser } = useAuth()
  const [business, setBusiness] = useState(null)
  const [editing, setEditing]   = useState(false)
  const [pending, setPending]   = useState(false)

  const isOwner = user?.role === 'OWNER'

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(businessSchema),
    values: {
      name:        business?.name ?? '',
      countryCode: business?.countryCode ?? 'PE',
      currency:    business?.currency ?? 'PEN',
      taxIdType:   business?.taxIdType ?? 'RUC',
      taxId:       business?.taxId ?? '',
    },
  })

  const watchedCountry = watch('countryCode')
  useEffect(() => {
    // al cambiar el país mientras se edita, proponer su moneda (el dueño puede corregirla)
    const suggested = CURRENCY_BY_COUNTRY[watchedCountry]
    if (editing && suggested && suggested !== business?.currency) setValue('currency', suggested)
  }, [watchedCountry]) // eslint-disable-line react-hooks/exhaustive-deps

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
      toast.success(t('Datos del negocio actualizados'))
      await refreshUser() // refresca businessName en el header
      setEditing(false)
    } catch (err) {
      toast.error(err?.response?.data?.message ?? t('Error al actualizar el negocio'))
    } finally {
      setPending(false)
    }
  }

  const cancel = () => { reset(); setEditing(false) }

  const countryLabel = business
    ? (COUNTRY_NAME[business.countryCode] ? t(COUNTRY_NAME[business.countryCode]) : business.countryCode)
    : null

  return (
    <Section
      title={t('Mi negocio')}
      action={isOwner ? <EditButton editing={editing} onClick={() => (editing ? cancel() : setEditing(true))} /> : null}
    >
      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3 py-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Nombre del negocio')}</label>
            <input {...register('name')} type="text" className={inputCls} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('País')}</label>
            <select {...register('countryCode')} className={inputCls}>
              {business?.countryCode && !COUNTRY_NAME[business.countryCode] && (
                <option value={business.countryCode}>{business.countryCode}</option>
              )}
              {COUNTRIES.map(([code, label]) => (
                <option key={code} value={code}>{t(label)}</option>
              ))}
            </select>
            {errors.countryCode && <p className="mt-1 text-xs text-red-500">{errors.countryCode.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Moneda')}</label>
            <select {...register('currency')} className={inputCls}>
              {CURRENCY_OPTIONS.map((code) => (
                <option key={code} value={code}>{code} · {CURRENCIES[code].symbol} — {t(CURRENCIES[code].name)}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">{t('Solo cambia el símbolo con el que se muestran los importes; no convierte montos.')}</p>
            {errors.currency && <p className="mt-1 text-xs text-red-500">{errors.currency.message}</p>}
          </div>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Tipo de doc.')}</label>
              <input {...register('taxIdType')} type="text" placeholder="RUC, CUIT, NIT..." className={inputCls} />
              {errors.taxIdType && <p className="mt-1 text-xs text-red-500">{errors.taxIdType.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('Número')}</label>
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
              {pending ? t('Guardando...') : t('Guardar cambios')}
            </button>
          </div>
        </form>
      ) : business ? (
        <>
          <InfoRow icon={Building2} label={t('Nombre')} value={business.name} />
          <InfoRow icon={Globe}     label={t('País')}   value={countryLabel} />
          <InfoRow icon={Coins}     label={t('Moneda')} value={`${business.currency ?? 'PEN'} · ${CURRENCIES[business.currency ?? 'PEN']?.symbol ?? ''}`} />
          <InfoRow icon={FileDigit} label={business.taxIdType || t('Documento')} value={business.taxId} />
        </>
      ) : (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" /> {t('Cargando...')}
        </div>
      )}
    </Section>
  )
}

// ── Instalar la app (PWA) ──────────────────────────────────────────────────

function InstallSection() {
  const t = useT()
  const { canPrompt, installed, ios } = useInstallApp()
  const [installing, setInstalling] = useState(false)

  const handleInstall = async () => {
    setInstalling(true)
    try {
      const outcome = await promptInstall()
      if (outcome === 'accepted') {
        toast.success(t('¡Listo! Busca «Eazy Stock» en tu escritorio o pantalla de inicio'))
      }
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Section title={t('Instalar la app')}>
      {installed ? (
        <div className="flex items-center gap-3.5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{t('La app ya está instalada')}</p>
            <p className="text-xs text-gray-400">
              {t('Búscala como «Eazy Stock» en tu escritorio o pantalla de inicio')}
            </p>
          </div>
        </div>
      ) : canPrompt ? (
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-blue-50 transition-colors disabled:opacity-60"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
            {installing
              ? <Loader2 size={15} className="animate-spin text-blue-600" />
              : <MonitorDown size={15} className="text-blue-600" />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-600">{t('Instalar en este dispositivo')}</p>
            <p className="text-xs text-gray-400">
              {t('Con su propio ícono y ventana, como cualquier aplicación')}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      ) : ios ? (
        <div className="flex items-start gap-3.5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Share size={15} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{t('Instalar en iPhone / iPad')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
              {t('Abre esta página en')} <span className="font-semibold text-gray-700">Safari</span>,{' '}
              {t('toca el botón')} <span className="font-semibold text-gray-700">{t('Compartir')}</span> {t('y elige')}{' '}
              <span className="font-semibold text-gray-700">{t('«Añadir a pantalla de inicio»')}</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3.5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <MoreVertical size={15} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{t('Instalar desde el navegador')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
              {t('Abre el menú')} <span className="font-semibold text-gray-700">⋮</span> {t('del navegador (arriba a la derecha) y elige')}{' '}
              <span className="font-semibold text-gray-700">{t('«Instalar Eazy Stock»')}</span>
              {' '}— {t('en el celular puede llamarse')}{' '}
              <span className="font-semibold text-gray-700">{t('«Añadir a pantalla de inicio»')}</span>.{' '}
              {t('Si no aparece, recarga la página y vuelve a intentar.')}
            </p>
          </div>
        </div>
      )}
    </Section>
  )
}

export default function SettingsPage() {
  const t = useT()
  const { user, logout, logoutAll } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [loggingOutAll, setLoggingOutAll] = useState(false)
  const navigate = useNavigate()

  // Lanzar el tutorial del modal de producto: seteamos bandera en
  // sessionStorage y navegamos a /productos. ProductsPage la lee al
  // montarse y abre el modal en modo tutorial.
  const [guide, setGuide] = useState(null)
  const openProductTutorial = () => {
    try { sessionStorage.setItem('eazystock_product_tutorial_pending', '1') } catch { /* storage bloqueado */ }
    navigate('/products')
  }

  const handleLogoutAll = async () => {
    if (!confirm(t('¿Cerrar sesión en todos los dispositivos?'))) return
    setLoggingOutAll(true)
    await logoutAll()
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const gradient = AVATAR_GRADIENT[displayRole(user)] ?? 'from-gray-400 to-gray-600'

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
            <span className={`mb-1 rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLOR[displayRole(user)] ?? 'bg-gray-100 text-gray-600'}`}>
              {t(ROLE_LABEL[displayRole(user)] ?? user?.role)}
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
      <Section title={t('Apariencia')}>
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
              {isDark ? t('Modo claro') : t('Modo oscuro')}
            </p>
            <p className="text-xs text-gray-400">
              {isDark ? t('Cambiar a interfaz clara') : t('Cambiar a interfaz oscura')}
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

      {/* Language */}
      <Section title={t('Idioma')}>
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <Globe size={15} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{t('Idioma de la app')}</p>
              <p className="text-xs text-gray-400">{t('Español, inglés o italiano')}</p>
            </div>
          </div>
          <LangSwitcher />
        </div>
      </Section>

      {/* Install PWA */}
      <InstallSection />

      {/* Password */}
      <Section title={t('Cambiar contraseña')}>
        <ChangePasswordForm />
      </Section>

      {/* Help */}
      <Section title={t('Ayuda')}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('eazystock:show-tutorial'))}
          className="flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-gray-50 transition-colors border-b border-gray-50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <BookOpen size={15} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{t('Ver tutorial')}</p>
            <p className="text-xs text-gray-400">{t('Repasa las funciones principales de la app')}</p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        <button
          onClick={openProductTutorial}
          className="flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-gray-50 transition-colors border-b border-gray-50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <Package size={15} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{t('Cómo agregar un producto')}</p>
            <p className="text-xs text-gray-400">{t('Tutorial interactivo paso a paso sobre el formulario')}</p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        {/* Guías por tema (2-sep-2026): las mismas tarjetas del tutorial, una por flujo */}
        {GUIDE_ORDER.map((key, i) => {
          const g = GUIDES[key]
          const Icon = g.icon
          return (
            <button
              key={key}
              onClick={() => setGuide(key)}
              className={`flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-gray-50 transition-colors ${i < GUIDE_ORDER.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${g.color}`}>
                <Icon size={15} className={g.iconColor} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{t(g.title)}</p>
                <p className="text-xs text-gray-400">{t(g.subtitle)}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          )
        })}
      </Section>
      {guide && <TutorialModal steps={GUIDES[guide].steps} heading={GUIDES[guide].title} onClose={() => setGuide(null)} />}

      {/* Session */}
      <Section title={t('Sesión')}>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3.5 -mx-5 px-5 py-4 rounded-xl text-left hover:bg-red-50 transition-colors group border-b border-gray-50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 transition-colors group-hover:bg-red-100">
            <LogOut size={15} className="text-red-500" />
          </div>
          <span className="text-sm font-semibold text-red-500">{t('Cerrar sesión')}</span>
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
            <span className="text-sm font-semibold text-red-400">{t('Cerrar sesión en todos los dispositivos')}</span>
            <p className="text-xs text-gray-400">{t('Invalida todas las sesiones activas')}</p>
          </div>
        </button>
      </Section>

      <p className="text-center text-xs text-gray-300">Eazy Stock · v1.0</p>
    </div>
  )
}
