import { AlertTriangle } from 'lucide-react'
import { useT } from '../../i18n'

/**
 * «¿Salir sin terminar?» para cualquier proceso que arma una lista de productos
 * (venta, cotización, pedido…). El proceso queda GUARDADO al salir — la regla
 * de Frank: el usuario tiene que sentir libertad de ir a mirar otra cosa y
 * volver a donde estaba. Descartar es la opción roja, abajo.
 */
export default function ConfirmLeaveModal({ title, body, leaveLabel, stayLabel, discardLabel, onStay, onLeaveKeep, onDiscard }) {
  const t = useT()
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle size={18} className="text-orange-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{body}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={onLeaveKeep}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {leaveLabel}
          </button>
          <button
            onClick={onStay}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            {stayLabel}
          </button>
          <button
            onClick={onDiscard}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            {discardLabel ?? t('Descartar')}
          </button>
        </div>
      </div>
    </div>
  )
}
