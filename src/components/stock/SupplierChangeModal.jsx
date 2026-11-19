import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Truck } from 'lucide-react'
import { allAnswered } from '../../utils/supplierChanges'
import { useT } from '../../i18n'

/**
 * Al guardar una compra, si algún producto era de OTRO proveedor (William, 19-nov-2026: cambió AQPCcompany por
 * Hetesur y la ficha seguía con el viejo): se pregunta si desde ahora lo trae el nuevo o si es solo esta compra.
 * No hay respuesta marcada de antemano: cambiar el proveedor de la ficha es decisión del dueño. Va por portal
 * porque se abre desde otro modal. `changes` sale de supplierChanges; `onConfirm({ [id]: true | false })`.
 */
export default function SupplierChangeModal({ changes, onConfirm, onCancel }) {
  const t = useT()
  const [answers, setAnswers] = useState({})
  const ready = allAnswered(changes, answers)
  const newSupplier = changes[0]?.newSupplier

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const setAll = (value) => setAnswers(Object.fromEntries(changes.map((c) => [c.id, value])))

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 sm:p-6" data-testid="supplier-change-modal"
      role="dialog" aria-modal="true" aria-labelledby="supplier-change-title">
      <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 id="supplier-change-title" className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Truck size={18} className="flex-shrink-0 text-violet-600" />
            {changes.length === 1 ? t('Este producto era de otro proveedor') : t('{n} productos eran de otro proveedor', { n: changes.length })}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {t('Esta compra es de {supplier}. Dinos si desde ahora te lo trae {supplier} o si es solo por esta vez.', { supplier: newSupplier })}
          </p>
          {changes.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setAll(true)} data-testid="supplier-change-all-yes"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                {t('Todos: desde ahora {supplier}', { supplier: newSupplier })}
              </button>
              <button type="button" onClick={() => setAll(false)} data-testid="supplier-change-all-no"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                {t('Todos: solo esta compra')}
              </button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto px-5 sm:px-6">
          {changes.map((c) => (
            <div key={c.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center" data-testid="supplier-change-row">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{c.name}</p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {c.unassigned ? t('Hasta hoy no tenía proveedor.') : <>{t('Hasta hoy te lo traía')} <span className="font-semibold text-gray-900">{c.oldSupplier ?? t('otro proveedor')}</span></>}
                </p>
              </div>
              <fieldset className="grid min-w-0 gap-1.5 sm:grid-cols-2">
                <legend className="sr-only">{t('¿Cambia de proveedor?')}</legend>
                {[[true, t('Sí, desde ahora me lo trae {supplier}', { supplier: c.newSupplier })],
                  [false, c.unassigned ? t('No, solo esta compra. Sigue sin proveedor') : t('No, solo esta compra. Sigue siendo de {supplier}', { supplier: c.oldSupplier ?? t('otro proveedor') })]].map(([value, label]) => (
                  <label key={String(value)} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    answers[c.id] === value ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    <input type="radio" name={`supplier-${c.id}`} checked={answers[c.id] === value} data-testid={value ? 'supplier-change-yes' : 'supplier-change-no'}
                      onChange={() => setAnswers((a) => ({ ...a, [c.id]: value }))} className="h-4 w-4 flex-shrink-0 text-blue-600" />
                    {label}
                  </label>
                ))}
              </fieldset>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-gray-500">
            {ready ? t('El stock se suma igual en los dos casos.') : t('Elige una opción en cada producto para seguir.')}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:flex-none">
              {t('Volver a la compra')}
            </button>
            <button type="button" onClick={() => onConfirm(answers)} disabled={!ready} data-testid="supplier-change-confirm"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
              <Check size={15} /> {t('Seguir')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
