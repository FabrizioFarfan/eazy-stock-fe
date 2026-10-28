import api from '../api'

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  // returns Page<UserResponse>

  create: (data) => api.post('/users', data),
  // body: { name, email, password, role, businessId }

  update: (id, data) => api.patch(`/users/${id}`, data),
  // body: { name?, email?, password? }

  updateMe: (data) => api.patch('/users/me', data),
  // body: { name } — API 1.18.0: un email distinto → 400 USE_EMAIL_CHANGE (el correo se cambia en /me/email/*, utils/emailChange.js)

  toggleActive: (id) => api.put(`/users/${id}/activate`),

  changePassword: (data) => api.put('/users/me/password', data),
  // body: { currentPassword, newPassword }
}
