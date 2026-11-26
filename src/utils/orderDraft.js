// Borrador del pedido a un proveedor (lo que se estaba armando y se cerró sin enviar).
//
// William, 26-nov-2026: armaba el pedido desde Movimientos › Ventas con las fechas de la semana y le salían los
// productos con stock bajo. Causa: el borrador se guardaba solo por proveedor, así que el pedido abierto antes desde
// Stock bajo (o desde Resurtido, o con otras fechas) volvía a salir encima de lo vendido en esas fechas.
// Ahora cada borrador recuerda DE DÓNDE salió y solo vuelve en ese mismo sitio y con las mismas fechas.
// Lógica pura para poder probarla.

/** De dónde sale el pedido: 'low' = Stock bajo, 'restock' = Resurtido, 'sales' = Movimientos › Ventas. */
export function orderOrigin(kind = 'low', from = '', to = '') {
  return { kind, period: kind === 'low' ? '' : `${from || ''}|${to || ''}` }
}

/** Un borrador por negocio, proveedor y sitio. El de Stock bajo conserva la llave de siempre. */
export function orderDraftKey(businessId, supplierId, origin) {
  const base = `eazystock_order_draft_${businessId || 'default'}_${supplierId || 'none'}`
  const kind = origin?.kind || 'low'
  return kind === 'low' ? base : `${base}__${kind}`
}

/**
 * El borrador guardado para este pedido, o null si no hay o si es de otras fechas (ese ya no vale: se pisa).
 * Los borradores de antes de este cambio no dicen de dónde son: solo valen para Stock bajo.
 */
export function loadOrderDraft(storage, businessId, supplierId, origin) {
  try {
    const d = JSON.parse(storage.getItem(orderDraftKey(businessId, supplierId, origin)))
    if (!Array.isArray(d?.rows)) return null
    if ((d.period ?? '') !== (origin?.period ?? '')) return null
    return d
  } catch { return null }
}

export function saveOrderDraft(storage, businessId, supplierId, origin, { rows, removed, notes }) {
  try {
    storage.setItem(orderDraftKey(businessId, supplierId, origin),
      JSON.stringify({ rows, removed, notes, period: origin?.period ?? '', savedAt: Date.now() }))
  } catch { /* sin almacenamiento: no se guarda */ }
}

export function clearOrderDraft(storage, businessId, supplierId, origin) {
  try { storage.removeItem(orderDraftKey(businessId, supplierId, origin)) } catch { /* noop */ }
}
