import api from '../api'

export const ownersApi = {
  getAll: (params) => api.get('/admin/owners', { params }),
  // returns Page<UserResponse>

  create: (data) => api.post('/admin/owners', data),
  // body: { name, email, password, businessId }

  // eliminación PERMANENTE. Sin withData: 409 si tiene negocio o actividad. Con withData=true (API 1.21.1):
  // se va con su(s) negocio(s) y TODOS sus datos, ya mismo (Frank, 4-nov: borrar de verdad las cuentas de prueba).
  remove: (id, confirmEmail, withData = false) => api.delete(`/admin/owners/${id}`, { params: { confirmEmail, ...(withData ? { withData: true } : {}) } }),
}
