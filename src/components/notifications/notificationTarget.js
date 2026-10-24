/**
 * A dónde lleva tocar el aviso. Con `entityId` (BE 1.11.0) abre justo esa venta o
 * ese producto; sin él (avisos viejos), la lista de su tipo.
 */
export function notificationTarget(n, role) {
  const id = n?.entityId
  switch (n?.type) {
    case 'NEW_SALE':
    case 'SALE_CONFIRMED':
    case 'SALE_RETURN':
      return id ? `/sales?sale=${encodeURIComponent(id)}` : '/sales'
    case 'STOCK_UPDATE':
      return id ? `/stock?tab=movements&product=${encodeURIComponent(id)}` : '/stock'
    case 'LOW_STOCK':
      // El dueño abre la ficha (stock y mínimo); quien repone, el inventario en stock bajo.
      return id && role === 'OWNER' ? `/products?edit=${encodeURIComponent(id)}` : '/stock?tab=inventory&low=1'
    case 'EXPIRING':
      return id && role === 'OWNER' ? `/products?edit=${encodeURIComponent(id)}` : '/reports?tab=expiring'
    case 'RECEIPT_COST_PENDING':
      // Un vendedor anotó mercadería sin precios: el dueño abre esa recepción para ponerle el costo.
      return id ? `/stock?tab=receipts&receipt=${encodeURIComponent(id)}` : '/stock?tab=receipts&pending=1'
    default:
      return null
  }
}
