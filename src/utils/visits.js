// Panel Boss › Visitas: lo que se calcula sin pintar (embudo, conversión, marcas del eje). Con tests.

export const FUNNEL_STEPS = ['visited', 'pricing', 'register_open', 'register_submit', 'signup', 'first_sale']

/**
 * Cada paso con su ancho de barra (sobre el primero) y su porcentaje sobre el paso anterior. Un paso puede tener
 * más que el anterior (alguien entra directo al registro sin ver precios): el porcentaje se topa en 100.
 */
export function funnelRows(steps) {
  const first = Math.max(1, steps[0]?.count ?? 0)
  return steps.map((s, i) => {
    const prev = i === 0 ? null : steps[i - 1].count
    return {
      key: s.key,
      count: s.count,
      width: Math.min(100, (s.count / first) * 100),
      ofPrevious: prev === null ? null : prev === 0 ? 0 : Math.min(100, Math.round((s.count / prev) * 100)),
    }
  })
}

/** Cuentas creadas sobre visitantes, con un decimal si hace falta (0,8 %). */
export function conversion(signups, visitors) {
  if (!visitors) return 0
  const pct = (signups / visitors) * 100
  return pct >= 10 || pct === 0 ? Math.round(pct) : Math.round(pct * 10) / 10
}

/** Qué días llevan fecha debajo del gráfico: primero, último y como mucho tres en medio. */
export function axisTicks(n) {
  if (n <= 0) return []
  if (n <= 2) return [...Array(n).keys()]
  const ticks = new Set([0, n - 1])
  const inner = Math.min(3, n - 2)
  for (let k = 1; k <= inner; k++) ticks.add(Math.round((k * (n - 1)) / (inner + 1)))
  return [...ticks].sort((a, b) => a - b)
}
