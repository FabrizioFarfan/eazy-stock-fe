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

/** Frank (30-oct): las listas se abren SIEMPRE en «Clientes». */
export function defaultFilter() {
  return 'customers'
}

const DAY_MS = 86400000

/**
 * El bloque «Cuentas nuevas» del Panel Boss, una por dueño y la más nueva primero:
 *  - las que nadie ha revisado (accountKind null, las de antes del 30-oct o las que crea un BOSS a mano), y
 *  - los clientes que se registraron en los últimos `days` días (desde el 30-oct el registro entra como Cliente),
 *    para ver quién va llegando y pasar a Tester el que sea de prueba.
 * Los negocios sin dueño no se pueden clasificar y no salen.
 */
export function newAccounts(businesses, nowTs, days = 7) {
  const since = nowTs ? nowTs - days * DAY_MS : null
  const byOwner = new Map()
  for (const b of businesses ?? []) {
    if (!b.ownerId) continue
    const acc = byOwner.get(b.ownerId) ?? { ownerId: b.ownerId, ownerName: b.ownerName, kind: kindOf(b), businesses: [], createdAt: b.createdAt }
    acc.businesses.push(b)
    if (b.createdAt && (!acc.createdAt || b.createdAt < acc.createdAt)) acc.createdAt = b.createdAt
    byOwner.set(b.ownerId, acc)
  }
  const recent = (a) => since !== null && a.createdAt && new Date(a.createdAt).getTime() >= since
  return [...byOwner.values()]
    .filter((a) => a.kind === null || (a.kind === 'CUSTOMER' && recent(a)))
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
}

/** Tras clasificar a un dueño, todos sus negocios cambian a la vez (para pintar sin esperar al servidor). */
export function withKind(businesses, ownerId, kind) {
  return (businesses ?? []).map((b) => (b.ownerId === ownerId ? { ...b, accountKind: kind } : b))
}
