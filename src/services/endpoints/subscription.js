import api from '../api'

/**
 * Planes y suscripción (M1 «Planes en serio», 15-oct-2026).
 * GET /plans es público (catálogo + prueba; los campos viejos del descuento de lanzamiento ya no se muestran);
 * GET /me/subscription devuelve el estado del negocio del usuario logueado.
 */
export const subscriptionApi = {
  getPlans: () => api.get('/plans'),
  getMine:  () => api.get('/me/subscription'),
  // Bajar de plan (API 1.16.0, PLANS-SPEC.md), solo OWNER:
  // → { plan, maxBusinesses, maxEmployeesPerBusiness, needsSelection,
  //     businesses: [{ id, name, planLocked, employees: [{ id, name, email, active, planDeactivated }] }] }
  downgradePreview: (plan) => api.get('/me/subscription/downgrade-preview', { params: { plan } }),
  // { businessIds, employeeIds } dentro de los límites del plan ACTUAL; aplica al momento.
  // 400 KEEP_SELECTION_INVALID
  setActiveSet: (keep) => api.put('/me/subscription/active-set', keep),
  // { ownerId, plan: 'BASIC'|'PRO'|'AI', status: 'TRIAL'|'ACTIVE'|'PAST_DUE'|'EXPIRED'|'CANCELED',
  //   trialEndsAt, paidUntil, daysLeft, listPriceMonthly, discountPercent, discountUntil,
  //   priceMonthly, currency, launchPriceLocked, readOnly, maxEmployees, note,
  //   maxBusinesses, businessesCount, stripeEnabled, stripeSubscriptionId,
  //   interval: 'MONTHLY'|'QUARTERLY'|'YEARLY'|null,
  //   cardOnFile, firstChargeAt, couponId, couponName }   (API 1.17.0: sin customPriceMonthly)
}
