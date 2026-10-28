import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, RotateCcw } from 'lucide-react'
import { useT } from '../../i18n'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/handleApiError'
import { emptyDigits } from '../../utils/emailCode'
import { changeEmailBeforeVerify, requestEmailChange, confirmEmailChange } from '../../utils/emailChange'
import CodeBoxes from './CodeBoxes'

const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 placeholder-gray-400'
const errorBoxCls = 'rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700'

const makeSchema = (t) => z.object({
  newEmail: z.string().trim().min(1, t('Escribe el correo nuevo.')).email(t('Ese correo no es válido.')),
  password: z.string().min(1, t('Escribe tu contraseña.')),
})

/**
 * «Cambiar correo» (web 1.27.0 · API 1.18.0, EMAIL-CHANGE-SPEC.md).
 * - `verified={false}` (pantalla del código): un paso, «Cambiar y enviar código»; el correo cambia
 *   al momento y `onChanged(email)` deja la pantalla con el correo nuevo.
 * - `verified` (Ajustes › Mi perfil): paso 1 correo + contraseña → «Enviar código»; paso 2 las 6
 *   casillas, «Reenviar código» (repite el paso 1 con los mismos datos) y `onChanged(email)` al confirmar.
 * En los dos, la sesión nueva que devuelve el API reemplaza a la vieja (AuthContext.replaceSession).
 */
export default function ChangeEmailDialog({ verified = false, currentEmail, onClose, onChanged }) {
  const t = useT()
  const { replaceSession } = useAuth()
  const schema = useMemo(() => makeSchema(t), [t])
  const deps = { api, replaceSession, t, fallback: getErrorMessage }

  const [step, setStep] = useState(1)
  const [sent, setSent] = useState(null)        // { newEmail, password } del paso 1, para «Reenviar código»
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState('')
  const [notice, setNotice] = useState('')
  const [show, setShow] = useState(false)
  const [digits, setDigits] = useState(emptyDigits)
  const [codeError, setCodeError] = useState('')
  const boxes = useRef(null)
  const lastTried = useRef('')

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newEmail: '', password: '' },
  })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const showFailure = (r) => {
    if (r.field === 'email' || r.field === 'password') setError(r.field === 'email' ? 'newEmail' : 'password', { message: r.message })
    else setBanner(r.message)
  }

  // ── Paso 1 ────────────────────────────────────────────────────────────────
  const onSubmit = async (values) => {
    setBusy(true)
    setBanner('')
    if (!verified) {
      const r = await changeEmailBeforeVerify(deps, values)
      setBusy(false)
      if (!r.ok) return showFailure(r)
      onChanged?.(r.email)
      onClose()
      return
    }
    const r = await requestEmailChange(deps, values)
    setBusy(false)
    if (!r.ok) return showFailure(r)
    setSent({ newEmail: r.newEmail, password: values.password })
    setStep(2)
  }
  useEffect(() => { if (step === 2) boxes.current?.focus(0) }, [step])

  // ── Paso 2 (Ajustes) ──────────────────────────────────────────────────────
  const submitCode = async (code, { force = false } = {}) => {
    if (busy || (!force && code === lastTried.current)) return
    lastTried.current = code
    setBusy(true)
    setCodeError('')
    setBanner('')
    setNotice('')
    const r = await confirmEmailChange(deps, code)
    if (r.ok) { onChanged?.(r.email ?? sent.newEmail); onClose(); return }
    setBusy(false)
    if (r.field === 'code') setCodeError(r.message)
    else setBanner(r.message)
    if (r.clearDigits) {
      setDigits(emptyDigits())
      lastTried.current = ''
      boxes.current?.focus(0)
    }
  }

  const resend = async () => {
    setBusy(true)
    setCodeError('')
    setBanner('')
    setNotice('')
    const r = await requestEmailChange(deps, sent)
    setBusy(false)
    if (!r.ok) {
      // La contraseña o el correo ya no valen (p. ej. alguien se registró con él): de vuelta al paso 1.
      if (r.field === 'email' || r.field === 'password') { setStep(1); showFailure(r) } else setBanner(r.message)
      return
    }
    setDigits(emptyDigits())
    lastTried.current = ''
    setNotice(t('Te mandamos un código a {email}.', { email: r.newEmail }))
    boxes.current?.focus(0)
  }

  const title = t('Cambiar correo')
  return createPortal(
    <div className="fixed inset-0 z-[100] flex h-[100dvh] items-center justify-center overflow-y-auto bg-black/50 px-4 py-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
      onMouseDown={() => !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="change-email-title" data-testid="change-email-dialog"
        className="my-auto w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:p-6"
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Mail size={19} /></span>
          <h3 id="change-email-title" className="text-lg font-extrabold text-gray-900">{title}</h3>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-3">
            <div>
              <label htmlFor="change-email-new" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Correo nuevo')}</label>
              <input id="change-email-new" {...register('newEmail')} type="email" autoComplete="email" autoFocus
                data-testid="change-email-new" className={inputCls} />
              {errors.newEmail && <p className="mt-1 text-xs font-medium text-red-600" data-testid="change-email-new-error">{errors.newEmail.message}</p>}
            </div>
            <div>
              <label htmlFor="change-email-password" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Tu contraseña')}</label>
              <div className="relative">
                <input id="change-email-password" {...register('password')} type={show ? 'text' : 'password'} autoComplete="current-password"
                  data-testid="change-email-password" className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShow((v) => !v)} tabIndex={-1}
                  aria-label={show ? t('Ocultar contraseña') : t('Mostrar contraseña')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs font-medium text-red-600" data-testid="change-email-password-error">{errors.password.message}</p>}
            </div>
            {banner && <div className={errorBoxCls} role="alert" data-testid="change-email-error">{banner}</div>}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
              <button type="button" onClick={onClose} disabled={busy}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                {t('Cancelar')}
              </button>
              <button type="submit" disabled={busy} data-testid="change-email-submit"
                className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                {busy && <Loader2 size={15} className="animate-spin" />}
                {verified ? t('Enviar código') : t('Cambiar y enviar código')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} noValidate className="mt-4 space-y-4" data-testid="change-email-code-step">
            <div className="space-y-1 text-sm text-gray-600">
              <p>{t('Te mandamos un código a {email}.', { email: sent?.newEmail })}</p>
              <p className="text-xs text-gray-500">{t('Hasta que pongas el código, tu cuenta sigue con {email}.', { email: currentEmail })}</p>
            </div>
            <CodeBoxes ref={boxes} digits={digits} disabled={busy} error={codeError} testIdPrefix="change-email-digit"
              onDigits={(next) => { setCodeError(''); setDigits(next) }} onComplete={submitCode} />
            {busy && (
              <p className="flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 size={14} className="animate-spin" /> {t('Comprobando...')}</p>
            )}
            {(codeError || banner) && <div className={errorBoxCls} role="alert" data-testid="change-email-error">{codeError || banner}</div>}
            {notice && !codeError && !banner && <p className="text-center text-xs font-medium text-emerald-700" role="status">{notice}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={onClose} disabled={busy}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                {t('Cancelar')}
              </button>
              <button type="button" onClick={resend} disabled={busy} data-testid="change-email-resend"
                className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                <RotateCcw size={15} /> {t('Reenviar código')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
