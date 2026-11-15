// El signo de un movimiento de stock (William, 15-nov-2026: un ajuste de −1 salía como «1» y parecía una entrada).
// La API guarda las ventas y las devoluciones al proveedor en positivo (son salidas) y los ajustes con su signo.
// Aquí vive la única regla para pintarlos: lo que baja el stock lleva «−» y lo que lo sube lleva «+», siempre.
const OUT = new Set(['SALE', 'SUPPLIER_RETURN'])

/** La cantidad con su signo real: negativa si el movimiento bajó el stock. */
export function signedQuantity(type, quantity) {
  const n = Number(quantity)
  if (!Number.isFinite(n)) return 0
  return OUT.has(type) ? -Math.abs(n) : type === 'ADJUSTMENT' ? n : Math.abs(n)
}

const trim = (n) => Math.abs(n).toFixed(3).replace(/\.?0+$/, '')

/** «+6», «−2», «0»: la cantidad lista para pintar, con el signo menos tipográfico. */
export function signedQuantityLabel(type, quantity) {
  const n = signedQuantity(type, quantity)
  return n > 0 ? `+${trim(n)}` : n < 0 ? `−${trim(n)}` : '0'
}

/** 'up' | 'down' | 'same': para el color. */
export const movementDirection = (type, quantity) => {
  const n = signedQuantity(type, quantity)
  return n > 0 ? 'up' : n < 0 ? 'down' : 'same'
}
