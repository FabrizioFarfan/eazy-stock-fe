import api from '../api'

export const businessesApi = {
  getAll: (params) => api.get('/businesses', { params }),
  // params: { page, size, sort }

  create: (data) => api.post('/businesses', data),
  // body: { name, countryCode, taxIdType, taxId }

  update: (id, data) => api.put(`/businesses/${id}`, data),

  getMine: () => api.get('/me/business'),
  // negocio del usuario autenticado

  updateMine: (data) => api.put('/me/business', data),
  // body: { name, countryCode, taxIdType, taxId } — solo OWNER

  deactivate: (id) => api.delete(`/businesses/${id}`),
}
