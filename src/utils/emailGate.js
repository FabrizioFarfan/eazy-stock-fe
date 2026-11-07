// Confirmar el correo con código (web 1.23.0 · API 1.16.0, EMAIL-CODE-SPEC.md): quién está
// bloqueado y a dónde va al confirmar. Fuera del AuthContext por la regla react-refresh.

/** Pantalla del código de 6 dígitos. */
export const VERIFY_CODE_PATH = '/confirmar-correo'

/** Dueño que se registró solo y aún no puso el código (`emailVerificationRequired` del API). */
export const isEmailGated = (u) => u?.emailVerificationRequired === true

/**
 * A dónde va un dueño recién confirmado. Desde el 7-nov-2026 el código solo se pide al terminar la prueba, al ir a
 * pagar o si el documento ya usó su prueba: en los tres casos lo siguiente es elegir plan.
 */
export const afterVerifyPath = () => '/settings#plan'
