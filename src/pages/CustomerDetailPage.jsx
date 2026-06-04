import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit, DollarSign, Sliders, Loader2,
  TrendingUp, TrendingDown, AlertTriangle, FileText, Phone, Mail, MapPin,
} from 'lucide-react'
import {
  useCustomer, useCustomerTransactions,
  useRegisterCustomerPayment, useAdjustCustomerDebt,
} from '../hooks/useCustomers'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import PaymentModal from '../components/accounts/PaymentModal'
import AdjustmentModal from '../components/accounts/AdjustmentModal'
import SaleDetailModal from '../components/reports/SaleDetailModal'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
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
  const { can } = useAuth()
  const canManage = can('canManageCustomers')

  const { data: customer, isLoading, isError } = useCustomer(id)
  const { data: txnsPage, isLoading: loadingTxns } = useCustomerTransactions(id, { size: 50 })
  const payment    = useRegisterCustomerPayment()
  const adjustment = useAdjustCustomerDebt()

  const [showEdit, setShowEdit]           = useState(false)
  const [showPayment, setShowPayment]     = useState(false)
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [openSaleId, setOpenSaleId]       = useState(null)

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
  }
  if (isError || !customer) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
        No pudimos cargar el cliente. <button onClick={() => navigate('/customers')} className="ml-1 underline">Volver al listado</button>
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
          <ArrowLeft size={14} />Volver
        </button>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowPayment(true)} disabled={debt <= 0}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
              <DollarSign size={14} />Registrar pago
            </button>
            <button onClick={() => setShowAdjustment(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              <Sliders size={14} />Ajustar deuda
            </button>
            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Edit size={14} />Editar
            </button>
          </div>
        )}
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
                <span className="flex items-center gap-1.5"><Phone size={13} />{customer.phone}</span>
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
              <AlertTriangle size={12} />Excede límite
            </span>
          )}
        </div>
        {customer.notes && (
          <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">{customer.notes}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Deuda actual"
          value={formatPrice(debt)}
          tone={debt > 0 ? (exceeds ? 'danger' : 'default') : 'positive'} />
        <StatCard label="Límite de crédito"
          value={limit != null ? formatPrice(limit) : '—'} />
        <StatCard label="% del límite usado"
          value={usage != null ? `${usage}%` : '—'}
          tone={exceeds ? 'danger' : 'default'} />
        <StatCard label="Última transacción"
          value={lastTxn ? formatDate(lastTxn.createdAt) : '—'} />
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-900">Historial de transacciones</h3>
        {loadingTxns ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : txns.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Sin transacciones aún</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {txns.map((t) => {
              const cfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.ADJUSTMENT
              const Icon = cfg.icon
              const isDecrease = t.type === 'PAYMENT'
                || (t.type === 'ADJUSTMENT' && t.adjustmentDirection === 'DECREASE')
              const sign = isDecrease ? '−' : '+'
              return (
                <li key={t.id} className="flex items-start gap-3 py-3">
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${cfg.cls}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cfg.cls}`}>
                        {cfg.label}{t.adjustmentDirection ? ` · ${t.adjustmentDirection === 'INCREASE' ? '+' : '−'}` : ''}
                      </span>
                      {t.saleId && (
                        <button onClick={() => setOpenSaleId(t.saleId)}
                          className="text-xs font-mono text-blue-600 hover:underline">
                          Venta #{String(t.saleId).slice(0, 8)}
                        </button>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(t.createdAt)} · {t.createdByName}</span>
                    </div>
                    {t.notes && <p className="mt-1 text-sm text-gray-600">{t.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isDecrease ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sign}{formatPrice(t.amount)}
                    </p>
                    <p className="text-xs text-gray-400">Balance: {formatPrice(t.balanceAfter)}</p>
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
    </div>
  )
}
