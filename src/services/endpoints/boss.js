import api from '../api'

export const bossApi = {
  getActivity: () => api.get('/boss/activity'),
  // { serverTime, businesses: [{ id, name, countryCode, active, createdAt, salesLast7Days, lastSaleAt,
  //   ownerId, ownerName, accountKind, users: [{ id, name, email, role, active, lastSeenAt, accountKind }] }] }
  // API 1.19.0 (30-oct): qué es la cuenta de un dueño — 'CUSTOMER' | 'TESTER' | 'TEAM' | null (sin revisar).
  setAccountKind: (userId, kind) => api.patch(`/boss/accounts/${userId}/kind`, { kind }),

  // Suscripciones (M1 «Planes en serio», 15-oct-2026): una fila por DUEÑO (la
  // suscripción es de la cuenta; un dueño Pro tiene varios negocios bajo ella).
  // [{ ownerId, ownerName, ownerEmail, phone, countryCode, businesses: [{id, name}], createdAt, subscription }]
  getSubscriptions:   () => api.get('/boss/subscriptions'),
  updateSubscription: (ownerId, data) => api.patch(`/boss/subscriptions/${ownerId}`, data),
  markPaid:           (ownerId, months = 1) => api.post(`/boss/subscriptions/${ownerId}/mark-paid`, { months }),
  extendTrial:        (ownerId, days = 7) => api.post(`/boss/subscriptions/${ownerId}/extend-trial`, { days }),
  // API 1.17.0 (super admin): { couponId: 'ABC' | null } — cupón de Stripe de la cuenta; null lo quita. 400 COUPON_INVALID
  setCoupon:          (ownerId, couponId) => api.put(`/boss/subscriptions/${ownerId}/coupon`, { couponId }),
}
