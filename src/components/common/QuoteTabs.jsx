import { useNavigate } from 'react-router-dom'
import { FilePlus2, History } from 'lucide-react'
import { useT } from '../../i18n'

/**
 * Pestañas de Cotización: «Nueva» / «Historial». MISMO diseño que las pestañas
 * de la página Stock (riel gris, la activa en blanco con texto azul) y siempre
 * a todo el ancho — en las dos páginas se ve idéntico, solo cambia cuál está
 * activa. `onNavigate` deja que la página intercepte la salida (borrador a medias).
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
    <div className="flex w-full gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
      {tabs.map(({ key, to, icon: Icon, label, short }) => {
        const on = key === active
        return (
          <button
            key={key}
            type="button"
            onClick={() => !on && go(to)}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              on ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
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
