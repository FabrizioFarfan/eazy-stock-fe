// Registro con un documento que ya usó su periodo gratis (API 1.15.0: AuthResponse.setupPending).
// La cuenta nace sin prueba (solo lectura) y la web lleva a Ajustes › Tu plan con el aviso
// «Este RUC ya usó su periodo gratis. Elige tu plan para continuar.». Va en localStorage
// por negocio para que el aviso siga si recarga o vuelve otro día; se borra cuando el plan
// deja de estar en solo lectura.
const KEY = 'eazystock_setup_pending'

export function saveSetupPending({ businessId, countryCode }) {
  try { localStorage.setItem(KEY, JSON.stringify({ businessId, countryCode })) } catch { /* storage bloqueado */ }
}

/** El aviso de ESTE negocio, o null. */
export function readSetupPending(businessId) {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return v && businessId && v.businessId === businessId ? v : null
  } catch { return null }
}

export function clearSetupPending() {
  try { localStorage.removeItem(KEY) } catch { /* storage bloqueado */ }
}
