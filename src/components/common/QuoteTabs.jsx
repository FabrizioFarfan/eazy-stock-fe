import { useNavigate } from 'react-router-dom'
import { FilePlus2, History } from 'lucide-react'
import { useT } from '../../i18n'

/**
 * Pestañas de Cotización: «Nueva» / «Historial». Barra completa y bien visible
 * (Frank: el botón de historial «se ve poco»), y a todo el ancho en el celular.
 * `onNavigate` deja que la página intercepte la salida (borrador a medias).
 */
export default function QuoteTabs({ active, onNavigate }) {
  const t = useT()
  const navigate = useNavigate()
  const go = (to) => (onNavigate ? onNavigate(to) : navigate(to))
  const tabs = [
    { key: 'new',     to: '/cotizaciones',           icon: FilePlus2, label: t('Nueva cotización'), short: t('Nueva') },
    { key: 'history', to: '/cotizaciones/historial', icon: History,   label: t('Historial'),        short: t('Historial') },
  ]
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm sm:inline-grid sm:w-auto sm:min-w-[360px]">
      {tabs.map(({ key, to, icon: Icon, label, short }) => {
        const on = key === active
        return (
          <button
            key={key}
            type="button"
            onClick={() => !on && go(to)}
            aria-current={on ? 'page' : undefined}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              on ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon size={16} />
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
