import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, DollarSign, PackagePlus, Sliders, Loader2,
  TrendingUp, TrendingDown, FileText, Phone, User, Package, History,
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
import { useT, dateLocale } from '../i18n'
import { ProfileHero, ActionButton, InfoRow, SectionTitle } from '../components/accounts/AccountKit'
import { formatPhoneDisplay } from '../utils/phone'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

const TYPE_CONFIG = {
  DEBT_ADD:   { label: 'Cargo',  cls: 'bg-red-50 text-red-700 ring-red-100',         icon: TrendingUp,   sign: '+' },
  PAYMENT:    { label: 'Pago',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-100', icon: TrendingDown, sign: '−' },
  ADJUSTMENT: { label: 'Ajuste', cls: 'bg-amber-50 text-amber-700 ring-amber-100',   icon: Sliders,      sign: '±' },
  RETURN:     { label: 'Devolución de mercadería', cls: 'bg-purple-50 text-purple-700 ring-purple-100', icon: TrendingDown, sign: '−' },
}

export default function SupplierDetailPage() {
  const t = useT()
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
        {t('No pudimos cargar el proveedor.')}
        <button onClick={() => navigate(-1)} className="ml-1 underline">{t('Volver')}</button>
      </div>
    )
  }

  const debt    = Number(supplier.currentDebt ?? 0)
  const limit   = supplier.creditLimitFromSupplier != null ? Number(supplier.creditLimitFromSupplier) : null
  const exceeds = limit != null && limit > 0 && debt > limit
  const usage   = limit != null && limit > 0 ? Math.round((debt / limit) * 100) : null

  const txns = txnsPage?.content ?? []
  const lastPay = txns.find((tx) => tx.type === 'PAYMENT')

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <ArrowLeft size={14} />{t('Volver')}
        </button>
      </div>

      {/* Perfil: quién es y cuánto le debes */}
      <ProfileHero
        name={supplier.name}
        chips={[
          supplier.ruc && { icon: FileText, text: `RUC ${supplier.ruc}` },
          supplier.phone && { icon: Phone, text: formatPhoneDisplay(supplier.phone) },
          supplier.contact && { icon: User, text: supplier.contact },
        ].filter(Boolean)}
        debtLabel={t('Le debemos')}
        debt={formatPrice(debt)}
        limitLabel={t('Crédito que nos da')}
        limit={limit != null ? formatPrice(limit) : '—'}
        usage={usage}
        exceeds={exceeds}
        exceedsLabel={t('Excede crédito')}
        notes={supplier.notes}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Acciones (primero en el celular) */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:order-2 lg:self-start">
          {canManage && (
            <>
              <ActionButton icon={DollarSign} tone="primary" label={t('Registrar pago')}
                hint={debt > 0 ? t('Le pagas una parte o todo') : t('No le debes nada')}
                onClick={() => setShowPayment(true)} disabled={debt <= 0} />
              <ActionButton icon={PackagePlus} label={t('Recepción a crédito')} hint={t('Suma una compra a su cuenta')}
                onClick={() => setShowDebt(true)} />
            </>
          )}
          <ActionButton icon={Package} label={t('Ver sus productos')} hint={t('Lo que le compras')}
            onClick={() => navigate(`/products?supplierId=${supplier.id}`)} />
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-1 shadow-sm">
            <InfoRow label={t('Crédito que nos da')} value={limit != null ? formatPrice(limit) : '—'} />
            <div className="border-t border-gray-50" />
            <InfoRow label={t('% usado')} value={usage != null ? `${usage}%` : '—'} tone={exceeds ? 'text-red-600' : undefined} />
            <div className="border-t border-gray-50" />
            <InfoRow label={t('Último pago')} value={lastPay ? formatDate(lastPay.createdAt) : '—'} />
          </div>
          {canManage && (
            <button onClick={() => setShowAdjustment(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100">
              <Sliders size={14} />{t('Ajustar')}
            </button>
          )}
        </div>

        {/* Columna principal */}
        <div className="flex min-w-0 flex-col gap-5 lg:order-1 lg:col-span-2">

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <SectionTitle icon={History} title={t('Historial de transacciones')} count={txns.length || null}
          hint={t('Cargos, pagos y ajustes con el saldo después de cada movimiento. Del más reciente al más antiguo.')} />
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
              const isDecrease = tx.type === 'PAYMENT' || tx.type === 'RETURN'
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
                      {tx.referenceDocument && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                          {tx.referenceDocument}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(tx.createdAt)} · {tx.createdByName}</span>
                    </div>
                    {tx.notes && <p className="mt-1 text-sm text-gray-600">{tx.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isDecrease ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sign}{formatPrice(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-400">{t('Saldo:')} {formatPrice(tx.balanceAfter)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

        </div>
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
