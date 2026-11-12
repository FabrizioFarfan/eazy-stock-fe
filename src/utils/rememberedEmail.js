// «Recordar mi correo» en el login (Frank, 12-nov-2026): al cerrar sesión el correo queda puesto
// y solo falta la contraseña. Es una opción: sin la casilla no queda nada guardado en el aparato,
// y la elección también se recuerda. La contraseña nunca se guarda.
const KEY = 'eazystock_remember_email'
const OFF = 'eazystock_remember_email_off'
const local = () => globalThis.localStorage

export function readRememberedEmail(storage = local()) {
  try { return storage.getItem(KEY) || '' } catch { return '' }
}

/** La casilla sale marcada salvo que la persona la haya quitado en este aparato. */
export function rememberEmailEnabled(storage = local()) {
  try { return storage.getItem(OFF) !== '1' } catch { return true }
}

export function saveRememberedEmail(email, remember, storage = local()) {
  try {
    const clean = String(email ?? '').trim()
    if (remember) {
      storage.removeItem(OFF)
      if (clean) storage.setItem(KEY, clean)
    } else {
      storage.removeItem(KEY)
      storage.setItem(OFF, '1')
    }
  } catch { /* storage bloqueado */ }
}
