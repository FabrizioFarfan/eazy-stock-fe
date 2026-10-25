import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Sparkles, ShieldCheck, Clock, Award, MapPin, Store, Users, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT, dateLocale } from '../i18n'
import { browserRegions, setRegion } from '../i18n/region'
import LangSwitcher from '../i18n/LangSwitcher'
import { useNoAppDarkMode } from './landing/useNoAppDarkMode'
import { usePageSeo } from './landing/site'
import { CURRENCIES, CURRENCY_OPTIONS } from '../utils/formatMoney'
import { suggestedCountry } from '../utils/countries'
import { COUNTRIES as PHONE_COUNTRIES } from '../utils/phone'
import { useCountries } from '../hooks/useCountries'
import { getErrorCode, getErrorField, getErrorMessage } from '../utils/handleApiError'
import { promoActive, promoVars, trialLine, afterPromoLine, PLANS, REGISTER_DEFAULT_PLAN, periodPrice, fmtMoney, currencyForCountry } from './landing/plans'
import { SoonMini } from './landing/Pricing'
import { usePlans } from '../hooks/useSubscription'
import { normalize as normalizeTaxId } from '../utils/taxIds'
import { TAX_ID_LABEL, checkTaxId, taxIdHelp, taxIdAlreadyRegisteredMessage } from '../utils/taxIdText'

/**
 * /registro — registro propio con prueba gratis (M1 «Planes en serio», 15-oct-2026).
 * Promo de lanzamiento (Frank + Fabrizio, 19-oct-2026, task 1001): gratis hasta el
 * 15 de diciembre sin tarjeta; los primeros 50 negocios son fundadores (mitad de
 * precio 6 meses). RUC obligatorio, válido y único (task 1002); desde el API 1.15.0 validado
 * con el algoritmo de cada país (utils/taxIds.js) y normalizado al enviar. Regla post-promo
 * (task 1018): después del 15-dic, 1 mes gratis y el segundo mes a mitad de precio.
 * El BE manda en POST /auth/register. Mismo chrome oscuro que el login: panel izquierdo + formulario.
 * Multi-país (24-oct-2026): primer paso «¿Dónde está tu negocio?» (países de
 * GET /api/countries, preseleccionado por el navegador); luego el formulario con
 * la moneda del país y su documento fiscal.
 * Web 1.23.0 / API 1.16.0 (PLANS-SPEC.md): entre el país y los datos, «Elige tu plan» (Basic, Pro
 * preseleccionado, AI con «Pronto»): la prueba gratis es del plan elegido y se manda `plan`.
 */

const FLAG = Object.fromEntries(PHONE_COUNTRIES.map((c) => [c.iso, c.flag]))

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
  taxId:        z.string().trim().min(1, t('Requerido')),
  currency:     z.string().length(3, t('Requerido')),
  phone:        z.string().trim().optional(),
  accept:       z.boolean().refine((v) => v === true, { message: t('Necesitamos que aceptes la política de privacidad') }),
}).superRefine((v, ctx) => {
  // API 1.15.0: el algoritmo del país (utils/taxIds.js = TaxIds.java) y su mensaje.
  const message = checkTaxId(v.countryCode, v.taxId, { requiredMessage: t('Requerido') })
  if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taxId'], message })
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

  const { countries } = useCountries()
  // Paso 1 = «¿Dónde está tu negocio?»; paso 2 = «Elige tu plan»; paso 3 = el formulario.
  const [step, setStep] = useState(1)
  const [plan, setPlan] = useState(REGISTER_DEFAULT_PLAN)
  const [planError, setPlanError] = useState('')
  const initialCountry = useMemo(() => suggestedCountry(browserRegions(), countries.map((c) => c.code)), [countries])

  const { register, handleSubmit, watch, setValue, setError: setFieldError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', businessName: '', countryCode: initialCountry, taxId: '', currency: 'PEN', phone: '', accept: false },
  })

  // La lista llega del API después del primer render: mientras el usuario no
  // haya tocado nada, se re-propone el país del navegador.
  const touchedCountryRef = useRef(false)
  useEffect(() => {
    if (!touchedCountryRef.current) setValue('countryCode', initialCountry)
  }, [initialCountry, setValue])

  // Al cambiar el país se propone su moneda (se puede corregir) y, en español,
  // los textos de España si es España.
  const watchedCountry = watch('countryCode')
  const countryCfg = countries.find((c) => c.code === watchedCountry)
  useEffect(() => {
    if (countryCfg?.currency) setValue('currency', countryCfg.currency)
    setRegion(watchedCountry === 'ES' ? 'ES' : watchedCountry ? watchedCountry : null)
  }, [watchedCountry, countryCfg?.currency, setValue])
  // Al salir sin registrarse, los textos vuelven a los del navegador.
  useEffect(() => () => { if (!localStorage.getItem('eazystock_token')) setRegion(null) }, [])
  const currencyOptions = countryCfg?.currency && !CURRENCY_OPTIONS.includes(countryCfg.currency)
    ? [countryCfg.currency, ...CURRENCY_OPTIONS] : CURRENCY_OPTIONS
  const symbolOf = (code) => (code === countryCfg?.currency && countryCfg?.currencySymbol) || CURRENCIES[code]?.symbol || code

  if (!isLoading && token) return <Navigate to="/dashboard" replace />

  const onSubmit = async ({ accept, phone, ...values }) => {
    void accept
    setError('')
    setSubmitting(true)
    try {
      await registerAccount({
        ...values, email: values.email.toLowerCase(), taxId: normalizeTaxId(values.taxId), phone: phone?.trim() || undefined, plan,
      })
    } catch (err) {
      const field = getErrorField(err)
      if (getErrorCode(err) === 'PLAN_NOT_AVAILABLE' || field === 'plan') {
        setPlan(REGISTER_DEFAULT_PLAN)
        setPlanError(t('El plan AI llega pronto: todavía no se puede elegir.'))
        setStep(2)
      } else if (getErrorCode(err) === 'DUPLICATE_EMAIL' || field === 'email') {
        setFieldError('email', { type: 'server', message: 'DUPLICATE_EMAIL' })
      } else if (getErrorCode(err) === 'TAX_ID_ALREADY_REGISTERED') {
        // «Este RUC ya tiene una cuenta en Eazy Stock. Si es tuyo, inicia sesión o escríbenos.», en el idioma de la web.
        setFieldError('taxId', { type: 'server', message: taxIdAlreadyRegisteredMessage(values.countryCode) })
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
  // Etiqueta del documento: la del API (CountryConfig.taxIdLabel) salvo el genérico TAX_ID; si no, la local.
  const apiTaxLabel = countryCfg?.taxIdLabel && countryCfg.taxIdLabel !== 'TAX_ID' ? countryCfg.taxIdLabel : null
  const taxLabel = apiTaxLabel ?? TAX_ID_LABEL[watchedCountry] ?? t('Identificación fiscal')

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

          {step === 1 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8" data-testid="register-country-step">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900"><MapPin size={18} className="text-blue-600" /> {t('¿Dónde está tu negocio?')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('Así te proponemos la moneda, el documento fiscal y los medios de pago de tu país.')}</p>
              <div className="mt-5 grid max-h-[22rem] grid-cols-2 gap-2 overflow-y-auto pr-1" role="radiogroup" aria-label={t('País')}>
                {countries.map((c) => {
                  const on = watchedCountry === c.code
                  return (
                    <button key={c.code} type="button" role="radio" aria-checked={on} data-country={c.code}
                      onClick={() => { touchedCountryRef.current = true; setValue('countryCode', c.code) }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-all active:scale-[0.98] ${
                        on ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}>
                      <span className="text-lg leading-none">{FLAG[c.code] ?? '🌎'}</span>
                      <span className="min-w-0 truncate">{t(c.name)}</span>
                    </button>
                  )
                })}
              </div>
              {countryCfg && (
                <p className="mt-4 rounded-xl bg-gray-50 px-3.5 py-2.5 text-xs text-gray-500">
                  {t('Moneda')}: <strong className="text-gray-800">{countryCfg.currency} · {countryCfg.currencySymbol}</strong>
                  {Array.isArray(countryCfg.defaultPaymentMethods) && countryCfg.defaultPaymentMethods.length > 0 && (
                    <> · {t('Medios de pago')}: <strong className="text-gray-800">{countryCfg.defaultPaymentMethods.map((m) => t(m)).join(', ')}</strong></>
                  )}
                </p>
              )}
              <button type="button" onClick={() => setStep(2)} disabled={!watchedCountry} data-testid="register-country-next"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60">
                {t('Continuar')} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <PlanStep plan={plan} currency={currencyForCountry(watchedCountry)} error={planError}
              onPick={(k) => { setPlan(k); setPlanError('') }} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          )}

          <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8 ${step !== 3 ? 'hidden' : ''}`}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2 font-semibold text-gray-800">
                  <span className="text-lg leading-none">{FLAG[watchedCountry] ?? '🌎'}</span>
                  <span className="truncate">{countryCfg ? t(countryCfg.name) : watchedCountry}</span>
                </span>
                <button type="button" onClick={() => setStep(1)} className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:underline">{t('Cambiar')}</button>
              </div>
              <div className="-mt-2 flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm" data-testid="register-plan-summary">
                <span className="flex min-w-0 items-center gap-2 font-semibold text-gray-800">
                  <Crown size={15} className="flex-shrink-0 text-amber-500" />
                  <span className="truncate">{t('Plan {plan}', { plan: PLANS.find((p) => p.key === plan.toLowerCase())?.name ?? plan })} · <span className="font-normal text-gray-500">{trialLine(t, dateLocale())}</span></span>
                </span>
                <button type="button" onClick={() => setStep(2)} className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:underline">{t('Cambiar')}</button>
              </div>
              {errors.countryCode && <p className="-mt-2 text-xs text-red-500">{errors.countryCode.message}</p>}
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
                <p className="mt-1 text-xs text-gray-400" data-testid="register-tax-id-help">{taxIdHelp(watchedCountry)}</p>
                {errors.taxId && <p className="mt-1 text-xs text-red-500" data-testid="register-tax-id-error">{errors.taxId.message}</p>}
              </div>

              <div>
                <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Moneda')}</label>
                <select id="currency" {...register('currency')} className={inputCls}>
                  {currencyOptions.map((code) => <option key={code} value={code}>{code} · {symbolOf(code)}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('WhatsApp')} <span className="font-normal text-gray-400">({t('opcional')})</span>
                </label>
                <input id="phone" {...register('phone')} type="tel" autoComplete="tel" placeholder={`+${countryCfg?.dialCode ?? '51'} ${PHONE_COUNTRIES.find((c) => c.iso === watchedCountry)?.example ?? '999 999 999'}`} className={inputCls} />
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

/**
 * Paso «Elige tu plan» del registro (PLANS-SPEC.md): Basic, Pro (preseleccionado) y AI con «Pronto»
 * sin poder elegirlo; lo que incluye cada uno (landing/plans.js) y el precio al mes en la moneda del
 * país (PEN en Perú, USD el resto, como Pricing). La prueba gratis es del plan elegido, sin tarjeta.
 */
function PlanStep({ plan, currency, error, onPick, onBack, onNext }) {
  const t = useT()
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8" data-testid="register-plan-step">
      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900"><Crown size={18} className="text-blue-600" /> {t('Elige tu plan')}</h3>
      <p className="mt-1 text-sm text-gray-500">
        <strong className="font-semibold text-gray-700">{trialLine(t, dateLocale())}</strong>. {t('Pruebas el plan que elijas y lo puedes cambiar cuando quieras.')}
      </p>
      <div className="mt-5 space-y-3" role="radiogroup" aria-label={t('Plan')}>
        {PLANS.map((p) => {
          const key = p.key.toUpperCase()
          const soon = !!p.comingSoon
          const on = !soon && plan === key
          const Icon = p.key === 'ai' ? Sparkles : p.key === 'pro' ? Store : Users
          return (
            <button key={p.key} type="button" role="radio" aria-checked={on} aria-disabled={soon || undefined} disabled={soon}
              onClick={() => onPick(key)} data-plan={key}
              className={`relative block w-full rounded-2xl border p-4 text-left transition-all ${
                soon ? 'cursor-not-allowed border-dashed border-gray-200 bg-gray-50/60'
                  : on ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20' : 'border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.99]'}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${p.tone} ${soon ? 'opacity-60' : ''}`}><Icon size={18} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-base font-extrabold ${soon ? 'text-gray-500' : 'text-gray-900'}`}>{p.name}</span>
                    {p.highlight && !soon && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">{t(p.badge)}</span>}
                    {soon && <SoonMini />}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{p.limits.map(([n, label]) => `${n} ${t(label)}`).join(' · ')}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className={`font-mono text-lg font-extrabold leading-none ${soon ? 'text-gray-400' : 'text-gray-900'}`}>{fmtMoney(periodPrice(p, 'monthly', currency), currency)}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">/ {t('mes')}</p>
                </div>
                <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                {p.features.map((raw) => {
                  const f = typeof raw === 'string' ? { text: raw } : raw
                  return (
                    <li key={f.text} className={`flex items-start gap-2 text-xs leading-snug ${f.soon || soon ? 'text-gray-400' : 'text-gray-600'}`}>
                      {f.soon ? <Clock size={12} className="mt-0.5 flex-shrink-0 text-amber-500" /> : <Check size={12} strokeWidth={3} className="mt-0.5 flex-shrink-0 text-emerald-500" />}
                      <span>{t(f.text)} {f.soon && !soon && <SoonMini />}</span>
                    </li>
                  )
                })}
              </ul>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{error}</p>}
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onBack}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <ArrowLeft size={15} /> {t('Atrás')}
        </button>
        <button type="button" onClick={onNext} data-testid="register-plan-next"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98]">
          {t('Continuar con {plan}', { plan: PLANS.find((p) => p.key === plan.toLowerCase())?.name ?? plan })} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
