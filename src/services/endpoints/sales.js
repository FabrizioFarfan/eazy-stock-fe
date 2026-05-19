import api from '../api'

export const salesApi = {
  getAll: (params) => api.get('/sales', { params }),
  // params: { page, size, from, to, businessId }

  getById: (id) => api.get(`/sales/${id}`),

  create: (data) => api.post('/sales', data),
  // data: { items: [{ productId, quantity }], notes? }
}
