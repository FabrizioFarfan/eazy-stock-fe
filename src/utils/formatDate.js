import { dateLocale } from '../i18n'

/**
 * Formatea una fecha ISO 'YYYY-MM-DD' como "dd mmm yy" (locale activo), parseándola
 * como fecha local para evitar el desfase de zona horaria que produce
 * `new Date('YYYY-MM-DD')` (que la interpreta como UTC).
 */
/**
 * Hoy (o la fecha dada) como 'YYYY-MM-DD' en hora LOCAL del navegador.
 * OJO: `new Date().toISOString().slice(0,10)` da el día UTC — en Perú desde
 * las 19:00 ya es "mañana" y los filtros de hoy quedaban corridos.
 */
export function localISODate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatShortDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat(dateLocale(), { day: '2-digit', month: 'short', year: '2-digit' })
    .format(new Date(y, m - 1, d))
}
