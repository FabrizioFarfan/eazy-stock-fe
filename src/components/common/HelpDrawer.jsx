import { useEffect, useRef, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'

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
export default function HelpDrawer({ title, buttonLabel, autoOpenKey = null, children }) {
  const { seenTutorials, markTutorialSeen } = useAuth()
  const t = useT()
  const resolvedTitle  = title ?? t('¿Cómo funciona esto?')
  const resolvedButton = buttonLabel ?? t('¿Cómo funciona?')
  const [open, setOpen] = useState(false)
  const autoOpenedRef = useRef(false)
  const panelRef = useRef(null)

  // Frank (4-nov-2026): «hago clic en el menú y no me lleva». El panel se abría solo la primera vez y su fondo
  // se tragaba el primer clic (solo cerraba). Ahora el fondo NO bloquea: un clic fuera cierra el panel Y llega
  // a donde ibas (el menú, un botón…).
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('touchstart', onDown, true)
    return () => { document.removeEventListener('mousedown', onDown, true); document.removeEventListener('touchstart', onDown, true) }
  }, [open])

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
        title={t('Abrir ayuda de este paso')}
        className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <HelpCircle size={15} />
        {resolvedButton}
      </button>

      {open && (
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-end bg-black/25" data-testid="help-drawer">
          <div
            ref={panelRef}
            className="pointer-events-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <HelpCircle size={18} className="text-blue-600" />
                {resolvedTitle}
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label={t('Cerrar')}
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
