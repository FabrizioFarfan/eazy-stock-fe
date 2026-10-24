// Tipos de gasto y medios de pago de «Compras y gastos» (William, 10-oct-2026).
// Las claves viajan al backend (ExpenseService.CATEGORIES / PAYMENT_METHODS);
// las etiquetas se traducen con t().
import { getDefaultCountry } from './phone'

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
  // La clave sigue siendo YAPE_PLIN en el BE; fuera de Perú se lee «Billetera digital» (multi-país, 24-oct-2026).
  { key: 'YAPE_PLIN', get label() { return getDefaultCountry() === 'PE' ? 'Yape / Plin' : 'Billetera digital' } },
  { key: 'TRANSFER',  label: 'Transferencia' },
  { key: 'CARD',      label: 'Tarjeta' },
  { key: 'OTHER',     label: 'Otro' },
]

export function categoryOf(key) {
  return EXPENSE_CATEGORIES.find((c) => c.key === key) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
}
