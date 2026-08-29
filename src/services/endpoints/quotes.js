import api from '../api'

export const quotesApi = {
  // params: { page, size, search?, status?: 'OPEN' | 'CONVERTED' }
  getAll:  (params) => api.get('/quotes', { params }),
  getById: (id)     => api.get(`/quotes/${id}`),
  // data: { items: [{ productId, quantity, unitPrice }], customerId?, customerName?, customerPhone?, customerEmail?, validityDays?, notes? }
  create:  (data)   => api.post('/quotes', data),
  // Solo cotizaciones ABIERTAS: mismo cuerpo, conserva número y fecha.
  update:  (id, data) => api.put(`/quotes/${id}`, data),
  // El cliente volvió y compró: enlaza la venta y cierra la cotización.
  markConverted: (id, saleId) => api.post(`/quotes/${id}/converted`, null, { params: { saleId } }),
  remove:  (id)     => api.delete(`/quotes/${id}`),
}
