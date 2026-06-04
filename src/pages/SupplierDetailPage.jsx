import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, DollarSign, PackagePlus, Sliders, Loader2,
  TrendingUp, TrendingDown, AlertTriangle, FileText, Phone, Truck,
} from 'lucide-react'
import { suppliersApi } from '../services/endpoints/suppliers'
import {
  useSupplierTransactions, useAddSupplierDebt,
  useRegisterSupplierPayment, useAdjustSupplierDebt,
} from '../hooks/useSupplierTransactions'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'
import PaymentModal from '../components/accounts/PaymentModal'
import AdjustmentModal from '../components/accounts/AdjustmentModal'
import DebtAddModal from '../components/accounts/DebtAddModal'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

const TYPE_CONFIG = {
  DEBT_ADD:   { label: 'Cargo',  cls: 'bg-red-50 text-red-700 ring-red-100',         icon: TrendingUp,   sign: '+' },
  PAYMENT:    { label: 'Pago',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-100', icon: TrendingDown, sign: '−' },
  ADJUSTMENT: { label: 'Ajuste', cls: 'bg-amber-50 text-amber-700 ring-amber-100',   icon: Sliders,      sign: '±' },
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

export default function SupplierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const canManage = can('canManageSuppliers')

  const { data: supplier, isLoading, isError } = useQuery({
    queryKey: ['suppliers', 'detail', id],
    queryFn: () => suppliersApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
  const { data: txnsPage, isLoading: loadingTxns } = useSupplierTransactions(id, { size: 50 })

  const addDebt    = useAddSupplierDebt()
  const payment    = useRegisterSupplierPayment()
  const adjustment = useAdjustSupplierDebt()

  const [showDebt, setShowDebt]             = useState(false)
  const [showPayment, setShowPayment]       = useState(false)
  const [showAdjustment, setShowAdjustment] = useState(false)

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
  }
  if (isError || !supplier) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
        No pudimos cargar el proveedor.
        <button onClick={() => navigate(-1)} className="ml-1 underline">Volver</button>
      </div>
    )
  }

  const debt    = Number(supplier.currentDebt ?? 0)
  const limit   = supplier.creditLimitFromSupplier != null ? Number(supplier.creditLimitFromSupplier) : null
  const exceeds = limit != null && limit > 0 && debt > limit
  const usage   = limit != null && limit > 0 ? Math.round((debt / limit) * 100) : null

  const txns = txnsPage?.content ?? []
  const lastPay = txns.find((t) => t.type === 'PAYMENT')

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <ArrowLeft size={14} />Volver
        </button>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowDebt(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <PackagePlus size={14} />Recepción a crédito
            </button>
            <button onClick={() => setShowPayment(true)} disabled={debt <= 0}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
              <DollarSign size={14} />Registrar pago
            </button>
            <button onClick={() => setShowAdjustment(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              <Sliders size={14} />Ajustar
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Truck size={22} className="text-blue-600" />{supplier.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
              {supplier.ruc && <span className="flex items-center gap-1.5"><FileText size={13} />RUC {supplier.ruc}</span>}
              {supplier.phone && <span className="flex items-center gap-1.5"><Phone size={13} />{supplier.phone}</span>}
              {supplier.contact && <span>Contacto: {supplier.contact}</span>}
            </div>
          </div>
          {exceeds && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100">
              <AlertTriangle size={12} />Excede crédito
            </span>
          )}
        </div>
        {supplier.notes && (
          <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">{supplier.notes}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Le debemos"
          value={formatPrice(debt)}
          tone={debt > 0 ? (exceeds ? 'danger' : 'default') : 'positive'} />
        <StatCard label="Crédito que nos da"
          value={limit != null ? formatPrice(limit) : '—'} />
        <StatCard label="% usado"
          value={usage != null ? `${usage}%` : '—'}
          tone={exceeds ? 'danger' : 'default'} />
        <StatCard label="Último pago"
          value={lastPay ? formatDate(lastPay.createdAt) : '—'} />
      </div>

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
                      {t.referenceDocument && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                          {t.referenceDocument}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(t.createdAt)} · {t.createdByName}</span>
                    </div>
                    {t.notes && <p className="mt-1 text-sm text-gray-600">{t.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isDecrease ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sign}{formatPrice(t.amount)}
                    </p>
                    <p className="text-xs text-gray-400">Saldo: {formatPrice(t.balanceAfter)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {showDebt && (
        <DebtAddModal supplier={supplier} mutation={addDebt} onClose={() => setShowDebt(false)} />
      )}
      {showPayment && (
        <PaymentModal
          entity={supplier}
          mutation={payment}
          mode="supplier"
          onClose={() => setShowPayment(false)}
        />
      )}
      {showAdjustment && (
        <AdjustmentModal
          entity={supplier}
          mutation={adjustment}
          mode="supplier"
          onClose={() => setShowAdjustment(false)}
        />
      )}
    </div>
  )
}
