// Tipos de gasto y medios de pago de «Compras y gastos» (William, 10-oct-2026).
// Las claves viajan al backend (ExpenseService.CATEGORIES / PAYMENT_METHODS);
// las etiquetas se traducen con t().
export const EXPENSE_CATEGORIES = [
  { key: 'RENT',        label: 'Alquiler',            emoji: '🏠' },
  { key: 'UTILITIES',   label: 'Luz, agua, internet', emoji: '💡' },
  { key: 'TRANSPORT',   label: 'Transporte y flete',  emoji: '🚚' },
  { key: 'SALARIES',    label: 'Sueldos',             emoji: '👷' },
  { key: 'TAXES',       label: 'Impuestos',           emoji: '🧾' },
  { key: 'MAINTENANCE', label: 'Mantenimiento',       emoji: '🔧' },
  { key: 'MARKETING',   label: 'Publicidad',          emoji: '📣' },
  { key: 'SUPPLIES',    label: 'Útiles y bolsas',     emoji: '🛍️' },
  { key: 'OTHER',       label: 'Otro gasto',          emoji: '📌' },
]

export const PAYMENT_METHODS = [
  { key: 'CASH',      label: 'Efectivo' },
  { key: 'YAPE_PLIN', label: 'Yape / Plin' },
  { key: 'TRANSFER',  label: 'Transferencia' },
  { key: 'CARD',      label: 'Tarjeta' },
  { key: 'OTHER',     label: 'Otro' },
]

export function categoryOf(key) {
  return EXPENSE_CATEGORIES.find((c) => c.key === key) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
}
