import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { CalendarClock, Eye, EyeOff, Loader2, Trash2, UserX } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useT } from '../../i18n'
import HelpDrawer from '../common/HelpDrawer'
import { accountApi } from '../../services/endpoints/account'
import { getErrorCode, getErrorMessage } from '../../utils/handleApiError'
import { saveDeletionNotice } from '../../utils/deletionNotice'

const inputCls = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder-gray-400'

/** Qué se borra, según quién pide el borrado (el dueño se lleva el negocio entero). */
function WhatGetsDeleted({ isOwner }) {
  const t = useT()
  return isOwner ? (
    <>
      <p>{t('Se borran tu cuenta y tu negocio con todos sus datos: productos, stock, ventas, clientes, fiado, proveedores y empleados. Si tienes más negocios, también.')}</p>
      <p>{t('Tus empleados dejan de poder entrar desde ese momento.')}</p>
    </>
  ) : (
    <p>{t('Se borra solo tu usuario. Las ventas que hiciste se quedan en el negocio y el dueño las sigue viendo.')}</p>
  )
}

function ConfirmDeletion({ isOwner, onClose }) {
  const t = useT()
  const { endSessionLocally } = useAuth()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const submit = async (e) => {
    e.preventDefault()
    if (!password) { setError(t('Escribe tu contraseña para confirmar')); return }
    setBusy(true)
    setError('')
    try {
      const res = await accountApi.requestDeletion(password)
      const data = res.data?.data ?? res.data ?? {}
      saveDeletionNotice({ deletionScheduledAt: data.deletionScheduledAt, role: data.role ?? (isOwner ? 'OWNER' : 'EMPLOYEE') })
      // El BE ya revocó los tokens: se cierra la sesión aquí y el login muestra la fecha.
      endSessionLocally()
    } catch (err) {
      setError(getErrorCode(err) === 'WRONG_PASSWORD' ? t('La contraseña no es correcta.') : getErrorMessage(err))
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex h-[100dvh] items-center justify-center overflow-y-auto bg-black/50 px-4 py-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
      onMouseDown={() => !busy && onClose()}>
      <form role="dialog" aria-modal="true" aria-labelledby="delete-account-title" data-testid="delete-account-confirm" noValidate
        onSubmit={submit}
        className="my-auto w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:p-6"
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 sm:h-14 sm:w-14">
            <UserX size={26} />
          </div>
          <h3 id="delete-account-title" className="mt-3 text-lg font-extrabold text-gray-900">{t('¿Eliminar tu cuenta?')}</h3>
        </div>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
          <WhatGetsDeleted isOwner={isOwner} />
          {isOwner && <p>{t('Tu suscripción se cancela en ese momento: no se te vuelve a cobrar. Lo ya pagado no se devuelve.')}</p>}
        </div>
        <div className="mt-3 flex gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          <CalendarClock size={17} className="mt-0.5 flex-shrink-0" />
          <p>{t('Tienes 30 días para arrepentirte: en ese tiempo nadie puede usar la cuenta y, si vuelves a entrar con tu correo y contraseña, la reactivamos. Pasados los 30 días se borra para siempre.')}</p>
        </div>
        <div className="mt-4">
          <label htmlFor="delete-account-password" className="mb-1.5 block text-sm font-medium text-gray-700">{t('Escribe tu contraseña para confirmar')}</label>
          <div className="relative">
            <input id="delete-account-password" type={show ? 'text' : 'password'} value={password} autoFocus
              autoComplete="current-password" onChange={(e) => { setPassword(e.target.value); setError('') }}
              className={inputCls} />
            <button type="button" onClick={() => setShow((v) => !v)} tabIndex={-1}
              aria-label={show ? t('Ocultar contraseña') : t('Mostrar contraseña')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{error}</p>}
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
          <button type="button" onClick={onClose} disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            {t('No, me quedo')}
          </button>
          <button type="submit" disabled={busy || !password}
            className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {busy ? t('Eliminando...') : t('Sí, eliminar mi cuenta')}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

/**
 * Ajustes › Eliminar mi cuenta (24-oct-2026, API 1.14.0). Dueño y empleado; no BOSS/SUPER_ADMIN.
 * La cuenta queda 30 días pendiente de borrado (sin poder usarse) y se reactiva si vuelve a entrar.
 */
export default function DeleteAccountSection() {
  const t = useT()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  if (user?.isBoss || !['OWNER', 'EMPLOYEE'].includes(user?.role)) return null
  const isOwner = user.role === 'OWNER'

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm" id="delete-account" data-testid="delete-account-section">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500"><UserX size={17} /></span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">{t('Eliminar mi cuenta')}</h3>
            <p className="truncate text-xs text-gray-400">
              {isOwner ? t('Tu cuenta, tu negocio y todos sus datos') : t('Solo tu usuario; las ventas se quedan en el negocio')}
            </p>
          </div>
        </div>
        <HelpDrawer title={t('Eliminar mi cuenta')} buttonLabel={t('Ayuda')}>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">{t('🗑️ Qué se borra')}</p>
            <div className="mt-1 space-y-1"><WhatGetsDeleted isOwner={isOwner} /></div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">{t('🗓️ 30 días para arrepentirte')}</p>
            <p className="mt-1">{t('Al pedirlo se cierra tu sesión y nadie puede usar la cuenta. Te mandamos un correo con la fecha del borrado definitivo, a los 30 días.')}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <p className="font-semibold text-gray-800">{t('↩️ Cómo cancelarlo')}</p>
            <p className="mt-1">{t('Vuelve a entrar con tu correo y contraseña antes de esa fecha: la cuenta se reactiva sola y todo queda como estaba.')}</p>
          </div>
          {isOwner && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="font-semibold text-gray-800">{t('💳 Tu suscripción')}</p>
              <p className="mt-1">{t('Se cancela al pedir el borrado y no se te vuelve a cobrar. Si vuelves, el plan no se reactiva solo: lo eliges de nuevo en Ajustes › Tu plan.')}</p>
            </div>
          )}
          <p>
            <Link to="/eliminar-cuenta" className="font-semibold text-blue-600 hover:underline">{t('Más sobre el borrado de cuentas')} →</Link>
          </p>
        </HelpDrawer>
      </div>
      <div className="px-5">
        <button type="button" onClick={() => setOpen(true)} data-testid="delete-account-open"
          className="group -mx-5 flex w-[calc(100%+2.5rem)] items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-red-50">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 transition-colors group-hover:bg-red-100">
            <Trash2 size={15} className="text-red-500" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-red-500">{t('Eliminar mi cuenta')}</span>
            <p className="text-xs text-gray-400">{t('Se borra a los 30 días; si vuelves a entrar antes, se cancela')}</p>
          </div>
        </button>
      </div>
      {open && <ConfirmDeletion isOwner={isOwner} onClose={() => setOpen(false)} />}
    </div>
  )
}
