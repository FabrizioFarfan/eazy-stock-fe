import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Globe2, Share2, Smartphone, FileText, MousePointerClick, Megaphone, ShieldCheck, Loader2 } from 'lucide-react'
import { useT } from '../../i18n'
import { bossApi } from '../../services/endpoints/boss'
import { ReportHeader, ReportHero } from '../../components/reports/ReportKit'
import { BossSwitcher } from '../../components/boss/BossKit'
import { flagEmoji } from '../../components/boss/bossUtils'
import { FUNNEL_STEPS, funnelRows, conversion, axisTicks } from '../../utils/visits'

/*
 * Panel Boss › Visitas (Frank, 30-oct-2026): «saber si la gente entra siquiera a la página: una persona abrió la
 * landing, 3 vieron los precios, 5 fueron a registrarse, a qué botón le dan más, de qué país…». Los datos los
 * junta el API sin cookies ni datos personales (AnalyticsService). Una sola serie por gráfico, en el azul de la
 * app; cada barra lleva su número al lado y el gráfico por día explica cada barra al pasar el ratón.
 */

const PERIODS = [
  { days: 1, label: 'Hoy' },
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
]

const STEP_LABEL = {
  visited: 'Entraron a la web',
  pricing: 'Vieron los precios',
  register_open: 'Abrieron el registro',
  register_submit: 'Enviaron el formulario',
  signup: 'Crearon su cuenta',
  first_sale: 'Hicieron su primera venta',
}

const SOURCE_LABEL = {
  direct: 'Directo (escribieron la dirección, o un enlace de WhatsApp)',
  instagram: 'Instagram', facebook: 'Facebook', google: 'Google', whatsapp: 'WhatsApp', tiktok: 'TikTok',
  youtube: 'YouTube', linkedin: 'LinkedIn', x: 'X (Twitter)', other_search: 'Otros buscadores',
}
const DEVICE_LABEL = { mobile: 'Celular', tablet: 'Tablet', desktop: 'Computadora' }
const CLICK_LABEL = {
  whatsapp: 'WhatsApp', go_register: 'Ir a registrarse', go_plans: 'Ver planes', go_login: 'Entrar',
  go_funciones: 'Ver funciones', go_para_quien: 'Ver «para quién»', go_preguntas: 'Ver preguntas', email: 'Correo', phone: 'Teléfono',
}
const PAGE_LABEL = {
  '/': 'Portada', '/planes': 'Planes', '/registro': 'Registro', '/login': 'Entrar', '/funciones': 'Funciones',
  '/para-quien': 'Para quién', '/preguntas': 'Preguntas', '/datenschutz': 'Privacidad', '/impressum': 'Impressum',
  '/terminos': 'Términos', '/eliminar-cuenta': 'Eliminar cuenta',
}

function countryName(code) {
  if (!code || code === '??') return null
  try {
    return new Intl.DisplayNames([document.documentElement.lang || 'es'], { type: 'region' }).of(code)
  } catch {
    return code
  }
}

function fmtDay(iso, opts = { day: 'numeric', month: 'short' }) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(document.documentElement.lang || 'es', opts)
}

/* ── El embudo: cada paso, cuántos llegaron y qué parte de los del paso anterior ── */

function Funnel({ steps }) {
  const t = useT()
  const rows = funnelRows(steps)
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900">{t('El embudo')}</h3>
      <p className="mb-4 text-[11px] text-gray-400">{t('Hasta dónde llega la gente, paso a paso. El porcentaje es sobre el paso anterior.')}</p>
      <ol className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.key} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 sm:grid-cols-[11rem_1fr_5.5rem]">
            <span className="truncate text-xs font-semibold text-gray-600">{t(STEP_LABEL[r.key] ?? r.key)}</span>
            <span className="h-7 overflow-hidden rounded-[4px] bg-gray-100" title={`${t(STEP_LABEL[r.key] ?? r.key)}: ${r.count}`}>
              <span className="block h-full rounded-[4px] bg-blue-600 transition-[width] duration-500" style={{ width: `${r.width}%` }} />
            </span>
            <span className="text-right">
              <span className="text-sm font-bold tabular-nums text-gray-900">{r.count}</span>
              {r.ofPrevious !== null && <span className="ml-1.5 text-[11px] tabular-nums text-gray-400">{r.ofPrevious} %</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ── Visitantes por día: barras de una serie, con recuadro al pasar el ratón ── */

function PerDay({ days }) {
  const t = useT()
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...days.map((d) => d.visitors))
  const ticks = axisTicks(days.length)
  const h = hover !== null ? days[hover] : null
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900">{t('Visitantes por día')}</h3>
        <span className="text-[11px] text-gray-400">{h ? `${fmtDay(h.day, { weekday: 'short', day: 'numeric', month: 'short' })} · ${t('{n} visitantes', { n: h.visitors })} · ${t('{n} cuentas', { n: h.signups })}` : t('Pasa el ratón por una barra')}</span>
      </div>
      <div className="relative h-40" onMouseLeave={() => setHover(null)}>
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-gray-100" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100" />
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {days.map((d, i) => (
            <button key={d.day} type="button" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}
              aria-label={`${fmtDay(d.day)}: ${t('{n} visitantes', { n: d.visitors })}, ${t('{n} cuentas', { n: d.signups })}`}
              className="flex h-full flex-1 items-end">
              <span className={`block w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-blue-700' : 'bg-blue-600'}`}
                style={{ height: d.visitors ? `${Math.max(3, (d.visitors / max) * 100)}%` : '2px', opacity: d.visitors ? 1 : 0.25 }} />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-gray-400">
        {ticks.map((i) => <span key={i}>{fmtDay(days[i]?.day)}</span>)}
      </div>
      <p className="mt-1 text-right text-[10px] text-gray-300">{t('máx. {n} al día', { n: max })}</p>
    </section>
  )
}

/* ── Listas ordenadas: el número al lado de su barra ── */

function RankList({ icon: Icon, title, rows, labelOf, empty, unit }) {
  const t = useT()
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={15} /></span>
        <h3 className="text-sm font-bold text-gray-900">{t(title)}</h3>
        {unit && <span className="ml-auto text-[10px] text-gray-400">{t(unit)}</span>}
      </div>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-gray-400">{t(empty)}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.key ?? '—'} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
              <span className="truncate text-xs font-semibold text-gray-700">{labelOf(r.key)}</span>
              <span className="text-xs font-bold tabular-nums text-gray-900">{r.value}</span>
              <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <span className="block h-full rounded-full bg-blue-600" style={{ width: `${(r.value / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function VisitsPage() {
  const t = useT()
  const [days, setDays] = useState(7)
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['boss-analytics', days],
    queryFn: () => bossApi.getAnalytics(days).then((r) => r.data.data ?? r.data),
    refetchInterval: 60_000,
  })
  const steps = useMemo(() => {
    const byKey = Object.fromEntries((data?.funnel ?? []).map((s) => [s.key, s.count]))
    return FUNNEL_STEPS.map((key) => ({ key, count: byKey[key] ?? 0 }))
  }, [data])
  const count = (key) => steps.find((s) => s.key === key)?.count ?? 0
  const period = PERIODS.find((p) => p.days === days)

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={BarChart3} title={t('Visitas')} subtitle={t('Quién entra en eazy-stock.com y hasta dónde llega')}
        right={isFetching && !isLoading ? <Loader2 size={16} className="animate-spin text-gray-400" /> : null} />

      <BossSwitcher />

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('Periodo')}>
        {PERIODS.map((p) => (
          <button key={p.days} type="button" role="tab" aria-selected={days === p.days} onClick={() => setDays(p.days)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              days === p.days ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
            {t(p.label)}
          </button>
        ))}
      </div>

      <ReportHero icon={BarChart3} label={t('Visitantes · {period}', { period: t(period.label) })} value={data?.visitors ?? 0} loading={isLoading}
        sub={<span>{(data?.liveNow ?? 0) === 1 ? t('1 persona en la web ahora mismo') : t('{n} personas en la web ahora mismo', { n: data?.liveNow ?? 0 })}</span>}
        cells={[
          [t('Páginas vistas'), data?.pageviews ?? 0],
          [t('Vieron precios'), count('pricing')],
          [t('Cuentas creadas'), count('signup')],
          [t('Conversión'), `${conversion(count('signup'), data?.visitors ?? 0)} %`],
        ]} />

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-500">
          {t('No se pudieron cargar las visitas. Intenta de nuevo en un momento.')}
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {data.visitors === 0 && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-sm text-blue-800">
              {t('Todavía no hay visitas en este periodo. Se cuentan desde el 30 de octubre de 2026.')}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <Funnel steps={steps} />
            <PerDay days={data.perDay ?? []} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <RankList icon={Globe2} title="Países" unit="visitantes" rows={data.countries ?? []} empty="Sin datos todavía"
              labelOf={(k) => (countryName(k) ? `${flagEmoji(k)} ${countryName(k)}` : t('No se sabe'))} />
            <RankList icon={Share2} title="De dónde vienen" unit="visitantes" rows={data.sources ?? []} empty="Sin datos todavía"
              labelOf={(k) => t(SOURCE_LABEL[k] ?? k)} />
            <RankList icon={Smartphone} title="Dispositivo" unit="visitantes" rows={data.devices ?? []} empty="Sin datos todavía"
              labelOf={(k) => t(DEVICE_LABEL[k] ?? k)} />
            <RankList icon={FileText} title="Páginas más vistas" unit="visitantes" rows={data.pages ?? []} empty="Sin datos todavía"
              labelOf={(k) => (PAGE_LABEL[k] ? `${t(PAGE_LABEL[k])} · ${k}` : k)} />
            <RankList icon={MousePointerClick} title="Botones más pulsados" unit="clics" rows={data.clicks ?? []} empty="Nadie ha pulsado nada todavía"
              labelOf={(k) => t(CLICK_LABEL[k] ?? k)} />
            <RankList icon={Megaphone} title="Campañas" unit="visitantes" rows={data.campaigns ?? []}
              empty="Ninguna todavía: comparte enlaces con ?utm_campaign=nombre" labelOf={(k) => k} />
          </div>
        </>
      )}

      <div className="flex items-start gap-2.5 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 text-[11px] leading-relaxed text-gray-500 shadow-sm">
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" />
        <p>
          {t('Sin cookies ni datos personales: no se guarda la IP ni nada que identifique a nadie, y un mismo visitante se cuenta una vez al día. No se cuenta a quien tiene la sesión abierta (vosotros y los clientes dentro de la app) ni a quien pide «no me sigas». El sexo y la edad no se pueden saber así: los dan los anuncios de Meta, de quien hace clic.')}
          {' '}
          {t('Para saber qué publicación trae gente, comparte el enlace con su etiqueta, por ejemplo eazy-stock.com/?utm_source=instagram&utm_campaign=reel_ferreterias.')}
        </p>
      </div>
    </div>
  )
}
