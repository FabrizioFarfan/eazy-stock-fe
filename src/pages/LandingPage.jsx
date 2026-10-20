import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  BarChart2, Shield, QrCode, Bell, FileSpreadsheet,
  MessageCircle, Smartphone, Check, Users, Truck, Receipt,
  CreditCard, Sparkles, Wallet, Boxes, ScanLine, ArrowRight,
  Tag, ClipboardCheck, AlertTriangle, FileText, Trophy, ChevronDown,
  CalendarClock, Filter, Hash, Moon, Languages, Percent,
  Menu, X, Landmark, Bot,
  Award, Camera, History, Undo2, Banknote, EyeOff,
} from 'lucide-react'
import { useT, dateLocale } from '../i18n'
import LangSwitcher from '../i18n/LangSwitcher'
import { Reveal, HeroBackdrop, SectionHead, LandingStyles } from './landing/shared'
import { STREAMS_EDGES, STREAMS_CTA } from './landing/streams'
import {
  IconTile, IcoTill, IcoLedger, IcoShelf, IcoTeam, IcoTag, IcoChart, IcoScan, IcoTruck, IcoChat, IcoSheet,
  IcoHardware, IcoStore, IcoPharmacy, IcoBasket, IcoCup,
} from './landing/icons'
import HeroTour from './landing/HeroTour'
import { ForEveryBusiness } from './landing/BusinessTypes'
import {
  CashClosingMockup, SupplierOrderMockup, PosMockup, FiadoMockup, ImportMockup,
} from './landing/mockups'
import { useNoAppDarkMode } from './landing/useNoAppDarkMode'
import { usePageSeo } from './landing/site'
import { PLANS, DEFAULT_PERIOD, periodOf, periodPrice, perMonth, savings, fmtMoney, siteCurrency, trialLine, promoVars, promoActive, PROMO_FREE_UNTIL } from './landing/plans'
import { PeriodSelector, ComingSoonChip } from './landing/Pricing'

// «Probar gratis» → registro propio (15-oct-2026); entrar → login.
const CTA = '/registro'
const LOGIN = '/login'

// ═══════════════════════════════════════════════════════════════════════════
//  Navbar
// ═══════════════════════════════════════════════════════════════════════════

// Menú (20-oct-2026, Frank: «la navbar parece muy simplona; agrega Inicio con submenús de
// las secciones»): Inicio y Funciones despliegan un panel con las secciones de cada página.
const HOME_SECTIONS = [
  { to: '/#rubros',         icon: IcoShelf,  label: 'Para todo tipo de negocio', desc: 'Bodegas, farmacias, ferreterías y más' },
  { to: '/#beneficios',     icon: IcoChart,  label: 'Beneficios',               desc: 'Antes y después de Eazy Stock' },
  { to: '/#un-dia',         icon: IcoTill,   label: 'Un día con Eazy Stock',    desc: 'De la venta al cierre de caja' },
  { to: '/#como-funciona',  icon: IcoSheet,  label: 'Cómo empezar',             desc: 'Listo en una tarde' },
  { to: '/#de-donde-sale',  icon: IcoChat,   label: 'De dónde sale',            desc: 'Nació en un mostrador' },
  { to: '/#precios',        icon: IcoTag,    label: 'Precios',                  desc: 'Prueba gratis y planes' },
]
const FEATURE_SECTIONS = [
  { to: '/funciones#vender',    icon: IcoScan,   label: 'Vender',               desc: 'Escanea, cobra y descuenta el stock' },
  { to: '/funciones#caja',      icon: IcoTill,   label: 'Caja',                 desc: 'Cierre por cada medio de pago' },
  { to: '/funciones#fiado',     icon: IcoLedger, label: 'Fiado',                desc: 'Límite, deuda y recordatorio' },
  { to: '/funciones#pedidos',   icon: IcoTruck,  label: 'Pedidos',              desc: 'Stock mínimo y pedido en PDF' },
  { to: '/funciones#importar',  icon: IcoSheet,  label: 'Importar tu catálogo', desc: 'Excel, Word, papel o foto' },
  { to: '/funciones#funciones', icon: IcoShelf,  label: 'Todas las funciones',  desc: 'La lista completa' },
]
const NAV = [
  { to: '/',           label: 'Inicio',     end: true, menu: HOME_SECTIONS },
  { to: '/funciones',  label: 'Funciones',  menu: FEATURE_SECTIONS },
  { to: '/para-quien', label: 'Para quién' },
  { to: '/planes',     label: 'Precios' },
  { to: '/preguntas',  label: 'Preguntas' },
]

function MenuPanel({ items, onPick }) {
  const t = useT()
  return (
    <div className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
      {items.map(({ to, icon: Icon, label, desc }) => (
        <Link key={to} to={to} onClick={onPick} className="group/i flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.07]">
          <IconTile icon={Icon} size={38} light className="transition-transform group-hover/i:scale-105" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-white">{t(label)}</span>
            <span className="block text-xs leading-snug text-slate-400">{t(desc)}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}

export function Navbar() {
  const t = useT()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)       // menú del celular
  const [menu, setMenu] = useState(null)        // panel abierto en escritorio (índice de NAV)
  const [sub, setSub] = useState(null)          // grupo desplegado en el celular
  const closeTimer = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // Al cambiar de página o de ancla se cierra todo (estado derivado durante el render).
  const [seenKey, setSeenKey] = useState(location.key)
  if (seenKey !== location.key) { setSeenKey(location.key); setOpen(false); setMenu(null) }
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setMenu(null); setOpen(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const show = (i) => { clearTimeout(closeTimer.current); setMenu(i) }
  const hide = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setMenu(null), 140) }

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
      scrolled || open || menu !== null ? 'border-b border-white/10 bg-[#0a0e1a]/90 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Eazy Stock" className="h-8 w-8 rounded-lg object-contain" />
          <span className="lp-display text-lg font-bold text-white">Eazy Stock</span>
        </Link>

        {/* Escritorio: píldora con las páginas; Inicio y Funciones despliegan sus secciones */}
        <nav className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex" aria-label={t('Menú')}>
          {NAV.map((n, i) => (
            <div key={n.to} className="relative" onMouseEnter={() => n.menu && show(i)} onMouseLeave={() => n.menu && hide()}>
              <NavLink
                to={n.to}
                end={n.end}
                aria-haspopup={n.menu ? 'true' : undefined}
                aria-expanded={n.menu ? menu === i : undefined}
                onClick={(e) => { if (n.menu && menu !== i && !e.ctrlKey && !e.metaKey) { /* primer clic abre el panel */ e.preventDefault(); show(i) } }}
                className={({ isActive }) => `flex items-center gap-1 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  isActive || menu === i ? 'bg-white/10 font-semibold text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {t(n.label)}
                {n.menu && <ChevronDown size={14} className={`transition-transform ${menu === i ? 'rotate-180' : ''}`} />}
              </NavLink>
              {n.menu && (
                <div className={`absolute left-1/2 top-full z-50 w-[34rem] -translate-x-1/2 pt-3 transition-all duration-200 ${
                  menu === i ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
                }`}>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e1a]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
                    <MenuPanel items={n.menu} onPick={() => setMenu(null)} />
                    <Link to={n.to} onClick={() => setMenu(null)} className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white">
                      {n.end ? t('Ir al inicio') : t('Ver todas las funciones')} <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher compact className="!border-white/15 !bg-white/5 !text-slate-200 [&_select]:text-slate-200 [&_option]:text-gray-900" />
          <Link to={LOGIN} className="hidden px-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white lg:block">
            {t('Iniciar sesión')}
          </Link>
          <Link
            to={CTA}
            className="lp-btn-3d group hidden items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white sm:flex"
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
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-[#0a0e1a] px-5 pb-5 pt-2 lg:hidden">
          <nav className="flex flex-col">
            {NAV.map((n, i) => (
              <div key={n.to} className="border-b border-white/5">
                <div className="flex items-center">
                  <NavLink to={n.to} end={n.end} onClick={() => setOpen(false)}
                    className={({ isActive }) => `flex-1 py-3 text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {t(n.label)}
                  </NavLink>
                  {n.menu && (
                    <button type="button" onClick={() => setSub(sub === i ? null : i)} aria-expanded={sub === i} aria-label={t('Abrir menú')}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300">
                      <ChevronDown size={16} className={`transition-transform ${sub === i ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {n.menu && sub === i && (
                  <div className="-mx-2 mb-2">
                    <MenuPanel items={n.menu} onPick={() => setOpen(false)} />
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="mt-4 flex gap-2">
            <Link to={CTA} className="lp-btn-3d flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white">
              {t('Probar gratis')} <ArrowRight size={14} />
            </Link>
            <Link to={LOGIN} className="lp-btn-3d-ghost flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
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

export function Hero() {
  const t = useT()
  const promises = [
    [Bot,        'IA integrada: pronto, pregúntale a tu negocio'],
    [Smartphone, 'Apps para Android e iOS: ya casi listas'],
    [BarChart2,  'Reportes que te dicen qué vender más'],
    [Check,      'Sin tarjeta · te ayudamos a cargar tus productos'],
  ]
  return (
    <section className="lp-hero relative flex min-h-[100svh] items-center overflow-hidden bg-[#0a0e1a] pb-16 pt-24 sm:pt-28">
      <HeroBackdrop />

      <div className="relative mx-auto w-full max-w-[96rem] px-5 sm:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-12 xl:gap-16">
          <div className="w-full text-center lg:w-[42%] lg:flex-shrink-0 lg:text-left">
            <Link to="/planes" className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur transition-colors hover:bg-white/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
              </span>
              {trialLine(t, dateLocale())}
              <ArrowRight size={12} className="text-slate-400" />
            </Link>

            {/* Tres líneas máximo en escritorio (Frank, 20-oct): cada línea no se parte. */}
            <h1 className="lp-display lp-hero-h1 mb-6 text-[2.35rem] leading-[1.04] text-white sm:text-5xl lg:text-[min(3.6rem,2.5vw)]">
              <span className="lg:whitespace-nowrap">{t('Tu negocio, bajo control.')}</span><br />
              <span className="text-slate-400 lg:whitespace-nowrap">{t('Gestiona, automatiza')}</span><br />
              <span className="text-slate-400 lg:whitespace-nowrap">{t('y vende más.')}</span>
            </h1>

            <p className="lp-hero-p mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-400 lg:mx-0 lg:text-lg">
              {t('Eazy Stock ordena tu inventario, cobra en segundos y cada noche te dice cuánto ganaste. Lo que antes vivía en el cuaderno ahora trabaja para ti: te avisa qué reponer, cobra el fiado, te muestra qué se vende, y mucho más.')}
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                to={CTA}
                className="lp-btn-3d group flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white sm:w-auto"
              >
                {t('Probar gratis')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/funciones"
                className="lp-btn-3d-ghost flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-slate-100 sm:w-auto"
              >
                {t('Ver cómo funciona')}
              </Link>
            </div>

            <ul className="lp-hero-promises mt-9 grid gap-x-6 gap-y-2.5 text-left text-[13px] text-slate-400 sm:grid-cols-2">
              {promises.map(([Icon, k]) => (
                <li key={k} className="flex items-start gap-2">
                  <Icon size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full min-w-0 flex-1">
            <HeroTour />
          </div>
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
  [Wallet, 'Cierre de caja por medio de pago'],
  [CreditCard, 'Fiado con recordatorio por WhatsApp'],
  [FileText, 'Pedido al proveedor en PDF'],
  [Filter, 'Filtros tipo Excel por columna'],
  [Hash, 'Códigos automáticos y liberados'],
  [FileSpreadsheet, 'Importa tu Excel en minutos'],
  [Trophy, 'Ranking de vendedores'],
  [Camera, 'Foto y ubicación de cada producto'],
  [Award, 'Mejores clientes y ventas por cliente'],
  [Shield, 'Permisos por empleado'],
  [Bell, 'Alertas de stock mínimo'],
  [Smartphone, 'Instálala como app'],
  [Moon, 'Modo oscuro'],
  [Languages, 'ES · EN · IT'],
]

export function Marquee() {
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
//  Beneficios concretos — lo que GANA el dueño, con su antes y su ahora
//  (Frank, 25-sep: «que muestre detalladamente cada beneficio concreto»)
// ═══════════════════════════════════════════════════════════════════════════

const BENEFITS = [
  {
    icon: IcoTill, chip: 'Al centavo',
    title: 'La caja cuadra, todos los días',
    before: 'Cierras contando billetes y nunca sabes si falta plata o se anotó mal.',
    after: 'La app te dice cuánto debe haber en el cajón: el fondo para dar vuelto, más el efectivo vendido, menos las devoluciones. Y lo mismo por cada medio de pago.',
  },
  {
    icon: IcoLedger, chip: 'WhatsApp en 1 clic',
    title: 'El fiado se cobra',
    before: 'El cuaderno se moja, se pierde o nadie recuerda quién debe cuánto.',
    after: 'Cada cliente tiene su límite, su deuda al día y su estado de cuenta en PDF. El recordatorio de cobro sale por WhatsApp con un clic.',
  },
  {
    icon: IcoShelf, chip: 'Pedido en PDF',
    title: 'Nunca más «se acabó»',
    before: 'Te enteras de que no hay stock cuando el cliente ya lo está pidiendo.',
    after: 'Cada producto tiene su mínimo y avisa en vivo cuando baja. El pedido al proveedor sale en PDF en dos clics, con lo que falta de cada uno.',
  },
  {
    icon: IcoTeam, chip: 'Cada venta con nombre',
    title: 'Tu equipo vende, tú controlas',
    before: 'Dejas la tienda y no sabes quién vendió qué, ni a qué precio.',
    after: 'Cada venta queda con el nombre del vendedor y la hora. El vendedor no ve tus costos ni toca el stock a mano, y tú decides cada permiso.',
  },
  {
    icon: IcoTag, chip: 'Se corrige al vender',
    title: 'Precios siempre al día',
    before: 'Precios viejos o mal redondeados que te comen el margen en silencio.',
    after: 'Corriges el precio en plena venta y queda para siempre, con aviso. Los precios con céntimos de céntimo nunca se redondean, y vender por debajo del precio queda marcado.',
  },
  {
    icon: IcoChart, chip: 'Ganancia real',
    title: 'Sabes qué te deja plata',
    before: 'Vendes todo el mes y no sabes si ganaste, ni con qué producto.',
    after: 'Ganancia del mes, productos que más rinden, mejores clientes y vendedores. Y lo que está por vencer, para liquidarlo antes de perderlo.',
  },
]

export function Benefits({ teaser = false }) {
  const t = useT()
  const list = teaser ? BENEFITS.slice(0, 3) : BENEFITS
  const ref = useRef(null)
  const [flipped, setFlipped] = useState(false)   // interruptor general: Antes | Con Eazy Stock
  const [own, setOwn] = useState({})              // tarjetas giradas a mano, una por una
  const [auto, setAuto] = useState(false)         // ya dio la vuelta sola al entrar en pantalla

  // Entra en pantalla «Antes» (el cuaderno) y, tras un momento, las tarjetas giran solas a «Con Eazy Stock».
  useEffect(() => {
    const el = ref.current
    if (!el || auto) return undefined
    let timer = 0
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      timer = setTimeout(() => { setFlipped(true); setAuto(true) }, 1500)
    }, { threshold: 0.35 })
    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(timer) }
  }, [auto])

  const setAll = (v) => { setFlipped(v); setOwn({}); setAuto(true) }

  return (
    <section id="beneficios" ref={ref} className={`scroll-mt-28 bg-white ${teaser ? 'py-24' : 'pb-24 pt-10'}`}>
      <style>{`
        .lp-hand { font-family: 'Caveat', 'Segoe Print', 'Bradley Hand', cursive; }
        /* Hoja de cuaderno: papel casi blanco, rayas grises cada 28 px, un leve grano y la sombra del lomo a la izquierda */
        .lp-paper {
          background-color: #fbfbfa;
          background-image:
            repeating-linear-gradient(transparent 0, transparent 27px, rgba(0,0,0,.11) 27px, rgba(0,0,0,.11) 28px),
            linear-gradient(90deg, rgba(0,0,0,.06), transparent 14px),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .05 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
          background-position: 0 1.75rem, 0 0, 0 0;
          box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 10px 24px -14px rgba(0,0,0,.25);
        }
        /* Ficha de la app: azul noche un punto más claro, luz arriba y bisel para que tenga cuerpo */
        .lp-appcard {
          background: linear-gradient(180deg, #1a2548 0%, #121b3a 55%, #0e162f 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.14), inset 0 -1px 0 rgba(0,0,0,.35), 0 18px 36px -16px rgba(15,23,42,.6);
        }
        .lp-flip { perspective: 1800px; }
        .lp-flip-inner { display: grid; transform-style: preserve-3d; transition: transform .8s cubic-bezier(.2,.8,.2,1); }
        .lp-flip-inner > * { grid-area: 1 / 1; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .lp-flip-inner > :last-child { transform: rotateY(180deg); }
        .lp-flip.is-flipped .lp-flip-inner { transform: rotateY(180deg); }
        .lp-flip:hover .lp-flip-inner { transform: rotateY(0) translateY(-4px); }
        .lp-flip.is-flipped:hover .lp-flip-inner { transform: rotateY(180deg) translateY(-4px); }
        @media (prefers-reduced-motion: reduce) { .lp-flip-inner { transition: none; } }
      `}</style>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            kicker={t('Beneficios concretos')}
            title={t('Lo que cambia en tu negocio desde la primera semana')}
            sub={t('Caja que cuadra, fiado que se cobra y stock que no se acaba. Así se nota Eazy Stock en el día a día.')}
          />
        </Reveal>

        {/* Interruptor: el cuaderno de antes ↔ la app de ahora. Gira TODAS las tarjetas. */}
        <Reveal className="-mt-4 mb-10 flex flex-col items-center gap-3">
          <div role="group" aria-label={t('Antes')} className="relative inline-grid grid-cols-2 rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-bold">
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[#0a0e1a] shadow-md transition-transform duration-500 ${flipped ? 'translate-x-full' : ''}`}
            />
            <button type="button" onClick={() => setAll(false)} className={`relative z-10 rounded-full px-5 py-2 transition-colors ${flipped ? 'text-gray-500' : 'text-white'}`}>
              {t('Antes')}
            </button>
            <button type="button" onClick={() => setAll(true)} className={`relative z-10 rounded-full px-5 py-2 transition-colors ${flipped ? 'text-white' : 'text-gray-500'}`}>
              {t('Con Eazy Stock')}
            </button>
          </div>
          <p className="text-xs text-gray-400">{t('Toca una tarjeta para darle la vuelta')}</p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(({ icon: Icon, chip, title, before, after }, i) => {
            const isFlipped = own[i] ?? flipped
            return (
              <Reveal key={title} delay={(i % 3) * 90}>
                <div
                  className={`lp-flip h-full cursor-pointer ${isFlipped ? 'is-flipped' : ''}`}
                  onClick={() => setOwn(o => ({ ...o, [i]: !isFlipped }))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOwn(o => ({ ...o, [i]: !isFlipped })) } }}
                  aria-pressed={isFlipped}
                >
                  <div className="lp-flip-inner h-full" style={{ transitionDelay: `${(i % 3) * 110}ms` }}>
                    {/* ANTES: una hoja del cuaderno */}
                    <article className="lp-paper relative flex flex-col items-center rounded-3xl border border-gray-200 px-7 pb-8 pt-7 text-center">
                      <span className="lp-hand absolute right-6 top-4 text-xl text-gray-400">{t('Antes')}</span>
                      <span className="text-[#0a0e1a]"><Icon size={44} /></span>
                      <h3 className="lp-hand mt-3 text-[1.9rem] font-bold leading-[28px] text-gray-800">{t(title)}</h3>
                      <p className="lp-hand mt-[28px] text-[1.35rem] leading-[28px] text-gray-600">{t(before)}</p>
                    </article>
                    {/* CON EAZY STOCK: la ficha de la app */}
                    <article className="lp-appcard relative flex flex-col items-center rounded-3xl px-7 pb-8 pt-7 text-center text-white">
                      <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                        <Check size={12} /> {t('Con Eazy Stock')}
                      </span>
                      <span className="text-blue-100"><Icon size={44} /></span>
                      <span className="mt-3 rounded-full border border-blue-400/30 bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-200">{t(chip)}</span>
                      <h3 className="lp-display mt-3 text-xl font-extrabold tracking-tight text-white">{t(title)}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">{t(after)}</p>
                    </article>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
        {teaser ? (
          <Reveal className="mt-10 text-center">
            <Link to="/para-quien" className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
              {t('Ver los 6 beneficios y para qué negocios sirve')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        ) : (
        <Reveal>
          <div className="relative mt-10 flex flex-col items-center justify-between gap-4 overflow-hidden rounded-3xl bg-[#0a0e1a] px-6 py-6 text-center sm:flex-row sm:px-8 sm:text-left">
            <HeroBackdrop id="lpb-bn" paths={STREAMS_EDGES} fade={false} />
            <p className="relative text-base font-semibold text-white sm:text-lg">
              {t('Menos cuaderno, menos plata perdida, más tiempo para vender.')}
              <span className="block text-sm font-normal text-slate-400">{t('Se aprende en una tarde.')} {trialLine(t, dateLocale())}.</span>
            </p>
            <Link to={CTA} className="group inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-900 hover:bg-gray-100">
              {t('Probar gratis')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
        )}
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
    <div id={id} className="scroll-mt-32 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
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

export function ProductShowcases() {
  const t = useT()
  return (
    <section id="producto" className="scroll-mt-28 bg-gray-50 py-24">
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
            id="vender"
            kicker="Nueva venta"
            kickerIcon={ScanLine}
            tone="emerald"
            title="Escaneas, cobras, listo. Sin lector, sin calculadora."
            desc="La cámara del celular lee el código de barras o el QR del producto. Vendes por unidad, por paquete, por metro o por gramo; aplicas descuento y eliges cómo te pagaron: efectivo, billetera digital, tarjeta, transferencia o al fiado. El stock se descuenta al instante."
            bullets={[
              'Búsqueda instantánea por nombre, código o código de barras',
              'Descuentos por porcentaje o monto, con permiso aparte',
              'Medios de pago que tú defines (billetera digital, tarjeta…) y se recuerdan',
              'Precio variable para lo que se negocia en el momento',
              'Devoluciones totales o parciales, marcadas en la venta',
            ]}
            mockup={<PosMockup />}
          />

          <Showcase
            id="caja"
            kicker="Cierre de caja"
            kickerIcon={Wallet}
            tone="blue"
            flip
            title="Al final del día sabes cuánto entró por cada medio de pago, cuánto en efectivo y cuánto quedó fiado."
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
            id="pedidos"
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

export function CatalogBento() {
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

export function FiadoSection() {
  return (
    <section id="fiado" className="scroll-mt-28 bg-gradient-to-b from-gray-50 to-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Showcase
          kicker="Fiado y cuentas por cobrar"
          kickerIcon={CreditCard}
          tone="violet"
          flip
          title="Fía sin miedo: cada crédito tiene nombre, fecha y recordatorio."
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

export function ImportSection() {
  return (
    <section id="importar" className="scroll-mt-28 bg-white py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Showcase
          kicker="Importar y exportar"
          kickerIcon={FileSpreadsheet}
          tone="emerald"
          title="Ya tienes tu inventario en Excel. Súbelo tal cual."
          desc="El importador detecta tus columnas, corrige las tildes rotas, separa códigos de proveedor pegados al nombre y te muestra fila por fila qué va a entrar antes de tocar nada. Miles de productos en minutos. Y si lo que tienes es un cuaderno, nos lo mandas por WhatsApp y lo dejamos cargado en 24–48 h."
          bullets={[
            'Acepta .xlsx y .csv; detecta la hoja, la fila de encabezados y tus columnas',
            'Importa también fecha de vencimiento, código de barras y unidad',
            'Historial de importaciones con reporte descargable por fila',
            '¿No tienes Excel? Mándanos fotos del cuaderno o el PDF del proveedor y lo cargamos nosotros',
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
      [Camera,         'Foto y ubicación por producto',       'El vendedor ve cómo es y en qué almacén o estante está, sin preguntar a nadie.'],
      [ClipboardCheck, 'Recepción de mercadería',             'Un solo recibo, varios productos: entra el stock y se anota la deuda. La misma factura nunca se registra dos veces.'],
      [History,        'Historial de cada producto',          'Cuánto entró, se vendió, se devolvió y se ajustó, por período y en qué recepciones llegó.'],
      [Undo2,          'Devolución al proveedor',             'Devuelves mercadería desde la recepción: baja el stock y, si fue a crédito, baja la deuda.'],
    ],
  },
  {
    title: 'Ventas',
    color: 'from-emerald-500 to-teal-600',
    items: [
      [ScanLine,   'Venta rápida con escáner',       'Cámara del celular como lector de barras y QR. Sin hardware.'],
      [Percent,    'Descuentos y precio variable',   'Por venta o por ítem; lo negociado queda registrado.'],
      [Wallet,     'Medios de pago a tu medida',     'Efectivo, billetera digital, tarjeta, transferencia… y los que agregues.'],
      [FileText,   'Cotizaciones en PDF',            'Arma el presupuesto, mándalo por WhatsApp; no toca el stock.'],
      [Receipt,    'Devoluciones',                   'Totales o parciales, con su burbuja en la lista de ventas.'],
      [Award,      'Ranking de vendedores y de clientes', 'Quién vendió cuánto; y quién te compra más, qué lleva y quién no vuelve, con WhatsApp.'],
      [Tag,        'Precio corregido al vender',     'Cambias el precio de un producto en plena venta y queda para siempre, con aviso y permiso.'],
      [Banknote,   'Fondo de caja',                  'El sencillo para dar vuelto queda anotado y entra en el cierre del día.'],
      [EyeOff,     'Costos ocultos al vendedor',     'El vendedor nunca ve el precio de compra ni tu ganancia.'],
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
      [Users,           'Clientes y proveedores',        'Fichas completas con historial, compras y saldo.'],
      [Filter,          'Filtros tipo Excel',            'Embudo por columna y cabeceras fijas en todas las tablas.'],
      [FileSpreadsheet, 'Importar y exportar',           'Excel/CSV con historial; exporta cuando quieras.'],
      [Bell,            'Notificaciones en vivo',        'Stock bajo y novedades al instante, en todos los dispositivos.'],
      [Smartphone,      'App instalable, modo oscuro, 3 idiomas', 'Instálala en el celular como app; ES, EN e IT; claro u oscuro.'],
    ],
  },
]

export function Features() {
  const t = useT()
  // Pestañas por área: antes las 4 listas iban una debajo de otra (Frank,
  // 25-sep: «todo amontonado»). Se ve un área a la vez.
  const [tab, setTab] = useState(0)
  const group = FEATURE_GROUPS[tab]
  return (
    <section id="funciones" className="scroll-mt-28 bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            kicker={t('Todas las funciones')}
            title={t('Todo lo que necesita una tienda de verdad')}
            sub={t('Nada salió de un catálogo de funciones. Cada una resolvió un problema concreto en un negocio real: primero una ferretería, luego los que siguieron.')}
          />
        </Reveal>

        <div role="tablist" className="mx-auto mb-10 flex max-w-2xl flex-wrap justify-center gap-2">
          {FEATURE_GROUPS.map((g, i) => (
            <button key={g.title} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                tab === i ? 'bg-[#0a0e1a] text-white shadow-lg' : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'}`}>
              <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${g.color}`} />
              {t(g.title)}
              <span className={`text-xs font-semibold ${tab === i ? 'text-slate-400' : 'text-gray-400'}`}>{g.items.length}</span>
            </button>
          ))}
        </div>

        <div key={group.title} className="lp-fade grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Industrias
// ═══════════════════════════════════════════════════════════════════════════

const INDUSTRIES = [
  [IcoHardware, 'Ferreterías',           'Miles de códigos, tornillos a céntimos, metros de cable y el cliente de siempre que paga a fin de mes.', 'from-orange-500 to-red-500'],
  [IcoStore,  'Bodegas y minimarkets', 'Venta al paso con escáner, fiado del barrio con recordatorio y aviso de lo que vence.', 'from-amber-500 to-orange-600'],
  [IcoPharmacy,   'Farmacias y boticas',   'Fecha de vencimiento en cada caja, reporte «Por vencer» y venta por blíster o unidad.', 'from-rose-500 to-pink-600'],
  [IcoTruck,  'Distribuidoras',        'Recepciones grandes, cuentas por pagar a proveedores y pedidos en PDF.', 'from-blue-500 to-indigo-600'],
  [IcoBasket,  'Abarrotes y alimentos', 'Venta por kilo o gramo, lo perecible controlado y cierre de caja por medio de pago.', 'from-emerald-500 to-teal-600'],
  [IcoCup, 'Cualquier tienda de barrio', 'Si vendes y anotas en cuaderno, esto es para ti. Se aprende en una tarde.', 'from-violet-500 to-fuchsia-600'],
]

export function Industries() {
  const t = useT()
  return (
    <section id="para-quien" className="scroll-mt-28 relative overflow-hidden bg-[#0a0e1a] py-24">
      <HeroBackdrop id="lpb-pq" paths={STREAMS_EDGES} />
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
          {INDUSTRIES.map(([Icon, title, desc], i) => (
            <Reveal
              key={title}
              delay={(i % 3) * 90}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="relative">
                <IconTile icon={Icon} size={52} light className="mb-4" />
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

// Cómo empezar (20-oct-2026, Frank: «el paso 2 es muy abstracto; que entiendan que si lo
// tienen en una hoja de papel, en Word o donde sea, les ayudamos a importarlo; y que el
// texto suene humano, para boomers y millennials»). Sin degradados: iconos propios.
const STEPS = [
  { icon: IcoTeam, title: 'Crea tu cuenta',
    desc: 'Pones el nombre de tu tienda y listo. Si tienes gente que vende contigo, la invitas y tú decides qué puede ver cada uno.' },
  { icon: IcoSheet, title: 'Trae tu lista de productos, como la tengas',
    desc: 'Si está en Excel, la subes y entra en minutos. Si la tienes en Word, en una hoja de papel o en el cuaderno, nos mandas una foto o el archivo por WhatsApp y la cargamos nosotros. Y si prefieres, la escribes producto por producto.',
    },
  { icon: IcoScan, title: 'Empieza a vender',
    desc: 'Buscas el producto por el nombre o lo escaneas, cobras en efectivo, con tarjeta o con billetera digital, y al final del día la caja te dice cuánto entró.' },
]
const SOURCES = [
  [FileSpreadsheet, 'Excel o CSV'],
  [FileText,        'Word o PDF'],
  [Camera,          'Foto del cuaderno'],
  [MessageCircle,   'Por WhatsApp'],
]

export function HowItWorks() {
  const t = useT()
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-white py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHead kicker={t('Cómo empezar')} title={t('Listo en una tarde, no en tres semanas')} />
        </Reveal>
        <div className="relative grid gap-6 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-[4.5rem] hidden h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent md:block" />
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 130} className="relative flex h-full flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 pb-7 pt-8 text-center shadow-sm">
              <div className="relative mb-5">
                <IconTile icon={Icon} size={72} className="rounded-3xl shadow-xl shadow-blue-100" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold text-white ring-4 ring-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="lp-display mb-2 text-xl font-extrabold text-gray-900">{t(title)}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{t(desc)}</p>
            </Reveal>
          ))}
        </div>

        {/* Paso 2 en concreto: de dónde puede venir la lista y que la cargamos nosotros */}
        <Reveal delay={150} className="mt-6">
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-blue-100 bg-blue-50/60 px-6 py-6 text-center lg:flex-row lg:justify-between lg:text-left">
            <div className="lg:max-w-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">{t('Como la tengas')}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{t('Si no es Excel, lo cargamos nosotros en 24–48 h. Sin costo.')}</p>
              <Link to="/funciones#importar" className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">
                {t('Ver cómo lo importamos')} <ArrowRight size={13} />
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SOURCES.map(([SIcon, label]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm">
                  <SIcon size={16} className="flex-shrink-0 text-blue-600" /> {t(label)}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={200} className="mt-12 text-center">
          <Link to={CTA} className="lp-btn-3d group inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white">
            {t('Probar gratis')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  De dónde sale — la historia real en vez de un testimonio inventado
//  (Frank, 16-oct-2026: «el feedback mockeado no me gusta, ni sé si tiene hijos»;
//  «la landing sabe a IA, le falta realismo y personalidad»). Nada de citas
//  ficticias: quiénes somos, dónde se construyó y qué pidió el mostrador.
// ═══════════════════════════════════════════════════════════════════════════

const COUNTER_REQUESTS = [
  [Banknote,  'Fondo de caja para el vuelto',      'El dueño deja sencillo cada mañana y el cierre no cuadraba. Ahora se registra y el cierre lo suma.'],
  [Hash,      'Precios con 6 decimales',           'Un tornillo cuesta $ 0.0357 y se vende de a 300. Redondear era regalar plata.'],
  [Undo2,     'Devolver mercadería al proveedor',  'Llegó una caja fallada. La devolución baja el stock y queda en la cuenta del proveedor.'],
  [Boxes,     'Un producto es un producto',        'La misma lija aparecía cuatro veces por cuatro recepciones. Ahora se fusionan sin perder el historial.'],
  [MessageCircle, 'Estado de cuenta por WhatsApp', 'Para cobrar el fiado sin discutir: el cliente recibe su detalle con fechas y pagos.'],
  [Tag,       'Corregir el precio al vender',      'Si al cobrar el precio ya cambió, se corrige ahí mismo y queda guardado para siempre.'],
]

export function OriginStory() {
  const t = useT()
  const wa = `https://wa.me/4915511384643?text=${encodeURIComponent(t('Hola, vi la web de Eazy Stock y tengo una pregunta:'))}`
  return (
    <section id="de-donde-sale" className="scroll-mt-28 bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <Reveal>
            <SectionHead align="left" kicker={t('De dónde sale')} title={t('Nació en un mostrador, no en una oficina')} />
            <div className="space-y-5 text-base leading-relaxed text-gray-700 sm:text-lg">
              <p>{t('Eazy Stock lo hace Eazy Life Company. Lo construimos dentro de una ferretería de barrio en Perú que lo usa todos los días para vender, cobrar y cerrar la caja.')}</p>
              <p>{t('No partimos de una presentación. Partimos de un cuaderno de fiados, un Excel con miles de filas y un dueño que nos decía, cada semana, qué le estorbaba. Cada función de la derecha empezó como una queja en ese mostrador.')}</p>
              <p className="font-semibold text-gray-900">{t('Si algo no te cuadra, escríbenos por WhatsApp. Te contestamos nosotros, no un bot.')}</p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a0e1a] px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02]">
                <MessageCircle size={16} /> {t('Escribir por WhatsApp')}
              </a>
              <a href="mailto:kontakt.eazylife@gmail.com" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100">
                kontakt.eazylife@gmail.com
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500">{t('Eazy Life Company')}</p>
          </Reveal>

          <Reveal delay={120}>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{t('Lo que pidió el mostrador')}</p>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{t('Hoy en la app')}</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {COUNTER_REQUESTS.map(([Icon, title, desc], i) => (
                  <li key={title} className="flex gap-4 px-6 py-4">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        <span className="mr-2 font-mono text-xs text-gray-400">{String(i + 1).padStart(2, '0')}</span>{t(title)}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">{t(desc)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Lo que viene — corto y sin roadmap
// ═══════════════════════════════════════════════════════════════════════════

const COMING = [
  { icon: Smartphone, tone: 'from-blue-500 to-indigo-600',   badge: 'Ya casi',      title: 'Apps para Android e iOS',
    desc: 'Ya están casi listas: la misma app, nativa en tu celular, más rápida, con notificaciones y lista para vender aunque se caiga el internet.' },
  { icon: Sparkles,   tone: 'from-emerald-500 to-teal-600',  badge: 'Siempre',      title: 'Más funciones cada mes',
    desc: 'Construimos con nuestros clientes, de a una observación por vez. Lo que pides, se prioriza.' },
  { icon: Bot,        tone: 'from-violet-500 to-fuchsia-600', badge: 'Pronto',       title: 'IA integrada',
    desc: 'Pregúntale a tu negocio cuánto vendiste, qué reponer o qué se te está venciendo. Como hablar con tu contador, pero al instante.' },
]

export function ComingSoon() {
  const t = useT()
  return (
    <section id="roadmap" className="scroll-mt-28 bg-white py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            kicker={t('Lo que viene')}
            title={t('Esto recién empieza')}
            sub={t('Hoy ya ordena tu tienda. Y sigue creciendo contigo.')}
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {COMING.map(({ icon: Icon, tone, badge, title, desc }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-gray-200 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity group-hover:opacity-25 ${tone}`} />
                <div className="mb-5 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tone}`}>
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">{t(badge)}</span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-gray-900">{t(title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{t(desc)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  FAQ
// ═══════════════════════════════════════════════════════════════════════════

const FAQS = [
  ['¿Cuánto cuesta Eazy Stock?', 'Gratis hasta el {date} para quien se registra antes, sin tarjeta; después, {trial} gratis y el segundo mes al {apct} %. Hay tres planes: Basic (1 negocio, hasta 5 trabajadores), Pro (hasta 3 negocios y 20 trabajadores) y AI (todo lo de Pro, sin límites y con inteligencia artificial). Los primeros {n} negocios pagan la mitad los primeros {months} meses.'],
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

export function Faq({ head = true }) {
  const t = useT()
  const [openIdx, setOpenIdx] = useState(0)
  return (
    <section id="faq" className="scroll-mt-28 bg-gray-50 py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {head && (
          <Reveal>
            <SectionHead kicker={t('Preguntas frecuentes')} title={t('Lo que todos preguntan')} />
          </Reveal>
        )}
        <Reveal delay={100}>
          <div className="space-y-3">
            {FAQS.map(([q, a], i) => (
              <FaqItem key={q} q={t(q, promoVars(dateLocale()))} a={t(a, promoVars(dateLocale()))} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
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

export function CtaBanner() {
  const t = useT()
  const chips = [
    [Check,        'Sin tarjeta'],
    [CalendarClock,'Listo en una tarde'],
    [Languages,    'ES · EN · IT'],
    [Smartphone,   'Se instala como app'],
  ]
  return (
    <section className="relative overflow-hidden bg-[#0a0e1a] py-28 sm:py-36">
      <HeroBackdrop id="lpb-cta" paths={STREAMS_CTA} />

      {/* fichas flotantes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="lp-floaty absolute left-[8%] top-[22%] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{t('Venta registrada')}</p>
          <p className="mt-0.5 font-mono text-sm font-extrabold text-white">$ 45.50</p>
        </div>
        <div className="lp-floaty-slow absolute right-[9%] top-[28%] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">{t('Por vencer')}</p>
          <p className="mt-0.5 text-sm font-bold text-white">{t('2 productos · 30 días')}</p>
        </div>
        <div className="lp-floaty absolute bottom-[20%] left-[12%] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl backdrop-blur" style={{ animationDelay: '1.4s' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">{t('Fiado cobrado')}</p>
          <p className="mt-0.5 text-sm font-bold text-white">{t('Rosa · recordatorio enviado')}</p>
        </div>
        <div className="lp-floaty-slow absolute bottom-[18%] right-[10%] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl backdrop-blur" style={{ animationDelay: '2s' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">{t('Cierre de caja')}</p>
          <p className="mt-0.5 font-mono text-sm font-extrabold text-white">$ 2,580.50</p>
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <Reveal>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {trialLine(t, dateLocale())}
          </span>
          <h2 className="lp-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('Tu tienda, ordenada')}<br />
            <span className="text-slate-400">{t('desde esta tarde.')}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
            {t('Sube tu Excel, vende con el celular y cierra la caja sabiendo cuánto entró. Sin tarjeta, sin compromiso: si no te ordena la tienda, no nos debes nada.')}
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to={CTA} className="lp-btn-3d group relative inline-flex items-center gap-2 rounded-2xl px-9 py-4 text-base font-bold text-white">
              {t('Probar gratis')} <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to={LOGIN} className="lp-btn-3d-ghost inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-semibold text-white">
              {t('Ya tengo cuenta')}
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {chips.map(([Icon, label]) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                <Icon size={12} className="text-blue-300" /> {t(label)}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function Footer() {
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
              {t('Inventario, ventas y fiado para tiendas de cualquier tamaño, en cualquier país. Construido con clientes reales.')}
            </p>
            <div className="mt-4"><LangSwitcher compact className="!border-white/15 !bg-white/5 !text-slate-200 [&_select]:text-slate-200 [&_option]:text-gray-900" /></div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{t('Producto')}</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-slate-500 transition-colors hover:text-white">{t('Inicio')}</Link></li>
              {NAV.map((n) => (
                <li key={n.to}><Link to={n.to} className="text-slate-500 transition-colors hover:text-white">{t(n.label)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{t('Empezar')}</p>
            <ul className="space-y-2 text-sm">
              <li><Link to={CTA} className="text-slate-500 transition-colors hover:text-white">{t('Probar gratis')}</Link></li>
              <li><Link to="/planes" className="text-slate-500 transition-colors hover:text-white">{t('Planes y precios')}</Link></li>
              <li><Link to={LOGIN} className="text-slate-500 transition-colors hover:text-white">{t('Iniciar sesión')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{t('Soporte')}</p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>{t('Tutorial en cada pantalla')}</li>
              <li><a href="mailto:kontakt.eazylife@gmail.com" className="transition-colors hover:text-white">kontakt.eazylife@gmail.com</a></li>
              <li><a href="https://eazylifecompany.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-300 transition-colors hover:text-white">Eazy Life Company <ArrowRight size={12} /></a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 md:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Eazy Stock · {t('una app de')}{' '}
            <a href="https://eazylifecompany.com" target="_blank" rel="noreferrer" className="font-semibold text-slate-300 transition-colors hover:text-white">Eazy Life Company</a>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
            {/* Legales DE (15-oct-2026): obligatorios por § 5 DDG y DSGVO */}
            <Link to="/impressum" className="transition-colors hover:text-white">Impressum</Link>
            <Link to="/datenschutz" className="transition-colors hover:text-white">{t('Privacidad')}</Link>
            <span className="flex items-center gap-2 text-slate-600">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {t('Todos los sistemas operativos')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  Página
// ═══════════════════════════════════════════════════════════════════════════

// Inicio: cuatro tarjetas que llevan a cada parte de Funciones (en vez de las
// maquetas largas, que ahora viven en /funciones).
// Un día con Eazy Stock (20-oct-2026, Frank: «mejora el diseño, los iconos siempre centrados»):
// una LÍNEA DE TIEMPO del día de la tienda. El punto recorre las horas y la ficha de ese
// momento se enciende; con el mouse encima, manda la ficha señalada.
const DAY = [
  { time: '8:00',  icon: IcoScan,   to: '/funciones#vender',  title: 'Vende en segundos',          desc: 'Escaneas con la cámara del celular, cobras por cualquier medio y el stock se descuenta solo.' },
  { time: '12:30', icon: IcoLedger, to: '/funciones#fiado',   title: 'Controla el fiado',          desc: 'Límite por cliente, recordatorio por WhatsApp y estado de cuenta en PDF.' },
  { time: '17:00', icon: IcoTruck,  to: '/funciones#pedidos', title: 'Nunca te quedes sin stock',  desc: 'Alertas de stock mínimo y el pedido al proveedor en PDF, en dos clics.' },
  { time: '20:00', icon: IcoTill,   to: '/funciones#caja',    title: 'Cierra la caja sin dudas',   desc: 'Cuánto entró por cada medio de pago y cuánto efectivo debe haber en el cajón.' },
]
const DAY_STEP_MS = 3000

function Highlights() {
  const t = useT()
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(null)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const obs = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!running || hover !== null) return undefined
    const id = setInterval(() => setActive((a) => (a + 1) % DAY.length), DAY_STEP_MS)
    return () => clearInterval(id)
  }, [running, hover])
  const focus = hover ?? active
  const pct = (focus / (DAY.length - 1)) * 100
  return (
    <section id="un-dia" ref={ref} className="relative scroll-mt-20 overflow-hidden bg-[#0a0e1a] py-24">
      <HeroBackdrop id="lpb-day" paths={STREAMS_EDGES} />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHead dark kicker={t('Un día con Eazy Stock')} title={t('De la venta al cierre de caja, sin hojas sueltas')} />
        </Reveal>

        {/* la línea del día (escritorio) */}
        <Reveal className="mb-8 hidden px-[12.5%] lg:block">
          <div className="relative h-1 rounded-full bg-white/10">
            <div className="absolute inset-y-0 left-0 rounded-full bg-blue-400 transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
            {DAY.map((d, i) => (
              <span key={d.time} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(i / (DAY.length - 1)) * 100}%` }}>
                <span className={`block h-3 w-3 rounded-full ring-4 ring-[#0a0e1a] transition-colors ${i <= focus ? 'bg-blue-400' : 'bg-white/20'}`} />
              </span>
            ))}
            <span className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_6px_rgba(96,165,250,.35)] transition-[left] duration-700 ease-out" style={{ left: `${pct}%` }} />
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" onMouseLeave={() => setHover(null)}>
          {DAY.map(({ time, icon: Icon, to, title, desc }, i) => {
            const on = focus === i
            return (
              <Reveal key={to} delay={i * 80}>
                <Link
                  to={to}
                  onMouseEnter={() => setHover(i)}
                  className={`group flex h-full flex-col items-center rounded-3xl border p-6 text-center transition-all duration-500 ${
                    on ? '-translate-y-1.5 border-blue-400/60 bg-white/[0.09] shadow-2xl shadow-blue-900/40' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                  }`}
                >
                  <span className={`mb-4 rounded-full px-3 py-1 font-mono text-xs font-bold tracking-wider transition-colors ${on ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300'}`}>{time}</span>
                  <IconTile icon={Icon} size={56} light className={`transition-transform duration-500 ${on ? 'scale-110' : ''}`} />
                  <h3 className="lp-display mt-5 text-lg font-extrabold tracking-tight text-white">{t(title)}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{t(desc)}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-blue-300">
                    {t('Ver cómo funciona')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            )
          })}
        </div>
        <Reveal className="mt-12 text-center">
          <Link to="/funciones" className="lp-btn-3d group inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white">
            {t('Ver todas las funciones')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

// Cuenta regresiva de la promo (20-oct-2026, Frank: «donde dice precio, que muestre la marcha
// atrás del tiempo gratuito: días, horas, minutos y segundos»). Termina a medianoche de Lima.
function Countdown() {
  const t = useT()
  const end = new Date(`${PROMO_FREE_UNTIL}T00:00:00-05:00`).getTime()
  const [left, setLeft] = useState(() => end - Date.now())
  useEffect(() => {
    const id = setInterval(() => setLeft(end - Date.now()), 1000)
    return () => clearInterval(id)
  }, [end])
  if (left <= 0) return null
  const d = Math.floor(left / 86400000)
  const h = Math.floor(left / 3600000) % 24
  const m = Math.floor(left / 60000) % 60
  const sec = Math.floor(left / 1000) % 60
  const cells = [[d, 'días'], [h, 'horas'], [m, 'min'], [sec, 'seg']]
  return (
    <div className="mt-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{t('Lo gratis se acaba en')}</p>
      <div className="mt-2 flex gap-2">
        {cells.map(([v, label]) => (
          <div key={label} className="min-w-[3.8rem] rounded-xl border border-white/10 bg-white/[0.06] px-2 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.1)]">
            <p className="font-mono text-2xl font-extrabold tabular-nums text-white">{String(v).padStart(2, '0')}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t(label)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Inicio: los precios en una línea; el detalle vive en /planes.
function PricingTeaser() {
  const t = useT()
  // Selector de período (20-oct-2026, task 1015): precio por mes, total y ahorro de cada plan.
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const currency = siteCurrency()
  const per = periodOf(period)
  return (
    <section id="precios" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#0a0e1a] px-6 py-10 sm:px-10">
            <HeroBackdrop id="lpb-pr" paths={STREAMS_EDGES} fade={false} />
            <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:justify-between lg:text-left">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">{t('Precios')}</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{trialLine(t, dateLocale())}</h2>
                <p className="mt-2 max-w-md text-sm text-slate-400">{t('Después, un plan según el tamaño de tu negocio. Los primeros {n} negocios pagan la mitad los primeros {months} meses.', promoVars(dateLocale()))}</p>
                {promoActive() && <Countdown />}
              </div>
              <div className="flex flex-shrink-0 flex-col items-center gap-4 lg:items-end">
                <PeriodSelector period={period} onChange={setPeriod} dark compact />
                <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
                  {PLANS.map((p) => {
                    const save = savings(p, per.key, currency)
                    return (
                      <div key={p.key} className="relative rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-center sm:px-4">
                        <p className="text-xs font-bold text-slate-300">{p.name}</p>
                        <p className="mt-0.5 whitespace-nowrap text-lg font-extrabold text-white sm:text-xl">{fmtMoney(perMonth(p, per.key, currency), currency)}<span className="text-xs font-medium text-slate-400">{t('/mes')}</span></p>
                        {per.months > 1 ? (
                          <p className="mt-1 text-[11px] leading-tight text-slate-400">
                            {t('{total} por {unit}', { total: fmtMoney(periodPrice(p, per.key, currency), currency), unit: t(per.unit) })}
                            <br /><span className="font-bold text-emerald-400">{t('ahorras {amount}', { amount: fmtMoney(save.amount, currency) })}</span>
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] leading-tight text-slate-500">{t('cada mes')}</p>
                        )}
                        {p.comingSoon && <ComingSoonChip className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 text-[9px]" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="relative mt-8 flex justify-center lg:justify-start">
              <Link to="/planes" className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-900 hover:bg-gray-100">
                {t('Ver planes y precios')} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/**
 * Inicio (/) — corto: qué es y por qué te sirve. Desde el 25-sep-2026 la web
 * es multipágina (Frank: la landing de una sola página se veía amontonada):
 * Funciones, Para quién, Planes y Preguntas son páginas propias.
 */
export default function LandingPage() {
  useNoAppDarkMode()
  const t = useT()
  usePageSeo({
    title: t('Eazy Stock — Inventario, ventas y fiado para tu negocio'),
    description: t('Eazy Stock es el sistema de inventario, ventas y fiado para ferreterías, bodegas, farmacias y minimarkets. Escaneas, cobras con billetera digital o efectivo y al cierre sabes cuánto hay en caja. Gratis para empezar.'),
    path: '/',
  })
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingStyles />
      <Navbar />
      <Hero />
      <Marquee />
      <ForEveryBusiness />
      <Benefits teaser />
      <Highlights />
      <HowItWorks />
      <OriginStory />
      <PricingTeaser />
      <CtaBanner />
      <Footer />
    </div>
  )
}
