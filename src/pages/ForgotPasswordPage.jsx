import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useT } from '../i18n'
import { usePageSeo } from './landing/site'
import { authApi } from '../services/endpoints/auth'
import { getErrorMessage } from '../utils/handleApiError'
import AuthShell, { inputCls, primaryBtnCls, errorBoxCls } from '../components/common/AuthShell'

/** «¿Olvidaste tu contraseña?» (22-oct-2026): pide el correo y responde siempre lo mismo. */
export default function ForgotPasswordPage() {
  const t = useT()
  usePageSeo({ title: t('Recuperar contraseña — Eazy Stock'), description: t('Escribe tu correo y te mandamos un enlace para elegir una nueva.'), path: '/olvide' })
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={t('¿Olvidaste tu contraseña?')}
      subtitle={t('Escribe tu correo y te mandamos un enlace para elegir una nueva.')}
      footer={<>{t('¿La recordaste?')}{' '}<Link to="/login" className="font-semibold text-blue-600 hover:underline">{t('Ingresar')}</Link></>}
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <MailCheck size={22} />
          </span>
          <p className="text-sm text-gray-700">
            {t('Si ese correo tiene una cuenta, ya te mandamos el enlace. Vale 1 hora. Revisa también el spam.')}
          </p>
          <Link to="/login" className={`${primaryBtnCls} block text-center`}>{t('Volver a ingresar')}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">{t('Correo electrónico')}</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t('usuario@empresa.com')} required autoComplete="email" autoFocus className={inputCls} />
          </div>
          {error && <div className={errorBoxCls}>{error}</div>}
          <button type="submit" disabled={submitting || !email.trim()} className={primaryBtnCls}>
            {submitting ? t('Enviando...') : t('Mandarme el enlace')}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
