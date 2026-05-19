import api from '../api'

export const businessesApi = {
  getAll: (params) => api.get('/businesses', { params }),
  // params: { page, size, sort }

  create: (data) => api.post('/businesses', data),
  // body: { name, countryCode, taxIdType, taxId }

  update: (id, data) => api.put(`/businesses/${id}`, data),

  deactivate: (id) => api.delete(`/businesses/${id}`),
}
