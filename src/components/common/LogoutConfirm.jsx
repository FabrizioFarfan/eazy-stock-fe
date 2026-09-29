import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'

/**
 * Confirmación antes de cerrar sesión (Frank, 29-sep: un toque en el ícono de
 * salir te sacaba de golpe). En portal para tapar todo, sidebar incluido.
 */
export default function LogoutConfirm({ open, onClose }) {
  const t = useT()
  const { user, logout } = useAuth()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  if (!open) return null
  const go = async () => {
    setBusy(true)
    try { await logout() } finally { setBusy(false) }
  }

  return createPortal(
    // Tarjeta centrada con márgenes en TODOS los tamaños: la hoja pegada abajo
    // quedaba bajo la barra del navegador / la raya del iPhone (Frank, 29-sep).
    // dvh + safe-area para la altura REAL visible del celular.
    <div className="fixed inset-0 z-[100] flex h-[100dvh] items-center justify-center overflow-y-auto bg-black/50 px-4 py-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
      onMouseDown={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" data-testid="logout-confirm"
        className="my-auto w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:p-6"
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 sm:h-14 sm:w-14">
            <LogOut size={26} />
          </div>
          <h3 className="mt-3 text-lg font-extrabold text-gray-900">{t('¿Cerrar sesión?')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.name ? t('Vas a salir de la cuenta de {name}.', { name: user.name }) : t('Vas a salir de tu cuenta.')}{' '}
            {t('Para volver a entrar necesitarás tu correo y contraseña.')}
          </p>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row">
          <button type="button" onClick={onClose} disabled={busy} autoFocus
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            {t('Seguir aquí')}
          </button>
          <button type="button" onClick={go} disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
            {t('Sí, cerrar sesión')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
