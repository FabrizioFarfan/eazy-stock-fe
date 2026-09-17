import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Minus, Sparkles, Lock, CalendarClock, Store, Users } from 'lucide-react'
import { useT } from '../../i18n'
import { Reveal, SectionHead, GridPattern } from './shared'
import { PLANS, OFFERS, COMPARE, CURRENCY, TRIAL_DAYS, YEARLY_FREE_MONTHS, yearlyPrice } from './plans'

const CTA = '/login'
const OFFER_ICONS = { Sparkles, Lock, CalendarClock }

// ═══════════════════════════════════════════════════════════════════════════
//  Precios y ofertas — sección de la landing (#precios) y piezas de /planes
// ═══════════════════════════════════════════════════════════════════════════

function fmt(n) {
  return n.toLocaleString('es-PE')
}

/** Interruptor mensual / anual. */
function BillingToggle({ yearly, onChange, dark }) {
  const t = useT()
  const base = 'rounded-full px-4 py-2 text-sm font-semibold transition-all'
  const on = dark ? 'bg-white text-[#0a0e1a] shadow' : 'bg-[#0a0e1a] text-white shadow'
  const off = dark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`inline-flex items-center gap-1 rounded-full border p-1 ${dark ? 'border-white/15 bg-white/5' : 'border-gray-200 bg-white'}`} role="group" aria-label={t('Forma de pago')}>
        <button type="button" onClick={() => onChange(false)} className={`${base} ${yearly ? off : on}`} aria-pressed={!yearly}>{t('Mensual')}</button>
        <button type="button" onClick={() => onChange(true)} className={`${base} ${yearly ? on : off}`} aria-pressed={yearly}>
          {t('Anual')}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${yearly ? (dark ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-400 text-[#0a0e1a]') : 'bg-emerald-500/15 text-emerald-500'}`}>
            {t('{n} meses gratis', { n: YEARLY_FREE_MONTHS })}
          </span>
        </button>
      </div>
      <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
        {t('Todos los planes empiezan con {days} días de prueba, sin tarjeta.', { days: TRIAL_DAYS })}
      </p>
    </div>
  )
}

/** Tarjeta de un plan. En fondo oscuro, el plan destacado es la tarjeta blanca. */
function PlanCard({ plan, yearly, dark }) {
  const t = useT()
  const hi = plan.highlight
  const price = yearly ? Math.round(yearlyPrice(plan.monthly) / 12) : plan.monthly
  const shell = hi
    ? 'bg-white text-gray-900 shadow-[0_30px_80px_-20px_rgba(37,99,235,.55)] ring-2 ring-blue-500/60'
    : dark
      ? 'border border-white/10 bg-white/[0.05] text-white backdrop-blur'
      : 'border border-gray-200 bg-white text-gray-900'
  const muted = hi ? 'text-gray-500' : dark ? 'text-slate-400' : 'text-gray-500'
  const line = hi ? 'border-gray-100' : dark ? 'border-white/10' : 'border-gray-100'
  return (
    <div className={`relative flex h-full flex-col rounded-3xl p-7 transition-transform hover:-translate-y-1 sm:p-8 ${shell}`}>
      {plan.badge && (
        <span className={`absolute -top-3 left-7 rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg ${plan.tone}`}>
          {t(plan.badge)}
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight">{plan.name}</h3>
          <p className={`mt-1 text-sm leading-snug ${muted}`}>{t(plan.tagline)}</p>
        </div>
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${plan.tone}`}>
          {plan.key === 'ai' ? <Sparkles size={20} /> : plan.key === 'pro' ? <Store size={20} /> : <Users size={20} />}
        </div>
      </div>

      <div className={`mt-6 border-b pb-6 ${line}`}>
        <div className="flex items-baseline gap-1">
          <span className={`text-sm font-semibold ${muted}`}>{CURRENCY}</span>
          <span className="font-mono text-5xl font-extrabold tracking-tight">{fmt(price)}</span>
          <span className={`text-sm ${muted}`}>/ {t('mes')}</span>
        </div>
        <p className={`mt-1.5 text-xs ${muted}`}>
          {yearly
            ? t('{cur} {total} al año, pagado de una vez', { cur: CURRENCY, total: fmt(yearlyPrice(plan.monthly)) })
            : t('o {cur} {total} al año ({n} meses gratis)', { cur: CURRENCY, total: fmt(yearlyPrice(plan.monthly)), n: YEARLY_FREE_MONTHS })}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {plan.limits.map(([n, label]) => (
          <div key={label} className={`rounded-2xl px-3 py-2.5 ${hi ? 'bg-gray-50' : dark ? 'bg-white/[0.06]' : 'bg-gray-50'}`}>
            <p className="font-mono text-xl font-extrabold leading-none">{n}</p>
            <p className={`mt-1 text-[11px] font-semibold uppercase tracking-wider ${muted}`}>{t(label)}</p>
          </div>
        ))}
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm leading-snug">
            <span className={`mt-0.5 flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-full ${hi ? 'bg-blue-600 text-white' : 'bg-emerald-500/15 text-emerald-500'}`} style={{ height: 18, width: 18 }}>
              <Check size={11} strokeWidth={3} />
            </span>
            <span>{t(f)}</span>
          </li>
        ))}
      </ul>

      <Link
        to={CTA}
        className={`group mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all ${
          hi
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 hover:scale-[1.02]'
            : dark
              ? 'bg-white text-[#0a0e1a] hover:bg-blue-50'
              : 'bg-[#0a0e1a] text-white hover:bg-gray-800'
        }`}
      >
        {t(plan.cta)} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
      <p className={`mt-3 text-center text-[11px] ${muted}`}>{t('{days} días gratis · sin tarjeta · cancelas cuando quieras', { days: TRIAL_DAYS })}</p>
    </div>
  )
}

/** Interruptor + las tres tarjetas. Reutilizado por la landing y por /planes. */
export function PlanCards({ dark = false }) {
  const [yearly, setYearly] = useState(false)
  return (
    <>
      <Reveal className="mb-10 flex justify-center"><BillingToggle yearly={yearly} onChange={setYearly} dark={dark} /></Reveal>
      <div className="grid gap-6 pt-3 lg:grid-cols-3 lg:gap-5">
        {PLANS.map((p, i) => (
          <Reveal key={p.key} delay={i * 110} className="h-full">
            <PlanCard plan={p} yearly={yearly} dark={dark} />
          </Reveal>
        ))}
      </div>
    </>
  )
}

/** Ofertas vigentes, en fichas. */
export function OffersGrid({ dark = false }) {
  const t = useT()
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {OFFERS.map(({ key, icon, tone, title, desc }, i) => {
        const Icon = OFFER_ICONS[icon] ?? Sparkles
        return (
          <Reveal key={key} delay={i * 100}>
            <div className={`group relative h-full overflow-hidden rounded-3xl p-7 transition-all hover:-translate-y-1 ${
              dark ? 'border border-white/10 bg-white/[0.05] backdrop-blur' : 'border border-gray-200 bg-white hover:shadow-xl'
            }`}>
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40 ${tone}`} />
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tone}`}>
                <Icon size={22} />
              </div>
              <h3 className={`text-lg font-extrabold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>{t(title)}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{t(desc, { days: TRIAL_DAYS })}</p>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

/** Tabla comparativa (solo en /planes). */
export function CompareTable() {
  const t = useT()
  const cell = (v) => v === true
    ? <Check size={18} strokeWidth={3} className="mx-auto text-emerald-500" />
    : v === false
      ? <Minus size={16} className="mx-auto text-gray-300" />
      : <span className="text-sm font-semibold text-gray-900">{t(v)}</span>
  return (
    <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">{t('Qué incluye')}</th>
            {PLANS.map((p) => (
              <th key={p.key} className="px-4 py-4 text-center">
                <span className={`inline-block rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold text-white ${p.tone}`}>{p.name}</span>
                <p className="mt-1 font-mono text-xs text-gray-500">{CURRENCY} {fmt(p.monthly)} / {t('mes')}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE.map(([label, ...vals], i) => (
            <tr key={label} className={`border-b border-gray-100 last:border-0 ${i % 2 ? 'bg-gray-50/60' : ''}`}>
              <td className="px-5 py-3.5 text-sm text-gray-700">{t(label)}</td>
              {vals.map((v, j) => <td key={j} className="px-4 py-3.5 text-center">{cell(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Sección «Precios y ofertas» de la landing. Fondo oscuro, como «Para quién». */
export function PricingSection() {
  const t = useT()
  return (
    <section id="precios" className="relative overflow-hidden bg-[#0a0e1a] py-24">
      <GridPattern />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            dark
            kicker={t('Precios y ofertas')}
            title={t('Un plan para cada tamaño de negocio')}
            sub={t('Hoy, durante el lanzamiento, todo es gratis. Estos son los planes que vienen: entra ahora y conserva el precio de lanzamiento.')}
          />
        </Reveal>
        <PlanCards dark />
        <div className="mt-16">
          <Reveal className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{t('Ofertas vigentes')}</p>
          </Reveal>
          <OffersGrid dark />
        </div>
        <Reveal delay={150} className="mt-12 text-center">
          <Link to="/planes" className="group inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10">
            {t('Comparar los planes en detalle')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
