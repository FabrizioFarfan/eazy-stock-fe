import api from '../api'

export const ownersApi = {
  getAll: (params) => api.get('/admin/owners', { params }),
  // returns Page<UserResponse>

  create: (data) => api.post('/admin/owners', data),
  // body: { name, email, password, businessId }
}
