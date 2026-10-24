// Moneda del negocio (tarea 213, sep-2026).
//
// Cada negocio tiene su moneda (ISO 4217) en el BE; el AuthContext la fija
// aquí al cargar el usuario (`setCurrentCurrency`) y desde entonces TODO
// importe se formatea con ella sin que cada llamada tenga que pasarla.
// Solo cambia el símbolo/formato: no hay conversión de tipo de cambio.
//
// `code` es el código para Intl.NumberFormat; `locale` manda el separador de
// miles y el estilo "1 234,56" vs "1,234.56"; `symbol` es lo que muestran los
// inputs y los ejes de los gráficos.
export const CURRENCIES = {
  PEN: { code: 'PEN', locale: 'es-PE', symbol: 'S/',  name: 'Sol peruano' },
  USD: { code: 'USD', locale: 'en-US', symbol: '$',   name: 'Dólar' },
  EUR: { code: 'EUR', locale: 'es-ES', symbol: '€',   name: 'Euro' },
  PLN: { code: 'PLN', locale: 'pl-PL', symbol: 'zł',  name: 'Złoty' },
  ARS: { code: 'ARS', locale: 'es-AR', symbol: '$',   name: 'Peso argentino' },
  BOB: { code: 'BOB', locale: 'es-BO', symbol: 'Bs',  name: 'Boliviano' },
  BRL: { code: 'BRL', locale: 'pt-BR', symbol: 'R$',  name: 'Real' },
  CLP: { code: 'CLP', locale: 'es-CL', symbol: '$',   name: 'Peso chileno' },
  COP: { code: 'COP', locale: 'es-CO', symbol: '$',   name: 'Peso colombiano' },
  MXN: { code: 'MXN', locale: 'es-MX', symbol: '$',   name: 'Peso mexicano' },
  PYG: { code: 'PYG', locale: 'es-PY', symbol: '₲',   name: 'Guaraní' },
  UYU: { code: 'UYU', locale: 'es-UY', symbol: '$',   name: 'Peso uruguayo' },
  VES: { code: 'VES', locale: 'es-VE', symbol: 'Bs.', name: 'Bolívar' },
  GBP: { code: 'GBP', locale: 'en-GB', symbol: '£',   name: 'Libra' },
  CHF: { code: 'CHF', locale: 'de-CH', symbol: 'CHF', name: 'Franco suizo' },
  CAD: { code: 'CAD', locale: 'en-CA', symbol: '$',   name: 'Dólar canadiense' },
  DOP: { code: 'DOP', locale: 'es-DO', symbol: 'RD$', name: 'Peso dominicano' },
  GTQ: { code: 'GTQ', locale: 'es-GT', symbol: 'Q',   name: 'Quetzal' },
  CRC: { code: 'CRC', locale: 'es-CR', symbol: '₡',   name: 'Colón' },
  HNL: { code: 'HNL', locale: 'es-HN', symbol: 'L',   name: 'Lempira' },
  NIO: { code: 'NIO', locale: 'es-NI', symbol: 'C$',  name: 'Córdoba' },
  PAB: { code: 'PAB', locale: 'es-PA', symbol: 'B/.', name: 'Balboa' },
}

/** Opciones para los selects de Ajustes / Negocios, en el orden que conviene mostrar. */
export const CURRENCY_OPTIONS = Object.keys(CURRENCIES)

/** Lo que mejor pega con el país del negocio (para preseleccionar al crearlo). */
export const CURRENCY_BY_COUNTRY = {
  PE: 'PEN', US: 'USD', EC: 'USD', SV: 'USD', PA: 'PAB', ES: 'EUR', IT: 'EUR', DE: 'EUR', FR: 'EUR', PT: 'EUR',
  PL: 'PLN', AR: 'ARS', BO: 'BOB', BR: 'BRL', CL: 'CLP', CO: 'COP', MX: 'MXN', PY: 'PYG', UY: 'UYU', VE: 'VES',
  GB: 'GBP', CH: 'CHF', CA: 'CAD', DO: 'DOP', GT: 'GTQ', CR: 'CRC', HN: 'HNL', NI: 'NIO',
}

/**
 * Decimales a mostrar en IMPORTES por moneda (contrato multi-país, 24-oct-2026):
 * CLP, COP y PYG sin céntimos; el resto 2. El negocio los trae en
 * `currencyDecimals` (/auth/me) y manda sobre esta tabla, que es el respaldo.
 */
export const CURRENCY_DECIMALS = { CLP: 0, COP: 0, PYG: 0 }

let currentCurrency = 'PEN'
// Lo que manda el negocio (/auth/me): símbolo, decimales y locale de Intl.
let business = { symbol: null, decimals: null, locale: null }

/** La fija el AuthContext con la moneda del negocio del usuario logueado. */
export function setCurrentCurrency(code) {
  currentCurrency = /^[A-Z]{3}$/.test(code ?? '') ? code : 'PEN'
}
export function getCurrentCurrency() { return currentCurrency }

/**
 * Moneda + formato del negocio en una llamada (AuthContext, con el usuario de /auth/me):
 * { currency, currencySymbol, currencyDecimals, locale }. null = vuelve a PEN.
 */
export function setBusinessCurrency(u) {
  setCurrentCurrency(u?.currency)
  business = {
    symbol: u?.currencySymbol || null,
    decimals: Number.isInteger(u?.currencyDecimals) ? u.currencyDecimals : null,
    locale: u?.locale || null,
  }
}

/** Decimales de los importes en la moneda activa (o la que se pase): 2, o 0 en CLP/COP/PYG. */
export function currencyDecimals(currency = currentCurrency) {
  if (currency === currentCurrency && business.decimals != null) return business.decimals
  return CURRENCY_DECIMALS[currency] ?? 2
}

function intlFor(currency) {
  const known = CURRENCIES[currency]
  const locale = (currency === currentCurrency && business.locale) || known?.locale || 'es-PE'
  return { code: known?.code ?? currency ?? 'PEN', locale }
}

/** Símbolo corto ("S/", "$", "€") de la moneda activa o de la que se pase. */
export function currencySymbol(currency = currentCurrency) {
  if (currency === currentCurrency && business.symbol) return business.symbol
  return CURRENCIES[currency]?.symbol ?? currency ?? CURRENCIES.PEN.symbol
}

function intlFormat(n, currency, decimals) {
  const { code, locale } = intlFor(currency)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency: code, minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    }).format(n)
  } catch {
    // Código que Intl no conoce: número con el símbolo delante.
    return `${currencySymbol(currency)} ${n.toFixed(decimals)}`
  }
}

/**
 * Format a money value for display.
 *
 *  - At least the business decimals (2, or 0 for CLP/COP/PYG): "S/ 25.50", "$ 1.500".
 *  - If the value carries more (up to 6), as many as it actually has
 *    ("S/ 0.0357"), no trailing-zero padding.
 *  - `currency` defaults to the business currency set by the AuthContext.
 *  - Null/undefined/NaN renders as "—".
 *
 * Used for *unit* prices, line subtotals and similar — i.e. anywhere a value
 * coming from the DECIMAL(15,6) columns might surface.
 */
export function formatPrice(value, currency = currentCurrency) {
  if (value == null) return '—'
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n)) return '—'
  return intlFormat(n, currency, significantDecimals(n, currencyDecimals(currency)))
}

/**
 * Money AMOUNTS (a line subtotal, a sale total, a discount, a debt) always
 * show the business decimals HALF_UP — 12 × 0.1666 = 1.9992 reads «S/ 2.00»
 * (William, 16-sep: «antes me lo redondeaba a 2 soles»); in CLP/COP/PYG, no
 * decimals. Unit prices keep their 3-6 decimals through formatPrice().
 */
export function formatAmount(value, currency = currentCurrency) {
  if (value == null) return '—'
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n)) return '—'
  const d = currencyDecimals(currency)
  return intlFormat(roundTo(n, d), currency, d)
}

/** Half-up rounding to cents, defeating float noise (1.005 → 1.01, 1.9992 → 2). */
export function round2(n) {
  return roundTo(n, 2)
}

/** Half-up rounding to `d` decimals (0 for CLP: 1499.5 → 1500). */
export function roundTo(n, d) {
  const x = Number(n) || 0
  const f = 10 ** d
  return Math.round((x + Number.EPSILON) * f) / f
}

/**
 * Returns the number of decimals needed to faithfully render `n`:
 *  - `min` (the business decimals) if the value has no more than that
 *  - up to 6 otherwise, dropping trailing zeros (25.5037 → 4, 0.5 → 2, 0.05037 → 5)
 */
function significantDecimals(n, min = 2) {
  // Use toFixed(6) to defeat floating-point noise like 0.1 + 0.2 = 0.30000000000000004,
  // then strip trailing zeros.
  const fixed = n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  const dot   = fixed.indexOf('.')
  if (dot < 0) return min
  return Math.max(min, Math.min(6, fixed.length - dot - 1))
}
