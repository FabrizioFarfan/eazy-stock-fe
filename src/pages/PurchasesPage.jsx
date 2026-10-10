import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Loader2, Truck, Receipt, Plus, Pencil, Trash2, TrendingUp, TrendingDown, HandCoins } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { usePurchasesReport } from '../hooks/useReports'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses'
import HelpDrawer from '../components/common/HelpDrawer'
import DateRangeQuick from '../components/common/DateRangeQuick'
import { ReportsSwitcher, ReportHero, ReportHeader, NewButton } from '../components/reports/ReportKit'
import PurchasesChart from '../components/reports/PurchasesChart'
import ExpenseModal from '../components/reports/ExpenseModal'
import { categoryOf, PAYMENT_METHODS } from '../utils/expenseKinds'
import { formatPrice } from '../utils/formatMoney'
import { quickRange } from '../utils/dateRanges'
import { useT, dateLocale } from '../i18n'

/**
 * Compras y gastos (William, 10-oct-2026): «colocar los gastos de compra para
 * calcular bien cuánto se ha gastado por día, semana, mes y año; su facturación
 * en compras hacia los proveedores». Suma la mercadería recibida (recepciones
 * de Stock, al costo) y los otros gastos que el dueño registra aquí. Solo dueño.
 */

const GROUPS = [
  { key: '',      label: 'Automático' },
  { key: 'DAY',   label: 'Por día' },
  { key: 'WEEK',  label: 'Por semana' },
  { key: 'MONTH', label: 'Por mes' },
  { key: 'YEAR',  label: 'Por año' },
]

const thCls = 'px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400'

function fmtDay(iso, opts = { day: 'numeric', month: 'short' }) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(dateLocale(), opts).format(new Date(iso + 'T12:00:00'))
}

function Bar({ value, max, cls = 'bg-blue-600' }) {
  const pct = max > 0 ? Math.max(3, (value / max) * 100) : 0
  return <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} /></div>
}

function Delta({ now, before }) {
  const t = useT()
  const n = Number(now), b = Number(before)
  if (!(b > 0)) return <span>{t('sin período anterior para comparar')}</span>
  const pct = Math.round(((n - b) / b) * 100)
  const up = pct > 0
  return (
    <span className="inline-flex items-center gap-1">
      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      <b className="text-white">{up ? '+' : ''}{pct}%</b> {t('vs. el período anterior')} ({formatPrice(b)})
    </span>
  )
}

export default function PurchasesPage() {
  const t = useT()
  const { user } = useAuth()
  const [range, setRange] = useState(() => quickRange('month'))
  const [groupBy, setGroupBy] = useState('')
  const [modal, setModal] = useState(null)        // null | 'new' | expense
  const [confirmId, setConfirmId] = useState(null)

  const biz = useMemo(() => (user?.role === 'SUPER_ADMIN' && user?.businessId ? { businessId: user.businessId } : {}), [user])
  const params = useMemo(() => ({ from: range.from, to: range.to, ...(groupBy ? { groupBy } : {}), ...biz }), [range, groupBy, biz])
  const { data, isLoading, isError } = usePurchasesReport(params)
  const { data: expenses, isLoading: loadingExpenses } = useExpenses({ from: range.from, to: range.to, ...biz })
  const create = useCreateExpense(), update = useUpdateExpense(), remove = useDeleteExpense()

  const group = data?.groupBy ?? 'DAY'
  const labelOf = (b) => {
    if (group === 'YEAR') return b.key
    if (group === 'MONTH') return fmtDay(b.start, { month: 'short', year: '2-digit' })
    if (group === 'WEEK') return `${fmtDay(b.start)} – ${fmtDay(b.end)}`
    return fmtDay(b.start)
  }
  const groupWord = { DAY: t('día'), WEEK: t('semana'), MONTH: t('mes'), YEAR: t('año') }[group]
  const buckets = data?.buckets ?? []
  const maxBucket = buckets.length ? Math.max(...buckets.map((b) => Number(b.total))) : 0
  const topBucket = buckets.reduce((m, b) => (!m || Number(b.total) > Number(m.total) ? b : m), null)
  const activeBuckets = buckets.filter((b) => Number(b.total) > 0).length
  const avg = activeBuckets ? Number(data?.total ?? 0) / activeBuckets : 0
  const maxSup = data?.bySupplier?.length ? Math.max(...data.bySupplier.map((s) => Number(s.purchased) + Number(s.expenses))) : 0
  const maxCat = data?.byCategory?.length ? Math.max(...data.byCategory.map((c) => Number(c.amount))) : 0

  const submitExpense = (body) => {
    const payload = { ...body, ...biz }
    const done = (msg) => { toast.success(t(msg)); setModal(null) }
    const fail = (e) => toast.error(e?.response?.data?.message ?? t('No se pudo guardar el gasto'))
    if (modal === 'new') create.mutate(payload, { onSuccess: () => done('Gasto registrado'), onError: fail })
    else update.mutate({ id: modal.id, data: payload }, { onSuccess: () => done('Gasto corregido'), onError: fail })
  }
  const deleteExpense = (id) => remove.mutate({ id, params: biz }, {
    onSuccess: () => { toast.success(t('Gasto borrado')); setConfirmId(null) },
    onError: (e) => toast.error(e?.response?.data?.message ?? t('No se pudo borrar el gasto')),
  })

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader icon={ShoppingBag} title={t('Compras y gastos')}
        subtitle={t('Cuánto se fue en mercadería y en otros gastos: por día, semana, mes o año.')}
        right={<NewButton onClick={() => setModal('new')}><Plus size={16} /> {t('Registrar gasto')}</NewButton>}
        help={(
          <HelpDrawer title={t('Cómo usar Compras y gastos')} autoOpenKey="eazystock_purchases_help_v1">
            <p>{t('Responde')} <strong>{t('cuánto gastaste en total, en qué se fue y a quién le pagaste')}</strong>, {t('en el período que elijas. Es tu facturación en compras hacia los proveedores, más lo que gastas para que el negocio funcione.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📦 {t('Mercadería')}</p>
              <p className="mt-1">{t('Sale sola de las recepciones que registras en Stock (al costo). No tienes que anotarla dos veces. Si entró al crédito también cuenta: es compra aunque todavía la debas; abajo ves aparte lo que de verdad pagaste a proveedores en el período.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🧾 {t('Otros gastos')}</p>
              <p className="mt-1">{t('Alquiler, luz, flete, sueldos, impuestos, bolsas… Tócalos en «Registrar gasto»: cuánto, qué fue, de qué tipo y qué día. Si fue a un proveedor, elígelo y le cuenta en su ranking. Se pueden corregir y borrar.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📅 {t('Por día, semana, mes o año')}</p>
              <p className="mt-1">{t('Elige el período arriba (hoy, esta semana, este mes, este año o fechas a tu gusto) y cómo partirlo. En «Automático» la app elige el tramo que mejor se lee: días para un mes, semanas para un trimestre, meses para un año. Arriba comparas con el período anterior del mismo largo.')}</p>
            </div>
          </HelpDrawer>
        )} />

      <ReportsSwitcher />

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
        <DateRangeQuick from={range.from} to={range.to} onChange={setRange} />
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('Partir en')}</span>
          {GROUPS.map((g) => (
            <button key={g.key} type="button" onClick={() => setGroupBy(g.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                groupBy === g.key ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
              {t(g.label)}{g.key === '' && data ? ` (${groupWord})` : ''}
            </button>
          ))}
        </div>
      </div>

      <ReportHero icon={ShoppingBag} label={t('Gastado en el período')} loading={isLoading}
        value={formatPrice(data?.total ?? 0)}
        sub={data && (
          <span>
            <Delta now={data.total} before={data.previousTotal} />
            {topBucket && Number(topBucket.total) > 0 && <> · {t('el {g} que más', { g: groupWord })}{': '}<b className="text-white">{labelOf(topBucket)}</b> ({formatPrice(topBucket.total)})</>}
            {activeBuckets > 1 && <> · {t('promedio por {g} con gasto', { g: groupWord })}: <b className="text-white">{formatPrice(avg)}</b></>}
          </span>
        )}
        cells={[
          [t('Mercadería (recepciones)'), formatPrice(data?.totalPurchased ?? 0)],
          [t('Otros gastos'), formatPrice(data?.totalExpenses ?? 0), Number(data?.totalExpenses) > 0 ? 'text-amber-200' : ''],
          [t('Pagado a proveedores'), formatPrice(data?.paidToSuppliers ?? 0)],
          [t('Entró al crédito'), formatPrice(data?.creditPurchased ?? 0)],
        ]} />

      <PurchasesChart buckets={buckets} labelOf={labelOf} isLoading={isLoading} />

      {/* Tabla por tramo */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <Receipt size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">{t('Tramo a tramo')}</h3>
          <span className="text-xs text-gray-400">· {t('por {g}', { g: groupWord })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/60">
              <th className={`${thCls} text-left`}>{t('Tramo')}</th>
              <th className={`${thCls} text-right`}>{t('Mercadería')}</th>
              <th className={`${thCls} text-right`}>{t('Otros gastos')}</th>
              <th className={`${thCls} text-right`}>{t('Total')}</th>
            </tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : isError ? (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-red-500">{t('No pudimos cargar el reporte.')}</td></tr>
              ) : buckets.filter((b) => Number(b.total) > 0).length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-sm font-semibold text-gray-600">{t('Sin compras ni gastos en el período')}</td></tr>
              ) : buckets.filter((b) => Number(b.total) > 0).map((b) => (
                <tr key={b.key} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{labelOf(b)}</p>
                    <p className="text-[11px] text-gray-400">{b.receipts} {t('recep.')} · {b.expensesCount} {t('gastos')}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800">{formatPrice(b.purchased)}</td>
                  <td className={`px-4 py-3 text-right ${Number(b.expenses) > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{formatPrice(b.expenses)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-gray-900">{formatPrice(b.total)}</span>
                    <div className="ml-auto w-24"><Bar value={Number(b.total)} max={maxBucket} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
            {!isLoading && !isError && Number(data?.total) > 0 && (
              <tfoot><tr className="bg-gray-50/60 font-bold text-gray-900">
                <td className="px-4 py-3">{t('Total del período')}</td>
                <td className="px-4 py-3 text-right">{formatPrice(data.totalPurchased)}</td>
                <td className="px-4 py-3 text-right">{formatPrice(data.totalExpenses)}</td>
                <td className="px-4 py-3 text-right">{formatPrice(data.total)}</td>
              </tr></tfoot>
            )}
          </table>
        </div>
      </div>

      {/* A quién se le fue + en qué tipo */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3.5 sm:px-5">
            <Truck size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">{t('A quién le compraste')}</h3>
          </div>
          {isLoading ? <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></div>
          : !data?.bySupplier?.length ? <p className="px-5 py-10 text-center text-sm text-gray-500">{t('Ninguna recepción ni gasto con proveedor en el período')}</p>
          : (
            <ul className="divide-y divide-gray-100">
              {data.bySupplier.map((s, i) => {
                const total = Number(s.purchased) + Number(s.expenses)
                return (
                  <li key={s.supplierId} className="px-4 py-3 sm:px-5">
                    <Link to={`/suppliers/${s.supplierId}`} className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${i === 0 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-900">{s.name}</span>
                        <span className="block text-[11px] text-gray-400">{s.receipts} {t('recep.')}{Number(s.expenses) > 0 && <> · {t('gastos')}: {formatPrice(s.expenses)}</>}</span>
                        <Bar value={total} max={maxSup} />
                      </span>
                      <span className="text-right text-sm font-bold text-gray-900">{formatPrice(total)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3.5 sm:px-5">
            <HandCoins size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-gray-900">{t('Otros gastos, por tipo')}</h3>
          </div>
          {isLoading ? <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></div>
          : !data?.byCategory?.length ? (
            <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <p className="text-sm text-gray-500">{t('Todavía no registraste gastos en este período.')}</p>
              <button type="button" onClick={() => setModal('new')} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-600">{t('Registrar el primero')}</button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.byCategory.map((c) => { const cat = categoryOf(c.category); return (
                <li key={c.category} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">{t(cat.label)}</span>
                    <span className="block text-[11px] text-gray-400">{c.count} {t('gastos')}</span>
                    <Bar value={Number(c.amount)} max={maxCat} cls="bg-amber-500" />
                  </span>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(c.amount)}</span>
                </li>
              ) })}
            </ul>
          )}
        </div>
      </div>

      {/* Lista de gastos del período */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <Receipt size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-gray-900">{t('Gastos registrados')}</h3>
            <span className="text-xs text-gray-400">· {expenses?.length ?? 0}</span>
          </div>
          <button type="button" onClick={() => setModal('new')} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Plus size={14} /> {t('Registrar gasto')}</button>
        </div>
        {loadingExpenses ? <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></div>
        : !expenses?.length ? <p className="px-5 py-10 text-center text-sm text-gray-500">{t('Ningún gasto en este período. Las compras de mercadería se registran en Stock › Recepciones.')}</p>
        : (
          <ul className="divide-y divide-gray-100">
            {expenses.map((e) => { const cat = categoryOf(e.category); const method = PAYMENT_METHODS.find((m) => m.key === e.paymentMethod); return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg">{cat.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">{e.concept}</span>
                  <span className="block text-[11px] text-gray-400">
                    {fmtDay(e.day, { day: 'numeric', month: 'short', year: 'numeric' })} · {t(cat.label)}
                    {e.supplierName && <> · {e.supplierName}</>}{method && <> · {t(method.label)}</>}
                    {e.registeredByName && <> · {e.registeredByName}</>}
                  </span>
                  {e.notes && <span className="block truncate text-[11px] text-gray-500">{e.notes}</span>}
                </span>
                <span className="text-sm font-bold text-gray-900">{formatPrice(e.amount)}</span>
                {confirmId === e.id ? (
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={() => deleteExpense(e.id)} disabled={remove.isPending} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white">{t('Borrar')}</button>
                    <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500">{t('No')}</button>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={() => setModal(e)} aria-label={t('Corregir')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
                    <button type="button" onClick={() => setConfirmId(e.id)} aria-label={t('Borrar')} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                  </span>
                )}
              </li>
            ) })}
          </ul>
        )}
      </div>

      {modal && (
        <ExpenseModal expense={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSubmit={submitExpense}
          submitting={create.isPending || update.isPending} />
      )}
    </div>
  )
}
