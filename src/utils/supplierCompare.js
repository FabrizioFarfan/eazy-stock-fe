// Comparar proveedores por producto (William, 20-nov-2026): el mismo producto lo traen varios proveedores y el precio
// va cambiando. El API da, por producto, la última compra a cada proveedor (`offers`, del más barato al más caro).
// Aquí se decide qué avisar al armar un pedido y se guardan los productos que se pasan al pedido de otro proveedor.
// Lógica pura para poder probarla.

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** { [productId]: offers[] } a partir de la respuesta del API. */
export function offersByProduct(list) {
  const out = {}
  for (const p of list ?? []) out[p.productId] = p.offers ?? []
  return out
}

/**
 * Lo que este proveedor cobra y quién lo dio más barato la última vez.
 * @returns null si a este proveedor nunca se le compró (no hay con qué comparar) o si nadie lo dio más barato;
 *  si no, { mine, best, saving (por unidad), pct (cuánto menos, 0-100) }.
 */
export function cheaperOffer(offers, supplierId) {
  const mine = (offers ?? []).find((o) => o.supplierId === supplierId)
  if (!mine) return null
  const best = (offers ?? []).find((o) => o.supplierId !== supplierId && num(o.unitCost) < num(mine.unitCost) - 1e-9)
  if (!best) return null
  const saving = num(mine.unitCost) - num(best.unitCost)
  return { mine, best, saving, pct: Math.round((saving / num(mine.unitCost)) * 100) }
}

/** Las filas del pedido que otro proveedor dio más barato, con lo que se ahorraría por la cantidad pedida. */
export function cheaperRows(rows, byProduct, supplierId) {
  const out = []
  for (const row of rows ?? []) {
    const hit = cheaperOffer(byProduct?.[row.productId], supplierId)
    if (hit) out.push({ row, ...hit, total: hit.saving * Math.max(0, num(row.qty)) })
  }
  return out
}

// ── Productos que esperan en el pedido de otro proveedor ──────────────────────────────────────────────────────────
// «Pasar al pedido de Francesco» no abre nada: lo deja apuntado, y al abrir el pedido de Francesco ya está dentro.

export const extrasKey = (businessId, supplierId) => `eazystock_order_extra_${businessId || 'default'}_${supplierId || 'none'}`

function read(storage, key) {
  try {
    const list = JSON.parse(storage.getItem(key))
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

/** Apunta la fila para el pedido de ese proveedor (si ya estaba, se queda la nueva). Devuelve cuántas esperan. */
export function addExtra(storage, businessId, supplierId, row) {
  const key = extrasKey(businessId, supplierId)
  const list = [...read(storage, key).filter((r) => r.productId !== row.productId), row]
  try { storage.setItem(key, JSON.stringify(list)) } catch { /* sin almacenamiento: no se apunta */ }
  return list.length
}

/** Deja apuntadas exactamente estas filas (ninguna = no espera nada). */
export function setExtras(storage, businessId, supplierId, rows) {
  const key = extrasKey(businessId, supplierId)
  try {
    if (rows?.length) storage.setItem(key, JSON.stringify(rows))
    else storage.removeItem(key)
  } catch { /* noop */ }
}

export const peekExtras = (storage, businessId, supplierId) => read(storage, extrasKey(businessId, supplierId))

/** Las filas del pedido más las que esperaban, sin repetir producto. */
export function mergeExtras(rows, extras) {
  const have = new Set((rows ?? []).map((r) => r.productId))
  return [...(rows ?? []), ...(extras ?? []).filter((e) => !have.has(e.productId))]
}
