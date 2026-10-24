import { dateLocale } from '../i18n'
import { getDateFormat } from '../i18n/region'

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

/**
 * Fecha numérica con el formato del negocio (contrato multi-país: «dd/MM/yyyy»
 * en todos los países). Acepta Date, 'YYYY-MM-DD' (como fecha local) o un ISO
 * con hora. Patrones: dd, d, MM, M, yyyy, yy.
 */
export function formatNumericDate(value, pattern = getDateFormat()) {
  if (!value) return '—'
  let d
  if (value instanceof Date) d = value
  else if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [y, m, day] = String(value).split('-').map(Number)
    d = new Date(y, m - 1, day)
  } else d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  const parts = { dd: pad(d.getDate()), d: String(d.getDate()), MM: pad(d.getMonth() + 1), M: String(d.getMonth() + 1),
    yyyy: String(d.getFullYear()), yy: String(d.getFullYear()).slice(-2) }
  return (pattern || 'dd/MM/yyyy').replace(/yyyy|yy|dd|d|MM|M/g, (tok) => parts[tok])
}
