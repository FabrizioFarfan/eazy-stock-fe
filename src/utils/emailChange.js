// Cambiar el correo (web 1.27.0 · API 1.18.0, eazy-stock-be/docs/EMAIL-CHANGE-SPEC.md).
// Lógica pura de las dos rutas, sin React (se prueba con node --test pasándole un api falso):
//   A. pantalla del código (correo sin confirmar): POST /auth/verify/change-email → sesión nueva al momento.
//   B. Ajustes › Mi perfil (ya confirmado): POST /me/email/change → código al correo nuevo →
//      POST /me/email/confirm → sesión nueva.
import { RESEND_WAIT_S, emptyDigits, codeErrorMessage, clearsDigits, retryAfterOf } from './emailCode.js'

/** Correo escrito → como lo guarda el API (sin espacios, minúsculas). */
export const cleanEmail = (s) => String(s ?? '').trim().toLowerCase()

/** `data` del ApiResponse (`{ success, message, data }`) o el cuerpo tal cual. */
const unwrap = (res) => res?.data?.data ?? res?.data

/**
 * Error del API → `{ field, message }` traducido por `code` (la web no usa el `message` en español).
 * `field` = 'email' | 'password' | 'code' | null (null → banner). El 400 INVALID_FIELD de @Valid
 * marca `newEmail`: va al campo del correo. Devuelve null si el código no es de este flujo.
 */
export function emailChangeError(t, body) {
  const code = body?.code
  const field = body?.field === 'newEmail' ? 'email' : (body?.field ?? null)
  const minutes = () => {
    const s = retryAfterOf(body)
    return s ? Math.max(1, Math.ceil(s / 60)) : null
  }
  switch (code) {
    case 'WRONG_PASSWORD':           return { field: 'password', message: t('La contraseña no es correcta.') }
    case 'INVALID_EMAIL':            return { field: 'email', message: t('Ese correo no es válido.') }
    case 'EMAIL_DISPOSABLE':         return { field: 'email', message: t('Usa un correo permanente, no uno temporal.') }
    case 'SAME_EMAIL':               return { field: 'email', message: t('Ese ya es tu correo.') }
    case 'EMAIL_ALREADY_REGISTERED': return { field: 'email', message: t('Ese correo ya tiene una cuenta en Eazy Stock.') }
    case 'TOO_MANY_EMAIL_CHANGES':   return { field: null, message: t('Ya cambiaste el correo 3 veces hoy. Prueba de nuevo más tarde.') }
    // 5 contraseñas mal en 15 min, o el límite de códigos por hora: el mismo aviso.
    case 'TOO_MANY_REQUESTS': {
      const n = minutes()
      return { field: null, message: n ? t('Demasiados intentos. Prueba de nuevo en {n} minutos.', { n }) : t('Demasiados intentos. Prueba de nuevo en unos minutos.') }
    }
    case 'INVALID_FIELD':
      return field === 'email' ? { field, message: t('Ese correo no es válido.') }
        : field === 'password' ? { field, message: t('Escribe tu contraseña.') } : null
    // Paso 2 de Ajustes: errores del código (los mismos que la pantalla del código).
    case 'INVALID_CODE': case 'CODE_LOCKED': case 'CODE_EXPIRED':
      return { field: 'code', message: codeErrorMessage(t, body) }
    default: return null
  }
}

/** Error de axios → `{ field, message }`; lo que no es de este flujo cae en `fallback(err)` (banner). */
function toFailure(t, err, fallback) {
  const body = err?.response?.data
  const mapped = emailChangeError(t, body)
  return { ok: false, code: body?.code ?? null, ...(mapped ?? { field: null, message: fallback(err) }) }
}

/**
 * A. Pantalla del código: cambia el correo al momento y guarda la sesión nueva con `replaceSession`
 * (el JWT lleva el correo: el token viejo deja de valer). Devuelve `{ ok, email }` o
 * `{ ok: false, field, message }`.
 */
export async function changeEmailBeforeVerify({ api, replaceSession, t, fallback }, { newEmail, password }) {
  try {
    const res = await api.post('/auth/verify/change-email', { newEmail: cleanEmail(newEmail), password })
    const auth = unwrap(res)
    await replaceSession(auth)
    return { ok: true, email: auth?.user?.email ?? cleanEmail(newEmail) }
  } catch (err) {
    return toFailure(t, err, fallback)
  }
}

/** Cómo queda la pantalla del código tras cambiar el correo: casillas vacías, 60 s y el aviso. */
export const codeScreenAfterChange = (t, email) => ({
  digits: emptyDigits(),
  wait: RESEND_WAIT_S,
  notice: t('Te mandamos un código a {email}.', { email }),
})

/**
 * B, paso 1 (y «Reenviar código», con los mismos datos): manda el código al correo nuevo.
 * El correo de la cuenta NO cambia todavía. → `{ ok, newEmail, codeExpiresAt }`.
 */
export async function requestEmailChange({ api, t, fallback }, { newEmail, password }) {
  try {
    const res = await api.post('/me/email/change', { newEmail: cleanEmail(newEmail), password })
    const data = unwrap(res) ?? {}
    return { ok: true, newEmail: data.newEmail ?? cleanEmail(newEmail), codeExpiresAt: data.codeExpiresAt ?? null }
  } catch (err) {
    return toFailure(t, err, fallback)
  }
}

/**
 * B, paso 2: el código → sesión nueva (las demás sesiones se cierran en el API). Con error,
 * `clearDigits` dice si vaciar las casillas (código incorrecto, bloqueado o caducado).
 */
export async function confirmEmailChange({ api, replaceSession, t, fallback }, code) {
  try {
    const res = await api.post('/me/email/confirm', { code })
    const auth = unwrap(res)
    await replaceSession(auth)
    return { ok: true, email: auth?.user?.email ?? null }
  } catch (err) {
    const failure = toFailure(t, err, fallback)
    return { ...failure, clearDigits: clearsDigits(failure.code) }
  }
}

/**
 * Mi perfil: PATCH /users/me solo con el nombre. Desde el API 1.18.0 un correo distinto da 400
 * USE_EMAIL_CHANGE; el correo se cambia con «Cambiar correo».
 */
export const profilePayload = ({ name }) => ({ name: String(name ?? '').trim() })
