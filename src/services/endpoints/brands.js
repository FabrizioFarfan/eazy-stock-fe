import api from '../api'

export const brandsApi = {
  getAll:    (params) => api.get('/brands', { params }),
  getById:   (id)     => api.get(`/brands/${id}`),
  create:    (data)   => api.post('/brands', data),
  update:    (id, data, params) => api.put(`/brands/${id}`, data, { params }),
  remove:    (id, params) => api.delete(`/brands/${id}`, { params }),
}
