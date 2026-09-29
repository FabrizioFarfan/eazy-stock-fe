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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" data-testid="logout-confirm"
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <LogOut size={26} />
          </div>
          <h3 className="mt-4 text-lg font-extrabold text-gray-900">{t('¿Cerrar sesión?')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.name ? t('Vas a salir de la cuenta de {name}.', { name: user.name }) : t('Vas a salir de tu cuenta.')}{' '}
            {t('Para volver a entrar necesitarás tu correo y contraseña.')}
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
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
