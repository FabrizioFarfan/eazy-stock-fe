import api from '../api'

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  // returns Page<UserResponse>

  create: (data) => api.post('/users', data),
  // body: { name, email, password, role, businessId }

  update: (id, data) => api.patch(`/users/${id}`, data),
  // body: { name?, email?, password? }

  updateMe: (data) => api.patch('/users/me', data),
  // body: { name?, email? } — cambiar email invalida la sesión (re-login)

  toggleActive: (id) => api.put(`/users/${id}/activate`),

  changePassword: (data) => api.put('/users/me/password', data),
  // body: { currentPassword, newPassword }
}
