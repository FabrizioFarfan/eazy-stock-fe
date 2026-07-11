import { useNavigate } from 'react-router-dom'
import { Truck, AlertTriangle, Loader2, HandCoins } from 'lucide-react'
import PageTitle from '../components/common/PageTitle'
import { usePayables } from '../hooks/useReports'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'
import HelpDrawer from '../components/common/HelpDrawer'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}

export default function PayablesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const params = user?.role === 'SUPER_ADMIN' && user?.businessId
    ? { businessId: user.businessId }
    : undefined

  const { data, isLoading, isError } = usePayables(params)
  const rows  = data?.rows  ?? []
  const total = data?.totalPayable ?? 0

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <PageTitle icon={HandCoins} tone="amber">Cuentas por pagar</PageTitle>
          <HelpDrawer title="Cómo usar Cuentas por pagar" autoOpenKey="eazystock_payables_help_v1">
            <p>Lo que <strong>le debes a tus proveedores</strong>, todo junto en un solo lugar.</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">📥 ¿De dónde salen estas deudas?</p>
              <p className="mt-1">De las <strong>recepciones de mercadería a crédito</strong> que registras en Stock. Cada compra a crédito suma acá.</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">💵 Registrar un pago</p>
              <p className="mt-1">Haz click en el proveedor para ir a su detalle y registrar el pago. La deuda <strong>se actualiza al instante</strong>.</p>
            </div>
          </HelpDrawer>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-gray-400">Total por pagar</p>
          <p className="text-2xl font-extrabold text-red-600">{formatPrice(total)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Proveedor</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">RUC</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Teléfono</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Le debemos</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">% Crédito</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Último pago</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Días</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : isError ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-red-500">No pudimos cargar el reporte.</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                        <Truck size={28} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No tenés deudas pendientes con proveedores</p>
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
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatPrice(r.currentDebt)}</td>
                      <td className={`px-5 py-3.5 text-right font-semibold ${exceeds ? 'text-red-600' : 'text-gray-700'}`}>
                        {r.limitUsagePercent != null ? `${Number(r.limitUsagePercent).toFixed(0)}%` : '—'}
                        {exceeds && <AlertTriangle size={11} className="ml-1 inline" />}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-gray-500">{formatDate(r.lastPayment)}</td>
                      <td className="px-5 py-3.5 text-right text-xs text-gray-500">{r.daysSinceLastPayment != null ? `${r.daysSinceLastPayment}d` : '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
