import { useState } from 'react'
import { MailCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'
import { authApi } from '../../services/endpoints/auth'
import { getErrorMessage } from '../../utils/handleApiError'

const DISMISS_KEY = 'eazystock_verify_banner_dismissed'

/**
 * Franja discreta bajo el Topbar (22-oct-2026) cuando el usuario aún no confirmó su correo.
 * No bloquea nada; se cierra por sesión (sessionStorage) y permite reenviar el enlace.
 */
export default function EmailVerifyBanner() {
  const t = useT()
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })
  const [sending, setSending] = useState(false)

  if (!user || user.emailVerified !== false || dismissed) return null

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* storage bloqueado */ }
    setDismissed(true)
  }

  const resend = async () => {
    setSending(true)
    try {
      await authApi.resendVerification()
      toast.success(t('Te mandamos otro enlace a {email}. Revisa también el spam.', { email: user.email }))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div role="status" className="flex flex-shrink-0 items-center gap-3 border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200 md:px-6">
      <MailCheck size={14} className="flex-shrink-0" />
      <p className="min-w-0 flex-1 leading-snug">
        {t('Confirma tu correo: te mandamos un enlace a {email}.', { email: user.email })}
        {' '}
        <button type="button" onClick={resend} disabled={sending} className="font-bold underline-offset-2 hover:underline disabled:opacity-60">
          {sending ? t('Enviando...') : t('Reenviar')}
        </button>
      </p>
      <button type="button" onClick={dismiss} aria-label={t('Cerrar')} title={t('Cerrar')}
        className="flex-shrink-0 rounded-lg p-1 hover:bg-white/60 dark:hover:bg-white/10">
        <X size={14} />
      </button>
    </div>
  )
}
