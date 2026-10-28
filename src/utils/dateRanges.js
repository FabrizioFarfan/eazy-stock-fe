/** Rangos rápidos de fechas en hora local (ISO yyyy-mm-dd). */

function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function quickRange(key) {
  const now = new Date()
  const today = toISODate(now)
  if (key === 'day') return { from: today, to: today }
  if (key === 'week') {
    // Semana de lunes a hoy
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - day)
    return { from: toISODate(monday), to: today }
  }
  if (key === 'month') {
    return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today }
  }
  if (key === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: today }
  }
  return null
}

/** Últimos `n` meses hasta hoy (mismo día del mes, n meses atrás). */
export function lastMonthsRange(n) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - n, now.getDate())
  return { from: toISODate(start), to: toISODate(now) }
}

/**
 * El período del mismo largo justo antes de {from, to} (para comparar): del 1 al 28 de octubre → del 3 al 30 de
 * septiembre; hoy → ayer. Fechas ISO yyyy-mm-dd, en hora local.
 */
export function previousRange(range) {
  if (!range?.from || !range?.to) return null
  const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
  const from = parse(range.from)
  const to = parse(range.to)
  const days = Math.round((to - from) / 86400000) + 1
  const prevTo = new Date(from); prevTo.setDate(from.getDate() - 1)
  const prevFrom = new Date(from); prevFrom.setDate(from.getDate() - days)
  return { from: toISODate(prevFrom), to: toISODate(prevTo) }
}

/** Cuánto cambió respecto al período anterior, en %; null si antes era 0 (no hay con qué comparar). */
export function changePercent(now, before) {
  const a = Number(now)
  const b = Number(before)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null
  return Math.round(((a - b) / Math.abs(b)) * 100)
}
