import { useNavigate } from 'react-router-dom'
import { Users, AlertTriangle, Loader2, MessageCircle, Wallet } from 'lucide-react'
import PageTitle from '../components/common/PageTitle'
import HelpDrawer from '../components/common/HelpDrawer'
import { useReceivables } from '../hooks/useReports'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'
import { waPhone, reminderMessage } from '../utils/debtReminder'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
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
  return (
    <>
      <p>
        Aquí ves a <span className="font-semibold">todos los clientes que te deben dinero</span>{' '}
        (por ventas al fiado), cuánto debe cada uno y hace cuánto no paga.
      </p>
      <HelpBlock title="Cobrar por WhatsApp (botón verde)">
        <p>
          En la columna <span className="font-semibold">"Recordar"</span>, toca el botón verde del
          cliente: se abre WhatsApp con un recordatorio cordial ya escrito con su nombre y su deuda.
          Solo revisas y envías. Si en vez del botón ves un guion, es porque ese cliente no tiene
          teléfono guardado — agrégaselo desde la página Clientes.
        </p>
      </HelpBlock>
      <HelpBlock title="PDF con el detalle de la deuda">
        <p>
          <span className="font-semibold">Toca la fila del cliente</span> para entrar a su ficha.
          Ahí está el botón <span className="font-semibold">"PDF de deuda"</span>: genera una carta
          con el detalle de todo lo que compró al fiado (producto por producto), los pagos que ya
          hizo y el saldo pendiente. Ese documento es para imprimirlo o mandárselo al cliente por
          WhatsApp o correo.
        </p>
      </HelpBlock>
      <HelpBlock title="Cuando el cliente paga">
        <p>
          Entra a su ficha y usa <span className="font-semibold">"Registrar pago"</span> — la deuda
          baja automáticamente y el cliente sale de esta lista cuando llega a cero.
        </p>
      </HelpBlock>
    </>
  )
}

export default function ReceivablesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const params = user?.role === 'SUPER_ADMIN' && user?.businessId
    ? { businessId: user.businessId }
    : undefined

  const { data, isLoading, isError } = useReceivables(params)
  const rows  = data?.rows  ?? []
  const total = data?.totalReceivable ?? 0

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle icon={Wallet} tone="emerald">Cuentas por cobrar</PageTitle>
        <div className="flex items-end gap-4">
          <HelpDrawer title="Cómo cobrar a tus clientes" autoOpenKey="eazystock_receivables_help_v1">
            <ReceivablesHelp />
          </HelpDrawer>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-400">Total por cobrar</p>
            <p className="text-2xl font-extrabold text-blue-700">{formatPrice(total)}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Toca un cliente para ver su ficha, registrar pagos y descargar el{' '}
        <span className="font-semibold text-gray-700">PDF con el detalle de su deuda</span> para enviárselo.
      </p>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Cliente</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Documento</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Teléfono</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Deuda</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">% Límite</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Último pago</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">Días</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">Recordar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-400" /></td></tr>
              ) : isError ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-red-500">No pudimos cargar el reporte.</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                        <Users size={28} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Ningún cliente tiene deuda pendiente</p>
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
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatPrice(r.currentDebt)}</td>
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
                            title={`Enviar recordatorio de deuda por WhatsApp a ${r.name}`}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <MessageCircle size={15} />
                          </a>
                        ) : (
                          <span title="El cliente no tiene teléfono registrado" className="text-xs text-gray-300">—</span>
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
    </div>
  )
}
