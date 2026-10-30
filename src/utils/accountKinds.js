// Panel Boss (Frank, 30-oct-2026): qué es cada cuenta. «La única que cuenta de verdad es la de William; está
// mezclada con los testers, la mía y la de mi hermano.» La clasifica un BOSS; null = recién llegada, sin revisar.
// Va en el dueño de la cuenta (accountKind del negocio = el de su dueño).

export const KINDS = ['CUSTOMER', 'TESTER', 'TEAM']

/** Pestañas del panel, en este orden. */
export const FILTERS = ['customers', 'new', 'testers', 'team', 'all']

export const kindOf = (biz) => biz?.accountKind ?? null

const MATCH = {
  customers: (k) => k === 'CUSTOMER',
  new:       (k) => k === null,
  testers:   (k) => k === 'TESTER',
  team:      (k) => k === 'TEAM',
  all:       () => true,
}

/** ¿Una cuenta de este tipo sale en esta pestaña? (Negocios y Owners filtran sus propias listas con esto.) */
export function matchesFilter(kind, filter) {
  return (MATCH[filter] ?? MATCH.all)(kind ?? null)
}

/** Cuántas hay en cada pestaña, para cualquier lista con una función que dice su tipo. */
export function countKinds(items, kindFn) {
  return Object.fromEntries(FILTERS.map((f) => [f, (items ?? []).filter((it) => matchesFilter(kindFn(it), f)).length]))
}

export function filterBusinesses(businesses, filter) {
  const match = MATCH[filter] ?? MATCH.all
  return (businesses ?? []).filter((b) => match(kindOf(b)))
}

export function countByFilter(businesses) {
  return Object.fromEntries(FILTERS.map((f) => [f, filterBusinesses(businesses, f).length]))
}

/** Al abrir: los clientes si ya hay alguno; si no, lo nuevo por revisar; si tampoco, todo. */
export function defaultFilter(businesses) {
  const c = countByFilter(businesses)
  if (c.customers > 0) return 'customers'
  if (c.new > 0) return 'new'
  return 'all'
}

/**
 * Cuentas sin revisar, la más nueva primero: una por dueño (un dueño con dos negocios es una sola cuenta).
 * Los negocios viejos sin dueño no se pueden clasificar y no salen.
 */
export function pendingAccounts(businesses) {
  const byOwner = new Map()
  for (const b of businesses ?? []) {
    if (!b.ownerId || kindOf(b) !== null) continue
    const acc = byOwner.get(b.ownerId) ?? { ownerId: b.ownerId, ownerName: b.ownerName, businesses: [], createdAt: b.createdAt }
    acc.businesses.push(b)
    if (b.createdAt && (!acc.createdAt || b.createdAt < acc.createdAt)) acc.createdAt = b.createdAt
    byOwner.set(b.ownerId, acc)
  }
  return [...byOwner.values()].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
}

/** Tras clasificar a un dueño, todos sus negocios cambian a la vez (para pintar sin esperar al servidor). */
export function withKind(businesses, ownerId, kind) {
  return (businesses ?? []).map((b) => (b.ownerId === ownerId ? { ...b, accountKind: kind } : b))
}
