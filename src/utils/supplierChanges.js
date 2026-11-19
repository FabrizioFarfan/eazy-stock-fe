// Cambio de proveedor al guardar una compra (William, 19-nov-2026): el producto era de un proveedor y esta compra
// viene de otro. Antes de guardar se pregunta si desde ahora lo trae el nuevo o si es solo esta compra.
// Lógica pura para poder probarla.

/** El proveedor de relleno que deja la importación cuando el producto llegó sin proveedor. */
export const isUnassigned = (name) => (name ?? '').trim().toLowerCase() === 'sin proveedor asignado'

/**
 * @param lines [{ id, name, supplierId, supplierName }]: el proveedor habitual de cada producto de la compra.
 * @param supplier { id, name }: el proveedor de esta compra.
 * @returns solo los productos cuyo proveedor habitual es OTRO, con { oldSupplier, newSupplier }. Un producto sin
 *  proveedor habitual no entra: no hay nada que cambiar.
 */
export function supplierChanges(lines, supplier) {
  if (!supplier?.id) return []
  const seen = new Set()
  const out = []
  for (const line of lines) {
    if (!line.supplierId || line.supplierId === supplier.id || seen.has(line.id)) continue
    seen.add(line.id)
    out.push({ id: line.id, name: line.name, oldSupplier: line.supplierName ?? null, newSupplier: supplier.name, unassigned: isUnassigned(line.supplierName) })
  }
  return out
}

/** ¿Ya se respondió por todos? `decisions` = { [id]: true (desde ahora) | false (solo esta compra) }. */
export function allAnswered(changes, decisions) {
  return changes.every((c) => typeof decisions?.[c.id] === 'boolean')
}

/** Lo que manda el API por línea: `adoptSupplier` solo si eligió «desde ahora». */
export function adoptFields(decisions, id) {
  return decisions?.[id] === true ? { adoptSupplier: true } : {}
}
