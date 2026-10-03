import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, AlertTriangle, Loader2, HandCoins, History } from 'lucide-react'
import { AccountsSwitcher, ReportHero, ReportHeader } from '../components/reports/ReportKit'
import { MoneyMovementsTable } from '../components/stock/MoneyMovements'
import DateRangeQuick from '../components/common/DateRangeQuick'
import { usePayables } from '../hooks/useReports'
import { useSupplierPaymentsSummary } from '../hooks/useMoneyMovements'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'
import { quickRange } from '../utils/dateRanges'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT, dateLocale } from '../i18n'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}

// Con deuda | Historial de pagos (William, 3-oct-2026: «las cuentas que ya pagué ya no salen»)
function ViewSwitch({ view, onChange, debtCount }) {
  const t = useT()
  const btn = (key, Icon, label) => (
    <button type="button" onClick={() => onChange(key)} aria-pressed={view === key}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
        view === key ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-gray-600 hover:bg-gray-100'}`}>
      <Icon size={16} /> {label}
    </button>
  )
  return (
    <div className="flex gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
      {btn('debt', HandCoins, `${t('Con deuda')}${debtCount != null ? ` (${debtCount})` : ''}`)}
      {btn('history', History, t('Historial de pagos'))}
    </div>
  )
}

export default function PayablesPage() {
  const t = useT()
  const navigate = useNavigate()
  const { user } = useAuth()
  const params = user?.role === 'SUPER_ADMIN' && user?.businessId
    ? { businessId: user.businessId }
    : undefined
  const [view, setView] = useState('debt')
  const [range, setRange] = useState(() => quickRange('month'))

  const { data, isLoading, isError } = usePayables(params)
  const rows  = data?.rows  ?? []
  const total = data?.totalPayable ?? 0
  const exceedsOf = (r) => r.creditLimitFromSupplier != null && Number(r.creditLimitFromSupplier) > 0 && Number(r.currentDebt) > Number(r.creditLimitFromSupplier)
  const overLimit = rows.filter(exceedsOf).length
  const oldest = rows.reduce((m, r) => Math.max(m, r.daysSinceLastPayment ?? 0), 0)
  const maxDebt = rows.reduce((m, r) => Math.max(m, Number(r.currentDebt)), 0)

  const { data: pagos, isLoading: pagosLoading } = useSupplierPaymentsSummary(
    { from: range.from, to: range.to, ...(params ?? {}) }, { enabled: view === 'history' })

  return (
    <div className="flex flex-col gap-5">

      <ReportHeader icon={HandCoins} title={t('Cuentas por pagar')}
        subtitle={t('Lo que le debes a tus proveedores por compras a crédito')}
        help={(
          <HelpDrawer title={t('Cómo usar Cuentas por pagar')} autoOpenKey="eazystock_payables_help_v3">
            <p>{t('Lo que le debes a tus proveedores, todo junto en un solo lugar.')}</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📥 {t('¿De dónde salen estas deudas?')}</p>
              <p className="mt-1">{t('De las recepciones de mercadería a crédito que registras en Stock. Cada compra a crédito suma acá.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">💵 {t('Registrar un pago')}</p>
              <p className="mt-1">{t('Haz click en el proveedor para ir a su detalle y registrar el pago (total o parcial, con su medio de pago). La deuda se actualiza al instante.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🕘 {t('Historial de pagos (pestaña de arriba)')}</p>
              <p className="mt-1">{t('Cuando terminas de pagarle a un proveedor sale de «Con deuda», pero nada se pierde: en «Historial de pagos» ves cada pago que hiciste, con fecha y hora, quién lo registró y el saldo que quedó, por período. Los mismos pagos también aparecen en Stock › Movimientos.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">⚖️ {t('Saldo y crédito')}</p>
              <p className="mt-1">{t('"Le debemos" es el saldo vivo por proveedor; "% Crédito" compara ese saldo con el límite que el proveedor te da (en rojo si lo excedes). "Último pago" y "Días" te avisan a quién le toca pagar primero. El total de arriba suma todos los saldos.')}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">🧾 {t('Cuenta corriente del proveedor')}</p>
              <p className="mt-1">{t('En el detalle ves cada cargo (recepción a crédito), pago y ajuste con el saldo que quedó después, para cuadrar con la factura del proveedor.')}</p>
            </div>
          </HelpDrawer>
        )} />

      <AccountsSwitcher />

      <ViewSwitch view={view} onChange={setView} debtCount={isLoading ? null : rows.length} />

      {view === 'history' ? (
        <>
          <ReportHero icon={HandCoins} label={t('Pagado a proveedores en el período')} loading={pagosLoading}
            value={formatPrice(pagos?.total ?? 0)}
            sub={<span>{t('Cada pago que hiciste, con quién lo registró y el saldo que quedó. Toca el proveedor para ver toda su cuenta.')}</span>}
            cells={[
              [t('Pagos'), pagos?.count ?? 0],
              [t('Proveedores pagados'), pagos?.counterparties ?? 0],
              [t('Promedio por pago'), pagos?.count ? formatPrice(Number(pagos.total) / pagos.count) : '—'],
            ]} />
          <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <DateRangeQuick from={range.from} to={range.to} onChange={setRange} />
          </div>
          <MoneyMovementsTable kind="PAGO" from={range.from} to={range.to} />
        </>
      ) : (
        <>
      <ReportHero icon={HandCoins} label={t('Total por pagar')} loading={isLoading}
        value={formatPrice(total)}
        sub={<span>{t('Toca un proveedor para ver su cuenta y registrar el pago.')}</span>}
        cells={[
          [t('Proveedores a los que debes'), rows.length],
          [t('Exceden su crédito'), overLimit, overLimit > 0 ? 'text-amber-200' : ''],
          [t('Días de la más antigua'), oldest ? `${oldest}${t('d')}` : '—'],
        ]} />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="md:hidden">
          {isLoading ? (
            <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50"><Truck size={24} className="text-emerald-500" /></div>
              <p className="text-sm font-semibold text-gray-700">{t('No tenés deudas pendientes con proveedores')}</p>
              <button type="button" onClick={() => setView('history')} className="text-xs font-semibold text-blue-600 hover:underline">{t('Ver el historial de pagos')}</button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((r) => (
                <li key={r.supplierId}>
                  <button type="button" onClick={() => navigate(`/suppliers/${r.supplierId}`)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-blue-50/40">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Truck size={17} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-gray-900">{r.name}</span>
                      <span className="block text-xs text-gray-400">
                        {r.daysSinceLastPayment != null ? t('{n} días sin pagar', { n: r.daysSinceLastPayment }) : t('Aún sin pagos')}
                        {exceedsOf(r) && <span className="ml-1.5 font-semibold text-red-600">· {t('Excede crédito')}</span>}
                      </span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <span className={`block h-full rounded-full ${exceedsOf(r) ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{ width: `${maxDebt > 0 ? Math.max(4, (Number(r.currentDebt) / maxDebt) * 100) : 0}%` }} />
                      </span>
                    </span>
                    <span className="flex-shrink-0 text-base font-bold text-gray-900">{formatPrice(r.currentDebt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Proveedor')}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('RUC')}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Teléfono')}</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Le debemos')}</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('% Crédito')}</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Último pago')}</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Días')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : isError ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-red-500">{t('No pudimos cargar el reporte.')}</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                        <Truck size={28} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{t('No tenés deudas pendientes con proveedores')}</p>
                      <button type="button" onClick={() => setView('history')} className="text-xs font-semibold text-blue-600 hover:underline">{t('Ver el historial de pagos')}</button>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const exceeds = r.creditLimitFromSupplier != null && Number(r.currentDebt) > Number(r.creditLimitFromSupplier)
                  return (
                    <tr key={r.supplierId}
                      onClick={() => navigate(`/suppliers/${r.supplierId}`)}
                      className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40">
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{r.name}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{r.ruc || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-600">{r.phone || '—'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-bold text-gray-900">{formatPrice(r.currentDebt)}</span>
                        <div className="ml-auto mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                          <div className={`h-full rounded-full ${exceeds ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${maxDebt > 0 ? Math.max(4, (Number(r.currentDebt) / maxDebt) * 100) : 0}%` }} />
                        </div>
                      </td>
                      <td className={`px-5 py-3.5 text-right font-semibold ${exceeds ? 'text-red-600' : 'text-gray-700'}`}>
                        {r.limitUsagePercent != null ? `${Number(r.limitUsagePercent).toFixed(0)}%` : '—'}
                        {exceeds && <AlertTriangle size={11} className="ml-1 inline" />}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-gray-500">{formatDate(r.lastPayment)}</td>
                      <td className="px-5 py-3.5 text-right text-xs text-gray-500">{r.daysSinceLastPayment != null ? `${r.daysSinceLastPayment}${t('d')}` : '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
