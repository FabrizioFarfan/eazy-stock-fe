import { Link } from 'react-router-dom'
import {
  Package, BarChart2, ShoppingCart, ArrowUpDown,
  Shield, QrCode, Bell, FileSpreadsheet,
  MessageCircle, Smartphone, Globe, Zap,
  Check, ChevronRight, Star, Users,
} from 'lucide-react'

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
            <Package size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">Eazy Stock</span>
        </div>
        <nav className="hidden items-center gap-7 md:flex">
          <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Funciones</a>
          <a href="#how"      className="text-sm text-slate-400 hover:text-white transition-colors">Cómo funciona</a>
          <a href="#roadmap"  className="text-sm text-slate-400 hover:text-white transition-colors">Roadmap</a>
        </nav>
        <Link
          to="/login"
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    </header>
  )
}

// ─── App Mockup ───────────────────────────────────────────────────────────────
function AppMockup() {
  return (
    <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#1e293b] shadow-2xl shadow-black/50">
      {/* Window dots */}
      <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 text-xs text-slate-500">eazy-stock.com/products</span>
      </div>

      <div className="flex">
        {/* Mini sidebar */}
        <div className="flex w-44 flex-shrink-0 flex-col gap-1 border-r border-white/5 bg-[#0f172a] p-3">
          <div className="mb-2 flex items-center gap-2 px-2 py-1">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500">
              <Package size={11} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white">Eazy Stock</span>
          </div>
          {[
            { icon: BarChart2,   label: 'Dashboard',  active: false },
            { icon: Package,     label: 'Productos',   active: true  },
            { icon: ShoppingCart,label: 'Ventas',      active: false },
            { icon: ArrowUpDown, label: 'Stock',       active: false },
            { icon: BarChart2,   label: 'Reportes',    active: false },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${active ? 'bg-orange-500 text-white' : 'text-slate-400'}`}>
              <Icon size={12} />
              {label}
            </div>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 p-4">
          {/* Stats row */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Productos', value: '148' },
              { label: 'Ventas hoy', value: 'S/ 2,430' },
              { label: 'Stock bajo', value: '3' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-[#1e293b] p-2.5 border border-white/5">
                <p className="text-[10px] text-slate-500">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Table header */}
          <div className="grid grid-cols-4 gap-2 rounded-t-lg bg-[#0f172a] px-3 py-1.5">
            {['SKU', 'Producto', 'Stock', 'Precio'].map((h) => (
              <span key={h} className="text-[9px] font-semibold uppercase text-slate-500">{h}</span>
            ))}
          </div>

          {/* Table rows */}
          {[
            { sku: 'ACE-A4F2', name: 'Aceite 5W30', stock: 24, price: 'S/ 45.00', low: false },
            { sku: 'FIL-B8D1', name: 'Filtro aceite', stock: 3, price: 'S/ 12.50', low: true },
            { sku: 'BUJ-C2E9', name: 'Bujías NGK', stock: 18, price: 'S/ 8.90', low: false },
            { sku: 'LLA-D7A3', name: 'Llanta 185/65', stock: 6, price: 'S/ 280.00', low: false },
          ].map((row) => (
            <div key={row.sku} className="grid grid-cols-4 gap-2 border-b border-white/5 px-3 py-2">
              <span className="font-mono text-[9px] text-slate-500">{row.sku}</span>
              <span className="text-[9px] font-medium text-white truncate">{row.name}</span>
              <span className={`text-[9px] font-semibold ${row.low ? 'text-red-400' : 'text-green-400'}`}>{row.stock}</span>
              <span className="text-[9px] text-slate-300">{row.price}</span>
            </div>
          ))}

          {/* Badge */}
          <div className="mt-3 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-semibold text-green-400">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              En tiempo real
            </span>
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[9px] font-semibold text-orange-400">
              3 productos con stock bajo
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="bg-[#0f172a] pb-20 pt-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400">
              <Zap size={12} />
              Gestión de inventario para PYMEs
            </div>
            <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Tu inventario,{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                bajo control.
              </span>
              <br />
              Siempre.
            </h1>
            <p className="mb-8 max-w-lg text-base leading-relaxed text-slate-400">
              EazyStock es el sistema de inventario y ventas diseñado para ferreterías, distribuidoras y tiendas en Latinoamérica. Simple, rápido y accesible desde cualquier dispositivo.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-colors"
              >
                Empezar ahora — es gratis
                <ChevronRight size={16} />
              </Link>
              <a
                href="#how"
                className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
              >
                Ver cómo funciona
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              {['Sin tarjeta requerida', 'Acceso inmediato', 'Soporte incluido'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Check size={12} className="text-green-400" />
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

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: '10,000+', label: 'Productos gestionados' },
    { value: '99.9%',   label: 'Uptime garantizado' },
    { value: '< 1s',    label: 'Tiempo de respuesta' },
    { value: '24/7',    label: 'Disponibilidad' },
  ]
  return (
    <section className="border-b border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{value}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Package,
    color: 'bg-orange-100 text-orange-600',
    title: 'Inventario en tiempo real',
    desc: 'SKU único, precios de compra y venta, stock mínimo con alertas automáticas. Todo actualizado al instante.',
  },
  {
    icon: QrCode,
    color: 'bg-blue-100 text-blue-600',
    title: 'Escáner QR integrado',
    desc: 'Genera códigos QR para cada producto y escanéalos con la cámara para agregar al carrito en segundos.',
  },
  {
    icon: ShoppingCart,
    color: 'bg-green-100 text-green-600',
    title: 'Ventas en un clic',
    desc: 'Registra ventas rápido con búsqueda por nombre, SKU o QR. El stock se descuenta automáticamente.',
  },
  {
    icon: BarChart2,
    color: 'bg-purple-100 text-purple-600',
    title: 'Reportes y analytics',
    desc: 'Ingresos por día, top productos más vendidos, análisis por proveedor y empleado. Todo filtrable.',
  },
  {
    icon: Shield,
    color: 'bg-rose-100 text-rose-600',
    title: 'Permisos granulares',
    desc: '11 permisos individuales por empleado: quién puede vender, recibir mercadería, ver reportes y más.',
  },
  {
    icon: Bell,
    color: 'bg-yellow-100 text-yellow-600',
    title: 'Alertas instantáneas',
    desc: 'Notificaciones en tiempo real cuando el stock de cualquier producto cae por debajo del mínimo.',
  },
  {
    icon: Users,
    color: 'bg-teal-100 text-teal-600',
    title: 'Multi-usuario',
    desc: 'Un dueño, múltiples empleados. Cada uno con su acceso y permisos personalizados.',
  },
  {
    icon: Star,
    color: 'bg-indigo-100 text-indigo-600',
    title: 'Auditoría completa',
    desc: 'Historial de cada cambio: quién creó, editó o eliminó cada producto, venta o movimiento de stock.',
  },
]

function Features() {
  return (
    <section id="features" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-500">Funcionalidades</p>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Todo lo que tu negocio necesita
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
            Sin complicaciones, sin costos ocultos. EazyStock cubre desde el primer producto hasta el último reporte.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="mb-2 text-sm font-bold text-gray-900">{title}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: Users,
      title: 'Registra tu negocio',
      desc: 'Crea tu cuenta, agrega el nombre de tu negocio e invita a tus empleados. Listo en menos de 2 minutos.',
    },
    {
      num: '02',
      icon: Package,
      title: 'Carga tus productos',
      desc: 'Agrega tus productos con precio, stock y proveedor. Importa masivamente o usa el formulario intuitivo.',
    },
    {
      num: '03',
      icon: ShoppingCart,
      title: 'Vende y controla',
      desc: 'Registra ventas, monitorea el stock en tiempo real y toma decisiones con los reportes automatizados.',
    },
  ]
  return (
    <section id="how" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-500">Proceso</p>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Arranca en 3 pasos simples
          </h2>
        </div>
        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 md:block" />

          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div key={num} className="relative flex flex-col items-center text-center">
              <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
                <Icon size={36} className="text-white" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-extrabold text-orange-400">
                  {num}
                </span>
              </div>
              <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────
const ROADMAP = [
  {
    period: 'Disponible ahora',
    status: 'done',
    items: [
      'Gestión de productos con QR codes',
      'Ventas y control de stock en tiempo real',
      'Reportes y analytics',
      'Permisos granulares por empleado',
      'Auditoría completa de cambios',
      'Marcas y proveedores',
    ],
  },
  {
    period: 'Q3 2026',
    status: 'next',
    items: [
      'Integración WhatsApp — alertas de stock bajo y asistente de ventas con IA',
      'Exportar/Importar — descarga en Excel/CSV, carga masiva de productos',
    ],
  },
  {
    period: 'Q4 2026',
    status: 'planned',
    items: [
      'App móvil nativa — iOS y Android',
      'Facturación electrónica — integración con SUNAT, SRI y AFIP',
    ],
  },
  {
    period: '2027',
    status: 'future',
    items: [
      'Multi-sucursal — gestión de múltiples tiendas desde un panel',
      'API pública — conecta con tu e-commerce o sistema externo',
      'Modo offline / PWA — sigue vendiendo sin internet',
    ],
  },
]

const STATUS_STYLE = {
  done:    { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700',  border: 'border-green-200' },
  next:    { dot: 'bg-orange-500 animate-pulse', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  planned: { dot: 'bg-blue-400',  badge: 'bg-blue-100 text-blue-700',   border: 'border-blue-200'  },
  future:  { dot: 'bg-gray-300',  badge: 'bg-gray-100 text-gray-500',   border: 'border-gray-200'  },
}

const STATUS_LABEL = {
  done: 'Disponible', next: 'Próximamente', planned: 'Planificado', future: 'Futuro',
}

function Roadmap() {
  return (
    <section id="roadmap" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-4xl px-5">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-500">Roadmap</p>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Lo que viene
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-gray-500">
            Construimos EazyStock junto a nuestros usuarios. Estas son las próximas funciones que estamos desarrollando.
          </p>
        </div>

        <div className="relative space-y-5 pl-6">
          {/* Vertical line */}
          <div className="absolute bottom-0 left-2 top-2 w-0.5 bg-gray-200" />

          {ROADMAP.map(({ period, status, items }) => {
            const s = STATUS_STYLE[status]
            return (
              <div key={period} className="relative">
                {/* Dot on timeline */}
                <div className={`absolute -left-6 top-5 h-4 w-4 rounded-full border-2 border-white shadow ${s.dot}`} />

                <div className={`rounded-xl border bg-white p-5 ${s.border}`}>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-bold text-gray-900">{period}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check size={14} className={`mt-0.5 flex-shrink-0 ${status === 'done' ? 'text-green-500' : 'text-gray-300'}`} />
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

// ─── WhatsApp Feature Highlight ───────────────────────────────────────────────
function WhatsAppHighlight() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
          <div className="flex flex-col items-center gap-10 p-8 md:flex-row md:p-12">
            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1.5 text-xs font-semibold text-green-400">
                <MessageCircle size={12} />
                Próximamente — Q3 2026
              </div>
              <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl">
                Tu stock habla por{' '}
                <span className="text-green-400">WhatsApp</span>
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-400">
                Recibe alertas automáticas en WhatsApp cuando un producto se agote. Pregúntale al asistente cuánto vendiste hoy, cuáles son tus productos más populares o qué productos están por acabarse — todo desde tu chat.
              </p>
              <div className="flex flex-col gap-2 text-sm sm:flex-row">
                {[
                  '🔔 Alertas de stock en tiempo real',
                  '🤖 Asistente IA de ventas',
                  '📊 Consulta reportes por chat',
                ].map((f) => (
                  <span key={f} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">{f}</span>
                ))}
              </div>
            </div>

            {/* WhatsApp mockup */}
            <div className="w-full max-w-xs flex-shrink-0">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111b21] shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/10 bg-[#202c33] px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500">
                    <Package size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Eazy Stock Bot</p>
                    <p className="text-xs text-green-400">en línea</p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {[
                    { text: '⚠️ Stock bajo: Filtro de aceite (3 unid. restantes)', bot: true },
                    { text: '¿Cuánto vendí hoy?', bot: false },
                    { text: '📊 Hoy llevas S/ 2,430 en 18 ventas. Tu producto más vendido: Aceite 5W30 (12 unid.)', bot: true },
                  ].map(({ text, bot }, i) => (
                    <div key={i} className={`flex ${bot ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs text-white ${bot ? 'bg-[#202c33]' : 'bg-[#005c4b]'}`}>
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

// ─── Import/Export Highlight ──────────────────────────────────────────────────
function ImportExportHighlight() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
            <FileSpreadsheet size={28} className="text-blue-600" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-500">Próximamente</p>
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Importa y exporta tus datos
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
              Carga cientos de productos desde Excel en segundos. Exporta tus ventas, reportes o inventario completo a CSV o Excel cuando lo necesites.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              '📥 Importar productos desde Excel',
              '📤 Exportar ventas a CSV',
              '📊 Reportes descargables',
              '🔄 Sincronización con hojas de cálculo',
            ].map((f) => (
              <span key={f} className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-medium text-gray-700">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <section className="bg-orange-500 py-16">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">
          ¿Listo para tener tu inventario bajo control?
        </h2>
        <p className="mb-8 text-orange-100">
          Únete a los negocios que ya gestionan su inventario con EazyStock. Sin complicaciones, sin costos ocultos.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-orange-600 shadow-lg hover:bg-orange-50 transition-colors"
        >
          Empezar ahora — es gratis
          <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0f172a] py-12">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
              <Package size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-white">Eazy Stock</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2026 Eazy Stock. Gestión de inventario para PYMEs latinoamericanas.
          </p>
          <div className="flex items-center gap-5">
            <a href="#features" className="text-sm text-slate-500 hover:text-white transition-colors">Funciones</a>
            <a href="#roadmap"  className="text-sm text-slate-500 hover:text-white transition-colors">Roadmap</a>
            <Link to="/login"   className="text-sm text-slate-500 hover:text-white transition-colors">Acceder</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <WhatsAppHighlight />
      <ImportExportHighlight />
      <Roadmap />
      <CtaBanner />
      <Footer />
    </div>
  )
}
