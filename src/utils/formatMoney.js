// Locale + symbol matrix.
// `code` is used as the Intl.NumberFormat currency code; `locale` controls
// the thousands separator and "1 234,56" vs "1,234.56" style.
const CURRENCIES = {
  PEN: { code: 'PEN', locale: 'es-PE' },
  USD: { code: 'USD', locale: 'en-US' },
  EUR: { code: 'EUR', locale: 'es-ES' },
  PLN: { code: 'PLN', locale: 'pl-PL' },
}

/**
 * Format a money value for display.
 *
 *  - If the value has 2 decimals or fewer, render with exactly 2 decimals
 *    ("S/ 25.50") so totals always look like prices.
 *  - If the value has 3-6 decimals, render with as many decimals as the value
 *    actually carries ("S/ 0.0357"), no trailing-zero padding.
 *  - Pass a `currency` code (PEN | USD | EUR | PLN). Defaults to PEN.
 *  - Null/undefined/NaN renders as "—".
 *
 * Used for *unit* prices, line subtotals and similar — i.e. anywhere a value
 * coming from the new DECIMAL(15,6) columns might surface. Aggregates that are
 * always 2-decimal (sale.total, daily revenue) just round naturally to 2.
 */
export function formatPrice(value, currency = 'PEN') {
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
