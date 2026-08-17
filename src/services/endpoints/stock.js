import api from '../api'

export const stockApi = {
  getMovements: (params) => api.get('/stock/movements', { params }),
  // params: { page, size, type, from, to } — from/to en yyyy-MM-dd (día del usuario)

  getSalesSummary: (params) => api.get('/stock/movements/sales-summary', { params }),
  // params: { from, to, supplierId } — total vendido por producto con cód. de proveedor

  getMovementsByProduct: (productId, params) =>
    api.get(`/stock/movements/product/${productId}`, { params }),

  createMovement: (data) => api.post('/stock/movements', data),
  // body: { productId, type, quantity, notes }
  // type: PURCHASE_ENTRY | ADJUSTMENT

  getLowStock: (params) => api.get('/stock/low-stock', { params }),
}
