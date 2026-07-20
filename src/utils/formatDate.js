/**
 * Formatea una fecha ISO 'YYYY-MM-DD' como "dd mmm yy" (es-PE), parseándola
 * como fecha local para evitar el desfase de zona horaria que produce
 * `new Date('YYYY-MM-DD')` (que la interpreta como UTC).
 */
export function formatShortDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })
    .format(new Date(y, m - 1, d))
}
