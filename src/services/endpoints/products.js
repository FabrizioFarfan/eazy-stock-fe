import api from '../api'

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  // params: { page, size, search, lowStock, active, businessId }

  getById: (id) => api.get(`/products/${id}`),

  create: (data) => api.post('/products', data),

  update: (id, data) => api.put(`/products/${id}`, data),

  deactivate: (id) => api.delete(`/products/${id}`),

  getQr: (id) => api.get(`/products/${id}/qr`, { responseType: 'blob' }),

  scanCode: (code) => api.get(`/products/scan/${code}`),
}
