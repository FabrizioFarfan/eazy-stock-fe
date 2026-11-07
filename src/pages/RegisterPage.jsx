import { useEffect, useMemo, useRef, useState } from 'react'
import { track } from '../analytics/track'
import { Navigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, ArrowLeft, Eye, EyeOff, Loader2, Sparkles, ShieldCheck, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT, dateLocale } from '../i18n'
import { browserRegions, setRegion } from '../i18n/region'
import LangSwitcher from '../i18n/LangSwitcher'
import { useNoAppDarkMode } from './landing/useNoAppDarkMode'
import { usePageSeo } from './landing/site'
import { OTHER_REGION, suggestedCountry } from '../utils/countries'
import { COUNTRIES as PHONE_COUNTRIES } from '../utils/phone'
import { useCountries } from '../hooks/useCountries'
import { countriesApi } from '../services/endpoints/countries'
import { getErrorCode, getErrorField, getErrorMessage } from '../utils/handleApiError'
import { promoActive, promoVars, trialLine } from './landing/plans'

/**
 * /registro — registro propio con prueba gratis (M1 «Planes en serio», 15-oct-2026).
 * Sin fricción (Frank, 7-nov-2026: entraban y nadie se registraba): una sola pantalla con negocio, país, correo y
 * contraseña. El país se propone solo (GET /api/public/geo, si no el navegador) y trae su moneda. La prueba es de Pro;
 * el plan se elige al terminar la prueba y el documento fiscal se pide antes de pagar (TaxIdModal). Regla post-promo
 * (task 1018): después del 15-dic, {trial} gratis sin tarjeta. El BE manda en POST /auth/register.
 */

const FLAG = Object.fromEntries(PHONE_COUNTRIES.map((c) => [c.iso, c.flag]))

const PERKS_PROMO = [
  [Clock,       'Gratis hasta el {date} con tu negocio real, sin tarjeta'],
  [Sparkles,    'Eliges tu plan solo cuando termina la prueba'],
  [ShieldCheck, 'Tus datos se quedan contigo: si no sigues, no se borra nada'],
]
/** Después de la promo: {trial} = «1 mes». */
const PERKS_AFTER = [
  [Clock,       '{trial} gratis con tu negocio real, sin tarjeta'],
  [Sparkles,    'Eliges tu plan solo cuando termina la prueba'],
  [ShieldCheck, 'Tus datos se quedan contigo: si no sigues, no se borra nada'],
]

const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'

const makeSchema = (t) => z.object({
  businessName: z.string().trim().min(2, t('Mínimo 2 caracteres')),
  countryCode:  z.string().min(2, t('Requerido')).max(3),
  email:        z.string().trim().email(t('Email inválido')),
  password:     z.string().min(6, t('Mínimo 6 caracteres')),
})

export default function RegisterPage() {
  const t = useT()
  const { register: registerAccount, token, isLoading } = useAuth()
  const schema = useMemo(() => makeSchema(t), [t])
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
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

  const { countries } = useCountries()
  const supported = useMemo(() => countries.map((c) => c.code), [countries])
  const initialCountry = useMemo(() => suggestedCountry(browserRegions(), supported), [supported])

  const { register, handleSubmit, watch, setValue, setError: setFieldError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { businessName: '', countryCode: initialCountry, email: '', password: '' },
  })

  // La lista llega del API después del primer render: mientras el usuario no haya tocado nada, se re-propone
  // el país, primero el del navegador y luego el de la IP, que acierta más.
  const touchedCountryRef = useRef(false)
  useEffect(() => {
    if (!touchedCountryRef.current) setValue('countryCode', initialCountry)
  }, [initialCountry, setValue])
  const [detected, setDetected] = useState(null)
  useEffect(() => {
    let alive = true
    countriesApi.detect().then((r) => { if (alive) setDetected(r.data?.data?.country ?? null) }).catch(() => {})
    return () => { alive = false }
  }, [])
  useEffect(() => {
    if (detected && supported.includes(detected) && !touchedCountryRef.current) setValue('countryCode', detected)
  }, [detected, supported, setValue])

  // Al cambiar el país cambia la moneda y, en español, los textos de España si es España.
  const watchedCountry = watch('countryCode')
  const countryCfg = countries.find((c) => c.code === watchedCountry)
  useEffect(() => {
    setRegion(watchedCountry === 'ES' ? 'ES' : watchedCountry ? watchedCountry : null)
  }, [watchedCountry])
  // Al salir sin registrarse, los textos vuelven a los del navegador.
  useEffect(() => () => { if (!localStorage.getItem('eazystock_token')) setRegion(null) }, [])

  // Analítica: ¿empezó a rellenarlo? Así se ve si se van antes o después de escribir.
  const startedRef = useRef(false)
  const onStarted = () => {
    if (startedRef.current) return
    startedRef.current = true
    track('register_started')
  }

  if (!isLoading && token) return <Navigate to="/dashboard" replace />

  const onSubmit = async (values) => {
    track('register_submit') // analítica: llegó a enviar el formulario (la cuenta creada la apunta el API)
    setError('')
    setSubmitting(true)
    try {
      await registerAccount({ ...values, email: values.email.toLowerCase(), currency: countryCfg?.currency })
    } catch (err) {
      const field = getErrorField(err)
      const code = getErrorCode(err)
      track('click', { label: `register_error_${String(code ?? field ?? 'other').toLowerCase()}`.slice(0, 60) })
      if (code === 'DUPLICATE_EMAIL' || field === 'email') {
        setFieldError('email', { type: 'server', message: 'DUPLICATE_EMAIL' })
      } else if (field && ['password', 'businessName', 'countryCode'].includes(field)) {
        setFieldError(field, { type: 'server', message: getErrorMessage(err) })
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const perks = promo ? PERKS_PROMO : PERKS_AFTER
  const latam = countries.filter((c) => !OTHER_REGION.has(c.code))
  const others = countries.filter((c) => OTHER_REGION.has(c.code))
  const countryOption = (c) => <option key={c.code} value={c.code}>{FLAG[c.code] ?? '🌎'} {t(c.name)}</option>

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
                <span className="text-sm text-slate-300">{t(text, vars)}</span>
              </li>
            ))}
          </ul>
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
          <div className="mb-6 mt-8 flex flex-col items-center gap-3 lg:hidden">
            <Link to="/" className="transition-opacity hover:opacity-80">
              <img src="/logo.png" alt="Eazy Stock" className="h-14 w-14 rounded-2xl object-contain" />
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
            <form onSubmit={handleSubmit(onSubmit)} onInput={onStarted} noValidate className="space-y-4" data-testid="register-form">
              <div>
                <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Nombre de tu negocio')}</label>
                <input id="businessName" {...register('businessName')} type="text" autoComplete="organization" placeholder={t('Bodega Doña María')} className={inputCls} />
                {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName.message}</p>}
              </div>

              <div>
                <label htmlFor="countryCode" className="mb-1.5 block text-sm font-medium text-gray-700">{t('País de tu negocio')}</label>
                <select id="countryCode" {...register('countryCode', { onChange: () => { touchedCountryRef.current = true } })} className={inputCls} data-testid="register-country">
                  <optgroup label={t('Latinoamérica')}>{latam.map(countryOption)}</optgroup>
                  {others.length > 0 && <optgroup label={t('Otros países')}>{others.map(countryOption)}</optgroup>}
                </select>
                {countryCfg && <p className="mt-1 text-xs text-gray-400" data-testid="register-currency">{t('Moneda')}: {countryCfg.currency} · {countryCfg.currencySymbol}</p>}
                {errors.countryCode && <p className="mt-1 text-xs text-red-500">{errors.countryCode.message}</p>}
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

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{error}</div>
              )}

              <button type="submit" disabled={submitting} data-testid="register-submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {submitting ? t('Creando tu cuenta...') : t('Crear mi cuenta gratis')}
              </button>
              <p className="text-center text-xs text-gray-500">{t('Empieza a vender hoy. El resto de datos te los pedimos más adelante, solo si decides seguir.')}</p>
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
