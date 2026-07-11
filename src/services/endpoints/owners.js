import api from '../api'

export const ownersApi = {
  getAll: (params) => api.get('/admin/owners', { params }),
  // returns Page<UserResponse>

  create: (data) => api.post('/admin/owners', data),
  // body: { name, email, password, businessId }

  remove: (id, confirmEmail) => api.delete(`/admin/owners/${id}`, { params: { confirmEmail } }),
  // eliminación PERMANENTE; 409 si el owner ya tiene actividad de negocio
}
