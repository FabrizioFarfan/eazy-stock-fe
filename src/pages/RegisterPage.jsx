import { useEffect, useMemo, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, ArrowLeft, Eye, EyeOff, Loader2, Sparkles, ShieldCheck, Clock, Award } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT, dateLocale } from '../i18n'
import LangSwitcher from '../i18n/LangSwitcher'
import { useNoAppDarkMode } from './landing/useNoAppDarkMode'
import { usePageSeo } from './landing/site'
import { CURRENCIES, CURRENCY_OPTIONS, CURRENCY_BY_COUNTRY } from '../utils/formatMoney'
import { COUNTRIES } from '../utils/countries'
import { getErrorCode, getErrorField, getErrorMessage } from '../utils/handleApiError'
import { promoActive, promoVars, trialLine, afterPromoLine } from './landing/plans'
import { usePlans } from '../hooks/useSubscription'
import { isValidPeruRuc, TAX_ID_LABEL } from '../utils/taxIds'

/**
 * /registro — registro propio con prueba gratis (M1 «Planes en serio», 15-oct-2026).
 * Promo de lanzamiento (Frank + Fabrizio, 19-oct-2026, task 1001): gratis hasta el
 * 15 de diciembre sin tarjeta; los primeros 50 negocios son fundadores (mitad de
 * precio 6 meses). RUC obligatorio, válido y único (task 1002). Regla post-promo
 * (task 1018): después del 15-dic, 1 mes gratis y el segundo mes a mitad de precio.
 * El BE manda en POST /auth/register. Mismo chrome oscuro que el login: panel izquierdo + formulario.
 */

const PERKS_PROMO = [
  [Clock,       'Gratis hasta el {date} con tu negocio real, sin tarjeta'],
  [Award,       'Los primeros {n} negocios pagan la mitad los primeros {months} meses'],
  [ShieldCheck, 'Tus datos se quedan contigo: si no sigues, no se borra nada'],
]
/** Después de la promo: {trial} = «1 mes»; la 2.ª ventaja es afterPromoLine (segundo mes a mitad de precio). */
const PERKS_AFTER = [
  [Clock,       '{trial} gratis con tu negocio real, sin tarjeta'],
  [Sparkles,    (t) => afterPromoLine(t, { capital: true }) || t('Eliges tu plan solo cuando termina la prueba')],
  [ShieldCheck, 'Tus datos se quedan contigo: si no sigues, no se borra nada'],
]

const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

const makeSchema = (t) => z.object({
  name:         z.string().trim().min(2, t('Mínimo 2 caracteres')),
  email:        z.string().trim().email(t('Email inválido')),
  password:     z.string().min(6, t('Mínimo 6 caracteres')),
  businessName: z.string().trim().min(2, t('Mínimo 2 caracteres')),
  countryCode:  z.string().min(2, t('Requerido')).max(3),
  taxId:        z.string().trim().min(1, t('El RUC es obligatorio')),
  currency:     z.string().length(3, t('Requerido')),
  phone:        z.string().trim().optional(),
  accept:       z.boolean().refine((v) => v === true, { message: t('Necesitamos que aceptes la política de privacidad') }),
}).superRefine((v, ctx) => {
  // Perú: RUC real de SUNAT (11 dígitos + verificador). Otros países: 6-20 letras o números.
  const id = v.taxId.replace(/[\s.-]/g, '').toUpperCase()
  const ok = v.countryCode === 'PE' ? isValidPeruRuc(id) : /^[A-Z0-9]{6,20}$/.test(id)
  if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taxId'], message: v.countryCode === 'PE'
    ? t('Ese RUC no es válido: son 11 dígitos y empieza por 10 o 20')
    : t('Entre 6 y 20 letras o números') })
})

export default function RegisterPage() {
  const t = useT()
  const { register: registerAccount, token, isLoading } = useAuth()
  const schema = useMemo(() => makeSchema(t), [t])
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { data: plans } = usePlans()
  const promo = promoActive()
  const vars = promoVars(dateLocale())
  useNoAppDarkMode()
  usePageSeo({
    title: t('Crear cuenta — Eazy Stock'),
    description: promo
      ? t('Crea tu cuenta de Eazy Stock en un minuto: gratis hasta el {date}, sin tarjeta, con tu negocio real.', vars)
      : t('Crea tu cuenta de Eazy Stock en un minuto: {trial} gratis, sin tarjeta, con tu negocio real.', vars),
    path: '/registro',
  })

  const { register, handleSubmit, watch, setValue, setError: setFieldError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', businessName: '', countryCode: 'PE', taxId: '', currency: 'PEN', phone: '', accept: false },
  })

  // Al cambiar el país se propone su moneda (se puede corregir).
  const watchedCountry = watch('countryCode')
  useEffect(() => {
    const suggested = CURRENCY_BY_COUNTRY[watchedCountry]
    if (suggested) setValue('currency', suggested)
  }, [watchedCountry, setValue])

  if (!isLoading && token) return <Navigate to="/dashboard" replace />

  const onSubmit = async ({ accept, phone, ...values }) => {
    void accept
    setError('')
    setSubmitting(true)
    try {
      await registerAccount({ ...values, email: values.email.toLowerCase(), phone: phone?.trim() || undefined })
    } catch (err) {
      const field = getErrorField(err)
      if (getErrorCode(err) === 'DUPLICATE_EMAIL' || field === 'email') {
        setFieldError('email', { type: 'server', message: 'DUPLICATE_EMAIL' })
      } else if (getErrorCode(err) === 'DUPLICATE_TAX_ID') {
        setFieldError('taxId', { type: 'server', message: 'DUPLICATE_TAX_ID' })
      } else if (field && ['password', 'name', 'businessName', 'countryCode', 'currency', 'phone', 'taxId'].includes(field)) {
        setFieldError(field, { type: 'server', message: getErrorMessage(err) })
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const perks = promo ? PERKS_PROMO : PERKS_AFTER
  const taxLabel = TAX_ID_LABEL[watchedCountry] ?? t('Identificación fiscal')

  return (
    <div className="flex min-h-screen">
      {/* Panel de marca — solo escritorio */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0a0e1a] px-14 py-12 lg:flex lg:w-[48%] xl:px-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/30 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-400/10 blur-[140px]" />
        </div>
        <Link to="/" className="relative flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="Eazy Stock" className="h-9 w-9 rounded-xl object-contain" />
          <span className="text-lg font-bold text-white">Eazy Stock</span>
        </Link>

        <div className="relative">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {trialLine(t, dateLocale())}
          </span>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white">
            {t('Tu tienda, ordenada')}<br />
            <span className="text-slate-400">{t('desde esta tarde.')}</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-400">
            {t('Sube tu Excel, vende con el celular y cierra la caja sabiendo cuánto entró.')}
          </p>
          <ul className="mt-10 space-y-4">
            {perks.map(([Icon, text], i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/20">
                  <Icon size={13} className="text-blue-400" />
                </span>
                <span className="text-sm text-slate-300">{typeof text === 'function' ? text(t) : t(text, vars)}</span>
              </li>
            ))}
          </ul>
          {promo && plans && (
            <p className={`mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ${plans.foundersAvailable ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>
              <Award size={13} /> {plans.foundersAvailable ? t('Aún hay lugar entre los primeros {n}', vars) : t('Los primeros {n} ya entraron', vars)}
            </p>
          )}
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Eazy Stock · {t('una app de Eazy Life Company')}
          <span className="mx-2 text-slate-700">·</span>
          <Link to="/impressum" className="hover:text-slate-300">Impressum</Link>
          <span className="mx-2 text-slate-700">·</span>
          <Link to="/datenschutz" className="hover:text-slate-300">{t('Privacidad')}</Link>
          <span className="mx-2 text-slate-700">·</span>
          <Link to="/terminos" className="hover:text-slate-300">{t('Términos')}</Link>
        </p>
      </div>

      {/* Formulario */}
      <div className="relative flex flex-1 items-center justify-center bg-gray-50 px-6 py-12">
        <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
          <Link to="/" className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft size={13} /> {t('Volver')}
          </Link>
          <LangSwitcher compact />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 mt-8 flex flex-col items-center gap-3 lg:hidden">
            <Link to="/" className="transition-opacity hover:opacity-80">
              <img src="/logo.png" alt="Eazy Stock" className="h-16 w-16 rounded-2xl object-contain" />
            </Link>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{t('Crea tu cuenta')}</h2>
              <p className="mt-1 text-sm text-gray-500">{trialLine(t, dateLocale())}</p>
            </div>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold text-gray-900">{t('Crea tu cuenta')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('Un minuto y ya estás vendiendo.')} {trialLine(t, dateLocale())}.</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Tu nombre')}</label>
                <input id="name" {...register('name')} type="text" autoComplete="name" placeholder={t('María García')} className={inputCls} />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Correo electrónico')}</label>
                <input id="email" {...register('email')} type="email" autoComplete="email" placeholder={t('usuario@empresa.com')} className={inputCls} />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message === 'DUPLICATE_EMAIL'
                      ? <>{t('Ese correo ya tiene cuenta.')} <Link to="/login" className="font-semibold underline">{t('Inicia sesión')}</Link></>
                      : errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Contraseña')}</label>
                <div className="relative">
                  <input id="password" {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder={t('Mínimo 6 caracteres')} className={`${inputCls} pr-12`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                    aria-label={showPassword ? t('Ocultar contraseña') : t('Mostrar contraseña')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Nombre de tu negocio')}</label>
                <input id="businessName" {...register('businessName')} type="text" autoComplete="organization" placeholder={t('Bodega Doña María')} className={inputCls} />
                {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName.message}</p>}
              </div>

              <div>
                <label htmlFor="taxId" className="mb-1.5 block text-sm font-medium text-gray-700">{taxLabel}</label>
                <input id="taxId" {...register('taxId')} type="text" inputMode={watchedCountry === 'PE' ? 'numeric' : 'text'} autoComplete="off"
                  placeholder={watchedCountry === 'PE' ? '20123456786' : t('Tu número fiscal')} className={inputCls} data-testid="register-tax-id" />
                <p className="mt-1 text-xs text-gray-400">
                  {watchedCountry === 'PE'
                    ? t('El RUC de tu negocio en SUNAT (11 dígitos). Uno por negocio: es lo que hace legal tu cuenta.')
                    : t('La identificación fiscal de tu negocio. Una por negocio.')}
                </p>
                {errors.taxId && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.taxId.message === 'DUPLICATE_TAX_ID'
                      ? <>{t('Ya hay un negocio con ese RUC.')} <Link to="/login" className="font-semibold underline">{t('Inicia sesión')}</Link></>
                      : errors.taxId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="countryCode" className="mb-1.5 block text-sm font-medium text-gray-700">{t('País')}</label>
                  <select id="countryCode" {...register('countryCode')} className={inputCls}>
                    {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{t(label)}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Moneda')}</label>
                  <select id="currency" {...register('currency')} className={inputCls}>
                    {CURRENCY_OPTIONS.map((code) => <option key={code} value={code}>{code} · {CURRENCIES[code].symbol}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('WhatsApp')} <span className="font-normal text-gray-400">({t('opcional')})</span>
                </label>
                <input id="phone" {...register('phone')} type="tel" autoComplete="tel" placeholder="+51 999 999 999" className={inputCls} />
                <p className="mt-1 text-xs text-gray-400">{t('Solo para ayudarte a arrancar y avisarte cuando termine la prueba.')}</p>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <label className="flex items-start gap-3 rounded-xl bg-gray-50 px-3.5 py-3 text-xs text-gray-600">
                <input type="checkbox" {...register('accept')} className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                <span>
                  {t('Acepto la')}{' '}
                  <Link to="/datenschutz" target="_blank" className="font-semibold text-blue-600 hover:underline">{t('política de privacidad')}</Link>
                  {' '}{t('y que Eazy Stock guarde los datos de mi negocio para prestarme el servicio.')}
                </span>
              </label>
              {errors.accept && <p className="-mt-2 text-xs text-red-500">{errors.accept.message}</p>}

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{error}</div>
              )}

              <button type="submit" disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {submitting ? t('Creando tu cuenta...') : t('Crear mi cuenta gratis')}
              </button>
              <p className="text-center text-[11px] text-gray-400">{trialLine(t, dateLocale())} · {t('cancelas cuando quieras')}</p>
              {/* Términos (22-oct-2026): aceptación expresa antes de cobrar con Stripe */}
              <p className="text-center text-[11px] text-gray-400">
                {t('Al crear la cuenta aceptas los')}{' '}
                <Link to="/terminos" target="_blank" className="font-semibold text-gray-500 hover:text-blue-600 hover:underline">{t('Términos')}</Link>
                {' '}{t('y la')}{' '}
                <Link to="/datenschutz" target="_blank" className="font-semibold text-gray-500 hover:text-blue-600 hover:underline">{t('Política de privacidad')}</Link>
              </p>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            {t('¿Ya tienes cuenta?')}{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">{t('Iniciar sesión')}</Link>
          </p>
          <p className="mt-3 text-center text-xs text-gray-400 lg:hidden">
            <Link to="/impressum" className="hover:text-gray-600">Impressum</Link>
            <span className="mx-2">·</span>
            <Link to="/datenschutz" className="hover:text-gray-600">{t('Privacidad')}</Link>
            <span className="mx-2">·</span>
            <Link to="/terminos" className="hover:text-gray-600">{t('Términos')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
