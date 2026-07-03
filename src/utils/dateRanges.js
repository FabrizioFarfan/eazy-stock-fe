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
