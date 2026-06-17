import { useEffect, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

/**
 * Panel lateral de ayuda contextual. Un botón (?) abre un drawer a la derecha
 * con el contenido específico del paso. Se cierra con la X, click afuera o Esc.
 *
 * Uso:
 *   <HelpDrawer title="...">  ...contenido JSX...  </HelpDrawer>
 */
export default function HelpDrawer({ title = '¿Cómo funciona esto?', buttonLabel = '¿Cómo funciona?', children }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Abrir ayuda de este paso"
        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <HelpCircle size={15} />
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <HelpCircle size={18} className="text-blue-600" />
                {title}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-gray-600">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
