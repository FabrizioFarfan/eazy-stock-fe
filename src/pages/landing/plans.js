// ═══════════════════════════════════════════════════════════════════════════
//  PLANES Y OFERTAS de Eazy Stock (17-sep-2026, plan M1 «Plans & feature gating»;
//  precios y períodos definitivos de Frank el 20-oct-2026, task 1015)
//
//  Un solo sitio para los números: la sección «Precios» del Inicio, la página
//  /planes y Ajustes › Tu plan leen de aquí. Perú ve SOLES; los demás países,
//  DÓLARES. Tres períodos: mensual, trimestral (−10 %) y anual (−20 %); los
//  totales de cada período son una TABLA (redondeos hechos por Frank), no una
//  fórmula, y el BE (enums/Plan.java) tiene la misma tabla para el cobro.
//  Los límites: Basic 1 negocio / 5 trabajadores, Pro ilimitado, AI = Pro + IA
//  (AI «llega pronto»: se muestra pero todavía no se contrata).
// ═══════════════════════════════════════════════════════════════════════════

/** Símbolo de los soles: lo usa el panel del boss, que trabaja siempre en PEN. */
export const CURRENCY = 'S/'
/** Prueba gratis sin tarjeta (Frank, 15-oct-2026: «2 semanas free»). El BE la aplica en /auth/register. */
export const TRIAL_DAYS = 14
/** Oferta de lanzamiento (Frank, 15-oct-2026, «50 % los primeros 6 meses, vemos»): la aplica el BE al registrarse. */
export const LAUNCH_DISCOUNT_PERCENT = 50
export const LAUNCH_DISCOUNT_MONTHS = 6

// ── Promo de lanzamiento (Frank + Fabrizio, 19-oct-2026, task 1001) ──────────
/** Gratis hasta esta fecha, sin tarjeta, para quien se registra antes; el BE manda (app.promo.free-until). */
export const PROMO_FREE_UNTIL = '2026-12-15'
/** Los primeros N negocios son «fundadores»: descuento de lanzamiento y precio bloqueado. */
export const FOUNDERS_LIMIT = 50
/** Día del mes en que se cobra la suscripción. */
export const BILLING_DAY = 15

// ── Períodos y monedas (20-oct-2026, task 1015) ──────────────────────────────
/** `interval` es lo que entiende el BE en POST /billing/checkout. */
export const PERIODS = [
  { key: 'monthly',   interval: 'MONTHLY',   months: 1,  discount: 0,  label: 'Mensual',    unit: 'mes' },
  { key: 'quarterly', interval: 'QUARTERLY', months: 3,  discount: 10, label: 'Trimestral', unit: 'trimestre' },
  { key: 'yearly',    interval: 'YEARLY',    months: 12, discount: 20, label: 'Anual',      unit: 'año' },
]
export const DEFAULT_PERIOD = 'monthly'
export const QUARTERLY_DISCOUNT = 10
export const YEARLY_DISCOUNT = 20

/** Las dos monedas de la lista de precios: soles (Perú) y dólares (resto). */
export const PRICE_CURRENCIES = {
  PEN: { symbol: 'S/',  locale: 'es-PE' },
  USD: { symbol: 'US$', locale: 'en-US' },
}

export function periodOf(key) {
  return PERIODS.find((p) => p.key === key || p.interval === key) ?? PERIODS[0]
}

/** Moneda de un negocio por su país: soles en Perú, dólares en el resto (igual que el BE). */
export function currencyForCountry(countryCode) {
  return String(countryCode ?? '').trim().toUpperCase() === 'PE' ? 'PEN' : 'USD'
}

/**
 * Moneda de la web pública: soles si el navegador está en español de Perú o en
 * español sin región ('es-PE', 'es'); dólares para todo lo demás (en, it, es-AR, es-CO…).
 */
export function siteCurrency(language = typeof navigator !== 'undefined' ? navigator.language : 'es-PE') {
  const [lang, region] = String(language || 'es').toLowerCase().split(/[-_]/)
  if (lang !== 'es') return 'USD'
  return !region || region === 'pe' ? 'PEN' : 'USD'
}

/** Total que se paga de una vez por el período (tabla). */
export function periodPrice(plan, period = DEFAULT_PERIOD, currency = 'PEN') {
  const prices = plan.prices[currency] ?? plan.prices.USD
  return prices[periodOf(period).key]
}

/** Lo que sale el mes dentro de ese período (total ÷ meses, a 2 decimales). */
export function perMonth(plan, period = DEFAULT_PERIOD, currency = 'PEN') {
  const p = periodOf(period)
  return Math.round((periodPrice(plan, p.key, currency) / p.months) * 100) / 100
}

/** Cuánto se ahorra frente a pagar mes a mes durante el mismo período: { amount, percent }. */
export function savings(plan, period = DEFAULT_PERIOD, currency = 'PEN') {
  const p = periodOf(period)
  const monthly = periodPrice(plan, 'monthly', currency) * p.months
  const amount = Math.round((monthly - periodPrice(plan, p.key, currency)) * 100) / 100
  return { amount, percent: p.discount, monthlyTotal: monthly }
}

/** { symbol: 'S/', number: '1,334' } para pintar el símbolo chico y la cifra grande. */
export function moneyParts(amount, currency = 'PEN') {
  const cur = PRICE_CURRENCIES[currency] ?? PRICE_CURRENCIES.USD
  if (amount == null || Number.isNaN(Number(amount))) return { symbol: cur.symbol, number: '—' }
  const n = Number(amount)
  const decimals = Number.isInteger(n) ? 0 : 2
  return { symbol: cur.symbol, number: n.toLocaleString(cur.locale, { minimumFractionDigits: decimals, maximumFractionDigits: 2 }) }
}

/** «S/ 36» · «US$ 9.90» · «S/ 1,334»: decimales solo si los hay. */
export function fmtMoney(amount, currency = 'PEN') {
  const { symbol, number } = moneyParts(amount, currency)
  return `${symbol} ${number}`
}

export function promoActive(today = new Date()) {
  return today.toISOString().slice(0, 10) <= PROMO_FREE_UNTIL
}

/** «15 de diciembre» / «December 15» / «15 dicembre» según el idioma activo. */
export function promoFreeUntilLabel(locale = 'es-PE', withYear = false) {
  const d = new Date(`${PROMO_FREE_UNTIL}T12:00:00`)
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) }).format(d)
}

/** Variables para los textos de la promo y los períodos: {date}, {days}, {n}, {pct}, {months}, {day}, {q}, {y}. */
export function promoVars(locale) {
  return { date: promoFreeUntilLabel(locale), days: TRIAL_DAYS, n: FOUNDERS_LIMIT, pct: LAUNCH_DISCOUNT_PERCENT, months: LAUNCH_DISCOUNT_MONTHS, day: BILLING_DAY, q: QUARTERLY_DISCOUNT, y: YEARLY_DISCOUNT }
}

/**
 * Frase corta de la prueba gratis: durante la promo «Gratis hasta el 15 de diciembre, sin tarjeta»;
 * después vuelve a «14 días gratis, sin tarjeta». `t` es el traductor activo.
 */
export function trialLine(t, locale) {
  return promoActive()
    ? t('Gratis hasta el {date}, sin tarjeta', promoVars(locale))
    : t('{days} días gratis, sin tarjeta', { days: TRIAL_DAYS })
}

export const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    tagline: 'Para una tienda que quiere dejar el cuaderno.',
    /** Totales a pagar de una vez por período (tabla de Frank, 20-oct-2026). */
    prices: {
      PEN: { monthly: 36, quarterly: 97, yearly: 345 },
      USD: { monthly: 9.90, quarterly: 26.70, yearly: 95 },
    },
    tone: 'from-slate-500 to-slate-700',
    limits: [
      ['1', 'negocio'],
      ['5', 'trabajadores'],
    ],
    features: [
      'Inventario, ventas, fiado y recepciones',
      'Cierre de caja por medio de pago',
      'Cotizaciones y estado de cuenta en PDF',
      'Importar y exportar desde Excel',
      'Reportes: ventas, vencimientos, mejores clientes',
      'Tutoriales en cada pantalla · ES · EN · IT',
    ],
    cta: 'Empezar con Basic',
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'Para el dueño con más de una tienda o un equipo grande.',
    prices: {
      PEN: { monthly: 79, quarterly: 213, yearly: 758 },
      USD: { monthly: 22.90, quarterly: 61.80, yearly: 219 },
    },
    tone: 'from-blue-600 to-indigo-600',
    highlight: true,
    badge: 'Más elegido',
    limits: [
      ['∞', 'negocios'],
      ['∞', 'trabajadores'],
    ],
    features: [
      'Todo lo de Basic',
      'Negocios ilimitados en una sola cuenta',
      'Trabajadores ilimitados con permisos por persona',
      'Panel del dueño: todas tus tiendas en una pantalla',
      'Cambia de negocio sin cerrar sesión',
      'Soporte prioritario por WhatsApp',
    ],
    cta: 'Empezar con Pro',
  },
  {
    key: 'ai',
    name: 'AI',
    tagline: 'Para vender hablando y dejar que la IA mire tus números.',
    prices: {
      PEN: { monthly: 139, quarterly: 375, yearly: 1334 },
      USD: { monthly: 39.90, quarterly: 107.70, yearly: 383 },
    },
    tone: 'from-violet-500 to-fuchsia-600',
    badge: 'Con IA',
    /** Llega pronto (20-oct-2026): se muestra con sus funciones, pero no se puede pagar todavía. */
    comingSoon: true,
    limits: [
      ['∞', 'negocios'],
      ['∞', 'trabajadores'],
    ],
    features: [
      'Todo lo de Pro',
      'Ventas por nota de voz: dictas y confirmas',
      'Análisis: lo que más vendes, lo lento y lo que vence',
      'Ofertas sugeridas que tú apruebas',
      'Clientes con consentimiento para recibir ofertas',
      'Envío de ofertas por WhatsApp o SMS con resultados',
    ],
    cta: 'Empezar con AI',
  },
]

/** Filas de la tabla comparativa de /planes: [texto, basic, pro, ai]. true = ✓, string = texto. */
export const COMPARE = [
  ['Negocios',                                  '1',            'Ilimitados', 'Ilimitados'],
  ['Trabajadores',                              'Hasta 5',      'Ilimitados', 'Ilimitados'],
  ['Inventario, ventas, fiado y recepciones',   true, true, true],
  ['Cierre de caja y fondo de caja',            true, true, true],
  ['Cotizaciones y pedidos al proveedor en PDF',true, true, true],
  ['Importar / exportar Excel',                 true, true, true],
  ['Reportes y análisis de clientes',           true, true, true],
  ['Permisos por trabajador',                   true, true, true],
  ['Panel del dueño con varios negocios',       false, true, true],
  ['Soporte prioritario por WhatsApp',          false, true, true],
  ['Ventas por nota de voz',                    false, false, true],
  ['Análisis de ventas con IA',                 false, false, true],
  ['Ofertas sugeridas y envío a clientes',      false, false, true],
]

/** Ofertas vigentes: se muestran en la landing y en /planes. */
export const OFFERS = [
  {
    key: 'trial',
    icon: 'Sparkles',
    tone: 'from-amber-400 to-orange-500',
    title: 'Gratis hasta el {date}, sin tarjeta',
    desc: 'Creas tu cuenta en un minuto y usas todo Eazy Stock con tu negocio real, gratis, hasta el {date}. Recién entonces eliges tu plan; si no te ordena la tienda, no nos debes nada.',
    afterPromo: {
      title: '{days} días gratis, sin tarjeta',
      desc: 'Creas tu cuenta en un minuto y usas todo Eazy Stock con tu negocio real durante {days} días. Si no te ordena la tienda, no nos debes nada.',
    },
  },
  {
    key: 'launch',
    icon: 'Lock',
    tone: 'from-blue-500 to-indigo-600',
    title: 'Los primeros {n} negocios pagan la mitad {months} meses',
    desc: 'Si eres de los primeros {n} en registrarte, al terminar la promo pagas {pct} % menos durante {months} meses, en cualquier plan, y conservas el precio de lanzamiento para siempre. En Ajustes › Tu plan ves si entraste.',
  },
  {
    key: 'periods',
    icon: 'CalendarClock',
    tone: 'from-emerald-500 to-teal-600',
    title: 'Paga el trimestre o el año y ahorra',
    desc: 'Cualquier plan pagado por trimestre sale {q} % más barato y pagado por año, {y} % más barato, de una sola vez. Y siempre con la prueba gratis primero, sin tarjeta.',
  },
]

export const PLAN_FAQS = [
  ['¿Qué pasa cuando termine la prueba gratis?', 'Eliges tu plan y sigues donde estabas: no se borra nada. Si no eliges, tu cuenta queda en modo lectura hasta que decidas, con todos tus datos intactos.'],
  ['¿Hasta cuándo es gratis?', 'Hasta el {date}, para quien se registra antes de esa fecha. Después, cada cuenta nueva tiene {days} días de prueba. La promo no pide tarjeta: la pones solo cuando decides seguir.'],
  ['¿Qué ganan los primeros {n} negocios?', 'Pagan {pct} % menos durante los primeros {months} meses en cualquier plan y conservan el precio de lanzamiento para siempre. En Ajustes › Tu plan ves si entraste: sí o no.'],
  ['¿Puedo cambiar de plan más adelante?', 'Sí, cuando quieras y desde Ajustes. Al subir de plan el cambio es inmediato. Al bajar, mantienes lo que tienes hasta el cierre del período y te avisamos si algo supera el límite del plan nuevo.'],
  ['Tengo dos tiendas, ¿necesito dos cuentas?', 'No. Con Pro o AI manejas todos tus negocios desde una sola cuenta y un solo panel; cada tienda tiene su stock, su caja y su gente por separado.'],
  ['¿Qué cuenta como trabajador?', 'Cada persona con su propio usuario: vendedores, almacenero, contador. El dueño no cuenta. Un trabajador dado de baja libera su lugar.'],
  ['¿La IA registra ventas sola?', 'Nunca. La IA prepara el borrador de la venta o de la oferta y una persona lo confirma. Si un producto no existe o no hay stock, te lo dice antes de registrar nada.'],
  ['¿Cómo se paga?', 'Con tarjeta desde Ajustes › Tu plan, mensual, trimestral ({q} % menos) o anual ({y} % menos): se cobra el día {day}, de una sola vez por período. También por transferencia o billetera digital escribiéndonos por WhatsApp. Los precios están en soles para Perú y en dólares para los demás países.'],
  ['¿Cuándo llega el plan AI?', 'Pronto. Las funciones de inteligencia artificial están en desarrollo; mientras tanto eliges Basic o Pro y te pasas a AI cuando salga, sin perder nada y sin volver a empezar.'],
]
