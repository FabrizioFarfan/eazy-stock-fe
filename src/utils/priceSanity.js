// Aviso de precio raro (William, 4-nov-2026): un producto de S/ 8 le quedó a S/ 0.80 al cargarlo.
// Al guardar, si el precio de venta queda por debajo del costo o cambia más de un 80 % respecto al
// anterior, se pide confirmación enseñando el precio anterior. Lógica pura para poder probarla.

export const BIG_CHANGE = 0.8

/**
 * @returns [{ code: 'BELOW_COST' | 'BIG_CHANGE', ... }] vacío si todo pinta normal.
 *  - newPrice: el que se va a guardar (número); null/NaN = no se evalúa.
 *  - oldPrice: el que tenía (edición); null en alta.
 *  - cost: precio de compra, si se conoce (el vendedor no lo ve: va null).
 */
export function priceWarnings({ newPrice, oldPrice = null, cost = null, variable = false }) {
  const out = []
  if (variable) return out
  const n = num(newPrice)
  if (n == null) return out
  const c = num(cost)
  if (c != null && c > 0 && n < c) out.push({ code: 'BELOW_COST', newPrice: n, cost: c })
  const o = num(oldPrice)
  if (o != null && o > 0 && n !== o) {
    const ratio = Math.abs(n - o) / o
    if (ratio > BIG_CHANGE) out.push({ code: 'BIG_CHANGE', newPrice: n, oldPrice: o, pct: Math.round(ratio * 100), down: n < o })
  }
  return out
}

function num(v) {
  if (v === '' || v == null) return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
