import { useState } from 'react'
import { Banknote, Plus, X, Trash2, HandCoins, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useCashFloatDay, useRegisterCashFloat, useDeleteCashFloat } from '../../hooks/useCashFloat'
import { useCashClosing } from '../../hooks/useReports'
import { useEmployees } from '../../hooks/useEmployees'
import { formatPrice } from '../../utils/formatMoney'
import { localISODate } from '../../utils/formatDate'
import { useT, dateLocale } from '../../i18n'

/**
 * Fondo de caja del día (pedido de William, 15-sep): el sencillo que el dueño
 * le entrega al vendedor al abrir para dar vuelto, y lo que le completa durante
 * el día. El dueño lo registra; el vendedor lo ve. Debajo, lo que debería haber
 * en el cajón ahora mismo (fondo + efectivo vendido hoy − devoluciones), que es
 * el número contra el que se cuenta la plata al cerrar.
 */
export default function CashFloatCard({ canRegister, canSeeDrawer, scopeParams = {} }) {
  const t = useT()
  const today = localISODate(new Date())
  const { data, isLoading } = useCashFloatDay({ date: today, ...scopeParams })
  const closing = useCashClosing({ from: today, to: today, ...scopeParams }, { enabled: !!canSeeDrawer })
  const register = useRegisterCashFloat()
  const remove = useDeleteCashFloat()
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const entries = data?.entries ?? []
  const total = Number(data?.total ?? 0)
  const hasFloat = entries.length > 0

  const timeOf = (iso) => new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm" data-testid="cash-float-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Banknote size={22} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">{t('Fondo de caja de hoy')}</h3>
            <p className="text-xs text-gray-400">{t('El sencillo para dar vuelto')}</p>
          </div>
        </div>
        {canRegister && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/30 transition-all hover:bg-emerald-700 active:scale-[0.98]"
            data-testid="cash-float-add"
          >
            <Plus size={15} />
            {hasFloat ? t('Completar') : t('Registrar fondo')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-5 h-10 w-40 animate-pulse rounded-lg bg-gray-100" />
      ) : !hasFloat ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500" data-testid="cash-float-empty">
          {canRegister
            ? t('Todavía no registraste el fondo de hoy. Anota cuánto sencillo dejas en caja para dar vuelto; el cierre de caja lo tendrá en cuenta.')
            : t('Hoy no hay fondo de caja registrado.')}
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-extrabold tabular-nums text-gray-900" data-testid="cash-float-total">{formatPrice(total)}</span>
            <span className="pb-1 text-xs text-gray-400">
              {entries.length === 1 ? t('1 entrega') : t('{n} entregas', { n: entries.length })}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-gray-50 rounded-xl border border-gray-100">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2 text-sm" data-testid="cash-float-entry">
                <span className="flex items-center gap-1 font-mono text-xs text-gray-400"><Clock size={11} />{timeOf(e.createdAt)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${e.kind === 'OPENING' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {e.kind === 'OPENING' ? t('Apertura') : t('Completado')}
                </span>
                <span className="min-w-0 flex-1 truncate text-gray-600">
                  {e.assignedToName ? t('para {name}', { name: e.assignedToName }) : t('en caja')}
                  {e.note ? <span className="text-gray-400"> · {e.note}</span> : null}
                </span>
                <span className="font-semibold tabular-nums text-gray-900">{formatPrice(e.amount)}</span>
                {canRegister && (
                  confirmId === e.id ? (
                    <span className="flex items-center gap-1">
                      <button
                        onClick={() => remove.mutate({ id: e.id, params: scopeParams }, { onSuccess: () => { setConfirmId(null); toast.success(t('Entrega borrada')) } })}
                        className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-semibold text-white"
                      >
                        {t('¿seguro?')}
                      </button>
                      <button onClick={() => setConfirmId(null)} className="rounded-lg p-1 text-gray-400 hover:text-gray-700"><X size={12} /></button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmId(e.id)} className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600" aria-label={t('Borrar entrega')}>
                      <Trash2 size={13} />
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {canSeeDrawer && closing.data && (hasFloat || Number(closing.data.cashSalesTotal) > 0) && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50/70 px-4 py-3 ring-1 ring-emerald-100" data-testid="cash-float-drawer">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-800">
              <HandCoins size={15} />
              {t('Debe haber en el cajón ahora')}
            </p>
            <p className="text-xs text-emerald-700/70">{t('Fondo + efectivo vendido hoy − devoluciones en efectivo')}</p>
          </div>
          <span className="text-xl font-extrabold tabular-nums text-emerald-700">{formatPrice(closing.data.drawerExpected)}</span>
        </div>
      )}

      {open && (
        <RegisterModal
          hasFloat={hasFloat}
          scopeParams={scopeParams}
          pending={register.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(payload) => register.mutate(payload, {
            onSuccess: () => { setOpen(false); toast.success(hasFloat ? t('Fondo completado') : t('Fondo de caja registrado')) },
            onError: () => toast.error(t('No se pudo registrar el fondo')),
          })}
        />
      )}
    </div>
  )
}

function RegisterModal({ hasFloat, scopeParams, pending, onClose, onSubmit }) {
  const t = useT()
  const [amount, setAmount] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [note, setNote] = useState('')
  const { data: employeesPage } = useEmployees({ size: 100, ...scopeParams })
  const employees = (employeesPage?.content ?? employeesPage ?? []).filter((e) => e.active !== false)
  const numeric = Number(String(amount).replace(',', '.'))
  const valid = Number.isFinite(numeric) && numeric > 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()} data-testid="cash-float-modal">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{hasFloat ? t('Completar el fondo') : t('Registrar fondo de caja')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasFloat
                ? t('Anota cuánto sencillo más dejas en caja.')
                : t('Cuánto sencillo dejas en caja hoy para dar vuelto. Puedes completarlo más tarde.')}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={16} /></button>
        </div>
        <label className="mt-5 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{t('Monto')}</span>
          <input
            autoFocus
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && valid && onSubmit({ amount: numeric, assignedToId: assignedToId || null, note: note || null, ...scopeParams })}
            placeholder="500.00"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold tabular-nums text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            data-testid="cash-float-amount"
          />
        </label>
        {employees.length > 0 && (
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{t('¿A quién se lo entregas?')} <span className="font-normal normal-case text-gray-400">({t('opcional')})</span></span>
            <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500" data-testid="cash-float-assignee">
              <option value="">{t('Queda en caja (yo mismo)')}</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </label>
        )}
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{t('Nota')} <span className="font-normal normal-case text-gray-400">({t('opcional')})</span></span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder={t('p. ej. en monedas y billetes de 10')} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500" />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">{t('Cancelar')}</button>
          <button
            disabled={!valid || pending}
            onClick={() => onSubmit({ amount: numeric, assignedToId: assignedToId || null, note: note || null, ...scopeParams })}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="cash-float-save"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {hasFloat ? t('Completar') : t('Registrar')}
          </button>
        </div>
      </div>
    </div>
  )
}
