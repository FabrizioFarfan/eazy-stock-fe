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
  // data: { items: [{ productId, quantity }], notes? }
}
