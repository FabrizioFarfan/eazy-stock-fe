import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Package, BarChart2, ShoppingCart, ArrowUpDown,
  Shield, QrCode, Bell, FileSpreadsheet,
  MessageCircle, Smartphone, Globe, Zap,
  Check, ChevronRight, Star, Users,
  Truck, Receipt, CreditCard, Sparkles,
  Wallet, Boxes, ScanLine, TrendingUp,
  ArrowRight, PlayCircle, Quote, Wrench,
  Tag, FolderOpen, ClipboardCheck, AlertTriangle,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
//  Background patterns — used by hero + section dividers
// ═══════════════════════════════════════════════════════════════════════════

function GridPattern() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.08]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      }}
    />
  )
}

function GlowOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/30 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-indigo-500/20 blur-[120px]" />
      <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Navbar — sticky con efecto scroll
// ═══════════════════════════════════════════════════════════════════════════

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'border-b border-white/10 bg-[#0a0e1a]/85 backdrop-blur-xl'
        : 'border-b border-transparent bg-transparent'
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Eazy Stock" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-lg font-bold text-white">Eazy Stock</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features"  className="text-sm text-slate-400 hover:text-white transition-colors">Funciones</a>
          <a href="#showcase"  className="text-sm text-slate-400 hover:text-white transition-colors">Producto</a>
          <a href="#industries" className="text-sm text-slate-400 hover:text-white transition-colors">Para quién</a>
          <a href="#roadmap"   className="text-sm text-slate-400 hover:text-white transition-colors">Roadmap</a>
        </nav>
        <Link
          to="/login"
          className="group flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0a0e1a] hover:bg-blue-100 transition-all"
        >
          Iniciar sesión
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  App mockup — dashboard preview en el hero
// ═══════════════════════════════════════════════════════════════════════════

function AppMockup() {
  return (
    <div className="relative w-full max-w-2xl">
      {/* Halo decoration */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-emerald-500/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl shadow-blue-900/40">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-white/5 bg-[#0a0e1a] px-4 py-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <div className="ml-3 flex h-5 flex-1 items-center gap-1 rounded bg-white/5 px-2 text-[10px] text-slate-500">
            <span className="text-emerald-400">●</span> eazy-stock.com/dashboard
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-44 flex-shrink-0 flex-col gap-1 border-r border-white/5 bg-[#0a0e1a] p-3 sm:flex">
            <div className="mb-2 flex items-center gap-2 px-2 py-1">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600">
                <Package size={11} className="text-white" />
              </div>
              <span className="text-xs font-bold text-white">Eazy Stock</span>
            </div>
            {[
              { icon: BarChart2,   label: 'Dashboard',  active: true },
              { icon: Package,     label: 'Productos',   badge: '148' },
              { icon: ShoppingCart,label: 'Ventas' },
              { icon: ArrowUpDown, label: 'Stock' },
              { icon: Users,       label: 'Clientes' },
              { icon: Truck,       label: 'Proveedores' },
              { icon: BarChart2,   label: 'Reportes' },
            ].map(({ icon: Icon, label, active, badge }) => (
              <div key={label} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors ${
                active ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50' : 'text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <Icon size={11} />
                  {label}
                </div>
                {badge && <span className="rounded bg-white/10 px-1 text-[9px]">{badge}</span>}
              </div>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 p-4">
            {/* Stats row */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Ventas hoy', value: 'S/ 2,430', delta: '+18%', color: 'text-emerald-400' },
                { label: 'Stock bajo', value: '3', delta: '↑ 2', color: 'text-amber-400' },
                { label: 'Cobrar',     value: 'S/ 4,820', delta: '7 clientes', color: 'text-blue-400' },
              ].map(({ label, value, delta, color }) => (
                <div key={label} className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-0.5 text-sm font-bold text-white">{value}</p>
                  <p className={`text-[9px] ${color}`}>{delta}</p>
                </div>
              ))}
            </div>

            {/* Chart strip */}
            <div className="mb-3 flex h-12 items-end gap-1 rounded-lg border border-white/5 bg-white/[0.03] p-2">
              {[35, 50, 28, 65, 40, 80, 55, 70, 45, 60, 90, 75, 50, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-blue-700 to-blue-400"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 rounded-t bg-white/[0.03] px-3 py-1.5">
              <span className="col-span-2 text-[9px] font-semibold uppercase text-slate-500">SKU</span>
              <span className="col-span-5 text-[9px] font-semibold uppercase text-slate-500">Producto</span>
              <span className="col-span-2 text-[9px] font-semibold uppercase text-slate-500">Stock</span>
              <span className="col-span-3 text-right text-[9px] font-semibold uppercase text-slate-500">Precio</span>
            </div>

            {/* Table rows */}
            {[
              { sku: 'F03', name: 'Abrazadera 1/2 S/Fin', sub: 'Saco de 25kg', stock: 23, price: 'S/ 0.40', low: false, variable: false },
              { sku: 'F121', name: 'Cemento Frontera', sub: null, stock: 100, price: 'S/ 25.50', low: false, variable: false },
              { sku: 'F87', name: 'Filtro aceite K&N', sub: null, stock: 3, price: 'S/ 12.50', low: true, variable: false },
              { sku: 'F250', name: 'Tornillo 1/4 × 2"', sub: null, stock: 524, price: 'Variable', low: false, variable: true },
            ].map((row) => (
              <div key={row.sku} className="grid grid-cols-12 gap-2 border-b border-white/5 px-3 py-2">
                <span className="col-span-2 font-mono text-[9px] text-slate-500">{row.sku}</span>
                <div className="col-span-5 min-w-0">
                  <p className="truncate text-[10px] font-medium text-white">{row.name}</p>
                  {row.sub && <p className="truncate text-[9px] text-slate-500">{row.sub}</p>}
                </div>
                <span className="col-span-2 self-center">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    row.low ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {row.low ? '↓ ' : ''}{row.stock}
                  </span>
                </span>
                <span className="col-span-3 self-center text-right text-[10px]">
                  {row.variable ? (
                    <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-orange-400">
                      Variable
                    </span>
                  ) : (
                    <span className="text-slate-300">{row.price}</span>
                  )}
                </span>
              </div>
            ))}

            {/* Footer badges */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                En vivo · WebSocket
              </span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-400">
                3 alertas
              </span>
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold text-violet-400">
                7 clientes al fiado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <div className="absolute -bottom-4 -right-4 hidden max-w-[220px] rounded-xl border border-white/10 bg-[#0f172a] p-3 shadow-2xl shadow-black/50 lg:block">
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <AlertTriangle size={13} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white">Stock bajo</p>
            <p className="mt-0.5 text-[9px] text-slate-400">"Filtro aceite K&N" — solo quedan 3 unidades</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Hero
// ═══════════════════════════════════════════════════════════════════════════

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0a0e1a] pb-24 pt-32 sm:pb-32 sm:pt-40">
      <GlowOrbs />
      <GridPattern />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-center gap-14 lg:flex-row lg:items-center lg:gap-12">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur">
              <Sparkles size={12} />
              Nuevo · Import masivo desde Excel ya disponible
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Vende, controla stock y cobra<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-300 bg-clip-text text-transparent">
                desde un solo lugar.
              </span>
            </h1>

            <p className="mb-9 max-w-xl text-base leading-relaxed text-slate-400 lg:text-lg">
              Eazy Stock es el sistema de inventario, ventas, fiado y cuentas
              corrientes para ferreterías, distribuidoras y tiendas en
              Latinoamérica. Simple, rápido, y diseñado con clientes reales.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
              <Link
                to="/login"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition-all hover:shadow-xl hover:shadow-blue-900/60 hover:scale-[1.02]"
              >
                Empezar ahora — es gratis
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#showcase"
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-slate-200 backdrop-blur transition-colors hover:bg-white/10"
              >
                <PlayCircle size={16} />
                Ver el producto
              </a>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 lg:justify-start">
              {[
                'Sin tarjeta requerida',
                'Multi-usuario incluido',
                '11 permisos granulares',
                'Soporte en español',
              ].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <Check size={12} className="text-emerald-400" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className="w-full flex-1 lg:flex lg:justify-end">
            <AppMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Customer logos strip — "trusted by"
// ═══════════════════════════════════════════════════════════════════════════

function CustomersStrip() {
  return (
    <section className="border-y border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          Usado por negocios reales en Perú
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {[
            { name: 'Ferretería en Lima', sub: 'Catálogo de miles de productos' },
            { name: 'En piloto privado',  sub: 'Más clientes onboarding' },
            { name: 'Tu negocio',         sub: 'Próximo en la lista' },
          ].map((c) => (
            <div key={c.name} className="text-center">
              <p className="text-sm font-bold text-gray-700">{c.name}</p>
              <p className="text-xs text-gray-400">{c.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Stats
// ═══════════════════════════════════════════════════════════════════════════

function Stats() {
  const stats = [
    { value: 'Miles', label: 'Productos por catálogo', sub: 'Probado con catálogos grandes' },
    { value: '< 200ms', label: 'Búsqueda en vivo',     sub: 'Search-as-you-type indexado' },
    { value: '11',      label: 'Permisos granulares',  sub: 'Control fino por empleado' },
    { value: '6',       label: 'Decimales en precios', sub: 'Para tornillos a S/ 0.0357' },
  ]
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map(({ value, label, sub }) => (
            <div key={label} className="text-center">
              <p className="bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                {value}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">{label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Features — agrupado por categoría
// ═══════════════════════════════════════════════════════════════════════════

const FEATURE_GROUPS = [
  {
    title: 'Inventario inteligente',
    desc: 'Todo lo que necesitas para que tu catálogo viva ordenado.',
    color: 'from-blue-500 to-indigo-600',
    items: [
      { icon: Boxes,      title: 'Productos con SKU único',          desc: 'Cada producto con código generado, QR y código de barras Code 128.' },
      { icon: Tag,        title: 'Marcas, categorías, atributos',    desc: 'Modelo flexible — agrega los atributos personalizados que necesites por categoría.' },
      { icon: Truck,      title: 'Proveedores',                      desc: 'Asocia productos a proveedores con código interno propio y dedupe de duplicados.' },
      { icon: ScanLine,   title: 'Precio variable',                  desc: 'Para productos que se negocian en el momento — el POS lo pide al cobrar.' },
      { icon: Package,    title: 'Presentación informativa',         desc: '"Saco de 25kg", "Caja de 100", "Rollo de 50m" — al lado del nombre.' },
      { icon: AlertTriangle, title: 'Stock mínimo + alertas',        desc: 'Notificaciones automáticas cuando un producto cae bajo el mínimo.' },
    ],
  },
  {
    title: 'POS y ventas rápidas',
    desc: 'El cajero abre el POS y vende. Punto.',
    color: 'from-emerald-500 to-teal-600',
    items: [
      { icon: ShoppingCart, title: 'Búsqueda instantánea',           desc: 'Por nombre, SKU, código de proveedor o QR — debounce a 400ms.' },
      { icon: QrCode,       title: 'Cámara como escáner',            desc: 'BarcodeDetector nativo + ZXing fallback. Sin app, sin lector externo.' },
      { icon: TrendingUp,   title: 'Descuentos flexibles',           desc: 'Porcentaje o monto fijo, por venta o por item. Permiso aparte para aplicar.' },
      { icon: Wallet,       title: 'Override de precio',             desc: 'El cajero puede ajustar precio por item — con permiso y queda flageado.' },
      { icon: CreditCard,   title: 'Venta al fiado',                 desc: 'Asocia la venta a un cliente con línea de crédito; el sistema actualiza la deuda.' },
      { icon: Receipt,      title: 'Precios con 6 decimales',        desc: 'Para tornillos a S/ 0.0357 — los aggregates se redondean a 2 decimales al cobrar.' },
    ],
  },
  {
    title: 'Cuentas corrientes',
    desc: 'Cuánto te deben y cuánto debes — siempre en vivo.',
    color: 'from-violet-500 to-fuchsia-600',
    items: [
      { icon: Users,         title: 'Clientes y crédito',            desc: 'Ficha completa con documento, límite de crédito y deuda actual.' },
      { icon: CreditCard,    title: 'Pagos y ajustes',               desc: 'Registra pagos parciales o ajustes manuales — todo audit-loggeado.' },
      { icon: Truck,         title: 'Proveedores con deuda',         desc: 'Recepciones multi-producto → entran al stock y suman a la deuda con el proveedor.' },
      { icon: ClipboardCheck,title: 'Recepción multi-producto',      desc: 'Un solo recibo, varios productos — el stock se actualiza por línea.' },
      { icon: BarChart2,     title: 'Reportes de cobranza',          desc: 'Cuentas por cobrar (clientes) y por pagar (proveedores) listas para revisar.' },
      { icon: Wallet,        title: 'Pagos parciales',               desc: 'Soporta abonos parciales que reducen la deuda gradualmente.' },
    ],
  },
  {
    title: 'Operaciones y control',
    desc: 'Seguridad, auditoría y herramientas para escalar.',
    color: 'from-amber-500 to-orange-600',
    items: [
      { icon: Shield,        title: 'Permisos granulares',           desc: '11 permisos individuales por empleado: vender, cancelar, ver reportes, etc.' },
      { icon: ClipboardCheck,title: 'Auditoría completa',            desc: 'Cada CREATE/UPDATE/DELETE queda registrado con quién, cuándo, antes y después.' },
      { icon: Bell,          title: 'Notificaciones en vivo',        desc: 'WebSocket + STOMP — alertas de stock bajo se ven en el acto.' },
      { icon: Users,         title: 'Multi-usuario',                 desc: 'Dueño + empleados con roles claros. Cada uno ve solo lo que le toca.' },
      { icon: FileSpreadsheet, title: 'Import masivo desde Excel',   desc: 'Sube tu inventario actual (3,000+ filas) y empieza a operar en minutos.' },
      { icon: Globe,         title: 'Multi-tenant + multi-moneda',   desc: 'Cada negocio aislado. Soporta PEN, USD, EUR, PLN out-of-the-box.' },
    ],
  },
]

function Features() {
  return (
    <section id="features" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Funcionalidades</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Todo lo que tu negocio necesita,<br />
            en una sola plataforma
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-500">
            Diseñado y probado con ferreterías reales en Lima. Cada feature
            resuelve un problema que vimos en vivo — no funciones de catálogo.
          </p>
        </div>

        <div className="space-y-16">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className={`mb-3 inline-block h-1 w-12 rounded-full bg-gradient-to-r ${group.color}`} />
                  <h3 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">{group.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{group.desc}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
                  >
                    <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${group.color} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`} />
                    <div className="relative">
                      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${group.color} text-white shadow-md`}>
                        <Icon size={18} />
                      </div>
                      <h4 className="mb-1.5 text-sm font-bold text-gray-900">{title}</h4>
                      <p className="text-xs leading-relaxed text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Showcase — Excel import (feature destacada nueva)
// ═══════════════════════════════════════════════════════════════════════════

function ImportShowcase() {
  return (
    <section id="showcase" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Sparkles size={12} />
              Nuevo — Junio 2026
            </div>
            <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Migra tu inventario en <span className="text-emerald-600">10 minutos</span>,
              no en 3 semanas.
            </h2>
            <p className="mb-8 text-base leading-relaxed text-gray-600">
              Sube el Excel que ya tienes. El sistema detecta tus columnas
              automáticamente, limpia el encoding roto, deduplica proveedores
              por capitalización, extrae códigos de proveedor pegados al
              nombre, y te muestra fila por fila qué se va a importar antes
              de tocar nada.
            </p>

            <ul className="mb-8 space-y-3">
              {[
                'Acepta .xlsx y .csv hasta 10MB',
                'Auto-mapeo inteligente por nombre de columna',
                'Limpia mojibake (Ã¡ → á, Ã± → ñ) automáticamente',
                'Detecta SKUs duplicados antes de importar',
                'Reporte Excel descargable del resultado por fila',
                'Procesa fila por fila — un error no aborta todo el import',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              Importa tu Excel ahora
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mockup: import wizard preview */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-200/40 to-blue-200/40 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              {/* Stepper */}
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
                {[
                  { num: 1, label: 'Subir', done: true },
                  { num: 2, label: 'Mapear', done: true },
                  { num: 3, label: 'Revisar', active: true },
                  { num: 4, label: 'Importar', done: false },
                ].map((s) => (
                  <div key={s.num} className="flex items-center gap-1.5">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      s.done    ? 'bg-emerald-500 text-white' :
                      s.active  ? 'bg-blue-600 text-white' :
                                  'bg-gray-200 text-gray-500'
                    }`}>
                      {s.done ? '✓' : s.num}
                    </div>
                    <span className={`text-[11px] font-medium ${
                      s.active ? 'text-gray-900' : s.done ? 'text-emerald-700' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Counters */}
              <div className="grid grid-cols-4 gap-2 border-b border-gray-100 px-5 py-3">
                {[
                  { label: 'Totales',  value: '3,435',  color: 'text-gray-900' },
                  { label: 'Listas',   value: '3,429',  color: 'text-emerald-600' },
                  { label: 'Warnings', value: '742',    color: 'text-amber-600' },
                  { label: 'Errores',  value: '0',      color: 'text-red-600' },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg border border-gray-100 bg-white p-2 text-center">
                    <p className="text-[9px] uppercase tracking-widest text-gray-400">{c.label}</p>
                    <p className={`text-base font-extrabold ${c.color}`}>{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-px">
                {[
                  { n: 1,  name: 'Abrazadera 1/2 S/Fin',          sku: 'F03',  cls: 'emerald', issue: '—' },
                  { n: 2,  name: 'Cemento Frontera',               sku: 'F121', cls: 'emerald', issue: '—' },
                  { n: 3,  name: 'Abasto 1/2 × 1/2',               sku: 'F47',  cls: 'amber',   issue: 'Encoding corregido' },
                  { n: 4,  name: 'Tornillo 1/4 × 2"',              sku: 'F250', cls: 'amber',   issue: 'Precio variable' },
                  { n: 5,  name: 'Filtro K&N',                     sku: 'F89',  cls: 'amber',   issue: 'Stock −5 ajustado a 0' },
                ].map((r) => {
                  const bg = r.cls === 'emerald' ? 'bg-emerald-50' : 'bg-amber-50'
                  const txt = r.cls === 'emerald' ? 'text-emerald-700' : 'text-amber-700'
                  return (
                    <div key={r.n} className={`grid grid-cols-12 gap-2 px-5 py-2 text-[11px] ${bg}`}>
                      <span className="col-span-1 font-mono text-gray-400">{r.n}</span>
                      <span className="col-span-5 truncate text-gray-900">{r.name}</span>
                      <span className="col-span-2 font-mono text-gray-500">{r.sku}</span>
                      <span className={`col-span-4 truncate text-right ${txt}`}>{r.issue}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Showcase — Fiado + Cuentas
// ═══════════════════════════════════════════════════════════════════════════

function FiadoShowcase() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-200/40 to-blue-200/40 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              {/* Customer card */}
              <div className="bg-gradient-to-br from-violet-50 to-blue-50 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">Cliente</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">Juan Quispe</p>
                    <p className="text-xs text-gray-500">DNI 12345678 · Cel +51 987 654 321</p>
                  </div>
                  <span className="rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Activo
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Deuda actual', value: 'S/ 580', color: 'text-amber-600' },
                    { label: 'Límite',       value: 'S/ 1,000', color: 'text-gray-900' },
                    { label: 'Disponible',   value: 'S/ 420',   color: 'text-emerald-600' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-white/60 bg-white p-3">
                      <p className="text-[9px] uppercase tracking-widest text-gray-400">{s.label}</p>
                      <p className={`mt-0.5 font-mono text-sm font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions */}
              <div className="divide-y divide-gray-100">
                <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Historial reciente
                </p>
                {[
                  { type: 'SALE',    label: 'Venta',  amount: '+S/ 250', date: 'Hoy 14:30', color: 'text-amber-600' },
                  { type: 'PAYMENT', label: 'Pago',   amount: '−S/ 200', date: 'Ayer',      color: 'text-emerald-600' },
                  { type: 'SALE',    label: 'Venta',  amount: '+S/ 530', date: '2 jun',      color: 'text-amber-600' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        t.type === 'SALE' ? 'bg-amber-50' : 'bg-emerald-50'
                      }`}>
                        {t.type === 'SALE'
                          ? <ShoppingCart size={13} className="text-amber-600" />
                          : <Wallet size={13} className="text-emerald-600" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{t.label}</p>
                        <p className="text-[10px] text-gray-400">{t.date}</p>
                      </div>
                    </div>
                    <span className={`font-mono text-sm font-bold ${t.color}`}>{t.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
              <CreditCard size={12} />
              Cuentas corrientes
            </div>
            <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Vende al fiado sin perder el control.
            </h2>
            <p className="mb-8 text-base leading-relaxed text-gray-600">
              Cada cliente tiene su línea de crédito, su deuda actual y su
              historial de pagos. Cuando el cajero registra una venta al
              fiado, el sistema valida el límite, suma a la deuda y deja todo
              auditado. Cuando el cliente paga, se actualiza al instante.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Users,      title: 'Ficha completa', desc: 'Documento, contacto, dirección, deuda y límite.' },
                { icon: AlertTriangle, title: 'Validación de límite', desc: 'Avisa si la venta excede el crédito.' },
                { icon: Wallet,     title: 'Pagos parciales', desc: 'Abonos que reducen la deuda gradualmente.' },
                { icon: ClipboardCheck, title: 'Audit log', desc: 'Cada movimiento queda registrado con quién y cuándo.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                    <Icon size={15} className="text-violet-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Industries — Para quién
// ═══════════════════════════════════════════════════════════════════════════

const INDUSTRIES = [
  {
    icon: Wrench,
    title: 'Ferreterías',
    desc: 'Miles de SKUs, proveedores múltiples, precios pequeños (S/ 0.05 el tornillo) y clientes habituales al fiado.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Truck,
    title: 'Distribuidoras',
    desc: 'Recepciones masivas multi-producto, cuentas con proveedores, márgenes ajustados por categoría.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Boxes,
    title: 'Tiendas mayoristas',
    desc: 'Catálogos grandes, descuentos por volumen, ventas al fiado a comerciantes con línea de crédito.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Tag,
    title: 'Boutiques y minoristas',
    desc: 'Atributos custom por categoría (talla, color, material), control fino del stock por presentación.',
    color: 'from-violet-500 to-fuchsia-600',
  },
]

function Industries() {
  return (
    <section id="industries" className="bg-[#0a0e1a] py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">Diseñado para</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Hecho para negocios que venden de verdad
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            Cada feature salió de problemas reales que vimos en ferreterías
            de Lima. No te vendemos un ERP — te damos lo que necesitas.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${color} opacity-30 blur-2xl transition-opacity group-hover:opacity-50`} />
              <div className="relative">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Testimonial — reseña anónima (sin datos de cliente)
// ═══════════════════════════════════════════════════════════════════════════

function Testimonial() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-8 sm:p-12">
          <Quote size={56} className="absolute right-8 top-8 text-blue-100" />

          <div className="relative">
            <p className="text-xl font-medium leading-relaxed text-gray-800 sm:text-2xl">
              "Antes anotaba en cuaderno y se nos pasaban ventas al fiado.
              Con Eazy Stock subimos <span className="font-bold text-blue-700">todo el catálogo</span> en
              una tarde y mis hijos ya pueden cobrar desde el celular —
              hasta los precios que se negocian quedan registrados."
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Wrench size={22} />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Dueño de ferretería</p>
                <p className="text-sm text-gray-500">Lima, Perú</p>
              </div>
              <div className="ml-auto hidden flex-col items-end sm:flex">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">Cliente verificado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  How it works
// ═══════════════════════════════════════════════════════════════════════════

function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: Users,
      title: 'Registra tu negocio',
      desc: 'Crea tu cuenta, agrega el nombre del negocio e invita a tus empleados con permisos a medida.',
    },
    {
      num: '02',
      icon: FileSpreadsheet,
      title: 'Sube tu Excel actual',
      desc: 'O carga productos uno por uno desde el formulario. El sistema detecta columnas y limpia data sucia.',
    },
    {
      num: '03',
      icon: ShoppingCart,
      title: 'Empieza a vender',
      desc: 'POS listo desde el primer día. Stock en vivo, ventas al fiado, descuentos y reportes.',
    },
  ]
  return (
    <section id="how" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Proceso</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Arrancá en 3 pasos
          </h2>
        </div>
        <div className="relative grid gap-10 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent md:block" />

          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div key={num} className="relative flex flex-col items-center text-center">
              <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-200">
                <Icon size={34} className="text-white" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0a0e1a] text-xs font-extrabold text-blue-300 ring-4 ring-gray-50">
                  {num}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  WhatsApp Highlight
// ═══════════════════════════════════════════════════════════════════════════

function WhatsAppHighlight() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]">
          <div aria-hidden className="absolute inset-0 opacity-30">
            <div className="absolute -left-20 top-1/4 h-60 w-60 rounded-full bg-emerald-500/40 blur-3xl" />
            <div className="absolute -right-20 bottom-1/4 h-60 w-60 rounded-full bg-green-400/30 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-10 p-8 md:flex-row md:p-14">
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1.5 text-xs font-semibold text-green-300">
                <MessageCircle size={12} />
                Próximamente · Q3 2026
              </div>
              <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Tu stock habla por{' '}
                <span className="bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
                  WhatsApp
                </span>
              </h2>
              <p className="mb-7 text-base leading-relaxed text-slate-300">
                Recibe alertas en WhatsApp cuando un producto se agota.
                Pregúntale al asistente IA cuánto vendiste, qué productos
                están vendiendo más, o cuáles necesitas reponer — todo desde
                tu chat.
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                {[
                  '🔔 Alertas de stock en vivo',
                  '🤖 Asistente IA',
                  '📊 Reportes por chat',
                  '👥 Mensajes a clientes deudores',
                ].map((f) => (
                  <span key={f} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-full max-w-xs flex-shrink-0">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111b21] shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/10 bg-[#202c33] px-4 py-3">
                  <img src="/logo.png" alt="Eazy Stock" className="h-9 w-9 rounded-full object-contain" />
                  <div>
                    <p className="text-sm font-semibold text-white">Eazy Stock Bot</p>
                    <p className="text-xs text-green-400">en línea</p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {[
                    { text: '⚠️ Stock bajo: Filtro K&N (3 unid.)',                                bot: true },
                    { text: '¿Cuánto vendí hoy?',                                                  bot: false },
                    { text: '📊 S/ 2,430 en 18 ventas. Top: Aceite 5W30 (12 unid.)',              bot: true },
                    { text: 'Envíale recordatorio de pago a Juan',                                  bot: false },
                    { text: '✅ Listo. Le envié un mensaje recordando su deuda de S/ 580.',         bot: true },
                  ].map(({ text, bot }, i) => (
                    <div key={i} className={`flex ${bot ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                        bot ? 'bg-[#202c33] text-white' : 'bg-[#005c4b] text-white'
                      }`}>
                        {text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Roadmap
// ═══════════════════════════════════════════════════════════════════════════

const ROADMAP = [
  {
    period: 'Disponible hoy',
    status: 'done',
    items: [
      'Productos con SKU/QR/barcode, marcas, categorías, proveedores',
      'POS con búsqueda, escáner de cámara, descuentos y override de precio',
      'Precio variable + presentación informativa',
      'Ventas al fiado con líneas de crédito',
      'Recepciones multi-producto + cuentas con proveedores',
      'Reportes (ventas por día, top productos, cuentas por cobrar/pagar)',
      'Notificaciones en vivo (WebSocket)',
      'Permisos granulares + auditoría completa',
      'Import masivo desde Excel/CSV (miles de filas)',
    ],
  },
  {
    period: 'Q3 2026',
    status: 'next',
    items: [
      'Integración WhatsApp — alertas + asistente IA + cobranza automatizada',
      'Export masivo — descarga de ventas/inventario/reportes en Excel',
      'App móvil nativa — iOS y Android',
    ],
  },
  {
    period: 'Q4 2026',
    status: 'planned',
    items: [
      'Facturación electrónica — SUNAT (Perú), SRI (Ecuador), AFIP (Argentina)',
      'Compras con orden de pedido + sugerencia de reposición',
      'Modo offline / PWA — sigue vendiendo sin internet',
    ],
  },
  {
    period: '2027',
    status: 'future',
    items: [
      'Multi-sucursal — gestión centralizada de N tiendas',
      'API pública — conectá tu e-commerce o sistema externo',
      'Marketplace de integraciones — pagos, envíos, contabilidad',
    ],
  },
]

const STATUS_STYLE = {
  done:    { dot: 'bg-emerald-500',           badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  next:    { dot: 'bg-blue-600 animate-pulse', badge: 'bg-blue-100 text-blue-700',       border: 'border-blue-200'    },
  planned: { dot: 'bg-blue-400',              badge: 'bg-blue-100 text-blue-700',       border: 'border-blue-200'    },
  future:  { dot: 'bg-gray-300',              badge: 'bg-gray-100 text-gray-500',       border: 'border-gray-200'    },
}

const STATUS_LABEL = {
  done: 'Disponible', next: 'Próximamente', planned: 'En diseño', future: 'Futuro',
}

function Roadmap() {
  return (
    <section id="roadmap" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Roadmap</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Lo que viene
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
            Construimos junto a clientes reales — cada feature sale de algo
            que vimos en ferreterías de Lima. Sin features de catálogo.
          </p>
        </div>

        <div className="relative space-y-6 pl-8">
          <div className="absolute bottom-0 left-2 top-2 w-0.5 bg-gradient-to-b from-emerald-300 via-blue-300 to-gray-200" />

          {ROADMAP.map(({ period, status, items }) => {
            const s = STATUS_STYLE[status]
            return (
              <div key={period} className="relative">
                <div className={`absolute -left-7 top-5 h-4 w-4 rounded-full border-2 border-white shadow ${s.dot}`} />

                <div className={`rounded-2xl border bg-white p-6 transition-shadow hover:shadow-lg ${s.border}`}>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-extrabold text-gray-900">{period}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check size={15} className={`mt-0.5 flex-shrink-0 ${status === 'done' ? 'text-emerald-500' : 'text-gray-300'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  CTA banner
// ═══════════════════════════════════════════════════════════════════════════

function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 py-20">
      <div aria-hidden className="absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Pruébalo gratis hoy.
        </h2>
        <p className="mb-9 text-base text-blue-100 sm:text-lg">
          Sin tarjeta, sin compromiso. Empieza a operar en minutos —
          si no te convence, no nos debes nada.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-blue-700 shadow-2xl shadow-blue-900/30 transition-all hover:scale-[1.02]"
          >
            Crear cuenta gratis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            Volver a explorar
          </a>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Footer
// ═══════════════════════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-[#0a0e1a] py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Eazy Stock" className="h-9 w-9 rounded-lg object-contain" />
              <span className="text-lg font-bold text-white">Eazy Stock</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Sistema de inventario, ventas y cuentas corrientes para PYMEs
              latinoamericanas. Construido con clientes reales.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Producto</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#features"   className="text-slate-500 hover:text-white transition-colors">Funciones</a></li>
              <li><a href="#showcase"   className="text-slate-500 hover:text-white transition-colors">Excel import</a></li>
              <li><a href="#industries" className="text-slate-500 hover:text-white transition-colors">Para quién</a></li>
              <li><a href="#roadmap"    className="text-slate-500 hover:text-white transition-colors">Roadmap</a></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Empezar</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="text-slate-500 hover:text-white transition-colors">Iniciar sesión</Link></li>
              <li><Link to="/login" className="text-slate-500 hover:text-white transition-colors">Crear cuenta</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Soporte</p>
            <ul className="space-y-2 text-sm">
              <li className="text-slate-500">Documentación</li>
              <li className="text-slate-500">Contacto · soporte@eazylife.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 md:flex-row">
          <p className="text-xs text-slate-500">
            © 2026 Eazy Stock — by EazyLife. Hecho en Latinoamérica.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Todos los sistemas operativos
          </div>
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main export
// ═══════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <CustomersStrip />
      <Stats />
      <Features />
      <ImportShowcase />
      <FiadoShowcase />
      <Industries />
      <Testimonial />
      <HowItWorks />
      <WhatsAppHighlight />
      <Roadmap />
      <CtaBanner />
      <Footer />
    </div>
  )
}
