import api from '../api'

export const quotesApi = {
  // params: { page, size, search?, status?: 'OPEN' | 'CONVERTED' }
  getAll:  (params) => api.get('/quotes', { params }),
  getById: (id)     => api.get(`/quotes/${id}`),
  // data: { items: [{ productId, quantity, unitPrice }], customerName?, customerPhone?, validityDays?, notes? }
  create:  (data)   => api.post('/quotes', data),
  // El cliente volvió y compró: enlaza la venta y cierra la cotización.
  markConverted: (id, saleId) => api.post(`/quotes/${id}/converted`, null, { params: { saleId } }),
  remove:  (id)     => api.delete(`/quotes/${id}`),
}
