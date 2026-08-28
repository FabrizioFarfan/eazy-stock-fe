import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  BarChart2, ShoppingCart, Shield, QrCode, Bell, FileSpreadsheet,
  MessageCircle, Smartphone, Check, Star, Users, Truck, Receipt,
  CreditCard, Sparkles, Wallet, Boxes, ScanLine, ArrowRight, Quote, Wrench,
  Tag, ClipboardCheck, AlertTriangle, FileText, Trophy, Pill, ChevronDown,
  Store, CalendarClock, Filter, Hash, Moon, Languages, Percent,
  Menu, X, Landmark, Bot, Coffee, Apple,
} from 'lucide-react'
import { useT } from '../i18n'
import LangSwitcher from '../i18n/LangSwitcher'
import { Reveal, Counter, GridPattern, GlowOrbs, SectionHead, LandingStyles } from './landing/shared'
import {
  AppMockup, CashClosingMockup, SupplierOrderMockup, PosMockup, FiadoMockup, ImportMockup,
} from './landing/mockups'

const CTA = '/login'

// ═══════════════════════════════════════════════════════════════════════════
//  Navbar
// ═══════════════════════════════════════════════════════════════════════════

const NAV = [
  { href: '#producto',   label: 'Producto' },
  { href: '#funciones',  label: 'Funciones' },
  { href: '#fiado',      label: 'Fiado' },
  { href: '#para-quien', label: 'Para quién' },
  { href: '#roadmap',    label: 'Lo que viene' },
  { href: '#faq',        label: 'FAQ' },
]

function Navbar() {
  const t = useT()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
      scrolled || open ? 'border-b border-white/10 bg-[#0a0e1a]/90 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Eazy Stock" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-lg font-bold text-white">Eazy Stock</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm text-slate-400 transition-colors hover:text-white">{t(n.label)}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher compact className="!border-white/15 !bg-white/5 !text-slate-200 [&_select]:text-slate-200 [&_option]:text-gray-900" />
          <Link
            to={CTA}
            className="group hidden items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0a0e1a] transition-all hover:bg-blue-50 sm:flex"
          >
            {t('Probar gratis')}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('Cerrar menú') : t('Abrir menú')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-white lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#0a0e1a] px-5 pb-5 pt-3 lg:hidden">
          <nav className="flex flex-col">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-white/5 py-3 text-sm font-medium text-slate-200">{t(n.label)}</a>
            ))}
          </nav>
          <div className="mt-4 flex gap-2">
            <Link to={CTA} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0a0e1a]">
              {t('Probar gratis')} <ArrowRight size={14} />
            </Link>
            <Link to={CTA} className="flex items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200">
              {t('Iniciar sesión')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Hero
// ═══════════════════════════════════════════════════════════════════════════

function Hero() {
  const t = useT()
  return (
    <section className="relative overflow-hidden bg-[#0a0e1a] pb-20 pt-28 sm:pb-28 sm:pt-36">
      <GlowOrbs />
      <GridPattern />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-10">
          <div className="flex-1 text-center lg:text-left">
            <a href="#producto" className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-200 backdrop-blur transition-colors hover:bg-amber-300/20">
              <Sparkles size={12} />
              {t('Nuevo: vencimientos, cierre de caja por medio de pago y pedidos al proveedor en PDF')}
              <ArrowRight size={12} />
            </a>

            <h1 className="mb-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
              {t('Tu negocio, ordenado.')}<br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-200 bg-clip-text text-transparent">
                {t('Vende, cobra y controla el stock sin cuaderno.')}
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-400 lg:mx-0 lg:text-lg">
              {t('Eazy Stock es el sistema de inventario, ventas y fiado para ferreterías, bodegas, farmacias y minimarkets. Escaneas, cobras con Yape o efectivo, y al cierre sabes exactamente cuánto hay en caja. Se aprende en una tarde.')}
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                to={CTA}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-900/60 sm:w-auto"
              >
                {t('Probar gratis')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#producto"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-slate-200 backdrop-blur transition-colors hover:bg-white/10 sm:w-auto"
              >
                {t('Ver cómo funciona')}
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 lg:justify-start">
              {[
                'Sin tarjeta, sin instalar nada',
                'Desde el celular o la PC',
                'Español · English · Italiano',
                'Hecho con una ferretería real',
              ].map((k) => (
                <div key={k} className="flex items-center gap-1.5">
                  <Check size={12} className="text-emerald-400" />
                  {t(k)}
                </div>
              ))}
            </div>
          </div>

          <Reveal className="w-full flex-1 lg:flex lg:justify-end" delay={120}>
            <AppMockup />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Marquee — todo lo que hace, en una cinta
// ═══════════════════════════════════════════════════════════════════════════

const MARQUEE = [
  [QrCode, 'Escaneo con la cámara'],
  [CalendarClock, 'Reporte «Por vencer»'],
  [Wallet, 'Cierre de caja por Yape, Plin, efectivo'],
  [CreditCard, 'Fiado con recordatorio por WhatsApp'],
  [FileText, 'Pedido al proveedor en PDF'],
  [Filter, 'Filtros tipo Excel por columna'],
  [Hash, 'Códigos automáticos y liberados'],
  [FileSpreadsheet, 'Importa tu Excel en minutos'],
  [Trophy, 'Ranking de vendedores'],
  [Shield, 'Permisos por empleado'],
  [Bell, 'Alertas de stock mínimo'],
  [Smartphone, 'Instálala como app'],
  [Moon, 'Modo oscuro'],
  [Languages, 'ES · EN · IT'],
]

function Marquee() {
  const t = useT()
  const items = [...MARQUEE, ...MARQUEE]
  return (
    <section className="overflow-hidden border-y border-gray-100 bg-white py-4">
      <div className="lp-marquee flex w-max gap-3">
        {items.map(([Icon, label], i) => (
          <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-700">
            <Icon size={13} className="text-blue-600" />
            {t(label)}
          </span>
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Stats con contadores
// ═══════════════════════════════════════════════════════════════════════════

function Stats() {
  const t = useT()
  const stats = [
    { to: 7,  label: 'reportes listos',   sub: 'Ventas, día, producto, proveedor, stock bajo, por vencer, resurtido' },
    { to: 14, label: 'permisos finos',    sub: 'Hasta «solo ver el cierre de caja»' },
    { to: 3,  label: 'idiomas',           sub: 'Español, inglés e italiano' },
    { to: 6,  label: 'decimales en precios', sub: 'Para el tornillo a S/ 0.0357' },
  ]
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map(({ to, label, sub }, i) => (
            <Reveal key={label} delay={i * 90} className="text-center">
              <p className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                <Counter to={to} />
              </p>
              <p className="mt-1.5 text-sm font-bold text-gray-900">{t(label)}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{t(sub)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Producto — "Un día en tu negocio": 3 showcases con mockups
// ═══════════════════════════════════════════════════════════════════════════

function Showcase({ id, kicker, kickerIcon: KIcon, tone, title, desc, bullets, mockup, flip = false, cta }) {
  const t = useT()
  const tones = {
    amber:   { pill: 'border-amber-200 bg-amber-50 text-amber-700',     icon: 'bg-amber-100 text-amber-700',     check: 'text-amber-500' },
    emerald: { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: 'bg-emerald-100 text-emerald-700', check: 'text-emerald-500' },
    blue:    { pill: 'border-blue-200 bg-blue-50 text-blue-700',       icon: 'bg-blue-100 text-blue-700',       check: 'text-blue-500' },
    violet:  { pill: 'border-violet-200 bg-violet-50 text-violet-700', icon: 'bg-violet-100 text-violet-700',   check: 'text-violet-500' },
  }[tone]
  return (
    <div id={id} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={flip ? 'lg:order-2' : ''}>
        <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${tones.pill}`}>
          <KIcon size={12} /> {t(kicker)}
        </div>
        <h3 className="mb-4 text-2xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">{t(title)}</h3>
        <p className="mb-6 text-base leading-relaxed text-gray-600">{t(desc)}</p>
        <ul className="mb-7 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700">
              <Check size={16} className={`mt-0.5 flex-shrink-0 ${tones.check}`} />
              <span>{t(b)}</span>
            </li>
          ))}
        </ul>
        {cta && (
          <Link to={CTA} className="group inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800">
            {t(cta)} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </Reveal>
      <Reveal delay={150} className={`${flip ? 'lg:order-1' : ''} relative`}>{mockup}</Reveal>
    </div>
  )
}

function ProductShowcases() {
  const t = useT()
  return (
    <section id="producto" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            kicker={t('Un día con Eazy Stock')}
            title={t('De la venta al cierre de caja, sin hojas sueltas')}
            sub={t('Así se ve el día a día real: cobras rápido, sabes qué se acaba, pides al proveedor con un PDF y cierras la caja sabiendo cuánto entró por cada medio.')}
          />
        </Reveal>

        <div className="space-y-24">
          <Showcase
            kicker="Nueva venta"
            kickerIcon={ScanLine}
            tone="emerald"
            title="Escaneas, cobras, listo. Sin lector, sin calculadora."
            desc="La cámara del celular lee el código de barras o el QR del producto. Vendes por unidad, por paquete, por metro o por gramo; aplicas descuento y eliges cómo te pagaron: efectivo, Yape, Plin, tarjeta, transferencia o al fiado. El stock se descuenta al instante."
            bullets={[
              'Búsqueda instantánea por nombre, código o código de barras',
              'Descuentos por porcentaje o monto, con permiso aparte',
              'Medios de pago que tú defines (Yape, Plin, tarjeta…) y se recuerdan',
              'Precio variable para lo que se negocia en el momento',
              'Devoluciones totales o parciales, marcadas en la venta',
            ]}
            mockup={<PosMockup />}
          />

          <Showcase
            kicker="Cierre de caja"
            kickerIcon={Wallet}
            tone="blue"
            flip
            title="Al final del día sabes cuánto entró por Yape, cuánto en efectivo y cuánto quedó fiado."
            desc="El cierre de caja separa cada medio de pago y te dice cuánto efectivo debería haber en el cajón. Puedes darle a un vendedor el permiso de ver solo el cierre, sin ganancias ni costos."
            bullets={[
              'Desglose por medio de pago del día o del rango que elijas',
              'Ventas al fiado y devoluciones separadas del efectivo',
              'Permiso «solo cierre de caja» para el vendedor de turno',
              'Balance completo con ganancias y costos, solo para el dueño',
            ]}
            mockup={<CashClosingMockup />}
          />

          <Showcase
            kicker="Reportes › Stock bajo"
            kickerIcon={Truck}
            tone="amber"
            title="Lo que se acaba se convierte en un pedido al proveedor, en PDF, en dos clics."
            desc="El reporte de stock bajo agrupa por proveedor lo que está bajo el mínimo. Editas cantidades, agregas una nota, y sale un PDF listo para mandar por WhatsApp. Cuando llega la mercadería, registras la recepción y la deuda con el proveedor queda anotada."
            bullets={[
              'Stock mínimo por producto con alerta en vivo cuando se cruza',
              'Previsual del pedido editable antes de generar el PDF',
              'Recepción de mercadería que suma stock y cuentas por pagar',
              'Reporte de resurtido: qué comprar según lo que vendes',
            ]}
            mockup={<SupplierOrderMockup />}
            cta="Probar con mi inventario"
          />
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Vencimientos + filtros + códigos (bloque bento sobre el catálogo)
// ═══════════════════════════════════════════════════════════════════════════

function CatalogBento() {
  const t = useT()
  const cards = [
    {
      icon: CalendarClock, tone: 'bg-amber-500',
      title: 'Fecha de vencimiento y reporte «Por vencer»',
      desc: 'Cada producto puede tener fecha de vencimiento. Te avisa 30 días antes con un badge en la tabla y un reporte para sacar a promoción lo que está por vencer antes de perderlo.',
      big: true,
      demo: (
        <div className="mt-5 space-y-2">
          {[
            { n: 'Yogurt frutado 1L',   d: 3,  tone: 'bg-red-100 text-red-700' },
            { n: 'Leche Gloria 400g',   d: 12, tone: 'bg-amber-100 text-amber-700' },
            { n: 'Paracetamol 500mg',   d: 27, tone: 'bg-amber-50 text-amber-600' },
          ].map((r, i) => (
            <div key={r.n} className="lp-row flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="font-medium text-gray-800">{r.n}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.tone}`}>{t('vence en {n} días', { n: r.d })}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Filter, tone: 'bg-blue-600',
      title: 'Filtros tipo Excel y cabeceras fijas',
      desc: 'Cada columna tiene su embudo: filtra por marca, unidad, proveedor o estado como en Excel. La cabecera se queda fija aunque bajes mil filas.',
    },
    {
      icon: Hash, tone: 'bg-indigo-600',
      title: 'Códigos automáticos y «liberados»',
      desc: 'Al crear un producto te sugiere el siguiente código (F2963 → F2964). Si borras uno sin historial, su código queda libre y se vuelve a ofrecer. Nunca renumera.',
    },
    {
      icon: Boxes, tone: 'bg-emerald-600',
      title: 'Presentación y unidad de venta',
      desc: '«Saco de 25 kg», «Rollo de 50 m». Vendes por unidad, paquete, metro, gramo o la unidad que definas — y filtras por ella.',
    },
    {
      icon: QrCode, tone: 'bg-violet-600',
      title: 'QR y código de barras por producto',
      desc: 'Genera e imprime el QR o el Code 128 de cada producto; o usa el código de barras que ya trae del fabricante.',
    },
  ]
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            kicker={t('Catálogo')}
            title={t('Un catálogo que se cuida solo')}
            sub={t('Miles de productos, cada uno con su código, su unidad, su mínimo y su fecha de vencimiento. Y encuentras cualquiera en un segundo.')}
          />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, tone, title, desc, big, demo }, i) => (
            <Reveal
              key={title}
              delay={i * 80}
              className={`group relative overflow-hidden rounded-3xl border border-gray-200 bg-gray-50/60 p-6 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 ${big ? 'md:col-span-2 lg:row-span-2' : ''}`}
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md ${tone}`}>
                <Icon size={20} />
              </div>
              <h3 className={`font-extrabold tracking-tight text-gray-900 ${big ? 'text-2xl' : 'text-base'}`}>{t(title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{t(desc)}</p>
              {demo}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Fiado
// ═══════════════════════════════════════════════════════════════════════════

function FiadoSection() {
  return (
    <section id="fiado" className="bg-gradient-to-b from-gray-50 to-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Showcase
          kicker="Fiado y cuentas por cobrar"
          kickerIcon={CreditCard}
          tone="violet"
          flip
          title="Fía sin miedo: cada sol prestado tiene nombre, fecha y recordatorio."
          desc="Cada cliente tiene su línea de crédito y su deuda al día. Cuando toca cobrar, mandas el recordatorio por WhatsApp con un clic o le imprimes su estado de cuenta en PDF. Los abonos parciales van bajando la deuda solos."
          bullets={[
            'Límite de crédito por cliente: avisa si la venta lo excede',
            'Recordatorio de deuda por WhatsApp con el mensaje ya redactado',
            'Estado de cuenta en PDF con todos los movimientos',
            'Reporte de cuentas por cobrar con el total que te deben',
            'Permiso «vender al fiado» separado del resto',
          ]}
          mockup={<FiadoMockup />}
        />
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Import
// ═══════════════════════════════════════════════════════════════════════════

function ImportSection() {
  return (
    <section id="importar" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Showcase
          kicker="Importar y exportar"
          kickerIcon={FileSpreadsheet}
          tone="emerald"
          title="Ya tienes tu inventario en Excel. Súbelo tal cual."
          desc="El importador detecta tus columnas, corrige las tildes rotas, separa códigos de proveedor pegados al nombre y te muestra fila por fila qué va a entrar antes de tocar nada. Miles de productos en minutos, con historial de cada importación."
          bullets={[
            'Acepta .xlsx y .csv; mapeo automático de columnas',
            'Importa también fecha de vencimiento, código de barras y unidad',
            'Historial de importaciones con reporte descargable por fila',
            'Exporta tu catálogo y tus ventas a Excel cuando quieras',
          ]}
          mockup={<ImportMockup />}
          cta="Importar mi Excel"
        />
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Todas las funciones
// ═══════════════════════════════════════════════════════════════════════════

const FEATURE_GROUPS = [
  {
    title: 'Inventario',
    color: 'from-blue-500 to-indigo-600',
    items: [
      [Boxes,          'Productos con presentación y unidad', 'Paquete, metro, gramo o la que definas. Precio con hasta 6 decimales.'],
      [Hash,           'Códigos automáticos y SKU editable',  'Sugerencia del siguiente código, huecos liberados, código de barras del fabricante.'],
      [CalendarClock,  'Vencimiento + reporte «Por vencer»',  'Badge en la tabla y aviso 30 días antes.'],
      [AlertTriangle,  'Stock mínimo y alertas en vivo',      'Notificación en el acto cuando un producto cae bajo el mínimo.'],
      [Tag,            'Marcas y categorías',                 'Con atributos personalizados por categoría (talla, laboratorio, medida…).'],
      [ClipboardCheck, 'Recepción de mercadería',             'Un solo recibo, varios productos: entra el stock y se anota la deuda.'],
    ],
  },
  {
    title: 'Ventas',
    color: 'from-emerald-500 to-teal-600',
    items: [
      [ScanLine,   'Venta rápida con escáner',       'Cámara del celular como lector de barras y QR. Sin hardware.'],
      [Percent,    'Descuentos y precio variable',   'Por venta o por ítem; lo negociado queda registrado.'],
      [Wallet,     'Medios de pago a tu medida',     'Efectivo, Yape, Plin, tarjeta, transferencia… y los que agregues.'],
      [FileText,   'Cotizaciones en PDF',            'Arma el presupuesto, mándalo por WhatsApp; no toca el stock.'],
      [Receipt,    'Devoluciones',                   'Totales o parciales, con su burbuja en la lista de ventas.'],
      [Trophy,     'Ranking de vendedores',          'Quién vendió cuánto, por día, con desglose.'],
    ],
  },
  {
    title: 'Dinero',
    color: 'from-violet-500 to-fuchsia-600',
    items: [
      [CreditCard,    'Fiado con límite de crédito',      'Deuda al día por cliente, abonos parciales, estado de cuenta PDF.'],
      [MessageCircle, 'Recordatorio por WhatsApp',        'Mensaje de cobro listo para enviar desde la ficha del cliente.'],
      [Landmark,      'Cuentas por pagar',                'Lo que le debes a cada proveedor, con pagos parciales.'],
      [Wallet,        'Cierre de caja por medio de pago', 'Cuánto entró por cada medio y cuánto debe haber en el cajón.'],
      [BarChart2,     'Siete reportes',                   'Análisis de ventas, resumen del día, por producto, por proveedor, stock bajo, por vencer, resurtido.'],
      [Truck,         'Pedido al proveedor en PDF',       'Desde el stock bajo, con previsual editable.'],
    ],
  },
  {
    title: 'Equipo y control',
    color: 'from-amber-500 to-orange-600',
    items: [
      [Shield,          'Permisos finos por empleado',   '14 permisos: vender, descontar, cancelar, fiar, ver reportes, solo cierre de caja…'],
      [Users,           'Clientes y proveedores',        'Fichas completas con historial y saldo.'],
      [Filter,          'Filtros tipo Excel',            'Embudo por columna y cabeceras fijas en todas las tablas.'],
      [FileSpreadsheet, 'Importar y exportar',           'Excel/CSV con historial; exporta cuando quieras.'],
      [Bell,            'Notificaciones en vivo',        'Stock bajo y novedades al instante, en todos los dispositivos.'],
      [Smartphone,      'App instalable, modo oscuro, 3 idiomas', 'Instálala en el celular como app; ES, EN e IT; claro u oscuro.'],
    ],
  },
]

function Features() {
  const t = useT()
  return (
    <section id="funciones" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            kicker={t('Todas las funciones')}
            title={t('Todo lo que necesita una tienda de verdad')}
            sub={t('Nada salió de un catálogo de funciones. Cada una resolvió un problema concreto en un negocio real: primero una ferretería, luego los que siguieron.')}
          />
        </Reveal>

        <div className="space-y-14">
          {FEATURE_GROUPS.map((group) => (
            <Reveal key={group.title}>
              <div className="mb-5 flex items-center gap-3">
                <div className={`h-1.5 w-10 rounded-full bg-gradient-to-r ${group.color}`} />
                <h3 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">{t(group.title)}</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map(([Icon, title, desc]) => (
                  <div key={title} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50">
                    <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${group.color} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`} />
                    <div className="relative flex gap-4">
                      <div className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${group.color} text-white shadow-md`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{t(title)}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">{t(desc)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Industrias
// ═══════════════════════════════════════════════════════════════════════════

const INDUSTRIES = [
  [Wrench, 'Ferreterías',           'Miles de códigos, tornillos a céntimos, metros de cable y el cliente de siempre que paga a fin de mes.', 'from-orange-500 to-red-500'],
  [Store,  'Bodegas y minimarkets', 'Venta al paso con escáner, fiado del barrio con recordatorio y aviso de lo que vence.', 'from-amber-500 to-orange-600'],
  [Pill,   'Farmacias y boticas',   'Fecha de vencimiento en cada caja, reporte «Por vencer» y venta por blíster o unidad.', 'from-rose-500 to-pink-600'],
  [Truck,  'Distribuidoras',        'Recepciones grandes, cuentas por pagar a proveedores y pedidos en PDF.', 'from-blue-500 to-indigo-600'],
  [Apple,  'Abarrotes y alimentos', 'Venta por kilo o gramo, lo perecible controlado y cierre de caja por Yape y efectivo.', 'from-emerald-500 to-teal-600'],
  [Coffee, 'Cualquier tienda de barrio', 'Si vendes y anotas en cuaderno, esto es para ti. Se aprende en una tarde.', 'from-violet-500 to-fuchsia-600'],
]

function Industries() {
  const t = useT()
  return (
    <section id="para-quien" className="relative overflow-hidden bg-[#0a0e1a] py-24">
      <GridPattern />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            dark
            kicker={t('Para quién')}
            title={t('Hecho para negocios que venden de verdad')}
            sub={t('No es un ERP para contadores. Es la herramienta del que atiende el mostrador.')}
          />
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map(([Icon, title, desc, color], i) => (
            <Reveal
              key={title}
              delay={(i % 3) * 90}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${color} opacity-30 blur-2xl transition-opacity group-hover:opacity-50`} />
              <div className="relative">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="mb-2 text-base font-bold text-white">{t(title)}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{t(desc)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Cómo funciona
// ═══════════════════════════════════════════════════════════════════════════

function HowItWorks() {
  const t = useT()
  const steps = [
    [Users,           'Crea tu negocio',       'Abres tu cuenta, pones el nombre de la tienda e invitas a tu gente con los permisos que tú decidas.'],
    [FileSpreadsheet, 'Sube tu Excel',         'O carga productos uno por uno. El sistema te sugiere el código y guarda unidad, mínimo y vencimiento.'],
    [ShoppingCart,    'Vende desde el día uno','Escaneas, cobras por Yape o efectivo, fías con control y cierras la caja cada noche.'],
  ]
  return (
    <section id="como-funciona" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHead kicker={t('Cómo empezar')} title={t('Listo en una tarde, no en tres semanas')} />
        </Reveal>
        <div className="relative grid gap-10 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent md:block" />
          {steps.map(([Icon, title, desc], i) => (
            <Reveal key={title} delay={i * 130} className="relative flex flex-col items-center text-center">
              <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-200">
                <Icon size={34} className="text-white" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0a0e1a] text-xs font-extrabold text-blue-300 ring-4 ring-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{t(title)}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{t(desc)}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200} className="mt-14 text-center">
          <Link to={CTA} className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]">
            {t('Probar gratis')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Testimonio (genérico, sin nombres reales)
// ═══════════════════════════════════════════════════════════════════════════

function Testimonial() {
  const t = useT()
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-blue-50 via-white to-amber-50 p-8 sm:p-12">
            <Quote size={56} className="absolute right-8 top-8 text-blue-100" />
            <div className="relative">
              <p className="text-xl font-medium leading-relaxed text-gray-800 sm:text-2xl">
                {t('«Antes anotaba el fiado en un cuaderno y se me perdían ventas. Ahora subí todo el catálogo desde mi Excel en una tarde, mis hijos cobran desde el celular y al cierre sé cuánto entró por Yape y cuánto en efectivo.»')}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <Wrench size={22} />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{t('Dueño de ferretería')}</p>
                  <p className="text-sm text-gray-500">{t('Lima, Perú · cliente desde el piloto')}</p>
                </div>
                <div className="ml-auto hidden flex-col items-end sm:flex">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} className="fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{t('Más de 1,000 productos migrados')}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Roadmap — lo que viene
// ═══════════════════════════════════════════════════════════════════════════

const ROADMAP = [
  {
    period: 'Disponible hoy', status: 'done',
    items: [
      'Catálogo con unidad de venta, vencimiento, códigos automáticos, QR y barras',
      'Venta rápida con escáner, descuentos y medios de pago a medida',
      'Fiado con recordatorio por WhatsApp y estado de cuenta PDF',
      'Cierre de caja por medio de pago y 7 reportes',
      'Pedido al proveedor en PDF, recepciones y cuentas por pagar',
      'Importar/exportar Excel con historial, filtros tipo Excel',
      'Empleados con 14 permisos, ranking de vendedores, cotizaciones',
      'App instalable (PWA), modo oscuro, ES/EN/IT',
    ],
  },
  {
    period: 'Pronto', status: 'next',
    items: [
      'Apps móviles nativas para Android e iOS',
      'Asistente con IA: pregúntale cuánto vendiste o qué reponer',
      'Alertas de stock y cobranza automática por WhatsApp',
    ],
  },
  {
    period: 'Después', status: 'planned',
    items: [
      'Facturación electrónica (SUNAT)',
      'Multi-sucursal y multi-negocio desde una cuenta',
      'Modo sin conexión: sigue vendiendo sin internet',
    ],
  },
]

const STATUS_STYLE = {
  done:    { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  next:    { dot: 'bg-blue-600 animate-pulse', badge: 'bg-blue-600 text-white', border: 'border-blue-200' },
  planned: { dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500', border: 'border-gray-200' },
}
const STATUS_LABEL = { done: 'Disponible', next: 'PRONTO', planned: 'En diseño' }

function Roadmap() {
  const t = useT()
  return (
    <section id="roadmap" className="bg-white py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            kicker={t('Roadmap')}
            title={t('Lo que viene')}
            sub={t('Construimos con los clientes, de a una observación por vez. Esto es lo que hay y lo que sigue.')}
          />
        </Reveal>
        <div className="relative space-y-6 pl-8">
          <div className="absolute bottom-0 left-2 top-2 w-0.5 bg-gradient-to-b from-emerald-300 via-blue-300 to-gray-200" />
          {ROADMAP.map(({ period, status, items }) => {
            const s = STATUS_STYLE[status]
            return (
              <Reveal key={period} className="relative">
                <div className={`absolute -left-7 top-5 h-4 w-4 rounded-full border-2 border-white shadow ${s.dot}`} />
                <div className={`rounded-2xl border bg-white p-6 transition-shadow hover:shadow-lg ${s.border}`}>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-extrabold text-gray-900">{t(period)}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.badge}`}>{t(STATUS_LABEL[status])}</span>
                    {status === 'next' && <Bot size={16} className="text-blue-600" />}
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check size={15} className={`mt-0.5 flex-shrink-0 ${status === 'done' ? 'text-emerald-500' : 'text-gray-300'}`} />
                        {t(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  FAQ
// ═══════════════════════════════════════════════════════════════════════════

const FAQS = [
  ['¿Cuánto cuesta Eazy Stock?', 'Durante el lanzamiento lo pruebas gratis, sin tarjeta. Cuando salgan los planes mensuales, todos tendrán prueba gratis para que decidas con calma.'],
  ['¿Necesito instalar algo o comprar un lector?', 'No. Funciona en el navegador de tu PC, tablet o celular, y puedes instalarlo como app desde el mismo navegador. La cámara del celular es tu lector de códigos de barras y QR.'],
  ['Ya tengo mi inventario en Excel, ¿lo pierdo?', 'Al contrario: lo subes tal cual. El importador detecta tus columnas, corrige tildes rotas y te muestra fila por fila qué va a entrar antes de tocar nada. Incluye vencimiento, código de barras y unidad.'],
  ['¿Sirve si vendo cosas que vencen?', 'Sí. Cada producto puede tener fecha de vencimiento; la tabla marca «vence en X días» y hay un reporte «Por vencer» a 30 días para que lo saques a promoción antes de perderlo.'],
  ['¿Cómo controlo el fiado?', 'Cada cliente tiene límite de crédito y deuda al día. Le mandas el recordatorio por WhatsApp con un clic o le imprimes su estado de cuenta en PDF. Los abonos parciales bajan la deuda solos.'],
  ['¿Mis empleados pueden ver todo?', 'No. Tienes 14 permisos individuales: vender, aplicar descuentos, cancelar, fiar, ver reportes, recibir mercadería… incluso «solo ver el cierre de caja», sin ganancias ni costos.'],
  ['¿Es difícil de aprender?', 'Cada pantalla trae un tutorial que se abre solo la primera vez. Si sabes usar WhatsApp, sabes usar Eazy Stock. Y está en español, inglés e italiano.'],
  ['¿Mis datos están seguros?', 'Cada negocio vive aislado de los demás, la conexión va cifrada y cada cambio queda registrado con quién y cuándo. Tus datos son tuyos.'],
]

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-all ${open ? 'border-blue-200 shadow-lg shadow-blue-50' : 'border-gray-200'}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left" aria-expanded={open}>
        <span className="text-sm font-bold text-gray-900 sm:text-base">{q}</span>
        <ChevronDown size={18} className={`flex-shrink-0 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180 text-blue-600' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-gray-600">{a}</p>
        </div>
      </div>
    </div>
  )
}

function Faq() {
  const t = useT()
  const [openIdx, setOpenIdx] = useState(0)
  return (
    <section id="faq" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal>
          <SectionHead kicker={t('Preguntas frecuentes')} title={t('Lo que todos preguntan')} />
        </Reveal>
        <Reveal delay={100}>
          <div className="space-y-3">
            {FAQS.map(([q, a], i) => (
              <FaqItem key={q} q={t(q)} a={t(a)} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  CTA + Footer
// ═══════════════════════════════════════════════════════════════════════════

function CtaBanner() {
  const t = useT()
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 py-20">
      <div aria-hidden className="absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t('Pruébalo hoy con tu propio inventario.')}
          </h2>
          <p className="mb-9 text-base text-blue-100 sm:text-lg">
            {t('Sin tarjeta, sin compromiso. Si en una tarde no te ordena la tienda, no nos debes nada.')}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to={CTA} className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-blue-700 shadow-2xl shadow-blue-900/30 transition-all hover:scale-[1.02]">
              {t('Probar gratis')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to={CTA} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20">
              {t('Ya tengo cuenta')}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  const t = useT()
  return (
    <footer className="bg-[#0a0e1a] py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Eazy Stock" className="h-9 w-9 rounded-lg object-contain" />
              <span className="text-lg font-bold text-white">Eazy Stock</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {t('Inventario, ventas y fiado para tiendas de Perú y Latinoamérica. Construido con clientes reales.')}
            </p>
            <div className="mt-4"><LangSwitcher compact className="!border-white/15 !bg-white/5 !text-slate-200 [&_select]:text-slate-200 [&_option]:text-gray-900" /></div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{t('Producto')}</p>
            <ul className="space-y-2 text-sm">
              {NAV.map((n) => (
                <li key={n.href}><a href={n.href} className="text-slate-500 transition-colors hover:text-white">{t(n.label)}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{t('Empezar')}</p>
            <ul className="space-y-2 text-sm">
              <li><Link to={CTA} className="text-slate-500 transition-colors hover:text-white">{t('Probar gratis')}</Link></li>
              <li><Link to={CTA} className="text-slate-500 transition-colors hover:text-white">{t('Iniciar sesión')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{t('Soporte')}</p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>{t('Tutorial en cada pantalla')}</li>
              <li><a href="mailto:kontakt.eazylife@gmail.com" className="transition-colors hover:text-white">kontakt.eazylife@gmail.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 md:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Eazy Stock · {t('una app de Eazy Life Company')} · {t('Hecho en Latinoamérica')}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {t('Todos los sistemas operativos')}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Página
// ═══════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingStyles />
      <Navbar />
      <Hero />
      <Marquee />
      <Stats />
      <ProductShowcases />
      <CatalogBento />
      <FiadoSection />
      <ImportSection />
      <Features />
      <Industries />
      <HowItWorks />
      <Testimonial />
      <Roadmap />
      <Faq />
      <CtaBanner />
      <Footer />
    </div>
  )
}
