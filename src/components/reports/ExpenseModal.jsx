import { useEffect, useState } from 'react'
import { X, Receipt } from 'lucide-react'
import { useSuppliers } from '../../hooks/useSuppliers'
import { formatAmount } from '../../utils/formatMoney'
import { useT } from '../../i18n'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, categoryOf } from '../../utils/expenseKinds'

/**
 * Registrar o corregir un gasto que no es mercadería (William, 10-oct-2026).
 * Un formulario corto: cuánto, qué fue, de qué tipo, qué día; proveedor y
 * medio de pago opcionales. Las compras de mercadería NO van aquí: esas son
 * las recepciones de Stock.
 */
function todayISO() {
  const d = new Date(); const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500'

export default function ExpenseModal({ expense, onClose, onSubmit, submitting, error }) {
  const t = useT()
  const isEdit = !!expense
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [concept, setConcept] = useState(expense?.concept ?? '')
  const [category, setCategory] = useState(expense?.category ?? 'OTHER')
  const [day, setDay] = useState(expense?.day ?? todayISO())
  const [supplierId, setSupplierId] = useState(expense?.supplierId ?? '')
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? '')
  const [notes, setNotes] = useState(expense?.notes ?? '')
  const [touched, setTouched] = useState(false)
  const { data: suppliers } = useSuppliers({ page: 0, size: 200, active: true })
  const supplierList = suppliers?.content ?? suppliers ?? []

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  const amountNum = Number(String(amount).replace(',', '.'))
  const amountOk = amountNum > 0
  const conceptOk = concept.trim().length > 0
  const ready = amountOk && conceptOk && !!day

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!ready) return
    onSubmit({
      day, amount: amountNum, category, concept: concept.trim(),
      supplierId: supplierId || null, paymentMethod: paymentMethod || null, notes: notes.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={() => !submitting && onClose()}>
      <form onSubmit={submit} noValidate onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="relative overflow-hidden bg-blue-600 px-5 pb-5 pt-4 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">{isEdit ? t('Corregir gasto') : t('Registrar gasto')}</p>
            <button type="button" onClick={onClose} aria-label={t('Cerrar')} className="rounded-xl p-1.5 text-white/80 hover:bg-white/15 hover:text-white"><X size={20} /></button>
          </div>
          <div className="relative mt-3 flex items-center gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">{categoryOf(category).emoji}</span>
            <div className="min-w-0">
              <p className={`text-2xl font-extrabold leading-tight ${amountOk ? '' : 'text-white/50'}`}>{formatAmount(amountOk ? amountNum : 0)}</p>
              <p className="mt-0.5 text-xs text-white/80">{concept.trim() || t('¿En qué se fue la plata?')}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="expAmount">{t('Monto')}</label>
              <input id="expAmount" type="number" inputMode="decimal" step="0.01" min="0.01" value={amount} autoFocus={!isEdit}
                onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} text-lg font-bold`} />
              {touched && !amountOk && <p className="mt-1 text-xs text-red-600">{t('Pon cuánto fue')}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="expDay">{t('Día')}</label>
              <input id="expDay" type="date" value={day} max={todayISO()} onChange={(e) => setDay(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="expConcept">{t('Qué fue')}</label>
            <input id="expConcept" value={concept} maxLength={200} onChange={(e) => setConcept(e.target.value)}
              placeholder={t('p. ej. Flete del pedido de clavos, luz de setiembre')} className={inputCls} />
            {touched && !conceptOk && <p className="mt-1 text-xs text-red-600">{t('Escribe qué fue el gasto')}</p>}
          </div>
          <div>
            <p className={labelCls}>{t('Tipo de gasto')}</p>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button key={c.key} type="button" onClick={() => setCategory(c.key)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-all ${
                    category === c.key ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <span className="text-lg leading-none">{c.emoji}</span>
                  <span>{t(c.label)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="expSupplier">{t('Proveedor')} <span className="font-normal normal-case text-gray-400">· {t('opcional')}</span></label>
              <select id="expSupplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputCls}>
                <option value="">{t('Sin proveedor')}</option>
                {supplierList.filter((s) => !s.placeholderForUnassigned).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="expMethod">{t('Cómo se pagó')} <span className="font-normal normal-case text-gray-400">· {t('opcional')}</span></label>
              <select id="expMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                <option value="">—</option>
                {PAYMENT_METHODS.map((m) => <option key={m.key} value={m.key}>{t(m.label)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="expNotes">{t('Nota')} <span className="font-normal normal-case text-gray-400">· {t('opcional')}</span></label>
            <input id="expNotes" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder={t('Nº de recibo, a quién se le pagó…')} className={inputCls} />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100">{t('Cancelar')}</button>
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-60">
            <Receipt size={16} /> {submitting ? t('Guardando…') : isEdit ? t('Guardar cambios') : t('Registrar gasto')}
          </button>
        </div>
      </form>
    </div>
  )
}
