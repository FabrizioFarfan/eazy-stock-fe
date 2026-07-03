import { useNavigate } from 'react-router-dom'
import { Users, AlertTriangle, Loader2, FileDown, MessageCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useReceivables } from '../hooks/useReports'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/formatMoney'

function formatDate(str) {
  if (!str) return '—'
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(str))
}

/**
 * Normaliza un teléfono peruano para wa.me: solo dígitos y con código de país.
 * "987 654 321" → "51987654321". Si ya trae 51 u otro código, se respeta.
 */
function waPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return null
  return digits.length === 9 ? `51${digits}` : digits
}

function reminderMessage(businessName, customerName, debt) {
  const amount = formatPrice(debt)
  return (
    `Estimado(a) ${customerName}, le saludamos de ${businessName || 'nuestro negocio'}. ` +
    `Le recordamos que mantiene una deuda pendiente con nosotros por ${amount}. ` +
    `Agradecemos de antemano su puntualidad. ¡Muchas gracias!`
  )
}

function downloadPdf(rows, total, businessName) {
  const doc = new jsPDF()
  const now = new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date())

  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Cuentas por cobrar', 14, 18)
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(120)
  doc.text(`${businessName || ''}${businessName ? ' · ' : ''}Generado el ${now}`, 14, 25)

  autoTable(doc, {
    startY: 31,
    head: [['Cliente', 'Documento', 'Teléfono', 'Deuda', 'Último pago', 'Días']],
    body: rows.map((r) => [
      r.name,
      r.documentId || '—',
      r.phone || '—',
      formatPrice(r.currentDebt),
      formatDate(r.lastPayment),
      r.daysSinceLastPayment != null ? `${r.daysSinceLastPayment}d` : '—',
    ]),
    foot: [[
      { content: `Total por cobrar (${rows.length} cliente${rows.length !== 1 ? 's' : ''})`, colSpan: 3 },
      { content: formatPrice(total), colSpan: 3 },
    ]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
  })

  doc.save(`cuentas-por-cobrar-${new Date().toISOString().slice(0, 10)}.pdf`)
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
        <h2 className="text-2xl font-bold text-gray-900">Cuentas por cobrar</h2>
        <div className="flex items-end gap-4">
          {rows.length > 0 && (
            <button
              onClick={() => downloadPdf(rows, total, user?.businessName)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileDown size={15} />
              Descargar PDF
            </button>
          )}
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-400">Total por cobrar</p>
            <p className="text-2xl font-extrabold text-blue-700">{formatPrice(total)}</p>
          </div>
        </div>
      </div>

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
