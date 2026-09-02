import api from '../api'

export const salesApi = {
  // params: { page, size, from?, to?, productIds?: UUID[], supplierId?, businessId? }
  // productIds array is serialized as repeated params: productIds=id1&productIds=id2
  getAll: (params) => api.get('/sales', {
    params,
    paramsSerializer: { indexes: null },  // productIds=v1&productIds=v2 (no brackets)
  }),

  getById: (id) => api.get(`/sales/${id}`),

  create: (data) => api.post('/sales', data),
  // data: { items: [{ productId, quantity }], notes?, customerId? (opcional al contado) }

  // Asociar (customerId) o quitar (null) el cliente de una venta ya hecha — no aplica al fiado
  assignCustomer: (saleId, customerId) => api.patch(`/sales/${saleId}/customer`, { customerId }),

  // Devoluciones (total o parcial): data = { items: [{ saleItemId, quantity }], notes? }
  createReturn: (saleId, data) => api.post(`/sales/${saleId}/returns`, data),
  getReturns:   (saleId)       => api.get(`/sales/${saleId}/returns`),
}
