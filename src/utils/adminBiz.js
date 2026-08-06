// SUPER_ADMIN opera "dentro" de un negocio: los endpoints de catálogo exigen su
// businessId como query param (OWNER/EMPLOYEE lo resuelven del token y lo ignoran).
export const adminBizParam = (user) =>
  user?.role === 'SUPER_ADMIN' && user?.businessId ? { businessId: user.businessId } : {}
