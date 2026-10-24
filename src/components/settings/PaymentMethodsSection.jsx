import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, GripVertical, Loader2, Pencil, Plus, Trash2, Wallet, X } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '../../i18n'
import HelpDrawer from '../common/HelpDrawer'
import {
  usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod,
  useReorderPaymentMethods, useDeletePaymentMethod,
} from '../../hooks/usePaymentMethods'
import { paymentMethodIcon } from '../../utils/paymentMethods'
import { getErrorCode, getErrorMessage } from '../../utils/handleApiError'

const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'

/** Mensaje de cada error del API de medios de pago (el código manda sobre el texto del BE). */
function methodError(t, err) {
  switch (getErrorCode(err)) {
    case 'PAYMENT_METHOD_IN_USE':        return t('Ya se usó en ventas: desactívalo')
    case 'PAYMENT_METHOD_DUPLICATE':     return t('Ya tienes un medio de pago con ese nombre')
    case 'PAYMENT_METHOD_CASH_REQUIRED': return t('El efectivo no se puede desactivar ni borrar: es lo que cuenta la caja')
    default:                             return getErrorMessage(err)
  }
}

/**
 * Ajustes › Medios de pago (multi-país, 24-oct-2026; API 1.13.0). Solo el dueño.
 * Lo que aquí queda activo, y en este orden, son los botones de «¿Cómo pagó?»
 * al vender. El efectivo (`cash`) no se desactiva ni se borra: es el que cuenta
 * para «Debe haber en caja». Uno ya usado en ventas no se borra (409): se desactiva.
 */
export default function PaymentMethodsSection() {
  const t = useT()
  const { data, isLoading, isError } = usePaymentMethods({ includeInactive: true })
  const createM  = useCreatePaymentMethod()
  const updateM  = useUpdatePaymentMethod()
  const reorderM = useReorderPaymentMethods()
  const deleteM  = useDeletePaymentMethod()

  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(null)   // { id, name }
  const [order, setOrder]     = useState(null)   // orden optimista mientras guarda
  const [dragIdx, setDragIdx] = useState(null)
  const [busyId, setBusyId]   = useState(null)

  const list = order ?? data ?? []

  const add = async (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    try {
      await createM.mutateAsync({ name })
      setNewName('')
      toast.success(t('«{name}» agregado', { name }))
    } catch (err) { toast.error(methodError(t, err)) }
  }

  const saveName = async () => {
    const name = editing?.name.trim()
    if (!name) return
    try {
      await updateM.mutateAsync({ id: editing.id, data: { name } })
      setEditing(null)
    } catch (err) { toast.error(methodError(t, err)) }
  }

  const toggle = async (m) => {
    setBusyId(m.id)
    try { await updateM.mutateAsync({ id: m.id, data: { active: !m.active } }) }
    catch (err) { toast.error(methodError(t, err)) }
    finally { setBusyId(null) }
  }

  const remove = async (m) => {
    if (!confirm(t('¿Borrar «{name}»?', { name: m.name }))) return
    setBusyId(m.id)
    try {
      await deleteM.mutateAsync(m.id)
      toast.success(t('«{name}» borrado', { name: m.name }))
    } catch (err) { toast.error(methodError(t, err)) }
    finally { setBusyId(null) }
  }

  const reorder = (from, to) => {
    if (from === to || to < 0 || to >= list.length) return
    const next = [...list]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOrder(next)
    reorderM.mutate(next.map((m) => m.id), {
      onError: (err) => toast.error(methodError(t, err)),
      onSettled: () => setOrder(null),
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm" id="payment-methods" data-testid="payment-methods-section">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Wallet size={17} /></span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">{t('Medios de pago')}</h3>
            <p className="truncate text-xs text-gray-400">{t('Los botones de «¿Cómo pagó?» al vender')}</p>
          </div>
        </div>
        <HelpDrawer title={t('Medios de pago')} buttonLabel={t('Ayuda')}>
          <p>{t('Son los botones que ve quien cobra en «¿Cómo pagó?», en este mismo orden. Vienen los de tu país y los cambias cuando quieras.')}</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">{t('✏️ Renombrar y agregar')}</p>
            <p className="mt-1">{t('Toca el lápiz para cambiarle el nombre. Las ventas ya hechas guardan el nombre que tenía ese día; el cierre de caja las suma con el nombre nuevo.')}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">{t('↕️ Ordenar')}</p>
            <p className="mt-1">{t('Con las flechas (o arrastrando la fila en la computadora) pones primero los que más usas.')}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">{t('🚫 Desactivar o borrar')}</p>
            <p className="mt-1">{t('Desactivado, el medio deja de salir al cobrar pero sigue en el historial y en los filtros. Solo se borra uno que nunca se usó en una venta; si ya se usó, desactívalo.')}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">{t('💵 Efectivo')}</p>
            <p className="mt-1">{t('El efectivo siempre está: es el que cuenta para «Debe haber en caja». Puedes renombrarlo, pero no desactivarlo ni borrarlo.')}</p>
          </div>
        </HelpDrawer>
      </div>

      <div className="px-5 py-3">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> {t('Cargando...')}</div>
        ) : isError ? (
          <p className="py-4 text-sm text-red-500">{t('No pudimos cargar los medios de pago.')}</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {list.map((m, i) => {
              const { Icon, cls } = paymentMethodIcon(m)
              const isEditing = editing?.id === m.id
              return (
                <li key={m.id} data-testid="payment-method-row" data-name={m.name}
                  draggable={!isEditing}
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIdx != null) reorder(dragIdx, i); setDragIdx(null) }}
                  onDragEnd={() => setDragIdx(null)}
                  className={`flex items-center gap-2 py-2.5 ${dragIdx === i ? 'opacity-50' : ''}`}>
                  <GripVertical size={14} className="hidden flex-shrink-0 cursor-grab text-gray-300 sm:block" aria-hidden />
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${m.active ? cls : 'bg-gray-100 text-gray-300'}`}><Icon size={15} /></span>

                  {isEditing ? (
                    <form className="flex min-w-0 flex-1 items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); saveName() }}>
                      <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={40} autoFocus
                        aria-label={t('Nombre')} className={inputCls}
                        onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null) }} />
                      <button type="submit" disabled={updateM.isPending || !editing.name.trim()} title={t('Guardar')}
                        className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"><Check size={15} /></button>
                      <button type="button" onClick={() => setEditing(null)} title={t('Cancelar')}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X size={15} /></button>
                    </form>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${m.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{t(m.name)}</p>
                      <p className="truncate text-[11px] text-gray-400">
                        {[m.cash && t('Cuenta para la caja'), !m.active && t('Desactivado'), m.usedInSales && t('Usado en ventas')].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex flex-shrink-0 items-center">
                      <button type="button" onClick={() => reorder(i, i - 1)} disabled={i === 0 || reorderM.isPending} title={t('Subir')} aria-label={t('Subir')}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"><ArrowUp size={14} /></button>
                      <button type="button" onClick={() => reorder(i, i + 1)} disabled={i === list.length - 1 || reorderM.isPending} title={t('Bajar')} aria-label={t('Bajar')}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"><ArrowDown size={14} /></button>
                      <button type="button" onClick={() => setEditing({ id: m.id, name: m.name })} title={t('Renombrar')} aria-label={t('Renombrar')}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={14} /></button>
                      {!m.cash && (
                        <>
                          <button type="button" onClick={() => toggle(m)} disabled={busyId === m.id} data-testid="payment-method-toggle"
                            className={`ml-1 rounded-lg px-2 py-1 text-[11px] font-bold disabled:opacity-50 ${m.active ? 'text-gray-500 hover:bg-gray-100' : 'text-emerald-700 hover:bg-emerald-50'}`}>
                            {m.active ? t('Desactivar') : t('Activar')}
                          </button>
                          <button type="button" onClick={() => remove(m)} disabled={busyId === m.id || m.usedInSales}
                            title={m.usedInSales ? t('Ya se usó en ventas: desactívalo') : t('Borrar')} aria-label={t('Borrar')}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <form onSubmit={add} className="flex items-center gap-2 border-t border-gray-100 py-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40}
            placeholder={t('Nuevo medio (ej. Tarjeta de crédito)')} aria-label={t('Nuevo medio de pago')} className={inputCls} data-testid="payment-method-new" />
          <button type="submit" disabled={createM.isPending || !newName.trim()}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-60">
            {createM.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {t('Agregar')}
          </button>
        </form>
      </div>
    </div>
  )
}
