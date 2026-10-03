import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, AlertTriangle, Loader2, MessageCircle, Wallet, HandCoins, History } from 'lucide-react'
import { AccountsSwitcher, ReportHero, ReportHeader } from '../components/reports/ReportKit'
import { MoneyMovementsTable } from '../components/stock/MoneyMovements'
import DateRangeQuick from '../components/common/DateRangeQuick'
import CustomerPicker from '../components/customers/CustomerPicker'
import HelpDrawer from '../components/common/HelpDrawer'
import { useReceivables } from '../hooks/useReports'
import { useCustomerPaymentsSummary } from '../hooks/useMoneyMovements'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'
import { waPhone, reminderMessage } from '../utils/debtReminder'
import { quickRange } from '../utils/dateRanges'
import { useT, dateLocale } from '../i18n'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}

function HelpBlock({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function ReceivablesHelp() {
  const t = useT()
  return (
    <>
      <p>
        {t('Aquí ves a')}{' '}
        <span className="font-semibold">{t('todos los clientes que te deben dinero')}</span>{' '}
        {t('(por ventas al fiado), cuánto debe cada uno y hace cuánto no paga.')}
      </p>
      <HelpBlock title={t('Cómo leer la tabla')}>
        <p>
          {t('Deuda es el saldo pendiente. «% Límite» compara la deuda con el límite de fiado que le pusiste al cliente: si pasa del 100% se pinta en rojo con una alerta. «Días» cuenta cuántos días lleva sin pagar desde su último abono.')}
        </p>
      </HelpBlock>
      <HelpBlock title={t('Historial de cobros (pestaña de arriba)')}>
        <p>
          {t('Cuando un cliente termina de pagar sale de la lista «Con deuda», pero nada se pierde: en «Historial de cobros» ves cada pago que recibiste, con fecha y hora, quién lo registró y el saldo que quedó. Elige el período (hoy, esta semana, este mes…) y arriba tienes el total cobrado. Los mismos cobros también aparecen en Stock › Movimientos.')}
        </p>
      </HelpBlock>
      <HelpBlock title={t('Cobrar por WhatsApp (botón verde)')}>
        <p>
          {t('En la columna «Recordar», toca el botón verde del cliente: se abre WhatsApp con un recordatorio cordial ya escrito con su nombre y su deuda. Solo revisas y envías. Si en vez del botón ves un guion, es porque ese cliente no tiene teléfono guardado — agrégaselo desde la página Clientes.')}
        </p>
      </HelpBlock>
      <HelpBlock title={t('Estado de cuenta en PDF')}>
        <p>
          {t('Toca la fila del cliente para entrar a su ficha. Ahí está el botón «PDF de deuda»: genera una carta con el detalle de todo lo que compró al fiado (producto por producto), los pagos que ya hizo y el saldo pendiente. Ese documento es para imprimirlo o mandárselo al cliente por WhatsApp o correo.')}
        </p>
      </HelpBlock>
      <HelpBlock title={t('Cuando el cliente paga')}>
        <p>
          {t('Entra a su ficha y usa «Registrar pago» — la deuda baja automáticamente y el cliente sale de esta lista cuando llega a cero.')}
        </p>
      </HelpBlock>
    </>
  )
}

// Con deuda | Historial de cobros (William, 3-oct-2026: «¿dónde veo lo que ya me pagaron?»)
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
      {btn('debt', Wallet, `${t('Con deuda')}${debtCount != null ? ` (${debtCount})` : ''}`)}
      {btn('history', History, t('Historial de cobros'))}
    </div>
  )
}

export default function ReceivablesPage() {
  const t = useT()
  const navigate = useNavigate()
  const { user } = useAuth()
  const params = user?.role === 'SUPER_ADMIN' && user?.businessId
    ? { businessId: user.businessId }
    : undefined
  const [view, setView] = useState('debt')
  const [range, setRange] = useState(() => quickRange('month'))
  const [customer, setCustomer] = useState(null)   // filtro del historial (Frank, 3-oct)

  const { data, isLoading, isError } = useReceivables(params)
  const rows  = data?.rows  ?? []
  const total = data?.totalReceivable ?? 0
  const exceedsOf = (r) => r.creditLimit != null && Number(r.creditLimit) > 0 && Number(r.currentDebt) > Number(r.creditLimit)
  const overLimit = rows.filter(exceedsOf).length
  const stale = rows.filter((r) => r.daysSinceLastPayment == null || r.daysSinceLastPayment > 30).length
  const maxDebt = rows.reduce((m, r) => Math.max(m, Number(r.currentDebt)), 0)

  const { data: cobros, isLoading: cobrosLoading } = useCustomerPaymentsSummary(
    { from: range.from, to: range.to, ...(customer && { customerId: customer.id }), ...(params ?? {}) }, { enabled: view === 'history' })

  return (
    <div className="flex flex-col gap-5">

      <ReportHeader icon={Wallet} title={t('Cuentas por cobrar')}
        subtitle={t('Lo que tus clientes te deben por ventas al fiado')}
        help={(
          <HelpDrawer title={t('Cómo cobrar a tus clientes')} autoOpenKey="eazystock_receivables_help_v3">
            <ReceivablesHelp />
          </HelpDrawer>
        )} />

      <AccountsSwitcher />

      <ViewSwitch view={view} onChange={setView} debtCount={isLoading ? null : rows.length} />

      {view === 'history' ? (
        <>
          <ReportHero icon={HandCoins} label={t('Cobrado en el período')} loading={cobrosLoading}
            value={formatPrice(cobros?.total ?? 0)}
            sub={<span>{t('Cada pago de fiado que recibiste, con quién lo registró y el saldo que quedó. Toca el cliente para ver toda su cuenta.')}</span>}
            cells={[
              [t('Cobros'), cobros?.count ?? 0],
              [t('Clientes que pagaron'), cobros?.counterparties ?? 0],
              [t('Promedio por cobro'), cobros?.count ? formatPrice(Number(cobros.total) / cobros.count) : '—'],
            ]} />
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <DateRangeQuick from={range.from} to={range.to} onChange={setRange} />
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{t('Filtrar por cliente')}</p>
              <CustomerPicker value={customer} onSelect={setCustomer} showDebt />
            </div>
          </div>
          <MoneyMovementsTable kind="COBRO" from={range.from} to={range.to} counterpartyId={customer?.id ?? null} />
        </>
      ) : (
        <>
      <ReportHero icon={Wallet} label={t('Total por cobrar')} loading={isLoading}
        value={formatPrice(total)}
        sub={<span>{t('Toca un cliente para ver su ficha, registrar pagos y descargar el')} <b className="text-white">{t('PDF con el detalle de su deuda')}</b> {t('para enviárselo.')}</span>}
        cells={[
          [t('Clientes que deben'), rows.length],
          [t('Exceden su límite'), overLimit, overLimit > 0 ? 'text-amber-200' : ''],
          [t('Sin pagar hace +30 días'), stale, stale > 0 ? 'text-amber-200' : ''],
        ]} />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="md:hidden">
          {isLoading ? (
            <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></div>
          ) : rows.length === 0 ? (
            <p className="px-5 py-14 text-center text-sm font-semibold text-gray-600">{t('Ningún cliente tiene deuda pendiente')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((r) => {
                const phone = waPhone(r.phone)
                return (
                  <li key={r.customerId} className="flex items-center gap-3 px-4 py-3.5">
                    <button type="button" onClick={() => navigate(`/customers/${r.customerId}`)} className="min-w-0 flex-1 text-left">
                      <p className="break-words text-sm font-semibold text-gray-900">{r.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {r.daysSinceLastPayment != null ? t('{n} días sin pagar', { n: r.daysSinceLastPayment }) : t('Aún no paga')}
                        {exceedsOf(r) && <span className="ml-1.5 font-semibold text-red-600">· {t('Excede límite')}</span>}
                      </p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${exceedsOf(r) ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{ width: `${maxDebt > 0 ? Math.max(4, (Number(r.currentDebt) / maxDebt) * 100) : 0}%` }} />
                      </div>
                    </button>
                    <span className="flex-shrink-0 text-base font-bold text-gray-900">{formatPrice(r.currentDebt)}</span>
                    {phone && (
                      <a href={`https://wa.me/${phone}?text=${encodeURIComponent(reminderMessage(user?.businessName, r.name, r.currentDebt))}`}
                        target="_blank" rel="noopener noreferrer"
                        title={t('Enviar recordatorio de deuda por WhatsApp a {name}', { name: r.name })}
                        className="flex-shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-600 hover:bg-emerald-100">
                        <MessageCircle size={17} />
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Cliente')}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Documento')}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Teléfono')}</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Deuda')}</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('% Límite')}</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Último pago')}</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Días')}</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">{t('Recordar')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : isError ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-red-500">{t('No pudimos cargar el reporte.')}</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                        <Users size={28} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{t('Ningún cliente tiene deuda pendiente')}</p>
                      <button type="button" onClick={() => setView('history')} className="text-xs font-semibold text-blue-600 hover:underline">{t('Ver el historial de cobros')}</button>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const exceeds = r.creditLimit != null && Number(r.currentDebt) > Number(r.creditLimit)
                  const phone = waPhone(r.phone)
                  return (
                    <tr key={r.customerId}
                      onClick={() => navigate(`/customers/${r.customerId}`)}
                      className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40">
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{r.name}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{r.documentId || '—'}</td>
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
                      <td className="px-5 py-3.5 text-right text-xs text-gray-500">{r.daysSinceLastPayment != null ? `${r.daysSinceLastPayment}d` : '—'}</td>
                      <td className="px-5 py-3.5 text-center">
                        {phone ? (
                          <a
                            href={`https://wa.me/${phone}?text=${encodeURIComponent(reminderMessage(user?.businessName, r.name, r.currentDebt))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={t('Enviar recordatorio de deuda por WhatsApp a {name}', { name: r.name })}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <MessageCircle size={15} />
                          </a>
                        ) : (
                          <span title={t('El cliente no tiene teléfono registrado')} className="text-xs text-gray-300">—</span>
                        )}
                      </td>
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
