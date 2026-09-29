import { formatPrice } from '../utils/formatMoney'
import { useMemo, useState } from 'react'
import {
  Trophy, Package, ChevronDown, ChevronRight, Medal,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSellerPerformance } from '../hooks/useReports'
import HelpDrawer from '../components/common/HelpDrawer'
import DateRangeQuick from '../components/common/DateRangeQuick'
import { ReportsSwitcher, ReportHero, ReportHeader } from '../components/reports/ReportKit'
import { localISODate } from '../utils/formatDate'
import { useT, dateLocale } from '../i18n'

// ── helpers ───────────────────────────────────────────────────────────────────

function today() { return localISODate() }
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatCurrency(v) {
  if (v == null) return '—'
  return formatPrice(v) // moneda del negocio
}

function formatNumber(v) {
  if (v == null) return '0'
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(v)
}

function formatDay(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(`${str}T00:00:00`))
}

const RANK_STYLE = [
  'bg-amber-100 text-amber-700 ring-1 ring-amber-200',   // 1°
  'bg-slate-100 text-slate-600 ring-1 ring-slate-200',   // 2°
  'bg-orange-100 text-orange-700 ring-1 ring-orange-200', // 3°
]

// ── seller row (expandable) ────────────────────────────────────────────────

function SellerCard({ seller, rank, maxRevenue }) {
  const t = useT()
  const [open, setOpen] = useState(rank === 0)
  const pct = maxRevenue > 0 ? Math.round((seller.revenue / maxRevenue) * 100) : 0
  const rankCls = RANK_STYLE[rank] ?? 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${rank === 0 ? 'border-amber-200 ring-2 ring-amber-100' : 'border-gray-100'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/60"
      >
        <div className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${rankCls}`}>
          {rank < 3 ? <Medal size={20} /> : rank + 1}
          {rank < 3 && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-gray-700 shadow ring-1 ring-gray-200">{rank + 1}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-semibold text-gray-900">{seller.employeeName}</p>
            <p className="flex-shrink-0 text-xl font-extrabold text-gray-900">{formatCurrency(seller.revenue)}</p>
          </div>
          {/* Barra proporcional al que más vendió */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full ${rank === 0 ? 'bg-amber-400' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span><b className="text-gray-700">{seller.sales}</b> {t('ventas')}</span>
            <span><b className="text-gray-700">{formatNumber(seller.unitsSold)}</b> {t('unidades')}</span>
            <span>{t('Ticket prom.')} <b className="text-gray-700">{formatCurrency(seller.avgTicket)}</b></span>
          </div>
        </div>

        <span className="flex-shrink-0 text-gray-400">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            {t('Ventas día por día')}
          </p>
          {seller.byDay.length === 0 ? (
            <p className="py-3 text-sm text-gray-400">{t('Sin ventas en el período.')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-gray-400">
                    <th className="py-1.5 pr-4 font-semibold">{t('Día')}</th>
                    <th className="py-1.5 pr-4 text-center font-semibold">{t('Ventas')}</th>
                    <th className="py-1.5 text-right font-semibold">{t('Ingresos')}</th>
                  </tr>
                </thead>
                <tbody>
                  {seller.byDay.map((d) => (
                    <tr key={d.date} className="border-t border-gray-100">
                      <td className="py-2 pr-4 capitalize text-gray-700">{formatDay(d.date)}</td>
                      <td className="py-2 pr-4 text-center text-gray-600">{d.sales}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">{formatCurrency(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function SellerPerformancePage() {
  const t = useT()
  const { user } = useAuth()
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo]     = useState(today())

  const businessId = user?.businessId
  const params = useMemo(
    () => ({ from, to, ...(businessId ? { businessId } : {}) }),
    [from, to, businessId],
  )

  const { data, isLoading, isError } = useSellerPerformance(params)

  const sellers    = data?.sellers ?? []
  const maxRevenue = sellers.length ? Number(sellers[0].revenue) : 0

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Trophy} title={t('Rendimiento de vendedores')}
        subtitle={t('Quién vendió más y cuánto exactamente cada día.')}
        help={(
          <HelpDrawer title={t('Cómo usar Rendimiento')} autoOpenKey="eazystock_sellerperf_help_v2">
            <p>{t('Compara a tu equipo:')} <strong>{t('quién vendió más y cuánto exactamente')}</strong>, {t('día por día.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🏅 {t('Ranking de vendedores')}</p>
              <p className="mt-1">{t('Los tres primeros llevan medalla. La barra azul muestra cuánto vendió cada uno respecto al primero. Toca una fila para desplegar sus ventas día por día con el total de ingresos de cada jornada.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📊 {t('Qué significa cada número')}</p>
              <p className="mt-1">{t('Ventas = cantidad de tickets cerrados. Unidades = productos vendidos (respeta la unidad de venta: paquete, gramo, metro…). Ticket promedio = ingresos ÷ ventas: cuánto gasta en promedio cada cliente que atiende ese vendedor.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📅 {t('Filtra por fechas')}</p>
              <p className="mt-1">{t('Elige el rango que quieras (hoy, la semana, el mes) y la tabla se recalcula al instante.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">💡 {t('¿Para qué sirve?')}</p>
              <p className="mt-1">{t('Para premiar al que más vende, detectar días flojos y repartir mejor los turnos.')}</p>
            </div>
          </HelpDrawer>
        )} />

      <ReportsSwitcher />

      {/* Período: atajos de un toque + fechas */}
      <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
        <DateRangeQuick from={from} to={to}
          onChange={(r) => { setFrom(r.from || firstOfMonth()); setTo(r.to || today()) }} />
      </div>

      {/* Franja del período */}
      <ReportHero icon={Trophy} label={t('Ingresos del período')} loading={isLoading}
        value={formatCurrency(data?.totalRevenue ?? 0)}
        sub={sellers[0] && <span className="inline-flex items-center gap-1.5"><Medal size={13} className="text-amber-300" /> {t('Primero')}: <b className="text-white">{sellers[0].employeeName}</b> · {formatCurrency(sellers[0].revenue)}</span>}
        cells={[
          [t('Ventas del período'), data?.totalSales ?? 0],
          [t('Vendedores activos'), sellers.length],
          [t('Ticket promedio'), formatCurrency(Number(data?.totalSales) > 0 ? Number(data?.totalRevenue) / Number(data?.totalSales) : 0)],
        ]} />

      {/* Ranking */}
      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
          {t('No se pudo cargar el rendimiento. Intenta de nuevo.')}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
            <Package size={22} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">{t('No hay ventas en este período')}</p>
          <p className="text-xs text-gray-400">{t('Ajusta el rango de fechas para ver resultados.')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map((s, i) => (
            <SellerCard key={s.employeeId} seller={s} rank={i} maxRevenue={maxRevenue} />
          ))}
        </div>
      )}
    </div>
  )
}
