import api from '../api'

// Borrado de cuenta (24-oct-2026, API 1.14.0; contrato en eazy-stock-app/ACCOUNT-SPEC.md).
export const accountApi = {
  requestDeletion: (password) => api.post('/me/account/deletion', { password }),
  // → 200 { data: { deletionScheduledAt, role } }; 400 WRONG_PASSWORD; 403 para BOSS/SUPER_ADMIN.
  // Revoca todos los tokens del usuario: después de esto la sesión se cierra SOLO en local.
}
