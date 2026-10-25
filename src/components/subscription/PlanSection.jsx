import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CreditCard, Clock, CalendarCheck, Lock, MessageCircle, Mail, Sparkles, Loader2, Tag, Store, CheckCircle2, ExternalLink, Receipt, Award } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { billingApi } from '../../services/endpoints/billing'
import { getErrorMessage, getErrorCode } from '../../utils/handleApiError'
import { subscriptionApi } from '../../services/endpoints/subscription'
import { isDowngrade } from '../../utils/planKeep'
import KeepSelectionModal from './KeepSelectionModal'
import { useAuth } from '../../context/AuthContext'
import { useSubscription, SUBSCRIPTION_KEY } from '../../hooks/useSubscription'
import { useMyBusiness, useMyBusinesses, MY_BUSINESSES_KEY, BUSINESSES_OVERVIEW_KEY, MY_BUSINESS_KEY } from '../../hooks/useMyBusinesses'
import { useT } from '../../i18n'
import { PlanCards, NewFeaturesNote } from '../../pages/landing/Pricing'
import { PLANS, PERIODS, DEFAULT_PERIOD, periodOf, periodPrice, fmtMoney, currencyForCountry, FOUNDERS_LIMIT, BILLING_DAY, LAUNCH_DISCOUNT_MONTHS } from '../../pages/landing/plans'
import { Chip } from '../boss/BossKit'
import { readSetupPending, clearSetupPending } from '../../utils/setupPendingNotice'
import { taxIdTrialUsedMessage } from '../../utils/taxIdText'
import { planKey, whatsappActivateLink, formatDay, STATUS_TONE, STATUS_LABEL, SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from './subscriptionUtils'

/**
 * Ajustes › Tu plan (M1 «Planes en serio», 15-oct-2026), solo OWNER: estado de la
 * suscripción, precio efectivo (con el descuento de lanzamiento), las tres tarjetas
 * de /planes con el actual marcado y cómo activar o pagar (manual por WhatsApp o
 * correo hasta que llegue la pasarela). Se llega con /settings#plan desde el banner.
 * Desde el 20-oct-2026 (task 1015): selector Mensual · Trimestral −10 % · Anual −20 %
 * y moneda del negocio (soles en Perú, dólares en el resto); el plan AI llega pronto.
 */
export default function PlanSection() {
  const t = useT()
  const { user } = useAuth()
  const { data: sub, isLoading, isError } = useSubscription()
  const { data: biz } = useMyBusiness()
  // Moneda del negocio activo; el BE manda en `sub.currency` (precio especial = soles).
  const currency = sub?.currency ?? currencyForCountry(biz?.countryCode)
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const per = periodOf(period)
  const ref = useRef(null)
  const { hash, search } = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  // Vuelta de Stripe Checkout: /settings?checkout=success#plan | ?checkout=cancel.
  // Se lee una vez al montar; el efecto solo refresca la suscripción y limpia la URL.
  const [checkoutMsg] = useState(() => new URLSearchParams(search).get('checkout'))
  const [paying, setPaying] = useState(null)
  useEffect(() => {
    if (!checkoutMsg) return
    if (checkoutMsg === 'success') qc.invalidateQueries({ queryKey: [SUBSCRIPTION_KEY] })
    navigate({ pathname: '/settings', search: '', hash: '#plan' }, { replace: true })
  }, [checkoutMsg, qc, navigate])

  useEffect(() => {
    if (hash === '#plan' && ref.current) {
      const timer = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
      return () => clearTimeout(timer)
    }
  }, [hash, sub])

  // Registro con un documento que ya usó su prueba (API 1.15.0, setupPending): aviso
  // arriba hasta que el plan deje de estar en solo lectura.
  const setupPending = readSetupPending(user?.businessId)
  useEffect(() => {
    if (sub && !sub.readOnly && readSetupPending(user?.businessId)) clearSetupPending()
  }, [sub, user?.businessId])

  const current = planKey(sub?.plan)
  const currentPlan = PLANS.find((p) => p.key === current)
  // API 1.16.0: el plan de la cuenta (elegido al registrarse) viene preseleccionado; /planes puede
  // traer otro con ?plan=. Se puede cambiar; AI («llega pronto») no se elige.
  const [picked, setPicked] = useState(() => new URLSearchParams(search).get('plan'))
  const sellable = (k) => PLANS.some((p) => p.key === k && !p.comingSoon)
  const selected = sellable(picked) ? picked : sellable(current) ? current : 'pro'
  const selectedPlan = PLANS.find((p) => p.key === selected)
  const waLink = whatsappActivateLink({ businessName: user?.businessName, plan: selectedPlan?.name ?? currentPlan?.name ?? sub?.plan, t })
  const { data: myBusinesses } = useMyBusinesses()
  const lockedCount = (Array.isArray(myBusinesses) ? myBusinesses : []).filter((b) => b.planLocked).length
  // Modal «Elige qué queda activo»: { mode: 'checkout', plan, interval } antes de pagar un plan
  // más pequeño, o { mode: 'activeSet' } para corregirlo con el plan actual.
  const [keepFor, setKeepFor] = useState(null)
  const [keepError, setKeepError] = useState('')
  const hasDiscount = sub?.discountPercent > 0 && sub?.priceMonthly != null && sub?.listPriceMonthly != null && sub.priceMonthly < sub.listPriceMonthly
  const customPrice = sub?.customPriceMonthly != null
  const stripe = !!sub?.stripeEnabled

  const openKeepModal = async (target, mode, extra = {}) => {
    const r = await subscriptionApi.downgradePreview(target)
    const preview = r.data?.data ?? r.data
    setKeepError('')
    setKeepFor({ mode, plan: target, preview, ...extra })
    return preview
  }

  const checkout = async (plan, interval, keep) => {
    const r = await billingApi.checkout(keep ? { plan, interval, keep } : { plan, interval })
    const url = r.data?.data?.url ?? r.data?.url
    if (!url) throw new Error('no url')
    window.location.assign(url)
  }

  // Bajar de plan (API 1.16.0): antes de abrir Checkout, si el plan nuevo no da para todo,
  // el dueño elige qué queda activo (el resto a solo lectura, nada se borra).
  const payWithCard = async (plan, interval) => {
    setPaying(`${plan}-${interval}`)
    try {
      if (isDowngrade(sub?.plan, plan)) {
        const r = await subscriptionApi.downgradePreview(plan)
        const preview = r.data?.data ?? r.data
        if (preview?.needsSelection) {
          setKeepError('')
          setKeepFor({ mode: 'checkout', plan, interval, preview })
          setPaying(null)
          return
        }
      }
      await checkout(plan, interval)
    } catch (err) {
      if (getErrorCode(err) === 'KEEP_SELECTION_REQUIRED') {
        try { await openKeepModal(plan, 'checkout', { interval }) } catch (e2) { toast.error(getErrorMessage(e2)) }
      } else {
        toast.error(getErrorMessage(err))
      }
      setPaying(null)
    }
  }

  const confirmKeep = async (keep) => {
    setPaying('keep')
    setKeepError('')
    try {
      if (keepFor.mode === 'checkout') {
        await checkout(keepFor.plan, keepFor.interval, keep)
        return // se va a Stripe
      }
      await subscriptionApi.setActiveSet(keep)
      for (const key of [MY_BUSINESSES_KEY, BUSINESSES_OVERVIEW_KEY, MY_BUSINESS_KEY, SUBSCRIPTION_KEY, 'employees']) {
        qc.invalidateQueries({ queryKey: [key] })
      }
      toast.success(t('Listo: ya está activo lo que elegiste.'))
      setKeepFor(null)
      setPaying(null)
    } catch (err) {
      setKeepError(getErrorMessage(err))
      setPaying(null)
    }
  }

  const chooseActiveSet = async () => {
    setPaying('activeSet')
    try { await openKeepModal(sub.plan, 'activeSet') } catch (err) { toast.error(getErrorMessage(err)) }
    setPaying(null)
  }
  const openPortal = async () => {
    setPaying('portal')
    try {
      const r = await billingApi.portal()
      const url = r.data?.data?.url ?? r.data?.url
      if (!url) throw new Error('no url')
      window.location.assign(url)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setPaying(null)
    }
  }

  return (
    <div ref={ref} id="plan" className="scroll-mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CreditCard size={17} /></span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">{t('Tu plan')}</h3>
            <p className="truncate text-xs text-gray-400">{t('Prueba, plan, precio y cómo activarlo')}</p>
          </div>
        </div>
        {sub && <Chip tone={STATUS_TONE[sub.status] ?? 'gray'}>{t(STATUS_LABEL[sub.status] ?? sub.status)}</Chip>}
      </div>

      <div className="px-5 py-5">
        {isLoading && (
          <div className="flex items-center gap-2 py-4 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> {t('Cargando...')}</div>
        )}
        {isError && !isLoading && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{t('No se pudo cargar tu plan. Intenta de nuevo en un momento.')}</p>
        )}

        {setupPending && sub?.readOnly && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="setup-pending-notice">
            <Lock size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">{taxIdTrialUsedMessage(setupPending.countryCode ?? biz?.countryCode)}</p>
              <p className="mt-0.5 text-xs">{t('Tu cuenta ya está creada y tus datos se guardan. Mientras no elijas un plan, la tienda está en solo lectura.')}</p>
            </div>
          </div>
        )}
        {lockedCount > 0 && sub && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center" data-testid="plan-locked-notice">
            <Lock size={18} className="flex-shrink-0 text-amber-600" />
            <p className="min-w-0 flex-1">
              <span className="font-bold">{t('{n} negocio(s) en solo lectura por el límite de tu plan.', { n: lockedCount })}</span>{' '}
              <span className="text-xs">{t('Nada se borró. Sube de plan o elige qué negocios y trabajadores quedan activos.')}</span>
            </p>
            <button type="button" onClick={chooseActiveSet} disabled={!!paying}
              className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-amber-800 shadow-sm ring-1 ring-amber-200 hover:bg-amber-100 disabled:opacity-60">
              {paying === 'activeSet' && <Loader2 size={13} className="animate-spin" />} {t('Elegir qué queda activo')}
            </button>
          </div>
        )}
        {checkoutMsg === 'success' && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">{t('Pago recibido: tu plan está activo')}</p>
              <p className="mt-0.5 text-xs">{t('Gracias. Si el estado tarda unos segundos en cambiar, es Stripe avisándonos; se actualiza solo.')}</p>
            </div>
          </div>
        )}
        {checkoutMsg === 'cancel' && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {t('No se hizo ningún cobro. Puedes volver a intentarlo cuando quieras.')}
          </div>
        )}

        {sub && (
          <>
            {/* Estado + precio */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={Sparkles} label={t('Plan')} value={currentPlan?.name ?? sub.plan}
                sub={sub.maxEmployees != null ? t('Hasta {n} trabajadores', { n: sub.maxEmployees }) : t('Trabajadores ilimitados')} />
              {sub.status === 'TRIAL' && (
                <Stat icon={Clock} label={t('Gratis hasta')} value={formatDay(sub.trialEndsAt)}
                  sub={sub.daysLeft == null ? null : sub.daysLeft === 1 ? t('Queda 1 día') : t('Quedan {n} días', { n: Math.max(0, sub.daysLeft) })} tone={sub.daysLeft <= 3 ? 'amber' : 'blue'} />
              )}
              {sub.status === 'ACTIVE' && (
                <Stat icon={CalendarCheck} label={sub.paidUntil ? t('Pagado hasta') : t('Estado')}
                  value={sub.paidUntil ? formatDay(sub.paidUntil) : t('Activo')}
                  sub={sub.paidUntil ? (sub.daysLeft != null ? t('Quedan {n} días', { n: Math.max(0, sub.daysLeft) }) : null) : t('Cuenta de lanzamiento')} tone="emerald" />
              )}
              {sub.status === 'PAST_DUE' && (
                <Stat icon={CalendarCheck} label={t('Pago vencido el')} value={formatDay(sub.paidUntil)}
                  sub={sub.daysLeft != null ? t('{n} días de gracia', { n: Math.max(0, sub.daysLeft) }) : null} tone="amber" />
              )}
              {(sub.status === 'EXPIRED' || sub.status === 'CANCELED') && (
                <Stat icon={Lock} label={t('Estado')} value={t(STATUS_LABEL[sub.status])} sub={t('Solo lectura: tus datos siguen intactos')} tone="red" />
              )}
              <Stat icon={Tag} label={t('Precio al mes')}
                value={(
                  <span className="flex items-baseline gap-2">
                    <span>{fmtMoney(sub.priceMonthly, currency)}</span>
                    {hasDiscount && <span className="text-sm font-semibold text-gray-400 line-through">{fmtMoney(sub.listPriceMonthly, currency)}</span>}
                  </span>
                )}
                sub={hasDiscount
                  ? (sub.discountUntil ? t('{pct} % de descuento hasta el {date}', { pct: sub.discountPercent, date: formatDay(sub.discountUntil) }) : t('{pct} % de descuento', { pct: sub.discountPercent }))
                  : customPrice ? t('Precio especial acordado') : sub.launchPriceLocked ? t('Precio de lanzamiento, para siempre') : null}
                tone={hasDiscount ? 'emerald' : undefined} />
              {/* Promo de lanzamiento (19-oct-2026): SÍ / NO entre los primeros 50, nunca la posición */}
              <Stat icon={Award} label={t('Primeros {n}', { n: FOUNDERS_LIMIT })}
                value={sub.founder ? t('Sí') : t('No')}
                sub={sub.founder
                  ? t('Fundador: {pct} % menos los primeros {months} meses y precio bloqueado', { pct: sub.discountPercent ?? 50, months: LAUNCH_DISCOUNT_MONTHS })
                  : t('Los primeros {n} negocios ya entraron', { n: FOUNDERS_LIMIT })}
                tone={sub.founder ? 'emerald' : undefined} />
            </div>

            {/* Varios negocios por dueño (15-oct-2026): cuántos tiene y cuántos admite el plan */}
            <Link to="/negocios" className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-sm transition-colors hover:bg-gray-100">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-gray-100"><Store size={13} /></span>
              <span className="min-w-0 flex-1 text-gray-700">
                <span className="font-semibold text-gray-900">{t('Negocios')}:</span>{' '}
                {sub.maxBusinesses == null
                  ? t('{n} (ilimitados con {plan})', { n: sub.businessesCount ?? 1, plan: currentPlan?.name ?? sub.plan })
                  : t('{n} de {max} ({plan})', { n: sub.businessesCount ?? 1, max: sub.maxBusinesses, plan: currentPlan?.name ?? sub.plan })}
              </span>
              <span className="text-xs font-semibold text-blue-600">{t('Mis negocios')} →</span>
            </Link>

            {/* Tarjetas de planes (las de /planes, compactas) */}
            <div className="mt-8">
              <p className="mb-5 text-xs font-bold uppercase tracking-widest text-gray-400">{t('Los planes')}</p>
              <NewFeaturesNote className="mb-6" />
              <PlanCards compact current={current} selected={selected} onSelect={setPicked} ctaTo={waLink} currency={currency} period={period} onPeriodChange={setPeriod} />
            </div>

            {/* Pago con tarjeta (Stripe, M2) si el BE lo tiene configurado */}
            {stripe && (
              <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-700" />
                  <p className="text-sm font-bold text-gray-900">{sub.stripeSubscriptionId ? t('Tu pago con tarjeta') : t('Pagar con tarjeta')}</p>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {sub.stripeSubscriptionId
                    ? t('Se cobra solo cada período. Desde el portal cambias la tarjeta, descargas facturas o cancelas.')
                    : sub.status === 'TRIAL'
                      ? t('Pago seguro con Stripe. Guardas la tarjeta hoy y el primer cobro es el {day} después de que termine tu período gratis; luego, cada período. Trimestral −{q} %, anual −{y} %.', { day: BILLING_DAY, q: PERIODS[1].discount, y: PERIODS[2].discount })
                      : t('Pago seguro con Stripe. Se cobra el {day} (hoy, la parte proporcional) y luego cada período. Trimestral −{q} %, anual −{y} %. Se activa al instante.', { day: BILLING_DAY, q: PERIODS[1].discount, y: PERIODS[2].discount })}
                </p>
                {sub.stripeSubscriptionId ? (
                  <button type="button" onClick={openPortal} disabled={!!paying}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:bg-emerald-700 disabled:opacity-60">
                    {paying === 'portal' ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />} {t('Gestionar pago y facturas')} <ExternalLink size={13} />
                  </button>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-white p-4 sm:flex-row sm:items-center" data-testid="pay-selected-plan">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{t('Plan elegido')}</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedPlan.name} · {t(per.label)}{' '}
                        <span className="text-xs font-semibold text-gray-400">· {fmtMoney(periodPrice(selectedPlan, 'monthly', currency), currency)}/{t('mes')}</span>
                      </p>
                      {selected !== current && current && (
                        <p className="mt-0.5 text-xs text-gray-500">{t('Hoy tienes {plan}. Puedes cambiar el plan elegido en las tarjetas de arriba.', { plan: currentPlan?.name ?? sub.plan })}</p>
                      )}
                      {per.discount > 0 && <p className="mt-0.5 text-[11px] text-gray-500">{t('{pct} % menos que mes a mes', { pct: per.discount })}</p>}
                    </div>
                    <button type="button" onClick={() => payWithCard(selected.toUpperCase(), per.interval)} disabled={!!paying}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:bg-emerald-700 disabled:opacity-60">
                      {paying === `${selected.toUpperCase()}-${per.interval}` ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                      {' '}{t('Pagar {total} · {period}', { total: fmtMoney(periodPrice(selectedPlan, per.key, currency), currency), period: t(per.label).toLowerCase() })}
                    </button>
                  </div>
                )}
              </div>
            )}

            {keepFor && (
              <KeepSelectionModal
                preview={keepFor.preview}
                planName={PLANS.find((p) => p.key === planKey(keepFor.plan))?.name ?? keepFor.plan}
                confirmLabel={keepFor.mode === 'checkout' ? t('Continuar al pago') : t('Guardar')}
                busy={paying === 'keep'} serverError={keepError}
                onConfirm={confirmKeep} onClose={() => { if (paying !== 'keep') setKeepFor(null) }} />
            )}

            {/* Cómo activar o pagar (manual; único camino si Stripe no está configurado) */}
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <p className="text-sm font-bold text-gray-900">
                {sub.readOnly ? t('Cómo activar tu plan') : sub.status === 'TRIAL' ? t('Cómo activar tu plan cuando termine la prueba') : t('Cómo pagar tu plan')}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {stripe ? t('¿Prefieres transferencia o billetera digital? Escríbenos y lo activamos el mismo día.') : t('Escríbenos y lo activamos el mismo día. Pagas por transferencia o billetera digital; el pago con tarjeta en línea llega pronto.')}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a href={waLink} target="_blank" rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:bg-emerald-700">
                  <MessageCircle size={16} /> {t('WhatsApp')} · {SUPPORT_PHONE_DISPLAY}
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('Activar plan de Eazy Stock'))}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50">
                  <Mail size={16} /> {SUPPORT_EMAIL}
                </a>
              </div>
              {sub.note && <p className="mt-3 text-xs text-gray-500">{t('Nota de Eazy Life')}: {sub.note}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const STAT_TONES = {
  blue:    'bg-blue-50 text-blue-700',
  amber:   'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  red:     'bg-red-50 text-red-600',
}

function Stat({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${tone ? STAT_TONES[tone] : 'bg-white text-gray-400 ring-1 ring-gray-100'}`}><Icon size={13} /></span>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      </div>
      <div className="mt-2 text-xl font-extrabold tracking-tight text-gray-900">{value}</div>
      {sub && <p className={`mt-0.5 text-xs ${tone ? STAT_TONES[tone].split(' ')[1] : 'text-gray-500'}`}>{sub}</p>}
    </div>
  )
}
