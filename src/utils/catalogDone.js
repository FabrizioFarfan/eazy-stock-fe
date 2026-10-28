/**
 * «Ya tengo mis productos» (Frank, 28-oct-2026): el aviso «Primer paso · Carga tu catálogo» es para cuentas nuevas.
 * Deja de salir para ese negocio en cuanto se ve que tiene productos, o si el dueño lo marca como listo. Se guarda
 * por negocio en este navegador (es solo un aviso: si se borra, vuelve a decidir por los productos que haya).
 */
const key = (businessId) => `eazystock_catalog_done_${businessId ?? 'default'}`

export function isCatalogDone(businessId, storage = globalThis.localStorage) {
  try {
    return storage?.getItem(key(businessId)) === '1'
  } catch {
    return false
  }
}

export function markCatalogDone(businessId, storage = globalThis.localStorage) {
  try {
    storage?.setItem(key(businessId), '1')
  } catch {
    // Sin almacenamiento (modo privado): el aviso se decide solo por los productos.
  }
}

/**
 * ¿Se enseña el aviso? Solo si el servidor CONFIRMA 0 productos y nadie lo marcó como listo. Mientras carga, si la
 * consulta falló o no llegó, NO: antes eso contaba como «0 productos» y le salía a William, que ya cargó su Excel.
 */
export function showCatalogBanner({ done, loading, error, total }) {
  if (done || loading || error) return false
  return typeof total === 'number' && total === 0
}
