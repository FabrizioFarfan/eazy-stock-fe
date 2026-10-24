// Medios de pago del negocio (multi-país, 24-oct-2026; API 1.13.0).
// La lista la mantiene el dueño en Ajustes › Medios de pago; aquí solo el
// ícono que le toca a cada uno y el respaldo si el API todavía no los da.
import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from 'lucide-react'
import { FALLBACK_COUNTRY_CONFIGS } from './countries'
import { getDefaultCountry } from './phone'

/**
 * Ícono + colores de un medio: el efectivo por `cash` (no por el nombre); el
 * resto se adivina por el nombre (tarjeta, transferencia, billeteras…).
 */
export function paymentMethodIcon(method) {
  const cash = typeof method === 'object' ? method?.cash : false
  const name = (typeof method === 'object' ? method?.name ?? method?.method : method) || ''
  const m = name.toLowerCase()
  if (cash || m.includes('efectivo') || m.includes('cash')) return { Icon: Banknote, cls: 'bg-emerald-50 text-emerald-600' }
  if (m.includes('transfer') || m.includes('banco'))        return { Icon: Landmark, cls: 'bg-blue-50 text-blue-600' }
  if (m.includes('tarjeta') || m.includes('pos') || m.includes('card')) return { Icon: CreditCard, cls: 'bg-amber-50 text-amber-600' }
  if (/yape|plin|nequi|daviplata|bizum|mercado pago|billetera|wallet/.test(m)) return { Icon: Smartphone, cls: 'bg-purple-50 text-purple-600' }
  return { Icon: Wallet, cls: 'bg-gray-100 text-gray-500' }
}

/**
 * Los medios por defecto del país del negocio, sin id: solo para seguir
 * vendiendo si el API es anterior a 1.13.0 (entonces la venta viaja con el nombre).
 */
export function fallbackPaymentMethods(country = getDefaultCountry()) {
  const cfg = FALLBACK_COUNTRY_CONFIGS.find((c) => c.code === country)
  const names = cfg?.defaultPaymentMethods ?? ['Efectivo', 'Tarjeta', 'Transferencia', 'Billetera digital']
  return names.map((name, i) => ({ id: null, name, active: true, sortOrder: i, cash: i === 0, usedInSales: false }))
}

/** Clave estable de un medio en la UI: su id, o el nombre si viene del respaldo. */
export const methodKey = (m) => m?.id ?? `name:${m?.name}`
