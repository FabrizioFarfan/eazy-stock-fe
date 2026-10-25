import api from '../api'

// Recuperar contraseña + confirmar correo (22-oct-2026). Login/registro/me siguen en AuthContext.
export const authApi = {
  forgotPassword: (email) => api.post('/auth/forgot', { email }),
  // → 200 siempre, exista o no el correo (no se revela)

  resetPassword: (token, password) => api.post('/auth/reset', { token, password }),
  // → 200 ok; 400 INVALID_TOKEN si el enlace no vale o venció

  verifyEmail: (token) => api.post('/auth/verify', { token }),
  // → 200 ok; 400 INVALID_TOKEN (el enlace del correo, público; sigue valiendo 24 h)

  // Código de 6 dígitos (API 1.16.0, EMAIL-CODE-SPEC.md), con el JWT del dueño:
  verifyCode: (code) => api.post('/auth/verify/code', { code }),
  // → 200 UserResponse (emailVerified: true, emailVerificationRequired: false)
  //   400 INVALID_CODE {attemptsLeft} | CODE_LOCKED | CODE_EXPIRED

  resendVerification: () => api.post('/auth/verify/resend'),
  // → 200 { retryAfterSeconds: 60 } (correo con código + enlace nuevos; anula los anteriores)
  //   429 RESEND_TOO_SOON {retryAfterSeconds} | TOO_MANY_REQUESTS {retryAfterSeconds}
}
