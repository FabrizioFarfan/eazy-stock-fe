import api from '../api'

// Recuperar contraseña + confirmar correo (22-oct-2026). Login/registro/me siguen en AuthContext.
export const authApi = {
  forgotPassword: (email) => api.post('/auth/forgot', { email }),
  // → 200 siempre, exista o no el correo (no se revela)

  resetPassword: (token, password) => api.post('/auth/reset', { token, password }),
  // → 200 ok; 400 INVALID_TOKEN si el enlace no vale o venció

  verifyEmail: (token) => api.post('/auth/verify', { token }),
  // → 200 ok; 400 INVALID_TOKEN

  resendVerification: () => api.post('/auth/verify/resend'),
  // autenticado → 200; 429 TOO_MANY_REQUESTS (3 cada 15 min)
}
