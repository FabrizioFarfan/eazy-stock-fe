// Lotes de un producto (William, 7-nov-2026: martillos que a veces vienen con sacapuntas). Lógica pura, con tests.
// Un producto con lotes reparte su stock en «cubos»: cada lote y lo que no está en ninguno (lotId null).
import { attrValueFor } from './parameters.js'

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Cómo se llama lo que no está en ningún lote: «Sacapuntas: No» si el producto lo dice; si no, null. */
function looseLabel(product) {
  const names = [...new Set((product.lots ?? []).flatMap((l) => Object.keys(l.parameters ?? {})))]
  const parts = names.map((n) => [n, attrValueFor(product.attributes, n)]).filter(([, v]) => v !== '')
  return parts.length > 0 ? parts.map(([n, v]) => `${n}: ${v}`).join(' · ') : null
}

/** Los cubos con stock, primero lo de sin lote. `label` null = «Sin lote» (lo traduce quien lo pinta). */
export function lotBuckets(product) {
  const lots = (product?.lots ?? []).filter((l) => num(l.quantity) > 0)
  if (lots.length === 0) return []
  const inLots = lots.reduce((sum, l) => sum + num(l.quantity), 0)
  const loose = product.looseStock != null ? num(product.looseStock) : Math.max(0, num(product.currentStock) - inLots)
  return [
    ...(loose > 0 ? [{ lotId: null, label: looseLabel(product), quantity: loose }] : []),
    ...lots.map((l) => ({ lotId: l.id, label: l.label, quantity: num(l.quantity) })),
  ]
}

/** Lote con el que entra al carrito: si solo hay de un sitio, ese. undefined = hay que elegir. Sin lotes: null. */
export function defaultLot(product) {
  if (!(product?.lots ?? []).some((l) => num(l.quantity) > 0)) return null
  const buckets = lotBuckets(product)
  return buckets.length === 1 ? buckets[0].lotId : undefined
}

/** La línea del carrito: el mismo producto puede ir en dos líneas, una por lote. */
export const lineKey = (item) => `${item.product.id}:${item.lotId === undefined ? '?' : item.lotId ?? ''}`

/** Cuánto se puede vender en esta línea: lo de su lote, o el total mientras no se ha elegido. */
export function availableFor(item) {
  const product = item.product
  if (item.lotId === undefined || !(product.lots ?? []).length) return num(product.currentStock)
  const bucket = lotBuckets(product).find((b) => b.lotId === item.lotId)
  return bucket ? bucket.quantity : 0
}

/** Falta decir de qué lote sale. */
export const lotMissing = (item) => item.lotId === undefined && defaultLot(item.product) === undefined

/** Pasa la línea `key` a otro lote; si ese lote ya tiene línea, se juntan. */
export function changeLineLot(cart, key, lotId) {
  const line = cart.find((i) => lineKey(i) === key)
  if (!line) return cart
  const moved = { ...line, lotId }
  const target = cart.find((i) => i !== line && lineKey(i) === lineKey(moved))
  if (!target) return cart.map((i) => (i === line ? moved : i))
  return cart.filter((i) => i !== line).map((i) => (i === target ? { ...i, quantity: num(i.quantity) + num(line.quantity) } : i))
}
