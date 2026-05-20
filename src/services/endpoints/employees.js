import api from '../api'

export const employeesApi = {
  getAll: (params) => api.get('/employees', { params }),
  // returns Page<UserResponse>

  create: (data) => api.post('/employees', data),
  // body: { name, email, password }  — businessId taken from JWT in BE

  toggleActive: (id) => api.put(`/users/${id}/activate`),
}
