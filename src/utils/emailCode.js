// Confirmar el correo con un código de 6 dígitos (web 1.23.0 · API 1.16.0, EMAIL-CODE-SPEC.md).
// Lógica pura de la pantalla /confirmar-correo, sin imports (se prueba con node --test).

export const CODE_LENGTH = 6
/** El código vale 15 minutos: si se mandó hace menos, no se pide otro solo al abrir la pantalla. */
export const CODE_TTL_MS = 15 * 60 * 1000
/** Lo mínimo entre dos envíos (RESEND_TOO_SOON); cuenta atrás por defecto tras login/registro. */
export const RESEND_WAIT_S = 60

export const emptyDigits = () => Array(CODE_LENGTH).fill('')

/**
 * Escribe `input` desde la casilla `index`. Un dígito → esa casilla; varios (pegar, autocompletar
 * del correo) → rellena desde ahí (desde la 1.ª si viene el código entero). Ignora lo que no es dígito.
 * Devuelve { digits, focus } con la casilla que debe quedar enfocada.
 */
export function fillDigits(current, index, input) {
  const digits = [...current]
  const clean = String(input ?? '').replace(/\D/g, '')
  if (!clean) {
    digits[index] = ''
    return { digits, focus: index }
  }
  const start = clean.length >= CODE_LENGTH ? 0 : index
  const chars = clean.slice(0, CODE_LENGTH - start).split('')
  chars.forEach((c, i) => { digits[start + i] = c })
  const next = start + chars.length
  return { digits, focus: Math.min(next, CODE_LENGTH - 1) }
}

/** Borrar con la casilla vacía → borra la anterior y se va a ella. */
export function backspaceDigits(current, index) {
  const digits = [...current]
  if (digits[index]) {
    digits[index] = ''
    return { digits, focus: index }
  }
  const prev = Math.max(0, index - 1)
  digits[prev] = ''
  return { digits, focus: prev }
}

export const isComplete = (digits) => digits.length === CODE_LENGTH && digits.every((d) => /^\d$/.test(d))

/** Segundos de espera que trae el error (RESEND_TOO_SOON / TOO_MANY_REQUESTS), o null. */
export function retryAfterOf(body) {
  const n = Number(body?.retryAfterSeconds)
  return Number.isFinite(n) && n > 0 ? Math.ceil(n) : null
}

/**
 * Mensaje traducido por `code` (la web no usa el `message` en español del API). `t` = traductor activo.
 * Devuelve null si el código no es de esta pantalla.
 */
export function codeErrorMessage(t, body) {
  switch (body?.code) {
    case 'INVALID_CODE': {
      const n = Number(body.attemptsLeft)
      if (n === 1) return t('El código no es correcto. Te queda 1 intento.')
      return Number.isFinite(n) && n > 0
        ? t('El código no es correcto. Te quedan {n} intentos.', { n })
        : t('El código no es correcto.')
    }
    case 'CODE_LOCKED':  return t('Fallaste 5 veces. Pide un código nuevo.')
    case 'CODE_EXPIRED': return t('El código caducó. Pide uno nuevo.')
    case 'RESEND_TOO_SOON':
      return t('Espera {n} segundos para pedir otro código.', { n: retryAfterOf(body) ?? RESEND_WAIT_S })
    case 'TOO_MANY_REQUESTS': {
      const s = retryAfterOf(body)
      return s
        ? t('Pediste demasiados códigos. Prueba de nuevo en {n} minutos.', { n: Math.max(1, Math.ceil(s / 60)) })
        : t('Pediste demasiados códigos. Prueba de nuevo en unos minutos.')
    }
    default: return null
  }
}

/** Tras un error, ¿hay que vaciar las casillas? (el código ya no sirve o era incorrecto) */
export const clearsDigits = (code) => code === 'INVALID_CODE' || code === 'CODE_LOCKED' || code === 'CODE_EXPIRED'

/**
 * Cuánto falta para poder reenviar dado el último envío conocido (ms) y la hora actual.
 * `autoSend` = no hay un código vigente conocido (nunca o hace más de 15 min): la pantalla pide uno.
 */
export function resendState(lastSentAt, now = Date.now()) {
  const last = Number(lastSentAt)
  if (!Number.isFinite(last) || last <= 0 || now - last >= CODE_TTL_MS) return { autoSend: true, wait: 0 }
  return { autoSend: false, wait: Math.max(0, RESEND_WAIT_S - Math.floor((now - last) / 1000)) }
}

/** «0:45» para la cuenta atrás. */
export function formatCountdown(s) {
  const n = Math.max(0, Math.floor(s))
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
}

// Último envío conocido por usuario (localStorage): login y registro ya mandan un código, y
// recargar la pantalla no debe pedir otro (pedir uno nuevo anula el anterior).
const SENT_KEY = 'eazystock_email_code_sent'

export function markCodeSent(userKey, at = Date.now()) {
  try { localStorage.setItem(SENT_KEY, JSON.stringify({ user: String(userKey ?? ''), at })) } catch { /* storage bloqueado */ }
}

export function readCodeSent(userKey) {
  try {
    const v = JSON.parse(localStorage.getItem(SENT_KEY))
    return v && v.user === String(userKey ?? '') ? v.at : null
  } catch { return null }
}

export function clearCodeSent() {
  try { localStorage.removeItem(SENT_KEY) } catch { /* storage bloqueado */ }
}
