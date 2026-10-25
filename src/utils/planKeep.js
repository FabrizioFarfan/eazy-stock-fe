// Bajar de plan (web 1.23.0 · API 1.16.0, PLANS-SPEC.md): qué negocios y trabajadores quedan
// activos con el plan nuevo. Lógica pura del modal (sin imports, se prueba con node --test).
// El API manda: GET /me/subscription/downgrade-preview?plan=… y `keep` en POST /billing/checkout
// o PUT /me/subscription/active-set.

export const PLAN_ORDER = ['BASIC', 'PRO', 'AI']

const rank = (plan) => PLAN_ORDER.indexOf(String(plan ?? '').toUpperCase())

/** ¿Pasar de `from` a `to` es bajar de plan? (plan desconocido → no) */
export function isDowngrade(from, to) {
  const a = rank(from), b = rank(to)
  return a >= 0 && b >= 0 && b < a
}

/** Trabajadores que cuentan para el límite: activos o desactivados por el plan (no los dados de baja a mano). */
export const countedEmployees = (biz) => (biz?.employees ?? []).filter((e) => e.active || e.planDeactivated)

const limit = (n) => (n == null ? Infinity : Number(n))

/**
 * Propuesta inicial: los negocios que hoy no están bloqueados primero (en el orden del API, que es
 * el de antigüedad), hasta el máximo; en cada uno, los trabajadores activos primero y luego los
 * desactivados por el plan, hasta el máximo por negocio.
 */
export function defaultKeep(preview) {
  const maxB = limit(preview?.maxBusinesses), maxE = limit(preview?.maxEmployeesPerBusiness)
  const all = preview?.businesses ?? []
  const ordered = [...all.filter((b) => !b.planLocked), ...all.filter((b) => b.planLocked)]
  const businessIds = ordered.slice(0, Math.max(1, Math.min(maxB, ordered.length))).map((b) => b.id)
  const employeeIds = []
  for (const b of all.filter((x) => businessIds.includes(x.id))) {
    const emps = countedEmployees(b)
    const ord = [...emps.filter((e) => e.active && !e.planDeactivated), ...emps.filter((e) => !(e.active && !e.planDeactivated))]
    employeeIds.push(...ord.slice(0, Math.min(maxE, ord.length)).map((e) => e.id))
  }
  return { businessIds, employeeIds }
}

/** Solo los trabajadores de negocios que quedan (lo que se manda al API). */
export function keepPayload(preview, keep) {
  const kept = new Set(keep.businessIds)
  const allowed = new Set((preview?.businesses ?? []).filter((b) => kept.has(b.id)).flatMap((b) => countedEmployees(b).map((e) => e.id)))
  return { businessIds: [...keep.businessIds], employeeIds: keep.employeeIds.filter((id) => allowed.has(id)) }
}

/**
 * Valida como el API (KEEP_SELECTION_INVALID): al menos 1 negocio, como mucho `maxBusinesses`, y
 * como mucho `maxEmployeesPerBusiness` trabajadores por negocio. null si vale; si no,
 * { code: 'NO_BUSINESS' | 'TOO_MANY_BUSINESSES' | 'TOO_MANY_EMPLOYEES', businessId? }.
 */
export function validateKeep(preview, keep) {
  const { businessIds, employeeIds } = keepPayload(preview, keep)
  if (businessIds.length < 1) return { code: 'NO_BUSINESS' }
  if (businessIds.length > limit(preview?.maxBusinesses)) return { code: 'TOO_MANY_BUSINESSES' }
  const maxE = limit(preview?.maxEmployeesPerBusiness)
  const chosen = new Set(employeeIds)
  for (const b of preview?.businesses ?? []) {
    if (!businessIds.includes(b.id)) continue
    if (countedEmployees(b).filter((e) => chosen.has(e.id)).length > maxE) return { code: 'TOO_MANY_EMPLOYEES', businessId: b.id }
  }
  return null
}

/** Marca o desmarca un id en la lista. */
export const toggleId = (ids, id) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
