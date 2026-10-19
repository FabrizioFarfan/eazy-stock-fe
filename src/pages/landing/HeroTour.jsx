import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, Package, ArrowUpDown, ShoppingCart, BarChart2, Wallet, Users,
  Settings, ChevronDown, Plus, FileText, Scale, Trophy, ScanLine, Search,
  Banknote, Smartphone, CreditCard, Landmark, CheckCircle2, AlertTriangle,
  CalendarClock, UserX, ArrowRight, TrendingUp, Receipt, PackagePlus,
} from 'lucide-react'
import { useT } from '../../i18n'

// ═══════════════════════════════════════════════════════════════════════════
//  HeroTour — el producto en vivo, en bucle de 12 s (Frank, 20-oct-2026):
//  el cursor recorre el Dashboard, abre Ventas › Nueva Venta en el MENÚ REAL,
//  escanea tres productos, cobra, y luego abre Reportes › Balance y ve cuánto
//  ganó. Las fichas de al lado cambian según la pantalla y solo aparecen
//  cuando hay algo que decir. Con `prefers-reduced-motion` se queda quieto
//  en el Dashboard (también así lo captura el prerender).
// ═══════════════════════════════════════════════════════════════════════════

const W = 680
const H = 430
const LOOP = 12000

const INITIAL = { scene: 'dashboard', sales: false, reports: false, rows: 0, paid: false }

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Guion: [ms, acción]. Las posiciones del cursor se miden sobre el DOM real
// del mockup (data-tour), así nunca se desalinean si cambia el diseño.
const SCRIPT = [
  [300,   (a) => a.move('band')],
  [1600,  (a) => a.move('attention')],
  [2700,  (a) => a.move('ventas')],
  [3200,  (a) => { a.click(); a.set({ sales: true }) }],
  [3650,  (a) => a.move('nueva-venta')],
  [4050,  (a) => { a.click(); a.set({ scene: 'sale' }) }],
  [4400,  (a) => a.move('search')],
  [4700,  (a) => a.set({ rows: 1 })],
  [5200,  (a) => a.set({ rows: 2 })],
  [5700,  (a) => a.set({ rows: 3 })],
  [6300,  (a) => a.move('cobrar')],
  [6800,  (a) => { a.click(); a.set({ paid: true }) }],
  [7900,  (a) => a.move('reportes')],
  [8350,  (a) => { a.click(); a.set({ reports: true }) }],
  [8800,  (a) => a.move('balance')],
  [9200,  (a) => { a.click(); a.set({ scene: 'balance' }) }],
  [9700,  (a) => a.move('ganancia')],
]

export default function HeroTour() {
  const t = useT()
  const rootRef = useRef(null)
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [active, setActive] = useState(false)
  const [state, setState] = useState(INITIAL)
  const [cursor, setCursor] = useState({ x: W * 0.6, y: H * 0.55, clicks: 0, shown: false })
  const still = reduced()

  // Escala el mockup (ancho fijo W) al ancho disponible.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / W)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Solo corre cuando se ve (y la pestaña está activa).
  useEffect(() => {
    const el = rootRef.current
    if (!el || still) return undefined
    const obs = new IntersectionObserver(([e]) => setActive(e.isIntersecting && !document.hidden), { threshold: 0.3 })
    obs.observe(el)
    const onVis = () => { if (document.hidden) setActive(false) }
    document.addEventListener('visibilitychange', onVis)
    return () => { obs.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [still])

  useEffect(() => {
    if (!active || still) return undefined
    let timers = []
    const api = {
      set: (patch) => setState((s) => ({ ...s, ...patch })),
      move: (target) => {
        const root = rootRef.current
        const el = root?.querySelector(`[data-tour="${target}"]`)
        if (!root || !el) return
        const r = root.getBoundingClientRect()
        const b = el.getBoundingClientRect()
        const sc = r.width / W || 1
        setCursor((c) => ({ ...c, shown: true, x: (b.left - r.left + b.width / 2) / sc, y: (b.top - r.top + b.height / 2) / sc }))
      },
      click: () => setCursor((c) => ({ ...c, clicks: c.clicks + 1 })),
    }
    const run = () => {
      setState(INITIAL)
      SCRIPT.forEach(([at, fn]) => timers.push(setTimeout(() => fn(api), at)))
      timers.push(setTimeout(run, LOOP))
    }
    run()
    return () => { timers.forEach(clearTimeout); timers = [] }
  }, [active, still])

  const { scene, sales, reports, rows, paid } = state

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height: H * scale }}>
      <div
        ref={rootRef}
        className="absolute left-0 top-0"
        style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-blue-500/20 blur-3xl" />

        {/* La ventana */}
        <div className="relative flex h-full overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,.7)]">
          <Sidebar t={t} scene={scene} sales={sales} reports={reports} />
          <div className="relative min-w-0 flex-1 overflow-hidden bg-gray-50">
            <Topbar t={t} scene={scene} />
            <div key={scene} className="lp-fade lp-in h-[calc(100%-40px)] overflow-hidden p-4">
              {scene === 'dashboard' && <Dashboard t={t} />}
              {scene === 'sale' && <NewSale t={t} rows={rows} paid={paid} />}
              {scene === 'balance' && <Balance t={t} />}
            </div>
          </div>
        </div>

        {/* Cursor */}
        {!still && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-20"
            style={{
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
              transition: 'transform .75s cubic-bezier(.3,.7,.25,1), opacity .4s',
              opacity: cursor.shown ? 1 : 0,
            }}
          >
            <span key={cursor.clicks} className={`absolute -left-3 -top-3 h-6 w-6 rounded-full border-2 border-blue-500 ${cursor.clicks ? 'lp-click' : 'opacity-0'}`} />
            <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-[0_2px_4px_rgba(0,0,0,.45)]">
              <path d="M5 3l14 8.5-6.2 1.3L16 20l-2.6 1.2-3.2-7.3L5 18z" fill="#fff" stroke="#0a0e1a" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Fichas dinámicas: solo cuando hay algo que decir */}
        <Card show={scene === 'dashboard'} pos="tl" icon={TrendingUp} tone="text-emerald-600 bg-emerald-50"
          title={t('Hoy vs ayer')} body={`+18 % · S/ 2,580.50`} />
        <Card show={scene === 'dashboard'} pos="br" icon={AlertTriangle} tone="text-amber-600 bg-amber-50"
          title={t('Pide tu atención')} body={t('3 con stock bajo · 2 por vencer')} />

        <Card show={scene === 'sale' && rows > 0 && !paid} pos="tl" icon={ScanLine} tone="text-blue-600 bg-blue-50"
          title={t('Escaneado con la cámara')} body={t('{n} productos en el carrito', { n: rows })} />
        <Card show={scene === 'sale' && paid} pos="br" icon={CheckCircle2} tone="text-emerald-600 bg-emerald-50"
          title={t('Venta registrada')} body={`S/ 115.00 · Yape — ${t('stock actualizado')}`} />

        <Card show={scene === 'balance'} pos="tl" icon={Scale} tone="text-emerald-600 bg-emerald-50"
          title={t('Ganancia del mes')} body="S/ 9,840.00" />
        <Card show={scene === 'balance'} pos="br" icon={Banknote} tone="text-blue-600 bg-blue-50"
          title={t('Debe haber en caja')} body={`S/ 1,180.00 ${t('en efectivo')}`} />
      </div>
    </div>
  )
}

// ── Fichas flotantes con entrada/salida suave ───────────────────────────────

function Card({ show, pos, icon: Icon, tone, title, body }) {
  const place = pos === 'tl' ? '-left-5 -top-6' : '-right-4 bottom-8'
  return (
    <div
      aria-hidden={!show}
      className={`absolute z-10 w-[215px] rounded-xl border border-gray-200 bg-white p-3 shadow-[0_18px_40px_-12px_rgba(0,0,0,.6)] transition-all duration-500 ease-out ${place} ${
        show ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-3 scale-95 opacity-0'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-gray-900">{title}</p>
          <p className="mt-0.5 truncate text-[11px] text-gray-500">{body}</p>
        </div>
      </div>
    </div>
  )
}

// ── El menú lateral REAL de la app (layouts/Sidebar.jsx), en miniatura ──────

function Item({ icon: Icon, label, active, tour, child = false }) {
  return (
    <div data-tour={tour} className={`flex items-center gap-2 rounded-lg px-2.5 py-[5px] text-[10.5px] transition-colors ${
      child ? 'ml-4 border-l-2 border-gray-200 pl-2' : ''
    } ${active ? 'bg-blue-600 font-semibold text-white' : 'font-medium text-gray-600'}`}>
      <Icon size={child ? 11 : 12} strokeWidth={1.8} />{label}
    </div>
  )
}

function Group({ icon: Icon, label, open, here, tour, count, children }) {
  return (
    <div>
      <div data-tour={tour} className={`flex items-center gap-2 rounded-lg px-2.5 py-[5px] text-[10.5px] transition-colors ${
        here ? 'bg-blue-50 font-semibold text-blue-700' : 'font-medium text-gray-600'
      }`}>
        <Icon size={12} strokeWidth={1.8} />
        <span className="flex-1">{label}</span>
        <span className={`rounded-full px-1 text-[8px] font-bold ${here ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>{count}</span>
        <ChevronDown size={11} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && <div className="mt-0.5 space-y-0.5">{children}</div>}
    </div>
  )
}

function Sidebar({ t, scene, sales, reports }) {
  return (
    <aside className="flex w-[150px] flex-shrink-0 flex-col border-r border-gray-200 bg-gray-100/80">
      <div className="flex items-center gap-2 px-3 py-3">
        <img src="/logo.png" alt="" className="h-6 w-6 rounded-md object-contain" />
        <span className="text-[12px] font-bold tracking-tight text-gray-900">Eazy Stock</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        <Item icon={LayoutDashboard} label={t('Dashboard')} active={scene === 'dashboard'} />
        <Item icon={Package} label={t('Productos')} />
        <Item icon={ArrowUpDown} label={t('Stock')} />
        <Group icon={ShoppingCart} label={t('Ventas')} open={sales} here={scene === 'sale'} tour="ventas" count={3}>
          <Item child icon={ShoppingCart} label={t('Historial de ventas')} />
          <Item child icon={Plus} label={t('Nueva Venta')} active={scene === 'sale'} tour="nueva-venta" />
          <Item child icon={FileText} label={t('Cotización')} />
        </Group>
        <Group icon={BarChart2} label={t('Reportes')} open={reports} here={scene === 'balance'} tour="reportes" count={6}>
          <Item child icon={BarChart2} label={t('Reportes')} />
          <Item child icon={Scale} label={t('Balance')} active={scene === 'balance'} tour="balance" />
          <Item child icon={Trophy} label={t('Vendedores')} />
        </Group>
        {!(sales && reports) && <Item icon={Wallet} label={t('Clientes y proveedores')} />}
        {!sales && !reports && <Item icon={Users} label={t('Empleados')} />}
        {!sales && !reports && <Item icon={Settings} label={t('Ajustes')} />}
      </nav>
      <div className="flex items-center gap-2 border-t border-gray-200 px-3 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">R</div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold text-gray-800">Rosa Quispe</p>
          <p className="text-[8.5px] text-gray-400">{t('Dueña')}</p>
        </div>
      </div>
    </aside>
  )
}

function Topbar({ t, scene }) {
  const title = scene === 'dashboard' ? t('Dashboard') : scene === 'sale' ? t('Nueva venta') : t('Balance')
  return (
    <div className="flex h-10 items-center justify-between border-b border-gray-200 bg-white px-4">
      <p className="text-[11px] font-bold text-gray-900">{title}</p>
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500">Ferretería San Martín</span>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> {t('En vivo')}
        </span>
      </div>
    </div>
  )
}

// ── Pantallas ───────────────────────────────────────────────────────────────

function Panel({ title, icon: Icon, tone = 'bg-gray-100 text-gray-600', children, className = '', tour }) {
  return (
    <div data-tour={tour} className={`rounded-xl border border-gray-200 bg-white p-3 ${className}`}>
      <div className="mb-2 flex items-center gap-1.5">
        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${tone}`}><Icon size={11} /></span>
        <p className="text-[10px] font-bold text-gray-800">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Dashboard({ t }) {
  return (
    <div className="grid h-full grid-cols-5 content-start gap-3">
      <div data-tour="band" className="relative col-span-3 overflow-hidden rounded-xl bg-blue-600 p-3.5 text-white">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <p className="text-[9px] font-semibold uppercase tracking-widest text-white/80">{t('Ingresos de hoy')}</p>
        <p className="mt-0.5 text-2xl font-extrabold tracking-tight">S/ 2,580.50</p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/90">
          <span className="rounded bg-white/20 px-1 font-bold">+18 %</span> {t('vs ayer ({v})', { v: 'S/ 2,186.00' })}
        </p>
        <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-white/20 pt-2 text-[9px]">
          {[[t('Ventas'), '18'], [t('Ticket promedio'), 'S/ 143.36'], [t('Unidades'), '62']].map(([l, v]) => (
            <div key={l}><p className="text-white/70">{l}</p><p className="font-bold">{v}</p></div>
          ))}
        </div>
      </div>
      <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-3">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">{t('Este mes')} · {t('octubre')}</p>
        <p className="mt-0.5 text-lg font-extrabold text-gray-900">S/ 41,200</p>
        <p className="text-[9px] text-gray-400">{t('vendido en {n} ventas', { n: 312 })}</p>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-2 py-1">
          <span className="text-[9px] text-gray-600">{t('Ganancia')}</span>
          <span className="text-[11px] font-extrabold text-emerald-600">S/ 9,840</span>
        </div>
      </div>

      <Panel tour="attention" title={t('Pide tu atención')} icon={AlertTriangle} tone="bg-amber-50 text-amber-600" className="col-span-2">
        {[
          [AlertTriangle, '3', t('productos con stock bajo'), 'bg-red-50 text-red-600'],
          [CalendarClock, '2', t('productos por vencer'), 'bg-amber-50 text-amber-600'],
          [UserX, '4', t('clientes sin volver +30 días'), 'bg-indigo-50 text-indigo-600'],
        ].map(([Icon, n, l, c]) => (
          <div key={l} className="flex items-center gap-2 py-1 text-[9.5px] text-gray-600">
            <span className={`flex h-5 w-5 items-center justify-center rounded-md ${c}`}><Icon size={10} /></span>
            <span className="font-bold text-gray-900">{n}</span> {l}
          </div>
        ))}
      </Panel>
      <div className="col-span-3 flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          {[[ShoppingCart, t('Nueva venta'), 'bg-blue-600 text-white'], [Receipt, t('Cotización'), 'bg-white text-gray-700 border border-gray-200'], [PackagePlus, t('Entrada de mercadería'), 'bg-white text-gray-700 border border-gray-200']].map(([Icon, l, c]) => (
            <div key={l} className={`flex flex-col rounded-xl p-2.5 ${c}`}>
              <Icon size={14} />
              <p className="mt-2 text-[9.5px] font-bold leading-tight">{l}</p>
            </div>
          ))}
        </div>
        <Panel title={t('Stock bajo')} icon={AlertTriangle} tone="bg-red-50 text-red-600" className="flex-1">
          {[['Pegamento PVC 1/4 gal', 3, 10], ['Clavos 2" (kg)', 4, 15], ['Cinta aislante', 6, 12]].map(([n, q, min]) => (
            <div key={n} className="flex items-center gap-2 py-[3px] text-[9.5px]">
              <span className="w-[46%] truncate text-gray-700">{n}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="lp-bar h-full rounded-full bg-red-400" style={{ width: `${Math.round((q / min) * 100)}%` }} />
              </div>
              <span className="w-10 text-right font-mono text-gray-500">{q}/{min}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

const CART = [
  { name: 'Cemento Sol', qty: '2 bolsa', price: 'S/ 55.00' },
  { name: 'Cable THW 14 AWG', qty: '25 metro', price: 'S/ 47.50' },
  { name: 'Pegamento PVC 1/4 gal', qty: '1 unidad', price: 'S/ 12.50' },
]

function NewSale({ t, rows, paid }) {
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-3 flex flex-col">
        <div data-tour="search" className="flex h-8 items-center gap-2 rounded-lg border border-blue-300 bg-white px-2.5 text-[10px] text-gray-400 ring-2 ring-blue-100">
          <ScanLine size={12} className="text-blue-600" />
          {rows < 3 ? <span>{t('Buscar o escanear con la cámara…')}<span className="lp-blink">|</span></span> : <span className="text-gray-700">{t('Listo para cobrar')}</span>}
          <Search size={11} className="ml-auto" />
        </div>
        <div className="mt-2 flex-1 rounded-xl border border-gray-200 bg-white p-2.5">
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-gray-400">{t('Carrito')} · {rows}</p>
          {CART.slice(0, rows).map((r) => (
            <div key={r.name} className="lp-pop flex items-center justify-between border-b border-gray-100 py-1.5 text-[10px]" style={{ animationDelay: '0ms' }}>
              <div><p className="font-semibold text-gray-900">{r.name}</p><p className="text-[9px] text-gray-400">{r.qty}</p></div>
              <span className="font-mono font-bold text-gray-800">{r.price}</span>
            </div>
          ))}
          {rows === 0 && <p className="py-6 text-center text-[10px] text-gray-400">{t('Escanea o busca un producto')}</p>}
        </div>
      </div>
      <div className="col-span-2 flex flex-col rounded-xl border border-gray-200 bg-white p-3">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">{t('Total')}</p>
        <p className="text-xl font-extrabold text-gray-900">S/ {rows === 0 ? '0.00' : rows === 1 ? '55.00' : rows === 2 ? '102.50' : '115.00'}</p>
        <p className="mt-2 text-[9px] font-semibold text-gray-500">{t('Medio de pago')}</p>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {[[Banknote, 'Efectivo'], [Smartphone, 'Yape', true], [CreditCard, 'Tarjeta'], [Landmark, 'Transferencia']].map(([Icon, l, on]) => (
            <span key={l} className={`flex items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] font-semibold ${on ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
              <Icon size={10} />{l}
            </span>
          ))}
        </div>
        <div className="mt-auto">
          {paid ? (
            <div className="lp-pop flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 size={13} /> {t('Venta registrada')}
            </div>
          ) : (
            <div data-tour="cobrar" className={`flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-[11px] font-bold text-white transition-opacity ${rows === 3 ? 'opacity-100' : 'opacity-40'}`}>
              {t('Cobrar')} S/ 115.00 <ArrowRight size={12} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CASH = [
  ['Efectivo', 'S/ 1,180.00', 100, 'bg-emerald-500', Banknote],
  ['Yape', 'S/ 820.00', 69, 'bg-violet-500', Smartphone],
  ['Tarjeta', 'S/ 200.50', 17, 'bg-amber-500', CreditCard],
  ['Transferencia', 'S/ 150.00', 13, 'bg-blue-500', Landmark],
]

function Balance({ t }) {
  return (
    <div className="lp-in grid h-full grid-cols-5 gap-3">
      <div className="col-span-5 flex items-center gap-1.5">
        {[t('Hoy'), t('Esta semana'), t('Este mes'), t('Este año')].map((p, i) => (
          <span key={p} className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold ${i === 2 ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-500'}`}>{p}</span>
        ))}
      </div>
      <Panel title={t('Cierre de caja')} icon={Wallet} tone="bg-blue-50 text-blue-600" className="col-span-3">
        {CASH.map(([l, v, pct, c, Icon], i) => (
          <div key={l} className="mb-1.5">
            <div className="flex items-center justify-between text-[9.5px]">
              <span className="flex items-center gap-1 text-gray-600"><Icon size={10} />{l}</span>
              <span className="font-mono font-bold text-gray-900">{v}</span>
            </div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className={`lp-bar h-full rounded-full ${c}`} style={{ width: `${pct}%`, animationDelay: `${150 + i * 120}ms` }} />
            </div>
          </div>
        ))}
        <p className="mt-1 border-t border-gray-100 pt-1.5 text-[9.5px] text-gray-500">{t('Debe haber en caja')}: <b className="text-gray-900">S/ 1,180.00</b></p>
      </Panel>
      <Panel tour="ganancia" title={t('Balance de ventas')} icon={Scale} tone="bg-emerald-50 text-emerald-600" className="col-span-2">
        {[[t('Ventas brutas'), 'S/ 41,200', ''], [t('Descuentos'), '− S/ 310', ''], [t('Costo del producto'), '− S/ 31,050', '']].map(([l, v]) => (
          <div key={l} className="flex items-center justify-between py-0.5 text-[9.5px] text-gray-600"><span>{l}</span><span className="font-mono text-gray-800">{v}</span></div>
        ))}
        <div className="mt-1.5 rounded-lg bg-emerald-50 px-2 py-1.5">
          <p className="text-[8.5px] font-semibold uppercase tracking-widest text-emerald-700">{t('Ganancia')}</p>
          <p className="text-base font-extrabold text-emerald-600">S/ 9,840.00</p>
        </div>
      </Panel>
    </div>
  )
}
