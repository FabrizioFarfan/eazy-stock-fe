import api from '../api'

export const stockApi = {
  getMovements: (params) => api.get('/stock/movements', { params }),
  // params: { page, size, type, from, to }

  createMovement: (data) => api.post('/stock/movements', data),
  // body: { productId, type, quantity, notes }
  // type: PURCHASE_ENTRY | ADJUSTMENT

  getLowStock: (params) => api.get('/stock/low-stock', { params }),
}
