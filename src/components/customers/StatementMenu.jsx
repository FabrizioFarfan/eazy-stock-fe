import { useEffect, useRef, useState } from 'react'
import { FileText, FileDown, MessageCircle, Mail, Printer, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { customersApi } from '../../services/endpoints/customers'
import { downloadDebtStatementPdf, printStatementPdf } from '../../utils/debtStatementPdf'
import { shareStatementWhatsApp, shareStatementEmail } from '../../utils/shareStatement'
import { useT } from '../../i18n'

/**
 * Menú «Estado de cuenta» de la ficha del cliente: el historial de sus
 * movimientos (compras al fiado con productos, pagos, ajustes) con el saldo
 * después de cada uno, en PDF — para descargar, mandar por WhatsApp o correo
 * (adjunto en el celular) o imprimir. Pedido de William: un cliente discutía
 * su deuda y quería mostrarle el historial para que cuadre.
 *
 * PERÍODO (Frank): quien manda el estado cada mes no quiere arrastrar los
 * meses anteriores. «Este mes» / «Mes anterior» / rango traen solo esos
 * movimientos y el PDF arranca con el «Saldo anterior», así el mes cuadra
 * solo. La última elección queda guardada en el navegador.
 *
 * `variant`: 'primary' (botón azul, cabecera) | 'ghost' (borde, sección).
 */

const PERIOD_KEY = 'eazystock_statement_period'
const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Rango {from,to} en días locales del usuario para cada opción. */
function periodRange(kind, custom) {
  const now = new Date()
  if (kind === 'month') {
    return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) }
  }
  if (kind === 'prev') {
    return {
      from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to:   iso(new Date(now.getFullYear(), now.getMonth(), 0)),
    }
  }
  if (kind === 'custom') {
    return { ...(custom.from && { from: custom.from }), ...(custom.to && { to: custom.to }) }
  }
  return {}
}

function loadPeriod() {
  try {
    const raw = localStorage.getItem(PERIOD_KEY)
    if (raw) { const p = JSON.parse(raw); if (['all', 'month', 'prev', 'custom'].includes(p.kind)) return p }
  } catch { /* storage bloqueado */ }
  return { kind: 'all', from: '', to: '' }
}

export default function StatementMenu({ customerId, variant = 'primary', className = '' }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)   // 'pdf' | 'whatsapp' | 'email' | 'print'
  const [period, setPeriod] = useState(loadPeriod)
  const ref = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(PERIOD_KEY, JSON.stringify(period)) } catch { /* ignore */ }
  }, [period])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey  = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const run = async (kind, fn) => {
    const params = periodRange(period.kind, period)
    if (period.kind === 'custom' && !params.from && !params.to) {
      toast.error(t('Elige al menos una fecha del rango'))
      return
    }
    setOpen(false)
    setBusy(kind)
    try {
      const statement = (await customersApi.getStatement(customerId, params)).data.data
      await fn(statement)
    } catch {
      toast.error(t('No pudimos generar el PDF. Intenta de nuevo.'))
    } finally {
      setBusy(null)
    }
  }

  const actions = [
    { key: 'pdf', icon: FileDown, label: t('Descargar PDF'), fn: (s) => { downloadDebtStatementPdf(s); toast.success(t('PDF descargado')) } },
    { key: 'whatsapp', icon: MessageCircle, label: t('Enviar por WhatsApp'), fn: async (s) => {
      const how = await shareStatementWhatsApp(s)
      if (how === 'desktop') toast.info(t('Se descargó el PDF y se abrió WhatsApp con el mensaje listo: adjunta el archivo descargado.'), { duration: 7000 })
    } },
    { key: 'email', icon: Mail, label: t('Enviar por correo'), fn: async (s) => {
      const how = await shareStatementEmail(s)
      if (how === 'desktop') toast.info(t('Se descargó el PDF y se abrió tu correo con el mensaje listo: adjunta el archivo descargado.'), { duration: 7000 })
    } },
    { key: 'print', icon: Printer, label: t('Imprimir'), fn: (s) => { if (!printStatementPdf(s)) toast.info(t('El navegador bloqueó la ventana: se descargó el PDF para que lo imprimas.')) } },
  ]

  const PERIODS = [
    { kind: 'all',    label: t('Todo') },
    { kind: 'month',  label: t('Este mes') },
    { kind: 'prev',   label: t('Mes anterior') },
    { kind: 'custom', label: t('Rango…') },
  ]

  const triggerCls = variant === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
  const dateCls = 'w-full rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700 outline-none focus:border-blue-600'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} disabled={!!busy}
        aria-haspopup="menu" aria-expanded={open}
        title={t('Historial completo de compras y pagos del cliente, con el saldo después de cada movimiento, en PDF')}
        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 ${triggerCls}`}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        {t('Estado de cuenta')}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
          <p className="px-3 pb-1 pt-1.5 text-[11px] leading-snug text-gray-400">
            {t('Compras, pagos y saldo después de cada movimiento')}
          </p>

          {/* Período */}
          <div className="px-3 pb-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('Período')}</p>
            <div className="flex flex-wrap gap-1">
              {PERIODS.map((p) => (
                <button key={p.kind} type="button" onClick={() => setPeriod((cur) => ({ ...cur, kind: p.kind }))}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition ${
                    period.kind === p.kind
                      ? 'bg-blue-600 text-white ring-blue-600'
                      : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            {period.kind === 'custom' && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <input type="date" value={period.from} max={period.to || undefined} onChange={(e) => setPeriod((c) => ({ ...c, from: e.target.value }))} className={dateCls} aria-label={t('Desde')} />
                <input type="date" value={period.to} min={period.from || undefined} onChange={(e) => setPeriod((c) => ({ ...c, to: e.target.value }))} className={dateCls} aria-label={t('Hasta')} />
              </div>
            )}
            {period.kind !== 'all' && (
              <p className="mt-1.5 text-[11px] leading-snug text-gray-400">
                {t('El PDF arranca con el saldo anterior al período, así cuadra solo.')}
              </p>
            )}
          </div>

          <div className="border-t border-gray-100" />
          {actions.map(({ key, icon: Icon, label, fn }) => (
            <button key={key} type="button" role="menuitem" onClick={() => run(key, fn)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
              <Icon size={15} className="text-gray-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
