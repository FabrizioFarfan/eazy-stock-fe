// Cambios de precio de compra al guardar una compra (Frank, 7-nov-2026): antes de guardar, el dueño ve qué
// productos le salen más caros o más baratos y decide si ese es el precio nuevo o solo el de esta compra.
// Lógica pura para poder probarla.

const num = (v) => {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * @param lines [{ id, name, quantity, oldCost, newCost, salePrice }]; salePrice null = no se conoce o es variable.
 * @returns solo las líneas cuyo precio cambió, con { diff, pct, extra, oldMargin, newMargin }. Un producto sin
 *  precio de compra anterior no es un cambio: es su primer precio y no hay nada que comparar.
 */
export function purchasePriceChanges(lines) {
  const out = []
  for (const line of lines) {
    const oldCost = num(line.oldCost)
    const newCost = num(line.newCost)
    if (oldCost == null || oldCost <= 0 || newCost == null || newCost === oldCost) continue
    const diff = newCost - oldCost
    const sale = num(line.salePrice)
    const hasSale = sale != null && sale > 0
    out.push({
      ...line,
      oldCost,
      newCost,
      diff,
      pct: Math.round((Math.abs(diff) / oldCost) * 100),
      extra: diff * (num(line.quantity) ?? 0),
      salePrice: hasSale ? sale : null,
      oldMargin: hasSale ? sale - oldCost : null,
      newMargin: hasSale ? sale - newCost : null,
    })
  }
  return out
}

/** Cuánto más (positivo) o menos (negativo) se paga en esta compra respecto a los precios de antes. */
export function totalExtra(changes) {
  return changes.reduce((sum, c) => sum + c.extra, 0)
}

/** Lo que manda el API por línea: `keepProductCost` solo si eligió «solo en esta compra». */
export function decisionFields(decisions, id) {
  const d = decisions?.[id]
  return {
    ...(d?.keep ? { keepProductCost: true } : {}),
    ...(d?.salePrice != null ? { salePrice: d.salePrice } : {}),
  }
}
