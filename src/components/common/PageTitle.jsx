/**
 * Título de página con ícono grande y colorido. El dibujo ayuda a que el
 * usuario reconozca dónde está sin leer (carrito = ventas, billetera =
 * cobros, etc.) — pedido explícito del cliente: "el usuario ni lee,
 * ve el dibujo y lo relaciona".
 */
const TONES = {
  blue:    'bg-blue-100 text-blue-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  purple:  'bg-purple-100 text-purple-600',
  amber:   'bg-amber-100 text-amber-600',
  rose:    'bg-rose-100 text-rose-600',
  cyan:    'bg-cyan-100 text-cyan-600',
}

export default function PageTitle({ icon: Icon, tone = 'blue', children }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${TONES[tone] ?? TONES.blue}`}>
          <Icon size={24} strokeWidth={2.2} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{children}</h2>
      </div>

      {/* Watermark: el mismo ícono gigante y casi transparente, abajo a la
          derecha, sangrando fuera del borde como el estampado de un polo.
          Ayuda a reconocer la página de un vistazo sin leer. Fijo respecto a
          la ventana (no scrollea), nunca intercepta clics y a 4% de opacidad
          no compite con tablas ni números. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-8 -right-8 z-0 rotate-[-8deg] text-gray-900 opacity-[0.04] sm:-bottom-12 sm:-right-12"
      >
        <Icon className="h-56 w-56 sm:h-80 sm:w-80 lg:h-[26rem] lg:w-[26rem]" strokeWidth={1.5} />
      </div>
    </>
  )
}
