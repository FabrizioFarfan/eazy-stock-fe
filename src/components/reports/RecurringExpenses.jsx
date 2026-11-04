import { useEffect, useState } from 'react'
import { Repeat, Plus, Pencil, Trash2, Power, X, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useRecurringExpenses, useCreateRecurringExpense, useUpdateRecurringExpense, useDeleteRecurringExpense } from '../../hooks/useExpenses'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, categoryOf } from '../../utils/expenseKinds'
import { formatPrice, formatAmount } from '../../utils/formatMoney'
import { getErrorMessage } from '../../utils/handleApiError'
import { useT, dateLocale } from '../../i18n'

/**
 * GASTOS FIJOS (Frank, 4-nov-2026: «alquiler, luz o el salario que uno se da»). Se definen una vez con su día
 * del mes y se registran solos como gastos normales (con 🔁). Apagar uno deja de generarlo; borrarlo no toca
 * lo ya registrado.
 */
const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500'

const fmtDay = (iso) => (iso ? new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'short' }).format(new Date(iso + 'T12:00:00')) : '—')

function RecurringModal({ item, onClose, onSubmit, submitting }) {
  const t = useT()
  const isEdit = !!item
  const [concept, setConcept] = useState(item?.concept ?? '')
  const [amount, setAmount] = useState(item ? String(item.amount) : '')
  const [category, setCategory] = useState(item?.category ?? 'RENT')
  const [dayOfMonth, setDayOfMonth] = useState(item?.dayOfMonth ?? 1)
  const [supplierId, setSupplierId] = useState(item?.supplierId ?? '')
  const [paymentMethod, setPaymentMethod] = useState(item?.paymentMethod ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [touched, setTouched] = useState(false)
  const { data: suppliers } = useSuppliers({ page: 0, size: 200, active: true })
  const supplierList = suppliers?.content ?? suppliers ?? []
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onClose() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])
  const amountNum = Number(String(amount).replace(',', '.'))
  const ready = amountNum > 0 && concept.trim() && dayOfMonth >= 1 && dayOfMonth <= 31
  const submit = (e) => {
    e.preventDefault(); setTouched(true); if (!ready) return
    onSubmit({ concept: concept.trim(), amount: amountNum, category, dayOfMonth: Number(dayOfMonth), supplierId: supplierId || null, paymentMethod: paymentMethod || null, notes: notes.trim() || null, active: item ? item.active : true })
  }
  const QUICK = [[t('Alquiler'), 'RENT'], [t('Luz'), 'UTILITIES'], [t('Internet'), 'UTILITIES'], [t('Mi sueldo'), 'SALARIES'], [t('Sueldo empleado'), 'SALARIES'], [t('Contador'), 'OTHER']]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={() => !submitting && onClose()}>
      <form onSubmit={submit} noValidate onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" data-testid="recurring-modal">
        <div className="relative overflow-hidden bg-indigo-600 px-5 pb-5 pt-4 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">{isEdit ? t('Corregir gasto fijo') : t('Nuevo gasto fijo')}</p>
            <button type="button" onClick={onClose} aria-label={t('Cerrar')} className="rounded-xl p-1.5 text-white/80 hover:bg-white/15 hover:text-white"><X size={20} /></button>
          </div>
          <div className="relative mt-3 flex items-center gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">{categoryOf(category).emoji}</span>
            <div className="min-w-0">
              <p className={`text-2xl font-extrabold leading-tight ${amountNum > 0 ? '' : 'text-white/50'}`}>{formatAmount(amountNum > 0 ? amountNum : 0)} <span className="text-sm font-semibold text-white/70">/ {t('mes')}</span></p>
              <p className="mt-0.5 text-xs text-white/80">{concept.trim() || t('¿Qué pagas todos los meses?')} · {t('el día {d}', { d: dayOfMonth })}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          {!isEdit && (
            <div className="flex flex-wrap gap-1.5">
              {QUICK.map(([label, cat]) => (
                <button key={label} type="button" onClick={() => { setConcept(label); setCategory(cat) }}
                  className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-indigo-400 hover:text-indigo-700">{label}</button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelCls} htmlFor="recConcept">{t('Qué es')}</label>
              <input id="recConcept" value={concept} maxLength={200} onChange={(e) => setConcept(e.target.value)} placeholder={t('p. ej. Alquiler del local')} className={inputCls} autoFocus={!isEdit} />
              {touched && !concept.trim() && <p className="mt-1 text-xs text-red-600">{t('Escribe qué es')}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="recDay">{t('Día del mes')}</label>
              <input id="recDay" type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className={`${inputCls} text-center font-bold`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="recAmount">{t('Monto al mes')}</label>
              <input id="recAmount" type="number" inputMode="decimal" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${inputCls} text-lg font-bold`} />
              {touched && !(amountNum > 0) && <p className="mt-1 text-xs text-red-600">{t('Pon cuánto es')}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="recMethod">{t('Cómo se paga')} <span className="font-normal normal-case text-gray-400">· {t('opcional')}</span></label>
              <select id="recMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                <option value="">—</option>
                {PAYMENT_METHODS.map((m) => <option key={m.key} value={m.key}>{t(m.label)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className={labelCls}>{t('Tipo de gasto')}</p>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button key={c.key} type="button" onClick={() => setCategory(c.key)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-all ${category === c.key ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <span className="text-lg leading-none">{c.emoji}</span><span>{t(c.label)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="recSupplier">{t('Proveedor')} <span className="font-normal normal-case text-gray-400">· {t('opcional')}</span></label>
              <select id="recSupplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputCls}>
                <option value="">{t('Sin proveedor')}</option>
                {supplierList.filter((s) => !s.placeholderForUnassigned).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="recNotes">{t('Nota')} <span className="font-normal normal-case text-gray-400">· {t('opcional')}</span></label>
              <input id="recNotes" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
            </div>
          </div>
          <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-800">{t('Se registra solo ese día de cada mes como un gasto normal (con 🔁). Si este mes ya pasó el día, se registra ahora mismo.')}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100">{t('Cancelar')}</button>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-60">
            <Repeat size={16} /> {submitting ? t('Guardando…') : isEdit ? t('Guardar cambios') : t('Guardar gasto fijo')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function RecurringExpensesCard({ biz = {} }) {
  const t = useT()
  const { data: items = [], isLoading } = useRecurringExpenses(biz)
  const create = useCreateRecurringExpense(), update = useUpdateRecurringExpense(), remove = useDeleteRecurringExpense()
  const [modal, setModal] = useState(null) // null | 'new' | item
  const [confirmId, setConfirmId] = useState(null)
  const total = items.filter((i) => i.active).reduce((s, i) => s + Number(i.amount), 0)
  const fail = (e) => toast.error(getErrorMessage(e))
  const submit = (body) => {
    const payload = { ...body, ...biz }
    if (modal === 'new') create.mutate(payload, { onSuccess: () => { toast.success(t('Gasto fijo guardado')); setModal(null) }, onError: fail })
    else update.mutate({ id: modal.id, data: payload, params: biz }, { onSuccess: () => { toast.success(t('Gasto fijo guardado')); setModal(null) }, onError: fail })
  }
  const toggle = (i) => update.mutate({ id: i.id, data: { concept: i.concept, amount: i.amount, category: i.category, dayOfMonth: i.dayOfMonth, supplierId: i.supplierId, paymentMethod: i.paymentMethod, notes: i.notes, active: !i.active }, params: biz },
    { onSuccess: () => toast.success(i.active ? t('Gasto fijo apagado') : t('Gasto fijo encendido')), onError: fail })
  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm" data-testid="recurring-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Repeat size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-gray-900">{t('Gastos fijos')}</h3>
          <span className="hidden text-xs text-gray-400 sm:inline">· {t('se registran solos cada mes')}</span>
          {total > 0 && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{formatPrice(total)} / {t('mes')}</span>}
        </div>
        <button type="button" onClick={() => setModal('new')} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"><Plus size={14} /> {t('Nuevo gasto fijo')}</button>
      </div>
      {isLoading ? <div className="h-20 animate-pulse" /> : !items.length ? (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <p className="text-sm text-gray-500">{t('Alquiler, luz, internet, tu sueldo… defínelos una vez y se anotan solos el día que toca.')}</p>
          <button type="button" onClick={() => setModal('new')} className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100">{t('Definir el primero')}</button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((i) => { const cat = categoryOf(i.category); return (
            <li key={i.id} className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${i.active ? '' : 'opacity-50'}`} data-testid="recurring-row">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">{cat.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900">{i.concept}</span>
                <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-400">
                  <span>{t('el día {d}', { d: i.dayOfMonth })}</span>
                  <span>· {t(cat.label)}</span>
                  {i.supplierName && <span>· {i.supplierName}</span>}
                  {i.active && i.nextRun && <span className="inline-flex items-center gap-1 text-indigo-600"><CalendarClock size={11} /> {t('próximo')} {fmtDay(i.nextRun)}</span>}
                  {!i.active && <span className="font-semibold">· {t('apagado')}</span>}
                </span>
              </span>
              <span className="text-sm font-bold text-gray-900">{formatPrice(i.amount)}</span>
              {confirmId === i.id ? (
                <span className="flex items-center gap-1">
                  <button type="button" onClick={() => remove.mutate({ id: i.id, params: biz }, { onSuccess: () => { toast.success(t('Gasto fijo borrado')); setConfirmId(null) }, onError: fail })} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white">{t('Borrar')}</button>
                  <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500">{t('No')}</button>
                </span>
              ) : (
                <span className="flex items-center gap-0.5">
                  <button type="button" onClick={() => toggle(i)} aria-label={i.active ? t('Apagar') : t('Encender')} title={i.active ? t('Apagar: deja de registrarse') : t('Encender')} className={`rounded-lg p-2 hover:bg-gray-100 ${i.active ? 'text-emerald-600' : 'text-gray-400'}`}><Power size={15} /></button>
                  <button type="button" onClick={() => setModal(i)} aria-label={t('Corregir')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
                  <button type="button" onClick={() => setConfirmId(i.id)} aria-label={t('Borrar')} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                </span>
              )}
            </li>
          ) })}
        </ul>
      )}
      {modal && <RecurringModal item={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSubmit={submit} submitting={create.isPending || update.isPending} />}
    </div>
  )
}
