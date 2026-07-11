import { useEffect, useRef, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

/**
 * Panel lateral de ayuda contextual. Un botón (?) abre un drawer a la derecha
 * con el contenido específico del paso. Se cierra con la X, click afuera o Esc.
 *
 * Uso:
 *   <HelpDrawer title="...">  ...contenido JSX...  </HelpDrawer>
 *
 * `autoOpenKey`: si se pasa, el drawer se abre solo la PRIMERA vez que el
 * usuario llega a este paso. El "visto" se persiste POR USUARIO en el BE
 * (con migración de los flags viejos de localStorage) — así no se repite
 * entre dispositivos ni después de un deploy.
 */
export default function HelpDrawer({ title = '¿Cómo funciona esto?', buttonLabel = '¿Cómo funciona?', autoOpenKey = null, children }) {
  const { seenTutorials, markTutorialSeen } = useAuth()
  const [open, setOpen] = useState(false)
  const autoOpenedRef = useRef(false)

  // Auto-apertura de primera vez: espera a que el set de vistos cargue del BE
  useEffect(() => {
    if (!autoOpenKey || autoOpenedRef.current) return
    if (!seenTutorials || seenTutorials.has(autoOpenKey)) return
    autoOpenedRef.current = true
    setOpen(true)
    markTutorialSeen(autoOpenKey)
  }, [autoOpenKey, seenTutorials, markTutorialSeen])

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
