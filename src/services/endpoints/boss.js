import api from '../api'

export const bossApi = {
  getActivity: () => api.get('/boss/activity'),
  // { serverTime, businesses: [{ id, name, countryCode, active, createdAt,
  //   salesLast7Days, lastSaleAt, users: [{ id, name, email, role, active, lastSeenAt }] }] }

  // Suscripciones (M1 «Planes en serio», 15-oct-2026): una fila por negocio.
  getSubscriptions:   () => api.get('/boss/subscriptions'),
  updateSubscription: (businessId, data) => api.patch(`/boss/subscriptions/${businessId}`, data),
  markPaid:           (businessId, months = 1) => api.post(`/boss/subscriptions/${businessId}/mark-paid`, { months }),
  extendTrial:        (businessId, days = 7) => api.post(`/boss/subscriptions/${businessId}/extend-trial`, { days }),
}
