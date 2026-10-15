import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { CreditCard, Clock, CalendarCheck, Lock, MessageCircle, Mail, Sparkles, Loader2, Tag } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { useT } from '../../i18n'
import { PlanCards } from '../../pages/landing/Pricing'
import { CURRENCY, PLANS } from '../../pages/landing/plans'
import { Chip } from '../boss/BossKit'
import { planKey, whatsappActivateLink, formatDay, STATUS_TONE, STATUS_LABEL, SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from './subscriptionUtils'

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('es-PE', { maximumFractionDigits: 0 }))

/**
 * Ajustes › Tu plan (M1 «Planes en serio», 15-oct-2026), solo OWNER: estado de la
 * suscripción, precio efectivo (con el descuento de lanzamiento), las tres tarjetas
 * de /planes con el actual marcado y cómo activar o pagar (manual por WhatsApp o
 * correo hasta que llegue la pasarela). Se llega con /settings#plan desde el banner.
 */
export default function PlanSection() {
  const t = useT()
  const { user } = useAuth()
  const { data: sub, isLoading, isError } = useSubscription()
  const ref = useRef(null)
  const { hash } = useLocation()

  useEffect(() => {
    if (hash === '#plan' && ref.current) {
      const timer = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
      return () => clearTimeout(timer)
    }
  }, [hash, sub])

  const current = planKey(sub?.plan)
  const currentPlan = PLANS.find((p) => p.key === current)
  const waLink = whatsappActivateLink({ businessName: user?.businessName, plan: currentPlan?.name ?? sub?.plan, t })
  const hasDiscount = sub?.discountPercent > 0 && sub?.priceMonthly != null && sub?.listPriceMonthly != null && sub.priceMonthly < sub.listPriceMonthly
  const customPrice = sub?.customPriceMonthly != null

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

        {sub && (
          <>
            {/* Estado + precio */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat icon={Sparkles} label={t('Plan')} value={currentPlan?.name ?? sub.plan}
                sub={sub.maxEmployees != null ? t('Hasta {n} trabajadores', { n: sub.maxEmployees }) : t('Trabajadores ilimitados')} />
              {sub.status === 'TRIAL' && (
                <Stat icon={Clock} label={t('Prueba gratis hasta')} value={formatDay(sub.trialEndsAt)}
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
                    <span>{CURRENCY} {fmt(sub.priceMonthly)}</span>
                    {hasDiscount && <span className="text-sm font-semibold text-gray-400 line-through">{CURRENCY} {fmt(sub.listPriceMonthly)}</span>}
                  </span>
                )}
                sub={hasDiscount
                  ? (sub.discountUntil ? t('{pct} % de descuento hasta el {date}', { pct: sub.discountPercent, date: formatDay(sub.discountUntil) }) : t('{pct} % de descuento', { pct: sub.discountPercent }))
                  : customPrice ? t('Precio especial acordado') : sub.launchPriceLocked ? t('Precio de lanzamiento, para siempre') : null}
                tone={hasDiscount ? 'emerald' : undefined} />
            </div>

            {/* Tarjetas de planes (las de /planes, compactas) */}
            <div className="mt-8">
              <p className="mb-5 text-xs font-bold uppercase tracking-widest text-gray-400">{t('Los planes')}</p>
              <PlanCards compact current={current} ctaTo={waLink} />
            </div>

            {/* Cómo activar o pagar (manual hasta la pasarela) */}
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <p className="text-sm font-bold text-gray-900">
                {sub.readOnly ? t('Cómo activar tu plan') : sub.status === 'TRIAL' ? t('Cómo activar tu plan cuando termine la prueba') : t('Cómo pagar tu plan')}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {t('Escríbenos y lo activamos el mismo día. Pagas por transferencia o billetera digital; el pago con tarjeta en línea llega pronto.')}
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
