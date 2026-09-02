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

let currentCurrency = 'PEN'

/** La fija el AuthContext con la moneda del negocio del usuario logueado. */
export function setCurrentCurrency(code) {
  currentCurrency = CURRENCIES[code] ? code : 'PEN'
}
export function getCurrentCurrency() { return currentCurrency }

/** Símbolo corto ("S/", "$", "€") de la moneda activa o de la que se pase. */
export function currencySymbol(currency = currentCurrency) {
  return (CURRENCIES[currency] ?? CURRENCIES.PEN).symbol
}

/**
 * Format a money value for display.
 *
 *  - If the value has 2 decimals or fewer, render with exactly 2 decimals
 *    ("S/ 25.50") so totals always look like prices.
 *  - If the value has 3-6 decimals, render with as many decimals as the value
 *    actually carries ("S/ 0.0357"), no trailing-zero padding.
 *  - `currency` defaults to the business currency set by the AuthContext.
 *  - Null/undefined/NaN renders as "—".
 *
 * Used for *unit* prices, line subtotals and similar — i.e. anywhere a value
 * coming from the DECIMAL(15,6) columns might surface. Aggregates that are
 * always 2-decimal (sale.total, daily revenue) just round naturally to 2.
 */
export function formatPrice(value, currency = currentCurrency) {
  if (value == null) return '—'
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n)) return '—'

  const { code, locale } = CURRENCIES[currency] ?? CURRENCIES.PEN
  const decimals = significantDecimals(n)

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

/**
 * Returns the number of decimals needed to faithfully render `n`:
 *  - 2 if the value has 0-2 meaningful decimals
 *  - up to 6 otherwise, dropping trailing zeros (25.5037 → 4, 0.5 → 2, 0.05037 → 5)
 */
function significantDecimals(n) {
  // Use toFixed(6) to defeat floating-point noise like 0.1 + 0.2 = 0.30000000000000004,
  // then strip trailing zeros.
  const fixed = n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  const dot   = fixed.indexOf('.')
  if (dot < 0) return 2
  return Math.max(2, Math.min(6, fixed.length - dot - 1))
}
