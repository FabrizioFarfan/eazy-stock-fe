import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Minus, Sparkles, Lock, CalendarClock, Store, Users, Clock } from 'lucide-react'
import { useT, dateLocale } from '../../i18n'
import { Reveal, SectionHead, GridPattern } from './shared'
import { PLANS, OFFERS, COMPARE, PERIODS, DEFAULT_PERIOD, periodOf, periodPrice, perMonth, savings, fmtMoney, moneyParts, siteCurrency, promoActive, promoVars, trialLine } from './plans'

// Registro propio desde el 15-oct-2026 (antes todo iba al login).
const CTA = '/registro'
const OFFER_ICONS = { Sparkles, Lock, CalendarClock }

// ═══════════════════════════════════════════════════════════════════════════
//  Precios y ofertas — sección de la landing (#precios) y piezas de /planes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Selector de período (20-oct-2026, task 1015): Mensual · Trimestral −10 % · Anual −20 %.
 * Lo usan /planes, la sección de precios del Inicio y Ajustes › Tu plan.
 * `compact` = sin la línea de la prueba gratis debajo.
 */
export function PeriodSelector({ period, onChange, dark = false, compact = false }) {
  const t = useT()
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all sm:px-4'
  const on = dark ? 'bg-white text-[#0a0e1a] shadow' : 'bg-[#0a0e1a] text-white shadow'
  const off = dark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border p-1 ${dark ? 'border-white/15 bg-white/5' : 'border-gray-200 bg-white'}`} role="group" aria-label={t('Período de pago')}>
        {PERIODS.map((p) => {
          const active = p.key === period
          return (
            <button key={p.key} type="button" onClick={() => onChange(p.key)} className={`${base} ${active ? on : off}`} aria-pressed={active}>
              {t(p.label)}
              {p.discount > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider ${active ? (dark ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-400 text-[#0a0e1a]') : 'bg-emerald-500/15 text-emerald-500'}`}>
                  −{p.discount} %
                </span>
              )}
            </button>
          )
        })}
      </div>
      {!compact && (
        <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
          {t('Todos los planes empiezan con la prueba gratis:')} {trialLine(t, dateLocale()).toLowerCase()}.
        </p>
      )}
    </div>
  )
}

/** Chip chico «Pronto» para una función que aún no está (20-oct-2026). */
export function SoonMini() {
  const t = useT()
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 align-middle text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
      <Clock size={9} strokeWidth={3} /> {t('Pronto')}
    </span>
  )
}

/** Chip «Llega pronto» del plan AI (se ve en las tres pantallas). */
export function ComingSoonChip({ className = '' }) {
  const t = useT()
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#0a0e1a] shadow ${className}`}>
      <Clock size={11} strokeWidth={3} /> {t('Llega pronto')}
    </span>
  )
}

/**
 * Tarjeta de un plan. En fondo oscuro, el plan destacado es la tarjeta blanca.
 * Muestra el precio POR MES del período elegido, el total a pagar de una vez y
 * cuánto ahorra frente al mensual. El plan AI «llega pronto»: chip y botón apagado.
 */
function PlanCard({ plan, period, currency, dark, current = false, ctaTo = CTA, compact = false }) {
  const t = useT()
  const hi = plan.highlight
  const per = periodOf(period)
  const monthly = perMonth(plan, per.key, currency)
  const total = periodPrice(plan, per.key, currency)
  const save = savings(plan, per.key, currency)
  const soon = !!plan.comingSoon
  const shell = hi
    ? 'bg-white text-gray-900 shadow-[0_30px_80px_-20px_rgba(37,99,235,.55)] ring-2 ring-blue-500/60'
    : dark
      ? 'border border-white/10 bg-white/[0.05] text-white backdrop-blur'
      : 'border border-gray-200 bg-white text-gray-900'
  const muted = hi ? 'text-gray-500' : dark ? 'text-slate-400' : 'text-gray-500'
  const line = hi ? 'border-gray-100' : dark ? 'border-white/10' : 'border-gray-100'
  const saveTone = hi ? 'text-emerald-600' : 'text-emerald-400'
  return (
    <div className={`relative flex h-full flex-col rounded-3xl transition-transform hover:-translate-y-1 ${compact ? 'p-5' : 'p-7 sm:p-8'} ${shell} ${current ? 'ring-2 ring-emerald-500' : ''}`}>
      {current && (
        <span className="absolute -top-3 right-7 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg">
          {t('Tu plan actual')}
        </span>
      )}
      {soon && !current && <ComingSoonChip className="absolute -top-3 right-7" />}
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
          <span className={`text-sm font-semibold ${muted}`}>{moneyParts(monthly, currency).symbol}</span>
          <span className={`font-mono font-extrabold tracking-tight ${compact ? 'text-4xl' : 'text-5xl'}`}>{moneyParts(monthly, currency).number}</span>
          <span className={`text-sm ${muted}`}>/ {t('mes')}</span>
        </div>
        {per.months === 1 ? (
          <p className={`mt-1.5 text-xs ${muted}`}>{t('Se cobra cada mes. Trimestral −{q} %, anual −{y} %.', { q: PERIODS[1].discount, y: PERIODS[2].discount })}</p>
        ) : (
          <p className={`mt-1.5 text-xs ${muted}`}>
            {t('{total} por {unit}, pagado de una vez', { total: fmtMoney(total, currency), unit: t(per.unit) })}
            {' · '}
            <span className={`font-bold ${saveTone}`}>{t('ahorras {amount}', { amount: fmtMoney(save.amount, currency) })}</span>
          </p>
        )}
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
        {plan.features.map((raw) => {
          const f = typeof raw === 'string' ? { text: raw } : raw
          return (
            <li key={f.text} className="flex items-start gap-2.5 text-sm leading-snug">
              <span className={`mt-0.5 flex flex-shrink-0 items-center justify-center rounded-full ${
                f.soon ? 'bg-amber-500/15 text-amber-500' : hi ? 'bg-blue-600 text-white' : 'bg-emerald-500/15 text-emerald-500'}`} style={{ height: 18, width: 18 }}>
                {f.soon ? <Clock size={11} strokeWidth={3} /> : <Check size={11} strokeWidth={3} />}
              </span>
              <span className={f.soon ? muted : ''}>{t(f.text)} {f.soon && <SoonMini />}</span>
            </li>
          )
        })}
      </ul>

      {current ? (
        <span className={`mt-8 inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold ${hi ? 'border-gray-200 text-gray-500' : dark ? 'border-white/15 text-slate-300' : 'border-gray-200 text-gray-500'}`}>
          <Check size={15} /> {t('Es tu plan')}
        </span>
      ) : soon ? (
        <span aria-disabled="true" className={`mt-8 inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-dashed px-5 py-3.5 text-sm font-bold ${dark ? 'border-white/20 text-slate-400' : 'border-gray-300 text-gray-400'}`}>
          <Clock size={15} /> {t('Llega pronto')}
        </span>
      ) : (
      <Link
        to={ctaTo}
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
      )}
      {!compact && (
        <p className={`mt-3 text-center text-[11px] ${muted}`}>
          {soon ? t('Mientras tanto, Basic o Pro; te pasas a AI cuando salga.') : <>{trialLine(t, dateLocale())} · {t('cancelas cuando quieras')}</>}
        </p>
      )}
    </div>
  )
}

/**
 * Selector de período + las tres tarjetas. Reutilizado por /planes, el Inicio y Ajustes › Tu plan.
 * `current` = key del plan actual (lo marca y desactiva su botón); `ctaTo` = a dónde
 * lleva el botón (en la app, el WhatsApp/plan); `compact` = tarjetas más chicas y sin
 * letra chica (Ajustes › Tu plan); `currency` = 'PEN' | 'USD' (por defecto la de la web
 * según el navegador); `period`/`onPeriodChange` = controlado desde fuera (Ajustes), si
 * no se pasan el selector lleva su propio estado.
 */
export function PlanCards({ dark = false, current = null, ctaTo = CTA, compact = false, currency, period, onPeriodChange }) {
  const [own, setOwn] = useState(DEFAULT_PERIOD)
  const cur = currency ?? siteCurrency()
  const per = period ?? own
  const setPer = onPeriodChange ?? setOwn
  return (
    <>
      <Reveal className={`flex justify-center ${compact ? 'mb-6' : 'mb-10'}`}><PeriodSelector period={per} onChange={setPer} dark={dark} compact={compact} /></Reveal>
      <div className={`grid gap-6 pt-3 lg:grid-cols-3 ${compact ? 'lg:gap-4' : 'lg:gap-5'}`}>
        {PLANS.map((p, i) => (
          <Reveal key={p.key} delay={i * 110} className="h-full">
            <PlanCard plan={p} period={per} currency={cur} dark={dark} current={current === p.key} ctaTo={ctaTo} compact={compact} />
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
      {OFFERS.map(({ key, icon, tone, title, desc, afterPromo }, i) => {
        const Icon = OFFER_ICONS[icon] ?? Sparkles
        // La oferta «gratis hasta el 15-dic» se convierte en «14 días gratis» cuando pasa la promo.
        if (afterPromo && !promoActive()) ({ title, desc } = afterPromo)
        const OFFER_VARS = promoVars(dateLocale())
        return (
          <Reveal key={key} delay={i * 100}>
            <div className={`group relative h-full overflow-hidden rounded-3xl p-7 transition-all hover:-translate-y-1 ${
              dark ? 'border border-white/10 bg-white/[0.05] backdrop-blur' : 'border border-gray-200 bg-white hover:shadow-xl'
            }`}>
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40 ${tone}`} />
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tone}`}>
                <Icon size={22} />
              </div>
              <h3 className={`text-lg font-extrabold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>{t(title, OFFER_VARS)}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{t(desc, OFFER_VARS)}</p>
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
      : v === 'soon'
        ? <SoonMini />
        : typeof v === 'object'
          ? <span className="inline-flex flex-wrap items-center justify-center gap-1 text-sm font-semibold text-gray-700">{t(v.text)} {v.soon && <SoonMini />}</span>
          : <span className="text-sm font-semibold text-gray-900">{t(v)}</span>
  return (
    <div className="lp-table overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">{t('Qué incluye')}</th>
            {PLANS.map((p) => (
              <th key={p.key} className="px-4 py-4 text-center">
                <span className={`inline-block rounded-full bg-gradient-to-r px-3 py-1 text-xs font-extrabold text-white ${p.tone}`}>{p.name}</span>
                <p className="mt-1 font-mono text-xs text-gray-500">{fmtMoney(periodPrice(p, 'monthly', siteCurrency()), siteCurrency())} / {t('mes')}</p>
                {p.comingSoon && <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600">{t('Llega pronto')}</p>}
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
            sub={t('Gratis hasta el {date}, sin tarjeta, y los primeros {n} negocios pagan la mitad los primeros {months} meses. Pagas por el tamaño de tu negocio, no por funciones escondidas.', promoVars(dateLocale()))}
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
