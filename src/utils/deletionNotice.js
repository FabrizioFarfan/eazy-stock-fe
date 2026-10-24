// Aviso «Tu cuenta se borrará el …» que ve la pantalla de login justo después de
// pedir el borrado (24-oct-2026). Va en sessionStorage y no en el state de la
// navegación porque, al cerrarse la sesión, cualquier petición en vuelo puede
// recargar la página entera hacia /login.
const KEY = 'eazystock_deletion_notice'

export function saveDeletionNotice({ deletionScheduledAt, role }) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ deletionScheduledAt, role })) } catch { /* storage bloqueado */ }
}

export function readDeletionNotice() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || null } catch { return null }
}

export function clearDeletionNotice() {
  try { sessionStorage.removeItem(KEY) } catch { /* storage bloqueado */ }
}

/** «24 de noviembre de 2026» en el idioma de la web; si el API no mandó fecha, null. */
export function formatDeletionDate(iso, locale) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}
