import api from '../api'

export const suppliersApi = {
  getAll:    (params) => api.get('/suppliers', { params }),
  getById:   (id)     => api.get(`/suppliers/${id}`),
  create:    (data)   => api.post('/suppliers', data),
  update:    (id, data) => api.put(`/suppliers/${id}`, data),
  remove:    (id)     => api.delete(`/suppliers/${id}`),

  // Paso 4 — recepción multi-producto (1 receipt → N stock entries + 0..1 deuda)
  createReceipt: (supplierId, data) =>
    api.post(`/suppliers/${supplierId}/receipts`, data),
}
