import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, Loader2, Package, HandCoins, Trophy, Boxes, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSupplierAnalysis } from '../hooks/useReports'
import HelpDrawer from '../components/common/HelpDrawer'
import DateRangeQuick from '../components/common/DateRangeQuick'
import { ReportsSwitcher, ReportHero, ReportHeader } from '../components/reports/ReportKit'
import { formatPrice } from '../utils/formatMoney'
import { quickRange } from '../utils/dateRanges'
import { useT, dateLocale } from '../i18n'

/**
 * Análisis de proveedores (Frank, 3-oct-2026): quién nos vende más, de quién
 * tenemos más stock, cuánto vendemos de lo suyo y cuánto le debemos. Solo
 * dueño (lleva costos). Mismo lenguaje que Análisis de clientes.
 */

function formatDay(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}
function fmtQty(q) { return q == null ? '0' : String(parseFloat(q)) }

const SORTS = [
  { key: 'purchased',   label: 'Te vende más',      field: (r) => Number(r.purchased) },
  { key: 'stockValue',  label: 'Más stock suyo',    field: (r) => Number(r.stockValue) },
  { key: 'soldRevenue', label: 'Más vendido',       field: (r) => Number(r.soldRevenue) },
  { key: 'currentDebt', label: 'Más deuda',         field: (r) => Number(r.currentDebt) },
]

const thCls = 'px-4 py-3.5 text-xs font-semibold uppercase tracking-widest text-gray-400'

function Bar({ value, max, cls = 'bg-blue-600' }) {
  const pct = max > 0 ? Math.max(3, (value / max) * 100) : 0
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function RankBadge({ n }) {
  const medal = n === 1 ? 'bg-amber-400 text-white' : n === 2 ? 'bg-gray-300 text-gray-800' : n === 3 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-500'
  return <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${medal}`}>{n}</span>
}

export default function SupplierAnalysisPage() {
  const t = useT()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [range, setRange] = useState(() => quickRange('month'))
  const [sortKey, setSortKey] = useState('purchased')

  const params = useMemo(() => ({
    from: range.from, to: range.to,
    ...(user?.role === 'SUPER_ADMIN' && user?.businessId ? { businessId: user.businessId } : {}),
  }), [range, user])
  const { data, isLoading, isError } = useSupplierAnalysis(params)

  const sort = SORTS.find((s) => s.key === sortKey) ?? SORTS[0]
  const rows = useMemo(() => [...(data?.rows ?? [])].sort((a, b) => sort.field(b) - sort.field(a)), [data, sort])
  const max = rows.length ? Math.max(...rows.map(sort.field)) : 0
  const topSeller = (data?.rows ?? []).reduce((m, r) => (!m || Number(r.purchased) > Number(m.purchased) ? r : m), null)
  const topStock  = (data?.rows ?? []).reduce((m, r) => (!m || Number(r.stockValue) > Number(m.stockValue) ? r : m), null)
  const sharePct = topSeller && Number(data?.totalPurchased) > 0 ? Math.round((Number(topSeller.purchased) / Number(data.totalPurchased)) * 100) : null

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={Truck} title={t('Análisis de proveedores')}
        subtitle={t('Quién te vende más, de quién tienes más stock y cuánto le debes.')}
        help={(
          <HelpDrawer title={t('Cómo usar Análisis de proveedores')} autoOpenKey="eazystock_supplier_analysis_help_v1">
            <p>{t('Responde')} <strong>{t('a qué proveedor le compras más, de cuál tienes más mercadería guardada y cuánto le debes a cada uno')}</strong>. {t('Se alimenta de las recepciones que registras en Stock y de las ventas.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🚚 {t('Te vende más')}</p>
              <p className="mt-1">{t('Suma lo que te llegó de cada proveedor en el período (al costo), con cuántas recepciones y cuándo fue la última. Arriba ves quién se lleva qué porcentaje de tus compras.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📦 {t('Más stock suyo')}</p>
              <p className="mt-1">{t('Cuántas unidades de sus productos tienes hoy y cuánto valen al costo de compra: es la plata que tienes parada en el almacén por proveedor. Si un proveedor pesa mucho acá y vende poco, revisa el pedido.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">💵 {t('Más vendido y deuda')}</p>
              <p className="mt-1">{t('«Más vendido» es lo que facturaste con los productos de ese proveedor en el período; «Más deuda» es lo que le debes hoy (Cuentas por pagar). Toca una fila para abrir su cuenta o «Productos» para ver su catálogo.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📅 {t('El período')}</p>
              <p className="mt-1">{t('Hoy, esta semana, este mes, este año o fechas a tu gusto. El stock y la deuda son de hoy; lo comprado y lo vendido, del período elegido.')}</p>
            </div>
          </HelpDrawer>
        )} />

      <ReportsSwitcher />

      <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
        <DateRangeQuick from={range.from} to={range.to} onChange={setRange} />
      </div>

      <ReportHero icon={Truck} label={t('Comprado en el período')} loading={isLoading}
        value={formatPrice(data?.totalPurchased ?? 0)}
        sub={data && (
          <span>
            {t('{n} recepciones a {m} proveedores', { n: data.receiptsCount, m: data.suppliersWithPurchases })}
            {topSeller && sharePct != null && sharePct > 0 && <> · {t('el que más te vende')}: <b className="text-white">{topSeller.name}</b> ({sharePct}%)</>}
            {topStock && Number(topStock.stockValue) > 0 && <> · {t('de quien más stock tienes')}: <b className="text-white">{topStock.name}</b></>}
          </span>
        )}
        cells={[
          [t('Stock suyo al costo'), formatPrice(data?.stockValue ?? 0)],
          [t('Vendido de sus productos'), formatPrice(data?.soldRevenue ?? 0)],
          [t('Deuda con proveedores'), formatPrice(data?.totalDebt ?? 0), Number(data?.totalDebt) > 0 ? 'text-amber-200' : ''],
          [t('Proveedores activos'), data?.suppliersCount ?? 0],
        ]} />

      {/* Orden del ranking */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
        {SORTS.map((s) => (
          <button key={s.key} type="button" onClick={() => setSortKey(s.key)}
            className={`flex-shrink-0 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
              sortKey === s.key ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
            {t(s.label)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <Trophy size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">{t('Ranking de proveedores')}</h3>
          <span className="text-xs text-gray-400">· {t('ordenado por')} {t(sort.label).toLowerCase()}</span>
        </div>

        {/* Celular: tarjetas */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></div>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-red-500">{t('No pudimos cargar el reporte.')}</p>
          ) : rows.length === 0 ? (
            <p className="px-5 py-14 text-center text-sm font-semibold text-gray-600">{t('Todavía no tienes proveedores con actividad')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((r, i) => (
                <li key={r.supplierId} className="px-4 py-3.5">
                  <button type="button" onClick={() => navigate(`/suppliers/${r.supplierId}`)} className="flex w-full items-start gap-3 text-left">
                    <RankBadge n={i + 1} />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-gray-900">{r.name}</span>
                      <span className="block text-xs text-gray-400">{t('Última recepción')}: {formatDay(r.lastReceiptAt)}</span>
                      <Bar value={sort.field(r)} max={max} />
                    </span>
                    <span className="flex-shrink-0 text-right">
                      <span className="block text-base font-bold text-gray-900">{formatPrice(sort.field(r))}</span>
                      <span className="block text-[11px] text-gray-400">{t(sort.label)}</span>
                    </span>
                  </button>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>{t('Comprado')}: <b className="text-gray-800">{formatPrice(r.purchased)}</b> · {r.receipts} {t('recep.')}</span>
                    <span>{t('Stock')}: <b className="text-gray-800">{fmtQty(r.stockUnits)}</b> ({formatPrice(r.stockValue)})</span>
                    <span>{t('Vendido')}: <b className="text-gray-800">{formatPrice(r.soldRevenue)}</b></span>
                    <span>{t('Deuda')}: <b className={Number(r.currentDebt) > 0 ? 'text-amber-700' : 'text-gray-800'}>{formatPrice(r.currentDebt)}</b></span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Link to={`/suppliers/${r.supplierId}`} className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700"><HandCoins size={12} /> {t('Cuenta')}</Link>
                    <Link to={`/products?supplierId=${r.supplierId}`} className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700"><Package size={12} /> {t('Productos')} ({r.productsCount})</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* PC: tabla */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className={`${thCls} w-12 text-center`}>#</th>
                <th className={`${thCls} text-left`}>{t('Proveedor')}</th>
                <th className={`${thCls} text-right`}>{t('Comprado')}</th>
                <th className={`${thCls} text-right whitespace-nowrap`}>{t('Stock suyo')}</th>
                <th className={`${thCls} text-right`}>{t('Vendido')}</th>
                <th className={`${thCls} text-right`}>{t('Deuda')}</th>
                <th className={`${thCls} text-right whitespace-nowrap`}>{t('Última recepción')}</th>
                <th className={`${thCls} text-center`}>{t('Ver')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : isError ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-red-500">{t('No pudimos cargar el reporte.')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="flex flex-col items-center gap-3 py-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50"><Boxes size={28} className="text-blue-500" /></div>
                    <p className="text-sm font-semibold text-gray-700">{t('Todavía no tienes proveedores con actividad')}</p>
                  </div>
                </td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.supplierId} onClick={() => navigate(`/suppliers/${r.supplierId}`)}
                  className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50">
                  <td className="px-4 py-3.5"><RankBadge n={i + 1} /></td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <p className="text-[11px] text-gray-400">{r.ruc ? <span className="font-mono">RUC {r.ruc}</span> : null}{r.ruc ? ' · ' : ''}{r.productsCount} {t('productos')}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-bold text-gray-900">{formatPrice(r.purchased)}</span>
                    <span className="block text-[11px] text-gray-400">{r.receipts} {t('recep.')}</span>
                    {sortKey === 'purchased' && <div className="ml-auto w-24"><Bar value={Number(r.purchased)} max={max} /></div>}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-bold text-gray-900">{formatPrice(r.stockValue)}</span>
                    <span className="block text-[11px] text-gray-400">{fmtQty(r.stockUnits)} {t('unid.')}</span>
                    {sortKey === 'stockValue' && <div className="ml-auto w-24"><Bar value={Number(r.stockValue)} max={max} cls="bg-indigo-500" /></div>}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-bold text-gray-900">{formatPrice(r.soldRevenue)}</span>
                    <span className="block text-[11px] text-gray-400">{fmtQty(r.soldUnits)} {t('unid.')}</span>
                    {sortKey === 'soldRevenue' && <div className="ml-auto w-24"><Bar value={Number(r.soldRevenue)} max={max} cls="bg-emerald-500" /></div>}
                  </td>
                  <td className={`px-4 py-3.5 text-right font-semibold ${Number(r.currentDebt) > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                    {formatPrice(r.currentDebt)}
                    {sortKey === 'currentDebt' && <div className="ml-auto w-24"><Bar value={Number(r.currentDebt)} max={max} cls="bg-amber-500" /></div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs text-gray-500">{formatDay(r.lastReceiptAt)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/suppliers/${r.supplierId}`} title={t('Cuenta y pagos')} className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"><HandCoins size={14} /></Link>
                      <Link to={`/products?supplierId=${r.supplierId}`} title={t('Sus productos')} className="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"><Package size={14} /></Link>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-300">
        <ArrowRight size={12} /> {t('El stock y la deuda son de hoy; lo comprado y lo vendido, del período elegido.')}
      </p>
    </div>
  )
}
