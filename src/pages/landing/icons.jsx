// ═══════════════════════════════════════════════════════════════════════════
//  Iconos PROPIOS de Eazy Stock (Frank, 20-oct-2026: «los de ahora se sienten
//  hechos por IA; hay que crear un diseño único»). Un solo trazo redondeado
//  (1.75 px sobre 48 × 48) y UN punto de acento azul por icono. Van siempre
//  dentro de <IconTile> (baldosa azul noche) para que toda la web hable igual.
// ═══════════════════════════════════════════════════════════════════════════

const ACCENT = '#60a5fa'

function Svg({ children, size = 26, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  )
}

/** Baldosa que envuelve cualquier icono: azul noche con el trazo en blanco. */
export function IconTile({ icon: Icon, size = 48, light = false, className = '' }) {
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-2xl ${light ? 'bg-white text-[#0a0e1a] ring-1 ring-gray-200' : 'bg-[#0a0e1a] text-white'} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.62)} />
    </span>
  )
}

// ── Beneficios y funciones ──────────────────────────────────────────────────

/** Caja registradora con el cajón abierto y dos monedas. */
export function IcoTill({ size }) {
  return (
    <Svg size={size}>
      <rect x="8" y="18" width="32" height="18" rx="3" />
      <path d="M8 26h32M14 10h20v8M22 31h4" />
      <circle cx="16" cy="31" r="2" fill={ACCENT} stroke="none" />
      <circle cx="33" cy="31" r="2" />
    </Svg>
  )
}

/** Cuaderno del fiado con la deuda tachada: cobrado. */
export function IcoLedger({ size }) {
  return (
    <Svg size={size}>
      <rect x="12" y="8" width="26" height="32" rx="3" />
      <path d="M19 16h12M19 22h12M19 28h6" />
      <circle cx="12" cy="14" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="22" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="30" r="1.3" fill="currentColor" stroke="none" />
      <path d="M27 31l3 3 6-6" stroke={ACCENT} strokeWidth="2.2" />
    </Svg>
  )
}

/** Estante con cajas y la alerta de mínimo. */
export function IcoShelf({ size }) {
  return (
    <Svg size={size}>
      <path d="M8 20h32M8 32h32M8 20v20M40 20v20" />
      <rect x="13" y="12" width="8" height="8" rx="1.5" />
      <rect x="24" y="14" width="6" height="6" rx="1.5" />
      <rect x="13" y="25" width="6" height="7" rx="1.5" />
      <circle cx="37" cy="10" r="5" fill={ACCENT} stroke="none" />
      <path d="M37 7.5v3M37 12.6v.2" stroke="#0a0e1a" strokeWidth="1.6" />
    </Svg>
  )
}

/** Equipo con permisos: dos personas y el escudo del dueño. */
export function IcoTeam({ size }) {
  return (
    <Svg size={size}>
      <circle cx="17" cy="15" r="5" />
      <path d="M7 36c0-6 4.5-10 10-10 3 0 5.5 1 7.5 3" />
      <circle cx="31" cy="15" r="5" />
      <path d="M27 24.5c1.2-.3 2.5-.5 4-.5" />
      <path d="M36 26l6 2v5.5c0 3.6-2.6 6-6 7-3.4-1-6-3.4-6-7V28z" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Etiqueta de precio que se corrige con el lápiz. */
export function IcoTag({ size }) {
  return (
    <Svg size={size}>
      <path d="M8 24L24 8h14v14L22 38z" />
      <circle cx="32" cy="16" r="2.3" />
      <path d="M26 42l10-10" stroke={ACCENT} strokeWidth="2.4" />
      <path d="M26 42l-3 1 1-3" />
    </Svg>
  )
}

/** Barras que suben y la moneda de la ganancia. */
export function IcoChart({ size }) {
  return (
    <Svg size={size}>
      <path d="M9 39h30M9 39V11" />
      <rect x="14" y="27" width="5" height="12" rx="1" />
      <rect x="22" y="21" width="5" height="18" rx="1" />
      <rect x="30" y="15" width="5" height="24" rx="1" fill={ACCENT} stroke="none" />
      <circle cx="39" cy="11" r="4" />
      <path d="M39 9v4" />
    </Svg>
  )
}

/** Escáner: las esquinas del visor y el código de barras. */
export function IcoScan({ size }) {
  return (
    <Svg size={size}>
      <path d="M10 16v-6h6M32 10h6v6M38 32v6h-6M16 38h-6v-6" />
      <path d="M17 18v12M21 18v12M25 18v12M29 18v12M32 18v12" />
      <path d="M8 24h32" stroke={ACCENT} strokeWidth="2.2" />
    </Svg>
  )
}

/** Camión del proveedor con el pedido. */
export function IcoTruck({ size }) {
  return (
    <Svg size={size}>
      <rect x="6" y="15" width="22" height="17" rx="2" />
      <path d="M28 21h7l6 6v5h-13" />
      <circle cx="14" cy="36" r="3" />
      <circle cx="35" cy="36" r="3" />
      <path d="M12 23h10" stroke={ACCENT} strokeWidth="2.2" />
    </Svg>
  )
}

/** Teléfono con la burbuja: WhatsApp al cliente. */
export function IcoChat({ size }) {
  return (
    <Svg size={size}>
      <rect x="14" y="6" width="20" height="36" rx="4" />
      <path d="M21 10h6" />
      <path d="M20 19h9a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-3l-4 3v-3a3 3 0 0 1-2-3v-3a3 3 0 0 1 0-3z" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Hoja de Excel que entra a la app. */
export function IcoSheet({ size }) {
  return (
    <Svg size={size}>
      <path d="M12 8h16l8 8v24H12z" />
      <path d="M28 8v8h8M17 22h14M17 28h14M17 34h8" />
      <path d="M22 22v12" />
      <circle cx="36" cy="38" r="4" fill={ACCENT} stroke="none" />
      <path d="M34 38l1.5 1.5 3-3" stroke="#0a0e1a" strokeWidth="1.6" />
    </Svg>
  )
}

// ── Tipos de negocio ────────────────────────────────────────────────────────

/** Ferretería: llave y tornillo. */
export function IcoHardware({ size }) {
  return (
    <Svg size={size}>
      <path d="M31 9a7 7 0 0 0-8.6 8.6L10 30l4 4 12.4-12.4A7 7 0 0 0 35 13l-4 4-3-3z" />
      <path d="M36 28v12M33 31h6M33 35h6" />
      <circle cx="36" cy="27" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Bodega o minimarket: el toldo del barrio. */
export function IcoStore({ size }) {
  return (
    <Svg size={size}>
      <path d="M8 20l3-10h26l3 10" />
      <path d="M8 20a4 4 0 0 0 8 0 4 4 0 0 0 8 0 4 4 0 0 0 8 0 4 4 0 0 0 8 0" />
      <path d="M11 24v15h26V24" />
      <rect x="20" y="30" width="8" height="9" rx="1" />
      <circle cx="31" cy="30" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Farmacia o botica: el frasco con la cruz. */
export function IcoPharmacy({ size }) {
  return (
    <Svg size={size}>
      <rect x="15" y="15" width="18" height="26" rx="3" />
      <path d="M19 9h10v6H19z" />
      <path d="M24 23v10M19 28h10" stroke={ACCENT} strokeWidth="2.6" />
    </Svg>
  )
}

/** Abarrotes y alimentos: la canasta. */
export function IcoBasket({ size }) {
  return (
    <Svg size={size}>
      <path d="M8 20h32l-4 18H12z" />
      <path d="M17 20c0-8 14-8 14 0" />
      <path d="M18 26v8M24 26v8M30 26v8" />
      <circle cx="24" cy="11" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Librería o bazar: el libro abierto. */
export function IcoBook({ size }) {
  return (
    <Svg size={size}>
      <path d="M24 14c-3-3-8-4-14-3v24c6-1 11 0 14 3 3-3 8-4 14-3V11c-6-1-11 0-14 3z" />
      <path d="M24 14v24" />
      <path d="M15 19h5M28 19h5" />
      <circle cx="33" cy="26" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Repuestos y talleres: la tuerca. */
export function IcoGear({ size }) {
  return (
    <Svg size={size}>
      <path d="M24 7l14.7 8.5v17L24 41 9.3 32.5v-17z" />
      <circle cx="24" cy="24" r="6" />
      <circle cx="24" cy="24" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Ropa y calzado: la camiseta. */
export function IcoShirt({ size }) {
  return (
    <Svg size={size}>
      <path d="M17 9l7 3 7-3 9 6-4 7-4-2v19H16V20l-4 2-4-7z" />
      <circle cx="24" cy="30" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Veterinaria o tienda de mascotas: la huella. */
export function IcoPaw({ size }) {
  return (
    <Svg size={size}>
      <ellipse cx="15" cy="17" rx="3" ry="4" />
      <ellipse cx="24" cy="12" rx="3" ry="4" />
      <ellipse cx="33" cy="17" rx="3" ry="4" />
      <path d="M24 22c6 0 10 5 11 10 .6 3-1.6 6-5 6-2.3 0-4-1-6-1s-3.7 1-6 1c-3.4 0-5.6-3-5-6 1-5 5-10 11-10z" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Cafetería o restaurante pequeño: la taza. */
export function IcoCup({ size }) {
  return (
    <Svg size={size}>
      <path d="M10 18h24v10a9 9 0 0 1-9 9h-6a9 9 0 0 1-9-9z" />
      <path d="M34 21h3a4 4 0 0 1 0 8h-3" />
      <path d="M17 12c0-2 2-2 2-4M24 12c0-2 2-2 2-4" />
      <circle cx="22" cy="26" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  )
}

/** Celulares y electrónica: el teléfono con la señal. */
export function IcoPhone({ size }) {
  return (
    <Svg size={size}>
      <rect x="15" y="7" width="18" height="34" rx="4" />
      <path d="M22 11h4M21 36h6" />
      <path d="M19 24a7 7 0 0 1 10 0M16 20a11 11 0 0 1 16 0" />
      <circle cx="24" cy="28" r="2" fill={ACCENT} stroke="none" />
    </Svg>
  )
}
