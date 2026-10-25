import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Store, Loader2, Lock, Users, X } from 'lucide-react'
import { useT } from '../../i18n'
import { defaultKeep, keepPayload, validateKeep, toggleId, countedEmployees } from '../../utils/planKeep'

/**
 * Bajar de plan (web 1.23.0 · API 1.16.0, PLANS-SPEC.md): con `downgrade-preview.needsSelection`,
 * antes de abrir Checkout el dueño elige qué negocios y trabajadores quedan activos; el resto
 * pasa a solo lectura / desactivado y nada se borra. También sirve para corregirlo después
 * con el plan actual (PUT active-set). `onConfirm(keep)` recibe { businessIds, employeeIds }.
 */
export default function KeepSelectionModal({ preview, planName, confirmLabel, busy = false, serverError = '', onConfirm, onClose }) {
  const t = useT()
  const [keep, setKeep] = useState(() => defaultKeep(preview))

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const maxB = preview.maxBusinesses
  const maxE = preview.maxEmployeesPerBusiness
  const invalid = validateKeep(preview, keep)
  const unlimitedB = maxB == null
  const unlimitedE = maxE == null

  const errorText = !invalid ? '' : invalid.code === 'NO_BUSINESS'
    ? t('Elige al menos un negocio.')
    : invalid.code === 'TOO_MANY_BUSINESSES'
      ? t('Como mucho {n} negocio(s) con este plan.', { n: maxB })
      : t('Como mucho {n} trabajadores en {name}.', { n: maxE, name: preview.businesses.find((b) => b.id === invalid.businessId)?.name ?? '' })

  const intro = unlimitedB
    ? t('Tu plan nuevo admite negocios ilimitados y {m} trabajadores por negocio. Elige qué queda activo; el resto pasa a solo lectura y nada se borra.', { m: maxE })
    : unlimitedE
      ? t('Tu plan nuevo admite {n} negocio(s) y trabajadores ilimitados. Elige qué queda activo; el resto pasa a solo lectura y nada se borra.', { n: maxB })
      : t('Tu plan nuevo admite {n} negocio(s) y {m} trabajadores por negocio. Elige qué queda activo; el resto pasa a solo lectura y nada se borra.', { n: maxB, m: maxE })

  return createPortal(
    <div className="fixed inset-0 z-[100] flex h-[100dvh] items-center justify-center overflow-y-auto bg-black/50 px-4 py-4 backdrop-blur-sm"
      onMouseDown={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" data-testid="keep-selection-modal"
        className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Lock size={20} /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold text-gray-900">{planName ? t('Elige qué queda activo con {plan}', { plan: planName }) : t('Elige qué queda activo')}</h3>
            <p className="mt-1 text-sm text-gray-500">{intro}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label={t('Cerrar')}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={16} /></button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5 sm:p-6">
          {preview.businesses.map((b) => {
            const on = keep.businessIds.includes(b.id)
            const emps = countedEmployees(b)
            const chosen = emps.filter((e) => keep.employeeIds.includes(e.id)).length
            const over = !unlimitedE && chosen > maxE
            return (
              <div key={b.id} className={`rounded-2xl border p-3.5 transition-colors ${on ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white'}`} data-testid={`keep-business-${b.id}`}>
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={on} disabled={busy}
                    onChange={() => setKeep((k) => ({ ...k, businessIds: toggleId(k.businessIds, b.id) }))}
                    className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                  <Store size={15} className="flex-shrink-0 text-gray-400" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900">{b.name}</span>
                  {!on && <span className="flex-shrink-0 rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">{t('Solo lectura')}</span>}
                </label>
                {on && emps.length > 0 && (
                  <div className="mt-3 border-t border-blue-100 pt-3">
                    <p className={`mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${over ? 'text-red-500' : 'text-gray-400'}`}>
                      <Users size={11} /> {unlimitedE ? t('Trabajadores') : t('Trabajadores: {n} de {max}', { n: chosen, max: maxE })}
                    </p>
                    <div className="space-y-1.5">
                      {emps.map((e) => {
                        const checked = keep.employeeIds.includes(e.id)
                        return (
                          <label key={e.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-white">
                            <input type="checkbox" checked={checked} disabled={busy}
                              onChange={() => setKeep((k) => ({ ...k, employeeIds: toggleId(k.employeeIds, e.id) }))}
                              className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                            <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{e.name} <span className="text-xs text-gray-400">· {e.email}</span></span>
                            {!checked && <span className="flex-shrink-0 text-[11px] font-semibold text-amber-600">{t('Desactivado')}</span>}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="border-t border-gray-100 p-5 sm:p-6">
          {(errorText || serverError) && (
            <p className="mb-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600 ring-1 ring-red-100" role="alert">{errorText || serverError}</p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={onClose} disabled={busy}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              {t('Cancelar')}
            </button>
            <button type="button" onClick={() => onConfirm(keepPayload(preview, keep))} disabled={busy || !!invalid} data-testid="keep-selection-confirm"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-60">
              {busy && <Loader2 size={15} className="animate-spin" />} {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
