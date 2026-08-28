import api from '../api'

export const employeesApi = {
  getAll: (params) => api.get('/employees', { params }),
  // returns Page<UserResponse>

  create: (data) => api.post('/employees', data),
  // body: { name, email, password }  — businessId taken from JWT in BE

  toggleActive: (id) => api.put(`/users/${id}/activate`),

  // borrado DEFINITIVO (libera el correo); 409 si el empleado tiene ventas u operaciones
  remove: (id) => api.delete(`/employees/${id}`),
}
