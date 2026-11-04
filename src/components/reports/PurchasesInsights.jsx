import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Loader2, Package, CreditCard, PackagePlus, CalendarRange, ArrowRight } from 'lucide-react'
import { formatPrice, currencySymbol } from '../../utils/formatMoney'
import { formatQty } from '../../utils/quantity'
import { PAYMENT_METHODS } from '../../utils/expenseKinds'
import { useT, dateLocale } from '../../i18n'

/**
 * Compras y gastos, lo nuevo del 4-nov-2026 (Frank: «más completo, con datos para analizar mejor, sin que sea
 * difícil de usar»): la tendencia de 12 meses, en qué productos se fue la plata, cómo se pagaron los gastos y
 * las compras de mercadería del período, una por una.
 */

function Card({ icon: Icon, tone = 'text-blue-600', title, hint, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <Icon size={16} className={tone} />
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {hint && <span className="hidden text-xs text-gray-400 sm:inline">· {hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Bar_({ value, max, cls = 'bg-blue-600' }) {
  const pct = max > 0 ? Math.max(3, (value / max) * 100) : 0
  return <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} /></div>
}

const Spinner = () => <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></div>

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return new Intl.DateTimeFormat(dateLocale(), { month: 'short', year: '2-digit' }).format(new Date(y, m - 1, 1))
}

function TrendTooltip({ active, payload, label }) {
  const t = useT()
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>
      <p className="text-blue-600">{t('Mercadería')}: {formatPrice(p.purchased)}</p>
      <p className="text-amber-600">{t('Otros gastos')}: {formatPrice(p.expenses)}</p>
      <p className="mt-1 border-t border-gray-100 pt-1 font-bold text-gray-900">{t('Total')}: {formatPrice(p.total)}</p>
    </div>
  )
}

/** Los últimos 12 meses, mes a mes, aunque el período de arriba sea una semana. */
export function TrendCard({ trend, isLoading }) {
  const t = useT()
  const data = (trend ?? []).map((m) => ({ label: monthLabel(m.key), purchased: Number(m.purchased), expenses: Number(m.expenses), total: Number(m.total) }))
  const months = data.filter((d) => d.total > 0)
  const avg = months.length ? months.reduce((s, d) => s + d.total, 0) / months.length : 0
  const top = data.reduce((m, d) => (!m || d.total > m.total ? d : m), null)
  return (
    <Card icon={CalendarRange} title={t('Los últimos 12 meses')} hint={t('para ver la tendencia aunque mires una semana')}>
      {isLoading ? <Spinner /> : !months.length ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">{t('Todavía no hay compras ni gastos en el último año.')}</p>
      ) : (
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
            <span>{t('Promedio mensual')}: <b className="text-gray-900">{formatPrice(avg)}</b></span>
            {top && <span>{t('El mes que más')}: <b className="text-gray-900">{top.label}</b> ({formatPrice(top.total)})</span>}
            <span>{t('Meses con gasto')}: <b className="text-gray-900">{months.length}</b></span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tickFormatter={(v) => `${currencySymbol()} ${v}`} tick={{ fontSize: 11 }} width={70} />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
              <Bar dataKey="purchased" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} />
              <Bar dataKey="expenses" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

/** En qué productos se fue la plata del período (top 10 al costo). */
export function TopProductsCard({ byProduct, isLoading, total }) {
  const t = useT()
  const list = byProduct ?? []
  const max = list.length ? Math.max(...list.map((p) => Number(p.amount))) : 0
  return (
    <Card icon={Package} title={t('En qué productos se fue')} hint={t('lo recibido en el período, al costo')}>
      {isLoading ? <Spinner /> : !list.length ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">{t('Sin recepciones con costo en el período.')}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {list.map((p, i) => {
            const pct = Number(total) > 0 ? Math.round((Number(p.amount) / Number(total)) * 100) : 0
            return (
              <li key={p.productId} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                  <span className="block text-[11px] text-gray-400">
                    {formatQty(p.quantity)} {p.unit || t('unidad')} · {p.receipts} {t('recep.')}{pct > 0 && <> · {pct} % {t('del total')}</>}
                  </span>
                  <Bar_ value={Number(p.amount)} max={max} />
                </span>
                <span className="text-right text-sm font-bold text-gray-900">{formatPrice(p.amount)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/** Cómo se pagaron los otros gastos. */
export function PaymentMethodsCard({ byPaymentMethod, isLoading }) {
  const t = useT()
  const list = byPaymentMethod ?? []
  const max = list.length ? Math.max(...list.map((m) => Number(m.amount))) : 0
  const label = (key) => key === 'UNKNOWN' ? t('Sin indicar') : t(PAYMENT_METHODS.find((m) => m.key === key)?.label ?? key)
  return (
    <Card icon={CreditCard} tone="text-amber-600" title={t('Cómo pagaste los otros gastos')}>
      {isLoading ? <Spinner /> : !list.length ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">{t('Sin gastos en el período.')}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {list.map((m) => (
            <li key={m.method} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">{label(m.method)}</span>
                <span className="block text-[11px] text-gray-400">{m.count} {t('gastos')}</span>
                <Bar_ value={Number(m.amount)} max={max} cls="bg-amber-500" />
              </span>
              <span className="text-sm font-bold text-gray-900">{formatPrice(m.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/** Las compras de mercadería del período, una por una (la lista vivía solo en Stock). */
export function ReceiptsCard({ receipts, total, isLoading }) {
  const t = useT()
  const list = receipts ?? []
  const fmt = (iso) => new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short' }).format(new Date(iso))
  return (
    <Card icon={PackagePlus} tone="text-emerald-600" title={t('Compras de mercadería')} hint={t('las recepciones del período')}>
      {isLoading ? <Spinner /> : !list.length ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">{t('Sin recepciones en el período. Se registran en Stock › Recepciones.')}</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-100">
            {list.map((r) => (
              <li key={r.id}>
                <Link to={`/stock?tab=receipts&receipt=${r.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 sm:px-5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><PackagePlus size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">{r.supplierName}</span>
                    <span className="block text-[11px] text-gray-400">
                      {fmt(r.createdAt)}{r.referenceDocument && <> · <span className="font-mono">{r.referenceDocument}</span></>}
                      {r.costPending ? <> · <span className="font-semibold text-amber-700">{t('sin costo')}</span></>
                        : r.paymentMode && <> · {r.paymentMode === 'CREDIT' ? t('Crédito') : t('Contado')}</>}
                    </span>
                  </span>
                  {!r.costPending && <span className="text-sm font-bold text-gray-900">{formatPrice(r.returns?.length ? r.netAmount : r.totalAmount)}</span>}
                  <ArrowRight size={14} className="flex-shrink-0 text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
          {total > list.length && (
            <Link to="/stock?tab=receipts" className="flex items-center justify-center gap-1 border-t border-gray-100 px-4 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50">
              {t('Ver las {n} recepciones en Stock', { n: total })} <ArrowRight size={12} />
            </Link>
          )}
        </>
      )}
    </Card>
  )
}
