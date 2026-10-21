import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, MailWarning } from 'lucide-react'
import { useT } from '../i18n'
import { usePageSeo } from './landing/site'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/endpoints/auth'
import { getErrorMessage } from '../utils/handleApiError'
import AuthShell, { primaryBtnCls, errorBoxCls } from '../components/common/AuthShell'

/** /verificar?token=… (22-oct-2026): llama al BE al abrir, muestra el resultado y un enlace a entrar. */
export default function VerifyEmailPage() {
  const t = useT()
  usePageSeo({ title: t('Confirmar correo — Eazy Stock'), description: t('Correo confirmado'), path: '/verificar' })
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { token: session, user, refreshUser } = useAuth()
  const [state, setState] = useState(token ? 'loading' : 'error')
  const [error, setError] = useState(token ? '' : t('Este enlace no es válido o ya venció. Pide uno nuevo.'))
  const called = useRef(false)

  useEffect(() => {
    if (!token || called.current) return
    called.current = true // StrictMode monta dos veces: el enlace es de un solo uso
    authApi.verifyEmail(token)
      .then(() => { setState('ok'); if (session) refreshUser() })
      .catch((err) => { setError(getErrorMessage(err)); setState('error') })
  }, [token, session, refreshUser])

  const home = user ? (user.isBoss ? '/boss' : user.role === 'EMPLOYEE' ? '/sales/new' : '/dashboard') : '/login'

  if (state === 'loading') {
    return (
      <AuthShell title={t('Confirmando tu correo...')}>
        <div className="flex justify-center py-4 text-blue-600"><Loader2 size={28} className="animate-spin" /></div>
      </AuthShell>
    )
  }

  if (state === 'ok') {
    return (
      <AuthShell title={t('Correo confirmado')} subtitle={t('Gracias. Ya podemos avisarte de lo importante y mandarte tus recibos.')}>
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </span>
          <Link to={home} className={`${primaryBtnCls} block text-center`}>{session ? t('Ir a la app') : t('Ingresar')}</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('No pudimos confirmar tu correo')} subtitle={t('Los enlaces valen 24 horas y se usan una sola vez.')}>
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <MailWarning size={22} />
        </span>
        <div className={errorBoxCls}>{error}</div>
        <p className="text-sm text-gray-600">{t('Entra a tu cuenta y toca «Reenviar» en la franja de arriba para recibir otro.')}</p>
        <Link to={home} className={`${primaryBtnCls} block text-center`}>{session ? t('Ir a la app') : t('Ingresar')}</Link>
      </div>
    </AuthShell>
  )
}
