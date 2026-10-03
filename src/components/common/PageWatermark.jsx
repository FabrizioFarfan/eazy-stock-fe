import { createElement } from 'react'
import { useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Plus, ArrowUpDown, BarChart2, Users,
  Building2, Truck, Tag, FolderOpen, Settings, Bell, Wallet, HandCoins, FileText,
  Trophy, Scale, Crown, Award, MapPin, FileSpreadsheet, Download, UserRound,
} from 'lucide-react'

// Ruta → ícono de fondo. Gana el prefijo más largo (/reports/balance antes que
// /reports). Son los mismos dibujos del menú, para que la página se reconozca
// sin leer.
const ROUTE_ICONS = [
  ['/dashboard',            LayoutDashboard],
  ['/products/import',      FileSpreadsheet],
  ['/products/export',      Download],
  ['/products',             Package],
  ['/stock',                ArrowUpDown],
  ['/sales/new',            Plus],
  ['/sales',                ShoppingCart],
  ['/cotizaciones',         FileText],
  ['/reports/balance',      Scale],
  ['/reports/sellers',      Trophy],
  ['/reports/customers',    Award],
  ['/reports/suppliers',    Truck],
  ['/reports/receivables',  Wallet],
  ['/reports/payables',     HandCoins],
  ['/reports',              BarChart2],
  ['/customers/',           UserRound],
  ['/customers',            Users],
  ['/empleados',            Users],
  ['/suppliers',            Truck],
  ['/brands',               Tag],
  ['/categories',           FolderOpen],
  ['/locations',            MapPin],
  ['/notificaciones',       Bell],
  ['/settings',             Settings],
  ['/boss',                 Crown],
  ['/admin/businesses',     Building2],
  ['/admin/owners',         Users],
]

function iconFor(pathname) {
  let best = null
  for (const [prefix, Icon] of ROUTE_ICONS) {
    if (pathname.startsWith(prefix) && (!best || prefix.length > best[0].length)) best = [prefix, Icon]
  }
  return best?.[1] ?? null
}

/**
 * Watermark de TODAS las páginas de la app: el ícono de la sección gigante y
 * casi transparente, abajo a la derecha, sangrando fuera del borde como el
 * estampado de un polo. Vive en AppLayout (no en cada página) para que ninguna
 * se quede sin él. Fijo respecto a la ventana, nunca intercepta clics y a 4%
 * de opacidad no compite con tablas ni números.
 */
export default function PageWatermark() {
  const { pathname } = useLocation()
  const Icon = iconFor(pathname)
  if (!Icon) return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -bottom-10 -right-10 z-0 rotate-[-8deg] text-gray-900 opacity-[0.04] sm:-bottom-14 sm:-right-14"
    >
      {createElement(Icon, { className: 'h-64 w-64 sm:h-96 sm:w-96 lg:h-[32rem] lg:w-[32rem]', strokeWidth: 1.5 })}
    </div>
  )
}
