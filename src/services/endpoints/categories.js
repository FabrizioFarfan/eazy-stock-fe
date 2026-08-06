import api from '../api'

export const categoriesApi = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  getSuggestedAttributes: (id) => api.get(`/categories/${id}/suggested-attributes`),
  create: (data) => api.post('/categories', data),
  update: (id, data, params) => api.put(`/categories/${id}`, data, { params }),
  delete: (id, params) => api.delete(`/categories/${id}`, { params }),
}
