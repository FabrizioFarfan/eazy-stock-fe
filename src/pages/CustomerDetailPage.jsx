import { formatPhoneDisplay } from '../utils/phone'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Edit, DollarSign, Sliders, Loader2,
  TrendingUp, TrendingDown, AlertTriangle, FileText, Phone, Mail, MapPin,
  FileDown, MessageCircle, FilePlus2, CheckCircle2,
  ShoppingBag, Star, Clock, Repeat, Wallet, ShoppingCart,
} from 'lucide-react'
import {
  useCustomer, useCustomerTransactions,
  useRegisterCustomerPayment, useAdjustCustomerDebt,
  useCustomerSales, useCustomerSummary,
} from '../hooks/useCustomers'
import { formatQty } from '../utils/quantity'
import { useQuoteSearch } from '../hooks/useQuotes'
import { customersApi } from '../services/endpoints/customers'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'
import { downloadDebtStatementPdf } from '../utils/debtStatementPdf'
import { reminderWhatsAppUrl } from '../utils/debtReminder'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import PaymentModal from '../components/accounts/PaymentModal'
import AdjustmentModal from '../components/accounts/AdjustmentModal'
import SaleDetailModal from '../components/reports/SaleDetailModal'
import QuoteDetailModal from '../components/quotes/QuoteDetailModal'
import LoadMoreRow from '../components/common/LoadMoreRow'
import HelpDrawer from '../components/common/HelpDrawer'
import { useT, dateLocale } from '../i18n'

function HelpBlock({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function CustomerHelp() {
  const t = useT()
  return (
    <>
      <p>
        {t('Esta es la ficha del cliente: su deuda actual, su historial completo y las herramientas para cobrarle con delicadeza.')}
      </p>
      <HelpBlock title={t('Compras y lo que más lleva')}>
        <p>
          {t('Si asocias al cliente en cada venta (es opcional, un botón en Nueva venta), aquí ves cuánto te compró, cada cuánto vuelve, su ticket promedio, la última vez que vino y los productos que más lleva. Las ventas viejas se le pueden asociar desde su detalle.')}
        </p>
      </HelpBlock>
      <HelpBlock title={t('PDF de deuda (para entregar al cliente)')}>
        <p>
          {t('El botón "PDF de deuda" genera una carta cordial a nombre del cliente con el detalle de sus compras al fiado — producto por producto —, los pagos que ya hizo y el saldo pendiente. Descárgalo y mándaselo por WhatsApp o correo, o imprímelo y entrégaselo en mano.')}
        </p>
      </HelpBlock>
      <HelpBlock title={t('Recordatorio por WhatsApp')}>
        <p>
          {t('El botón verde "WhatsApp" abre el chat del cliente con un mensaje de recordatorio ya escrito. Puedes mandar primero el mensaje y adjuntar después el PDF en el mismo chat. Aparece solo si el cliente tiene teléfono guardado.')}
        </p>
      </HelpBlock>
      <HelpBlock title={t('Cuando te pague')}>
        <p>
          {t('Usa "Registrar pago" con el monto recibido: la deuda baja al instante y queda asentado en el historial de abajo.')}
        </p>
      </HelpBlock>
      <HelpBlock title={t('Ajustes y límite de crédito')}>
        <p>
          {t('"Ajustar deuda" sube o baja el saldo a mano (con un motivo obligatorio que queda en el historial). Con "Editar" cambias el límite de crédito: si la deuda lo supera verás la etiqueta "Excede límite" y no se le podrá fiar más.')}
        </p>
      </HelpBlock>
    </>
  )
}

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

function formatDay(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}

function daysAgoLabel(days, t) {
  if (days == null) return ''
  if (days === 0) return t('hoy')
  if (days === 1) return t('ayer')
  return t('hace {n} días', { n: days })
}

// ── Compras del cliente (tarea 250) ──────────────────────────────────────────
// La memoria comercial: cuánto nos compró, cada cuánto vuelve, qué es lo que
// más lleva y la lista de todas sus ventas (contado y fiado). Todo se calcula
// desde las ventas que llevan su nombre; las que no lo llevan se pueden
// asociar desde el detalle de la venta.

function PurchaseStat({ icon: Icon, label, value, hint, tone = 'bg-blue-50 text-blue-600' }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="truncate text-lg font-bold text-gray-900">{value}</p>
        {hint && <p className="truncate text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  )
}

function PurchasesSection({ customerId, onOpenSale }) {
  const t = useT()
  const { data: summary, isLoading: loadingSummary } = useCustomerSummary(customerId)
  const sales = useCustomerSales(customerId)

  const count = summary?.salesCount ?? 0
  const hasPurchases = count > 0
  const freq = summary?.purchasesPerMonth != null ? Number(summary.purchasesPerMonth) : null
  const gap  = summary?.avgDaysBetweenPurchases != null ? Number(summary.avgDaysBetweenPurchases) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <ShoppingBag size={15} className="text-blue-600" />
          {t('Compras')}
          {!loadingSummary && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{count}</span>
          )}
        </h3>
        {hasPurchases && (freq != null || gap != null) && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Repeat size={12} className="text-gray-400" />
            {freq != null && t('Compra ~{n} veces al mes', { n: freq })}
            {freq != null && gap != null && ' · '}
            {gap != null && t('cada ~{n} días', { n: gap })}
          </p>
        )}
      </div>

      {loadingSummary ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : !hasPurchases ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-gray-600">{t('Todavía no hay ventas a nombre de este cliente')}</p>
          <p className="mt-1 text-xs text-gray-400">
            {t('Asócialo al cobrar en Nueva venta, o desde el detalle de una venta pasada con «Asociar cliente».')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <PurchaseStat icon={Wallet} label={t('Total comprado')} value={formatPrice(summary.netSpent)}
              hint={Number(summary.returnedAmount) > 0 ? t('{amount} devueltos', { amount: formatPrice(summary.returnedAmount) }) : undefined}
              tone="bg-emerald-50 text-emerald-600" />
            <PurchaseStat icon={ShoppingCart} label={t('Compras')} value={count}
              hint={summary.creditSalesCount > 0 ? t('{n} al fiado', { n: summary.creditSalesCount }) : t('todas al contado')} />
            <PurchaseStat icon={Star} label={t('Ticket promedio')} value={formatPrice(summary.avgTicket)}
              tone="bg-amber-50 text-amber-600" />
            <PurchaseStat icon={Clock} label={t('Última compra')} value={daysAgoLabel(summary.daysSinceLastPurchase, t)}
              hint={formatDay(summary.lastPurchaseAt)}
              tone={summary.daysSinceLastPurchase > 60 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'} />
          </div>

          {summary.topProducts?.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Star size={14} className="text-amber-500" /> {t('Lo que más compra')}
              </h4>
              <ul className="divide-y divide-gray-100">
                {summary.topProducts.map((p, i) => (
                  <li key={p.productId} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatQty(p.quantity)} {p.unit || ''} · {t('{n} veces', { n: p.timesBought })} · {t('última')} {formatDay(p.lastBoughtAt)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-semibold text-gray-900">{formatPrice(p.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Lista de compras */}
      {hasPurchases && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h4 className="mb-3 text-sm font-bold text-gray-900">{t('Historial de compras')}</h4>
          {sales.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {sales.items.map((sale) => {
                  const returnedAll = Number(sale.returnedAmount) > 0 && Number(sale.returnedAmount) >= Number(sale.total)
                  return (
                    <li key={sale.id}>
                      <button type="button" onClick={() => onOpenSale(sale.id)}
                        className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-gray-50">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <ShoppingCart size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {(sale.items ?? []).slice(0, 2).map((i) => i.productName).join(', ')}
                              {(sale.items?.length ?? 0) > 2 && <span className="text-gray-400"> +{sale.items.length - 2}</span>}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(sale.createdAt)} · {t('{n} producto(s)', { n: sale.items?.length ?? 0 })} · {sale.employeeName}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {sale.onCredit && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">{t('Fiado')}</span>
                          )}
                          {!sale.onCredit && sale.paymentMethod && (
                            <span className="hidden rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:inline">{sale.paymentMethod}</span>
                          )}
                          {Number(sale.returnedAmount) > 0 && (
                            <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                              {returnedAll ? t('Devuelto') : t('Dev. parcial')}
                            </span>
                          )}
                          <span className={`whitespace-nowrap font-bold text-gray-900 ${returnedAll ? 'line-through text-gray-400' : ''}`}>{formatPrice(sale.total)}</span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <LoadMoreRow search={sales} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

const TYPE_CONFIG = {
  DEBT_ADD:   { label: 'Cargo',   cls: 'bg-red-50 text-red-700 ring-red-100',         icon: TrendingUp,   sign: '+' },
  PAYMENT:    { label: 'Pago',    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-100', icon: TrendingDown, sign: '−' },
  ADJUSTMENT: { label: 'Ajuste',  cls: 'bg-amber-50 text-amber-700 ring-amber-100',   icon: Sliders,      sign: '±' },
}

function StatCard({ label, value, tone = 'default' }) {
  const toneCls = tone === 'danger'
    ? 'bg-red-50 text-red-700 ring-red-100'
    : tone === 'positive'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : 'bg-gray-50 text-gray-700 ring-gray-100'
  return (
    <div className={`rounded-2xl px-4 py-3 ring-1 ${toneCls}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}

export default function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const t = useT()
  const { can, user } = useAuth()
  const canManage = can('canManageCustomers')
  const canSell   = can('canRegisterSale')

  const { data: customer, isLoading, isError } = useCustomer(id)
  const { data: txnsPage, isLoading: loadingTxns } = useCustomerTransactions(id, { size: 50 })
  // Cotizaciones hechas a este cliente: parte de su historial, aunque no muevan dinero.
  const quoteSearch = useQuoteSearch('', { customerId: id })
  const payment    = useRegisterCustomerPayment()
  const adjustment = useAdjustCustomerDebt()

  const [showEdit, setShowEdit]           = useState(false)
  const [showPayment, setShowPayment]     = useState(false)
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [openSaleId, setOpenSaleId]       = useState(null)
  const [openQuoteId, setOpenQuoteId]     = useState(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const handleDownloadPdf = async () => {
    try {
      setGeneratingPdf(true)
      const statement = (await customersApi.getStatement(id)).data.data
      downloadDebtStatementPdf(statement)
    } catch {
      toast.error(t('No pudimos generar el PDF. Intenta de nuevo.'))
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
  }
  if (isError || !customer) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
        {t('No pudimos cargar el cliente.')} <button onClick={() => navigate('/customers')} className="ml-1 underline">{t('Volver al listado')}</button>
      </div>
    )
  }

  const debt    = Number(customer.currentDebt ?? 0)
  const limit   = customer.creditLimit != null ? Number(customer.creditLimit) : null
  const exceeds = limit != null && limit > 0 && debt > limit
  const usage   = limit != null && limit > 0 ? Math.round((debt / limit) * 100) : null

  const txns = txnsPage?.content ?? []
  const lastTxn = txns[0]

  return (
    <div className="flex flex-col gap-5">

      {/* Back + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('/customers')}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <ArrowLeft size={14} />{t('Volver')}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {debt > 0 && (
            <>
              <button onClick={handleDownloadPdf} disabled={generatingPdf}
                title={t('Descargar la carta de deuda en PDF con el detalle de productos, para enviársela al cliente')}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {generatingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                {t('PDF de deuda')}
              </button>
              {reminderWhatsAppUrl(user?.businessName, customer) && (
                <a href={reminderWhatsAppUrl(user?.businessName, customer)}
                  target="_blank" rel="noopener noreferrer"
                  title={t('Enviar recordatorio de deuda por WhatsApp')}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                  <MessageCircle size={14} />WhatsApp
                </a>
              )}
            </>
          )}
          {canManage && (
            <>
              <button onClick={() => setShowPayment(true)} disabled={debt <= 0}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
                <DollarSign size={14} />{t('Registrar pago')}
              </button>
              <button onClick={() => setShowAdjustment(true)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                <Sliders size={14} />{t('Ajustar deuda')}
              </button>
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Edit size={14} />{t('Editar')}
              </button>
            </>
          )}
          <HelpDrawer title={t('Cómo cobrarle a este cliente')} autoOpenKey="eazystock_customer_help_v1">
            <CustomerHelp />
          </HelpDrawer>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
              {customer.documentId && (
                <span className="flex items-center gap-1.5"><FileText size={13} />{customer.documentId}</span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1.5"><Phone size={13} />{formatPhoneDisplay(customer.phone)}</span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1.5"><Mail size={13} />{customer.email}</span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1.5"><MapPin size={13} />{customer.address}</span>
              )}
            </div>
          </div>
          {exceeds && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100">
              <AlertTriangle size={12} />{t('Excede límite')}
            </span>
          )}
        </div>
        {customer.notes && (
          <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">{customer.notes}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('Deuda actual')}
          value={formatPrice(debt)}
          tone={debt > 0 ? (exceeds ? 'danger' : 'default') : 'positive'} />
        <StatCard label={t('Límite de crédito')}
          value={limit != null ? formatPrice(limit) : '—'} />
        <StatCard label={t('% del límite usado')}
          value={usage != null ? `${usage}%` : '—'}
          tone={exceeds ? 'danger' : 'default'} />
        <StatCard label={t('Última transacción')}
          value={lastTxn ? formatDate(lastTxn.createdAt) : '—'} />
      </div>

      {/* Compras del cliente (tarea 250) */}
      <PurchasesSection customerId={id} onOpenSale={setOpenSaleId} />

      {/* Cotizaciones del cliente */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900">{t('Cotizaciones')}</h3>
          {canSell && (
            <button onClick={() => navigate('/cotizaciones')}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <FilePlus2 size={13} /> {t('Nueva cotización')}
            </button>
          )}
        </div>
        {quoteSearch.isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : quoteSearch.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{t('Todavía no le hiciste ninguna cotización')}</p>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {quoteSearch.items.map((q) => (
                <li key={q.id}>
                  <button type="button" onClick={() => setOpenQuoteId(q.id)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-gray-50">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-gray-700">COT-{String(q.number).padStart(4, '0')}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(q.createdAt)} · {t('{n} producto(s)', { n: q.itemCount })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      {q.status === 'CONVERTED'
                        ? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700"><CheckCircle2 size={11} /> {t('Vendida')}</span>
                        : <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{t('Abierta')}</span>}
                      <span className="font-bold text-gray-900 whitespace-nowrap">{formatPrice(q.total)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <LoadMoreRow search={quoteSearch} />
          </>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-900">{t('Historial de transacciones')}</h3>
        {loadingTxns ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : txns.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{t('Sin transacciones aún')}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {txns.map((tx) => {
              const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.ADJUSTMENT
              const Icon = cfg.icon
              const isDecrease = tx.type === 'PAYMENT'
                || (tx.type === 'ADJUSTMENT' && tx.adjustmentDirection === 'DECREASE')
              const sign = isDecrease ? '−' : '+'
              return (
                <li key={tx.id} className="flex items-start gap-3 py-3">
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${cfg.cls}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cfg.cls}`}>
                        {t(cfg.label)}{tx.adjustmentDirection ? ` · ${tx.adjustmentDirection === 'INCREASE' ? '+' : '−'}` : ''}
                      </span>
                      {tx.saleId && (
                        <button onClick={() => setOpenSaleId(tx.saleId)}
                          className="text-xs font-mono text-blue-600 hover:underline">
                          {t('Venta')} #{String(tx.saleId).slice(0, 8)}
                        </button>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(tx.createdAt)} · {tx.createdByName}</span>
                    </div>
                    {tx.notes && <p className="mt-1 text-sm text-gray-600">{tx.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isDecrease ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sign}{formatPrice(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-400">{t('Balance')}: {formatPrice(tx.balanceAfter)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {showEdit && <CustomerFormModal customer={customer} onClose={() => setShowEdit(false)} />}
      {showPayment && (
        <PaymentModal
          entity={customer}
          mutation={payment}
          mode="customer"
          onClose={() => setShowPayment(false)}
        />
      )}
      {showAdjustment && (
        <AdjustmentModal
          entity={customer}
          mutation={adjustment}
          mode="customer"
          onClose={() => setShowAdjustment(false)}
        />
      )}
      {openSaleId && (
        <SaleDetailModal saleId={openSaleId} onClose={() => setOpenSaleId(null)} />
      )}
      {openQuoteId && (
        <QuoteDetailModal id={openQuoteId} user={user} canSell={canSell} onClose={() => setOpenQuoteId(null)} />
      )}
    </div>
  )
}
